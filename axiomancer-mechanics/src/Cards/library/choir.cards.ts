/**
 * THE PALE CHOIR — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The choir package owns RESOLVE and HARVEST. Its two arms are the plate and
 * the psalm: PLEA piled onto the foe until it RELENTS, and Souls collected off
 * every ending in the nave until one REAP pays for the whole service. QUARTER,
 * HEAL, CLEANSE, KINDLE and DOOM are the utility it borrows to stay standing
 * long enough to finish the argument.
 *
 * Scale (2026-09-02): the RELENT threshold is 35% of the foe's VITAE with a
 * floor of 10, against pools running 48 (level-one trash) to 900 (a late
 * boss). So Ash PLEA is 8, Saint PLEA is 38 and carries its own multiplier —
 * and `reap_all` is uncapped, so Miserere's 14-per-Soul against a fat bank is
 * a three-figure swing and is meant to be.
 *
 * Shape follows `starters.cards.ts` exactly: a FREE line worth playing without
 * a die, a PAID line whose printed numbers are the applied numbers, a
 * `paidSummary` naming every one of them, and a `// pts:` design note.
 *
 * Data only. All runtime behaviour lives in `src/Cards/card.engine.ts` and
 * `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── ASH — the parish at its poorest ─────────────────────────────────────────

const almsOfBreath: Card = {
    id: 'alms-of-breath',
    theme: 'choir',
    name: 'Alms of Breath',
    philosophicalAspect: 'heart',
    description:
        'The Choir does not beg. It offers — a bar of warm song pressed into ' +
        'the cold of you — and notes, in the parish ledger, what loosens as ' +
        'you take it. Charity, in that book, is spelt the same as debt.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply QUARTER 2 for 2 turns. PLEA 8. CLEANSE 1.',
    // pts: the Ash PLEA rate is 8 against a floor of 10, so two of these
    // talk a level-one thing down. FREE seeds the plate for everything after.
    free: { sway: 3, souls: 1 },
    combatEffects: [{ effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'sway', amount: 8 },
        { kind: 'rider', rider: { cleanse: 1 } },
    ],
    addedIn: ADDED,
    tags: ['choir', 'plea', 'mercy'],
};

const theBellRope: Card = {
    id: 'the-tolling-hand',
    theme: 'choir',
    name: 'The Tolling Hand',
    philosophicalAspect: 'body',
    description:
        'Hemp gone black with sixty years of hands. You put your weight on it ' +
        'and the tower answers, and something in the churchyard stops what it ' +
        'is doing to listen. The rope has killed two ringers. It is still the ' +
        'shortest way to be heard.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 8. Gain 1 SOUL.',
    // pts: deal 8 at the top of the Ash band + the first coin in the plate.
    // The card that teaches a body player that souls come off ordinary work.
    free: { damage: 3 },
    specialMechanics: [
        { kind: 'deal', amount: 8 },
        { kind: 'soul_gain', count: 1 },
    ],
    addedIn: ADDED,
    tags: ['choir', 'soul', 'ash'],
};

const sixpenceForTheFerryman: Card = {
    id: 'sixpence-for-the-ferryman',
    theme: 'choir',
    name: 'Sixpence for the Ferryman',
    philosophicalAspect: 'mind',
    description:
        'Coin under the tongue, pressed in while the jaw still gives. The old ' +
        'rite says it buys passage. The parish has never established who is ' +
        'owed, only that the debt is real and that it accrues from the moment ' +
        'the coin goes in.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict DOOM 3. It grows each time the foe acts. Gain 1 SOUL.',
    // pts: DOOM 3 is the Ash clock, and it is the only clock that gets worse
    // the harder the foe works. FREE plants a smaller one for nothing.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 } },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 3 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    addedIn: ADDED,
    tags: ['choir', 'doom', 'soul'],
};

// ─── TOOTH — the bell and the smoke ──────────────────────────────────────────

const passingBell: Card = {
    id: 'passing-bell',
    theme: 'choir',
    name: 'Passing-Bell',
    philosophicalAspect: 'mind',
    description:
        'In the pale parish the bell is rung before the death, to spare the ' +
        'ringer a second climb. Each round it tolls a little louder, so the ' +
        'body knows its cue. The first soul is collected as a deposit.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict DOOM 5. It grows each time the foe acts. Gain 2 SOULS.',
    // pts: DOOM 5 at Tooth plus two coins. FREE mends 4 and banks 1 — the
    // dieless line a heart-poor turn still wants.
    free: { healHp: 4, souls: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 5 }],
    specialMechanics: [{ kind: 'soul_gain', count: 2 }],
    addedIn: ADDED,
    tags: ['choir', 'doom', 'soul'],
};

const theCharnelCenser: Card = {
    id: 'the-charnel-censer',
    theme: 'choir',
    name: 'The Charnel Censer',
    philosophicalAspect: 'body',
    description:
        'Brass on a short chain, swung hard enough to be a weapon and often ' +
        'used as one. What burns inside it is not frankincense and has not ' +
        'been since the roads closed. The smoke goes into a thing and takes ' +
        'the fight out by the roots.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 13. Apply QUARTER 2 for 2 turns.',
    // pts: deal 13 at the top of Tooth + QUARTER 2 shaving the return blow.
    // The body card that keeps a choir deck alive while it does the talking.
    free: { damage: 5 },
    combatEffects: [{ effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'deal', amount: 13 }],
    addedIn: ADDED,
    tags: ['choir', 'quarter', 'tooth'],
};

// ─── SPLINTER — the service proper ───────────────────────────────────────────

const lastRitesSungEarly: Card = {
    id: 'last-rites-sung-early',
    theme: 'choir',
    name: 'Last Rites, Sung Early',
    philosophicalAspect: 'body',
    description:
        'Why keep vigil at a sickbed when the psalm already knows the ending? ' +
        'The Choir sings the rite at double time, and whatever ailed them ' +
        'concludes — all of it, at once, as promised. The soul comes away ' +
        'neat, like a tooth already loose.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RUPTURE 1 affliction. Its remaining damage lands now. Gain 3 SOULS. A matching die adds 1 more Soul.',
    // pts: the harvest verb — cash an affliction early for three coins, four
    // on colour. FREE is a real Splinter mend plus PLEA 5 toward the floor.
    free: { sway: 5, healHp: 6 },
    specialMechanics: [{ kind: 'consume_affliction', souls: 3 }],
    dieBonus: { onColor: 'match', rider: { souls: 1 } },
    addedIn: ADDED,
    tags: ['choir', 'harvest', 'payoff'],
};

const naveFullOfStrangers: Card = {
    id: 'nave-full-of-strangers',
    theme: 'choir',
    name: 'Nave Full of Strangers',
    philosophicalAspect: 'heart',
    description:
        'Nobody knows whose funeral it is. They came for the warmth and ' +
        'stayed for the singing, and now there are forty of them between you ' +
        'and the door, all facing the same way, all agreeing. It is very hard ' +
        'to swing at a room that is being kind to you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'PLEA 16. Apply QUARTER 3 for 3 turns. With 3 heart dice spent this fight, HEAL 12.',
    // pts: the Splinter PLEA rate. Sixteen a swing means a 48-VITAE thing is
    // two cards from RELENT and a boss is a genuine project.
    free: { sway: 6 },
    combatEffects: [{ effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    specialMechanics: [{ kind: 'sway', amount: 16 }],
    threshold: { color: 'heart', count: 3, rider: { healHp: 12 } },
    addedIn: ADDED,
    tags: ['choir', 'plea', 'quarter'],
};

const thePardonersLadder: Card = {
    id: 'the-pardoners-ladder',
    theme: 'choir',
    name: "The Pardoner's Ladder",
    philosophicalAspect: 'mind',
    description:
        'Seven rungs, one for each sin he was licensed to forgive, and an ' +
        'eighth he added himself. He is dead. The ladder is still leaning ' +
        'against the wall where he left it, and it still goes up.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'Heal 12. Draw 1. KINDLE a mind die. With 3 mind dice spent this fight, CLEANSE 2.',
    // pts: no damage at all and it is still a card you keep — the Splinter
    // mend, a card, and a fresh die. FREE mends 5 for nothing.
    free: { healHp: 5 },
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 12, drawCards: 1 } },
        { kind: 'create_temporary_die', color: 'mind' },
    ],
    threshold: { color: 'mind', count: 3, rider: { cleanse: 2 } },
    addedIn: ADDED,
    tags: ['choir', 'heal', 'kindle'],
};

// ─── RIB — the plate goes round ──────────────────────────────────────────────

const theOffertoryPlate: Card = {
    id: 'the-offertory-plate',
    theme: 'choir',
    name: 'The Offertory Plate',
    philosophicalAspect: 'heart',
    description:
        'It goes hand to hand and is never empty, and the parish long ago ' +
        'stopped asking what fills it. Spend from it and the Choir grows ' +
        'kind — a new voice in the loft, a gentled foe in the nave, a hymn ' +
        'with your name worked into the descant.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'REAP 3. PLEA 18, apply QUARTER 3 for 3 turns, and KINDLE a heart die. With 3 heart dice spent this fight, gain 2 SOULS.',
    // pts: the theme's engine card — spend three coins for the Rib PLEA rate,
    // a wall of QUARTER, and the die that pays for the next card.
    free: { souls: 2, sway: 6 },
    specialMechanics: [
        {
            kind: 'reap', cost: 3, kindle: 'heart',
            rider: { sway: 18, applyEffect: { effectId: 'debuff_quarter', intensity: 3, duration: 3 } },
        },
    ],
    threshold: { color: 'heart', count: 3, rider: { souls: 2 } },
    addedIn: ADDED,
    tags: ['choir', 'reap', 'engine'],
};

const theCoffinPath: Card = {
    id: 'the-coffin-path',
    theme: 'choir',
    name: 'The Coffin Path',
    philosophicalAspect: 'body',
    description:
        'The old way over the fell, walked only by the dead and whoever is ' +
        'carrying them. Four bearers, four stones to rest the box on, four ' +
        'chances to set it down and not pick it up again. You have carried ' +
        'worse. You will carry worse.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 7 damage 4 times. Gain 2 SOULS. OVERKILL grants 1 SOUL for every 8 excess VITAE.',
    // pts: 7 x 4 is the Rib multi-hit — four separate instances, so a BLEED
    // on the foe fires four times. OVERKILL turns a wasted finisher into bank.
    free: { damage: 9 },
    specialMechanics: [
        { kind: 'deal', amount: 7, hits: 4 },
        { kind: 'soul_gain', count: 2 },
        { kind: 'overkill', per: 8, souls: 1 },
    ],
    addedIn: ADDED,
    tags: ['choir', 'soul', 'multi-hit'],
};

const everyNameInTheRegister: Card = {
    id: 'every-name-in-the-register',
    theme: 'choir',
    name: 'Every Name in the Register',
    philosophicalAspect: 'mind',
    description:
        'Baptisms, marriages, burials, in three hands and four inks, back to ' +
        'a year nobody can read. You start at the front and you do not stop. ' +
        'Somewhere in the middle the foe hears one it recognises, and after ' +
        'that it is only a question of how long you are willing to read.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'PLEA 24. Gain 2 SOULS. In FLOW, after 2 other spells this turn, PLEA 10 more.',
    // pts: the Rib PLEA rate, and the reward for a turn that keeps going —
    // 34 in a full FLOW turn is most of the way through a mid-tier floor.
    free: { sway: 9 },
    specialMechanics: [
        { kind: 'sway', amount: 24 },
        { kind: 'soul_gain', count: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'flow', minPriorSpells: 2 },
        rider: { sway: 10 },
    },
    addedIn: ADDED,
    tags: ['choir', 'plea', 'flow'],
};

// ─── SKULL — the reliquary and the crowd ─────────────────────────────────────

const choirboneReliquary: Card = {
    id: 'choirbone-reliquary',
    theme: 'choir',
    name: 'Choirbone Reliquary',
    philosophicalAspect: 'body',
    persistentEffect:
        'Whenever an affliction on the foe expires or is consumed, gain 1 SOUL and PLEA 4.',
    description:
        'A box of jaws that remembers every ending it has witnessed. When ' +
        'something in the foe gutters out — a fever, a wound, a curse run ' +
        'dry — the box counts it, and hums.',
    tier: 3, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — six to eight expiries a fight, each a coin and PLEA 4.
    // The oath that makes the rot half of a choir deck pay twice.
    addedIn: ADDED,
    tags: ['choir', 'harvest', 'oath'],
};

const thePaleCongregation: Card = {
    id: 'the-pale-congregation',
    theme: 'choir',
    name: 'The Pale Congregation',
    philosophicalAspect: 'heart',
    description:
        'They fill the pews from the back, as they always did, and they are ' +
        'thicker than a wall and quieter than snow. Nothing gets through a ' +
        'congregation. That is what a congregation is for, and it has never ' +
        'much mattered whether they were breathing.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'Heal 22. GUARD 36. Gain 3 SOULS. KINDLE a heart die.',
    // pts: the survival beat that also fills the plate — three coins is a
    // quarter of the bank Miserere wants, bought with a turn of standing still.
    free: { healHp: 8, guard: 12, souls: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 36 },
        { kind: 'rider', rider: { healHp: 22 } },
        { kind: 'soul_gain', count: 3 },
        { kind: 'create_temporary_die', color: 'heart' },
    ],
    addedIn: ADDED,
    tags: ['choir', 'heal', 'soul'],
};

// ─── SAINT — the whole plate, the whole psalm ────────────────────────────────

const miserere: Card = {
    id: 'miserere',
    theme: 'choir',
    name: 'Miserere',
    philosophicalAspect: 'heart',
    description:
        'Have mercy is a request with a price, and the Choir sings it holding ' +
        'the whole collection. Every soul in the plate goes up at once, one ' +
        'syllable each. Half of what burns comes home to mend the singers.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'REAP ALL. 14 damage per Soul spent. SIPHON 50% of the harvest. Powered off-colour: gain 4 SOULS and PLEA 12, and RECOIL 6.',
    // pts: uncapped by law — 12 Souls is 168, and half of it comes back as
    // VITAE. The whole deck is a machine for making this one swing large.
    // The off-colour dieBonus (folded from the retired X-die `fate` line)
    // re-seeds the plate at a blood price.
    free: { sway: 10, souls: 3 },
    specialMechanics: [
        { kind: 'reap_all', burstPerSoul: 14 },
        { kind: 'siphon', pct: 0.5 },
    ],
    dieBonus: { onColor: 'off', rider: { souls: 4, sway: 12, recoil: 6 } },
    addedIn: ADDED,
    tags: ['choir', 'reap', 'capstone'],
};

const teDeumForADyingThing: Card = {
    id: 'te-deum-for-a-dying-thing',
    theme: 'choir',
    name: 'Te Deum for a Dying Thing',
    philosophicalAspect: 'heart',
    description:
        'The thanksgiving hymn, sung for a thing that has not finished dying ' +
        'yet, in the full voice the parish keeps for saints. Nobody has ever ' +
        'been praised like this. It cannot lift its hand while it is being ' +
        'praised like this.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'PLEA 38. Heal 30. Apply QUARTER 4 for 3 turns. Gain Grace Momentum 2 for 5 turns, and each stack adds 12 percent to the PLEA you deal.',
    // pts: the Saint PLEA rate plus the multiplier — 38 now and every later
    // PLEA worth a quarter more. The card that talks a 900-VITAE boss down.
    free: { sway: 14, healHp: 10 },
    combatEffects: [
        { effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 4, duration: 3 },
        { effectId: 'buff_grace_momentum', appliedTo: 'self', intensity: 2, duration: 5 },
    ],
    specialMechanics: [
        { kind: 'sway', amount: 38 },
        { kind: 'rider', rider: { healHp: 30 } },
    ],
    addedIn: ADDED,
    tags: ['choir', 'plea', 'capstone'],
};

const theLongAmen: Card = {
    id: 'the-long-amen',
    theme: 'choir',
    name: 'The Long Amen',
    philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, the foe gains PLEA equal to 3 times the number of Souls you hold.',
    description:
        'The final word of the service, held past the organ, past the ' +
        'candle-stubs, past the congregation\'s patience. It does not ' +
        'resolve. It accrues. Every soul you keep lends it another voice, and ' +
        'the foe stands in the nave, listening — agreeing.',
    tier: 3, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — a bank of 8 Souls is PLEA 24 a round for free, and it
    // is the exact opposite advice to the plate. Hold or spend, never both.
    addedIn: ADDED,
    tags: ['choir', 'plea', 'hex'],
};

/** The Pale Choir, rank-ascending. */
export const CHOIR_CARDS: Card[] = [
    almsOfBreath, theBellRope, sixpenceForTheFerryman,
    passingBell, theCharnelCenser,
    lastRitesSungEarly, naveFullOfStrangers, thePardonersLadder,
    theOffertoryPlate, theCoffinPath, everyNameInTheRegister,
    choirboneReliquary, thePaleCongregation,
    miserere, teDeumForADyingThing, theLongAmen,
];
