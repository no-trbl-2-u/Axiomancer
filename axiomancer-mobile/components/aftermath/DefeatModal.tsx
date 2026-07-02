/**
 * DefeatModal — "the page closes" post-combat defeat outcome
 *
 * Defeat modal with heavy, reductive styling. Features spent candle wick,
 * death chronicle with dropcap, run summary ledger, blood seep, and dual
 * action buttons (retry / abandon).
 */

import React from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { FONTS, TYPE } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import AftermathBackdrop from './AftermathBackdrop';

export interface DefeatModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Character name */
    characterName: string;
    /** Cause of death details */
    cause: {
        killerName: string;
        killerEpithet: string;
        finalSkill: string;
        damage: number;
    };
    /** Chronicle line describing the death */
    causePhrase: string;
    /** Run statistics */
    run: {
        rounds: number;
        encountersSurvived: number;
        deepestNode: number;
    };
    /** Retry run handler */
    onRetry: () => void;
    /** Abandon run handler */
    onAbandon: () => void;
}

export default function DefeatModal({
    visible,
    characterName,
    cause,
    causePhrase,
    run,
    onRetry,
    onAbandon,
}: DefeatModalProps) {
    const AXM = usePalette();
    const styles = useStyles();
    if (!visible) {
        return null;
    }

    // Extract first letter for dropcap
    const firstLetter = causePhrase.charAt(0).toUpperCase();
    const restOfPhrase = causePhrase.slice(1);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <AftermathBackdrop>
                <View style={styles.container}>
                    {/* Top section with spent wick */}
                    <View style={styles.topSection}>
                        {/* Candle wick */}
                        <View style={styles.wick} />
                        
                        {/* Eyebrow above wick */}
                        <Text style={[styles.eyebrow, { color: AXM.blood, fontFamily: FONTS.sans }]}>
                            ✠ THE PAGE CLOSES
                        </Text>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Character name */}
                        <Text style={[styles.characterName, TYPE.display, { fontFamily: FONTS.gothic }]}>
                            {characterName}
                        </Text>

                        {/* Killer details */}
                        <Text style={[styles.killerDetails, { fontFamily: FONTS.serifItalic, color: AXM.bone }]}>
                            fell to {cause.killerName}, {cause.killerEpithet}
                        </Text>

                        {/* Chronicle death paragraph with dropcap */}
                        <View style={styles.chronicleSection}>
                            <View style={styles.chronicleText}>
                                <Text style={[styles.dropcap, { fontFamily: FONTS.gothic }]}>
                                    {firstLetter}
                                </Text>
                                <Text style={[styles.chronicleBody, { fontFamily: FONTS.serif }]}>
                                    {restOfPhrase}
                                </Text>
                            </View>
                        </View>

                        {/* Run summary ledger */}
                        <View style={styles.runSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontFamily: FONTS.mono }]}>
                                    rounds endured
                                </Text>
                                <Text style={[styles.summaryValue, { fontFamily: FONTS.mono }]}>
                                    {run.rounds}
                                </Text>
                            </View>
                            <View style={styles.dottedRule} />
                            
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontFamily: FONTS.mono }]}>
                                    encounters survived
                                </Text>
                                <Text style={[styles.summaryValue, { fontFamily: FONTS.mono }]}>
                                    {run.encountersSurvived}
                                </Text>
                            </View>
                            <View style={styles.dottedRule} />
                            
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontFamily: FONTS.mono }]}>
                                    deepest node reached
                                </Text>
                                <Text style={[styles.summaryValue, { fontFamily: FONTS.mono }]}>
                                    {run.deepestNode}
                                </Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.buttonSection}>
                            <TouchableOpacity 
                                style={styles.retryButton} 
                                onPress={onRetry}
                                accessibilityRole="button"
                                accessibilityLabel="Begin again"
                            >
                                <Text style={[styles.retryButtonText, { fontFamily: FONTS.gothic }]}>
                                    ✠ BEGIN AGAIN
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.abandonButton} 
                                onPress={onAbandon}
                                accessibilityRole="button"
                                accessibilityLabel="Let the page close"
                            >
                                <Text style={[styles.abandonButtonText, { fontFamily: FONTS.serifItalic }]}>
                                    let the page close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Blood seep at bottom - styled like CombatDefeatPanel */}
                    <View style={styles.bloodSeep} pointerEvents="none">
                        <View style={styles.bloodSeepInner} />
                    </View>
                </View>
            </AftermathBackdrop>
        </Modal>
    );
}

const useStyles = makeStyles((AXM) => ({
    container: {
        flex: 1,
        position: 'relative',
    },
    topSection: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        height: 200,
    },
    wick: {
        width: 1,
        height: 80,
        backgroundColor: AXM.ash,
        marginBottom: 16,
    },
    eyebrow: {
        fontSize: 12,
        letterSpacing: 0.1,
        lineHeight: 16,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    characterName: {
        textAlign: 'center',
        marginBottom: 16,
        color: AXM.parchment,
    },
    killerDetails: {
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16,
        lineHeight: 22,
    },
    chronicleSection: {
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    chronicleText: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dropcap: {
        fontSize: 48,
        lineHeight: 48,
        color: AXM.parchment,
        marginRight: 4,
        marginTop: -8,
        // Dropcap styling per tokens.css
        fontWeight: 'bold',
    },
    chronicleBody: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        color: AXM.parchment,
        paddingTop: 4,
    },
    runSummary: {
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: AXM.bone,
        lineHeight: 18,
    },
    summaryValue: {
        fontSize: 14,
        color: AXM.parchment,
        lineHeight: 18,
    },
    dottedRule: {
        height: 1,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
        borderStyle: 'dotted',
        marginHorizontal: 8,
    },
    buttonSection: {
        paddingHorizontal: 16,
        marginBottom: 120, // Space for blood seep
    },
    retryButton: {
        backgroundColor: AXM.silhouette,
        borderWidth: 2,
        borderColor: AXM.parchment,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    retryButtonText: {
        color: AXM.parchment,
        fontSize: 16,
        letterSpacing: 2,
        textAlign: 'center',
        lineHeight: 20,
    },
    abandonButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    abandonButtonText: {
        color: AXM.bone,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 20,
        // No border, lowercase per spec
    },
    bloodSeep: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        opacity: 0.55,
    },
    bloodSeepInner: {
        flex: 1,
        backgroundColor: AXM.blood,
        borderTopWidth: 4,
        borderTopColor: AXM.blood,
        borderStyle: 'dashed',
        opacity: 0.6,
    },
}));