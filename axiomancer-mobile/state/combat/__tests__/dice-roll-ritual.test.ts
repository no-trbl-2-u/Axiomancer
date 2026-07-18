/**
 * Spec 33 (Phase D6f — The Roll Ritual) — the hermetic roll-state machine.
 *
 * The visuals aren't testable in Node, but the DATA layer is — and the one law
 * that MUST hold is proven here in every mode: the settled face the ritual plans
 * ALWAYS equals the engine-rolled face. The animation lands on the result; it
 * never decides it (dice-honesty, 2026-07-09).
 */

import {
    dieRollSignature, rollSignatureMap, resolveRollMode, shouldInstantSettleDice,
    nextRollState, planDiceRoll, rollDurationMs,
    type DieRollTarget,
} from '../dice-roll-ritual';

const TIMING = { staggerMs: 90, tumbleDurationMs: 600 };

// The four fixed dice, a representative round: two live faces, one miss, one wild.
const ROUND: DieRollTarget[] = [
    { id: 'd-heart', face: 'mana' },
    { id: 'd-body', face: 'special' },
    { id: 'd-mind', face: 'miss' },
    { id: 'd-wild', face: 'mana' },
];

describe('dieRollSignature / rollSignatureMap', () => {
    it('folds face + cracked + X into a stable signature', () => {
        expect(dieRollSignature({ id: 'a', face: 'mana' })).toBe('mana:-:-');
        expect(dieRollSignature({ id: 'a', face: 'miss', cracked: true })).toBe('miss:x:-');
        expect(dieRollSignature({ id: 'a', isX: true })).toBe('-:-:x');
    });

    it('signature changes when the face changes (the reroll signal)', () => {
        expect(dieRollSignature({ id: 'a', face: 'miss' }))
            .not.toBe(dieRollSignature({ id: 'a', face: 'mana' }));
    });

    it('rollSignatureMap keys by id', () => {
        expect(rollSignatureMap(ROUND)).toEqual({
            'd-heart': 'mana:-:-', 'd-body': 'special:-:-', 'd-mind': 'miss:-:-', 'd-wild': 'mana:-:-',
        });
    });
});

describe('resolveRollMode', () => {
    it('animates by default', () => {
        expect(resolveRollMode({})).toBe('animate');
    });
    it('forces instant under OS reduced-motion', () => {
        expect(resolveRollMode({ reducedMotion: true })).toBe('instant');
    });
    it('forces instant under the instant-settle escape hatch', () => {
        expect(resolveRollMode({ instantSettle: true })).toBe('instant');
    });
});

describe('shouldInstantSettleDice (the e2e escape hatch)', () => {
    const KEY = '__AXM_DICE_INSTANT_SETTLE__';
    afterEach(() => { delete (globalThis as Record<string, unknown>)[KEY]; });

    it('is false when the global is unset', () => {
        expect(shouldInstantSettleDice()).toBe(false);
    });
    it.each([true, 1, '1'])('is true for the enabling value %p', (v) => {
        (globalThis as Record<string, unknown>)[KEY] = v;
        expect(shouldInstantSettleDice()).toBe(true);
    });
    it('is false for a non-enabling value', () => {
        (globalThis as Record<string, unknown>)[KEY] = '0';
        expect(shouldInstantSettleDice()).toBe(false);
    });
});

describe('nextRollState (per-die transitions)', () => {
    it('idle → roll(animate) → tumbling', () => {
        expect(nextRollState('idle', 'roll', 'animate')).toBe('tumbling');
    });
    it('idle → roll(instant) → settled (reduced-motion / e2e path)', () => {
        expect(nextRollState('idle', 'roll', 'instant')).toBe('settled');
    });
    it('tumbling → settle → settled', () => {
        expect(nextRollState('tumbling', 'settle', 'animate')).toBe('settled');
    });
    it('tumbling → skip → settled', () => {
        expect(nextRollState('tumbling', 'skip', 'animate')).toBe('settled');
    });
    it('settle/skip are no-ops when not tumbling', () => {
        expect(nextRollState('settled', 'settle', 'animate')).toBe('settled');
        expect(nextRollState('idle', 'skip', 'animate')).toBe('idle');
    });
});

