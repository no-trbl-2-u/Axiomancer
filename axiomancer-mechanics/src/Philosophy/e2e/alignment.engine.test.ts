/**
 * Hermetic e2e test for the philosophical-alignment engine (Phase 42, Unit 1).
 *
 * Pins the bucket boundary table, the clamp + partial-shift behaviour of
 * `applyAlignmentDelta`, the cell-lookup invariant, the
 * `SHIFT_PHILOSOPHICAL_ALIGNMENT` action through `gameReducer`, the
 * save/load JSON round-trip, and the v4 → v5 migrator. Library
 * exhaustiveness + PDF spot-check cases land with Unit 2.
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
import { migrate } from '../../Game/game.migrate';

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
        expect(cell.philosopher).toContain('Nietzsche');
    });

    it('returns the mid-mid-mid cell (Agnostic-Neutral-Relational / Buber)', () => {
        // With the full library in place, every triple — including the
        // dead-centre neutral — resolves cleanly.
        const cell = getAlignmentCell({ epistemology: 0, outlook: 0, scope: 0 });
        expect(cell.id).toBe('mid-mid-relational');
        expect(cell.philosopher).toContain('Buber');
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

describe('Philosophy — v4 → v5 save migrator', () => {
    it('defaults philosophicalAlignment to {0,0,0} on v4 saves', () => {
        const v4Payload = {
            version: 4,
            player: createNewGameState().player,
            world: createNewGameState().world,
            combat: null,
            quests: { active: [], complete: [], known: [] },
            flags: [],
            moralMeter: 7,
            rngState: 12345,
        };
        const migrated = migrate(v4Payload, 4);
        // Phase 72 — migrate() funnels all the way to current
        // (GAME_STATE_VERSION = 6 post-runId bump); the v4→v5 step still
        // applies and defaults philosophicalAlignment, and the v5→v6 step
        // defaults runId on top.
        expect(migrated.version).toBe(GAME_STATE_VERSION);
        expect(migrated.philosophicalAlignment).toEqual({
            epistemology: 0, outlook: 0, scope: 0,
        });
        expect(migrated.moralMeter).toBe(7); // pre-existing field survives
        expect(migrated.runId).toMatch(/^[0-9a-f]{16}$/); // Phase 72 — defaulted by v5→v6
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

    it('every cell carries exactly 3 fallacies, each with name/example/rationale', () => {
        for (const cell of philosophicalAlignmentLibrary) {
            expect(cell.fallacies.length).toBe(3);
            for (const f of cell.fallacies) {
                expect(f.name.length).toBeGreaterThan(0);
                expect(f.example.length).toBeGreaterThan(0);
                expect(f.rationale.length).toBeGreaterThan(0);
            }
        }
    });
});

describe('Philosophy — PDF cross-check (cells 1 / 12 / 27)', () => {
    it('cell 1 — Logic-Optimistic-Individual matches the PDF', () => {
        const cell = getAlignmentCell({ epistemology: 80, outlook: 80, scope: -80 });
        expect(cell.philosopher).toContain('Nietzsche');
        expect(cell.literaryCharacter.name).toBe('Prometheus');
        expect(cell.literaryCharacter.work).toContain('Prometheus Unbound');
        expect(cell.fallacies[0].name).toBe('Appeal to Consequences');
    });

    it('cell 12 — Agnostic-Optimistic-Transcendent matches the PDF', () => {
        const cell = getAlignmentCell({ epistemology: 0, outlook: 80, scope: 80 });
        expect(cell.philosopher).toContain('William James');
        expect(cell.literaryCharacter.name).toBe('Pi Patel');
        expect(cell.literaryCharacter.work).toContain('Life of Pi');
        expect(cell.fallacies[0].name).toContain("Pascal's Wager");
    });

    it('cell 27 — Faith-Pessimistic-Transcendent matches the PDF', () => {
        const cell = getAlignmentCell({ epistemology: -80, outlook: -80, scope: 80 });
        expect(cell.philosopher).toContain('Marcion');
        expect(cell.literaryCharacter.name).toBe('The Grand Inquisitor');
        expect(cell.literaryCharacter.work).toContain('Brothers Karamazov');
        expect(cell.fallacies[0].name).toBe('No True Scotsman');
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
