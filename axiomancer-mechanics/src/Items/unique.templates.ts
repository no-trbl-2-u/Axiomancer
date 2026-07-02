/**
 * Unique Item Templates — Spec 05c stubs, Spec 05d wiring.
 *
 * Seven curated Uniques (two original + five from the 2026-06-07 content
 * pass). `fixedModIds` reference the canonical Spec 05d catalogue
 * (`src/Items/modifier.catalogue.ts`); the factory rolls each ID through the
 * same machinery a procedural mod uses.
 *
 * Spec 05d §8:
 *   - `axioms-edge`   — `['wm-flat-damage', 'wm-body-gen', 'um-paradox-edge']`
 *   - `paradox-loop`  — `['am-stance-res', 'am-proc-boost', 'um-resonance-prime']`
 */

import { UniqueItemTemplate } from './types';

/**
 * The full Unique-item template library. Seven entries; two carry
 * `setMembership` references for the 'embers-of-rebirth' set (Spec 05e).
 */
export const uniqueTemplates: UniqueItemTemplate[] = [
    {
        id: 'axioms-edge',
        name: "Axiom's Edge",
        description: 'A blade that recalls every premise it has cut through. Sings under pressure.',
        slot: 'weapon',
        requiredLevel: 5,
        baseStatModifiers: [
            { stat: 'body',           value: 2 },
            { stat: 'physicalAttack', value: 1 },
        ],
        // Spec 05d §8 — canonical IDs from the catalogue.
        fixedModIds: [
            'wm-flat-damage',     // common procedural — +physicalAttack
            'wm-body-gen',        // uncommon procedural — body/hit generation
            'um-paradox-edge',    // unique-only — double-proc on hit
        ],
    },
    {
        id: 'paradox-loop',
        name: 'Paradox Loop',
        description: 'A circlet that contains a sentence which forever ends without finishing.',
        slot: 'accessory',
        requiredLevel: 15,
        baseStatModifiers: [
            { stat: 'mind', value: 2 },
        ],
        // Spec 05d §8.
        fixedModIds: [
            'am-stance-res',         // uncommon procedural — combat-start mind tokens
            'am-proc-boost',         // rare procedural — luck-driven proc adjacency
            'um-resonance-prime',    // unique-only — combat-start tokens for all stances
        ],
    },
    // ── Content expansion pass 2026-06-07 (mid/late-game uniques) ──
    {
        id: 'gorgon-fang',
        name: 'Gorgon Fang',
        description: 'A dagger whose edge holds a single petrifying glance.',
        slot: 'weapon',
        requiredLevel: 30,
        baseStatModifiers: [
            { stat: 'mentalAttack',   value: 4 },
            { stat: 'physicalAttack', value: 3 },
        ],
        fixedModIds: [
            'wm-mind-rend',       // rare procedural — +mentalAttack + mind vulnerability
            'wm-crit-damage',     // rare procedural — critical damage passive
            'um-gorgon-stare',    // unique-only — gorgon gaze on hit
        ],
        addedIn: '2026-06-07',
        tags: ['unique', 'weapon', 'late-game'],
    },
    {
        id: 'phoenix-mantle',
        name: 'Phoenix Mantle',
        description: 'A cloak of ember-feathers that knits its wearer back together.',
        slot: 'armor',
        requiredLevel: 35,
        setMembership: 'embers-of-rebirth',
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 8 },
            { stat: 'heart',           value: 3 },
        ],
        fixedModIds: [
            'armm-regen',          // rare procedural — regeneration passive
            'armm-aegis',          // rare procedural — barrier proc on defend
            'um-phoenix-heart',    // unique-only — regen + phoenix vigor proc
        ],
        addedIn: '2026-06-07',
        tags: ['unique', 'armor', 'sustain', 'late-game'],
    },
    {
        id: 'prometheus-brand',
        name: "Prometheus' Brand",
        description: 'A torch-headed maul that gifts fire to its wielder and ruin to all else.',
        slot: 'weapon',
        requiredLevel: 25,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 5 },
            { stat: 'body',           value: 3 },
        ],
        fixedModIds: [
            'wm-flat-damage',         // common procedural — +physicalAttack
            'wm-bleeding-edge',       // uncommon procedural — bleed proc
            'um-promethean-spark',    // unique-only — burn + ember dual proc
        ],
        addedIn: '2026-06-07',
        tags: ['unique', 'weapon', 'dot', 'mid-game'],
    },
    {
        id: 'oracle-eye',
        name: 'Oracle Eye',
        description: 'A pendant set with an eye that blinks a heartbeat before the future does.',
        slot: 'accessory',
        requiredLevel: 40,
        baseStatModifiers: [
            { stat: 'mind', value: 4 },
            { stat: 'luck', value: 3 },
        ],
        fixedModIds: [
            'am-all-attunement',     // rare procedural — all base stats
            'am-regen',              // uncommon procedural — regeneration passive
            'um-resonance-prime',    // unique-only — combat-start tokens for all stances
        ],
        addedIn: '2026-06-07',
        tags: ['unique', 'accessory', 'late-game'],
    },
    {
        id: 'titans-girdle',
        name: "Titan's Girdle",
        description: 'A belt of fused alloy plate that makes its wearer immovable.',
        slot: 'body',
        requiredLevel: 45,
        setMembership: 'embers-of-rebirth',
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 11 },
            { stat: 'body',            value: 5 },
        ],
        fixedModIds: [
            'bm-vitality',           // common procedural — +body
            'bm-damage-reduction',   // rare procedural — damage reduction passive
            'bm-thorns-proc',        // uncommon procedural — brazen thorns on defend
        ],
        addedIn: '2026-06-07',
        tags: ['unique', 'body', 'defense', 'late-game'],
    },
];

const uniqueRegistry = new Map<string, UniqueItemTemplate>(
    uniqueTemplates.map(t => [t.id, t]),
);

/** O(1) lookup by Unique template ID. Returns `undefined` for unknown IDs. */
export function getUniqueTemplate(id: string): UniqueItemTemplate | undefined {
    return uniqueRegistry.get(id);
}
