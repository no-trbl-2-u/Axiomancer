/**
 * Consumable Library — Spec 05b content.
 *
 * Twenty-two consumables that exercise every leg of the Spec 05 consumable
 * pipeline: immediate `healAmount` and effect-library references via
 * `effectId`.
 *
 * Effect IDs reference the global effects library (`src/Effects/buffs.library.json`,
 * `debuffs.library.json`); unknown IDs are silently skipped by `useConsumableEffect`,
 * so library authors are responsible for keeping references valid.
 *
 * ## Phase 96 — the desperation band on every healing potion
 *
 * All five flat-heal potions (`healing-potion`, `minor-healing-potion`,
 * `greater-healing-potion`, `supreme-healing-potion`, `phoenix-tear`) now carry
 * a `healAmountBelowHalf` at a flat **1.5x** their base `healAmount`, paid when
 * the drinker is under half VITAE. The ratio is uniform on purpose: one rule the
 * player learns once ("potions are worth half again when you are badly hurt")
 * rather than five per-item numbers to memorise.
 *
 * Why the lever exists: a flat heal is worth the same at full health as at
 * death's door, so the dominant play is to hoard the flask and never drink it.
 * Prior art for baking the conditional into the item is Dawncaster's Healing
 * Potion — "Gain 10 HEALTH. If you are below 50% health, gain 15 HEALTH instead"
 * (`kb:dawncaster/0796-healing-potion`, the same 1.5x).
 *
 * Non-healing consumables are deliberately untouched: the lever answers the
 * hoarding incentive on HEALS specifically, and the corpus's other two
 * anti-hoarding levers (an always-good secondary rider, potions as a renewable
 * categorical resource) are separate, larger designs left un-shipped here.
 */

import { Consumable } from './types';

/**
 * The full consumable library for Spec 05b. 22 entries, 11 of them
 * `UNOBTAINABLE_CONSUMABLE_IDS` (kept for old saves only). Quantities
 * default to 1 — callers (shops, loot tables, debug helpers) stack as needed
 * via `stackItem`.
 */
