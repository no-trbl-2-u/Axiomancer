/**
 * Spec 33 — Upgradeable Dice: the four-die combat model (Phase D2, FLAGGED).
 *
 * Four fixed, single-color d6 rolled every round — Body (red), Mind (blue),
 * Heart (purple) at 1 special / 2 mana / 3 miss, and the wild Gold die at
 * 1 special / 1 mana / 4 miss. Face semantics: a MANA die may power one paid
 * line of its color (gold = any color); a MISS is dead; a BOON powers a
 * card AND fires its gear payload (+2◆ by default) when USED (the ratified
 * use-triggered rule, kept as one switchable constant below).
 *
 * The dice are immutable; ALL progression lives on DIE GEAR (D5). D2 ships the
 * gear INTERFACE with the hardcoded default loadout (`DEFAULT_DIE_GEAR`).
 *
 * Everything here is inert until `setUpgradeableDice(true)` — the flag-off
 * engine is byte-identical to the pre-spec-33 model. Randomness flows through
 * caller-supplied `rng` closures exactly like `combat.dice.ts`, so hermetic
 * tests pin faces via sequential mocks and the sim stays reproducible.
 *
 * Dice honesty (2026-07-09 law, re-affirmed at D1): NOTHING in this module
 * rigs a roll — no stance guarantee, no pity floor. Press Fate's flag-on form
 * (`rerollMissFacesHonest`) rerolls every miss face and accepts whatever the
 * gear tables return; the ~0.7% double-whiff residue is carried by FREE lines.
 */

import { getRng } from '../Utils/rng';
import type {
    CombatDieColor, CombatEncounterState, CombatManaDie, UpgradeableDieGear, WheelStance,
} from './combat.encounter.types';

// ---------------------------------------------------------------------------
// The flag
// ---------------------------------------------------------------------------

let upgradeableDiceEnabled = false;

/** Turns the spec-33 model on/off (default OFF — the shipped combat is
 *  untouched until D7 recommends the flip). Tests toggle per-suite. */
export function setUpgradeableDice(on: boolean): void {
    upgradeableDiceEnabled = on;
}

/** True while the spec-33 Upgradeable-Dice model is active. */
export function isUpgradeableDiceEnabled(): boolean {
    return upgradeableDiceEnabled;
}

// ---------------------------------------------------------------------------
// Constants (spec 33 §1, §4, §6 — [owner-locked] unless noted)
// ---------------------------------------------------------------------------

/** §1 — the fixed rolled pool: one die per color, every round. */
export const UPGRADEABLE_DIE_COLORS: readonly ('heart' | 'body' | 'mind' | 'wild')[] =
    Object.freeze(['body', 'mind', 'heart', 'wild']);

/** §1 — hard ceiling on die OBJECTS on the table (tray + Reserve). A grant
 *  that would create the 8th object converts to +1◆ instead. */
export const UPGRADEABLE_TABLE_CEILING = 7;

/** §6 — KINDLE concurrency cap under the flag (at most one temporary kindled
 *  die at a time; further grants convert to +1◆). */
export const KINDLE_CONCURRENT_CAP = 1;

/** §4 — Press Fate's flag-on price: 1◆ rerolls ALL miss faces, once/round. */
export const PRESS_FATE_COST = 1;

/** §6 — OVERHEAT: pushing an already-spent die to power a second card risks
 *  this chance that the die CRACKS (all-miss next round, excluded from that
 *  round's Press Fate). The push itself always succeeds. */
export const OVERHEAT_CRACK_CHANCE = 0.35;

/**
 * §6 owner-ratified fires-on-use rule (D7): a BOON face fires its payload
 * only when the die is USED to power a card. Keep this the single switch —
 * nothing else may encode the trigger timing.
 */
export const SPECIAL_FIRES_ON_USE = true;

/** §6 — the default special payload: +2◆ when the special fires. */
export const SPECIAL_CONVICTION_DEFAULT = 2;

/** §3 — chain order, cyclic, any entry point (matches the shipped wheel). */
export const MOMENTUM_CHAIN_ORDER: readonly WheelStance[] = Object.freeze(['heart', 'body', 'mind']);

/** §3 — chain length that completes a surge. */
export const MOMENTUM_SURGE_LENGTH = 3;

/** Id prefix for the surge-granted temp gold die (until spent, this combat —
 *  `temporary: true` keeps it out of the cross-combat float save, mirroring
 *  the wheel-era `momentum-` prefix convention). */
export const SURGE_DIE_PREFIX = 'surge-';

/** Id prefix for the coveted-die payout (Phase 33c, spec 33 §1): a boss/unique
 *  phase's `stake` claimed via STAGGER-to-0 / full block / stance-check yield.
 *  Same shape as the surge die (temp gold, until spent), distinct prefix so
 *  the two payout sources stay attributable in telemetry/tests. */
export const COVETED_DIE_PREFIX = 'coveted-';

