/**
 * The first-node relic grant — the Suppliant's Ring, handed over where the
 * player can see it.
 *
 * ## Why this module exists
 *
 * The owner's finding was "new players start with no items". The recon note
 * attached to it guessed that something between `cloneStartingRelics()` and
 * the SATCHEL render was DROPPING the ring. It is not. Measured on this tree:
 * `createNewGameState()` returns 11 relics, with `relic-disarming-plea` both
 * in `inventory` and worn in the accessory row, and the mobile SATCHEL
 * view-model renders all 11 rows with the ring badged WORN. Boot, save/load
 * round-trip and the presenter were each probed; none loses it.
 *
 * The real defect is that the grant is INVISIBLE. `createCharacter` folds the
 * whole signet kit into the character inside `createNewGameState()`, before a
 * screen exists to say anything about it. Nothing in the run ever names the
 * ring, names The Open Hand, or shows the player a moment where they were
 * given something. A player who is handed five worn trinkets silently, at
 * t=0, with no consumables to speak of, reasonably reports starting with
 * nothing.
 *
 * So the fix is not to find a leak — there is no leak. It is to move the
 * hand-over out of character construction and into the run's first node,
 * where it can be shown.
 *
 * ## The shape of the move
 *
 * `withholdFirstNodeRelic` and `grantFirstNodeRelic` are exact inverses over
 * the seeded character:
 *
 * - **withhold** (kept for callers that seed the kit themselves — since the
 *   2026-09-23 owner call `createNewGameState` seeds no relics) takes the fully
 *   seeded character and removes the Suppliant's Ring from both `inventory`
 *   and the worn accessory row, promoting the highest-ranked benched
 *   accessory (`STAND_IN_RELIC_ID`, the Venom Sigil) into the freed seat.
 * - **grant** (applied at the first node) puts it back: the stand-in is
 *   unequipped and returned to the bench, the ring is added to inventory in
 *   the worn window and equipped.
 *
 * The round trip is asserted by test. Post-grant state is EQUIVALENT to
 * today's shipped seed — same five worn relics, same five signatures, same
 * derived stats, same eleven items owned — so nothing downstream of the first
 * node changes. It is not byte-identical: inventory ORDER differs (the ring
 * lands third in the accessory worn-window rather than second, and the
 * stand-in ends the list). Accessory positions carry no identity, so that
 * difference is cosmetic by construction.
 *
 * ### Why the seat is back-filled rather than left empty
 *
 * Worn-state has TWO representations that must agree: the engine's
 * `Character.equipment` loadout, and the positional convention every
 * inventory-driven client reads (`wornPerSlot` — the first
 * `SLOT_CAPACITY[slot]` equipment items per slot, in inventory order). The
 * positional convention cannot express a partially-filled accessory row: with
 * six accessories in inventory it will always report three as worn. Leaving
 * the ring's seat empty would therefore have the SATCHEL dock draw a benched
 * relic as TRINKET III while combat derived no signature from it — a visible
 * drift between two surfaces reading the same save. Back-filling the seat
 * keeps both models at three and keeps them agreeing.
 *
 * ### Why the library is untouched
 *
 * `defaultWorn` on `relic.library.ts` feeds `cloneStartingRelics()`, which
 * also feeds `buildCharacterFromPreset` — and therefore every combat sim and
 * the measured baselines. Changing it there would move balance for a UI
 * finding. The withholding was applied at `createNewGameState()` only (the one
 * real-player origination point, which now seeds nothing at all). Presets,
 * fixtures, mocks and sims keep the exact loadout they have today.
 *
 * ## Settling
 *
 * `FIRST_NODE_RELIC_FLAG` in `GameState.flags` marks the grant settled. It is
 * a value in an array the save already carries, not a new persisted field.
 * `grantFirstNodeRelic` is idempotent and never destroys an item:
 *
 * - flag present            → no-op, `reason: 'already-settled'`
 * - ring already in hand    → stamp the flag, `reason: 'already-owned'`
 *   (this is the `RESET_RUN { keepCharacter: true }` path, which clears
 *   `flags` but keeps the character, and any save migrated up from v23)
 * - otherwise               → hand it over, `reason: 'granted'`
 *
 * Pure. No `GameState` import — this module takes a `Character` and the flag
 * list so `Game/` can depend on `Character/` and not the reverse.
 */

