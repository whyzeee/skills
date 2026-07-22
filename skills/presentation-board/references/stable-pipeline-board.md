# Stable Pipeline Board Pattern

Use this pattern when the model explains a deterministic process with fixed ordered stages, one or more parallel paths, and meaningful convergence or divergence. It is especially suitable for data pipelines, operational workflows, and system handoffs.

## Decision

Use a **single-page, left-to-right pipeline graph** when sequence and responsibility matter more than hierarchy. Keep the complete stage structure visible as the executive view when hiding later stages would obscure the end-to-end story.

Prefer another form when the dominant question differs:

- hierarchy or rollups → stable tree/outline
- dates or milestones → timeline
- many-to-many relationships → node-link graph
- quantities moving between stages → flow/Sankey-like graph

Completion: a reader can identify the start, end, path boundaries, and every convergence point without interacting.

## Information Layout

- Fix each process stage to a stable column.
- Give each business or system path a horizontal lane.
- Align shared stages and convergence points across lanes.
- Keep labels outside compact node marks when text would crowd the node.
- Keep the full architecture visible; use selection for detail rather than expansion when the stage graph is already small enough to scan.
- Put summaries, evidence, assumptions, and long labels in the details panel or accessible tooltip instead of enlarging every node.

Completion: filtering or selecting does not move stages, break traversal order, or hide the architecture needed to understand the flow.

## Interaction Layout

- Filter paths by muting unrelated nodes and links rather than removing them when architectural context matters.
- Keep path filtering independent from node selection.
- Let node selection update one dedicated details panel.
- Offer presentation-mode canvas expansion only when the default split view materially constrains the graph.
- On narrow screens, preserve left-to-right meaning with horizontal scrolling and move details below the graph; do not reflow into an ambiguous vertical pipeline.
- Use native controls, visible focus states, Escape-to-restore, and `prefers-reduced-motion`.

Completion: keyboard and touch users can filter a path, select a node, inspect its details, and restore the board without losing context.

## Visual Direction

Use a minimal technical field-guide aesthetic:

- warm paper or cream ground
- deep green primary ink and primary path
- amber for a secondary path or risk semantics
- muted stone borders and connectors
- editorial serif for the headline, restrained system sans for body text, and monospace for stage or evidence labels
- compact labeled nodes and quiet external links

Treat color as lane identity or semantic state, not decoration. Keep typography and spacing responsible for hierarchy. Avoid decorative gradients, glass effects, card-heavy nodes, emoji icons, and force-layout movement.

Completion: lane identity remains legible without color alone, and the graph reads as one technical field rather than a collection of cards.
