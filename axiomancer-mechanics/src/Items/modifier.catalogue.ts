/**
 * Modifier Catalogue — Spec 05d content (minimum viable).
 *
 * Seven slot-keyed pools + one unique-only pool. Each `Modifier` is a static
 * data object — no functions on the modifier (Q1) — so the whole catalogue is
 * serialisable for save files and Spec 11's seeded-RNG harness.
 *
 * Substitution at resolve time (Spec 05d Q3):
 *   - `value: 0`  in `payload.statModifiers`               → rolled value
 *   - `bonus: 0`  in `payload.resourceInteraction.generationBonus`  → rolled value
 *   - `0` keys    in `payload.resourceInteraction.combatStartTokens` → rolled value
 *   - `passiveEffects` / `onHitEffects` / `onDefendEffects` are presence-only
 *     (the rolled value is a presence marker; the array is concatenated as-is).
 *
 * Effect-ID references resolve against the global effects library
 * (`src/Effects/buffs.library.json`, `debuffs.library.json`). Where the spec's
 * suggested payload (e.g. "reflectDamage +N", "expose proc chance +N%") has no
 * direct primitive in the engine today, the catalogue maps to the closest
 * existing effect — see the per-mod comments. Future engine work can swap the
 * mapping without changing IDs.
 *
 * Q4 — `uniqueModPool` is *never* drawn by the procedural roll path. The
 * factory only resolves these IDs when `UniqueItemTemplate.fixedModIds`
 * references them.
 */

import { EquipmentSlot } from './types';
import { Modifier, ModValueTier } from './modifier.types';

// ─── Weapon pool ─────────────────────────────────────────────────────────────

