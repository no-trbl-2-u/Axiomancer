/**
 * Spec 26 §4.3 + 26b + combat-screen-polish 2026-07 — the battlefield overlay.
 *
 * Redesigned from the boxed two-column pane into a reference-style full-bleed
 * composition (see design/combat-screen-polish-2026-07.md):
 *   · layer 0 — the arena backdrop with a LARGE alpha-matted enemy painting
 *     (random per encounter — see assets/images/enemies) filling the upper
 *     band of the screen (the enemy IS the screen);
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
import { Image } from '@/lib/platform/image';
import { Haptics } from '@/lib/platform/haptics';
import Animated, {
    runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PlayerPortraitImage } from '@/components/art/PlayerPortraitImage';
import { getEncounterEnemyArt } from '@/assets/images/enemies';
import { arenaAltTextFor, arenaBackdropFor } from '@/assets/images/combat';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatEnemyPaneVM, CombatPlayerPaneVM, CombatEffectChipVM, CombatSealVM, CombatAddVM,
} from '@/state/presenters/combat-encounter.engine';
import { ADD_COLOR, selectCombatLogLines } from '@/state/presenters/combat-encounter.engine';
import { getCardById, type CombatEvent } from '@mechanics';
import { effectGlyph } from '@/components/combat/statusGlyphs';
import { keywordForEffect } from '@/state/combat/keywords';
import { IntentIcon } from './IntentIcon';
import { useJuiceFlash, useJuiceIdleBreath, useJuiceNumberPop, useJuicePulse, useJuiceShake } from '@/lib/juice';

/** Full-bleed battlefield backdrop — region-keyed (phase 83, extended in
 *  phases 101/103 to six of the seven live regions), falling back to a neutral
 *  desolation plate for a region with no rule. Sits behind the enemy figure;
 *  the SVG `CreatureScene` draws `hideBackdrop` so its procedural moon/treeline
 *  doesn't overpaint the art. */

/** A bump of resolved engine events the pane animates. `seq` rises on each new
 *  resolution so the effect fires exactly once per APPLY / END PHASE. */
export interface CombatFx { seq: number; events: CombatEvent[]; }

/** One stop of the top-HUD scrim's vertical gradient. */
export interface CombatScrimStop { offset: number; color: string; opacity: number; }

/**
 * The top-HUD scrim's gradient stop table (cluster S1-board-C29).
 *
 * Purpose: the scrim used to fade to nothing by 85% of the scene band and then
 * rise back to 0.4 ink — a dark tail that the band's own hard bottom edge
 * sliced off, drawing a horizontal seam across the arena. The tail now runs
 * all the way to the board's OWN ground colour at full opacity, so the band's
 * last row of pixels already IS the ground behind it: the scrim fades out
 * instead of ending in a visible edge.
 *
 * Inputs: `deepBg` — the HUD-legibility ink; `groundBg` — the colour the pane
 * sits on below the scene band (the board root's `AXM.bg`).
 * Output: the ordered stop table for the scrim's LinearGradient.
 */
export function combatTopScrimStops(deepBg: string, groundBg: string): readonly CombatScrimStop[] {
    return [
        { offset: 0, color: deepBg, opacity: 0.88 },
        { offset: 0.22, color: deepBg, opacity: 0.42 },
        { offset: 0.5, color: deepBg, opacity: 0.1 },
        { offset: 0.78, color: deepBg, opacity: 0.04 },
        // Past the figure's feet the scene dissolves INTO the board ground —
        // the band's bottom edge and what lies under it are the same paint.
        { offset: 0.9, color: groundBg, opacity: 0.38 },
        { offset: 1, color: groundBg, opacity: 1 },
    ];
}

/** Height of the floating top HUD (under the safe-area inset) — the board's
 *  content column leaves this much clearance before the play region. */
export const COMBAT_HUD_HEIGHT = 148;

/** The HUD's own top padding, under the safe-area inset. Named because the
 *  enemy figure anchors off it: the figure's live `top` is this pad plus the
 *  measured height of the HUD's full-width block. */
export const COMBAT_HUD_PAD_TOP = 8;

/** Screen-left footprint of the player medallion's dock: its 10pt left offset
 *  plus the 92pt medallion. The board reserves this much of the bottom band so
 *  the hand fan lays out BESIDE the medallion instead of under it
 *  (cluster S1-board-C11). Keep in step with `playerDock` / `medallion`. */
export const PLAYER_DOCK_FOOTPRINT_W = 102;

