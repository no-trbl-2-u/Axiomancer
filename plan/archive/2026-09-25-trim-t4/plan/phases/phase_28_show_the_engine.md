# Phase 28 — Show the Engine (legibility sweep)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Nine legibility items from the build-plan row, sourced from
`plan/tuning/2026-07-10-turn-texture.md` §4 and
`plan/tuning/2026-07-10-theme-identity.md` (S-tier UX items, §"Sequencing
inside Gate 2" #1). The doctrine: **surface engine values that already exist
but never reach a UI, plus fix the two lying-copy defects found in current
code.** Where an item ("REPRISE songbook choice") calls for real player
agency rather than passive display, the design doc rates it S-tier and
explicitly wants it; ship it, kept minimal.

Research grounding (`Agent(Explore)` pass, 2026-07-11, code-verified against
current `main`, not the stale 2026-07-10 audit evidence):

1. **Rupture fuel/cap preview** — `projectRupture(state)`
   (`combat.engine.ts:3130`) is exported, unused in mobile. It uses
   `bonusPct 0` — undershoots `resonance-detonation` / `the-overtake` /
   the heart card at ~542 (all carry a card-specific `bonusPct`), and
   `the-overtake` also carries `fuelPerPip` (unaccounted for).
2. **Premise track + CONCEDE beat** — `state.premises` / `state.peroration`
   exist (`combat.encounter.types.ts:539`); `gainPremises`
   (`combat.engine.ts:808`) emits `premise-gained` / `peroration-fired`
   events. Zero mobile consumption — no VM field, no component.
3. **BACKFIRE drip attribution** — `{ kind: 'backfired', amount, rungs }`
   is a distinct event (`combat.engine.ts:2322`), but the HP delta folds
   into the generic `directDamage` accumulator and `CombatCombatantPane`'s
   fx loop has no case for it — the damage is currently **invisible**, not
   merely unlabeled (worse than the audit assumed).
4. **Foretell picker** — `applyForetell` (`combat.engine.ts:854`) already
   reveals the next stance (rendered today via `revealedStance`) and reorders
   the draw pile, emitting `{ kind: 'foretold', count, topCardId }`. Only the
   deck-reorder half is unsurfaced — `topCardId` is already on the event, no
   engine change needed for a minimal reveal.
5. **REPRISE songbook choice** — confirmed pure argmax-by-rank over
   `state.discard` inline in `playBottomAction`'s `reprise` case
   (`combat.engine.ts:1659`). No parameter exists to carry a player choice.
6. **Overtake gate/preview** — `the-overtake` (`cards.library.ts:427`) pairs
   `spend_all_pips` with `rupture(fuelPerPip: 3.5, bonusPct: 0.5)` and **no
   minimum-pip gate exists anywhere** — a single pip triggers the full
   bonus, matching the audit's "fires for 18 on turn 1" complaint.
7. **getDisruptMeter lying copy** — `willDeny` (`combat.engine.ts:3114`)
   omits the STAGGER-rung deny path (`rungDenied`, computed separately at
   `combat.engine.ts:2260` inside `resolveThreatPhase`). A turn denied purely
   by accumulated STAGGER reports `willDeny: false`. Not consumed by mobile
   today either way.
8. **tu-quoque color-match fold-in** — `philosophicalAspect: 'heart'` but
   `dieBonus: { onColor: 'body' }` (`cards.library.ts:1246`) — dead text on
   a heart card.
9. **Wall-math readout** — `IntentIcon` renders the enemy's telegraphed
   `damage` as a **raw** face-value number (`intentVM` sums
   `phase.threatAction.effects` directly), never run through the live
   `weakenMult`/`rungMult` modifiers `resolveThreatPhase` applies, and never
   netted against the player's current Guard/Barrier.

Re: `the-closing-word`'s "three code-verified defects" (fire-on-declare /
scale-with-overshoot / lying copy) cited in the 2026-07-10 audit — re-read
against current code (`cards.library.ts:279`, `gainPremises`
`combat.engine.ts:808`): the at/concedeAt/rider math is internally
consistent today (fires the rider at 6, CONCEDE at `max(8, tier floor)`,
resets the tally either way). Treated as **already fixed** by an earlier
session; not touched here. The real remaining "lying copy" defect in the
control theme is item 7 above.

## Design decisions — DO NOT ASK

