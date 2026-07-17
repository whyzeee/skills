---
name: new-feature
description: Use when interviewing a user to resolve and capture project behavior or feature decisions, then document decisions and ticket follow-up work.
---

# New Feature

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before selecting or writing a destination. It owns canonical document kinds and meaning boundaries. Use [`audit-project-docs`](../audit-project-docs/SKILL.md) **Fix** after every write; it is the sole deterministic repair and validation implementation.

Load [`requirement-gathering`](../requirement-gathering/SKILL.md) for the interview discipline: scoped topic, one question at a time, no transcript or scratch source of truth, challenge contradictions, and stop at resolved understanding. This skill adds only the project-documentation capture, candidate-diff, validation, and follow-up-ticket rules.

When the topic would create, supersede, or consolidate a decision or local issue, load its lifecycle in [`project-docs-format/references/document-kinds.md`](../project-docs-format/references/document-kinds.md) before choosing the next question or proposing a destination. Treat every applicability, identifier, history, and duplicate gate as part of the atomic fact and candidate diff.

## Protect the project

1. Resolve the user-selected directory with `git -C <selected-directory> rev-parse --show-toplevel`. Refuse all writes if it is not inside a Git worktree; do not initialize Git from this skill. Completion: the selected root is the Git top level.
2. Record `git status --short --untracked-files=all`, including whether any likely destination is dirty or untracked. Never stage or commit interview changes. Completion: the pre-interview worktree state is retained.
3. Require a user-selected topic. If none was supplied, ask only for the topic before inspecting. Express it as a concrete decision, term, boundary, behavior, responsibility, or relationship to resolve. Completion: one topic defines the interview scope.

## Establish the topic

Inspect only evidence relevant to the selected topic:

1. Start with the smallest relevant portions of `README.md` and canonical documentation. Follow direct documentation links and `Source References` only when they bear on the topic.
2. Inspect only source, configuration, or tests needed to test current implementation claims or expose a specific ambiguity. Do not inventory the repository, audit unrelated documentation, or search for additional topics.
3. List unresolved claims internally and discard any outside the selected topic or settled by decisive repository evidence. A user-supplied claim is resolved only after the user explicitly confirms its intended meaning.

Completion: every candidate question names a material ambiguity in the selected topic and cites the evidence or conflict that makes it unresolved.

## Ask the interview

Follow the `requirement-gathering` loop until a stop condition applies. After each resolved answer, capture it immediately through this documentation-specific extension:

1. State the exact fact, its canonical destination, and the proposed edit. Before asking for confirmation, make a disposable OS-temporary Git copy of the current worktree, apply the proposed edit there, and run `audit-project-docs` **Fix**. Record its status plus every candidate path and byte change, then remove the copy. Status 1 keeps the fact unresolved until the proposed content is corrected; status 2 stops as a failed invocation.
2. Ask one confirmation question covering the exact fact and candidate diff. Explicitly disclose every deterministic change outside the destination and every candidate change to a path that was already dirty or untracked; require approval to change those current contents. A declined or revised proposal remains unresolved.
3. Immediately apply the confirmed proposed edit to the real destination, preserving unrelated content, then run `audit-project-docs` **Fix**. Update the timestamp only for a meaningful authored-content change. Status 0 captures the fact only when actual changed paths match the approved candidate; an unexpected path or byte change stops the interview and is reported. Status 1 blocks the next question until approved semantic corrections are applied and Fix passes, or until every error is reported and the interview stops. Status 2 stops as a failed invocation. Do not retain the answer anywhere else.

After validation, reassess only the selected topic and ask the next one question.

## Offer setup before a missing destination

When canonical documentation is missing or no canonical destination exists for the selected topic, make the next single question whether to switch to `setup-project-docs` for project documentation initialization. If the user accepts, stop this interview and invoke `setup-project-docs`; do not write from this skill. If the user declines setup, continue with the one-document destination below. Completion: setup was accepted and handed off, or explicitly declined before any missing-destination write.

## Create one missing destination

After setup is declined and no canonical destination exists, load the applicable document-kind reference and make that document the first atomic fact to resolve. Inspect topic evidence and draft exactly one complete substantive document; do not create adjacent files, directories without that file, placeholders, `.gitkeep`, speculative content, or manufactured `None`.

Run the complete draft through candidate-validation step 4, then use step 5's single question to ask whether that exact document and full candidate diff are authoritative. Treat partial answers and corrections as unresolved input to the next complete draft, not as resolved facts; do not confirm or buffer them in another artifact. Once the user confirms, write and validate it immediately through step 6. If evidence and answers cannot support every required section, stop with the missing evidence rather than creating an invalid destination.

## Stop and hand off

Stop immediately when any one condition is true:

- no material ambiguity remains in the selected topic;
- every resolved fact is captured and remaining gaps require evidence that is unavailable;
- validation cannot reach status 0 without an unresolved semantic decision;
- the user explicitly stops.

Before finishing, capture every resolved project behavior or feature decision in the applicable decision document through the same candidate-diff, approval, and Fix path above. If the session leaves implementation work that should become issues, use `/to-tickets` skill to draft the slices, and get the user's approval for the slice list and blockers before creating issues. Then confirm that every resolved fact has one canonical owner, the final write received status 0 from shared Fix, and no transcript or neighboring placeholder exists. Compare final Git status with the baseline, report every interview-created change separately from pre-existing changes, and leave all changes unstaged and uncommitted.
