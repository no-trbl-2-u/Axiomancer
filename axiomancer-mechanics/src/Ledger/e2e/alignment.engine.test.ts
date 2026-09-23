/**
 * Hermetic e2e test for the philosophical-alignment engine (Phase 42, Unit 1).
 *
 * Pins the bucket boundary table, the clamp + partial-shift behaviour of
 * `applyAlignmentDelta`, the cell-lookup invariant, the
 * `SHIFT_PHILOSOPHICAL_ALIGNMENT` action through `gameReducer`, the
 * save/load JSON round-trip, and the v4 → v5 migrator. Library
 * exhaustiveness (27 cells) and the Unit 2 PDF spot-checks are pinned below.
 */

import { describe, it, expect } from 'vitest';
import {
    bucketAxis,
    applyAlignmentDelta,
    getAlignmentCell,
    defaultAlignment,
    AXIS_HIGH_THRESHOLD,
    AXIS_LOW_THRESHOLD,
} from '../alignment.engine';
import type { PhilosophicalAlignment, AxisBucket } from '../types';
import { philosophicalAlignmentLibrary } from '../alignment.library';
import { createNewGameState, gameReducer, GAME_STATE_VERSION } from '../../Game/game.reducer';
import { createGameStore } from '../../Game/store';
import { nullAdapter } from '../../Game/persistence/null.adapter';

describe('Philosophy — bucketAxis boundary table', () => {
    it('buckets the canonical boundary values correctly', () => {
        expect(bucketAxis(-100)).toBe('low');
        expect(bucketAxis(AXIS_LOW_THRESHOLD)).toBe('low'); // -34 → low
        expect(bucketAxis(-33)).toBe('mid');
        expect(bucketAxis(0)).toBe('mid');
        expect(bucketAxis(33)).toBe('mid');
        expect(bucketAxis(AXIS_HIGH_THRESHOLD)).toBe('high'); // 34 → high
        expect(bucketAxis(100)).toBe('high');
    });
});

describe('Philosophy — applyAlignmentDelta', () => {
    it('shifts the named axis only; missing axes pass through unchanged', () => {
        const current: PhilosophicalAlignment = { epistemology: 10, outlook: 20, scope: 30 };
        const next = applyAlignmentDelta(current, { outlook: 5 });
        expect(next).toEqual({ epistemology: 10, outlook: 25, scope: 30 });
    });

    it('clamps positive overflow to +100', () => {
        const current: PhilosophicalAlignment = { epistemology: 90, outlook: 0, scope: 0 };
        const next = applyAlignmentDelta(current, { epistemology: 50 });
        expect(next.epistemology).toBe(100);
    });

    it('clamps negative overflow to -100', () => {
        const current: PhilosophicalAlignment = { epistemology: -90, outlook: 0, scope: 0 };
        const next = applyAlignmentDelta(current, { epistemology: -50 });
        expect(next.epistemology).toBe(-100);
    });

    it('does not mutate the input alignment', () => {
        const current: PhilosophicalAlignment = { epistemology: 10, outlook: 20, scope: 30 };
        applyAlignmentDelta(current, { epistemology: 5, outlook: 5, scope: 5 });
        expect(current).toEqual({ epistemology: 10, outlook: 20, scope: 30 });
    });
});

describe('Philosophy — getAlignmentCell', () => {
    it('returns the high-high-low cell (Logic-Optimistic-Individual)', () => {
        const cell = getAlignmentCell({ epistemology: 80, outlook: 80, scope: -80 });
        expect(cell.id).toBe('logic-optimistic-individual');
        expect(cell.epistemology).toBe('high');
        expect(cell.outlook).toBe('high');
        expect(cell.scope).toBe('low');
        expect(cell.damnedExemplar).toContain('Bellringer of Thumbprick Hill');
    });

    it('returns the mid-mid-mid cell (Agnostic-Neutral-Relational)', () => {
        // With the full library in place, every triple — including the
        // dead-centre neutral — resolves cleanly.
        const cell = getAlignmentCell({ epistemology: 0, outlook: 0, scope: 0 });
        expect(cell.id).toBe('mid-mid-relational');
        expect(cell.damnedExemplar).toContain('Almoner of Fenmark');
    });
});

