---
name: presentation-board
description: Use when creating a standalone interactive HTML presentation board that turns an abstraction model into a polished manager-friendly drilldown.
---

# Presentation Board

## Contract

Create a standalone interactive HTML board from a topic, data, or an existing abstraction model. Use `abstraction-modeling` for the information architecture and `ui-ux-pro-max` for UI/UX, accessibility, layout, typography, color, motion, and responsive craft. Do not add extra planning, audit, reporting, or test workflows unless the user asks.

## Prerequisite

The third-party UI/UX skill must be available:

```sh
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git ~/.hermes/external-skills/ui-ux-pro-max-skill
ln -s ~/.hermes/external-skills/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max ~/.hermes/skills/ui-ux-pro-max
```

Before using this skill, check whether `ui-ux-pro-max` is available. If it is not installed, warn the user to install it from `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git` before proceeding; only continue without it if the user explicitly accepts a plain fallback. Load or follow `ui-ux-pro-max` before final HTML craft.

## When to Use

- The user wants an interactive HTML artifact for managers or stakeholders.
- The artifact needs a collapsed executive view plus drilldown detail.
- The input is a topic, estimate, plan, data breakdown, or already-modeled hierarchy.

Do not use for static prose, generic dashboards, production app architecture, or broad visual design exploration.

## Workflow

1. **Resolve the model.** If the user gave only a topic/data, run `abstraction-modeling` first. If they gave a hierarchy, validate it against the abstraction-modeling checklist. Completion: the board has a traceable model.
2. **Choose the board frame.** Use one page, one primary board, and one details panel. Completion: no extra pages, routing, or framework exists.
3. **Apply ui-ux-pro-max minimally.** Use the third-party skill for typography, spacing, color, responsive behavior, accessibility, touch/keyboard interaction, and states, but keep the design quiet: fewer accents, fewer competing panels, and no decorative elements that distract from the story. Prefer a warm paper theme with deep green ink/accent, muted stone borders, soft cream surfaces, and amber/risk status colors; borrow only this color mood, not any layout. Prefer low-variance, low-motion, medium-density recommendations unless the user asks otherwise. Preserve enough visible context for the user to understand the whole thing. If the cleaned-up view still has too much information, hide secondary details in accessible tooltips instead of deleting them. Completion: the board avoids generic AI styling, reduces storytelling noise, preserves comprehension, and has hover/focus/active states.
4. **Implement progressive disclosure with interactive graphs.** Default to a collapsed executive view, and prefer an interactive graph visualization over plain dropdown menus when relationships, time, sequence, dependencies, or rollups need to be explored. Choose the graph type that fits the model: node-link graph for relationships, timeline graph for phases/dates, flow graph for pipelines, tree graph for hierarchy, or another compact graph when clearer. Expand one layer at a time and show selected-node details. Completion: a manager can read the top level first, interact with the structure visually, and trace any number later.
5. **Expose uncertainty controls only if useful.** Add toggles for risks, confidence, and assumptions when those fields exist. Completion: controls map to real model fields.
6. **Keep it standalone.** Prefer inline CSS/JS in a single HTML file unless the user asks for a project. Completion: opening the file locally works.
7. **Verify the artifact.** Run the smallest available check: file exists, browser opens or a smoke test confirms core IDs/controls. Exercise one real drilldown path: expanding a node must not throw, selected details must render, and node title/summary text must be visually separated rather than glued together. Completion: the generated HTML is exercised once and the first-click drilldown works.

## Board Requirements

Minimum UI:

- Minimal visual style that supports the story instead of competing with it
- Warm paper/cream color theme with deep green primary accents, muted stone lines, and amber/risk semantic colors when appropriate
- Executive summary/root node
- Interactive graph visualization for the main drilldown when it improves comprehension and interactivity
- Expandable hierarchy
- Rollup values visible at every level that has values
- Selected-node side panel or details region
- Evidence/assumption visibility when present
- Tooltips for secondary details that would otherwise overcrowd the board
- Keyboard-reachable controls and visible focus states
- Responsive layout for desktop and narrow screens

## Design Guidance

Prefer graph forms that make the relationship structure visible before the details. Use compact nodes, visible links, one-layer expansion, and a selected-node detail panel. Avoid turning every node into a mini-card unless the extra text materially improves first-glance comprehension.

For hierarchical drilldowns, prefer readable outline-like graph layouts over force/network-style layouts. Preserve traversal order, keep parent/child positions stable across expansion, and use links to clarify rollup structure. Use circles or lightweight marks as anchors, but keep labels beside the mark when text would crowd the node.

Avoid rectangular card-heavy trees when they make the board feel like a report, org chart, or spreadsheet. If node text starts carrying summaries, evidence, assumptions, and controls all at once, move that content to the selected-node panel or accessible tooltip.

## Common Pitfalls

1. **Framework gravity.** A single HTML board does not need React, routing, or build tooling.
2. **Pretty but untraceable.** Visual polish cannot hide where numbers came from.
3. **All details open.** That is a report, not a drilldown.
4. **Invented certainty.** Unknown evidence stays visible as an assumption or low confidence.
5. **Dependency sprawl.** Use the third-party UI/UX skill for guidance, not a package pile.
6. **Noisy design.** `ui-ux-pro-max` can produce rich visuals; constrain it to minimalist storytelling so visual craft clarifies the hierarchy rather than competing with it.
7. **Information amputation.** Do not remove necessary context just to make the board look clean. Hide secondary but useful details in tooltips when the main view is crowded.
8. **Dropdown-only drilldown.** Avoid plain dropdown/menu-only hierarchies for the main interaction. Prefer an interactive graph (node-link, timeline, flow, tree, or another fit-for-purpose graph) when it clarifies the story; use lists/dropdowns only as secondary controls or when a graph would add noise.
9. **Network-shaped hierarchy.** Do not lay out a simple hierarchy like a generic network diagram. If expansion causes nodes to jump across columns or labels must be squeezed inside circles, switch to a stable left-to-right tree/outline layout with external labels.

## Verification Checklist

- [ ] `abstraction-modeling` produced or validated the model.
- [ ] `ui-ux-pro-max` was installed and used, or the user was warned to install `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git` and explicitly accepted a plain fallback.
- [ ] The visual design is minimalist enough to reduce storytelling noise without losing the user's ability to understand the whole thing.
- [ ] The artifact is one standalone HTML file unless explicitly requested otherwise.
- [ ] The main drilldown uses an interactive graph type when it improves visualization; plain dropdown/menu-only hierarchy is avoided unless it is clearly simpler.
- [ ] The executive view starts collapsed and supports a first-click drilldown without JavaScript errors.
- [ ] Selected-node details render after a drilldown click.
- [ ] Node title and summary are visually separated, not glued together.
- [ ] Values are traceable to children or explicit assumptions.
- [ ] Core controls are keyboard reachable and responsive.
- [ ] The HTML was opened or smoke-tested once.
