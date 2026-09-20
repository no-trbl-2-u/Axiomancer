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
import {
    CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS, CONCEDE_PREMISES_UNIQUE,
} from './effects';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Card, CardAspect, CardCombatEffects, CardRider, CardSpecialMechanic, SynergyStatePredicate } from '../Cards/types';
import { rankToRarity, CARD_RANK_NAMES } from '../Cards/types';
import type {
    CombatCard, CombatVerbClass, CardEffectKind,
} from './combat.encounter.types';
import { getCardById } from '../Cards/cards.library';
import { OVERHEAT_BUST_CHANCE } from './combat.dice';

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

/** Stance color for a projected combat card — its philosophical aspect (§4.3).
 *  Phase 104 — 'any' is the grey office's colourless aspect: every die colour
 *  powers it, with a neutral (never on/off) colour-match bonus. */
export function cardStanceColor(card: Card): CardAspect {
    return card.philosophicalAspect;
}

/** Payoff mechanics that read as the "closer" class (status-payoff bursts). */
const PAYOFF_KINDS: ReadonlySet<string> = new Set(['rupture', 'reap_all', 'reap', 'turnabout']);

/**
 * Classifies a card into a verb class + the effect kind its PAID action
 * advances. Priority: oath/hex > befriend > defend > DoT > control >
 * exposure > payoff > utility.
 */
