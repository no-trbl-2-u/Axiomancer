/**
 * Hermetic E2E — enemy id hygiene.
 *
 * Moved here from the root naming-law sweep (`scripts/check-naming-law.mjs`)
 * when revamp phase R1 deleted it. A malformed or colliding id is a runtime
 * bug (broken lookups, silent registry overwrites), not a taste call, so the
 * check lives with the library it guards.
 */

import { describe, it, expect } from 'vitest';

import { EnemyLibrary } from '../enemy.library';

describe('enemy library — id hygiene', () => {
    it('every enemy id is unique', () => {
        const ids = EnemyLibrary.map(e => e.id);
        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every enemy id is kebab-case', () => {
        const malformed = EnemyLibrary.map(e => e.id).filter(id => !/^[a-z][a-z0-9-]*$/.test(id));
        expect(malformed).toEqual([]);
    });
});
