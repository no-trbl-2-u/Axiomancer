# Spec 33 — Upgradeable Dice: the four-die combat rework

> **Status:** IMPLEMENTED — **D1–D8 shipped and D7 ratified by 2026-07-18**
> (decision history remains in the D-series phase briefs and
> `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-18-d7-ratification.md`). Current player and playtest
> paths use Upgradeable Dice. The blacksmith implementation remains a dev/test
> surface only: T rejected it as the player-facing upgrade home, which stays
> unresolved in `plan/PHASE_CANDIDATES.md` under “Re-home dice upgrades off
> the blacksmith.”
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
count. Bounded, visible exceptions only: the KINDLE temp die (**cap 1
concurrent**), the surge gold die (§3, until spent this combat), Reserve
materialization (§6, cap 2), and one rare permanent gold+lead pair (§6).
Hard ceiling: **7 die objects on the table**, enforced by materialization
priority [D1]: permanent pool (4–6) → Reserve (≤2) → KINDLE (≤1) → surge
gold. A die object that would be the 8th is **not created — the grant
converts to +1◆** (a Reserve bank that would overflow burns for +1◆) —
the same overflow idiom the engine already speaks for floating/Reserve
caps. Nothing is silently dropped; every refusal is visible and
compensated. The gold+lead pair thus carries a real cost beyond the
leaden die: its owner's Reserve+temp headroom shrinks — fate pushes back.

