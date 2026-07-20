/**
 * Swap pool: FORGE (preset `foundry`) — 30 NEW sandbox spells, authored
 * 2026-07-18 under the owner-ratified per-theme swap-pool directive.
 *
 * These cards exist ONLY as `/deck-tuning` swap candidates for the 15-card
 * foundry preset recipe (4x2 commons, 2x2 uncommons, 1x3 rares). They are NOT
 * player-facing, NOT in any preset, NOT in `cards.library.ts`. Vocabulary is
 * strictly the forge family (KINDLE, PIP, FORGE, DRAW) plus the generic
 * utility verbs the theme's 7 library cards already lean on (GUARD, MARK,
 * RUPTURE-class pip spenders, the Kindling Ember species, OVERHEAT,
 * TRANSMUTE, BANK/REFRESH/CONVERT/REROLL die manipulation). No new keywords,
 * no new mechanic kinds, no neighbor-theme hallmarks.
 *
 * Rank quota: 10 commons (r1-2, tier 1) / 12 uncommons (r3-4, tier 2) /
 * 8 rares (r5-6, tier 2-3; exactly 2 tier-3, both late-gated payoff turns).
 * Die-interaction law: every tier-2+ card carries exactly ONE of
 * threshold / dieBonus / fate / utility die-manipulation / state-react;
 * the manufacture payload itself (KINDLE / FORGE / PIP / TRANSMUTE / pip
 * spenders / OVERHEAT) is the theme engine, not the interaction line —
 * following the `ex-nihilo` (FORGE + BANK) and `bootstrap-loop`
 * (TRANSMUTE + threshold) library precedents.
 *
 * RULING (2026-07-18 adversarial review; recorded here per the review's
 * suggested fix, pending owner ratification + a keyword-atlas row
 * [needs-user-call]): OVERHEAT is classed THEME ENGINE, not a
 * REFRESH/REROLL/BANK/CONVERT-class die-manipulation line. It is
 * `grant_pip`'s risk-priced manufacture sibling — pips pushed into the
 * Reserve at the printed bust odds (`combat.dice.ts` `overheatReserve`) —
 * so a tier-2+ card carrying OVERHEAT still needs its ONE interaction line
 * (`feed-the-fire`: threshold; `past-the-safe-heat`: CONVERT). If the
 * owner rules the other way, drop the added lines from those two cards and
 * re-price.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10) — simple, reliable, x4-seat candidates ─────────────────────

/**
 * The x4-seat DoT common: the theme's own ember plus a Reserve ripen in one
 * motion. The live-erosion floor the foundry preset's commons currently lack.
 */
const sparkInTheTinder: Card = {
    id: 'spark-in-the-tinder',
    theme: 'forge',
    name: 'Spark in the Tinder',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'One spark leaves the wheel and does not come back. Somewhere in ' +
        'their certainty, dry cloth has already accepted it.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: ember i2 d3 (tempo 4.625 ÷ 3 = 1.54) + PIP 1 (1.5) = 3.04 + FREE
    // pips 1 (1.5) = 4.54 → common band 1.5-7.5 (Doxa). FREE 1.5/4.54 = 33% ✓.
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'grant_pip', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'dice', 'swap-pool'],
};

/**
 * The body-stance KINDLE common: a fresh die and a small shield while it
 * cools. Reliable manufacture for the x4 seat on the body side.
 */
const firstHeat: Card = {
    id: 'first-heat',
    theme: 'forge',
    name: 'First Heat',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Cold iron argues back. Warm it once and it starts agreeing with ' +
        'the hammer — hold the tongs steady until it does.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE body (2.5) + Guard 2 (0.5) = 3.0 + FREE pips 1 (1.5) = 4.5
    // → common band 1.5-7.5 (Doxa). FREE 1.5/4.5 = 33% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'body' },
        { kind: 'guard', amount: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'defense', 'swap-pool'],
};

/**
 * The defend common the seat coverage demands: a real block that still feeds
 * the pip engine. Nothing conditional, nothing clever — the x4 wall.
 */
