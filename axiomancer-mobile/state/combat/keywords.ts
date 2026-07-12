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
    // ── KW-1 fold (phase 29): DoT-species ids that had no keyword home and
    // rendered the blank "◆ DIE" face. Presentation-only — no payloads
    // change. Of the cloud pass's six, four (argument_wound, echo_sting,
    // foretold_wound, backfire_acute) were retired at the ID level by this
    // session's WS3.5/WS8.1 folds and need no mapping anymore; the two
    // still-live species keep the cloud mapping. ──
    debuff_kindling_ember: 'Bleed',
    debuff_nettle_sting: 'Bleed',
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
    // Chosen X-cost (WS7.2): same keyword family — the blood price, sized by
    // the player at commit.
    recoil_x: 'Recoil',
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
 *
 * 2026-07-12 (owner playtest) — TERSE GLOSSES: every gloss is ONE short
 * sentence in the Dawncaster register ("Cards with Lifedrain restore health
 * equal to the damage they deal."), with a second short sentence only where
 * a rule genuinely needs it. Load-bearing numbers stay; edge-case prose,
 * parentheticals, and cross-references go. Shorter must never become wrong.
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // ── Utility (9) ──
    Draw: 'Draw that many cards from your deck, up to your hand limit.',
    Forge:
        'Forges a FLOATING die — or turns a dead X die WILD — that plays alongside your drafted die and is gone forever when spent. '
        + 'At the cap of 3, it grants +1 Conviction instead.',
    Guard:
        'Blocks that much incoming attack damage during the next threat phase. '
        + 'Unused Guard is lost unless the card prints "persists".',
    Tick: 'Your strongest damage-over-time effect on the enemy ticks again, immediately.',
    Mark:
        'Every damage-over-time tick on the bearer deals +1 VITAE per Mark stack. '
        + 'Marks hold until consumed.',
    Cleanse: 'Removes up to that many afflictions from you.',
    Heal: 'Restores that much VITAE, up to your maximum.',
    Rupture:
        'Consumes afflictions on the enemy and detonates their remaining harm as one burst. '
        + "The burst is capped at 60% of the enemy's max VITAE.",
    Siphon: 'Heals you for the printed percentage of the damage this play deals.',
    // ── Affliction (T1) ──
    Prolong: 'Adds that many turns to every damage-over-time effect you have on the enemy.',
    Reargue: "Flips the enemy's Bleed into Poison and its Poison into Bleed, each landing that much harder.",
    Poison:
        'Deals 2 VITAE per stack each time a card is played, growing by 1 every 2 rounds it holds. '
        + 'Applying poison again resets the growth.',
    Bleed: 'Each hit the bearer takes deals 3 more VITAE per Bleed stack, then removes a stack.',
    Doom:
        'Deals 1 VITAE per stack at the start of each round and grows a stack every time the enemy acts. '
        + 'It ends only when consumed.',
    // ── Peroration (T2) ──
    Premise:
        'A persistent tally your cards build toward the conclusion printed on its carrier. '
        + 'At the printed count the conclusion fires free and the tally resets.',
    // ── Forge (T3) ──
    Kindle:
        'Creates a temporary die of the printed color in your Reserve. '
        + 'If the Reserve is full, it grants +1 Conviction instead.',
    Pip:
        'A charge a Reserve die gains each threat phase it survives, to a max of 2. '
        + 'Each pip spent adds +1 intensity — or +2 Guard on a defend card.',
    // ── Akrasia (T4) ──
    Recoil: 'Pay the printed VITAE as a cost when the card is played — no defense can prevent it.',
    Fallen: "A state: you carry 2 or more different afflictions. A card's FALLEN line fires free while you are Fallen.",
    // ── Control (T5) ──
    Stagger:
        "Removes that many rungs from the enemy's next telegraphed action — 2 rungs on a normal action, 3 on a boss. "
        + 'Removing every rung denies the action outright.',
    Backfire:
        'The enemy takes 1 VITAE per Backfire stack for each rung its telegraphed action loses. '
        + 'A denied action counts all of its rungs.',
    // ── Oracle (T6) ──
    Foretell: "Reveals the enemy's next stance and looks at that many cards of your deck, moving the best to the top.",
    Omen: "Casts the paying die's color against the enemy's next stance — a match fires the printed payoff free.",
    // ── Harvest (T7) ──
    Soul: 'You gain 1 Soul each time an affliction on the enemy expires or is consumed.',
    Reap: 'Spends the printed number of Souls to fire the printed effect — with fewer Souls, it fizzles.',
    // ── Charm (T8) ──
    Sway:
        'Builds on the enemy and decays 1 at the end of each round. '
        + 'The enemy capitulates when Sway reaches its resolve — roughly 35% of its max VITAE.',
    Rapport: "The enemy's attacks deal 10% less damage per Rapport stack.",
    // ── Bulwark (T9) ──
    Thorns: 'The enemy takes 1 VITAE per Thorns stack each threat phase it attacks you — even through a full block.',
    Riposte:
        'Armed for one threat phase: the first incoming attack is reduced by the printed parry amount. '
        + 'If your Guard fully blocks an attack, the enemy takes the printed counter damage.',
    // ── Echo (T10) ──
    Echo: "The card's PAID line fires twice. FREE lines never echo.",
    Recall: 'Returns that many cards from your discard pile to your hand — highest rank first.',
    // ── Card types (labels, not keywords — never rendered in the inspect
    // keyword panel since 2026-07-12; kept for help surfaces + the KW lints) ──
    Enchantment: 'A passive on your side: 3 rounds when played free, permanent when paid with a die.',
    Disenchant: 'A standing curse on the enemy: 3 rounds when played free, permanent when paid with a die.',
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

/** Authored persistentEffect spellings that predate the phase-29 renames —
 *  mechanics text is engine-owned, so the old word maps here instead. */
const PERSISTENT_TEXT_ALIAS: Record<string, string> = {
    REPRISE: 'Recall',
};

/**
 * 2026-07-11 card-face-truth fix — PAYLOAD keywords for a persistent card.
 *
 * An enchant/disenchant's passive lives in ENGINE HOOKS keyed by card id (no
 * effect id ever reaches mobile), so the payload keyword is recovered from the
 * card's authored one-line summary (`Card.persistentEffect`), which prints its
 * mechanics as UPPERCASE registry words ('Every BLEED or POISON you apply…' —
 * the KW-5 lint guarantees at least one resolves for every library card).
 * Returns Title-Case registry keywords in text order, deduped; [] when nothing
 * resolves (callers keep the type-label-only fallback). The card-TYPE labels
 * (Enchantment/Disenchant) are types, not payloads, and are never returned.
 */
export function keywordsInPersistentText(text: string | null | undefined): string[] {
    if (!text) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const run of text.match(/[A-Z]{2,}/g) ?? []) {
        const title = run.charAt(0) + run.slice(1).toLowerCase();
        const kw = PERSISTENT_TEXT_ALIAS[run] ?? (KEYWORD_GLOSS[title] ? title : null);
        if (!kw || kw === 'Enchantment' || kw === 'Disenchant' || seen.has(kw)) continue;
        seen.add(kw);
        out.push(kw);
    }
    return out;
}

