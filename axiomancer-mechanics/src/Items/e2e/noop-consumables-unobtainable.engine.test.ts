/**
 * Hermetic engine test — TRIM THE FAT Tier 0 item 2
 * (`plan/2026-09-25-trim-the-fat.spec.md`): the eleven no-op consumables are
 * unobtainable.
 *
 * Each of these grants only a roll modifier or an advantage grant the combat
 * engine never reads for the player (or a stat line on a stat nothing reads),
 * so drinking one does nothing. The standing frame for T2 says: remove them
 * from shops and enemy kits until the stat hooks (D4) exist; do not invent a
 * new effect to make them work. Their library definitions stay so a saved
 * inventory that already holds one still resolves.
 */

import { describe, it, expect } from 'vitest';
import { EnemiesByMap } from '../../Enemy/enemy.library';
import { characterPresets, levelLadderPresets } from '../../Character/presets';
import { listRegisteredMapEventPools } from '../../World/MapEvents/resolve-map-event';
import { registerMapEventContent } from '../../World/MapEvents/content';
import { getConsumableById } from '../consumable.library';

const NOOP_CONSUMABLES = [
    'focus-vial', 'hunters-elixir', 'heart-draught', 'berserker-brew', 'quicksilver-vial',
    'war-horn-draught', 'philosopher-tea', 'void-essence', 'whetstone-oil',
    'resonance-crystal', 'greater-resonance-crystal',
] as const;
const NOOP = new Set<string>(NOOP_CONSUMABLES);

/** Every enemy on every map, deduplicated by id. */
function allEnemies() {
    const byId = new Map<string, (typeof EnemiesByMap)[keyof typeof EnemiesByMap][number]>();
    for (const list of Object.values(EnemiesByMap)) for (const e of list) byId.set(e.id, e);
    return [...byId.values()];
}

/** Every item id a registered map-event pool sells (village shop wares). */
function allShopWareIds(): string[] {
    registerMapEventContent();
    const out: string[] = [];
    for (const pool of listRegisteredMapEventPools()) {
        for (const entry of pool.entries) {
            const shop = (entry.payload as { shop?: { wares?: { itemId: string }[] } }).shop;
            for (const w of shop?.wares ?? []) out.push(w.itemId);
        }
    }
    return out;
}

describe('Tier 0 item 2 — the no-op consumables are unobtainable', () => {
    it('the definitions still resolve (old saves keep working)', () => {
        for (const id of NOOP_CONSUMABLES) expect(getConsumableById(id), id).toBeDefined();
    });

    it('no enemy loot table drops one', () => {
        const hits = allEnemies().flatMap(e => (e.loot ?? [])
            .filter(entry => entry.item && NOOP.has(entry.item.id))
            .map(entry => `${e.id}: ${entry.item!.id}`));
        expect(hits).toEqual([]);
    });

    it('no friendship reward grants one', () => {
        const hits = allEnemies().flatMap(e => (e.friendshipReward?.items ?? [])
            .filter(it => NOOP.has(it.id))
            .map(it => `${e.id}: ${it.id}`));
        expect(hits).toEqual([]);
    });

    it('no preset starts with one', () => {
        const hits = [...characterPresets, ...levelLadderPresets].flatMap(p => p.consumables
            .filter(c => NOOP.has(c.id))
            .map(c => `${p.id}: ${c.id}`));
        expect(hits).toEqual([]);
    });

    it('no shop sells one', () => {
        const wares = allShopWareIds();
        expect(wares.length).toBeGreaterThan(0); // the shops are actually being read
        expect(wares.filter(id => NOOP.has(id))).toEqual([]);
    });
});
