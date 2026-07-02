/**
 * Spec 25 — Hazard-Pattern Combat: skill→card projection adapter (§4.3, §6).
 *
 * Projects a learned `Card` into a `CombatCard` view: stance color, verb
 * class, effect-kind, and top/bottom action text. The projection is pure —
 * it reads the skill + effect libraries and never mutates. The engine executes
 * a card's bottom action through the *unchanged* `executeSkill`; this module
 * only classifies and previews.
 *
 * Classification (§6 Rules 1-3) decides a card's effect-kind:
 *   - applies a DoT debuff to the enemy   → `direct-dot`     → dot (erodes HP)
 *   - applies a control debuff            → `direct-control` → control (hinders)
 *   - applies a stat-reduction debuff     → `stat-debuff`    → control (soft)
 *   - buffs the player                    → `buff-self`      → none (utility)
 *   - raw HP damage, no status effect     → `direct-damage`  → none
 *   - Befriend / Retreat                  → special handling
 */

import { MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Card, CardCombatEffects } from '../Cards/types';
import type {
    CombatCard, CombatDieColor, CombatVerbClass, CardEffectKind,
} from './combat.encounter.types';
import { getCardById } from '../Cards/cards.library';

export type EffectLookup = (effectId: string) => Effect | undefined;
export type CardLookup = (skillId: string) => Card | undefined;

/** Synthetic (non-skill) card ids always present in a combat deck. */
export const SYNTHETIC_CARD_IDS: readonly string[] = Object.freeze(['card-retreat']);

const SYNTHETIC_CARDS: Record<string, CombatCard> = {
    'card-retreat': {
        id: 'card-retreat',
        skillId: null,
        name: 'Retreat',
        stance: 'wild',
        verbClass: 'retreat',
        effectKind: 'none',
        tier: 1,
        category: null,
        topActionText: 'Brace — refresh 1 spent die.',
        bottomActionText: 'Flee combat. Costs all remaining available dice (§12 Q2).',
        bottomDamagePreview: 0,
        primaryEffectId: null,
    },
};

/** True when the id names a synthetic (non-skill) card. */
export function isSyntheticCard(cardId: string): boolean {
    return cardId in SYNTHETIC_CARDS;
}

/** Gold (rare) card ids — the strongest tier: unpowered = utility, powered =
 *  a MAJOR status + damage. A WILD die on a gold card always reads advantage
 *  (handled in the engine); the mobile renders a rare frame off `card.rarity`. */
export const GOLD_CARD_IDS: ReadonlySet<string> = new Set([
    'pyrrhic-victory', 'the-final-word', 'unmoved-mover',
]);

/** True when the id names a gold (rare) card. */
export function isGoldCard(cardId: string): boolean {
    return GOLD_CARD_IDS.has(cardId);
}

