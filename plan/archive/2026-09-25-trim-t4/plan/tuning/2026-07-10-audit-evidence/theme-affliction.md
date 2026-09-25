# THEME AUDIT — AFFLICTION (`erosion`) — the house vanilla, played for three turns

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Theme: **affliction** · preset `erosion` ·
hallmarks POISON / BLEED. Evidence: 6 sim invocations (2 auto transcripts + 2 state-log
re-runs of the same seeds + 2 playtest matrix cells with `--cards`), the 7 preset cards in
`src/Cards/cards.library.ts:34-186`, effect defs in `src/Effects/debuffs.library.json:3-59`,
engine hooks in `src/Combat/combat.engine.ts`, and the Dawncaster corpus in
`kb/KnowledgeBase/DigitalCardGames/dawncaster/`.

**Methodological recovery worth stealing:** the baseline said auto-mode transcripts don't
exist. They do — `--state-log <path>` (combat.cli.ts:33) writes JSONL whose final entry
embeds the complete `state.log` (483 events for the early fight). I rendered both fights
turn-by-turn from it. Every quote below is from a real event stream, not inference.

---

## 0. A contaminating discovery every auditor must carry

The two auto transcripts exposed a structural divergence the dossier's phase model hides:

- **Interactive play** (combat.cli.ts:436-474): the player takes ONE dice-turn (one roll of
  3, one draft), then `resolveThreatPhase` fires. One player turn per enemy phase.
- **Auto CLI** (`autoPlayPhase`, combat.cli.ts:271): loops `startTurn`/`endTurn` up to
  `phaseTurnLimit × 6 = 84` dice-turns *inside one enemy phase* before the threat resolves.
- **Playtest sim** (`policyPlayPhase`, combat.encounter.sim.ts:199-213, guard < 60): same
  multi-turn farm, exiting only on hand+dice exhaustion.

Measured consequence: my "1-phase" early fight is **59 dice-turns** long; the "3-phase" mid
fight is **177 dice-turns**. The bot farms Conviction from unpicked dice for dozens of
enemy-free turns and metronomes signatures. Either the sims misrepresent the shipped game,
or the shipped game allows infinite token farming — both readings are disqualifying for
the numbers everyone is tuning against. I flag it, weigh my transcripts accordingly, and
proceed; the systems auditor should own the fix.

---

## 1. The kit, as printed

| card | rank/type | PAID line | FREE line | engine |
|---|---|---|---|---|
| `slippery-slope` ×4 | Doxa spell (body) | POISON i1 (ramping, d4) | tickOne | debuffs.library.json:4-31 (rampFactor 0.5) |
| `straw-mans-jab` ×4 | Lemma spell (body) | BLEED i2 d2; body-die rider +1 int | tickOne | cards.library.ts:52-69 |
| `festering-argument` ×2 | Thesis spell (mind) | +1 duration to ALL enemy DoTs | tickOne | engine.ts:1593 `extend_dots` |
| `currys-conversion` ×2 | Theorem spell (mind) | swap bleed↔poison, +1 int each | draw 1 | engine.ts:1609 `convert_dots` |
| `resonance-detonation` ×1 | Axiom spell (heart) | RUPTURE +50% + SIPHON 35% + REPRISE 2 fireFree | tickOne | cards.library.ts:107-148 |
| `venom-and-vein` ×1 | Axiom enchant | every bleed/poison lands +1 int, +1 dur | (timed 3-round) | engine.ts:1326-1350 |
| `suppurating-curse` ×1 | Aporia curse | enemy DoT throughput DOUBLED, rest of combat | (timed 3-round) | engine.ts:2537-2548 |

On paper this is a competent Dawncaster-Rogue homage: stack, extend, convert, detonate.
The `resonance-detonation` rework (rupture → siphon → reprise-fireFree replant) is the
single best-designed payoff loop in the 70-card library. On paper.

## 2. As played — the transcripts

### Early, seed 3, Little Belle 40 HP (status policy) — 59 turns, "Phases: 1"

The entire card game happens in turns 1-3:

```
== TURN 1 == roll: [x, wild, wild]      draft wild
  PLAY straw-mans-jab [PAID]  -> debuff_bleed i2      (die refreshed)
  PLAY slippery-slope [PAID]  -> debuff_poison i1     (die refreshed)
  PLAY suppurating-curse [PAID] -> CURSE attached     (die spent)
== TURN 2 == roll: [x, body, x]         draft body
  PLAY straw-mans-jab [PAID]  -> die-bonus +1 int -> debuff_bleed i5
  PLAY currys-conversion [FREE] -> draw 1
  PLAY venom-and-vein [PAID]  -> enchant
== TURN 3 == roll: [x, body, x]
  PLAY resonance-detonation [FREE] -> tick debuff_bleed 15
```

