/**
 * Shared deterministic seed helpers for mechanics minigames and harnesses.
 *
 * Engines accept a `SeedInput` at their public creation boundary, normalize it
 * once to a uint32, and then thread explicit RNG state through transitions.
 * Numeric seeds retain legacy uint32 coercion; string seeds use FNV-1a so CLI
 * labels and playtest scenario IDs are replayable without collapsing to zero.
 */
export type SeedInput = string | number;

/** Convert a public seed input into the uint32 word consumed by minigame RNGs. */
export function seedInputToUint32(seed: SeedInput): number {
    if (typeof seed === 'number') return seed >>> 0;

    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** Derive the Nth deterministic run seed from a public base seed. */
export function minigameRunSeed(seed: SeedInput, runIndex: number): number {
    return (seedInputToUint32(seed) + (runIndex >>> 0)) >>> 0;
}

/** Derive an independent deterministic stream from a normalized/base seed. */
export function branchMinigameSeed(seed: SeedInput, salt: number): number {
    return (seedInputToUint32(seed) ^ (salt >>> 0)) >>> 0;
}
