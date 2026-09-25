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
 * Every number a card prints falls into one of five buckets:
 *
 *   MAGNITUDE  n -> n + max(2, round(n * 0.40))     (+40%, at least +2)
 *     deal.amount, guard.amount, barrier.amount, sway.amount, riposte.damage,
 *     riposte.reduce, and the rider fields damage / guard / barrier / healHp /
 *     sway.  Worked: 6->8, 7->10, 8->11, 12->17, 14->20, 22->31, 45->63.
 *     Roughly one rung up the scale ladder (`plan/2026-09-02-card-authoring
 *     -brief.md` §"The scale ladder"), which is the intended feel of a `+`.
 *
 *   RATE       n -> n + max(1, round(n * 0.25))     (+25%, at least +1)
 *     The per-Soul / per-rung / per-pip payoff rates and the small combat-long
 *     scalers: reap_all.burstPerSoul, turnabout.burstPerRung,
 *     spend_all_pips.guardPerPip, rupture.fuelPerPip, rupture.fuelPerOmenHit,
 *     recoil_x.poisonPerX, overkill.conviction, overkill.souls, wrath.amount,
 *     chain.amount, and the rider fields wrath / chain / ruptureMarks /
 *     intensityPerPip.  Worked: 2->3, 4->5, 8->10, 12->15.
 *     These multiply against an UNCAPPED resource, so they move at half the
 *     magnitude rate — +40% on a per-Soul burst is a +40% on the whole dump.
 *
 *   COUNT      n -> n + 1
 *     premise.count, soul_gain.count, consume_affliction.souls, stagger.rungs,
 *     foretell.count, reprise.count, grant_pip.count, overheat.pips,
 *     extend_dots.turns, convert_dots.bonusIntensity, boost_all_dots.intensity,
 *     flay.stacks, replay_last.times, and the rider fields drawCards /
 *     cleanse / souls / premises / foretell / millCards / stagger / pips /
 *     conviction / flay / bonusIntensity.
 *
 *   DOT INTENSITY  intensity -> intensity + 1, clamped to MAX_EFFECT_INTENSITY
 *     Every `combatEffects` entry and every `applyEffect` rider payload.
 *     DURATION is untouched by default (an authored patch may raise it): +1
 *     intensity is the StS-shaped step, and moving both doubles a DoT card.
 *
 *   FRACTION   n -> min(1, round(n * 1.25 * 100) / 100)   (+25%, 2 dp, cap 1)
 *     siphon.pct, execute.atPct, overkill.healPct, rupture.bonusPct.
 *     Worked: 0.35->0.44, 0.45->0.56, 0.50->0.63, 1->1 (already maximal).
 *
 * NOTHING ELSE MOVES. In particular the default rule NEVER raises:
 *   - a printed COST: recoil.hp, recoil_x.min, omen.anteConviction, reap.cost,
 *     immolate.count (cards burned), fate.recoilHp, the `free`-rider `recoil`;
 *   - a GATE you must reach: peroration.at / concedeAt, threshold.count, the
 *     synergy state predicates (requiem.n, flow.minPriorSpells, …);
 *   - a "per N spent" DIVISOR: spend_premises.markPer / drawPer, overkill.per,
 *     spend_all_pips.markPer — raising those pays out LESS;
 *   - deal.hits — a second hit multiplies every per-instance rider (BLEED,
 *     FLAY, WRATH) and is an authored decision, not a default one;
 *   - a SELF-INFLICTED DEBUFF (`appliedTo: 'self'` / `to: 'self'` on a
 *     `debuff_*` effect): that is a cost wearing an effect's clothes. The
 *     `buff_` / `debuff_` id prefix is exhaustive across both effect libraries.
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
 * upgrade that only touches the FREE line or a condition rider keeps the
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
/** RATE bucket: +25%, at least +1. */
export const UPGRADE_RATE_PCT = 0.25;
export const UPGRADE_RATE_MIN = 1;
/** COUNT bucket: +1. */
export const UPGRADE_COUNT_STEP = 1;
/** DOT bucket: +1 intensity (duration untouched). */
export const UPGRADE_INTENSITY_STEP = 1;
/** FRACTION bucket: ×1.25, rounded to 2 dp, capped at 1. */
export const UPGRADE_FRACTION_MUL = 1.25;

// ─── The five buckets ───────────────────────────────────────────────────────

