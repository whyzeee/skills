---
name: setup-project-docs
description: Use when setting up canonical repository-native documentation for a new or undocumented project.
---

# Setup Project Documentation

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before inspecting or proposing documentation. It owns the canonical shape and authored-document rules. This skill selects the smallest project-specific shape, writes only approved substantive documents, and delegates deterministic repair and validation to [`audit-project-docs`](../audit-project-docs/SKILL.md).

This workflow is for fresh setup. If existing documents contain knowledge that must be moved, merged, or retired to reach the canonical shape, preserve them and stop after the inventory; use the migration workflow rather than creating a competing source of truth.

## Select the project

1. Resolve the selected directory with `git -C <selected-directory> rev-parse --show-toplevel`. If it is not in Git, ask once whether to initialize that directory. Run `git init` only after approval and stop if declined; a remote is optional. Completion: the selected root is the Git top level.
2. Default to one documentation tree at that root. A nested tree is eligible only when the user explicitly selects it and evidence shows its own lifecycle, audience, and onboarding path; otherwise retain the root tree. Completion: exactly one documentation root is selected and any nested choice records all three boundaries.
3. Capture `git status --short --untracked-files=all` before writing. Never stage or commit setup changes. Completion: the baseline worktree state is retained for the final review.

## Inspect

Inspect the real project before proposing files:

- Read the root `README.md`, `AGENTS.md`, and existing documentation when present.
- Inventory tracked and untracked project files without traversing `.git`, dependency caches, or generated build output.
- Read the smallest relevant set of source entry points, manifests, build/deployment configuration, and tests needed to establish project purpose, architecture, onboarding commands, technologies, and real contributor or operational roles.
- Identify existing documentation whose authority or destination is unclear. Preserve it for migration instead of copying its claims into a new canonical file.

Completion: every proposed statement can cite repository evidence, and purpose, architecture, onboarding, technologies, roles, and existing documentation are each either evidenced or explicitly unknown.

## Propose once

Load [`project-docs-format/references/document-kinds.md`](../project-docs-format/references/document-kinds.md) for every applicable authored document kind. Build one concise proposal listing each file to create or update, its purpose, and the evidence that makes it substantive.

Keep the proposal minimal:

- `README.md` covers only purpose, architecture overview, and simple onboarding.
- Root `AGENTS.md` contains instructions common to every agent.
- Specialized identities or workflows belong under `docs/agents/` and are proposed only when the project demonstrates that specialization.
- Detailed application documents are organized by data technology/namespace/object, user-facing interface, or business capability—not by source-directory shape.
- `docs/app/STRUCTURE.md` is proposed only with substantive application documentation for it to index.
- Directories exist only as parents of proposed files.

Present the complete file list before writing and ask the user to approve it as-is or select a subset. A declined file is out of scope for this run; do not replace it with a placeholder or a neighboring document.

Completion: every proposed file is approved or declined, and no write has occurred.

## Write the approved set

1. Re-read the evidence for each approved file and write substantive project-derived content using the exact contract for its kind. Use the current UTC timestamp for authored content created or meaningfully changed in this run. Completion: every claim is supported by inspected project evidence or an explicit user decision.
2. Preserve existing unrelated content and worktree changes. Create no empty directory, `.gitkeep`, placeholder, speculative role guide, empty required section, or manufactured `None`. If an approved document lacks enough evidence for a required section, leave it unwritten and report the missing decision. Completion: each written file is both approved and substantive.
3. Keep `README.md`, common root instructions, and specialized documentation within their boundaries from the proposal. Completion: no meaning is duplicated across those surfaces.

Do not add files beyond the approved list. New evidence that would require another file ends this run with a follow-up proposal rather than an unapproved write.

## Validate and hand off

1. Run the `audit-project-docs` **Fix** workflow against the selected Git root. Completion: its shared validator has applied only deterministic repairs and completed its final check.
2. If validation reports semantic errors, repair only approved content whose intended meaning is already established. Missing meaning becomes an unresolved decision; never fill it with invented content or `None`. Rerun **Fix** after each approved correction. Completion: status 0 is reached, including warnings, or every blocking error is reported as unresolved.
3. Run `git status --short --untracked-files=all` and compare it with the baseline. Report every resulting documentation path, distinguish pre-existing changes, and leave all setup changes unstaged and uncommitted. Completion: the user receives the exact reviewable worktree delta and validation result.

Setup is complete only when every written path was approved, shared deterministic validation ran after the final write, and no setup change was staged or committed.
