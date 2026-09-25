# Deck-tuning run — 2026-07-19: swap-pool promotions (owner-ratified)

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5, `plan/2026-09-25-trim-the-fat.spec.md` Tier 2 docs); superseded, kept for provenance. Original path: `axiomancer-mechanics/docs/reports/deck-tuning-2026-07-19-promotions.md`. Not a source of rules.

Working agent: card-expert (`/deck-tuning`), branch
`balance/deck-promotions-2026-07-19`. Mandate: promote NINE measured
promote-candidates from the 2026-07-18 swap-pool measurement pass
(`deck-tuning-2026-07-18.md`, report of record) into `cards.library.ts` AND
their preset recipe seats — the report's [needs-user-call] queue-of-8 PLUS
half-spoken-prophecy, the one needs-more-data-grade promotion the owner's
ballot explicitly ratified. Color-law breaks resolved by RECOLORING the card
to the evicted seat's aspect (recipe partitions untouched). Evicted
incumbents remain library cards (reward/unseated pool) — unseated, never
deleted.

## Design rationale

The 07-18 pass measured 31 one-at-a-time seat swaps; these nine were the
arms where the swap-in beat its incumbent on the doctrine axes (win-rate
curve fit + statusEngagement) at a legal or recolor-resolvable seat. The
promotion's new unknown was COMBINATION: oratory carries two promoted seats,
bastion two, and all A/Bs predated Phase D9 (stance-check variety, shipped
2026-07-19). So every seat was re-measured at THIS HEAD, control vs
treatment from identical seeds/flags — control cells reconstruct the old
recipe via the swap grammar (all promoted cards and incumbents are library
cards, so no sandbox set is needed).

| # | card (theme) | seat | evicted | recolor | 07-18 arm |
|---|---|---|---|---|---|
| 1 | poisoned-well (affliction) | erosion x4 body common | slippery-slope | — | e1 |
| 2 | videtur-quod (peroration) | oratory x4 heart common | exordium | — | o1 |
| 3 | quod-erat-demonstrandum (peroration) | oratory rare heart spell | the-closing-word | — | o3 |
| 4 | tempered-edge (forge) | foundry x4 body common | half-step | — | f2 |
| 5 | half-spoken-prophecy (oracle) | augury body uncommon | self-flagellant (borrow) | mind→body | a3 |
| 6 | grace-under-fire (charm) | grace body uncommon | measured-answer (borrow) | — | g2 |
| 7 | pebble-in-the-boot (bulwark) | bastion x4 body common | nettle-cloak | — | b1 |
| 8 | the-anvil-speaks (bulwark) | bastion rare body spell | the-adamant-wall | — | b3 |
| 9 | the-burden-of-repetition (echo) | refrain body uncommon | self-flagellant (borrow) | heart→body | r1 |

Recolor notes (aspect field only; no printed text mentioned a color):
burden-of-repetition's `dieBonus: { onColor: 'match' }` now keys to a BODY
die — in the refrain recipe's body slot the conviction kicker fires at least
as often as the measured heart-colored A/B form. half-spoken-prophecy has no
die/threshold line, so its recolor is behavior-neutral. Aspect never enters
`scoreCard`, so every `// pts:` comment survives unchanged.

## Combined evidence (control = old recipe via swap-back, treatment = promoted recipe; IDENTICAL seeds/flags)

Cell format: `control → treatment (Δ)`. 60 runs/cell, seed 1, flag-off dice
unless marked. `sE` = statusEngagement; `mid/ALL8` = mean across all 8
policies.

Invocations (per preset `p`, from `axiomancer-mechanics/`):
`npm run combat-playtest -- --stage=all --policy=all --deck=preset:<p> --runs=60 --seed=1 --cards --json`
(treatment) / same with `--deck=preset:<p>+swap:<in>/<out>[,...]` swapping
each promoted card back to its incumbent (control). Full rollup:
`--deck=preset:all` (treatment only). Flag-on cells append
`--upgradeable-dice`.

