# RULES DOSSIER — Axiomancer deck combat, as of 2026-07-10

Single source for the tuning-audit fan-out. Derived from live code + specs on this date:
`axiomancer-mechanics/src/Cards/card-themes.ts`, `src/Combat/combat.deck-presets.ts`,
`src/Combat/combat.stage-profiles.ts`, `src/Combat/combat.engine.ts`, `src/Combat/combat.dice.ts`,
`src/Combat/combat.signature.ts`, `specs/32-no-strike-card-library.md` (v4),
`specs/31-fate-engine-card-effect-revamp.md` (amended 2026-07-09), `docs/combat.md`,
`docs/keyword-atlas.md`, `plan/HANDOFF-2026-07-09-dice-law-rework.md`.

**Doctrine (do not propose reverting):** status effects are THE fun; THE STRIKE IS DEAD
(`basePower`/`chipHp` deleted at schema level — all enemy HP falls to DoT ticks,
RUPTURE/REAP bursts, engine-gated drips like BACKFIRE, or THORNS/RIPOSTE reflect);
alt-wins Befriend / CAPITULATE (SWAY) / CONCEDE (8-Premise Peroration); starter presets
must decay early ~80% → mid ~50% → late ~25-35% → impossible 0%.

**Owner-locked dice law (2026-07-09):** 3 dice/round, no stance guarantee; player applies
1 rolled die/round; THE COLOR LAW (a die only powers its color; WILD/gold universal;
off-color hard-fizzles); unused rolled dice → Conviction (colored +1, gold +2, X +0);
floating dice bypass the 1-die rule, are color-lawed, consumed permanently, never bank tokens.

**Owner design signal (in scope for this audit):** kill the "weak chip FREE line OR real
PAID effect" fork — the FREE line should lay foundation for PAID payoffs, not be a token drip.

---

## 1. Anatomy of one combat turn (today's rules)

Engine: `src/Combat/combat.engine.ts` (Hazard-Pattern Combat, the ONLY combat engine).
Phase loop: `startTurn` → draft → card plays / signatures → `endTurn` → `resolveThreatPhase`
→ `processBetweenPhases` → next turn. Enemy sole bar is HP; `isDefeated(enemy)` wins.

1. **Roll** — `startTurn` (engine.ts:411) rolls `TURN_DICE_COUNT = 3` dice
   (`rollTurnDice`, combat.dice.ts). **Honest roll**: no stance-die guarantee; a
   roll of all X faces is a pure token turn. Faces: heart/body/mind/wild at 1/6 each,
   x at 2/6. Any persistent **floating dice** materialize into the tray as `available`
   with stable ids (`float-N`), never rerolled (engine.ts:443-448). A `forceWildOnNextDie`
   payload (CLARITY) guarantees one wild, then is consumed.
2. **Draft** — `draftStanceDie(state, dieId)`: player commits ONE rolled die as their
   stance. This is also **the read**: drafted color vs the enemy's hidden phase stance
   (Heart > Body > Mind > Heart) → `resolveRead` = advantage / neutral / disadvantage.
   **Token accrual happens per unpicked die at draft time**: colored +1◆, wild +2◆
   (`CONVICTION_PER_UNPICKED_WILD`), dead X +0. Floating dice are excluded from the
   draft pick (`chooseDraft` filters them). Conviction cap = 12.
3. **Card plays** — any number of plays from hand (hand max 6), each via
   `playCombatCard(state, ref, useBottom, dieId)`:
   - `useBottom = false` → **FREE line** (`playTopAction`): dieless, weak, always legal.
   - `useBottom = true` → **PAID line** (`playBottomAction`, engine.ts:1091): needs a
     die — the drafted die, a Reserve die, a floating die, or (fate cards only) an X die.
   - **THE COLOR LAW** (playBottomAction step 1b): the powering die must match
     `card.stance` or be WILD; fate-X acts wild; off-color = explicit hard-fizzle event.
   - **1 rolled die per round** — but the self-reinforcing chain survives: landing a NEW
     status refreshes the applied die (same die, multiple PAID plays in a good turn).
     A fired RUPTURE/REACT also refreshes the drafted die (spec 31 R9 variety chain).
   - **Floating dice bypass the 1-die rule**: ALL floats may power plays in one round;
     each is consumed forever; none bank tokens (spec 32 §5, owner-locked).
   - Read/match bonuses on a play: read-advantage ×1.5 HP damage (`READ_DAMAGE_MULT`) and
     ×1.34 status magnitude (`READ_STATUS_MULT`); disadvantage ×0.5 / ×0.75. Color match
     = +3 flat (`COLOR_MATCH_DAMAGE_BONUS`) + R7's +1 duration — **near-unconditional now**
     (every legal play matches under the color law; fold-in candidate flagged in handoff).
   - Every spent die adds 1 **Resonance** of its color (wild: choose; X: nothing); cards
     with `threshold: {color, count}` fire their rider free when the tally qualifies (spec 31 R1).
   - `discardCombatCard(uid)`: scrap any hand card for +1◆.
