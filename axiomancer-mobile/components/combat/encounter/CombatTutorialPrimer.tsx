/**
 * Hazard-pattern combat — first-fight primer (mobile UI layer only; no rules).
 *
 * A short, swipe-through stack of full-screen panels shown ONCE before the
 * player's first hazard-pattern fight (and on demand from the dev menu). It sets
 * the core concepts and tone — pressure over health, the two win conditions, the
 * four-dice stage-then-power loop (spec 33) — then hands off to the live board,
 * where the `CombatTutorialCoach` guides turn one by doing.
 *
 * Styled after `HazardIntroOverlay`, extended to paging. The parent owns the
 * completion dispatch: BEGIN fires `onBegin`, SKIP fires `onSkip`.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Haptics } from '@/lib/platform/haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

interface PrimerPanel {
    eyebrow: string;
    title: string;
    body: string;
}

const PANELS: PrimerPanel[] = [
    {
        eyebrow: '⚔ A NEW KIND OF FIGHT',
        title: 'ONE BAR, MANY BLADES',
        // S1-board-C35 — this line used to promise 'the Surge meter', a readout
        // the board never draws; MOMENTUM is the chip that is actually there.
        body:
            'The enemy has ONE bar: VITAE. Wear it to nothing — strikes, statuses, Conviction, ' +
            'MOMENTUM and your dice all compete on merit. A clever read turns the fight.',
    },
    {
        eyebrow: 'BLEED & BIND',
        title: 'POISON, STEAL THEIR TURN, OR JUST HIT HARD',
        body:
            'A DoT (POISON, BLEED) drains their VITAE every turn. STAGGER strips rungs from ' +
            'their telegraphed action: at zero it is denied outright. A strike takes VITAE ' +
            'straight off the top — no wrong answer. Befriend a low-VITAE foe to spare it.',
    },
    {
        eyebrow: 'DICE & CARDS',
        title: 'STAGE, THEN POWER',
        body:
            'Each turn you roll FOUR dice — Red (BODY), Blue (MIND), Purple (HEART) and Gold ' +
            '(WILD). A MANA face powers one card of its colour; Gold powers any colour; a ' +
            'SPECIAL face powers a card AND grants 2◆ Conviction; a MISS is dead. Drag a card up ' +
            'into the PLAY AREA, drop a matching die on it and APPLY — or APPLY with no die for ' +
            'its weaker FREE line. Every usable die can power a card, so play several in one turn.',
    },
    {
        eyebrow: 'THE LEFT EDGE',
        title: 'SIGNATURES COST CONVICTION, NOT DICE',
        // UI fresh-eyes 2026-09-12 §4.2 — the rune column stays compact by
        // owner design; its names live in long-press, not printed labels. The
        // primer is where a first-time player learns that reflex exists.
        body:
            'Down the left edge sit your SIGNATURES — a few personal moves paid in ◆ CONVICTION ' +
            'instead of a die. Tap an affordable rune to fire it. Long-press ANY rune, spent or ' +
            'not, to read exactly what it does before you commit.',
    },
];

export function CombatTutorialPrimer({
    onBegin,
    onSkip,
}: {
    onBegin: () => void;
    onSkip: () => void;
}) {
    const styles = useStyles();
    const [page, setPage] = useState(0);
    const isLast = page >= PANELS.length - 1;
    const panel = PANELS[page];

    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }, [page]);

    const onNext = () => {
        if (isLast) {
            onBegin();
        } else {
            setPage((p) => p + 1);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(220)} style={styles.root} testID="combat-tutorial-primer">
            <Animated.View key={page} entering={FadeInDown.duration(300)} style={styles.panel}>
                <Text style={styles.eyebrow}>{panel.eyebrow}</Text>
                <Text style={styles.title}>{panel.title}</Text>

                <Text style={styles.body}>{panel.body}</Text>

                <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${PANELS.length}`}>
                    {PANELS.map((_, i) => (
                        <View key={i} style={[styles.dot, i === page ? styles.dotOn : null]} />
                    ))}
                </View>

                <View style={styles.btnRow}>
                    <Pressable
                        onPress={onSkip}
                        accessibilityRole="button"
                        accessibilityLabel="Skip the combat tutorial"
                        testID="combat-primer-skip"
                        style={styles.skip}
                    >
                        <Text style={styles.skipText}>SKIP</Text>
                    </Pressable>
                    <Pressable
                        onPress={onNext}
                        accessibilityRole="button"
                        accessibilityLabel={isLast ? 'Enter the fight' : 'Next page'}
                        testID={isLast ? 'combat-primer-begin' : 'combat-primer-next'}
                        style={styles.cta}
                    >
                        <Text style={styles.ctaText}>{isLast ? 'ENTER THE FIGHT ›' : 'NEXT ›'}</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 70,
        backgroundColor: 'rgba(6,5,4,0.94)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    panel: {
        width: '100%',
        maxWidth: 360,
        borderWidth: 2,
        borderColor: AXM.sulfur,
        backgroundColor: '#100d0a',
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 3, color: AXM.sulfur, textAlign: 'center' },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 29,
        color: AXM.parchment,
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 6,
    },
    body: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 20,
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 16,
    },
    dots: { flexDirection: 'row', gap: 7, marginTop: 18 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: AXM.ash },
    dotOn: { backgroundColor: AXM.sulfur },
    btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 18 },
    skip: { borderWidth: 1, borderColor: AXM.ash, paddingVertical: 9, paddingHorizontal: 18 },
    skipText: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.5, color: AXM.bone },
    cta: {
        borderWidth: 1.5,
        borderColor: AXM.sulfur,
        backgroundColor: 'rgba(212,192,38,0.16)',
        paddingVertical: 9,
        paddingHorizontal: 22,
    },
    ctaText: { fontFamily: FONTS.gothic, fontSize: 16, letterSpacing: 1.5, color: AXM.parchment },
}));