type Float = { id: number; text: string; color: string; dx: number };

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

/** WI-5 — a slim alt-win meter under the VITAE bar (PLEA → RELENT, CHARGE
 *  → ORATORY). These currencies used to accumulate with NO combat surface: a
 *  GRACE run could play its whole plan and die with zero feedback on progress.
 *  `target` 0 renders the tally with no fill bar (an undeclared charge count). */
function AltWinMeter({ glyph, label, value, target, color, testID, outcome }: {
    glyph: string; label: string; value: number; target: number; color: string; testID: string;
    /**
     * What filling this meter DOES (FE-022) — 'RELENT', 'CONDEMN'. A meter
     * drawn as a second full-width bar directly under the enemy's VITAE bar
     * sits where genre convention puts armour, so without naming its payoff a
     * player cannot tell whether filling it helps them or the foe. Omitted by
     * the meters that have no target to fill toward (FLAY, the DoT tally).
     */
    outcome?: string;
}) {
    const styles = useStyles();
    const pct = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
    return (
        <View
            style={styles.altMeter}
            testID={testID}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${label} ${value}${target > 0 ? ` of ${target}` : ''}${outcome ? `. Fill it to ${outcome}.` : ''}`}
            accessibilityValue={{ min: 0, max: target || Math.max(1, value), now: value }}
        >
            <Text style={styles.altMeterLabel} allowFontScaling={false} numberOfLines={1}>
                {glyph} {label} {value}{target > 0 ? `/${target}` : ''}
                {outcome && target > 0 ? <Text style={styles.altMeterOutcome}>{`  → ${outcome}`}</Text> : null}
            </Text>
            {target > 0 ? (
                <View style={styles.altMeterTrack}>
                    <View style={[styles.altMeterFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                </View>
            ) : null}
        </View>
    );
}

/** A single floating "-N" / "DENIED" / keyword that rises and fades, then
 *  self-removes. `dx` jitters it horizontally so simultaneous floats (−N + DoT
 *  tick + BLOCKED) don't pile onto one pixel. */
function FloatNum({ text, color, dx, onDone }: { text: string; color: string; dx: number; onDone: () => void }) {
    const styles = useStyles();
    // lib/juice number-pop primitive (phase 38) — the rise+fade math lives in
    // the module now; this call site only supplies the horizontal jitter (a
    // static per-instance offset, so it rides the OUTER plain View — a style
    // array can't merge two `transform` arrays, so the animated translateY
    // stays on its own nested Animated.View).
    const popStyle = useJuiceNumberPop(onDone);
    return (
        <View style={[styles.floatNum, { transform: [{ translateX: dx }] }]} pointerEvents="none">
            <Animated.View style={popStyle}>
                <Text style={[styles.floatNumText, { color }]}>{text}</Text>
            </Animated.View>
        </View>
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
    const styles = useStyles();
    if (effects.length === 0) return null;
    return (
        <View style={[styles.chipRow, { justifyContent: align }]} pointerEvents="box-none">
            {effects.map((e) => (
                <Pressable
                    key={e.effectId}
                    onPress={() => onChip?.(e)}
                    style={[styles.chip, { borderColor: e.glyph.color }]}
                    testID={`combat-effect-${e.effectId}`}
                    accessibilityRole="button"
                    accessibilityLabel={e.standing
                        ? `${e.glyph.label}, ${e.duration > 0 ? `${e.duration} rounds left` : 'rest of combat'}`
                        : `${e.glyph.label}, intensity ${e.intensity}, ${e.duration} turns left`}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: e.glyph.color, opacity: 0.16 }]} />
                    <Text style={[styles.chipGlyph, { color: e.glyph.color, textShadowColor: e.glyph.color }]}>{e.glyph.glyph}</Text>
                    {/* P2 — the badge NUMBER is stacks (intensity); the remaining
                        DURATION rides a distinct top-left tag so "🩸 3" is no longer
                        an ambiguous bare number. Hidden for no-calendar effects
                        (duration ≤ 0). Full breakdown lives in the chip inspect. */}
                    {e.duration > 0 ? (
                        <View style={styles.chipDur}>
                            <Text style={styles.chipDurText} allowFontScaling={false}>{e.duration}t</Text>
                        </View>
                    ) : null}
                    {/* A standing enchant/curse chip (card-wording audit 2026-07-12)
                        has no stack count — no badge. */}
                    {!e.standing ? (
                        <View style={styles.chipBadge}>
                            <Text style={styles.chipBadgeText} allowFontScaling={false}>{e.intensity}</Text>
                        </View>
                    ) : null}
                </Pressable>
            ))}
        </View>
    );
}

// ── Seal chips (Phase 50 — Phase 33d's `state.glyphs`, renamed "Seal" for
//    UI-facing copy per Phase 49 decision 3) ───────────────────────────────

/** Same chip shell as `EffectChips` (Phase 49 decision 1 — merge into the
 *  existing statusStrip row, no new in-flow row) but a charges/cap fraction
 *  badge instead of the intensity/duration pair (Seals have no duration; a
 *  Seal is always tappable — `crackGlyph` has no minimum-charge gate — so
 *  every chip opens the confirm sheet, no locked/ready state to render). */
export function SealChips({ seals, onSeal }: {
    seals: CombatSealVM[];
    onSeal?: (s: CombatSealVM) => void;
}) {
    const styles = useStyles();
    if (seals.length === 0) return null;
    return (
        <View style={styles.chipRow} pointerEvents="box-none">
            {seals.map((s) => (
                <Pressable
                    key={s.id}
                    onPress={() => onSeal?.(s)}
                    style={[styles.chip, { borderColor: s.color }]}
                    hitSlop={6}
                    testID={`combat-seal-${s.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.label}, ${s.charges} of ${s.cap} charges. Tap to crack now for ${s.previewText}.`}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: s.color, opacity: 0.16 }]} />
                    <Text style={[styles.chipGlyph, { color: s.color, textShadowColor: s.color }]}>{s.glyph}</Text>
                    <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeText} allowFontScaling={false}>{s.charges}/{s.cap}</Text>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

// ── Add chips (Phase 102 — SUMMON's brood) ──────────────────────────────────

/**
 * One chip per living add, on the ENEMY side of the board.
 *
 * ## Why not a Seal chip, and why not a status chip
 *
 * `SealChips` renders tokens the player OWNS and spends; `EffectChips` renders
 * statuses and keywords, which are arithmetic rather than things. An add is
 * neither: it is a body standing on the foe's side that acts on its own every
 * phase until the player removes it. So it gets the threat-register colour, a
 * solid-dot glyph (a body, not a mark), and its own row — merging it into the
 * status strip would file "there are two more enemies" under "the foe has a
 * debuff", which is the miscue the whole chip system exists to prevent.
 *
 * ## The badge is the bite, not the health
 *
 * Every shipped add is 1/1 VITAE, so a health badge would read `1/1` on every
 * chip forever and tell the player nothing. The number that changes their
 * decision is what it does to them each phase, so the badge prints the bite.
 * Health is carried in the a11y label, where it costs no space.
 *
 * ## Unaffordable chips still open the sheet
 *
 * `affordable` dims the chip but does NOT block the tap. A chip that silently
 * refuses is indistinguishable from a broken one; the confirm sheet states the
 * price and the shortfall, which is the only place the player can learn why.
 */
export function AddChips({ adds, onAdd }: {
    adds: CombatAddVM[] | undefined;
    onAdd?: (a: CombatAddVM) => void;
}) {
    const styles = useStyles();
    // `?? []` rather than `adds.length` — `CombatEncounterState.adds` is
    // optional on the engine's explicit "absent = none" convention, and a VM
    // built before this field existed (or cast through `unknown`, as the
    // alt-win fixture is) hands us undefined. A missing brood is the ordinary
    // case for every foe in the game but one; it must render nothing, never
    // throw. Caught exactly this way: a fixture omission became a crash.
    const living = adds ?? [];
    if (living.length === 0) return null;
    return (
        <View style={styles.chipRow} pointerEvents="box-none" testID="combat-add-row">
            {living.map((a) => (
                <Pressable
                    key={a.id}
                    onPress={() => onAdd?.(a)}
                    style={[styles.chip, { borderColor: a.color, opacity: a.affordable ? 1 : 0.55 }]}
                    hitSlop={6}
                    testID={`combat-add-${a.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={
                        `${a.name}, ${a.vitae} of ${a.maxVitae} VITAE, bites you for ${a.bite} every phase. `
                        + (a.affordable
                            ? `Tap to strike it down for ${a.cost} Conviction.`
                            : `You cannot strike it down yet — it costs ${a.cost} Conviction.`)
                    }
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: a.color, opacity: 0.16 }]} />
                    <Text style={[styles.chipGlyph, { color: a.color, textShadowColor: a.color }]}>{a.glyph}</Text>
                    <View style={styles.chipBadge}>
                        <Text style={styles.chipBadgeText} allowFontScaling={false}>−{a.bite}</Text>
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
    /** Tap the medallion → inspect the pilgrim (stats/effects/cards modal). */
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
    // Status-proc pulse (phase 38 brief — "a status landing should FEEL like
    // the main event"): a distinct emphasis from the damage hit-reaction
    // bundle above, so a status-only turn (no damage) is never a bare float.
    const [statusPulseKey, setStatusPulseKey] = useState(0);
    const statusPulseStyle = useJuicePulse(statusPulseKey, 1);
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
        if (dmg > 0) push(`-${dmg}`, '#e2543b', 0);
        if (fired && blocked > 0) push(`BLOCKED ${blocked}`, '#9aa0a6', 40);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }, [push]);

    useEffect(() => {
        if (!fx || fx.seq === 0 || fx.seq === lastSeq.current) return;
        lastSeq.current = fx.seq;
        let dmg = 0;
        // Phase 102 — the brood's bite is its OWN event, and it lands outside
        // the engine's `!hindered` gate: a denied phase can still cost VITAE.
        // Kept SEPARATE from `dmg` on purpose — `blocked` below is the foe's
        // telegraph arithmetic, and folding a bite into it would print a
        // BLOCKED number the foe never promised (burn-day audit 3.3).
        let bite = 0;
        let threatFired = false;
        const ticks: number[] = [];
        const statuses: { text: string; color: string }[] = [];
        for (const e of fx.events) {
            if (e.kind === 'damage-dealt' && e.target === 'self') dmg += e.amount;
            else if (e.kind === 'add-bit') bite += e.dealt;
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
        const total = dmg + bite;
        if (total > 0) {
            const norm = Math.min(1, total / Math.max(1, player.maxHp));
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
        // The brood's float is pushed HERE, not from `landHit`: the bite is a
        // second actor, not the foe's telegraphed blow landing at its impact
        // apex, so it does not wait on the telegraph's 100ms delay. One buzz
        // per phase — `landHit` already fires one when the foe's blow landed.
        if (bite > 0) {
            push(`-${bite}`, ADD_COLOR, -28);
            if (dmg === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
        }
        ticks.forEach((t, k) => push(`-${t}`, '#a86bdc', (k % 2 === 0 ? -1 : 1) * (20 + Math.floor(k / 2) * 16)));
        const hadFloat = dmg > 0 || bite > 0 || ticks.length > 0;
        statuses.forEach((s, k) => { if (!hadFloat) push(s.text, s.color, (k % 2 === 0 ? 1 : -1) * 30); });
        if (statuses.length > 0) setStatusPulseKey((k) => k + 1);
    }, [fx, player.maxHp, enemyIntentDamage, shift, flash, squash, contact, impact, landHit, push]);

    const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }, { scale: squash.value }] }));
    const flashAnim = useAnimatedStyle(() => ({ opacity: flash.value }));
    const contactStyle = useAnimatedStyle(() => ({ opacity: contact.value }));

    // Player HP arc ring (r=40 → C≈251.3).
    const ARC_C = 2 * Math.PI * 40;
    const arcOn = ARC_C * Math.max(0, Math.min(1, player.hpPct));

    return (
        // bottom 34→26 (CRITIQUE: fan-end occlusion) — flush with the rail
        // top, so the medallion's touch box tops out BELOW the leftmost hand
        // card's bounding-box centre and a drag started there hits the card,
        // not this chrome. Pairs with the corner-facing hitSlop below.
        <View style={[styles.playerDock, { bottom: bottomInset + 26 }]} pointerEvents="box-none">
            {/* status-proc pulse nests OUTSIDE the hit-reaction `anim` transform —
                a style array can't merge two `transform` arrays, so each juice
                primitive gets its own Animated.View and they compose via nesting. */}
            <Animated.View style={statusPulseStyle}>
            <Animated.View style={anim}>
                <Pressable
                    onPress={onPress}
                    style={styles.medallion}
                    testID="combat-player-medallion"
                    accessibilityRole="button"
                    accessibilityLabel={`${player.name}, VITAE ${player.hp} of ${player.maxHp}. Inspect your pilgrim — stats, status effects and cards.`}
                    // Slop only toward the screen corner: the top/right edges are
                    // where the leftmost hand card fans under this medallion, and
                    // slopping into them stole the card's touch centre (CRITIQUE:
                    // "combat corner medallions occlude fan-end hand-card touch
                    // centers", PR #135 probe).
                    hitSlop={{ left: 6, bottom: 6 }}
                >
                    <View style={styles.medallionClip}>
                        <PlayerPortraitImage width={72} height={86} fit="cover" />
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
            </Animated.View>
            <View style={styles.playerFloatLayer} pointerEvents="none">
                {floats.map((f) => <FloatNum key={f.id} text={f.text} color={f.color} dx={f.dx} onDone={() => drop(f.id)} />)}
            </View>
        </View>
    );
});

