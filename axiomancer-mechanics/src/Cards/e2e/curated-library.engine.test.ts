/**
 * Hermetic E2E — the PROFANE CANON library shape contract (2026-08-08).
 *
 * The rework replaced the spec-32 themed pool wholesale: 57 unique cards —
 * 8 starters (the Threadbare Office), 3 dice-valve relics, 4 enemy-injected
 * curses, and six archetype packages of 7 (2 commons, 2 uncommons, 1 rare
 * spell, 1 oath, 1 hex). Rank ladder 1-6 with derived rarity,
 * three card types, and THE STRIKE stays DEAD at the schema level — no card
 * carries an HP-damage field, and this suite is the regression gate.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import { cardLibrary, getCardById } from '../cards.library';
import { CARD_RANK_NAMES } from '../types';
import { CARD_THEMES } from '../card-themes';
import type { Card } from '../types';
import { COMBAT_REWARD_POOL, STARTING_CARD_IDS } from '../../Combat/combat.rewards';
import { listDeckPresets, cardOrigin } from '../../Combat/combat.starter-deck-presets';

/** The seven theme tags — every card carries exactly one. */
const THEMES = CARD_THEMES;

function themeOf(card: Card): string | undefined {
    const themes = (card.tags ?? []).filter(t => (THEMES as readonly string[]).includes(t));
    return themes.length === 1 ? themes[0] : undefined;
}

const ARCHETYPES = ['rot', 'debt', 'grave', 'vigil', 'trial', 'choir'] as const;

describe('profane canon — shape contract', () => {
    it('is exactly 57 unique cards', () => {
        expect(cardLibrary.length).toBe(57);
        const ids = cardLibrary.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every card carries exactly one of the seven theme tags', () => {
        for (const card of cardLibrary) {
            expect(themeOf(card), `${card.id} must carry exactly one theme tag`).toBeDefined();
        }
    });

    it('each archetype delivers its 7-card package (2 commons, 2 uncommons, 1 rare spell, 1 oath, 1 hex)', () => {
        for (const theme of ARCHETYPES) {
            const pack = cardLibrary.filter(c => c.theme === theme
                && !(c.tags ?? []).some(t => t === 'starter' || t === 'valve' || t === 'curse'));
            expect(pack.length, theme).toBe(7);
            const spells = pack.filter(c => c.cardType === 'spell');
            expect(spells.filter(c => c.rank <= 2).length, `${theme} commons`).toBe(2);
            expect(spells.filter(c => c.rank === 3 || c.rank === 4).length, `${theme} uncommons`).toBe(2);
            expect(spells.filter(c => c.rank >= 5).length, `${theme} rare spell`).toBe(1);
            expect(pack.filter(c => c.cardType === 'oath').length, `${theme} oath`).toBe(1);
            expect(pack.filter(c => c.cardType === 'hex').length, `${theme} hex`).toBe(1);
        }
    });

    it('the special classes have their exact populations (8 starters, 3 valves, 4 curses)', () => {
        expect(cardLibrary.filter(c => (c.tags ?? []).includes('starter')).length).toBe(8);
        const valves = cardLibrary.filter(c => (c.tags ?? []).includes('valve'));
        expect(valves.length).toBe(3);
        expect(valves.map(v => v.philosophicalAspect).sort()).toEqual(['body', 'heart', 'mind']);
        expect(cardLibrary.filter(c => c.theme === 'curse').length).toBe(4);
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

    it('cardOrigin splits the library into 34 campaign starters and 23 reward/injected cards', () => {
        // The campaign-preset union (threadbare ∪ pilgrim ∪ apostate) seats 34
        // uniques; the other 23 are the 3 flag-on valve relics, the 4
        // enemy-injected curses, spadework + the-congregation-below (grave's
        // reward-only pair), and the whole trial + choir packages (drafted
        // through rewards, not seated in the canonical lineage).
        const rewardOnly: string[] = [];
        for (const card of cardLibrary) {
            const origin = cardOrigin(card.id);
            if (origin.source === 'reward') { rewardOnly.push(card.id); continue; }
            expect(origin.presetDeck, `${card.id} presetDeck`).toBeTruthy();
        }
        expect(rewardOnly.length, `reward-only: ${rewardOnly.join(', ')}`).toBe(23);
        for (const theme of ['trial', 'choir'] as const) {
            for (const card of cardLibrary.filter(c => c.theme === theme
                && !(c.tags ?? []).some(t => t === 'starter' || t === 'valve'))) {
                expect(rewardOnly, `${card.id} (${theme}) should be draft-only`).toContain(card.id);
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

describe('profane canon — THE STRIKE IS DEAD (schema gate)', () => {
    it("the library source never mentions 'basePower' or 'chipHp'", () => {
        const source = readFileSync(resolve(__dirname, '..', 'cards.library.ts'), 'utf8');
        expect(source.includes('basePower')).toBe(false);
        expect(source.includes('chipHp')).toBe(false);
    });

    it('no card object carries an HP-damage field at runtime either', () => {
        for (const card of cardLibrary) {
            const record = card as unknown as Record<string, unknown>;
            expect(record.basePower, `${card.id}`).toBeUndefined();
            expect(record.chipHp, `${card.id}`).toBeUndefined();
            expect(record.scalingMultiplier, `${card.id}`).toBeUndefined();
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
            expect(['body', 'mind', 'heart']).toContain(card.philosophicalAspect);
            // Provenance stamp: an ISO date no earlier than the Profane
            // Canon wholesale replacement (2026-08-08). New cards stamp
            // their own add date (THE PIPELINE LIBERATION, 2026-08-22).
            expect(card.addedIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(card.addedIn !== undefined && card.addedIn >= '2026-08-08').toBe(true);
        }
    });

    it('the starting pair resolves and teaches a mechanic each', () => {
        expect(STARTING_CARD_IDS).toEqual(['spoiled-poultice', 'chilblain-watch']);
        for (const id of STARTING_CARD_IDS) {
            const card = getCardById(id);
            expect(card, id).toBeDefined();
            expect(card!.rank).toBe(1); // starters are Ash
            expect(card!.tags).toContain('starter');
        }
    });

    it('the reward pool is the library minus the curse class, and every id resolves', () => {
        expect(COMBAT_REWARD_POOL.length).toBe(53);
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id), `reward pool: ${id}`).toBeDefined();
            expect(getCardById(id)!.theme, `${id} — a curse is never a reward`).not.toBe('curse');
        }
    });
});

describe('profane canon — dieBonus reachability under THE COLOR LAW', () => {
    // A card is only ever powered by a die of ITS OWN stance, a WILD die, or
    // (fate cards) a dead X — so only onColor:'match' can fire. The pin holds
    // at zero dead lines; the next author who ships one reopens this list.
    const KNOWN_DEAD: string[] = [];
    it("no card authors an unreachable dieBonus line (onColor 'off' or an off-stance color)", () => {
        const dead = cardLibrary
            .filter(c => c.dieBonus)
            .filter(c => c.dieBonus!.onColor === 'off'
                || (c.dieBonus!.onColor !== 'match' && c.dieBonus!.onColor !== c.philosophicalAspect))
            .map(c => c.id)
            .sort();
        expect(dead).toEqual([...KNOWN_DEAD].sort());
    });
});
