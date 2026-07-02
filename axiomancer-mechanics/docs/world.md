# World

> **Status:** Spec 08 + Spec 23 + Phase 25 landed — `moveToNode`,
> `resolveMapEvent`, branching dialogue, a per-objective quest engine, the
> continent-keyed map registry, and the hazard tick on movement are all
> live. Fishing-village ships with a demo chain (NPC quest-giver → village →
> encounter → loot-cache → boss) that exercises the loop end-to-end. The
> legacy `processNode` + `MapEvent`/`MapEventType` surface was removed in
> Phase 25; node events are now authored via weighted pools (see
> `src/World/MapEvents/content.ts`).

## State Shape

The world layer splits the **static** map template from **runtime** progress.

```ts
// Frozen template — lives in the map registry. Authoring file.
interface MapDefinition {
  name; continent; description;
  startingNode: MapNode;
  nodes: readonly MapNode[];
  npcs?; enemies?; uniqueEvents?;
  quests?: readonly Quest[];
}

// Runtime per-save state — sits under WorldState.currentMap.
interface MapState {
  name; continent;
  currentNode: NodeId;           // Spec 08 Q1: per-map position.
  completedNodes; availableNodes; lockedNodes;
  uniqueEvents: UniqueEvent[];   // mutable runtime copy
}
```

`WorldState` aggregates the navigation context:

```ts
interface WorldState {
  world: Continent[];           // catalogue
  currentContinent: Continent;
  currentMap: MapState;         // runtime state — lookup template via getMapDefinition()
}
```

### Removed aliases (historical)

`WorldMap` and `Map` were `@deprecated` type aliases for `MapState`.
The internal-only `Map` alias was dropped at iterate `63bfbbe`; the
public-barrel `WorldMap` alias was authorized for removal by oversight
on 2026-05-15 and dropped at the iterate pass that authored this
update — see `plan/AUDIT.md` Done. Migrate to `MapState` (runtime
progress) and `MapDefinition` (static template lookup via
`getMapDefinition`).

`GameState` is the root for the whole save, and carries the quest log and
world flags so dialogue / quest progression can persist:

```ts
interface GameState {
  version; player; world; combat;
  quests: QuestLog;             // per-objective tracking
  flags: string[];              // dialogue + quest flag gates
}
```

## Map Registry (Spec 08 Q6)

`src/World/map.registry.ts`:

- `MAP_REGISTRY` — `Record<ContinentName, Partial<Record<MapName, MapDefinition>>>`.
- `getMapDefinition(continent, mapName)` — returns the static template. Throws
  `MapNotFoundError` for unknown pairs.
- `createMapState(def)` — builds the initial runtime `MapState` from a
  definition: starting node populated, neighbours enter `availableNodes`,
  everything else enters `lockedNodes`.

Adding a continent or map is a one-file change to the registry plus the
authoring file under `src/World/Continents/<Name>/maps.ts`.

## Movement (Spec 08 Q2 — linear with completed-lock)

`moveToNode(state, nodeId): WorldState`

Validation:

1. The destination must be a real node on the current map.
2. The destination must be in the current node's `connectedNodes` (linear).
3. **Completed nodes are locked from re-entry — no back-travel.**
4. The destination must not be in `lockedNodes`.

`completeCurrentNode(state)` marks the current node completed and unlocks
its neighbours. Both reducers are pure.

`IllegalMoveError` is thrown for any invalid move.

## Hazard Tick on Movement (Spec 08 Q3, Q4)

Each `moveToNode` should be paired with a player tick. Spec 08 keeps the
world reducer pure (`moveToNode` only touches `WorldState`) and exposes the
player-side helpers under `Effects/`:

- `processWorldEffectTick(player) → { player, healed, damage, expired }` —
  applies regen, drain, and DoT, then ticks duration / drops expired effects.
  One world-step per call.
- `getActiveHazards(player) → ActiveHazard[]` — UI-facing list of hazards
  currently dealing world-step damage. The HUD renders these (engine only
  exposes the data — Q4).

## Node Event Dispatcher

