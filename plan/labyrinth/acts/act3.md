# Act III — The Proof (`aporia-proof`)

> Room-level content for Act III of The Aporia. Grammar and
> doctrine: `../DESIGN.md`; solution: `act3.solution.md`.
> Realm split as authored: 9 Path / 4 Loop / 3 Trap (refines the
> 9/4/3 sketch in DESIGN.md section 3).

## Conventions

Same as Acts I-II, plus the Act III escalations:

- **Checkpoints (per T).** Three Waystones; the first is the act
  entrance. Arrival activates one automatically and freely.
  Waystones are authored rest rooms — ONE-SHOT (first arrival
  only, standard consumed-node semantics; Oubliette ejection does
  NOT re-arm them), meagre per rest doctrine, except the Third
  Waystone whose single rest is authored at the generous end of
  the meagre band (the finale resource floor, DESIGN.md section
  6). The act's signature trap EJECTS to the last activated
  Waystone — never a full reset.
- **Detectors themselves get forged.** The Catalogue is two floors
  up; iron can be counterfeited down here. The act's taught
  detector: **"In the deep house, trust only what bears weight. The
  rest is furniture."** Honest fragments are carved into structural
  stone (thresholds, keystones, milestones, stair treads);
  counterfeits decorate movable things (altars, thrones, chests,
  frames). One room forges an entire IDENTITY: the False Waystone
  wears iron claiming 55 — countered by the doctrine taught at the
  First Waystone: *"The house numbers its bones once. If two rooms
  argue over a name, the one arguing is lying."*
- **The mandatory trick is a door with no number** in a maze where
  every door shows its destination: the Unnumbered Door (homage to
  the book's unnumbered secret door into room 45).
- Act riddle: none at the act gate — Act III's gate IS the center.
  The Foundation poses the continent riddle:
  **"What argument has no first premise?"** — answered by laying
  ALL collected honest fragments, thirteen words in walking order:
  THE ONE YOU WALK / IT RESTS ON NOTHING / IT IS WALKED NOT WON.
- Honest fragments this act (structural): IT, IS, WALKED, NOT, WON.
  Counterfeits (furniture): GIVEN, BUILT, EARNED, FOUND.
- Mercy-fork payoffs: a spared Index (Act II) grants one free
  authenticity check at the Foundation. The Sophist's true name is
  learnable from his three Ledgers (one per act quest): he signs
  them "P.", "Pro-", and "-tas." — **Protas, the First Asker.**
  Naming him at the finale opens the mercy fork (section below).

## Room roster

| Engine id | Display | Name | Realm | Doors (dest display) | Fragment | Override |
|---|---|---|---|---|---|---|
| ap3-1 | 49 | The First Waystone | Path | 51 <->, 50 <-> | — | narration (entrance) + checkpoint |
| ap3-2 | 51 | The Stair of Unsaying | Path | 49 <->, 53 <->, 50 <-> | IT (carved, structural) | — |
| ap3-3 | 53 | The Hall of Withdrawn Statues | Path | 51 <->, 55 <->, 52 <-> | IS (carved, structural) | — |
| ap3-4 | 55 | The Second Waystone | Path | 53 <->, 57 <->, 54 <-> | WALKED (carved, structural) | rest + checkpoint |
| ap3-5 | 57 | The Gallery of Premises | Path | 55 <->, 59 <->, 61 <-> (SECRET) | — | — |
| ap3-6 | 59 | The Third Waystone | Path | 57 <->, 56 <-> | NOT (carved, structural) | rest + checkpoint |
| ap3-7 | 61 | The Foundation | Path | 57 <-> (secret side), 65 (GATE; opens on passphrase) | WON (carved, structural) | narration (revelation) + gate logic |
| ap3-8 | 65 | The Sophist's Study | Path | 61 <->, 63 -> | — | quest (act quest board) |
| ap3-9 | 63 | The Threshold of the Unfounded | Path | exit -> (the Unfounded Door; appears after the finale) | — | encounter, isBoss: the Sophist |
| ap3-10 | 50 | The Anteroom of Almost | Loop | 49 <->, 51 <->, 52 <-> | GIVEN (carved, furniture) | — |
| ap3-11 | 52 | The Corridor of Therefore | Loop | 50 <->, 53 <->, 54 <-> | BUILT (carved, furniture) | — |
| ap3-12 | 54 | The Chamber of the Settled | Loop | 52 <->, 55 <->, 56 <->, 58 <-> | EARNED (carved, furniture) | — |
| ap3-13 | 56 | The Doubtless Hall | Loop | 54 <->, 59 <->, 58 -> | FOUND (carved, furniture) | — |
| ap3-14 | 58 | The False Waystone | Trap | 54 <->, 64 -> | — | — |
| ap3-15 | 64 | The Still Room | Trap | 60 -> | — | — |
| ap3-16 | 60 | The Oubliette of the Settled Mind | Trap | 49 -> (EJECT; engine sends to last activated Waystone) | — | narration (the lesson) |

Graph sanity notes for the validator: intended true path is 7
moves; secret edge `57 <-> 61` (the Unnumbered Door) is the only
route into {61,65,63}; one-way edges `56->58`, `58->64`, `64->60`,
`65->63`; the eject edge `60->49` models the worst-case checkpoint
return (the engine actually sends the player to the LAST activated
Waystone — 49, 55, or 59). Gate edge `61->65` blocked until the
thirteen-word passphrase is laid. There is no room 62 in the deep
house — the display run skips it (the house numbers its bones
once, and one bone is missing; unexplained, MAZE-style).

## Rooms

### ap3-1 — display 49 — The First Waystone (entrance; checkpoint)

Scene: a rough chamber where masonry gives way to living rock. In
the center, a milestone of grey granite, waist-high, its top worn
into a hollow by centuries of resting hands. The number 49 is
carved into the bedrock lintel of each door. Cold air rises from
everywhere at once.

Narration (arrival, replaces random event): "Below the shelving,
below the memory. The house keeps its foundations where it keeps
its doubts, and you are in both. Rest your hand on the stone —
the house will remember you stood here, and return you here if you
settle. Two warnings, and I give them freely, which should worry
you. First: down here, trust only what bears weight. The rest is
furniture. Second: the house numbers its bones once. If two rooms
argue over a name, the one arguing is lying."

POI remarks:
- Milestone: "A true Waystone. It asks for nothing and holds you
  anyway. Note the workmanship: none."
- Bedrock lintels: "Numbers carved where no one could hang them.
  That is what honesty costs."
- Rising cold: "The house breathes up from the Foundation. It has
  been holding that breath a long time."

Clue anatomy: teaches both act detectors (weight-bearing;
bones-numbered-once) before either is needed; establishes what a
TRUE Waystone looks like (bare, granite, unworked) so the False
Waystone's altar reads wrong on sight.

### ap3-2 — display 51 — The Stair of Unsaying

Scene: a stair descending in half-turns; every other tread is
carved with a word that has been struck through — except one tread,
mid-flight, whose word stands unstruck. The walls are scraped, as
if something wide was dragged up, long ago.

Narration: "The philosophers who came down took things back with
every step. Retraction is the only cargo that gets lighter as you
carry it. One word on this stair was never taken back. Stand on
it."

POI remarks:
- Unstruck tread: "IT. Small, load-bearing, and past retraction.
  Like the best of us." (Fragment IT, carved into the tread —
  structural.)
