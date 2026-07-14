---
name: setup-project-docs
description: Use when setting up canonical repository-native documentation or migrating existing and legacy project knowledge into it.
---

# Setup Project Documentation

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before inspecting or proposing documentation. It owns the canonical shape and authored-document rules. This skill selects the smallest project-specific shape, writes only approved substantive documents, and delegates deterministic repair and validation to [`audit-project-docs`](../audit-project-docs/SKILL.md).

When setup would create, migrate, supersede, or consolidate a decision or local issue, load its lifecycle in [`project-docs-format/references/document-kinds.md`](../project-docs-format/references/document-kinds.md) before proposing paths or content. Before a lifecycle mutation, make a disposable OS-temporary Git copy of the exact worktree, apply the complete proposed operation and `audit-project-docs` **Fix** there, and capture the full path-and-byte delta. Disclose every changed or removed path, including unrelated and already-dirty files, and obtain explicit approval for that exact delta. Remove the candidate, apply the approved operation to the project, rerun **Fix**, and require the resulting path-and-byte delta to match the approved candidate exactly; stop and report any mismatch. File-list, mapping, source-authority, and retirement approvals remain required but do not replace this mutation approval.

After inspection, choose one branch:

- **Fresh setup:** no authoritative knowledge needs relocation. Use **Propose fresh setup** and **Write the approved fresh set**.
- **Migration:** existing knowledge must move, merge, or retire to reach the canonical shape. Use **Migrate existing documentation**; do not run the fresh branch in parallel.

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

## Propose fresh setup

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

## Write the approved fresh set

1. Re-read the evidence for each approved file and write substantive project-derived content using the exact contract for its kind. Use the current UTC timestamp for authored content created or meaningfully changed in this run. Completion: every claim is supported by inspected project evidence or an explicit user decision.
2. Preserve existing unrelated content and worktree changes. Create no empty directory, `.gitkeep`, placeholder, speculative role guide, empty required section, or manufactured `None`. If an approved document lacks enough evidence for a required section, leave it unwritten and report the missing decision. Completion: each written file is both approved and substantive.
3. Keep `README.md`, common root instructions, and specialized documentation within their boundaries from the proposal. Completion: no meaning is duplicated across those surfaces.

Do not add files beyond the approved list. New evidence that would require another file ends this run with a follow-up proposal rather than an unapproved write.

## Migrate existing documentation

Use this branch instead of the fresh proposal/write branch.

1. **Inventory before mapping.** Inventory root context material such as `README.md`, `AGENTS.md`, `CLAUDE.md`, and `CONTEXT.md`; documentation inside and outside `docs/`; and legacy knowledge-base content, including bundles, indexes, logs, specifications, and agent instructions. For every substantive source, record its topics, current authority, tracked or untracked state, inbound links, and conflicts or overlap with other sources. Do not write a destination yet. Completion: every existing and legacy source is accounted for, including dirty files and content whose authority is unknown.
2. **Map, do not move.** Present one migration table with source path or paths, proposed canonical destination, action (`retain`, `rewrite`, or `move`), authority, and evidence. Ask the user to approve each mapping before changing either side. If multiple sources map to one destination, ask which source is authoritative and leave the mapping blocked; never auto-merge or choose based on age, path, or apparent completeness. Completion: every mapping is approved, declined, or blocked by an explicit authority decision.
3. **Build replacements without retiring originals.** Write only approved destinations from the selected authoritative source. Include another source or fact set only when it is named in the approved mapping and the user explicitly approves its inclusion; never silently blend competing or merely complementary claims. Keep every legacy original in place while its replacement is being built. A replacement is eligible for retirement only when it is substantive, conforms to its document-kind contract, and owns each migrated fact exactly once. Completion: each candidate replacement contains only approved inputs, is substantive, and no legacy original has been changed or removed.
4. **Validate the candidate final tree.** Make a disposable OS-temporary Git copy of the current worktree, remove only the originals proposed for retirement from that copy, and run the read-only `audit-project-docs` **Check** there. This validates the exact candidate bytes while keeping every target original untouched. Record the result and remove the temporary copy. Completion: the exact proposed final document set passes the shared validator without candidate mutation, or the migration stops with target originals intact and every error reported.
5. **Approve retirement after validation.** Show the validated replacement and then ask separately whether each superseded original may be removed. A decline retains the original and blocks canonical ownership of its duplicated facts; report that conflict instead of declaring migration complete. Completion: every proposed removal has post-validation approval or is explicitly deferred.
6. **Apply approved retirements without touching the index.** Remove only approved originals. For tracked whole-file moves, keep destination content similar enough for Git rename detection where practical without compromising the required substantive content, and verify detection with `git diff --summary --find-renames`; never use `git mv` because it stages changes. Use Git as the recovery path and create no backup copy. Before removal, determine whether the exact current bytes are recoverable from `HEAD` or the index. If not—because the original is untracked or has unstaged worktree changes—disclose that loss of recovery and defer removal unless the user explicitly accepts it. Completion: approved originals are retired, declined or deferred originals remain byte-for-byte intact, and each canonical fact has one final owner.

Create no migration placeholder, empty directory, `.gitkeep`, speculative guide, or manufactured `None`.

## Validate and hand off

1. Run the `audit-project-docs` **Fix** workflow against the selected Git root. Completion: its shared validator has applied only deterministic repairs and completed its final check.
2. If validation reports semantic errors, repair only approved content whose intended meaning is already established. Missing meaning becomes an unresolved decision; never fill it with invented content or `None`. Rerun **Fix** after each approved correction. Completion: status 0 is reached, including warnings, or every blocking error is reported as unresolved.
3. Run `git status --short --untracked-files=all` and compare it with the baseline. Report every resulting documentation path, distinguish pre-existing changes, and leave all setup changes unstaged and uncommitted. Completion: the user receives the exact reviewable worktree delta and validation result.

Setup is complete only when every written or removed path was approved, shared deterministic validation ran after the final change, no canonical fact remains duplicated, and no setup change was staged or committed.
