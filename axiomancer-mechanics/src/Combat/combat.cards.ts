/**
 * Spec 32 v3 — The Themed Deck Library: skill→card projection adapter.
 *
 * Projects a learned `Card` into a `CombatCard` view: stance color, verb
 * class, rank/rarity, card type, and FREE/PAID action text. The projection is
 * pure — it reads the skill + effect libraries and never mutates.
 *
 * THE STRIKE IS DEAD (§1): there is no chip line, no strike line, and no
 * damage-preview path for raw HP. Every printed number is a real engine unit
 * (the P0-truth law survives the overhaul).
 */

import { MAX_EFFECT_INTENSITY, FREE_ENCHANT_ROUNDS } from '../Game/game-mechanics.constants';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Card, CardCombatEffects, CardRider, CardSpecialMechanic } from '../Cards/types';
import { rankToRarity, CARD_RANK_NAMES } from '../Cards/types';
import type {
    CombatCard, CombatDieColor, CombatVerbClass, CardEffectKind,
} from './combat.encounter.types';
import { getCardById } from '../Cards/cards.library';

export type EffectLookup = (effectId: string) => Effect | undefined;
export type CardLookup = (skillId: string) => Card | undefined;

/**
 * Synthetic (non-skill) card ids always present in a combat deck. Empty by
 * design: no in-combat retreat exists — once a fight is joined it resolves
 * only by winning or losing. Kept as a (now-empty) registry rather than
 * deleted outright so `isSyntheticCard` / `toCombatCard`'s synthetic-card
 * branch, and every deck-builder that iterates `SYNTHETIC_CARD_IDS`, stay
 * valid no-ops if a different synthetic card is ever introduced.
 */
export const SYNTHETIC_CARD_IDS: readonly string[] = Object.freeze([]);

const SYNTHETIC_CARDS: Record<string, CombatCard> = {};

/** True when the id names a synthetic (non-skill) card. */
export function isSyntheticCard(cardId: string): boolean {
    return cardId in SYNTHETIC_CARDS;
}

/** Enemy-targeted effect payloads on a skill (`appliedTo: 'opponent'`). */
function enemyEffects(skill: Card): CardCombatEffects[] {
    return (skill.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
}

/** True if the effect is a DoT (ticks HP damage). */
function isDot(effect: Effect): boolean {
    return effect.payload.damageOverTime !== undefined;
}

/** True if the effect hinders the bearer's turn (BACKFIRE-class control). */
function isControl(effect: Effect): boolean {
    if (effect.category === 'control') return true;
    const r = effect.payload.actionRestriction;
    return !!r && (r.skipTurn === true || r.forcedStance !== undefined || (r.blockedStances?.length ?? 0) > 0);
}

/** True if the effect is an exposure / soft debuff (MARK / RAPPORT class). */
function isStatDebuff(effect: Effect): boolean {
    if (effect.type !== 'debuff') return false;
    const mods = effect.payload.statModifiers ?? [];
    return mods.some(m => m.value < 0)
        || (effect.payload.rollModifier ?? 0) < 0
        || (effect.payload.defenseModifier ?? 0) < 0
        || (effect.payload.damageTakenMult ?? 1) > 1
        || (effect.payload.tickAmplifyFlat ?? 0) > 0
        || (effect.payload.outgoingDamageMulPct ?? 0) < 0;
}

/**
 * Impact a single enemy-targeted effect contributes when it lands (attribution
 * weighting; kept from the pre-v3 engine — DoT keeps raw perRound×intensity,
 * control gets a fixed weight).
 */
export const CONTROL_HARD_MULT = 6;   // hard control (turn denial class)
export const CONTROL_SOFT_MULT = 4;   // exposure / soft debuffs
export const DOT_PERROUND_WEIGHT = 1; // DoT keeps its raw perRound×intensity
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
        return { track: 'control', amount: i * CONTROL_SOFT_MULT };
    }
    return { track: 'none', amount: 0 };
}

/** Stance color for a projected combat card — its philosophical aspect (§4.3). */
export function cardStanceColor(skill: Card): CombatDieColor {
    return skill.philosophicalAspect;
}

/** Payoff mechanics that read as the "closer" class (status-payoff bursts). */
const PAYOFF_KINDS: ReadonlySet<string> = new Set(['rupture', 'reap_all', 'reap']);

