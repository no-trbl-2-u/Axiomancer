/**
 * Keyword registry — the player-facing combat vocabulary (spec 32 §3,
 * amended 2026-07-11 by the Phase 29 language pass).
 *
 * 30 KEYWORDS (down from a drifted 32 — the "exactly 30" directive yields
 * to earned support: see `plan/tuning/2026-07-10-keyword-registry.md`).
 * Phase 29 (`plan/phases/phase_29_keyword_registry.md`) folded six
 * previously-unmapped debuff ids into registry keywords, renamed three
 * colliding words (FESTER→PROLONG, TRANSMUTE→REARGUE, REPRISE→RECALL),
 * retired/merged three ghosts (BARRIER into GUARD, CONJURE — zero library
 * cards, PERORATION — demoted to card-local text on its sole carrier), and
 * promoted one (SIPHON — was raw unglossed text). TICK and KINDLE are
 * UNCHANGED this phase: TICK's retirement rides Phase 30's FREE-line
 * rework, and KINDLE's fold-into-FORGE is conditional on Phase 30/32
 * content work giving it more carriers — neither is a registry-honesty
 * question this pass.
 *
 * The doctrine: "every mechanic is a terse, learnable KEYWORD" over "the
 * count is exactly 30" — a mechanic without a keyword here is the bug (see
 * the card-face-honesty guard test). The engine keeps its thematic effect
 * names as lore; this module is the PRESENTATION-layer mapping the board,
 * card faces, glossary, and combat log read instead. Pure + dependency-free.
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
    // ── KW-1 fold (phase 29): six DoT-species ids that had no keyword home
    // and rendered the blank "◆ DIE" face. Presentation-only — none of the
    // six effect payloads change; `debuff_backfire_acute` keeps its separate
    // stacking track (a deliberate design feature on paralysis-of-analysis),
    // only the printed word changes. ──
    debuff_argument_wound: 'Poison',
    debuff_echo_sting: 'Poison',
    debuff_kindling_ember: 'Bleed',
    debuff_nettle_sting: 'Bleed',
    // tickAmplifyFlat:1 IS Mark's mechanical signature (+1 per stack each
    // tick) — a closer semantic fit than Poison for this DoT+amplify hybrid.
    debuff_foretold_wound: 'Mark',
    debuff_backfire_acute: 'Backfire',
};

/**
 * SUPPORT effect ids (items / consumables / the Cards token system — tagged
 * `support`/`non-card` in the effect libraries). NOT card keywords and NOT in
 * the 30-keyword glossary; mapped so the combat log never prints a raw id.
 */
const SUPPORT_KEYWORD: Record<string, string> = {
    // Debuffs that still resolve (the enemy threat-clock's curse).
    debuff_curse: 'Mark',
    // Consumable / engine buffs that still resolve. (BARRIER merged into GUARD
    // in phase 29, so buff_invincibility maps to Guard.)
    buff_regeneration: 'Heal',
    buff_phoenix_vigor: 'Heal',
    buff_cleanse: 'Cleanse',
    buff_open_minded: 'Cleanse',
    buff_damage_reduction: 'Guard',
    buff_all_stats_up: 'Guard',
    buff_invincibility: 'Guard',
    buff_haste: 'Draw',
    buff_accuracy_up: 'Foretell',
    buff_critical_rate_up: 'Mark',
    buff_critical_damage_up: 'Mark',
    buff_status_chance_up: 'Mark',
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
 * SWAY, …) had no keyword resolution and fell through to the ambiguous
 * "DEBUFF / buff yourself" face. Every headline-able mechanic maps to a real
 * glossary keyword here so the face can always print `KEYWORD · value`.
 *
 * Kinds handled by their OWN face kind (guard/barrier/riposte/rupture/reap
 * and the FORGE die-verb cluster) are intentionally absent — they never
 * reach the generic mechanic path.
 *
 * Phase 29 (KW-2/KW-3): `peroration` demoted (no keyword entry — its sole
 * carrier, the-closing-word, prints "PERORATION at N" via `mechanicText`
 * directly; the PREMISE gloss below explains the trigger). `consume_affliction`
 * re-mapped Soul→Rupture (extends RUPTURE's printed sense instead of minting
 * CONSUME). `reprise`→Recall, `extend_dots`/`boost_all_dots`→Prolong,
 * `convert_dots`→Reargue (renames). `replay_last`→Echo mapping DELETED
 * (ouroboros is a 1-of rare; `mechanicText`'s own case already gives it full
 * descriptive text — no keyword badge needed). `conjure_card` DELETED
 * (CONJURE retired — zero library cards). `siphon` PROMOTED to a real
 * keyword (was raw lowercase text with no gloss).
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
    spend_premises: 'Premise',
    // ── Akrasia ──
    recoil: 'Recoil',
    // ── Harvest ──
    soul_gain: 'Soul',
    consume_affliction: 'Rupture',
    siphon: 'Siphon',
    // ── Charm ──
    sway: 'Sway',
    // ── Echo ──
    echo: 'Echo',
    echo_next_spell: 'Echo',
    reprise: 'Recall',
    // ── Affliction glue ──
    extend_dots: 'Prolong',
    convert_dots: 'Reargue',
    boost_all_dots: 'Prolong',
};

