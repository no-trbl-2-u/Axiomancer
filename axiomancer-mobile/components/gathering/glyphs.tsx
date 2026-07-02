/**
 * Gathering minigame glyph kit — woodcut SVG marks in the hazard kit's
 * idiom. Shape is the accessibility channel: every material family,
 * trait, tool, and verdict has a distinct silhouette.
 */

import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

// ---------------------------------------------------------------------------
// Family glyphs (sprig / drop / shard / knuckle)
// ---------------------------------------------------------------------------

export function FamilyGlyph({
    kind,
    size = 26,
    color,
}: {
    kind: 'sprig' | 'drop' | 'shard' | 'knuckle';
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const sw = Math.max(1.4, size / 16);
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    switch (kind) {
        case 'sprig':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 21 C 12 14 12 9 12 5" {...s} />
                    <Path d="M12 9 C 9 9 6.5 7.5 6 4.5 C 9.5 4.5 11.5 6 12 9 Z" {...s} fill={color} fillOpacity={0.22} />
                    <Path d="M12 13 C 15 13 17.5 11.5 18 8.5 C 14.5 8.5 12.5 10 12 13 Z" {...s} fill={color} fillOpacity={0.22} />
                </Svg>
            );
        case 'drop':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 2.5 C 16 8 18.5 11.5 18.5 15 A 6.5 6.5 0 1 1 5.5 15 C 5.5 11.5 8 8 12 2.5 Z" {...s} fill={color} fillOpacity={0.22} />
                    <Path d="M9.5 14 C 9.5 16 10.5 17.5 12 18" {...s} strokeWidth={sw * 0.8} />
                </Svg>
            );
        case 'shard':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 2 L 17 9 L 15 21 L 9 21 L 7 9 Z" {...s} fill={color} fillOpacity={0.22} />
                    <Path d="M12 2 L 11 21 M 7 9 L 17 9" {...s} strokeWidth={sw * 0.7} />
                </Svg>
            );
        case 'knuckle':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M8 4 C 6 4 5 5.5 5 7 L 5 17 C 5 18.5 6 20 8 20" {...s} />
                    <Path d="M16 4 C 18 4 19 5.5 19 7 L 19 17 C 19 18.5 18 20 16 20" {...s} />
                    <Path d="M8 4 L 16 4 M 8 20 L 16 20 M 8 12 L 16 12" {...s} />
                    <Circle cx={8} cy={12} r={2.2} {...s} fill={color} fillOpacity={0.25} />
                    <Circle cx={16} cy={12} r={2.2} {...s} fill={color} fillOpacity={0.25} />
                </Svg>
            );
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// The Wrath Eye — the site, watching. Opens wider as wrath climbs.
// ---------------------------------------------------------------------------

export function WrathEye({
    open = 0,
    size = 22,
    color,
}: {
    /** 0 = lidded, 1 = wide open. */
    open?: number;
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.blood;
    const sw = Math.max(1.3, size / 14);
    const lid = 4 + 6 * Math.min(1, Math.max(0, open));
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            <Path d={`M2 12 Q 12 ${12 - lid} 22 12 Q 12 ${12 + lid} 2 12 Z`} {...s} />
            {open > 0.15 && <Circle cx={12} cy={12} r={2.4 + open * 1.2} {...s} fill={color} fillOpacity={0.3} />}
            {open > 0.6 && <Circle cx={12} cy={12} r={1} fill={color} />}
        </Svg>
    );
}