**Baseline math** (stock dice — the numbers D3's sim must witness):
E[usable/round] = 3·(1/2) + 1/3 ≈ **1.83**; all-miss (whiff) =
(1/2)³·(2/3) ≈ **8.3%**; E[specials/round] = 4·(1/6) ≈ 0.67 →
**≈1.33◆/round** income (today ≈1.7–2.0); per-color access with Gold wild
≈ **67%** (today ≈70.4%).

Color↔stance mapping: **Red↔Body, Blue↔Mind, Purple↔Heart** — CONFIRMED at
D1: it matches the shipped `STANCE_COLORS` convention (mobile
`state/presenters/combat-encounter.engine.ts`: body=red, mind=blue,
heart=purple, wild=gold). Every rules reference below uses stance names;
hex/color is a rendering concern — D2 authors die identities AS stance
names. ("usable P" in the table above = probability the die shows a usable
face — mana or special.)

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

1. **Start** — a PAID card while momentum is null sets
   `momentum = { color: card.stance, length: 1 }`.
2. **Advance** — a PAID card of the NEXT color in the chain increments it.
3. **Break = reset to NULL** [owner-locked, D1 2026-07-17]: a PAID card of
   any OTHER color (INCLUDING the same color you're on — strict: only the
   successor is safe) resets momentum to **null**. The breaking card builds
   nothing; the NEXT paid card starts a fresh chain via rule 1. This
   deliberately supersedes the shipped `advanceWheel` truth table
   (wrong/repeat → restart at played color, `combat.engine.ts:241-246`) —
   D2 must NOT port that behavior.
4. **Persistence** — momentum does NOT reset between rounds. It resets only
   on (a) combat end, (b) rule 3, (c) surge payout.
5. **FREE lines never touch momentum** — in either direction.
6. **Surge** — completing the third color grants a **temporary gold die
   that persists until spent, this combat only** [owner-locked, D1: true
   port of the shipped wheel-reward lifetime; a one-round die could arrive
   after the last playable card and evaporate unspent — rejected]. Then
   momentum resets to null. No cycling past a surge, no escalating surges.
   The surge die obeys the §1 ceiling (overflow → +1◆).

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
   design's sharpest feel-bad — this is its answer). **The reroll is
   honest — no stance- or mana-face guarantee** [D1]: this explicitly
   supersedes the shipped `rerollSpentDice` stance-bearing conversion
   (`combat.dice.ts:229-234`), which is a rig under this spec's law and
   must NOT be ported by D2. A die cracked by OVERHEAT (§6) is all-miss
   this round and is excluded from the reroll. (Post-Press-Fate whiff
   residue: ≈8.3% × 8.3% ≈ 0.7% of rounds — carried honestly by FREE
   lines.)
3. **Card-driven rerolls / miss-conversion.** Forge keeps its saturation;
   additionally **every theme/preset gains exactly ONE dice-interaction
   card** (reroll, convert, tap — far below Forge density).

   **D8 owner amendment (2026-07-18):** this is a literal preset replacement,
   not deck inflation. Under the Upgradeable-Dice flag, each 15-card starter
   replaces exactly one same-aspect card instance with one singleton valve;
   15 cards and 5/5/5 survive, while flag-off recipes remain byte-identical.
   Prefer the staged thematic valves. If one fails its sandbox court, the
   bare-minimum fallback is **FREE: choose one eligible die and reroll it;
   PAID: reroll every eligible die on the table, including the powering die**.
   Eligible means non-cracked; every result uses honest engine RNG and the
   die gear's real face table. Promotion is Phase D8, not part of D7.

   **D8 shipped (2026-07-18):** all ten themed valves passed the promotion
   court (per-seat A/B, early stage, blind+greedy, seeds 1-5, flag-on; report:
   `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-18-d8-preset-dice-valves.md`) — the fallback was never
   needed. Ratified seats (`PRESET_DICE_VALVES` in
   `combat.starter-deck-presets.ts`; valve <- displaced one-instance source):
   erosion recurring-symptom <- slippery-slope; oratory restate-the-point <-
   exordium; foundry forge-masters-stamp <- anvil-of-form; penitent
   bleed-for-it <- pact-of-akrasia; standstill break-the-tempo <- red-herring;
   augury second-sight <- prophecy-fulfilled; tithe bank-the-yield <-
   stuck-in-their-head; grace change-of-heart <- soft-word; bastion
   hold-the-line <- the-adamant-wall; refrain second-take <- ouroboros.
   Library ten-in/ten-out: the valves entered the curated 70; the ten
   reward-only cards (zero plays in 345,600 measured encounters) retired.

Explicitly NOT adopted: the miss-face Fate Tap (tap a miss for +1◆/+1 DoT
tick) — rejected by owner to keep misses worth 0◆ and the income legible.

---

## 5. Conviction economy [owner-locked: tokens = Conviction]

Income: specials ≈1.33◆/round + yield-check bonuses (§2) — vs today's
≈1.7–2.0 from unpicked dice + read wins. **Sinks must reprice** for a
~25–33% leaner economy. Number ownership [D1]: Press Fate = 1◆ is
spec-fixed now; signature/ante engine constants are **derived in D3's
sim**; the card-pricing model re-fit is **D4**; **D7 ratifies** the whole
economy against the honest re-baseline.

- Signature Skills — reprice so a meaningful spend lands every 2–3 rounds.
  (At current 4–8◆ costs, discretionary income after Press Fate is
  ~0.3–0.6◆/round — a meaningful spend every ~10 rounds. D3 derives the
  new table.)
- **STAKE — RETIRED ENTIRELY** [owner-locked, D1 2026-07-17]. The wager
  retires with the read; its plumbing (`placeStake`/`settleStake`,
  2/4/6◆ tiers, escalation-tick loss) is **removed in D2, not rewired**.
  This deletes an escalation-clock pressure source and a ◆ sink — D3
  measures that gap explicitly.
- Press Fate — 1◆ (§4), the recurring sink.
- Antes / scrap — hold; re-examine in D7 tuning.

Cap 12 unchanged.

---

## 6. Die gear: four dedicated slots carry ALL progression [owner-locked, revised at D1 2026-07-17]

The four dice are **permanent, immutable fixtures — fixed 6-siders that
never change.** There is no die inventory and no die swapping. ALL die
progression lives on **die gear: four new dedicated, color-coded equipment
slots (R/B/P/G), one per die**, separate from the 5-piece wear model
(1 weapon / 1 armor / 3 accessories — signet relics and die gear never
compete for slots). The equipped piece defines everything mutable about
its die:

- **Special payload** — the slotted gear defines what THAT die's special
  does. Default gear payload: *"powers a card of this color AND grants
  2◆"* (§1). Later-game gear changes the payload — **swapping gear IS the
  payload change**, so no forge-service keyword exists for it.
- **Face upgrades** — HONE and TEMPER upgrade the face table driven by the
  equipped gear. **Player-facing home settled (T, attended chat, 2026-08-08;
  Phase 60, 2026-08-25):** the blacksmith is a placed `MapEvent` node
  (fishing-village `fv-21`), reached directly on the map rather than through
  rest (rest offered it briefly via Phase 52c; Phase 59 dropped that offer).
  A single fixed placement, not a repeating cadence. Hard caps remain **≤2
  special and ≥1 miss per colored die; Gold ≤1 special** — whiff is never
  forgeable away.
- **Persistence** — gear items + upgrade state persist via the Game
  module's save/versioning machinery (`GAME_STATE_VERSION` in
  `src/Game/game.migrate.ts`). The pieces themselves are equipment-engine
  items (spec-05) living in a dedicated 4-slot rail — the DICE are not
  items; their GEAR is.

