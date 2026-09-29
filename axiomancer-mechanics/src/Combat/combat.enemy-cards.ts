/**
 * THE ENEMY CARD LIBRARY.
 *
 * The enemy uses cards too. Every foe fights as an ordered DECK of enemy
 * cards (`combat.enemy-decks.ts`); each card compiles to one telegraphed
 * threat phase, so the Hazard-Pattern resolution machinery (stances, rungs,
 * the escalation clock, branches, the coveted die) reads the card as its
 * authored intent. The telegraph reads as the enemy PLAYING a named card.
 *
 * Since the enemy roster reset (revamp phase R2) the library holds only the
 * 14 cards the three live foes play — Float-Eye, the Brine Hag and the
 * Doorwarden. Every card deals plain damage: no card carries a debuff
 * (`effectId`/`intensity`), a counterplay rider (`swayCleanse`/`premiseShed`)
 * or a curse (`curseCardId`). The payload fields stay on the types because
 * the resolver still reads them; nothing in the library sets them.
 *
 * `threatDamageBudget` is round((6 + 0.8·level) · DIFFICULTY_MULT ·
 * (1 + 0.2·phaseIndex) · damageWeight); weights sit in the bands
 *
 *   common 0.8-1.0 · escalation 1.0-1.3 · signature 1.3-1.6
 *
 * and a deck's later cards carry the heavier weights. `actionText` never
 * hardcodes the damage number (it is level-dependent and appended by
 * `buildThreatAction`).
 */

import type { Stance } from './types';
import type { ThreatBranchCondition } from './combat.encounter.types';

/** The enemy card archetypes (a label only; the live library uses two). */
export type EnemyArchetype =
    | 'drowned-parish' | 'gnawing-court' | 'omen-choir' | 'bone-clergy'
    | 'debt-office' | 'old-fires' | 'the-aporia';

/** Card grade inside an archetype's library. */
export type EnemyCardGrade = 'common' | 'escalation' | 'signature';

/** One fork face of a BRANCH enemy card (a subset of the card payload). */
export interface EnemyCardFace {
    stance: Stance;
    damageWeight?: number;
    effectId?: string;
    intensity?: number;
    /** Escalation / counterplay riders a fork may carry (same semantics as
     *  the card's own fields). */
    enemyHeal?: number;
    enemyCleanse?: number;
    swayCleanse?: number;
    premiseShed?: number;
    curseCardId?: string;
    actionText: string;
    stanceHint: string;
}

/**
 * An enemy card — one telegraphed threat phase's worth of authored intent.
 * `actionText` prints WITHOUT the damage number (the resolver appends it);
 * `stanceHint` implies but never names the stance.
 */
export interface EnemyCard {
    name: string;
    archetype: EnemyArchetype;
    grade: EnemyCardGrade;
    stance: Stance;
    /** Threat damage as a multiple of the level/difficulty budget (default 1). */
    damageWeight?: number;
    /** Debuff landed on the player when the threat fires. */
    effectId?: string;
    intensity?: number;
    /** Escalation / counterplay riders (same semantics as AuthoredThreatPhase). */
    enemyHeal?: number;
    enemyCleanse?: number;
    swayCleanse?: number;
    premiseShed?: number;
    /** Variable-rung telegraph sizing (1-4). */
    rungs?: number;
    /** THE COVETED DIE — legal only on the SECOND card of a boss/unique deck. */
    stake?: boolean;
    /** Locked until this round (escalation cards). */
    unlockAfterRound?: number;
    /** CURSE INJECTION — shuffles this curse into the player's combat deck. */
    curseCardId?: string;
    /** A branch card: the condition commits one of two faces at phase start. */
    branch?: { condition: ThreatBranchCondition; then: EnemyCardFace; else: EnemyCardFace };
    actionText: string;
    stanceHint: string;
}

