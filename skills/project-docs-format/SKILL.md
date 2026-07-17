---
name: project-docs-format
description: Use when explaining the repository-native project documentation contract or when another project-docs skill needs its canonical schemas and rules.
---

# Project Documentation Format

## Contract boundary

This skill is the single source of truth for the repository-native documentation contract. Direct invocation explains the contract; it does not inspect, create, move, validate, or modify repository files.

Workflow skills load this contract instead of restating it:

- `setup-project-docs` selects and creates an approved shape.
- `ask-docs` navigates documentation and verifies implementation claims.
- `audit-project-docs` validates and deterministically repairs the contract.
- `new-feature` captures resolved feature decisions.

If the user only wants to sharpen an idea or firm down requirements without creating documentation, use [`requirement-gathering`](../requirement-gathering/SKILL.md) instead of this contract.

## Canonical shape

```text
README.md
AGENTS.md
docs/
├── DOMAIN.md
├── app/
│   ├── STRUCTURE.md
│   ├── data/          # when applicable
│   ├── interface/     # when applicable
│   └── logic/         # when applicable
├── guides/
├── agents/            # specialized roles and workflows only
├── decisions/
└── issues/            # only when no external tracker applies
```

`README.md` states project purpose, an architecture overview, and basic onboarding. `AGENTS.md` contains instructions common to all agents. Detailed authored documentation lives under `docs/`; specialized identities and workflows live under `docs/agents/` rather than the root instructions.

The shape is guidance, not scaffolding. Create a directory only when it contains an applicable, substantive document or asset. Missing expected or applicability-dependent material is a consolidated warning; an existing malformed document is an error.

Use one documentation tree at the repository root by default, including in a monorepo. A subproject gets an independent tree only after explicit selection and only when it has its own lifecycle, audience, and onboarding path.

### Application organization

`docs/app/` permits only `STRUCTURE.md` and the `data/`, `interface/`, and `logic/` categories at its top level. Direct files and other top-level directories are invalid.

- `data/` follows technology → namespace → object kind → object, for example `data/postgres/public/tables/customers.md`.
- `interface/` follows a user-facing surface such as GUI, CLI, TUI, API, or operations—not source directories.
- `logic/` follows a business capability—not source directories. Group small helpers beneath the capability they serve.

Create dedicated component documentation only when architecture, behavior, ownership, or operations justify it. Assets live beside the applicable documentation; no dedicated asset directory is required.

## Authored-document contract

Every authored `.md` file under `docs/` has exactly this five-field frontmatter subset:

```yaml
---
type: <document-kind>
title: <title>
description: <one-sentence-description>
tags:
  - <tag>
timestamp: 'YYYY-MM-DDTHH:mm:ssZ'
---
```

Controlled `type` values are `data`, `interface`, `logic`, `guide`, `agent`, `decision`, `domain`, `structure`, and `issue`.

Only scalar `type`, `title`, `description`, and `timestamp`, plus a block-list `tags` or `tags: []`, are supported. All five keys are required; unknown keys, aliases, anchors, nested values, multiline scalars, comments that change parsing, and other YAML features are errors. Tags are project-defined, trimmed, and compared case-insensitively. Root Markdown files are outside this frontmatter contract.

The timestamp records the last meaningful content change in ISO-8601 UTC. Mechanical formatting, deterministic repair, validation, and index regeneration leave it unchanged; Git and filesystem times do not determine it.

The frontmatter `title` is the sole document title. Do not repeat it as an H1. Each kind instead has one exact ordered sequence of H1 section headings: missing, reordered, or additional H1 headings are errors. H2 and deeper subsections may refine a required section. Every required section contains substantive content or the literal `None`; headings alone are invalid, and repair never invents content or inserts `None`.

When authoring, explaining, or checking a specific document kind, load [`references/document-kinds.md`](references/document-kinds.md) for its exact headings, tables, status values, and numbering rules. Completion means the selected kind matches every rule in that reference.

## Naming and relationships

Ordinary authored documents use lowercase kebab-case filenames and `.md`. Uppercase names are reserved for canonical `README.md`, `AGENTS.md`, `docs/DOMAIN.md`, and `docs/app/STRUCTURE.md`. Decision and local-issue names use `NNNN-short-title.md`. `.markdown` files under `docs/` are invalid.

Relationships to existing internal documents use relative inline links: `[label](relative/path.md)`. Internal reference-style links are unsupported; reference-style syntax remains available for external URLs. Use forward slashes in every displayed or linked path.

Source References use a fixed table whose displayed path is repository-relative and whose clickable target is relative to the document:

```md
| Path | Component | Description |
|---|---|---|
| [`src/example.ts`](../../../src/example.ts) | `Example.run` | Executes the workflow. |
```

The displayed path and target must resolve to the same repository entry. A directory display ends in `/`. Paths omit line numbers, may leave `docs/`, and never escape the repository root.

When explaining or applying links, generated structure, assets, filesystem safety, secrets, or validation severity, load [`references/validation-rules.md`](references/validation-rules.md). Completion means every applicable rule there has been accounted for.

## Authority

Source is authoritative for current implementation and runtime behavior. Canonical decisions, role guidance, and domain terminology are authoritative for their own concerns unless source establishes implementation drift. State contradictions rather than silently rewriting either side.
