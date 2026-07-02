/**
 * Hermetic unit tests — useQuestLanding (quest-board cast choreography)
 *
 * Pins the presentation-only hook that replays a resolved bone-die cast as
 * tumble -> walk -> reveal. The hook owns derived view state only (the engine
 * has already advanced `vm.pos`); these tests flush its plain
 * setTimeout/setInterval timers deterministically via jest fake timers, per
 * the hook's own design note (useQuestLanding.ts header).
 *
 * Covered: the tumbling die-face cycle, the modular-wrap walk path/step
 * computation, the still -> rolling -> walking -> arrived stage machine, the
 * no-movement short-circuit, the targetPos/pathPositions preview, the
 * `revealed` timing gate, the arrivalKey flourish bump, and the VM-sync reset
 * when the phase leaves `space`.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';

import {
    QUEST_LANDING_TIMING,
    useQuestLanding,
} from '@/components/quest/useQuestLanding';
import type { QuestBoardVM } from '@/state/presenters/quest.engine';

type Roll = { die: number; bonus: number; total: number };

/**
 * A minimal VM carrying only the fields useQuestLanding reads:
 * `phase`, `pos`, `spaces.length`, and `lastRoll`. Everything else is filler
 * so the cast to QuestBoardVM stays honest without dragging the full presenter.
 */
function makeVM(opts: {
    phase: QuestBoardVM['phase'];
    pos: number;
    spaceCount: number;
    lastRoll?: Roll | null;
}): QuestBoardVM {
    const spaces: QuestBoardVM['spaces'] = Array.from(
        { length: opts.spaceCount },
        (_unused, index) => ({
            index,
            id: `space-${index}`,
            kind: 'gather' as const,
            name: '',
            glyph: '',
            isPiece: index === opts.pos,
            isSlipway: index === 0,
        }),
    );
    return {
        active: true,
        phase: opts.phase,
        boardId: 'test-board',
        title: '',
        headline: '',
        storyBeat: '',
        intro: '',
        pieceName: '',
        day: 1,
        stretch: 0,
        stretchesPerDay: 1,
        fish: 0,
        vigor: 0,
        maxVigor: 0,
        wind: 0,
        pos: opts.pos,
        spaces,
        parts: [],
        boatProgress: 0,
        lastRoll: opts.lastRoll ?? null,
        charms: [],
        vows: [],
        tierPreview: 'driftwood',
        pending: null,
        collapsedToday: false,
        outcome: null,
    };
}

const { rollMs, tumbleMs, stepMs, arriveMs } = QUEST_LANDING_TIMING;

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    act(() => {
        jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
});

describe('useQuestLanding: idle state', () => {
    it('starts still, synced to the VM, with the card closed', () => {
        const vm = makeVM({ phase: 'idle', pos: 3, spaceCount: 8 });
        const { result } = renderHook((v: QuestBoardVM) => useQuestLanding(v), {
            initialProps: vm,
        });

        expect(result.current.stage).toBe('still');
        expect(result.current.displayPos).toBe(3);
        expect(result.current.revealed).toBe(false);
        expect(result.current.targetPos).toBeNull();
        expect(result.current.pathPositions).toEqual([]);
    });

    it('seeds dieFace from an existing lastRoll on first render', () => {
        const vm = makeVM({
            phase: 'idle',
            pos: 0,
            spaceCount: 6,
            lastRoll: { die: 4, bonus: 0, total: 4 },
        });
        const { result } = renderHook((v: QuestBoardVM) => useQuestLanding(v), {
            initialProps: vm,
        });
        expect(result.current.dieFace).toBe(4);
    });
});

