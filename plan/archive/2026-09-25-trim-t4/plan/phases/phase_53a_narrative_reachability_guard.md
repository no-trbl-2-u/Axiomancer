# Phase 53a — Narrative reachability: the guard, then the mismatches

> Agent-facing brief. Eleven of fourteen authored dialogue trees cannot be
> reached by legal play, and nothing anywhere fails when that is true. Build
> the guard first, then fix what it catches. Mechanics only. First of the
> **narrative-encounters** batch (53a-53e); ship in order.

## Why this exists

`resolveInteraction` looks an NPC up by display name against the host map's
roster and falls back silently when the name is absent
(`src/World/MapEvents/handlers.ts:79-85`):

```ts
const npc = def.npcs?.find(n => n.name === payload.npcName);
return { kind: 'interaction', npcName: npc?.name ?? payload.npcName, dialogue: npc?.dialogueTree };
```

A missing tree is not an error — the presenter composes a card with the
name, the one-line description, and a single **SO BE IT** button. It reads
as a deliberately minimal encounter, not as a missing conversation. So four
mismatches have sat in the tree across content passes:

| node | authored `npcName` | roster has | what it should be |
|---|---|---|---|
| `fv-19` | `Weathered Fisher` | nobody | a rostered NPC — **53c** reclaims this node |
| `nf-7` | `Forest Hermit` | `Hermit Sage` | the same character, written twice |
| `nf-14` | `Ancient Stone Marker` | nobody | scenery, not a person |
| `nf-23` | `Echo Stone` | nobody | scenery, not a person |

Consequence, measured by driving `resolveMapEvent` at all 50 nodes:
**fishing-village 0 of 8 NPCs reachable, northern-forest 3 of 6.** Full
evidence in `docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md` § N1.

This is the same failure class as the first-map audit's F5 — authored
content no player can reach, undetected across content passes — arriving a
second time by a different road. The neighbouring pool already has the right
instinct: `FV_ENCOUNTER_FOES` throws at import when a node has no authored
foe. Nothing equivalent guards `npcName`.

## Inputs

1. `src/World/MapEvents/handlers.ts` — `resolveInteraction`, the silent
   fallback.
2. `src/World/MapEvents/content.ts` — `fvInteractionPool`, `nfHermit`,
   `nfStoneMarker`, `nfEchoStone`, and `registerMapEventContent()`.
3. `src/World/Continents/Coastal-Village/maps.ts` — both rosters
   (`fishingVillage.npcs`, `northernForest.npcs`) and the inline trees.
4. `src/World/Continents/Northern-Forest/npcs.ts` — `hermitSage` and the
   five siblings.
5. `src/World/map.registry.ts` — `MAP_REGISTRY`, the only place that
   enumerates every map.
6. `src/World/world.reducer.ts` — `auditMapTraversal`, the shape to mirror:
   a pure exported auditor with a thin test on top.
7. `docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md` — the evidence.
8. `specs/story/S-02-fishing-village-voices.md` — which NPCs are
   deliberately unhomed and why.

## Scope

**The guard, first.** Export `auditNarrativeReachability(def)` from the
World barrel alongside `auditMapTraversal`, returning at minimum:

- `unresolvedInteractions` — nodes whose `npcName` is absent from the roster.
- `unreachableNpcs` — rostered NPCs with a `dialogueTree` that no node
  routes to.
- `sceneryAsPeople` — `interaction` nodes whose payload names something the
  roster will never carry.

Then a hermetic invariant test over `MAP_REGISTRY` (not one map) asserting
`unresolvedInteractions` is empty everywhere and every unreachable NPC is
declared.

**Declaring the deliberately unhomed.** Four coastal NPCs stay unplaced on
purpose (S-02: Tide-Shopkeeper, Village Healer, Union Leader, Merchant's
Widow), and the guard must be able to tell that from a lost NPC. Add an
explicit `unstagedNpcs: ReadonlyArray<{ name: string; reason: string }>` to
`MapDefinition` — authored, greppable, and a reason string that has to be
written rather than a boolean that can be flipped without thought. An NPC in
neither the homed set nor `unstagedNpcs` fails the test.

