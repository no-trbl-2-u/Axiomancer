/**
 * Bespoke enemy figures (visual-audit 2026-06). Each is a distinct
 * creature silhouette drawn in the CreatureScene's ground-origin space
 * (feet at y≈0, body rising into negative-y, width within x∈[-64,64]).
 * Theme-aware: silhouettes are `AXM.bg` filled with `AXM.parchment`
 * strokes; eyes glow via the scene's `url(#enemyEyeGlow)`.
 *
 * Figures are grouped by archetype so the 40+ enemy roster maps onto a
 * handful of recognisable shapes (a rat ≠ a crab ≠ a wraith ≠ a saint),
 * with named bosses getting the crowned / eldritch treatments.
 */

import React from 'react';
import { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

function GlowEyes({ cx = 0, y, sep = 6, r = 2 }: { cx?: number; y: number; sep?: number; r?: number }) {
    const AXM = usePalette();
    return (
        <>
            <Circle cx={cx - sep} cy={y} r={r * 3} fill="url(#enemyEyeGlow)" />
            <Circle cx={cx + sep} cy={y} r={r * 3} fill="url(#enemyEyeGlow)" />
            <Circle cx={cx - sep} cy={y} r={r} fill={AXM.blood} />
            <Circle cx={cx + sep} cy={y} r={r} fill={AXM.blood} />
        </>
    );
}

/** Rat / vermin — hunched body, long snout, big ears, curling tail. */
export function VerminFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* tail */}
            <Path d="M-44 -8 C -66 -10, -70 -34, -54 -38" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
            {/* body */}
            <Path d="M-46 -2 Q -44 -34 -6 -34 Q 30 -34 44 -18 L 44 -2 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
            {/* haunch */}
            <Circle cx={-26} cy={-16} r={16} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* head + snout */}
            <Path d="M30 -26 L 58 -16 L 46 -8 Q 34 -8 30 -16 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
            {/* ears */}
            <Circle cx={30} cy={-30} r={6} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.2} />
            <Circle cx={18} cy={-30} r={6} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* feet */}
            <Line x1={-30} y1={-2} x2={-30} y2={4} stroke={AXM.parchment} strokeWidth={1.5} />
            <Line x1={36} y1={-2} x2={36} y2={4} stroke={AXM.parchment} strokeWidth={1.5} />
            <GlowEyes cx={40} y={-18} sep={0} r={1.6} />
            <Circle cx={57} cy={-14} r={1.4} fill={AXM.blood} />
        </G>
    );
}

/** Crab / crustacean — broad carapace, raised claws, eye-stalks, legs. */
export function CrustaceanFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* legs */}
            {[-40, -28, -16, 16, 28, 40].map((x, i) => (
                <Path key={i} d={`M${x * 0.6} -10 L ${x} -2 L ${x + (x < 0 ? -4 : 4)} 4`} fill="none" stroke={AXM.parchment} strokeWidth={1.4} />
            ))}
            {/* carapace */}
            <Path d="M-48 -12 Q 0 -40 48 -12 Q 40 0 0 0 Q -40 0 -48 -12 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            <Path d="M-22 -20 Q 0 -16 22 -20" fill="none" stroke={AXM.parchment} strokeWidth={1} opacity={0.7} />
            {/* claws */}
            <Path d="M-44 -16 Q -64 -28 -60 -46 L -68 -42 M-60 -46 L -52 -52 Q -44 -44 -52 -40" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
            <Path d="M44 -16 Q 64 -28 60 -46 L 68 -42 M60 -46 L 52 -52 Q 44 -44 52 -40" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
            {/* eye-stalks */}
            <Line x1={-8} y1={-30} x2={-10} y2={-42} stroke={AXM.parchment} strokeWidth={1.4} />
            <Line x1={8} y1={-30} x2={10} y2={-42} stroke={AXM.parchment} strokeWidth={1.4} />
            <Circle cx={-10} cy={-44} r={2.4} fill={AXM.blood} />
            <Circle cx={10} cy={-44} r={2.4} fill={AXM.blood} />
        </G>
    );
}

/** Wisp / wraith — floating tattered shroud, hollow hood, no legs. */
export function SpiritFigure() {
    const AXM = usePalette();
    return (
        <G opacity={0.96}>
            {/* shroud body, ragged hem floating above ground */}
            <Path
                d="M0 -78 C -26 -74 -34 -44 -32 -10 L -26 -18 L -20 -8 L -12 -16 L -4 -6 L 4 -6 L 12 -16 L 20 -8 L 26 -18 L 32 -10 C 34 -44 26 -74 0 -78 Z"
                fill={AXM.bg}
                fillOpacity={0.55}
                stroke={AXM.parchment}
                strokeWidth={1.5}
                strokeOpacity={0.8}
            />
            {/* hood opening */}
            <Path d="M-14 -64 Q 0 -76 14 -64 Q 8 -46 0 -46 Q -8 -46 -14 -64 Z" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1} strokeOpacity={0.6} />
            {/* trailing wisps */}
            <Path d="M-30 -16 q -10 8 -6 18 M30 -16 q 10 8 6 18" fill="none" stroke={AXM.parchment} strokeWidth={1} strokeOpacity={0.4} />
            <GlowEyes y={-60} sep={5} r={1.8} />
        </G>
    );
}

