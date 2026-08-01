/**
 * Card THEMES and their KEYWORD FAMILIES (spec 32).
 *
 * A theme is a family of keywords: its two HALLMARK keywords (the theme's own,
 * spec 32 §3) plus the shared utility keywords its cards lean on. Keywords
 * deliberately recur across themes — DRAW, MARK, RUPTURE, etc. are shared
 * connective tissue — so a theme reads as "the keywords that play well together
 * here", not an exclusive bucket. Every library card declares its `theme`; the
 * catalog lets you search by theme or by any keyword in a theme's family.
 *
 * The registry itself is spec 32 §3 (amended by phase 29, 2026-07-11): 30
 * keywords, no longer a clean 10-utility + 2-hallmark-per-theme split — the
 * language pass merged/retired/promoted a few entries in place (see
 * `axiomancer-mobile/state/combat/keywords.ts`'s module doc for the
 * ledger). ("Hallmark", not "signature" — `SignatureSkill` is the unrelated
 * Befriend concept.)
 */

/** The ten preset deck card themes */
export type CardTheme =
    | 'affliction'   // — ramping/front-loaded DoT, detonated
    | 'peroration'   // — build Premises toward a declared conclusion
    | 'forge'        // — manufacture dice, ripen pips, spend them
    | 'akrasia'      // — pay in blood; Fallen turns the debt into power
    | 'control'      // — strip action rungs; denied blows bleed inward
    | 'oracle'       // — foresee, declare, and collect on prophecy
    | 'harvest'      // — churn short afflictions into Souls, then reap
    | 'charm'        // — SWAY to capitulation; never touch HP
    | 'bulwark'      // — Guard/Thorns/Riposte; their aggression kills them
    | 'echo';        // — echo, recall, replay small effects relentlessly

/** Stable display/registry order (mirrors the spec §6 theme table). */
export const CARD_THEMES: readonly CardTheme[] = Object.freeze([
    'affliction', 'peroration', 'forge', 'akrasia', 'control',
    'oracle', 'harvest', 'charm', 'bulwark', 'echo',
]);

/**
 * Each theme's keyword FAMILY: the two HALLMARK keywords (the theme's own, spec
 * §3) first, then the utility keywords its cards genuinely synergise with.
 * Keywords appear in more than one family on purpose (e.g. DRAW spans several
 * build-around themes). These are the searchable keywords the catalog exposes
 * per theme.
 *
 * Phase 29 (KW-2/KW-6) fixed three "family lies" the 2026-07-10 audit found —
 * a keyword claimed for a theme with zero cards actually using it, making the
 * catalog search return empty sets for advertised members: affliction/akrasia
 * dropped CLEANSE (no card in either theme cleanses), harvest dropped RUPTURE
 * (no harvest card ruptures). BARRIER (merged into GUARD), PERORATION
 * (demoted), and CONJURE (retired — zero library cards) are also dropped;
 * REPRISE renamed to RECALL.
 */
export const THEME_KEYWORDS: Record<CardTheme, readonly string[]> = Object.freeze({
    affliction: ['POISON', 'BLEED', 'MARK', 'RUPTURE'],
    peroration: ['PREMISE', 'DRAW', 'GUARD'],
    forge:      ['KINDLE', 'PIP', 'FORGE', 'DRAW'],
    akrasia:    ['RECOIL', 'FALLEN', 'MARK', 'HEAL'],
    control:    ['STAGGER', 'BACKFIRE', 'FORETELL', 'DRAW'],
    oracle:     ['FORETELL', 'OMEN', 'DRAW', 'RUPTURE'],
    harvest:    ['SOUL', 'REAP', 'MARK'],
    charm:      ['SWAY', 'RAPPORT', 'CLEANSE', 'HEAL'],
    bulwark:    ['THORNS', 'RIPOSTE', 'GUARD', 'HEAL'],
    echo:       ['ECHO', 'RECALL', 'DRAW'],
});

/** The keyword family for a theme (empty for an unknown key). */
export function keywordsForTheme(theme: CardTheme): readonly string[] {
    return THEME_KEYWORDS[theme] ?? [];
}

/** True when the string is a known card theme. */
export function isCardTheme(v: string): v is CardTheme {
    return (CARD_THEMES as readonly string[]).includes(v);
}
