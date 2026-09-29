/**
 * Keyword registry — the player-facing combat vocabulary (spec 32 §3,
 * amended 2026-07-11 by the Phase 29 language pass).
 *
 * 30 KEYWORDS (down from a drifted 32 — the "exactly 30" directive yields
 * to earned support: see `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-keyword-registry.md`).
 * Spec 33 §6 (D4, 2026-07-17) registers three more die-gear rows: BOON
 * (the face payload) plus the blacksmith upgrade verbs HONE and TEMPER.
 * Phase 29 (`plan/archive/2026-09-25-trim-t4/plan/phases/phase_29_keyword_registry.md`) folded six
 * previously-unmapped debuff ids into registry keywords, renamed three
 * colliding words (FESTER→PROLONG, TRANSMUTE→CURDLE, REPRISE→RECALL),
 * retired/merged three ghosts (BARRIER into GUARD, CONJURE — zero library
 * cards, SENTENCE — demoted to card-local text on its sole carrier), and
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
 * card faces, glossary, and combat log read instead. Pure, with no
 * dependencies. (The enemy keyword vocabulary it once adapted was deleted with
 * the keywords themselves in revamp phase R2b, D63.)
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
    // ── The effect-backed keywords ──
    debuff_bleed: 'Bleed',
    debuff_mark: 'Mark',
    // S3 (D43) — rebuilt for the grey office's A Plain Word.
    debuff_vulnerable: 'Vulnerable',
    // Revamp R4 (D45) deleted Poison, Quarter and Doom: the signature skills
    // were their last carriers, and are GUARD placeholders now.
};

/**
 * SUPPORT effect ids (items / consumables / the Cards token system — tagged
 * `support`/`non-card` in the effect libraries). NOT card keywords and NOT in
 * the 30-keyword glossary; mapped so the combat log never prints a raw id.
 */
const SUPPORT_KEYWORD: Record<string, string> = {
    // No live applier since the threat-clock enchant was trimmed (T2a);
    // mapped so a legacy save's combat log never prints the raw id.
    debuff_curse: 'Mark',
    // Consumable / engine buffs that still resolve. (BARRIER merged into GUARD
    // in phase 29, so buff_invincibility maps to Guard.)
    buff_regeneration: 'Heal',
    buff_phoenix_vigor: 'Heal',
    buff_cleanse: 'Cleanse',
    buff_absolved: 'Cleanse',
    // adjust-equipment pass 11 (2026-09-15) split clarity-serum onto this tier-1
    // cleanse but never added the mapping here — clarity-serum's combat log
    // silently printed no keyword ever since. Backfilled adjust-equipment pass 14.
    buff_cleanse_minor: 'Cleanse',
    buff_damage_reduction: 'Guard',
    buff_all_stats_up: 'Guard',
    buff_invincibility: 'Guard',
    buff_haste: 'Draw',
    // adjust-equipment pass 15 (2026-09-21): war-horn-draught's tier-3 split
    // off buff_haste (see consumable.library.ts) — same closest-analogue
    // mapping as its parent effect, backfilled in the same tick this time.
    buff_haste_surge: 'Draw',
    // The keyword purge (2026-09-28) retired FORETELL; buff_accuracy_up now
    // falls back to its own effect name instead of a borrowed gloss.
    buff_critical_rate_up: 'Mark',
    buff_critical_damage_up: 'Mark',
    buff_status_chance_up: 'Mark',
    // issue #307: single-stance split of buff_critical_damage_up (philosopher-tea
    // / void-essence no longer share an effect) — same closest-analogue mapping.
    buff_liars_gambit: 'Mark',
    buff_abyssal_presence: 'Mark',
    // adjust-equipment pass 14 (2026-09-20): tier-1 split of buff_damage_reduction
    // (body-elixir vs iron-skin-draught, same byte-identical-effect bug class).
    buff_stoic_resolve: 'Guard',
};

