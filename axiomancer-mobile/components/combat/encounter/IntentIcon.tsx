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

/** WS9 — one a11y sentence for a fork: condition + both outcomes (+ taken). */
function branchA11y(branch: NonNullable<CombatIntentVM['branch']>): string {
    return ` Forked threat — ${branch.condition}: ${branch.thenText} Otherwise: ${branch.elseText}`
        + (branch.taken ? ` It committed to the ${branch.taken === 'then' ? 'conditional' : 'baseline'} path.` : '');
}

export function IntentIcon({ intent, onPress }: { intent: CombatIntentVM; onPress?: () => void }) {
    const styles = useStyles();
    // phase 28 — wall-math: the raw `damage` stake above is face value only;
    // `wallMath` is what actually lands right now, netted against live
    // guard/barrier/modifiers. State the REAL outcome in a11y, not the raw one.
    const { willDeny, netDamage, rungsTotal, rungsLost } = intent.wallMath;
    const wallMathLabel = willDeny
        ? ' This turn will be DENIED — no damage lands.'
        : intent.damage > 0 ? ` ${netDamage} will actually land through your current guard.` : '';
    // Phase 33b — the rung count was previously invisible entirely; state it
    // so STAGGER reads as a sized answer to a sized threat.
    const rungsRemaining = Math.max(0, rungsTotal - rungsLost);
    const rungLabel = ` Carries ${rungsTotal} STAGGER rung${rungsTotal === 1 ? '' : 's'}`
        + (rungsLost > 0 ? `, ${rungsRemaining} remaining.` : '.');
    // Spec 33 §5 (flag-on) — the OPEN stance-check telegraph: what this hit does
    // to the player's current stance, plus the last resolved outcome.
    const sc = intent.stanceCheck ?? null;
    const stanceA11y = sc
        ? ` Stance check —${sc.punishesText ? ` ${sc.punishesText}.` : ''}${sc.yieldsText ? ` ${sc.yieldsText}.` : ''}`
            + (sc.live === 'punished' ? ' Your stance is PUNISHED.' : sc.live === 'yielded' ? ' Your stance YIELDS it.' : '')
            + (sc.resolution ? ` Resolved: ${sc.resolution.text}.` : '')
        : '';
    const a11y = `Enemy intent: ${intent.label}. ${intent.description}`
        + (intent.damage > 0 ? ` Deals ${intent.damage} damage.` : '')
        + (intent.debuffs ? ' Applies a debuff.' : '')
        + wallMathLabel
        + rungLabel
        + stanceA11y
        + (intent.branch ? branchA11y(intent.branch) : '')
        + (intent.next ? ` Next: ${intent.next.label}.` : '')
        + (intent.next?.branch ? branchA11y(intent.next.branch) : '');
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
            {(intent.damage > 0 || intent.debuffs || intent.branch) && (
                <View style={styles.pill}>
                    {/* FE-020: a minus, not a heart. This pill is the ENEMY's
                      * telegraph and the number is damage it will deal to me, but
                      * it printed '♥11' — and the same board uses '♥ 160' on my own
                      * rail for my VITAE. One glyph meant my health in one corner
                      * and the enemy's outgoing damage in the other, so the badge
                      * read as the foe healing or having 11 health left. ♥ now means
                      * only my VITAE; a minus means something is coming off it. */}
                    {intent.damage > 0 && <Text style={[styles.pillText, { color: intent.color }]} allowFontScaling={false}>−{intent.damage}</Text>}
                    {intent.debuffs && <Text style={styles.debuffMark} allowFontScaling={false}>☠</Text>}
                    {/* WS9 — the fork glyph marks a committed branch phase */}
                    {intent.branch && <Text style={[styles.pillText, { color: intent.color }]} allowFontScaling={false}>⑂</Text>}
                </View>
            )}
            {willDeny ? (
                <Text style={styles.wallMathDenied} testID="combat-intent-wallmath" allowFontScaling={false}>DENIED</Text>
            ) : intent.damage > 0 && netDamage !== intent.damage ? (
                <Text style={styles.wallMathNet} testID="combat-intent-wallmath" allowFontScaling={false}>→{netDamage}</Text>
            ) : null}
            {/* Phase 33b — variable-rung telegraph: STAGGER's sized cost, made
                visible. Filled pip = a rung still standing; hollow = already
                stripped by accumulated STAGGER. */}
            <View style={styles.rungRow} testID="combat-intent-rungs">
                {Array.from({ length: rungsTotal }, (_unused, i) => (
                    <Text key={i} style={i < rungsRemaining ? styles.rungFilled : styles.rungHollow} allowFontScaling={false}>
                        {i < rungsRemaining ? '●' : '○'}
                    </Text>
                ))}
            </View>
            {/* Spec 33 §5 (flag-on) — the open stance-check telegraph. No hidden
                information: both branches print, and the resolved outcome shows. */}
            {sc ? (
                <View style={styles.stanceCheck} testID="combat-intent-stance-check">
                    {sc.punishesText ? (
                        <Text style={[styles.scPunish, sc.live === 'punished' && styles.scLive]} numberOfLines={1} allowFontScaling={false}>
                            {sc.punishesText}
                        </Text>
                    ) : null}
                    {sc.yieldsText ? (
                        <Text style={[styles.scYield, sc.live === 'yielded' && styles.scLive]} numberOfLines={1} allowFontScaling={false}>
                            {sc.yieldsText}
                        </Text>
                    ) : null}
                    {sc.resolution ? (
                        <Text
                            style={[styles.scResolved, sc.resolution.outcome === 'punished' ? styles.scPunish : sc.resolution.outcome === 'yielded' ? styles.scYield : styles.scNone]}
                            numberOfLines={1}
                            allowFontScaling={false}
                            testID="combat-intent-stance-check-resolved"
                        >
                            ⟳ {sc.resolution.text}
                        </Text>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
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
    wallMathDenied: { fontFamily: FONTS.sans, fontSize: 9, color: '#d9b44a', marginTop: 1, letterSpacing: 0.5 },
    wallMathNet: { fontFamily: FONTS.mono, fontSize: 9, color: '#8a8273', marginTop: 1 },
    rungRow: { flexDirection: 'row', gap: 1, marginTop: 1 },
    rungFilled: { fontFamily: FONTS.sans, fontSize: 6, color: '#d9b44a' },
    rungHollow: { fontFamily: FONTS.sans, fontSize: 6, color: '#8a8273' },
    // Spec 33 §5 — the open stance-check telegraph, terse and always visible.
    // Playtest 2026-09-04 — 8pt ash-on-dark was unreadable on a 390pt phone;
    // 10pt with a bone neutral for the "neither" line.
    // FE-014 — the two telegraph lines are drawn over the enemy art, and at
    // 375 the sprite reaches under them, so coloured 10pt mono on a busy
    // painted background lost its edges. The sibling `pill` above already
    // solves text-over-art with a near-opaque plate; this borrows it. Size and
    // colour are untouched (they were tuned by the 2026-09-04 playtest) —
    // only the ground behind them changes.
    stanceCheck: {
        alignItems: 'flex-end',
        marginTop: 2,
        gap: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    scPunish: { fontFamily: FONTS.sans, fontSize: 10, color: '#e2543b', letterSpacing: 0.2 },
    scYield: { fontFamily: FONTS.sans, fontSize: 10, color: '#5bbf6a', letterSpacing: 0.2 },
    scNone: { fontFamily: FONTS.sans, fontSize: 10, color: AXM.bone, letterSpacing: 0.2 },
    scResolved: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.3 },
    scLive: { textDecorationLine: 'underline' },
}));
