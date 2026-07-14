"use strict";
const fs = require('node:fs');
const path = require('node:path');
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
    const result = [];
    let fence = null;
    for (const line of body.split('\n')) {
        const marker = /^\s*(```+|~~~+)/.exec(line)?.[1]?.[0];
        if (marker) {
            fence = fence === null ? marker : fence === marker ? null : fence;
            continue;
        }
        if (fence === null)
            result.push(line);
    }
    return result;
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
function walk(directory) {
    if (!fs.existsSync(directory))
        return [];
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory())
            files.push(...walk(target));
        else if (entry.isFile())
            files.push(target);
    }
    return files;
}
function check(root) {
    const diagnostics = [];
    const expected = ['README.md', 'AGENTS.md', 'docs/DOMAIN.md', 'docs/app/STRUCTURE.md'];
    const missing = expected.filter((rel) => !fs.existsSync(path.join(root, rel)));
    if (missing.length)
        diagnostics.push({ level: 'warning', message: `missing expected documentation: ${missing.join(', ')}` });
    const app = path.join(root, 'docs', 'app');
    if (fs.existsSync(app)) {
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
    const decoder = new TextDecoder('utf-8', { fatal: true });
    for (const rel of ['README.md', 'AGENTS.md']) {
        const file = path.join(root, rel);
        if (!fs.existsSync(file))
            continue;
        try {
            decoder.decode(fs.readFileSync(file));
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid UTF-8' });
        }
    }
    for (const file of walk(path.join(root, 'docs'))) {
        const rel = path.relative(root, file).split(path.sep).join('/');
        if (rel.toLowerCase().endsWith('.markdown')) {
            diagnostics.push({ level: 'error', path: rel, message: '.markdown is not supported under docs/' });
            continue;
        }
        if (!rel.toLowerCase().endsWith('.md'))
            continue;
        let text;
        try {
            text = decoder.decode(fs.readFileSync(file));
        }
        catch {
            diagnostics.push({ level: 'error', path: rel, message: 'invalid UTF-8' });
            continue;
        }
        const parsed = parseFrontmatter(text, rel, diagnostics);
        if (parsed)
            validateDocument(rel, parsed, diagnostics);
    }
    for (const diagnostic of diagnostics) {
        console.log(`${diagnostic.level.toUpperCase()}${diagnostic.path ? ` ${diagnostic.path}` : ''}: ${diagnostic.message}`);
    }
    const errors = diagnostics.filter((item) => item.level === 'error').length;
    const warnings = diagnostics.length - errors;
    console.log(errors ? `INVALID: ${errors} error(s), ${warnings} warning(s)` : `VALID: ${warnings} warning(s)`);
    return errors ? 1 : 0;
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
    if (operation === 'fix') {
        console.error('Fix is not available yet; run check.');
        return 2;
    }
    return check(root);
}
try {
    process.exitCode = main();
}
catch (error) {
    console.error(`Internal failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
}
