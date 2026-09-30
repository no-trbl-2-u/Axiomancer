/**
 * CARD UPGRADES (2026-09-02) — the Slay the Spire progression axis.
 *
 * OWNER RULING: "Players should also be able to upgrade their cards (See Slay
 * the Spire)." One of the six progression axes. A card you own can be upgraded
 * ONCE, producing a copy with id `<id>+` and name `<name>+`.
 *
 * The upgraded copy is computed, never hand-authored a second time:
 *
 *   1. If the base card carries an authored {@link CardUpgrade} patch
 *      (`Card.upgrade`), that patch IS the upgrade — the default rule is not
 *      layered underneath it.
 *   2. Otherwise the DEFAULT RULE below fires, so all ~124 library cards get a
 *      sane `+` for free and a rework of a base card carries forward into it.
 *
 * ─── THE DEFAULT RULE (exact numbers) ───────────────────────────────────────
 *
 * Every number a card prints falls into one of two buckets:
 *
 *   MAGNITUDE  n -> n + max(2, round(n * 0.40))     (+40%, at least +2)
 *     deal.amount, guard.amount, and the rider fields damage / guard.
 *     Worked: 6->8, 7->10, 8->11, 12->17, 14->20, 22->31, 45->63.
 *
 *   DOT INTENSITY  intensity -> intensity + 1, clamped to MAX_EFFECT_INTENSITY
 *     Every `combatEffects` entry and every `applyEffect` rider payload.
 *     DURATION is untouched by default (an authored patch may raise it): +1
 *     intensity is the StS-shaped step, and moving both doubles a DoT card.
 *
 * NOTHING ELSE MOVES. In particular the default rule NEVER raises a
 * SELF-INFLICTED DEBUFF (`appliedTo: 'self'` / `to: 'self'` on a `debuff_*`
 * effect): that is a cost wearing an effect's clothes. The `buff_` /
 * `debuff_` id prefix is exhaustive across both effect libraries.
 *
 * CURSES (`theme: 'curse'`) get NO numeric change at all: every number on a
 * curse is a price you pay, so there is nothing a `+` could honestly raise.
 * They still upgrade structurally (the `+` id/name) so the caller never has to
 * special-case them. Slay the Spire likewise makes curses unupgradable.
 *
 * ─── paidSummary ────────────────────────────────────────────────────────────
 *
 * The repo's one surviving text law is that a printed number IS the applied
 * number (`src/Combat/e2e/paid-summary-honesty.engine.test.ts`). `paidText`
 * generates the face from `combatEffects` + `specialMechanics` only, so:
 * whenever an upgrade changes either of those payloads, `paidSummary` is
 * CLEARED and the face falls back to the generated (therefore honest) text. An
 * upgrade that only touches the FREE line or the synergy rider keeps the
 * authored sentence, because `paidText` never read those numbers. An authored
 * patch may supply its own `paidSummary`, and then it owns the honesty.
 *
 * ─── KNOWN HAZARD: oath / hex ───────────────────────────────────────────────
 *
 * An `oath` / `hex` passive is hooked in the combat engine BY LITERAL CARD ID
 * (`zoneHas(state, 'every-stone-an-oath')`), so an upgraded `...-oath+` would
 * find no hook and lose its passive entirely. Callers wiring upgrades into the
 * engine must resolve hooks through {@link baseCardId}. Not fixed here: the
 * engine is outside this module's ownership.
 *
 * This file is pure. `upgradeCard` deep-copies before it touches anything and
 * never mutates its input.
 */

import { MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import { getCardById } from './cards.library';
import type {
    Card,
    CardCombatEffects,
    CardRider,
    CardRiderUpgrade,
    CardSpecialMechanic,
    CardUpgrade,
    UpgradableRiderField,
} from './types';

// ─── Constants (the exact default-rule numbers, in one place) ───────────────

/** The suffix appended to an upgraded card's id and name. */
export const UPGRADE_SUFFIX = '+';
/** MAGNITUDE bucket: +40%, at least +2. */
export const UPGRADE_MAGNITUDE_PCT = 0.4;
export const UPGRADE_MAGNITUDE_MIN = 2;
/** DOT bucket: +1 intensity (duration untouched). */
export const UPGRADE_INTENSITY_STEP = 1;

// ─── The buckets ────────────────────────────────────────────────────────────

/** +40%, at least +2. Damage and walls — anything on the scale ladder. */
function magnitude(n: number): number {
    if (!(n > 0)) return n;
    return n + Math.max(UPGRADE_MAGNITUDE_MIN, Math.round(n * UPGRADE_MAGNITUDE_PCT));
}

/** +1 intensity, never above MAX_EFFECT_INTENSITY (30). */
function intensity(n: number): number {
    return Math.min(MAX_EFFECT_INTENSITY, n + UPGRADE_INTENSITY_STEP);
}

/** Clamp an intensity from ANY source (default rule or authored patch). */
function capIntensity(n: number): number {
    return Math.min(MAX_EFFECT_INTENSITY, n);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Structural deep copy. Cards are JSON-shaped data (no functions, no dates),
 *  but this walks the structure rather than round-tripping so `undefined`
 *  members and key order survive exactly. */
function deepCopy<T>(value: T): T {
    if (Array.isArray(value)) return value.map(deepCopy) as unknown as T;
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = deepCopy(v);
        }
        return out as T;
    }
    return value;
}

