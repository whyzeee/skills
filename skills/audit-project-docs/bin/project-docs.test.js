'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cli = path.join(__dirname, 'project-docs.js');

function runCheck(document, relativePath = 'docs/app/interface/console.md') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const target = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, document);
  const result = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });
  return result;
}

const body = `# Purpose
Operate the console.
# Components
The console.
# Relationships
## Within This Category
None
## Across Categories
None
# Source References
None
`;

test('check accepts controlled frontmatter', () => {
  const result = runCheck(`---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /valid/i);
});

test('check rejects unknown frontmatter keys', () => {
  const result = runCheck(`---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
owner: platform
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /unknown frontmatter key "owner"/i);
});

test('check rejects unsupported YAML', () => {
  const result = runCheck(`---
type: interface
title: Console
description: Describes the project console.
tags:
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /tags must be a block list or \[\]/i);
});

test('check rejects flow-style YAML scalars', () => {
  const result = runCheck(`---
type: interface
title: [Console]
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid scalar for "title"/i);
});

test('check rejects unmatched quoted scalars', () => {
  const result = runCheck(`---
type: interface
title: 'Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid scalar for "title"/i);
});

test('check rejects unsupported quoted escapes', () => {
  const result = runCheck(`---
type: interface
title: "Con\\sole"
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid scalar for "title"/i);
});

test('check rejects colon-space in plain scalars', () => {
  const result = runCheck(`---
type: interface
title: Console: UI
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid scalar for "title"/i);
});

test('check rejects missing controlled fields', () => {
  const result = runCheck(`---
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /missing frontmatter key "type"/i);
});

test('check rejects invalid controlled values', () => {
  const result = runCheck(`---
type: service
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid document type "service"/i);
});

test('check rejects impossible UTC timestamps', () => {
  const result = runCheck(`---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-02-30T00:00:00Z'
---
${body}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid timestamp/i);
});

test('check rejects invalid UTF-8 in root Markdown', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  fs.writeFileSync(path.join(root, 'README.md'), Buffer.from([0xff]));
  const result = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /README\.md: invalid UTF-8/i);
});

test('check requires relationship subsections inside Relationships', () => {
  const misplaced = `# Purpose
Describes the console.
## Within This Category
None
## Across Categories
None
# Components
None
# Relationships
None
# Source References
None
`;
  const result = runCheck(`---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${misplaced}`);

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /missing H2 "Within This Category"/i);
});

test('check rejects table separators with the wrong column count', () => {
  const dataBody = `# Purpose
Stores items.
# Fields
| Field | Type | Required | Description |
|---|---|---|
| id | uuid | yes | Identifier. |
# Relationships
## Within Data
None
## Across Categories
None
# Constraints
None
# Indexes
None
# Source References
None
`;
  const result = runCheck(`---
type: data
title: Items
description: Describes stored items.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${dataBody}`, 'docs/app/data/sql/public/tables/items.md');

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid Fields table/i);
});

test('check accepts escaped pipes inside table cells', () => {
  const dataBody = `# Purpose
Stores items.
# Fields
| Field | Type | Required | Description |
|---|---|---|---|
| value | string \\| null | yes | Stored value. |
# Relationships
## Within Data
None
## Across Categories
None
# Constraints
None
# Indexes
None
# Source References
None
`;
  const result = runCheck(`---
type: data
title: Items
description: Describes stored items.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${dataBody}`, 'docs/app/data/sql/public/tables/items.md');

  assert.equal(result.status, 0, result.stderr + result.stdout);
});

test('check reports docs/app files as validation errors', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs', 'app'), 'not a directory');
  const result = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /docs\/app.*must be a directory/i);
});

test('check requires Status to contain exactly one controlled value', () => {
  const decisionBody = `# Status
accepted
Additional text.
# Context
A runtime was needed.
# Decision
Use Node.
# Alternatives Considered
None
# Consequences
Node is required.
# Related Documentation
None
`;
  const result = runCheck(`---
type: decision
title: Use Node
description: Records the runtime choice.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
${decisionBody}`, 'docs/decisions/0001-use-node.md');

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /invalid decision status/i);
});

