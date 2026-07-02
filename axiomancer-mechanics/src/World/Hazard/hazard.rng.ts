/**
 * Deterministic RNG for the Hazard minigame engine (mulberry32).
 *
 * The engine threads explicit RNG state through every transition so a
 * session is fully reproducible from its seed — hermetic Jest suites
 * and the Playwright playthrough both pin seeds instead of stubbing
 * Math.random. The engine NEVER calls Math.random directly.
 */

import { seedInputToUint32, type SeedInput } from '../seed';

export interface HazardRngState {
    /** mulberry32 internal state word (uint32). */
    s: number;
}

export function seedRng(seed: SeedInput): HazardRngState {
    // Mix the seed so small integers (1, 2, 3…) diverge immediately.
    let s = seedInputToUint32(seed);
    s = (s + 0x9e3779b9) >>> 0;
    return { s };
}

/** Returns a float in [0, 1) plus the advanced state. Pure. */
export function nextFloat(state: HazardRngState): { value: number; state: HazardRngState } {
    let t = (state.s + 0x6d2b79f5) >>> 0;
    const nextState = { s: t };
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return { value, state: nextState };
}

/** Returns an int in [0, n) plus the advanced state. Pure. */
export function nextInt(state: HazardRngState, n: number): { value: number; state: HazardRngState } {
    const { value, state: next } = nextFloat(state);
    return { value: Math.floor(value * n), state: next };
}

/** Fisher–Yates shuffle returning a new array plus the advanced state. Pure. */
export function shuffle<T>(state: HazardRngState, items: readonly T[]): { value: T[]; state: HazardRngState } {
    const out = items.slice();
    let s = state;
    for (let i = out.length - 1; i > 0; i--) {
        const draw = nextInt(s, i + 1);
        s = draw.state;
        const j = draw.value;
        [out[i], out[j]] = [out[j], out[i]];
    }
    return { value: out, state: s };
}