// ---------------------------------------------------------------------------
// Die gear (§6) — the D2 interface; D5 makes it a persisted rail
// ---------------------------------------------------------------------------

/** The stock loadout: R/B/P at 1 special / 2 mana / 3 miss; Gold 1/1/4. */
export const DEFAULT_DIE_GEAR: Readonly<Record<'heart' | 'body' | 'mind' | 'wild', UpgradeableDieGear>> =
    Object.freeze({
        heart: { dieColor: 'heart', specialFaces: 1, manaFaces: 2, specialConviction: SPECIAL_CONVICTION_DEFAULT },
        body: { dieColor: 'body', specialFaces: 1, manaFaces: 2, specialConviction: SPECIAL_CONVICTION_DEFAULT },
        mind: { dieColor: 'mind', specialFaces: 1, manaFaces: 2, specialConviction: SPECIAL_CONVICTION_DEFAULT },
        wild: { dieColor: 'wild', specialFaces: 1, manaFaces: 1, specialConviction: SPECIAL_CONVICTION_DEFAULT },
    });

/** The active gear for one die: the state's rail (D5) or the stock default. */
export function activeDieGear(
    state: Pick<CombatEncounterState, 'dieGear'>,
    color: 'heart' | 'body' | 'mind' | 'wild',
): UpgradeableDieGear {
    return state.dieGear?.[color] ?? DEFAULT_DIE_GEAR[color];
}

export type UpgradeableDieFace = 'special' | 'mana' | 'miss';

/** Rolls one face from a gear piece's table (special / mana / the miss rest). */
export function rollUpgradeableFace(
    gear: UpgradeableDieGear,
    rng: () => number = defaultRng,
): UpgradeableDieFace {
    const faceIdx = Math.min(5, Math.floor(rng() * 6));
    if (faceIdx < gear.specialFaces) return 'special';
    if (faceIdx < gear.specialFaces + gear.manaFaces) return 'mana';
    return 'miss';
}

const defaultRng = (): number => getRng().random();

/** Materializes a rolled face as a tray die. Miss = `locked` (cannot power;
 *  never fate-tappable — these are stance colors, not X). */
function faceToDie(
    id: string,
    color: 'heart' | 'body' | 'mind' | 'wild',
    face: UpgradeableDieFace,
): CombatManaDie {
    return {
        id, color, face,
        state: face === 'miss' ? 'locked' : 'available',
        temporary: false,
    };
}

/**
 * §1 — rolls the round's four dice (one per color, fixed order R/B/P/G by
 * stance name body/mind/heart/wild). A color listed in `cracked` (an OVERHEAT
 * crack biting this round) comes up all-miss WITHOUT consuming rng — the crack
 * is a stated consequence, not a rigged roll.
 */
export function rollUpgradeableDice(
    turn: number,
    state: Pick<CombatEncounterState, 'dieGear'>,
    crackedColors: ReadonlySet<string>,
    rng: () => number = defaultRng,
): CombatManaDie[] {
    return UPGRADEABLE_DIE_COLORS.map(color => {
        const id = `t${turn}-u-${color}`;
        if (crackedColors.has(color)) return faceToDie(id, color, 'miss');
        return faceToDie(id, color, rollUpgradeableFace(activeDieGear(state, color), rng));
    });
}

/** §6 — the rare permanent gold+lead pair (cap 1 pair, flag-on reading of
 *  `permanentWildDice`): a 2nd gold die (stock gold gear faces) plus the
 *  LEADEN die — 5 miss / 1 gold-colored mana. Fate pushes back. */
export function rollGoldLeadPair(
    turn: number,
    state: Pick<CombatEncounterState, 'dieGear'>,
    rng: () => number = defaultRng,
): CombatManaDie[] {
    const gold = faceToDie(`t${turn}-u-gold2`, 'wild', rollUpgradeableFace(activeDieGear(state, 'wild'), rng));
    const leadFace: UpgradeableDieFace = Math.min(5, Math.floor(rng() * 6)) < 1 ? 'mana' : 'miss';
    const lead = faceToDie(`t${turn}-u-lead`, 'wild', leadFace);
    return [gold, lead];
}

// ---------------------------------------------------------------------------
// Momentum (§3) — the wheel, absorbed; breaks reset to NULL (owner-locked D1)
// ---------------------------------------------------------------------------

export type MomentumV2 = { color: WheelStance; length: number } | null;

function nextChainColor(s: WheelStance): WheelStance {
    return MOMENTUM_CHAIN_ORDER[(MOMENTUM_CHAIN_ORDER.indexOf(s) + 1) % MOMENTUM_CHAIN_ORDER.length];
}

/**
 * Advances the momentum chain for a landed PAID play of `played`:
 * - null → start `{played, 1}`;
 * - the successor color → advance (+1); reaching `MOMENTUM_SURGE_LENGTH`
 *   surges and resets to null;
 * - ANY other color — INCLUDING the color the chain sits on — breaks the
 *   chain to NULL. The breaking card builds nothing (owner-locked D1: this
 *   deliberately supersedes the shipped `advanceWheel` restart truth table).
 * FREE plays never reach this function.
 */
