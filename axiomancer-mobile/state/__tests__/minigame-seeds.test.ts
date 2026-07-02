/**
 * Hermetic test pin — `state/minigame-seeds.ts`, the shared
 * deterministic seed/string resolver imported by all five minigame
 * Begin actions (`state/{hazard,gathering,rest,cache,quest}/store-actions.ts`).
 *
 * A silent precedence/guard regression here breaks playtest and smoke
 * reproducibility across every minigame at once, so the pin asserts the
 * resolver's contract directly rather than through any one consumer:
 *
 *   - resolveMinigameSeed: explicit > unified global > legacy > fallback,
 *     with the finiteNumber guard rejecting NaN/Infinity/non-numbers at
 *     each tier, and the fallback in both number and thunk form.
 *   - resolveMinigameString: explicit > unified-entry name-scan (in order)
 *     > legacy > fallback, with the nonEmptyString guard.
 *   - fallbackMinigameSeed: a finite uint32.
 *
 * The unified global `globalThis.__AXM_MINIGAME_SEEDS__` is mutated and
 * fully restored around every case so no test leaks state.
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
    fallbackMinigameSeed,
    resolveMinigameSeed,
    resolveMinigameString,
    type MinigameSeedConfig,
} from '@/state/minigame-seeds';

const setUnified = (config: MinigameSeedConfig | undefined) => {
    globalThis.__AXM_MINIGAME_SEEDS__ = config;
};

beforeEach(() => {
    setUnified(undefined);
});

afterEach(() => {
    setUnified(undefined);
});

describe('resolveMinigameSeed', () => {
    it('returns the explicit seed when one is provided (highest precedence)', () => {
        setUnified({ hazard: { seed: 222 } });
        expect(resolveMinigameSeed('hazard', 111, 333, 444)).toBe(111);
    });

    it('falls through to the unified global when no explicit seed is given', () => {
        setUnified({ gathering: { seed: 777 } });
        expect(resolveMinigameSeed('gathering', undefined, 333, 444)).toBe(777);
    });

    it('reads the unified entry keyed by the requested minigame', () => {
        setUnified({ hazard: { seed: 10 }, quest: { seed: 20 } });
        expect(resolveMinigameSeed('quest', undefined, undefined, 444)).toBe(20);
    });

    it('falls through to the legacy seed when no explicit/unified seed exists', () => {
        setUnified({ rest: {} });
        expect(resolveMinigameSeed('rest', undefined, 333, 444)).toBe(333);
    });

    it('falls through to the numeric fallback when nothing else is finite', () => {
        expect(resolveMinigameSeed('cache', undefined, undefined, 444)).toBe(444);
    });

    it('invokes the fallback thunk form only when reached, returning its value', () => {
        let calls = 0;
        const thunk = () => {
            calls += 1;
            return 999;
        };
        expect(resolveMinigameSeed('cache', undefined, undefined, thunk)).toBe(999);
        expect(calls).toBe(1);
    });

    it('does not invoke the fallback thunk when an earlier tier wins', () => {
        let calls = 0;
        const thunk = () => {
            calls += 1;
            return 999;
        };
        expect(resolveMinigameSeed('cache', 5, undefined, thunk)).toBe(5);
        expect(calls).toBe(0);
    });

    it('uses the real fallback resolver (uint32) when no fallback arg is passed', () => {
        const seed = resolveMinigameSeed('hazard', undefined, undefined);
        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThanOrEqual(0xffffffff);
    });

    describe('finiteNumber guard', () => {
        it('skips a NaN explicit seed and falls through to the unified global', () => {
            setUnified({ hazard: { seed: 777 } });
            expect(resolveMinigameSeed('hazard', Number.NaN, 333, 444)).toBe(777);
        });

        it('skips an Infinity unified seed and falls through to the legacy seed', () => {
            setUnified({ hazard: { seed: Number.POSITIVE_INFINITY } });
            expect(resolveMinigameSeed('hazard', undefined, 333, 444)).toBe(333);
        });

        it('skips a NaN legacy seed and falls through to the fallback', () => {
            expect(resolveMinigameSeed('hazard', undefined, Number.NaN, 444)).toBe(444);
        });

        it('treats 0 as a valid finite seed (not falsy-skipped)', () => {
            expect(resolveMinigameSeed('hazard', 0, 333, 444)).toBe(0);
        });

        it('treats a negative finite seed as valid', () => {
            expect(resolveMinigameSeed('hazard', -7, 333, 444)).toBe(-7);
        });
    });
});

describe('resolveMinigameString', () => {
    it('returns the explicit value when one is provided (highest precedence)', () => {
        setUnified({ hazard: { hazardId: 'unified' } });
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], 'explicit', 'legacy', 'fallback'),
        ).toBe('explicit');
    });

    it('scans the unified entry name keys in order, returning the first non-empty', () => {
        setUnified({ hazard: { id: 'from-id' } });
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], undefined, 'legacy', 'fallback'),
        ).toBe('from-id');
    });

    it('prefers the earlier name key when multiple are present', () => {
        setUnified({ hazard: { hazardId: 'first', id: 'second' } });
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], undefined, 'legacy', 'fallback'),
        ).toBe('first');
    });

    it('skips an empty-string unified key and continues the name scan', () => {
        setUnified({ hazard: { hazardId: '', id: 'second' } });
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], undefined, 'legacy', 'fallback'),
        ).toBe('second');
    });

    it('falls through to the legacy value when no explicit/unified match', () => {
        setUnified({ hazard: {} });
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], undefined, 'legacy', 'fallback'),
        ).toBe('legacy');
    });

    it('skips an empty-string legacy value and falls through to the fallback', () => {
        expect(
            resolveMinigameString('hazard', ['hazardId', 'id'], undefined, '', 'fallback'),
        ).toBe('fallback');
    });

    it('falls through to the fallback when nothing else matches', () => {
        expect(
            resolveMinigameString('gathering', ['siteId', 'site'], undefined, undefined, 'fallback'),
        ).toBe('fallback');
    });

    it('returns undefined when no fallback is supplied and nothing matches', () => {
        expect(
            resolveMinigameString('quest', ['boardId', 'board'], undefined, undefined),
        ).toBeUndefined();
    });

    it('reads the unified entry keyed by the requested minigame, not another', () => {
        setUnified({ gathering: { siteId: 'gather-site' }, quest: { boardId: 'quest-board' } });
        expect(
            resolveMinigameString('quest', ['boardId', 'board'], undefined, undefined, 'fallback'),
        ).toBe('quest-board');
    });
});

describe('fallbackMinigameSeed', () => {
    it('returns a finite uint32', () => {
        const seed = fallbackMinigameSeed();
        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThanOrEqual(0xffffffff);
    });
});
