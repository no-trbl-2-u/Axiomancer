/**
 * Hermetic E2E — the spec 32 v3 DEPRECATION contract (the BAN LIST).
 *
 * The v3 keyword reset (spec 32 §3) retired the entire pre-v3 card vocabulary
 * (~126 effect ids) and rebuilt the CARD-side registry as exactly six effects:
 *
 *   debuff_poison · debuff_bleed · debuff_mark · debuff_backfire ·
 *   debuff_rapport · buff_thorns
 *
 * Effect ids that non-card content (items, consumables, the Cards system,
 * enemy passives) still resolves were restored with tags
 * `["support", "non-card"]` — those may EXIST in the library JSONs but may
 * never be referenced by a combat card. Every OTHER old id is gone, and the
 * retired CARD-vocabulary ids below are banned from `cards.library.ts`
 * forever (ids die; they are never renamed).
 */

import { describe, it, expect } from 'vitest';

import debuffsJson from '../debuffs.library.json';
import buffsJson from '../buffs.library.json';
import { lookupEffect } from '../effects.library';
import { cardLibrary } from '../../Cards/cards.library';
import type { Card, CardRider } from '../../Cards/types';
import { EFFECT_INTERACTIONS } from '../amplification.registry';
import { AUTHORED_THREAT_SEQUENCES } from '../../Combat/combat.threat-sequences';

// ─── The canonical card vocabulary (spec 32 v3 §3) ───────────────────────────

// The v3 card vocabulary. The reset (spec 32 v3 §3) rebuilt it as six effects;
// the 2026-07-08 themed-deck rebalance added six THEMED afflictions on top (five
// DoT variants that carry a distinct resist axis / tick behaviour the canonical
// two don't, plus an acute BACKFIRE), all card-referenced by cardType:'spell'
// cards. They are blessed here so the library is honest about what it ships.
// NOTE: these six are slated to be RE-HOMED into the persistent disenchant/curse
// layer (owner direction — Doom/Charmed-style, no tick-down); when that lands,
// they leave the card channel and this set returns to the canonical six.
const CARD_EFFECT_SET = new Set([
    'debuff_poison',
    'debuff_bleed',
    'debuff_mark',
    'debuff_backfire',
    'debuff_rapport',
    'buff_thorns',
    // themed afflictions (pending curse re-home):
    'debuff_argument_wound',
    'debuff_kindling_ember',
    'debuff_foretold_wound',
    'debuff_echo_sting',
    'debuff_nettle_sting',
    'debuff_backfire_acute',
]);

/**
 * Retired card-vocabulary ids (spec 32 v3 §3 "Retired"). These were the
 * pre-v3 card library's working set — every one is banned from the card
 * library forever. Some survive in the JSONs as support/non-card entries
 * (items and the Cards system still resolve them); cards may not touch them.
 */
const RETIRED_CARD_VOCABULARY = [
    // DoT clones
    'debuff_burn', 'debuff_hemorrhage', 'debuff_septic', 'debuff_unraveling',
    'debuff_despair', 'debuff_torment', 'debuff_strong_poison',
    'debuff_strong_burn', 'debuff_acid', 'debuff_frostbite', 'debuff_shock',
    'debuff_tartarus_rot', 'debuff_basilisk_venom', 'debuff_harpy_torment',
    'debuff_hp_decay',
    // the control zoo
    'debuff_stun', 'debuff_sleep', 'debuff_petrify', 'debuff_paralyze',
    'debuff_charm', 'debuff_silence', 'debuff_confusion', 'debuff_fear',
    'debuff_slow', 'debuff_root', 'debuff_daze', 'debuff_blind',
    'debuff_knockdown', 'debuff_berserk', 'debuff_gorgon_gaze',
    'debuff_minotaur_maze', 'debuff_lethe_fog',
    // the stat-down zoo
    'debuff_weaken', 'debuff_enfeeble', 'debuff_sunder', 'debuff_vulnerable',
    'debuff_expose', 'debuff_curse', 'debuff_evasion_down',
    'debuff_accuracy_down', 'debuff_defense_down', 'debuff_fatigue',
    'debuff_exhaustion', 'debuff_wound', 'debuff_disease', 'debuff_hex',
    'debuff_vulnerability_body', 'debuff_vulnerability_mind',
    'debuff_vulnerability_heart', 'debuff_sisyphean_weight',
    'debuff_icarus_descent', 'debuff_hubris_brand', 'debuff_minor_unsteadiness',
    'debuff_dispel', 'debuff_straw_man_echo', 'debuff_post_hoc_tremor',
    'debuff_affirming_consequent',
    // the retired Tier 1 stance layer
    'tier1_body_attack', 'tier1_body_defend', 'tier1_mind_attack',
    'tier1_mind_defend', 'tier1_heart_attack', 'tier1_heart_defend',
    'tier1_mind_mark',
    // the buff zoo (self-buff cards are gone; enchantments replaced them)
    'buff_attack_up', 'buff_defend_up', 'buff_accuracy_up', 'buff_evasion_up',
    'buff_critical_rate_up', 'buff_critical_damage_up', 'buff_haste',
    'buff_regeneration', 'buff_max_hp_up', 'buff_barrier',
    'buff_damage_reduction', 'buff_invincibility', 'buff_taunt',
    'buff_stealth', 'buff_all_stats_up', 'buff_reflect', 'buff_counter',
    'buff_resistance_body', 'buff_resistance_mind', 'buff_resistance_heart',
    'buff_cleanse', 'buff_buff_duration_up', 'buff_status_chance_up',
    'buff_life_steal', 'buff_advantage_body', 'buff_advantage_mind',
    'buff_advantage_heart', 'buff_focus', 'buff_resolute',
    'buff_petitio_pulse', 'buff_gettiters_flicker', 'buff_ad_hoc_patch',
    'buff_open_minded', 'buff_promethean_ember', 'buff_brazen_thorns',
    'buff_oracle_foresight', 'buff_stoic_bulwark', 'buff_minor_fortitude',
    'buff_phoenix_vigor', 'buff_quine_resolve', 'buff_apollonian_clarity',
    'buff_aegis_recursion', 'buff_dionysian_surge',
    'buff_body_attack_up', 'buff_mind_attack_up', 'buff_heart_attack_up',
    'buff_body_defense_up', 'buff_mind_defense_up', 'buff_heart_defense_up',
];

