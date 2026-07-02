/**
 * Early-game skill library (Spec 04b).
 *
 * Twelve skills covering every philosophical-aspect × category × tier cell
 * the Spec 04 economy can produce in the opening hours of the game:
 *   - Tier 1 (6): single-stance cost, generates 1 philosophical token of
 *     the skill's own category.
 *   - Tier 2 (3): multi-key resonance cost, generates 1 token of category.
 *   - Tier 3 (3): philosophical-resource gated, generates 1 token of the
 *     OPPOSING category (Fallacy ↔ Paradox) to keep skill chains flowing in
 *     the late combat.
 *
 * Card IDs follow kebab-case per `specs/04b-skills-library-and-e2e.md` Q1
 * (effect IDs in the library use snake_case; skills use kebab-case so the
 * two namespaces stay visually distinct).
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/skill.engine.ts` and is driven by the discriminated unions
 * declared on `Card` (`combatEffects`, `specialMechanics`).
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';

// ─── Tier 1 — Single Stance Cost (6 skills) ──────────────────────────────────

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
    basePower: 8,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'strip_random_buff', appliedTo: 'enemy' }],
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
    basePower: 4,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
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
    basePower: 12,
    scalingStat: 'body',
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
    basePower: 3,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'tier1_mind_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
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
    basePower: 0,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'convert_enemy_buff_to_self' }],
};

// ─── Tier 2 — Resonance Required (3 skills) ──────────────────────────────────

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
    basePower: 10,
    scalingStat: 'body',
    specialMechanics: [{ kind: 'secondary_heal_self', stat: 'heart', multiplier: 1 }],
    learningRequirement: { level: 5 },
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
    basePower: 8,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'tier1_mind_mark', appliedTo: 'opponent', intensity: 3, duration: 3 },
    ],
    learningRequirement: { level: 5 },
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
    basePower: 6,
    scalingStat: 'heart',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent' },
        { effectId: 'debuff_slow',      appliedTo: 'opponent' },
    ],
    learningRequirement: { level: 5 },
};

// ─── Tier 3 — Philosophical Resource Required (3 skills) ─────────────────────

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
    basePower: 5,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 4 },
    ],
    learningRequirement: { level: 10 },
};

const strawGiant: Card = {
    id: 'straw-giant',
    name: 'Straw Giant',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You construct their position in cardboard and straw, then demolish ' +
        'it with theatrical precision. The real argument was never the point — ' +
        'the audience believes what they see fall. Their actual stance crumbles ' +
        'in sympathy with its hollow twin.',
    tier: 3,
    targetType: 'enemy',
    basePower: 18,
    scalingStat: 'body',
    learningRequirement: { level: 10 },
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
};

// ─── Tier 3 — Phase 44 fallacies-as-spells (4 skills) ────────────────────────
//
// Each draws from a named fallacy on the Phase 42 27-cell library, tracing the
// skill back to its philosophical origin via `philosophicalAlignmentLibrary`.

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
    basePower: 16,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'tier1_body_attack', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 10 },
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
    basePower: 14,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent' },
    ],
    // Phase 46 — only learnable by a sufficiently pessimistic character.
    // The skill expresses Schopenhauer / Underground Man metaphysics; a
    // hopeful caster wouldn't reach the contempt the wager requires.
    learningRequirement: {
        level: 10,
        requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 },
    },
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
};

const appealToFear: Card = {
    id: 'appeal-to-fear',
    name: 'Appeal to Fear',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The universe is vast and cold, and something terrible is coming. You ' +
        'name their deepest dread aloud until it becomes more real than the fight. ' +
        'The fear arrives first; your strike simply confirms what they already ' +
        'knew was inevitable.',
    tier: 3,
    targetType: 'enemy',
    basePower: 12,
    scalingStat: 'heart',
    combatEffects: [
        { effectId: 'debuff_slow', appliedTo: 'opponent' },
    ],
    // Phase 46 — only learnable by a sufficiently transcendent character.
    // The cosmic-dread whisper requires a caster whose attention is already
    // tuned to the indifferent beyond (Lovecraft / Burroughs archetype).
    learningRequirement: {
        level: 10,
        requiresAlignment: { axis: 'scope', op: 'gte', value: 34 },
    },
};

// ─── Tier 2 synergy (Phase 66) — 5 skills rewarding stance-switching ────────
//
// Each skill carries a `synergy` clause evaluated after damage and before
// combatEffects. Predicate misses → only the basePower fires. Match → the
// synergy bonus / consumption / type-swap / detonation runs. See
// `docs/skills.md` § "Tier 2 synergy (Phase 66)" for the schema.

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
    basePower: 4,
    scalingStat: 'heart',
    learningRequirement: { level: 5 },
    synergy: {
        predicate: { effectId: 'debuff_bleed', on: 'target', durationMin: 2 },
        bonusDamage: 5,
        durationDamageMul: 3,
    },
};

const intensityFeedback: Card = {
    id: 'intensity-feedback',
    name: 'Intensity Feedback',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You take the certainty you have been holding and let it ring back ' +
        'into them. The louder it was for you, the louder it lands for them.',
    tier: 2,
    targetType: 'enemy',
    basePower: 5,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    synergy: {
        predicate: { effectId: 'buff_critical_rate_up', on: 'caster', intensityMin: 1 },
        bonusDamage: 4,
        intensityDamageMul: 5,
    },
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
    synergy: {
        // Body Thorns proxy — tier1_body_defend ships reflectDamage: 1 and
        // is the closest existing buff to the braindump's "Body Thorns".
        predicate: { effectId: 'tier1_body_defend', on: 'caster', durationMin: 5 },
        consumeMatched: true,
        applyEffectOnFire: {
            effectId: 'buff_max_hp_up',
            appliedTo: 'self',
            intensity: 3,
            duration: 5,
        },
    },
};

const resonanceBurst: Card = {
    id: 'resonance-burst',
    name: 'Resonance Burst',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Burn the lattice; spend it. You collapse the confusion you placed ' +
        'in them and the collapse itself is the strike — proportional to ' +
        'how long they have already been losing their footing.',
    tier: 2,
    targetType: 'enemy',
    basePower: 3,
    scalingStat: 'mind',
    learningRequirement: { level: 5 },
    synergy: {
        predicate: { effectId: 'debuff_confusion', on: 'target', durationMin: 1 },
        bonusDamage: 3,
        intensityDamageMul: 2,
        durationDamageMul: 3,
        consumeMatched: true,
    },
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
    synergy: {
        // No predicate — unconditional fire on cast (D6).
        bonusDamage: 25,
        resourceTokenDamageMul: 10,
        consumeAllResources: true,
        clearAllEffectsBothSides: true,
    },
};

// ─── Phase 91 — Friendship increment skills (3 skills) ──────────────────────

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
};

// ─── Phase 108 — Befriend heart skill ──────────────────────────────────────

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

// ─── Tier 3 synergy (Phase 94) — 5 skills mirroring Phase 66 pattern ───────

// Each skill carries a `synergy` clause with advanced Tier 3 mechanics.
// Higher resource costs, complex predicates, and amplified damage over
// Tier 2 synergy. See Phase 66 pattern for schema reference.

const paradoxConvergence: Card = {
    id: 'paradox-convergence',
    name: 'Paradox Convergence',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You gather every contradiction they carry and collapse them into ' +
        'a single impossible instant. The logic breaks; the body follows ' +
        'the argument down into the mathematical void.',
    tier: 3,
    targetType: 'enemy',
    basePower: 15,
    scalingStat: 'mind',
    learningRequirement: { level: 10 },
    synergy: {
        predicate: { effectId: 'buff_haste', on: 'target', intensityMin: 1 },
        bonusDamage: 8,
        intensityDamageMul: 7,
        durationDamageMul: 4,
        consumeMatched: true,
    },
};

const metaphysicalDrain: Card = {
    id: 'metaphysical-drain',
    name: 'Metaphysical Drain',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Their strength becomes your sustenance. You consume the certainty ' +
        'they built in themselves and weave it into your own flesh. What ' +
        'made them invulnerable makes you whole.',
    tier: 3,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    scalingMultiplier: 5,
    learningRequirement: { level: 10 },
    synergy: {
        predicate: { effectId: 'buff_invincibility', on: 'target', durationMin: 1 },
        bonusDamage: 10,
        durationDamageMul: 6,
        consumeMatched: true,
    },
};

const logicalRecursion: Card = {
    id: 'logical-recursion',
    name: 'Logical Recursion',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Your uncertainty echoes theirs, and theirs echoes yours, until the ' +
        'feedback becomes deafening. Logic eats its own tail in an endless loop ' +
        'of self-reference. When the recursion finally collapses, only one mind ' +
        'remains intact enough to remember which thoughts belonged to whom.',
    tier: 3,
    targetType: 'enemy',
    basePower: 12,
    scalingStat: 'mind',
    learningRequirement: { level: 10 },
    synergy: {
        predicate: { effectId: 'debuff_confusion', on: 'caster', durationMin: 2 },
        bonusDamage: 6,
        durationDamageMul: 5,
        intensityDamageMul: 3,
        applyEffectOnFire: {
            effectId: 'buff_critical_rate_up',
            appliedTo: 'self',
            intensity: 2,
            duration: 3,
        },
    },
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
    basePower: 18,
    scalingStat: 'body',
    learningRequirement: { level: 10 },
    synergy: {
        predicate: { effectId: 'debuff_petrify', on: 'target', durationMin: 1 },
        bonusDamage: 12,
        durationDamageMul: 8,
        consumeMatched: true,
        clearAllEffectsBothSides: true,
    },
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
};

// ─── 2026-06-07 content drop — mid/late-game expansion (20 skills) ───────────
//
// Twenty new skills scaling content up toward level ~45. Spread across
// body/mind/heart × fallacy/paradox × tiers 1-3 and across the four
// playstyle needs: pure damage (high basePower, enemy-target), control
// (debuff combatEffects), defensive/self (self buffs / secondary_heal_self),
// and synergy (strategist `synergy` clauses). Every entry carries
// `addedIn: '2026-06-07'` + content tags for the tuning `--focus` filter.
// All `combatEffects[].effectId` reference effects that exist in
// `src/Effects/{buffs,debuffs}.library.json`.

// ── Tier 1 — early-mid filler (5 skills) ─────────────────────────────────────

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
    basePower: 11,
    scalingStat: 'body',
    learningRequirement: { level: 3 },
    addedIn: '2026-06-07',
    tags: ['early-game', 'damage'],
};

const redHerring: Card = {
    id: 'red-herring',
    name: 'Red Herring',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You drag a brighter, louder, irrelevant thing across their line of ' +
        'reasoning. By the time they remember what they were chasing, the ' +
        'scent is gone and so is their footing.',
    tier: 1,
    targetType: 'enemy',
    basePower: 4,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_accuracy_down', appliedTo: 'opponent', duration: 3 },
    ],
    learningRequirement: { level: 3 },
    addedIn: '2026-06-07',
    tags: ['early-game', 'control'],
};

const wishfulThinking: Card = {
    id: 'wishful-thinking',
    name: 'Wishful Thinking',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You decide, with great feeling, that you are already healing — and ' +
        'the feeling is sincere enough to do a little of the work itself. ' +
        'Believing it does not make it true, but it makes it truer.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    scalingMultiplier: 4,
    learningRequirement: { level: 3 },
    addedIn: '2026-06-07',
    tags: ['early-game', 'defensive', 'heal'],
};

const arrowParadox: Card = {
    id: 'arrow-paradox',
    name: 'Arrow Paradox',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'At every instant the arrow is motionless, so motion cannot exist — ' +
        'yet here it is, lodged in them. You let the contradiction carry the ' +
        'shot that logic insists never travelled.',
    tier: 1,
    targetType: 'enemy',
    basePower: 13,
    scalingStat: 'body',
    learningRequirement: { level: 4 },
    addedIn: '2026-06-07',
    tags: ['early-game', 'damage'],
};

const heapOfDoubt: Card = {
    id: 'heap-of-doubt',
    name: 'Heap of Doubt',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Remove one certainty and they are still sure. Remove another. At no ' +
        'single grain do they become lost — and yet, grain by grain, they are. ' +
        'You watch the heap of their conviction quietly stop being a heap.',
    tier: 1,
    targetType: 'enemy',
    basePower: 5,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 },
    ],
    learningRequirement: { level: 4 },
    addedIn: '2026-06-07',
    tags: ['early-game', 'control'],
};

// ── Tier 2 — mid-game core (8 skills) ────────────────────────────────────────

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
    basePower: 16,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 14 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'damage', 'control'],
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
    basePower: 9,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_vulnerability_mind', appliedTo: 'opponent', intensity: 2, duration: 3 },
        { effectId: 'buff_mind_attack_up', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 15 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'control', 'buff'],
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
    basePower: 10,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'secondary_heal_self', stat: 'heart', multiplier: 2 }],
    learningRequirement: { level: 15 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'damage', 'heal'],
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
    basePower: 11,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 3 },
        { effectId: 'debuff_silence', appliedTo: 'opponent', duration: 2 },
    ],
    learningRequirement: { level: 16 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'control'],
};

const ravenParadox: Card = {
    id: 'raven-paradox',
    name: 'Raven Paradox',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Every green leaf confirms that all ravens are black. You arm yourself ' +
        'with the absurd abundance of evidence the world keeps handing you, and ' +
        'each irrelevant proof sharpens the inevitability of the next strike.',
    tier: 2,
    targetType: 'enemy',
    basePower: 18,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'buff_critical_rate_up', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 17 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'damage', 'buff'],
};

const stoicBulwark: Card = {
    id: 'stoic-bulwark',
    name: 'Stoic Bulwark',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'What is not in your control cannot truly harm you — so you decide it ' +
        'is not, and the deciding becomes a wall. The blows still come; they ' +
        'simply arrive at a self that has agreed not to be there for them.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    combatEffects: [
        { effectId: 'buff_damage_reduction', appliedTo: 'self', intensity: 2, duration: 3 },
        { effectId: 'buff_barrier', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 14 },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'defensive', 'buff'],
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
    basePower: 7,
    scalingStat: 'mind',
    learningRequirement: { level: 16 },
    synergy: {
        predicate: { effectId: 'debuff_confusion', on: 'target', durationMin: 1 },
        bonusDamage: 6,
        durationDamageMul: 4,
        intensityDamageMul: 3,
        consumeMatched: true,
    },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'synergy', 'damage'],
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
    basePower: 8,
    scalingStat: 'body',
    learningRequirement: { level: 17 },
    synergy: {
        // Unconditional on cast — pure resource-dump strategist payoff.
        bonusDamage: 10,
        resourceTokenDamageMul: 4,
        consumeAllResources: true,
    },
    addedIn: '2026-06-07',
    tags: ['mid-game', 'synergy', 'damage'],
};

// ── Tier 3 — late-game capstones (7 skills) ──────────────────────────────────

const omnipotenceParadox: Card = {
    id: 'omnipotence-paradox',
    name: 'Omnipotence Paradox',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Can the all-powerful forge a stone they cannot lift? You become the ' +
        'stone and the lifting both, and the contradiction discharges into ' +
        'them as a blow that no defence was designed to be able to answer.',
    tier: 3,
    targetType: 'enemy',
    basePower: 30,
    scalingStat: 'body',
    scalingMultiplier: 1.5,
    combatEffects: [
        { effectId: 'debuff_defense_down', appliedTo: 'opponent', intensity: 3, duration: 3 },
    ],
    learningRequirement: { level: 38, statRequirementType: 'body', statRequirementValue: 30 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'damage'],
};

const gamblersRuin: Card = {
    id: 'gamblers-ruin',
    name: "Gambler's Ruin",
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The next throw must come good — it is owed, surely, after so many ' +
        'that did not. You press the fallacy onto them until they stake what ' +
        'remains on a turn that the arithmetic has already lost.',
    tier: 3,
    targetType: 'enemy',
    basePower: 22,
    scalingStat: 'mind',
    scalingMultiplier: 1.25,
    combatEffects: [
        { effectId: 'debuff_all_stats_down', appliedTo: 'opponent', intensity: 2, duration: 3 },
        { effectId: 'debuff_fear', appliedTo: 'opponent', duration: 2 },
    ],
    learningRequirement: { level: 40, prerequisiteSkill: 'gamblers-fallacy' },
    addedIn: '2026-06-07',
    tags: ['late-game', 'control', 'damage'],
};

const gamblersFallacy: Card = {
    id: 'gamblers-fallacy',
    name: "Gambler's Fallacy",
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The coin has no memory, but you do — and you lend yours to them. ' +
        'You convince their reasoning that the pattern owes a correction, and ' +
        'they overcommit to a turn that chance never promised.',
    tier: 3,
    targetType: 'enemy',
    basePower: 17,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 3 },
    ],
    learningRequirement: { level: 30 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'control'],
};

const buridansImpasse: Card = {
    id: 'buridans-impasse',
    name: "Buridan's Impasse",
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The donkey, equally hungry and equally placed between two identical ' +
        'meals, starves on the symmetry. You make every option perfectly ' +
        'equal, and they freeze in the exact centre of their own indecision.',
    tier: 3,
    targetType: 'enemy',
    basePower: 14,
    scalingStat: 'mind',
    combatEffects: [
        { effectId: 'debuff_stun', appliedTo: 'opponent', duration: 2 },
        { effectId: 'debuff_slow', appliedTo: 'opponent', duration: 3 },
    ],
    learningRequirement: { level: 36 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'control'],
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
    combatEffects: [
        { effectId: 'buff_regeneration', appliedTo: 'self', intensity: 3, duration: 4 },
        { effectId: 'buff_all_stats_up', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 42, statRequirementType: 'heart', statRequirementValue: 32 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'defensive', 'heal', 'buff'],
};

const grandfatherParadox: Card = {
    id: 'grandfather-paradox',
    name: 'Grandfather Paradox',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You strike at the cause of them rather than the effect — unmaking the ' +
        'condition that let them be standing here at all. The blow lands before ' +
        'the parry could have been born, and consumes the certainty they leaned on.',
    tier: 3,
    targetType: 'enemy',
    basePower: 20,
    scalingStat: 'body',
    learningRequirement: { level: 44, statRequirementType: 'body', statRequirementValue: 34 },
    synergy: {
        predicate: { effectId: 'buff_all_stats_up', on: 'target', intensityMin: 1 },
        bonusDamage: 14,
        intensityDamageMul: 8,
        durationDamageMul: 5,
        consumeMatched: true,
        clearAllEffectsBothSides: true,
    },
    addedIn: '2026-06-07',
    tags: ['late-game', 'synergy', 'damage'],
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
    combatEffects: [
        { effectId: 'buff_barrier', appliedTo: 'self', intensity: 3, duration: 4 },
        { effectId: 'buff_reflect', appliedTo: 'self', intensity: 2, duration: 3 },
        { effectId: 'buff_damage_reduction', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    learningRequirement: { level: 40, statRequirementType: 'heart', statRequirementValue: 30 },
    addedIn: '2026-06-07',
    tags: ['late-game', 'defensive', 'buff', 'heal'],
};

// ─── Defense cards (Spec 26b — Hazard GUARD) ─────────────────────────────────
// basePower 0, targetType 'self', a `guard` specialMechanic → the combat engine
// grants GUARD (a shield) that absorbs the enemy's NEXT telegraphed threat
// (`resolveThreatPhase`). POWER scales the brace by the stance read; FREE gives a
// small one. Defense is a TEMPO/survival tool — it deals no damage and spends your
// die for the turn, so STATUS (DoT) stays the efficient way to actually win.
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
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    learningRequirement: { level: 1 },
    addedIn: '2026-06-22',
    tags: ['defense', 'guard', 'early-game'],
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
    specialMechanics: [{ kind: 'guard', amount: 18 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-06-22',
    tags: ['defense', 'guard', 'mid-game'],
};

// ─── Gold (rare) cards — the strongest tier (Spec 26b §Gold) ─────────────────
// The rarest combat cards. Powered (with a die) they land a MAJOR status (high
// intensity + long duration) plus solid damage; unpowered (free top) they still
// give a useful chip. A WILD die on a gold card always reads ADVANTAGE (the
// combat engine special-cases `card.rarity === 'gold'`). Tagged `gold` so the
// adapter (`combat.cards.ts` GOLD_CARD_IDS) marks the card view + the mobile can
// render the rare frame. Granted as a RARE reward drop.
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
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 5 },
    ],
    learningRequirement: { level: 12 },
    addedIn: '2026-06-22',
    tags: ['gold', 'rare'],
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
    combatEffects: [
        { effectId: 'debuff_confusion', appliedTo: 'opponent', intensity: 3, duration: 3 },
    ],
    learningRequirement: { level: 12 },
    addedIn: '2026-06-22',
    tags: ['gold', 'rare'],
};

// ─── 0.34.0 status-depth epic — payoff cards (HP behavior in combat.engine) ──
// Each rides a new CardSpecialMechanic kind (rupture/compound/siphon/barrier/
// riposte) or applies the new VULNERABLE debuff. The SKILL engine no-ops these
// kinds (same split as `guard`); the HP-model combat engine reads them at its
// playBottomAction / resolveThreatPhase call sites. Authored as Tier 1/2 so the
// tier-3 philosophical-token invariant and the Tier-2 level gate stay satisfied.

/** RUPTURE — consume the foe's DoT and detonate the remaining total (read +
 *  vulnerable scaled, capped). The marquee "make DoT exciting" card. */
