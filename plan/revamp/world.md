# Revamp — world

> Part plan of [THE REVAMP](README.md). Phase **R3** (loop). Decision D53.
> Status: PROPOSED. The Labyrinth has its own plan ([labyrinth.md](labyrinth.md)).

## Where things stand

Two continents plus the Labyrinth (`World/map.library.ts`):

- **Act 1** (map revamp M0–M5, D23/D27/D28): Breakwater (`bw-`) → Charcoal
  Wood (`cw-`) → Beacon Crags (`bc-`) → Lantern Deep (`ld-`). New games start
  on the Breakwater (D27, D31). D30: no bosses, one elite per region on its
  last fight before the door.
- **Fishing-village** — the old starting map, now reached *after* Act 1
  through the Lantern Deep's deep stair (`ld` c6, D27). Home of the King of
  Revenge (D33), the village goodwill system (Phase 65), and most of the
  shipped NPC dialogue (`Continents/Coastal-Village/maps.ts`, `npcs.ts`).
- **Northern-forest** (coastal continent) and the **northern continent**
  (caverns, northern-city, connecting-river, town-across-river, the-capital).
- The **Labyrinth** (three Aporia acts), entered at the Lantern Deep's vault
  door (`ld-15`, D24, M4).

Audit findings in the kept area and beyond:

- Unstartable quests: `find-blacksmith`, `build-boat`, `kill-some-time`,
  `join-islanders-for-ritual` (`World/quest.library.ts`,
  `Northern-Continent/maps.ts:472`).
- ~33 of 46 dialogue `setFlag`s are never read (old alignment gates, T6).
- "Accept the crystal" (`Northern-Forest/npcs.ts:57-60`) grants nothing.
- Goodwill tier 2 grants nothing (`village-goodwill.ts:19`,
  `GOODWILL_ALLY_CARD_ID = null`).
- Currency has five names: shillings (UI, hazard), gold (dialogue,
  `Coastal-Village/maps.ts:185-276`), coin (blacksmith, labyrinth), coppers
  (loot caches). Quest XP 30–65 against 1,000 XP levels (→ R9).

## R3 — World reset (loop)

T, 2026-09-28: "Act 1 only, purge the king, purge the fishing village."

1. **Purge fishing-village** — delete the map, its NPCs, dialogue trees,
   quests, events (`MapEvents/content.ts` FV block incl. the King's event at
   `:952-960`), the village goodwill system (`village-goodwill.ts` and its
   mobile cache/journal paths), `FV_*` pins and
   `World/e2e/fishing-village-after-act1.engine.test.ts`. The King retires
   in R2.
2. **The Lantern Deep's deep stair** (c6, the terminal door) loses its
   destination. It is **sealed**, with the vault door's treatment; the
   player keeps wandering Act 1 and there is no end-of-run state (D61).
3. **Park** northern-forest and the whole northern continent: unreachable,
   code kept, no tests deleted unless they depend on retired foes (then
   re-point or skip with a `parked (D53)` reason). Empty their
   `EnemiesByMap` pools.
4. **Seal the Labyrinth door** — see [labyrinth.md](labyrinth.md).
5. **Re-point Act 1 encounters** at the R2 survivors (Float-Eye on normal
   fights, Brine Hag as a rarer mid-region fight, the Doorwarden on every
   region's door fight — `bw-17`, `cw-17`, `bc-15` and the Lantern Deep's
   column-5 node, D61) and update `World/e2e/act1-elites.engine.test.ts`.
5b. **Re-home the Anvil once per region** (D61). Its only placement
   (`fvBlacksmithPool`, Phase 60) dies with fishing-village. Place the
   existing `blacksmith` event on one node near each region's exit (four
   total; the Lantern Deep's column 4 has a forge landmark). Same engine,
   prices and witness variants; reuse existing description lines; update
   `MapEvents/e2e/blacksmith-kind.engine.test.ts`.
6. **Act 1 content hygiene:** delete unstartable quests and unread dialogue
   flags that live in kept maps; any reward that grants nothing either
   grants something real that already exists or is removed. No new prose
   (D58) — lines are deleted or reused, never authored.
7. **Currency is "shillings"** everywhere in kept content and UI copy.
8. Save migration: a save positioned on fishing-village or a parked map
   moves to the Lantern Deep's deep-stair node; goodwill tallies are
   dropped.
9. Narrative reachability (`World/narrative-reachability.test.ts`) and the
   e2e journeys (the map walk) are re-pinned to Act 1.

Requires R2 (the survivors exist).
