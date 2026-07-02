/**
 * Gathering minigame overlays: the reprisal flash (the site answers),
 * the Communion/Laden/Despoiled/Routed outcome screen, and the
 * tap-to-read plot detail with keyword call-outs.
 *
 * (The spoils ledger lives in `SpoilsOverlay.tsx`.)
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import type {
    GatherOutcomeVM,
    GatherPlotVM,
    GatherReprisalFlashVM,
} from '@/state/presenters/gathering.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { PlotCard } from './PlotCard';
import { WrathEye } from './glyphs';

// ---------------------------------------------------------------------------
// Reprisal flash — the site answers a crossing.
// ---------------------------------------------------------------------------

function ReprisalEye({ eruption, veiled }: { eruption: boolean; veiled: boolean }) {
    const AXM = usePalette();
    const t = useSharedValue(0);
    useEffect(() => {
        t.value = withSequence(
            withTiming(0.6, { duration: 260, easing: Easing.in(Easing.quad) }),
            withSpring(1, { damping: 7, stiffness: 220 }),
        );
        Haptics.impactAsync(
            eruption
                ? Haptics.ImpactFeedbackStyle.Heavy
                : veiled
                  ? Haptics.ImpactFeedbackStyle.Light
                  : Haptics.ImpactFeedbackStyle.Medium,
        ).catch(() => undefined);
    }, [t, eruption, veiled]);
    const style = useAnimatedStyle(() => {
        const v = t.value;
        return { opacity: Math.min(1, v * 2), transform: [{ scale: 2 - v }] };
    });
    return (
        <Animated.View style={style}>
            <WrathEye
                open={veiled ? 0.1 : 1}
                size={120}
                color={veiled ? AXM.bone : AXM.blood}
            />
        </Animated.View>
    );
}

export function ReprisalOverlay({
    flash,
    onDone,
}: {
    flash: GatherReprisalFlashVM;
    onDone: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const accent = flash.eruption ? AXM.blood : flash.veiled ? AXM.bone : '#d08a5a';
    return (
        <Pressable style={styles.flashRoot} onPress={onDone} testID="gathering-reprisal">
            <Text style={styles.flashEyebrow}>
                {flash.eruption ? 'THE METER FILLS' : flash.veiled ? 'A LINE WAS CROSSED' : 'THE SITE ANSWERS'}
            </Text>
            <View style={{ marginVertical: 16 }}>
                <ReprisalEye eruption={flash.eruption} veiled={flash.veiled} />
            </View>
            <Text style={[styles.flashName, { color: accent }]}>{flash.name}</Text>
            <Text style={styles.flashDesc}>{flash.desc}</Text>
            {flash.detail !== null && (
                <Animated.View entering={FadeIn.delay(420)} style={[styles.flashDetail, { borderColor: accent }]}>
                    <Text style={[styles.flashDetailText, { color: accent }]}>{flash.detail}</Text>
                </Animated.View>
            )}
            <Text style={styles.tapToContinue}>TAP TO CONTINUE</Text>
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// Outcome — Communion / Laden / Despoiled / Routed
// ---------------------------------------------------------------------------

export function GatheringOutcomeOverlay({
    outcome,
    onContinue,
}: {
    outcome: GatherOutcomeVM;
    onContinue: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const color =
        outcome.tier === 'communion'
            ? AXM.sulfur
            : outcome.tier === 'laden'
              ? AXM.parchment
              : outcome.tier === 'despoiled'
                ? '#c98a3b'
                : AXM.blood;
    useEffect(() => {
        Haptics.notificationAsync(
            outcome.tier === 'routed'
                ? Haptics.NotificationFeedbackType.Error
                : outcome.tier === 'despoiled'
                  ? Haptics.NotificationFeedbackType.Warning
                  : Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
    }, [outcome.tier]);
    return (
        <Animated.View entering={FadeIn.duration(260)} style={styles.outcomeRoot} testID="gathering-outcome">
            <Animated.View entering={FadeIn.delay(150).duration(400)}>
                <WrathEye
                    open={outcome.tier === 'routed' ? 1 : outcome.tier === 'communion' ? 0.05 : 0.35}
                    size={64}
                    color={color}
                />
            </Animated.View>
            <Animated.Text entering={FadeIn.delay(450).duration(280)} style={[styles.outcomeWord, { color }]}>
                {outcome.word}
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(650)} style={styles.outcomeSub}>
                {outcome.sub}
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(800)} style={styles.outcomeLine}>
                “{outcome.line}”
            </Animated.Text>
            <Animated.View entering={FadeIn.delay(950)}>
                <Pressable
                    onPress={onContinue}
                    accessibilityRole="button"
                    testID="gathering-outcome-continue"
                    style={[styles.outcomeCta, { borderColor: color }]}
                >
                    <Text style={[styles.outcomeCtaText, { color }]}>{outcome.ctaLabel}</Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

// ---------------------------------------------------------------------------
// Plot detail — keyword call-outs + the readable card + TAKE/TEND.
// ---------------------------------------------------------------------------

export function PlotDetailOverlay({
    plot,
    onTake,
    onClose,
}: {
    plot: GatherPlotVM;
    onTake: (uid: string) => void;
    onClose: () => void;
}) {
    const styles = useStyles();
    return (
        <Pressable style={styles.detailRoot} onPress={onClose} testID="gathering-plot-detail">
            <View style={{ paddingTop: 14, paddingHorizontal: 14 }}>
                {plot.keywords.map((kw) => (
                    <View key={kw.id} style={styles.keyword}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <Text style={styles.keywordName}>{kw.name}</Text>
                            <Text style={styles.keywordTag}>KEYWORD</Text>
                        </View>
                        <Text style={styles.keywordDesc}>{kw.desc}</Text>
                    </View>
                ))}
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View entering={FadeIn.duration(180)}>
                    <PlotCard plot={plot} mode="detail" />
                </Animated.View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={plot.isBreath ? `Tend ${plot.name}` : `Take ${plot.name}`}
                    testID="gathering-detail-take"
                    onPress={(e) => {
                        // Nested pressables don't bubble on native, but the
                        // web target does — stop it from also closing-and-
                        // reopening through the backdrop press.
                        e?.stopPropagation?.();
                        onTake(plot.uid);
                    }}
                    style={styles.detailTake}
                >
                    <Text style={styles.detailTakeText}>{plot.isBreath ? 'TEND IT ›' : 'TAKE IT ›'}</Text>
                </Pressable>
            </View>
            <Text style={[styles.tapToContinue, { paddingBottom: 12 }]}>TAP ANYWHERE ELSE TO CLOSE</Text>
        </Pressable>
    );
}

const useStyles = makeStyles((AXM) => ({
    flashRoot: { ...StyleSheet.absoluteFillObject, zIndex: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,4,2,0.94)', paddingHorizontal: 28 },
    flashEyebrow: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 2, color: AXM.bone },
    flashName: { fontFamily: FONTS.gothic, fontSize: 30, letterSpacing: 2, textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 },
    flashDesc: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.parchment, marginTop: 10, textAlign: 'center', lineHeight: 18, maxWidth: 300 },
    flashDetail: { marginTop: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.5)' },
    flashDetailText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1 },
    tapToContinue: { marginTop: 22, fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone, letterSpacing: 1.5, textAlign: 'center' },

    outcomeRoot: { ...StyleSheet.absoluteFillObject, zIndex: 60, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(4,5,3,0.97)' },
    outcomeWord: { fontFamily: FONTS.gothic, fontSize: 52, letterSpacing: 3, lineHeight: 56, marginTop: 14, textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
    outcomeSub: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 2, color: AXM.bone, marginTop: 10, textAlign: 'center' },
    outcomeLine: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.parchment, marginTop: 16, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
    outcomeCta: { marginTop: 30, paddingHorizontal: 28, paddingVertical: 11, borderWidth: 2, backgroundColor: AXM.bg },
    outcomeCtaText: { fontFamily: FONTS.gothic, fontSize: 17, letterSpacing: 2.5 },

    detailRoot: { ...StyleSheet.absoluteFillObject, zIndex: 62, backgroundColor: 'rgba(4,5,3,0.96)' },
    keyword: { paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(9,10,7,0.95)', borderWidth: 1, borderColor: AXM.ash, marginBottom: 6 },
    keywordName: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 1, color: AXM.sulfur },
    keywordTag: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.bone },
    keywordDesc: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment, lineHeight: 18, marginTop: 3 },
    detailTake: { marginTop: 14, borderWidth: 2, borderColor: '#86a821', paddingHorizontal: 30, paddingVertical: 9, backgroundColor: 'rgba(134,168,33,0.1)' },
    detailTakeText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2, color: '#86a821' },
}));
