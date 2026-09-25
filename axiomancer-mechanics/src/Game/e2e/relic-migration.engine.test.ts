/**
 * Hermetic engine test — Phase 19 save migration (v12 → v13).
 *
 * A v12 save has the 5-slot loadout but no signet relics. Migrating seeds the
 * relics via `cloneStartingRelics` (default 5 worn, displaced gear + the
 * benched rest to inventory) and recomputes
 * maxHealth so a loaded save derives a full signature kit from the
 * worn loadout instead of the retired archetype kit.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState, GAME_STATE_VERSION } from '../index';
import { calculateMaxHealth } from '../../Utils';
import { getSignaturesForLoadout } from '../../Items/relic.library';
import type { Equipment } from '../../Items/types';

const oldSword: Equipment = {
    id: 'old-sword', name: 'Old Sword', description: '', category: 'equipment',
    slot: 'weapon', 
    statModifiers: [{ stat: 'maxHp', value: 1 }],
};

/** A v12 save: 5-slot loadout with an old worn weapon (also present in
 *  inventory, per the mobile inventory-position worn convention), no relics. */
function v12Save(): Record<string, unknown> {
    const fresh = createNewGameState(); // v13 with relics
    const base = calculateMaxHealth(fresh.player.level, fresh.player.baseStats);
    return {
        ...fresh,
        version: 12,
        player: {
            ...fresh.player,
            equipment: { weapon: oldSword, armor: null, accessories: [] },
            inventory: [oldSword],
            maxHealth: base,
            health: base,
        },
    };
}

// Pin toVersion=13 to exercise the Phase-19 hop in isolation; the Phase-21
// v13→v14 purge is covered in its own block below.
describe('migrate v12 → v13 — seed the signet relics', () => {
    it('seeds the default 5-relic loadout onto a v12 save', () => {
        const migrated = migrate(v12Save(), 12, 13);
        expect(migrated.version).toBe(13);
        expect(migrated.player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(migrated.player.equipment.armor?.id).toBe('relic-read');
        expect(migrated.player.equipment.accessories).toHaveLength(3);
    });

    it('displaces the old worn gear to inventory and adds the 3 benched relics', () => {
        const invIds = migrate(v12Save(), 12, 13).player.inventory.map(i => i.id);
        expect(invIds).toContain('old-sword'); // nothing lost at v13
        expect(invIds).toContain('relic-conclusion');
        expect(invIds).toContain('relic-second-wind');
        expect(invIds).toContain('relic-conviction-strike');
    });

    it('recomputes maxHealth to include the +5 worn armor relic and clamps health', () => {
        const raw = v12Save();
        const player = raw.player as { level: number; baseStats: { heart: number; body: number; mind: number } };
        const base = calculateMaxHealth(player.level, player.baseStats);
        const migrated = migrate(raw, 12, 13);
        expect(migrated.player.maxHealth).toBe(base + 5);
        expect(migrated.player.health).toBeLessThanOrEqual(migrated.player.maxHealth);
    });

    it('the migrated player derives a full 5-signature kit from the worn loadout', () => {
        const migrated = migrate(v12Save(), 12, 13);
        expect(getSignaturesForLoadout(migrated.player.equipment)).toEqual([
            'sig-overwhelming-argument', 'sig-read-opponent',
            'sig-clever-gambit', 'sig-disarming-plea', 'sig-press-the-point',
        ]);
    });

    it('still rejects an unsupported (pre-v11) version', () => {
        expect(() => migrate({ version: 9 }, 9)).toThrow(/not supported/);
    });
});

// Phase 21 — v13 → v14 purges non-relic equipment.
describe('migrate v13 → v14 — purge non-relic equipment', () => {
    it('strips the old procedural weapon (worn + inventory) and keeps only relics as equipment', () => {
        // A v12 save chained all the way to current (v14): the old sword parked in
        // inventory at v13 is stripped at v14; only relic equipment survives.
        const migrated = migrate(v12Save(), 12);
        expect(migrated.version).toBe(GAME_STATE_VERSION); // chains v12 → current
        const equipmentIds = migrated.player.inventory
            .filter((i): i is typeof i => (i as { category?: string }).category === 'equipment')
            .map(i => i.id);
        expect(equipmentIds).not.toContain('old-sword');
        expect(equipmentIds.every(id => id.startsWith('relic-'))).toBe(true);
        // The worn loadout is relics and still derives a full signature kit.
        expect(migrated.player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(getSignaturesForLoadout(migrated.player.equipment)).toHaveLength(5);
    });

    it('backfills a loadout slot that held procedural gear with the default relic', () => {
        // A hand-built v13 save whose loadout still wears the old sword (edge case).
        const fresh = createNewGameState();
        const base = calculateMaxHealth(fresh.player.level, fresh.player.baseStats);
        const v13 = {
            ...fresh,
            version: 13,
            player: {
                ...fresh.player,
                equipment: { weapon: oldSword, armor: null, accessories: [] },
                inventory: [oldSword],
                maxHealth: base,
                health: base,
            },
        };
        const migrated = migrate(v13, 13);
        expect(migrated.version).toBe(GAME_STATE_VERSION); // chains v13 → current
        // The procedural weapon slot is backfilled with the default weapon relic.
        expect(migrated.player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(migrated.player.equipment.armor?.id).toBe('relic-read');
        expect(migrated.player.equipment.accessories).toHaveLength(3);
        expect(migrated.player.inventory.map(i => i.id)).not.toContain('old-sword');
    });
});