export const consumableLibrary: Consumable[] = [
    {
        id: 'healing-potion',
        name: 'Healing Potion',
        description: 'A clean clay flask of red liquid. Restores moderate HP — more when drunk on the edge of death.',
        category: 'consumable',
        healAmount: 20,
        healAmountBelowHalf: 30,
        quantity: 1,
    },
    {
        id: 'minor-healing-potion',
        name: 'Minor Healing Potion',
        description: 'A small flask, half the strength of a true healing draught. It gives more to those who need it most.',
        category: 'consumable',
        healAmount: 10,
        healAmountBelowHalf: 15,
        quantity: 1,
    },
    {
        id: 'antidote',
        name: 'Antidote',
        description: 'A bitter green tincture. Purges venoms and lingering wounds.',
        category: 'consumable',
        effectId: 'buff_cleanse',
        quantity: 1,
    },
    {
        id: 'clarity-serum',
        name: 'Clarity Serum',
        description: 'A cold colorless serum. Strips a single hindrance from the mind.',
        category: 'consumable',
        // adjust-equipment pass 11 (2026-09-15): previously shared `buff_cleanse`
        // (tier 2, full purge) with antidote, printing byte-identical cleanse
        // lines in three live shops (Herb Trader, Camp Ledgerman, Iron Factor) at
        // different prices — same shop-effect-duplication bug class as issue #307
        // (philosopher-tea/void-essence). Split onto `buff_cleanse_minor` (tier
        // 1): the flavor's "a single hindrance" now maps to a real, narrower
        // payload (tier-1 debuffs only), distinct from antidote's full tier-2
        // purge — reuses the existing tier-scoped cleanse routing, no new engine
        // mechanic.
        effectId: 'buff_cleanse_minor',
        quantity: 1,
    },
    {
        id: 'focus-vial',
        name: 'Focus Vial',
        description: 'A vial of crystalline thought. Sharpens reasoning for a moment.',
        category: 'consumable',
        // adjust-equipment pass 1 (2026-09-04): shipped with none of
        // effectId/inlineEffect/healAmount set — useConsumableEffect applied
        // nothing on use. No per-stat "mind" buff exists in the library, so
        // this maps to the closest generic analogue (precision), same
        // closest-analogue pattern as revive-crystal/phoenix-tear below.
        effectId: 'buff_accuracy_up',
        quantity: 1,
    },
    {
        id: 'heart-draught',
        name: "Heart's Draught",
        description: 'A warm draught that quickens the wearer\'s convictions.',
        category: 'consumable',
        // adjust-equipment pass 1 (2026-09-04): same dead-payload bug as
        // focus-vial. Closest generic analogue for "quickens convictions".
        effectId: 'buff_status_chance_up',
        quantity: 1,
    },
    {
        id: 'body-elixir',
        name: 'Body Elixir',
        description: 'A heavy elixir that locks the muscles into purpose.',
        category: 'consumable',
        // adjust-equipment pass 14 (2026-09-20): previously shared
        // `buff_damage_reduction` (tier 2) with iron-skin-draught, so the
        // Cursed Paladin's loot table printed two byte-identical "GUARD" lines
        // at the same 25% weight — same shop/reward-pool-effect-duplication bug
        // class as issue #307 (philosopher-tea/void-essence) and pass 11
        // (antidote/clarity-serum), surfaced here in a reward table rather than
        // a shop. Split onto the new tier-1 `buff_stoic_resolve` (lesser
        // defenseModifier, no new engine mechanic) — iron-skin-draught's "hardens
        // the skin against blows" keeps the stronger, more literal armor image;
        // body-elixir's vaguer "locks the muscles into purpose" now maps to a
        // real, weaker payload instead of an identical one.
        effectId: 'buff_stoic_resolve',
        quantity: 1,
    },
    {
        id: 'berserker-brew',
        name: 'Berserker Brew',
        description: 'A bitter brown brew. Briefly grants haste and a surge of body resolve.',
        category: 'consumable',
        effectId: 'buff_haste',
        quantity: 1,
    },
    {
        id: 'philosopher-tea',
        name: "Philosopher's Tea",
        description:
            'A slow tea brewed from contradictions. Sharpens the mind and ' +
            'lingers on the tongue as a fresh argument.',
        category: 'consumable',
        // adjust-content pass (2026-09-14, issue #307): previously shared
        // `buff_critical_damage_up` with void-essence, so the shop printed two
        // byte-identical effect lines at different prices. Split onto its own
        // mind-only advantage buff (`buff_liars_gambit`) — the flavor text's
        // "sharpens the mind" now maps to a real, distinct payload. Spec 05b
        // Q3 (B) still holds: consumables grant stance tokens only, no
        // philosophical tokens.
        effectId: 'buff_liars_gambit',
        quantity: 1,
    },
    {
        id: 'resonance-crystal',
        name: 'Resonance Crystal',
        description: 'A three-faced crystal that resonates with body, mind, and heart in equal measure.',
        category: 'consumable',
        // adjust-equipment pass 1 (2026-09-04): same dead-payload bug as
        // focus-vial. buff_all_stats_up (Sorites Ascension: +body/mind/heart)
        // is a direct flavor match, not just a closest analogue.
        effectId: 'buff_all_stats_up',
        quantity: 1,
    },
    {
        id: 'revive-crystal',
        name: 'Revive Crystal',
        description: 'A milky crystal that briefly entangles the bearer with a safer reality.',
        category: 'consumable',
        // No `prevent_ko` effect exists in the global library yet; the closest
        // analog is `buff_invincibility` (1-round immunity), which sells the
        // "negates the next lethal hit" fantasy while keeping the data layer
        // honest. Replace with a bespoke effect when Spec 06+ adds one.
        effectId: 'buff_invincibility',
        quantity: 1,
    },
    {
        id: 'void-essence',
        name: 'Void Essence',
        description:
            'A vial of substance that refuses to be observed. Drinking it ' +
            'leaves the wearer slightly insistent and intensely present.',
        category: 'consumable',
        // adjust-content pass (2026-09-14, issue #307): previously shared
        // `buff_critical_damage_up` with philosopher-tea, so the shop printed
        // two byte-identical effect lines at different prices. Split onto its
        // own heart-only advantage buff (`buff_abyssal_presence`) — heart
        // aligns with the void-essence flavor of staring back at the abyss.
        // Spec 05b Q3 (B) still holds: no philosophical tokens.
        effectId: 'buff_abyssal_presence',
        quantity: 1,
    },
    // ── Content expansion pass 2026-06-07 ──
    {
        id: 'greater-healing-potion',
        name: 'Greater Healing Potion',
        description: 'A deep crimson draught in cut crystal. Restores a great deal of HP, and a great deal more to the badly wounded.',
        category: 'consumable',
        healAmount: 50,
        healAmountBelowHalf: 75,
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'healing', 'mid-game'],
    },
    {
        id: 'supreme-healing-potion',
        name: 'Supreme Healing Potion',
        description: 'A draught of liquid dawn. Closes all but mortal wounds, and answers the mortal ones hardest.',
        category: 'consumable',
        healAmount: 100,
        healAmountBelowHalf: 150,
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'healing', 'late-game'],
    },
    {
        id: 'regeneration-tonic',
        name: 'Regeneration Tonic',
        description: 'A slow green tonic that knits flesh over several breaths.',
        category: 'consumable',
        effectId: 'buff_regeneration',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'sustain'],
    },
    {
        id: 'iron-skin-draught',
        name: 'Iron Skin Draught',
        description: 'A chalky grey draught that hardens the skin against blows.',
        category: 'consumable',
        effectId: 'buff_damage_reduction',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'defense'],
    },
    {
        id: 'whetstone-oil',
        name: 'Whetstone Oil',
        description: 'A keen-smelling oil that sharpens both blade and aim.',
        category: 'consumable',
        effectId: 'buff_critical_rate_up',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'offense', 'crit'],
    },
    {
        id: 'hunters-elixir',
        name: "Hunter's Elixir",
        description: 'A clear elixir that steadies the hand and trues the eye.',
        category: 'consumable',
        effectId: 'buff_accuracy_up',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'offense', 'accuracy'],
    },
    {
        id: 'quicksilver-vial',
        name: 'Quicksilver Vial',
        description: 'A shivering silver liquid that quickens every motion.',
        category: 'consumable',
        effectId: 'buff_haste',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'utility'],
    },
    {
        id: 'phoenix-tear',
        name: 'Phoenix Tear',
        description: 'A single warm bead of ember that wards off the killing blow. It burns brightest for the nearly dead.',
        category: 'consumable',
        // No bespoke prevent-KO effect exists yet; `buff_phoenix_vigor` sells
        // the rebirth fantasy with existing data (see `revive-crystal` note).
        effectId: 'buff_phoenix_vigor',
        healAmount: 40,
        healAmountBelowHalf: 60,
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'healing', 'sustain', 'late-game'],
    },
    {
        id: 'war-horn-draught',
        name: 'War Horn Draught',
        description: 'A roaring brew that floods the body with martial resolve, longer and harder than any lesser tonic.',
        category: 'consumable',
        // adjust-equipment pass 15 (2026-09-21): three consumables shared
        // `buff_haste` byte-for-byte — berserker-brew, quicksilver-vial, and this
        // one — but only this one is tagged 'late-game'. A late-game reward
        // indistinguishable from an early common drop is the same
        // dominated-item complaint pass 11/14 fixed elsewhere, just without the
        // two ever co-occurring in one shop/table to make it visible there.
        // Prior art: the Dawncaster corpus scales its Haste-granting items by
        // rarity rather than treating them as interchangeable — `Haste`
        // [Common] grants 2 Haste flat, `Potion of Alacrity` [Rare] grants 3
        // (kb:dawncaster/0789-haste, kb:dawncaster/1114-potion-of-alacrity).
        // Split onto a new tier-3 `buff_haste_surge` (rollModifier 4 -> 6, the
        // same 1.5x ratio Phase 96 already established for the desperation
        // band) — berserker-brew and quicksilver-vial keep the base `buff_haste`
        // since neither carries a tier tag implying either should be stronger.
        effectId: 'buff_haste_surge',
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'resource', 'late-game'],
    },
    {
        id: 'greater-resonance-crystal',
        name: 'Greater Resonance Crystal',
        description: 'A radiant crystal that floods body, mind, and heart at once.',
        category: 'consumable',
        // adjust-equipment pass 1 (2026-09-04): same dead-payload bug as
        // resonance-crystal. Same effect at intensityOverride 2 (doubles the
        // flat statModifiers, see effect-modifiers.test.ts Q2) so "Greater"
        // is a felt difference, not just a name, per THE BIG NUMBERS REWRITE.
        effectId: 'buff_all_stats_up',
        intensityOverride: 2,
        quantity: 1,
        addedIn: '2026-06-07',
        tags: ['consumable', 'resource', 'late-game'],
    },
];

