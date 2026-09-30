/**
 * Card-face FREE-glyph SILHOUETTES (owner directive 2026-07-16): the giant
 * top-left glyph must read as the SHAPE of the effect it causes — a flame for
 * BURN, droplets for BLEED — not an abstract rune.
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
const DROPS: GlyphShape = { d: 'M6 4 C4 9 4 12 6 13 C8 12 8 9 6 4Z M12 8 C10 13 10 16 12 17 C14 16 14 13 12 8Z M18 4 C16 9 16 12 18 13 C20 12 20 9 18 4Z' };
const SKULL: GlyphShape = { d: 'M12 2 C7.3 2 4 5.4 4 9.4 C4 12.3 5.7 14.5 8 15.6 L8 20 H10.2 L10.2 17.2 H11.2 L11.2 20 H12.8 L12.8 17.2 H13.8 L13.8 20 H16 L16 15.6 C18.3 14.5 20 12.3 20 9.4 C20 5.4 16.7 2 12 2 Z M8.8 8 A2 2 0 1 0 8.8 12 A2 2 0 1 0 8.8 8 Z M15.2 8 A2 2 0 1 0 15.2 12 A2 2 0 1 0 15.2 8 Z', evenodd: true };
const SHIELD: GlyphShape = { d: 'M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z' };
// VULNERABLE (S3, D43) — the shield, split by a crack: the foe's guard is open.
const CRACKED_SHIELD: GlyphShape = { d: 'M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z M12.6 4.2 L10 9.5 L13.4 11.4 L10.4 19.6 L11.6 19.8 L15.4 10.8 L12 9 L14 4.4 Z', evenodd: true };
const HEART: GlyphShape = { d: 'M12 21 C5 16 3 12 3 8 A4.6 4.6 0 0 1 12 7 A4.6 4.6 0 0 1 21 8 C21 12 19 16 12 21 Z' };
const EYE: GlyphShape = { d: 'M12 5.5 C6 5.5 2 12 2 12 C2 12 6 18.5 12 18.5 C18 18.5 22 12 22 12 C22 12 18 5.5 12 5.5 Z M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5 Z', evenodd: true };
const DIAMONDS: GlyphShape = { d: 'M12 1 L15 5.5 L12 10 L9 5.5 Z M12 14 L15 18.5 L12 23 L9 18.5 Z M5.5 7.5 L8.5 12 L5.5 16.5 L2.5 12 Z M18.5 7.5 L21.5 12 L18.5 16.5 L15.5 12 Z' };

/** UPPERCASE face keyword → silhouette. The keyword audit (2026-09-27, after
 *  the card purge) cut the table to the keys a live face can still produce;
 *  revamp R4 (D45) removed POISON, DOOM, PETRIFY and QUARTER with the
 *  signature skills that last carried them, and R5 MARK, DRAW and CLEANSE
 *  with the consumables. */
export const GLYPH_SHAPES: Record<string, GlyphShape> = {
    // ── afflictions ──
    BLEED: DROPS,
    HEX: SKULL,
    VULNERABLE: CRACKED_SHIELD,
    // ── currencies / verbs ──
    // BARRIER was retired into GUARD by the Phase 29 keyword-registry pass
    // (`state/combat/keywords.ts` — the free-glyph path never produces the
    // key 'BARRIER' anymore: `r.barrier` riders resolve straight to GUARD).
    GUARD: SHIELD,
    HEAL: HEART,
    OATH: DIAMONDS,
};

/** The silhouette for a face keyword, or null → keep the text-rune fallback. */
export function glyphShapeFor(key: string | null | undefined): GlyphShape | null {
    if (!key) return null;
    return GLYPH_SHAPES[key.toUpperCase()] ?? null;
}
