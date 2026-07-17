/**
 * Card-face FREE-glyph SILHOUETTES (owner directive 2026-07-16): the giant
 * top-left glyph must read as the SHAPE of the effect it causes — a flame for
 * BURN, a flask for POISON, droplets for BLEED — not an abstract rune.
 *
 * Pure + dependency-free (like `statusGlyphs`): a keyword → SVG path table the
 * renderers draw at any size (24×24 viewBox, single filled path; `evenodd`
 * marks the paths that carve holes — target rings, the eye's pupil, the
 * skull's sockets). Keywords the table doesn't know keep their text-rune
 * fallback on the face.
 *
 * The editor (`CardFace.tsx` KwGlyph) and the DevLog catalog
 * (`scripts/build-catalog.mjs`) carry copies of these paths — the same
 * precedent as the isometric stance cube, duplicated per renderer because the
 * three live in different runtimes. Keep the three tables in sync.
 */

export interface GlyphShape {
    d: string;
    /** fillRule — 'evenodd' for shapes that carve holes out of themselves. */
    evenodd?: boolean;
}

// ── The silhouettes (24×24) ──────────────────────────────────────────────────
const FLAME: GlyphShape = { d: 'M12 2 C14 6 18 8 18 13 C18 17 15 21 12 21 C9 21 6 18 6 14 C6 11 8 10 9 8 C10 11 11 10 12 8 C12 6 11 4 12 2Z' };
const DROPS: GlyphShape = { d: 'M6 4 C4 9 4 12 6 13 C8 12 8 9 6 4Z M12 8 C10 13 10 16 12 17 C14 16 14 13 12 8Z M18 4 C16 9 16 12 18 13 C20 12 20 9 18 4Z' };
const FLASK: GlyphShape = { d: 'M9 2 H15 V4 H14 V8 L18.5 17.5 C19.6 19.9 17.6 22 12 22 C6.4 22 4.4 19.9 5.5 17.5 L10 8 V4 H9 Z' };
const SKULL: GlyphShape = { d: 'M12 2 C7.3 2 4 5.4 4 9.4 C4 12.3 5.7 14.5 8 15.6 L8 20 H10.2 L10.2 17.2 H11.2 L11.2 20 H12.8 L12.8 17.2 H13.8 L13.8 20 H16 L16 15.6 C18.3 14.5 20 12.3 20 9.4 C20 5.4 16.7 2 12 2 Z M8.8 8 A2 2 0 1 0 8.8 12 A2 2 0 1 0 8.8 8 Z M15.2 8 A2 2 0 1 0 15.2 12 A2 2 0 1 0 15.2 8 Z', evenodd: true };
const BOLT: GlyphShape = { d: 'M13 2 L5 13 H10 L8 22 L19 9 H13 L15 2 Z' };
const TARGET: GlyphShape = { d: 'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M12 5 A7 7 0 1 0 12 19 A7 7 0 1 0 12 5 Z M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5 Z', evenodd: true };
const SHIELD: GlyphShape = { d: 'M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z' };
const HEART: GlyphShape = { d: 'M12 21 C5 16 3 12 3 8 A4.6 4.6 0 0 1 12 7 A4.6 4.6 0 0 1 21 8 C21 12 19 16 12 21 Z' };
const CARD_SHEET: GlyphShape = { d: 'M7 2 H17 A1.5 1.5 0 0 1 18.5 3.5 V20.5 A1.5 1.5 0 0 1 17 22 H7 A1.5 1.5 0 0 1 5.5 20.5 V3.5 A1.5 1.5 0 0 1 7 2 Z M8 4.5 H16 V11 H8 Z', evenodd: true };
const HOURGLASS: GlyphShape = { d: 'M6 2 H18 V6 L13.5 12 L18 18 V22 H6 V18 L10.5 12 L6 6 Z' };
const SPARKLE: GlyphShape = { d: 'M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z' };
const EYE: GlyphShape = { d: 'M12 5.5 C6 5.5 2 12 2 12 C2 12 6 18.5 12 18.5 C18 18.5 22 12 22 12 C22 12 18 5.5 12 5.5 Z M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5 Z', evenodd: true };
const HEXAGON: GlyphShape = { d: 'M12 2 L21 7 V17 L12 22 L3 17 V7 Z' };
const DOWN_ARROW: GlyphShape = { d: 'M8 3 H16 V12 H21 L12 22 L3 12 H8 Z' };
const BURST: GlyphShape = { d: 'M12 1 L14 8 L21 7 L15 12 L21 17 L14 16 L12 23 L10 16 L3 17 L9 12 L3 7 L10 8 Z' };
const DIAMONDS: GlyphShape = { d: 'M12 1 L15 5.5 L12 10 L9 5.5 Z M12 14 L15 18.5 L12 23 L9 18.5 Z M5.5 7.5 L8.5 12 L5.5 16.5 L2.5 12 Z M18.5 7.5 L21.5 12 L18.5 16.5 L15.5 12 Z' };
const DIAMOND: GlyphShape = { d: 'M12 2 L22 12 L12 22 L2 12 Z' };
const BOOKMARK: GlyphShape = { d: 'M7 2 H17 V22 L12 17.5 L7 22 Z' };
const WAVES: GlyphShape = { d: 'M2 9 C4.8 5.8 8 5.8 11 8.8 C13.7 11.5 16.3 11.5 19 8.8 L22 10.3 C18.4 14.2 14.3 14.3 11 11 C8.4 8.4 6 8.6 3.6 11.3 Z M2 15 C4.8 11.8 8 11.8 11 14.8 C13.7 17.5 16.3 17.5 19 14.8 L22 16.3 C18.4 20.2 14.3 20.3 11 17 C8.4 14.4 6 14.6 3.6 17.3 Z' };
const CHEVRONS_UP: GlyphShape = { d: 'M12 3 L20 10 L17.2 12.2 L12 7.6 L6.8 12.2 L4 10 Z M12 11 L20 18 L17.2 20.2 L12 15.6 L6.8 20.2 L4 18 Z' };
const SPILL_CARDS: GlyphShape = { d: 'M3 6 L11 3 L14 12 L6 15 Z M10 9 H21 V21 H10 Z' };
const SPEECH: GlyphShape = { d: 'M3 4 H21 V16 H12 L7 21 V16 H3 Z' };