**Then the mismatches.**

- `nf-7` → `npcName: 'Hermit Sage'`. Same character; the hut and the sage
  were written by different hands.
- `nf-14`, `nf-23` → re-author as `cutscene` pools. A standing stone and an
  echo are not people; they have no roster entry and never will. Keep the
  existing description prose as the first line.
- `fv-19` → **out of scope here.** 53c reclaims it for a rostered NPC.
  Until then it is a known-failing case: land 53a's guard with `fv-19`
  listed as an accepted exception carrying a `TODO(53c)` reason string, and
  53c removes the exception. Do not paper over it by inventing a
  `Weathered Fisher` NPC.

## Decisions made upfront — DO NOT ASK

- **The guard is a test plus a pure auditor, not an import-time throw.**
  `content.ts` registers pool overrides by `(continent, mapName, nodeId)`
  strings and deliberately does not import map definitions; making it read
  rosters at import couples two modules that are currently independent and
  makes correctness depend on import order. `auditMapTraversal` already
  established the auditor-plus-test shape in this exact area — follow it.
- **Match on the display name, do not switch to slugs.** The name is the
  authored join key in both directions and `Enemy.name` works the same way
  (see `kill-objectives.engine.test.ts`, which pins that coupling
  deliberately). Introducing NPC slugs is a schema change and a different
  phase's work.
- **`nf-14` and `nf-23` become cutscenes, not new NPCs.** Inventing a
  `Ancient Stone Marker` roster entry to satisfy the guard would satisfy the
  letter and lose the point — a lookup that always succeeds guards nothing.
- **Nothing here retunes, rewrites or rethemes a line of dialogue.** Phase
  44g owns prose by name. This phase changes reachability only.
- **This phase drains the pending AUDIT row** "[world] Map-event content has
  no coverage guard against unreachable authoring". That row was filed for
  the `fv-1` instance; this is the same defect widened to NPCs, and the
  auditor answers both. Move the row to Done citing this phase.

## Surface as `[needs-user-call]`

- Nothing. Every call here is mechanical, and the one content judgment
  (which NPCs stay unstaged) is already ruled in S-02 and reversible.

## Prove (DoD)

- `auditNarrativeReachability` unit-tested against a hand-built fixture map:
  a matching name resolves, a mismatched one is reported, a rostered NPC
  with no node is reported, an `unstagedNpcs` entry suppresses that report.
- Registry-wide invariant test: for every map in `MAP_REGISTRY`,
  `unresolvedInteractions` is empty apart from the declared `fv-19`
  exception, and every tree-carrying NPC is homed or declared.
- Regression witness by name: `nf-7` resolves to `Hermit Sage` **with a
  dialogue tree attached** — that is the finding, not just the string.
- `nf-14` and `nf-23` resolve as `cutscene` and no longer claim to be
  people.
- The count moves and is asserted: northern-forest goes 3 of 6 reachable to
  4 of 6 (Forest Ranger and Lost Trader remain unhomed and must be declared
  or homed — decide in this phase and record it).
- `npm run verify --workspace axiomancer-mechanics`, plus
  `--workspace axiomancer-mobile` because `MapDefinition` gains a field and
  the `@mechanics` alias couples them.

## Follow-ups

- 53c removes the `fv-19` exception by homing Old Marrow and reclaiming the
  node.
- 44g's retheme surface grows from 3 reachable trees to 4 here and 7 after
  53c — worth noting on that row when this lands.
- Northern-forest content stays unreachable in play until inter-map travel
  exists (first-map audit F4, a standing phase candidate). Fixing the wiring
  now is still right: it stops the rot and it is what 44g will retheme.
