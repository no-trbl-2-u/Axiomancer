/**
 * Hazard-pattern combat — tutorial coach overlay (mobile UI layer only; no rules).
 *
 * A bottom-docked banner that walks the guided first fight through the script in
 * `combat-tutorial-steps.ts`. A direct sibling of the gathering `TutorialCoach`:
 * progression is stateless — the current step is derived from the live encounter
 * every render — so the coach never argues with a player who runs ahead. SKIP is
 * always available and ends the tutorial; finishing the script fires the same
 * completion (the parent owns the dispatch).
 *
 * It sits above the board's fixed dock (the SCRAP / hand / END PHASE row, 150px
 * tall) and is `pointerEvents="box-none"`, so it never covers or blocks the
 * controls it is pointing the player at.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { CombatEncounterState } from 'axiomancer-mechanics';
import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { COMBAT_TUTORIAL_STEPS, currentCombatTutorialStep } from './combat-tutorial-steps';

export function CombatTutorialCoach({
    state,
    vm,
    onSkip,
}: {
    state: CombatEncounterState;
    vm: CombatViewModel;
    onSkip: () => void;
}) {
    const styles = useStyles();
    const index = currentCombatTutorialStep(state, vm);
    if (index < 0) return null;
    const step = COMBAT_TUTORIAL_STEPS[index];

    return (
        <Animated.View
            key={step.id}
            entering={FadeInDown.duration(240)}
            style={styles.root}
            pointerEvents="box-none"
            testID="combat-tutorial"
        >
            <View style={styles.banner}>
                <View style={styles.headerRow}>
                    <Text style={styles.eyebrow}>
                        ⚔ FIRST FIGHT · {index + 1} / {COMBAT_TUTORIAL_STEPS.length}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Skip the combat tutorial"
                        testID="combat-tutorial-skip"
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
        // Sits above the board's fixed dock (SCRAP / hand / END PHASE, 150px)
        // so the coach never covers the controls it is pointing the player at.
        bottom: 158,
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
