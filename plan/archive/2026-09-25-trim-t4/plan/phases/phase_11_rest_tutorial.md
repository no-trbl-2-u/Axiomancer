# Phase 11 — Guided first-run tutorial for the Rest encounter ("The Night Watch")

> Build-plan row: `Phase 11 — Tutorial / onboarding flow (GAMEPLAY_GAPS
> GAP-001: no guided intro) (mobile)`.

## 0. Scope call (read this first)

GAP-001 ("no guided intro") is dated 2026-06-13 (`playtest-report-122.md`).
Since then the game shipped **three** guided-intro surfaces already:
`TitleScreen` + `BundleSelectScreen` (meta onboarding, pre-loop era) and a
full first-fight combat tutorial (`CombatTutorialPrimer` +
`CombatTutorialCoach`, 2026-07-02) and a first-gleaning tutorial
(`components/gathering/TutorialCoach.tsx`). Auditing every encounter
surface (`components/{combat,gathering,hazard,rest,cache,quest}`) shows
**Hazard, Rest, Loot-Cache, and Quest Board have zero first-run guidance**
— a new player hits four un-narrated systems with no coach at all.

Shipping all four in one phase is not one self-contained slice — it's
four. This phase ships the smallest, cleanest one end-to-end (**Rest**,
by far the simplest state machine: posture → 3 watches → dawn) as the
proof, and queues the remaining three as follow-up phases (§ Follow-ups)
so `/march` picks them up next rather than the gap being silently
declared "done."

**Why Rest first:** its session has no staging/dice/route-selection
complexity (unlike Hazard), and unlike Gathering/Combat it currently has
*no* dev trigger at all — the smallest surface area to prove the pattern
holds for a fourth minigame.

## 1. Routes / API / CLI surface

No new routes. Reuses `/rest` (`app/rest/index.tsx`) unchanged in
structure; the coach renders as an overlay, same pattern as
`app/gathering/index.tsx`'s `<TutorialCoach>`.

## 2. Content / data reads

| Helper | Call | Use |
|---|---|---|
| `createRestSession` (`@mechanics`) | `createRestSession(REST_TUTORIAL_SEED, healFraction)` | Pinned first-night session |
| `REST_TUTORIAL_STEPS` (new) | `currentTutorialStep(session, vm)` | Coach script cursor |

No new mechanics-side content — Rest's authored postures/dreams/watch
bag are unchanged. Seed **41** is pinned (probed via
`createRestSession(41, 1.0)`): `watchPlan = ['embers', 'dream', 'stir']`,
`dreamQueue[1] = 'dream-gates'` ("A DREAM OF GATES") is the dream shown
on watch 2. This ordering teaches, in sequence: posture choice → the fire
(embers: feed/spare) → a dream (hold/fade) → a stir (posture pays off).

## 3. Components / handlers

New:
- `components/rest/tutorial-steps.ts` — `RestTutorialStep[]` +
  `currentTutorialStep(session, vm)`. Literal template:
  `components/gathering/tutorial-steps.ts`.
- `components/rest/TutorialCoach.tsx` — bottom-docked banner, literal
  template: `components/gathering/TutorialCoach.tsx` (same skip
  affordance, same positioning convention, reuse `REST_WATCH_GLYPHS`
  glyph for the header icon instead of `GraceMark`).
- `components/DebugRestButton.tsx` — dev trigger, template:
  `components/DebugGatheringButton.tsx` (GO REST + TUTORIAL variant).