- **Rupture-kind card faces get a real number, not a word.** The
  `CombatCardKind` doc comment for `'rupture'` says "live total → a word, no
  fabricated number" — that was true before `projectRupture` existed as an
  honest selector. It's honest now; ship the number (spec 32's
  real-units-or-no-number rule is about fabrication, not about *having* a
  number).
- **New selector `projectRuptureBurst(state, card)`, not a `projectRupture`
  signature change.** Mirrors the existing `projectSiphonHeal(state, card)`
  convention exactly (`combat.engine.ts:3142`) — looks up the card's own
  `rupture` mechanic, adds `bonusPct` and `fuelPerPip × availablePips`.
  `availablePips` for a **preview** (nothing has been spent yet) =
  `reserve` pips + `floatingDice` pips (the "if you cashed in everything
  banked right now" reading) — approximates `spend_all_pips`'s real spend
  without needing a hypothetical powering die. Falls back to
  `projectRupture(state)` for cards with no card-specific mechanic found
  (defensive, keeps the function total).
- **Overtake's 2-pip gate is scoped to `fuelPerPip`-carrying rupture
  mechanics only** — `the-overtake` is currently the only card using
  `fuelPerPip`, so this can't regress `resonance-detonation` /
  `peroratio-interrupta` / `prophecy-fulfilled`'s plain `rupture` mechanic.
  Below 2 total pips spent, the rupture step no-ops entirely (mirrors the
  existing `effect-fizzled` convention used for empty-discard REPRISE and
  no-Premises spend) rather than firing a diminished burst — "gate," not
  "taper."
- **REPRISE choice: additive, optional, defaults to today's behavior.**
  `playCombatCard(state, cardRef, useBottom, dieId, rng, reprisalCardId?)`
  → threaded to `playBottomAction`. When provided and present in
  `state.discard`, that exact card is returned instead of the argmax pick;
  omitted or invalid (already-consumed, not in discard) falls back to the
  existing highest-rank auto-pick — mobile that hasn't shipped the picker
  yet (card-editor, CLI scripts, existing tests) keeps working unchanged.
  Mobile always supplies a choice when the discard pile is non-empty and the
  staged card carries a `reprise` mechanic (see mobile section) — the
  auto-pick fallback exists for API safety, not as a deliberate mobile path.
- **Wall-math readout ships as a new pure selector
  `projectIncomingThreat(state)`**, not a mutation of `intentVM`'s existing
  raw-damage field (mobile still needs the raw stake for the badge's
  existing a11y contract). Returns
  `{ rawDamage, projectedDamage, willDeny, guard, barrier, netDamage }`,
  reusing the exact `weakenMult`/`rungMult` formula already inlined in
  `resolveThreatPhase` (extracted, not duplicated — see Outputs).
- **`getDisruptMeter` and `resolveThreatPhase` share one rung-denial
  helper.** Extract `computeRungDenial(state)` →
  `{ rungsTotal, rungsLost, rungDenied }` from the inline block at
  `combat.engine.ts:2244-2260`; both call sites use it. Fixes the lying
  copy at the source instead of patching the symptom in two places that can
  drift again.
- **tu-quoque: `onColor: 'body'` → `onColor: 'heart'`.** Balance-neutral
  (both colors carry the same die-bonus weight in the point formula per the
  card's own pricing comment) — a straight bug fix, not a re-price.
- **Foretell reveal is a topCardId toast, not a full candidate-list UI.**
  The engine only ever *stored* the winner (`top`/`rankOf` are function-local
  and discarded) — surfacing "what else was considered" would need an event
  schema change for a feature the design doc doesn't ask for (`OMEN v2`'s
  player-chooses-the-window rework is a separate, out-of-scope oracle item).
  `topCardId` is already on the `foretold` event; render it.
- **Premise track UI lives in the existing status-strip pattern**, not a new
  floating HUD layer — `CombatBoard`'s `statusStrip` (guard chip + effect
  chips, `CombatBoard.tsx:813`) already renders conditionally below the
  momentum wheel; the Premise track joins it as a labeled bar, shown only
  while `vm.peroration?.active`.
- **CONCEDE beat reuses `CombatSummaryModal`**, checked for existing
  win/loss copy branching; add a `concede`-specific outcome line if the
  modal doesn't already special-case `finalOutcome === 'concede'`.

## Outputs

