/**
 * Hermetic E2E — the Blood Price trial set and the program runtime it rides.
 *
 * The set's own test (the only test that names its card ids). Pins:
 *   · the set: 30 lane cards (11 red / 9 blue / 10 purple), the grey Curse,
 *     the lane and T's 20-card test deck;
 *   · the rulings: SACRIFICE as an unscaled cost with a 1-VITAE floor, WAIVE,
 *     HEAL capped at max VITAE, "heal the damage dealt" unscaled, EXILE, the
 *     Global lifecycle (FREE 3 turn starts, PAID rest of combat, one copy in
 *     play), Global triggers, the Curse (cannot be scrapped, played WAIVED by
 *     another card), TETHER and LEECH, the death ward, the delayed HEAL;
 *   · printed equals applied: every plain line lands the numbers its face
 *     prints, at neutral stats and at raised stats;
 *   · every card has a line that can be played in some state.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import { Sandbag_01, FloatEye } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { getCardById } from '../cards.library';
import { getCardLane } from '../card.lanes';
import { BLOOD_PRICE_SET } from '../library/blood-price.cards';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, discardCombatCard,
    startTurn, resolveThreatPhase, handCards, PROGRAM_KIT,
} from '../../Combat/combat.engine';
import { programIllegalReason, programXRange } from '../../Combat/combat.card-program';
import type { CombatEncounterState } from '../../Combat/combat.encounter.types';
import type { BaseStats } from '../../Character/types';

const CURSE = 'bp-curse';
const FILLER = 'grey-strike';
const LANE_CARDS = BLOOD_PRICE_SET.cards.filter(c => c.cardType !== 'curse');
const WILD = { id: 'w', color: 'wild' as const, state: 'available' as const, temporary: false, face: 'mana' as const };

/** A fight against a 500-VITAE sandbag with `hand` in hand, the player at
 *  `vitae`, one wild die on the table. */
function fight(hand: string[], vitae = 100, stats?: BaseStats, foe: Enemy = Sandbag_01): CombatEncounterState {
    const enemy = { ...deepClone(foe), health: 500, maxHealth: 500 };
    const player = { ...deepClone(Player), ...(stats ? { baseStats: stats } : {}) };
    let s = initializeCombatEncounter(player, enemy, [...hand, ...Array(10).fill(FILLER)], 7);
    s = rollEncounterDice(s).state;
    return {
        ...s,
        hand: hand.map((cardId, i) => ({ uid: `t${i}`, cardId })),
        player: { ...s.player, health: vitae },
        dice: [{ ...WILD }],
        reserve: [],
        guard: 0,
        conviction: 0,
    };
}

const play = (s: CombatEncounterState, uid: string, paid: boolean, x?: number): CombatEncounterState =>
    playCombatCard({ ...s, dice: [{ ...WILD }] }, { uid }, paid, paid ? 'w' : undefined, undefined, x).state;

describe('the Blood Price set', () => {
    it('holds the 30 kept cards (11 red, 9 blue, 10 purple) and the grey Curse', () => {
        expect(LANE_CARDS).toHaveLength(30);
        const by = (c: string) => LANE_CARDS.filter(card => card.color === c).length;
        expect([by('body'), by('mind'), by('heart')]).toEqual([11, 9, 10]);
        expect(getCardById(CURSE)?.cardType).toBe('curse');
        expect(getCardById(CURSE)?.color).toBe('any');
        expect(LANE_CARDS.filter(c => c.cardType === 'global').map(c => c.id).sort())
            .toEqual(['bp-e-03d', 'bp-e-09c', 'bp-m-08d', 'bp-p-10c']);
    });

    it('registers the lane with the 30 cards and the 20-card test deck', () => {
        const lane = getCardLane('blood-price');
        expect(lane?.name).toBe('Blood Price');
        expect(lane?.cardIds).toEqual(LANE_CARDS.map(c => c.id));
        expect(lane?.testDeck).toHaveLength(20);
        expect(new Set(lane?.testDeck).size).toBe(20);
        for (const id of lane!.testDeck) expect(lane!.cardIds).toContain(id);
    });

    it('a fight without program cards carries no ledger', () => {
        const plain = initializeCombatEncounter(deepClone(Player), deepClone(Sandbag_01), ['grey-strike', 'grey-ward'], 1);
        expect(plain.program).toBeUndefined();
    });
});

