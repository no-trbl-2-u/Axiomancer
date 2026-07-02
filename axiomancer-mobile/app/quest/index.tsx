/**
 * /quest — the Quest Board minigame screen ("The Boy's Almanac").
 *
 * The story-quest encounter plays as a tabletop board game inside the
 * fiction: a loop of spaces, a wooden piece, a carved bone die. All
 * rules live in `axiomancer-mechanics` (World/QuestBoard); this
 * screen renders the presenter VM and dispatches store actions only.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { QuestBoardTrack } from '@/components/quest/QuestBoardTrack';
import { QuestDie } from '@/components/quest/QuestDie';
import { QuestHullMeter } from '@/components/quest/QuestHullMeter';
import { QuestLegend } from '@/components/quest/QuestLegend';
import { useQuestLanding } from '@/components/quest/useQuestLanding';
import {
    QuestDuskOverlay,
    QuestIntroOverlay,
    QuestOutcomeOverlay,
    QuestSpaceOverlay,
} from '@/components/quest/QuestOverlays';
import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { QUEST_TIER_LABELS, selectQuestBoardVM } from '@/state/presenters/quest.engine';
import type { QuestSpaceKind } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

/** Kind-themed haptic for the arrival flourish (U2). No-op off-device. */
function fireArrivalHaptic(kind: QuestSpaceKind | undefined): void {
    if (!kind) return;
    try {
        if (kind === 'duel' || kind === 'snag') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        } else if (kind === 'hearth' || kind === 'cache' || kind === 'gather') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        }
    } catch {
        // Haptics are pure polish — never let them break the screen.
    }
}