export const ENEMY_CARD_LIBRARY: Record<string, EnemyCard> = {
    'dp-first-bell': {
        name: 'The First Bell',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.8,
        actionText: 'The bell counts one, and the one it counts is you',
        stanceHint: 'It takes attendance the way a sexton does — patiently, and for the record.',
    },
    'dp-undertow-grip': {
        name: 'Undertow',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.95,
        actionText: 'The undertow takes your ankles in both cold hands and scrapes two long stripes off the shins',
        stanceHint: 'No malice in it — only the sea\'s old habit of keeping what it holds.',
    },
    'dp-wet-congregation': {
        name: 'The Wet Congregation',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        actionText: 'The drowned congregation sings your mercy back into its pews',
        stanceHint: 'They have heard kinder sermons than yours, and drowned anyway.',
    },
    'dp-drowning-drill': {
        name: 'The Drowning Drill',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.15,
        actionText: 'The drowned run the old rescue drill on you thoroughly, and you come up open in three places',
        stanceHint: 'Every motion is practiced, dutiful, and aimed at the bottom.',
    },
    'dp-breaking-sea': {
        name: 'The Breaking Sea',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        rungs: 3,
        actionText: 'The sea breaks over the whole argument at once and drags you three times across the shingle',
        stanceHint: 'Past patience, past liturgy — the water throws its entire opinion at the matter.',
    },
    'dp-lead-bell': {
        name: 'A Bell Sewn Under the Hem',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        actionText: 'Cold fingers sew a small lead bell into the hem of your coat, and it begins, quietly, to ring',
        stanceHint: 'The stitching is small, deliberate work — somewhere a ledger gains a line with your name on it.',
    },
    'litany-of-thresholds': {
        name: 'Litany of Thresholds',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.3,
        actionText: 'The Doorwarden lays a threshold under your feet; it declines to be crossed, and takes the four steps you had left',
        stanceHint: 'He worships thresholds; where you would step, a doctrine has already been installed.',
    },
    'the-door-kept-open': {
        name: 'The Door You Kept Open',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        stake: true,
        actionText: 'He closes a door you were keeping open in your head, and the four rooms behind it go dark with you inside',
        stanceHint: 'Every door that ever shut is remembered in him, and he consults the memory alphabetically.',
    },
    'the-bronze-frame': {
        name: 'The Bronze Frame, Swung',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        actionText: 'The bronze frame swings through you like a door through a draught and marks four hinges of you',
        stanceHint: 'Sermon concluded, the hinge-priest recalls that he is mostly hinge.',
    },
    'what-shuts-stays-shut': {
        name: 'What Shuts, Stays Shut',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        actionText: 'Every door he remembers shuts at once and you are the room — six bolts, all of them yours',
        stanceHint: 'The liturgy reaches its one commandment: what shuts, stays shut.',
    },
    'dp-vespers-under-water': {
        name: 'Vespers, Under Water',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        actionText: 'Vespers is sung to you underwater, three verses of it, and the water keeps time inside your lungs',
        stanceHint: 'The choir stopped needing air a long while ago, and is patient about the fact that you have not.',
    },
    'ap-the-proof-completed': {
        name: 'The Proof, Completed',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        rungs: 4,
        actionText: 'It completes the proof it began when you walked in; the conclusion is six lines long and every line is about you',
        stanceHint: 'Every move you made was a lemma. It has been grateful the entire time.',
    },
    'ap-the-question-that-eats': {
        name: 'The Question That Eats',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.4,
        actionText: 'It asks the one question you have walked around your whole life, and five parts of the answer begin to rot',
        stanceHint: 'It is not cruel about it. It is only, finally, unbearably direct.',
    },
    'ap-the-margin-note': {
        name: 'The Margin Note',
        archetype: 'the-aporia',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.15,
        actionText: 'It writes four words in the margin of you and files the page among the cards in your hand',
        stanceHint: 'The correction is small, legible, and permanent.',
    },
};
/** All enemy card ids (stable object order). */
export const ENEMY_CARD_IDS: readonly string[] = Object.freeze(Object.keys(ENEMY_CARD_LIBRARY));
/** O(1) lookup (undefined for unknown ids). */
export function getEnemyCardById(id: string): EnemyCard | undefined {
    return ENEMY_CARD_LIBRARY[id];
}
