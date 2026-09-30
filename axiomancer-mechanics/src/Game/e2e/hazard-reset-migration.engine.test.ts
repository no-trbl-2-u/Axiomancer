/**
 * Hermetic engine test — the v30 → v31 hop: THE REVAMP R6a hazard rewards.
 *
 * R6a (D52, `plan/revamp/hazards.md`) deletes the Paradox Token reward and
 * the Hexed consequence. Both only ever wrote a flag nothing read:
 * `hazard-token-banked:<stamp>` per token and `hazard-hexed`. The hop drops
 * them and leaves every other flag, including the hazard deck
 * (`hazard-card:*`) and scar (`hazard-scar:*`) flags, untouched.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import type { GameState } from '../types';

const KEPT_FLAGS = ['combat-tutorial-done', 'hazard-card:crack:1', 'hazard-scar:5'];

/** A v30 save with two banked tokens, the hex flag and flags that must stay. */
function v30WithHazardFlags(): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    const flags = [
        'combat-tutorial-done',
        'hazard-token-banked:1727600000000-3',
        'hazard-card:crack:1',
        'hazard-hexed',
        'hazard-token-banked:1727600000001-q4',
        'hazard-scar:5',
    ];
    return { ...fresh, flags, version: 30 };
}

const hop31 = (raw: Record<string, unknown>): GameState => migrate(raw, 30, 31);

describe('migrate v30 → v31 (THE REVAMP R6a / D52: honest hazard rewards)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBe(31);
        expect(hop31(v30WithHazardFlags()).version).toBe(31);
    });

    it('drops the token and hex flags and keeps every other flag in order', () => {
        expect(hop31(v30WithHazardFlags()).flags).toEqual(KEPT_FLAGS);
    });

    it('is idempotent', () => {
        const once = hop31(v30WithHazardFlags());
        const twice = migrate({ ...once, version: 30 } as unknown as Record<string, unknown>, 30, 31);
        expect(twice.flags).toEqual(once.flags);
    });

    it('chains from v29', () => {
        const migrated = migrate({ ...v30WithHazardFlags(), version: 29 }, 29, 31);
        expect(migrated.flags).toEqual(KEPT_FLAGS);
    });
});
