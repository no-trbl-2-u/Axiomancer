# Act II — The Archive — SOLUTION (SPOILERS)

> Full walkthrough and validation data for `act2.md`. Marked per
> roadmap Q21.

## True path (7 moves; 9 with the side room)

33 -> 35 -> 39 -> 41 -> (secret) 43 -> [37 detour from 41] -> 45 ->
46 -> 47

By engine id: ap2-1 -> ap2-2 -> ap2-3 -> ap2-4 -> ap2-6 -> ap2-7 ->
ap2-8 -> ap2-9, with the ap2-5 (Map Room) detour off ap2-4.

The Map Room detour is required in practice (fragment ON). A player
who reaches the gate short a word is told "Four beds" (same device
as Act I) and the Map Room is one move from the Misfiled Wing.

## Room-by-room reasoning (forward-solvable route)

- **33 (Deposit Desk):** riddle stated; two doctrines taught before
  they are needed: ask-the-catalogue (fragment verification) and
  iron-vs-hung (number verification).
- **35 (Stacks West):** fragment IT (mark XI.iv). The turnstile
  telegraphs the act's one-way grammar before it costs anything;
  33/34/35 remain freely connected behind you.
- **39 (Catalogue):** fragment RESTS (mark XIV.ii). The chained
  ledger is the oracle: it lists honest marks XI.iv, XIV.ii, IX.i,
  XVII.i — and seventeen stacks, including "XVII: atlases of
  nowhere. Returned." Drawer XVII is empty ("catalogued... and not
  on the floor"). Re-consultation is always possible via the Stair
  of Returns (40 <-> 39), so the one-way turnstile never strands
  the verification loop.
- **41 (Misfiled Wing), the mandatory trick:** the wing shows
  sixteen stacks; the ledger promised seventeen. Rails run under
  the end wall; the Sophist says do the arithmetic. Rolling stack
  XVI aside opens the bay of stack XVII: the secret door to 43.
  The return slot (44) is the trap mouth, telegraphed twice.
- **37 (Map Room):** fragment ON (mark IX.i, iron-framed map).
- **43 (Restorer's Bench):** fragment NOTHING (mark XVII.i, on the
  press under ATLASES OF NOWHERE — the very holding the ledger
  called "returned").
- **45 (Gate):** answer IT RESTS ON NOTHING, in walking order.
  Counterfeits all fail the ledger check: STONE (III.ix), STANDS
  (V.v), FAITH (XIII.iii), UPON (VIII.viii) cite marks the ledger
  lacks; PROOF carries no mark at all. The forgery pile is
  socket-diverse (verb STANDS, preposition UPON, grounds
  STONE/FAITH/PROOF), so the IT-RESTS-ON-X frame cannot be read
  off the counterfeits, and refused submissions accrue in the
  Ledger of Assertions (finale scaling) — guessing is legal,
  never free.
- **46 (Antechamber):** quest (the Sophist's Second Ledger), then
  the one-way boss door.
- **47 (The Spine):** the Index (isBoss). Mercy fork: spare -> one
  free authenticity check at the Foundation (Act III); exploit ->
  material reward. One-way descent to Act III.

## Fragment placement

| Fragment | Kind | Room (display) | Shelf-mark | In ledger? |
|---|---|---|---|---|
| IT | honest (carved) | 35 | XI.iv | yes |
| RESTS | honest (carved) | 39 | XIV.ii | yes |
| ON | honest (carved) | 37 | IX.i | yes |
| NOTHING | honest (carved) | 43 | XVII.i | yes |
| STONE | counterfeit | 34 | III.ix | no |
| STANDS | counterfeit | 36 | V.v | no |
| FAITH | counterfeit | 40 | XIII.iii | no (free-detected if Doorwarden spared) |
| UPON | counterfeit | 42 | VIII.viii | no |
| PROOF | counterfeit | 48 | none | self-detecting |

Act II contributes "IT RESTS ON NOTHING" to the center Passphrase
(DESIGN.md section 6).

## Graph invariants (for tools/validate-maze.mjs)

- Node count 16; realm split 9 Path / 5 Loop / 2 Trap.
- One-way edges: 35->39 (turnstile), 41->44 (return slot), 48->38
  (freight hatch), 44->34 (service stair out of the trap), 46->47
  (boss door), 47->descent; gate edge 45->46 blocked until answer.
- Secret edge 41<->43 is a mandatory cut: no path 33 -> 47 without
  it.
- Shortest path 33 -> 47 (secret open, gate open) = 7 moves and is
  UNIQUE (the only 2-move route to the Catalogue is via the
  turnstile; the Loop's route to 39 via 40 costs 3 moves).
- Trap escapability: 38 <-> 44, 44 -> 34; every room reaches 47.
- Verification-loop property (act-specific): with the turnstile
  already used, 39 remains reachable from every non-trap room
  (via 40) — the ledger can always be re-consulted.
- First-visit rooms, perfect play: 9 (8 spine + Map Room). Typical
  curious player: 12-14. Encounter budget at ~4 min: ~45-60 min +
  quest (~10) + boss (~12): ~1h10-1h25 before riddle-thinking —
  on target for the middle act.

## Design intent notes

- The act's difficulty rise is epistemic, not spatial: the Loop is
  gentle (five rooms, well-connected), but every fragment now
  requires an active verification step (walk to the ledger), and
  the two taught detectors from Act I are deliberately obsoleted
  (paint -> carving) to teach detector rotation.
- The one honest thing the forger did (unmarked PROOF) rewards
  attention to the DETECTOR itself, not just its output — seeding
  Act III, where detectors themselves get forged.
- The Stair of Returns' hung "45" plaque is the mild form of number
  forgery; Act III escalates it (a room that lies about its own
  display number with an iron forgery).
