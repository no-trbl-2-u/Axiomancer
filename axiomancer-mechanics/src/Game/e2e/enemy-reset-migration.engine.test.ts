/**
 * Hermetic engine test — the v26 → v27 hop: THE REVAMP R2 enemy reset.
 *
 * R2 (D48 in `plan/2026-09-25-refactor-strategy.decisions.md`) cut the roster
 * to Float-Eye, the Brine Hag and the Doorwarden, and stripped every enemy
 * keyword. A staged encounter carries its enemies whole, so a v26 save may
 * name a retired foe, or a survivor still wearing its old keywords. The hop
 * re-points the first to a fresh Float-Eye and strips the second; everything
 * else passes through untouched.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { FloatEye, TheDoorwarden } from '../../Enemy/enemy.library';

/** A v26 save staged on a retired foe and a pre-R2 Doorwarden. */
function v26Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const oldDoorwarden = {
        ...structuredClone(TheDoorwarden),
        keywords: [{ kind: 'hide', n: 6 }, { kind: 'unshaken' }],
        stages: (TheDoorwarden.stages ?? []).map(st => ({ ...st, gain: [{ kind: 'brutal' }] })),
    };
    return {
        ...fresh,
        version: 26,
        flags: ['befriended-little-belle'],
        currentEncounter: {
            origin: 'bw-2',
            enemies: [
                { id: 'enemy-grave-larva', name: 'Grave Larva', keywords: [{ kind: 'hide', n: 2 }] },
                oldDoorwarden,
            ],
        },
    };
}

describe('migrate v26 → v27 (THE REVAMP R2 / D48)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(27);
        expect(migrate(v26Save(), 26, 27).version).toBe(27);
    });

    it('re-points a retired foe to a fresh Float-Eye', () => {
        const migrated = migrate(v26Save(), 26, 27);
        const [first] = migrated.currentEncounter!.enemies;
        expect(first!.id).toBe(FloatEye.id);
        expect(first!.name).toBe(FloatEye.name);
        expect(first).not.toBe(FloatEye);
    });

    it('strips a survivor\'s keywords and stage gains, keeping the rest of it', () => {
        const migrated = migrate(v26Save(), 26, 27);
        const warden = migrated.currentEncounter!.enemies[1]!;
        expect(warden.id).toBe(TheDoorwarden.id);
        expect(warden.keywords).toEqual([]);
        expect(warden.stages).toHaveLength(TheDoorwarden.stages!.length);
        for (const stage of warden.stages!) expect(stage).not.toHaveProperty('gain');
        expect(warden.stages![0]!.name).toBe(TheDoorwarden.stages![0]!.name);
    });

    it('leaves flags for retired foes as inert strings, and the encounter origin', () => {
        const migrated = migrate(v26Save(), 26, 27);
        expect(migrated.flags).toContain('befriended-little-belle');
        expect(migrated.currentEncounter!.origin).toBe('bw-2');
    });

    it('passes a save with no staged encounter through', () => {
        const save = { ...v26Save(), currentEncounter: undefined };
        const migrated = migrate(save, 26, 27);
        expect(migrated.currentEncounter).toBeUndefined();
    });

    it('is idempotent over an already-current encounter', () => {
        const once = migrate(v26Save(), 26, 27);
        const twice = migrate({ ...once, version: 26 }, 26, 27);
        expect(twice.currentEncounter).toEqual(once.currentEncounter);
    });
});
