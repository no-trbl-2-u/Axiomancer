/**
 * Card THEMES and their KEYWORD FAMILIES — the Profane Canon (2026-08-08).
 *
 * A theme is an ARCHETYPE PACKAGE inside one evolving campaign deck (the
 * MTG-draft-archetype sense), not a standalone preset: the player starts with
 * the neutral Threadbare Office and drafts toward archetypes through
 * encounter rewards. Each theme is a family of keywords: its hallmark verbs
 * plus the shared utility keywords its cards lean on. Keywords deliberately
 * recur across themes — DOOM, MARK, MILL are connective tissue — so a theme
 * reads as "the keywords that play well together here", not an exclusive
 * bucket. Every library card declares one; `'curse'` is the enemy-injected
 * junk class (deck contamination), with PURGE as its only way out.
 */

/** The six archetype packages + the enemy-injected curse class. */
export type CardTheme =
    | 'rot'      // — the Blight: plant DoTs, PROLONG/FESTER, RUPTURE, SIPHON
    | 'debt'     // — the Reckoning: RECOIL blood prices, FALLEN, DOOM interest
    | 'grave'    // — the Exhumation: MILL, RECALL/REPLAY, REQUIEM, IMMOLATE
    | 'vigil'    // — the Cold Watch: GUARD/THORNS/RIPOSTE, bloodless-night payoffs
    | 'trial'    // — the Indictment: CHARGE→CONDEMN, STAGGER, BACKFIRE, MARK
    | 'choir'    // — the Pale Choir: PLEA→RELENT, QUARTER, SOUL/REAP
    | 'curse'    // — enemy-injected junk; PURGE or IMMOLATE it away
    | 'grey';    // — Phase 104: the two starter shapes every new run opens with;
                 //   no archetype, never a reward, never counted in a deck's theme tally

/** Stable display/registry order. */
export const CARD_THEMES: readonly CardTheme[] = Object.freeze([
    'rot', 'debt', 'grave', 'vigil', 'trial', 'choir', 'curse', 'grey',
]);

/**
 * Each theme's keyword FAMILY: hallmark verbs first, then the utility
 * keywords its cards genuinely synergise with. Keywords appear in more than
 * one family on purpose. These are the searchable keywords the catalog
 * exposes per theme.
 */
export const THEME_KEYWORDS: Record<CardTheme, readonly string[]> = Object.freeze({
    rot:   ['POISON', 'BLEED', 'DOOM', 'MARK', 'RUPTURE', 'SIPHON', 'PROLONG', 'FESTER'],
    debt:  ['RECOIL', 'FALLEN', 'DOOM', 'IMMOLATE', 'BLEED', 'DRAW', 'HEAL'],
    grave: ['MILL', 'RECALL', 'REPLAY', 'REQUIEM', 'IMMOLATE', 'ECHO', 'DOOM', 'FORETELL'],
    vigil: ['GUARD', 'THORNS', 'RIPOSTE', 'BLEED', 'DOOM', 'FORETELL'],
    // CONDEMN / SENTENCE are deliberately ABSENT: both were demoted from the
    // keyword registry (phase 29) and live in the systems glossary instead, so
    // a theme family may not claim them (mobile KW-6 parity law).
    trial: ['CHARGE', 'STAGGER', 'BACKFIRE', 'MARK', 'DOOM'],
    choir: ['PLEA', 'QUARTER', 'SOUL', 'REAP', 'DOOM', 'HEAL', 'CLEANSE', 'KINDLE'],
    curse: ['PURGE'],
    // Phase 104 — the grey office has NO family: a new deck leans nowhere
    // until its first rewards are taken.
    grey: [],
});

/** The keyword family for a theme (empty for an unknown key). */
export function keywordsForTheme(theme: CardTheme): readonly string[] {
    return THEME_KEYWORDS[theme] ?? [];
}

/** True when the string is a known card theme. */
export function isCardTheme(v: string): v is CardTheme {
    return (CARD_THEMES as readonly string[]).includes(v);
}
