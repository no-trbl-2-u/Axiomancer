# Act I — The Colonnade (`aporia-colonnade`)

> Room-level content for Act I of The Aporia. Grammar and doctrine:
> `../DESIGN.md`. SPOILERS for the intended path live in
> `act1.solution.md` — this file contains everything the player can
> encounter, plus authoring notes that do not give the path away
> outright (implementers will see the graph regardless; the
> solution file is where the full walkthrough lives).
> Realm split as authored: 9 Path / 4 Loop / 2 Trap (refines the
> 8/5/2 sketch in DESIGN.md section 3).

## Conventions

- Engine ids `ap1-1 .. ap1-15`. **Display numbers** are what the
  player sees on plaques and door lintels; doors show the display
  number of their DESTINATION (book-accurate). Display numbers are
  honest in Act I.
- `->` one-way door (absent as a POI on the far side). `<->`
  two-way.
- Every room rolls the Act I random pool on first arrival unless an
  Override is listed (pool weights: DESIGN.md section 4).
- POI remark lines are the Sophist's inspection responses — part of
  the clue load. Voice: terse, cold, old; no thee/thou; no emojis.
- The act riddle is stated in ap1-1 and answered at the Gate of
  Assent (ap1-6): **"Name the only road that cannot mislead you."**
- Honest fragments in this act (carved): THE, ONE, YOU, WALK.
  Counterfeits (painted, still wet): KEY, NAME, CROWN, REST.
  Detector line, taught twice: *the maze carves; it does not paint.*

## Room roster

| Engine id | Display | Name | Realm | Doors (dest display) | Fragment | Override |
|---|---|---|---|---|---|---|
| ap1-1 | 1 | The Narthex | Path | 7 <->, 4 <->, 9 <-> | — | narration (entrance) |
| ap1-2 | 7 | The Colonnade Proper | Path | 1 <->, 11 <->, 6 <-> | THE (carved) | — |
| ap1-3 | 11 | The Hall of Plinths | Path | 7 <->, 13 <-> | ONE (carved) | — |
| ap1-4 | 13 | The Undercroft | Path | 11 <->, 8 ->, 9 ->, 6 ->, 17 <-> (SECRET) | — | — |
| ap1-5 | 17 | The Lamplit Stair | Path | 13 <-> (secret side), 19 <->, 23 <-> | YOU (carved) | — |
| ap1-6 | 19 | The Gate of Assent | Path | 17 <->, 29 (GATE; opens on act answer) | — | gate logic |
| ap1-7 | 23 | The Shoemaker's Cell | Path (side) | 17 <-> | WALK (carved) | — |
| ap1-8 | 29 | The Doorwarden's Antechamber | Path | 19 <-> (returns until boss door used), 31 -> | — | quest (act quest board) |
| ap1-15 | 31 | The Hinge Shrine | Path | descent -> (Act II, one-way; appears after victory) | — | encounter, isBoss: The Doorwarden |
| ap1-9 | 4 | The Peristyle | Loop | 1 <->, 9 <->, 8 <-> | KEY (painted) | — |
| ap1-10 | 9 | The Mirror Walk | Loop | 4 <->, 6 <->, 1 <-> | NAME (painted) | — |
| ap1-11 | 6 | The Long Gallery | Loop | 9 <->, 7 <->, 8 <-> | CROWN (painted) | — |
| ap1-12 | 8 | The Cistern Walk | Loop | 4 <->, 6 <->, 22 -> | — | — |
| ap1-13 | 22 | The Oubliette Vestibule | Trap | 24 <-> | — | — |
| ap1-14 | 24 | The Chamber of Rest | Trap | 22 <->, 4 -> (the Long Stair) | REST (painted) | — |