/** UPPERCASE face keyword → silhouette. Aliases share one shape on purpose
 *  (GUARD/BARRIER are one mechanic family; HEAL/REGEN both read as the heart). */
export const GLYPH_SHAPES: Record<string, GlyphShape> = {
    // ── afflictions ──
    BLEED: DROPS,
    POISON: FLASK, FESTER: FLASK, ACID: FLASK,
    BURN: FLAME, DOT: FLAME,
    DOOM: SKULL, CURSE: SKULL,
    SHOCK: BOLT,
    MARK: TARGET,
    STUN: BURST, RUPTURE: BURST, THORNS: BURST,
    // ── currencies / verbs ──
    GUARD: SHIELD, BARRIER: SHIELD,
    HEAL: HEART, REGEN: HEART,
    DRAW: CARD_SHEET,
    TICK: HOURGLASS, DURATION: HOURGLASS, PROLONG: HOURGLASS,
    CLEANSE: SPARKLE, SOUL: SPARKLE,
    FORETELL: EYE, OMEN: EYE, REVEAL: EYE,
    PIP: HEXAGON,
    RECOIL: DOWN_ARROW,
    ENCHANT: DIAMONDS,
    CONVICTION: DIAMOND,
    PREMISE: BOOKMARK,
    SWAY: WAVES,
    INTENSITY: CHEVRONS_UP,
    MILL: SPILL_CARDS,
    RAPPORT: SPEECH,
};

/** The silhouette for a face keyword, or null → keep the text-rune fallback. */
export function glyphShapeFor(key: string | null | undefined): GlyphShape | null {
    if (!key) return null;
    return GLYPH_SHAPES[key.toUpperCase()] ?? null;
}