/**
 * Keyword → a short, general definition (the glossary rule). The card's own
 * numbers live on the face/preview; this explains the keyword. The 30
 * keywords of spec 32 §3 (amended by phase 29) plus the two card-type
 * labels. TICK/KINDLE are unchanged this phase (see the module doc above).
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // ── Utility (9) ──
    Draw: 'Immediately draw that many cards from your deck, up to your hand limit.',
    Forge:
        'Creates a FLOATING die — or converts a dead X die in your tray into a floating WILD die. '
        + 'Floating dice join the tray now, play in addition to your drafted die, never reroll, '
        + 'carry across combats, and are gone forever when spent; at the cap of 3, Forge grants +1 Conviction instead.',
    Guard:
        'Absorbs incoming attack damage during the next threat phase, up to its amount. '
        + 'One-shot: whatever Guard the phase does not use is lost when the phase ends — unless the card prints '
        + '"persists", in which case it carries over untouched until it is spent.',
    Tick:
        'Your strongest damage-over-time effect on the enemy deals its per-round damage again, immediately. '
        + 'Its duration and stacks are unchanged.',
    Mark:
        'Every damage-over-time effect on the bearer deals +1 HP per Mark stack, each time it ticks. '
        + 'Counts as an affliction: RUPTURE and conclusion payoffs consume Marks for their printed burst.',
    Cleanse: 'Removes up to that many afflictions (debuffs) from you.',
    Heal: 'Restores that much VITAE (HP), up to your maximum.',
    Rupture:
        'Consumes afflictions on the enemy — the printed number, or EVERY affliction on a finisher: their remaining '
        + 'damage-over-time detonates as one immediate burst, plus 3 HP per stack of the consumed non-damage afflictions '
        + '(consuming a single affliction this way also yields a Soul, on the cards that print it). '
        + "The burst is capped at a quarter of the enemy's max HP (or 80, whichever is larger).",
    Siphon: 'Heals you for the printed percentage of the HP this play deals to the enemy.',
    // ── Affliction (T1) ──
    Prolong:
        'Adds that many turns of duration to EVERY damage-over-time effect you '
        + 'have on the enemy — the wounds you have already opened simply run longer.',
    Reargue:
        'Converts the enemy’s Bleed into Poison and its Poison into Bleed, '
        + 'and adds that much intensity to each as it flips — the same wound, re-argued.',
    Poison:
        'Deals 2 HP per stack at the START of each round, and that 2 grows by +1 for every 2 full rounds the poison has held. '
        + 'Applying poison again resets the growth.',
    Bleed: 'Deals 3 HP per stack at the END of each round, then loses 1 stack; it ends at 0 stacks.',
    // ── Peroration (T2) ──
    Premise:
        'A persistent tally your cards add to. '
        + 'When it reaches a declared conclusion (a Peroration) — printed on the card that carries it — the '
        + 'conclusion fires FREE and the tally resets to 0. A concede-line conclusion instead ends the fight outright '
        + '— at 8 Premises against normal enemies, 10 against elites, 12 against bosses.',
    // ── Forge (T3) ──
    Kindle:
        'Creates a temporary die of the printed color (this combat only); it joins your Reserve with 0 pips. '
        + 'If the Reserve (2 slots) is full, it becomes +1 Conviction instead.',
    Pip:
        'A charge on a Reserve die: each die ripens +1 pip per threat phase it survives, to a max of 2. '
        + 'When the die is spent, each pip adds +1 intensity to the statuses that play lands — or +2 Guard on a defend card.',
    // ── Akrasia (T4) ──
    Recoil: 'Pay the printed HP (VITAE) as a cost when the card is played. Guard and other defenses cannot prevent it.',
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
        + 'and if your Guard FULLY blocks an attack this phase, the enemy takes the printed counter damage. '
        + 'Cleared when the phase ends.',
    // ── Echo (T10) ──
    Echo:
        "The card's PAID line fires twice: its statuses apply a second time, and its Premise, Sway, Soul, and Recall amounts are doubled. "
        + 'FREE lines never echo.',
    Recall: 'Returns that many cards from your discard pile to your hand — the highest-rank cards are chosen.',
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
    guardian: ['Guard', 'Thorns', 'Riposte', 'Heal', 'Cleanse', 'Rapport', 'Sway'],
    controller: ['Stagger', 'Backfire', 'Mark', 'Foretell', 'Omen', 'Premise', 'Echo', 'Recall'],
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

/** Every registered keyword name (Title-Case), including the two card-type
 *  labels. The KW-6/KW-1/KW-5 lints (phase 29) assert against this list —
 *  it IS the registry, not a copy of it. */
