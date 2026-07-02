/**
 * Site-reveal modal — shown once per session (keyed by seed) before
 * the approach choice. Hushed where the hazard intro is grim: the
 * place is alive, generous, and keeping count. The eye opens slowly
 * behind the title.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { Roots, WrathEye } from './glyphs';

function SlowEye() {
    const t = useSharedValue(0);
    useEffect(() => {
        t.value = withDelay(500, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }));
    }, [t]);
    const style = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.45 }));
    return (
        <Animated.View style={style}>
            <WrathEye open={0.35} size={84} color="#5a6a3a" />
        </Animated.View>
    );
}

export function GatheringIntroOverlay({
    title,
    intro,
    onContinue,
}: {
    title: string;
    intro: string;
    onContinue: () => void;
}) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID="gathering-intro">
            <Roots seed={11} opacity={0.5} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
                <Animated.View entering={FadeIn.duration(400)}>
                    <SlowEye />
                </Animated.View>
                <Animated.Text entering={FadeIn.delay(250).duration(350)} style={styles.eyebrow}>
                    ❧ A PLACE THAT GIVES — AND COUNTS
                </Animated.Text>
                <Animated.Text entering={FadeIn.delay(420).duration(350)} style={styles.title}>
                    {title}
                </Animated.Text>
                <Animated.Text entering={FadeIn.delay(650).duration(400)} style={styles.intro}>
                    {intro}
                </Animated.Text>
            </View>
            <Animated.View entering={FadeIn.delay(950).duration(300)} style={{ paddingBottom: 36, alignItems: 'center' }}>
                <Pressable
                    onPress={onContinue}
                    accessibilityRole="button"
                    testID="gathering-intro-continue"
                    style={styles.cta}
                >
                    <Text style={styles.ctaText}>APPROACH THE SITE ›</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { ...StyleSheet.absoluteFillObject, zIndex: 70, backgroundColor: '#070906' },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: '#86a821', marginTop: 18 },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 34,
        lineHeight: 36,
        color: AXM.parchment,
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 8,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    intro: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 20,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 16,
        maxWidth: 320,
    },
    cta: { borderWidth: 2, borderColor: AXM.parchment, paddingHorizontal: 26, paddingVertical: 10, backgroundColor: AXM.bg },
    ctaText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2, color: AXM.parchment },
}));
