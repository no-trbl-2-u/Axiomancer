/**
 * Dev-only manual triggers for the Phase 137 encounters: the Quest
 * Board ("The Boy's Almanac"), the Rest night ("The Night Watch"),
 * and the Loot Cache ("The Reliquary"). Map events fire these
 * organically; tuning and visual work need immediate entries. Each
 * tap starts a session — the matching Gate routes to the screen.
 * Renders null outside dev builds.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

function DebugRow({
    label,
    sub,
    buttonLabel,
    onPress,
    testID,
}: {
    label: string;
    sub: string;
    buttonLabel: string;
    onPress: () => void;
    testID: string;
}) {
    const styles = useStyles();
    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.sub}>{sub}</Text>
            </View>
            <Pressable
                style={styles.button}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={buttonLabel}
                testID={testID}
            >
                <Text style={styles.buttonLabel}>{buttonLabel}</Text>
            </Pressable>
        </View>
    );
}

function DebugCacheRow() {
    const styles = useStyles();
    const actions = useGameActions();

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · LOOT CACHE</Text>
                <Text style={styles.sub}>start the reliquary (10 shillings seeded)</Text>
            </View>
            <Pressable
                style={[styles.button, styles.tutorialButton]}
                onPress={() => actions.beginLootCache({ tutorial: true })}
                accessibilityRole="button"
                accessibilityLabel="Start the loot-cache tutorial session"
                testID="debug-cache-tutorial-button"
            >
                <Text style={[styles.buttonLabel, styles.tutorialLabel]}>TUTORIAL</Text>
            </Pressable>
            <Pressable
                style={styles.button}
                onPress={() => actions.beginLootCache({ currency: 10 })}
                accessibilityRole="button"
                accessibilityLabel="Start a debug loot-cache encounter"
                testID="debug-cache-button"
            >
                <Text style={styles.buttonLabel}>DIG</Text>
            </Pressable>
        </View>
    );
}

export function DebugEncounterButtons() {
    const actions = useGameActions();

    if (!isDevToolsEnabled()) return null;

    return (
        <>
            <DebugRow
                label="DEBUG · QUEST BOARD"
                sub="start the build-the-boat board"
                buttonLabel="UNFOLD"
                onPress={() => actions.beginQuestBoard({ boardId: 'build-the-boat' })}
                testID="debug-quest-button"
            />
            <DebugRow
                label="DEBUG · REST"
                sub="start the night watch"
                buttonLabel="MAKE CAMP"
                onPress={() => actions.beginRest()}
                testID="debug-rest-button"
            />
            <DebugCacheRow />
        </>
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