export const weaponModPool: Modifier[] = [
    {
        id: 'wm-flat-damage',
        name: 'Keen Edge',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 3] },
            { levelReq: 10, range: [4, 8] },
            { levelReq: 20, range: [9, 15] },
            { levelReq: 30, range: [16, 24] },
            { levelReq: 40, range: [25, 35] },
            { levelReq: 50, range: [36, 50] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalAttack', value: 0 }],
        },
    },
    {
        id: 'wm-lifesteal',
        name: 'Vampiric Strike',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [2, 3] },
            { levelReq: 20, range: [3, 5] },
        ],
        // `buff_life_steal` — wearer regenerates a fraction of damage dealt.
        payload: {
            onHitEffects: [{
                effectId: 'buff_life_steal',
                target: 'self',
                baseChance: 0.35,
                tier: 2,
            }],
        },
    },
    {
        id: 'wm-body-gen',
        name: 'Body Resonance',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'hit', resourceType: 'body', bonus: 0 }],
            },
        },
    },
    {
        id: 'wm-exploit',
        name: 'Exploit Weakness',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [2, 4] },
            { levelReq: 20, range: [5, 8] },
        ],
        // Stat boost is parameterised by the rolled value; the proc chance is
        // a fixed fraction (Spec 05d's "+N% chance" is a design intent —
        // implementing it as a per-mod scalable chance is deferred until the
        // proc engine supports value-templated `baseChance`).
        payload: {
            statModifiers: [{ stat: 'physicalAttack', value: 0 }],
            onHitEffects: [{
                effectId: 'debuff_vulnerability_body',
                target: 'opponent',
                baseChance: 0.20,
                tier: 2,
            }],
        },
    },
    // ── Content expansion 2026-06-07 ──
    {
        id: 'wm-skill-edge',
        name: 'Honed Technique',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [3, 5] },
            { levelReq: 20, range: [6, 10] },
            { levelReq: 30, range: [11, 16] },
            { levelReq: 40, range: [17, 24] },
            { levelReq: 50, range: [25, 34] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalSkill', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense'],
    },
    {
        id: 'wm-crit-rate',
        name: 'Cruel Point',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_critical_rate_up'],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'crit'],
    },
    {
        id: 'wm-crit-damage',
        name: 'Savage Bite',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_critical_damage_up'],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'crit'],
    },
    {
        id: 'wm-mind-rend',
        name: 'Mind Render',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 20, range: [3, 6] },
            { levelReq: 30, range: [7, 11] },
            { levelReq: 40, range: [12, 18] },
            { levelReq: 50, range: [19, 27] },
        ],
        payload: {
            statModifiers: [{ stat: 'mentalAttack', value: 0 }],
            onHitEffects: [{
                effectId: 'debuff_vulnerability_mind',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'mental'],
    },
    // ── Content expansion pass 2026-06-07 (new weapon mods) ──
    {
        id: 'wm-heart-rend',
        name: 'Heart Cleaver',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [2, 5] },
            { levelReq: 30, range: [6, 10] },
            { levelReq: 40, range: [11, 16] },
            { levelReq: 50, range: [17, 24] },
        ],
        payload: {
            statModifiers: [{ stat: 'emotionalAttack', value: 0 }],
            onHitEffects: [{
                effectId: 'debuff_vulnerability_heart',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'emotional'],
    },
    {
        id: 'wm-bleeding-edge',
        name: 'Bleeding Edge',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_bleed',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'dot'],
    },
    {
        id: 'wm-accuracy',
        name: 'True Aim',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_accuracy_up'],
        },
        addedIn: '2026-06-07',
        tags: ['weapon', 'offense', 'accuracy'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'wm-venom-coat',
        name: 'Venomous Coating',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_poison',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-frost-brand',
        name: 'Frostbrand',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_frostbite',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-storm-edge',
        name: 'Storm Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_shock',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-dazing-pommel',
        name: 'Dazing Pommel',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_daze',
                target: 'opponent',
                baseChance: 0.20,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-mind-gen',
        name: 'Insightful Hilt',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'hit', resourceType: 'mind', bonus: 0 }],
            },
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'resource'],
    },
    {
        id: 'wm-status-amp',
        name: 'Catalytic Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_status_chance_up'],
        },
        addedIn: '2026-06-16',
        tags: ['weapon', 'status'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    // New status families wired to the existing debuff library so the affix
    // layer can grow its prefix/suffix pools around them. Each is a presence
    // proc (tier 2/3) mirroring the 2026-06-16 status mods.
    {
        id: 'wm-slowing',
        name: 'Hobbling Edge',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_slow',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-marking',
        name: 'Hunter\'s Notch',
        hiddenRarity: 'common_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_mark',
                target: 'opponent',
                baseChance: 0.35,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'utility'],
    },
    {
        id: 'wm-immolate',
        name: 'Immolating Brand',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_burn',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-rending',
        name: 'Rending Edge',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_wound',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-plague-edge',
        name: 'Plague Edge',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_disease',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-withering',
        name: 'Withering Edge',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_hp_decay',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-heartbreak',
        name: 'Heartbreak Edge',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_vulnerability_heart',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'emotional'],
    },
    {
        id: 'wm-toxic-edge',
        name: 'Toxic Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_strong_poison',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'dot'],
    },
    {
        id: 'wm-concussive',
        name: 'Concussive Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_stun',
                target: 'opponent',
                baseChance: 0.15,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-petrifying',
        name: 'Petrifying Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 25, range: [1, 1] },
            { levelReq: 45, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_petrify',
                target: 'opponent',
                baseChance: 0.12,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-terrorize',
        name: 'Terrorizing Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_fear',
                target: 'opponent',
                baseChance: 0.20,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'mental', 'control'],
    },
    {
        id: 'wm-cursed-edge',
        name: 'Cursed Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_curse',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status'],
    },
    {
        id: 'wm-soporific',
        name: 'Soporific Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_sleep',
                target: 'opponent',
                baseChance: 0.18,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status', 'control'],
    },
    {
        id: 'wm-hexing',
        name: 'Hexing Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_hex',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['weapon', 'status'],
    },
];

// ─── Head pool ───────────────────────────────────────────────────────────────

