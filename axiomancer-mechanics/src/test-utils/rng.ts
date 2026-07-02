/**
 * RNG stubs for hermetic tests.
 *
 * Each helper does two things:
 *   1. Replaces the production singleton (`getRng()` / `setRng()`) with a tiny
 *      Rng whose `random()` delegates to `Math.random()`. Phase 11 routed all
 *      gameplay rolls through `getRng()`, so without this step a `Math.random`
 *      spy alone has no effect on the resist pipeline, dice helpers, or any
 *      `getRng().random()` callsite.
 *   2. Spies on `Math.random` with the requested canned sequence.
 *
 * Always pair the helper with `afterEach(() => vi.restoreAllMocks())`.
 * `restoreAllMocks` clears the spy; the substituted singleton remains, but
 * since it delegates to (the now-restored) `Math.random`, every test that
 * re-calls a helper at the top of its body gets a fresh deterministic state.
 *
 * Excluded from the published build via `tsconfig.json` `exclude`.
 */

import { vi, type MockInstance } from 'vitest';
import { setRng, getRng, type Rng } from '../Utils/rng';

class MathBackedRng implements Rng {
    private state = 0;
    random(): number { return Math.random(); }
    getState(): number { return this.state; }
    setState(state: number): void { this.state = state; }
}

// Store the original RNG instance to restore after each test
let originalRng: Rng | null = null;

function installMathBackedRng(): void {
    // Save the original RNG instance if this is the first call
    if (originalRng === null) {
        originalRng = getRng();
    }
    setRng(new MathBackedRng());
}

/**
 * Restore the original RNG instance. This should be called in afterEach 
 * alongside vi.restoreAllMocks() to ensure proper test isolation.
 */
export function restoreOriginalRng(): void {
    if (originalRng !== null) {
        setRng(originalRng);
        originalRng = null;
    }
}

/**
 * Returns 0.9 / 0.1 alternating on each `Math.random()` call.
 *
 * Useful for deterministic 2d20 rolls:
 *   - With `randomInt(1, 20)`, successive calls yield 19 then 3.
 *   - For "advantage" (keep max): 19. For "disadvantage" (keep min): 3.
 *
 * This is the convention used in `src/Combat/e2e/combat.engine.test.ts`.
 */
export function mockAlternatingRng(): MockInstance<() => number> {
    installMathBackedRng();
    let n = 0;
    return vi.spyOn(Math, 'random').mockImplementation(() => {
        n++;
        return n % 2 === 1 ? 0.9 : 0.1;
    });
}

/**
 * Returns the supplied values in order on each `Math.random()` call. Once the
 * sequence is exhausted, throws — so tests fail loudly rather than silently
 * falling back to real randomness.
 */
export function mockFixedRng(values: readonly number[]): MockInstance<() => number> {
    installMathBackedRng();
    let i = 0;
    return vi.spyOn(Math, 'random').mockImplementation(() => {
        if (i >= values.length) {
            throw new Error(
                `mockFixedRng exhausted after ${values.length} call(s); ` +
                'extend the sequence or switch helpers.',
            );
        }
        return values[i++]!;
    });
}

/**
 * Returns the same value on every `Math.random()` call. Use sparingly — most
 * tests should encode the dependency on individual rolls explicitly via
 * `mockFixedRng`.
 */
export function mockSequentialRng(value: number): MockInstance<() => number> {
    installMathBackedRng();
    return vi.spyOn(Math, 'random').mockReturnValue(value);
}