Then **turns 4-59 contain zero hand plays.** Fifty-six consecutive turns of: draft, bank
+1/+2 Conviction per unpicked die, and every ~2-3 turns cast `sig-conviction-strike` (7◆,
poison i4→i7→i10) or `sig-overwhelming-argument` (8◆, backfire i10). Turn 54 rolls
`[wild, wild, wild]` — the jackpot roll — and the "decision" is identical to turn 49's
`[x, x, x]`: bank, cast, wait. The enemy acts ONCE, at turn 59, and dies to the phase-end
ticks (`tick debuff_bleed 15`, `tick debuff_poison 30`). Attribution: Conviction Strike
648 of 728 DoT (**89%**); the seven-card theme kit delivered 80.

Note also turn 3: the policy burned the deck's one-copy rare finisher for its FREE
`tickOne` line — 15 damage — because the fork invites it. More below.

### Mid, seed 5, Tri-Eyes 375 HP — 177 turns, "Phases: 3"

Turns 1-3 are, for once, genuinely lovely — quote in full because this is the theme's
whole promise delivered in nine seconds:

```
== TURN 2 == roll: [x, wild, x]         draft wild
  PLAY slippery-slope [PAID]     -> debuff_poison i4
  PLAY resonance-detonation [PAID]
    rupture-detonated {"amount":94, "consumed":["debuff_bleed","debuff_poison"]}
    soul-gained 2 · heal 33 (SIPHON)
    -> REPRISE returned=[straw-mans-jab, straw-mans-jab]
```

Burst at the cap (94 = 25% of 375, engine cap max(80, 25% maxHP)), a third of the burst
back as HP, two jabs back in hand to replant. That is a real spike, and it is the only
one the fight will ever produce. Because immediately:

```
== TURN 3 ==
  PLAY straw-mans-jab [FREE]      (tickOne on an EMPTY board — no event, no effect)
  PLAY straw-mans-jab [FREE]      (same nothing)
  PLAY festering-argument [PAID die=t3-d0] -> EXTEND +1 on []   (die spent)
```

Three plays after the detonation: two FREE tick-nothings (rupture ate every DoT, so
`tickOne` no-ops silently) and a **mind die paid to extend an empty board** —
`extend_dots` (engine.ts:1593) has no fizzle guard; it consumed the die and printed
`affected: []`. Then turns 4-177: the identical conviction-farm loop, Conviction Strike
poison i10 forever, threat fires at turns ~59/118/177. Attribution: Conviction Strike
1,352 of 2,087 DoT (65%), Overwhelming Argument logged over "38 phases" in a 3-phase
fight (the attribution ledger counts ticks as phases — baseline caveat 3 confirmed).

### Matrix cells (blind, 30 runs, `--cards`)

| stage | win | doctrine target | rounds | statusEng | dotFrac | dom |
|---|---|---|---|---|---|---|
| early (6 enemies) | **100%** | ~80% | 1.6 | 51% | 64% | **straw-mans-jab 78%** |
| mid (5 enemies) | **77%** | ~50% | 3.3 | 50% | 74% | straw-mans-jab 71% |

