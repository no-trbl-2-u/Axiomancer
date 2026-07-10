# THEME AUDIT — ORACLE (`augury`) — "See the next move, declare it aloud, collect on every prophecy that comes true."

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Evidence: 5 sim invocations —
two `npm run combat` fights with `--state-log` (early seed 3 vs Little Belle; mid seed 5
vs Tri-Eyes, `--enemy` passed per baseline caveat 1), two `combat-playtest` matrix cells
with `--cards` (early + mid, blind, 30 runs, seed 1), plus one throwaway first run that
confirmed the auto-transcript gap. State logs parsed from
`scratchpad/augury-early.jsonl` / `augury-mid.jsonl`.

**Verdict up front:** Oracle is the theme whose fantasy the current rules most
completely fail to deliver. The deck *works* — 99% early, 58% mid, every card gets
played — but the prophecy game inside it is a Potemkin façade: **the player never
chooses what to predict** (the engine pins every omen to HEART), **a wrong prophecy
costs nothing**, **the payoff for a right one is a cantrip**, and the deck's actual
damage plan is a tier-1 common's DoT plus the Conviction signature. It is an
affliction deck wearing a blindfold it claims is a third eye.

---

## 1. The ten cards as printed

Source: `src/Cards/cards.library.ts:781-922`; effects `src/Effects/debuffs.library.json:965-990`.

| card (copies) | rank | color | FREE line | PAID line |
|---|---|---|---|---|
| glimpse ×4 | Doxa | mind | FORETELL 1 | Foretold Wound d2 + FORETELL 2 (lib:783-802) |
| signs-and-portents ×4 | Lemma | heart | FORETELL 1 | OMEN → draw 2 (lib:804-820) |
| cassandras-burden ×2 | Thesis | heart | draw 1 | Foretold Wound i2 d2 + OMEN → Guard 4 (lib:822-845) |
| delphic-ambiguity ×2 | Theorem | mind | TICK one | consume one affliction (fuel ticks now) + 1 Soul + FORETELL 1 + mind-die pip (lib:847-870) |
| prophecy-fulfilled ×1 | Axiom | mind | FORETELL 1 | RUPTURE, +3 fuel per omen hit (lib:872-888) |
| the-oracles-eye ×1 | Axiom E | heart | timed 3-round | next stance always revealed; omen riders ×1.5 (lib:890-905, engine:2666-2682, 3036-3037) |
| fated-course ×1 | Aporia D | mind | timed 3-round | next telegraph FORCED to a pending omen's stance; hit omens apply MARK (lib:907-922, engine:2639-2650, 2691-2697) |

`debuff_foretold_wound`: 1/round mind DoT, `tickAmplifyFlat: 1`, d2, intensity-stacking
(debuffs.library.json:965-990). The theme's only status.

## 2. Play evidence

### 2a. Early, status policy, seed 3, Little Belle (state log)

Round-1 hand: `delphic-ambiguity, fated-course, the-oracles-eye, glimpse, signs-and-portents ×2`.
Full-fight card ledger from the log — 14 card plays, **12 of them FREE lines, zero
omens declared, `omenHits: 0` and `pendingOmens: []` at every tick**:

```
card-played glimpse            PAID t1-d1 (wild)      → Foretold Wound
card-played fated-course       PAID t1-d1 (refreshed) → disenchant-attached
card-played delphic-ambiguity  FREE   … the-oracles-eye FREE … signs-and-portents FREE ×2
round 2: cassandras-burden FREE ×2, glimpse FREE ×2, prophecy-fulfilled FREE,
         signs-and-portents FREE ×2, delphic-ambiguity FREE
```

The game's own **status policy plays the prophecy deck without ever prophesying.**
`prophecy-fulfilled` — the Axiom finisher — was cast on its FREE line (a foretell).
The fight was won by `sig-conviction-strike` poison: 464 of 470 DoT. `fated-course`
sat attached to the enemy doing nothing, because a curse that triggers "on omen hit"
in a deck that declared no omens is a tattoo on a corpse.

Harness caveat (carries to §7): the log shows **60 `turn-dice-rolled` events in a
2-round fight** — the CLI auto loop (`combat.cli.ts:271-303`) re-rolls turns inside a
single threat phase, farming Conviction (128 `conviction-gained` events, 20 signature
casts). Signature dominance in these transcripts is partly a harness exploit; the
matrix cells below don't share it.

### 2b. Mid, status policy, seed 5, Tri-Eyes 375 HP (state log)

Victory round 4, player 122/255. This fight DOES run the omen loop — and the log is
a confession:

