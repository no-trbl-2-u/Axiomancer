/**
 * Spec 26b §C — deckbuilder card reward. After a won combat, the player picks
 * one of three cards to add to their persistent combat deck (or skips). Mirrors
 * the Hazard `RewardsOverlay` pick-1-of-N pattern, combat-flavored.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type { CombatRewardOfferVM } from '@/state/presenters/combat-encounter.engine';

const EFFECT_GLYPH: Record<string, string> = { dot: '🔥 DoT', control: '⛓ Control', none: '◆ Utility' };

export function CombatRewardsOverlay({ offers, onPick }: { offers: CombatRewardOfferVM[]; onPick: (cardId: string | null) => void }) {
    const AXM = usePalette();
    const styles = useStyles();
    const [picked, setPicked] = useState<string | null>(null);
    return (
        <View style={styles.backdrop} testID="combat-rewards">
            <View style={[styles.panel, { borderColor: AXM.sulfur }]}>
                <Text style={styles.eyebrow}>✦ SPOILS</Text>
                <Text style={styles.title}>Add a card to your deck</Text>
                <Text style={styles.sub}>your deck grows as you fight — pick one, or leave them</Text>
                <View style={styles.offerRow}>
                    {offers.map((o) => {
                        const on = picked === o.cardId;
                        return (
                            <Pressable
                                key={o.cardId}
                                onPress={() => setPicked(on ? null : o.cardId)}
                                testID={`combat-reward-${o.cardId}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                accessibilityLabel={`${o.name}, ${o.stance} ${o.effectKind} card. ${o.text}${on ? ', selected' : ''}`}
                                style={[styles.offer, { borderColor: on ? AXM.sulfur : o.stanceColor, backgroundColor: on ? 'rgba(212,192,38,0.16)' : '#16130c' }]}
                            >
                                <View style={[styles.stanceBar, { backgroundColor: o.stanceColor }]} />
                                <Text style={styles.offerName} numberOfLines={2}>{o.name}</Text>
                                <Text style={[styles.offerTrack, { color: o.stanceColor }]}>{EFFECT_GLYPH[o.effectKind] ?? o.effectKind}</Text>
                                <Text style={styles.offerMeta}>{o.stance.toUpperCase()} · T{o.tier}</Text>
                                {o.effectKind !== 'none' ? <Text style={styles.offerPrev}>+{o.preview} {o.effectKind === 'dot' ? 'damage' : 'effect'}</Text> : null}
                            </Pressable>
                        );
                    })}
                </View>
                <View style={styles.btnRow}>
                    <Pressable onPress={() => onPick(null)} testID="combat-reward-skip" accessibilityRole="button" accessibilityLabel="Skip the reward" style={[styles.btn, { borderColor: AXM.bone }]}>
                        <Text style={[styles.btnText, { color: AXM.bone }]}>SKIP</Text>
                    </Pressable>
                    <Pressable
                        disabled={!picked}
                        onPress={() => onPick(picked)}
                        testID="combat-reward-confirm"
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !picked }}
                        accessibilityLabel="Take the selected card"
                        style={[styles.btn, { borderColor: picked ? AXM.sulfur : AXM.ash, opacity: picked ? 1 : 0.5 }]}
                    >
                        <Text style={[styles.btnText, { color: picked ? AXM.sulfur : AXM.bone }]}>TAKE CARD</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    backdrop: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 },
    panel: { width: '100%', maxWidth: 400, borderWidth: 2, backgroundColor: AXM.panelBg, padding: 16, alignItems: 'center' },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.sulfur, marginBottom: 4 },
    title: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.parchment, textAlign: 'center' },
    sub: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 12, color: AXM.bone, textAlign: 'center', marginTop: 3, marginBottom: 14 },
    offerRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    offer: { width: 104, minHeight: 132, borderWidth: 2, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 8, overflow: 'hidden' },
    stanceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    offerName: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment, marginLeft: 4, lineHeight: 16 },
    offerTrack: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 0.5, marginLeft: 4, marginTop: 6 },
    offerMeta: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, marginLeft: 4, marginTop: 2, letterSpacing: 0.4 },
    offerPrev: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.parchment, marginLeft: 4, marginTop: 6 },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    btn: { borderWidth: 2, paddingHorizontal: 22, paddingVertical: 9 },
    btnText: { fontFamily: FONTS.gothic, fontSize: 15, letterSpacing: 1 },
}));
