/**
 * Spec 25 — Hazard-Pattern Combat: stance dice (§4.2).
 *
 * Adapts the Hazard die state-machine (`src/World/Hazard/hazard.engine`
 * patterns) to the combat stance economy. Spec 25's original model rolled four
 * dice at combat start (`COMBAT_DICE_COUNT`, kept for the shim); since the
 * 2026-07-09 dice-law rework the live tray is `TURN_DICE_COUNT` dice rolled
 * fresh every turn. Dice persist as board objects; spent dice stay spent (no auto-reset between threat phases —
 * the same doctrine as Hazard). Card effects and the self-reinforcing status
 * loop are the only normal ways to reclaim a spent die.
 *
 * Randomness flows through the seedable global RNG singleton (`src/Utils/rng`),
 * exactly like the rest of the combat/cards/effects engine, so hermetic tests
 * pin rolls via `mockFixedRng` / `setSeed` and the Monte-Carlo sim is
 * reproducible. Every public roll accepts an explicit `rng: () => number`
 * (Spec 25 §9) that defaults to the singleton.
 */

import { getRng } from '../Utils/rng';
import type { Stance } from './types';
import type { CombatDieColor, CombatManaDie } from './combat.encounter.types';

/** Legacy: dice rolled once at combat start (Spec 25). Kept for the shim. */
export const COMBAT_DICE_COUNT = 4;

/** Dice-law rework (2026-07-09) — dice rolled fresh at the start of EVERY turn.
 *  The player drafts 1 of 3; every unused die converts to Conviction tokens
 *  (wild = 2, colored = 1, X = 0). */
export const TURN_DICE_COUNT = 3;

/**
 * The die-face bag (Spec 25 §4.2): Heart / Body / Mind / Wild at 1/6 each, and
 * X (blocked) at 2/6. Wild powers any color; X powers nothing unless a card
 * enables X-die interaction.
 */
export const COMBAT_DIE_FACES: readonly CombatDieColor[] = Object.freeze([
    'heart', 'body', 'mind', 'wild', 'x', 'x',
]);

/**
 * THE PATH (owner ruling 2026-09-02) — DIE UPGRADES, one of the six axes a
 * player's power actually grows along. "Players will have the ability to
 * upgrade the dice (so it shows more mana faces but will be expensive)."
 *
 * An upgraded die trades dead X faces for live ones, then GROWS faces. The
 * ladder is deliberately in two halves because the fiction is:
 *
 *   level 0 — 6 faces: 3 stance, 1 wild, 2 dead  (the base die)
 *   level 1 — 6 faces: 3 stance, 2 wild, 1 dead
 *   level 2 — 6 faces: 3 stance, 3 wild, 0 dead  (never rolls dead again)
 *   level 3 — 7 faces: 3 stance, 4 wild
 *   level 4 — 8 faces: 3 stance, 5 wild          (the honed ceiling)
 *
 * BE HONEST ABOUT THE CURVE. Levels 0-2 are the big ones: they delete the dead
 * face, which is what stops a turn from having no PAID play at all. Levels 3-4
 * buy FLEXIBILITY, not reads — a wild face powers any colour but carries no
 * stance, so it never wins the RPS read (`dieHasStance`, `resolveRead`). Per-
 * face powering strength (wild 2, stance 1, dead 0) still rises at every step
 * — 0.83 / 1.17 / 1.50 / 1.57 / 1.63 — but the last two steps are small, and
 * under the roll-N-draft-ONE law they buy selection rather than extra plays.
 * The ladder is monotone; it is not linear, and no test should pretend it is.
 *
 * The product's full die-gear rail (`UpgradeableDieGear`, HONE / TEMPER, spec
 * 33) is the shipping expression of this and is flag-gated. This bag is the
 * ENGINE-LEVEL knob the same idea reduces to, so the balance harness can model
 * the progression without flipping an unrelated product flag.
 */
export const COMBAT_DIE_FACES_BY_UPGRADE: readonly (readonly CombatDieColor[])[] = Object.freeze([
    Object.freeze(['heart', 'body', 'mind', 'wild', 'x', 'x'] as CombatDieColor[]),
    Object.freeze(['heart', 'body', 'mind', 'wild', 'wild', 'x'] as CombatDieColor[]),
    Object.freeze(['heart', 'body', 'mind', 'wild', 'wild', 'wild'] as CombatDieColor[]),
    Object.freeze(['heart', 'body', 'mind', 'wild', 'wild', 'wild', 'wild'] as CombatDieColor[]),
    Object.freeze(['heart', 'body', 'mind', 'wild', 'wild', 'wild', 'wild', 'wild'] as CombatDieColor[]),
]);

/** The highest authored die-upgrade level. */
export const MAX_DIE_UPGRADE_LEVEL = COMBAT_DIE_FACES_BY_UPGRADE.length - 1;

/** The face bag for a given upgrade level (clamped to what is authored). */
export function dieFacesForUpgrade(level = 0): readonly CombatDieColor[] {
    const i = Math.max(0, Math.min(MAX_DIE_UPGRADE_LEVEL, Math.floor(level)));
    return COMBAT_DIE_FACES_BY_UPGRADE[i];
}

