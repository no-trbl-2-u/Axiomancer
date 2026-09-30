/**
 * Hermetic engine test — the v29 → v30 hop: THE REVAMP R5 items reset.
 *
 * R5 (D49 in `plan/2026-09-25-refactor-strategy.decisions.md`) keeps three
 * consumables, the healing potions. A v29 save may still carry a stack of one
 * of the nineteen retired consumables, or an active effect whose definition
 * was deleted with them. The hop drops both and refunds nothing; potions,
 * relics and every other effect ride through untouched.
 */

import { describe, it, expect } from 'vitest';
import { migrate } from '../game.migrate';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { consumableLibrary } from '../../Items/consumable.library';
import type { GameState } from '../types';

/** A v29 save holding two retired stacks, a potion and two active effects. */
function v29WithRetiredItems(): Record<string, unknown> {
    const fresh = createNewGameState({ startMap: 'breakwater' });
    const inventory = [
        ...fresh.player.inventory,
        { id: 'antidote', name: 'Antidote', description: '', category: 'consumable', effectId: 'buff_cleanse', quantity: 2 },
        { id: 'supreme-healing-potion', name: 'Supreme Healing Potion', description: '', category: 'consumable', healAmount: 100, quantity: 1 },
        { id: 'healing-potion', name: 'Healing Potion', description: '', category: 'consumable', healAmount: 20, quantity: 3 },
    ];
    const effects = [
        { effectId: 'buff_regeneration', appliedOnRound: 1, remainingDuration: 2, intensity: 1 },
        { effectId: 'debuff_bleed', appliedOnRound: 1, remainingDuration: 2, intensity: 1 },
    ];
    return { ...fresh, player: { ...fresh.player, inventory, effects }, version: 29 };
}

const hop30 = (raw: Record<string, unknown>): GameState => migrate(raw, 29, 30);
const ids = (items: { id: string }[]): string[] => items.map(i => i.id);

describe('migrate v29 → v30 (THE REVAMP R5 / D49: healing potions only)', () => {
    it('lands at the current version', () => {
        expect(GAME_STATE_VERSION).toBeGreaterThanOrEqual(30);
        expect(hop30(v29WithRetiredItems()).version).toBe(30);
    });

    it('drops retired consumable stacks and keeps the potions and relics', () => {
        const before = v29WithRetiredItems();
        const migrated = hop30(before);
        const kept = ids(migrated.player.inventory);
        expect(kept).not.toContain('antidote');
        expect(kept).not.toContain('supreme-healing-potion');
        expect(kept).toContain('healing-potion');
        const relicsBefore = ids((before.player as GameState['player']).inventory).filter(id => id.startsWith('relic-'));
        expect(kept.filter(id => id.startsWith('relic-'))).toEqual(relicsBefore);
    });

    it('refunds nothing: the potion stack keeps its own quantity', () => {
        const potion = hop30(v29WithRetiredItems()).player.inventory.find(i => i.id === 'healing-potion');
        expect((potion as { quantity?: number } | undefined)?.quantity).toBe(3);
    });

    it('drops active effects whose definition R5 deleted and keeps the rest', () => {
        const effects = hop30(v29WithRetiredItems()).player.effects.map(e => e.effectId);
        expect(effects).toEqual(['debuff_bleed']);
    });

    it('is idempotent', () => {
        const once = hop30(v29WithRetiredItems());
        const twice = migrate({ ...once, version: 29 } as unknown as Record<string, unknown>, 29, 30);
        expect(twice).toEqual(once);
    });

    it('chains a v28 save through v29 into v30', () => {
        const migrated = migrate({ ...v29WithRetiredItems(), version: 28 }, 28, 30);
        expect(migrated.version).toBe(30);
        expect(ids(migrated.player.inventory)).not.toContain('antidote');
    });

    it('every id a migrated inventory can still hold as a consumable is in the library', () => {
        const library = new Set(consumableLibrary.map(c => c.id));
        const consumables = hop30(v29WithRetiredItems()).player.inventory.filter(i => i.category === 'consumable');
        for (const c of consumables) expect(library.has(c.id)).toBe(true);
    });
});
