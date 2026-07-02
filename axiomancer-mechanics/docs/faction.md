# Faction — Reputation system for boss befriend consequences (Phase 110)

> Engine module: `src/Faction/`. Reducer wiring: `src/Game/game.reducer.ts`.
> Combat integration: `src/Game/store.ts` END_COMBAT resolution.

The faction reputation system tracks the player's standing with various
political factions across regions. Boss Befriend outcomes can alter these
standings through reputation tradeoffs: sparing/befriending a boss in one
region costs reputation with one faction and gains reputation with another.

The system demonstrates **consequence-bearing mercy** rather than reward-only
pacifism, making friendship decisions carry meaningful political weight.

## Reputation values

Each faction reputation is an integer in `[-100, +100]`:

| Value range | Standing |
|---|---|
| `-100` to `-51` | Hostile |
| `-50` to `-1` | Unfriendly |
| `0` | Neutral |
| `+1` to `+50` | Friendly |
| `+51` to `+100` | Allied |

Missing factions default to `0` (neutral). Reputation changes clamp to the
valid range automatically.

## Faction registry

The `factionLibrary` contains metadata for all known factions:

```typescript
export const factionLibrary: Record<string, FactionInfo> = {
    'coastal-guard': {
        id: 'coastal-guard',
        name: 'Coastal Guard',
        description: 'Maritime defenders who protect fishing villages and trade routes'
    },
    'inland-clans': {
        id: 'inland-clans', 
        name: 'Inland Clans',
        description: 'Traditional mountain tribes with ancient customs and territorial claims'
    },
    'merchant-guild': {
        id: 'merchant-guild',
        name: "Merchant's Guild", 
        description: 'Commercial confederation focused on trade and economic prosperity'
    },
    'forest-wardens': {
        id: 'forest-wardens',
        name: 'Forest Wardens',
        description: 'Environmental guardians who preserve the natural balance'
    }
};
```

Use `getFactionInfo(factionId)` to lookup metadata or `getAllFactions()` to
enumerate all known factions.

## Engine API

All exports are surfaced through `src/index.ts`:

### Core engine

```typescript
// Reputation management
function clampFactionReputation(reputation: number): number;
function createDefaultFactionReputations(): FactionReputations;
function applyFactionReputationDeltas(
    currentReputations: FactionReputations, 
    deltas: FactionReputationDelta
): FactionReputations;
function getFactionReputation(reputations: FactionReputations, factionId: string): number;

// Constants
const FACTION_REPUTATION_MIN = -100;
const FACTION_REPUTATION_MAX = 100;
const DEFAULT_FACTION_REPUTATION = 0;
```

### Faction registry

```typescript
// Faction library
const factionLibrary: Record<string, FactionInfo>;
function getFactionInfo(factionId: string): FactionInfo | undefined;
function getAllFactions(): FactionInfo[];
```

### Types

```typescript
type FactionReputation = number;  // [-100, +100]

interface FactionReputations {
    [factionId: string]: FactionReputation;
}

interface FactionReputationDelta {
    [factionId: string]: number;
}

interface FactionInfo {
    id: string;
    name: string;
    description: string;
}
```

## Game state integration

Faction reputation lives on `GameState.factionReputations: FactionReputations`.
It persists across save/load cycles and carries forward on run resets when
`keepCharacter: true` (faction standings are character knowledge).

## Boss befriend integration

Boss enemies can carry `friendshipReward.factionDeltas: FactionReputationDelta`
to specify reputation changes on befriend outcomes:

```typescript
// Example boss with faction consequences  
const disagreementBoss = createEnemy({
    // ... other boss properties
    friendshipReward: {
        // ... other rewards (items, XP, narrative)
        factionDeltas: {
            'merchant-guild': -10,    // lose: they valued its philosophical constraints
            'forest-wardens': +12,    // gain: appreciate dialectical harmony
        }
    }
});

// Another example: The Coastal Tyrant
const coastalTyrantBoss = createEnemy({
    // ... other boss properties
    friendshipReward: {
        // ... other rewards (items, XP, narrative)
        factionDeltas: {
            'coastal-guard': -8,      // lose: they lose their corrupt protector
            'merchant-guild': +10,    // gain: trade can flourish without corruption
        }
    }
});
```

On friendship victory, the `END_COMBAT` reducer applies deltas via
`applyFactionReputationDeltas` and surfaces the post-clamp values on
`CombatEndReport.friendshipReward.factionReputationShift` for CLI/mobile
consumption.

## Authoring guidelines

- **Boss-tier deltas**: ±10..±15 per faction for boss encounters to demonstrate
  meaningful tradeoffs.
- **Tradeoff principle**: Boss befriend outcomes should typically involve both
  losses and gains across different factions.
- **Narrative coherence**: Faction deltas should reflect the political
  consequences of sparing the specific boss (their allegiances, what they
  represented, who valued or opposed them).

## Combat end reporting

When faction deltas apply on friendship outcomes:

```typescript
interface CombatEndReport {
    // ... other fields
    friendshipReward?: {
        // ... other friendship rewards
        factionReputationShift?: { [factionId: string]: number };
    };
}
```

The `factionReputationShift` contains post-clamp reputation values for factions
that changed. Only factions with actual deltas are included.

## Example usage

```typescript
// Check current reputation
const coastalStanding = getFactionReputation(state.factionReputations, 'coastal-guard');

// Apply boss befriend consequences
const newReputations = applyFactionReputationDeltas(
    state.factionReputations,
    { 'coastal-guard': -15, 'merchant-guild': +10 }
);

// Get faction metadata for UI
const coastalInfo = getFactionInfo('coastal-guard');
console.log(`${coastalInfo.name}: ${coastalInfo.description}`);
```

## Testing

Hermetic test coverage:

- `src/Faction/e2e/faction.engine.test.ts` — core reputation engine and library
- `src/Faction/e2e/boss-befriend-integration.engine.test.ts` — full boss
  befriend flow with faction consequences applied to game state

Run `npm test` to verify all faction reputation behavior.