const defaultRng = (): number => getRng().random();

/** Rolls a single die face from the bag for `upgradeLevel` (default: base). */
export function rollCombatDieColor(
    rng: () => number = defaultRng,
    upgradeLevel = 0,
): CombatDieColor {
    const faces = dieFacesForUpgrade(upgradeLevel);
    const idx = Math.min(faces.length - 1, Math.floor(rng() * faces.length));
    return faces[idx];
}

/** Rolls the opening pool of `count` stance dice. */
export function rollCombatDice(
    count: number = COMBAT_DICE_COUNT,
    rng: () => number = defaultRng,
): CombatManaDie[] {
    const dice: CombatManaDie[] = [];
    for (let i = 0; i < count; i++) {
        const color = rollCombatDieColor(rng);
        dice.push({
            id: `die-${i}`,
            color,
            // X faces start locked (need a card to enable); all others available.
            state: color === 'x' ? 'locked' : 'available',
            temporary: false,
        });
    }
    return dice;
}

/**
 * Rolls THIS TURN's draft pool. Ids are turn-scoped (`t{turn}-d{n}`) so the UI
 * can animate fresh dice each turn. X faces start `locked` (a drafted X can't
 * power a card); colored/wild start `available`.
 *
 * Dice-law rework (2026-07-09): the roll is HONEST — no stance-bearing-die
 * guarantee. A colorless roll is a pure token turn (every unused die still
 * banks Conviction), not a rigged reroll.
 */
const STANCE_FACES: readonly CombatDieColor[] = Object.freeze(['heart', 'body', 'mind']);

export function rollTurnDice(
    turn: number,
    count: number = TURN_DICE_COUNT,
    rng: () => number = defaultRng,
    /** THE PATH — die-upgrade level; raises the share of live faces. */
    upgradeLevel = 0,
): CombatManaDie[] {
    const dice: CombatManaDie[] = [];
    for (let i = 0; i < count; i++) {
        const color = rollCombatDieColor(rng, upgradeLevel);
        dice.push({
            id: `t${turn}-d${i}`,
            color,
            state: color === 'x' ? 'locked' : 'available',
            temporary: false,
        });
    }
    return dice;
}

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
 * `rerollSpentDice`).
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
 * A die Press Fate (the `reroll` signature) re-rolls: one you have USED this turn
 * (`spent`/`exhausted`) or a dead `x` face that can't power anything. A still-
 * usable die — an `available` colored/wild die — is LEFT ALONE. GHOST dice
 * (spec 32 v3 §5) NEVER reroll — that invariant is part of their identity.
 */
export function dieIsRerollable(die: CombatManaDie): boolean {
    if (die.floating) return false;
    return die.state === 'spent' || die.state === 'exhausted' || die.color === 'x';
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

/** True when at least one die in the pool would actually be re-rolled. */
export function hasRerollableDice(dice: readonly CombatManaDie[]): boolean {
    return dice.some(dieIsRerollable);
}

/**
 * Spec 26b §4 — Press Fate PARTIAL re-roll. Bends fate on the bad dice only:
 * re-rolls each die you've used (`spent`/`exhausted`) or that shows a dead `x`
 * face, and leaves every still-usable die untouched. Re-rolled dice get a fresh
 * color and reset state (X → `locked`, else `available`) while KEEPING their id
 * (so the UI animates the same die object). Unlike `rollTurnDice` (honest since
 * the 2026-07-09 rework), still guarantees at least one stance-bearing die
 * across the resulting pool — converting one of the re-rolled dice (never a
 * preserved one) when none qualifies.
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
 * Hard cap on `CombatEncounterState.permanentWildDice`. At cap a turn's draft
 * is `TURN_DICE_COUNT` base dice + `MAX_PERMANENT_WILD_DICE` wild + `MAX_PERMANENT_WILD_DICE`
 * dead — a visible, thematic "fate pushes back" cost rather than an invisible
 * probability tilt (§4.3). Every permanent Wild die is granted alongside one
 * permanent dead (`x`, locked) die by the `grant_permanent_wild_die` card
 * special mechanic (combat-engine owned).
 */
export const MAX_PERMANENT_WILD_DICE = 3;

/**
 * Rolls the permanent bonus dice appended to a turn's draft pool once the
 * player has grown the wild-die pool (Master Spec §4.1). `wildCount`/`deadCount`
 * come from `CombatEncounterState.permanentWildDice`/`permanentDeadDice` and are
 * NOT re-rolled — they're fixed grants, just re-materialized each turn as fresh
 * turn-scoped die objects (mirrors how `rollTurnDice` ids are turn-scoped).
 * Returns an empty array when both counts are 0 (the common case pre-growth).
 */
export function rollPermanentBonusDice(
    turn: number,
    wildCount: number,
    deadCount: number,
): CombatManaDie[] {
    const dice: CombatManaDie[] = [];
    for (let i = 0; i < wildCount; i++) {
        dice.push({ id: `t${turn}-pw${i}`, color: 'wild', state: 'available', temporary: false });
    }
    for (let i = 0; i < deadCount; i++) {
        dice.push({ id: `t${turn}-pd${i}`, color: 'x', state: 'locked', temporary: false });
    }
    return dice;
}
