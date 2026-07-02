# Phase 11 — RNG seeding and test harness

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

Replace `Math.random()` with a seedable RNG abstraction. Module-level singleton `setRng(rng)` / `getRng()` with hand-rolled LCG implementation. All randomness call sites use `getRng().random()`. CLI supports `--seed=foo` for deterministic replays. Save state captures and restores RNG state. Python harness accepts scripts with seeded inputs and effect assertions. Two identical seed runs produce byte-identical transcripts.

## Source spec

`specs/11-rng-seeding-and-test-harness.md` — answers for all open questions:

1. RNG type: Hand-rolled LCG (no dependencies)
2. Injection model: Module-level singleton `setSeed(seed)` / `getRng()`
3. CLI seed argument: `--seed=foo` flag support
4. Save state seed: Yes, RNG state persists in saved games
5. Scripted input format: JSON with `{ seed, actions: ['heart', 'attack', ...] }`
6. Assertion model: Each script ends with `EXPECT effect <id> intensity == N` lines
7. Effect-state dump format: Per-round JSON dump when `COMBAT_DEBUG=1`

## Implementation units (commit per unit)

### Unit 1 — `Utils/rng.ts` module

File: `src/Utils/rng.ts`

```typescript
/**
 * Seedable RNG abstraction. Replaces Math.random() throughout the codebase.
 * Uses a simple Linear Congruential Generator (LCG) for deterministic output.
 */

export interface Rng {
    /** Returns a floating-point value in [0, 1) */
    random(): number;
    /** Get current seed state for persistence */
    getState(): number;
    /** Restore seed state from persistence */
    setState(state: number): void;
}

/** Simple LCG implementation (Park and Miller constants) */
class SimpleRng implements Rng {
    private seed: number;
    
    constructor(seed: number = Date.now()) {
        this.seed = this.normalizeSeed(seed);
    }
    
    private normalizeSeed(seed: number): number {
        // Ensure seed is positive and within LCG range
        return Math.abs(seed % 2147483647) || 1;
    }
    
    random(): number {
        // Park and Miller LCG: (a * seed) % m
        this.seed = (this.seed * 48271) % 2147483647;
        return this.seed / 2147483647;
    }
    
    getState(): number {
        return this.seed;
    }
    
    setState(state: number): void {
        this.seed = this.normalizeSeed(state);
    }
}

// Module-level singleton
let globalRng: Rng = new SimpleRng();

/** Set global RNG instance (for seeding or testing) */
export function setRng(rng: Rng): void {
    globalRng = rng;
}

/** Get global RNG instance */
export function getRng(): Rng {
    return globalRng;
}

/** Convenience: seed the global RNG with a string or number */
export function setSeed(seed: string | number): void {
    const numericSeed = typeof seed === 'string' ? hashString(seed) : seed;
    globalRng = new SimpleRng(numericSeed);
}

/** Simple string hash for seed conversion */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) || 1;
}
```

Commit: `feat(utils): seedable RNG module with LCG implementation`

### Unit 2 — Replace `Math.random()` in Utils

File: `src/Utils/index.ts`

Replace `randomInt` to use seeded RNG:

```typescript
import { getRng } from './rng';

export function randomInt(min: number, max: number): number {
    return Math.floor(getRng().random() * (max - min + 1)) + min;
}
```

Update `createDie` to accept optional RNG:

```typescript
export function createDie(sides: number, timesRolled: number, func?: (arr: number[]) => number, rng?: Rng) {
    const rngInstance = rng ?? getRng();
    return () => {
        const rolls = Array.from({ length: timesRolled }, () => 
            Math.floor(rngInstance.random() * sides) + 1
        );
        return (func ?? sum)(rolls);
    };
}
```

Add import for Rng type:
```typescript
import { Rng } from './rng';
```

Commit: `feat(utils): replace Math.random() with seeded RNG in dice helpers`

### Unit 3 — Replace randomness in Combat module

File: `src/Combat/resist.ts`

```typescript
import { getRng } from '../Utils/rng';

// Replace all Math.random() calls with getRng().random()
// Example:
const critRoll = getRng().random();
const fumbleRoll = getRng().random();
```

File: `src/Combat/effects.ts`

```typescript
import { getRng } from '../Utils/rng';

// Replace random buff operations with seeded RNG
const stripRoll = getRng().random();
```

Commit: `feat(combat): replace Math.random() with seeded RNG in combat systems`

### Unit 4 — Replace randomness in Enemy logic

