/**
 * Set-item library (Phase 54, per Spec 05e §7).
 *
 * Frozen array of the named sets the player can assemble by equipping
 * matching template instances. Engine code (`set.engine.ts`) iterates
 * this list at every `initializeCombat` + `generateBasicActionResources`
 * call; UI code can also enumerate it for an "active sets" summary.
 *
 * Initial roster:
 *   - Wanderer's Road (2-piece) — light traveller's kit.
 *   - Iron Discipline (3-piece) — physical-training motif.
 *   - Scholar's Circle (2-piece) — focused-study motif.
 *
 * Set members intentionally overlap (e.g. `leather-cap` belongs to all
 * three). A player wearing the right combination can activate partial
 * bonuses from multiple sets at once — covered by the Phase 54 hermetic
 * tests in `src/Items/e2e/sets.engine.test.ts`.
 *
 * Phase 158 — status-centering. Every set's defining payoff now anchors on
 * a status-effect passive (the load-bearing doctrine: status effects are
 * the MAIN fun; flat-stat-stacking gear is a balance failure). Aggressive
 * sets grant `buff_status_chance_up` (your statuses land more often);
 * defensive sets grant `buff_resistance_body/_mind/_heart` (resist enemy
 * statuses). Existing flat-stat + resource-token bonuses are preserved as
 * a secondary floor — the status passive is layered on, not swapped in.
 * These passives ride the same combat-scoped `passiveEffects` path Phase 54
 * already wired (applied at `initializeCombat`, purged at combat end).
 *
 * Adding a set: append a new `ItemSet` literal here, then update
 * `docs/equipment.md` "Set Items" section + a hermetic test if the
 * bonus shape is new. Adding more sets is iterate-tier content
 * authoring, not a phase.
 */

import type { ItemSet } from './set.types';

const wandererRoad: ItemSet = {
    id: 'wanderers-road',
    name: "Wanderer's Road",
    description: "A traveller's lightness of foot and clarity of eye — and a steady heart that shrugs off what would shake another.",
    memberTemplateIds: ['sandals', 'leather-cap'],
    bonuses: {
        2: {
            resourceInteraction: {
                combatStartTokens: { heart: 2 },
            },
            // Status-DEFENSE: a clear head resists heart-targeting afflictions.
            passiveEffects: ['buff_resistance_heart'],
        },
    },
};

const ironDiscipline: ItemSet = {
    id: 'iron-discipline',
    name: 'Iron Discipline',
    description: 'The disciplined training of body over comfort.',
    memberTemplateIds: ['leather-cap', 'cloth-wrap', 'cloth-gloves'],
    bonuses: {
        2: {
            statModifiers: [
                { stat: 'physicalDefense', value: 3 },
            ],
        },
        3: {
            resourceInteraction: {
                generationBonus: [
                    { trigger: 'any', resourceType: 'body', bonus: 1 },
                ],
            },
            // Status-OFFENSE: drilled discipline makes every applied effect bite.
            passiveEffects: ['buff_status_chance_up'],
        },
    },
};

const scholarsCircle: ItemSet = {
    id: 'scholars-circle',
    name: "Scholar's Circle",
    description: "A scholar's focused preparation.",
    memberTemplateIds: ['copper-ring', 'leather-cap'],
    bonuses: {
        2: {
            resourceInteraction: {
                combatStartTokens: { mind: 2 },
            },
            // Status-OFFENSE: precise mind-strikes land their effects more often
            // (keeps the Phase 54 crit-rate signature alongside the new bias).
            passiveEffects: ['buff_critical_rate_up', 'buff_status_chance_up'],
        },
    },
};

// ── Content expansion pass 2026-06-07 ──

const veteransPlate: ItemSet = {
    id: 'veterans-plate',
    name: "Veteran's Plate",
    description: 'Heavy field plate worn by soldiers who expect to come home.',
    memberTemplateIds: ['plate-mail', 'full-helm', 'plate-gauntlets', 'iron-greaves'],
    bonuses: {
        2: {
            statModifiers: [
                { stat: 'physicalDefense', value: 4 },
            ],
        },
        3: {
            resourceInteraction: {
                combatStartTokens: { body: 2 },
            },
        },
        4: {
            // Status-DEFENSE: the unbroken line shrugs off body-targeting
            // afflictions on top of its damage reduction.
            passiveEffects: ['buff_damage_reduction', 'buff_resistance_body'],
        },
    },
};

const sagesRegalia: ItemSet = {
    id: 'sages-regalia',
    name: "Sage's Regalia",
    description: 'The studious vestments of one who reasons faster than they bleed.',
    memberTemplateIds: ['full-helm', 'scaled-coat', 'gold-ring'],
    bonuses: {
        2: {
            statModifiers: [
                { stat: 'mind',          value: 3 },
                { stat: 'mentalDefense', value: 3 },
            ],
        },
        3: {
            resourceInteraction: {
                combatStartTokens: { mind: 3 },
            },
            // Status-DEFENSE: a warded mind throws off mind-targeting effects
            // (alongside the longer-lasting buffs the sage already enjoys).
            passiveEffects: ['buff_buff_duration_up', 'buff_resistance_mind'],
        },
    },
};

const embersOfRebirth: ItemSet = {
    id: 'embers-of-rebirth',
    name: 'Embers of Rebirth',
    description: 'Relics of a flame that refuses to be the last of its kind.',
    memberTemplateIds: ['phoenix-mantle', 'titans-girdle'],
    bonuses: {
        2: {
            passiveEffects: ['buff_regeneration', 'buff_phoenix_vigor'],
            statModifiers: [
                { stat: 'heart', value: 3 },
            ],
        },
    },
};

const skirmishersKit: ItemSet = {
    id: 'skirmishers-kit',
    name: "Skirmisher's Kit",
    description: 'Light gear for those who win by never standing still.',
    memberTemplateIds: ['iron-greaves', 'leather-coat', 'chain-gauntlets'],
    bonuses: {
        2: {
            statModifiers: [
                { stat: 'luck',       value: 2 },
                { stat: 'physicalSave', value: 3 },
            ],
        },
        3: {
            // Status-OFFENSE: the hit-and-run skirmisher afflicts as they slip
            // past, landing effects more often on top of their evasion.
            passiveEffects: ['buff_evasion_up', 'buff_status_chance_up'],
        },
    },
};

/** All named item sets, frozen and iterated in this exact order. */
export const itemSetLibrary: ReadonlyArray<ItemSet> = Object.freeze([
    wandererRoad,
    ironDiscipline,
    scholarsCircle,
    veteransPlate,
    sagesRegalia,
    embersOfRebirth,
    skirmishersKit,
]);

/**
 * O(N) lookup helper. Returns the matching `ItemSet` (frozen) or
 * `undefined` if the id is unknown.
 */
export function getItemSetById(id: string): ItemSet | undefined {
    return itemSetLibrary.find(s => s.id === id);
}
