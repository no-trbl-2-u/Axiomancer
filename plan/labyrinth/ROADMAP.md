# The Labyrinth Continent — full project roadmap

> Durable spec of every step for the MAZE-style labyrinth continent,
> written up front so any future session can resume from here.
> Branch: `claude/game-continent-maze-design-b3iks1`.
> Requested by T on 2026-07-07. Status tracker at the bottom —
> update it in the same commit as any step you complete.

## The ask (T, verbatim intent)

- A **new continent**, not the "next" one in the story but **pivotal
  to the story**.
- Same core loop as existing maps ("click -> encounter -> traverse ->
  repeat") but **not linear**: modeled on *MAZE: Solve the World's
  Most Challenging Puzzle* (Christopher Manson, 1985).
- Proposed UI: a **collapsible accordion at the bottom** of the map
  screen. Open it to read the room description ("what you see") and a
  **riddle** that helps you decide which node (door) to click next.
- The player must **backtrack and solve the labyrinth in the exact
  right order** to get through the whole thing.
- The labyrinth is **3 acts**; the whole thing should be about **1/3
  of the whole game, ~6 hours of play total**.
- **Every traversal click rolls a random encounter**, excluding
  `quest` — `quest` fires only at the **end of each act, right before
  that act's final boss**.
- First research the book, then design **3 puzzles** in its spirit
  (one per act).
- T asked to be asked **many clarifying questions** before the design
  is committed.

## Standing-decision note (ADR-0005)

`spec.md` and `ADR-0005` defer new-continent work until the first
continent is clean. Per the source-of-truth hierarchy (bearings.md:
"T's latest explicit decision > ADRs"), this request is treated as
the explicit T decision that reopens continent work **for design
authoring on this branch**. Whether implementation phases get queued
behind first-continent cleanup is clarifying question Q19. Record the
final call in the PR and, if implementation is greenlit, amend
ADR-0005 in the same change.

## Research findings so far

### Codebase (explorer report, 2026-07-07 — COMPLETE)

Key facts a resuming session needs (full detail in the PR thread /
report below):

- Maps are **already directed graphs**: `MapNode.connectedNodes` is a
  per-node adjacency list (`axiomancer-mechanics/src/World/types.ts`).
  Loops exist today (`fv-17 <-> fv-19`). One-way doors = asymmetric
  adjacency, already expressible.
- `MapState` already persists `currentNode`, `completedNodes`,
  `availableNodes`, `lockedNodes`, `discoveredNodes`, `consumedNodes`,
  `blockedRoutes`, `hazardOutcomes` — exactly the maze state needed.
  Save layer: zustand store + `GAME_STATE_VERSION`/`migrate`;
  AsyncStorage on mobile. No server.
- **MapEvent system** (`src/World/MapEvents/`): kinds `encounter |
  interaction | gathering | rest | village | cutscene | hazard |
  loot-cache | quest | narration`, weighted per-node pools
  (`registerMapEventPool`, `setNodeEventPoolOverride`,
  `setDefaultMapEventPool`), resolved by `resolveMapEvent` with
  seeded RNG. Pools are single-entry today but weighted-random rolls
  are already supported — per-click random encounters are nearly free.
- Bosses are `encounter` events with `isBoss: true` (+ pinned
  `level`); `quest` events carry a `boardId` into the QuestBoard
  minigame.
- **Three engine assumptions must be relaxed for a maze** (all in
  `src/World/world.reducer.ts` + `MapEvents/resolve-map-event.ts`):
  1. Back-travel is forbidden (`moveToNode` rejects nodes in
     `completedNodes` — "back-travel is not permitted").
  2. Nodes are one-shot (`consumedNodes` makes re-entry a no-op) —
     conflicts with "encounter on every click".
  3. Progression is a spreading unlock frontier from the start node,
     not free graph walking.
  Plan: a per-map `traversal: 'gauntlet' | 'labyrinth'` doctrine flag
  on `MapDefinition` so existing maps keep current behavior.
- Smaller wiring: `MapName`/`ContinentName` string unions +
  `MAP_REGISTRY` need new members; `encounter.ts` has a hardcoded
  node-prefix -> map table (`fv-`, `nf-`) — new prefix needed;
  `EnemiesByMap` must be populated for the new maps;
  `createStartingWorld()` seeds `world: []` so `changeContinent` is
  currently a no-op and cross-continent travel needs real wiring.
- **Mobile UI**: no accordion/bottom-sheet exists yet. The natural
  seam is `components/exploration/NodeConfirmPanel.tsx` (bottom panel
  on node-select) + `state/presenters/exploration.engine.ts`
  (`selectExplorationViewModel`); edges render from the engine graph
  via `buildEdges`; per-map pixel layout lives in mobile
  `state/exploration-maps/<map>.layout.ts`. Full-screen overlays for
  encounters/dialogue already exist; `narration` events render any
  `DialogueTree` with zero new UI.

### MAZE book (scout report — COMPLETE)

Full condensed report: `plan/labyrinth/RESEARCH-maze-book.md`.
Headlines: official 16-step solution (1-26-30-42-4-29-17-45 in,
45-23-8-12-39-4-15-37-20-1 out); doors are a directed graph with
one-way (unnumbered) edges; the only entrance to the center is a
secret door reachable via a redundantly-clued perspective trick;
realm topology Path (19) / Loop (19, churn, one safe exit) / Trap
(7, terminal room 24 with no exits); riddle "What house will all
live in?" answered "Like Atlas, you bear it upon your shoulders",
hidden word-by-word inbound and letter-by-letter outbound along the
true path only; the Guide is the Minotaur, unreliable-narrator voice
as the clue channel; nobody solved the riddle layers in the original
contest. Seven transferable design rules extracted (see research
file, "Transferable design rules") — most important: every mandatory
trick must be forward-solvable and redundantly clued (the book's
documented fairness failure is hindsight-only clues), and since an
app auto-maps, difficulty must live in puzzle content + the
encounter-cost economy of wandering, not mapping labor.

## Clarifying questions for T (with recommended defaults)

Answers gate step 4 (design doc). Any question T does not answer
falls back to the recommended default marked (D).

**Story and placement**

- Q1. How does the player reach the labyrinth, and when? (D: mid-game,
  reachable by sea from the coastal continent; entering is a
  deliberate story choice; the player CAN leave and return — leaving
  preserves maze state.)
- Q2. What pivotal thing sits at the center (the room-45 analog)?
  A story revelation, an artifact, a person? This anchors Act III.
  (D: a story revelation tied to the game's philosophy thesis — the
  center holds the truth the Guide has been lying about; specifics
  proposed in DESIGN.md for T's approval.)
- Q3. The Guide: MAZE's soul is its unreliable narrator. Do we adopt
  an in-fiction Guide who narrates every room in the accordion, hints
  and misleads, and is implicated in the final boss fight? (D: yes —
  new named character spec in specs/characters/, voice per bearings:
  terse, cold and old, no thee/thou.)
- Q4. Does the labyrinth interact with the 3-axis alignment /
  faction system (e.g. Guide reacts to alignment, mercy routes on
  bosses)? (D: light touch — alignment flavors Guide lines and one
  Act III gate; no new systems.)

**Structure and difficulty**

- Q5. "Exact right order": strict-sequence (wrong door instantly
  punishes) or MAZE-faithful (free wandering, but the graph is full
  of one-way doors and trap loops, so only the true path gets you
  through efficiently)? (D: MAZE-faithful — the graph itself is the
  puzzle; "exact right order" emerges because acts gate on carrying
  proof-tokens found only on the true path.)
- Q6. Trap semantics: MAZE has an inescapable trap section (restart
  the book). In a 6h video game that is brutal. Options: (a)
  book-accurate inescapable, must reset act; (b) trap loops that
  always allow walking back out at encounter cost; (c) traps eject
  you to the act entrance with a penalty. (D: (b) for Acts I-II, one
  authored (c)-style trap in Act III as the signature danger; never
  full-run resets.)
- Q7. Act shape: one 45-room continent partitioned into 3 acts of
  ~15 rooms with boss-gated seams, or 3 separate maps? (D: 3 separate
  `MapDefinition`s (~15-16 rooms each) on one continent — cleaner
  engine fit, per-act layouts, and each act can have its own
  navigation gimmick; total ~45-48 rooms honoring the book's 45.)
- Q8. Return journey: MAZE requires reaching the center AND walking
  back out. Adopt? (D: yes, but only within Act III — after the
  center revelation the true path inverts for the escape + final
  boss; Acts I-II are one-way descents.)
- Q9. Riddle difficulty and hints: MAZE was effectively unsolvable
  (nobody fully solved it during the contest). Target: hard-but-fair
  solo, no community required. Hint system? (D: three-tier hints
  sold by the Guide for a meaningful currency/alignment price:
  nudge -> clue decode -> door reveal; buying hints is mechanically
  tempting but philosophically costly, on-thesis.)
- Q10. Time budget: 6h via what mix? (D: ~55-70 total traversal
  clicks across 3 acts at ~3-4 min average encounter, ~1.5-2h of
  encounters per act + puzzle thinking time; validated in step 8
  against encounter-length telemetry from tuning reports.)
- Q11. Failure in encounters (combat defeat) inside the labyrinth:
  normal game-over flow or maze-specific (wake at act entrance)?
  (D: normal flow, no special rule.)

**Encounter economy**

- Q12. Random-per-click pool: which kinds and weights? (D: maze pool
  = encounter/hazard/loot-cache/gathering/rest/narration with authored
  weights per act; `village` and `cutscene` excluded; `quest`
  reserved for the pre-boss trigger per T's instruction; weights
  shift darker each act — less rest, more hazard.)
- Q13. Re-traversal: does an edge you have walked 5 times still roll
  full encounters (wandering stays expensive — the clock IS the
  difficulty), or decay? (D: full rolls, no decay — backtracking cost
  is the fairness pressure that rewards solving instead of
  brute-forcing; rest-kind odds tick up slightly on repeat edges so
  attrition is survivable.)
- Q14. Act bosses: three new bosses + finale? Reuse difficulty bands?
  (D: three new authored bosses with befriend/mercy forks per
  ADR-0007; finale involves the Guide.)
- Q15. Quest-before-boss: existing QuestBoard minigame with new
  per-act boards, or story-quest? (D: new per-act QuestBoard boards
  themed as the Guide's ledgers; boardId per act.)

**UI**

- Q16. Room presentation: keep the map-canvas node view with the
  accordion carrying prose clues only, or give each room an authored
  "scene" (SVG placeholder-art) where visual clues live like the
  book's illustrations, with numbered doors as the clickable
  elements? This is the biggest scope fork. (D: hybrid — map canvas
  stays (fog-of-war graph), accordion carries prose + a compact
  authored "scene strip" of SVG clue objects per room, doors labeled
  with numbers; full illustrated scenes deferred to an art phase.)
- Q17. Is the auto-map visible at all? The book forces you to map by
  hand. (D: visible but stingy — fog-of-war shows only visited rooms
  and doors you have personally used; one-way doors render only in
  the direction walked; an earnable "Cartographer's Eye" item
  upgrades it.)
- Q18. Room numbers: book-style visible numbers on rooms/doors so
  numbers can carry clue content? (D: yes — numbers are clue
  material, as in the book.)

**Scope**

- Q19. Deliverable of THIS effort: design-only (specs + solutions +
  validation, implementation phases queued for later) or design +
  engine + UI implementation? (D: design-only on this branch, with a
  written implementation phase list; engine/UI work then lands via
  the normal phase loop respecting ADR-0005 sequencing.)
- Q20. Continent name/theme preference, and is the existing
  `northern-continent` union member related or is this a third
  continent? (D: third continent, new name proposed in DESIGN.md;
  `northern-continent` stub untouched.)
- Q21. Spoiler hygiene: solutions in-repo are readable by anyone.
  OK, or keep solution appendices in a separate clearly-marked file?
  (D: separate `SOLUTIONS.md` per act, clearly marked, same branch.)

## T's answers (recorded 2026-07-07) — BINDING

T answered the question list (chat, 2026-07-07). These override the
defaults wherever they differ. Unanswered questions fall back to
their recorded defaults, per the agreed protocol.

- **Access (new requirement):** the labyrinth is reachable in the UI
  ONLY via the dev menu in the character tab for now (no story
  wiring yet), and the labyrinth gets its OWN CLI subcommand
  (`npm run game -- labyrinth` + named shortcut) so the whole
  puzzle/playthrough is testable headlessly without the UI.
- **Q5 (order strictness):** T deferred ("idk") -> default stands:
  MAZE-faithful free wandering; the directed graph + act gates
  enforce the true order.
- **Q6 (traps):** default accepted, PLUS Act III gets checkpoints so
  its signature ejection-trap is not so unforgiving (eject to last
  checkpoint, not act entrance).
- **Q7 (act shape):** default accepted — 3 separate maps on one
  continent, ~15-16 rooms each, ~45-48 total.
- **Q8 (return journey):** REJECTED — no return journey. The
  labyrinth is a one-way descent; its center/exit leads onward to
  the LAST continent of the game. (Story fact: the labyrinth is the
  gateway to the endgame continent — this is what makes it pivotal.)
  Consequence: the MAZE-style "answer hidden along the path" payload
  is redistributed across the three acts' true paths instead of an
  inbound/outbound split.
- **Q9 (hints):** approved — the Guide sells three hint tiers
  (nudge -> clue decode -> door reveal) at mechanically tempting,
  philosophically costly prices.
- **Q13 (re-traversal):** REVERSED from default — "a solved space is
  just solved." A room fires its random encounter on FIRST arrival
  only; re-entering or backtracking through cleared rooms is free.
  Wandering cost = every NEW wrong room costs one encounter. (This
  conveniently matches the existing `consumedNodes` one-shot engine
  semantics — smaller engine delta than feared.)
- **Q16 (presentation):** book-style — each room is presented like
  the book's illustrations: a scene with points of interest, nothing
  inherently linear. "Here's some POIs, click one, trigger an
  encounter, brings you to the next place, repeat." The collapsible
  accordion at the bottom carries the Guide's description + riddle.
  (Final art direction goes to claude-design via handoff prompt —
  see scope.)
- **Q17 (auto-map):** default accepted — stingy fog-of-war map as a
  secondary view: visited rooms only, one-way doors drawn only in
  the walked direction, an earnable item upgrades it.
- **Q2/Q3 (center + Guide):** approved — the Guide is a new named
  character (unreliable narrator, implicated in the finale); the
  center holds the passage to the last continent + the revelation.
  Specifics proposed in DESIGN.md.
- **Q1 (trap semantics Act III):** see Q6 — checkpoints adopted.
- **Q19 (scope):** design first; once design lands, implement the
  MECHANICS + CLI on this effort and merge that. THEN write a
  handoff prompt T can give to claude-design for the UI (accordion,
  room scenes, dev-menu entry). Mobile UI implementation is out of
  scope here beyond the dev-menu hook spec.
- **Screenshots:** uploaded to `plan/labyrinth/reference/maze-book/`
  (compressed, descriptively named, with README index) so other
  agents can see the source material.
- All other questions (Q4 alignment, Q10 time budget, Q11 defeat,
  Q12 pool weights, Q14 bosses, Q15 quest boards, Q18 room numbers,
  Q20 naming, Q21 spoiler files): defaults stand.

## Steps (the full plan)

Numbered to match the session task list. Each step names its
deliverable and completion gate.

1. **Research** — scout (MAZE book) + explorer (codebase). Explorer
   DONE; scout in flight. Gate: scout report folded into this dir.
2. **This roadmap** — commit + push + open PR. Gate: PR exists.
3. **Clarifying questions** — present Q1-Q21 to T; record answers in
   this file (edit the Q list in place with `A:` lines). Gate: T
   replied, or T explicitly defers to defaults.
4. **Design doc** — `plan/labyrinth/DESIGN.md`: continent identity
   (name, theme, story hook, how it is pivotal), the Guide character
   brief, UI spec (accordion anatomy, map behavior, scene-strip clue
   system, one-way-door rendering), traversal doctrine
   (`labyrinth` mode rules), encounter economy tables per act, trap
   semantics, hint economy, time-budget math, and the MAZE design
   rules extracted from the scout report (clue density per room,
   red-herring ratio, trap topology lessons). Gate: T thumbs-up or
   defaults invoked.
5. **Act I puzzle** — `plan/labyrinth/acts/act1.md` (+
   `act1.solution.md` per Q21): complete directed room graph (room
   table: id, number, prose, doors with destinations + one-way
   flags), per-room clue manifest (textual riddle in accordion,
   scene-strip visual clues, cross-room chains, red herrings),
   intended true path, trap loops, act-end quest trigger + boss room.
   Difficulty: tutorializing — teaches "doors lie, prose hints,
   numbers matter". Gate: validation script passes (step 8 tool run
   early).
6. **Act II puzzle** — same shape, harder: more one-way doors,
   cross-act clue callbacks, first meta-layer (clues that only make
   sense assembled across rooms). Gate: same.
7. **Act III puzzle** — hardest: the center room (45-analog), the
   hidden riddle whose answer was scattered across all three acts'
   true paths, the signature ejection-trap, CHECKPOINTS (per T),
   finale boss (the Guide) + pre-boss quest, and the exit passage to
   the last continent. No return journey (per T). Gate: same.
8. **Validation** — `plan/labyrinth/tools/validate-maze.mjs`
   (plain node, no deps): parses the act room tables, verifies
   intended shortest path is actually shortest and unique-enough,
   traps behave per chosen semantics (escapable per Q6), no
   unintended shortcuts skip act gates, expected traversal count *
   encounter time is within the 6h +/- 25% budget. Then spawn
   `mechanics-expert` for a fairness/difficulty review and fix
   findings. Gate: script green + expert findings addressed.
9. **Finalize design** — promote durable specs into
   `axiomancer-mechanics/specs/world/` (one continent spec + three
   act specs) and `specs/characters/` (the Guide) using the repo
   templates; update this status tracker; push; PR ready for review.
   Gate: PR ready-for-review with all design files.
10. **Mechanics + CLI implementation** (per T's Q19 answer; after
    design lands/merges): in `axiomancer-mechanics` — labyrinth
    traversal doctrine (per-map `labyrinth` mode: back-travel
    allowed through cleared rooms, first-arrival-only encounter
    rolls reusing `consumedNodes`, act gates/proof-tokens,
    checkpoints), the three `MapDefinition`s + event pools + node
    prefix wiring, enemies (`EnemiesByMap`), per-act quest boards,
    hint economy engine, and a `labyrinth` CLI subcommand
    (`npm run game -- labyrinth` + named shortcut) that plays the
    whole labyrinth headlessly: prints the Guide prose + riddle +
    door list per room, accepts door choices, rolls encounters
    (auto-resolve or sub-minigame stubs per existing CLI patterns),
    enforces gates/traps/checkpoints. Hermetic e2e tests (seeded
    RNG): true path completes each act, traps behave, gates hold,
    solved-space-solved invariant. Verify gates per bearings; merge.
11. **claude-design handoff prompt** — write a complete prompt T can
    hand to claude-design for the mobile UI: book-style room scenes
    with clickable POIs/doors, the collapsible bottom accordion
    (description + riddle), stingy fog-of-war map view, dev-menu
    entry point in the character tab, engine surface it consumes
    (exports added in step 10), copy canon + AXM token rules.
    Deliverable: `plan/labyrinth/CLAUDE-DESIGN-PROMPT.md`.

UI implementation itself stays out of scope (goes to claude-design
via step 11's prompt); the only UI wiring specced here is the
dev-menu entry.

## Resume protocol (if a session dies)

1. Read this file top to bottom, then `plan/labyrinth/DESIGN.md` and
   `plan/labyrinth/acts/*` if they exist.
2. Check the status tracker below; pick the first unchecked step.
3. If step 3 is unchecked and T has not answered, proceed with the
   recorded defaults (T approved default-fallback by accepting this
   roadmap) but flag loudly in the PR.
4. Branch/PR: work stays on
   `claude/game-continent-maze-design-b3iks1`; push after each
   completed step so nothing is stranded in a container.

## Status tracker

- [x] 1. Research: explorer (codebase) — DONE 2026-07-07
- [x] 1b. Research: scout (MAZE book) — DONE 2026-07-07, see RESEARCH-maze-book.md
- [x] 2. Roadmap committed + PR opened
- [x] 3. T's answers recorded — 2026-07-07, see "T's answers" above
- [x] 3b. Book screenshots committed to reference/maze-book/
- [x] 4. DESIGN.md authored — 2026-07-07 (The Aporia; the Sophist)
- [x] 5. Act I authored + validated — The Colonnade, validator green
- [x] 6. Act II authored + validated — The Archive, validator green
- [x] 7. Act III authored + validated — The Proof, validator green
- [ ] 8. Validation script green + mechanics-expert review addressed
      (script green for all three acts; expert review in flight)
- [ ] 9. Design specs promoted, PR ready for review
- [ ] 10. Mechanics + CLI implementation merged (post-design)
- [ ] 11. CLAUDE-DESIGN-PROMPT.md written for T
