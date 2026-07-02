# Phase 138 — Memoir inner tabs: Quests

## Outcome

Install the Memoir inner-tab shell and make **Quests** the first read-only inner tab.

The Memoir screen should stop presenting all journal material as one long page. It should expose clear inner tabs for the four coming surfaces:

- `QUESTS`
- `ALLIANCES`
- `PHILOSOPHY`
- `EFFECTS`

This phase implements the tab scaffold and moves the existing quest/errand surface into the `QUESTS` inner tab.

## Source / user decision

T direct steering, 2026-06-19:

> Let's add a few "inner tabs" to memoir. "Quests", "alliances", "philosophy", and "Effects". It should be clear what each one is.

Clarifications:

- The tabs are **read-only for now**.
- This phase is one of four phases, one per inner tab.

## Current state to start from

Existing Memoir files:

- `app/(tabs)/memoir/index.tsx`
- `state/presenters/memoir.engine.ts`
- `state/e2e/memoir.engine.test.ts`

Current screen already has an `Errands`/quest section and a `selectMemoirViewModel` quest model. Reuse that truth. Do not invent quest rules.

## Decisions made upfront — DO NOT ASK

- Inner tabs are local UI state only; no navigation route split in this phase.
- Read-only means no “track quest,” no pinning, no action buttons.
- `QUESTS` is the default selected inner tab after the header.
- Preserve existing quest grouping: active, completed, forgotten/failed.
- Rename player-facing copy from vague `Errands` toward clear `QUESTS` language where the presenter owns the label.
- Keep Chronicle content either above the inner tabs as the general Memoir header/history, or leave it as-is if moving it would bloat the phase. The required tabbed surface is the four inner tabs.
- Do not change engine quest state or reducer behavior.

## Implementation units

1. **Presenter label cleanup**
   - File: `state/presenters/memoir.engine.ts`
   - Add VM labels for inner tabs: quests, alliances, philosophy, effects.
   - Ensure the quest tab has a clear description/subline such as “Promises taken, broken, or completed.”
   - Rename or alias `questsEyebrow` as `QUESTS` while preserving existing tests where practical.

2. **Inner-tab component**
   - File: `app/(tabs)/memoir/index.tsx`
   - Add local state for selected inner tab.
   - Render a horizontal row of four tab buttons beneath the Memoir header.
   - Use clear accessibility labels: `Open Quests memoir tab`, etc.
   - Add test IDs such as `memoir-inner-tab-quests`.

3. **Move existing quest section under `QUESTS`**
   - File: `app/(tabs)/memoir/index.tsx`
   - Existing quest cards and active/completed/forgotten groups should render only when `QUESTS` is selected.
   - Empty state remains presenter-sourced.

4. **Tests**
   - Extend `state/e2e/memoir.engine.test.ts` for labels/descriptions.
   - Add or extend a screen/render test if one exists for Memoir; otherwise add one under `state/e2e/` or `components/__tests__/` following current harness patterns.
   - Required assertions:
     - four inner tabs render;
     - `QUESTS` is selected by default;
     - quest groups render under `QUESTS`;
     - switching away hides quest cards;
     - no action buttons such as track/pin appear.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/e2e/memoir.engine.test.ts
npm run verify
```

If visual smoke is available, capture the Memoir route with the `QUESTS` tab selected.

## Commit body template

```text
Phase 138 — Memoir inner tabs: Quests

- add Memoir inner-tab scaffold for Quests / Alliances / Philosophy / Effects
- make Quests the default read-only tab
- move existing quest groups under the Quests tab
- preserve engine-owned quest state and presenter-sourced copy

Verification:
- npm run typecheck
- npm test -- --runInBand state/e2e/memoir.engine.test.ts
- npm run verify
```

## Definition of Done

- Memoir has a visible four-tab inner-tab row.
- Quests tab is clear, read-only, and selected by default.
- Existing quest data appears only inside the Quests tab.
- Accessibility labels and test IDs exist for tab switching.
- Tests cover tab visibility and quest rendering.
- `npm run verify` is green.

## Follow-ups out of scope

- Alliances content beyond a tab placeholder.
- Philosophy content beyond a tab placeholder.
- Effects accordion content.
- Quest tracking/pinning/actions.
