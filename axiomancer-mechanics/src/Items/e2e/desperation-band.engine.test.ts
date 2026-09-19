/**
 * Hermetic E2E — Phase 96, the consumable desperation band.
 *
 * A flat `healAmount` pays the same at full health as at death's door, so the
 * dominant play is to hoard the flask and never drink it. `healAmountBelowHalf`
 * is the anti-hoarding lever: a larger heal that fires only while the drinker is
 * under {@link DESPERATION_HP_FRACTION} of `maxHealth` (prior art —
 * `kb:dawncaster/0796-healing-potion`, the same 1.5x).
 *
 * This suite pins the contracts the lever has to hold or it silently mis-pays:
 *
 *   - the threshold is STRICTLY less-than (exactly half is NOT desperate);
 *   - the band is read BEFORE healing, so a drink that lifts the player out of
 *     the band still pays the desperation amount;
 *   - `healAmountBelowHalf` without a `healAmount` is inert (not a payload);
 *   - a consumable with no band behaves exactly as it did pre-Phase-96;
 *   - the clamp to `maxHealth` still wins over the larger amount;
 *   - degenerate records (`maxHealth <= 0`) never read as desperate;
 *   - the shipped library's five healing potions all carry the 1.5x band.
 */

import { describe, it, expect } from 'vitest';

import {
    DESPERATION_HP_FRACTION,
    isDesperate,
    resolveConsumableHeal,
    useConsumableEffect,
} from '../equipment.engine';
import { consumableLibrary } from '../consumable.library';
import { createCharacter } from '../../Character/index';
import { Consumable } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Base player: `createCharacter` derives maxHealth from the stat block. */
const buildPlayer = () => createCharacter({
    name: 'TestDrinker',
    level: 1,
    baseStats: { heart: 4, body: 3, mind: 2 },
});

/** Put the player at an exact HP so band arithmetic is unambiguous. */
const at = (hp: number) => ({ ...buildPlayer(), health: hp });

/** A two-band potion: 20 flat, 30 when badly wounded. */
const bandedPotion: Consumable = {
    id: 'csl_banded',
    name: 'Banded Draught',
    description: 'Twenty, or thirty to the badly wounded.',
    category: 'consumable',
    healAmount: 20,
    healAmountBelowHalf: 30,
    quantity: 1,
};

/** A pre-Phase-96 shaped potion: flat only, no band. */
const flatPotion: Consumable = {
    id: 'csl_flat',
    name: 'Flat Draught',
    description: 'Twenty, always.',
    category: 'consumable',
    healAmount: 20,
    quantity: 1,
};

/** Malformed on purpose: a band with no flat heal under it. */
const bandOnlyPotion: Consumable = {
    id: 'csl_band_only',
    name: 'Bandless Draught',
    description: 'A band with nothing under it.',
    category: 'consumable',
    healAmountBelowHalf: 30,
    quantity: 1,
};

/** No effect lookups needed — these fixtures carry no `effectId`. */
const noEffects = () => undefined;

// ─── isDesperate ─────────────────────────────────────────────────────────────

describe('isDesperate', () => {
    it('is true strictly below the threshold', () => {
        // maxHealth 100 keeps the fraction arithmetic readable.
        expect(isDesperate({ health: 49, maxHealth: 100 })).toBe(true);
        expect(isDesperate({ health: 1, maxHealth: 100 })).toBe(true);
        expect(isDesperate({ health: 0, maxHealth: 100 })).toBe(true);
    });

    it('is FALSE at exactly the threshold — the band is the half below it', () => {
        // The single most likely mis-implementation is `<=`. A player sitting on
        // exactly half gets the flat rate.
        expect(isDesperate({ health: 50, maxHealth: 100 })).toBe(false);
    });

    it('is false above the threshold', () => {
        expect(isDesperate({ health: 51, maxHealth: 100 })).toBe(false);
        expect(isDesperate({ health: 100, maxHealth: 100 })).toBe(false);
    });

    it('never reads a degenerate record as desperate', () => {
        // health/0 is NaN or Infinity, and a NaN comparison would silently
        // return false anyway — but a 0/0 record must not hand out the larger
        // heal by accident, so the guard is explicit and pinned here.
        expect(isDesperate({ health: 0, maxHealth: 0 })).toBe(false);
        expect(isDesperate({ health: 10, maxHealth: -5 })).toBe(false);
    });

    it('uses the documented threshold constant', () => {
        expect(DESPERATION_HP_FRACTION).toBe(0.5);
    });
});

// ─── resolveConsumableHeal ───────────────────────────────────────────────────

