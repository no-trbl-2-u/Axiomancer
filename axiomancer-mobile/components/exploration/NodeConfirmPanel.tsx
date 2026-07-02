import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { ActionIcon } from '@/components/ActionIcon';
import { ACTION_ICON_BY_TYPE, type ExplorationOption } from '@/state/presenters/exploration.engine';

interface NodeConfirmPanelProps {
    /** The node the player has selected, or null when nothing is selected. */
    selected: ExplorationOption | null;
    onConfirm: () => void;
    onCancel: () => void;
    /** Shown when no node is selected (e.g. "the paths close."). */
    emptyMessage: string;
}

/** Human-readable tag for each node kind, shown above the blurb. */
const KIND_LABEL: Record<string, string> = {
    encounter: 'BATTLE',
    boss: 'BOSS · BATTLE',
    quest: 'QUEST',
    rest: 'REST',
    gather: 'GATHER',
    treasure: 'TREASURE',
    hazard: 'HAZARD',
    current: 'HERE',
};

/**
 * Bottom panel for the exploration screen: instead of listing every neighbour,
 * the player taps a node on the map to SELECT it; this panel names the chosen
 * node, briefly explains what it is, and offers a Confirm button to travel
 * there. Confirm commits the move; Cancel clears the selection.
 */
export function NodeConfirmPanel({ selected, onConfirm, onCancel, emptyMessage }: NodeConfirmPanelProps) {
    const styles = useStyles();
    const AXM = usePalette();

    if (selected === null) {
        return (
            <View style={styles.panel}>
                <Text style={styles.hint}>{emptyMessage}</Text>
            </View>
        );
    }

    const kindLabel = KIND_LABEL[selected.type] ?? selected.type.toUpperCase();
    const iconKey = ACTION_ICON_BY_TYPE[selected.type] ?? 'sword';

    return (
        <View style={styles.panel} testID="node-confirm-panel">
            <View style={styles.body}>
                <View style={styles.iconWrap}>
                    <ActionIcon kind={iconKey} size={22} color={AXM.parchment} />
                </View>
                <View style={styles.text}>
                    <Text style={styles.kind}>{kindLabel}</Text>
                    <Text style={styles.name} numberOfLines={1}>{selected.label}</Text>
                    {selected.description.length > 0 && (
                        <Text style={styles.blurb} numberOfLines={2}>{selected.description}</Text>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <Pressable
                    onPress={onCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel selection"
                    testID="node-confirm-cancel"
                    style={styles.cancel}
                >
                    <Text style={styles.cancelText}>BACK</Text>
                </Pressable>
                <Pressable
                    onPress={onConfirm}
                    accessibilityRole="button"
                    accessibilityLabel={`Travel to ${selected.label}`}
                    testID="node-confirm-go"
                    style={styles.confirm}
                >
                    <Text style={styles.confirmText}>TRAVEL HERE</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        marginHorizontal: 10,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    hint: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.bone,
        textAlign: 'center',
        paddingVertical: 8,
    },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconWrap: {
        width: 34,
        alignItems: 'center',
    },
    text: { flex: 1 },
    kind: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.5,
        color: AXM.sulfur,
    },
    name: {
        fontFamily: FONTS.gothic,
        fontSize: 16,
        color: AXM.parchment,
        marginTop: 1,
    },
    blurb: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 10,
    },
    cancel: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    cancelText: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 1.5,
        color: AXM.bone,
    },
    confirm: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    confirmText: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 1.5,
        color: AXM.sulfur,
    },
}));
