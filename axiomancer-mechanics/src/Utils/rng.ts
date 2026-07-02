/**
 * Seedable RNG abstraction. Replaces Math.random() throughout the codebase.
 * Uses a simple Linear Congruential Generator (LCG) for deterministic output.
 */

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
        this.seed = this.normalizeSeed(seed);
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

// Module-level singleton
let globalRng: Rng = new SimpleRng();

/** Set global RNG instance (for seeding or testing) */
export function setRng(rng: Rng): void {
    globalRng = rng;
}

/** Get global RNG instance */
export function getRng(): Rng {
    return globalRng;
}

/** Convenience: seed the global RNG with a string or number */
export function setSeed(seed: string | number): void {
    const numericSeed = typeof seed === 'string' ? hashString(seed) : seed;
    globalRng = new SimpleRng(numericSeed);
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