# Phase 117 — Northern-forest expansion (Phase 65 pattern applied to `nf-*`)

> Content expansion applying the Phase 65 fishing-village pattern to
> northern-forest. Pure structure + pool authoring; no new engine surface.

## Outcome

`src/World/Continents/Coastal-Village/maps.ts` `northernForest` map
grows from a 10-node branching pattern to a **25-node multi-area grid**
with three sub-areas (Glen Path / Bone Hollow / Mist Ridge), 2–3 dead-end
branches, and 1 small loop. Each new node ships a registered `MapEventPool`
entry in `src/World/MapEvents/content.ts`. Mix of all 8 `MapEventKind`
values (encounter / interaction / gathering / rest / village / cutscene /
hazard / loot-cache). The existing 10-node structure (`nf-1` → `nf-10`)
is preserved — all existing tests, Phase 43 alignmentDelta authoring,
Phase 62 flag-gated dialogue, Phase 63 observer wiring continue to work
without modification.

## Source

`plan/steps/01_build_plan.md` Phase 117 row (promoted via oversight
2026-06-04): "Grow `northern-forest` from 11 to ~25 nodes with 2–3
sub-areas (thematic identity e.g. Glen Path dead-end, Bone Hollow,
Mist Ridge); extend `connectedNodes` without replacing existing spine."

## Layout

Current northern-forest has a fork-and-rejoin pattern:
```
nf-1 ──┬── nf-2 ── nf-4 ──┐
       │                   ├── nf-6 ── nf-7 ── nf-8 ── nf-9 ── nf-10
       └── nf-3 ── nf-5 ──┘
```

Expanded to 25 nodes with 3 sub-areas:
```
                          nf-15 ── nf-16 ── nf-17 (bone hollow)
                           │        │
nf-1 ──┬── nf-2 ── nf-4 ──┼── nf-6 ── nf-7 ── nf-8 ── nf-9 ── nf-10
       │                  │         │        │        │
       └── nf-3 ── nf-5 ──┘         │      nf-18    nf-22 ── nf-23
           │                       nf-11     │        │       │
         nf-12 ── nf-13 ── nf-14            nf-19   nf-24 ── nf-25
           │       │                         │       │
         nf-20 ── nf-21                    nf-20     nf-25 (loop)
     (glen path)  (dead-end)              (mist ridge)
```

### Per-node layout + event-kind assignment

| New ID | Position | Sub-area | Event kind | Description |
|---|---|---|---|---|
| `nf-11` | `[4, -1]` | Mist ridge | `rest` | Mossy clearing with a fallen log bench |
| `nf-12` | `[1, -1]` | Glen path | `encounter` | Dense thicket; domain of the bristling-boar |
| `nf-13` | `[2, -1]` | Glen path | `gathering` | Berry bushes heavy with dark fruit |
| `nf-14` | `[3, -1]` | Glen path | `interaction` | Stone marker left by previous travelers |
| `nf-15` | `[3, 1]` | Bone hollow | `hazard` | Bramble trap; thorns catch at unwary feet |
| `nf-16` | `[4, 1]` | Bone hollow | `loot-cache` | Old hunter's cache buried beneath roots |
| `nf-17` | `[5, 1]` | Bone hollow (**dead-end**) | `cutscene` | Ancient bones scattered in a circle |
| `nf-18` | `[5, -1]` | Mist ridge | `village` | Herb trader's hidden camp |
| `nf-19` | `[6, -1]` | Mist ridge | `encounter` | Territory of the shadow-wolf |
| `nf-20` | `[1, -2]` | Glen path | `loot-cache` | Woodcutter's forgotten axe head |
| `nf-21` | `[2, -2]` | Glen path (**dead-end**) | `cutscene` | Memorial cairn for a lost ranger |
| `nf-22` | `[6, 0]` | Mist ridge | `gathering` | Rare moonbell flowers in silver bloom |
| `nf-23` | `[7, 0]` | Mist ridge | `interaction` | Echo stone that repeats whispered words |
| `nf-24` | `[7, -1]` | Mist ridge (**loop**) | `rest` | Hidden grove with a natural spring |
| `nf-25` | `[8, -1]` | Mist ridge (**loop**) | `hazard` | Mist pools that confuse and disorient |

### Connection updates

Existing structure preserved (`nf-1` forks to `nf-2`/`nf-3`, rejoins at
`nf-6`, continues to `nf-10`). Nodes that gain new connections:
- `nf-3` adds `nf-12` (glen path branch entry)
- `nf-5` adds `nf-20` (glen path lower branch)
- `nf-6` adds `nf-15` (bone hollow branch entry)
- `nf-7` adds `nf-11` (mist ridge branch entry)
- `nf-8` adds `nf-18`
- `nf-9` adds `nf-22`

