/**
 * The hazard puzzle board's clock: counts down one second at a time while
 * `running`, and calls `onExpire` once when it reaches zero. `startKey`
 * changes each time a board starts, which refills the clock to `seconds`
 * (the same route twice in a row still gets a fresh clock). The arithmetic
 * is the presenter's (`tickHazardPuzzleClock`); this hook only owns the
 * interval.
 */

import { useEffect, useRef, useState } from 'react';

import { hazardPuzzleClockExpired, tickHazardPuzzleClock } from '@/state/presenters/hazard-puzzle.engine';

export const HAZARD_PUZZLE_TICK_MS = 1000;

interface ClockState {
    startKey: number;
    remaining: number;
}

export function useHazardPuzzleClock(
    seconds: number,
    running: boolean,
    startKey: number,
    onExpire: () => void,
): number {
    const [clock, setClock] = useState<ClockState>({ startKey, remaining: seconds });
    // A new board refills the clock in the same render, so a stale zero from
    // the last board (or from mount) never reads as expired.
    const remaining = clock.startKey === startKey ? clock.remaining : seconds;
    if (clock.startKey !== startKey) setClock({ startKey, remaining: seconds });

    const expireRef = useRef(onExpire);
    expireRef.current = onExpire;
    const firedFor = useRef<number | null>(null);

    useEffect(() => {
        if (!running) return undefined;
        const id = setInterval(
            () => setClock((c) => ({ ...c, remaining: tickHazardPuzzleClock(c.remaining) })),
            HAZARD_PUZZLE_TICK_MS,
        );
        return () => clearInterval(id);
    }, [running, startKey]);

    useEffect(() => {
        if (running && clock.startKey === startKey && hazardPuzzleClockExpired(remaining) && firedFor.current !== startKey) {
            firedFor.current = startKey;
            expireRef.current();
        }
    }, [remaining, running, startKey, clock.startKey]);

    return remaining;
}
