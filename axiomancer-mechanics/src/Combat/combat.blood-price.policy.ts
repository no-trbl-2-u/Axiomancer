/**
 * BLOOD PRICE SANDBOX — the witness bot's choices for Blood Price cards
 * (branch sandbox/blood-price-sims only).
 *
 * The greedy witness ranks a Blood Price PAID line by the line's own value
 * estimate (`bloodPriceLineValue`) and drains FREE lines in an order that
 * lets enablers act first. Rules:
 *
 *   - never plays a line it cannot legally play (condition, Curse target,
 *     Global already in play, or a SACRIFICE that would leave < 1 VITAE);
 *   - never pays a SACRIFICE that leaves VITAE at or below the telegraphed
 *     hit (the payment would make that hit lethal);
 *   - powers a PAID line only when its estimate is positive, and never
 *     spends a die on a Curse's PAID line;
 *   - plays every legal, safe Curse and Global on its FREE line, and other
 *     FREE lines unless their estimate is below -3.
 *
 * Library cards never reach these functions: callers check `state.bp` and
 * `isBloodPriceCard` first.
 */

import type { CombatEncounterState } from './combat.encounter.types';
import { BLOOD_PRICE_KIT, projectIncomingThreat } from './combat.engine';
import {
    bloodPriceIllegalReason, bloodPriceLineCost, bloodPriceLineValue, bloodPriceSpec,
} from './combat.blood-price';
import { getCardById } from '../Cards/cards.library';

/** Below this estimate the bot holds a FREE line rather than play it. */
const FREE_LINE_FLOOR = -3;

function safeToPay(state: CombatEncounterState, cost: number): boolean {
    if (cost <= 0) return true;
    const incoming = projectIncomingThreat(state).netDamage;
    return state.player.health - cost > incoming;
}

/** Should the bot spend a die on this card's PAID line now? */
export function bpWantsPaid(state: CombatEncounterState, uid: string): boolean {
    const entry = state.hand.find(h => h.uid === uid);
    const spec = entry ? bloodPriceSpec(entry.cardId) : undefined;
    if (!entry || !spec || spec.curse) return false;
    if (bloodPriceIllegalReason(state, uid, true, BLOOD_PRICE_KIT)) return false;
    if (!safeToPay(state, bloodPriceLineCost(state, uid, true, BLOOD_PRICE_KIT))) return false;
    return bpPaidValue(state, uid) > 0;
}

function bpPaidValue(state: CombatEncounterState, uid: string): number {
    const entry = state.hand.find(h => h.uid === uid);
    const colorMatch = !!entry && getCardById(entry.cardId)?.color !== 'any';
    return bloodPriceLineValue(state, uid, true, BLOOD_PRICE_KIT, colorMatch);
}

/** The greedy rank of a Blood Price card's PAID line (first copy in hand). */
export function bpPaidScore(state: CombatEncounterState, cardId: string): number {
    const entry = state.hand.find(h => h.cardId === cardId);
    return entry ? bpPaidValue(state, entry.uid) : -Infinity;
}

/** Should the bot play this card's FREE line now? */
export function bpWantsFree(state: CombatEncounterState, uid: string): boolean {
    const entry = state.hand.find(h => h.uid === uid);
    const spec = entry ? bloodPriceSpec(entry.cardId) : undefined;
    if (!entry || !spec) return false;
    if (bloodPriceIllegalReason(state, uid, false, BLOOD_PRICE_KIT)) return false;
    if (!safeToPay(state, bloodPriceLineCost(state, uid, false, BLOOD_PRICE_KIT))) return false;
    if (spec.curse || spec.global) return true;
    return bloodPriceLineValue(state, uid, false, BLOOD_PRICE_KIT) >= FREE_LINE_FLOOR;
}

/** FREE drain order: Globals, SACRIFICE modifiers, Curse players, the rest,
 *  Curses last (so a modifier or a Curse player can act on them first). */
export function bpDrainPriority(cardId: string): number {
    const spec = bloodPriceSpec(cardId);
    if (!spec) return 3;
    if (spec.global) return 0;
    if (spec.slot === 'E-04' || spec.slot === 'E-07') return 1;
    if (spec.slot === 'E-05' || spec.slot === 'E-08') return 2;
    if (spec.curse) return 4;
    return 3;
}
