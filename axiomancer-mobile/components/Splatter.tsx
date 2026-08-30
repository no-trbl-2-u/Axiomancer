import React from 'react';

import { Image } from '@/lib/platform/image';
import { splatterFor } from '@/assets/images/splatter';
import { usePalette } from '@/theme/runtime';

interface SplatterProps {
  color?: string;
  size?: number;
  seed?: number;
  style?: object;
}

/**
 * A real ink-splatter silhouette (phase V7 — see
 * `assets/images/splatter/provenance.json`), tinted to whichever AXM colour
 * the caller passes. `seed` picks deterministically among the acquired set
 * so a given call site always draws the same plate; different seeds vary
 * the shape, replacing the old procedural random-circle blot.
 */
export function Splatter({ color: colorProp, size = 220, seed = 1, style = {} }: SplatterProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.blood;

  return (
    <Image
      source={splatterFor(seed)}
      tintColor={color}
      contentFit="contain"
      pointerEvents="none"
      testID="splatter-plate"
      style={[{ width: size, height: size }, style]}
    />
  );
}
