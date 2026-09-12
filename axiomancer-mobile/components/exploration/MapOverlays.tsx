/**
 * Viewport-fixed chart furniture for `<MapCanvas>` — compass line, sheet
 * label, legend strip, and the first-visit travel hint.
 *
 * Renders inside the map's viewport (never inside the pannable canvas), so
 * every position here resolves against the visible chart rather than the
 * 936x1040 spread.
 *
 * State read: none. It is pure props; the exploration screen owns whether the
 * hint is showing and the presenter owns its words.
 * Mounted from: `app/(tabs)/exploration/index.tsx`, as `<MapCanvas overlays=…>`.
 *
 * FE-005: the hint used to be an absolutely-positioned view on the SCREEN at
 * `bottom: 80`, while the legend sits at `bottom: 8` INSIDE the map. At
 * 375x812 those two coincided and the hint chip covered the legend; at
 * 1280x800 they cleared each other, so the collision only showed on the
 * primary target device. Making the hint a sibling of the legend, stacked a
 * fixed distance above it, removes the coincidence at every viewport.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

interface MapOverlaysProps {
    legend: {
        left: string;
        right: string;
    };
    /** First-visit travel nudge; `null` once the player has moved. */
    hint?: string | null;
}

export function MapOverlays({ legend, hint = null }: MapOverlaysProps) {
    const styles = useStyles();
    return (
        <>
            {/* Compass. S4-world-C07: the travel hint is a first-visit chip
                that fades; the chart's own furniture is where a player who
                missed it looks. Naming the gesture here keeps "the sheet
                moves" on screen for the whole run, beside the legend's node
                count that provoked the question. */}
            <Text style={styles.compass}>N ↑ · leagues · drag · pinch</Text>
            <Text style={styles.nodeGraphLabel}>NODE GRAPH</Text>

            {/* Travel hint — stacked directly above the legend strip. */}
            {hint != null && hint.length > 0 && (
                <View style={styles.hint} pointerEvents="none" testID="map-hint">
                    <Text style={styles.hintText}>{hint}</Text>
                </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
                <Text style={styles.legendText}>{legend.left}</Text>
                <Text style={styles.legendText}>{legend.right}</Text>
            </View>
        </>
    );
}

const useStyles = makeStyles((AXM) => ({
    compass: {
        position: 'absolute',
        top: 10,
        left: 10,
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        zIndex: 2,
    },
    nodeGraphLabel: {
        position: 'absolute',
        top: 10,
        right: 12,
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.parchment,
        opacity: 0.6,
        letterSpacing: 2,
        zIndex: 2,
    },
    // `bottom` clears the legend: the legend sits at 8 and its 8px mono line
    // box is ~11px tall, so 26 leaves a clear gap at any viewport.
    hint: {
        position: 'absolute',
        bottom: 26,
        left: 12,
        right: 12,
        alignItems: 'center',
        zIndex: 2,
    },
    hintText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.parchment,
        backgroundColor: 'rgba(10,10,10,0.72)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.ash,
        textAlign: 'center',
    },
    legend: {
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
    },
}));
