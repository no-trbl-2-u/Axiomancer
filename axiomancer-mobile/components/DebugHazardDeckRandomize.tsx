/**
 * Dev-only hazard deck controls. The named presets give the Kid deterministic
 * strategy decks: starter baseline, early/late straightforward, early/late
 * enchantment, and early/late utility. The randomizer remains as a chaos pass.
 * Renders null outside dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { HAZARD_DECK_PRESETS, type HazardDeckPresetResult } from '@/state/hazard/store-actions';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugHazardDeckRandomize() {
    const styles = useStyles();
    const actions = useGameActions();
    const [lastGrant, setLastGrant] = useState<string[] | null>(null);
    const [lastPreset, setLastPreset] = useState<HazardDeckPresetResult | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onRandomize = () => {
        setLastPreset(null);
        setLastGrant(actions.randomizeHazardDeck());
    };

    const onPreset = (presetId: HazardDeckPresetResult['presetId']) => {
        const result = actions.applyHazardDeckPreset(presetId);
        setLastGrant(result.cardIds);
        setLastPreset(result);
    };

    const status = lastPreset
        ? `${lastPreset.label}: ${lastPreset.cardIds.length} acquired cards`
        : lastGrant === null
          ? 'choose a preset or random acquired cards from the full pool'
          : `granted: ${lastGrant.join(', ')}`;

    return (
        <View style={styles.panel}>
            <View style={styles.headerRow}>
                <View style={styles.labelCol}>
                    <Text style={styles.label}>DEBUG · HAZARD DECK</Text>
                    <Text style={styles.sub} numberOfLines={2}>{status}</Text>
                </View>
                <Pressable
                    style={styles.button}
                    onPress={onRandomize}
                    accessibilityRole="button"
                    accessibilityLabel="Randomize the hazard deck from the full card pool"
                    testID="debug-hazard-deck-randomize"
                >
                    <Text style={styles.buttonLabel}>SHUFFLE FATE</Text>
                </Pressable>
            </View>
            <View style={styles.presetGrid}>
                {HAZARD_DECK_PRESETS.map((preset) => (
                    <Pressable
                        key={preset.id}
                        style={styles.presetButton}
                        onPress={() => onPreset(preset.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Apply hazard deck preset: ${preset.label}`}
                        testID={`debug-hazard-deck-preset-${preset.id}`}
                    >
                        <Text style={styles.presetLabel}>{preset.label.toUpperCase()}</Text>
                        <Text style={styles.presetSub} numberOfLines={2}>{preset.description}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    labelCol: { flex: 1, paddingRight: 8 },
    label: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, marginTop: 2 },
    button: {
        borderWidth: 1,
        borderColor: AXM.rust,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: AXM.rustSubtle,
    },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2, color: AXM.rust },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    presetButton: {
        width: '48%',
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    presetLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone },
    presetSub: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.ash, marginTop: 2 },
}));
