/**
 * Hazard minigame glyph kit — woodcut SVG marks ported from the
 * design-handoff prototype (`hazard-kit.jsx`, `hazard-proto-rewards.jsx`).
 * Shape is the accessibility channel: every die colour, progress type,
 * verdict, and boon has a distinct silhouette.
 */

import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

// ---------------------------------------------------------------------------
// Die-face glyphs (blade / eye / crescent / sun / cross)
// ---------------------------------------------------------------------------

export function DieGlyph({
    kind,
    size = 26,
    color,
}: {
    kind: 'blade' | 'eye' | 'crescent' | 'sun' | 'cross' | 'path';
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const sw = Math.max(1.4, size / 16);
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    switch (kind) {
        case 'blade':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 2 L 14 9 L 12 22 L 10 9 Z" {...s} fill={color} fillOpacity={0.22} />
                    <Path d="M9 8 L 15 8" {...s} strokeWidth={sw * 0.8} />
                </Svg>
            );
        case 'path':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 21 L 12 6" {...s} />
                    <Path d="M6 12 L 12 5 L 18 12" {...s} />
                    <Path d="M12 14 L 8 17 M 12 14 L 16 17" {...s} strokeWidth={sw * 0.8} />
                </Svg>
            );
        case 'eye':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M2 12 Q 12 4 22 12 Q 12 20 2 12 Z" {...s} />
                    <Circle cx={12} cy={12} r={3} {...s} />
                    <Circle cx={12} cy={12} r={1} fill={color} />
                </Svg>
            );
        case 'sun':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Circle cx={12} cy={12} r={4.5} {...s} fill={color} fillOpacity={0.22} />
                    <Path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M19 5 L17 7 M5 19 L7 17 M19 19 L17 17" {...s} strokeWidth={sw * 0.8} />
                </Svg>
            );
        case 'crescent':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M16 4 A 9 9 0 1 0 16 20 A 7 7 0 1 1 16 4 Z" {...s} fill={color} fillOpacity={0.3} />
                </Svg>
            );
        case 'cross':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M5 5 L 19 19 M 19 5 L 5 19" {...s} strokeWidth={sw * 1.7} />
                </Svg>
            );
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Progress-type glyphs — FORCE (fist) / ESCAPE (runner) / PASSAGE (fist)
// ---------------------------------------------------------------------------

