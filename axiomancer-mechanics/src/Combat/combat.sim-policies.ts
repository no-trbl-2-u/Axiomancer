/**
 * Combat sim policies — the playtest roster of scripted witnesses.
 *
 * A `CombatSimPolicy` bundles every decision seam of the encounter sim
 * (`combat.encounter.sim.ts`): how to rank candidate powered plays, which
 * Signature Skills to fund, when to spend Conviction, and how a mercy choice
 * resolves. The sim driver stays
 * one loop; the policies make it a matrix.
 *
 * HP is the sole win condition (the old status-primacy doctrine is retired —
 * see `docs/lexicon.json`). The roster was built to witness status play: `dot-weaver` and `control-lock` play the doctrinal game,
 * `aggro-brute` is the deliberately weak basic-attack baseline (its
 * underperformance IS the design), and `greedy`/`blind` remain the tuned
 * balance witnesses.
 *
 * Behavior guarantee: `greedy` and `blind`'s `rankCard`/`bestSignature`
 * ordering encodes EXACTLY the legacy per-card score (payoff cards at
 * DoT/debuff thresholds, Befriend-at-lowHp, new-status-first,
 * status-over-strike, damage preview) — never consumes rng, so the seeded
 * engine stream is untouched there. Since the D7 flag collapse (2026-09-25)
 * deleted the hidden-stance draft and THE STAKE, `greedy` and `blind` differ
 * only in `strikeAddsAt` (whatever the entries below set).
 */

