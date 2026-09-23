/**
 * SELF-tab affordance that opens `/settings` — replaces the inline COLOUR
 * THEME picker that used to sit at the bottom of the SELF sheet (the theme
 * moved into SETTINGS with the rest of the player preferences, owner call
 * 2026-09-23). Player-facing: not gated behind dev tools.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useRouter } from '@/lib/platform/router';
import { MAIN_MENU_COPY } from '@/state/presenters/main-menu.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function SettingsLink() {
    const styles = useStyles();
    const router = useRouter();
    return (
        <Pressable
            style={styles.root}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            accessibilityHint={MAIN_MENU_COPY.settingsHint}
            testID="self-settings-link"
        >
            <View style={styles.text}>
                <Text style={styles.label}>{MAIN_MENU_COPY.settings}</Text>
                <Text style={styles.sub}>{MAIN_MENU_COPY.settingsHint}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </Pressable>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        marginTop: 16,
        marginHorizontal: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: AXM.divider,
        backgroundColor: AXM.panelBg,
    },
    text: { flex: 1 },
    label: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.parchment },
    sub: { fontFamily: FONTS.serifItalic, fontSize: 10, color: AXM.bone, marginTop: 2 },
    chevron: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.bone },
}));
