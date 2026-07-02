/**
 * Site reveal + approach selection. Stacked full-width stance panels
 * (vertical, matching the hazard route brief): GLEAN is bone-and-weave
 * restraint, STRIP is acid-edged greed. The verge spread is visible
 * above the choice so the player commits with information — the first
 * three plots are already face-up.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import type { GatherApproachChoiceVM, GatheringViewModel } from '@/state/presenters/gathering.engine';
import type { GatherApproachKey } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { Roots } from './glyphs';
import { PlotCard } from './PlotCard';
import { approachAccent } from './palette';

function ApproachPanel({
    choice,
    onPick,
}: {
    choice: GatherApproachChoiceVM;
    onPick: (key: GatherApproachKey) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const gentle = choice.key === 'glean';
    const accent = approachAccent(AXM)[choice.key];
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${choice.name}. ${choice.badge}. ${choice.description}`}
            testID={`gathering-approach-${choice.key}`}
            onPress={() => onPick(choice.key)}
            style={[
                styles.panel,
                {
                    borderColor: gentle ? AXM.ash : accent,
                    backgroundColor: gentle ? '#15170f' : '#11130a',
                },
            ]}
        >
            {!gentle && <Roots seed={7} opacity={0.4} />}
            <Text
                style={[
                    styles.badge,
                    { backgroundColor: choice.badgeTone === 'sulfur' ? AXM.sulfur : AXM.bone },
                ]}
            >
                {choice.badge}
            </Text>
            <Text style={styles.panelName}>{choice.name}</Text>
            <Text style={styles.panelDesc}>{choice.description}</Text>

            <View style={styles.chipsRow}>
                <View style={[styles.chip, { borderColor: gentle ? AXM.bone : AXM.sulfur }]}>
                    <Text style={[styles.chipLabel, { color: gentle ? AXM.bone : AXM.sulfur }]}>GAIN</Text>
                    <Text style={styles.chipValue}>{choice.rewardLabel}</Text>
                </View>
                <View style={[styles.chip, { borderColor: '#7a3a3a' }]}>
                    <Text style={[styles.chipLabel, { color: '#a85a5a' }]}>COST</Text>
                    <Text style={styles.chipValue}>{choice.costLabel}</Text>
                </View>
            </View>

            <View
                style={[
                    styles.cta,
                    {
                        borderColor: gentle ? AXM.parchment : accent,
                        backgroundColor: gentle ? AXM.bg : `${accent}1f`,
                    },
                ]}
            >
                <Text style={[styles.ctaText, { color: gentle ? AXM.parchment : accent }]}>{choice.ctaLabel}</Text>
            </View>
        </Pressable>
    );
}

export function ApproachSelect({
    vm,
    onPick,
}: {
    vm: GatheringViewModel;
    onPick: (key: GatherApproachKey) => void;
}) {
    const styles = useStyles();
    return (
        <Animated.View entering={FadeIn.duration(220)} style={styles.root} testID="gathering-approach-select">
            <View style={styles.topStrip}>
                <Text style={styles.topStripSide}>❧ GATHERING</Text>
                <Text style={styles.topStripMid}>CHOOSE HOW YOU TAKE</Text>
                <Text style={styles.topStripSide}>❧</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.header}>
                    <Text style={styles.headerEyebrow}>❧ FORAGE · THREE STRATA</Text>
                    <Text style={styles.title}>{vm.title}</Text>
                    <Text style={styles.scenario}>{vm.scenario}</Text>
                </Animated.View>

                {/* the verge, already face-up */}
                <Animated.View entering={FadeInUp.delay(160).duration(320)}>
                    <Text style={styles.spreadLabel}>
                        {vm.depthName} — ALREADY ON OFFER
                    </Text>
                    <View style={styles.spreadPreview} testID="gathering-opening-spread">
                        {vm.spread.map((plot, i) => (
                            <Animated.View
                                key={plot.uid}
                                entering={FadeInUp.delay(220 + i * 80).duration(280)}
                                style={{ transform: [{ rotate: `${(i - (vm.spread.length - 1) / 2) * 3}deg` }] }}
                            >
                                <PlotCard plot={plot} mode="preview" />
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>

                <Text style={styles.chooseLabel}>❧ HOW MUCH WILL YOU TAKE?</Text>
                <View style={{ gap: 10, paddingHorizontal: 12 }}>
                    {vm.approachChoices.map((choice, i) => (
                        <Animated.View key={choice.key} entering={FadeInUp.delay(320 + i * 120).duration(320)}>
                            <ApproachPanel choice={choice} onPick={onPick} />
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0b07', zIndex: 50 },
    topStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 12,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
    },
    topStripSide: { fontFamily: FONTS.mono, fontSize: 11, color: '#86a821', letterSpacing: 2 },
    topStripMid: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 1.5 },
    header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: AXM.ash },
    headerEyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: '#86a821' },
    title: { fontFamily: FONTS.gothic, fontSize: 28, lineHeight: 29, color: AXM.parchment, letterSpacing: 0.5, marginTop: 6, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
    scenario: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, marginTop: 5, lineHeight: 17 },
    spreadLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bone, textAlign: 'center', marginTop: 12 },
    spreadPreview: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, paddingTop: 10, paddingBottom: 14, minHeight: 130 },
    chooseLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.parchment, textAlign: 'center', marginVertical: 8 },
    panel: { borderWidth: 2, padding: 13, overflow: 'hidden' },
    badge: { alignSelf: 'flex-start', fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bg, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
    panelName: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 25, color: AXM.parchment, letterSpacing: 0.5, marginTop: 7 },
    panelDesc: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.bone, lineHeight: 18, marginTop: 7 },
    chipsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    chip: { flex: 1, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, gap: 1 },
    chipLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1 },
    chipValue: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment },
    cta: { marginTop: 11, paddingVertical: 9, alignItems: 'center', borderWidth: 2 },
    ctaText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1.5 },
}));
