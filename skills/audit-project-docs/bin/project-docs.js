"use strict";
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const TYPES = new Set(['data', 'interface', 'logic', 'guide', 'agent', 'decision', 'domain', 'structure', 'issue']);
const KEYS = ['type', 'title', 'description', 'tags', 'timestamp'];
const TEMPLATES = {
    interface: ['Purpose', 'Components', 'Relationships', 'Source References'],
    logic: ['Purpose', 'Components', 'Relationships', 'Source References'],
    data: ['Purpose', 'Fields', 'Relationships', 'Constraints', 'Indexes', 'Source References'],
    guide: ['Purpose', 'Responsibilities', 'Prerequisites', 'Workflows', 'Verification', 'Troubleshooting', 'Related Documentation'],
    agent: ['Identity', 'Scope', 'Responsibilities', 'Documentation Navigation', 'Documentation Maintenance', 'Constraints', 'Related Documentation'],
    decision: ['Status', 'Context', 'Decision', 'Alternatives Considered', 'Consequences', 'Related Documentation'],
    domain: ['Scope', 'Domains', 'Terms', 'Cross-Domain Terms', 'Relationships'],
    structure: [],
    issue: ['Status', 'Problem', 'Acceptance Criteria', 'Notes', 'Related Documentation'],
};
const TABLES = {
    data: {
        Fields: '| Field | Type | Required | Description |',
        Constraints: '| Name | Type | Definition |',
        Indexes: '| Name | Fields | Definition |',
    },
    domain: {
        Domains: '| Domain | Definition | Boundaries |',
        Terms: '| Term | Domain | Definition |',
    },
    structure: { body: '| Path | Kind | Description |' },
};
function scalar(value) {
    const trimmed = value.trim();
    if (!trimmed || /^(?:[|>{}\[\]&*!?%@`]|---|\.\.\.)/.test(trimmed) || /\s+#/.test(trimmed))
        return null;
    const singleQuoted = trimmed.startsWith("'") || trimmed.endsWith("'");
    const doubleQuoted = trimmed.startsWith('"') || trimmed.endsWith('"');
    if (singleQuoted || doubleQuoted) {
        const quote = trimmed[0];
        if (trimmed.length < 3 || trimmed.at(-1) !== quote || !["'", '"'].includes(quote))
            return null;
        const inner = trimmed.slice(1, -1);
        if ((quote === "'" && inner.includes("'")) || (quote === '"' && /["\\]/.test(inner)))
            return null;
        return inner;
    }
    if (/:\s/.test(trimmed))
        return null;
    return trimmed;
}
function parseFrontmatter(text, rel, diagnostics) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    if (lines[0] !== '---') {
        diagnostics.push({ level: 'error', path: rel, message: 'missing frontmatter' });
        return null;
    }
    const end = lines.indexOf('---', 1);
    if (end < 0) {
        diagnostics.push({ level: 'error', path: rel, message: 'unterminated frontmatter' });
        return null;
    }
    const metadata = {};
    for (let index = 1; index < end; index += 1) {
        const line = lines[index];
        const match = /^([a-z]+):(.*)$/.exec(line);
        if (!match) {
            diagnostics.push({ level: 'error', path: rel, message: `unsupported frontmatter syntax on line ${index + 1}` });
            continue;
        }
        const key = match[1];
        if (!KEYS.includes(key)) {
            diagnostics.push({ level: 'error', path: rel, message: `unknown frontmatter key "${key}"` });
            continue;
        }
        if (key in metadata) {
            diagnostics.push({ level: 'error', path: rel, message: `duplicate frontmatter key "${key}"` });
            continue;
        }
        if (key === 'tags') {
            const rest = match[2].trim();
            if (rest === '[]') {
                metadata.tags = [];
            }
            else if (rest === '') {
                const tags = [];
                while (index + 1 < end && /^  - /.test(lines[index + 1])) {
                    index += 1;
                    const tag = scalar(lines[index].slice(4));
                    if (tag === null)
                        diagnostics.push({ level: 'error', path: rel, message: 'invalid tag' });
                    else
                        tags.push(tag.trim());
                }
                if (tags.length === 0)
                    diagnostics.push({ level: 'error', path: rel, message: 'tags must be a block list or []' });
                metadata.tags = tags;
            }
            else {
                diagnostics.push({ level: 'error', path: rel, message: 'tags must be a block list or []' });
            }
            continue;
        }
        const value = scalar(match[2]);
        if (value === null)
            diagnostics.push({ level: 'error', path: rel, message: `invalid scalar for "${key}"` });
        else
            metadata[key] = value;
    }
    for (const key of KEYS) {
        if (!(key in metadata))
            diagnostics.push({ level: 'error', path: rel, message: `missing frontmatter key "${key}"` });
    }
    return { metadata, body: lines.slice(end + 1).join('\n') };
}
function markdownLines(body) {
    return maskFencedMarkdown(body).split('\n');
}
function sections(lines) {
    const headings = [];
    const bodies = {};
    let current = null;
    for (const line of lines) {
        const heading = /^# ([^#].*)$/.exec(line)?.[1]?.trim();
        if (heading) {
            headings.push(heading);
            current = heading;
            bodies[current] = [];
        }
        else if (current) {
            bodies[current].push(line);
        }
    }
    return { headings, bodies };
}
function substantive(lines) {
    return lines.some((line) => line.trim() && !/^#{2,6}\s/.test(line));
}
function externalTarget(target) {
    if (/^[a-z]:[\\/]/i.test(target))
        return false;
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target);
}
function validExternalUrl(target) {
    try {
        new URL(target.startsWith('//') ? `https:${target}` : target);
        return true;
    }
    catch {
        return false;
    }
}
function safeCredentialValue(value) {
    const unquoted = value.trim().replace(/^([`'\"])(.*)\1$/, '$2').trim();
    return /^(?:\[REDACTED\]|REDACTED|<[^>]*(?:secret|token|password|redacted)[^>]*>|\*{3,}|x{3,}|\$\{[A-Z_][A-Z0-9_]*\}|\$[A-Z_][A-Z0-9_]*|%[A-Z_][A-Z0-9_]*%|(?:process\.env|env)\.[A-Z_][A-Z0-9_]*)$/i.test(unquoted);
}
function validateSecrets(rel, text, diagnostics) {
    if (/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(text)) {
        diagnostics.push({ level: 'error', path: rel, message: 'private key material detected' });
    }
    const assignment = /^\s*(?:[-*]\s*)?(?:export\s+)?[`'\"]?([a-z][a-z0-9_-]*)[`'\"]?\s*[:=]\s*(.+?)\s*$/gim;
    for (const match of text.matchAll(assignment)) {
        const credentialName = /(?:^|[_-])(?:password|passwd|pwd|token|secret)(?:$|[_-])|(?:^|[_-])api[_-]?key(?:$|[_-])/i.test(match[1]);
        if (credentialName && !safeCredentialValue(match[2]))
            diagnostics.push({ level: 'error', path: rel, message: `possible credential assignment to ${match[1]}` });
    }
}
function validateTarget(root, file, rel, target, diagnostics, allowDirectory = false) {
    if (!target || target.startsWith('#'))
        return;
    if (target.includes('\\')) {
        diagnostics.push({ level: 'error', path: rel, message: `Windows path separator in link "${target}"` });
        return;
    }
    if (externalTarget(target)) {
        if (!validExternalUrl(target))
            diagnostics.push({ level: 'error', path: rel, message: `invalid external URL "${target}"` });
        return;
    }
    if (target.startsWith('/')) {
        diagnostics.push({ level: 'error', path: rel, message: `internal link must be relative "${target}"` });
        return;
    }
    let pathname;
    try {
        pathname = decodeURIComponent(target.split('#', 1)[0].split('?', 1)[0]);
    }
    catch {
        diagnostics.push({ level: 'error', path: rel, message: `invalid internal link "${target}"` });
        return;
    }
    if (!pathname)
        return;
    const resolved = path.resolve(path.dirname(file), pathname);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
        diagnostics.push({ level: 'error', path: rel, message: `repository-escaping internal link "${target}"` });
    }
    else if (!fs.existsSync(resolved)) {
        diagnostics.push({ level: 'error', path: rel, message: `broken internal link "${target}"` });
    }
    else {
        const realRoot = fs.realpathSync(root);
        const realTarget = fs.realpathSync(resolved);
        if (realTarget !== realRoot && !realTarget.startsWith(`${realRoot}${path.sep}`)) {
            diagnostics.push({ level: 'error', path: rel, message: `repository-escaping internal link "${target}"` });
        }
        else if (!allowDirectory && fs.statSync(resolved).isDirectory()) {
            diagnostics.push({ level: 'error', path: rel, message: `internal link target must be a file "${target}"` });
        }
    }
}
function validateLinks(root, file, rel, text, diagnostics) {
    const lines = markdownLines(text);
    let section = '';
    const inline = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g;
    for (const line of lines) {
        if (/^#\s+/.test(line))
            section = line.replace(/^#\s+/, '').trim();
        const definition = /^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/.exec(line);
        if (definition) {
            const target = definition[2] || definition[3];
            if (target.includes('\\'))
                diagnostics.push({ level: 'error', path: rel, message: `Windows path separator in link "${target}"` });
            if (!externalTarget(target)) {
                diagnostics.push({ level: 'error', path: rel, message: `internal reference-style link "${target}"` });
            }
            else if (!validExternalUrl(target)) {
                diagnostics.push({ level: 'error', path: rel, message: `invalid external URL "${target}"` });
            }
        }
        for (const match of line.matchAll(inline))
            validateTarget(root, file, rel, match[1] || match[2], diagnostics, section === 'Source References');
    }
}
function validateAssetText(root, file, rel, text, diagnostics) {
    const targets = [];
    for (const match of text.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi))
        targets.push(match[1]);
    for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi))
        targets.push(match[1]);
    for (const target of targets)
        validateTarget(root, file, rel, target, diagnostics);
}
function validateAssetLinks(root, file, rel, diagnostics) {
    if (!/\.(?:css|html?|svg|xml)$/i.test(rel))
        return;
    try {
        validateAssetText(root, file, rel, new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file)), diagnostics);
    }
    catch {
        return;
    }
}
function normalizedHeader(line) {
    return line.trim().replace(/\s*\|\s*/g, ' | ').replace(/^\s*/, '').replace(/\s*$/, '');
}
function tableCells(line) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|'))
        return null;
    const cells = [''];
    let escaped = false;
    for (const character of trimmed.slice(1, -1)) {
        if (character === '|' && !escaped)
            cells.push('');
        else
            cells[cells.length - 1] += character;
        escaped = character === '\\' ? !escaped : false;
    }
    return cells.map((cell) => cell.trim());
}
function validateTable(kind, section, lines, rel, diagnostics) {
    const content = lines.map((line) => line.trim()).filter(Boolean);
    if (content.length === 1 && content[0] === 'None')
        return;
    const expected = TABLES[kind]?.[section];
    const expectedColumns = expected ? tableCells(expected)?.length : 0;
    const rows = content.map(tableCells);
    const separator = rows[1];
    const validRows = rows.every((row) => row !== null && row.length === expectedColumns);
    const validSeparator = separator != null && separator.every((cell) => /^:?-{3,}:?$/.test(cell));
    const permitsEmpty = kind === 'structure';
    if (!expected || normalizedHeader(content[0] || '') !== expected || !validRows || !validSeparator || (!permitsEmpty && content.length < 3)) {
        diagnostics.push({ level: 'error', path: rel, message: `invalid ${section} table` });
    }
}
function validateSourceReferences(root, file, rel, lines, diagnostics) {
    const content = lines.map((line) => line.trim()).filter(Boolean);
    if (content.length === 1 && content[0] === 'None')
        return;
    const rows = content.map(tableCells);
    const header = '| Path | Component | Description |';
    const separator = rows[1];
    if (normalizedHeader(content[0] || '') !== header || rows.some((row) => row === null || row.length !== 3)
        || !separator?.every((cell) => /^:?-{3,}:?$/.test(cell)) || content.length < 3) {
        diagnostics.push({ level: 'error', path: rel, message: 'invalid Source References table' });
        return;
    }
    for (const row of rows.slice(2)) {
        const reference = /^\[`([^`]+)`\]\(([^)\s]+)\)$/.exec(row[0]);
        if (!reference) {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid Source References path cell' });
            continue;
        }
        const [, display, target] = reference;
        const lineNumber = /(?:#L?\d+(?:-L?\d+)?|:\d+(?::\d+)?)$/i;
        const hasLineNumber = lineNumber.test(display) || lineNumber.test(target);
        const invalidDisplay = display.startsWith('/') || display.includes('\\') || display.split('/').some((part) => part === '.' || part === '..');
        const invalidTarget = target.startsWith('/') || target.includes('\\') || externalTarget(target);
        let targetName;
        try {
            targetName = decodeURIComponent(target.split(/[?#]/, 1)[0]);
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid Source References repository path' });
            continue;
        }
        const displayPath = path.resolve(root, display.replace(/\/$/, ''));
        const targetPath = path.resolve(path.dirname(file), targetName.replace(/\/$/, ''));
        const inside = (candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);
        if (hasLineNumber) {
            diagnostics.push({ level: 'error', path: rel, message: 'Source References must not include line numbers' });
        }
        else if (invalidDisplay || invalidTarget || !inside(displayPath) || !inside(targetPath)) {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid Source References repository path' });
        }
        else if (displayPath !== targetPath) {
            diagnostics.push({ level: 'error', path: rel, message: 'Source References display and target must resolve to the same repository path' });
        }
        else if (!fs.existsSync(displayPath)) {
            diagnostics.push({ level: 'error', path: rel, message: `missing Source References path "${display}"` });
        }
        else if (![displayPath, targetPath].every((candidate) => {
            const realRoot = fs.realpathSync(root);
            const real = fs.realpathSync(candidate);
            return real === realRoot || real.startsWith(`${realRoot}${path.sep}`);
        })) {
            diagnostics.push({ level: 'error', path: rel, message: 'repository-escaping Source References path' });
        }
        else if (fs.statSync(displayPath).isDirectory() && !display.endsWith('/')) {
            diagnostics.push({ level: 'error', path: rel, message: 'Source References directory label must end with /' });
        }
        if (!/^`[^`]+`$/.test(row[1]))
            diagnostics.push({ level: 'error', path: rel, message: 'Source References component must be named' });
        if (!row[2] || row[2] === 'None')
            diagnostics.push({ level: 'error', path: rel, message: 'Source References description must be substantive' });
    }
}
function validateDocument(rel, parsed, diagnostics) {
    const metadata = parsed.metadata;
    const kind = typeof metadata.type === 'string' ? metadata.type : '';
    if (!TYPES.has(kind))
        diagnostics.push({ level: 'error', path: rel, message: `invalid document type "${kind}"` });
    for (const key of ['title', 'description']) {
        if (typeof metadata[key] !== 'string' || !metadata[key])
            diagnostics.push({ level: 'error', path: rel, message: `empty "${key}"` });
    }
    const timestamp = typeof metadata.timestamp === 'string' ? metadata.timestamp : '';
    const instant = Date.parse(timestamp);
    const canonicalInstant = timestamp ? timestamp.replace(/Z$/, '.000Z') : '';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp) || Number.isNaN(instant) || new Date(instant).toISOString() !== canonicalInstant) {
        diagnostics.push({ level: 'error', path: rel, message: `invalid timestamp "${timestamp}"` });
    }
    const base = path.posix.basename(rel);
    const numbered = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
    const ordinary = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
    const canonical = (rel === 'docs/DOMAIN.md' && kind === 'domain') || (rel === 'docs/app/STRUCTURE.md' && kind === 'structure');
    if (!canonical && ((kind === 'decision' || kind === 'issue') ? !numbered.test(base) : !ordinary.test(base))) {
        diagnostics.push({ level: 'error', path: rel, message: 'invalid filename' });
    }
    if (kind === 'domain' && rel !== 'docs/DOMAIN.md')
        diagnostics.push({ level: 'error', path: rel, message: 'domain document must be docs/DOMAIN.md' });
    if (kind === 'structure' && rel !== 'docs/app/STRUCTURE.md')
        diagnostics.push({ level: 'error', path: rel, message: 'structure document must be docs/app/STRUCTURE.md' });
    const lines = markdownLines(parsed.body);
    const found = sections(lines);
    const expected = TEMPLATES[kind] || [];
    if (JSON.stringify(found.headings) !== JSON.stringify(expected)) {
        diagnostics.push({ level: 'error', path: rel, message: `expected H1 sequence: ${expected.length ? expected.join(', ') : 'none'}` });
    }
    for (const heading of expected) {
        if (!substantive(found.bodies[heading] || []))
            diagnostics.push({ level: 'error', path: rel, message: `empty section "${heading}"` });
    }
    if (kind === 'interface' || kind === 'logic') {
        for (const heading of ['Within This Category', 'Across Categories']) {
            if (!(found.bodies.Relationships || []).some((line) => line.trim() === `## ${heading}`))
                diagnostics.push({ level: 'error', path: rel, message: `missing H2 "${heading}"` });
        }
    }
    if (kind === 'data') {
        for (const heading of ['Within Data', 'Across Categories']) {
            if (!(found.bodies.Relationships || []).some((line) => line.trim() === `## ${heading}`))
                diagnostics.push({ level: 'error', path: rel, message: `missing H2 "${heading}"` });
        }
    }
    if (kind === 'issue' && !(found.bodies['Acceptance Criteria'] || []).some((line) => line.trim() === '## To-do Actions')) {
        diagnostics.push({ level: 'error', path: rel, message: 'missing H2 "To-do Actions"' });
    }
    for (const section of Object.keys(TABLES[kind] || {})) {
        if (section === 'body')
            validateTable(kind, section, lines, rel, diagnostics);
        else
            validateTable(kind, section, found.bodies[section] || [], rel, diagnostics);
    }
    if (kind === 'decision' || kind === 'issue') {
        const values = (found.bodies.Status || []).map((line) => line.trim()).filter(Boolean);
        const allowed = kind === 'decision' ? ['proposed', 'accepted', 'superseded', 'rejected'] : ['open', 'in-progress', 'blocked', 'closed'];
        if (values.length !== 1 || !allowed.includes(values[0]))
            diagnostics.push({ level: 'error', path: rel, message: `invalid ${kind} status "${values.join(' ')}"` });
    }
}
function scanDocumentation(root) {
    const docs = path.join(root, 'docs');
    const result = { files: [], entries: [], symlinks: [] };
    if (!fs.existsSync(docs))
        return result;
    const rootStat = fs.lstatSync(docs);
    if (rootStat.isSymbolicLink()) {
        result.symlinks.push('docs');
        return result;
    }
    if (!rootStat.isDirectory())
        return result;
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const target = path.join(directory, entry.name);
            const rel = path.relative(root, target).split(path.sep).join('/');
            if (entry.isSymbolicLink()) {
                result.symlinks.push(rel);
                continue;
            }
            result.entries.push(rel);
            if (entry.isDirectory())
                visit(target);
            else if (entry.isFile())
                result.files.push(target);
        }
    };
    visit(docs);
    return result;
}
function compareCodePoints(left, right) {
    const a = Array.from(left, (character) => character.codePointAt(0) || 0);
    const b = Array.from(right, (character) => character.codePointAt(0) || 0);
    for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
        if (a[index] !== b[index])
            return a[index] - b[index];
    }
    return a.length - b.length;
}
function escapeCell(value) {
    return value.replace(/\|/g, '\\|');
}
function structureTable(root) {
    const docs = path.join(root, 'docs');
    if (!fs.existsSync(docs) || fs.lstatSync(docs).isSymbolicLink())
        return null;
    const app = path.join(docs, 'app');
    if (!fs.existsSync(app) || fs.lstatSync(app).isSymbolicLink() || !fs.statSync(app).isDirectory())
        return null;
    const rows = [];
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const target = path.join(directory, entry.name);
            const rel = path.relative(app, target).split(path.sep).join('/');
            if (entry.isSymbolicLink())
                continue;
            if (entry.isDirectory()) {
                const description = rel === 'data' ? 'Data-system documentation.'
                    : rel === 'interface' ? 'User-facing interface documentation.'
                        : rel === 'logic' ? 'Business-logic documentation.' : 'Documentation directory.';
                rows.push({ path: `${rel}/`, kind: 'Directory', description });
                if (!visit(target))
                    return false;
            }
            else if (entry.isFile() && rel !== 'STRUCTURE.md') {
                if (rel.toLowerCase().endsWith('.markdown'))
                    return false;
                if (rel.toLowerCase().endsWith('.md')) {
                    let text;
                    try {
                        text = decoder.decode(fs.readFileSync(target));
                    }
                    catch {
                        return false;
                    }
                    const parsed = parseFrontmatter(text.replace(/^\uFEFF/, ''), `docs/app/${rel}`, []);
                    const description = parsed?.metadata.description;
                    if (typeof description !== 'string' || !description)
                        return false;
                    rows.push({ path: rel, kind: 'Document', description });
                }
                else {
                    rows.push({ path: rel, kind: 'Asset', description: 'Supporting asset.' });
                }
            }
        }
        return true;
    };
    if (!visit(app))
        return null;
    rows.sort((left, right) => compareCodePoints(left.path, right.path));
    return ['| Path | Kind | Description |', '|---|---|---|', ...rows.map((row) => `| ${escapeCell(row.path)} | ${row.kind} | ${escapeCell(row.description)} |`)].join('\n');
}
function repositoryLineEnding(root) {
    let crlf = 0;
    let lf = 0;
    const files = [...['README.md', 'AGENTS.md'].map((rel) => path.join(root, rel)), ...scanDocumentation(root).files];
    for (const file of files) {
        if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !file.toLowerCase().endsWith('.md'))
            continue;
        const bytes = fs.readFileSync(file);
        for (let index = 0; index < bytes.length; index += 1) {
            if (bytes[index] !== 0x0a)
                continue;
            if (index > 0 && bytes[index - 1] === 0x0d)
                crlf += 1;
            else
                lf += 1;
        }
    }
    return crlf > lf ? '\r\n' : '\n';
}
function normalizeMetadata(text) {
    const withoutBom = text.replace(/^\uFEFF/, '');
    const parts = withoutBom.split(/(\r\n|\n)/);
    const lines = parts.filter((_, index) => index % 2 === 0);
    const end = lines.indexOf('---', 1);
    const diagnostics = [];
    const parsed = parseFrontmatter(withoutBom, '', diagnostics);
    if (!parsed || diagnostics.length || end < 0)
        return withoutBom;
    for (let index = 1; index < end; index += 1) {
        const match = /^([a-z]+):(.*)$/.exec(lines[index]);
        if (!match || !KEYS.includes(match[1]))
            continue;
        if (match[1] === 'tags') {
            lines[index] = match[2].trim() === '[]' ? 'tags: []' : 'tags:';
            while (index + 1 < end && /^  - /.test(lines[index + 1])) {
                index += 1;
                lines[index] = `  - ${lines[index].slice(4).trim()}`;
            }
        }
        else if (match[1] === 'timestamp') {
            lines[index] = `timestamp: '${String(parsed.metadata.timestamp)}'`;
        }
        else {
            lines[index] = `${match[1]}: ${match[2].trim()}`;
        }
    }
    for (let index = 0; index < lines.length; index += 1)
        parts[index * 2] = lines[index];
    return parts.join('');
}
function replaceStructureBody(text, table, generatedEol) {
    const withoutBom = text.replace(/^\uFEFF/, '');
    const parts = withoutBom.split(/(\r\n|\n)/);
    const lines = parts.filter((_, index) => index % 2 === 0);
    const end = lines.indexOf('---', 1);
    if (lines[0] !== '---' || end < 0)
        return null;
    const prefix = parts.slice(0, end * 2 + 1).join('');
    const closingEol = parts[end * 2 + 1] || generatedEol;
    return `${prefix}${closingEol}${generatedEol}${table.replace(/\n/g, generatedEol)}${generatedEol}`;
}
function atomicReplace(write) {
    const temporary = path.join(path.dirname(write.path), `.project-docs-${process.pid}-${randomBytes(6).toString('hex')}.tmp`);
    const mode = fs.statSync(write.path).mode;
    try {
        fs.writeFileSync(temporary, write.content, { flag: 'wx', mode });
        fs.renameSync(temporary, write.path);
    }
    finally {
        fs.rmSync(temporary, { force: true });
    }
}
function equalBytes(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}
function repositoryEntries(root) {
    const entries = [];
    const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (entry.name === '.git')
                continue;
            const target = path.join(directory, entry.name);
            if (entry.isSymbolicLink())
                continue;
            entries.push(target);
            if (entry.isDirectory())
                visit(target);
        }
    };
    visit(root);
    return entries;
}
function gitRenames(root) {
    const renames = new Map();
    try {
        const fields = String(execFileSync('git', ['-C', root, 'diff', 'HEAD', '--name-status', '-z', '--find-renames', '--'], { stdio: ['ignore', 'pipe', 'ignore'] })).split('\0');
        for (let index = 0; index < fields.length - 1;) {
            const status = fields[index++];
            if (/^[RC]/.test(status))
                renames.set(fields[index++].replace(/\\/g, '/'), fields[index++].replace(/\\/g, '/'));
            else
                index += 1;
        }
    }
    catch {
        return renames;
    }
    return renames;
}
function maskFencedMarkdown(text) {
    const parts = text.split(/(\r\n|\n)/);
    let fence = null;
    for (let index = 0; index < parts.length; index += 2) {
        const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(parts[index]);
        const hidden = fence !== null || marker !== null;
        if (!fence && marker)
            fence = { character: marker[1][0], length: marker[1].length };
        else if (fence && marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim())
            fence = null;
        if (hidden)
            parts[index] = ' '.repeat(parts[index].length);
    }
    return parts.join('');
}
function targetSpans(rel, text) {
    const spans = [];
    if (rel.toLowerCase().endsWith('.md')) {
        const visible = maskFencedMarkdown(text);
        const inline = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g;
        for (const match of visible.matchAll(inline)) {
            const target = match[1] || match[2];
            const local = match[0].indexOf(target, match[0].indexOf('('));
            spans.push({ start: match.index + local, end: match.index + local + target.length, target });
        }
    }
    else {
        const patterns = [/(?:href|src)\s*=\s*["']([^"']+)["']/gi, /url\(\s*["']?([^\s"')]+)["']?\s*\)/gi];
        for (const pattern of patterns)
            for (const match of text.matchAll(pattern)) {
                const local = match[0].indexOf(match[1]);
                spans.push({ start: match.index + local, end: match.index + local + match[1].length, target: match[1] });
            }
    }
    return spans;
}
function repairedTarget(root, file, target, byCase, renames) {
    if (!target || target.startsWith('#') || target.startsWith('/') || externalTarget(target))
        return null;
    const suffixAt = [target.indexOf('?'), target.indexOf('#')].filter((index) => index >= 0).sort((left, right) => left - right)[0] ?? target.length;
    const suffix = target.slice(suffixAt);
    let pathname;
    try {
        pathname = decodeURIComponent(target.slice(0, suffixAt)).replace(/\\/g, '/');
    }
    catch {
        return null;
    }
    const intended = path.resolve(path.dirname(file), pathname);
    const matches = byCase.get(intended.toLowerCase()) || [];
    const exact = intended === root || matches.includes(intended);
    if (!target.includes('\\') && exact)
        return null;
    if (intended !== root && !intended.startsWith(`${root}${path.sep}`))
        return null;
    let candidate;
    if (exact)
        candidate = intended;
    else {
        if (matches.length === 1)
            candidate = matches[0];
        else {
            const oldRel = path.relative(root, intended).split(path.sep).join('/');
            const renamed = renames.get(oldRel);
            if (renamed)
                candidate = path.join(root, ...renamed.split('/'));
        }
    }
    if (!candidate || !fs.existsSync(candidate))
        return null;
    let replacement = path.relative(path.dirname(file), candidate).split(path.sep).join('/');
    if (!replacement || replacement.startsWith('/'))
        return null;
    if (fs.statSync(candidate).isDirectory() && target.slice(0, suffixAt).endsWith('/'))
        replacement += '/';
    replacement = encodeURI(replacement) + suffix;
    return replacement === target ? null : replacement;
}
function repairLinks(root, file, rel, text, entries, renames) {
    const byCase = new Map();
    for (const entry of entries) {
        const key = entry.toLowerCase();
        byCase.set(key, [...(byCase.get(key) || []), entry]);
    }
    const replacements = targetSpans(rel, text)
        .map((span) => ({ ...span, replacement: repairedTarget(root, file, span.target, byCase, renames) }))
        .filter((span) => span.replacement !== null)
        .sort((left, right) => right.start - left.start);
    for (const replacement of replacements)
        text = `${text.slice(0, replacement.start)}${replacement.replacement}${text.slice(replacement.end)}`;
    return text;
}
function validatePlannedWrites(root, writes) {
    const diagnostics = [];
    const decoder = new TextDecoder('utf-8', { fatal: true });
    for (const [rel, write] of [...writes.entries()].sort(([left], [right]) => compareCodePoints(left, right))) {
        try {
            const text = decoder.decode(write.content);
            const file = path.join(root, ...rel.split('/'));
            if (!rel.toLowerCase().endsWith('.md')) {
                validateAssetText(root, file, rel, text, diagnostics);
                continue;
            }
            validateSecrets(rel, text, diagnostics);
            if (rel.startsWith('docs/')) {
                const parsed = parseFrontmatter(text, rel, diagnostics);
                validateLinks(root, file, rel, parsed?.body || text, diagnostics);
                if (parsed) {
                    validateDocument(rel, parsed, diagnostics);
                    const kind = parsed.metadata.type;
                    if (kind === 'interface' || kind === 'logic' || kind === 'data') {
                        validateSourceReferences(root, file, rel, sections(markdownLines(parsed.body)).bodies['Source References'] || [], diagnostics);
                    }
                }
            }
            else
                validateLinks(root, file, rel, text, diagnostics);
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'planned output is not valid UTF-8' });
        }
    }
    return diagnostics.filter((diagnostic) => diagnostic.level === 'error');
}
function inspect(root) {
    const diagnostics = [];
    const expected = ['README.md', 'AGENTS.md', 'docs/DOMAIN.md', 'docs/app/STRUCTURE.md'];
    const missing = expected.filter((rel) => !fs.existsSync(path.join(root, rel)));
    if (missing.length)
        diagnostics.push({ level: 'warning', message: `missing expected documentation: ${missing.join(', ')}` });
    const docsRoot = path.join(root, 'docs');
    const trustedDocs = !fs.existsSync(docsRoot) || !fs.lstatSync(docsRoot).isSymbolicLink();
    const app = path.join(docsRoot, 'app');
    if (trustedDocs && fs.existsSync(app) && !fs.lstatSync(app).isSymbolicLink()) {
        if (!fs.statSync(app).isDirectory()) {
            diagnostics.push({ level: 'error', path: 'docs/app', message: 'must be a directory' });
        }
        else {
            for (const entry of fs.readdirSync(app, { withFileTypes: true })) {
                if (!(entry.name === 'STRUCTURE.md' && entry.isFile()) && !(['data', 'interface', 'logic'].includes(entry.name) && entry.isDirectory())) {
                    diagnostics.push({ level: 'error', path: `docs/app/${entry.name}`, message: 'invalid application-root entry' });
                }
            }
        }
    }
    const scan = scanDocumentation(root);
    for (const rel of scan.symlinks.sort(compareCodePoints))
        diagnostics.push({ level: 'warning', path: rel, message: 'skipped symlink' });
    const folded = new Map();
    for (const rel of scan.entries) {
        if (rel.includes('\\'))
            diagnostics.push({ level: 'error', path: rel, message: 'Windows path separator in documentation path' });
        const key = rel.toLowerCase();
        folded.set(key, [...(folded.get(key) || []), rel]);
    }
    for (const paths of [...folded.values()].filter((items) => items.length > 1)) {
        paths.sort(compareCodePoints);
        diagnostics.push({ level: 'error', message: `case-insensitive path collision: ${paths.join(', ')}` });
    }
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const managedMarkdown = new Set([
        'README.md',
        'AGENTS.md',
        ...scan.files.map((file) => path.relative(root, file).split(path.sep).join('/')).filter((rel) => /\.(?:md|markdown)$/i.test(rel)),
    ]);
    for (const file of repositoryEntries(root).filter((entry) => /\.(?:md|markdown)$/i.test(entry) && fs.statSync(entry).isFile())) {
        const rel = path.relative(root, file).split(path.sep).join('/');
        try {
            validateSecrets(rel, decoder.decode(fs.readFileSync(file)), diagnostics);
        }
        catch {
            if (!managedMarkdown.has(rel))
                diagnostics.push({ level: 'error', path: rel, message: 'invalid UTF-8' });
        }
    }
    for (const rel of ['README.md', 'AGENTS.md']) {
        const file = path.join(root, rel);
        if (!fs.existsSync(file))
            continue;
        const bytes = fs.readFileSync(file);
        try {
            const text = decoder.decode(bytes);
            validateLinks(root, file, rel, text, diagnostics);
            if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
                diagnostics.push({ level: 'error', path: rel, message: 'UTF-8 BOM must be removed' });
            }
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid UTF-8' });
        }
    }
    for (const file of scan.files) {
        const rel = path.relative(root, file).split(path.sep).join('/');
        if (rel.toLowerCase().endsWith('.markdown')) {
            diagnostics.push({ level: 'error', path: rel, message: '.markdown is not supported under docs/' });
            continue;
        }
        if (!rel.toLowerCase().endsWith('.md')) {
            validateAssetLinks(root, file, rel, diagnostics);
            continue;
        }
        let text;
        const bytes = fs.readFileSync(file);
        try {
            text = decoder.decode(bytes);
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid UTF-8' });
            continue;
        }
        if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
            diagnostics.push({ level: 'error', path: rel, message: 'UTF-8 BOM must be removed' });
        }
        const parsed = parseFrontmatter(text, rel, diagnostics);
        validateLinks(root, file, rel, parsed?.body || text, diagnostics);
        if (parsed) {
            validateDocument(rel, parsed, diagnostics);
            const kind = parsed.metadata.type;
            if (kind === 'interface' || kind === 'logic' || kind === 'data') {
                validateSourceReferences(root, file, rel, sections(markdownLines(parsed.body)).bodies['Source References'] || [], diagnostics);
            }
            if (rel === 'docs/app/STRUCTURE.md') {
                const expectedTable = structureTable(root);
                if (expectedTable !== null && parsed.body.trim() !== expectedTable.trim()) {
                    diagnostics.push({ level: 'error', path: rel, message: 'stale structure index' });
                }
            }
        }
    }
    return diagnostics;
}
function report(diagnostics) {
    for (const diagnostic of diagnostics) {
        console.log(`${diagnostic.level.toUpperCase()}${diagnostic.path ? ` ${diagnostic.path}` : ''}: ${diagnostic.message}`);
    }
    const errors = diagnostics.filter((item) => item.level === 'error').length;
    const warnings = diagnostics.length - errors;
    console.log(errors ? `INVALID: ${errors} error(s), ${warnings} warning(s)` : `VALID: ${warnings} warning(s)`);
    return errors ? 1 : 0;
}
function check(root) {
    return report(inspect(root));
}
function fix(root) {
    let gitRoot;
    try {
        gitRoot = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    }
    catch {
        console.error('Fix requires a Git repository.');
        return 2;
    }
    if (path.resolve(gitRoot) !== root) {
        console.error(`Fix requires the Git project root: ${gitRoot}`);
        return 2;
    }
    const diagnostics = inspect(root);
    const writes = new Map();
    const entries = repositoryEntries(root);
    const renames = gitRenames(root);
    for (const file of [...['README.md', 'AGENTS.md'].map((rel) => path.join(root, rel)), ...scanDocumentation(root).files]) {
        if (!fs.existsSync(file) || !fs.statSync(file).isFile())
            continue;
        const rel = path.relative(root, file).split(path.sep).join('/');
        const markdown = rel === 'README.md' || rel === 'AGENTS.md' || rel.toLowerCase().endsWith('.md');
        if (!markdown && !/\.(?:css|html?|svg|xml)$/i.test(rel))
            continue;
        const original = fs.readFileSync(file);
        let content = original;
        if (markdown && content.length >= 3 && content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf)
            content = content.subarray(3);
        try {
            let text = new TextDecoder('utf-8', { fatal: true }).decode(content);
            if (rel.startsWith('docs/') && markdown)
                text = normalizeMetadata(text);
            text = repairLinks(root, file, rel, text, entries, renames);
            content = new TextEncoder().encode(text);
        }
        catch {
            continue;
        }
        if (!equalBytes(content, original))
            writes.set(rel, { path: file, rel, content });
    }
    const structurePath = path.join(root, 'docs', 'app', 'STRUCTURE.md');
    const table = structureTable(root);
    if (fs.existsSync(structurePath) && table !== null) {
        const current = writes.has('docs/app/STRUCTURE.md')
            ? new TextDecoder().decode(writes.get('docs/app/STRUCTURE.md').content)
            : fs.readFileSync(structurePath, 'utf8');
        const replacement = replaceStructureBody(current, table, repositoryLineEnding(root));
        if (replacement !== null && replacement !== current.replace(/^\uFEFF/, '')) {
            writes.set('docs/app/STRUCTURE.md', { path: structurePath, rel: 'docs/app/STRUCTURE.md', content: new TextEncoder().encode(replacement) });
        }
    }
    const planned = new Set(writes.keys());
    const deterministic = (diagnostic) => diagnostic.path != null && planned.has(diagnostic.path) && (['UTF-8 BOM must be removed', 'stale structure index'].includes(diagnostic.message)
        || /^(?:broken internal link|Windows path separator in link)/.test(diagnostic.message)
        || (diagnostic.path === 'docs/app/STRUCTURE.md' && (diagnostic.message === 'invalid body table' || diagnostic.message === 'expected H1 sequence: none')));
    const unsafe = diagnostics.filter((diagnostic) => diagnostic.level === 'error' && !deterministic(diagnostic));
    if (unsafe.length) {
        console.error('Fix aborted before writing because the complete deterministic plan is unsafe.');
        return report(diagnostics);
    }
    const invalidPlan = validatePlannedWrites(root, writes);
    if (invalidPlan.length) {
        console.error('Fix aborted before writing because a planned output failed validation.');
        return report([...diagnostics, ...invalidPlan]);
    }
    let failed = false;
    for (const write of writes.values()) {
        try {
            atomicReplace(write);
            console.log(`FIXED ${write.rel}`);
        }
        catch (error) {
            failed = true;
            console.error(`FAILED ${write.rel}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const status = check(root);
    return failed ? 2 : status;
}
function main() {
    const [operation, projectRoot, ...extra] = process.argv.slice(2);
    if (extra.length || !['check', 'fix'].includes(operation) || !projectRoot) {
        console.error('Usage: node project-docs.js <check|fix> <project-root>');
        return 2;
    }
    const root = path.resolve(projectRoot);
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
        console.error(`Project root is not a directory: ${projectRoot}`);
        return 2;
    }
    return operation === 'fix' ? fix(root) : check(root);
}
try {
    process.exitCode = main();
}
catch (error) {
    console.error(`Internal failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
}
