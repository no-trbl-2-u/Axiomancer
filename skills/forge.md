# Skill: forge

> **The content foundry.** Every tick ships NEW content — a new
> enemy, new cards, a new keyword, a new map, a new continent
> region, new events, new dialogue, newly wired art. Where
> `/iterate` polishes what exists, `/forge` grows the game.
> Authorized and MANDATED by THE OPEN GATE ¶8 and THE PIPELINE
> LIBERATION (`plan/bearings.md`).

## 1. Purpose

The game's standing weakness is thinness: one reachable
continent for most of its life, a fixed roster, a fixed card
pool. THE OPEN GATE (T direct, 2026-08-28) made content growth a
standing mandate: *"new enemies, new cards, new everything ...
NEW CONTINENTS, NEW MAPS!"* This verb is that mandate's engine.

One tick = one content ship, end-to-end, through the full wiring
checklist for its surface, with tests, pins bumped, and both
gates green. Not a proposal. Not a report. Shipped content.

## 2. Invocation

```
/forge                # pick the thinnest surface, ship one growth
/forge enemies        # constrain to a surface this tick
/forge cards | keywords | maps | continent | events | dialogue | art
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
| Enemies | per-map roster size + repeat rate on a full map run; maps sharing >70% of a pool |
| Cards | pool size per stance/theme; CQI spread; draft-choice repeat rate |
| Keywords | keywords with <3 carriers; mechanics with no keyword |
| Events | `MapEventKind` spread per map; pools where one kind >40% |
| Dialogue/NPCs | maps with <2 staged NPCs; `unstagedNpcs` backlogs |
| Art | content shipping placeholder/procedural art with licensed or generated replacements available |

Pick the ONE highest-scoring surface (or honor the argument).

### Step 2 — Design against prior art

For cards/keywords spawn `card-expert`; for narrative spawn
`content-curator`; for maps/enemies/events design directly,
consulting `kb-query` (Dawncaster corpus, board-game reception)
and the specs (`spec.md`, spec 34, `specs/world/`,
`docs/profane-canon.md`). House voice per spec 34 §2.5 — terse,
cold, priced scenery, no thee/thou/thy/thine/ye.

### Step 3 — Ship through the surface's wiring checklist

**Enemy** (~10 coupled edits): `enemy.library.ts` entry +
`ENEMY_REGISTRY` slug + `EnemiesByMap` pool key + deck obeying
deck laws + aftermath prose + mobile art key with a UNIQUE
`portraitAsset` (1:1 art law — source from the licensed trove or
the generation pipeline, provenance recorded) + count-pin bump.

**Card / keyword**: card-expert's FULL wiring checklist — engine
+ pricing + display + mobile keyword registry/gloss + card-editor
union + keyword-atlas row + `docs/retheme-map.json` + hermetic
e2e + cross-package verifies.

**Map**: `map.library.ts` unions + `MapDefinition` under
`src/World/Continents/<name>/` obeying the column-layering law +
`map.registry.ts` + `nodeIdToMapName()` prefix + event pools in
`MapEvents/content.ts` (idempotent registration) + enemy pools +
NPCs/dialogue + mobile layout fixture registered in
`exploration-maps/index.ts` (layout-engine-parity green) + a
backdrop plate with provenance + a travel door INTO it (a map
without a door is not shipped content).

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

Count pins are ledgers, not walls (PIPELINE LIBERATION ¶4):
bump every pin the add touches IN THE SAME COMMIT, commit body
citing the ruling. Never bump a pin without content.

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
2. **Ship content, not stubs.** A map nobody can reach, an enemy
   in no pool, a card in no draft table — none of these count.
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
3. **A pin edit without content** — that is tampering; abort.
4. **Growth would break a save** — the migration is part of the
   ship, not a follow-up.

## 6. Quick reference

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run game -- combat            # play what you shipped
node scripts/kb-sync.mjs          # prior-art corpus refresh
npm run baseline:check            # before citing balance numbers
```
