/**
 * TEMPORARY tempo-wall fix cards — a sandbox-only A/B experiment.
 *
 * The ladder-erosion measurement (scratch/price-experiment/out/ladder-erosion.json)
 * shows the LATE stage is a SURVIVAL/TEMPO wall, not a price wall: from the 0.5×
 * price tier up to the 4× tier, LATE win-rate crawls 0.04 → 0.12 while the player
 * spends 4-11× more points per card. The cause is timing — LATE `avgRoundsAll`
 * is ~4.06 (the player dies in ~4 rounds) but `avgRoundsToVictory` is ~5.8, and
 * `dotHpFraction` sinks from 0.55 (early) to ~0.42 (late): the erosion deck's
 * poison RAMPS over ~6 rounds (POISON i1 d4 ticks 2,2,3,3 …) and simply never
 * gets to cash in before the player is dead. More price buys bigger slow DoTs;
 * it does not buy the rounds needed to collect them.
 *
 * These four cards attack the wall on THREE different axes so a follow-up ladder
 * run can see which axis actually converts price → LATE win-rate:
 *   (a) FRONT-LOADED burst — pay NOW, not over 6 rounds  (tmp-cataract-burst)
 *   (b) FASTER payoff — a short high-intensity DoT + tick-forcing
 *       (tmp-hemorrhage, tmp-quicken-the-wound)
 *   (c) SURVIVAL/tempo — buy the rounds the DoTs need  (tmp-bulwark-stagger)
 *
 * Pricing follows the cards.pricing.ts point table (VERB_POINTS / scoreMechanic /
 * scoreRider). Each card ships its arithmetic in a `// pts` comment and lands in
 * its printed rank's band (Doxa/Lemma 1.5-7.5 · Thesis/Theorem 4.5-13 · Axiom
 * 7-19). Transpile-only friendly: types-only import, plain literals.
 */

import type { Card } from '../../../src/Cards/types';
import { registerSandboxCards } from '../../../src/Cards/cards.sandbox';
import { buildPresetDeck } from '../../../src/Combat/combat.starter-deck-presets';

export const label = 'tempo-wall-fixes (front-load / faster-payoff / survival)';

// ── (a) FRONT-LOADED BURST ──────────────────────────────────────────────────
// The erosion finisher (resonance-detonation) is rank-5 and 1-copy — its RUPTURE
// arrives too late and too rarely. This is a cheaper, MORE ACCESSIBLE detonator:
// consume the board's pending DoT fuel NOW (instead of waiting the ~6 rounds it
// would take to tick out) with +75% force. Pays the instant a wound exists.
const cataractBurst: Card = {
    id: 'tmp-cataract-burst',
    theme: 'affliction',
    name: 'Cataract Burst',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The dam of every slow argument gives at once. What would have seeped ' +
        'out over an hour arrives in a single breaking wave.',
    tier: 3, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE every affliction on the foe with 75% more force.',
    // pts: RUPTURE = 4 (verb) + 8 (expected fuel) + bonusPct 0.75 ÷ 25 (0.03)
    //      = 12.03  +  FREE MARK i1 d1 (0.75) = 12.78 → Theorem [4.5-13]
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'rupture', bonusPct: 0.75 }],
    addedIn: 'tmp-tempo-experiment',
    tags: ['affliction', 'payoff', 'front-load', 'tmp'],
};

// ── (b) FASTER PAYOFF — short, high-intensity, FRONT-LOADED DoT ──────────────
// BLEED runs on the damage-instance clock (2 ticks/round) and DECAYS per tick,
// so its whole lifetime lands in the first ~2 rounds — the opposite of the deck's
// ramping POISON. High intensity, short fuse: real HP inside the ~4-round window
// the player actually survives. FREE TICK cashes the strongest wound immediately.
const hemorrhage: Card = {
    id: 'tmp-hemorrhage',
    theme: 'affliction',
    name: 'Hemorrhage',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Not a slow poison — a wound that empties the argument fast, all its ' +
        'cost paid up front while there is still a fight to pay it in.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with BLEED 4 for 2 turns, then TICK the strongest wound now.',
    // pts: BLEED i4 d2 lifetime = 12+9+6+3 = 30 HP ÷ 3 (dotLifetimeDivisor) = 10
    //      + FREE TICK one DoT now (0.6) = 10.6 → Theorem [4.5-13]
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 4, duration: 2 }],
    addedIn: 'tmp-tempo-experiment',
    tags: ['affliction', 'dot', 'front-load', 'tmp'],
};