test('check validates inline and reference-style links outside fenced examples', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const document = `---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
# Purpose
[Existing](../../assets/target.txt)
[Directory](../../assets/)
[Broken](../../assets/missing.txt)
[Escape](../../../../outside.md)
[Absolute](/docs/assets/target.txt)
[Invalid external](https://[invalid)
[Internal reference][source]
[External reference][website]

[source]: ../../assets/target.txt
[website]: https://example.com/docs
[windows]: C:\\repo\\target.md

~~~md
[Fenced missing](../../assets/fenced-missing.txt)
~~~
    ~~~md
[Indented marker missing](../../assets/indented-marker-missing.txt)
    ~~~
\`\`\`\`md
[Four-fence first](../../assets/four-first.txt)
\`\`\`
[Four-fence second](../../assets/four-second.txt)
\`\`\`\`
[After four-fence](../../assets/after-four.txt)
# Components
The console.
# Relationships
## Within This Category
None
## Across Categories
None
# Source References
None
`;
  const target = path.join(root, 'docs/app/interface/console.md');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/assets'), { recursive: true });
  fs.writeFileSync(target, document);
  fs.writeFileSync(path.join(root, 'README.md'), '[Root broken](root-missing.md)\n');
  fs.writeFileSync(path.join(root, 'docs/assets/target.txt'), 'asset');

  const result = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /README\.md: broken internal link.*root-missing\.md/i);
  assert.match(result.stdout, /broken internal link.*missing\.txt/i);
  assert.match(result.stdout, /internal link target must be a file/i);
  assert.match(result.stdout, /repository-escaping internal link/i);
  assert.match(result.stdout, /internal link must be relative/i);
  assert.match(result.stdout, /invalid external URL/i);
  assert.match(result.stdout, /internal reference-style link/i);
  assert.match(result.stdout, /Windows path separator in link/i);
  assert.doesNotMatch(result.stdout, /fenced-missing/i);
  assert.match(result.stdout, /indented-marker-missing/i);
  assert.doesNotMatch(result.stdout, /four-first|four-second/i);
  assert.match(result.stdout, /after-four/i);
});

