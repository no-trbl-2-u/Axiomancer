# Phase 16 — Guided first-delve tutorial for the Loot-Cache encounter

> Build-plan row: `Phase 16 — Loot-Cache ("The Reliquary") first-delve tutorial
> (GAP-001 follow-up), mirroring the Rest/Gathering/Combat tutorials (mobile)`.

## 0. Scope call (read this first)

Phase 15 shipped the Hazard tutorial and queued Loot-Cache and Quest Board as
the two remaining GAP-001 follow-ups. This phase ships Loot-Cache — picked
next per the build-plan row order.

The Reliquary is the simplest of the four minigames to script: no route or
site selection, no drag-and-drop, no hidden trap state (the Pick Pool redesign
made every layer's difficulty public from the start). Three layers
(THE LID → THE FALSE BOTTOM → THE KEEPER'S TITHE), one live decision loop per
layer (push the dice pool or retreat), and one session-wide decision (keep
delving deeper, or seal and walk away with what is already lifted). The coach
teaches the moves needed to open one layer and leave with the take — it does
not require the player to crack all three, mirroring Gathering's "leaving is
a move" restraint doctrine (WITHDRAW) rather than Hazard's single forced
crossing.

**Five core moves, five steps:** begin (kneel), delve (commit to a layer),
push (roll the dice pool), read the card (dismiss the result), and leave
(seal + claim). Channeling Insight (`STEADY THE HAND`, a one-per-session
bonus-die charge) is explicitly out of scope (§14) — same class of exclusion
as Hazard's FORETELL: a real, always-available action, but optional and not
required to complete a first delve, so teaching it would pad the script for a
side move.

## 1. Routes / API / CLI surface

No new routes. Reuses `/cache` (`app/cache/index.tsx`) unchanged in
structure; the coach renders as a bottom-docked overlay atop the existing
`CacheScreen`, same pattern as `app/rest/index.tsx`'s `<TutorialCoach>`.

Unlike Hazard, the cache screen has **no full-screen overlay phases** — intro,
the layer stack, the result card, and the ledger all render inline in one
`ScrollView` (see `app/cache/index.tsx`). So the coach is **not** phase-gated
(no equivalent of Hazard's `route-select`/`playing` guard) — it renders
across every phase, same as Rest's and Gathering's coaches.

## 2. Content / data reads

| Helper | Call | Use |
|---|---|---|
| `createLootCacheSession` (`@mechanics`) | via `beginLootCacheAction(store, { tutorial: true })` | Pinned first-delve session |
| `CACHE_TUTORIAL_STEPS` (new) | `currentTutorialStep(session, vm)` | Coach script cursor |

No new mechanics-side content — the Reliquary's three-layer template, tuning
(`LOOT_CACHE_TUNING`), and the `rollCacheLoot` reward table are unchanged.

Unlike Hazard/Gathering, a cache session has no site/hazard id to pin — every
session uses the same three authored layers (LID / FALSE BOTTOM / KEEPER'S
TITHE, `LOOT_CACHE_LAYER_COUNT = 3`). Only the **seed**, the **reward tier**,
and the **starting currency** need pinning:

- **Seed 1.** Probed directly against `createLootCacheSession` +
  `pushLootCachePick`: THE LID (difficulty 5, a 3-die pool) rolls
  `[6, 1, 2]` on the very first push — gained 8 progress (`6 + 2`, the `1`
  doesn't count), one slip, zero jam risk brushed (jam threshold is 2 slips).
  The layer cracks clean on the first push without the coach needing to
  script a retry.
- **Tier `'modest'`** (`CACHE_TUTORIAL_TIER`) — same tier a fresh (non
  northern-forest) save would organically roll; `rollCacheLoot({ playerLevel:
  1, seed: 1, tier: 'modest' })` returns 1–2 level-eligible equipment pieces
  (or an empty list if none are level-1-eligible — the empty-state path
  already renders correctly, see §7).
- **Currency 4** (`CACHE_TUTORIAL_CURRENCY`) — small, non-zero so the ledger
  and false-bottom/tithe currency scaling have something to show.

Predicates are written against `phase` / `pick` / `depth` only — never the
exact roll or how many layers get opened — so a player who keeps delving past
THE LID, or who jams a later layer, still completes the script.

## 3. Components / handlers

New:
- `components/cache/tutorial-steps.ts` — `CacheTutorialStep[]` +
  `currentTutorialStep(session, vm)`. Literal template:
  `components/gathering/tutorial-steps.ts`.
- `components/cache/CacheTutorialCoach.tsx` — bottom-docked banner, literal
  template: `components/rest/TutorialCoach.tsx` (unconditional render, no
  phase guard — see §0/§1 for why Cache doesn't need Hazard's guard).
- `components/DebugEncounterButtons.tsx` — the existing `DEBUG · LOOT CACHE`
  row gains a second, `TUTORIAL`-labeled button ahead of the existing `DIG`
  button, template: `components/DebugGatheringButton.tsx`'s two-button row.

Reused: `makeStyles`/`usePalette` (`@/theme/runtime`), `FONTS`
(`@/theme/axm`), `react-native-reanimated` `FadeInDown`.

## 4. Cross-links

- **In:** the organic map-triggered loot-cache path (`state/actions.ts`, the
  `result.event.kind === 'loot-cache'` branch) starts the tutorial
  automatically for a save without `CACHE_TUTORIAL_FLAG`, mirroring the
  hazard/gathering/rest triggers exactly. When the tutorial fires, it ignores
  the triggering event's own tier/currency (mapName-derived) in favor of the
  pinned tutorial tier/currency — same as Hazard overriding the triggering
  node's hazard id with the pinned `cracked-cliff`.
- **Out:** none (the Reliquary is a dead-end minigame; claim/abandon returns
  to the map).
- **Retro-fit:** none needed — `components/dev/DevToolsSections.tsx` already
  lazy-imports and renders `<DebugEncounterButtons>`; the new button lands
  inside that existing file, no new wiring there.

## 5. Output schema / contracts

```ts
// state/cache/store-actions.ts
export const CACHE_TUTORIAL_FLAG = 'cache-tutorial-done';
export const CACHE_TUTORIAL_SEED = 1;
export const CACHE_TUTORIAL_TIER: CacheLootTier = 'modest';
export const CACHE_TUTORIAL_CURRENCY = 4;

export interface BeginLootCacheOptions {
    items?: readonly Item[];
    currency?: number;
    seed?: number;
    lootTable?: { tier: CacheLootTier };
    /** Start the guided first delve (pinned seed + tier/currency unless overridden). */
    tutorial?: boolean;
}

export function completeLootCacheTutorialAction(store: AppStore, skipped: boolean): void;
```

`beginLootCacheAction` gains the `tutorial` option: when true, resolves the
seed via `resolveMinigameSeed('cache', options.seed,
globalThis.__AXM_CACHE_SEED__, CACHE_TUTORIAL_SEED)` (mirrors
hazard/gathering's precedence chain exactly), defaults the reward roll to
`{ tier: CACHE_TUTORIAL_TIER }` when neither `items` nor `lootTable` is
explicitly passed, defaults `currency` to `CACHE_TUTORIAL_CURRENCY` when not
explicitly passed, and sets `cache: { session, stash, tutorial: true }`. A
normal (organic, non-tutorial) call keeps `tutorial: false`.

```ts
// state/store.ts
export interface MobileCacheSlice {
    session: LootCacheSession | null;
    stash: Readonly<Record<string, Item>>;
    /** True while this session is the guided first delve. */
    tutorial: boolean;
}
export const EMPTY_CACHE_SLICE: MobileCacheSlice = Object.freeze({
    session: null,
    stash: Object.freeze({}),
    tutorial: false,
});
```

`AppActions` gains `completeLootCacheTutorial: (skipped: boolean) => void`,
wired the same way as `completeHazardTutorial` / `completeGatheringTutorial`
/ `completeRestTutorial`.

## 6. Hero / body / sub-section composition

Coach banner (mirrors rest/gathering/hazard exactly): eyebrow `THE FIRST
DELVE · N / TOTAL`, title, body copy, `lookFor` hint line, `SKIP ✕` in the
header row. Bottom-docked at `bottom: 24` — the cache screen has no fixed
bottom action bar (all buttons scroll with the content, like Rest's), so this
uses Rest's docking convention, not Hazard's/Gathering's raised offsets.

Five steps (predicates written against `phase` / `pick` / `depth` only —
never the exact roll, the specific layer index, or how many layers get
opened — so a player who ignores the recommended "seal after one layer" advice
still completes the script, per Gathering's "recommended, not forced"
doctrine):

1. `begin` — "a cache, long unclaimed" — kneel and start picking.
   `done: (s) => s.phase !== 'intro'`.
2. `delve` — "pick a lock" — tap DELVE DEEPER to open a live pick attempt on
   THE LID. `done: (s) => s.pick !== null || s.depth > 0`.
3. `push` — "push your luck" — tap the dice tray or PUSH to roll the pick
   pool; every non-1 die adds progress, two or more 1s in one roll jams the
   pick. `done: (s) => (s.pick !== null && s.pick.lastRoll !== null) || s.depth > 0`.
4. `card` — "read what happened" — the result card (cracked / jammed /
   resisted); tap GO ON (or NURSE THE HAND on a jam) to continue.
   `done: (s) => s.phase === 'delving' || s.phase === 'outcome' || s.phase === 'done'`.
5. `outcome` — "leaving is a move" — recommends sealing after the first layer
   rather than pushing to the next (deeper layers are slower and the trap
   bite grows); tap TAKE WHAT'S LIFTED AND GO, then POCKET IT ALL.
   `done: (s) => s.phase === 'outcome' || s.phase === 'done'` — the same
   OR-across-terminal-phases shape as Hazard's `outcome` step and Gathering's
   `withdraw` step, for the identical reason: claiming nulls the whole
   `cache` slice in the same store update the engine transitions to `'done'`,
   so a predicate gated on `'done'` alone would never be observed live. This
   step's own banner is effectively never seen once `'outcome'` is reached
   (same acknowledged trade-off as Hazard's final step) — its job is solely
   to let the completion `useEffect` observe script-complete (`index === -1`)
   while the session is still non-null, so `completeLootCacheTutorial(false)`
   fires before the slice clears.

## 7. Empty / loading / error states

Coach renders `null` when `currentTutorialStep(...) === -1` (script done) or
`cache.tutorial !== true`. No loading/error states — the coach is a pure
derived overlay, same as rest/gathering/hazard's. The pinned reward roll may
legitimately return zero items (no level-1-eligible equipment template) —
`CacheScreen` already renders `lootSummary` as `null` and omits the chip row
when a layer's loot is empty; no new empty-state branch needed.

## 8. Decisions made upfront — DO NOT ASK

- **Seal is recommended, not forced.** Step 5's copy nudges TAKE WHAT'S
  LIFTED AND GO after the first layer, but its predicate is written against
  `s.phase`/`s.depth`, not a specific layer count — a player who keeps
  delving through all three layers (or who jams one) still completes the
  script once `s.phase` reaches `'outcome'`.
- **Seed 1, tier `'modest'`, currency 4.** Probed directly against
  `createLootCacheSession`/`pushLootCachePick` (see §2) — a clean one-push
  crack on THE LID with one visible slip (teaches the slip concept without
  risking a first-push jam), reused as-is, no engine changes.
- **No forced clean run.** Unlike a scripted puzzle, the Reliquary's pick
  pool can still jam on a later push or a later layer — the coach teaches the
  mechanic, not a curated always-wins outcome. Matches Hazard's precedent
  ("the coach teaches the mechanic, not a curated victory").
- **Insight (`STEADY THE HAND`) is out of scope** (see §0) — a real,
  always-available one-charge action, but optional; pushed to a follow-up
  note, not a numbered phase (same class of exclusion as Hazard's FORETELL).
- **Coach is NOT phase-gated** (unlike Hazard) — cache has no full-screen
  overlay phases; every phase renders inline in one `ScrollView`, so the
  banner can safely render throughout, mirroring Rest/Gathering.
- **The tutorial trigger overrides the organic tier/currency.** The map event
  that fires the first-ever loot-cache still decides *when* the tutorial
  starts, but not *what* it contains — same as Hazard overriding the
  triggering node's hazard id with the pinned `cracked-cliff`.
- **`DebugEncounterButtons`'s LOOT CACHE row gains a TUTORIAL button**
  (existing DIG button untouched), matching `DebugGatheringButton`'s
  two-button row.

## 9. Mobile reflow / responsive

No new layout risk — the coach is an absolutely-positioned overlay atop the
existing `CacheScreen`'s `ScrollView`, verified at 375px via the existing
cache e2e coverage pattern (`state/e2e/cache.flow.engine.test.ts`) — no
dedicated `cache.mobile.spec` exists today, consistent with rest/gathering/
hazard not having one either.

## 10. Pages × tests matrix

| Surface | Test |
|---|---|
| `components/cache/tutorial-steps.ts` | `components/cache/__tests__/tutorial-steps.test.ts` — predicate unit tests, template: gathering's `tutorial-steps.test.ts` |
| `components/cache/CacheTutorialCoach.tsx` | `components/cache/__tests__/CacheTutorialCoach.test.tsx` — render test, template: gathering's `TutorialCoach.test.tsx` |
| Store wiring (flag, slice, trigger) | `state/e2e/cache.tutorial.engine.test.ts` — hermetic store-level e2e, template: `state/e2e/gathering.tutorial.engine.test.ts` |

## 11. Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mechanics untouched — no mechanics/card-editor verify needed (no `@mechanics`
public-surface change).

## 12. Commit body template

```
feat(mobile): guided first-delve reliquary tutorial — phase 16

- <bullets>

Decisions:
- <picked X over Y because ...>

Closes #<phase-issue-number>
```

## 13. DoD

- [ ] `CACHE_TUTORIAL_FLAG` / `CACHE_TUTORIAL_SEED` / `CACHE_TUTORIAL_TIER` /
      `CACHE_TUTORIAL_CURRENCY` / `tutorial` slice field /
      `completeLootCacheTutorialAction` shipped in
      `state/cache/store-actions.ts` + `state/store.ts`.
- [ ] `components/cache/tutorial-steps.ts` +
      `components/cache/CacheTutorialCoach.tsx` shipped, wired into
      `app/cache/index.tsx`.
- [ ] Organic map-trigger in `state/actions.ts` starts the tutorial for a
      flag-less save.
- [ ] `components/DebugEncounterButtons.tsx`'s LOOT CACHE row gains the
      TUTORIAL button.
- [ ] All three test files in §10 pass.
- [ ] `npm run verify --workspace axiomancer-mobile` green.

## 14. Follow-ups (out of scope)

Append as a new build-plan row once Phase 16 ships (do not renumber existing
rows) — already queued:

- **Phase 17 — Quest Board ("The Boy's Almanac") first-session tutorial.**

Net-new follow-up worth a future `/expand` candidate, not a numbered phase on
its own: an Insight-specific coach beat (either folded into a later Reliquary
content pass, or a standalone "advanced delving techniques" tip surfaced
after N delves) — deferred here because teaching the one-per-session
`STEADY THE HAND` charge inside the first-ever delve would mean either
forcing a specific opening choice or padding the script for an optional move.