const quench: Card = {
    id: 'quench',
    theme: 'forge',
    name: 'Quench',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The bath does not negotiate with the blade. It takes the whole ' +
        'temper of the blow and gives back only steam.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 6 (6 ÷ 4 = 1.5) + PIP 1 (1.5) = 3.0 + FREE pips 1 (1.5) = 4.5
    // → common band 1.5-7.5 (Doxa). FREE 1.5/4.5 = 33% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'defense', 'dice', 'swap-pool'],
};

/**
 * The draw-glue common: DRAW is family vocabulary and the foundry recipe has
 * no cheap cycle. Air for the fire, a card for the hand.
 */
const bellowsBreath: Card = {
    id: 'bellows-breath',
    theme: 'forge',
    name: 'Bellows-Breath',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The fire eats air the way an argument eats silence. Feed it and it ' +
        'shows you what it was hiding in the coals.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: DRAW 1 (2.0) + PIP 1 (1.5) = 3.5 + FREE pips 1 (1.5) = 5.0
    // → common band 1.5-7.5 (Doxa). FREE 1.5/5.0 = 30% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 1 } },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'draw', 'dice', 'swap-pool'],
};

/**
 * The long-fuse common: a thin 4-turn ember plus ripen plus a sliver of
 * Guard. The slow-match alternative to spark-in-the-tinder's hotter i2.
 */
const cinderSpit: Card = {
    id: 'cinder-spit',
    theme: 'forge',
    name: 'Cinder-Spit',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The crucible clears its throat and something small and orange ' +
        'crosses the room. It is patient work, being on fire.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: ember i1 d4 (tempo 2.734 ÷ 3 = 0.91) + PIP 1 (1.5) + Guard 2 (0.5)
    // = 2.91 + FREE pips 1 (1.5) = 4.41 → common band 1.5-7.5 (Doxa).
    // FREE 1.5/4.41 = 34% ✓.
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 4 }],
    specialMechanics: [
        { kind: 'grant_pip', count: 1 },
        { kind: 'guard', amount: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'defense', 'swap-pool'],
};

/**
 * The pure ripener: PIP 3, no rider, no condition. The simplest possible
 * accelerant for the pip bank — Dawncaster's Momentum lesson (cheap accrual
 * stapled to ordinary plays) in one card.
 */
