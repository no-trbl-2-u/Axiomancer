/**
 * Spec 25 — Hazard-Pattern Combat: die helpers (§4.2).
 *
 * The rolled tray itself is spec 33's four fixed dice
 * (`combat.upgradeable-dice.ts`). This module keeps the die primitives that
 * model shares: the Reserve and its pips, OVERHEAT, GHOST (floating) dice,
 * the colour law (`combatDieCanPower`), and spend/refresh helpers. The legacy
 * face-bag tray (the draft-era `rollTurnDice` / `TURN_DICE_COUNT` roll and
 * the Spec-25 `rollCombatDice` shim) was deleted with the flag collapse (D7);
 * the bag itself survives only behind the `reroll_spent` card mechanic.
 *
 * Randomness flows through the seedable global RNG singleton (`src/Utils/rng`),
 * so hermetic tests pin rolls via `mockFixedRng` / `setSeed`. Every public roll
 * accepts an explicit `rng: () => number` that defaults to the singleton.
 */

import { getRng } from '../Utils/rng';
import type { Stance } from './types';
import type { CombatDieColor, CombatManaDie } from './combat.encounter.types';

/**
 * THE PATH (owner ruling 2026-09-02) — the highest die-upgrade level the
 * balance harness models. Under spec 33 a level HONES a miss face into a mana
 * face (`honedDieGear`); the ladder saturates at level 4.
 */
export const MAX_DIE_UPGRADE_LEVEL = 4;

const defaultRng = (): number => getRng().random();

/**
 * The legacy die-face bag (Spec 25 §4.2): Heart / Body / Mind / Wild at 1/6
 * each, and X (blocked) at 2/6. Spec 33's rolled tray never uses it; it
 * survives only as the face source of the `reroll_spent` card mechanic
 * (`rerollSpentDice`).
 */
export const COMBAT_DIE_FACES: readonly CombatDieColor[] = Object.freeze([
    'heart', 'body', 'mind', 'wild', 'x', 'x',
]);

/** Rolls a single die face from the legacy bag. */
export function rollCombatDieColor(rng: () => number = defaultRng): CombatDieColor {
    const idx = Math.min(COMBAT_DIE_FACES.length - 1, Math.floor(rng() * COMBAT_DIE_FACES.length));
    return COMBAT_DIE_FACES[idx];
}

const STANCE_FACES: readonly CombatDieColor[] = Object.freeze(['heart', 'body', 'mind']);

/** True when a die color carries a stance for the RPS read (heart/body/mind). */
export function dieHasStance(color: CombatDieColor): boolean {
    return color === 'heart' || color === 'body' || color === 'mind';
}

// ---------------------------------------------------------------------------
// Fate Engine P1 (spec 31 R2) — the RESERVE and its ripening pips
// ---------------------------------------------------------------------------

/** Max dice the Reserve holds. Banking past this burns for Conviction instead. */
export const RESERVE_MAX = 2;
/** Max pips a Reserve die ripens to (+1 per threat phase survived). */
export const RESERVE_PIP_CAP = 2;

/** Ripens every Reserve die +1 pip (cap `RESERVE_PIP_CAP`). Pure. */
export function ripenReserve(reserve: readonly CombatManaDie[]): { reserve: CombatManaDie[]; ripenedIds: string[] } {
    const ripenedIds: string[] = [];
    const next = reserve.map(d => {
        const pips = d.pips ?? 0;
        if (pips >= RESERVE_PIP_CAP) return d;
        ripenedIds.push(d.id);
        return { ...d, pips: pips + 1 };
    });
    return { reserve: next, ripenedIds };
}

// ---------------------------------------------------------------------------
// Phase 32 part 4c — Forge OVERHEAT: pips past RESERVE_PIP_CAP, at a risk
// ---------------------------------------------------------------------------

/** Hard ceiling on an overheated die's pips — even a die that keeps surviving
 *  the gamble stops accepting further pushes here (a finite bookkeeping
 *  bound, mirroring `FLOATING_DICE_CAP`/`MAX_PERMANENT_WILD_DICE`). */
export const OVERHEAT_PIP_CEILING = 4;