/**
 * Classifies a skill into a verb class + the effect kind its PAID action
 * advances. Priority: enchant/disenchant > befriend > defend > DoT > control >
 * exposure > payoff > utility.
 */
export function classifyVerbClass(
    skill: Card,
    lookupEffect: EffectLookup,
): { verbClass: CombatVerbClass; track: CardEffectKind } {
    if (skill.cardType === 'enchantment') return { verbClass: 'enchant', track: 'none' };
    if (skill.cardType === 'disenchant') return { verbClass: 'disenchant', track: 'control' };

    const mechs = skill.specialMechanics ?? [];
    if (mechs.some(m => m.kind === 'befriend_attempt')) {
        return { verbClass: 'befriend', track: 'control' };
    }
    if (mechs.some(m => m.kind === 'guard' || m.kind === 'barrier' || m.kind === 'riposte')) {
        return { verbClass: 'defend', track: 'none' };
    }

    const enemy = enemyEffects(skill);
    const defs = enemy.map(e => lookupEffect(e.effectId)).filter((e): e is Effect => !!e);

    if (defs.some(isDot)) return { verbClass: 'direct-dot', track: 'dot' };
    if (mechs.some(m => m.kind === 'stagger' || m.kind === 'lock_stance')) {
        return { verbClass: 'direct-control', track: 'control' };
    }
    if (defs.some(isControl)) return { verbClass: 'direct-control', track: 'control' };
    if (defs.some(isStatDebuff)) return { verbClass: 'stat-debuff', track: 'control' };
    if (mechs.some(m => PAYOFF_KINDS.has(m.kind))) {
        return { verbClass: 'direct-damage', track: 'none' };
    }
    if (mechs.some(m => m.kind === 'sway')) {
        return { verbClass: 'direct-control', track: 'control' };
    }
    return { verbClass: 'buff-self', track: 'none' };
}

/**
 * DoT lifetime preview (P0-truth): the LIFETIME HP the card's statuses deal on
 * a neutral read — Σ floor(damagePerRound × intensity) × duration, ramp-aware.
 * 0 for everything else (no strike preview exists any more).
 */
export function bottomDamagePreview(skill: Card, lookupEffect: EffectLookup): number {
    let total = 0;
    for (const ce of enemyEffects(skill)) {
        const def = lookupEffect(ce.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot) continue;
        const intensity = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
        const duration = Math.max(1, ce.duration ?? def.duration);
        const ramp = def.payload.dotModifiers?.escalatesPerTurn ? (def.payload.dotModifiers.rampFactor ?? 0) : 0;
        for (let k = 0; k < duration; k++) {
            total += Math.floor((dot.damagePerRound + Math.floor(ramp * k)) * intensity);
        }
    }
    return total;
}

/** The primary enemy effect id a card applies (first that contributes impact). */
export function primaryEnemyEffectId(skill: Card, lookupEffect: EffectLookup): string | null {
    for (const ce of enemyEffects(skill)) {
        const def = lookupEffect(ce.effectId);
        if (def && effectImpact(def, ce.intensity ?? 1, ce.duration ?? def.duration).track !== 'none') {
            return def.id;
        }
    }
    return null;
}

/**
 * Human text for a `CardRider` — every clause a real engine unit (the P0-truth
 * law: generated action text IS the applied number).
 */
export function riderText(r: CardRider): string {
    const parts: string[] = [];
    if (r.bonusIntensity) parts.push(`+${r.bonusIntensity} intensity`);
    if (r.bonusDuration) parts.push(`+${r.bonusDuration} turn${r.bonusDuration === 1 ? '' : 's'}`);
    if (r.guard) parts.push(`Guard ${r.guard}`);
    if (r.conviction) parts.push(`+${r.conviction} Conviction`);
    if (r.refreshDie) parts.push('refresh the die');
    if (r.revealStance) parts.push('reveal the next stance');
    if (r.tickAllDots) parts.push('tick every DoT now');
    if (r.tickOne) parts.push('tick');
    if (r.cleanse) parts.push(`cleanse ${r.cleanse}`);
    if (r.healHp) parts.push(`heal ${r.healHp}`);
    if (r.drawCards) parts.push(`draw ${r.drawCards}`);
    if (r.premises) parts.push(`+${r.premises} Premise${r.premises === 1 ? '' : 's'}`);
    if (r.sway) parts.push(`SWAY ${r.sway}`);
    if (r.souls) parts.push(`+${r.souls} Soul${r.souls === 1 ? '' : 's'}`);
    if (r.foretell) parts.push(`FORETELL ${r.foretell}`);
    if (r.applyEffect) {
        const label = r.applyEffect.effectId.replace(/^(debuff|buff)_/, '');
        const i = r.applyEffect.intensity ?? 1;
        const d = r.applyEffect.duration;
        parts.push(`${label} i${i}${d ? ` d${d}` : ''}${r.applyEffect.to === 'self' ? ' (self)' : ''}`);
    }
    if (r.ruptureMarks) parts.push(`consume all marks — ${r.ruptureMarks} per stack`);
    if (r.intensityPerPip) parts.push(`+${r.intensityPerPip} intensity to one DoT per pip`);
    if (r.pips) parts.push(`+${r.pips} pip to every Reserve die`);
    if (r.stagger) parts.push(`STAGGER ${r.stagger}`);
    return parts.join(' · ');
}

