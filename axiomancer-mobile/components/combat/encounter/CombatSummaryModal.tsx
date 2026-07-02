/**
 * Spec 25 §7.7 — Post-combat attribution summary.
 *
 * Every fight (win OR loss) shows an explicit breakdown of which skill cards
 * contributed the DoT / control pressure that decided it, naming the best card.
 * Engine-built (`buildCombatSummary`); this is pure presentation.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CombatSummary } from 'axiomancer-mechanics';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

const OUTCOME_COLOR: Record<string, string> = {
    victory: '#5bbf6a', mercy: '#a86bdc', defeat: '#e01f33', retreat: '#9c937f',
};

export function CombatSummaryModal({ summary, onClose }: { summary: CombatSummary; onClose: () => void }) {
    const styles = useStyles();
    const AXM = usePalette();
    const color = OUTCOME_COLOR[summary.outcome] ?? AXM.parchment;
    return (
        <View style={styles.backdrop} testID="combat-summary">
            <View style={[styles.panel, { borderColor: color }]}>
                <Text style={[styles.headline, { color }]}>{summary.headline}</Text>

                <View style={styles.rows}>
                    {summary.rows.length === 0 && (
                        <>
                            <Text style={styles.noRows}>No status effects contributed.</Text>
                            <Text style={styles.coach}>Draft a stance die each turn, then POWER a status card — DoT wears the enemy down and control skips its turns. Basic strikes alone will not close it.</Text>
                        </>
                    )}
                    {summary.rows.slice(0, 6).map(row => (
                        <View key={row.cardId} style={styles.row} testID={`combat-summary-row-${row.cardId}`}>
                            <Text style={styles.rowName} numberOfLines={1}>{row.name}</Text>
                            <Text style={styles.rowVal}>
                                {row.dotDamage > 0 ? `${row.dotDamage} dmg` : `${row.damageDealt} dmg`}
                                <Text style={{ color: AXM.bone }}> · {row.phases}ph</Text>
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.totals}>
                    <Text style={styles.total}>Total DoT damage: <Text style={{ color: AXM.parchment }}>{summary.totalDotDamage}</Text></Text>
                    <Text style={styles.total}>Direct damage: <Text style={{ color: AXM.parchment }}>{summary.directDamage}</Text></Text>
                </View>

                {summary.bestCard.length > 0 && (
                    <Text style={[styles.best, { color }]} testID="combat-summary-best">★ Best card: {summary.bestCard}</Text>
                )}

                <Pressable onPress={onClose} testID="combat-summary-close" accessibilityRole="button" accessibilityLabel="Continue" style={[styles.btn, { borderColor: color }]}>
                    <Text style={[styles.btnText, { color }]}>CONTINUE</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    backdrop: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
    panel: { width: '100%', maxWidth: 420, borderWidth: 2, backgroundColor: AXM.panelBg, padding: 16 },
    headline: { fontFamily: FONTS.gothic, fontSize: 20, letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 },
    rows: { gap: 5, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: AXM.ash, paddingBottom: 3 },
    rowName: { flex: 1, fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment },
    rowVal: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur },
    noRows: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, textAlign: 'center' },
    coach: { fontFamily: FONTS.sans, fontSize: 11, color: '#c2a14e', textAlign: 'center', lineHeight: 15, marginTop: 6, paddingHorizontal: 4, letterSpacing: 0.2 },
    totals: { gap: 2, marginBottom: 8 },
    total: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    best: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 0.6, textAlign: 'center', marginBottom: 12 },
    btn: { borderWidth: 2, paddingVertical: 9, alignItems: 'center' },
    btnText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1 },
}));
