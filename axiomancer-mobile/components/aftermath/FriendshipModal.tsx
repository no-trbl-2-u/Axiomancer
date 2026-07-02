/**
 * FriendshipModal — "the heart opens" post-combat friendship outcome
 *
 * Friendship modal displaying parley success with pixel art heart emblem.
 * Features the distinctive 8-bit aesthetic break with warm rust styling
 * and optional journal entry integration.
 */

import React from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { FONTS, TYPE } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import AftermathBackdrop from './AftermathBackdrop';
import PixelHeartEmblem from './PixelHeartEmblem';
import { TornPanel } from '@/components/TornPanel';

export interface FriendshipModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Former foe name */
    formerFoeName: string;
    /** Former foe epithet */
    formerFoeEpithet: string;
    /** Chronicle-voice parley outcome phrase */
    pactPhrase: string;
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
        journalEntry?: {
            bookName: string;
            entryTitle: string;
            preview: string;
        } | null;
    };
    /** Continue button handler */
    onContinue: () => void;
}

export default function FriendshipModal({
    visible,
    formerFoeName,
    formerFoeEpithet,
    pactPhrase,
    rewards,
    onContinue,
}: FriendshipModalProps) {
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

    const renderJournalEntry = () => {
        if (!rewards.journalEntry) {
            return null;
        }

        return (
            <TornPanel style={styles.journalPanel}>
                <Text style={[styles.journalLabel, { fontFamily: FONTS.sans, color: AXM.rust }]}>
                    ✎ A NEW ENTRY
                </Text>
                <View style={styles.journalContent}>
                    <View style={styles.bookIcon} />
                    <View style={styles.journalText}>
                        <Text style={[styles.bookName, { fontFamily: FONTS.sans, color: AXM.rust }]}>
                            {rewards.journalEntry.bookName}
                        </Text>
                        <Text style={[styles.entryTitle, { fontFamily: FONTS.gothic }]}>
                            {rewards.journalEntry.entryTitle}
                        </Text>
                        <Text style={[styles.entryPreview, { fontFamily: FONTS.serifItalic }]}>
                            {rewards.journalEntry.preview}…
                        </Text>
                    </View>
                </View>
            </TornPanel>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <AftermathBackdrop>
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Eyebrow */}
                    <Text style={[styles.eyebrow, { color: AXM.rust, fontFamily: FONTS.sans }]}>
                        ❦ THE HEART OPENS
                    </Text>

                    {/* Former foe name and epithet */}
                    <Text style={[styles.foeName, TYPE.display, { fontFamily: FONTS.gothic }]}>
                        {formerFoeName}
                    </Text>
                    <Text style={[styles.epithet, { fontFamily: FONTS.serifItalic, color: AXM.bone }]}>
                        {formerFoeEpithet}
                    </Text>

                    {/* Pixel art heart emblem */}
                    <PixelHeartEmblem />
                    <Text style={[styles.accordLabel, { fontFamily: FONTS.sans, color: AXM.rust }]}>
                        ❦ AN ACCORD
                    </Text>

                    {/* Pact phrase */}
                    <Text style={[
                        styles.pactPhrase, 
                        { fontFamily: FONTS.serifItalic, color: AXM.parchment }
                    ]}>
                        {pactPhrase}
                    </Text>

                    {/* Reward strip (rust-tinted) */}
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
                            <Text style={[styles.rewardValue, { fontFamily: FONTS.mono, color: AXM.rust }]}>
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

                    {/* Journal entry */}
                    {renderJournalEntry()}

                    {/* Continue button */}
                    <TouchableOpacity 
                        style={styles.continueButton} 
                        onPress={onContinue}
                        accessibilityRole="button"
                        accessibilityLabel="Part as friends"
                    >
                        <Text style={[styles.buttonText, { fontFamily: FONTS.gothic }]}>
                            ❦ PART AS FRIENDS
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
    eyebrow: {
        fontSize: 14,
        letterSpacing: 0.1,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    foeName: {
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
    accordLabel: {
        fontSize: 14,
        letterSpacing: 0.1,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
        lineHeight: 18,
    },
    pactPhrase: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
        marginHorizontal: 16,
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
        // Rust drop-shadow for warm gold effect
        textShadowColor: AXM.rust,
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
        marginBottom: 24,
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
    journalPanel: {
        marginHorizontal: 16,
        marginBottom: 32,
        padding: 16,
        backgroundColor: AXM.panelBg,
    },
    journalLabel: {
        fontSize: 12,
        letterSpacing: 0.1,
        marginBottom: 12,
        lineHeight: 16,
    },
    journalContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bookIcon: {
        width: 20,
        height: 16,
        backgroundColor: AXM.bone,
        marginRight: 12,
        marginTop: 2,
        // Placeholder for book SVG icon
    },
    journalText: {
        flex: 1,
    },
    bookName: {
        fontSize: 12,
        letterSpacing: 0.1,
        marginBottom: 4,
        lineHeight: 16,
    },
    entryTitle: {
        fontSize: 16,
        color: AXM.parchment,
        marginBottom: 8,
        lineHeight: 20,
    },
    entryPreview: {
        fontSize: 16,
        color: AXM.bone,
        lineHeight: 22,
    },
    continueButton: {
        backgroundColor: AXM.silhouette,
        borderWidth: 2,
        borderColor: AXM.rust,
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