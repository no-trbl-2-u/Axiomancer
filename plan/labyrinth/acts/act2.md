# Act II — The Archive (`aporia-archive`)

> Room-level content for Act II of The Aporia. Grammar and doctrine:
> `../DESIGN.md`; solution and walkthrough: `act2.solution.md`.
> Realm split as authored: 9 Path / 5 Loop / 2 Trap (refines the
> 8/6/2 sketch in DESIGN.md section 3).

## Conventions

Same as Act I (`act1.md` "Conventions"), plus the Act II escalations:

- **One-way doors dominate.** Turnstile doors and closing shelves
  make the spine partially irreversible; returning to earlier rooms
  is done AROUND, through the Loop. (Solved rooms stay free to
  re-cross, so verification trips cost navigation, not attrition.)
- **Numbers can be forged.** Honest room numbers are set in iron or
  carved on the lintel; forgeries hang on rope or nails. Detector
  taught in-act: *"Iron numbers were set by the masons. The hanging
  kind arrive later, like opinions."*
- **Counterfeit fragments are now carved** (the forger has
  improved). New detector, the Act's signature cross-room chain:
  every honest fragment bears a shelf-mark that appears in the
  Catalogue's ledger; forgeries cite shelf-marks the Catalogue does
  not contain. *"The Archive remembers its own. Ask the catalogue."*
- The prime rule from Act I is deliberately retired (displays here
  are a plain run, 33-48) — over-fitting Act I's crutch is itself
  the lesson.
- Act riddle, stated in ap2-1 and answered at the Gate of Assent
  (display 45): **"What does the true argument stand on?"**
- Honest fragments: IT, RESTS, ON, NOTHING (shelf-marked, in the
  ledger). Counterfeits: STONE, STANDS, FAITH, UPON, PROOF
  (shelf-marked, NOT in the ledger). Deliberately socket-diverse:
  STANDS forges the verb (competes with RESTS), UPON forges the
  preposition (competes with ON), STONE/FAITH/PROOF forge the
  ground — so the answer frame cannot be inferred from the forgery
  pile and lawnmowering the final socket alone cannot win.
- A spared Doorwarden (Act I mercy fork) names one forgery here for
  free (FAITH, in the Stair of Returns).

## Room roster

| Engine id | Display | Name | Realm | Doors (dest display) | Fragment | Override |
|---|---|---|---|---|---|---|
| ap2-1 | 33 | The Deposit Desk | Path | 35 <->, 34 <->, 36 <-> | — | narration (entrance) |
| ap2-2 | 35 | Stacks West | Path | 33 <->, 34 <->, 39 -> | IT (carved) | — |
| ap2-3 | 39 | The Catalogue | Path | 41 <->, 40 <-> | RESTS (carved) | — |
| ap2-4 | 41 | The Misfiled Wing | Path | 39 <->, 37 <->, 44 ->, 43 <-> (SECRET) | — | — |
| ap2-5 | 37 | The Map Room | Path (side) | 41 <-> | ON (carved) | — |
| ap2-6 | 43 | The Restorer's Bench | Path | 41 <-> (secret side), 45 <-> | NOTHING (carved) | — |
| ap2-7 | 45 | The Gate of Assent | Path | 43 <->, 46 (GATE; opens on act answer) | — | gate logic |
| ap2-8 | 46 | The Index's Antechamber | Path | 45 <->, 47 -> | — | quest (act quest board) |
| ap2-9 | 47 | The Spine | Path | descent -> (Act III; appears after victory) | — | encounter, isBoss: The Index |
| ap2-10 | 34 | The Periodicals Rotunda | Loop | 33 <->, 35 <->, 36 <->, 40 <-> | STONE (carved, false mark) | — |
| ap2-11 | 36 | The Scriptorium | Loop | 33 <->, 34 <->, 42 <-> | STANDS (carved, false mark) | — |
| ap2-12 | 40 | The Stair of Returns | Loop | 34 <->, 39 <->, 42 <-> | FAITH (carved, false mark) | — |
| ap2-13 | 42 | The Bindery | Loop | 36 <->, 40 <->, 48 <-> | UPON (carved, false mark) | — |
| ap2-14 | 48 | The Unshelved Corridor | Loop | 42 <->, 38 -> | PROOF (carved, false mark) | — |
| ap2-15 | 38 | The Weight of Volumes | Trap | 44 <-> | — | — |
| ap2-16 | 44 | The Return Slot | Trap | 38 <->, 34 -> | — | — |