export function allRegistryKeywords(): readonly string[] {
    return Object.keys(KEYWORD_GLOSS);
}

/**
 * KW-7 (phase 29) — the "systems glossary": engine tokens spec 32 §3 calls
 * out as "systems, not card keywords" (Conviction, Resonance, Reserve/Pips,
 * Floating dice, rungs, WILD/X) but that the player still reads on cards and
 * threshold lines with no definition anywhere. Rendered once in the combat
 * card detail overlay, beside the color-law legend — the same anchor point,
 * zero engine work.
 */
export const SYSTEM_GLOSSARY: readonly { term: string; def: string }[] = [
    { term: 'CONVICTION ◆', def: 'A spend-anytime resource banked from overflow (Forge at cap, Overtake, signature costs). Never decays.' },
    { term: 'RESONANCE ⬡', def: 'A per-round tally of dice spent by color. Threshold lines ("⬡ MIND ×3 spent") fire once the tally is reached that round.' },
    { term: 'RESERVE & PIPS', def: 'Up to 2 dice held between phases instead of played. Each Reserve die ripens +1 pip per phase it survives (cap 2); pips add intensity or Guard when the die is finally spent.' },
    { term: 'FLOATING ✦', def: 'A die forged into the tray permanently: plays alongside your drafted die, never rerolls, carries across combats, gone forever when spent.' },
    { term: 'RUNGS', def: "The enemy's telegraphed action's steps of magnitude. STAGGER removes rungs; losing all of them denies the action outright." },
    { term: 'WILD / X', def: 'A WILD die counts as any color for dieBonus and card requirements. A dead X die rolled no pips this round and can be Forged into a WILD floating die instead.' },
];

/** True if a keyword belongs to the given hidden archetype's family. */
export function keywordInArchetype(keyword: string | null | undefined, archetype: string | null | undefined): boolean {
    if (!keyword || !archetype) return false;
    return (ARCHETYPE_KEYWORDS[archetype] ?? []).includes(keyword);
}
