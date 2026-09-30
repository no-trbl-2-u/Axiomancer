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
import { listDeckPresets } from '../../Combat/combat.starter-deck-presets';

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

    // Moved here from the root naming-law sweep when R1 deleted it: a
    // malformed id breaks lookups, so this is a bug detector, not a style law.
    it('every card id is kebab-case', () => {
        const malformed = cardLibrary.map(c => c.id).filter(id => !/^[a-z][a-z0-9-]*$/.test(id));
        expect(malformed).toEqual([]);
    });

    it('every card carries exactly one of the seven theme tags', () => {
        for (const card of cardLibrary) {
            expect(themeOf(card), `${card.id} must carry exactly one theme tag`).toBeDefined();
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
            expect(['body', 'mind', 'heart', 'any']).toContain(card.color);
            // Provenance stamp: a well-formed ISO date. The 2026-08-08 floor
            // (Profane Canon wholesale replacement) was repealed 2026-09-02.
            expect(card.addedIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    it('the starting set resolves, teaches a mechanic each, and is the 5/3/2 grey recipe', () => {
        // Phase 104 (the grey office) — a brand-new player's first ten cards
        // are two colourless shapes, not one card per stance colour: 'any'
        // means every die powers every starter, so the old three-colours-
        // represented law is superseded (there is no colour to fail to cover).
        // S3 (T, 2026-09-27): Blow 5, Ward 3, A Plain Word 2 (D42, D43).
        expect(STARTING_CARD_IDS).toEqual([
            'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
            'grey-ward', 'grey-ward', 'grey-ward',
            'grey-word', 'grey-word',
        ]);
        for (const id of STARTING_CARD_IDS) {
            const card = getCardById(id);
            expect(card, id).toBeDefined();
            expect(card!.rank).toBe(1); // starters are Ash
            expect(card!.tags).toContain('starter');
        }
        const aspects = new Set(STARTING_CARD_IDS.map(id => getCardById(id)!.color));
        expect([...aspects]).toEqual(['any']);
    });

    it('the reward pool never seats a curse, and every id resolves', () => {
        // D44 (the card purge, 2026-09-27): the grey office IS the reward pool,
        // so the old "never a grey starter" leg is repealed.
        expect(COMBAT_REWARD_POOL.length).toBeGreaterThan(0);
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id), `reward pool: ${id}`).toBeDefined();
            expect(getCardById(id)!.theme, `${id} — a curse is never a reward`).not.toBe('curse');
        }
    });
});
