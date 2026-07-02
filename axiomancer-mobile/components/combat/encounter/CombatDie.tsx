/**
 * Spec 26b §1 + combat-screen-polish 2026-07 — a stance die, gem treatment.
 *
 * The 2-die-per-turn draft pool renders these: drag one onto a staged card to
 * power it (the other converts to Conviction).
 *
 * A gem-like die face: a radial backing glow in the stance colour, a tinted
 * face wash, a rim highlight arc, and the stance glyph (♥ ⚡ ★ ✦ ✕) with a
 * colour-matched glow. The drafted die rings solid; an unpicked die dims; an X
 * face reads as blocked. Colour is paired with the glyph so it is never the
 * only channel (a11y).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';

export const CombatDie = React.memo(function CombatDie({ die, size = 54, dimmed = false }: { die: CombatDieVM; size?: number; dimmed?: boolean }) {
    const styles = useStyles();
    const accent = die.colorHex;
    const ring = die.drafted ? accent : die.isX ? '#3a3a3a' : `${accent}aa`;
    const glow = !die.isX && !dimmed;
    const glowSize = size * 1.6;
    const gradId = `axmDieGlow-${die.color}`;
    return (
        <View
            testID={`combat-die-${die.id}`}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${die.stanceLabel} stance die${die.drafted ? ', drafted as your stance' : die.isX ? ', blocked' : ', available to draft'}`}
            style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: dimmed && !die.drafted ? 0.45 : 1 }}
        >
            {glow && (
                <Svg
                    width={glowSize}
                    height={glowSize}
                    viewBox="0 0 100 100"
                    style={{ position: 'absolute', top: (size - glowSize) / 2, left: (size - glowSize) / 2 }}
                    pointerEvents="none"
                >
                    <Defs>
                        <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={accent} stopOpacity={die.drafted ? 0.5 : 0.3} />
                            <Stop offset="70%" stopColor={accent} stopOpacity={0.08} />
                            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
                        </RadialGradient>
                    </Defs>
                    <Circle cx={50} cy={50} r={50} fill={`url(#${gradId})`} />
                </Svg>
            )}
            <View
                style={[
                    styles.die,
                    {
                        width: size, height: size, borderRadius: size * 0.24,
                        borderColor: ring,
                        backgroundColor: die.drafted ? `${accent}30` : 'rgba(0,0,0,0.55)',
                    },
                ]}
            >
                {/* face wash + top-left rim highlight give the gem its facets */}
                <View style={[StyleSheet.absoluteFill, { borderRadius: size * 0.24 - 2, backgroundColor: accent, opacity: die.isX ? 0.04 : 0.12 }]} />
                <View style={[styles.facet, { borderRadius: size * 0.24 - 2 }]} />
                <Text style={[styles.glyph, { color: die.isX ? '#8a8273' : accent, fontSize: size * 0.42, textShadowColor: die.isX ? 'transparent' : accent }]}>{die.glyph}</Text>
                <Text style={[styles.label, { color: die.isX ? '#8a8273' : accent }]} allowFontScaling={false}>{die.stanceLabel}</Text>
            </View>
        </View>
    );
});

const useStyles = makeStyles(() => ({
    die: {
        borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    facet: {
        position: 'absolute', top: 1, left: 1, right: '40%', bottom: '55%',
        borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    },
    glyph: { lineHeight: undefined, textAlign: 'center', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    label: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1, marginTop: 1 },
}));
