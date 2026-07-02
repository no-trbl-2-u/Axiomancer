// Engine Spec 11 (axiomancer-mechanics 0.5.0+) routes randomness through a
// singleton `getRng()`/`setRng()` instead of `Math.random`. Each helper
// installs a deterministic `Rng` on the engine *and* keeps the legacy
// `Math.random` spy so the few engine paths that still default to
// `Math.random` (item.factory, encounter pickers, loot tables) stay
// pinned too.

import { setRng, type Rng } from 'axiomancer-mechanics';

/** Build an `Rng` that yields `next()` for every `random()` call. */
function rngFromSequence(next: () => number): Rng {
    let state = 1;
    return {
        random: next,
        getState: () => state,
        setState: (s: number) => {
            state = s;
        },
    };
}

/**
 * Stubs RNG to alternate between two values on successive calls.
 * Useful for exercising both branches of a coin-flip (hit / miss, etc.)
 */
export function mockAlternatingRng(low = 0.1, high = 0.9): jest.SpyInstance {
    let call = 0;
    const draw = () => (call++ % 2 === 0 ? low : high);
    setRng(rngFromSequence(draw));
    return jest.spyOn(Math, 'random').mockImplementation(draw);
}

/**
 * Stubs RNG to always return the same value.
 */
export function mockFixedRng(value: number): jest.SpyInstance {
    setRng(rngFromSequence(() => value));
    return jest.spyOn(Math, 'random').mockReturnValue(value);
}

/**
 * Stubs RNG to return values from a predetermined sequence.
 * Wraps around once the sequence is exhausted.
 */
export function mockSequentialRng(...values: number[]): jest.SpyInstance {
    let i = 0;
    const draw = () => values[i++ % values.length];
    setRng(rngFromSequence(draw));
    return jest.spyOn(Math, 'random').mockImplementation(draw);
}
