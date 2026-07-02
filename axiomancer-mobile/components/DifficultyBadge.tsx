import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

interface DifficultyBadgeProps {
  tier?: string;
}

export function DifficultyBadge({ tier = 'normal' }: DifficultyBadgeProps) {
  const AXM = usePalette();
  const styles = useStyles();
  const TIER_MAP: Record<string, { c: string; label: string }> = {
    simple: { c: AXM.bone, label: 'SIMPLE' },
    normal: { c: AXM.parchment, label: 'NORMAL' },
    elite: { c: AXM.sulfur, label: 'ELITE' },
    boss: { c: AXM.blood, label: 'BOSS' },
    unique: { c: AXM.rust, label: 'UNIQUE' },
  };
  const m = TIER_MAP[tier] || TIER_MAP.normal;
  return (
    <View style={[styles.badge, { borderColor: m.c }]}>
      <View style={[styles.dot, { backgroundColor: m.c }]} />
      <Text style={[styles.text, { color: m.c }]}>{m.label}</Text>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    backgroundColor: AXM.shadow,
  },
  dot: {
    width: 5,
    height: 5,
  },
  text: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 2,
  },
}));
