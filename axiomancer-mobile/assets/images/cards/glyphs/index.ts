/** Shared keyword glyphs selected from the supplied Potential Assets archive. */

const CARD_GLYPH_BY_KEY: Record<string, number> = {
    BLEED: require('./bleed.svg'),
    CONVICTION: require('./conviction.svg'),
    CURSE: require('./curse.svg'),
    DRAW: require('./draw.svg'),
    ENCHANT: require('./enchant.svg'),
    FORETELL: require('./foretell.svg'),
    GUARD: require('./guard.svg'),
    HEAL: require('./heal.svg'),
    MARK: require('./mark.svg'),
    MILL: require('./mill.svg'),
    PIP: require('./pip.svg'),
    PREMISE: require('./premise.svg'),
    RAPPORT: require('./rapport.svg'),
    REVEAL: require('./reveal.svg'),
    SOUL: require('./soul.svg'),
    SWAY: require('./sway.svg'),
};

export const CARD_GLYPH_FILE_BY_KEY: Readonly<Record<string, string>> = Object.freeze(
    Object.fromEntries(Object.keys(CARD_GLYPH_BY_KEY).map((key) => [key, `glyphs/${key.toLowerCase()}.svg`])),
);

export function getCardGlyphArt(keyword: string | null | undefined): number | null {
    if (!keyword) return null;
    return CARD_GLYPH_BY_KEY[keyword.trim().toUpperCase()] ?? null;
}