describe('planDiceRoll — the dice-honesty invariant', () => {
    it('settled face ALWAYS equals the engine roll (animate)', () => {
        const plan = planDiceRoll(ROUND, null, 'animate', TIMING);
        plan.forEach((p, i) => expect(p.settledFace).toBe(ROUND[i].face));
    });
    it('settled face ALWAYS equals the engine roll (instant)', () => {
        const plan = planDiceRoll(ROUND, null, 'instant', TIMING);
        plan.forEach((p, i) => expect(p.settledFace).toBe(ROUND[i].face));
    });
    it('every plan rests in the settled state', () => {
        for (const mode of ['animate', 'instant'] as const) {
            for (const p of planDiceRoll(ROUND, null, mode, TIMING)) {
                expect(p.settledState).toBe('settled');
            }
        }
    });
});

describe('planDiceRoll — round-start (prev null)', () => {
    it('tumbles every faced, non-cracked, non-X die and staggers them', () => {
        const plan = planDiceRoll(ROUND, null, 'animate', TIMING);
        expect(plan.map((p) => p.tumbles)).toEqual([true, true, true, true]);
        // Stagger increments per tumbling die, in encounter order.
        expect(plan.map((p) => p.startDelayMs)).toEqual([0, 90, 180, 270]);
        expect(plan.every((p) => p.tumbleDurationMs === 600)).toBe(true);
    });

    it('an X die and a cracked die sit the ritual out (no tumble, no stagger slot)', () => {
        const dice: DieRollTarget[] = [
            { id: 'x', isX: true },
            { id: 'crack', face: 'miss', cracked: true },
            { id: 'live', face: 'mana' },
        ];
        const plan = planDiceRoll(dice, null, 'animate', TIMING);
        expect(plan[0].tumbles).toBe(false);        // X sits out
        expect(plan[1].tumbles).toBe(false);        // cracked sits out
        expect(plan[1].cracked).toBe(true);
        expect(plan[2].tumbles).toBe(true);
        // The live die takes the FIRST stagger slot — cracked/X consume none.
        expect(plan[2].startDelayMs).toBe(0);
    });
});

describe('planDiceRoll — instant mode', () => {
    it('nothing tumbles; all durations are zero', () => {
        const plan = planDiceRoll(ROUND, null, 'instant', TIMING);
        expect(plan.every((p) => !p.tumbles)).toBe(true);
        expect(plan.every((p) => p.tumbleDurationMs === 0 && p.startDelayMs === 0)).toBe(true);
    });
});

describe('planDiceRoll — Press-Fate reroll (only rerolled dice re-tumble)', () => {
    it('re-tumbles only the dice whose face changed', () => {
        const prev = rollSignatureMap(ROUND);
        // The miss die rerolled into a mana; the others are unchanged.
        const after: DieRollTarget[] = [
            { id: 'd-heart', face: 'mana' },   // unchanged
            { id: 'd-body', face: 'special' }, // unchanged
            { id: 'd-mind', face: 'mana' },    // rerolled: miss → mana
            { id: 'd-wild', face: 'mana' },    // unchanged
        ];
        const plan = planDiceRoll(after, prev, 'animate', TIMING);
        expect(plan.map((p) => p.tumbles)).toEqual([false, false, true, false]);
        // The single rerolled die takes the first (only) stagger slot.
        expect(plan[2].startDelayMs).toBe(0);
    });

    it('a cracked die never re-tumbles even if its signature changed', () => {
        const prev = { crack: 'miss:-:-' };
        const after: DieRollTarget[] = [{ id: 'crack', face: 'miss', cracked: true }];
        const plan = planDiceRoll(after, prev, 'animate', TIMING);
        expect(plan[0].tumbles).toBe(false);
        expect(plan[0].cracked).toBe(true);
        // Invariant holds through a reroll too.
        expect(plan[0].settledFace).toBe('miss');
    });
});

describe('rollDurationMs', () => {
    it('is the last tumbling die\'s delay + its tumble length', () => {
        const plan = planDiceRoll(ROUND, null, 'animate', TIMING);
        expect(rollDurationMs(plan)).toBe(270 + 600);
    });
    it('is zero when nothing tumbles (instant)', () => {
        expect(rollDurationMs(planDiceRoll(ROUND, null, 'instant', TIMING))).toBe(0);
    });
});
