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
// Crosshair, not plain rings — MARK is the most common free effect and must
// never read as a generic fallback (owner feedback 2026-07-16).
const CROSSHAIR: GlyphShape = { d: 'M12 3.5 A8.5 8.5 0 1 0 12 20.5 A8.5 8.5 0 1 0 12 3.5 Z M12 6 A6 6 0 1 0 12 18 A6 6 0 1 0 12 6 Z M12 9.25 A2.75 2.75 0 1 0 12 14.75 A2.75 2.75 0 1 0 12 9.25 Z M11 0.5 H13 V3 H11 Z M11 21 H13 V23.5 H11 Z M0.5 11 H3 V13 H0.5 Z M21 11 H23.5 V13 H21 Z', evenodd: true };
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
const MASK: GlyphShape = { d: 'M2 8 C5 6.5 9 6.5 12 8 C15 6.5 19 6.5 22 8 C22 13 19 16.5 15.5 16.5 C13.8 16.5 12.8 15.4 12 14.2 C11.2 15.4 10.2 16.5 8.5 16.5 C5 16.5 2 13 2 8 Z M6.2 10 A1.8 1.8 0 1 0 6.2 13.6 A1.8 1.8 0 1 0 6.2 10 Z M17.8 10 A1.8 1.8 0 1 0 17.8 13.6 A1.8 1.8 0 1 0 17.8 10 Z', evenodd: true };
const DROPLET: GlyphShape = { d: 'M12 2 C17 9 19 12 19 15.5 A7 7 0 0 1 5 15.5 C5 12 7 9 12 2 Z' };
const RETURN_ARROW: GlyphShape = { d: 'M14 3 A7 7 0 0 1 14 17 H11 V21 L4 15 L11 9 V13 H14 A3 3 0 0 0 14 7 H8 V3 Z' };
const CYCLE_ARROW: GlyphShape = { d: 'M12 3 A9 9 0 1 0 21 12 H18.5 A6.5 6.5 0 1 1 12 5.5 L12 9 L18 4.5 L12 0 Z' };
const STAGGERED_BARS: GlyphShape = { d: 'M4 4 H16 V7 H4 Z M8 10.5 H20 V13.5 H8 Z M4 17 H16 V20 H4 Z' };
const CRYSTAL: GlyphShape = { d: 'M12 2 L21 12 L12 22 L3 12 Z M12 7 L16.5 12 L12 17 L7.5 12 Z', evenodd: true };
const STONE: GlyphShape = { d: 'M8 2.5 H16 L21.5 9 L18.5 21.5 H5.5 L2.5 9 Z M12.2 4 L13.6 8 L10.8 12.2 L13.2 16.4 L11.4 20 L10.2 20 L11.8 16.5 L9.4 12.2 L12.2 8 L11 4 Z', evenodd: true };
const CHEVRONS_RIGHT: GlyphShape = { d: 'M5 3 L14 12 L5 21 L2.8 18.8 L9.6 12 L2.8 5.2 Z M12 3 L21 12 L12 21 L9.8 18.8 L16.6 12 L9.8 5.2 Z' };

/** UPPERCASE face keyword → silhouette. Aliases share one shape on purpose
 *  (GUARD/BARRIER are one mechanic family; HEAL/REGEN both read as the heart). */
export const GLYPH_SHAPES: Record<string, GlyphShape> = {
    // ── afflictions ──
    BLEED: DROPS,
    POISON: FLASK, FESTER: FLASK, ACID: FLASK,
    BURN: FLAME, DOT: FLAME,
    FROSTBITE: CRYSTAL,
    DOOM: SKULL, CURSE: SKULL,
    SHOCK: BOLT,
    PETRIFY: STONE,
    GRACE_MOMENTUM: CHEVRONS_RIGHT,
    MARK: CROSSHAIR,
    BACKFIRE: RETURN_ARROW,
    RAPPORT: SPEECH,
    STUN: BURST, RUPTURE: BURST, THORNS: BURST,
    // ── currencies / verbs ──
    GUARD: SHIELD, BARRIER: SHIELD,
    HEAL: HEART, REGEN: HEART,
    DRAW: CARD_SHEET,
    TICK: HOURGLASS, DURATION: HOURGLASS, PROLONG: HOURGLASS,
    CLEANSE: DROPLET,
    SOUL: SPARKLE,
    FORETELL: EYE, OMEN: EYE,
    REVEAL: MASK,
    PIP: HEXAGON,
    RECOIL: DOWN_ARROW,
    STAGGER: STAGGERED_BARS,
    REFRESH: CYCLE_ARROW,
    ENCHANT: DIAMONDS,
    CONVICTION: DIAMOND,
    PREMISE: BOOKMARK,
    SWAY: WAVES,
    INTENSITY: CHEVRONS_UP,
    MILL: SPILL_CARDS,
};

/** The silhouette for a face keyword, or null → keep the text-rune fallback. */
export function glyphShapeFor(key: string | null | undefined): GlyphShape | null {
    if (!key) return null;
    return GLYPH_SHAPES[key.toUpperCase()] ?? null;
}
