---
name: abstraction-modeling
description: Use when deriving a layered abstraction model from a topic and source data before rendering an expandable manager-friendly HTML drilldown.
---

# Abstraction Modeling

## Contract

Turn a topic and its evidence into a small layered model. Do not design a broad report workflow, preset registry, or visualization library. The output is a model and interaction requirements that another skill can render.

## When to Use

- The user wants an abstraction ladder from a topic, dataset, estimate, plan, or breakdown.
- The result needs progressive disclosure: high-level summary first, drill into detail on demand.
- Numbers, risks, confidence, assumptions, or evidence need traceability through the hierarchy.

Do not use for generic HTML styling, broad audits, project planning, test workflows, or one-off prose summaries with no hierarchy.

## Minimal Model

Use this boring shape unless the topic proves it insufficient:

```text
Node {
  id
  title
  type
  summary
  value
  unit
  confidence
  risk
  assumptions[]
  evidence[]
  children[]
}
```

Allowed simplification: omit empty fields in the final artifact, but keep the concept while modeling so uncertainty is not lost.

## Workflow

1. **Name the topic and audience.** Identify what the top-level manager view must answer. Completion: one root question is clear.
2. **Derive the ladder from the topic.** Pick the fewest levels that explain the topic. Example: `Project -> Stage -> Workstream -> Task -> Assumption`. If the input does not clearly determine a hierarchy, stop and ask the user before modeling. Completion: every level has a distinct job and no unclear hierarchy was guessed.
3. **Build the hierarchy.** Put each source item under exactly one parent unless duplication is explicitly useful. Completion: every important item is either a node, evidence, or an assumption.
4. **Make rollups explicit.** Numeric parent values must either sum child values or be marked as a manual assumption/override. Completion: every visible number can be traced.
5. **Mark uncertainty.** Attach confidence, risk, assumptions, and evidence at the lowest useful node. Completion: uncertainty is visible without reading every child.
6. **Specify progressive disclosure.** Require collapsed executive view first, click-to-expand one layer at a time, selected-node details, and toggles only for risk/confidence/assumptions when useful. Completion: the first screen is understandable without hiding traceability.
7. **Hand off rendering.** Provide the model plus interaction requirements to the HTML/frontend skill. Completion: styling choices are not embedded here beyond interaction needs.

## Output Shape

Return the model in whichever compact format the next step needs. Prefer JSON-like structures for implementation and short tables for discussion.

Required sections:

- Ladder
- Root summary
- Nodes
- Rollup rules
- Assumptions and evidence
- Interaction requirements

## Common Pitfalls

1. **Preset creep.** Do not create reusable ladders until repeated real use proves the same ladder at least three times.
2. **Mystery totals.** A parent number without child sum or explicit assumption is invalid.
3. **Styling leakage.** This skill owns information architecture, not visual polish.
4. **Flat detail dump.** A drilldown starts collapsed and earns each detail layer.
5. **False certainty.** Missing evidence should become an assumption or low-confidence mark, not confident prose.

## Verification Checklist

- [ ] One topic and audience are named.
- [ ] The ladder has the fewest useful levels.
- [ ] Every important item is represented once or explicitly duplicated.
- [ ] Every numeric parent value is summed or marked as an assumption/override.
- [ ] Risks, confidence, evidence, and assumptions are attached where they help decisions.
- [ ] Interaction requirements preserve progressive disclosure and traceability.
