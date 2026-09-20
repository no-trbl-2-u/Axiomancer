/**
 * The enemy's played card — a short after-the-fact reveal of the foe's turn.
 *
 * User report (2026-08-10): "the enemy's card/attack — can we show the card to
 * the player for a moment so the player knows what happened on the enemy's
 * turn?" The threat sequence telegraphs the intent BEFORE the phase and the
 * floats show the numbers AFTER it, but nothing ever named the action itself,
 * so an END PHASE read as "some damage happened".
 *
 * The enemy holds no literal cards (it has a telegraphed threat sequence), so
 * this renders that phase's resolved action in the same card grammar the
 * player's own hand uses — a rail with the foe's name, the intent glyph, the
 * action sentence, and the payload as bright keyword lines.
 *
 * Presentation only: the shaping lives in the presenter
 * (`selectEnemyActionCard`), the card is non-interactive (`pointerEvents:
 * none`) so it can never eat a drag, and it dismisses itself on a timer.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { shouldInstantSettleJuice } from '@/lib/juice';
import type { EnemyActionCardVM } from '@/state/presenters/combat-encounter.engine';

/** Fade in, hold long enough to READ it, fade out. The hold is the whole point
 *  — anything under ~1.2s and a slow reader learns nothing. */
const ENTER_MS = 160;
const HOLD_MS = 1500;
const EXIT_MS = 240;

export const ENEMY_ACTION_CARD_TOTAL_MS = ENTER_MS + HOLD_MS + EXIT_MS;

