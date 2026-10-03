/**
 * Viewport-fixed chart furniture for `<MapCanvas>` — the gesture line and the
 * legend strip.
 *
 * Renders inside the map's viewport (never inside the pannable canvas), so
 * every position here resolves against the visible chart rather than the
 * 936x1040 spread.
 *
 * State read: none. It is pure props; the presenter owns the legend's words.
 * Mounted from: `app/(tabs)/exploration/index.tsx`, as `<MapCanvas overlays=…>`.
 *
 * The legend keeps `<MapCanvas>`'s recentre-button corner free (see
 * `RECENTRE_CLEARANCE`), so a long legend line cannot run under the button.
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
}

export function MapOverlays({ legend }: MapOverlaysProps) {
    const styles = useStyles();
    return (
        <>
            {/* Gesture line. Naming the gesture here keeps "the sheet
                moves" on screen for the whole run, beside the legend's node
                count that provokes the question. */}
            <Text style={styles.gestures}>drag · pinch</Text>

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
 * Right inset, in px, that the legend keeps free at the chart's foot.
 *
 * `<MapCanvas>` pins the 32x32 recentre button at `right: 10, bottom: 10` — a
 * 42px footprint reaching up from the chart's foot, in the band the legend
 * sits in. 70 leaves the button that corner with room to spare.
 */
const RECENTRE_CLEARANCE = 70;

/**
 * Theme-reactive stylesheet for the chart furniture.
 *
 * Input: the active palette `AXM`. Output: the gesture line / legend styles.
 */
const useStyles = makeStyles((AXM) => ({
    gestures: {
        position: 'absolute',
        top: 10,
        left: 10,
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        zIndex: 2,
    },
    // ── THE LEGEND MUST NOT CLIP ──
    //
    // A single row (keys left, counter right) clips for two independent
    // reasons, either of which is enough on its own:
    //
    //   1. The recentre button. `<MapCanvas>` pins a 32x32 button at
    //      `right: 10, bottom: 10`, i.e. a 42px-tall corner reaching up from
    //      the chart's foot, and the legend at `bottom: 8` sits inside that
    //      band.
    //   2. Neither `Text` can give way. Yoga defaults `flexShrink` to 0, so
    //      once the two strings exceed the strip the row overflows — and
    //      `graphWrap` is `overflow: 'hidden'`, so overflow means CLIPPED, not
    //      wrapped. A font scale or a third legend key is enough to do it.
    //
    // Both are handled structurally rather than by shaving copy. The strip is a
    // two-line COLUMN that keeps the button's corner free, and `alignItems:
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
        right: RECENTRE_CLEARANCE,
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