```
omen-declared cassandras-burden  stance:"heart" phase 1
omen-declared signs-and-portents stance:"heart" phase 1   (×2)
omen-hit cassandras-burden  rider "Guard 4"
omen-hit signs-and-portents rider "draw 2"                (×2)
… fated-course attaches …
omen-declared … stance:"heart" (all of them, phases 2)
omen-hit … "Guard 6", "draw 3" (×3)   ← the-oracles-eye's ×1.5 amp
rupture-detonated amount:32 consumed:["debuff_foretold_wound"]
```

Nine omens declared, **every single one `stance:"heart"`**; 8/9 hit — five of them
because `fated-course` *forces* the telegraph to the predicted stance
(engine.ts:2644-2650). Phase 2's revealed stance was `mind`; the omens predicting
heart hit anyway, because the prophecy overwrote the future. Prediction accuracy: not
earned, manufactured.

The payoff ledger for all this augury: Guard 4, Guard 6, draw 2 ×2, draw 3 ×3 — while
the enemy hit for 24-72 a phase and the damage race was carried by
`sig-conviction-strike` (1,488 DoT) and glimpse's wound (423). `prophecy-fulfilled`
detonated for **32** — cast before a single omen had resolved (`fuelPerOmenHit × 0`),
and nothing on the card discourages that. The finisher fired before the setup existed.

Autopilot exhibit: the fight ends with **five consecutive FREE `glimpse` plays that do
literally nothing** — `applyForetell` (engine.ts:846-868) only reveals an
already-revealed stance (idempotent, line 853) and never reorders at count 1
(line 858 requires `count > 1`). Null clicks, indistinguishable from play.
A stale `pendingOmens` entry (cassandra, phaseIndex 2) was still unresolved at combat
end — the `min(idx+1, length-1)` clamp (engine.ts:1468, 2645) muddies omen timing once
a threat sequence loops.

### 2c. Matrix, blind, 30 runs/cell, seed 1, `--cards`

| stage | win | doctrine | rounds | statusEng | dotFrac | "strike" | dom |
|---|---|---|---|---|---|---|---|
| early (6 cells) | **99%** | ~80% | 2.0 | 43% | 47% | 27-38% | glimpse **49%** |
| mid (5 cells) | **58%** | ~50% | 3.5 | 43% | 38% | 33-36% | glimpse **50%** |

- Early overshoots doctrine like every preset (baseline finding), in 1.6-2.7 rounds —
  a prophecy deck whose fights end before a 2-round wound expires once.