/** Probability a pip pushed past `RESERVE_PIP_CAP` busts the targeted die,
 *  per pip attempted (press-your-luck: pushing further compounds the risk —
 *  KB receipt: The Quacks of Quedlinburg's white-chip pot, where drawing one
 *  more chip is always a live choice and the risk is cumulative and legible,
 *  chip by chip — kb:boardgames/the-quacks-of-quedlinburg/rules/overview.okf.md,
 *  src-003, secondary, high). A bust HALVES (floored) the die's pre-push
 *  pips rather than zeroing them — Quacks' own bust cost is partial too
 *  ("must choose points or coins, not both", not a total wipeout of the
 *  pot). */
export const OVERHEAT_BUST_CHANCE = 0.35;

/**
 * The press-your-luck knob the Forge theme was missing (2026-07-10-theme-
 * identity.md §2): a die already AT `RESERVE_PIP_CAP` (safely ripened) can
 * be pushed FURTHER, up to `OVERHEAT_PIP_CEILING`, in exchange for a
 * `OVERHEAT_BUST_CHANCE` risk PER PIP pushed. A die still below the safe cap
 * ripens normally with NO risk — OVERHEAT only prices the overage, never the
 * safe portion `ripenReserve` already grants for free. Downstream pip-cash
 * paths (`PIP_INTENSITY_BONUS`, defend-card pip Guard, `spend_all_pips`) read
 * `die.pips` with no ceiling check today, so a successfully overheated die's
 * extra pips cash exactly like any other pip — no engine change needed there.
 * Pure; RNG is the caller's seeded singleton (same convention as
 * `overheatSpentDie`).
 */
export function overheatReserve(
    reserve: readonly CombatManaDie[],
    rng: () => number = defaultRng,
): { reserve: CombatManaDie[]; ripenedIds: string[]; bustedIds: string[] } {
    const ripenedIds: string[] = [];
    const bustedIds: string[] = [];
    const next = reserve.map(d => {
        const pips = d.pips ?? 0;
        if (pips < RESERVE_PIP_CAP) {
            ripenedIds.push(d.id);
            return { ...d, pips: pips + 1 };
        }
        if (pips >= OVERHEAT_PIP_CEILING) return d;
        if (rng() < OVERHEAT_BUST_CHANCE) {
            bustedIds.push(d.id);
            return { ...d, pips: Math.floor(pips / 2) };
        }
        ripenedIds.push(d.id);
        return { ...d, pips: pips + 1 };
    });
    return { reserve: next, ripenedIds, bustedIds };
}

/**
 * A die the `reroll_spent` card mechanic re-rolls: one you have USED this turn
 * (`spent`/`exhausted`) or a dead `x` face. A still-usable die is LEFT ALONE.
 * GHOST dice (spec 32 v3 §5) NEVER reroll — that invariant is part of their
 * identity.
 */
export function dieIsRerollable(die: CombatManaDie): boolean {
    if (die.floating) return false;
    return die.state === 'spent' || die.state === 'exhausted' || die.color === 'x';
}

/** True when at least one die in the pool would actually be re-rolled. */
export function hasRerollableDice(dice: readonly CombatManaDie[]): boolean {
    return dice.some(dieIsRerollable);
}

/**
 * The `reroll_spent` card mechanic's PARTIAL re-roll: re-rolls each die you've
 * used (`spent`/`exhausted`) or that shows a dead `x` face from the legacy
 * face bag, leaving every still-usable die untouched. Re-rolled dice KEEP
 * their id (so the UI animates the same die object) and still guarantee at
 * least one stance-bearing die across the resulting pool — converting one of
 * the re-rolled dice (never a preserved one) when none qualifies.
 *
 * NOTE (D7 flag collapse, 2026-09-25): this predates spec 33 and rolls the
 * legacy bag, not the die's gear table — a re-rolled die carries no `face`.
 * Press Fate uses the honest spec-33 form (`rerollMissFacesHonest`).
 */
