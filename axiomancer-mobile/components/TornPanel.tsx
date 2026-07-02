import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tornEdgePath } from '@/theme/axm';
import { usePalette } from '@/theme/runtime';

interface TornPanelProps {
  children?: React.ReactNode;
  bgColor?: string;
  jag?: number;
  seed?: number;
  screenBg?: string;
  padding?: number;
  style?: ViewStyle;
}

export function TornPanel({
  children,
  bgColor: bgColorProp,
  jag = 6,
  seed = 1,
  screenBg: screenBgProp,
  padding = 12,
  style,
}: TornPanelProps) {
  const AXM = usePalette();
  const bgColor = bgColorProp ?? AXM.panelBg;
  const screenBg = screenBgProp ?? AXM.bg;
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[styles.outer, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      <View style={[styles.inner, { backgroundColor: bgColor, padding }]}>
        {children}
      </View>
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
          accessibilityRole="image"
          accessibilityLabel="Decorative torn paper edge"
        >
          <Path
            d={`M 0 0 L ${size.width} 0 L ${size.width} ${size.height} L 0 ${size.height} Z ${tornEdgePath(size.width, size.height, jag, seed)}`}
            fill={screenBg}
            fillRule="evenodd"
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
  },
  inner: {
    flex: 1,
  },
});
