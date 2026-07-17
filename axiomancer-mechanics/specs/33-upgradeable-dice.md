# Spec 33 — Upgradeable Dice: the four-die combat rework

> **Status:** DESIGN (CDR). Nothing here is implemented. Phase candidates
> D1–D7 are filed in `plan/PHASE_CANDIDATES.md`; D1 is the
> mechanics-expert review of THIS document against doctrine before any
> engine work starts.
>
> **Provenance:** owner proposal + brainstorm session 2026-07-17
> (`braindump/2026-07-17-upgradeable-dice-combat.md`), refined through two
> mechanics-expert passes (system-delta/balance analysis; stance-layer
> design). All constraining questions were owner-decided in-session and are
> marked **[owner-locked]**. Supersedes the dice/read/wheel rules of spec 25
> §4.2, spec 31 §1 (R2–R9), and the 2026-07-09 dice-law amendment where
> stated; everything not explicitly changed here ports unchanged.
>
> **Doctrine check (unchanged laws this spec must serve):** status effects
> remain the main fun; enemy HP falls only to status (spec 32 v3 — the
> strike is dead); starter presets hold the 80/50/25-35/0 win curve; dice
> honesty (2026-07-09): no rigged rolls, ever.

---

## 1. The dice [owner-locked]

Four six-sided dice, each a single fixed color, rolled every combat round:

| Die    | special | mana | miss | usable P | notes                        |
| ------ | ------- | ---- | ---- | -------- | ---------------------------- |
| Red    | 1       | 2    | 3    | 3/6      | color-locked mana            |
| Blue   | 1       | 2    | 3    | 3/6      | color-locked mana            |
| Purple | 1       | 2    | 3    | 3/6      | color-locked mana            |
| Gold   | 1       | 1    | 4    | 2/6      | **wild** — powers any color  |

Face semantics:

- **mana** — the die may power one PAID card line of its color this round
  (Gold: any color). The color law survives from 2026-07-09: a die powers
  only its color's card; wild is the sole exception; off-color hard-fizzles.
- **miss** — dead die. Worth **0◆ intrinsically** — misses are fuel for
  rerolls/conversions, never income. A miss is only revived by Press Fate
  (§5) or card mechanics.
- **special** — the die powers a card AND grants **2 Conviction (◆)**.
  Tokens ARE Conviction — no new currency.

**Pool law: exactly 4 rolled dice.** Progression is face QUALITY, never die
count. Bounded, visible exceptions only: the KINDLE temp die, the surge gold
die (§4, one round), Reserve materialization (§6), and one rare permanent
gold+lead pair (§6). Hard ceiling: **7 die objects on the table**.

**Baseline math** (stock dice — the numbers D3's sim must witness):
E[usable/round] = 3·(1/2) + 1/3 ≈ **1.83**; all-miss (whiff) =
(1/2)³·(2/3) ≈ **8.3%**; E[specials/round] = 4·(1/6) ≈ 0.67 →
**≈1.33◆/round** income (today ≈1.7–2.0); per-color access with Gold wild
≈ **67%** (today ≈70.4%).

Color↔stance mapping: **Red↔Body, Blue↔Mind, Purple↔Heart** (default —
cosmetic, confirm at D1 review). Every rules reference below uses stance
names; the mapping is a rendering concern.

### What this deletes

The shared face-bag roll (`COMBAT_DIE_FACES`, 3 dice draft 1), the
single-die law, the draft itself, unpicked-die Conviction
(`CONVICTION_PER_UNPICKED_DIE/WILD`), bank-or-burn as a draft consequence,
and the hidden-stance read economy (§2). The action economy becomes
"every usable die may power a paid line" — ~1.83 paid plays/round baseline
replaces 1-draft + chain refreshes.

---

## 2. Stance: an output of play (the RPS read is retired) [owner-locked]

> Owner: "I don't really think we need the rock/paper/scissors mechanic
> anymore. There's WAY more to pay attention to now."

**Your stance = the stance of the last PAID card you played.** Wild-powered
plays count as the card's printed stance (the die doesn't matter — the card
does). FREE lines never change stance. Fights open stance-less.

**Retired:** the hidden `enemyStance` read (`resolveRead` as a draft
mechanic), `CONVICTION_READ_WIN_BONUS`, OMEN v1 (R5 unpicked-die scout),
`READ_ADVANTAGE_INTENSITY_BONUS` / `READ_DISADVANTAGE_DURATION_PENALTY` as
read outcomes. The `READ_DAMAGE_MULT` 1.5/0.5 rails are REUSED by stance
checks below.

