import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

interface XpChainProps {
  value: number;
  max: number;
  links?: number;
}

export function XpChain({ value, max, links = 16 }: XpChainProps) {
  const AXM = usePalette();
  const filled = Math.round((value / max) * links);
  return (
    <View style={styles.row}>
      {Array.from({ length: links }).map((_, i) => (
        <View key={i} style={styles.linkWrap}>
          <Svg viewBox="0 0 12 14" width="100%" height={14} accessibilityRole="image" accessibilityLabel={`Experience point ${i + 1} of ${links}, ${i < filled ? 'filled' : 'empty'}`}>
            <Ellipse cx={6} cy={7} rx={4} ry={6} fill="none"
              stroke={i < filled ? AXM.sulfur : AXM.ash} strokeWidth={1.5} />
            <Ellipse cx={6} cy={7} rx={2} ry={3} fill={i < filled ? AXM.sulfur : 'transparent'} />
          </Svg>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkWrap: {
    flex: 1,
  },
});
