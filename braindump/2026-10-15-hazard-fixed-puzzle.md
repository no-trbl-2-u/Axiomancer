# Hazard as a fixed puzzle — 2026-10-15

## Surface question
The hazard minigame plays too much like combat (cards + colour dice). How do we make it distinct?

## Better question surfaced
Keep the hazard's pieces (cards with FREE and powered lines, colour dice, FORCE/ESCAPE meters, safe and risk
routes), but remove the luck: what makes a fixed, hand-authored hazard a *puzzle* with a measurable difficulty,
under a clock?

## Path taken this session
1. Push-your-luck prototypes (omen bag, second omen, known pool): rejected; all three play as "tap, tap again".
2. Five timed puzzle pitches (pipes, memory bridge, rune lock, sliding stones, candle toggles):
   artifact https://claude.ai/artifact/CvyxWNpXe1v6p5dJSUQuid. T then changed direction.
3. Final direction (below): today's hazard pieces, made deterministic and solved by a solver.

## Decisions (T, this session)
- **One round.** No three rounds, so no momentum carry and no round-to-round CRACK insertion.
- **No deck and no roll.** Each hazard is one authored layout: the hand, the dice and the goal.
- **Routes kept.** Safe = one combined meter, risk = both meters, picked before the clock starts.
- **DRAW kept as is**, except it draws predetermined card(s). Sometimes drawing that card is the only way to solve
  the puzzle.
- **Cut:** the saved hazard deck and its screens (`hazard.deck-flags.ts`, `app/hazard-deck`, `HazardRemoveGrid`,
  `DebugHazardDeckRandomize`, with a save migration), RE-CAST cards (Balance Pole, Pilgrim's Blessing), and the
  `deadcard` consequence.
- **Rewards:** normal loot (consumables, materials), never hazard cards. A reward is paid **no matter what**, with
  a bonus for full completion.
- **Failure scales:** the higher the value reached when time runs out (or the player confirms), the smaller the
  punishment.
- **Stats are optional help for specialists.** Each puzzle lists stat thresholds that rise later in the game:
  - `>= n <stat>`: +1 die of that stat's colour;
  - and/or `>= n <stat>`: one extra card is unlocked for the puzzle;
  - and/or `>= n <stat>`: "reroll all blank dice", where each blank's new face is **predetermined** by the puzzle
    and makes it slightly easier.

  Every puzzle must be solvable **without** any unlock.
- **Solver test:** every authored puzzle must be solvable, and its count must sit in its declared band.
  This is a ruling on `axiomancer-mechanics/CLAUDE.md` "no count pin": a band on authored puzzle content is allowed.

## Decisions added at /plot time (T, same session)
- **+1 die colour:** Body → red, Mind → blue, Heart → purple. Gold stays wild and is never an unlock.
- **Failure starts as:**
  - lose round(max × (1 − p)) VITAE, where p is the value reached divided by the goal (the weaker meter on risk);
  - max = 6 on safe, 12 on risk;
  - −5 max VITAE scar only if p < 0.5.
  T wants to experiment with this, and later make it depend on other things.
- **Rewards:** a little experience, plus consumables and materials, always; a bonus for full completion.
- **No hazard puzzles go into Act 1 yet.** First lock the process with a few demo puzzles, then let the loop
  build Act 1's.

## Evidence (solver prototype, scratchpad, real engine)
The solver drives `hazard.engine.ts` transitions over a fixed layout and counts **distinct winning outcomes**
(different end states; button order ignored). With one round, the goal alone sets the band:

| Layout (hand → dice) | Goal → distinct winning outcomes |
|---|---|
| Safe route. Hand: Faith Leap ×2, Read the Wind, Dead-Man Haul, Cliffrunner. Dice: red, red, blue, blue. | 14→222 · 18→124 · 22→53 · 26→13 · 28→6 · 30→2 · 32→0 |
| Risk route. Hand: Iron Grip, Scramble, Cliffrunner, Read the Wind, Dead-Man Haul. Dice: red, ✕, blue, gold. | 6/6→840 · 10/10→132 · 12/12→16 · 13/13→14 · 14/14→8 · 15/15→0 |
| Same risk layout with a hand of 6 and Unbroken Oath (DRAW 2) | 8/8→31,465 · 17/17→3,272 (DRAW inflates counts) |

Takeaways:
- Difficulty is mostly the goal: one layout can serve as easy, medium or hard.
- Goals must come from the solver, not from hand arithmetic.
- DRAW cards widen the solution space a lot.

## Proposed bands (starting numbers, to adjust after timed solves)
- Easy: 30 or more distinct winning outcomes.
- Medium: 5–29.
- Hard: 1–4, and the best line clears the goal by at most 1.

## Timer method (no numbers yet)
1. Author 3 puzzles per band.
2. Time first-time solves: the `playtester` agent plus T, with the clock hidden.
3. Set the clock to the median × 1.5, rounded to 5 s.
4. Re-time whenever a band's puzzles change.

## Open questions
- Scaled failure: the curve from "value reached" to punishment (VITAE loss and scar size), and whether the
  unconditional reward scales too.
- Stat thresholds: values of n per act/region, and which unlocks each puzzle offers.
- The game has only 3 consumables (healing potions), and materials appear to have no sink (the Anvil engine does not
  reference them; confidence 70). Is the reward pool enough?
- Hand size per band (5 or more?) and how many predetermined DRAW cards are shown or hidden.
- A deterministic replacement for RE-CAST, or none.

## Raw notes
- Solver limits: it plays in one fixed order (discards, then converts, then draws, then numbers), so counts may run
  slightly low; a per-round choice budget skips plan spaces that are too open to count.
- Backward authoring works: write the intended line first, then set the goal to exactly what that line reaches.
  This produced a 1-solution puzzle whose key move is discarding Cliffrunner for its die.
