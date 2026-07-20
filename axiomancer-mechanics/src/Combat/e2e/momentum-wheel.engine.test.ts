/**
 * Hermetic E2E — Phase 31 (EA-6, plan/tuning/2026-07-10-momentum-scoping.md
 * work item 1): the combat MOMENTUM wheel, ported engine-native from the
 * mobile host-side write (`axiomancer-mobile/state/combat/momentum.ts` +
 * `CombatEncounterPanel.tsx`'s `onApply`).
 *
 * Truth table ported 1:1 from the mobile module's own test
 * (`axiomancer-mobile/state/combat/__tests__/momentum.test.ts`) plus the two
 * rules this port newly ratifies:
 *   - a FIZZLED play does NOT advance the wheel (a correction over the host,
 *     which advanced the wheel before the engine confirmed the play landed);
 *   - a FREE (unpowered, top) play DOES advance the wheel — matches the host.
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, draftStanceDie,
    isMomentumDieId, getFloatingDiceColors,
} from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// One FREE-riderless spell per stance color — a top play always lands (no
// draft/color-law fizzle path applies to FREE plays), so these fixtures
// isolate the wheel-advance reducer from every other play concern.
registerSandboxCards([
    {
        id: 'qa-wheel-heart', name: 'QA Wheel Heart',
        philosophicalAspect: 'heart', description: 'wheel-test heart fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-wheel-body', name: 'QA Wheel Body',
        philosophicalAspect: 'body', description: 'wheel-test body fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-wheel-mind', name: 'QA Wheel Mind',
        philosophicalAspect: 'mind', description: 'wheel-test mind fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
    },
]);

const rng = (): number => 0.5;

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    p.floatingDice = [];
    return p;
}

function makeEnemy(): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-wheel-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    return e;
}

const WHEEL_DECK = ['qa-wheel-heart', 'qa-wheel-heart', 'qa-wheel-body', 'qa-wheel-body', 'qa-wheel-mind', 'qa-wheel-mind'];

function open(): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(WHEEL_DECK), makeEnemy(), WHEEL_DECK, 7);
    s = rollEncounterDice(s, rng).state;
    // Keep-hand rule: the opening hand is 5 cards, one short of the 6-card
    // fixture deck — pin the hand so every wheel scenario (two hearts, one of
    // each stance) is present regardless of which card the shuffle leaves out.
    const pinned = ['qa-wheel-heart', 'qa-wheel-heart', 'qa-wheel-body', 'qa-wheel-mind', 'qa-wheel-body'];
    s = {
        ...s,
        hand: pinned.map((cardId, i) => ({ uid: `w${i}`, cardId })),
        drawPile: ['qa-wheel-mind'],
    };
    return s;
}

function playFree(s: CombatEncounterState, cardId: string): CombatEncounterState {
    const entry = s.hand.find(h => h.cardId === cardId);
    expect(entry).toBeDefined();
    const res = playCombatCard(s, { uid: entry!.uid }, false, undefined, rng);
    expect(res.events.some(e => e.kind === 'card-played')).toBe(true);
    return res.state;
}

describe('Phase 31 — momentum wheel (engine-native)', () => {
    it('starts anywhere: the first play lights its own node', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-body');
        expect(s.momentumWheel).toEqual(['body']);
    });

    it('right-stance succession lights the next node in wheel order', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        expect(s.momentumWheel).toEqual(['heart']);
        s = playFree(s, 'qa-wheel-body');
        expect(s.momentumWheel).toEqual(['heart', 'body']);
    });

    it('a wrong stance resets the wheel to just that stance', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-mind'); // heart's successor is body, not mind — wrong
        expect(s.momentumWheel).toEqual(['mind']);
    });

    it('a repeated stance counts as wrong (never its own successor) and resets', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-heart');
        expect(s.momentumWheel).toEqual(['heart']);
    });

    it('lighting the third node completes the cycle, empties the wheel, and mints a wild floating die', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-body');
        const before = s;
        s = playFree(s, 'qa-wheel-mind');
        expect(s.momentumWheel).toEqual([]);

        const minted = (s.floatingDice ?? []).filter(d => isMomentumDieId(d.id));
        expect(minted).toHaveLength(1);
        expect(minted[0]).toMatchObject({ color: 'wild', state: 'available', temporary: true, floating: true });
        // Immediately draggable/spendable THIS turn — joined the live tray too.
        expect(s.dice.some(d => d.id === minted[0].id)).toBe(true);
        expect(before.floatingDice ?? []).toHaveLength(0);
    });

    it('while charged, further plays do not advance the wheel', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-body');
        s = playFree(s, 'qa-wheel-mind'); // completes — charged now
        expect((s.floatingDice ?? []).some(d => isMomentumDieId(d.id))).toBe(true);

        s = playFree(s, 'qa-wheel-heart'); // 4th card — should be inert while charged
        expect(s.momentumWheel).toEqual([]);
    });

    it('the very play that SPENDS the momentum die does not also advance the wheel', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-body');
        s = playFree(s, 'qa-wheel-mind'); // charged
        const dieId = (s.floatingDice ?? []).find(d => isMomentumDieId(d.id))!.id;

        // Spend it on the remaining body card (wild matches any color).
        const bodyEntry = s.hand.find(h => h.cardId === 'qa-wheel-body');
        expect(bodyEntry).toBeDefined();
        const res = playCombatCard(s, { uid: bodyEntry!.uid }, true, dieId, rng);
        expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
        s = res.state;

        expect((s.floatingDice ?? []).some(d => isMomentumDieId(d.id))).toBe(false); // spent
        expect(s.momentumWheel).toEqual([]); // did NOT also light 'body' from this play
    });

    it('a fizzled play does not advance the wheel (fizzle-gates-wheel-advance correction)', () => {
        let s = open();
        const entry = s.hand.find(h => h.cardId === 'qa-wheel-heart')!;
        // No die drafted yet — a bottom-action attempt fizzles ("draft a stance
        // die first"), never pushing card-played.
        const res = playCombatCard(s, { uid: entry.uid }, true, undefined, rng);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.events.some(e => e.kind === 'card-played')).toBe(false);
        expect(res.state.momentumWheel ?? []).toEqual([]);
    });

    it('a drafted, color-matched PAID play also advances the wheel (power source is irrelevant)', () => {
        let s = open();
        const die = s.dice.find(d => d.state === 'available' && !d.floating && d.color !== 'x');
        expect(die).toBeDefined();
        s = draftStanceDie(s, die!.id).state;
        const drafted = s.dice.find(d => d.id === die!.id)!;
        // Wild matches any card's stance; a colored die needs its own-color card.
        const stance: 'heart' | 'body' | 'mind' = drafted.color === 'wild' ? 'heart' : (drafted.color as 'heart' | 'body' | 'mind');
        const entry = s.hand.find(h => h.cardId === `qa-wheel-${stance}`);
        expect(entry).toBeDefined();

        const res = playCombatCard(s, { uid: entry!.uid }, true, undefined, rng);
        expect(res.events.some(e => e.kind === 'card-played')).toBe(true);
        expect(res.state.momentumWheel).toEqual([stance]);
    });

    it('the momentum die never survives to the character save (getFloatingDiceColors excludes temporary floats)', () => {
        let s = open();
        s = playFree(s, 'qa-wheel-heart');
        s = playFree(s, 'qa-wheel-body');
        s = playFree(s, 'qa-wheel-mind'); // charged
        expect((s.floatingDice ?? []).some(d => isMomentumDieId(d.id))).toBe(true);
        expect(getFloatingDiceColors(s)).toEqual([]);
    });

    it('sim policies never crash on wheel state across every policy and seed', () => {
        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = deepClone(Player);
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy);
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
