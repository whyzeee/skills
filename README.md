# skills

A personal collection of agent skills that turn repo folders into usable knowledge and repeatable workflows.

## Goal

Provide skills that harness can invoke to initialize, populate, and query an [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) (Open Knowledge Format) knowledge base inside any software or data project. The first three skills focus on project onboarding and memory:

- `/setup-okf` — infer purpose, domain model, and features from existing docs; scaffold an OKF bundle under `docs/app/` with nested context subdirectories when the codebase calls for them; discover undocumented systems and decisions; migrate `README.md`/`CONTEXT.md` into `docs/app/index.md` without deleting them; set up triage labels, issue tracker, and agent instructions under `docs/agents/`; run `/grill-okf` only if gaps remain.
- `/grill-okf` — interview the user to capture purpose, domain model, and decisions, then write them as OKF concept files.
- `/refer-okf` — answer questions by reading the OKF bundle and grounding responses in the repo's own knowledge.

## Structure

`/setup-okf` lays out the OKF bundle like this:

- `docs/app/index.md` — migrated from `README.md` and `CONTEXT.md` (originals stay put).
- `docs/app/decisions/` — design decisions, grouped by context only when the codebase has clear bounded contexts.
- `docs/app/concepts/` — glossary and domain terms, placed inside the inferred context subdirectory (can be nested, e.g. `concepts/<feature>/<role>/<term>.md`).
- `docs/app/systems/` — systems, grouped by component/service/bounded context (can be nested).
- `docs/app/tables/`, `docs/app/datasets/`, `docs/app/pipelines/` — data assets, grouped by source system, domain area, feature, or pipeline stage when helpful.
- `docs/agents/` — OKF agent instructions, including references to `/refer-okf`.

Existing ADRs are moved into `docs/app/decisions/` and removed from their old paths; user guides under `guides/` or `docs/guides/` are left untouched.

Context subdirectories include their own `index.md` for progressive disclosure, and the root `docs/app/index.md` may inline those indexes so `/refer-okf` can scan the whole knowledge base from one file. `/grill-okf` places each new term in the correct context path, inferring from the codebase or asking when ambiguous.

## Inspiration

Most projects lose context the moment the original developer steps away. Agent skills can keep that context alive by making the repo itself the source of truth: decisions, glossary terms, systems, and playbooks live next to the code, not in a separate wiki. The concept of clarifying decisions, glossary terms, and systems is inspired by [Matt Pocock's skills](https://github.com/mattpocock/skills). OKF provides a lightweight markdown-first format for that knowledge, and coding harness' skill system lets agents read and write it on demand.

## Tools

`/setup-okf` copies a small Python helper, `okf-tool`, into the target repo under `scripts/okf/`. It is used by the OKF skills to keep the bundle consistent:

```bash
python -m scripts.okf.cli index      # regenerate all index.md files
python -m scripts.okf.cli validate   # check required frontmatter, links, orphans
python -m scripts.okf.cli log "..."  # append to docs/app/log.md
python -m scripts.okf.cli viz        # generate docs/viz.html graph
```

It requires only Python stdlib; PyYAML is used if installed, otherwise a minimal frontmatter parser handles simple key-value YAML.

## Technologies and references

- **harness** agent skill format (markdown with YAML frontmatter, progressive disclosure, command-style invocation names).
- **OKF v0.1** for the knowledge-base layout and concept file conventions.
- **Matt Pocock's setup skill** for triage-label conventions and agent-instruction structure.
- **Markdown + git + Python stdlib** for portability; no runtime dependencies beyond the agent and Python.

## Intention

These skills are designed to be opinionated but minimal. The focus is on writing less, deleting more, and letting the repo remember itself.

## Usage

1. Clone or enter this repo.
2. Verify the skill folders under `skills/` are junctioned into `~/<coding harness>/skills/`, e.g. `~/.pi/agent/skills/`.
3. In any project repo, run `/setup-okf` to create the OKF bundle and agent instructions.
4. Run `/grill-okf` to capture decisions and domain terms.
5. Ask `/refer-okf` to answer questions grounded in the knowledge base.

Each skill's full behavior is documented in its own `SKILL.md` under `skills/<name>/`.

## Future enhancements

- **Visualization** ✅ delivered via `okf-tool viz`.
- **Evaluation metrics** — partially covered by `okf-tool validate` (broken links, orphan concepts, missing frontmatter). Extend later with concept coverage against the codebase, decision freshness, and glossary accuracy.
- **Automatic grounding** — make other skills consult the OKF bundle without requiring the user to type `/refer-okf`. The repo's agent instructions (`docs/agents/okf.md`) can instruct all skills to read `docs/app/index.md` first when answering project questions, so grounding becomes the default behavior.
