/**
 * useQuestLanding — the presentation-only choreography for a cast of
 * the bone die.
 *
 * The engine resolves a roll synchronously: the moment the player taps
 * "cast the bone", `vm.pos` has already advanced and the space `pending`
 * is set. That is correct for the rules, but it robs the cast of any
 * drama. This hook reintroduces the drama without touching the engine:
 * it watches the VM transition into the `space` phase and replays it as
 *
 *   tumble the die  →  walk the piece one space at a time  →  reveal card
 *
 * It owns three pieces of derived view state — where the piece is shown
 * (`displayPos`), what the die reads (`dieFace` / `rollTick`), and
 * whether the landing card may open yet (`revealed`). All timers are
 * plain setTimeout/setInterval so tests can flush them deterministically.
 */

import { useEffect, useRef, useState } from 'react';

import type { QuestBoardVM } from '@/state/presenters/quest.engine';

/** Tunable cadence. Kept here so a test or reduced-motion path can read it. */
export const QUEST_LANDING_TIMING = Object.freeze({
    /** How long the die tumbles before settling. */
    rollMs: 720,
    /** Face swap cadence while tumbling. */
    tumbleMs: 80,
    /** Time the piece spends on each space as it walks. */
    stepMs: 240,
    /** Beat between arrival and the card opening. */
    arriveMs: 280,
});

export type QuestLandingStage = 'still' | 'rolling' | 'walking' | 'arrived';

export interface QuestLanding {
    stage: QuestLandingStage;
    /** Board index where the piece should be drawn right now. */
    displayPos: number;
    /** Die value to render (1-6), or null before the first cast. */
    dieFace: number | null;
    /** Increments each tumble frame — lets the die view spin/pulse. */
    rollTick: number;
    /** True once the landing card is allowed to open. */
    revealed: boolean;
    /**
     * Destination the piece is walking toward this cast, or null when
     * idle. Drives the board's "where you're headed" preview (U1).
     */
    targetPos: number | null;
    /** Spaces along the route to the destination (preview highlight). */
    pathPositions: readonly number[];
    /** Bumps once each time the piece lands — fires the arrival flourish (U2). */
    arrivalKey: number;
}

export function useQuestLanding(vm: QuestBoardVM): QuestLanding {
    const length = vm.spaces.length;

    const [stage, setStage] = useState<QuestLandingStage>('still');
    const [displayPos, setDisplayPos] = useState(vm.pos);
    const [dieFace, setDieFace] = useState<number | null>(vm.lastRoll?.die ?? null);
    const [rollTick, setRollTick] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [targetPos, setTargetPos] = useState<number | null>(null);
    const [pathPositions, setPathPositions] = useState<readonly number[]>([]);
    const [arrivalKey, setArrivalKey] = useState(0);

    // Latest values for use inside async timer callbacks without re-arming.
    const displayPosRef = useRef(displayPos);
    displayPosRef.current = displayPos;
    const prevPhaseRef = useRef(vm.phase);

    // Pending timer handles, cleared on unmount or re-trigger.
    const timersRef = useRef<{ tumble?: ReturnType<typeof setInterval>; walk?: ReturnType<typeof setInterval>; t: ReturnType<typeof setTimeout>[] }>({ t: [] });

    function clearTimers() {
        const h = timersRef.current;
        if (h.tumble) clearInterval(h.tumble);
        if (h.walk) clearInterval(h.walk);
        h.t.forEach(clearTimeout);
        timersRef.current = { t: [] };
    }

    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        prevPhaseRef.current = vm.phase;

        // A fresh landing: the only path into `space` is a resolved cast.
        const landed = prevPhase !== 'space' && vm.phase === 'space';

        if (!landed) {
            // Outside an active landing, keep the piece and die honest with
            // the VM and make sure nothing is left mid-flight.
            if (vm.phase !== 'space') {
                clearTimers();
                setStage('still');
                setRevealed(false);
                setTargetPos(null);
                setPathPositions([]);
                setDisplayPos(vm.pos);
                if (vm.lastRoll) setDieFace(vm.lastRoll.die);
            }
            return;
        }

        // Begin the choreography for this cast.
        clearTimers();
        const from = displayPosRef.current;
        const to = vm.pos;
        const die = vm.lastRoll?.die ?? null;
        const steps = length > 0 ? (to - from + length) % length : 0;
        // The route the piece will walk, in order (destination last).
        const path: number[] = [];
        for (let k = 1; k <= steps; k++) path.push((from + k) % length);

        setRevealed(false);
        setTargetPos(null);
        setPathPositions([]);
        setStage('rolling');
        setRollTick(0);

        // Tumble: advance the tick (the shown face derives from it), then
        // settle on the real value below.
        const handles = timersRef.current;
        handles.tumble = setInterval(() => {
            setRollTick(t => t + 1);
        }, QUEST_LANDING_TIMING.tumbleMs);

        handles.t.push(setTimeout(() => {
            if (handles.tumble) clearInterval(handles.tumble);
            setDieFace(die);
            // Die has settled — show where the piece is headed (U1).
            setTargetPos(to);
            setPathPositions(path);

            if (steps === 0) {
                // No movement (rare) — go straight to the reveal beat.
                setStage('arrived');
                setArrivalKey(k => k + 1);
                handles.t.push(setTimeout(() => setRevealed(true), QUEST_LANDING_TIMING.arriveMs));
                return;
            }

            setStage('walking');
            let walked = 0;
            handles.walk = setInterval(() => {
                walked += 1;
                setDisplayPos(p => (length > 0 ? (p + 1) % length : p));
                if (walked >= steps) {
                    if (handles.walk) clearInterval(handles.walk);
                    setStage('arrived');
                    setArrivalKey(k => k + 1);
                    handles.t.push(setTimeout(() => setRevealed(true), QUEST_LANDING_TIMING.arriveMs));
                }
            }, QUEST_LANDING_TIMING.stepMs);
        }, QUEST_LANDING_TIMING.rollMs));
    }, [vm.phase, vm.pos, vm.lastRoll, length]);

    // Final cleanup.
    useEffect(() => clearTimers, []);

    // While tumbling we want a visibly changing face; derive it from the
    // tick so the value is deterministic for a given frame.
    const shownFace = stage === 'rolling' ? ((rollTick % 6) + 1) : dieFace;

    return { stage, displayPos, dieFace: shownFace, rollTick, revealed, targetPos, pathPositions, arrivalKey };
}
