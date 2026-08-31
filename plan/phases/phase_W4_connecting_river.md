# Phase W4 — The Connecting River + Town Across the River

> Maps 3–4 of the northern continent, plus the advisor-selection
> ritual beat (`map.library.ts`'s own narrative note). Follows W3
> (the northern city). Shipped via `/ship-a-phase` under `/march`
> (build-plan row tagged `/forge`, but the map is large enough to
> ship as an ordinary phase — see Decisions).

## Outcome

A player who reaches the sealed river-gate at `ncy-23` can now
actually cross it: the northern city's Harbormaster boss gates a
new door (`ncy-26`) onto **The Connecting River** (`connecting-river`),
a 13-node map ending at a second door (`cr-13`) onto **The Town
Across the River** (`town-across-river`), a 6-node coda map. The
S-01 "crowning ceremony" flags (northern-forest) and the `ncy-5`
"advisor rumor" flags (northern-city) both get their payoff: the
connecting-river narration node reads them back for reactive prose,
delivering the map's headline beat — the islanders' ritual of
selecting a child to nominate as the King's new advisor — and the
town-across-river narration mirrors it with the sweetheart's own
village nominating her.

## Content / data reads

- `MAP_REGISTRY['northern-continent']['connecting-river' | 'town-across-river']`
  via `getMapDefinition` (existing pattern, no new read path).
- `EnemiesByMap['connecting-river' | 'town-across-river']` via
  `generateEncounter` / `nodeIdToMapName` prefix resolution
  (`cr-`, `tar-`).
- `ConnectingRiverQuests` (already declared in `quest.library.ts`):
  `find-islanders`, `join-islanders-for-ritual`,
  `get-to-town-across-river` — all three authored this phase.

## New primitives

- Two `MapDefinition`s appended to
  `Continents/Northern-Continent/maps.ts` (same file as caverns/
  northern-city — the continent's one-file-per-continent
  convention).
- One NPC each: The Boatwoman (`cr-2`, connecting-river's singleton
  quest-giver) and The Sweetheart (`tar-2`, town-across-river's
  singleton).
- Two narration nodes (`cr-9`, `tar-4`) carrying the ritual beat's
  two halves as multi-node dialogue trees (the `ncy-5` pattern:
  flags only, no branching quest logic inside the tree itself).
- Seven new enemies (`enemy.library.ts`), two of them bosses
  (The Waterreeve, The Portreeve), decks composed from the existing
  shared card canon (no new cards).
- Two mobile layout fixtures + two backdrop-plate resolutions
  (both free rides off existing plates — see Decisions).

## Cross-link retrofit

**In:** `ncy-23` (the sealed river-gate) stays sealed scenery —
unchanged. The real door is `ncy-26`, a new terminal column past
`ncy-25` (the Harbormaster), mirroring `nc-26`'s W3 precedent
exactly. Northern-city's own map-traversal tests update to reflect
the new terminal node.

**Out:** `cr-13` is connecting-river's own door, one column past its
boss (`cr-12`), landing on `tar-1`. `town-across-river`'s boss
(`tar-6`) stays terminal — no W5+ map is shipped yet.

**Retro-fit:** none needed outside the two touched map files — no
other map currently references either new map name.

## Output schema / contracts

No new `MapEventKind`, no new persisted field, no `GAME_STATE_VERSION`
bump (the W3 precedent holds: `unlockMap` admits any *registered*
destination regardless of catalogue staleness, so old saves need no
migration hop to reach the new maps).

## Decisions made upfront — DO NOT ASK

1. **Ship via `/ship-a-phase`, not `/forge`, despite the build-plan
   row's `(/forge; ...)` tag.** `/forge` picks the single
   thinnest surface each tick via its own growth audit; this row
   names a large, pre-scoped two-map arc with a headline story beat
   that's better shipped as one coherent phase than split across
   several undirected `/forge` ticks. The tag is read as "this is
   growth work", not as a hard routing instruction.
2. **Both maps ship smaller than the W1–W3 precedent (10 columns,
   ~25 nodes).** Connecting River is 7 columns / 13 nodes; Town
   Across the River is 4 columns / 6 nodes. Shipping two full
   25-node maps plus a new NPC/enemy/quest arc in one phase is not
   a defensible single slice; a smaller, structurally-complete pair
   (same column-layering law, same singleton-tolerance conventions,
   just fewer columns) is. Town Across the River is explicitly a
   coda location (`map.library.ts`: "Home of sweetheart"), so its
   smaller footprint also reads as an intentional pacing choice, not
   a truncation.
3. **Connecting River's singleton-column tolerance is 4** (arrival,
   The Boatwoman, the boss, the door) — the exact caverns/W3
   pattern. Town Across the River stays at the default tolerance of
   3 (arrival, The Sweetheart, the boss) since it has no door yet.
