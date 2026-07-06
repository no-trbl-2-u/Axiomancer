# Phase 2 — Projected-lethality readout API (engine depth)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Ship one new pure engine selector, `projectCombatOutcome(state)`, that
consolidates the status kill-path into a single legible readout: how much
DoT damage is already locked in, whether it alone kills the enemy and in
how many rounds, and which finisher-mechanic cards in the current hand
(rupture / amplify / execute) are ready to detonate right now. **Engine
only** — no mobile UI consumption this phase (that's a follow-up; see
Follow-ups).

## Design note — spec 30 vs current engine reality

`axiomancer-mechanics/specs/30-projected-lethality-readout.md` is a draft
handoff spec written against a stale premise: it cites a "Phase 125
`analyzeDotErosion` / `pendingDotDamage`" that doesn't exist in the current
engine, and frames the win condition around the two-Pressure-Track model
that was removed 2026-06-22 (`bearings.md` — HP is the sole win condition
now). The spec's open questions (§4) are answered here per the
recommended defaults, **reinterpreted against the current HP-sole-win
engine**:

- Q1 (headline readout): pending DoT total + "lethal in N rounds" — shipped
  as `pendingDot` + `roundsToKill` below.
- Q2 (Finish affordance): **out of scope this phase.** A `finishCombat`
  fast-forward + mobile FINISH button is UI/mobile work; this phase ships
  the engine readout it would key off, nothing more.
- Q3 (projection vs track): moot — there is no `dot` pressure track anymore
  to sit beside; the readout is a standalone selector.
- Q4 (engine state or presentation): **engine selector**, confirmed — the
  recommended approach, and consistent with every existing `project*`
  selector in `combat.engine.ts` (`projectRupture`, `projectExecute`,
  `projectSiphonHeal`).
- Q5 (Control-track foresight): out of scope (no Control pressure track
  exists any more either).
- Q6 (Catalyst / Spec 26): moot — Spec 26 hasn't shipped (no `Catalyst`
  code in the engine). Not addressed.

The build-plan row's own naming (`projectCombatOutcome`, "amplify/execute
ready") supersedes the spec doc's proposed `projectLethality` name and
scope — that's what this brief follows.

## Current state (verified in code)

- `getPendingDotTotal(bearer, currentRound?)`
  (`src/Combat/effects.ts:223`) already computes the lump-sum pending DoT
  damage over each active effect's remaining duration (ramp- and
  combo-amplification-aware). No per-round breakdown exists yet — that's
  the new piece.
- Enemy HP: `state.enemy.health` / `state.enemy.maxHealth`;
  `isDefeated()` in `src/Combat/health.ts:25`.
- Existing per-card finisher selectors to reuse, not duplicate:
  `projectRupture(state)` (combat.engine.ts:2009), `isExecuteReady` /
  `projectExecute(state, card)` (combat.engine.ts:2022-2041). No
  `projectAmplify` exists yet — the amplify burst is currently only
  computed inline during card resolution (combat.engine.ts:985-998); this
  phase extracts that formula into a `projectAmplify(state, card)` selector
  mirroring `projectRupture`'s shape, reusing `READ_DAMAGE_MULT`,
  `getDamageTakenMultiplier`, `AMPLIFY_BURST_CAP` (already-exported
  constants/helpers — no new balance numbers).
- `handCards(state)` (combat.engine.ts:1900) returns
  `Array<{ uid, card: CombatCard }>` — iterate this for the finisher scan.
- Export pattern: `project*` pure selectors, `CombatEncounterState` as sole
  or first arg, re-exported from `src/Combat/index.ts` then `src/index.ts`.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.engine.ts
  + projectAmplify(state, card)              — new, mirrors projectRupture
  + computeRoundsToKill(bearer, currentRound?) — new, internal helper
  + projectCombatOutcome(state)               — new, the phase's deliverable
axiomancer-mechanics/src/Combat/index.ts      — re-export the two new public fns
axiomancer-mechanics/src/index.ts             — re-export at the top barrel
axiomancer-mechanics/src/Combat/e2e/projected-lethality.engine.test.ts  — new
```

## Output schema (locked)

```ts
export interface FinisherProjection {
    uid: string;
    cardId: string;
    mechanic: 'rupture' | 'amplify' | 'execute';
    ready: boolean;
    amount: number; // projected damage if detonated now
}

export interface CombatOutcomeProjection {
    pendingDot: number;           // getPendingDotTotal(state.enemy, state.round).total
    roundsToKill: number | null;  // 1-indexed rounds until cumulative DoT ticks >= enemy.health; null if the DoT alone won't finish it over its remaining duration
    isLethalInFlight: boolean;    // roundsToKill !== null
    finishers: FinisherProjection[]; // one entry per hand card carrying rupture/amplify/execute, in hand order
}

