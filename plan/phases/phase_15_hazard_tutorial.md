# Phase 15 — Guided first-crossing tutorial for the Hazard minigame

> Build-plan row: `Phase 15 — Hazard first-crossing tutorial (GAP-001
> follow-up): guided first-run coach for the Hazard minigame, mirroring the
> Rest/Gathering/Combat tutorials (mobile)`.

## 0. Scope call (read this first)

Phase 11 shipped the Rest tutorial and queued Hazard, Loot-Cache, and Quest
Board as follow-ups, naming Hazard "the largest remaining gap... the most
complex of the four" (route selection, staging/powering cards, foretell).
This phase ships Hazard — the second of the three, picked next because it
is the highest-traffic un-coached surface (every hazard map event, the most
common node kind after combat/interaction).

**What "the most complex" means in practice, and how this brief tames it:**
Hazard has route-select, a dice roll, a drag-and-drop play area (stage /
power / apply / resolve), an optional FORETELL sub-flow, and a rewards
claim. Scripting a guided win is not the goal — mirroring Rest's doctrine
("posture is recommended, not forced"), **this phase teaches the five core
moves (route, stage, power, apply, resolve) and lets the crossing's outcome
land however the pinned hand actually resolves.** FORETELL is explicitly
out of scope (§14) — it depends on drawing a `foretell` card, which the
pinned starter-bag seed below does not guarantee, and teaching it doubles
the script's length for a secondary mechanic.

**Existing `HazardIntroOverlay` is not the tutorial.** It is a
flavor/danger-warning modal shown before EVERY hazard (map- or
dev-triggered) — sealed, non-dismissible except by its one CTA. The coach
in this phase is a second, separate overlay: a skippable, bottom-docked
banner that walks the first crossing's moves, exactly like
`components/rest/TutorialCoach.tsx` and
`components/gathering/TutorialCoach.tsx`.

## 1. Routes / API / CLI surface

No new routes. Reuses `/hazard` (`app/hazard/index.tsx`) unchanged in
structure; the coach renders as a bottom-docked overlay on top of
`<HazardBoard>` / `<RouteSelect>`, same pattern as `app/rest/index.tsx`'s
`<TutorialCoach>`.

## 2. Content / data reads

| Helper | Call | Use |
|---|---|---|
| `createHazardSession` (`@mechanics`) | `createHazardSession(HAZARD_TUTORIAL_SEED, hazardDeckBag(flags), HAZARD_TUTORIAL_ID)` | Pinned first-crossing session |
| `HAZARD_TUTORIAL_STEPS` (new) | `currentTutorialStep(session, vm)` | Coach script cursor |

No new mechanics-side content — Hazard's authored library, cards, and
routes are unchanged. Seed **3**, hazard **`cracked-cliff`** (probed via
`createHazardSession(3, hazardDeckBag([]), 'cracked-cliff')` against the
zero-flags starter bag — the same bag a fresh save has):

- Opening hand: `ironwill` (IRON WILL, red), `footing` (SURE FOOTING,
  purple), `footing` (SURE FOOTING, purple), `refrain` (REFRAIN, purple),
  `spite` (SPITE, red). All five are plain force/escape cards with no
  utility that needs extra explanation (`footing`'s `draw` effect fires
  automatically on apply — a pleasant surprise, not a script dependency).
- Dice roll (both routes — the RNG stream is route-independent at this
  point in `createHazardSession`/`selectHazardRoute`): **`purple, red,
  purple, red`** — zero `hex` (blocked) dice, and every hand card's colour
  has a matching die, so the POWER step always has a valid target
  regardless of which card the player drags first.
- This ordering teaches, in sequence: danger intro (existing) → route
  choice → dice roll (existing overlay) → stage a card → power it with a
  matching die → apply it → resolve the round (PLAY) → read the outcome
  and claim.

## 3. Components / handlers

New:
- `components/hazard/tutorial-steps.ts` — `HazardTutorialStep[]` +
  `currentTutorialStep(session, vm)`. Literal template:
  `components/gathering/tutorial-steps.ts`.
- `components/hazard/HazardTutorialCoach.tsx` — bottom-docked banner,
  literal template: `components/rest/TutorialCoach.tsx` (same skip
  affordance, same positioning convention). Named `HazardTutorialCoach`
  (not bare `TutorialCoach`) because `components/hazard/` already has
  `HazardIntroOverlay` / `HazardOverlays` — the `Hazard` prefix keeps the
  file grep-distinct from gathering's/rest's same-named siblings that live
  in their own directories.
- `components/DebugHazardButton.tsx` — gains a TUTORIAL button, template:
  `components/DebugGatheringButton.tsx`'s two-button row (GO / TUTORIAL).

Reused: `makeStyles`/`usePalette` (`@/theme/runtime`), `FONTS`
(`@/theme/axm`), `react-native-reanimated` `FadeInDown`.

## 4. Cross-links

