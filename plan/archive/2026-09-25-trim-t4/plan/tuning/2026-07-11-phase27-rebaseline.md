# Phase 27 — the honest baseline (2026-07-11)

> Cross-note (merge reconciliation): a second, independent Phase 27
> re-baseline was cut the same day against the local session's tree (Turn Law
> 6ea123fc + the 11-workstream card sweep, tip 70c64501) — see
> `axiomancer-mechanics/docs/reports/rebaseline-scratch/rederivations.md`.
> That one measured the engine semantics that survived the merge and stamps
> the checked-in `deck-matrix-baseline.json`; this report measured cloud main
> (post f849c5a2) and its absolute numbers carry that asterisk.

> **Status: every pre-2026-07-10 plan/tuning win-rate/engagement number is
> now superseded by this report.** Re-run post Phase 26 (the Turn Law:
> `startTurn` refuses a second dice tray within one threat phase;
> attribution overkill clamped to actual enemy HP). See
> `2026-07-10-turn-law-and-honest-baseline.md` §3 for the mandate this
> satisfies. All numbers below: `axiomancer-mechanics@0.38.0`
> (post commit f849c5a2), deterministic seed-1 sims.
>
> Commands used (full list in `plan/phases/phase_27_rebaseline.md`):
> - `npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards --json`
> - `npx vitest run src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts --reporter=verbose`
> - `npm run combat -- --auto --policy status --stage early --seed 3 --max-turns 14 --json-events`
> - `npm run combat -- --auto --policy status --stage mid --seed 5 --max-turns 14 --json-events`
>
> Metric definitions unchanged from the farmed baseline
> (`2026-07-10-audit-evidence/baseline.md`): `statusEng` = status-applying
> plays / total plays; `dotFrac` = enemy HP lost to DoT / total enemy HP
> lost; `dom` = dominant card's HP-damage share; win = victory + mercy.

## 1. Stage summaries — the headline number

144 cells (18 enemies × 8 sim policies), 60 runs/cell, 8,640 total fights,
`policy-pick` decks (each policy drafts its own preferred deck from the
stage pool):

| stage | win | **doctrine target** | statusEng | dotFrac | rounds | dom card |
|---|---|---|---|---|---|---|
| early | **75%** | ~80% | 28% | 81% | 3.8 | refrain 57% |
| mid | **3%** | ~50% | 17% | 69% | 4.4 | cassandras-burden 93% |
| late | **0%** | 25–35% | 12% | 53% | 3.6 | slippery-slope 68% |
| impossible | **0%** | 0% | 13% | 55% | 5.2 | slippery-slope 55% |

Win-path totals: early vic=2097 mer=0 cap=56 con=0 def=727; mid vic=75
mer=0 cap=4 con=0 def=2321; late vic=0 mer=0 cap=0 con=0 def=2880;
impossible vic=0 mer=0 cap=0 con=0 def=480. **Mercy=0, concede=0
everywhere** — unchanged from the farmed baseline; the two merciful
alt-wins are still never reached by any sim policy at any stage.

**Reading.** Early lands close to doctrine (75% vs ~80%, honest — no
farm needed to get there). Mid and late do not decay gracefully toward
their targets, they **collapse past them**: mid was previously read at
94% (farm-inflated) and is honestly 3%; late was previously read at 3%
and is honestly 0% — flat zero across all 6 late enemies × 8 policies
(288 cells, 0 wins). Impossible correctly reads 0%, matching its design
intent, but for the wrong reason now: it's 0% for the same structural
reason late is 0%, not because it's specifically tuned to be
unbeatable-but-close.

This is the loudest finding in the audit's own words
(`2026-07-10-turn-law-and-honest-baseline.md` §3): *"the current
99/94/3/17 reading is farm-inflated at early/mid and possibly
farm-DISTORTED at late."* Confirmed: it was not just inflated, the
farm was the entire mechanism keeping mid/late winnable at all with a
starter `policy-pick` deck. Without it, the deck-progression doctrine
(`CLAUDE.md`: starter presets are early/mid decks, the player trades up
before late) has **no working mid stage to trade up through** — a
player using a starter-tier deck at mid loses ~97% of the time to
every policy including the strongest available heuristics.

## 2. Greedy-vs-blind gap — hidden information is still worth zero

| stage | greedy | blind | gap |
|---|---|---|---|
| early | 79% | 79% | 0pp |
| mid | 2% | 2% | 0pp |
| late | 0% | 0% | 0pp |
| impossible | 0% | 0% | 0pp |

