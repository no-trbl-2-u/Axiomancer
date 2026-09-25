/**
 * IntentIcon — wall-math readout (phase 28).
 *
 * `intent.damage` is the raw face value (unchanged, pre-existing contract);
 * `intent.wallMath` is what phase 28 adds — the live projection netted
 * against guard/barrier/denial. This pins the new DENIED / net-damage
 * badges and the a11y label stating the REAL outcome, not the raw one.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { IntentIcon } from '@/components/combat/encounter/IntentIcon';
import type { CombatIntentVM } from '@/state/presenters/combat-encounter.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

const baseIntent: CombatIntentVM = {
    type: 'damage', icon: '⚔', label: 'ATTACKS', color: '#e2543b',
    description: 'A telegraphed strike.', damage: 10, debuffs: false, branch: null, next: null,
    wallMath: {
        projectedDamage: 10, netDamage: 10, willDeny: false, guard: 0, barrier: 0, rungsTotal: 2, rungsLost: 0,
        // Phase 102 — no brood is the ordinary case, and every pre-existing
        // assertion in this file is a no-brood assertion. Zeroed here so those
        // cases keep pinning exactly the behaviour they were written for.
        addDamage: 0, addNetDamage: 0, totalNetDamage: 10,
    },
    stanceCheck: null,
};

describe('IntentIcon — wall-math readout', () => {
    it('shows no wall-math badge when net damage matches the raw stake', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.queryByTestId('combat-intent-wallmath')).toBeNull();
    });

    it('shows the net damage when it diverges from the raw stake (guard absorbed some)', () => {
        const intent: CombatIntentVM = { ...baseIntent, wallMath: { ...baseIntent.wallMath, netDamage: 4 } };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['→', 4]);
    });

    it('shows DENIED and states the real outcome in a11y when the turn will be denied', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: {
                projectedDamage: 0, netDamage: 0, willDeny: true, guard: 0, barrier: 0, rungsTotal: 2, rungsLost: 2,
                addDamage: 0, addNetDamage: 0, totalNetDamage: 0,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toBe('DENIED');
        const node = screen.getByTestId('combat-intent');
        expect(node.props.accessibilityLabel).toMatch(/DENIED — no damage lands/);
    });
});

describe('IntentIcon — variable-rung telegraph (phase 33b)', () => {
    it('renders one pip per rung, all filled when none are stripped', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getAllByText('●')).toHaveLength(2);
        expect(screen.queryAllByText('○')).toHaveLength(0);
    });

    it('renders hollow pips for stripped rungs and filled pips for the remainder', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { ...baseIntent.wallMath, rungsTotal: 3, rungsLost: 1 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getAllByText('●')).toHaveLength(2);
        expect(screen.getAllByText('○')).toHaveLength(1);
    });

    it('states the rung magnitude in the a11y label', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { ...baseIntent.wallMath, rungsTotal: 4, rungsLost: 1 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        const node = screen.getByTestId('combat-intent');
        expect(node.props.accessibilityLabel).toMatch(/Carries 4 STAGGER rungs, 3 remaining\./);
    });
});

/**
 * FE-014 — the stance-check telegraph is drawn over the enemy art. At 375 the
 * sprite reaches under it, and coloured 10pt mono on painted art lost its
 * edges. It now sits on a near-opaque plate, the same solution the intent
 * pill above it already uses.
 */
