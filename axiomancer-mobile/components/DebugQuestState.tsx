/**
 * Dev-only quest state mutation (Phase 62b).
 *
 * Picker over two known QuestNames (engine 0.10.2's
 * `quest.library`), each with three action buttons:
 *
 *   - START   — push the quest onto `state.quests.active` via
 *               engine `startQuest`
 *   - ADVANCE — bump the first objective's `currentCount` via
 *               engine `progressQuest`
 *   - COMPLETE— move the quest from active → completed via
 *               engine `completeQuest`
 *
 * The engine ships `QuestName` as a string-union type but no
 * public quest registry, so the Quest objects fed to `startQuest`
 * are mobile-synthetic (single objective each, simple Reward).
 * If the engine later ships a `questLibrary`, swap the constants
 * for registry-driven lookups.
 *
 * Renders null outside `__DEV__`. Memoir tab's quest section
 * (Phase 33 tick B) reflects the state changes on next render.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
    startQuest as engineStartQuest,
    progressQuest as engineProgressQuest,
    completeQuest as engineCompleteQuest,
    type Quest,
    type QuestName,
} from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

interface QuestSpec {
    label: string;
    quest: Quest;
}

const STARTING_QUEST: Quest = {
    name: 'starting-quest' as QuestName,
    description: 'The pilgrim sets out from the fishing village.',
    mapName: 'fishing-village',
    status: 'available',
    objectives: [
        {
            id: 'reach-northern-forest',
            type: 'reach',
            description: 'Reach the northern forest.',
            target: 'northern-forest',
            requiredCount: 1,
            currentCount: 0,
        },
    ],
    reward: { kind: 'experience', amount: 50 },
};

const GATHER_WOOD: Quest = {
    name: 'gather-wood' as QuestName,
    description: 'Gather firewood from the forest.',
    mapName: 'northern-forest',
    status: 'available',
    objectives: [
        {
            id: 'collect-wood',
            type: 'collect',
            description: 'Collect three bundles of wood.',
            target: 'wood-bundle',
            requiredCount: 3,
            currentCount: 0,
        },
    ],
    reward: { kind: 'currency', amount: 20 },
};

const QUESTS: readonly QuestSpec[] = [
    { label: 'START QUEST', quest: STARTING_QUEST },
    { label: 'GATHER WOOD', quest: GATHER_WOOD },
];

export function DebugQuestState() {
    const styles = useStyles();
    const store = useGameStore();

    if (!isDevToolsEnabled()) return null;

    const onStart = (spec: QuestSpec) => {
        const state = store.getState();
        const log = engineStartQuest(state.quests, spec.quest);
         
        store.setState({ quests: log });
    };

    const onAdvance = (spec: QuestSpec) => {
        const state = store.getState();
        const obj = spec.quest.objectives[0];
        const result = engineProgressQuest(state.quests, spec.quest.name, obj.id, 1);
         
        store.setState({ quests: result.log });
    };

    const onComplete = (spec: QuestSpec) => {
        const state = store.getState();
        const log = engineCompleteQuest(state.quests, spec.quest.name);
         
        store.setState({ quests: log });
    };

    return (
        <View style={styles.root}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>DEBUG · QUEST</Text>
                <Text style={styles.sub}>start / advance / complete</Text>
            </View>
            {QUESTS.map((spec) => (
                <View key={spec.quest.name} style={styles.questRow}>
                    <Text style={styles.questLabel} numberOfLines={1}>{spec.label}</Text>
                    <View style={styles.buttonGroup}>
                        <Pressable
                            style={styles.button}
                            onPress={() => onStart(spec)}
                            accessibilityRole="button"
                            accessibilityLabel={`Start quest ${spec.quest.name}`}
                            testID={`debug-quest-${spec.quest.name}-start`}
                        >
                            <Text style={styles.buttonLabel}>START</Text>
                        </Pressable>
                        <Pressable
                            style={styles.button}
                            onPress={() => onAdvance(spec)}
                            accessibilityRole="button"
                            accessibilityLabel={`Advance quest ${spec.quest.name}`}
                            testID={`debug-quest-${spec.quest.name}-advance`}
                        >
                            <Text style={styles.buttonLabel}>ADV</Text>
                        </Pressable>
                        <Pressable
                            style={styles.button}
                            onPress={() => onComplete(spec)}
                            accessibilityRole="button"
                            accessibilityLabel={`Complete quest ${spec.quest.name}`}
                            testID={`debug-quest-${spec.quest.name}-complete`}
                        >
                            <Text style={styles.buttonLabel}>DONE</Text>
                        </Pressable>
                    </View>
                </View>
            ))}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
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
    },
    questRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    questLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1,
        color: AXM.parchment,
        flex: 1,
        paddingRight: 8,
    },
    buttonGroup: { flexDirection: 'row', gap: 4 },
    button: {
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
        minWidth: 40,
        alignItems: 'center',
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 10,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
}));
