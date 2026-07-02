import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, Line, Rect, G } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

export function BossIllustration() {
    const AXM = usePalette();
    return (
        <Svg 
            viewBox="0 0 374 360" 
            width="100%" 
            height="100%" 
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel="Boss encounter illustration showing a crowned figure with glowing eyes and ornate robes on a throne"
            accessibilityRole="image"
        >
            <Path d="M40 20 L 40 200 L 100 80 L 187 30 L 274 80 L 334 200 L 334 20 Z"
                fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1.5} />
            <Path d="M120 80 L 187 50 L 254 80" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
            <Circle cx={187} cy={130} r={60} fill="none" stroke={AXM.sulfur} strokeWidth={1} opacity={0.5} />
            <Circle cx={187} cy={130} r={80} fill="none" stroke={AXM.sulfur} strokeWidth={0.5} opacity={0.3} strokeDasharray="2 4" />
            <G transform="translate(187 130)">
                <Path d="M-30 -50 L -22 -75 L -15 -55 L -8 -82 L 0 -55 L 8 -82 L 15 -55 L 22 -75 L 30 -50 Z"
                    fill={AXM.sulfur} stroke={AXM.bg} strokeWidth={1} />
                <Path d="M-30 -50 L 30 -50 L 30 -45 L -30 -45 Z" fill={AXM.sulfur} />
                <Circle cx={0} cy={-66} r={2.5} fill={AXM.blood} />
                <Path d="M0 -75 L -3 -55 L 3 -45" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
                <Ellipse cx={0} cy={-20} rx={22} ry={28} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
                <Ellipse cx={-8} cy={-26} rx={4} ry={5} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1} />
                <Ellipse cx={8} cy={-26} rx={4} ry={5} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1} />
                <Circle cx={-8} cy={-26} r={1} fill={AXM.blood} />
                <Circle cx={8} cy={-26} r={1} fill={AXM.blood} />
                <Path d="M-12 -10 L 12 -10" stroke={AXM.parchment} strokeWidth={1} />
                {[-10, -7, -4, -1, 2, 5, 8, 11].map((x, i) => (
                    <G key={i}>
                        <Line x1={x} y1={-10} x2={x} y2={-5} stroke={AXM.parchment} strokeWidth={0.8} />
                        <Line x1={x + 0.5} y1={-7} x2={x + 0.5} y2={-3} stroke={AXM.parchment} strokeWidth={0.8} />
                    </G>
                ))}
                <Path d="M-30 5 L -36 80 L -10 90 L 10 90 L 36 80 L 30 5" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1.5} />
                <Path d="M-22 10 L -28 70 L 28 70 L 22 10 Z" fill={AXM.panelBg} stroke={AXM.blood} strokeWidth={1} />
                {[15, 28, 41, 54, 67].map((y, i) => (
                    <Path key={i} d={`M-22 ${y} Q 0 ${y - 5} 22 ${y}`} stroke={AXM.parchment} strokeWidth={1} fill="none" />
                ))}
                <Path d="M-30 10 L -54 80 L -50 130 M 30 10 L 54 80 L 50 130"
                    stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
                <Circle cx={-50} cy={135} r={5} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1} />
                <Circle cx={50} cy={135} r={5} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1} />
            </G>
            {[60, 314].map((x, i) => (
                <G key={i}>
                    <Rect x={x - 3} y={240} width={6} height={80} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1} />
                    <Path d={`M${x} 235 q -3 -8 0 -15 q 3 8 0 15 z`} fill={AXM.sulfur} />
                    <Path d={`M${x} 240 q -1 -4 0 -8 q 1 4 0 8 z`} fill={AXM.blood} />
                </G>
            ))}
        </Svg>
    );
}
