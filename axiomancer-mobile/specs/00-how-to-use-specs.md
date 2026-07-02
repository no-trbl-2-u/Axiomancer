# 00 — How to use these specs

This file is the practical "operator's manual" for the spec folder. The
why-this-exists rationale lives in [`README.md`](./README.md). This
file is what to do when you sit down to work on the project.

---

## When you don't know what to work on

1. Open [`specs/README.md`](./README.md) and read the **Recommended
   order** table.
2. Pick the topmost spec that isn't `[DONE]` and isn't waiting on you
   for answers.
3. Open that spec. Read sections 1–3 (Goal, Why now, Current state).
4. If section 4 has unanswered questions, you have your task: **answer
   the questions**. You don't need to write code. Answers are a
   deliverable.
5. If section 4 is fully answered, your task is to tell the AI:
   `"Spec NN is ready, please implement."`

That's it. You're not picking a feature. You're picking a *spec*. The
spec tells you whether you're answering questions or asking the AI to
ship.

---

## When you have an idea you want to capture

1. Is it small (single component, single screen tweak)? Skip the spec
   — open a PR directly or ask the AI to implement it.
2. Is it medium (a system, multiple files, multiple decisions)? Write
   a new spec in this folder using the template below. Add it to the
   `specs/README.md` table.
3. Is it big (whole new phase / new screen)? Update `GAME-ROADMAP.md`
   first, then write one spec per workable chunk.

---

## When the AI is implementing a spec

The AI's loop:

1. Re-reads the spec.
2. Confirms every question in section 4 has an answer (asks if any are
   `> Your answer:` blank).
3. Works directly on `main` after fetching and pulling `origin/main`. Does not create a feature branch unless T explicitly asks for branch-based work.
4. Works through the **Proposed approach** as a series of commits.
5. Updates the **Acceptance checklist** as it ticks boxes.
6. Pushes `main` directly unless T explicitly asked for a PR.
7. Marks the spec `[DONE on YYYY-MM-DD]` at the top unless T explicitly asked for a PR.

If the AI hits an unanswered sub-question that wasn't in section 4 at
the start, it adds the question to section 4 (with a note explaining
why it came up) and stops to ask. It does not invent answers.

---

## When you're answering questions

- Short answers are great. `Yes`, `No`, `(A)`, `Defer to default`, `B
  but with X` are all valid.
- If you have a strong reason, write it. Future-you (and future-AI)
  will appreciate it.
- If a question feels wrong (asking about something that's already
  been decided, or missing the real choice), strike it through and
  add a new question that's correct.
- It's OK to answer half the questions and ship a partial spec — the
  AI will work on what it has and re-prompt for the rest.

---

## Debugging Engine Boundaries

When mobile behavior doesn't match engine expectations (like token
accumulation not working, stats not updating, or mechanics not firing),
the issue often lies at the **engine ↔ mobile boundary** — where engine
state flows through presenters to UI components.

### Methodology

1. **Confirm the engine behavior.** Test the same action sequence in the
   engine's own test suite or a minimal Node.js script. If the engine
   test passes but mobile fails, the boundary is suspect.

2. **Trace the presenter chain.** Find the presenter that consumes the
   engine state for your failing feature:
   - Token/mana display → `state/presenters/combat.engine.ts`
   - Character stats → `state/presenters/character.ts`
   - Exploration state → `state/presenters/exploration.ts`

3. **Add temporary logging.** Insert `console.log` statements at key
   boundary points:
   ```ts
   // In the presenter
   console.log('Engine state:', gameStore.getState().engine)
   console.log('Presenter output:', selectedValue)
   
   // In the component
   console.log('Received props:', { tokens, maxTokens })
   ```

4. **Compare expected vs actual.** Run the action that should trigger
   the change. Check if:
   - Engine state contains the expected values
   - Presenter transforms them correctly
   - Component receives and displays them correctly

### Common boundary bugs

- **Stale selectors:** Presenter uses cached/memoized values that don't
  update when engine state changes
- **Missing engine reads:** Mobile doesn't call the right engine getter
  after an action completes
- **Type mismatches:** Engine exports a new shape but mobile still
  expects the old interface
- **Action dispatch gaps:** Mobile triggers an engine action but doesn't
  re-read the updated state

### Example: Token accumulation debugging

For Phase 116's token accumulation issue:

1. Verify `engine.resolveRound()` actually increments combat resources
2. Check if `state/actions.ts` re-reads engine state after `resolveRound`
3. Trace `state/presenters/combat.engine.ts` → does it read the fresh
   `combatResources`?
4. Follow the chain to `CrucibleStrip` → does it receive updated token
   counts?

---

## Spec template

Copy this into a new file when starting a fresh spec.

```md
# Spec NN — <Short Title>

## Goal

<1-2 sentences: success state.>

## Why now / dependencies

- **Unblocks:** …
- **Depends on:** …

## Current state

<What's already in code? Honest inventory.>

## Open questions

1. **<short tag>.** <Question>
   > Your answer:

2. …

## Proposed approach

If you have no overrides, the AI will implement in this order:

1. …
2. …

## Acceptance checklist

- [ ] All questions answered.
- [ ] At least one hermetic e2e test under `app/<route>/e2e/` covers
      the change (see `docs/testing.md`).
- [ ] `npm test` and `npx tsc --noEmit` are clean.
- [ ] …

## Out of scope

- …
```

> **Reminder:** the hermetic-e2e checkbox is non-negotiable for any
> spec that touches runtime code. If a spec is purely docs / planning,
> strike the line through with a one-sentence reason.

---

## Common pitfalls

- **Trying to implement before answering questions.** Don't — the
  answers drive the design. Implementation without them produces
  churn.
- **Answering questions you don't actually have an opinion on.** Use
  "Defer to default" or "Either fine — pick whichever". Honest "I
  don't care" is better than a forced opinion.
- **Adding features mid-implementation.** Stop, write a spec, link it
  back to the original. Don't let scope creep eat the PR.
- **Letting specs go stale.** If you change your mind, edit the spec
  and add a `> Updated <date>:` note next to the answer. The spec is
  the source of truth, not your memory.
- **Pretending Spec 01 is still missing.** The Jest/hermetic-e2e harness exists now.
  Use it for runtime work instead of treating tests as blocked.
