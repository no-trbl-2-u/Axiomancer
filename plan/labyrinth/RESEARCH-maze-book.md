# Research: MAZE — Solve the World's Most Challenging Puzzle

> Scout report (2026-07-07), condensed to the design-relevant facts.
> Sources: eblong.com/zarf/mazebook.html (official Henry Holt
> solution sheet + hint letters), Wikipedia, MazeCast, Dreams of
> Gerontius, Typebar Magazine, Electric Literature, Into the Abyss
> (site 503 at research time; cited via snippets). Confidence notes
> at the end.

## Structure

- 45 numbered rooms, one illustrated spread each: full-scene drawing
  with numbered doors + a short prose narration by the Guide.
- Three official puzzle layers, mutually gating:
  1. **Path**: Room 1 -> Room 45 -> Room 1 in exactly 16 steps.
  2. **Riddle**: find and read the riddle hidden in Room 45.
  3. **Answer**: the riddle's answer is concealed word-by-word /
     letter-by-letter along the shortest path only.
  Plus an unofficial fourth (never solved): the Guide's identity is
  itself a hidden puzzle.
- **Official 16-step solution**:
  1-26-30-42-4-29-17-45 (7 steps in), 45-23-8-12-39-4-15-37-20-1
  (9 steps out). Room 4 is visited twice via different doors.
- **Directed graph**: doors with numbers lead out; unnumbered doors
  are entrance-only (one-way edges). Spatially consistent. The
  asymmetric return (9 out vs 7 in) is caused by one-way doors.
- **The killer trick**: mapping all *numbered* doors yields NO route
  to 45 at all. The only entrance to 45 is an unnumbered secret door
  in Room 17; Room 17 is reachable only via a door hidden by a
  perspective trick in Room 29 (redundantly clued — Manson knew it
  was the choke point). Fan math: ~1-in-31 chance of wandering back
  into Room 29, so systematic mapping is mandatory.
- Doors per room: typically 2-5. Room 39 has a bricked-up fake door
  (red herring).

## Realm topology (Into the Abyss taxonomy)

- **The Path** (19 rooms; upper level): the 15 unique true-path rooms
  + 4 side rooms.
- **The Loop** (19 rooms; ground level): recirculating churn with
  exactly six exits — five into the Trap, ONE back to Room 1. Soft
  punishment = tedium.
- **The Trap** (7 rooms; lower level): 6, 11, 22, 38, 40, 43 form a
  sub-loop whose only exit is Room 24 — which has NO exits: the
  book's sole ending state ("You are here with the rest of us
  now..."). No route from Trap back to anywhere. Entered by many
  Path doors, five Loop doors, and two non-door one-way chutes: a
  ladder in Room 17 (!) and a slide in Room 41. Even the mandatory
  antechamber of victory contains a direct drop into doom.

## Clue design

- **Room 1, the tutorial clue**: four doors labeled Tale, Story,
  Yarn, Fable. Three of those words appear (sometimes as anagrams,
  "nary" = Yarn) in the room's prose; "Fable" never does. The odd
  one out — door 26 — is correct. House style: "the silences of the
  Maze are as eloquent as the sounds" (negative-space clues).
- **Object rebuses** (Room 45's riddle): W + hat = "What";
  horseshoe + U = "house"; awl = "all" (vs a nun = "none"); "elvi"
  letters = "live"; eye + sideways Z (N) = "in". Riddle: **"What
  house will all live in?"**
- **Answer**: **"Like Atlas, you bear it upon your shoulders"** (the
  World / Earth / the Globe). Hidden along the path: the 7 inbound
  rooms hide the 7 words in order (1 "Like" backwards on a banner;
  26 salt + A = anagram ATLAS; 30 "Why 'O' and 'U'?" = you; 42 a
  literal bear; 4 "it"; 29 up+on; 17 Y-O-U-R as spoken letters); the
  9 outbound rooms spell S-H-O-U-L-D-E-R-S one letter each.
- **Untrustworthiness is doctrinal**: the Directions page warns
  "anything might be a clue... not all clues are trustworthy."
- **Fairness failure (the documented lesson)**: several true-path
  clues are hindsight-only (Room 4's evidence is circumstantial; the
  Room 45 "Woodrow Wilson / William Shakespeare" chain confirming
  "the world" is borderline absurdist). Fan consensus: "justifying
  answers after you've found the path is a lot easier than solving
  the clues first." Nobody solved layers 2-3 during the 1985-87
  contest; the $10,000 was split among ~12 entrants who found only
  the path, and even that required two published hint letters.

## The Guide

- Author-confirmed: the Guide is the **Minotaur**. Never appears in
  any illustration; exists only as narrating voice. Prologue: "They
  never noticed my crown, my pain, the fire in my eyes... They
  should call me Cerberus. I am the lesson."
- Voice: aristocratic, wounded, menacing, insinuating ellipses
  ("Perhaps I will..."). Mocks visitors' inattention; drops real
  door clues inside idle chatter; declared motive to deceive — so
  trust calibration is itself a puzzle mechanic. He is simultaneously
  the hint channel and the horror element.

## Adaptations

- *The Riddle of the Maze* (1994, Interplay/Fathom, Mac CD-ROM):
  faithful, colorized, voice-acted, optional hints. Lesson: literal
  digitization works but **erodes difficulty** — free navigation +
  save states trivialize the Trap, and the physical mapping labor
  (much of the intended experience) disappears.
- Henry Holt hypertext version (1996); Into the Abyss hypertext
  (with Manson's permission) is what the modern community solves on.
- MAZE is proto-Myst: environmental storytelling, clue-bearing still
  images, hostile-narrator framing.

## Transferable design rules for our three acts

1. One-way directed graph with a single **redundantly-clued secret
   edge** as each act's spine.
2. A phrase/letter payload distributed strictly along the true path
   so route-finding and riddle-solving **verify each other**.
3. A **Loop before a Trap**: recoverable churn first, committed
   failure only past a legible threshold.
4. An unreliable diegetic narrator as the clue channel; trust
   calibration is a mechanic.
5. Negative-space clues (the odd one out) as house style; red
   herrings allowed but every mandatory trick must be redundantly
   clued.
6. **Avoid the book's failure mode**: hindsight-only clues with no
   forward-solvable foothold. Hard-but-fair means every required
   deduction has at least one forward path.
7. Digitization warning: since the app auto-maps and auto-saves,
   difficulty must come from the puzzle content and the
   encounter-cost economy of wandering, not from mapping labor.

## Confidence

- Path / riddle / answer text: HIGH (official solution sheet).
- Rebus + letter-placement details: MEDIUM-HIGH (fan reconstruction;
  Manson: "broadly right, details possibly off"; rooms 23/39/15/37
  letters disputed).
- Trap/Loop room lists + chutes: MEDIUM (Into the Abyss via
  snippets; site down at research time).
- Guide = Minotaur: HIGH (author-confirmed). Mechanism of the
  guide-identity riddle: unpublished, treat as unknowable.
