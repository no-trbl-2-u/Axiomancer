import React from 'react';
import { AxmIcon, isAxmIconName } from '@/components/icons';

interface ActionIconProps {
  kind: string;
  size?: number;
  color?: string;
}

/**
 * ActionIcon — legacy-keyed adapter over the icon canon (Phase V1).
 *
 * Callers keep the short action kinds ('sword', 'eye', …); the art now
 * comes from `components/icons/` so every placement draws the same
 * registry mark. 'flame' keeps its historical delegation to the burn
 * effect glyph. Unknown kinds render nothing (pinned by tests).
 */
export function ActionIcon({ kind, size = 28, color }: ActionIconProps) {
  const name = kind === 'flame' ? 'effect-burn' : `action-${kind}`;
  if (!isAxmIconName(name)) return null;
  return <AxmIcon name={name} size={size} color={color} />;
}
