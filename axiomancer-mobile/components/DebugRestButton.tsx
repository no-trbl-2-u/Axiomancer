/**
 * Dev-only manual rest trigger. Rest map events fire "The Night Watch"
 * organically, but tuning and visual work need an immediate entry: tap
 * → `actions.beginRest()` → `<RestGate>` routes to `/rest`. Renders
 * null outside dev builds.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugRestButton() {
    const styles = useStyles();
    const actions = useGameActions();

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        actions.beginRest();
        // <RestGate> observes the slice and pushes /rest.
    };

    const onTutorial = () => {
        // The pinned tutorial session (seed 41). The coach only shows
        // while the done-flag is unset — once it is set, this is still
        // useful as a reproducible session for layout work.
        actions.beginRest({ tutorial: true });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · REST</Text>
                <Text style={styles.sub}>start the night watch minigame</Text>
            </View>
            <Pressable
                style={[styles.button, styles.tutorialButton]}
                onPress={onTutorial}
                accessibilityRole="button"
                accessibilityLabel="Start the rest tutorial session"
                testID="debug-rest-tutorial-button"
            >
                <Text style={[styles.buttonLabel, styles.tutorialLabel]}>TUTORIAL</Text>
            </Pressable>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Start a debug rest minigame"
                testID="debug-rest-button"
            >
                <Text style={styles.buttonLabel}>GO REST</Text>
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