File: `src/Enemy/enemy.logic.ts`

```typescript
import { getRng } from '../Utils/rng';

export function randomLogic(enemy: Enemy, combat: CombatState): Action {
    const roll = getRng().random();
    const actions: Action[] = ['attack', 'defend', 'focus'];
    return actions[Math.floor(roll * actions.length)]!;
}
```

Commit: `feat(enemy): replace Math.random() with seeded RNG in AI logic`

### Unit 5 — CLI seed support

File: `src/CLI/combat.cli.ts`

Add seed argument parsing and setup:

```typescript
import { setSeed, getRng } from '../Utils/rng';

// Parse --seed argument
const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
if (seedArg) {
    const seed = seedArg.split('=')[1];
    setSeed(seed!);
    console.log(`Combat seeded with: ${seed}`);
    console.log(`Initial RNG state: ${getRng().getState()}`);
}
```

Update help text to document seed flag.

Commit: `feat(cli): add --seed flag support to combat CLI`

### Unit 6 — Save state RNG persistence

File: `src/Game/types.d.ts`

Add RNG state to GameState:

```typescript
export interface GameState {
    version: number;
    player: Character;
    world: WorldState;
    combat: CombatState | null;
    currentEncounter?: Encounter;
    quests: QuestLog;
    flags: string[];
    moralMeter: number;
    rngState: number; // NEW: RNG seed state
}
```

File: `src/Game/game.reducer.ts`

Update save/load to handle RNG state:

```typescript
import { getRng, setRng } from '../Utils/rng';

// In createNewGameState:
export function createNewGameState(): GameState {
    return {
        // ... existing fields ...
        rngState: getRng().getState(),
    };
}

// Add RNG state sync in gameReducer:
case 'SAVE_GAME': {
    return {
        ...state,
        rngState: getRng().getState(),
    };
}

case 'LOAD_GAME': {
    // RNG state restoration handled by persistence layer
    return state;
}
```

Update persistence adapter to restore RNG:

File: `src/Game/store.ts`

```typescript
import { getRng } from '../Utils/rng';

// In createGameStore, after loading:
const loadGame = async () => {
    const loaded = await adapter.load();
    if (loaded) {
        getRng().setState(loaded.rngState);
        set(loaded);
    }
};
```

Commit: `feat(game): persist and restore RNG state in save/load`

### Unit 7 — Save migration for RNG state

File: `src/Game/game.migrate.ts`

Add migration for new `rngState` field:

```typescript
import { getRng } from '../Utils/rng';

export function migrate(raw: unknown, fromVersion: number, toVersion: number): GameState {
    if (fromVersion === 2 && toVersion === 3) {
        return {
            ...(raw as GameState),
            moralMeter: 0,
        };
    }
    
    if (fromVersion === 3 && toVersion === 4) {
        // Add rngState field for saves that don't have it
        return {
            ...(raw as GameState),
            rngState: getRng().getState(), // Use current RNG state as default
        };
    }
    
    // ... existing migrations ...
}
```

Bump version to 4:

```typescript
export const GAME_STATE_VERSION = 4;
```

Commit: `feat(game): save migration v3→v4 for RNG state field`

### Unit 8 — Debug state dumps

File: `src/Combat/debug.ts`

```typescript
import { EffectTier } from '../Effects/types';
import { CombatState } from './types';

export interface EffectStateDump {
    round: number;
    rngState: number;
    playerEffects: Array<{ id: string; intensity: number; tier: EffectTier }>;
    enemyEffects: Array<{ id: string; intensity: number; tier: EffectTier }>;
}

export function dumpEffectState(combat: CombatState, round: number, rngState: number): EffectStateDump {
    return {
        round,
        rngState,
        playerEffects: combat.player.effects.map(e => ({
            id: e.id,
            intensity: e.intensity,
            tier: e.tier,
        })),
        enemyEffects: combat.enemy.effects.map(e => ({
            id: e.id,
            intensity: e.intensity,
            tier: e.tier,
        })),
    };
}
```

Wire into combat resolver when `COMBAT_DEBUG=1`:

File: `src/Combat/combat.resolver.ts`

```typescript
import { dumpEffectState } from './debug';
import { getRng } from '../Utils/rng';

// At end of resolveCombatRound:
if (process.env.COMBAT_DEBUG === '1') {
    const dump = dumpEffectState(newCombat, newCombat.round, getRng().getState());
    console.log('EFFECT_DUMP:', JSON.stringify(dump));
}
```