export const headModPool: Modifier[] = [
    {
        id: 'hm-max-hp',
        name: 'Resilient Mind',
        hiddenRarity: 'common_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 1,  range: [5, 15] },
            { levelReq: 10, range: [16, 35] },
            { levelReq: 20, range: [36, 60] },
            { levelReq: 30, range: [61, 90] },
            { levelReq: 40, range: [91, 130] },
            { levelReq: 50, range: [131, 180] },
        ],
        // `EffectStatTarget` has no `maxHp` today — the closest primitive is
        // the `buff_max_hp_up` passive. The rolled value is a presence marker
        // until the engine supports per-mod intensity overrides for passives.
        payload: {
            passiveEffects: ['buff_max_hp_up'],
        },
    },
    {
        id: 'hm-mind-gen',
        name: 'Clear Thought',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'any', resourceType: 'mind', bonus: 0 }],
            },
        },
    },
    {
        id: 'hm-effect-dur',
        name: 'Focused Channel',
        hiddenRarity: 'rare_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_buff_duration_up'],
        },
    },
    // ── Content expansion pass 2026-06-07 (new head mods) ──
    {
        id: 'hm-mental-defense',
        name: 'Warded Crown',
        hiddenRarity: 'common_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 1,  range: [2, 5] },
            { levelReq: 10, range: [6, 12] },
            { levelReq: 20, range: [13, 22] },
            { levelReq: 30, range: [23, 34] },
            { levelReq: 40, range: [35, 48] },
            { levelReq: 50, range: [49, 64] },
        ],
        payload: {
            statModifiers: [{ stat: 'mentalDefense', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['head', 'defense', 'mental'],
    },
    {
        id: 'hm-insight',
        name: 'Insightful',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 5,  range: [1, 2] },
            { levelReq: 20, range: [3, 5] },
            { levelReq: 35, range: [6, 9] },
            { levelReq: 50, range: [10, 14] },
        ],
        payload: {
            statModifiers: [{ stat: 'mentalSkill', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['head', 'offense', 'mental'],
    },
    {
        id: 'hm-foresight',
        name: 'Oracle Sight',
        hiddenRarity: 'rare_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_accuracy_up'],
        },
        addedIn: '2026-06-07',
        tags: ['head', 'utility', 'accuracy'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'hm-effect-duration',
        name: 'Lingering Sigil',
        hiddenRarity: 'rare_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_buff_duration_up'],
        },
        addedIn: '2026-06-16',
        tags: ['head', 'status', 'utility'],
    },
    {
        id: 'hm-mind-resist',
        name: 'Stoic Mind',
        hiddenRarity: 'common_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_resistance_mind'],
        },
        addedIn: '2026-06-16',
        tags: ['head', 'defense', 'mental'],
    },
    {
        id: 'hm-heart-focus',
        name: 'Empathic Crown',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 15, range: [3, 5] },
            { levelReq: 30, range: [6, 9] },
            { levelReq: 45, range: [10, 14] },
        ],
        payload: {
            statModifiers: [{ stat: 'heart', value: 0 }],
        },
        addedIn: '2026-06-16',
        tags: ['head', 'emotional', 'utility'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    {
        id: 'hm-oracle',
        name: 'Oracle\'s Eye',
        hiddenRarity: 'rare_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_oracle_foresight'],
        },
        addedIn: '2026-06-18',
        tags: ['head', 'utility', 'mental'],
    },
    {
        id: 'hm-open-mind',
        name: 'Open Mind',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['head'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_open_minded'],
        },
        addedIn: '2026-06-18',
        tags: ['head', 'utility', 'mental'],
    },
];

// ─── Body / Chest pool ───────────────────────────────────────────────────────

export const bodyModPool: Modifier[] = [
    {
        id: 'bm-armor',
        name: 'Fortified',
        hiddenRarity: 'common_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 1,  range: [2, 5] },
            { levelReq: 10, range: [6, 12] },
            { levelReq: 20, range: [13, 22] },
            { levelReq: 30, range: [23, 34] },
            { levelReq: 40, range: [35, 48] },
            { levelReq: 50, range: [49, 64] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalDefense', value: 0 }],
        },
    },
    {
        id: 'bm-heart-gen',
        name: 'Steady Heart',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'defend', resourceType: 'heart', bonus: 0 }],
            },
        },
    },
    {
        id: 'bm-reflect',
        name: 'Thorned',
        hiddenRarity: 'rare_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 10, range: [1, 3] },
            { levelReq: 20, range: [4, 7] },
        ],
        // No `reflectDamage` stat in `EffectStatTarget`; modelled as the
        // `buff_reflect` passive. Rolled value is a presence marker today.
        payload: {
            passiveEffects: ['buff_reflect'],
        },
    },
    // ── Content expansion pass 2026-06-07 (new body mods) ──
    {
        id: 'bm-vitality',
        name: 'Stalwart',
        hiddenRarity: 'common_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [3, 5] },
            { levelReq: 20, range: [6, 9] },
            { levelReq: 30, range: [10, 14] },
            { levelReq: 40, range: [15, 20] },
            { levelReq: 50, range: [21, 28] },
        ],
        payload: {
            statModifiers: [{ stat: 'body', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['body', 'defense'],
    },
    {
        id: 'bm-damage-reduction',
        name: 'Bulwark',
        hiddenRarity: 'rare_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_damage_reduction'],
        },
        addedIn: '2026-06-07',
        tags: ['body', 'defense'],
    },
    {
        id: 'bm-thorns-proc',
        name: 'Brazen Thorns',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_brazen_thorns',
                target: 'self',
                baseChance: 0.35,
                tier: 2,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['body', 'defense', 'proc'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'bm-taunt-proc',
        name: 'Provoking Plate',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_taunt',
                target: 'self',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['body', 'defense', 'control'],
    },
    {
        id: 'bm-barrier-proc',
        name: 'Wardweave',
        hiddenRarity: 'rare_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_barrier',
                target: 'self',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['body', 'defense', 'proc'],
    },
    {
        id: 'bm-heart-start',
        name: 'Resolute Bearing',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 20, range: [2, 4] },
        ],
        payload: {
            resourceInteraction: {
                combatStartTokens: { heart: 0 },
            },
        },
        addedIn: '2026-06-16',
        tags: ['body', 'resource'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    {
        id: 'bm-defend-up',
        name: 'Bracing Plate',
        hiddenRarity: 'common_mod',
        validSlots: ['body'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_defend_up'],
        },
        addedIn: '2026-06-18',
        tags: ['body', 'defense'],
    },
];