Identical to the farmed-baseline finding: greedy (peeks the enemy's
hidden stance) performs identically to blind (cannot) at every stage.
The Turn Law changed *how much* winning happens, not *whether reading
the enemy matters* — it still doesn't. This finding **survives the law
unchanged** and is not a farm artifact; it's a standing design gap for
Phase 33 (Enemy Answers / counterplay) to close.

Notable secondary read: **control-lock is now the strongest mid-stage
policy** (18% avg vs 0–2% for greedy/blind/chaos/aggro-brute/turtle,
`tri-eyes 32% / mirac 12% / hasshaku-sama 20% / jeweled-tree 27% /
rawhead-rex 0%`), a reversal from the farmed baseline where chaos led at
100%. Under honest income, stall/control play is the (still weak) local
optimum — farmed Conviction previously masked this by making
naive aggressive lines free to spam.

## 3. Curve-shape / per-preset floors — `KNOWN_CURVE_VIOLATORS` confirmed empty

The pinned suite (`combat-playtest.balance-bands.sim.test.ts`) — greedy
policy, all 10 starter presets, early/mid/late, 30 runs/cell — passed
all 14 assertions. Per-preset spread (early/mid/late):

| preset | early | mid | late |
|---|---|---|---|
| erosion | 1.00 | 0.37 | 0.00 |
| oratory | 0.95 | 0.00 | 0.00 |
| foundry | 0.98 | 0.00 | 0.00 |
| penitent | 1.00 | 0.05 | 0.00 |
| standstill | 1.00 | 0.35 | 0.02 |
| augury | 0.95 | 0.00 | 0.00 |
| tithe | 1.00 | 0.07 | 0.00 |
| grace | 1.00 | 0.02 | 0.00 |
| bastion | 0.95 | 0.00 | 0.00 |
| refrain | 1.00 | 0.00 | 0.00 |

Every preset's curve is `pass` (monotone non-increasing with real decay)
— **`KNOWN_CURVE_VIOLATORS` stays the empty list**, confirming the test
file's own 2026-07-11 prediction. No code change needed there.

**But read this result carefully — it is a *pass for the wrong reason*.**
The curve-shape test only grades *shape* (monotone decay + a minimum
total move), and the per-stage floor at mid is currently `0` (the
"ratchet target" comment already marks 0.25 as the real goal, not yet
enforced). Nine of ten presets hit **literal 0.00 at mid**, and all ten
hit ≤0.02 at late. A preset that free-falls from 1.00 to 0.00 trivially
satisfies "monotone non-increasing with real total move" — the test
can't currently distinguish a *graceful* decay from a *cliff*. `erosion`
and `standstill` are the only two presets that show any life at mid
(0.37, 0.35) and are worth using as the reference shape when Phase 31/32
ratchet the mid floor upward.

## 4. Card coverage

53/70 eligible library cards exercised across the full matrix (**24%
dead-card rate**), down from the farmed baseline's 48–69% (methodology
differs: this run sweeps all 8 policies × 60 runs vs. the farmed
baseline's single-policy 20–30-run slices, so more policy diversity
alone explains part of the improvement — treat this as directionally
better, not a clean apples-to-apples number).