const resonanceRupture: Card = {
    id: 'resonance-rupture',
    name: 'Resonance Rupture',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You stop feeding the wound and seize it instead — every slow poison, ' +
        'every patient bleed, called home at once. What was going to take ten ' +
        'rounds arrives in one.',
    tier: 2,
    targetType: 'enemy',
    basePower: 4,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'rupture' }],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'rupture', 'dot', 'mid-game'],
};

/** COMPOUND — deal HP per DISTINCT debuff on the foe (rewards variety offensively). */
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
    basePower: 3,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'compound', perDebuff: 6 }],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'compound', 'mid-game'],
};

/** VULNERABLE — mark the foe Breached (+50% from your hits for 3 turns). The
 *  set-up-then-swing card; replaces a thesaurus of cosmetic stat-downs. */
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
    combatEffects: [
        { effectId: 'debuff_vulnerable', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'vulnerable', 'mid-game'],
};

/** THORNS — wrap yourself in reflect (Brazen Thorns); the foe's telegraphed hit
 *  rebounds onto it. Promotes the inert reflectDamage payload in the HP duel. */
const brazenRebuttal: Card = {
    id: 'brazen-rebuttal',
    name: 'Brazen Rebuttal',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You answer in kind before they have finished speaking. To strike you ' +
        'is to be cut by the strike — the harder the push, the deeper the ' +
        'rebuttal bites back.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'body',
    combatEffects: [
        { effectId: 'buff_brazen_thorns', appliedTo: 'self', intensity: 1 },
    ],
    addedIn: '2026-06-26',
    tags: ['status-effect', 'thorns', 'defense'],
};

