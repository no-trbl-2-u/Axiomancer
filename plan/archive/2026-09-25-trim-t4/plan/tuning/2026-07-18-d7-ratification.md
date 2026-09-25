# Phase D7 — Tuning, economy ratification + honest re-baseline (spec 33 finale)

> Dated tuning report. Ratifies (or holds) spec 33's economy against the
> **flag-on** win-curve + status witnesses, re-baselines statusEngagement with
> its blind spots stated, and delivers the flag-flip recommendation. The D-batch
> closes here.
>
> **Headline:** the flag-on Upgradeable-Dice model is **NOT ready to flip.** It
> sits below the doctrine win-curve at every stage AND below the flag-off model
> it would replace, and it *depresses* statusEngagement ~9 points — a direct hit
> on the load-bearing "status is the main fun" doctrine. Economy ratification is
> consequently **blocked**: you cannot ratify an economy whose curve fails and
> whose only ◆ sink (Press Fate) never fires. This is the honest D7 output —
> "flag not ready, here's the gap" — not a doctored pass.
>
> **Stamp:** 2026-07-18 · flag-on capability added to `/combat-playtest`
> (`--upgradeable-dice`) · win matrix: 10 starter presets × 4 stages × {blind
> runs=12 seed=1; greedy runs=20 seed=1}, full enemy rosters · economy witness:
> `simulateUpgradeableEconomy`, 10 presets × {early,mid,late} × seeds 1–8 (240
> encounters, 1 314 rounds) · dice-math witness N = 200 000. Flag-off arm on the
> same cells for the side-by-side. Not committed; flag default UNCHANGED;
> owner-locked numbers untouched.

---

## 1. The flag-on win curve vs the bands

Bands (CLAUDE.md doctrine, blind policy-pick): **early ~80 / mid ~50 / late
25–35 / impossible 0.** Win % per preset per stage, **full enemy rosters** (the
same rosters the flag-off baseline is measured on — restricting to 2 easy
enemies inflates early to ~89% and hides the regression).

### blind policy (runs=12, seed=1)

| preset | early | mid | late | imp | | early se | mid se | late se |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| erosion | 76 | 15 | 0 | 0 | | 20 | 21 | 20 |
| oratory | 85 | 60 | 10 | 17 | | 14 | 15 | 13 |
| foundry | 53 | 0 | 0 | 0 | | 0 | 0 | 0 |
| penitent | 42 | 0 | 0 | 0 | | 20 | 19 | 20 |
| standstill | 46 | 0 | 0 | 0 | | 18 | 17 | 18 |
| augury | 19 | 0 | 0 | 0 | | 15 | 14 | 14 |
| tithe | 69 | 0 | 0 | 0 | | 20 | 21 | 20 |
| grace | 71 | 2 | 0 | 0 | | 0 | 0 | 0 |
| bastion | 76 | 2 | 0 | 0 | | 27 | 31 | 29 |
| refrain | 74 | 18 | 1 | 0 | | 19 | 21 | 19 |
| **MEAN** | **61** | **10** | **1** | **2** | | **15** | **16** | **15** |

### Stage means — flag-ON vs flag-OFF (same cells, side-by-side)

| stage | band | **win on** | win off | Δ | **statusEng on** | statusEng off | Δ | rounds on | rounds off |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| early | ~80 | **61 / 66** | 79 | **−14 to −18** | **15 / 17** | 26 / 27 | **−9 to −11** | 4.1–4.3 | 3.5 |
| mid | ~50 | **10 / 12** | 18 / 19 | −7 to −9 | 16 / 17 | 26 | −8 to −10 | 5.1 | 4.9 |
| late | 25–35 | **1** | 2 / 3 | −1 | 15 / 17 | 25 | −8 to −10 | 4.3 | 4.2 |
| impossible | 0 | **1 / 2** | 5 | −3 | 16 / 18 | 26 | −8 to −9 | 8.0 | 8.6 |

(two numbers = blind / greedy; both policies agree on direction and magnitude.)

### Reading

**Every non-trivial band MISSES, and flag-on is strictly worse than flag-off.**

- **early: MISS.** ~61–66 vs band ~80; flag-off holds ~79. The dice model
  strips **~15 points** off the one stage the starter presets are designed to
  carry. Only oratory (85) reaches band; the rest fall short, three badly
  (augury 19, penitent 42, standstill 46).
