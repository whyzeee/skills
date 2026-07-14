# Project documentation skills

Five focused agent skills maintain repository-native project knowledge without adding tooling to target projects.

## Skills

- `/project-docs-format` — explain the canonical documentation contract without inspecting or changing a project.
- `/setup-project-docs` — initialize or migrate an approved documentation shape safely.
- `/refer-project-docs` — answer project questions through canonical knowledge and verify current behavior in source.
- `/audit-project-docs` — check documentation, repair deterministic defects, and audit documentation related to changed source.
- `/ask-project-docs` — resolve one project-knowledge topic at a time and immediately capture confirmed facts.

## Composition

`project-docs-format` owns the shared contract. The four workflow skills load it rather than restating schemas. `setup-project-docs` and `ask-project-docs` reuse `audit-project-docs` for deterministic repair and validation; `refer-project-docs` stays read-only and verifies implementation claims directly against source.

The validator is bundled under `skills/audit-project-docs/bin/`. Target projects receive Markdown only: no validator copy, package manifest, compiler configuration, or test framework.

## Maintainer verification

From the repository root, regenerate the dependency-free CommonJS runtime with pinned TypeScript 7.0.2, compare it with the committed artifact, and run the Node-standard-library test:

```sh
tmp="$(mktemp -d)" && npx --yes --package typescript@7.0.2 tsc skills/audit-project-docs/bin/project-docs.ts --target es2022 --module commonjs --skipLibCheck --lib es2022,dom --outDir "$tmp" && cmp skills/audit-project-docs/bin/project-docs.js "$tmp/project-docs.js" && node --test skills/audit-project-docs/bin/project-docs.test.js
```

Each skill documents its own invocation, workflow, and completion criteria in `skills/<name>/SKILL.md`.
