/**
 * Hazard-Pattern Combat — post-combat attribution + summary (HP model).
 *
 * The enemy's ONLY bar is HP. There are no effect kinds: DoT effects erode
 * enemy HP each phase, strikes chip it, and control gates the enemy's turn. This
 * module just keeps a per-card HP-damage ledger for the post-combat "which card
 * did the work" summary. Pure math only — no RNG, no I/O.
 */

import type {
    CombatAttributionRow, CombatEncounterState, CombatOutcome,
    CombatSummary, LandedEffect,
} from './combat.encounter.types';

/**
 * Folds a card's HP contribution into the attribution ledger keyed by the card.
 * `landed` (when present) projects the DoT damage the effect will deal over its
 * life (damagePerRound × intensity × remainingDuration); `damage` is the HP the
 * play dealt right now (the strike). Either can be 0.
 *
 * Phase 26 (turn-law-and-honest-baseline audit) — `enemyHealthRemaining` is
 * the enemy's HP immediately BEFORE this damage instance (or before this DoT
 * lands, for the projected case). Both the forecast and the direct hit are
 * clamped to it, since neither can ever cost the enemy more HP than it had
 * left at that moment — without this a long DoT chain could log e.g. 740
 * projected damage against a 40-max-HP enemy.
 */
export function recordAttribution(
    attribution: Record<string, CombatAttributionRow>,
    cardId: string,
    cardName: string,
    landed: LandedEffect | null,
    damage: number,
    enemyHealthRemaining: number,
): Record<string, CombatAttributionRow> {
    const prev = attribution[cardId] ?? { cardId, name: cardName, dotDamage: 0, damageDealt: 0, phases: 0 };
    const dot = landed?.effect.payload.damageOverTime;
    const rawProjected = dot
        ? dot.damagePerRound * Math.max(1, landed!.active.intensity) * Math.max(1, landed!.active.remainingDuration)
        : 0;
    const ceiling = Math.max(0, enemyHealthRemaining);
    const projected = Math.min(rawProjected, ceiling);
    const clampedDamage = Math.min(Math.max(0, damage), ceiling);
    return {
        ...attribution,
        [cardId]: {
            ...prev,
            dotDamage: prev.dotDamage + projected,
            damageDealt: prev.damageDealt + clampedDamage,
            phases: prev.phases + 1,
        },
    };
}

const HEADLINES: Record<CombatOutcome, string> = {
    victory: 'Victory — the enemy falls',
    mercy: 'Mercy — the enemy is spared',
    capitulate: 'Capitulation — the enemy yields, swayed',
    concede: 'Concession — the argument is won outright',
    defeat: 'Defeat',
    // No in-combat retreat exists (the Retreat card was removed) — this entry
    // stays only because `CombatOutcome` is a Record key and must stay
    // exhaustive; no live code path can ever produce this outcome.
    retreat: 'Retreat',
};

/**
 * Builds the post-combat summary (§7.7): names the card that dealt the enemy the
 * most HP (strike + projected DoT). Shown for wins AND losses.
 */
export function buildCombatSummary(state: CombatEncounterState): CombatSummary {
    const outcome = state.finalOutcome ?? 'defeat';
    const rows = Object.values(state.attribution).sort((a, b) => b.damageDealt - a.damageDealt);
    const totalDotDamage = rows.reduce((s, r) => s + r.dotDamage, 0);
    const best = rows.slice().sort((a, b) => (b.dotDamage + b.damageDealt) - (a.dotDamage + a.damageDealt))[0];
    return {
        outcome,
        headline: HEADLINES[outcome],
        rows,
        totalDotDamage,
        directDamage: state.directDamageDealt,
        bestCard: best?.name ?? '',
    };
}
