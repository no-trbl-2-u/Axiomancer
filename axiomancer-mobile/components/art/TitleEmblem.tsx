/**
 * Title crest (visual-audit 2026-06) — the game's heraldic mark.
 *
 * A single Svg sigil that renders the title screen's promise as art:
 * a radiant **eye of knowledge** above a descending **sword of steel**,
 * framed by an astrolabe ring with a soft sulfur halo. Theme-aware:
 * pulls accents from `AXM`, so each colour theme restyles the crest.
 *
 * Pure presentational — no state, no animation hooks. Decorative, so
 * it's hidden from the a11y tree by default (the title text carries the
 * label); pass `title` to expose it as an image.
 */

import React from 'react';
import Svg, {
    Circle,
    Defs,
    G,
    Line,
    Path,
    RadialGradient,
    Stop,
} from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

interface TitleEmblemProps {
    size?: number;
    /** When set, the crest is exposed to a11y as an image with this label. */
    title?: string;
}

// Astrolabe tick marks around the outer ring. Long ticks at the
// cardinals + every 45°, short ticks fill the rest (every 15°).
const TICKS = Array.from({ length: 24 }, (_, i) => {
    const angleDeg = i * 15;
    const long = angleDeg % 45 === 0;
    return { angleDeg, long };
});

function polar(cx: number, cy: number, r: number, angleDeg: number) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

export function TitleEmblem({ size = 168, title }: TitleEmblemProps) {
    const AXM = usePalette();
    const C = 110; // centre of the 220 viewBox
    const a11y = title
        ? ({ accessibilityRole: 'image' as const, accessibilityLabel: title })
        : ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const });

    return (
        <Svg width={size} height={size} viewBox="0 0 220 220" {...a11y}>
            <Defs>
                <RadialGradient id="emblemGlow" cx="50%" cy="46%" r="55%">
                    <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.22} />
                    <Stop offset="55%" stopColor={AXM.sulfur} stopOpacity={0.06} />
                    <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                </RadialGradient>
            </Defs>

            {/* Halo */}
            <Circle cx={C} cy={102} r={104} fill="url(#emblemGlow)" />

            {/* Astrolabe rings */}
            <Circle cx={C} cy={C} r={88} stroke={AXM.sulfur} strokeWidth={1.5} opacity={0.85} fill="none" />
            <Circle cx={C} cy={C} r={80} stroke={AXM.sulfur} strokeWidth={0.75} opacity={0.45} fill="none" strokeDasharray="2 7" />
            <Circle cx={C} cy={C} r={62} stroke={AXM.bone} strokeWidth={0.75} opacity={0.35} fill="none" />

            {/* Tick marks */}
            <G>
                {TICKS.map(({ angleDeg, long }) => {
                    const [x1, y1] = polar(C, C, 88, angleDeg);
                    const [x2, y2] = polar(C, C, long ? 95 : 92, angleDeg);
                    return (
                        <Line
                            key={angleDeg}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={AXM.sulfur}
                            strokeWidth={long ? 1.6 : 0.9}
                            opacity={long ? 0.9 : 0.5}
                        />
                    );
                })}
            </G>

            {/* ── Eye of knowledge (upper axis) ── */}
            <G>
                {/* radiant burst */}
                {[0, 30, 60, 90, 120, 150].map((deg) => {
                    const [x1, y1] = polar(C, 80, 22, deg);
                    const [x2, y2] = polar(C, 80, 30, deg);
                    return (
                        <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AXM.sulfur} strokeWidth={1.4} opacity={0.7} />
                    );
                })}
                {/* almond lid */}
                <Path
                    d="M86 80 Q110 62 134 80 Q110 98 86 80 Z"
                    fill={AXM.bg}
                    stroke={AXM.parchment}
                    strokeWidth={2}
                />
                {/* iris + pupil */}
                <Circle cx={C} cy={80} r={8.5} fill={AXM.blood} opacity={0.9} />
                <Circle cx={C} cy={80} r={3.4} fill={AXM.bg} />
                <Circle cx={C} cy={80} r={1.2} fill={AXM.sulfur} />
            </G>

            {/* ── Sword of steel (lower axis) ── */}
            <G>
                {/* crossguard */}
                <Path
                    d="M74 104 Q110 99 146 104 Q110 110 74 104 Z"
                    fill={AXM.bone}
                    stroke={AXM.parchment}
                    strokeWidth={1}
                />
                {/* guard finials */}
                <Circle cx={74} cy={104} r={3} fill={AXM.sulfur} />
                <Circle cx={146} cy={104} r={3} fill={AXM.sulfur} />
                {/* blade */}
                <Path
                    d="M104 106 L116 106 L113 168 L110 176 L107 168 Z"
                    fill={AXM.parchment}
                    stroke={AXM.bone}
                    strokeWidth={1}
                    strokeLinejoin="round"
                />
                {/* fuller (centre groove) */}
                <Line x1={110} y1={108} x2={110} y2={162} stroke={AXM.ash} strokeWidth={1.2} opacity={0.8} />
            </G>
        </Svg>
    );
}
