/**
 * The 11 "signet" relics (Phase 19; extended Phase 85).
 *
 * Signatures no longer come from the player's archetype — they come from WORN
 * equipment. Each relic is an ordinary `Equipment` typed into the Phase-18 slot
 * model (2 weapons, 2 armor, 7 accessories) that grants exactly ONE signature
 * (`grantsSignature`); the two armor relics also add +5 max VITAE. A character wears 1 weapon
 * + 1 armor + 3 of the 7 accessories = 5 worn, so the slot model itself is the
 * wear-cap and the build choice (2 × 2 × C(7,3) = 140 loadouts).
 *
 * These are FIXED content — plain `Equipment` literals with
 * no `rolledMods`, no affixes, no `resourceInteraction`, no
 * `passiveEffects`/procs. They are deliberately NOT routed through `dropItem`
 * (the procedural roll/rarity/affix machinery is being retired in phases 21-23).
 *
 * Relic identity = `grantsSignature !== undefined` (plus the `relic-` id prefix).
 * There is no new item category and no slot marker.
 *
 * The two armor relics carry the first-class `'maxHp'` stat modifier (Phase 19),
 * folded onto `Character.maxHealth` by the equip reducers — no effect involved.
 *
 * Stat pool: +5 maxHp on the two armor relics, nothing else. Any stat a relic
 * adds back feeds S3 scaling (combat reads the stats since S3), so it is a
 * scaling lever, not a flat bonus — that is B1's call.
 *
 * Phase R4 made the signatures placeholders (D47, `plan/revamp/relics.md`):
 * ten raise GUARD 5 for 4◆ and the Suppliant's Ring's The Open Hand is the
 * befriend. Descriptions say what the relic does; the grant itself is printed
 * from `grantsSignature`, so they don't repeat it. `defaultWorn` still names the Phase-19 kit, but that
 * kit is no longer SEEDED into a fresh run (see `Game/game.reducer.ts`
 * `createNewGameState`, owner call 2026-09-23 — the player starts with
 * nothing, earns the ring at the first node, and buys the other ten from the
 * village markets in `World/MapEvents/content.ts`). `cloneStartingRelics`
 * stays the loadout the presets, fixtures and sims are measured against.
 */

import type { Equipment } from './types';
import type { EquipmentLoadout } from '../Character/types';
import type { SignatureSkillId } from '../Combat/combat.encounter.types';

/**
 * A relic definition row. `defaultWorn` marks the fixed starting loadout (1
 * weapon + 1 armor + 3 accessories) — the other 6 relics start in inventory.
 */
interface RelicSpec {
    id: string;
    name: string;
    description: string;
    slot: Equipment['slot'];
    accessoryKind?: Equipment['accessoryKind'];
    grantsSignature: SignatureSkillId;
    /**
     * The +max-VITAE bump (armor relics only). Absent on every other relic,
     * which grants ONLY its signature (`statModifiers: []`).
     */
    stat?: 'maxHp';
    /** The bump's magnitude; ignored when `stat` is absent. */
    value?: number;
    defaultWorn: boolean;
}

/**
 * The 11 relics — the 8 mapping locked in
 * `plan/archive/2026-09-25-trim-t4/plan/phases/phase_19_equipment_granted_signatures.md`, extended by 3 in
 * `plan/archive/2026-09-25-trim-t4/plan/phases/phase_85_equipment_progression.md`. Names / accessory kinds are
 * copy-tunable; the id → signature mapping is 1:1 and load-bearing.
 */