Never played by any policy's `policy-pick` draft: `achilles-and-the-tortoise,
bone-orchard, bootstrap-loop, entropy-tax, heart-of-the-matter,
irresistible-grace, measured-answer, mirror-of-longing, mounting-case,
nettle-cloak, pact-of-akrasia, peroratio-interrupta, soft-word,
stuck-in-their-head, the-gleaners-due, the-oracles-eye, the-tithe`.
(`nettle-cloak` and `mounting-case` *do* appear in the qualitative
transcripts below — they're in the `apprentice` preset deck, just never
preferred by any of the 8 sim policies' own draft heuristics. The
dead-card rate is a `policy-pick`-draft artifact, not proof a card is
unreachable by a human or preset deck.)

## 5. Qualitative transcripts — attribution sanity + signature share

**Early, status policy, seed 3 (Grave Larva, 25 HP):** Victory in **3
phases** (previously: 2 phases under the farm). Total attribution: 33
DoT + 4 direct = 37 against a 25-HP enemy — no overkill (previously: 740
DoT vs. 40 HP, a 18.5x ledger inflation). No signature cast the entire
fight (Conviction never reached the 7◆ threshold in 3 phases). The
`hazardCombat:autoPhase` events (new in Phase 26) show exactly one event
per phase — 3 total, matching the 3-phase victory. The turn-farm
transcript gap from the old baseline is closed.

**Mid, status policy, seed 5 (Tri-Eyes, 375 HP — correctly resolved via
the Phase 26 `--stage` enemy-default fix, previously always defaulted to
the 40-HP Little Belle):** **Defeat** in 6 phases, enemy left at 97/375
HP (74% depleted, not killed). Total attribution: 126 DoT + 71 direct =
197. `sig-conviction-strike` landed once for 40 DoT — **20% of total
damage**, down sharply from the farmed baseline's 90–95%. The signature
monoculture the pre-law audit flagged as the loudest pricing problem is
structurally gone in this sample: honest Conviction income can no longer
buy repeated signature casts inside one fight.

**Caveat — this is a 2-fight spot check, not a matrix-wide signature
share metric.** `combat.playtest.ts`'s per-card usage table only covers
the 70-card themed library; it has no signature-cast counter, so there
is currently no batch tooling to compute "signature damage share" across
all 8,640 matrix fights the way `statusEngagement`/`dotFrac` are
computed. Building that instrumentation (mirroring the existing
per-card table) is a tooling gap worth a follow-up if Phase 31's
repricing work needs more than spot-check confidence.

## 6. Reading — what changed, what didn't, who owns it next

**Confirmed farm artifacts (fixed by Phase 26, no further action):**
- Mid/late win rates were almost entirely propped up by the
  `endTurn`→`startTurn` farm. Honest mid is 3%, not 94%; honest late is
  0%, not 3%.
- Signature (`sig-conviction-strike`) dominance collapsed from 90–95%
  of damage to ~20% in the spot-check transcript — farmed Conviction was
  the direct cause.
- Attribution overkill (740 DoT vs. 40 HP) is gone; ledger totals now
  track actual HP depletion.
- Auto-mode transcripts are now legible per-phase (`hazardCombat:autoPhase`).
- `--stage` now resolves the correct enemy roster instead of always
  Little Belle.

**Findings that survive the law unchanged (real design gaps, not farm
artifacts):**
- The hidden-information layer (greedy vs. blind) is worth exactly 0pp
  at every stage. → **Phase 33** (Enemy Answers / counterplay).
- Mercy=0 and Concede=0 everywhere — the merciful alt-wins are
  structurally unreached by every sim policy. → worth a policy-design
  follow-up (no phase currently owns this explicitly; flagging for
  `/expand` or the next `/oversight` triage).
- `KNOWN_CURVE_VIOLATORS` is confirmed empty, but the "pass" is
  currently indistinguishable from a cliff-shaped collapse (9/10 presets
  hit literal 0% at mid). → **Phase 31/32** should treat the mid floor
  ratchet (0 → 0.25 target, already noted in the test file's own
  comment) as the real signal, not the curve-shape green check alone.

**New, not previously measured:**
- Doctrine violation severity at mid/late is worse than the farmed data
  ever suggested — mid is not "a bit under target," it is a starter deck
  losing 97% of the time with the best available policy. **This is the
  headline number for Phase 31's repricing scope**: the Conviction/
  signature economy repricing (`turn-law-and-honest-baseline.md` §4)
  needs to close a much bigger gap than "the token battery was too
  strong" — right now removing the battery leaves mid/late close to
  unplayable for a starter deck, which is a genuine design risk if
  repricing under-corrects.
- control-lock overtaking greedy/blind/chaos at mid (still only 18%
  avg) suggests the honest game currently rewards stalling over
  aggression at the margin — worth a specific look when Phase 33 designs
  enemy counterplay (a stall-favoring meta with no counterplay to reward
  tempo is its own anti-pattern).

## 7. Every plan/tuning number dated before 2026-07-10 — asterisk resolved

Per `2026-07-10-turn-law-and-honest-baseline.md` §3: those documents'
**structural** findings (flat alt-win thresholds, the hidden-info gap,
the dead-card problem, the curve-shape mechanism) are confirmed to
survive the law and remain valid reading. Their **magnitudes** (win
rates, dominance percentages, dead-card rates measured pre-law) are
superseded by this report. Treat any pre-2026-07-10 number cited in
`2026-07-08-win-path-scaling.md`, `2026-07-10-engagement-overhaul-roadmap.md`,
or the `audit-evidence/` directory as historical context only; cite this
report's numbers for anything going into a tuning decision from Phase 28
onward.
