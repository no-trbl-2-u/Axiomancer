/**
 * VictoryModal — "the foe falls" post-combat victory outcome
 *
 * Victory modal displaying enemy defeat, final blow details, and rewards.
 * Follows the design specification with eyebrow, enemy info, final blow
 * panel, reward strip, loot list, and continue button.
 */

import React from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { FONTS, TYPE } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import AftermathBackdrop from './AftermathBackdrop';
import { TornPanel } from '@/components/TornPanel';
import { Splatter } from '@/components/Splatter';

export interface VictoryModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Enemy name (e.g. 'THE HIEROPHANT') */
    enemyName: string;
    /** Enemy epithet (e.g. 'iron-tongued') */
    enemyEpithet: string;
    /** Final blow details */
    finalBlow: {
        skillName: string;
        damage: number;
        descriptor: string;
    };
    /** Chronicle-voice flavor line for the final blow */
    finalBlowPhrase: string;
    /** Reward breakdown */
    rewards: {
        xp: number;
        currency: {
            vitae: number;
            sigils: number;
        };
        loot: {
            name: string;
            slot: string;
            rarity: 'common' | 'rare' | 'legendary';
        }[];
    };
    /** Continue button handler */
    onContinue: () => void;
}

export default function VictoryModal({
    visible,
    enemyName,
    enemyEpithet,
    finalBlow,
    finalBlowPhrase,
    rewards,
    onContinue,
}: VictoryModalProps) {
    const AXM = usePalette();
    const styles = useStyles();
    if (!visible) {
        return null;
    }

    const renderLootList = () => {
        if (rewards.loot.length === 0) {
            return (
                <Text style={[styles.emptyLootText, { fontFamily: FONTS.serifItalic }]}>
                    no spoils. only quiet.
                </Text>
            );
        }

        return rewards.loot.map((item, index) => (
            <View key={index} style={styles.lootRow}>
                <View style={styles.itemGlyph} />
                <Text style={[styles.itemName, { fontFamily: FONTS.sans }]}>
                    {item.name}
                </Text>
                <Text style={[styles.slotTag, { fontFamily: FONTS.sans }]}>
                    {item.slot}
                </Text>
                <View style={[
                    styles.rarityLine,
                    item.rarity === 'legendary' ? { borderColor: AXM.sulfur } :
                    item.rarity === 'rare' ? { borderWidth: 1 } :
                    { borderStyle: 'dotted' }
                ]} />
            </View>
        ));
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <AftermathBackdrop>
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Sparse splatter decoration */}
                    <Splatter 
                        style={styles.splatterTop}
                        color={AXM.blood}
                        size={40}
                        seed={1}
                    />
                    
                    {/* Eyebrow */}
                    <Text style={[styles.eyebrow, { color: AXM.blood, fontFamily: FONTS.sans }]}>
                        ✠ THE FOE FALLS
                    </Text>

                    {/* Enemy name and epithet */}
                    <Text style={[styles.enemyName, TYPE.display, { fontFamily: FONTS.gothic }]}>
                        {enemyName}
                    </Text>
                    <Text style={[styles.epithet, { fontFamily: FONTS.serifItalic, color: AXM.bone }]}>
                        {enemyEpithet}
                    </Text>

                    {/* Final blow panel */}
                    <TornPanel style={styles.finalBlowPanel}>
                        <Text style={[styles.finalBlowMeta, { fontFamily: FONTS.mono }]}>
                            FINAL BLOW · {finalBlow.skillName} · {finalBlow.damage}
                        </Text>
                        <Text style={[
                            styles.finalBlowPhrase, 
                            { fontFamily: FONTS.serifItalic, color: AXM.parchment }
                        ]}>
                            {finalBlowPhrase}
                        </Text>
                    </TornPanel>

                    {/* Bottom-left splatter on final blow panel */}
                    <Splatter 
                        style={styles.splatterBottom}
                        color={AXM.blood}
                        size={30}
                        seed={2}
                    />

                    {/* Reward strip */}
                    <View style={styles.rewardStrip}>
                        <View style={styles.rewardColumn}>
                            <Text style={[styles.rewardValue, { fontFamily: FONTS.mono, color: AXM.parchment }]}>
                                {rewards.xp}
                            </Text>
                            <Text style={[styles.rewardLabel, { fontFamily: FONTS.sans }]}>
                                XP
                            </Text>
                        </View>
                        
                        <View style={styles.verticalRule} />
                        
                        <View style={styles.rewardColumn}>
                            <Text style={[styles.rewardValue, { fontFamily: FONTS.mono, color: AXM.sulfur }]}>
                                {rewards.currency.vitae} / {rewards.currency.sigils}
                            </Text>
                            <Text style={[styles.rewardLabel, { fontFamily: FONTS.sans }]}>
                                VITAE / SIGILS
                            </Text>
                        </View>
                        
                        <View style={styles.verticalRule} />
                        
                        <View style={styles.rewardColumn}>
                            <Text style={[styles.rewardValue, { fontFamily: FONTS.mono, color: AXM.parchment }]}>
                                {rewards.loot.length}
                            </Text>
                            <Text style={[styles.rewardLabel, { fontFamily: FONTS.sans }]}>
                                LOOT COUNT
                            </Text>
                        </View>
                    </View>

                    {/* Loot list */}
                    <View style={styles.lootSection}>
                        {renderLootList()}
                    </View>

                    {/* Continue button */}
                    <TouchableOpacity 
                        style={styles.continueButton} 
                        onPress={onContinue}
                        accessibilityRole="button"
                        accessibilityLabel="Carry on"
                    >
                        <Text style={[styles.buttonText, { fontFamily: FONTS.gothic }]}>
                            ✠ CARRY ON
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </AftermathBackdrop>
        </Modal>
    );
}

