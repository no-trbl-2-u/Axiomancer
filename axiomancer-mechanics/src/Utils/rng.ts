/**
 * Seedable RNG abstraction. Replaces Math.random() throughout the codebase.
 * Uses a simple Linear Congruential Generator (LCG) for deterministic output.
 */

import { getLogger, isLoggingEnabled } from '../Log';

export interface Rng {
    /** Returns a floating-point value in [0, 1) */
    random(): number;
    /** Get current seed state for persistence */
    getState(): number;
    /** Restore seed state from persistence */
    setState(state: number): void;
}

/** Simple LCG implementation (Park and Miller constants) */
class SimpleRng implements Rng {
    private seed: number;
    
    constructor(seed: number = Date.now()) {
        // A fresh seed is scrambled before it becomes the LCG state. The raw
        // Park-Miller step from a small seed returns about seed * 2.2e-5, so
        // seeds 1..N would all open on a draw of ~0 (the first swap of every
        // seeded shuffle would land the same way). `setState` restores a saved
        // state verbatim and never scrambles, so a reload resumes the stream.
        this.seed = this.normalizeSeed(scrambleSeed(seed));
    }
    
    private normalizeSeed(seed: number): number {
        // Ensure seed is positive and within LCG range
        return Math.abs(seed % 2147483647) || 1;
    }
    
    random(): number {
        // Park and Miller LCG: (a * seed) % m
        this.seed = (this.seed * 48271) % 2147483647;
        return this.seed / 2147483647;
    }
    
    getState(): number {
        return this.seed;
    }
    
    setState(state: number): void {
        this.seed = this.normalizeSeed(state);
    }
}

/**
 * Spreads a seed across the 32-bit range (the murmur3 finalizer), so nearby
 * seeds start the LCG far apart.
 *
 * @param seed - Any number; only its low 32 bits are used.
 * @returns A non-negative integer below 2^32.
 * @example scrambleSeed(1) !== scrambleSeed(2) // and both are large
 */
export function scrambleSeed(seed: number): number {
    let h = seed >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
}

// Module-level singleton
let globalRng: Rng = new SimpleRng();

/** Set global RNG instance (for seeding or testing) */
export function setRng(rng: Rng): void {
    globalRng = rng;
    if (isLoggingEnabled()) getLogger().debug('rng', 'rng-replaced');
}

/** Get global RNG instance */
export function getRng(): Rng {
    return globalRng;
}

/** Convenience: seed the global RNG with a string or number */
export function setSeed(seed: string | number): void {
    const numericSeed = typeof seed === 'string' ? hashString(seed) : seed;
    globalRng = new SimpleRng(numericSeed);
    // The replay key: with this entry an agent can reproduce the whole
    // session deterministically. Never log inside random()/setState().
    if (isLoggingEnabled()) getLogger().info('rng', 'seed-set', { seed, numericSeed });
}

/** Simple string hash for seed conversion */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) || 1;
}