/**
 * CreatureScene (visual-audit 2026-06) — the shared moonlit backdrop for
 * bespoke enemy illustrations. Draws a glowing moon, a receding treeline,
 * framing trees, ground mist and drifting embers, then renders the
 * per-enemy creature figure (passed as children) centred on the ground.
 *
 * Keeping the backdrop here means each archetype figure is a small,
 * focused drawing while the atmosphere stays consistent across foes.
 * Theme-aware; decorative (a11y label provided by the caller via the Svg).
 *
 * Figures draw in a coordinate space whose origin is the creature's feet
 * on the ground line; the body rises into negative-y. Eyes can reference
 * `url(#enemyEyeGlow)` for the shared red glow, and the moon palette via
 * `AXM`.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

const BACK_TREES = [
    { x: 30, top: 96, depth: 0.35 },
    { x: 78, top: 78, depth: 0.5 },
    { x: 300, top: 84, depth: 0.45 },
    { x: 348, top: 100, depth: 0.32 },
];

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
    cx: ((i * 53 + 17) % 360) + 7,
    cy: ((i * 37 + 11) % 150) + 40,
    r: (i % 3) * 0.6 + 0.8,
    warm: i % 2 === 0,
}));

export interface CreatureSceneProps {
    /** Accessibility label for the whole illustration. */
    label: string;
    /** Width of the ground shadow under the creature. */
    shadowWidth?: number;
    /** Scale the creature figure up around its ground origin (combat battlefield
     *  renders the foe LARGE — the enemy is the screen). Default 1 = event size. */
    figureScale?: number;
    /** SVG preserveAspectRatio. The combat battlefield passes 'xMidYMid slice' so
     *  the scene fills a band whose aspect differs from the 374×320 canvas. */
    preserveAspectRatio?: string;
    /** The creature figure, drawn around the ground origin. */
    children: React.ReactNode;
}

export function CreatureScene({
    label, shadowWidth = 64, figureScale = 1, preserveAspectRatio, children,
}: CreatureSceneProps) {
    const AXM = usePalette();
    return (
        <Svg
            viewBox="0 0 374 320"
            width="100%"
            height="100%"
            preserveAspectRatio={preserveAspectRatio}
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel={label}
            accessibilityRole="image"
        >
            <Defs>
                <RadialGradient id="enemySceneMoon" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.5} />
                    <Stop offset="40%" stopColor={AXM.sulfur} stopOpacity={0.18} />
                    <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="enemyEyeGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.95} />
                    <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
                </RadialGradient>
            </Defs>

            {/* Moon + halo */}
            <Circle cx={290} cy={66} r={64} fill="url(#enemySceneMoon)" />
            <Circle cx={290} cy={66} r={26} fill={AXM.parchment} opacity={0.16} />
            <Circle cx={290} cy={66} r={26} fill="none" stroke={AXM.parchment} strokeWidth={1.2} opacity={0.5} />

            {/* Ground horizon */}
            <Line x1={0} y1={200} x2={374} y2={200} stroke={AXM.bone} strokeWidth={0.75} opacity={0.45} />

            {/* Receding treeline */}
            {BACK_TREES.map(({ x, top, depth }, i) => (
                <G key={`bt-${i}`} opacity={0.25 + depth * 0.4}>
                    <Path d={`M${x} ${top} L ${x} 220`} stroke={AXM.bone} strokeWidth={1 + depth * 1.5} />
                    <Path
                        d={`M${x} ${top + 18} l ${-12 - depth * 8} ${-8} M${x} ${top + 34} l ${14 + depth * 8} ${-6}`}
                        stroke={AXM.bone}
                        strokeWidth={1}
                        fill="none"
                    />
                </G>
            ))}

            {/* Framing trees */}
            {[12, 362].map((x, i) => {
                const dir = x < 187 ? 1 : -1;
                return (
                    <G key={`ft-${i}`}>
                        <Path d={`M${x} 40 C ${x + dir * 10} 110, ${x - dir * 8} 170, ${x} 224`} stroke={AXM.parchment} strokeWidth={3} fill="none" />
                        <Path d={`M${x} 80 l ${dir * 34} -14 M${x} 120 l ${dir * 40} -6 M${x} 150 l ${dir * 30} 6`} stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
                    </G>
                );
            })}

            {/* Ground mist */}
            <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.28}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <Line key={`m-${i}`} x1={i * 10} y1={206 + (i % 4) * 4} x2={i * 10 + 14} y2={206 + (i % 4) * 4} />
                ))}
            </G>

            {/* Creature */}
            <G transform={`translate(187 200) scale(${figureScale})`}>
                <Ellipse cx={0} cy={6} rx={shadowWidth} ry={13} fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={0.75} opacity={0.85} />
                {children}
            </G>

            {/* Embers */}
            {EMBERS.map((e, i) => (
                <Circle key={`e-${i}`} cx={e.cx} cy={e.cy} r={e.r} fill={e.warm ? AXM.sulfur : AXM.blood} opacity={0.5} />
            ))}
        </Svg>
    );
}