/** A self-inflicted `debuff_*` is a printed COST, not a payload to raise.
 *  The `buff_` / `debuff_` id prefix is exhaustive across both effect
 *  libraries (`src/Effects/{buffs,debuffs}.library.json`). */
function isSelfCost(effectId: string, toSelf: boolean): boolean {
    return toSelf && effectId.startsWith('debuff_');
}

/** `<id>+` -> `<id>`. Idempotent for a base id. Callers that key engine
 *  behaviour off a literal card id (oath/hex passives, WOUND_CARD_ID, deck
 *  recipes) must resolve through this. */
export function baseCardId(id: string): string {
    return id.endsWith(UPGRADE_SUFFIX) ? id.slice(0, -UPGRADE_SUFFIX.length) : id;
}

/** True for an upgraded card's id (`'some-card+'`). */
export function isUpgradedCardId(id: string): boolean {
    return id.endsWith(UPGRADE_SUFFIX);
}

// ─── The default rule: riders ───────────────────────────────────────────────

const RIDER_MAGNITUDE_FIELDS = ['damage', 'guard'] as const;

/** Raise every payoff field of a rider IN PLACE (the rider is already a copy). */
function upgradeRiderDefault(rider: CardRider): void {
    for (const f of RIDER_MAGNITUDE_FIELDS) {
        if (rider[f] !== undefined) rider[f] = magnitude(rider[f] as number);
    }
    const ae = rider.applyEffect;
    if (ae && !isSelfCost(ae.effectId, ae.to === 'self')) {
        ae.intensity = intensity(ae.intensity ?? 1);
    }
}

// ─── The default rule: mechanics ────────────────────────────────────────────

/** Raise one mechanic IN PLACE. */
function upgradeMechanicDefault(m: CardSpecialMechanic): void {
    m.amount = magnitude(m.amount);
}

/** Raise one `combatEffects` entry IN PLACE. */
function upgradeCombatEffectDefault(ce: CardCombatEffects): void {
    if (isSelfCost(ce.effectId, ce.appliedTo === 'self')) return;
    ce.intensity = intensity(ce.intensity ?? 1);
}

// ─── The authored patch ─────────────────────────────────────────────────────

/** Deltas are non-negative by construction: a `+` never subtracts. */
function delta(n: number | undefined): number {
    return n === undefined ? 0 : Math.max(0, n);
}

function applyRiderPatch(rider: CardRider, patch: CardRiderUpgrade): void {
    for (const key of Object.keys(patch) as (keyof CardRiderUpgrade)[]) {
        if (key === 'applyEffect') continue;
        const d = delta(patch[key] as number | undefined);
        if (d === 0) continue;
        const f = key as UpgradableRiderField;
        rider[f] = (rider[f] ?? 0) + d;
    }
    if (patch.applyEffect && rider.applyEffect) {
        const ae = rider.applyEffect;
        const di = delta(patch.applyEffect.intensity);
        const dd = delta(patch.applyEffect.duration);
        if (di) ae.intensity = capIntensity((ae.intensity ?? 1) + di);
        if (dd && ae.duration !== undefined) ae.duration = ae.duration + dd;
    }
}

function applyMechanicFieldPatch(
    m: CardSpecialMechanic,
    fields: Partial<Record<string, number>>,
): void {
    // A mechanic is a closed union of numeric-and-boolean data; the patch
    // addresses its fields by name, so this one bridge cast is the honest
    // shape. Only fields the mechanic ACTUALLY has are touched.
    const bag = m as unknown as Record<string, unknown>;
    for (const [key, raw] of Object.entries(fields)) {
        const d = delta(raw);
        if (d === 0) continue;
        const current = bag[key];
        if (typeof current !== 'number') continue;
        bag[key] = key === 'intensity' ? capIntensity(current + d) : current + d;
    }
}

