/**
 * Dev-only toggle for the canonical / codex aesthetic mode (Phase 50
 * tick A). Renders **nothing** in production builds (`__DEV__` is
 * false there) — the wider design caveat from
 * `design/handoff-2026-05-16/chats/chat2.md` is that the cold-codex
 * variant is a follow-up direction the user wants to validate before
 * exposing it broadly. Until that decision settles, the toggle lives
 * here as a dev-only affordance.
 *
 * Mounts at the bottom of the SELF tab so dev builds can flip the
 * mode and observe its effect on later ticks (combat / event /
 * exploration codex variants). Tick A wires this entry point; later
 * ticks read `useAesthetic()` to branch chrome.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useAesthetic } from '@/state/aesthetic-mode';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function AestheticDevToggle() {
    const styles = useStyles();
    const { mode, toggle, hydrated } = useAesthetic();

    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>AESTHETIC · DEV</Text>
                <Text style={styles.sub}>
                    {hydrated ? `mode: ${mode}` : 'mode: loading…'}
                </Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={toggle}
                accessibilityRole="button"
                accessibilityLabel={`Toggle aesthetic mode, currently ${mode}`}
            >
                <Text style={styles.buttonLabel}>FLIP</Text>
            </Pressable>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        marginTop: 16,
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
    labelCol: { flexDirection: 'column' },
    label: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    sub: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.parchment,
        marginTop: 2,
    },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.sulfur,
        letterSpacing: 1.5,
    },
}));
