/**
 * TRIAL — THE INDICTMENT — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The witch-trial prosecuted mid-combat. This theme owns TEMPO AND CONTROL: it
 * does not out-damage the foe, it takes the foe's turn away and bills them for
 * the attempt. Its currency is the CHARGE tally, which climbs toward the
 * SENTENCE and — on a single big filing that overshoots — toward CONDEMN, the
 * alt-win where the argument simply ends the fight.
 *
 * The four legs:
 *   - EVIDENCE — MARK stacks, laid down cheap and cashed by the Black Cap.
 *   - OBJECTION — STAGGER rungs and BACKFIRE, every denied motion turned inward.
 *   - THE DOCKET — the CHARGE tally, and the two ways to spend it (the Summing
 *     Up cashes it for MARK and cards; the Black Cap rides it to the verdict).
 *   - THE SHAPE OF THE TURN — AMBUSH, FLOW and FINALE, plus
 *     lock_stance and OMEN: this deck wants to know what the foe will do, and
 *     then not let them do it.
 *
 * CONDEMN RESCALE (2026-09-02, twice): the old flat 8-Charge concession is
 * repealed, and the difficulty ladder that replaced it was itself rescaled to
 * 12 / 24 / 40 / 60 after an apocryphal card filing nine Charges beat the
 * deliberately unwinnable Unfinished 87% of the time.
 * `the-black-cap` declares SENTENCE at 12 and CONDEMN at 14 — a two-Charge
 * overshoot off a full docket, above the base floor of 12 (elite / boss /
 * unique fights raise it to 24 / 40 / 60 via `concedeFloorFor`), so the
 * alt-win must be *built* rather than stumbled into.
 * Exactly one card in this file carries a `peroration` with `concedeAt`.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';
/** /adjust-cards pass 2 (2026-09-06) — the two cards below answer the
 *  standing loop-call ("CHAIN and OMEN each show exactly 1 card carrier",
 *  `plan/AUDIT.md`, filed by `/adjust-keywords` pass 1's rider-inclusive
 *  carrier audit): both keywords anchor a named atlas family (the damage
 *  octet; tempo-and-control) and read as deliberate, so the fix is a second
 *  carrier, not a retirement. See the two cards' own `// pts:` comments. */
const ADDED_P2 = '2026-09-06';
/** /adjust-cards pass 3 (2026-09-08) — the two cards below answer the
 *  standing loop-call ("AMBUSH and FINALE now print correctly but still show
 *  exactly 1 card carrier each", `plan/AUDIT.md`, filed by `/adjust-keywords`
 *  pass 2's structural audit after fixing the print-text bug): same shape as
 *  pass 2's CHAIN/OMEN answer — both are the "turn shape" family's own
 *  registry keywords (`docs/keyword-atlas.md`), the print bug that would
 *  have complicated the call is already fixed, and `kb:dawncaster/
 *  keywords.csv` shows both spread across many cards in the genre (Ambush:
 *  Advance, Aimed Shot, Boarding Party, Daggers…; Finale: Adrenaline Rush,
 *  Cranium Blow, Daring Dash…) — so the fix is a second carrier per keyword,
 *  not a retirement (mirrors CURDLE's opposite resolution, where the KB gave
 *  no such spread). Placed one rank above each's existing carrier (Splinter
 *  → Skull for AMBUSH, Skull → Rib for FINALE) so the family reads across
 *  two power levels, same as pass 2's CHAIN/OMEN spread. */
const ADDED_P3 = '2026-09-08';

// ─── ASH — the arraignment ───────────────────────────────────────────────────

const readingOfTheCharges: Card = {
    id: 'reading-of-the-charges',
    theme: 'trial',
    name: 'Reading of the Charges',
    philosophicalAspect: 'mind',
    description:
        'The clerk reads without looking up: seven counts, each in a voice ' +
        'like earth on a coffin lid. By the third, the gallery remembers ' +
        'things it never witnessed. That is the point of reading them aloud.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 6. Apply MARK 2 for 3 turns. Gain 3 CHARGES.',
    // pts: deal 6 + mark i2 d3 + 3 charges; FREE deal 3 / 1 charge. The
    // theme's opening move — evidence and docket in the same breath.
    free: { damage: 3, premises: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 6 },
        { kind: 'premise', count: 3 },
    ],
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    addedIn: ADDED,
    tags: ['trial', 'evidence', 'charge'],
};

