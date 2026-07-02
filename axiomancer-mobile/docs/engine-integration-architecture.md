# Engine Integration Architecture

> How `axiomancer-mechanics` connects to mobile UI patterns

This document explains the architectural bridge between the `axiomancer-mechanics` npm engine and mobile-specific UI concerns. Newcomers should read this alongside [`docs/presenters.md`](./presenters.md) and [`docs/adr/ADR-0001-engine-truth-and-presenter-boundary.md`](./adr/ADR-0001-engine-truth-and-presenter-boundary.md).

## Overview — The Translation Layer

Axiomancer Mobile is fundamentally a **presentation layer** on top of the `axiomancer-mechanics` engine. The engine owns all game rules, state, and logic; the mobile app translates that truth into React Native UI patterns.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ axiomancer-     │    │ Mobile          │    │ React Native    │
│ mechanics       │───▶│ Presenters      │───▶│ Components      │
│ (npm engine)    │    │ (translation)   │    │ (UI)            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     Game Truth              Bridge Layer           User Interface
```

This architecture solves the **"parallel rules engine"** problem — mobile never reimplements game logic, it only presents what the engine provides.

## Engine-to-Mobile Data Flow

### 1. Engine State Shape

The engine exports structured state through its store:

```typescript
// Engine state (axiomancer-mechanics)
interface GameState {
  player: Character;          // Stats, effects, inventory
  combat: CombatState | null; // Active battle, phases, choices
  exploration: ExplorationState;
  // ... other slices
}
```

### 2. Mobile Store Integration

Mobile wraps the engine store with React bindings:

```typescript
// state/GameStoreProvider.tsx
const gameStore = createGameStore(memoryAdapter, initialState);

export function useGameState<T>(selector: (state: GameState) => T): T {
  return gameStore.getState((state) => selector(state));
}

