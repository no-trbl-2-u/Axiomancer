/**
 * Dev-only dialogue tree jump (Phase 62a).
 *
 * Seeds the event slice with a synthetic interaction event +
 * dialogue cursor so the event modal opens directly on a chosen
 * dialogue tree — no NPC encounter required. Lets a dev test
 * the dialogue rendering / choice-routing path in isolation.
 *
 * Two static trees ship inline:
 *   - OMEN — a brief two-node dialogue with two terminal choices
 *   - FRIEND — a single-node dialogue with one ack choice
 *
 * Engine 0.10.2's `getDialogueNode` resolves nodes against the
 * tree; no engine-side registry exists today, so the trees here
 * are mobile-synthetic. If the engine later ships a dialogue
 * registry, swap the constants for a registry-driven picker.
 *
 * Mounts inside the DevMenu (Phase 61a). Renders null outside
 * `__DEV__`.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { DialogueTree } from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const OMEN_TREE: DialogueTree = {
    rootId: 'root',
    nodes: {
        root: {
            id: 'root',
            text: 'a stranger blocks the path. their robe is dusted with ash.',
            choices: [
                { text: 'ask their name', nextNodeId: 'name' },
                { text: 'walk on', nextNodeId: 'leave' },
            ],
        },
        name: {
            id: 'name',
            text: '"i am one who watches." they bow.',
            choices: [{ text: 'depart' }],
        },
        leave: {
            id: 'leave',
            text: 'they do not turn to follow.',
            choices: [{ text: 'depart' }],
        },
    },
};

const FRIEND_TREE: DialogueTree = {
    rootId: 'root',
    nodes: {
        root: {
            id: 'root',
            text: 'a child waves from a low wall. they offer a smooth river stone.',
            choices: [{ text: 'thank them' }],
        },
    },
};

// The fishing-village fv-14 narration node's authored monologue
// (engine content `fv-14.narration` → tree `fv-strand-recollection`).
// Mirrored here so the narration → /dialogue render path can be
// eyeballed in isolation without walking the map to fv-14.
const STRAND_NARRATION_TREE: DialogueTree = {
    rootId: 'line-1',
    nodes: {
        'line-1': {
            id: 'line-1',
            text: 'The tide has gone out, and the strand lies bare to the grey morning.',
        },
        'line-2': {
            id: 'line-2',
            text: 'Somewhere a gull cries, and you remember why you came so far north.',
        },
        'line-3': {
            id: 'line-3',
            text: 'The sea keeps its own counsel. You walk on.',
        },
    },
};

interface TreeOption {
    key: string;
    label: string;
    tree: DialogueTree;
    npcName: string;
    /** Event-slice kind. Narration nodes ride the `narration` kind. */
    kind: 'interaction' | 'narration';
}

const TREES: readonly TreeOption[] = [
    { key: 'omen', label: 'OMEN', tree: OMEN_TREE, npcName: 'forgotten-pilgrim', kind: 'interaction' },
    { key: 'friend', label: 'FRIEND', tree: FRIEND_TREE, npcName: 'boy-priest', kind: 'interaction' },
    { key: 'narration', label: 'NARRATION', tree: STRAND_NARRATION_TREE, npcName: 'fv-14-strand', kind: 'narration' },
];

export function DebugDialogueJump() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const onJump = (option: TreeOption) => {
        const state = store.getState();
        // Narration nodes ride the `narration` kind; NPC trees the
        // `interaction` kind. Both seed a `dialogueCursor`, which the event
        // presenter prioritises to render the tree on the /dialogue screen.
        const event = {
            kind: option.kind,
            npcName: option.npcName,
            dialogue: option.tree,
        };

        store.setState({
            event: {
                pending: { state, event },
                dialogueCursor: { tree: option.tree, nodeId: option.tree.rootId },
                history: [],
                sourceNodeType: null,
            },
        });
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · DIALOGUE</Text>
                <Text style={styles.sub}>jump into a tree at its root</Text>
            </View>
            <View style={styles.buttonGroup}>
                {TREES.map((option) => (
                    <Pressable
                        key={option.key}
                        style={styles.button}
                        onPress={() => onJump(option)}
                        accessibilityRole="button"
                        accessibilityLabel={`Jump into ${option.key} dialogue tree`}
                        testID={`debug-dialogue-${option.key}`}
                    >
                        <Text style={styles.buttonLabel}>{option.label}</Text>
                    </Pressable>
                ))}
            </View>
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
    buttonGroup: { flexDirection: 'row', gap: 6 },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
}));
