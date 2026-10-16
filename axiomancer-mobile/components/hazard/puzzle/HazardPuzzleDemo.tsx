/**
 * The dev-menu HAZARD PUZZLES flow: the list of demo puzzles, a route pick
 * (before the clock starts), the board under the clock, and the outcome
 * panel. The puzzle session lives in local state and is never saved; the
 * engine runs every move, the presenter shapes every view, and only the
 * outcome reaches the store (`claimHazardPuzzle`).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
    activeHazardPuzzleUnlocks,
    applyHazardPuzzleCard,
    confirmHazardPuzzle,
    createHazardPuzzleSession,
    discardHazardPuzzleCard,
    getHazardPuzzleLayout,
    powerHazardPuzzleCard,
    stageHazardPuzzleCard,
    unstageHazardPuzzleCard,
    type HazardPuzzleLayout,
    type HazardPuzzleSession,
    type HazardPuzzleUnlock,
    type HazardRouteKey,
} from '@mechanics';

import { DevButton, DevRow } from '@/components/dev/DevControls';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    hazardPuzzleClockFor,
    selectHazardPuzzleBoardVM,
    selectHazardPuzzleListVM,
    selectHazardPuzzleOutcomeVM,
    selectHazardPuzzleRoutes,
    selectHazardPuzzleUnlockLine,
    type HazardPuzzleOutcomeVM,
} from '@/state/presenters/hazard-puzzle.engine';
import {
    HAZARD_PUZZLE_BACK_LABEL,
    HAZARD_PUZZLE_LIST_INTRO,
    HAZARD_PUZZLE_LIST_TITLE,
    HAZARD_PUZZLE_PICK_ROUTE,
} from '@/state/presenters/hazard-puzzle.copy';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { HazardPuzzleBoardView } from './HazardPuzzleBoardView';
import { HazardPuzzleOutcomePanel } from './HazardPuzzleOutcomePanel';
import { useHazardPuzzleClock } from './useHazardPuzzleClock';

export interface HazardPuzzleDemoProps {
    /** Open this demo straight away (smoke shots, deep links). */
    initialId?: string;
    /** With `initialId`, start this route straight away. */
    initialRoute?: HazardRouteKey;
    /** With both, confirm at once to show the outcome panel. */
    autoConfirm?: boolean;
    /** Hold the clock (stable smoke shots of the board). */
    clockPaused?: boolean;
}

interface Play {
    layout: HazardPuzzleLayout;
    session: HazardPuzzleSession;
    unlocks: HazardPuzzleUnlock[];
    /** Changes on every start, so the clock refills. */
    startKey: number;
}

function findLayout(id: string | undefined): HazardPuzzleLayout | null {
    if (!id) return null;
    try {
        return getHazardPuzzleLayout(id);
    } catch {
        return null;
    }
}

