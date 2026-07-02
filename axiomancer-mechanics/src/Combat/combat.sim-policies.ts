/**
 * Combat sim policies — the playtest roster of scripted witnesses.
 *
 * A `CombatSimPolicy` bundles every decision seam of the encounter sim
 * (`combat.encounter.sim.ts`): how to rank candidate powered plays, which
 * Signature Skills to fund, when to spend Conviction, whether to peek at the
 * hidden enemy stance, and how a mercy choice resolves. The sim driver stays
 * one loop; the policies make it a matrix.
 *
 * Doctrine (CLAUDE.md): status effects are the MAIN fun — HP is the sole win
 * condition and status is the EFFICIENT way to drop it. The roster is built to
 * witness that: `dot-weaver` and `control-lock` play the doctrinal game,
 * `aggro-brute` is the deliberately weak basic-attack baseline (its
 * underperformance IS the design), and `greedy`/`blind` remain the tuned
 * balance witnesses with bit-identical behavior to the pre-roster sim.
 *
 * Behavior guarantee: `greedy` and `blind` encode EXACTLY the legacy
 * `bestCard`/`bestSignature` ordering as a per-card score (payoff cards at
 * DoT/debuff thresholds, Befriend-at-lowHp, new-status-first,
 * status-over-strike, damage preview) — the balance-sim oracle
 * (`hazard-pattern-combat.balance.sim.test.ts`) passes unmodified. Their
 * `rankCard` never consumes rng, so the seeded engine stream is untouched.
 */

import { getCardById } from '../Cards/cards.library';
import type {
    CombatCard, CombatEncounterState, SignatureSkill, SignatureSkillKind,
} from './combat.encounter.types';
import type { CombatDeckFocus } from './combat.deck-presets';
import { getPendingDotTotal, getDistinctDebuffCount } from './effects';

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
    /** True = drafts off only REVEALED stances (player-feel); false = omniscient. */
    blind: boolean;
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
     * OPTIONAL (extension beyond the base contract): rank affordable signatures;
     * highest wins. When absent the sim takes the FIRST affordable signature in
     * `state.signatures` order whose kind is in `signatureKinds` — the legacy
     * behavior `greedy`/`blind` rely on. Only `chaos` uses this (random pick).
     */
    rankSignature?(state: CombatEncounterState, signature: SignatureSkill, rng: () => number): number;
}

// ─── Score bands ─────────────────────────────────────────────────────────────
// Additive bands keep the per-card score a faithful encoding of a lexicographic
// sort: each band dwarfs everything below it (bottomDamagePreview stays well
// under BAND_EFFECT). Payoff picks return a FLAT band value so ties between two
// payoff cards resolve by hand order — exactly like the legacy `cards.find`.
const BAND_PAYOFF_RUPTURE = 3e15;
const BAND_PAYOFF_AMPLIFY = 2e15;
const BAND_PAYOFF_COMPOUND = 1e15;
const BAND_BEFRIEND_LOW_HP = 1e12;
const BAND_PRIMARY = 2e8;
const BAND_SECONDARY = 1e7;
const BAND_NEW_STATUS = 1e8;
const BAND_EFFECT = 1e4;
const BAND_UTILITY_LIVE = 1e6;

/** Legacy payoff thresholds (mirrors the pre-roster `bestCard` preamble). */
const RUPTURE_PENDING_DOT_AT = 12;
const AMPLIFY_PENDING_DOT_AT = 8;
const COMPOUND_DISTINCT_AT = 2;
/** Legacy low-HP gate for the Befriend/mercy turn. */
const LOW_HP_FRACTION = 0.30;

/** The special-mechanic kinds a card's backing skill carries (0.34.0 payoffs). */
function cardMechKinds(card: CombatCard): Set<string> {
    const skill = card.skillId ? getCardById(card.skillId) : undefined;
    return new Set((skill?.specialMechanics ?? []).map(m => m.kind));
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
        if (kinds.has('amplify') && pendingDot >= AMPLIFY_PENDING_DOT_AT) return BAND_PAYOFF_AMPLIFY;
        if (kinds.has('compound') && getDistinctDebuffCount(s.enemy) >= COMPOUND_DISTINCT_AT) return BAND_PAYOFF_COMPOUND;
    }
    let score = card.bottomDamagePreview;
    if (enemyLowHp(s) && card.verbClass === 'befriend') score += BAND_BEFRIEND_LOW_HP;
    if (isNewStatus(s, card)) score += BAND_NEW_STATUS;
    if (card.effectKind !== 'none') score += BAND_EFFECT;
    return score;
}

/** The legacy signature preference list (order-insensitive membership check). */
const LEGACY_SIGNATURE_KINDS: readonly SignatureSkillKind[] =
    Object.freeze(['dot', 'strike', 'control', 'mercy', 'conclude']);

