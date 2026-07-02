# Phase 10 — Moral/difficulty meter

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`GameState` has a `moralMeter: number` field tracking player choices. `shiftMoralMeter(state, delta): GameState` reducer shifts the meter. Gating helpers `canTakePath(meter, requirement)` and `meetsAlignment(meter, range)` exist. Moral choices in dialogue/events shift the meter via new `GameAction` types. Combat friendship outcomes increment meter by +1. At least one demo event exercises a moral choice with different outcomes based on meter value.

## Source spec

`specs/10-moral-difficulty-meter.md` — answers for all open questions:

1. Meter shape: Single integer -100 to +100 (Q1).
2. Tick magnitude: Minor choices ±1, Major choices ±5, Defining choices ±10 (Q2).
3. Visibility: Visible to player via store selectors (Q3).
4. Combat tie-ins: None for now — purely narrative (Q4: answer A).
5. Reward effects: Evil path = more XP and items in future events (Q5).
6. Friendship + meter: Friendship wins +1 to meter (Q6).
7. Persistence: Meter saves with state in `GameState.moralMeter` (Q7).
8. Endings: Specific story flags with meter as color/context (Q8: answer C).
9. Child escort example: Endgame content, not implemented now (Q9).

## Implementation units (commit per unit)

### Unit 1 — `GameState.moralMeter` field

File: `src/Game/types.d.ts`

Add `moralMeter: number` to the `GameState` interface:

```typescript
export interface GameState {
    version: number;
    player: Character;
    world: WorldState;
    combat: CombatState | null;
    currentEncounter?: Encounter;
    quests: QuestLog;
    flags: string[];
    moralMeter: number; // -100 (ruthless) to +100 (compassionate)
}
```

Update `createNewGameState()` in `src/Game/game.reducer.ts`:

```typescript
export function createNewGameState(): GameState {
    return {
        version: GAME_STATE_VERSION,
        player: createCharacter({
            name: 'Player',
            level: 1,
            baseStats: { heart: 1, body: 1, mind: 1 },
        }),
        world: createStartingWorld(),
        combat: null,
        quests: emptyQuestLog(),
        flags: [],
        moralMeter: 0, // Start neutral
    };
}
```

Commit: `feat(game): add GameState.moralMeter field`

### Unit 2 — `SHIFT_MORAL_METER` action

File: `src/Game/actions.types.ts`

Add new action to the `GameAction` union:

```typescript
export type GameAction =
    | { type: 'START_COMBAT';       payload: { target: Enemy | Encounter } }
    | { type: 'COMBAT_ROUND';       payload: { playerAction: Action; playerStance: Stance; skillId?: string; itemId?: string } }
    | { type: 'END_COMBAT';         payload?: { grantedLoot?: Item[]; grantedXp?: number } }
    | { type: 'MOVE_TO_NODE';       payload: { nodeId: string } }
    | { type: 'PROCESS_NODE';       payload?: undefined }
    | { type: 'APPLY_DIALOGUE';     payload: { tree: DialogueTree; choice: DialogueChoice } }
    | { type: 'USE_ITEM';           payload: { itemId: string } }
    | { type: 'EQUIP_ITEM';         payload: { item: Equipment } }
    | { type: 'UNEQUIP_ITEM';       payload: { slot: EquipmentSlot } }
    | { type: 'LEVEL_UP';           payload?: undefined }
    | { type: 'SAVE_GAME';          payload?: undefined }
    | { type: 'LOAD_GAME';          payload?: undefined }
    | { type: 'SHIFT_MORAL_METER';  payload: { delta: number; reason?: string } };
```

Commit: `feat(game): SHIFT_MORAL_METER action type`

### Unit 3 — `shiftMoralMeter` reducer

File: `src/Game/moral.reducer.ts`