4. **Signature Skills** — always-available kit funded by Conviction, playable during
   phase-play independent of the hand (`playSignatureSkill`): Read the Opponent (scout, 1◆,
   reveals the phase stance), **Press Fate** (`sig-press-the-point`, reroll, 4◆), Second Wind
   (sustain, 4◆), Overwhelming Argument (control, 8◆), Conviction Strike (dot, 7◆),
   Disarming Plea (mercy, 6◆), Conclusion (conclude, 6◆), Clever Gambit (draw, 4◆).
5. **End of turn** — `endTurn` (engine.ts:590): an unspent, non-floating, non-X drafted die
   banks to **Reserve** (max 2, arrives at 0 pips); if Reserve is full it burns for
   Conviction (colored +1 / wild +2). SWAY ≥ `capitulateThreshold(enemy)` is checked at
   turn boundaries (and eagerly on every gain).
6. **Threat phase** — `resolveThreatPhase` (engine.ts:2208): the enemy's telegraphed phase
   fires. Hard control (skipTurn) denies it via `canAct`; soft control (roll penalties)
   weakens the hit by 0.06/point (`THREAT_WEAKEN_PER_ROLL`), denies outright at cumulative 8
   (`THREAT_DENY_AT`), floor multiplier 0.4. STAGGER removes rungs from the telegraph; at
   0 rungs the action is denied; BACKFIRE deals its N per rung lost. The **escalation clock**
   multiplies threat damage: `min(2.0, 1 + 0.22 × roundsPastGrace)` (grace = 1 round;
   bosses escalate ×1.6 faster) and adds status-intensity bonuses as it climbs
   (`THREAT_EFFECT_ESCALATION_STEP` 0.34, ~+2 at cap). Every 5 rounds the enemy gains an
   enchant or lays a curse (`THREAT_ENCHANT_CURSE_EVERY_ROUNDS`).
