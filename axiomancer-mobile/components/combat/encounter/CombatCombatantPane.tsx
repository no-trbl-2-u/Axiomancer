/**
 * Spec 26 §4.3 + 26b + combat-screen-polish 2026-07 — the battlefield overlay.
 *
 * Redesigned from the boxed two-column pane into a reference-style full-bleed
 * composition (see design/combat-screen-polish-2026-07.md):
 *   · layer 0 — the moonlit CreatureScene with a LARGE archetype figure fills
 *     the upper band of the screen (the enemy IS the screen);
 *   · layer 1 — scrim gradients keep the HUD legible + shelf the hand;
 *   · layer 2 — floating chrome: enemy name, a full-width HP bar anchored by a
 *     central crest carrying the big HP number, the intent badge, glowing
 *     status tiles, the hidden-stance badge, and the player medallion with an
 *     HP arc ring in the bottom-left corner.
 *
 * Resolution FEEDBACK (driven off the engine's typed `CombatEvent` stream via
 * `fx`) is unchanged in spirit: the enemy scene lunges, the player medallion
 * recoils + flashes, floating "-N" numbers rise, DENIED flourishes, and the
 * board shakes behind a damage-scaled red vignette.
 *
 * The overlay mounts absolute-fill UNDER the board's interactive column; every
 * wrapper is pointerEvents box-none so only the chips/intent stay tappable.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { CreatureScene } from '@/components/event/enemy-art/CreatureScene';
import {
    AvianFigure, BeastFigure, CrustaceanFigure, EldritchFigure, FloraFigure,
    GenericFigure, SpiritFigure, TyrantFigure, VerminFigure, ZealotFigure,
} from '@/components/event/enemy-art/figures';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { resolveEnemyArchetype, type EnemyArchetype } from '@/state/presenters/enemy-art';
import type {
    CombatEnemyPaneVM, CombatPlayerPaneVM, CombatEffectChipVM,
} from '@/state/presenters/combat-encounter.engine';
import type { CombatEvent } from 'axiomancer-mechanics';
import { effectGlyph } from '@/components/combat/statusGlyphs';
import { keywordForEffect } from '@/state/combat/keywords';
import { IntentIcon } from './IntentIcon';

/** A bump of resolved engine events the pane animates. `seq` rises on each new
 *  resolution so the effect fires exactly once per APPLY / END PHASE. */
export interface CombatFx { seq: number; events: CombatEvent[]; }

/** Height of the floating top HUD (under the safe-area inset) — the board's
 *  content column leaves this much clearance before the play region. */
export const COMBAT_HUD_HEIGHT = 148;

type Float = { id: number; text: string; color: string; dx: number };

const FIGURES: Record<EnemyArchetype, React.ComponentType> = {
    vermin: VerminFigure,
    crustacean: CrustaceanFigure,
    spirit: SpiritFigure,
    beast: BeastFigure,
    avian: AvianFigure,
    flora: FloraFigure,
    zealot: ZealotFigure,
    eldritch: EldritchFigure,
    tyrant: TyrantFigure,
    generic: GenericFigure,
};

// ── Enemy HP bar + crest ─────────────────────────────────────────────────────

/** Full-width HP bar anchored by a central shield crest carrying the big HP
 *  number (reference: emblem-anchored enemy bar). Keeps the animated ghost
 *  trail + progressbar semantics of the old HpBar. */
