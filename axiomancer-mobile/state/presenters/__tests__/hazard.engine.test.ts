/**
 * Hazard presenter — hermetic mapping suite. Covers the design brief's
 * §12 recommended presenter tests: phase mapping, hand-before-dice,
 * dice accessibility labels, affordability, dual meters, ledger marks,
 * and final outcome composition.
 */

import { describe, expect, it } from '@jest/globals';

import {
    applyHazardCard,
    continueHazardAfterResolve,
    createHazardSession,
    finishHazardRolling,
    resolveHazardRound,
    selectHazardRoute,
    stageHazardCard,
} from 'axiomancer-mechanics';
import { getHazardDef, HAZARD_CRACK_CARD } from 'axiomancer-mechanics';
import { hazardStarterBag } from 'axiomancer-mechanics';
import type { HazardHandEntry, HazardSessionState } from 'axiomancer-mechanics';
import { selectHazardViewModel, selectHasActiveHazard } from '@/state/presenters/hazard.engine';

const BAG = hazardStarterBag();

function vmOf(session: HazardSessionState | null) {
    return selectHazardViewModel({ hazard: { session } });
}

function entries(cardId: string, n: number): HazardHandEntry[] {
    return Array.from({ length: n }, (_, i) => ({ uid: `h${i}`, cardId, dieId: null }));
}

function playingSession(route: 'safe' | 'risk', seed = 7): HazardSessionState {
    return finishHazardRolling(selectHazardRoute(createHazardSession(seed, BAG, 'cracked-cliff'), route, BAG));
}

describe('hazard presenter — reveal phase', () => {
    it('maps title, scenario, both route choices, and the opening hand before any dice', () => {
        const s = createHazardSession(7, BAG, 'cracked-cliff');
        const vm = vmOf(s);
        expect(vm.active).toBe(true);
        expect(vm.phase).toBe('route-select');
        expect(vm.title).toBe('CRACKED CLIFF PATH');
        expect(vm.scenario).toContain('shrine cache');
        expect(vm.hand).toHaveLength(5);
        expect(vm.dice).toHaveLength(0);
        expect(vm.routeChoices.map((r) => r.key)).toEqual(['safe', 'risk']);
        const risk = vm.routeChoices[1];
        expect(risk.badge).toBe('BETTER REWARD');
        expect(risk.dual).toBe(true);
        expect(risk.ladder).toHaveLength(2);
        expect(vm.marks).toEqual(['pending', 'pending', 'pending']);
    });

    it('inactive store maps to the inert empty VM', () => {
        expect(vmOf(null).active).toBe(false);
        expect(selectHasActiveHazard({ hazard: { session: null } })).toBe(false);
    });
});

describe('hazard presenter — dice', () => {
    it('maps four dice with colour-independent accessibility labels and usability', () => {
        const s = selectHazardRoute(createHazardSession(7, BAG, 'cracked-cliff'), 'risk', BAG);
        const vm = vmOf(s);
        expect(vm.phase).toBe('rolling');
        expect(vm.dice).toHaveLength(4);
        for (const die of vm.dice) {
            expect(die.accessibilityLabel).toMatch(/die, (available|spent|blocked)/);
            if (die.isHex) expect(die.usable).toBe(false);
        }
        expect(vm.diceReady + vm.hexCount + vm.dice.filter((d) => !d.usable && !d.isHex).length).toBe(4);
    });

    it('hex dice render blocked and never usable', () => {
        let s = playingSession('safe');
        s = { ...s, dice: [{ id: 'd1', kind: 'hex', state: 'available' }] };
        const vm = vmOf(s);
        expect(vm.dice[0].isHex).toBe(true);
        expect(vm.dice[0].usable).toBe(false);
        expect(vm.dice[0].accessibilityLabel).toContain('blocked');
        expect(vm.hexCount).toBe(1);
    });
});