const ALL_SIGNATURE_KINDS: readonly SignatureSkillKind[] = Object.freeze([
    'scout', 'reroll', 'sustain', 'control', 'dot', 'mercy', 'strike', 'conclude', 'draw',
]);

/** The scripted witness roster. */
export const COMBAT_SIM_POLICIES: Record<CombatSimPolicyId, CombatSimPolicy> = {
    greedy: {
        id: 'greedy',
        name: 'Greedy (omniscient witness)',
        description: 'The tuned balance ceiling: plays the status game with a hidden-stance peek — new DoTs first, payoffs on time, strikes last.',
        blind: false,
        preferredFocus: 'balanced',
        rankCard: (s, card) => greedyRankCard(s, card),
        signatureKinds: LEGACY_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'spare',
    },
    blind: {
        id: 'blind',
        name: 'Blind (player-feel witness)',
        description: 'The same status-first play as greedy, drafting off only REVEALED stances — the difficulty a real player feels.',
        blind: true,
        preferredFocus: 'balanced',
        rankCard: (s, card) => greedyRankCard(s, card),
        signatureKinds: LEGACY_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'spare',
    },
    'dot-weaver': {
        id: 'dot-weaver',
        name: 'DoT Weaver',
        description: 'All-in on erosion: fresh DoTs and rupture/amplify payoffs above all; utility only once the foe is already bleeding.',
        blind: false,
        preferredFocus: 'dot',
        rankCard: (s, card) => {
            const kinds = cardMechKinds(card);
            const pendingDot = getPendingDotTotal(s.enemy).total;
            if (kinds.has('rupture') && pendingDot >= RUPTURE_PENDING_DOT_AT) return BAND_PAYOFF_RUPTURE;
            if (kinds.has('amplify') && pendingDot >= AMPLIFY_PENDING_DOT_AT) return BAND_PAYOFF_AMPLIFY;
            if (card.verbClass === 'direct-dot') {
                return (isNewStatus(s, card) ? BAND_PRIMARY : BAND_SECONDARY) + card.bottomDamagePreview;
            }
            // Utility only when the enemy already carries a ticking DoT.
            if (isUtilityClass(card)) return pendingDot > 0 ? BAND_UTILITY_LIVE : 1;
            if (card.effectKind !== 'none') return BAND_EFFECT + card.bottomDamagePreview;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['dot', 'strike', 'conclude'],
        convictionThreshold: 7,
        mercyChoice: 'exploit',
    },
    'control-lock': {
        id: 'control-lock',
        name: 'Control Lock',
        description: 'Denial play: control and stat-debuff locks first (fresh ones for the combo), aiming to erase the enemy\'s telegraphed turns.',
        blind: false,
        preferredFocus: 'control',
        rankCard: (s, card) => {
            if (isControlClass(card)) {
                return (isNewStatus(s, card) ? BAND_PRIMARY : BAND_SECONDARY) + card.bottomDamagePreview;
            }
            if (card.verbClass === 'direct-dot') return BAND_EFFECT * 10 + card.bottomDamagePreview;
            if (card.verbClass === 'defend') return BAND_EFFECT;
            return 100 + card.bottomDamagePreview;
        },
        signatureKinds: ['control', 'dot'],
        convictionThreshold: 8,
        mercyChoice: 'spare',
    },
    'aggro-brute': {
        id: 'aggro-brute',
        name: 'Aggro Brute',
        description: 'The doctrine\'s weak baseline: raw damage preview, no payoff timing, no status game — its underperformance IS the design.',
        blind: false,
        preferredFocus: 'damage',
        rankCard: (_s, card) => card.bottomDamagePreview,
        signatureKinds: ['strike', 'conclude'],
        convictionThreshold: 7,
        mercyChoice: 'exploit',
    },
    turtle: {
        id: 'turtle',
        name: 'Turtle',
        description: 'Outlast play: guard/barrier walls first, DoT erosion second — status still does the killing, just from behind a shield.',
        blind: false,
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
    },
    chaos: {
        id: 'chaos',
        name: 'Chaos',
        description: 'A seeded coin-flipper: uniform-random plays and signatures (blind) — the floor any deliberate status play must beat.',
        blind: true,
        preferredFocus: 'balanced',
        rankCard: (_s, _card, rng) => rng(),
        signatureKinds: ALL_SIGNATURE_KINDS,
        convictionThreshold: 7,
        mercyChoice: 'exploit',
        rankSignature: (_s, _sig, rng) => rng(),
    },
    'mercy-seeker': {
        id: 'mercy-seeker',
        name: 'Mercy Seeker',
        description: 'The spare path: control status to survive, Befriend at the first opening, and always choose mercy over the kill.',
        blind: false,
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
