/**
 * The curated combat card library — Fate Engine P1 (spec 31 §4).
 *
 * TRIMMED 2026-07-05 from 88 cards to the 48 keepers below (owner call: lock in
 * a smaller set of genuinely distinct cards first, extend from there). Keeper
 * criteria: (1) every mechanic is engine-REAL post-P0-truth, (2) no two keepers
 * feel the same in play, (3) the card's philosophy matches what it does,
 * (4) stance x tier x verb coverage keeps presets/draft/rewards functional.
 *
 * Most Tier-2+ cards carry ONE die-interaction line (Fate Engine P1):
 *   threshold — Resonance tally >= N of a color fires a free rider
 *   dieBonus  — the powering die's color fires a rider
 *   fate      — the card may be POWERED BY AN X DIE for a printed twist
 *   die-manipulation mechanics — convert / bank / forge / ripen / refresh
 * Rider text is generated in real units (P0-truth law: printed == applied).
 *
 * Cut cards live in git history; their ids simply stop resolving (deck
 * projection drops unknown ids, so old saves degrade gracefully). Effect ids
 * the cut cards used are tagged `deprecated` in the effect libraries and are
 * BANNED here by `src/Effects/e2e/deprecated-effects.engine.test.ts`.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/skill.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';

const slipperySlope: Card = {
    id: 'slippery-slope',
    name: 'Slippery Slope',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One concession, then the next, then the avalanche you promised was ' +
        'inevitable. You name the catastrophe at the bottom of the hill until ' +
        'the ground itself seems to tilt, and they slide the whole way down.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    learningRequirement: { level: 14 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'damage', 'control'],
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 },
    ],
};

const braceForImpact: Card = {
    id: 'brace-for-impact',
    name: 'Brace for Impact',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You set your stance and meet the blow on your own terms — what is ' +
        'braced for cannot break you. The strike still comes; it simply finds ' +
        'a body that has already decided not to fall.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    learningRequirement: { level: 1 },
    addedIn: '2026-06-22',
    tags: ['defense', 'guard', 'early-game'],
};

const adHominemStrike: Card = {
    id: 'ad-hominem-strike',
    name: 'Ad Hominem Strike',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You don\'t refute the argument — you refute the arguer. The blow lands ' +
        'where their composure was, scattering whatever fragile certainty they ' +
        'had built. Their stance crumbles before their muscles do.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'strip_random_buff', appliedTo: 'enemy' }],
    combatEffects: [
        { effectId: 'debuff_vulnerability_body', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
};

const falseDilemma: Card = {
    id: 'false-dilemma',
    name: 'False Dilemma',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Two doors. Only two. Either-or, your fault, no third option — except ' +
        'every option is a door. The enemy hesitates between phantoms while you ' +
        'walk straight through.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
    dieBonus: { onColor: 'off', rider: { bonusDuration: 1 } }, // the wrong door, closed harder
};

const appealToPity: Card = {
    id: 'appeal-to-pity',
    name: 'Appeal to Pity',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You let the wound show. The argument was never the point — your pain ' +
        'is. Even your own body listens, and softens, and bends a little of ' +
        'itself back together.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    // heal = 0 + heart × 0.5 × 4  →  heart × 2 (per Spec 04b Q2-companion).
    scalingMultiplier: 4,
    combatEffects: [
        { effectId: 'buff_resolute', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
};

const achillesGambit: Card = {
    id: 'achilles-gambit',
    name: 'Achilles\' Gambit',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You commit to the strike that should never land — the runner who can ' +
        'never catch the tortoise, the heel that must be exposed. Paradox ' +
        'collapses into a single, unanswerable blow.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    fate: { rider: { chipHp: 4, bonusIntensity: 1 }, recoilHp: 2 }, // the impossible strike lands
};

const liarsEcho: Card = {
    id: 'liars-echo',
    name: 'Liar\'s Echo',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        '"This sentence is false." Their next thought catches on the loop, ' +
        'doubles back, and arrives more exposed than when it left. You read ' +
        'every tell twice.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
};

const shipOfTheseus: Card = {
    id: 'ship-of-theseus',
    name: 'Ship of Theseus',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'A plank of their resolve replaces a plank of yours. They are still ' +
        'themselves, technically; you are still yourself, technically. The ' +
        'borrowed buff settles around your shoulders.',
    tier: 1,
    targetType: 'enemy',
    basePower: 4,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'convert_die_color' }],
};

const hastyGeneralization: Card = {
    id: 'hasty-generalization',
    name: 'Hasty Generalization',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One blow becomes the whole truth of them. You strike once and treat ' +
        'the flinch as proof of everything — and so it becomes proof, the ' +
        'sample of one swelling to a verdict their whole body must answer for.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    learningRequirement: { level: 3 },
    addedIn: '2026-06-07',
    tags: ['status-effect', 'dot', 'early-game'],
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    threshold: { color: 'body', count: 2, rider: { bonusIntensity: 1 } },
};

const suspendJudgment: Card = {
    id: 'suspend-judgment',
    name: 'Suspend Judgment',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You withhold assent from the attack\'s premise — refuse to grant that ' +
        'it must land, and the conclusion loses its grip. The skeptic\'s shield ' +
        'is built from everything left unconceded.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'guard', amount: 12 }, { kind: 'bank_spent_die' }],
    learningRequirement: { level: 1 },
    addedIn: '2026-06-22',
    tags: ['defense', 'guard', 'early-game'],
};

const soothingWords: Card = {
    id: 'soothing-words',
    name: 'Soothing Words',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'Gentle words that calm tensions without requiring defensive posture.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    incrementsFriendship: 1,
    dieBonus: { onColor: 'heart', rider: { cleanse: 2 } },
};

const befriend: Card = {
    id: 'befriend',
    name: 'Befriend',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You extend genuine compassion toward your adversary, seeking understanding ' +
        'over victory. When successful, you must choose between mercy and exploitation ' +
        'of the vulnerable moment you have created.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'befriend_attempt' }],
};

const mobAppeal: Card = {
    id: 'mob-appeal',
    name: 'Mob Appeal',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The crowd already believes you. So does the part of you that needed ' +
        'convincing. A simultaneous blow and a small, dishonest reassurance — ' +
        'and both work.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'secondary_heal_self', stat: 'heart', multiplier: 1 }],
    learningRequirement: { level: 5 },
    threshold: { color: 'body', count: 3, rider: { chipHp: 6 } }, // the mob is the bodies you already spent
};

const undistributedMiddle: Card = {
    id: 'undistributed-middle',
    name: 'Undistributed Middle',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'All philosophers are mortal. You are mortal. Therefore you are a ' +
        'philosopher — and your enemy is illegible. You watch them try to ' +
        'follow the syllogism into a corner they cannot leave.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { bonusDuration: 1, drawCards: 1 } },
};

const eternalRegress: Card = {
    id: 'eternal-regress',
    name: 'Eternal Regress',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every answer they reach demands a previous answer; every previous ' +
        'answer demands one more. You watch their certainty unspool itself — ' +
        'and lay two distinct binds on the wreckage.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    learningRequirement: { level: 5 },
    combatEffects: [
        { effectId: 'debuff_unraveling', appliedTo: 'opponent', intensity: 2, duration: 5 },
    ],
    dieBonus: { onColor: 'mind', rider: { bonusIntensity: 1 } },
};

const resonanceBleed: Card = {
    id: 'resonance-bleed',
    name: 'Resonance Bleed',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'A heart-pitched lyric over the body\'s open wound. The bleeding ' +
        'finds the lyric and the lyric finds your enemy, and the two ' +
        'agree that it has further to go.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    learningRequirement: { level: 5 },
    synergy: {
        predicate: { effectId: 'debuff_bleed', on: 'target', durationMin: 2 },
        bonusDamage: 5,
        durationDamageMul: 3,
    },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
};

const batSwarmThoughtform: Card = {
    id: 'bat-swarm-thoughtform',
    name: 'Bat-Swarm Thoughtform',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Your defensive thorns lift off your skin in a heart-shape and ' +
        'become a swarm of small attentive things. They feed on the ' +
        'distance they remember as your edge.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    learningRequirement: { level: 5 },
    specialMechanics: [{ kind: 'create_temporary_die', color: 'heart' }],
    dieBonus: { onColor: 'match', rider: { conviction: 1 } },
};

const empatheticUnderstanding: Card = {
    id: 'empathetic-understanding',
    name: 'Empathetic Understanding',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description: 'Deep understanding that transcends conflict, building stronger bonds.',
    tier: 2,
    targetType: 'self', 
    basePower: 0,
    scalingStat: 'mind',
    incrementsFriendship: 2,
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    dieBonus: { onColor: 'heart', rider: { revealStance: true } },
};

const stoicReserve: Card = {
    id: 'stoic-reserve',
    name: 'Stoic Reserve',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'What is not in your power to prevent, you decline to be wounded by. ' +
        'You hold a reserve of stillness against the blow — it spends its force ' +
        'on a self that has agreed, in advance, to remain unmoved.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'guard', amount: 18 }, { kind: 'grant_pip', count: 1 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-06-22',
    tags: ['defense', 'guard', 'mid-game'],
};

const appealToAuthority: Card = {
    id: 'appeal-to-authority',
    name: 'Appeal to Authority',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You do not argue — you cite. A name they dare not contradict settles ' +
        'over the exchange, and their own thoughts begin to defer to a ' +
        'borrowed certainty that was never yours to lend.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 15 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'control', 'buff'],
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'buff_clarity', appliedTo: 'self' },
    ],
};

const tuQuoque: Card = {
    id: 'tu-quoque',
    name: 'Tu Quoque',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        '"And you?" You turn the accusation back on the accuser, and in the ' +
        'turning their guard turns with it. The mirror you raise reflects ' +
        'just enough of their own blow to mend the place it landed on you.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'secondary_heal_self', stat: 'heart', multiplier: 2 }],
    learningRequirement: { level: 15 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'damage', 'heal'],
    combatEffects: [
        { effectId: 'buff_brazen_thorns', appliedTo: 'self', intensity: 2, duration: 2 },
    ],
};

const baradoxsBarber: Card = {
    id: 'barbers-paradox',
    name: "Barber's Paradox",
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The barber who shaves all who do not shave themselves — does he shave ' +
        'himself? You hand them the question that has no consistent answer and ' +
        'watch the recursion eat the floor out from under their attention.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 16 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'control'],
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
    fate: { rider: { bonusIntensity: 1, bonusDuration: 1 } }, // the unresolvable question
};

const equivocationCascade: Card = {
    id: 'equivocation-cascade',
    name: 'Equivocation Cascade',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The same word, two meanings, slid against each other until the seam ' +
        'gives. By the time they notice the term has changed under them, the ' +
        'whole argument has reorganised itself around your conclusion.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    // debuff_doubt, not debuff_confusion — the synergy CONSUMES a matched
    // debuff_confusion, and a card's own combatEffects apply AFTER synergy
    // resolves, so seeding the same effectId here would immediately re-plant
    // the thing it just consumed.
    learningRequirement: { level: 16 },
    synergy: {
        predicate: { effectId: 'debuff_confusion', on: 'target', durationMin: 1 },
        bonusDamage: 6,
        durationDamageMul: 4,
        intensityDamageMul: 3,
        consumeMatched: true,
    },
    addedIn: '2026-06-07',
    tags: ['status-effect', 'synergy', 'control'],
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
    specialMechanics: [{ kind: 'convert_die_color' }],
};

const sunkCostMomentum: Card = {
    id: 'sunk-cost-momentum',
    name: 'Sunk Cost Momentum',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You have already given so much to this exchange — so you give more, ' +
        'and the giving becomes its own argument. Every token you have spent ' +
        'demands that the next blow justify them all at once.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    learningRequirement: { level: 17 },
    synergy: {
        // Unconditional on cast — pure resource-dump strategist payoff.
        bonusDamage: 10,
        resourceTokenDamageMul: 4,
        consumeAllResources: true,
    },
    addedIn: '2026-06-07',
    tags: ['status-effect', 'synergy', 'dot'],
};

const breach: Card = {
    id: 'breach',
    name: 'Breach',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You find the load-bearing premise and pull it. The whole defense does ' +
        'not fall — it simply opens, and stays open, and everything after lands ' +
        'where it hurts.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'vulnerable', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_vulnerable', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { bonusIntensity: 1 } },
};

const briarRiposte: Card = {
    id: 'briar-riposte',
    name: 'Briar Riposte',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You root yourself like a thorn bush and wait for the swing. When it ' +
        'comes you turn it aside and let the briar answer — measured, exact, ' +
        'and theirs to regret.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'riposte', damage: 8, reduce: 6 },
    ],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'riposte', 'defense', 'mid-game'],
    dieBonus: { onColor: 'body', rider: { guard: 3 } },
};

const leechingSyllogism: Card = {
    id: 'leeching-syllogism',
    name: 'Leeching Syllogism',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every step of the argument takes something from them and gives it to ' +
        'you. By the time the conclusion lands, their strength is already ' +
        'yours.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    // Siphon (HP-per-hit lifesteal) needed a nonzero flat strike to have anything
    // to skim from, which is the exact "strike" mechanic the doctrine forbids.
    // Reworked to the same lifesteal FEEL via a DoT + self-regen pairing instead:
    // the enemy bleeds out, you recover in step with it.
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'dot', 'sustain', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_hemorrhage', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
};

const theInevitable: Card = {
    id: 'the-inevitable',
    name: 'The Inevitable',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Conclusion is not inflicted — it is observed. You have read every ' +
        'effect to its endpoint, added them together, and delivered the sum ' +
        'as a single moment of clarity.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'amplify', multiplier: 2.0 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-06-29',
    tags: ['status-effect', 'amplify', 'dot', 'mid-game'],
    threshold: { color: 'mind', count: 5, rider: { tickAllDots: true } },
};

const mountingContradictions: Card = {
    id: 'mounting-contradictions',
    name: 'Mounting Contradictions',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You name every inconsistency at once and let them collide. The more ' +
        'ways they are already coming apart, the harder the whole edifice falls.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'compound', perDebuff: 6 }],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'compound', 'mid-game'],
};

const poisonedWell: Card = {
    id: 'poisoned-well',
    name: 'Poisoned Well',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You discredit the source before they can drink from it — and the ' +
        'poison you named becomes the poison that is actually there, ' +
        'spreading through everything they try next.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    learningRequirement: { level: 5 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'dot', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_septic', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
};

const gamblersFolly: Card = {
    id: 'gamblers-folly',
    name: "Gambler's Folly",
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The pattern owes you a correction — it must, surely, after so many ' +
        'blows that did not land right. You lean into the wager the odds ' +
        'never actually made, and the dice pool bends to your overconfidence.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'grant_permanent_wild_die', wildCount: 1, deadCount: 1 }],
    learningRequirement: { level: 5 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'wild-die', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_vulnerable', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
};

const movingTheGoalposts: Card = {
    id: 'moving-the-goalposts',
    name: 'Moving the Goalposts',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Every certainty they reach, you quietly relocate the finish line ' +
        'past it. Doubt and blindness both take root in the gap between ' +
        'where they are and where they were promised to be.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'control', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_doubt', appliedTo: 'opponent' },
        { effectId: 'debuff_overextended', appliedTo: 'opponent' },
    ],
};

const shipInABottle: Card = {
    id: 'ship-in-a-bottle',
    name: 'Ship-in-a-Bottle',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'How did it get in there, fully built, through a neck too narrow to ' +
        'admit it? They cannot stop turning the impossible object over, and ' +
        'the turning wears them thin.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'dot', 'control', 'mid-game'],
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2 },
    ],
    specialMechanics: [{ kind: 'bank_spent_die' }],
};

const resonanceDetonation: Card = {
    id: 'resonance-detonation',
    name: 'Resonance Detonation',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You spend the whole shape you brought into the fight — every ' +
        'token, every binding, every breath you were saving for after. ' +
        'The release is the answer; what was on the field is no longer ' +
        'on the field. Resetting the fight back to its first round in ' +
        'exchange for one apex truth.',
    tier: 2,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    learningRequirement: { level: 5 },
    specialMechanics: [{ kind: 'rupture' }],
};

const soritesCascade: Card = {
    id: 'sorites-cascade',
    name: 'Sorites\' Cascade',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A grain. Another grain. At what point did the heap of small wounds ' +
        'become a mortal one? They cannot say. The bleeding stacks faster than ' +
        'their definition of "alive."',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    learningRequirement: { level: 10 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 },
        { effectId: 'debuff_doubt', appliedTo: 'opponent' },
    ],
};

const bootstrapParadox: Card = {
    id: 'bootstrap-paradox',
    name: 'Bootstrap Paradox',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The healing comes from the version of you that survived. The version ' +
        'of you that survived came from this healing. The loop is whole; the ' +
        'wound, less so.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    // Fallback per spec out-of-scope note: until `RoundEvent` exposes a
    // round-damage total, the heal is a flat heart × 0.5 × 4 → heart × 2.
    scalingMultiplier: 4,
    learningRequirement: { level: 10 },
    combatEffects: [
        { effectId: 'debuff_novikov_consistency', appliedTo: 'opponent' },
    ],
    specialMechanics: [{ kind: 'refresh_die' }],
};

const appealToConsequences: Card = {
    id: 'appeal-to-consequences',
    name: 'Appeal to Consequences',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The outcome justifies the method, so the method becomes righteous. ' +
        'Your strike carries the weight of inevitable consequence — what must ' +
        'happen, happening. They fall not to your force, but to the logic that ' +
        'made the force necessary.',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    learningRequirement: {
        level: 10,
        // Fate Engine P1 trim: inherits the cut appeal-to-fear's scope gate so
        // alignment-gated learning keeps a live positive-axis witness.
        requiresAlignment: { axis: 'scope', op: 'gte', value: 34 },
    },
    combatEffects: [
        { effectId: 'debuff_fear', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    threshold: { color: 'body', count: 4, rider: { chipHp: 8 } }, // believe, or else
};

const nirvanaFallacy: Card = {
    id: 'nirvana-fallacy',
    name: 'Nirvana Fallacy',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Why settle for good when perfection exists somewhere? You show them ' +
        'the ideal they cannot reach, and suddenly their reality becomes failure. ' +
        'The gap between what is and what could be opens like a wound, and they ' +
        'fall through their own inadequacy.',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    // Phase 46 — only learnable by a sufficiently pessimistic character.
    // The skill expresses Schopenhauer / Underground Man metaphysics; a
    // hopeful caster wouldn't reach the contempt the wager requires.
    learningRequirement: {
        level: 10,
        requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 },
    },
    combatEffects: [
        { effectId: 'debuff_doubt', appliedTo: 'opponent' },
    ],
    threshold: { color: 'mind', count: 4, rider: { drawCards: 2 } },
};

const pascalsWager: Card = {
    id: 'pascals-wager',
    name: "Pascal's Wager",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You commit to the belief that costs nothing if you are wrong, and saves ' +
        'you if you are right. The certainty is its own balm; the wound closes ' +
        'around the wager.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    // Mirrors `bootstrap-paradox`: heart × 0.5 × 3 → heart × 1.5 healed.
    scalingMultiplier: 3,
    learningRequirement: { level: 10 },
    fate: { rider: { guard: 8, healHp: 4 } }, // infinite payoff, funded by nothing
};

const existentialCollapse: Card = {
    id: 'existential-collapse',
    name: 'Existential Collapse',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Why debate the nature of truth when truth itself is questionable? ' +
        'You dissolve the foundation beneath every position, every stance, every ' +
        'reason to resist. In the resulting void where meaning used to be, only ' +
        'your will finds purchase.',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    // No own combatEffects — `clearAllEffectsBothSides` below wipes every
    // ActiveEffect on both sides when the synergy fires, and a card's own
    // combatEffects apply AFTER synergy resolves, so anything added here would
    // survive the "everything cleared" invariant undoing the whole point of
    // the clear. This is a pure synergy-payoff card (classifies direct-damage).
    learningRequirement: { level: 10 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{
        kind: 'react', a: 'debuff_fear', b: 'debuff_confusion', minIntensity: 1,
        burstPerIntensity: 4,
        product: { effectId: 'debuff_stagger', intensity: 1, duration: 1 },
    }],
};

const achillesOvertake: Card = {
    id: 'achilles-overtake',
    name: "Achilles' Overtake",
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The tortoise never should have been catchable — yet every stride ' +
        'you gained on them compounds, and the gap that logic insisted was ' +
        'unclosable closes all at once.',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'debuff_slow', appliedTo: 'opponent', duration: 2 },
    ],
    specialMechanics: [{ kind: 'execute', hpPct: 0.3, dotStacks: 2 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'execute', 'late-game'],
};

const eternalRecurrence: Card = {
    id: 'eternal-recurrence',
    name: 'Eternal Recurrence',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Live this moment so that you could will it again, and again, forever. ' +
        'You take the wound as something you have already chosen a thousand ' +
        'times, and the choosing knits it shut with the weight of all those lives.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    scalingMultiplier: 6,
    learningRequirement: { level: 42, statRequirementType: 'heart', statRequirementValue: 32 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'defensive', 'heal', 'buff'],
    combatEffects: [
        { effectId: 'buff_regeneration', appliedTo: 'self', intensity: 2, duration: 4 },
    ],
    dieBonus: { onColor: 'heart', rider: { drawCards: 1 } }, // it recurs
};

const apophaticAegis: Card = {
    id: 'apophatic-aegis',
    name: 'Apophatic Aegis',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You define your defence only by what it is not — not a wall, not a ' +
        'guard, not a refusal — until the via negativa leaves nothing for the ' +
        'blow to find. What cannot be named cannot be struck.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    scalingMultiplier: 4,
    learningRequirement: { level: 40, statRequirementType: 'heart', statRequirementValue: 30 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'defensive', 'buff', 'heal'],
    combatEffects: [
        { effectId: 'buff_resolute', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'barrier', amount: 6 }],
};

const transcendentSynthesis: Card = {
    id: 'transcendent-synthesis',
    name: 'Transcendent Synthesis',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You weave every thread of certainty on the field into a new ' +
        'pattern that transcends its components. The synthesis heals what ' +
        'the analysis wounded; the whole exceeds its parts.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    scalingMultiplier: 4,
    learningRequirement: { level: 10 },
    synergy: {
        // No predicate — unconditional synthesis on cast
        bonusDamage: 15,
        resourceTokenDamageMul: 6,
        consumeAllResources: true,
        applyEffectOnFire: {
            effectId: 'buff_regeneration',
            appliedTo: 'self',
            intensity: 3,
            duration: 4,
        },
    },
    fate: { rider: { conviction: 2, healHp: 2 } }, // synthesis of the dead faces
};

const existentialDebt: Card = {
    id: 'existential-debt',
    name: 'Existential Debt',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every choice they did not make is a debt you collect on now — and ' +
        'the collecting costs you something too, a small overextension you ' +
        'accept as the price of the reckoning.',
    tier: 3,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'heart',
    learningRequirement: { level: 10 },
    addedIn: '2026-07-03',
    tags: ['status-effect', 'dot', 'control', 'late-game'],
    combatEffects: [
        { effectId: 'debuff_despair', appliedTo: 'opponent', intensity: 3, duration: 4 },
        { effectId: 'debuff_isolated', appliedTo: 'opponent', duration: 3 },
    ],
};

const pyrrhicVictory: Card = {
    id: 'pyrrhic-victory',
    name: 'Pyrrhic Victory',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Another such victory and you are undone — yet you take it anyway, and ' +
        'make them pay the same ruinous price. The wound you open in them will ' +
        'go on bleeding long after the field is yours.',
    tier: 3,
    targetType: 'enemy',
    basePower: 16,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 5 },
    ],
    // EXECUTE — a finisher (HP behavior in combat.engine): when the foe is at/below
    // 30% HP OR carries >= 3 distinct DoT effects, deal a large (typically lethal)
    // hit with 10% self-recoil (the Pyrrhic price); otherwise the normal strike +
    // bleed. Synergizes with the low-HP Befriend/mercy window. Keeps its bleed, so
    // the card still reads as a DoT card.
    specialMechanics: [
        { kind: 'execute', hpPct: 0.3, dotStacks: 3, recoilPct: 0.1 },
    ],
    learningRequirement: { level: 12 },
    addedIn: '2026-06-22',
    tags: ['gold', 'rare'],
};

const theFinalWord: Card = {
    id: 'the-final-word',
    name: 'The Final Word',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You speak the sentence that ends the argument — and seeps into the one ' +
        'who heard it. Doubt is a slow poison; once the premise is conceded, the ' +
        'conclusion finishes them on its own schedule.',
    tier: 3,
    targetType: 'enemy',
    basePower: 14,
    scalingStat: 'mind',
    learningRequirement: { level: 12 },
    addedIn: '2026-06-22',
    tags: ['gold', 'rare'],
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 5 },
    ],
    threshold: { color: 'mind', count: 5, rider: { bonusIntensity: 2 } }, // the final word must be final
};

const unmovedMover: Card = {
    id: 'unmoved-mover',
    name: 'The Unmoved Mover',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The first cause that is itself uncaused — you move them without being ' +
        'moved. They lose the thread of their own intent, turning in confusion ' +
        'around a center that will not turn.',
    tier: 3,
    targetType: 'enemy',
    basePower: 12,
    scalingStat: 'heart',
    learningRequirement: { level: 12 },
    addedIn: '2026-06-22',
    tags: ['gold', 'rare'],
    combatEffects: [
        { effectId: 'debuff_stagger', appliedTo: 'opponent', duration: 1 },
    ],
    specialMechanics: [{ kind: 'grant_pip', count: 1 }],
};

const peacefulGesture: Card = {
    id: 'peaceful-gesture',
    name: 'Peaceful Gesture',
    category: 'fallacy', 
    philosophicalAspect: 'body',
    description: 'A calming physical gesture that builds trust through non-threatening movement.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    incrementsFriendship: 1,
};

export const cardLibrary: Card[] = [
    slipperySlope, braceForImpact, adHominemStrike, falseDilemma, appealToPity, achillesGambit, liarsEcho, shipOfTheseus, hastyGeneralization, suspendJudgment, soothingWords, befriend, mobAppeal, undistributedMiddle, eternalRegress, resonanceBleed, batSwarmThoughtform, empatheticUnderstanding, stoicReserve, appealToAuthority, tuQuoque, baradoxsBarber, equivocationCascade, sunkCostMomentum, breach, briarRiposte, leechingSyllogism, theInevitable, mountingContradictions, poisonedWell, gamblersFolly, movingTheGoalposts, shipInABottle, resonanceDetonation, soritesCascade, bootstrapParadox, appealToConsequences, nirvanaFallacy, pascalsWager, existentialCollapse, achillesOvertake, eternalRecurrence, apophaticAegis, transcendentSynthesis, existentialDebt, pyrrhicVictory, theFinalWord, unmovedMover, peacefulGesture,
];

const skillRegistry: ReadonlyMap<string, Card> = new Map(
    cardLibrary.map(skill => [skill.id, skill]),
);

// Sandbox wiring — gives the (import-cycle-free) sandbox registry a base-card
// lookup for collision checks and override merging.
bindSandboxLibraryGuard(id => skillRegistry.get(id));

/**
 * O(1) lookup by skill ID. Returns `undefined` if no skill matches — callers
 * must handle that (the combat resolver emits a `skill-blocked` event with
 * `reason: 'unknown-skill'` rather than throwing).
 *
 * Sandbox-aware: experimental cards / overrides registered via
 * `cards.sandbox.ts` take precedence (a no-op O(1) check when the sandbox is
 * empty, i.e. in all normal play).
 */
export function getCardById(id: string): Card | undefined {
    return getSandboxCard(id) ?? skillRegistry.get(id);
}