- **mid: MISS** flag-on (~10–12) — but flag-off also misses (~18). Mid is a
  **pre-existing collapse** (memory: 2026-07-12 honest re-baseline confirmed
  it), *made worse* by the flag, not caused by it. Only oratory carries mid.
- **late / impossible: MISS-by-collapse both flags** (~1 vs band 25–35). This
  is the documented all-preset late collapse under the progression model (a
  raw starter losing a late boss is *correct*; the 25–35 band assumes a matured
  deck the matrix doesn't build). The dice flag neither helps nor is the cause.
- **impossible ~0** is the one band flag-on (nearly) hits — the-incompleteness
  is meant to be unwinnable. Fine.

The mid/late curve misses are the **pre-existing collapse** and are NOT a D7
regression. The **early regression (−15) and the statusEngagement regression
(−9 everywhere) ARE the flag's own damage** and are the reason it's not ready.

---

## 2. Why the flag underperforms (root cause, from the economy witness)

`simulateUpgradeableEconomy` (10 presets × {early,mid,late} × seeds 1–8):

| Metric | Band | Realized (flag-on) | Verdict |
| --- | --- | --- | --- |
| E[usable dice/round] (dice-math, N=200k) | 1.83 ± 0.05 | **1.833** | PASS |
| whiff rate (dice-math) | 8.3% ± 1% | **8.3%** | PASS |
| per-color access (dice-math) | ≥ 65% | 66.6 / 66.7 / 66.7% | PASS |
| ◆ income/round (realized) | 1.2–1.6 | **1.483** (8 seeds) | PASS |
| — specials / yield / overflow | — | 1.120 / 0.327 / 0.036 | — |
| special spend-rate | — | **97.0%** | — |
| **Press Fate casts/round** | — | **0.000** | **F3 UNRESOLVED** |
| dead rounds (0◆, FREE-only) | no band | 7.2% | measured |
| surge / momentum-break per round | measure | 0.205 / 0.430 | breaks 2× surges |
| STAKE gap: flag-on vs flag-off rounds | measure | **5.48 vs 4.83 (+13.6%)** | **WIDENED** |

The face tables and the ◆ income are **correct** — the economy is not starved
on paper. The failure is structural, and it is the same three findings D3
flagged, now confirmed as the blockers:

1. **F3 — the only ◆ sink never fires.** Press Fate (1◆, the leaner economy's
   designed recurring sink) is granted only by equipment the 10 starter
   loadouts don't carry, so it is cast **0.000 times/round**. Whiff rounds are
   carried entirely by FREE lines; the "1◆ reroll escapes a punished stance"
   promise the design leans on **does not exist in the measured configuration.**
   Discretionary ◆ therefore just accumulates unspent — a leaner *income* with
   *no active sink* is the worst of both: players can't convert dice into
   tempo, so fights run long and win rate sags.
2. **F4 / STAKE gap — WIDENED, not closed.** Flag-on fights now run **+13.6%**
   longer than flag-off (was +5% at D3). D6e's yield authoring *added income*
   (0.327◆/round) without adding a *sink*, so the escalation-clock + ◆-sink hole
   STAKE left is still open. See §4.
3. **Momentum is fragile.** Breaks (0.430/round) outnumber surges (0.205/round)
   **~2:1** — the chain collapses more than twice as often as it completes.
   Realized per-color access falls to 53–61% in play (vs 66% dice-math, the F1
   skew), so the momentum-steer policy frequently *can't* hit the successor
   color and breaks to null. Steering exists but rarely pays off.

---

## 3. Economy ratification (§5) — BLOCKED; ratify only what the data supports

The mandate: adopt-or-adjust D3's derived signature/ante table + the blacksmith
placeholder pricing **where the flag-on data supports.** The flag-on data does
**not** support a passing curve or an active sink, so the derived sink table
cannot be honestly ratified — ratifying a leaner sink table against a model
that already can't spend its ◆ (F3) and already misses the curve would harden
the wrong numbers. Ratify only the gates that measurably pass; hold the rest.

| Constant | Today | D3 derived | **D7 verdict** | Arithmetic / reason |
| --- | --- | --- | --- | --- |
| Press Fate | **1◆** | 1◆ | **HOLD (owner-locked)** — but INACTIVE | 0.000 casts/round (F3); the sink exists in code, never reaches the player |
| Special payload | **2◆** | 2◆ | **HOLD (owner-locked)** | spend-rate 97% → realized special income (1.120) ≈ gross (1.155); use-trigger costs only ~3% |
| `sig-read-opponent` | **1◆** | 1◆ | **ADOPTED (already live)** | the one D3-derived value that shipped (at D4, reinterpreted); nothing indicts it |
| Sig utility/scout tier | 4◆ | 2◆ | **NOT RATIFIED — hold** | direction validated (income rose 0.3–0.6 → 1.48 gross → halving is right-signed), but applying it needs *flag-gated* signature costs; only Press Fate has that machinery (`combat.engine.ts:4455`, `v2Reroll ? PRESS_FATE_COST : skill.cost`). Halving the shared cost would break the live flag-off tuning. Blocked on machinery + a passing curve. |
| Sig control/dot tier | 6◆ | 3◆ | **NOT RATIFIED — hold** | same |
| Sig finisher tier | 8◆ | 4◆ | **NOT RATIFIED — hold** | same |
| Blacksmith hone/temper/swap | 2/3/4 **placeholder** | 2/3/4 | **HELD placeholder** | the anvil spends a *between-combat* budget (souls/scrap) the combat matrix never witnesses; and the whole flag-on model is slated for rework. "Die here" can't happen honestly at D7 — hardening prices the D7 witness can't see is fake ratification. The **tier ordering** (hone < temper < swap) is sound; the **unit + magnitude** await a between-combat economy tuning pass. |
| ante / scrap | current | hold | **HOLD** | re-examine post-flag, per D3 |

**Ratified (promoted to hard sim tests):** the dice-math gates (usable 1.833,
whiff 8.3%, per-color ≥65%, gross special 1.336◆) and the realized ◆-income
envelope. These are the numbers the data actually supports. See §7.

**Owner-locked, untouched:** Press Fate 1◆, special payload 2◆, the face tables.
None indicted by the data (payload 2◆ is *confirmed* well-set — 97% spend-rate
means use-trigger barely differs from roll-trigger). No `[needs-user-call]`
raised against an owner-locked number.

---

## 4. The STAKE-retirement gap — final word

**Unresolved, and widening.** STAKE was retired whole (owner-lock, D1): its
2/4/6◆ wager (a ◆ sink) and its escalation-tick-on-loss (an escalation-clock
pressure source) are both gone. Press Fate (1◆) was the designated replacement
sink. But Press Fate is inactive (F3), so flag-on has **no active ◆ sink at
all**, and the escalation clock lost its loss-tick with nothing replacing it.

Consequence, measured: flag-on encounters run **5.48 rounds vs flag-off 4.83
(+13.6%)** — and the gap has *grown* since D3 (+5%), because D6e's yield
authoring added income (more ◆ banked, still nowhere to spend it) without adding
pressure. The STAKE gap is a **hard prerequisite for the flag flip**: until a ◆
sink actually fires each round, the leaner economy just lengthens fights. The
fix is F3's — get the reroll affordance onto starter loadouts (a signature grant
or a promoted dice-valve reroll card). Then re-measure the gap.