**RATIFIED rule (D7):** the special benefit fires only when the die is **used
to power a card** — a rolled special that goes unspent grants nothing.
`SPECIAL_FIRES_ON_USE = true` is the owner-ratified switch. A banked special
die spent later from Reserve DOES fire its payload because the trigger is use,
not roll.

**FORGE preset identity = special-amplifier enchantments** [owner, D1] —
NOT payload changes: enchantment cards that increase the benefit of fired
specials (e.g. an enchant adding +1◆ on top of a "+2◆" payload → 3◆ per
fired special). Forge keeps its die-manipulation card density; every other
theme gains exactly ONE dice-interaction card (§4).

Subsystem reinterpretation table (reinterpret, never cut — except STAKE,
retired by owner call):

| Subsystem            | Fate                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Reserve + pips       | Ports: bank 1 unspent mana/special die at end of round (cap 2); ripens +1 pip/phase survived; `PIP_INTENSITY_BONUS`/`PIP_GUARD_BONUS` unchanged. A banked special fires its payload when spent from Reserve (use-triggered — see PROVISIONAL above). |
| KINDLE               | Ports: temporary extra die this combat, **cap 1 concurrent** (§1 ceiling applies).                                          |
| OVERHEAT             | Reinterpreted: push an already-SPENT die to power a second card at **35% risk it cracks** (that die is all-miss next round and excluded from Press Fate that round). The second play is a paid play — it moves stance and momentum. Any die may be overheated, gold included. |
| FORGE floating dice  | Reinterpreted: float grants become temp gold dice (surge; §1 ceiling overflow → +1◆). The face-swap economy is retired in favor of die gear (above). |
| Fate Tap             | **Superseded** by §4's valves (owner call — no miss-face tap).                                                              |
| Permanent wild+dead  | Ports as the rare **gold+lead pair**: a 2nd gold die paired with a leaden die (5 miss / 1 gold-colored mana — it pairs with gold), cap 1 pair — fate pushes back, and eats table headroom (§1). |
| Resonance (R1)       | Ports unchanged — every spent die feeds its color's tally; Gold: choose color on spend; misses feed nothing.                |
| OMEN v2 (Oracle)     | Reinterpreted onto spec-29 reactive branches: the claim names WHICH branch the enemy will take — uncertain because it depends on your own play. |
| STAKE (EA-7)         | **RETIRED** [owner-locked, D1] — see §5. Plumbing removed in D2, not rewired.                                               |
| `sig-read-opponent`  | Reinterpreted [D1]: its object (hidden stance) no longer exists — it now reveals the NEXT phase's stance check + reactive branch early. D3 re-derives its 1◆ cost. |
| CHARM / blockedStances / canAct | Port unchanged (enemy-side stance semantics keep `enemyStance`). CHARM `forcedStance` is enemy-side only — it never overrides the player's last-paid-card stance for check purposes [D1]. |
| Forge's 7 die-cards  | Keep identity, text re-authored against the new model in D4.                                                                |

**Null-stance rule [D1]:** fights open stance-less; while the player has no
stance, neither `punishes` nor `yields` fires — a check against a stance
you never entered passes silently.

