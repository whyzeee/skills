---
name: presentation-board
description: Use when creating a standalone interactive HTML presentation board that turns an abstraction model into a polished manager-friendly drilldown.
---

# Presentation Board

## Contract

Create a standalone interactive HTML board from a topic, data, or an existing abstraction model. Use `abstraction-modeling` for the information architecture and `frontend-design` for UI/UX, accessibility, layout, typography, color, motion, and responsive craft. Do not add extra planning, audit, reporting, or test workflows unless the user asks.

## Prerequisite

The third-party frontend design skill must be available:

```sh
npx skills add nexu-io/open-design -g -s frontend-design -y
```

Before using this skill, check whether `frontend-design` is available. If it is not installed, warn the user to install `nexu-io/open-design@frontend-design` before proceeding; only continue without it if the user explicitly accepts a plain fallback. Load or follow `frontend-design` before final HTML craft.

## When to Use

- The user wants an interactive HTML artifact for managers or stakeholders.
- The artifact needs a collapsed executive view plus drilldown detail.
- The input is a topic, estimate, plan, data breakdown, or already-modeled hierarchy.

Do not use for static prose, generic dashboards, production app architecture, or broad visual design exploration.

## Workflow

1. **Resolve the model.** If the user gave only a topic/data, run `abstraction-modeling` first. If they gave a hierarchy, validate it against the abstraction-modeling checklist. Completion: the board has a traceable model.
2. **Choose the board frame from the dominant relationship.** Use one page, one primary board, and one details panel. Match the graph grammar to what the reader must trace: hierarchy/rollups → stable tree or outline; fixed process stages and convergence → stable pipeline; dates/milestones → timeline; many-to-many relationships → node-link; quantities moving between stages → flow. For a deterministic workflow with fixed stages or converging lanes, load [`references/stable-pipeline-board.md`](references/stable-pipeline-board.md). Completion: the chosen frame makes the model's sequence, hierarchy, relationships, or flow legible without interaction and adds no routing or framework.
3. **Apply frontend-design minimally.** Use the third-party skill for typography, spacing, color, responsive behavior, accessibility, touch/keyboard interaction, and states, but keep the design quiet: fewer accents, fewer competing panels, and no decorative elements that distract from the story. Prefer a warm paper theme with deep green ink/accent, muted stone borders, soft cream surfaces, and amber/risk status colors; borrow only this color mood, not any layout. Prefer low-variance, low-motion, medium-density recommendations unless the user asks otherwise. Preserve enough visible context for the user to understand the whole thing. If the cleaned-up view still has too much information, hide secondary details in accessible tooltips instead of deleting them. Completion: the board avoids generic AI styling, reduces storytelling noise, preserves comprehension, and has hover/focus/active states.
4. **Implement contextual disclosure with interactive graphs.** Default to a collapsed executive view for deep hierarchies. Keep a small end-to-end graph visible when later stages, parallel lanes, or convergence are necessary to understand the story; disclose detail through selection and filtering rather than hiding architecture. Prefer an interactive graph over plain dropdown menus when relationships, time, sequence, dependencies, or rollups need exploration. Completion: a manager can understand the whole at first glance, select one element for detail, and trace any number later.
5. **Expose uncertainty controls only if useful.** Add toggles for risks, confidence, and assumptions when those fields exist. Completion: controls map to real model fields.
6. **Keep it standalone.** Prefer inline CSS/JS in a single HTML file unless the user asks for a project. Completion: opening the file locally works.
7. **Verify the artifact.** Run the smallest available check: file exists, browser opens or a smoke test confirms core IDs/controls. Exercise one real disclosure path appropriate to the frame—select, expand, or filter. It must not throw; selected details must render; and node title/summary text must be visually separated rather than glued together. Completion: the generated HTML is exercised once and its primary interaction works.

## Board Requirements

Minimum UI:

- Minimal visual style that supports the story instead of competing with it
- Warm paper/cream color theme with deep green primary accents, muted stone lines, and amber/risk semantic colors when appropriate
- Executive summary or complete structural overview
- Interactive graph visualization for the main drilldown when it improves comprehension and interactivity
- Selection, expansion, or filtering appropriate to the graph grammar
- Rollup values visible at every level that has values
- Selected-node side panel or details region
- Evidence/assumption visibility when present
- Tooltips for secondary details that would otherwise overcrowd the board
- Keyboard-reachable controls and visible focus states
- Responsive layout for desktop and narrow screens

## Design Guidance

Make the dominant relationship visible before its details. Use compact marks, visible links, stable positions, external labels when text would crowd a node, and one selected-node details panel. Expand one layer at a time only when the model is too deep to show coherently.

For hierarchies and additive estimates, prefer a stable tree/outline over a force layout. Show the total and first-level stages initially; expand one stage at a time to reveal sub-stages or components, keep positions stable, and show each parent’s rollup beside it. For deterministic processes, preserve stage columns, lane order, and convergence; filtering should mute unrelated paths instead of moving the architecture when context matters. Load the stable-pipeline reference only for the pipeline branch.

Keep summaries, evidence, assumptions, and controls out of the node mark unless they materially improve first-glance comprehension. Put secondary content in the details panel or an accessible tooltip so the graph remains a graph rather than a field of mini-cards.

## Common Pitfalls

1. **Framework gravity.** A single HTML board does not need React, routing, or build tooling.
2. **Pretty but untraceable.** Visual polish cannot hide where numbers came from.
3. **All details open.** Keep the structural overview visible, but disclose secondary detail through selection, filtering, expansion, or tooltips.
4. **Invented certainty.** Unknown evidence stays visible as an assumption or low confidence.
5. **Dependency sprawl.** Use the third-party UI/UX skill for guidance, not a package pile.
6. **Noisy design.** `frontend-design` can produce rich visuals; constrain it to minimalist storytelling so visual craft clarifies the hierarchy rather than competing with it.
7. **Information amputation.** Do not remove necessary context just to make the board look clean. Hide secondary but useful details in tooltips when the main view is crowded.
8. **Dropdown-only drilldown.** Avoid plain dropdown/menu-only hierarchies for the main interaction. Prefer an interactive graph (node-link, timeline, flow, tree, or another fit-for-purpose graph) when it clarifies the story; use lists/dropdowns only as secondary controls or when a graph would add noise.
9. **Unstable graph grammar.** A simple hierarchy is not a generic network, and a deterministic pipeline is not a force graph. If interaction makes nodes jump, changes traversal order, or obscures convergence, switch to a stable tree/outline or fixed-stage pipeline with external labels.

## Verification Checklist

- [ ] `abstraction-modeling` produced or validated the model.
- [ ] `frontend-design` was installed and used, or the user was warned to install `nexu-io/open-design@frontend-design` and explicitly accepted a plain fallback.
- [ ] The visual design is minimalist enough to reduce storytelling noise without losing the user's ability to understand the whole thing.
- [ ] The artifact is one standalone HTML file unless explicitly requested otherwise.
- [ ] The main drilldown uses an interactive graph type when it improves visualization; plain dropdown/menu-only hierarchy is avoided unless it is clearly simpler.
- [ ] The executive view collapses deep detail but keeps any structure required for end-to-end comprehension visible.
- [ ] The primary select, expand, or filter interaction works without JavaScript errors and renders the expected details or state.
- [ ] Node title and summary are visually separated, not glued together.
- [ ] Values are traceable to children or explicit assumptions.
- [ ] Core controls are keyboard reachable and responsive.
- [ ] The HTML was opened or smoke-tested once.