/** Human text for one special mechanic (PAID line clauses, real units). */
export function mechanicText(m: CardSpecialMechanic): string | null {
    switch (m.kind) {
        case 'guard': return `Guard ${m.amount}`;
        case 'barrier': return `Barrier ${m.amount}`;
        case 'riposte': return `RIPOSTE ${m.damage}${m.reduce ? ` (parry ${m.reduce})` : ''}`;
        case 'rupture': return `RUPTURE${m.fuelPerPip ? ` (+${m.fuelPerPip} fuel per pip)` : ''}${m.fuelPerOmenHit ? ` (+${m.fuelPerOmenHit} fuel per omen hit)` : ''}`;
        case 'siphon': return `siphon ${Math.round(m.pct * 100)}%`;
        case 'forge_floating_die': return `FORGE a ${m.color === 'wild' ? 'WILD' : "the powering die's color"} floating die`;
        case 'stagger': return `STAGGER ${m.rungs}`;
        case 'lock_stance': return 'lock the enemy stance';
        case 'foretell': return `FORETELL ${m.count}`;
        case 'omen': return `OMEN — on hit: ${riderText(m.rider)}`;
        case 'premise': return `+${m.count} Premise${m.count === 1 ? '' : 's'}`;
        case 'peroration': return `PERORATION at ${m.at}${m.concedeAt ? ` (CONCEDE at ${m.concedeAt})` : ''}`;
        case 'spend_premises': return `spend ALL Premises — +1 mark per ${m.markPer}, draw 1 per ${m.drawPer}`;
        case 'spend_all_pips': return `spend ALL pips${m.guardPerPip ? ` (+${m.guardPerPip} Guard per pip)` : ''}`;
        case 'recoil': return `RECOIL ${m.hp}`;
        case 'extend_dots': return `+${m.turns} duration to ALL your DoTs`;
        case 'convert_dots': return `convert bleed↔poison, +${m.bonusIntensity} intensity`;
        case 'boost_all_dots': return `+${m.intensity} intensity to ALL enemy DoTs`;
        case 'soul_gain': return `+${m.count} Soul${m.count === 1 ? '' : 's'}`;
        case 'consume_affliction': return `consume 1 affliction — its fuel ticks now, +${m.souls} Soul`;
        case 'reap': return `REAP ${m.cost}${m.kindle ? ` — KINDLE (${m.kindle})` : ''}${m.rider ? ` — ${riderText(m.rider)}` : ''}`;
        case 'reap_all': return `REAP all — ${m.burstPerSoul} per Soul`;
        case 'sway': return `SWAY ${m.amount}`;
        case 'echo': return 'ECHO';
        case 'echo_next_spell': return 'your next spell gains ECHO';
        case 'reprise': return `REPRISE ${m.count}${m.fireFree ? ' — its FREE line fires now' : ''}`;
        case 'replay_last': return `replay your last spell ×${m.times}`;
        case 'conjure_card': return 'CONJURE a Thoughtform';
        case 'create_temporary_die': return `KINDLE (${m.color})`;
        case 'grant_pip': return `+${m.count} pip to every Reserve die`;
        case 'bank_spent_die': return 'the spent die BANKS to the Reserve';
        case 'convert_die_color': return 'the spent die returns as WILD';
        case 'refresh_die': return 'refresh the spent die';
        case 'reroll_spent': return 're-roll every spent/dead die';
        case 'befriend_attempt': return 'Befriend attempt';
        case 'strip_random_buff': return 'strip a random buff';
        default: return null;
    }
}

