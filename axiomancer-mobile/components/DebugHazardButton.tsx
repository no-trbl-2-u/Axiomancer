/**
 * Dev-only manual hazard trigger. Hazard map events fire the v2
 * minigame organically, but tuning and visual work need an immediate
 * entry: tap → `actions.beginHazard()` → `<HazardGate>` routes to
 * `/hazard`. Renders null outside dev builds.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugHazardButton() {
    const styles = useStyles();
    const actions = useGameActions();

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        actions.beginHazard();
        // <HazardGate> observes the slice and pushes /hazard.
    };

    const onTutorial = () => {
        // The pinned tutorial session (seed + hazard). The coach only
        // shows while the done-flag is unset — once it is set, this is
        // still useful as a reproducible session for layout work.
        actions.beginHazard({ tutorial: true });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · HAZARD</Text>
                <Text style={styles.sub}>start the hazard minigame</Text>
            </View>
            <Pressable
                style={[styles.button, styles.tutorialButton]}
                onPress={onTutorial}
                accessibilityRole="button"
                accessibilityLabel="Start the hazard tutorial session"
                testID="debug-hazard-tutorial-button"
            >
                <Text style={[styles.buttonLabel, styles.tutorialLabel]}>TUTORIAL</Text>
            </Pressable>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Start a debug hazard minigame"
                testID="debug-hazard-button"
            >
                <Text style={styles.buttonLabel}>BRAVE IT</Text>
            </Pressable>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
    },
    labelCol: { flex: 1 },
    label: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, marginTop: 2 },
    button: {
        borderWidth: 1,
        borderColor: AXM.rust,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.rustSubtle,
    },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: AXM.rust },
    tutorialButton: { borderColor: AXM.sulfur, backgroundColor: AXM.sulfurSubtle, marginRight: 6 },
    tutorialLabel: { color: AXM.sulfur },
}));