describe('hazard presenter — affordability', () => {
    it('cards expose dieAvailable from the live board (gold needs gold)', () => {
        let s = playingSession('safe');
        s = {
            ...s,
            hand: [
                { uid: 'h-red', cardId: 'steps', dieId: null },
                { uid: 'h-gold', cardId: 'oath', dieId: null },
            ],
            dice: [{ id: 'd1', kind: 'red', state: 'available' }],
        };
        const vm = vmOf(s);
        expect(vm.hand.find((c) => c.uid === 'h-red')?.dieAvailable).toBe(true);
        expect(vm.hand.find((c) => c.uid === 'h-gold')?.dieAvailable).toBe(false);
    });

    it('salvage maps to readable copy and appends the SALVAGE keyword', () => {
        let s = playingSession('safe');
        s = {
            ...s,
            hand: [
                { uid: 'h-prog', cardId: 'steps', dieId: null }, // +1 FORCE
                { uid: 'h-mana', cardId: 'haul', dieId: null }, // conjure red die
                { uid: 'h-none', cardId: HAZARD_CRACK_CARD.id, dieId: null }, // no salvage
            ],
        };
        const vm = vmOf(s);
        const prog = vm.hand.find((c) => c.uid === 'h-prog')!;
        expect(prog.salvageLabel).toBe('+1 FORCE this round');
        expect(prog.keywords.map((k) => k.id)).toContain('salvage');
        const mana = vm.hand.find((c) => c.uid === 'h-mana')!;
        expect(mana.salvageLabel).toBe('conjure a RED die');
        const none = vm.hand.find((c) => c.uid === 'h-none')!;
        expect(none.salvageLabel).toBeNull();
        expect(none.keywords.map((k) => k.id)).not.toContain('salvage');
    });

    it('dead CRACK cards are flagged and never affordable', () => {
        let s = playingSession('safe');
        s = {
            ...s,
            hand: [{ uid: 'h1', cardId: HAZARD_CRACK_CARD.id, dieId: null }],
            dice: [{ id: 'd1', kind: 'purple', state: 'available' }],
        };
        const vm = vmOf(s);
        expect(vm.hand[0].dead).toBe(true);
        expect(vm.hand[0].dieAvailable).toBe(false);
        expect(vm.hand[0].keywords.map((k) => k.id)).toContain('crack');
    });
});

describe('hazard presenter — meters', () => {
    it('safe route: one combined PASSAGE meter with split detail line', () => {
        let s = playingSession('safe');
        s = { ...s, hand: entries('haul', 2), play: [] };
        s = stageHazardCard(s, 'h0', BAG); // DEAD-MAN HAUL free 3F/0E
        const vm = vmOf(s);
        expect(vm.meters).toHaveLength(1);
        expect(vm.meters[0].key).toBe('passage');
        expect(vm.meters[0].value).toBe(3);
        expect(vm.meterDetail).toBe('FORCE 3 · ESCAPE 0 — either type counts');
        expect(vm.bothRequired).toBe(false);
    });

    it('risk route: two independent meters labelled BOTH REQUIRED', () => {
        const def = getHazardDef('cracked-cliff');
        const vm = vmOf(playingSession('risk'));
        expect(vm.bothRequired).toBe(true);
        expect(vm.meters.map((m) => m.key)).toEqual(['force', 'escape']);
        expect(vm.meters[0].need).toBe(def.risk.thresholds[0][0]);
        expect(vm.meters[1].need).toBe(def.risk.thresholds[0][1]);
    });

    it('threshold ladder and deck/discard counts are exposed (REC#2)', () => {
        const vm = vmOf(playingSession('safe'));
        expect(vm.thresholdLadder[0].values).toHaveLength(3);
        expect(vm.deckCount).toBeGreaterThan(0);
        expect(vm.discardCount).toBe(0);
    });
});

