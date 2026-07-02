# Phase 139 — Memoir inner tab: Alliances

## Outcome

Implement the read-only **Alliances** inner tab inside Memoir.

The tab should make it clear that this is the player's record of relationships, allegiances, befriended enemies, faction ties, and unresolved social obligations — without pretending the player can act on those records yet.

## Source / user decision

T direct steering, 2026-06-19:

> Let's add a few "inner tabs" to memoir. "Quests", "alliances", "philosophy", and "Effects". It should be clear what each one is.

Clarification:

- The tabs are **read-only for now**.

## Dependency

Depends on Phase 138 shipping the Memoir inner-tab scaffold.

## Current state to start from

Likely data sources to audit before implementation:

- `state/presenters/memoir.engine.ts`
- `app/(tabs)/memoir/index.tsx`
- engine/player codex or unlocked journal entries from friendship outcomes
- combat aftermath friendship/codex unlock flow in `app/(tabs)/combat.tsx`
- any existing quest/dialogue/faction flags in player/save state

If current engine/mobile state has no durable alliance/faction shape beyond friendship/codex unlocks, ship the tab honestly with those available records plus an empty-state placeholder. Do not fake a faction system.

## Decisions made upfront — DO NOT ASK

- Read-only only: no “join,” “betray,” “pin,” “favor,” or relationship action buttons.
- Alliances should include available durable friendship/befriending records first.
- If factions are not in state yet, render a clear empty section: “No factions have named you yet.”
- If only codex/journal unlocks exist from friendships, label them honestly as “Bonds” or “Known bonds,” not full alliances.
- Include a short explanatory tab description so the player knows what belongs here.
- Do not add engine alliance state in mobile.
- Do not infer alliances from quest text strings.

## Implementation units

1. **Audit durable relationship truth**
   - Files likely involved:
     - `state/presenters/memoir.engine.ts`
     - `state/actions.ts`
     - `app/(tabs)/combat.tsx`
     - any codex/journal presenter files
   - Identify what mobile can truthfully read today: befriended enemies, codex unlocks, dialogue flags, faction flags, quest affiliations.
   - Document in code comments if the tab is currently limited by engine state.

2. **Presenter model**
   - File: `state/presenters/memoir.engine.ts`
   - Add `alliances` VM section with:
     - tab title `ALLIANCES`
     - description/subline
     - grouped rows, likely `bonds`, `factions`, `unknown`
     - empty-state copy for each missing group
   - Keep all copy presenter-owned.

3. **Screen rendering**
   - File: `app/(tabs)/memoir/index.tsx`
   - Render the Alliances tab body when `ALLIANCES` is selected.
   - Use row cards with name, category, and one-line status/source.
   - Keep it legible and clearly distinct from Quests.

4. **Tests**
   - Extend `state/e2e/memoir.engine.test.ts`.
   - Add render/screen coverage for selecting `ALLIANCES`.
   - Required assertions:
     - Alliances tab exists after Phase 138 scaffold;
     - tab description explains relationships/bonds;
     - empty state appears when no durable alliance data exists;
     - friendship/bond records appear if a fixture supplies them;
     - no action buttons render.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/e2e/memoir.engine.test.ts
npm run verify
```

If visual smoke is available, capture the Memoir route with `ALLIANCES` selected.

## Commit body template

```text
Phase 139 — Memoir inner tab: Alliances

- add read-only Alliances tab content to Memoir
- surface durable friendship/bond/alliance truth where available
- render honest empty states for missing faction/alliance data
- avoid mobile-local faction simulation or player actions

Verification:
- npm run typecheck
- npm test -- --runInBand state/e2e/memoir.engine.test.ts
- npm run verify
```

## Definition of Done

- Alliances tab is selectable from the Memoir inner-tab row.
- The tab clearly explains that it records bonds/alliances/relationships.
- Available durable relationship records render honestly.
- Missing alliance/faction data renders clear empty states, not fake content.
- The surface is read-only.
- Tests and `npm run verify` are green.

## Follow-ups out of scope

- A full faction system.
- Relationship actions or pinning.
- New mechanics state for alliances.
- Quest progress changes.