New nodes' connection patterns documented inline in the diff.

## Implementation units

### Unit 1 — Map structure: 15 new nodes + connection updates

**Files:**
- `src/World/Continents/Coastal-Village/maps.ts` `northernForest.nodes[]` array: append 15 new node entries per the layout table; update existing nodes' `connectedNodes` to include the new branches; `startingNode` stays at `nf-1`.

### Unit 2 — MapEventPool authoring for the 15 new nodes

**Files:**
- `src/World/MapEvents/content.ts`: 15 new `MapEventPool` consts authored following the existing pattern (one pool per node, single entry per pool — matches the current `nfCutscene` / `nfSpring` / etc. style). Per-node `alignmentDelta` where thematically appropriate (per Phase 43 convention). Register all 15 in the `NORTHERN_FOREST_POOLS` array.

Detail per pool:
- `nf-11 mossy-clearing`: rest with `healFraction: 0.75`, `alignmentDelta: { scope: 1 }` (nature's peace).
- `nf-12 dense-thicket`: encounter with `enemySlug: 'bristling-boar'` (existing enemy).
- `nf-13 berry-bushes`: gathering with description-only payload.
- `nf-14 stone-marker`: interaction (description-only beat).
- `nf-15 bramble-trap`: hazard, `damage: 1`, `alignmentDelta: { outlook: -1 }`.
- `nf-16 hunters-cache`: loot-cache, `currency: 10`.
- `nf-17 bone-circle`: cutscene with 2–3 lines of flavor, `alignmentDelta: { epistemology: -2, scope: -1 }` (ancient death).
- `nf-18 herb-trader`: village with small ware list (herbs, salves).
- `nf-19 shadow-wolf`: encounter with `enemySlug: 'shadow-wolf'` (existing enemy).
- `nf-20 axe-head`: loot-cache, `currency: 8`.
- `nf-21 ranger-cairn`: cutscene with 2 lines of flavor, `alignmentDelta: { outlook: -1, epistemology: 1 }`.
- `nf-22 moonbell-flowers`: gathering (description-only).
- `nf-23 echo-stone`: interaction (description-only beat), `alignmentDelta: { epistemology: 1 }`.
- `nf-24 hidden-grove`: rest with `healFraction: 1.0`, `alignmentDelta: { scope: 2 }`.
- `nf-25 mist-pools`: hazard, `damage: 2`, `alignmentDelta: { epistemology: -1 }`.

### Unit 3 — Hermetic e2e + docs

**Files:**
- `src/World/e2e/world.engine.test.ts` extend with 1–2 cases pinning the expanded shape: (1) `northernForest.nodes.length === 25`; (2) `northernForest.nodes.find(n => n.id === 'nf-17')!.connectedNodes` is `['nf-16']` (dead-end shape); (3) `nf-3.connectedNodes` includes both the spine continuation AND the glen path branch. Optionally drive a `resolveMapEvent` against `nf-18` (village pool) and assert the village payload surfaces.
- `docs/world.md` gains a brief subsection mentioning the 25-node expanded shape + the 3 sub-areas.
- `CHANGELOG.md` `[unreleased]` `### Changed` gains a Phase 117 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — Preserve the existing 10-node structure verbatim.** `nf-1` through `nf-10` keep their existing `connectedNodes` to their immediate neighbors (just extending each with the new branch IDs as appropriate). All existing Phase 24 MapEventPool overrides + Phase 43 alignmentDelta authoring + Phase 62 flag-gated content stay live without edit.
- **D2 — CHANGELOG goes in `### Changed`, not `### Added`.** The map IS pre-existing; this phase expands it. Public-API surface unchanged (no new exports). Phase 117 is consumer-visible content scale, not surface scale.
- **D3 — No fixture refresh.** Public surface unchanged (no new exports from `src/index.ts`).
- **D4 — 25 nodes, not 30+.** Per the "~25 nodes" guidance, pick exactly 25 total (15 new + 10 existing). Future phases can densify within the same sub-areas if scope demands.
- **D5 — Reuse existing enemies only.** `nf-12` references bristling-boar; `nf-19` references shadow-wolf; both already authored in `enemy.library.ts`.
- **D6 — Material-id authoring is out of scope.** Where a gathering pool would benefit from a new material item, use description-only payloads if the canonical id doesn't exist.
- **D7 — Three commits.** Unit 1 (map structure) → Unit 2 (pool authoring) → Unit 3 (e2e + docs + CHANGELOG). Step 11 ship-row flip is the fourth.
- **D8 — `alignmentDelta` annotations on ~60% of new pools.** Don't over-annotate; mirror the existing density pattern. 9 of 15 new pools get alignmentDelta.
- **D9 — Three thematic sub-areas.** Glen Path (forest floor, earthier), Bone Hollow (ancient/death themes), Mist Ridge (elevated, mystical). Each sub-area gets 3–5 nodes with consistent theming.

## Verify gate

- `npm run type-check` — clean (no engine code change; just data additions).
- `npm test` — must stay green. Existing tests reference nf-1..nf-10 by id; the structure is preserved so those continue to pass. New e2e cases add ≥2 to the count.
- `npm run build` — clean.
- `npm run deploy:check` — clean (no public-surface change).

## Commit body templates

### Unit 1 commit

```
feat(world): Phase 117 unit 1 — northern-forest expansion (15 new nodes + branches)

- src/World/Continents/Coastal-Village/maps.ts northernForest.nodes[]
  grows from 10 to 25 entries. Existing nf-1..nf-10 structure preserved
  verbatim; their connectedNodes extend to add the new branch IDs
  where applicable per D1.
- New 15 nodes split into 3 sub-areas:
  - Glen Path (forest floor): nf-12..nf-14, nf-20..nf-21 (with nf-21 dead-end)
  - Bone Hollow (ancient themes): nf-15..nf-17 (with nf-17 dead-end)
  - Mist Ridge (elevated mystical): nf-11, nf-18..nf-19, nf-22..nf-25 (with nf-24↔nf-25 loop)
- 2 dead-ends + 1 small loop per the layout table in the brief.
- No MapEventPool authoring this commit — Unit 2 follows.

Decision D4 — 25 nodes exactly (15 new + 10 existing); future
phases densify if scope demands.
```

### Unit 2 commit

```
feat(content): Phase 117 unit 2 — MapEventPool entries for 15 new nodes

15 new pool consts added to src/World/MapEvents/content.ts following
the existing single-entry-per-pool pattern; all 15 registered in
NORTHERN_FOREST_POOLS.

Per-kind distribution (15 new): 2 village, 2 interaction, 3 rest, 2
gathering, 2 encounter, 2 loot-cache, 2 cutscene, 2 hazard. Combined
with existing 10 (covers all 8 MapEventKind values), the 25-node map
has comprehensive event type coverage.

Notable placements per D5 (reuse existing enemies):
- nf-12 dense-thicket: encounter w/ bristling-boar (existing)
- nf-19 shadow-wolf: encounter w/ shadow-wolf (existing)

alignmentDelta annotations on 9 pools per D8 (60% density mirroring
Phase 43's pattern).
```

### Unit 3 commit

```
test(world,changelog): Phase 117 unit 3 — e2e + docs + CHANGELOG

- src/World/e2e/world.engine.test.ts extended with Phase 117 cases
  pinning the 25-node shape, the dead-end at nf-17, and the
  branching at nf-3.
- docs/world.md gains a Phase 117 subsection describing the 3
  sub-areas + the 2 dead-ends + the 1 loop.
- CHANGELOG.md [unreleased] ### Changed gains a Phase 117 bullet per
  D2 (content scale, not surface scale).
```

## Definition of Done

- [ ] `northernForest.nodes.length === 25` (15 new + 10 existing).
- [ ] Existing nf-1..nf-10 connectedNodes extended (not replaced) with branch IDs.
- [ ] 15 new MapEventPool consts authored + registered in `NORTHERN_FOREST_POOLS`.
- [ ] e2e covers the new shape (length, dead-ends, branching).
- [ ] `docs/world.md` Phase 117 subsection.
- [ ] CHANGELOG.md [unreleased] ### Changed Phase 117 bullet.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 117 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **Per-sub-area NPC authoring.** The expansion makes room for ~2–3 new NPCs across the sub-areas; future content phase can fill them.
- **New material item authoring** (forest herbs, rare minerals) for the gathering pools that currently ship description-only payloads per D6.
- **Coastal-village pattern generalization.** With both fishing-village (Phase 65) and northern-forest expanded, the per-map expansion pattern is established for future continent work.
- **Balance tuning phases.** Similar to fishing-village's future balancing work, the expanded northern-forest can be retuned per sub-area in future phases.

## Canonical sibling

`plan/phases/phase_65_fishing_village_expansion.md` is the direct template — Phase 117 mirrors its structure, commit units, and DoD approach exactly. `src/World/MapEvents/content.ts` existing `nf-*` pools and `src/World/Continents/Coastal-Village/maps.ts` current `northernForest` are the code patterns to extend.