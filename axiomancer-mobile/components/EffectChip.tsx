import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '@/theme/axm';
import { usePalette } from '@/theme/runtime';
import { EffectGlyph } from './EffectGlyph';

interface Effect {
  kind: string;
  name: string;
  duration?: number;
  intensity?: number;
  tint?: string;
}

interface EffectChipProps {
  effect: Effect;
  dim?: boolean;
}

export const EffectChip = React.memo(function EffectChip({ effect, dim = false }: EffectChipProps) {
  const AXM = usePalette();
  const COLOR_MAP: Record<string, string> = {
    poison: AXM.heal,
    bleed: AXM.blood,
    stun: AXM.sulfur,
    regen: AXM.heal,
    burn: AXM.rust,
    buff: AXM.sulfur,
    debuff: AXM.blood,
  };

  const TINT_MAP: Record<string, string> = {
    buff: AXM.buff,
    debuff: AXM.debuff,
    neutral: AXM.deepBg,
  };

  const c = COLOR_MAP[effect.kind] || AXM.parchment;
  const bg = TINT_MAP[effect.tint || 'neutral'] || AXM.deepBg;

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: c, opacity: dim ? 0.55 : 1 }]}>
      <EffectGlyph kind={effect.kind} size={12} color={c} />
      {effect.duration !== undefined && (
        <Text style={[styles.text, { color: c }]}>{effect.duration}</Text>
      )}
      {effect.intensity !== undefined && effect.intensity > 1 && (
        <Text style={[styles.text, { color: AXM.parchment, opacity: 0.65 }]}>×{effect.intensity}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingLeft: 4,
    paddingRight: 5,
    borderWidth: 1,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
});
