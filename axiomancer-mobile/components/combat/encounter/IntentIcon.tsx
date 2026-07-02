/**
 * Spec 26 §2.4 + combat-screen-polish 2026-07 — the enemy intent telegraph.
 *
 * A compact circular badge (icon in the intent colour over a tinted disc) with
 * the damage stake in an attached dark pill — reference-style icon+number
 * chrome, no text label. The label, description, damage and the next-phase
 * preview all live on the accessibility label so nothing is lost to a11y.
 * The STANCE (the RPS axis) is deliberately NOT shown here — it is hidden and
 * read from the thematic tell (Spec 26b §2).
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { CombatIntentVM } from '@/state/presenters/combat-encounter.engine';

export function IntentIcon({ intent, onPress }: { intent: CombatIntentVM; onPress?: () => void }) {
    const styles = useStyles();
    const a11y = `Enemy intent: ${intent.label}. ${intent.description}`
        + (intent.damage > 0 ? ` Deals ${intent.damage} damage.` : '')
        + (intent.debuffs ? ' Applies a debuff.' : '')
        + (intent.next ? ` Next: ${intent.next.label}.` : '');
    return (
        <View
            style={styles.wrap}
            testID="combat-intent"
            accessible
            accessibilityRole="text"
            accessibilityLabel={a11y}
            onTouchEnd={onPress}
        >
            <View style={[styles.disc, { borderColor: intent.color, backgroundColor: `${intent.color}2e` }]}>
                <Text style={[styles.icon, { color: intent.color, textShadowColor: intent.color }]}>{intent.icon}</Text>
            </View>
            {(intent.damage > 0 || intent.debuffs) && (
                <View style={styles.pill}>
                    {intent.damage > 0 && <Text style={[styles.pillText, { color: intent.color }]} allowFontScaling={false}>♥{intent.damage}</Text>}
                    {intent.debuffs && <Text style={styles.debuffMark} allowFontScaling={false}>☠</Text>}
                </View>
            )}
        </View>
    );
}

const useStyles = makeStyles(() => ({
    wrap: { alignItems: 'center' },
    disc: {
        width: 36, height: 36, borderRadius: 18, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    icon: { fontSize: 17, lineHeight: 20, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: -6,
        backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    pillText: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.3 },
    debuffMark: { fontFamily: FONTS.sans, fontSize: 10, color: '#a86bdc' },
}));
