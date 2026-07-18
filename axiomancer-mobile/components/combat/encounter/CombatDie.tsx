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
    // Spec 33 (Phase D6a, flag-on) — the rolled gear face EXTENDS the gem's
    // existing color+glyph language (never a new visual system):
    //  · mana    → the normal powered gem (unchanged look);
    //  · special → a brighter, ◆-marked face (the payload die);
    //  · miss    → DEAD: greyed + unpowerable, the X-die treatment on a color die;
    //  · cracked → a distinct struck-out state (an OVERHEAT crack, dead this round).
    // Flag-off dice carry no `.face`, so every branch collapses to its old form.
    const special = die.face === 'special';
    const cracked = die.cracked === true;
    // A "dead" face powers nothing — the X die OR a flag-on miss/cracked face.
    const dead = die.isX || die.face === 'miss' || cracked;
    const ring = die.drafted ? accent : cracked ? '#6b3030' : dead ? '#3a3a3a' : special ? accent : `${accent}aa`;
    const glow = !dead && !dimmed;
    const glowSize = size * 1.6;
    const gradId = `axmDieGlow-${die.color}`;
    // P2 — the a11y state must not lie. A spare die once a draft exists is no
    // longer draggable: it was already burned for Conviction at draft, so the old
    // flat ", available to draft" was stale. Surface Reserve / floating / spent
    // states screen readers had no way to hear. Spec 33 — the flag-on face
    // states lead (they decide whether the die can power at all).
    const statePhrase =
        cracked ? ', cracked — dead this round'
            : die.face === 'miss' ? ', a miss — dead, powers nothing'
                : die.face === 'special' ? ', a SPECIAL face — powers a card and grants Conviction'
                    : die.drafted ? (die.spent ? ', spent as your stance' : ', drafted as your stance')
                        : die.isX ? ', blocked'
                            : die.reserve ? ', banked in the Reserve'
                                : die.floating ? ', floating — a second power source'
                                    : die.draggable === false ? ', spent — burned for Conviction'
                                        : ', available to draft';
    return (
        <View
            testID={`combat-die-${die.id}`}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${die.stanceLabel} stance die${statePhrase}`}
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
                            <Stop offset="0%" stopColor={accent} stopOpacity={die.drafted ? 0.5 : special ? 0.44 : 0.3} />
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
                {/* face wash + top-left rim highlight give the gem its facets.
                    Spec 33: a dead face (X / miss / cracked) washes near-flat;
                    a SPECIAL face washes brighter than a plain mana face. */}
                <View style={[StyleSheet.absoluteFill, { borderRadius: size * 0.24 - 2, backgroundColor: accent, opacity: dead ? 0.04 : special ? 0.2 : 0.12 }]} />
                <View style={[styles.facet, { borderRadius: size * 0.24 - 2 }]} />
                <Text style={[styles.glyph, { color: dead ? '#8a8273' : accent, fontSize: size * 0.42, textShadowColor: dead ? 'transparent' : accent }]}>{die.glyph}</Text>
                <Text style={[styles.label, { color: dead ? '#8a8273' : accent }]} allowFontScaling={false}>{die.stanceLabel}</Text>
                {/* SPECIAL face — the marked +◆ payload badge (top-right corner). */}
                {special && !dead && (
                    <Text style={[styles.specialBadge, { color: accent, textShadowColor: accent, fontSize: size * 0.24 }]} allowFontScaling={false}>◆</Text>
                )}
                {/* CRACKED — a distinct struck-out streak across the dead gem. */}
                {cracked && (
                    <View pointerEvents="none" style={[styles.crackStreak, { top: size / 2 - 1, width: size * 1.02, transform: [{ rotate: '-24deg' }] }]} />
                )}
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
    // Spec 33 — the SPECIAL face's +◆ payload marker, tucked top-right.
    specialBadge: { position: 'absolute', top: 2, right: 3, textShadowRadius: 5, textShadowOffset: { width: 0, height: 0 } },
    // Spec 33 §6 — the OVERHEAT crack streak (struck-out dead gem).
    crackStreak: { position: 'absolute', left: -1, height: 2, backgroundColor: '#b85c5c', borderRadius: 1 },
}));
