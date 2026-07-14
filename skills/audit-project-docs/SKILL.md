---
name: audit-project-docs
description: Use when auditing repository-native project documentation, checking docs related to changed source, or applying deterministic repairs.
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

## Routine audit

Use this workflow by default when the user asks to audit documentation rather than only check its format.

1. Resolve the Git top level and record which documentation files are already dirty or untracked before any repair. Completion: the selected root and the pre-existing documentation changes are known.
2. Run **Fix** once. Retain every deterministic diagnostic and modified path; status 2 stops the audit. Completion: the complete documentation contract has been validated and every safe deterministic repair has either been applied or reported.
3. Build the changed-source set from staged, unstaged, renamed, deleted, and untracked paths. Compare tracked work to `HEAD`, include both sides of renames, and add `git ls-files --others --exclude-standard`; if `HEAD` does not exist, treat all tracked and untracked project files as changed. Exclude the documentation files being audited, but do not exclude a source path merely because of its language or directory name. Completion: every current Git change is classified as documentation or source.
4. Read valid `Source References` rows from the documentation. Associate changed source only by an exact repository-relative file path or by an explicit directory path ending `/`; a directory reference matches descendants on the path-segment boundary. Completion: each explicit match names both the changed source path and its related documents.
5. For each unmatched changed source path, inspect only enough of its diff or current contents to decide whether it changes documented behavior, interfaces, data shape, configuration, operations, architecture, or project language. Record either one semantic finding or a concrete reason no documentation inspection is warranted. Completion: every unmatched changed path is accounted for without deriving a map from names, ASTs, or source-tree shape.
6. Compare each matched document with the relevant changed source. Treat contradictory implementation facts, stale behavior, terminology choices, architecture changes, and multiple plausible destinations as semantic findings. Completion: every explicit source-to-document match has an evidence-backed result.
7. Present the semantic findings together, naming the source evidence, affected document, proposed meaning-level change, and whether that document was already dirty. Ask before every semantic edit; require an explicit choice before editing a dirty document. Apply only approved edits to the current contents and mark every declined item as deferred. Completion: every semantic finding is approved, resolved, or explicitly deferred.
8. After approved edits, run **Fix** again; otherwise retain the validation result from step 2. Completion: deterministic validation has run after the final mutation, every remaining error is reported, and the final summary separates deterministic repairs, semantic edits, and deferred findings.

Source References in project documentation are the only persistent source-to-document map. Keep audit notes in the result, not in a generated index, mirror, or configuration file.

## Full source audit

Enter this branch only when the user explicitly requests a full source-repository audit. Replace step 3's changed-source set with the user-approved source scope from tracked project files, then perform the same explicit-reference matching, evidence inspection, confirmation, and final validation. Do not infer this branch from a routine audit and do not turn its findings into a secondary map.

## Maintainer verification

`bin/project-docs.ts` is the sole editable implementation. `bin/project-docs.js` is generated CommonJS and is never edited directly. The runtime and `bin/project-docs.test.js` use only Node's standard library.

From the repository root, regenerate with pinned TypeScript 7.0.2, compare the generated artifact, then run the test:

```sh
tmp="$(mktemp -d)" && npx --yes --package typescript@7.0.2 tsc skills/audit-project-docs/bin/project-docs.ts --target es2022 --module commonjs --skipLibCheck --lib es2022,dom --outDir "$tmp" && cmp skills/audit-project-docs/bin/project-docs.js "$tmp/project-docs.js" && node --test skills/audit-project-docs/bin/project-docs.test.js
```

Completion: compilation succeeds, `cmp` reports parity, and the Node test exits 0.