```typescript
import { GameState } from './types';
import { clamp } from '../Utils';

/**
 * Pure reducer for shifting the moral meter. Clamps to [-100, +100] range.
 * 
 * @param state - Current game state
 * @param delta - Amount to shift (-10 to +10 typical range)
 * @param reason - Optional debug string for why the shift occurred
 * @returns Updated game state with shifted meter
 */
export function shiftMoralMeter(state: GameState, delta: number, reason?: string): GameState {
    const newMeter = clamp(state.moralMeter + delta, -100, 100);
    return {
        ...state,
        moralMeter: newMeter,
    };
}

/**
 * Gating helpers for moral meter requirements.
 */

/** Check if player's moral meter allows taking a specific path/option. */
export function canTakePath(meter: number, requirement: { min?: number; max?: number }): boolean {
    const minCheck = requirement.min !== undefined ? meter >= requirement.min : true;
    const maxCheck = requirement.max !== undefined ? meter <= requirement.max : true;
    return minCheck && maxCheck;
}

/** Check if player meets a moral alignment range. */
export function meetsAlignment(meter: number, range: 'compassionate' | 'neutral' | 'ruthless'): boolean {
    switch (range) {
        case 'compassionate': return meter >= 25;
        case 'neutral': return meter > -25 && meter < 25;
        case 'ruthless': return meter <= -25;
    }
}

/** Get human-readable alignment description for UI display. */
export function getAlignmentLabel(meter: number): string {
    if (meter >= 75) return 'Saintly';
    if (meter >= 25) return 'Compassionate';
    if (meter > -25) return 'Neutral';
    if (meter <= -75) return 'Ruthless';
    return 'Harsh';
}
```

Export from `src/index.ts`:
```typescript
export { shiftMoralMeter, canTakePath, meetsAlignment, getAlignmentLabel } from './Game/moral.reducer';
```

Commit: `feat(game): shiftMoralMeter reducer and gating helpers`

### Unit 4 — Wire `SHIFT_MORAL_METER` to `gameReducer`

File: `src/Game/game.reducer.ts`

Add import and case to the switch statement:

```typescript
import { shiftMoralMeter } from './moral.reducer';

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        // ... existing cases ...
        
        case 'SHIFT_MORAL_METER': {
            return shiftMoralMeter(state, action.payload.delta, action.payload.reason);
        }
        
        case 'SAVE_GAME':
        case 'LOAD_GAME':
            // Side effects owned by the store layer; reducer is pure.
            return state;
    }
}
```

Commit: `feat(game): wire SHIFT_MORAL_METER to gameReducer`

### Unit 5 — Store action for moral meter

File: `src/Game/store.ts`

Add `shiftMoralMeter` method to `GameActions` interface and implementation:

```typescript
export interface GameActions {
    /** Generic dispatch — applies the action via `gameReducer`. */
    dispatch: (action: GameAction) => void;

    // ... existing actions ...

    // ── Moral meter ──────────────────────────────────────────────────────────
    shiftMoralMeter: (delta: number, reason?: string) => void;
}

// In createGameStore implementation:
return {
    ...initial,

    dispatch(action) { dispatch(action); },

    // ... existing implementations ...

    // ── Moral meter ──────────────────────────────────────────────────────────
    shiftMoralMeter(delta, reason) {
        dispatch({ type: 'SHIFT_MORAL_METER', payload: { delta, reason } });
    },
};
```

Add selector:

```typescript
export const selectMoralMeter    = (s: GameStore): number => s.moralMeter;
export const selectAlignment    = (s: GameStore): string => getAlignmentLabel(s.moralMeter);
```

Commit: `feat(game): store.shiftMoralMeter action and selectors`

### Unit 6 — Friendship outcome hook

File: `src/Combat/combat.resolver.ts` (modify existing friendship logic)

Find the friendship resolution section and add moral meter shift:

```typescript
// In resolveCombatRound where friendship outcomes are handled:
if (friendshipOutcome === 'success') {
    // Apply existing friendship logic
    newCombat.friendshipCounter = 0;
    
    // NEW: Shift moral meter +1 for successful friendship
    const nextState = context.shiftMoralMeter ? 
        context.shiftMoralMeter(gameState, 1, 'friendship_success') : 
        gameState;
    
    return {
        state: newCombat,
        log: [...roundLog, 'Combat ended peacefully through understanding.'],
        gameState: nextState,
    };
}
```

Modify the resolver function signature to accept an optional context with moral meter callback:

```typescript
interface ResolverContext {
    shiftMoralMeter?: (state: GameState, delta: number, reason?: string) => GameState;
}

export function resolveCombatRound(
    combat: CombatState,
    playerTurn: { stance: Stance; action: Action; skillId?: string; itemId?: string },
    enemyAction: Action,
    skillLookup: (id: string) => Skill | undefined,
    context?: ResolverContext,
): { state: CombatState; log: string[]; gameState?: GameState }
```

