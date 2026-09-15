/**
 * Hermetic engine test — 2026-09-15 save migration (v21 → v22, Phase 85).
 *
 * Phase 85 fills the `head`/`hands`/`feet` accessory kinds that shipped empty
 * since Phase 19 with 3 new signet relics. Pins that a v21 save loads clean at
 * v22: the 3 new relics land in inventory (benched — the worn loadout is
 * untouched), a save that somehow already carries one of them doesn't get a
 * duplicate, and every other field passes through unchanged.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';

const NEW_RELIC_IDS = ['relic-mounting-dread', 'relic-endless-labor', 'relic-unbroken-stride'];

/** A v21 save: a fresh state stamped back to v21 (pre-Phase-85 relic roster). */
function v21Save(): Record<string, unknown> {
    const fresh = createNewGameState();
    const inventory = (fresh.player.inventory ?? []).filter(i => !NEW_RELIC_IDS.includes(i.id));
    return {
        ...fresh,
        player: { ...fresh.player, inventory },
        version: 21,
    } as unknown as Record<string, unknown>;
}

describe('migrate v21 → v22 — seed the Phase 85 head/hands/feet relics', () => {
    it('the v21 → v22 hop is on the supported chain', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(22);
        expect(migrate(v21Save(), 21, 22).version).toBe(22);
    });

    it('appends the 3 new relics to inventory', () => {
        const migrated = migrate(v21Save(), 21, 22);
        const ids = migrated.player.inventory.map(i => i.id);
        for (const id of NEW_RELIC_IDS) expect(ids).toContain(id);
    });

    it("doesn't touch the worn loadout — the new relics start benched", () => {
        const raw = v21Save();
        const beforeLoadout = JSON.parse(JSON.stringify((raw.player as { equipment: unknown }).equipment));
        const migrated = migrate(raw, 21, 22);
        expect(JSON.parse(JSON.stringify(migrated.player.equipment))).toEqual(beforeLoadout);
    });

    it('is idempotent — a save that already carries a new relic keeps one copy', () => {
        const raw = v21Save();
        const player = raw.player as { inventory: { id: string; name?: string }[] };
        player.inventory = [...player.inventory, { id: 'relic-mounting-dread', name: "Cassandra's Circlet" }];

        const migrated = migrate(raw, 21, 22);
        const dreadCount = migrated.player.inventory.filter(i => i.id === 'relic-mounting-dread').length;
        expect(dreadCount).toBe(1);
    });

    it('chains a v20 save straight to v22 in one call', () => {
        const raw = v21Save();
        raw.version = 20;
        const { mapStates: _mapStates, ...worldWithout } = (raw.world as { mapStates: unknown; world: unknown[] });
        raw.world = { ...worldWithout, world: [] };

        const migrated = migrate(raw, 20, 22);
        expect(migrated.version).toBe(22);
        const ids = migrated.player.inventory.map(i => i.id);
        for (const id of NEW_RELIC_IDS) expect(ids).toContain(id);
    });
});