// ── The overlay ──────────────────────────────────────────────────────────────

export const CombatCombatantPane = React.memo(function CombatCombatantPane({
    enemy, player, onChip, onAdd, fx, topInset = 0, metaLine, onHudLayout, region,
}: {
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    onChip?: (e: CombatEffectChipVM) => void;
    /** Phase 102 (SUMMON) — tap an add chip to open the strike confirm sheet.
     *  Optional for the same reason `onChip` is: the dev sandbox mounts this
     *  pane read-only, and a foe with no brood renders no chips at all. */
    onAdd?: (a: CombatAddVM) => void;
    fx?: CombatFx;
    /** Safe-area insets, passed by the board (the overlay is absolute-fill). */
    topInset?: number;
    /** Micro phase/round/turn meta rendered beside the enemy name (a11y keeps the words). */
    metaLine?: string;
    /** The live map region (`vm.region`, e.g. "the Drowned Parish"), keying the
     *  arena backdrop plate. Omitted by the dev-only sandbox route, which gets
     *  the fallback plate — same as every region with no rule of its own. */
    region?: string;
    /** Reports the HUD's real rendered height (top of screen to its bottom
     *  edge, `topInset` already included via the HUD's own padding) on every
     *  layout pass. The stance-check telegraph + alt-win meters make this
     *  height variable; siblings anchored off the static `COMBAT_HUD_HEIGHT`
     *  estimate (the LOG toggle, the tutorial coach) should prefer this
     *  measured value once it lands. */
    onHudLayout?: (height: number) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();

    const [enemyFloats, setEnemyFloats] = useState<Float[]>([]);
    // Measured height of the HUD's full-width block (name row + VITAE bar +
    // alt-win meters). The enemy figure's wrap anchors under it; 0 until the
    // first layout pass, when `enemyFigureWrap`'s static top is the fallback.
    const [hudBlockH, setHudBlockH] = useState(0);
    const idRef = useRef(0);
    const lastSeq = useRef(0);

    // Enemy feedback shared values (anticipation + lunge). The player-side beats
    // (recoil/flash/squash/slash/haptic) live in `PlayerMedallion`.
    const enemyShift = useSharedValue(0);
    const enemyScale = useSharedValue(1);
    // Board-level feedback: a damage-scaled screen shake + a red vignette
    // flash — lib/juice primitives (phase 38), synced to the IMPACT beat
    // below via each hook's own `delayMs` so they still land with the enemy
    // lunge apex instead of firing on the trigger frame.
    const [damageTick, setDamageTick] = useState({ key: 0, norm: 0 });
    const shakeStyle = useJuiceShake(damageTick.key, damageTick.norm > 0.66 ? 'high' : damageTick.norm > 0.33 ? 'medium' : 'low', 100);
    const flashStyle = useJuiceFlash(damageTick.key, damageTick.norm, 100);
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
        // Phase 102 — VITAE the brood took this phase. Its own event, because
        // the engine resolves the bite outside the `!hindered` gate: a phase
        // the player denied can still cost health (burn-day audit 3.3).
        let addBite = 0;
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
            } else if (e.kind === 'add-bit') {
                addBite += e.dealt;
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
            } else if (e.kind === 'backfired') {
                // phase 28 — BACKFIRE previously had NO fx case at all (its HP
                // loss was completely unrendered, not merely unlabeled). Always
                // targets the enemy; a distinct gold "BACKFIRE -N" float, never
                // folded into the generic damage color.
                pushEnemy(`BACKFIRE -${e.amount}`, '#d9b44a', 0);
            } else if (e.kind === 'foretold' && e.topCardId) {
                // phase 28 — the engine reorders the draw pile but never told
                // the player what it saw; surface the winner as a toast.
                const name = getCardById(e.topCardId)?.name ?? e.topCardId;
                pushEnemy(`FORETOLD: ${name.toUpperCase()}`, '#4f7fd6', 0);
            }
        }
        // THE BIG NUMBERS REWRITE — the new ledgers and the two enemy beats
        // (STAGE, a foe keyword firing) were landing silently: the numbers
        // moved and nothing on the board said which word moved them. The
        // wording lives ONCE, in the presenter's `selectCombatLogLines`, so
        // this float and the log line can never drift apart.
        selectCombatLogLines(fx.events).forEach((line, k) => {
            if (line.float) pushEnemy(line.float, line.color, (k % 2 === 0 ? 1 : -1) * 24);
        });
        // (a) the player took damage → enemy ANTICIPATION (pull back) → scale-led
        //     lunge; a damage-scaled board shake + red vignette at the impact apex
        //     (100ms — the shared delay baked into the shake/flash hook calls
        //     below). The medallion-side beats (recoil/flash/squash/slash/
        //     float/haptic) fire in `PlayerMedallion` off the same event stream.
        const playerTook = playerDmg + addBite;
        if (playerTook > 0) {
            // Normalise the hit to its share of max HP so a 4-dmg chip and a 40-dmg
            // crusher no longer feel identical — every beat scales off `norm`.
            const norm = Math.min(1, playerTook / Math.max(1, player.maxHp));
            if (!reduceMotion.current && playerDmg > 0) {
                // The lunge belongs to the FOE's own blow. A denied foe did not
                // lunge — its brood bit — so a bite-only phase shakes the board
                // without animating a swing that never happened.
                const lunge = 8 + norm * 10;        // 8–18px enemy lunge apex
                enemyScale.value = withSequence(withTiming(0.97, { duration: 90 }), withTiming(1 + norm * 0.08, { duration: 120 }), withTiming(1, { duration: 200 }));
                enemyShift.value = withSequence(withTiming(-6, { duration: 90 }), withTiming(lunge, { duration: 120 }), withTiming(0, { duration: 220 }));
            }
            // The screen shake + impact flash are lib/juice primitives — they
            // gate their own reduced-motion internally, so this call is
            // unconditional (the hook no-ops when appropriate).
            setDamageTick((prev) => ({ key: prev.key + 1, norm }));
            // The foe's own blow was held but the brood still took VITAE: the
            // word DENIED is still true and still worth knowing, and it must
            // never stand alone. Same honesty rule `IntentIcon`'s wall-math
            // readout follows (burn-day audit 3.3).
            if (playerDmg === 0 && (denied || (threatFired && enemy.intent.damage > 0))) {
                pushEnemy(`DENIED · BROOD −${addBite}`, '#d9b44a', 0);
            }
        } else if (denied || (threatFired && enemy.intent.damage > 0)) {
            // (b) the turn resolved with no damage to the player at all → DENIED
            //     flourish over the enemy (teaches "variety / guard denies the turn").
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
    }, [fx, enemy.intent.damage, player.maxHp, AXM.parchment, enemyScale, enemyShift, pushEnemy]);

    const enemyAnim = useAnimatedStyle(() => ({ transform: [{ translateX: enemyShift.value }, { scale: enemyScale.value }] }));

    // The between-turns idle: a boss breathes deep and slow, a lesser foe
    // shallow and quick.
    const idleStyle = useJuiceIdleBreath(enemy.isBoss ? 1 : 0.3);

    // Random painting per encounter (artNonce = encounter seed), stable for the
    // fight's duration — see assets/images/enemies.
    const enemyArt = getEncounterEnemyArt(enemy.artKey, enemy.artNonce);

    // Region-keyed arena backdrop (phase 83) — falls back to the neutral
    // desolation plate for a region with no rule of its own. The Northern
    // Forest is the one live region still on that path: it has no plate yet.
    // See `assets/images/combat/index.ts` and the AWAITING_PLATE list in its
    // test, which pins that count in both directions (burn-day audit 3.11).
    const arenaBg = arenaBackdropFor(region);
    const arenaAlt = arenaAltTextFor(region);

    return (
        <Animated.View style={[StyleSheet.absoluteFillObject, shakeStyle]} pointerEvents="box-none" testID="combat-combatant-pane">
            {/* ── layer 0: the battlefield scene, enemy figure LARGE ── */}
            <View style={styles.sceneBand} pointerEvents="none">
                {/* raster arena backdrop — full-bleed behind the foe */}
                <Image
                    source={arenaBg}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    contentPosition="bottom center"
                    accessibilityLabel={arenaAlt}
                    testID="combat-arena-backdrop"
                />
                <Animated.View style={[StyleSheet.absoluteFillObject, enemyAnim]}>
                    <View
                        style={[
                            styles.enemyFigureWrap,
                            // Live anchor: 14pt tucked under the HUD's measured
                            // full-width block. The static top in the stylesheet
                            // is only the pre-layout fallback.
                            hudBlockH > 0 ? { top: topInset + COMBAT_HUD_PAD_TOP + hudBlockH - 14 } : null,
                        ]}
                        testID="combat-enemy-figure-wrap"
                    >
                        {/* grounding shadow so the alpha-matted figure sits ON the floor.
                            It stays OUTSIDE the idle wrapper: the shadow is the floor's,
                            not the creature's, so the figure breathes over a planted
                            shadow instead of dragging it up and down. */}
                        <Svg width={240} height={40} style={styles.enemyShadow}>
                            <Defs>
                                <RadialGradient id="axmEnemyGroundShadow" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0" stopColor="#000" stopOpacity={0.55} />
                                    <Stop offset="1" stopColor="#000" stopOpacity={0} />
                                </RadialGradient>
                            </Defs>
                            <Ellipse cx={120} cy={20} rx={112} ry={17} fill="url(#axmEnemyGroundShadow)" />
                        </Svg>
                        {/* The foe is ALIVE between turns — a slow breath swell + float
                            (lib/juice `useJuiceIdleBreath`, reduced-motion gated). Its own
                            wrapper because RN cannot merge two `transform` arrays from a
                            style list, and the lunge above owns the outer one. */}
                        <Animated.View style={[styles.enemyIdleWrap, idleStyle]} testID="combat-enemy-figure">
                            <Image
                                source={enemyArt}
                                style={[styles.enemyFigureImg, enemy.isBoss && styles.enemyFigureImgBoss]}
                                contentFit="contain"
                                contentPosition="bottom center"
                                transition={0}
                                accessibilityLabel={`${enemy.name} bars the way`}
                            />
                        </Animated.View>
                    </View>
                </Animated.View>
                {/* top scrim — HUD legibility over the scene */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <LinearGradient id="axmCombatTopScrim" x1="0" y1="0" x2="0" y2="1">
                            {/* S1-board-C29 — the tail meets the board ground, so the
                                scene band has no visible bottom edge. */}
                            {combatTopScrimStops(AXM.deepBg, AXM.bg).map((st) => (
                                <Stop key={st.offset} offset={st.offset} stopColor={st.color} stopOpacity={st.opacity} />
                            ))}
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
            <Animated.View pointerEvents="none" style={[styles.vignette, flashStyle]} />

            {/* ── layer 2: top HUD ── */}
            <View
                style={[styles.hud, { paddingTop: topInset + COMBAT_HUD_PAD_TOP }]}
                pointerEvents="box-none"
                onLayout={(e) => onHudLayout?.(e.nativeEvent.layout.height)}
                testID="combat-hud"
            >
                {/* The HUD's FULL-WIDTH block — name row, VITAE bar, alt-win
                    meters. Measured on its own because the enemy figure anchors
                    under it: these are the rows that lie edge to edge across the
                    painting, while `hudUnderBar` below is a narrow right-hand chip
                    column (the brood's chips included) that the top scrim already
                    carries. Anchoring the figure to the WHOLE HUD instead would
                    drag its top down past that column and collapse the foe to a
                    thumbnail. `onHudLayout` above still reports the whole HUD —
                    the board's dock spacer, the LOG toggle and the tutorial coach
                    must keep clearing the chips too. */}
                <View
                    pointerEvents="box-none"
                    onLayout={(e) => setHudBlockH(e.nativeEvent.layout.height)}
                    testID="combat-hud-block"
                >
                    <View style={styles.hudNameRow} pointerEvents="box-none">
                        <Text style={styles.enemyName} numberOfLines={1}>{enemy.name}</Text>
                        {metaLine ? <Text style={styles.hudMeta} allowFontScaling={false}>{metaLine}</Text> : null}
                    </View>
                    <EnemyHpBar pct={enemy.hpPct} value={enemy.hp} max={enemy.maxHp} />
                    {/* WI-5 — alt-win meters (PLEA → relent, CHARGE → oratory) */}
                    {enemy.swayVisible ? (
                        <AltWinMeter glyph="🕊" label="PLEA" value={enemy.sway} target={enemy.swayTarget} color={AXM.sulfur} testID="combat-sway-meter" outcome="RELENT" />
                    ) : null}
                    {enemy.premiseVisible ? (
                        <AltWinMeter glyph="☞" label="CHARGE" value={enemy.premises} target={enemy.premiseAt} color={AXM.sulfur} testID="combat-premise-meter" outcome="CONDEMN" />
                    ) : null}
                    {/* THE BIG NUMBERS REWRITE — FLAY rides the FOE: how open it is
                        to the next few hits. No target to fill toward, so the tally
                        renders bare (the AltWinMeter's target-0 shape). */}
                    {enemy.flayVisible ? (
                        <AltWinMeter glyph="✂" label="FLAY" value={enemy.flay} target={0} color={AXM.rust} testID="combat-flay-meter" />
                    ) : null}
                    {/* Phase 2 (spec 30) — the status kill-path foresight. Makes the
                        DoT win path foreseeable instead of invisible accumulation:
                        a plain pending tally once stacks land, a "LETHAL IN N" call
                        once they alone clear remaining HP. Playtest fix 2026-09-04:
                        the tally prints the REAL pending figure (the fill bar clamps
                        on its own — "45/45" while 240 was queued hid the surplus),
                        and a foe whose REGROW/RAVENOUS keeps the stack from ever
                        crossing says so instead of a bare, misleading DOT PENDING. */}
                    {enemy.pendingDot > 0 ? (
                        <AltWinMeter
                            glyph="☠"
                            label={enemy.isLethalInFlight
                                ? `LETHAL IN ${enemy.roundsToKill}`
                                : enemy.healPerRound > 0 ? `DOT PENDING · HEALS ${enemy.healPerRound}/RD` : 'DOT PENDING'}
                            value={enemy.pendingDot}
                            target={enemy.hp}
                            color={AXM.blood}
                            testID="combat-lethality-meter"
                        />
                    ) : null}
                </View>
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
                        {/* THE BIG NUMBERS REWRITE — the foe's OWN keywords (HIDE 6,
                            BRUTAL, VENOM 4). They change the arithmetic before a card
                            is played, so they print on their own row above the
                            statuses, and tap the same plaque a status chip does. */}
                        <EffectChips effects={enemy.keywords} onChip={onChip} align="flex-end" />
                        <EffectChips effects={enemy.effects} onChip={onChip} align="flex-end" />
                        {/* Phase 102 — the brood, LAST in this column and so
                            nearest the battlefield: the chips sit between the
                            foe's own printed properties and the ground the
                            bodies are standing on. */}
                        <AddChips adds={enemy.adds} onAdd={onAdd} />
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
    // Enemy painting — anchored to the band's lower half, clear of the HUD; the
    // grounding shadow hugs its feet. This `top` is the PRE-LAYOUT FALLBACK
    // only: once the HUD's full-width block reports its height the wrap
    // overrides it with the measured anchor (see `combat-hud-block`), so a
    // taller stack of meters pushes the figure down instead of being painted
    // across its head.
    enemyFigureWrap: { position: 'absolute', left: 0, right: 0, top: COMBAT_HUD_HEIGHT - 14, bottom: '9%', alignItems: 'center', justifyContent: 'flex-end' },
    enemyShadow: { position: 'absolute', bottom: -12 },
    // The idle-breath wrapper fills its parent so the figure's percentage
    // sizing still resolves against the scene band; `transformOrigin` bottom
    // pins the swell to the creature's feet (a centre swell lifts it off the
    // floor and unglues it from its shadow).
    enemyIdleWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'flex-end', transformOrigin: 'center bottom' },
    enemyFigureImg: { width: '78%', height: '96%', maxWidth: 380 },
    enemyFigureImgBoss: { width: '92%', maxWidth: 460 },
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
    hudMeta: { fontFamily: FONTS.sans, fontSize: 9, color: AXM.bone, letterSpacing: 0.8 },

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

    // WI-5 — slim alt-win meters under the VITAE bar (PLEA / CHARGE).
    altMeter: { marginTop: 4 },
    altMeterLabel: {
        fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.bone,
        textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
    },
    // FE-022 — the payoff word rides quieter than the tally it follows.
    altMeterOutcome: { color: AXM.sulfur, letterSpacing: 1.4 },
    altMeterTrack: {
        marginTop: 2, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.9)', overflow: 'hidden',
    },
    altMeterFill: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
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
    // P2 — remaining-duration tag (top-left), distinct from the stacks badge.
    chipDur: {
        position: 'absolute', left: -4, top: -6, minWidth: 14, height: 13, borderRadius: 7,
        paddingHorizontal: 2, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
    },
    chipDurText: { fontFamily: FONTS.mono, fontSize: 8, lineHeight: 10, color: 'rgba(255,255,255,0.82)' },

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
