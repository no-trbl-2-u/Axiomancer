/**
 * Keyword registry — the player-facing combat vocabulary (spec 32 §3,
 * amended 2026-07-11 by the Phase 29 language pass).
 *
 * 30 KEYWORDS (down from a drifted 32 — the "exactly 30" directive yields
 * to earned support: see `plan/tuning/2026-07-10-keyword-registry.md`).
 * Spec 33 §6 (D4, 2026-07-17) registers three more die-gear rows: BOON
 * (the face payload) plus the blacksmith upgrade verbs HONE and TEMPER.
 * Phase 29 (`plan/phases/phase_29_keyword_registry.md`) folded six
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
 * card faces, glossary, and combat log read instead. Pure; its only dependency
 * is the engine's ENEMY keyword table (see the ENEMY VOCABULARY block at the
 * foot of this file — those words and their reminder text are content the foe
 * ships with, not copy mobile is free to invent).
 *
 * Why mobile-side: a player-facing label is presentation (ADR-0001/0003 — the
 * engine owns truth, mobile owns how it reads). Never rename engine effect ids
 * for player text — map them here.
 *
 * Keywords are stored Title-Case; display sites uppercase where they want the
 * pop (card face, glossary header). The combat log uses Title-Case directly.
 */

import {
    ENEMY_KEYWORD_GLOSS, ENEMY_KEYWORD_KINDS, ENEMY_KEYWORD_LABEL,
    enemyKeywordGloss, enemyKeywordText,
    type EnemyKeyword,
// Relative, NOT the `@mechanics` alias: `axiomancer-mechanics/scripts/export-catalog.ts`
// imports this module directly under ts-node, where mobile's tsconfig paths do
// not apply. The alias would resolve for the app and break the catalog build.
} from '../../../axiomancer-mechanics/src/Enemy/enemy-keywords';

/** Effect id → keyword (Title-Case). The CARD vocabulary (spec 32 v3 §3). */
const EFFECT_KEYWORD: Record<string, string> = {
    // ── The six effect-backed keywords ──
    debuff_poison: 'Poison',
    debuff_bleed: 'Bleed',
    debuff_mark: 'Mark',
    debuff_backfire: 'Backfire',
    debuff_quarter: 'Quarter',
    buff_thorns: 'Thorns',
    // ── KW-1 fold (phase 29): DoT-species ids that had no keyword home and
    // rendered the blank "◆ DIE" face. Presentation-only — no payloads
    // change. Of the cloud pass's six, four (argument_wound, echo_sting,
    // foretold_wound, backfire_acute) were retired at the ID level by this
    // session's WS3.5/WS8.1 folds and need no mapping anymore; the two
    // still-live species keep the cloud mapping. ──
    debuff_kindling_ember: 'Bleed',
    debuff_nettle_sting: 'Bleed',
    // ── DOOM — promoted to a full registry keyword by the Profane Canon
    // rework (2026-08-08): the inevitability DoT now has a dozen carriers
    // across rot/debt/grave/trial/choir (was the card-local 'doom-species'
    // sandbox row). ──
    debuff_creeping_doom: 'Doom',
    // ── KW-1 (2026-09-02, THE BIG NUMBERS REWRITE): `buff_grace_momentum` was
    // engine-granted only (irresistible-grace's turn-boundary stack), so it
    // never needed a card-vocabulary row. The rewritten choir pool now AUTHORS
    // it on a card, and an authored effect with no keyword renders the blank
    // face KW-1 exists to catch. It multiplies every PLEA gain, so PLEA is the
    // word it belongs to — no new registry row earned by one carrier. ──
    buff_grace_momentum: 'Plea',
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
    buff_absolved: 'Cleanse',
    buff_damage_reduction: 'Guard',
    buff_all_stats_up: 'Guard',
    buff_invincibility: 'Guard',
    buff_haste: 'Draw',
    buff_accuracy_up: 'Foretell',
    buff_critical_rate_up: 'Mark',
    buff_critical_damage_up: 'Mark',
    buff_status_chance_up: 'Mark',
    // issue #307: single-stance split of buff_critical_damage_up (philosopher-tea
    // / void-essence no longer share an effect) — same closest-analogue mapping.
    buff_liars_gambit: 'Mark',
    buff_abyssal_presence: 'Mark',
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
 * Kinds handled by their OWN face kind (guard/barrier/riposte/rupture/reap
 * and the FORGE die-verb cluster) are intentionally absent — they never
 * reach the generic mechanic path.
 *
 * Phase 29 (KW-2/KW-3): `peroration` demoted (no keyword entry — its sole
 * carrier, the-closing-word, prints "SENTENCE at N" via `mechanicText`
 * directly; the CHARGE gloss below explains the trigger). `consume_affliction`
 * re-mapped Soul→Rupture (extends RUPTURE's printed sense instead of minting
 * CONSUME). `reprise`→Recall, `extend_dots`/`boost_all_dots`→Prolong
 * (renames). `replay_last`→Echo mapping DELETED (ouroboros is a 1-of rare;
 * `mechanicText`'s own case already gives it full descriptive text — no
 * keyword badge needed). `conjure_card` has no mapping — CONJURE was never
 * re-registered as a badge, and THE BIG NUMBERS REWRITE (2026-09-02) gave it
 * a second life via Grave Goods (`grave.cards.ts`) without reviving the
 * word: 1 live library carrier as of 2026-09-09 (`/adjust-keywords` pass 4
 * re-audit corrected this comment's stale "zero library cards" claim, dated
 * to phase 29 and never updated when Grave Goods shipped), still below the
 * atlas's own ≥2-carrier discipline, so it stays plain rules text (the face
 * prints "Conjure a Cinder into your hand.", no ALL-CAPS word to badge).
 * `siphon` PROMOTED to a real keyword (was raw lowercase
 * text with no gloss). `convert_dots`→Curdle mapping DELETED (2026-09-05
 * `/adjust-keywords` pass 1: CURDLE's sole carrier fell below the atlas's
 * own ≥2-carrier discipline; demoted to plain rules text, same shape as
 * `peroration` above).
 */