describe('SACRIFICE, WAIVE, HEAL, EXILE', () => {
    it('SACRIFICE is an unscaled cost; DEAL lands its printed number', () => {
        const s = play(fight(['bp-p-01a']), 't0', false);
        expect(s.player.health).toBe(98);
        expect(s.enemy.health).toBe(495);
        expect(s.program!.sacrificePaid).toBe(2);
        expect(s.discard).toContain('bp-p-01a');
    });

    it('a line whose SACRIFICE would leave less than 1 VITAE cannot be played, and says why', () => {
        const before = fight(['bp-p-01a'], 2);
        expect(programIllegalReason(before, 't0', false, PROGRAM_KIT)).toMatch(/below 1 VITAE/);
        const after = playCombatCard(before, { uid: 't0' }, false);
        expect(after.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(after.state.player.health).toBe(2);
        expect(after.state.hand).toHaveLength(1);
    });

    it('a condition gates its line with a reason', () => {
        expect(programIllegalReason(fight(['bp-p-04c'], 100), 't0', false, PROGRAM_KIT)).toBe('only at half VITAE or less');
        expect(programIllegalReason(fight(['bp-p-04c'], 85), 't0', false, PROGRAM_KIT)).toBeNull();
        expect(programIllegalReason(fight(['bp-e-05c'], 100), 't0', true, PROGRAM_KIT)).toBe('needs a Curse in your hand');
    });

    it('HEAL is capped at max VITAE; healing past it becomes GUARD on M-09a', () => {
        const max = fight([]).player.maxHealth;
        expect(play(fight(['bp-m-01d'], max - 1), 't0', false).player.health).toBe(max);
        const s = play(fight(['bp-m-09a'], max - 1), 't0', false);
        expect(s.player.health).toBe(max);
        expect(s.guard).toBe(3);
    });

    it('"HEAL all the damage dealt" heals the actual amount, unscaled', () => {
        const s = play(fight(['bp-m-02b'], 100, { body: 10, mind: 10, heart: 5 }), 't0', true);
        // DEAL 6 at body 10 is 12; the heal copies it, capped at 8, and mind does not rescale it.
        expect(500 - s.enemy.health).toBe(12);
        expect(s.player.health).toBe(108);
    });

    it('EXILE on a PAID line removes the card from combat', () => {
        const s = play(fight(['bp-m-06c']), 't0', true);
        expect(s.discard).not.toContain('bp-m-06c');
        expect(s.program!.exiled).toContain('bp-m-06c');
    });

    it('WAIVE: the next SACRIFICE pays nothing but still counts and fires 🩸 Globals', () => {
        let s = play(fight(['bp-p-10c', 'bp-e-04c', 'bp-p-01a']), 't0', false);
        s = play(s, 't1', true);
        s = play(s, 't2', false);
        expect(s.player.health).toBe(100);
        expect(s.program!.sacrificeCount).toBe(1);
        // P-10c's GUARD n fires for the WAIVED SACRIFICE 2.
        expect(s.guard).toBe(2);
        expect(s.conviction).toBe(1);
    });
});

describe('Globals', () => {
    it('a FREE Global fires on 3 turn starts, then goes to discard; one copy in play', () => {
        let s = play(fight(['bp-m-08d', 'bp-m-08d']), 't0', false);
        expect(s.program!.globals).toEqual([{ cardId: 'bp-m-08d', paid: false, turnsLeft: 3 }]);
        expect(programIllegalReason(s, 't1', false, PROGRAM_KIT)).toMatch(/already in play/);
        for (let turn = 1; turn <= 3; turn++) {
            s = startTurn({ ...s, turnTakenThisPhase: false }).state;
            expect(s.program!.leech).toBe(turn);
        }
        expect(s.program!.globals).toEqual([]);
        expect(s.discard).toContain('bp-m-08d');
    });

    it('a PAID Global stays for the rest of combat', () => {
        let s = play(fight(['bp-m-08d']), 't0', true);
        expect(s.program!.globals).toEqual([{ cardId: 'bp-m-08d', paid: true, turnsLeft: null }]);
        for (let turn = 1; turn <= 5; turn++) s = startTurn({ ...s, turnTakenThisPhase: false }).state;
        expect(s.program!.globals).toHaveLength(1);
        expect(s.program!.leech).toBe(10);
    });

    it('a SACRIFICE fires the 🩸 Globals: P-10c FREE is GUARD n, PAID is DEAL n', () => {
        const free = play(play(fight(['bp-p-10c', 'bp-p-01a']), 't0', false), 't1', false);
        expect(free.guard).toBe(2);
        expect(free.enemy.health).toBe(495);
        const paid = play(play(fight(['bp-p-10c', 'bp-p-01a']), 't0', true), 't1', false);
        expect(paid.enemy.health).toBe(500 - 5 - 2);
    });

    it('a ⟳ Global whose SACRIFICE cannot be paid does not resolve', () => {
        let s = play(fight(['bp-e-03d'], 2), 't0', false);
        s = startTurn({ ...s, turnTakenThisPhase: false }).state;
        expect(s.player.health).toBe(2);
        expect(s.program!.leech).toBe(0);
    });
});

describe('the grey Curse', () => {
    it('is added by E-01a, cannot be scrapped, FREE costs 5, PAID costs 10 and EXILEs', () => {
        let s = play(fight(['bp-e-01a']), 't0', false);
        const curse = s.hand.find(h => h.cardId === CURSE)!;
        expect(curse).toBeDefined();
        expect(s.conviction).toBe(2);
        const scrap = discardCombatCard(s, curse.uid);
        expect(scrap.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(scrap.state.hand).toContainEqual(curse);
        s = play(s, curse.uid, false);
        expect(s.player.health).toBe(95);
        expect(s.discard).toContain(CURSE);
        let t = play(fight(['bp-e-01a']), 't0', false);
        t = play(t, t.hand.find(h => h.cardId === CURSE)!.uid, true);
        expect(t.player.health).toBe(90);
        expect(t.program!.exiled).toContain(CURSE);
    });

    it('E-05c PAID plays the Curse\'s PAID line WAIVED: it is EXILED, counts, and fires 📜 Globals', () => {
        let s = play(fight(['bp-e-09c', 'bp-e-01a', 'bp-e-05c']), 't0', false);
        s = play(s, 't1', false);
        s = play(s, 't2', true);
        expect(s.player.health).toBe(100);
        expect(s.program!.exiled).toContain(CURSE);
        expect(s.program!.sacrificeCount).toBe(1);
        expect(s.enemy.health).toBe(496);
    });

    it('E-08b returns a Curse from the discard; M-04c EXILEs one from hand', () => {
        const base = fight(['bp-e-08b', 'bp-m-04c']);
        let s = play({ ...base, discard: [CURSE] }, 't0', false);
        expect(s.hand.some(h => h.cardId === CURSE)).toBe(true);
        s = play(s, 't1', true);
        expect(s.hand.some(h => h.cardId === CURSE)).toBe(false);
        expect(s.program!.exiled).toEqual([CURSE]);
    });
});

describe('TETHER, LEECH and the wards', () => {
    it('TETHER: each SACRIFICE instance deals what it paid; a WAIVED one deals 0', () => {
        const s = play(fight(['bp-e-02d']), 't0', true);
        expect(s.player.health).toBe(97);
        expect(s.enemy.health).toBe(497);
        let t = play(fight(['bp-e-04c', 'bp-e-10d']), 't0', true);
        t = play(t, 't1', false);
        expect(t.enemy.health).toBe(500);
        expect(t.program!.sacrificeCount).toBe(1);
    });

    it('LEECH: at the foe\'s turn the foe loses n, you heal what it lost, n drops by 1; LEECH adds', () => {
        let s = play(fight(['bp-m-01d', 'bp-m-01d']), 't0', true);
        s = play(s, 't1', true);
        expect(s.program!.leech).toBe(8);
        const r = resolveThreatPhase(s).state;
        expect(r.program!.leech).toBe(7);
        expect(500 - r.enemy.health).toBeGreaterThanOrEqual(8);
    });

    it('LEECH is heart-scaled when applied', () => {
        const s = play(fight(['bp-m-01d'], 100, { body: 5, mind: 5, heart: 10 }), 't0', true);
        expect(s.program!.leech).toBe(6);
    });

    it('the death ward keeps VITAE at 1 this turn; the delayed HEAL lands next turn', () => {
        const unwarded = resolveThreatPhase(fight(['bp-m-06c'], 2, undefined, FloatEye)).state;
        expect(unwarded.finalOutcome).toBe('defeat');
        let s = play(fight(['bp-m-06c'], 2, undefined, FloatEye), 't0', true);
        s = resolveThreatPhase(s).state;
        expect(s.player.health).toBe(1);
        expect(s.finalOutcome).toBeNull();
        const low = s.player.health;
        s = startTurn(s).state;
        expect(s.player.health).toBe(low + 5);
    });

    it('E-07b doubles the next SACRIFICE: cost and what it counts as', () => {
        let s = play(fight(['bp-e-07b', 'bp-p-01a']), 't0', false);
        s = play(s, 't1', false);
        expect(s.player.health).toBe(96);
        expect(s.program!.sacrificeCount).toBe(2);
    });

    it('SACRIFICE any amount takes the player\'s X, capped by the printed max and the 1-VITAE floor', () => {
        const s = fight(['bp-e-10d'], 10);
        expect(programXRange(s, 't0', true, PROGRAM_KIT)).toEqual({ min: 1, max: 9 });
        expect(programXRange(fight(['bp-e-10d'], 100), 't0', true, PROGRAM_KIT)).toEqual({ min: 1, max: 15 });
        expect(programXRange(s, 't0', false, PROGRAM_KIT)).toBeNull();
        const after = play(fight(['bp-e-10d'], 100), 't0', true, 7);
        expect(after.player.health).toBe(93);
        expect(after.enemy.health).toBe(493);
        expect(programIllegalReason(s, 't0', true, PROGRAM_KIT, 10)).toMatch(/below 1 VITAE/);
    });
});

/** Every number a plain line prints, summed per kind. */
const PLAIN = /^(?:(?:SACRIFICE \d+|DEAL \d+|GUARD \d+|HEAL \d+|gain \d+ Conviction|the foe loses \d+ VITAE|EXILE)[,.;]?\s*)+$/i;

function printedEqualsApplied(stats: BaseStats): { checked: number; mismatches: string[] } {
    const mismatches: string[] = [];
    let checked = 0;
    for (const card of LANE_CARDS) {
        if (card.program?.global) continue;
        for (const paid of [false, true]) {
            const before = fight([card.id], 100, stats);
            const hand = handCards(before).find(h => h.uid === 't0')!.card;
            const face = (paid ? hand.bottomActionText : hand.topActionText)
                .replace(/^(FREE|PAID) — /, '').replace(/ \(Ash\)$/, '').replace(/ Costs 1 die\.$/, '');
            if (!PLAIN.test(face)) continue;
            checked++;
            const sum = (re: RegExp): number => [...face.matchAll(re)].reduce((a, m) => a + Number(m[1]), 0);
            const want = {
                enemy: sum(/DEAL (\d+)/g) + sum(/loses (\d+) VITAE/g),
                player: -sum(/SACRIFICE (\d+)/g) + sum(/HEAL (\d+)/g),
                guard: sum(/GUARD (\d+)/g),
                conviction: sum(/gain (\d+) Conviction/gi),
            };
            const after = play(before, 't0', paid);
            const got = {
                enemy: before.enemy.health - after.enemy.health,
                player: after.player.health - before.player.health,
                guard: (after.guard ?? 0) - (before.guard ?? 0),
                conviction: after.conviction - before.conviction,
            };
            if (JSON.stringify(got) !== JSON.stringify(want)) {
                mismatches.push(`${card.id} ${paid ? 'PAID' : 'FREE'} "${face}" want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
            }
        }
    }
    return { checked, mismatches };
}

describe('printed equals applied', () => {
    it('every plain line lands the numbers its face prints, at neutral stats', () => {
        const r = printedEqualsApplied({ body: 5, mind: 5, heart: 5 });
        expect(r.checked).toBeGreaterThanOrEqual(15);
        expect(r.mismatches).toEqual([]);
    });

    it('and at raised stats (the face prints the scaled number)', () => {
        const r = printedEqualsApplied({ body: 8, mind: 7, heart: 9 });
        expect(r.checked).toBeGreaterThanOrEqual(15);
        expect(r.mismatches).toEqual([]);
    });

    it('a VULNERABLE face prints the heart-scaled percent it lands', () => {
        const s = fight(['bp-m-07a'], 100, { body: 5, mind: 5, heart: 10 });
        const face = handCards(s)[0].card.topActionText;
        expect(face).toContain('+20%');
        const after = play(s, 't0', false);
        expect(after.enemy.effects.find(e => e.effectId === 'debuff_vulnerable')?.intensity).toBe(20);
    });

    it('every card has a line that can be played in some state', () => {
        const never: string[] = [];
        for (const card of LANE_CARDS) {
            const states = [fight([card.id], 170), fight([card.id], 40)];
            states.push({ ...states[1], hand: [...states[1].hand, { uid: 'cz', cardId: CURSE }], discard: [CURSE] });
            const ok = states.some(s => [false, true].some(p => programIllegalReason(s, 't0', p, PROGRAM_KIT) === null));
            if (!ok) never.push(card.id);
        }
        expect(never).toEqual([]);
    });
});
