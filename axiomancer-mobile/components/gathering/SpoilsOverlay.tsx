/**
 * The weighing — the spoils ledger shown after the outcome screen.
 * Kept stacks, what was lost, family totals with set refinements, coin
 * and vitae notes, the despoiler's scar, and the rolled boons with
 * their final verdicts. One confirm: bind the satchel.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type { GatherSpoilsVM } from '@/state/presenters/gathering.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

import { FamilyGlyph, GraceMark, RichnessPips } from './glyphs';
import { FAMILY } from './palette';

export function SpoilsOverlay({
    spoils,
    onConfirm,
}: {
    spoils: GatherSpoilsVM;
    onConfirm: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <Animated.View entering={FadeIn.duration(240)} style={styles.root} testID="gathering-spoils">
            <View style={styles.topStrip}>
                <Text style={styles.topStripText}>❧ THE WEIGHING</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                {/* kept stacks */}
                <Animated.View entering={FadeInDown.delay(80).duration(280)}>
                    <Text style={styles.sectionLabel}>
                        CARRIED OUT{spoils.lostCount > 0 ? `  ·  ${spoils.lostCount} LOST TO THE SITE` : ''}
                    </Text>
                    {spoils.keptStacks.length === 0 ? (
                        <Text style={styles.emptyNote}>nothing — the place kept it all</Text>
                    ) : (
                        <View style={styles.stackList}>
                            {spoils.keptStacks.map((stack) => {
                                const c = FAMILY[stack.family];
                                return (
                                    <View key={stack.plotId} style={[styles.stackRow, { borderColor: c.c }]}>
                                        <FamilyGlyph kind={c.glyph} size={15} color={c.c} />
                                        <Text style={styles.stackName} numberOfLines={1}>
                                            {stack.name}
                                        </Text>
                                        <Text style={[styles.stackQty, { color: c.lite }]}>×{stack.quantity}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </Animated.View>

                {/* family totals + refinements */}
                <Animated.View entering={FadeInDown.delay(180).duration(280)}>
                    <Text style={styles.sectionLabel}>THE FOUR FAMILIES</Text>
                    <View style={styles.familyRow}>
                        {spoils.familyTotals.map((f) => {
                            const c = FAMILY[f.family];
                            return (
                                <View key={f.family} style={[styles.familyCell, { borderColor: f.set ? c.c : AXM.ash }]}>
                                    <FamilyGlyph kind={c.glyph} size={15} color={c.c} />
                                    <RichnessPips count={Math.min(4, f.richness)} size={6} color={c.c} />
                                    <Text style={[styles.familyCellText, { color: f.set ? c.lite : AXM.bone }]}>
                                        {f.richness}/{f.setThreshold}
                                    </Text>
                                    {f.set && <Text style={[styles.setBadge, { backgroundColor: c.c }]}>SET</Text>}
                                </View>
                            );
                        })}
                    </View>
                    {spoils.refinements.map((r) => (
                        <View key={r.family} style={styles.refinedRow}>
                            <Text style={styles.refinedName}>✦ {r.name}</Text>
                            <Text style={styles.refinedDesc}>{r.desc}</Text>
                        </View>
                    ))}
                    {spoils.roundHarvest && (
                        <Text style={styles.roundHarvest}>❧ THE ROUND HARVEST — all four families, carried whole</Text>
                    )}
                </Animated.View>

                {/* ledger notes */}
                {(spoils.coinNotes.length > 0 || spoils.vitaeNotes.length > 0 || spoils.scarNote || spoils.boonNote) && (
                    <Animated.View entering={FadeInDown.delay(280).duration(280)} style={styles.ledger}>
                        {spoils.coinNotes.map((note) => (
                            <Text key={note} style={[styles.ledgerNote, { color: AXM.sulfur }]}>
                                {note}
                            </Text>
                        ))}
                        {spoils.vitaeNotes.map((note) => (
                            <Text
                                key={note}
                                style={[styles.ledgerNote, { color: note.startsWith('+') ? '#86a821' : AXM.blood }]}
                            >
                                {note}
                            </Text>
                        ))}
                        {spoils.boonNote !== null && (
                            <Text style={[styles.ledgerNote, { color: AXM.sulfur }]}>{spoils.boonNote}</Text>
                        )}
                        {spoils.scarNote !== null && (
                            <Text style={[styles.ledgerNote, styles.scarNote]}>{spoils.scarNote}</Text>
                        )}
                    </Animated.View>
                )}

                {/* boons */}
                {spoils.boons.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(360).duration(280)}>
                        <Text style={styles.sectionLabel}>BOONS</Text>
                        <View style={{ paddingHorizontal: 14, gap: 5 }}>
                            {spoils.boons.map((b) => {
                                const tone =
                                    b.status === 'done' ? '#86a821' : b.status === 'failed' ? AXM.ash : AXM.bone;
                                return (
                                    <View key={b.id} style={[styles.boonRow, { borderColor: tone }]}>
                                        <Text style={[styles.boonMark, { color: tone }]}>
                                            {b.status === 'done' ? '✓' : '✕'}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.boonName, { color: tone }]}>{b.name}</Text>
                                            <Text style={styles.boonDesc}>{b.desc}</Text>
                                        </View>
                                        <Text style={[styles.boonReward, { color: tone }]}>{b.rewardLabel}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>
                )}

                <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <GraceMark size={16} color={AXM.ash} />
                </View>
            </ScrollView>

            <Animated.View entering={FadeIn.delay(450)} style={styles.confirmRow}>
                <Pressable
                    onPress={onConfirm}
                    accessibilityRole="button"
                    testID="gathering-spoils-confirm"
                    style={styles.confirm}
                >
                    <Text style={styles.confirmText}>{spoils.confirmLabel}</Text>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { ...StyleSheet.absoluteFillObject, zIndex: 64, backgroundColor: '#0a0b07' },
    topStrip: { paddingVertical: 6, alignItems: 'center', backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: AXM.ash },
    topStripText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2.5, color: AXM.parchment },
    sectionLabel: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.6, color: AXM.bone, textAlign: 'center', marginTop: 14, marginBottom: 6 },
    emptyNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, color: AXM.bone, textAlign: 'center', paddingVertical: 8 },
    stackList: { paddingHorizontal: 14, gap: 4 },
    stackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.3)' },
    stackName: { flex: 1, fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment },
    stackQty: { fontFamily: FONTS.gothic, fontSize: 14 },
    familyRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14 },
    familyCell: { flex: 1, alignItems: 'center', gap: 3, borderWidth: 1, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.3)' },
    familyCellText: { fontFamily: FONTS.mono, fontSize: 11 },
    setBadge: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.4, color: '#0c0a08', paddingHorizontal: 5, overflow: 'hidden' },
    refinedRow: { marginHorizontal: 14, marginTop: 6, borderWidth: 1, borderColor: AXM.sulfur, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(212,192,38,0.06)' },
    refinedName: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 0.5, color: AXM.sulfur },
    refinedDesc: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, marginTop: 2 },
    roundHarvest: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1, color: '#86a821', textAlign: 'center', marginTop: 8 },
    ledger: { marginHorizontal: 14, marginTop: 14, borderWidth: 1, borderColor: AXM.ash, paddingHorizontal: 10, paddingVertical: 8, gap: 4, backgroundColor: 'rgba(0,0,0,0.35)' },
    ledgerNote: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.4 },
    scarNote: { color: AXM.blood },
    boonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.3)' },
    boonMark: { fontFamily: FONTS.gothic, fontSize: 15 },
    boonName: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1 },
    boonDesc: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.bone },
    boonReward: { fontFamily: FONTS.mono, fontSize: 11 },
    confirmRow: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: AXM.ash, backgroundColor: '#0a0a07' },
    confirm: { borderWidth: 2, borderColor: AXM.parchment, paddingVertical: 10, alignItems: 'center', backgroundColor: AXM.bg },
    confirmText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2, color: AXM.parchment },
}));
