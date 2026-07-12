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
 * Overkill clamp (Gate 0 §2, 2026-07-10): when `targetHpBefore` — the target's
 * HP at the moment of the record, BEFORE this record's damage — is given, the
 * record is clamped at damage actually applicable: the strike claims at most
 * that HP, and the DoT projection at most what remains after the strike. The
 * pre-clamp ledger attributed 740 projected DoT against a 40-max-HP enemy.
 */
export function recordAttribution(
    attribution: Record<string, CombatAttributionRow>,
    cardId: string,
    cardName: string,
    landed: LandedEffect | null,
    damage: number,
    targetHpBefore?: number,
): Record<string, CombatAttributionRow> {
    const prev = attribution[cardId] ?? { cardId, name: cardName, dotDamage: 0, damageDealt: 0, phases: 0 };
    const dot = landed?.effect.payload.damageOverTime;
    const projectedRaw = dot
        ? dot.damagePerRound * Math.max(1, landed!.active.intensity) * Math.max(1, landed!.active.remainingDuration)
        : 0;
    const cap = targetHpBefore !== undefined ? Math.max(0, targetHpBefore) : undefined;
    const applied = cap !== undefined ? Math.min(damage, cap) : damage;
    const projected = cap !== undefined ? Math.min(projectedRaw, cap - applied) : projectedRaw;
    return {
        ...attribution,
        [cardId]: {
            ...prev,
            dotDamage: prev.dotDamage + projected,
            damageDealt: prev.damageDealt + applied,
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
