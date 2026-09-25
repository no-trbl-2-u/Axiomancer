# Phase 8 — Northern Forest quest content (rescoped)

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document judgment calls in the commit body.

## Scope correction — verified in code before writing this brief

The build-plan row reads "Northern Forest region content extension
(apply the fishing-village 10->25-node expansion pattern to the
mid-game gate)". That work **already shipped** before the nexus
build plan was authored: `northernForest` in
`axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts`
already has 25 nodes (`nf-1`..`nf-25`, three sub-areas: Mist Ridge,
Glen Path, Bone Hollow) and every node has an authored
`MapEventPool` in `World/MapEvents/content.ts` (the "Phase 117
northern-forest expansion pools" block) — this predates
`chore: adopt nexus methodology` (`d300fdcb`, the commit that first
wrote this build-plan row) via the original subtree import
(`42f91acd`). `continents.engine.test.ts` already asserts the
expanded structure. There is no node-graph work left to ship here.

The real, verified gap: `quest.library.ts`'s `QuestName` union
declares `FishingVillageQuests = 'starting-quest' | 'get-to-forest'`
and `NorthernForestQuests = 'gather-wood' | 'get-to-cave'`, but only
`starting-quest` has ever been authored as a `Quest` object
(`fishingVillage.quests`). `get-to-forest`, `gather-wood`, and
`get-to-cave` are declared types with **zero** runtime content —
`northernForest.quests` is `[]`. Mobile's dev-only
`DebugQuestState.tsx` even carries a hand-rolled synthetic
`gather-wood` stand-in with a comment noting it should be swapped
"if the engine later ships a `questLibrary`." This phase ships that
content, which is the genuine "Northern Forest content extension"
still outstanding. **Mechanics only.**

A second, smaller gap surfaces while authoring `gather-wood`: the
engine's `QuestObjectiveType` union has included `'collect'` since
Spec 08, and `resolveGathering` grants inventory items on gathering
nodes, but nothing ever connects the two — there is no
`collectObjectives` helper (the `kill`/`reach` types both have one:
`killObjectives`, `reachableObjectives`) and `resolveMapEvent` never
advances a `collect` objective when a gathering payload resolves. A
`gather-wood` quest would be unwinnable without this wiring. This
phase adds the missing symmetric case — no redesign, just the same
pattern `reach` already has, applied to the objective type that was
declared but never wired.

## Current state (verified in code)

- `axiomancer-mechanics/src/World/quest.engine.ts` has
  `killObjectives(log, enemySlug)` and
  `reachableObjectives(log, nodeId)`, each returning
  `{questName, objectiveId}[]` for active objectives of that type
  matching the target. No `collectObjectives`.
- `axiomancer-mechanics/src/World/MapEvents/resolve-map-event.ts`
  calls `advanceReachObjectives` (private helper) before the pool
  roll. No equivalent post-gathering hook exists.
- `axiomancer-mechanics/src/World/MapEvents/handlers.ts`
  `resolveGathering` clones `payload.items` into
  `player.inventory` and returns `event: { kind: 'gathering', items
  }` — the resolved item list is available on the handler result,
  ready to feed a collect-objective check.
- `axiomancer-mechanics/src/World/dialogue.runtime.ts`
  `applyDialogueChoice` is the **only** place a `Quest` object moves
  from a `MapDefinition.quests` array into the player's `QuestLog`
  (via `effect.startQuest`, looked up against the current map's
  `def.quests`). Any new quest must be both listed on its map's
  `.quests` array and granted through an NPC dialogue choice.
- `oak-branch` (the `nfWoodGather` pool at node `nf-2`) is the only
  gatherable item currently authored on `northern-forest` — it is
  the natural `collect` target for `gather-wood`.
- `nf-10` (`nfCaveMouth`, "a cave mouth yawns in the cliff face")
  is the forest's dead-end/gate node — the natural `reach` target
  for `get-to-cave`.
- `northernForest.startingNode.id` is `nf-1` — the natural `reach`
  target for fishing-village's `get-to-forest`.
- Reward granting on **auto**-completion only exists on the `kill`
  path today (`game.reducer.ts` grants `q.reward` when
  `killObjectives` completes a quest during combat resolution).
  `advanceReachObjectives` in `resolve-map-event.ts` discards
  `progressQuest`'s `completedName` — reach-triggered auto-complete
  grants no reward. This is pre-existing behavior, not introduced by
  this phase; `collectObjectives` wiring below matches it exactly
  (also no reward-on-complete) rather than silently fixing a
  different quest type's gap out of scope. Noted under Follow-ups.

## Outputs

```
axiomancer-mechanics/src/World/quest.engine.ts
  collectObjectives(log, itemId): {questName, objectiveId}[]  — new,
  mirrors killObjectives/reachableObjectives exactly.

axiomancer-mechanics/src/World/MapEvents/resolve-map-event.ts
  advanceCollectObjectives(quests, itemIds): QuestLog  — new private
  helper, mirrors advanceReachObjectives. Invoked after applyPayload
  when the resolved event is kind 'gathering', using the granted
  items' ids.

axiomancer-mechanics/src/World/index.ts
axiomancer-mechanics/src/index.ts
  export collectObjectives alongside the existing killObjectives /
  reachableObjectives exports.

axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts
  + getToForestQuest: Quest        (fishing-village, reach nf-1)
  fishingVillage.quests: [startingQuest, getToForestQuest]
  + gatherWoodQuest: Quest         (northern-forest, collect oak-branch x3)
  + getToCaveQuest: Quest          (northern-forest, reach nf-10)
  northernForest.quests: [gatherWoodQuest, getToCaveQuest]

axiomancer-mechanics/src/World/Continents/Coastal-Village/npcs.ts
  oldDockmasterTree.nodes.thanks.choices: + 1 choice (appended last),
  gated on questCompleted: 'starting-quest', effect startQuest
  'get-to-forest'.

axiomancer-mechanics/src/World/Continents/Northern-Forest/npcs.ts
  hermitSageTree.nodes.greet.choices: + 1 choice (appended last),
  effect startQuest 'gather-wood'.
  forestRangerTree.nodes.greet.choices: + 1 choice (appended last),
  effect startQuest 'get-to-cave'.

axiomancer-mechanics/src/World/MapEvents/e2e/map-events.engine.test.ts
  + 'resolveMapEvent — collect-objective auto-advance' describe
  block, mirrors the existing reach-objective block.

axiomancer-mechanics/src/World/Continents/e2e/continents.engine.test.ts
  extended quest-count / quest-shape assertions + new dialogue-choice
  effect assertions for the three new quest grants.
```

## Output schema (locked)

```ts
// quest.engine.ts — new, mirrors killObjectives/reachableObjectives
export function collectObjectives(log: QuestLog, itemId: string): Array<{
    questName: QuestName;
    objectiveId: string;
}> {
    const out: Array<{ questName: QuestName; objectiveId: string }> = [];
    for (const q of log.active) {
        for (const o of q.objectives) {
            if (o.type === 'collect' && o.target === itemId && o.currentCount < o.requiredCount) {
                out.push({ questName: q.name, objectiveId: o.id });
            }
        }
    }
    return out;
}
```

```ts
// resolve-map-event.ts — mirrors advanceReachObjectives; called after
// applyPayload, only when the resolved event is a gathering event.
function advanceCollectObjectives(quests: QuestLog, itemIds: string[]): QuestLog {
    let log = quests;
    for (const itemId of itemIds) {
        for (const c of collectObjectives(log, itemId)) {
            log = progressQuest(log, c.questName, c.objectiveId).log;
        }
    }
    return log;
}
```

Wired into `resolveMapEvent` right after `const result =
applyPayload(...)`:

```ts
const stateAfterCollect: GameState = result.event.kind === 'gathering'
    ? { ...result.state, quests: advanceCollectObjectives(result.state.quests, result.event.items.map(i => i.id)) }
    : result.state;
```

`stateAfterCollect` replaces `result.state` in every downstream read
(the `entry.alignmentDelta` branch, the reveal/unlock/consume tail).

Quest content (map.ts additions; `Quest`/`QuestObjective` shapes are
unchanged, existing types):

```ts
const getToForestQuest: Quest = {
    name: 'get-to-forest',
    description: 'Leave the village and walk the coast road north into the forest.',
    mapName: 'fishing-village',
    status: 'available',
    objectives: [{
        id: 'reach-forest', type: 'reach',
        description: 'Reach the northern forest.',
        target: 'nf-1', requiredCount: 1, currentCount: 0,
    }],
    reward: { kind: 'experience', amount: 30 },
};

const gatherWoodQuest: Quest = {
    name: 'gather-wood', mapName: 'northern-forest', status: 'available',
    description: 'Gather three bundles of oak branches for the Hermit Sage\'s hearth.',
    objectives: [{
        id: 'collect-oak-branch', type: 'collect',
        description: 'Collect 3 oak branches.',
        target: 'oak-branch', requiredCount: 3, currentCount: 0,
    }],
    reward: { kind: 'currency', amount: 20 },
};

const getToCaveQuest: Quest = {
    name: 'get-to-cave', mapName: 'northern-forest', status: 'available',
    description: "Follow the Forest Ranger's directions to the cave at the forest's edge.",
    objectives: [{
        id: 'reach-cave', type: 'reach',
        description: "Reach the cave mouth.",
        target: 'nf-10', requiredCount: 1, currentCount: 0,
    }],
    reward: { kind: 'experience', amount: 40 },
};
```

## Composition — dialogue wiring

- **Old Marrow** (`thanks` node, fishing-village): append a 4th
  choice after the existing three reward-taking choices (all
  `nextNodeId: undefined` today) — `"Where should I head, now that's
  done?"`, gated `requires: { questCompleted: 'starting-quest' }`,
  `nextNodeId: 'next_steps'`, `effect: { startQuest: 'get-to-forest'
  }`. New terminal node `next_steps`: Old Marrow points the player
  north to the forest. Placed last per this file's own
  index-stability convention (Phase 46/62/63 comments) — no existing
  choice indices shift.
- **Hermit Sage** (`greet` node, northern-forest): append a 4th
  choice — `"Is there anything you need, out here alone?"`,
  `nextNodeId: 'hermit_firewood'`, `effect: { startQuest:
  'gather-wood' }`. New terminal node: the sage admits the hearth
  runs cold without help gathering wood.
- **Forest Ranger** (`greet` node, northern-forest): append a 4th
  choice — `"What's past the tree line?"`, `nextNodeId:
  'ranger_cave_directions'`, `effect: { startQuest: 'get-to-cave' }`.
  New terminal node: the Ranger warns of the cave mouth at the far
  edge and marks the safe path.

No existing choice text, `nextNodeId`, `requires`, or index shifts —
every addition is a new choice appended at the end of an existing
`choices` array plus a new terminal node. `continents.engine.test.ts`
has no `toHaveLength` assertion on any northern-forest NPC's choice
array (verified), so this is safe.

## Cross-links

**In** (already shipped, verified wired): the 25-node graphs for
both maps, all `MapEventPool` overrides, `reachableObjectives` /
`advanceReachObjectives` (the pattern `collectObjectives` mirrors).

**Out** (this phase ships): three new `Quest` objects, the
`collect`-objective engine primitive, three new dialogue choices.
No new routes/screens — nothing to retro-fit on the mobile side
(quest log surfacing is already generic; the memoir/character
screens read `state.quests` generically, not quest-by-name).

## Tests

### `axiomancer-mechanics/src/World/MapEvents/e2e/map-events.engine.test.ts`

New `describe('resolveMapEvent — collect-objective auto-advance')`
block, mirroring the existing reach-objective block 1:1
(`seedCollectQuest` helper instead of `seedReachQuest`):

- Seeds an active quest with one `collect` objective targeting a
  fabricated item id, sets a gathering pool granting that item id at
  the current node, resolves, asserts the quest completes
  (`result.state.quests.completed` contains the name) and
  `active` no longer contains it.
- A gathering event granting a **different** item id leaves the
  quest active and incomplete (silent no-op, same shape as the
  reach test's `'is a silent no-op'` case).
- A gathering event granting **two** copies of the target item in
  one resolution advances `currentCount` by 2 in a single
  `progressQuest` pass (not double-invoked) — covers the
  `itemIds.map` iteration path when `payload.items` has more than
  one matching entry.

### `axiomancer-mechanics/src/World/Continents/e2e/continents.engine.test.ts`

- `fishingVillage.quests` now length 2; the new `get-to-forest`
  entry has a single `reach` objective targeting `'nf-1'`.
- `northernForest.quests` now length 2 (was 0); `gather-wood` has a
  single `collect` objective targeting `'oak-branch'` with
  `requiredCount: 3`; `get-to-cave` has a single `reach` objective
  targeting `'nf-10'`.
- Old Marrow's `thanks` node gains a choice whose `effect.startQuest`
  is `'get-to-forest'` and whose `requires.questCompleted` is
  `'starting-quest'`.
- Hermit Sage's `greet` node gains a choice whose
  `effect.startQuest` is `'gather-wood'`.
- Forest Ranger's `greet` node gains a choice whose
  `effect.startQuest` is `'get-to-cave'`.

### `axiomancer-mechanics/src/World/quest.engine.ts` (no existing
dedicated unit-test file — `killObjectives`/`reachableObjectives`
are exercised only indirectly today via `Game/e2e/spec08.engine.test.ts`
/ the `map-events.engine.test.ts` reach block). `collectObjectives`
gets the same indirect coverage via the new map-events block above;
no new unit-test file needed to match existing convention.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. `Quest`,
`QuestObjectiveType`, and the `quest.engine.ts` exports are all
already public through the `@mechanics` barrel (additive export
only — `collectObjectives` joins `killObjectives`/
`reachableObjectives` in the same `export { ... }` line):

```bash
npm run type-check --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

## Deploy gate

```bash
npm run deploy:check
```

Touches `axiomancer-mechanics/**` only → `verify-mechanics.yml`
(+ path-filtered mobile/card-editor gates).

## Decisions made upfront — DO NOT ASK

- **Node-graph work is done; this phase is a rescope, not a
  reopen.** Verified in code (25 nodes + full pool coverage on both
  maps, pre-dating the build-plan row itself) before writing a line
  of code. Ticking `[x]` on the original wording would be dishonest
  about what shipped in *this* phase; the brief documents the
  correction instead of silently swapping scope.
- **`collect` objective wiring mirrors `reach` exactly, including
  its reward-on-auto-complete gap.** Fixing "no reward on
  map-event-driven auto-complete" for *both* types is a real, small
  bug, but it's an engine-behavior change to already-shipped `reach`
  quests (`get-to-forest`, `get-to-cave` would suddenly grant
  rewards after this ships, previously silent) — out of scope for a
  content-extension phase. Filed as a Follow-up.
- **Quest givers**: Old Marrow (already the fishing-village quest
  hub) for `get-to-forest`; Hermit Sage for `gather-wood` (thematic
  fit — solitary hearth-keeper, practical need); Forest Ranger for
  `get-to-cave` (already a guide/wayfinding NPC in existing
  dialogue). Not the Chronicler, Shrine Keeper, or Wandering
  Philosopher — their existing dialogue is purely
  philosophical/alignment-flavored with no practical hook to hang a
  fetch/reach quest on without rewriting established characterization.
- **No `nextQuest` chaining between the three.** `get-to-forest`,
  `gather-wood`, `get-to-cave` are independent — nothing in the
  design specs or bearings mandates a forced order, and chaining
  would block `gather-wood`/`get-to-cave` availability behind
  `get-to-forest`'s completion for no documented narrative reason.
  A future story-spec pass can chain them explicitly if the
  narrative calls for it.
- **Reward amounts** (30 XP / 20 currency / 40 XP) picked to sit
  between `starting-quest`'s 25-currency reward and the fishing
  village's boss-chain payouts — small, early-game, non-blocking.
- **Mobile `DebugQuestState.tsx` untouched.** Its own header comment
  already documents the intended swap ("if the engine later ships a
  `questLibrary`, swap the constants for registry-driven lookups") —
  the engine still has no queryable quest registry (only
  per-map `.quests` arrays looked up by the currently-loaded map),
  so there's nothing yet to swap to. Follow-up.

## Git

```bash
git add axiomancer-mechanics/src/World/quest.engine.ts \
        axiomancer-mechanics/src/World/MapEvents/resolve-map-event.ts \
        axiomancer-mechanics/src/World/index.ts \
        axiomancer-mechanics/src/index.ts \
        axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts \
        axiomancer-mechanics/src/World/Continents/Coastal-Village/npcs.ts \
        axiomancer-mechanics/src/World/Continents/Northern-Forest/npcs.ts \
        axiomancer-mechanics/src/World/MapEvents/e2e/map-events.engine.test.ts \
        axiomancer-mechanics/src/World/Continents/e2e/continents.engine.test.ts
git commit -m "$(cat <<'EOF'
feat(mechanics): author get-to-forest/gather-wood/get-to-cave quests — phase 8

- add collectObjectives (mirrors killObjectives/reachableObjectives) and
  wire it into resolveMapEvent's gathering path — the 'collect' objective
  type existed since Spec 08 but had zero runtime wiring
- author the three Quest objects quest.library.ts has declared names for
  but nothing ever instantiated: get-to-forest (fishing-village, reach
  nf-1), gather-wood (northern-forest, collect 3x oak-branch), get-to-cave
  (northern-forest, reach nf-10)
- wire each through a new appended dialogue choice: Old Marrow / Hermit
  Sage / Forest Ranger

Decisions:
- rescoped from the build-plan row's literal wording ("10->25-node
  expansion") because that work already shipped pre-nexus (verified:
  northernForest already has 25 nodes + full MapEventPool coverage,
  predating the build plan itself) — the real remaining gap was the
  declared-but-unauthored quest content
- collect-objective auto-complete mirrors reach's existing behavior
  exactly, including not granting a reward on map-event-driven
  auto-complete (a pre-existing gap on the reach path too) — fixing
  that is a separate engine-behavior change, filed as a follow-up
- quest givers picked for thematic fit (Old Marrow already the village
  quest hub; Hermit Sage's solitary hearth-keeping; Forest Ranger's
  existing wayfinding role) over the three purely-philosophical NPCs
- no nextQuest chaining between the three — independent, no documented
  narrative order

Closes #<phase-issue-number>
EOF
)"
git push origin main
```

## DoD

Flip Phase 8 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 8 shipped — northern forest quest content"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Grant `q.reward` on map-event-driven (`reach`/`collect`)
  auto-complete in `resolve-map-event.ts` — today only the `kill`
  path (combat resolution, `game.reducer.ts`) grants rewards on
  auto-complete. A real engine-behavior fix, not content.
- A queryable engine `questLibrary` / `getQuestById` (mobile's
  `DebugQuestState.tsx` header comment already asks for this) so
  dev tooling and future UI don't need per-map lookups.
- Extend the fishing-village -> northern-forest -> caverns ->
  northern-city -> connecting-river quest chain declared in
  `quest.library.ts` past northern-forest — `CavernsQuests` /
  `NorthernCityQuests` / `ConnectingRiverQuests` have no map
  definitions yet (`northern-continent` registry is empty).
- A story-spec pass (via `/story-spec`) authoring real narrative
  beats around these three quests instead of the minimal
  utilitarian dialogue this phase ships — matches build-plan
  Phase 9's own scope ("author the first real character/story/world
  specs").