Commit: `feat(combat): effect state dumps for debugging and testing`

### Unit 9 — Python harness script support

File: `automation/combat-test.py`

Extend to accept `--script` and `--seed` flags:

```python
import argparse
import json
import re
from typing import List, Dict, Any

def parse_expectations(lines: List[str]) -> List[Dict[str, Any]]:
    """Parse EXPECT lines from script."""
    expectations = []
    for line in lines:
        if line.startswith('EXPECT '):
            # Parse: EXPECT effect tier1_mind_mark intensity == 3
            match = re.match(r'EXPECT effect (\w+) intensity == (\d+)', line)
            if match:
                expectations.append({
                    'type': 'effect_intensity',
                    'effect_id': match.group(1),
                    'expected': int(match.group(2)),
                })
    return expectations

def run_script_test(script_path: str, seed: str = None) -> bool:
    """Run scripted combat test and verify expectations."""
    with open(script_path, 'r') as f:
        content = f.read()
    
    # Parse JSON header or plain action list
    try:
        script_data = json.loads(content)
        actions = script_data['actions']
        script_seed = script_data.get('seed', seed)
    except json.JSONDecodeError:
        # Fallback: treat as plain text action list
        lines = content.strip().split('\n')
        expect_lines = [l for l in lines if l.startswith('EXPECT ')]
        action_lines = [l for l in lines if not l.startswith('EXPECT ') and l.strip()]
        actions = action_lines
        script_seed = seed
    
    expectations = parse_expectations(content.split('\n'))
    
    # Run CLI with scripted inputs and seed
    cmd = ['node', 'dist/CLI/combat.cli.js']
    if script_seed:
        cmd.extend(['--seed', script_seed])
    
    # ... rest of implementation drives CLI and parses output ...
    
    return True  # Implementation would verify expectations

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--script', help='Script file to run')
    parser.add_argument('--seed', help='RNG seed')
    args = parser.parse_args()
    
    if args.script:
        success = run_script_test(args.script, args.seed)
        exit(0 if success else 1)
```

Commit: `feat(automation): script support in Python combat harness`

### Unit 10 — Sample regression scripts

File: `automation/scripts/mind-mark-stack.json`

```json
{
    "seed": "mind_test_001",
    "actions": [
        "mind", "attack",
        "mind", "attack", 
        "mind", "attack"
    ],
    "expectations": [
        "EXPECT effect tier1_mind_mark intensity == 3"
    ]
}
```

File: `automation/scripts/ad-baculum-clear.json`

```json
{
    "seed": "clear_test_001", 
    "actions": [
        "body", "attack",
        "body", "attack", 
        "body", "attack",
        "mind", "attack"
    ],
    "expectations": [
        "EXPECT effect ad_baculum intensity == 0",
        "EXPECT effect tier1_mind_mark intensity == 1"
    ]
}
```

File: `automation/scripts/heart-buff-strip.json`

```json
{
    "seed": "strip_test_001",
    "actions": [
        "heart", "attack"
    ],
    "expectations": [
        "EXPECT enemy_buffs_count < initial_buffs_count"
    ]
}
```

Commit: `feat(automation): sample regression test scripts`

### Unit 11 — Export RNG from barrel

File: `src/index.ts`

```typescript
// ── RNG ──────────────────────────────────────────────────────────────────────
export { Rng, setRng, getRng, setSeed } from './Utils/rng';
```

Commit: `feat(utils): export RNG abstraction from barrel`

### Unit 12 — Hermetic e2e test

File: `src/Utils/e2e/rng.engine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setRng, getRng, setSeed, SimpleRng } from '../rng';
import { randomInt } from '../index';

describe('RNG engine', () => {
    beforeEach(() => {
        // Reset to default for each test
        setSeed('test_seed');
    });
    
    it('produces identical sequences for same seed', () => {
        setSeed('identical_test');
        const sequence1 = Array.from({ length: 10 }, () => getRng().random());
        
        setSeed('identical_test');
        const sequence2 = Array.from({ length: 10 }, () => getRng().random());
        
        expect(sequence1).toEqual(sequence2);
    });
    
    it('produces different sequences for different seeds', () => {
        setSeed('seed_a');
        const sequenceA = Array.from({ length: 10 }, () => getRng().random());
        
        setSeed('seed_b');
        const sequenceB = Array.from({ length: 10 }, () => getRng().random());
        
        expect(sequenceA).not.toEqual(sequenceB);
    });
    
    it('integrates with randomInt helper', () => {
        setSeed('dice_test');
        const rolls1 = Array.from({ length: 20 }, () => randomInt(1, 20));
        
        setSeed('dice_test');
        const rolls2 = Array.from({ length: 20 }, () => randomInt(1, 20));
        
        expect(rolls1).toEqual(rolls2);
        expect(rolls1.every(r => r >= 1 && r <= 20)).toBe(true);
    });
    
    it('persists and restores state correctly', () => {
        setSeed('state_test');
        
        // Generate some numbers to advance the state
        getRng().random();
        getRng().random();
        const stateAfterTwo = getRng().getState();
        
        const nextValue = getRng().random();
        
        // Restore state and verify next value matches
        getRng().setState(stateAfterTwo);
        expect(getRng().random()).toBe(nextValue);
    });
});
```

