/**
 * Hazard remove-card grid overlay (Phase 126).
 *
 * A full-screen modal that lays the player's removable (acquired)
 * Hazard cards out in a tap-to-select grid. The player picks one card,
 * confirms, and — once `axiomancer-mechanics` exposes a remove-card
 * action — that card leaves the deck.
 *
 * Until then the confirm is BLOCKED: the brief (Phase 126 §3) forbids
 * implementing deck-mutation rules locally, so confirming surfaces a
 * graceful, dismissible blocked banner (`removeBlockedReason`) and the
 * save is left untouched. The grid stays fully usable for inspection.
 *
 * Pure presentational: selection state is local, the blocked reason +
 * card list arrive on props. Reuses the canonical `HazardCard` 'offer'
 * stock so cards read identically to the encounter hand.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { usePalette } from '@/theme/runtime';
import type { HazardDeckEntryVM } from '@/state/presenters/hazard-deck.engine';

import { HazardCard } from './HazardCard';
import { HZ } from './palette';

export function HazardRemoveGrid({
    entries,
    blocked,
    blockedReason,
    onClose,
    onConfirm,
}: {
    /** Removable (acquired) deck entries — one tile per distinct card. */
    entries: HazardDeckEntryVM[];
    /** Remove-card is not yet wired to an engine action. */
    blocked: boolean;
    /** Player-facing copy shown when a removal is confirmed while blocked. */
    blockedReason: string;
    onClose: () => void;
    /** Fired with the chosen card id on confirm (no-op writes while blocked). */
    onConfirm: (cardId: string) => void;
}) {
    const AXM = usePalette();
    const [selected, setSelected] = useState<string | null>(null);
    const [showBlocked, setShowBlocked] = useState(false);

    const onConfirmPress = useCallback(() => {
        if (selected === null) return;
        if (blocked) {
            setShowBlocked(true);
            return;
        }
        onConfirm(selected);
    }, [selected, blocked, onConfirm]);

    const empty = entries.length === 0;

    return (
        <View style={styles.root} testID="hazard-remove-grid">
            <View style={styles.header}>
                <Text style={[styles.title, { color: AXM.parchment }]}>THIN THE DECK</Text>
                <Text style={[styles.sub, { color: AXM.bone }]}>
                    {empty
                        ? 'No acquired cards to remove yet.'
                        : 'Choose one acquired card to cut.'}
                </Text>
                <Pressable
                    style={[styles.close, { borderColor: AXM.ash }]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close remove-card grid"
                    testID="hazard-remove-close"
                >
                    <Text style={[styles.closeLabel, { color: AXM.bone }]}>✕</Text>
                </Pressable>
            </View>

            {empty ? (
                <View style={styles.emptyBox}>
                    <Text style={[styles.emptyHint, { color: AXM.bone }]}>
                        The starter bag is fixed — only cards you pick up from hazards can be cut.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                    {entries.map((entry) => {
                        const isSel = selected === entry.cardId;
                        return (
                            <Pressable
                                key={entry.cardId}
                                style={[styles.tile, isSel && { borderColor: HZ.acid, backgroundColor: 'rgba(134,168,33,0.12)' }]}
                                onPress={() => setSelected(isSel ? null : entry.cardId)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSel }}
                                accessibilityLabel={`${entry.card.name}${entry.acquiredCount > 1 ? `, ${entry.acquiredCount} copies` : ''}${isSel ? ', selected' : ''}`}
                                testID={`hazard-remove-tile-${entry.cardId}`}
                            >
                                <HazardCard card={entry.card} mode="offer" />
                                {entry.acquiredCount > 1 && (
                                    <View style={[styles.countPip, { backgroundColor: AXM.rust }]}>
                                        <Text style={styles.countPipText}>×{entry.acquiredCount}</Text>
                                    </View>
                                )}
                                {isSel && (
                                    <View pointerEvents="none" style={[styles.selMark, { borderColor: HZ.acid }]}>
                                        <Text style={[styles.selMarkText, { color: HZ.acid }]}>CUT</Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {showBlocked && (
                <View style={[styles.blockedBanner, { borderColor: AXM.sulfur, backgroundColor: 'rgba(0,0,0,0.78)' }]} testID="hazard-remove-blocked">
                    <Text style={[styles.blockedTitle, { color: AXM.sulfur }]}>NOT YET</Text>
                    <Text style={[styles.blockedBody, { color: AXM.parchment }]}>{blockedReason}</Text>
                    <Pressable
                        style={[styles.blockedBtn, { borderColor: AXM.sulfur }]}
                        onPress={() => setShowBlocked(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss removal-unavailable notice"
                        testID="hazard-remove-blocked-dismiss"
                    >
                        <Text style={[styles.blockedBtnText, { color: AXM.sulfur }]}>UNDERSTOOD</Text>
                    </Pressable>
                </View>
            )}

            {!empty && (
                <View style={styles.footer}>
                    <Pressable
                        style={[
                            styles.confirm,
                            { borderColor: selected === null ? AXM.ash : HZ.acid },
                            selected === null && styles.confirmDisabled,
                        ]}
                        onPress={onConfirmPress}
                        disabled={selected === null}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: selected === null }}
                        accessibilityLabel="Confirm card removal"
                        testID="hazard-remove-confirm"
                    >
                        <Text style={[styles.confirmLabel, { color: selected === null ? AXM.bone : HZ.acid }]}>
                            {selected === null ? 'PICK A CARD' : 'CUT THIS CARD'}
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0c0a08', zIndex: 50, paddingTop: 54 },
    header: { paddingHorizontal: 20, paddingBottom: 8 },
    title: { fontFamily: FONTS.gothic, fontSize: 24, letterSpacing: 1 },
    sub: { fontFamily: FONTS.serif, fontSize: 13, marginTop: 2 },
    close: { position: 'absolute', top: 0, right: 16, width: 34, height: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    closeLabel: { fontFamily: FONTS.mono, fontSize: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
    tile: { borderWidth: 1.5, borderColor: 'transparent', padding: 3 },
    countPip: { position: 'absolute', top: -4, left: -4, minWidth: 22, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    countPipText: { fontFamily: FONTS.mono, fontSize: 10, color: '#0c0a08' },
    selMark: { position: 'absolute', bottom: 6, right: 6, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
    selMarkText: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1.5 },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyHint: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    blockedBanner: { position: 'absolute', left: 24, right: 24, bottom: 100, borderWidth: 1.5, padding: 18 },
    blockedTitle: { fontFamily: FONTS.gothic, fontSize: 18, letterSpacing: 2 },
    blockedBody: { fontFamily: FONTS.serif, fontSize: 14, lineHeight: 19, marginTop: 6 },
    blockedBtn: { alignSelf: 'flex-end', marginTop: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
    blockedBtnText: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.5 },
    footer: { paddingHorizontal: 20, paddingVertical: 16 },
    confirm: { borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
    confirmDisabled: { opacity: 0.6 },
    confirmLabel: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 2 },
});