/** BARRIER — a STACKING, persistent damage soak (distinct from one-shot Guard). */
const gabrielsBulwark: Card = {
    id: 'gabriels-bulwark',
    name: "Gabriel's Bulwark",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'A shield of infinite surface but finite volume — each blow spreads ' +
        'across its endless expanse and is diluted to almost nothing. What it ' +
        'does not spend, it keeps.',
    tier: 2,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'barrier', amount: 12 }],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['status-effect', 'barrier', 'defense', 'mid-game'],
};

/** RIPOSTE — a one-shot parry: gain a little Guard, reduce the next telegraphed
 *  hit, and counter for HP (read-scaled). Punishes the telegraph (Sekiro). */
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
};

/** SIPHON — offense-scaled sustain: heal for part of the HP this strike erodes. */
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
    basePower: 12,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'siphon', pct: 0.5 }],
    learningRequirement: { level: 5 },
    addedIn: '2026-06-26',
    tags: ['siphon', 'sustain', 'mid-game'],
};

// ─── Phase 168 — HP-model DoT amplifier cards ────────────────────────────────
// AMPLIFY reads the foe's pending DoT total × multiplier and fires as a HP burst
// WITHOUT consuming the effects — DoT keeps ticking (distinct from RUPTURE).

/** AMPLIFY (entry) — Tier 2 Heart card. Lower cost + multiplier, accessible at
 *  level 6. The "build a DoT board, then cash in without losing the tick." */
