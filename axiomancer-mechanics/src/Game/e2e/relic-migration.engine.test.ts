/**
 * Hermetic engine test — Phase 19 save migration (v12 → v13).
 *
 * A v12 save has the 5-slot loadout but no signet relics. Migrating seeds the 8
 * relics (default 5 worn, displaced gear + other 3 to inventory) and recomputes
 * derivedStats / maxHealth so a loaded save derives a full signature kit from the
 * worn loadout instead of the retired archetype kit.
 */

import { describe, it, expect } from 'vitest';
import { migrate, createNewGameState } from '../index';
import { calculateMaxHealth } from '../../Utils';
import { getSignaturesForLoadout } from '../../Items/relic.library';
import type { Equipment } from '../../Items/types';

const oldSword: Equipment = {
    id: 'old-sword', name: 'Old Sword', description: '', category: 'equipment',
    slot: 'weapon', rarity: 'common', requiredLevel: 0,
    statModifiers: [{ stat: 'body', value: 1, isMultiplier: false }],
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

describe('migrate v12 → v13 — seed the signet relics', () => {
    it('seeds the default 5-relic loadout onto a v12 save', () => {
        const migrated = migrate(v12Save(), 12);
        expect(migrated.version).toBe(13);
        expect(migrated.player.equipment.weapon?.id).toBe('relic-overwhelming');
        expect(migrated.player.equipment.armor?.id).toBe('relic-read');
        expect(migrated.player.equipment.accessories).toHaveLength(3);
    });

    it('displaces the old worn gear to inventory and adds the 3 benched relics', () => {
        const invIds = migrate(v12Save(), 12).player.inventory.map(i => i.id);
        expect(invIds).toContain('old-sword'); // nothing lost
        expect(invIds).toContain('relic-conclusion');
        expect(invIds).toContain('relic-second-wind');
        expect(invIds).toContain('relic-press-the-point');
    });

    it('recomputes maxHealth to include the +5 worn armor relic and clamps health', () => {
        const raw = v12Save();
        const player = raw.player as { level: number; baseStats: { heart: number; body: number; mind: number } };
        const base = calculateMaxHealth(player.level, player.baseStats);
        const migrated = migrate(raw, 12);
        expect(migrated.player.maxHealth).toBe(base + 5);
        expect(migrated.player.health).toBeLessThanOrEqual(migrated.player.maxHealth);
    });

    it('the migrated player derives a full 5-signature kit from the worn loadout', () => {
        const migrated = migrate(v12Save(), 12);
        expect(getSignaturesForLoadout(migrated.player.equipment)).toEqual([
            'sig-overwhelming-argument', 'sig-read-opponent',
            'sig-conviction-strike', 'sig-clever-gambit', 'sig-disarming-plea',
        ]);
    });

    it('still rejects an unsupported (pre-v11) version', () => {
        expect(() => migrate({ version: 9 }, 9)).toThrow(/not supported/);
    });
});
