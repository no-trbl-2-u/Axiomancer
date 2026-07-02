/**
 * Dev button — replay the first-fight combat tutorial.
 *
 * Navigates to the `/combat-encounter` route with `?tutorial=1`, which forces
 * the primer + turn-one coach to run even on a save that has already seen them
 * (the screen normally gates the tutorial behind the `combat-tutorial-done`
 * flag). Renders null in production.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugCombatTutorialButton() {
    const styles = useStyles();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · COMBAT TUTORIAL</Text>
                <Text style={styles.sub}>replay the first-fight primer + coach</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={() => router.push('/combat-encounter?tutorial=1' as never)}
                accessibilityRole="button"
                accessibilityLabel="Replay the hazard-combat tutorial"
                testID="debug-combat-tutorial-button"
            >
                <Text style={styles.buttonLabel}>TEACH</Text>
            </Pressable>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { flexDirection: 'column', flex: 1, paddingRight: 8 },
    label: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, marginTop: 2 },
    button: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: AXM.sulfur, backgroundColor: AXM.bg },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.sulfur, letterSpacing: 1.5 },
}));