- Struck-through treads: "CERTAINLY. OBVIOUSLY. NATURALLY. All
  retracted, and the stair stands better for it."
- Scraped walls: "Something wide went up. Nothing wide comes down.
  Draw your conclusions narrowly."

### ap3-3 — display 53 — The Hall of Withdrawn Statues

Scene: a long hall of empty niches — the statues withdrawn, not
stolen; each niche's nameplate has been ceremonially folded shut
like a closed book. One keystone in the vault overhead is carved
with a word; it is visibly holding the ceiling.

Narration: "The Archive above keeps what was said. This hall keeps
what was unsaid — every doctrine the house outgrew stood here once,
in stone, and was helped down gently. The vault stands regardless.
Look up. What the ceiling rests on was never withdrawn."

POI remarks:
- Keystone: "IS. The one verb the house never managed to retire."
  (Fragment IS, carved into the keystone — structural.)
- Folded nameplates: "Retired arguments. The house does not mock
  them. I do, but quietly."
- Empty niches: "Absence, arranged respectfully. The house has
  manners about its dead."

### ap3-4 — display 55 — The Second Waystone (checkpoint; rest)

Scene: a granite milestone twin to the first, in a round chamber
of undressed rock. Its flank bears a single carved word, worn
soft. Bedrock lintels read 55. A ring of old bootprints in the
dust, all facing the stone.

Narration: "The second stone. Rest your hand; the house will hold
your place. The travelers who made these prints stood a long time.
Deciding, I imagine, whether going back was defeat. The stone has
an opinion on that. Read it."

