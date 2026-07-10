# THEME AUDIT — Peroration (preset: `oratory`)

Auditor: mechanics-expert (SNOB lens), 2026-07-10. One theme, played, not spreadsheeted.
Sims: 5 invocations (2 auto transcripts via `--state-log` reconstruction, 3 playtest cells).
Read alongside `tuning-audit/dossier.md` and `tuning-audit/baseline.md`.

---

## 1. The deck on paper

`src/Combat/combat.deck-presets.ts:76-87` — exordium ×4, opening-statement ×4,
mounting-case ×2, peroratio-interrupta ×2, the-closing-word, practiced-cadence,
captive-audience. Hallmarks PREMISE / PERORATION; utilities DRAW, GUARD (per spec 32 §6 —
though note: **no card in this preset actually prints GUARD**; the "utilities" row of the
spec table is aspirational).

The engine skeleton (`src/Cards/cards.library.ts:190-333`):

| card | FREE line | PAID line | statuses landed |
|---|---|---|---|
| exordium (C×4) | +1 Premise | argument-wound i1 d2, +1 Premise, draw 1 | wound |
| opening-statement (C×4) | +1 Premise | mark d2 + argument-wound i1 d3, +2 Premises | mark, wound |
| mounting-case (U×2) | +1 Premise | mark d3 + wound i2 d4, +2 Premises, threshold(heart 2 → +1 Premise) | mark, wound |
| peroratio-interrupta (U×2) | TICK one DoT | RUPTURE (consume ALL afflictions) | none |
| the-closing-word (R) | +1 Premise | declare PERORATION at 6 (rider: ruptureMarks 3/stack, draw 2, +2◆), concedeAt 8 | none |
| practiced-cadence (R-ench) | timed 3 rounds | permanent | none — +1 Premise on first card each turn (engine.ts:1793-1796) |
| captive-audience (R-disench) | timed 3 rounds | permanent | mark 1/turn while ≥4 Premises (engine.ts:2744-2750) |

The only DoT is `debuff_argument_wound` (`src/Effects/debuffs.library.json:890-916`):
2/round, heart-typed, ramp 0.5/turn, stacks by intensity. Three of seven cards land zero
statuses — in a game whose doctrine is "status effects are THE fun," 43% of this preset's
distinct cards never touch the status system.

## 2. As played — the transcripts

### 2a. Early, `--policy status --stage early --seed 3` (Little Belle, 40 HP)