/** Human text for a card's PAID payload: statuses + mechanics, real units. */
function paidText(skill: Card, lookupEffect: EffectLookup): string {
    const parts: string[] = [];
    for (const ce of skill.combatEffects ?? []) {
        const def = lookupEffect(ce.effectId);
        if (!def) continue;
        const label = def.name.toLowerCase();
        const i = ce.intensity ?? 1;
        const d = ce.duration ?? def.duration;
        parts.push(`${label} i${i} d${d}${ce.appliedTo === 'self' ? ' (self)' : ''}`);
    }
    for (const m of skill.specialMechanics ?? []) {
        const t = mechanicText(m);
        if (t) parts.push(t);
    }
    return parts.join(' + ') || 'utility';
}

function rankLabel(skill: Card): string {
    return CARD_RANK_NAMES[skill.rank];
}

/** Projects a learned skill (or synthetic card) into a `CombatCard` view. */
export function toCombatCard(cardId: string, lookupSkill: CardLookup, lookupEffect: EffectLookup): CombatCard | null {
    if (isSyntheticCard(cardId)) return SYNTHETIC_CARDS[cardId];

    const skill = lookupSkill(cardId);
    if (!skill) return null;

    const { verbClass, track } = classifyVerbClass(skill, lookupEffect);
    const preview = bottomDamagePreview(skill, lookupEffect);
    const persistent = skill.cardType === 'enchantment' || skill.cardType === 'disenchant';

    const paid = paidText(skill, lookupEffect);

    // FREE line — the authored dieless rider (spells only). Spec 32 v4: persistent
    // cards get a dieless FREE line that grants a TIMED (FREE_ENCHANT_ROUNDS-round)
    // instance of the same passive; the PAID line makes it permanent.
    const topActionText = persistent
        ? `FREE — ${paid} for ${FREE_ENCHANT_ROUNDS} rounds (timed). (${rankLabel(skill)})`
        : skill.free
            ? `FREE — ${riderText(skill.free)}. (${rankLabel(skill)})`
            : `FREE — no effect. (${rankLabel(skill)})`;

    const bottomActionText = persistent
        ? `PAID — ${paid} for the rest of combat. Costs 1 die.${skill.cardType === 'disenchant' ? ' Attaches to the enemy.' : ''}`
        : `PAID — ${paid}${preview > 0 ? ` (${preview} HP over its run)` : ''}. Costs 1 die.`;

    // Printed DIE LINES, generated from the riders in real units.
    const dieLines: string[] = [];
    if (skill.threshold) {
        dieLines.push(`⬡ ${skill.threshold.color.toUpperCase()} ×${skill.threshold.count} spent: ${riderText(skill.threshold.rider)}`);
    }
    if (skill.dieBonus) {
        const on = skill.dieBonus.onColor === 'match'
            ? `${cardStanceColor(skill).toUpperCase()}/WILD die`
            : skill.dieBonus.onColor === 'off'
                ? 'off-color die'
                : `${skill.dieBonus.onColor.toUpperCase()} die`;
        dieLines.push(`⬢ ${on}: ${riderText(skill.dieBonus.rider)}`);
    }
    if (skill.fate) {
        const recoil = skill.fate.recoilHp ? ` (recoil ${skill.fate.recoilHp} HP)` : '';
        dieLines.push(`✕ an X die may power this: +${riderText(skill.fate.rider)}${recoil}`);
    }

    return {
        id: skill.id,
        skillId: skill.id,
        name: skill.name,
        stance: cardStanceColor(skill),
        verbClass,
        effectKind: track,
        tier: skill.tier,
        rank: skill.rank,
        rarity: rankToRarity(skill.rank),
        cardType: skill.cardType,
        category: skill.category,
        topActionText,
        bottomActionText: dieLines.length ? `${bottomActionText} ${dieLines.join(' · ')}` : bottomActionText,
        bottomDamagePreview: preview,
        primaryEffectId: primaryEnemyEffectId(skill, lookupEffect),
        ...(dieLines.length ? { dieLines } : {}),
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
 * currently satisfied by `enemyActiveEffects`. Pure read-only preview helper.
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
