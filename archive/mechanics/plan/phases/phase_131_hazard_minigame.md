# Phase 131 — Hazard Minigame Base Implementation (CDR-0006)

## Outcome

Ship complete hazard minigame system with 15 hazard cards, 30 action cards across three rarity tiers, 4-die mana system, top/bottom route selection, 3-5 round tactical play, score-based rewards, and hermetic e2e coverage of core BDD scenarios — integrating with existing map event resolver to replace passive hazard damage with interactive tactical puzzles.

## Source spec

CDR-0006 doctrine accepted (v0) + companion PRD/TDD/BDD complete. Primary sources: `docs/hazard-minigame.md` (core rules and card library), `docs/hazard-minigame-prd.md` (functional requirements), `docs/hazard-minigame-tdd.md` (technical architecture), `docs/hazard-minigame-bdd.md` (test scenarios). Integration point: `src/World/MapEvents/resolve-map-event.ts` replacement of `kind: 'hazard'` surface.

## Implementation units

### Unit 1 — Core types and dice system
- **Files**: `src/World/Hazard/hazard.types.ts`, `src/World/Hazard/hazard.dice.ts`, `src/World/Hazard/index.ts`
- **Types**: Complete type definitions from TDD:
  ```ts
  type HazardProgressType = 'stability' | 'escape' | 'supply' | 'force';
  type HazardDieColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'x';
  type HazardDieState = 'available' | 'spent' | 'exhausted' | 'discarded' | 'locked' | 'preserved';
  type HazardManaDie = { id: string; color: HazardDieColor; state: HazardDieState; temporary: boolean; };
  type HazardMinigameState = { phase: HazardPhase; hazardCard: HazardCard; /* full state machine */ };
  type HazardPhase = 'reveal' | 'draw' | 'route-select' | 'dice-roll' | 'round-play' | 'round-resolve' | 'between-rounds' | 'complete';
  ```
- **Logic**: Dice validation, mana cost checking, state transitions
- **Pattern**: `canAffordCost()`, `spendMana()`, `canInteractWithX()` functions per TDD specification. All RNG through `rng: () => number` parameter pattern (no `Math.random()` calls).

### Unit 2 — Card system and deck management
- **Files**: `src/World/Hazard/hazard.cards.ts`, `src/World/Hazard/hazard.deck.ts`, `src/World/Hazard/hazard.cards.library.ts`
- **Types**: Complete card type system:
  ```ts
  type HazardActionCard = { id: string; name: string; rarity: HazardCardRarity; class: HazardCardClass; topAction: HazardCardEffect; bottomAction: HazardCardEffect; /* etc */ };
  type HazardCardEffect = (state: HazardRoundState) => HazardRoundState;
  type HazardCardClass = 'direct-progress' | 'focus' | 'mana-conversion' | /* 8 more classes */;
  ```
- **Logic**: Deck shuffling, draw mechanics, discard handling, enchantment zone management
- **Pattern**: Fisher-Yates shuffle with RNG parameter, deck-empty-reshuffle logic, ENCHANT card isolation from normal deck cycling.

### Unit 3 — Engine logic and integration
- **Files**: `src/World/Hazard/hazard.engine.ts`, `src/World/MapEvents/resolve-map-event.ts` (integration point)
- **Types**: Core engine functions per TDD:
  ```ts
  function initializeHazard(hazardCard: HazardCard, playerDeck: string[]): HazardMinigameState;
  function playCard(state: HazardMinigameState, cardId: string, useBottom: boolean): HazardMinigameState;
  function resolveRound(state: HazardMinigameState): HazardMinigameState;
  function computeFinalScore(state: HazardMinigameState): number;
  ```
- **Logic**: Complete state machine implementation, round resolution (single/dual type thresholds), score calculation (`count(O) - count(X)`), reward/penalty dispatch
- **Pattern**: Replace `case 'hazard': applyHazardEffects()` with `case 'hazard': launchHazardMinigame()` in map event resolver. Store active hazard in `GameState.activeHazard?: HazardMinigameState`.

### Unit 4 — Card libraries and hazard content
- **Files**: `src/World/Hazard/hazard.hazards.library.ts`, complete card library implementation
- **Types**: All 30 action cards (6 direct progress, 3 mana conversion, 3 mana creation, 3 card draw, 3 risk/sacrifice, 3 failure mitigation, 3 synergy/combo, 3 X-die interaction, 3 persistent enchantment) + all 15 hazard cards (H01-H15 per doctrine)
- **Logic**: Complete card effect implementations, hazard route definitions, threshold progression, reward/penalty structures
- **Pattern**: Each action card has `topAction` (free) and `bottomAction` (mana cost + stronger effect). Focus buffs stack on next progress card. X-die interaction class enables otherwise-blocked X dice usage.

