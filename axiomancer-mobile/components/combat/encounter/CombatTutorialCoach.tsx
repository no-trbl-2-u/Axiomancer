/**
 * Hazard-pattern combat — tutorial coach overlay (mobile UI layer only; no rules).
 *
 * A top-anchored banner that walks the guided first fight through the script in
 * `combat-tutorial-steps.ts`. A direct sibling of the gathering `TutorialCoach`:
 * progression is stateless — the current step is derived from the live encounter
 * (plus the board's staged-card count) every render — so the coach never argues
 * with a player who runs ahead. SKIP is always available and ends the tutorial;
 * finishing the script fires the same completion (the parent owns the dispatch).
 *
 * Placement: directly UNDER the enemy HUD (`topInset + COMBAT_HUD_HEIGHT`), in
 * the band the enemy figure occupies. Nothing the coach points at lives there:
 * the play area, the dice tray, APPLY, the hand and END PHASE all sit in the
 * lower half of the board. The banner is kept compact so it never reaches
 * them. (The previous bottom anchor — copied from the dock height — landed the
 * banner squarely on the dice tray on a phone-sized viewport, so a tap on a die
 * hit the coach instead. The root's `box-none` only lets touches through where
 * there is no child; the banner itself is opaque.)
 */

import React, { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import type { CombatEncounterState } from '@mechanics';
import type { CombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

import { COMBAT_HUD_HEIGHT } from './CombatCombatantPane';
import { COMBAT_TUTORIAL_STEPS, currentCombatTutorialStep } from './combat-tutorial-steps';

/** Breathing room between the HUD's bottom edge and the banner. */
const HUD_GAP = 4;

export function CombatTutorialCoach({
    state,
    vm,
    stagedCount,
    onSkip,
    hudBottom,
}: {
    state: CombatEncounterState;
    vm: CombatViewModel;
    /** Cards currently in the PLAY AREA — the board owns this, not the engine. */
    stagedCount: number;
    onSkip: () => void;
    /** The enemy HUD's measured bottom edge (from `CombatBoard`'s `onHudLayout`),
     *  screen-top-relative. Falls back to `topInset + COMBAT_HUD_HEIGHT` until
     *  the first layout pass lands or when the caller doesn't track it. */
    hudBottom?: number;
}) {
    const styles = useStyles();
    // Null-safe insets (the context is null with no SafeAreaProvider, e.g. in tests).
    const insets = useContext(SafeAreaInsetsContext);
    const topInset = insets?.top ?? 0;
    const anchor = hudBottom ?? (topInset + COMBAT_HUD_HEIGHT);
    const index = currentCombatTutorialStep(state, vm, { stagedCount });
    if (index < 0) return null;
    const step = COMBAT_TUTORIAL_STEPS[index];

    return (
        <Animated.View
            key={step.id}
            entering={FadeInDown.duration(240)}
            style={[styles.root, { top: anchor + HUD_GAP }]}
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
        // `top` is set inline: topInset + COMBAT_HUD_HEIGHT + HUD_GAP, so the
        // banner hangs under the enemy HUD and clear of every control it names.
        zIndex: 55,
        paddingHorizontal: 10,
    },
    banner: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        backgroundColor: 'rgba(10, 10, 7, 0.96)',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.6, color: AXM.sulfur },
    skip: { borderWidth: 1, borderColor: AXM.ash, paddingHorizontal: 8, paddingVertical: 2 },
    skipText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 1.2, color: AXM.bone },
    title: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 0.5, color: AXM.parchment, marginTop: 4 },
    body: { fontFamily: FONTS.serif, fontSize: 12, lineHeight: 16, color: AXM.bone, marginTop: 3 },
    lookFor: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.6, color: AXM.sulfur, marginTop: 5 },
}));
