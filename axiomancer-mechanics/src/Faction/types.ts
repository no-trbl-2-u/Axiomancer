/**
 * Phase 110 — Faction reputation system for boss befriend consequences.
 *
 * Tracks the player's standing with various political factions across regions.
 * Boss Befriend outcomes can alter faction reputation: sparing/befriending a
 * boss in one region costs reputation with one faction and gains with another.
 */

/**
 * A single faction's reputation value. Integer in [-100, +100] where:
 * -100 = hostile, 0 = neutral, +100 = allied.
 */
export type FactionReputation = number;

/**
 * Player's reputation with all known factions. Keyed by faction identifier.
 * Missing factions default to 0 (neutral).
 */
export interface FactionReputations {
    [factionId: string]: FactionReputation;
}

/**
 * Reputation changes applied to the player's faction standings.
 * Used in FriendshipReward.factionDeltas and similar contexts.
 */
export interface FactionReputationDelta {
    [factionId: string]: number;
}

/**
 * Metadata about a faction for display purposes.
 */
export interface FactionInfo {
    /** Stable identifier used as the key in FactionReputations */
    id: string;
    /** Human-readable faction name */
    name: string;
    /** Brief description of the faction's goals/nature */
    description: string;
}