The current dispatcher is `resolveMapEvent(state, rng?)` from
`src/World/MapEvents/resolve-map-event.ts`, shipped in Spec 23 and
populated with content in Phase 24. It returns `{ state, event }`
where `event` is a discriminated union over the ten `MapEventKind`
values ('quest' joined the original eight in Phase 137; 'narration' joined in 2026-06):

| Event kind     | Result shape                                                              |
|----------------|---------------------------------------------------------------------------|
| `encounter`    | `{ kind: 'encounter', encounter, isBoss }` — caller invokes `startCombat`. |
| `interaction`  | `{ kind: 'interaction', npcName, dialogue? }` — branching tree.           |
| `gathering`    | `{ kind: 'gathering', items }` — items added to inventory.                |
| `rest`         | `{ kind: 'rest', healed, healFraction }` — heals by `healFraction × maxHealth`; the fraction rides along for hosts that replace the passive heal with the Night Watch minigame. |
| `village`      | `{ kind: 'village', villageName, merchants, shop? }` — settlement scene.  |
| `cutscene`     | `{ kind: 'cutscene', lines }` — narration only.                           |
| `hazard`       | `{ kind: 'hazard', effects, damage }` — applies effects + damage.         |
| `loot-cache`   | `{ kind: 'loot-cache', items, currency }` — fixed grant.                  |
| `quest`        | `{ kind: 'quest', boardId }` — hands the host a Quest Board id (`World/QuestBoard`); the host starts the board-game minigame. |
| `narration`    | `{ kind: 'narration', dialogue }` — inline monologue; the `DialogueTree` is authored directly on the node (no map NPC lookup). Barrel: `NarrationPayload`. |
| `none`         | Consumed node (one-shot) or no pool registered.                            |

Note (Phase 137): the engine handlers above remain the CLI map loop's
behaviour. The mobile host intercepts `rest` / `gathering` / `loot-cache` /
`hazard` / `quest` results and launches the dedicated minigames instead
(`World/Rest` "The Night Watch", `World/Gathering` "The Gleaning",
`World/LootCache` "The Reliquary", `World/Hazard`, `World/QuestBoard`
"The Boy's Almanac").

Standalone CLI play loops (Phase 160b / 160c): the pure minigame engines are
also driveable directly from the Node host as game-CLI subcommands —
`npm run gathering`, `npm run hazard`, `npm run rest` (The Night Watch),
`npm run loot-cache` (The Reliquary), and `npm run quest-board` (The Boy's
Almanac — `--policy safe|gambler|economist`, `--board <id>`, charms / vows /
bone rolls / nine space kinds / dusk). Each shares the `src/CLI/io.ts` layer
(`--script` JSON / `--stdin` / `--json-events` / `--state-log`) and an
`--auto` policy that reuses the matching `*.sim.ts` bot, so a person, a
replay file, or an agent all drive them through one surface. The hazard
harness additionally injects a custom draw bag: `--deck <id,id,…>` appends
acquired cards to the starter bag, while `--bag-file <path>` (a JSON array
of card ids) replaces the whole bag for deterministic A/B runs; both
validate ids against `HAZARD_DECK`. With the QuestBoard loop landed
(Phase 160c), every Phase 137 minigame engine now has a Node play loop.

Hazard events now have accepted v0 minigame doctrine in
[`docs/hazard-minigame.md`](./hazard-minigame.md): top/bottom route choice,
4 persistent mana dice, 5-card action hands, persistent enchantments,
`O - X` scoring, and the first 30 action / 15 hazard card content set. The
current `ResolvedEvent.kind === 'hazard'` payload remains the shipped simple
effects/damage surface until that doctrine is implemented.

The dispatcher reveals adjacent nodes on consumption (fog-of-war) and
marks the active node consumed so subsequent visits no-op.

### Legacy `processNode` (removed in Phase 25)

