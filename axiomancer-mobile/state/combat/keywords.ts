/**
 * Keyword registry — the player-facing combat vocabulary (spec 32 v3).
 *
 * EXACTLY 30 KEYWORDS. The themed-deck library speaks a deliberately small
 * language: 10 shared utility keywords + 2 hallmark keywords per theme.
 * Every mechanic is a terse, learnable KEYWORD (BLEED, STAGGER, FORGE), not a
 * flavour name. The engine keeps its thematic effect names as lore; this
 * module is the PRESENTATION-layer mapping the board, card faces, glossary,
 * and combat log read instead. Pure + dependency-free.
 *
 * Why mobile-side: a player-facing label is presentation (ADR-0001/0003 — the
 * engine owns truth, mobile owns how it reads). Never rename engine effect ids
 * for player text — map them here.
 *
 * Keywords are stored Title-Case; display sites uppercase where they want the
 * pop (card face, glossary header). The combat log uses Title-Case directly.
 */

/** Effect id → keyword (Title-Case). The CARD vocabulary (spec 32 v3 §3). */
const EFFECT_KEYWORD: Record<string, string> = {
    // ── The six effect-backed keywords ──
    debuff_poison: 'Poison',
    debuff_bleed: 'Bleed',
    debuff_mark: 'Mark',
    debuff_backfire: 'Backfire',
    debuff_rapport: 'Rapport',
    buff_thorns: 'Thorns',
};

/**
 * SUPPORT effect ids (items / consumables / the Skills token system — tagged
 * `support`/`non-card` in the effect libraries). NOT card keywords and NOT in
 * the 30-keyword glossary; mapped so the combat log never prints a raw id.
 */
const SUPPORT_KEYWORD: Record<string, string> = {
    debuff_strong_poison: 'Poison',
    debuff_burn: 'Poison',
    debuff_frostbite: 'Poison',
    debuff_shock: 'Poison',
    debuff_disease: 'Poison',
    debuff_hp_decay: 'Poison',
    debuff_hex: 'Mark',
    debuff_curse: 'Mark',
    debuff_wound: 'Mark',
    debuff_vulnerability_body: 'Mark',
    debuff_vulnerability_mind: 'Mark',
    debuff_vulnerability_heart: 'Mark',
    debuff_stun: 'Stagger',
    debuff_sleep: 'Stagger',
    debuff_petrify: 'Stagger',
    debuff_gorgon_gaze: 'Stagger',
    debuff_charm: 'Sway',
    debuff_silence: 'Backfire',
    debuff_confusion: 'Backfire',
    debuff_fear: 'Backfire',
    debuff_slow: 'Backfire',
    debuff_root: 'Backfire',
    debuff_blind: 'Backfire',
    debuff_daze: 'Backfire',
    debuff_stagger: 'Stagger',
    debuff_knockdown: 'Stagger',
    debuff_fatigue: 'Mark',
    debuff_exhaustion: 'Mark',
    buff_regeneration: 'Heal',
    buff_phoenix_vigor: 'Heal',
    buff_cleanse: 'Cleanse',
    buff_barrier: 'Barrier',
    buff_damage_reduction: 'Guard',
    buff_defend_up: 'Guard',
    buff_minor_fortitude: 'Guard',
    buff_stoic_bulwark: 'Guard',
    buff_reflect: 'Thorns',
    buff_brazen_thorns: 'Thorns',
    buff_counter: 'Riposte',
    buff_life_steal: 'Heal',
    buff_max_hp_up: 'Heal',
    buff_haste: 'Draw',
    buff_accuracy_up: 'Foretell',
    buff_oracle_foresight: 'Foretell',
    buff_critical_rate_up: 'Mark',
    buff_critical_damage_up: 'Mark',
    buff_status_chance_up: 'Mark',
    buff_buff_duration_up: 'Mark',
    buff_all_stats_up: 'Guard',
    buff_evasion_up: 'Guard',
    buff_stealth: 'Guard',
    buff_taunt: 'Guard',
    buff_invincibility: 'Barrier',
    buff_open_minded: 'Cleanse',
    buff_resistance_body: 'Guard',
    buff_resistance_mind: 'Guard',
    buff_resistance_heart: 'Guard',
    buff_advantage_body: 'Foretell',
    buff_advantage_mind: 'Foretell',
    buff_advantage_heart: 'Foretell',
    buff_promethean_ember: 'Heal',
};

/** Verb class → keyword for cards whose action is the keyword itself. */
const VERB_KEYWORD: Record<string, string> = {
    defend: 'Guard',
    enchant: 'Enchantment',
    disenchant: 'Disenchant',
};