Graph sanity notes for the validator: intended true path is 7 moves;
secret edge `41 <-> 43` is the only route into {43,45,46,47}; the
turnstile `35 -> 39` makes the Catalogue re-reachable only via the
Loop (40 <-> 39) — deliberate, since the ledger must be consulted
repeatedly; one-way edges `35->39`, `41->44`, `48->38`, `44->34`,
`46->47`; gate edge `45->46` blocked until the act answer.

## Rooms

### ap2-1 — display 33 — The Deposit Desk (entrance; narration override)

Scene: a counter of black oak under a rotunda. Behind it, pigeon
holes to the ceiling, each with a brass ring where a tag once hung —
every ring empty. Three ways out: iron 35 over a broad arch, iron
34 under a clerestory, iron 36 past the desk. A bell on the
counter, its clapper removed.

Narration (arrival, replaces random event): "The Archive. Every
argument ever surrendered at the door is shelved here, catalogued,
and quietly corrected. Mind the shelving; it closes behind readers
the way minds do. You will be asked, below, what the true argument
stands on. The holdings are extensive. The answer is not on
display. Also — my colleague the forger works these halls now. He
carves nicely. Ask the catalogue what it owns."

POI remarks:
- Empty pigeon holes: "Receipts for every surrendered certainty.
  Redeemable never."
- Clapperless bell: "For assistance. The house removed the part
  that assists."
- Iron numbers: "Set by the masons when the walls were young.
  Nothing hung. Remember the difference."

Clue anatomy: states the act riddle; establishes the
catalogue-verification doctrine and the iron-vs-hung numbers
doctrine before either is needed; warns (honestly) that shelving
closes behind — the one-way doors ahead.

### ap2-2 — display 35 — Stacks West (turnstile room)

Scene: stacks in long ranks, spines out, all blank. A brass
turnstile fills the far arch under iron 39 — oiled, silent,
plainly one-directional. A reading stand holds a single open folio.
Exits: back to 33, sideways to 34, and the turnstile.

Narration: "Blank spines. The Archive does not advertise. The
turnstile ahead turns one way, like most of the decisions that
matter. Through it lies the Catalogue, which is the building's
memory and the only honest gossip in the house."

POI remarks:
- Open folio: "Shelf-mark XI.iv. The word is carved into the stand
  beneath it. Someone meant it to outlast the paper." (Fragment IT,
  carved, shelf-mark XI.iv.)
- Turnstile: "It will not object to your going. It objects to
  regret."
- Blank spines: "The titles are inside. Commitment is required."

### ap2-3 — display 39 — The Catalogue

Scene: a vaulted hall filled by one piece of furniture: a card
catalogue the size of a granary, drawers labeled in roman numerals
I through XVII. A standing ledger chained to a lectern. Iron 41
beyond; an open stair arch under iron 40.

Narration: "The Catalogue. Seventeen stacks, listed and loved.
The Archive remembers its own — ask it before you believe anything
carved in this wing. I will wait. Reading has always been the
fastest way to slow a person down."

POI remarks:
- Chained ledger: "Stack XI: dicta and definite articles. Stack
  XIV: cartography, honest and otherwise. Stack XVII: atlases of
  nowhere. Returned, it says. Returned whence, it does not say."
  (THE LEDGER: authoritative shelf-mark list. Honest marks in this
  act: XI.iv, XIV.ii, IX.i, XVII.i. It contains NO stack XX, no
  mark III.ix, no mark V.v, no mark XIII.iii, no mark VIII.viii.)
- Drawer XVII: "Empty. Catalogued, beloved, and not on the floor.
  A room can be misfiled as easily as a book."
- Stair arch (40): "The Stair of Returns. Everything in this
  building comes back eventually except time."

Fragment: RESTS — carved into the lectern's base, shelf-mark
XIV.ii. (In the ledger: honest.)

Clue anatomy: the ledger is the act's verification oracle AND the
first leg of the mandatory trick — it lists seventeen stacks; the
Misfiled Wing shows sixteen.

### ap2-4 — display 41 — The Misfiled Wing (the secret-edge room)

