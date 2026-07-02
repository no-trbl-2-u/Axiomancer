/**
 * Hazard danger-intro art — one small grim SVG vignette per authored
 * hazard, keyed by hazard def id. Pure silhouette work in the AXM
 * palette: a doomed pilgrim against whatever is about to kill him.
 * The intro overlay (`HazardIntroOverlay`) renders these at full
 * panel width; unknown ids fall back to the cliff vignette.
 */

import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

const INK = '#0c0a08';
const STONE = '#1d1813';
const SMOKE = '#2a231b';

export interface DangerArtProps {
    width?: number;
    height?: number;
}

/** Doomed pilgrim silhouette (shared): hunched walker with a staff. */
function Pilgrim({ x, y, scale = 1, color }: { x: number; y: number; scale?: number; color?: string }) {
    const AXM = usePalette();
    color = color ?? AXM.bone;
    return (
        <G transform={`translate(${x}, ${y}) scale(${scale})`}>
            <Circle cx={0} cy={-14} r={3.4} fill={color} />
            <Path d="M -1.5 -11 Q -4 -4 -2.5 4 L -4.5 14 M -1.5 -11 Q 2 -4 1.5 4 L 4 14" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Line x1={1} y1={-8} x2={7} y2={14} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </G>
    );
}

function CliffArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* two cliff faces, the split between them */}
            <Path d="M 0 150 L 0 40 L 70 48 L 110 64 L 132 92 L 120 150 Z" fill={STONE} />
            <Path d="M 300 150 L 300 30 L 220 44 L 178 70 L 168 100 L 184 150 Z" fill={STONE} />
            {/* the crack lightning-lines */}
            <Path d="M 132 92 L 148 104 L 140 120 L 154 134 L 148 150" stroke={AXM.blood} strokeWidth={1.6} fill="none" />
            <Path d="M 110 64 L 96 80 L 104 96" stroke={SMOKE} strokeWidth={1.2} fill="none" />
            {/* falling stones */}
            <Rect x={142} y={58} width={5} height={5} fill={AXM.bone} opacity={0.5} transform="rotate(24 144 60)" />
            <Rect x={156} y={84} width={4} height={4} fill={AXM.bone} opacity={0.35} transform="rotate(-18 158 86)" />
            {/* pilgrim at the failing edge */}
            <Pilgrim x={116} y={48} />
            {/* the prize across the split */}
            <Circle cx={236} cy={36} r={3} fill={AXM.sulfur} opacity={0.9} />
        </Svg>
    );
}

function FloodArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* crypt arch + descending stairs */}
            <Path d="M 40 150 L 40 50 Q 150 6 260 50 L 260 150" stroke={STONE} strokeWidth={10} fill="none" />
            <Path d="M 90 70 h 120 v 12 h -104 v 12 h 88 v 12 h -72 v 12 h 56" stroke={SMOKE} strokeWidth={4} fill="none" />
            {/* black water risen past the lower steps */}
            <Path d="M 36 112 Q 80 104 120 112 T 204 112 T 268 112 L 268 150 L 36 150 Z" fill="#0f1416" />
            <Path d="M 36 112 Q 80 104 120 112 T 204 112 T 268 112" stroke="#27353a" strokeWidth={1.6} fill="none" />
            {/* a hand above the waterline */}
            <Path d="M 150 112 L 150 96 M 146 100 L 150 96 L 154 99 M 147 105 L 150 96 M 153 104 L 150 96" stroke={AXM.bone} strokeWidth={2.2} strokeLinecap="round" />
            {/* something breathing below */}
            <Circle cx={206} cy={126} r={2.4} fill={AXM.blood} opacity={0.85} />
            <Circle cx={216} cy={128} r={2.4} fill={AXM.blood} opacity={0.85} />
        </Svg>
    );
}

function AshArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* buried field — half-sunk stones */}
            <Path d="M 0 122 Q 70 112 150 120 T 300 118 L 300 150 L 0 150 Z" fill={SMOKE} />
            <Path d="M 56 122 l 10 -14 l 12 14 Z" fill={STONE} />
            <Path d="M 214 120 l 8 -10 l 10 10 Z" fill={STONE} />
            {/* falling ash streaks */}
            <G stroke={AXM.bone} strokeWidth={1} opacity={0.5}>
                <Line x1={40} y1={6} x2={32} y2={34} />
                <Line x1={92} y1={0} x2={84} y2={26} />
                <Line x1={140} y1={12} x2={132} y2={42} />
                <Line x1={196} y1={4} x2={188} y2={30} />
                <Line x1={248} y1={10} x2={240} y2={40} />
                <Line x1={272} y1={28} x2={264} y2={58} />
                <Line x1={64} y1={48} x2={56} y2={78} />
                <Line x1={168} y1={52} x2={160} y2={82} />
            </G>
            {/* ember glow on the horizon */}
            <Path d="M 0 96 Q 150 84 300 96" stroke={AXM.rust} strokeWidth={2} opacity={0.6} fill="none" />
            <Circle cx={228} cy={88} r={2.2} fill={AXM.sulfur} opacity={0.8} />
            {/* the walker, head down into it */}
            <Pilgrim x={120} y={104} />
        </Svg>
    );
}

function FamineArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* the endless road, narrowing to nothing */}
            <Path d="M 130 150 L 148 64 L 152 64 L 170 150 Z" fill={SMOKE} />
            <Line x1={150} y1={70} x2={150} y2={144} stroke={STONE} strokeWidth={2} strokeDasharray="6 8" />
            {/* dead tree */}
            <Path d="M 50 150 L 52 96 M 52 110 L 38 96 M 52 104 L 64 88 M 52 120 L 42 116" stroke={STONE} strokeWidth={3} strokeLinecap="round" fill="none" />
            {/* circling vulture */}
            <Path d="M 196 34 q 8 -7 16 0 q 8 -7 16 0" stroke={AXM.bone} strokeWidth={2} fill="none" />
            <Path d="M 236 52 q 6 -5 12 0 q 6 -5 12 0" stroke={AXM.bone} strokeWidth={1.4} fill="none" opacity={0.6} />
            {/* gaunt pilgrim, bent low on the road */}
            <Pilgrim x={150} y={86} scale={1.1} />
            {/* spilled, empty satchel */}
            <Path d="M 162 102 q 5 3 9 1" stroke={AXM.rust} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Circle cx={174} cy={104} r={1.4} fill={AXM.rust} opacity={0.8} />
        </Svg>
    );
}

function BanditArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* ridgelines closing in on both sides */}
            <Path d="M 0 150 L 0 70 L 60 86 L 120 112 L 120 150 Z" fill={STONE} />
            <Path d="M 300 150 L 300 64 L 236 84 L 180 110 L 180 150 Z" fill={STONE} />
            {/* watcher silhouettes on the ridges */}
            <G fill={INK}>
                <Circle cx={48} cy={74} r={3} fill={SMOKE} />
                <Rect x={45} y={77} width={6} height={9} fill={SMOKE} />
                <Circle cx={252} cy={70} r={3} fill={SMOKE} />
                <Rect x={249} y={73} width={6} height={9} fill={SMOKE} />
            </G>
            {/* their eyes */}
            <Circle cx={47} cy={74} r={0.9} fill={AXM.blood} />
            <Circle cx={49.5} cy={74} r={0.9} fill={AXM.blood} />
            <Circle cx={251} cy={70} r={0.9} fill={AXM.blood} />
            <Circle cx={253.5} cy={70} r={0.9} fill={AXM.blood} />
            {/* loosed arrows angling into the pen */}
            <G stroke={AXM.bone} strokeWidth={1.4}>
                <Line x1={66} y1={84} x2={118} y2={104} />
                <Path d="M 112 98 L 118 104 L 110 106" fill="none" />
                <Line x1={234} y1={82} x2={186} y2={102} />
                <Path d="M 192 96 L 186 102 L 194 104" fill="none" />
            </G>
            {/* the hunted, sprinting for the gap */}
            <Pilgrim x={150} y={118} scale={1.1} />
        </Svg>
    );
}

function FeverArt({ width = 300, height = 150 }: DangerArtProps) {
    const AXM = usePalette();
    return (
        <Svg width={width} height={height} viewBox="0 0 300 150">
            <Rect width={300} height={150} fill={INK} />
            {/* marsh water + reeds */}
            <Path d="M 0 124 Q 75 116 150 124 T 300 124 L 300 150 L 0 150 Z" fill="#10150f" />
            <G stroke={SMOKE} strokeWidth={2} strokeLinecap="round">
                <Path d="M 36 124 Q 34 100 40 88" fill="none" />
                <Path d="M 52 124 Q 54 104 48 94" fill="none" />
                <Path d="M 252 124 Q 250 102 258 90" fill="none" />
                <Path d="M 268 124 Q 270 106 264 96" fill="none" />
            </G>
            {/* fever haze */}
            <Path d="M 90 70 q 20 -10 40 0 q 20 10 40 0" stroke={SMOKE} strokeWidth={1.4} fill="none" opacity={0.7} />
            {/* the kneeling sick man */}
            <Circle cx={150} cy={84} r={4} fill={AXM.bone} />
            <Path d="M 148 88 Q 142 98 144 110 L 138 122 M 152 88 Q 158 98 156 110 L 160 122" stroke={AXM.bone} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            {/* the bared arm, black lines climbing it */}
            <Path d="M 154 94 L 176 102" stroke={AXM.bone} strokeWidth={2.6} strokeLinecap="round" />
            <G stroke={AXM.blood} strokeWidth={1.1} opacity={0.95}>
                <Path d="M 176 102 L 168 99 M 170 100 L 163 96 M 165 97 L 158 95" fill="none" />
            </G>
            <Circle cx={178} cy={103} r={2} fill={AXM.blood} />
        </Svg>
    );
}

const ART_BY_HAZARD_ID: Record<string, React.ComponentType<DangerArtProps>> = {
    'cracked-cliff': CliffArt,
    'flooded-undercroft': FloodArt,
    'ashfall-crossing': AshArt,
    'famine-march': FamineArt,
    'bandit-hunt': BanditArt,
    'fever-rot': FeverArt,
};

/** Art lookup for the intro overlay; unknown ids fall back to the cliff. */
export function DangerArt({ hazardId, ...rest }: DangerArtProps & { hazardId: string }) {
    const Art = ART_BY_HAZARD_ID[hazardId] ?? CliffArt;
    return <Art {...rest} />;
}
