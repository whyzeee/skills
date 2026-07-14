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
