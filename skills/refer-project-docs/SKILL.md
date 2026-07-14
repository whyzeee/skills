---
name: refer-project-docs
description: Use when answering questions about a project through its canonical documentation and verifying current implementation facts in source.
---

# Refer to Project Documentation

## Contract

Load [`project-docs-format`](../project-docs-format/SKILL.md) before navigating. It owns the canonical repository shape, document kinds, and meaning boundaries. This workflow answers questions without changing the project.

## Select the project and question

1. Use the user-selected directory, or the current directory when none is named. Resolve its Git root when available; read-only reference remains available outside Git. Completion: one project root and one concrete question are selected.
2. Keep inspection scoped to evidence needed for that question. Do not inventory unrelated source or turn reference work into a documentation audit. Completion: every inspected path can affect the answer.

## Navigate canonical knowledge

Follow this order, skipping an inapplicable layer without changing the order of those that remain:

1. Read `README.md` for project purpose, architecture overview, and onboarding context.
2. Read `docs/DOMAIN.md` for domain boundaries and terminology relevant to the question.
3. Read `docs/app/STRUCTURE.md` to locate relevant application documentation.
4. Read only the relevant guides, decisions, root `AGENTS.md`, specialized agent documents, and data, interface, or logic documents. Follow their direct links and `Source References` only when they bear on the question.
5. Inspect the smallest relevant source, configuration, and tests needed to verify current implementation or runtime claims.

Assess whether an expected layer is applicable and substantive from project evidence rather than brittle heading checks. Accumulate every missing expected document encountered during this navigation; do not interrupt the answer with separate warnings.

Completion: every available applicable layer has been consulted in order, and each current implementation or runtime claim has relevant source evidence.

## Apply authority

- Source, configuration, and tests own current implementation and runtime behavior.
- Canonical decisions own recorded architectural intent and history.
- `AGENTS.md`, specialized agent documents, and role guides own role guidance.
- `docs/DOMAIN.md` owns project terminology and domain boundaries.

When source contradicts documentation about current behavior, answer from source, name the conflicting documentation and source paths, and state that the documentation appears stale. Preserve the documented intent as intent rather than rewriting it as implementation fact.

Completion: each claim follows its owning evidence, and every contradiction is explicit.

## Answer and offer maintenance once

1. Answer the question directly. Cite only concise repository-relative paths in backticks, including both documentation and source where relevant. Omit line numbers and labels such as “undocumented” or “code-derived.”
2. If expected documents are missing or source contradicts documentation, add one consolidated warning list after the answer and make one documentation-maintenance offer covering every listed gap and contradiction. Do not make per-file offers or withhold the answer while awaiting a response.
3. If the user declines or ignores the offer, finish with the answer already provided; missing documentation never blocks reference through available `README.md` context and source.
4. If the user accepts, end this read-only workflow and begin a separate approved documentation workflow. Do not write, stage, or commit from this reference workflow.

Completion: the question is answered with repository-relative evidence, missing documents and contradictions were reported at most once, any maintenance offer was made once, and the project is byte-for-byte unchanged.