---

## 5. statusEngagement re-baseline — with blind spots stated

**Flag-on statusEngagement is ~15–18% at every stage; flag-off is ~25–27%. The
dice model costs ~9 points of status engagement across the board.** Because
status effects are the load-bearing "main fun," a uniform ~9-point drop is a
**doctrine-level regression**, independent of win rate: the four-die model
makes status play *less* central (fewer paid status plays/round — whiffs are
more frequent in play, dice are spent steering momentum rather than maximizing
status, and there is no Press Fate recovery to re-arm a dead round).

**The metric's blind spots (per the standing memory — MUST be stated, and they
matter here):**

1. **Enemy-side-only.** statusEngagement counts only status applied *to the
   enemy*. Mercy / capitulate / sway / heal / guard play scores **zero** — which
   is why **foundry and grace read 0% on both flags** despite being fully
   functional alt-win decks. The ~9-point drop is therefore measured on the
   subset of decks the metric can even see; for the alt-win decks it's blind.
2. **Volume-based.** It counts application *events*, not whether the status
   changed the outcome. A flurry of low-intensity marks outscores one
   fight-ending rupture.
3. **Arc-blind.** It's a flat per-round rate, blind to *when* status lands —
   opening chip vs closing burst read identically.

Net: the ~9-point drop is a **real signal in the metric's honest direction**
(the dice model is less status-central), but its magnitude is soft and its
alt-win coverage is nil. Treat it as directional corroboration of the win-curve
finding, not a precise figure.