### Unit 5 — Hermetic e2e test coverage
- **Files**: `src/World/Hazard/e2e/hazard.engine.test.ts`
- **Types**: Test coverage for ≥8 BDD scenarios from `docs/hazard-minigame-bdd.md`
- **Logic**: Comprehensive e2e testing with stubbed RNG covering: hazard start sequence, mana dice persistence, X-die blocking/interaction, ENCHANT zone behavior, deck reshuffle, Focus stacking, round resolution (single/dual type), final scoring, consequence application
- **Pattern**: Use `mockFixedRng`/`mockSequentialRng` for deterministic testing. Cover golden paths + edge cases from BDD spec.

## Decisions made upfront — DO NOT ASK

- **D1 — Module location.** Hazard minigame lives in `src/World/Hazard/` as specified in TDD. Separate from combat system with own state/lifecycle/resolution.
- **D2 — Card effect type.** Use `(state: HazardRoundState) => HazardRoundState` pure function pattern. All 30 v0 cards work with this synchronous model.
- **D3 — X-die interaction.** X dice are blocked by default; only `class: 'x-die-interaction'` cards enable interaction. No exceptions.
- **D4 — Persistent map benefits.** H08/H12/H15 persistent map benefits marked ⚑ future phase — replace with equivalent one-time VITAE/item grants until world-state tracking ships.
- **D5 — Route selection timing.** Player chooses route after drawing opening hand but before dice roll (knows cards, not mana). This preserves T-specified commitment identity.
- **D6 — Progress type count.** Exactly four progress types in v0: Stability, Escape, Supply, Force. Focus is a card buff mechanic, not a progress type.
- **D7 — Deck persistence.** Player deck stored in `GameState.hazardDeck: string[]` - grows as cards unlocked via `UNLOCK_HAZARD_CARD` action pattern.
- **D8 — Dev mode implementation.** Store action `DEV_INJECT_HAZARD_CARD` adds card to hand without touching deck/discard. No-op in production builds.

## Verify gate

- `npm run type-check` clean
- `npm test -- --run` ≥520 (substantial e2e coverage for engine, cards, dice, deck management)
- `npm run build` clean
- `npm run deploy:check` clean
- Manual verification: hazard e2e test suite covers ≥8 BDD scenarios

## Commit body template

```
feat(world): Phase 131 — Hazard Minigame base implementation

- Implement complete hazard minigame system per CDR-0006 doctrine
- Add 15 hazard cards (H01-H15) with top/bottom routes and 3-5 round progression  
- Add 30 action cards across 10 verb classes and 3 rarity tiers
- Implement 4-die mana system with X-die blocking and persistent state
- Add top/bottom card actions, Focus stacking, ENCHANT zone mechanics
- Replace passive map hazard events with interactive tactical puzzles
- Wire to resolveMapEvent with score-based reward/penalty dispatch

Technical decisions:
- Complete state machine in src/World/Hazard/ per TDD architecture
- Pure function card effects with synchronous resolution model
- X-die interaction gated by specific card class, no free interaction
- Persistent map benefits deferred (replace with VITAE/item grants)
- Route selection after hand draw, before dice roll per doctrine
- RNG contract respected (no Math.random() calls, parameter threading)
```

## Definition of Done

- [ ] Complete type system implemented (`hazard.types.ts` with all TDD types)
- [ ] 4-die mana system with color/state transitions and X-die blocking
- [ ] All 30 action cards implemented across 10 verb classes (direct progress, focus, mana conversion, mana creation, card draw, risk/sacrifice, failure mitigation, synergy/combo, X-die interaction, persistent enchantment)
- [ ] All 15 hazard cards (H01-H15) with top/bottom routes and progression
- [ ] Complete state machine: reveal → draw → route-select → dice-roll → round-play → round-resolve → between-rounds → complete
- [ ] Top/bottom card actions with mana costs and Focus buff stacking
- [ ] ENCHANT zone mechanics (cards removed from deck cycling)
- [ ] Deck management with reshuffle-on-empty and deterministic RNG
- [ ] Map event integration replacing passive hazard damage
- [ ] Score calculation (`count(O) - count(X)`) with reward/penalty dispatch
- [ ] Hermetic e2e coverage for ≥8 BDD scenarios from `docs/hazard-minigame-bdd.md`
- [ ] Dev mode hand injection with production no-op behavior
- [ ] All verify gate checks pass (type-check, test, build, deploy)

## Follow-ups (out of scope)

- **World-state tracking** — Persistent map benefits for H08/H12/H15 require world-state tracking system (filed in PHASE_CANDIDATES.md, score 6.4)
- **Deck acquisition UI** — Where/how players unlock cards through gameplay progression
- **Balance tuning runs** — Mechanics-tuning iterations against success rate targets from PRD
- **Mobile UI implementation** — Hazard minigame presentation layer for mobile clients
- **Advanced deck mechanics** — Card crafting, trading, duplication systems
- **Procedural hazard generation** — Algorithmic hazard card creation beyond authored content