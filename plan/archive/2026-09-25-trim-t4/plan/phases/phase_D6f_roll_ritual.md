# Phase D6f — The Roll Ritual (dice roll animation)

> Renumbered from D6e at the 2026-07-18 merge: the same-day /oversight
> session on main filed Phase D6e (enemy stanceCheck telegraphs — the
> D3-F2 yield-lever drain). Both phases stand; this one took the next
> letter.

> Agent-facing brief. Give the four-die roll a physical moment: a 2.5D
> tumble that settles on the engine-rolled faces. Presentation only — the
> engine's RNG is the sole authority on outcomes (dice-honesty law,
> 2026-07-09); the animation is choreographed to land on the
> already-rolled result, never the other way around. Prior-art support:
> the braindump's own citations (Slice & Dice, Quacks) say miss-heavy
> faces are tolerated when a roll/reroll RITUAL exists — at ~8.3% whiff
> this is load-bearing feel work, not polish. Deps: D6a.

## Inputs

1. Spec 33 §1 (face semantics — mana / special / miss, miss visually
   dead) + §4 (Press Fate = the second roll moment).
2. D6a's `CombatDieVM` face axis + runtime flag hook — this phase
   animates the states D6a renders; it adds no new VM truth.
3. Owner decisions (2026-07-18, this session — DO NOT reopen):
   choreographed-to-result; 2.5D is fine; **no new dependencies**.
4. Existing animation stack: Reanimated 4 + react-native-gesture-handler
   + react-native-svg + expo-haptics — all already in
   `axiomancer-mobile/package.json`.

## Scope

- **Round-start roll**: the 4 fixed dice tumble (stagger the four so the
  eye can track), cycle faces via rotate/flip transforms, and settle
  with a spring on the engine-rolled face. Misses settle visually dead
  (the D6a dead-state, arrived at loudly). Haptic tick per die settle
  (expo-haptics — existing dep).
- **Press Fate re-tumble**: the 1◆ reroll replays the ritual on the
  rerolled miss dice only; cracked (OVERHEAT) dice visibly sit it out.
- **Skip + accessibility**: tap-to-skip mid-tumble (jump straight to
  settled faces); OS reduced-motion preference honored (instant settle);
  an instant-settle mode under the D6a flag hook so seeded e2e never
  wait on animation.
- **Flag-aware**: flag-off remains byte-identical (the old combat render
  is untouched).

## Decisions made upfront — DO NOT ASK

- Engine rolls first; animation lands on the result. No physics deciding
  outcomes, no nondeterminism in what a die shows when settled.
- 2.5D via Reanimated worklets + SVG faces. **Zero new npm
  dependencies.** `@shopify/react-native-skia` was evaluated
  (2026-07-18): it is RN-coupled, not Expo-coupled, so it would survive
  the planned Expo decouple — but it adds a large native binary +
  a CanvasKit-WASM web-loading step that would need wiring twice across
  the CI/CD migration. It is the POST-DECOUPLE upgrade path if the
  Reanimated tumble isn't juicy enough, not this phase.
- Animation timing/easing constants live in one presenter-adjacent
  module (tunable without touching choreography logic).

## Surface as `[needs-user-call]`

- Only feel-rank questions a human eye must judge (e.g. total ritual
  duration if it fights the combat pace) — screenshot/video options,
  ask.

## Prove (DoD)

- Presenter/unit tests for the roll-state machine (idle → tumbling →
  settled; skip; reduced-motion; instant-settle) — the choreography's
  data layer is hermetic even though the visuals aren't.
- Settled faces ALWAYS equal the engine roll — asserted in tests.
- Existing seeded e2e (D6d's, if landed) stay green via instant-settle;
  `npm run verify -w axiomancer-mobile` green; flag-off untouched.
- Flip D6f `[x]` + Phase log + hash.

## Follow-ups

- Land before D7: the qualitative playtest question "does whiff feel
  survivable" must be answered WITH the ritual in place.
- Expo-decouple inventory note: this phase's expo-haptics use is an
  EXISTING touchpoint (swaps to react-native-haptic-feedback or similar
  at decouple) — no new expo-* surface added.
- Post-decouple: re-evaluate Skia upgrade on the kept pipeline.
