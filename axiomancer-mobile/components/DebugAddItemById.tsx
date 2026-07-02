/**
 * Dev-only "add item by id" control (Phase 131).
 *
 * A text field + ADD button that injects a specific engine item into
 * the player's inventory by its id, resolving against the engine's
 * registries (equipment template → unique template → consumable) via
 * `actions.addItemById`. Unknown ids surface a visible failure line
 * so the Kid can tell whether the item landed.
 *
 * Sister to `DebugPopulateAllItems` (the full dump) — this one is the
 * surgical single-item knob for evidence runs. Renders null outside
 * dev builds.
 */

import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameActions } from '@/state/GameStoreProvider';
import { usePalette } from '@/theme/runtime';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function DebugAddItemById() {
    const styles = useStyles();
    const AXM = usePalette();
    const actions = useGameActions();
    const [id, setId] = useState('');
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    if (!isDevToolsEnabled()) return null;

    const onAdd = () => {
        const result = actions.addItemById(id);
        if (result.added) {
            setFeedback({ ok: true, text: `added · ${result.name} (${result.kind})` });
            setId('');
        } else {
            setFeedback({ ok: false, text: result.reason ?? 'add failed' });
        }
    };

    return (
        <View style={styles.panel}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · ADD ITEM BY ID</Text>
                <Text
                    style={[
                        styles.sub,
                        feedback ? (feedback.ok ? styles.subOk : styles.subErr) : null,
                    ]}
                    numberOfLines={2}
                    testID="debug-add-item-feedback"
                >
                    {feedback?.text ?? 'engine item id → inventory (e.g. steel-blade)'}
                </Text>
            </View>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={id}
                    onChangeText={setId}
                    placeholder="item-id"
                    placeholderTextColor={AXM.ash}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Item id to add to inventory"
                    testID="debug-add-item-input"
                />
                <Pressable
                    style={styles.button}
                    onPress={onAdd}
                    accessibilityRole="button"
                    accessibilityLabel="Add the entered item id to the player inventory"
                    testID="debug-add-item-button"
                >
                    <Text style={styles.buttonLabel}>ADD</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelCol: { flexDirection: 'column', paddingRight: 8 },
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
    subOk: { color: AXM.sulfur },
    subErr: { color: AXM.blood },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.parchment,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    button: {
        paddingHorizontal: 12,
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
