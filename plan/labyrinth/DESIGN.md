# The Aporia — labyrinth continent design

> Step 4 deliverable (see ROADMAP.md). Binding inputs: T's answers
> (ROADMAP "T's answers", 2026-07-07) and the seven transferable
> design rules in RESEARCH-maze-book.md. Room-level content lives in
> `acts/act1.md`, `acts/act2.md`, `acts/act3.md`; spoilers in the
> matching `*.solution.md` files.

## 1. Continent identity

- **Name (proposed): The Aporia.** Greek: "no passage" — the
  philosopher's word for an impasse reasoning cannot cross. Engine
  id `labyrinth-continent` (union member alongside
  `coastal-continent`, `northern-continent`); display name copy:
  **THE APORIA**.
- **What it is:** a building in the shape of a country. No sky
  that behaves, no weather that repeats, masonry that predates its
  own foundations. The book's conceit ("this is not really a book")
  becomes: *this is not really a place — it is an argument you
  walk.* Rooms are premises. Doors are inferences. The true path is
  the only valid proof. Wrong turns are fallacies: the Loop realms
  are circular reasoning, and the deep Trap is a paradox — a
  conclusion you can enter but never leave.
- **Why it is pivotal (T):** the Aporia is the ONLY passage to the
  last continent of the game. One-way descent; no return journey.
  Whoever holds the endgame continent did not build the maze to
  keep intruders out — that is the Guide's lie. The truth waits at
  the center (section 6).
- **Story placement:** not the next continent; late-game gateway.
  For now the continent has NO story wiring: it is reachable only
  via the dev menu (character tab) in the UI and via its own CLI
  subcommand. Story access is authored later, after the final
  continent exists.

## 2. The Guide — the Sophist

The book's Minotaur becomes **the Sophist** — Axiomancer's native
species of monster: an arguer with no axioms of his own.

- **Role:** diegetic narrator of every room. His prose is the
  accordion text: what you see, what he chooses to mention, what he
  conspicuously does not. He is the clue channel AND the noise. The
  Directions-page rule is stated in his voice at the entrance:
  *anything may be a clue; not every clue is honest; I am not
  either.*
- **Voice:** per bearings — terse, archaic-flavored, cold and old;
  no thee/thou/thy/ye. Aristocratic wound. Insinuating ellipses used
  sparingly. He needles the player's inattention ("You studied the
  frescoes. You missed the door."). He never appears in any scene.
- **Hint merchant:** three tiers, purchasable in any room via the
  accordion (engine-priced, design intent below):
  1. **A Nudge** — cheap. One true sentence about the current room,
     phrased unhelpfully.
  2. **A Reading** — dear. Decodes one clue in the current room
     (names the mechanism, not the door).
  3. **A Conclusion** — ruinous. Names the correct door outright;
     at a Gate of Assent or the center, one purchase names ONE
     correct word in its correct socket (so the ruinous tier stays
     meaningful where the obstacle is an ordering, not a door).
  Prices rise per act and per tier reuse. Every purchase shifts
  alignment (an Epistemology-axis delta via the existing
  `alignmentDelta` authoring surface; exact magnitude decided at
  implementation) and the Sophist remembers the total; the finale
  reads it (section 6). Buying conclusions without proofs is the
  game's thesis inverted — legal, tempting, and philosophically
  costly.
- **The Ledger of Assertions (anti-lawnmower rule):** gate and
  center attempts are unlimited and free of immediate penalty —
  but every REFUSED submission is entered in the Sophist's ledger
  and feeds the finale exactly like hint debt ("You asserted this
  for me"). Guessing is always allowed; unfounded assertion is
  never free. This keeps the detectors (paint, shelf-marks,
  bears-weight) the cheap path and shuffle-till-green the expensive
  one, without ever locking a stuck player out.
- **Secret (for specs/characters/ spec):** the Sophist entered the
  Aporia as its first challenger. He could not bear to revise a
  single axiom, so the maze digested him into its narrator. He is
  not guarding the center; he is hiding from it. His finale behavior
  forks on the player's hint debt and mercy stance (ADR-0007
  befriend rules apply).

