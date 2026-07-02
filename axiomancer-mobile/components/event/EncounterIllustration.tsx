import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, Line, G, Defs, RadialGradient, Stop } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

/**
 * Combat encounter illustration (visual-audit 2026-06 rework).
 *
 * A moonlit clearing: a glowing moon with a sulfur halo behind a
 * receding treeline (dimmer trees read as further back), foreground
 * twisted trees framing the scene, and a hunched horned creature with
 * glowing eyes crouched at centre over a ground shadow. Drifting embers
 * add atmosphere. Fully theme-aware — every accent pulls from `AXM`.
 *
 * Procedural single-Svg art; per-creature bespoke illustrations ship
 * later via the asset-swap workflow (see SVG_ASSET_SPEC.md).
 */

// Receding treeline (behind the creature) — x position, trunk top y,
// and a depth factor that dims/thins trees further from centre.
const BACK_TREES = [
    { x: 30, top: 96, depth: 0.35 },
    { x: 78, top: 78, depth: 0.5 },
    { x: 300, top: 84, depth: 0.45 },
    { x: 348, top: 100, depth: 0.32 },
];

// Drifting embers — deterministic scatter so renders are stable.
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
    cx: ((i * 53 + 17) % 360) + 7,
    cy: ((i * 37 + 11) % 150) + 40,
    r: (i % 3) * 0.6 + 0.8,
    warm: i % 2 === 0,
}));

export function EncounterIllustration() {
    const AXM = usePalette();
    return (
        <Svg
            viewBox="0 0 374 320"
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel="Combat encounter illustration showing a horned creature crouched in a moonlit clearing among twisted trees"
            accessibilityRole="image"
        >
            <Defs>
                <RadialGradient id="encMoon" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={AXM.sulfur} stopOpacity={0.5} />
                    <Stop offset="40%" stopColor={AXM.sulfur} stopOpacity={0.18} />
                    <Stop offset="100%" stopColor={AXM.sulfur} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="encEye" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.9} />
                    <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
                </RadialGradient>
            </Defs>

            {/* Moon + halo */}
            <Circle cx={290} cy={66} r={64} fill="url(#encMoon)" />
            <Circle cx={290} cy={66} r={26} fill={AXM.parchment} opacity={0.16} />
            <Circle cx={290} cy={66} r={26} fill="none" stroke={AXM.parchment} strokeWidth={1.2} opacity={0.5} />
            <Circle cx={278} cy={58} r={5} fill={AXM.parchment} opacity={0.1} />

            {/* Ground horizon */}
            <Line x1={0} y1={200} x2={374} y2={200} stroke={AXM.bone} strokeWidth={0.75} opacity={0.45} />

            {/* Receding treeline */}
            <G>
                {BACK_TREES.map(({ x, top, depth }, i) => (
                    <G key={`bt-${i}`} opacity={0.25 + depth * 0.4}>
                        <Path d={`M${x} ${top} L ${x} 220`} stroke={AXM.bone} strokeWidth={1 + depth * 1.5} />
                        <Path
                            d={`M${x} ${top + 18} l ${-12 - depth * 8} ${-8} M${x} ${top + 34} l ${14 + depth * 8} ${-6} M${x} ${top + 8} l ${-8} ${-12}`}
                            stroke={AXM.bone}
                            strokeWidth={1}
                            fill="none"
                        />
                    </G>
                ))}
            </G>

            {/* Foreground twisted trees framing the clearing */}
            {[12, 362].map((x, i) => {
                const dir = x < 187 ? 1 : -1;
                return (
                    <G key={`ft-${i}`}>
                        <Path d={`M${x} 40 C ${x + dir * 10} 110, ${x - dir * 8} 170, ${x} 224`} stroke={AXM.parchment} strokeWidth={3} fill="none" />
                        <Path d={`M${x} 80 l ${dir * 34} -14 M${x} 120 l ${dir * 40} -6 M${x} 150 l ${dir * 30} 6`} stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
                        <Path d={`M${x + dir * 34} -14 l ${dir * 12} -16 M${x + dir * 40} -6 l ${dir * 16} -8`} transform={`translate(0 80)`} stroke={AXM.parchment} strokeWidth={1} fill="none" opacity={0.8} />
                    </G>
                );
            })}

            {/* Ground mist hatching */}
            <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.28}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <Line key={`m-${i}`} x1={i * 10} y1={206 + (i % 4) * 4} x2={i * 10 + 14} y2={206 + (i % 4) * 4} />
                ))}
            </G>

            {/* Creature */}
            <G transform="translate(187 200)">
                {/* ground shadow */}
                <Ellipse cx={0} cy={6} rx={66} ry={13} fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={0.75} opacity={0.85} />
                {/* hunched body silhouette */}
                <Path
                    d="M-50 0 L -55 -20 L -40 -30 L -25 -10 L -10 -38 L 5 -22 L 25 -45 L 38 -25 L 50 -8 L 55 0 Z"
                    fill={AXM.bg}
                    stroke={AXM.parchment}
                    strokeWidth={1.5}
                />
                {/* head + horns */}
                <G transform="translate(0 -54)">
                    <Ellipse cx={0} cy={0} rx={15} ry={20} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
                    {/* horns */}
                    <Path d="M-10 -14 C -22 -28, -24 -40, -16 -50 M10 -14 C 22 -28, 24 -40, 16 -50" stroke={AXM.parchment} strokeWidth={2} fill="none" />
                    {/* glowing eyes */}
                    <Circle cx={-6} cy={-2} r={6} fill="url(#encEye)" />
                    <Circle cx={6} cy={-2} r={6} fill="url(#encEye)" />
                    <Circle cx={-6} cy={-2} r={2} fill={AXM.blood} />
                    <Circle cx={6} cy={-2} r={2} fill={AXM.blood} />
                    {/* maw */}
                    <Path d="M-7 8 L 7 8" stroke={AXM.blood} strokeWidth={1.5} />
                    <Path d="M-5 8 l 2 4 M0 8 l 0 4 M5 8 l -2 4" stroke={AXM.blood} strokeWidth={1} />
                </G>
                {/* clawed arms */}
                <Path d="M-40 -10 L -64 6 L -58 16 M-58 16 l -8 2 M-58 16 l 0 8 M40 -10 L 64 6 L 58 16 M58 16 l 8 2 M58 16 l 0 8"
                    stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
            </G>

            {/* Drifting embers */}
            <G>
                {EMBERS.map((e, i) => (
                    <Circle key={`e-${i}`} cx={e.cx} cy={e.cy} r={e.r} fill={e.warm ? AXM.sulfur : AXM.blood} opacity={0.5} />
                ))}
            </G>
        </Svg>
    );
}
