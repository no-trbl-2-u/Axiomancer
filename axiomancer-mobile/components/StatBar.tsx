import React from 'react';
import { View, Text } from 'react-native';
import type { DimensionValue } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

interface StatBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
  height?: number;
  showText?: boolean;
}

export const StatBar = React.memo(function StatBar({ value, max, color, label, height = 14, showText = true }: StatBarProps) {
  const AXM = usePalette();
  const styles = useStyles();
  const barColor = color ?? AXM.blood;
  const pct = Math.max(0, Math.min(1, value / max));
  const percentage = Math.round(pct * 100);
  const accessibilityLabel = label ? 
    `${label}: ${value} out of ${max}, ${percentage} percent` : 
    `Progress bar: ${value} out of ${max}, ${percentage} percent`;

  return (
    <View 
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: value, min: 0, max: max }}
    >
      {label && (
        <View style={styles.labelRow}>
          <Text 
            style={styles.label}
            accessibilityRole="text"
            importantForAccessibility="no"
          >
            {label}
          </Text>
          {showText && (
            <Text 
              style={styles.value}
              accessibilityRole="text"
              importantForAccessibility="no"
            >
              {value}/{max}
            </Text>
          )}
        </View>
      )}
      <View 
        style={[styles.track, { height }]}
        importantForAccessibility="no"
      >
        <View 
          style={[styles.fill, { width: `${(pct * 100).toFixed(1)}%` as DimensionValue, backgroundColor: barColor }]}
          importantForAccessibility="no"
        />
        <View 
          style={styles.topLine}
          importantForAccessibility="no"
        />
      </View>
    </View>
  );
});

const useStyles = makeStyles((AXM) => ({
  container: { width: '100%' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    letterSpacing: 2,
    color: AXM.parchment,
    opacity: 0.85,
  },
  value: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: AXM.parchment,
    opacity: 0.85,
  },
  track: {
    width: '100%',
    backgroundColor: AXM.ash,
    borderWidth: 1,
    borderColor: AXM.parchmentMed,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: AXM.parchmentMed,
  },
}));