```
axiomancer-mechanics/src/Combat/combat.engine.ts
  + projectRuptureBurst(state, card)        — new, per-card rupture preview
  + projectIncomingThreat(state)            — new, wall-math selector
  + computeRungDenial(state)                — new, extracted + shared
  ~ getDisruptMeter(state)                  — willDeny includes rungDenied
  ~ resolveThreatPhase(...)                 — uses computeRungDenial (no behavior change)
  ~ playCombatCard(..., reprisalCardId?)    — new optional 6th param
  ~ playBottomAction(..., reprisalCardId?)  — reprise case honors the choice
  ~ 'rupture' case in playBottomAction      — 2-pip gate when mech.fuelPerPip set
axiomancer-mechanics/src/Combat/index.ts    — re-export the 2 new selectors
axiomancer-mechanics/src/index.ts           — re-export at the top barrel
axiomancer-mechanics/src/Cards/cards.library.ts
  ~ tu-quoque.dieBonus.onColor: 'body' -> 'heart'
axiomancer-mechanics/src/Combat/e2e/legibility-sweep.engine.test.ts  — new

axiomancer-mobile/state/presenters/combat-encounter.engine.ts
  + CombatPeroration VM field on CombatViewModel (premises/at/concedeAt/active/cardName)
  + CombatWallMath VM field on CombatEnemyPaneVM.intent (or sibling field) — projectedDamage/willDeny/netDamage
  ~ card-face builder: rupture-kind heroText sources projectRuptureBurst; the-overtake gets the pip-fuel-aware number
axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx
  ~ fx loop: add 'backfired' case (labeled float, distinct from generic damage)
axiomancer-mobile/components/combat/encounter/CombatBoard.tsx
  + Premise track bar in the statusStrip
  + foretold topCardId toast (small ephemeral banner near the deck pile)
  + REPRISE picker modal + APPLY-flow interception for reprise-mechanic cards
  ~ IntentIcon usage: pass wall-math projection through
axiomancer-mobile/components/combat/encounter/IntentIcon.tsx
  ~ render projected/net damage + DENIED state when willDeny
axiomancer-mobile/components/combat/encounter/CombatSummaryModal.tsx
  ~ CONCEDE-specific copy if not already present (verify first)
axiomancer-mobile/components/combat/encounter/__tests__/*  — colocated tests for the above
```

## Tests

### Mechanics (unit/e2e)
- `projectRuptureBurst`: matches `projectRupture` for a card with no
  card-specific `bonusPct`/`fuelPerPip`; adds `bonusPct` correctly for
  `resonance-detonation`; incorporates `fuelPerPip × (reserve + floating
  pips)` for `the-overtake`.
- Overtake 2-pip gate: 1 total pip spent → rupture step fizzles
  (`effect-fizzled` event, enemy HP unchanged by this mechanic); 2+ pips →
  fires as before. `resonance-detonation` (plain `rupture`, no
  `fuelPerPip`) is unaffected at 0-1 pips.
- `computeRungDenial` / `getDisruptMeter.willDeny`: a state with
  `staggerRungs` at the rung-total ceiling and both `rollPenalty` and
  `pips` under their own deny thresholds → `willDeny: true` (previously
  `false`). Existing roll-penalty and distinct-control deny cases still
  `true`.
- `playCombatCard` with a `reprisalCardId` naming a specific discard entry:
  that exact card returns to hand, not the argmax. Invalid/omitted id:
  unchanged existing argmax behavior (regression guard).
- `projectIncomingThreat`: raw vs projected diverge when `weakenMult`/
  `rungMult` are active (e.g. accumulated STAGGER); `netDamage` reflects
  current `guard`/`barrier`; `willDeny: true` zeroes `netDamage`.
- tu-quoque: `dieBonus` fires on a `heart`-color powering die (was `body`).

### Mobile (colocated + e2e)
- Premise track VM: renders only while a Peroration is declared; hides
  post-CONCEDE/post-fire (tally resets to 0 clears `active`).
- BACKFIRE float: `fx` containing a `backfired` event produces a labeled
  float distinct from a plain `damage-dealt` float (existing float-count
  assertions extended, not replaced).
- Foretell toast: a `foretold` event with a non-null `topCardId` renders
  the card's name once, then clears.
- REPRISE picker: staging + APPLYing a `reprise`-mechanic card with a
  non-empty discard opens the picker; tapping an entry calls `onApply` with
  that card's id threaded through; empty discard skips the picker (existing
  fizzle path).
