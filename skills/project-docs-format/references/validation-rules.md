# Validation rules

## Generated application structure

`docs/app/STRUCTURE.md` recursively lists every descendant directory, Markdown document, and non-Markdown asset under `docs/app/`, excluding itself.

The table columns are exactly `Path | Kind | Description`:

- `Path` is relative to `docs/app/`, normalized to `/`; directory paths end in `/`.
- `Kind` is `Directory`, `Document`, or `Asset`.
- A document description comes from its frontmatter.
- `data/` uses `Data-system documentation.`; `interface/` uses `User-facing interface documentation.`; `logic/` uses `Business-logic documentation.`
- Every other descendant directory uses `Documentation directory.`
- An asset uses `Supporting asset.`

Sort rows by normalized path using simple code-point order, with no locale, filesystem, or category ordering. A stale table is an error; deterministic fix regenerates it without changing its timestamp.

## Links

Validate the target file of every internal inline link. Internal links use inline Markdown syntax; reference-style definitions may target only syntactically valid external URLs. Ignore heading anchors because renderer slug rules are outside the contract. Ignore links inside standard backtick or tilde fenced code blocks for navigation validation.

A resolved internal path may reach source outside `docs/` but may not escape the repository root. External URLs receive syntax validation only; validation makes no network requests.

Repair a broken internal link automatically only when a Git-detected rename or a unique case/separator normalization identifies one target. Multiple plausible targets require a decision.

A non-`None` Source References section is a fixed table with exactly `Path | Component | Description`. Each row uses ``[`repository/path`](document-relative-target) | `component-or-symbol` | substantive description``. Validate all of these together:

- displayed path is repository-relative and uses `/`;
- target is document-relative and uses `/`;
- displayed path and target resolve to the same repository file or directory;
- directory labels end in `/`;
- component or symbol is named;
- description is substantive;
- no line number is embedded.

## Filesystem and encoding

Non-Markdown assets need no frontmatter. Validate `href` and `src` attributes in HTML, SVG, and XML, plus `url(...)` targets in CSS. Include assets below `docs/app/` in `STRUCTURE.md`.

Markdown must be valid UTF-8. Removing a UTF-8 BOM is deterministic; conversion from another encoding is not. Preserve each existing file's line endings. A new file follows the repository's dominant Markdown line ending, falling back to LF.

Do not follow symlinks under `docs/`; skip each with a warning. Reject case-insensitive path collisions, Windows separators in documentation paths, `.markdown` under `docs/`, repository escape, and invalid top-level entries under `docs/app/`.

Committed generated Markdown follows the same contract. Add no ignore or schema-extension mechanism without a concrete generator consumer.

## Secret boundary

Scan all Markdown, including fenced examples, for private-key blocks and recognizable token or password assignments. Explicit redactions such as `[REDACTED]`, placeholders such as `***` or `<secret>`, and environment-variable references are safe. Embedded obvious credentials are errors. Do not use entropy heuristics.

## Severity

Only these warnings do not make validation fail:

- missing expected documents;
- agent-assessed README content gaps;
- missing role or specialized-agent documentation;
- skipped symlinks;
- absent optional or applicability-dependent material.

Consolidate missing-material warnings into one list and one update offer.

Every other contract violation is an error and makes validation fail, including:

- malformed frontmatter or missing fields;
- unknown keys or unsupported YAML;
- invalid controlled values or timestamps;
- invalid UTF-8;
- broken or repository-escaping internal links;
- missing or empty required sections;
- missing, reordered, or extra H1 headings;
- invalid fixed tables;
- invalid filenames or numbering;
- internal reference-style links;
- malformed Source References;
- invalid generated-index rows;
- Windows path separators;
- `.markdown` under `docs/`;
- case-insensitive path collisions;
- invalid `docs/app/` top-level entries;
- stale `STRUCTURE.md`;
- obvious embedded secrets.

Validation does not assign a semantic quality score.
