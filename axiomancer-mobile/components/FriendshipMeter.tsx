import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { SectionLabel } from './SectionLabel';

interface FriendshipMeterProps {
  value?: number;
  max?: number;
  compact?: boolean;
}

export function FriendshipMeter({ value = 0, max = 5, compact = false }: FriendshipMeterProps) {
  const AXM = usePalette();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {!compact && <SectionLabel size={9} style={styles.friendLabel}>FRIEND</SectionLabel>}
      <View style={styles.hearts}>
        {Array.from({ length: max }).map((_, i) => (
          <Svg key={i} viewBox="0 0 16 14" width={11} height={10}>
            <Path
              d="M8 13 C 2 9, 0 5, 2 2.5 C 4 0.5, 6.5 1.5, 8 4 C 9.5 1.5, 12 0.5, 14 2.5 C 16 5, 14 9, 8 13 Z"
              fill={i < value ? AXM.rust : 'none'}
              stroke={AXM.rust}
              strokeWidth={1.2}
            />
          </Svg>
        ))}
      </View>
      <Text style={styles.counter}>{value}/{max}</Text>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hearts: {
    flexDirection: 'row',
    gap: 1,
  },
  counter: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: AXM.bone,
  },
  friendLabel: {
    color: AXM.bone,
  },
}));
