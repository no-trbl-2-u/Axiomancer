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
import { rankToRarity, CARD_RANK_NAMES } from '../types';
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

const byTheme = new Map<string, Card[]>(THEMES.map(t => [t, []]));
for (const card of cardLibrary) {
    const theme = themeOf(card);
    if (theme) byTheme.get(theme)!.push(card);
}

describe('themed library — shape contract (spec 32 v3 §6-7)', () => {
    it('is exactly 79 unique cards (70 post-D8 + the 9 owner-ratified 2026-07-19 swap-pool promotions)', () => {
        expect(cardLibrary.length).toBe(79);
        const ids = cardLibrary.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every card carries exactly one of the ten theme tags', () => {
        for (const card of cardLibrary) {
            expect(themeOf(card), `${card.id} must carry exactly one theme tag`).toBeDefined();
        }
    });

    // ── Phase D8 (2026-07-18): the ten-in/ten-out valve promotion broke the
    // spec-32 per-theme symmetry (7 cards / 2C 2U 3R / 1 ench + 1 dis per
    // theme). The retirement ledger was FORCED — only the reward-only ten
    // were unreferenced by presets, and they measured zero plays in 345,600
    // encounters (plan/tuning/2026-07-18-d8-preset-dice-valves.md). The
    // post-D8 shape is pinned EXACTLY below so drift is still caught;
    // restoring per-theme symmetry (authoring replacement ench/dis cards) is
    // the next library phase's work, not an accident to lint away.
    // 2026-07-19: the nine owner-ratified swap-pool promotions (all spells)
    // grew seven themes — affliction/forge +1 common, peroration +1 common
    // +1 rare, oracle/charm/echo +1 uncommon, bulwark +1 common +1 rare.
    // Ench/dis counts unchanged (no passive was promoted).
    it('each theme matches the pinned post-promotion shape (cards / rarities / types)', () => {
        const POST_D8_SHAPE: Record<string, {
            n: number; common: number; uncommon: number; rare: number;
            enchantment: number; disenchant: number;
        }> = {
            affliction: { n: 8, common: 2, uncommon: 3, rare: 3, enchantment: 1, disenchant: 1 },
            peroration: { n: 8, common: 3, uncommon: 3, rare: 2, enchantment: 0, disenchant: 0 },
            forge:      { n: 8, common: 3, uncommon: 2, rare: 3, enchantment: 2, disenchant: 0 },
            akrasia:    { n: 8, common: 2, uncommon: 3, rare: 3, enchantment: 1, disenchant: 1 },
            control:    { n: 7, common: 2, uncommon: 3, rare: 2, enchantment: 0, disenchant: 1 },
            oracle:     { n: 8, common: 2, uncommon: 4, rare: 2, enchantment: 1, disenchant: 0 },
            harvest:    { n: 6, common: 1, uncommon: 3, rare: 2, enchantment: 1, disenchant: 0 },
            charm:      { n: 8, common: 2, uncommon: 4, rare: 2, enchantment: 1, disenchant: 1 },
            bulwark:    { n: 10, common: 4, uncommon: 2, rare: 4, enchantment: 1, disenchant: 1 },
            echo:       { n: 8, common: 3, uncommon: 2, rare: 3, enchantment: 1, disenchant: 1 },
        };
        for (const theme of THEMES) {
            const cards = byTheme.get(theme)!;
            const pin = POST_D8_SHAPE[theme];
            expect(pin, `theme ${theme} needs a shape pin`).toBeDefined();
            expect(cards.length, `theme ${theme} cards`).toBe(pin.n);
            expect(cards.filter(c => rankToRarity(c.rank) === 'common').length, `${theme} commons`).toBe(pin.common);
            expect(cards.filter(c => rankToRarity(c.rank) === 'uncommon').length, `${theme} uncommons`).toBe(pin.uncommon);
            expect(cards.filter(c => rankToRarity(c.rank) === 'rare').length, `${theme} rares`).toBe(pin.rare);
            expect(cards.filter(c => c.cardType === 'enchantment').length, `${theme} enchantments`).toBe(pin.enchantment);
            expect(cards.filter(c => c.cardType === 'disenchant').length, `${theme} disenchants`).toBe(pin.disenchant);
            // Every ench/dis that exists is still rare (the rank law survives
            // on the survivors even where a theme lost its pair).
            for (const c of cards.filter(x => x.cardType !== 'spell')) {
                expect(rankToRarity(c.rank), `${theme} ${c.id}`).toBe('rare');
            }
        }
        // The raggedness sums back to the 79-card law.
        expect(Object.values(POST_D8_SHAPE).reduce((s, p) => s + p.n, 0)).toBe(79);
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

    it('cardOrigin tags every library card as a starter, except the eighteen documented reward-only cards', () => {
        // The 5/5/5 color law squeezes 10 cards (the D8 valves, flag-on-only
        // seats) out of every recipe, and the 2026-07-19 promotions unseated
        // 8 incumbents (pinned by id in deck-presets.engine.test.ts); all 18
        // remain in the reward pool and surface through drafts instead.
        const rewardOnly: string[] = [];
        for (const card of cardLibrary) {
            const origin = cardOrigin(card.id);
            if (origin.source === 'reward') { rewardOnly.push(card.id); continue; }
            expect(origin.presetDeck, `${card.id} presetDeck`).toBeTruthy();
        }
        expect(rewardOnly.length, `reward-only starters: ${rewardOnly.join(', ')}`).toBe(18);
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

describe('themed library — THE FREE-CURRENCY LAW (phase 30, turn-texture.md §1)', () => {
    // Owner-ratified 2026-07-10: every FREE line must deposit theme currency
    // — never damage, never a bare generic draw. A weak-enough deposit MAY
    // additionally carry a DRAW-1-class utility kicker; generic draw ALONE
    // remains banned. TICK is dead registry-wide (retired with this pass,
    // not merely renamed) — the ten `free: { tickOne: true }` lines the
    // 2026-07-10 audit counted are gone.
    const CURRENCY_FIELDS = [
        'applyEffect', 'premises', 'sway', 'souls', 'foretell', 'pips',
        'stagger', 'barrier', 'recoil', 'millCards', 'revealStance',
    ] as const;
    const UTILITY_ONLY_FIELDS = ['drawCards', 'guard', 'healHp', 'cleanse', 'conviction'] as const;

    it("the library source never mentions 'tickOne' — TICK is dead, not renamed", () => {
        const source = readFileSync(resolve(__dirname, '..', 'cards.library.ts'), 'utf8');
        expect(source.includes('tickOne')).toBe(false);
    });

    it('no spell FREE line carries tickAllDots or ruptureMarks (damage verbs are not FREE-legal)', () => {
        for (const card of cardLibrary.filter(c => c.cardType === 'spell')) {
            expect(card.free?.tickAllDots, `${card.id}`).toBeFalsy();
            expect(card.free?.ruptureMarks, `${card.id}`).toBeFalsy();
        }
    });

    it('every spell FREE line deposits at least one theme-currency verb', () => {
        const noncompliant = cardLibrary
            .filter(c => c.cardType === 'spell')
            .filter(c => !CURRENCY_FIELDS.some(f => (c.free as Record<string, unknown> | undefined)?.[f]))
            .map(c => c.id);
        expect(noncompliant).toEqual([]);
    });

    it('a bare utility field (draw/guard/heal/cleanse/conviction) never stands alone on FREE', () => {
        const bareUtility = cardLibrary
            .filter(c => c.cardType === 'spell')
            .filter((c) => {
                const free = c.free as Record<string, unknown> | undefined;
                if (!free) return false;
                const hasCurrency = CURRENCY_FIELDS.some(f => free[f]);
                const hasUtility = UTILITY_ONLY_FIELDS.some(f => free[f]);
                return hasUtility && !hasCurrency;
            })
            .map(c => c.id);
        expect(bareUtility).toEqual([]);
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
            expect(['fallacy', 'paradox']).toContain(card.category);
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

    it('the reward pool is the whole 79-card library and every id resolves', () => {
        expect(COMBAT_REWARD_POOL.length).toBe(79);
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
