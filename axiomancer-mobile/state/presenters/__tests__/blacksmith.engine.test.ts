/**
 * Blacksmith presenter VM tests (Spec 33 §6 / Phase D6c). The forge
 * screen renders one offer per die (HONE / TEMPER) plus swap offers; each
 * offer carries `enabled` and, when disabled, the LOUD reason. These pin
 * the enabled/disabled + reason contract off pure engine sessions.
 */

import { describe, expect, it } from '@jest/globals';
import {
    createBlacksmithSession,
    beginBlacksmith,
    honeBlacksmith,
    continueBlacksmithCard,
    concreteDefaultRail,
    HEART_RICH_PAYLOAD_VARIANT,
    ANVIL_VERB_PRICING,
    type BlacksmithSession,
} from '@mechanics';

import { selectBlacksmithVM, selectHasActiveBlacksmith } from '@/state/presenters/blacksmith.engine';

function forging(budget: number, variants = [] as const): BlacksmithSession {
    return beginBlacksmith(createBlacksmithSession(1, concreteDefaultRail(), budget, variants as never));
}

describe('selectHasActiveBlacksmith', () => {
    it('is false with no session and true with one', () => {
        expect(selectHasActiveBlacksmith({ blacksmith: { session: null, tutorial: false, handoff: null } })).toBe(false);
        expect(
            selectHasActiveBlacksmith({ blacksmith: { session: forging(10), tutorial: false, handoff: null } }),
        ).toBe(true);
    });
});

describe('forge offer VM (enabled / disabled + reason)', () => {
    it('exposes all four dice with a HONE and TEMPER offer each', () => {
        const vm = selectBlacksmithVM({ blacksmith: { session: forging(100), tutorial: false, handoff: null } });
        expect(vm.dice.map((d) => d.color)).toEqual(['heart', 'body', 'mind', 'wild']);
        for (const die of vm.dice) {
            expect(die.hone.verb).toBe('hone');
            expect(die.temper.verb).toBe('temper');
            expect(die.hone.price).toBe(ANVIL_VERB_PRICING.hone);
            expect(die.temper.price).toBe(ANVIL_VERB_PRICING.temper);
        }
    });

    it('enables an affordable, legal HONE with no reason', () => {
        const vm = selectBlacksmithVM({ blacksmith: { session: forging(100), tutorial: false, handoff: null } });
        const heart = vm.dice.find((d) => d.color === 'heart')!;
        expect(heart.hone.enabled).toBe(true);
        expect(heart.hone.reason).toBe('');
    });

    it('disables an unaffordable HONE and names the cost', () => {
        const vm = selectBlacksmithVM({ blacksmith: { session: forging(1), tutorial: false, handoff: null } });
        const heart = vm.dice.find((d) => d.color === 'heart')!;
        expect(heart.hone.enabled).toBe(false);
        expect(heart.hone.reason).toMatch(/cover/i);
    });

    it('disables a cap-violating HONE (at the 1-miss floor) with the engine reason', () => {
        // Two hones on heart → 4 mana / 1 miss; a third would break the floor.
        let s = forging(100);
        s = honeBlacksmith(s, 'heart');
        s = continueBlacksmithCard(s);
        s = honeBlacksmith(s, 'heart');
        s = continueBlacksmithCard(s);
        const vm = selectBlacksmithVM({ blacksmith: { session: s, tutorial: false, handoff: null } });
        const heart = vm.dice.find((d) => d.color === 'heart')!;
        expect(heart.hone.enabled).toBe(false);
        expect(heart.hone.reason).toMatch(/miss face/i);
    });

    it('disables TEMPER on the wild die at its 1-special cap', () => {
        // Wild default is 1 special (its cap). TEMPER would push to 2 → refused.
        const vm = selectBlacksmithVM({ blacksmith: { session: forging(100), tutorial: false, handoff: null } });
        const wild = vm.dice.find((d) => d.color === 'wild')!;
        expect(wild.temper.enabled).toBe(false);
        expect(wild.temper.reason).toMatch(/cap/i);
    });

    it('presents an affordable swap offer for the witness variant', () => {
        const vm = selectBlacksmithVM({
            blacksmith: { session: forging(100, [HEART_RICH_PAYLOAD_VARIANT] as never), tutorial: false, handoff: null },
        });
        expect(vm.swaps).toHaveLength(1);
        const swap = vm.swaps[0]!;
        expect(swap.offer.verb).toBe('swap');
        expect(swap.offer.id).toBe(`swap:${HEART_RICH_PAYLOAD_VARIANT.id}`);
        expect(swap.offer.enabled).toBe(true);
    });

    it('disables the swap offer when the wallet cannot cover it', () => {
        const vm = selectBlacksmithVM({
            blacksmith: { session: forging(1, [HEART_RICH_PAYLOAD_VARIANT] as never), tutorial: false, handoff: null },
        });
        const swap = vm.swaps[0]!;
        expect(swap.offer.enabled).toBe(false);
        expect(swap.offer.reason).toMatch(/cover/i);
    });
});
