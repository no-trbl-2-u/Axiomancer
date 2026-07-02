/**
 * Equipment Templates — Spec 05c content (procedural base items + curated
 * affixed variants).
 *
 * Two kinds of library entry live here (Phase 152):
 *
 *   1. **Base templates** — three per equipment slot (early / mid / late at
 *      `requiredLevel` 1 / 10 / 20). These carry only the *base* identity and
 *      stat floor; rarity, rolled modifiers, and the rest of the runtime
 *      instance shape are decided by `dropItem` in `item.factory.ts`.
 *
 *   2. **Curated affixed variants** — five per equipment slot. Each is an
 *      authored prefixed and/or suffixed variant of a base item: it carries a
 *      `prefixId` / `suffixId` pointing into `affix.library`, and the drop
 *      factory stamps that affix provenance (and its mechanical `modIds`) onto
 *      every instance. The dropped instance's player-visible name is composed
 *      via `composeItemName`, so a variant authored from "Iron Blade" with the
 *      "Keen" prefix drops as "Keen Iron Blade".
 *
 * Spec 05c Q5 — Common drops are intentionally weak-but-meaningful: a Common
 * `iron-blade` is a valid starting weapon, not vendor fodder. Progression is
 * gated by `requiredLevel`, not by making low-tier items useless.
 *
 * The exact `baseStatModifiers` figures here are the authoritative floor for
 * each template; Uncommon / Rare / Unique drops layer rolled modifiers from
 * Spec 05d on top, and curated variants layer their pinned affix mods.
 */

import { EquipmentTemplate } from './types';

// ─── Weapons ─────────────────────────────────────────────────────────────────

const weapons: EquipmentTemplate[] = [
    {
        id: 'iron-blade',
        name: 'Iron Blade',
        description: 'A serviceable iron edge. Reliable in any hand.',
        slot: 'weapon',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 2 }],
    },
    {
        id: 'steel-blade',
        name: 'Steel Blade',
        description: 'Folded steel keeps its edge through a longer fight.',
        slot: 'weapon',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'body',           value: 3 },
            { stat: 'physicalAttack', value: 1 },
        ],
    },
    {
        id: 'mithril-blade',
        name: 'Mithril Blade',
        description: 'A blade of starlit alloy. Light enough to feel inevitable.',
        slot: 'weapon',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'body',           value: 4 },
            { stat: 'physicalAttack', value: 2 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'keen-iron-blade',
        name: 'Iron Blade',
        description: 'A serviceable iron edge, ground to a wicked point.',
        slot: 'weapon',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 2 }],
        prefixId: 'pfx-keen',
        addedIn: '2026-06-17',
        tags: ['weapon', 'affixed', 'early-game'],
    },
    {
        id: 'iron-blade-of-the-leech',
        name: 'Iron Blade',
        description: 'A serviceable iron edge that drinks what it cuts.',
        slot: 'weapon',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 2 }],
        suffixId: 'sfx-of-the-leech',
        addedIn: '2026-06-17',
        tags: ['weapon', 'affixed', 'early-game', 'sustain'],
    },
    {
        id: 'vicious-steel-blade',
        name: 'Steel Blade',
        description: 'Folded steel honed for cruelty.',
        slot: 'weapon',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'body',           value: 3 },
            { stat: 'physicalAttack', value: 1 },
        ],
        prefixId: 'pfx-vicious',
        addedIn: '2026-06-17',
        tags: ['weapon', 'affixed', 'mid-game', 'crit'],
    },
    {
        id: 'venomous-mithril-blade-of-frost',
        name: 'Mithril Blade',
        description: 'A starlit alloy blade that bites with venom and frost.',
        slot: 'weapon',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'body',           value: 4 },
            { stat: 'physicalAttack', value: 2 },
        ],
        prefixId: 'pfx-venomous',
        suffixId: 'sfx-of-frost',
        addedIn: '2026-06-17',
        tags: ['weapon', 'affixed', 'late-game', 'status'],
    },
    {
        id: 'savage-mithril-blade-of-ruin',
        name: 'Mithril Blade',
        description: 'A starlit alloy blade that ends arguments and lives alike.',
        slot: 'weapon',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'body',           value: 4 },
            { stat: 'physicalAttack', value: 2 },
        ],
        prefixId: 'pfx-savage',
        suffixId: 'sfx-of-ruin',
        addedIn: '2026-06-17',
        tags: ['weapon', 'affixed', 'late-game', 'crit'],
    },
];

