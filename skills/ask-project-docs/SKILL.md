---
name: ask-project-docs
description: Use when interviewing a user to resolve and immediately capture project knowledge about one selected topic.
---

# Ask Project Documentation

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before selecting or writing a destination. It owns canonical document kinds and meaning boundaries. Use [`audit-project-docs`](../audit-project-docs/SKILL.md) **Fix** after every write; it is the sole deterministic repair and validation implementation.

This is a topic-scoped interview, not a repository audit. Ask exactly one question at a time, wait for its answer, and keep no transcript, interview note, scratch document, or second source of truth.

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

Repeat this loop until a stop condition applies:

1. Choose the single unresolved question whose answer would remove the most downstream uncertainty. Prefer, in order, an authority conflict, a boundary or responsibility affecting several facts, an overloaded or cross-domain term, then a narrower behavior or relationship. Do not ask a batch or preview later questions.
2. Ask that one question directly. When wording is overloaded, name the competing meanings and domains. When an abstract definition could hide disagreement, ask one concrete scenario that distinguishes the alternatives.
3. Test the answer against relevant evidence and prior resolved facts. Challenge a conflict with one concrete counterexample or boundary case rather than accepting inconsistent language. If the answer is tentative, contradictory, or missing authority, keep the claim unresolved and ask the next single highest-impact clarification.
4. State the exact fact, its canonical destination, and the proposed edit. Before asking for confirmation, make a disposable OS-temporary Git copy of the current worktree, apply the proposed edit there, and run `audit-project-docs` **Fix**. Record its status plus every candidate path and byte change, then remove the copy. Status 1 keeps the fact unresolved until the proposed content is corrected; status 2 stops as a failed invocation.
5. Ask one confirmation question covering the exact fact and candidate diff. Explicitly disclose every deterministic change outside the destination and every candidate change to a path that was already dirty or untracked; require approval to change those current contents. A declined or revised proposal remains unresolved.
6. Immediately apply the confirmed proposed edit to the real destination, preserving unrelated content, then run `audit-project-docs` **Fix**. Update the timestamp only for a meaningful authored-content change. Status 0 captures the fact only when actual changed paths match the approved candidate; an unexpected path or byte change stops the interview and is reported. Status 1 blocks the next question until approved semantic corrections are applied and Fix passes, or until every error is reported and the interview stops. Status 2 stops as a failed invocation. Do not retain the answer anywhere else.

After validation, reassess only the selected topic and ask the next one question.

## Create one missing destination

When no canonical destination exists, load the applicable document-kind reference and make that document the first atomic fact to resolve. Inspect topic evidence and draft exactly one complete substantive document; do not create adjacent files, directories without that file, placeholders, `.gitkeep`, speculative content, or manufactured `None`.

Run the complete draft through candidate-validation step 4, then use step 5's single question to ask whether that exact document and full candidate diff are authoritative. Treat partial answers and corrections as unresolved input to the next complete draft, not as resolved facts; do not confirm or buffer them in another artifact. Once the user confirms, write and validate it immediately through step 6. If evidence and answers cannot support every required section, stop with the missing evidence rather than creating an invalid destination.

## Stop and hand off

Stop immediately when any one condition is true:

- no material ambiguity remains in the selected topic;
- every resolved fact is captured and remaining gaps require evidence that is unavailable;
- validation cannot reach status 0 without an unresolved semantic decision;
- the user explicitly stops.

Before finishing, confirm that every resolved fact has one canonical owner, the final write received status 0 from shared Fix, and no transcript or neighboring placeholder exists. Compare final Git status with the baseline, report every interview-created change separately from pre-existing changes, and leave all changes unstaged and uncommitted.