describe('Philosophy — SHIFT_PHILOSOPHICAL_ALIGNMENT through gameReducer', () => {
    it('default GameState carries neutral alignment', () => {
        const state = createNewGameState();
        expect(state.philosophicalAlignment).toEqual({ epistemology: 0, outlook: 0, scope: 0 });
        expect(state.version).toBe(GAME_STATE_VERSION);
    });

    it('reducer applies the partial delta + clamps', () => {
        const state = createNewGameState();
        const next = gameReducer(state, {
            type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT',
            payload: { delta: { epistemology: 50, scope: -120 } },
        });
        expect(next.philosophicalAlignment.epistemology).toBe(50);
        expect(next.philosophicalAlignment.outlook).toBe(0);     // not shifted
        expect(next.philosophicalAlignment.scope).toBe(-100);    // clamped
    });

    it('store action dispatches through to the reducer', () => {
        const store = createGameStore(nullAdapter);
        store.getState().shiftPhilosophicalAlignment({ outlook: 40 });
        expect(store.getState().philosophicalAlignment.outlook).toBe(40);
    });
});

describe('Philosophy — save/load round-trip', () => {
    it('JSON round-trip preserves the alignment field', () => {
        const state = createNewGameState();
        const shifted = gameReducer(state, {
            type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT',
            payload: { delta: { epistemology: 60, outlook: -40, scope: 20 } },
        });
        const json = JSON.stringify(shifted);
        const restored = JSON.parse(json);
        expect(restored.philosophicalAlignment).toEqual({
            epistemology: 60, outlook: -40, scope: 20,
        });
    });
});

describe('Philosophy — library exhaustiveness', () => {
    it('contains exactly 27 entries', () => {
        expect(philosophicalAlignmentLibrary.length).toBe(27);
    });

    it('has 27 unique ids — no duplicate cells', () => {
        const ids = new Set(philosophicalAlignmentLibrary.map(c => c.id));
        expect(ids.size).toBe(27);
    });

    it('covers every (low|mid|high)^3 triple — no holes', () => {
        const buckets: AxisBucket[] = ['low', 'mid', 'high'];
        for (const e of buckets) {
            for (const o of buckets) {
                for (const s of buckets) {
                    // Pick a representative integer for each bucket.
                    const v = (b: AxisBucket): number => (b === 'low' ? -80 : b === 'high' ? 80 : 0);
                    const cell = getAlignmentCell({
                        epistemology: v(e), outlook: v(o), scope: v(s),
                    });
                    expect(cell.epistemology).toBe(e);
                    expect(cell.outlook).toBe(o);
                    expect(cell.scope).toBe(s);
                }
            }
        }
    });

    it('every cell carries exactly 3 besetting sins, each with name/example/rationale', () => {
        for (const cell of philosophicalAlignmentLibrary) {
            expect(cell.besettingSins.length).toBe(3);
            for (const sin of cell.besettingSins) {
                expect(sin.name.length).toBeGreaterThan(0);
                expect(sin.example.length).toBeGreaterThan(0);
                expect(sin.rationale.length).toBeGreaterThan(0);
            }
        }
    });
});

describe('Philosophy — content spot-check (cells 1 / 12 / 27)', () => {
    it('cell 1 — Logic-Optimistic-Individual carries its Phase 44h content', () => {
        const cell = getAlignmentCell({ epistemology: 80, outlook: 80, scope: -80 });
        expect(cell.damnedExemplar).toContain('Bellringer of Thumbprick Hill');
        expect(cell.cautionaryTale.name).toBe('the Boy Who Would Not Kneel');
        expect(cell.cautionaryTale.toldIn.length).toBeGreaterThan(0);
        expect(cell.besettingSins[0].name).toBe('Comfort Taken as Proof');
    });

    it('cell 12 — Agnostic-Optimistic-Transcendent carries its Phase 44h content', () => {
        const cell = getAlignmentCell({ epistemology: 0, outlook: 80, scope: 80 });
        expect(cell.damnedExemplar).toContain('Confessor of Sable Reach');
        expect(cell.cautionaryTale.name).toBe('the Widow Who Chose to Believe');
        expect(cell.besettingSins[0].name).toBe('Faith for the Warmth');
    });

    it('cell 27 — Faith-Pessimistic-Transcendent carries its Phase 44h content', () => {
        const cell = getAlignmentCell({ epistemology: -80, outlook: -80, scope: 80 });
        expect(cell.damnedExemplar).toContain('Anchorite of the Salt Crypt');
        expect(cell.cautionaryTale.name).toBe('The Assessor Who Judged the Almoner');
        expect(cell.besettingSins[0].name).toBe('The Truer Maker');
    });
});

describe('Philosophy — defaultAlignment', () => {
    it('returns a fresh neutral alignment on each call', () => {
        const a = defaultAlignment();
        const b = defaultAlignment();
        expect(a).toEqual({ epistemology: 0, outlook: 0, scope: 0 });
        expect(a).not.toBe(b); // distinct references — mutating one must not affect the other
    });
});