Reconstructed turn-by-turn from `--state-log` (the auto CLI still swallows phase events —
baseline caveat confirmed; the state log's `log[]` array is the workaround).

The whole fight's card plays: **12 plays, all inside turns 1, 2, and 60.** Turn 1:
opening-statement PAID off a wild (mark+wound land, die refreshes — the variety chain
works as advertised) then captive-audience PAID. Turn 2, holding no die worth spending:

```
PLAY opening-statement [FREE]  -> +1 PREMISE (total 3)
PLAY exordium [FREE]           -> +1 PREMISE (total 4)
PLAY peroratio-interrupta [FREE] -> tick Argument Wound: 3
PLAY practiced-cadence [FREE]
```

Then **turns 3 through 117 contain zero card plays.** One hundred and fifteen consecutive
turns of draft-die → bank Conviction → press a signature. 40 signature casts vs 12 card
plays. `sig-overwhelming-argument` was cast repeatedly for 8◆ to apply BACKFIRE i10 into a
deck that contains **no STAGGER whatsoever** — BACKFIRE only converts when rungs are lost —
and the attribution table dutifully reports `Overwhelming Argument: 0 dmg (0 DoT) over 27
phases`. The kill was Argument Wound + signature Poison ticks; `Conviction Strike: 944 DoT`
of an attributed 1110 (85%) against a 40 HP enemy. Final state: **premises=15,
peroration=null** — the theme's namesake mechanic was never declared in its own preset's
showcase fight.

(Harness caveat, load-bearing: 118 player turns against 2 enemy threat phases. The
`--auto` driver decouples turns from threats, so Conviction farming and signature spam are
inflated relative to the real loop — the playtest harness below shows 1.2-2.9 round fights.
Both views are reported; neither flatters the theme.)

### 2b. Mid, `--policy status --stage mid --enemy hasshaku-sama --seed 5` (450 HP elite)

The first three turns are the theme working exactly as designed, and they are genuinely
pretty: wild/heart dice chain through mark+wound plays (each fresh status refreshes the
die — turn 3 got three PAID plays off one heart die), premises 0→11 by turn 3, wound
intensity ramped i3→i9. Then:

```
TURN 4: PLAY the-closing-word [PAID] -> PERORATION DECLARED, fires at 6   (holding 11)
TURN 5: PLAY peroratio-interrupta [PAID] -> rupture-detonated 113, consumed mark i5 + wound i9
TURNS 6-61: zero card plays; 19 signature casts
TURN 62: PLAY mounting-case [FREE] -> +1 PREMISE (total 12)
         ** PERORATION FIRED — outcome: concede ** (enemy at 317/450 HP)
```

Read that again. (1) Declaring the conclusion while holding 11 premises — already past the
fire threshold — does **nothing**, because the trigger only checks inside `gainPremises`
(engine.ts:800-840); the case sat fully built for 58 turns. (2) The card prints `concedeAt
8`; hasshaku-sama is `difficulty: 'elite'` (enemy.library.ts:1005) so the engine silently
floors it to `CONCEDE_PREMISES_ELITE = 10` (effects.ts:97-99, engine.ts:822-827) — the card
text lies to the player. (3) One turn after declaring the 6-premise conclusion whose rider
is *ruptureMarks 3 per mark stack*, the policy ruptured away every mark and the entire
wound engine for 113 — so when the peroration finally fired it had nothing to consume.
(4) The climactic alt-win, the one the whole theme builds toward, was delivered by a FREE
+1 chip against an enemy at 70% health, and the reward rider (3/stack on zero stacks,
draw 2, +2◆) was mechanically indistinguishable from silence. The fanfare is a line of
bookkeeping.

### 2c. Playtest matrix, blind, preset:oratory, 30 runs/cell, seed 1

**Early:** 100% win across all six enemies (doctrine ~80%), rounds 1.2-2.3,
statusEng 55-60%, **dotFrac 21-47%** (weighted 36%), con=6/180.
**Mid:** 82% win (doctrine ~50%), rounds ~2.9, statusEng 58%, dotFrac 34%, and the
headline: **win-path vic=46, con=77, def=27 — CONCEDE is the deck's dominant win path at
mid** (51% of all wins; 20/30 vs tri-eyes). Defeats concentrate exactly where they should
(mirac 14, rawhead-rex 12 — burst enemies that outrace the case). mercy=0, cap=0.

Per-card usage (mid, 150 fights): every card plays; no dead cardboard by usage. But the
`statusLands` column splits the deck in two: opening-statement 798/912 plays land status,
exordium 581, mounting-case 426 — vs peroratio-interrupta **0/455**, the-closing-word
0/207, captive-audience 0/153, practiced-cadence 0/151. the-closing-word is played FREE
(+1 chip) nearly half the time (102/207) — a rare Axiom used as a penny.

Two corrections to the shared baseline this data forces: (a) baseline's "concede=0 in
~1,290 fights" is a **policy-pick artifact** — hand a bot the actual oratory preset and
concede fires 77 times in 150 mid fights; the path is alive, merely quarantined inside one
preset. (b) oratory "passes" the decay curve only under whatever seed/policy the balance
band used — measured here blind it is 100/82 against 80/50, a curve violator.

## 3. Judgment

### Identity as played

"Build the case premise by premise" is the flavor; the play is: **spam the two commons off
one refreshing die (mark+wound = 2 statuses = 2 refreshes), rupture the pile with
interrupta, and let an invisible integer cross an invisible, mislabeled threshold.** The
concede itself — the theme's genuinely unique possession, the only alt-win that actually
fires anywhere in the game's data — arrives as an anticlimax: no spike, no final image,
no last-turn tension. It is a win by paperwork. Dominion players know this feel: it is
the Gardens deck — you win, the counter says so, and nobody at the table felt anything.

### Nearest neighbor

**Affliction (`erosion`), unambiguously.** The moment-to-moment loop is identical: apply
MARK + one ramping DoT, detonate with RUPTURE. Argument-wound *is* poison with a rhetoric
skin; peroratio-interrupta *is* resonance-detonation. Everything premise-shaped rides on
top as a second, mute bar. (By win *condition* the neighbor is charm/`grace` — SWAY and
PREMISE are both fill-the-hidden-meter-to-win — which makes it worse: the game now has two
themes whose climax is a threshold check the enemy never contests.)

### Where the player thinks

Exactly one real fork, and it is a good one: **interrupta timing** — the wound ramps 0.5/
turn and marks feed both captive-audience upkeep and the closing-word rider, so rupturing
now cannibalizes three other cards' futures. Cash vs compound. That is the correct spine
for this theme. The transcripts show the sim making this choice greedily and wrongly (2b,
turn 5) and being punished not at all — at 100%/82% win rates nothing in the system prices
the mistake. Marginal second thought: declare at 6 for the rider vs hold for concede —
except the rider is so weak (≈ 9 damage + draw 2 on a typical board; one Conviction Strike
is poison i10) that no one holding a calculator would ever weigh it.

Everything else is autopilot: FREE +1 premise chips are always-play (no board feedback, no
alternative use beyond scrapping for 1◆); captive-audience and practiced-cadence are
played on sight; and both transcripts collapse into signature-farming the instant the hand
empties (early: 115 consecutive card-less turns; mid: 56).

### Setup → payoff arc

Readable? The setup is *invisible* — premises are an integer in `state.premises` with no
board presence, no enemy acknowledgment, no per-premise feedback. Felt spike? The at-6
rider fired once across both transcripts, into a ruptured-bare board, for nothing. The
concede fired at +1 chip. The theme has a real arc **in its economy** (0→6→8/10/12) and no
arc whatsoever **in its presentation or its payoffs**.

### What it's missing

1. **A visible, contested case.** Griftlands — the obvious prior art for combat-as-argument
   — makes every argument a *targetable entity with HP* that the opponent can attack; the
   case is literally on the board and defending it is half the game. Here the enemy cannot
   interact with premises at all; there is no "objection," no premise-removal telegraph, no
   reason the case's growth creates tension rather than bookkeeping.
2. **Milestone payoffs during the build.** Dawncaster's bard archetype (the very mechanic
   the code comment at cards.library.ts:188 says PERORATION was spun from) never lets the
   count sit mute: Perform X builds Performance, and song cards pay out repeatedly at
   printed milestones — "After N Performances, do X" (kb: `dawncaster/keywords/
   performance.okf.md`, `cards/1389-song-of-aldour`, `1390-song-of-lovers`); Crescendo
   ("If you are currently Performing, Perform 6 and start a new performance",
   `cards/0440-crescendo-966546.okf.md`) makes *restarting the count* a play. MTG's
   filibuster win (Azor's Elocutors: five counters, and each counter matters because
   damage strips them) prices the threshold with counterplay. Peroration's count does
   nothing at 1-5 and 7-11.
