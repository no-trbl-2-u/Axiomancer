/**
 * /cutscene — the dedicated narration screen (Phase 137).
 *
 * A cutscene event plays its authored lines one at a time: tap to
 * reveal the next line, with revealed lines stacking like a page
 * being written. SKIP reveals everything; the final tap dismisses
 * the event. Component-local cursor only — the engine already
 * resolved the event; nothing here touches rules.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export default function CutsceneScreen() {
    const styles = useStyles();
    const slice = useGameState((s) => s.event);
    const actions = useGameActions();
    const router = useRouter();

    const lines: readonly string[] = useMemo(() => {
        const pending = slice?.pending;
        if (!pending || pending.event.kind !== 'cutscene') return [];
        return pending.event.lines;
    }, [slice]);

    const active = lines.length > 0;
    const [revealed, setRevealed] = useState(1);
    const allRevealed = revealed >= lines.length;

    useEffect(() => {
        if (!active && router.canGoBack()) router.back();
    }, [active, router]);

    if (!active) return <ScreenBg><View /></ScreenBg>;

    const onAdvance = () => {
        if (!allRevealed) {
            setRevealed(n => n + 1);
            return;
        }
        actions.dismissEvent();
    };

    return (
        <ScreenBg>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={allRevealed ? 'End the scene' : 'Reveal the next line'}
                activeOpacity={0.9}
                onPress={onAdvance}
                style={styles.flexOne}
                testID="cutscene-advance"
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.eyebrow}>▶ OMEN</Text>
                    {lines.slice(0, revealed).map((line, i) => (
                        <Text
                            key={i}
                            style={[styles.line, i === revealed - 1 && styles.lineCurrent]}
                            testID={`cutscene-line-${i}`}
                        >
                            {line}
                        </Text>
                    ))}
                    <Text style={styles.hint}>
                        {allRevealed ? '· tap to walk on ·' : '· tap ·'}
                    </Text>
                </ScrollView>
            </TouchableOpacity>
            {!allRevealed && (
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Skip to the end"
                    onPress={() => setRevealed(lines.length)}
                    style={styles.skip}
                    testID="cutscene-skip"
                >
                    <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
            )}
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scroll: { padding: 20, paddingTop: 40, paddingBottom: 60 },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.sulfur,
        marginBottom: 16,
    },
    line: {
        fontFamily: FONTS.serif,
        fontSize: 15,
        lineHeight: 24,
        color: AXM.bone,
        marginBottom: 14,
    },
    lineCurrent: { color: AXM.parchment },
    hint: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 2,
        color: AXM.ash,
        textAlign: 'center',
        marginTop: 16,
    },
    skip: { position: 'absolute', top: 14, right: 14, padding: 8 },
    skipText: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: AXM.bone },
    flexOne: { flex: 1 },
}));
