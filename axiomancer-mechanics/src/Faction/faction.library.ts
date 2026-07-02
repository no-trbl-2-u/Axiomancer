import { FactionInfo } from './types';

/**
 * Phase 110 — Faction library.
 *
 * Registry of known factions and their metadata. Used for display purposes
 * and ensuring consistent faction identifiers across the game.
 */

/**
 * Registry of all known factions.
 * Keyed by faction ID for quick lookup.
 */
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

/**
 * Gets faction information by ID.
 * Returns undefined if the faction is not in the library.
 */
export function getFactionInfo(factionId: string): FactionInfo | undefined {
    return factionLibrary[factionId];
}

/**
 * Gets all known faction information.
 */
export function getAllFactions(): FactionInfo[] {
    return Object.values(factionLibrary);
}