3. **An honest threshold.** concedeAt 8 printed, 10/12 enforced (engine.ts:822-827). A
   hidden difficulty scaler on the card's central promise is a trust breach Slay the Spire
   would never tolerate — intents are honest even when brutal.
4. **A payoff worth the name.** The at-6 rider loses on rate to a signature button. And
   overshoot is confiscated (fired "spending 12" when at=6 — six premises evaporate,
   engine.ts:837).
5. **The FREE/PAID signal, this theme's variant:** oratory's FREE lines are *already* the
   owner's desired shape — foundation, not damage chips (+1 Premise feeds the PAID
   peroration). The failure here is not the fork's structure but its **feel**: the FREE
   chip has zero visible consequence, so it plays as a token drip anyway. The fix is to
   make foundation *legible and dripping* (milestones, board presence), not to redesign
   the fork. Separately, practiced-cadence/captive-audience expose the fork's other rot:
   at 1.2-2.9 round fight lengths, a "timed 3-round" FREE enchant *is* the permanent PAID
   enchant — 84 mid plays spent a die on strictly redundant permanence.

### Card-level verdicts

- **the-closing-word** — mislabeled (concedeAt lie), mistimed (declare-while-≥at inert,
  proven turn 4→62), and underpowered at its at=6 line. The theme's crown is tin.
- **peroratio-interrupta** — the deck's real finisher (402 PAID plays mid, the 113 burst)
  but generic RUPTURE aimed at its own theme's fuel; also its FREE tickOne is the one
  remaining "weak chip" FREE line in the preset (owner-signal bite).
- **captive-audience** — decent glue, but its ≥4-premise gate switches OFF the instant the
  peroration fires and resets premises to 0: the reward for succeeding is disabling your
  own rare.
- **practiced-cadence** — +1/turn is real in a long fight and vapor in a 1.2-round one;
  its PAID permanence is dead value at preset stages.
- exordium / opening-statement / mounting-case — sound commons; the chain-refresh play
  pattern (2b turns 1-3) is the best-feeling thing in the theme.