/** Verb class → keyword for cards whose action is the keyword itself. */
const VERB_KEYWORD: Record<string, string> = {
    defend: 'Guard',
    oath: 'Oath',
    hex: 'Hex',
};

/**
 * Special-mechanic kind → keyword (Title-Case). The MISSING half of the
 * vocabulary map: `EFFECT_KEYWORD` covers effect-backed cards (Poison / Mark /
 * …), but a card whose PAID identity is a `specialMechanics` verb (STAGGER,
 * PLEA, …) had no keyword resolution and fell through to the ambiguous
 * "DEBUFF / buff yourself" face. Every headline-able mechanic maps to a real
 * glossary keyword here so the face can always print `KEYWORD · value`.
 *
 * Kinds the face prints through their own face kind or plain rules text
 * (guard/barrier/riposte, the die verbs, `deal`, and every kind whose
 * keyword left with the card purge) are intentionally absent. The mobile
 * KW-3 lint lists each one with its reason.
 */
const MECHANIC_KEYWORD: Record<string, string> = {
    // `deal` deliberately has NO keyword row: "Deal 24" is plain English (MTG's
    // rule: keyword what compresses). The keyword audit (2026-09-27) removed
    // every row whose keyword lost its gloss with the purged cards, and revamp
    // R4 (D45) the last four (Stagger, Plea, Wrath, Chain) with the signature
    // skills that carried them. Those kinds stay in the engine union until
    // R7a and are listed in KINDS_WITHOUT_MECHANIC_KEYWORD.
};

/**
 * Keyword → a short, general definition (the glossary rule). The card's own
 * numbers live on the face/preview; this explains the keyword.
 *
 * The table holds only words something live still prints: the grey office
 * (GUARD/VULNERABLE), the signature skills (GUARD), consumables (HEAL,
 * CLEANSE, DRAW, MARK), a map hazard (BLEED), the dice system (PIP, BOON,
 * HONE, TEMPER) and the two card-type labels. Revamp R4 (D45) cut POISON,
 * DOOM, QUARTER, STAGGER, PLEA, WRATH and CHAIN when the signature skills,
 * their last carriers, became GUARD placeholders. Git history keeps the rest.
 *
 * 2026-07-12 (owner playtest) — TERSE GLOSSES: every gloss is ONE short
 * sentence in the Dawncaster register ("Cards with Lifedrain restore health
 * equal to the damage they deal."), with a second short sentence only where
 * a rule genuinely needs it. Load-bearing numbers stay; edge-case prose,
 * parentheticals, and cross-references go. Shorter must never become wrong.
 */
const KEYWORD_GLOSS: Record<string, string> = {
    // ── Utility ──
    Draw: 'Draw that many cards from your deck, up to your hand limit.',
    Guard:
        'Blocks that much incoming attack damage during the next threat phase. '
        + 'Unused Guard is lost unless the card prints "persists".',
    Mark:
        'Every damage-over-time tick on the bearer deals +1 VITAE per Mark stack. '
        + 'Marks hold until consumed.',
    Cleanse: 'Removes up to that many afflictions from you.',
    Heal: 'Restores that much VITAE, up to your maximum.',
    // ── Affliction ──
    Bleed: 'Each hit the bearer takes deals 3 more VITAE per Bleed stack, then removes a stack.',
    Vulnerable:
        'The foe takes that much more damage from every hit. Adding more stacks it and refreshes the turns.',
    // ── Dice ──
    Pip:
        'Each threat phase a Reserve die survives, it gains one pip, capped at 2 '
        + '(some cards can push past the cap and risk a bust). '
        + 'Each pip spent adds +1 intensity, or +2 Guard on a defend card.',
    // ── Die gear (spec 33 Upgradeable Dice §6, registered D4 2026-07-17) —
    // BOON is the face payload; HONE/TEMPER are the blacksmith upgrade verbs.
    // (Renamed from SPECIAL — R-8, phase 44b.) ──
    Boon: "A die's BOON face powers a card of its color and grants Conviction. Its equipped gear sets how much (2 by default).",
    Hone: "A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card.",
    Temper: "A blacksmith upgrade: turns a mana face into a BOON face. A colored die caps at 2 boon and 1 miss, gold at 1.",
    // ── Card types (labels, not keywords — never rendered in the inspect
    // keyword panel since 2026-07-12; kept for help surfaces + the KW lints) ──
    Oath: 'A passive on your side: 3 rounds when played free, permanent when paid with a die.',
    Hex: 'A standing curse on the foe: 3 rounds when played free, permanent when paid with a die.',
};

