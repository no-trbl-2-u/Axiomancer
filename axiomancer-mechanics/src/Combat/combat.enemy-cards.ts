/**
 * THE ENEMY CARD LIBRARY — the Profane Canon (2026-08-08 rework).
 *
 * The enemy uses cards too. Every foe fights as an ordered DECK of enemy
 * cards (`combat.enemy-decks.ts`); each card compiles to one telegraphed
 * threat phase, so the whole Hazard-Pattern resolution machinery (stances,
 * rungs, stance checks, the escalation clock, branches, the coveted die) is
 * unchanged — the LIBRARY is the new authoring layer. The telegraph now
 * reads as the enemy PLAYING a named card: "The Butcher casts DRESS THE
 * JOINTS."
 *
 * Seven archetypes, each with shared commons + escalations (the faction's
 * mechanical throughline), exactly one curse-injector (`curseCardId` — the
 * deck-contamination vector), and per-boss SIGNATURE cards (the bespoke
 * voice). Aeon's-End-style structural escalation: a deck's later cards carry
 * heavier weights, and its final card is a spike.
 *
 *   drowned-parish — brine, bells, grief; the salt-rescue that pulls you down.
 *   gnawing-court  — courtesy that ends where the reach begins.
 *   omen-choir     — tallies, knocks, prophecy; the already-written.
 *   bone-clergy    — post-flesh scholarship, decrees, plague.
 *   debt-office    — contracts, tolls, borrowed gods, punctual endings.
 *   old-fires      — geological wrath; old flame that cauterizes its wounds.
 *   the-aporia     — the labyrinth bosses; each inverts one player habit.
 *
 * Card payloads speak the existing threat vocabulary (damageWeight against
 * the level/difficulty budget, effectId debuffs, heal/cleanse/swayCleanse/
 * premiseShed counterplay riders, rungs, stakes, unlockAfterRound locks) —
 * the engine does all scaling, so the roster retunes from constants.
 *
 * ── THE BIG NUMBERS REWRITE (2026-09-02) ──────────────────────────────────
 * `threatDamageBudget` is now round((6 + 0.8·level) · DIFFICULTY_MULT ·
 * (1 + 0.2·phaseIndex) · damageWeight) and the old global THREAT_DAMAGE_SCALE
 * (1.7) is retired. Every weight in this file was re-banded to §5.3:
 *
 *   common 0.8-1.0 · escalation 1.0-1.3 · signature 1.3-1.6
 *
 * Ordering within a deck is preserved (an opener is still the lightest card a
 * boss owns) but nothing sits below the band any more — the sub-0.35 weights
 * on the Aporia and Ferryman openers were divisors against the retired scale
 * and made those foes harmless once it went to 1. Status intensities were
 * raised ~1.5-2x against the new player VITAE (L1 ≈ 100, L18 ≈ 350); an
 * enemy DoT is meant to be a clock. `actionText` never hardcodes the damage
 * number (it is level-dependent and appended by `buildThreatAction` as
 * "(+N damage, Poison)"), but it DOES name the authored `intensity` — those
 * are constants and printing them is honest. 49 tier-3/stage cards were added
 * (7 per archetype) so bosses have real closing moves; 157 cards total.
 * NOTE: individual card comments below still quote their pre-rewrite band
 * ("mid band 0.9", "spike 1.45"); the design INTENT in those notes stands,
 * the numbers in them do not — read the fields.
 */

import type { Stance } from './types';
import type { ThreatBranchCondition } from './combat.encounter.types';

