---
name: requirement-gathering
description: Use when the user wants to sharpen an idea, requirement, decision, plan, or boundary through conversation before any implementation or documentation work.
---

# Requirement Gathering

## Contract

This is a scoped interview, not an audit, build, documentation pass, or transcript-producing workshop. Ask exactly one question at a time, wait for its answer, and keep no interview note, scratch document, hidden transcript, or second source of truth unless the user explicitly asks for one.

Use this skill when the user wants only to get more ideas, firm down requirements, resolve ambiguity, or decide what they mean. Stop at understanding; do not create project docs, specs, tickets, tasks, code, diagrams, or persistent notes unless the user later asks for that next artifact.

## Establish the scope

1. Require one selected topic. If none was supplied, ask only for the topic. Express it as a concrete goal, decision, term, boundary, behavior, responsibility, relationship, risk, or scenario to resolve. Completion: one topic defines the interview scope.
2. Inspect existing context only when it can answer factual questions or expose a concrete ambiguity. Do not inventory unrelated material or search for additional topics. Completion: candidate questions are about the selected topic only.
3. Separate facts from decisions. Look up retrievable facts when tools are available; ask the user for intentions, priorities, tradeoffs, naming, authority, and acceptability. Completion: the next question cannot be answered better by inspection.

## Interview loop

Repeat until a stop condition applies:

1. Choose the single unresolved question whose answer would remove the most downstream uncertainty. Prefer, in order: an authority conflict, a boundary or responsibility affecting several facts, an overloaded or cross-domain term, a tradeoff or priority, then a narrower behavior or relationship. Do not ask a batch or preview later questions.
2. Ask that one question directly. When wording is overloaded, name the competing meanings and domains. When an abstract definition could hide disagreement, ask one concrete scenario that distinguishes the alternatives.
3. If the answer is empty, the user reports a disconnect, or they ask to re-ask, do not infer the answer. Re-ask the smallest still-unresolved question, preserving prior choices where they still apply.
4. Test the answer against relevant evidence and prior resolved facts in the conversation. Challenge a conflict with one concrete counterexample or boundary case rather than accepting inconsistent language.
5. If the answer is tentative, contradictory, or missing authority, keep the claim unresolved and ask the next single highest-impact clarification. If it is resolved, summarize the exact requirement in one sentence only when that helps anchor the next question.

## Stop conditions

Stop immediately when any one condition is true:

- no material ambiguity remains in the selected topic;
- remaining gaps require evidence or stakeholders that are unavailable;
- the user explicitly stops;
- the user asks to turn the result into another artifact, at which point switch to the appropriate skill.

Before finishing, give only the compact resolved understanding and the remaining open questions, if any. Do not imply that any file, ticket, document, memory, or implementation was created.

## Common pitfalls

1. **Batch questions.** Multiple questions at once makes answers ambiguous. Ask one.
2. **Documentation gravity.** Gathering requirements is allowed to end as conversation only. Do not route into project-docs, specs, or tickets unless requested.
3. **Secret transcript.** Internal notes become a second source of truth. Keep only conversation context unless asked to write an artifact.
4. **Accepting contradictions.** A requirement that conflicts with stated facts is not resolved; ask the boundary case.
5. **Over-searching.** Inspect just enough context to avoid asking factual questions the system can answer.
