import React from 'react';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

export function BodyDiagram({ height = 220 }: { height?: number } = {}) {
  const AXM = usePalette();
  const slotDots = [
    [44, 20], [44, 60], [22, 115], [66, 115],
    [44, 100], [78, 80], [44, 195],
  ];
  // Width scales with the 88:220 aspect so the diagram can shrink to
  // claw back vertical space on the SELF tab.
  const width = Math.round((height * 88) / 220);

  return (
    <Svg viewBox="0 0 88 220" width={width} height={height} accessibilityRole="image" accessibilityLabel="Character body diagram showing equipment slots">
      <Circle cx={44} cy={20} r={13} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M30 36 L 58 36 L 60 100 L 28 100 Z" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M30 38 L 18 80 L 22 110" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M58 38 L 70 80 L 66 110" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Circle cx={22} cy={115} r={4} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Circle cx={66} cy={115} r={4} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M34 100 L 32 180" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M54 100 L 56 180" fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Ellipse cx={32} cy={190} rx={8} ry={4} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Ellipse cx={56} cy={190} rx={8} ry={4} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      {slotDots.map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={3} fill={AXM.sulfur} />
      ))}
    </Svg>
  );
}