describe('hazard presenter — resolve and ledger', () => {
    function resolvedSession(cardId: string | null): HazardSessionState {
        let s = playingSession('safe', 3);
        s = { ...s, hand: cardId ? entries(cardId, 6) : entries(HAZARD_CRACK_CARD.id, 1), play: [] };
        for (const h of s.hand.slice()) s = stageHazardCard(s, h.uid, BAG);
        return resolveHazardRound(s);
    }

    it('PLAY arms as soon as a card is staged (auto-applies on resolve)', () => {
        const idle = vmOf(playingSession('safe'));
        expect(idle.resolveEnabled).toBe(false);
        expect(idle.resolveSubLabel).toBe('STAGE A CARD');
        let s = playingSession('safe');
        s = { ...s, hand: entries('steps', 1), play: [] };
        s = stageHazardCard(s, 'h0', BAG);
        // staged — armed immediately; PLAY commits un-applied cards itself
        const staged = vmOf(s);
        expect(staged.resolveEnabled).toBe(true);
        expect(staged.resolveSubLabel).toBe('RESOLVE');
        // an explicit per-card APPLY keeps the same armed state
        s = applyHazardCard(s, 'h0', BAG);
        const armed = vmOf(s);
        expect(armed.resolveEnabled).toBe(true);
        expect(armed.resolveSubLabel).toBe('RESOLVE');
    });

    it('a cleared round maps an O flash with stats and verdict', () => {
        const vm = vmOf(resolvedSession('grip'));
        expect(vm.resolveFlash?.cleared).toBe(true);
        expect(vm.resolveFlash?.verdict).toBe('PASSED');
        expect(vm.resolveFlash?.stats[0].ok).toBe(true);
        expect(vm.marks[0]).toBe('O');
    });

    it('a failed round maps an X flash; momentum note appears on big clears (REC#1)', () => {
        const failed = vmOf(resolvedSession(null));
        expect(failed.resolveFlash?.cleared).toBe(false);
        expect(failed.resolveFlash?.verdict).toBe('FALLEN');
        expect(failed.resolveFlash?.carryNote).toBeNull();
        expect(failed.marks[0]).toBe('X');

        // 6×IRON GRIP = 30 vs need 19 → surplus 11 → carry 3 (capped)
        const cleared = resolvedSession('grip');
        const flashVM = vmOf(cleared);
        expect(flashVM.resolveFlash?.carryNote).toContain('MOMENTUM');
        const next = continueHazardAfterResolve(cleared, BAG);
        expect(vmOf(next).momentumNote).toContain('MOMENTUM +3');
    });
});

describe('hazard presenter — outcome and rewards', () => {
    function finished(cardId: string | null): HazardSessionState {
        let s = playingSession('safe', 9);
        for (let round = 0; round < 3; round++) {
            s = { ...s, hand: cardId ? entries(cardId, 6) : entries(HAZARD_CRACK_CARD.id, 1), play: [] };
            for (const h of s.hand.slice()) s = stageHazardCard(s, h.uid, BAG);
            s = resolveHazardRound(s);
            s = continueHazardAfterResolve(s, BAG);
        }
        return s;
    }

    it('perfect outcome: word, skippable 3-card offer with a guaranteed rare, no consequences', () => {
        const s = finished('grip');
        const vm = vmOf(s);
        expect(vm.phase).toBe('outcome');
        expect(vm.outcome?.word).toBe('PERFECT');
        expect(vm.outcome?.marks).toEqual(['O', 'O', 'O']);
        const rewardsVM = vmOf({ ...s, phase: 'rewards' }).rewards!;
        expect(rewardsVM.canSkip).toBe(true);
        expect(rewardsVM.offerCards).toHaveLength(3);
        expect(rewardsVM.offerCards[0].rarity).toBe('rare');
        expect(rewardsVM.consequences).toEqual([]);
        expect(rewardsVM.offerSubLabel).toBe('GUARANTEED RARE · CHOOSE ONE OR SKIP');
    });

    it('failure outcome: FACE THE COST, no offer, max consequences with explainer copy', () => {
        const s = finished(null);
        const vm = vmOf(s);
        expect(vm.outcome?.word).toBe('FAILURE');
        expect(vm.outcome?.ctaLabel).toContain('FACE THE COST');
        const rewardsVM = vmOf({ ...s, phase: 'rewards' }).rewards!;
        expect(rewardsVM.offerCards).toEqual([]);
        expect(rewardsVM.consequences.map((c) => c.id)).toEqual(['minhp', 'maxhp', 'deadcard', 'curse']);
        for (const c of rewardsVM.consequences) expect(c.desc.length).toBeGreaterThan(10);
        expect(rewardsVM.penaltyNote).toContain('route penalty');
    });
});