// ─── Armor ───────────────────────────────────────────────────────────────────

const armor: EquipmentTemplate[] = [
    {
        id: 'hide-vest',
        name: 'Hide Vest',
        description: 'Stitched hides, oiled and patched. Honest protection.',
        slot: 'armor',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
    },
    {
        id: 'chain-mail',
        name: 'Chain Mail',
        description: 'A coat of interlocking rings. Heavier than it looks; reassuringly so.',
        slot: 'armor',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 3 },
            { stat: 'body',            value: 1 },
        ],
    },
    {
        id: 'plate-mail',
        name: 'Plate Mail',
        description: 'Articulated plates over mail. Forged for those who hold the line.',
        slot: 'armor',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 5 },
            { stat: 'body',            value: 2 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'hardened-hide-vest',
        name: 'Hide Vest',
        description: 'Stitched hides cured to a board-stiff shell.',
        slot: 'armor',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-hardened',
        addedIn: '2026-06-17',
        tags: ['armor', 'affixed', 'early-game'],
    },
    {
        id: 'hide-vest-of-the-bear',
        name: 'Hide Vest',
        description: 'Stitched hides that lend the wearer a bear\'s stubborn vigour.',
        slot: 'armor',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        suffixId: 'sfx-of-the-bear',
        addedIn: '2026-06-17',
        tags: ['armor', 'affixed', 'early-game'],
    },
    {
        id: 'reinforced-chain-mail',
        name: 'Chain Mail',
        description: 'Ring-mail double-woven across the vitals.',
        slot: 'armor',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 3 },
            { stat: 'body',            value: 1 },
        ],
        prefixId: 'pfx-reinforced',
        addedIn: '2026-06-17',
        tags: ['armor', 'affixed', 'mid-game'],
    },
    {
        id: 'adamant-plate-mail-of-warding',
        name: 'Plate Mail',
        description: 'Unyielding plate scribed with deflective wards.',
        slot: 'armor',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 5 },
            { stat: 'body',            value: 2 },
        ],
        prefixId: 'pfx-adamant',
        suffixId: 'sfx-of-warding',
        addedIn: '2026-06-17',
        tags: ['armor', 'affixed', 'late-game'],
    },
    {
        id: 'sanguine-plate-mail-of-stone',
        name: 'Plate Mail',
        description: 'Plate that wards both the body and the heart.',
        slot: 'armor',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 5 },
            { stat: 'body',            value: 2 },
        ],
        prefixId: 'pfx-sanguine',
        suffixId: 'sfx-of-stone',
        addedIn: '2026-06-17',
        tags: ['armor', 'affixed', 'late-game', 'emotional'],
    },
];

// ─── Head ────────────────────────────────────────────────────────────────────

const head: EquipmentTemplate[] = [
    {
        id: 'leather-cap',
        name: 'Leather Cap',
        description: 'A boiled-leather skullcap.',
        slot: 'head',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
    },
    {
        id: 'chain-coif',
        name: 'Chain Coif',
        description: 'A hood of fine ring-mail. Quiet under a plain hood.',
        slot: 'head',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
    },
    {
        id: 'full-helm',
        name: 'Full Helm',
        description: 'A closed helm with a narrow visor. Reduces the world to the next blow.',
        slot: 'head',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 1 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'warded-leather-cap',
        name: 'Leather Cap',
        description: 'A skullcap stitched with a quiet mind-ward.',
        slot: 'head',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-warded',
        addedIn: '2026-06-17',
        tags: ['head', 'affixed', 'early-game', 'mental'],
    },
    {
        id: 'stoic-leather-cap',
        name: 'Leather Cap',
        description: 'A skullcap that steadies a flinching mind.',
        slot: 'head',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-stoic',
        addedIn: '2026-06-17',
        tags: ['head', 'affixed', 'early-game', 'mental'],
    },
    {
        id: 'sage-chain-coif-of-clarity',
        name: 'Chain Coif',
        description: 'A ring-mail hood that sharpens thought and quiets noise.',
        slot: 'head',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        prefixId: 'pfx-sage',
        suffixId: 'sfx-of-clarity',
        addedIn: '2026-06-17',
        tags: ['head', 'affixed', 'mid-game', 'mental', 'resource'],
    },
    {
        id: 'empathic-chain-coif',
        name: 'Chain Coif',
        description: 'A ring-mail hood attuned to the wearer\'s resolve.',
        slot: 'head',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        prefixId: 'pfx-empathic',
        addedIn: '2026-06-17',
        tags: ['head', 'affixed', 'mid-game', 'emotional'],
    },
    {
        id: 'full-helm-of-insight',
        name: 'Full Helm',
        description: 'A closed helm whose visor seems to read the next blow.',
        slot: 'head',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 1 },
        ],
        suffixId: 'sfx-of-insight',
        addedIn: '2026-06-17',
        tags: ['head', 'affixed', 'late-game', 'mental'],
    },
];

