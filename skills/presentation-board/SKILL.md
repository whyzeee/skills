---
name: presentation-board
description: Use when creating a standalone interactive HTML presentation board that turns an abstraction model into a polished manager-friendly drilldown.
---

# Presentation Board

## Contract

Create a standalone interactive HTML board from a topic, data, or an existing abstraction model. Use `abstraction-modeling` for the information architecture and `nexu-io/open-design@frontend-design` for style and interaction craft. Do not add extra planning, audit, reporting, or test workflows unless the user asks.

## Prerequisite

The third-party HTML/frontend skill must be available:

```sh
npx skills add nexu-io/open-design -g -s frontend-design -y
```

Load or follow `frontend-design` before final HTML craft. If it is unavailable, proceed only with a plain but usable HTML board and say the polish pass was skipped.

## When to Use

- The user wants an interactive HTML artifact for managers or stakeholders.
- The artifact needs a collapsed executive view plus drilldown detail.
- The input is a topic, estimate, plan, data breakdown, or already-modeled hierarchy.

Do not use for static prose, generic dashboards, production app architecture, or broad visual design exploration.

## Workflow

1. **Resolve the model.** If the user gave only a topic/data, run `abstraction-modeling` first. If they gave a hierarchy, validate it against the abstraction-modeling checklist. Completion: the board has a traceable model.
2. **Choose the board frame.** Use one page, one primary board, and one details panel. Completion: no extra pages, routing, or framework exists.
3. **Apply frontend-design.** Use the third-party skill for typography, spacing, color, responsive behavior, and states. Completion: the board avoids generic AI styling and has hover/focus/active states.
4. **Implement progressive disclosure.** Default to collapsed executive view, expand one layer at a time, and show selected-node details. Completion: a manager can read the top level first and trace any number later.
5. **Expose uncertainty controls only if useful.** Add toggles for risks, confidence, and assumptions when those fields exist. Completion: controls map to real model fields.
6. **Keep it standalone.** Prefer inline CSS/JS in a single HTML file unless the user asks for a project. Completion: opening the file locally works.
7. **Verify the artifact.** Run the smallest available check: file exists, browser opens or a smoke test confirms core IDs/controls. Completion: the generated HTML is exercised once.

## Board Requirements

Minimum UI:

- Executive summary/root node
- Expandable hierarchy
- Rollup values visible at every level that has values
- Selected-node side panel or details region
- Evidence/assumption visibility when present
- Keyboard-reachable controls and visible focus states
- Responsive layout for desktop and narrow screens

## Common Pitfalls

1. **Framework gravity.** A single HTML board does not need React, routing, or build tooling.
2. **Pretty but untraceable.** Visual polish cannot hide where numbers came from.
3. **All details open.** That is a report, not a drilldown.
4. **Invented certainty.** Unknown evidence stays visible as an assumption or low confidence.
5. **Dependency sprawl.** Use the third-party design skill for guidance, not a package pile.

## Verification Checklist

- [ ] `abstraction-modeling` produced or validated the model.
- [ ] `frontend-design` was used, or the skipped polish pass is stated.
- [ ] The artifact is one standalone HTML file unless explicitly requested otherwise.
- [ ] The executive view starts collapsed and supports drilldown.
- [ ] Values are traceable to children or explicit assumptions.
- [ ] Core controls are keyboard reachable and responsive.
- [ ] The HTML was opened or smoke-tested once.