export function useGameActions() {
  return gameStore.getActions(); // Engine actions, not mobile inventions
}
```

### 3. Presenter Translation Layer

Presenters (`state/presenters/*.engine.ts`) convert raw engine state into mobile-optimized view models:

```typescript
// Example: combat.engine.ts
export function selectCombatViewModel(
  state: GameState,
  localUi?: CombatLocalUi
): CombatViewModel {
  const combat = state.combat;
  
  // Engine truth → Mobile UI concerns
  return {
    isInCombat: combat !== null,
    phase: combat?.phase ?? 'choosing_stance',
    enemy: {
      name: combat?.enemy?.name?.toUpperCase() ?? '',
      hp: combat?.enemy?.health ?? 0,
      hpRatio: safeRatio(combat?.enemy?.health, combat?.enemy?.maxHealth),
      // ... mobile-specific formatting
    },
    // ... rest of view model
  };
}
```

### 4. Component Consumption

React components read ONLY from view models, never from engine state directly:

```tsx
// app/(tabs)/combat.tsx
export default function CombatScreen() {
  const vm = useCombatViewModel({ selectedStance: localStance });
  const actions = useGameActions();
  
  return (
    <View>
      <Text>{vm.enemy.name}</Text>
      <HealthBar ratio={vm.enemy.hpRatio} />
      <Button onPress={() => actions.selectStance('heart')}>
        {vm.stancePicker.options[0].label}
      </Button>
    </View>
  );
}
```

## Mobile-Specific Concerns

### UI State vs Game State

The architecture distinguishes between **engine state** (persisted game truth) and **ephemeral UI state** (mobile-only presentation concerns):

| Concern | Belongs To | Example |
|---------|------------|---------|
| Combat phase | Engine | `'choosing_stance'`, `'resolving'` |
| Player HP | Engine | `{ health: 45, maxHealth: 100 }` |
| Stance preview | Mobile | User hovering over Heart stance card |
| Modal visibility | Mobile | Skill picker expanded state |
| Animation state | Mobile | Damage number fade transition |

Ephemeral UI state flows through the `localUi` parameter:

```typescript
interface CombatLocalUi {
  selectedStance?: StanceKey;    // Preview before commit
  selectedSkillId?: string;      // Skill picker selection
  // NO game logic — just mobile presentation state
}
```

### Mobile UI Transformations

Presenters handle mobile-specific transformations that the engine shouldn't know about:

#### 1. Format Conversion
```typescript
// Engine: raw numbers
combat.enemy.health = 42;
combat.enemy.maxHealth = 100;

// Mobile: UI-ready ratios and display strings
vm.enemy.hpRatio = 0.42;  // For progress bars
vm.enemy.hpDisplay = "42 / 100";  // For text labels
```

#### 2. Mobile Constraints
```typescript
// Engine: unlimited effects list
player.effects = [poison, regen, shield, haste, fury, blessing, ...];

// Mobile: capped for small screens
vm.player.effects = player.effects.slice(0, MAX_EFFECTS_SHOWN);
```

#### 3. Touch Interaction Patterns
```typescript
// Engine: stance relationships
determineAdvantage('heart', 'body') // → 'advantage'

// Mobile: touch-friendly stance picker
vm.stancePicker.options = [
  {
    key: 'heart',
    label: 'HEART',
    advantage: 'adv',           // Simplified for chips
    counters: 'BODY',           // "Heart beats Body"
    gloss: 'parley, mercy',     // Flavor for mobile cards
    // ...
  }
];
```

### React Native-Specific Adaptations

#### Accessibility Integration
```typescript
// Mobile adds a11y props the engine doesn't need
vm.a11y = {
  stanceHeart: 'Choose Heart stance, beats Body, weak to Mind',
  playerHp: `You have ${player.hp} of ${player.hpMax} health`,
  // ... screen reader optimized descriptions
};
```

#### Performance Optimizations
```typescript
// Mobile-only caching and memoization
export function useCombatViewModel(localUi: CombatLocalUi = {}): CombatViewModel {
  const combat = useGameState(s => s.combat);     // Zustand subscriptions
  const player = useGameState(s => s.player);
  
  return useMemo(() => 
    selectCombatViewModel({ combat, player }, localUi),
    [combat, player, localUi.selectedStance]      // React-level caching
  );
}
```

## Integration Boundaries

### What Lives Where

| Component | Responsibility | Examples |
|-----------|----------------|----------|
| **Engine** | Game rules, state mutations, calculations | Damage formulas, stance advantages, skill effects |
| **Presenters** | State-to-UI translation, mobile formatting | HP ratios, truncated lists, display strings |
| **Components** | Visual rendering, touch handling, React lifecycle | StyleSheets, animations, gesture handling |

### Error Boundary Example

When a bug occurs, the architecture helps isolate the problem:

```
Bug: "Heart stance shows wrong advantage against Body enemy"

Investigation path:
1. Is the engine calculation wrong?
   → Check determineAdvantage('heart', 'body') in engine tests
2. Is the presenter mapping wrong?
   → Check stanceAdvantage() in combat.engine.ts
3. Is the component display wrong?
   → Check StanceCard rendering of vm.advantage prop
```

### Migration Patterns

When the engine evolves, mobile follows a predictable upgrade path:

```
Engine 0.15.0 → 0.16.0: New skill resource system

Mobile migration:
1. Update npm dependency: axiomancer-mechanics@^0.16.0
2. Update presenters: combat.engine.ts skill picker logic  
3. Update components: New resource displays (if needed)
4. Update tests: New presenter contracts

UI components rarely change for engine upgrades
```

## Common Patterns

### 1. Engine Truth with Mobile Polish

```typescript
// Engine provides raw data
const skillDamage = calculateSkillDamage(caster, skill);

// Mobile adds presentation concerns
const effectText = `${skillDamage} DMG · BLEED 2 (3R)`;
const costText = `2 BOD · 1 PRX`;  // Resource cost formatting
```

### 2. Defensive Fallbacks

```typescript
// Engine state might be incomplete during transitions
const enemyName = combat?.enemy?.name ?? '';
const displayName = enemyName.toUpperCase() || 'ADVERSARY';  // Never show empty
```

### 3. Engine Action Dispatch

```typescript
// Mobile triggers engine actions, never duplicates engine logic
const actions = useGameActions();

// ✅ Correct: Let engine handle the logic
actions.selectStance('heart');
actions.resolveCombatRound();

// ❌ Wrong: Mobile inventing game rules  
setPlayerHp(prev => Math.max(0, prev - damage));
```

## Mobile Development Context for Engine Newcomers

### Understanding the Mobile-Specific Challenge

If you're coming from web development or engine work, React Native introduces unique constraints that affect how we integrate with `axiomancer-mechanics`:

#### Touch vs Click Interfaces
```typescript
// Web: click handlers on small targets work fine
<button onClick={handleStanceSelect}>Heart</button>

// Mobile: need 44pt touch targets, visual feedback
<TouchableOpacity 
  onPress={handleStanceSelect}
  style={{ minHeight: 44, minWidth: 44 }}
  accessibilityRole="button"
>
  <StanceCard stance="heart" />
</TouchableOpacity>
```

#### Screen Size Constraints
```typescript
// Engine: provides all available skills (could be 20+)
const allSkills = engine.getPlayerSkills();

// Mobile: must limit to fit screen real estate
const visibleSkills = allSkills
  .slice(0, MOBILE_SKILL_LIMIT)  // Show only 6 skills
  .map(skill => ({
    ...skill,
    shortName: truncateForMobile(skill.name)  // "Lightning Bolt" → "Lightning"
  }));
```

#### Performance Considerations
```typescript
// Engine: full game state updates every action
const gameState = engine.getFullState();  // Large object with all data

// Mobile: selective subscriptions to prevent re-renders
const combatData = useGameState(state => ({
  phase: state.combat?.phase,
  playerHp: state.player.health,
  // Only the data this component actually renders
}));
```

#### Platform-Specific Adaptations
```typescript
// Engine: provides semantic game actions
engine.executeSkill('lightning-bolt');

// Mobile: adds haptic feedback, sound, platform-appropriate animations
const handleSkillCast = (skillId: string) => {
  // Platform-specific feedback
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
  
  // Engine action (platform-agnostic)
  actions.executeSkill(skillId);
  
  // Mobile animation (React Native)
  animateSkillCast();
};
```

### Common Mobile Integration Patterns

#### 1. Responsive Data Shaping
```typescript
// Engine gives us precise values
const damage = 127;
const maxDamage = 200;

// Mobile adapts for different screen densities  
const mobileDisplay = {
  // iPhone SE: show abbreviated
  short: "127",
  // iPad: show full context
  full: "127 / 200 damage",
  // Screen reader: verbose description
  a11y: "Dealt 127 out of maximum 200 damage points"
};
```

#### 2. Touch Gesture Translation
```typescript
// Engine: discrete stance selection
engine.selectStance('heart');

// Mobile: gesture-driven card swapping
const handleStanceSwipe = (gestureState: PanGestureHandlerStateChangeEvent) => {
  const velocity = gestureState.velocityX;
  
  if (Math.abs(velocity) > SWIPE_THRESHOLD) {
    const direction = velocity > 0 ? 'next' : 'prev';
    const newStance = getAdjacentStance(currentStance, direction);
    actions.selectStance(newStance);
  }
};
```

#### 3. Mobile State Coordination
```typescript
// Engine manages game flow
const combatPhase = engine.getCombatPhase();

// Mobile coordinates with navigation stack
useEffect(() => {
  if (combatPhase === 'victory') {
    navigation.navigate('Aftermath', { type: 'victory' });
  }
}, [combatPhase, navigation]);
```

## For Engine Integration Newcomers

### Quick Start Checklist

1. **Understand mobile constraints first**: Touch targets, screen size, performance
2. **Read the presenter docs**: [`docs/presenters.md`](./presenters.md)
3. **Study mobile-specific adaptations**: Above patterns section
4. **Examine a complete example**: [`state/presenters/combat.engine.ts`](../state/presenters/combat.engine.ts)
5. **Follow the data flow**: Engine state → Mobile Presenter → React Native Component
6. **Test the boundary**: Every presenter has hermetic tests in `state/e2e/`

### Key Files to Understand

| File | Purpose |
|------|---------|
| `state/GameStoreProvider.tsx` | Engine store → React bindings |
| `state/presenters/*.engine.ts` | Engine state → view model translation |
| `state/e2e/*.engine.test.ts` | Presenter contract tests |
| `docs/adr/ADR-0001-*.md` | Architectural decision rationale |

### Mental Model

Think of mobile as a **smart display** for the engine:
- The engine is the "computer" (logic, rules, truth)
- The presenters are the "translator" (engine data → mobile format)  
- The components are the "screen" (pixels, touches, animations)

The engine never knows about React, mobile, or UI concerns. Mobile never reimplements combat math, randomness, or game progression. The presenter layer keeps these concerns cleanly separated.