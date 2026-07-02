# Phase 65 — Expand the fishing-village starting map ("huge first map" pass)

> User-directed at oversight 2026-05-20 eighth-of-session. Pure content
> + structure expansion of an existing map; no new engine surface.

## Outcome

`src/World/Continents/Coastal-Village/maps.ts` `fishingVillage` map
grows from a linear 10-node chain to a **25-node branching grid**
with three sub-areas (Harbor District / Inland Streets / Cliff Path
Headlands), 2 dead-end branches, and 1 small loop. Each new node
ships a registered `MapEventPool` entry in
`src/World/MapEvents/content.ts`. Mix of all 8 `MapEventKind` values
(encounter / interaction / gathering / rest / village / cutscene /
hazard / loot-cache). The existing 10-node spine (`fv-1` → `fv-10`)
is preserved verbatim — all existing tests, Phase 43 alignmentDelta
authoring, Phase 62 flag-gated dialogue, Phase 63 observer wiring
continue to work without modification.

## Source

`plan/PHASE_CANDIDATES.md` Phase 65 row (user write-in at oversight
2026-05-20 eighth-of-session): "I want to make the first map
considerably larger. For now it'll be the 'base' map but in the
future we can start breaking it up and balancing it. For now, I just
want a huge first map."

## Layout

```
                  fv-15 (gull crag, encounter)
                       ↑
                  fv-14 (tide pools, gathering)
                       ↑
   fv-11 ── fv-12 ── fv-13       (harbor district, y=+1..+2)
    │        │        │
   fv-1 ── fv-2 ── fv-3 ── fv-4 ── fv-5 ── fv-6 ── fv-7 ── fv-8 ── fv-9 ── fv-10
                    │        │       │              │       │
                  fv-16    fv-17    fv-18          fv-21   fv-22 ── fv-23
                    │        │ ──── │ ── fv-19      │       │       │
                    └──── fv-17     fv-19 ── fv-20  │      fv-24 ── fv-23 (loop)
                           (loop)                   │       │
                                                   fv-24 ── fv-25 (gull's nest)
```

(Coordinates: spine on y=0; harbor on y=+1..+2; inland on y=-1..-2;
cliff path on y=+1..+2 east of fv-7.)

### Per-node layout + event-kind assignment

| New ID | Position | Sub-area | Event kind | Description |
|---|---|---|---|---|
| `fv-11` | `[0, 1]` | Harbor district | `village` | Fishmonger row stall — nets + bait. Sibling shop to fv-3. |
| `fv-12` | `[1, 1]` | Harbor district | `interaction` | Ferry slip; the ferrier is absent. |
| `fv-13` | `[2, 1]` | Harbor district | `rest` | Quayside chapel; small bench. |
| `fv-14` | `[0, 2]` | Harbor district | `gathering` | Tide pools at low tide — shells + sea-glass. |
| `fv-15` | `[1, 2]` | Harbor district (**dead-end**) | `encounter` | Gull crag; the mournful-gull's territory. |
| `fv-16` | `[2, -1]` | Inland streets | `rest` | Town well; old stone, cold water. |
| `fv-17` | `[3, -1]` | Inland streets | `gathering` | Smokehouse; the rack is half-loaded with salt-fish. |
| `fv-18` | `[4, -1]` | Inland streets | `encounter` | Back alley; the hollow-eyed-beggar's hunting ground. |
| `fv-19` | `[3, -2]` | Inland streets (**loop**) | `loot-cache` | Abandoned shack — fisher's widow's belongings. |
| `fv-20` | `[4, -2]` | Inland streets (**loop**) | `cutscene` | Old shrine to a half-forgotten sea-god. |
| `fv-21` | `[6, 1]` | Cliff path | `interaction` | Gull-tossed steps; a returning fisherman pauses. |
| `fv-22` | `[7, 1]` | Cliff path | `loot-cache` | Sea-stack base — kelp-bound bundle wedged in rock. |
| `fv-23` | `[8, 1]` | Cliff path | `cutscene` | Lighthouse ruin; the lamp room is open to the sky. |
| `fv-24` | `[8, 2]` | Cliff path | `rest` | Keeper's cottage; the kettle is still warm. |
| `fv-25` | `[9, 2]` | Cliff path (**dead-end**) | `hazard` | Gull's nest — territorial fledglings strike at intruders. |

### Connection updates

Existing spine connections preserved (`fv-1` ↔ `fv-2` ↔ ... ↔ `fv-10`,
all bidirectional except `fv-10` which terminates). Spine nodes that
gain new connections:
- `fv-1` adds `fv-11` (harbor branch entry).
- `fv-2` adds `fv-12`.
- `fv-3` adds `fv-13`, `fv-16` (harbor + inland).
- `fv-4` adds `fv-17`.
- `fv-5` adds `fv-18`.
- `fv-7` adds `fv-21` (cliff branch entry).
- `fv-8` adds `fv-22`.

New nodes' connection patterns documented inline in the diff.

## Implementation units

### Unit 1 — Map structure: 15 new nodes + connection updates

