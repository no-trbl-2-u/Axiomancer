/**
 * Hermetic E2E — the Blood Price SANDBOX runtime (branch sandbox/blood-price-sims).
 *
 * Pins the glossary the sims run on: SACRIFICE as a cost with a 1-VITAE
 * floor, HEAL capped at max VITAE, EXILE, the Global lifecycle (FREE 3 turn
 * starts, one copy in play), Global triggers, the grey Curse (cannot be
 * scrapped), and the printed-number-is-the-applied-number check over every
 * plain ballot line. The sandbox is wiped after the file.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Player } from '../../Character/characters.mock';
import { Sandbag_01, FloatEye } from '../../Enemy/enemy.library';
import { clearSandboxCards } from '../../Cards/cards.sandbox';
import { getCardById } from '../../Cards/cards.library';
import { BLOOD_PRICE_CARDS, registerBloodPriceCards } from '../../Cards/sandbox/blood-price.cards';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, discardCombatCard,
    startTurn, colorMatchBonus, BLOOD_PRICE_KIT,
} from '../combat.engine';
import { bloodPriceIllegalReason, BP_CURSE_ID } from '../combat.blood-price';
import type { CombatEncounterState } from '../combat.encounter.types';

beforeAll(() => registerBloodPriceCards());
afterAll(() => clearSandboxCards());

const FILLER = 'bp-P-01b';

/** A fight at neutral stats against a 500-VITAE sandbag, `hand` in hand,
 *  the player at `vitae`, one wild die on the table. */
function fight(hand: string[], vitae = 100): CombatEncounterState {
    const enemy = { ...deepClone(Sandbag_01), health: 500, maxHealth: 500 };
    let s = initializeCombatEncounter(deepClone(Player), enemy, [...hand, ...Array(10).fill(FILLER)], 7);
    s = rollEncounterDice(s).state;
    return {
        ...s,
        hand: hand.map((cardId, i) => ({ uid: `t${i}`, cardId })),
        player: { ...s.player, health: vitae },
        dice: [{ id: 'w', color: 'wild', state: 'available', temporary: false, face: 'mana' }],
        reserve: [],
        guard: 0,
        conviction: 0,
    };
}

const play = (s: CombatEncounterState, uid: string, paid: boolean) =>
    playCombatCard(s, { uid }, paid, paid ? 'w' : undefined).state;

