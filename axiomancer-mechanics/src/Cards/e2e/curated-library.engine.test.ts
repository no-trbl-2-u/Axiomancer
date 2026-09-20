/**
 * Hermetic E2E — card library shape guard.
 *
 * The library size, archetype-package shape, starter/valve/curse counts,
 * preset/reward split, THE STRIKE IS DEAD schema ban, `addedIn` floor, and
 * dieBonus-reachability pin were repealed 2026-09-02 (big-numbers overhaul
 * §3, §10) — the library is being rewritten wholesale. What remains here
 * are bug detectors: unique ids, valid theme/rank/type, every spell authors
 * a non-empty FREE line, oath/hex carry a persistentEffect, presets never
 * seat a curse, and oath/hex targeting stays self/enemy.
 */

import { describe, it, expect } from 'vitest';

import { cardLibrary, getCardById } from '../cards.library';
import { CARD_RANK_NAMES } from '../types';
import { CARD_THEMES } from '../card-themes';
import type { Card } from '../types';
import { COMBAT_REWARD_POOL, STARTING_CARD_IDS } from '../../Combat/combat.rewards';
import { listDeckPresets, cardOrigin } from '../../Combat/combat.starter-deck-presets';

/** The eight theme tags (Phase 104 added 'grey') — every card carries exactly one. */
const THEMES = CARD_THEMES;

function themeOf(card: Card): string | undefined {
    const themes = (card.tags ?? []).filter(t => (THEMES as readonly string[]).includes(t));
    return themes.length === 1 ? themes[0] : undefined;
}

describe('profane canon — shape contract', () => {
    it('every card id is unique', () => {
        const ids = cardLibrary.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every card carries exactly one of the seven theme tags', () => {
        for (const card of cardLibrary) {
            expect(themeOf(card), `${card.id} must carry exactly one theme tag`).toBeDefined();
        }
    });

    it('every curse is rank-1 junk with a PURGE exit', () => {
        for (const curse of cardLibrary.filter(c => c.theme === 'curse')) {
            expect(curse.rank, curse.id).toBe(1);
            expect(curse.cardType, curse.id).toBe('spell');
            expect((curse.specialMechanics ?? []).some(m => m.kind === 'purge_self'), curse.id).toBe(true);
        }
    });

    it('every rank is a named rung on the ladder', () => {
        for (const card of cardLibrary) {
            expect(CARD_RANK_NAMES[card.rank], `${card.id} rank ${card.rank}`).toBeTruthy();
        }
    });
});

describe('profane canon — FREE/PAID anatomy', () => {
    it('every SPELL carries an authored FREE rider with substance', () => {
        for (const card of cardLibrary.filter(c => c.cardType === 'spell')) {
            expect(card.free, `${card.id} (spell) must author a FREE line`).toBeDefined();
            const total = Object.values(card.free!).reduce<number>((n, v) => {
                if (typeof v === 'number') return n + v;
                if (v === true) return n + 1;
                if (typeof v === 'object' && v !== null) return n + 1; // applyEffect
                return n;
            }, 0);
            expect(total, `${card.id} FREE line must not be empty`).toBeGreaterThan(0);
        }
    });

    it('oaths and hexes carry no AUTHORED free rider (the timed FREE line is engine-derived)', () => {
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            expect(card.free, `${card.id} (${card.cardType})`).toBeUndefined();
        }
    });

    it('every oath and hex carries a persistentEffect summary', () => {
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            expect(card.persistentEffect, `${card.id} (${card.cardType})`).toBeTruthy();
        }
    });

    it('every library card declares a `theme` that matches its tag-derived theme', () => {
        for (const card of cardLibrary) {
            expect(card.theme, `${card.id} must declare a theme`).toBeDefined();
            expect(card.theme, `${card.id} theme must equal its tag theme`).toBe(themeOf(card));
        }
    });

    it('presets never seat a curse; every preset card resolves', () => {
        for (const preset of listDeckPresets()) {
            for (const id of new Set(preset.cardIds)) {
                const card = getCardById(id);
                expect(card, `${preset.id}: ${id}`).toBeDefined();
                expect(card!.theme, `${preset.id}: ${id}`).not.toBe('curse');
            }
        }
    });

    it('cardOrigin tags a non-preset id as a reward', () => {
        expect(cardOrigin('no-such-card-not-in-any-preset').source).toBe('reward');
    });

    it('oaths sit player-side; hexes attach to the enemy', () => {
        for (const card of cardLibrary.filter(c => c.cardType === 'oath')) {
            expect(card.targetType, `${card.id}`).toBe('self');
        }
        for (const card of cardLibrary.filter(c => c.cardType === 'hex')) {
            expect(card.targetType, `${card.id}`).toBe('enemy');
        }
    });
});

describe('profane canon — id hygiene and provenance', () => {
    it('every card has the required shape', () => {
        for (const card of cardLibrary) {
            expect(card.id).toMatch(/^[a-z][a-z0-9-]*$/);
            expect([1, 2, 3]).toContain(card.tier);
            expect([1, 2, 3, 4, 5, 6]).toContain(card.rank);
            expect(['spell', 'oath', 'hex']).toContain(card.cardType);
            expect(['self', 'enemy']).toContain(card.targetType);
            expect(['body', 'mind', 'heart', 'any']).toContain(card.philosophicalAspect);
            // Provenance stamp: a well-formed ISO date. The 2026-08-08 floor
            // (Profane Canon wholesale replacement) was repealed 2026-09-02.
            expect(card.addedIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    it('the starting set resolves, teaches a mechanic each, and is the 7/3 grey recipe', () => {
        // Phase 104 (the grey office) — a brand-new player's first ten cards
        // are two colourless shapes, not one card per stance colour: 'any'
        // means every die powers every starter, so the old three-colours-
        // represented law is superseded (there is no colour to fail to cover).
        expect(STARTING_CARD_IDS).toEqual([
            'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
            'grey-strike', 'grey-strike', 'grey-strike',
            'grey-ward', 'grey-ward', 'grey-ward',
        ]);
        for (const id of STARTING_CARD_IDS) {
            const card = getCardById(id);
            expect(card, id).toBeDefined();
            expect(card!.rank).toBe(1); // starters are Ash
            expect(card!.tags).toContain('starter');
        }
        const aspects = new Set(STARTING_CARD_IDS.map(id => getCardById(id)!.philosophicalAspect));
        expect([...aspects]).toEqual(['any']);
    });

    it('the reward pool never seats a curse or a grey starter, and every id resolves', () => {
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id), `reward pool: ${id}`).toBeDefined();
            expect(getCardById(id)!.theme, `${id} — a curse is never a reward`).not.toBe('curse');
            expect(getCardById(id)!.theme, `${id} — the grey office is never a reward`).not.toBe('grey');
        }
    });
});
