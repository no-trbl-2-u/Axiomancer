/**
 * PlayerPortrait (visual-audit 2026-06) — the pilgrim bust for the SELF
 * tab's character-sheet header. A hooded traveller (ancient knowledge +
 * modern steel): shadowed face under a hood, cloak, a sulfur clasp and a
 * sheathed blade at the shoulder. Calm — not a glowing-eyed enemy.
 *
 * Theme-aware; decorative (a11y label supplied by the caller's frame).
 */

import React from 'react';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

interface PlayerPortraitProps {
    width?: number;
    height?: number;
}

export function PlayerPortrait({ width = 80, height = 96 }: PlayerPortraitProps) {
    const AXM = usePalette();
    return (
        <Svg
            width={width}
            height={height}
            viewBox="0 0 100 120"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Defs>
                <RadialGradient id="portraitHalo" cx="50%" cy="38%" r="55%">
                    <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.18} />
                    <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                </RadialGradient>
            </Defs>

            {/* halo of knowledge */}
            <Circle cx={50} cy={44} r={42} fill="url(#portraitHalo)" />

            {/* sheathed blade over the shoulder (modern steel) */}
            <Line x1={70} y1={120} x2={40} y2={50} stroke={AXM.bone} strokeWidth={2.5} opacity={0.7} />
            <Line x1={40} y1={52} x2={34} y2={44} stroke={AXM.sulfur} strokeWidth={2.5} />

            {/* cloak / shoulders */}
            <Path d="M6 120 L 14 84 Q 50 64 86 84 L 94 120 Z" fill={AXM.panelBg} stroke={AXM.parchment} strokeWidth={1.5} />
            {/* satchel strap */}
            <Path d="M22 78 L 70 116" stroke={AXM.rust} strokeWidth={2} opacity={0.8} />

            {/* hood */}
            <Path d="M26 70 Q 50 12 74 70 Q 74 86 50 86 Q 26 86 26 70 Z" fill={AXM.dockBg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* hood opening — shadowed face */}
            <Path d="M36 62 Q 50 40 64 62 Q 60 80 50 80 Q 40 80 36 62 Z" fill={AXM.deepBg} stroke={AXM.ash} strokeWidth={1} />
            {/* calm downcast features */}
            <G opacity={0.8}>
                <Line x1={43} y1={60} x2={47} y2={60} stroke={AXM.bone} strokeWidth={1.4} />
                <Line x1={53} y1={60} x2={57} y2={60} stroke={AXM.bone} strokeWidth={1.4} />
                <Line x1={50} y1={64} x2={50} y2={70} stroke={AXM.ash} strokeWidth={1} />
            </G>

            {/* cloak clasp — sulfur sigil */}
            <Circle cx={50} cy={90} r={4} fill="none" stroke={AXM.sulfur} strokeWidth={1.4} />
            <Circle cx={50} cy={90} r={1.4} fill={AXM.sulfur} />
        </Svg>
    );
}
