/**
 * Spec 33 — Upgradeable Dice: the four-die combat model (Phase D2; shipped, D7).
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
 * This is THE shipped combat dice model (D7, 2026-09-25: the flag is gone and
 * the pre-spec-33 draft/read/STAKE/wheel model was deleted). Randomness flows
 * through caller-supplied `rng` closures, so hermetic tests pin faces via
 * sequential mocks and the sim stays reproducible.
 *
 * Dice honesty (2026-07-09 law, re-affirmed at D1): NOTHING in this module
 * rigs a roll — no stance guarantee, no pity floor. Press Fate
 * (`rerollMissFacesHonest`) rerolls every miss face and accepts whatever the
 * gear tables return; the ~0.7% double-whiff residue is carried by FREE lines.
 */

import { getRng } from '../Utils/rng';
import type {
    CombatDieColor, CombatEncounterState, CombatManaDie, UpgradeableDieGear, WheelStance,
} from './combat.encounter.types';
import type { CardAspect } from '../Cards/types';

// ---------------------------------------------------------------------------
// Constants (spec 33 §1, §4, §6 — [owner-locked] unless noted)
// ---------------------------------------------------------------------------

/** §1 — the fixed rolled pool: one die per color, every round. */
export const UPGRADEABLE_DIE_COLORS: readonly ('heart' | 'body' | 'mind' | 'wild')[] =
    Object.freeze(['body', 'mind', 'heart', 'wild']);

/** §1 — hard ceiling on die OBJECTS on the table (tray + Reserve). A grant
 *  that would create the 8th object converts to +1◆ instead. */
export const UPGRADEABLE_TABLE_CEILING = 7;

/** §6 — KINDLE concurrency cap (at most one temporary kindled
 *  die at a time; further grants convert to +1◆). */
export const KINDLE_CONCURRENT_CAP = 1;

/** §4 — Press Fate's price: 1◆ rerolls ALL miss faces, once/round. */
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

/** Faces on a spec-33 die. `specialFaces + manaFaces` may never exceed it —
 *  a die with no miss face left is fully honed and cannot be honed further. */
const UPGRADEABLE_DIE_FACE_COUNT = 6;

/**
 * THE PATH (owner ruling 2026-09-02) — DIE UPGRADES, expressed in the SHIPPED
 * dice model. "Players will have the ability to upgrade the dice (so it shows
 * more mana faces but will be expensive)."
 *
 * Under spec 33 that sentence is literal: a HONE turns one MISS face into a
 * MANA face. This is the potent form of the axis, because spec 33 retired the
 * draft — every usable die powers
 * a card, so a mana face the player didn't have before is a PAID play they
 * didn't have before.
 *
 *   level 0 — colours 1 special / 2 mana / 3 miss   gold 1 / 1 / 4  (stock)
 *   level 1 — colours 1 / 3 / 2                     gold 1 / 2 / 3
 *   level 2 — colours 1 / 4 / 1                     gold 1 / 3 / 2
 *   level 3 — colours 1 / 5 / 0  (never misses)     gold 1 / 4 / 1
 *   level 4 — colours 1 / 5 / 0  (capped)           gold 1 / 5 / 0
 *
 * Monotone but SATURATING: colour dice run out of miss faces at level 3, so
 * level 4 only pays the gold die. That is the honest shape of the ladder — do
 * not read the levels as equal steps.
 */
export function honedDieGear(
    color: 'heart' | 'body' | 'mind' | 'wild',
    level = 0,
): UpgradeableDieGear {
    const stock = DEFAULT_DIE_GEAR[color];
    const hones = Math.max(0, Math.floor(level));
    if (hones === 0) return stock;
    const room = UPGRADEABLE_DIE_FACE_COUNT - stock.specialFaces - stock.manaFaces;
    return { ...stock, manaFaces: stock.manaFaces + Math.min(room, hones) };
}

/**
 * The active gear for one die: the state's rail (D5), else the stock default
 * HONED by `dieUpgradeLevel`. An explicit rail always wins — it is the
 * player's actual gear; the honed default is what the balance harness uses to
 * model a stage of the campaign it has no authored loadout for.
 */