const hueAndCry: Card = {
    id: 'hue-and-cry',
    theme: 'trial',
    name: 'Hue and Cry',
    philosophicalAspect: 'body',
    description:
        'By old law every soul within earshot must drop the plough and run ' +
        'the felon down. Nobody remembers repealing it. The village comes ' +
        'over the hill with whatever was nearest the door.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 8. CHAIN 4 — your next hit lands for 4 more.',
    // pts: deal 8 + chain 4; FREE deal 3 / chain 2. Trial's borrowed tempo
    // verb: the pursuit is worth more the longer you keep swinging.
    free: { damage: 3, chain: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 8 },
        { kind: 'chain', amount: 4 },
    ],
    addedIn: ADDED,
    tags: ['trial', 'chain', 'tempo'],
};

const benefitOfClergy: Card = {
    id: 'benefit-of-clergy',
    theme: 'trial',
    name: 'Benefit of Clergy',
    philosophicalAspect: 'heart',
    description:
        'You cannot read, but you have the neck-verse by heart, and the ' +
        'bench cannot tell the difference. Recite it steadily. The rope ' +
        'waits, patient as a clerk, for the one stumble.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 10. Gain 3 CHARGES.',
    // pts: guard 10 + 3 charges; FREE guard 4 / 1 charge. The theme's only
    // pure defence — you buy a round and file paperwork while you do it.
    free: { guard: 4, premises: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'premise', count: 3 },
    ],
    addedIn: ADDED,
    tags: ['trial', 'guard', 'charge'],
};

// ─── TOOTH — the counts entered ──────────────────────────────────────────────

const scoldsBridle: Card = {
    id: 'scolds-bridle',
    theme: 'trial',
    name: "Scold's Bridle",
    philosophicalAspect: 'body',
    description:
        'An iron cage for the jaw and a spike to keep the tongue devout. ' +
        'Whatever they meant to howl is entered in the record as silence. ' +
        'Silence, the court agrees, has always been a confession.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 11. STAGGER 1. Apply BACKFIRE 4 for 3 turns.',
    // pts: deal 11 + stagger 1 + backfire i4 d3; FREE deal 4 / backfire i2 d2.
    // The objection starter: take a rung, then make the missing rung hurt.
    free: { damage: 4, applyEffect: { effectId: 'debuff_backfire', intensity: 2, duration: 2 } },
    specialMechanics: [
        { kind: 'deal', amount: 11 },
        { kind: 'stagger', rungs: 1 },
    ],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 4, duration: 3 }],
    addedIn: ADDED,
    tags: ['trial', 'objection', 'backfire'],
};

const billOfParticulars: Card = {
    id: 'bill-of-particulars',
    theme: 'trial',
    name: 'Bill of Particulars',
    philosophicalAspect: 'mind',
    description:
        'Not the crime — the crime itemised. Where, and at what hour, and ' +
        'with whose knife, and how many times. The foe learns what they did ' +
        'from a man who was not there, and cannot say he is wrong.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 12. Gain 5 CHARGES.',
    // pts: deal 12 + 5 charges; FREE deal 4 / 2 charges. The docket engine at
    // Tooth: the biggest single filing you can make before Skull.
    free: { damage: 4, premises: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 12 },
        { kind: 'premise', count: 5 },
    ],
    addedIn: ADDED,
    tags: ['trial', 'charge', 'docket'],
};

const theGalleryMurmurs: Card = {
    id: 'the-gallery-murmurs',
    theme: 'trial',
    name: 'The Gallery Murmurs',
    philosophicalAspect: 'heart',
    description:
        'No one word is loud enough to be struck from the record, and so ' +
        'none of them are. The sound comes off the benches like weather. ' +
        'The foe has begun to answer people who are not asking.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 3 to the foe 4 times. Gain 3 CHARGES.',
    // pts: deal 3 x4 + 3 charges; FREE deal 4 / 1 charge. Four small voices,
    // so it feeds anything that counts damage instances.
    free: { damage: 4, premises: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 3, hits: 4 },
        { kind: 'premise', count: 3 },
    ],
    addedIn: ADDED,
    tags: ['trial', 'multi-hit', 'charge'],
};