/** The enemy factions (see the module doc for their throughlines). */
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
     *  the card's own fields — Tri-Eyes' THEN fork sheds one of its own
     *  afflictions when its ledger is written past legibility). */
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
    'bc-first-recitation': {
        name: 'First Recitation',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        actionText: 'The dead lesson is recited at you, clause by cold clause, until the cold is inside your coat',
        stanceHint: 'The argument outlived the arguer; it repeats with the patience of something that no longer needs breath.',
        // The archetype\'s universal mind opener. Adapts chattering-skull\'s loop (\'the argument it died holding, colder each time\') into faction voice so it also serves bone-wizard\'s citation opening and the-unnameable\'s first utterance.
    },
    'bc-canon-of-teeth': {
        name: 'Canon of Teeth',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.9,
        effectId: 'debuff_bleed',
        actionText: 'Doctrine is applied along your forearm, tooth by tooth, and the forearm opens where it is quoted',
        stanceHint: 'What remains of the body is doctrine, and the doctrine still bites.',
        // Body opener with BLEED — the melee entry for cursed-paladin (oath-swung armor) and vampire-thrall (the artless throat-lunge).
    },
    'bc-plague-versicle': {
        name: 'Plague Versicle',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.9,
        effectId: 'debuff_poison',
        actionText: 'A versicle is breathed into your open mouth and goes down into the blood to sit and ferment',
        stanceHint: 'The liturgy spreads the old way — congregant to congregant, breath by breath.',
        // Poison opener; the faction\'s plague-as-liturgy seed. Serves ashen-bone-drake\'s exhalation (\'the memory of fire, which burns regardless\') and Black Death\'s town\'s-worth-of-endings breath.
    },
    'bc-penitent-genuflection': {
        name: 'Penitent Genuflection',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It kneels toward you, and the hollow where its worship used to sit pulls twice at your chest',
        stanceHint: 'The devotion outlived its object; it kneels at you for want of an altar.',
        // The archetype\'s one heart common — hollow devotion. Directly adapts cursed-paladin\'s mid-fight kneel; doubles as vampire-thrall\'s spent devotion and Black Death\'s \'multitudes grieve strangely\' beat.
    },
    'bc-interdict': {
        name: 'Interdict',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'mind',
        damageWeight: 1.0,
        effectId: 'debuff_mark',
        intensity: 4,
        rungs: 2,
        actionText: 'An interdict is pronounced against your next intention, and four counts are entered against your name',
        stanceHint: 'The decree does not ask for obedience; it files yours as already given.',
        // Mid move (top of the mid band). The decree verb the whole faction shares — bone-wizard\'s methodology objection, the drake reading where your guard was burned before.
    },
    'bc-ossuary-sermon': {
        name: 'Ossuary Sermon',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 3,
        rungs: 3,
        actionText: 'The sermon concludes in the old language of blunt bone, and leaves you open in three places',
        stanceHint: 'When scripture fails, the church remembers it is built of femurs.',
        // The archetype\'s body FINISHER (spike band 1.35). Adapts bone-wizard\'s \'concludes the review with the staff, per tradition\' — the moment post-flesh scholarship gives up on words. rungs:3 sizes the spike.
    },
    'bc-final-rubric': {
        name: 'The Final Rubric',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 3,
        actionText: 'The final rubric is read over you as over the already dead, and the reading rots three ways in',
        stanceHint: 'The office for the dead does not pause to check its subject for a pulse.',
        // The archetype\'s mind FINISHER (spike 1.4). The last rite performed on a still-living subject — decree escalated to liturgy of ending.
    },
    'bc-processional-of-relics': {
        name: 'Processional of Relics',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 4,
        unlockAfterRound: 3,
        actionText: 'The reliquary opens and every saint\'s grievance processes through you, naming four soft places on the way',
        stanceHint: 'Centuries of preserved devotion, none of it spent, all of it owed — and the procession collects.',
        // Heavy heart mid (1.2), the one unlockAfterRound escalation: the reliquary stays shut until round 3, so a fast solve never sees it and a slow fight watches it coming. Slotted as phase 3 of 4-card decks, where the gate almost never stalls but always looms.
    },
    'bc-anathema-brand': {
        name: 'Anathema Brand',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        curseCardId: 'overheard-name', // designer: curse-leaden-psalm
        actionText: 'A writ of anathema is pressed into your hand, cold from the vault, and it will not put itself down',
        stanceHint: 'The church does not curse in anger; it curses in paperwork, and the paperwork travels with you.',
        // THE archetype\'s single curse-injector. On a landed threat it shuffles \'curse-leaden-psalm\' into the player\'s deck — a rank-1 curse per brief §4 (theme \'curse\', paid line \'PURGE this curse\', free line a small self-harm; suggested free line: TICK one of your own DoTs — the psalm weighs on the 
    },
    'bc-sig-annexation-decree': {
        name: 'Annexation Decree',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'Ra-Amin-Ka signs, and your next turn is annexed — four clauses of you, witnessed and taken',
        stanceHint: 'Cold administration; every strike is a signature, witnessed.',
        // Ra-Amin-Ka signature 1 (opener). Keeps his current best line verbatim — the administrative annexation of the player\'s turn is his identity.
    },
    'bc-sig-struck-from-the-record': {
        name: 'Struck from the Record',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'He strikes your objection from the record of the living, four strokes, and the pen does not lift between them',
        stanceHint: 'The court of dust has procedures older than your language.',
        // Ra-Amin-Ka signature 2 — the STAKE card, seated second per boss law (his current sequence already stakes this exact beat). The coveted-die wager as an act of erasure from the record.
    },
    'bc-sig-census-of-flesh': {
        name: 'Census of Flesh',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.35,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The Black Death lays a hand on you like a census, and enrols three of your organs by name',
        stanceHint: 'A plague with posture; every touch is enrollment.',
        // Black Death signature 1, seated second. Adapts his current opener
        // line; the enrollment IS the threat. NO `stake`: the registry rates
        // the Black Death ELITE (enemy.library.ts), and the coveted-die
        // authoring law reserves the wager for boss/unique decks.
    },
    'bc-sig-embrace-of-history': {
        name: 'The Embrace of History',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 3,
        actionText: 'The pestilence embraces you with the patience of history and leaves five centuries of rot behind in the lungs',
        stanceHint: 'Walking, it decided, beats waiting — and it has walked straight to you.',
        // Black Death signature 2 — the finisher spike (1.45, POISON i3). Keeps his current final line; rungs:3 makes the embrace a sized threat.
    },
    'bc-sig-devoured-lexicon': {
        name: 'Devoured Lexicon',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'It eats the word you were about to use for it, and four more you were saving',
        stanceHint: 'It thinks in shapes language was built to avoid.',
        // The-Unnameable signature 1 — the STAKE card, seated second (its current sequence lacked a stake; boss law now requires one, and wagering the coveted die against a thing that eats names is the correct dread). Keeps its current opener line.
    },
    'bc-sig-the-name-collection': {
        name: 'The Name Collection',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 3,
        actionText: 'It reaches for your name, having finished all of its own, and takes five fistfuls of you with it',
        stanceHint: 'The collection is nearly complete; yours would round out the set.',
        // The-Unnameable signature 2 — the finisher spike (1.45). Keeps its current final line verbatim; the one-sentence boss rule stays statable: \'it takes your names before it takes you.\'
    },
    'first-notice': {
        name: 'First Notice',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        actionText: 'The office serves first notice, and your name begins accruing at the stated rate',
        stanceHint: 'Nothing in it is angry. Everything in it is itemized, and the itemizing has started on you.',
        // Universal opener. MARK i1 = the account opened; every later hit collects against it. Opener band 0.85.
    },
    'small-god-on-credit': {
        name: 'Small God, on Credit',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_poison',
        actionText: 'A small god on credit is aimed at you, price tag still on, and it bites where it is pointed',
        stanceHint: 'It consults the lender before every strike; the consultation is billed to you.',
        // Adapted from goblin-shaman\'s existing phase-1 voice (\'it consults before it strikes\'). POISON = the borrowed bargain compounding in the blood. Lightest opener, 0.8.
    },
    'condolences-itemized': {
        name: 'Condolences, Itemized',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It extends condolences for what it is about to repossess, and repossesses twice while you thank it',
        stanceHint: 'The regret is genuine, notarized, and offered with the deep sincerity of a paid mourner.',
        // Heart opener/mid. The office\'s sympathy is real and billable — the heart tell is the sincerity, the horror is the invoice.
    },
    'collection-rounds': {
        name: 'Collection Rounds',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.95,
        effectId: 'debuff_bleed',
        intensity: 2,
        actionText: 'The collectors go door to door through your guard and open two of you on the way out',
        stanceHint: 'When paper fails, hands are dispatched; the office keeps several on retainer.',
        // Body mid move, 1.0. BLEED = the physical taking. The faction\'s one honest card: enforcement in person.
    },
    'adjusters-visit': {
        name: 'The Adjuster\'s Visit',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'heart',
        damageWeight: 1.0,
        swayCleanse: 4,
        actionText: 'An adjuster reviews your appeal to its better nature, denies the claim, and deducts four measures of the pleading',
        stanceHint: 'It does have a better nature on file. The file is sealed, and the seal has outlived three notaries.',
        // The faction\'s anti-RELENT tool (spec 33a swayCleanse). Heart stance because the card IS about feeling — appraised, then declined. Kept off befriendable roster members (hasshaku-sama).
    },
    'compound-interest': {
        name: 'Compound Interest',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.15,
        effectId: 'debuff_creeping_doom',
        intensity: 2,
        actionText: 'The interest compounds and begins collecting itself — two grades of doom on the ledger, and they grow every round you argue',
        stanceHint: 'The arithmetic never raises its voice; it simply never stops, and it is never on your side.',
        // FLAG: uses debuff_creeping_doom (DOOM, brief §4) as an ENEMY-landed player debuff — the +1-intensity-per-round growth IS compounding interest, the faction\'s thesis mechanic. Needs orchestrator confirmation that threatEffectId accepts it. Mid-heavy 1.15; sited early enough in decks that the growth h
    },
    'foreclosure-in-person': {
        name: 'Foreclosure, in Person',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 3,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The office forecloses on the ground you are standing on and takes three strips of you as fixtures',
        stanceHint: 'The paperwork is finished; what remains is the removal, and the removal is performed by hand.',
        // The body spike (1.35), rungs:3 like fire-giant\'s sized finisher. Carries the archetype\'s one unlockAfterRound (3): foreclosure legally cannot arrive before the notice period — the gate is flavor made mechanical, and it protects deck edits from ever ordering this before round 3.
    },
    'the-toll-entire': {
        name: 'The Toll, Entire',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.25,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'The toll is called in full — the fare is whatever you were keeping, and four marks against the rest',
        stanceHint: 'It grieves for you the way a bell grieves — on schedule, at volume, and strictly for payment.',
        // Heart spike (1.3) for normals whose finisher is emotional rather than physical (shaman\'s third god, hasshaku\'s gathering).
    },
    'lien-of-the-ninth-office': {
        name: 'Lien of the Ninth Office',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        curseCardId: 'arrears', // designer: curse-outstanding-lien
        actionText: 'A lien is entered against your future and filed among the cards you have not drawn yet',
        stanceHint: 'It does not strike so much as append; the appendix is yours now, and it travels with you.',
        // THE archetype\'s single curse-injector. Damage stays mid-band (0.95) because the curse is the payload: \'curse-outstanding-lien\' — rank-1 curse theme, PURGE paid line, small self-harm free line (per brief §4.4). Carried by exactly one deck (hasshaku-sama: her choosing follows you home).
    },
    'the-weighing': {
        name: 'The Weighing',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        swayCleanse: 4,
        stake: true,
        actionText: 'Mirac weighs your conviction and finds it four marks short; what you were pleading with drains off the pan',
        stanceHint: 'Cold and exact, it weighs feeling against feeling on a fulcrum of pure indifference.',
        // Mirac signature 1 — actionText and hint kept verbatim from the existing phase 2 (the voice to beat). Stake on the deck\'s SECOND slot per boss law. swayCleanse:2 doubles down with adjusters-visit: Mirac\'s one-sentence rule — THE COURT CANNOT BE CHARMED; every appeal is deducted (inverts the choir h
    },
    'the-red-verdict': {
        name: 'The Red Verdict',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.55,
        effectId: 'debuff_mark',
        intensity: 6,
        actionText: 'The hooded court rises as one and executes the red verdict — six wounds, all of them inside the sentence',
        stanceHint: 'Sentence first, crime later — and the sentence has waited long enough.',
        // Mirac signature 2, the finisher — existing phase-4 line preserved verbatim (it is already the best sentence in Mirac\'s file). Spike 1.4, MARK i3 keeps Mirac dot-weak/mark-heavy per its authored identity.
    },
    'clause-of-objections': {
        name: 'The Clause Governing Objections',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        premiseShed: 4,
        stake: true,
        actionText: 'It invokes the clause governing objections — four of your premises are stricken, and you are marked four times for having made them',
        stanceHint: 'The paperwork is flawless. It has had a very long time to proofread.',
        // Greater-Devil signature 1 — adapts the existing phase-2 line and makes its threat literal: premiseShed:2 (spec 33a) strikes banked Premises. One-sentence rule: OBJECTIONS ARE STRICKEN — the trial archetype\'s habit of safely banking premises is inverted at the stake phase. Stake on second slot per b
    },
    'execution-of-the-agreement': {
        name: 'Execution of the Agreement',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.55,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The Devil executes the agreement, and the agreement executes you in five slow instalments',
        stanceHint: 'The flaw in the paperwork was always going to be the counterparty.',
        // Greater-Devil signature 2 — existing phase-4 line preserved verbatim (the pun is load-bearing). Spike 1.4, POISON i3 matching the current finisher payload.
    },
    'the-offered-hand': {
        name: 'The Offered Hand',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It offers its hand the way one does to the late, and takes four fingers\' worth of what you were',
        stanceHint: 'The courtesy is so old it reads as coldness; the appointment is genuine.',
        // Death signature 1 — existing phase-2 line verbatim; it is already Death\'s coveted-die phase in the current sequence, so the stake placement (second slot) is continuity, not invention. Death is unique, not boss, but the deck law names \'bosses/uniques\' for the stake.
    },
    'the-appointment-kept': {
        name: 'The Appointment Kept',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'Death keeps the appointment, punctually, in five parts',
        stanceHint: 'It has never once been early. That was the whole of its mercy, and it is spent.',
        // Death signature 2 — the four-word finisher preserved verbatim (shortest and best telegraph in the roster; brevity IS the punctuality). Top-band spike 1.45. One-sentence rule: THE DEBT COMPOUNDS — the mid-deck DOOM (compound-interest) means turtling out the clock feeds the growth, inverting the vigil
    },
    'dp-first-bell': {
        name: 'The First Bell',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.8,
        effectId: 'debuff_mark',
        actionText: 'The bell counts one, and the one it counts is you',
        stanceHint: 'It takes attendance the way a sexton does — patiently, and for the record.',
        // Opener band (0.8). MARK i1 = your name entered in the parish register; sets up every DoT the deck lands later. Doubles as an appraisal opener for the Butcher and a court roll-call for the King.
    },
    'dp-salt-rescue': {
        name: 'Salt-Rescue',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.85,
        effectId: 'debuff_creeping_doom',
        actionText: 'Drowned hands close about your collar and rescue you, kindly, toward the bottom',
        stanceHint: 'The kindness is sincere, and the kindness is the current — the water is already rising.',
        // Opener band (0.8). DOOM i1 on a common is the archetype thesis: the parish\'s whole doctrine is \'already too late\' — the rising water grows +1/round on its own. Adapted from water-holger\'s \'rescuing you, badly, toward the deep\'.
    },
    'dp-undertow-grip': {
        name: 'Undertow',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.95,
        effectId: 'debuff_bleed',
        intensity: 2,
        actionText: 'The undertow takes your ankles in both cold hands and scrapes two long stripes off the shins',
        stanceHint: 'No malice in it — only the sea\'s old habit of keeping what it holds.',
        // Opener/early-mid band (0.95). BLEED i1 is the brine scraping skin; the physical grab common every brute in the roster can open with.
    },
    'dp-wet-congregation': {
        name: 'The Wet Congregation',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        swayCleanse: 4,
        actionText: 'The drowned congregation sings your mercy back into its pews — two marks for the offering, and four measures of the plea go under with it',
        stanceHint: 'They have heard kinder sermons than yours, and drowned anyway.',
        // Mid band (0.9). The archetype\'s PLEA counterplay: the parish grieves in rows and will not be consoled out of order. Deliberately kept OFF the befriendable bosses (Ferryman, King) so it never fights their designed mercy win-path; it lives on weeping-head, cursed-head, and brine-hag.
    },
    'dp-ninth-bell': {
        name: 'The Ninth Bell',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.2,
        effectId: 'debuff_creeping_doom',
        intensity: 3,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The ninth bell tolls and goes on tolling under your breastbone — three counts of doom, and they compound',
        stanceHint: 'The count is finished; what remains is the arithmetic, collecting.',
        // Heavy mid (1.2), rungs 3 so it is well telegraphed, and the archetype\'s ONE unlockAfterRound card (round 3): the bell cannot toll ninth before the parish has counted. DOOM i2 stacked on any earlier Salt-Rescue DOOM makes a drawn-out fight genuinely lethal — the inevitability engine used exactly whe
    },
    'dp-drowning-drill': {
        name: 'The Drowning Drill',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.15,
        effectId: 'debuff_bleed',
        intensity: 3,
        actionText: 'The drowned run the old rescue drill on you thoroughly, and you come up open in three places',
        stanceHint: 'Every motion is practiced, dutiful, and aimed at the bottom.',
        // Mid band (1.15). BLEED i2 — the drill is thorough. Adapts water-holger\'s \'means to finish the drill\' into a shared escalation the whole drowned crew can execute.
    },
    'dp-grief-swell': {
        name: 'Grief at Spring Tide',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        rungs: 3,
        actionText: 'The whole parish grieves at once, the water stands up with it, and four soft places on you are named',
        stanceHint: 'Every grief the parish ever swallowed surfaces together, and all of it is aimed at you, openly.',
        // Spike band (1.3), rungs 3. The heart-stance finisher for the grieving half of the roster (Belle, Holger, the Ferryman\'s cornered phase). MARK i2 rather than raw cruelty: the grief files you among its dead, and every later tick collects.
    },
    'dp-breaking-sea': {
        name: 'The Breaking Sea',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 3,
        rungs: 3,
        actionText: 'The sea breaks over the whole argument at once and drags you three times across the shingle',
        stanceHint: 'Past patience, past liturgy — the water throws its entire opinion at the matter.',
        // Spike band (1.4), rungs 3. The body-stance finisher for the brutes (larva, float-eye, foot-stealer, Butcher, Hag, doom-egg). BLEED i2 is the surf dragging you over shingle.
    },
    'dp-lead-bell': {
        name: 'A Bell Sewn Under the Hem',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        curseCardId: 'mouthful-of-brine', // designer: curse-swallowed-bell
        actionText: 'Cold fingers sew a small lead bell into the hem of your coat, and it begins, quietly, to ring',
        stanceHint: 'The stitching is small, deliberate work — somewhere a ledger gains a line with your name on it.',
        // THE archetype\'s single curse-injector (mid band 1.0). curse-swallowed-bell: a rank-1 \'curse\'-theme player card — The Swallowed Bell — whose paid line is \'PURGE this curse\' and whose free line is a small self-toll, per brief §4.4. Graded \'escalation\' because the schema\'s grade enum has no inj
    },
    'sig-ferryman-toll': {
        name: 'The Toll Is Named',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        // BIG NUMBERS (2026-09-02): re-banded 0.21 -> 1.3. The near-harmless
        // naming-of-terms was an artefact of the retired THREAT_DAMAGE_SCALE; under
        // §5.3 the Ferryman's opener has to open like a boss's.
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The Ferryman names the toll — twice your weight in it — and your objection is not legal tender',
        stanceHint: 'He waits with the patience of a schedule that has never once been missed.',
        // Ferryman signature opener — his phase-1 line survives, re-pointed at a
        // number: the toll is named at twice your weight and the objection is not
        // legal tender. Signature band 1.3, MARK i2.
    },
    'sig-ferryman-far-bank': {
        name: 'The Far Bank, Described',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'He describes the far bank until you cannot remember the near one, and marks four of your crossings as already made',
        stanceHint: 'He listens past your words, appraising what you could not afford to lose.',
        // Ferryman stake card (second in deck, per boss law — his current sequence had no stake authored; this fixes that gap). The coveted-die wager IS the toll: he has named a price and now holds something of yours against it. Mid band 1.0, MARK i2. Deliberately no swayCleanse — Control/mercy is his designe
    },
    'sig-king-grievance': {
        name: 'The Wrong No One Living Recalls',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 3,
        stake: true,
        actionText: 'The King rages over the wrong no one living recalls, and lays three of the old bruises on you for it',
        stanceHint: 'Beneath the crown there is no head — only the grievance, holding the shape of one.',
        // King of Revenge stake card (second in deck, matching where his existing sequence authors stake:true today). Inherits his phase-2 line and hint verbatim — the strongest image in the archetype. Early-mid 0.85 keeps the ramp honest under the two big cards behind it.
    },
    'sig-king-last-ruling': {
        name: 'The Last Cold Ruling',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 4,
        actionText: 'The King makes one last cold, kingly ruling upon you, and the sentence rots in five clauses',
        stanceHint: 'Cornered, the old grievance turns sly again, plotting the cruelest lawful ruin.',
        // King of Revenge finisher — inherits his existing phase-4 spike exactly (1.4, POISON i3). Rungs 4: a boss-grade telegraph the player can still object to (STAGGER) if they have kept the tools. The one-sentence boss rule stays intact: the court that drowned still rules in ascending order — sentence, ra
    },
    'gc-the-lovely-request': {
        name: 'The Lovely Request',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        actionText: 'It asks, beautifully, for something you will miss, and does not wait to be handed it',
        stanceHint: 'The request is a trap already sprung; it is merely observing the forms.',
        // Adapted verbatim from enemy-ghast phase 1 (the archetype\'s thesis statement). Opener band 0.85; the MARK is the court entering you in its ledger of wants.
    },
    'gc-the-glitter': {
        name: 'The Glitter',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.8,
        effectId: 'debuff_mark',
        actionText: 'Something about it catches the light exactly the way you hoped, and takes the hand you reach with',
        stanceHint: 'It feeds on wanting; the whole courtship is an appeal to your appetite.',
        // Generalized from enemy-jeweled-tree phase 1. The temptation opener — the court baits before it bills. Lightest weight in the pool (0.8) because the hook, not the hit, is the point.
    },
    'gc-the-begging-fist': {
        name: 'The Begging Fist',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'body',
        damageWeight: 1.0,
        actionText: 'It begs with a raised fist, and the fist arrives well ahead of the asking',
        stanceHint: 'The asking is a formality; the arm was always going to follow.',
        // Adapted from enemy-bull-begger phase 1. Clean opener, no effect — the heaviest common opener (0.95) because it carries no debuff, matching the existing bull-begger contour (clean opener heavier than debuff-bearing mid).
    },
    'gc-where-the-reach-begins': {
        name: 'Where the Reach Begins',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.9,
        effectId: 'debuff_bleed',
        intensity: 2,
        actionText: 'It takes without waiting for the answer, and opens two seams doing it',
        stanceHint: 'The manners end where the reach begins.',
        // Adapted verbatim from enemy-ghast phase 2 — the archetype\'s namesake beat. Flexible opener/mid (0.9, BLEED 1): serves ghast\'s mid, and the opener slot for naga coils, sidelle\'s talon-drag, pale-brood\'s tearing lunge, and boss appetites that skip the pleasantries.
    },
    'gc-the-howl-at-being-answered': {
        name: 'The Howl at Being Answered',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It howls at the insult of being answered at all, and the howl leaves two marks where your ears were',
        stanceHint: 'Refusal and charity anger it equally; what it loves is the asking.',
        // Adapted from enemy-bull-begger phase 2; doubles as pale-brood\'s keening (the aggrieved-cry mid). Mid band 0.9 + MARK.
    },
    'gc-the-patient-inch': {
        name: 'The Patient Inch',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'body',
        damageWeight: 1.0,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'It tightens its hold an inch per point conceded, and three ribs learn the new arithmetic',
        stanceHint: 'It does not need you wrong — only within reach, which you now are.',
        // Adapted from enemy-ogre-naga phase 2 (exact weight and payload: 1.1, MARK 2). The pool\'s heavy mid — constriction as courtesy withdrawn by degrees. Deliberately sized to fill the boss position-3 slot (mid band tops at 1.2) so bosses ramp through it into their signature spikes.
    },
    'gc-thanks-given-sincerely': {
        name: 'Thanks, Given Sincerely',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.3,
        actionText: 'It thanks you, sincerely, while taking the rest of you off the table',
        stanceHint: 'Cold and gracious to the end — the etiquette was always the appetite.',
        // Adapted verbatim from enemy-ghast phase 3 — the archetype\'s finishing sentiment. Spike band floor (1.3), no effect: the taking is total, gratitude included. Serves as the gracious-conclusion finisher for ghast, jeweled-tree (the transaction completes), and ogre-naga (the closing statement).
    },
    'gc-the-alms-you-owed': {
        name: 'The Alms You Owed',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 3,
        unlockAfterRound: 3,
        actionText: 'It takes the alms it decided you owed, by main strength, and bleeds you three times for the interest',
        stanceHint: 'All pretense of petition gone — the collection is by main strength.',
        // Adapted verbatim from enemy-bull-begger phase 3. The pool\'s one unlockAfterRound escalation: the court will not be hurried through its forms — the collection cannot arrive before round 3. At its authored deck slots (always position 3) the gate is a backstop rather than a bite, which keeps it safe a
    },
    'gc-the-standing-invitation': {
        name: 'The Standing Invitation',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.05,
        curseCardId: 'gnaw-marks', // designer: curse-guest-debt
        actionText: 'It enters your name in the guest book in ink you did not offer, and the invitation follows you home',
        stanceHint: 'The welcome is heartfelt, which is precisely what makes it binding.',
        // THE archetype\'s single curse-injector. curse-guest-debt: a rank-1 PURGE-line curse — hospitality as a debt instrument shuffled into the player\'s deck. Deployed sparingly: only Lady Gabriella\'s opener (the hostess is the one who keeps the book). Mid-band weight 0.9 so the injection, not the hit, i
    },
    'rawhead-the-grin-from-the-stories': {
        name: 'The Grin from the Stories',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It grins the grin from every story you were told too young, and four of those nights come due at once',
        stanceHint: 'It knows exactly which bedtime warning you are remembering, because it is the warning.',
        // Rawhead-Rex signature 1 — his existing phase-2 stake beat preserved intact (the coveted-die wager lands on the grin, where it always was). Deck position 2 per boss law.
    },
    'rawhead-a-hundred-years-of-courtesy-ended': {
        name: 'A Hundred Years of Courtesy, Ended',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 3,
        actionText: 'Rawhead ends the courtesy it extended for a hundred years, and opens you in five places for the anniversary',
        stanceHint: 'The stairs are behind it now; nothing about it is under anything anymore.',
        // Rawhead-Rex signature 2 — his existing finisher, promoted to a sized threat (rungs 3, per the elder-fire-giant/gabriella boss-finisher precedent). The archetype\'s one-sentence boss rule embodied: the cellar-thing that spent a century observing the forms stops observing them. Spike 1.4, BLEED 3.
    },
    'gabriella-the-clinical-inquiry': {
        name: 'The Clinical Inquiry',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        swayCleanse: 4,
        stake: true,
        actionText: 'She inquires after your health with clinical accuracy, and the answer costs you four measures of your charm',
        stanceHint: 'Between courses she appraises, cold as cellar stone, what is worth keeping.',
        // Lady Gabriella signature 1 — her phase-2 swayCleanse identity survives verbatim, now carrying the boss stake as well: the wager and the appraisal are the same cold look. Deck position 2 per boss law.
    },
    'gabriella-four-centuries-at-table': {
        name: 'Four Centuries at Table',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.6,
        rungs: 3,
        actionText: 'Four centuries of appetite arrive at the table at once, and you are the only course laid',
        stanceHint: 'The last human habit gives way, with sincere regret, to the older ones.',
        // Lady Gabriella signature 2 — her existing rungs-3 finisher preserved intact. Spike 1.4, no effect: the appetite needs no garnish.
    },
    'beelzebub-the-vote-of-the-air': {
        name: 'The Vote of the Air',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'The swarm votes, the air abstains from you, and four motions carry into the skin',
        stanceHint: 'Beneath the lord\'s stillness, ten million constituents reach alignment.',
        // Beelzebub signature 1 — his existing phase-2 stake beat preserved (the wager is put to a vote; the vote is unanimous). Deck position 2 per boss law.
    },
    'beelzebub-the-final-motion': {
        name: 'The Final Motion',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'Beelzebub ratifies the final motion; the swarm descends as one and lays five eggs of rot in the wound',
        stanceHint: 'The lord of everything that swarms calls the question, and the question is you.',
        // Beelzebub signature 2 — his existing finisher intact. Spike 1.45, POISON 3: enforcement is unanimous.
    },
    'arch-demon-your-file-read-aloud': {
        name: 'Your File, Read Aloud',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It reads your file aloud with commentary, and four of the entries take effect as it reads them',
        stanceHint: 'Somewhere below, lesser devils are already processing the outcome.',
        // Arch-Demon signature 1 — his existing phase-2 stake beat preserved (the coveted die is an agenda item). Deck position 2 per boss law.
    },
    'arch-demon-the-discretion': {
        name: 'The Discretion',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The appetite executes its mandate in full, and five parts of it stay in you afterward',
        stanceHint: 'The promotion came with discretionary powers, and this is the discretion.',
        // Arch-Demon signature 2 — his existing finisher intact. Spike 1.45, POISON 3: appetite promoted past restraint, exercised.
    },
    'of-bedrock-grievance': {
        name: 'Bedrock Grievance',
        archetype: 'old-fires',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        actionText: 'The ground under you concedes the point, withdraws its support, and you land on the concession',
        stanceHint: 'Its footwork is geological; you are fighting terrain that moves.',
        // Shared body opener (0.85, opener band 0.8-1.0). Inherits the role of fire-giant\'s old \'plants a foot and the ground concedes the point\' phase, rewritten enemy-agnostic so any old-fires roster member can open with it. MARK i1 seeds the archetype\'s slow-arithmetic feel without front-loading pressu
    },
    'of-slow-kiln': {
        name: 'Slow Kiln',
        archetype: 'old-fires',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_poison',
        actionText: 'The air arranges itself into a kiln around you and begins, patiently, on the glaze',
        stanceHint: 'It has fired harder clay than you, and is in no hurry about the glaze.',
        // Shared mind opener (0.85). The archetype\'s \'old fire thinks slowly and exactly\' register as a common: ambient heat as deliberation. POISON i1 is the patient burn.
    },
    'of-grief-of-magma': {
        name: 'Grief of Magma',
        archetype: 'old-fires',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'The deep heat grieves upward, and the grieving scalds three ways through your coat',
        stanceHint: 'Under the wrath is an older loneliness — fire remembers when everything was fire.',
        // Shared heart opener/mid (0.9). The archetype\'s sorrow face: heat that never got to be the whole world again. Doubles as the-abortive\'s natural opener (pressure that never surfaced), keeping the unique\'s grief register without a bespoke card.
    },
    'of-cauter-seam': {
        name: 'Cauter-Seam',
        archetype: 'old-fires',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.95,
        enemyCleanse: 1,
        actionText: 'A crack in it brightens and seals itself smooth as glass, and the light off the weld takes the skin off your face',
        stanceHint: 'It treats injury as an engineering problem it solved once, at the founding of the world.',
        // Shared cauterize common (0.95, no player debuff — the turn\'s threat IS the self-repair). Carries the archetype identity (enemyCleanse) into the shared pool. Not slotted in the three current decks (both giants cauterize via their signature stake cards, per their existing sequences); this is the benc
    },
    'of-the-long-eruption': {
        name: 'The Long Eruption',
        archetype: 'old-fires',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.2,
        effectId: 'debuff_creeping_doom',
        intensity: 2,
        actionText: 'Pressure that built for an age finds its vent, and the vent is you — two grades of doom, rising',
        stanceHint: 'Geology does not do warning shots; the buildup was the mercy.',
        // Shared escalation (1.2, top of mid band). Lands DOOM i1 on the player — the brief\'s inevitability engine, pointed the other way: heat that grows +1 intensity per round, \'already too late\' as an enemy verb. The archetype\'s signature debuff choice. For the-abortive this is the never-erupted erupti
    },
    'of-orogeny': {
        name: 'Orogeny',
        archetype: 'old-fires',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The slow collision that raises mountains resumes with you between the plates, and three seams of you begin to cook',
        stanceHint: 'It has been pushing since before names; the schedule is measured in strata.',
        // The archetype\'s unlockAfterRound escalation (rage-gate: locked until round 3 — mountain-building does not hurry for you). 1.3 sits at the bottom of the spike band; when slotted penultimate (fire-giant deck) the ramp to the 1.45 finisher still holds, and it can serve as the outright finisher for any
    },
    'of-tithe-of-cinders': {
        name: 'Tithe of Cinders',
        archetype: 'old-fires',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.1,
        curseCardId: 'arrears', // designer: curse-clinker
        actionText: 'It presses a live coal into your keeping, and your keeping closes around it whether you agree or not',
        stanceHint: 'A gift, by fire\'s etiquette — and warmth of this vintage keeps a ledger of what it is owed.',
        // THE archetype\'s single curse-injector. On a landed threat, shuffles `curse-clinker` into the player\'s combat deck — a rank-1 CURSE: a lump of fused slag that will not burn and will not leave; FREE line a 1-tick ember self-singe, paid line \'PURGE this curse\'. Old fire pays its debts in clinker: t
    },
    'fg-mountains-spine-appraisal': {
        name: 'The Mountain\'s Spine',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        enemyCleanse: 1,
        stake: true,
        actionText: 'He appraises you down the length of the mountain\'s spine, strikes once for the audit, and his own wounds close over like cooling rock',
        stanceHint: 'Old fire thinks slowly and exactly, like cooling stone.',
        // Fire-giant signature #1 — his existing cauterize phase kept line-for-line, promoted to the stake slot (boss law: stake on exactly the second card). The wager rides on the appraisal: he cauterizes while coveting your die, so answering the stake means racing his self-repair.
    },
    'fg-the-sword-remembers': {
        name: 'The Sword Remembers',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 3,
        actionText: 'The sword remembers being a mountain and falls like one, and five strata of heat stay behind in the wound',
        stanceHint: 'The genealogy arrives all at once, ancestor by burning ancestor.',
        // Fire-giant signature #2 — his existing finisher preserved verbatim (the best line in the archetype). Spike 1.45, rungs 3 per the existing sequence\'s authored intent: the full weight is a sized threat, not the flat default.
    },
    'efg-outlived-its-eruption': {
        name: 'Outlived Its Own Eruption',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        enemyCleanse: 2,
        stake: true,
        actionText: 'The elder considers you with the patience of a thing that outlived its own eruption, hits you once for the interruption, and two of its old scars glass over',
        stanceHint: 'Old flame plans in centuries; you are a brief agenda item.',
        // Elder-fire-giant signature #1 — his existing stake+cauterize phase preserved verbatim in the mandated second slot. The boss-tier version of fire-giant\'s answer: same verb, older scars.
    },
    'efg-burns-once-entirely': {
        name: 'Once, Entirely',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 6,
        rungs: 4,
        actionText: 'The oldest fire in the world burns, once, entirely, and leaves six ages of ember in you',
        stanceHint: 'Whiteness is what flame becomes when it stops needing to prove anything.',
        // Elder-fire-giant signature #2 — existing finisher preserved verbatim. Spike 1.45 at the authored rungs-4 ceiling: the boss finisher outright demands more STAGGER than the flat default, exactly as the current sequence intends.
    },
    'ab-the-unsaying': {
        name: 'The Unsaying',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It unsays the part of the world that took its place, and four parts of you go with it',
        stanceHint: 'Displacement is the only theology it was taught, and it studied.',
        // The-abortive signature #1 — its existing second phase preserved verbatim, carrying the stake it already holds today. Flagged: the-abortive is a unique, not a boss, but brief §7 puts the stake law on bosses/uniques and its current sequence stakes this exact phase — a bespoke second card is the only w
    },
    'ab-one-more-beginning': {
        name: 'One More Beginning',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The unbegun god tries, one more time, to begin — through you, in five places',
        stanceHint: 'Its patience predates its existence, and both predate your defenses.',
        // The-abortive signature #2 — its existing finisher preserved verbatim. Spike 1.45; heart-stance close, per its existing all-grief final arc.
    },
    'first-knock': {
        name: 'First Knock',
        archetype: 'omen-choir',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        actionText: 'The first knock sounds against the thin place under your feet, and something under it answers',
        stanceHint: 'Something is measuring the ground the way a clerk measures a coffin — for someone particular.',
        // The archetype\'s universal opener, adapted from wichtlein phase 1. The doom introduces itself politely; no payload yet — the knock IS the warning. Opener band 0.8.
    },
    'the-tally-mark': {
        name: 'The Tally-Mark',
        archetype: 'omen-choir',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        actionText: 'A fresh error is marked against your name, and the pen goes in far enough to reach you',
        stanceHint: 'No voice is raised; the discrepancy is simply noted, and kept.',
        // Adapted from tri-eyes phase 1 — the archetype\'s core noun made a card. MARK i1 is the tally itself: every later DoT tick collects on the entry. Opener/mid, 0.85.
    },
    'wept-in-advance': {
        name: 'Wept in Advance',
        archetype: 'omen-choir',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It weeps for you, specifically, ahead of the event, and grief that punctual leaves two bruises',
        stanceHint: 'The grief is not for itself — the ending it has read arrives wearing your gait.',
        // Kudan phase 2\'s line generalized: the choir\'s mourning is pre-emptive. Heart common so every deck can telegraph grief before doom. Mid band 0.9.
    },
    'the-downbeat': {
        name: 'The Downbeat',
        archetype: 'omen-choir',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The rhythm cracks across you on the downbeat, twice, on the beat both times',
        stanceHint: 'Every beat is defended like territory; the measure was marked out before you arrived.',
        // Sugata phase 2 (the tambourine on the downbeat) made archetype-wide: the already-written keeps time. Doubles as the loom\'s beat for frayed-one and fate-spinner (\'beating the weft\' is a real weaving verb). Body common, 0.95.
    },
    'deemed-redundant': {
        name: 'Deemed Redundant',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.1,
        effectId: 'debuff_mark',
        intensity: 3,
        premiseShed: 4,
        actionText: 'It answers itself before you can, strikes four of your premises as redundant, and marks the three worst of them',
        stanceHint: 'The voices differ only about which of them loves you less.',
        // Zoma\'s premiseShed identity as a card (existing phase 2 verbatim in spirit): the archetype\'s counterplay against the CONDEMN track — your premises are struck as already-answered. Lives in the zoma family plus tri-eyes-hollowed (see deck note). Mid band 1.05.
    },
    'the-written-line': {
        name: 'The Written Line',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        curseCardId: 'overheard-name', // designer: curse-already-written
        actionText: 'It writes one line of you ahead of time and files it among the cards you have not drawn',
        stanceHint: 'Somewhere in what you have not yet drawn, the sentence is already waiting.',
        // THE archetype\'s single curse-injector. Shuffling \'curse-already-written\' into the player\'s deck IS the flavor — your future draws now contain a sentence someone else wrote. Intended player curse: rank-1 curse-theme junk, FREE line a small self-MARK, paid line \'PURGE this curse\'. No effectId — 
    },
    'third-knock': {
        name: 'Third Knock',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        unlockAfterRound: 3,
        actionText: 'The third knock — and the thing it was knocking on gives way, and you go through it in four places',
        stanceHint: 'The omen stops predicting the collapse and becomes it.',
        // Wichtlein\'s finisher, kept verbatim — the best line in the archetype. Carries the pool\'s one unlockAfterRound (3): the third knock will not be hurried, even by a player racing the sequence. Body spike 1.35.
    },
    'the-calamity-spoken': {
        name: 'The Calamity, Spoken',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.25,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'It speaks the calamity at last; the first word is your name and the next three take root',
        stanceHint: 'The prophecy was always going to be delivered; it only needed a listener.',
        // Kudan\'s final line promoted to the archetype\'s heart-stance spike: the prophecy delivered as lingering rot (POISON i2 — spoken doom persists). Heart spike 1.3, closes kudan/sugata/bone-totem/zoma decks.
    },
    'the-count-completes': {
        name: 'The Count Completes',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The count completes, you are the remainder, and the remainder is carried in three',
        stanceHint: 'The ledger closes with the satisfaction of zero.',
        // Tri-eyes-hollowed\'s final phase verbatim — the tally family\'s cold mind-stance spike. Mind spike 1.35, closes frayed-one/tri-eyes/tri-eyes-hollowed and serves as tezcatlipoca\'s finisher.
    },
    'the-tapestry-shown': {
        name: 'The Tapestry, Shown',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 3,
        stake: true,
        actionText: 'He shows you the tapestry with your next three mistakes already woven, and pulls all three tight',
        stanceHint: 'There is an old sorrow in the showing — he has never once been surprised.',
        // Fate-spinner signature 1, adapted from its existing phase 2 (which carried the stake). Carries stake:true as the boss\'s SECOND deck card — wagering the coveted die on a future he has already woven is the whole character. Mid band 0.9.
    },
    'the-pattern-pulled-taut': {
        name: 'The Pattern Pulled Taut',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The Spinner pulls the pattern taut and your part in it concludes, unravelling five threads at once',
        stanceHint: 'The final motif was always going to be a struggle, rendered beautifully.',
        // Fate-spinner signature 2 — its existing final phase preserved (1.4→1.45, POISON i3 kept). Boss spike 1.45.
    },
    'the-warm-unison': {
        name: 'The Warm Unison',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'They invite you, warmly, in unison, to concur — and four parts of you concur before you can stop them',
        stanceHint: 'Agreement at this register is gravitational; dissent takes effort they no longer spend.',
        // Zoma-ascendant signature 1, its existing phase 2 (which carried the stake) preserved. The one-sentence boss rule: the arguing was the safety mechanism, and it is off — agreement is the threat. stake:true, boss\'s SECOND card. Mid band 0.95.
    },
    'verdict-without-seam': {
        name: 'Verdict Without Seam',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The twin verdict lands as one sentence with no seam in it, and rots five ways from the middle',
        stanceHint: 'What the arguing held back, the agreement delivers entire.',
        // Zoma-ascendant signature 2 — the existing final phase preserved (1.45, POISON i3). Boss spike.
    },
    'the-kept-reflection': {
        name: 'The Kept Reflection',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It shows you the version of you that already lost, at leisure, and lends you four of its wounds',
        stanceHint: 'There is grief in the glass — every reflection it keeps was somebody\'s best attempt.',
        // Tezcatlipoca signature 1, its existing phase 2 (which carried the stake) preserved verbatim. Wagering the coveted die against a mirror that already owns your losing self. stake:true, boss\'s SECOND card. Mid band 0.95.
    },
    'the-tally-reconciled': {
        name: 'The Tally, Reconciled',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        // Tri-Eyes' preserved bearer-afflictions-gte-3 branch (WS9): written
        // past legibility, the ledger stops pleading and reconciles itself —
        // shedding one of its own entries. Forks ported verbatim from the
        // pre-rework authored sequence (@ a69eab56).
        branch: {
            condition: { kind: 'bearer-afflictions-gte', n: 3 },
            then: {
                stance: 'mind', damageWeight: 1.2, enemyCleanse: 2,
                actionText: 'It strikes the two deepest entries from the ledger of itself, sheds the ache of them, and turns a corrected eye on you',
                stanceHint: 'Written past legibility, it stops pleading and coldly reconciles the account.',
            },
            else: {
                stance: 'heart', damageWeight: 1.35,
                effectId: 'debuff_mark', intensity: 4,
                actionText: 'It recounts your every misstep until your hand falters, four entries deep',
                stanceHint: 'There is something almost pleading in how badly it wants the tally to balance.',
            },
        },
        actionText: 'It recounts your every misstep until your hand falters, four entries deep',
        stanceHint: 'There is something almost pleading in how badly it wants the tally to balance.',
        // The archetype's one branching card. Base fields describe the else-fork (the pleading recount, the common case); the then-fork is the cold reconciliation that sheds an affliction when the ledger itself is written past legibility.
    },
    'smoke-through-the-seams': {
        name: 'Smoke Through the Seams',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 4,
        // Tezcatlipoca's preserved prior-threat-fully-blocked branch: a full
        // block turns the next action rider-heavy (the smoke pours around the
        // wall) instead of damage-heavy. Forks verbatim from the pre-rework
        // authored sequence.
        branch: {
            condition: { kind: 'prior-threat-fully-blocked' },
            then: {
                stance: 'heart', damageWeight: 1.0,
                effectId: 'debuff_poison', intensity: 5,
                actionText: 'Denied the blow, the smoke pours through the seams of your guard and settles in five places you cannot armour',
                stanceHint: 'Your wall was a reflection too; what it cannot strike, it keeps.',
            },
            else: {
                stance: 'mind', damageWeight: 1.4,
                effectId: 'debuff_mark', intensity: 4,
                actionText: 'The mirror angles, your certainty falls out of frame, and four pieces of it do not come back',
                stanceHint: 'It edits with the courtesy of a god who has already seen the final cut.',
            },
        },
        actionText: 'The mirror angles, your certainty falls out of frame, and four pieces of it do not come back',
        stanceHint: 'It edits with the courtesy of a god who has already seen the final cut.',
        // Tezcatlipoca signature 2 — the mandated preservation of its prior-threat-fully-blocked branch, forks copied verbatim from the repo. Base fields describe the else-fork (the heavier, common case); the then-fork is the authored rider-heavy exception (0.5 weight, POISON i3) that punishes a full block. I
    },
    'litany-of-thresholds': {
        name: 'Litany of Thresholds',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'The Doorwarden lays a threshold under your feet; it declines to be crossed, and takes the four steps you had left',
        stanceHint: 'He worships thresholds; where you would step, a doctrine has already been installed.',
        // Opener, band 0.8-1.0 at 1.0 (preserves the current phase\'s default weight). MARK i2 seeds the deck\'s whole-fight tax: every door he closes hits harder for the doors already closed.
    },
    'the-door-kept-open': {
        name: 'The Door You Kept Open',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'He closes a door you were keeping open in your head, and the four rooms behind it go dark with you inside',
        stanceHint: 'Every door that ever shut is remembered in him, and he consults the memory alphabetically.',
        // Second card, stake:true per boss law (preserves current placement). Mid band at 0.9 — the wager card is deliberately the lightest hit, so the coveted-die tension is the threat, not the number.
    },
    'the-bronze-frame': {
        name: 'The Bronze Frame, Swung',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'The bronze frame swings through you like a door through a draught and marks four hinges of you',
        stanceHint: 'Sermon concluded, the hinge-priest recalls that he is mostly hinge.',
        // Mid-spike at 1.2 (top of mid band), the punish that enforces his one-sentence rule.
    },
    'what-shuts-stays-shut': {
        name: 'What Shuts, Stays Shut',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_mark',
        intensity: 6,
        actionText: 'Every door he remembers shuts at once and you are the room — six bolts, all of them yours',
        stanceHint: 'The liturgy reaches its one commandment: what shuts, stays shut.',
        // Finale spike at 1.4 (band 1.3-1.5), MARK escalates to i3 so the accumulated MARK stacks make this the fight-defining hit. Preserves the current phase-4 calibration.
    },
    'the-drawer-opens': {
        name: 'The Drawer Opens at Your Name',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 3,
        curseCardId: 'overheard-name', // designer: curse-misfiled-entry
        actionText: 'A drawer opens at your name, issues the first three thousand paper cuts, and files a page of its own among yours',
        stanceHint: 'It catalogues before it strikes; the cuts arrive pre-filed, and so does the forgery.',
        // THE ARCHETYPE\'S ONE CURSE INJECTOR (exactly one per archetype, per deck law). On a landed opener, shuffles curse-misfiled-entry into the player\'s combat deck — the Index attacks the one place players treat as safe ground: their own pages. Opener band at 1.0 (current default weight preserved); BLEE
    },
    'filed-under-kindling': {
        name: 'Filed Under KINDLING',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_poison',
        intensity: 3,
        stake: true,
        actionText: 'It misfiles you under KINDLING, shelves you beside the lamp oil, and lets three pages of you catch',
        stanceHint: 'The Archive\'s errata smoulder; a truth in the wrong place is an accelerant.',
        // Second card, stake:true per boss law (current placement preserved). Mid band 0.9; the DoT pivots from BLEED to ramping POISON — a misfiled truth burns slow and gets worse.
    },
    'oak-and-iron': {
        name: 'Oak and Iron',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_bleed',
        intensity: 5,
        actionText: 'The card-drawer ribs slam open and shut on whatever of you is nearest, five times',
        stanceHint: 'Out of patience with citation, the golem remembers its shelving is oak and iron.',
        // Mid-spike 1.2, the deck\'s lone body stance — the librarian stops citing and starts crushing.
    },
    'the-errata-read-aloud': {
        name: 'The Errata, Read Aloud',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'It reads out every wrong entry ever filed about you, and the reading scalds five corrections deep',
        stanceHint: 'The whole errata at once: a bonfire of corrections, and you are the margin they burn in.',
        // Finale spike 1.4, POISON i3 — the full misfiled record detonating as DoT pressure. Preserves current phase-4 calibration.
    },
    'your-position-improved': {
        name: 'Your Position, Improved',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        rungs: 2,
        actionText: 'The Sophist restates your position, improved, and aims it back at you — four of your own points, sharpened',
        stanceHint: 'He fights with borrowed premises — yours, mostly, held at a more flattering angle.',
        // Opener at 1.0 (current default preserved) with the authored rungs:2 softening kept — a deliberately STAGGER-vulnerable opening so the player tastes objection working before the redactions begin.
    },
    'a-courteous-concession': {
        name: 'A Courteous Concession',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'He concedes a point you had not made yet, courteously, like a trap, and the trap has four teeth',
        stanceHint: 'The etiquette is the blade; the house eats the courteous last.',
        // Second card, stake:true per boss law (current placement preserved). The deck\'s lone heart stance — the trap is emotional, not logical. Mid band 0.9.
    },
    'signed-in-thirds': {
        name: 'Signed in Thirds',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 4,
        premiseShed: 5,
        actionText: 'He strikes your five best premises from the record and signs the deletion in thirds, marking four of the erasures',
        stanceHint: 'Centuries of clerkship: what he cannot win he redacts.',
        // Mid-spike 1.2, the premiseShed identity card — sheds 3 spendable Premises on Overwhelm, the flagship counterplay against the CONDEMN track. Preserves the Phase 33b calibration exactly.
    },
    'your-opening-perfected': {
        name: 'Your Opening Move, Perfected',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'The Sophist closes the argument with your own opening move, perfected, and it rots in five places yours never would have',
        stanceHint: 'The narration stops being about you and starts happening to you.',
        // Finale spike 1.45 (band ceiling for the Act III finale), POISON i3. Preserves current phase-4 calibration.
    },
    'the-sentence-outside': {
        name: 'The Sentence From Outside',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'The Unfinished plays a truth your system cannot express; your reply dies unprovable, and four axioms die with it',
        stanceHint: 'It begins from outside every axiom you brought; you cannot see the floor it stands on.',
        // BIG NUMBERS (2026-09-02): the 0.21/0.232/0.271/0.326 Aporia calibration is
        // RETIRED — it was a divisor against the old global scale and left the
        // labyrinth bosses harmless once that scale went to 1. Re-banded to the
        // signature 1.3-1.6 spread with the authored ordering intact (this opener
        // stays the lightest of the four).
    },
    'the-true-thing-about-you': {
        name: 'The True Thing About You',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        stake: true,
        actionText: 'It lays down the true sentence about yourself that you will never be able to prove, and four parts of you agree with it',
        stanceHint: 'For a moment it grieves for you, the way one grieves for a house that believes it is finished.',
        // Re-banded 0.232 -> 1.35 (see the-sentence-outside). Second card, stake
        // intact; MARK i2 -> i4, and the text names the four.
    },
    'a-new-axiom': {
        name: 'A New Axiom',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 5,
        enemyHeal: 120,
        actionText: 'It takes your strongest argument into its hand, files it as a new axiom, knits itself whole on the strength of it, and marks you five times with your own reasoning',
        stanceHint: 'Whatever you add to it, it contains; whatever wounds it becomes another thing it survives.',
        // Re-banded 0.271 -> 1.45. MARK i3 -> i5 and enemyHeal 8 -> 120: at the
        // new VITAE scale (the Unfinished carries thousands) a flat 8 was not a
        // self-knit, it was a rounding error. The habit inversion is unchanged —
        // your biggest turn becomes its newest axiom, and it grows on it.
    },
    'you-cannot-go-on': {
        name: 'You Cannot Go On',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_mark',
        intensity: 6,
        actionText: 'It proves, within you, the statement that you cannot go on — six times, and you cannot refute one of them',
        stanceHint: 'There is no triumph in it; the proof was never finishable, it only needed you to stop.',
        // Re-banded 0.326 -> 1.6, the deck spike. MARK i3 -> i6 (isFinalPhase still
        // has no schema field here; the orchestrator sets it at compile). Most
        // losses to this deck are the round cap, which is the theme.
    },
    // ── rangda — the widow-queen (bone-clergy signature pair; her existing
    //    swayCleanse "inured to charm" identity survives the rework) ──────────
    'the-widows-keening': {
        name: "The Widow's Keening",
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        rungs: 2,
        actionText: 'Rangda keens, and the curse arrives still weeping — four hexes, every one of them hers',
        stanceHint: 'Grief that learned sorcery; every hex is a lesson she passed alone.',
    },
    'syllabus-of-accusation': {
        name: 'Syllabus of Accusation',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_poison',
        intensity: 3,
        swayCleanse: 5,
        stake: true,
        actionText: 'She recites the syllabus of four hundred years of accusation; three charges take in the blood, and what you were pleading with is struck out',
        stanceHint: 'Each charge they invented, she studied; the coursework is in your blood now.',
    },
    'the-mask-comes-away': {
        name: 'The Mask Comes Away',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.6,
        effectId: 'debuff_mark',
        intensity: 6,
        actionText: 'The mask comes away and four centuries of studied grief go into you at once, six wounds wide',
        stanceHint: 'Love with nowhere to go, four centuries compounded, finds somewhere.',
    },
    // ══════════════════════════════════════════════════════════════════════
    // THE BIG NUMBERS REWRITE (2026-09-02) — TIER-3 / STAGE CARDS.
    // 49 closing moves (7 per archetype) authored to the new §5.3 band:
    // signature 1.3-1.6, escalation 1.0-1.3. These are what a boss plays when
    // the fight becomes another fight — deck tier3, or a stage's appended
    // tier. Every intensity printed here is an authored constant and is named
    // in the actionText; the damage number is engine-computed and appended by
    // buildThreatAction, so the text stays level-honest.
    // ══════════════════════════════════════════════════════════════════════

    // ── drowned-parish: tier-3 ────────────────────────────────────────────
    'dp-the-tide-called-in': {
        name: 'The Tide, Called In',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 4,
        actionText: 'The whole cold weight of the tide is called in at once, and it collects five ways down your back',
        stanceHint: 'The sea never raises its voice. It simply arrives, all of it, because it was asked to.',
    },
    'dp-the-register-closed': {
        name: 'The Register, Closed',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'The parish register closes on your page, and five entries under your name are declared settled',
        stanceHint: 'Every name in that book drowned. The book has never once been wrong about that.',
    },
    'dp-vespers-under-water': {
        name: 'Vespers, Under Water',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_creeping_doom',
        intensity: 3,
        actionText: 'Vespers is sung to you underwater, three verses of it, and the water keeps time inside your lungs',
        stanceHint: 'The choir stopped needing air a long while ago, and is patient about the fact that you have not.',
    },
    'dp-the-hem-lets-go': {
        name: 'The Hem Lets Go',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 4,
        actionText: 'The hem of the deep lets go of everything it was holding, and all of it lands on you at once',
        stanceHint: 'There is a great quantity of drowned down there, and it has just been given permission.',
    },
    'dp-your-name-on-the-bell': {
        name: 'Your Name on the Bell',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_creeping_doom',
        intensity: 4,
        actionText: 'Your name is cast into the bell metal four founders deep, and every toll from now finds you by it',
        stanceHint: 'Sound travels well in water. So does what the sound was cast for.',
    },
    'dp-the-salvage-claim': {
        name: 'The Salvage Claim',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 4,
        swayCleanse: 4,
        actionText: 'The parish files salvage on you, marks four fittings worth keeping, and hauls up the mercy you were offering',
        stanceHint: 'What the sea holds long enough becomes the sea\'s. You have been in it a while now.',
    },
    'dp-brine-in-the-lungs': {
        name: 'Brine in the Lungs',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.25,
        effectId: 'debuff_poison',
        intensity: 4,
        actionText: 'Brine is worked into your lungs the patient way, four handfuls, and none of it comes back out',
        stanceHint: 'It has drowned a hundred better swimmers and remembers the technique fondly.',
    },

    // ── gnawing-court: tier-3 ─────────────────────────────────────────────
    'gc-the-table-cleared': {
        name: 'The Table, Cleared',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 4,
        actionText: 'The table is cleared with one sweep of the arm, five plates wide, and you are what was on it',
        stanceHint: 'The meal is concluded. The clearing is done with the same hand and the same manners.',
    },
    'gc-the-bill-for-the-evening': {
        name: 'The Bill for the Evening',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'The bill for the evening is presented, itemised in five courses, and every course is you',
        stanceHint: 'It has been such a lovely evening. Lovely evenings are the expensive kind.',
    },
    'gc-the-lovely-things-taken': {
        name: 'The Lovely Things, Taken',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'It takes the four loveliest things about you and wears them, badly, where you can see',
        stanceHint: 'It cannot make beauty. It can only relocate beauty, and it relocates greedily.',
    },
    'gc-the-hundredth-guest': {
        name: 'The Hundredth Guest',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 3,
        actionText: 'The hundredth guest is seated at last, and the seating goes five courses deep into you',
        stanceHint: 'Ninety-nine chairs already have someone in them. Not one of them left.',
    },
    'gc-teeth-behind-the-smile': {
        name: 'The Teeth Behind the Smile',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_bleed',
        intensity: 4,
        actionText: 'The smile opens further than a smile should and closes on you four times',
        stanceHint: 'The courtesy was a lid. It has come off, and it was hinged the wrong way.',
    },
    'gc-the-favour-called-in': {
        name: 'The Favour, Called In',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.25,
        effectId: 'debuff_mark',
        intensity: 4,
        premiseShed: 4,
        actionText: 'The favour you never asked for is called in, and four of your arguments are taken in lieu',
        stanceHint: 'It gave you something once. It has been waiting, with real patience, to ruin you for it.',
    },
    'gc-the-gnawing-proper': {
        name: 'The Gnawing Proper',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_bleed',
        intensity: 4,
        actionText: 'It stops being polite about the reach and gnaws, properly, four times',
        stanceHint: 'This is the part the court is named for. Everything before it was etiquette.',
    },

    // ── omen-choir: tier-3 ────────────────────────────────────────────────
    'oc-the-last-knock': {
        name: 'The Last Knock',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_creeping_doom',
        intensity: 4,
        rungs: 4,
        actionText: 'The last knock lands, four counts of it, and it lands from inside the door you are holding shut',
        stanceHint: 'There were only ever going to be so many knocks. This is the number.',
    },
    'oc-the-name-read-out': {
        name: 'The Name, Read Out',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'Your name is read out from the list of the already-finished, five times, to be sure of it',
        stanceHint: 'The list is not a prediction. It is a record kept slightly early.',
    },
    'oc-the-hour-agreed': {
        name: 'The Hour, Agreed',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.35,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The hour is agreed by every voice at once, and three of them start on you without waiting for it',
        stanceHint: 'They are not arguing any more. The arguing was the good part, and it is over.',
    },
    'oc-the-thread-cut-short': {
        name: 'The Thread, Cut Short',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.55,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 3,
        actionText: 'The thread is measured, found sufficient, and cut five inches short of where you were going',
        stanceHint: 'The scissors were open this entire fight. You were watching the loom.',
    },
    'oc-the-prophecy-fulfilled-early': {
        name: 'The Prophecy, Fulfilled Early',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.5,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'The prophecy is fulfilled early, out of impatience, and five of its details are settled on your body',
        stanceHint: 'Being right was never enough for it. It wants to be right now.',
    },
    'oc-the-second-tally': {
        name: 'The Second Tally',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'A second tally is opened beside the first, in case the first fills, and four marks go straight into it',
        stanceHint: 'It expects to need the room. It has done this arithmetic before.',
    },
    'oc-the-drum-with-your-pulse': {
        name: 'The Drum That Has Your Pulse',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.25,
        effectId: 'debuff_bleed',
        intensity: 3,
        actionText: 'It beats a drum tuned to your pulse, three strokes ahead of it, and your pulse hurries to catch up',
        stanceHint: 'Rhythm is a kind of prophecy: it only has to be kept to come true.',
    },

    // ── bone-clergy: tier-3 ───────────────────────────────────────────────
    'bc-sig-the-mass-of-ending': {
        name: 'The Mass of Ending',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 5,
        rungs: 4,
        actionText: 'The mass of ending is sung over you entire, all five movements, with no pause for the congregation',
        stanceHint: 'The service has one liturgy left, and it has been saving it for someone breathing.',
    },
    'bc-sig-the-reliquary-emptied': {
        name: 'The Reliquary, Emptied',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'Every relic in the vault is emptied over you, and five saints\' worth of grievance sticks where it lands',
        stanceHint: 'The bones kept their complaints. Bone keeps everything.',
    },
    'bc-sig-excommunication': {
        name: 'Excommunication',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.5,
        effectId: 'debuff_mark',
        intensity: 5,
        swayCleanse: 5,
        actionText: 'You are excommunicated from the living, formally, five marks deep, and your appeal is struck from the file',
        stanceHint: 'It cannot be argued with. It can only be outlived, and it has already tried that.',
    },
    'bc-sig-the-charnel-tide': {
        name: 'The Charnel Tide',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 3,
        actionText: 'The whole charnel floor stands up and comes at you in one wave, five hands deep',
        stanceHint: 'The clergy is larger than it looked. You had been counting only the ones with mouths.',
    },
    'bc-sig-the-plague-perfected': {
        name: 'The Plague, Perfected',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 6,
        actionText: 'The plague is perfected on you in six refinements, each an improvement on the last town',
        stanceHint: 'Centuries of practice, and no reason at all to stop practising.',
    },
    'bc-oath-in-dead-latin': {
        name: 'An Oath in Dead Latin',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'An oath in dead Latin is sworn against you, and four of its clauses take hold where you keep your resolve',
        stanceHint: 'Nobody living can translate it. That has never once slowed it down.',
    },
    'bc-the-thurible-swung': {
        name: 'The Thurible, Swung Low',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.25,
        effectId: 'debuff_poison',
        intensity: 4,
        actionText: 'The thurible swings low and wide, four passes, and what comes off it is not incense',
        stanceHint: 'The smoke is doctrinal, and it goes where doctrine goes: in.',
    },

    // ── debt-office: tier-3 ───────────────────────────────────────────────
    'do-the-account-closed': {
        name: 'The Account, Closed',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_mark',
        intensity: 6,
        rungs: 4,
        actionText: 'The account is closed in your name, all six columns of it, and the balance is taken out of you where you stand',
        stanceHint: 'It has never written off a debt. There is no procedure for it.',
    },
    'do-the-borrowed-god-repossessed': {
        name: 'The Borrowed God, Repossessed',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 4,
        actionText: 'The god it lent you is repossessed mid-prayer, and four of your ribs go with it as collateral',
        stanceHint: 'You were never the owner. You were the site of the loan.',
    },
    'do-final-demand': {
        name: 'Final Demand',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.5,
        effectId: 'debuff_mark',
        intensity: 5,
        premiseShed: 5,
        actionText: 'Final demand is served: five of your premises are seized in lieu, and five marks are entered against the rest',
        stanceHint: 'There is nothing after a final demand. That is why it is called that.',
    },
    'do-the-bailiff-of-hours': {
        name: 'The Bailiff of Hours',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 4,
        actionText: 'The bailiff of hours takes what time you had left, in five instalments, by hand',
        stanceHint: 'It bills for the visit as well. It always bills for the visit.',
    },
    'do-the-interest-made-flesh': {
        name: 'The Interest, Made Flesh',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_creeping_doom',
        intensity: 4,
        actionText: 'The interest stands up in a body of its own and collects four rounds of arrears out of yours',
        stanceHint: 'You have been paying the principal. Nobody has been paying this.',
    },
    'do-the-second-notice': {
        name: 'Second Notice',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.15,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'Second notice is served, less politely, and four penalties attach on delivery',
        stanceHint: 'The first was a courtesy. Courtesies are non-recurring.',
    },
    'do-the-garnishment': {
        name: 'The Garnishment',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.25,
        effectId: 'debuff_mark',
        intensity: 4,
        swayCleanse: 5,
        actionText: 'Your feeling on the matter is garnished at source — five measures withheld, four marks entered',
        stanceHint: 'It does not need your consent. It had it once, in a room you have forgotten.',
    },

    // ── old-fires: tier-3 ─────────────────────────────────────────────────
    'of-the-caldera-opens': {
        name: 'The Caldera Opens',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.6,
        effectId: 'debuff_poison',
        intensity: 6,
        rungs: 4,
        actionText: 'The floor unseals along an old scar and the caldera opens under you, six ages of heat coming up',
        stanceHint: 'It has been holding this since before there was anything to hold it for.',
    },
    'of-the-first-fire-remembered': {
        name: 'The First Fire, Remembered',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.5,
        effectId: 'debuff_mark',
        intensity: 5,
        actionText: 'It remembers the first fire, out loud, and five of your certainties go up with the memory',
        stanceHint: 'Everything was fire once. It regards the current arrangement as a temporary error.',
    },
    'of-glassed': {
        name: 'Glassed',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_bleed',
        intensity: 5,
        rungs: 3,
        actionText: 'The ground under you is glassed in one breath, and you are taken back out of it in five pieces',
        stanceHint: 'Sand does this in an instant and then stays that way for an age.',
    },
    'of-the-wound-that-welds': {
        name: 'The Wound That Welds',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.35,
        enemyCleanse: 3,
        actionText: 'It takes your best hit down the chest, holds it in, and welds three of its own wounds shut with the heat you gave it',
        stanceHint: 'Hurting it is an ingredient. It has been letting you cook.',
    },
    'of-the-mourning-heat': {
        name: 'The Mourning Heat',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.45,
        effectId: 'debuff_creeping_doom',
        intensity: 4,
        actionText: 'The oldest loneliness in the rock comes up through your boots, four grades of it, and keeps rising',
        stanceHint: 'It grieves the way magma grieves: upward, and through whatever is in the way.',
    },
    'of-ash-in-the-throat': {
        name: 'Ash in the Throat',
        archetype: 'old-fires',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.2,
        effectId: 'debuff_poison',
        intensity: 4,
        actionText: 'Ash is packed into your throat, four handfuls, and it is still warm from something much older',
        stanceHint: 'It burns slowly on purpose. Everything it does is on purpose, and slow.',
    },
    'of-the-slow-collapse': {
        name: 'The Slow Collapse',
        archetype: 'old-fires',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'The whole burning face of it leans and comes down on you by degrees, four of them',
        stanceHint: 'Nothing about the fall is fast. Nothing about it is avoidable either.',
    },

    // ── the-aporia: tier-3 ────────────────────────────────────────────────
    'ap-the-proof-completed': {
        name: 'The Proof, Completed',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.6,
        effectId: 'debuff_mark',
        intensity: 6,
        rungs: 4,
        actionText: 'It completes the proof it began when you walked in; the conclusion is six lines long and every line is about you',
        stanceHint: 'Every move you made was a lemma. It has been grateful the entire time.',
    },
    'ap-the-shelf-closes': {
        name: 'The Shelf Closes',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.5,
        effectId: 'debuff_bleed',
        intensity: 5,
        actionText: 'The shelving closes on you like a book on a moth, five ribs of oak and iron',
        stanceHint: 'The Archive files by pressure when citation has failed.',
    },
    'ap-every-door-at-once': {
        name: 'Every Door At Once',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.55,
        effectId: 'debuff_mark',
        intensity: 5,
        rungs: 3,
        actionText: 'Every door it has ever remembered shuts on you at once, five of them on the same arm',
        stanceHint: 'It has been remembering doors for a very long time, and it remembers them alphabetically.',
    },
    'ap-the-axiom-you-stand-on': {
        name: 'The Axiom You Stand On',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_mark',
        intensity: 5,
        premiseShed: 5,
        actionText: 'It removes the axiom you have been standing on, takes five premises down with it, and leaves you to find the floor',
        stanceHint: 'You did not choose that axiom. You inherited it, and it was never yours to keep.',
    },
    'ap-the-question-that-eats': {
        name: 'The Question That Eats',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.4,
        effectId: 'debuff_poison',
        intensity: 5,
        actionText: 'It asks the one question you have walked around your whole life, and five parts of the answer begin to rot',
        stanceHint: 'It is not cruel about it. It is only, finally, unbearably direct.',
    },
    'ap-the-margin-note': {
        name: 'The Margin Note',
        archetype: 'the-aporia',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.15,
        effectId: 'debuff_mark',
        intensity: 4,
        curseCardId: 'overheard-name', // designer: curse-marginalia
        actionText: 'It writes four words in the margin of you and files the page among the cards in your hand',
        stanceHint: 'The correction is small, legible, and permanent.',
    },
    'ap-the-corrected-you': {
        name: 'The Corrected Edition',
        archetype: 'the-aporia',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 4,
        actionText: 'It issues a corrected edition of you, four amendments long, and begins enforcing the amendments',
        stanceHint: 'The first edition contained errors. It intends to be thorough about them.',
    },
};

/** All enemy card ids (stable object order). */
export const ENEMY_CARD_IDS: readonly string[] = Object.freeze(Object.keys(ENEMY_CARD_LIBRARY));

/** O(1) lookup (undefined for unknown ids). */
export function getEnemyCardById(id: string): EnemyCard | undefined {
    return ENEMY_CARD_LIBRARY[id];
}
