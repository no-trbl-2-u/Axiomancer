# Phase 128 — Story Content NPCs Dialogue Expansion (Alignment-Gated with Talk Structure)

## Outcome

Ship 5–8 additional named NPCs with enhanced dialogue trees featuring T-specified Talk + moral-choice structure, philosophical-alignment-gated content, diverse consequence shapes, and extended NPC content patterns for future story expansion across fishing-village and northern-forest.

## Source spec

Phase 128 build plan row + T oversight directive on dialogue structure + follow-up to Phase 115. Foundation: Spec 14 (philosophical-alignment cube), existing `DialogueTree` architecture, Phase 115 shipped NPCs (Captain Blackwater, Fisherman's Daughter, Shrine Keeper, Chronicler, Wandering Philosopher), established `dialogue.runtime.ts` + alignment cube + flagSet system.

## Implementation units

### Unit 1: Enhanced NPC definitions with Talk + choice structure (5–8 NPCs)
- **File**: `src/World/Continents/Coastal-Village/npcs.ts` — extend existing with 3–4 new coastal NPCs 
- **File**: `src/World/Continents/Northern-Forest/npcs.ts` — extend existing with 2–4 new northern NPCs
- **Types**: Use existing `NPC`, `DialogueTree`, `DialogueChoice` types from `src/NPCs/types.ts`
- **Logic**: Author 5–8 new named NPCs with T-specified dialogue structure:
  - **Core pattern**: Each encounter offers `*Talk` option (more context, does NOT end encounter) + ~3 mutually-exclusive philosophical-alignment responses with distinct consequence shapes
  - **T's example structure** (adapted per NPC): "God will help you" (alignment change only) / "I will help you" (alignment change + item/health lost) / "I'll just take what you have" (alignment change + item gained)
  - **New NPCs to author**:
    - **The Village Healer** (coastal): Medical ethics dilemmas, aid vs. self-preservation choices
    - **The Dockworker's Union Leader** (coastal): Labor rights, collective action vs. individual survival
    - **The Merchant's Widow** (coastal): Grief and justice, forgiveness vs. retribution paths
    - **The Forest Ranger** (northern): Conservation vs. exploitation, stewardship responsibility
    - **The Hermit Sage** (northern): Isolation vs. community obligation, wisdom sharing ethics
    - **The Lost Trader** (northern): Trust and deception, mutual aid in crisis situations
    - **[Optional] The Young Apprentice** (either): Mentorship dynamics, knowledge vs. experience
    - **[Optional] The Tribal Elder** (northern): Tradition vs. progress, cultural preservation
- **Pattern**: Each NPC follows T-specified structure:
  - Initial greeting offers contextual `*Talk` option that reveals NPC's situation/conflict
  - After Talk, present ~3 alignment-gated responses expressing different philosophical approaches
  - Map responses to `alignmentDelta` + effect surfaces per T's example consequence shapes
  - Ensure memorable character conflicts that demonstrate alignment system in play
  - Design for replayability across different alignment paths

### Unit 2: Consequence shape implementation 
- **File**: NPC dialogue trees — implement T's example consequence patterns
- **Types**: Extend `DialogueChoice.effect` usage patterns
- **Logic**: Map philosophical responses to distinct consequence shapes:
  - **Alignment-only responses**: Pure philosophical positioning without material cost/gain
  - **Self-sacrificial responses**: Alignment change + item loss, health loss, or resource cost
  - **Self-interested responses**: Alignment change + item gained, advantage secured, resource extracted
  - **Balanced responses**: Alignment change + mixed consequences (cost + benefit)
- **Pattern**:
  - Use existing `alignmentDelta`, `grantCurrency`, `moralDelta` effect fields
  - Extend with health/resource consequences where appropriate (map to existing game systems)
  - Ensure consequence distribution feels meaningful and reflects philosophical choice weight
  - Balance positive/negative material outcomes across response options

### Unit 3: Map integration and placement strategy
- **File**: `src/World/Continents/Coastal-Village/maps.ts` — integrate new coastal NPCs 
- **File**: `src/World/Continents/Northern-Forest/maps.ts` — integrate new northern NPCs
- **Types**: Use existing `MapEventPayload.npc` integration pattern
- **Logic**: Strategic placement emphasizing narrative payoff and choice visibility
- **Pattern**:
  - Distribute NPCs across multiple map nodes for discovery variety
  - Place NPCs in thematically appropriate locations (healer near village center, ranger in deep forest)
  - Ensure NPC conflicts/situations align with regional themes and existing content
  - Create encounter density that supports multiple alignment path replays

### Unit 4: Documentation and content pattern establishment
- **File**: `docs/npcs.md` — update with new NPCs and dialogue structure documentation
- **File**: New NPC implementations — establish reusable patterns for future expansion
- **Types**: Document `DialogueTree` authoring patterns and T-specified structure
- **Logic**: Establish NPC content patterns for future story expansion
- **Pattern**:
  - Document T-specified Talk + choice structure as canonical pattern for new NPCs
  - Catalog consequence shape examples for future reference
  - Establish character archetype guidelines for diverse personality representation
  - Create reusable templates for alignment-gated moral choice scenarios

### Unit 5: Export barrel & comprehensive e2e coverage
- **File**: `src/World/index.ts` — export new NPC content modules
- **File**: `src/NPCs/e2e/story-npcs.engine.test.ts` — extend with new NPC coverage
- **Types**: Use existing NPC and dialogue testing patterns
- **Logic**: Export new NPCs via barrel, add hermetic e2e test coverage for Talk + choice structure
- **Pattern**:
  - Export all new NPC modules through World barrel
  - Hermetic e2e testing for Talk option behavior (context revealed, encounter continues)
  - Test alignment gate functionality across different philosophical positions
  - Test consequence shape application (alignment changes, material effects)
  - Cover edge cases: unmet alignment requirements, Talk + choice interaction patterns
  - Golden path tests for each NPC's Talk → choice → consequence flow

## Decisions made upfront — DO NOT ASK

- **D1 — Dialogue structure adoption.** Implement T-specified Talk + choice structure as new canonical pattern. Talk option always provides more context without ending encounter; choice options are mutually-exclusive philosophical responses.
- **D2 — Consequence shape variety.** Map T's three-category example (alignment-only, self-sacrificial, self-interested) to existing game effect systems. Use `alignmentDelta`, `grantCurrency`, `moralDelta` primarily; health/resource effects mapped to existing systems.
- **D3 — NPC count and distribution.** Target 5–8 new NPCs (3–4 coastal, 2–4 northern) to establish content pattern without overwhelming existing content balance. Quality over quantity priority.
- **D4 — Character archetype diversity.** Cover ethics/medical, labor/collective, grief/justice, environmental/stewardship, wisdom/isolation, trust/crisis archetypes to demonstrate alignment system across diverse life situations.
- **D5 — Alignment gate complexity.** Continue single-axis alignment gate pattern from Phase 115. Each NPC should have 2–3 alignment-gated responses spanning different philosophical positions on relevant axes.
- **D6 — Replayability design.** Structure NPC encounters for multiple meaningful interactions across different player alignment paths. Each alignment position should unlock different consequence shapes and narrative outcomes.
- **D7 — Documentation priority.** Establish this expanded dialogue pattern as reference for future story content phases. Document structure, consequence mapping, and character archetype guidelines for consistent expansion.

## Verify gate

- `npm run type-check` clean
- `npm test` ≥502 (new e2e coverage will add 8-10 test cases for Talk + choice structure)
- `npm run build` clean  
- `npm run deploy:check` clean (additive content only — no breaking changes)

## Commit body template

```
feat(world): Phase 128 — Story Content NPCs Dialogue Expansion (Talk Structure)

- Ship 6 named NPCs with T-specified Talk + moral-choice dialogue structure
- Implement alignment-gated responses with distinct consequence shapes across fishing-village and northern-forest  
- Add healer, union leader, widow, ranger, hermit sage, lost trader character archetypes
- Establish Talk option (context without ending) + 3 philosophical response pattern
- Map consequence shapes: alignment-only, self-sacrificial, self-interested variations
- Update docs/npcs.md with canonical dialogue structure patterns

Decisions:
- T-specified Talk + choice structure as new canonical NPC pattern
- Three consequence shape categories mapped to existing game effect systems  
- 6 NPCs across diverse ethical archetype spectrum for alignment system demonstration
- Strategic placement for replayability across different philosophical paths
- Documentation priority for future story expansion consistency
```

## Definition of Done

- [x] 5–8 new named NPCs authored with Talk + choice structure across both continents
- [x] Each NPC implements Talk option that reveals context without ending encounter  
- [x] Each NPC offers ~3 mutually-exclusive alignment-gated philosophical responses
- [x] Consequence shapes implemented mapping T's example patterns to game systems
- [x] NPCs integrated into map event pools with strategic thematic placement
- [x] Hermetic e2e coverage for Talk + choice interaction patterns  
- [x] `docs/npcs.md` updated with canonical dialogue structure documentation
- [x] Content patterns established for future story expansion phases
- [x] All verify gate checks pass (type-check, test, build, deploy)
- [x] Memorable character conflicts that demonstrate alignment system in diverse life situations

## Follow-ups (out of scope)

- **Chronicle integration depth** — detailed Chronicle content expansion for historian/scholar NPCs beyond light references
- **Quest chain authoring** — full new quest content leveraging established NPC relationships and flag patterns  
- **Advanced dialogue mechanics** — compound alignment gates (AND logic), conditional choice unlocking, dynamic text based on prior choices
- **Regional NPC density** — continent-specific NPC population balancing and interaction frequency tuning