import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

interface EffectGlyphProps {
  kind: string;
  size?: number;
  color?: string;
}

export function EffectGlyph({ kind, size = 16, color: colorProp }: EffectGlyphProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  switch (kind) {
    case 'poison':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Poison effect">
          <Path d="M9 3 H15 V8 L18 18 C18 20 16 21 12 21 C8 21 6 20 6 18 L9 8 Z" fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M9 3 H15" stroke={color} strokeWidth={2} />
          <Circle cx={12} cy={15} r={1.2} fill={color} />
          <Path d="M10 17 V19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'bleed':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} accessibilityRole="image" accessibilityLabel="Bleed effect">
          <Path d="M6 4 C4 9 4 12 6 13 C8 12 8 9 6 4 Z" />
          <Path d="M12 8 C10 13 10 16 12 17 C14 16 14 13 12 8 Z" />
          <Path d="M18 4 C16 9 16 12 18 13 C20 12 20 9 18 4 Z" />
        </Svg>
      );
    case 'stun':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} accessibilityRole="image" accessibilityLabel="Stun effect">
          <Path d="M12 1 L14 8 L21 7 L15 12 L21 17 L14 16 L12 23 L10 16 L3 17 L9 12 L3 7 L10 8 Z" />
        </Svg>
      );
    case 'regen':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" accessibilityRole="image" accessibilityLabel="Regeneration effect">
          <Path d="M12 21 C5 16 3 12 3 8 A4 4 0 0 1 12 6 A4 4 0 0 1 21 8 C21 12 19 16 12 21 Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M12 22 V2 M8 6 L12 2 L16 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'burn':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} accessibilityRole="image" accessibilityLabel="Burn effect">
          <Path d="M12 2 C 14 6 18 8 18 13 C18 17 15 21 12 21 C9 21 6 18 6 14 C6 11 8 10 9 8 C 10 11 11 10 12 8 C 12 6 11 4 12 2 Z" />
        </Svg>
      );
    case 'buff':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} accessibilityRole="image" accessibilityLabel="Buff effect">
          <Path d="M12 2 L22 20 H2 Z" />
        </Svg>
      );
    case 'debuff':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} accessibilityRole="image" accessibilityLabel="Debuff effect">
          <Path d="M12 22 L22 4 H2 Z" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke={color} accessibilityRole="image" accessibilityLabel="Shield effect">
          <Path d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z" strokeWidth={1} />
        </Svg>
      );
    default:
      return <EffectPlaceholder size={size} color={color} />;
  }
}

function EffectPlaceholder({ size, color }: { size: number; color: string }) {
  const placeholderStyle = useMemo(
    () => [styles.placeholderBase, { width: size, height: size, backgroundColor: color }],
    [size, color]
  );
  
  return <View style={placeholderStyle} />;
}

const styles = StyleSheet.create({
  placeholderBase: {
    // Base style for unknown effect type placeholder
  },
});
