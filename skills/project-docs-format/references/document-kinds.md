# Document kinds

The frontmatter `type` selects exactly one template below. H1 headings appear once and in the listed order. H2-and-deeper headings may appear within the applicable H1 section. A required section contains substantive content or the literal `None`.

## Interface and logic

Types: `interface`, `logic`.

```md
# Purpose
# Components
# Relationships
## Within This Category
## Across Categories
# Source References
```

`Within This Category` describes links among documents of the same category. `Across Categories` describes links to data, interface, or logic documents in other categories.

## Data object

Type: `data`.

```md
# Purpose
# Fields
# Relationships
## Within Data
## Across Categories
# Constraints
# Indexes
# Source References
```

`Fields`, `Constraints`, and `Indexes` contain exactly these table schemas when entries exist:

```md
| Field | Type | Required | Description |
|---|---|---|---|
| <field> | <type> | <required> | <description> |

| Name | Type | Definition |
|---|---|---|
| <constraint> | <type> | <definition> |

| Name | Fields | Definition |
|---|---|---|
| <index> | <fields> | <definition> |
```

Use literal `None` instead of an empty table. `Within Data` covers relationships to other data objects; `Across Categories` covers relationships to interface or logic documents.

## Guide

Type: `guide`.

```md
# Purpose
# Responsibilities
# Prerequisites
# Workflows
# Verification
# Troubleshooting
# Related Documentation
```

Guides are organized by use case and audience need, not by a required role taxonomy or directory shape. A guide may serve one role, many roles, or no named role; choose the structure that best fits the project type and guide purpose. Names such as developer, data engineer, and operator are examples only.

## Specialized agent

Type: `agent`.

```md
# Identity
# Scope
# Responsibilities
# Documentation Navigation
# Documentation Maintenance
# Constraints
# Related Documentation
```

Use this kind only for a specialized identity or workflow. Common instructions remain in root `AGENTS.md`.

## Decision

Type: `decision`. Filename: `NNNN-short-title.md`.

```md
# Status
# Context
# Decision
# Alternatives Considered
# Consequences
# Related Documentation
```

`Status` is exactly one of `proposed`, `accepted`, `superseded`, or `rejected`.

### Decision lifecycle

Before creating a decision, inspect `docs/decisions/NNNN-*.md` names in the current tree and reachable Git history. Allocate the maximum numeric prefix ever observed plus one, zero-padded to four digits; start at `0001` only when none has ever existed. Existing and deleted identifiers are immutable: never fill a gap, renumber, or reuse a removed number.

An `accepted` decision permits non-semantic corrections only. When architecture departs from an accepted decision, create a new decision under the next identifier, set the old decision to `superseded`, and add relative links in both documents. The new decision states the replacement and its status; never rewrite the accepted history to make it appear current.

Completion: allocation considered every existing identifier, each status is controlled, and shared validation passes with both directions of every supersession link intact.

## Domain glossary

Type: `domain`. Canonical path: `docs/DOMAIN.md`.

```md
# Scope
# Domains
# Terms
# Cross-Domain Terms
# Relationships
```

`Domains` and `Terms` use exactly these table schemas:

```md
| Domain | Definition | Boundaries |
|---|---|---|
| <domain> | <definition> | <boundaries> |

| Term | Domain | Definition |
|---|---|---|
| <term> | <domain> | <definition> |
```

`Cross-Domain Terms` makes overloaded meanings and their boundaries explicit. Keep this document implementation-free: capture domain boundaries, ubiquitous language, meanings, and relationships. Tactical domain-driven-design concepts appear only when the project actually uses them.

## Application structure

Type: `structure`. Canonical path: `docs/app/STRUCTURE.md`.

This kind has no H1 headings. After frontmatter it contains only the generated table:

```md
| Path | Kind | Description |
|---|---|---|
| data/ | Directory | Data-system documentation. |
| data/postgres/public/tables/customers.md | Document | Customer table schema. |
```

Generation and validation semantics are defined in [`validation-rules.md`](validation-rules.md).

## Local issue

Type: `issue`. Filename: `NNNN-short-title.md`.

```md
# Status
# Problem
# Acceptance Criteria
## To-do Actions

- [ ] <action>

# Notes
# Related Documentation
```

`Status` is exactly one of `open`, `in-progress`, `blocked`, or `closed`.

### Local-issue applicability and lifecycle

Inspect configured Git remotes before creating or consolidating a local issue. A GitHub or GitLab remote means its external tracker applies unless the user explicitly states that repository issues are disabled. When no remote exists or every remote is custom, ask exactly once whether this project uses local issue documents; create none unless the answer is yes.

Before creating an applicable local issue, inspect `docs/issues/NNNN-*.md` names in the current tree and reachable Git history. Allocate the maximum numeric prefix ever observed plus one, zero-padded to four digits; start at `0001` only when none has ever existed. Existing and deleted identifiers are immutable: never fill a gap, renumber, or reuse a removed number.

Before adding an issue, compare its problem and acceptance criteria with existing local issues. Merge duplicates automatically only when every duplicate has status `open` and their meaning is compatible: retain the lowest identifier, combine the substantive content once, repair every inbound documentation link to the retained path, and remove the redundant files through the calling workflow's approved candidate diff. This automatic consolidation never bypasses the calling workflow's source-authority or mutation-approval gates; during migration it runs only after every source and included fact set is explicitly approved. A duplicate that is `in-progress`, `blocked`, or `closed`, or any semantic conflict, requires an explicit user resolution; preserve every file until then.

Completion: tracker applicability is established, every identifier is stable, every automatic merge satisfies all-open and compatible-content gates, all inbound links resolve, and shared validation passes.
