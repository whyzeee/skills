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

## Role guide

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

Roles come from the project. Names such as developer, data engineer, and operator are examples rather than required roles.

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

Allocate the identifier as the highest existing decision number plus one, zero-padded to four digits. Never reuse a gap or renumber a file. An accepted decision permits only non-semantic correction. An architecture change creates a new decision, marks the old decision `superseded`, and links both directions.

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

Use local issues only when no external tracker applies. A GitHub or GitLab remote is evidence of an external tracker unless issues are explicitly disabled; absent or custom remote evidence requires an applicability decision.

Allocate the identifier as the highest existing local-issue number plus one, zero-padded to four digits. Never reuse a gap or renumber a file. Merge duplicates automatically only when every duplicate is `open`: retain the lowest identifier, combine compatible content, repair inbound links, and remove redundant files without reusing their numbers. Any other status or conflicting content requires a human decision.