// ─── Hands pool ──────────────────────────────────────────────────────────────

export const handsModPool: Modifier[] = [
    {
        id: 'hndm-body-gen',
        name: 'Iron Grip',
        hiddenRarity: 'common_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 2] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'hit', resourceType: 'body', bonus: 0 }],
            },
        },
    },
    {
        id: 'hndm-crit',
        name: 'Precise Hands',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [3, 5] },
            { levelReq: 20, range: [6, 9] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalSkill', value: 0 }],
        },
    },
    {
        id: 'hndm-block',
        name: 'Shield Training',
        hiddenRarity: 'rare_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 5, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_damage_reduction',
                target: 'self',
                baseChance: 0.40,
                tier: 2,
            }],
        },
    },
    // ── Content expansion pass 2026-06-07 (new hands mods) ──
    {
        id: 'hndm-strength',
        name: 'Crushing Grasp',
        hiddenRarity: 'common_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 1,  range: [1, 3] },
            { levelReq: 10, range: [4, 7] },
            { levelReq: 20, range: [8, 13] },
            { levelReq: 30, range: [14, 20] },
            { levelReq: 40, range: [21, 29] },
            { levelReq: 50, range: [30, 40] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalAttack', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['hands', 'offense'],
    },
    {
        id: 'hndm-crit-rate',
        name: 'Deft Fingers',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_critical_rate_up'],
        },
        addedIn: '2026-06-07',
        tags: ['hands', 'offense', 'crit'],
    },
    {
        id: 'hndm-counter',
        name: 'Riposte Form',
        hiddenRarity: 'rare_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_counter',
                target: 'self',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['hands', 'defense', 'proc'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'hndm-disarm',
        name: 'Disarming Grip',
        hiddenRarity: 'rare_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_silence',
                target: 'opponent',
                baseChance: 0.20,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-blinding',
        name: 'Blinding Flurry',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_blind',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-16',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-mind-gen',
        name: 'Calculating Hands',
        hiddenRarity: 'common_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [{ trigger: 'hit', resourceType: 'mind', bonus: 0 }],
            },
        },
        addedIn: '2026-06-16',
        tags: ['hands', 'resource'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    {
        id: 'hndm-sap',
        name: 'Sapping Grip',
        hiddenRarity: 'common_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_fatigue',
                target: 'opponent',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-hobbling',
        name: 'Ensnaring Grip',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_root',
                target: 'opponent',
                baseChance: 0.20,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-toppling',
        name: 'Toppling Strike',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_knockdown',
                target: 'opponent',
                baseChance: 0.20,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-enfeeble',
        name: 'Enfeebling Grip',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_exhaustion',
                target: 'opponent',
                baseChance: 0.25,
                tier: 2,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['hands', 'status', 'control'],
    },
    {
        id: 'hndm-enthrall',
        name: 'Enthralling Touch',
        hiddenRarity: 'rare_mod',
        validSlots: ['hands'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            onHitEffects: [{
                effectId: 'debuff_charm',
                target: 'opponent',
                baseChance: 0.15,
                tier: 3,
            }],
        },
        addedIn: '2026-06-18',
        tags: ['hands', 'status', 'emotional', 'control'],
    },
];

