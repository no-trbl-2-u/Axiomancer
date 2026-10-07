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
                `legend` in the stylesheet for why the row could not hold. The
                plate gives the keys their own ground: on a light engraved
                sheet, bare bone text with roads running through it could not
                be read (critique pass 69). */}
            <View style={styles.legend} testID="map-legend">
                <View style={styles.legendPlate} testID="map-legend-plate">
                    <Text style={styles.legendText} testID="map-legend-keys">{legend.left}</Text>
                    <Text style={styles.legendText} testID="map-legend-count">{legend.right}</Text>
                </View>
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
    // Both are handled structurally rather than by shaving copy. The strip is
    // the BOUND: an absolute box that keeps the button's corner free. Inside
    // it the plate hugs its copy (`alignItems: 'flex-start'` on the strip, so
    // a short legend does not paint a band across the whole chart) but can
    // never outgrow the strip (`maxWidth: '100%'`). The plate is a two-line
    // COLUMN with `alignItems: 'stretch'`, which hands each line the plate's
    // width as its wrap bound, so copy that outgrows the strip wraps to
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
        alignItems: 'flex-start',
        zIndex: 2,
    },
    // The same smoked ground as `<MapCanvas>`'s recentre disc, so the two
    // pieces of foot furniture read as one set.
    legendPlate: {
        maxWidth: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
        rowGap: 2,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 3,
        backgroundColor: 'rgba(10,10,10,0.72)',
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        flexShrink: 1,
    },
}));
