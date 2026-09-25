/**
 * Status Effect Amplification Registry
 *
 * Phase 142 introduced the registry; the Fate Engine P1 trim (spec 31 §3.3)
 * rebuilt it; the spec 32 v3 keyword reset (2026-07-08) RE-PINNED it to the
 * six-effect card vocabulary (poison / bleed / mark / backfire / quarter /
 * thorns). Every ingredient below is a live library id the card pool can
 * actually assemble — the deprecated-effects ban list enforces this. The live
 * engine consumes ONLY `amplify_damage` results
 * (`getDotAmplificationByEffect`), so every combo here uses that type.
 *
 * All multipliers clamp to `INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER`.
 */

import type { EffectInteraction } from './interactions';

/** Registry of predefined status effect interactions. */
export const EFFECT_INTERACTIONS: EffectInteraction[] = [
    // Poison + Bleed = Hemorrhage — the classic: patient ramp meets the burst window.
    {
        id: 'poison_bleed_hemorrhage',
        name: 'Hemorrhage',
        description: 'Poison and bleeding combine into a devastating hemorrhage, amplifying the poison\'s ticks',
        priority: 100,
        trigger: {
            primaryEffectId: 'debuff_poison',
            secondaryEffectIds: ['debuff_bleed'],
            minimumCombinedIntensity: 3,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_poison',
            amplificationValue: 1.5,
            message: 'Poison and bleeding create a hemorrhaging wound!',
        },
    },
    // Bleed + Mark = Opened Veins — the flaw is named, and the wound follows it.
    {
        id: 'bleed_mark_opened_veins',
        name: 'Opened Veins',
        description: 'A marked foe bleeds harder — every opened seam runs',
        priority: 95,
        trigger: {
            primaryEffectId: 'debuff_bleed',
            secondaryEffectIds: ['debuff_mark'],
            minimumCombinedIntensity: 2,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_bleed',
            amplificationValue: 1.5,
            message: 'The veins are open — the bleeding will not stop!',
        },
    },
];

/**
 * Validate that all effect IDs referenced in interactions exist.
 * Development helper to catch typos in effect references.
 */
export function validateInteractions(validEffectIds: Set<string>): string[] {
    const errors: string[] = [];
    for (const interaction of EFFECT_INTERACTIONS) {
        if (!validEffectIds.has(interaction.trigger.primaryEffectId)) {
            errors.push(`Interaction '${interaction.id}': unknown primary effect '${interaction.trigger.primaryEffectId}'`);
        }
        for (const secondaryId of interaction.trigger.secondaryEffectIds) {
            if (!validEffectIds.has(secondaryId)) {
                errors.push(`Interaction '${interaction.id}': unknown secondary effect '${secondaryId}'`);
            }
        }
        if (!validEffectIds.has(interaction.result.targetEffectId)) {
            errors.push(`Interaction '${interaction.id}': unknown target effect '${interaction.result.targetEffectId}'`);
        }
    }
    return errors;
}
