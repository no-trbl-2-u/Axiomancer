/**
 * Hermetic engine test — the v23 → v24 hop: the first-node relic grant.
 *
 * v24 moved the Suppliant's Ring out of the silent seed and into the run's
 * first node. Every save written at v23 or earlier already OWNS the ring (it
 * was folded in by `createCharacter` at t=0), so this hop must grant nothing,
 * take nothing away, and simply stamp the grant settled — otherwise a
 * returning player would be handed a relic they are already wearing.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION, gameReducer } from '../game.reducer';
import {
    grantFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, FIRST_NODE_RELIC_FLAG,
} from '../../Character/first-node-grant';

/**
 * A v23 save: the pre-v24 shape — the ring already seeded and worn, no
 * settle flag. Built by settling the grant on a fresh state, which reproduces
 * exactly what `createCharacter` used to hand back.
 */
function v23Save(extraFlags: string[] = []): Record<string, unknown> {
    const fresh = createNewGameState();
    const settled = grantFirstNodeRelic(fresh.player, []);
    return {
        ...fresh,
        version: 23,
        player: settled.character,
        flags: [...fresh.flags, ...extraFlags],
    } as unknown as Record<string, unknown>;
}

describe('migrate v23 → v24 — the first-node relic grant', () => {
    it('the v23 → v24 hop is on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(24);
        expect(migrate(v23Save(), 23, 24).version).toBe(24);
    });

    it('stamps the grant settled so a returning player is never offered it again', () => {
        const migrated = migrate(v23Save(), 23, 24);
        expect(migrated.flags).toContain(FIRST_NODE_RELIC_FLAG);
        expect(isFirstNodeRelicPending(migrated.player, migrated.flags)).toBe(false);
    });

    it('does not touch the player — the ring and the worn loadout pass through', () => {
        const raw = v23Save();
        const before = JSON.parse(JSON.stringify(raw.player));
        const migrated = migrate(raw, 23, 24);
        expect(JSON.parse(JSON.stringify(migrated.player))).toEqual(before);
        expect(migrated.player.inventory.map(i => i.id)).toContain(FIRST_NODE_RELIC_ID);
        expect(migrated.player.inventory).toHaveLength(11);
    });

    it('keeps every other flag', () => {
        const migrated = migrate(v23Save(['some-story-flag', 'starter-bundle-chosen']), 23, 24);
        expect(migrated.flags).toContain('some-story-flag');
        expect(migrated.flags).toContain('starter-bundle-chosen');
    });

    it('is idempotent — a save already carrying the flag gets one copy', () => {
        const migrated = migrate(v23Save([FIRST_NODE_RELIC_FLAG]), 23, 24);
        expect(migrated.flags.filter(f => f === FIRST_NODE_RELIC_FLAG)).toHaveLength(1);
    });

    it('a migrated save never re-grants at the first node, or at a fight', () => {
        const migrated = migrate(v23Save(), 23, 24);
        const g = grantFirstNodeRelic(migrated.player, migrated.flags);
        expect(g.reason).toBe('already-settled');
        expect(g.granted).toBeNull();
        expect(g.character).toBe(migrated.player);
    });

    it('a save whose player parted with the ring is not force-fed a replacement', () => {
        // Selling or dropping a relic is legal. The first-node grant is a
        // new-run ceremony, not restitution, so the flag is stamped anyway.
        const raw = v23Save();
        const player = raw.player as Record<string, unknown> & { inventory: { id: string }[] };
        raw.player = {
            ...player,
            inventory: player.inventory.filter(i => i.id !== FIRST_NODE_RELIC_ID),
        };
        const migrated = migrate(raw, 23, 24);
        expect(migrated.flags).toContain(FIRST_NODE_RELIC_FLAG);
        expect(migrated.player.inventory.map(i => i.id)).not.toContain(FIRST_NODE_RELIC_ID);
        expect(isFirstNodeRelicPending(migrated.player, migrated.flags)).toBe(false);
    });

    it('chains a v22 save straight to v24 in one call', () => {
        const raw = v23Save();
        raw.version = 22;
        const migrated = migrate(raw, 22, 24);
        expect(migrated.version).toBe(24);
        expect(migrated.flags).toContain(FIRST_NODE_RELIC_FLAG);
        expect(migrated.player.inventory.map(i => i.id)).toContain(FIRST_NODE_RELIC_ID);
    });

    it('a FRESH v24 run is still pending — the migration only settles loaded saves', () => {
        const fresh = createNewGameState();
        expect(fresh.version).toBe(GAME_STATE_VERSION);
        expect(fresh.flags).not.toContain(FIRST_NODE_RELIC_FLAG);
        expect(isFirstNodeRelicPending(fresh.player, fresh.flags)).toBe(true);
    });

    it('RESET_RUN keepCharacter clears flags but never re-grants a ring in hand', () => {
        const migrated = migrate(v23Save(), 23, 24);
        const reset = gameReducer(migrated, { type: 'RESET_RUN', payload: { keepCharacter: true } });
        expect(reset.flags).not.toContain(FIRST_NODE_RELIC_FLAG);
        const g = grantFirstNodeRelic(reset.player, reset.flags);
        expect(g.reason).toBe('already-owned');
        expect(g.character.inventory.filter(i => i.id === FIRST_NODE_RELIC_ID)).toHaveLength(1);
    });
});