describe('useQuestLanding: a cast that moves the piece', () => {
    function arm() {
        const rolling = makeVM({ phase: 'idle', pos: 2, spaceCount: 8 });
        const hook = renderHook((v: QuestBoardVM) => useQuestLanding(v), {
            initialProps: rolling,
        });
        // The engine resolves the cast: pos has already advanced to 5, and the
        // phase flips into `space`. from=2, to=5, length=8 -> 3 steps.
        const landed = makeVM({
            phase: 'space',
            pos: 5,
            spaceCount: 8,
            lastRoll: { die: 3, bonus: 0, total: 3 },
        });
        act(() => hook.rerender(landed));
        return hook;
    }

    it('enters the rolling stage immediately on landing', () => {
        const { result } = arm();
        expect(result.current.stage).toBe('rolling');
        expect(result.current.revealed).toBe(false);
    });

    it('cycles a visible die face deterministically while tumbling', () => {
        const { result } = arm();
        // rollTick starts at 0 -> shown face (0 % 6) + 1 = 1.
        expect(result.current.dieFace).toBe(1);
        act(() => {
            jest.advanceTimersByTime(tumbleMs);
        });
        // one tumble frame -> tick 1 -> face 2.
        expect(result.current.dieFace).toBe(2);
        act(() => {
            jest.advanceTimersByTime(tumbleMs * 5);
        });
        // tick 6 -> (6 % 6) + 1 = 1, proving the wrap.
        expect(result.current.dieFace).toBe(1);
    });

    it('settles on the real die face and previews the route once tumbling ends', () => {
        const { result } = arm();
        act(() => {
            jest.advanceTimersByTime(rollMs);
        });
        expect(result.current.dieFace).toBe(3);
        expect(result.current.stage).toBe('walking');
        expect(result.current.targetPos).toBe(5);
        // from=2, to=5: the route is 3,4,5 in order.
        expect(result.current.pathPositions).toEqual([3, 4, 5]);
    });

    it('walks the piece one space per step until it arrives', () => {
        const { result } = arm();
        act(() => {
            jest.advanceTimersByTime(rollMs);
        });
        expect(result.current.displayPos).toBe(2);
        act(() => {
            jest.advanceTimersByTime(stepMs);
        });
        expect(result.current.displayPos).toBe(3);
        act(() => {
            jest.advanceTimersByTime(stepMs * 2);
        });
        expect(result.current.displayPos).toBe(5);
        expect(result.current.stage).toBe('arrived');
    });

    it('opens the landing card only after the arrive beat', () => {
        const { result } = arm();
        act(() => {
            jest.advanceTimersByTime(rollMs + stepMs * 3);
        });
        expect(result.current.stage).toBe('arrived');
        expect(result.current.revealed).toBe(false);
        act(() => {
            jest.advanceTimersByTime(arriveMs);
        });
        expect(result.current.revealed).toBe(true);
    });

    it('bumps arrivalKey exactly once when the piece lands', () => {
        const { result } = arm();
        const before = result.current.arrivalKey;
        act(() => {
            jest.advanceTimersByTime(rollMs + stepMs * 3);
        });
        expect(result.current.arrivalKey).toBe(before + 1);
    });
});

describe('useQuestLanding: a cast that wraps the board', () => {
    it('computes the modular-wrap route when the piece laps the slipway', () => {
        const rolling = makeVM({ phase: 'idle', pos: 6, spaceCount: 8 });
        const { result, rerender } = renderHook(
            (v: QuestBoardVM) => useQuestLanding(v),
            { initialProps: rolling },
        );
        // from=6, to=1, length=8 -> steps = (1 - 6 + 8) % 8 = 3; route 7,0,1.
        const landed = makeVM({
            phase: 'space',
            pos: 1,
            spaceCount: 8,
            lastRoll: { die: 3, bonus: 0, total: 3 },
        });
        act(() => rerender(landed));
        act(() => {
            jest.advanceTimersByTime(rollMs);
        });
        expect(result.current.pathPositions).toEqual([7, 0, 1]);
        act(() => {
            jest.advanceTimersByTime(stepMs * 3);
        });
        expect(result.current.displayPos).toBe(1);
        expect(result.current.stage).toBe('arrived');
    });
});

describe('useQuestLanding: a cast with no movement', () => {
    it('skips straight to the reveal beat when the piece does not move', () => {
        const rolling = makeVM({ phase: 'idle', pos: 4, spaceCount: 8 });
        const { result, rerender } = renderHook(
            (v: QuestBoardVM) => useQuestLanding(v),
            { initialProps: rolling },
        );
        // from=4, to=4 -> steps 0: rolling -> arrived with no walking stage.
        const landed = makeVM({
            phase: 'space',
            pos: 4,
            spaceCount: 8,
            lastRoll: { die: 6, bonus: 0, total: 6 },
        });
        act(() => rerender(landed));
        act(() => {
            jest.advanceTimersByTime(rollMs);
        });
        expect(result.current.stage).toBe('arrived');
        expect(result.current.pathPositions).toEqual([]);
        expect(result.current.revealed).toBe(false);
        act(() => {
            jest.advanceTimersByTime(arriveMs);
        });
        expect(result.current.revealed).toBe(true);
    });
});

describe('useQuestLanding: leaving the space phase', () => {
    it('resets the choreography and re-syncs to the VM when phase moves on', () => {
        const rolling = makeVM({ phase: 'idle', pos: 0, spaceCount: 8 });
        const { result, rerender } = renderHook(
            (v: QuestBoardVM) => useQuestLanding(v),
            { initialProps: rolling },
        );
        const landed = makeVM({
            phase: 'space',
            pos: 3,
            spaceCount: 8,
            lastRoll: { die: 3, bonus: 0, total: 3 },
        });
        act(() => rerender(landed));
        act(() => {
            jest.advanceTimersByTime(rollMs + stepMs * 3 + arriveMs);
        });
        expect(result.current.revealed).toBe(true);

        // The player dismisses the card; the engine returns to rolling at the
        // new resting position (pos already advanced to 3).
        const next = makeVM({
            phase: 'idle',
            pos: 3,
            spaceCount: 8,
            lastRoll: { die: 3, bonus: 0, total: 3 },
        });
        act(() => rerender(next));

        expect(result.current.stage).toBe('still');
        expect(result.current.revealed).toBe(false);
        expect(result.current.targetPos).toBeNull();
        expect(result.current.pathPositions).toEqual([]);
        expect(result.current.displayPos).toBe(3);
        expect(result.current.dieFace).toBe(3);
    });
});