- Mid's 58% looks on-curve and is a lie of averages: **97 / 10 / 97 / 80 / 7** across
  tri-eyes / mirac / hasshaku / jeweled-tree / rawhead-rex. Not "even odds each fight"
  — the matchup screen decides, and both losing cells die in exactly 3.0 rounds
  (baseline's scripted-defeat signature). Win-path: vic only; cap/mer/con = 0.
- **`glimpse`, a tier-1 common, deals half the deck's damage at both stages.** The
  Axiom finisher and both rares are passengers.
- Usage (mid, 4,049 plays): signs-and-portents 1,089 plays / 301 of them the null FREE
  line; delphic 546 / 204 FREE; statusLands = 0 for five of seven cards (only the two
  wound carriers land anything). No card is *dead* — utilization 100%, entropy .88-.92
  — but five of seven cards are *weightless*.
- The 27-38% "strike" column in a strike-is-dead game is a **metrics bug**: delphic's
  `consume_affliction` damage goes to `directDamageDealt` but `affliction-consumed`
  is missing from the mechanic-burst ledger (`combat.encounter.sim.ts:402-415`), so
  the doctrine dashboard reports phantom strikes.

## 3. Identity as played, and the nearest neighbor

**As flavored:** read the future, name it, collect when it arrives.
**As played:** stack one small intensity-stacking DoT (glimpse/cassandra), cantrip
through the deck, bank Conviction, let the signature poison do the killing, and
occasionally receive an unasked-for Guard 4 at a phase boundary.

**Nearest neighbor: affliction (`erosion`).** Same skeleton — apply a stacking DoT,
detonate it with RUPTURE (`prophecy-fulfilled` is `resonance-detonation` with a
vestigial omen kicker) — but erosion's DoTs are bigger and its detonation actually
detonates. Oracle's supposed differentiator, the information game, is a commodity:
the R5 draft omen (engine.ts:504-516), `sig-read-opponent` at 1◆, FORETELL (which
control's `standstill` also carries as a family utility), and `the-oracles-eye` are
five vendors selling the same single bit — a bit the baseline proved is worth **zero
points of win rate** (greedy-vs-blind gap 0pp at every stage). Oracle is an
information deck in an economy where information has no price.

## 4. Where the player thinks — and where it's autopilot

Genuine decisions, as the rules stand:

1. **When to play an omen** — check the revealed next stance; if heart, play it; if
   not, hold it. Except this is a lookup, not a bet (info is free), and after
   `fated-course` lands it isn't even a lookup — every omen self-fulfills.
2. **When to detonate `prophecy-fulfilled`** — in principle "bank more hits vs cash
   now." In practice the fuel rate (3/hit) is so low the answer is "whenever," and the
   status policy fires it at zero hits for 32 damage.

Autopilot ledger:

- The *content* of every prophecy: engine.ts:1464-1467 derives the omen stance from
  the powering die; the color law (engine.ts:1143) means a heart card is only ever
  powered by heart or wild; wild falls back to `card.stance`
  (`cardStanceColor` = `philosophicalAspect`, combat.cards.ts:87-89) — and **both omen
  carriers are heart cards. The augury deck is structurally incapable of prophesying
  anything but HEART, in every fight, forever.** The oracle knows one word.
- The FORETELL reorder: "look at top N and reorder" was automated away — the engine
  "deterministically floats the highest-rank card to the top (no picker needed)"
  (engine.ts:843-845). Slay the Spire's Watcher proves scry is only fun *because* the
  keep/toss call is yours; Axiomancer's scry plays itself.
- FREE lines: 4 of 7 designs print `foretell 1` / `tickOne` / `draw 1` — to the
  owner's credit these are foundations, not the hated chip-damage forks. But
  `foretell 1` is idempotent (§2b), so half the deck's FREE plays are ritual clicking.

## 5. What is missing (with prior art)

1. **A chosen prediction.** Every prophecy game worth playing makes you *pick* the
   future: Skull King and Wizard live on the declared-bid-vs-actual gap; Dominion's
   Wishing Well makes you name the card. Here the die names it, the color law
   restricts the die, and the card pool restricts the color to one.
2. **Stakes.** An omen that misses fires no rider and costs nothing. Cassandra's
   whole myth is the *cost* of prophecy; her card can't miss meaningfully. Compare
   Dawncaster's **Doom** (`kb/.../dawncaster/keywords.json`: "take 1 damage per stack
   at end of turn; **increase Doom by 1 each time an Action is played**") — a
   prophecy of harm the victim's own tempo feeds, and Dark Omen (Legendary): "Inflict
   5 Doom. Gain Darkness equal to your foe's Doom" — the future as fuel. Quacks of
   Quedlinburg (kb/BoardGames/games/the-quacks-of-quedlinburg) is nothing *but* the
   push-your-luck heartbeat oracle lacks.
3. **A payoff worth anticipating.** Guard 4 and draw 2 are rounding errors at mid
   stage; `the-oracles-eye` amplifying them ×1.5 turns +4 into +6. The theme's
   RUPTURE spike pays 3 fuel per hit — eight perfect prophecies buy 24 fuel while
   glimpse's wound quietly deals 423. Setup→payoff arc exists in the data model
   (`omenHits` counter, engine.ts:364, 2630) and never in the player's chest.
4. **A reason information matters.** Spirit Island's invader queue is fully public
   and the game is *about* choosing which telegraphed future to cancel; Inscryption
   telegraphs every lane and stays tense because acting on the telegraph costs board.
   Here the greedy=blind gap is 0pp: seeing the future changes nothing, so the theme
   that sells sight is selling a decoration.

## 6. Card-level issues

| card | issue |
|---|---|
| glimpse | Carries 49-50% of deck damage at BOTH stages (dominance); FREE line is a no-op after the first play of a phase. |
| signs-and-portents | Prediction pinned to heart; rider is a cantrip; 301/1089 mid plays were the null FREE line. |
| cassandras-burden | Right shape (wound now, brace-if-true) but Guard 4 ≈ 5-8% of one mid threat hit; the brace lands at the boundary where you already saw the hit coming. |
| delphic-ambiguity | Mislabeled Harvest card: it *is* WINNOWING (engine.ts:1532-1550) plus `souls: 1` in a theme with **no REAP** and a pip rider in a preset with **no pip spender**. Two vestigial economies on one card; its consume damage is also what pollutes `strikeFraction`. |
| prophecy-fulfilled | No gate: detonates at `omenHits 0` for 32 (mid log); `fuelPerOmenHit: 3` is decorative. The finisher does not require the theme to have happened. |
| the-oracles-eye | Fifth redundant vendor of a worthless bit + a ×1.5 multiplier on droplet riders. An Axiom that buys +2 Guard and +1 card. |
| fated-course | The most novel verb in the theme (force the future) is also the theme's suicide: it converts the only probabilistic beat into a guarantee, deleting tension. Its own mark-per-hit is i1. Stale-omen clamp (engine.ts:1468/2645) leaves pending omens unresolved at fight end. |

## 7. Harness findings (carry to systems auditor)

- **CLI auto turn-farm:** `autoPlayPhase` (combat.cli.ts:271-303) calls
  `endTurn`/`startTurn` in a loop inside one threat phase — 60 rolls/2 rounds (early),
  182 rolls/4 rounds (mid), 59 signature casts. The engine has no "one roll per
  round" guard; only the phase driver enforces it. Any UI that lets a player end-turn
  without resolving the threat inherits an infinite-Conviction exploit, and every
  `npm run combat` transcript overstates signature dominance.
- **`strikeFraction` misclassification:** `affliction-consumed` damage absent from
  the burst ledger (combat.encounter.sim.ts:402-415) → augury reports 27-38% "strike"
  in a game where the strike is dead.
- `--state-log` is the only way to see an auto-played fight turn-by-turn; the
  baseline's "no transcript" finding stands for stdout, and `--json-events` still
  swallows `autoPhase` events.

## 8. Proposals

All build on the locked dice law (the die still names the omen's color; floats stay
color-lawed) and the strike-is-dead doctrine.

### P1 — OMEN v2: chosen range, real stakes (keyword, M)
Keep "the powering die is the prognostication" (it's the dice law made flavor — good
bones). Add the two axes the player owns: **range and stakes**. Declaring an omen, the
player picks NEXT phase (safe: rider ×1) or the phase AFTER (bold: rider ×2, and the
+2 pips/fuel interactions below). A missed omen is *spent* — exiled for the combat
(Cassandra's price: prophecy is not recyclable). FORETELL N now reveals the next N
phase stances (currently N only deepens a reorder nobody chose), so glimpse's
FORETELL 2 is exactly the underwriting a bold 2-phase bet needs. While `fated-course`
is attached only SAFE omens may be declared bold-free — certainty and greed cannot
coexist. This makes the greedy-vs-blind gap nonzero *for this theme*: information
finally converts to EV. Prior art: Skull King exact bids, Quacks push-your-luck,
Dawncaster Doom escalation.

### P2 — Break the heart monoculture (card, S)
Recolor `cassandras-burden` to **mind** (its wound is already a mind DoT; move Guard
to the omen rider unchanged). Now the deck can prophesy heart OR mind, and the turn's
roll decides *which futures are speakable* — the tray becomes an augury spread, a
per-turn reason to care which colors came up that no other theme has. Zero new rules;
pure data change in cards.library.ts:822-845.

### P3 — Make the finisher require the theme (card, M)
`prophecy-fulfilled`: print the gate — "fizzles unless 2+ omens have hit this combat"
— and raise `fuelPerOmenHit` 3 → 8 (bold hits from P1 count double). Show the omen-hit
tally on the card frame. This creates the felt arc the theme lacks: 0…1…2…*now*. The
32-damage round-1 whiff in §2b becomes impossible; the RUPTURE cap
(max(80, 25% maxHP)) already bounds the top end.

### P4 — PORTENT: the FREE line lays foundation (theme mechanic, M)
Replace every oracle `free: {foretell: 1}` with **"Inscribe a PORTENT (max 5)"** — a
theme-scoped tally like PREMISE. Each omen declaration consumes all Portents: +1 rider
magnitude per Portent consumed (and +2 prophecy-fulfilled fuel each). FREE plays stop
being idempotent clicks and become the ink the paid prophecies are written in —
exactly the owner's "FREE lays foundation for PAID" directive, resolved for this theme
without touching the fork's structure.

### P5 — Give sight back to the player (UX, S)
(a) FORETELL presents the keep/bottom choice (engine keeps the auto-heuristic for sim
policies only — flip engine.ts:843-845's "no picker needed"). (b) Foreseen phases
render on the enemy telegraph with a "seen" pip, and a declared omen renders ON the
telegraph rung it targets, with its rider and stake visible — the bet must be
watchable while it rides. Wildfrost's counter timers show how much tension a visible
"N until it happens" carries for free.

---

**Scores:** distinctiveness **3/10** (as played it is erosion-lite with a draw
engine; its one novel verb, forcing the future, is owned by a card that deletes the
theme's tension), engagement **4/10** (the omen-hit loop does visibly fire and
cassandra/fated-course are real design seeds, but the prophecy is pinned, stakeless,
and paid in pocket change; the deck's thought-per-turn is a stance lookup). 5 is
competent-but-forgettable; oracle is below it because its hallmark is structurally
incapable of expressing the fantasy on the box.