/** Grace mark — a small kneeling halo. */
export function GraceMark({ size = 18, color }: { size?: number; color?: string }) {
    const AXM = usePalette();
    color = color ?? AXM.sulfur;
    const s = { stroke: color, strokeWidth: Math.max(1.2, size / 14), fill: 'none' as const, strokeLinecap: 'round' as const };
    return (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            <Circle cx={12} cy={7} r={4} {...s} />
            <Path d="M5 21 C 7 15 17 15 19 21" {...s} />
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Trait glyphs — gift (open palm) / lure (hook) / breath (eased air) /
// tangle (knot)
// ---------------------------------------------------------------------------

export function TraitGlyph({
    kind,
    size = 14,
    color,
}: {
    kind: 'gift' | 'lure' | 'breath' | 'tangle';
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const sw = Math.max(1.2, size / 12);
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    switch (kind) {
        case 'gift':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M4 13 C 8 9 16 9 20 13" {...s} />
                    <Path d="M4 13 C 7 17 17 17 20 13" {...s} />
                    <Circle cx={12} cy={9} r={2} {...s} fill={color} fillOpacity={0.3} />
                </Svg>
            );
        case 'lure':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M12 3 V 13 A 4.5 4.5 0 1 0 16.5 17.5" {...s} />
                    <Path d="M16.5 17.5 L 15 14.5 M 16.5 17.5 L 19 16" {...s} strokeWidth={sw * 0.9} />
                </Svg>
            );
        case 'breath':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M3 9 C 8 6 12 12 17 9 C 19 8 20 6.5 20.5 5" {...s} />
                    <Path d="M3 15 C 8 12 12 18 17 15 C 19 14 20 12.5 20.5 11" {...s} strokeWidth={sw * 0.8} />
                </Svg>
            );
        case 'tangle':
            return (
                <Svg viewBox="0 0 24 24" width={size} height={size}>
                    <Path d="M5 5 C 14 5 10 19 19 19 M 19 5 C 10 5 14 19 5 19" {...s} />
                </Svg>
            );
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Tool glyphs
// ---------------------------------------------------------------------------

export function ToolGlyph({
    kind,
    size = 20,
    color,
}: {
    kind: 'sickle' | 'veil' | 'twig' | 'bell' | 'jar' | 'spade';
    size?: number;
    color?: string;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const sw = Math.max(1.3, size / 14);
    const s = { stroke: color, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
    const wrap = (children: React.ReactNode) => (
        <Svg viewBox="0 0 24 24" width={size} height={size}>
            {children}
        </Svg>
    );
    switch (kind) {
        case 'sickle':
            return wrap(
                <>
                    <Path d="M18 4 A 9 9 0 1 0 19 14 A 6.5 6.5 0 1 1 18 4 Z" {...s} fill={color} fillOpacity={0.2} />
                    <Path d="M15 17 L 18 21" {...s} strokeWidth={sw * 1.4} />
                </>,
            );
        case 'veil':
            return wrap(
                <>
                    <Path d="M4 8 C 9 4 15 4 20 8 L 19 18 C 14 15 10 15 5 18 Z" {...s} fill={color} fillOpacity={0.15} />
                    <Path d="M8 9.5 H 16" {...s} strokeWidth={sw * 0.8} />
                </>,
            );
        case 'twig':
            return wrap(
                <>
                    <Path d="M12 21 L 12 10 M 12 10 L 6 4 M 12 10 L 18 4" {...s} />
                    <Path d="M9 7 L 10.5 8.5 M 15 7 L 13.5 8.5" {...s} strokeWidth={sw * 0.8} />
                </>,
            );
        case 'bell':
            return wrap(
                <>
                    <Path d="M12 3 C 8 3 7 7 7 11 C 7 14 5.5 15.5 5 16.5 L 19 16.5 C 18.5 15.5 17 14 17 11 C 17 7 16 3 12 3 Z" {...s} fill={color} fillOpacity={0.18} />
                    <Path d="M10 19 A 2 2 0 0 0 14 19" {...s} />
                </>,
            );
        case 'jar':
            return wrap(
                <>
                    <Rect x={7} y={7} width={10} height={13} {...s} fill={color} fillOpacity={0.15} />
                    <Path d="M7 10 H 17 M 9 4.5 H 15 L 16 7 H 8 Z" {...s} />
                </>,
            );
        case 'spade':
            return wrap(
                <>
                    <Path d="M12 3 L 12 12" {...s} />
                    <Path d="M12 12 C 8 12 6.5 15 6.5 17 C 6.5 19.5 9 21 12 21 C 15 21 17.5 19.5 17.5 17 C 17.5 15 16 12 12 12 Z" {...s} fill={color} fillOpacity={0.2} />
                    <Path d="M10 3 H 14" {...s} />
                </>,
            );
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Richness pips — ◆ per point of yield
// ---------------------------------------------------------------------------

export function RichnessPips({
    count,
    size = 9,
    color,
    max = 4,
}: {
    count: number;
    size?: number;
    color?: string;
    max?: number;
}) {
    const AXM = usePalette();
    color = color ?? AXM.parchment;
    const n = Math.max(0, Math.min(max, count));
    if (n === 0) return null;
    const w = size + 3;
    return (
        <Svg viewBox={`0 0 ${w * n} ${size + 2}`} width={w * n} height={size + 2}>
            <G>
                {Array.from({ length: n }, (_, i) => {
                    const cx = i * w + size / 2 + 1;
                    const cy = size / 2 + 1;
                    const r = size / 2;
                    return (
                        <Path
                            key={i}
                            d={`M${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
                            fill={color}
                            fillOpacity={0.85}
                        />
                    );
                })}
            </G>
        </Svg>
    );
}

// ---------------------------------------------------------------------------
// Roots overlay for living panels (the gathering's `Cracks` analogue)
// ---------------------------------------------------------------------------

export function Roots({ seed = 1, opacity = 0.45 }: { seed?: number; opacity?: number }) {
    const r = (i: number) => {
        const x = Math.sin(i * 6113 + seed * 977) * 5407;
        return x - Math.floor(x);
    };
    const lines: string[] = [];
    for (let i = 0; i < 5; i++) {
        let x = r(i) * 100;
        let y = 100;
        const pts = [`M${x.toFixed(1)} ${y}`];
        for (let k = 0; k < 4; k++) {
            x += (r(i * 7 + k) - 0.5) * 26;
            y -= r(i * 3 + k + 4) * 28 + 6;
            pts.push(`Q ${(x + (r(i + k) - 0.5) * 14).toFixed(1)} ${(y + 9).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
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
                    <Path key={i} d={d} stroke="#000" strokeWidth={0.6} fill="none" />
                ))}
                {lines.map((d, i) => (
                    <Path key={`h${i}`} d={d} stroke="rgba(138,184,106,0.07)" strokeWidth={0.35} fill="none" translateX={0.4} translateY={0.4} />
                ))}
            </G>
        </Svg>
    );
}