import { getCardById } from '../Cards/cards.library';
import { MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import type {
    CombatCard, CombatEncounterState, SignatureSkill, SignatureSkillKind,
} from './combat.encounter.types';
import type { CombatDeckFocus } from './combat.starter-deck-presets';
import { getPendingDotTotal } from './effects';

/** Every scripted witness the sim can drive. */
export type CombatSimPolicyId =
    | 'greedy' | 'blind'
    | 'dot-weaver' | 'control-lock' | 'aggro-brute' | 'turtle' | 'chaos' | 'mercy-seeker';

/**
 * A scripted witness: the full decision surface of one sim player.
 * `rankCard` scores candidate powered plays (highest wins; ties resolve to the
 * earliest card in hand order, matching the legacy stable sort).
 */
export interface CombatSimPolicy {
    id: CombatSimPolicyId;
    name: string;
    /** One line, doctrine-aware: what this witness proves about status play. */
    description: string;
    /** Deck focus used when a playtest cell says `{ kind: 'policy-pick' }`. */
    preferredFocus: CombatDeckFocus;
    /** Rank candidate powered plays; highest first. Receives the same candidate
     *  info the legacy `bestCard` used. Only `chaos` consumes `rng`. */
    rankCard(state: CombatEncounterState, card: CombatCard, rng: () => number): number;
    /** Signature kinds this witness will fund (checked in `state.signatures` order). */
    signatureKinds: readonly SignatureSkillKind[];
    /** Cast a signature when `conviction >= this`. */
    convictionThreshold: number;
    /** How a Befriend-opened mercy choice resolves. */
    mercyChoice: 'spare' | 'exploit';
    /**
     * How a PLEA-opened capitulation offer (RELENT) resolves: `accept` ends
     * the fight in the enemy's yield; `continue` declines and keeps fighting
     * for this witness's own preferred win condition. A static per-policy
     * stance, not a lookahead — mirrors `mercyChoice`'s shape. Only
     * `mercy-seeker` (mercy is its entire identity) and `chaos` (the
     * non-optimizing noise floor) accept; every other witness plays through
     * the offer, since RELENT is one alt-win among several that compete on
     * merit (CLAUDE.md), not a default exit.
     */
    capitulationChoice: 'accept' | 'continue';
    /**
     * OPTIONAL (extension beyond the base contract): rank affordable signatures;
     * highest wins. When absent the sim takes the FIRST affordable signature in
     * `state.signatures` order whose kind is in `signatureKinds` — the legacy
     * behavior `greedy`/`blind` rely on. Only `chaos` uses this (random pick).
     */
    rankSignature?(state: CombatEncounterState, signature: SignatureSkill, rng: () => number): number;
    /**
     * OPTIONAL (WS7.2 chosen X-costs): pick the X for a chosen-X mechanic
     * (`recoil_x`), given the engine's own clamp range (`recoilXRange`). When
     * absent the sim plays the printed minimum. Only `chaos` consumes `rng`.
     */
    chooseX?(state: CombatEncounterState, card: CombatCard, range: { min: number; max: number }, rng: () => number): number;
    /**
     * Phase 102 (SUMMON) — the minimum PROJECTED post-soak add damage that
     * justifies paying `STRIKE_ADD_COST`. Once
     * `projectIncomingThreat(state).addNetDamage >= strikeAddsAt` and
     * Conviction covers the price, the witness strikes the highest-bite living
     * add. Absent = never strikes — the strict default, so every policy
     * without this field is byte-identical to its pre-Phase-102 behavior.
     *
     * The threshold reads "clear whatever the brood still gets through the
     * wall": a turtle behind a live wall projects `addNetDamage === 0` and
     * correctly declines to pay, which is the designed decision TAUGHT rather
     * than hard-coded. Audit 3.8 — "a live wall" means the wall the phase ENDS
     * holding, not the one it started with: the decision is settled after the
     * card pass and the wind-down, because a witness that reads the opening
     * wall can buy a body its own next play would have answered for free.
     * Ties on bite resolve to `state.adds` order — no RNG.
     * Read by `upgradeablePlayPhase`.
     */
    strikeAddsAt?: number;
}

// ─── Score bands ─────────────────────────────────────────────────────────────
// Additive bands keep the per-card score a faithful encoding of a lexicographic
// sort: each band dwarfs everything below it (bottomDamagePreview stays well
// under BAND_EFFECT). Payoff picks return a FLAT band value so ties between two
// payoff cards resolve by hand order — exactly like the legacy `cards.find`.
const BAND_PAYOFF_RUPTURE = 3e15;
const BAND_PAYOFF_REAP = 2e15;
const BAND_PAYOFF_PREMISES = 1e15;
const BAND_BEFRIEND_LOW_HP = 1e12;
const BAND_PRIMARY = 2e8;
const BAND_SECONDARY = 1e7;
const BAND_NEW_STATUS = 1e8;
const BAND_EFFECT = 1e4;
const BAND_UTILITY_LIVE = 1e6;

/** Legacy payoff thresholds (mirrors the pre-roster `bestCard` preamble). */
const RUPTURE_PENDING_DOT_AT = 12;
/** Spec 32 v3 payoff gates: REAP-all cashes a funded Soul bank; a premise
 *  spend cashes a built tally. */
const REAP_SOULS_AT = 4;
const SPEND_PREMISES_AT = 4;
/** Legacy low-HP gate for the Befriend/mercy turn. */
const LOW_HP_FRACTION = 0.30;

/** The special-mechanic kinds a card's backing card carries (0.34.0 payoffs). */
function cardMechKinds(card: CombatCard): Set<string> {
    const sourceCard = getCardById(card.id);
    return new Set((sourceCard?.specialMechanics ?? []).map(m => m.kind));
}

function enemyLowHp(s: CombatEncounterState): boolean {
    return s.enemy.health <= s.enemy.maxHealth * LOW_HP_FRACTION;
}

function isNewStatus(s: CombatEncounterState, card: CombatCard): boolean {
    if (!card.primaryEffectId) return false;
    return !s.enemy.effects.some(e => e.effectId === card.primaryEffectId);
}

function isControlClass(card: CombatCard): boolean {
    return card.verbClass === 'direct-control' || card.verbClass === 'stat-debuff';
}

function isUtilityClass(card: CombatCard): boolean {
    return card.verbClass === 'defend' || card.verbClass === 'buff-self';
}

/**
 * WS8.4 — does the enemy's UPCOMING telegraphed run carry a rider (a status
 * effect riding the damage, not just the damage itself)? Read from the
 * omniscient `threatPhases` (control-lock is never blind), from the current
 * phase onward, so a rider two phases out still counts.
 */
function upcomingThreatHasRider(s: CombatEncounterState): boolean {
    return s.threatPhases
        .slice(s.currentPhaseIndex)
        .some(p => p.threatAction.effects.some(e => !!e.effectId));
}

/**
 * WS8.4 falsifiable probe (spec 32 §12 #6) — the control-lock policy's pick
 * should be a matchup read, not a fixed rotation. Two distinct control
 * surfaces exist among rung-denial candidates: STAGGER (rungsTotal on the
 * card's `stagger` special mechanic — softens/denies the telegraphed hit
 * itself) and BACKFIRE (`debuff_backfire`'s intensity × duration — punishes
 * the enemy for every rung denied, landing regardless of what the rung
 * carried). Against a threat that carries a RIDER, denying rungs alone
 * doesn't erase it (only the WS8.2 BLIND surface does, a distinct card
 * class) — cash in on the guaranteed BACKFIRE punish instead. Against a
 * clean or compounding threat, the rung denial itself IS the win — rank on
 * STAGGER rungs first (stance-lock as a certainty tiebreak), BACKFIRE as a
 * rounding error.
 */
function controlSurfaceBonus(s: CombatEncounterState, card: CombatCard): number {
    const source = getCardById(card.id);
    if (!source) return 0;
    const staggerRungs = source.specialMechanics
        ?.find((m): m is { kind: 'stagger'; rungs: number } => m.kind === 'stagger')?.rungs ?? 0;
    const locksStance = source.specialMechanics?.some(m => m.kind === 'lock_stance') ?? false;
    const backfire = source.combatEffects?.find(e => e.effectId === 'debuff_backfire');
    const backfireValue = backfire ? (backfire.intensity ?? 1) * (backfire.duration ?? 1) : 0;

    if (upcomingThreatHasRider(s)) return backfireValue * 100;
    return staggerRungs * 1000 + (locksStance ? 10 : 0) + backfireValue;
}

/**
 * The legacy `bestCard` ordering as a pure per-card score (bit-identical
 * argmax): payoff cash-ins first (never on a low-HP mercy turn), Befriend when
 * the foe is low, then new-status > any-status > damage preview.
 */
function greedyRankCard(s: CombatEncounterState, card: CombatCard): number {
    if (!enemyLowHp(s)) {
        const kinds = cardMechKinds(card);
        const pendingDot = getPendingDotTotal(s.enemy).total;
        // Flat returns: ties between payoff cards fall back to hand order,
        // exactly like the legacy first-match `cards.find`.
        if (kinds.has('rupture') && pendingDot >= RUPTURE_PENDING_DOT_AT) return BAND_PAYOFF_RUPTURE;
        if (kinds.has('reap_all') && (s.souls ?? 0) >= REAP_SOULS_AT) return BAND_PAYOFF_REAP;
        if (kinds.has('spend_premises') && (s.premises ?? 0) >= SPEND_PREMISES_AT) return BAND_PAYOFF_PREMISES;
    }
    let score = card.bottomDamagePreview;
    if (enemyLowHp(s) && card.verbClass === 'befriend') score += BAND_BEFRIEND_LOW_HP;
    if (isNewStatus(s, card)) score += BAND_NEW_STATUS;
    if (card.effectKind !== 'none') score += BAND_EFFECT;
    return score;
}

/**
 * WS7.2 — greedy's chosen X: the max AFFORDABLE-USEFUL X. Affordable is the
 * engine's clamp (the passed range); useful stops where extra X buys nothing
 * (poison intensity is capped at MAX_EFFECT_INTENSITY).
 */
function greedyChooseX(card: CombatCard, range: { min: number; max: number }): number {
    const sourceCard = getCardById(card.id);
    const mech = (sourceCard?.specialMechanics ?? []).find(m => m.kind === 'recoil_x') as
        { kind: 'recoil_x'; min: number; poisonPerX: number } | undefined;
    if (!mech || mech.poisonPerX <= 0) return range.max;
    const usefulMax = Math.ceil(MAX_EFFECT_INTENSITY / mech.poisonPerX);
    return Math.max(range.min, Math.min(range.max, usefulMax));
}

/** The legacy signature preference list (order-insensitive membership check). */
const LEGACY_SIGNATURE_KINDS: readonly SignatureSkillKind[] =
    Object.freeze(['dot', 'control', 'mercy', 'conclude']);

const ALL_SIGNATURE_KINDS: readonly SignatureSkillKind[] = Object.freeze([
    'scout', 'reroll', 'sustain', 'control', 'dot', 'mercy', 'conclude', 'draw',
    'empower', 'surge',
]);

/** The scripted witness roster. */
export const COMBAT_SIM_POLICIES: Record<CombatSimPolicyId, CombatSimPolicy> = {
    greedy: {
        id: 'greedy',
        name: 'Greedy (omniscient witness)',
        description: 'The tuned balance witness: plays the status game — new DoTs first, payoffs on time, strikes last.',
        preferredFocus: 'balanced',
        rankCard: (s, card) => greedyRankCard(s, card),
        signatureKinds: LEGACY_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'spare',
        capitulationChoice: 'continue',
        chooseX: (_s, card, range) => greedyChooseX(card, range),
        strikeAddsAt: 1,
    },
    blind: {
        id: 'blind',
        name: 'Blind (player-feel witness)',
        description: 'The same status-first play as greedy. Its hidden-stance difference died with the draft (D7); kept so the playtest matrix keeps its column.',
        preferredFocus: 'balanced',
        rankCard: (s, card) => greedyRankCard(s, card),
        signatureKinds: LEGACY_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'spare',
        capitulationChoice: 'continue',
        chooseX: (_s, card, range) => greedyChooseX(card, range),
        strikeAddsAt: 1,
    },
    'dot-weaver': {
        id: 'dot-weaver',
        name: 'DoT Weaver',
        description: 'All-in on erosion: fresh DoTs and rupture/reap payoffs above all; utility only once the foe is already bleeding.',
        preferredFocus: 'dot',
        rankCard: (s, card) => {
            const kinds = cardMechKinds(card);
            const pendingDot = getPendingDotTotal(s.enemy).total;
            if (kinds.has('rupture') && pendingDot >= RUPTURE_PENDING_DOT_AT) return BAND_PAYOFF_RUPTURE;
            if (kinds.has('reap_all') && (s.souls ?? 0) >= REAP_SOULS_AT) return BAND_PAYOFF_REAP;
            if (card.verbClass === 'direct-dot') {
                return (isNewStatus(s, card) ? BAND_PRIMARY : BAND_SECONDARY) + card.bottomDamagePreview;
            }
            // Utility only when the enemy already carries a ticking DoT.
            if (isUtilityClass(card)) return pendingDot > 0 ? BAND_UTILITY_LIVE : 1;
            if (card.effectKind !== 'none') return BAND_EFFECT + card.bottomDamagePreview;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['dot', 'conclude'],
        convictionThreshold: 7,
        mercyChoice: 'exploit',
        capitulationChoice: 'continue',
        strikeAddsAt: 1,
    },
    'control-lock': {
        id: 'control-lock',
        name: 'Control Lock',
        description: 'Denial play: control and stat-debuff locks first (fresh ones for the combo), aiming to erase the enemy\'s telegraphed turns.',
        preferredFocus: 'control',
        rankCard: (s, card) => {
            if (isControlClass(card)) {
                return (isNewStatus(s, card) ? BAND_PRIMARY : BAND_SECONDARY)
                    + card.bottomDamagePreview + controlSurfaceBonus(s, card);
            }
            if (card.verbClass === 'direct-dot') return BAND_EFFECT * 10 + card.bottomDamagePreview;
            if (card.verbClass === 'defend') return BAND_EFFECT;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['control', 'dot'],
        convictionThreshold: 8,
        mercyChoice: 'spare',
        capitulationChoice: 'continue',
        strikeAddsAt: 1,
    },
    'aggro-brute': {
        id: 'aggro-brute',
        name: 'Aggro Brute',
        description: 'The doctrine\'s weak baseline: raw damage preview, no payoff timing, no status game — its underperformance IS the design.',
        preferredFocus: 'damage',
        rankCard: (_s, card) => card.bottomDamagePreview,
        signatureKinds: ['conclude'],
        convictionThreshold: 7,
        mercyChoice: 'exploit',
        capitulationChoice: 'continue',
    },
    turtle: {
        id: 'turtle',
        name: 'Turtle',
        description: 'Outlast play: guard/barrier walls first, DoT erosion second — status still does the killing, just from behind a shield.',
        preferredFocus: 'utility',
        rankCard: (s, card) => {
            if (card.verbClass === 'defend') return BAND_PRIMARY + card.bottomDamagePreview;
            if (card.verbClass === 'buff-self') return BAND_PRIMARY / 2 + card.bottomDamagePreview;
            if (card.verbClass === 'direct-dot') {
                return (isNewStatus(s, card) ? BAND_SECONDARY : BAND_SECONDARY / 10) + card.bottomDamagePreview;
            }
            if (card.effectKind !== 'none') return BAND_EFFECT + card.bottomDamagePreview;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['sustain', 'dot', 'control'],
        convictionThreshold: 9,
        mercyChoice: 'spare',
        capitulationChoice: 'continue',
        // The outlast temperament commits the least blood the card allows.
        chooseX: (_s, _card, range) => range.min,
        strikeAddsAt: 1,
    },
    chaos: {
        id: 'chaos',
        name: 'Chaos',
        description: 'A seeded coin-flipper: uniform-random plays and signatures (blind) — the floor any deliberate status play must beat.',
        preferredFocus: 'balanced',
        rankCard: (_s, _card, rng) => rng(),
        signatureKinds: ALL_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'exploit',
        capitulationChoice: 'accept',
        rankSignature: (_s, _sig, rng) => rng(),
        // Seeded-uniform X across the whole legal range (inclusive).
        chooseX: (_s, _card, range, rng) => range.min + Math.floor(rng() * (range.max - range.min + 1)),
    },
    'mercy-seeker': {
        id: 'mercy-seeker',
        name: 'Mercy Seeker',
        description: 'The spare path: control status to survive, Befriend at the first opening, and always choose mercy over the kill.',
        preferredFocus: 'utility',
        rankCard: (s, card) => {
            if (card.verbClass === 'befriend') return BAND_BEFRIEND_LOW_HP;
            if (isControlClass(card)) {
                return (isNewStatus(s, card) ? BAND_PRIMARY : BAND_SECONDARY) + card.bottomDamagePreview;
            }
            if (card.verbClass === 'defend') return BAND_UTILITY_LIVE;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['mercy', 'control'],
        convictionThreshold: 6,
        mercyChoice: 'spare',
        capitulationChoice: 'accept',
    },
};

/** Canonical roster order for CLIs and reports. */
export const COMBAT_SIM_POLICY_ORDER: readonly CombatSimPolicyId[] = Object.freeze([
    'greedy', 'blind', 'dot-weaver', 'control-lock', 'aggro-brute', 'turtle', 'chaos', 'mercy-seeker',
]);

/** Looks up a policy by id (undefined when unknown). */
export function getSimPolicy(id: string): CombatSimPolicy | undefined {
    return (COMBAT_SIM_POLICIES as Record<string, CombatSimPolicy>)[id];
}

/** All policies in canonical roster order. */
export function listSimPolicies(): CombatSimPolicy[] {
    return COMBAT_SIM_POLICY_ORDER.map(id => COMBAT_SIM_POLICIES[id]);
}
