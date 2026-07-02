/**
 * Quest board overlays — the board-reveal intro, the open-space card,
 * the dusk flash, and the outcome ledger. Pure presentation over the
 * presenter VMs; every interaction dispatches a prop callback.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type {
    QuestBoardVM,
    QuestOptionVM,
    QuestPendingVM,
    QuestOutcomeVM,
    QuestVowVM,
} from '@/state/presenters/quest.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Scrim({ children, testID }: { children: React.ReactNode; testID: string }) {
    const styles = useStyles();
    return (
        <View style={styles.scrim} testID={testID}>
            <View style={styles.panel}>{children}</View>
        </View>
    );
}

function BigButton({
    label,
    onPress,
    accent,
    testID,
}: {
    label: string;
    onPress: () => void;
    accent?: string;
    testID: string;
}) {
    const styles = useStyles();
    const AXM = usePalette();
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={[styles.bigButton, { borderColor: accent ?? AXM.sulfur }]}
            testID={testID}
        >
            <Text style={[styles.bigButtonText, { color: accent ?? AXM.sulfur }]}>{label}</Text>
        </TouchableOpacity>
    );
}

function VowRows({ vows }: { vows: readonly QuestVowVM[] }) {
    const styles = useStyles();
    const AXM = usePalette();
    return (
        <View style={styles.vowRows}>
            {vows.map(v => (
                <View key={v.id} style={styles.vowRow}>
                    <Text
                        style={[
                            styles.vowMark,
                            v.status === 'kept' && { color: AXM.heal },
                            v.status === 'broken' && { color: AXM.blood },
                        ]}
                    >
                        {v.status === 'kept' ? '✓' : v.status === 'broken' ? '✗' : '·'}
                    </Text>
                    <View style={styles.flexOne}>
                        <Text style={styles.vowName}>{v.name}</Text>
                        <Text style={styles.vowDesc}>{v.desc}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Intro (board reveal)
// ---------------------------------------------------------------------------

export function QuestIntroOverlay({ vm, onBegin }: { vm: QuestBoardVM; onBegin: () => void }) {
    const styles = useStyles();
    return (
        <Scrim testID="quest-intro">
            <ScrollView>
                <Text style={styles.eyebrow}>{vm.storyBeat.toUpperCase()}</Text>
                <Text style={styles.title}>{vm.title}</Text>
                <Text style={styles.headline}>{vm.headline}</Text>
                <Text style={styles.body}>{vm.intro}</Text>

                <Text style={styles.sectionLabel}>THE VOWS DEALT</Text>
                <VowRows vows={vm.vows} />

                <Text style={styles.sectionLabel}>IN THE SATCHEL</Text>
                {vm.charms.map(c => (
                    <View key={c.id} style={styles.charmRow}>
                        <Text style={styles.charmName}>{c.name}</Text>
                        <Text style={styles.charmDesc}>{c.desc}</Text>
                    </View>
                ))}
            </ScrollView>
            <BigButton label="UNFOLD THE BOARD" onPress={onBegin} testID="quest-begin" />
        </Scrim>
    );
}

// ---------------------------------------------------------------------------
// Open space card
// ---------------------------------------------------------------------------

function OptionRow({ option, onPress }: { option: QuestOptionVM; onPress: () => void }) {
    const styles = useStyles();
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${option.label}, ${option.desc}`}
            accessibilityState={{ disabled: !option.enabled }}
            disabled={!option.enabled}
            onPress={onPress}
            style={[styles.optionRow, { opacity: option.enabled ? 1 : 0.4 }]}
            testID={`quest-option-${option.id}`}
        >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDesc}>
                {option.enabled ? option.desc : `${option.desc}  —  ${option.disabledReason}`}
            </Text>
        </TouchableOpacity>
    );
}

export function QuestSpaceOverlay({
    pending,
    onChoose,
    onContinue,
}: {
    pending: QuestPendingVM;
    onChoose: (optionId: string) => void;
    onContinue: () => void;
}) {
    const styles = useStyles();
    const result = pending.result;
    return (
        <Scrim testID="quest-space">
            <ScrollView>
                <Text style={styles.title}>{result ? result.title : pending.title}</Text>
                <Text style={styles.body}>{result ? result.body : pending.body}</Text>

                {result !== null && result.rolls.length > 0 && (
                    <View style={styles.rollRow} testID="quest-result-rolls">
                        {result.rolls.map((die, i) => (
                            <Text key={i} style={styles.rollFace}>
                                {i > 0 ? ' against ' : ''}⚄ {die}
                            </Text>
                        ))}
                    </View>
                )}

                {result !== null && result.deltaChips.length > 0 && (
                    <View style={styles.chipRow} testID="quest-result-chips">
                        {result.deltaChips.map((chip, i) => (
                            <Text key={i} style={styles.chip}>{chip}</Text>
                        ))}
                    </View>
                )}

                {pending.ledger.length > 0 && result === null && (
                    <View style={styles.ledgerBox} testID="quest-market-ledger">
                        {pending.ledger.map((line, i) => (
                            <Text key={i} style={styles.ledgerLine}>· {line}</Text>
                        ))}
                    </View>
                )}

                {result === null &&
                    pending.options.map(option => (
                        <OptionRow key={option.id} option={option} onPress={() => onChoose(option.id)} />
                    ))}
            </ScrollView>
            {result !== null && (
                <BigButton label="WALK ON" onPress={onContinue} testID="quest-continue" />
            )}
        </Scrim>
    );
}

// ---------------------------------------------------------------------------
// Dusk
// ---------------------------------------------------------------------------

export function QuestDuskOverlay({
    day,
    collapsed,
    onContinue,
}: {
    day: number;
    collapsed: boolean;
    onContinue: () => void;
}) {
    const styles = useStyles();
    return (
        <Scrim testID="quest-dusk">
            <Text style={styles.title}>{collapsed ? 'CARRIED HOME' : 'DUSK'}</Text>
            <Text style={styles.body}>
                {collapsed
                    ? 'Somewhere between one step and the next, the ground came up to meet him. ' +
                      'He wakes at the family table with stew in front of him and no questions asked. ' +
                      'The plan keeps. Plans do.'
                    : `Day ${day} folds itself away. Supper, the fire, the small arithmetic of parts ` +
                      'still wanting — and sleep, which takes no argument.'}
            </Text>
            <BigButton label="A NEW DAY" onPress={onContinue} testID="quest-dawn" />
        </Scrim>
    );
}

// ---------------------------------------------------------------------------
// Outcome ledger
// ---------------------------------------------------------------------------

export function QuestOutcomeOverlay({
    outcome,
    onClaim,
}: {
    outcome: QuestOutcomeVM;
    onClaim: () => void;
}) {
    const styles = useStyles();
    return (
        <Scrim testID="quest-outcome">
            <ScrollView>
                <Text style={styles.eyebrow}>THE BOAT IS BUILT</Text>
                <Text style={[styles.title, styles.tierTitle]}>{outcome.tierLabel}</Text>
                <Text style={styles.body}>{outcome.copy}</Text>

                <View style={styles.statRow}>
                    <Text style={styles.stat}>DAYS {outcome.daysTaken}</Text>
                    <Text style={styles.stat}>ROLLS {outcome.rolls}</Text>
                    <Text style={styles.stat}>FISH {outcome.fishLeft}</Text>
                    <Text style={styles.stat}>VIGOR {outcome.vigorLeft}</Text>
                </View>

                <Text style={styles.sectionLabel}>
                    VOWS — {outcome.vowsKept} KEPT
                </Text>
                <VowRows vows={outcome.vows} />
            </ScrollView>
            <BigButton label="TO THE WATER" onPress={onClaim} testID="quest-claim" />
        </Scrim>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles((AXM) => ({
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(6, 5, 10, 0.92)',
        justifyContent: 'center',
        padding: 16,
    },
    panel: {
        borderWidth: 2,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
        padding: 16,
        maxHeight: '92%',
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginBottom: 4,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 28,
        lineHeight: 32,
        color: AXM.parchment,
        marginBottom: 6,
    },
    tierTitle: {
        fontSize: 36,
        lineHeight: 40,
        color: AXM.sulfur,
    },
    headline: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        letterSpacing: 2,
        color: AXM.sulfur,
        marginBottom: 8,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 19,
        color: AXM.parchment,
        marginBottom: 10,
    },
    sectionLabel: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
        marginTop: 10,
        marginBottom: 4,
    },
    vowRows: { gap: 6 },
    vowRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    vowMark: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.bone, width: 14 },
    vowName: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment, letterSpacing: 1 },
    vowDesc: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    charmRow: { marginBottom: 6 },
    charmName: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.sulfur, letterSpacing: 1 },
    charmDesc: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    optionRow: {
        borderWidth: 2,
        borderColor: AXM.bone,
        padding: 10,
        marginTop: 8,
        backgroundColor: AXM.bg,
    },
    optionLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 17,
        color: AXM.parchment,
        letterSpacing: 1.2,
    },
    optionDesc: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    rollRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'center' },
    rollFace: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.sulfur },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    chip: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        letterSpacing: 1,
        color: AXM.parchment,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    ledgerBox: {
        marginTop: 8,
        padding: 6,
        borderLeftWidth: 2,
        borderLeftColor: AXM.sulfur,
    },
    ledgerLine: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.sulfur, lineHeight: 17 },
    statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
    stat: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        letterSpacing: 1.5,
        color: AXM.parchment,
    },
    bigButton: {
        borderWidth: 2,
        marginTop: 12,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: AXM.bg,
    },
    bigButtonText: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        letterSpacing: 2,
    },
    flexOne: { flex: 1 },
}));
