/**
 * Spec 26b §C — the post-combat card draft. After a won combat the player adds
 * ONE of three offered cards to their persistent deck, or keeps the deck lean.
 *
 * 2026-08-08 rebuild. Two things changed:
 *
 *  1. REAL CARD FACES. The tiles used to be bespoke 104x132 mini-cards that
 *     re-derived a slice of face logic (name, effect glyph, tier line) the
 *     card-face-honesty guard could not see. They now render `CombatCardFace`
 *     off a real `CombatCardVM` — byte-identical to the face the card will
 *     show in hand. A card you are committing to for the rest of the run must
 *     be readable BEFORE you commit, so tapping a tile opens a full inspect
 *     (the hazard `RewardsOverlay`'s `hazard-card-preview` pattern): the large
 *     face, its keyword definitions, and the flavor.
 *
 *  2. SKIP IS A CHOICE, not an escape hatch. It carries its own line — a lean
 *     deck draws its good cards more often — and is styled as a peer of TAKE,
 *     not a greyed-out afterthought. The Threadbare Office exists to teach
 *     exactly that.
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CombatCardFace } from '@/components/combat/encounter/CombatBoard';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type { CombatCardVM } from '@/state/presenters/combat-encounter.engine';

/** Offer-tile face size. Smaller than the hand card (three must fit a phone
 *  width side by side) but the SAME face component at the same aspect. */
const OFFER_W = 100;
const OFFER_H = 147;
/** Inspect-preview face size. */
const PREVIEW_W = 208;
const PREVIEW_H = 305;

const RARITY_COLORS: Record<string, string> = {
    rare: '#9a6ad6',
    uncommon: '#6b8eb0',
    common: '#8a8273',
};

