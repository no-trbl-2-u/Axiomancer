/**
 * Effect-driven combat helpers — read-only queries plus pure mutators that
 * operate on a combatant's `effects` array (regen, thorns, marks, ticks,
 * buff manipulation, DoT, drain, cleanse / dispel).
 */

import { ActiveEffect } from '../Effects/types';
import { lookupEffect } from '../Effects/effects.library';
import { removeEffectsByType } from '../Effects';
import { MAX_EFFECT_DURATION, MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import { Combatant } from './types';
import type { Enemy, EnemyDifficulty } from '../Enemy/types';
import { applyDamage, heal } from './health';
import {
    getActiveEffectModifiers, getDotAmplificationByEffect, rampedDamagePerRound,
    getTickAmplifyFlat, dotRoundClockPhase, dotEventTrigger, DotEventTrigger,
} from './effect-modifiers';
import { getRng } from '../Utils/rng';

/** ID of the Mind studying mark. Used by Mind/Attack to add bonus damage. */
export const MIND_MARK_ID = 'tier1_mind_mark';

/** Current intensity of the Mind studying mark on a combatant (0 if absent). */
export function getStudyMarkIntensity(target: Combatant): number {
    const mark = target.effects.find(e => e.effectId === MIND_MARK_ID);
    return mark?.intensity ?? 0;
}

/**
 * Sums every active effect's contribution to the combatant's roll modifier:
 *   total = Σ (rollModifier) + Σ (rollModifierPerIntensity × intensity)
 */
export function getActiveRollModifier(target: Combatant): number {
    return target.effects.reduce((total, ae) => {
        const def = lookupEffect(ae.effectId);
        const flat         = def?.payload.rollModifier ?? 0;
        const perIntensity = (def?.payload.rollModifierPerIntensity ?? 0) * (ae.intensity ?? 1);
        return total + flat + perIntensity;
    }, 0);
}

/**
 * Total thorns reflect damage to deal back to an attacker after a successful
 * hit on the bearer. Sums (reflectDamage × intensity) across all effects.
 */
export function getThornsReflect(bearer: Combatant): number {
    return bearer.effects.reduce((total, ae) => {
        const def = lookupEffect(ae.effectId);
        const perIntensity = def?.payload.reflectDamage ?? 0;
        return total + perIntensity * (ae.intensity ?? 1);
    }, 0);
}

// ─── 0.34.0 status-depth epic — HP-model selectors + tunable scalars ──────────
// These power the new card mechanics (VULNERABLE / RUPTURE / COMPOUND / DISRUPT)
// and the mobile honesty layer. Pure reads over a combatant's `effects`; the HP
// behavior itself is owned by `combat.engine.ts`. Kept here (a writable,
// non-engine home) so the tuning loops can rebalance them by simulation.

/** VULNERABLE — hard ceiling on the outgoing-damage multiplier against a marked
 *  target. Conservative for burst (a marked foe takes at most ×2.0). Tunable. */
export const VULNERABLE_MAX_MULT = 2.0;
/** RESOLUTE — hard floor on the incoming-damage multiplier for a protected
 *  bearer (a fully-stacked protective mult still lets half the hit through).
 *  P0-truth: protective (`damageTakenMult < 1`) payloads are REAL now. Tunable. */
export const RESOLUTE_MIN_MULT = 0.5;
/** RUPTURE cap fraction (spec 32 §12 item 5 — flat cap floors retired): the
 *  burst cap is a PURE fraction of the enemy's max HP, with NO flat floor.
 *  RUPTURE keeps a cap because it consumes enemy-side state the player seeded
 *  cheaply; ALL-spenders (REAP-ALL, spend-all-pips payoffs) are UNCAPPED —
 *  emptying the whole bank IS the price.
 *  // PLAYTEST-CALIBRATION (swept 2026-07-12, spec 32 §12 item 5): the ratified
 *  //  sweep F ∈ {0.25, 0.35, 0.45, 0.60} ran the full matrix + Foundry/Tithe
 *  //  preset probes at seeds 1-2 (docs/reports/rebaseline-scratch/sweep-F*, raw output deleted 2026-09-25; findings archived under plan/archive/2026-09-25-trim-t1/).
 *  //  0.60 WON: Foundry (the RUPTURE preset) lifts monotonically with F
 *  //  (greedy early 57.8→64.8%, mid 0→1.4%) while the policy-pick matrix is
 *  //  F-invariant (early 85.1% at every F — in band) and dominance never
 *  //  moves (Foundry's dominant card is sketch-of-a-thought at every F; the
 *  //  Overtake payoff grows with F without taking over). Tithe is flat across
 *  //  F — its REAP-ALL is uncapped, so it serves as the control. Removing the
 *  //  old 80-HP floor LOWERED early caps (the floor WAS early behavior), so F
 *  //  rose as the floor fell: 0.60 × ~100-HP early enemies = 60, still under
 *  //  the retired floor — a mild early nerf, honest to the thesis. */
/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — THE CAP IS REPEALED.
 *
 * RUPTURE used to clamp at 0.60 x the foe's maximum VITAE. That ceiling was
 * the whole reason the affliction theme could never cash what it built: a deck
 * that spent five turns stacking poison hit the same wall as one that spent
 * two. Payoffs are uncapped now — RUPTURE, REAP ALL, BACKFIRE ALL and the
 * mark-detonators all pay what the player actually banked, and a fed rot deck
 * reaching 200-300 is the intended top of the curve, not an exploit.
 *
 * The function survives so the call sites keep reading as "the cap", and so a
 * future ceiling has one place to live. It currently imposes none.
 */
export const RUPTURE_CAP_FRACTION = Number.POSITIVE_INFINITY;
export function ruptureBurstCap(enemyMaxHealth: number): number {
    void enemyMaxHealth;
    return Number.POSITIVE_INFINITY;
}
/** REAP (single, `the-gleaners-due`) maxHealth erosion rate — phase 32 part 1
 *  (Harvest — REAP attacks MAXIMUM HP, plan/phases/phase_32_theme_deep_work.md
 *  §Part 1): the small utility REAP has no current-HP burst of its own, but
 *  every REAP that spends Souls now also erodes the enemy's ceiling a little,
 *  so the mechanic reads consistently across both Harvest REAP cards — the
 *  capstone (`the-reaping`, `reap_all`) shrinks it by a lot via
 *  `burstPerSoul`, this one shrinks it a little via `cost`. Erosion =
 *  round(cost × REAP_EROSION_PER_SOUL); sized at the same per-Soul rate as
 *  the capstone's burst conversion so both cards speak one formula. A cost-2
 *  REAP erodes 4 max HP — roughly a tenth of the capstone's smallest
 *  realistic burst, keeping the utility card's erosion clearly secondary.
 *  Tunable. */
export const REAP_EROSION_PER_SOUL = 2;
/** Phase 32 part 3 (Akrasia — DEBT ledger, plan/phases/phase_32_theme_deep_work.md
 *  §Part 3): every RECOIL HP the player pays THIS COMBAT (the `recoil` /
 *  `recoil_x` mechanics, the printed `CardRider.recoil` field on both the FREE
 *  and PAID lines, and `fate.recoilHp`) accrues into `CombatEncounterState.
 *  akrasiaDebt`. Every {@link AKRASIA_DEBT_TIER_HP} HP paid crosses one ledger
 *  TIER. Sized close to `self-flagellant`'s printed RECOIL (5) so a single big
 *  blood price crosses roughly one tier on its own, while `pact-of-akrasia`'s
 *  smaller incidental FREE-line recoil (1 HP) needs several plays to bank one
 *  — the ledger rewards sustained sin, not a single spike. Tunable. */
export const AKRASIA_DEBT_TIER_HP = 6;
/** GUARD granted per DEBT tier crossed while FALLEN (spec 32 v3 T4 — the
 *  theme-state condition line). Same "blood buys armor" idiom
 *  `pact-of-akrasia` already prints on its own FREE line (1 HP → 2 Guard),
 *  but at roughly a third of that rate: this is a PASSIVE dividend riding
 *  EVERY akrasia RECOIL source (not a single authored trade the player
 *  opts into per-card), so it must stay a modest ledger bonus rather than a
 *  new dominant Guard engine. Tunable. */
export const AKRASIA_DEBT_TIER_GUARD = 1;
/** Pure tier-crossing arithmetic: how many NEW {@link AKRASIA_DEBT_TIER_HP}
 *  boundaries `after` clears that `before` had not already crossed. Both
 *  floored at 0 (a ledger never goes negative, and a same-or-shrinking total
 *  crosses nothing new — the ledger has no cash-out path yet, see the
 *  Absolution-fork follow-up). */
export function akrasiaDebtTiersCrossed(before: number, after: number): number {
    const b = Math.max(0, Math.floor(before / AKRASIA_DEBT_TIER_HP));
    const a = Math.max(0, Math.floor(after / AKRASIA_DEBT_TIER_HP));
    return Math.max(0, a - b);
}
/** Phase 32 part 4b (Oratory — milestone drip, plan/phases/phase_32_theme_deep_work.md
 *  §Part 4b): every {@link PREMISE_MILESTONE_EVERY}rd Premise the player has EVER
 *  gained this combat (tracked by `CombatEncounterState.premiseMilestoneTotal`, a
 *  lifetime counter that — unlike the spendable `premises` tally it rides alongside
 *  — never resets on a Peroration payoff or CONDEMN) pays a small STAGGER dividend.
 *  "The build pays small dividends DURING construction — the arc gets rungs"
 *  (source doc). Sized at the theme's own smallest Premise grant (1) so a single
 *  Exordium doesn't itself cross a tier, but three plays (or one `mounting-case`)
 *  reliably does. Tunable. */
export const PREMISE_MILESTONE_EVERY = 3;
/** STAGGER rungs granted per Premise milestone crossed — a PASSIVE dividend riding
 *  every Premise source (own-card, borrowed FREE rider, or a future cross-theme
 *  omen grant alike), same "modest ledger bonus, not a new dominant engine" idiom
 *  as {@link AKRASIA_DEBT_TIER_GUARD}. Tunable. */
export const PREMISE_MILESTONE_RUNGS = 1;
/** Pure tier-crossing arithmetic — identical shape to {@link akrasiaDebtTiersCrossed},
 *  parameterized by {@link PREMISE_MILESTONE_EVERY} instead of a fixed HP tier. */
export function premiseMilestonesCrossed(before: number, after: number): number {
    const b = Math.max(0, Math.floor(before / PREMISE_MILESTONE_EVERY));
    const a = Math.max(0, Math.floor(after / PREMISE_MILESTONE_EVERY));
    return Math.max(0, a - b);
}
/** CONDEMN Premises required (plan/tuning/2026-07-08-win-path-scaling.md item
 *  1a): `the-closing-word`'s flat 8-Premise `concedeAt` let Oratory land its
 *  alt-win identically against a 100 HP early wolf and a 1,500+ HP late boss
 *  — Battle Lab round 2 clocked it at 100% win rate on EVERY stage. The
 *  Premise cost now derives from the enemy's own `difficulty` classification
 *  (a real bestiary field, preferred over stage-id string-matching per the
 *  plan): normal/simple enemies keep the card-authored 8; elite enemies need
 *  10; boss/unique enemies (which dominate the late/impossible rosters) need
 *  12. Tunable. */
/**
 * THE CONDEMN LADDER — rescaled 2026-09-02 (THE BIG NUMBERS REWRITE, measured).
 *
 * CONDEMN is an ALT-WIN: reaching the tally ends the fight outright, whatever
 * the foe's VITAE. That makes its cost the only thing standing between a
 * Charge deck and a free kill on anything. At the old 8/10/12 — set when a
 * card filed one or two Charges — a single late-act card filing NINE beat the
 * deliberately-unwinnable Unfinished 87% of the time in the playtest matrix.
 *
 * The floors now scale with what the fight is worth, mirroring RELENT's shape:
 * a trash mob still concedes to a token argument, a unique demands a case built
 * over most of the fight. Every one of these numbers is printed on the card
 * face (`mechanicText`'s `peroration` case), so raising them is honest.
 */
export const CONCEDE_PREMISES_BASE = 12;
export const CONCEDE_PREMISES_ELITE = 24;
export const CONCEDE_PREMISES_BOSS = 40;
export const CONCEDE_PREMISES_UNIQUE = 60;
/** The Premise-tally FLOOR a CONDEMN Peroration must clear against an enemy of
 *  this difficulty — the SINGLE source the engine's concede resolution AND every
 *  presenter/catalog surface read, so a card face can never advertise the base 12
 *  while the live fight demands 24 (elite), 40 (boss) or 60 (unique). WI-6. */
export function concedeFloorFor(difficulty: EnemyDifficulty | undefined): number {
    switch (difficulty) {
        case 'unique': return CONCEDE_PREMISES_UNIQUE;
        case 'boss': return CONCEDE_PREMISES_BOSS;
        case 'elite': return CONCEDE_PREMISES_ELITE;
        default: return CONCEDE_PREMISES_BASE;
    }
}
/** RELENT resolve threshold (Dawncaster Charmed-style rework, plan/
 *  tuning/2026-07-08-win-path-scaling.md item 1a): the old check (PLEA ≥
 *  enemy CURRENT HP) made Grace's alt-win match a boss's ENTIRE HP bar —
 *  unreachable against a 1,000+ HP late pool (0% in Battle Lab round 2).
 *  `resolve` is a per-enemy stat well below max HP:
 *  CAPITULATE_RESOLVE_FRACTION of maxHealth, floored at CAPITULATE_MIN (a
 *  tiny enemy still asks for a token PLEA commitment) and — via
 *  `capitulateThreshold` — never allowed to exceed the enemy's CURRENT
 *  health, so a nearly-dead enemy still yields at the old low bar. Against a
 *  small early enemy 0.35×maxHealth usually sits above current HP anyway,
 *  so early behavior barely moves; against a boss it turns "match the whole
 *  bar" into "commit a real but reachable PLEA investment". Tunable. */
export const CAPITULATE_RESOLVE_FRACTION = 0.35;
export const CAPITULATE_MIN = 10;
/** RELENT resolve threshold for a given enemy — see CAPITULATE_RESOLVE_FRACTION. */
export function capitulateThreshold(enemy: Pick<Enemy, 'health' | 'maxHealth'>): number {
    const resolve = Math.max(CAPITULATE_MIN, Math.round(CAPITULATE_RESOLVE_FRACTION * enemy.maxHealth));
    return Math.min(resolve, enemy.health);
}
/** Phase 32 part 4e (Charm — Resolve milestones, plan/phases/
 *  phase_32_theme_deep_work.md §Part 4e, plan/tuning/2026-07-10-theme-
 *  identity.md "Charm / grace" — "Resolve milestones… the track gets rungs
 *  and a face"): PLEA crossing a named fractional waypoint of the enemy's
 *  LIVE `capitulateThreshold` ("resolve") pays a small one-time dividend.
 *  Fractions of the LIVE resolve — NOT a fixed absolute PLEA number, and NOT
 *  a fraction of maxHealth — so the waypoints track `capitulateThreshold`'s
 *  own live shrink (it falls with the enemy's current health, per
 *  `CAPITULATE_RESOLVE_FRACTION`'s own doc comment) exactly the way the
 *  capitulation offer itself does. Named for the emotional arc the source
 *  doc asks for: Wavering, then Faltering, then — at the full resolve — the
 *  yield offer itself. Each milestone fires AT MOST ONCE per combat (see
 *  `CombatEncounterState.swayMilestoneWaveringFired` /
 *  `swayMilestoneFalteringFired`): a milestone already paid stays paid even
 *  if the live resolve later shrinks back below the threshold that was
 *  crossed — the Souls/DEBT-ledger "never claw back a dividend" precedent
 *  (Parts 1/3/4a), applied to a boolean flag instead of a monotonic counter
 *  because these waypoints are fractions of a value that can itself shrink.
 *  Tunable. */
export const SWAY_WAVERING_FRACTION = 0.45;
export const SWAY_FALTERING_FRACTION = 0.8;
/** Wavering dividend — one stack of QUARTER on the enemy (Charm's own
 *  rapport-building idiom: the exact payload `soft-word` / `disarming-smile`
 *  / `common-ground` / `the-olive-branch` already print). The foe's
 *  resistance visibly softens as their will starts to waver — this is the
 *  "small dividend" speaking Charm's OWN vocabulary, not a borrowed one. */
export const SWAY_WAVERING_RAPPORT = 1;
/** Faltering dividend — a small BONUS PLEA nudge (unscaled by
 *  `buff_grace_momentum`: a flat ledger dividend, not a re-scaled gain, same
 *  "modest ledger bonus" idiom as `AKRASIA_DEBT_TIER_GUARD`/
 *  `PREMISE_MILESTONE_RUNGS`). Commitment breeds more commitment as their
 *  will visibly breaks — the two-stage arc escalates from softening THEM
 *  (Wavering/QUARTER) to accelerating YOUR OWN climb (Faltering/PLEA).
 *  Deliberately NOT a GUARD payoff: `gainSway` is called from inside
 *  `resolveThreatPhase` (the `mirror-of-longing` PLEA-conversion site, see
 *  that call site's own comment) where GUARD is unconditionally reset to 0
 *  the SAME phase — a GUARD dividend paid there would evaporate before it
 *  could ever matter. PLEA is never reset mid-function at any `gainSway`
 *  call site, so it is the one payoff type safe everywhere `gainSway` fires
 *  from. Tunable. */
export const SWAY_FALTERING_BONUS = 2;
/** Resolve-milestone thresholds for a given LIVE resolve value (see
 *  `capitulateThreshold`). Floored at 1 so even the tiny early-game
 *  `CAPITULATE_MIN` (10) resolve floor still prints two distinct, reachable
 *  waypoints rather than rounding one away to 0. Pure. */
export function swayResolveMilestoneThresholds(resolve: number): { wavering: number; faltering: number } {
    return {
        wavering: Math.max(1, Math.round(SWAY_WAVERING_FRACTION * resolve)),
        faltering: Math.max(1, Math.round(SWAY_FALTERING_FRACTION * resolve)),
    };
}
/** RUPTURE — flat burst per NON-DoT affliction stack consumed (marks, backfire,
 *  rapport). Spec 32 v3 §3. Tunable. */
export const RUPTURE_PER_AFFLICTION_STACK = 3;
/** DISRUPT — distinct-control pip threshold that DENIES the enemy's telegraphed
 *  turn (an ADDITIVE OR path on top of the legacy roll-penalty deny). Tunable. */
export const DISRUPT_DENY_AT = 3;
/** STAGGER (spec 32 v3) — rungs a normal telegraphed action carries; removing
 *  all of them denies the turn. Bosses/uniques carry one more. Tunable. */
export const THREAT_RUNGS = 2;
export const THREAT_RUNGS_BOSS = 3;
/** Boss/unique rung REGROWTH (anti-permalock, plan/tuning/2026-07-08-
 *  win-path-scaling.md item 1c): a denial deck (Standstill) that reliably
 *  meets THREAT_RUNGS_BOSS every single round previously locked a boss out
 *  of acting for the whole fight, at every stage, regardless of how tough
 *  the boss nominally was — Battle Lab round 2's 100%-every-stage finding.
 *  Every enemy turn a boss/unique's telegraph was denied or weakened
 *  (rungs removed), it regrows BOSS_RUNG_REGROWTH rungs of resilience on
 *  top of its natural THREAT_RUNGS_BOSS count, capped at doubling that
 *  natural count (`bossRungGrowthCap`) — so a fight-long denial strategy
 *  eventually needs more rungs of STAGGER per round than it can reliably
 *  produce. Normal/elite enemies never accrue this. Tunable. */
export const BOSS_RUNG_REGROWTH = 1;
/** Ceiling on accrued `bossRungGrowth` — never lets a boss's effective rung
 *  total exceed double its natural (`THREAT_RUNGS_BOSS`) count. */
export function bossRungGrowthCap(naturalRungs: number): number {
    return naturalRungs;
}

/**
 * VULNERABLE / RESOLUTE multiplier — the damage multiplier the HP engine applies
 * to every HP source landing on this bearer. Aggregated additively across the
 * bearer's OWN `damageTakenMult` payloads:
 *   mult = 1 + Σ ((damageTakenMult - 1) × intensity)
 * clamped to `[RESOLUTE_MIN_MULT, VULNERABLE_MAX_MULT]`. Returns EXACTLY `1`
 * when the bearer carries no marker, so unmarked HP assertions are byte-identical.
 * P0-truth: the old `Math.max(1, …)` clamp silently erased every protective
 * (<1) payload — `buff_resolute` and self-`debuff_vulnerable` are real now. Pure.
 */
export function getDamageTakenMultiplier(bearer: Combatant): number {
    let mult = 1;
    for (const ae of bearer.effects) {
        const def = lookupEffect(ae.effectId);
        const dtm = def?.payload.damageTakenMult;
        if (dtm === undefined) continue;
        mult += (dtm - 1) * (ae.intensity ?? 1);
    }
    return Math.min(VULNERABLE_MAX_MULT, Math.max(RESOLUTE_MIN_MULT, mult));
}

/**
 * Healing-received multiplier for the bearer (P0-truth wiring):
 *   - `deniesAllyBuffTargeting` (ISOLATED) → 0: the bearer cannot be healed.
 *   - `healingReceivedMulPct` (DESPAIR −15/stack) → 1 + Σ (pct/100 × intensity),
 * clamped to [0, 2]. Exactly 1 for an unmarked bearer. Pure.
 */
export function getHealingReceivedMult(bearer: Combatant): number {
    let mult = 1;
    for (const ae of bearer.effects) {
        const p = lookupEffect(ae.effectId)?.payload;
        if (!p) continue;
        if (p.deniesAllyBuffTargeting) return 0;
        if (p.healingReceivedMulPct !== undefined) {
            mult += (p.healingReceivedMulPct / 100) * (ae.intensity ?? 1);
        }
    }
    return Math.min(2, Math.max(0, mult));
}

/**
 * Outgoing-damage multiplier for the bearer (P0-truth wiring): folds
 * `outgoingDamageMulPct` (SEPTIC −10/stack — dampens the bearer's hits) and
 * `powerMulPct` (REGRESS FATIGUE — dampens card power) into one factor:
 *   mult = 1 + Σ ((outgoingDamageMulPct + powerMulPct)/100 × intensity)
 * clamped to [0.1, 2]. Exactly 1 for an unmarked bearer. Applied to the
 * enemy's telegraphed threat damage and the player's powered strike. Pure.
 */
export function getOutgoingDamageMult(bearer: Combatant): number {
    let mult = 1;
    for (const ae of bearer.effects) {
        const p = lookupEffect(ae.effectId)?.payload;
        if (!p) continue;
        const pct = (p.outgoingDamageMulPct ?? 0) + (p.powerMulPct ?? 0);
        if (pct !== 0) mult += (pct / 100) * (ae.intensity ?? 1);
    }
    return Math.min(2, Math.max(0.1, mult));
}

/**
 * WS8.2 telegraph-damage surface (spec 32 §12 #6) — multiplier on the HP the
 * bearer's TELEGRAPHED threat action deals, from `outgoingThreatDamageMulPct`
 * payloads (EXHAUSTION -25: "weakened hits softer"):
 *   mult = 1 + Σ (outgoingThreatDamageMulPct/100 × intensity)
 * clamped to [0.1, 2] like its sibling `getOutgoingDamageMult` (which also
 * covers non-telegraph sources). Exactly 1 for an unmarked bearer. Read in
 * `resolveThreatPhase` where the budgeted damage lands. Pure.
 */
export function getOutgoingThreatDamageMult(bearer: Combatant): number {
    let mult = 1;
    for (const ae of bearer.effects) {
        const pct = lookupEffect(ae.effectId)?.payload.outgoingThreatDamageMulPct ?? 0;
        if (pct !== 0) mult += (pct / 100) * (ae.intensity ?? 1);
    }
    return Math.min(2, Math.max(0.1, mult));
}

/**
 * HEMORRHAGE decay (P0-truth wiring of `dotModifiers.decayOnHeal`): when the
 * bearer receives a heal, every decay-tagged DoT on them loses 1 intensity
 * (removed at 0) — big but fragile. Returns the updated combatant and the
 * effect ids that decayed. Pure.
 */
export function decayDotsOnHeal<T extends Combatant>(bearer: T): { combatant: T; decayed: string[] } {
    const decayed: string[] = [];
    const effects = bearer.effects.reduce<ActiveEffect[]>((acc, ae) => {
        const def = lookupEffect(ae.effectId);
        if (def?.payload.damageOverTime && def.payload.dotModifiers?.decayOnHeal) {
            decayed.push(ae.effectId);
            if (ae.intensity > 1) acc.push({ ...ae, intensity: ae.intensity - 1 });
            // intensity 1 → the whole effect washes out
        } else {
            acc.push(ae);
        }
        return acc;
    }, []);
    return decayed.length ? { combatant: { ...bearer, effects }, decayed } : { combatant: bearer, decayed };
}

/**
 * Removes ONE active effect by id — the `consumedOnUse` discharge (CLARITY,
 * DOUBT, OVEREXTENDED, NOVIKOV fire once, then vanish). Pure; no-op when absent.
 */
export function consumeEffect<T extends Combatant>(bearer: T, effectId: string): T {
    const idx = bearer.effects.findIndex(ae => ae.effectId === effectId);
    if (idx === -1) return bearer;
    return { ...bearer, effects: bearer.effects.filter((_, i) => i !== idx) };
}

/**
 * Fate Engine P1 (spec 31 §3.1 #17) — STANCE-KEYED VULNERABLE: the extra
 * multiplier the bearer takes from plays powered by a die of `dieColor` (Wild
 * matches every stance; X matches none). Composes multiplicatively with the
 * plain `damageTakenMult` aggregate; clamped to `[1, VULNERABLE_MAX_MULT]`.
 * Exactly 1 for an unmarked bearer or an un-keyed die. Pure.
 */
export function getStanceVulnMult(bearer: Combatant, dieColor: string): number {
    if (dieColor === 'x') return 1;
    let mult = 1;
    for (const ae of bearer.effects) {
        const keyed = lookupEffect(ae.effectId)?.payload.damageTakenMultForStance;
        if (!keyed) continue;
        if (dieColor === 'wild' || dieColor === keyed.stance) {
            mult += (keyed.mult - 1) * (ae.intensity ?? 1);
        }
    }
    return Math.min(VULNERABLE_MAX_MULT, Math.max(1, mult));
}

/** True when the bearer carries a given payload flag (P0-truth gate reads). */
export function hasPayloadFlag(
    bearer: Combatant,
    flag: 'blocksAdvantage' | 'restrictsSurgeAccess' | 'forcesWeakTierNextPlay' | 'forceWildOnNextDie' | 'nextDotTierUpgrade' | 'revealsStance'
        // WS8.2 (spec 32 §12 #6) — control-surface payloads
        | 'suppressesThreatRiders' | 'blursStanceHints' | 'lockedStance',
): string | null {
    for (const ae of bearer.effects) {
        const p = lookupEffect(ae.effectId)?.payload;
        if (!p) continue;
        if (flag === 'nextDotTierUpgrade' ? (p.nextDotTierUpgrade ?? 0) > 0 : p[flag] === true) return ae.effectId;
    }
    return null;
}

/** One pending DoT effect's remaining lifetime total (amplification-aware). */
export interface PendingDotEntry {
    effectId: string;
    label: string;
    /** floor(damagePerRound × intensity × comboMultiplier) summed over the
     *  effect's expected remaining ticks (per-round for round clocks,
     *  `EXPECTED_TRIGGERS_PER_ROUND` per round for event clocks). */
    amount: number;
}

/** WS3 fuel math — how many times each EVENT clock is expected to fire per
 *  round. Legacy (no-trigger) DoTs never read this: their math is unchanged
 *  (one tick per remaining-duration round).
 *  // PLAYTEST-CALIBRATION: conservative constants until WS3.6 telemetry
 *  // replaces them with the sim's own per-policy averages — 2 player plays
 *  // per round drive the card-played and damage-instance clocks; payoff
 *  // verbs fire about once a round at most. */
export const EXPECTED_TRIGGERS_PER_ROUND: Readonly<Record<DotEventTrigger, number>> = {
    'card-played': 2,
    'damage-instance': 2,
    'payoff': 1,
};

/**
 * The total DoT HP still pending on the bearer over the effects' remaining
 * lifetimes — the figure RUPTURE detonates. Amplification-aware (reuses the same
 * combo multiplier the aggregator applies), floored per-tick. Round-clocked
 * (legacy) DoTs tick once per remaining-duration round (permanent counts one
 * tick — exactly today's math); event-clocked DoTs expect
 * `EXPECTED_TRIGGERS_PER_ROUND` ticks over the same round horizon (a
 * no-calendar instance, `remainingDuration` -1, counts one round —
 * conservative, bounded). Pure.
 */
export function getPendingDotTotal(bearer: Combatant, currentRound?: number): { total: number; perEffect: PendingDotEntry[] } {
    const dotAmp = getDotAmplificationByEffect(bearer.effects);
    const perEffect: PendingDotEntry[] = [];
    let total = 0;
    for (const ae of bearer.effects) {
        const def = lookupEffect(ae.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot) continue;
        const intensity = ae.intensity ?? 1;
        const multiplier = dotAmp.get(ae.effectId) ?? 1;
        const eventClock = dotEventTrigger(dot);
        const ticksPerRound = eventClock ? EXPECTED_TRIGGERS_PER_ROUND[eventClock] : 1;
        const rounds = Math.max(1, ae.remainingDuration);
        // P0-truth: escalating DoTs (`escalatesPerTurn`) sum their GROWING future
        // ticks when a round is threaded; flat DoTs keep perTick × ticks.
        // BLEED (spec 32 v3 `decaysPerTick`): intensity falls 1 per future tick
        // and the instance washes out at 0 — the pending fuel must model that
        // decay or RUPTURE previews overstate the burst (projection-truth law).
        const decays = def.payload.dotModifiers?.decaysPerTick === true;
        let amount = 0;
        let tickNo = 0;
        outer: for (let k = 0; k < rounds; k++) {
            const dpr = rampedDamagePerRound(
                ae, dot.damagePerRound, def.payload.dotModifiers,
                currentRound === undefined ? undefined : currentRound + k,
            );
            for (let t = 0; t < ticksPerRound; t++, tickNo++) {
                const tickIntensity = decays ? intensity - tickNo : intensity;
                if (tickIntensity <= 0) break outer;
                amount += Math.floor(dpr * tickIntensity * multiplier);
            }
        }
        perEffect.push({ effectId: ae.effectId, label: def.name, amount });
        total += amount;
    }
    return { total, perEffect };
}

/**
 * Rounds until the bearer's currently-stacked DoT effects alone would drop it
 * to 0 HP, walking round-by-round with the same per-tick formula
 * `getPendingDotTotal` sums in lump form (ramp- and combo-amplification-aware).
 * Each effect's round horizon is capped at `Math.max(1, remainingDuration)` —
 * the same "permanent DoT counts one round" convention `getPendingDotTotal`
 * uses — and event-clocked DoTs (WS3) contribute their expected
 * `EXPECTED_TRIGGERS_PER_ROUND` ticks each round, so the two figures never
 * diverge. Returns `null` when the DoT alone won't finish the bearer over its
 * remaining duration. Pure.
 *
 * `healPerRound` (playtest fix 2026-09-04): the VITAE the bearer is expected
 * to recover each round boundary (REGROW's printed floor, a RAVENOUS foe's
 * projected drain). Netted against that round's ticks BEFORE the lethal
 * check, and the running total never dips below zero (a heal cannot bank
 * surplus VITAE above the bar). Without it the meter read "LETHAL IN 3"
 * against a foe that healed more per round than the stack ticked.
 */
export function computeRoundsToKill(bearer: Combatant, currentRound?: number, healPerRound = 0): number | null {
    const dotAmp = getDotAmplificationByEffect(bearer.effects);
    const dotEffects = bearer.effects
        .map(ae => {
            const def = lookupEffect(ae.effectId);
            const dot = def?.payload.damageOverTime;
            if (!def || !dot) return null;
            const eventClock = dotEventTrigger(dot);
            return {
                ae, dot, dotModifiers: def.payload.dotModifiers,
                intensity: ae.intensity ?? 1,
                multiplier: dotAmp.get(ae.effectId) ?? 1,
                rounds: Math.max(1, ae.remainingDuration),
                ticksPerRound: eventClock ? EXPECTED_TRIGGERS_PER_ROUND[eventClock] : 1,
                decays: def.payload.dotModifiers?.decaysPerTick === true,
                ticksTaken: 0,
            };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);
    if (dotEffects.length === 0) return null;

    const maxRounds = Math.max(...dotEffects.map(e => e.rounds));
    let cumulative = 0;
    for (let k = 0; k < maxRounds; k++) {
        for (const e of dotEffects) {
            if (k >= e.rounds) continue;
            const dpr = rampedDamagePerRound(
                e.ae, e.dot.damagePerRound, e.dotModifiers,
                currentRound === undefined ? undefined : currentRound + k,
            );
            for (let t = 0; t < e.ticksPerRound; t++, e.ticksTaken++) {
                // BLEED decay — same convention as `getPendingDotTotal`.
                const tickIntensity = e.decays ? e.intensity - e.ticksTaken : e.intensity;
                if (tickIntensity <= 0) break;
                cumulative += Math.floor(dpr * tickIntensity * e.multiplier);
            }
        }
        if (cumulative >= bearer.health) return k + 1;
        if (healPerRound > 0) cumulative = Math.max(0, cumulative - healPerRound);
    }
    return null;
}

/**
 * Strips every DoT effect from the bearer (RUPTURE consumes them on detonation).
 * Returns the updated combatant and the consumed effect ids. Pure.
 */
export function consumeDotEffects<T extends Combatant>(bearer: T): { combatant: T; consumed: string[] } {
    const consumed: string[] = [];
    const remaining = bearer.effects.filter(ae => {
        if (lookupEffect(ae.effectId)?.payload.damageOverTime) {
            consumed.push(ae.effectId);
            return false;
        }
        return true;
    });
    return { combatant: { ...bearer, effects: remaining }, consumed };
}

/**
 * Spec 32 v3 RUPTURE — strips EVERY affliction (debuff) from the bearer.
 * Returns the updated combatant, the consumed effect ids (one entry per
 * instance — the SOUL economy counts these), and the total intensity stacks of
 * the consumed NON-DoT afflictions (marks etc. — worth
 * `RUPTURE_PER_AFFLICTION_STACK` each on the detonation). Pure.
 */
export function consumeAfflictions<T extends Combatant>(bearer: T): {
    combatant: T; consumed: string[]; nonDotStacks: number;
} {
    const consumed: string[] = [];
    let nonDotStacks = 0;
    const remaining = bearer.effects.filter(ae => {
        const def = lookupEffect(ae.effectId);
        if (def?.type !== 'debuff') return true;
        consumed.push(ae.effectId);
        if (!def.payload.damageOverTime) nonDotStacks += ae.intensity ?? 1;
        return false;
    });
    return { combatant: { ...bearer, effects: remaining }, consumed, nonDotStacks };
}

/**
 * WINNOWING (spec 32 v3, Harvest) — consumes ONE affliction early: the DoT with
 * the most remaining fuel (falling back to any affliction). Returns the fuel
 * that should tick NOW (0 for a non-DoT) and the consumed id (null if the
 * bearer carries no affliction). Pure.
 */
export function consumeOneAffliction<T extends Combatant>(bearer: T, currentRound?: number): {
    combatant: T; consumed: string | null; fuel: number;
} {
    const pending = getPendingDotTotal(bearer, currentRound).perEffect;
    let pick: ActiveEffect | undefined;
    if (pending.length > 0) {
        const best = pending.reduce((a, b) => (b.amount > a.amount ? b : a));
        pick = bearer.effects.find(ae => ae.effectId === best.effectId);
    } else {
        pick = bearer.effects.find(ae => lookupEffect(ae.effectId)?.type === 'debuff');
    }
    if (!pick) return { combatant: bearer, consumed: null, fuel: 0 };
    const fuel = pending.find(p => p.effectId === pick!.effectId)?.amount ?? 0;
    return {
        combatant: { ...bearer, effects: bearer.effects.filter(ae => ae !== pick) },
        consumed: pick.effectId,
        fuel,
    };
}

/** BACKFIRE (spec 32 v3) — HP the bearer takes PER RUNG its telegraphed action
 *  loses: Σ (backfirePerRung × intensity). 0 when unafflicted. Pure. */
export function getBackfirePerRung(bearer: Combatant): number {
    return bearer.effects.reduce((total, ae) => {
        const per = lookupEffect(ae.effectId)?.payload.backfirePerRung ?? 0;
        return total + per * (ae.intensity ?? 1);
    }, 0);
}

/** Total MARK stacks on the bearer (the conclusion-burst fuel). Pure. */
export function getMarkStacks(bearer: Combatant): number {
    return bearer.effects.reduce((total, ae) => {
        const p = lookupEffect(ae.effectId)?.payload;
        return total + ((p?.tickAmplifyFlat ?? 0) > 0 ? (ae.intensity ?? 1) : 0);
    }, 0);
}

/** Consumes every MARK-class effect on the bearer, returning the stacks removed. */
export function consumeMarks<T extends Combatant>(bearer: T): { combatant: T; stacks: number } {
    let stacks = 0;
    const remaining = bearer.effects.filter(ae => {
        if ((lookupEffect(ae.effectId)?.payload.tickAmplifyFlat ?? 0) > 0) {
            stacks += ae.intensity ?? 1;
            return false;
        }
        return true;
    });
    return { combatant: { ...bearer, effects: remaining }, stacks };
}

/** Count of DISTINCT debuff effect ids on the bearer — variety payoffs' scaler. Pure. */
export function getDistinctDebuffCount(bearer: Combatant): number {
    const ids = new Set<string>();
    for (const ae of bearer.effects) {
        if (lookupEffect(ae.effectId)?.type === 'debuff') ids.add(ae.effectId);
    }
    return ids.size;
}

/** The control surfaces the DISRUPT meter distinguishes (WS8.3). */
type ControlSurface = 'action' | 'roll' | 'threat-damage' | 'rider-suppress' | 'stance';

/**
 * Count of DISTINCT control SURFACES touched on the bearer — the DISRUPT deny
 * meter's pip count. WS8.3 (spec 32 §12, ratified 2026-07-11 #6): the meter
 * counts KINDS of grip, not effect ids — three roll shreds are ONE pip;
 * `DISRUPT_DENY_AT = 3` means "three different kinds of grip". Surfaces,
 * classified by payload shape:
 *   - action         — an `actionRestriction` (skip / forced / blocked)
 *   - roll           — a negative roll modifier (the accuracy-down bucket)
 *   - threat-damage  — `outgoingThreatDamageMulPct < 0` (EXHAUSTION)
 *   - rider-suppress — `suppressesThreatRiders` (BLIND)
 *   - stance         — `lockedStance` (ROOT) or `blursStanceHints` (CONFUSION)
 * Centralizes the predicate so the engine and the mobile meter agree. Pure.
 */
export function getDistinctControlCount(bearer: Combatant): number {
    const surfaces = new Set<ControlSurface>();
    for (const ae of bearer.effects) {
        const p = lookupEffect(ae.effectId)?.payload;
        if (!p) continue;
        const r = p.actionRestriction;
        if (!!r && (r.skipTurn === true || r.forcedStance !== undefined || (r.blockedStances?.length ?? 0) > 0)) {
            surfaces.add('action');
        }
        if ((p.rollModifier ?? 0) < 0 || (p.rollModifierPerIntensity ?? 0) < 0) surfaces.add('roll');
        if ((p.outgoingThreatDamageMulPct ?? 0) < 0) surfaces.add('threat-damage');
        if (p.suppressesThreatRiders === true) surfaces.add('rider-suppress');
        if (p.lockedStance === true || p.blursStanceHints === true) surfaces.add('stance');
    }
    return surfaces.size;
}

/**
 * Decrements the remainingDuration of one specific active effect by 1.
 * Permanent effects (-1) are untouched. Does not remove expired effects;
 * use `tickAllEffects` for the full cleanup.
 */
export function updateEffectDuration<T extends Combatant>(target: T, effectId: string): T {
    const updated = target.effects.map(effect => {
        if (effect.effectId !== effectId) return effect;
        if (effect.remainingDuration === -1) return effect;
        return { ...effect, remainingDuration: effect.remainingDuration - 1 };
    });
    return { ...target, effects: updated };
}

/**
 * Decrements every non-permanent effect's remaining duration by 1, removes
 * any that expired, and returns both the updated combatant and the list of
 * expired effects (for UI announcements). WS3: effects that opted out of the
 * calendar (`dotModifiers.calendarExpiry === false`) never count down — they
 * expire only via their own decay (e.g. `decaysPerTick` washout) or combat end.
 *
 * BEARER ASYMMETRY (2026-07-12): the no-calendar law was ratified for ENEMY
 * bearers, where payoff consumption (RUPTURE / consumeMarks / cleanse riders)
 * bounds a permanent affliction. The player has no such consumer, so a
 * player-borne no-calendar effect honors the opt-out only when it can wash
 * itself out (`decaysPerTick`); otherwise (e.g. MARK) its printed duration
 * applies again — enemy-applied marks on the player must not snowball forever.
 */
export function tickAllEffects<T extends Combatant>(
    target: T,
    bearer: 'player' | 'enemy' = 'enemy',
): { target: T; expired: ActiveEffect[] } {
    const expired: ActiveEffect[] = [];
    const remaining = target.effects.reduce<ActiveEffect[]>((acc, effect) => {
        const mods = lookupEffect(effect.effectId)?.payload.dotModifiers;
        const noCalendar = mods?.calendarExpiry === false
            && (bearer === 'enemy' || mods?.decaysPerTick === true);
        if (effect.remainingDuration === -1 || noCalendar) {
            acc.push(effect);
            return acc;
        }
        const ticked = { ...effect, remainingDuration: effect.remainingDuration - 1 };
        if (ticked.remainingDuration <= 0) {
            expired.push(ticked);
        } else {
            acc.push(ticked);
        }
        return acc;
    }, []);

    return { target: { ...target, effects: remaining }, expired };
}

/**
 * Removes one random buff (effect with `type === 'buff'`) from the combatant.
 * Returns the updated combatant and the removed effect (or `null` if none).
 */
export function removeRandomBuff<T extends Combatant>(target: T): { target: T; removed: ActiveEffect | null } {
    const buffs = target.effects.filter(ae => lookupEffect(ae.effectId)?.type === 'buff');
    if (buffs.length === 0) return { target, removed: null };

    const removed = buffs[Math.floor(getRng().random() * buffs.length)];
    const updated = target.effects.filter(ae => ae !== removed);
    return { target: { ...target, effects: updated }, removed };
}

/**
 * Extends one random buff's duration by `amount` rounds (capped at the
 * MAX_EFFECT_DURATION). Returns the updated combatant and the extended effect.
 */
export function extendRandomBuffDuration<T extends Combatant>(
    target: T,
    amount: number,
): { target: T; extended: ActiveEffect | null } {
    const buffs = target.effects.filter(ae => lookupEffect(ae.effectId)?.type === 'buff');
    if (buffs.length === 0) return { target, extended: null };

    const original = buffs[Math.floor(getRng().random() * buffs.length)];
    const extended: ActiveEffect = {
        ...original,
        remainingDuration: Math.min(original.remainingDuration + amount, MAX_EFFECT_DURATION),
    };
    const updated = target.effects.map(ae => ae === original ? extended : ae);
    return { target: { ...target, effects: updated }, extended };
}

/**
 * Applies start-of-round health regeneration from all positive
 * `regeneration.healthPerRound` payloads on the combatant. Per Q2, regen is
 * intensity-scaled. Healing is clamped at `maxHealth` by `heal()`.
 */
export function applyRegen<T extends Combatant>(target: T): { target: T; healed: number } {
    const mods = getActiveEffectModifiers(target.effects);
    if (mods.healthRegen <= 0) return { target, healed: 0 };
    return { target: heal(target, mods.healthRegen), healed: mods.healthRegen };
}

/**
 * Applies drain (negative `regeneration.healthPerRound`) per Q6 as a unique
 * raw-HP loss, separate from regen and from DoT. Drain bypasses defense (it's
 * the body wasting itself, not an external hit) and is dealt at round start.
 */
export function applyDrain<T extends Combatant>(target: T): { target: T; drained: number } {
    const mods = getActiveEffectModifiers(target.effects);
    if (mods.healthDrain <= 0) return { target, drained: 0 };
    return { target: applyDamage(target, mods.healthDrain), drained: mods.healthDrain };
}

/**
 * Applies damage-over-time damage for the given phase (Q4). Each DoT effect
 * declares an optional `tickPhase` (`'start'` or `'end'`); without one the
 * effect ticks at start. Per Q5, DoT damage is unresisted — it bypasses
 * defense and the `damageType` is purely informational for now. WS3:
 * event-clocked DoTs never tick here (the aggregator already excludes them);
 * `washedOut` surfaces decay-consumed instances so the Soul economy can count
 * no-calendar expiries.
 */
export function processDamageOverTime<T extends Combatant>(
    target: T,
    phase: 'start' | 'end',
    currentRound?: number,
): { target: T; damage: number; washedOut: ActiveEffect[] } {
    const mods = getActiveEffectModifiers(target.effects, currentRound);
    const projectedDamage = phase === 'start' ? mods.dotStart : mods.dotEnd;
    if (projectedDamage <= 0) return { target, damage: 0, washedOut: [] };
    // A receipt names HP that actually left the bar, never theoretical overkill.
    // `applyDamage` already clamps the resulting health; clamp the returned
    // amount to the same truth or attribution can exceed total VITAE lost.
    const damage = Math.min(projectedDamage, Math.max(0, target.health));
    let next: T = applyDamage(target, damage);
    // BLEED (spec 32 v3, `dotModifiers.decaysPerTick`): a front-loaded DoT loses
    // 1 intensity each time it ticks; the instance washes out at 0. Only effects
    // that ticked THIS phase decay. No-op for every non-decaying DoT.
    const washedOut: ActiveEffect[] = [];
    const decayed = next.effects.reduce<ActiveEffect[]>((acc, ae) => {
        const p = lookupEffect(ae.effectId)?.payload;
        const ticksThisPhase = !!p?.damageOverTime && dotRoundClockPhase(p.damageOverTime) === phase;
        if (ticksThisPhase && p?.dotModifiers?.decaysPerTick) {
            if (ae.intensity > 1) acc.push({ ...ae, intensity: ae.intensity - 1 });
            else washedOut.push(ae); // intensity 1 → the instance is spent
        } else {
            acc.push(ae);
        }
        return acc;
    }, []);
    if (decayed.length !== next.effects.length
        || decayed.some((ae, i) => ae !== next.effects[i])) {
        next = { ...next, effects: decayed };
    }
    return { target: next, damage, washedOut };
}

/**
 * Round-start orchestration. Order:
 *   1. HP regen
 *   2. Drain (negative regen)
 *   3. Start-phase DoT
 *
 * Tick / expiry are intentionally *not* performed here; they belong to
 * `processRoundEndEffects` so duration counts down once per round.
 */
export function processRoundStartEffects<T extends Combatant>(target: T, currentRound?: number): {
    target: T;
    healed: number;
    drained: number;
    dotDamage: number;
    /** WS3 — decay-consumed DoT instances (Soul economy reads no-calendar ones). */
    dotWashedOut: ActiveEffect[];
} {
    const regen = applyRegen(target);
    const drain = applyDrain(regen.target);
    const dot   = processDamageOverTime(drain.target, 'start', currentRound);
    return {
        target:       dot.target,
        healed:       regen.healed,
        drained:      drain.drained,
        dotDamage:    dot.damage,
        dotWashedOut: dot.washedOut,
    };
}

/**
 * Round-end orchestration. Order:
 *   1. End-phase DoT (e.g. bleed)
 *   2. Tick / expire all effects (single decrement per round)
 */
export function processRoundEndEffects<T extends Combatant>(
    target: T,
    currentRound?: number,
    bearer: 'player' | 'enemy' = 'enemy',
): {
    target: T;
    dotDamage: number;
    expired: ActiveEffect[];
    /** WS3 — decay-consumed DoT instances (Soul economy reads no-calendar ones). */
    washedOut: ActiveEffect[];
} {
    const dot   = processDamageOverTime(target, 'end', currentRound);
    const ticked = tickAllEffects(dot.target, bearer);
    return {
        target:    ticked.target,
        dotDamage: dot.damage,
        expired:   ticked.expired,
        washedOut: dot.washedOut,
    };
}

// ── WS3.2 — trigger-clock DoT substrate (spec 32 §12, ratified 2026-07-11 #3) ─

/** One `fireDotTrigger` outcome. */
export interface DotTriggerResult<T extends Combatant> {
    target: T;
    /** Total HP the matching effects ticked for (0 = no matching clock fired). */
    damage: number;
    /** Per-effect breakdown for `dot-tick` event emission. */
    perEffect: { effectId: string; label: string; amount: number }[];
    /** `decaysPerTick` instances consumed by this tick (intensity hit 0) — the
     *  Soul economy counts the no-calendar ones as expiries. */
    washedOut: ActiveEffect[];
}

/**
 * Advances one EVENT clock (WS3): ticks exactly the effects whose
 * `damageOverTime.trigger` matches, with the same per-tick body
 * `processDamageOverTime` uses — combo amplification, POISON ramp
 * (`escalatesPerTurn`), MARK flat amplification, and BLEED `decaysPerTick`
 * washout. Legacy (untriggered) and round-clocked DoTs never match here.
 * The tick damage is applied with the plain `applyDamage`, so a
 * 'damage-instance' DoT can never re-trigger itself. Pure; exact no-op
 * (same object) when nothing matches.
 *
 * `eligible` (WS3.3) — optional per-instance gate: an instance for which it
 * returns false (or 0) neither ticks nor decays on this trigger. The card-play
 * resolver passes "existed BEFORE this play" so a play's own fresh stacks are
 * never on their own clock (doctrine witness: a PAID line must not chip a
 * clean enemy — the stacks start paying from the NEXT play). A NUMBER return
 * is a partial gate: the instance ticks as if its intensity were
 * `min(intensity, n)` — with 'intensity' merge-stacking a re-application
 * raises the ONE existing instance, so the resolver caps the tick at the
 * pre-play intensity and only the pre-existing stacks pay this play.
 */
export function fireDotTrigger<T extends Combatant>(
    target: T,
    trigger: DotEventTrigger,
    currentRound?: number,
    eligible?: (ae: ActiveEffect) => boolean | number,
): DotTriggerResult<T> {
    const dotAmp = getDotAmplificationByEffect(target.effects);
    const markBonus = getTickAmplifyFlat(target.effects);
    const perEffect: DotTriggerResult<T>['perEffect'] = [];
    const onClock = (ae: ActiveEffect): boolean => {
        if (!eligible) return true;
        const gate = eligible(ae);
        return gate !== false && gate !== 0;
    };
    let damage = 0;
    for (const ae of target.effects) {
        const def = lookupEffect(ae.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot || dot.trigger !== trigger) continue;
        const gate = eligible ? eligible(ae) : true;
        if (gate === false || gate === 0) continue;
        const clocked = typeof gate === 'number'
            ? Math.max(0, Math.min(ae.intensity ?? 1, gate))
            : (ae.intensity ?? 1);
        const multiplier = dotAmp.get(ae.effectId) ?? 1;
        const dpr = rampedDamagePerRound(ae, dot.damagePerRound, def.payload.dotModifiers, currentRound);
        const amount = Math.floor(dpr * clocked * multiplier) + markBonus;
        perEffect.push({ effectId: ae.effectId, label: def.name, amount });
        damage += amount;
    }
    if (damage <= 0) return { target, damage: 0, perEffect: [], washedOut: [] };
    // Clamp the labeled breakdown in deterministic effect order. The event
    // stream is an accounting ledger: once VITAE reaches zero, later theoretical
    // ticks cannot claim damage that never occurred.
    let hpRemaining = Math.max(0, target.health);
    const actualPerEffect = perEffect.flatMap(tick => {
        const amount = Math.min(tick.amount, hpRemaining);
        hpRemaining -= amount;
        return amount > 0 ? [{ ...tick, amount }] : [];
    });
    const actualDamage = actualPerEffect.reduce((sum, tick) => sum + tick.amount, 0);
    let next: T = applyDamage(target, actualDamage);
    // Same decay rule as the round clocks: only effects that ticked THIS
    // trigger decay; the instance washes out at intensity 0.
    const washedOut: ActiveEffect[] = [];
    const decayed = next.effects.reduce<ActiveEffect[]>((acc, ae) => {
        const p = lookupEffect(ae.effectId)?.payload;
        const tickedThisTrigger = p?.damageOverTime?.trigger === trigger
            && onClock(ae);
        if (tickedThisTrigger && p?.dotModifiers?.decaysPerTick) {
            if (ae.intensity > 1) acc.push({ ...ae, intensity: ae.intensity - 1 });
            else washedOut.push(ae); // intensity 1 → the instance is spent
        } else {
            acc.push(ae);
        }
        return acc;
    }, []);
    if (decayed.length !== next.effects.length
        || decayed.some((ae, i) => ae !== next.effects[i])) {
        next = { ...next, effects: decayed };
    }
    return { target: next, damage: actualDamage, perEffect: actualPerEffect, washedOut };
}

/**
 * WS3 Doom growth (`dotModifiers.growth: 'per-enemy-action'`) — every matching
 * effect on the bearer gains +1 intensity (capped at `MAX_EFFECT_INTENSITY`).
 * The engine calls this on the ENEMY after its telegraphed action actually
 * fires (a denied turn never grows the Doom). Pure; no-op when none match.
 */
export function growPerEnemyActionDots<T extends Combatant>(bearer: T): { combatant: T; grown: string[] } {
    const grown: string[] = [];
    const effects = bearer.effects.map(ae => {
        const p = lookupEffect(ae.effectId)?.payload;
        if (p?.dotModifiers?.growth !== 'per-enemy-action') return ae;
        grown.push(ae.effectId);
        return { ...ae, intensity: Math.min(MAX_EFFECT_INTENSITY, ae.intensity + 1) };
    });
    return grown.length ? { combatant: { ...bearer, effects }, grown } : { combatant: bearer, grown };
}

/**
 * Cleanse — strip debuffs from the bearer scoped by the cleanse effect's tier.
 * A Tier 2 cleanse removes Tier 1 + 2 debuffs; a Tier 3 cleanse strips
 * everything. Pure: returns updated combatant and the list of removed effects.
 *
 * @param tier - Tier of the cleansing effect (1, 2, or 3). Removes any debuff
 *               whose `tier <= cleanseTier`.
 */
export function applyCleanse<T extends Combatant>(
    target: T,
    tier: 1 | 2 | 3,
): { target: T; removed: ActiveEffect[] } {
    const { activeEffects, removed } = removeEffectsByType(target.effects, 'debuff', tier);
    return { target: { ...target, effects: activeEffects }, removed };
}

/**
 * Dispel — strip buffs from the bearer scoped by the dispel effect's tier
 * (mirror of `applyCleanse`).
 */
export function applyDispel<T extends Combatant>(
    target: T,
    tier: 1 | 2 | 3,
): { target: T; removed: ActiveEffect[] } {
    const { activeEffects, removed } = removeEffectsByType(target.effects, 'buff', tier);
    return { target: { ...target, effects: activeEffects }, removed };
}
