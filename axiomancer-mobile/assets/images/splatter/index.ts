/**
 * Ink splatter plates — Phase V7 (the Woodcut Codex).
 *
 * Real ink-on-paper silhouettes (Rorschach test plates, public domain —
 * Hermann Rorschach died 1922) replace the procedural random-circle splatter
 * `<Splatter>` drew before. Each file is an alpha matte: paper is
 * transparent, ink is opaque black, so `<Image tintColor>` recolors the
 * shape to whichever AXM token the caller passes — the same contract the
 * procedural version's `color` prop had.
 *
 * See `provenance.json` for source, licence and the acquisition recipe.
 */

const SPLATTERS: readonly number[] = [
    require('./splatter-1.webp'),
    require('./splatter-2.webp'),
    require('./splatter-3.webp'),
    require('./splatter-4.webp'),
];

/** Deterministic pick — same seed always draws the same plate. */
export function splatterFor(seed: number): number {
    const i = ((seed % SPLATTERS.length) + SPLATTERS.length) % SPLATTERS.length;
    return SPLATTERS[i];
}