Graph sanity notes for the validator (`../tools/validate-maze.mjs`):
intended true path is 7 moves (see solution file); the side room
adds 2; the secret edge `13 <-> 17` must be the ONLY route from the
{1,7,11,13,4,9,6,8,22,24} component into the {17,19,23,29,31}
component; the Undercroft's decoy exits `13 -> 8/9/6` are one-way
drops (doors that lock behind — the cellar's lesson in tenses), as
are `8 -> 22`, `24 -> 4`, and `29 -> 31`; the gate edge `19 -> 29`
is blocked until the act answer is given.

## Rooms

### ap1-1 — display 1 — The Narthex (entrance; narration override)

Scene: a cold porch of pale stone. Three doors ahead, lintels
carved with single words: the left door (4) reads GATE, the middle
door (7) reads DOOR, the right door (9) reads ARCH. A brazier,
unlit. A stone bench worn smooth in one seat only.

Narration (the Sophist, on arrival — this replaces a random event):
"So. Another argument walks in on two legs. Hear the terms of the
house. Anything here may be a clue. Not every clue is honest.
Neither am I. You will want the road out. There is exactly one that
cannot mislead you — name it at the gate below, and the gate will
assent. The others lead where gates and arches lead: around. I have
watched them go around for a very long time."

POI remarks:
- Bench: "Worn by one sitter. The rest never stayed long enough."
- Brazier: "Cold. Fire is honest and was not wanted here."
- Door 4 (GATE): "A gate promises a wall. Walls promise an inside.
  Promises, promises."
- Door 7 (DOOR): "It says nothing else. How unlike everyone."
- Door 9 (ARCH): "An arch is a doorway that gave up on doors."

Clue anatomy (authoring note): the prose above uses "gate" (twice)
and "arches"; it never says the word carved on door 7's lintel other
than mentioning doors generically — the tutorial negative-space
clue, Room-1 homage: two label-words appear in the Sophist's speech,
the absent label marks the true door. Redundant support: the worn
bench faces door 7; the Sophist's terms say the true road "cannot
mislead" — a door that claims nothing cannot lie.

### ap1-2 — display 7 — The Colonnade Proper

Scene: a roofless avenue of columns marching into painted dark.
Every column bears a carved definite article-sized plaque; one
column, mid-row, is wrapped in a leather strap at shoulder height.
Doors: back to 1; ahead to 11; a low side door to 6.

Narration: "The builders raised these columns to hold up nothing.
It is the most honest work in the house. Count what cannot be
divided, and you will not be misled. The rest is masonry."

POI remarks:
- Strapped column: "Someone bound it so it could not wander. It is
  a column. Where would it go." (Fragment THE, carved beneath the
  strap.)
- Plaques: "Small words hold up large stones."
- Low side door (6): "The long way is popular. Popularity is not an
  argument."

Clue anatomy: "count what cannot be divided" seeds the prime rule
(honest Path rooms in this act wear prime display numbers; the Loop
and Trap wear composites). Forward-solvable foothold number two for
the whole act; pays off hardest at the Undercroft.

### ap1-3 — display 11 — The Hall of Plinths

Scene: a hall of empty pedestals, statues gone. One plinth in the
center is intact and bears nothing but a carved word; the rest are
cracked, their inscriptions defaced.

Narration: "They carried the statues off to the last continent, or
so the story runs. Stories run. Stone stays. Of the many that stood
here, only one kept its footing — the unbroken one. Its fellows
split three ways, four ways, six."

POI remarks:
- Intact plinth: "One. Indivisible. It needed no statue to mean
  something." (Fragment ONE, carved.)
- Defaced plinths: "Split things say split things. Ignore them."
- Door to 13: "Down. The house thinks with its bones."
- Door to 4: "That way smells of rainwater and repetition."

Clue anatomy: "split three ways, four ways, six" repeats the
divisibility motif and names loop numbers (4, 6) as split things;
the unbroken/indivisible plinth reinforces primes and carries the
fragment.

### ap1-4 — display 13 — The Undercroft (the secret-edge room)

Scene: a low vaulted cellar. FOUR visible doors: back up to 11, and
onward to 8, 9, and 6. Along the blank south wall, a row of oil
lamps — five lamps, all burning — though the wall beneath the fifth
lamp shows no door at all, only a shallow relief of a stair. A
floor drain. Barrels gone soft.

Narration: "Thirteen, they said, is an unlucky count, and hurried.
They counted four ways out of this cellar. I have kept house here
longer than they were alive. I count five."

POI remarks:
- Lamp row: "Lamps are lit where someone will walk. The house does
  not waste oil."
- Relief of a stair: "Decorative, surely. The mason carved a stair
  going up on a wall with nothing behind it. Masons are such
  dreamers." (Interacting here reveals the SECRET DOOR to 17.)
- Drain: "Even the rain leaves this room eventually. Follow
  something that leaves."
- Doors 8 / 9 / 6: "Eight is twice four. Nine is thrice three. Six
  is friendly with both. What good company they keep. Note the
  hinges — set to swing one way, like most convictions."

Clue anatomy — the act's mandatory trick, clued three independent
ways, all forward-solvable: (1) prose arithmetic — the Sophist
counts five exits where four are visible; (2) scene — the fifth lit
lamp burns over blank wall + stair relief, and lamps-mean-walking
is stated in the same room; (3) numbers — every visible onward door
is composite and the room mocks them for it; the prime rule
(seeded in 7, reinforced in 11) demands a prime exit exist. The
secret door, once revealed, is two-way — retreat is allowed.