- **In:** the organic map-triggered hazard path
  (`state/actions.ts`, the `result.event.kind === 'hazard'` branch) starts
  the tutorial automatically for a save without `HAZARD_TUTORIAL_FLAG`,
  mirroring the gathering/rest triggers exactly.
- **Out:** none (Hazard is a dead-end minigame; claim/death returns to the
  map).
- **Retro-fit:** none needed — `components/dev/DevToolsSections.tsx`
  already lazy-imports and renders `<DebugHazardButton>`; the TUTORIAL
  button lands inside that existing file, no new wiring there.

## 5. Output schema / contracts

```ts
// state/hazard/store-actions.ts
export const HAZARD_TUTORIAL_FLAG = 'hazard-tutorial-done';
export const HAZARD_TUTORIAL_SEED = 3;
export const HAZARD_TUTORIAL_ID = 'cracked-cliff';

export interface BeginHazardOptions {
    hazardId?: string;
    seed?: number;
    /** Start the guided first crossing (pinned seed + hazard unless overridden). */
    tutorial?: boolean;
}

export function completeHazardTutorialAction(store: AppStore, skipped: boolean): void;
```

`beginHazardAction` gains the `tutorial` option: when true, resolves the
seed via `resolveMinigameSeed('hazard', options.seed,
globalThis.__AXM_HAZARD_SEED__, HAZARD_TUTORIAL_SEED)` and the hazard id
via `resolveMinigameString('hazard', ['hazardId', 'id'], options.hazardId,
globalThis.__AXM_HAZARD_ID__, HAZARD_TUTORIAL_ID)` (mirrors gathering's
precedence chain exactly), and sets `hazard: { session, tutorial: true }`.
A normal (organic, non-tutorial) call keeps `tutorial: false`.

```ts
// state/store.ts
export interface MobileHazardSlice {
    session: HazardSessionState | null;
    /** True while this session is the guided first crossing. */
    tutorial: boolean;
}
export const EMPTY_HAZARD_SLICE: MobileHazardSlice = Object.freeze({
    session: null,
    tutorial: false,
});
```

`AppActions` gains `completeHazardTutorial: (skipped: boolean) => void`,
wired the same way as `completeRestTutorial` / `completeGatheringTutorial`.

## 6. Hero / body / sub-section composition

Coach banner (mirrors rest/gathering exactly): eyebrow `THE FIRST CROSSING
· N / TOTAL`, title, body copy, `lookFor` hint line, `SKIP ✕` in the header
row. Bottom-docked at `bottom: 24` (Hazard's board has its own fixed
bottom tray/PLAY row like Gathering's — verify against `HazardBoard.tsx`'s
current layout and dock above it if it collides at 375px; same convention
as gathering's `bottom: 80` vs rest's `bottom: 24` call).

The coach only renders while `vm.phase === 'route-select'` or `vm.phase ===
'playing'` — every other phase (`rolling`, `resolve-flash`,
`foretell-pending`, `outcome`, `rewards`) is already a full-screen opaque
overlay (`zIndex >= 55`) with its own single-CTA "continue" affordance, so
there is nothing useful for the coach to add and no safe z-index slot to
add it in. This is a deliberate divergence from gathering/rest, which have
no full-screen phase overlays besides their own intro modal.

Six steps (predicates written against `s.route` / `s.play` / `s.dice` /
`s.round` only — never against which exact route/card/die the player
picks — so a player who runs ahead or picks RISK still completes the
script, per Rest's "recommended, not forced" doctrine):

1. `route` — "no retreat" — recommend LEDGE CRAWL (the safe route: one
   combined meter, easiest to read for a first crossing).
   `done: (s) => s.route !== null`.
2. `stage` — "commit a card to the play area" — drag a card from hand into
   the play area; its free (top) values apply the instant it lands.
   `done: (s) => s.play.length >= 1 || s.round > 1`.
3. `power` — "spend a die" — drag a die matching the card's colour (or the
   wild gold die) onto a staged card for its bigger MANA values.
   `done: (s) => s.dice.some((d) => d.state === 'spent') || s.round > 1`.
4. `apply` — "lock it in" — tap APPLY: commits the card's numbers to the
   meters and fires any utility (irreversible — no more re-powering or
   discarding that card).
   `done: (s) => s.play.some((e) => e.applied) || s.round > 1`.
5. `resolve` — "commit the round" — every staged card must be applied
   before PLAY unlocks; tapping it resolves the round against the route's
   threshold, win or lose.
   `done: (s) => s.round > 1 || s.phase === 'resolve-flash' || s.phase === 'outcome' || s.phase === 'rewards' || s.phase === 'done'`.
6. `outcome` — "read the ledger" — the crossing's tier, rewards, and any
   consequences; claim to leave.
   `done: (s) => s.phase === 'rewards' || s.phase === 'done'` (claiming
   nulls the session in the same store update as the engine's internal
   `'done'` phase, so a predicate gated on `'done'` alone would never be
   observed live — same OR-across-terminal-phases shape as gathering's
   `withdraw` step, for the same reason).