## 3. Structure — three acts, one descent

Three separate `MapDefinition`s on one continent, boss-gated, ~47
rooms total (the book's 45 plus two seam rooms). No return journey;
each act ends DOWNWARD.

| Act | Working name | Rooms | Realm split (Path/Loop/Trap) | Navigation gimmick taught |
|---|---|---|---|---|
| I | The Colonnade | 15 | 9 / 4 / 2 | Doors lie; prose hints; the absent thing is the answer (negative space); numbers matter |
| II | The Archive | 16 | 9 / 5 / 2 | One-way doors dominate; clues chain ACROSS rooms; signage can be forged |
| III | The Proof | 16 | 9 / 4 / 3 | Everything at once, plus checkpoints, the ejection trap, and the center riddle |

(Realm splits are the as-authored numbers from `acts/act*.md`,
enforced by `tools/validate-maze.mjs`.)

- **Act seams:** each act's final chamber contains, in order: the
  act's **quest event** (T's rule: the only place `quest` fires,
  immediately before the boss), then the **act boss**, then a
  one-way descent to the next act. Bosses are new enemies with
  mercy forks per ADR-0007.
- **Realm doctrine (from the book, softened per T):**
  - *Path*: the true-path rooms plus side rooms holding fragments.
  - *Loop*: recirculating wrong rooms. Cost of entering: each NEW
    room fires its one first-arrival encounter. Escape is always
    walkable — cleared rooms are free to re-cross ("a solved space
    is just solved").
  - *Trap*: Acts I-II traps are short cul-de-sac loops (walk back
    out, poorer and wiser). Act III's signature trap is the
    **Oubliette of the Settled Mind**: a one-way chute that ejects
    the player to the last activated **checkpoint** (never a full
    reset). Redundantly telegraphed, per the book's own practice on
    its one mandatory trick.
- **Checkpoints (Act III only, per T):** three waystone rooms; the
  first is the act entrance. Activating one is free and automatic on
  arrival.
- **Every act has one secret-edge spine** (the Room-29 lesson): a
  door that is not on the room's obvious door list, redundantly
  clued at least three independent ways, at least one of them
  forward-solvable on first visit (the book's fairness failure is
  the thing we refuse to copy).

## 4. The click loop and encounter economy

The loop stays T's loop: **click -> encounter -> traverse ->
repeat**, on a directed graph with free backtracking through
cleared rooms.

- **First arrival in a room** rolls ONE random event from the act's
  weighted pool (seeded RNG, existing `rollPool` machinery). The
  room is then **solved**: re-entry and re-crossing are free forever
  (existing `consumedNodes` semantics — T's "a solved space is just
  solved").
- **Authored overrides** (existing `setNodeEventPoolOverride`):
  entrances (narration), waystones (rest), pre-boss chambers
  (quest), boss rooms (encounter, `isBoss: true`), the center.
- **Random pool per act** (design intent; exact weights tuned at
  implementation with the world-tuning loop):

| Kind | Act I | Act II | Act III | Notes |
|---|---|---|---|---|
| encounter (combat) | 30 | 34 | 40 | difficulty bands rise per act |
| hazard | 18 | 24 | 28 | the building fighting you |
| loot-cache | 14 | 12 | 10 | the Reliquary, maze-flavored |
| gathering | 12 | 10 | 6 | scarce; the maze grows little |
| rest | 14 | 10 | 8 | rarer as you descend |
| narration | 12 | 10 | 8 | Sophist vignettes, worldbuilding |
| village / cutscene / quest | 0 | 0 | 0 | authored-only; quest fires solely at pre-boss chambers |

- **Time budget (~6h target, validated at step 8):** ~47 rooms;
  assume a decent player first-visits ~40 of them (wrong turns
  included). ~40 first-arrival EVENTS (only ~30-40% of them combat,
  per the pool tables; narration/rest run shorter, act III combat
  longer) x ~4 min average = ~160 min. 3 quest events x ~10 min +
  3 bosses x ~12 min = ~66 min. Inspection, riddle thinking,
  backtracking, hint dialogues = ~90-130 min. Total ~5.0-6.4h,
  roughly a third of a ~18h game. Levers if validation disagrees:
  room count per act, pool weights, encounter length bands.
- **Waystone rest is one-shot** (Act III checkpoints): the rest
  override fires on first arrival only, per standard
  `consumedNodes` semantics — ejection from the Oubliette does NOT
  re-arm it. No repeatable-heal loop exists; the
  meagre-but-never-lethal rest doctrine holds.
- **Defeat** in any labyrinth encounter uses the normal game-over
  flow (no maze-special rule).

## 5. The puzzle grammar (how riddles work)

Five clue channels, all delivered through the room scene + the
accordion:

1. **Prose clues** — the Sophist's narration: mentions, omissions,
   anagrams, spoken-letter tricks (Y-O-U-R), countable nouns.
2. **Scene clues** — POIs in the room illustration: props, signage
   (sometimes mirrored or forged), reliefs, the doors themselves.
   Clicking a POI gives the Sophist's one-line remark on it (also
   clue-bearing; also sometimes a lie).
3. **Negative space** — the book's house style: the label that does
   NOT appear in the prose, the door without a lamp, the missing
   fourth statue. Taught explicitly in Act I room 1 as the tutorial
   clue.
4. **Numbers** — every room displays a number (display number is
   clue material and does NOT equal the engine node id; numbers may
   be spelled out, mirrored, or summed by other clues). Numbers are
   honest in Act I, forgeable in Acts II-III (forgeries are always
   detectable from an honest channel).
5. **Fragments** (the "exact right order" enforcer) — see below.

**Fragments and the Passphrase.** Each true-path room hides exactly
one **Fragment** — a word carved, whispered, or embossed on a POI
(the book hid "Like Atlas you bear it upon your shoulders" along the
16-step path; ours is distributed across all three acts' true paths,
since there is no return journey). Wrong rooms — Loop and Trap —
contain **counterfeit fragments**: plausible words the Sophist
forged. At the center (section 6) the player must assemble the
Passphrase from collected fragments. Only a player who walked the
true path holds the honest set; a wanderer holds a polluted pocket
and must reason about which words are forged (forgeries are
detectable: they contradict the acts' riddle answers). This is how
"solve it in the exact right order" is enforced MAZE-faithfully —
without invisible fail states, and without punishing exploration
beyond its encounter cost.

**Act gates.** Acts I and II each end in a **Gate of Assent** before
the pre-boss chamber: a door that opens only when the player answers
that act's riddle (choice among assembled candidates — the honest
fragments spell the answer; counterfeits spell traps). Wrong answers
are allowed and unlimited: the gate stays shut, the Sophist mocks —
and the refused submission is entered in the Ledger of Assertions
(section 2), armed against the player at the finale. No pixel-hunt
lockouts; no free lawnmowering either.

**Fragments are never consumed.** Laying words at a gate proves
them; the pocket keeps them. At the center, the house
"remembers your assents": the eight words already proven at the two
act gates arrive pre-confirmed in their sockets, leaving Act III's
five words (and the counterfeit filtering) as the live puzzle — the
climax is judgment, not re-assembly tedium. The Pocket records each
fragment's provenance (where found, what mark or make it carries)
and, once the Catalogue ledger has been read, its verdict — the
note-taking is the game's job, not homework.

**Fairness rules (binding on acts authoring, from the research):**
- Every mandatory deduction has at least one forward-solvable
  foothold on first visit.
- Every secret edge is clued at least three independent ways.
- Red herrings are permitted everywhere EXCEPT on the three
  mandatory tricks.
- The odd-one-out / negative-space device appears at least once per
  act, and Act I's opening room teaches it in its simplest form.
- A stuck player can always buy their way forward (three hint
  tiers), at philosophical cost.

## 6. The center — the Unfounded Door

The final true-path room of Act III is **the Foundation** (the
book's room 45 analog): the oldest room, deep underground stones
carved before the maze had a shape (mirroring T's screenshot of the
book's "foundation" room). It holds:

1. **The Riddle of the Aporia**, posed as scene rebuses + prose
   (book-style). Proposed riddle (T to approve at act-3 authoring):
   **"What argument has no first premise?"**
2. **The Passphrase assembly** — the answer is spoken by laying the
   collected fragments in order. Proposed answer (hidden across the
   three acts' true paths, one word per Path room):
   **"The one you walk. It rests on nothing. It is walked, not
   won."** — the maze itself: an argument with no axioms, crossed
   only by moving. (Exact phrase finalized during act authoring so
   word-count = true-path room-count.)
3. **The revelation:** the Aporia was not built to keep anyone OUT
   of the last continent. It was grown to make travelers ABLE to
   arrive: only a mind that has backtracked — revised, renounced,
   walked back on itself — survives what lives there. Backtracking,
   the game's mechanic, is the maze's whole lesson. The Sophist is
   the counterexample: he would not revise, so he never left.
4. **The Unfounded Door** — the exit to the last continent. It has
   no number. It appears on no map. It was never locked.

Sequence at the center: Passphrase -> revelation -> Act III quest
event -> finale with the Sophist -> the Unfounded Door.

**Finale doctrine (softlock-proofed):**
- The Sophist's debt scaling is authored as **Borrowed Premise**
  status stacks — capped at THREE, visible pre-fight, built from
  hint debt + the Ledger of Assertions. Status-effect content, per
  combat doctrine; never an unbounded stat wall.
- Debt is **settleable** at the Sophist's Study: the blank Fourth
  Ledger is the repayment instrument — the Act III quest offers the
  option to settle some or all debt at a real price (resources +
  an Epistemology alignment concession), reducing Borrowed Premise
  stacks before the fight.
- The Third Waystone guarantees a **resource floor** (its one-shot
  rest is authored generously within the meagre band) so a
  hint-heavy, guess-heavy player still arrives fightable — the
  descent is one-way and grindless, so the wall must be climbable
  by everyone who reaches it.
- The mercy fork routes **through the standard Befriend
  heart-skill** (heart tokens + HP gate + mercy-choice state, per
  ADR-0007) — knowing the name PROTAS unlocks the naming option
  INSIDE the mercy choice; it is never a parallel bypass.
- **Exploit consequence** (ADR-0007's anti-exploit pattern): a
  player who exploited BOTH the Doorwarden and the Index finds the
  naming fork hardened — the Sophist will not take his name from
  that mouth (fork closed; standard spare remains available at the
  normal gate).

## 7. UI design (spec for claude-design; implemented later)

Primary view: **the Room Scene** — book-style illustration, nothing
inherently linear ("here's some POIs, click one" — T).

- **Scene canvas:** one authored scene per room (SVG placeholder art
  per existing system until claude-design's pass). Contains 2-5
  **door POIs** (numbered plaques where honest) and 2-6 **object
  POIs**. Doors confirm-then-travel; objects emit the Sophist's
  remark line and any fragment. One-way doors simply do not exist as
  POIs on the far side (spatially consistent, like the book's
  unnumbered doors).
- **The Accordion** (T's core UI idea): collapsible panel at the
  bottom of the scene. Collapsed: room display-number + name strip.
  Expanded (drag or tap): the Sophist's full narration ("what you
  see"), the act riddle status, the **Pocket** (collected
  fragments, reorderable at gates/center), and the **Ask the
  Sophist** hint menu (three tiers, prices shown in real units).
- **Travel flow:** tap door POI -> confirm strip on the accordion
  (door number + the Sophist's one-liner) -> traverse -> arrival
  fires the room's first-visit event via the existing full-screen
  encounter overlays -> scene renders.
- **Map (secondary view):** stingy fog-of-war per T — visited rooms
  only; an edge renders only in the direction actually walked; no
  room numbers on the map (numbers live in scenes); the earnable
  **Cartographer's Eye** item adds unwalked-but-seen doors as stubs.
- **Entry point (for now):** dev menu in the character tab ->
  "THE APORIA" -> Act select (dev builds list all three; production
  wiring deferred). No exploration-tab presence yet.
- Copy canon: VITAE / STANCE preserved inside encounters; accordion
  copy follows the cold-old voice rules; no emojis; AXM tokens only.

## 8. Engine + CLI design (implemented at step 10)

Engine (axiomancer-mechanics), minimal-delta doctrine:

- `MapDefinition.traversal?: 'gauntlet' | 'labyrinth'` (default
  `'gauntlet'` = today's behavior, untouched).
- Labyrinth mode rules: `moveToNode` permits travel into
  `completedNodes`/consumed rooms (free re-cross); a room's doors
  are its `connectedNodes` verbatim (no spreading unlock frontier);
  first-arrival events keep existing `consumedNodes` one-shot
  semantics (this IS "solved space is solved"); one-way doors =
  asymmetric adjacency (already supported); Gates of Assent =
  `blockedRoutes` entries cleared by riddle-answer actions;
  checkpoints + pocket (fragments) + hint-debt live on `MapState`
  extensions versioned through `GAME_STATE_VERSION`/`migrate`.
- Content: three maps under
  `src/World/Continents/Aporia/maps.ts` (+ event pools, node
  overrides), node prefixes `ap1-`/`ap2-`/`ap3-` wired into
  `encounter.ts` map resolution, `EnemiesByMap` entries incl. three
  bosses + finale, three quest boards (the Sophist's ledgers),
  fragments as flag-backed items, display-number table per room.
- All randomness through injected RNG helpers. Hermetic e2e at the
  public entry point: scripted true-path runs per act, trap
  ejection to checkpoint, gate refusal on wrong answers, counterfeit
  pollution behavior, solved-space invariant.

CLI: `npm run game -- labyrinth` (+ named shortcut
`npm run labyrinth`), honoring the standard agent flags
(`--script`, `--stdin`, `--json-events`, `--state-log`). Headless
loop per room: print display number, Sophist prose, door list, POI
list; commands `go <door>`, `look <poi>`, `pocket`, `answer <...>`
(at gates/center), `hint <tier>`, `map`. Encounters resolve through
the existing minigame engines (auto-policy resolution for
non-combat, scripted combat) so a full 3-act playthrough is
testable without the UI — that is the acceptance test for step 10.

## 9. Naming ledger (engine ids, subject to T veto)

- Continent: `labyrinth-continent`, display THE APORIA.
- Maps: `aporia-colonnade` (Act I), `aporia-archive` (Act II),
  `aporia-proof` (Act III).
- Node prefixes: `ap1-`, `ap2-`, `ap3-`.
- Bosses (working names): Act I **The Doorwarden** (a hinge-priest
  who worships thresholds), Act II **The Index** (the archive's
  librarian-golem, made of misfiled truths), Act III finale **the
  Sophist**.
- Items: **Cartographer's Eye** (map upgrade), **Fragments**
  (passphrase words), **Waystones** (checkpoints).

## 10. Open items carried into act authoring

- Final passphrase wording sized to true-path room count (step 7).
- Alignment magnitude for hint purchases (axis settled:
  Epistemology, via `alignmentDelta`; magnitude needs the live
  model at implementation).
- Room display-number scheme per act (honest in I; forgery pairs in
  II-III must each have an honest detector).
- Exact pool weights (tuned at implementation via world-tuning).
