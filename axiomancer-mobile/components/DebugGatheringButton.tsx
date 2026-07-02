/**
 * Dev-only manual gathering trigger. Gathering map events fire "The
 * Gleaning" organically, but tuning and visual work need an immediate
 * entry: tap → `actions.beginGathering()` → `<GatheringGate>` routes
 * to `/gathering`. Renders null outside dev builds.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugGatheringButton() {
    const styles = useStyles();
    const actions = useGameActions();

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        actions.beginGathering();
        // <GatheringGate> observes the slice and pushes /gathering.
    };

    const onTutorial = () => {
        // The pinned tutorial session (seed + site). The coach only
        // shows while the done-flag is unset — once it is set, this is
        // still useful as a reproducible session for layout work.
        actions.beginGathering({ tutorial: true });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · GATHERING</Text>
                <Text style={styles.sub}>start the gleaning minigame</Text>
            </View>
            <Pressable
                style={[styles.button, styles.tutorialButton]}
                onPress={onTutorial}
                accessibilityRole="button"
                accessibilityLabel="Start the gathering tutorial session"
                testID="debug-gathering-tutorial-button"
            >
                <Text style={[styles.buttonLabel, styles.tutorialLabel]}>TUTORIAL</Text>
            </Pressable>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Start a debug gathering minigame"
                testID="debug-gathering-button"
            >
                <Text style={styles.buttonLabel}>GO GLEANING</Text>
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
        borderColor: '#86a821',
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(134,168,33,0.08)',
    },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: '#86a821' },
    tutorialButton: { borderColor: AXM.sulfur, backgroundColor: AXM.sulfurSubtle, marginRight: 6 },
    tutorialLabel: { color: AXM.sulfur },
}));
