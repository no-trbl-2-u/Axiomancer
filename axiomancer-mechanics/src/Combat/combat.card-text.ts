/**
 * Card TEXT projection — the structured clause list behind every printed
 * card line.
 *
 * ## Why this module exists
 *
 * `combat.cards.ts` already generates the card's printed STRINGS
 * (`topActionText` / `bottomActionText` / `dieLines`). Mobile's combat card
 * detail panel did not use them: it re-derived its own `◆ +DIE` line by
 * walking `specialMechanics` a second time, in a second order, with a second
 * (partial) set of cases. That second walk is where the owner's finding 4
 * ("card details sometimes don't match the actual card") came from. Three
 * failure modes, all silent:
 *
 * 1. **A clause with no presenter case vanished.** `conjure_card`, `overheat`
 *    and every mechanic whose face headline carries no keyword badge fell
 *    through a `return null` and left the panel. `Deal` is the worst of them:
 *    it deliberately has no keyword badge, so on every multi-clause damage
 *    card the DAMAGE — the whole point of the card — was dropped.
 * 2. **A one-clause remainder collapsed to the headline.** The presenter
 *    returned `null` whenever fewer than two clauses survived, and the panel
 *    fell back to a headline sentence. `thumbprick-oath` printed "Deal 14
 *    VITAE." and never mentioned that it costs you 5 VITAE.
 * 3. **Two clauses sharing a keyword shadowed each other.** A dedupe keyed on
 *    the WORD meant a self-buff mapped to PLEA hid the card's real `PLEA 38`.
 *
 * The fix is structural, not editorial: the clause list is derived here, from
 * the effect data, once. Mobile formats it (keyword casing, separators,
 * glosses are presentation) and never decides what is in it.
 *
 * ## Contract
 *
 * Pure. Reads the authored `Card` and an effect lookup, mutates nothing, and
 * never invents a number: every numeric in a clause comes from
 * {@link mechanicText} / `riderText` / the authored effect payload,
 * which are the same generators `bottomActionText` is built from.
 *
 * `clausesText()` reproduces the engine's own joined wording, so a presenter
 * that cannot format a clause can always print `clause.text` verbatim and
 * still be honest.
 */

import { MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import type { Effect } from '../Effects/types';
import type { Card, CardRider, CardSpecialMechanic } from '../Cards/types';
import { mechanicText, REGISTRY_DOT_IDS } from './combat.cards';
import type { EffectLookup } from './combat.cards';

/** Which side of the table a clause lands on. */
export type ClauseSide = 'self' | 'enemy';

/** The DoT facts a printed status clause carries, when it carries any. */
export interface ClauseDot {
    /** Damage one tick deals: `floor(damagePerRound × capped intensity)`. */
    perTick: number;
    /** The event that ticks it; `null` for a round-clock DoT. */
    trigger: 'card-played' | 'damage-instance' | 'payoff' | null;
    /** Round-clock lifetime total (ramp-aware). 0 for an event DoT, whose
     *  lifetime depends on how the fight goes and must never be printed as a
     *  fixed number. */
    lifetime: number;
    /** True for a DoT with no calendar that deepens as the foe acts (DOOM):
     *  printing a duration for it would promise an expiry the engine will
     *  not honour. */
    growsOnEnemyAction: boolean;
}

/** One printed clause of a card's FREE or PAID line. */
export interface CardClause {
    /** `'effect'` for an authored status, `'mechanic'` for a special verb,
     *  `'rider'` for a FREE-line rider clause. */
    source: 'effect' | 'mechanic' | 'rider';
    /** Stable identity: the effect id, the mechanic kind, or the rider field.
     *  Presenters dedupe on THIS, never on the printed word — two clauses may
     *  legitimately share a keyword. */
    id: string;
    side: ClauseSide;
    /** The engine's own leading word for the clause, uppercase where the
     *  engine prints it uppercase (`'RECOIL'`, `'DEAL'`, `'Poison'`); `''`
     *  when the clause is a full sentence with no headline word. */
    label: string;
    /** Everything the clause prints after its label; `''` when the label says
     *  all of it. */
    value: string;
    /** The full engine wording — always safe to print verbatim. */
    text: string;
    /** Every number the clause prints, in order. */
    numbers: readonly number[];
    /** Authored intensity, for an `'effect'` clause. */
    intensity?: number;
    /** Authored (or library-default) duration, for an `'effect'` clause. */
    duration?: number;
    /** DoT facts, for an `'effect'` clause whose payload ticks. */
    dot?: ClauseDot;
    /**
     * `' (self)'` / `' (enemy)'` when the clause lands on the OPPOSITE side to
     * the card's printed target, `''` otherwise — the same rule `paidText` and
     * `riderText` use. A self-cost printed on an enemy-target card must say so
     * or the player reads their own price as harm to the foe.
     */
    cross?: string;
    /**
     * Sub-clauses, for a clause whose whole printed text IS a rider (the
     * `rider` mechanic). `parts.map(p => p.text).join(' · ') === text`, so a
     * presenter may format the parts terse-ly without inventing anything.
     */
    parts?: CardClause[];
}

/** Numbers a printed clause shows the player. */
function numbersIn(text: string): number[] {
    return (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/**
 * Engine words for the mechanics whose printed text does not START with an
 * all-caps keyword. Not new vocabulary: each is the word that mechanic's own
 * `mechanicText` output already uses (`Guard 8`, `Deal 20`, `+2 Charges`).
 * Kinds absent here print as a full sentence with an empty label, which is
 * the honest answer for a card-local rules clause.
 */
const MECHANIC_LABEL: Readonly<Record<string, string>> = Object.freeze({
    guard: 'GUARD',
    deal: 'DEAL',
    premise: 'CHARGE',
    spend_premises: 'CHARGE',
    spend_all_pips: 'PIP',
    grant_pip: 'PIP',
    soul_gain: 'SOUL',
    echo_next_spell: 'ECHO',
    strip_random_buff: 'CLEANSE',
});

/** Split a printed mechanic clause into its headline word and the rest. */
function splitLabel(kind: string, text: string): { label: string; value: string } {
    const caps = text.match(/^([A-Z][A-Z]+)\s*/);
    if (caps) return { label: caps[1], value: text.slice(caps[0].length).trim() };
    const word = MECHANIC_LABEL[kind];
    if (!word) return { label: '', value: text };
    // `Deal 20` / `Guard 8` — strip the word the label already says.
    const lead = new RegExp(`^${word}\\s*`, 'i');
    return { label: word, value: text.replace(lead, '').trim() };
}

/** Which side a special mechanic's payload lands on. Self-costs and
 *  self-buffs must read as costs, never as things done to the foe. */
function mechanicSide(m: CardSpecialMechanic): ClauseSide {
    switch (m.kind) {
        case 'guard': case 'barrier': case 'riposte': case 'recoil': case 'recoil_x':
        case 'soul_gain': case 'premise': case 'spend_premises': case 'spend_all_pips':
        case 'grant_pip': case 'overheat': case 'forge_floating_die': case 'float_x_die':
        case 'create_temporary_die': case 'bank_spent_die': case 'convert_die_color':
        case 'refresh_die': case 'reroll_spent': case 'reprise': case 'replay_last':
        case 'echo': case 'echo_next_spell': case 'twin': case 'conjure_card':
        case 'immolate': case 'purge_self': case 'foretell': case 'omen':
        case 'wrath': case 'chain':
            return 'self';
        default:
            return 'enemy';
    }
}

/** DoT facts for an authored status payload, or `undefined` when it does not tick. */
function dotFacts(def: Effect, intensity: number, duration: number): ClauseDot | undefined {
    const dot = def.payload.damageOverTime;
    if (!dot) return undefined;
    const i = Math.min(intensity, MAX_EFFECT_INTENSITY);
    const mods = def.payload.dotModifiers;
    const trig = dot.trigger;
    const trigger = trig === 'card-played' || trig === 'damage-instance' || trig === 'payoff' ? trig : null;
    const ramp = mods?.escalatesPerTurn ? (mods.rampFactor ?? 0) : 0;
    let lifetime = 0;
    if (trigger === null) {
        for (let k = 0; k < Math.max(0, duration); k++) {
            lifetime += Math.floor((dot.damagePerRound + Math.floor(ramp * k)) * i);
        }
    }
    return {
        perTick: Math.floor(dot.damagePerRound * i),
        trigger,
        lifetime,
        growsOnEnemyAction: mods?.growth === 'per-enemy-action' && mods?.calendarExpiry === false,
    };
}

/**
 * The FREE (dieless) line's clauses, in the engine's own printed order.
 *
 * Mirrors `riderText` clause for clause — `clausesText(freeClauses(...))`
 * equals `riderText(card.free)`, which `combat.card-text.engine.test.ts` pins
 * across the whole library.
 */
export function riderClauses(r: CardRider, opts?: { selfTargetCard?: boolean }): CardClause[] {
    const out: CardClause[] = [];
    const push = (id: string, side: ClauseSide, label: string, value: string, text: string) => {
        out.push({ source: 'rider', id, side, label, value, text, numbers: numbersIn(text) });
    };
    if (r.bonusIntensity || r.bonusDuration) {
        const boost: string[] = [];
        if (r.bonusIntensity) boost.push(`+${r.bonusIntensity} intensity`);
        if (r.bonusDuration) boost.push(`+${r.bonusDuration} turn${r.bonusDuration === 1 ? '' : 's'}`);
        const text = `${boost.join(' · ')} to this card's statuses`;
        const id = r.bonusIntensity && r.bonusDuration ? 'boost'
            : r.bonusIntensity ? 'bonusIntensity' : 'bonusDuration';
        const label = r.bonusIntensity && r.bonusDuration ? 'BOOST'
            : r.bonusIntensity ? 'INTENSITY' : 'DURATION';
        const value = r.bonusIntensity && r.bonusDuration
            ? `+${r.bonusIntensity} · +${r.bonusDuration}t`
            : r.bonusIntensity ? `+${r.bonusIntensity}` : `+${r.bonusDuration}t`;
        push(id, 'enemy', label, value, text);
    }
    if (r.guard) push('guard', 'self', 'GUARD', `${r.guard}`, `Guard ${r.guard}`);
    if (r.conviction) push('conviction', 'self', 'CONVICTION', `+${r.conviction}`, `+${r.conviction} Conviction`);
    if (r.refreshDie) push('refreshDie', 'self', 'REFRESH', 'die', 'refresh the die');
    if (r.revealStance) push('revealStance', 'self', 'REVEAL', 'stance', 'reveal the next stance');
    if (r.tickAllDots) push('tickAllDots', 'enemy', 'TICK', 'all DoTs', 'tick every DoT now');
    if (r.tickOne) push('tickOne', 'enemy', 'TICK', '1', 'tick');
    if (r.cleanse) push('cleanse', 'self', 'CLEANSE', `${r.cleanse}`, `cleanse ${r.cleanse}`);
    if (r.healHp) push('healHp', 'self', 'HEAL', `${r.healHp}`, `heal ${r.healHp}`);
    if (r.drawCards) push('drawCards', 'self', 'DRAW', `${r.drawCards}`, `draw ${r.drawCards}`);
    if (r.premises) push('premises', 'self', 'CHARGE', `+${r.premises}`, `+${r.premises} Charge${r.premises === 1 ? '' : 's'}`);
    if (r.sway) push('sway', 'enemy', 'PLEA', `${r.sway}`, `PLEA ${r.sway}`);
    if (r.souls) push('souls', 'self', 'SOUL', `+${r.souls}`, `+${r.souls} Soul${r.souls === 1 ? '' : 's'}`);
    if (r.foretell) push('foretell', 'self', 'FORETELL', `${r.foretell}`, `FORETELL ${r.foretell}`);
    if (r.applyEffect) {
        const label = r.applyEffect.effectId === 'debuff_creeping_doom'
            ? 'DOOM'
            : r.applyEffect.effectId.replace(/^(debuff|buff)_/, '');
        const i = r.applyEffect.intensity ?? 1;
        const d = r.applyEffect.duration;
        const toSelf = r.applyEffect.to === 'self';
        const side = toSelf === !!opts?.selfTargetCard ? '' : toSelf ? ' (self)' : ' (enemy)';
        const text = `${label} i${i}${d ? ` d${d}` : ''}${side}`;
        out.push({
            source: 'rider', id: r.applyEffect.effectId, side: toSelf ? 'self' : 'enemy',
            label: label.toUpperCase(), value: `×${i}${d ? ` · ${d}t` : ''}${side}`,
            text, numbers: numbersIn(text), intensity: i, duration: d,
        });
    }
    if (r.ruptureMarks) push('ruptureMarks', 'enemy', 'RUPTURE', `${r.ruptureMarks}/stack`, `consume all marks — ${r.ruptureMarks} damage per stack`);
    if (r.intensityPerPip) push('intensityPerPip', 'enemy', 'PIP', `+${r.intensityPerPip} intensity`, `+${r.intensityPerPip} intensity to one DoT per pip`);
    if (r.pips) push('pips', 'self', 'PIP', `+${r.pips}`, `+${r.pips} pip${r.pips === 1 ? '' : 's'} to every Reserve die`);
    if (r.stagger) push('stagger', 'enemy', 'STAGGER', `${r.stagger}`, `STAGGER ${r.stagger}`);
    if (r.barrier) push('barrier', 'self', 'GUARD', `${r.barrier} (persists)`, `GUARD ${r.barrier} (persists)`);
    if (r.recoil) push('recoil', 'self', 'RECOIL', `${r.recoil}`, `RECOIL ${r.recoil}`);
    if (r.millCards) push('millCards', 'self', 'MILL', `${r.millCards}`, `mill ${r.millCards} to discard`);
    if (r.damage) {
        const text = `Deal ${r.damage}${r.pierce ? ' (PIERCE)' : ''}`;
        out.unshift({
            source: 'rider', id: 'damage', side: 'enemy', label: 'DEAL',
            value: `${r.damage}${r.pierce ? ' (PIERCE)' : ''}`, text, numbers: numbersIn(text),
        });
    }
    if (r.wrath) push('wrath', 'self', 'WRATH', `${r.wrath}`, `WRATH ${r.wrath}`);
    if (r.chain) push('chain', 'self', 'CHAIN', `${r.chain}`, `CHAIN ${r.chain}`);
    if (r.flay) push('flay', 'enemy', 'FLAY', `${r.flay}`, `FLAY ${r.flay}`);
    return out;
}

/**
 * Every clause the card's FREE (no-die) play fires.
 *
 * An `oath` / `hex` has no rider: its FREE play is a timed instance of the
 * passive, which the card's own `persistentEffect` summary states, so the list
 * is empty and the presenter prints that summary instead.
 */
export function freeClauses(card: Card): CardClause[] {
    if (card.cardType === 'oath' || card.cardType === 'hex') return [];
    if (!card.free) return [];
    return riderClauses(card.free, { selfTargetCard: card.targetType === 'self' });
}

/**
 * Every clause the card's PAID (die-powered) play fires: each authored status,
 * then each special mechanic, in authored order.
 *
 * Nothing is filtered. A mechanic the engine prints no text for (pure die
 * plumbing with no `mechanicText` case) is the only omission, and that is the
 * engine declining to print it, not this projection dropping it.
 */
export function paidClauses(card: Card, lookupEffect: EffectLookup): CardClause[] {
    const out: CardClause[] = [];
    for (const ce of card.combatEffects ?? []) {
        const def = lookupEffect(ce.effectId);
        if (!def) continue;
        const i = ce.intensity ?? 1;
        const d = ce.duration ?? def.duration;
        const toSelf = ce.appliedTo === 'self';
        const dot = dotFacts(def, i, d);
        // The engine's own wording for this status (paidText's per-effect part),
        // so a presenter can always fall back to it verbatim.
        const notes: string[] = [];
        if (dot && !REGISTRY_DOT_IDS.has(def.id)) {
            notes.push(`DoT: ${dot.perTick}/turn`);
        }
        if (toSelf !== (card.targetType === 'self')) notes.push(toSelf ? 'self' : 'enemy');
        const clock = dot?.growsOnEnemyAction ? ' (grows +1 each time the foe acts)' : ` d${d}`;
        const text = `${def.name.toLowerCase()} i${i}${clock}${notes.length ? ` (${notes.join(', ')})` : ''}`;
        const cross = toSelf === (card.targetType === 'self') ? '' : toSelf ? ' (self)' : ' (enemy)';
        const turns = dot?.growsOnEnemyAction ? '' : ` · ${d} turn${d === 1 ? '' : 's'}`;
        out.push({
            source: 'effect', id: ce.effectId, side: toSelf ? 'self' : 'enemy',
            label: def.name, value: `×${i}${turns}${cross}`, cross,
            text, numbers: numbersIn(text), intensity: i, duration: d,
            ...(dot ? { dot } : {}),
        });
    }
    const riderOpts = { selfTargetCard: card.targetType === 'self' };
    for (const m of card.specialMechanics ?? []) {
        const text = mechanicText(m);
        if (!text) continue;
        const { label, value } = splitLabel(m.kind, text);
        out.push({
            source: 'mechanic', id: m.kind, side: mechanicSide(m),
            label, value, text, numbers: numbersIn(text),
            // A bare `rider` mechanic prints nothing but its rider, so its
            // parts ARE its text — handing them over lets a presenter print
            // `HEAL 16` instead of the engine's lowercase prose, with no
            // second derivation anywhere.
            ...(m.kind === 'rider' ? { parts: riderClauses(m.rider, riderOpts) } : {}),
        });
    }
    return out;
}

/** The engine's joined wording for a clause list (the fallback every presenter
 *  can print verbatim). FREE clauses join with ` · `, as `riderText` does. */
export function clausesText(clauses: readonly CardClause[], separator = ' · '): string {
    return clauses.map(c => c.text).join(separator);
}

/** The card's PAID payload as one line, in the engine's own wording. Matches
 *  `paidText`'s ` + ` join; `'utility'` when the card prints no clause. */
export function paidDetailText(card: Card, lookupEffect: EffectLookup): string {
    return clausesText(paidClauses(card, lookupEffect), ' + ') || 'utility';
}

/** The card's FREE payload as one line, in the engine's own wording. */
export function freeDetailText(card: Card): string {
    const clauses = freeClauses(card);
    return clauses.length ? clausesText(clauses) : 'no effect';
}
