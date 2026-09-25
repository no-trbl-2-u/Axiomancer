# Win-path scaling — the plan after Battle Lab round 2

> Source evidence: `axiomancer-battle-lab-round2.html` (200 runs/cell,
> main vs `feature/preset-deck-tuning`, merged as PR #41) + the spec 32
> library. Stage averages r2: early 96.8%, mid 53.7%, late 23.8%,
> impossible 0%.
> Owner: card-expert / `/deck-tuning` execute; items marked
> **[owner-call]** need ratification before implementation.
>
> **Target curve — corrected via `/oversight` 2026-07-08.** The prior
> targets (early ~85, mid 75-80, late 65-75, impossible ~1) assumed the
> tested decks would carry the whole game. They don't: Battle Lab round
> 2 tested the starter/preset decks specifically, and per the early-game
> tutorial rethink (`plan/CRITIQUE.md` — preset-deck tutorial jot),
> those are the decks a player starts the labyrinth with, not what they
> fight late/impossible content with. Corrected targets:
> - **early: ~80%** (was ~85 — close, no major change)
> - **mid: ~50%** (was 75-80 — starter decks should start losing their
>   edge here, not still dominate)
> - **late: ~25-35%** (was 65-75 — starter decks are expected to
>   struggle; this is a genuine challenge stage for a deck the player
>   hasn't upgraded)
> - **impossible: 0%** (was ~1 — a hard wall by design, not a rare fluke
>   win)
>
> This changes how to read every stage-average number in this doc:
> late 23.8% and mid 53.7% are now much closer to the corrected targets
> than the original headline framing suggested — re-triage items 1-3
> against the NEW bands before spending further owner-call cycles
> narrowing a gap that was measured against the wrong target.

**The headline finding:** the round-2 audit made the cards honest, and
honesty barely moved the needle. The remaining gaps are structural —
win conditions live on different scaling axes. Alt-win decks (Oratory
100/100/100, Standstill 100/100/100) cost the same against a 100 HP
wolf and a 1,500 HP boss; every HP-path deck hits the same flat-cap
wall at late. Doctrine health is fine (~48% of plays land a status,
DoT carries ~34% of enemy HP loss) — this is a scaling problem, not a
fun problem.

Issues are ordered by leverage. Each carries: problem, fix, files,
evidence plan, autonomy tier, size.

---

## 1. Win paths must scale with the stage curve

**Problem.** PERORATION (8 Premises), STAGGER (rung denial), and SWAY
thresholds are flat while enemy HP grows ~10x from early to late. Result:
Oratory and Standstill are literally unbeaten at every stage (they should
be examined for nerfs, not buffs — round-2 insight #5), while Grace's
CAPITULATE must match a boss's ENTIRE HP bar and lands 0% late.

**Fix (two halves):**

*(a) Stage-scaled thresholds.* Add a per-stage scaling input to the three
alt-win checks:
- CONCEDE: Premises required = 8 + (stage tier bonus), e.g. 8/10/12 for
  early/mid/late — or per-enemy `resolve` on the bestiary entry.
- STAGGER: boss-class enemies telegraph with more rungs and/or regrow 1
  rung/turn (extends the existing P2 threat-downgrade ladder).
- CAPITULATE: replace `SWAY >= current HP` with a Dawncaster
  Charmed-style threshold — capitulate when `SWAY >= resolve`, where
  `resolve` is a per-enemy stat well below max HP that ticks down as HP
  falls. This is the deferred "Charmed-threshold rework" from the
  round-2 report, promoted to a real work item.

*(b) Boss answers, not caps.* Give boss/unique enemies counterplay
authored in the bestiary instead of global limits: a boss that sheds one
Premise per turn, cleanses N SWAY on its action, or regrows rungs.
Prior art: Slay the Spire's Time Eater — degenerate strategies get an
enemy that punishes them, and stay fun everywhere else. Enemy passives
are already per-enemy content (spec 32 §10 enchantment layer) — these
are enemy enchantments, no new engine surface.

**Files:** `src/Cards/types.ts` (threshold fields), `src/Combat/combat.engine.ts`
(CONCEDE/CAPITULATE/STAGGER checks), `src/Combat/combat.stage-profiles.ts`
(tier inputs), bestiary entries in `src/Combat`/NPC content for `resolve`
+ boss passives, spec 32 §9 update.

**Evidence:** A/B the thresholds via sandbox where possible; the alt-win
checks themselves are engine — ship behind the full matrix with the
target "Oratory/Standstill land inside the stage bands (<=100% is not a
band), Grace late > 0%".

**Tier:** engine + spec — **propose-only → [owner-call]**, then card-expert
implements through the wiring checklist. **Size: L** (the biggest item, and
the one that fixes "3 of 10 decks win late" from both directions).

---

## 2. Replace the flat 80-HP burst cap with a stage-scaling formula

**Problem.** The shared 80-HP RUPTURE/REAP cap is the direct bottleneck
named by Erosion, Foundry, Penitent, and Tithe against 1,000-1,500 HP
late pools. The Tithe exception (`REAP_ALL_BURST_CAP` 200) proves the
model is wrong: we are patching per-theme exceptions onto a cap that
cannot scale.

**Fix.** One formula, no per-theme exceptions:
`burstCap = max(FLAT_FLOOR, CAP_FRACTION * enemyMaxHp)` with
`FLAT_FLOOR = 80` (early behavior unchanged) and `CAP_FRACTION` tuned
around 0.15-0.25 via A/B. Retire the Tithe special case into the same
formula. Payoff bursts then stay meaningful at every HP scale while
remaining sub-lethal (no one-shot deletions).

**Files:** `src/Combat/combat.engine.ts` (cap constants + RUPTURE/REAP
resolution), `src/Cards/cards.pricing.ts` if payoff verb points shift,
`// pts:` comments on affected cards.

**Evidence:** sandbox-override A/B is not possible for an engine constant —
run the full matrix at CAP_FRACTION ∈ {0.10, 0.15, 0.20, 0.25} and pick
the value that lifts Erosion/Penitent/Tithe late off 0% without pushing
any single card past the 70% win-impact anti-spam line.

**Tier:** engine constant — hand-tuned per doctrine, but the sweep is
mechanical: **[owner-call] on the formula shape, then a supervised
constant-tuning session** (not `/deck-tuning`). **Size: S-M.**

---

## 3. Persistence-by-stack DoTs (the persistent-curse re-home)

**Problem.** Durationed DoTs are balanced for ~5-round skirmishes and
mathematically irrelevant in ~11-round boss grinds — they decay before
they erode. Round-2 insight #7 already names the fix; this promotes it.

**Fix.** Re-home the themed afflictions on the Dawncaster model:
persist by STACKS, never by round timer. POISON keeps its ramp but
loses its lifetime; BLEED already decays per trigger (keep); MARK
becomes battle-long. Where a payoff needs a bounded window, bound the
PAYOFF, not the affliction. Mechanically this is the "persistent
disenchant curse" layer spec 32 §10 already sketches for enemies,
applied to player-side afflictions.

**Files:** `src/Effects/debuffs.library.json` (duration/stacking
fields), `src/Effects/types.ts` + DoT tick path (`src/Combat/effects.ts`,
world-tick), spec 32 §3 semantics table, every affliction card's
`// pts:` arithmetic (lifetime-based pricing changes), pricing lint
bands re-checked.

**Evidence:** this IS sandbox-able per card via overrides once the
engine honors stack-persistence: A/B erosion/tithe presets late, target
"late DoT decks > 0% without early win rates leaving band".

**Tier:** effect-engine semantics — **propose-only → [owner-call]**
(it re-prices a third of the library). **Size: M-L.** Sequencing note:
do AFTER #2 — a scaled burst cap alone may lift late enough to shrink
this item.

---

## 4. Balance the variance, not the mean — per-deck floors

**Problem.** Mid averages 53.7% vs the corrected ~50% target, but the
distribution is bimodal: four decks ~100%, four near 0%. A stage
average can hit target while half the themes are unplayable — that's
still true under the corrected curve, it's just a coincidence that the
mid average now sits close to target for the wrong reason.

**[owner-call], recorded 2026-07-08:** the floor/ceiling numbers below
predate the corrected target curve (see header) and need re-tuning to
it before they're load-bearing again — in particular the late floor
(">= 10%") and the "no preset at 100%" ceiling rule should be revisited
against a ~25-35% late average rather than 65-75%, and impossible
should target a hard 0% floor AND ceiling (no deck should ever land an
impossible win with a starter deck), not just "~1% average."

**Fix.** Add per-deck floor/ceiling targets to `/deck-tuning` §4 and the
balance-band e2e: every theme preset >= 40% early, >= 25% mid, >= 10%
late (floors tuned to taste), and NO preset at 100% on any stage
(a 100% cell is a dominance finding). Report per-deck spread
(min/median/max) alongside stage averages in every run.

**Files:** `.claude/commands/deck-tuning.md` §4,
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`
(`// PLAYTEST-CALIBRATION` thresholds), report template.

**Evidence:** none needed beyond the matrix itself — this changes the
objective function, not the game.

**Tier:** targets + test thresholds — **free** (calibration values are
the tuning surface). **Size: S. Do this first** — it makes every later
item's evidence honest.

---

## 5. A pressure valve for theme self-containment

**Problem.** Zero cross-deck overlap is a good identity constraint, but
a theme missing a capability simply loses with no recourse: Foundry has
no tier-3 line (mid/late 0%), Bastion cannot kill a non-attacker.

**Fix (either/both, owner's pick):**
- *(a) Utility flex slots:* mandate 2-3 of the 15 preset slots come from
  the utility-10 vocabulary, chosen per theme as its "answers" package.
- *(b) Boss-tech rare:* each theme's rare spell is explicitly designed
  against the late wall in its own vocabulary (Foundry: a pip-scaling
  uncapped spender; Bastion: RIPOSTE that also fires on denied/non-attack
  turns; etc.).

(b) preserves self-containment purity; (a) is cheaper. Recommend (b)
first, (a) only if (b) leaves holes.

**Files:** `src/Combat/combat.deck-presets.ts` (recipe),
`src/Cards/cards.library.ts` (rare redesigns via sandbox → promote),
spec 32 §6-8 notes.

**Evidence:** standard sandbox A/B per redesigned rare, >= 2 stages /
2 policies; preset floors from #4 as the pass/fail line.

**Tier:** card data — **free-to-guarded** under normal `/deck-tuning`
autonomy; recipe change is **[owner-call]** (touches spec §8 recipe).
**Size: M.**

---

## 6. An effectiveness lint (the Ouroboros class of bug)

**Problem.** Refrain's finisher dealt literally ZERO damage (payoff
authored on the FREE face, which never fires with the paid replay) and
passed both the pricing lint and the card-coverage e2e — coverage
proves PLAYABLE, not EFFECTIVE. One fixed card moved late 3%→37%; the
bug class is worth a permanent witness.

**Fix.** New hermetic e2e: for every library card, play it in a scripted
scenario (deterministic RNG, preconditions synthesized per card — stacks
present for payoffs, dice held for spenders) and assert its PRIMARY verb
produces a nonzero observable delta (damage dealt, stacks applied, cards
drawn, rungs removed, Souls gained...). Classify primary verb from the
existing `verbClass`/mechanic kinds; cards whose effect is genuinely
conditional declare their precondition in the fixture, not an exemption.

**Files:** new `src/Cards/e2e/card-effectiveness.engine.test.ts`,
possibly a small fixture helper in `src/test-utils/`. No engine changes.

**Evidence:** the test itself; it should FAIL RETROACTIVELY on the
pre-fix Ouroboros to prove it catches the class.

**Tier:** test-only — **free**. **Size: M** (the fixture synthesis is
the work). High value per token: catches every future "the card lies
mechanically" bug at commit time instead of via a 10-agent audit.

---

## 7. Feed round 2 into the keyword atlas

**Problem.** The battle-lab conclusions live in an HTML artifact outside
the repo's working memory; the next `/deck-tuning` run would rediscover
them.

**Fix.** Update `axiomancer-mechanics/docs/keyword-atlas.md` gate marks
from round-2 data now: PERORATION `D:!` (Oratory unbeaten), STAGGER
`D:!` (Standstill unbeaten), RUPTURE/REAP `E:!` at late (capped into
irrelevance), SWAY `E:!` late (threshold unreachable), ECHO/REPRISE
`E:+` (Refrain proves them), with notes pointing at this plan's items.
Note Penitent's regression (mid 78→58) as a standing `!` until item #2
lands.

**Files:** `docs/keyword-atlas.md`. **Tier: free. Size: XS.**

---

## Status (2026-07-08, post-plan execution pass)

- [x] Item 4 — per-preset floors + dominance ceiling (60b1e26b)
- [x] Item 6 — card effectiveness lint, 70/70 strict (679ba168)
- [x] Item 7 — atlas gate marks from round 2 (8f646629)
- [x] Item 2 — scaling burst caps, fraction 0.25 (8d853dcb):
      penitent late 0.02->0.40 (regression erased), erosion late 0.08;
      foundry/tithe/augury/bastion late still 0 -> items 3/5 territory
- [x] Item 1 — win-path scaling: CONCEDE 8/10/12 by enemy difficulty,
      CAPITULATE resolve threshold max(10, 0.35x maxHP) clamped to current
      HP, boss rung-regrowth 1/turn capped at 2x natural. Grace late
      0.00->0.75. Finding: oratory/standstill stay 1.00 late — oratory
      falls through to ordinary damage wins when CONCEDE is delayed;
      standstill dominance is BACKFIRE per-rung drip, not permanent
      denial. Their ceiling breach is now a BACKFIRE/damage tuning item
      (deck-tuning forge), not a threshold item.
- [ ] Item 3 — persistence-by-stack DoTs (re-scope after item 2: erosion
      late only 0.08, so the DoT-decay wall is still real)
- [ ] Item 5 — theme pressure valve (foundry/bastion walls unchanged)

## Sequencing

1. **#4 floors** (S, free) — fix the objective function first.
2. **#6 effectiveness lint** (M, free) — lock the correctness gains in.
3. **#7 atlas update** (XS, free) — carry the evidence forward.
4. **#2 burst-cap formula** (S-M, [owner-call] + supervised sweep) —
   the single cheapest late-game unlock.
5. **#1 win-path scaling** (L, [owner-call]) — the structural fix; boss
   answers can ship enemy-by-enemy.
6. **#3 persistent DoTs** (M-L, [owner-call]) — re-scope after #2's
   sweep; may shrink.
7. **#5 pressure valve** (M) — last; per-theme gaps may close under
   #1-#3 before boss-tech rares are needed.

Items 1-3 of the sequence are executable by `/deck-tuning`/card-expert
today with no ratification. Items 4-6 need one owner session to ratify
formula shapes and spec deltas — log the decisions in spec 32 §12 and
retire this doc's [owner-call] flags as they resolve.
