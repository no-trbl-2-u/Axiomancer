/**
 * Hermetic E2E — THE BIG NUMBERS REWRITE's headline claim, proved.
 *
 * "I want to see bigger numbers." The scale ladder is only a promise until a
 * real card, played through the real engine, moves a real VITAE bar by a big
 * number. This suite is the receipt.
 *
 * It is deliberately NOT a balance band. It asserts a FLOOR on the top of the
 * curve — that the library still contains plays capable of triple digits when
 * a deck has been fed. Retune anything you like; if a payoff can no longer
 * reach 100 in a fed deck, the pillar has quietly been lost and this goes red.
 *
 * Measured 2026-09-02 on a board fed to 12 stacks of poison / bleed / mark /
 * doom with 12 Souls, 12 Charges and 12 Conviction banked — the top ten plays
 * in the library, by VITAE removed in a single resolution:
 *
 *   communion-of-the-worm  1112 (r5)   miserere              366 (r6)
 *   the-butchers-sacrament  612 (r5)   nothing-to-report     333 (r6)
 *   last-rites-sung-early   426 (r3)   usury                 324 (r3)
 *   every-wound-accounted   423 (r6)   pressed-for-a-plea    320 (r4)
 *   the-blister-rosary      376 (r2)   the-coffin-path       320 (r4)
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { lookupEffect } from '../../Effects/effects.library';
import { applyEffect } from '../../Effects';
import { cardLibrary, getCardById } from '../../Cards/cards.library';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const rng = (): number => 0.5;

/** A player rich enough to power anything, with a very large VITAE pool so a
 *  card's own RECOIL never kills the witness mid-measurement. */
function richPlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = [...new Set(cards)];
    p.baseStats = { heart: 40, body: 40, mind: 40 };
    p.health = 5000; p.maxHealth = 5000;
    p.effects = [];
    return p;
}

/** A foe with a pool deep enough that nothing clips against lethal, and no
 *  HIDE — armour is measured elsewhere; this measures the ceiling. */
function fatEnemy(): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-ceiling-dummy';
    e.health = 100_000; e.maxHealth = 100_000;
    e.effects = [];
    e.keywords = [];
    e.stages = [];
    return e;
}

/** Loads the foe with a deep affliction board — the "fed deck" precondition
 *  every payoff in the library is priced against. */
function feed(enemy: Enemy, round = 1): Enemy {
    let effects = enemy.effects;
    for (const [id, intensity] of [
        ['debuff_poison', 12], ['debuff_bleed', 12],
        ['debuff_mark', 12], ['debuff_creeping_doom', 12],
    ] as const) {
        const def = lookupEffect(id);
        if (!def) continue;
        effects = applyEffect(effects, def, round, { intensityDelta: intensity }).activeEffects;
    }
    return { ...enemy, effects };
}

/** Opens an encounter with `cardId` seated in hand and a colour-legal die
 *  in the tray, with the foe's board already fed. */
function openFed(cardId: string, color: CombatDieColor): CombatEncounterState {
    const deck = [cardId, cardId, cardId, cardId, cardId];
    let s = initializeCombatEncounter(richPlayer(deck), feed(fatEnemy()), deck, 7);
    s = rollEncounterDice(s, rng).state;
    const dice = [
        { id: 't1-d0', color, state: 'available' as const, temporary: false },
        { id: 't1-d1', color, state: 'available' as const, temporary: false },
    ];
    s = { ...s, dice };
    return {
        ...s,
        hand: [{ uid: 'ceiling-under-test', cardId }, ...s.hand],
        // The banked currencies a payoff card is priced against.
        souls: 12,
        premises: 12,
        conviction: 12,
    };
}

/** VITAE removed by one PAID play of `cardId`. */
function paidBurst(cardId: string): number {
    const card = getCardById(cardId);
    if (!card) return 0;
    // Phase 104 — the grey office's colourless 'any' aspect has no die
    // colour of its own; wild powers it same as every other card.
    const s = openFed(cardId, card.philosophicalAspect === 'any' ? 'wild' : card.philosophicalAspect);
    const before = s.enemy.health;
    const res = playCombatCard(s, { uid: 'ceiling-under-test' }, true, 't1-d0', rng);
    return before - res.state.enemy.health;
}

describe('the top of the curve — bigger numbers, proved through the engine', () => {
    it('at least five library cards remove 100+ VITAE in a single resolution', () => {
        const spells = cardLibrary.filter(c => c.cardType === 'spell' && c.theme !== 'curse');
        const bursts = spells
            .map(c => ({ id: c.id, rank: c.rank, burst: paidBurst(c.id) }))
            .filter(r => r.burst >= 100)
            .sort((a, b) => b.burst - a.burst);

        // Reported on failure so a regression names the survivors rather than
        // just a count.
        expect(
            bursts.length,
            `only ${bursts.length} card(s) reach 100 in one play: ${bursts.map(b => `${b.id}=${b.burst}`).join(', ')}`,
        ).toBeGreaterThanOrEqual(5);
    });

    it('the single biggest play in the library clears 200', () => {
        const spells = cardLibrary.filter(c => c.cardType === 'spell' && c.theme !== 'curse');
        const best = spells.reduce(
            (top, c) => {
                const burst = paidBurst(c.id);
                return burst > top.burst ? { id: c.id, burst } : top;
            },
            { id: '', burst: 0 },
        );
        expect(best.burst, `the library's ceiling is ${best.id} at ${best.burst}`).toBeGreaterThan(200);
    });

    it('a Saint-rank card hits harder than an Ash-rank one, on the same board', () => {
        // The ladder's whole claim in one assertion: rank buys magnitude. Read
        // as MEDIANS so one oddly-shaped card cannot flip it.
        const median = (xs: number[]): number => {
            if (xs.length === 0) return 0;
            const s = [...xs].sort((a, b) => a - b);
            return s[Math.floor(s.length / 2)];
        };
        const burstsAtRank = (rank: number): number[] => cardLibrary
            .filter(c => c.cardType === 'spell' && c.theme !== 'curse' && c.rank === rank)
            .map(c => paidBurst(c.id));

        const ash = median(burstsAtRank(1));
        const saint = median(burstsAtRank(6));
        expect(saint, `Ash median ${ash} vs Saint median ${saint}`).toBeGreaterThan(ash);
    });
});