// ─── Feet pool ───────────────────────────────────────────────────────────────

export const feetModPool: Modifier[] = [
    {
        id: 'fm-evasion',
        name: 'Swift Feet',
        hiddenRarity: 'common_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 1,  range: [1, 3] },
            { levelReq: 10, range: [4, 7] },
            { levelReq: 20, range: [8, 12] },
            { levelReq: 30, range: [13, 18] },
            { levelReq: 40, range: [19, 26] },
            { levelReq: 50, range: [27, 36] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalSave', value: 0 }],
        },
    },
    {
        id: 'fm-cs-tokens',
        name: 'Ready Stride',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 10, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        // Per Spec 05d "one resource type, designer's choice per template" —
        // catalogue picks `body`. Future per-template variants can replace
        // this entry with a heart- or mind-flavoured sibling.
        payload: {
            resourceInteraction: {
                combatStartTokens: { body: 0 },
            },
        },
    },
    {
        id: 'fm-initiative',
        name: 'First Step',
        hiddenRarity: 'rare_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 5,  range: [1, 3] },
            { levelReq: 20, range: [4, 7] },
        ],
        payload: {
            statModifiers: [{ stat: 'luck', value: 0 }],
        },
    },
    // ── Content expansion pass 2026-06-07 (new feet mods) ──
    {
        id: 'fm-evasion-proc',
        name: 'Phantom Step',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_evasion_up'],
        },
        addedIn: '2026-06-07',
        tags: ['feet', 'defense', 'evasion'],
    },
    {
        id: 'fm-physical-save',
        name: 'Sure Footing',
        hiddenRarity: 'common_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 1,  range: [2, 4] },
            { levelReq: 15, range: [5, 9] },
            { levelReq: 30, range: [10, 16] },
            { levelReq: 45, range: [17, 25] },
            { levelReq: 50, range: [26, 34] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalSave', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['feet', 'defense'],
    },
    {
        id: 'fm-haste',
        name: 'Fleetfoot',
        hiddenRarity: 'rare_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_haste'],
        },
        addedIn: '2026-06-07',
        tags: ['feet', 'utility'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'fm-stealth',
        name: 'Shadowstep',
        hiddenRarity: 'rare_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_stealth'],
        },
        addedIn: '2026-06-16',
        tags: ['feet', 'utility', 'evasion'],
    },
    {
        id: 'fm-initiative-tokens',
        name: 'Vanguard Stride',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 2] },
        ],
        payload: {
            resourceInteraction: {
                combatStartTokens: { mind: 0 },
            },
        },
        addedIn: '2026-06-16',
        tags: ['feet', 'resource', 'initiative'],
    },
    {
        id: 'fm-luck',
        name: 'Fortune\'s Tread',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['feet'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 20, range: [3, 5] },
            { levelReq: 40, range: [6, 9] },
        ],
        payload: {
            statModifiers: [{ stat: 'luck', value: 0 }],
        },
        addedIn: '2026-06-16',
        tags: ['feet', 'utility', 'luck'],
    },
];

// ─── Accessory pool ──────────────────────────────────────────────────────────