test('check requires Source References display and target to identify the same repository path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const target = path.join(root, 'docs/app/logic/workflow.md');
  const source = path.join(root, 'src/example.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, 'export const run = () => {};\n');
  const document = (rows) => `---
type: logic
title: Workflow
description: Describes workflow execution.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
# Purpose
Executes work.
# Components
The workflow.
# Relationships
## Within This Category
None
## Across Categories
None
# Source References
| Path | Component | Description |
|---|---|---|
${rows}
`;
  const row = (display) => `| [\`${display}\`](../../../src/example.ts#overview) | \`run\` | Executes the workflow. |`;
  fs.writeFileSync(target, document(row('src/example.ts')));
  const valid = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.writeFileSync(target, document(row('src/other.ts')));
  const mismatch = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.writeFileSync(target, document('| [`src`](../../../src/) | `source-tree` | Contains source files. |\n| [`src/example.ts:7`](../../../src/example.ts#L7) |  | None |'));
  const malformed = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(valid.status, 0, valid.stderr + valid.stdout);
  assert.equal(mismatch.status, 1, mismatch.stderr + mismatch.stdout);
  assert.match(mismatch.stdout, /Source References.*same repository path/i);
  assert.equal(malformed.status, 1, malformed.stderr + malformed.stdout);
  assert.match(malformed.stdout, /directory label must end with \//i);
  assert.match(malformed.stdout, /must not include line numbers/i);
  assert.match(malformed.stdout, /component must be named/i);
  assert.match(malformed.stdout, /description must be substantive/i);
});

test('check skips documentation symlinks and validates asset and path safety', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const assets = path.join(root, 'docs/assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, 'Logo.svg'), '<svg/>');
  fs.writeFileSync(path.join(assets, 'logo.svg'), '<svg><image href="missing.png"/><image href="linked.md"/></svg>');
  fs.writeFileSync(path.join(assets, 'page.html'), '<img src="missing-html.png"><a href="Logo.svg">Logo</a>');
  fs.writeFileSync(path.join(assets, 'diagram.xml'), '<image href="missing-xml.png"/>');
  fs.writeFileSync(path.join(assets, 'theme.css'), 'body { background: url("missing-css.png"); }');
  fs.writeFileSync(path.join(assets, 'bad\\name.svg'), '<svg/>');
  fs.writeFileSync(path.join(assets, 'legacy.markdown'), '# Legacy\n');
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-outside-'));
  const outsideFile = path.join(outsideRoot, 'outside.md');
  fs.writeFileSync(outsideFile, 'password = exposed\n');
  const outsideApp = path.join(outsideRoot, 'outside-app');
  fs.mkdirSync(outsideApp);
  fs.writeFileSync(path.join(outsideApp, 'outside-entry.md'), 'password = exposed\n');
  fs.symlinkSync(outsideFile, path.join(assets, 'linked.md'));
  fs.symlinkSync(outsideApp, path.join(root, 'docs/app'), 'dir');

  const result = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(outsideRoot, { recursive: true, force: true });

  assert.equal(result.status, 1, result.stderr + result.stdout);
  assert.match(result.stdout, /WARNING docs\/assets\/linked\.md: skipped symlink/i);
  assert.match(result.stdout, /WARNING docs\/app: skipped symlink/i);
  assert.match(result.stdout, /case-insensitive path collision.*Logo\.svg.*logo\.svg/i);
  assert.match(result.stdout, /bad\\name\.svg: Windows path separator/i);
  assert.match(result.stdout, /legacy\.markdown: \.markdown is not supported/i);
  assert.match(result.stdout, /repository-escaping internal link.*linked\.md/i);
  assert.match(result.stdout, /broken internal link.*missing\.png/i);
  assert.match(result.stdout, /page\.html: broken internal link.*missing-html\.png/i);
  assert.match(result.stdout, /diagram\.xml: broken internal link.*missing-xml\.png/i);
  assert.match(result.stdout, /theme\.css: broken internal link.*missing-css\.png/i);
  assert.doesNotMatch(result.stdout, /outside-entry/i);
  assert.doesNotMatch(result.stdout, /exposed/i);
});

test('check scans fenced Markdown for private keys and credential assignments while allowing placeholders', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const readme = path.join(root, 'README.md');
  const credentials = path.join(root, 'notes', 'credentials.md');
  fs.mkdirSync(path.dirname(credentials), { recursive: true });
  fs.writeFileSync(readme, '# Setup\n');
  fs.writeFileSync(credentials, `# Credentials
\`\`\`env
PASSWORD=hunter2
DEPLOY_TOKEN=real-token-value
API_TOKEN=\${API_TOKEN}
CLIENT_SECRET=[REDACTED]
-----BEGIN PRIVATE KEY-----
not-a-placeholder
-----END PRIVATE KEY-----
\`\`\`
`);
  const invalid = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.writeFileSync(credentials, `# Credentials
\`\`\`env
PASSWORD=<secret>
API_TOKEN=\${API_TOKEN}
CLIENT_SECRET=[REDACTED]
\`\`\`
`);
  const valid = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(invalid.status, 1, invalid.stderr + invalid.stdout);
  assert.match(invalid.stdout, /private key/i);
  assert.match(invalid.stdout, /credential assignment.*PASSWORD/i);
  assert.match(invalid.stdout, /credential assignment.*DEPLOY_TOKEN/i);
  assert.equal(valid.status, 0, valid.stderr + valid.stdout);
});

test('fix repairs only unique case, separator, and Git-rename link targets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const documentPath = path.join(root, 'docs/app/interface/console.md');
  const assets = path.join(root, 'docs/assets');
  fs.mkdirSync(path.dirname(documentPath), { recursive: true });
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, 'Logo.svg'), '<svg/>');
  fs.writeFileSync(path.join(assets, 'before.svg'), '<svg/>');
  fs.writeFileSync(documentPath, `---
type: interface
title: Console
description: Describes the project console.
tags: []
timestamp: '2026-07-14T00:00:00Z'
---
# Purpose
[Case](../../assets/logo.svg)
[Separator](..\\..\\assets\\Logo.svg)
[Renamed](../../assets/before.svg)
[Valid](./../../assets/Logo.svg)
# Components
The console.
# Relationships
## Within This Category
None
## Across Categories
None
# Source References
None
`);
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['add', '.'], { cwd: root });
  spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'base'], { cwd: root });
  fs.renameSync(path.join(assets, 'before.svg'), path.join(assets, 'after.svg'));
  spawnSync('git', ['add', '-A'], { cwd: root });

  const result = spawnSync(process.execPath, [cli, 'fix', root], { encoding: 'utf8' });
  const fixed = fs.readFileSync(documentPath, 'utf8');
  fs.rmSync(root, { recursive: true, force: true });

  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(fixed, /\[Case\]\(\.\.\/\.\.\/assets\/Logo\.svg\)/);
  assert.match(fixed, /\[Separator\]\(\.\.\/\.\.\/assets\/Logo\.svg\)/);
  assert.match(fixed, /\[Renamed\]\(\.\.\/\.\.\/assets\/after\.svg\)/);
  assert.match(fixed, /\[Valid\]\(\.\/\.\.\/\.\.\/assets\/Logo\.svg\)/);
});

