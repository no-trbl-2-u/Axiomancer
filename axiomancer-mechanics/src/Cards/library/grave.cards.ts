/**
 * GRAVE — THE EXHUMATION — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The deck is the resource. Grave mills it, reaches back into it, and plays its
 * best card again — MILL feeds the discard, RECALL and REPLAY spend it, REQUIEM
 * reads its depth, IMMOLATE burns the parts that were never going to matter,
 * and TWIN is the theme's whole thesis in one word: say it once, resolve it
 * twice.
 *
 * The curve: rank 1-2 fills the pile cheaply, rank 3-4 buys the first real
 * repetition (ECHO, TWIN), rank 5 is the engine (`open-every-grave`'s double
 * REPLAY, the oath's toll), and the Saint line is the payoff the whole file is
 * built toward — 45 damage that arms the next spell to fire twice, and a
 * REQUIEM 24 clause on top for a deck that has actually done the digging.
 *
 * Borrowed axis: DOOM and FORETELL, per `THEME_KEYWORDS.grave`. This file is
 * data-only; all runtime behaviour lives in `src/Cards/card.engine.ts` and
 * `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── ASH — the first two spadefuls ───────────────────────────────────────────

const spadework: Card = {
    id: 'spadework',
    theme: 'grave',
    name: 'Spadework',
    philosophicalAspect: 'body',
    description:
        'The yard takes no appointments, only measurements. You dig ahead of ' +
        'need — two for the stranger, two for the friend — and the soil you ' +
        'throw over your shoulder is a debt the parish now owes you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 8. MILL 3.',
    // pts: deal 8 + mill 3 + FREE deal 3 / mill 1. The theme's opening verb:
    // the pile it fills is the pile every other card in this file spends.
    free: { damage: 3, millCards: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 8 },
        { kind: 'rider', rider: { millCards: 3 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'mill', 'seed'],
};

const theBoneTithe: Card = {
    id: 'the-bone-tithe',
    theme: 'grave',
    name: 'The Bone Tithe',
    philosophicalAspect: 'heart',
    description:
        'One in ten, the charter says, and the charter does not say of what. ' +
        'The ossuary keeps its tenth in tidy stacks and pays the interest ' +
        'back in bread and bandage. Nobody has audited it since the frost.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'MILL 3. Heal 5. Draw 1.',
    // pts: mill 3 + heal 5 + draw 1 + FREE mill 2 / heal 2. No damage at all —
    // the Ash card that keeps a grave deck alive while the pile deepens.
    free: { millCards: 2, healHp: 2 },
    specialMechanics: [{ kind: 'rider', rider: { millCards: 3, healHp: 5, drawCards: 1 } }],
    addedIn: ADDED,
    tags: ['grave', 'mill', 'sustain'],
};

// ─── TOOTH — the pile starts paying ──────────────────────────────────────────

const shallowGrave: Card = {
    id: 'shallow-grave',
    theme: 'grave',
    name: 'Shallow Grave',
    philosophicalAspect: 'heart',
    description:
        'Buried in haste is remembered in full. What the ground barely holds, ' +
        'the hand barely needs to reach for. The briefly-woken dead are ' +
        'briefly generous, and after that they are only angry.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 11. RECALL 1 card from your discard pile.',
    // pts: deal 11 + recall 1 + FREE deal 4 / mill 2. The first loop that
    // closes: the FREE line buries, the PAID line digs the same card back up.
    free: { damage: 4, millCards: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 11 },
        { kind: 'reprise', count: 1 },
    ],
    addedIn: ADDED,
    tags: ['grave', 'recall', 'recursion'],
};

const theQuietRow: Card = {
    id: 'the-quiet-row',
    theme: 'grave',
    name: 'The Quiet Row',
    philosophicalAspect: 'mind',
    description:
        'Twelve plots in a line along the north wall, all of them filled, all ' +
        'of them settled. Stand behind them. Nothing has ever come at you ' +
        'through that row without first explaining itself to the occupants.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 14. MILL 2. Draw 1.',
    // pts: guard 14 + mill 2 + draw 1 + FREE guard 5 / mill 1. Grave's only
    // wall, and it is made of the same thing everything else here is made of.
    free: { guard: 5, millCards: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 14 },
        { kind: 'rider', rider: { millCards: 2, drawCards: 1 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'mill', 'guard'],
};

const theLychGate: Card = {
    id: 'the-lych-gate',
    theme: 'grave',
    name: 'The Lych Gate',
    philosophicalAspect: 'body',
    description:
        'The roof over the gate exists so a coffin may wait out of the rain ' +
        'while the priest is found. Everything that enters the yard pauses ' +
        'here. You have learned to swing the gate on the backswing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 4 damage 3 times. MILL 2.',
    // pts: deal 4 x3 + mill 2 + FREE deal 4 / mill 1. The multi-hit face: three
    // separate instances, so anything that reads damage instances reads three.
    free: { damage: 4, millCards: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 4, hits: 3 },
        { kind: 'rider', rider: { millCards: 2 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'mill', 'multi-hit'],
};

// ─── SPLINTER — the first repetitions ────────────────────────────────────────

const paupersPyre: Card = {
    id: 'paupers-pyre',
    theme: 'grave',
    name: "The Pauper's Pyre",
    philosophicalAspect: 'body',
    description:
        'The parish burns what it cannot afford to bury. The poorest go ' +
        'first, chosen by rank of poverty, and the smoke goes up out of the ' +
        'yard looking for someone to blame.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'IMMOLATE 2, then Deal 20 and Draw 2.',
    // pts: immolate 2 (a printed cost, and pure profit when the fuel is an
    // injected curse) -> deal 20 + draw 2, + FREE deal 6 / mill 2. The deck's
    // disposal verb: the worst two cards in hand become the best twenty damage.
    free: { damage: 6, millCards: 2 },
    specialMechanics: [
        { kind: 'immolate', count: 2, rider: { damage: 20, drawCards: 2 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'immolate', 'filter'],
};

const theCharnelLedger: Card = {
    id: 'the-charnel-ledger',
    theme: 'grave',
    name: 'The Charnel Ledger',
    philosophicalAspect: 'mind',
    description:
        'Every bone in the house is numbered in a hand that gave out in the ' +
        'third decade and kept writing regardless. Read the tally aloud and ' +
        'the stacks lean in to hear their own names. A full book is a wall.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'MILL 4. Draw 2. REQUIEM 12: GUARD 18.',
    // pts: mill 4 + draw 2, with the requiem-12 clause paying guard 18 once the
    // pile is deep, + FREE mill 2 / guard 6. The card that turns the theme's
    // own exhaust into a defensive floor.
    free: { millCards: 2, guard: 6 },
    specialMechanics: [{ kind: 'rider', rider: { millCards: 4, drawCards: 2 } }],
    synergy: {
        statePredicate: { kind: 'requiem', n: 12 },
        rider: { guard: 18 },
    },
    addedIn: ADDED,
    tags: ['grave', 'requiem', 'mill', 'guard'],
};

const theKeening: Card = {
    id: 'the-keening',
    theme: 'grave',
    name: 'The Keening',
    philosophicalAspect: 'heart',
    description:
        'The women of the parish were paid in bread to make this noise, and ' +
        'then the bread ran out, and they kept making it. It goes up twice. ' +
        'The second pass is not repetition. It is the answer.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 8. Inflict DOOM 3 for 3 turns. ECHO.',
    // pts: deal 8 + doom i3 d3, the whole payload fired twice by ECHO (16 and
    // DOOM 6 in practice), + FREE deal 6. Splinter's two-keyword ceiling spent
    // on the theme's cheapest doubling.
    free: { damage: 6 },
    specialMechanics: [
        { kind: 'deal', amount: 8 },
        { kind: 'echo' },
    ],
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    addedIn: ADDED,
    tags: ['grave', 'echo', 'doom'],
};

// `/adjust-keywords` pass 13 (2026-09-19) — FORGE carrier restoration. The
// forge/foundry theme that owned this verb (ex-nihilo) was retired whole by
// THE PROFANE CANON (2026-08-08, commit 84ef85bd), leaving `forge_floating_die`/
// `float_x_die` fully engine-wired (mechanicText, KEYWORD_GLOSS, the mobile
// die-verb headline, card-editor `wx.ts`) but with ZERO live library
// carriers — below the atlas's own "≥2 cards" discipline
// (`docs/keyword-atlas.md` §Discipline), worse than CURDLE's single-carrier
// miss. Per the established precedent for a load-bearing family member (CHAIN/
// OMEN, AMBUSH/FINALE — `plan/AUDIT.md`'s matching rows), a genuine engine
// mechanic with a real registry row and no wiring gap earns a second carrier
// rather than a CURDLE-style retirement; grave's "raise something from below
// that owes you one favor and is gone" register is the closest thematic fit
// in the surviving seven themes (closer than the fixed 3-slot, one-per-aspect
// dice-valve relic seat, which PRESET_DICE_VALVES pins and this pass does not
// touch). KB research (`kb-query`): no on-point Dawncaster analogue exists —
// Dawncaster has no die-tray resource to forge — the nearest genre parallel is
// its Conjure/Create-a-token family (`kb:dawncaster/cards/0150-avenger-s-
// choice-724041.okf.md`, `kb:dawncaster/cards/0180-battle-broth-126459.okf.md`,
// `kb:dawncaster/cards/0213-big-eater-156895.okf.md` — "conjure"/"create" a
// semi-permanent Ingredient resource), community/medium confidence, cited
// honestly as a miss rather than papered over (same shape as OMEN's own
// "no Dawncaster analogue" resolution) — grounded instead in the engine's own
// proven FORGE shape.
const theUnpaidSexton: Card = {
    id: 'the-unpaid-sexton',
    theme: 'grave',
    name: 'The Unpaid Sexton',
    philosophicalAspect: 'mind',
    description:
        'He was buried with his spade, which the parish considered a fair ' +
        'settlement. Nobody told him the shift had ended. Give the ground a ' +
        'task and something down there will still take it up, once, and ' +
        'never complain about the wage again.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 14. FORGE a WILD ghost die that plays beside your drafted die, spent for good.',
    // pts: deal 14 (4.67) + forge wild (forgeFloating 5 + forgeWildBonus 1 =
    // 6) = 10.67, + FREE deal 5. A Splinter hit that also mints a permanent
    // extra die — the theme's first FORGE carrier since ex-nihilo retired.
    free: { damage: 5 },
    specialMechanics: [
        { kind: 'deal', amount: 14 },
        { kind: 'forge_floating_die', color: 'wild' },
    ],
    addedIn: '2026-09-19',
    tags: ['grave', 'forge', 'dice'],
};

// ─── RIB — the loop takes hold ───────────────────────────────────────────────

const dirgeForTheDisinterred: Card = {
    id: 'dirge-for-the-disinterred',
    theme: 'grave',
    name: 'Dirge for the Disinterred',
    philosophicalAspect: 'mind',
    description:
        'Sung once for the dying and twice for the dug-up. When the pile ' +
        'beneath the pulpit grows deep enough, you will find the congregation ' +
        'already knows the words, and has been waiting to be asked.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 11. ECHO. REQUIEM 14: also Deal 12.',
    // pts: deal 11 doubled by ECHO (22), plus a requiem-14 clause for 12 more,
    // + FREE deal 8 / mill 2. The FREE line is what gets the pile to 14.
    free: { damage: 8, millCards: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 11 },
        { kind: 'echo' },
    ],
    synergy: {
        statePredicate: { kind: 'requiem', n: 14 },
        rider: { damage: 12 },
    },
    addedIn: ADDED,
    tags: ['grave', 'requiem', 'echo', 'payoff'],
};

const theSecondBurial: Card = {
    id: 'the-second-burial',
    theme: 'grave',
    name: 'The Second Burial',
    philosophicalAspect: 'body',
    description:
        'The first burial is for the body. The second is for whatever part of ' +
        'them would not settle. Your hands have done this before and already ' +
        'know the shape of doing it again, immediately.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 18. TWIN — your next spell this turn resolves its payload twice.',
    // pts: deal 18 + twin + FREE deal 7. The enabler the Saint line was written
    // for: a Rib-rank hit that makes the next card the biggest card in the game.
    free: { damage: 7 },
    specialMechanics: [
        { kind: 'deal', amount: 18 },
        { kind: 'twin' },
    ],
    addedIn: ADDED,
    tags: ['grave', 'twin', 'enabler'],
};

const graveGoods: Card = {
    id: 'grave-goods',
    theme: 'grave',
    name: 'Grave Goods',
    philosophicalAspect: 'heart',
    description:
        'They went down with a comb, a coin, and a knife that was already old ' +
        'when it was buried. The parish considers all of it a loan. Call the ' +
        'loan in and something warm comes up with it.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'MILL 4. Draw 2. Conjure a Cinder into your hand.',
    // pts: mill 4 + draw 2 + a one-use Cinder (ht-cinder, the grave-themed
    // haunt) + FREE mill 2 / draw 1. The dig-for-value card: it fills the pile
    // and hands you a card that was never in the deck to begin with.
    free: { millCards: 2, drawCards: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { millCards: 4, drawCards: 2 } },
        { kind: 'conjure_card', cardId: 'ht-cinder' },
    ],
    addedIn: ADDED,
    tags: ['grave', 'conjure', 'mill'],
};

// `/adjust-keywords` pass 13 (2026-09-19) — FORGE's second carrier (see the
// note above theUnpaidSexton for the full audit finding and KB citation):
// `float_x_die` is the theme's resurrection half of the verb — a die the
// tray already wrote off comes back up.
const itGetsUpAgain: Card = {
    id: 'it-gets-up-again',
    theme: 'grave',
    name: 'It Gets Up Again',
    philosophicalAspect: 'heart',
    description:
        'You put it down twice. The second time was for good measure. It has ' +
        'opinions about that, and it is coming to share them — not against ' +
        'you, this once. One favor, freely given, and then it is done with ' +
        'you forever.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 20. FORGE a dead X die into a WILD ghost die (no X: +1 Conviction).',
    // pts: deal 20 (6.67) + float_x_die (forgeFloating 5 + forgeWildBonus 1 =
    // 6, at the fate discount 0.7 = 4.2, plus the no-X fallback's 1 Conviction
    // at the complementary 0.3 = 0.3, total 4.5) = 11.17, + FREE deal 7. The
    // resurrection half of FORGE: a die already written off comes back WILD.
    free: { damage: 7 },
    specialMechanics: [
        { kind: 'deal', amount: 20 },
        { kind: 'float_x_die' },
    ],
    addedIn: '2026-09-19',
    tags: ['grave', 'forge', 'dice', 'recursion'],
};

// ─── SKULL — the engine ──────────────────────────────────────────────────────

const openEveryGrave: Card = {
    id: 'open-every-grave',
    theme: 'grave',
    name: 'Open Every Grave',
    philosophicalAspect: 'heart',
    description:
        'On the parish\'s last day there is no more waiting and no more quiet. ' +
        'Every plot opens on its own hinge. Every voice comes up still ' +
        'arguing. Everything you ever said is said again, louder, in company.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'REPLAY your last spell 2 times. RECALL 1 card from your discard pile. MILL 3.',
    // pts: replay x2 on whatever you just cast (the theme's headline; point the
    // engine at a Saint hit and the number is not printable) + recall 1 + mill
    // 3, + FREE deal 12 / mill 3. Uncapped by design.
    free: { damage: 12, millCards: 3 },
    specialMechanics: [
        { kind: 'replay_last', times: 2 },
        { kind: 'reprise', count: 1 },
        { kind: 'rider', rider: { millCards: 3 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'replay', 'recall', 'finisher'],
};

const thePlaguePit: Card = {
    id: 'the-plague-pit',
    theme: 'grave',
    name: 'The Plague Pit',
    philosophicalAspect: 'body',
    description:
        'They stopped digging separate holes in the second winter. What is ' +
        'down there is not a person — it is a decision made by fourteen very ' +
        'tired men. Feed it and it will remember you fondly.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 3, then Deal 34 and Draw 3. REQUIEM 16: Deal 22 more and Heal 22.',
    // pts: immolate 3 as a printed cost -> deal 34 + draw 3, with a requiem-16
    // clause adding 22 and healing 22, + FREE deal 14 / mill 2. The pyre grown
    // up: three bad cards leave the fight and the pit pays for all of them.
    free: { damage: 14, millCards: 2 },
    specialMechanics: [
        { kind: 'immolate', count: 3, rider: { damage: 34, drawCards: 3 } },
    ],
    synergy: {
        statePredicate: { kind: 'requiem', n: 16 },
        rider: { damage: 22, healHp: 22 },
    },
    addedIn: ADDED,
    tags: ['grave', 'immolate', 'requiem', 'payoff'],
};

const theSextonsCount: Card = {
    id: 'the-sextons-count',
    theme: 'grave',
    name: "The Sexton's Count",
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever you RECALL, REPLAY, or TWIN a card, the foe loses 8 VITAE and you MILL 1.',
    description:
        'He rings once for every body raised, as courtesy demands, and he has ' +
        'never once been wrong about the number. The bell does not mourn. It ' +
        'counts.',
    tier: 3, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — a toll on every repetition the deck already wanted to
    // make. Five to eight triggers in a running grave turn; the FREE face rents
    // the same toll for three rounds. TWIN wired phase 86 (2026-09-16),
    // guarded against double-counting on a card that is both a reprise/
    // replay carrier and resolving under an armed TWIN charge — see
    // combat.engine.ts's `sextonsTolled` guard.
    addedIn: ADDED,
    tags: ['grave', 'oath', 'recursion'],
};

// ─── SAINT — everything comes up ─────────────────────────────────────────────

const theGeneralExhumation: Card = {
    id: 'the-general-exhumation',
    theme: 'grave',
    name: 'The General Exhumation',
    philosophicalAspect: 'body',
    description:
        'The order is read at the gate and it is very short. Everything comes ' +
        'up. Every stone is moved and every name is called twice, and it is ' +
        'the second calling that the yard answers.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 45. RECALL 2 cards from your discard pile. TWIN — your next spell this turn resolves its payload twice. REQUIEM 24: Deal 25 more and Draw 2.',
    // pts: the file's thesis. Deal 45, hand back the two best bodies in the
    // pile, and arm TWIN so whatever you dug up resolves twice; the requiem-24
    // clause adds 25 for a deck that actually did the digging. FREE deal 18 /
    // mill 4 — a Saint-rank FREE line still worth a card.
    free: { damage: 18, millCards: 4 },
    specialMechanics: [
        { kind: 'deal', amount: 45 },
        { kind: 'reprise', count: 2 },
        { kind: 'twin' },
    ],
    synergy: {
        statePredicate: { kind: 'requiem', n: 24 },
        rider: { damage: 25, drawCards: 2 },
    },
    addedIn: ADDED,
    tags: ['grave', 'twin', 'recall', 'requiem', 'finisher'],
};

const theCongregationBelow: Card = {
    id: 'the-congregation-below',
    theme: 'grave',
    name: 'The Congregation Below',
    philosophicalAspect: 'mind',
    persistentEffect:
        'REQUIEM: at the end of each round, the foe loses 1 VITAE for every 2 cards in your discard pile.',
    description:
        'Every burial is a deposition. Below the frost line the parish keeps ' +
        'perfect minutes, and at the close of each round the dead read them ' +
        'into the record — all of them, at once, in your favour.',
    tier: 3, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — an end-of-round clock that scales with the one number
    // this theme spends its whole curve raising. A milled-out pile is a
    // double-digit tick every round, unbounded above.
    addedIn: ADDED,
    tags: ['grave', 'hex', 'requiem', 'clock'],
};

/** THE EXHUMATION — 18 cards, rank-ascending (16 original + FORGE's two
 *  restored carriers, `/adjust-keywords` pass 13, 2026-09-19). */
export const GRAVE_CARDS: Card[] = [
    spadework, theBoneTithe,
    shallowGrave, theQuietRow, theLychGate,
    paupersPyre, theCharnelLedger, theKeening, theUnpaidSexton,
    dirgeForTheDisinterred, theSecondBurial, graveGoods, itGetsUpAgain,
    openEveryGrave, thePlaguePit, theSextonsCount,
    theGeneralExhumation, theCongregationBelow,
];
