// Physical component colors for Table Edition (VOID / branch-only MVP).
// These are the printed kit's die/rail inks — deliberately NOT theme tokens:
// the cardboard doesn't re-skin when the app theme switches.
import type { CardColor, Face } from './engine';

export const DIE_HEX: Record<CardColor, string> = {
  R: '#a03c2e',
  B: '#2b4fae',
  P: '#6d3f8c',
  G: '#a67c00',
  A: '#5f6368', // ally rail — the kit's grey ink (pay any die)
};

export const FACE_GLYPH: Record<Face, string> = {
  S: '✦',
  M: '●',
  X: '✕',
};