POI remarks:
- Milestone flank: "WALKED. Past tense, weight-bearing, and the
  only epitaph this house respects." (Fragment WALKED, carved into
  the milestone — structural.)
- Bootprints: "All arrivals. No two pairs pointing the same way
  out. Good sign, if you can bear it."
- Bedrock 55: "Carved in the bone. Should a room upstairs dispute
  the name, you know the rule."

Clue anatomy: "should a room dispute the name" primes the False
Waystone collision; the rest override makes checkpoints kind
without breaking the meagre-rest doctrine.

### ap3-5 — display 57 — The Gallery of Premises (the secret-edge room)

Scene: a vaulted gallery hung with framed axioms in gilt lettering
— GIVEN THAT, IT FOLLOWS, AS ALL AGREE — their frames bolted to
the walls. Three doors wear bedrock numbers (55, 59) and one arch
at the gallery's end is bare: no number, no plaque, no frame —
dressed stone only, older than the gallery around it.

Narration: "The gallery of premises. Everything here hangs on the
wall, and the wall hangs on nothing anyone framed. They counted
three doors out of this room. I have counted four since before
there were frames. The fourth had nothing to say for itself, which
in this house is the highest recommendation."

POI remarks:
- Framed axioms: "Bolted down. Premises usually are. It saves
  them from the indignity of being carried."
- The bare arch: "No number. Every door in the house tells you
  where it goes — except the one that goes where the house began."
  (The UNNUMBERED DOOR — the secret edge to 61. It is not hidden
  behind anything; it is unmarked, and unmarked is invisible to
  people reading labels.)
- Bedrock 55 / 59 doors: "Named exits, for the label-minded. Both
  true. Neither first."

Clue anatomy — the act's mandatory trick, three independent
forward-solvable clues: (1) prose count — three doors counted,
four claimed, in-room; (2) scene — the bare arch is drawn plainly;
the trick is attentional, not pixel-level (the accordion lists it
as a POI like any other — its label is simply "an unmarked arch");
(3) doctrine — Act I taught that the unlabeled door cannot lie,
and the Narthex lesson recurs here at act scale. Redundant fourth:
Act II's Map Room map ("drawn by someone who never left this
room") shows this gallery with FOUR openings — a cross-act
callback for returners... noted in the Map Room POI at
implementation.

### ap3-6 — display 59 — The Third Waystone (checkpoint; rest)

Scene: the deepest milestone, in a chamber so quiet the lamps burn
without flutter. The stone's top hollow holds a palmful of clear
water that never evaporates. One word is carved on its flank.
Bedrock lintels read 59.

Narration: "The last stone. Past here the house stops offering to
remember you. The water in the hollow is the house's one
extravagance — it keeps it for the hands of people who almost
turned back. Read the flank. The stone is blunt, this deep."

POI remarks:
- Milestone flank: "NOT. The load-bearing word. Every argument
  worth keeping has one somewhere." (Fragment NOT, carved —
  structural.)
- Water hollow: "Drink or do not. The stone will not judge. The
  stone has seen everything and judged twice, total."
- Quiet lamps: "Still air. The Foundation is close. The house
  holds its breath here, remember."

### ap3-7 — display 61 — The Foundation (the center; gate; revelation)

Scene: the oldest room. Deep underground stones carved and fitted
before the maze had a shape; passages of natural rock; on every
face, primitive signs — wind and water, hills and planets —
carved by hands that predate numbers (homage: the book's
foundation room, reference image 08 in chat / research notes). In
the floor's center, a threshold stone with a word worn almost to a
shine. Facing it: a blank door of undressed rock and THIRTEEN
carved sockets in a long arc. Above the door, no inscription at
all.

Narration (arrival, replaces random event): "The Foundation. They
carved wind and water down here before anyone thought to carve
WHY. You have read the house's question on every gate: it asks it
plainly now, once, in its oldest voice. WHAT ARGUMENT HAS NO FIRST
PREMISE? Thirteen beds. Lay what you carried, in walking order.
And mind your pocket — my colleague has been generous with you, I
am sure."

POI remarks:
- Threshold stone: "WON, worn nearly away. The masons carved it
  and then thought better of leaving it legible. Stand on it — it
  bears weight; it is the last thing here that does." (Fragment
  WON, carved into the threshold — structural.)
- Primitive signs: "Wind, water, hills, planets. The house's first
  vocabulary. No verbs. Verbs came later and caused all this."
- The thirteen sockets: "The house's memory of your walking. It
  will know forged steps. It has watched every one."
