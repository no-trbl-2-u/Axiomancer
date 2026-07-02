/**
 * Filigree rule (visual-audit 2026-06) — a thin decorative divider with
 * a centred diamond, for separating sections inside the gothic chrome.
 *
 * Theme-aware (defaults to a dim sulfur accent). Reused across the
 * title, prelude, and event screens to give text blocks a sense of
 * deliberate framing rather than free-floating.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { usePalette } from '@/theme/runtime';

interface FiligreeRuleProps {
    /** Total width of the rule. Defaults to filling the parent. */
    width?: number | `${number}%`;
    /** Accent colour for the diamond + line. Defaults to dim sulfur. */
    color?: string;
}

export function FiligreeRule({ width = '70%', color }: FiligreeRuleProps) {
    const AXM = usePalette();
    const resolvedColor = color ?? AXM.sulfur;
    return (
        <View
            style={[styles.row, { width }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View style={[styles.line, { backgroundColor: resolvedColor }]} />
            <View style={[styles.diamond, { borderColor: resolvedColor }]} />
            <View style={[styles.line, { backgroundColor: resolvedColor }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        opacity: 0.6,
    },
    line: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
    },
    diamond: {
        width: 7,
        height: 7,
        marginHorizontal: 8,
        borderWidth: 1,
        transform: [{ rotate: '45deg' }],
    },
});