/** +40%, at least +2. Damage, walls, PLEA — anything on the scale ladder. */
function magnitude(n: number): number {
    if (!(n > 0)) return n;
    return n + Math.max(UPGRADE_MAGNITUDE_MIN, Math.round(n * UPGRADE_MAGNITUDE_PCT));
}

/** +25%, at least +1. Payoff rates that multiply an uncapped resource. */
function rate(n: number): number {
    if (!(n > 0)) return n;
    return n + Math.max(UPGRADE_RATE_MIN, Math.round(n * UPGRADE_RATE_PCT));
}

/** +1. Draws, cleanses, Souls, Charges, rungs, ticks. */
function count(n: number): number {
    return n > 0 ? n + UPGRADE_COUNT_STEP : n;
}

/** +1 intensity, never above MAX_EFFECT_INTENSITY (30). */
function intensity(n: number): number {
    return Math.min(MAX_EFFECT_INTENSITY, n + UPGRADE_INTENSITY_STEP);
}

/** ×1.25, 2 dp, capped at 1 (these are all fractions of something). */
function fraction(n: number): number {
    if (!(n > 0)) return n;
    return Math.min(1, Math.round(n * UPGRADE_FRACTION_MUL * 100) / 100);
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

const RIDER_MAGNITUDE_FIELDS = ['damage', 'guard', 'barrier', 'healHp', 'sway'] as const;
const RIDER_RATE_FIELDS = ['wrath', 'chain', 'ruptureMarks', 'intensityPerPip'] as const;
const RIDER_COUNT_FIELDS = [
    'drawCards', 'cleanse', 'souls', 'premises', 'foretell', 'millCards',
    'stagger', 'pips', 'conviction', 'flay', 'bonusIntensity',
] as const;

/** Raise every payoff field of a rider IN PLACE (the rider is already a copy).
 *  `recoil` (a blood price) and `bonusDuration` are deliberately untouched. */
function upgradeRiderDefault(rider: CardRider): void {
    for (const f of RIDER_MAGNITUDE_FIELDS) {
        if (rider[f] !== undefined) rider[f] = magnitude(rider[f] as number);
    }
    for (const f of RIDER_RATE_FIELDS) {
        if (rider[f] !== undefined) rider[f] = rate(rider[f] as number);
    }
    for (const f of RIDER_COUNT_FIELDS) {
        if (rider[f] !== undefined) rider[f] = count(rider[f] as number);
    }
    const ae = rider.applyEffect;
    if (ae && !isSelfCost(ae.effectId, ae.to === 'self')) {
        ae.intensity = intensity(ae.intensity ?? 1);
    }
}

// ─── The default rule: mechanics ────────────────────────────────────────────

/** Raise one mechanic IN PLACE. Costs, gates and divisors are skipped — see
 *  the "NOTHING ELSE MOVES" list in the file header. */
function upgradeMechanicDefault(m: CardSpecialMechanic): void {
    switch (m.kind) {
        // MAGNITUDE — the scale-ladder numbers.
        case 'deal':
            m.amount = magnitude(m.amount);
            break; // `hits` is an authored decision, never a default one.
        case 'guard':
        case 'barrier':
        case 'sway':
            m.amount = magnitude(m.amount);
            break;
        case 'riposte':
            m.damage = magnitude(m.damage);
            m.reduce = magnitude(m.reduce);
            break;

        // RATE — payoff rates and the combat-long scalers.
        case 'wrath':
        case 'chain':
            m.amount = rate(m.amount);
            break;
        case 'reap_all':
            m.burstPerSoul = rate(m.burstPerSoul);
            break;
        case 'turnabout':
            m.burstPerRung = rate(m.burstPerRung);
            break;
        case 'spend_all_pips':
            // `markPer` is a divisor — raising it pays out LESS.
            if (m.guardPerPip !== undefined) m.guardPerPip = rate(m.guardPerPip);
            break;
        case 'recoil_x':
            // `min` is the floor of a price the player chooses; only the
            // payoff rate moves.
            m.poisonPerX = rate(m.poisonPerX);
            break;
        case 'overkill':
            // `per` is a divisor.
            if (m.conviction !== undefined) m.conviction = rate(m.conviction);
            if (m.souls !== undefined) m.souls = rate(m.souls);
            if (m.healPct !== undefined) m.healPct = fraction(m.healPct);
            break;
        case 'rupture':
            if (m.bonusPct !== undefined) m.bonusPct = fraction(m.bonusPct);
            if (m.fuelPerPip !== undefined) m.fuelPerPip = rate(m.fuelPerPip);
            if (m.fuelPerOmenHit !== undefined) m.fuelPerOmenHit = rate(m.fuelPerOmenHit);
            break;

        // FRACTION.
        case 'siphon':
            m.pct = fraction(m.pct);
            break;
        case 'execute':
            m.atPct = fraction(m.atPct);
            break;

        // COUNT.
        case 'premise':
        case 'soul_gain':
        case 'foretell':
        case 'reprise':
            m.count = count(m.count);
            break;
        case 'grant_pip':
            m.count = count(m.count);
            if (m.overflow) upgradeRiderDefault(m.overflow);
            break;
        case 'overheat':
            m.pips = count(m.pips);
            break;
        case 'stagger':
            m.rungs = count(m.rungs);
            break;
        case 'flay':
            m.stacks = count(m.stacks);
            break;
        case 'extend_dots':
            m.turns = count(m.turns);
            break;
        case 'convert_dots':
            m.bonusIntensity = count(m.bonusIntensity);
            break;
        case 'boost_all_dots':
            m.intensity = intensity(m.intensity);
            break;
        case 'consume_affliction':
            m.souls = count(m.souls);
            break;
        case 'replay_last':
            m.times = count(m.times);
            break;

        // RIDER CARRIERS — the price/gate stays, the payoff grows.
        case 'rider':
            upgradeRiderDefault(m.rider);
            break;
        case 'omen':
            // `anteConviction` is paid up front and `maxWindow` trades payoff
            // for tries: only the payoff moves.
            upgradeRiderDefault(m.rider);
            break;
        case 'peroration':
            // `at` / `concedeAt` are the thresholds you argue toward.
            upgradeRiderDefault(m.rider);
            break;
        case 'reap':
            // `cost` is Souls spent.
            if (m.rider) upgradeRiderDefault(m.rider);
            break;
        case 'immolate':
            // `count` is the pyre's fuel — a cost.
            upgradeRiderDefault(m.rider);
            break;

        // Nothing numeric to raise, or every number is a cost/divisor.
        case 'strip_random_buff':
        case 'befriend_attempt':
        case 'reroll_spent':
        case 'refresh_die':
        case 'convert_die_color':
        case 'create_temporary_die':
        case 'bank_spent_die':
        case 'forge_floating_die':
        case 'float_x_die':
        case 'lock_stance':
        case 'spend_premises':
        case 'recoil':
        case 'echo':
        case 'echo_next_spell':
        case 'conjure_card':
        case 'purge_self':
        case 'twin':
            break;
    }
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

/** The rider a mechanic carries, if any (patch + default share this map). */
function mechanicRider(m: CardSpecialMechanic): CardRider | undefined {
    switch (m.kind) {
        case 'rider':
        case 'omen':
        case 'peroration':
        case 'immolate':
            return m.rider;
        case 'reap':
            return m.rider;
        case 'grant_pip':
            return m.overflow;
        default:
            return undefined;
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
        if (key === 'pierce') {
            bag.pierce = true; // a flag flip, not an addition
            continue;
        }
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
            const rider = mechanicRider(m);
            if (mp.rider && rider) applyRiderPatch(rider, mp.rider);
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
    if (patch.threshold && card.threshold) applyRiderPatch(card.threshold.rider, patch.threshold);
    if (patch.dieBonus && card.dieBonus) applyRiderPatch(card.dieBonus.rider, patch.dieBonus);
    if (patch.fate && card.fate) applyRiderPatch(card.fate.rider, patch.fate);
    if (patch.fallen && card.fallen) applyRiderPatch(card.fallen.rider, patch.fallen);
    if (patch.synergy && card.synergy?.rider) applyRiderPatch(card.synergy.rider, patch.synergy);
}

// ─── The default rule, whole-card ───────────────────────────────────────────

function applyDefaultRule(card: Card): void {
    // Every number on a curse is a price. There is nothing a `+` can raise.
    if (card.theme === 'curse') return;

    for (const ce of card.combatEffects ?? []) upgradeCombatEffectDefault(ce);
    for (const m of card.specialMechanics ?? []) upgradeMechanicDefault(m);
    if (card.free) upgradeRiderDefault(card.free);
    if (card.threshold) upgradeRiderDefault(card.threshold.rider);
    if (card.dieBonus) upgradeRiderDefault(card.dieBonus.rider);
    if (card.fate) upgradeRiderDefault(card.fate.rider);
    if (card.fallen) upgradeRiderDefault(card.fallen.rider);
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
