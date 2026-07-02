/**
 * Unit tests — resolveEnemyArchetype (enemy id → drawing archetype).
 */

import { describe, expect, it } from '@jest/globals';

import { resolveEnemyArchetype } from '@/state/presenters/enemy-art';

describe('resolveEnemyArchetype', () => {
    it('honours explicit overrides (with or without the enemy- prefix)', () => {
        expect(resolveEnemyArchetype('salt-gnaw-rat')).toBe('vermin');
        expect(resolveEnemyArchetype('enemy-salt-gnaw-rat')).toBe('vermin');
        expect(resolveEnemyArchetype('enemy-coastal-tyrant', true)).toBe('tyrant');
        expect(resolveEnemyArchetype('the-disagreement', true)).toBe('eldritch');
    });

    it('matches by keyword for un-overridden ids', () => {
        expect(resolveEnemyArchetype('enemy-tidepool-crab')).toBe('crustacean');
        expect(resolveEnemyArchetype('enemy-reef-barnacle-colony')).toBe('crustacean');
        expect(resolveEnemyArchetype('enemy-argumentative-crow')).toBe('avian');
        expect(resolveEnemyArchetype('enemy-packleader-wolf')).toBe('beast');
        expect(resolveEnemyArchetype('enemy-whispering-oak')).toBe('flora');
        expect(resolveEnemyArchetype('enemy-hush-wraith')).toBe('spirit');
        expect(resolveEnemyArchetype('enemy-apostate-abbot')).toBe('zealot');
        expect(resolveEnemyArchetype('enemy-cathedral-of-doubt')).toBe('eldritch');
    });

    it('falls back to generic for foes and tyrant for unknown bosses', () => {
        expect(resolveEnemyArchetype('enemy-mystery-thing', false)).toBe('generic');
        expect(resolveEnemyArchetype('enemy-mystery-thing', true)).toBe('tyrant');
        expect(resolveEnemyArchetype(null)).toBe('generic');
        expect(resolveEnemyArchetype(undefined, true)).toBe('tyrant');
    });
});