export const accessoryModPool: Modifier[] = [
    {
        id: 'am-cross-stat',
        name: 'Balanced Focus',
        hiddenRarity: 'common_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [2, 4] },
            { levelReq: 20, range: [4, 7] },
            { levelReq: 30, range: [8, 11] },
            { levelReq: 40, range: [12, 16] },
            { levelReq: 50, range: [17, 22] },
        ],
        // Two different stats, each receiving the rolled value (both sentinels
        // resolve to the same N — Spec 05d's "+N each" reading).
        payload: {
            statModifiers: [
                { stat: 'body', value: 0 },
                { stat: 'mind', value: 0 },
            ],
        },
    },
    {
        id: 'am-stance-res',
        name: 'Resonant Stone',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [2, 3] },
            { levelReq: 20, range: [3, 4] },
        ],
        // Picks `mind` as the stance the catalogue grants. Sibling variants
        // can be added later for body / heart flavours.
        payload: {
            resourceInteraction: {
                combatStartTokens: { mind: 0 },
            },
        },
    },
    {
        id: 'am-proc-boost',
        name: 'Catalyst Charm',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 10, range: [5, 10] },
            { levelReq: 20, range: [11, 20] },
        ],
        // Spec 05d's "increases baseChance of existing onHitEffects by N%"
        // is a meta-mod operating on other equipment. With data-only payloads
        // (Q1) that needs a proc-boost engine pass; until then the rolled
        // value buffs `luck`, which already feeds proc-adjacent rolls.
        payload: {
            statModifiers: [{ stat: 'luck', value: 0 }],
        },
    },
    // ── Content expansion pass 2026-06-07 (new accessory mods) ──
    {
        id: 'am-heart-focus',
        name: 'Heartstone',
        hiddenRarity: 'common_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 15, range: [3, 5] },
            { levelReq: 30, range: [6, 9] },
            { levelReq: 45, range: [10, 14] },
            { levelReq: 50, range: [15, 20] },
        ],
        payload: {
            statModifiers: [{ stat: 'heart', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['accessory', 'utility', 'emotional'],
    },
    {
        id: 'am-regen',
        name: 'Mending Charm',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_regeneration'],
        },
        addedIn: '2026-06-07',
        tags: ['accessory', 'sustain'],
    },
    {
        id: 'am-all-attunement',
        name: 'Triune Sigil',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 25, range: [2, 4] },
            { levelReq: 40, range: [5, 8] },
            { levelReq: 50, range: [9, 13] },
        ],
        // Three base stats, each receiving the rolled value.
        payload: {
            statModifiers: [
                { stat: 'heart', value: 0 },
                { stat: 'body',  value: 0 },
                { stat: 'mind',  value: 0 },
            ],
        },
        addedIn: '2026-06-07',
        tags: ['accessory', 'utility'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'am-status-amp',
        name: 'Hex Focus',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_status_chance_up'],
        },
        addedIn: '2026-06-16',
        tags: ['accessory', 'status'],
    },
    {
        id: 'am-cleanse',
        name: 'Purifying Charm',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_cleanse'],
        },
        addedIn: '2026-06-16',
        tags: ['accessory', 'sustain', 'status'],
    },
    {
        id: 'am-luck',
        name: 'Lucky Trinket',
        hiddenRarity: 'common_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 15, range: [3, 5] },
            { levelReq: 30, range: [6, 9] },
            { levelReq: 45, range: [10, 14] },
        ],
        payload: {
            statModifiers: [{ stat: 'luck', value: 0 }],
        },
        addedIn: '2026-06-16',
        tags: ['accessory', 'utility', 'luck'],
    },
    {
        id: 'am-fortitude',
        name: 'Bulwark Bauble',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_minor_fortitude'],
        },
        addedIn: '2026-06-16',
        tags: ['accessory', 'defense'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    {
        id: 'am-advantage-mind',
        name: 'Attuned Sigil',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_advantage_mind'],
        },
        addedIn: '2026-06-18',
        tags: ['accessory', 'utility', 'mental'],
    },
    {
        id: 'am-all-stats',
        name: 'Paragon Charm',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 25, range: [1, 1] },
            { levelReq: 45, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_all_stats_up'],
        },
        addedIn: '2026-06-18',
        tags: ['accessory', 'utility'],
    },
];

// ─── Armor pool ──────────────────────────────────────────────────────────────