const MECHANIC_KEYWORD: Record<string, string> = {
    // ── Control ──
    stagger: 'Stagger',
    lock_stance: 'Stagger',
    // TURNABOUT (phase 32 part 4a) — cashes the whole STAGGER/BACKFIRE
    // denial ledger; badged as BACKFIRE's own "ALL" variant (REAP ALL /
    // RUPTURE ALL precedent), not a new registry keyword.
    turnabout: 'Backfire',
    // ── Oracle ──
    foretell: 'Foretell',
    omen: 'Omen',
    // ── Sentence ──
    premise: 'Charge',
    spend_premises: 'Charge',
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
    sway: 'Plea',
    // ── Echo ──
    echo: 'Echo',
    echo_next_spell: 'Echo',
    reprise: 'Recall',
    // ── Affliction glue ──
    extend_dots: 'Prolong',
    // convert_dots (CURDLE) retired as a badge 2026-09-05 (/adjust-keywords
    // pass 1): one carrier, below the atlas's own ≥2 discipline. Prints as
    // plain rules text now — see KINDS_WITHOUT_MECHANIC_KEYWORD.
    boost_all_dots: 'Fester',
    // ── The pyre verbs (Profane Canon rework, 2026-08-08) ──
    immolate: 'Immolate',
    purge_self: 'Purge',
    // REPLAY earns its row with the rework (open-every-grave headlines it).
    replay_last: 'Replay',
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its family.
    //    `deal` deliberately has NO keyword row: "Deal 24" is plain English
    //    and shouting it would spend the face-term budget on the one verb
    //    that needs no explanation (MTG's rule: keyword what compresses). ──
    wrath: 'Wrath',
    flay: 'Flay',
    twin: 'Twin',
    chain: 'Chain',
    execute: 'Execute',
    overkill: 'Overkill',
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
        'Forges a GHOST die (or revives a dead X die as WILD) that plays beside your drafted die and is spent for good. '
        + 'At 3 dice, it grants +1 Conviction instead.',
    Guard:
        'Blocks that much incoming attack damage during the next threat phase. '
        + 'Unused Guard is lost unless the card prints "persists".',
    Tick: 'Your strongest damage-over-time effect on the foe ticks again, immediately.',
    Mark:
        'Every damage-over-time tick on the bearer deals +1 VITAE per Mark stack. '
        + 'Marks hold until consumed.',
    Cleanse: 'Removes up to that many afflictions from you.',
    Heal: 'Restores that much VITAE, up to your maximum.',
    Rupture:
        "Consumes the foe's afflictions and deals their remaining damage at once. ALL-spenders are uncapped.",
    Siphon: 'Heals you for the printed percentage of the damage this play deals.',
    // ── Affliction (T1) ──
    Prolong: 'Adds that many turns to every damage-over-time effect you have on the foe.',
    Fester: 'Every damage-over-time effect on the foe gains that much intensity.',
    Poison:
        'Each time a card is played, the foe loses 2 VITAE per Poison stack. The longer it holds, the harder it bites.',
    Bleed: 'Each hit the bearer takes deals 3 more VITAE per Bleed stack, then removes a stack.',
    Doom:
        'Deals 1 VITAE per stack at the start of each round and grows a stack every time the foe acts. '
        + 'It ends only when consumed.',
    // ── Sentence (T2) ──
    Charge:
        'A running tally. When it reaches the count printed on the card that spends it, that payoff fires free and the tally resets.',
    // ── Forge (T3) ──
    Kindle:
        'Creates a temporary die of the printed color in your Reserve. '
        + 'If the Reserve is full, it grants +1 Conviction instead.',
    Pip:
        'Each threat phase a Reserve die survives, it gains one pip, capped at 2 '
        + '(some cards can push past the cap and risk a bust). '
        + 'Each pip spent adds +1 intensity, or +2 Guard on a defend card.',
    // ── Akrasia (T4) ──
    Recoil: 'Pay the printed VITAE as a cost when the card is played. No defense can prevent it.',
    Fallen: "A state: you carry 2 or more different afflictions. A card's FALLEN line fires free while you are Fallen.",
    // ── Control (T5) ──
    // 2026-07-12 (card-wording audit) — the old "2 rungs / 3 on a boss" clause
    // stated how many rungs an action HAS (the RUNGS system term), not how many
    // Stagger removes, and so contradicted every `STAGGER 1` face.
    Stagger:
        "Removes that many rungs (the steps of the foe's telegraph) from its next action. "
        + 'Strip them all and the action is denied.',
    Backfire:
        'The foe takes 1 VITAE per Backfire stack for each rung its telegraphed action loses. '
        + 'A denied action counts all of its rungs.',
    // ── Oracle (T6) ──
    Foretell: "Reveals the foe's next stance and looks at that many cards of your deck, moving the best to the top.",
    // Phase 32 part 4d — OMEN v2: a stance/window claim staked at cast (not
    // derived from the die), with a Conviction ante paid up front.
    Omen:
        'Stake a stance and a window of phases it must land within, paying a Conviction ante up front '
        + '(a wider window is safer but pays less). A hit fires the payoff free and a miss keeps the ante.',
    // ── Harvest (T7) ──
    Soul: 'You gain 1 Soul each time an affliction on the foe expires or is consumed.',
    Reap: 'Spends the printed number of Souls to fire the printed effect. With fewer Souls, it fizzles.',
    // ── Charm (T8) ──
    Plea:
        'Builds on the foe and decays 1 each round. At their resolve (~35% of max VITAE), they relent.',
    Quarter: "The foe's attacks deal 10% less damage per Quarter stack.",
    // ── Bulwark (T9) ──
    Thorns: 'The foe takes 1 VITAE per Thorns stack each threat phase it attacks you, even through a full block.',
    Riposte:
        'Armed for one threat phase: reduces the first attack by its parry (CUT) value. '
        + 'If Guard fully blocks it, the foe takes CTR damage instead, or more if the blow was bigger.',
    // ── Echo / Grave ──
    Echo: "The card's PAID line fires twice. FREE lines never echo.",
    Recall: 'Returns that many cards from your discard pile to your hand, highest rank first.',
    Replay: 'Says your last spell again: its PAID payload fires that many more times.',
    Requiem: "A card's REQUIEM line fires free while your discard pile holds that many cards.",
    // ── The pyre verbs (Profane Canon rework, 2026-08-08) ──
    Immolate: 'Burns the lowest-rank cards in your hand as a cost, and they leave the fight entirely. A curse burns as well as anything.',
    Purge: 'Playing this curse removes it from the fight entirely. A die and a beat buy the deck clean.',
    // 2026-07-12 (card-wording audit) — MILL was printed on three echo cards
    // ('mill 1 to discard') with no gloss, no glyph, and no registry row: the
    // only fully unglossed mechanic word in the sweep. Three carriers clears
    // the card-keyword doctrine's registry bar.
    Mill: 'Sends that many cards from your deck to your discard pile.',
    // ── Die gear (spec 33 Upgradeable Dice §6, registered D4 2026-07-17) —
    // BOON is the face payload; HONE/TEMPER are the blacksmith upgrade verbs.
    // (Renamed from SPECIAL — R-8, phase 44b.) ──
    Boon: "A die's BOON face powers a card of its color and grants Conviction. Its equipped gear sets how much (2 by default).",
    Hone: "A blacksmith upgrade: adds a mana face to a die's gear, so more of its rolls power a card.",
    Temper: "A blacksmith upgrade: turns a mana face into a BOON face. A colored die caps at 2 boon and 1 miss, gold at 1.",
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — the damage family (7) ──
    Pierce: "This damage ignores the foe's HIDE and every effect that would reduce it.",
    Wrath: 'Every hit you land deals that much more, for the rest of the fight. It stacks and never fades.',
    Flay: 'Each of your next hits deals half again as much, spending one stack per hit.',
    Twin: 'Your next spell this turn resolves its PAID line twice.',
    Chain: 'Your next hit deals that much more. Chain fades at the end of a turn that added none.',
    Execute: "While the foe is at or below the printed share of its VITAE, this card's damage doubles.",
    Overkill: 'Damage past the killing blow is not wasted: it converts at the printed rate.',
    // ── Words the atlas documented but nothing glossed (added 2026-09-02
    //    when the content-drift gate finally compared all three registries).
    //    BARRIER is deliberately NOT here: phase 29 merged it into GUARD, which
    //    prints "GUARD N (persists)". Re-adding it would resurrect a retired
    //    keyword, which KW-3 correctly refuses. ──
    Finale: 'This line fires only when playing the card leaves that few cards in your hand.',
    Relent: "When PLEA breaks the foe's resolve it offers to yield, and you choose whether to accept.",
    // ── Turn shape (3) — the conditions a card's line waits on ──
    Ambush: 'This line fires only when the card is your first spell of the turn.',
    Flow: 'This line fires once you have already played that many spells this turn.',
    // `/adjust-keywords` pass 11 — the Chaos-family drill (Dawncaster
    // Balance/Order): a PARITY read on the draw pile, not a turn-position
    // gate like AMBUSH/FLOW above.
    Eventide: 'This line fires free while your draw pile holds an even number of cards.',
    // ── Card types (labels, not keywords — never rendered in the inspect
    // keyword panel since 2026-07-12; kept for help surfaces + the KW lints) ──
    Oath: 'A passive on your side: 3 rounds when played free, permanent when paid with a die.',
    Hex: 'A standing curse on the foe: 3 rounds when played free, permanent when paid with a die.',
};