**Re-baseline stamp:** the flag-off `deck-matrix-baseline.json` (commit
31f62c1e, 2026-07-18, reduced-nightly) reproduces on these cells (early win 80,
statusEng 36 pooled-all-policy). I did **not** run `baseline:regen` — the
checked-in baseline is the flag-OFF truth and the flag is not flipping, so the
live baseline is unchanged and correct. The flag-on numbers above are the D7
witness, reported here; they do not belong in the flag-off baseline surface
until/unless the flag flips.

---

## 6. Flag-flip recommendation — DO NOT FLIP `[needs-user-call]`

**Recommendation: do NOT flip the Upgradeable-Dice flag to on-by-default.**
Evidence:

1. **Early-band regression −15** (61–66 vs flag-off 79, band ~80) — the flag
   makes the presets' design-window stage *worse*.
2. **statusEngagement regression −9 at every stage** — a direct hit on the
   load-bearing doctrine.
3. **No active ◆ sink (F3)** — Press Fate never fires; the leaner economy has
   nothing to spend on, so fights lengthen (+13.6%, §4) instead of tightening.
4. **Momentum breaks 2:1 over surges** — the marquee steer-into-surge loop
   rarely completes at realized color-access.

None of these is fatal to the *design* — they are all downstream of F3 (the
reroll/sink affordance never reaching starter loadouts) and the un-promoted
dice-valve cards. **The flag becomes re-testable once F3 lands** (a starter
Press Fate grant or a promoted dice-valve reroll) and the dice-valves are in the
presets. Re-run this exact matrix then. Until then: flag stays OFF.

This flip is an **owner call** — I recommend against, with the evidence above.

---

## 7. `[needs-user-call]` — the full list

1. **Flag default flip → recommend NO** (§6). Owner call.
2. **F3 — the reroll affordance / ◆ sink must reach starter loadouts.** This is
   the single gating fix: grant `sig-press-the-point` on the starter loadout, or
   promote a dice-valve reroll card into the preset recipe. Owner picks the
   mechanism. Without it, the flag-on economy is un-sinkable and the flag can't
   flip. (Blocks §3 signature ratification too.)
3. **Signature-cost halving needs flag-gated cost machinery.** D3's 2/3/4 table
   is directionally right but can't be applied: signature costs are shared
   flag-on/off, and only Press Fate is flag-repriced today. Building per-signature
   flag-gated costs is engine work beyond D7's "numeric-only" scope. Owner/eng
   call on whether to build it (prerequisite for ratifying the sink table).
4. **PROVISIONAL `SPECIAL_FIRES_ON_USE` — recommend KEEP (fires-on-use).**
   Measured spend-rate is **97.0%**, so realized special income (1.120◆/round)
   is within ~3% of what fires-on-roll would pay (1.155◆/round gross in-play).
   The economic difference is negligible, and use-trigger rewards deliberate
   play (spend the die, get the ◆) and keeps a banked Reserve special meaningful.
   No reason to flip to fires-on-roll. Owner confirms.
5. **Blacksmith prices held placeholder** (§3) — ratifying awaits a between-combat
   (souls) economy pass, not witnessed by the combat matrix. Owner call on
   whether to open that pass now or after the flag flip.
6. **Dice-valve promotion into the 5/5/5 preset recipe** — deferred to D8
   (§8); owner call resolved 2026-07-18: replace exactly one same-aspect card
   instance per preset, never append.

---

## 8. Dice-valve promotion — DEFERRED (noted remaining D7 work, not half-done)

The 9 per-theme dice-interaction cards + Master's Stamp (`dice-valves-33` in
`cards.sandbox-sets.ts`) are **not promoted.** This is a deliberate hold, not an
omission, for three converging reasons:

1. **Their purpose is flag-ON (spec 33 §4 valve 3), and the flag isn't ready.**
   Promoting flag-on-thematic cards into the *live flag-off* library adds 10
   cards about a dice model that isn't live — clearly premature.
2. **Their gate can't be validated.** The set's own promotion gate is "each
   valve reaches the reroll/convert affordance D3-F3 flagged as absent." F3 is
   *still* absent (Press Fate 0.000), so the gate the promotion must clear is
   itself unmet — promoting now would be promoting past a red gate.
3. **Slotting into the 5/5/5 recipe was a `[needs-user-call]`; resolved
   2026-07-18.** Each flag-on preset replaces exactly one same-aspect card
   instance with a singleton valve. Decks remain 15 cards and 5/5/5;
   flag-off remains byte-identical; the curated library remains 70 through a
   ten-in/ten-out ledger. The bare-minimum fallback is FREE reroll one chosen
   eligible die / PAID reroll all eligible dice, including the powering die.