- Dead engine machinery: **`spend_premises` (engine.ts:1394, 2143-2160) is fully
  implemented — markPer/drawPer conversion, events, fizzle — and no card in the 70-card
  library authors it.** The theme's missing second sink already exists in the engine.

## 4. Proposals (respecting doctrine + the locked dice law)

**P1 — Milestone drip: premises pay out while the case builds.** (`kind: mechanic`, M)
In `gainPremises`, every 3rd Premise (3/6/9…) emits a small themed rider: TICK the
strongest enemy DoT + apply 1 MARK ("the room turns"). If a Peroration is declared, the
milestone also shows the remaining count on the telegraph bar. Dawncaster's Performance
songs prove count mechanics feel alive only when the count pays during the build. This
single change converts every FREE +1 chip from mute bookkeeping into a visible drip —
the owner's FREE-line signal answered without touching the fork's structure — and it is
pure status-engine output (doctrine-clean: TICK/MARK, no raw damage).

**P2 — OBJECTION: the enemy attacks the case.** (`kind: mechanic`, L)
Elite+ enemies gain a telegraphed threat rider `objection: N` (authorable in
`combat.threat-sequences.ts`): when the threat fires, remove N Premises unless the player
landed a status on the enemy that turn ("carried the room"). Now the case is contested,
building fast matters, stalling has a price, and the concede stops being a solitaire
threshold — the Griftlands lesson (arguments are things opponents attack) at one-tenth
the implementation cost. Also the natural difficulty knob that lets the *printed*
concedeAt stay honest (kill the hidden 10/12 floor; scale objection pressure instead).

**P3 — Fix the conclusion: fire on declare, scale with overshoot, print the truth.**
(`kind: card`, S) the-closing-word: (a) check the peroration trigger at declaration
(playing it while already ≥ at fires immediately — removes the turn-4→62 absurdity);
(b) rider scales: ruptureMarks 2 + 1 per 2 Premises spent beyond `at`, draw 2, +2◆ —
overshoot becomes payoff instead of confiscation; (c) if the tier floor survives P2,
render the effective concede number on the card per-enemy (the engine knows it at deal
time). Three small edits; the theme's climax stops being weaker than a signature press.

**P4 — Peroratio Interrupta spends PREMISES, not afflictions.** (`kind: card`, M)
Swap its PAID `{kind:'rupture'}` for the already-implemented, currently-orphaned
`spend_premises` mechanic (engine.ts:2143-2160): consume all Premises → mark per 2 spent +
burst per Premise (tune ~4/premise, ruptureBurstCap applies). The theme gains its
cash-now-vs-concede-later fork on its OWN currency — two sinks, one bank, a real decision
every time the count crosses ~5 — and stops cannibalizing the wound/mark engine that
captive-audience and the closing word feed on. Generic RUPTURE returns to being
affliction/erosion's signature, sharpening both themes' identities. FREE line: replace
the token `tickOne` with `+1 Premise` (the fork signal, again).

**P5 — Show the case.** (`kind: ux`, S) A visible premise track on the combat UI (planks
under the enemy portrait), the declared Peroration as a face-up card on the track with
its fire/concede pips, milestone pips from P1 marked, and a distinct full-screen beat when
CONCEDE lands (it is currently one log line). The theme's entire fantasy is watching an
argument become undeniable; today that fantasy is `premises: 11` in a JSON blob.

Sequenced: P3 (S) and P5 (S) are immediate wins; P4 unlocks the decision spine; P1+P2
together give the theme the build-under-pressure arc the owner's "exhilarating puzzle"
demands. Curve note for the tuning pass: any buff lands on a deck already at 100/82 vs
80/50 — P2's objection pressure is the intended counterweight; tune them as a pair.

## 5. Scores

- **Distinct: 6/10.** The concede path genuinely fires (77/150 mid — the only theme in
  the audit's data that wins by its own alt-win), and the interrupta fork is a real
  decision seed. But the moment-to-moment loop is erosion in a toga.
- **Engagement: 4/10.** One real decision, an invisible build, a climax delivered as a
  bookkeeping line against a 70%-HP enemy, and transcripts that are 90%+ card-less
  signature farming once the hand empties.

Harness footnotes carried forward: `--auto` turn/threat decoupling (118 turns : 2 threats)
inflates signature dominance in transcripts; `--state-log` + the final state's `log[]` is
currently the only way to read an auto fight turn-by-turn; attribution still counts ticks
as "phases" (Conviction Strike "over 13 phases" in a 2-phase fight).