## 7. Empty / loading / error states

Coach renders `null` when `currentTutorialStep(...) === -1` (script done),
`hazard.tutorial !== true`, or the phase guard in §6 excludes the current
phase. No loading/error states — the coach is a pure derived overlay, same
as rest/gathering's.

## 8. Decisions made upfront — DO NOT ASK

- **Route is recommended, not forced.** Copy nudges LEDGE CRAWL (safe) but
  every predicate is written against `s.route !== null` / round / phase,
  not the specific key — a player who picks THE LEAP (risk) still
  completes the script.
- **Seed 3, hazard `cracked-cliff`.** Probed directly against
  `createHazardSession` (see §2) — zero-hex dice roll, every hand card has
  a matching die colour, reused as-is, no engine changes.
- **No forced win.** Unlike a card-matching puzzle, Hazard's five taught
  moves do not guarantee round 1 clears — the coach teaches the mechanic,
  not a curated victory. This matches Rest's precedent (`stir` step: "the
  outcome already decided, no choice to make") over trying to script a
  perfect run, which would be brittle against any future card-balance
  pass on `ironwill`/`footing`/`refrain`/`spite`.
- **FORETELL is out of scope** (see §0) — pushed to a follow-up note, not
  a numbered phase (it is a single card's sub-flow, not a fourth
  minigame).
- **Coach is phase-gated** (`route-select` / `playing` only) — see §6.
  This is the one structural divergence from the rest/gathering coach,
  which render unconditionally and rely solely on the step script; Hazard
  additionally guards against its own full-screen phase overlays.
- **Skip marks the flag but does not abandon the session** — mirrors
  rest/gathering exactly: SKIP ends the *coaching*, not the crossing.
- **`DebugHazardButton` gains a TUTORIAL button** (existing GO/BRAVE IT
  button untouched), matching `DebugGatheringButton`'s two-button row.

## 9. Mobile reflow / responsive

No new layout risk — the coach is an absolutely-positioned overlay atop
the existing `HazardBoard`/`RouteSelect` screen; verified at 375px via the
existing hazard e2e coverage pattern (`state/e2e/hazard.screen.test.tsx`)
— no dedicated `hazard.mobile.spec` exists today, consistent with
rest/gathering not having one either.

## 10. Pages × tests matrix

| Surface | Test |
|---|---|
| `components/hazard/tutorial-steps.ts` | `components/hazard/__tests__/tutorial-steps.test.ts` — predicate unit tests, template: gathering's `tutorial-steps.test.ts` |
| `components/hazard/HazardTutorialCoach.tsx` | `components/hazard/__tests__/HazardTutorialCoach.test.tsx` — render test, template: gathering's `TutorialCoach.test.tsx` |
| Store wiring (flag, slice, trigger) | `state/e2e/hazard.tutorial.engine.test.ts` — hermetic store-level e2e, template: `state/e2e/gathering.tutorial.engine.test.ts` |

## 11. Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mechanics untouched — no mechanics/card-editor verify needed (no
`@mechanics` public-surface change).

## 12. Commit body template

```
feat(mobile): guided first-crossing hazard tutorial — phase 15

- <bullets>

Decisions:
- <picked X over Y because ...>

Closes #<phase-issue-number>
```

## 13. DoD

- [ ] `HAZARD_TUTORIAL_FLAG` / `HAZARD_TUTORIAL_SEED` / `HAZARD_TUTORIAL_ID`
      / `tutorial` slice field / `completeHazardTutorialAction` shipped in
      `state/hazard/store-actions.ts` + `state/store.ts`.
- [ ] `components/hazard/tutorial-steps.ts` +
      `components/hazard/HazardTutorialCoach.tsx` shipped, wired into
      `app/hazard/index.tsx` (phase-gated per §6).
- [ ] Organic map-trigger in `state/actions.ts` starts the tutorial for a
      flag-less save.
- [ ] `components/DebugHazardButton.tsx` gains the TUTORIAL button.
- [ ] All three test files in §10 pass.
- [ ] `npm run verify --workspace axiomancer-mobile` green.

## 14. Follow-ups (out of scope)

Append as new build-plan rows once Phase 15 ships (do not renumber
existing rows) — these are already queued:

- **Phase 16 — Loot-Cache ("The Reliquary") first-delve tutorial.**
- **Phase 17 — Quest Board ("The Boy's Almanac") first-session tutorial.**

Net-new follow-up worth a future `/expand` candidate, not a numbered
phase on its own: a FORETELL-specific coach beat (either folded into a
later Hazard content pass, or a standalone "advanced hazard techniques"
tip surfaced after N crossings) — deferred here because the pinned
tutorial seed's opening hand contains no `foretell` card, and forcing one
in would mean overriding the natural starter-bag draw.
