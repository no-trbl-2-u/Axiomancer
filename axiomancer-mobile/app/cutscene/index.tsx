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
import { useRouter } from '@/lib/platform/router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameState } from '@/state/GameStoreProvider';
import { FONTS, TYPE } from '@/theme/axm';
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

    // Inactive shell — visible for a frame while the router unwinds; never a
    // blank screen (UI-cleanup pass, CRITIQUE).
    if (!active) {
        return (
            <ScreenBg scrollable={false} art="cutscene">
                <View style={styles.inactiveWrap} testID="cutscene-inactive">
                    <Text style={styles.inactiveText}>Nothing here. The road went on.</Text>
                </View>
            </ScreenBg>
        );
    }

    const onAdvance = () => {
        if (!allRevealed) {
            setRevealed(n => n + 1);
            return;
        }
        actions.dismissEvent();
    };

    return (
        <ScreenBg art="cutscene">
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
                    activeOpacity={0.7}
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
        color: AXM.bone,
        textAlign: 'center',
        marginTop: 16,
    },
    // S4-world-C17: SKIP was a 10px bone caption with 8px of padding —
    // it read as chrome, not a control, and its target was well under a
    // thumb. Given a bordered plate, a legible label, and a 44pt minimum
    // box, it looks pressable and can be hit.
    skip: {
        position: 'absolute',
        top: 14,
        right: 14,
        minWidth: 84,
        minHeight: 44,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AXM.parchmentMed,
        backgroundColor: AXM.overlay,
    },
    skipText: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 3,
        color: AXM.parchment,
    },
    flexOne: { flex: 1 },
    inactiveWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    inactiveText: { ...TYPE.body, color: AXM.parchment, opacity: 0.55, textAlign: 'center' },
}));