7. **Between phases** — `processBetweenPhases` (engine.ts:2495): per-effect DoT ticks
   (round-threaded, so POISON's ramp ticks its real value), effect duration decrement +
   expiry (expiry feeds SOUL for Harvest), Reserve dice **ripen** +1 pip (cap 2), SWAY
   decays 1/turn (unless `irresistible-grace`), timed FREE-line enchant/curse instances
   tick down their 3-round `roundsLeft`, draw back up toward hand size, reshuffle
   discard on deck exhaustion (law; no fatigue mechanic).

**Win/loss:** enemy HP ≤ 0; player HP ≤ 0 loses; no in-combat retreat exists. Alt-wins:
**CAPITULATE** — SWAY ≥ `capitulateThreshold(enemy)` = min(max(10, 0.35 × maxHP), currentHP)
(a resolve threshold, NOT the full HP bar — reworked 2026-07-08); **Befriend** — explicit
Befriend cast + `spare` mercy choice (Phase 112; passive both-defend counters no longer
suffice); **CONCEDE** — a completed 8-Premise Peroration (ships on `the-closing-word`).

---

## 2. The 30-keyword registry (spec 32 §3, exact)

### Utility (10, shared)

| keyword | one-line meaning |
|---|---|
| **DRAW N** | Draw N cards. |
| **FORGE** | Create a floating die: joins tray now, never rerolls, persists across rounds AND combats, gone forever when spent. Cap 3; forging at cap → +1◆. |
| **GUARD N** | Block the next N incoming damage; fades at round end. |
| **BARRIER N** | As Guard, but persists until consumed. |
| **TICK** | One enemy DoT deals its per-turn damage now (duration unchanged). |
| **MARK iN dM** | Light universal affliction: +1 per stack to each DoT tick / payoff hit; counts as an affliction for RUPTURE/SOUL/REAP. |
| **CLEANSE N** | Remove N of your own afflictions. |
| **HEAL N** | Restore N VITAE (HP). |
| **RUPTURE** | Consume ALL enemy afflictions: burst = 1.5× remaining DoT fuel + 3 per non-DoT stack. Cap = max(80, 25% enemy maxHP). |
| **CONJURE** | Create a one-use Thoughtform card into hand (removed after play / combat end). |

### Theme hallmarks (2 × 10 = 20)

| theme | keyword | one-line meaning |
|---|---|---|
| Affliction | **POISON iN dM** | Ramping DoT — escalates per turn (honest printed curve, e.g. "2,2,3,3 = 10"). |
| Affliction | **BLEED iN dM** | Front-loaded DoT — decays 1 intensity per trigger. |
| Peroration | **PREMISE** | Persistent tally (the argument under construction). |
| Peroration | **PERORATION** | Declared conclusion, one in play: fires FREE at its printed Premise count, then Premises reset. |
| Forge | **KINDLE** | Create a temporary die (this combat only). |
| Forge | **PIP** | +1 pip to a die you hold; pips empower riders, spendable by payoff verbs. |
| Akrasia | **RECOIL N** | Pay N VITAE (unpreventable) as a printed cost. |
| Akrasia | **FALLEN** | State: you carry ≥2 self-afflictions; FALLEN-gated riders go live. |
| Control | **STAGGER N** | Remove N rungs from the enemy's telegraphed action; at 0 rungs it is denied. |
| Control | **BACKFIRE iN dM** | While active: enemy takes N per rung its actions lose. |
| Oracle | **FORETELL N** | Look at top N of your deck, reorder, and glimpse the enemy's next telegraph. |
| Oracle | **OMEN** | Declare the printed prediction; if true by your next turn, the rider fires free. |
| Harvest | **SOUL** | Gain 1 Soul whenever an enemy affliction stack expires or is consumed. |
| Harvest | **REAP N** | Spend N Souls to fire the printed effect. Burst cap = max(200, 0.25× maxHP). |
| Charm | **SWAY N** | Stacks on enemy; decays 1/turn; SWAY ≥ capitulate threshold at turn end → CAPITULATE. |
| Charm | **RAPPORT iN dM** | Enemy deals N less damage while active. |
| Bulwark | **THORNS iN dM** | Attacker takes N whenever it damages you. |
| Bulwark | **RIPOSTE iN dM** | When Guard/Barrier fully blocks an attack, enemy takes N. |
| Echo | **ECHO** | The printed line fires twice. |
| Echo | **REPRISE N** | Return N cards from your discard pile to hand. |

---

## 3. The 10 themes × preset decks

Preset recipe (all decks, `combat.deck-presets.ts`): C1 ×4, C2 ×4, U1 ×2, U2 ×2,
rare spell ×1, enchantment ×1, disenchant ×1 = **15 cards**, strictly self-contained
(zero cross-theme overlap, no escape card). `--deck preset:<presetId>` takes the id below.

| theme | presetId | cards (C1×4, C2×4, U1×2, U2×2, R-spell, R-enchant, R-disenchant) | hallmarks | family utilities | intended fantasy (spec 32 §6) |
|---|---|---|---|---|---|
| affliction | `erosion` | slippery-slope, straw-mans-jab, festering-argument, currys-conversion, resonance-detonation, venom-and-vein, suppurating-curse | POISON, BLEED | MARK, TICK, RUPTURE, CLEANSE | Stack → extend → convert DoTs; inevitable erosion, detonated (RUPTURE finisher). |
| peroration | `oratory` | exordium, opening-statement, mounting-case, peroratio-interrupta, the-closing-word, practiced-cadence, captive-audience | PREMISE, PERORATION | DRAW, GUARD | Build the case premise by premise; periodic conclusion bursts; at 8 Premises they CONCEDE. |
| forge | `foundry` | sketch-of-a-thought, half-step, bootstrap-loop, ex-nihilo, the-overtake, anvil-of-form, entropy-tax | KINDLE, PIP | FORGE, DRAW | Manufacture dice from nothing, ripen the pips, one overwhelming turn (the-overtake spends ALL pips into RUPTURE). |
| akrasia | `penitent` | against-my-judgment, sweet-poison, self-flagellant, fallen-grace, pact-of-akrasia, crown-of-thorns, mirror-of-guilt | RECOIL, FALLEN | MARK, HEAL, CLEANSE | Pay in blood for undercosted power; two self-afflictions make you Fallen and the debt argues for you. |
| control | `standstill` | zenos-half-step, red-herring, undistributed-middle, arrow-paradox, paralysis-of-analysis, achilles-and-the-tortoise, quagmire-of-doubt | STAGGER, BACKFIRE | FORETELL, DRAW | Strip the rungs from every telegraphed blow; what cannot land, lands inward (BACKFIRE drips it down). |
| oracle | `augury` | glimpse, signs-and-portents, cassandras-burden, delphic-ambiguity, prophecy-fulfilled, the-oracles-eye, fated-course | FORETELL, OMEN | DRAW, RUPTURE | See the next move, declare it aloud, collect on every prophecy that comes true. |
| harvest | `tithe` | brief-candle, memento-mori, winnowing, the-gleaners-due, the-reaping, bone-orchard, the-tithe | SOUL, REAP | MARK, TICK, RUPTURE | Plant short afflictions, harvest Souls as they expire, swing the scythe when the bank is full. |
| charm | `grace` | soft-word, disarming-smile, common-ground, the-olive-branch, heart-of-the-matter, irresistible-grace, mirror-of-longing | SWAY, RAPPORT | CLEANSE, HEAL | The deck that never strikes: SWAY past their resolve, win by capitulation — or mercy (Befriend). |
| bulwark | `bastion` | brace-for-impact, nettle-cloak, tu-quoque, measured-answer, the-adamant-wall, hedgehogs-dilemma, crumbling-resolve | THORNS, RIPOSTE | GUARD, BARRIER, HEAL | Guard, thorns, riposte — stand behind the wall and let their own aggression kill them. |
| echo | `refrain` | refrain, second-thoughts, ad-nauseam, circular-reasoning, ouroboros, resonant-chamber, stuck-in-their-head | ECHO, REPRISE | CONJURE, DRAW | Nothing is said once: echo, reprise, replay — small effects, multiplied relentlessly. |

Card slots per theme: 2 common spells, 2 uncommon spells, 1 rare spell finisher,
1 rare enchantment, 1 rare disenchant. Rank ladder: Doxa/Lemma = common,
Thesis/Theorem = uncommon, Axiom/Aporia = rare. `cardType`: spell | enchantment |
disenchant (disenchant prints as CURSE and attaches to the ENEMY).
Starting deck for a fresh character: slippery-slope + brace-for-impact.

---

## 4. Resolution/timing notes auditors commonly get wrong

- **Floating dice ≠ Reserve dice ≠ kindled dice.**
  - *Floating* (FORGE): persistent pool, cap 3, joins every turn's tray, survives ACROSS
    combats (save-written), bypasses the draft and the 1-die rule (spend all in one turn),
    color-lawed, consumed forever when spent, **never banks tokens**, may NOT be banked to
    Reserve, feeds Resonance when spent.
  - *Reserve*: at `endTurn` the unspent drafted die banks here (max 2; overflow burns
    for ◆). Reserve dice **ripen +1 pip per threat phase survived (cap 2)** and can power
    PAID lines on later turns (color law applies). Pips empower riders / are spent by
    payoff verbs (the-overtake).
  - *Kindled* (KINDLE): temporary die, this combat only.
- **The 1-die rule is per ROLLED die, and it refreshes.** Applying a NEW status refreshes
  the applied die (the self-reinforcing chain, load-bearing doctrine) — so one drafted die
  can legally power several PAID plays in a turn if each lands fresh status. RUPTURE/REACT
  firing also refreshes it (spec 31 R9).
- **Press Fate** (`sig-press-the-point`, 4◆) rerolls ONLY spent/blocked (X-face) dice —
  usable dice stay put; with nothing rerollable it's a no-op that does NOT burn ◆
  (engine.ts:2981). The stance-guarantee removed from `rollTurnDice` still exists inside
  `rerollSpentDice` — Press Fate is the one place a stance die is nudged back.
- **Token accrual is at DRAFT, not end of turn.** `draftStanceDie` loops per unpicked
  rolled die (colored +1 / wild +2 / X +0). A die banked to Reserve at `endTurn` earns
  NOTHING; an unspent drafted WILD at endTurn burns for 2. Conviction income roughly
  doubled under the 3-die law — signature cadence is faster (flagged for tuning).
- **X dice are not always dead**: `float_x_die` (TRANSMUTE, on `bootstrap-loop`) turns a
  tray X into a WILD floating die (no X / pool at cap 3 → +1◆ instead); fate-tagged cards
  may be powered by an X die (acts wild). Otherwise X banks 0 and powers nothing.
- **Enchant/curse persistence (spec 32 v4)**: FREE line = a TIMED 3-round instance of the
  passive (tempZone / enemyTempAttachments; the card recycles through the deck); PAID line
  = the SAME passive made permanent (rest of combat), unique-in-play per name, leaves the
  deck cycle. Only the duration differs; a PAID play promotes a live FREE instance. The
  zone IS the hook registry (`zoneHas`, engine.ts:732) — passives are implemented at their
  trigger sites, gated by zone membership.
- **Telegraphs / threat sequences**: every enemy has a threat sequence — authored and
  deterministic for all 61 library enemies (`combat.threat-sequences.ts`), else a generated
  3-phase rotation off its dominant stance. Each phase declares a HIDDEN stance, a damage
  weight, and optional threat debuffs. The drafted die's color is the read of the hidden
  stance; `sig-read-opponent` (1◆) or FORETELL/oracle effects reveal it
  (`isPhaseStanceRevealed`). `fated-course` (D) FORCES the telegraph to the predicted stance.
- **CAPITULATE is a resolve threshold, not the HP bar**: SWAY ≥
  min(max(10, 0.35 × maxHP), currentHP), checked eagerly on gains and at turn boundaries.
  SWAY decays 1/turn unless `irresistible-grace` is in play (which also enables the
  compounding `buff_grace_momentum` SWAY multiplier).
- **Burst caps**: RUPTURE = max(80, 25% enemy maxHP); REAP = max(200, 25% maxHP).
- **Color-match bonuses are near-vestigial**: +3 flat damage and +1 duration on match are
  now near-unconditional (every legal play matches under the color law; only fate-X
  doesn't) — treat as folded-in numbers when reading transcripts.
- **Known dead line**: `tu-quoque` authors `dieBonus onColor:'body'` on a HEART card —
  can never fire under the color law (lint-whitelisted, owner audit pending).
- **Known curve violators (seed-1 greedy)**: `standstill` (flat 1.00 at all stages) and
  `refrain` (1.00/1.00/0.92) FAIL the starter decay doctrine; `grace` and `oratory` pass
  post-rework. Late-stage walls per keyword-atlas: durationed DoTs decay before eroding
  1,000+ HP bosses (Affliction), pip engine lacks an uncapped spender (Forge), Bulwark
  cannot kill non-attackers, Tithe's rebuild cycles outlast fights.
- **No retreat, no fatigue**: combat resolves only by win/loss/alt-win; deck exhaustion
  reshuffles the discard.

---

## 5. Enemy stage rosters (`combat.stage-profiles.ts`)

Stage = frozen player power + deck maturity gate + enemy roster. `--stage <id>` /
`--stage=<id>` and `--enemy <slug>` use these exact values.

| stage id | name | player | eligible cards | enemy slugs |
|---|---|---|---|---|
| `early` | The Shallows | L3, stats 5/5/5, 90 HP | tier ≤1, rank-maturity ≤3 | grave-larva, foot-stealer, little-belle, water-holger, the-butcher, king-of-revenge |
| `mid` | The Long Road | L20, stats 17/17/17, 255 HP | tier ≤2, rank-maturity ≤20 | tri-eyes, mirac, hasshaku-sama, jeweled-tree, rawhead-rex |
| `late` | The Deep Wood | L45, stats 37/39/38, 570 HP | tier ≤3 | fire-giant, rangda, tezcatlipoca, arch-demon, death, the-abortive |
| `impossible` | The Unprovable | L50, stats 40/44/42, 630 HP | tier ≤3 | the-incompleteness (losing here is the design) |

Bosses escalate 1.6× faster on the threat clock. Doctrine witnesses in sim output:
`statusEngagement`, `dotHpFraction` (plus `mechanicBurstFraction`,
`avgActiveEffectsPerPhase`); `--cards` exposes dead cards.

### Sim invocation (for the fan-out)

```
cd axiomancer-mechanics && npm run combat -- --auto --policy status --stage early --deck preset:erosion --seed 3 --max-turns 14
cd axiomancer-mechanics && npm run combat-playtest -- --stage=early --policy=blind --deck=preset:erosion --runs=30 --seed=1 --cards
```

(`npm run combat` flags space-separated; `combat-playtest` flags use `=`.
Policies: naive|safe|aggressive|status for `combat`; greedy|blind for playtest.)