// ─── SPLINTER — the evidence taken ───────────────────────────────────────────

const thePrickingNeedle: Card = {
    id: 'the-pricking-needle',
    theme: 'trial',
    name: 'The Pricking Needle',
    philosophicalAspect: 'body',
    description:
        'Three inches of licensed steel, probing for the spot the Devil ' +
        'kissed numb. Where the needle draws no blood, the court draws its ' +
        'conclusion. Each dry wound is another count, written down twice.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 15. Apply MARK 4 for 3 turns. On a matching die, gain 4 CHARGES.',
    // pts: deal 15 + mark i4 d3 + dieBonus match [4 charges]; FREE deal 6 /
    // mark i2 d2. The evidence pile the Black Cap eventually detonates.
    free: { damage: 6, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    specialMechanics: [{ kind: 'deal', amount: 15 }],
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 4, duration: 3 }],
    dieBonus: { onColor: 'match', rider: { premises: 4 } },
    addedIn: ADDED,
    tags: ['trial', 'evidence', 'mark'],
};

const struckFromTheRecord: Card = {
    id: 'struck-from-the-record',
    theme: 'trial',
    name: 'Struck from the Record',
    philosophicalAspect: 'mind',
    description:
        'The clerk draws one wet line and the thing unhappens. It was said. ' +
        'Everyone heard it said. It was not said. Go on, the bench tells ' +
        'them, and there is nowhere left to go on to.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        "Deal 16. The foe's next stance locks and stands revealed. AMBUSH — as your turn's first spell, STAGGER 1 and gain 4 CHARGES.",
    // pts: deal 16 + lock_stance + opening[stagger 1, 4 charges]; FREE deal 6
    // / reveal. AMBUSH shape: lead with it and you own the whole phase.
    free: { damage: 6, revealStance: true },
    specialMechanics: [
        { kind: 'deal', amount: 16 },
        { kind: 'lock_stance' },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { stagger: 1, premises: 4 },
    },
    addedIn: ADDED,
    tags: ['trial', 'control', 'ambush'],
};

const thePerjurersTongue: Card = {
    id: 'the-perjurers-tongue',
    theme: 'trial',
    name: "The Perjurer's Tongue",
    philosophicalAspect: 'heart',
    description:
        'The statute is explicit about the instrument and silent about the ' +
        'aftercare. What they swore to comes back up the same road it went ' +
        'down. Every further word they attempt is paid for at the source.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 14. Apply BACKFIRE 6 for 3 turns. FLOW — with a spell already resolved this turn, deal 8 more and gain 4 CHARGES.',
    // pts: deal 14 + backfire i6 d3 + flow[deal 8, 4 charges]; FREE deal 6 /
    // backfire i2 d2. The mid-turn card: it wants to be second, not first.
    free: { damage: 6, applyEffect: { effectId: 'debuff_backfire', intensity: 2, duration: 2 } },
    specialMechanics: [{ kind: 'deal', amount: 14 }],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 6, duration: 3 }],
    synergy: {
        statePredicate: { kind: 'flow', minPriorSpells: 1 },
        rider: { damage: 8, premises: 4 },
    },
    addedIn: ADDED,
    tags: ['trial', 'backfire', 'flow'],
};

// ─── RIB — the case put ──────────────────────────────────────────────────────

const contemptOfCourt: Card = {
    id: 'contempt-of-court',
    theme: 'trial',
    name: 'Contempt of Court',
    philosophicalAspect: 'heart',
    description:
        'They rose. They struck the rail. Good — every violence offered in ' +
        'this room is testimony now, and the bench is grateful for the ' +
        'demonstration.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 22. STAGGER 2. Apply BACKFIRE 8 for 3 turns. If the foe drew blood since your last turn, STAGGER 2 more and gain 5 CHARGES.',
    // pts: deal 22 + stagger 2 + backfire i8 d3 + drew-blood[stagger 2,
    // 5 charges]; FREE deal 8 / backfire i3 d2. The outburst that struck you
    // becomes the charge — this is the card that punishes a hit you ate.
    free: { damage: 8, applyEffect: { effectId: 'debuff_backfire', intensity: 3, duration: 2 } },
    specialMechanics: [
        { kind: 'deal', amount: 22 },
        { kind: 'stagger', rungs: 2 },
    ],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 8, duration: 3 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { stagger: 2, premises: 5 },
    },
    addedIn: ADDED,
    tags: ['trial', 'objection', 'contempt'],
};

