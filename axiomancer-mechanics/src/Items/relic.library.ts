/**
 * The signet relics. A relic is an ordinary `Equipment` that grants exactly
 * ONE signature (`grantsSignature`) while worn; signatures come from worn
 * equipment, not the player's archetype.
 *
 * Relic identity = `grantsSignature !== undefined` (plus the `relic-` id
 * prefix). There is no new item category and no slot marker.
 *
 * There is one: the Suppliant's Ring, handed over at the run's first node
 * (`Character/first-node-grant.ts`).
 */

import type { Equipment } from './types';
import type { EquipmentLoadout } from '../Character/types';
import type { SignatureSkillId } from '../Combat/combat.encounter.types';

/**
 * The relic library — one row: the Suppliant's Ring, the
 * first-node hand-over. It carries no stat line; it grants The Open Hand (the
 * befriend) and nothing else.
 */
const SUPPLIANTS_RING: Equipment = {
    id: 'relic-disarming-plea',
    name: "Suppliant's Ring",
    description: 'Offer a foe that can be befriended the choice of mercy, once it is low enough.',
    category: 'equipment',
    slot: 'accessory',
    accessoryKind: 'ring',
    statModifiers: [],
    grantsSignature: 'sig-disarming-plea',
};

/** A fresh copy of a relic (never aliases the library singleton). */
function cloneRelic(relic: Equipment): Equipment {
    return { ...relic, statModifiers: (relic.statModifiers ?? []).map(m => ({ ...m })) };
}

/**
 * The relics as canonical singletons (source of truth). Callers that
 * mutate/equip should clone via `cloneStartingRelics` — combat and the equip
 * reducers deep-clone the wearer, but the library itself must never be aliased
 * into a mutable character.
 */
export const relicLibrary: readonly Equipment[] = [SUPPLIANTS_RING];

/** Resolve a relic by id (returns the canonical singleton, not a clone). */
export function getRelicById(id: string): Equipment | undefined {
    return relicLibrary.find(r => r.id === id);
}

/**
 * Fresh deep clones of the starting relics, all worn: the kit presets,
 * fixtures and the mock character seed (`createCharacter({ seedStartingRelics })`).
 * Every call returns brand-new objects so nothing aliases the library.
 */
export function cloneStartingRelics(): Equipment[] {
    return relicLibrary.map(cloneRelic);
}

/**
 * The signatures granted by a worn loadout, in stable slot order (weapon, armor,
 * accessories), de-duplicated (first occurrence wins). Replaces
 * `SIGNATURE_KITS[archetype]` at combat-init. An empty loadout yields `[]`
 * (combat legally begins with zero signatures and resolves via cards).
 */
export function getSignaturesForLoadout(loadout: EquipmentLoadout): SignatureSkillId[] {
    const ordered: Equipment[] = [];
    if (loadout.weapon) ordered.push(loadout.weapon);
    if (loadout.armor) ordered.push(loadout.armor);
    for (const a of loadout.accessories) ordered.push(a);

    const out: SignatureSkillId[] = [];
    const seen = new Set<SignatureSkillId>();
    for (const piece of ordered) {
        const sig = piece.grantsSignature;
        if (sig && !seen.has(sig)) {
            seen.add(sig);
            out.push(sig);
        }
    }
    return out;
}
