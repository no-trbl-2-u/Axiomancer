# Act III — The Proof — SOLUTION (SPOILERS)

> Full walkthrough and validation data for `act3.md`. Marked per
> roadmap Q21.

## True path (7 moves)

49 -> 51 -> 53 -> 55 -> 57 -> (secret) 61 -> 62 -> 63

By engine id: ap3-1 -> ap3-2 -> ap3-3 -> ap3-4 -> ap3-5 -> ap3-7 ->
ap3-8 -> ap3-9, with a required detour 57 -> 59 -> 57 (the Third
Waystone holds fragment NOT and the last checkpoint).

Fragment-complete play is 9 moves: the spine plus the 59 detour.
All five honest fragments sit ON the spine or one move off it.

## Room-by-room reasoning (forward-solvable route)

- **49 (First Waystone):** both act detectors taught (bears-weight;
  bones-numbered-once); checkpoint activates.
- **51 (Stair of Unsaying):** fragment IT on the unstruck tread
  (structural). The struck-through treads model the act's theme:
  retraction as strength.
- **53 (Withdrawn Statues):** fragment IS on the load-bearing
  keystone.
- **55 (Second Waystone):** checkpoint + rest; fragment WALKED on
  the milestone flank; primes the number-collision rule.
- **57 (Gallery of Premises), the mandatory trick:** three doors
  counted by label-readers, four by the Sophist. The bare arch —
  the Unnumbered Door — is a plainly listed POI; its concealment is
  purely attentional (the book's unnumbered-door-into-45 homage,
  made fair per our rules). Act I's Narthex doctrine (the unlabeled
  door cannot lie) recurs at act scale. Cross-act redundancy: Act
  II's Map Room map shows this gallery with four openings.
- **59 (Third Waystone):** one move off the spine; fragment NOT;
  the final checkpoint before the center.
- **61 (The Foundation):** fragment WON on the threshold stone
  (the thirteenth word, in the room where it is needed — findable
  before or during the socket work). The center riddle: "What
  argument has no first premise?" Lay thirteen honest fragments in
  walking order: THE ONE YOU WALK IT RESTS ON NOTHING IT IS WALKED
  NOT WON. Counterfeit filters, act by act: painted (I), unlisted
  shelf-marks (II), furniture (III). A spared Index grants one free
  authenticity check. On success: the revelation, and 61->62 opens.
- **62 (The Sophist's Study):** quest (the Third Ledger). The three
  ledger signatures P. / Pro- / -tas assemble the finale mercy key:
  PROTAS.
- **63 (Threshold of the Unfounded):** the Sophist, finale boss;
  his power scales with the player's total hint debt. Mercy fork:
  name him (PROTAS) — HP-gated per ADR-0007. Then the Unfounded
  Door: the exit to the last continent.

## Fragment placement

| Fragment | Kind | Room (display) | POI | Detector verdict |
|---|---|---|---|---|
| IT | honest | 51 | unstruck stair tread | structural (bears weight) |
| IS | honest | 53 | vault keystone | structural |
| WALKED | honest | 55 | milestone flank | structural |
| NOT | honest | 59 | milestone flank | structural |
| WON | honest | 61 | threshold stone | structural |
| GIVEN | counterfeit | 50 | gilt side table drawer | furniture |
| BUILT | counterfeit | 52 | wheeled lectern | furniture (casters) |
| EARNED | counterfeit | 54 | chest lid | furniture (lid lifts) |
| FOUND | counterfeit | 56 | freestanding plinth | furniture (portable) |

Act III contributes "IT IS WALKED NOT WON" — completing the
Passphrase: THE ONE YOU WALK / IT RESTS ON NOTHING / IT IS WALKED
NOT WON (DESIGN.md section 6).

## The False Waystone and the Oubliette (trap anatomy)

Funnel: 54 <-> 58 (open approach) and 56 -> 58 (one-way "shortcut"
behind the pulling door). Detections before any cost: fresh mortar
under an iron-styled 58->55 forgery... (the forged number is
described in-scene as claiming 55; the roster carries the TRUE
display 58); the 55 name-collision rule (taught at 49, primed at
55, applied at 54); the altar-vs-milestone read and asks-vs-gives
read available inside 58 while retreat is free. Commitment point:
58 -> 64 (door with no inner handle), then 64 -> 60 (the oculus),
then ejection 60 -> last activated Waystone with pocket and
progress intact. Total worst-case cost: three first-arrival
encounters and a walk — plus the lesson.

## Graph invariants (for tools/validate-maze.mjs)

- Node count 16; realm split 9 Path / 4 Loop / 3 Trap.
- One-way edges: 56->58, 58->64, 64->60, 62->63, 63->exit; eject
  edge 60->49 (worst-case model of return-to-last-Waystone); gate
  edge 61->62 blocked until the passphrase is laid.
- Secret edge 57<->61 is a mandatory cut for reaching 63.
- Shortest path 49 -> 63 (secret open, gate open) = 7 moves,
  UNIQUE (every Loop deviation adds at least one move; the Loop
  touches the spine only at 49/51/53/55/59).
- Every room reaches 63 (the ejection edge guarantees the trap
  complex drains back to the spine).
- All honest fragments reachable on a Path-realm-only walk.
- Unstated easter-egg redundancy (never taught, MAZE-style): every
  Path room in this act wears an odd display number; Loop and Trap
  rooms wear even ones. Holds for the False Waystone too — its
  TRUE number 58 is even; the 55 it forges is odd.
- First-visit rooms, perfect play: 9-10. Typical: 13-15 (the act
  is designed to make the player tour the Loop while hunting the
  fourth door). Encounter budget at ~4-5 min (act III bands):
  ~55-70 min + quest (~10) + finale (~15): ~1h20-1h35 before
  riddle-and-socket thinking — the longest act, as intended.

## Continent-level time check (roadmap Q10)

Act I ~1h00-1h25 + Act II ~1h10-1h25 + Act III ~1h20-1h35 =
~3h30-4h25 of structured play, plus cross-act riddle thinking,
hint dialogues, map study, and backtrack navigation (~1h30-2h) —
landing on the ~5.5-6.5h band around T's 6h target. Tuning levers
if playtests disagree: pool weights (DESIGN 4), encounter length
bands, Loop sizes.

## Design intent notes

- Act III inverts the trust curve: Acts I-II taught detectors the
  player could outsource to (paint, ledger); Act III's detector is
  a JUDGMENT ("does this bear weight?") — the mechanical rehearsal
  of the revelation.
- The False Waystone forging a CHECKPOINT is the act's one
  deliberate cruelty, and it is quadruple-clued before commitment;
  it exists so that the real Waystones' kindness is never taken as
  furniture.
- The finale's hint-debt scaling makes the Guide's economy pay off
  dramatically rather than punitively: the player fights exactly
  the amount of borrowed certainty they purchased.
