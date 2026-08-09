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
    glyphShatter?: boolean;
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
    glyphShatter?: boolean;
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
        damageWeight: 0.8,
        effectId: 'debuff_mark',
        actionText: 'The dead lesson is recited at you, colder with each clause',
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
        actionText: 'Doctrine is applied along your forearm, tooth by tooth',
        stanceHint: 'What remains of the body is doctrine, and the doctrine still bites.',
        // Body opener with BLEED — the melee entry for cursed-paladin (oath-swung armor) and vampire-thrall (the artless throat-lunge).
    },
    'bc-plague-versicle': {
        name: 'Plague Versicle',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.85,
        effectId: 'debuff_poison',
        actionText: 'A versicle is breathed across you and settles into the blood',
        stanceHint: 'The liturgy spreads the old way — congregant to congregant, breath by breath.',
        // Poison opener; the faction\'s plague-as-liturgy seed. Serves ashen-bone-drake\'s exhalation (\'the memory of fire, which burns regardless\') and Black Death\'s town\'s-worth-of-endings breath.
    },
    'bc-penitent-genuflection': {
        name: 'Penitent Genuflection',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        actionText: 'It kneels toward you, and the emptiness where worship was pulls',
        stanceHint: 'The devotion outlived its object; it kneels at you for want of an altar.',
        // The archetype\'s one heart common — hollow devotion. Directly adapts cursed-paladin\'s mid-fight kneel; doubles as vampire-thrall\'s spent devotion and Black Death\'s \'multitudes grieve strangely\' beat.
    },
    'bc-interdict': {
        name: 'Interdict',
        archetype: 'bone-clergy',
        grade: 'common',
        stance: 'mind',
        effectId: 'debuff_mark',
        intensity: 2,
        rungs: 2,
        actionText: 'An interdict is pronounced against your next intention',
        stanceHint: 'The decree does not ask for obedience; it files yours as already given.',
        // Mid move (top of the mid band). The decree verb the whole faction shares — bone-wizard\'s methodology objection, the drake reading where your guard was burned before.
    },
    'bc-ossuary-sermon': {
        name: 'Ossuary Sermon',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.35,
        effectId: 'debuff_bleed',
        intensity: 2,
        rungs: 3,
        actionText: 'The sermon concludes in the old language of blunt bone',
        stanceHint: 'When scripture fails, the church remembers it is built of femurs.',
        // The archetype\'s body FINISHER (spike band 1.35). Adapts bone-wizard\'s \'concludes the review with the staff, per tradition\' — the moment post-flesh scholarship gives up on words. rungs:3 sizes the spike.
    },
    'bc-final-rubric': {
        name: 'The Final Rubric',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_poison',
        intensity: 2,
        rungs: 3,
        actionText: 'The final rubric is read over you, as over the already dead',
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
        intensity: 2,
        unlockAfterRound: 3,
        actionText: 'The reliquary opens and every saint\'s grievance processes through you',
        stanceHint: 'Centuries of preserved devotion, none of it spent, all of it owed — and the procession collects.',
        // Heavy heart mid (1.2), the one unlockAfterRound escalation: the reliquary stays shut until round 3, so a fast solve never sees it and a slow fight watches it coming. Slotted as phase 3 of 4-card decks, where the gate almost never stalls but always looms.
    },
    'bc-anathema-brand': {
        name: 'Anathema Brand',
        archetype: 'bone-clergy',
        grade: 'escalation',
        stance: 'mind',
        curseCardId: 'overheard-name', // designer: curse-leaden-psalm
        actionText: 'A writ of anathema is pressed into your hand, still cold from the vault',
        stanceHint: 'The church does not curse in anger; it curses in paperwork, and the paperwork travels with you.',
        // THE archetype\'s single curse-injector. On a landed threat it shuffles \'curse-leaden-psalm\' into the player\'s deck — a rank-1 curse per brief §4 (theme \'curse\', paid line \'PURGE this curse\', free line a small self-harm; suggested free line: TICK one of your own DoTs — the psalm weighs on the 
    },
    'bc-sig-annexation-decree': {
        name: 'Annexation Decree',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'Ra-Amin-Ka issues a decree, and your tempo is annexed',
        stanceHint: 'Cold administration; every strike is a signature, witnessed.',
        // Ra-Amin-Ka signature 1 (opener). Keeps his current best line verbatim — the administrative annexation of the player\'s turn is his identity.
    },
    'bc-sig-struck-from-the-record': {
        name: 'Struck from the Record',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'He strikes your objection from the record of the living',
        stanceHint: 'The court of dust has procedures older than your language.',
        // Ra-Amin-Ka signature 2 — the STAKE card, seated second per boss law (his current sequence already stakes this exact beat). The coveted-die wager as an act of erasure from the record.
    },
    'bc-sig-census-of-flesh': {
        name: 'Census of Flesh',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'body',
        damageWeight: 0.95,
        effectId: 'debuff_poison',
        intensity: 2,
        actionText: 'The Black Death lays a hand on you like a census',
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
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 3,
        actionText: 'The pestilence embraces you with the patience of history',
        stanceHint: 'Walking, it decided, beats waiting — and it has walked straight to you.',
        // Black Death signature 2 — the finisher spike (1.45, POISON i3). Keeps his current final line; rungs:3 makes the embrace a sized threat.
    },
    'bc-sig-devoured-lexicon': {
        name: 'Devoured Lexicon',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It eats the word you were about to use for it',
        stanceHint: 'It thinks in shapes language was built to avoid.',
        // The-Unnameable signature 1 — the STAKE card, seated second (its current sequence lacked a stake; boss law now requires one, and wagering the coveted die against a thing that eats names is the correct dread). Keeps its current opener line.
    },
    'bc-sig-the-name-collection': {
        name: 'The Name Collection',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 3,
        actionText: 'It reaches for your name, having finished all of its own',
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
        actionText: 'The office serves first notice, and your name begins accruing',
        stanceHint: 'Nothing in it is angry. Everything in it is itemized, and the itemizing has started on you.',
        // Universal opener. MARK i1 = the account opened; every later hit collects against it. Opener band 0.85.
    },
    'small-god-on-credit': {
        name: 'Small God, on Credit',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.8,
        effectId: 'debuff_poison',
        actionText: 'A small god on credit is aimed at you, still wearing its price tag',
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
        actionText: 'It extends condolences for what it is about to repossess',
        stanceHint: 'The regret is genuine, notarized, and offered with the deep sincerity of a paid mourner.',
        // Heart opener/mid. The office\'s sympathy is real and billable — the heart tell is the sincerity, the horror is the invoice.
    },
    'collection-rounds': {
        name: 'Collection Rounds',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'body',
        effectId: 'debuff_bleed',
        actionText: 'The collectors go door to door through your guard',
        stanceHint: 'When paper fails, hands are dispatched; the office keeps several on retainer.',
        // Body mid move, 1.0. BLEED = the physical taking. The faction\'s one honest card: enforcement in person.
    },
    'adjusters-visit': {
        name: 'The Adjuster\'s Visit',
        archetype: 'debt-office',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.95,
        swayCleanse: 2,
        actionText: 'An adjuster reviews your appeal to its better nature, and denies the claim',
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
        actionText: 'The interest compounds, and begins collecting itself',
        stanceHint: 'The arithmetic never raises its voice; it simply never stops, and it is never on your side.',
        // FLAG: uses debuff_creeping_doom (DOOM, brief §4) as an ENEMY-landed player debuff — the +1-intensity-per-round growth IS compounding interest, the faction\'s thesis mechanic. Needs orchestrator confirmation that threatEffectId accepts it. Mid-heavy 1.15; sited early enough in decks that the growth h
    },
    'foreclosure-in-person': {
        name: 'Foreclosure, in Person',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.35,
        effectId: 'debuff_bleed',
        intensity: 2,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The office forecloses on the ground you are standing on',
        stanceHint: 'The paperwork is finished; what remains is the removal, and the removal is performed by hand.',
        // The body spike (1.35), rungs:3 like fire-giant\'s sized finisher. Carries the archetype\'s one unlockAfterRound (3): foreclosure legally cannot arrive before the notice period — the gate is flavor made mechanical, and it protects deck edits from ever ordering this before round 3.
    },
    'the-toll-entire': {
        name: 'The Toll, Entire',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The toll is called in full, and the fare is whatever you were keeping',
        stanceHint: 'It grieves for you the way a bell grieves — on schedule, at volume, and strictly for payment.',
        // Heart spike (1.3) for normals whose finisher is emotional rather than physical (shaman\'s third god, hasshaku\'s gathering).
    },
    'lien-of-the-ninth-office': {
        name: 'Lien of the Ninth Office',
        archetype: 'debt-office',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 0.95,
        curseCardId: 'arrears', // designer: curse-outstanding-lien
        actionText: 'A lien is entered against your future, and filed where you keep your cards',
        stanceHint: 'It does not strike so much as append; the appendix is yours now, and it travels with you.',
        // THE archetype\'s single curse-injector. Damage stays mid-band (0.95) because the curse is the payload: \'curse-outstanding-lien\' — rank-1 curse theme, PURGE paid line, small self-harm free line (per brief §4.4). Carried by exactly one deck (hasshaku-sama: her choosing follows you home).
    },
    'the-weighing': {
        name: 'The Weighing',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        swayCleanse: 2,
        stake: true,
        actionText: 'Mirac measures your conviction and finds it wanting',
        stanceHint: 'Cold and exact, it weighs feeling against feeling on a fulcrum of pure indifference.',
        // Mirac signature 1 — actionText and hint kept verbatim from the existing phase 2 (the voice to beat). Stake on the deck\'s SECOND slot per boss law. swayCleanse:2 doubles down with adjusters-visit: Mirac\'s one-sentence rule — THE COURT CANNOT BE CHARMED; every appeal is deducted (inverts the choir h
    },
    'the-red-verdict': {
        name: 'The Red Verdict',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'The hooded court rises as one, and the red verdict is executed',
        stanceHint: 'Sentence first, crime later — and the sentence has waited long enough.',
        // Mirac signature 2, the finisher — existing phase-4 line preserved verbatim (it is already the best sentence in Mirac\'s file). Spike 1.4, MARK i3 keeps Mirac dot-weak/mark-heavy per its authored identity.
    },
    'clause-of-objections': {
        name: 'The Clause Governing Objections',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        premiseShed: 2,
        stake: true,
        actionText: 'It invokes the clause that governs objections, and yours are stricken',
        stanceHint: 'The paperwork is flawless. It has had a very long time to proofread.',
        // Greater-Devil signature 1 — adapts the existing phase-2 line and makes its threat literal: premiseShed:2 (spec 33a) strikes banked Premises. One-sentence rule: OBJECTIONS ARE STRICKEN — the trial archetype\'s habit of safely banking premises is inverted at the stake phase. Stake on second slot per b
    },
    'execution-of-the-agreement': {
        name: 'Execution of the Agreement',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The Devil executes the agreement, and the agreement executes you',
        stanceHint: 'The flaw in the paperwork was always going to be the counterparty.',
        // Greater-Devil signature 2 — existing phase-4 line preserved verbatim (the pun is load-bearing). Spike 1.4, POISON i3 matching the current finisher payload.
    },
    'the-offered-hand': {
        name: 'The Offered Hand',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It offers its hand, the way one does to the late',
        stanceHint: 'The courtesy is so old it reads as coldness; the appointment is genuine.',
        // Death signature 1 — existing phase-2 line verbatim; it is already Death\'s coveted-die phase in the current sequence, so the stake placement (second slot) is continuity, not invention. Death is unique, not boss, but the deck law names \'bosses/uniques\' for the stake.
    },
    'the-appointment-kept': {
        name: 'The Appointment Kept',
        archetype: 'debt-office',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'Death keeps the appointment',
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
        actionText: 'The bell counts one, and the count is of you',
        stanceHint: 'It takes attendance the way a sexton does — patiently, and for the record.',
        // Opener band (0.8). MARK i1 = your name entered in the parish register; sets up every DoT the deck lands later. Doubles as an appraisal opener for the Butcher and a court roll-call for the King.
    },
    'dp-salt-rescue': {
        name: 'Salt-Rescue',
        archetype: 'drowned-parish',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.8,
        effectId: 'debuff_creeping_doom',
        actionText: 'Drowned hands close about you, rescuing you toward the deep',
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
        actionText: 'The undertow takes your ankles with both cold hands',
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
        swayCleanse: 2,
        actionText: 'The drowned congregation sings your mercy back into its pews',
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
        intensity: 2,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The ninth bell tolls, and the tolling goes on under your breastbone',
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
        intensity: 2,
        actionText: 'The drowned run the old rescue drill, and you are the one being saved',
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
        intensity: 2,
        rungs: 3,
        actionText: 'The whole parish grieves at once, and the water stands up with it',
        stanceHint: 'Every grief the parish ever swallowed surfaces together, and all of it is aimed at you, openly.',
        // Spike band (1.3), rungs 3. The heart-stance finisher for the grieving half of the roster (Belle, Holger, the Ferryman\'s cornered phase). MARK i2 rather than raw cruelty: the grief files you among its dead, and every later tick collects.
    },
    'dp-breaking-sea': {
        name: 'The Breaking Sea',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.4,
        effectId: 'debuff_bleed',
        intensity: 2,
        rungs: 3,
        actionText: 'The sea breaks over the whole argument at once',
        stanceHint: 'Past patience, past liturgy — the water throws its entire opinion at the matter.',
        // Spike band (1.4), rungs 3. The body-stance finisher for the brutes (larva, float-eye, foot-stealer, Butcher, Hag, doom-egg). BLEED i2 is the surf dragging you over shingle.
    },
    'dp-lead-bell': {
        name: 'A Bell Sewn Under the Hem',
        archetype: 'drowned-parish',
        grade: 'escalation',
        stance: 'mind',
        curseCardId: 'mouthful-of-brine', // designer: curse-swallowed-bell
        actionText: 'Cold fingers sew a small lead bell into the hem of your coat',
        stanceHint: 'The stitching is small, deliberate work — somewhere a ledger gains a line with your name on it.',
        // THE archetype\'s single curse-injector (mid band 1.0). curse-swallowed-bell: a rank-1 \'curse\'-theme player card — The Swallowed Bell — whose paid line is \'PURGE this curse\' and whose free line is a small self-toll, per brief §4.4. Graded \'escalation\' because the schema\'s grade enum has no inj
    },
    'sig-ferryman-toll': {
        name: 'The Toll Is Named',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        // 0.21 restored (the designer's normalization to 0.8 reverted): the
        // near-harmless naming-of-terms IS the boss's calibrated opener.
        damageWeight: 0.21,
        effectId: 'debuff_mark',
        actionText: 'The Ferryman names the toll, and your objection is not legal tender',
        stanceHint: 'He waits with the patience of a schedule that has never once been missed.',
        // Ferryman signature opener — inherits his existing phase-1 line verbatim (the best line in the file). His current sequence runs this at damageWeight 0.21 (a near-harmless naming-of-terms); normalized to the opener band floor 0.8 per deck law — FLAGGED for the orchestrator in case the 0.21 was deliber
    },
    'sig-ferryman-far-bank': {
        name: 'The Far Bank, Described',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'He describes the far bank until you cannot remember the near one',
        stanceHint: 'He listens past your words, appraising what you could not afford to lose.',
        // Ferryman stake card (second in deck, per boss law — his current sequence had no stake authored; this fixes that gap). The coveted-die wager IS the toll: he has named a price and now holds something of yours against it. Mid band 1.0, MARK i2. Deliberately no swayCleanse — Control/mercy is his designe
    },
    'sig-king-grievance': {
        name: 'The Wrong No One Living Recalls',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.85,
        effectId: 'debuff_mark',
        stake: true,
        actionText: 'The King rages over the wrong no one living recalls',
        stanceHint: 'Beneath the crown there is no head — only the grievance, holding the shape of one.',
        // King of Revenge stake card (second in deck, matching where his existing sequence authors stake:true today). Inherits his phase-2 line and hint verbatim — the strongest image in the archetype. Early-mid 0.85 keeps the ramp honest under the two big cards behind it.
    },
    'sig-king-last-ruling': {
        name: 'The Last Cold Ruling',
        archetype: 'drowned-parish',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 4,
        actionText: 'The King makes one last cold, kingly ruling upon you',
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
        actionText: 'It asks, beautifully, for something you will miss',
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
        actionText: 'Something about it catches the light exactly the way you hoped it would',
        stanceHint: 'It feeds on wanting; the whole courtship is an appeal to your appetite.',
        // Generalized from enemy-jeweled-tree phase 1. The temptation opener — the court baits before it bills. Lightest weight in the pool (0.8) because the hook, not the hit, is the point.
    },
    'gc-the-begging-fist': {
        name: 'The Begging Fist',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'body',
        damageWeight: 0.95,
        actionText: 'It begs with a raised fist, and the fist lands first',
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
        actionText: 'It takes without waiting for the answer',
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
        actionText: 'It howls at the insult of being answered at all',
        stanceHint: 'Refusal and charity anger it equally; what it loves is the asking.',
        // Adapted from enemy-bull-begger phase 2; doubles as pale-brood\'s keening (the aggrieved-cry mid). Mid band 0.9 + MARK.
    },
    'gc-the-patient-inch': {
        name: 'The Patient Inch',
        archetype: 'gnawing-court',
        grade: 'common',
        stance: 'body',
        damageWeight: 1.1,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'It tightens its hold, an inch per point conceded',
        stanceHint: 'It does not need you wrong — only within reach, which you now are.',
        // Adapted from enemy-ogre-naga phase 2 (exact weight and payload: 1.1, MARK 2). The pool\'s heavy mid — constriction as courtesy withdrawn by degrees. Deliberately sized to fill the boss position-3 slot (mid band tops at 1.2) so bosses ramp through it into their signature spikes.
    },
    'gc-thanks-given-sincerely': {
        name: 'Thanks, Given Sincerely',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.3,
        actionText: 'It thanks you, sincerely, while taking the rest',
        stanceHint: 'Cold and gracious to the end — the etiquette was always the appetite.',
        // Adapted verbatim from enemy-ghast phase 3 — the archetype\'s finishing sentiment. Spike band floor (1.3), no effect: the taking is total, gratitude included. Serves as the gracious-conclusion finisher for ghast, jeweled-tree (the transaction completes), and ogre-naga (the closing statement).
    },
    'gc-the-alms-you-owed': {
        name: 'The Alms You Owed',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.35,
        effectId: 'debuff_bleed',
        intensity: 2,
        unlockAfterRound: 3,
        actionText: 'It takes the alms it decided you owed',
        stanceHint: 'All pretense of petition gone — the collection is by main strength.',
        // Adapted verbatim from enemy-bull-begger phase 3. The pool\'s one unlockAfterRound escalation: the court will not be hurried through its forms — the collection cannot arrive before round 3. At its authored deck slots (always position 3) the gate is a backstop rather than a bite, which keeps it safe a
    },
    'gc-the-standing-invitation': {
        name: 'The Standing Invitation',
        archetype: 'gnawing-court',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 0.9,
        curseCardId: 'gnaw-marks', // designer: curse-guest-debt
        actionText: 'It enters your name in the guest book, in ink you did not offer',
        stanceHint: 'The welcome is heartfelt, which is precisely what makes it binding.',
        // THE archetype\'s single curse-injector. curse-guest-debt: a rank-1 PURGE-line curse — hospitality as a debt instrument shuffled into the player\'s deck. Deployed sparingly: only Lady Gabriella\'s opener (the hostess is the one who keeps the book). Mid-band weight 0.9 so the injection, not the hit, i
    },
    'rawhead-the-grin-from-the-stories': {
        name: 'The Grin from the Stories',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It grins the grin from every story you were told too young',
        stanceHint: 'It knows exactly which bedtime warning you are remembering, because it is the warning.',
        // Rawhead-Rex signature 1 — his existing phase-2 stake beat preserved intact (the coveted-die wager lands on the grin, where it always was). Deck position 2 per boss law.
    },
    'rawhead-a-hundred-years-of-courtesy-ended': {
        name: 'A Hundred Years of Courtesy, Ended',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.4,
        effectId: 'debuff_bleed',
        intensity: 3,
        rungs: 3,
        actionText: 'Rawhead ends the courtesy it extended for a hundred years',
        stanceHint: 'The stairs are behind it now; nothing about it is under anything anymore.',
        // Rawhead-Rex signature 2 — his existing finisher, promoted to a sized threat (rungs 3, per the elder-fire-giant/gabriella boss-finisher precedent). The archetype\'s one-sentence boss rule embodied: the cellar-thing that spent a century observing the forms stops observing them. Spike 1.4, BLEED 3.
    },
    'gabriella-the-clinical-inquiry': {
        name: 'The Clinical Inquiry',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        swayCleanse: 2,
        stake: true,
        actionText: 'She inquires after your health with clinical accuracy',
        stanceHint: 'Between courses she appraises, cold as cellar stone, what is worth keeping.',
        // Lady Gabriella signature 1 — her phase-2 swayCleanse identity survives verbatim, now carrying the boss stake as well: the wager and the appraisal are the same cold look. Deck position 2 per boss law.
    },
    'gabriella-four-centuries-at-table': {
        name: 'Four Centuries at Table',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.4,
        rungs: 3,
        actionText: 'Four centuries of appetite arrive at the table at once',
        stanceHint: 'The last human habit gives way, with sincere regret, to the older ones.',
        // Lady Gabriella signature 2 — her existing rungs-3 finisher preserved intact. Spike 1.4, no effect: the appetite needs no garnish.
    },
    'beelzebub-the-vote-of-the-air': {
        name: 'The Vote of the Air',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'The swarm votes, and the air itself abstains from you',
        stanceHint: 'Beneath the lord\'s stillness, ten million constituents reach alignment.',
        // Beelzebub signature 1 — his existing phase-2 stake beat preserved (the wager is put to a vote; the vote is unanimous). Deck position 2 per boss law.
    },
    'beelzebub-the-final-motion': {
        name: 'The Final Motion',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'Beelzebub ratifies the final motion, and the swarm descends as one',
        stanceHint: 'The lord of everything that swarms calls the question, and the question is you.',
        // Beelzebub signature 2 — his existing finisher intact. Spike 1.45, POISON 3: enforcement is unanimous.
    },
    'arch-demon-your-file-read-aloud': {
        name: 'Your File, Read Aloud',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It reviews your file, aloud, with commentary',
        stanceHint: 'Somewhere below, lesser devils are already processing the outcome.',
        // Arch-Demon signature 1 — his existing phase-2 stake beat preserved (the coveted die is an agenda item). Deck position 2 per boss law.
    },
    'arch-demon-the-discretion': {
        name: 'The Discretion',
        archetype: 'gnawing-court',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The appetite executes its mandate in full',
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
        actionText: 'The ground under you concedes the point, and withdraws its support',
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
        actionText: 'The air arranges itself into a kiln with patient opinions',
        stanceHint: 'It has fired harder clay than you, and is in no hurry about the glaze.',
        // Shared mind opener (0.85). The archetype\'s \'old fire thinks slowly and exactly\' register as a common: ambient heat as deliberation. POISON i1 is the patient burn.
    },
    'of-grief-of-magma': {
        name: 'Grief of Magma',
        archetype: 'old-fires',
        grade: 'common',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The deep heat grieves upward, and the grieving scalds',
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
        actionText: 'A crack in it brightens, and seals itself smooth as glass',
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
        actionText: 'Pressure that built for an age finds its vent, and the vent is you',
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
        intensity: 2,
        rungs: 3,
        unlockAfterRound: 3,
        actionText: 'The slow collision that raises mountains resumes, with you between the plates',
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
        actionText: 'It presses a live coal into your keeping, and your keeping closes around it',
        stanceHint: 'A gift, by fire\'s etiquette — and warmth of this vintage keeps a ledger of what it is owed.',
        // THE archetype\'s single curse-injector. On a landed threat, shuffles `curse-clinker` into the player\'s combat deck — a rank-1 CURSE: a lump of fused slag that will not burn and will not leave; FREE line a 1-tick ember self-singe, paid line \'PURGE this curse\'. Old fire pays its debts in clinker: t
    },
    'fg-mountains-spine-appraisal': {
        name: 'The Mountain\'s Spine',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.95,
        enemyCleanse: 1,
        stake: true,
        actionText: 'He appraises you down the length of the mountain\'s spine, and the wounds close over like cooling rock',
        stanceHint: 'Old fire thinks slowly and exactly, like cooling stone.',
        // Fire-giant signature #1 — his existing cauterize phase kept line-for-line, promoted to the stake slot (boss law: stake on exactly the second card). The wager rides on the appraisal: he cauterizes while coveting your die, so answering the stake means racing his self-repair.
    },
    'fg-the-sword-remembers': {
        name: 'The Sword Remembers',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 3,
        actionText: 'The sword remembers being a mountain, and falls like one',
        stanceHint: 'The genealogy arrives all at once, ancestor by burning ancestor.',
        // Fire-giant signature #2 — his existing finisher preserved verbatim (the best line in the archetype). Spike 1.45, rungs 3 per the existing sequence\'s authored intent: the full weight is a sized threat, not the flat default.
    },
    'efg-outlived-its-eruption': {
        name: 'Outlived Its Own Eruption',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        enemyCleanse: 1,
        stake: true,
        actionText: 'The elder considers you with the patience of a thing that outlived its own eruption, and its old scars close over',
        stanceHint: 'Old flame plans in centuries; you are a brief agenda item.',
        // Elder-fire-giant signature #1 — his existing stake+cauterize phase preserved verbatim in the mandated second slot. The boss-tier version of fire-giant\'s answer: same verb, older scars.
    },
    'efg-burns-once-entirely': {
        name: 'Once, Entirely',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        rungs: 4,
        actionText: 'The oldest fire in the world burns, once, entirely',
        stanceHint: 'Whiteness is what flame becomes when it stops needing to prove anything.',
        // Elder-fire-giant signature #2 — existing finisher preserved verbatim. Spike 1.45 at the authored rungs-4 ceiling: the boss finisher outright demands more STAGGER than the flat default, exactly as the current sequence intends.
    },
    'ab-the-unsaying': {
        name: 'The Unsaying',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It unsays the part of the world that took its place',
        stanceHint: 'Displacement is the only theology it was taught, and it studied.',
        // The-abortive signature #1 — its existing second phase preserved verbatim, carrying the stake it already holds today. Flagged: the-abortive is a unique, not a boss, but brief §7 puts the stake law on bosses/uniques and its current sequence stakes this exact phase — a bespoke second card is the only w
    },
    'ab-one-more-beginning': {
        name: 'One More Beginning',
        archetype: 'old-fires',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The unbegun god tries, one more time, to begin — through you',
        stanceHint: 'Its patience predates its existence, and both predate your defenses.',
        // The-abortive signature #2 — its existing finisher preserved verbatim. Spike 1.45; heart-stance close, per its existing all-grief final arc.
    },
    'first-knock': {
        name: 'First Knock',
        archetype: 'omen-choir',
        grade: 'common',
        stance: 'mind',
        damageWeight: 0.8,
        actionText: 'The first knock sounds against the thin place under your feet',
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
        actionText: 'A fresh error is marked against your name',
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
        actionText: 'It weeps for you, specifically, ahead of the event',
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
        actionText: 'The rhythm cracks across you on the downbeat',
        stanceHint: 'Every beat is defended like territory; the measure was marked out before you arrived.',
        // Sugata phase 2 (the tambourine on the downbeat) made archetype-wide: the already-written keeps time. Doubles as the loom\'s beat for frayed-one and fate-spinner (\'beating the weft\' is a real weaving verb). Body common, 0.95.
    },
    'deemed-redundant': {
        name: 'Deemed Redundant',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.05,
        effectId: 'debuff_mark',
        premiseShed: 2,
        actionText: 'It answers itself before you can, and your part of the conversation is deemed redundant',
        stanceHint: 'The voices differ only about which of them loves you less.',
        // Zoma\'s premiseShed identity as a card (existing phase 2 verbatim in spirit): the archetype\'s counterplay against the CONDEMN track — your premises are struck as already-answered. Lives in the zoma family plus tri-eyes-hollowed (see deck note). Mid band 1.05.
    },
    'the-written-line': {
        name: 'The Written Line',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        curseCardId: 'overheard-name', // designer: curse-already-written
        actionText: 'It writes one line of you ahead of time and files it among your futures',
        stanceHint: 'Somewhere in what you have not yet drawn, the sentence is already waiting.',
        // THE archetype\'s single curse-injector. Shuffling \'curse-already-written\' into the player\'s deck IS the flavor — your future draws now contain a sentence someone else wrote. Intended player curse: rank-1 curse-theme junk, FREE line a small self-MARK, paid line \'PURGE this curse\'. No effectId — 
    },
    'third-knock': {
        name: 'Third Knock',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'body',
        damageWeight: 1.35,
        effectId: 'debuff_mark',
        intensity: 2,
        unlockAfterRound: 3,
        actionText: 'The third knock — and what it was knocking on gives way',
        stanceHint: 'The omen stops predicting the collapse and becomes it.',
        // Wichtlein\'s finisher, kept verbatim — the best line in the archetype. Carries the pool\'s one unlockAfterRound (3): the third knock will not be hurried, even by a player racing the sequence. Body spike 1.35.
    },
    'the-calamity-spoken': {
        name: 'The Calamity, Spoken',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'heart',
        damageWeight: 1.3,
        effectId: 'debuff_poison',
        intensity: 2,
        actionText: 'It speaks the calamity at last, and the first word is your name',
        stanceHint: 'The prophecy was always going to be delivered; it only needed a listener.',
        // Kudan\'s final line promoted to the archetype\'s heart-stance spike: the prophecy delivered as lingering rot (POISON i2 — spoken doom persists). Heart spike 1.3, closes kudan/sugata/bone-totem/zoma decks.
    },
    'the-count-completes': {
        name: 'The Count Completes',
        archetype: 'omen-choir',
        grade: 'escalation',
        stance: 'mind',
        damageWeight: 1.35,
        effectId: 'debuff_poison',
        intensity: 2,
        actionText: 'The count completes, and you are the remainder',
        stanceHint: 'The ledger closes with the satisfaction of zero.',
        // Tri-eyes-hollowed\'s final phase verbatim — the tally family\'s cold mind-stance spike. Mind spike 1.35, closes frayed-one/tri-eyes/tri-eyes-hollowed and serves as tezcatlipoca\'s finisher.
    },
    'the-tapestry-shown': {
        name: 'The Tapestry, Shown',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        stake: true,
        actionText: 'He shows you the tapestry with your next three mistakes already woven',
        stanceHint: 'There is an old sorrow in the showing — he has never once been surprised.',
        // Fate-spinner signature 1, adapted from its existing phase 2 (which carried the stake). Carries stake:true as the boss\'s SECOND deck card — wagering the coveted die on a future he has already woven is the whole character. Mid band 0.9.
    },
    'the-pattern-pulled-taut': {
        name: 'The Pattern Pulled Taut',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The Spinner pulls the pattern taut, and your part in it concludes',
        stanceHint: 'The final motif was always going to be a struggle, rendered beautifully.',
        // Fate-spinner signature 2 — its existing final phase preserved (1.4→1.45, POISON i3 kept). Boss spike 1.45.
    },
    'the-warm-unison': {
        name: 'The Warm Unison',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'They invite you, warmly, in unison, to concur',
        stanceHint: 'Agreement at this register is gravitational; dissent takes effort they no longer spend.',
        // Zoma-ascendant signature 1, its existing phase 2 (which carried the stake) preserved. The one-sentence boss rule: the arguing was the safety mechanism, and it is off — agreement is the threat. stake:true, boss\'s SECOND card. Mid band 0.95.
    },
    'verdict-without-seam': {
        name: 'Verdict Without Seam',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The twin verdict lands as one sentence with no seam in it',
        stanceHint: 'What the arguing held back, the agreement delivers entire.',
        // Zoma-ascendant signature 2 — the existing final phase preserved (1.45, POISON i3). Boss spike.
    },
    'the-kept-reflection': {
        name: 'The Kept Reflection',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.95,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It shows you the version of you that already lost, at leisure',
        stanceHint: 'There is grief in the glass — every reflection it keeps was somebody\'s best attempt.',
        // Tezcatlipoca signature 1, its existing phase 2 (which carried the stake) preserved verbatim. Wagering the coveted die against a mirror that already owns your losing self. stake:true, boss\'s SECOND card. Mid band 0.95.
    },
    'the-tally-reconciled': {
        name: 'The Tally, Reconciled',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.0,
        effectId: 'debuff_mark',
        // Tri-Eyes' preserved bearer-afflictions-gte-3 branch (WS9): written
        // past legibility, the ledger stops pleading and reconciles itself —
        // shedding one of its own entries. Forks ported verbatim from the
        // pre-rework authored sequence (@ a69eab56).
        branch: {
            condition: { kind: 'bearer-afflictions-gte', n: 3 },
            then: {
                stance: 'mind', damageWeight: 0.7, enemyCleanse: 1,
                actionText: 'It strikes the deepest entry from the ledger of itself and turns a corrected eye on you',
                stanceHint: 'Written past legibility, it stops pleading and coldly reconciles the account.',
            },
            else: {
                stance: 'heart', damageWeight: 1.0,
                effectId: 'debuff_mark',
                actionText: 'It recounts your every misstep until your hand falters',
                stanceHint: 'There is something almost pleading in how badly it wants the tally to balance.',
            },
        },
        actionText: 'It recounts your every misstep until your hand falters',
        stanceHint: 'There is something almost pleading in how badly it wants the tally to balance.',
        // The archetype's one branching card. Base fields describe the else-fork (the pleading recount, the common case); the then-fork is the cold reconciliation that sheds an affliction when the ledger itself is written past legibility.
    },
    'smoke-through-the-seams': {
        name: 'Smoke Through the Seams',
        archetype: 'omen-choir',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 2,
        // Tezcatlipoca's preserved prior-threat-fully-blocked branch: a full
        // block turns the next action rider-heavy (the smoke pours around the
        // wall) instead of damage-heavy. Forks verbatim from the pre-rework
        // authored sequence.
        branch: {
            condition: { kind: 'prior-threat-fully-blocked' },
            then: {
                stance: 'heart', damageWeight: 0.5,
                effectId: 'debuff_poison', intensity: 3,
                actionText: 'Denied the blow, the smoke pours through the seams of your guard',
                stanceHint: 'Your wall was a reflection too; what it cannot strike, it keeps.',
            },
            else: {
                stance: 'mind', damageWeight: 1.2,
                effectId: 'debuff_mark', intensity: 2,
                actionText: 'The mirror angles, and your certainty falls out of frame',
                stanceHint: 'It edits with the courtesy of a god who has already seen the final cut.',
            },
        },
        actionText: 'The mirror angles, and your certainty falls out of frame',
        stanceHint: 'It edits with the courtesy of a god who has already seen the final cut.',
        // Tezcatlipoca signature 2 — the mandated preservation of its prior-threat-fully-blocked branch, forks copied verbatim from the repo. Base fields describe the else-fork (the heavier, common case); the then-fork is the authored rider-heavy exception (0.5 weight, POISON i3) that punishes a full block. I
    },
    'litany-of-thresholds': {
        name: 'Litany of Thresholds',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The Doorwarden lays a threshold under your feet, and it declines to be crossed',
        stanceHint: 'He worships thresholds; where you would step, a doctrine has already been installed.',
        // Opener, band 0.8-1.0 at 1.0 (preserves the current phase\'s default weight). MARK i2 seeds the deck\'s whole-fight tax: every door he closes hits harder for the doors already closed.
    },
    'the-door-kept-open': {
        name: 'The Door You Kept Open',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'He closes a door you were keeping open in your head',
        stanceHint: 'Every door that ever shut is remembered in him, and he consults the memory alphabetically.',
        // Second card, stake:true per boss law (preserves current placement). Mid band at 0.9 — the wager card is deliberately the lightest hit, so the coveted-die tension is the threat, not the number.
    },
    'the-bronze-frame': {
        name: 'The Bronze Frame, Swung',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 2,
        glyphShatter: true,
        actionText: 'The bronze frame swings through you like a door through a draught',
        stanceHint: 'Sermon concluded, the hinge-priest recalls that he is mostly hinge.',
        // Mid-spike at 1.2 (top of mid band), the glyphShatter identity card — a door closing IS a seal breaking. Destroys the player\'s lowest-charge glyph on Overwhelm; the punish that enforces his one-sentence rule.
    },
    'what-shuts-stays-shut': {
        name: 'What Shuts, Stays Shut',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'Every door he remembers shuts at once, and you are the room',
        stanceHint: 'The liturgy reaches its one commandment: what shuts, stays shut.',
        // Finale spike at 1.4 (band 1.3-1.5), MARK escalates to i3 so the accumulated MARK stacks make this the fight-defining hit. Preserves the current phase-4 calibration.
    },
    'the-drawer-opens': {
        name: 'The Drawer Opens at Your Name',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        effectId: 'debuff_bleed',
        intensity: 2,
        curseCardId: 'overheard-name', // designer: curse-misfiled-entry
        actionText: 'A drawer opens at your name, issues the first thousand paper cuts, and files one page of its own among yours',
        stanceHint: 'It catalogues before it strikes; the cuts arrive pre-filed, and so does the forgery.',
        // THE ARCHETYPE\'S ONE CURSE INJECTOR (exactly one per archetype, per deck law). On a landed opener, shuffles curse-misfiled-entry into the player\'s combat deck — the Index attacks the one place players treat as safe ground: their own pages. Opener band at 1.0 (current default weight preserved); BLEE
    },
    'filed-under-kindling': {
        name: 'Filed Under KINDLING',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_poison',
        intensity: 2,
        stake: true,
        actionText: 'It misfiles you under KINDLING and shelves you beside the lamp oil',
        stanceHint: 'The Archive\'s errata smoulder; a truth in the wrong place is an accelerant.',
        // Second card, stake:true per boss law (current placement preserved). Mid band 0.9; the DoT pivots from BLEED to ramping POISON — a misfiled truth burns slow and gets worse.
    },
    'oak-and-iron': {
        name: 'Oak and Iron',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'body',
        damageWeight: 1.2,
        effectId: 'debuff_bleed',
        intensity: 3,
        glyphShatter: true,
        actionText: 'The card-drawer ribs slam open and shut on whatever of you is nearest',
        stanceHint: 'Out of patience with citation, the golem remembers its shelving is oak and iron.',
        // Mid-spike 1.2, the deck\'s lone body stance — the librarian stops citing and starts crushing. glyphShatter identity card: ribs slamming shut read as a seal shattering (preserves the current phase-3 payload exactly).
    },
    'the-errata-read-aloud': {
        name: 'The Errata, Read Aloud',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.4,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'It reads out every wrong entry ever filed about you, and the reading scalds',
        stanceHint: 'The whole errata at once: a bonfire of corrections, and you are the margin they burn in.',
        // Finale spike 1.4, POISON i3 — the full misfiled record detonating as DoT pressure. Preserves current phase-4 calibration.
    },
    'your-position-improved': {
        name: 'Your Position, Improved',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        effectId: 'debuff_mark',
        intensity: 2,
        rungs: 2,
        actionText: 'The Sophist restates your position, improved, and aims it back at you',
        stanceHint: 'He fights with borrowed premises — yours, mostly, held at a more flattering angle.',
        // Opener at 1.0 (current default preserved) with the authored rungs:2 softening kept — a deliberately STAGGER-vulnerable opening so the player tastes objection working before the redactions begin.
    },
    'a-courteous-concession': {
        name: 'A Courteous Concession',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.9,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'He concedes a point you had not made yet, courteously, like a trap',
        stanceHint: 'The etiquette is the blade; the house eats the courteous last.',
        // Second card, stake:true per boss law (current placement preserved). The deck\'s lone heart stance — the trap is emotional, not logical. Mid band 0.9.
    },
    'signed-in-thirds': {
        name: 'Signed in Thirds',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.2,
        effectId: 'debuff_mark',
        intensity: 2,
        premiseShed: 3,
        actionText: 'He strikes your best premise from the record and signs the deletion in thirds',
        stanceHint: 'Centuries of clerkship: what he cannot win he redacts.',
        // Mid-spike 1.2, the premiseShed identity card — sheds 3 spendable Premises on Overwhelm, the flagship counterplay against the CONDEMN track. Preserves the Phase 33b calibration exactly.
    },
    'your-opening-perfected': {
        name: 'Your Opening Move, Perfected',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 1.45,
        effectId: 'debuff_poison',
        intensity: 3,
        actionText: 'The Sophist closes the argument with your own opening move, perfected',
        stanceHint: 'The narration stops being about you and starts happening to you.',
        // Finale spike 1.45 (band ceiling for the Act III finale), POISON i3. Preserves current phase-4 calibration.
    },
    'the-sentence-outside': {
        name: 'The Sentence From Outside',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.21,
        effectId: 'debuff_mark',
        intensity: 2,
        actionText: 'The Incompleteness plays a truth your system cannot express, and your reply dies unprovable',
        stanceHint: 'It begins from outside every axiom you brought; you cannot see the floor it stands on.',
        // HARD CONSTRAINT PRESERVED: damageWeight 0.21, mind, MARK i2 — exact. The L110 unique budget is enormous, so 0.21 still lands ~60-180 HP at scale; the tiny weights ARE the calibration and must not be re-banded.
    },
    'the-true-thing-about-you': {
        name: 'The True Thing About You',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 0.232,
        effectId: 'debuff_mark',
        intensity: 2,
        stake: true,
        actionText: 'It lays down the true sentence about yourself that you will never be able to prove',
        stanceHint: 'For a moment it grieves for you, the way one grieves for a house that believes it is finished.',
        // HARD CONSTRAINT PRESERVED: damageWeight 0.232, heart, MARK i2, stake:true on the second card — exact.
    },
    'a-new-axiom': {
        name: 'A New Axiom',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.271,
        effectId: 'debuff_mark',
        intensity: 3,
        enemyHeal: 8,
        actionText: 'It takes your strongest argument into its hand and files it as a new axiom, growing truer',
        stanceHint: 'Whatever you add to it, it contains; whatever wounds it becomes another thing it survives.',
        // HARD CONSTRAINT PRESERVED: damageWeight 0.271, mind, MARK i3, enemyHeal 8 — exact. The self-knit is the habit inversion made mechanical: your biggest turn becomes its newest axiom.
    },
    'you-cannot-go-on': {
        name: 'You Cannot Go On',
        archetype: 'the-aporia',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.326,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'It proves, within you, the statement that you cannot go on — and you cannot refute it',
        stanceHint: 'There is no triumph in it; the proof was never finishable, it only needed you to stop.',
        // HARD CONSTRAINT PRESERVED: damageWeight 0.326, mind, MARK i3, isFinalPhase:true — exact (isFinalPhase has no schema field here; the orchestrator must set it on this fourth card at compile). Most losses to this deck are the round cap, which is the theme.
    },
    // ── rangda — the widow-queen (bone-clergy signature pair; her existing
    //    swayCleanse "inured to charm" identity survives the rework) ──────────
    'the-widows-keening': {
        name: "The Widow's Keening",
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'heart',
        effectId: 'debuff_mark',
        intensity: 2,
        rungs: 2,
        actionText: 'Rangda keens, and the curse arrives still weeping',
        stanceHint: 'Grief that learned sorcery; every hex is a lesson she passed alone.',
    },
    'syllabus-of-accusation': {
        name: 'Syllabus of Accusation',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'mind',
        damageWeight: 0.9,
        effectId: 'debuff_poison',
        intensity: 2,
        swayCleanse: 3,
        stake: true,
        actionText: 'She recites the syllabus of four hundred years of accusation',
        stanceHint: 'Each charge they invented, she studied; the coursework is in your blood now.',
    },
    'the-mask-comes-away': {
        name: 'The Mask Comes Away',
        archetype: 'bone-clergy',
        grade: 'signature',
        stance: 'heart',
        damageWeight: 1.4,
        effectId: 'debuff_mark',
        intensity: 3,
        actionText: 'Rangda lets the whole studied grief off its leash at once',
        stanceHint: 'Love with nowhere to go, four centuries compounded, finds somewhere.',
    },
};

/** All enemy card ids (stable object order). */
export const ENEMY_CARD_IDS: readonly string[] = Object.freeze(Object.keys(ENEMY_CARD_LIBRARY));

/** O(1) lookup (undefined for unknown ids). */
export function getEnemyCardById(id: string): EnemyCard | undefined {
    return ENEMY_CARD_LIBRARY[id];
}