- IntentIcon: `willDeny` true renders a DENIED state instead of the raw
  damage stake; a11y label updated to state the actual outcome, not the
  face-value threat.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

Mechanics' public export barrel changes (2 new selectors, 1 additive
parameter) — additive only, but `playCombatCard`'s new optional param and
the 2 new selectors are consumed by mobile this same phase, so the mobile
gate is not a defensive sanity check here, it's load-bearing.

## Deploy gate

```bash
npm run deploy:check
```

CI-green. Touches both `axiomancer-mechanics/**` and
`axiomancer-mobile/**` -> full `verify-mechanics.yml` +
`verify-mobile.yml` (including `e2e-minigames`, since this isn't a
cards-only change).

## Git

```bash
git add axiomancer-mechanics/src/Combat/combat.engine.ts \
        axiomancer-mechanics/src/Combat/index.ts \
        axiomancer-mechanics/src/index.ts \
        axiomancer-mechanics/src/Cards/cards.library.ts \
        axiomancer-mechanics/src/Combat/e2e/legibility-sweep.engine.test.ts \
        axiomancer-mobile/state/presenters/combat-encounter.engine.ts \
        axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx \
        axiomancer-mobile/components/combat/encounter/CombatBoard.tsx \
        axiomancer-mobile/components/combat/encounter/IntentIcon.tsx \
        axiomancer-mobile/components/combat/encounter/CombatSummaryModal.tsx \
        axiomancer-mobile/components/combat/encounter/__tests__
git commit -m "$(cat <<'EOF'
feat: show the engine — legibility sweep across 9 surfaces — phase 28

- projectRuptureBurst(state, card): per-card-accurate rupture preview
  (bonusPct + fuelPerPip-aware), replacing the word-only rupture card face
- Overtake 2-pip gate: a fuelPerPip-paired rupture no-ops below 2 spent pips
- Premise track + CONCEDE beat now render on the combat board (were fully
  invisible engine-side state before this phase)
- BACKFIRE damage gets a labeled float (was completely unrendered, not just
  unlabeled — the fx loop had no case for the 'backfired' event at all)
- foretold topCardId surfaces as a toast (deck-reorder was silent)
- REPRISE becomes a player choice via a discard-pile picker, threaded
  through a new optional playCombatCard param (auto-pick argmax remains the
  default/fallback for existing callers)
- wall-math readout: projectIncomingThreat(state) nets the telegraphed hit
  against live weaken/rung modifiers and current guard/barrier
- getDisruptMeter.willDeny now includes STAGGER-rung denial (previously
  under-reported denial when rungs alone would deny the turn)
- tu-quoque's dead onColor:'body' die-bonus recolored to 'heart' (the
  card's own philosophical aspect)

Decisions:
- the-closing-word's three previously-flagged defects (fire-on-declare /
  overshoot-scaling / lying copy) re-verified current and already correct
  in this codebase — not touched; the real remaining control-theme lying
  copy was getDisruptMeter's missing rung-denial case
- rupture card faces now show a real projected number (spec 32's
  real-units-or-no-number rule bars fabrication, not an honest live total)
- REPRISE choice is additive/optional on playCombatCard, defaulting to the
  existing argmax pick, so no non-mobile caller regresses
EOF
)"
git push origin main
```

## DoD

Flip Phase 28 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append the
commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 28 shipped — show the engine legibility sweep"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- **Variable-rung telegraphs** (Gate 1 §3, 1-4 rungs instead of flat 2/3) —
  a separate L-effort item touching 56 authored threat sequences; wall-math
  (this phase) reads whatever rung count exists today, it doesn't change it.
- **One reactive enemy verb** (spec 29 cleanse/harden) and **OBJECTION /
  CAUTERIZE enemy counterplay** — content-sized, separate phase.
- **OMEN v2** (player-chosen prediction window) — oracle-theme M-effort
  rework; this phase's foretell toast is a passive reveal only.
- Full foretell candidate-list UI (what else was considered, not just the
  winner) — would need an event-schema change; not requested by the design
  doc.
- Overtake's live burst preview does not simulate a not-yet-drafted die's
  hypothetical pips — only currently-banked Reserve/floating pips. A
  "if I draft X and spend it too" preview is a bigger UI-state change, out
  of scope.