**Enemy phases telegraph openly.** Each threat phase's script gains a
**stance check** field alongside intent + magnitude (spec 30 readout) and
the spec-29 reactive branch:

- `punishes: X` — if you END the phase in stance X, the enemy hit lands at
  ×1.5 (and/or its status +1 intensity, same rails as the old
  disadvantage).
- `yields: X` — if you end the phase in stance X, the hit is blunted ×0.5
  and you gain **+1◆** (the read-win bonus, reinterpreted).

No hidden information anywhere: the tension is whether your dice let you
STEER into (or out of) the named stance through miss-heavy faces — Gold is
the steering wheel. **Authoring law:** distribute checks across stances so
mono-color builds face 1–2 off-color checks per fight; bosses may check two
stances or "not-X". Enemy AI needs no new machinery — checks are authored
script fields, committed at phase start like spec-29 branches.
`enemyStance` stays on phases for CHARM `forcedStance` /
`blockedStances` / `canAct` compatibility.

---

## 3. Momentum: the wheel, absorbed [owner-locked — owner's reframe]

The momentum wheel (EA-6) stops being a parallel tracker and becomes the
stance layer's chain. Chain order: **Heart → Body → Mind → Heart** (cyclic,
any entry point).

State machine (`momentum: { color, length } | null`):

1. **Start** — any PAID card while momentum is null sets
   `momentum = { color: card.stance, length: 1 }`.