export function activeDieGear(
    state: Pick<CombatEncounterState, 'dieGear' | 'dieUpgradeLevel'>,
    color: 'heart' | 'body' | 'mind' | 'wild',
): UpgradeableDieGear {
    return state.dieGear?.[color] ?? honedDieGear(color, state.dieUpgradeLevel ?? 0);
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
 * THE PATH (owner ruling 2026-09-02) — ACT REWARD DICE. "After each act is
 * completed, the players are rewarded a red/blue/purple base die of their
 * choice." Under spec 33 the tray is a fixed one-die-per-colour set, so an act
 * reward is a DUPLICATE colour die: a second body die, a second mind die, and
 * so on. Since the harness cannot model the player's choice, the colours are
 * handed out deterministically in the spec's own R/B/P order.
 *
 * NOT SHIPPED YET (owner note 2026-09-03): the game is still in act one, so no
 * player has been given one. This exists so a mid/late playtest cell measures
 * the body that stage of the campaign will have.
 *
 * These dice honour the colour-keyed OVERHEAT crack like any other die of
 * their colour — a body crack silences every body die that round. That is the
 * spec's own law, not an oversight, and it makes OVERHEAT costlier the more
 * duplicates you own.
 */
function actRewardDieColors(count: number): ('heart' | 'body' | 'mind')[] {
    const order: ('heart' | 'body' | 'mind')[] = ['body', 'mind', 'heart'];
    return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => order[i % order.length]);
}

/**
 * §1 — rolls the round's four dice (one per color, fixed order R/B/P/G by
 * stance name body/mind/heart/wild), plus one duplicate colour die per banked
 * ACT REWARD (`bonusTurnDice`). A color listed in `cracked` (an OVERHEAT crack
 * biting this round) comes up all-miss WITHOUT consuming rng — the crack is a
 * stated consequence, not a rigged roll.
 */
export function rollUpgradeableDice(
    turn: number,
    state: Pick<CombatEncounterState, 'dieGear' | 'dieUpgradeLevel' | 'bonusTurnDice'>,
    crackedColors: ReadonlySet<string>,
    rng: () => number = defaultRng,
): CombatManaDie[] {
    const roll = (id: string, color: 'heart' | 'body' | 'mind' | 'wild'): CombatManaDie => {
        if (crackedColors.has(color)) return faceToDie(id, color, 'miss');
        return faceToDie(id, color, rollUpgradeableFace(activeDieGear(state, color), rng));
    };
    return [
        ...UPGRADEABLE_DIE_COLORS.map(color => roll(`t${turn}-u-${color}`, color)),
        ...actRewardDieColors(state.bonusTurnDice ?? 0)
            .map((color, i) => roll(`t${turn}-u-act${i}-${color}`, color)),
    ];
}

/** §6 — the rare permanent gold+lead pair (cap 1 pair, the spec-33 reading of
 *  `permanentWildDice`): a 2nd gold die (stock gold gear faces) plus the
 *  LEADEN die — 5 miss / 1 gold-colored mana. Fate pushes back. */
export function rollGoldLeadPair(
    turn: number,
    state: Pick<CombatEncounterState, 'dieGear' | 'dieUpgradeLevel'>,
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
// Press Fate (§4) — the honest reroll
// ---------------------------------------------------------------------------

/**
 * Rerolls every MISS face in the tray from its gear table — honestly: no
 * stance/mana guarantee (a stance-bearing conversion would be a rig under
 * the spec-33 law). Dice
 * whose color is cracked this round are excluded. Spent/available dice are
 * untouched — Press Fate revives the dead, it never re-rolls the living.
 */
export function rerollMissFacesHonest(
    dice: readonly CombatManaDie[],
    state: Pick<CombatEncounterState, 'dieGear' | 'dieUpgradeLevel'>,
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
export function isChainStance(s: CombatDieColor | CardAspect): s is WheelStance {
    return s === 'heart' || s === 'body' || s === 'mind';
}