**Keyword doctrine** ("every mechanic is a keyword"): **SPECIAL** gets a
keyword row + Dawncaster-terse gloss on card faces and the atlas ("SPECIAL"
is the most generic name in the registry — rename opportunity noted at D1,
deferred, not blocking). Blacksmith upgrade verbs are keywords: **HONE** —
add a mana face; **TEMPER** — upgrade a mana face to a special face (caps
apply). Payload changes are gear swaps, not keyworded services. Registered
in the atlas + mobile `state/combat/keywords.ts` with the
ambiguous-fallback guard test extended.

---

## 7. Measured gates [split at D1 — a pre-D4 win-curve read is a false red/green]

**D3 gates (dice math — measurable against un-repriced sinks):**

| Metric                        | Band                                   |
| ----------------------------- | -------------------------------------- |
| E[usable dice/round], stock   | 1.83 ± 0.05                            |
| Whiff rate, stock             | 8.3% ± 1% (post-Press-Fate residue ≈0.7%; dead rounds — FREE-only with 0◆ — measured and reported, no band yet) |
| Per-color access              | ≥ 65%                                  |
| ◆ income/round                | 1.2–1.6 (specials + yield bonuses)     |
| Surge frequency               | measured; target set at D3 from feel   |
| STAKE-retirement gap          | escalation-clock pressure + ◆-sink loss measured (§5) |

**D7 gates (only meaningful AFTER D4's repricing):**

| Metric                        | Band                                   |
| ----------------------------- | -------------------------------------- |
| Win curve (starter presets)   | early ~80 / mid ~50 / late 25–35 / 0   |
| statusEngagement              | re-baseline, blind spots (enemy-side-only, volume, arc-blind) stated |

**D4 note [D1]:** card-played-clock DoT pricing assumes ~2 plays/round
(WS3.3, baked into the `dotLifetimeHp`/tempo constants in
`cards.pricing.ts`); the new ~1.83-paid-plus-FREE cadence changes tick
density — those constants must be re-derived in D4.

---

## 8. Phasing

Phases **D1–D8 shipped** through the unified build plan: spec review → engine
core → sim harness → pricing re-derivation → die-gear layer and dev blacksmith
surface → Mobile UI → tuning/ratification → preset dice valves. Future
face-table or public `CombatManaDie` changes remain cross-package changes:
verify Mobile and Card Editor under the root impact checklist.

## 9. D1 review — resolved 2026-07-17 + residual opens

Resolved (decision log:
`plan/archive/2026-09-25-trim-t4/plan/phases/phase_D1_upgradeable_dice_spec_review.md`):

1. Momentum rule 3 = **reset to null** (owner call — supersedes the
   shipped restart-at-played-color truth table).
2. Color↔stance mapping **confirmed** — matches shipped `STANCE_COLORS`.
3. Keywords: **HONE** (add mana face), **TEMPER** (mana→special); payload
   change = gear swap, unkeyworded. Die gear carries ALL progression
   (§6); **STAKE retired entirely**; surge die = until-spent.
4. ◆ number ownership: Press Fate spec-fixed; signature/ante constants =
   D3; card-pricing model = D4; ratification = D7.
5. Prior-art: kb/ still lacks the five dice-builder games (wishes open,
   filed 2026-07-17) — citations remain remembered-and-labeled. The two
   real kb receipts (Quacks catch-up valve, Oathsworn transparent risk)
   stand and both support the visible-upgradeable-face-table design.

Residual opens (tracked; they do not make the shipped model provisional):

- STAKE retirement gap — measured during the D-series court; any further
  response belongs to tuning evidence, not rollout.
- "SPECIAL" keyword rename opportunity — deferred.
- Player-facing upgrade home and cadence — RESOLVED (Phase 60, 2026-08-25):
  the blacksmith is a placed map node (fv-21 on fishing-village), a single
  fixed placement rather than a cadence. Northern-forest is currently
  unreachable via inter-map travel, so it carries no blacksmith node yet;
  revisit once that surface ships.