export const armorModPool: Modifier[] = [
    {
        id: 'armm-defense',
        name: 'Hardened',
        hiddenRarity: 'common_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [3, 7] },
            { levelReq: 10, range: [8, 16] },
            { levelReq: 20, range: [17, 28] },
            { levelReq: 30, range: [29, 42] },
            { levelReq: 40, range: [43, 58] },
            { levelReq: 50, range: [59, 78] },
        ],
        payload: {
            statModifiers: [{ stat: 'physicalDefense', value: 0 }],
        },
    },
    {
        id: 'armm-heart-start',
        name: 'Brave Bearing',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [2, 3] },
            { levelReq: 20, range: [3, 5] },
            { levelReq: 30, range: [5, 7] },
            { levelReq: 40, range: [7, 9] },
            { levelReq: 50, range: [9, 12] },
        ],
        payload: {
            resourceInteraction: {
                combatStartTokens: { heart: 0 },
            },
        },
    },
    {
        id: 'armm-regen',
        name: 'Enduring',
        hiddenRarity: 'rare_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_regeneration'],
        },
    },
    // ── Content expansion pass 2026-06-07 (new armor mods) ──
    {
        id: 'armm-vitality',
        name: 'Ironhide',
        hiddenRarity: 'common_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [1, 2] },
            { levelReq: 10, range: [3, 5] },
            { levelReq: 20, range: [6, 10] },
            { levelReq: 30, range: [11, 16] },
            { levelReq: 40, range: [17, 23] },
            { levelReq: 50, range: [24, 32] },
        ],
        payload: {
            statModifiers: [{ stat: 'body', value: 0 }],
        },
        addedIn: '2026-06-07',
        tags: ['armor', 'defense'],
    },
    {
        id: 'armm-aegis',
        name: 'Aegis Weave',
        hiddenRarity: 'rare_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            onDefendEffects: [{
                effectId: 'buff_barrier',
                target: 'self',
                baseChance: 0.30,
                tier: 2,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['armor', 'defense', 'proc'],
    },
    {
        id: 'armm-stoic',
        name: 'Stoic Plating',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
            { levelReq: 30, range: [1, 1] },
            { levelReq: 50, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_damage_reduction'],
        },
        addedIn: '2026-06-07',
        tags: ['armor', 'defense'],
    },
    // ── Content expansion pass 2026-06-16 (Phase 151 — affix backing mods) ──
    {
        id: 'armm-body-resist',
        name: 'Adamant Weave',
        hiddenRarity: 'common_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_resistance_body'],
        },
        addedIn: '2026-06-16',
        tags: ['armor', 'defense'],
    },
    {
        id: 'armm-heart-resist',
        name: 'Sanguine Lining',
        hiddenRarity: 'common_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_resistance_heart'],
        },
        addedIn: '2026-06-16',
        tags: ['armor', 'defense', 'emotional'],
    },
    {
        id: 'armm-mhp',
        name: 'Reinforced Hide',
        hiddenRarity: 'uncommon_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 25, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_max_hp_up'],
        },
        addedIn: '2026-06-16',
        tags: ['armor', 'defense'],
    },
    // ── Content expansion pass 2026-06-18 (status-family expansion) ──
    {
        id: 'armm-mind-resist',
        name: 'Lucid Lining',
        hiddenRarity: 'common_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 1,  range: [1, 1] },
            { levelReq: 20, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_resistance_mind'],
        },
        addedIn: '2026-06-18',
        tags: ['armor', 'defense', 'mental'],
    },
    {
        id: 'armm-stoic-bulwark',
        name: 'Immovable Plating',
        hiddenRarity: 'rare_mod',
        validSlots: ['armor'],
        levelTiers: [
            { levelReq: 15, range: [1, 1] },
            { levelReq: 35, range: [1, 1] },
        ],
        payload: {
            passiveEffects: ['buff_stoic_bulwark'],
        },
        addedIn: '2026-06-18',
        tags: ['armor', 'defense'],
    },
];

// ─── Unique-only pool (Q4 — never in procedural draws) ───────────────────────

