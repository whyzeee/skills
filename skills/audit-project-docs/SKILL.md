---
name: audit-project-docs
description: Use when auditing repository-native project documentation for contract violations or applying deterministic repairs.
---

# Audit Project Documentation

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before interpreting findings or changing documentation. That skill owns the schemas and severity rules; this skill owns their deterministic implementation.

The validator lives in this skill and adds nothing to the target repository. Use `fix` for an audit unless the user requests read-only validation; use `check` for that read-only branch. `fix` requires the selected root to be a Git project root.

## Check

1. Resolve the user-selected project root. Git is optional for `check`. Completion: the path names an existing directory.
2. Confirm `node` is available. If it is missing, stop with: `Node.js is required to audit project documentation. Install it from https://nodejs.org/ and rerun the audit.` Completion: `node --version` succeeds.
3. Run `node <skill-directory>/bin/project-docs.js check <project-root>`. Completion: the process exits and its complete human-readable diagnostics are retained.
4. Report the result: status 0 is valid, including warnings; status 1 means validation errors remain; status 2 means invocation or internal failure. Completion: every reported error and the single consolidated warning are represented without inventing semantic fixes.

The check is complete only when the validator has inspected the selected root and returned one of those statuses. A missing Node runtime or status 2 is a failed invocation, not a documentation result.

The validator checks controlled schemas plus recursive documentation paths, inline internal links, external URL syntax, link-capable assets, exact Source References mappings, case-insensitive collisions, `.markdown`, Windows separators, symlinks, and likely private keys or credential assignments across all Markdown. Link checks ignore fenced examples; secret checks include them.

## Fix

1. Confirm `node` is available and the selected directory is the Git project root. Completion: `node --version` and `git -C <project-root> rev-parse --show-toplevel` succeed and identify that directory.
2. Run `node <skill-directory>/bin/project-docs.js fix <project-root>`. The validator precomputes every write before mutation, then atomically replaces only files with deterministic repairs. Completion: the process reports each `FIXED` path and performs its final `check`.
3. Report the final status and any `FAILED` path. Status 0 means deterministic repairs completed and revalidation passed; status 1 means documentation errors remain; status 2 means invocation, Git protection, or filesystem execution failed. Completion: the result distinguishes applied repairs from remaining semantic work.

The fixer operates on current file contents. It may normalize unambiguous metadata representation, remove UTF-8 BOMs, regenerate an existing application structure index, and update a stale internal link when exactly one case/separator match or Git-detected rename proves the destination. It does not create missing metadata, sections, placeholders, or `None` values. Every planned buffer is revalidated; if the complete plan is unsafe, it aborts before writing.

## Maintainer verification

`bin/project-docs.ts` is the sole editable implementation. `bin/project-docs.js` is generated CommonJS and is never edited directly. The runtime and `bin/project-docs.test.js` use only Node's standard library.

From the repository root, regenerate with pinned TypeScript 7.0.2, compare the generated artifact, then run the test:

```sh
tmp="$(mktemp -d)" && npx --yes --package typescript@7.0.2 tsc skills/audit-project-docs/bin/project-docs.ts --target es2022 --module commonjs --skipLibCheck --lib es2022,dom --outDir "$tmp" && cmp skills/audit-project-docs/bin/project-docs.js "$tmp/project-docs.js" && node --test skills/audit-project-docs/bin/project-docs.test.js
```

Completion: compilation succeeds, `cmp` reports parity, and the Node test exits 0.
