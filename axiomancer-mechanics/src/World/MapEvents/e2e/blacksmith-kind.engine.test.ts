/**
 * MapEvents 'blacksmith' kind (Spec 33 §6 / Phase D5) — hermetic dispatcher
 * coverage. The kind hands the host the authored budget + variant-gear offers;
 * the handler is a validated pass-through (the anvil session is fully
 * sandboxed) that touches no state and rejects illegal (cap-violating) variant
 * gear at resolution time.
 */

import { describe, expect, it } from 'vitest';

import { createNewGameState } from '../../../Game/game.reducer';
import { applyPayload, resolveBlacksmith } from '../handlers';
import { HEART_RICH_PAYLOAD_VARIANT } from '../../Blacksmith/blacksmith.content';
import type { BlacksmithPayload } from '../types';

const PAYLOAD: BlacksmithPayload = {
    kind: 'blacksmith',
    budget: 12,
    variants: [HEART_RICH_PAYLOAD_VARIANT],
};

describe("MapEvents 'blacksmith' kind", () => {
    it('resolves to the authored budget + variants without touching state', () => {
        const state = createNewGameState();
        const result = resolveBlacksmith(state, PAYLOAD);
        expect(result.state).toBe(state);
        expect(result.event).toEqual({
            kind: 'blacksmith',
            budget: 12,
            variants: [HEART_RICH_PAYLOAD_VARIANT],
        });
    });

    it('defaults an omitted budget to 0 and variants to empty', () => {
        const state = createNewGameState();
        const result = resolveBlacksmith(state, { kind: 'blacksmith' });
        expect(result.event).toEqual({ kind: 'blacksmith', budget: 0, variants: [] });
    });

    it('dispatches through applyPayload', () => {
        const state = createNewGameState();
        const result = applyPayload(state, PAYLOAD, () => 0.5);
        expect(result.event.kind).toBe('blacksmith');
    });

    it('rejects a cap-violating variant at resolution time', () => {
        const state = createNewGameState();
        const bad: BlacksmithPayload = {
            kind: 'blacksmith',
            variants: [{
                id: 'bad-variant',
                name: 'Overforged',
                gear: { dieColor: 'heart', specialFaces: 3, manaFaces: 2, specialConviction: 2 },
            }],
        };
        expect(() => resolveBlacksmith(state, bad)).toThrow(/illegal blacksmith variant/);
    });
});
