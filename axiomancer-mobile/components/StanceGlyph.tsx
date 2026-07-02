import React from 'react';
import Svg, { Path, Ellipse, SvgXml } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

interface GlyphProps {
  size?: number;
  color?: string;
  stroke?: number;
}

// Source artifact: assets/images/heart.svg (see assets/images/heart.provenance.json).
// Mirrored inline so the bundler does not depend on a Metro SVG transformer.
const heartXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M20 54 L 19 60 L 21 60 Z M 28 56 L 27 62 L 29 62 Z M 38 56 L 37 62 L 39 62 Z M 44 54 L 43 60 L 45 60 Z" fill="currentColor"/>
  <path fill-rule="evenodd" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="miter" d="M32 16 L 34 13 L 38 10 L 43 9 L 48 10 L 53 14 L 56 19 L 56 25 L 54 31 L 50 37 L 44 43 L 38 48 L 33 53 L 32 55 L 31 53 L 26 48 L 20 43 L 14 37 L 10 31 L 8 25 L 8 19 L 11 14 L 16 10 L 21 9 L 26 10 L 30 13 Z M22 22 L 26 26 L 24 28 L 20 24 Z M14 30 L 18 34 L 16 36 L 12 32 Z M40 24 L 42 26 L 38 30 L 36 28 Z M44 32 L 48 36 L 46 38 L 42 34 Z"/>
  <path d="M30 16 L 28 8 L 24 6 L 25 10 L 28 12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M34 16 L 36 8 L 40 6 L 39 10 L 36 12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32 14 L 32 4 M 30 6 L 32 4 L 34 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Source artifact: assets/images/body.svg (see assets/images/body.provenance.json).
// Mirrored inline so the bundler does not depend on a Metro SVG transformer.
const bodyXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M28 12 L 30 8 L 34 8 L 36 12 L 38 14 L 40 16 L 42 20 L 44 24 L 45 28 L 45 32 L 44 36 L 42 40 L 40 44 L 38 46 L 36 48 L 34 50 L 30 50 L 28 48 L 26 46 L 24 44 L 22 40 L 20 36 L 19 32 L 19 28 L 20 24 L 22 20 L 24 16 L 26 14 Z" fill="currentColor" fill-rule="evenodd"/>
  <path d="M20 24 L 18 26 L 16 30 L 15 34 L 16 38 L 18 42 L 20 44" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M44 24 L 46 26 L 48 30 L 49 34 L 48 38 L 46 42 L 44 44" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 22 L 26 22 M 32 22 L 36 22 M 38 22 L 42 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 28 L 40 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 34 L 40 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M26 40 L 38 40" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M32 16 L 32 12 M 30 14 L 32 12 L 34 14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const GlyphHeart = React.memo(function GlyphHeart({ size = 40, color: colorProp }: GlyphProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  return <SvgXml xml={heartXml} width={size} height={size} color={color} accessibilityRole="image" accessibilityLabel="Heart stance glyph" />;
});

export const GlyphBody = React.memo(function GlyphBody({ size = 40, color: colorProp }: GlyphProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  return <SvgXml xml={bodyXml} width={size} height={size} color={color} accessibilityRole="image" accessibilityLabel="Body stance glyph" />;
});

export const GlyphMind = React.memo(function GlyphMind({ size = 40, color: colorProp, stroke = 2.4 }: GlyphProps) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityRole="image" accessibilityLabel="Mind stance glyph">
      <Path
        d="M14 28 C 14 16, 22 8, 32 8 C 42 8, 50 16, 50 28 L 50 38 C 50 42, 48 44, 44 44 L 44 50 C 44 52, 42 54, 40 54 L 24 54 C 22 54, 20 52, 20 50 L 20 44 C 16 44, 14 42, 14 38 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={stroke} strokeLinejoin="round"
      />
      <Ellipse cx={24} cy={30} rx={5} ry={6} fill={AXM.bg} />
      <Ellipse cx={40} cy={30} rx={5} ry={6} fill={AXM.bg} />
      <Path d="M30 38 L 32 42 L 34 38 Z" fill={color} />
      <Path d="M22 48 L 26 48 M 28 48 L 32 48 M 34 48 L 38 48 M 40 48 L 42 48" stroke={color} strokeWidth={stroke} />
      <Path d="M32 8 L 30 14 L 34 18 L 28 22 L 32 26" stroke={color} strokeWidth={stroke * 0.9} />
    </Svg>
  );
});

export function StanceGlyph({ kind, size = 40, color: colorProp, stroke = 2.4 }: GlyphProps & { kind: string }) {
  const AXM = usePalette();
  const color = colorProp ?? AXM.parchment;
  if (kind === 'heart') return <GlyphHeart size={size} color={color} stroke={stroke} />;
  if (kind === 'body') return <GlyphBody size={size} color={color} stroke={stroke} />;
  return <GlyphMind size={size} color={color} stroke={stroke} />;
}