describe('Blood Price sandbox runtime', () => {
    it('registers 90 proposals plus the grey Curse; library fights carry no ledger', () => {
        expect(BLOOD_PRICE_CARDS).toHaveLength(91);
        const plain = initializeCombatEncounter(deepClone(Player), deepClone(FloatEye), ['grey-strike', 'grey-ward'], 1);
        expect(plain.bp).toBeUndefined();
    });

    it('SACRIFICE is an unscaled cost; DEAL lands its printed number', () => {
        const s = play(fight(['bp-P-01a']), 't0', false);
        expect(s.player.health).toBe(98);
        expect(s.enemy.health).toBe(495);
        expect(s.bp!.sacrificePaid).toBe(2);
        expect(s.bp!.sacrificeCount).toBe(1);
        expect(s.discard).toContain('bp-P-01a');
    });

    it('a line whose SACRIFICE would leave less than 1 VITAE cannot be played', () => {
        const before = fight(['bp-P-01a'], 2);
        expect(bloodPriceIllegalReason(before, 't0', false, BLOOD_PRICE_KIT)).toMatch(/below 1 VITAE/);
        const after = playCombatCard(before, { uid: 't0' }, false);
        expect(after.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(after.state.player.health).toBe(2);
        expect(after.state.hand).toHaveLength(1);
    });

    it('HEAL is capped at max VITAE', () => {
        const s = play(fight(['bp-M-01a'], 169), 't0', false);
        expect(s.player.health).toBe(170);
    });

    it('EXILE on a PAID line removes the card from combat', () => {
        const s = play(fight(['bp-M-01c']), 't0', true);
        expect(s.discard).not.toContain('bp-M-01c');
        expect(s.bp!.exiled).toContain('bp-M-01c');
    });

    it('a FREE Global fires on 3 turn starts, then goes to discard; one copy in play', () => {
        let s = play(fight(['bp-M-08a', 'bp-M-08a'], 100), 't0', false);
        expect(s.bp!.globals).toEqual([{ cardId: 'bp-M-08a', paid: false, turnsLeft: 3 }]);
        expect(bloodPriceIllegalReason(s, 't1', false, BLOOD_PRICE_KIT)).toMatch(/already in play/);
        for (let turn = 1; turn <= 3; turn++) {
            s = startTurn({ ...s, turnTakenThisPhase: false }).state;
            expect(s.player.health).toBe(100 + 2 * turn);
        }
        expect(s.bp!.globals).toEqual([]);
        expect(s.discard).toContain('bp-M-08a');
    });

    it('a SACRIFICE fires the 🩸 Globals in play', () => {
        let s = play(fight(['bp-P-10a', 'bp-P-01a']), 't0', false);
        s = play(s, 't1', false);
        // DEAL 5 plus "the foe loses n" for SACRIFICE 2.
        expect(s.enemy.health).toBe(500 - 5 - 2);
    });

    it('the grey Curse: added by a card, cannot be scrapped, FREE costs 5, PAID costs 10 and EXILEs', () => {
        let s = play(fight(['bp-E-01a']), 't0', false);
        const curse = s.hand.find(h => h.cardId === BP_CURSE_ID)!;
        expect(curse).toBeDefined();
        expect(s.conviction).toBe(2);
        const scrap = discardCombatCard(s, curse.uid);
        expect(scrap.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(scrap.state.hand).toContainEqual(curse);
        s = play(s, curse.uid, false);
        expect(s.player.health).toBe(95);
        expect(s.discard).toContain(BP_CURSE_ID);
        let t = play(fight(['bp-E-01a']), 't0', false);
        const c2 = t.hand.find(h => h.cardId === BP_CURSE_ID)!;
        t = play(t, c2.uid, true);
        expect(t.player.health).toBe(90);
        expect(t.bp!.exiled).toContain(BP_CURSE_ID);
    });

    it('a condition gates its line ("Only at one-third VITAE or less")', () => {
        expect(bloodPriceIllegalReason(fight(['bp-P-04a'], 100), 't0', false, BLOOD_PRICE_KIT)).toMatch(/condition/);
        expect(bloodPriceIllegalReason(fight(['bp-P-04a'], 50), 't0', false, BLOOD_PRICE_KIT)).toBeNull();
    });

    it('every plain ballot line applies its printed numbers (PAID adds the colour-match bonus)', () => {
        const PLAIN = /^(?:(?:SACRIFICE \d+|DEAL \d+|GUARD \d+|Heal \d+|gain \d+ Conviction|the foe loses \d+ VITAE|EXILE)[,.;]?\s*)+$/i;
        const mismatches: string[] = [];
        let checked = 0;
        for (const card of BLOOD_PRICE_CARDS) {
            const spec = card.bloodPrice!;
            if (spec.global || spec.curse) continue;
            for (const paid of [false, true]) {
                const line = paid ? spec.paid! : spec.free!;
                if (!PLAIN.test(line.text)) continue;
                checked++;
                const sum = (re: RegExp): number => [...line.text.matchAll(re)].reduce((a, m) => a + Number(m[1]), 0);
                const bonus = (n: number): number => (paid && n > 0 && card.color !== 'any' ? n + colorMatchBonus(n) : n);
                const deals = [...line.text.matchAll(/DEAL (\d+)/g)].reduce((a, m) => a + bonus(Number(m[1])), 0);
                const want = {
                    enemy: deals + sum(/loses (\d+) VITAE/g),
                    player: -sum(/SACRIFICE (\d+)/g) + bonus(sum(/Heal (\d+)/gi)),
                    guard: bonus(sum(/GUARD (\d+)/g)),
                    conviction: sum(/gain (\d+) Conviction/g),
                };
                const before = fight([card.id], 100);
                const after = play(before, 't0', paid);
                const got = {
                    enemy: before.enemy.health - after.enemy.health,
                    player: after.player.health - before.player.health,
                    guard: (after.guard ?? 0) - (before.guard ?? 0),
                    conviction: after.conviction - before.conviction,
                };
                if (JSON.stringify(got) !== JSON.stringify(want)) {
                    mismatches.push(`${card.id} ${paid ? 'PAID' : 'FREE'} "${line.text}" want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
                }
            }
        }
        expect(checked).toBeGreaterThan(40);
        expect(mismatches).toEqual([]);
    });

    it('every proposal has a line that can be played in some state', () => {
        const never: string[] = [];
        const states = (id: string): CombatEncounterState[] => {
            const withCurses = (s: CombatEncounterState): CombatEncounterState => ({
                ...s,
                hand: [...s.hand, { uid: 'cz', cardId: BP_CURSE_ID }],
                discard: [...s.discard, BP_CURSE_ID],
            });
            return [fight([id], 170), fight([id], 40), withCurses(fight([id], 40))];
        };
        for (const card of BLOOD_PRICE_CARDS) {
            if (card.bloodPrice!.curse) continue;
            const ok = states(card.id).some(s =>
                [false, true].some(p => bloodPriceIllegalReason(s, 't0', p, BLOOD_PRICE_KIT) === null));
            if (!ok) never.push(card.id);
        }
        expect(never).toEqual([]);
        expect(getCardById('bp-P-01a')!.cardType).toBe('attack');
    });
});
