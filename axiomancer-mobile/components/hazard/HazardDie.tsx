/**
 * The physically-cast mana die — a faux-isometric SVG cube with three
 * visible faces (lit top, mid front carrying the colour glyph, shadow
 * right), a cast shadow, and an interactive glow halo. States: spent
 * (dimmed + diagonal slash), hex (black hostile ✕), temporary
 * (dashed conjured rim).
 *
 * Recreates the prototype's `Die3D` (CSS preserve-3d) with SVG so the
 * same object renders on native and web.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Line, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { HazardDieKind } from 'axiomancer-mechanics';
import { usePalette } from '@/theme/runtime';

import { DIE } from './palette';
import { DieGlyph } from './glyphs';

export interface HazardDieProps {
    kind: HazardDieKind;
    size?: number;
    state?: 'available' | 'spent';
    glow?: boolean;
    temporary?: boolean;
}

export const HazardDie = React.memo(function HazardDie({ kind, size = 48, state = 'available', glow = false, temporary = false }: HazardDieProps) {
    const AXM = usePalette();
    const d = DIE[kind];
    const isHex = kind === 'hex';
    const o = Math.round(size * 0.32); // isometric offset
    const W = size + o;
    const H = size + o;
    const dim = state === 'spent' ? 0.42 : 1;
    const glowColor = isHex ? '#8a57bd' : d.c;
    const gradId = `hzglow-${kind}-${size}-${state}-${glow ? 1 : 0}`;

    return (
        <View style={{ width: W, height: H + size * 0.18 }}>
            {/* glow halo */}
            {glow && (
                <Svg
                    width={W * 1.8}
                    height={H * 1.8}
                    style={{ position: 'absolute', left: -W * 0.4, top: -H * 0.34 }}
                    pointerEvents="none"
                >
                    <Defs>
                        <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={glowColor} stopOpacity={0.32} />
                            <Stop offset="70%" stopColor={glowColor} stopOpacity={0} />
                        </RadialGradient>
                    </Defs>
                    <Rect x={0} y={0} width={W * 1.8} height={H * 1.8} fill={`url(#${gradId})`} />
                </Svg>
            )}
            {/* cast shadow */}
            <View
                style={{
                    position: 'absolute',
                    left: W * 0.12,
                    top: H - size * 0.04,
                    width: size * 0.85,
                    height: size * 0.24,
                    borderRadius: size,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    opacity: state === 'spent' ? 0.35 : 0.75,
                }}
            />
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ opacity: dim }}>
                {/* top face (lit) */}
                <Polygon
                    points={`${o},0 ${W},0 ${size},${o} 0,${o}`}
                    fill={isHex ? '#15141a' : d.lite}
                    stroke={d.dark}
                    strokeWidth={1}
                />
                {/* right face (shadow) */}
                <Polygon
                    points={`${size},${o} ${W},0 ${W},${size} ${size},${H}`}
                    fill={isHex ? '#060608' : d.dark}
                    stroke={d.dark}
                    strokeWidth={1}
                />
                {/* front face (mid, carries the glyph) */}
                <Rect
                    x={0}
                    y={o}
                    width={size}
                    height={size}
                    fill={isHex ? '#0c0c0e' : d.bg}
                    stroke={temporary ? d.lite : d.dark}
                    strokeWidth={temporary ? 1.6 : 1}
                    strokeDasharray={temporary ? '4 3' : undefined}
                />
                {/* inner colour wash on front face */}
                {!isHex && (
                    <Rect x={1.5} y={o + 1.5} width={size - 3} height={size - 3} fill={d.c} opacity={0.3} />
                )}
                {/* spent slash */}
                {state === 'spent' && (
                    <Line x1={-2} y1={o + size * 0.62} x2={size + 2} y2={o + size * 0.28} stroke={AXM.bone} strokeWidth={2.4} opacity={0.92} />
                )}
            </Svg>
            {/* glyph centered on front face */}
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: o,
                    width: size,
                    height: size,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: dim,
                }}
                pointerEvents="none"
            >
                <DieGlyph kind={d.glyph} size={size * 0.56} color={isHex ? '#cdbede' : d.lite} />
            </View>
        </View>
    );
});