const stokeTheCoals: Card = {
    id: 'stoke-the-coals',
    theme: 'forge',
    name: 'Stoke the Coals',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Nothing new is made here. What is already burning is merely ' +
        'reminded, three times, of its purpose.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PIP 3 (3 × 1.5 = 4.5) + FREE pips 1 (1.5) = 6.0 → common band
    // 1.5-7.5 (Lemma). FREE 1.5/6.0 = 25% ✓ (window floor, inclusive).
    free: { pips: 1 },
    specialMechanics: [{ kind: 'grant_pip', count: 3 }],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The dieBonus common (tier-1's single allowed die-interaction): a short hot
 * ember and a block, and the on-stance die keeps the rhythm with a pip.
 */
const hammerRhythm: Card = {
    id: 'hammer-rhythm',
    theme: 'forge',
    name: 'Hammer-Rhythm',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Strike, lift, strike. The third beat is silent and lands anyway. ' +
        'Work done in rhythm is work half paid for.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: ember i2 d2 (tempo 3.5 ÷ 3 = 1.17) + Guard 4 (1.0) = 2.17 +
    // dieBonus match: PIP 1 (1.5 × 0.6 = 0.9) + FREE pips 1 (1.5) = 4.57
    // → common band 1.5-7.5 (Lemma). FREE 1.5/4.57 = 33% ✓.
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    dieBonus: { onColor: 'match', rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'defense', 'dice', 'swap-pool'],
};

/**
 * The mind-stance KINDLE-plus-ripen common: manufacture and maintenance in
 * one unconditional play. The x4-seat engine starter.
 */
const scrapIron: Card = {
    id: 'scrap-iron',
    theme: 'forge',
    name: 'Scrap-Iron',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Filings, burrs, the ends of old arguments. Swept into the crucible ' +
        'they stop being waste and start being Tuesday.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + PIP 1 (1.5) = 4.0 + FREE pips 1 (1.5) = 5.5
    // → common band 1.5-7.5 (Lemma). FREE 1.5/5.5 = 27% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'mind' },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The glue common: MARK (universal affliction currency) + a thin ember + a
 * card. Seeds the payoff-class closers (ingot-of-ruin, the-full-pour)
 * without borrowing any neighbor hallmark.
 */
const ashLitany: Card = {
    id: 'ash-litany',
    theme: 'forge',
    name: 'Ash-Litany',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Read the soot on the wall and you will find their name already ' +
        'written there, in a hand older than mercy.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i1 d2 (0.75 × 1 × 2 = 1.5) + ember i1 d3 (tempo 2.3125 ÷ 3 =
    // 0.77) + DRAW 1 (2.0) = 4.27 + FREE pips 1 (1.5) = 5.77 → common band
    // 1.5-7.5 (Lemma). FREE 1.5/5.77 = 26% ✓.
    free: { pips: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'draw', 'swap-pool'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified): `tempered-edge` moved to
// `cards.library.ts` and the foundry x4 body common seat (arm f2,
// docs/reports/deck-tuning-2026-07-18.md — early 0.60→0.80, ON band).

// ─── Uncommons (12) — the theme's engine, one die-interaction each ───────────

/**
 * The engine staple: manufacture + ripen, with a threshold that ripens
 * further once the mind tally is running. The x2-seat KINDLE workhorse.
 */
const annealingRound: Card = {
    id: 'annealing-round',
    theme: 'forge',
    name: 'Annealing Round',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Heat, hold, cool slowly. The metal forgets its grudges. It is the ' +
        'holding that does the work — it usually is.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + PIP 1 (1.5) = 4.0 + threshold mind 2: PIP 1
    // (1.5 × 0.5 = 0.75) + FREE [pips 1 (1.5) + guard 2 (0.5)] = 2.0 → 6.75
    // → uncommon band 4.5-13 (Thesis). FREE 2.0/6.75 = 30% ✓.
    free: { pips: 1, guard: 2 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'mind' },
        { kind: 'grant_pip', count: 1 },
    ],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The BANK engine card (ex-nihilo's little sibling): a fresh die out, the
 * powering die back into the Reserve. Two dice of tempo from one play.
 */
const doubleCast: Card = {
    id: 'double-cast',
    theme: 'forge',
    name: 'Double-Cast',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'One pour fills two molds. The foundry does not understand ' +
        'scarcity; it was never introduced.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + BANK powering die (2.0) = 4.5 + FREE pips 1
    // (1.5) = 6.0 → uncommon band 4.5-13 (Thesis). FREE 1.5/6.0 = 25% ✓
    // (window floor, inclusive).
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'mind' },
        { kind: 'bank_spent_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The small spender: land an ember, push the bank one pip past the safe cap
 * (the OVERHEAT gamble), then pour everything — Guard per pip and +1 ember
 * intensity per pip. The mid-band cash-out the atlas says PIP lacks.
 * Threshold is the one interaction line (added 2026-07-18: OVERHEAT is
 * theme engine per the header ruling, so the card owed a line).
 */
const feedTheFire: Card = {
    id: 'feed-the-fire',
    theme: 'forge',
    name: 'Feed the Fire',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The fire is owed. It has always been owed. Pay it everything at ' +
        'once and watch how graciously it forecloses on them.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: ember i1 d3 (tempo 2.3125 ÷ 3 = 0.77) + OVERHEAT 1 (EV 0.45,
    // theme engine per header ruling) + spend ALL pips, Guard 1/pip
    // (1 + 0.5 = 1.5) + intensityPerPip 1 (1.5) = 4.22 + threshold mind 2:
    // PIP 1 (1.5 × 0.5 = 0.75) + FREE [pips 1 (1.5) + guard 2 (0.5)] = 2.0
    // → 6.97 → uncommon band 4.5-13 (Thesis). FREE 2.0/6.97 = 29% ✓.
    free: { pips: 1, guard: 2 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    specialMechanics: [
        { kind: 'overheat', pips: 1 },
        { kind: 'spend_all_pips', guardPerPip: 1 },
        { kind: 'rider', rider: { intensityPerPip: 1 } },
    ],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'payoff', 'dice', 'swap-pool'],
};

/**
 * The press-your-luck converter (rebuilt 2026-07-18 — review blocker: the
 * old {guard, grant_pip, overheat} body was a near-clone of library
 * `half-step`): run the powering die past the safe heat. It comes back
 * molten — refreshed, WILD — and the excess presses two pips past the cap
 * at the printed bust odds. No guard, no plain ripen; the gamble IS the
 * payload. CONVERT is the one interaction line; OVERHEAT is theme-engine
 * manufacture per the header ruling.
 */
const pastTheSafeHeat: Card = {
    id: 'past-the-safe-heat',
    theme: 'forge',
    name: 'Past the Safe Heat',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'There is a line on the gauge and there is a line in the mind, and ' +
        'neither has ever stopped a smith with a deadline.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: CONVERT powering die → refreshed WILD (2.5) + OVERHEAT 2
    // (2 × 0.45 = 0.9) = 3.4 + FREE pips 1 (1.5) = 4.9 → uncommon band
    // 4.5-13 (Thesis). FREE 1.5/4.9 = 31% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'overheat', pips: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'gamble', 'swap-pool'],
};

/**
 * The CONVERT engine card: the powering die returns refreshed and WILD, plus
 * a ripen. Fixes the miss-heavy pool's off-color fizzle in-theme.
 */
const recastInGold: Card = {
    id: 'recast-in-gold',
    theme: 'forge',
    name: 'Recast in Gold',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Melt down the stubborn opinion and pour it again. Gold holds any ' +
        'shape asked of it, which is why the old smiths trusted nothing else.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: CONVERT powering die → refreshed WILD (2.5) + PIP 1 (1.5) = 4.0 +
    // FREE pips 1 (1.5) = 5.5 → uncommon band 4.5-13 (Thesis).
    // FREE 1.5/5.5 = 27% ✓.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The CONJURE engine card, moved to the r4 seat (2026-07-18 — review: at r3
 * it sat on the same rank-3 conjure seat as the live sandbox exerciser
 * `foundry-sprite`, muddying any A/B holding both). Doubled payload: TWO
 * one-use Cinder tokens hammered off plus a fresh die. foundry-sprite keeps
 * the "does a cheap conjure earn its seat" question; this card asks whether
 * the foundry wants a BIGGER conjure seat a rank up.
 */
const emberApprentice: Card = {
    id: 'ember-apprentice',
    theme: 'forge',
    name: 'Ember-Apprentice',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'It has no name and one lesson, learned twice. Each spark glows ' +
        'with the seriousness of the newly made, hands you its whole life, ' +
        'and asks to be thrown.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: CONJURE Cinder ×2 (2 × 2.0 = 4.0) + KINDLE mind (2.5) = 6.5 +
    // dieBonus match: PIP 1 (1.5 × 0.6 = 0.9) + FREE pips 2 (3.0) = 10.4 →
    // uncommon band 4.5-13 (Theorem). FREE 3.0/10.4 = 29% ✓.
    free: { pips: 2 },
    specialMechanics: [
        { kind: 'conjure_card', cardId: 'tf-cinder' },
        { kind: 'conjure_card', cardId: 'tf-cinder' },
        { kind: 'create_temporary_die', color: 'mind' },
    ],
    dieBonus: { onColor: 'match', rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'conjure', 'swap-pool'],
};

/**
 * The opening-condition card (state-react, priced ×0.5): lead the turn with
 * it and the Reserve ripens twice over. Sequencing texture for the foundry —
 * the genre keeps such conditions scarce (Dawncaster Cascade: 7 carriers).
 */
const firstLightOfTheForge: Card = {
    id: 'first-light-of-the-forge',
    theme: 'forge',
    name: 'First Light of the Forge',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Whoever lights the furnace owns the morning. Everything said ' +
        'afterward is said in its glow, on its terms.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + PIP 1 (1.5) = 4.0 + react (opening, first
    // spell this turn): PIP 2 (3.0 × 0.5 = 1.5) + FREE [pips 1 (1.5) + ember
    // i1 d2 (tempo 1.75 ÷ 3 = 0.58)] = 2.08 → 7.58 → uncommon band 4.5-13
    // (Theorem). FREE 2.08/7.58 = 27% ✓.
    free: { pips: 1, applyEffect: { effectId: 'debuff_kindling_ember', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'mind' },
        { kind: 'grant_pip', count: 1 },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { pips: 2 },
    },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'condition', 'swap-pool'],
};

/**
 * The cycle engine: DRAW 2 + ripen, with an on-stance pip. The foundry's
 * card-flow uncommon — dig for the finisher while the bank grows.
 */
const crucibleDraw: Card = {
    id: 'crucible-draw',
    theme: 'forge',
    name: 'Crucible-Draw',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Tip the crucible toward the light and read what floats. The dross ' +
        'always has the most to say; skim it and keep the rest.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: DRAW 2 (4.0) + PIP 1 (1.5) = 5.5 + dieBonus match: PIP 1
    // (1.5 × 0.6 = 0.9) + FREE pips 2 (3.0) = 9.4 → uncommon band 4.5-13
    // (Theorem). FREE 3.0/9.4 = 32% ✓.
    free: { pips: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'grant_pip', count: 1 },
    ],
    dieBonus: { onColor: 'match', rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'draw', 'dice', 'swap-pool'],
};

/**
 * The FORGE uncommon: a temporary WILD gold die, with a threshold ripen once
 * the mind tally is deep. The theme's mid-rank manufacture peak.
 */
const theSecondAnvil: Card = {
    id: 'the-second-anvil',
    theme: 'forge',
    name: 'The Second Anvil',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The first anvil takes the work you planned. The second takes the ' +
        'work you could not have planned for, and rings the truer note.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: FORGE temp gold WILD (5 + wild 1 = 6.0) + threshold mind 3: PIP 2
    // (3.0 × 0.5 = 1.5) + FREE pips 2 (3.0) = 10.5 → uncommon band 4.5-13
    // (Theorem). FREE 3.0/10.5 = 29% ✓.
    free: { pips: 2 },
    specialMechanics: [{ kind: 'forge_floating_die', color: 'wild' }],
    threshold: { color: 'mind', count: 3, rider: { pips: 2 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'floating', 'swap-pool'],
};

/**
 * The MARK-plus-ember pressure uncommon: brand them for the payoff closers
 * and leave a long ember cooking. The foundry's debuff-side engine.
 */
const brandOfTheMaker: Card = {
    id: 'brand-of-the-maker',
    theme: 'forge',
    name: 'Brand of the Maker',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Everything that leaves this shop is signed. From today they are ' +
        'work in progress, and the signature is already cooling in them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d2 (0.75 × 2 × 2 = 3.0) + ember i2 d4 (tempo 5.469 ÷ 3 =
    // 1.82) = 4.82 + dieBonus match: PIP 1 (1.5 × 0.6 = 0.9) + FREE pips 2
    // (3.0) = 8.72 → uncommon band 4.5-13 (Theorem). FREE 3.0/8.72 = 34% ✓.
    free: { pips: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 2, duration: 4 },
    ],
    dieBonus: { onColor: 'match', rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'payoff-seed', 'swap-pool'],
};

/**
 * The big defend uncommon: a serious wall that ripens the bank while it
 * holds, with a threshold block behind it. In-theme sustain, no borrowing.
 */
const steamVeil: Card = {
    id: 'steam-veil',
    theme: 'forge',
    name: 'Steam-Veil',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Water remembers the iron fondly and rises to say so. Behind the ' +
        'white curtain, the work continues uninterrupted.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 10 (2.5) + PIP 2 (3.0) = 5.5 + threshold body 2: Guard 6
    // (1.5 × 0.5 = 0.75) + FREE [pips 1 (1.5) + guard 4 (1.0)] = 2.5 → 8.75
    // → uncommon band 4.5-13 (Theorem). FREE 2.5/8.75 = 29% ✓.
    free: { pips: 1, guard: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'grant_pip', count: 2 },
    ],
    threshold: { color: 'body', count: 2, rider: { guard: 6 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'defense', 'dice', 'swap-pool'],
};

/**
 * The overflow engine (slag-runoff's big sibling): a triple ripen whose
 * wasted pips convert to a hot ember, and the powering die comes back. The
 * "no wasted heat" premise made into the theme's tempo uncommon.
 */
const sprueAndRiser: Card = {
    id: 'sprue-and-riser',
    theme: 'forge',
    name: 'Sprue and Riser',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A good mold plans for its own excess. What the casting cannot ' +
        'hold, the channels deliver — still glowing — to a second address.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: PIP 3 (4.5) + overflow → ember i2 (statusPoints i2 d3 = 1.54 ×
    // expectedOverflowPips 1 = 1.54) + REFRESH powering die (2.0) = 8.04 +
    // FREE pips 2 (3.0) = 11.04 → uncommon band 4.5-13 (Theorem).
    // FREE 3.0/11.04 = 27% ✓.
    free: { pips: 2 },
    specialMechanics: [
        {
            kind: 'grant_pip', count: 3,
            overflow: { applyEffect: { effectId: 'debuff_kindling_ember', intensity: 2 } },
        },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'ember', 'swap-pool'],
};

// ─── Rares (8) — finishers and build-arounds ─────────────────────────────────

/**
 * The pip-storm build-around: a massive ripen plus a WILD kindle, deeper
 * still once the mind tally runs. Fuel for every ALL-spender in the pool.
 */
const theGreatBellows: Card = {
    id: 'the-great-bellows',
    theme: 'forge',
    name: 'The Great Bellows',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Two lungs of oak and ox-hide, older than the town. When they ' +
        'speak, every ember in the county sits up to listen.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: PIP 3 (4.5) + KINDLE wild (2.5 + 0.5 = 3.0) = 7.5 + threshold
    // mind 3: PIP 2 (3.0 × 0.5 = 1.5) + FREE pips 2 (3.0) = 12.0 → rare band
    // 7-19 (Axiom). FREE 3.0/12.0 = 25% ✓ (window floor, inclusive).
    free: { pips: 2 },
    specialMechanics: [
        { kind: 'grant_pip', count: 3 },
        { kind: 'create_temporary_die', color: 'wild' },
    ],
    threshold: { color: 'mind', count: 3, rider: { pips: 2 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The swarm build-around: three dice in one play — mind, body, and WILD.
 * Resource superiority as a single overwhelming cast, the theme's win
 * texture printed on one card.
 */
const theFoundryAwakes: Card = {
    id: 'the-foundry-awakes',
    theme: 'forge',
    name: 'The Foundry Awakes',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'One by one the fires answer, as they answered a hundred years ago. ' +
        'The town has forgotten what this glow on the clouds once meant. ' +
        'They will be reminded.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + KINDLE body (2.5) + KINDLE wild (3.0) = 8.0 +
    // dieBonus match: PIP 2 (3.0 × 0.6 = 1.8) + FREE [pips 2 (3.0) + guard 2
    // (0.5)] = 3.5 → 13.3 → rare band 7-19 (Axiom). FREE 3.5/13.3 = 26% ✓.
    free: { pips: 2, guard: 2 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'mind' },
        { kind: 'create_temporary_die', color: 'body' },
        { kind: 'create_temporary_die', color: 'wild' },
    ],
    dieBonus: { onColor: 'match', rider: { pips: 2 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'swap-pool'],
};

/**
 * The fate-line spender: a hot ember, then the bank poured into Guard and
 * ember intensity. A miss die powers it and pays two pips on top — the
 * forge's "no dead faces" card.
 */
const noWastedHeat: Card = {
    id: 'no-wasted-heat',
    theme: 'forge',
    name: 'No Wasted Heat',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The ledger of the forge has one rule, struck above the door: ' +
        'nothing leaves as smoke that could have left as steel.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: ember i3 d3 (tempo 6.9375 ÷ 3 = 2.31) + spend ALL pips, Guard
    // 2/pip (1 + 2 × 0.5 = 2.0) + intensityPerPip 1 (1.5) = 5.81 + fate:
    // PIP 2 (3.0 × 0.7 = 2.1) + FREE pips 2 (3.0) = 10.91 → rare band 7-19
    // (Axiom). FREE 3.0/10.91 = 27% ✓.
    free: { pips: 2 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    specialMechanics: [
        { kind: 'spend_all_pips', guardPerPip: 2 },
        { kind: 'rider', rider: { intensityPerPip: 1 } },
    ],
    fate: { rider: { pips: 2 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dot', 'payoff', 'dice', 'swap-pool'],
};

/**
 * The manufacture capstone: temp gold WILD out, WILD kindle beside it, and
 * the powering die refreshed — three dice of tempo plus the FREE ripen. The
 * build-around the "one overwhelming turn" decks assemble toward.
 */
const theCrucibleEternal: Card = {
    id: 'the-crucible-eternal',
    theme: 'forge',
    name: 'The Crucible Eternal',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'It has never been allowed to cool. Grandmothers fed it; the fire ' +
        'owes the family. Tonight it pays the whole debt in one pour.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: FORGE temp gold WILD (6.0) + KINDLE wild (3.0) + REFRESH powering
    // die (2.0) = 11.0 + FREE pips 3 (4.5) = 15.5 → rare band 7-19 (Axiom).
    // FREE 4.5/15.5 = 29% ✓.
    free: { pips: 3 },
    specialMechanics: [
        { kind: 'forge_floating_die', color: 'wild' },
        { kind: 'create_temporary_die', color: 'wild' },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'floating', 'swap-pool'],
};

/**
 * The cycle rare: DRAW 3 with a deep ripen, and one more card once the mind
 * tally is warm. The glue build-around that finds the finisher on time.
 */
const thePatternBook: Card = {
    id: 'the-pattern-book',
    theme: 'forge',
    name: 'The Pattern-Book',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every shape the shop has ever poured, indexed in a dead master\'s ' +
        'hand. The answer is in here. The answer was always in here.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: DRAW 3 (6.0) + PIP 2 (3.0) = 9.0 + threshold mind 3: DRAW 1
    // (2.0 × 0.5 = 1.0) + FREE pips 3 (4.5) = 14.5 → rare band 7-19 (Axiom).
    // FREE 4.5/14.5 = 31% ✓.
    free: { pips: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 3 } },
        { kind: 'grant_pip', count: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'draw', 'dice', 'swap-pool'],
};

/**
 * The TRANSMUTE capstone (bootstrap-loop's Aporia sibling): a miss die
 * revived as temp gold, a WILD kindle beside it, the bank ripened. Every
 * dead face in the tray is raw material.
 */
const goldFromLead: Card = {
    id: 'gold-from-lead',
    theme: 'forge',
    name: 'Gold from Lead',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The old promise, kept at last — not by changing the lead, but by ' +
        'refusing to believe in it. Failure is an ore like any other.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: TRANSMUTE miss → temp gold WILD ((5 + 1) × 0.7 + 1 × 0.3 = 4.5) +
    // KINDLE wild (3.0) + PIP 1 (1.5) = 9.0 + threshold mind 2: PIP 1
    // (1.5 × 0.5 = 0.75) + FREE [pips 2 (3.0) + MARK i1 d1 (0.75)] = 3.75 →
    // 13.5 → rare band 7-19 (Aporia). FREE 3.75/13.5 = 28% ✓.
    free: { pips: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'float_x_die' },
        { kind: 'create_temporary_die', color: 'wild' },
        { kind: 'grant_pip', count: 1 },
    ],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'dice', 'floating', 'swap-pool'],
};

/**
 * The MARK-cash finisher (tier 3, late-gated): empty the whole bank into
 * MARK stacks — uncapped, the ALL-spender's price is the emptied Reserve —
 * cash every stack at 4, and only THEN plant MARK ×2 for the next pour.
 * Rider order is engine order (the a-sweeter-poison law,
 * cards.sandbox-sets.ts — firedRiders resolve in insertion order): the
 * closer consumes pre-existing marks plus the ratified ingot-of-ruin
 * markPer bank-conversion only; the trailing plant feeds the NEXT closer,
 * never itself. On a clean, empty-bank board this card is silence, not a
 * strike in disguise.
 */
const theFullPour: Card = {
    id: 'the-full-pour',
    theme: 'forge',
    name: 'The Full Pour',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Not a casting — a verdict. Everything the shop has saved goes into ' +
        'the mold at once, and the mold, this time, is shaped like them.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: spend ALL pips → +1 MARK per pip (1 + statusPoints(mark,
    // expectedPips 2) = 1 + 3.0 = 4.0; UNCAPPED upside rides the real bank,
    // §12 item 5) + closer ruptureMarks 4 (4 × 2/3 = 2.67, the expected-2-
    // PRE-EXISTING-stacks convention — honest now that the plant trails) +
    // trailing plant MARK i2 d2 (3.0 — lands AFTER the closer, seeds the
    // next one) = 9.67 + threshold mind 4: PIP 2 (3.0 × 0.5 = 1.5) + FREE
    // [pips 2 (3.0) + MARK i1 d1 (0.75)] = 3.75 → 14.92 → rare band 7-19
    // (Aporia). FREE 3.75/14.92 = 25% ✓.
    free: { pips: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'spend_all_pips', markPer: 1 },
        { kind: 'rider', rider: { ruptureMarks: 4 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } } },
    ],
    threshold: { color: 'mind', count: 4, rider: { pips: 2 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'payoff', 'dice', 'swap-pool'],
};

/**
 * The defensive finisher (tier 3, late-gated; differentiated 2026-07-18 —
 * review: it shared no-wasted-heat's whole core, double-weighting one
 * ALL-spender shape in the pool's rare probe). The ember and the
 * intensityPerPip rider are GONE: this is the pure-defense ALL-spender
 * read — the day's whole bank poured into wall at 3 Guard per pip behind a
 * heavy flat block. no-wasted-heat keeps the offensive read (ember
 * intensity per pip); the two rares now test genuinely different pours.
 */
const theLastQuench: Card = {
    id: 'the-last-quench',
    theme: 'forge',
    name: 'The Last Quench',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'At the end the whole day\'s heat goes into the water, and the ' +
        'water holds it the way stone holds a name. Stand behind the hiss ' +
        'and count what remains of their patience.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 16 (4.0) + spend ALL pips, Guard 3/pip (1 + 3 × 0.5 = 2.5)
    // = 6.5 + threshold body 3: Guard 8 (2.0 × 0.5 = 1.0) + FREE pips 2
    // (3.0) = 10.5 → rare band 7-19 (Aporia). FREE 3.0/10.5 = 29% ✓.
    free: { pips: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 16 },
        { kind: 'spend_all_pips', guardPerPip: 3 },
    ],
    threshold: { color: 'body', count: 3, rider: { guard: 8 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'defense', 'payoff', 'swap-pool'],
};

// ─── The pool ────────────────────────────────────────────────────────────────

export const SWAP_POOL_FORGE: SandboxCardSet = {
    id: 'swap-forge',
    name: 'Swap pool: forge',
    description:
        'Thirty new forge spells for /deck-tuning swap experiments on the '
        + 'foundry preset. Probes whether the manufacture engine (KINDLE / PIP '
        + '/ FORGE) can carry the recipe when its commons erode and defend '
        + 'in-theme (Kindling Ember, Guard-with-ripen), whether mid-band pip '
        + 'cash-outs fix the "banked pips cannot cash" atlas finding, and '
        + 'which rare shape — swarm, cycle, or ALL-spender — the preset '
        + 'actually wants in its three rare seats.',
    cards: [
        // commons (9): r1 ×5, r2 ×4 (tempered-edge promoted out 2026-07-19)
        sparkInTheTinder, firstHeat, quench, bellowsBreath, cinderSpit,
        stokeTheCoals, hammerRhythm, scrapIron, ashLitany,
        // uncommons (12): r3 ×5, r4 ×7 (ember-apprentice moved r3 → r4,
        // 2026-07-18 review — off foundry-sprite's rank-3 conjure seat)
        annealingRound, doubleCast, feedTheFire, pastTheSafeHeat,
        recastInGold, emberApprentice, firstLightOfTheForge, crucibleDraw,
        theSecondAnvil, brandOfTheMaker, steamVeil, sprueAndRiser,
        // rares (8): r5 ×5, r6 ×3
        theGreatBellows, theFoundryAwakes, noWastedHeat, theCrucibleEternal,
        thePatternBook, goldFromLead, theFullPour, theLastQuench,
    ],
};
