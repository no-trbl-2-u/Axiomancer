/**
 * Keyword registry — the player-facing combat vocabulary.
 *
 * DawnCaster/Slay-the-Spire doctrine: every mechanic is a terse, learnable
 * KEYWORD (BLEED, STUN, GUARD), not a flavour name. The engine keeps its
 * thematic effect names ("Theseus' Dissolution") as lore; this module is the
 * PRESENTATION-layer mapping that the board, card faces, glossary, and combat
 * log read instead. Pure + dependency-free (mirrors `statusGlyphs.ts`).
 *
 * Why mobile-side: a player-facing label is presentation (ADR-0001/0003 — the
 * engine owns truth, mobile owns how it reads). Keeping the vocabulary here
 * means we can tune keyword wording without an engine release, and the engine's
 * effect ids/payloads stay the single source of mechanical truth.
 *
 * Keywords are stored Title-Case; display sites uppercase where they want the
 * DawnCaster "pop" (card face, glossary header). The combat log uses Title-Case
 * directly so a sentence reads "Applied: Bleed." not "Applied: BLEED.".
 */

/** Effect id → keyword (Title-Case). Covers the full engine effect library. */
const EFFECT_KEYWORD: Record<string, string> = {
    // ── Damage-over-time ──
    debuff_poison: 'Poison',
    debuff_strong_poison: 'Toxin',
    debuff_bleed: 'Bleed',
    debuff_burn: 'Burning',
    debuff_frostbite: 'Chill',
    debuff_shock: 'Shock',
    debuff_disease: 'Blight',
    debuff_hex: 'Hex',
    debuff_hp_decay: 'Decay',
    debuff_tartarus_rot: 'Rot',
    debuff_basilisk_venom: 'Venom',
    debuff_acid: 'Corrode',
    debuff_harpy_torment: 'Torment',

    // ── Hard control (loses its action) ──
    debuff_stun: 'Stun',
    debuff_sleep: 'Sleep',
    debuff_petrify: 'Petrify',
    debuff_gorgon_gaze: 'Paralyze',
    debuff_charm: 'Charm',
    debuff_silence: 'Silence',
    debuff_minotaur_maze: 'Disorient',

    // ── Soft control (aim/roll/stats falter) ──
    debuff_daze: 'Daze',
    debuff_accuracy_down: 'Daze',
    debuff_straw_man_echo: 'Daze',
    debuff_confusion: 'Confuse',
    debuff_blind: 'Blind',
    debuff_fear: 'Fear',
    debuff_slow: 'Slow',
    debuff_root: 'Root',
    debuff_knockdown: 'Knockdown',
    debuff_lethe_fog: 'Fog',
    debuff_category_error: 'Muddle',
    debuff_causal_emergence: 'Unravel',
    debuff_transformative: 'Waver',
    debuff_moral_learning: 'Falter',
    debuff_rational_disagreement: 'Doubt',

    // ── Stat reduction / exposure ──
    debuff_all_stats_down: 'Weaken',
    debuff_affirming_consequent: 'Weaken',
    debuff_no_true_scotsman: 'Weaken',
    debuff_body_attack_down: 'Enfeeble',
    debuff_mind_attack_down: 'Enfeeble',
    debuff_heart_attack_down: 'Enfeeble',
    debuff_defense_down: 'Sunder',
    debuff_evasion_down: 'Expose',
    debuff_exposure: 'Expose',
    tier1_mind_mark: 'Expose',
    debuff_vulnerable: 'Vulnerable',
    debuff_vulnerability_body: 'Vulnerable',
    debuff_vulnerability_mind: 'Vulnerable',
    debuff_vulnerability_heart: 'Vulnerable',
    debuff_mark: 'Mark',
    debuff_hubris_brand: 'Brand',
    debuff_wound: 'Wound',
    debuff_curse: 'Curse',
    debuff_berserk: 'Enrage',
    debuff_fatigue: 'Fatigue',
    debuff_exhaustion: 'Exhaust',
    debuff_post_hoc_tremor: 'Tremor',
    debuff_sisyphean_weight: 'Burden',
    debuff_icarus_descent: 'Plummet',
    debuff_minor_unsteadiness: 'Unsteady',
    debuff_dispel: 'Dispel',

    // ── Offensive buffs ──
    tier1_body_attack: 'Empower',
    buff_body_attack_up: 'Empower',
    buff_mind_attack_up: 'Empower',
    buff_heart_attack_up: 'Empower',
    buff_all_stats_up: 'Empower',
    buff_petitio_pulse: 'Empower',
    buff_critical_damage_up: 'Savage',
    buff_critical_rate_up: 'Keen',

    // ── Accuracy / advantage buffs ──
    tier1_heart_attack: 'Focus',
    buff_accuracy_up: 'Focus',
    buff_focus: 'Focus',
    buff_quine_resolve: 'Focus',
    buff_apollonian_clarity: 'Focus',
    buff_haste: 'Haste',
    buff_advantage_body: 'Edge',
    buff_advantage_mind: 'Edge',
    buff_advantage_heart: 'Edge',
    buff_gettiters_flicker: 'Edge',
    buff_dionysian_surge: 'Edge',
    buff_oracle_foresight: 'Foresight',
    buff_status_chance_up: 'Potency',
    buff_buff_duration_up: 'Linger',

    // ── Defensive buffs ──
    tier1_body_defend: 'Thorns',
    buff_brazen_thorns: 'Thorns',
    buff_body_defense_up: 'Fortify',
    buff_mind_defense_up: 'Fortify',
    buff_heart_defense_up: 'Fortify',
    buff_defend_up: 'Fortify',
    buff_minor_fortitude: 'Fortify',
    buff_stoic_bulwark: 'Fortify',
    buff_aegis_recursion: 'Fortify',
    buff_ad_hoc_patch: 'Fortify',
    buff_barrier: 'Barrier',
    buff_damage_reduction: 'Protect',
    buff_special_pleading: 'Protect',
    buff_invincibility: 'Invulnerable',
    buff_evasion_up: 'Evade',
    buff_stealth: 'Stealth',
    buff_taunt: 'Taunt',
    buff_reflect: 'Reflect',
    buff_counter: 'Riposte',
    buff_resistance_body: 'Ward',
    buff_resistance_mind: 'Ward',
    buff_resistance_heart: 'Ward',

    // ── Recovery / sustain buffs ──
    tier1_heart_defend: 'Regenerate',
    buff_regeneration: 'Regenerate',
    buff_promethean_ember: 'Regenerate',
    buff_phoenix_vigor: 'Regenerate',
    buff_life_steal: 'Siphon',
    buff_max_hp_up: 'Bolster',
    buff_cleanse: 'Cleanse',
    buff_open_minded: 'Open-Minded',
};