export function classifyVerbClass(
    card: Card,
    lookupEffect: EffectLookup,
): { verbClass: CombatVerbClass; track: CardEffectKind } {
    if (card.cardType === 'oath') return { verbClass: 'oath', track: 'none' };
    if (card.cardType === 'hex') return { verbClass: 'hex', track: 'control' };

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
    // Direct damage — the `deal` mechanic (multi-hit aware) and any rider that
    // carries `damage`, on the PAID line and on the condition lines that fire
    // free with it. Unconditional first.
    for (const m of card.specialMechanics ?? []) {
        if (m.kind === 'deal') total += m.amount * Math.max(1, m.hits ?? 1);
        else if (m.kind === 'rider') total += m.rider.damage ?? 0;
        else if (m.kind === 'immolate') total += m.rider.damage ?? 0;
    }
    // Condition riders are counted at face value: the pilot should WANT the
    // card whose FALLEN/threshold/fate clause pays in damage, and the engine
    // decides at play time whether it fires.
    for (const r of [card.threshold?.rider, card.dieBonus?.rider, card.fate?.rider,
        card.fallen?.rider, card.synergy?.rider]) {
        total += r?.damage ?? 0;
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
    // The intensity/duration boosts apply to the statuses THIS play lands —
    // one shared suffix names that target (card-wording audit 2026-07-13).
    if (r.bonusIntensity || r.bonusDuration) {
        const boost: string[] = [];
        if (r.bonusIntensity) boost.push(`+${r.bonusIntensity} intensity`);
        if (r.bonusDuration) boost.push(`+${r.bonusDuration} turn${r.bonusDuration === 1 ? '' : 's'}`);
        parts.push(`${boost.join(' · ')} to this card's statuses`);
    }
    if (r.guard) parts.push(`Guard ${r.guard}`);
    if (r.conviction) parts.push(`+${r.conviction} Conviction`);
    if (r.refreshDie) parts.push('refresh the die');
    if (r.revealStance) parts.push('reveal the next stance');
    if (r.tickAllDots) parts.push('tick every DoT now');
    if (r.tickOne) parts.push('tick');
    if (r.cleanse) parts.push(`cleanse ${r.cleanse}`);
    if (r.healHp) parts.push(`heal ${r.healHp}`);
    if (r.drawCards) parts.push(`draw ${r.drawCards}`);
    if (r.premises) parts.push(`+${r.premises} Charge${r.premises === 1 ? '' : 's'}`);
    if (r.sway) parts.push(`PLEA ${r.sway}`);
    if (r.souls) parts.push(`+${r.souls} Soul${r.souls === 1 ? '' : 's'}`);
    if (r.foretell) parts.push(`FORETELL ${r.foretell}`);
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
    if (r.ruptureMarks) parts.push(`consume all marks — ${r.ruptureMarks} damage per stack`);
    if (r.intensityPerPip) parts.push(`+${r.intensityPerPip} intensity to one DoT per pip`);
    if (r.pips) parts.push(`+${r.pips} pip${r.pips === 1 ? '' : 's'} to every Reserve die`);
    if (r.stagger) parts.push(`STAGGER ${r.stagger}`);
    if (r.barrier) parts.push(`GUARD ${r.barrier} (persists)`);
    if (r.recoil) parts.push(`RECOIL ${r.recoil}`);
    if (r.millCards) parts.push(`mill ${r.millCards} to discard`);
    // THE BIG NUMBERS REWRITE — damage leads the rider when it carries any, so
    // a FREE line reads "Deal 4 · POISON 3", not "POISON 3 · Deal 4".
    if (r.damage) parts.unshift(`Deal ${r.damage}${r.pierce ? ' (PIERCE)' : ''}`);
    if (r.wrath) parts.push(`WRATH ${r.wrath}`);
    if (r.chain) parts.push(`CHAIN ${r.chain}`);
    if (r.flay) parts.push(`FLAY ${r.flay}`);
    return parts.join(' · ');
}

/**
 * WS4.2 / WS5.2 — human text for a combat-state synergy predicate (the
 * printed condition line; P0-truth: the text IS the evaluated condition).
 *
 * Face-term budget (card-keyword doctrine, WS5.2-era): originally OPENING was
 * the microset's one shared face term, deliberately card-local and
 * "registered nowhere" — the sequencing-microset fixture cards
 * (`src/test-utils/retired-verb-cards.ts`) still exercise that historical
 * shape. THE BIG NUMBERS REWRITE (2026-09-02) promoted `opening`/`finale` to
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
        // KW-2 (phase 29): BARRIER merged into GUARD — prints "persists" on
        // its one carrier (the-adamant-wall) rather than a separate word.
        case 'barrier': return `GUARD ${m.amount} (persists)`;
        case 'riposte': return `RIPOSTE ${m.damage}${m.reduce ? ` (parry ${m.reduce})` : ''}`;
        // Bare `rupture` resolves as consume-ALL in the engine — the face says
        // so; the fuelPerPip carrier (the-overtake) also prints its 2-pip gate.
        // "damage", not "fuel" — the pip/omen bonus feeds the burst's damage
        // and no player surface defines "fuel" (card-wording audit 2026-07-13).
        case 'rupture': return `RUPTURE ALL${m.fuelPerPip ? ` (+${m.fuelPerPip} damage per spent pip; needs 2+ pips)` : ''}${m.fuelPerOmenHit ? ` (+${m.fuelPerOmenHit} damage per omen hit)` : ''}`;
        case 'siphon': return `SIPHON ${Math.round(m.pct * 100)}%`;
        case 'forge_floating_die': return `FORGE a ${m.color === 'wild' ? 'WILD' : "the powering die's color"} ghost die`;
        case 'float_x_die': return 'FORGE a dead X die into a WILD ghost die (no X: +1 Conviction)';
        case 'stagger': return `STAGGER ${m.rungs}`;
        case 'lock_stance': return "lock the enemy's next stance";
        case 'foretell': return `FORETELL ${m.count}`;
        // Phase 32 part 4d — OMEN v2: claim a window (1-N phases, ante +
        // rider both scale 1/window) instead of a silent die-derived guess.
        case 'omen': return `OMEN — stake claim (window 1-${m.maxWindow}, ante ${m.anteConviction}◆ at window 1): on hit, ${riderText(m.rider)}`;
        case 'premise': return `+${m.count} Charge${m.count === 1 ? '' : 's'}`;
        // The declared conclusion prints its full payload — the rider used to
        // be dropped — and the CONDEMN bar names the elite/boss floors
        // (`concedeFloorFor` raises the authored value against them).
        // The CONDEMN bar names EVERY floor `concedeFloorFor` can raise the
        // authored value to, so a face can never advertise a bar the live fight
        // does not honour. Unique joined the ladder in the 2026-09-02 rescale.
        case 'peroration': return `SENTENCE at ${m.at} — ${riderText(m.rider)}${m.concedeAt ? ` (CONDEMN at ${m.concedeAt} — you win; elite ${CONCEDE_PREMISES_ELITE} · boss ${CONCEDE_PREMISES_BOSS} · unique ${CONCEDE_PREMISES_UNIQUE})` : ''}`;
        case 'spend_premises': return `spend ALL Charges — +1 mark per ${m.markPer}, draw 1 per ${m.drawPer}`;
        case 'spend_all_pips': return `spend ALL pips${m.guardPerPip ? ` (+${m.guardPerPip} Guard per pip)` : ''}${m.markPer ? ` (+1 MARK per ${m.markPer} spent, uncapped)` : ''}`;
        case 'recoil': return `RECOIL ${m.hp}`;
        case 'recoil_x': return `RECOIL X (min ${m.min}): POISON per ${Math.round(1 / m.poisonPerX)}`;
        // KW-3 (phase 29): FESTER→PROLONG, TRANSMUTE→CURDLE (renames).
        case 'extend_dots': return `PROLONG +${m.turns} duration to ALL your DoTs`;
        // CURDLE retired as a badge (2026-09-05 /adjust-keywords pass 1): its
        // sole carrier (The Lazar's Kiss) fell below the atlas's own ≥2-carrier
        // discipline. Plain rules text now, per the atlas's own escape hatch
        // ("a one-card mechanic stays as plain rules text on that card").
        case 'convert_dots': return `flips the foe's BLEED into POISON and POISON into BLEED, each landing ${m.bonusIntensity} harder`;
        // Profane canon (2026-08-08): FESTER earns its own registry row — the
        // intensity half of the old PROLONG double-duty splits out.
        case 'boost_all_dots': return `FESTER ${m.intensity} — every DoT on the enemy gains +${m.intensity} intensity`;
        case 'soul_gain': return `+${m.count} Soul${m.count === 1 ? '' : 's'}`;
        // KW-2 (phase 29): re-mapped Soul→Rupture — extends RUPTURE's
        // printed sense ("consume N afflictions") instead of a redundant
        // CONSUME word.
        case 'consume_affliction': return `RUPTURE 1 — its remaining damage lands now, +${m.souls} Soul${m.souls === 1 ? '' : 's'}`;
        case 'reap': return `REAP ${m.cost}${m.kindle ? ` — KINDLE (${m.kindle})` : ''}${m.rider ? ` — ${riderText(m.rider)}` : ''}`;
        case 'reap_all': return `REAP ALL — ${m.burstPerSoul} damage per Soul`;
        // Phase 32 part 4a — cashes the whole STAGGER/BACKFIRE denial ledger;
        // badged as BACKFIRE's own "ALL" variant (REAP ALL / RUPTURE ALL
        // precedent), not a new registry keyword.
        case 'turnabout': return `BACKFIRE ALL — ${m.burstPerRung} damage per rung ever denied`;
        case 'sway': return `PLEA ${m.amount}`;
        case 'echo': return 'ECHO';
        case 'echo_next_spell': return 'your next spell gains ECHO';
        // KW-3 (phase 29): REPRISE→RECALL (rename; frees REPRISE — see the
        // audit's near-synonym-pair finding against ECHO/replay_last).
        case 'reprise': return `RECALL ${m.count}${m.fireFree ? (m.count === 1 ? ' — its FREE line fires now' : ' — their FREE lines fire now') : ''}`;
        // A generic rider is still part of the PAID face. Omitting it hid real
        // costs and payoffs on cards such as The Olive Branch, Second Thoughts,
        // and Ouroboros.
        case 'rider': return riderText(m.rider);
        // KW-2 (phase 29): no keyword badge — ouroboros (this mechanic's
        // sole, 1-of-rare carrier) speaks card-local rules text only.
        case 'replay_last': return `replay your last spell ×${m.times}`;
        // /adjust-keywords pass 8 — CONJURE is a retired badge (KW-1/KW-3,
        // mobile's own retirement test), so no keyword word here, but the
        // generator had NO case at all for this kind (not even the plain-text
        // fallback `replay_last`/`convert_dots` get) — it silently fell to
        // `default: return null` and vanished from any PAID line that isn't
        // covered by an authored `paidSummary`. grave-goods (this kind's sole
        // carrier) masks the gap with its own authored summary, but a future
        // conjure_card carrier without one would print a PAID line missing
        // this clause entirely, and `scripts/export-catalog.ts`'s
        // `specialMechanicLabel` (no `paidSummary` fallback there) already
        // leaks the raw `conjure_card` id into the built catalog today.
        case 'conjure_card': return `conjure ${getCardById(m.cardId)?.name ?? 'a card'} into your hand`;
        case 'create_temporary_die': return `KINDLE (${m.color})`;
        case 'grant_pip': return `+${m.count} pip${m.count === 1 ? '' : 's'} to every Reserve die${m.overflow ? ` — each pip with no room: ${riderText(m.overflow)}` : ''}`;
        // Phase 32 part 4c — rides the existing PIP vocabulary (no new
        // keyword): a die already at the safe cap can take MORE pips, at a
        // per-pip bust risk (a busted die's pips are halved, not zeroed).
        case 'overheat': return `PIP ${m.pips} past the cap (${Math.round(OVERHEAT_BUST_CHANCE * 100)}% bust: halves the die)`;
        case 'bank_spent_die': return 'the spent die BANKS to the Reserve';
        case 'convert_die_color': return 'the spent die returns as WILD';
        case 'refresh_die': return 'refresh the spent die';
        case 'reroll_spent': return 're-roll every spent/dead die';
        case 'befriend_attempt': return 'Befriend attempt';
        case 'strip_random_buff': return 'strip a random buff';
        // Profane-canon rework — the pyre verbs.
        case 'immolate': return `IMMOLATE ${m.count} — burn the lowest card${m.count === 1 ? '' : 's'} in hand from the fight: ${riderText(m.rider)}`;
        case 'purge_self': return 'PURGE — this card leaves the fight entirely';
        // ── THE BIG NUMBERS REWRITE — direct damage and its family ───────────
        case 'deal': {
            const hits = m.hits ?? 1;
            const body = hits > 1 ? `Deal ${m.amount} x ${hits}` : `Deal ${m.amount}`;
            return m.pierce ? `${body}. PIERCE` : body;
        }
        case 'wrath': return `WRATH ${m.amount}`;
        case 'flay': return `FLAY ${m.stacks}`;
        case 'twin': return 'TWIN';
        case 'chain': return `CHAIN ${m.amount}`;
        case 'execute': return `EXECUTE ${Math.round(m.atPct * 100)}%`;
        case 'overkill': {
            const parts: string[] = [];
            if (m.conviction) parts.push(`+${m.conviction} Conviction per ${m.per} excess`);
            if (m.healPct) parts.push(`heal ${Math.round(m.healPct * 100)}% of the excess`);
            if (m.souls) parts.push(`+${m.souls} Soul per ${m.per} excess`);
            return `OVERKILL — ${parts.join(', ')}`;
        }
        default: return null;
    }
}

/** Registry DoT species — their keyword definition already says how they tick.
 *  Any OTHER DoT effect is card-local vocabulary and prints its per-turn bite
 *  inline (card-wording audit 2026-07-13: nettle sting / kindling ember were
 *  the two undefined species). */
const REGISTRY_DOT_IDS: ReadonlySet<string> = new Set(['debuff_poison', 'debuff_bleed']);

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
    if (card.threshold) {
        dieLines.push(`⬡ ${card.threshold.color.toUpperCase()} ×${card.threshold.count} spent: ${riderText(card.threshold.rider, riderOpts)}`);
    }
    if (card.dieBonus) {
        const on = card.dieBonus.onColor === 'match'
            ? `${cardStanceColor(card).toUpperCase()}/WILD die`
            : card.dieBonus.onColor === 'off'
                ? 'off-color die'
                : `${card.dieBonus.onColor.toUpperCase()} die`;
        dieLines.push(`⬢ ${on}: ${riderText(card.dieBonus.rider, riderOpts)}`);
    }
    if (card.fate) {
        const recoil = card.fate.recoilHp ? ` (recoil ${card.fate.recoilHp} VITAE)` : '';
        dieLines.push(`✕ an X die may power this: +${riderText(card.fate.rider, riderOpts)}${recoil}`);
    }
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