test('fix leaves ambiguous targets and invalid proposed repairs untouched', () => {
  const ambiguousRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const ambiguousReadme = path.join(ambiguousRoot, 'README.md');
  fs.mkdirSync(path.join(ambiguousRoot, 'assets'));
  fs.writeFileSync(path.join(ambiguousRoot, 'assets/Logo.svg'), '<svg/>');
  fs.writeFileSync(path.join(ambiguousRoot, 'assets/logo.svg'), '<svg/>');
  const ambiguousOriginal = '# Project\n[Ambiguous](assets/LOGO.svg)\n';
  fs.writeFileSync(ambiguousReadme, ambiguousOriginal);
  spawnSync('git', ['init', '-q', ambiguousRoot]);
  const ambiguous = spawnSync(process.execPath, [cli, 'fix', ambiguousRoot], { encoding: 'utf8' });
  const ambiguousAfter = fs.readFileSync(ambiguousReadme, 'utf8');
  fs.rmSync(ambiguousRoot, { recursive: true, force: true });

  const invalidPlanRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const invalidPlanReadme = path.join(invalidPlanRoot, 'README.md');
  fs.mkdirSync(path.join(invalidPlanRoot, 'docs'));
  const invalidPlanOriginal = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('# Project\n[Directory](Docs)\n')]);
  fs.writeFileSync(invalidPlanReadme, invalidPlanOriginal);
  spawnSync('git', ['init', '-q', invalidPlanRoot]);
  const invalidPlan = spawnSync(process.execPath, [cli, 'fix', invalidPlanRoot], { encoding: 'utf8' });
  const invalidPlanAfter = fs.readFileSync(invalidPlanReadme);
  fs.rmSync(invalidPlanRoot, { recursive: true, force: true });

  assert.equal(ambiguous.status, 1, ambiguous.stderr + ambiguous.stdout);
  assert.match(ambiguous.stdout, /broken internal link.*assets\/LOGO\.svg/i);
  assert.equal(ambiguousAfter, ambiguousOriginal);
  assert.equal(invalidPlan.status, 1, invalidPlan.stderr + invalidPlan.stdout);
  assert.match(invalidPlan.stderr, /planned output failed validation/i);
  assert.match(invalidPlan.stdout, /internal link target must be a file/i);
  assert.deepEqual(invalidPlanAfter, invalidPlanOriginal);
});