/** Verb class → keyword for cards whose action is the keyword itself (no status effect). */
const VERB_KEYWORD: Record<string, string> = {
    defend: 'Guard',
};

/**
 * Keyword → a short, general definition (the glossary rule, à la Slay the Spire).
 * The card's own numbers live on the face/preview; this explains the keyword.
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // DoT
    Bleed: 'Loses HP at the start of each turn. More stacks deal more.',
    Poison: 'Loses HP each turn. Stacks add up.',
    Toxin: 'A virulent poison — loses more HP each turn.',
    Venom: 'Loses HP each turn and is weakened.',
    Corrode: 'Loses HP each turn as defense is eaten away.',
    Burning: 'Loses HP each turn to fire.',
    Chill: 'Loses HP each turn and acts slower.',
    Shock: 'Loses HP each turn and aim suffers.',
    Blight: 'Loses HP each turn; healing is reduced.',
    Hex: 'Loses HP each turn from a curse.',
    Decay: 'Loses HP each turn and cannot recover.',
    Rot: 'Loses HP each turn and grows weaker.',
    Torment: 'Healing turns to harm each turn.',
    // Hard control
    Stun: 'Loses its next action entirely.',
    Sleep: 'Cannot act until struck or it wears off.',
    Petrify: 'Turned to stone — cannot act.',
    Paralyze: 'Cannot act and is left exposed.',
    Charm: 'Acts against its own interest.',
    Silence: 'Cannot use special abilities.',
    Disorient: 'Lost — cannot act cleanly.',
    // Soft control
    Daze: 'Aim and stats falter; attacks may miss.',
    Confuse: 'Aim wanders; attacks may miss. Stack a VARIETY of controls to deny its turn entirely.',
    Blind: 'Accuracy greatly reduced.',
    Fear: 'Shaken — weaker and less accurate.',
    Slow: 'Acts later and less effectively. Stack a VARIETY of controls to deny its turn entirely.',
    Root: 'Cannot reposition; easier to hit.',
    Knockdown: 'Knocked prone — exposed and slowed.',
    Fog: 'Vision clouded; aim and stats drop.',
    Muddle: 'Thinking scrambled; rolls suffer.',
    Unravel: 'Coming apart — stats and aim drop.',
    Waver: 'Resolve shakes; actions weaken.',
    Falter: 'Hesitates — reduced effectiveness.',
    Doubt: 'Second-guesses; stats reduced.',
    // Stat down / exposure
    Weaken: 'All stats reduced.',
    Enfeeble: 'Attack power reduced.',
    Sunder: 'Defense reduced — takes more damage.',
    Vulnerable: 'Takes increased damage.',
    Expose: 'Easier to hit and harder to defend.',
    Mark: 'Marked — takes extra damage from hits.',
    Brand: 'Branded — defense and edge reduced.',
    Wound: 'Maimed — stats and defense reduced.',
    Curse: 'Cursed — stats and luck reduced.',
    Enrage: 'Reckless — hits harder but defends worse.',
    Fatigue: 'Tired — stats and aim reduced.',
    Exhaust: 'Spent — stats and aim reduced.',
    Tremor: 'Unsteady — stats reduced.',
    Burden: 'Weighed down — stats and aim reduced.',
    Plummet: 'Falling — aim and stats collapse.',
    Unsteady: 'Slightly reduced stats and aim.',
    Dispel: 'Strips a beneficial effect.',
    // Offensive buffs
    Empower: 'Your attack power is raised.',
    Savage: 'Your critical hits deal more.',
    Keen: 'Higher critical-hit chance.',
    // Accuracy / advantage buffs
    Focus: 'Your aim and rolls improve.',
    Haste: 'Act faster and more often.',
    Edge: 'Advantage on your actions.',
    Foresight: 'See and exploit what comes.',
    Potency: 'Your status effects land more often.',
    Linger: 'Your buffs last longer.',
    // Defensive buffs
    Thorns: 'Attackers take damage back.',
    Fortify: 'Your defense is raised.',
    Barrier: 'Absorbs incoming damage until depleted. Stacks.',
    Protect: 'Incoming damage reduced.',
    Invulnerable: 'Immune to damage briefly.',
    Evade: 'Greater chance to avoid attacks.',
    Stealth: 'Harder to be targeted.',
    Taunt: 'Forces the enemy to target you.',
    Reflect: 'Returns a portion of damage taken.',
    Riposte: 'Counterattacks when you are hit.',
    Ward: 'Resistance to a damage type.',
    // Recovery
    Regenerate: 'Recover HP at the start of each turn.',
    Siphon: 'Heal for part of the damage you deal.',
    Bolster: 'Maximum HP increased.',
    Cleanse: 'Removes negative effects from you.',
    'Open-Minded': 'Receptive — improved insight and dialogue.',
    // ── 0.34.0 mechanics (special-mechanic keywords; not status effects) ──
    Rupture: "Detonates ALL the foe's stacked damage-over-time as one instant burst.",
    Compound: 'A hit that grows with each distinct debuff on the foe.',
    Disrupt: 'Distinct soft-controls stack a meter; enough denies the foe its turn.',
    Execute: 'A finisher: massive damage when the foe is low on HP or heavily DoT-stacked.',
    // Verb-class keyword
    Guard: "Absorbs the enemy's next attack, then fades. One-shot — does not stack.",
};

/**
 * Hidden archetype → its keyword family. Powers the (invisible) reward skew:
 * a run tagged `bleeder` is offered more cards whose effect keyword is in this
 * set. Never surfaced to the player.
 */
