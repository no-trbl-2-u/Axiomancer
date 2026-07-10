# THEME AUDIT — charm (preset `grace`) — SNOB lens, 2026-07-10

Auditor: mechanics-expert (charm cell of the tuning-audit fan-out). Read after
`tuning-audit/dossier.md` and `tuning-audit/baseline.md`; this report does not re-derive rules.

**Verdict up front.** Charm is the only theme whose alt-win actually fires — and it is
still not the theme it says it is. As played, `grace` is a Conviction-signature poison
deck with a mute number crawling up in the corner. The capitulation "mercy" win is, at
mid stage, delivered by poisoning the enemy to the brink of death until the SWAY bar
meets the falling `currentHP` clamp. The player makes approximately one real decision
per fight (when to cash `heart-of-the-matter`), the enemy has zero interaction with
SWAY, and the theme's two hallmarks — SWAY and RAPPORT — never touch each other.
Identity as flavored: 9/10. Identity as played: a rounding error of charisma on top of
somebody else's poison. Distinct 4, engagement 3.

## 0. How this was played (methodology + a tooling finding)

Sim budget: 7 invocations.

1. `npm run combat -- --auto --policy status --stage early --deck preset:grace --enemy the-butcher --seed 3 --max-turns 14` (CLI, confirms baseline's no-transcript gap)
2. Custom transcript harness (copy of the CLI's `autoPlayPhase`, every engine event
   printed; saved as `tuning-audit/transcript-harness.charm-audit.ts`), same fight — full event log
3. Same harness with **turns-per-phase capped at 1** (the interactive CLI's real cadence), the-butcher, seed 3
4. Harness cap-1, `rawhead-rex`, mid, seed 5
5. `npm run combat-playtest -- --stage=early --policy=blind --deck=preset:grace --runs=30 --seed=1 --cards`
6. Same at `--stage=mid`
7. (re-run of 2 to persist the log)

**Tooling finding the whole fan-out must carry: the auto drivers take unbounded player
turns per enemy phase, and the engine permits it.** `startTurn`
(`src/Combat/combat.engine.ts:411-416`) gates only on `phase-play` + no live draft — there
is no one-turn-per-phase rule anywhere in the engine. The CLI auto loop re-rolls up to
`maxTurns × 6` times per phase (`src/CLI/combat.cli.ts:271`); the playtest sim up to 60
(`src/Combat/combat.encounter.sim.ts:213`), exiting only when hand AND dice are empty
(`combat.encounter.sim.ts:282`). My seed-3 Butcher fight ran **177 player turns across 3
enemy phases** — the bot farmed Conviction off unpicked dice (~2◆/roll, dossier §4) and
cast `sig-overwhelming-argument`/`sig-conviction-strike` **~50 times** while the enemy got
3 swings. The interactive loop (`combat.cli.ts:397-482`) gives exactly ONE `startTurn` per
phase. Every quantitative claim in the baseline and in every theme cell rides on this
farming exploit; where it matters below I quote both the stock ("farmed") and the
capped-1 ("honest") runs. If the mobile UI enforces one turn per phase, the sims measure
a game nobody plays; if it doesn't, the game has an infinite-Conviction exploit.

## 1. The ten cards (7 preset slots), as written

`src/Cards/cards.library.ts:1056-1200`; effects in `src/Effects/debuffs.library.json:101-120`
(`debuff_rapport`, −10% outgoing damage/stack, dur 2) and `src/Effects/buffs.library.json:942-960`
(`buff_grace_momentum`, +12% SWAY gain/stack).

| card | stance | FREE line | PAID line |
|---|---|---|---|
| soft-word ×4 | heart | heal 2 | SWAY 3 (+1 on heart die) |
| disarming-smile ×4 | heart | SWAY 1 | RAPPORT i2 d2 + heal 2 |
| common-ground ×2 | heart | draw 1 | SWAY 2 + RAPPORT i1 d2; threshold heart-3: +SWAY 2 |
| the-olive-branch ×2 | **body** | guard 2 | SWAY 3 + cleanse 1 + heal 3 |
| heart-of-the-matter ×1 | heart | SWAY 1 | SWAY 6 ×ECHO (+heal 4; threshold heart-5: +SWAY 4) |
| irresistible-grace ×1 | heart | 3-round: SWAY stops decaying + momentum stacks | same, permanent |
| mirror-of-longing ×1 | heart | 3-round curse: prevented damage → SWAY | same, permanent |

Note what is absent: any way to not die. Total prevention in 15 cards: `the-olive-branch`'s
FREE guard 2. Total enemy-facing pressure: RAPPORT −10..20%. The deck's plan is to stand
in front of an axe and be winsome at it.

## 2. As played — the transcripts

### 2.1 Farmed (stock auto, seed 3, the-butcher 95 HP, elite): "capitulate" in 3 phases, 177 turns

Outcome `capitulate`, player 34/90, enemy **25/95**, SWAY 26. The threshold is
min(max(10, 33.25), currentHP) — and the fight ended the instant a **poison tick**
dropped the enemy to 25, below the stagnant SWAY 26:

```
· threat-fired {"phaseIndex":3,...}
· dot-tick {"effectId":"debuff_poison","label":"Poison","amount":30,"target":"enemy"}
· combat-ended {"outcome":"capitulate"}
```

The enemy lost 70 HP; **all 70 to `sig-conviction-strike` poison** (off-theme, funded by
farmed Conviction — ~15 casts, plus ~35 `sig-overwhelming-argument`). Card-sourced SWAY
across the entire fight: 26. The theme's contribution to its own signature win was to
hold the bar still while the poison lowered the goalposts onto it. "The deck that never
strikes" wins by striking, in the passive voice.

The same transcript contains the theme's ugliest recurring beat. Turn 2, tray =
`x / body / x`. Six charm cards in hand, six heart tops needed, zero heart dice:

```
>> PAID mirror-of-longing FIZZLED -> FREE-TOP instead
  · effect-fizzled {"message":"a body die cannot power a heart card — colors must match"}
>> PAID soft-word FIZZLED -> FREE-TOP instead        (heal 2)
>> PAID disarming-smile FIZZLED -> FREE-TOP instead  (sway 1)
>> PAID disarming-smile FIZZLED -> FREE-TOP instead  (sway 1)
>> PAID irresistible-grace FIZZLED -> FREE-TOP instead
```

The whole hand torched as FREE-line confetti in one turn. This is the owner's
"weak chip FREE line" complaint in its terminal form: charm's free lines don't even
chip — they drip.

### 2.2 Honest (1 turn/phase, seed 3, the-butcher): **defeat in 4 phases, enemy untouched at 95/95**

`scratchpad/grace-early-cap1.txt` (reproduce via the harness, cap arg 1). Player took
10 → 11 → 17 → 23 (escalation clock) and died with **SWAY 20 of 33.3** and guard 0 at
every single threat. Phase 2 is the color-law trap again — tray `x/body/x`, and the bot
burned SIX heart cards including the deck's one finisher:

```
>> PAID heart-of-the-matter FIZZLED -> FREE-TOP instead
  · sway-gained {"amount":1,"total":6}
```

The 17-SWAY Axiom, cashed for 1. (It did it again at mid, seed 5, phase 3.) A human
would hold the hand instead — and then do literally nothing that turn, because charm has
no off-color line at all: a body/mind die can't power anything, Reserve-banking a
body die is dead weight for this deck too (Reserve dice are color-lawed, dossier §4),
and the only remaining verb is scrap-for-1◆. ~30% of all turns ((2/3)³ = 29.6% of
3-die rolls contain neither heart nor wild) are structurally blank for a mono-heart deck.

The one felt spike in the whole audit, seed 5 mid, phase 1: `heart-of-the-matter` on a
heart die — `sway-gained {"amount":12}`, 3→15 in one play. That is the card doing what
the theme should feel like everywhere. It happens roughly once per fight, when the
color gods permit.

### 2.3 Honest, mid (rawhead-rex, 570 HP, seed 5): defeat in 3 phases, SWAY 20 of **199.5**

Threshold = 0.35 × 570 = 199.5. Honest SWAY income is 3-6/phase before decay. The honest
theme cannot capitulate a big mid enemy inside any survivable horizon — the only route is
the `currentHP` clamp, i.e., nearly kill them by other means. Meanwhile Rawhead hit for
42/45/70; the player died before the third swing landed twice.

### 2.4 The matrix cells (blind policy, preset:grace, 30 runs/enemy, seed 1)

| stage | win | win path | rounds | statusEng | dom |
|---|---|---|---|---|---|
| early (6 enemies) | **100%** | cap=180 of 180 | 1.4–3.7 | 33% | **100% sig-conviction-strike** |
| mid (5 enemies) | **97%** | cap=146, def=4 | 6.1 | 34% | **100% sig-conviction-strike** |

- **Curve violation, overperforming:** doctrine says early ~80%, mid ~50%
  (`axiomancer-mechanics/CLAUDE.md`, 2026-07-08 doctrine). Measured 100/97. The dossier's
  "grace passes post-rework" (dossier §4, seed-1 greedy) does not survive this witness —
  the pass appears to be an artifact of which harness you ask. Both harnesses inherit
  the turn-farming inflation; honest cadence flips early elites to losses (§2.2). Grace
  doesn't sit near the curve — it straddles it grotesquely depending on turn structure.
- **dom=100% sig-conviction-strike in every cell**: literally all enemy HP loss in every
  grace fight is one off-theme signature. The deck itself removes zero HP — correct under
  doctrine (charm shouldn't kill) but it means the capitulate clamp is being dragged down
  exclusively by a non-card, non-theme button.
- **mercy = 0 in all 330 runs.** The theme whose spec-32 fantasy line ends "— or mercy
  (Befriend)" contains no Befriend line, and `sig-disarming-plea` — the charm-flavored
  mercy signature (`src/Combat/combat.signature.ts:56-60`) — is unreachable by every auto
  policy: both `bestAutoSignature` (`combat.cli.ts:257`) and the sim's `bestSignature`
  cast only `['dot','strike','control']` kinds. The mercy deck's mercy button has never
  been pressed by any bot in ~1,600 measured fights.
- **`statusEngagement` is blind to SWAY.** `statusLands` counts only
  `effect-landed → enemy` (`combat.encounter.sim.ts:239,311`); `sway-gained` is a different
  event. Witness the usage table: `soft-word` 1,085 bottom plays, **0 statusLands**;
  `heart-of-the-matter` 324, 0. Charm's reported 33% engagement is entirely
  disarming-smile/common-ground RAPPORT. The doctrine's own fun-meter cannot see this
  theme's hallmark verb — fix the metric before tuning to it.

### 2.5 Per-card usage (mid cell, 30×5 runs)

| card | plays | bottom | top | statusLands |
|---|---|---|---|---|
| disarming-smile | 1516 | 1161 | 355 | 1161 |
| soft-word | 1376 | 1085 | 291 | 0 |
| common-ground | 769 | 607 | 162 | 607 |
| the-olive-branch | 764 | 628 | 136 | 0 |
| heart-of-the-matter | 390 | 324 | 66 | 0 |
| irresistible-grace | 250 | 102 | **148** | — |
| mirror-of-longing | 182 | 129 | 53 | 0 |

Nothing is unplayed (a 15-card deck reshuffles), but two cards are dead in function:

- **`mirror-of-longing` converts prevented damage — in a deck with 2 points of
  prevention.** Across the seed-3 farmed fight its total output was one `sway-gained
  {"amount":2}` (phase-2 threat, olive-branch's free guard 2). It is a Bulwark card
  mailed to the wrong theme; in `bastion` it would sing.
- **`irresistible-grace`'s FREE line strictly dominates its PAID line as played** (148 top
  vs 102 bottom even for bots): the free 3-round timed instance covers most of a 2-6
  round fight, costs no die, and recycles. Nobody should pay a heart die to make
  permanent what expires after the fight ends anyway. This is the owner's FREE/PAID
  signal inverted — here the FREE line is too good relative to PAID, same disease,
  other symptom: the fork is not a decision.

## 3. Judgment

**Identity as played:** *hold a number still while something else lowers the target onto
it.* The fantasy verb should be "win them over"; the played verb is "wait, on-color, for
permission to add 3."

**Nearest neighbor:** affliction (`erosion`). 100% of grace's HP pressure is a ramping
poison DoT; SWAY functions as a second, slower DoT clock that ticks only on heart dice
and interacts with nothing. It is erosion with worse defenses and a prettier win screen.
(It is decisively NOT the read/telegraph theme its "heart" flavor implies — oracle owns
that — and its banking loop is shallower than harvest's.)

**Where the player thinks:** once per fight — when to cash `heart-of-the-matter` against
the heart-resonance-5 threshold (spec 31 R1). Marginally: whether to scrap dead-color
cards for ◆. **Everywhere else is autopilot:** draft heart-or-wild if present (else the
turn is void), play sway cards in any order (no sequencing matters), cast the signature
whenever ◆ ≥ 7. The enemy cannot resist, strip, or respond to SWAY; the player cannot
rush, protect, or leverage it. SWAY decay (1/turn) is noise, and the deck's own
enchantment deletes even that from its FREE line.

**Setup→payoff arc:** one spike exists (heart-of-the-matter, §2.2) and it is real — 12-17
SWAY in a breath. Everything else is a linear crawl with no visible milestones. Compare
Spirit Island (KB: `BoardGames/games/spirit-island/rules/scoring-endgame.okf.md`): Fear is
the same "win by pressure, not kill" currency, but it cashes into **fear cards
(intermediate rewards) and Terror Levels that visibly change what victory means**
mid-fight. The KB's reception note calls this out explicitly: "Dynamic victory
conditions align theme and mechanics: fear changes what victory means." Grace's resolve
bar changes nothing until the frame it ends the fight.

**Counterplay/tension:** none, in either direction — and prior art shows exactly the
missing knob. Dawncaster's **Charmed** (KB:
`DigitalCardGames/dawncaster/keywords.csv`, keyword `charmed`, class *Instakill*): "Lose
the battle if your Health is less than your Charmed stack. **When dealt non-Piercing
damage, remove an equal amount of Charmed.**" Same threshold-vs-HP race as CAPITULATE —
but damage *strips* charm, so both sides are always trading against the clock and the
charmer must protect the stack. Axiomancer copied the threshold and forgot the fight.

**What it is MISSING:** (1) any enemy interaction with SWAY; (2) milestones on the track;
(3) a native reason RAPPORT exists (it neither protects enough to matter nor feeds
SWAY); (4) a survivability identity that isn't "borrow the signature kit"; (5) its
advertised Befriend line; (6) an off-color turn that is a decision rather than a void.

## 4. Proposals

All build on the locked dice law and doctrine. Each targets decision texture.

**P1 — Resolve milestones ("Terror Levels for mercy").** Two fixed SWAY thresholds per
enemy at ⅓ and ⅔ of the capitulate threshold, telegraphed on the enemy frame as a
resolve bar with ticks. **Wavering (⅓):** the enemy's phase stance is permanently
revealed (they can no longer meet your eye) — charm buys the read the dice law made
precious. **Faltering (⅔):** permanent RAPPORT 1 + their telegraph loses 1 rung.
Prior art: Spirit Island Terror Levels (KB, scoring-endgame). Every sway play now moves
toward a visible state change; the crawl becomes an arc with two felt clicks before the
finish. Effort M (engine: two zone-like flags keyed off `state.sway`; UI: bar ticks).

**P2 — Recanting: damage strips SWAY, and decay dies.** Delete the passive 1/turn decay
(it is noise). Instead, when the enemy's threat phase damages the player, the enemy
*recants*: lose SWAY equal to ~15% of damage dealt (round down). Direct inversion of
Dawncaster's Charmed-strip (KB, keyword `charmed`). Suddenly RAPPORT, guard, and the
olive-branch exist for a reason — protecting the stack IS playing charm — and eating a
70-point Rawhead swing costs you 10 resolve of progress, which is tension you can see
coming on the telegraph and play around. `irresistible-grace` PAID line becomes the
ratchet: "SWAY cannot fall below your highest milestone (P1)" — now permanent is worth a
die, fixing that card's inverted FREE/PAID fork. Effort M.

**P3 — FREE lines lay foundation (owner signal, applied to charm).** Replace the drip
FREE lines with primers that set up ANY paid line: `soft-word` FREE → "OPENNESS 2: your
next SWAY gain this turn +2"; `disarming-smile` FREE → "their next hit deals −3 (once)"
(protects the stack under P2); `heart-of-the-matter` FREE → "your next heart die grants
double resonance" (accelerates its own threshold). `common-ground` keeps draw. Off-color
turns become setup turns instead of voids: fizzle-into-free now *builds toward* the next
heart die rather than wasting the hand — the 30% blank-roll turns become the theme's
inhale. Effort M (card payloads + one `nextSwayBonus` payload flag).

**P4 — `mirror-of-longing` retarget.** "Damage RAPPORT prevents converts to SWAY"
(computed at threat resolution: rapport reduction amount → `gainSway`, keeping the
momentum multiplier routing at `combat.engine.ts:2419-2423`). One-line conceptual change;
welds the theme's two orphaned hallmarks into a loop: smile (RAPPORT) → they soften →
the softening persuades (SWAY). Kills a functionally dead card without new rules. Effort S.

**P5 — Capitulation must be earned by a charm play + floor retune.** CAPITULATE checks
only on SWAY *gains* from player charm sources, not passively at turn boundaries when
poison lowers `currentHP` under a stagnant bar (change the `swayCapitulates` call sites
at `combat.engine.ts:1081/2180/2475/2819` to gain-triggered only). The winning frame is
then always a card the player chose — the spike is authored, not ambient. Pair with
raising the small-enemy floor (max(10,…) → max(16,…) or 0.35→0.4 below 60 maxHP) so
early capitulation stops being a 100% formality (doctrine wants ~80%). Effort S
(plus a tuning pass).

**Metric fix (blocking, cheap):** count `sway-gained` from card plays as a status land in
`combat.encounter.sim.ts` (§2.4) — until then every charm tuning run is graded by a meter
that cannot see the theme.

## 5. Scores

- **Distinct: 4/10.** The only theme whose alt-win fires (180/180 early, 146/150 mid —
  genuinely unique outcome), but the process of getting there is another theme's poison
  engine plus a bar that nothing in the game touches.
- **Engagement: 3/10.** One authored decision per fight; ~30% of turns structurally
  blank under the color law; win moment frequently delivered by an off-screen tick.
  Below "competent but forgettable" because the forgettable version would at least let
  you feel the win you chose.

---
*Artifacts: full farmed transcript `scratchpad/grace-early-transcript.txt`; honest runs
`grace-early-cap1.txt`, `grace-mid-cap1.txt` (session scratchpad); harness copy at
`tuning-audit/transcript-harness.charm-audit.ts` (args: enemy stage preset seed maxTurns turnsPerPhaseCap).*