test('fix regenerates a recursive deterministic structure index and revalidates it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const write = (relativePath, content) => {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  const frontmatter = (type, title, description) => `---\ntype: ${type}\ntitle: ${title}\ndescription: ${description}\ntags: []\ntimestamp: '2026-07-14T00:00:00Z'\n---\n`;
  const structureFrontmatter = `---\r\ntype: structure\ntitle: Application structure\r\ndescription: Indexes application documentation.\ntags: []\r\ntimestamp: '2026-07-14T00:00:00Z'\n---\r\n`;
  write('docs/app/STRUCTURE.md', `${structureFrontmatter}\r\nnot a generated table\r\n`);
  write('docs/app/data/postgres/public/tables/customers.md', `${frontmatter('data', 'Customers', 'Describes customer records.')}\n# Purpose\nStores customers.\n# Fields\nNone\n# Relationships\n## Within Data\nNone\n## Across Categories\nNone\n# Constraints\nNone\n# Indexes\nNone\n# Source References\nNone\n`);
  write('docs/app/interface/console.md', `${frontmatter('interface', 'Console', 'Describes the operator console.')}\n# Purpose\nSupports operators.\n# Components\nA command console.\n# Relationships\n## Within This Category\nNone\n## Across Categories\nNone\n# Source References\nNone\n`);
  write('docs/app/interface/z-diagram.svg', '<svg/>');
  spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });

  const stale = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  assert.equal(stale.status, 1, stale.stderr + stale.stdout);
  assert.match(stale.stdout, /stale.*STRUCTURE|STRUCTURE.*stale/i);

  const fixed = spawnSync(process.execPath, [cli, 'fix', root], { encoding: 'utf8' });
  assert.equal(fixed.status, 0, fixed.stderr + fixed.stdout);
  assert.match(fixed.stdout, /FIXED docs\/app\/STRUCTURE\.md/);
  const structure = fs.readFileSync(path.join(root, 'docs/app/STRUCTURE.md'), 'utf8');
  assert.equal(structure.slice(0, structure.indexOf('| Path | Kind | Description |')), `${structureFrontmatter}\n`);
  const rows = structure.slice(structure.indexOf('| Path | Kind | Description |'));
  assert.equal(rows, `| Path | Kind | Description |\n|---|---|---|\n| data/ | Directory | Data-system documentation. |\n| data/postgres/ | Directory | Documentation directory. |\n| data/postgres/public/ | Directory | Documentation directory. |\n| data/postgres/public/tables/ | Directory | Documentation directory. |\n| data/postgres/public/tables/customers.md | Document | Describes customer records. |\n| interface/ | Directory | User-facing interface documentation. |\n| interface/console.md | Document | Describes the operator console. |\n| interface/z-diagram.svg | Asset | Supporting asset. |\n`);
  const valid = spawnSync(process.execPath, [cli, 'check', root], { encoding: 'utf8' });
  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(valid.status, 0, valid.stderr + valid.stdout);
});

test('fix preserves quoted scalars and every existing line ending while normalizing metadata', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const target = path.join(root, 'docs/guides/operators.md');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const body = `# Purpose\r\nOperate the repository.\n# Responsibilities\r\nMaintain docs.\r\n# Prerequisites\r\nRepository access.\r\n# Workflows\r\nRun checks.\r\n# Verification\r\nReview output.\r\n# Troubleshooting\r\nInspect errors.\r\n# Related Documentation\r\nNone\r\n`;
  const text = `---\r\ntype:   guide\r\ntitle: 'Operators: Daily'\r\ndescription: Guides repository operators.\r\ntags:\r\n  -   'operations: daily'  \r\ntimestamp: 2026-07-14T00:00:00Z\r\n---\r\n${body}`;
  fs.writeFileSync(target, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)]));
  spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });

  const fixed = spawnSync(process.execPath, [cli, 'fix', root], { encoding: 'utf8' });
  assert.equal(fixed.status, 0, fixed.stderr + fixed.stdout);
  assert.match(fixed.stdout, /FIXED docs\/guides\/operators\.md/);
  const bytes = fs.readFileSync(target);
  const result = bytes.toString('utf8');
  fs.rmSync(root, { recursive: true, force: true });
  assert.notDeepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.match(result, /^---\r\ntype: guide\r\n/);
  assert.match(result, /\r\ntitle: 'Operators: Daily'\r\n/);
  assert.match(result, /\r\n  - 'operations: daily'\r\n/);
  assert.match(result, /\r\ntimestamp: '2026-07-14T00:00:00Z'\r\n/);
  assert.equal(result.slice(result.indexOf('# Purpose')), body);
});

test('fix aborts its complete plan before writing when encoding is unsafe', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-docs-test-'));
  const readme = path.join(root, 'README.md');
  const invalid = path.join(root, 'docs/guides/invalid.md');
  fs.mkdirSync(path.dirname(invalid), { recursive: true });
  fs.writeFileSync(readme, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('# Project\n')]));
  fs.writeFileSync(invalid, Buffer.from([0xff, 0xfe, 0xfd]));
  spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });

  const fixed = spawnSync(process.execPath, [cli, 'fix', root], { encoding: 'utf8' });
  const readmeAfter = fs.readFileSync(readme);
  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(fixed.status, 1, fixed.stderr + fixed.stdout);
  assert.match(fixed.stderr, /aborted before writing/i);
  assert.deepEqual([...readmeAfter.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});
