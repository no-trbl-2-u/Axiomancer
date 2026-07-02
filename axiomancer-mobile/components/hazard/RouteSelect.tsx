/**
 * Hazard reveal + route selection. Stacked full-width route panels
 * (vertical per the design brief — side-by-side is explicitly out),
 * each physically distinct: Safe is bone-and-weave, Risk is acid with
 * cracks. The opening hand is visible above the choice so the player
 * commits with information — but no dice exist yet.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import type { HazardRouteChoiceVM, HazardViewModel } from '@/state/presenters/hazard.engine';
import type { HazardRouteKey } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { HazardCard } from './HazardCard';
import { Cracks, ProgGlyph } from './glyphs';
import { HZ, routeAccent, TYPE_ACCENT } from './palette';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function LadderRow({
    accent,
    values,
    label,
    glyph,
}: {
    accent: string;
    values: number[];
    label: string;
    glyph: 'force' | 'escape' | 'passage';
}) {
    const styles = useStyles();
    return (
        <View style={styles.ladderRow}>
            <View style={styles.ladderLabel}>
                <ProgGlyph kind={glyph} size={12} color={accent} />
                <Text style={[styles.ladderLabelText, { color: accent }]}>{label}</Text>
            </View>
            <View style={styles.ladderCells}>
                {values.map((n, i) => (
                    <View key={i} style={styles.ladderCell}>
                        <Text style={styles.ladderRound}>R{ROMAN[i]} </Text>
                        <Text style={[styles.ladderValue, { color: accent }]}>{n}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function RoutePanel({
    route,
    onPick,
}: {
    route: HazardRouteChoiceVM;
    onPick: (key: HazardRouteKey) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const safe = route.key === 'safe';
    const accent = routeAccent(AXM)[route.key];
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${route.name}. ${route.badge}. ${route.description}`}
            testID={`hazard-route-${route.key}`}
            onPress={() => onPick(route.key)}
            style={[
                styles.routePanel,
                {
                    borderColor: safe ? AXM.ash : accent,
                    backgroundColor: safe ? '#17150f' : '#12110b',
                },
            ]}
        >
            {!safe && <Cracks seed={4} opacity={0.4} />}
            <View style={styles.routeTop}>
                <View>
                    <Text
                        style={[
                            styles.badge,
                            { backgroundColor: route.badgeTone === 'sulfur' ? AXM.sulfur : AXM.bone },
                        ]}
                    >
                        {route.badge}
                    </Text>
                    <Text style={styles.routeName}>{route.name}</Text>
                </View>
                <View style={styles.reqChips}>
                    {route.ladder.map((row) => (
                        <View key={row.key} style={[styles.reqChip, { borderColor: TYPE_ACCENT[row.key] }]}>
                            <ProgGlyph kind={row.key} size={16} color={TYPE_ACCENT[row.key]} />
                            <Text style={[styles.reqChipText, { color: TYPE_ACCENT[row.key] }]}>
                                {row.key === 'passage' ? 'PASSAGE' : row.key.toUpperCase()}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <Text style={styles.routeDesc}>{route.description}</Text>

            <Text style={styles.eyebrow}>THRESHOLD · PER ROUND{route.dual ? ' · BOTH REQUIRED' : ''}</Text>
            <View style={{ gap: 4 }}>
                {route.ladder.map((row) => (
                    <LadderRow
                        key={row.key}
                        accent={row.key === 'passage' ? accent : TYPE_ACCENT[row.key]}
                        values={row.values}
                        label={row.label}
                        glyph={row.key}
                    />
                ))}
            </View>

            <View style={styles.chipsRow}>
                <View style={[styles.rewardChip, { borderColor: safe ? AXM.bone : HZ.gold, backgroundColor: safe ? 'transparent' : 'rgba(194,161,78,0.08)' }]}>
                    <Text style={[styles.chipLabel, { color: safe ? AXM.bone : HZ.gold }]}>REWARD</Text>
                    <Text style={styles.chipValue}>{route.rewardLabel}</Text>
                </View>
                <View style={[styles.failChip, { borderColor: safe ? '#7a3a3a' : AXM.blood }]}>
                    <Text style={[styles.chipLabel, { color: safe ? '#a85a5a' : AXM.blood }]}>FAIL</Text>
                    <Text style={styles.chipValueMono}>{route.penaltyLabel}</Text>
                </View>
            </View>

            <View
                style={[
                    styles.cta,
                    {
                        borderColor: safe ? AXM.parchment : accent,
                        backgroundColor: safe ? AXM.bg : `${accent}1f`,
                    },
                ]}
            >
                <Text style={[styles.ctaText, { color: safe ? AXM.parchment : accent }]}>{route.ctaLabel}</Text>
            </View>
        </Pressable>
    );
}

export function RouteSelect({
    vm,
    onPick,
}: {
    vm: HazardViewModel;
    onPick: (key: HazardRouteKey) => void;
}) {
    const styles = useStyles();
    return (
        <Animated.View entering={FadeIn.duration(220)} style={styles.root} testID="hazard-route-select">
            <View style={styles.topStrip}>
                <Text style={styles.topStripSide}>◆ HAZARD</Text>
                <Text style={styles.topStripMid}>NO RETREAT — CHOOSE TO PROCEED</Text>
                <Text style={styles.topStripSide}>◆</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.header}>
                    <Text style={styles.headerEyebrow}>✠ HAZARD · {vm.totalRounds} ROUNDS</Text>
                    <Text style={styles.title}>{vm.title}</Text>
                    <Text style={styles.scenario}>{vm.scenario}</Text>
                </Animated.View>

                {/* opening hand preview — fanned, non-interactive */}
                <Animated.View entering={FadeInUp.delay(160).duration(320)}>
                    <Text style={styles.handLabel}>YOUR HAND — CHOOSE YOUR ROUTE WITH THESE</Text>
                    <View style={styles.handPreview} testID="hazard-opening-hand">
                        {vm.hand.map((card, i) => {
                            const n = vm.hand.length;
                            const mid = (n - 1) / 2;
                            return (
                                <Animated.View
                                    key={card.uid}
                                    entering={FadeInUp.delay(220 + i * 70).duration(280)}
                                    style={{
                                        marginLeft: i === 0 ? 0 : -32,
                                        zIndex: i,
                                        transform: [
                                            { translateY: Math.abs(i - mid) * 6 },
                                            { rotate: `${(i - mid) * 5}deg` },
                                        ],
                                    }}
                                >
                                    <HazardCard card={card} mode="hand" />
                                </Animated.View>
                            );
                        })}
                    </View>
                </Animated.View>

                <Text style={styles.chooseLabel}>✠ CHOOSE YOUR ROUTE</Text>
                <View style={{ gap: 10, paddingHorizontal: 12 }}>
                    {vm.routeChoices.map((route, i) => (
                        <Animated.View key={route.key} entering={FadeInUp.delay(320 + i * 120).duration(320)}>
                            <RoutePanel route={route} onPick={onPick} />
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0b0a08', zIndex: 50 },
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
    topStripSide: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.blood, letterSpacing: 2 },
    topStripMid: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 2 },
    header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: AXM.ash },
    headerEyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.blood },
    title: { fontFamily: FONTS.gothic, fontSize: 28, lineHeight: 29, color: AXM.parchment, letterSpacing: 0.5, marginTop: 6, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
    scenario: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, marginTop: 5, lineHeight: 17 },
    handLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bone, textAlign: 'center', marginTop: 12 },
    handPreview: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 10, paddingBottom: 16, minHeight: 140 },
    chooseLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.parchment, textAlign: 'center', marginVertical: 8 },
    routePanel: { borderWidth: 2, padding: 13, overflow: 'hidden' },
    routeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge: { alignSelf: 'flex-start', fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bg, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
    routeName: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 25, color: AXM.parchment, letterSpacing: 0.5, marginTop: 7 },
    reqChips: { flexDirection: 'row', gap: 6 },
    reqChip: { alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    reqChipText: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.8 },
    routeDesc: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.bone, lineHeight: 18, marginTop: 7 },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.bone, marginTop: 10, marginBottom: 4 },
    ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ladderLabel: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 46 },
    ladderLabelText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6 },
    ladderCells: { flexDirection: 'row', gap: 4, flex: 1 },
    ladderCell: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 3, borderWidth: 1, borderColor: AXM.ash, backgroundColor: 'rgba(0,0,0,0.35)' },
    ladderRound: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone },
    ladderValue: { fontFamily: FONTS.gothic, fontSize: 15, lineHeight: 16 },
    chipsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    rewardChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1 },
    failChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, backgroundColor: 'rgba(122,58,58,0.1)' },
    chipLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1 },
    chipValue: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, flexShrink: 1 },
    chipValueMono: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.parchment },
    cta: { marginTop: 11, paddingVertical: 9, alignItems: 'center', borderWidth: 2 },
    ctaText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1.5 },
}));
