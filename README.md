# skills

A personal collection of agent skills that turn repo folders into usable knowledge and repeatable workflows.

## Goal

Provide skills that harness can invoke to initialize, populate, and query an [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) (Open Knowledge Format) knowledge base inside any software or data project. The first three skills focus on project onboarding and memory:

- `/setup-okf` — scaffold an OKF bundle under `docs/app/`, set up triage labels and issue-tracker conventions, and write agent instructions.
- `/grill-okf` — interview the user to capture purpose, domain model, and decisions, then write them as OKF concept files.
- `/refer-okf` — answer questions by reading the OKF bundle and grounding responses in the repo's own knowledge.

## Inspiration

Most projects lose context the moment the original developer steps away. Agent skills can keep that context alive by making the repo itself the source of truth: decisions, glossary terms, systems, and playbooks live next to the code, not in a separate wiki. The concept of clarifying decisions, glossary terms, and systems is inspired by [Matt Pocock's skills](https://github.com/mattpocock/skills). OKF provides a lightweight markdown-first format for that knowledge, and coding harness' skill system lets agents read and write it on demand.

## Technologies and references

- **harness** agent skill format (markdown with YAML frontmatter, progressive disclosure, command-style invocation names).
- **OKF v0.1** for the knowledge-base layout and concept file conventions.
- **Matt Pocock's setup skill** for triage-label conventions and agent-instruction structure.
- **Markdown + git** for portability; no runtime dependencies beyond the agent.

## Intention

These skills are designed to be opinionated but minimal. The focus is on writing less, deleting more, and letting the repo remember itself.

## Usage

1. Clone or enter this repo.
2. Verify the skill folders under `skills/` are junctioned into `~/.pi/agent/skills/`.
3. In any project repo, run `/setup-okf` to create the OKF bundle and agent instructions.
4. Run `/grill-okf` to capture decisions and domain terms.
5. Ask `/refer-okf` to answer questions grounded in the knowledge base.

Each skill's full behavior is documented in its own `SKILL.md` under `skills/<name>/`.