const crescendoOfSuffering: Card = {
    id: 'crescendo-of-suffering',
    name: 'Crescendo of Suffering',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You do not interrupt the accumulation — you let it reach its peak, ' +
        'then conduct it. Every wound keeps bleeding, every poison keeps ' +
        'spreading. You simply turned the volume up.',
    tier: 2,
    targetType: 'enemy',
    basePower: 3,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'amplify', multiplier: 1.5 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-06-29',
    tags: ['status-effect', 'amplify', 'dot', 'mid-game'],
};

/** AMPLIFY (payoff) — Tier 2 Mind card. Higher cost + multiplier, accessible at
 *  level 10. The "patience rewards itself" amplifier. */
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
    basePower: 2,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'amplify', multiplier: 2.0 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-06-29',
    tags: ['status-effect', 'amplify', 'dot', 'mid-game'],
};

// ─── Library Export ──────────────────────────────────────────────────────────

/**
 * The full early-game skill catalogue. Order is presentational only — the
 * resolver looks skills up by ID via `getCardById`. Keep cells balanced
 * across `(philosophicalAspect × category × tier)` when adding entries here.
 */
export const cardLibrary: Card[] = [
    // Tier 1
    adHominemStrike,
    falseDilemma,
    appealToPity,
    achillesGambit,
    liarsEcho,
    shipOfTheseus,
    // Tier 2
    mobAppeal,
    undistributedMiddle,
    eternalRegress,
    // Tier 2 — Phase 66 synergy skills (5)
    resonanceBleed,
    intensityFeedback,
    batSwarmThoughtform,
    resonanceBurst,
    resonanceDetonation,
    // Tier 3
    soritesCascade,
    strawGiant,
    bootstrapParadox,
    // Tier 3 — Phase 44 fallacies-as-spells
    appealToConsequences,
    nirvanaFallacy,
    pascalsWager,
    appealToFear,
    // Tier 3 — Phase 94 synergy skills (5)
    paradoxConvergence,
    metaphysicalDrain,
    logicalRecursion,
    existentialCollapse,
    transcendentSynthesis,
    // Phase 91 — friendship increment skills
    soothingWords,
    peacefulGesture,
    empatheticUnderstanding,
    // Phase 108 — Befriend heart skill
    befriend,
    // 2026-06-07 content drop — mid/late-game expansion (20 skills)
    // Tier 1 (7)
    hastyGeneralization,
    redHerring,
    wishfulThinking,
    arrowParadox,
    heapOfDoubt,
    braceForImpact,     // defense (BODY) — Hazard GUARD
    suspendJudgment,    // defense (MIND) — Hazard GUARD
    // Tier 2 (9)
    slipperySlope,
    stoicReserve,       // defense (HEART) — Hazard GUARD
    appealToAuthority,
    tuQuoque,
    baradoxsBarber,
    ravenParadox,
    stoicBulwark,
    equivocationCascade,
    sunkCostMomentum,
    // Tier 3 (7)
    omnipotenceParadox,
    gamblersRuin,
    gamblersFallacy,
    buridansImpasse,
    eternalRecurrence,
    grandfatherParadox,
    apophaticAegis,
    // Gold (rare) cards — the strongest tier
    pyrrhicVictory,     // gold (BODY) — major Bleed + damage + EXECUTE finisher
    theFinalWord,       // gold (MIND) — major Poison + damage
    unmovedMover,       // gold (HEART) — major Confusion + damage
    // 0.34.0 status-depth epic — payoff cards (appended to keep find-order stable)
    resonanceRupture,   // RUPTURE  (HEART) — detonate the foe's DoT
    mountingContradictions, // COMPOUND (MIND) — HP per distinct debuff
    breach,             // VULNERABLE (MIND) — mark the foe Breached (+50% taken)
    brazenRebuttal,     // THORNS   (BODY) — reflect the foe's telegraphed hit
    gabrielsBulwark,    // BARRIER  (HEART) — stacking, persistent soak
    briarRiposte,       // RIPOSTE  (BODY) — parry + counter
    leechingSyllogism,  // SIPHON   (HEART) — offense-scaled sustain
    // Phase 168 — HP-model DoT amplifier cards
    crescendoOfSuffering, // AMPLIFY (HEART) — pending DoT × 1.5, non-consuming
    theInevitable,        // AMPLIFY (MIND)  — pending DoT × 2.0, non-consuming
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
