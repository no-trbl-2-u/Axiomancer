/**
 * Keyword registry — the player-facing combat vocabulary (spec 32 v3).
 *
 * 32 KEYWORDS (spec 32 v3 shipped 30: 10 shared utility + 2 hallmark per
 * theme). The card-honesty pass of 2026-07-10 added 2 more — FESTER and
 * TRANSMUTE — because two affliction-glue cards (`festering-argument`,
 * `currys-conversion`) drove mechanics (extend_dots / convert_dots) that had NO
 * keyword home, so they rendered the ambiguous "DEBUFF / buff yourself" face.
 * The doctrine is now "every mechanic is a terse, learnable KEYWORD" over "the
 * count is exactly 30" — a mechanic without a keyword here is the bug (see the
 * card-face-honesty guard test). The engine keeps its thematic effect names as
 * lore; this module is the PRESENTATION-layer mapping the board, card faces,
 * glossary, and combat log read instead. Pure + dependency-free.
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
    // ── Card-local species (2026-07-10 card-keyword doctrine — a face
    // keyword + gloss, NOT a registry row until it reaches ~3 cards) ──
    // WS3.4 Doom species (spec 32 §12 #3 — ratified card-local, not
    // keyword #31); applied by the 'doom-species' sandbox set.
    debuff_creeping_doom: 'Doom',
};

/**
 * SUPPORT effect ids (items / consumables / the Cards token system — tagged
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
    // debuff_daze → folded into debuff_confusion (WS8.1 KW-2, 2026-07-11)
    debuff_stagger: 'Stagger',
    debuff_knockdown: 'Stagger',
    // debuff_fatigue → folded into debuff_exhaustion (WS8.1 KW-2, 2026-07-11)
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
 * Special-mechanic kind → keyword (Title-Case). The MISSING half of the
 * vocabulary map: `EFFECT_KEYWORD` covers effect-backed cards (Poison / Mark /
 * …), but a card whose PAID identity is a `specialMechanics` verb (STAGGER,
 * SWAY, PERORATION, …) had no keyword resolution and fell through to the
 * ambiguous "DEBUFF / buff yourself" face. Every headline-able mechanic maps to
 * a real glossary keyword here so the face can always print `KEYWORD · value`.
 *
 * Kinds handled by their OWN face kind (guard/barrier/riposte/rupture/reap/
 * siphon and the FORGE die-verb cluster) are intentionally absent — they never
 * reach the generic mechanic path.
 */
const MECHANIC_KEYWORD: Record<string, string> = {
    // ── Control ──
    stagger: 'Stagger',
    lock_stance: 'Stagger',
    // ── Oracle ──
    foretell: 'Foretell',
    omen: 'Omen',
    // ── Peroration ──
    premise: 'Premise',
    peroration: 'Peroration',
    spend_premises: 'Premise',
    // ── Akrasia ──
    recoil: 'Recoil',
    // Chosen X-cost (WS7.2): same keyword family — the blood price, sized by
    // the player at commit.
    recoil_x: 'Recoil',
    // ── Harvest ──
    soul_gain: 'Soul',
    consume_affliction: 'Soul',
    // ── Charm ──
    sway: 'Sway',
    // ── Echo ──
    echo: 'Echo',
    echo_next_spell: 'Echo',
    reprise: 'Reprise',
    // replay_last replays your LAST spell (not this card's line) — same Echo
    // family concept ("a spell resolves again"); the face heroSub names the
    // target so it never reads as this card's own payoff firing twice.
    replay_last: 'Echo',
    // ── Conjuration ──
    conjure_card: 'Conjure',
    // ── Affliction glue ──
    extend_dots: 'Fester',
    convert_dots: 'Transmute',
    boost_all_dots: 'Fester',
};

