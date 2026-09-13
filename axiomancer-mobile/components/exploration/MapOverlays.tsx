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
 * 04-exploration-midgame (/exploration, map hint) @mobile: the hint's copy
 * grew (S4-world-C07) while its box still spanned the chart edge to edge, so
 * at 375x812 the pill ran under `<MapCanvas>`'s compass rose and left it a
 * needle tip and a sliver of ring. The box now keeps the rose's corner free —
 * see `COMPASS_ROSE_CLEARANCE`.
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

/**
 * Side inset, in px, that the travel hint keeps free at both ends of the
 * chart.
 *
 * `<MapCanvas>` draws the compass rose as a 52x52 viewport-fixed SVG pinned at
 * `right: 10, bottom: 10` — a 62px-wide footprint reaching 62px up from the
 * chart's foot, which is exactly the band the hint pill sits in. 70 leaves the
 * rose that corner plus an 8px gutter. The pill is centred on the chart, so
 * the room it must leave on the right is mirrored on the left; inset one side
 * only and the pill drifts off-centre.
 *
 * Resolves: 04-exploration-midgame (/exploration, map hint) @mobile.
 */
const COMPASS_ROSE_CLEARANCE = 70;

/**
 * Theme-reactive stylesheet for the chart furniture.
 *
 * Input: the active palette `AXM`. Output: the compass / node-graph label /
 * hint / legend styles. The `hint` box's side insets resolve
 * 04-exploration-midgame (/exploration, map hint) @mobile.
 */
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
    // box is ~11px tall, so 26 leaves a clear gap at any viewport. The side
    // insets clear the compass rose the pill shares that band with, so longer
    // hint copy wraps inside the chart instead of burying the rose.
    hint: {
        position: 'absolute',
        bottom: 26,
        left: COMPASS_ROSE_CLEARANCE,
        right: COMPASS_ROSE_CLEARANCE,
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