export const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
    bleeder: ['Bleed', 'Poison', 'Toxin', 'Venom', 'Burning', 'Hex', 'Decay', 'Rot', 'Corrode', 'Blight', 'Torment'],
    guardian: ['Guard', 'Barrier', 'Fortify', 'Protect', 'Regenerate', 'Thorns', 'Ward', 'Reflect', 'Riposte', 'Bolster', 'Evade'],
    controller: ['Stun', 'Sleep', 'Petrify', 'Paralyze', 'Confuse', 'Daze', 'Fear', 'Charm', 'Silence', 'Slow', 'Root', 'Blind', 'Knockdown', 'Disorient', 'Fog'],
};

/** The keyword for an engine effect id, or null if unmapped. */
export function keywordForEffect(effectId: string | null | undefined): string | null {
    if (!effectId) return null;
    return EFFECT_KEYWORD[effectId] ?? null;
}

/** The keyword a verb class grants directly (e.g. defend → Guard), or null. */
export function keywordForVerb(verbClass: string | null | undefined): string | null {
    if (!verbClass) return null;
    return VERB_KEYWORD[verbClass] ?? null;
}

/** The general glossary definition for a keyword, or null. */
export function keywordGloss(keyword: string | null | undefined): string | null {
    if (!keyword) return null;
    return KEYWORD_GLOSS[keyword] ?? null;
}

/** True if a keyword belongs to the given hidden archetype's family. */
export function keywordInArchetype(keyword: string | null | undefined, archetype: string | null | undefined): boolean {
    if (!keyword || !archetype) return false;
    return (ARCHETYPE_KEYWORDS[archetype] ?? []).includes(keyword);
}