/** Hound / wolf / beast — low quadruped, lowered fanged head, ears, tail. */
export function BeastFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* legs */}
            {[-34, -22, 18, 30].map((x, i) => (
                <Path key={i} d={`M${x} -18 L ${x} 2`} stroke={AXM.parchment} strokeWidth={2} />
            ))}
            {/* body */}
            <Path d="M-40 -20 Q -44 -38 -20 -38 L 20 -36 Q 40 -34 44 -20 L 40 -16 L -36 -16 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* tail */}
            <Path d="M-40 -28 C -58 -30 -60 -16 -52 -10" fill="none" stroke={AXM.parchment} strokeWidth={1.6} />
            {/* lowered head + snout */}
            <Path d="M40 -30 L 64 -24 L 66 -16 L 50 -14 Q 40 -16 40 -26 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* ear */}
            <Path d="M40 -34 L 36 -46 L 46 -38 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* fangs */}
            <Path d="M52 -14 l 2 5 M58 -15 l 1 5" stroke={AXM.parchment} strokeWidth={1} />
            <GlowEyes cx={48} y={-26} sep={0} r={1.6} />
        </G>
    );
}

/** Gull / crow — upright bird, folded wing, beak, thin legs. */
export function AvianFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* legs */}
            <Path d="M-6 -8 L -8 2 M-12 2 L -8 2 L -4 2" stroke={AXM.parchment} strokeWidth={1.4} fill="none" />
            <Path d="M6 -8 L 8 2 M4 2 L 8 2 L 12 2" stroke={AXM.parchment} strokeWidth={1.4} fill="none" />
            {/* body */}
            <Path d="M0 -64 Q -22 -56 -20 -18 Q -10 -8 0 -8 Q 10 -8 20 -18 Q 22 -56 0 -64 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* folded wing */}
            <Path d="M-2 -52 Q -22 -44 -16 -16 Q -6 -22 -4 -44 Z" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* head + beak */}
            <Circle cx={2} cy={-62} r={9} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
            <Path d="M10 -62 L 26 -60 L 10 -56 Z" fill={AXM.sulfur} stroke={AXM.parchment} strokeWidth={1} />
            <GlowEyes cx={4} y={-64} sep={0} r={1.6} />
        </G>
    );
}

/** Treant / sprite / flora — gnarled trunk, branch arms, knothole eyes, roots. */
export function FloraFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* roots */}
            <Path d="M-6 -6 L -22 4 M-4 -6 L -8 4 M4 -6 L 8 4 M6 -6 L 22 4" stroke={AXM.parchment} strokeWidth={1.6} fill="none" />
            {/* trunk */}
            <Path d="M-16 -4 Q -20 -44 -10 -64 Q 0 -74 10 -64 Q 20 -44 16 -4 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.8} />
            {/* bark lines */}
            <Path d="M-4 -10 Q -2 -40 -6 -60 M6 -12 Q 8 -42 4 -60" fill="none" stroke={AXM.parchment} strokeWidth={0.8} opacity={0.5} />
            {/* branch arms */}
            <Path d="M-14 -48 C -34 -54 -40 -70 -36 -84 M-36 -84 l -8 4 M-36 -84 l 2 -8" fill="none" stroke={AXM.parchment} strokeWidth={1.6} />
            <Path d="M14 -48 C 34 -54 40 -70 36 -84 M36 -84 l 8 4 M36 -84 l -2 -8" fill="none" stroke={AXM.parchment} strokeWidth={1.6} />
            {/* knothole eyes */}
            <GlowEyes y={-50} sep={7} r={2.2} />
            {/* maw knot */}
            <Path d="M-6 -36 Q 0 -30 6 -36" fill="none" stroke={AXM.parchment} strokeWidth={1.2} />
        </G>
    );
}

