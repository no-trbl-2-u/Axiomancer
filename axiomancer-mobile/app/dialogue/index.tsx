/**
 * /dialogue — the dedicated NPC interaction screen (Phase 137).
 *
 * Renders the same composed event view-model the generic modal used
 * (dialogue-cursor walking, alignment/quest gating, consequence
 * chips all live in `state/presenters/event.engine`), with chrome
 * built for a conversation: nameplate, spoken text panel, replies.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { isDialogueAppliedEvent } from 'axiomancer-mechanics';

import { ScreenBg } from '@/components/ScreenBg';
import { useGameActions, useGameEvents, useGameState } from '@/state/GameStoreProvider';
import {
    selectEventViewModel,
    selectHasActiveEvent,
    type EventChoice,
} from '@/state/presenters/event.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

/** How long the dialogue-confirmation ✓ stays visible (ported from
 *  the pre-Phase-137 event modal's Tick C). */
const DIALOGUE_CONFIRM_TTL_MS = 500;

function ReplyRow({
    choice,
    confirmed,
    onPress,
}: {
    choice: EventChoice;
    confirmed: boolean;
    onPress: () => void;
}) {
    const styles = useStyles();
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${choice.label}, ${choice.description}`}
            accessibilityState={{ disabled: !choice.enabled }}
            disabled={!choice.enabled}
            onPress={onPress}
            style={[styles.replyRow, { opacity: choice.enabled ? 1 : 0.4 }]}
            testID={`dialogue-choice-${choice.id}`}
        >
            <Text style={styles.replyMark}>—</Text>
            <View style={styles.flexOne}>
                <Text style={styles.replyLabel}>{choice.label}</Text>
                {choice.description.length > 0 && (
                    <Text style={styles.replyDesc}>{choice.description}</Text>
                )}
            </View>
            {confirmed && (
                <Text
                    style={styles.replyConfirm}
                    testID={`dialogue-choice-${choice.id}-confirmed`}
                    accessibilityLiveRegion="polite"
                >
                    ✓
                </Text>
            )}
        </TouchableOpacity>
    );
}

export default function DialogueScreen() {
    const styles = useStyles();
    // Same stable-slice subscription doctrine as the event screen —
    // the presenter returns a fresh frozen object per call.
    const slice = useGameState((s) => s.event);
    const quests = useGameState((s) => s.quests);
    const flags = useGameState((s) => s.flags);
    const vm = useMemo(
        () => selectEventViewModel({ event: slice, quests, flags } as never),
        [slice, quests, flags],
    );
    const hasEvent = useMemo(
        () => selectHasActiveEvent({ event: slice } as never),
        [slice],
    );
    const actions = useGameActions();
    const router = useRouter();

    // When the engine emits `dialogue:applied`, briefly flash a ✓ next
    // to the matching reply so the player sees their pick land before
    // the next dialogue node renders. Component-local state — the
    // flash is intentionally ephemeral. (Ported from the event modal.)
    const [lastConfirmedChoiceId, setLastConfirmedChoiceId] =
        useState<string | null>(null);
    const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useGameEvents((event) => {
        if (!isDialogueAppliedEvent(event)) return;
        // The engine dispatches APPLY_DIALOGUE with payload {tree, choice};
        // the emitted event surfaces it via payload.action.payload.choice.
        const payload = event.payload as unknown as {
            action?: { payload?: { choice?: { id?: string } } };
            choice?: { id?: string };
        };
        const choiceId: string | undefined =
            payload?.action?.payload?.choice?.id ?? payload?.choice?.id;
        if (typeof choiceId !== 'string' || choiceId.length === 0) return;
        setLastConfirmedChoiceId(choiceId);
        if (confirmTimerRef.current !== null) {
            clearTimeout(confirmTimerRef.current);
        }
        confirmTimerRef.current = setTimeout(() => {
            setLastConfirmedChoiceId(null);
            confirmTimerRef.current = null;
        }, DIALOGUE_CONFIRM_TTL_MS);
    });

    useEffect(
        () => () => {
            if (confirmTimerRef.current !== null) {
                clearTimeout(confirmTimerRef.current);
            }
        },
        [],
    );

    useEffect(() => {
        if (!hasEvent && router.canGoBack()) router.back();
    }, [hasEvent, router]);

    if (!hasEvent) return <ScreenBg><View /></ScreenBg>;

    return (
        <ScreenBg scrollable={false}>
            <ScrollView style={styles.scrollOuter} contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>◉ PARLEY</Text>
                <View style={styles.nameplate} testID="dialogue-nameplate">
                    <Text style={styles.name}>{vm.title}</Text>
                    {vm.subtitle.length > 0 && <Text style={styles.subtitle}>{vm.subtitle}</Text>}
                </View>

                <View style={styles.speech} testID="dialogue-speech">
                    <Text style={styles.speechText}>{vm.body}</Text>
                </View>

                <Text style={styles.sectionLabel}>{vm.chrome.reckoningEyebrow}</Text>
                {vm.choices.map(choice => (
                    <ReplyRow
                        key={choice.id}
                        choice={choice}
                        confirmed={lastConfirmedChoiceId === choice.id}
                        onPress={() => actions.pickEventChoice(choice.id)}
                    />
                ))}

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Walk away"
                    onPress={actions.dismissEvent}
                    style={styles.abandon}
                    testID="dialogue-leave"
                >
                    <Text style={styles.abandonText}>TIP YOUR CAP AND GO</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenBg>
    );
}

const useStyles = makeStyles((AXM) => ({
    scrollOuter: { flex: 1 },
    // Centre the conversation in the viewport so it doesn't sit in a sea
    // of empty black (critic round 1: narrative screens had huge dead space).
    scroll: { padding: 14, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.parchment,
        marginBottom: 8,
    },
    nameplate: {
        borderBottomWidth: 2,
        borderBottomColor: AXM.sulfur,
        paddingBottom: 6,
        marginBottom: 10,
    },
    name: {
        fontFamily: FONTS.gothic,
        fontSize: 30,
        lineHeight: 34,
        color: AXM.parchment,
    },
    subtitle: { fontFamily: FONTS.serifItalic, fontSize: 13, color: AXM.bone, marginTop: 2 },
    speech: {
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 12,
        marginBottom: 10,
    },
    speechText: {
        fontFamily: FONTS.serif,
        fontSize: 14,
        lineHeight: 21,
        color: AXM.parchment,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginBottom: 6,
    },
    replyRow: {
        flexDirection: 'row',
        gap: 8,
        borderWidth: 2,
        borderColor: AXM.bone,
        backgroundColor: AXM.bg,
        padding: 10,
        marginBottom: 6,
    },
    replyMark: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.sulfur },
    replyConfirm: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.sulfur, marginLeft: 4 },
    replyLabel: { fontFamily: FONTS.gothic, fontSize: 16, color: AXM.parchment, letterSpacing: 1 },
    replyDesc: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 3,
        textTransform: 'uppercase',
    },
    abandon: { alignSelf: 'center', marginTop: 16, padding: 8 },
    abandonText: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 2, color: AXM.bone },
    flexOne: { flex: 1 },
}));