import type { Character } from './types';
import type { Equipment, Item } from '../Items/types';
import { isEquipment, SLOT_CAPACITY } from '../Items/types';
import { getRelicById } from '../Items/relic.library';
import { equipItem, unequipItem } from './equipment.reducer';

/**
 * The relic the first node hands over: the Suppliant's Ring
 * (`grantsSignature: 'sig-disarming-plea'` — "The Open Hand").
 */
export const FIRST_NODE_RELIC_ID = 'relic-disarming-plea';

/**
 * The benched accessory promoted into the ring's seat for the pre-grant
 * window, and displaced back to the bench when the ring lands: the Venom
 * Sigil ("The Oath Kept").
 *
 * The 2026-07-18 owner call benched this relic because The Oath Kept was the
 * least castable signature under the leaner flag-on income. That call is
 * respected: it holds the seat for exactly one node and then goes back to the
 * bench, so the loadout the player fights with is unchanged.
 */
export const STAND_IN_RELIC_ID = 'relic-conviction-strike';

/**
 * Set on `GameState.flags` once the first-node grant has been settled, by
 * whatever route settled it. Absent means pending.
 */
export const FIRST_NODE_RELIC_FLAG = 'first-node-relic-granted';

/** Why `grantFirstNodeRelic` did what it did. */
export type FirstNodeGrantReason = 'granted' | 'already-owned' | 'already-settled';

export interface FirstNodeRelicGrant {
    /** The character after the grant (the same reference when nothing changed). */
    character: Character;
    /** Flags after the grant — always carries `FIRST_NODE_RELIC_FLAG`. */
    flags: readonly string[];
    /**
     * The relic handed over, for the screen that presents it. `null` when
     * nothing changed hands (`already-owned` / `already-settled`).
     */
    granted: Equipment | null;
    /**
     * The relic displaced out of the worn row to make room, returned to the
     * satchel. `null` when nothing was displaced. Never destroyed.
     */
    displaced: Equipment | null;
    reason: FirstNodeGrantReason;
}

/** True when this character/flag pair still owes the player the ring. */
export function isFirstNodeRelicPending(
    character: Character,
    flags: readonly string[],
): boolean {
    if (flags.includes(FIRST_NODE_RELIC_FLAG)) return false;
    return !ownsRelic(character, FIRST_NODE_RELIC_ID);
}

function ownsRelic(character: Character, relicId: string): boolean {
    return character.inventory.some(i => i.id === relicId);
}

function withFlag(flags: readonly string[]): readonly string[] {
    return flags.includes(FIRST_NODE_RELIC_FLAG) ? flags : [...flags, FIRST_NODE_RELIC_FLAG];
}

/**
 * Insert `piece` into `inventory` immediately after the last equipment item
 * sharing its slot that sits inside the worn window, so `wornPerSlot` reports
 * it worn. When the slot has no worn entries yet the piece leads its slot;
 * when the inventory holds no equipment of that slot at all it is appended.
 *
 * Mirrors the ordering `createCharacter` seeds (worn-first per slot) — the
 * convention documented on `Items/equipped.ts`.
 */
function insertIntoWornWindow(inventory: readonly Item[], piece: Equipment): Item[] {
    const capacity = SLOT_CAPACITY[piece.slot];
    let seenInSlot = 0;
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i]!;
        if (!isEquipment(item) || item.slot !== piece.slot) continue;
        seenInSlot++;
        if (seenInSlot >= capacity) {
            // The worn window for this slot is already full at this index —
            // sit immediately before the item that would be pushed out.
            return [...inventory.slice(0, i), piece, ...inventory.slice(i)];
        }
    }
    // Fewer than `capacity` of this slot exist: append after the last one
    // (or at the end when there are none).
    let lastIdx = -1;
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i]!;
        if (isEquipment(item) && item.slot === piece.slot) lastIdx = i;
    }
    const at = lastIdx + 1;
    return [...inventory.slice(0, at), piece, ...inventory.slice(at)];
}

/** Move `relicId` to the end of `inventory` (out of the worn window). */
function benchInInventory(inventory: readonly Item[], relicId: string): Item[] {
    const kept = inventory.filter(i => i.id !== relicId);
    const moved = inventory.filter(i => i.id === relicId);
    return [...kept, ...moved];
}

