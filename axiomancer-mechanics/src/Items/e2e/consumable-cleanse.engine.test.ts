/**
 * Hermetic E2E — CLEANSE consumables actually cleanse (2026-07-14 effect-wiring
 * audit). Before this fix `antidote` / `clarity-serum` applied `buff_cleanse`,
 * an empty (`duration: 0`, no payload) effect, so items advertising "purges
 * venoms" / "strips a hindrance" mechanically did nothing. `buff_cleanse` now
 * carries `payload.cleanse: true`, and `useConsumableEffect` routes that flag
 * to `removeEffectsByType('debuff', tier)` instead of adding an inert instance.
 *
 * adjust-equipment pass 11 (2026-09-15): `antidote` and `clarity-serum`
 * originally both applied `buff_cleanse` (tier 2) — byte-identical cleanse
 * lines at different shop prices (issue #307's bug class). `clarity-serum`
 * now applies its own `buff_cleanse_minor` (tier 1), so the two items differ
 * mechanically, not just in flavor text.
 */

import { describe, it, expect } from 'vitest';
import { deepClone } from '../../Utils';
import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { ActiveEffect } from '../../Effects/types';
import { lookupEffect } from '../../Effects';
import { getConsumableById } from '../consumable.library';
import { useConsumableEffect } from '../equipment.engine';

const ae = (effectId: string, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity: 1, remainingDuration: 3, appliedAt: 0, tier });

function afflictedPlayer(effects: ActiveEffect[]): Character {
    const p = deepClone(Player);
    p.effects = effects;
    return p;
}

describe('CLEANSE consumables strip debuffs (buff_cleanse payload.cleanse wiring)', () => {
    it('antidote purges tier 1 + tier 2 debuffs and leaves buffs alone', () => {
        const player = afflictedPlayer([
            ae('debuff_poison', 2),           // tier 2 debuff — cleansed
            ae('debuff_kindling_ember', 1),   // tier 1 debuff — cleansed
            ae('buff_thorns', 1),             // buff — survives
        ]);
        const antidote = getConsumableById('antidote')!;
        const { player: after, applied } = useConsumableEffect(player, antidote, 1, lookupEffect);

        const ids = after.effects.map(e => e.effectId);
        expect(ids).not.toContain('debuff_poison');
        expect(ids).not.toContain('debuff_kindling_ember');
        expect(ids).toContain('buff_thorns');        // a buff is never cleansed
        // The cleanse instant is NOT itself added as a lingering effect.
        expect(ids).not.toContain('buff_cleanse');
        expect(applied?.id).toBe('buff_cleanse');
    });

    it('clarity-serum on a clean player is a harmless no-op', () => {
        const player = afflictedPlayer([ae('buff_regeneration', 1)]);
        const serum = getConsumableById('clarity-serum')!;
        const { player: after } = useConsumableEffect(player, serum, 1, lookupEffect);
        expect(after.effects.map(e => e.effectId)).toEqual(['buff_regeneration']);
    });

    it('clarity-serum (tier-1 minor cleanse) strips a tier-1 debuff but leaves a tier-2 debuff and buffs alone', () => {
        const player = afflictedPlayer([
            ae('debuff_kindling_ember', 1),   // tier 1 debuff — cleansed
            ae('debuff_poison', 2),           // tier 2 debuff — survives a tier-1 cleanse
            ae('buff_thorns', 1),             // buff — survives
        ]);
        const serum = getConsumableById('clarity-serum')!;
        const { player: after, applied } = useConsumableEffect(player, serum, 1, lookupEffect);

        const ids = after.effects.map(e => e.effectId);
        expect(ids).not.toContain('debuff_kindling_ember');
        expect(ids).toContain('debuff_poison');
        expect(ids).toContain('buff_thorns');
        expect(ids).not.toContain('buff_cleanse_minor');
        expect(applied?.id).toBe('buff_cleanse_minor');
    });

    it('a tier-2 cleanse does NOT remove a tier-3 debuff (tier scoping honored)', () => {
        const player = afflictedPlayer([
            ae('debuff_petrify', 3),   // tier 3 — survives a tier-2 cleanse
            ae('debuff_poison', 2),    // tier 2 — cleansed
        ]);
        const antidote = getConsumableById('antidote')!;
        const { player: after } = useConsumableEffect(player, antidote, 1, lookupEffect);
        const ids = after.effects.map(e => e.effectId);
        expect(ids).toContain('debuff_petrify');
        expect(ids).not.toContain('debuff_poison');
    });
});