Scene: a wing of rolling stacks on floor rails, numbered in iron
I through XVI. Sixteen stacks. The rails, though, run PAST stack
XVI and under the end wall, where a return slot gapes at knee
height (44). A side door under iron 37.

Narration: "Sixteen stacks. The catalogue is rarely wrong and never
modest, so do the arithmetic yourself. Mind the slot in the end
wall; the Archive takes returns seriously and questions later."

POI remarks:
- Floor rails: "Rails do not run to walls for nothing. Things roll.
  Walls, occasionally, are rolled to."
- Stack XVI: "The last stack, allegedly. It sits on its rails like
  a guilty man sits on a secret." (Interacting rolls stack XVI
  aside: the SECRET DOOR to 43 — stack XVII's bay, walled in
  plaster the color of old paper.)
- Return slot (44): "One-way, like confession. I would not."

Clue anatomy — the act's mandatory trick, three independent
forward-solvable clues: (1) cross-room arithmetic — the ledger
lists seventeen stacks, the wing shows sixteen (taught as the
catalogue doctrine since the entrance); (2) scene — rails run under
the end wall + the rails remark; (3) prose — the Sophist's "do the
arithmetic yourself" in the room itself. Redundant fourth: drawer
XVII in 39 ("catalogued... and not on the floor").

### ap2-5 — display 37 — The Map Room (side room)

Scene: chart tables, a globe worn bald at the equator by fingers, a
wall of maps of places with no coastlines that agree. One map is
framed in iron rather than wood.

Narration: "Cartography, honest and otherwise. Stack fourteen's
overflow. Maps are arguments drawn badly on purpose — every one of
them stands somewhere it cannot show."

POI remarks:
- Iron-framed map: "Shelf-mark IX.i. A map of the Aporia itself,
  drawn by someone who clearly never left this room. The word is
  carved into the frame." (Fragment ON, carved, shelf-mark IX.i —
  in the ledger: honest.)
- Bald globe: "Rubbed to the plaster by people checking whether the
  world was still there. Results inconclusive."

### ap2-6 — display 43 — The Restorer's Bench (behind the secret)

Scene: stack XVII's hidden bay, repurposed: a long bench of tools
for mending books — knives, paste, gold leaf, a press. On the
press, a repaired folio titled ATLASES OF NOWHERE, its shelf-mark
XVII.i stamped fresh. Beyond, an honest iron 45.

Narration: "The restorer worked where no one could ask him
questions. Sensible man. He mended what the Archive would not admit
was broken — every spine in this room was once a lie with a loose
cover."

POI remarks:
- Repaired folio: "Atlases of Nowhere, XVII.i. Under the title,
  carved into the press itself, the restorer left his opinion of
  what such an atlas depicts." (Fragment NOTHING, carved,
  shelf-mark XVII.i — in the ledger: honest.)
- Gold leaf: "Gilding is honest about being decoration. Rare
  virtue."

### ap2-7 — display 45 — The Gate of Assent (act gate)

Scene: a door of stacked slate, no handle. A lectern with FOUR
carved sockets. Above: "SAY THE GROUND."

Narration: "The house asks again. What does the true argument stand
on? You have been in its library; you have seen what it keeps and
what it will not shelve. Lay the words in walking order. Forgeries
will be checked against the catalogue. Everything is, eventually."

Gate logic: correct = IT RESTS ON NOTHING -> the slate door pivots;
edge 45->46 unblocks permanently. Fragments are proven, not
consumed. Incorrect: refusal lines ("The catalogue has no such
holding."; "Right words, wrong shelving.") — and the refused
submission goes into the Ledger of Assertions, armed at the finale
(DESIGN.md sections 2 and 6). Unlimited attempts, no immediate
penalty; the Sophist reminds returners: "Still keeping your
guesses. The pile grows characterful."

### ap2-8 — display 46 — The Index's Antechamber (quest override)

Scene: a copying room: one desk, one chair, one lamp, and ten
thousand slips of paper pinned to every surface, each bearing a
single crossed-out word. A ledger stand (the act quest board). The
far door (47) has no number at all — its iron was pried off.

Narration: "Beyond that door the Index is compiling. It has been
compiling since before I came, and it is nearly up to the letter A.
The house requires its paperwork first. It always does."

Override: `quest` — the Sophist's Second Ledger (act quest board,
boardId at implementation). Fires once, pre-boss (T's rule).

POI remarks:
- Crossed-out slips: "Entries the Index rejected. Note the
  quantity. It has standards, just not mercy."
- Pried-off number: "The Index filed the number under N. This is
  what thoroughness does to a building."

### ap2-9 — display 47 — The Spine (boss; then descent)

Scene: the Archive's structural core: a shaft of galleries around a
column of clasped ledgers rising out of sight. Coiled around the
column, reading, a golem of misfiled truths — the Index — card
drawers for ribs, a spine of actual spines.

Narration (pre-fight): "The Index. Every fact that was filed where
it did not belong, given legs and a grudge. It knows where
everything is, which is not the same as knowing anything. Do not
let it cite you."

Boss: **The Index** — encounter override, isBoss, level band at
implementation. Mercy fork per ADR-0007 (through the standard
Befriend heart-skill): spare -> the Index files ONE fragment of the
player's choosing as "verified" in Act III (a single free
authenticity check at the Foundation); exploit -> material reward,
and it is remembered — exploiting BOTH act bosses hardens the
finale's naming fork (DESIGN.md section 6). Design note for
specs/story.

