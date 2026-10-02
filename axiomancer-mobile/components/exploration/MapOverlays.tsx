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
 * The hint's box keeps `<MapCanvas>`'s compass-rose corner free (see
 * `COMPASS_ROSE_CLEARANCE`), so a long hint cannot run under the rose.
 *
 * The hint is a sibling of the legend, stacked a fixed distance above it, so
 * the two cannot collide at any viewport.
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
            {/* Compass. The travel hint is a first-visit chip
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

            {/* Legend. Two stacked lines, not two ends of one row — see
                `legend` in the stylesheet for why the row could not hold. */}
            <View style={styles.legend} testID="map-legend">
                <Text style={styles.legendText} testID="map-legend-keys">{legend.left}</Text>
                <Text style={styles.legendText} testID="map-legend-count">{legend.right}</Text>
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
 * Bottom offset, in px, that the travel hint sits at so it clears the legend.
 *
 * The legend is anchored at `bottom: 8` and grows UPWARD (absolute box, no
 * height). It is two 8px mono lines with a 2px gap —
 * roughly 8 + 11 + 2 + 11 = 32px of occupied band — so the hint has to start
 * above that. 36 leaves a 4px gutter.
 *
 * This is a named number derived from the legend's height so the hint and
 * the legend cannot collide; offsets set independently can coincide on one
 * device only. The geometry is pinned in `__tests__/MapOverlays.test.tsx`.
 */
const LEGEND_CLEARANCE = 36;

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
    // `bottom` clears the legend: the legend sits at 8 and is TWO 8px mono
    // line boxes (~11px each), so it reaches ~30px up from the
    // chart's foot. `LEGEND_CLEARANCE` is that height plus a gutter. The side
    // insets clear the compass rose the pill shares that band with, so longer
    // hint copy wraps inside the chart instead of burying the rose.
    hint: {
        position: 'absolute',
        bottom: LEGEND_CLEARANCE,
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
    // ── THE LEGEND MUST NOT CLIP ──
    //
    // A single row (keys left, counter right) clips for two independent
    // reasons, either of which is enough on its own:
    //
    //   1. The compass rose. `<MapCanvas>` pins a 52x52 rose at
    //      `right: 10, bottom: 10`, i.e. a 62px-tall corner reaching up from
    //      the chart's foot, and the legend at `bottom: 8` sits inside that
    //      band.
    //   2. Neither `Text` can give way. Yoga defaults `flexShrink` to 0, so
    //      once the two strings exceed the strip the row overflows — and
    //      `graphWrap` is `overflow: 'hidden'`, so overflow means CLIPPED, not
    //      wrapped. A font scale or a third legend key is enough to do it.
    //
    // Both are handled structurally rather than by shaving copy. The strip is a
    // two-line COLUMN that keeps the rose's corner free, and `alignItems:
    // 'stretch'` is the load-bearing half: it gives each line the container's
    // full width as its BOUND, so copy that outgrows the strip wraps to
    // another line inside it instead of running off the sheet. (`flexShrink`
    // cannot do that job in a column — in a column it governs height.) The
    // keys therefore survive a third key, a longer counter, and an
    // accessibility font scale.
    legend: {
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: COMPASS_ROSE_CLEARANCE,
        flexDirection: 'column',
        alignItems: 'stretch',
        rowGap: 2,
        zIndex: 2,
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
        flexShrink: 1,
    },
}));
