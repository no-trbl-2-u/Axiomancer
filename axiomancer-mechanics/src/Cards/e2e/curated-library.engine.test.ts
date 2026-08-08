/**
 * Hermetic E2E — the spec 32 v3 THEMED library shape contract.
 *
 * The 2026-07-08 overhaul replaced the 49-card curated pool wholesale:
 * 70 unique cards, 10 self-contained themes × 7, rank ladder 1-6 with
 * derived rarity, three card types (spell / enchantment / disenchant), and
 * THE STRIKE IS DEAD at the schema level — no card carries an HP-damage
 * field, and this suite is the regression gate (spec §1, ledger #1).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import { cardLibrary, getCardById } from '../cards.library';
import { CARD_RANK_NAMES } from '../types';
import type { Card } from '../types';
import { COMBAT_REWARD_POOL, STARTING_CARD_IDS } from '../../Combat/combat.rewards';
import { listDeckPresets, cardOrigin, PRESET_COLOR_BORROWS } from '../../Combat/combat.starter-deck-presets';

/** The ten theme tags (spec §6) — every card carries exactly one. */
const THEMES = [
    'affliction', 'peroration', 'forge', 'akrasia', 'control',
    'oracle', 'harvest', 'charm', 'bulwark', 'echo',
] as const;

function themeOf(card: Card): string | undefined {
    const themes = (card.tags ?? []).filter(t => (THEMES as readonly string[]).includes(t));
    return themes.length === 1 ? themes[0] : undefined;
}

