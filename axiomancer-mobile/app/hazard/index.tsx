/**
 * Hazard minigame screen — full-screen tactical surface.
 *
 * Phase orchestration only: the engine (axiomancer-mechanics
 * World/Hazard) owns rules,
 * the presenter owns mapping, this screen renders the VM, hosts the
 * screen-level drag ghost, and dispatches store actions.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from '@/lib/platform/router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { HazardBoard, type DragController, type DragPayload } from '@/components/hazard/HazardBoard';
import { HazardCard } from '@/components/hazard/HazardCard';
import { HazardDie } from '@/components/hazard/HazardDie';
import {
    CardDetailOverlay,
    DiceRollOverlay,
    OutcomeOverlay,
    ResolveFlashOverlay,
} from '@/components/hazard/HazardOverlays';
import { RewardsOverlay } from '@/components/hazard/RewardsOverlay';
import { RouteSelect } from '@/components/hazard/RouteSelect';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { selectHazardViewModel, type HazardCardVM } from '@/state/presenters/hazard.engine';
import { HUE } from '@/theme/axm';

type DropResolver = (payload: DragPayload, x: number, y: number) => void | Promise<void>;

export default function HazardScreen() {
    const hazard = useGameState((s) => s.hazard);
    const vm = useMemo(() => selectHazardViewModel({ hazard }), [hazard]);
    const actions = useGameActions();
    const router = useRouter();

    const [detailCard, setDetailCard] = useState<HazardCardVM | null>(null);

    // ── screen-level drag controller ──
    const [dragActive, setDragActive] = useState<DragPayload | null>(null);
    const dragRef = useRef<DragPayload | null>(null);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const dragShown = useSharedValue(0);

    const begin = useCallback(
        (payload: DragPayload, x: number, y: number) => {
            dragRef.current = payload;
            dragX.value = x;
            dragY.value = y;
            dragShown.value = 1;
            setDragActive(payload);
        },
        [dragX, dragY, dragShown],
    );
    const move = useCallback(
        (x: number, y: number) => {
            dragX.value = x;
            dragY.value = y;
        },
        [dragX, dragY],
    );
    const drag: DragController = useMemo(
        () => ({ begin, move, end: () => undefined, active: dragActive }),
        [begin, move, dragActive],
    );
    const end = useCallback(
        (x: number, y: number) => {
            const payload = dragRef.current;
            dragRef.current = null;
            dragShown.value = 0;
            setDragActive(null);
            if (!payload) return;
            const resolver = (drag as DragController & { resolveDrop?: DropResolver }).resolveDrop;
            if (resolver) void resolver(payload, x, y);
        },
        [drag, dragShown],
    );
    drag.end = end;

    const ghostStyle = useAnimatedStyle(() => ({
        opacity: dragShown.value,
        transform: [{ translateX: dragX.value - 45 }, { translateY: dragY.value - 70 }],
    }));

    // Leave the screen when the session clears (rewards claimed /
    // abandoned elsewhere).
    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <View style={styles.root} testID="hazard-empty" />;

    return (
        <View style={styles.root}>
            {vm.phase !== 'route-select' && (
                <HazardBoard
                    vm={vm}
                    drag={drag}
                    onStage={(uid) => actions.stageHazardCard(uid)}
                    onUnstage={(uid) => actions.unstageHazardCard(uid)}
                    onPower={(uid, dieId) => actions.powerHazardCard(uid, dieId)}
                    onApply={(uid) => actions.applyHazardCard(uid)}
                    onDiscard={(uid) => actions.discardHazardCard(uid)}
                    onResolve={() => actions.resolveHazardRound()}
                    onInspect={setDetailCard}
                />
            )}

            {vm.phase === 'route-select' && (
                <RouteSelect
                    vm={vm}
                    onPick={(route) => actions.selectHazardRoute(route)}
                    onInspect={setDetailCard}
                />
            )}

            {vm.phase === 'rolling' && vm.routeKey !== null && (
                <DiceRollOverlay
                    dice={vm.dice}
                    routeLabel={vm.routeLabel}
                    routeKey={vm.routeKey}
                    onDone={() => actions.finishHazardRolling()}
                />
            )}

            {vm.resolveFlash !== null && (
                <ResolveFlashOverlay
                    flash={vm.resolveFlash}
                    onDone={() => actions.continueHazardAfterResolve()}
                />
            )}

            {vm.phase === 'outcome' && vm.outcome !== null && (
                <OutcomeOverlay outcome={vm.outcome} onContinue={() => actions.acknowledgeHazardOutcome()} />
            )}

            {vm.phase === 'rewards' && vm.rewards !== null && (
                <RewardsOverlay
                    rewards={vm.rewards}
                    onConfirm={(cardId) => {
                        actions.claimHazardRewards(cardId);
                    }}
                />
            )}

            {detailCard !== null && (
                <CardDetailOverlay card={detailCard} onClose={() => setDetailCard(null)} />
            )}

            {/* drag ghost — follows the finger above everything */}
            {dragActive !== null && (
                <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
                    {dragActive.type === 'die' ? (
                        <HazardDie kind={dragActive.die.kind} size={44} glow />
                    ) : (
                        <HazardCard
                            card={dragActive.card}
                            mode={dragActive.from === 'play' ? 'play' : 'hand'}
                            dragging
                        />
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: HUE.inkBg },
    ghost: { position: 'absolute', top: 0, left: 0, zIndex: 999 },
});
