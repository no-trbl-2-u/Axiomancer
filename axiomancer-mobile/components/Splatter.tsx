import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { rnd } from '@/theme/axm';
import { usePalette } from '@/theme/runtime';

interface SplatterProps {
  color?: string;
  size?: number;
  seed?: number;
  style?: object;
}

export function Splatter({ color: colorProp, size = 220, seed = 1, style = {} }: SplatterProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.blood;
  const drops = Array.from({ length: 28 }, (_, i) => ({
    cx: 10 + rnd(i + 1, seed) * 200,
    cy: 10 + rnd(i + 7, seed) * 200,
    r: 0.5 + rnd(i + 13, seed) * 6,
  }));
  const main = {
    cx: 110 + (rnd(99, seed) - 0.5) * 30,
    cy: 110 + (rnd(101, seed) - 0.5) * 30,
    r: 30 + rnd(102, seed) * 18,
  };

  return (
    <Svg viewBox="0 0 220 220" width={size} height={size} pointerEvents="none" style={style}>
      <Circle cx={main.cx} cy={main.cy} r={main.r} fill={color} opacity={0.9} />
      {drops.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={0.4 + rnd(i + 200, seed) * 0.55} />
      ))}
    </Svg>
  );
}