export function ProgGlyph({
    kind,
    size = 18,
    color,
}: {
    kind: 'force' | 'escape' | 'passage';
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const sw = Math.max(1.3, size / 13);
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    if (kind === 'escape') {
        return (
            <Svg viewBox="0 0 24 24" width={size} height={size}>
                <Circle cx={14} cy={4.5} r={2} fill={color} />
                <Path d="M14 7 L 11 12 L 15 14 L 13 21 M 11 12 L 6 11 M 15 14 L 19 12 M 11 12 L 8 16" {...s} />
            </Svg>
        );
    }
    // force / passage — fist
    return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            <Path d="M5 9 C5 7 7 6 9 6 L15 6 C17 6 18 7 18 9 L18 13 C18 17 15 19 12 19 C8 19 5 17 5 13 Z" {...s} fill={color} fillOpacity={0.2} />
            <Path d="M8 8 V6.5 M11 8 V6 M14 8 V6.5 M5 10.5 H18" {...s} strokeWidth={sw * 0.8} />
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Ledger marks — the verdicts, distinguishable by SHAPE alone.
// ---------------------------------------------------------------------------

export function LedgerMark({
    kind,
    size = 24,
}: {
    kind: 'O' | 'X' | 'pending';
    size?: number;
}) {
    const AXM = usePalette();
    if (kind === 'O') {
        return (
            <Svg viewBox="0 0 24 24" width={size} height={size}>
                <Circle cx={12} cy={12} r={9.5} fill="#1c1a14" stroke={AXM.parchment} strokeWidth={2.2} />
                <Path d="M7.5 12.5 L 10.5 15.5 L 16.5 8.5" stroke={AXM.parchment} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        );
    }
    if (kind === 'X') {
        return (
            <Svg viewBox="0 0 24 24" width={size} height={size}>
                <Circle cx={12} cy={12} r={9.5} fill="#160606" stroke={AXM.blood} strokeWidth={2.2} />
                <Path d="M7.5 7.5 L 16.5 16.5 M 16.5 7.5 L 7.5 16.5" stroke={AXM.blood} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            </Svg>
        );
    }
    return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            <Circle cx={12} cy={12} r={9.5} fill="none" stroke={AXM.ash} strokeWidth={1.6} strokeDasharray="2 2.4" />
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Boon / consequence icons (rewards modal)
// ---------------------------------------------------------------------------

export function BoonIcon({
    icon,
    color,
    size = 22,
}: {
    icon: string;
    color?: string;
    size?: number;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const s = { stroke: color, strokeWidth: 1.5, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    const wrap = (children: React.ReactNode) => (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            {children}
        </Svg>
    );
    switch (icon) {
        case 'chest':
            return wrap(
                <>
                    <Path d="M3 9 L12 5 L21 9 L21 19 L3 19 Z" {...s} />
                    <Path d="M3 9 H21 M12 5 V19" {...s} />
                    <Rect x={10.5} y={11} width={3} height={4} fill={color} />
                </>,
            );
        case 'relic':
            return wrap(<Path d="M12 2 L15 8 L21 9 L16 14 L17 21 L12 17 L7 21 L8 14 L3 9 L9 8 Z" {...s} />);
        case 'heart':
            return wrap(
                <Path d="M12 21 C4 14 3 8 7 6 C10 4.5 11.5 6.5 12 8 C12.5 6.5 14 4.5 17 6 C21 8 20 14 12 21 Z" fill={color} stroke={color} />,
            );
        case 'paradox':
            return wrap(
                <Path d="M4 12 C4 9 6 7 8 7 C10 7 11 9 12 12 C13 15 14 17 16 17 C18 17 20 15 20 12 C20 9 18 7 16 7 C14 7 13 9 12 12 C11 15 10 17 8 17 C6 17 4 15 4 12 Z" {...s} />,
            );
        case 'tokens':
            return wrap(
                <>
                    <Circle cx={9} cy={9} r={5} {...s} />
                    <Circle cx={15} cy={15} r={5} {...s} />
                    <Path d="M5.5 12.5 L12.5 5.5" stroke={AXM.blood} strokeWidth={1.6} />
                </>,
            );
        case 'deadcard':
            return wrap(
                <>
                    <Rect x={6} y={3} width={12} height={18} {...s} />
                    <Path d="M9 8 L15 14 M15 8 L9 14" {...s} />
                    <Path d="M9 17 H15" {...s} />
                </>,
            );
        case 'maxhp':
            return wrap(
                <>
                    <Path d="M12 20 C5 14 4 9 7 7 C9.5 5.5 11.5 7 12 8.5 C12.5 7 14.5 5.5 17 7 C19 8.3 19 11 16 14" {...s} />
                    <Path d="M16 18 H22 M19 15 V21" stroke={AXM.blood} strokeWidth={1.8} />
                </>,
            );
        case 'minhp':
            return wrap(
                <>
                    <Path d="M12 21 C4 14 3 8 7 6 C10 4.5 11.5 6.5 12 8 C12.5 6.5 14 4.5 17 6 C21 8 20 14 12 21 Z" {...s} />
                    <Path d="M12 12 q2 3 0 5 q-2 -2 0 -5Z" fill={AXM.blood} stroke={AXM.blood} />
                </>,
            );
        case 'curse':
            return wrap(<Path d="M16 4 A9 9 0 1 0 16 20 A7 7 0 1 1 16 4 Z" {...s} fill={color} fillOpacity={0.3} />);
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Hairline crack overlay for stone panels
// ---------------------------------------------------------------------------

export function Cracks({ seed = 1, opacity = 0.5 }: { seed?: number; opacity?: number }) {
    const r = (i: number) => {
        const x = Math.sin(i * 7301 + seed * 1117) * 4391;
        return x - Math.floor(x);
    };
    const lines: string[] = [];
    for (let i = 0; i < 5; i++) {
        const pts = [`M${r(i) * 100} ${r(i + 9) * 100}`];
        let x = r(i) * 100;
        let y = r(i + 9) * 100;
        for (let k = 0; k < 3; k++) {
            x += (r(i * 5 + k) - 0.5) * 36;
            y += (r(i * 5 + k + 2) - 0.4) * 30;
            pts.push(`L${x} ${y}`);
        }
        lines.push(pts.join(' '));
    }
    return (
        <Svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}
            pointerEvents="none"
        >
            <G>
                {lines.map((d, i) => (
                    <Path key={i} d={d} stroke="#000" strokeWidth={0.5} fill="none" />
                ))}
                {lines.map((d, i) => (
                    <Path key={`h${i}`} d={d} stroke="rgba(232,223,200,0.05)" strokeWidth={0.3} fill="none" translateX={0.4} translateY={0.4} />
                ))}
            </G>
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Trash bin — the discard/salvage drop target
// ---------------------------------------------------------------------------

export function TrashGlyph({ size = 22, color }: { size?: number; color?: string }) {
    const AXM = usePalette();
    color = color ?? AXM.bone;
    const s = { stroke: color, strokeWidth: 1.6, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            <Path d="M5 7 L6.5 21 H17.5 L19 7" {...s} />
            <Path d="M3.5 7 H20.5 M9 7 V4.5 H15 V7" {...s} />
            <Path d="M9.5 10.5 V17.5 M12 10.5 V17.5 M14.5 10.5 V17.5" {...s} strokeWidth={1.2} />
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Cast shadow ellipse for dice
// ---------------------------------------------------------------------------

export function CastShadow({ width, height }: { width: number; height: number }) {
    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="rgba(0,0,0,0.55)" />
        </Svg>
    );
}
