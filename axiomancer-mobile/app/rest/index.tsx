/**
 * /rest — the Rest encounter screen ("The Night Watch").
 *
 * One night at camp in three watches: posture at dusk, the fire's
 * warmth against a small store of wood, and what the dark sends.
 * All rules live in `axiomancer-mechanics` (World/Rest); this screen
 * renders the presenter VM and dispatches store actions only.
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import {
    REST_WATCH_GLYPHS,
    selectRestVM,
    type RestOptionVM,
} from '@/state/presenters/rest.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

function OptionRow({ option, onPress }: { option: RestOptionVM; onPress: () => void }) {
    const styles = useStyles();
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${option.label}, ${option.desc}`}
            accessibilityState={{ disabled: !option.enabled }}
            disabled={!option.enabled}
            onPress={onPress}
            style={[styles.optionRow, { opacity: option.enabled ? 1 : 0.4 }]}
            testID={`rest-option-${option.id}`}
        >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDesc}>
                {option.enabled ? option.desc : `${option.desc}  —  ${option.disabledReason}`}
            </Text>
        </TouchableOpacity>
    );
}

export default function RestScreen() {
    const styles = useStyles();
    const AXM = usePalette();
    const slice = useGameState((s) => s.rest);
    const vm = useMemo(() => selectRestVM({ rest: slice }), [slice]);
    const actions = useGameActions();
    const router = useRouter();

    useEffect(() => {
        if (!vm.active && router.canGoBack()) router.back();
    }, [vm.active, router]);

    if (!vm.active) return <ScreenBg><View /></ScreenBg>;

    const warmthPips = Array.from({ length: vm.warmthMax }, (_, i) => i < vm.warmth);

    return (
        <ScreenBg scrollable={false}>
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>THE NIGHT WATCH</Text>
                <Text style={styles.title}>A CAMP, A FIRE, THE DARK</Text>

                {/* Fire status */}
                <View style={styles.fireRow} testID="rest-fire">
                    <Text style={styles.fireLabel}>WARMTH</Text>
                    <View style={styles.pipRow} accessibilityLabel={`Warmth ${vm.warmth} of ${vm.warmthMax}`}>
                        {warmthPips.map((lit, i) => (
                            <Text key={i} style={[styles.pip, { color: lit ? AXM.rust : AXM.ash }]}>✶</Text>
                        ))}
                    </View>
                    <Text style={styles.fireLabel}>WOOD {vm.wood}</Text>
                    <Text style={styles.fireLabel}>COMFORT {vm.comfort}</Text>
                </View>

                {/* Watch progress */}
                {vm.phase === 'watch' && (
                    <Text style={styles.watchCount} testID="rest-watch-count">
                        {vm.pending ? REST_WATCH_GLYPHS[vm.pending.kind] : ''} WATCH {vm.watch} OF {vm.watchesPerNight}
                    </Text>
                )}

                {/* Posture select */}
                {vm.phase === 'posture' && (
                    <View testID="rest-postures">
                        <Text style={styles.body}>
                            The fire is laid, the blanket unrolled, and the only decision
                            left is the oldest one: how much to trust the dark.
                        </Text>
                        {vm.postures.map(p => (
                            <TouchableOpacity
                                key={p.key}
                                accessibilityRole="button"
                                accessibilityLabel={`${p.name}. ${p.desc}`}
                                onPress={() => actions.chooseRestPosture(p.key)}
                                style={styles.postureCard}
                                testID={`rest-posture-${p.key}`}
                            >
                                <View style={styles.postureHead}>
                                    <Text style={styles.postureName}>{p.name}</Text>
                                    <Text style={styles.postureHint}>{p.healHint}</Text>
                                </View>
                                <Text style={styles.postureDesc}>{p.desc}</Text>
                                <Text style={styles.postureFlavor}>{p.flavor}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* The open watch card */}
                {vm.phase === 'watch' && vm.pending !== null && (
                    <View style={styles.card} testID="rest-card">
                        <Text style={styles.cardTitle}>
                            {vm.pending.result ? vm.pending.result.title : vm.pending.title}
                        </Text>
                        <Text style={styles.body}>
                            {vm.pending.result ? vm.pending.result.body : vm.pending.body}
                        </Text>

                        {vm.pending.result !== null && vm.pending.result.rolls.length > 0 && (
                            <Text style={styles.roll}>⚄ {vm.pending.result.rolls.join(' · ')}</Text>
                        )}
                        {vm.pending.result !== null && vm.pending.result.deltaChips.length > 0 && (
                            <View style={styles.chipRow}>
                                {vm.pending.result.deltaChips.map((chip, i) => (
                                    <Text key={i} style={styles.chip}>{chip}</Text>
                                ))}
                            </View>
                        )}
                        {vm.pending.result?.keepsake && (
                            <Text style={styles.keepsake} testID="rest-keepsake">
                                KEEPSAKE — {vm.pending.result.keepsake}
                            </Text>
                        )}

                        {vm.pending.result === null
                            ? vm.pending.options.map(option => (
                                <OptionRow
                                    key={option.id}
                                    option={option}
                                    onPress={() => actions.chooseRestOption(option.id)}
                                />
                            ))
                            : (
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel="Continue the night"
                                    onPress={actions.continueRestWatch}
                                    style={styles.bigButton}
                                    testID="rest-continue"
                                >
                                    <Text style={styles.bigButtonText}>THE NIGHT GOES ON</Text>
                                </TouchableOpacity>
                            )}
                    </View>
                )}

                {/* Dawn ledger */}
                {vm.phase === 'outcome' && vm.outcome !== null && (
                    <View style={styles.card} testID="rest-outcome">
                        <Text style={styles.eyebrow}>DAWN</Text>
                        <Text style={[styles.cardTitle, { color: AXM.sulfur }]}>{vm.outcome.tierLabel}</Text>
                        <View style={styles.chipRow}>
                            <Text style={styles.chip}>+{vm.outcome.healPercent}% VITAE</Text>
                            {vm.outcome.cleansed && <Text style={styles.chip}>AILMENTS CLEANSED</Text>}
                            <Text style={styles.chip}>WARMTH {vm.outcome.warmth}</Text>
                            <Text style={styles.chip}>COMFORT {vm.outcome.comfort}</Text>
                        </View>
                        {vm.outcome.keepsakes.length > 0 && (
                            <View style={styles.keepsakeBox}>
                                {vm.outcome.keepsakes.map((k, i) => (
                                    <Text key={i} style={styles.keepsake}>— {k}</Text>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Break camp"
                            onPress={actions.claimRestOutcome}
                            style={styles.bigButton}
                            testID="rest-claim"
                        >
                            <Text style={styles.bigButtonText}>BREAK CAMP</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Escape hatch */}
                {vm.phase !== 'outcome' && (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Walk on without resting"
                        onPress={actions.abandonRest}
                        style={styles.abandon}
                        testID="rest-abandon"
                    >
                        <Text style={styles.abandonText}>WALK ON WITHOUT RESTING</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
    // Centre the Night Watch in the viewport — the option stack left the
    // bottom ~40% empty black (critic round, same treatment as cache /
    // dialogue). Taller states still scroll.
    scroll: { padding: 14, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginBottom: 4,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 30,
        color: AXM.parchment,
        marginBottom: 10,
    },
    fireRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 8,
        marginBottom: 10,
    },
    fireLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    pipRow: { flexDirection: 'row', gap: 2 },
    pip: { fontSize: 14 },
    watchCount: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        letterSpacing: 2,
        color: AXM.sulfur,
        marginBottom: 6,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 19,
        color: AXM.parchment,
        marginBottom: 8,
    },
    postureCard: {
        borderWidth: 2,
        borderColor: AXM.bone,
        backgroundColor: AXM.bg,
        padding: 10,
        marginBottom: 8,
    },
    postureHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    postureName: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, letterSpacing: 1.2 },
    postureHint: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur },
    postureDesc: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, marginTop: 3, textTransform: 'uppercase' },
    postureFlavor: { fontFamily: FONTS.serifItalic, fontSize: 13, color: AXM.bone, marginTop: 4 },
    card: {
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 12,
    },
    cardTitle: {
        fontFamily: FONTS.gothic,
        fontSize: 22,
        lineHeight: 26,
        color: AXM.parchment,
        marginBottom: 6,
    },
    roll: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur, marginVertical: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    chip: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.parchment,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    keepsake: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.sulfur,
        marginTop: 6,
    },
    keepsakeBox: { marginTop: 4 },
    optionRow: {
        borderWidth: 2,
        borderColor: AXM.bone,
        padding: 10,
        marginTop: 8,
        backgroundColor: AXM.bg,
    },
    optionLabel: { fontFamily: FONTS.gothic, fontSize: 17, color: AXM.parchment, letterSpacing: 1.2 },
    optionDesc: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    bigButton: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        marginTop: 12,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2, color: AXM.sulfur },
    abandon: { alignSelf: 'center', marginTop: 18, padding: 6 },
    abandonText: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 2, color: AXM.bone },
}));
