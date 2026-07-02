/**
 * QuestHullMeter — the boat-build progress bar (U3).
 *
 * Surfaces `QuestBoardVM.boatProgress` (fraction of required parts
 * fitted, already computed by the presenter but previously undrawn) as
 * a hull-completion bar, alongside the live outcome-tier preview so the
 * goal is always in view. Pure presentation.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface QuestHullMeterProps {
    /** 0..1 — fraction of required parts fitted. */
    progress: number;
    /** Tier the build is currently tracking toward (e.g. "SEAWORTHY"). */
    tierLabel: string;
}

export function QuestHullMeter({ progress, tierLabel }: QuestHullMeterProps) {
    const styles = useStyles();
    const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
    return (
        <View style={styles.wrap} testID="quest-hull-meter">
            <View style={styles.row}>
                <Text style={styles.label}>HULL</Text>
                <Text style={styles.tier} testID="quest-hull-tier">
                    {tierLabel} · {pct}%
                </Text>
            </View>
            <View style={styles.track}>
                <View
                    style={[styles.fill, { width: `${pct}%` }]}
                    testID="quest-hull-fill"
                />
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    wrap: { paddingHorizontal: 6, paddingBottom: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    label: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 2.2,
        color: AXM.bone,
    },
    tier: {
        fontFamily: FONTS.sans,
        fontSize: 12,
        letterSpacing: 1.5,
        color: AXM.sulfur,
    },
    track: {
        height: 8,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
    },
    fill: {
        height: '100%',
        backgroundColor: AXM.sulfur,
    },
}));
