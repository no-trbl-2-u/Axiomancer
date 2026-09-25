# Skill: forge

> **The content foundry.** Every tick ships NEW content — a new
> map, a new continent region, new events, newly wired art. Where
> `/iterate` polishes what exists, `/forge` grows the spatial/world
> surfaces. Authorized and MANDATED by THE OPEN GATE ¶8 and THE
> PIPELINE LIBERATION (`plan/bearings.md`).
>
> **Per-item content surfaces split out to the `adjust-*` family**
> (2026-09-02): enemies, cards, keywords, equipment, and NPCs/dialogue
> each have a standing lifecycle steward (`skills/adjust-enemies.md`,
> `adjust-cards.md`, `adjust-keywords.md`, `adjust-equipment.md`,
> `adjust-npcs.md`) that creates, updates, AND retires that surface's
> content on its own rate-limited cadence (`/march` §3b). `/forge`
> keeps ownership of maps/continents, events, and art — surfaces that
> are structural/spatial rather than per-item.

## 1. Purpose

The game's standing weakness is thinness: one reachable
continent for most of its life, a fixed set of events, placeholder
art. THE OPEN GATE (T direct, 2026-08-28) made content growth a
standing mandate: *"new enemies, new cards, new everything ...
NEW CONTINENTS, NEW MAPS!"* — the per-item half of that mandate
(enemies/cards/keywords/equipment/NPCs) now runs through the
`adjust-*` family instead of here; this verb is the engine for the
world/map/event/art half.

One tick = one content ship, end-to-end, through the full wiring
checklist for its surface, with tests and both gates green. Not a
proposal. Not a report. Shipped content.

## 2. Invocation

```
/forge                # pick the thinnest surface, ship one growth
/forge maps | continent | events | art
/loop /march          # march routes to forge when growth is due
```

## 3. Procedure

### Step 0 — Sync + bearings

```bash
git pull --ff-only
```

Read `plan/bearings.md` (THE OPEN GATE, THE PIPELINE LIBERATION,
LOCKED MECHANICS keep-list) and this file. Divergence → stop.

### Step 1 — Measure thinness (the growth audit)

Score each surface by player-visible thinness. Evidence, not
vibes — read the live libraries (or `axio-query` MCP):

| Surface | Thinness signal |
|---|---|
| Maps/continents | reachable maps vs authored maps; continents with `{}` registries; travel dead-ends |
| Events | `MapEventKind` spread per map; pools where one kind >40% |
| Art | content shipping placeholder/procedural art with licensed or generated replacements available |

Pick the ONE highest-scoring surface (or honor the argument).
Enemies/cards/keywords/equipment/NPCs are out of scope here — route
those findings to the matching `adjust-*` skill instead (or note them
for its next rate-limited pass; don't ship them from `/forge`).

### Step 2 — Design against prior art

**Run the KB research pass BEFORE writing anything**: query the
`kb-query` MCP server (`kb_search` / `kb_find_games` — board-game
reception, Dawncaster corpus) on the surface in play, then read the
specs (`spec.md`, spec 34, `specs/world/`; `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/docs/profane-canon.md`
is HISTORICAL — voice guidance only).
The MCP tools are the only route to the corpus — when they are down
there is no fallback, so say the corpus was unreachable and label the
grounding UNGROUNDED. Document a genuine coverage miss in the commit
body. Narrative beats that ride
along with a map/event (not full NPC authoring — that's
`adjust-npcs`'s job) still route to `content-curator`. House voice
per spec 34 §2.5 — terse, cold, priced scenery, no
thee/thou/thy/thine/ye.

### Step 3 — Ship through the surface's wiring checklist

**Map**: `map.library.ts` unions + `MapDefinition` under
`src/World/Continents/<name>/` obeying the column-layering law +
`map.registry.ts` + `nodeIdToMapName()` prefix + event pools in
`MapEvents/content.ts` (idempotent registration) + mobile layout
fixture registered in `exploration-maps/index.ts`
(layout-engine-parity green) + a backdrop plate with provenance + a
travel door INTO it (a map without a door is not shipped content).
Reference existing enemy pools / NPCs when the map needs them — don't
author new enemies or NPCs here; file that need to `adjust-enemies` /
`adjust-npcs` if the map can't be reasonably populated from what
already exists.

**Continent**: as Map, plus the continent key in the registry and
`createStartingWorld()`'s world catalogue, plus a travel route
that reaches it.

**Event kind**: `MapEvents/types.ts` + handler + mobile presenter
+ `GAME_STATE_VERSION` hop + pinned migration test (a new KIND or
persisted field always rides a migration).

**Art**: acquire (licensed/PD, `scripts/acquire-art.mjs`) or
generate (the adapter pipeline), write `provenance.json`
truthfully, wire, and delete the placeholder it replaces.

### Step 4 — Growth ledgers

Count pins were REPEALED outright by THE BIG NUMBERS REWRITE
(2026-09-02) — there is no pin bookkeeping any more. Don't let a
stale phase brief or checklist talk you into bumping one; the
ledger of record for content passes is `plan/CONTENT_LEDGER.md`
(the `adjust-*` family's) plus the build-plan row this skill files
in Step 6.

### Step 5 — Gates

`npm run verify` scoped to touched workspaces; any
`src/World/**`, `src/Enemy/**`, `src/Cards/**`, `src/Effects/**`,
`src/Combat/**`, `src/NPCs/**`, or `src/index.ts` diff also runs
the mobile verify (+ card-editor type-check for the card/combat
paths) per AGENTS.md's impact checklist. Commit+push atomic to
`main`; `npm run deploy:check` after.

### Step 6 — File the residue

Build-plan row for what shipped; follow-on growth ideas to
`plan/PHASE_CANDIDATES.md`; any owner-flavored call made along
the way to `plan/AUDIT.md` as `[loop-call]` with reasoning.

## 4. Hard rules

1. Nexus standing rules 1–7 (AGENTS.md) apply in full.
2. **Ship content, not stubs.** A map nobody can reach, an event
   kind with no handler, art with no provenance — none of these
   count.
3. **The keep-list stands**: Conviction, Surge, Dice stay (THE
   OPEN GATE ¶2 — loop stewardship, standing judgment KEEP).
   New content may interact with all three; encouraged.
4. **Provenance is truthful or the art doesn't ship.**
5. **One surface per tick.** Depth over sprawl; the loop runs
   again tomorrow.
6. **New persisted kinds/fields ride `GAME_STATE_VERSION`** with
   a migration hop and a pinned migration test. Always.

## 5. Failure modes

1. **Verify/deploy gate fails ≥3 times on one root cause** —
   stop cleanly, file the blocker to AUDIT.
2. **The surface needs an absent capability** (e.g. generation
   key missing for required art) — ship the largest subset that
   is real (licensed trove, reuse-with-provenance), file the gap.
3. **Growth would break a save** — the migration is part of the
   ship, not a follow-up.

## 6. Quick reference

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run game -- combat            # play what you shipped
npm run baseline:check            # before citing balance numbers
```