export function CombatRewardsOverlay({
    offers,
    onPick,
}: {
    offers: CombatCardVM[];
    onPick: (cardId: string | null) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const [picked, setPicked] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const previewCard = preview ? offers.find((o) => o.cardId === preview) ?? null : null;

    return (
        <View style={styles.backdrop} testID="combat-rewards">
            <View style={[styles.panel, { borderColor: AXM.sulfur }]}>
                <Text style={styles.eyebrow}>✦ SPOILS</Text>
                <Text style={styles.title}>Add a card to your deck</Text>
                <Text style={styles.sub}>your deck grows as you fight — tap a card to read it</Text>

                <View style={styles.offerRow}>
                    {offers.map((card) => {
                        const on = picked === card.cardId;
                        const rarityColor = RARITY_COLORS[card.rarity ?? 'common'] ?? RARITY_COLORS.common;
                        return (
                            <Pressable
                                key={card.cardId}
                                onPress={() => setPreview(card.cardId)}
                                testID={`combat-reward-${card.cardId}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                accessibilityLabel={`${card.name}, ${card.rarity ?? 'common'} ${card.stance} card. ${card.detail.outcomeLine}. Tap to read it in full${on ? ', selected' : ''}`}
                                style={[
                                    styles.offerFrame,
                                    {
                                        borderColor: on ? AXM.sulfur : rarityColor,
                                        backgroundColor: on ? 'rgba(212,192,38,0.16)' : 'transparent',
                                        transform: [{ translateY: on ? -6 : 0 }],
                                    },
                                ]}
                            >
                                <CombatCardFace card={card} width={OFFER_W} height={OFFER_H} />
                                {on && (
                                    <View style={[styles.pickedBadge, { backgroundColor: AXM.sulfur }]}>
                                        <Text style={styles.pickedBadgeText}>✓</Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.btnRow}>
                    <Pressable
                        onPress={() => onPick(null)}
                        testID="combat-reward-skip"
                        accessibilityRole="button"
                        accessibilityLabel="Take nothing — keep the deck lean"
                        style={[styles.btn, { borderColor: AXM.bone }]}
                    >
                        <Text style={[styles.btnText, { color: AXM.parchment }]}>TAKE NOTHING</Text>
                        <Text style={styles.btnNote}>a lean deck draws its best more often</Text>
                    </Pressable>
                    <Pressable
                        disabled={!picked}
                        onPress={() => onPick(picked)}
                        testID="combat-reward-confirm"
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !picked }}
                        accessibilityLabel="Take the selected card"
                        style={[styles.btn, { borderColor: picked ? AXM.sulfur : AXM.ash, opacity: picked ? 1 : 0.55 }]}
                    >
                        <Text style={[styles.btnText, { color: picked ? AXM.sulfur : AXM.bone }]}>TAKE CARD</Text>
                        <Text style={styles.btnNote}>{picked ? 'it joins your deck for the run' : 'choose a card first'}</Text>
                    </Pressable>
                </View>
            </View>

            {/* tap-to-inspect — the FULL face plus its keyword definitions, so
                nothing is committed to the run unread. */}
            {previewCard && (
                <View style={styles.previewOverlay} testID="combat-reward-preview">
                    <View style={[styles.previewPanel, { borderColor: previewCard.face.categoryColor }]}>
                        <ScrollView contentContainerStyle={styles.previewScroll}>
                            <CombatCardFace card={previewCard} width={PREVIEW_W} height={PREVIEW_H} large />
                            {/* The face carries only KEYWORD · value since the 2026-08-10
                                declutter, so the preview states the two plays itself —
                                "nothing is committed to the run unread" still has to hold. */}
                            <View style={styles.previewPlays}>
                                <Text style={styles.previewPlayLine}>
                                    <Text style={styles.previewPlayTag}>◇ NO DIE  </Text>
                                    {previewCard.detail.freePill}
                                </Text>
                                <Text style={styles.previewPlayLine}>
                                    <Text style={[styles.previewPlayTag, { color: previewCard.face.categoryColor }]}>◆ +DIE  </Text>
                                    {previewCard.detail.diePaidLine ?? previewCard.detail.outcomeLine}
                                </Text>
                            </View>
                            {previewCard.detail.keywords.length > 0 && (
                                <View style={styles.previewKeywords}>
                                    {previewCard.detail.keywords.map((kw) => (
                                        <Text key={kw.name} style={styles.previewKeywordLine}>
                                            <Text style={[styles.previewKeywordName, { color: previewCard.face.categoryColor }]}>{kw.name}</Text>
                                            {' — ' + kw.def}
                                        </Text>
                                    ))}
                                </View>
                            )}
                            {previewCard.flavor ? (
                                <Text style={styles.previewFlavor} testID="combat-reward-preview-flavor">{previewCard.flavor}</Text>
                            ) : null}
                        </ScrollView>
                        <View style={styles.previewActions}>
                            <Pressable
                                onPress={() => setPreview(null)}
                                testID="combat-reward-preview-close"
                                accessibilityRole="button"
                                accessibilityLabel="Back to the offers"
                                style={[styles.previewBtn, { borderColor: AXM.ash }]}
                            >
                                <Text style={[styles.previewBtnText, { color: AXM.bone }]}>BACK</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setPicked(previewCard.cardId);
                                    setPreview(null);
                                }}
                                testID="combat-reward-preview-select"
                                accessibilityRole="button"
                                accessibilityLabel={`Choose ${previewCard.name}`}
                                style={[styles.previewBtn, { borderColor: AXM.sulfur, backgroundColor: 'rgba(212,192,38,0.14)' }]}
                            >
                                <Text style={[styles.previewBtnText, { color: AXM.sulfur }]}>CHOOSE THIS</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 12, zIndex: 60 },
    panel: { width: '100%', maxWidth: 420, borderWidth: 2, backgroundColor: AXM.panelBg, paddingHorizontal: 12, paddingVertical: 16, alignItems: 'center' },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.sulfur, marginBottom: 4 },
    title: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.parchment, textAlign: 'center' },
    sub: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.bone, textAlign: 'center', marginTop: 3, marginBottom: 14 },
    offerRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    offerFrame: { borderWidth: 2, padding: 3 },
    pickedBadge: { position: 'absolute', top: -9, right: -9, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    pickedBadgeText: { fontFamily: FONTS.gothic, fontSize: 14, color: '#0a0a0a' },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
    btn: { flex: 1, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 9, alignItems: 'center' },
    btnText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1 },
    btnNote: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.bone, letterSpacing: 0.3, marginTop: 3, textAlign: 'center' },
    previewOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 70, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 14 },
    previewPanel: { width: '100%', maxWidth: 400, maxHeight: '92%', borderWidth: 2, backgroundColor: AXM.panelBg, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 },
    previewScroll: { alignItems: 'center', paddingBottom: 10 },
    previewPlays: { marginTop: 12, alignSelf: 'stretch', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.16)' },
    previewPlayLine: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, lineHeight: 18, marginBottom: 4 },
    previewPlayTag: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.bone },
    previewKeywords: { marginTop: 14, alignSelf: 'stretch' },
    previewKeywordLine: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, lineHeight: 18, marginBottom: 5 },
    previewKeywordName: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2 },
    previewFlavor: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    previewActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    previewBtn: { flex: 1, borderWidth: 2, paddingVertical: 11, alignItems: 'center' },
    previewBtnText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1.5 },
}));
