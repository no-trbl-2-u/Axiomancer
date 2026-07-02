/**
 * Hazard danger-intro overlay — the first thing the player sees when a
 * hazard triggers (map event or dev entry). A sealed, non-dismissible
 * panel: the danger's title, a grim vignette, and intro copy that ends
 * on the player's only out. The single CTA hands off to route select.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { DangerArt } from './danger-art';

export interface HazardIntroOverlayProps {
    hazardId: string;
    title: string;
    intro: string;
    onContinue: () => void;
}

export function HazardIntroOverlay({ hazardId, title, intro, onContinue }: HazardIntroOverlayProps) {
    const styles = useStyles();
    const { width } = useWindowDimensions();
    const artWidth = Math.min(width - 56, 320);
    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }, []);
    return (
        <Animated.View entering={FadeIn.duration(220)} style={styles.root} testID="hazard-intro-overlay">
            <Animated.View entering={FadeInDown.duration(320)} style={styles.panel}>
                <Text style={styles.eyebrow}>☠ DANGER</Text>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.artFrame}>
                    <DangerArt hazardId={hazardId} width={artWidth} height={artWidth / 2} />
                </View>
                <Text style={styles.intro}>{intro}</Text>
                <Pressable
                    onPress={onContinue}
                    accessibilityRole="button"
                    accessibilityLabel="Face the danger — choose your route"
                    testID="hazard-intro-continue"
                    style={styles.cta}
                >
                    <Text style={styles.ctaText}>FACE IT ›</Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 60,
        backgroundColor: 'rgba(6,5,4,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    panel: {
        width: '100%',
        maxWidth: 360,
        borderWidth: 2,
        borderColor: AXM.blood,
        backgroundColor: '#100d0a',
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 3,
        color: AXM.blood,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 27,
        color: AXM.parchment,
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 6,
    },
    artFrame: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: AXM.ash,
        overflow: 'hidden',
    },
    intro: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 13,
        lineHeight: 19,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 14,
    },
    cta: {
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: AXM.blood,
        backgroundColor: 'rgba(122,24,24,0.18)',
        paddingVertical: 10,
        paddingHorizontal: 28,
    },
    ctaText: {
        fontFamily: FONTS.gothic,
        fontSize: 16,
        letterSpacing: 2,
        color: AXM.parchment,
    },
}));