/**
 * Remove the Suppliant's Ring from a freshly seeded character and back-fill
 * its accessory seat with the stand-in, producing the pre-grant character a
 * fresh run starts from.
 *
 * Returns the character unchanged when the ring is not worn/owned (already
 * withheld, or a caller-chosen loadout that never had it), so this is safe to
 * apply once to any seeded character (`createNewGameState` no longer calls it).
 */
export function withholdFirstNodeRelic(character: Character): Character {
    const accessories = character.equipment.accessories;
    const wornIndex = accessories.findIndex(a => a.id === FIRST_NODE_RELIC_ID);
    if (wornIndex === -1 && !ownsRelic(character, FIRST_NODE_RELIC_ID)) return character;

    let next = character;
    if (wornIndex !== -1) next = unequipItem(next, 'accessory', wornIndex);

    // Drop the ring from inventory entirely — it is not the player's yet.
    next = { ...next, inventory: next.inventory.filter(i => i.id !== FIRST_NODE_RELIC_ID) };

    // Back-fill the freed seat so the worn row stays at capacity and the
    // positional convention keeps agreeing with the engine loadout.
    const alreadyWorn = next.equipment.accessories.some(a => a.id === STAND_IN_RELIC_ID);
    const standIn = alreadyWorn ? undefined : next.inventory.find(
        (i): i is Equipment => isEquipment(i) && i.id === STAND_IN_RELIC_ID,
    );
    if (standIn && next.equipment.accessories.length < SLOT_CAPACITY.accessory) {
        next = {
            ...next,
            inventory: insertIntoWornWindow(
                next.inventory.filter(i => i.id !== STAND_IN_RELIC_ID),
                standIn,
            ),
        };
        next = equipItem(next, standIn);
    }
    return next;
}

/**
 * Hand the Suppliant's Ring to the player. Idempotent, non-destructive, and
 * safe to call on any character/flag pair.
 *
 * When the accessory row is at capacity the stand-in relic is unequipped
 * first and returned to the satchel (never dropped); when some other relic
 * holds the seat, the last worn accessory is displaced instead. When the row
 * has a free position the ring simply fills it and `displaced` is `null`.
 */
export function grantFirstNodeRelic(
    character: Character,
    flags: readonly string[],
): FirstNodeRelicGrant {
    if (flags.includes(FIRST_NODE_RELIC_FLAG)) {
        return {
            character, flags, granted: null, displaced: null, reason: 'already-settled',
        };
    }
    if (ownsRelic(character, FIRST_NODE_RELIC_ID)) {
        // Nothing to hand over — stamp it settled so no later hook re-offers
        // a relic the player is already carrying.
        return {
            character, flags: withFlag(flags), granted: null, displaced: null,
            reason: 'already-owned',
        };
    }

    const ring = getRelicById(FIRST_NODE_RELIC_ID);
    if (!ring) {
        // The relic id is content; if it ever disappears from the library,
        // settle rather than crash a player's run over a missing row.
        return {
            character, flags: withFlag(flags), granted: null, displaced: null,
            reason: 'already-settled',
        };
    }
    // Never alias the library singleton into a mutable character.
    const piece: Equipment = { ...ring, statModifiers: (ring.statModifiers ?? []).map(m => ({ ...m })) };

    let next = character;
    let displaced: Equipment | null = null;

    const accessories = next.equipment.accessories;
    if (accessories.length >= SLOT_CAPACITY.accessory) {
        // Prefer displacing the stand-in that was holding the ring's seat;
        // otherwise take the last worn accessory so the equip cannot no-op.
        const standInIdx = accessories.findIndex(a => a.id === STAND_IN_RELIC_ID);
        const idx = standInIdx === -1 ? accessories.length - 1 : standInIdx;
        displaced = accessories[idx]!;
        next = unequipItem(next, 'accessory', idx);
        // The displaced piece stays owned — push it out of the worn window so
        // the positional convention agrees with the loadout it just left.
        next = { ...next, inventory: benchInInventory(next.inventory, displaced.id) };
    }

    next = { ...next, inventory: insertIntoWornWindow(next.inventory, piece) };
    next = equipItem(next, piece);

    return { character: next, flags: withFlag(flags), granted: piece, displaced, reason: 'granted' };
}