4. **Quest wiring stays inside the engine's live-wired objective
   types** (`reach`, per `quest.engine.ts` — `talk`/`flag` are
   declared but never auto-advanced anywhere in the codebase). All
   three `ConnectingRiverQuests` grant from The Boatwoman
   (`cr-2`, the guaranteed singleton — the Delver/Gate-Clerk
   precedent) with `reach` objectives: `find-islanders` → `cr-9`;
   `join-islanders-for-ritual` → `cr-13` (witnessing the ritual
   resolves into leaving for the town across the river); `get-to-
   town-across-river` → `tar-1`. No new `TownAcrossRiverQuests`
   union — like northern-city, its own declared-but-unauthored
   quests (there are none pre-declared) stay for a future phase.
5. **The ritual beat lives in narration nodes, not forced
   singletons.** `ncy-5`'s advisor rumor already established that
   campaign-seam content sits in an ordinary 3-lane column (not
   guaranteed every route) — `cr-9` and `tar-4` follow the same
   precedent rather than spending a scarce singleton slot on flavor
   that doesn't gate progression.
6. **Enemy count: 7 new (4 connecting-river, 3 town-across-river),
   2 of them bosses** — smaller than W3's 9-enemy/1-boss batch,
   proportional to the smaller map footprint. Portraits sourced
   from the same licensed `Potential Assets/icons-TBR/` trove (Lorc,
   Delapouite, DarkZaitzev — all CC BY 3.0), rasterized 512px webp
   via `sharp`, matching the W3 provenance-entry shape.
7. **No new map backdrop art needed.** `mapBackdropFor`'s regex
   table matches "The Connecting River" → `CHARON_CROSSING` via
   `/river|crossing|ford|ferry/i`. Town Across the River's region
   string is authored as **"The Sweetheart's Village"** specifically
   to avoid the word "river" (which would re-trigger the crossing
   plate ahead of the village pattern in match order) and land on
   `WENTWORTH_STREET` instead — a deliberate, not incidental,
   backdrop choice.
8. **Node-id prefixes: `cr-` and `tar-`.** Checked against
   `nodeIdToMapName`'s existing prefix chain (`fv-`, `nf-`, `ncy-`,
   `nc-`, `ap1-`, `ap2-`, `ap3-`) for collisions — none.

## Pages × tests matrix

| Surface | New / updated tests |
|---|---|
| Map traversal | `map-traversal.engine.test.ts`: GAUNTLET_MAPS list, singleton tolerance, northern-city terminal-node update, two new describe blocks |
| Map events | `content.engine.test.ts`: AuthoredMap union, two new kind-spread describes, ritual-dialogue assertions |
| Travel doors | `travel-kind.engine.test.ts`: `ncy-26` and `cr-13` door describes (mechanics); `travel-door.engine.test.ts` (mobile) |
| CLI route audit | `game.cli.route-audit.engine.test.ts`: northern-city node count 25→26, two new map audits |
| Enemy roster | `new-enemies.engine.test.ts`: 61→68, new W4 describe block, stamp date |
| Coveted die | `coveted-die.engine.test.ts`: bossUniqueSeen 19→21 |
| Threat sequences | `hazard-pattern-combat-helpers.engine.test.ts`: AUTHORED_THREAT_ENEMY_IDS 65→72 |
| Mobile layout parity | `layout-engine-parity.test.ts`: MAPS array +2 |

## Verify gate

`npm run verify` scoped to `axiomancer-mechanics` (World/Enemy/
Combat diffs) plus the mobile verify (exploration-maps + enemy art
diffs) per AGENTS.md's impact checklist.

## Commit body template

```
feat(mechanics): Phase W4 — the connecting river + town across the river

- <bullets>

Decisions:
- <as above>
```

## DoD

Both maps registered and reachable via a real door chain from the
northern city; roster + pin bumps land in the same commits as the
content that justifies them; verify + mobile verify green; deploy
green.

## Follow-ups (out of scope)

- `find-blacksmith`, `build-boat`, `kill-some-time` (northern-city's
  own still-dangling quests) — untouched.
- Any W5+ door out of Town Across the River.
- Deeper coastal/forest pool differentiation (W5's remaining drain,
  noted on the build-plan row) — untouched.
