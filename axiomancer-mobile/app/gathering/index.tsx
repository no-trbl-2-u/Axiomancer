/**
 * Gathering minigame screen — full-screen foraging surface ("The
 * Gleaning"). Phase orchestration only: the engine (axiomancer-mechanics
 * World/Gathering) owns rules, the presenter owns mapping, this screen renders the VM
 * and dispatches store actions.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ApproachSelect } from '@/components/gathering/ApproachSelect';
import { TutorialCoach } from '@/components/gathering/TutorialCoach';
import { currentTutorialStep } from '@/components/gathering/tutorial-steps';
import { GATHERING_TUTORIAL_FLAG } from '@/state/gathering/store-actions';
import { GatheringBoard } from '@/components/gathering/GatheringBoard';
import { GatheringIntroOverlay } from '@/components/gathering/GatheringIntroOverlay';
import {
    GatheringOutcomeOverlay,
    PlotDetailOverlay,
    ReprisalOverlay,
} from '@/components/gathering/GatheringOverlays';
import { SpoilsOverlay } from '@/components/gathering/SpoilsOverlay';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    selectGatheringViewModel,
    type GatherPlotVM,
} from '@/state/presenters/gathering.engine';
import type { SeedInput } from 'axiomancer-mechanics';

export default function GatheringScreen() {
    const gathering = useGameState((s) => s.gathering);
    const player = useGameState((s) => s.player);
    const tutorialDone = useGameState((s) =>
        ((s as unknown as { flags?: string[] }).flags ?? []).includes(GATHERING_TUTORIAL_FLAG),
    );
    const vm = useMemo(
        () => selectGatheringViewModel({ gathering, player }),
        [gathering, player],
    );
    const actions = useGameActions();
    const router = useRouter();

    // The coach rides the guided first gleaning until its script is done
    // or skipped; the persistent flag gates it (and the map trigger).
    const session = gathering?.session ?? null;
    const coachActive = gathering?.tutorial === true && session !== null && !tutorialDone;
    useEffect(() => {
        if (coachActive && currentTutorialStep(session!, vm) === -1) {
            actions.completeGatheringTutorial(false);
        }
    }, [coachActive, session, vm, actions]);

    const [detailPlot, setDetailPlot] = useState<GatherPlotVM | null>(null);

    // Site-reveal modal: shown once per session (keyed by seed) before
    // the approach choice — for map-triggered AND dev-triggered alike.
    const [introAckSeed, setIntroAckSeed] = useState<SeedInput | null>(null);
    const showIntro = vm.active && vm.phase === 'approach-select' && introAckSeed !== vm.sessionSeed;

    // The detail overlay must never outlive the plot it describes
    // (harvested / trampled / redrawn).
    useEffect(() => {
        if (detailPlot && !vm.spread.find((p) => p.uid === detailPlot.uid)) {
            setDetailPlot(null);
        }
    }, [vm.spread, detailPlot]);

    // Leave the screen when the session clears (spoils claimed /
    // abandoned elsewhere).
    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <View style={styles.root} testID="gathering-empty" />;

    return (
        <View style={styles.root}>
            {vm.phase !== 'approach-select' && (
                <GatheringBoard
                    vm={vm}
                    onHarvest={(uid) => actions.harvestGatheringPlot(uid)}
                    onInspect={setDetailPlot}
                    onDescend={() => actions.descendGathering()}
                    onPayOffering={(id) => actions.payGatheringOffering(id)}
                    onUseTool={(id) => actions.useGatheringTool(id)}
                    onWithdraw={() => actions.withdrawFromGathering()}
                />
            )}

            {vm.phase === 'approach-select' && !showIntro && (
                <ApproachSelect vm={vm} onPick={(key) => actions.selectGatheringApproach(key)} />
            )}

            {showIntro && (
                <GatheringIntroOverlay
                    title={vm.title}
                    intro={vm.intro}
                    onContinue={() => setIntroAckSeed(vm.sessionSeed)}
                />
            )}

            {vm.reprisalFlash !== null && (
                <ReprisalOverlay
                    flash={vm.reprisalFlash}
                    onDone={() => actions.continueGatheringAfterReprisal()}
                />
            )}

            {vm.phase === 'outcome' && vm.outcome !== null && (
                <GatheringOutcomeOverlay
                    outcome={vm.outcome}
                    onContinue={() => actions.acknowledgeGatheringOutcome()}
                />
            )}

            {vm.phase === 'rewards' && vm.spoils !== null && (
                <SpoilsOverlay
                    spoils={vm.spoils}
                    onConfirm={() => {
                        actions.claimGatheringSpoils();
                    }}
                />
            )}

            {coachActive && !showIntro && (
                <TutorialCoach
                    session={session!}
                    vm={vm}
                    onSkip={() => actions.completeGatheringTutorial(true)}
                />
            )}

            {detailPlot !== null && (
                <PlotDetailOverlay
                    plot={detailPlot}
                    onTake={(uid) => {
                        setDetailPlot(null);
                        actions.harvestGatheringPlot(uid);
                    }}
                    onClose={() => setDetailPlot(null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a0b08' },
});
