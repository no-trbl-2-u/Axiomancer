/**
 * Dev-only launcher for THE APORIA (W-01 labyrinth continent).
 *
 * Navigates to the self-contained `/labyrinth` route (act select →
 * room scenes). Dev-menu entry ONLY per T's rule — no exploration-tab
 * presence, no story wiring. Renders null in production.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from '@/lib/platform/router';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugAporiaButton() {
    const styles = useStyles();
    const router = useRouter();

    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · THE APORIA</Text>
                <Text style={styles.sub}>the labyrinth continent, three acts</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={() => router.push('/labyrinth' as never)}
                accessibilityRole="button"
                accessibilityLabel="Open THE APORIA labyrinth"
                testID="debug-aporia-button"
            >
                <Text style={styles.buttonLabel}>DESCEND</Text>
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