Reused: `makeStyles`/`usePalette` (`@/theme/runtime`), `FONTS`
(`@/theme/axm`), `react-native-reanimated` `FadeInDown` (already a
dependency via gathering's coach).

## 4. Cross-links

- **In:** the organic map-triggered rest path
  (`state/actions.ts`, the `result.event.kind === 'rest'` branch) starts
  the tutorial automatically for a save without `REST_TUTORIAL_FLAG`,
  mirroring the gathering trigger exactly.
- **Out:** none (Rest is a dead-end minigame; claim returns to the map).
- **Retro-fit:** `components/dev/DevToolsSections.tsx` gains a lazy
  `DebugRestButton` entry next to `DebugGatheringButton`.

## 5. Output schema / contracts

```ts
// state/store.ts
export interface MobileRestSlice {
    session: RestSession | null;
    /** True while this session is the guided first night. */
    tutorial: boolean;
}
export const EMPTY_REST_SLICE: MobileRestSlice = Object.freeze({
    session: null,
    tutorial: false,
});

// state/rest/store-actions.ts
export const REST_TUTORIAL_FLAG = 'night-watch-tutorial-done';
export const REST_TUTORIAL_SEED = 41;

export interface BeginRestOptions {
    seed?: number;
    healFraction?: number;
    /** Start the guided first night (pinned seed unless overridden). */
    tutorial?: boolean;
}

export function completeRestTutorialAction(store: AppStore, skipped: boolean): void;
```

`beginRestAction` gains the `tutorial` option: when true, resolves the
seed via `resolveMinigameSeed('rest', options.seed, undefined,
REST_TUTORIAL_SEED)` (mirrors gathering's precedence chain) and sets
`rest: { session, tutorial: true }`. A normal (organic, non-tutorial)
call keeps `tutorial: false`.

`AppActions` gains `completeRestTutorial: (skipped: boolean) => void`,
wired the same way as `completeGatheringTutorial`.

## 6. Hero / body / sub-section composition

Coach banner (mirrors gathering exactly): eyebrow `THE FIRST NIGHT · N /
TOTAL`, title, body copy, `lookFor` hint line, `SKIP ✕` in the header
row. Bottom-docked (`bottom: 80`ish — Rest's screen has no fixed bottom
action bar like Gathering's DESCEND/WITHDRAW row, so anchor at `bottom:
24` instead, clear of the `BREAK CAMP` / `WALK ON WITHOUT RESTING`
buttons which sit further down the scroll).

Five steps (predicates written against `s.watch` / `s.phase` only —
never the watch *kind* — so a player who overrides the recommended
posture still completes the script; the pinned seed guarantees
`watchPlan = ['embers', 'dream', 'stir']` regardless of posture):

1. `posture` — "the oldest decision" — recommend KEEP WATCH (thinnest
   heal, but the pinned stir on watch 3 always resolves kindly under
   it). `done: (s) => s.phase !== 'posture'`.
2. `embers` (watch 1) — "feed or spare the wood" — `done: (s) => s.watch > 1`.
3. `dream` (watch 2) — "hold it or let it fade" — `done: (s) => s.watch > 2`.
4. `stir` (watch 3, passive — posture already decided the outcome, no
   choice to make) — `done: (s) => s.phase === 'outcome' || s.phase === 'done'`.
5. `dawn` — "confirm the ledger" — `done: (s) => s.phase === 'done'`.

## 7. Empty / loading / error states

Coach renders `null` when `currentTutorialStep(...) === -1` (script
done) or `rest.tutorial !== true`. No loading/error states — the coach
is a pure derived overlay, same as gathering's.

## 8. Decisions made upfront — DO NOT ASK

- **Posture is recommended, not forced.** The coach copy nudges KEEP
  WATCH but every predicate is written against watch-index /
  phase, not posture — a player who picks DEEP or DOZE still completes
  the script (the stir step's body text is generic enough to cover any
  outcome).
- **Seed 41, not a new one.** Probed directly against
  `createRestSession` (see §2) — reused as-is, no engine changes.
- **Skip marks the flag but does not abandon the session** — mirrors
  gathering exactly: SKIP ends the *coaching*, not the night.
- **No `healFraction` override for the tutorial.** The organic trigger
  in `state/actions.ts` already passes the map event's authored
  `healFraction`; the tutorial rides whatever the first rest node
  authors (same as every other rest). Only `seed` is pinned.
- **`DebugRestButton` ships in this phase** (net-new — Rest had no dev
  trigger at all before now), matching `DebugGatheringButton`'s
  GO / TUTORIAL two-button row.

## 9. Mobile reflow / responsive

No new layout risk — the coach is an absolutely-positioned overlay atop
the existing `ScreenBg`/`ScrollView` rest screen; verified at 375px via
the existing rest e2e coverage pattern (no dedicated `rest.mobile.spec`
exists today — not adding one is in-scope-consistent: neither does
gathering's tutorial).

## 10. Pages × tests matrix

| Surface | Test |
|---|---|
| `components/rest/tutorial-steps.ts` | `components/rest/__tests__/tutorial-steps.test.ts` — predicate unit tests, template: gathering's `tutorial-steps.test.ts` |
| `components/rest/TutorialCoach.tsx` | `components/rest/__tests__/TutorialCoach.test.tsx` — render test, template: gathering's `TutorialCoach.test.tsx` |
| Store wiring (flag, slice, trigger) | `state/e2e/rest.tutorial.engine.test.ts` — hermetic store-level e2e, template: `state/e2e/gathering.tutorial.engine.test.ts` |

## 11. Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mechanics untouched — no mechanics/card-editor verify needed (no
`@mechanics` public-surface change).

## 12. Commit body template

```
feat(mobile): guided first-night rest tutorial — phase 11

- <bullets>

Decisions:
- <picked X over Y because ...>

Closes #<phase-issue-number>
```

## 13. DoD

- [ ] `REST_TUTORIAL_FLAG` / `REST_TUTORIAL_SEED` / `tutorial` slice
      field / `completeRestTutorialAction` shipped in
      `state/rest/store-actions.ts` + `state/store.ts`.
- [ ] `components/rest/tutorial-steps.ts` +
      `components/rest/TutorialCoach.tsx` shipped, wired into
      `app/rest/index.tsx`.
- [ ] Organic map-trigger in `state/actions.ts` starts the tutorial for
      a flag-less save.
- [ ] `components/DebugRestButton.tsx` wired into `DevToolsSections.tsx`.
- [ ] All three test files in §10 pass.
- [ ] `npm run verify --workspace axiomancer-mobile` green.

## 14. Follow-ups (out of scope)

Append as new build-plan rows once Phase 11 ships (do not renumber
existing rows):

- **Phase 15 — Hazard first-crossing tutorial** (largest remaining gap:
  route selection, staging/powering cards, foretell — needs its own
  brief; the most complex of the four).
- **Phase 16 — Loot-Cache ("The Reliquary") first-delve tutorial.**
- **Phase 17 — Quest Board ("The Boy's Almanac") first-session
  tutorial.**

Also worth a future `/expand` candidate, separate from this mechanical
gap: the pending `plan/CRITIQUE.md` MED item ("rethink early-game as
canned preset-deck tutorial, defer deckbuilding to labyrinth choice") —
a design-level rethink of the whole early game, not a per-minigame coach.
Do not conflate the two; that item is a design decision for `/oversight`
or `/expand`, not a mechanical retrofit like this phase.