**Files:**
- `src/World/Continents/Coastal-Village/maps.ts` `fishingVillage.nodes[]` array: append 15 new node entries per the layout table; update existing nodes' `connectedNodes` to include the new branches; `startingNode` stays at `fv-1` (now connected to `fv-2` + `fv-11`).

### Unit 2 — MapEventPool authoring for the 15 new nodes

**Files:**
- `src/World/MapEvents/content.ts`: 15 new `MapEventPool` consts authored following the existing pattern (one pool per node, single entry per pool — matches the current `fvCutscene` / `fvShop` / etc. style). Per-node `alignmentDelta` where thematically appropriate (per Phase 43 convention). Register all 15 in the `FISHING_VILLAGE_POOLS` array.

Detail per pool:
- `fv-11 fishmonger-row`: village pool with a small ware list (nets, bait, smoked-fish — reuse existing item ids where they exist; the brief stays flexible if specific item ids don't exist).
- `fv-12 ferry-slip`: interaction with no NPC payload (description-only beat); `alignmentDelta: { outlook: -1 }` (absent ferrier reads as small pessimistic-relational pull).
- `fv-13 quayside-chapel`: rest with `healFraction: 0.5` (smaller than the campfire), `alignmentDelta: { epistemology: -1, scope: 1 }`.
- `fv-14 tide-pools`: gathering with a `sea-shell` material item (per existing `driftwood` pattern; if `sea-shell` doesn't exist it stays as a description-only `gathering` payload — material-id authoring is out of scope).
- `fv-15 gull-crag`: encounter with `enemySlug: 'mournful-gull'`. Phase 60 already authored MournfulGull's befriend reward — placing her here makes the befriend interaction discoverable.
- `fv-16 town-well`: rest with `healFraction: 0.75`, no alignmentDelta.
- `fv-17 smokehouse`: gathering (description-only).
- `fv-18 back-alley`: encounter with `enemySlug: 'hollow-eyed-beggar'`. Same logic as fv-15 — discoverability for Phase 60's other authored befriendable.
- `fv-19 abandoned-shack`: loot-cache, `currency: 8`.
- `fv-20 old-shrine`: cutscene with 2 lines of flavor, `alignmentDelta: { epistemology: -2, scope: 2 }`.
- `fv-21 gull-tossed-steps`: interaction (description-only beat; future content can place an NPC here).
- `fv-22 sea-stack`: loot-cache, `currency: 12`.
- `fv-23 lighthouse-ruin`: cutscene with 2-3 lines of flavor, `alignmentDelta: { outlook: -1, scope: 2 }`.
- `fv-24 keepers-cottage`: rest with `healFraction: 1.0`, `alignmentDelta: { outlook: 1, scope: 1 }` (warmth + abandoned + welcoming).
- `fv-25 gulls-nest`: hazard, `damage: 1`, `alignmentDelta: { outlook: -1 }`.

### Unit 3 — Hermetic e2e + docs

**Files:**
- `src/World/e2e/world.engine.test.ts` extend with 1-2 cases pinning the expanded shape: (1) `fishingVillage.nodes.length === 25`; (2) `fishingVillage.nodes.find(n => n.id === 'fv-15')!.connectedNodes` is `['fv-14']` (dead-end shape); (3) `fv-3.connectedNodes` includes both the spine continuation AND the harbor / inland branches. Optionally drive a `resolveMapEvent` against `fv-11` (village pool) and assert the village payload surfaces.
- `docs/world.md` (or `docs/world/coastal-village.md` if a per-map doc exists) gets a brief subsection mentioning the 25-node expanded shape + the 3 sub-areas.
- `CHANGELOG.md` `[unreleased]` `### Added` (or `### Changed` — see D2) gains a Phase 65 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — Preserve the existing 10-node spine verbatim.** `fv-1` through `fv-10` keep their existing `connectedNodes` to their immediate spine neighbours (just extending each with the new branch IDs as appropriate). All existing Phase 23/24 MapEventPool overrides + Phase 43 alignmentDelta authoring on fv-1/8/9/10 + Phase 62 flag-gated content stay live without edit.
- **D2 — CHANGELOG goes in `### Changed`, not `### Added`.** The map IS pre-existing; this phase expands it. Public-API surface unchanged (no new exports). Phase 65 is consumer-visible content scale, not surface scale.
- **D3 — No fixture refresh.** `scripts/public-surface.expected.json` stays at 233 + 159 (no new exports from `src/index.ts`).
- **D4 — 25 nodes, not 35.** Per the candidate's "25-35 range" guidance, pick the lower bound — 15 new nodes is already 6 commits' worth of authoring discipline. Future "phase B" can densify within the same sub-areas if scope demands; phase splits are explicitly the user's "future balancing phases" direction.
- **D5 — Reuse existing enemies + NPCs only.** Per the candidate row: "Reuse existing enemies + NPCs (no new enemy / NPC content this phase)." `fv-15` references MournfulGull; `fv-18` references HollowEyedBeggar; both already authored in `enemy.library.ts`.
- **D6 — Material-id authoring is out of scope.** Where a gathering pool would benefit from a new material item (`sea-shell`, `salt-fish`), use the existing `driftwood` / `oak-branch` pattern with description-only payloads if the canonical id doesn't exist. New material authoring is a follow-up content phase.
- **D7 — Three commits.** Unit 1 (map structure) → Unit 2 (pool authoring) → Unit 3 (e2e + docs + CHANGELOG). Step 11 ship-row flip is the fourth.
- **D8 — `alignmentDelta` annotations only where thematically tight.** Don't over-annotate; the Phase 43 first-pass had ~6 alignmentDelta entries across the 10 original nodes (≈60% coverage). Mirror that density on the new 15.

## Verify gate

- `npm run type-check` — clean (no engine code change; just data additions).
- `npm test` — must stay green. Existing tests reference fv-1..fv-10 by id; the spine is preserved so those continue to pass. New e2e cases add ≥2 to the count.
- `npm run build` — clean.
- `npm run deploy:check` — clean (no public-surface change).

## Commit body templates

### Unit 1 commit

```
feat(world): Phase 65 unit 1 — fishing-village expansion (15 new nodes + branches)

- src/World/Continents/Coastal-Village/maps.ts fishingVillage.nodes[]
  grows from 10 to 25 entries. Existing fv-1..fv-10 spine preserved
  verbatim; their connectedNodes extend to add the new branch IDs
  where applicable per D1.
- New 15 nodes split into 3 sub-areas:
  - Harbor district (y=+1..+2): fv-11..fv-15 (with fv-15 dead-end)
  - Inland streets (y=-1..-2): fv-16..fv-20 (with fv-17 ↔ fv-19 loop)
  - Cliff path (y=+1..+2 east): fv-21..fv-25 (with fv-25 dead-end)
- 2 dead-ends + 1 small loop per the layout table in the brief.
- No MapEventPool authoring this commit — Unit 2 follows.

Decision D4 — 25 nodes (lower bound of the 25-35 target); future
phases densify if scope demands.
```

### Unit 2 commit

```
feat(content): Phase 65 unit 2 — MapEventPool entries for 15 new nodes

15 new pool consts added to src/World/MapEvents/content.ts following
the existing single-entry-per-pool pattern; all 15 registered in
FISHING_VILLAGE_POOLS.

Per-kind distribution (15 new): 1 village, 2 interaction, 3 rest, 2
gathering, 2 encounter, 2 loot-cache, 2 cutscene, 1 hazard. Combined
with existing 10 (2 cutscene, 2 interaction, 1 village, 2 encounter,
1 loot-cache, 1 gathering, 1 rest, 1 hazard), the 25-node map covers
all 8 MapEventKind values multiple times.

Notable placements per D5 (reuse existing enemies):
- fv-15 gull-crag: encounter w/ MournfulGull (Phase 60 befriendable)
- fv-18 back-alley: encounter w/ HollowEyedBeggar (Phase 60 befriendable)

alignmentDelta annotations on 6 pools per D8 (60% density mirroring
Phase 43's first-pass on the spine).
```

### Unit 3 commit

```
test(world,changelog): Phase 65 unit 3 — e2e + docs + CHANGELOG

- src/World/e2e/world.engine.test.ts extended with Phase 65 cases
  pinning the 25-node shape, the dead-end at fv-15, and the
  branching at fv-3.
- docs/world.md gains a Phase 65 subsection describing the 3
  sub-areas + the 2 dead-ends + the 1 loop.
- CHANGELOG.md [unreleased] ### Changed gains a Phase 65 bullet per
  D2 (content scale, not surface scale).
```

## Definition of Done

- [ ] `fishingVillage.nodes.length === 25` (15 new + 10 existing).
- [ ] Spine fv-1..fv-10 connectedNodes extended (not replaced) with branch IDs.
- [ ] 15 new MapEventPool consts authored + registered in `FISHING_VILLAGE_POOLS`.
- [ ] e2e covers the new shape (length, dead-ends, branching).
- [ ] `docs/world.md` Phase 65 subsection.
- [ ] CHANGELOG.md [unreleased] ### Changed Phase 65 bullet.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 65 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **Per-sub-area NPC authoring.** The expansion makes room for ~3-5 new NPCs (e.g. ferrier at fv-12, fisherman at fv-21); future content phase can fill them.
- **New material item authoring** (`sea-shell`, `salt-fish`) for the gathering pools that currently ship description-only payloads per D6.
- **Northern-forest expansion.** The Northern Continent stub candidate (score 3.5) and Phase 65's pattern together establish the per-continent layout convention; expanding northern-forest in the same shape is a natural follow-up.
- **Balancing phases.** Per the user's framing, this is the "base map" — future balancing phases break it up and re-tune encounter / hazard density per sub-area.

## Canonical sibling

`src/World/MapEvents/content.ts` per-pool pattern (the 10 existing fv-* pools) is the model for Unit 2. `src/World/Continents/Coastal-Village/maps.ts` `northernForest` is a smaller branching example (2-way fork at nf-1, joining at nf-6) — Phase 65 generalises that pattern at scale.