Mid is a lie of averages: tri-eyes/hasshaku/jeweled-tree 100%, mirac 70%,
**rawhead-rex 13%** (4/30). The variance lives in the enemy script, not in player skill —
exactly the baseline's greedy=blind finding, reproduced at theme scale. Erosion
overperforms the doctrine curve at both stages (a tuning failure by the owner's own law),
and its alt-win row is sterile: vic=295, cap=0, con=0, mer=0.

Per-card usage (mid, 30×5 runs):

| card | plays | bottom | top | statusLands |
|---|---|---|---|---|
| straw-mans-jab | 866 | 847 | 19 | 847 |
| slippery-slope | 745 | 684 | 61 | 684 |
| currys-conversion | 473 | 288 | **185** | **0** |
| festering-argument | 422 | 303 | 119 | **0** |
| resonance-detonation | 214 | 152 | **62** | **0** |
| suppurating-curse | 169 | 116 | 53 | 0 |
| venom-and-vein | 151 | 116 | 35 | 0 |

Read that statusLands column: in a status-is-the-fun game, **five of seven affliction
cards register zero status landings** — the telemetry (and the feel it proxies) credits
only the two commons. And the one-copy finisher was burned on its FREE tick line 62
times — 29% of all its plays.

## 3. Judgment

### Identity as played

*"Plant two cheap DoTs, detonate at the cap by turn 2, then spectate."* The fantasy is
inevitable erosion — the slow certainty of Dominion's Witch or StS Catalyst-poison
turning the corner. The play is frontload-and-forget: the ramping poison
(`rampFactor 0.5`) mathematically wants long fights, the rupture cap wants short ones,
and the cap wins every time. Nothing in this deck gets better on turn 5 than it was on
turn 2.

### Nearest neighbor

**Harvest (`tithe`).** Both plant short afflictions and win by consuming them
(RUPTURE eats stacks; REAP eats the Souls their expiry mints — my mid transcript even
shows erosion generating Souls it can't spend: `soul-gained {"amount":2}` on rupture).
Erosion is Harvest with the bank account deleted: consume-now versus consume-later is
the *only* axis separating them, and erosion's cap removes the "later." Meanwhile the
theme the flavor promises — Dawncaster's Sinister rogue, where poison/bleed occupy
different clocks — is not the theme the engine delivers, because here bleed and poison
are the same clock with different hats (both tick at phase boundaries; decay-vs-ramp is
an accounting detail no card exploits).

### Where the player thinks

Three genuine decisions exist, all in turns 1-3:

1. **Rupture timing** — the one real one, and the cap poisons it: at mid, two turns of
   fuel already reach the 94-HP ceiling, so "detonate ASAP, rebuild, repeat" strictly
   dominates savoring the ramp. The correct play is known before the fight starts.
2. **Curse/enchant sequencing** — suppurating-curse (double throughput, permanent) is
   correct on turn 1 with any die, every game. Venom-and-vein is play-on-sight. These
   are rituals, not choices.
3. **Body die routing** — straw-mans-jab's `dieBonus onColor:'body'` (+1 int) is the one
   place the dice law creates theme texture: a body die is worth more on the jab than a
   wild is. The transcript shows it mattering (turn 2 early: i2→i5). Nobody will ever
   notice, because nothing telegraphs it.

Everything else is autopilot, and the autopilot is measured: 56 of 59 turns (early) and
~174 of 177 (mid) contain no hand play.

### What is MISSING

- **A reason to wait.** Setup→payoff arcs need the payoff to grow with the setup. The
  RUPTURE cap (max(80, 25% maxHP), engine constant) means fuel beyond ~2 turns is wasted;
  the printed poison ramp — the theme's signature curve — is decoration. Wildfrost's
  charge counters and Monster Train's Morsel engines work because the number you're
  growing is unbounded until spent; erosion's number hits its ceiling before the enemy
  telegraph even matters.
- **An enemy that fights back against the stack.** No mid/late enemy cleanses, stanches,
  or punishes DoTs. Dawncaster prices its affliction archetype against **Ward** ("prevented
  with a Ward") and cleanse effects; StS poison decks fear Artifact and time-pressure
  flights. Here the stack, once planted, is a bond coupon. Zero counterplay = zero tension.
- **A bleed/poison distinction that does work.** Dawncaster: Bleeding triggers per
  damage instance, Poison per card played — so *Blood Fever* ("convert all enemy Poison
  into Bleeding") is a real tempo decision, and *Bloodlust*/*Festering Wounds* gate riders
  on which one is up. Curry's Conversion swaps both directions simultaneously
  (engine.ts:1616-1617) — it is literally a label shuffle with +1 attached. The FREE draw
  line outplays the PAID line in the usage table (185 top vs 288 bottom at mid; 95 vs 78
  early) — the bot has correctly determined the card's signature effect is worth less
  than one card.
- **Visibility of the engine.** Suppuration doubles all throughput via one unlabeled
  drip event; festering/venom/conversion show 0 in every ledger; the rupture preview vs
  cap is nowhere. The player cannot anticipate a payoff the UI doesn't let them watch
  filling up.
- **The CLEANSE the theme's family promises** (dossier §3 lists it) is absent from the
  preset — mid enemies poison YOU (`tick debuff_poison 7 -> self`, mid transcript
  turn 177) and erosion has no answer, not even a token one.

### FREE/PAID, where it bites here

Four of five spells share the identical FREE line (`tickOne`), which is a *chip*: it
converts existing board weakly into damage, no-ops silently on an empty board (mid
turn 3, twice), and on the one-copy finisher it is a **trap** the bot fell into 62 times.
This is precisely the fork the owner wants dead — except affliction's FREE line isn't
even a "low basic damage" chip, it's sometimes a zero. The fix writes itself: in this
theme, FREE should **plant** and PAID should **exploit** (see P3).

## 4. Scores

- **Distinctness: 4/10.** It is the doctrine's vanilla — the deck every other theme is
  implicitly compared against — and its one distinct move (detonate-siphon-replant) is
  mechanically Harvest-without-a-bank. The two hallmark DoTs are interchangeable in play.
- **Engagement: 3/10.** Three good turns (mid turn 2 is legitimately the best moment I
  found in this audit), then a measured 97% autopilot tail, a payoff capped before the
  arc begins, five of seven cards invisible to the fun-metric, and 0 alt-wins in 330 runs.

## 5. Proposals

**P1 — Put bleed and poison on different clocks (keyword tweak, M).**
BLEED ticks **when the enemy's threat fires** (front-loaded, decays, cashes before their
hit lands); POISON keeps its between-phases ramp. Now the stance-read and the telegraph —
the hidden-information layer the baseline proved worthless — couple to the theme: a
scouted big phase makes bleed-loading correct, a stall phase makes poison correct.
Rework `currys-conversion` to a **directional choice**: "Choose one — all bleed becomes
poison +1 (settle in), or all poison becomes bleed +1 (cash out before their turn)."
Prior art: Dawncaster *Blood Fever* is one-directional for exactly this reason; Bleeding
(per-hit) vs Poison (per-card) clocks are what make its converts real decisions.
Respects the dice law untouched; multiplies decision texture on three existing cards.

**P2 — Uncap rupture by patience, not printing (tuning, S).**
Replace the flat RUPTURE cap with `cap = 3 × the round's pending DoT tick total`
(pending total already computed — `getPendingDotTotal`, used by the fate tap at
encounter.sim.ts:268). Detonating turn 2 now undershoots; letting poison ramp under
threat pressure grows the ceiling. The doctrine keeps its anti-oneshot guard, the theme
gets its arc back, `festering-argument` (extend) becomes a payoff *amplifier* instead of
0-statusLands glue, and the late-game wall (durationed DoTs vs 1,000-HP bosses,
dossier §4) erodes for the right reason. Add a fizzle guard to `extend_dots`
(engine.ts:1593): no DoTs → refuse the die, like the convert guard one case below it.

**P3 — FREE plants, PAID exploits (card rework, M — the owner's signal, executed).**
Replace the four copy-paste `tickOne` FREE lines: `slippery-slope` FREE → POISON i1
(seed); `straw-mans-jab` FREE → MARK 1 (the family utility the preset never uses);
`festering-argument` FREE → +1 duration to ONE DoT; `resonance-detonation` FREE →
"TICK each enemy DoT once" (a real pre-detonation rehearsal, never a trap discard of
your finisher). Now a dieless turn builds the board the PAID rupture spends — the FREE
line lays foundation, exactly as the owner demanded, and the 56-turn dead tail gets
something to do on X-heavy rolls. Keep magnitudes small; the point is that zero plays
should ever be literal no-ops.

**P4 — Teach the enemy to stanch (mechanic, theme-scoped counterplay, M).**
Give 2-3 mid/late enemies telegraphed **CAUTERIZE** phases (visible in the threat
sequence like every other phase, `combat.threat-sequences.ts`): "next phase: purges its
oldest DoT." Suddenly TICK has a job ("cash it before the purge"), rupture timing has a
deadline other than the cap, FORETELL/scout gains value for this deck, and rawhead-rex
stops being the only enemy that changes erosion's play pattern (13% vs 100% — currently
the entire difficulty is whether the enemy script out-races the farm). StS's Artifact
and Dawncaster's Ward exist because unopposed stacking is a spreadsheet.

**P5 — Make the engine visible and the ledger honest (UX/telemetry, S).**
(a) UI: a fuel gauge — pending DoT total, rupture preview vs cap — so the payoff is
anticipated, not discovered. (b) Attribution: credit extended/converted/doubled ticks to
their enablers (festering, currys, suppurating all read 0 today; Suppuration doubles the
deck's entire output behind one unlabeled `dot-tick` event, engine.ts:2547). (c) Count
`statusLands` for glue verbs. (d) Surface `--state-log`'s embedded `state.log` as a
proper `--transcript` flag — I reconstructed both fights from it; playtesters shouldn't
need archaeology.

---

*Verdict: the theme that IS the doctrine plays like a slot machine that pays out on
turn 2 and then asks you to watch it idle. The mid-fight turn-2 detonation — burst 94,
siphon 33, two jabs replanted — proves the exhilarating version of this deck already
exists in the engine for exactly nine seconds. Every proposal above is about making the
other 174 turns want to be that one.*