const pressedForAPlea: Card = {
    id: 'pressed-for-a-plea',
    theme: 'trial',
    name: 'Pressed for a Plea',
    philosophicalAspect: 'body',
    description:
        'They will not plead, so the court lays a board across them and ' +
        'adds a stone, and asks again. Then another stone, and asks again. ' +
        'The law is very patient and the barn has a great many stones.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 7 to the foe 4 times. Gain 4 CHARGES. FLOW — with 2 spells already resolved this turn, deal 14 more and gain 4 CHARGES.',
    // pts: deal 7 x4 + 4 charges + flow-2[deal 14, 4 charges]; FREE deal 9 /
    // 2 charges. The third card of a long turn: stone by stone by stone.
    free: { damage: 9, premises: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 7, hits: 4 },
        { kind: 'premise', count: 4 },
    ],
    synergy: {
        statePredicate: { kind: 'flow', minPriorSpells: 2 },
        rider: { damage: 14, premises: 4 },
    },
    addedIn: ADDED,
    tags: ['trial', 'multi-hit', 'flow'],
};

const theSummingUp: Card = {
    id: 'the-summing-up',
    theme: 'trial',
    name: 'The Summing Up',
    philosophicalAspect: 'mind',
    description:
        'He gathers three days of testimony into eleven minutes and gives ' +
        'the jury the shape of it, which is not the same as the truth of ' +
        'it. He also tells them, kindly, what the accused will try next.',
    tier: 3, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 20. Spend every CHARGE — 1 MARK for every 3 spent, draw 1 for every 4 spent. OMEN — stake 2 Conviction on the foe stance up to 2 phases out; on a hit gain 6 CHARGES and STAGGER 2.',
    // pts: deal 20 + spend_premises 3/4 + omen w2 ante 2 [6 charges,
    // stagger 2]; FREE 3 charges / foretell 1. The docket's OTHER exit: cash
    // the tally for evidence and cards instead of riding it to the verdict.
    free: { premises: 3, foretell: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 20 },
        { kind: 'spend_premises', markPer: 3, drawPer: 4 },
        { kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { premises: 6, stagger: 2 } },
    ],
    addedIn: ADDED,
    tags: ['trial', 'omen', 'charge', 'payoff'],
};

// ─── SKULL — the bench rules ─────────────────────────────────────────────────

const theAssizeBell: Card = {
    id: 'the-assize-bell',
    theme: 'trial',
    name: 'The Assize Bell',
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever STAGGER or BACKFIRE denies the foe a rung of its telegraph, gain 2 CHARGES and deal 4 to the foe.',
    description:
        'One bronze syllable above the hall, struck for every objection ' +
        'sustained. The jury stopped hearing words some hours ago. They are ' +
        'counting tolls.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — 2 CHARGES and 4 VITAE per denied rung, over the
    // 12-15 rungs a control deck denies in a long fight. This is the oath
    // that turns tempo into the docket, and the docket into the verdict.
    addedIn: ADDED,
    tags: ['trial', 'oath', 'objection'],
};

const judgmentEnteredAgainstThem: Card = {
    id: 'judgment-entered-against-them',
    theme: 'trial',
    name: 'Judgment Entered Against Them',
    philosophicalAspect: 'body',
    description:
        'Every motion denied since the arraignment has been kept somewhere ' +
        'cold, and the ledger is thick now. The bench reads the total aloud ' +
        'in one breath. It arrives on them all at once, as weight.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 30. BACKFIRE ALL — burst 9 for every rung you have denied this fight, then the ledger is cleared. FINALE 1 — with at most 1 card left in hand, deal 20 more and gain 4 CHARGES.',
    // pts: deal 30 + turnabout 9/rung (uncapped — 12-20 banked rungs is
    // 108-180) + finale[deal 20, 4 charges]; FREE deal 12 / stagger 2. The
    // theme's damage capstone: everything you refused them, returned.
    free: { damage: 12, stagger: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 30 },
        { kind: 'turnabout', burstPerRung: 9 },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 1 },
        rider: { damage: 20, premises: 4 },
    },
    addedIn: ADDED,
    tags: ['trial', 'turnabout', 'payoff', 'finale'],
};