// ─── Body / Chest ────────────────────────────────────────────────────────────

const body: EquipmentTemplate[] = [
    {
        id: 'cloth-wrap',
        name: 'Cloth Wrap',
        description: 'Plain linen wrappings. Better than nothing.',
        slot: 'body',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
    },
    {
        id: 'leather-coat',
        name: 'Leather Coat',
        description: 'A long coat of tanned hide. Lets the wearer move.',
        slot: 'body',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
    },
    {
        id: 'scaled-coat',
        name: 'Scaled Coat',
        description: 'Lacquered scales over heavy fabric. Sheds glancing blows.',
        slot: 'body',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 2 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'fortified-cloth-wrap',
        name: 'Cloth Wrap',
        description: 'Linen wrappings layered for genuine protection.',
        slot: 'body',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-fortified',
        addedIn: '2026-06-17',
        tags: ['body', 'affixed', 'early-game'],
    },
    {
        id: 'stalwart-cloth-wrap-of-the-ox',
        name: 'Cloth Wrap',
        description: 'Wrappings that lend an ox\'s patient endurance.',
        slot: 'body',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-stalwart',
        suffixId: 'sfx-of-the-ox',
        addedIn: '2026-06-17',
        tags: ['body', 'affixed', 'early-game'],
    },
    {
        id: 'provoking-leather-coat',
        name: 'Leather Coat',
        description: 'A hide coat cut to draw every eye on the field.',
        slot: 'body',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        prefixId: 'pfx-provoking',
        addedIn: '2026-06-17',
        tags: ['body', 'affixed', 'mid-game', 'control'],
    },
    {
        id: 'leather-coat-of-resolve',
        name: 'Leather Coat',
        description: 'A hide coat that steels the wearer before the first blow.',
        slot: 'body',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        suffixId: 'sfx-of-resolve',
        addedIn: '2026-06-17',
        tags: ['body', 'affixed', 'mid-game', 'resource'],
    },
    {
        id: 'scaled-coat-of-thorns',
        name: 'Scaled Coat',
        description: 'Lacquered scales that bite the hand that strikes them.',
        slot: 'body',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 2 },
        ],
        suffixId: 'sfx-of-thorns',
        addedIn: '2026-06-17',
        tags: ['body', 'affixed', 'late-game', 'proc'],
    },
];

// ─── Hands ───────────────────────────────────────────────────────────────────

