const FLAVOR_VARIANTS = [
    'the body that survives is not the body that arrived.',
    'something in the marrow learned its own name.',
    'the page turned itself.',
] as const;

export function pickFlavor(toLevel: number): string {
    // Deterministic pick — the same level transition always shows
    // the same line. Keeps tests stable + the flavour reads as a
    // chronicle entry, not RNG noise.
    return FLAVOR_VARIANTS[toLevel % FLAVOR_VARIANTS.length];
}