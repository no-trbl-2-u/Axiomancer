// Phase 110 — Faction module barrel exports

// Types
export type { FactionReputation, FactionReputations, FactionReputationDelta, FactionInfo } from './types';

// Engine
export {
    FACTION_REPUTATION_MIN,
    FACTION_REPUTATION_MAX,
    DEFAULT_FACTION_REPUTATION,
    clampFactionReputation,
    createDefaultFactionReputations,
    applyFactionReputationDeltas,
    getFactionReputation
} from './faction.engine';

// Library
export { factionLibrary, getFactionInfo, getAllFactions } from './faction.library';