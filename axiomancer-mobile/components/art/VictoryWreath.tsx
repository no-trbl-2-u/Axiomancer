/**
 * Victory laurel (visual-audit 2026-06) — a ceremonial wreath for the
 * combat aftermath. Two mirrored laurel branches curving up to a central
 * sulfur sigil. Theme-aware; decorative (hidden from a11y).
 *
 * Used to anchor the victory panel's spoils area so a win reads as an
 * earned, ceremonial beat rather than an empty page.
 */

import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

interface VictoryWreathProps {
    size?: number;
    color?: string;
    accent?: string;
}

// Leaves placed along each branch arc, as [x, y, rotationDeg].
const LEAVES: ReadonlyArray<readonly [number, number, number]> = [
    [52, 86, -10],
    [44, 74, -24],
    [37, 60, -36],
    [32, 46, -50],
    [30, 33, -66],
    [31, 21, -82],
];

function Branch({ color }: { color: string }) {
    return (
        <G>
            {/* stem */}
            <Path
                d="M60 92 C 40 86, 28 64, 30 22"
                fill="none"
                stroke={color}
                strokeWidth={1.6}
                strokeLinecap="round"
            />
            {LEAVES.map(([x, y, rot], i) => (
                <Ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx={6.5}
                    ry={2.6}
                    fill={color}
                    opacity={0.85}
                    transform={`rotate(${rot} ${x} ${y})`}
                />
            ))}
        </G>
    );
}

export function VictoryWreath({ size = 96, color, accent }: VictoryWreathProps) {
    const AXM = usePalette();
    const resolvedColor = color ?? AXM.bone;
    const resolvedAccent = accent ?? AXM.sulfur;
    return (
        <Svg
            width={size}
            height={size * 0.84}
            viewBox="0 0 120 100"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {/* left branch */}
            <Branch color={resolvedColor} />
            {/* right branch (mirrored) */}
            <G transform="translate(120 0) scale(-1 1)">
                <Branch color={resolvedColor} />
            </G>
            {/* crowning sigil */}
            <Circle cx={60} cy={16} r={9} fill="none" stroke={resolvedAccent} strokeWidth={1.4} opacity={0.8} />
            <Path d="M60 8 L 63 16 L 60 24 L 57 16 Z" fill={resolvedAccent} />
            <Circle cx={60} cy={16} r={2} fill={AXM.bg} />
        </Svg>
    );
}
