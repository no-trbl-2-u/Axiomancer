/**
 * Die-gear reducers (Spec 33 §6, Phase D5) — pure transitions over a
 * `Character.dieGear` rail, the parallel of `equipment.reducer.ts` for the
 * four upgradeable dice.
 *
 * The dice themselves are permanent immutable 6-siders; ALL progression lives
 * on the GEAR that drives each die's face table and special payload. Die gear
 * is DELIBERATELY NOT `Equipment`: it never flows through `EquipmentSlot` /
 * `equipItem` (signet relics and die gear never compete). It is its own
 * color-keyed rail on the character.
 *
 * Two upgrade verbs (blacksmith keywords, §6):
 *  - HONE   — add a mana face (−1 miss). Refused (loud, character unchanged)
 *             when the die would drop below 1 miss: whiff is never forgeable
 *             away.
 *  - TEMPER — upgrade a mana face to a special face (+1 special, −1 mana).
 *             Refused (loud) above the special cap (colored ≤ 2, wild ≤ 1) or
 *             with no mana face to spend.
 * Plus `swapDieGear` — replace a die's gear wholesale (a payload change IS a
 * gear swap; §6 — no forge-service keyword for it), cap-validated.
 *
 * Cap authority: every candidate face table is run through `validateDieGear`
 * — the SINGLE place caps are enforced. Refusals return the input character
 * unchanged plus a human-readable reason (the engine's loud-refusal idiom).
 *
 * Writes always MATERIALIZE the full concrete 4-color rail (default gear for
 * the untouched colors), so an upgrade never mutates the `Object.freeze`d
 * `DEFAULT_DIE_GEAR` and the persisted rail is always-full ("default gear is
 * the floor, no empty slot state").
 */

import type { Character } from './types';
import type { UpgradeableDieGear } from '../Combat/combat.encounter.types';
import { DEFAULT_DIE_GEAR } from '../Combat/combat.upgradeable-dice';

/** The four die colors the rail keys on (`wild` = the gold die). */
export type DieGearColor = 'heart' | 'body' | 'mind' | 'wild';

/** A full, concrete gear rail — one piece per die. */
export type DieGearRail = Record<DieGearColor, UpgradeableDieGear>;

/** Every face table sums to exactly this many d6 faces. */
export const DIE_GEAR_FACE_COUNT = 6;

/** The rail colors in canonical order (stance names + wild). */
export const DIE_GEAR_COLORS: readonly DieGearColor[] =
    Object.freeze(['heart', 'body', 'mind', 'wild']);

/** The special-face cap for a die: colored dice ≤ 2, the wild gold die ≤ 1. */
export function dieSpecialCap(color: DieGearColor): number {
    return color === 'wild' ? 1 : 2;
}

/** Miss faces implied by a gear piece (6 − special − mana). */
export function dieGearMissFaces(gear: UpgradeableDieGear): number {
    return DIE_GEAR_FACE_COUNT - gear.specialFaces - gear.manaFaces;
}

/**
 * The result of a die-gear transition. `ok=false` returns the input character
 * unchanged and a `reason` (loud refusal); `ok=true` carries the new character
 * and `reason=null`.
 */
export interface DieGearOutcome {
    character: Character;
    ok: boolean;
    reason: string | null;
}

const refuse = (character: Character, reason: string): DieGearOutcome =>
    ({ character, ok: false, reason });
const accept = (character: Character): DieGearOutcome =>
    ({ character, ok: true, reason: null });

/**
 * The SOLE cap authority. Returns a refusal reason string when `gear` is an
 * illegal face table for `color`, or `null` when it is legal:
 *  - the gear must drive the claimed color;
 *  - faces are non-negative and total exactly 6;
 *  - at least 1 miss face survives (whiff is never forgeable away);
 *  - special faces stay within the color's cap.
 */
export function validateDieGear(gear: UpgradeableDieGear, color: DieGearColor): string | null {
    if (gear.dieColor !== color) {
        return `gear drives the ${gear.dieColor} die, not ${color}`;
    }
    if (gear.specialFaces < 0 || gear.manaFaces < 0) {
        return 'a die cannot have negative faces';
    }
    const miss = dieGearMissFaces(gear);
    if (miss < 1) {
        return 'a die must keep at least 1 miss face — whiff is never forgeable away';
    }
    if (gear.specialFaces > dieSpecialCap(color)) {
        return `${color} exceeds its special-face cap of ${dieSpecialCap(color)}`;
    }
    return null;
}

/** A fresh, mutable, full rail cloned from the frozen default loadout. */
export function concreteDefaultRail(): DieGearRail {
    return {
        heart: { ...DEFAULT_DIE_GEAR.heart },
        body: { ...DEFAULT_DIE_GEAR.body },
        mind: { ...DEFAULT_DIE_GEAR.mind },
        wild: { ...DEFAULT_DIE_GEAR.wild },
    };
}

/** The active gear for one die on a character: the rail piece or the default. */
export function characterDieGear(character: Character, color: DieGearColor): UpgradeableDieGear {
    return character.dieGear?.[color] ?? DEFAULT_DIE_GEAR[color];
}

/**
 * Writes `gear` into `color`'s slot on a freshly-materialized full rail (the
 * other colors backfilled from the character's rail or the default), never
 * mutating the frozen `DEFAULT_DIE_GEAR`.
 */
function withDieGear(character: Character, color: DieGearColor, gear: UpgradeableDieGear): Character {
    const rail: DieGearRail = concreteDefaultRail();
    for (const c of DIE_GEAR_COLORS) {
        const existing = character.dieGear?.[c];
        if (existing) rail[c] = { ...existing };
    }
    rail[color] = gear;
    return { ...character, dieGear: rail };
}

/**
 * HONE `color`: add a mana face (−1 miss). Refused loudly when the die is
 * already at its 1-miss floor.
 */
export function honeDieGear(character: Character, color: DieGearColor): DieGearOutcome {
    const gear = characterDieGear(character, color);
    const candidate: UpgradeableDieGear = { ...gear, manaFaces: gear.manaFaces + 1 };
    const reason = validateDieGear(candidate, color);
    if (reason) return refuse(character, `HONE refused: ${reason}`);
    return accept(withDieGear(character, color, candidate));
}

/**
 * TEMPER `color`: upgrade a mana face to a special face (+1 special, −1 mana).
 * Refused loudly with no mana face to spend, or above the special cap.
 */
export function temperDieGear(character: Character, color: DieGearColor): DieGearOutcome {
    const gear = characterDieGear(character, color);
    if (gear.manaFaces < 1) {
        return refuse(character, 'TEMPER refused: no mana face to upgrade');
    }
    const candidate: UpgradeableDieGear = {
        ...gear,
        specialFaces: gear.specialFaces + 1,
        manaFaces: gear.manaFaces - 1,
    };
    const reason = validateDieGear(candidate, color);
    if (reason) return refuse(character, `TEMPER refused: ${reason}`);
    return accept(withDieGear(character, color, candidate));
}

/**
 * Swap `color`'s die gear wholesale (the payload-change path — §6: swapping
 * gear IS the payload change, no service keyword). Cap-validated against the
 * target color; refused loudly on an illegal table.
 */
export function swapDieGear(
    character: Character,
    color: DieGearColor,
    gear: UpgradeableDieGear,
): DieGearOutcome {
    const reason = validateDieGear(gear, color);
    if (reason) return refuse(character, `SWAP refused: ${reason}`);
    return accept(withDieGear(character, color, { ...gear }));
}
