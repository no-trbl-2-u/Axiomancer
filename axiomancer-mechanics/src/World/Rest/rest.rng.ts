/**
 * Deterministic RNG for the Rest encounter engine (mulberry32).
 *
 * Sibling copy of the Hazard/Gathering/QuestBoard RNG so the
 * `World/Rest/` directory stays self-contained. The engine threads
 * explicit RNG state through every transition; it NEVER calls
 * Math.random directly.
 */

import { seedInputToUint32, type SeedInput } from '../seed';

export interface RestRngState {
    /** mulberry32 internal state word (uint32). */
    s: number;
}

export function seedRng(seed: SeedInput): RestRngState {
    let s = seedInputToUint32(seed);
    s = (s + 0x9e3779b9) >>> 0;
    return { s };
}

/** Returns a float in [0, 1) plus the advanced state. Pure. */
export function nextFloat(state: RestRngState): { value: number; state: RestRngState } {
    let t = (state.s + 0x6d2b79f5) >>> 0;
    const nextState = { s: t };
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return { value, state: nextState };
}

/** Returns an int in [0, n) plus the advanced state. Pure. */
export function nextInt(state: RestRngState, n: number): { value: number; state: RestRngState } {
    const { value, state: next } = nextFloat(state);
    return { value: Math.floor(value * n), state: next };
}

/** Rolls a d6: an int in [1, 6]. Pure. */
export function rollDie(state: RestRngState): { value: number; state: RestRngState } {
    const { value, state: next } = nextInt(state, 6);
    return { value: value + 1, state: next };
}

/** Fisher–Yates shuffle returning a new array plus the advanced state. Pure. */
export function shuffle<T>(
    state: RestRngState,
    items: readonly T[],
): { value: T[]; state: RestRngState } {
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
