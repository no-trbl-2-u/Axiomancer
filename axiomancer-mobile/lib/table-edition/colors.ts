// Physical component colors for Table Edition (VOID / branch-only MVP).
// These are the printed kit's die/rail inks — deliberately NOT theme tokens:
// the cardboard doesn't re-skin when the app theme switches.
import type { Color, Face } from './engine';

export const DIE_HEX: Record<Color, string> = {
  R: '#a03c2e',
  B: '#2b4fae',
  P: '#6d3f8c',
  G: '#a67c00',
};

export const FACE_GLYPH: Record<Face, string> = {
  S: '✦',
  M: '●',
  X: '✕',
};