function EnemyHpBar({ pct, value, max }: { pct: number; value: number; max: number }) {
    const AXM = usePalette();
    const styles = useStyles();
    const w = useSharedValue(pct);
    const ghost = useSharedValue(pct);
    useEffect(() => {
        const clamped = Math.max(0, Math.min(1, pct));
        ghost.value = withDelay(140, withTiming(clamped, { duration: 340 }));
        w.value = withTiming(clamped, { duration: 230 });
    }, [pct, w, ghost]);
    const fillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, w.value)) * 100}%` }));
    const ghostStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, ghost.value)) * 100}%` }));
    return (
        <View
            style={styles.hpBlock}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Enemy VITAE ${value} of ${max}`}
            accessibilityValue={{ min: 0, max, now: value }}
        >
            <View style={styles.hpTrack}>
                <Animated.View style={[styles.hpGhost, ghostStyle]} />
                <Animated.View style={[styles.hpFill, { backgroundColor: AXM.blood }, fillStyle]}>
                    <View style={styles.hpSheen} />
                </Animated.View>
            </View>
            {/* central crest — the ONE big enemy HP number lives here */}
            <View style={styles.crest} pointerEvents="none">
                <Svg width={62} height={70} viewBox="0 0 62 70">
                    <Path
                        d="M5 3 H57 V38 Q57 48 31 66 Q5 48 5 38 Z"
                        fill={AXM.panelBg}
                        stroke={AXM.sulfur}
                        strokeWidth={1.6}
                    />
                    <Path
                        d="M9 7 H53 V37 Q53 45 31 61 Q9 45 9 37 Z"
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={1}
                    />
                </Svg>
                <View style={styles.crestInner}>
                    <Text style={styles.crestHp} allowFontScaling={false}>{value}</Text>
                    <Text style={styles.crestMax} allowFontScaling={false}>/{max}</Text>
                </View>
            </View>
        </View>
    );
}

/** A single floating "-N" / "DENIED" / keyword that rises and fades, then
 *  self-removes. `dx` jitters it horizontally so simultaneous floats (−N + DoT
 *  tick + BLOCKED) don't pile onto one pixel. */
function FloatNum({ text, color, dx, onDone }: { text: string; color: string; dx: number; onDone: () => void }) {
    const styles = useStyles();
    const ty = useSharedValue(0);
    const op = useSharedValue(1);
    useEffect(() => {
        op.value = withDelay(120, withTiming(0, { duration: 760 }));
        ty.value = withTiming(-34, { duration: 880 }, (fin) => { if (fin) runOnJS(onDone)(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const st = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: dx }, { translateY: ty.value }] }));
    return (
        <Animated.View style={[styles.floatNum, st]} pointerEvents="none">
            <Text style={[styles.floatNumText, { color }]}>{text}</Text>
        </Animated.View>
    );
}

// ── Status-effect tiles ──────────────────────────────────────────────────────

/** Glowing square status tiles with a count badge (reference: icon+number,
 *  no ×/turn text — duration lives in the tooltip + a11y label). */
export function EffectChips({ effects, onChip, align = 'flex-start' }: {
    effects: CombatEffectChipVM[];
    onChip?: (e: CombatEffectChipVM) => void;
    align?: 'flex-start' | 'flex-end' | 'center';
}) {
    const AXM = usePalette();
    const styles = useStyles();
    if (effects.length === 0) return null;
    return (
        <View style={[styles.chipRow, { justifyContent: align }]} pointerEvents="box-none">
            {effects.map((e) => (
                <Pressable
                    key={e.effectId}
                    onPress={() => onChip?.(e)}
                    style={[styles.chip, { borderColor: e.isMax ? AXM.sulfur : e.glyph.color }]}
                    testID={`combat-effect-${e.effectId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.glyph.label}, intensity ${e.intensity}, ${e.duration} turns left${e.isMax ? ', maxed' : ''}`}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: e.glyph.color, opacity: 0.16 }]} />
                    <Text style={[styles.chipGlyph, { color: e.glyph.color, textShadowColor: e.glyph.color }]}>{e.glyph.glyph}</Text>
                    <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeText} allowFontScaling={false}>{e.isMax ? '✶' : e.intensity}</Text>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

// ── Player medallion (bottom-left corner chrome) ─────────────────────────────

/**
 * The player's circular portrait medallion with an HP arc ring, guard chip and
 * status tiles. Mounted by the BOARD *above* the interactive column (the pane
 * itself is a transform stacking-context BELOW it, so anything drawn there
 * would hide under the hand). Handles the player-side resolution FX — recoil,
 * hit-flash, hitstop squash, contact slash, floats, haptic — off the same `fx`
 * stream the pane reads for the enemy side.
 */
export const PlayerMedallion = React.memo(function PlayerMedallion({
    player, enemyIntentDamage, onPress, fx, bottomInset = 0,
}: {
    player: CombatPlayerPaneVM;
    enemyIntentDamage: number;
    /** Tap the medallion → inspect the pilgrim (stats/effects/skills modal). */
    onPress?: () => void;
    fx?: CombatFx;
    bottomInset?: number;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    const [floats, setFloats] = useState<Float[]>([]);
    const idRef = useRef(0);
    const lastSeq = useRef(0);
    const shift = useSharedValue(0);
    const flash = useSharedValue(0);
    const squash = useSharedValue(1);
    const contact = useSharedValue(0);
    const impact = useSharedValue(0);
    const reduceMotion = useRef(false);
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isReduceMotionEnabled().then((on) => { if (alive) reduceMotion.current = on; }).catch(() => undefined);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => { reduceMotion.current = on; });
        return () => { alive = false; sub?.remove?.(); };
    }, []);
    const push = useCallback((text: string, color: string, dx = 0) => {
        const id = (idRef.current += 1);
        setFloats((p) => [...p, { id, text, color, dx }]);
    }, []);
    const drop = useCallback((id: number) => setFloats((p) => p.filter((f) => f.id !== id)), []);
    const landHit = useCallback((dmg: number, blocked: number, fired: boolean) => {
        push(`-${dmg}`, '#e2543b', 0);
        if (fired && blocked > 0) push(`BLOCKED ${blocked}`, '#9aa0a6', 40);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }, [push]);

    useEffect(() => {
        if (!fx || fx.seq === 0 || fx.seq === lastSeq.current) return;
        lastSeq.current = fx.seq;
        let dmg = 0;
        let threatFired = false;
        const ticks: number[] = [];
        const statuses: { text: string; color: string }[] = [];
        for (const e of fx.events) {
            if (e.kind === 'damage-dealt' && e.target === 'self') dmg += e.amount;
            else if (e.kind === 'dot-tick' && e.target === 'self') ticks.push(e.amount);
            else if (e.kind === 'threat-fired') threatFired = true;
            else if (e.kind === 'effect-landed' && e.target === 'self') {
                const kw = (keywordForEffect(e.effectId) ?? e.effectKind ?? 'effect').toUpperCase();
                const color = e.effect ? effectGlyph(e.effect as Parameters<typeof effectGlyph>[0]).color : '#a86bdc';
                statuses.push({ text: kw, color });
            } else if (e.kind === 'buff-stripped' && e.target === 'self') {
                statuses.push({ text: e.effectName ? `STRIP ${e.effectName.toUpperCase()}` : 'STRIP', color: '#a86bdc' });
            }
        }
        const IMPACT = 100;
        if (dmg > 0) {
            const norm = Math.min(1, dmg / Math.max(1, player.maxHp));
            const blocked = enemyIntentDamage - dmg;
            if (!reduceMotion.current) {
                const recoil = 4 + norm * 8;
                const fl = 0.35 + norm * 0.4;
                const sq = 0.94 - norm * 0.08;
                shift.value = withDelay(IMPACT, withSequence(withTiming(-recoil, { duration: 70 }), withTiming(recoil * 0.6, { duration: 70 }), withTiming(0, { duration: 90 })));
                flash.value = withDelay(IMPACT, withSequence(withTiming(fl, { duration: 90 }), withTiming(0, { duration: 260 })));
                squash.value = withDelay(IMPACT, withSequence(withTiming(sq, { duration: 50 }), withTiming(1, { duration: 130 })));
                contact.value = withDelay(IMPACT, withSequence(withTiming(1, { duration: 40 }), withTiming(0, { duration: 200 })));
            }
            impact.value = 0;
            impact.value = withDelay(IMPACT, withTiming(1, { duration: 1 }, (fin) => { if (fin) runOnJS(landHit)(dmg, blocked, threatFired); }));
        }
        ticks.forEach((t, k) => push(`-${t}`, '#a86bdc', (k % 2 === 0 ? -1 : 1) * (20 + Math.floor(k / 2) * 16)));
        const hadFloat = dmg > 0 || ticks.length > 0;
        statuses.forEach((s, k) => { if (!hadFloat) push(s.text, s.color, (k % 2 === 0 ? 1 : -1) * 30); });
    }, [fx, player.maxHp, enemyIntentDamage, shift, flash, squash, contact, impact, landHit, push]);

    const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }, { scale: squash.value }] }));
    const flashAnim = useAnimatedStyle(() => ({ opacity: flash.value }));
    const contactStyle = useAnimatedStyle(() => ({ opacity: contact.value }));

    // Player HP arc ring (r=40 → C≈251.3).
    const ARC_C = 2 * Math.PI * 40;
    const arcOn = ARC_C * Math.max(0, Math.min(1, player.hpPct));

    return (
        <View style={[styles.playerDock, { bottom: bottomInset + 34 }]} pointerEvents="box-none">
            <Animated.View style={anim}>
                <Pressable
                    onPress={onPress}
                    style={styles.medallion}
                    testID="combat-player-medallion"
                    accessibilityRole="button"
                    accessibilityLabel={`${player.name}, VITAE ${player.hp} of ${player.maxHp}. Inspect your pilgrim — stats, status effects and skills.`}
                    hitSlop={6}
                >
                    <View style={styles.medallionClip}>
                        <PlayerPortrait width={72} height={86} />
                        <Animated.View style={[styles.medallionFlash, flashAnim]} pointerEvents="none" />
                    </View>
                    <Svg width={92} height={92} viewBox="0 0 92 92" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Circle cx={46} cy={46} r={40} stroke="rgba(0,0,0,0.65)" strokeWidth={6} fill="none" />
                        <Circle
                            cx={46} cy={46} r={40}
                            stroke={AXM.heal}
                            strokeWidth={5}
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={`${arcOn} ${ARC_C}`}
                            transform="rotate(-90 46 46)"
                        />
                        <Circle cx={46} cy={46} r={44.5} stroke={AXM.sulfur} strokeWidth={1.8} fill="none" opacity={0.9} />
                    </Svg>
                    {/* one-frame contact slash at the moment of impact */}
                    <Animated.View style={[styles.contactSlash, contactStyle]} pointerEvents="none">
                        <Text style={styles.contactSlashText}>✦</Text>
                    </Animated.View>
                </Pressable>
            </Animated.View>
            <View style={styles.playerFloatLayer} pointerEvents="none">
                {floats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} dx={f.dx} onDone={() => drop(f.id)} />)}
            </View>
        </View>
    );
});

// ── The overlay ──────────────────────────────────────────────────────────────

export const CombatCombatantPane = React.memo(function CombatCombatantPane({
    enemy, player, onChip, fx, topInset = 0, metaLine,
}: {
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    onChip?: (e: CombatEffectChipVM) => void;
    fx?: CombatFx;
    /** Safe-area insets, passed by the board (the overlay is absolute-fill). */
    topInset?: number;
    /** Micro phase/round/turn meta rendered beside the enemy name (a11y keeps the words). */
    metaLine?: string;
}) {
    const AXM = usePalette();
    const styles = useStyles();

    const [enemyFloats, setEnemyFloats] = useState<Float[]>([]);
    const idRef = useRef(0);
    const lastSeq = useRef(0);

    // Enemy feedback shared values (anticipation + lunge). The player-side beats
    // (recoil/flash/squash/slash/haptic) live in `PlayerMedallion`.
    const enemyShift = useSharedValue(0);
    const enemyScale = useSharedValue(1);
    // Board-level feedback: a damage-scaled screen shake + a red vignette flash.
    const shake = useSharedValue(0);
    const vignette = useSharedValue(0);
    // Reduce-motion gate (recommended) — suppresses the shake + lunge
    // (the HP tween + floats still fire so the hit is never silent).
    const reduceMotion = useRef(false);
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isReduceMotionEnabled().then((on) => { if (alive) reduceMotion.current = on; }).catch(() => undefined);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => { reduceMotion.current = on; });
        return () => { alive = false; sub?.remove?.(); };
    }, []);

    const pushEnemy = useCallback((text: string, color: string, dx = 0) => {
        const id = (idRef.current += 1);
        setEnemyFloats((p) => [...p, { id, text, color, dx }]);
    }, []);
    const dropEnemy = useCallback((id: number) => setEnemyFloats((p) => p.filter((f) => f.id !== id)), []);

    useEffect(() => {
        if (!fx || fx.seq === 0 || fx.seq === lastSeq.current) return;
        lastSeq.current = fx.seq;
        let playerDmg = 0;
        let enemyDmg = 0;
        let denied = false;
        let threatFired = false;
        const ticks: { side: 'enemy' | 'player'; amount: number }[] = [];
        // (d) status applications the engine already emits — zero-damage
        // control/buff/debuff intents that must never be silent.
        const statusFloats: { side: 'enemy' | 'player'; text: string; color: string }[] = [];
        for (const e of fx.events) {
            if (e.kind === 'damage-dealt') {
                if (e.target === 'self') playerDmg += e.amount; else enemyDmg += e.amount;
            } else if (e.kind === 'dot-tick') {
                ticks.push({ side: e.target === 'self' ? 'player' : 'enemy', amount: e.amount });
            } else if (e.kind === 'phase-resolved' && e.mark === 'clear') {
                denied = true;
            } else if (e.kind === 'threat-fired') {
                threatFired = true;
            } else if (e.kind === 'effect-landed') {
                const side = e.target === 'self' ? 'player' : 'enemy';
                const kw = (keywordForEffect(e.effectId) ?? e.effectKind ?? 'effect').toUpperCase();
                const color = e.effect ? effectGlyph(e.effect as Parameters<typeof effectGlyph>[0]).color : (side === 'player' ? '#a86bdc' : '#d9b44a');
                statusFloats.push({ side, text: kw, color });
            } else if (e.kind === 'buff-stripped') {
                // strip_random_buff surfaced (0.36.0): float the removed buff over the affected side.
                const side = e.target === 'self' ? 'player' : 'enemy';
                const label = e.effectName ? `STRIP ${e.effectName.toUpperCase()}` : 'STRIP';
                statusFloats.push({ side, text: label, color: side === 'player' ? '#a86bdc' : '#d9b44a' });
            }
        }
        // (a) the player took damage → enemy ANTICIPATION (pull back) → scale-led
        //     lunge; a damage-scaled board shake + red vignette at the impact apex.
        //     The medallion-side beats (recoil/flash/squash/slash/float/haptic) fire
        //     in `PlayerMedallion` off the same event stream.
        const IMPACT = 100;
        if (playerDmg > 0) {
            // Normalise the hit to its share of max HP so a 4-dmg chip and a 40-dmg
            // crusher no longer feel identical — every beat scales off `norm`.
            const norm = Math.min(1, playerDmg / Math.max(1, player.maxHp));
            if (!reduceMotion.current) {
                const lunge = 8 + norm * 10;        // 8–18px enemy lunge apex
                const mag = 4 + norm * 4;           // 4–8px board shake
                enemyScale.value = withSequence(withTiming(0.97, { duration: 90 }), withTiming(1 + norm * 0.08, { duration: 120 }), withTiming(1, { duration: 200 }));
                enemyShift.value = withSequence(withTiming(-6, { duration: 90 }), withTiming(lunge, { duration: 120 }), withTiming(0, { duration: 220 }));
                shake.value = withDelay(IMPACT, withSequence(withTiming(mag, { duration: 40 }), withTiming(-mag * 0.7, { duration: 40 }), withTiming(mag * 0.4, { duration: 40 }), withTiming(0, { duration: 50 })));
                vignette.value = withDelay(IMPACT, withSequence(withTiming(Math.min(0.5, 0.18 + norm * 0.5), { duration: 80 }), withTiming(0, { duration: 360 })));
            }
        } else if (denied || (threatFired && enemy.intent.damage > 0)) {
            // (b) the turn resolved with no damage to the player → DENIED flourish
            //     over the enemy (teaches "variety / guard denies the turn").
            pushEnemy('DENIED', '#d9b44a', 0);
        }
        // (d-symmetric) the player's APPLY landed on the enemy → flinch + float.
        if (enemyDmg > 0) {
            enemyShift.value = withSequence(withTiming(-6, { duration: 70 }), withTiming(0, { duration: 160 }));
            pushEnemy(`-${enemyDmg}`, AXM.parchment, 0);
        }
        // (c) enemy-side DoT ticks float over the figure (alternating x-jitter).
        const enemyTicks = ticks.filter((t) => t.side === 'enemy');
        enemyTicks.forEach((t, k) => {
            const dx = (k % 2 === 0 ? -1 : 1) * (20 + Math.floor(k / 2) * 16);
            pushEnemy(`-${t.amount}`, '#e08a3b', dx);
        });
        // (d) never-silent status: float the applied KEYWORD when the enemy had no
        //     other float (a -N / tick already says "something happened" there).
        const enemyHadFloat = enemyDmg > 0 || enemyTicks.length > 0;
        statusFloats.forEach((s, k) => {
            if (s.side === 'enemy' && !enemyHadFloat) pushEnemy(s.text, s.color, (k % 2 === 0 ? 1 : -1) * 30);
        });
    }, [fx, enemy.intent.damage, player.maxHp, AXM.parchment, enemyScale, enemyShift, shake, vignette, pushEnemy]);

    const enemyAnim = useAnimatedStyle(() => ({ transform: [{ translateX: enemyShift.value }, { scale: enemyScale.value }] }));
    const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
    const vignetteStyle = useAnimatedStyle(() => ({ opacity: vignette.value }));

    const archetype = resolveEnemyArchetype(enemy.artKey, enemy.isBoss);
    const Figure = FIGURES[archetype];

    return (
        <Animated.View style={[StyleSheet.absoluteFillObject, shakeStyle]} pointerEvents="box-none" testID="combat-combatant-pane">
            {/* ── layer 0: the battlefield scene, enemy figure LARGE ── */}
            <View style={styles.sceneBand} pointerEvents="none">
                <Animated.View style={[StyleSheet.absoluteFillObject, enemyAnim]}>
                    <CreatureScene
                        label={`${enemy.name} bars the way`}
                        figureScale={1.15}
                        preserveAspectRatio="xMidYMid slice"
                        shadowWidth={50}
                    >
                        <Figure />
                    </CreatureScene>
                </Animated.View>
                {/* top scrim — HUD legibility over the scene */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <LinearGradient id="axmCombatTopScrim" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={AXM.deepBg} stopOpacity={0.88} />
                            <Stop offset="0.22" stopColor={AXM.deepBg} stopOpacity={0.42} />
                            <Stop offset="0.5" stopColor={AXM.deepBg} stopOpacity={0.1} />
                            <Stop offset="0.85" stopColor={AXM.deepBg} stopOpacity={0} />
                            <Stop offset="1" stopColor={AXM.deepBg} stopOpacity={0.4} />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmCombatTopScrim)" />
                </Svg>
            </View>
            {/* arena-floor glow — a faint blood radial that fills the lower half so the
                void between battlefield and hand reads as ground, not dead pixels */}
            <Svg style={styles.floorGlow} pointerEvents="none">
                <Defs>
                    <RadialGradient id="axmFloorGlow" cx="50%" cy="30%" rx="75%" ry="60%">
                        <Stop offset="0" stopColor={AXM.blood} stopOpacity={0.13} />
                        <Stop offset="0.7" stopColor={AXM.blood} stopOpacity={0.04} />
                        <Stop offset="1" stopColor={AXM.blood} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmFloorGlow)" />
            </Svg>
            {/* bottom scrim — shelves the dice + hand over the arena floor */}
            <Svg style={styles.bottomScrim} pointerEvents="none">
                <Defs>
                    <LinearGradient id="axmCombatDockScrim" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={AXM.bg} stopOpacity={0} />
                        <Stop offset="0.45" stopColor={AXM.bg} stopOpacity={0.9} />
                        <Stop offset="1" stopColor={AXM.bg} stopOpacity={1} />
                    </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmCombatDockScrim)" />
            </Svg>
            {/* damage-scaled red vignette flash (pointer-transparent; gated by reduce-motion) */}
            <Animated.View pointerEvents="none" style={[styles.vignette, vignetteStyle]} />

            {/* ── layer 2: top HUD ── */}
            <View style={[styles.hud, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
                <View style={styles.hudNameRow} pointerEvents="box-none">
                    <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
                    {metaLine ? <Text style={styles.hudMeta} allowFontScaling={false}>{metaLine}</Text> : null}
                </View>
                <EnemyHpBar pct={enemy.hpPct} value={enemy.hp} max={enemy.maxHp} />
                <View style={styles.hudUnderBar} pointerEvents="box-none">
                    {/* hidden-stance read — badge only, no text telegraph */}
                    <Text
                        style={[styles.stanceBadge, {
                            color: enemy.revealedStance ? enemy.stanceColor : AXM.bone,
                            borderColor: enemy.revealedStance ? enemy.stanceColor : AXM.ash,
                        }]}
                    >
                        🜲 {enemy.stanceLabel}
                    </Text>
                    <View style={styles.hudRight} pointerEvents="box-none">
                        <IntentIcon intent={enemy.intent} />
                        <EffectChips effects={enemy.effects} onChip={onChip} align="flex-end" />
                    </View>
                </View>
                {/* enemy floats rise from under the crest, over the figure */}
                <View style={styles.enemyFloatLayer} pointerEvents="none">
                    {enemyFloats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} dx={f.dx} onDone={() => dropEnemy(f.id)} />)}
                </View>
            </View>
        </Animated.View>
    );
});

const useStyles = makeStyles((AXM) => ({
    // Battlefield band — the scene fills the top ~62% and fades into the floor.
    sceneBand: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%', backgroundColor: AXM.bg },
    floorGlow: { position: 'absolute', left: 0, right: 0, top: '46%', bottom: 0 },
    bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 250 },
    vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: '#7a1410', zIndex: 30 },

    // ── top HUD ──
    hud: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12 },
    hudNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    enemyName: {
        flex: 1, fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur, letterSpacing: 0.6,
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
    },
    hudMeta: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 0.8 },

    // Emblem-anchored HP bar.
    hpBlock: { marginTop: 4, height: 58, justifyContent: 'flex-start' },
    hpTrack: {
        marginTop: 10, height: 12, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.9)', overflow: 'hidden',
    },
    hpFill: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
    hpSheen: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
    hpGhost: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.22)' },
    crest: { position: 'absolute', top: -14, left: '50%', marginLeft: -31, width: 62, height: 70, alignItems: 'center' },
    crestInner: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
    crestHp: {
        fontFamily: FONTS.gothic, fontSize: 26, lineHeight: 28, color: AXM.parchment,
        textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
    },
    crestMax: { fontFamily: FONTS.mono, fontSize: 9, lineHeight: 10, color: AXM.bone, marginTop: -1 },

    hudUnderBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 2 },
    hudRight: { alignItems: 'flex-end', gap: 6, flexShrink: 1 },
    stanceBadge: {
        fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1.2, borderWidth: 1.5, borderRadius: 4,
        paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.55)',
        marginTop: 2,
    },

    // Status tiles.
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    chip: {
        width: 34, height: 34, borderRadius: 5, borderWidth: 2, backgroundColor: AXM.deepBg,
        alignItems: 'center', justifyContent: 'center', overflow: 'visible',
    },
    chipGlyph: { fontSize: 17, lineHeight: 20, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
    chipBadge: {
        position: 'absolute', right: -5, bottom: -5, minWidth: 15, height: 15, borderRadius: 8,
        paddingHorizontal: 2, backgroundColor: 'rgba(0,0,0,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center', justifyContent: 'center',
    },
    chipBadgeText: { fontFamily: FONTS.sans, fontSize: 9, lineHeight: 11, color: '#fff' },

    // Floats.
    enemyFloatLayer: { position: 'absolute', top: 116, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
    playerFloatLayer: { position: 'absolute', top: -26, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
    floatNum: { position: 'absolute', top: 0, alignItems: 'center' },
    floatNumText: {
        fontFamily: FONTS.gothic, fontSize: 24, letterSpacing: 0.5,
        textShadowColor: '#000', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 },
    },

    // Player medallion.
    playerDock: { position: 'absolute', left: 10, alignItems: 'flex-start', gap: 6, zIndex: 35 },
    medallion: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
    medallionClip: {
        width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: AXM.deepBg,
        alignItems: 'center', justifyContent: 'center',
    },
    medallionFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#e2543b' },
    contactSlash: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
    contactSlashText: { fontFamily: FONTS.gothic, fontSize: 34, color: '#fff', textShadowColor: '#e2543b', textShadowRadius: 6 },
}));