/**
 * The persistent card's VERB-slot keyword (owner directive 2026-07-12: the
 * face's ◆ line leads with what the card DOES — Entropy Tax leads MARK — while
 * the type word stays on the type strip / type chip). Authored summaries put
 * the outcome LAST ('Every KINDLEd or FORGEd die you spend MARKs the enemy.'),
 * so the last keyword mentioned wins; a summary that OPENS with its keyword
 * ('DRAW 1 card each time…') is already leading with the verb and wins outright.
 */
export function persistentVerbKeyword(text: string | null | undefined): string | null {
    const kws = keywordsInPersistentText(text);
    if (kws.length === 0) return null;
    if (text && text.toUpperCase().startsWith(kws[0].toUpperCase())) return kws[0];
    return kws[kws.length - 1];
}

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
 * threshold lines with no definition anywhere.
 *
 * 2026-07-12 (owner playtest) — NO LONGER dumped wholesale into every card's
 * inspect overlay: six always-on dice-system entries made every inspect a
 * scrolling wall, with some terms explained twice. A card's inspect now shows
 * only the entries its OWN printed lines reference ({@link systemTermsForCard});
 * the full list stays exported as the single source of truth for any future
 * dedicated help/glossary surface.
 */
export const SYSTEM_GLOSSARY: readonly { term: string; def: string }[] = [
    { term: 'CONVICTION ◆', def: 'A spend-anytime resource banked from unspent dice and overflow. It never decays.' },
    { term: 'RESONANCE ⬡', def: 'A running tally, for the whole combat, of dice you spend by color. A ⬡ threshold line fires once you have spent that many dice of its color this combat.' },
    { term: 'RESERVE & PIPS', def: 'Up to 2 dice held between phases instead of played. Each gains +1 pip per phase it survives, spent for extra intensity or Guard.' },
    { term: 'FLOATING ✦', def: 'A forged die that plays alongside your drafted die, never rerolls, and is gone forever when spent.' },
    { term: 'RUNGS', def: "The steps of the enemy's telegraphed action — 2 on a normal action, 3 on a boss. Losing all of them denies the action." },
    { term: 'WILD / X', def: 'A WILD die counts as any color. A dead X die powers nothing, but can be Forged wild or fate-tapped.' },
    // 2026-07-12 (owner directive: every printed term pops a definition) —
    // the two card-local Peroration-payoff words. PERORATION was demoted from
    // the keyword registry (phase 29) but still prints on the-closing-word;
    // CONCEDE is the alt-win it can escalate to. Neither had a popup anywhere.
    { term: 'PERORATION', def: 'A declared conclusion: when your Premise tally reaches the printed count, its payoff fires free and the tally resets.' },
    { term: 'CONCEDE', def: 'An alternate win — reaching the printed Premise count in one Peroration ends the fight. Elites and bosses demand the higher printed count.' },
];