### erosion (poisoned-well)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| mid/blind | 0.370 → 0.503 | +0.133 | 0.298 → 0.302 | +0.004 |
| mid/greedy | 0.377 → 0.493 | +0.117 | 0.298 → 0.303 | +0.005 |
| late/blind | 0.028 → 0.050 | +0.022 | 0.290 → 0.294 | +0.003 |
| mid/ALL8 | 0.402 → 0.465 | +0.063 | 0.301 → 0.301 | 0.000 |

Reproduces arm e1 exactly (mid lands ON the ~0.50 doctrine target). Seat:
poisoned-well 6.04 plays/run mid, share 0.469, 0 fizzles.

### oratory (videtur-quod + quod-erat-demonstrandum — the two-seat combination)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| mid/blind | 0.640 → 0.730 | +0.090 | 0.216 → 0.227 | +0.011 |
| mid/greedy | 0.643 → 0.727 | +0.083 | 0.217 → 0.231 | +0.014 |
| late/blind | 0.119 → 0.331 | +0.211 | 0.199 → 0.221 | +0.022 |
| late/greedy | 0.117 → 0.328 | +0.211 | 0.201 → 0.222 | +0.021 |
| mid/ALL8 | 0.655 → 0.726 | +0.072 | 0.203 → 0.209 | +0.006 |

