/**
 * Dev-only launcher for the Spec 25 Hazard-Pattern Combat screen.
 *
 * Navigates to the self-contained `/combat-encounter` route (which bootstraps a
 * mock encounter against the current player). Renders null in production —
 * mounts beside the other ENCOUNTER TRIGGERS dev buttons.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugCombatEncounterButton() {
    const styles = useStyles();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · HAZARD COMBAT</Text>
                <Text style={styles.sub}>card-and-dice status combat</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={() => router.push('/combat-encounter' as never)}
                accessibilityRole="button"
                accessibilityLabel="Open the hazard-pattern combat encounter"
                testID="debug-combat-encounter-button"
            >
                <Text style={styles.buttonLabel}>ASSEMBLE</Text>
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
