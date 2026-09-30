/**
 * Spec 32 v3 — The Themed Deck Library: Card → CombatCard projection adapter.
 *
 * Projects a learned `Card` into a `CombatCard` view: stance color, verb
 * class, rank/rarity, card type, and FREE/PAID action text. The projection is
 * pure — it reads the card + effect libraries and never mutates.
 *
 * THE STRIKE IS DEAD (§1): there is no chip line and no auto-derived strike
 * line. (Direct damage returned as the authored `deal` mechanic in THE BIG
 * NUMBERS REWRITE, 2026-09-02, and `bottomDamagePreview` counts it.) Every
 * printed number is a real engine unit (the P0-truth law survives the
 * overhaul).
 */

import { MAX_EFFECT_INTENSITY, FREE_ENCHANT_ROUNDS } from '../Game/game-mechanics.constants';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Card, CardAspect, CardCombatEffects, CardRider, CardSpecialMechanic, SynergyStatePredicate } from '../Cards/types';
import { rankToRarity, CARD_RANK_NAMES } from '../Cards/types';
import type {
    CombatCard, CombatVerbClass, CardEffectKind,
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

/** True if the effect is an exposure / soft debuff (MARK / QUARTER class). */
function isStatDebuff(effect: Effect): boolean {
    if (effect.type !== 'debuff') return false;
    return (effect.payload.rollModifier ?? 0) < 0
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

/** Stance color for a projected combat card — its philosophical aspect (§4.3).
 *  Phase 104 — 'any' is the grey office's colourless aspect: every die colour
 *  powers it, with a neutral (never on/off) colour-match bonus. */
export function cardStanceColor(card: Card): CardAspect {
    return card.color;
}

/**
 * Classifies a card into a verb class + the effect kind its PAID action
 * advances. Priority: oath/hex > defend > DoT > control > exposure >
 * damage > utility.
 */
export function classifyVerbClass(
    card: Card,
    lookupEffect: EffectLookup,
): { verbClass: CombatVerbClass; track: CardEffectKind } {
    if (card.cardType === 'oath') return { verbClass: 'oath', track: 'none' };
    if (card.cardType === 'hex') return { verbClass: 'hex', track: 'control' };

    const mechs = card.specialMechanics ?? [];
    if (mechs.some(m => m.kind === 'guard')) {
        return { verbClass: 'defend', track: 'none' };
    }

    const enemy = enemyEffects(card);
    const defs = enemy.map(e => lookupEffect(e.effectId)).filter((e): e is Effect => !!e);

    if (defs.some(isDot)) return { verbClass: 'direct-dot', track: 'dot' };
    if (defs.some(isControl)) return { verbClass: 'direct-control', track: 'control' };
    if (defs.some(isStatDebuff)) return { verbClass: 'stat-debuff', track: 'control' };
    if (mechs.some(m => m.kind === 'deal')) {
        return { verbClass: 'direct-damage', track: 'none' };
    }
    return { verbClass: 'buff-self', track: 'none' };
}

/**
 * VITAE preview (P0-truth): what this card's PAID line takes off the foe on a
 * neutral read — direct damage PLUS the lifetime of the statuses it lands
 * (Σ floor(damagePerRound × intensity) × duration, ramp-aware).
 *
 * THE BIG NUMBERS REWRITE (2026-09-02): this used to sum DoT ONLY, with the
 * comment "0 for everything else (no strike preview exists any more)" — true
 * under the strike ban, and badly wrong once DEAL came back. The sim's greedy
 * pilot ranks candidate plays by exactly this number, so while it ignored
 * direct damage the pilot was blind to the library's primary verb: every
 * damage card scored 0, the bot fell through to its signature skill on almost
 * every turn (dominance 100% on a signature at every stage), 75% of the
 * library never got played, and the late-stage cells read unwinnable. The
 * preview is what makes the pilot able to see; it has to count the whole hit.
 */
export function bottomDamagePreview(card: Card, lookupEffect: EffectLookup): number {
    let total = 0;
    for (const m of card.specialMechanics ?? []) {
        if (m.kind === 'deal') total += m.amount;
    }
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

/**
 * WI-2 — the enemy DoT's FACE descriptor. Event-triggered DoTs (poison =
 * `card-played`, bleed = `damage-instance`, `payoff`) tick on a game event, not
 * at the round boundary, so a round-clock "N over its run" lifetime is a lie for
 * them (passive play deals zero). Returns a per-event string ("2/play", "3/hit",
 * "2/payoff") for the first event DoT, or null when the card's DoT is round-clock
 * (the lifetime total stands) or it has no enemy DoT.
 */
export function bottomDotFacePreview(card: Card, lookupEffect: EffectLookup): string | null {
    for (const ce of enemyEffects(card)) {
        const def = lookupEffect(ce.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot) continue;
        const trig = dot.trigger;
        if (trig !== 'card-played' && trig !== 'damage-instance' && trig !== 'payoff') return null;
        const intensity = Math.min(ce.intensity ?? 1, MAX_EFFECT_INTENSITY);
        const perTick = Math.floor(dot.damagePerRound * intensity);
        const unit = trig === 'card-played' ? 'play' : trig === 'damage-instance' ? 'hit' : 'payoff';
        return `${perTick}/${unit}`;
    }
    return null;
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
 *
 * `opts.selfTargetCard` marks riders printed on a self-target card: an effect
 * rider then names its side only when it crosses the card's printed target
 * (an unmarked clause always lands on the card's target).
 */
export function riderText(r: CardRider, opts?: { selfTargetCard?: boolean }): string {
    const parts: string[] = [];
    if (r.guard) parts.push(`Guard ${r.guard}`);
    if (r.applyEffect) {
        // `debuff_creeping_doom` is printed DOOM on every face; the raw effect
        // slug ("creeping_doom") is not a word the game ever says out loud.
        const label = r.applyEffect.effectId === 'debuff_creeping_doom'
            ? 'DOOM'
            : r.applyEffect.effectId.replace(/^(debuff|buff)_/, '');
        const i = r.applyEffect.intensity ?? 1;
        const d = r.applyEffect.duration;
        const toSelf = r.applyEffect.to === 'self';
        const side = toSelf === !!opts?.selfTargetCard ? '' : toSelf ? ' (self)' : ' (enemy)';
        parts.push(`${label} i${i}${d ? ` d${d}` : ''}${side}`);
    }
    // Damage leads the rider when it carries any, so a FREE line reads
    // "Deal 4 · POISON 3", not "POISON 3 · Deal 4".
    if (r.damage) parts.unshift(`Deal ${r.damage}`);
    return parts.join(' · ');
}

/**
 * WS4.2 / WS5.2 — human text for a combat-state synergy predicate (the
 * printed condition line; P0-truth: the text IS the evaluated condition).
 *
 * Face-term budget (card-keyword doctrine, WS5.2-era): originally OPENING was
 * the microset's one shared face term, deliberately card-local and
 * "registered nowhere". THE BIG NUMBERS REWRITE (2026-09-02) promoted `opening`/`finale` to
 * real turn-shape registry keywords alongside FLOW/REQUIEM (see
 * `docs/keyword-atlas.md` § "Player keywords — turn shape": AMBUSH, FLOW,
 * FINALE, REQUIEM, FALLEN) — `paid-summary-honesty.engine.test.ts` already
 * allowlisted AMBUSH as one of "the turn-shape conditions promoted to face
 * terms" — but the print text here was never updated to match, so AMBUSH
 * never actually appeared on a card face and FINALE never printed its own
 * name at all. Fixed 2026-09-07 (`/adjust-keywords` pass 2): both now print
 * their registry name, matching FLOW/REQUIEM's shape.
 */
export function statePredicateText(p: SynergyStatePredicate): string {
    switch (p.kind) {
        case 'enemy-dealt-no-damage-last-round':
            return 'UNMOVED (the enemy dealt you no damage last round)';
        case 'opening':
            return p.maxPriorSpells === 0
                ? 'AMBUSH (your first spell this turn)'
                : `AMBUSH (within your first ${p.maxPriorSpells + 1} spells this turn)`;
        case 'finale':
            return `FINALE ${p.cardsLeftAtMost} (${p.cardsLeftAtMost} or fewer cards left in hand after this)`;
        case 'recoil-paid-this-turn':
            return 'blood already paid (you paid RECOIL earlier this turn)';
        case 'enemy-drew-blood':
            return 'the enemy drew blood since your last turn';
        case 'requiem':
            return `REQUIEM ${p.n} (${p.n}+ cards in your discard pile)`;
        // THE BIG NUMBERS REWRITE — the mirror of OPENING: the turn that keeps
        // going. FLOW is registry vocabulary (Dawncaster's Flow), so it prints
        // as a face term with its threshold spelled out.
        case 'flow':
            return `FLOW ${p.minPriorSpells} (${p.minPriorSpells}+ spells already played this turn)`;
        // EVENTIDE (`/adjust-keywords` pass 11) — the Chaos-family drill: a
        // parity read on the player's own draw pile, not a turn-position gate.
        case 'eventide':
            return 'EVENTIDE (an even number of cards left in your draw pile)';
    }
}

/** Human text for one special mechanic (PAID line clauses, real units). */
export function mechanicText(m: CardSpecialMechanic): string | null {
    switch (m.kind) {
        case 'guard': return `Guard ${m.amount}`;
        case 'deal': return `Deal ${m.amount}`;
    }
}

/** Registry DoT species — their keyword definition already says how they tick.
 *  Any OTHER DoT effect is card-local vocabulary and prints its per-turn bite
 *  inline (card-wording audit 2026-07-13: nettle sting / kindling ember were
 *  the two undefined species). */
export const REGISTRY_DOT_IDS: ReadonlySet<string> = new Set(['debuff_poison', 'debuff_bleed']);

/** Human text for a card's PAID payload: statuses + mechanics, real units.
 *  An effect names its side only when it crosses the card's printed target.
 *  Exported for the paid-summary honesty guard (authored summaries must carry
 *  every number this generator prints). */
export function paidText(card: Card, lookupEffect: EffectLookup): string {
    const parts: string[] = [];
    for (const ce of card.combatEffects ?? []) {
        const def = lookupEffect(ce.effectId);
        if (!def) continue;
        const label = def.name.toLowerCase();
        const i = ce.intensity ?? 1;
        const d = ce.duration ?? def.duration;
        const notes: string[] = [];
        const dot = def.payload.damageOverTime;
        if (dot && !REGISTRY_DOT_IDS.has(def.id)) {
            notes.push(`DoT: ${Math.floor(dot.damagePerRound * Math.min(i, MAX_EFFECT_INTENSITY))}/turn`);
        }
        const toSelf = ce.appliedTo === 'self';
        if (toSelf !== (card.targetType === 'self')) notes.push(toSelf ? 'self' : 'enemy');
        // DOOM never counts its duration down and grows every time the foe
        // acts — printing `d3` would promise an expiry the engine will not
        // honour. Print the clock the keyword actually obeys instead.
        const grows = def.payload.dotModifiers?.growth === 'per-enemy-action'
            && def.payload.dotModifiers?.calendarExpiry === false;
        const clock = grows ? ' (grows +1 each time the foe acts)' : ` d${d}`;
        parts.push(`${label} i${i}${clock}${notes.length ? ` (${notes.join(', ')})` : ''}`);
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
    const persistent = card.cardType === 'oath' || card.cardType === 'hex';

    // 2026-07-16 — an authored `paidSummary` (spells only) replaces the
    // generated telegraphese wholesale; the honesty guard pins its numbers
    // and keywords to the payload, so the authored sentence IS the truth
    // surface (no auto dot-suffix gets appended on top of it).
    const authored = !persistent ? card.paidSummary : undefined;
    const paid = authored ?? paidText(card, lookupEffect);
    // Spec 32 v4 — an oath/hex's passive lives in engine hooks, so its
    // authored one-line summary (`persistentEffect`) is what the card prints; fall
    // back to the effect-derived text only if a card is missing the summary.
    const passive = persistent ? (card.persistentEffect ?? paid) : paid;

    // FREE line — the authored dieless rider (spells only). Spec 32 v4: persistent
    // cards get a dieless FREE line that grants a TIMED (FREE_ENCHANT_ROUNDS-round)
    // instance of the same passive; the PAID line makes it permanent.
    const riderOpts = { selfTargetCard: card.targetType === 'self' };
    const topActionText = persistent
        ? `FREE (${FREE_ENCHANT_ROUNDS} rounds) — ${passive} (${rankLabel(card)})`
        : card.free
            ? `FREE — ${riderText(card.free, riderOpts)}. (${rankLabel(card)})`
            : `FREE — no effect. (${rankLabel(card)})`;

    // WI-2 — an event DoT (poison/bleed) prints its per-event bite ("2/play"),
    // never a round-clock lifetime; only a true round-clock DoT keeps "N over
    // its run" — and only when no per-turn species gloss already spelled it
    // out (the lifetime is per-tick × duration, both printed).
    const dotFace = bottomDotFacePreview(card, lookupEffect);
    const speciesGlossed = enemyEffects(card).some(ce => {
        const def = lookupEffect(ce.effectId);
        return !!def?.payload.damageOverTime && !REGISTRY_DOT_IDS.has(def.id);
    });
    const dotSuffix = authored ? '' : dotFace ? ` (${dotFace})` : preview > 0 && !speciesGlossed ? ` (${preview} over its run)` : '';
    const bottomActionText = persistent
        ? `PAID (rest of combat) — ${passive} Costs 1 die.${card.cardType === 'hex' ? ' Attaches to the enemy.' : ''}`
        : authored
            ? `PAID — ${authored} Costs 1 die.`
            : `PAID — ${paid}${dotSuffix}. Costs 1 die.`;

    // Printed DIE LINES, generated from the riders in real units.
    const dieLines: string[] = [];
    // WS4.2 — combat-state synergy condition (dieless, ledger-read): printed
    // exactly as evaluated (P0-truth).
    if (card.synergy?.statePredicate && card.synergy.rider) {
        dieLines.push(`◆ ${statePredicateText(card.synergy.statePredicate)}: ${riderText(card.synergy.rider, riderOpts)}`);
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