export function rerollSpentDice(
    dice: readonly CombatManaDie[],
    rng: () => number = defaultRng,
): { dice: CombatManaDie[]; rerolledIds: string[] } {
    const rerolledIds: string[] = [];
    const next = dice.map(d => {
        if (!dieIsRerollable(d)) return d;
        rerolledIds.push(d.id);
        const color = rollCombatDieColor(rng);
        return { ...d, color, state: color === 'x' ? ('locked' as const) : ('available' as const) };
    });
    if (rerolledIds.length > 0 && !next.some(d => dieHasStance(d.color))) {
        const lastId = rerolledIds[rerolledIds.length - 1];
        const idx = next.findIndex(d => d.id === lastId);
        const color = STANCE_FACES[Math.min(2, Math.floor(rng() * 3))];
        next[idx] = { ...next[idx], color, state: 'available' };
    }
    return { dice: next, rerolledIds };
}

// ---------------------------------------------------------------------------
// Spec 32 v3 §5 — GHOST dice (the live-tray model)
// ---------------------------------------------------------------------------

/** Hard cap on the floating-die pool. Forging at cap → +1 Conviction instead. */
export const FLOATING_DICE_CAP = 3;

/** Materializes the persistent floating pool into this turn's tray. Ids are
 *  stable (`float-N`) so a die keeps its identity across turns and combats. */
export function materializeFloatingDice(
    colors: readonly ('heart' | 'body' | 'mind' | 'wild')[],
): CombatManaDie[] {
    return colors.slice(0, FLOATING_DICE_CAP).map((color, i) => ({
        id: `float-${i}`, color, state: 'available' as const, temporary: false, floating: true,
    }));
}

/**
 * True if `die` can power a card of `cardColor`: a matching-color die, or the
 * WILD die (powers any color). X is never usable (unless an x-die-interaction
 * card has flipped it to `available`, in which case it acts wild). Mirrors the
 * Hazard `dieCanPower` contract.
 */
export function combatDieCanPower(die: CombatManaDie, cardColor: CombatDieColor): boolean {
    if (die.state !== 'available') return false;
    if (die.color === 'x') return false;
    if (cardColor === 'wild') return true;          // wild cards accept any usable die
    return die.color === 'wild' || die.color === cardColor;
}

/** All dice currently spendable for a card of `cardColor`. */
export function availableDiceFor(
    dice: readonly CombatManaDie[],
    cardColor: CombatDieColor,
): CombatManaDie[] {
    return dice.filter(d => combatDieCanPower(d, cardColor));
}

/** Count of non-X dice still available (used by Reserve-bonus / sim policy). */
export function availableDieCount(dice: readonly CombatManaDie[]): number {
    return dice.filter(d => d.state === 'available' && d.color !== 'x').length;
}

/** Sets the named dice to `spent`. Returns a new dice array. */
export function spendDice(dice: readonly CombatManaDie[], dieIds: readonly string[]): CombatManaDie[] {
    const ids = new Set(dieIds);
    return dice.map(d => (ids.has(d.id) ? { ...d, state: 'spent' as const } : d));
}

/**
 * Refreshes one spent die of `color` back to `available` (the self-reinforcing
 * status loop, §4.7). Wild dice are refreshed in preference to leaving a
 * matching colored die spent only when no same-color spent die exists. Returns
 * the same array reference (no refresh) when nothing matches.
 */
export function refreshOneDie(
    dice: readonly CombatManaDie[],
    color: CombatDieColor,
): { dice: CombatManaDie[]; refreshedId: string | null } {
    // Prefer an exact-color spent die; fall back to a spent wild die.
    const exact = dice.find(d => d.state === 'spent' && d.color === color);
    const target = exact ?? dice.find(d => d.state === 'spent' && d.color === 'wild');
    if (!target) return { dice: dice.slice(), refreshedId: null };
    return {
        dice: dice.map(d => (d.id === target.id ? { ...d, state: 'available' as const } : d)),
        refreshedId: target.id,
    };
}

/** Maps a player card stance (heart/body/mind) to its die color. */
export function stanceToDieColor(stance: Stance): CombatDieColor {
    return stance;
}

// ---------------------------------------------------------------------------
// Master Spec §4 — wild-die permanent-growth mechanic
// ---------------------------------------------------------------------------

/**
 * Hard cap on `CombatEncounterState.permanentWildDice` (the
 * `grant_permanent_wild_die` card mechanic). Under spec 33 any non-zero pool
 * materializes as the single gold+lead pair (`rollGoldLeadPair`).
 */
export const MAX_PERMANENT_WILD_DICE = 3;