/**
 * Hidden archetype → its keyword family. Powers the (invisible) reward skew.
 * Never surfaced to the player. Re-cut over the 10 v3 themes.
 */
export const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
    bleeder: ['Poison', 'Bleed', 'Tick', 'Rupture', 'Soul', 'Reap', 'Recoil', 'Fallen'],
    guardian: ['Guard', 'Thorns', 'Riposte', 'Heal', 'Cleanse', 'Quarter', 'Plea'],
    controller: ['Stagger', 'Backfire', 'Mark', 'Foretell', 'Omen', 'Charge', 'Echo', 'Recall'],
};

/** Authored persistentEffect spellings that predate the phase-29 renames —
 *  mechanics text is engine-owned, so the old word maps here instead. */
const PERSISTENT_TEXT_ALIAS: Record<string, string> = {
    REPRISE: 'Recall',
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
        const kw = PERSISTENT_TEXT_ALIAS[run] ?? (KEYWORD_GLOSS[title] ? title : null);
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

/** The keyword a special-mechanic kind headlines (e.g. stagger → Stagger), or
 *  null for kinds that carry their own face kind (guard/rupture/forge/…). */
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
    { term: 'TOLL ⬡', def: 'A running tally, for the whole combat, of dice you spend by color. A ⬡ threshold line fires once you have spent that many dice of its color this combat.' },
    { term: 'RESERVE & PIPS', def: 'Up to 2 dice held between phases instead of played. Each gains +1 pip per phase it survives, spent for extra intensity or Guard.' },
    { term: 'GHOST ✦', def: 'A forged die that plays alongside your drafted die, never rerolls, and is gone forever when spent.' },
    { term: 'RUNGS', def: "The foe's telegraphed action has rungs: 2 on a normal action, 3 on a boss. Losing all of them denies the action." },
    { term: 'WILD / X', def: 'A WILD die counts as any color. A dead X die powers nothing, but can be Forged wild or fate-tapped.' },
    // 2026-07-12 (owner directive: every printed term pops a definition) —
    // the two card-local Sentence-payoff words. SENTENCE was demoted from
    // the keyword registry (phase 29) but still prints on the-closing-word;
    // CONDEMN is the alt-win it can escalate to. Neither had a popup anywhere.
    { term: 'SENTENCE', def: 'A declared conclusion: when your Charge tally reaches the printed count, its payoff fires free and the tally resets.' },
    { term: 'CONDEMN', def: 'An alternate win: reaching the printed Charge count in one Sentence ends the fight. Elites and bosses demand the higher printed count.' },
    // 2026-07-18 (owner playtest) — INTENSITY and FREE are RETIRED from the
    // overlay glossary: both read plainly enough in context, and their rows
    // padded every inspect (they were the 07-12 audit's additions).
];