- The blank door: "No number, no name, no lock. It has been
  unlocked since before locks. That was never the obstacle."

Gate logic: the player lays fragments into the thirteen sockets in
walking order: THE ONE YOU WALK IT RESTS ON NOTHING IT IS WALKED
NOT WON. The house remembers your assents: the eight words already
proven at the two act gates arrive PRE-CONFIRMED in their sockets
("The house remembers your assents. Eight beds are made."), so the
live puzzle is Act III's five words plus counterfeit filtering.
Fragments were never consumed at the act gates — the pocket holds
everything. Any counterfeit (KEY, NAME, CROWN, REST, STONE,
STANDS, FAITH, UPON, PROOF, GIVEN, BUILT, EARNED, FOUND) or
misorder is refused with act-appropriate lines ("Furniture.";
"Right words, wrong walking.") — and every refusal is entered in
the Ledger of Assertions, armed at the finale one room away.
A spared Index (Act II fork) grants ONE free authenticity check on
a socketed word. Unlimited attempts.

On success — the REVELATION (narration): "So. The argument with no
first premise is the one that needs none: the walked one. The
house was never a wall around the last continent. It is the
proving. What lives past that door does not forbid visitors — it
merely cannot be survived by a mind that will not turn back,
revise, retract, resume. The house teaches the turning. I should
know. I am its oldest pupil, and its only failure." Edge 61->65
unblocks permanently.

### ap3-8 — display 65 — The Sophist's Study (quest override)

Scene: a small, warm, terribly ordinary room: a desk, a good chair,
a bad chair, and three ledgers laid out with the care of relics —
the First, Second, and Third, their signatures visible: "P.",
"Pro-", "-tas." A fourth ledger lies open and blank. A ledger
stand (the act quest board).

Narration: "My study. Yes — mine. I signed your paperwork in
thirds; you carried my name through the house without feeling the
weight, which is how names prefer to travel. The house requires
one more ledger before the door. The blank one. It is yours; I
only witness."

Override: `quest` — the Sophist's Third Ledger (act quest board,
boardId at implementation). Fires once, pre-boss (T's rule).

**Debt settlement (the Fourth Ledger):** within the quest, the
blank fourth ledger is the repayment instrument — the player may
settle some or all of their accumulated debt (hint purchases +
refused assertions) at a real price: resources plus an Epistemology
alignment concession. Each settlement reduces the finale's
Borrowed Premise stacks (see ap3-9). The Sophist, on settling:
"Paid in full is a sentence I have never once written. Paid in
part, the house accepts. It knows how arguments end."

POI remarks:
- Three signed ledgers: "P. Pro. Tas. Assemble it if you like. I
  was called it when asking was still my trade." (The name PROTAS —
  the finale mercy key — is confirmable here for players who
  gathered the thirds.)
- The blank fourth ledger: "Yours. Blank is the most expensive
  state a page can be in."
- The good chair: "Mine."
- The bad chair: "Everyone else's. The house's one honest joke."

### ap3-9 — display 63 — The Threshold of the Unfounded (finale; the Unfounded Door)

Scene: a passage of natural rock opening onto a stone jamb with no
door in it — the Unfounded Door: an empty doorway full of weather
from somewhere else: warm air, salt, a light that is not lamplight.
Between the player and the doorway stands the Sophist — visible at
last, and the scene shows only his shadow, thrown long and horned
by the light of the far country.

Narration (pre-fight): "Here is the shame I mentioned. I came down
these same stairs with a mind like a locked archive, and the house
asked me its question, and I would not lay a single word down —
I had carried my premises too far to admit they were furniture. So
I stayed. Warden, narrator, cautionary footnote. You, though. You
turned back eleven times. I counted. I always count. Prove the
walking one last time — through me, or past me. There is a third
way, if you kept your receipts."