describe('FE-014: telegraph sits on a plate, not bare on the art', () => {
    it('gives the stance-check block an opaque ground', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            stanceCheck: {
                punishes: 'heart',
                yields: 'body',
                punishesText: 'Punishes HEART ×1.5',
                yieldsText: 'Yields to BODY ×0.5 +1◆',
                live: 'none',
                resolution: null,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        const block = screen.getByTestId('combat-intent-stance-check');
        const style = Array.isArray(block.props.style)
            ? Object.assign({}, ...block.props.style.flat(Infinity).filter(Boolean))
            : block.props.style;
        expect(String(style.backgroundColor)).toMatch(/rgba\(0,\s*0,\s*0,/);
        expect(Number(style.paddingHorizontal)).toBeGreaterThan(0);
    });
});

/**
 * FE-020 — the enemy intent pill printed the damage it will deal as '♥11'.
 * The same board uses '♥ 160' on the player rail for the player's own VITAE,
 * so one glyph meant my health in one corner and the foe's outgoing damage in
 * the other.
 */
describe('FE-020: the intent pill does not wear a heart', () => {
    it('prints incoming damage with a minus, not a heart', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getByText('−10')).toBeTruthy();
        expect(screen.queryByText('♥10')).toBeNull();
    });

    it('still states the damage plainly for a screen reader', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent').props.accessibilityLabel).toMatch(/Deals 10 damage/);
    });
});

/**
 * Phase 102 (SUMMON) — the readout's honesty about the brood.
 *
 * The bug this exists to prevent is specific and was live for exactly as long
 * as it took to write these cases: `willDeny` printed a bare "DENIED" and said
 * "no damage lands" in the a11y label, while the engine resolves adds OUTSIDE
 * the `!hindered` gate. A player who staggers the foe reads "nothing lands",
 * ends the phase, and loses VITAE to a brood the telegraph told them to ignore.
 *
 * These assert the readout against what `resolveThreatPhase` actually does,
 * not against the shape of the VM.
 */
describe('IntentIcon — the brood is never hidden behind DENIED (phase 102)', () => {
    it('keeps a bare DENIED when the foe is denied and no add is on the board', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { ...baseIntent.wallMath, projectedDamage: 0, netDamage: 0, willDeny: true, totalNetDamage: 0 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toBe('DENIED');
    });

    it('states the brood’s bite alongside DENIED — denying the foe does not deny its adds', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: {
                ...baseIntent.wallMath,
                projectedDamage: 0, netDamage: 0, willDeny: true,
                addDamage: 8, addNetDamage: 8, totalNetDamage: 8,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        // The badge must carry the number, not just the word.
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['DENIED →', 8]);
        const label = screen.getByTestId('combat-intent').props.accessibilityLabel;
        expect(label).toMatch(/brood still bites you for 8/);
        // The claim that used to be made unconditionally, and was false here.
        expect(label).not.toMatch(/no damage lands/);
    });

    it('prints the TOTAL when the foe lands and its brood bites too', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: {
                ...baseIntent.wallMath,
                projectedDamage: 10, netDamage: 4,
                addDamage: 8, addNetDamage: 8, totalNetDamage: 12,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        // 12, not 4: the badge answers "what do I lose if I end the phase now?",
        // which is one number. Printing the foe's 4 beside a silent 8 would be
        // the same lie in a quieter voice.
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['→', 12]);
        const label = screen.getByTestId('combat-intent').props.accessibilityLabel;
        expect(label).toMatch(/4 will actually land/);
        expect(label).toMatch(/brood bites for 8 more — 12 in total/);
    });

    it('still shows the brood when the foe telegraphs no damage at all', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            damage: 0,
            wallMath: {
                ...baseIntent.wallMath,
                projectedDamage: 0, netDamage: 0,
                addDamage: 8, addNetDamage: 5, totalNetDamage: 5,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['→', 5]);
        expect(screen.getByTestId('combat-intent').props.accessibilityLabel).toMatch(/brood bites you for 5/);
    });

    it('prints the SOAKED bite, not the printed one — the wall answers adds too', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: {
                ...baseIntent.wallMath,
                projectedDamage: 0, netDamage: 0, willDeny: true,
                addDamage: 8, addNetDamage: 3, totalNetDamage: 3,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        // 3 (what survives GUARD/BARRIER/armor), never the raw 8.
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['DENIED →', 3]);
    });
});
