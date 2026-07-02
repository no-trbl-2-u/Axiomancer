import { FactionReputations, FactionReputationDelta } from './types';

/**
 * Phase 110 — Faction reputation engine.
 *
 * Core utilities for managing faction reputation state:
 * reputation clamping, delta application, and default state creation.
 */

/** Minimum faction reputation value. */
export const FACTION_REPUTATION_MIN = -100;

/** Maximum faction reputation value. */
export const FACTION_REPUTATION_MAX = 100;

/** Default reputation for unknown factions. */
export const DEFAULT_FACTION_REPUTATION = 0;

/**
 * Clamps a faction reputation value to the valid range [-100, +100].
 */
export function clampFactionReputation(reputation: number): number {
    return Math.max(
        FACTION_REPUTATION_MIN,
        Math.min(FACTION_REPUTATION_MAX, reputation)
    );
}

/**
 * Creates a default FactionReputations state (empty, all factions neutral).
 */
export function createDefaultFactionReputations(): FactionReputations {
    return {};
}

/**
 * Applies faction reputation deltas to the current reputation state.
 * 
 * @param currentReputations Current faction reputation state
 * @param deltas Reputation changes to apply
 * @returns New faction reputation state with deltas applied and clamped
 */
export function applyFactionReputationDeltas(
    currentReputations: FactionReputations,
    deltas: FactionReputationDelta
): FactionReputations {
    const updated = { ...currentReputations };
    
    for (const [factionId, delta] of Object.entries(deltas)) {
        const currentValue = currentReputations[factionId] ?? DEFAULT_FACTION_REPUTATION;
        updated[factionId] = clampFactionReputation(currentValue + delta);
    }
    
    return updated;
}

/**
 * Gets the reputation value for a specific faction.
 * Returns DEFAULT_FACTION_REPUTATION if the faction is unknown.
 */
export function getFactionReputation(
    reputations: FactionReputations,
    factionId: string
): number {
    return reputations[factionId] ?? DEFAULT_FACTION_REPUTATION;
}