/**
 * 2026-07-11 card-face-truth fix — PAYLOAD keywords for a persistent card.
 *
 * An oath/hex's passive lives in ENGINE HOOKS keyed by card id (no
 * effect id ever reaches mobile), so the payload keyword is recovered from the
 * card's authored one-line summary (`Card.persistentEffect`), which prints its
 * mechanics as UPPERCASE registry words ('Every BLEED or POISON you apply…' —
 * the KW-5 lint guarantees at least one resolves for every library card).
 * Returns Title-Case registry keywords in text order, deduped; [] when nothing
 * resolves (callers keep the type-label-only fallback). The card-TYPE labels
 * (Oath/Hex) are types, not payloads, and are never returned.
 */
export function keywordsInPersistentText(text: string | null | undefined): string[] {
    if (!text) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const run of text.match(/[A-Z]{2,}/g) ?? []) {
        const title = run.charAt(0) + run.slice(1).toLowerCase();
        const kw = KEYWORD_GLOSS[title] ? title : null;
        if (!kw || kw === 'Oath' || kw === 'Hex' || seen.has(kw)) continue;
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

/** The keyword a special-mechanic kind headlines, or null for kinds that
 *  carry their own face kind (guard/rupture/forge/…) or no keyword at all. */
export function keywordForMechanic(kind: string | null | undefined): string | null {
    if (!kind) return null;
    return MECHANIC_KEYWORD[kind] ?? null;
}

/**
 * Every mechanic kind that carries a keyword badge (phase 68). Exported so the
 * KW-2 lint can check the REVERSE drift — a mapping row surviving the engine
 * kind it described — without keeping its own copy of this table.
 */
export function mechanicKeywordKeys(): readonly string[] {
    return Object.keys(MECHANIC_KEYWORD);
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
    { term: 'RESERVE & PIPS', def: 'Up to 2 dice held between phases instead of played. Each gains +1 pip per phase it survives, spent for extra intensity or Guard.' },
    { term: 'RUNGS', def: "The foe's telegraphed action has rungs: 2 on a normal action, 3 on a boss. Losing all of them denies the action." },
    { term: 'WILD / X', def: 'A WILD die counts as any color. A dead X die powers nothing.' },
    // The keyword audit (2026-09-27, after the card purge) removed TOLL,
    // GHOST, SENTENCE and CONDEMN: no card the player holds prints them now.
    // 2026-07-18 (owner playtest) — INTENSITY and FREE are RETIRED from the
    // overlay glossary: both read plainly enough in context, and their rows
    // padded every inspect (they were the 07-12 audit's additions).
];

/** How a card's PRINTED lines reference each system term. Matched against the
 *  card's own engine text (top/bottom action lines + die lines) — never against
 *  keyword glosses, which would drag the whole dump back in. */
const SYSTEM_TERM_MATCH: Record<string, RegExp> = {
    'CONVICTION ◆': /\bconviction\b/i,
    'RESERVE & PIPS': /\breserve\b|\bpips?\b/i,
    'RUNGS': /\brungs?\b/i,
    'WILD / X': /\bwild\b|\bX die\b/,
};

/** Keyword chips whose own gloss already explains a system term — when such a
 *  chip renders on the card, the system entry is a duplicate and is skipped
 *  (owner directive 2026-07-12: each term explained at most once per overlay). */
const SYSTEM_TERM_COVERED_BY: Record<string, readonly string[]> = {
    'RESERVE & PIPS': ['PIP'],  // the Pip gloss defines the Reserve
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