### ap1-5 — display 17 — The Lamplit Stair

Scene: a narrow stair rising behind the Undercroft wall, lamps at
every seventh step. A landing with a lead-glass mirror, clouded. A
small door to 23 tucked under the stair; the stair tops out at 19.

Narration: "You found the wall's other opinion. Good. Few meet the
stair; fewer meet the one climbing it. Look, there — in the glass.
The only companion who takes every step you take and forgives none
of them."

POI remarks:
- Clouded mirror: "It shows the climber. It has never once shown
  anyone else." (Fragment YOU, carved into the mirror frame.)
- Under-stair door (23): "A cell for the man who shod the walkers.
  Tradesmen keep the truest ledgers."
- Lamps: "Every seventh step. The house is showing off now."

### ap1-7 — display 23 — The Shoemaker's Cell (side room)

Scene: a monk-narrow cell. A cobbler's bench, an iron last, and
one pair of boots soled through to the welt. A tally wall: strokes
in fours, crossed by fifths.

Narration: "He mended boots for everyone the maze ate. He kept
count on the wall and kept his opinions in the leather. When his
own soles wore through, he did the sensible thing. He kept going."

POI remarks:
- Worn boots: "Worn is a word for proven." (Fragment WALK, carved
  into the boot sole.)
- Tally wall: "He counted walkers, not winners. There is no column
  for winners."
- Bench: "Tools of a man who fixed the means and let the ends fix
  themselves."

### ap1-6 — display 19 — The Gate of Assent (act gate)

Scene: a single great door of black wood, no handle, no keyhole. A
lectern before it with four empty carved sockets in a row. Above
the door: "SAY THE ROAD."

Narration: "Here the house asks its question back. Name the only
road that cannot mislead you. Lay the words in their walking order.
It will know a forgery — it always knows. So do I, but I charge."

Gate logic: the player arranges collected fragments into the four
sockets. Correct: THE ONE YOU WALK -> the door swings without
sound; edge 19->29 unblocks permanently. Incorrect (any counterfeit
or wrong order): the door stays; the Sophist responds per attempt
("Painted words. You brought me paint."; "Right words, wrong feet.
Order is an argument too."). No other penalty; unlimited attempts.

POI remarks:
- Sockets: "Four beds for four words. The house sleeps poorly
  until they lie right."
- The black door: "It has no lock because it has no doubt."

### ap1-8 — display 29 — The Doorwarden's Antechamber (quest override)

Scene: a vestry hung with hinges — hundreds, oiled and labeled in
an alphabet nobody reads. A ledger stand (the act quest board). The
far door (31) stands ajar exactly the width of a hand.

Narration: "Past that door waits the Doorwarden, who loved
openings so much he became one. He will not let you pass, of
course. First, the house requires its paperwork. Everything here is
somebody's ledger."

Override: `quest` event — the Sophist's First Ledger (act quest
board, boardId assigned at implementation). Fires once, before the
boss door can be used (T's rule: quest only here, immediately
pre-boss).

POI remarks:
- Hinge wall: "Every door that ever shut in this house is
  remembered here. The ones that opened need no memorial."
- Ledger stand: "Sign nothing you have not read. Read nothing you
  cannot survive."

### ap1-15 — display 31 — The Hinge Shrine (boss; then descent)

Scene: a round chapel whose walls are doors — dozens, frames
mortared shut, and at the center a figure of jointed bronze
kneeling in prayer: the Doorwarden. After the fight, one floor
hatch stands open where the altar stood: the descent to Act II.

Narration (pre-fight): "He asked the house to make him useful, and
the house, which has a sense of humor, obliged. He is every door
you did not choose. He holds it against you."

Boss: **The Doorwarden** — encounter override, isBoss, pinned level
band per implementation. Mercy fork per ADR-0007: sparing him is
possible and consequential (he remembers doors; a spared Doorwarden
names one forgery in Act II — a single free counterfeit detection —
exploit instead for a material reward; design note for
specs/story).

Post-victory: the descent hatch (one-way) is the only exit. The
Sophist: "Down, then. The house saves its best manners for the
cellar guests."

### ap1-9 — display 4 — The Peristyle (Loop)

Scene: a rain-worn courtyard circling a dry fountain. A ring of
keys nailed above an alcove, every key snapped at the shoulder. An
alcove plaque, paint glistening.

Narration: "The courtyard is beloved. It brings everyone back to
it, which they mistake for affection. Note the keys. The house
collects them from optimists."

POI remarks:
- Broken keys: "A key is a promise about a lock. The house makes no
  such promises."
