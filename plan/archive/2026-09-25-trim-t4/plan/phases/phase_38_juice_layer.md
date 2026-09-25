# Phase 38 — Central juice/animation layer (combat-first)

> Agent-facing brief. Give mobile ONE shared feel system instead of ~33
> components each rolling their own Reanimated logic. A `lib/juice/`
> module owning the recurring primitives — screen shake, impact flash,
> status-proc pulse, number pops, standard enter/exit transitions —
> reduced-motion gated, haptics co-triggered, adopted by the combat
> encounter surfaces in the same phase. Promoted by owner direction
> 2026-07-20 (missing-layers survey session). Deps: none hard (D6f's
> roll ritual is a sibling, not a dependency — it stays its own
> choreography and is NOT rewritten here).

## Inputs

1. The 2026-07-20 layer survey finding: Reanimated
   `withTiming`/`withSpring`/`useSharedValue` usage is spread across
   ~33 component files (dice rolls, boards, tutorial coaches, toasts,
   `RollingDie.tsx`, `MapCanvas.tsx`) with no shared shake/particle/
   transition manager.
2. Existing stack (all in-tree, ZERO new dependencies): Reanimated 4 +
   react-native-worklets + react-native-svg + expo-haptics (~20 call
   sites today).
3. `hooks/useReducedMotion.ts` — the phase-10 gate every juice
   primitive must honor.
6. **Owner jot (`/jot` 2026-07-20, folded in via /oversight):** used
   dice have no spent-state visual indicator — a die that's been played
   should read as spent (grey out / desaturate). This is a legibility
   primitive, in-scope for the combat-first adoption below.
4. D6f precedent (`phase_D6f_roll_ritual.md`): timing/easing constants
   isolated in one tunable module; instant-settle escape hatch for
   seeded e2e; presentation never decides outcomes.
5. Expo-decouple candidate (PHASE_CANDIDATES): build on bare
   reanimated/worklets APIs, which carry over. expo-haptics is an
   EXISTING touchpoint — route it through one wrapper so the decouple
   swaps a single file.

## Scope

- **The module** (`axiomancer-mobile/lib/juice/` or sibling): small,
  composable primitives with clear names —
  - screen/container shake (intensity-tiered),
  - impact flash / hit-flash overlay,
  - status-proc pulse (the doctrine moment — a status landing should
    FEEL like the main event),
  - number pop (damage/heal/currency deltas),
  - standard enter/exit transitions (card/modal/chip),
  - spent-state die treatment (a played/used die greys out /
    desaturates so it reads as spent — owner jot 2026-07-20; a
    static state change, reduced-motion is a no-op here, not a
    subdued animation),
  - a haptics wrapper co-firing with the visual where the existing
    expo-haptics call sites overlap.
- **Discipline built in**: every primitive checks `useReducedMotion`
  (reduce → instant or subdued per primitive, decided in the module,
  not at call sites); timing/easing constants in one
  `juice.timing.ts`-style module; an instant/disable escape hatch
  (global, D6a-hook style) so seeded e2e never wait on animation.
- **Combat-first adoption**: the combat encounter surfaces migrate in
  this phase — status application, VITAE damage ticks, stance-check
  resolution feedback, card play/refusal, and used-die spent-state
  greying (owner jot). Enough real call sites to prove the API earns
  its keep.
- **Incremental migration doctrine** (write it into the module's
  header): new work uses the system; the other ~25 files migrate
  opportunistically in later ticks — this phase does NOT big-bang
  rewrite them, and does NOT touch D6f's roll-ritual state machine.

## Decisions made upfront — DO NOT ASK

- Zero new npm dependencies (Skia remains the post-Expo-decouple
  upgrade path per the D6f evaluation — not now).
- Presentation only: no juice primitive reads or writes engine state;
  triggers are fed by presenter/VM events that already exist.
- Reduced-motion behavior is decided per-primitive inside the module —
  call sites never branch on it themselves.
- Copy/visual canon holds: AXM tokens only, no hex literals in
  components.

## Surface as `[needs-user-call]`

- Feel-rank questions only a human eye can judge (shake intensity,
  pop duration) — isolate the knob, ship the defensible default, note
  the knob location; the owner judges in-app and verdicts land via
  `/jot` (D6f precedent).

## Prove (DoD)

- Hermetic unit tests for each primitive's data layer (trigger →
  timeline state; reduced-motion → instant/subdued path; escape hatch
  → no-op) — the choreography's data layer is hermetic even though
  visuals aren't.
- Combat adoption witnessed: at least the status-proc, damage-tick,
  and card-refusal sites fire through the module (presenter tests).
- Existing seeded e2e (`scripts/*-e2e.mjs`, D6d) stay green via the
  escape hatch; `npm run verify -w axiomancer-mobile` green.
- Flip Phase 38 `[x]` + Phase log + hash.

## Follow-ups

- Opportunistic migration of the remaining Reanimated call sites
  (tutorial coaches, toasts, boards) — later ticks, not this phase.
- Expo-decouple inventory: the haptics wrapper is the single swap
  point when expo-haptics goes.
- If the primitives prove out, the minigame encounter screens
  (hazard/gathering/rest/cache/quest) are the natural second adoption
  wave.