// ─── SAINT — the verdict ─────────────────────────────────────────────────────

const theBlackCap: Card = {
    id: 'the-black-cap',
    theme: 'trial',
    name: 'The Black Cap',
    philosophicalAspect: 'heart',
    description:
        'A square of black silk, lighter than a moth, heavier than the ' +
        'church roof. He sets it upon the wig without hurry, for the ' +
        'sentence was drafted before the arraignment. The trial is only the ' +
        'reading aloud.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict DOOM 12. Gain 5 CHARGES. SENTENCE at 12 — RUPTURE every MARK for 8 apiece, STAGGER 2, draw 2. CONDEMN at 14 wins outright against a lesser foe. An elite demands 24, a boss 40, a unique 60.',
    // pts: DOOM i12 + 5 charges + SENTENCE-at-12 [ruptureMarks 8, stagger 2,
    // draw 2] + CONDEMN 14; FREE DOOM i4 / 3 charges. The one alt-win card in
    // the theme. CONDEMN is a two-Charge overshoot off a full docket, so it
    // must be built: the old flat 8 is repealed.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 4 }, premises: 3 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 12 }],
    specialMechanics: [
        { kind: 'premise', count: 5 },
        {
            kind: 'peroration',
            at: 12,
            rider: { ruptureMarks: 8, stagger: 2, drawCards: 2 },
            concedeAt: 14,
        },
    ],
    addedIn: ADDED,
    tags: ['trial', 'verdict', 'alt-win', 'payoff'],
};

const writOfAttainder: Card = {
    id: 'writ-of-attainder',
    theme: 'trial',
    name: 'Writ of Attainder',
    philosophicalAspect: 'body',
    persistentEffect:
        'At the end of each round, inflict DOOM 3 on the foe and gain 2 CHARGES.',
    description:
        'By this writ the blood itself stands condemned: nothing it feeds ' +
        'may inherit, nothing it warms may be spared. Each dawn the seal is ' +
        'pressed anew, and each dawn it bites deeper into the vein.',
    tier: 3, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — a fresh DOOM 3 each round onto a stack that already
    // grows as the foe acts, plus 2 CHARGES a round the deck never had to
    // draw for. The clock that files itself.
    addedIn: ADDED,
    tags: ['trial', 'hex', 'doom'],
};

// ─── pass 2 — a second carrier for CHAIN and for OMEN (2026-09-06) ──────────

const theVillageComesOverTheHill: Card = {
    id: 'the-village-comes-over-the-hill',
    theme: 'trial',
    name: 'The Village Comes Over the Hill',
    philosophicalAspect: 'heart',
    description:
        'Hue and Cry only starts it. By the second field the miller has ' +
        'joined, and the smith, and every idle hand between here and the ' +
        'church. Nobody agrees what the felon did. Everybody agrees to catch them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 20. CHAIN 8 — your next hit lands for 8 more. FLOW — with a spell already resolved this turn, CHAIN 6 more and gain 3 CHARGES.',
    // pts: deal 20 (6.67) + chain 8 (4) + flow[chain 6, 3 charges] rider
    // (5.4 * 0.5 threshold discount = 2.7); FREE deal 8 / chain 3. Trial's
    // second CHAIN carrier (the atlas's own "≥2 cards" discipline) — Hue and
    // Cry starts the pursuit at Ash, this is the mob arriving in force once
    // the turn is already moving.
    free: { damage: 8, chain: 3 },
    specialMechanics: [
        { kind: 'deal', amount: 20 },
        { kind: 'chain', amount: 8 },
    ],
    synergy: {
        statePredicate: { kind: 'flow', minPriorSpells: 1 },
        rider: { chain: 6, premises: 3 },
    },
    addedIn: ADDED_P2,
    tags: ['trial', 'chain', 'tempo', 'flow'],
};