const hands: EquipmentTemplate[] = [
    {
        id: 'cloth-gloves',
        name: 'Cloth Gloves',
        description: 'Padded cloth gloves. They hold a grip.',
        slot: 'hands',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalAttack', value: 1 }],
    },
    {
        id: 'chain-gauntlets',
        name: 'Chain Gauntlets',
        description: 'Mail-backed gauntlets with hardened knuckles.',
        slot: 'hands',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 2 },
            { stat: 'body',           value: 1 },
        ],
    },
    {
        id: 'plate-gauntlets',
        name: 'Plate Gauntlets',
        description: 'Articulated plate over the back of the hand.',
        slot: 'hands',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 3 },
            { stat: 'body',           value: 2 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'crushing-cloth-gloves',
        name: 'Cloth Gloves',
        description: 'Padded gloves weighted for a heavier blow.',
        slot: 'hands',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalAttack', value: 1 }],
        prefixId: 'pfx-crushing',
        addedIn: '2026-06-17',
        tags: ['hands', 'affixed', 'early-game'],
    },
    {
        id: 'calculating-cloth-gloves',
        name: 'Cloth Gloves',
        description: 'Padded gloves that keep the mind ticking over.',
        slot: 'hands',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalAttack', value: 1 }],
        prefixId: 'pfx-calculating',
        addedIn: '2026-06-17',
        tags: ['hands', 'affixed', 'early-game', 'resource'],
    },
    {
        id: 'dazzling-chain-gauntlets',
        name: 'Chain Gauntlets',
        description: 'Bright-knuckled gauntlets that blind on contact.',
        slot: 'hands',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 2 },
            { stat: 'body',           value: 1 },
        ],
        prefixId: 'pfx-dazzling',
        addedIn: '2026-06-17',
        tags: ['hands', 'affixed', 'mid-game', 'status', 'control'],
    },
    {
        id: 'chain-gauntlets-of-precision',
        name: 'Chain Gauntlets',
        description: 'Mail-backed gauntlets tuned for the telling strike.',
        slot: 'hands',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 2 },
            { stat: 'body',           value: 1 },
        ],
        suffixId: 'sfx-of-precision',
        addedIn: '2026-06-17',
        tags: ['hands', 'affixed', 'mid-game', 'crit'],
    },
    {
        id: 'plate-gauntlets-of-the-duelist',
        name: 'Plate Gauntlets',
        description: 'Plated gauntlets that answer every parry in kind.',
        slot: 'hands',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalAttack', value: 3 },
            { stat: 'body',           value: 2 },
        ],
        suffixId: 'sfx-of-the-duelist',
        addedIn: '2026-06-17',
        tags: ['hands', 'affixed', 'late-game', 'proc'],
    },
];

// ─── Feet ────────────────────────────────────────────────────────────────────

const feet: EquipmentTemplate[] = [
    {
        id: 'sandals',
        name: 'Sandals',
        description: 'Plain leather sandals. Quiet on flagstones.',
        slot: 'feet',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
    },
    {
        id: 'leather-boots',
        name: 'Leather Boots',
        description: 'Well-stitched boots, oiled for the road.',
        slot: 'feet',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
    },
    {
        id: 'iron-greaves',
        name: 'Iron Greaves',
        description: 'Plated greaves over heavy boots. Trade speed for ground.',
        slot: 'feet',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 2 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'swift-sandals',
        name: 'Sandals',
        description: 'Sandals that seem to find the ground a step early.',
        slot: 'feet',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-swift',
        addedIn: '2026-06-17',
        tags: ['feet', 'affixed', 'early-game', 'evasion'],
    },
    {
        id: 'lucky-sandals-of-the-fox',
        name: 'Sandals',
        description: 'Sandals worn by those the dice seem to favour.',
        slot: 'feet',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'physicalDefense', value: 1 }],
        prefixId: 'pfx-lucky',
        suffixId: 'sfx-of-the-fox',
        addedIn: '2026-06-17',
        tags: ['feet', 'affixed', 'early-game', 'luck'],
    },
    {
        id: 'vanguard-leather-boots',
        name: 'Leather Boots',
        description: 'Road boots cut for those who reach the line first.',
        slot: 'feet',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        prefixId: 'pfx-vanguard',
        addedIn: '2026-06-17',
        tags: ['feet', 'affixed', 'mid-game', 'initiative'],
    },
    {
        id: 'leather-boots-of-momentum',
        name: 'Leather Boots',
        description: 'Road boots that carry their own momentum.',
        slot: 'feet',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 2 },
            { stat: 'body',            value: 1 },
        ],
        suffixId: 'sfx-of-momentum',
        addedIn: '2026-06-17',
        tags: ['feet', 'affixed', 'mid-game', 'initiative'],
    },
    {
        id: 'phantom-iron-greaves-of-shadows',
        name: 'Iron Greaves',
        description: 'Greaves that blur the wearer into the field\'s shadows.',
        slot: 'feet',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'physicalDefense', value: 4 },
            { stat: 'body',            value: 2 },
        ],
        prefixId: 'pfx-phantom',
        suffixId: 'sfx-of-shadows',
        addedIn: '2026-06-17',
        tags: ['feet', 'affixed', 'late-game', 'evasion'],
    },
];

