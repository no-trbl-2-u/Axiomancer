/**
 * Unit tests — resolveEnemyArchetype (enemy id → drawing archetype).
 */

import { describe, expect, it } from '@jest/globals';

import { resolveEnemyArchetype } from '@/state/presenters/enemy-art';

describe('resolveEnemyArchetype', () => {
    it('honours explicit overrides (with or without the enemy- prefix)', () => {
        expect(resolveEnemyArchetype('kudan')).toBe('beast');
        expect(resolveEnemyArchetype('enemy-kudan')).toBe('beast');
        expect(resolveEnemyArchetype('enemy-king-of-revenge', true)).toBe('tyrant');
        expect(resolveEnemyArchetype('the-abortive', true)).toBe('eldritch');
        expect(resolveEnemyArchetype('doom-egg')).toBe('eldritch');
        expect(resolveEnemyArchetype('mirac')).toBe('zealot');
    });

    it('matches by keyword for un-overridden ids', () => {
        expect(resolveEnemyArchetype('enemy-grave-larva')).toBe('vermin');
        expect(resolveEnemyArchetype('enemy-pale-brood')).toBe('vermin');
        expect(resolveEnemyArchetype('enemy-rawhead-rex')).toBe('beast');
        expect(resolveEnemyArchetype('enemy-jeweled-tree')).toBe('flora');
        expect(resolveEnemyArchetype('enemy-water-holger')).toBe('spirit');
        expect(resolveEnemyArchetype('enemy-hasshaku-sama')).toBe('spirit');
        expect(resolveEnemyArchetype('enemy-brine-hag')).toBe('zealot');
        expect(resolveEnemyArchetype('enemy-fate-spinner')).toBe('eldritch');
        expect(resolveEnemyArchetype('enemy-elder-fire-giant')).toBe('tyrant');
    });

    it('falls back to generic for foes and tyrant for unknown bosses', () => {
        expect(resolveEnemyArchetype('enemy-mystery-thing', false)).toBe('generic');
        expect(resolveEnemyArchetype('enemy-mystery-thing', true)).toBe('tyrant');
        expect(resolveEnemyArchetype(null)).toBe('generic');
        expect(resolveEnemyArchetype(undefined, true)).toBe('tyrant');
    });
});