export function EnemyActionCard({
    vm,
    enemyName,
    /** Rises per reveal — a repeat of the same action must replay, not sit still. */
    revealKey,
    onDone,
}: {
    vm: EnemyActionCardVM;
    enemyName: string;
    revealKey: number;
    onDone: () => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const accent = vm.denied ? AXM.sulfur : vm.color;

    const opacity = useSharedValue(0);
    const lift = useSharedValue(14);
    useEffect(() => {
        opacity.value = withTiming(1, { duration: ENTER_MS });
        lift.value = withTiming(0, { duration: ENTER_MS + 120 });
        const fade = setTimeout(() => { opacity.value = withTiming(0, { duration: EXIT_MS }); }, ENTER_MS + HOLD_MS);
        // The dismiss rides a JS timer, not an animation callback: the card is
        // information, so it must clear itself even where the tween never runs
        // (reduced motion, the e2e instant-settle hatch).
        const done = setTimeout(onDone, ENTER_MS + HOLD_MS + EXIT_MS);
        return () => { clearTimeout(fade); clearTimeout(done); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealKey]);
    // THE END-TURN CRASH (Sentry `CppException: Object is not a function`,
    // pinned 2026-09-04 after three unreproduced owner reports). This read
    // used to live INSIDE the worklet below. `shouldInstantSettleJuice` is a
    // plain JS function, so Reanimated serialized it into the UI runtime as
    // an OBJECT; calling it there threw a C++ exception on the UI thread that
    // no JS handler could catch, and Android killed the process — the app
    // "minimized" the instant the enemy's action card mounted, which is every
    // END PHASE. Web never reproduced it because Reanimated has no separate
    // UI runtime there and the call just works.
    //
    // Read it on the JS thread and let the worklet capture the BOOLEAN, which
    // serializes cleanly. This also reads the RIGHT global: the value lives on
    // the JS-thread `globalThis`, and the UI runtime has its own.
    const instantSettle = shouldInstantSettleJuice();
    const anim = useAnimatedStyle(() => ({
        opacity: instantSettle ? 1 : opacity.value,
        transform: [{ translateY: lift.value }],
    }));

    // One a11y sentence carrying everything the card says visually. "Denied"
    // is the foe's OWN blow being held, never "nothing landed" — the brood
    // bites through a hindered phase, and the sentence has to say so
    // (burn-day audit 3.3).
    const a11y = [
        vm.denied
            ? `${enemyName}'s action was denied${vm.addDealt > 0 ? `, but its brood bit you for ${vm.addDealt}` : ''}`
            : `${enemyName} ${vm.label.toLowerCase()}`,
        vm.actionText,
        vm.lines.map((l) => l.text).join(', '),
    ].filter((s) => s.length > 0).join('. ');

    return (
        <View style={styles.layer} pointerEvents="none" testID="combat-enemy-action-card">
            <Animated.View
                style={[styles.card, { borderColor: accent }, anim]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={a11y}
            >
                {/* rail — the foe's name down the left edge, mirroring the hand
                    card's name rail so the reveal reads as "their card" */}
                <View style={[styles.rail, { backgroundColor: accent }]}>
                    <View style={styles.railRotor}>
                        <Text style={styles.railLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} allowFontScaling={false}>
                            {enemyName.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.body}>
                    <Text style={[styles.phase, { color: AXM.bone }]} allowFontScaling={false}>
                        PHASE {vm.phaseIndex}
                    </Text>
                    <Text style={[styles.glyph, { color: accent }]} allowFontScaling={false}>{vm.icon}</Text>
                    {/* Never a bare DENIED while the brood is still biting —
                        the same honesty rule `IntentIcon`'s wall-math readout
                        follows. `adjustsFontSizeToFit` because the honest form
                        is the long one. */}
                    <Text
                        style={[styles.label, { color: accent }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                        allowFontScaling={false}
                    >
                        {vm.denied ? (vm.addDealt > 0 ? `DENIED · BROOD −${vm.addDealt}` : 'DENIED') : vm.label}
                    </Text>
                    <Text style={styles.action} numberOfLines={3}>{vm.actionText}</Text>
                    {vm.lines.length > 0 && (
                        <View style={styles.lines}>
                            {vm.lines.map((l, i) => (
                                <Text
                                    key={`${l.text}-${i}`}
                                    style={[styles.line, { color: l.color, borderColor: `${l.color}66` }, vm.denied && l.source === 'telegraph' && styles.lineDenied]}
                                    numberOfLines={1}
                                    allowFontScaling={false}
                                >
                                    {l.text}
                                </Text>
                            ))}
                        </View>
                    )}
                    {vm.denied && (
                        <Text style={[styles.deniedNote, { color: AXM.sulfur }]} numberOfLines={2}>
                            {vm.addDealt > 0
                                ? 'your control held — its brood bit anyway'
                                : 'your control held — none of it landed'}
                        </Text>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const CARD_W = 214;
const RAIL_W = 20;
const CARD_H = 250;

const useStyles = makeStyles((AXM) => ({
    // Sits over the battlefield band, clear of the hand — the player must still
    // see the foe react underneath the card that names the reaction.
    layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 45 },
    card: {
        width: CARD_W,
        height: CARD_H,
        flexDirection: 'row',
        borderWidth: 2,
        backgroundColor: AXM.panelBg,
        boxShadow: `0 0 0 1px ${AXM.bg}, 0 10px 30px ${AXM.shadow}`,
    },
    rail: { width: RAIL_W },
    railRotor: {
        position: 'absolute',
        left: (RAIL_W - CARD_H) / 2,
        top: (CARD_H - RAIL_W) / 2,
        width: CARD_H,
        height: RAIL_W,
        transform: [{ rotate: '-90deg' }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    railLabel: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.bg },
    body: { flex: 1, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 },
    phase: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1.6 },
    glyph: { fontSize: 42, lineHeight: 48, marginTop: 2 },
    label: { fontFamily: FONTS.gothic, fontSize: 20, letterSpacing: 1.4, marginTop: 2 },
    action: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 12,
        lineHeight: 16,
        color: AXM.parchment,
        textAlign: 'center',
        marginTop: 6,
    },
    lines: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 9 },
    line: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 0.8,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    // A denied payload is what DIDN'T happen — struck through, dimmed.
    lineDenied: { opacity: 0.5, textDecorationLine: 'line-through' },
    deniedNote: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, textAlign: 'center', marginTop: 8 },
}));