const consumableRegistry = new Map<string, Consumable>(
    consumableLibrary.map(item => [item.id, item]),
);

/**
 * TRIM THE FAT Tier 0 item 2 (`plan/2026-09-25-trim-the-fat.spec.md`): the
 * eleven consumables whose payload the engine never reads for the player —
 * drinking one does nothing. They stay in `consumableLibrary` so a saved
 * inventory that already holds one still resolves, but no grant surface
 * (shop, loot table, friendship reward, preset, loot cache) may hand one out
 * until D4's stat hooks exist.
 */
export const UNOBTAINABLE_CONSUMABLE_IDS: ReadonlySet<string> = new Set([
    'focus-vial', 'hunters-elixir', 'heart-draught', 'berserker-brew', 'quicksilver-vial',
    'war-horn-draught', 'philosopher-tea', 'void-essence', 'whetstone-oil',
    'resonance-crystal', 'greater-resonance-crystal',
]);

/** The consumables a random-draw grant surface may hand out. */
export const obtainableConsumables: readonly Consumable[] =
    consumableLibrary.filter(c => !UNOBTAINABLE_CONSUMABLE_IDS.has(c.id));

/** O(1) consumable lookup by ID. Returns `undefined` for unknown IDs. */
export function getConsumableById(id: string): Consumable | undefined {
    return consumableRegistry.get(id);
}