Post-victory: a gallery floor unclasps — the one-way descent to
Act III. The Sophist: "Deeper, then. Past the shelving, under the
memory. The house keeps its foundations where it keeps its doubts."

### ap2-10 — display 34 — The Periodicals Rotunda (Loop)

Scene: a round reading room, racks of broadsheets on poles, all
dated the same day. A carved plinth by the window with a stone
sample bolted to it.

Narration: "The news, preserved at the moment it stopped being
true. The rotunda connects to everything, which is how it avoids
arriving anywhere. Readers loved it here. Note the tense."

POI remarks:
- Stone sample: "Carved, and carving STONE into stone shows a
  certain wit. Shelf-mark III.ix, it claims. Claims want checking."
  (Counterfeit STONE, carved, false mark III.ix — not in ledger.)
- Same-dated broadsheets: "Circulation. The word does all its own
  work here."

### ap2-11 — display 36 — The Scriptorium (Loop)

Scene: rows of copy desks, ink dried in the wells to little black
mirrors. One desk's writing slope is carved with a heavy word and a
neat mark; the copyists' stools all face it as if it were a pulpit.

Narration: "Where the Archive made its copies, and its copies made
mistakes, and the mistakes were archived. Genealogy in this house
is complicated. The desk they all face carved its opinion loudly.
Loud is not shelved."

POI remarks:
- Carved slope: "STANDS, mark V.v. A verb, pretending to be
  load-bearing. The catalogue has never heard of it." (Counterfeit
  STANDS, carved, false mark V.v.)
- Dried ink wells: "Every argument here ran dry mid-sentence.
  There is a lesson in that I decline to copy out."

### ap2-12 — display 40 — The Stair of Returns (Loop; forged number)

Scene: a switchback stair connecting rotunda level to the
Catalogue. Its iron 40 is bolted to the newel — but over the arch
somebody has HUNG a painted plaque reading 45, on new rope. On the
landing, a lectern carved with a word and a mark.

Narration: "The Stair of Returns, where everything comes back.
Someone has hung it a flattering new number. Iron was set by the
masons; rope arrives later, like opinions. Climb by the iron."

POI remarks:
- Hung plaque (false 45): "New rope, old trick. The gate is not a
  thing you stumble into on a stair."
- Carved lectern: "FAITH, mark XIII.iii. Movingly carved. The
  catalogue is unmoved." (Counterfeit FAITH, carved, false mark
  XIII.iii. If the Doorwarden was spared in Act I, he has been here
  first: the plaque is annotated in a jointed bronze hand —
  "FORGED. — D." — one free detection, honoring the mercy fork.)
- Iron 40: "Bolted before your grandmother argued her first point.
  Trust the bolted."

Clue anatomy: the forged-number lesson in its mildest form — the
plaque's promise (the gate!) is checkable against iron on sight,
and the Sophist states the doctrine in the same breath.

### ap2-13 — display 42 — The Bindery (Loop)

Scene: sewing frames, glue pots gone amber, a guillotine for
trimming text blocks. A gilded word shines on the spine of a
display binding, mark stamped beneath.

Narration: "Where loose pages were made to agree. The tools are
persuasive. The display copy is the forger's masterwork — gold on
the spine and nothing sewn behind it."