/** How a card's PRINTED lines reference each system term. Matched against the
 *  card's own engine text (top/bottom action lines + die lines) — never against
 *  keyword glosses, which would drag the whole dump back in. */
const SYSTEM_TERM_MATCH: Record<string, RegExp> = {
    'CONVICTION ◆': /\bconviction\b/i,
    'TOLL ⬡': /\bresonance\b|⬡/,
    'RESERVE & PIPS': /\breserve\b|\bpips?\b/i,
    'GHOST ✦': /\bghost\b/i,
    'RUNGS': /\brungs?\b/i,
    'WILD / X': /\bwild\b|\bX die\b/,
    'SENTENCE': /\bSENTENCE\b/,
    'CONDEMN': /\bCONDEMN\b/,
};

/** Keyword chips whose own gloss already explains a system term — when such a
 *  chip renders on the card, the system entry is a duplicate and is skipped
 *  (owner directive 2026-07-12: each term explained at most once per overlay). */
const SYSTEM_TERM_COVERED_BY: Record<string, readonly string[]> = {
    'GHOST ✦': ['FORGE'],           // the Forge gloss defines ghost dice
    'RESERVE & PIPS': ['PIP', 'KINDLE'], // Pip/Kindle glosses define the Reserve
    'RUNGS': ['STAGGER', 'BACKFIRE'],  // both glosses define rungs
    // 2026-08-09 (phase 44b, spec 34 §5.2.1) — CLARITY dropped: it named no
    // KEYWORD_GLOSS row (stale since before this phase; Forge alone covers X→WILD).
    'WILD / X': ['FORGE'],

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

// ── THE ENEMY VOCABULARY (THE BIG NUMBERS REWRITE, 2026-09-02) ──────────────
//
// HIDE / SWIFT / BRUTAL / VENOM / UNSHAKEN / ELUSIVE / REGROW / RAVENOUS /
// WOUNDING change the ARITHMETIC of a fight, so the foe's pane must print them
// and every printed word must pop a definition — the same law the card side has
// obeyed since 2026-07-12. Unlike card keywords, the word AND its reminder text
// are ENGINE content (they ship with the foe, with the foe's own number in
// them), so this file does not restate them: it adapts `ENEMY_KEYWORD_GLOSS`
// into the `{ label, gloss }` shape a chip renders, and nothing more.
//
// They deliberately stay OUT of `KEYWORD_GLOSS`: that map is the CARD registry
// the KW lints and the inspect overlay walk, and a foe's armour rating is not a
// card keyword.

/**
 * The chip a foe's keyword renders as: the printed token (`HIDE 6`, `BRUTAL`)
 * and its reminder text with THIS instance's number already substituted in, so
 * the popup can never quote a number the engine is not applying.
 */
export function enemyKeywordChip(keyword: EnemyKeyword): { label: string; gloss: string } {
    return { label: enemyKeywordText(keyword), gloss: enemyKeywordGloss(keyword) };
}

/**
 * The gloss for an enemy keyword named by its printed TOKEN — the read path for
 * the combat log, whose `enemy-keyword-fired` event carries the word (`'SWIFT'`,
 * `'HIDE 6'`) rather than the keyword instance. Returns the un-substituted
 * reminder text (its `{n}` slot intact) when the token carries no number, and
 * null for a word that is not an enemy keyword at all.
 */
export function enemyKeywordGlossForToken(token: string | null | undefined): string | null {
    if (!token) return null;
    const [word, value] = token.trim().split(/\s+/);
    const kind = ENEMY_KEYWORD_KINDS.find(k => ENEMY_KEYWORD_LABEL[k] === word.toUpperCase());
    if (!kind) return null;
    const gloss = ENEMY_KEYWORD_GLOSS[kind];
    return value ? gloss.replace('{n}', value) : gloss;
}
