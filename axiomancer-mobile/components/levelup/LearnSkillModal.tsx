/**
 * LearnSkillModal — "a new turn of phrase"
 *
 * Pops ON TOP of the stat-allocation LevelUpModal when LEVEL UP is
 * tapped: one pick of three qualifying skills per level gained
 * (stacked levels queue consecutive picks). Offers come from the
 * engine's alignment-gated `getAvailableSkills` via
 * `actions.getLearnableSkillOffers()`; a pick dispatches
 * `actions.learnSkill(id)` upstream. Non-tap-out-dismissible — the
 * only exits are LEARN (per row) or FORGO.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StanceGlyph } from '@/components/StanceGlyph';
import type { LearnableSkillOffer } from '@/state/actions';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

export interface LearnSkillModalProps {
    offers: LearnableSkillOffer[];
    /** Picks left in this level-up session (≥1 while mounted). */
    picksRemaining: number;
    onPick: (skillId: string) => void;
    onSkip: () => void;
}

export function LearnSkillModal({ offers, picksRemaining, onPick, onSkip }: LearnSkillModalProps) {
    const styles = useStyles();
    const AXM = usePalette();
    return (
        <View style={styles.root} testID="learn-skill-modal">
            <View style={styles.panel}>
                <Text style={styles.eyebrow}>✠ A NEW TURN OF PHRASE</Text>
                <Text style={styles.title}>LEARN A SKILL</Text>
                <Text style={styles.sub}>
                    {picksRemaining > 1
                        ? `choose one · ${picksRemaining} picks remain`
                        : 'choose one — the mind keeps what it names'}
                </Text>
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {offers.map((offer) => (
                        <Pressable
                            key={offer.id}
                            onPress={() => onPick(offer.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Learn ${offer.name}, ${offer.effectText}`}
                            testID={`learn-skill-offer-${offer.id}`}
                            style={({ pressed }) => [styles.offerRow, pressed && styles.offerPressed]}
                        >
                            <StanceGlyph kind={offer.stance} size={26} color={AXM.parchment} />
                            <View style={styles.offerText}>
                                <View style={styles.offerHead}>
                                    <Text style={styles.offerName} numberOfLines={1}>{offer.name}</Text>
                                    <Text style={styles.offerTier}>T{offer.tier} · {offer.category.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.offerEffect} numberOfLines={1}>{offer.effectText}</Text>
                                <Text style={styles.offerDesc} numberOfLines={2}>{offer.description}</Text>
                            </View>
                            <View style={styles.offerCostCol}>
                                <Text style={styles.offerLearn}>LEARN ›</Text>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
                <Pressable
                    onPress={onSkip}
                    accessibilityRole="button"
                    accessibilityLabel="Forgo learning a skill this level"
                    testID="learn-skill-skip"
                    style={styles.skip}
                >
                    <Text style={styles.skipText}>forgo — let the words go unlearned</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        ...StyleSheet.absoluteFillObject,
        // Above the LevelUpModal (zIndex 50) — this pick gates the
        // stat ledger beneath it.
        zIndex: 60,
        backgroundColor: 'rgba(6,5,4,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    panel: {
        width: '100%',
        maxWidth: 380,
        maxHeight: '86%',
        borderWidth: 2,
        borderColor: AXM.sulfur,
        backgroundColor: '#100d0a',
        paddingVertical: 16,
        paddingHorizontal: 14,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 3,
        color: AXM.sulfur,
        textAlign: 'center',
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 24,
        lineHeight: 26,
        color: AXM.parchment,
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 6,
    },
    sub: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 11,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 10,
    },
    list: { flexGrow: 0 },
    offerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.bg,
        marginBottom: 8,
    },
    offerPressed: {
        borderColor: AXM.sulfur,
        backgroundColor: 'rgba(212,192,38,0.08)',
    },
    offerText: { flex: 1, minWidth: 0 },
    offerHead: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 6,
    },
    offerName: {
        flex: 1,
        fontFamily: FONTS.gothic,
        fontSize: 13,
        color: AXM.parchment,
        letterSpacing: 1,
    },
    offerTier: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
    },
    offerEffect: {
        fontFamily: FONTS.mono,
        fontSize: 9.5,
        letterSpacing: 0.5,
        color: AXM.sulfur,
        marginTop: 3,
    },
    offerDesc: {
        fontFamily: FONTS.serif,
        fontSize: 10,
        color: AXM.bone,
        lineHeight: 13,
        marginTop: 3,
    },
    offerCostCol: { alignItems: 'flex-end', maxWidth: 76 },
    offerLearn: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.6,
        color: AXM.sulfur,
        marginTop: 6,
    },
    skip: {
        marginTop: 4,
        paddingVertical: 8,
        alignItems: 'center',
    },
    skipText: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 11,
        color: AXM.bone,
        textDecorationLine: 'underline',
    },
}));