/** How a card's PRINTED lines reference each system term. Matched against the
 *  card's own engine text (top/bottom action lines + die lines) — never against
 *  keyword glosses, which would drag the whole dump back in. */
const SYSTEM_TERM_MATCH: Record<string, RegExp> = {
    'CONVICTION ◆': /\bconviction\b/i,
    'RESONANCE ⬡': /\bresonance\b|⬡/,
    'RESERVE & PIPS': /\breserve\b|\bpips?\b/i,
    'FLOATING ✦': /\bfloating\b/i,
    'RUNGS': /\brungs?\b/i,
    'WILD / X': /\bwild\b|\bX die\b/,
    'PERORATION': /\bPERORATION\b/,
    'CONCEDE': /\bCONCEDE\b/,
};

/** Keyword chips whose own gloss already explains a system term — when such a
 *  chip renders on the card, the system entry is a duplicate and is skipped
 *  (owner directive 2026-07-12: each term explained at most once per overlay). */
const SYSTEM_TERM_COVERED_BY: Record<string, readonly string[]> = {
    'FLOATING ✦': ['FORGE'],           // the Forge gloss defines floating dice
    'RESERVE & PIPS': ['PIP', 'KINDLE'], // Pip/Kindle glosses define the Reserve
    'RUNGS': ['STAGGER', 'BACKFIRE'],  // both glosses define rungs
    'WILD / X': ['FORGE', 'CLARITY'],  // Forge (X→WILD) / Clarity (next die WILD)
};

/**
 * 2026-07-12 (owner playtest) — the per-card slice of the systems glossary:
 * only the entries the card's printed text actually references, minus any
 * already explained by one of its keyword chips. `printedText` is the joined
 * engine lines; `chipNames` the UPPERCASE keyword-panel names already shown.
 */
export function systemTermsForCard(
    printedText: string,
    chipNames: readonly string[],
): { term: string; def: string }[] {
    const chips = new Set(chipNames.map(n => n.toUpperCase()));
    return SYSTEM_GLOSSARY.filter(({ term }) => {
        const rx = SYSTEM_TERM_MATCH[term];
        if (!rx || !rx.test(printedText)) return false;
        return !(SYSTEM_TERM_COVERED_BY[term] ?? []).some(kw => chips.has(kw));
    });
}

/** True if a keyword belongs to the given hidden archetype's family. */
export function keywordInArchetype(keyword: string | null | undefined, archetype: string | null | undefined): boolean {
    if (!keyword || !archetype) return false;
    return (ARCHETYPE_KEYWORDS[archetype] ?? []).includes(keyword);
}
