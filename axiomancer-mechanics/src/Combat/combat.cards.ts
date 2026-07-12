/**
 * Spec 32 v3 — The Themed Deck Library: Card → CombatCard projection adapter.
 *
 * Projects a learned `Card` into a `CombatCard` view: stance color, verb
 * class, rank/rarity, card type, and FREE/PAID action text. The projection is
 * pure — it reads the card + effect libraries and never mutates.
 *
 * THE STRIKE IS DEAD (§1): there is no chip line, no strike line, and no
 * damage-preview path for raw HP. Every printed number is a real engine unit
 * (the P0-truth law survives the overhaul).
 */

import { MAX_EFFECT_INTENSITY, FREE_ENCHANT_ROUNDS } from '../Game/game-mechanics.constants';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Card, CardCombatEffects, CardRider, CardSpecialMechanic, SynergyStatePredicate } from '../Cards/types';
import { rankToRarity, CARD_RANK_NAMES } from '../Cards/types';
import type {
    CombatCard, CombatDieColor, CombatVerbClass, CardEffectKind,
} from './combat.encounter.types';
import { getCardById } from '../Cards/cards.library';

export type EffectLookup = (effectId: string) => Effect | undefined;
export type CardLookup = (cardId: string) => Card | undefined;

/** Enemy-targeted effect payloads on a card (`appliedTo: 'opponent'`). */
function enemyEffects(card: Card): CardCombatEffects[] {
    return (card.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
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
export function cardStanceColor(card: Card): CombatDieColor {
    return card.philosophicalAspect;
}

/** Payoff mechanics that read as the "closer" class (status-payoff bursts). */
const PAYOFF_KINDS: ReadonlySet<string> = new Set(['rupture', 'reap_all', 'reap']);

/**
 * Classifies a card into a verb class + the effect kind its PAID action
 * advances. Priority: enchant/disenchant > befriend > defend > DoT > control >
 * exposure > payoff > utility.
 */
export function classifyVerbClass(
    card: Card,
    lookupEffect: EffectLookup,
): { verbClass: CombatVerbClass; track: CardEffectKind } {
    if (card.cardType === 'enchantment') return { verbClass: 'enchant', track: 'none' };
    if (card.cardType === 'disenchant') return { verbClass: 'disenchant', track: 'control' };

    const mechs = card.specialMechanics ?? [];
    if (mechs.some(m => m.kind === 'befriend_attempt')) {
        return { verbClass: 'befriend', track: 'control' };
    }
    if (mechs.some(m => m.kind === 'guard' || m.kind === 'barrier' || m.kind === 'riposte')) {
        return { verbClass: 'defend', track: 'none' };
    }

    const enemy = enemyEffects(card);
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
export function bottomDamagePreview(card: Card, lookupEffect: EffectLookup): number {
    let total = 0;
    for (const ce of enemyEffects(card)) {
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
export function primaryEnemyEffectId(card: Card, lookupEffect: EffectLookup): string | null {
    for (const ce of enemyEffects(card)) {
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
    if (r.barrier) parts.push(`GUARD ${r.barrier} (persists)`);
    if (r.recoil) parts.push(`RECOIL ${r.recoil}`);
    if (r.millCards) parts.push(`mill ${r.millCards} to discard`);
    return parts.join(' · ');
}

/**
 * WS4.2 / WS5.2 — human text for a combat-state synergy predicate (the
 * printed condition line; P0-truth: the text IS the evaluated condition).
 * Face-term budget (card-keyword doctrine): OPENING is the microset's ONE
 * shared face term — card-local, registered nowhere; the other turn-shape
 * conditions print as plain lowercase glosses (RECOIL is existing registry
 * vocabulary, not a new term).
 */
export function statePredicateText(p: SynergyStatePredicate): string {
    switch (p.kind) {
        case 'enemy-dealt-no-damage-last-round':
            return 'UNMOVED (the enemy dealt you no damage last round)';
        case 'opening':
            return p.maxPriorSpells === 0
                ? 'OPENING (your first spell this turn)'
                : `OPENING (within your first ${p.maxPriorSpells + 1} spells this turn)`;
        case 'finale':
            return `your closing play (${p.cardsLeftAtMost} or fewer cards left in hand after this)`;
        case 'recoil-paid-this-turn':
            return 'blood already paid (you paid RECOIL earlier this turn)';
        case 'enemy-drew-blood':
            return 'the enemy drew blood since your last turn';
    }
}

/** Human text for one special mechanic (PAID line clauses, real units). */
export function mechanicText(m: CardSpecialMechanic): string | null {
    switch (m.kind) {
        case 'guard': return `Guard ${m.amount}`;
        // KW-2 (phase 29): BARRIER merged into GUARD — prints "persists" on
        // its one carrier (the-adamant-wall) rather than a separate word.
        case 'barrier': return `GUARD ${m.amount} (persists)`;
        case 'riposte': return `RIPOSTE ${m.damage}${m.reduce ? ` (parry ${m.reduce})` : ''}`;
        case 'rupture': return `RUPTURE${m.fuelPerPip ? ` (+${m.fuelPerPip} fuel per pip)` : ''}${m.fuelPerOmenHit ? ` (+${m.fuelPerOmenHit} fuel per omen hit)` : ''}`;
        case 'siphon': return `SIPHON ${Math.round(m.pct * 100)}%`;
        case 'forge_floating_die': return `FORGE a ${m.color === 'wild' ? 'WILD' : "the powering die's color"} floating die`;
        case 'float_x_die': return 'FORGE a dead X die into a WILD floating die (no X: +1 Conviction)';
        case 'stagger': return `STAGGER ${m.rungs}`;
        case 'lock_stance': return 'lock the enemy stance';
        case 'foretell': return `FORETELL ${m.count}`;
        case 'omen': return `OMEN — on hit: ${riderText(m.rider)}`;
        case 'premise': return `+${m.count} Premise${m.count === 1 ? '' : 's'}`;
        case 'peroration': return `PERORATION at ${m.at}${m.concedeAt ? ` (CONCEDE at ${m.concedeAt})` : ''}`;
        case 'spend_premises': return `spend ALL Premises — +1 mark per ${m.markPer}, draw 1 per ${m.drawPer}`;
        case 'spend_all_pips': return `spend ALL pips${m.guardPerPip ? ` (+${m.guardPerPip} Guard per pip)` : ''}${m.markPer ? ` (+1 MARK per ${m.markPer} spent, uncapped)` : ''}`;
        case 'recoil': return `RECOIL ${m.hp}`;
        case 'recoil_x': return `RECOIL X (min ${m.min}): POISON per ${Math.round(1 / m.poisonPerX)}`;
        // KW-3 (phase 29): FESTER→PROLONG, TRANSMUTE→REARGUE (renames).
        case 'extend_dots': return `PROLONG +${m.turns} duration to ALL your DoTs`;
        case 'convert_dots': return `REARGUE — convert bleed↔poison, +${m.bonusIntensity} intensity`;
        case 'boost_all_dots': return `PROLONG +${m.intensity} intensity to ALL enemy DoTs`;
        case 'soul_gain': return `+${m.count} Soul${m.count === 1 ? '' : 's'}`;
        // KW-2 (phase 29): re-mapped Soul→Rupture — extends RUPTURE's
        // printed sense ("consume N afflictions") instead of a redundant
        // CONSUME word.
        case 'consume_affliction': return `RUPTURE 1 — its fuel ticks now, +${m.souls} Soul`;
        case 'reap': return `REAP ${m.cost}${m.kindle ? ` — KINDLE (${m.kindle})` : ''}${m.rider ? ` — ${riderText(m.rider)}` : ''}`;
        case 'reap_all': return `REAP all — ${m.burstPerSoul} per Soul`;
        case 'sway': return `SWAY ${m.amount}`;
        case 'echo': return 'ECHO';
        case 'echo_next_spell': return 'your next spell gains ECHO';
        // KW-3 (phase 29): REPRISE→RECALL (rename; frees REPRISE — see the
        // audit's near-synonym-pair finding against ECHO/replay_last).
        case 'reprise': return `RECALL ${m.count}${m.fireFree ? ' — its FREE line fires now' : ''}`;
        // KW-2 (phase 29): no keyword badge — ouroboros (this mechanic's
        // sole, 1-of-rare carrier) speaks card-local rules text only.
        case 'replay_last': return `replay your last spell ×${m.times}`;
        case 'create_temporary_die': return `KINDLE (${m.color})`;
        case 'grant_pip': return `+${m.count} pip to every Reserve die${m.overflow ? ` — each pip with no room: ${riderText(m.overflow)}` : ''}`;
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
function paidText(card: Card, lookupEffect: EffectLookup): string {
    const parts: string[] = [];
    for (const ce of card.combatEffects ?? []) {
        const def = lookupEffect(ce.effectId);
        if (!def) continue;
        const label = def.name.toLowerCase();
        const i = ce.intensity ?? 1;
        const d = ce.duration ?? def.duration;
        parts.push(`${label} i${i} d${d}${ce.appliedTo === 'self' ? ' (self)' : ''}`);
    }
    for (const m of card.specialMechanics ?? []) {
        const t = mechanicText(m);
        if (t) parts.push(t);
    }
    return parts.join(' + ') || 'utility';
}

function rankLabel(card: Card): string {
    return CARD_RANK_NAMES[card.rank];
}

/** Projects a library card into a `CombatCard` view. */
export function toCombatCard(cardId: string, lookupCard: CardLookup, lookupEffect: EffectLookup): CombatCard | null {
    const card = lookupCard(cardId);
    if (!card) return null;

    const { verbClass, track } = classifyVerbClass(card, lookupEffect);
    const preview = bottomDamagePreview(card, lookupEffect);
    const persistent = card.cardType === 'enchantment' || card.cardType === 'disenchant';

    const paid = paidText(card, lookupEffect);
    // Spec 32 v4 — an enchant/disenchant's passive lives in engine hooks, so its
    // authored one-line summary (`persistentEffect`) is what the card prints; fall
    // back to the effect-derived text only if a card is missing the summary.
    const passive = persistent ? (card.persistentEffect ?? paid) : paid;

    // FREE line — the authored dieless rider (spells only). Spec 32 v4: persistent
    // cards get a dieless FREE line that grants a TIMED (FREE_ENCHANT_ROUNDS-round)
    // instance of the same passive; the PAID line makes it permanent.
    const topActionText = persistent
        ? `FREE (${FREE_ENCHANT_ROUNDS} rounds) — ${passive} (${rankLabel(card)})`
        : card.free
            ? `FREE — ${riderText(card.free)}. (${rankLabel(card)})`
            : `FREE — no effect. (${rankLabel(card)})`;

    const bottomActionText = persistent
        ? `PAID (rest of combat) — ${passive} Costs 1 die.${card.cardType === 'disenchant' ? ' Attaches to the enemy.' : ''}`
        : `PAID — ${paid}${preview > 0 ? ` (${preview} HP over its run)` : ''}. Costs 1 die.`;

    // Printed DIE LINES, generated from the riders in real units.
    const dieLines: string[] = [];
    if (card.threshold) {
        dieLines.push(`⬡ ${card.threshold.color.toUpperCase()} ×${card.threshold.count} spent: ${riderText(card.threshold.rider)}`);
    }
    if (card.dieBonus) {
        const on = card.dieBonus.onColor === 'match'
            ? `${cardStanceColor(card).toUpperCase()}/WILD die`
            : card.dieBonus.onColor === 'off'
                ? 'off-color die'
                : `${card.dieBonus.onColor.toUpperCase()} die`;
        dieLines.push(`⬢ ${on}: ${riderText(card.dieBonus.rider)}`);
    }
    if (card.fate) {
        const recoil = card.fate.recoilHp ? ` (recoil ${card.fate.recoilHp} HP)` : '';
        dieLines.push(`✕ an X die may power this: +${riderText(card.fate.rider)}${recoil}`);
    }
    // WS4.2 — combat-state synergy condition (dieless, ledger-read): printed
    // exactly as evaluated (P0-truth).
    if (card.synergy?.statePredicate && card.synergy.rider) {
        dieLines.push(`◆ ${statePredicateText(card.synergy.statePredicate)}: ${riderText(card.synergy.rider)}`);
    }

    return {
        id: card.id,
        name: card.name,
        stance: cardStanceColor(card),
        verbClass,
        effectKind: track,
        tier: card.tier,
        rank: card.rank,
        rarity: rankToRarity(card.rank),
        cardType: card.cardType,
        category: card.category,
        topActionText,
        bottomActionText: dieLines.length ? `${bottomActionText} ${dieLines.join(' · ')}` : bottomActionText,
        bottomDamagePreview: preview,
        primaryEffectId: primaryEnemyEffectId(card, lookupEffect),
        ...(dieLines.length ? { dieLines } : {}),
    };
}

/** Projects an entire deck (card ids) into card views, dropping unknown ids. */
export function projectDeck(
    cardIds: readonly string[],
    lookupCard: CardLookup,
    lookupEffect: EffectLookup,
): CombatCard[] {
    return cardIds
        .map(id => toCombatCard(id, lookupCard, lookupEffect))
        .filter((c): c is CombatCard => c !== null);
}

/**
 * Phase 169 — Returns `true` when the card's backing card has a
 * `CardSynergy.predicate` whose target-side (`on === 'target'`) condition is
 * currently satisfied by `enemyActiveEffects`. Pure read-only preview helper.
 */
export function isCombatSynergySatisfied(
    card: CombatCard,
    enemyActiveEffects: readonly ActiveEffect[],
): boolean {
    const sourceCard = getCardById(card.id);
    if (!sourceCard?.synergy?.predicate) return false;
    const { predicate } = sourceCard.synergy;
    if (predicate.on !== 'target') return false;
    return enemyActiveEffects.some((ae) => {
        if (ae.effectId !== predicate.effectId) return false;
        if (predicate.intensityMin !== undefined && ae.intensity < predicate.intensityMin) return false;
        if (predicate.durationMin !== undefined && ae.remainingDuration < predicate.durationMin) return false;
        return true;
    });
}