interface LibEntry { id: string; tags?: string[] }
const entries: LibEntry[] = [
    ...(debuffsJson as { debuffs: LibEntry[] }).debuffs,
    ...(buffsJson as { buffs: LibEntry[] }).buffs,
];
const libraryIds = new Set(entries.map(e => e.id));
const supportIds = new Set(
    entries.filter(e => (e.tags ?? []).includes('non-card')).map(e => e.id),
);

/** Every effect id a card can reference, across every reference channel. */
function effectIdsReferencedBy(card: Card): string[] {
    const ids: string[] = [];
    const fromRider = (rider?: CardRider) => {
        if (rider?.applyEffect) ids.push(rider.applyEffect.effectId);
    };
    for (const ce of card.combatEffects ?? []) ids.push(ce.effectId);
    fromRider(card.free);
    fromRider(card.threshold?.rider);
    fromRider(card.dieBonus?.rider);
    fromRider(card.fate?.rider);
    fromRider(card.fallen?.rider);
    for (const m of card.specialMechanics ?? []) {
        if ('rider' in m && m.rider) fromRider(m.rider);
    }
    if (card.synergy?.predicate) ids.push(card.synergy.predicate.effectId);
    if (card.synergy?.applyEffectOnFire) ids.push(card.synergy.applyEffectOnFire.effectId);
    return ids;
}

describe('effect deprecation contract (spec 32 v3 §3) — the ban list', () => {
    it('the six-keyword card set is live in the library and carries the v3 tag', () => {
        for (const id of CARD_EFFECT_SET) {
            const def = lookupEffect(id);
            expect(def, `${id} must exist in the effects library`).toBeDefined();
            expect(def!.tags, `${id} must be tagged v3`).toContain('v3');
        }
    });

    it('every card references ONLY the six-keyword card set (no support, no retired ids)', () => {
        for (const card of cardLibrary) {
            for (const id of effectIdsReferencedBy(card)) {
                expect(
                    CARD_EFFECT_SET.has(id),
                    `${card.id} references '${id}', which is outside the v3 card vocabulary`,
                ).toBe(true);
            }
        }
    });

    it('no retired card-vocabulary id appears anywhere in the card library', () => {
        const retired = new Set(RETIRED_CARD_VOCABULARY);
        for (const card of cardLibrary) {
            for (const id of effectIdsReferencedBy(card)) {
                expect(retired.has(id), `${card.id} uses retired ${id}`).toBe(false);
            }
        }
    });

    it('support-tagged effects may EXIST in the JSONs but are never card-referenced', () => {
        // Existence: support entries stay resolvable forever (items, consumables,
        // the Cards system, and old saves resolve them).
        for (const id of supportIds) {
            expect(lookupEffect(id), `support id ${id} must stay resolvable`).toBeDefined();
        }
        // Exclusivity: support and card sets are disjoint.
        for (const id of CARD_EFFECT_SET) {
            expect(supportIds.has(id), `${id} must not be tagged non-card`).toBe(false);
        }
        // The whole library is exactly card set + support set.
        for (const id of libraryIds) {
            expect(
                CARD_EFFECT_SET.has(id) || supportIds.has(id),
                `${id} is neither v3 card vocabulary nor tagged support/non-card`,
            ).toBe(true);
        }
    });

    it('threat sequences and the combo registry speak only live ids; combos speak only card ids', () => {
        for (const [slug, phases] of Object.entries(AUTHORED_THREAT_SEQUENCES)) {
            for (const p of phases) {
                const id = (p as { threatEffectId?: string }).threatEffectId;
                if (id) expect(libraryIds.has(id), `${slug} threat uses unknown ${id}`).toBe(true);
            }
        }
        for (const combo of EFFECT_INTERACTIONS) {
            const ids = [combo.trigger.primaryEffectId, ...combo.trigger.secondaryEffectIds, combo.result.targetEffectId];
            for (const id of ids) {
                expect(CARD_EFFECT_SET.has(id), `combo ${combo.id} references non-card ${id}`).toBe(true);
            }
        }
    });

    it('every card-vocabulary effect does something the engine reads (no-op regression guard)', () => {
        // The live-channel list the HP engine + Fate Engine actually consume.
        for (const id of CARD_EFFECT_SET) {
            const def = lookupEffect(id)!;
            const p = def.payload;
            const real = !!(p.damageOverTime || p.regeneration || p.actionRestriction
                || (p.rollModifier ?? 0) !== 0 || (p.rollModifierPerIntensity ?? 0) !== 0
                || p.damageTakenMult !== undefined || p.damageTakenMultForStance
                || p.reflectDamage || p.revealsStance
                || p.outgoingDamageMulPct !== undefined || p.powerMulPct !== undefined
                || p.healingReceivedMulPct !== undefined || p.dotModifiers
                || (p as { tickAmplifyFlat?: number }).tickAmplifyFlat
                || (p as { backfirePerRung?: number }).backfirePerRung);
            expect(real, `${id} is a card effect with no engine-read channel`).toBe(true);
        }
    });
});