describe('resolveConsumableHeal', () => {
    it('pays the flat amount above the band', () => {
        const player = { health: 100, maxHealth: 100 };
        expect(resolveConsumableHeal(player, bandedPotion))
            .toEqual({ amount: 20, desperate: false });
    });

    it('pays the larger amount inside the band, and flags it', () => {
        const player = { health: 10, maxHealth: 100 };
        expect(resolveConsumableHeal(player, bandedPotion))
            .toEqual({ amount: 30, desperate: true });
    });

    it('pays the flat amount at exactly half', () => {
        const player = { health: 50, maxHealth: 100 };
        expect(resolveConsumableHeal(player, bandedPotion))
            .toEqual({ amount: 20, desperate: false });
    });

    it('is unchanged for a band-less consumable at any HP', () => {
        expect(resolveConsumableHeal({ health: 100, maxHealth: 100 }, flatPotion))
            .toEqual({ amount: 20, desperate: false });
        expect(resolveConsumableHeal({ health: 1, maxHealth: 100 }, flatPotion))
            .toEqual({ amount: 20, desperate: false });
    });

    it('ignores a band with no flat heal under it', () => {
        // `healAmountBelowHalf` is a conditional UPGRADE of `healAmount`, never a
        // standalone payload — a malformed item heals for nothing rather than
        // quietly becoming a desperation-only potion.
        expect(resolveConsumableHeal({ health: 1, maxHealth: 100 }, bandOnlyPotion))
            .toEqual({ amount: 0, desperate: false });
    });

    it('ignores a non-positive band', () => {
        const zeroBand: Consumable = { ...bandedPotion, healAmountBelowHalf: 0 };
        expect(resolveConsumableHeal({ health: 1, maxHealth: 100 }, zeroBand))
            .toEqual({ amount: 20, desperate: false });
    });
});

// ─── useConsumableEffect ─────────────────────────────────────────────────────

describe('useConsumableEffect — desperation band', () => {
    it('heals the flat amount above the band', () => {
        const player = at(buildPlayer().maxHealth); // full health
        const hurt = { ...player, health: player.maxHealth - 5 };
        const result = useConsumableEffect(hurt, bandedPotion, 1, noEffects);
        // Only 5 HP of room, so the clamp — not the band — decides the number.
        expect(result.healed).toBe(5);
        expect(result.desperate).toBe(false);
    });

    it('heals the larger amount inside the band and reports desperate', () => {
        const base = buildPlayer();
        const hurt = { ...base, health: 1 }; // deep in the band
        const result = useConsumableEffect(hurt, bandedPotion, 1, noEffects);
        const expected = Math.min(base.maxHealth, 1 + 30) - 1;
        expect(result.healed).toBe(expected);
        expect(result.desperate).toBe(true);
    });

    it('reads the band BEFORE healing — a drink that lifts you out still pays desperation rates', () => {
        // The player starts inside the band and ends well outside it. If the
        // band were re-read after healing, this would pay the flat 20.
        const base = buildPlayer();
        const justUnderHalf = Math.floor(base.maxHealth / 2) - 1;
        const hurt = { ...base, health: justUnderHalf };
        const result = useConsumableEffect(hurt, bandedPotion, 1, noEffects);

        const expected = Math.min(base.maxHealth, justUnderHalf + 30) - justUnderHalf;
        expect(result.healed).toBe(expected);
        expect(result.desperate).toBe(true);
        // And the potion really did carry them past the midpoint (or capped).
        expect(result.player.health).toBeGreaterThan(justUnderHalf);
    });

    it('never overheals past maxHealth even on the larger band', () => {
        const base = buildPlayer();
        const hurt = { ...base, health: 1 };
        const huge: Consumable = { ...bandedPotion, healAmountBelowHalf: 9_999 };
        const result = useConsumableEffect(hurt, huge, 1, noEffects);
        expect(result.player.health).toBe(base.maxHealth);
    });

    it('is byte-identical to pre-Phase-96 behaviour for a band-less consumable', () => {
        const base = buildPlayer();
        const hurt = { ...base, health: 1 };
        const result = useConsumableEffect(hurt, flatPotion, 1, noEffects);
        expect(result.healed).toBe(Math.min(base.maxHealth, 1 + 20) - 1);
        expect(result.desperate).toBe(false);
    });

    it('leaves the drinker untouched when the item has no heal payload at all', () => {
        const base = buildPlayer();
        const hurt = { ...base, health: 1 };
        const result = useConsumableEffect(hurt, bandOnlyPotion, 1, noEffects);
        expect(result.healed).toBe(0);
        expect(result.desperate).toBe(false);
        expect(result.player.health).toBe(1);
    });
});

// ─── The shipped library ─────────────────────────────────────────────────────

describe('consumable library — every healing potion carries the band', () => {
    /** Phase 96 retuned exactly these five; the ratio is uniform on purpose. */
    const HEALERS = [
        'healing-potion',
        'minor-healing-potion',
        'greater-healing-potion',
        'supreme-healing-potion',
        'phoenix-tear',
    ];

    it.each(HEALERS)('%s pays 1.5x its flat heal below half', id => {
        const item = consumableLibrary.find(c => c.id === id);
        expect(item, `${id} missing from the library`).toBeDefined();
        const flat = item!.healAmount!;
        expect(flat).toBeGreaterThan(0);
        // One rule the player learns once, not five numbers to memorise.
        expect(item!.healAmountBelowHalf).toBe(flat * 1.5);
    });

    it('leaves every non-healing consumable band-less', () => {
        // The lever answers the hoarding incentive on HEALS specifically. A band
        // on a cleanse or a buff would be a different (unshipped) design.
        const stray = consumableLibrary.filter(
            c => (c.healAmountBelowHalf ?? 0) > 0 && !(c.healAmount! > 0),
        );
        expect(stray).toEqual([]);
    });

    it('never bands an item below its own flat heal', () => {
        // A "band" that pays LESS when you are dying would invert the lever.
        for (const c of consumableLibrary) {
            if ((c.healAmountBelowHalf ?? 0) > 0) {
                expect(c.healAmountBelowHalf!).toBeGreaterThan(c.healAmount!);
            }
        }
    });
});
