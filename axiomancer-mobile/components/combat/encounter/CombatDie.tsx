/**
 * Spec 26b §1 + combat-screen-polish 2026-07 (recut 2026-07-18, owner
 * playtest) — a stance die, gem treatment.
 *
 * Renders the spec-33 four-die tray (the shipped default since THE FLIP,
 * 2026-07-18): every usable face may power a card of its color this round.
 * Under the legacy kill-switch (`EXPO_PUBLIC_UPGRADEABLE_DICE=0`) the same
 * component renders the old 2-die draft pool — faceless dice, one draft.
 *
 * The face language (owner directive 2026-07-18): the die's COLOUR carries the
 * stance — no printed stance label, no per-stance glyph. Every face is a
 * circle:
 *   · hit (mana)  → a circle holding a small crystal — this face powers a card;
 *   · special     → a circle holding a SPARKLING crystal (the +◆ payload face);
 *   · miss        → a GREYED-OUT empty circle — dead, powers nothing (owner
 *                   directive, second pass same day: grey, not stance-coloured,
 *                   so "red missed" reads at a glance);
 *   · cracked     → the greyed circle struck through (an OVERHEAT crack, dead
 *                   this round); an X die reads the same dead way.
 * The body is a bevelled gem slab (gradient depth + edge highlights) rather
 * than the old flat wash. Colour is never the only a11y channel — the
 * accessibility label still names the stance and face state in words.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';

/** A 4-point sparkle star path centred on (cx, cy) with radius r. */
function sparklePath(cx: number, cy: number, r: number): string {
    const w = r * 0.28; // waist half-width — pinched for the star glint shape
    return `M ${cx} ${cy - r} Q ${cx + w} ${cy - w} ${cx + r} ${cy} Q ${cx + w} ${cy + w} ${cx} ${cy + r} Q ${cx - w} ${cy + w} ${cx - r} ${cy} Q ${cx - w} ${cy - w} ${cx} ${cy - r} Z`;
}

export const CombatDie = React.memo(function CombatDie({ die, size = 54, dimmed = false }: { die: CombatDieVM; size?: number; dimmed?: boolean }) {
    const accent = die.colorHex;
    const special = die.face === 'special';
    const cracked = die.cracked === true;
    // A "dead" face powers nothing — the X die OR a flag-on miss/cracked face.
    // EVERY dead face greys out (owner directive 2026-07-18): a miss must read
    // as an undraggable dead die at a glance, so it drops its stance colour
    // like a crack/X does — only the rim hue tells a crack from a plain miss.
    const dead = die.isX || die.face === 'miss' || cracked;
    const greyed = dead;
    const ring = die.drafted ? accent : cracked ? '#6b3030' : greyed ? '#3a3a3a' : special ? accent : `${accent}aa`;
    const glow = !dead && !dimmed;
    const glowSize = size * 1.6;
    const gradId = `axmDieGlow-${die.color}`;
    const bodyId = `axmDieBody-${die.color}-${greyed ? 'grey' : die.drafted ? 'drafted' : 'live'}`;
    const gemId = `axmDieGem-${die.color}`;
    // P2 — the a11y state must not lie. A spare die once a draft exists is no
    // longer draggable: it was already burned for Conviction at draft. Spec 33 —
    // the flag-on face states lead (they decide whether the die can power at all).
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
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    {/* Gem-slab depth: a lit top-left falling to a dark lower edge. */}
                    <SvgLinearGradient id={bodyId} x1="0%" y1="0%" x2="80%" y2="100%">
                        <Stop offset="0%" stopColor={accent} stopOpacity={greyed ? 0.1 : die.drafted ? 0.7 : 0.5} />
                        <Stop offset="45%" stopColor={accent} stopOpacity={greyed ? 0.05 : 0.2} />
                        <Stop offset="100%" stopColor="#000000" stopOpacity={0.55} />
                    </SvgLinearGradient>
                    {/* The crystal's own facet light — white cap into the stance colour. */}
                    <SvgLinearGradient id={gemId} x1="0%" y1="0%" x2="35%" y2="100%">
                        <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                        <Stop offset="55%" stopColor={accent} stopOpacity={0.95} />
                        <Stop offset="100%" stopColor={accent} stopOpacity={0.75} />
                    </SvgLinearGradient>
                </Defs>
                {/* body slab */}
                <Rect x={4} y={4} width={92} height={92} rx={22} fill="#0b0812" />
                <Rect x={4} y={4} width={92} height={92} rx={22} fill={`url(#${bodyId})`} />
                {/* bevel: top-left catchlight + bottom-right edge shade */}
                <Path d="M 12 30 Q 12 12 30 12 L 68 12" stroke="rgba(255,255,255,0.38)" strokeWidth={3} fill="none" strokeLinecap="round" />
                <Path d="M 88 68 Q 88 88 68 88 L 34 88" stroke="rgba(0,0,0,0.5)" strokeWidth={4} fill="none" strokeLinecap="round" />
                {/* rim */}
                <Rect x={4} y={4} width={92} height={92} rx={22} fill="none" stroke={ring} strokeWidth={4.5} />
                {/* the face circle — greyed + empty on a dead face (miss / X / cracked) */}
                <Circle
                    cx={50} cy={50} r={26}
                    fill={dead ? 'none' : 'rgba(0,0,0,0.35)'}
                    stroke={greyed ? '#6f6a5e' : 'rgba(255,255,255,0.7)'}
                    strokeWidth={3.5}
                />
                {/* hit / special — the small crystal held in the circle */}
                {!dead && (
                    <>
                        <Polygon points="50,33 62,47 50,67 38,47" fill={`url(#${gemId})`} stroke="rgba(255,255,255,0.85)" strokeWidth={1.6} />
                        {/* facet lines */}
                        <Polygon points="50,33 62,47 50,52 38,47" fill="rgba(255,255,255,0.28)" />
                        <Path d="M 50 33 L 50 67" stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} />
                    </>
                )}
                {/* SPECIAL — the crystal sparkles (the +◆ payload face) */}
                {special && !dead && (
                    <>
                        <Path d={sparklePath(66, 32, 8)} fill="#ffffff" opacity={0.95} />
                        <Path d={sparklePath(33, 36, 5)} fill="#ffffff" opacity={0.8} />
                        <Path d={sparklePath(62, 63, 4.5)} fill="#ffffff" opacity={0.7} />
                    </>
                )}
                {/* CRACKED — a distinct struck-out streak across the dead gem */}
                {cracked && (
                    <Path d="M 10 58 L 36 48 L 52 56 L 90 42" stroke="#b85c5c" strokeWidth={3.5} fill="none" strokeLinecap="round" />
                )}
            </Svg>
        </View>
    );
});