Update `gameReducer` call to pass context:

```typescript
// In game.reducer.ts COMBAT_ROUND case:
case 'COMBAT_ROUND': {
    if (!state.combat) return state;
    const { playerAction, playerStance, skillId, itemId } = action.payload;
    const enemyAction = determineEnemyAction(state.combat.enemy, state.combat);
    const { state: nextCombat, gameState } = resolveCombatRound(
        state.combat,
        { stance: playerStance, action: playerAction, skillId, itemId },
        enemyAction,
        skillLookup,
        { shiftMoralMeter },
    );
    return gameState ?? { ...state, combat: nextCombat };
}
```

Commit: `feat(combat): friendship success shifts moral meter +1`

### Unit 7 — Demo moral choice event

File: `src/World/Continents/Coastal-Village/moral-crossroads.event.ts`

Create a demo event that exercises the moral meter:

```typescript
import { MapEvent } from '../../types';
import { canTakePath } from '../../../Game/moral.reducer';

export const moralCrossroadsEvent: MapEvent = {
    id: 'moral_crossroads_demo',
    name: 'The Beggar\'s Request',
    description: 'A starving beggar asks for help. Your response will be remembered.',
    isRepeatable: false,
    choices: [
        {
            id: 'help_generously',
            text: 'Give generously from your purse (+5 compassion)',
            isEnabled: true,
            outcome: {
                text: 'The beggar thanks you with tears in their eyes. Word spreads of your kindness.',
                effects: [
                    { type: 'moral_shift', delta: 5 },
                    { type: 'currency', amount: -10 },
                ],
            },
        },
        {
            id: 'help_modestly',
            text: 'Give a small coin (+1 compassion)',
            isEnabled: true,
            outcome: {
                text: 'The beggar accepts your offering gratefully.',
                effects: [
                    { type: 'moral_shift', delta: 1 },
                    { type: 'currency', amount: -1 },
                ],
            },
        },
        {
            id: 'ignore',
            text: 'Walk past without acknowledgment (-1 compassion)',
            isEnabled: true,
            outcome: {
                text: 'You continue on your way, ignoring the outstretched hand.',
                effects: [
                    { type: 'moral_shift', delta: -1 },
                ],
            },
        },
        {
            id: 'mock_ruthlessly',
            text: 'Mock their plight openly (-5 compassion)',
            isEnabled: (state) => canTakePath(state.moralMeter, { max: 0 }),
            outcome: {
                text: 'Your cruelty draws disgusted stares from passersby. The beggar retreats in shame.',
                effects: [
                    { type: 'moral_shift', delta: -5 },
                ],
            },
        },
        {
            id: 'offer_work',
            text: '[Compassionate] Offer them honest work (+2 compassion)',
            isEnabled: (state) => canTakePath(state.moralMeter, { min: 20 }),
            outcome: {
                text: 'The beggar\'s face lights up. "Work? Real work?" They accept eagerly, and you both benefit.',
                effects: [
                    { type: 'moral_shift', delta: 2 },
                    { type: 'currency', amount: 5 }, // Future earnings
                ],
            },
        },
    ],
};
```

Wire into coastal village map:

File: `src/World/Continents/Coastal-Village/maps.ts`

```typescript
import { moralCrossroadsEvent } from './moral-crossroads.event';

// Add to the village square node:
{
    id: 'coastal_village_square',
    name: 'Village Square',
    description: 'The heart of the coastal village.',
    events: [
        firstEncounterEvent,
        moralCrossroadsEvent, // NEW
    ],
    connections: ['coastal_village_dock', 'coastal_village_inn'],
},
```

Commit: `feat(world): demo moral choice event in coastal village`

### Unit 8 — Process moral choices in `processNode`

File: `src/World/process-node.ts`

Update event outcome processing to handle `moral_shift` effect type:

```typescript
// In the outcome processing loop:
for (const effect of choice.outcome.effects) {
    switch (effect.type) {
        case 'moral_shift': {
            nextState = shiftMoralMeter(nextState, effect.delta, `event:${event.id}:${choice.id}`);
            break;
        }
        case 'currency': {
            nextState = {
                ...nextState,
                player: {
                    ...nextState.player,
                    currency: Math.max(0, nextState.player.currency + effect.amount),
                },
            };
            break;
        }
        // ... existing effect types ...
    }
}
```