describe('themed library — shape contract (spec 32 v3 §6-7)', () => {
    it('is exactly 86 unique cards (70 post-D8 + the 9 owner-ratified 2026-07-19 swap-pool promotions + the 7 phase-39 theme-symmetry restorations)', () => {
        expect(cardLibrary.length).toBe(86);
        const ids = cardLibrary.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every card carries exactly one of the ten theme tags', () => {
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

describe('themed library — FREE/PAID anatomy (spec §2)', () => {
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

    it('enchantments and disenchants carry no AUTHORED free rider — spec 32 v4 FREE line is engine-derived (a timed instance of the passive)', () => {
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            expect(card.free, `${card.id} (${card.cardType}) must not carry an authored FREE rider — the timed FREE line is derived by the engine`).toBeUndefined();
        }
    });

    it('every enchantment and disenchant carries a persistentEffect summary — spec 32 v4 (its hooked passive is otherwise invisible to the card UI + catalog)', () => {
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            expect(card.persistentEffect, `${card.id} (${card.cardType}) must carry a one-line persistentEffect summary`).toBeTruthy();
        }
    });

    it('every library card declares a `theme` that matches its tag-derived theme (spec 32)', () => {
        for (const card of cardLibrary) {
            expect(card.theme, `${card.id} must declare a theme`).toBeDefined();
            expect(card.theme, `${card.id} theme must equal its tag theme`).toBe(themeOf(card));
        }
    });

    it("a starter card's `theme` matches its preset deck's theme, or it is a documented color-law borrow", () => {
        // 5/5/5 recipe color law (spec 32 §12 item 9, ratified 2026-07-12):
        // presets may borrow cross-theme cards of a missing color; the borrow
        // map is pinned in PRESET_COLOR_BORROWS and asserted exactly by
        // src/Combat/e2e/deck-presets.engine.test.ts.
        for (const preset of listDeckPresets()) {
            const borrows = PRESET_COLOR_BORROWS[preset.id] ?? [];
            for (const id of new Set(preset.cardIds)) {
                if (borrows.includes(id)) continue;
                expect(getCardById(id)?.theme, `${id} in preset ${preset.id}`).toBe(preset.theme);
            }
        }
    });

    it('cardOrigin tags every library card as a starter, except the twenty-four documented reward-only cards', () => {
        // The 5/5/5 color law squeezes 10 cards (the D8 valves, flag-on-only
        // seats) out of every recipe, and the 2026-07-19 promotions unseated
        // 8 incumbents (pinned by id in deck-presets.engine.test.ts); phase 39
        // (2026-08-08) restored 7 more cards (§A) of which 2 landed a forced
        // preset seat (entropy-tax/foundry, heart-of-the-matter/grace) and 4
        // did not (achilles-and-the-tortoise — measured DEAD in grace, no
        // seat elsewhere; captive-audience, fated-course, the-tithe — no
        // forced seat), and its foundry/grace color-law compensating
        // shuffle (§B) evicted 2 more incumbents (anvil-of-form,
        // irresistible-grace, the latter re-picked to resonant-chamber after
        // A/B showed the first candidate regressed grace). All 24 remain in
        // the reward pool and surface through drafts instead.
        const rewardOnly: string[] = [];
        for (const card of cardLibrary) {
            const origin = cardOrigin(card.id);
            if (origin.source === 'reward') { rewardOnly.push(card.id); continue; }
            expect(origin.presetDeck, `${card.id} presetDeck`).toBeTruthy();
        }
        expect(rewardOnly.length, `reward-only starters: ${rewardOnly.join(', ')}`).toBe(24);
    });

    it('cardOrigin tags a non-preset id as a reward', () => {
        expect(cardOrigin('no-such-card-not-in-any-preset').source).toBe('reward');
    });

    it('enchantments sit player-side; disenchants attach to the enemy', () => {
        for (const card of cardLibrary.filter(c => c.cardType === 'enchantment')) {
            expect(card.targetType, `${card.id}`).toBe('self');
        }
        for (const card of cardLibrary.filter(c => c.cardType === 'disenchant')) {
            expect(card.targetType, `${card.id}`).toBe('enemy');
        }
    });
});

describe('themed library — THE STRIKE IS DEAD (spec §1 schema gate)', () => {
    it("the library source never mentions 'basePower' or 'chipHp'", () => {
        // Schema-level regression gate: the fields were DELETED from Card/
        // CardRider, so any reintroduction is a compile error — this string
        // sweep additionally catches comments, casts, and `as any` smuggling.
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

describe('themed library — id hygiene and provenance', () => {
    it('every card has the v3 required shape', () => {
        for (const card of cardLibrary) {
            expect(card.id).toMatch(/^[a-z][a-z0-9-]*$/);
            expect([1, 2, 3]).toContain(card.tier);
            expect([1, 2, 3, 4, 5, 6]).toContain(card.rank);
            expect(['spell', 'enchantment', 'disenchant']).toContain(card.cardType);
            expect(['self', 'enemy']).toContain(card.targetType);
            expect(['body', 'mind', 'heart']).toContain(card.philosophicalAspect);
            // 2026-07-08 = the v3 wholesale replacement; 2026-07-17 = the D4
            // dice valves (promoted into the library in Phase D8);
            // 2026-07-18 = the swap-pool authoring date of the nine cards
            // promoted 2026-07-19 (valve precedent: authoring date kept).
            expect(['2026-07-08', '2026-07-17', '2026-07-18']).toContain(card.addedIn);
        }
    });

    it('the starting pair resolves and teaches a mechanic each', () => {
        expect(STARTING_CARD_IDS).toEqual(['slippery-slope', 'brace-for-impact']);
        for (const id of STARTING_CARD_IDS) {
            const card = getCardById(id);
            expect(card, id).toBeDefined();
            expect(card!.rank).toBe(1); // starters are Doxa
            expect(card!.tags).toContain('starter');
        }
    });

    it('the reward pool is the whole 86-card library and every id resolves', () => {
        expect(COMBAT_REWARD_POOL.length).toBe(86);
        for (const id of COMBAT_REWARD_POOL) {
            expect(getCardById(id), `reward pool: ${id}`).toBeDefined();
        }
    });
});

describe('themed library — dieBonus reachability under THE COLOR LAW (dice-law rework 2026-07-09)', () => {
    // Under the color law a card is only ever powered by a die of ITS OWN
    // stance, a WILD die, or (fate cards only) a dead X. A specific onColor can
    // therefore fire only when it EQUALS the card's stance ('match' is the
    // honest spelling of that), and onColor:'off' — a non-wild die of another
    // stance — can never fire at all: the play would have fizzled first.
    //
    // tu-quoque (HEART card, was onColor:'body') was the one KNOWN dead line —
    // handoff audit item 1 — fixed in phase 28 (recolored to 'heart', its own
    // philosophicalAspect). The pin has tightened to zero; the next author who
    // ships a dead dieBonus line reopens this list.
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