- Alcove plaque: "Fresh paint. In a house of carvers." (Counterfeit
  fragment KEY, painted, still wet.)
- Fountain: "Dry. Circulation is not nourishment."

### ap1-10 — display 9 — The Mirror Walk (Loop)

Scene: a corridor doubled by facing mirrors; signs hang reversed in
the glass. One sign reads correctly only in reflection: a painted
word on a card tucked into a frame.

Narration: "Walk it as long as you like; it is generous with
itself. The signs read backwards. Some people find that profound.
It is glass, doing what glass does."

POI remarks:
- Reversed signs: "The house carves what it means. What is merely
  reflected, it lets lie."
- Tucked card: "Paint again. The painter follows you, I think."
  (Counterfeit fragment NAME, painted.)

### ap1-11 — display 6 — The Long Gallery (Loop)

Scene: portrait frames the length of a tithe barn, all empty but
one: a gilt frame holding a painted crown on a cushion, no head
beneath it.

Narration: "The gallery of everyone who mastered the house. Notice
the abundance. The one finished portrait is of the prize itself —
they never did find anyone to wear it."

POI remarks:
- Gilt frame: "Painted, cushion and all. The house has never
  crowned anything." (Counterfeit fragment CROWN, painted.)
- Empty frames: "Reserved. Optimism, again."

### ap1-12 — display 8 — The Cistern Walk (Loop; trap mouth)

Scene: a walkway over black water. Three openings — two honest
arches (4, 6) and one low brick chute (22) breathing cold air
upward, its lip worn glass-smooth.

Narration: "Mind the fourth opening. It is the house's throat, and
the house swallows without chewing. I mention this because no one
listens, and I enjoy being right."

POI remarks:
- Chute lip (22): "Smooth as a lie told twice. Things go down it.
  Count what comes back up." (The one-way edge 8 -> 22; the far
  side has no matching door POI.)
- Black water: "Deep enough. For what, it declines to say."

Clue anatomy: the trap mouth is deliberately telegraphed twice
(prose warning + worn-smooth remark), per fairness rules — Act I
punishes inattention, not curiosity.

### ap1-13 — display 22 — The Oubliette Vestibule (Trap)

Scene: the chute's landing room. Scuffed floor, tallow stubs, one
archway onward (24). The chute overhead is a smooth ceiling mouth
no ladder reaches.

Narration: "Welcome to the underside of your decision. The way you
came does not exist from this side — the house is strict about
tenses. There is a room ahead with a bed in it. I will wait."

POI remarks:
- Ceiling mouth: "You may address complaints to it. It has heard
  them all."
- Tallow stubs: "Others sat here adjusting to the new arrangement."

### ap1-14 — display 24 — The Chamber of Rest (Trap; homage to the book's room 24)

Scene: a made bed, impossibly clean. A night-table with a painted
card leaning on a carafe. A long stair (the Long Stair) climbing
into dark toward 4.

Narration: "The house provides. A bed, a word, a stair. The bed is
real, I grant it — rest is the one counterfeit everyone forgives.
The stair is long and the stair is honest, which is more than I can
say for the furniture's literature."

POI remarks:
- Painted card: "REST, it says. Paint. On the softest lie in the
  building." (Counterfeit fragment REST, painted.)
- The Long Stair (4): "Every step of it earned. Up you go — poorer,
  wiser, and in that order."
- Bed: "Sleep if you must. The house charges nothing. The house
  already has what it wanted."

Clue anatomy: the trap is escapable by walking (the Long Stair,
one-way up to 4), costs only what was spent getting here (two
first-arrival encounters), and teaches the carve/paint detector a
second time before the gate needs it.

## Act I quest + boss summary (for implementation)

- Quest: the Sophist's First Ledger — act quest board at ap1-8,
  fires once, pre-boss only (T's rule).
- Boss: The Doorwarden at ap1-15, isBoss, mercy fork per ADR-0007
  (spared: one free forgery detection in Act II; exploited:
  material reward — finalize in specs/story).
- Descent: one-way to Act II entrance (`aporia-archive`).

## Authoring compliance checklist (DESIGN.md section 5)

- Mandatory trick (secret door 13->17): three independent
  forward-solvable clues (prose count, lamp/relief scene, prime
  rule). PASS.
- Negative-space device: taught in ap1-1 (absent lintel word). PASS.
- Red herrings: none on the mandatory trick; counterfeits carry a
  taught detector (carve vs paint, stated in ap1-2/ap1-10/ap1-14).
  PASS.
- Stuck player: hint tiers available everywhere via accordion. PASS.
- Trap: escapable by walking; telegraphed twice at the mouth. PASS.