export function projectCombatOutcome(state: CombatEncounterState): CombatOutcomeProjection;
```

`computeRoundsToKill` implementation: reuse the exported ramp primitives
`rampedDamagePerRound` and `getDotAmplificationByEffect`
(`src/Combat/effect-modifiers.ts`) to walk round-by-round (same per-tick
formula `floor(dpr × intensity × comboMultiplier)` as
`getPendingDotTotal`), capping each effect's own tick count at
`Math.max(1, remainingDuration)` (matching `getPendingDotTotal`'s
documented "permanent DoT counts one tick" convention, so `pendingDot` and
`roundsToKill` stay consistent with each other). Stop at the first round
whose running cumulative total reaches `bearer.health`; return that
1-indexed round count, or `null` if the loop exhausts every effect's ticks
without reaching it.

No new `CombatEvent` kind — `projectCombatOutcome` is a pure, on-demand
selector like its siblings, not part of round resolution. No mobile
consumption this phase, so no HUD/ghost/ FINISH-button work.

## Tests

### Unit / e2e (mechanics)
- `roundsToKill` is `null` when no DoT is active on the enemy.
- A single stacked DoT that will not reach enemy HP over its remaining
  duration -> `roundsToKill: null`, `isLethalInFlight: false`,
  `pendingDot` matches `getPendingDotTotal(...).total`.
- A stacked DoT engineered to cross enemy HP mid-duration ->
  `roundsToKill` equals the expected round count (hand-computed against
  the fixture), `isLethalInFlight: true`.
- Two combo'd DoTs (poison + bleed, amplification-aware) -> `pendingDot`
  and `roundsToKill` both reflect the combo multiplier (reuse the
  `status-depth-combat.engine.test.ts` `ae()` / `makeEnemy()` fixture
  helpers).
- A hand containing a rupture card, an amplify card, and an execute card
  (with the enemy in each one's ready state) -> `finishers` has three
  entries, each `ready: true` with a non-zero `amount` matching the
  existing `projectRupture` / `projectAmplify` / `projectExecute` outputs
  for the same state.
- A hand with no finisher-mechanic cards -> `finishers: []`.

Reuse `src/test-utils/rng.ts` fixed-seed helpers if any test needs to draft
a hand; prefer the lighter `initializeCombatEncounter(...)` +
direct-`enemy.effects` override pattern (status-depth-combat.engine.test.ts
lines ~158-165) where card drafting isn't needed.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. This phase adds to
the `@mechanics` public export barrel (`src/index.ts`) — additive only, so
no mobile/card-editor migration needed, but run a quick sanity check:

```bash
npm run type-check --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

(Additive exports can't break either consumer; this just confirms no
accidental barrel breakage.)

## Deploy gate

```bash
npm run deploy:check
```

CI-green. Touches `axiomancer-mechanics/**` only -> `verify-mechanics.yml`
(+ path-filtered mobile/card-editor gates) will run.

## Decisions made upfront — DO NOT ASK

- **`projectCombatOutcome` supersedes spec 30's `projectLethality` name**
  — the build-plan row's own naming wins (see Design note above).
- **Engine-only this phase.** No mobile HUD, no ghost overlay, no FINISH
  button, no new `CombatEvent`. Spec 30 §4 Q2 lives in a follow-up phase.
- **"Permanent DoT counts one tick"** convention inherited unchanged from
  `getPendingDotTotal` — `roundsToKill` must stay consistent with
  `pendingDot`, not introduce a second, diverging notion of "pending."
- **`finishers` covers rupture + amplify + execute**, not just
  "amplify/execute" as literally listed in the build-plan row — rupture is
  the same detonate-the-pending-stack family and already has a selector
  (`projectRupture`); omitting it from a "kill-path legibility" readout
  would be an arbitrary gap.
- **No new balance constants.** `projectAmplify` reuses
  `AMPLIFY_BURST_CAP`, `READ_DAMAGE_MULT`, `getDamageTakenMultiplier` —
  the exact formula already live at combat.engine.ts:985-998.

## Git

```bash
git add axiomancer-mechanics/src/Combat/combat.engine.ts \
        axiomancer-mechanics/src/Combat/index.ts \
        axiomancer-mechanics/src/index.ts \
        axiomancer-mechanics/src/Combat/e2e/projected-lethality.engine.test.ts
git commit -m "$(cat <<'EOF'
feat(mechanics): projected-lethality readout API — phase 2

- add projectCombatOutcome(state): pendingDot + roundsToKill +
  isLethalInFlight + hand finisher (rupture/amplify/execute) readiness
- extract projectAmplify(state, card), mirroring projectRupture, from the
  inline amplify-detonate formula in playBottomAction
- re-export both new selectors from the Combat and top-level barrels

Decisions:
- projectCombatOutcome (build-plan naming) supersedes spec 30's draft
  projectLethality name/scope; spec 30's Finish-button /
  ghost-overlay / Control-foresight questions are mobile follow-up work,
  out of scope here (engine readout only)
- roundsToKill reuses getPendingDotTotal's "permanent DoT = one tick"
  convention so the two figures never diverge
- finishers bundles rupture + amplify + execute (not just amplify/execute)
  since rupture is the same detonate-the-pending-stack family
EOF
)"
git push origin main
```

## DoD

Flip Phase 2 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 2 shipped — projected-lethality readout API"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Mobile consumption: HUD pending-DoT ghost on the enemy HP bar, "lethal
  in N" label, FINISH affordance (spec 30 §4 Q2) — a mobile phase once
  this API exists.
- A `lethality-updated` `CombatEvent` / live-tick wiring, only needed once
  mobile actually renders this readout reactively.
- Control-track foresight (spec 30 §4 Q5) and Catalyst interaction (§4
  Q6) — both moot until their prerequisite systems exist.
