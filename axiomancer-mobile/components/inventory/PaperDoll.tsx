import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

export function PaperDoll() {
    const AXM = usePalette();
    return (
        <Svg viewBox="0 0 70 180" width={52} height={140} fill="none">
            {/* halo */}
            <Circle cx={35} cy={22} r={20} stroke={AXM.sulfur} strokeWidth={0.6} strokeOpacity={0.4} strokeDasharray="1 2" />
            {/* hood */}
            <Path d="M35 6 C 16 6 12 26 16 46 L 54 46 C 58 26 54 6 35 6 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* face cavity */}
            <Path d="M24 22 L 46 22 L 44 38 L 35 44 L 26 38 Z" fill={AXM.bg} stroke={AXM.ash} strokeWidth={0.6} />
            {/* torso */}
            <Path d="M18 48 L 52 48 L 56 92 L 14 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* arms */}
            <Path d="M14 50 L 6 90 L 12 92 L 18 56 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            <Path d="M56 50 L 64 90 L 58 92 L 52 56 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* hands */}
            <Circle cx={9} cy={94} r={4} fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            <Circle cx={61} cy={94} r={4} fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            {/* legs */}
            <Path d="M18 92 L 14 158 L 26 158 L 30 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            <Path d="M40 92 L 44 158 L 56 158 L 52 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* feet */}
            <Path d="M12 158 L 12 168 L 28 168 L 28 158 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            <Path d="M42 158 L 42 168 L 58 168 L 58 158 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
        </Svg>
    );
}