// ── (b) FASTER PAYOFF — the TICK-forcer ─────────────────────────────────────
// Turns the deck's OWN slow board into immediate HP: +1 intensity to every DoT,
// then tick them all NOW. Collapses the ramp-and-wait pattern into one turn —
// the answer to "the poison never pays before I die".
const quickenTheWound: Card = {
    id: 'tmp-quicken-the-wound',
    theme: 'affliction',
    name: 'Quicken the Wound',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every festering point you planted, made to answer at once. The slow ' +
        'argument does not get its slow hour.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'BOOST every DoT on the foe by 1, then TICK them all now.',
    // pts: BOOST ALL DOTS i1 = 1 × 5 (boostAllDotsPerIntensity) = 5
    //      + TICK ALL DOTS rider (1.5) = 6.5 paid
    //      + FREE MARK i1 d1 (0.75) = 7.25 → Thesis [4.5-13]
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'boost_all_dots', intensity: 1 },
        { kind: 'rider', rider: { tickAllDots: true } },
    ],
    addedIn: 'tmp-tempo-experiment',
    tags: ['affliction', 'glue', 'faster-payoff', 'tmp'],
};

// ── (c) SURVIVAL / TEMPO — buy the rounds the DoTs need ──────────────────────
// The wall is round-count: die at ~4, win at ~5.8. This buys the gap with a
// STACKING persistent BARRIER (soaks across rounds, unlike fading GUARD) plus a
// full 2-rung STAGGER that denies the enemy's next telegraphed blow outright —
// a whole enemy action skipped is a whole round the ramp gets to keep ticking.
const bulwarkStagger: Card = {
    id: 'tmp-bulwark-stagger',
    theme: 'bulwark',
    name: 'Hold the Line',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You do not answer the blow. You make sure it never arrives, and buy ' +
        'the wounds you already dealt the time to finish their work.',
    tier: 3, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: "Gain BARRIER 12, then STAGGER the enemy's next action by 2 rungs.",
    // pts: BARRIER 12 × 1/3 (barrierPerHp) = 4  +  STAGGER 2 rungs × 2 = 4 = 8 paid
    //      + FREE persistent BARRIER 3 × 1/3 (1.0) = 9.0 → Theorem [4.5-13]
    free: { barrier: 3 },
    specialMechanics: [
        { kind: 'barrier', amount: 12 },
        { kind: 'stagger', rungs: 2 },
    ],
    addedIn: 'tmp-tempo-experiment',
    tags: ['bulwark', 'control', 'survival', 'tmp'],
};

const FIX_CARDS: readonly Card[] = [
    cataractBurst,
    hemorrhage,
    quickenTheWound,
    bulwarkStagger,
];

/** Registers the four temporary fix cards into the sandbox registry. */
export function register(): void {
    registerSandboxCards([...FIX_CARDS]);
}

/**
 * A 15-card LATE-stage test deck: erosion with its 5 weakest slow-payoff cards
 * swapped for the tempo-wall fixes, holding the 5/5/5 body/mind/heart Color Law.
 *
 * Removed (the ramp-and-wait victims): 2× slippery-slope (POISON i1 d4, pure
 * slow ramp), 1× opening-statement, 2× currys-conversion (glue with nothing
 * fast to convert). Added: tmp-hemorrhage + tmp-bulwark-stagger (body),
 * tmp-cataract-burst (heart), tmp-quicken-the-wound ×2 (mind).
 *
 * Resulting colors — body: slippery×2 + venom-and-vein + hemorrhage +
 * hold-the-line = 5 · heart: opening-statement×3 + resonance-detonation +
 * cataract-burst = 5 · mind: festering-argument×2 + suppurating-curse +
 * quicken-the-wound×2 = 5.
 */
export function deck(): string[] {
    const base = buildPresetDeck('erosion');
    // How many copies of each id to drop from the base recipe.
    const removeBudget: Record<string, number> = {
        'slippery-slope': 2,
        'opening-statement': 1,
        'currys-conversion': 2,
    };
    const out: string[] = [];
    for (const id of base) {
        if (removeBudget[id] && removeBudget[id] > 0) {
            removeBudget[id] -= 1;
            continue;
        }
        out.push(id);
    }
    out.push(
        'tmp-hemorrhage',
        'tmp-bulwark-stagger',
        'tmp-cataract-burst',
        'tmp-quicken-the-wound',
        'tmp-quicken-the-wound',
    );
    return out;
}