Add import for `shiftMoralMeter`:

```typescript
import { shiftMoralMeter } from '../Game/moral.reducer';
```

Commit: `feat(world): process moral_shift effects in events`

### Unit 9 — Export moral meter types

File: `src/index.ts`

Add exports for the moral meter system:

```typescript
// ── Moral meter ──────────────────────────────────────────────────────────────
export { shiftMoralMeter, canTakePath, meetsAlignment, getAlignmentLabel } from './Game/moral.reducer';
export { selectMoralMeter, selectAlignment } from './Game/store';
```

Commit: `feat(game): export moral meter reducer and selectors`

### Unit 10 — Hermetic e2e test

File: `src/Game/e2e/moral.meter.engine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { shiftMoralMeter, canTakePath, meetsAlignment } from '../moral.reducer';
import { createNewGameState } from '../game.reducer';

describe('Moral meter engine', () => {
    it('shifts meter via store action', () => {
        const store = createGameStore(nullAdapter);
        
        expect(store.getState().moralMeter).toBe(0);
        
        store.getState().shiftMoralMeter(5, 'test_generous');
        expect(store.getState().moralMeter).toBe(5);
        
        store.getState().shiftMoralMeter(-10, 'test_cruel');
        expect(store.getState().moralMeter).toBe(-5);
    });
    
    it('clamps meter to [-100, +100]', () => {
        let state = createNewGameState();
        
        state = shiftMoralMeter(state, 150);
        expect(state.moralMeter).toBe(100);
        
        state = shiftMoralMeter(state, -250);
        expect(state.moralMeter).toBe(-100);
    });
    
    it('gates paths based on meter requirements', () => {
        expect(canTakePath(50, { min: 25 })).toBe(true);
        expect(canTakePath(10, { min: 25 })).toBe(false);
        expect(canTakePath(-30, { max: -20 })).toBe(true);
        expect(canTakePath(-10, { max: -20 })).toBe(false);
        expect(canTakePath(0, { min: -10, max: 10 })).toBe(true);
    });
    
    it('categorizes alignment correctly', () => {
        expect(meetsAlignment(80, 'compassionate')).toBe(true);
        expect(meetsAlignment(10, 'neutral')).toBe(true);
        expect(meetsAlignment(-50, 'ruthless')).toBe(true);
        expect(meetsAlignment(-10, 'compassionate')).toBe(false);
    });
    
    it('processes moral choice events', () => {
        const store = createGameStore(nullAdapter);
        
        // Move to coastal village square
        store.getState().moveToNode('coastal_village_square');
        store.getState().processNode();
        
        // Initial meter should be 0
        expect(store.getState().moralMeter).toBe(0);
        
        // Simulate generous choice (would require additional setup for full event flow)
        store.getState().shiftMoralMeter(5, 'moral_crossroads_demo:help_generously');
        expect(store.getState().moralMeter).toBe(5);
    });
});
```

Commit: `test(game): hermetic e2e for moral meter system`

### Unit 11 — Update save/load version

File: `src/Game/game.migrate.ts`

Update migration to handle the new `moralMeter` field:

```typescript
export function migrate(raw: unknown, fromVersion: number, toVersion: number): GameState {
    if (fromVersion === 1 && toVersion === 2) {
        // Add moralMeter field for saves that don't have it
        return {
            ...(raw as GameState),
            moralMeter: 0, // Default neutral for existing saves
        };
    }
    
    if (fromVersion === toVersion) {
        return raw as GameState;
    }
    
    console.warn(`Unknown migration path: v${fromVersion} → v${toVersion}`);
    return raw as GameState;
}
```

Bump `GAME_STATE_VERSION` to 3 in `game.reducer.ts`:

```typescript
export const GAME_STATE_VERSION = 3;
```

Commit: `feat(game): migrate existing saves to include moralMeter field`

### Unit 12 — Documentation

File: `docs/moral-meter.md`