const theDuckingStool: Card = {
    id: 'the-ducking-stool',
    theme: 'trial',
    name: 'The Ducking Stool',
    philosophicalAspect: 'body',
    description:
        'They tie the rope and lower her once, to see which way the river ' +
        'rules. The court has already guessed the verdict. The water is ' +
        'only asked to make it official.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 14. OMEN — stake 2 Conviction on the foe stance up to 2 phases out; on a hit, deal 12 more and STAGGER 1.',
    // pts: deal 14 (4.67) + omen w2 ante 2 [deal 12, stagger 1] (rider 6 *
    // 0.6 dieBonus discount + 1 omenInfo - 2*0.75 ante credit = 3.1); FREE
    // deal 6 / reveal (2 + 1.5). Trial's second OMEN carrier (the atlas's
    // own "≥2 cards" discipline) — where the Summing Up cashes a full
    // docket's prediction, this stakes the ordeal itself: guilty either way,
    // the water only confirms which.
    free: { damage: 6, revealStance: true },
    specialMechanics: [
        { kind: 'deal', amount: 14 },
        { kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { damage: 12, stagger: 1 } },
    ],
    addedIn: ADDED_P2,
    tags: ['trial', 'omen', 'ordeal'],
};

// ─── pass 3 — a second carrier for AMBUSH and for FINALE (2026-09-08) ───────

const theDoorComesDownFirst: Card = {
    id: 'the-door-comes-down-first',
    theme: 'trial',
    name: 'The Door Comes Down First',
    philosophicalAspect: 'mind',
    description:
        'The warrant is read afterward, to whoever is left standing to hear ' +
        'it. Everything about this arrest happens in the wrong order on ' +
        'purpose — the knowing comes last, if it comes at all.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 34. AMBUSH — as your turn\'s first spell, STAGGER 2 and gain 8 CHARGES.',
    // pts: deal 34 (11.33) + opening[stagger 2, 8 charges] rider (10.4 * 0.5
    // threshold discount = 5.2) + FREE deal 12 / 2 charges. Trial's second
    // AMBUSH carrier (the atlas's own "≥2 cards" discipline) — a Skull-rank
    // raid, not the Splinter-rank arraignment Struck from the Record already
    // owns: the door is already down before the foe finishes its stance.
    free: { damage: 12, premises: 2 },
    specialMechanics: [{ kind: 'deal', amount: 34 }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { stagger: 2, premises: 8 },
    },
    addedIn: ADDED_P3,
    tags: ['trial', 'ambush', 'charge'],
};

const nothingFurtherYourHonour: Card = {
    id: 'nothing-further-your-honour',
    theme: 'trial',
    name: 'Nothing Further, Your Honour',
    philosophicalAspect: 'heart',
    description:
        'The advocate sits down. There is nothing left in the folder and ' +
        'she has said so plainly, which is its own kind of weapon — a case ' +
        'that ends on a clean sentence lands harder than one that trails off.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 24. Apply BACKFIRE 6 for 3 turns. FINALE 1 — with at most 1 card left in hand, deal 16 more and STAGGER 2.',
    // pts: deal 24 (8) + backfire i6 d3 (13.5) + finale[deal 16, stagger 2]
    // rider (9.33 * 0.5 threshold discount = 4.67) + FREE deal 8 / backfire
    // i2 d2. Trial's second FINALE carrier (the atlas's own "≥2 cards"
    // discipline) — a Rib-rank closing argument, not the Skull-rank verdict
    // Judgment Entered Against Them already owns: the hand runs empty and the
    // last word lands anyway.
    free: { damage: 8, applyEffect: { effectId: 'debuff_backfire', intensity: 2, duration: 2 } },
    specialMechanics: [{ kind: 'deal', amount: 24 }],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 6, duration: 3 }],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 1 },
        rider: { damage: 16, stagger: 2 },
    },
    addedIn: ADDED_P3,
    tags: ['trial', 'finale', 'backfire'],
};

/** The Indictment — 20 cards, rank-ascending (pass 2 added a second CHAIN
 *  carrier and a second OMEN carrier; pass 3 added a second AMBUSH carrier
 *  and a second FINALE carrier; see `plan/CONTENT_LEDGER.md`). */
export const TRIAL_CARDS: Card[] = [
    readingOfTheCharges, hueAndCry, benefitOfClergy,
    scoldsBridle, billOfParticulars, theGalleryMurmurs,
    thePrickingNeedle, struckFromTheRecord, thePerjurersTongue,
    contemptOfCourt, pressedForAPlea, theSummingUp, nothingFurtherYourHonour,
    theAssizeBell, judgmentEnteredAgainstThem, theDoorComesDownFirst,
    theBlackCap, writOfAttainder,
    theVillageComesOverTheHill, theDuckingStool,
];