Commit: `test(utils): hermetic e2e for seedable RNG system`

### Unit 13 — Update automation README

File: `automation/README.md`

Update with new flags and script format:

```markdown
# Combat Testing Automation

## Flags

- `--script <path>`: Run scripted combat with predefined inputs
- `--seed <seed>`: Set RNG seed for deterministic runs

## Script Format

Scripts are JSON files with actions and expectations:

```json
{
    "seed": "test_001",
    "actions": ["mind", "attack", "mind", "attack"],
    "expectations": [
        "EXPECT effect tier1_mind_mark intensity == 2"
    ]
}
```

## Usage

```bash
npm run auto:combat --script scripts/mind-mark-stack.json
npm run auto:combat --seed deterministic_test
```
```

Commit: `docs(automation): document script and seed flags`

## Decisions made upfront — DO NOT ASK

- **RNG implementation:** Hand-rolled LCG using Park and Miller constants (no dependencies).
- **Injection model:** Module-level singleton with `setRng()` / `getRng()` global access.
- **String seed hashing:** Simple character code hash for seed conversion.
- **CLI argument:** `--seed=value` flag parsing in combat CLI.
- **Save integration:** `rngState` field in `GameState`, restored on load.
- **Debug format:** JSON dumps when `COMBAT_DEBUG=1` environment variable set.
- **Script format:** JSON with `{ seed, actions, expectations }` structure.
- **Expectation syntax:** `EXPECT effect <id> intensity == <number>` text format.
- **Migration path:** Bump to v4, existing saves default to current RNG state.
- **Hermetic testing:** Replace test-utils to use seeded RNG instead of vi.spyOn mocks.

## Verify gate

```bash
npm run type-check   # must pass
npm test             # includes rng.engine.test.ts
npm run build        # must produce dist/ without error
```

## Commit body template

```
feat(utils): phase 11 — RNG seeding and test harness

- Seedable RNG module with LCG implementation  
- Module-level singleton setRng()/getRng() API
- Replace Math.random() across Utils, Combat, Enemy modules
- CLI --seed flag support for deterministic runs
- Save/load persists and restores RNG state
- Debug effect state dumps when COMBAT_DEBUG=1
- Python harness accepts script files and seed flag
- Sample regression test scripts for common scenarios

Decisions:
- Hand-rolled LCG over npm dependencies for minimal footprint
- Module singleton over function threading for simpler migration
- JSON script format over plain text for structured expectations  
- String seed hashing for CLI usability
```

## Definition of Done

- [ ] `src/Utils/rng.ts` module with LCG implementation exported
- [ ] `setRng`, `getRng`, `setSeed` functions exported from barrel
- [ ] All `Math.random()` calls replaced with `getRng().random()`
- [ ] Combat CLI accepts `--seed=value` flag
- [ ] `GameState.rngState` field persisted in save/load cycle
- [ ] Save migration handles v3→v4 transition with RNG state
- [ ] `COMBAT_DEBUG=1` enables effect state JSON dumps
- [ ] Python harness accepts `--script` and `--seed` flags
- [ ] At least 3 regression test scripts committed
- [ ] `src/Utils/e2e/rng.engine.test.ts` green
- [ ] `automation/README.md` documents new flags
- [ ] Two runs with same seed produce identical CLI output
- [ ] `npm run verify` green
- [ ] `specs/11-rng-seeding-and-test-harness.md` acceptance checklist ticked

## Follow-ups (out of scope for this phase)

- Migrating existing unit tests to use seeded RNG instead of vi.spyOn mocks
- Full property-testing framework for combat scenarios  
- Web UI seed input for replay debugging
- Parallel test execution with isolated RNG instances
- Performance benchmarks vs Math.random()