function applyPatch(card: Card, patch: CardUpgrade): void {
    for (const mp of patch.mechanics ?? []) {
        let seen = 0;
        for (const m of card.specialMechanics ?? []) {
            if (m.kind !== mp.kind) continue;
            const here = seen++;
            if (mp.index !== undefined && mp.index !== here) continue;
            if (mp.fields) applyMechanicFieldPatch(m, mp.fields);
        }
    }
    for (const ep of patch.effects ?? []) {
        for (const ce of card.combatEffects ?? []) {
            if (ep.effectId !== undefined && ce.effectId !== ep.effectId) continue;
            const di = delta(ep.intensity);
            const dd = delta(ep.duration);
            if (di) ce.intensity = capIntensity((ce.intensity ?? 1) + di);
            if (dd && ce.duration !== undefined) ce.duration = ce.duration + dd;
            else if (dd) ce.duration = dd;
        }
    }
    if (patch.free) {
        card.free = card.free ?? {};
        applyRiderPatch(card.free, patch.free);
    }
    if (patch.synergy && card.synergy?.rider) applyRiderPatch(card.synergy.rider, patch.synergy);
}

// ─── The default rule, whole-card ───────────────────────────────────────────

function applyDefaultRule(card: Card): void {
    // Every number on a curse is a price. There is nothing a `+` can raise.
    if (card.theme === 'curse') return;

    for (const ce of card.combatEffects ?? []) upgradeCombatEffectDefault(ce);
    for (const m of card.specialMechanics ?? []) upgradeMechanicDefault(m);
    if (card.free) upgradeRiderDefault(card.free);
    if (card.synergy?.rider) upgradeRiderDefault(card.synergy.rider);
}

// ─── The public verb ────────────────────────────────────────────────────────

/** The payload `paidText` reads. If this changed, the authored face is stale. */
function paidPayloadSignature(card: Card): string {
    return JSON.stringify([card.combatEffects ?? null, card.specialMechanics ?? null]);
}

/**
 * The upgraded copy of a card: `<id>+` / `<name>+`, numbers raised by the
 * card's authored {@link CardUpgrade} patch if it has one, otherwise by the
 * default rule documented at the top of this file.
 *
 * PURE: the input card (and every object reachable from it) is untouched — the
 * whole card is deep-copied first.
 *
 * Upgrading an already-upgraded card is not a supported operation (upgrades
 * are one level, as in Slay the Spire); it would produce `<id>++`.
 */
export function upgradeCard(card: Card): Card {
    const up = deepCopy(card);
    const beforePaid = paidPayloadSignature(up);
    const patch = card.upgrade;

    if (patch) applyPatch(up, patch);
    else applyDefaultRule(up);

    up.id = `${card.id}${UPGRADE_SUFFIX}`;
    up.name = patch?.name ?? `${card.name}${UPGRADE_SUFFIX}`;
    if (patch?.description) up.description = patch.description;

    // P0-truth: an authored face that no longer names the applied numbers is a
    // lie. Clear it and let the generated text speak.
    const paidChanged = paidPayloadSignature(up) !== beforePaid;
    if (patch?.paidSummary) up.paidSummary = patch.paidSummary;
    else if (paidChanged && up.paidSummary !== undefined) delete up.paidSummary;

    // `persistentEffect` describes an ENGINE-HOOKED passive (see the oath/hex
    // hazard note at the top): no data patch can change what it says, so it is
    // never auto-cleared — only an authored patch may rewrite it.
    if (patch?.persistentEffect) up.persistentEffect = patch.persistentEffect;

    // The upgraded copy carries no patch of its own: one upgrade level.
    delete up.upgrade;
    return up;
}

/**
 * Resolve an upgraded card id (`'some-card+'`) to its computed upgraded card.
 * Accepts the base id too, so a caller that already stripped the suffix still
 * gets the `+` copy. Returns `undefined` when the base card does not exist.
 *
 * NOT wired into `cards.library.ts`'s `getCardById` here — the library owner
 * does that.
 */
export function getUpgradedCardById(id: string): Card | undefined {
    const base = getCardById(baseCardId(id));
    return base ? upgradeCard(base) : undefined;
}
