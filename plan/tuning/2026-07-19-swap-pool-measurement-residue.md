# Swap-pool measurement pass — residue + owner-call queue (2026-07-19)

> Measurement session, filed as residue. The gated `/deck-tuning` pass the
> Swap-Pool Atlas was waiting for ran and MERGED as PR #131: 31 swap-variant
> A/B arms across all 10 themes/presets (60 runs/cell, seed 1, all stages ×
> all 8 policies, identical seeds control vs treatment). Docs-only — no
> recipe/library/engine literal shipped. Evidence of record:
> `axiomancer-mechanics/docs/reports/deck-tuning-2026-07-18.md`. The atlas
> artifact was updated in place with a "measured results" section
> (owner review page, same URL; data pointer in auto-memory).
>
> **Stamp:** measured at HEAD post-PR#125/PR#130; baseline re-stamped via
> `npm run baseline:regen` inside PR #131 (drift signal live again).

---

## A. Leading finding — the ground moved before the pass (drift)

All 144/144 cells of the stored baseline (`0f7f0500`) had drifted. Cause is
**PR #125 (Press Fate default-worn loadout + enemy/policy edits)**, NOT the
sandbox-only swap pool. Consequences every future seat decision must absorb:

- **Atlas premises are stale where they cite pre-#125 telemetry.** Worst
  case: "penitent mid 0.92 dominance" → HEAD control is mid blind 0.18.
  Penitent's problem INVERTED from dominance to mid under-performance; the
  akrasia dilution program needs a new objective before any of its levers
  are re-trialed.
- **Inherited, unowned:** turtle / mercy-seeker collapsed at early under the
  new loadout (foot-stealer turtle 0.75→0.07, mercy-seeker 1.00→0.37);
  dot-weaver mid exploded upward (Press Fate × dot drafting). See D below.
- **Structural mid-0.00 club at HEAD (blind median):** foundry, standstill,
  augury, grace (bastion 0.03). Seat-immune — proven by this run's swaps
  moving none of them off 0.00. Engine-constant / preset-shape work, NOT
  card numbers (doctrine: never compensate with a card).

## B. Scoreboard (31 arms)

**8 promote-candidates** (evidence order): the-burden-of-repetition
(refrain — strongest result of the run: mid +0.16, sE +0.07, retires the
self-flagellant borrow), poisoned-well (erosion — mid 0.370→0.503, lands ON
the ~0.50 target), grace-under-fire (grace — early 0.689→0.811, on band),
tempered-edge (foundry — early 0.60→0.80 on band, sE 0→0.21),
quod-erat-demonstrandum (oratory — late 0.12→0.28, INTO band, but see C2),
videtur-quod (oratory), pebble-in-the-boot (bastion — mid 0.07→0.13),
the-anvil-speaks (bastion, mild).

**14 keep-incumbent**, incl. four **dead-as-seated** pool cards → redesign
candidates, their preconditions too narrow for any legal seat:
recapitulatio (669 fizzles/run-set at mid), beggars-bandage (deck-death,
0.000 share), widows-portion (~3,000 fizzles/stage), the-cold-gallery
(0.000 share). **9 needs-more-data.**

