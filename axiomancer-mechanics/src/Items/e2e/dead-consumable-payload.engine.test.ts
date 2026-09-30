/**
 * Hermetic E2E — every consumable does SOMETHING on use. Five consumables
 * once shipped with none of `healAmount` / `effectId` / `inlineEffect` set,
 * so `useConsumableEffect` silently applied nothing. This file guards the
 * whole library against that class of bug.
 */

import { describe, it, expect } from 'vitest';
import { Player } from '../../Character/characters.mock';
import { lookupEffect } from '../../Effects';
import { consumableLibrary, getConsumableById } from '../consumable.library';
import { useConsumableEffect } from '../equipment.engine';

// Player mock starts at full HP — a heal-only consumable would show
// `healed: 0` against it (clamped), false-failing the "did something" guard
// below. Wound the fixture first so healing is observable too.
const woundedPlayer = { ...Player, health: 1 };

describe('every library consumable has a real payload', () => {
    it.each(consumableLibrary.map(c => c.id))('%s sets healAmount, effectId, or inlineEffect', id => {
        const item = getConsumableById(id)!;
        const hasPayload =
            (typeof item.healAmount === 'number' && item.healAmount > 0) ||
            item.effectId !== undefined ||
            item.inlineEffect !== undefined;
        expect(hasPayload).toBe(true);
    });

    it.each(consumableLibrary.map(c => c.id))('%s changes HP or effects when used', id => {
        const item = getConsumableById(id)!;
        const before = woundedPlayer;
        const { player: after, healed, applied } = useConsumableEffect(before, item, 1, lookupEffect);
        const didSomething = healed > 0 || applied !== null || after.effects.length !== before.effects.length;
        expect(didSomething).toBe(true);
    });
});
