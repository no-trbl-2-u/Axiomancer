# Act I — The Colonnade — SOLUTION (SPOILERS)

> Full walkthrough and validation data for `act1.md`. Marked per
> roadmap Q21. Do not surface any of this in player-facing copy.

## True path (7 moves; 9 with the optional-but-intended side room)

1 -> 7 -> 11 -> 13 -> (secret) 17 -> [23 -> 17] -> 19 -> 29 -> 31

By engine id: ap1-1 -> ap1-2 -> ap1-3 -> ap1-4 -> ap1-5 ->
[ap1-7 -> ap1-5] -> ap1-6 -> ap1-8 -> ap1-15.

The Shoemaker's Cell (23) detour is required in practice: it holds
the fourth honest fragment (WALK). A player can reach the gate
without it and will fail the socket count, be told "Four beds for
four words," and go looking — the under-stair door is one room away.

## Room-by-room reasoning (forward-solvable route)

- **1 (Narthex):** lintels GATE / DOOR / ARCH; the prose speaks of
  gates and arches, never echoes DOOR's word. Odd-one-out -> door 7.
  Support: worn bench faces door 7; "the true road cannot mislead" —
  the unlabeled-claim door makes no claim to lie about.
- **7 (Colonnade):** "Count what cannot be divided" — establishes
  the prime rule (Path displays: 1, 7, 11, 13, 17, 19, 23, 29, 31;
  Loop/Trap displays: 4, 6, 8, 9, 22, 24). Onward prime door: 11.
  Fragment THE under the strapped column.
- **11 (Plinths):** "split three ways, four ways, six" derides the
  composite exits; the indivisible plinth carries ONE. Onward prime
  door: 13.
- **13 (Undercroft), the mandatory trick:** four visible exits, all
  composite (8, 9, 6 — one-way drops into the Loop, hinges "set to
  swing one way" — plus return 11). Three independent reveals of
  the fifth door: the Sophist counts five exits; the fifth lit lamp
  burns over a blank wall bearing a stair relief ("lamps are lit
  where someone will walk"); the prime rule demands a prime exit.
  Interacting with the relief opens the two-way secret door to 17.
- **17 (Lamplit Stair):** mirror carries YOU. Under-stair door to
  23 is flagged by the tradesman line.
- **23 (Shoemaker's Cell):** boot sole carries WALK.
- **19 (Gate of Assent):** answer THE ONE YOU WALK, in that order.
  Counterfeits (KEY, NAME, CROWN, REST) are painted; the detector
  ("the maze carves; it does not paint") is taught in 7, 9, and 24.
  Wrong attempts cost nothing.
- **29 (Antechamber):** quest event (the Sophist's First Ledger),
  then the one-way boss door.
- **31 (Hinge Shrine):** the Doorwarden (isBoss). Mercy fork:
  spare -> he names one Act II forgery for free; exploit ->
  material reward. Then the one-way descent to Act II.

## Fragment placement

| Fragment | Kind | Room (display) | POI |
|---|---|---|---|
| THE | honest (carved) | 7 | strapped column |
| ONE | honest (carved) | 11 | intact plinth |
| YOU | honest (carved) | 17 | mirror frame |
| WALK | honest (carved) | 23 | boot sole |
| KEY | counterfeit (painted) | 4 | alcove plaque |
| NAME | counterfeit (painted) | 9 | tucked card |
| CROWN | counterfeit (painted) | 6 | gilt frame |
| REST | counterfeit (painted) | 24 | night-table card |

Act I contributes "THE ONE YOU WALK" to the center Passphrase
(DESIGN.md section 6).

## Graph invariants (for tools/validate-maze.mjs)

- Node count 15; realm split 9 Path / 4 Loop / 2 Trap.
- Directed edges as tabled in act1.md; one-way edges: 13->8, 13->9,
  13->6 (the Undercroft's decoy drops), 8->22, 24->4, 29->31,
  31->descent; gate edge 19->29 blocked until act answer.
- The secret edge 13<->17 is a mandatory cut: removing it
  disconnects {17,19,23,29,31} from the start component. (Checked
  as: no path 1 -> 31 without traversing 13->17.)
- Shortest path 1 -> 31 (with secret open, gate open) = 7 moves and
  is UNIQUE = the intended true path (the Loop offers no shortcut:
  its only touches on the Path are rooms 1 and 7, and the
  Undercroft's decoy doors drop one-way INTO the Loop, never back).
- Trap escapability: every room reaches 31 (given secret + gate),
  including 22 and 24 via 24->4; no absorbing dead end in Act I.
- First-visit room count, perfect play: 9-10 (path + side room).
  Curious-player estimate: 13-15 (full map). Encounter budget at
  ~4 min average: ~40-60 min + quest (~10) + boss (~12) ->
  ~1h00-1h25 of Act I play before riddle-thinking time, matching
  the ~1/3-of-6h target for the easiest act.

## Design intent notes

- Act I is deliberately over-clued (tutorial act): the prime rule
  alone nearly solves it. Acts II-III retire the training wheels —
  numbers become forgeable, prose becomes slipperier, and clue
  chains span rooms.
- The Loop is cheap on purpose here: 4 rooms, all reconnecting to
  early Path rooms, so the lost player's tax is small while the
  lesson (composite numbers, painted words, circulation) lands.
- The trap costs exactly two first-arrival encounters and one long
  walk; it exists to teach one-way doors and the carve/paint
  detector before either matters at the gate.
