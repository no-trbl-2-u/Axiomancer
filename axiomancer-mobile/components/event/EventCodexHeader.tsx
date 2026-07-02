/**
 * Codex header strip — Phase 50 tick C.
 *
 * Two-token mono strip that sits at the top of an event modal when
 * `useAesthetic()` returns `'codex'`. Left side gets blood accent
 * (matches the design source's ENC token); right side gets bone.
 *
 * Pure display — the strip's content comes from
 * `selectEventCodexHeader(vm)`. The hosting component (currently
 * `EncounterModalOverlay`) decides whether to mount.
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function EventCodex` header row.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface EventCodexHeaderProps {
    left: string;
    right: string;
}

export function EventCodexHeader({ left, right }: EventCodexHeaderProps) {
    const styles = useStyles();
    return (
        <View style={styles.row} accessibilityRole="header">
            <Text style={styles.leftText}>{left}</Text>
            <Text style={styles.rightText}>{right}</Text>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: AXM.deepBg,
        borderBottomWidth: 1,
        borderBottomColor: AXM.parchment,
    },
    leftText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.blood,
    },
    rightText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: AXM.bone,
    },
}));