const useStyles = makeStyles((AXM) => ({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    splatterTop: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 40,
        height: 40,
    },
    splatterBottom: {
        position: 'absolute',
        top: 240,
        left: 10,
        width: 30,
        height: 30,
    },
    eyebrow: {
        fontSize: 14,
        letterSpacing: 0.1,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    enemyName: {
        textAlign: 'center',
        marginBottom: 8,
        color: AXM.parchment,
    },
    epithet: {
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16,
        lineHeight: 22,
    },
    finalBlowPanel: {
        marginHorizontal: 16,
        marginBottom: 32,
        padding: 16,
        backgroundColor: AXM.panelBg,
    },
    finalBlowMeta: {
        fontSize: 12,
        color: AXM.bone,
        marginBottom: 8,
        lineHeight: 16,
    },
    finalBlowPhrase: {
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0,
    },
    rewardStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    rewardColumn: {
        alignItems: 'center',
        flex: 1,
    },
    rewardValue: {
        fontSize: 18,
        lineHeight: 24,
        marginBottom: 4,
        // Soft sulfur drop-shadow for gold leaf effect
        textShadowColor: AXM.sulfur,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    rewardLabel: {
        fontSize: 12,
        color: AXM.bone,
        letterSpacing: 0.1,
        lineHeight: 16,
    },
    verticalRule: {
        width: 1,
        height: 40,
        backgroundColor: AXM.ash,
        marginHorizontal: 16,
    },
    lootSection: {
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    lootRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 8,
    },
    itemGlyph: {
        width: 16,
        height: 16,
        backgroundColor: AXM.bone,
        marginRight: 12,
        // Placeholder for item glyph SVG
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        color: AXM.parchment,
        letterSpacing: 0.1,
        lineHeight: 18,
    },
    slotTag: {
        fontSize: 12,
        color: AXM.bone,
        marginHorizontal: 12,
        letterSpacing: 0.1,
        lineHeight: 16,
    },
    rarityLine: {
        width: 20,
        height: 1,
        borderTopWidth: 1,
        borderColor: AXM.parchment,
    },
    emptyLootText: {
        textAlign: 'center',
        fontSize: 16,
        color: AXM.bone,
        lineHeight: 22,
        paddingVertical: 20,
    },
    continueButton: {
        backgroundColor: AXM.silhouette,
        borderWidth: 2,
        borderColor: AXM.parchment,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginHorizontal: 16,
        marginBottom: 40,
    },
    buttonText: {
        color: AXM.parchment,
        fontSize: 16,
        letterSpacing: 2,
        textAlign: 'center',
        lineHeight: 20,
    },
}));