/** Enemy-targeted effect payloads on a skill (`appliedTo: 'opponent'`). */
function enemyEffects(skill: Card): CardCombatEffects[] {
    return (skill.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
}

/** True if the effect is a DoT (ticks HP damage). */
function isDot(effect: Effect): boolean {
    return effect.payload.damageOverTime !== undefined;
}

/** True if the effect restricts the bearer's actions (control). */
function isControl(effect: Effect): boolean {
    if (effect.category === 'control') return true;
    const r = effect.payload.actionRestriction;
    return !!r && (r.skipTurn === true || r.forcedStance !== undefined || (r.blockedStances?.length ?? 0) > 0);
}

/** True if the effect is a stat-reduction / weakening debuff (incl. VULNERABLE,
 *  whose `damageTakenMult > 1` is a real outgoing-damage amplifier). */
function isStatDebuff(effect: Effect): boolean {
    if (effect.type !== 'debuff') return false;
    const mods = effect.payload.statModifiers ?? [];
    return mods.some(m => m.value < 0)
        || (effect.payload.rollModifier ?? 0) < 0
        || (effect.payload.defenseModifier ?? 0) < 0
        || (effect.payload.damageTakenMult ?? 1) > 1;
}

/**
 * Impact a single enemy-targeted effect contributes when it lands, given the
 * intensity/duration the skill applies it at. Mirrors the Phase 125 resolution
 * math so the tracks are a faithful *leading indicator* of DoT-Erosion /
 * Control-Saturation (§5).
 *
 * Spec 26b tuning pass 2: Control was far weaker than DoT in playtest (control
 * plays moved the track +2-4 vs DoT's +9-20), so the Control Saturation / mercy
 * path never fired. Control contributions are scaled up here so racing Control
 * is a genuine alternative — `CONTROL_HARD`/`CONTROL_SOFT` multipliers tuned
 * against the balance sim.
 */
export const CONTROL_HARD_MULT = 6;   // hard control (stun/fear/silence/forced-stance…)
export const CONTROL_SOFT_MULT = 4;   // stat-debuffs + soft control
export const DOT_PERROUND_WEIGHT = 1; // DoT keeps its raw perRound×intensity
/**
 * Spec 26b tuning §3 — intensity credited toward IMPACT is capped here. Effects
 * stack intensity up to MAX_EFFECT_INTENSITY (10), and impact was raw
 * `perRound × intensity`, so re-applying ONE DoT card ramped its base impact
 * (3×2 → 3×10 = 30) faster than diminishing returns could claw back — a single
 * spammed card outran every anti-spam lever. Capping the impact-credited
 * intensity means stacking the SAME effect past the cap adds no more track
 * impact, so the per-application diminishing actually bites and a VARIED kit
 * (distinct effects, each fresh) decisively out-paces mono-spam. The effect's
 * real intensity (and its HP erosion) is untouched — only its track credit caps.
 */
export const IMPACT_INTENSITY_CAP = 3;

export function effectImpact(
    effect: Effect,
    intensity: number,
    duration: number,
): { track: CardEffectKind; amount: number } {
    const i = Math.min(Math.max(1, intensity), IMPACT_INTENSITY_CAP);
    if (isDot(effect)) {
        const perRound = effect.payload.damageOverTime!.damagePerRound;
        return { track: 'dot', amount: DOT_PERROUND_WEIGHT * perRound * i };
    }
    if (isControl(effect)) {
        const r = effect.payload.actionRestriction;
        const restricts = !!r && (r.skipTurn === true || r.forcedStance !== undefined || (r.blockedStances?.length ?? 0) > 0);
        const durationCredit = Math.min(Math.max(0, duration), 3);
        return { track: 'control', amount: i * CONTROL_HARD_MULT + (restricts ? durationCredit : 0) };
    }
    if (isStatDebuff(effect)) {
        // Soft control — still a meaningful chunk of the Control track (pass 2).
        return { track: 'control', amount: i * CONTROL_SOFT_MULT };
    }
    return { track: 'none', amount: 0 };
}

/** Stance color for a projected combat card — its philosophical aspect (§4.3). */
export function cardStanceColor(skill: Card): CombatDieColor {
    return skill.philosophicalAspect;
}

/**
 * Classifies a skill into a verb class + the effect kind its bottom action
 * advances. Priority: DoT > control > stat-debuff > buff > direct-damage.
 */
export function classifyVerbClass(
    skill: Card,
    lookupEffect: EffectLookup,
): { verbClass: CombatVerbClass; track: CardEffectKind } {
    const mechs = skill.specialMechanics ?? [];
    if (mechs.some(m => m.kind === 'befriend_attempt')) {
        return { verbClass: 'befriend', track: 'control' };
    }
    // A defense card grants the player GUARD / BARRIER / RIPOSTE — no enemy impact.
    if (mechs.some(m => m.kind === 'guard' || m.kind === 'barrier' || m.kind === 'riposte')) {
        return { verbClass: 'defend', track: 'none' };
    }

    const enemy = enemyEffects(skill);
    const defs = enemy.map(e => lookupEffect(e.effectId)).filter((e): e is Effect => !!e);

    if (defs.some(isDot)) return { verbClass: 'direct-dot', track: 'dot' };
    if (defs.some(isControl)) return { verbClass: 'direct-control', track: 'control' };
    if (defs.some(isStatDebuff)) return { verbClass: 'stat-debuff', track: 'control' };

    // 0.34.0 — offensive card mechanics with NO classifiable enemy effect
    // (RUPTURE detonate / COMPOUND scaler / EXECUTE finisher) read as a
    // damage-class card so they project a sensible verb/preview instead of
    // falling through to buff-self. (A card that ALSO applies a DoT/control —
    // e.g. Pyrrhic Victory's bleed + execute — keeps its effect class above.)
    if (mechs.some(m => m.kind === 'rupture' || m.kind === 'compound' || m.kind === 'execute')) {
        return { verbClass: 'direct-damage', track: 'none' };
    }

    // No enemy debuff → either a self-buff or pure damage.
    const hasSelfBuff = (skill.combatEffects ?? []).some(e => e.appliedTo === 'self')
        || (skill.synergy?.applyEffectOnFire?.appliedTo === 'self')
        || skill.targetType === 'self';
    if (hasSelfBuff && skill.basePower <= 0) return { verbClass: 'buff-self', track: 'none' };
    return { verbClass: 'direct-damage', track: 'none' };
}

/** Total projected bottom-action impact for a combat card (preview; §7.3). */
export function bottomDamagePreview(skill: Card, lookupEffect: EffectLookup): number {
    let total = 0;
    for (const ce of enemyEffects(skill)) {
        const def = lookupEffect(ce.effectId);
        if (!def) continue;
        const intensity = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
        const duration = ce.duration ?? def.duration;
        total += effectImpact(def, intensity, duration).amount;
    }
    // 0.34.0 — RUPTURE / COMPOUND / EXECUTE cards have no static enemy effect to
    // sum (their payoff is dynamic: detonate total / distinct-debuff count / a
    // finisher). Surface the card's strike (basePower) as a non-zero floor so the
    // hand glow isn't blank; the live numbers come from projectRupture /
    // projectExecute / projectCardImpact.
    if (total === 0 && (skill.specialMechanics ?? []).some(
        m => m.kind === 'rupture' || m.kind === 'compound' || m.kind === 'execute',
    )) {
        return Math.max(1, skill.basePower);
    }
    return total;
}

/** The primary enemy effect id a card applies (first that contributes impact),
 *  for the UI projection's diminishing-returns lookup. */
export function primaryEnemyEffectId(skill: Card, lookupEffect: EffectLookup): string | null {
    for (const ce of enemyEffects(skill)) {
        const def = lookupEffect(ce.effectId);
        if (def && effectImpact(def, ce.intensity ?? 1, ce.duration ?? def.duration).track !== 'none') {
            return def.id;
        }
    }
    return null;
}

function tierLabel(tier: 1 | 2 | 3): string {
    return tier === 3 ? 'Tier 3' : tier === 2 ? 'Tier 2' : 'Tier 1';
}

/** Projects a learned skill (or synthetic card) into a `CombatCard` view. */
export function toCombatCard(cardId: string, lookupSkill: CardLookup, lookupEffect: EffectLookup): CombatCard | null {
    if (isSyntheticCard(cardId)) return SYNTHETIC_CARDS[cardId];

    const skill = lookupSkill(cardId);
    if (!skill) return null;

    const { verbClass, track } = classifyVerbClass(skill, lookupEffect);
    const preview = bottomDamagePreview(skill, lookupEffect);

    const guardN = ((skill.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount: number } | undefined)?.amount ?? 0;

    const isGold = isGoldCard(skill.id);
    const effectNoun = track === 'dot' ? 'damage-over-time' : track === 'control' ? 'control' : 'effect';

    const topActionText = isGold
        ? 'GOLD — a free utility chip + a sliver of its effect, no die.'
        : verbClass === 'defend'
            ? 'Brace — gain a little Guard (absorbs the next threat), no die.'
            : verbClass === 'direct-damage'
                ? 'Chip the enemy for a sliver of HP, no die.'
                : verbClass === 'buff-self'
                    ? 'Apply a weak version of the buff to yourself.'
                    : `Apply a weak version of the ${effectNoun}, no die.`;

    const bottomActionText = isGold
        ? `GOLD — land a MAJOR ${effectNoun} + ~${preview} damage. Costs 1 die (a Wild die always lands advantage).`
        : verbClass === 'defend'
            ? `Gain ${guardN} Guard — absorbs the enemy's next threat. Costs 1 die.`
            : verbClass === 'direct-damage'
                ? `Full strike — HP damage only. Costs 1 die.`
                : verbClass === 'buff-self'
                    ? 'Full buff to yourself. Costs 1 die.'
                    : `Full ${effectNoun} — impact ~${preview}. Costs 1 ${cardStanceColor(skill)} die.`;

    return {
        id: skill.id,
        skillId: skill.id,
        name: skill.name,
        stance: cardStanceColor(skill),
        verbClass,
        effectKind: track,
        tier: skill.tier,
        rarity: isGold ? 'gold' : undefined,
        category: skill.category,
        topActionText: `${topActionText} (${isGold ? 'GOLD' : tierLabel(skill.tier)})`,
        bottomActionText,
        bottomDamagePreview: preview,
        primaryEffectId: primaryEnemyEffectId(skill, lookupEffect),
    };
}

/** Projects an entire deck (card ids) into card views, dropping unknown ids. */
export function projectDeck(
    cardIds: readonly string[],
    lookupSkill: CardLookup,
    lookupEffect: EffectLookup,
): CombatCard[] {
    return cardIds
        .map(id => toCombatCard(id, lookupSkill, lookupEffect))
        .filter((c): c is CombatCard => c !== null);
}

/**
 * Phase 169 — Returns `true` when the card's backing skill has a
 * `CardSynergy.predicate` whose target-side (`on === 'target'`) condition is
 * currently satisfied by `enemyActiveEffects`.
 *
 * This is a **pure read-only preview helper for mobile** — it tells the board
 * whether to render a combo glow on a card in hand. It does NOT change any
 * state; synergy execution still happens inside `executeSkill`.
 *
 * Returns `false` when:
 * - The card is synthetic (no backing skill).
 * - The backing skill has no `synergy` or no `predicate`.
 * - `predicate.on === 'caster'` — caster-side synergies are execution-time
 *   checks; this preview context has no player-effect input.
 * - No enemy effect matches the predicate.
 */
export function isCombatSynergySatisfied(
    card: CombatCard,
    enemyActiveEffects: readonly ActiveEffect[],
): boolean {
    if (!card.skillId) return false;
    const skill = getCardById(card.skillId);
    if (!skill?.synergy?.predicate) return false;
    const { predicate } = skill.synergy;
    if (predicate.on !== 'target') return false;
    return enemyActiveEffects.some((ae) => {
        if (ae.effectId !== predicate.effectId) return false;
        if (predicate.intensityMin !== undefined && ae.intensity < predicate.intensityMin) return false;
        if (predicate.durationMin !== undefined && ae.remainingDuration < predicate.durationMin) return false;
        return true;
    });
}