The pre-Spec-23 dispatcher and its 9-kind taxonomy
(`MapEvent` / `MapEventType` / the `nodeEvents` field on
`MapDefinition`) were removed in Phase 25 (commit reference in
`plan/AUDIT.md` Done block). All node events now flow through
`resolveMapEvent` + the per-node pool overrides registered in
`src/World/MapEvents/content.ts`. The folded `npc` / `shop` kinds
map to `interaction` / `village` in the new taxonomy.

Quest auto-progression: `reachableObjectives(log, nodeId)` is
available for any future dispatcher that wants to auto-advance
`reach`-type objectives on arrival; `resolveMapEvent` does not call
it today (it's a noted follow-up — track in `plan/AUDIT.md`).

## Quest Engine (Spec 08 Q7B — per-objective)

`src/World/quest.engine.ts`:

| Function | Purpose |
|----------|---------|
| `emptyQuestLog()` | `{ available: [], active: [], completed: [] }` seed. |
| `discoverQuest(log, quest)` | Adds to `available` if not present. |
| `startQuest(log, quest)` | Moves quest from `available` into `active`. Idempotent. |
| `progressQuest(log, name, objectiveId, amount?)` | Advances one objective; auto-completes the quest when every objective is filled. |
| `completeQuest(log, name)` | Explicit completion. |
| `isQuestComplete(quest)` | True when every objective is at `requiredCount`. |
| `reachableObjectives(log, nodeId)` | Active `reach`-objectives that fire on this node. |
| `killObjectives(log, enemyName)` | Active `kill`-objectives matching this enemy's name. |

Objective types: `'kill' | 'collect' | 'reach' | 'talk' | 'flag'`.

The store's `endCombat` auto-advances `kill` objectives — defeating an
enemy whose `name` matches an active objective's `target` ticks the counter
and grants the reward when the quest fills.

## Dialogue (Spec 08 Q9 — branching tree)

NPCs carry a `DialogueTree`:

```ts
interface DialogueTree {
  rootId: string;
  nodes: Record<string, DialogueNode>;
}
```

Each `DialogueNode` has `text` and optional `choices`. A `DialogueChoice`
can:

- Lead to another node (`nextNodeId`), or end the conversation (`undefined`).
- Be hidden until a gate passes (`requires.quest`, `requires.flag`,
  `requires.questCompleted`).
- Fire a side effect when picked (`effect.startQuest`, `progressQuest`,
  `completeQuest`, `teachSkill`, `setFlag`, `grantCurrency`).

`applyDialogueChoice(gameState, tree, choice) → { gameState, nextNode, effects }`
applies the side effect, advances the cursor, and returns the next node
(or `null` if the conversation ends).

`NPCs/dialogue.ts` carries the read-only helpers (`getDialogueNode`,
`visibleChoices`, `isLeafNode`) for UI traversal.

The legacy flat `DialogueMap` is still supported on the `NPC` interface.

## Currency (Spec 08 Q8)

`Character.currency: number` exists; shop reducers are deferred to a later
spec. Rewards (`{ kind: 'currency', amount }`) increment this directly.

## Demo Content (fishing-village)

`src/World/Continents/Coastal-Village/maps.ts` ships the canonical
"base" starting map. **As of Phase 65** it's a 25-node branching grid
with three sub-areas; the linear 10-node spine `fv-1` → `fv-10` along
`y=0` is preserved so existing Phase 23/24 MapEventPool overrides +
Phase 43 alignmentDelta authoring + Phase 62 flag-gated dialogue +
Phase 63 observer wiring all continue to work without modification.

### Spine (`y=0`, pre-Phase-65)

```
fv-1 (start, dock cutscene)
  → fv-2 (interaction: Old Marrow, quest-giver — branching tree)
  → fv-3 (village: Fishing Village Stalls — Tide-Shopkeeper)
  → fv-4 (encounter: wet-hound)
  → fv-5 (loot-cache, +10 currency)
  → fv-6 (encounter-boss: The Coastal Tyrant)
  → fv-7 (interaction: Coastal Beggar)
  → fv-8 (gathering: driftwood)
  → fv-9 (rest: campfire)
  → fv-10 (hazard: barnacles)
```

The starting quest's objective is `kill The Coastal Tyrant`;
defeating the boss auto-completes the quest and grants the
25-currency reward.

### Sub-areas (Phase 65)

**Harbor district** (`y=+1..+2`, entered from fv-1 / fv-2 / fv-3):
- fv-11 fishmonger row (village — Net-Mender Joss + small shop).
- fv-12 ferry slip (cutscene — empty slip; absent ferrier).
- fv-13 quayside chapel (rest, half-heal).
- fv-14 tide pools (gathering — tide-shell).
- fv-15 gull crag (encounter — Mournful Gull, Phase 60 befriendable;
  **dead-end** via fv-14).

**Inland streets** (`y=-1..-2`, entered from fv-3 / fv-4 / fv-5):
- fv-16 town well (rest, three-quarter heal).
- fv-17 smokehouse (gathering — salt-fish).
- fv-18 back alley (encounter — Hollow-Eyed Beggar, Phase 60
  befriendable).
- fv-19 abandoned shack (loot-cache, +8 currency).
- fv-20 old shrine (cutscene — kept offerings to a half-forgotten
  sea-god). **Small loop**: fv-17 ↔ fv-19; fv-20 cul-de-sac off
  fv-19.

**Cliff path / headlands** (`y=+1..+2` east, entered from fv-7 / fv-8):
- fv-21 gull-tossed steps (cutscene — returning fisherman).
- fv-22 sea-stack (loot-cache, +12 currency).
- fv-23 lighthouse ruin (cutscene — the lamp room open to sky).
- fv-24 keeper's cottage (rest, full heal).
- fv-25 gull's nest (hazard — fledglings; **dead-end** via fv-24).

All 8 `MapEventKind` values are represented multiple times across the
25 nodes (5 cutscene / 2 village / 2 interaction / 3 gathering / 4
encounter / 3 loot-cache / 4 rest / 2 hazard).

`northern-forest` expanded from a 10-node branching pattern to a
25-node multi-area layout in **Phase 117**. The original fork-and-rejoin
structure (nf-1 splits to nf-2/nf-3, rejoins at nf-6) is preserved,
with three new sub-areas: Glen Path (forest floor), Bone Hollow
(ancient themes), and Mist Ridge (elevated mystical). Features 2
dead-ends (nf-17, nf-21) and 1 small loop (nf-24 ↔ nf-25).

## Bootstrap

`src/World/index.ts`:

- `createStartingWorld()` — initial `WorldState`. Coastal Continent with
  `fishing-village` available and `northern-forest` locked.
- `MAP_REGISTRY`, `getMapDefinition`, `createMapState`.
- `MapNotFoundError` — thrown when the registry lookup fails.

## MapEvents (Spec 23)

Phase 23 introduced the **MapEvents** node-event surface. Phase 25
removed the bespoke `processNode` predecessor; MapEvents is now the
only node-event dispatcher.

- **Taxonomy.** Eight kinds: `encounter`, `interaction`, `gathering`,
  `rest`, `village`, `cutscene`, `hazard`, `loot-cache`. The old
  `npc`/`shop` kinds are folded into `interaction` and `village`.
- **Pool authoring.** Events are not authored per node; they're rolled
  from a **weighted pool** at the moment a node is entered. Pools live
  in `MapEventPool` records registered via `registerMapEventPool` and
  attached to a map via `setDefaultMapEventPool` (region default) or
  `setNodeEventPoolOverride` (per-node override).
- **Discovery (fog-of-war).** `MapState.discoveredNodes` is seeded with
  the map's starting node; `resolveMapEvent` calls `revealAdjacent`
  after consuming a node, so the next ring of nodes only becomes
  visible once the player has cleared the current one.
- **Unlocked traversal.** After Phase 31 (`711b49e`), `resolveMapEvent`
  also calls `unlockAdjacent` — the reducer that moves
  `connectedNodes` from `MapState.lockedNodes` into
  `MapState.availableNodes`. Discovery shifts the fog; unlocking is
  what lets the CLI's Map tab actually offer the next ring as
  navigable targets. The two pass-through reducers are composed at
  every `resolveMapEvent` exit path
  (`src/World/MapEvents/resolve-map-event.ts`).
- **One-shot consumption.** `MapState.consumedNodes` records every
  node whose MapEvent has resolved. Re-entering a consumed node
  returns `{ kind: 'none' }` — the player can still walk through, but
  the event won't re-fire.
- **Philosophical alignment shifts (Phase 43).** Each
  `MapEventPoolEntry` may carry an optional
  `alignmentDelta?: Partial<PhilosophicalAlignment>`. When the entry
  is rolled, `resolveMapEvent` threads the delta through
  `applyAlignmentDelta(state.philosophicalAlignment, delta)` after
  the matching handler runs, surfacing the shift on
  `ResolveMapEventResult.effects.philosophicalShift`. Conventional
  authoring band is ±1..±5 per axis; the helper clamps each axis to
  `[-100, +100]`. See [`docs/philosophy.md`](./philosophy.md)
  "Authoring deltas (Phase 43)" for the per-axis semantics + the
  first-pass authored deltas on Coastal-Village + Old Marrow maps.
- **RNG plumbing.** `resolveMapEvent(state, rng?)` accepts a seeded
  RNG (defaults to `getRng().random()`). Tests inject deterministic
  RNGs via `mockSequentialRng` / `mockFixedRng`.
- **Migration.** Spec 23 shipped `resolveMapEvent` alongside the
  existing `processNode`. Phase 24 (commit `4b12e27`) migrated the
  `fishing-village` + `northern-forest` content into per-node pool
  overrides — see `src/World/MapEvents/content.ts` for the 20-node
  authoring map. Phase 25 removed the legacy `processNode` surface,
  the `MapEvent` / `MapEventType` types, and the `nodeEvents` /
  `availableEvents` fields on `MapDefinition`.
- **Source of truth (Phase 161).** `content.ts` is the engine's single
  authored source for map-event content; it registers through one
  idempotent `registerMapEventContent()` (self-invoked on import).
  Node overrides are **last-write-wins**, so two blocks authoring the
  same `continent:map:node` silently diverge. `fishing-village` had
  exactly that: a rich legacy block (Phase 23/24/65/115 — shops,
  shrines, ferry slips) that the 2026-06 "new-player" override block
  clobbered at module load, so the legacy `village`/`cutscene`/
  `interaction` pools could never fire even via the CLI. Phase 161
  removed the dead legacy fishing-village block — the **new-player
  layout is the canonical fishing-village map** (combat-focused:
  encounters + rest/gather/hazard + the fv-15 quest hook + the pinned
  fv-6 boss). `northern-forest` is unshadowed and stays live; it carries
  the `village`/`cutscene`/`interaction`/`loot-cache` kinds
  fishing-village no longer authors, so the all-8-`MapEventKind`
  invariant still holds. A no-shadow guard
  (`getShadowedNodeOverrideKeys()` +
  `src/World/MapEvents/e2e/content-parity.engine.test.ts`) fails the
  build if any node is ever authored twice again. The separate mobile
  host registering its own per-node overrides is a cross-repo concern
  tracked in mobile's NEEDS_ATTENTION — out of scope for the engine.

- **Node-event-kind read API.** Three pure helpers expose which
  `MapEventKind`s a given node can fire **without** resolving (or
  consuming) an event — useful for client previews and tuning evidence:
  - `getNodeEventPool(continent, mapName, nodeId)` — the resolved
    `MapEventPool` for that node (node override first, else the region
    default), or `undefined` if none is registered.
  - `getNodeEventKinds(continent, mapName, nodeId)` — the distinct
    `MapEventKind[]` the node's pool can roll.
  - `getNodePrimaryEventKind(continent, mapName, nodeId)` — the
    highest-weight kind, or `undefined` for an empty/unregistered pool.

See `specs/23-map-events.md` for the spec and
`src/World/MapEvents/e2e/map-events.engine.test.ts` for the hermetic
walkthrough covering all eight kinds.

## Gathering Balance Simulation (Phase 147)

The gathering minigame includes comprehensive Monte-Carlo simulation infrastructure for balance testing and tuning analysis:

### Policy Bots

Five scripted bots with distinct strategies drive the gathering engine through complete sessions:

- **`timid`** — Restraint baseline: gleans, pays offerings, takes only cheap plots, leaves early
- **`balanced`** — Skilled push-your-luck: reads wrath costs, never despoils, extracts maximum yield
- **`greedy`** — Eruption baseline: strips, takes richest plots, never pays, never leaves voluntarily  
- **`wrath-pusher`** — Controlled aggression: pushes wrath to 5-6 range through careful management
- **`communion-chaser`** — Ultra-conservative: prioritizes early withdrawal over material gain

### Balance Testing

`runGatheringSim(options)` executes Monte-Carlo runs with any policy across all gathering sites or pinned to a specific site. Returns structured metrics: eruption rate, communion rate, average richness kept, turn counts, outcome distribution.

`runGatheringABTest(configA, configB, runs)` compares two tuning configurations via parallel simulation runs, measuring significance of differences in key metrics.

`generateGatheringBalanceReport(runs)` produces a comprehensive balance report with policy comparisons, balance band verification, and tuning recommendations formatted as JSON for Phase 148 harness consumption.

### Usage

```ts
// Test a single policy
const results = runGatheringSim({ runs: 400, policy: 'balanced' });

// Compare two configs  
const abTest = runGatheringABTest(configA, configB, 200);

// Generate comprehensive report
const report = generateGatheringBalanceReport(400);
```

Balance bands are verified in `src/World/Gathering/e2e/gathering.balance.sim.test.ts` to ensure tuning changes don't break the incentive gradient where **blind greed < timid restraint < skilled push-your-luck**.

## Rest & Loot-Cache Balance Simulation (Phase 160)

The remaining Phase 137 minigames each gained a deterministic policy-bot sim
(`rest.sim.ts`, `lootcache.sim.ts`), mirroring the gathering/hazard pattern.
Together with `quest-board.sim.ts` this gives every minigame a real sim for the
`rest-tuning` / `loot-cache-tuning` skills to drive.

### Rest ("The Night Watch") — `rest.sim.ts`

Rest is the gentle minigame: a night can be MEAGRE but never lethal, so the
bands encode a heal-RICHNESS gradient, not a risk-of-ruin axis. Three posture
bots: **`watcher`** (leanest heal, safest, finds the most keepsakes) <
**`deep-sleeper`** (rich baseHeal, pays for stirs unwatched) <
**`fire-tender`** (banks warmth into heal *and* the cleanse line — the skilled
take). `runRestSim(options)` and `generateRestBalanceReport(runs)` return
heal-fraction / tier-rate / cleanse-rate / keepsake metrics. Bands verified in
`src/World/Rest/e2e/rest.balance.sim.test.ts`.

### Loot-Cache ("The Reliquary") — `lootcache.sim.ts`

Push-your-luck on hidden information: deeper layers are richer AND likelier
trapped, and one probe buys perfect information. Three bots: **`greedy`**
(always delve — richest raw take but most bitten, stung two caches in three),
**`prudent`** (lid then seal — the unbitten floor), **`prober`** (saves its
probe for the deadliest deepest layer). The sim surfaced a real balance note:
with a single probe and the richest layer also the deadliest, the prober matches
greedy on RAW currency but wins decisively on **risk-adjusted value** (same loot,
roughly half the bites). The report exposes both a `currencyGradient` and a
`riskAdjusted` gradient (`avgCurrency − LOOT_CACHE_BITE_PENALTY × avgBitten`) so
the tuning skill can judge the probe's worth. Bands verified in
`src/World/LootCache/e2e/lootcache.balance.sim.test.ts`.

## See Also

- [`specs/08-world-content-and-hazards.md`](../specs/08-world-content-and-hazards.md)
- [`specs/23-map-events.md`](../specs/23-map-events.md)
- [`docs/npcs.md`](./npcs.md) — branching dialogue UI conventions.
- [`docs/effects.md`](./effects.md) — `processWorldEffectTick` integration with
  the broader effects engine.
