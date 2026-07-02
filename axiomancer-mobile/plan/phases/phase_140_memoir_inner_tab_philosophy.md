# Phase 140 — Memoir inner tab: Philosophy

## Outcome

Implement the read-only **Philosophy** inner tab inside Memoir.

This tab should make the player's moral and philosophical posture clear: moral meter, philosophical alignment axes/stance where available, why the current label is being shown, and what recent choices have pushed the player there.

## Source / user decision

T direct steering, 2026-06-19:

> Let's add a few "inner tabs" to memoir. "Quests", "alliances", "philosophy", and "Effects". It should be clear what each one is.

Clarification:

- The tabs are **read-only for now**.

## Dependency

Depends on Phase 138 shipping the Memoir inner-tab scaffold.

## Current state to start from

Existing Memoir already renders a `Measure` section:

- moral alignment chip sourced from `moralMeter`
- provisional philosophical alignment currently derived from highest base stat in `state/presenters/memoir.engine.ts`
- tooltip wrappers for moral/philosophical alignment in `app/(tabs)/memoir/index.tsx`

There are also signs of a richer engine/mobile philosophical alignment shape in dev controls. Audit current package exports/state before implementation.

## Decisions made upfront — DO NOT ASK

- Move the existing moral/philosophical “Measure” material into the Philosophy inner tab.
- If the engine exposes richer philosophical axes, use them; if not, keep the current provisional base-stat derivation but label it clearly as provisional.
- Read-only only: no “choose doctrine,” no alignment spending, no manual reflection button.
- Philosophy should explain what each displayed value means in plain UI copy.
- Preserve existing tooltip affordances for alignment chips.
- Do not alter moral/philosophical mechanics.
- Do not invent philosopher quotes unless a real quote inventory exists.

## Implementation units

1. **Audit alignment truth**
   - Files likely involved:
     - `state/presenters/memoir.engine.ts`
     - `state/actions.ts`
     - `components/DebugAlignmentShift.tsx`
     - engine exports for philosophical alignment if available
   - Decide whether Philosophy reads `moralMeter`, richer `philosophicalAlignment`, or the existing provisional stat-derived fallback.
   - Prefer engine/mobile state over derived fiction.

2. **Presenter model**
   - File: `state/presenters/memoir.engine.ts`
   - Add a `philosophy` section with:
     - tab title `PHILOSOPHY`
     - description/subline
     - moral row/chip
     - philosophical row(s)
     - rationale/cause text
     - empty/provisional copy
   - Keep the existing moral/provisional model stable if reused.

3. **Screen rendering**
   - File: `app/(tabs)/memoir/index.tsx`
   - Render the Philosophy body only when `PHILOSOPHY` is selected.
   - Move existing `Measure` section into this body.
   - Make clear what is moral record and what is philosophical posture.

4. **Tests**
   - Extend `state/e2e/memoir.engine.test.ts`.
   - Required assertions:
     - Philosophy tab exists and is selectable;
     - moral meter chip renders in Philosophy;
     - philosophical label/rationale renders in Philosophy;
     - provisional state is explicitly labeled when the source is still provisional;
     - no action buttons render.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/e2e/memoir.engine.test.ts components/__tests__/DebugAlignmentShift.test.tsx
npm run verify
```

If visual smoke is available, capture the Memoir route with `PHILOSOPHY` selected.

## Commit body template

```text
Phase 140 — Memoir inner tab: Philosophy

- move moral/philosophical measure into the Philosophy inner tab
- read engine/mobile alignment truth where available
- label provisional philosophical inference honestly when needed
- preserve alignment tooltip behavior and read-only posture

Verification:
- npm run typecheck
- npm test -- --runInBand state/e2e/memoir.engine.test.ts components/__tests__/DebugAlignmentShift.test.tsx
- npm run verify
```

## Definition of Done

- Philosophy tab is selectable from the Memoir inner-tab row.
- Moral alignment and philosophical posture are clear and separated.
- Existing tooltip behavior survives.
- Any provisional derivation is plainly labeled.
- No player actions are added.
- Tests and `npm run verify` are green.

## Follow-ups out of scope

- New philosophy mechanics.
- Manual alignment choice UI.
- Philosopher quote inventory unless already present.
- Effects/alliances/quests content beyond preserving tab shell compatibility.