const RELIC_SPECS: readonly RelicSpec[] = [
    // ── Weapons (2) ──────────────────────────────────────────────
    {
        id: 'relic-overwhelming', name: 'Gorgon Brand',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'weapon', grantsSignature: 'sig-overwhelming-argument',
        defaultWorn: true,
    },
    {
        id: 'relic-conclusion', name: 'Capstone Maul',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'weapon', grantsSignature: 'sig-rallying-blow',
        defaultWorn: false,
    },
    // ── Armor (2) — maxHp bumps ───────────────────────────────────────────────
    {
        id: 'relic-read', name: 'Coldglass Aegis',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'armor', grantsSignature: 'sig-read-opponent',
        stat: 'maxHp', value: 5, defaultWorn: true,
    },
    {
        id: 'relic-second-wind', name: 'Ashen Cuirass',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'armor', grantsSignature: 'sig-second-wind',
        stat: 'maxHp', value: 5, defaultWorn: false,
    },
    // ── Accessories (4) ──────────────────────────────────
    {
        id: 'relic-conviction-strike', name: 'Venom Sigil',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'amulet', grantsSignature: 'sig-conviction-strike',
        defaultWorn: false,
    },
    {
        id: 'relic-clever-gambit', name: 'Gambit Chit',
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'charm', grantsSignature: 'sig-clever-gambit',
        defaultWorn: true,
    },
    {
        // Owner call 2026-09-23: the ring is the first-node hand-over and
        // carries NO stat bump — it grants The Open Hand (the befriend, R4) and
        // nothing else.
        id: 'relic-disarming-plea', name: "Suppliant's Ring",
        description: 'Offer a foe that can be befriended the choice of mercy, once it is low enough.',
        slot: 'accessory', accessoryKind: 'ring', grantsSignature: 'sig-disarming-plea',
        defaultWorn: true,
    },
    {
        id: 'relic-press-the-point', name: "Gambler's Knot",
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'charm', grantsSignature: 'sig-press-the-point',
        defaultWorn: true,
    },
    // ── Phase 85 — head/hands/feet accessories (were empty since Phase 19) ───
    {
        id: 'relic-mounting-dread', name: "Cassandra's Circlet",
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'head', grantsSignature: 'sig-mounting-dread',
        defaultWorn: false,
    },
    {
        id: 'relic-endless-labor', name: "Sisyphus's Grip",
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'hands', grantsSignature: 'sig-endless-labor',
        defaultWorn: false,
    },
    {
        id: 'relic-unbroken-stride', name: "Achilles' Greaves",
        description: 'Raise GUARD 5 for 4 Conviction.',
        slot: 'accessory', accessoryKind: 'feet', grantsSignature: 'sig-unbroken-stride',
        defaultWorn: false,
    },
];

/** Build a fresh `Equipment` instance from a relic spec (never aliases). */
function relicFromSpec(spec: RelicSpec): Equipment {
    const relic: Equipment = {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        category: 'equipment',
        slot: spec.slot,
        // A spec without a `stat` is a signature-only relic.
        statModifiers: spec.stat === undefined
            ? []
            : [{ stat: spec.stat, value: spec.value ?? 0 }],
        grantsSignature: spec.grantsSignature,
    };
    if (spec.slot === 'accessory') relic.accessoryKind = spec.accessoryKind;
    return relic;
}

/**
 * The 11 relics as canonical singletons (source of truth). Order is stable:
 * weapons, armor, accessories. Callers that mutate/equip should clone via
 * `cloneStartingRelics` — combat and the equip reducers deep-clone the wearer,
 * but the library itself must never be aliased into a mutable character.
 */
export const relicLibrary: readonly Equipment[] = RELIC_SPECS.map(relicFromSpec);

/** Resolve a relic by id (returns the canonical singleton, not a clone). */
export function getRelicById(id: string): Equipment | undefined {
    return relicLibrary.find(r => r.id === id);
}

/** The relic ids that make up the fixed default worn loadout (1 weapon + 1
 *  armor + 3 accessories), in canonical worn order. */
export const DEFAULT_WORN_RELIC_IDS: readonly string[] =
    RELIC_SPECS.filter(s => s.defaultWorn).map(s => s.id);

/** The relic ids that start in inventory (the other 6). */
export const BENCHED_RELIC_IDS: readonly string[] =
    RELIC_SPECS.filter(s => !s.defaultWorn).map(s => s.id);

/**
 * Fresh deep clones of the starting relics, split into the 5 default-worn (in
 * canonical equip order: weapon, armor, accessories) and the 6 benched. Every
 * call returns brand-new objects so nothing aliases the singleton library.
 */
export function cloneStartingRelics(): { worn: Equipment[]; benched: Equipment[] } {
    const worn: Equipment[] = [];
    const benched: Equipment[] = [];
    for (const spec of RELIC_SPECS) {
        (spec.defaultWorn ? worn : benched).push(relicFromSpec(spec));
    }
    // Canonical worn order: weapon, armor, then accessories (equipItem fills the
    // accessory row first-free, so weapon/armor must lead).
    const rank = (e: Equipment): number => (e.slot === 'weapon' ? 0 : e.slot === 'armor' ? 1 : 2);
    worn.sort((a, b) => rank(a) - rank(b));
    return { worn, benched };
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