Boss: **the Sophist** — encounter override, isBoss, finale-tier.
Design-level fight doctrine (finalize at implementation): his power
comes from **Borrowed Premise** status stacks — CAPPED AT THREE,
visible pre-fight — built from the player's hint debt AND the
Ledger of Assertions ("You argued this for me. You asserted this
for me."). Unsettled debt arms him; the Fourth Ledger (ap3-8) can
have disarmed him partly or fully. Status-effect content per
combat doctrine, never an unbounded stat wall; combined with the
Third Waystone's resource floor, the fight is climbable by every
player who reaches it. Mercy fork per ADR-0007, routed THROUGH the
standard Befriend heart-skill (heart tokens + HP gate +
mercy-choice state): knowing the name PROTAS unlocks the naming
option INSIDE the mercy choice — never a parallel bypass. A player
who EXPLOITED both the Doorwarden and the Index finds the naming
fork closed ("I do not take my name from that mouth"); the
standard spare remains available at the normal gate. Spare: he
gives his last true sentence about the far country. Exploit:
material reward. Finalize in specs/story alongside the character
spec.

Post-victory/post-mercy: the Unfounded Door is simply walked
through. Exit marker -> the last continent. The Sophist, final
line, either fork: "Mind the first step. There is no first step."

### ap3-10 — display 50 — The Anteroom of Almost (Loop)

Scene: a comfortable room that resembles the Narthex closely
enough to unsettle: a bench (unworn), a brazier (lit), and a gilt
side table whose drawer-front is carved with a word.

Narration: "The house rebuilt its own front porch down here, from
memory, flatteringly. People sit. It is always almost time to
decide. The bench is unworn; do the arithmetic on that."

POI remarks:
- Gilt side table: "GIVEN. Carved into a drawer-front, which is to
  say: into furniture. Open the drawer. Empty. Things GIVEN
  usually are." (Counterfeit GIVEN — furniture.)
- Lit brazier: "Fire at last, and it warms a waiting room. The
  house spends comfort where it costs the most."
- Unworn bench: "Nobody rests here. They only sit."

### ap3-11 — display 52 — The Corridor of Therefore (Loop)

Scene: a corridor whose floor tiles are inscribed alternately SO
and THUS, polished by pacing. A wheeled lectern (its casters worn
to flats) bears a carved word on its slope.

Narration: "The corridor where conclusions pace. Back, forth,
therefore, back. The lectern has wheels, note. Arguments that
travel on furniture arrive exactly where the furniture is pushed."

POI remarks:
- Wheeled lectern: "BUILT. Carved handsomely into a thing with
  casters. Weight-bearing? Push it and see." (Counterfeit BUILT —
  furniture.)
- SO/THUS tiles: "Two words taking turns agreeing with each other.
  The house calls this corridor its metronome."

### ap3-12 — display 54 — The Chamber of the Settled (Loop; trap adjacency)

Scene: a firelit chamber of deep armchairs, each with a small
brass plate naming its last occupant — all first names only. A
massive carved chest sits where a hearth should be, its lid
bearing a word. Four ways out, one of them under a bedrock 55...
and one under an IRON-LOOKING 58 whose mortar is suspiciously
fresh; beyond it, glimpsed, a milestone-shaped silhouette.

Narration: "The settled. They chose a chair and the chair agreed
with them, and that was that. Two doors ahead claim stones. One of
them I built no part of. You recall the rule about rooms that
argue."

POI remarks:
- Carved chest: "EARNED. On a lid. Lids lift; earnings should
  not." (Counterfeit EARNED — furniture.)
- Brass plates: "First names only. The settled travel light,
  eventually."
- The fresh-mortared 58: "New masonry imitating old bone. The
  house numbers its bones once — and 55 is already spoken for,
  three rooms east. Someone here is arguing."

Clue anatomy: the False Waystone's forged identity is detectable
from OUTSIDE it, twice (fresh mortar; the 55 collision), before it
costs anything — the fairness rule for the act's cruelest device.

### ap3-13 — display 56 — The Doubtless Hall (Loop; trap shortcut mouth)

Scene: a proud hall lined with completed proofs under glass, QED
after QED, all signed. A display plinth (freestanding, ornate)
carries a carved word. At the far end, a service door stands ajar
on blackness, a draft pulling inward; its hinges are on the
OUTSIDE.

Narration: "The hall of finished arguments. Glass over all of
them, you notice — finished things need protecting from the air
in this house. The far door pulls. Doors that pull are hungry.
Hinges on the outside, mind. Nothing in that room ever needed to
open it from within."

POI remarks:
- Display plinth: "FOUND. Freestanding. You could carry it off,
  word and all, which tells you what the word is worth."
  (Counterfeit FOUND — furniture.)
- Glass-cased proofs: "Signed and settled. The house keeps them
  the way the Archive keeps the news: at the moment they stopped."
- The pulling door (58): "The short way to the resting stone, says
  the draft. Drafts lie with total sincerity." (One-way mouth
  56 -> 58.)

### ap3-14 — display 58 — The False Waystone (Trap)

