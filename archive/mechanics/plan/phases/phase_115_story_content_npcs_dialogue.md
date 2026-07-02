# Phase 115 — Story Content NPCs Dialogue Expansion

## Outcome

Ship 3–5 named NPCs with multi-branch dialogue trees leveraging philosophical alignment gates, moral choice consequences, quest-adjacent interactions, Chronicle journal integration, diverse personality archetypes, meaningful choice branching with narrative payoff, and flagSet quest chain integration.

## Source spec

Spec.md 6-month horizon story content expansion + Phase 115 build plan row. Existing foundation: Spec 14 (philosophical-alignment cube), Phase 63 (NPC alignment observers), Old Marrow dialogue tree pattern in `src/World/Continents/Coastal-Village/maps.ts`, established NPC types and DialogueTree architecture in `src/NPCs/types.ts`.

## Implementation units

### Unit 1: NPC definitions with dialogue trees (3–5 NPCs)
- **File**: `src/World/Continents/Northern-Forest/npcs.ts` (new) — northern-forest themed NPCs 
- **File**: `src/World/Continents/Coastal-Village/npcs.ts` (new) — coastal-village additional NPCs
- **Types**: Use existing `NPC` and `DialogueTree` types from `src/NPCs/types.ts`
- **Logic**: Author 3–5 named NPCs spanning diverse personality archetypes:
  - **The Shrine Keeper** (northern-forest): Transcendent-leaning mystic with philosophical alignment gates across multiple axes
  - **Captain Blackwater** (coastal-village): Pragmatic merchant with moral choice consequences tied to trade ethics
  - **The Chronicler** (northern-forest): Scholarly NPC with quest-adjacent Chronicle journal integration
  - **Fisherman's Daughter** (coastal-village): Young idealist with meaningful choice branching for mentorship/guidance
  - **The Wandering Philosopher** (traveling): Alignment-sensitive dialogue covering diverse philosophical positions
- **Pattern**: Follow Old Marrow pattern with:
  - Multi-node dialogue trees with meaningful branching (3-5 nodes minimum per NPC)
  - Philosophical alignment gates (`requiresAlignment`) spanning epistemology/outlook/scope axes
  - Moral choice consequences (`moralDelta`, `alignmentDelta`) with narrative payoff
  - Quest integration (`startQuest`, `progressQuest`, `setFlag`) where thematically appropriate
  - Diverse personality archetypes reflecting different worldviews and social roles

### Unit 2: Map integration and placement
- **File**: `src/World/Continents/Coastal-Village/maps.ts` — integrate new coastal NPCs into existing maps
- **File**: `src/World/Continents/Northern-Forest/maps.ts` — integrate new northern NPCs into map event pools
- **Types**: Use existing `MapEventPayload.npc` integration pattern
- **Logic**: Place NPCs in meaningful map locations with interaction events
- **Pattern**: 
  - Add NPCs to appropriate `MapEventPool` entries in both continents
  - Use `interaction` MapEventKind with `npc: npcName` payload
  - Distribute across multiple map nodes to provide discovery variety
  - Ensure placement aligns with NPC personality and background themes

### Unit 3: Chronicle journal integration content
- **File**: New NPC definitions — extend dialogue effects with Chronicle-specific content
- **Types**: Use existing `effect.setFlag` and quest progression patterns  
- **Logic**: Integrate Chronicle journal content for scholar/historian NPCs
- **Pattern**:
  - Chronicle-adjacent dialogue choices that set flags for journal discovery
  - Progress existing Chronicle-related quest objectives where applicable
  - Reference established Chronicle lore and world-building elements
  - Maintain consistency with existing Chronicle content patterns

### Unit 4: Export barrel & hermetic e2e coverage
- **File**: `src/World/index.ts` — export new NPC content modules
- **File**: `src/NPCs/e2e/story-npcs.engine.test.ts` (new) — hermetic test coverage
- **Types**: Use existing NPC and dialogue testing patterns  
- **Logic**: Export new NPCs via barrel, add comprehensive e2e test coverage
- **Pattern**:
  - Export all new NPC modules through World barrel
  - Hermetic e2e testing dialogue trees, alignment gates, choice consequences
  - Test quest integration, flag setting, moral/alignment delta application  
  - Cover edge cases: unmet requirements, multiple conversation paths, observer patterns
  - Golden path tests for each NPC's primary dialogue flow