export function HazardPuzzleDemo({ initialId, initialRoute, autoConfirm, clockPaused }: HazardPuzzleDemoProps) {
    const styles = useStyles();
    const actions = useGameActions();
    const baseStats = useGameState((s) => s.player.baseStats);
    const [picked, setPicked] = useState<HazardPuzzleLayout | null>(() => findLayout(initialId));
    const [play, setPlay] = useState<Play | null>(null);
    const [outcome, setOutcome] = useState<HazardPuzzleOutcomeVM | null>(null);

    const start = useCallback(
        (layout: HazardPuzzleLayout, route: HazardRouteKey) => {
            const unlocks = activeHazardPuzzleUnlocks(layout, baseStats);
            setPlay((prev) => ({
                layout,
                unlocks,
                session: createHazardPuzzleSession(layout, route, unlocks),
                startKey: (prev?.startKey ?? 0) + 1,
            }));
            setOutcome(null);
        },
        [baseStats],
    );

    const finish = useCallback(
        (timedOut: boolean) => {
            if (!play || play.session.phase !== 'playing') return;
            const resolved = confirmHazardPuzzle(play.session);
            const result = resolved.result;
            if (!result) return;
            const claim = actions.claimHazardPuzzle(play.layout, resolved.route, result.p);
            setPlay({ ...play, session: resolved });
            setOutcome(selectHazardPuzzleOutcomeVM(result, claim.outcome, timedOut, claim));
        },
        [actions, play],
    );

    const seconds = play ? hazardPuzzleClockFor(play.layout, play.session.route) : 0;
    const running = play !== null && play.session.phase === 'playing' && !clockPaused;
    const remaining = useHazardPuzzleClock(seconds, running, play?.startKey ?? 0, () => finish(true));

    useEffect(() => {
        if (picked && initialRoute && !play && !outcome) start(picked, initialRoute);
        // Deep-link start only: runs once the picked layout is set.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picked]);

    useEffect(() => {
        if (autoConfirm && play && play.session.phase === 'playing' && !outcome) finish(false);
    }, [autoConfirm, play, outcome, finish]);

    const move = (fn: (s: HazardPuzzleSession) => HazardPuzzleSession) => {
        if (play) setPlay({ ...play, session: fn(play.session) });
    };

    const list = useMemo(() => selectHazardPuzzleListVM(), []);

    if (play) {
        const vm = selectHazardPuzzleBoardVM(play.layout, play.session, remaining);
        return (
            <View style={styles.root}>
                {outcome ? (
                    <HazardPuzzleOutcomePanel
                        vm={outcome}
                        onDone={() => {
                            setPlay(null);
                            setOutcome(null);
                            setPicked(null);
                        }}
                    />
                ) : null}
                <HazardPuzzleBoardView
                    vm={vm}
                    unlockLine={selectHazardPuzzleUnlockLine(play.unlocks)}
                    onStage={(uid) => move((s) => stageHazardPuzzleCard(s, uid))}
                    onDiscard={(uid) => move((s) => discardHazardPuzzleCard(s, uid))}
                    onPower={(uid, dieId) => move((s) => powerHazardPuzzleCard(s, uid, dieId))}
                    onApply={(uid) => move((s) => applyHazardPuzzleCard(s, uid))}
                    onReturn={(uid) => move((s) => unstageHazardPuzzleCard(s, uid))}
                    onConfirm={() => finish(false)}
                />
            </View>
        );
    }

    if (picked) {
        return (
            <View style={styles.root} testID="hazard-puzzle-routes">
                <Text style={styles.title}>{picked.title}</Text>
                <Text style={styles.intro}>{HAZARD_PUZZLE_PICK_ROUTE}</Text>
                <Text style={styles.intro} testID="hazard-puzzle-route-unlocks">
                    {selectHazardPuzzleUnlockLine(activeHazardPuzzleUnlocks(picked, baseStats))}
                </Text>
                {selectHazardPuzzleRoutes(picked).map((r) => (
                    <DevRow key={r.key} label={r.name} sub={`${r.goalLabel} · ${r.bandLabel} · ${r.clockLabel}`} stacked>
                        <DevButton label={r.name} testID={r.testID} onPress={() => start(picked, r.key)} />
                    </DevRow>
                ))}
                <DevButton label={HAZARD_PUZZLE_BACK_LABEL} testID="hazard-puzzle-back" onPress={() => setPicked(null)} />
            </View>
        );
    }

    return (
        <View style={styles.root} testID="hazard-puzzle-list">
            <Text style={styles.title}>{HAZARD_PUZZLE_LIST_TITLE}</Text>
            <Text style={styles.intro}>{HAZARD_PUZZLE_LIST_INTRO}</Text>
            {list.map((item) => (
                <DevRow key={item.id} label={item.title} sub={item.bandChip} stacked>
                    <DevButton
                        label={item.title}
                        testID={item.testID}
                        onPress={() => setPicked(findLayout(item.id))}
                    />
                </DevRow>
            ))}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { gap: 8 },
    title: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.sulfur, letterSpacing: 1 },
    intro: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.bone },
}));
