/**
 * DerivedPreviewRibbon — ATK/SKL/DEF preview grid for LevelUpModal
 *
 * Shows real-time derived stats preview as players allocate stat points.
 * Matches design from `design/handoff-2026-05-23/project/screens/levelup.jsx:260-285`.
 *
 * Grid layout: 4 columns (label + ATK/SKL/DEF), 4 rows (header + HEART/BODY/MIND)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface StancePreview {
    attack: number;
    skill: number;
    defense: number;
}

export interface DerivedPreviewRibbonProps {
    /** Current derived stats for each stance before allocation */
    current: {
        heart: StancePreview;
        body: StancePreview;
        mind: StancePreview;
    };
    /** Preview derived stats with allocation applied */
    preview: {
        heart: StancePreview;
        body: StancePreview;
        mind: StancePreview;
    };
    /** Whether any points have been allocated (shows deltas) */
    hasAllocations: boolean;
}

const STANCE_LABELS = {
    heart: 'HEART',
    body: 'BODY', 
    mind: 'MIND',
} as const;

const STAT_HEADERS = ['', 'ATK', 'SKL', 'DEF'] as const;

export function DerivedPreviewRibbon({
    current,
    preview,
    hasAllocations,
}: DerivedPreviewRibbonProps) {
    const styles = useStyles();
    return (
        <View style={styles.container} testID="derived-preview-ribbon">
            {/* Header row */}
            <View style={styles.headerRow}>
                {STAT_HEADERS.map((header, index) => (
                    <Text 
                        key={index}
                        style={[
                            styles.headerText,
                            index === 0 ? styles.labelColumn : styles.statColumn
                        ]}
                    >
                        {header}
                    </Text>
                ))}
            </View>

            {/* Stance rows */}
            {(Object.keys(STANCE_LABELS) as (keyof typeof STANCE_LABELS)[]).map((stance) => (
                <View key={stance} style={styles.stanceRow} testID={`preview-row-${stance}`}>
                    {/* Stance label */}
                    <Text style={[styles.stanceLabel, styles.labelColumn]}>
                        {STANCE_LABELS[stance]}
                    </Text>

                    {/* Attack stat */}
                    <StatCell
                        current={current[stance].attack}
                        preview={preview[stance].attack}
                        hasAllocations={hasAllocations}
                        testID={`preview-${stance}-attack`}
                    />

                    {/* Skill stat */}
                    <StatCell
                        current={current[stance].skill}
                        preview={preview[stance].skill}
                        hasAllocations={hasAllocations}
                        testID={`preview-${stance}-skill`}
                    />

                    {/* Defense stat */}
                    <StatCell
                        current={current[stance].defense}
                        preview={preview[stance].defense}
                        hasAllocations={hasAllocations}
                        testID={`preview-${stance}-defense`}
                    />
                </View>
            ))}
        </View>
    );
}

interface StatCellProps {
    current: number;
    preview: number;
    hasAllocations: boolean;
    testID?: string;
}

function StatCell({ current, preview, hasAllocations, testID }: StatCellProps) {
    const styles = useStyles();
    const delta = preview - current;
    const showDelta = hasAllocations && delta !== 0;

    if (!hasAllocations) {
        // Show just current value when no allocations
        return (
            <Text style={[styles.statValue, styles.statColumn]} testID={testID}>
                {current}
            </Text>
        );
    }

    if (!showDelta) {
        // Show current when delta is 0
        return (
            <Text style={[styles.statValue, styles.statColumn]} testID={testID}>
                {current}
            </Text>
        );
    }

    // Show "current → new (+delta)" format
    const deltaText = `${current} → ${preview} (${delta > 0 ? '+' : ''}${delta})`;
    return (
        <Text style={[styles.statValue, styles.statColumn]} testID={testID}>
            {deltaText}
        </Text>
    );
}

const useStyles = makeStyles((AXM) => ({
    container: {
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginTop: 8,
    },
    headerRow: {
        flexDirection: 'row',
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
        marginBottom: 4,
    },
    headerText: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.bone,
        letterSpacing: 1,
    },
    stanceRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    stanceLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
    },
    statValue: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
    },
    deltaText: {
        color: AXM.sulfur,
        fontSize: 12,
    },
    labelColumn: {
        flex: 1.2,
    },
    statColumn: {
        flex: 1,
        textAlign: 'right',
    },
}));