export default function QuestScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    // Subscribe to the stable slice; memo the VM downstream (the
    // presenter returns a fresh object every call — same doctrine as
    // the event screen's getSnapshot note).
    const slice = useGameState((s) => s.quest);
    const vm = useMemo(() => selectQuestBoardVM({ quest: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();
    const { width } = useWindowDimensions();

    // Presentation-only choreography: tumble → walk the piece → reveal.
    const land = useQuestLanding(vm);

    // Auto-close when the session clears (claim or abandon).
    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    // Arrival flourish (U2): fire a kind-themed haptic the moment the piece
    // lands. The board handles the matching visual flash off the same key.
    const prevArrivalRef = useRef(land.arrivalKey);
    useEffect(() => {
        if (land.arrivalKey !== prevArrivalRef.current) {
            prevArrivalRef.current = land.arrivalKey;
            fireArrivalHaptic(vm.pending?.kind);
        }
    }, [land.arrivalKey, vm.pending]);

    // Hold the gathered-parts ledger (and the hull bar it feeds) steady
    // while a cast is in flight: the counts should tick over only once the
    // space resolves and the player walks on — never mid-tumble or mid-walk.
    // The gate is the engine phase, which flips synchronously with the roll,
    // not the choreography stage, which lags it by a frame.
    const settledPartsRef = useRef(vm.parts);
    const settledProgressRef = useRef(vm.boatProgress);
    if (vm.phase !== 'space') {
        settledPartsRef.current = vm.parts;
        settledProgressRef.current = vm.boatProgress;
    }

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    const boardSize = Math.min(width - 16, 420);
    const stretchPips = Array.from({ length: vm.stretchesPerDay }, (_, i) => i < vm.stretch);
    const shownParts = settledPartsRef.current;
    const shownProgress = settledProgressRef.current;

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Scene strip */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{vm.title}</Text>
                    <Text style={styles.headerSub}>
                        DAY {vm.day} · {vm.tierPreview.toUpperCase()} PACE
                    </Text>
                </View>

                {/* Resources */}
                <View style={styles.resourceRow} testID="quest-resources">
                    <Text style={styles.resource}>⚲ FISH {vm.fish}</Text>
                    <Text style={styles.resource}>♥ VIGOR {vm.vigor}/{vm.maxVigor}</Text>
                    {vm.wind > 0 && <Text style={[styles.resource, { color: AXM.sulfur }]}>≋ WIND +{vm.wind}</Text>}
                    <View style={styles.pipRow} accessibilityLabel={`Stretch ${vm.stretch} of ${vm.stretchesPerDay}`}>
                        {stretchPips.map((spent, i) => (
                            <Text key={i} style={[styles.pip, spent && { color: AXM.ash }]}>●</Text>
                        ))}
                    </View>
                </View>

                {/* Boat-build progress (U3) — held steady mid-cast */}
                <QuestHullMeter
                    progress={shownProgress}
                    tierLabel={QUEST_TIER_LABELS[vm.tierPreview]}
                />

                {/* The board */}
                <QuestBoardTrack
                    spaces={vm.spaces}
                    size={boardSize}
                    pieceIndex={land.displayPos}
                    targetIndex={land.targetPos}
                    pathIndices={land.pathPositions}
                    arrivalKey={land.arrivalKey}
                >
                    {/* Center well: the hull ledger + the bone die */}
                    <View style={styles.wellParts} testID="quest-parts">
                        {shownParts.map(p => (
                            <Text key={p.kind} style={styles.partLine} testID={`quest-part-${p.kind}`}>
                                {p.label}{' '}
                                <Text style={{ color: p.fitted >= p.required ? AXM.heal : AXM.parchment }}>
                                    {p.fitted}/{p.required}
                                </Text>
                                {p.carried > 0 && <Text style={{ color: AXM.sulfur }}>  +{p.carried}</Text>}
                            </Text>
                        ))}
                    </View>
                    {(land.dieFace !== null || vm.lastRoll !== null) && (
                        <QuestDie
                            face={land.dieFace}
                            rolling={land.stage === 'rolling'}
                            tick={land.rollTick}
                            bonus={vm.lastRoll?.bonus ?? 0}
                            total={land.stage === 'still' ? vm.lastRoll?.total ?? null : null}
                        />
                    )}
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Cast the bone die"
                        accessibilityState={{ disabled: vm.phase !== 'idle' }}
                        disabled={vm.phase !== 'idle'}
                        onPress={actions.rollQuestBone}
                        style={[styles.rollButton, { opacity: vm.phase === 'idle' ? 1 : 0.4 }]}
                        testID="quest-roll"
                    >
                        <Text style={styles.rollText}>
                            {land.stage === 'rolling'
                                ? 'THE BONE FALLS…'
                                : land.stage === 'walking' || land.stage === 'arrived'
                                  ? 'WALKING…'
                                  : 'CAST THE BONE'}
                        </Text>
                    </TouchableOpacity>
                </QuestBoardTrack>

                {/* Legend — what each mark on the track means */}
                <QuestLegend spaces={vm.spaces} />

                {/* Charms tray */}
                <Text style={styles.sectionLabel}>CHARMS</Text>
                <View style={styles.charmTray} testID="quest-charms">
                    {vm.charms.map(charm => (
                        <TouchableOpacity
                            key={charm.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${charm.name}. ${charm.desc}`}
                            accessibilityState={{ disabled: !charm.usable }}
                            disabled={!charm.usable}
                            onPress={() => actions.useQuestCharm(charm.id)}
                            style={[
                                styles.charmCard,
                                charm.primed && { borderColor: AXM.sulfur },
                                charm.used && { opacity: 0.35 },
                            ]}
                            testID={`quest-charm-${charm.id}`}
                        >
                            <Text style={styles.charmName}>{charm.name}</Text>
                            <Text style={styles.charmDesc}>
                                {charm.used ? 'SPENT' : charm.primed ? 'PRIMED' : charm.desc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Vows strip */}
                <Text style={styles.sectionLabel}>VOWS</Text>
                <View style={styles.vowStrip} testID="quest-vows">
                    {vm.vows.map(v => (
                        <Text
                            key={v.id}
                            style={[
                                styles.vowChip,
                                v.status === 'kept' && { color: AXM.heal, borderColor: AXM.heal },
                                v.status === 'broken' && { color: AXM.blood, borderColor: AXM.blood },
                            ]}
                        >
                            {v.name}
                        </Text>
                    ))}
                </View>

                {/* Escape hatch */}
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Fold the board away"
                    onPress={actions.abandonQuestBoard}
                    style={styles.abandon}
                    testID="quest-abandon"
                >
                    <Text style={styles.abandonText}>FOLD THE BOARD AWAY</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Overlays by phase */}
            {vm.phase === 'intro' && (
                <QuestIntroOverlay vm={vm} onBegin={actions.startQuestBoardPlay} />
            )}
            {vm.phase === 'space' && vm.pending !== null && land.revealed && (
                <QuestSpaceOverlay
                    pending={vm.pending}
                    onChoose={actions.chooseQuestSpaceOption}
                    onContinue={actions.continueQuestSpace}
                />
            )}
            {vm.phase === 'dusk' && (
                <QuestDuskOverlay
                    day={vm.day}
                    collapsed={vm.collapsedToday}
                    onContinue={actions.acknowledgeQuestDusk}
                />
            )}
            {vm.phase === 'outcome' && vm.outcome !== null && (
                <QuestOutcomeOverlay
                    outcome={vm.outcome}
                    onClaim={actions.claimQuestBoardCompletion}
                />
            )}
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scroll: { padding: 8, paddingBottom: 24 },
    header: { paddingHorizontal: 6, paddingTop: 4, paddingBottom: 8 },
    headerTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 28,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    headerSub: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 2,
    },
    resourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 6,
        paddingBottom: 8,
    },
    resource: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        letterSpacing: 1.5,
        color: AXM.parchment,
    },
    pipRow: { flexDirection: 'row', gap: 3, marginLeft: 'auto' },
    pip: { color: AXM.sulfur, fontSize: 12 },
    wellParts: { alignItems: 'flex-start', gap: 1 },
    partLine: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 0.5,
        color: AXM.bone,
    },
    rollButton: {
        marginTop: 6,
        borderWidth: 2,
        borderColor: AXM.sulfur,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.bg,
    },
    rollText: {
        fontFamily: FONTS.gothic,
        fontSize: 15,
        letterSpacing: 2,
        color: AXM.sulfur,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    charmTray: { flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
    charmCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 8,
    },
    charmName: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
    charmDesc: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    vowStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 6 },
    vowChip: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1.5,
        color: AXM.bone,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    abandon: { alignSelf: 'center', marginTop: 18, padding: 6 },
    abandonText: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 2,
        color: AXM.bone,
    },
}));
