/**
 * Card THEMES and their KEYWORD FAMILIES (spec 32).
 *
 * A theme is a family of keywords: its two signature keywords (spec 32 §3) plus
 * the shared utility keywords its cards lean on. Keywords deliberately recur
 * across themes — DRAW, MARK, RUPTURE, etc. are shared connective tissue — so a
 * theme reads as "the keywords that play well together here", not an exclusive
 * bucket. Every library card declares its `theme`; the catalog lets you search
 * by theme or by any keyword in a theme's family.
 *
 * The 30-keyword registry itself is spec 32 §3 (10 utility + 2 × 10 signatures).
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
    | 'echo';        // — echo, reprise, replay small effects relentlessly

/** Stable display/registry order (mirrors the spec §6 theme table). */
export const CARD_THEMES: readonly CardTheme[] = Object.freeze([
    'affliction', 'peroration', 'forge', 'akrasia', 'control',
    'oracle', 'harvest', 'charm', 'bulwark', 'echo',
]);

/**
 * Each theme's keyword FAMILY: the two signatures (spec §3) first, then the
 * utility keywords its cards genuinely synergise with. Keywords appear in more
 * than one family on purpose (e.g. DRAW spans several build-around themes).
 * These are the searchable keywords the catalog exposes per theme.
 */
export const THEME_KEYWORDS: Record<CardTheme, readonly string[]> = Object.freeze({
    affliction: ['POISON', 'BLEED', 'MARK', 'TICK', 'RUPTURE', 'CLEANSE'],
    peroration: ['PREMISE', 'PERORATION', 'DRAW', 'GUARD'],
    forge:      ['KINDLE', 'PIP', 'FORGE', 'DRAW'],
    akrasia:    ['RECOIL', 'FALLEN', 'MARK', 'HEAL', 'CLEANSE'],
    control:    ['STAGGER', 'BACKFIRE', 'FORETELL', 'DRAW'],
    oracle:     ['FORETELL', 'OMEN', 'DRAW', 'RUPTURE'],
    harvest:    ['SOUL', 'REAP', 'MARK', 'TICK', 'RUPTURE'],
    charm:      ['SWAY', 'RAPPORT', 'CLEANSE', 'HEAL'],
    bulwark:    ['THORNS', 'RIPOSTE', 'GUARD', 'BARRIER', 'HEAL'],
    echo:       ['ECHO', 'REPRISE', 'CONJURE', 'DRAW'],
});

/** The keyword family for a theme (empty for an unknown key). */
export function keywordsForTheme(theme: CardTheme): readonly string[] {
    return THEME_KEYWORDS[theme] ?? [];
}

/** True when the string is a known card theme. */
export function isCardTheme(v: string): v is CardTheme {
    return (CARD_THEMES as readonly string[]).includes(v);
}