The combination is bigger than either single arm at late (+0.211 vs o1's
+0.050 / o3's +0.158) — videtur-quod's premise+poison commons feed QED's
faster conclusion. Late blind 0.331 sits at the TOP of the 0.25-0.35
doctrine band (median across the roster 0.25). **Concede centrality
intensified in combination:** blind+greedy pooled, CONCEDE is 194/437 = 44%
of mid wins (was 68/385 = 18%) and 206/237 = **87% of late wins** (single-arm
A/B measured 71%). The owner accepted concede-centrality for QED; the
combined number is reported here for the record. See also the
impossible-stage finding under "Band status".

### foundry (tempered-edge)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| early/blind | 0.600 → 0.803 | +0.203 | 0.000 → 0.205 | +0.205 |
| early/greedy | 0.597 → 0.800 | +0.203 | 0.000 → 0.205 | +0.205 |
| mid/blind | 0.000 → 0.003 | +0.003 | 0.000 → 0.208 | +0.208 |
| mid/ALL8 | 0.000 → 0.003 | +0.003 | 0.000 → 0.193 | +0.193 |

Reproduces arm f2: early lands ON band, foundry's enemy-side engagement
metric goes 0.00 → ~0.20. Known structural residue: mid/late stay ~0.00
(pip cash-out vs boss HP — engine/preset-shape work, not seat-level), and
tempered-edge's contribution share is 0.90-0.96 with ~100 threshold-rider
fizzles/stage — the single DoT line is definitionally the whole kill line
until foundry gets more in-theme cash-out.

### augury (half-spoken-prophecy, recolored mind→body)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| mid/blind | 0.007 → 0.050 | +0.043 | 0.248 → 0.262 | +0.014 |
| mid/greedy | 0.007 → 0.057 | +0.050 | 0.245 → 0.260 | +0.014 |
| late/blind | 0.000 → 0.000 | 0.000 | 0.258 → 0.271 | +0.013 |
| mid/ALL8 | 0.026 → 0.055 | +0.030 | 0.220 → 0.223 | +0.003 |

The ratified needs-more-data promotion, and it slightly BEATS its 07-18 A/B
(+0.043/+0.050 vs +0.037): win- and engagement-positive at every stage, dot
fraction up (0.217→0.280 mid), dominance DOWN (0.64→0.62). Known caveat
carried: 628-721 precondition fizzles per stage (the RUPTURE needs a live
affliction). Augury's mid ~0.00 breach remains structural regardless of
seat.

### grace (grace-under-fire)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| early/blind | 0.689 → 0.811 | +0.122 | 0.000 → 0.056 | +0.056 |
| early/greedy | 0.717 → 0.817 | +0.100 | 0.000 → 0.056 | +0.056 |
| mid/blind | 0.000 → 0.043 | +0.043 | 0.000 → 0.047 | +0.047 |
| mid/ALL8 | 0.000 → 0.045 | +0.045 | 0.000 → 0.062 | +0.062 |

Reproduces arm g2: early ON band. The grace HP-purity direction ballot item
(g1 vs g3) stays open; white-flag-woven is NOT promoted (slot-broken).

### bastion (pebble-in-the-boot + the-anvil-speaks — the two-seat combination)

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| mid/blind | 0.070 → 0.177 | +0.107 | 0.462 → 0.496 | +0.033 |
| mid/greedy | 0.093 → 0.180 | +0.087 | 0.460 → 0.494 | +0.034 |
| late/blind | 0.000 → 0.000 | 0.000 | 0.465 → 0.491 | +0.026 |
| mid/ALL8 | 0.035 → 0.090 | +0.056 | 0.405 → 0.453 | +0.049 |

The combination is super-additive at mid (+0.107 vs b1 +0.063 / b3 +0.030
alone) — the two sting lines stack. Still far below the 0.50 band; the right
first seats, not the whole repair. the-anvil-speaks' seat share 0.127-0.153
(the-adamant-wall's was 0.000 — the invisible-wall problem retired).

### refrain (the-burden-of-repetition, recolored heart→body) — PARTIAL reproduction

| stage/policy | win | Δ | sE | Δ |
|---|---|---|---|---|
| mid/blind | 0.420 → 0.450 | +0.030 | 0.330 → 0.417 | +0.088 |
| mid/greedy | 0.443 → 0.450 | +0.007 | 0.332 → 0.416 | +0.084 |
| late/blind | 0.058 → 0.058 | 0.000 | 0.320 → 0.407 | +0.086 |
| late/greedy | 0.064 → 0.050 | −0.014 | 0.321 → 0.407 | +0.086 |
| mid/ALL8 | 0.509 → 0.490 | −0.019 | 0.338 → 0.404 | +0.066 |

Honest negative-shading: the 07-18 A/B's win lift (mid +0.163) does NOT
reproduce at this HEAD — the win axis is now flat-to-slightly-negative
(mid/ALL8 −0.019), while the ENGAGEMENT lift reproduces in full (+0.066
ALL8, up at every cell — still the run's largest sE gain, the doctrine's
primary axis). The 07-18 arm ran pre-D9; the stance-check variety change is
the suspected environment delta. Refrain stays in band at mid (0.450 blind
vs ~0.50 target; it was the healthiest preset). Promotion stands per the
owner's ratified list; the attenuated win delta is recorded for the next
sweep. Purity gain holds (the last akrasia borrow in refrain retires).

**Winnowing dominance watch (the mandated number):** post-promotion,
winnowing is the dominant card in 10/10 mid and 12/12 late blind+greedy
cells (control: self-flagellant in all), with mean dominantCardShare **0.84
at mid and 0.93 at late** (control 0.80/0.80) — the A/B's ~0.90 forecast
confirmed and slightly exceeded late. Winnowing's own line share stays
modest (0.074 mid / 0.154 late; it is dominance-by-concentration of the
kill line, not spam). Per mandate: NO winnowing nerf in this PR — a
winnowing downtune probe is a separate A/B (filed under follow-ups).

## Valve re-seats + flag-on ratification

The D8 valve law requires each seat's `replacesId` to be IN the flag-off
recipe (same aspect). THREE re-seats were forced by evictions — the
mandate's named erosion rider plus two implied by the same law:

| preset | valve | replacesId old → new | aspect law |
|---|---|---|---|
| erosion | recurring-symptom | slippery-slope → poisoned-well | body=body ✓ |
| oratory | restate-the-point | exordium → videtur-quod | heart=heart ✓ |
| bastion | hold-the-line | the-adamant-wall → the-anvil-speaks | body=body ✓ |

Flag-on erosion A/B (the ratification cell; same seeds, `--upgradeable-dice`,
control = swap-back which under flag-on reproduces the old
slippery×3+valve deck exactly):

| stage/policy | win | Δ | sE |
|---|---|---|---|
| early/blind+greedy | 0.822 → 0.872 | +0.050 | 0.231 → 0.239 |
| mid/blind+greedy | 0.247 → 0.330 | +0.083 | 0.237 → 0.245 |
| late/blind+greedy | 0.003 → 0.014 | +0.011 | 0.229 → 0.236 |

Valve re-seat RATIFIED: flag-on erosion improves at every stage, no
regression (the mobile builds run flag-on — THE FLIP 2026-07-18).

Flag-on all-preset sanity row
(`--stage=all --policy=blind --deck=preset:all --upgradeable-dice --runs=60 --seed=1 --json`):
every preset healthy or unchanged — erosion 0.87/0.33/0.01, oratory
0.91/0.71/0.36, foundry 0.73/0.00/0.00, refrain 0.87/0.39/0.04, others
within their known flag-off shapes. Note oratory flag-on impossible 0.40
(see next section).

## Band status per preset

`combat-playtest.balance-bands.sim.test.ts` (in `npm run verify`) is GREEN
at the promoted seats, and the win-rate curve-shape witness passes for all
ten presets with the violator set still EMPTY (greedy policy-pick curve:
erosion 1.00/0.60/0.12, oratory 1.00/0.67/0.57, refrain 1.00/0.55/0.13, all
`move ≤ −0.43`). Nothing was reverted; nothing recalibrated.

**Out-of-band finding (reported, not reverted — the band test itself does
not pin it):** with QED seated, `preset:oratory` beats the IMPOSSIBLE-stage
ceiling probe at **0.52 blind flag-off / 0.40 blind flag-on** (doctrine:
impossible ≈ 0%; control was 0.27). The CONCEDE path ignores The
Incompleteness' HP wall entirely. The e2e impossible ceiling
(`winRate <= 0.15`) measures policy-pick decks, so the gate stays green,
but a starter preset clearing the ceiling probe is a dominance finding by
doctrine. Filed as the top follow-up: concede-acceleration needs an
impossible-stage brake (e.g. boss Premise-shed, already the plan-#1 shape)
before oratory's late-game is called healthy. Late blind 0.331 sits at the
top edge of the 0.25-0.35 band on the same evidence.

## Per-preset spread at HEAD (treatment `preset:all` run, blind; min/med/max win)

| preset | early | mid | late | impossible |
|---|---|---|---|---|
| erosion | 0.47/1.00/1.00 | 0.05/0.62/0.98 | 0.00/0.02/0.25 | 0.00 |
| oratory | 0.60/1.00/1.00 | 0.23/1.00/1.00 | 0.22/0.25/0.80 | 0.52 |
| foundry | 0.18/1.00/1.00 | 0.00/0.00/0.02 | 0.00/0.00/0.00 | 0.00 |
| penitent | 0.33/0.95/1.00 | 0.00/0.15/0.55 | 0.00/0.00/0.00 | 0.00 |
| standstill | 0.02/0.97/1.00 | 0.00/0.00/0.00 | 0.00/0.00/0.00 | 0.00 |
| augury | 0.03/0.95/1.00 | 0.00/0.05/0.13 | 0.00/0.00/0.00 | 0.00 |
| tithe | 0.28/1.00/1.00 | 0.00/0.18/0.38 | 0.00/0.00/0.00 | 0.00 |
| grace | 0.07/1.00/1.00 | 0.00/0.02/0.18 | 0.00/0.00/0.00 | 0.00 |
| bastion | 0.23/1.00/1.00 | 0.00/0.13/0.43 | 0.00/0.00/0.00 | 0.00 |
| refrain | 0.65/1.00/1.00 | 0.18/0.43/0.85 | 0.00/0.02/0.27 | 0.00 |

Mid-floor breaches remaining: foundry, standstill at 0.00 median (both
structural, known); grace 0.02, augury 0.05, bastion 0.13 — all improved vs
the 07-18 control (0.00/0.00/0.03) but still below band. Untouched presets
(penitent, standstill, tithe) are byte-identical to control.

## Per-deck line telemetry (promoted seats, mid stage, all-8-policy aggregate)

| preset | OUT plays/run · share | IN plays/run · share · fizzles |
|---|---|---|
| erosion | slippery-slope 6.11 · 0.350 | poisoned-well 6.04 · 0.469 · 0 |
| oratory | exordium 7.59 · 0.429 | videtur-quod 6.64 · 0.426 · 0 |
| oratory | the-closing-word 2.08 · 0.005 | quod-erat-demonstrandum 1.94 · 0.006 · 0 |
| foundry | half-step 5.76 · 0.000 | tempered-edge 5.96 · 0.904 · 122 |
| augury | self-flagellant 2.99 · 0.251 | half-spoken-prophecy 3.00 · 0.185 · 628 |
| grace | measured-answer 4.53 · 0.000 | grace-under-fire 6.44 · 0.000 · 0 |
| bastion | nettle-cloak 7.50 · 0.589 | pebble-in-the-boot 7.54 · 0.581 · 0 |
| bastion | the-adamant-wall 1.94 · 0.000 | the-anvil-speaks 1.96 · 0.127 · 0 |
| refrain | self-flagellant 2.45 · 0.099 | the-burden-of-repetition 2.72 · 0.205 · 0 |

Zero-share entries (grace-under-fire, measured-answer, half-step) are
guard/SWAY/pip lines the enemy-facing contribution metric cannot see — the
known statusEngagement blind-spot family.

## Pin / quota changes (every structural test edit, documented)

1. `cards.library.ts` — 70 → **79** cards (9 promoted spells appended with
   provenance comments; `addedIn: '2026-07-18'` kept per the D8 valve
   precedent — authoring date, not promotion date).
2. `curated-library.engine.test.ts` — 70-pin → 79; POST_D8_SHAPE re-pinned
   (affliction/forge +1 common; peroration +1 common +1 rare; oracle/charm
   +1 uncommon; bulwark +1 common +1 rare; echo +1 uncommon); reward-only
   count 10 → **18**; `addedIn` allow-list gains `'2026-07-18'`; reward
   pool 70 → 79.
3. `deck-presets.engine.test.ts` — FLAG_OFF_SNAPSHOT re-pinned at the seven
   touched presets; unseated-set pin grows by the 8 evicted incumbents
   (exordium, half-step, measured-answer, nettle-cloak, self-flagellant,
   slippery-slope, the-adamant-wall, the-closing-word — slippery-slope
   remains the starting-pair teaching card); library pin 70 → 79.
4. `pricing.engine.test.ts` — spell count 55 → **64**.
5. `thoughtforms.engine.test.ts` — 70/55 pins → 79/64.
6. `card-effectiveness.engine.test.ts` — 70-pin → 79; `consume_affliction`
   assertion now honors the authored `souls` count (half-spoken-prophecy
   prints `souls: 0` — the no-Soul trade IS its design, so the promise is
   "souls unchanged", not growth); FIXTURE_OVERRIDES entry for
   the-burden-of-repetition (staged MARK shortened to d1 so the trailing
   re-plant proves itself via duration growth after the closer consumes the
   stacks).
7. `doctrine-strike-dead.engine.test.ts` — 70-pin → 79 (all nine promoted
   cards pass the clean-board witness; they were already swept as sandbox
   cards).
8. `combat-playtest.card-coverage.sim.test.ts` — 70-pin → 79 (all 79
   playable).
9. `swap-pool.engine.test.ts` — per-theme quotas become residual (authored
   10/12/8 minus a documented PROMOTED_OUT map); pool total 300 → **291**.
10. `preview-truth.engine.test.ts` — the "non-DoT cards print NO number"
    witness restated in its honest general form: every card's preview must
    EQUAL its real enemy-DoT lifetime HP (0 when none). Pre-promotion the
    old phrasing held only because no defend-class card carried an enemy
    DoT; the promoted hybrids (tempered-edge, the-anvil-speaks: GUARD mech
    ⇒ verbClass 'defend', plus a real ember/sting DoT) print their true
    lifetime number. No fake numbers are admitted by the new form.
11. `forge-overheat.engine.test.ts` — the OVERHEAT sim sweep seats
    half-step back into its old x4 seat explicitly (the carrier is now
    unseated).
12. `premise-milestone-drip.engine.test.ts` — oratory-deck pin exordium →
    videtur-quod (same PREMISE-depositor role).
13. `themed-decks.engine.test.ts` — bastion ignition signal accepts
    `debuff_nettle_sting` beside `buff_thorns` (the seated sting line).
14. `combat.starter-deck-presets.ts` — 9 seat edits across 7 recipes;
    PRESET_COLOR_BORROWS shrinks (augury/grace/refrain each retire one
    borrow); PRESET_DICE_VALVES re-seats (table above).

## Applied changes (files)

- `src/Cards/cards.library.ts` — nine promoted card literals (+ two
  recolors) with `// pts:` comments intact.
- `src/Cards/swap-pool/{affliction,peroration,forge,oracle,charm,bulwark,echo}.swap-pool.ts`
  — promoted literals removed, provenance comments left at each site, set
  arrays re-counted.
- `src/Combat/combat.starter-deck-presets.ts` — seats, borrows, valves.
- Tests per the pin table above.
- `docs/keyword-atlas.md` — POISON, PREMISE, OMEN, RUPTURE, SWAY, THORNS,
  ECHO, PIP, MARK rows annotated with the new home carriers + receipts.
- `docs/reports/baselines/deck-matrix-baseline.json` — regenerated at the
  post-promotion tree (same flags/seed as the stored artifact).
- This report.

## Verify

- `npm run verify -w axiomancer-mechanics` — green (type-check ×3, lint
  0 errors, 4019 tests, build).
- `npm run verify -w axiomancer-mobile` — green (255 suites / 2658 tests;
  cross-package checklist trigger: `src/Cards/**` + `src/Combat/**`).

## Considered but not applied

- **Reverting QED over the impossible-stage 0.52:** the band e2e does not
  pin preset-vs-impossible, the owner explicitly ratified QED with the
  concede-centrality consequence, and late lands in band — so the seat
  stands and the finding is filed instead. If the owner reads impossible
  0.52 as disqualifying, the single-seat revert is
  `quod-erat-demonstrandum → the-closing-word` (one recipe line + one
  FLAG_OFF_SNAPSHOT line + the POST_D8 rare count).
- **Winnowing downtune** (dom share 0.93 late behind burden): out of scope
  per mandate; separate A/B.
- **Recalibrating any balance band:** none needed; all green.

## Follow-ups (filed, not fixed)

1. Oratory concede-acceleration vs the impossible/late ceiling (0.52
   impossible, 87% of late wins by CONCEDE) — boss Premise-shed brake.
2. Winnowing downtune probe in the burden-seated refrain (dom 0.84 mid /
   0.93 late).
3. Refrain win-delta attenuation at post-D9 HEAD (engagement reproduced,
   win did not) — re-measure r1's shape after the next engine move.
4. Foundry/standstill mid 0.00 remain engine/preset-structural (known).
5. half-spoken-prophecy fizzle pressure (628-721/stage) — a cheaper
   affliction seed in augury's commons would feed it; pool-side candidates
   exist (read-the-entrails was win-positive but engagement-negative).
