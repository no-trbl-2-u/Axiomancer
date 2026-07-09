/**
 * The Reliquary — tutorial coach overlay (mobile UI layer only; no
 * rules).
 *
 * A bottom-docked banner that walks the guided first delve through the
 * script in `tutorial-steps.ts`. Progression is stateless — the current
 * step is derived from the live session every render — so the coach
 * never argues with a player who runs ahead. SKIP is always available
 * and marks the tutorial done; finishing the script fires the same
 * completion (the parent owns the dispatch).
 *
 * Unlike the Hazard coach, the cache screen has no full-screen overlay
 * phases — intro, the result card, and the ledger all render inline in
 * the same scroll view (see `app/cache/index.tsx`) — so this banner
 * renders across every phase, same as Rest's and Gathering's coaches.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { CacheVM } from '@/state/presenters/cache.engine';
import type { LootCacheSession } from '@mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { CACHE_TUTORIAL_STEPS, currentTutorialStep } from './tutorial-steps';

export function CacheTutorialCoach({
    session,
    vm,
    onSkip,
}: {
    session: LootCacheSession;
    vm: CacheVM;
    onSkip: () => void;
}) {
    const styles = useStyles();
    const index = currentTutorialStep(session, vm);
    if (index < 0) return null;
    const step = CACHE_TUTORIAL_STEPS[index];

    return (
        <Animated.View
            key={step.id}
            entering={FadeInDown.duration(240)}
            style={styles.root}
            pointerEvents="box-none"
            testID="cache-tutorial"
        >
            <View style={styles.banner}>
                <View style={styles.headerRow}>
                    <Text style={styles.eyebrow}>
                        THE FIRST DELVE · {index + 1} / {CACHE_TUTORIAL_STEPS.length}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Skip the tutorial"
                        testID="cache-tutorial-skip"
                        onPress={onSkip}
                        style={styles.skip}
                    >
                        <Text style={styles.skipText}>SKIP ✕</Text>
                    </Pressable>
                </View>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.body}>{step.body}</Text>
                <Text style={styles.lookFor}>✦ find: {step.lookFor}</Text>
            </View>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        zIndex: 55,
        paddingHorizontal: 10,
        paddingBottom: 8,
    },
    banner: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        backgroundColor: 'rgba(10, 10, 7, 0.96)',
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.sulfur },
    skip: { borderWidth: 1, borderColor: AXM.ash, paddingHorizontal: 8, paddingVertical: 2 },
    skipText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bone },
    title: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 0.5, color: AXM.parchment, marginTop: 5 },
    body: { fontFamily: FONTS.serif, fontSize: 13, lineHeight: 17, color: AXM.bone, marginTop: 3 },
    lookFor: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, color: AXM.sulfur, marginTop: 6 },
}));
