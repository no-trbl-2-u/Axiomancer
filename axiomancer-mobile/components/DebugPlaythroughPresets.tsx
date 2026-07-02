/**
 * Dev-only playthrough preset picker (Phase 100).
 *
 * Two buttons for reproducible test state initialization:
 * - FRESH START: level-1, minimal gear, start-of-game state
 * - ENDGAME: max-level, all items/skills, endgame state
 *
 * Enables testing game extremes that are hard to reach through
 * normal play progression. Direct game state manipulation via
 * store.setState to create reproducible test fixtures.
 *
 * Renders null in production builds (__DEV__ false).
 *
 * Promoted via /oversight 2026-06-02 from CRITIQUE [MED] /dev.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getTemplatesBySlot } from 'axiomancer-mechanics';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { useGameStore } from '@/state/GameStoreProvider';
import { equipmentFromTemplate as templateToEquipment } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

type PresetType = 'fresh' | 'endgame' | null;

export function DebugPlaythroughPresets() {
    const styles = useStyles();
    const store = useGameStore();
    const [active, setActive] = useState<PresetType>(null);

    if (!isDevToolsEnabled()) return null;

    const onApplyFreshStart = () => {
        // Reset to level 1 with minimal stats and no equipment
        const currentState = store.getState();
        store.setState({
            player: {
                ...currentState.player,
                level: 1,
                experience: 0,
                availableStatPoints: 0,
                baseStats: { heart: 3, body: 3, mind: 3 },
                knownSkills: [],
                inventory: [], // Empty inventory for fresh start
                currency: 0,
                effects: [],
            },
        });
        setActive('fresh');
    };

    const onApplyEndgame = () => {
        // Set to high-level with maxed progression and equipment
        const currentState = store.getState();
        
        // Create endgame equipment inventory by taking the first available item for each slot
        const endgameInventory = [];
        const slots = ['head', 'body', 'hands', 'feet', 'weapon', 'armor', 'accessory'] as const;
        
        for (const slot of slots) {
            const templates = getTemplatesBySlot(slot);
            if (templates.length > 0) {
                // Take the first available equipment for each slot
                endgameInventory.push(templateToEquipment(templates[0]));
            }
        }
        
        store.setState({
            player: {
                ...currentState.player,
                level: 20,
                experience: 20000, // 20 levels * 1000 XP per level
                availableStatPoints: 0, // All points spent
                baseStats: { heart: 15, body: 15, mind: 15 }, // High balanced stats
                knownSkills: [
                    // Tier 1 skills
                    'ad-hominem-strike',
                    'false-dilemma',
                    'appeal-to-pity',
                    'achilles-gambit',
                    'liars-echo',
                    'ship-of-theseus',
                    // Tier 2 skills
                    'mob-appeal',
                    'undistributed-middle',
                    'eternal-regress',
                    // Tier 3 skills
                    'sorites-cascade',
                    'straw-giant',
                    'bootstrap-paradox',
                ],
                inventory: endgameInventory,
                currency: 500,
                effects: [], // No permanent effects for clean testing
            },
        });
        setActive('endgame');
    };

    return (
        <View style={styles.row}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>DEBUG · PLAYTHROUGHS</Text>
                <Text style={styles.sub}>
                    {active ? `applied · ${active} start` : 'state seeding for test coverage'}
                </Text>
            </View>
            <View style={styles.buttonCol}>
                <Pressable
                    style={[styles.button, active === 'fresh' && styles.buttonActive]}
                    onPress={onApplyFreshStart}
                    accessibilityRole="button"
                    accessibilityLabel="Apply fresh start preset (level 1, minimal gear)"
                    testID="debug-preset-fresh"
                >
                    <Text style={[styles.buttonLabel, active === 'fresh' && styles.buttonLabelActive]}>
                        FRESH START
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.button, active === 'endgame' && styles.buttonActive]}
                    onPress={onApplyEndgame}
                    accessibilityRole="button"
                    accessibilityLabel="Apply endgame preset (max level, all skills/items)"
                    testID="debug-preset-endgame"
                >
                    <Text style={[styles.buttonLabel, active === 'endgame' && styles.buttonLabelActive]}>
                        ENDGAME
                    </Text>
                </Pressable>
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
    buttonCol: { flexDirection: 'column', gap: 4 },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
    },
    buttonActive: {
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },
    buttonLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.bone,
        letterSpacing: 1.5,
        textAlign: 'right',
    },
    buttonLabelActive: {
        color: AXM.sulfur,
    },
}));