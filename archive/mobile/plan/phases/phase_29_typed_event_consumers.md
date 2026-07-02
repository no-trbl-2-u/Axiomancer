# Phase 29 — Typed-event consumers

> **Status: [ ] — sized 1-3 ticks.** Promoted via `/oversight`
> 2026-05-15 (score 6.5). Candidate filed in expand pass 6.
>
> Builds on Phase 25 — `useGameEvents` hook + engine event
> emitter. Phase 25 shipped the channel; Phase 29 ships three
> consumers that give it real load.

## Outcome

Three small consumer surfaces subscribe via `useGameEvents` to
different typed events, each updating a relevant presenter or
local-state field and rendering a small UX improvement:

1. **Level-up badge auto-clear.** Engine emits
   `character:levelup` when the player crosses an XP threshold.
   Mobile already shows a `LEVELUP_BADGE` on the character tab
   (per Phase 26's `selectTabBadges`) whenever
   `experience >= experienceToNextLevel`. After Phase 29: the
   badge ALSO requires the level-up not be acknowledged yet —
   visiting the character screen acknowledges it. This avoids
   nagging the player after they've seen the badge once.
2. **Inventory action toast.** Engine emits `inventory:changed`
   on add / remove / use / equip. Mobile surfaces a transient
   toast `"Picked up X."` / `"Used Y."` / `"Discarded Z."` so
   the player has feedback for actions taken from any screen
   (not just the inventory tab).
3. **Event modal cursor confirmation.** Engine emits
   `dialogue:applied` when the player picks a dialogue choice.
   The event modal already advances the cursor via the action
   layer; the consumer adds a brief visual confirmation flash
   (or a chip) so the player sees their choice take effect
   before the modal re-renders the next dialogue node.

## Sub-tick decomposition

The phase ships in 1-3 sub-ticks depending on how cleanly each
consumer lands. Suggested split:

- **Tick A — Level-up badge auto-clear.** Smallest. New
  `levelUpAcknowledged: boolean` flag on the mobile event
  slice (or a new mobile-only slice). Subscribe to
  `character:levelup` in `selectTabBadges` indirect (likely via
  a `useGameEvents` handler in the tabs `_layout.tsx` or in a
  small wrapper); set `levelUpAcknowledged = false` on the
  event. Set `true` on character-screen mount. `selectTabBadges`
  predicate becomes `experience >= experienceToNextLevel &&
  !levelUpAcknowledged`. e2e: badge appears post-event, clears
  after character-screen visit.
- **Tick B — Inventory action toast.** Add a transient
  toast / feedback slice. Subscribe to `inventory:changed` at
  the app shell level; map the engine payload to a friendly
  toast string. Render via a top-level toast component.
  e2e: dispatching addItem/removeItem fires the toast handler.
- **Tick C — Dialogue confirmation.** Smallest of the three.
  Subscribe to `dialogue:applied` in the event modal screen;
  briefly flash a "chosen" indicator near the chosen-choice
  row. e2e: dispatching `applyDialogue` fires the screen-level
  handler.

If `/ship-a-phase` reaches verify-red between sub-ticks, halt
and re-plan; do not stack.

## Routes / API endpoints / CLI surface — locked

No route changes. Internal-only consumer wiring.

## Content / data reads — engine surface

Every read is from `axiomancer-mechanics` top-level barrel —
all shipped in Phase 25.

| Helper | From | Use |
|---|---|---|
| `useGameEvents(handler)` | `state/GameStoreProvider` (Phase 25) | Subscribe React components to the engine emitter |
| `isLevelUpEvent` / `isInventoryChangedEvent` / `isDialogueAppliedEvent` | top-level engine | Narrow `GameEvent` to the typed variant in each handler |
| `getEmitterForStore` | `state/store` | Test-side emitter handle |

## Components / handlers — modified

**Tick A: level-up badge auto-clear**

- `state/store.ts`: add `levelUpAcknowledged: boolean` to a
  mobile-only slice (extend `MobileEventSlice` or create a
  parallel `MobileNotificationsSlice`). Default `true` on
  store init (no unacknowledged level-up yet).
- `state/presenters/navigation.engine.ts`: `selectTabBadges`
  predicate change: levelup badge requires
  `experience >= experienceToNextLevel` AND
  `!levelUpAcknowledged`.
- `state/GameStoreProvider.tsx` (or a new `app/_layout.tsx`
  effect): on `isLevelUpEvent` → set
  `levelUpAcknowledged = false`.
- `app/(tabs)/character/index.tsx`: on mount, set
  `levelUpAcknowledged = true`.
- `state/e2e/navigation.engine.test.ts`: +2 cases — badge
  with unacknowledged level-up; badge clears with
  acknowledged.

**Tick B: inventory toast**

- Pick or implement a top-level toast surface. The combat
  screen already uses `setToast` per-screen; this phase wants
  a global one. Simplest path: add a `toast` slice
  (`text: string | null` + ttl) to the mobile slice, render in
  `app/_layout.tsx` via a small `<ToastHost>` component, and
  subscribe to `inventory:changed` via `useGameEvents`.
- `state/presenters/inventory-feedback.engine.ts` (new): pure
  function that maps a `TypedInventoryChangedEvent` payload to
  a toast string (`'Picked up Witherwort.'` / `'Used Phial.'`
  / `'Discarded Bone Charm.'`). Engine payload includes
  optional `item` field; presenter handles missing-data path.
- `state/e2e/inventory-feedback.engine.test.ts` (new): pure
  unit tests on the mapper.

**Tick C: dialogue confirmation**

- `app/event/index.tsx`: subscribe to `dialogue:applied` via
  `useGameEvents`; on fire, set a local `lastConfirmedChoice`
  string for ~500ms to flash a checkmark / glyph next to the
  matched row.
- `state/e2e/event.screen.test.tsx`: +1 case — dispatching
  `applyDialogue` fires the screen handler.

## Cross-links

**In (verify before starting):**

- Phase 25 shipped (`8baf594`) — emitter + `useGameEvents`
  hook live.
- `pnpm verify` green at baseline (371/371 after Phase 28).
- Engine emitter fires `character:levelup` / `inventory:changed`
  / `dialogue:applied` per `node_modules/axiomancer-mechanics/dist/Game/events.d.ts`.

**Out (ships across sub-ticks):**

- `state/store.ts` — slice extension (Tick A + Tick B).
- `state/presenters/navigation.engine.ts` — predicate change
  (Tick A).
- `state/presenters/inventory-feedback.engine.ts` — new (Tick B).
- `app/_layout.tsx` — global toast host (Tick B).
- `app/(tabs)/character/index.tsx` — acknowledge effect (Tick A).
- `app/event/index.tsx` — confirmation flash (Tick C).
- e2e: +5-8 hermetic tests across the three ticks.

## Decisions made upfront — DO NOT ASK

1. **Single mobile slice, three fields.** Don't proliferate
   slices. Extend `MobileEventSlice` (or rename to
   `MobileMetaSlice`) with `levelUpAcknowledged`,
   `toast: { text: string; ttl: number } | null`. The
   dialogue-confirmation flash stays component-local (no
   slice).

2. **Tick A is the canonical-pattern shipping commit.** B and
   C reuse the same `useGameEvents` pattern; if A lands clean,
   B and C ship faster.

3. **Toast host lives in `app/_layout.tsx`** — global means
   accessible from any screen via the slice. Auto-dismiss
   after ~3 seconds.

4. **`isLevelUpEvent` / `isInventoryChangedEvent` /
   `isDialogueAppliedEvent` are the narrow guards.** Use them
   inside the `useGameEvents` handler — no manual
   type-checking on `event.type`.

5. **No new behaviour beyond the consumer wiring.** Don't
   sneak combat-log or hazard-toast work in. Those are
   separate iterate rows.

6. **Component tests stay sparse.** Hermetic e2e on the
   presenter-layer mappers and the slice transitions; no
   render snapshot tests for the toast or flash.

7. **Acknowledgment semantics for the level-up badge:**
   the badge re-arms only when a NEW `character:levelup` event
   fires. Just visiting character screen multiple times
   without a new level-up doesn't re-show the badge.

## Pages x tests matrix

| Surface | Test file | Cases (delta) |
|---|---|---|
| Tick A — levelUpAcknowledged transitions | `state/e2e/navigation.engine.test.ts` | +2 (badge shows when unacknowledged; clears after character-screen visit) |
| Tick A — emitter subscription wiring | (covered by existing engine-events test) | 0 new (Phase 25 cases already pin the channel) |
| Tick B — inventory feedback mapper | `state/e2e/inventory-feedback.engine.test.ts` (new) | +3-4 (addItem → "Picked up", removeItem → "Discarded", useConsumable → "Used", missing-payload → null) |
| Tick C — dialogue confirmation handler | `state/e2e/event.screen.test.tsx` | +1 (dispatching applyDialogue fires the handler) |

Approx **+5-8** hermetic tests. Verify target: ~376-379.

## Verify gate

```bash
pnpm verify
```

Baseline 371/371. Target green; +5-8 tests after ship.

## Deploy gate

Stub.

## Commit body template (Tick A)

```
feat(spec29 tick A): level-up badge auto-clear on character:levelup (Phase 29)

Phase 29 sub-tick A — first consumer of Phase 25's engine event
channel. The character tab's LEVELUP_BADGE no longer nags after
the player has seen it once.

- state/store.ts: levelUpAcknowledged flag on mobile slice;
  defaults to true (no pending level-up at fresh start).
- state/GameStoreProvider.tsx (or app/_layout.tsx): subscribe
  to character:levelup via useGameEvents; set
  levelUpAcknowledged = false on fire.
- app/(tabs)/character/index.tsx: on mount, set
  levelUpAcknowledged = true. The badge clears.
- state/presenters/navigation.engine.ts: selectTabBadges
  predicate now requires experience >= experienceToNextLevel
  AND !levelUpAcknowledged.
- state/e2e/navigation.engine.test.ts: +2 cases.

Decisions per the brief:
- Single mobile slice; no slice proliferation.
- Acknowledgment re-arms only on a new character:levelup
  event — not on every character-screen revisit.
- Tick A is the canonical-pattern commit; Ticks B + C reuse
  the same useGameEvents pattern.

verify: N tests passing.
```

## Definition of Done (across all sub-ticks)

1. Level-up badge predicate respects `levelUpAcknowledged`.
2. Inventory toast fires globally on engine `inventory:changed`.
3. Dialogue choice flash fires in the event modal on engine
   `dialogue:applied`.
4. +5-8 hermetic tests.
5. Phase 29 row in `plan/steps/01_build_plan.md` flipped
   `[ ]` → `[x]` with commit hash(es).
6. Phase log entry appended.

## Follow-ups (out of scope this phase)

- **Combat-log via typed events.** Engine `combat:round`
  payload is `{state}` only; the round-event detail lives
  outside the channel. Defer — combat log keeps its
  `summarizeRoundEvents` bespoke severity inference per
  Phase 25's brief.
- **World-moved / world-processed consumers.** No clear UX
  hook yet; defer.
- **Game saved/loaded consumers.** Nice-to-have toasts; not
  required for this phase.
- **Toast queue.** The proposed slice holds one toast at a
  time; rapid-fire inventory changes drop later toasts. A
  queue is a follow-up iterate row if it becomes painful.