/**
 * Keyword → a short, general definition (the glossary rule). The card's own
 * numbers live on the face/preview; this explains the keyword. EXACTLY the 30
 * keywords of spec 32 v3 §3 (plus the two card-type labels).
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // ── Utility (10) ──
    Draw: 'Draw cards from your deck.',
    Forge: 'Create a FLOATING die: joins your tray now, never rerolls, carries across combats, gone forever when spent. Cap 3.',
    Guard: "Absorbs the enemy's next attack, then fades. One-shot — resets each phase.",
    Barrier: 'Absorbs incoming damage until depleted. Persists across phases. Stacks.',
    Tick: 'The strongest damage-over-time on the enemy deals its turn damage NOW; its duration is untouched.',
    Mark: 'An exposure: every damage-over-time tick on the bearer deals +1 per Mark stack. Counts as an affliction.',
    Cleanse: 'Removes negative effects from you.',
    Heal: 'Restore VITAE.',
    Rupture: "Consumes ALL the foe's afflictions and detonates their remaining harm as one burst.",
    Conjure: 'Creates a one-use Thoughtform card into your hand. It leaves the combat after it is played.',
    // ── Affliction (T1) ──
    Poison: 'Loses HP each turn — and the poison grows stronger the longer it holds.',
    Bleed: 'Loses HP at each turn end, heavily — then the wound closes by one stack.',
    // ── Peroration (T2) ──
    Premise: 'The running tally of your argument. Premises persist until a Peroration spends them.',
    Peroration: 'A declared conclusion, one in play at a time: it fires FREE when your Premises reach its number. At eight, the enemy concedes outright.',
    // ── Forge (T3) ──
    Kindle: 'Create a temporary die (this combat only). It joins your Reserve.',
    Pip: 'Ripening on a held die: each pip adds +1 intensity to the status a spend lands (+2 Guard on a defend).',
    // ── Akrasia (T4) ──
    Recoil: 'Pay VITAE as a printed cost. Unpreventable.',
    Fallen: 'You carry two or more afflictions of your own. Fallen-gated card lines go live.',
    // ── Control (T5) ──
    Stagger: "Removes rungs from the enemy's next telegraphed action. Strip them all and the turn is denied.",
    Backfire: 'While afflicted, the enemy takes damage for every rung its actions lose.',
    // ── Oracle (T6) ──
    Foretell: 'Look at the top of your deck (the best future floats up) and glimpse the enemy\'s next telegraph.',
    Omen: 'Cast your die as a prediction of the enemy\'s next stance. If it comes true, the printed payoff fires free.',
    // ── Harvest (T7) ──
    Soul: 'Gained whenever an enemy affliction expires or is consumed. Spent by REAP.',
    Reap: 'Spend Souls for the printed effect. The capstone spends them all.',
    // ── Charm (T8) ──
    Sway: 'Builds on the enemy and decays each turn. If your Sway ever meets their remaining VITAE, they capitulate.',
    Rapport: 'The enemy deals less damage while it holds. It is hard to strike what has listened.',
    // ── Bulwark (T9) ──
    Thorns: 'Attackers take damage back whenever they hurt you.',
    Riposte: 'Armed for one phase: an attack your Guard or Barrier FULLY blocks is answered with a counter.',
    // ── Echo (T10) ──
    Echo: 'The card\'s paid effect fires twice.',
    Reprise: 'Return a card from your discard pile to your hand — the best one rises.',
    // ── Card types (labels, not keywords) ──
    Enchantment: 'A persistent passive on your side for the rest of the combat. Paid only — the die is the commitment.',
    Disenchant: 'A standing curse attached to the ENEMY for the rest of the combat. Paid only.',
};

/**
 * Hidden archetype → its keyword family. Powers the (invisible) reward skew.
 * Never surfaced to the player. Re-cut over the 10 v3 themes.
 */
export const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
    bleeder: ['Poison', 'Bleed', 'Tick', 'Rupture', 'Soul', 'Reap', 'Recoil', 'Fallen'],
    guardian: ['Guard', 'Barrier', 'Thorns', 'Riposte', 'Heal', 'Cleanse', 'Rapport', 'Sway'],
    controller: ['Stagger', 'Backfire', 'Mark', 'Foretell', 'Omen', 'Premise', 'Peroration', 'Echo', 'Reprise'],
};

/** The keyword for an engine effect id, or null if unmapped. */
export function keywordForEffect(effectId: string | null | undefined): string | null {
    if (!effectId) return null;
    return EFFECT_KEYWORD[effectId] ?? SUPPORT_KEYWORD[effectId] ?? null;
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