**Spam watchlist:** every spam-HIGH card actually seated this run measured
CLEAN against the 0.70 dominance bar (all-wounds-at-once peak share 0.31;
QED 0.006 — its power is all CONCEDE-path). the-point-lands' spam hypothesis
was REFUTED outright (share 0.028, and the deck collapses without
opening-statement's seeding). Unmeasured spam-HIGH flags STAND: akrasia's
four, control's six, charm's two, harvest's finisher-outs.

**Keyword atlas:** PROLONG row now carries the chronic-condition
single-variable receipt (exercised, fizzle-free, priced neutral — not
differentiating at that seat). REARGUE remains unmeasured.

## C. Owner-call ballot queue — RESOLVED via /oversight 2026-07-20

**All four drained (owner walk-through, /oversight 2026-07-20):**

1. **Pool→library promotion gate → FORMALIZE A STANDING PATH.** Owner
   ratified a repeatable promotion path (measured A/B ≥2 stages ×2 policies
   at identical seeds → owner ballot → recolor-not-repartition →
   combined-matrix re-verify → pins updated in the same PR — the §E precedent
   from the promotions-residue is now the standing template). `/deck-tuning`
   may propose promotions against this path without re-asking the policy.
   Standing ruling R1 (pool cards are tuning devices) is SUPERSEDED for the
   promotion question: promotion is now an allowed, gated outcome rather than
   refused-by-default. Per-card riders (poisoned-well re-seat + flag-on A/B;
   burden-of-repetition / half-spoken-prophecy recolors; white-flag-woven
   disenchant-slot) remain mechanics work, ride the next `/deck-tuning` pass.
2. **QED concede-centrality → NEEDS REPAIR (not the intended fantasy).**
   71% concede-share of late wins is too dominant. confirmatio STAYS benched;
   route a `/deck-tuning` follow-up to broaden late oratory win-paths before
   any QED ratification. Do NOT ship the concede-dominant repair as final.
3. **Grace HP-purity direction → g1 (grace stays HP-PURE).** Ratify
   white-flag-woven: grace never touches HP, wins by pure capitulation. g3
   (mark pair) is REJECTED for shipping despite its engagement lift — the
   HP kill line is off-doctrine. Rider: white-flag-woven still needs a
   disenchant recipe-slot ruling (mechanics, `/deck-tuning`).
4. **Policy-roster health → REGRESSION, investigate.** turtle/mercy-seeker
   early collapse under the Press Fate loadout is flagged as a roster
   regression, not accepted-by-design; route a follow-up to check whether the
   loadout unfairly starves defensive policies (inherited from PR #125).

**Original ballot text (for context):**

1. **Pool→library promotion gate (blocks all 8 candidates).** Standing
   ruling R1 (2026-07-18): pool cards are tuning devices, NOT player-facing.
   Ratify or refuse a promotion path (library insertion + recipe seat).
   Per-card riders if ratified: poisoned-well needs the
   `PRESET_DICE_VALVES.erosion.replacesId` re-seat + flag-on A/B;
   burden-of-repetition and half-spoken-prophecy need recolors/re-partitions
   (color-law fallout — standing owner call); white-flag-woven breaks the
   disenchant recipe slot.
2. **QED concede-centrality (oratory).** The single biggest curve repair
   measured (late into band) makes CONCEDE 71% of late wins. Is a
   concede-dominant late oratory the intended fantasy? (Atlas's own
   instruction: confirmatio stays benched until this is answered.)
3. **Grace HP-purity direction.** g1 (white-flag-woven: remove the last HP
   drip — wins MORE by pure capitulation) vs g3 (mark pair: largest
   statusEngagement gain of the entire run, 0→0.185, but win-negative and
   opens an HP kill line). Opposite answers to "should grace touch HP at
   all" — pick a direction before either ships.
4. **Policy-roster health.** turtle/mercy-seeker early collapse under the
   Press Fate loadout — intended consequence or roster regression?

## D. Handoffs + follow-up arms (no owner input needed, just work)

**Unblocked by the /oversight 2026-07-20 ballot drain (§C) — `/deck-tuning`:**

- **QED late-oratory win-path broadening.** Owner ruled 71% concede-share is
  NOT the intended fantasy; confirmatio stays benched until fixed. Probe
  repairs that keep the curve gain WITHOUT letting CONCEDE dominate late
  (target: no single late win-path >~50%). Do not ship the concede-dominant
  QED repair as final.
- **turtle / mercy-seeker loadout-starvation investigation.** Owner ruled the
  early collapse a regression, not by-design. Check whether the Press Fate
  default-worn loadout (PR #125) unfairly starves the defensive policies;
  distinguish loadout-starvation from genuine policy weakness.
- **white-flag-woven disenchant recipe-slot ruling (mechanics rider).** g1 is
  ratified (grace stays HP-pure), but white-flag-woven still breaks the
  disenchant recipe slot — resolve the slot before it ships to a preset.

- **Engine handoff (manual tuning, per doctrine):** foundry pip-cash-out vs
  boss HP; standstill rung-denial scaling (fallen-grace is 0.665 of its mid
  contribution — the borrow IS the deck); augury + grace mid floors.
- **r1 follow-up arm before any refrain ratification:** burden-of-repetition
  + a winnowing downtune probe (winnowing dom share rises to 0.90+ behind
  burden; 40/40 mid cells dominant).
- **Akrasia pool re-objective** (post-inversion, see A) before re-trialing
  count-the-cost / absolution-on-account.
- **Harvest defensive-swap retry** at a seat that is not the rapport
  softener (disarming-smile wins tempo at 0.000 share; widows-portion was
  the wrong displacement test).
- **Atlas seat-grid gap:** ash-litany has no rarity-legal foundry seat
  (foundry runs no mind commons) — fix the pool card or record the seat
  grid as authoritative.
- **Pool redesign pass** for the four dead-as-seated cards (B) — precondition
  width, not pricing, is the failure mode.

## E. Method precedents worth keeping

- `preset:all` control + per-arm `+swap:` treatments at identical seeds is
  cheap and clean; 60 runs/cell discriminated every verdict above.
- Win-path decomposition (concede/capitulate/HP counts) caught what win
  rate hid (QED, g3) — keep it in every swap sweep.
- Zero-share incumbents are usually the statusEngagement blind-spot family
  (guard/rapport/SWAY/buff) — judge those seats by win delta only.
