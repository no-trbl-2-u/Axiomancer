/**
 * Status Effect Amplification Registry
 *
 * Phase 142 introduced the registry; the Fate Engine P1 trim (spec 31 §3.3)
 * REBUILT it around pairs the canonical card pool can actually assemble. The
 * 2026-07-05 audit found 8 of the old 11 combos were dead code (their result
 * types had no consumer) and 2 more required effects with no source anywhere
 * — the live engine consumes ONLY `amplify_damage` results
 * (`getDotAmplificationByEffect`), so every combo here uses that type and
 * ingredients reachable from the trimmed library.
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
    // Bleed + Vulnerable = Opened Veins — the setup-then-swing pair on starter-adjacent cards.
    {
        id: 'bleed_vulnerable_opened_veins',
        name: 'Opened Veins',
        description: 'A vulnerable foe bleeds harder — every opened seam runs',
        priority: 95,
        trigger: {
            primaryEffectId: 'debuff_bleed',
            secondaryEffectIds: ['debuff_vulnerable'],
            minimumCombinedIntensity: 2,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_bleed',
            amplificationValue: 1.5,
            message: 'The veins are open — the bleeding will not stop!',
        },
    },
    // Burn + Vulnerable = Immolation — fuel for the P2 consuming detonations.
    {
        id: 'burn_vulnerable_immolation',
        name: 'Immolation',
        description: 'An exposed foe catches — the burn feeds on the opening',
        priority: 90,
        trigger: {
            primaryEffectId: 'debuff_burn',
            secondaryEffectIds: ['debuff_vulnerable'],
            minimumCombinedIntensity: 2,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_burn',
            amplificationValue: 1.5,
            message: 'The opening catches fire — immolation!',
        },
    },
    // Despair + Confusion = Spiral — the heart/mind cross-stance pair.
    {
        id: 'despair_confusion_spiral',
        name: 'Spiral',
        description: 'A confused mind cannot argue its way out of despair — the spiral deepens',
        priority: 85,
        trigger: {
            primaryEffectId: 'debuff_despair',
            secondaryEffectIds: ['debuff_confusion'],
            minimumCombinedIntensity: 2,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_despair',
            amplificationValue: 1.5,
            message: 'Despair and confusion spiral into each other!',
        },
    },
    // Unraveling + Mark = Read Ruin — the long game, informed.
    {
        id: 'unraveling_mark_read_ruin',
        name: 'Read Ruin',
        description: 'A marked, unraveling foe comes apart along the lines you can already see',
        priority: 80,
        trigger: {
            primaryEffectId: 'debuff_unraveling',
            secondaryEffectIds: ['debuff_mark'],
            minimumCombinedIntensity: 2,
        },
        result: {
            type: 'amplify_damage',
            targetEffectId: 'debuff_unraveling',
            amplificationValue: 1.5,
            message: 'The unraveling follows the mark — read ruin!',
        },
    },
];

/**
 * Get all interactions that could trigger for a given effect ID.
 */
export function getInteractionsForEffect(effectId: string): EffectInteraction[] {
    return EFFECT_INTERACTIONS.filter(interaction =>
        interaction.trigger.primaryEffectId === effectId ||
        interaction.trigger.secondaryEffectIds.includes(effectId)
    );
}

/** Get all interaction IDs for debugging/logging. */
export function getAllInteractionIds(): string[] {
    return EFFECT_INTERACTIONS.map(interaction => interaction.id);
}

/** Find an interaction by its ID. */
export function getInteractionById(interactionId: string): EffectInteraction | undefined {
    return EFFECT_INTERACTIONS.find(interaction => interaction.id === interactionId);
}

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