export const uniqueModPool: Modifier[] = [
    {
        id: 'um-stance-echo',
        name: 'Stance Echo',
        hiddenRarity: 'rare_mod',
        // `validSlots` lists hosts — Uniques on either weapon or accessory may
        // currently carry this signature mod via `fixedModIds`.
        validSlots: ['weapon', 'accessory'],
        levelTiers: [
            { levelReq: 5,  range: [1, 1] },
            { levelReq: 15, range: [1, 2] },
        ],
        payload: {
            resourceInteraction: {
                generationBonus: [
                    { trigger: 'any', resourceType: 'heart', bonus: 0 },
                    { trigger: 'any', resourceType: 'body',  bonus: 0 },
                    { trigger: 'any', resourceType: 'mind',  bonus: 0 },
                ],
            },
        },
    },
    {
        id: 'um-paradox-edge',
        name: 'Paradox Edge',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon'],
        levelTiers: [
            { levelReq: 10, range: [1, 1] },
        ],
        // Two procs ride the same hit — vulnerability and a confusion debuff,
        // landing simultaneously when the wearer connects.
        payload: {
            onHitEffects: [
                {
                    effectId: 'debuff_vulnerability_body',
                    target: 'opponent',
                    baseChance: 0.30,
                    tier: 3,
                },
                {
                    effectId: 'debuff_confusion',
                    target: 'opponent',
                    baseChance: 0.30,
                    tier: 3,
                },
            ],
        },
    },
    {
        id: 'um-resonance-prime',
        name: 'Resonance Prime',
        hiddenRarity: 'rare_mod',
        validSlots: ['accessory'],
        levelTiers: [
            { levelReq: 15, range: [1, 2] },
            { levelReq: 20, range: [2, 3] },
        ],
        payload: {
            resourceInteraction: {
                combatStartTokens: { heart: 0, body: 0, mind: 0 },
            },
        },
    },
    // ── Content expansion pass 2026-06-07 (new unique-only mods) ──
    {
        id: 'um-phoenix-heart',
        name: 'Phoenix Heart',
        hiddenRarity: 'rare_mod',
        validSlots: ['armor', 'body', 'accessory'],
        levelTiers: [
            { levelReq: 25, range: [1, 1] },
            { levelReq: 45, range: [1, 1] },
        ],
        // A late-game signature: regeneration plus a vigor proc when defending.
        payload: {
            passiveEffects: ['buff_regeneration'],
            onDefendEffects: [{
                effectId: 'buff_phoenix_vigor',
                target: 'self',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['unique', 'sustain', 'late-game'],
    },
    {
        id: 'um-gorgon-stare',
        name: 'Gorgon Stare',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon', 'head'],
        levelTiers: [
            { levelReq: 30, range: [4, 8] },
            { levelReq: 50, range: [9, 16] },
        ],
        payload: {
            statModifiers: [{ stat: 'mentalAttack', value: 0 }],
            onHitEffects: [{
                effectId: 'debuff_gorgon_gaze',
                target: 'opponent',
                baseChance: 0.25,
                tier: 3,
            }],
        },
        addedIn: '2026-06-07',
        tags: ['unique', 'offense', 'control', 'late-game'],
    },
    {
        id: 'um-promethean-spark',
        name: 'Promethean Spark',
        hiddenRarity: 'rare_mod',
        validSlots: ['weapon', 'accessory'],
        levelTiers: [
            { levelReq: 20, range: [1, 1] },
            { levelReq: 40, range: [1, 1] },
        ],
        // Burns the foe and embers the wielder — all-stance generation on hit.
        payload: {
            onHitEffects: [
                {
                    effectId: 'debuff_burn',
                    target: 'opponent',
                    baseChance: 0.30,
                    tier: 3,
                },
                {
                    effectId: 'buff_promethean_ember',
                    target: 'self',
                    baseChance: 0.30,
                    tier: 3,
                },
            ],
        },
        addedIn: '2026-06-07',
        tags: ['unique', 'offense', 'dot', 'late-game'],
    },
];

// ─── Slot → procedural pool map (Spec 05d §4 helper) ─────────────────────────

/**
 * Procedural mod pools keyed by slot. `rollModifiers` (`item.factory.ts`)
 * draws from these; `uniqueModPool` is excluded by design (Q4).
 */
export const MOD_POOLS: Record<EquipmentSlot, Modifier[]> = {
    weapon:    weaponModPool,
    armor:     armorModPool,
    head:      headModPool,
    body:      bodyModPool,
    hands:     handsModPool,
    feet:      feetModPool,
    accessory: accessoryModPool,
};

// ─── Unified registry for O(1) resolve-time lookups ──────────────────────────

const allMods: Modifier[] = [
    ...weaponModPool,
    ...armorModPool,
    ...headModPool,
    ...bodyModPool,
    ...handsModPool,
    ...feetModPool,
    ...accessoryModPool,
    ...uniqueModPool,
];

const modRegistry = new Map<string, Modifier>(allMods.map(m => [m.id, m]));

/** O(1) lookup across every pool (procedural + unique). */
export function getModifierById(id: string): Modifier | undefined {
    return modRegistry.get(id);
}

/**
 * Picks the highest `ModValueTier` whose `levelReq <= playerLevel`. Returns
 * `undefined` when the mod has no eligible tier (caller filters this out
 * before sampling).
 */
export function pickValueTier(mod: Modifier, playerLevel: number): ModValueTier | undefined {
    let best: ModValueTier | undefined;
    for (const tier of mod.levelTiers) {
        if (tier.levelReq <= playerLevel) {
            if (!best || tier.levelReq > best.levelReq) best = tier;
        }
    }
    return best;
}

/** All catalogue mods exported as a frozen array — handy for invariants tests. */
export const allModifiers: ReadonlyArray<Modifier> = allMods;