// ─── Accessory ───────────────────────────────────────────────────────────────

const accessory: EquipmentTemplate[] = [
    {
        id: 'copper-ring',
        name: 'Copper Ring',
        description: 'A plain copper band, warm against the skin.',
        slot: 'accessory',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 1 }],
    },
    {
        id: 'silver-ring',
        name: 'Silver Ring',
        description: 'A silver band etched with a quiet sigil.',
        slot: 'accessory',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'body',  value: 1 },
            { stat: 'mind',  value: 1 },
        ],
    },
    {
        id: 'gold-ring',
        name: 'Gold Ring',
        description: 'A heavy gold band cast for a forgotten oath.',
        slot: 'accessory',
        requiredLevel: 20,
        baseStatModifiers: [
            { stat: 'body',  value: 2 },
            { stat: 'mind',  value: 2 },
            { stat: 'heart', value: 1 },
        ],
    },
    // ── Curated affixed variants (Phase 152) ──
    {
        id: 'balanced-copper-ring',
        name: 'Copper Ring',
        description: 'A copper band that steadies every faculty at once.',
        slot: 'accessory',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 1 }],
        prefixId: 'pfx-balanced',
        addedIn: '2026-06-17',
        tags: ['accessory', 'affixed', 'early-game', 'utility'],
    },
    {
        id: 'copper-ring-of-the-heart',
        name: 'Copper Ring',
        description: 'A copper band warm with the wearer\'s own resolve.',
        slot: 'accessory',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 1 }],
        suffixId: 'sfx-of-the-heart',
        addedIn: '2026-06-17',
        tags: ['accessory', 'affixed', 'early-game', 'emotional'],
    },
    {
        id: 'copper-ring-of-fortune',
        name: 'Copper Ring',
        description: 'A copper band that the lucky never seem to lose.',
        slot: 'accessory',
        requiredLevel: 1,
        baseStatModifiers: [{ stat: 'body', value: 1 }],
        suffixId: 'sfx-of-fortune',
        addedIn: '2026-06-17',
        tags: ['accessory', 'affixed', 'early-game', 'luck'],
    },
    {
        id: 'resonant-silver-ring',
        name: 'Silver Ring',
        description: 'A silver band that hums in tune with every stance.',
        slot: 'accessory',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'body',  value: 1 },
            { stat: 'mind',  value: 1 },
        ],
        prefixId: 'pfx-resonant',
        addedIn: '2026-06-17',
        tags: ['accessory', 'affixed', 'mid-game', 'resource'],
    },
    {
        id: 'silver-ring-of-resilience',
        name: 'Silver Ring',
        description: 'A silver band that hardens the wearer against the worst.',
        slot: 'accessory',
        requiredLevel: 10,
        baseStatModifiers: [
            { stat: 'body',  value: 1 },
            { stat: 'mind',  value: 1 },
        ],
        suffixId: 'sfx-of-resilience',
        addedIn: '2026-06-17',
        tags: ['accessory', 'affixed', 'mid-game', 'defense'],
    },
];

/**
 * The full equipment template library for Spec 05c (Phase 152 shape):
 * 3 base templates + 5 curated affixed variants per slot × 7 slots = 56 entries.
 */
export const equipmentTemplates: EquipmentTemplate[] = [
    ...weapons,
    ...armor,
    ...head,
    ...body,
    ...hands,
    ...feet,
    ...accessory,
];

const templateRegistry = new Map<string, EquipmentTemplate>(
    equipmentTemplates.map(t => [t.id, t]),
);

/** O(1) lookup by template ID. Returns `undefined` for unknown IDs. */
export function getEquipmentTemplate(id: string): EquipmentTemplate | undefined {
    return templateRegistry.get(id);
}

/** Templates filtered by slot, sorted by `requiredLevel` ascending. */
export function getTemplatesBySlot(
    slot: EquipmentTemplate['slot'],
): EquipmentTemplate[] {
    return equipmentTemplates
        .filter(t => t.slot === slot)
        .slice()
        .sort((a, b) => a.requiredLevel - b.requiredLevel);
}
