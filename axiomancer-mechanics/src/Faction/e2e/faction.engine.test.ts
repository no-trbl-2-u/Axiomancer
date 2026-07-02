/**
 * @file Phase 110 — faction reputation engine e2e tests
 *
 * Hermetic tests for faction reputation state management, delta application,
 * and boss befriend outcome integration. Tests the golden path (faction deltas
 * applied on boss befriend) plus error cases (clamping, missing factions).
 */

import { describe, it, expect } from 'vitest';
import {
    clampFactionReputation,
    createDefaultFactionReputations,
    applyFactionReputationDeltas,
    getFactionReputation,
    FACTION_REPUTATION_MIN,
    FACTION_REPUTATION_MAX,
    DEFAULT_FACTION_REPUTATION,
    factionLibrary,
    getFactionInfo,
    getAllFactions,
} from '../index';

describe('Faction reputation engine', () => {
    describe('clampFactionReputation', () => {
        it('clamps values to [-100, +100] range', () => {
            expect(clampFactionReputation(-150)).toBe(-100);
            expect(clampFactionReputation(150)).toBe(100);
            expect(clampFactionReputation(50)).toBe(50);
            expect(clampFactionReputation(-50)).toBe(-50);
            expect(clampFactionReputation(0)).toBe(0);
        });
    });

    describe('createDefaultFactionReputations', () => {
        it('returns empty faction reputation object', () => {
            const reputations = createDefaultFactionReputations();
            expect(reputations).toEqual({});
        });
    });

    describe('getFactionReputation', () => {
        it('returns existing reputation value', () => {
            const reputations = { 'coastal-guard': 25, 'inland-clans': -15 };
            expect(getFactionReputation(reputations, 'coastal-guard')).toBe(25);
            expect(getFactionReputation(reputations, 'inland-clans')).toBe(-15);
        });

        it('returns default reputation for unknown factions', () => {
            const reputations = { 'coastal-guard': 25 };
            expect(getFactionReputation(reputations, 'unknown-faction')).toBe(DEFAULT_FACTION_REPUTATION);
            expect(getFactionReputation({}, 'any-faction')).toBe(DEFAULT_FACTION_REPUTATION);
        });
    });

    describe('applyFactionReputationDeltas', () => {
        it('applies positive and negative deltas', () => {
            const currentReputations = {
                'coastal-guard': 10,
                'inland-clans': -5,
            };
            const deltas = {
                'coastal-guard': 15,
                'inland-clans': -10,
                'merchant-guild': 25, // new faction
            };

            const result = applyFactionReputationDeltas(currentReputations, deltas);

            expect(result).toEqual({
                'coastal-guard': 25,    // 10 + 15
                'inland-clans': -15,    // -5 + (-10)
                'merchant-guild': 25,   // 0 + 25 (new faction starts at 0)
            });
        });

        it('clamps results to valid range', () => {
            const currentReputations = {
                'coastal-guard': 95,
                'inland-clans': -90,
            };
            const deltas = {
                'coastal-guard': 20,    // would be 115, clamps to 100
                'inland-clans': -20,    // would be -110, clamps to -100
            };

            const result = applyFactionReputationDeltas(currentReputations, deltas);

            expect(result).toEqual({
                'coastal-guard': 100,   // clamped to max
                'inland-clans': -100,   // clamped to min
            });
        });

        it('preserves existing factions not mentioned in deltas', () => {
            const currentReputations = {
                'coastal-guard': 30,
                'inland-clans': -20,
                'merchant-guild': 15,
            };
            const deltas = {
                'coastal-guard': 10, // only modify this one
            };

            const result = applyFactionReputationDeltas(currentReputations, deltas);

            expect(result).toEqual({
                'coastal-guard': 40,    // 30 + 10
                'inland-clans': -20,    // unchanged
                'merchant-guild': 15,   // unchanged
            });
        });

        it('handles empty deltas', () => {
            const currentReputations = { 'coastal-guard': 25 };
            const deltas = {};

            const result = applyFactionReputationDeltas(currentReputations, deltas);

            expect(result).toEqual(currentReputations);
        });
    });

    describe('faction library', () => {
        it('contains expected faction entries', () => {
            const allFactions = getAllFactions();
            expect(allFactions.length).toBeGreaterThan(0);

            // Check that expected factions exist
            const factionIds = allFactions.map(f => f.id);
            expect(factionIds).toContain('coastal-guard');
            expect(factionIds).toContain('inland-clans');
            expect(factionIds).toContain('merchant-guild');
            expect(factionIds).toContain('forest-wardens');
        });

        it('can lookup faction information', () => {
            const coastalGuard = getFactionInfo('coastal-guard');
            expect(coastalGuard).toBeDefined();
            expect(coastalGuard!.id).toBe('coastal-guard');
            expect(coastalGuard!.name).toBe('Coastal Guard');
            expect(coastalGuard!.description).toBeTruthy();

            const unknownFaction = getFactionInfo('unknown-faction');
            expect(unknownFaction).toBeUndefined();
        });

        it('faction library has consistent structure', () => {
            const allFactions = getAllFactions();

            for (const faction of allFactions) {
                expect(faction.id).toBeTruthy();
                expect(faction.name).toBeTruthy();
                expect(faction.description).toBeTruthy();
                expect(factionLibrary[faction.id]).toEqual(faction);
            }
        });
    });

    describe('golden path integration', () => {
        it('demonstrates boss befriend tradeoff scenario', () => {
            // Starting state: player has some existing reputation
            const initialReputations = {
                'coastal-guard': 20,
                'merchant-guild': 15,
                'forest-wardens': -5,
                'inland-clans': 10,
            };

            // Boss befriend deltas: lose reputation with one, gain with another
            const bossFactionDeltas = {
                'merchant-guild': -10,   // lose: they valued the boss's philosophical constraints
                'forest-wardens': +12,   // gain: appreciate dialectical harmony
            };

            // Apply the deltas (simulating boss befriend outcome)
            const updatedReputations = applyFactionReputationDeltas(
                initialReputations,
                bossFactionDeltas
            );

            expect(updatedReputations).toEqual({
                'coastal-guard': 20,     // unchanged
                'merchant-guild': 5,     // 15 + (-10) = 5
                'forest-wardens': 7,     // -5 + 12 = 7
                'inland-clans': 10,      // unchanged
            });

            // Verify the tradeoff occurred
            expect(getFactionReputation(updatedReputations, 'merchant-guild')).toBeLessThan(
                getFactionReputation(initialReputations, 'merchant-guild')
            );
            expect(getFactionReputation(updatedReputations, 'forest-wardens')).toBeGreaterThan(
                getFactionReputation(initialReputations, 'forest-wardens')
            );
        });

        it('handles extreme deltas with proper clamping', () => {
            const initialReputations = createDefaultFactionReputations();

            // Boss befriend with extreme consequences
            const extremeDeltas = {
                'coastal-guard': -200,   // hostile takeover attempt
                'merchant-guild': +200,  // massive economic alliance
            };

            const result = applyFactionReputationDeltas(initialReputations, extremeDeltas);

            expect(result['coastal-guard']).toBe(FACTION_REPUTATION_MIN);  // clamped to -100
            expect(result['merchant-guild']).toBe(FACTION_REPUTATION_MAX); // clamped to +100
        });
    });
});