Scene: at first glance, a Waystone chamber: a milestone, lamps, a
number 58 in aged iron — but the milestone is an ALTAR: worked,
polished, stepped, with cushions before it and a donation bowl.
The room's inner door (64) stands wide and welcoming. The way back
to 54 remains open behind.

Narration: "Ah. The house's understudy. Study it: a stone with
STEPS, cushions for the knees, a bowl for your gratitude. The true
stones ask for a hand and give you back your place. This one asks
for worship and gives you the door it wants you through. It is
furniture pretending to be bone. You may still leave the way you
came. I have watched very few do it."

POI remarks:
- The altar-stone: "Polished. Stepped. Upholstered. Weight-bearing
  it is not — it is BORNE, by cushions and credulity."
- Donation bowl: "Empty. Even the forger's patrons had second
  thoughts, at the end."
- The welcoming inner door (64): "Wide open, like all the best
  mouths."

Clue anatomy: third and fourth detections (altar vs milestone;
asks-vs-gives) available INSIDE the trap mouth while retreat is
still free — the commitment point is the inner door, and it is
marked by every doctrine the act has taught.

### ap3-15 — display 64 — The Still Room (Trap)

Scene: a small round room, felt-lined, lamplit, furnished with one
perfect chair facing a lectern on which rests a book titled THE
COMPLETE ARGUMENT. The door behind has shut without a sound and
has no handle on this side. In the floor, a smooth-lipped
oculus breathes cold air (60).

Narration: "The still room. Everything a settled mind requires:
one chair, one book, no exits worth the name. The book is blank
past page one, but page one is very reassuring. When you tire of
it — and the house is patient — the floor is the only door left
that will have you."

POI remarks:
- THE COMPLETE ARGUMENT: "Page one: 'It is settled.' The remaining
  pages trust you to stop reading. Everyone does."
- The perfect chair: "It fits. That is a property of traps, not of
  truths."
- The oculus (60): "Down, then. The house returns what it cannot
  digest."

### ap3-16 — display 60 — The Oubliette of the Settled Mind (Trap; ejection)

Scene: a smooth stone gullet, utterly dark except for a coin of
light far above. No doors at all. The fall is broken by a great
drift of things: cushions, chair-legs, gilt frames, altar cloth —
a century of confiscated furniture.

Narration (arrival, replaces random event — the lesson): "The
oubliette. French for the polite version of what the house does
here. It does not keep prisoners; it keeps FURNITURE, and it has
never once mistaken a walker for a chair. Up you go — the house is
returning you to your last stone. It does this exactly as gently
as you deserve, which I am told varies."

Ejection: the engine returns the player to the LAST ACTIVATED
Waystone (49, 55, or 59), keeping pocket, progress, and solved
rooms intact. Cost of the whole trap: the first-arrival encounters
of 58/64/60 plus the walk. The Sophist adds, on ejection: "The
chair fit. Remember that it fit."

## Act III quest + boss summary (for implementation)

- Quest: the Sophist's Third Ledger — act quest board at ap3-8
  (display 65), fires once, pre-boss only (T's rule).
- Boss: the Sophist at ap3-9 (display 63), isBoss, finale tier;
  power scales with total hint debt; mercy fork = naming him
  (PROTAS, assembled from the three ledger signatures), HP-gated
  per ADR-0007. Spare/exploit consequences finalized in
  specs/story + specs/characters.
- Exit: the Unfounded Door — one-way exit marker to the last
  continent (wired when that continent exists; until then the CLI
  and dev build treat it as run-complete).

## Authoring compliance checklist (DESIGN.md section 5)

- Mandatory trick (the Unnumbered Door, 57->61): three
  forward-solvable clues (in-room count, plainly drawn bare arch
  listed as an ordinary POI, the Act I unlabeled-door doctrine
  recurring at scale) + cross-act Map Room callback. Not
  pixel-hunted: it is a listed POI whose only concealment is the
  player's own label-reading habit. PASS.
- Negative-space device: the act runs on it (unnumbered arch, no
  inscription above the blank door, first names only). PASS.
- Red herrings: the False Waystone and four furniture counterfeits;
  none touch the mandatory trick; the False Waystone is detectable
  twice BEFORE entry and twice more before commitment. PASS.
- Checkpoints: three Waystones, auto-activating, free rest; the
  ejection trap returns to the last one, never resets the act
  (T's Q1/Q6). PASS.
- Traps escapable: 58 retreats freely; 64/60 resolve by ejection
  (kept progress). No absorbing state. PASS.
- Stuck player: hint tiers available everywhere; the finale makes
  their cost dramatic rather than punitive. PASS.