POI remarks:
- Display binding: "UPON, mark VIII.viii, tooled in gold deep
  enough to pass for carving. A preposition with delusions of
  grandeur. Open it. Blank. Bindings are promises; contents are
  arguments." (Counterfeit UPON, carved/gilt, false mark
  VIII.viii.)
- Guillotine: "For trimming overhang. The Archive dislikes margins
  wider than their meaning."

### ap2-14 — display 48 — The Unshelved Corridor (Loop; trap mouth)

Scene: a service corridor stacked with unprocessed crates. At the
end, a freight hatch (38) propped open by a crate corner — its
counterweight rope plainly cut. A crate lid leans against the wall,
a word chalked-then-chiseled into it.

Narration: "Backlog. The Archive's conscience, in crates. The hatch
at the end goes down to the weighing room and has not come back up
since the rope was cut. I mention the rope because no one looks
up. No one ever looks up."

POI remarks:
- Freight hatch (38): "Counterweightless. A one-way argument if I
  ever heard one."
- Chiseled crate lid: "PROOF, it says. No mark at all — the forger
  was rushed, or honest for once, which for him is the same
  feeling." (Counterfeit PROOF, carved, NO shelf-mark — detectable
  two ways: unmarked, and unlisted.)

Clue anatomy: the trap mouth telegraphed twice (cut rope prose +
counterweightless remark), per fairness rules.

### ap2-15 — display 38 — The Weight of Volumes (Trap)

Scene: the weighing room below: a floor-scale big enough for a
cart, heaped with water-swollen books being weighed against iron
ingots. The freight hatch is a smooth ceiling square, ropeless.

Narration: "They weighed the holdings here, when the Archive
briefly believed truth had mass. The finding was inconclusive and
the hatch rope was cut in the ensuing dispute. Scholarship. The
way out is the way returns go — through the slot, eventually."

POI remarks:
- Floor-scale: "Four hundredweight of certainty on the left, iron
  on the right. Iron is winning."
- Ceiling hatch: "File your objection with the crates."

### ap2-16 — display 44 — The Return Slot (Trap; the walk out)

Scene: the receiving room of the return chute from the Misfiled
Wing: a canvas-lined hopper, a sorting table, and a service stair
climbing long and dark toward the rotunda (34), its door hinged
outward only.

Narration: "Returns are received, inspected, and released with a
warning. The stair is long and minds its own business. Up you go —
the rotunda has missed you, the way round things miss everything."

POI remarks:
- Canvas hopper: "Everything the Wing rejected arrives here soft.
  Consider the courtesy."
- Sorting table: "Sorted: damaged, doubtful, dangerous. The third
  pile is the largest. It always is."
- Service stair (34): "Outward hinges. The Archive forgives, in
  one direction."

## Act II quest + boss summary (for implementation)

- Quest: the Sophist's Second Ledger — act quest board at ap2-8
  (display 46), fires once, pre-boss only.
- Boss: The Index at ap2-9 (display 47), isBoss; mercy fork per
  ADR-0007 (spare: one free authenticity check at the Foundation in
  Act III; exploit: material reward — finalize in specs/story).
- Descent: one-way to Act III entrance (`aporia-proof`).

## Authoring compliance checklist (DESIGN.md section 5)

- Mandatory trick (secret stack-bay 41->43): three independent
  forward-solvable clues (ledger-vs-floor arithmetic, rails under
  the wall, the Sophist's in-room count), plus a redundant fourth
  (empty drawer XVII). PASS.
- Negative-space device: the missing seventeenth stack IS the act's
  negative space; also the pried-off door number at 46. PASS.
- Red herrings: forged plaque 45 on the stair and five counterfeit
  fragments — none of them touch the mandatory trick. PASS.
- Counterfeit detector: taught at the entrance, usable at the
  ledger from the second room of the act; PROOF also self-detects
  (unmarked). Legacy carve/paint detector explicitly retired via
  the entrance line "my colleague the forger works these halls
  now. He carves nicely." PASS.
- Anti-lawnmower: counterfeits attack three different sockets
  (verb, preposition, ground), so the forgery pile does not reveal
  the answer frame; refused gate submissions feed the Ledger of
  Assertions. PASS.
- Trap: escapable by walking (44 -> 34 service stair); mouth
  telegraphed twice. PASS.
- Stuck player: hint tiers available everywhere. PASS.
