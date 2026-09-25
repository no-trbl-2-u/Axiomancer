# GLYPHS crackAt A/B — 2026-08-23: sim policy heuristic evidence pass

Working agent: card-expert (`/ship-a-phase`, Phase 51,
`plan/archive/2026-09-25-trim-t4/plan/phases/phase_51_crackat_policy_and_ab_court.md`). Mandate: give the sim
bots a `crackAt` charge-threshold heuristic so they can play the "ripening
dilemma" (crack a Seal now, small, vs. wait, bigger, riskier), then run the
seeded A/B evidence WI-2's acceptance criterion 2 (late-stage
`statusEngagement` lift on the pilot cards' presence) asks for. This is a
**policy-heuristic promotion**, not a card-library promotion — the two
sandbox cards (`the-plague-seal`, `the-hoarwatch-sigil`) stay sandbox-only
per Gate-4 (33d's own binding "register → A/B → promote" rule); only
`CombatSimPolicy.crackAt` is a permanent, non-flagged engine change.

## Design rationale

Phase 33d's GLYPHS pilot (charging Seals: `state.glyphs`, `crackGlyph`) is
still fully live in the engine — only its 4 pilot cards were wiped by the
Profane Canon reset (`84ef85bd`, 2026-08-08), leaving `state.glyphs`
unreachable in real play ever since (Phase 50's mobile Seal chip row has
never rendered outside a hand-built test state). Step 0 of this phase
re-authors a **lean 2-card set** (`GLYPHS_51_PILOT`: a poison Seal in `rot`,
a barrier Seal in `vigil`, PAID-inscribe only, numbers reused verbatim from
33d — charge cap 3, poison base intensity 1 / duration 2, barrier base
amount 2), then wires `CombatSimPolicy.crackAt?: number` — a charge
threshold at which a witness cracks its highest-charge eligible Seal,
dieless — into `upgradeablePlayPhase` only (the flag-off legacy
`policyPlayPhase` body stays byte-identical, per its own pinned-e2e comment).
`greedy`, `blind`, `dot-weaver`, `turtle`, `control-lock` get `crackAt: 2`
(`cap / 2`, `glyphExpectedValue`'s own "reasonable crack timing" assumption,
reused not re-derived); `aggro-brute`, `chaos`, `mercy-seeker` stay
never-cracking (absent), matching their doctrinal roles.

## Judgment call: mapping the brief's stage names onto the live CLI

**[decided, not asked]** The phase brief's own evidence commands read
`--stage=threadbare` / `--stage=apostate`. Those are not valid `--stage`
values — the live `combat-playtest` CLI's stage axis is
`early|mid|late|impossible` (`combat.stage-profiles.ts`); `threadbare`/
`pilgrim`/`apostate` are **deck PRESET ids** (`combat.starter-deck-presets.ts`,
the Profane Canon stage ladder), a different axis entirely, and the brief's
own commands pass `--deck=policy-pick` (not `--deck=preset:threadbare`), so
the literal command as written fails loudly (`Unknown --stage 'threadbare'`).
Mapped WI-2's own intent — one early no-regression check, one late headline
for AC2 — onto the CLI's real stage vocabulary: `--stage=early` for the
no-regression check, `--stage=late` for the late-stage `statusEngagement`
headline. `--deck=policy-pick`, the runs/seeds, and the `--sandbox=` toggle
are unchanged from the brief.

## Evidence (control = no sandbox, treatment = `GLYPHS_51_PILOT` live; IDENTICAL seeds/flags)

200 runs/cell (6 enemies per stage, 200 runs each), seed 51001 (early) / 51002
(late), Upgradeable Dice ON (the CLI default — the model the shipped app
boots and the only driver `crackAt` reads). `win` = winRate, `sE` =
statusEngagement, `rounds` = avgRounds. Rows cover the five `crackAt`-equipped
policies plus the `ALL8` pooled rollup (all 8 policies × 6 enemies × 200
runs = 9,600 runs/cell).

Invocations (from `axiomancer-mechanics/`):

```bash
# Baseline — today's shipped behavior, no glyphs ever in play.
npm run combat-playtest -- --stage=early --policy=all --deck=policy-pick --runs=200 --seed=51001 --cards --json > /tmp/glyphs51-baseline-early.json
npm run combat-playtest -- --stage=late  --policy=all --deck=policy-pick --runs=200 --seed=51002 --cards --json > /tmp/glyphs51-baseline-late.json

# Treatment — GLYPHS_51_PILOT live + crackAt-equipped roster.
npm run combat-playtest -- --stage=early --policy=all --sandbox=GLYPHS_51_PILOT --deck=policy-pick --runs=200 --seed=51001 --cards --json > /tmp/glyphs51-treatment-early.json
npm run combat-playtest -- --stage=late  --policy=all --sandbox=GLYPHS_51_PILOT --deck=policy-pick --runs=200 --seed=51002 --cards --json > /tmp/glyphs51-treatment-late.json
```

### early (no-regression check)

| policy | win | Δ | sE | Δ | rounds |
|---|---|---|---|---|---|
| greedy | 0.281 → 0.405 | +0.124 | 0.000 → 0.070 | +0.070 | 5.53 → 5.63 |
| blind | 0.281 → 0.405 | +0.124 | 0.000 → 0.070 | +0.070 | 5.53 → 5.63 |
| dot-weaver | 0.547 → 0.626 | +0.079 | 0.190 → 0.216 | +0.026 | 3.87 → 3.85 |
| control-lock | 0.462 → 0.623 | +0.161 | 0.213 → 0.196 | −0.017 | 5.11 → 4.46 |
| turtle | 0.022 → 0.329 | +0.307 | 0.000 → 0.016 | +0.016 | 6.24 → 5.03 |
| ALL8 | 0.293 → 0.434 | +0.141 | 0.050 → 0.085 | +0.035 | 5.33 → 4.96 |

### late (WI-2 AC2 headline)

| policy | win | Δ | sE | Δ | rounds |
|---|---|---|---|---|---|
| greedy | 0.049 → 0.012 | −0.037 | 0.173 → 0.215 | +0.042 | 4.72 → 4.34 |
| blind | 0.049 → 0.012 | −0.037 | 0.173 → 0.215 | +0.042 | 4.72 → 4.34 |
| dot-weaver | 0.003 → 0.000 | −0.003 | 0.333 → 0.323 | −0.011 | 3.86 → 3.87 |
| control-lock | 0.000 → 0.259 | +0.259 | 0.344 → 0.304 | −0.040 | 5.64 → 5.00 |
| turtle | 0.000 → 0.000 | 0.000 | 0.090 → 0.098 | +0.008 | 4.10 → 4.13 |
| ALL8 | 0.018 → 0.036 | +0.018 | 0.185 → 0.213 | +0.028 | 4.49 → 4.32 |

### Card presence (treatment; plays/run, averaged over cells where drafted)

| card | early | late |
|---|---|---|
| the-plague-seal (poison, rot) | **never drafted** — tier 2 exceeds `early`'s `maxCardTier: 1` gate (stage-appropriate deck-maturity filter, not an engine gap) | 2.29 |
| the-hoarwatch-sigil (barrier, vigil) | 2.67 | 2.24 |

## Verdict against WI-2 AC2

**Partial.** The pooled `ALL8` late-stage `statusEngagement` lift is +2.8pp
(0.185 → 0.213) — short of WI-2's illustrative +10pp. Two reasons, both
structural rather than a `crackAt` defect:

1. **The pooled rollup mixes payload kinds.** `statusEngagement` counts plays
   that land a status effect **on the enemy**; only the poison Seal's crack
   qualifies (the barrier Seal's crack feeds the player's own `state.barrier`
   — a real, measured win-rate and rounds effect, but not a `statusEngagement`
   event by that metric's own definition). `dot-weaver` — WI-2's own "status
   policy" witness — is the cleanest read of the poison line, and it actually
   moves **slightly negative** at late (0.333 → 0.323, −1.1pp): dot-weaver's
   deck draft already runs a full erosion kit at rank 5-6 (rupture, mark,
   fester), so the modest rank-2 poison Seal (base intensity 1, cap 3) rarely
   out-competes those picks for the crack-vs-hold decision inside a fight
   that's already near 0% win rate at `late`/policy-pick.
2. **`aggro-brute` (+9.4pp, 0.167 → 0.261) and `chaos` (+6.2pp, 0.103 → 0.166)
   carry the biggest late `statusEngagement` lifts** — both are policies
   WITHOUT `crackAt` (never crack) whose lift comes purely from the Seal
   cards' FREE lines (MARK / THORNS) landing as ordinary status plays when
   the draft includes them, not from the crack heuristic itself.

Mean rounds DID move as WI-2 anticipated in direction (late `ALL8` 4.49 →
4.32, `control-lock` 5.64 → 5.00, `greedy`/`blind` 4.72 → 4.34) — every
`crackAt` policy's fights got shorter, not the 2.0-2.2 → 3-4 the pre-reset
WI-2 numbers predicted (those numbers were calibrated against a different,
now-retired library and are not expected to transfer — see the phase brief's
own design-sources note on `glyphExpectedValue`'s pricing anchor). The
`crackAt` heuristic is doing real, legible work — it just reads mostly as a
**win-rate and pacing** effect (barrier survivability, faster kills) rather
than the specific `statusEngagement` metric WI-2 named, because that metric
structurally excludes half of what this pilot's two payload kinds do.

## Band status (reported, not reverted — this phase's evidence is not a promotion verdict)

**Dominance-adjacent finding, logged per the brief's own instruction ("note
it, don't re-tune"):** `turtle` (+30.7pp win at early, 0.022 → 0.329) and
`control-lock` (+16.1pp early / +25.9pp late, the late cell going from 0.000
to 0.259 — squarely inside the doctrinal late 25-35% band) see large
win-rate swings from a single cheap (Doxa/Lemma-band, 2.20/4.70 points)
sandbox card each. These are `policy-pick` sim baselines, not the starter
preset ladder CLAUDE.md's win-curve law actually governs, so this is not a
doctrine breach — but the swing size relative to the cards' modest printed
cost is worth a second look before any future promotion pass. Filed below.

## Considered but not applied

- **Widening the evidence pass to `mid`/`impossible` or the full stage
  ladder:** the brief scopes this phase to early (no-regression) + late (the
  AC2 headline) explicitly; `npm run combat-playtest --stage=all` is
  available for a future widening pass if this finding warrants it.
- **Re-tuning `dot-weaver`'s `rankCard` to prioritize the poison Seal over
  its existing erosion kit:** out of scope — the brief is explicit that a
  `crackAt`-adjacent `rankCard` change is `/deck-tuning` territory, not this
  phase's.
- **A 3rd payload-mix statusEngagement metric that credits barrier cracks:**
  would require a `combat.objective.ts`/`combat.playtest.ts` metric change,
  well outside a card-content + policy-field phase.

## Follow-ups (filed, not fixed)

1. **Barrier/poison split in `statusEngagement`:** the metric structurally
   under-counts a defensive glyph payload's contribution to the doctrine axis
   it's meant to witness. Worth a `combat.objective.ts` design pass once a
   theme other than `rot` cares about being measured by it.
2. **`turtle`/`control-lock` win-rate swing size vs. the Seals' printed cost:**
   re-measure alongside any future promotion candidacy for these 2 cards —
   the swing looks large for a Doxa/Lemma-band card and deserves a
   `/deck-tuning` look before either card leaves the sandbox.
3. **`the-plague-seal`'s tier-2 exclusion from `early`:** by design (the
   stage's `maxCardTier: 1` gate), but it means this phase's "early
   no-regression" cell only exercises the barrier Seal, not the crackAt
   heuristic's poison-payload line. A tier-1 poison Seal variant (or a wider
   `early`-eligible pilot) would close that gap if a future pass wants
   early-stage poison-line coverage.
4. **FREE-line-driven engagement, not crack-driven:** `aggro-brute`/`chaos`
   (no `crackAt`) show real `statusEngagement` lift purely from the Seal
   cards' FREE lines (MARK/THORNS). Worth separating "the card exists" from
   "the crackAt heuristic fires" in a future, more surgical A/B (e.g. compare
   `crackAt` vs `crackAt: undefined` on the SAME roster with the set live, not
   set-live vs no-set) if a tighter isolation of the heuristic's own
   contribution is ever needed.

## Applied changes (files)

- `src/Cards/cards.sandbox-sets.ts` — `GLYPHS_51_PILOT` (2 cards:
  `the-plague-seal` rot/poison, `the-hoarwatch-sigil` vigil/barrier), the
  first entry in the post-Profane-Canon-reset sandbox set registry.
- `src/Combat/combat.sim-policies.ts` — `CombatSimPolicy.crackAt?: number`;
  `crackAt: 2` on `greedy`/`blind`/`dot-weaver`/`turtle`/`control-lock`.
- `src/Combat/combat.encounter.sim.ts` — the crack-eligibility decision seam
  in `upgradeablePlayPhase` (exported, alongside `PlayPhaseResult`, for
  direct-drive test access); `policyPlayPhase` untouched.
- `src/Cards/e2e/cards-sandbox.engine.test.ts` — the post-reset "empty
  registry" pin moves to "holds `GLYPHS_51_PILOT`"; new coverage for both
  Seal cards resolving with no collisions.
- `src/Combat/e2e/combat-sim-policies.engine.test.ts` — roster-assignment
  pin (the doctrine-fit five carry `crackAt: 2`, the other three stay
  absent) + the crack decision-seam behavior suite (threshold met/not-met,
  `crackAt` absent never cracks, highest-charge-first, array-order tie-break)
  driving `upgradeablePlayPhase` directly with a policy stub, per the brief's
  own test spec.
- This report.

## Verify

- `npm run verify -w axiomancer-mechanics` — green (type-check ×3, lint,
  2895 tests passed / 11 skipped, build).

## Not touched, noted for the record

`src/Combat/combat.cards.ts`'s `riderText` has no case for
`CardRider.glyphCharge` (a pre-existing gap since 33d — neither pilot phase's
own Outputs list touched `combat.cards.ts`). `GLYPHS_51_PILOT`'s 2 cards
don't use `glyphCharge` at all (no FREE-line pump card this phase, per the
brief's own cut), so this gap doesn't affect them — flagged here only because
a future glyph-charging FREE-line card would print an incomplete FREE line
until that's wired.
