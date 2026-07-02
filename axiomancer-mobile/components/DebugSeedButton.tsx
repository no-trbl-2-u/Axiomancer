/**
 * Dev-only debug seed button (Phase 54).
 *
 * Press to fire `actions.debugSeed()` — adds representative items
 * across categories, teaches a handful of fixture skills, and
 * resets the current map back to its starting state. Renders null
 * in production builds (`__DEV__` is false).
 *
 * Mounted alongside `<AestheticDevToggle>` on the SELF tab so the
 * two dev affordances live in one place. Pattern mirrors the
 * aesthetic toggle exactly: dashed ash border, sulfur accent,
 * mono register on labels.
 *
 * User-requested via `/oversight` 2026-05-19: "Could I add a
 * 'debug' button that makes my character have a few items from
 * each category and a few skills that also resets the current
 * map? I want to make sure I'm able to test items and combat."
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugSeedButton() {
    const styles = useStyles();
    const actions = useGameActions();
    const [lastResult, setLastResult] = useState<string | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onPress = () => {
        const result = actions.debugSeed();
        setLastResult(
            `seeded · ${result.itemsAdded} items · ${result.skillsLearned} skills · map ${result.mapReset ? 'reset' : 'unchanged'}`,
        );
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · SEED</Text>
                <Text style={styles.sub}>
                    {lastResult ?? 'items + skills + map reset'}
                </Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Seed debug items, skills, and reset the current map"
                testID="debug-seed-button"
            >
                <Text style={styles.buttonLabel}>SEED</Text>
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