**Sequencing:** Phase D8 promotes the dice-valves, lands the reroll fallback if
any thematic valve fails its court, and re-tests the flag. Until D8 ships they
stay sandbox-staged and correct. Evidence they're ready: they compile, price
cleanly (each carries scoreCard arithmetic), and register in the sandbox set.
Brief: `plan/phases/phase_D8_preset_dice_valves.md`.

---

## 9. Qualitative (from the sim data; full playtester pass is a follow-up)

- **Momentum steering:** fragile — breaks outnumber surges ~2:1; realized
  color-access (53–61%) undershoots the dice-math 66%, so the successor color
  often isn't on the table and the chain snaps to null. The steer *lever* works;
  the dice don't cooperate often enough for it to feel rewarding.
- **Whiff feel:** realized whiff 12.8% in play (F1 skew above the 8.3% design),
  dead rounds 7.2%. With Press Fate inactive, a whiff is carried only by FREE
  lines — survivable (you never lose a turn outright) but the promised **1◆
  reroll escape never appears**, so a punished-stance whiff feels worse than the
  design intends.
- **Stance-check readability / yields:** *this part works.* D6e's open
  telegraphs pay yield income 0.327◆/round (~⅓ of phases end in the yielding
  stance by natural distribution). The steer-into-yield loop is legible and
  live — the one bright spot.
- **Blacksmith fantasy (visible miss-deletion):** not exercised by the sim (the
  anvil is a between-combat surface); flag-off, un-promoted valves. Needs the
  Playwright playtester pass once F3 + valves land — deferred, not blocking.

A full `playtester`-agent pass on seeded flag-on encounters is the natural D7
follow-up but was not blocked on for this report (the sim data already carries
the verdict).

---

## 10. Follow-ups (residue → PHASE_CANDIDATES / AUDIT)

- **The flag is F3-gated.** File a phase candidate: "Starter Press-Fate
  affordance + dice-valve promotion + flag re-test" — land the reroll sink on
  starter loadouts, promote `dice-valves-33`, re-run this matrix, then the flag
  becomes flippable. This is THE unblocker for the whole spec-33 finale.
- Signature flag-gated cost machinery (§3 / needs-call 3) — engine backlog,
  prerequisite for ratifying the sink table.
- Between-combat (souls) economy pass to de-placeholder blacksmith prices (§3).
- The pre-existing mid/late curve collapse is a `/deck-tuning` + progression
  concern independent of spec 33 (already tracked); noted here only to separate
  it from the flag's own regression.
- A higher-quality PRNG (D3 F1) would let the realized reading converge to the
  dice-math faster — engine backlog, touches every seeded suite.

---

## Appendix — reproduce

```
# flag-on win matrix (per preset, full rosters)
npm run combat-playtest -- --stage=all --policy=blind --deck=preset:oratory --upgradeable-dice --runs=12 --seed=1
# economy witness (flag-on, toggled internally)
npm run combat-dice-economy -- --seeds=1,2,3,4,5,6,7,8
# ratified gates as hard tests
npm test -- combat-dice-economy
```

---

## Addendum — /oversight resolutions (2026-07-18, same day)

The §7 `[needs-user-call]` list was drained at the evening oversight
session. For the sweep: every §6/§7 item above is now DECIDED — this
report stays as the evidence record; the decisions live in the plan
files.

1. **Flag flip → FLIP NOW (owner override of §6's recommendation).**
   The owner accepts the measured regressions as transitional until the
   sink lands. Queued as build-plan **Phase D-FLIP**, first in queue.
2. **F3 sink mechanism → D8's per-preset dice valves only.** No starter
   Press Fate grant now; revisit only if the post-D8 re-test shows the
   valves under-sink.
3. **Signature flag-gated cost machinery → deferred.** Not built now;
   the 2/3/4 table stays unratified until it exists.
4. **`SPECIAL_FIRES_ON_USE` → KEEP, ratified** (drop PROVISIONAL —
   AUDIT row routes the marker cleanup to /iterate).
5. **Blacksmith prices → stay placeholder,** and bigger: the blacksmith
   was ruled the WRONG surface for dice upgrades. The D5 economy is
   kept; the affordance re-homes via a design thread
   (PHASE_CANDIDATES: "Re-home dice upgrades off the blacksmith");
   the first-map node gates back to dev-only.
6. **Dice-valve promotion** — already resolved earlier the same day
   (D8, replace-one-per-preset); unchanged.