/** Hooded zealot / cleric — robed figure, pointed hood, hidden eyes, staff. */
export function ZealotFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* staff */}
            <Line x1={34} y1={-78} x2={34} y2={2} stroke={AXM.parchment} strokeWidth={1.5} />
            <Circle cx={34} cy={-80} r={4} fill="none" stroke={AXM.sulfur} strokeWidth={1.4} />
            {/* robe */}
            <Path d="M-30 2 L -18 -50 Q 0 -64 18 -50 L 30 2 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* sleeve fold */}
            <Path d="M-18 -44 L -26 -14 M18 -44 L 26 -22" fill="none" stroke={AXM.parchment} strokeWidth={1.2} opacity={0.7} />
            {/* hood */}
            <Path d="M-16 -52 Q 0 -84 16 -52 Q 8 -44 0 -44 Q -8 -44 -16 -52 Z" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1.5} />
            <GlowEyes y={-58} sep={5} r={1.8} />
        </G>
    );
}

/** Eldritch / abstract — floating broken sigil, central vertical eye, shards. */
export function EldritchFigure() {
    const AXM = usePalette();
    const shards = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
        <G transform="translate(0 -40)">
            {/* radiating shards */}
            {shards.map((deg) => {
                const a = (deg * Math.PI) / 180;
                const x1 = Math.cos(a) * 30;
                const y1 = Math.sin(a) * 30;
                const x2 = Math.cos(a) * 46;
                const y2 = Math.sin(a) * 46;
                return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AXM.sulfur} strokeWidth={1.4} opacity={0.7} />;
            })}
            {/* broken rings */}
            <Path d="M-34 0 A 34 34 0 0 1 0 -34 M0 34 A 34 34 0 0 1 -34 0" fill="none" stroke={AXM.parchment} strokeWidth={1.6} />
            <Path d="M34 0 A 34 34 0 0 1 0 34 M0 -34 A 34 34 0 0 1 34 0" fill="none" stroke={AXM.parchment} strokeWidth={1.6} opacity={0.6} />
            <Circle cx={0} cy={0} r={20} fill="none" stroke={AXM.parchment} strokeWidth={0.8} opacity={0.4} strokeDasharray="2 5" />
            {/* central vertical eye */}
            <Path d="M-4 -16 Q 0 0 -4 16 Q 8 0 -4 -16 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.4} transform="translate(2 0)" />
            <Circle cx={0} cy={0} r={6} fill="url(#enemyEyeGlow)" />
            <Circle cx={0} cy={0} r={3} fill={AXM.blood} />
            <Circle cx={0} cy={0} r={1} fill={AXM.sulfur} />
        </G>
    );
}

/** Generic horned creature — the fallback when an enemy matches no archetype. */
export function GenericFigure() {
    const AXM = usePalette();
    return (
        <G>
            <Path
                d="M-50 0 L -55 -20 L -40 -30 L -25 -10 L -10 -38 L 5 -22 L 25 -45 L 38 -25 L 50 -8 L 55 0 Z"
                fill={AXM.bg}
                stroke={AXM.parchment}
                strokeWidth={1.5}
            />
            <G transform="translate(0 -54)">
                <Ellipse cx={0} cy={0} rx={15} ry={20} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
                <Path d="M-10 -14 C -22 -28, -24 -40, -16 -50 M10 -14 C 22 -28, 24 -40, 16 -50" stroke={AXM.parchment} strokeWidth={2} fill="none" />
                <GlowEyes y={-2} sep={6} r={2} />
                <Path d="M-7 8 L 7 8" stroke={AXM.blood} strokeWidth={1.5} />
            </G>
        </G>
    );
}

/** Crowned tyrant (boss) — broad enthroned figure, spiked gold crown, glare. */
export function TyrantFigure() {
    const AXM = usePalette();
    return (
        <G>
            {/* throne back */}
            <Path d="M-50 2 L -50 -86 L -36 -70 L -36 2 M50 2 L 50 -86 L 36 -70 L 36 2" fill="none" stroke={AXM.parchment} strokeWidth={1.6} opacity={0.7} />
            {/* robed body */}
            <Path d="M-40 2 L -28 -64 Q 0 -78 28 -64 L 40 2 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.8} />
            <Path d="M0 -64 L 0 2 M-28 -50 L -34 2 M28 -50 L 34 2" fill="none" stroke={AXM.parchment} strokeWidth={1} opacity={0.5} />
            {/* shoulders / arms */}
            <Path d="M-28 -60 Q -48 -52 -44 -24 M28 -60 Q 48 -52 44 -24" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
            {/* head */}
            <Ellipse cx={0} cy={-78} rx={15} ry={18} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.6} />
            {/* crown */}
            <Path d="M-16 -90 L -16 -104 L -8 -94 L 0 -108 L 8 -94 L 16 -104 L 16 -90 Z" fill={AXM.sulfur} stroke={AXM.parchment} strokeWidth={1} />
            <Circle cx={0} cy={-100} r={2} fill={AXM.blood} />
            <GlowEyes y={-80} sep={6} r={2.2} />
            <Path d="M-6 -70 L 6 -70" stroke={AXM.blood} strokeWidth={1.4} />
        </G>
    );
}
