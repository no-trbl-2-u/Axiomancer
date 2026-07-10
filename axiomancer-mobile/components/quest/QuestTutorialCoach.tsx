/**
 * The Quest Board minigame — tutorial coach overlay (mobile UI layer only;
 * no rules).
 *
 * A bottom-docked banner that walks the guided opening loop through the
 * script in `tutorial-steps.ts`. Progression is stateless — the current
 * step is derived from the live session every render — so the coach
 * never argues with a player who runs ahead. SKIP is always available
 * and marks the tutorial done; finishing the script fires the same
 * completion (the parent owns the dispatch).
 *
 * Renders `null` outside `idle` — `intro` / `space` / `dusk` / `outcome`
 * are each a full-screen `Scrim` overlay with its own single-CTA
 * affordance (see `QuestOverlays.tsx`), so there is nothing for the coach
 * to add and no safe z-index slot to add it in. Same discipline as
 * `HazardTutorialCoach`.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { QuestBoardVM } from '@/state/presenters/quest.engine';
import type { QuestBoardSession } from '@mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { QUEST_TUTORIAL_STEPS, currentTutorialStep } from './tutorial-steps';

export function QuestTutorialCoach({
    session,
    vm,
    onSkip,
}: {
    session: QuestBoardSession;
    vm: QuestBoardVM;
    onSkip: () => void;
}) {
    const styles = useStyles();
    if (session.phase !== 'idle') return null;
    const index = currentTutorialStep(session, vm);
    if (index < 0) return null;
    const step = QUEST_TUTORIAL_STEPS[index];

    return (
        <Animated.View
            key={step.id}
            entering={FadeInDown.duration(240)}
            style={styles.root}
            pointerEvents="box-none"
            testID="quest-tutorial"
        >
            <View style={styles.banner}>
                <View style={styles.headerRow}>
                    <Text style={styles.eyebrow}>
                        THE FIRST SESSION · {index + 1} / {QUEST_TUTORIAL_STEPS.length}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Skip the tutorial"
                        testID="quest-tutorial-skip"
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
        // Quest's idle-phase content scrolls (no fixed bottom action bar,
        // like Rest's) — dock at Rest's convention rather than Hazard's
        // raised offset above a pinned hand fan.
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
