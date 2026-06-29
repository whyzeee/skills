---
name: setup-okf
description: Initialize a repo with an OKF knowledge base under docs/app/, set up the issue tracker, and run /grill-okf for project initiation. Use when starting a new project or onboarding an existing repo to OKF and agent-ready engineering workflows.
---

# /setup-okf

Set up a repo so it is ready for OKF-backed, agent-assisted work. Creates the OKF bundle under `docs/app/`, configures the issue tracker, writes agent instruction files, and runs `/grill-okf`.

## Before you start

- A git repo is required. If none exists, run `git init` and ask the user to add a remote.
- If no remote exists and the user wants GitHub/GitLab tracking, ask them to create/choose a remote before continuing.

## Process

Run the sections below one at a time. Confirm the user's answer before moving on.

### 1. Explore the repo

Read what already exists:

- `git remote -v`
- `README.md`
- `CONTEXT.md` (if any)
- `docs/` structure, especially `docs/adr/` and `docs/guides/`
- Any existing `docs/agents/` files
- Any existing `.scratch/` directory

From this, infer the project's **overall purpose**, **domain model**, and any **concrete features** already visible. Present a short summary and ask the user to confirm or correct these three items before continuing.

### 2. OKF template

Offer a template based on the repo. If the repo looks data-heavy, default to **Data**. Otherwise default to **Generic**.

**Generic:**

```
docs/app/
├── index.md
├── log.md
├── concepts/
├── decisions/
├── systems/
└── playbooks/
```

**Data:**

```
docs/app/
├── index.md
├── log.md
├── concepts/
├── decisions/
├── systems/
├── datasets/
├── tables/
├── pipelines/
└── playbooks/
```

Ask the user to confirm, swap, or customize.

### 2b. Context boundaries

For directories that benefit from grouping, infer contexts from the codebase:

- `systems/` (almost always) — group by component, service, or bounded context.
- `concepts/` and `tables/` (data template; almost always) — group by source system, domain area, feature, or pipeline stage (e.g., `raw/`, `transformed/`, `analytics/`).
- `decisions/`, `pipelines/`, `datasets/`, `playbooks/` — group only if the codebase clearly has multiple bounded contexts; otherwise keep flat. If unclear, ask the user.

Contexts can be nested from broad to narrow, e.g. `concepts/<feature>/<role>/<term>.md` or `tables/<source>/<schema>/<table>.md`. Confirm the inferred grouping with the user before creating directories.

### 3. Create the OKF bundle

- Create `docs/app/` and the chosen subdirectories.
- Create `docs/app/index.md` and `docs/app/log.md`.
- If `README.md` exists, merge its content into `docs/app/index.md` but keep `README.md`.
- If `CONTEXT.md` exists, merge its content into `docs/app/index.md` as a glossary/concepts section.
- Do **not** touch `guides/` or `docs/guides/`.
- Migrate existing ADRs from `docs/adr/` into `docs/app/decisions/` as OKF concept files, then remove the original ADR files.
- Create sub-directory `index.md` files for each context directory that needs progressive disclosure.
- Update `docs/app/index.md` to list the new concept directories and contexts. The root `index.md` may inline the contents of sub-directory `index.md` files so agents can scan the whole knowledge base from one file.
- Append an initialization entry to `docs/app/log.md`.

### 4. Explore the codebase for missing OKF pieces

After scaffolding OKF, explore the code to find concepts not yet documented:

- Identify systems, services, APIs, databases, datasets, tables, pipelines, or modules.
- Note domain terms that appear in code but are not in `docs/app/concepts/`.
- Note implicit design decisions (technologies, patterns, constraints) not yet in `docs/app/decisions/`.
- Infer the correct context subdirectory for each concept. If the context is ambiguous, ask the user or log it as `**To document**: ...`.

For each gap, either:

- Write a stub OKF concept file with a `type` and `description` in the inferred context path, or
- Add it to a running list in `docs/app/log.md` as `**To document**: ...` if it needs user input first.

Present a short summary of what was documented and what remains to be grilled.

### 5. Issue tracker

Choose the tracker:

- **GitHub** — requires `git remote` pointing to GitHub and the `gh` CLI.
- **GitLab** — requires `git remote` pointing to GitLab and the `glab` CLI.
- **Local markdown** — issues under `.scratch/<feature-slug>/`.

If GitHub/GitLab is chosen, ask:

> Should external PRs also be treated as a triage surface? (yes / no, default: no)

Confirm the choice and write `docs/agents/issue-tracker.md`.

### 6. Triage labels

Use the five canonical roles from `setup-matt-pocock-skills`:

- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

Ask if the repo already uses different label strings. Write `docs/agents/triage-labels.md` with the mapping.

### 7. Domain docs

Confirm the layout:

- **Single-context** — `docs/app/` holds the OKF bundle; domain terms under `docs/app/concepts/`, decisions under `docs/app/decisions/`.

Write `docs/agents/domain.md` describing the layout.

### 8. OKF agent instructions

Write `docs/agents/okf.md` telling other skills how to read and write OKF in this repo. Include:

- This repo uses OKF v0.1 under `docs/app/`.
- Concepts are markdown files with YAML frontmatter; `type` is required.
- Reserved filenames: `docs/app/index.md`, `docs/app/log.md`.
- Cross-links should be bundle-relative from `docs/app/` (e.g., `/concepts/sales/order.md` or `/tables/source_users/users.md`).
- New domain terms go under `docs/app/concepts/`, inside the appropriate context subdirectory. Infer the context from the codebase; ask the user if it is ambiguous.
- New design decisions go under `docs/app/decisions/`, grouped by context only when the codebase has clear bounded contexts.
- After adding or changing a concept, update `docs/app/index.md` and append to `docs/app/log.md`.
- Include the concept templates from `/grill-okf`.
- Mention that `/refer-okf` is the preferred skill for querying OKF and that other skills should rely on it for OKF-backed answers.

### 9. Agent skills block

Edit `CLAUDE.md` or `AGENTS.md` (whichever exists; ask if neither exists) and add an `## Agent skills` block:

```markdown
## Agent skills

### Issue tracker

[one-line summary]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary]. See `docs/agents/triage-labels.md`.

### Domain docs

OKF knowledge base under `docs/app/`. Query it with `/refer-okf`. See `docs/agents/domain.md` and `docs/agents/okf.md`.
```

If the block already exists, update it in place.

### 10. Run /grill-okf or finish

If Step 4 surfaced gaps, run `/grill-okf` focused on those gaps. Ask the user which gap to tackle first.

If no gaps remain and the user confirmed the purpose, domain model, and features in Step 1, finish without further questions. Still offer `/grill-okf` for later use.

## Done

Tell the user the project is set up and which files were created. Mention that `docs/agents/*.md` can be edited directly later.
