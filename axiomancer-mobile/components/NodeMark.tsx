import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

interface NodeMarkProps {
  kind?: 'completed' | 'locked' | 'current' | 'available';
  size?: number;
}

/**
 * NodeMark — the map-node glyph. Visual-audit 2026-06: each kind now
 * sits on a filled backing disc so the node reads as a distinct *stop*
 * over the connecting paths drawn behind it, with bolder strokes and a
 * defining outer rim. Bigger default size; the parent scales it up
 * further on the exploration map.
 */
export function NodeMark({ kind = 'available', size = 28 }: NodeMarkProps) {
  const AXM = usePalette();
  if (kind === 'completed') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Completed map node">
        <Circle cx={16} cy={16} r={15} fill={AXM.deepBg} stroke={AXM.bone} strokeWidth={1.5} />
        <Path d="M8 13 C 8 7 12 5 16 5 C 20 5 24 7 24 13 V18 C 24 20 22 21 21 21 V25 H11 V21 C 10 21 8 20 8 18 Z" fill={AXM.bone} />
        <Circle cx={13} cy={15} r={2} fill={AXM.bg} />
        <Circle cx={19} cy={15} r={2} fill={AXM.bg} />
      </Svg>
    );
  }
  if (kind === 'locked') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Locked map node">
        <Circle cx={16} cy={16} r={15} fill={AXM.deepBg} />
        <Circle cx={16} cy={16} r={12} fill={AXM.selectFill} stroke={AXM.ash} strokeWidth={2} strokeDasharray="3 3" />
        <Path d="M9 9 L 23 23 M 23 9 L 9 23" stroke={AXM.blood} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    );
  }
  if (kind === 'current') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Current map node">
        <Circle cx={16} cy={16} r={15.5} fill={AXM.deepBg} stroke={AXM.sulfur} strokeWidth={1} opacity={0.5} />
        <Circle cx={16} cy={16} r={13} fill="none" stroke={AXM.sulfur} strokeWidth={2.5} />
        <Circle cx={16} cy={16} r={6} fill={AXM.sulfur} />
        <Circle cx={16} cy={16} r={2.5} fill={AXM.bg} />
      </Svg>
    );
  }
  return (
    <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Available map node">
      <Circle cx={16} cy={16} r={15} fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1} opacity={0.6} />
      <Circle cx={16} cy={16} r={12} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={2.5} />
      <Circle cx={16} cy={16} r={5} fill={AXM.parchment} />
    </Svg>
  );
}
