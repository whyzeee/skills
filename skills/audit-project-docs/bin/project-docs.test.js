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
