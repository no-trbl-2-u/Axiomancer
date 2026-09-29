# Phase R3 — World reset

## Sources

- Part plans: [`plan/revamp/world.md`](../revamp/world.md) § R3 (items 1–9),
  [`plan/revamp/labyrinth.md`](../revamp/labyrinth.md) § R3 (items 1–4).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D53** (Act 1 only; fishing-village purged; the other
  continents parked, code kept), **D54** (the Labyrinth door sealed, the
  module parked), **D61** (the deep stair sealed "like the vault door", no
  end-of-run state; the Doorwarden on every door fight; one Anvil per region
  near its exit), **D62** (the dev menu is left alone), **D45** (carrier
  rule), **D50** (git history is the source archive), **D58** (nothing is
  authored).
- Walkthrough: `plan/revamp/walkthrough.md` § R3.
- Sibling: phase R2 (`phase_R2_enemy_reset.md`) and its a/b split.

## Outcome

The world is Act 1: Breakwater → Charcoal Wood → Beacon Crags → Lantern
Deep. Every door either leads to the next Act 1 map or says it is sealed.
Fishing-village is gone, the northern maps and the Labyrinth are parked
(unreachable, code kept), each region has an Anvil near its exit, and the
only currency word is shillings.

## Split (decided upfront, 2026-09-29)

R2 needed two ticks. R3 is at least as wide (the fishing-village purge alone
reaches ~100 files across both packages), so it ships as three rows, in
order, one per tick:

- **R3a — seal and park.** Scope 1–4 below. After R3a nothing past Act 1 is
  reachable in play; nothing is deleted yet.
- **R3b — purge fishing-village, re-home the Anvil.** Scope 5–6.
- **R3c — hygiene, currency, re-pin.** Scope 7–9.

R5 and R9 require R3c; RC requires all three.

## Scope

### R3a — seal and park

1. **The deep stair (`ld-18`) is sealed.** Its `travel` pool becomes a
   sealed-scenery cutscene (the `nc-16` / `ncy-23` pattern) with a one-line
   status. It leads nowhere; there is no end-of-run state (D61).
2. **The vault door (`ld-15`) is sealed.** Its `labyrinth` pool becomes the
   same sealed cutscene treatment, so `LabyrinthGate` never opens in play.
   The Labyrinth module, CLI and mobile screens stay untouched; the
   `labyrinth` event kind and its handler stay (parked, D54).
3. **Park the northern maps.** `northern-forest`, `caverns`,
   `northern-city`, `connecting-river`, `town-across-river` and
   `the-capital` stay registered but no Act 1 door leads to them. Their
   `EnemiesByMap` pools empty. Their tests keep running unless they need a
   fight on a parked map; those skip with a `parked (D53)` reason.
4. **Save migration (v27 → v28).** A save whose current map is not an Act 1
   map moves to the Lantern Deep: onto `ld-15` from inside the Labyrinth,
   onto `ld-18` from anywhere else (fishing-village or a parked map). A
   staged encounter from the old map is dropped. Test it.

### R3b — purge fishing-village, re-home the Anvil

5. **Purge fishing-village**: the map, its NPCs, dialogue trees, quests,
   events (the `MapEvents/content.ts` FV block, the King's event included),
   the village goodwill system (`village-goodwill.ts`, its mobile
   cache/journal paths, `mapGoodwill` dropped from the save by migration),
   `FV_*` pins, its layout and art registry rows, and
   `World/e2e/fishing-village-after-act1.engine.test.ts`. Tests pinned to
   fishing-village are re-pointed at an Act 1 map where their subject
   survives, deleted where the subject was fishing-village.
6. **Re-home the Anvil once per region** (D61): the existing `blacksmith`
   event on one node near each region's exit (the Lantern Deep's forge
   landmark on column 4); same engine, prices and witness variants;
   existing description lines reused. Update
   `MapEvents/e2e/blacksmith-kind.engine.test.ts`.

### R3c — hygiene, currency, re-pin

7. **Act 1 content hygiene**: unstartable quests and unread dialogue flags
   in kept maps deleted; a reward that grants nothing grants something real
   that already exists or is removed. No new prose.
8. **Currency is "shillings"** in every kept content line and UI copy
   (gold, coin, coppers go).
