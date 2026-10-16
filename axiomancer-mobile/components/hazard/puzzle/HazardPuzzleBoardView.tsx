/**
 * The hazard puzzle board: clock, goal and progress, the hand (play or bin),
 * the cards in play (power, apply, return), the dice, the reserve count and
 * the confirm button. Renders the presenter's view model; every press is a
 * callback to the demo, which runs the engine move.
 */

import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { DevButton, DevButtons } from '@/components/dev/DevControls';
import { HazardCard } from '@/components/hazard/HazardCard';
import { HazardDie } from '@/components/hazard/HazardDie';
import type { HazardPuzzleBoardVM } from '@/state/presenters/hazard-puzzle.engine';
import {
    HAZARD_PUZZLE_APPLY_LABEL,
    HAZARD_PUZZLE_BIN_LABEL,
    HAZARD_PUZZLE_CONFIRM_LABEL,
    HAZARD_PUZZLE_DICE_LABEL,
    HAZARD_PUZZLE_HAND_LABEL,
    HAZARD_PUZZLE_RETURN_LABEL,
    HAZARD_PUZZLE_STAGE_LABEL,
    HAZARD_PUZZLE_STAGED_LABEL,
} from '@/state/presenters/hazard-puzzle.copy';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface HazardPuzzleBoardViewProps {
    vm: HazardPuzzleBoardVM;
    unlockLine: string;
    onStage: (uid: string) => void;
    onDiscard: (uid: string) => void;
    onPower: (uid: string, dieId: string) => void;
    onApply: (uid: string) => void;
    onReturn: (uid: string) => void;
    onConfirm: () => void;
}

export function HazardPuzzleBoardView({
    vm,
    unlockLine,
    onStage,
    onDiscard,
    onPower,
    onApply,
    onReturn,
    onConfirm,
}: HazardPuzzleBoardViewProps) {
    const styles = useStyles();
    return (
        <View testID="hazard-puzzle-board">
            <View style={styles.header}>
                <Text style={styles.title}>{vm.title}</Text>
                <Text
                    style={[styles.clock, vm.clockUrgent && styles.clockUrgent]}
                    testID="hazard-puzzle-clock"
                    accessibilityRole="timer"
                >
                    {vm.clockLabel}
                </Text>
            </View>
            <Text style={styles.line}>{vm.routeName}</Text>
            <Text style={styles.line} testID="hazard-puzzle-goal">{vm.goalLabel}</Text>
            <Text style={styles.progress} testID="hazard-puzzle-progress">{vm.progressLabel}</Text>
            <Text style={styles.unlock} testID="hazard-puzzle-unlocks">{unlockLine}</Text>

            <Text style={styles.section}>{HAZARD_PUZZLE_STAGED_LABEL}</Text>
            <ScrollView horizontal contentContainerStyle={styles.row}>
                {vm.staged.map((s) => (
                    <View key={s.card.uid} style={styles.slot} testID={s.testID}>
                        <HazardCard card={s.card} mode="play" />
                        <DevButtons>
                            {s.powerOptions.map((o) => (
                                <DevButton
                                    key={o.dieId}
                                    label={o.label}
                                    testID={o.testID}
                                    onPress={() => onPower(s.card.uid, o.dieId)}
                                />
                            ))}
                            {s.canApply ? (
                                <DevButton
                                    label={HAZARD_PUZZLE_APPLY_LABEL}
                                    testID={`${s.testID}-apply`}
                                    onPress={() => onApply(s.card.uid)}
                                />
                            ) : null}
                            {s.canReturn ? (
                                <DevButton
                                    label={HAZARD_PUZZLE_RETURN_LABEL}
                                    testID={`${s.testID}-return`}
                                    onPress={() => onReturn(s.card.uid)}
                                />
                            ) : null}
                        </DevButtons>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.section}>{HAZARD_PUZZLE_HAND_LABEL}</Text>
            <ScrollView horizontal contentContainerStyle={styles.row}>
                {vm.hand.map((h) => (
                    <View key={h.card.uid} style={styles.slot} testID={h.testID}>
                        <HazardCard card={h.card} mode="hand" />
                        <DevButtons>
                            <DevButton
                                label={HAZARD_PUZZLE_STAGE_LABEL}
                                testID={`${h.testID}-play`}
                                disabled={!vm.canConfirm}
                                onPress={() => onStage(h.card.uid)}
                            />
                            <DevButton
                                label={HAZARD_PUZZLE_BIN_LABEL}
                                testID={`${h.testID}-bin`}
                                disabled={!vm.canConfirm}
                                onPress={() => onDiscard(h.card.uid)}
                            />
                        </DevButtons>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.section}>{HAZARD_PUZZLE_DICE_LABEL}</Text>
            <View style={styles.dice}>
                {vm.dice.map((d) => (
                    <View key={d.id} accessible accessibilityLabel={d.accessibilityLabel}>
                        <HazardDie kind={d.kind} state={d.state} temporary={d.temporary} size={40} />
                    </View>
                ))}
            </View>
            <Text style={styles.line} testID="hazard-puzzle-reserve">{vm.reserveLabel}</Text>

            <DevButton
                label={HAZARD_PUZZLE_CONFIRM_LABEL}
                testID="hazard-puzzle-confirm"
                disabled={!vm.canConfirm}
                onPress={onConfirm}
            />
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.sulfur, letterSpacing: 1, flexShrink: 1 },
    clock: { fontFamily: FONTS.mono, fontSize: 22, color: AXM.bone },
    clockUrgent: { color: AXM.blood },
    line: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.bone, letterSpacing: 1, marginTop: 4 },
    progress: { fontFamily: FONTS.mono, fontSize: 13, color: AXM.parchment, marginTop: 6 },
    unlock: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment, marginTop: 6 },
    section: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.ash, letterSpacing: 2, marginTop: 14, marginBottom: 6 },
    row: { gap: 10, paddingBottom: 4 },
    slot: { alignItems: 'center', gap: 6 },
    dice: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
}));