## Decisions made upfront — DO NOT ASK

- **D1 — Geographic distribution.** Place NPCs across both coastal-village and northern-forest continents for content variety. 3 NPCs minimum, 5 maximum to avoid content bloat while establishing meaningful expansion patterns.
- **D2 — Personality archetype diversity.** Cover mystic/spiritual, pragmatic/commercial, scholarly/intellectual, idealistic/young, and philosophical/wandering archetypes to represent different worldview segments and player interaction styles.
- **D3 — Alignment gate complexity.** Use single-axis alignment gates per existing patterns; compound gates (AND logic) deferred as engine enhancement. Each NPC should have alignment-gated content spanning different philosophical positions.
- **D4 — Quest integration depth.** Focus on quest-adjacent interactions (flag setting, objective progression) rather than full new quest authoring. Full quest content expansion is separate phase scope.
- **D5 — Chronicle journal integration.** Limit Chronicle integration to The Chronicler NPC primarily, with light references from other scholarly NPCs. Deep Chronicle expansion is separate content phase.
- **D6 — Observer pattern adoption.** Only apply Phase 63 observer patterns (`id`, `playerAlignmentCellChangedSince`) where thematically appropriate. Not all NPCs need observer functionality.
- **D7 — File organization.** Create continent-specific NPC modules (`npcs.ts`) rather than single central library to organize content by geographic region and support future continent expansion.

## Verify gate

- `npm run type-check` clean
- `npm test` ≥494 (new e2e coverage will add 8-12 test cases)
- `npm run build` clean
- `npm run deploy:check` clean (additive content only — no breaking changes to exported types)

## Commit body template

```
feat(world): Phase 115 — Story Content NPCs Dialogue Expansion

- Ship 5 named NPCs with multi-branch dialogue trees across coastal-village and northern-forest
- Implement philosophical alignment gates, moral choice consequences, quest integration
- Add Chronicle journal integration for scholar NPCs, diverse personality archetypes
- Hermetic e2e coverage for dialogue trees, alignment gates, choice branching
- Export via World barrel, integrate with map event placement

Decisions:
- Geographic distribution across both continents for content variety
- 5 personality archetypes: mystic, pragmatic, scholarly, idealistic, philosophical
- Quest-adjacent integration focus rather than full new quest authoring
- Chronicle integration limited to scholar NPCs with light cross-references
- Continent-specific NPC modules for organized geographic content structure
```

## Definition of Done

- [ ] 3–5 named NPCs authored with distinct personality archetypes
- [ ] Multi-branch dialogue trees with 3-5 nodes minimum per NPC
- [ ] Philosophical alignment gates spanning epistemology/outlook/scope axes
- [ ] Moral choice consequences with meaningful narrative payoff
- [ ] Quest-adjacent integration (flag setting, objective progression) where appropriate
- [ ] Chronicle journal integration for scholarly NPCs
- [ ] NPCs integrated into map event pools across both continents
- [ ] Export via World barrel (`src/World/index.ts`)
- [ ] Hermetic e2e test coverage in `src/NPCs/e2e/story-npcs.engine.test.ts`
- [ ] `npm run verify` + `npm run deploy:check` green
- [ ] Build plan Phase 115 row flips `[ ]` → `[x]`

## Follow-ups (out of scope)

- **Full new quest authoring** — NPCs provide quest-adjacent interactions but full quest content expansion is separate phase
- **Deep Chronicle expansion** — Chronicle integration limited to scholarly NPCs; comprehensive Chronicle content is separate phase  
- **Compound alignment gates** — AND logic for alignment requirements deferred as engine enhancement
- **NPC visual assets** — NPCs use existing image patterns; custom artwork is separate content phase
- **Voice/audio content** — Text-only dialogue; audio expansion is separate feature phase

## Canonical sibling

Phase 63 (NPC alignment observers) — most recent NPC dialogue expansion with engine integration. Old Marrow dialogue tree in `src/World/Continents/Coastal-Village/maps.ts` for multi-branch dialogue pattern. Phase 46 (alignment-gated content) for philosophical choice integration patterns.