/**
 * The hazard puzzle outcome panel: cleared, short or out of time, how much of
 * the goal was reached, what was gained and what was lost.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { DevButton } from '@/components/dev/DevControls';
import type { HazardPuzzleOutcomeVM } from '@/state/presenters/hazard-puzzle.engine';
import {
    HAZARD_PUZZLE_CLAIM_LABEL,
    HAZARD_PUZZLE_PENALTY_LABEL,
    HAZARD_PUZZLE_REWARDS_LABEL,
} from '@/state/presenters/hazard-puzzle.copy';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export function HazardPuzzleOutcomePanel({ vm, onDone }: { vm: HazardPuzzleOutcomeVM; onDone: () => void }) {
    const styles = useStyles();
    return (
        <View style={styles.panel} testID="hazard-puzzle-outcome">
            <Text style={styles.headline} testID="hazard-puzzle-outcome-headline">{vm.headline}</Text>
            <Text style={styles.reached}>{vm.reachedLabel}</Text>
            <Text style={styles.section}>{HAZARD_PUZZLE_REWARDS_LABEL}</Text>
            {/* A roll can repeat an item, so rows are keyed by position. */}
            {vm.rewards.map((r, i) => (
                <Text key={`reward-${i}`} style={styles.chip}>{r}</Text>
            ))}
            <Text style={styles.section}>{HAZARD_PUZZLE_PENALTY_LABEL}</Text>
            {vm.penalties.map((p, i) => (
                <Text key={`penalty-${i}`} style={styles.penalty}>{p}</Text>
            ))}
            <DevButton label={HAZARD_PUZZLE_CLAIM_LABEL} testID="hazard-puzzle-done" onPress={onDone} />
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    panel: { borderWidth: 1, borderColor: AXM.ash, backgroundColor: AXM.bg, padding: 14, gap: 4 },
    headline: { fontFamily: FONTS.gothic, fontSize: 26, color: AXM.sulfur, letterSpacing: 1 },
    reached: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.bone },
    section: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.ash, letterSpacing: 2, marginTop: 10 },
    chip: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.parchment },
    penalty: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.blood },
}));
