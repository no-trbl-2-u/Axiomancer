import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePalette } from '@/theme/runtime';
import { AxmIcon, isAxmIconName } from '@/components/icons';

interface EffectGlyphProps {
  kind: string;
  size?: number;
  color?: string;
}

/**
 * EffectGlyph — legacy-keyed adapter over the icon canon (Phase V1).
 *
 * Status-effect kinds ('poison', 'bleed', …) resolve to the registry's
 * `effect-*` marks; unknown kinds fall back to the colored placeholder
 * square (pinned by tests — a loud "this effect has no mark yet").
 */
export function EffectGlyph({ kind, size = 16, color: colorProp }: EffectGlyphProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  const name = `effect-${kind}`;
  if (isAxmIconName(name)) {
    return <AxmIcon name={name} size={size} color={color} />;
  }
  return <EffectPlaceholder size={size} color={color} />;
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