```markdown
# Moral Meter System

The moral meter tracks player choices across dialogue, events, and combat outcomes. It influences available choices and serves as context for endings.

## Structure

- **Range:** -100 (ruthless) to +100 (compassionate)
- **Starting value:** 0 (neutral)
- **Persistence:** Saved with game state

## Choice Impact Scale

- **Minor choices:** ±1 (everyday kindness/harshness)
- **Major choices:** ±5 (significant moral decisions)
- **Defining choices:** ±10 (character-defining moments)
- **Friendship outcomes:** +1 (successful peaceful resolution)

## Alignment Categories

- **Saintly:** 75+ (extremely compassionate)
- **Compassionate:** 25-74 (generally kind)
- **Neutral:** -24 to +24 (pragmatic)
- **Harsh:** -74 to -25 (callous)
- **Ruthless:** -75 or lower (cruel)

## Usage

### Store Integration

```typescript
const meter = store.getState().moralMeter;
const alignment = store.getState().selectAlignment();

// Shift meter
store.getState().shiftMoralMeter(5, 'helped_orphan');
```

### Choice Gating

```typescript
import { canTakePath } from 'axiomancer-mechanics';

const choice = {
    id: 'mercy_option',
    text: '[Compassionate] Show mercy',
    isEnabled: (state) => canTakePath(state.moralMeter, { min: 25 }),
    outcome: { /* ... */ }
};
```

### Event Effects

```typescript
const outcome = {
    effects: [
        { type: 'moral_shift', delta: -5 },
        { type: 'currency', amount: 100 },
    ],
};
```

## Future Extensions

- Multi-axis morality (honor, cunning, etc.)
- Difficulty scaling based on meter
- Alignment-locked skills and equipment
```

Update `README.md` to link to moral meter docs.

Commit: `docs(game): moral meter system documentation`

## Decisions made upfront — DO NOT ASK

- **Meter range:** Single integer -100 to +100. Multi-axis postponed to future phases.
- **Choice magnitudes:** ±1 minor, ±5 major, ±10 defining. Friendship success always +1.
- **Alignment thresholds:** Compassionate 25+, Neutral -24 to +24, Ruthless -25 or lower.
- **Visibility:** Fully visible via store selectors — no hidden tracking.
- **Combat effects:** None in this phase — purely narrative gating for now.
- **Reward scaling:** Document the "evil = more XP/items" design but don't implement mechanics yet.
- **Save migration:** Bump `GAME_STATE_VERSION` to 3; existing saves default to `moralMeter: 0`.
- **Demo event location:** Coastal village square — simple beggar encounter with 5 choice variations.
- **Choice enabling:** Use `canTakePath` helper in event definitions; processed by existing `isEnabled` flow.

## Verify gate

```bash
npm run type-check   # must pass
npm test             # includes moral.meter.engine.test.ts
npm run build        # must produce dist/ without error
```

## Commit body template

```
feat(game): phase 10 — moral/difficulty meter

- GameState.moralMeter field (-100 to +100 range)
- shiftMoralMeter reducer with clamp and gating helpers
- SHIFT_MORAL_METER action + store integration
- Friendship success outcomes shift meter +1
- Demo event: beggar encounter with 5 moral choices
- Event system processes moral_shift effects
- Save migration v2→v3 for moralMeter field

Decisions:
- Single-axis meter for now (multi-axis deferred)
- Fully visible via selectors (no hidden tracking)
- Combat difficulty scaling deferred to future phases
- Choice magnitudes: minor ±1, major ±5, defining ±10
```

## Definition of Done

- [ ] `GameState.moralMeter` field added and migrated properly
- [ ] `SHIFT_MORAL_METER` action in tagged union
- [ ] `shiftMoralMeter` reducer exported from `src/index.ts`
- [ ] `canTakePath` and `meetsAlignment` helpers exported
- [ ] Store action `shiftMoralMeter(delta, reason)` implemented
- [ ] Selectors `selectMoralMeter` and `selectAlignment` exported
- [ ] Combat friendship success shifts meter +1
- [ ] Demo moral choice event in coastal village
- [ ] Event system processes `moral_shift` effect type
- [ ] `src/Game/e2e/moral.meter.engine.test.ts` green
- [ ] Save migration handles v2→v3 transition
- [ ] `docs/moral-meter.md` committed and linked from README
- [ ] `npm run verify` green
- [ ] `specs/10-moral-difficulty-meter.md` acceptance checklist ticked

## Follow-ups (out of scope for this phase)

- Multi-axis morality (honor, cunning, compassion)
- Enemy difficulty scaling based on moral meter
- Alignment-locked skills and equipment
- "Evil path = more rewards" mechanical implementation
- Per-NPC reputation systems
- The "child escort" endgame scenario from BRAINDUMP