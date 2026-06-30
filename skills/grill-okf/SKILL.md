---
name: grill-okf
description: Interview the user relentlessly about a plan, design, or domain, then write resolved decisions and glossary terms as OKF concept files under docs/app/. Use when the user wants to stress-test a plan, pin down domain language, or record design decisions in the project's OKF knowledge base.
---

# /grill-okf

Run a relentless interview about a plan, design, or domain problem. Capture resolved decisions as OKF concept files under `docs/app/decisions/` and glossary terms under `docs/app/concepts/`. Place each concept in the correct context subdirectory; infer the context from the codebase or ask the user if it is ambiguous.

## Quick start

1. Ask the user what they want to grill: a feature, a design, a domain model, or a current problem.
2. Interview them one question at a time. Probe edge cases, dependencies, and terminology.
3. Each time a decision or term resolves, write it as an OKF concept file.
4. Run `python -m scripts.okf.cli log "Created/updated <relative-path>"` for each concept written or meaningfully changed.
5. At the end of the session, run `python -m scripts.okf.cli index` to regenerate all `index.md` files.
6. Optionally run `python -m scripts.okf.cli validate` and offer to fix any broken links or missing frontmatter before finishing.

## Concept templates

A decision file (`docs/app/decisions/<slug>.md`):

```markdown
---
type: Decision
title: <Short decision title>
description: <One-line summary of the decision>
timestamp: <ISO 8601>
---

# Context

What forced the decision.

# Decision

What we decided.

# Consequences

What this makes easier, harder, or impossible.
```

A glossary term (`docs/app/concepts/<context>/<slug>.md`):

```markdown
---
type: Concept
title: <Canonical term>
description: <One-line definition>
timestamp: <ISO 8601>
---

# Definition

Precise meaning in this project.

# Examples

Concrete examples of correct and incorrect usage.

# Related

Links to related concepts and decisions.
```

## Rules

- Ask one question at a time. Wait for an answer before the next question.
- When the user uses vague or overloaded terms, propose a precise canonical term and write it to `docs/app/concepts/` in the correct context subdirectory.
- When a trade-off resolves, write it to `docs/app/decisions/`.
- Use `python -m scripts.okf.cli index` to regenerate `docs/app/index.md` and sub-directory indexes after adding or changing concepts. Do not hand-edit `index.md` files.
- Use `python -m scripts.okf.cli log "Created/updated <relative-path>"` for every concept created or meaningfully changed.
- See `docs/agents/okf-spec.md` for the authoritative bundle structure, required frontmatter, and cross-link conventions.
- Do not create concepts or decisions before the user agrees on the content.
- Bundle-relative links inside OKF should start from `docs/app/` with a `.md` extension (e.g., `/decisions/0001-use-postgres.md`).