export function advanceMomentumV2(
    momentum: MomentumV2,
    played: WheelStance,
): { momentum: MomentumV2; surged: boolean; broke: boolean } {
    if (momentum === null) return { momentum: { color: played, length: 1 }, surged: false, broke: false };
    if (played !== nextChainColor(momentum.color)) return { momentum: null, surged: false, broke: true };
    const length = momentum.length + 1;
    if (length >= MOMENTUM_SURGE_LENGTH) return { momentum: null, surged: true, broke: false };
    return { momentum: { color: played, length }, surged: false, broke: false };
}

// ---------------------------------------------------------------------------
// Press Fate (§4) — the honest flag-on reroll
// ---------------------------------------------------------------------------

/**
 * Rerolls every MISS face in the tray from its gear table — honestly: no
 * stance/mana guarantee (explicitly supersedes `rerollSpentDice`'s
 * stance-bearing conversion, which is a rig under the spec-33 law). Dice
 * whose color is cracked this round are excluded. Spent/available dice are
 * untouched — Press Fate revives the dead, it never re-rolls the living.
 */
export function rerollMissFacesHonest(
    dice: readonly CombatManaDie[],
    state: Pick<CombatEncounterState, 'dieGear'>,
    crackedColors: ReadonlySet<string>,
    rng: () => number = defaultRng,
): { dice: CombatManaDie[]; rerolledIds: string[] } {
    const rerolledIds: string[] = [];
    const next = dice.map(d => {
        if (d.face !== 'miss') return d;
        if (d.floating) return d;
        if (crackedColors.has(d.color)) return d;
        if (d.color === 'x') return d;
        rerolledIds.push(d.id);
        const face = rollUpgradeableFace(activeDieGear(state, d.color as 'heart' | 'body' | 'mind' | 'wild'), rng);
        return { ...d, face, state: face === 'miss' ? ('locked' as const) : ('available' as const) };
    });
    return { dice: next, rerolledIds };
}

// ---------------------------------------------------------------------------
// Table ceiling (§1) — materialization priority + overflow → +1◆
// ---------------------------------------------------------------------------

/** Die objects on the table: the tray plus the Reserve. */
export function tableDieObjectCount(state: Pick<CombatEncounterState, 'dice' | 'reserve'>): number {
    return state.dice.length + (state.reserve ?? []).length;
}

/** True when one more die object fits under the 7-object ceiling. */
export function tableHasRoom(state: Pick<CombatEncounterState, 'dice' | 'reserve'>): boolean {
    return tableDieObjectCount(state) < UPGRADEABLE_TABLE_CEILING;
}

// ---------------------------------------------------------------------------
// Cracked dice (§6 OVERHEAT)
// ---------------------------------------------------------------------------

/** The colors whose dice are forced all-miss on `turn` (crack biting now). */
export function crackedColorsForTurn(
    state: Pick<CombatEncounterState, 'crackedDice'>,
    turn: number,
): Set<string> {
    return new Set((state.crackedDice ?? []).filter(c => c.turn === turn).map(c => c.color));
}

/** Drops crack entries STRICTLY BEFORE `turn`. An entry survives through its
 *  own bitten turn — the crack must still exclude the die from THAT turn's
 *  Press Fate (§6) — and is swept by the next turn's roll. */
export function expireCrackedDice(
    cracked: readonly { color: 'heart' | 'body' | 'mind' | 'wild'; turn: number }[] | undefined,
    turn: number,
): { color: 'heart' | 'body' | 'mind' | 'wild'; turn: number }[] {
    return (cracked ?? []).filter(c => c.turn >= turn);
}

// ---------------------------------------------------------------------------
// Stance checks (§2)
// ---------------------------------------------------------------------------

/**
 * Resolves a phase's open stance check against the player's stance at phase
 * end. Null stance (stance-less) fires NOTHING — a check against a stance you
 * never entered passes silently. Returns the damage multiplier for the
 * enemy's telegraphed hit and whether the yield's +1◆ pays.
 */
export function resolveStanceCheck(
    check: { punishes?: WheelStance | string; yields?: WheelStance | string } | undefined,
    playerStance: WheelStance | null | undefined,
    advantageMult: number,
    disadvantageMult: number,
): { mult: number; yielded: boolean; outcome: 'punished' | 'yielded' | 'none' } {
    if (!check || !playerStance) return { mult: 1, yielded: false, outcome: 'none' };
    if (check.punishes === playerStance) return { mult: advantageMult, yielded: false, outcome: 'punished' };
    if (check.yields === playerStance) return { mult: disadvantageMult, yielded: true, outcome: 'yielded' };
    return { mult: 1, yielded: false, outcome: 'none' };
}

/** True for the three chain/stance colors (never wild/x). */
export function isChainStance(s: CombatDieColor): s is WheelStance {
    return s === 'heart' || s === 'body' || s === 'mind';
}
