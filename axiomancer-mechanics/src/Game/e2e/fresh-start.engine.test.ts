/**
 * Hermetic engine test — the very start.
 *
 * A brand-new run begins with NOTHING: no items, no worn equipment, no coin,
 * no experience. Two things make that a game rather than a punishment:
 *
 *   1. The Suppliant's Ring is still handed over at the run's first node
 *      (`Character/first-node-grant.ts`), and it now grants ONLY its
 *      signature skill (The Open Hand) — no stat bump.
 *   2. No other relic exists to buy or find.
 *
 * Presets, fixtures and sims still seed a kit; only `createNewGameState`,
 * the one real-player origination point, starts empty. This file pins all
 * of that.
 */

import { describe, it, expect } from 'vitest';
import { createNewGameState } from '../game.reducer';
import { createCharacter } from '../../Character';
import { grantFirstNodeRelic, FIRST_NODE_RELIC_ID } from '../../Character/first-node-grant';
import { getRelicById, getSignaturesForLoadout } from '../../Items/relic.library';
import { buildCharacterFromPreset, characterPresets } from '../../Character/presets';

describe('createNewGameState — the very start', () => {
    it('seeds no items, no equipment, no coin and no experience', () => {
        const s = createNewGameState();
        expect(s.player.inventory).toEqual([]);
        expect(s.player.equipment.weapon).toBeNull();
        expect(s.player.equipment.armor).toBeNull();
        expect(s.player.equipment.accessories).toEqual([]);
        expect(s.player.currency).toBe(0);
        expect(s.player.experience).toBe(0);
        expect(s.player.level).toBe(1);
        expect(getSignaturesForLoadout(s.player.equipment)).toEqual([]);
    });

    it('keeps the apprentice baseline stats (5/5/5) — the floor is items, not stats', () => {
        const s = createNewGameState();
        expect(s.player.baseStats).toEqual({ heart: 5, body: 5, mind: 5 });
        // No worn armor → maxHealth is the bare level-1 ceiling.
        const bare = createCharacter({ name: 'Bare', level: 1, baseStats: { heart: 5, body: 5, mind: 5 } });
        expect(s.player.maxHealth).toBe(bare.maxHealth);
    });

    it('the first node hands over the ring and nothing else', () => {
        const s = createNewGameState();
        const g = grantFirstNodeRelic(s.player, s.flags);
        expect(g.reason).toBe('granted');
        expect(g.character.inventory.map(i => i.id)).toEqual([FIRST_NODE_RELIC_ID]);
        expect(g.character.equipment.accessories.map(a => a.id)).toEqual([FIRST_NODE_RELIC_ID]);
        expect(getSignaturesForLoadout(g.character.equipment)).toEqual(['sig-disarming-plea']);
    });
});

describe("the Suppliant's Ring — skill only", () => {
    it('carries no stat modifier', () => {
        expect(getRelicById(FIRST_NODE_RELIC_ID)!.statModifiers).toEqual([]);
    });

    it('wearing it changes no maxHealth', () => {
        const s = createNewGameState();
        const g = grantFirstNodeRelic(s.player, s.flags);
        expect(g.character.maxHealth).toBe(s.player.maxHealth);
    });
});

describe('presets and sims are untouched', () => {
    it('a preset-built character still seeds the Phase-19 kit', () => {
        const preset = characterPresets[0]!;
        const c = buildCharacterFromPreset(preset);
        expect(c.inventory.length).toBeGreaterThan(0);
        expect(getSignaturesForLoadout(c.equipment).length).toBeGreaterThan(0);
    });
});