/**
 * Keyword → a short, general definition (the glossary rule). The card's own
 * numbers live on the face/preview; this explains the keyword. EXACTLY the 30
 * keywords of spec 32 v3 §3 (plus the two card-type labels).
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // ── Utility (10) ──
    Draw: 'Immediately draw that many cards from your deck, up to your hand limit.',
    Forge:
        'Creates a FLOATING die — or converts a dead X die in your tray into a floating WILD die. '
        + 'Floating dice join the tray now, play in addition to your drafted die, never reroll, '
        + 'carry across combats, and are gone forever when spent; at the cap of 3, Forge grants +1 Conviction instead.',
    Guard:
        'Absorbs incoming attack damage during the next threat phase, up to its amount. '
        + 'One-shot: whatever Guard the phase does not use is lost when the phase ends.',
    Barrier:
        'Absorbs incoming attack damage after Guard is used up, until its amount is spent. '
        + 'Persists across phases, and new Barrier adds to what remains.',
    Tick:
        'Your strongest damage-over-time effect on the enemy deals its per-round damage again, immediately. '
        + 'Its duration and stacks are unchanged.',
    Mark:
        'Every damage-over-time effect on the bearer deals +1 HP per Mark stack, each time it ticks. '
        + 'Marks do not expire on their own — they hold until consumed or the combat ends. '
        + 'Counts as an affliction: RUPTURE and conclusion payoffs consume Marks for their printed burst.',
    Cleanse: 'Removes up to that many afflictions (debuffs) from you.',
    Heal: 'Restores that much VITAE (HP), up to your maximum.',
    Rupture:
        'Consumes EVERY affliction on the enemy: their remaining damage-over-time detonates as one immediate burst, '
        + 'plus 3 HP per stack of the consumed non-damage afflictions. '
        + "The burst is capped at a quarter of the enemy's max HP (or 80, whichever is larger).",
    Conjure:
        'Creates a one-use Thoughtform card in your hand. '
        + 'It is removed from the combat after it is played, or when the combat ends.',
    // ── Affliction (T1) ──
    Fester:
        'Adds that many turns of duration to EVERY damage-over-time effect you '
        + 'have on the enemy — the wounds you have already opened simply run longer.',
    Transmute:
        'Converts the enemy’s Bleed into Poison and its Poison into Bleed, '
        + 'and adds that much intensity to each as it flips — the same wound, re-argued.',
    Poison:
        'Deals 2 HP per stack each time a card is played, and that 2 grows by +1 for every 2 full rounds the poison has held. '
        + 'Applying poison again resets the growth.',
    Bleed:
        'Each time the bearer takes a hit of damage, the Bleed deals 3 more HP per stack, then loses 1 stack; it ends at 0 stacks.',
    Doom:
        'Deals 1 HP per stack at the start of each round, and GROWS +1 stack every time the enemy acts. '
        + 'It never runs out on its own — it ends only when consumed or the combat ends.',
    // ── Peroration (T2) ──
    Premise:
        'A persistent tally your cards add to. '
        + "When it reaches a declared Peroration's number, the Peroration fires and the tally resets to 0.",
    Peroration:
        'A declared conclusion, one in play at a time: its printed effect fires FREE the moment your Premise tally reaches its number, then the tally resets to 0. '
        + 'A concede-line Peroration instead ends the fight outright — at 8 Premises against normal enemies, 10 against elites, 12 against bosses.',
    // ── Forge (T3) ──
    Kindle:
        'Creates a temporary die of the printed color (this combat only); it joins your Reserve with 0 pips. '
        + 'If the Reserve (2 slots) is full, it becomes +1 Conviction instead.',
    Pip:
        'A charge on a Reserve die: each die ripens +1 pip per threat phase it survives, to a max of 2. '
        + 'When the die is spent, each pip adds +1 intensity to the statuses that play lands — or +2 Guard on a defend card.',
    // ── Akrasia (T4) ──
    Recoil: 'Pay the printed HP (VITAE) as a cost when the card is played. Guard, Barrier, and defenses cannot prevent it.',
    Fallen:
        'A state: you carry 2 or more DIFFERENT afflictions of your own. '
        + "A card's FALLEN line fires free if you are Fallen at the moment you play it.",
    // ── Control (T5) ──
    Stagger:
        "Removes that many rungs from the enemy's next telegraphed action — normal actions carry 2 rungs, boss actions 3, and each rung lost weakens the hit proportionally. "
        + 'Removing every rung denies the action outright; all accumulated Stagger is spent when that action resolves.',
    Backfire:
        'While it holds, the enemy takes 1 HP per Backfire stack for EACH rung its telegraphed action loses. '
        + 'A fully denied action counts all of its rungs.',
    // ── Oracle (T6) ──
    Foretell:
        "Reveals the enemy's next telegraphed stance, and looks at that many cards from the top of your deck, "
        + 'moving the highest-rank one to the top.',
    Omen:
        "A prediction: the color of the die that paid this card (WILD predicts the card's own stance) is cast against the enemy's next stance. "
        + 'If the next telegraph matches, the printed payoff fires free at the phase boundary; otherwise the omen misses.',
    // ── Harvest (T7) ──
    Soul: 'You gain 1 Soul each time an affliction on the enemy expires or is consumed. Souls persist until spent by REAP.',
    Reap:
        'Spends the printed number of Souls to fire the printed effect; with fewer Souls, the card fizzles. '
        + 'The capstone instead spends your entire Soul bank at once.',
    // ── Charm (T8) ──
    Sway:
        'Builds on the enemy and decays 1 at the end of each round. '
        + "The enemy CAPITULATES the moment your Sway reaches its resolve: 35% of its max HP (never below 10), or its current HP if that is lower.",
    Rapport: "The enemy's attacks deal 10% less damage per Rapport stack while it holds.",
    // ── Bulwark (T9) ──
    Thorns:
        'Each threat phase in which the enemy attacks you, it takes 1 HP per Thorns stack — even if the attack was fully blocked.',
    Riposte:
        'Armed for one threat phase: the first incoming attack is reduced by the printed parry amount, '
        + 'and if your Guard or Barrier FULLY blocks an attack this phase, the enemy takes the printed counter damage. '
        + 'Cleared when the phase ends.',
    // ── Echo (T10) ──
    Echo:
        "The card's PAID line fires twice: its statuses apply a second time, and its Premise, Sway, Soul, and Reprise amounts are doubled. "
        + 'FREE lines never echo.',
    Reprise: 'Returns that many cards from your discard pile to your hand — the highest-rank cards are chosen.',
    // ── Card types (labels, not keywords) ──
    Enchantment:
        'A passive on your side. Played FREE (no die) it lasts 3 rounds; '
        + 'paid with a die it becomes permanent for the rest of the combat, is unique in play, and leaves the deck cycle.',
    Disenchant:
        'A standing curse attached to the ENEMY. Played FREE (no die) it lasts 3 rounds; '
        + 'paid with a die it becomes permanent for the rest of the combat, is unique in play, and leaves the deck cycle.',
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

/** The keyword a special-mechanic kind headlines (e.g. stagger → Stagger), or
 *  null for kinds that carry their own face kind (guard/rupture/forge/…). */
export function keywordForMechanic(kind: string | null | undefined): string | null {
    if (!kind) return null;
    return MECHANIC_KEYWORD[kind] ?? null;
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
