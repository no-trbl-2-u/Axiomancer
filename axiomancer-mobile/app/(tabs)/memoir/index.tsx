import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { useGameState } from '@/state/GameStoreProvider';
import {
    selectMemoirViewModel,
    type MemoirQuestRow,
    type MemoirViewModel,
} from '@/state/presenters/memoir.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function QuestCard({ quest }: { quest: MemoirQuestRow }) {
    const styles = useStyles();
    return (
        // Phase 74 follow-up walkthrough — memoir Tick 2: wrap the
        // whole card in a TooltipTarget pointing at the new
        // kind:'quest-objective' content keyed by quest status.
        // Tap explains what a quest in that state means.
        <TooltipTarget
            kind="quest-objective"
            id={quest.status}
            accessibilityLabel={`Explain ${quest.status} quest`}
            accessibilityHint="tap to read description"
            testID={`memoir-quest-${quest.id}-tooltip`}
        >
            <View
                style={[
                    styles.questCard,
                    quest.status === 'completed' && styles.questCardCompleted,
                ]}
                testID={`memoir-quest-${quest.id}`}
            >
                <Text style={styles.questName}>{quest.name}</Text>
                {quest.description.length > 0 && (
                    <Text style={styles.questDescription}>{quest.description}</Text>
                )}
                {quest.objectives.length > 0 && (
                    <View style={styles.objectiveList}>
                        {quest.objectives.map((o) => (
                            <Text
                                key={o.id}
                                style={[styles.objectiveLine, o.done && styles.objectiveDone]}
                            >
                                {o.bullet} {o.text}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        </TooltipTarget>
    );
}

/**
 * MEMOIR screen — read-only journal surface. Phase 33 Tick A
 * renders the four section shells with presenter-sourced
 * empty-state copy; Tick B (this commit) renders quest cards
 * from `state.quests`. Ticks C-D fill in alignment + chronicle.
 *
 * Subscribes to slim slices and memo's the VM (Phase 30 Tick A
 * pattern) — `useGameState(selectMemoirViewModel)` would churn
 * `useSyncExternalStore` because the VM is a frozen-new object
 * every call.
 */
export default function MemoirScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const resolveTint = (
        key: MemoirViewModel['moralAlignment']['chip']['tintKey'],
    ): string => {
        if (key === 'blood') return AXM.blood;
        if (key === 'rust') return AXM.rust;
        if (key === 'sulfur') return AXM.sulfur;
        if (key === 'parchment') return AXM.parchment;
        return AXM.bone;
    };
    const player = useGameState((s) => s.player);
    const quests = useGameState((s) => s.quests);
    const moralMeter = useGameState((s) => s.moralMeter);
    // Subscribing to `_recentEvents` here even though Tick A doesn't
    // read it yet — Tick D's chronicle mapper will, and arming the
    // subscription now means the screen rebuilds the chronicle
    // automatically when the ring buffer ticks.
    const recentEvents = useGameState((s) => s._recentEvents);
    const vm = useMemo<MemoirViewModel>(
        () =>
            selectMemoirViewModel({
                player,
                quests,
                moralMeter,
                _recentEvents: recentEvents,
            } as never),
        [player, quests, moralMeter, recentEvents],
    );

    return (
        <ScreenBg>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <SectionLabel size={10} color={AXM.bone}>
                        {vm.headerEyebrow}
                    </SectionLabel>
                    <Text style={styles.subline}>{vm.headerSubline}</Text>
                </View>

                {/* Chronicle */}
                <View style={styles.section} testID="memoir-chronicle">
                    <SectionLabel size={10}>{vm.chronicleEyebrow}</SectionLabel>
                    {vm.chronicle.length === 0 ? (
                        <Text style={styles.emptyLine}>{vm.emptyChronicle}</Text>
                    ) : (
                        vm.chronicle.map((entry) => (
                            // Phase 74 follow-up walkthrough — memoir
                            // Tick 2: wrap each chronicle row in a
                            // TooltipTarget pointing at the new
                            // kind:'chronicle-entry' content keyed by
                            // engine event type.
                            <TooltipTarget
                                key={entry.id}
                                kind="chronicle-entry"
                                id={entry.kind}
                                accessibilityLabel={`Explain ${entry.label} chronicle entry`}
                                accessibilityHint="tap to read description"
                                testID={`memoir-chronicle-${entry.id}-tooltip`}
                            >
                                <View style={styles.chronicleRow}>
                                    <Text style={styles.chronicleLabel}>
                                        {entry.label}
                                    </Text>
                                    <Text style={styles.chronicleBody}>
                                        {entry.body}
                                    </Text>
                                </View>
                            </TooltipTarget>
                        ))
                    )}
                </View>

                {/* Errands */}
                <View style={styles.section} testID="memoir-quests">
                    <SectionLabel size={10}>{vm.questsEyebrow}</SectionLabel>
                    {vm.quests.active.length === 0 &&
                    vm.quests.completed.length === 0 &&
                    vm.quests.forgotten.length === 0 ? (
                        <Text style={styles.emptyLine}>{vm.emptyQuests}</Text>
                    ) : (
                        <>
                            {vm.quests.active.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsActiveEyebrow}
                                    </SectionLabel>
                                    {vm.quests.active.map((q) => (
                                        <QuestCard key={q.id} quest={q} />
                                    ))}
                                </View>
                            )}
                            {vm.quests.completed.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsCompletedEyebrow}
                                    </SectionLabel>
                                    {vm.quests.completed.map((q) => (
                                        <QuestCard key={q.id} quest={q} />
                                    ))}
                                </View>
                            )}
                            {vm.quests.forgotten.length > 0 && (
                                <View style={styles.questGroup}>
                                    <SectionLabel size={9} color={AXM.bone}>
                                        {vm.questsForgottenEyebrow}
                                    </SectionLabel>
                                    {vm.quests.forgotten.map((q) => (
                                        <QuestCard key={q.id} quest={q} />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Measure */}
                <View style={styles.section} testID="memoir-measure">
                    <SectionLabel size={10}>{vm.measureEyebrow}</SectionLabel>
                    <View style={styles.measureRow}>
                        {/* Phase 74 follow-up walkthrough — memoir Tick 1:
                            wrap each alignment chip in a TooltipTarget
                            pointing at the new kind:'alignment' ids
                            ('moral', 'philosophical'). */}
                        <TooltipTarget
                            kind="alignment"
                            id="moral"
                            accessibilityLabel="Explain moral alignment"
                            accessibilityHint="tap to read description"
                            testID="memoir-moral-chip-tooltip"
                        >
                            <View
                                style={[
                                    styles.measureChip,
                                    { borderColor: resolveTint(vm.moralAlignment.chip.tintKey) },
                                ]}
                                testID="memoir-moral-chip"
                            >
                                <Text
                                    style={[
                                        styles.measureLabel,
                                        { color: resolveTint(vm.moralAlignment.chip.tintKey) },
                                    ]}
                                >
                                    {vm.moralAlignment.chip.label}
                                </Text>
                                {vm.moralAlignment.isEmpty && (
                                    <Text style={styles.measureEmpty} testID="memoir-moral-empty">
                                        {vm.emptyMoral}
                                    </Text>
                                )}
                            </View>
                        </TooltipTarget>
                        <TooltipTarget
                            kind="alignment"
                            id="philosophical"
                            accessibilityLabel="Explain philosophical alignment"
                            accessibilityHint="tap to read description"
                            testID="memoir-philosophical-chip-tooltip"
                        >
                            <View style={styles.measureChip} testID="memoir-philosophical-chip">
                                <Text style={styles.measureLabel}>
                                    {vm.philosophicalAlignment.label}
                                </Text>
                                {vm.philosophicalAlignment.rationale.length > 0 && (
                                    <Text style={styles.measureRationale}>
                                        {vm.philosophicalAlignment.rationale}
                                    </Text>
                                )}
                                {vm.philosophicalAlignment.rationale.length === 0 && (
                                    <Text style={styles.measureEmpty} testID="memoir-philosophical-empty">
                                        {vm.emptyPhilosophical}
                                    </Text>
                                )}
                            </View>
                        </TooltipTarget>
                    </View>
                    {vm.philosopherQuote !== null && (
                        <Text style={styles.quote}>{vm.philosopherQuote}</Text>
                    )}
                </View>
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scroll: { paddingBottom: 32 },
    header: { padding: 14, paddingBottom: 4 },
    subline: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.bone,
        marginTop: 2,
    },
    section: { padding: 14, paddingTop: 12 },
    emptyLine: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.bone,
        marginTop: 6,
        textTransform: 'uppercase',
    },
    chronicleRow: {
        marginTop: 6,
        borderLeftWidth: 1,
        borderLeftColor: AXM.ash,
        paddingLeft: 8,
    },
    chronicleLabel: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    chronicleBody: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        color: AXM.parchment,
        lineHeight: 17,
        marginTop: 1,
    },
    questGroup: { marginTop: 6 },
    questCard: {
        marginTop: 4,
        padding: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    questCardCompleted: { opacity: 0.55 },
    questName: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    questDescription: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
        lineHeight: 15,
    },
    objectiveList: { marginTop: 4, gap: 2 },
    objectiveLine: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.bone,
        letterSpacing: 0.5,
    },
    objectiveDone: { color: AXM.sulfur, textDecorationLine: 'line-through' },
    measureRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    measureChip: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    measureLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    measureRationale: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
        lineHeight: 15,
    },
    measureEmpty: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 4,
        lineHeight: 15,
    },
    quote: {
        fontFamily: FONTS.serifItalic,
        fontSize: 11,
        color: AXM.sulfur,
        marginTop: 8,
        lineHeight: 14,
    },
}));
