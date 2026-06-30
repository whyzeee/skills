# OKF skills upgrade plan

Upgrade the three existing skills (`setup-okf`, `grill-okf`, `refer-okf`) by adding a small, reusable bundle helper (`okf-tool`) and updating the skill instructions. Based on the gap analysis against the `knowledge-catalog` project; the BigQuery/source-adapter pieces are ignored because they are Google-specific.

## Status

- `tools/okf/` is implemented and pushed (`485ad85`).
- Skill instructions and the emitted spec still need to be updated.

## Guiding principles

- Keep skills markdown-first and Pi-native.
- Let `okf-tool` own parsing, indexing, logging, validation, and visualization. Skills call it; they do not reimplement its logic.
- No new runtime dependencies in target repos beyond Python stdlib + the copied helper.
- Prefer lazy, reusable upgrades over domain-specific adapters.
- Use Ponytail intensity: delete boilerplate, one line where possible, and question every new file.

## Proposed changes

### 1. Add tests for `tools/okf`

Add a small pytest suite under `tests/` so the helpers do not silently break:

- `tests/test_document.py` — round-trip frontmatter parsing, missing required keys, fallback YAML parser behavior.
- `tests/test_index.py` — index regeneration on a sample bundle, root index inlining.
- `tests/test_links.py` — detect a dangling link, no false positives for valid links.
- `tests/test_cli.py` — invoke each CLI subcommand in a temp directory.

Use a sample fixture bundle committed under `tests/fixtures/sample-bundle/`.

### 2. Formalize the OKF spec

- Summarize `okf/SPEC.md` from `knowledge-catalog` into a static file that `/setup-okf` emits as `docs/agents/okf-spec.md`.
- The spec should cover: bundle structure, required frontmatter (`type`, `title`, `description`, `timestamp`), reserved filenames (`index.md`, `log.md`), bundle-relative cross-link syntax (`/concepts/...`, `/decisions/...`), and the `okf-tool` commands available in this repo.
- Update `setup-okf/SKILL.md` step 8 to reference the spec and tell agents to follow it.
- Update `grill-okf/SKILL.md` and `refer-okf/SKILL.md` to point agents at `docs/agents/okf-spec.md`.

### 3. Update `/setup-okf`

- Add a new step after creating the OKF bundle: copy `tools/okf/` from this repo into the target repo under `scripts/okf/`.
- Emit `docs/agents/okf-spec.md`.
- Replace hand-editing of `docs/app/index.md` with `python -m scripts.okf.cli index` after any concept creation/migration.
- Replace manual `docs/app/log.md` appending with `python -m scripts.okf.cli log "message"`.
- After scaffolding, run `python -m scripts.okf.cli validate` and report broken links or orphan concepts in `docs/app/log.md` as `**To document**: ...` entries.
- Mention `python -m scripts.okf.cli viz` in the generated `docs/agents/okf.md`.
- Remove duplicated instruction text that is now covered by `okf-spec.md`.

### 4. Update `/grill-okf`

- After writing or meaningfully changing a concept, run `python -m scripts.okf.cli log "Created/updated <relative-path>"`.
- At the end of a grilling session, run `python -m scripts.okf.cli index`.
- Optionally run `python -m scripts.okf.cli validate` before finishing; report broken links and offer to fix them.
- Keep concept templates in `SKILL.md` but add a note that `docs/agents/okf-spec.md` is authoritative.

### 5. Update `/refer-okf`

- Before answering, optionally run `python -m scripts.okf.cli validate` and surface any broken links as a short warning (does not block the answer).
- Mention that `docs/viz.html` is available for browsing the knowledge graph.
- No major logic change; the skill stays read-only.

### 6. Update `README.md`

- Add a `tools/okf/` section documenting the CLI and the fact that `/setup-okf` copies it into target repos.
- Mark the visualization and evaluation future enhancements as partially delivered or in progress where appropriate.

### 7. Source adapters (future)

- Do not build now.
- When a concrete project asks for it, add small scanner modules under `tools/okf/sources/` (OpenAPI, dbt, SQLAlchemy, Terraform). Each emits concept files; `okf-tool index` picks them up.

## Implementation order

1. Add tests for `tools/okf`.
2. Write the `docs/agents/okf-spec.md` template content and wire it into `setup-okf/SKILL.md`.
3. Update `setup-okf/SKILL.md` to copy `tools/okf/` and use `okf-tool`.
4. Update `grill-okf/SKILL.md` and `refer-okf/SKILL.md` to reference `okf-tool` and the spec.
5. Update `README.md`.
6. Run tests and a manual end-to-end `/setup-okf` on a fresh temp repo.

## Acceptance criteria

- `pytest` passes for `document`, `index`, `links`, and `cli`.
- `/setup-okf` in a fresh repo produces:
  - `docs/agents/okf-spec.md`
  - `scripts/okf/` with working CLI
  - regenerated `docs/app/index.md` files
  - a `docs/app/log.md` entry created via `okf-tool log`
- `python -m scripts.okf.cli index` regenerates all `index.md` files.
- `python -m scripts.okf.cli validate` reports missing required frontmatter keys, broken cross-links, and orphan concepts.
- `python -m scripts.okf.cli viz` produces a single `docs/viz.html`.
- Advanced frontmatter validation (timestamp format, duplicate titles, YAML well-formedness) is a future enhancement.
- `/grill-okf` instructions tell the agent to run `okf-tool index` and `okf-tool log` after writing concepts.
- `/refer-okf` instructions mention `okf-tool validate` and `viz.html`.

## What to skip

- BigQuery/source adapters until a concrete project asks for them.
- Complex evaluation metrics; `validate` counts + `viz.html` are enough for now.
- Automatic grounding across all skills; README already documents this as a future enhancement.
- A formal PyPI package; copy `tools/okf/` into each repo instead.