2. **Advance** — a PAID card of the NEXT color in the chain increments it.
3. **Reset-and-restart** — a PAID card of any OTHER color (INCLUDING the
   same color you're on — strict: only the successor is safe) resets the
   chain and immediately restarts it at that card's color, length 1.
   *(Reset-and-restart is the natural reading of the owner's rule; confirm
   at D1 review.)*
4. **Persistence** — momentum does NOT reset between rounds. It resets only
   on (a) combat end, (b) rule 3, (c) surge payout.
5. **FREE lines never touch momentum** — in either direction.
6. **Surge** — completing the third color grants a **temporary gold die for
   one round** (ports the wheel-completion reward 1:1), then momentum
   resets to null. No cycling past a surge, no escalating surges.

Cross-round persistence makes the chain a fight-long thread you protect;
strict same-color-resets makes every paid play a live decision against your
dice.

---

## 4. Whiff valve [owner-locked]

All-miss ≈8.3% of rounds at stock dice (a whiff every ~12 rounds). The
dice-honesty law stands — **no rigged rolls, no pity floor**. Three honest
valves:

1. **FREE card lines are always playable** regardless of dice (existing
   FREE-line law) — a full-miss round still plays.
2. **Press Fate reprices: 1◆ → reroll ALL your miss faces, once per
   round.** This is both the main ◆ sink for the lowered income and the
   stance-escape (a whiff round stranding you in a punished stance is the
   design's sharpest feel-bad — this is its answer).
3. **Card-driven rerolls / miss-conversion.** Forge keeps its saturation;
   additionally **every theme/preset gains exactly ONE dice-interaction
   card** (reroll, convert, tap — far below Forge density).

Explicitly NOT adopted: the miss-face Fate Tap (tap a miss for +1◆/+1 DoT
tick) — rejected by owner to keep misses worth 0◆ and the income legible.

---

## 5. Conviction economy [owner-locked: tokens = Conviction]

Income: specials ≈1.33◆/round + yield-check bonuses (§2) — vs today's
≈1.7–2.0 from unpicked dice + read wins. **Sinks must reprice** for a
~25–33% leaner economy; targets (derive exact numbers in D3's sim, witness
in bands):

- Signature Skills — reprice so a meaningful spend lands every 2–3 rounds.
- STAKE — keeps 2/4/6◆ tiers and its settlement plumbing, but the wager
  becomes **"I will answer this phase's stance check"** (win pays the
  floating-die tiers; loss ticks the escalation clock). Genuinely
  uncertain, self-inflicted risk — no hidden info needed.
- Press Fate — 1◆ (§4), the new recurring sink.
- Antes / scrap — hold; re-examine in D7 tuning.

Cap 12 unchanged.

---

## 6. Upgradeable dice: face upgrades, forging, subsystem ports [owner-locked]

The four dice are **permanent fixtures of the player's kit — there is no
equip/unequip, no die inventory, no loadout.** A player does not own a
collection of dice to slot in and out; they own **four dice whose face
distributions grow.** Upgrades mutate faces in place — permanently at
forges/rewards, temporarily in combat — and the upgraded face-state
**persists across combats.** That persistence reuses the spec-05
save/versioning machinery as an *implementation detail only* — it is
persistence, not gear (`GAME_STATE_VERSION` migration required). It does
NOT make dice swappable: the only changes to the pool itself are the
bounded §1 exceptions (KINDLE, surge, Reserve, the rare gold+lead pair).

**FORGE = the between-fight face-swap economy.** At forges/rewards, buy
face swaps: miss→mana, mana→special. Hard caps — **≤2 special and ≥1 miss
per colored die; Gold ≤1 special** — whiff is never forgeable away.
**In-combat (temporary, this-fight-only) face upgrades are part of the
FORGE preset's identity** (owner addition — Forge cards may grant them).

Subsystem reinterpretation table (reinterpret, never cut):

| Subsystem            | Fate                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Reserve + pips       | Ports: bank 1 unspent HIT die at end of round (cap 2); ripens +1 pip/phase survived; `PIP_INTENSITY_BONUS`/`PIP_GUARD_BONUS` unchanged. |
| KINDLE               | Ports verbatim: temporary extra die this combat (counts toward the 7-object ceiling).                                       |
| OVERHEAT             | Reinterpreted: push an already-SPENT die to power a second card at **35% risk it cracks** (that die is all-miss next round). |
| FORGE floating dice  | Reinterpreted: the face-swap economy above; floating-die grants become temp gold dice (surge/STAKE payouts).                |
| Fate Tap             | **Superseded** by §4's valves (owner call — no miss-face tap).                                                              |
| Permanent wild+dead  | Ports as the rare **gold+lead pair**: a 2nd gold die paired with a leaden die (5 miss / 1 mana), cap 1 pair — fate pushes back. |
| Resonance (R1)       | Ports unchanged — every spent die feeds its color's tally; Gold: choose color on spend; misses feed nothing.                |
| OMEN v2 (Oracle)     | Reinterpreted onto spec-29 reactive branches: the claim names WHICH branch the enemy will take — uncertain because it depends on your own play. |
| STAKE (EA-7)         | See §5 — wagers the stance check, same plumbing.                                                                            |
| CHARM / blockedStances / canAct | Port unchanged (enemy-side stance semantics keep `enemyStance`).                                                 |
| Forge's 7 die-cards  | Keep identity, text re-authored against the new model in D4.                                                                |

**Keyword doctrine** ("every mechanic is a keyword"): **SPECIAL** gets a
keyword row + Dawncaster-terse gloss on card faces and the atlas; upgrade
verbs get keywords (working names **HONE** — add a mana face; **TEMPER** —
change a special's payload; final names at D1 review); registered in the
atlas + mobile `state/combat/keywords.ts` with the ambiguous-fallback guard
test extended.

---

## 7. What D3's sim must witness (spec bands)

| Metric                        | Band                                   |
| ----------------------------- | -------------------------------------- |
| E[usable dice/round], stock   | 1.83 ± 0.05                            |
| Whiff rate, stock             | 8.3% ± 1% (with valves: dead rounds — FREE-only rounds with no ◆ — measured and reported, no band yet) |
| Per-color access              | ≥ 65%                                  |
| ◆ income/round                | 1.2–1.6 (specials + yield bonuses)     |
| Surge frequency               | measured; target set at D3 from feel   |
| Win curve (starter presets)   | early ~80 / mid ~50 / late 25–35 / 0   |

statusEngagement re-baselines at D7 with its known blind spots
(enemy-side-only, volume, arc-blind) stated in the report.

---

## 8. Phasing

Filed as candidates **D1–D7** in `plan/PHASE_CANDIDATES.md` (spec review →
flagged engine core → sim harness → pricing re-derivation → face-upgrade
layer → mobile UI → tuning + honest re-baseline). Public-barrel warning for
D2: any `CombatManaDie` shape change is public-API-breaking — migrate
mobile + card-editor in the same phase and re-verify
`npm run verify -w axiomancer-mobile`.

## 9. Open items for the D1 review

1. Reset-and-restart reading of momentum rule 3 (§3) — confirm.
2. Color↔stance mapping (§1) — confirm the cosmetic default.
3. Final upgrade-verb keyword names (HONE/TEMPER working titles).
4. Exact ◆ sink repricing table — derived in D3, ratified in D7.
5. Prior-art receipts: kb/ lacks Astrea, Dicey Dungeons, Slice & Dice,
   Quarriors, Elder Sign — wishes filed 2026-07-17; re-cite from kb/ when
   the scout covers them.