9. **Re-pin** narrative reachability (`World/narrative-reachability.test.ts`)
   and the e2e map-walk journeys to Act 1; the `act1-elites` suite already
   pins the Doorwarden door fights (R2a).

Scope item 5 of the part plan (re-point Act 1 encounters) already shipped
in R2a: every Act 1 pool is Float-Eye, one Brine Hag node per region, the
Doorwarden on `bw-17`, `cw-17`, `bc-15`, `ld-16`. R3 only checks it.

## Save / schema contracts

- R3a: `GAME_STATE_VERSION` 27 → 28. `migrateV27ToV28` relocates an
  off-Act-1 save (see scope 4); pure and idempotent.
- R3b: `mapGoodwill` leaves `GameState`; its own migration hop drops it.

## Decisions made upfront — DO NOT ASK

- **The sealed doors are cutscenes, not a new event kind.** The shipped
  sealed-scenery pattern (`nc-16`, `ncy-23`) is a one-line cutscene;
  labyrinth.md allows "a one-line status, no new prose". The line names the
  door and says it is sealed, nothing more.
- **`ld-18` stays a terminal node.** D61 rejected looping back and an end
  scene; a player who reaches it has spent the Lantern Deep's column 6 and
  the map is done.
- **The migration uses the save's own Lantern Deep map state** when it has
  one, else a fresh one, and places the player with `placeOnNode` (the
  placement verb: no arrival owed, node content live, neighbours opened).
- **The dev menu is left alone** (D62): the dev WORLD → TRAVEL row can still
  reach parked maps and the Labyrinth in a dev build. That is B10's to cut.
- **Labyrinth pools stay** (not in labyrinth.md's scope); only the northern
  maps' pools empty. The Labyrinth's tests keep running as they are.
- **Fishing-village keeps its pool in R3a**; R3b deletes it with the map.

## Tests matrix

- R3a new: `ld-18` and `ld-15` resolve to sealed cutscenes; no Act 1
  travel door leads off Act 1; parked pools are empty; the v27 → v28
  migration (fishing-village, parked map, Labyrinth, Act 1 untouched,
  idempotent).
- R3a re-pointed: suites that walked `ld-18` into fishing-village or
  `ld-15` into the Aporia pin the sealed door instead; suites that fight on
  a parked map skip `parked (D53)`.
- R3b deleted with their subjects: fishing-village suites, goodwill suites;
  the blacksmith suite re-pinned to the four regional Anvils.
- R3c: narrative reachability and the map walk re-pinned to Act 1.

## Verify gate

`npm run verify --workspace axiomancer-mechanics`,
`npm run verify --workspace axiomancer-mobile`, root `npm test`,
`npm run lint:content`, `node scripts/check-lexicon.mjs`.

## DoD

- R3a: no Act 1 door leads off Act 1; saves off Act 1 migrate onto the
  Lantern Deep; parked pools empty.
- R3b: no `fishing-village` map, NPC, event, quest or goodwill code in the
  tree; four Anvils, one per region.
- R3c: no gold/coin/coppers in kept content; no unstartable quest or unread
  flag in kept maps; reachability pinned to Act 1.
- All gates green each tick.

## Follow-ups (out of scope)

- R3b carry-overs for R3c (hygiene): the loot-cache `sacrifice` offer now
  grants nothing and its label still says "for the village" (a reward that
  grants nothing: remove or re-point); the CLI walkthroughs `shop.json`,
  `save-load.json`, `map-events.json`, `codex-unlock.json` and their goal
  docs still route through `fv-*` nodes; `docs/quickstart.md` and
  `docs/enemy.md` still describe purged befriend placements.
- R3b carry-overs elsewhere: the Drowned Parish combat arena plate
  (`assets/images/combat/coastal-village.webp`, its arena row, provenance,
  art-sources and art-catalog entries) has no live region (R8, mobile
  cleanup); `unlockCardViaDilemma` and the Ally registry lost their only
  grant path (R7c, dead code); `.claude/agents/playtester.md` still names the
  old `-fv-` fixture ids (attended residue).

- R5 re-points shops and caches; R9 retunes the quest XP; B9 re-themes the
  Labyrinth; B10 cuts the dev menu's travel rows.
