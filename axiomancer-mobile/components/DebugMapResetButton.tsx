/**
 * Dev-only map-reset button (Phase 58, user-direct via
 * /oversight 2026-05-20 13th call).
 *
 * Calls `actions.changeMap(currentMapName)` to re-seed the
 * current map via the engine's
 * `createMapState(getMapDefinition(continent, name))` (Phase
 * 60a migration from the deprecated `getCoastalMap`) — fresh
 * `currentNode`, cleared `discoveredNodes` / `consumedNodes` /
 * `completedNodes`. Map-only escape hatch (vs.
 * `DebugSeedButton` which also touches inventory + skills).
 *
 * Renders null in production.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugMapResetButton() {
    const styles = useStyles();
    const actions = useGameActions();
     
    const currentMapName = useGameState((s) => s.world?.currentMap?.name ?? null);

    if (!isDevToolsEnabled()) return null;
    if (currentMapName === null) return null;

    const onPress = () => {
        actions.changeMap(currentMapName);
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · MAP</Text>
                <Text style={styles.sub}>reset to starting node</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Reset current map to starting node"
                testID="debug-map-reset-button"
            >
                <Text style={styles.buttonLabel}>RESET</Text>
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
        borderColor: AXM.rust,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.rust,
        letterSpacing: 1.5,
    },
}));
