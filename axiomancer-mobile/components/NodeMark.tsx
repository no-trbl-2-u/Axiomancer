import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

export type NodeMarkKind = 'completed' | 'locked' | 'current' | 'available';

interface NodeMarkProps {
  kind?: NodeMarkKind;
  size?: number;
}

/**
 * The OUTER RADIUS each kind draws to, on NodeMark's own 32x32 viewBox.
 *
 * Exported because it is the load-bearing half of the colour-blind argument
 * below: the three states are separated by how much of the disc they fill,
 * which survives greyscale, a colour-blind viewer, and a dimmed backdrop
 * plate alike. A test pins the ORDER rather than the numbers, so the glyphs
 * can be retuned without the invariant going quiet.
 *
 * `current` is deliberately mid-weight: it marks where you already are, not
 * somewhere to go (S4-world-C06).
 */
export const NODE_MARK_RADIUS: Record<NodeMarkKind, number> = {
  available: 15.5,
  current: 12,
  completed: 13,
  locked: 8.5,
};

/**
 * NodeMark — the map-node glyph. Visual-audit 2026-06: each kind now
 * sits on a filled backing disc so the node reads as a distinct *stop*
 * over the connecting paths drawn behind it, with bolder strokes and a
 * defining outer rim. Bigger default size; the parent scales it up
 * further on the exploration map.
 *
 * S4-world-C06: the accent belongs to `available`, not `current`. The
 * sulfur beacon used to mark the square the player was ALREADY standing
 * on — the brightest thing on the chart was the one node that does
 * nothing when tapped — while the nodes you can actually walk to sat in
 * plain parchment. Reversed: `available` wears the lit sulfur lamp (and
 * the parent's pulse), `current` wears a muted bone pin that reads "you
 * are here" rather than "go here".
 *
 * ── 2026-09-21, owner finding 9 / D1: THREE STATES, NO COLOUR ALONE ──
 *
 * The owner's Drowned Parish screenshot showed 23 of 28 nodes wearing a
 * blood-red `✕` at strokeWidth 3 — the loudest mark on the chart was the
 * state that means "nothing here for you", repeated until the map read as
 * noise. Worse, the three states a player has to tell apart were carried
 * mostly by hue (sulfur / bone / blood), which a colour-blind player or a
 * greyscale screenshot flattens into one.
 *
 * They are now separated on THREE independent channels, any one of which
 * is enough on its own:
 *
 *   | state             | FILL          | SIZE            | SHAPE            |
 *   |-------------------|---------------|-----------------|------------------|
 *   | open / travelable | ring + core   | largest (15.5)  | lit lamp         |
 *   | spent / trodden   | SOLID mass    | mid (13)        | skull cut out    |
 *   | sealed            | EMPTY         | smallest (8.5)  | broken dot-ring  |
 *
 * So: the thing you can do is the biggest and brightest; the thing you
 * have already answered is a solid, closed mass; the thing that is shut to
 * you is a small empty outline that recedes into the sheet. The `✕` is
 * gone — a sealed node no longer shouts, it simply stops offering itself.
 */
export function NodeMark({ kind = 'available', size = 28 }: NodeMarkProps) {
  const AXM = usePalette();
  if (kind === 'completed') {
    // TRODDEN — a SOLID mass. The skull is knocked out of the disc as
    // negative space rather than drawn on top of it, so the mark reads as
    // one closed shape at a glance and as a skull on inspection. Legend
    // glyph: ●.
    const r = NODE_MARK_RADIUS.completed;
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Trodden map node">
        <Circle cx={16} cy={16} r={15} fill={AXM.deepBg} />
        <Circle cx={16} cy={16} r={r} fill={AXM.bone} opacity={0.82} />
        <G fill={AXM.deepBg}>
          {/* The skull, cut OUT of the disc. */}
          <Path d="M10.5 14.5 C 10.5 10.5 13 9 16 9 C 19 9 21.5 10.5 21.5 14.5 V17 C 21.5 18.4 20.4 19.1 19.6 19.1 V22 H12.4 V19.1 C 11.6 19.1 10.5 18.4 10.5 17 Z" />
        </G>
        <Circle cx={13.8} cy={14.6} r={1.5} fill={AXM.bone} opacity={0.82} />
        <Circle cx={18.2} cy={14.6} r={1.5} fill={AXM.bone} opacity={0.82} />
      </Svg>
    );
  }
  if (kind === 'locked') {
    // SEALED — an EMPTY, broken outline at the smallest radius on the
    // chart. No fill, no cross, no accent hue: it is the only kind that
    // draws nothing inside itself, which is what makes it recede across a
    // map where it is the majority state. Legend glyph: ◌.
    const r = NODE_MARK_RADIUS.locked;
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Sealed map node">
        <Circle cx={16} cy={16} r={r + 2} fill={AXM.deepBg} opacity={0.7} />
        <Circle
          cx={16}
          cy={16}
          r={r}
          fill="none"
          stroke={AXM.ash}
          strokeWidth={1.4}
          strokeDasharray="2 3"
          opacity={0.85}
        />
      </Svg>
    );
  }
  if (kind === 'current') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Current map node">
        <Circle cx={16} cy={16} r={15} fill={AXM.deepBg} stroke={AXM.ash} strokeWidth={1} />
        <Circle cx={16} cy={16} r={NODE_MARK_RADIUS.current} fill="none" stroke={AXM.bone} strokeWidth={1.5} strokeDasharray="2 3" />
        <Circle cx={16} cy={16} r={5} fill={AXM.bone} />
        <Circle cx={16} cy={16} r={2} fill={AXM.bg} />
      </Svg>
    );
  }
  // OPEN — the lit lamp: the largest mark, a bold closed ring around a
  // filled core, plus the parent's pulse. Legend glyph: ◉.
  return (
    <Svg viewBox="0 0 32 32" width={size} height={size} accessibilityRole="image" accessibilityLabel="Available map node">
      <Circle cx={16} cy={16} r={NODE_MARK_RADIUS.available} fill={AXM.deepBg} stroke={AXM.sulfur} strokeWidth={1} opacity={0.5} />
      <Circle cx={16} cy={16} r={13} fill={AXM.bg} stroke={AXM.sulfur} strokeWidth={2.5} />
      <Circle cx={16} cy={16} r={6} fill={AXM.sulfur} />
    </Svg>
  );
}
