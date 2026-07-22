#!/usr/bin/env node
// ============================================================================
// Axiomancer: TABLE EDITION — batch playtest simulator (VOID / temporary)
// ----------------------------------------------------------------------------
// One file, no deps, seeded & deterministic. Delete this file to clean up.
// Rules source: print kit gen-cards.mjs (canonical, 2026-07-21) + design doc v0.7.
// Simulates: 7 presets × 3 enemies (Skulk/Shellback/Brute) × 3 recipes × 3 brains.
//
//   node table-edition-sim.mjs                 # full matrix, 300 games/cell
//   node table-edition-sim.mjs --games 1000    # more seeds
//   node table-edition-sim.mjs --preset TORRENT --enemy SKULK --brain smart --games 50 --trace 1
//   node table-edition-sim.mjs --assumptions   # print rules calls the sim had to make
//
// NOT simulated: neutral/grey pool (Act-2 rewards, not in preset decks),
// fun, bookkeeping load, table feel. Numbers here are LOWER BOUNDS on deck
// strength — a better pilot than the "smart" brain may exist.
// ============================================================================

// ---------------------------------------------------------------- assumptions
const ASSUMPTIONS = [
  'Chain: GREY/GOLD Paid plays are chain-neutral (neither advance nor break). Doc only names the three colors.',
  'Chain: a chain-breaking Paid play resets to EMPTY (does not re-enter as link 1). Per owner memory "breaks to null".',
  'Stagger: reduces the telegraph\'s printed number (per-hit for multi-hits); fizzle when it reaches 0 at resolve time.',
  'Stagger on non-attacks: Vanish/Hunker guard N-stagger; Bristle fizzles at 1 Stagger; Molt heal reduced, blight-removal fixed at 2; Catch Breath counts as power 0 (already fizzled) — Dead Air ECHO applies.',
  'Thorns: trigger once per HIT instance (Flurry = 3 triggers), even if Guard fully absorbs the hit.',
  'Enemy thorns (Bristle): retaliate once per player DIRECT-damage event. Blight ticks are not "hits" — no thorns either way.',
  'Guard absorbs ALL damage including Blight ticks (both sides).',
  'ATTUNE stacks additively until the next sig fires; sig cost floors at 0.',
  'ECHO on Half-Step push: the pushed die\'s Paid play fires its paid line twice.',
  'Whispered Doubt: the next REAL card revealed after it fires is discarded (enemy loses that action), then reveal continues.',
  'Sealed Fate: the enemy\'s next full turn (resolve + reveal) is skipped, and it takes 3.',
  'Rites: sacrificed automatically the moment they reach threshold.',
  'Enchant copies stack (two Standing Waves = 6 burst damage). Max 3 enchants; playing a 4th is illegal.',
  'Sig pairs are fixed per preset (see SIG_PICKS) — a real player chooses at setup.',
  'Player deck reshuffles discard when empty; enemy Last Stand flips discard unshuffled (chronological order).',
  'Hand refills to 5 at turn start only; no mid-turn hand cap.',
  'Press Fate: 1◆, rerolls ALL misses at once, once per round (spec 33).',
  'Turn order: player acts first; the pre-revealed telegraph resolves at end of player turn 1.',
  'Stall guard: 40 rounds without a kill = recorded as a stall (reported separately, counts as non-win).',
];

// ---------------------------------------------------------------------- RNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffled = (arr, rnd) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

// --------------------------------------------------------------------- dice
// faces: 'S' special, 'M' mana, 'X' miss. Colors: R body, B mind, P heart, G gold.
const rollFace = (color, rnd) => {
  const r = Math.floor(rnd() * 6) + 1;
  return color === 'G' ? (r === 1 ? 'S' : r === 2 ? 'M' : 'X') : (r === 1 ? 'S' : r <= 3 ? 'M' : 'X');
};
const usable = d => d.face === 'S' || d.face === 'M';

// --------------------------------------------------------------- card data
// Effects are functions over (S, ctx). ctx: {echo:boolean(fire count 2), brain}
// Helper verbs are defined on the engine below and passed as E.
const CYCLE = { P: 'R', R: 'B', B: 'P' }; // HEART(P) -> BODY(R) -> MIND(B) -> HEART

const PRESETS = {
  STANDSTILL: {
    stance: 'B',
    cards: [
      { nm: 'Point of Order', n: 4, col: 'B', t: 'SPELL', free: E => E.draw(1), paid: E => { E.stagger(1); E.draw(1); }, v: 2 },
      { nm: 'Cold Reading', n: 4, col: 'P', t: 'SPELL', free: E => E.scry(2), paid: E => { E.scry(3); E.draw(1); }, v: 1 },
      { nm: 'Hold That Thought', n: 4, col: 'R', t: 'SPELL', free: E => E.guard(2), paid: E => { E.guard(2); E.stagger(1); }, v: 2 },
      { nm: 'Motion to Suppress', n: 3, col: 'B', t: 'SPELL', free: E => E.stagger(1), paid: E => { E.stagger(2); if (E.telegraphFizzled()) E.draw(2); }, v: 3 },
      { nm: 'Circular Argument', n: 3, col: 'P', t: 'ENCH', ench: 'scry1', free: E => E.scry(1), v: 1 },
      { nm: 'Dead Air', n: 1, col: 'G', t: 'SPELL', free: E => E.stagger(1), paid: E => { const twice = E.telegraphFizzled(); E.stagger(3); if (twice) E.stagger(3); }, v: 4 },
      { nm: 'Turnabout', n: 1, col: 'G', t: 'SPELL', free: E => E.draw(1), paid: E => E.turnabout(), v: 5 },
    ],
  },
  CONTAGION: {
    stance: 'R',
    cards: [
      { nm: 'First Symptom', n: 4, col: 'R', t: 'SPELL', free: E => E.blight(1), paid: E => E.blight(2), v: 2 },
      { nm: 'Poisoned Well', n: 4, col: 'B', t: 'SPELL', free: E => E.blight(1), paid: E => E.blight(3), v: 3 },
      { nm: 'Bad Air', n: 4, col: 'P', t: 'SPELL', free: E => E.blight(1), paid: E => { E.blight(2); E.draw(1); }, v: 2 },
      { nm: 'Fever Logic', n: 3, col: 'B', t: 'SPELL', free: E => E.blight(1), paid: E => E.doubleBlight(), v: 4 },
      { nm: 'Lingering Cough', n: 3, col: 'R', t: 'ENCH', ench: 'blight1', free: E => E.blight(1), v: 2 },
      { nm: 'Rupture', n: 1, col: 'G', t: 'SPELL', free: E => E.blight(2), paid: E => E.rupture(), v: 5 },
      { nm: 'Terminal Diagnosis', n: 1, col: 'G', t: 'RITE', rite: { trigger: 'blightTick', threshold: 4, payoff: (E, ch) => E.dmg(3 * ch) }, free: E => E.blight(1), v: 4 },
    ],
  },
  BASTION: {
    stance: 'R',
    cards: [
      { nm: 'Raised Shield', n: 4, col: 'R', t: 'SPELL', free: E => E.guard(2), paid: E => E.guard(4), v: 2 },
      { nm: 'Nettle Cloak', n: 4, col: 'P', t: 'SPELL', free: E => E.thorns(1), paid: E => { E.thorns(1); E.guard(2); }, v: 2 },
      { nm: 'Measured Answer', n: 4, col: 'B', t: 'SPELL', free: E => E.draw(1), paid: E => { E.guard(3); E.draw(1); }, v: 2 },
      { nm: 'The Adamant Wall', n: 3, col: 'R', t: 'ENCH', ench: 'guardPersists', free: E => E.guard(2), v: 3 },
      { nm: 'Pebble in the Boot', n: 3, col: 'P', t: 'SPELL', free: E => E.blight(1), paid: E => { E.thorns(1); E.blight(1); }, v: 2 },
      { nm: 'The Anvil Speaks', n: 1, col: 'G', t: 'SPELL', free: E => E.thorns(1), paid: E => { E.anvil(); }, v: 5 },
      { nm: 'Unbroken', n: 1, col: 'G', t: 'RITE', rite: { trigger: 'fullAbsorb', threshold: 3, payoff: E => { E.guard(6, true); E.thorns(2); } }, free: E => E.guard(2), v: 3 },
    ],
  },
  FOUNDRY: {
    stance: 'R',
    cards: [
      { nm: 'Tempered Edge', n: 4, col: 'R', t: 'SPELL', free: E => E.temper(1), paid: E => E.temper(2), v: 2 },
      { nm: 'Stoke', n: 4, col: 'P', t: 'SPELL', free: E => E.temper(1), paid: E => E.rerollMisses(), v: 2 },
      { nm: 'Sparks', n: 4, col: 'B', t: 'SPELL', free: E => E.kindle(), paid: E => { E.kindle(); E.temper(1); }, v: 2 },
      { nm: 'Half-Step', n: 3, col: 'P', t: 'SPELL', free: E => E.temper(1), paid: E => { E.temper(2); E.halfStepPush(); }, v: 3 },
      { nm: 'Annealing', n: 3, col: 'R', t: 'ENCH', ench: 'anneal', free: E => E.temper(1), v: 2 },
      { nm: 'The Forge Eternal', n: 1, col: 'G', t: 'ENCH', ench: 'forge', free: E => E.temper(1), v: 3 },
      { nm: 'White Heat', n: 1, col: 'G', t: 'SPELL', free: E => E.temper(1), paid: (E, ctx) => E.whiteHeat(ctx), v: 5 },
    ],
  },
  TORRENT: {
    stance: 'P',
    cards: [
      { nm: 'Rising Tide', n: 4, col: 'P', t: 'SPELL', free: E => E.surgeCharge(), paid: E => { E.draw(1); E.advanceChain(); }, v: 2 },
      { nm: 'Undertow', n: 4, col: 'B', t: 'SPELL', free: E => E.draw(1), paid: E => { E.draw(1); E.chainShield(); }, v: 2 },
      { nm: 'Breakwater', n: 4, col: 'R', t: 'SPELL', free: E => E.guard(2), paid: E => E.guard(2 + E.links()), v: 2 },
      { nm: 'Confluence', n: 3, col: 'P', t: 'SPELL', free: E => E.surgeCharge(), paid: E => { const was = E.links(); E.advanceChain(); if (was === 2) E.draw(2); }, v: 3 },
      { nm: 'Standing Wave', n: 3, col: 'B', t: 'ENCH', ench: 'wave', free: E => E.surgeCharge(), v: 3 },
      { nm: 'Riptide', n: 1, col: 'G', t: 'SPELL', free: E => E.surgeCharge(), paid: E => E.burstNow(), v: 4 },
      { nm: 'Maelstrom', n: 1, col: 'G', t: 'RITE', rite: { trigger: 'burst', threshold: 4, payoff: (E, ch) => E.dmg(3 * ch) }, free: E => E.surgeCharge(), v: 4 },
    ],
  },
  INVOCATION: {
    stance: 'P',
    cards: [
      { nm: 'Rehearsal', n: 4, col: 'B', t: 'SPELL', free: E => E.attune(1), paid: E => E.attune(2), v: 1 },
      { nm: 'Call the Name', n: 4, col: 'P', t: 'SPELL', free: E => E.conviction(1), paid: E => { E.conviction(1); if (E.sigUsedThisTurn()) E.draw(2); }, v: 2 },
      { nm: 'Litany', n: 4, col: 'R', t: 'SPELL', free: E => E.attune(1), paid: E => E.conviction(2), v: 2 },
      { nm: 'Second Voice', n: 3, col: 'P', t: 'SPELL', free: E => E.attune(1), paid: E => E.echoNextSig(), v: 3 },
      { nm: 'Standing Invocation', n: 3, col: 'B', t: 'ENCH', ench: 'sigDiscount', free: E => E.attune(1), v: 3 },
      { nm: 'The Word Made Act', n: 1, col: 'G', t: 'SPELL', free: E => E.conviction(1), paid: (E, ctx) => E.freeSig(ctx), v: 5 },
      { nm: 'Chorus of One', n: 1, col: 'G', t: 'RITE', rite: { trigger: 'sigUse', threshold: 3, payoff: (E, ch, ctx) => E.bothSigsFree(ctx) }, free: E => E.attune(1), v: 4 },
    ],
  },
  MALISON: {
    stance: 'B',
    cards: [
      { nm: 'Whispered Doubt', n: 4, col: 'B', t: 'CURSE', curse: E => E.doubt(), free: E => E.hex(2), paid: E => E.hex(0), v: 2 },
      { nm: 'Hidden Barb', n: 4, col: 'R', t: 'CURSE', curse: E => E.blight(2), free: E => E.hex(2), paid: E => E.hex(0), v: 2 },
      { nm: 'Weight of Guilt', n: 4, col: 'P', t: 'CURSE', curse: E => E.dmg(E.firedCount()), free: E => E.hex(2), paid: E => E.hex(0), v: 2 },
      { nm: 'Contract of Ruin', n: 3, col: 'B', t: 'SPELL', free: E => E.scry(2), paid: E => { E.scry(2); E.reclaim(2); }, v: 3 },
      { nm: 'The Ledger', n: 3, col: 'R', t: 'ENCH', ench: 'ledger', free: E => E.draw(1), v: 3 },
      { nm: 'The Long Con', n: 1, col: 'G', t: 'SPELL', free: E => E.draw(1), paid: E => E.dmg(3 * E.firedCount()), v: 5 },
      { nm: 'Sealed Fate', n: 1, col: 'G', t: 'CURSE', curse: E => { E.skipEnemyTurn(); E.dmg(3); }, free: E => E.hex(2), paid: E => E.hex(0), v: 4 },
    ],
  },
};

const SIGS = {
  Foresight: { cost: 3, fx: E => { E.scry(4); E.draw(1); } },
  'The Final Word': { cost: 6, fx: E => { E.fizzleTelegraph(); E.draw(2); } },
  'Ironclad Oath': { cost: 4, fx: E => E.guard(5, true) },
  'The Reckoning': { cost: 6, fx: E => E.ruptureAll() },
  'Kindled Fury': { cost: 4, fx: E => { E.allMissesToMana(); E.kindle(); } },
  Cataract: { cost: 5, fx: E => E.dmg(5) },
  Recant: { cost: 5, fx: E => E.reclaim(99) },
};
const SIG_PICKS = {
  STANDSTILL: ['Cataract', 'The Final Word'], // v1 ran Final Word + Foresight (no damage sig): 20-round stalls. Cataract turns banked ◆ into the kill path.
  CONTAGION: ['The Reckoning', 'Cataract'],
  BASTION: ['Ironclad Oath', 'Cataract'],
  FOUNDRY: ['Kindled Fury', 'Cataract'],
  TORRENT: ['Cataract', 'Kindled Fury'],
  INVOCATION: ['Cataract', 'Foresight'],
  MALISON: ['Recant', 'Cataract'],
};

// Enemy cards: kind attack|guard|thorns|molt|rest. base = printed number, hits.
const ENEMY_CARDS = {
  Scratch: { kind: 'attack', base: 1, hits: 1 },
  Flurry: { kind: 'attack', base: 1, hits: 3 },
  Vanish: { kind: 'guard', base: 3 },
  Frenzy: { kind: 'attack', base: 2, hits: 3 },
  Hunker: { kind: 'guard', base: 4 },
  Bristle: { kind: 'thorns', base: 1 },
  Snap: { kind: 'attack', base: 3, hits: 1 },
  Molt: { kind: 'molt', base: 3 },
  Crush: { kind: 'attack', base: 6, hits: 1 },
  'Catch Breath': { kind: 'rest', base: 0 },
  Sweep: { kind: 'attack', base: 2, hits: 2 },
  Heave: { kind: 'attack', base: 6, hits: 1 },
  Rampage: { kind: 'attack', base: 4, hits: 2 },
};

const ENEMIES = {
  SKULK: {
    hp: 22,
    tiers: { A: [['Scratch', 5], ['Vanish', 2]], P: [['Flurry', 4], ['Scratch', 2], ['Vanish', 1]], F: [['Flurry', 3], ['Frenzy', 3]] },
    easy: t => { swap(t, 'Flurry', 'Scratch', 2); remove(t, 'Frenzy', 1); },
    hard: t => { swap(t, 'Scratch', 'Flurry', 2); swap(t, 'Vanish', 'Frenzy', 1); },
  },
  SHELLBACK: {
    hp: 28,
    tiers: { A: [['Hunker', 3], ['Bristle', 2], ['Snap', 2]], P: [['Snap', 3], ['Hunker', 2], ['Molt', 2]], F: [['Crush', 4], ['Snap', 2]] },
    easy: t => { swap(t, 'Crush', 'Snap', 2); remove(t, 'Molt', 1); },
    hard: t => { swap(t, 'Snap', 'Crush', 2); add(t, 'P', 'Molt', 1); },
  },
  BRUTE: {
    hp: 35,
    tiers: { A: [['Catch Breath', 4], ['Sweep', 3]], P: [['Heave', 4], ['Sweep', 2], ['Catch Breath', 1]], F: [['Rampage', 3], ['Heave', 3]] },
    easy: t => { swap(t, 'Heave', 'Catch Breath', 2); remove(t, 'Rampage', 1); },
    hard: t => { swap(t, 'Catch Breath', 'Sweep', 2); swap(t, 'Heave', 'Rampage', 1); },
  },
};
function swap(tiers, from, to, count) {
  for (const tier of Object.values(tiers)) for (const e of tier) {
    while (count > 0 && e[0] === from && e[1] > 0) { e[1]--; count--; addTo(tiers, tierOf(tiers, e), to, 1); }
  }
}
function tierOf(tiers, entry) { for (const [k, list] of Object.entries(tiers)) if (list.includes(entry)) return k; }
function addTo(tiers, tierKey, name, n) { add(tiers, tierKey, name, n); }
function add(tiers, tierKey, name, n) {
  const list = tiers[tierKey];
  const hit = list.find(e => e[0] === name);
  if (hit) hit[1] += n; else list.push([name, n]);
}
function remove(tiers, name, count) {
  for (const tier of Object.values(tiers)) for (const e of tier)
    while (count > 0 && e[0] === name && e[1] > 0) { e[1]--; count--; }
}

// ------------------------------------------------------------------- engine
function newGame(presetName, enemyName, recipe, seed) {
  const rnd = mulberry32(seed);
  const preset = PRESETS[presetName];
  const deck = [];
  preset.cards.forEach((c, ix) => { for (let i = 0; i < c.n; i++) deck.push(ix); });

  const spec = ENEMIES[enemyName];
  const tiers = JSON.parse(JSON.stringify(spec.tiers));
  if (recipe === 'easy') spec.easy(tiers);
  if (recipe === 'hard') spec.hard(tiers);
  const edeck = [];
  for (const key of ['A', 'P', 'F']) {
    const tier = [];
    for (const [nm, n] of tiers[key]) for (let i = 0; i < n; i++) tier.push(nm);
    edeck.push(...shuffled(tier, rnd));
  }

  const S = {
    rnd, presetName, enemyName, recipe, round: 0, over: null, trace: [],
    p: {
      hp: 30, deck: shuffled(deck, rnd), hand: [], discard: [],
      guard: 0, pguard: 0, thorns: 0, conv: 0, chainPos: null, links: 0,
      surge: 0, attune: 0, chainShield: false, echoSig: false,
      ench: [], rite: null, dice: [], persistDie: null, kindled: false,
      pressed: false, sigUsedTurn: false, sigs: SIG_PICKS[presetName].slice(),
    },
    e: {
      hp: spec.hp, deck: edeck, discard: [], fired: [], telegraph: null,
      guard: 0, thorns: 0, blight: 0, enraged: false, skip: false, doubt: 0,
      known: 0, staggers: 0,
    },
    stats: { convEarned: 0, convSpent: 0, bursts: 0, sigFires: 0, pressFates: 0, hexFired: 0, freePlays: 0, paidPlays: 0, discardsForConv: 0 },
  };
  revealTelegraph(S);
  return S;
}

const cardOf = (S, ix) => PRESETS[S.presetName].cards[ix];

function makeVerbs(S) {
  const E = {
    draw: n => { for (let i = 0; i < n; i++) drawCard(S); },
    guard: (n, persist) => { if (persist || S.p.ench.some(e => e === 'guardPersists')) S.p.pguard += n; else S.p.guard += n; },
    thorns: n => { S.p.thorns = Math.min(3, S.p.thorns + n); },
    blight: n => { S.e.blight = Math.min(6, S.e.blight + n); },
    heal: n => { S.p.hp = Math.min(30, S.p.hp + n); },
    dmg: n => dealToEnemy(S, n, true),
    scry: n => { S.e.known = Math.max(S.e.known, Math.min(n, S.e.deck.length)); },
    stagger: n => { S.e.staggers += n; },
    telegraphFizzled: () => effPower(S) <= 0,
    fizzleTelegraph: () => { S.e.staggers = 99; },
    turnabout: () => { dealToEnemy(S, 2 * Math.min(S.e.staggers, 99), true); S.e.staggers = 0; },
    doubleBlight: () => { S.e.blight = Math.min(6, S.e.blight * 2); },
    rupture: () => { const b = S.e.blight; S.e.blight = 0; dealToEnemy(S, 2 * b, true); },
    ruptureAll: () => { const b = S.e.blight; S.e.blight = 0; dealToEnemy(S, 2 * b, true); },
    anvil: () => { const d = 2 * S.p.thorns; dealToEnemy(S, d, true); if (S.p.thorns >= 3) dealToEnemy(S, d, true); },
    temper: n => temperBest(S, n),
    rerollMisses: () => { for (const d of S.p.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd); },
    kindle: () => { if (!S.p.kindled) { S.p.kindled = true; S.p.dice.push({ color: 'G', face: rollFace('G', S.rnd), kindled: true }); } },
    halfStepPush: () => halfStepPush(S),
    whiteHeat: () => whiteHeat(S),
    surgeCharge: () => { S.p.surge++; },
    advanceChain: () => advanceChain(S, null, true),
    chainShield: () => { S.p.chainShield = true; },
    links: () => S.p.links,
    burstNow: () => { S.p.links = 3; checkBurst(S); },
    attune: n => { S.p.attune += n; },
    conviction: n => { S.p.conv += n; S.stats.convEarned += n; },
    sigUsedThisTurn: () => S.p.sigUsedTurn,
    echoNextSig: () => { S.p.echoSig = true; },
    freeSig: ctx => { const s = bestSig(S, ctx.brain); if (s) fireSig(S, s, ctx.brain, true); },
    bothSigsFree: ctx => { for (const s of S.p.sigs) fireSig(S, s, ctx.brain, true); },
    hex: depth => { const at = Math.min(depth, S.e.deck.length); S.e.deck.splice(at, 0, { curse: S._curseIx }); },
    doubt: () => { S.e.doubt++; },
    firedCount: () => S.e.fired.length,
    reclaim: n => { while (n-- > 0 && S.e.fired.length) S.p.hand.push(S.e.fired.pop()); },
    skipEnemyTurn: () => { S.e.skip = true; },
    allMissesToMana: () => { for (const d of S.p.dice) if (d.face === 'X') d.face = 'M'; },
  };
  return E;
}

function drawCard(S) {
  if (!S.p.deck.length) { S.p.deck = shuffled(S.p.discard, S.rnd); S.p.discard = []; }
  if (S.p.deck.length) S.p.hand.push(S.p.deck.pop());
}

function temperBest(S, steps) {
  // brains want: misses -> mana first (more usable dice), then mana -> special.
  while (steps-- > 0) {
    const miss = S.p.dice.find(d => d.face === 'X');
    if (miss) { miss.face = 'M'; continue; }
    const mana = S.p.dice.find(d => d.face === 'M');
    if (mana) mana.face = 'S'; else break;
  }
}

function halfStepPush(S) {
  const sp = S.p.dice.find(d => d.face === 'S' && !d.echoed);
  if (!sp) return;
  const f = rollFace(sp.color, S.rnd);
  if (f === 'X') sp.face = 'X'; else sp.echoed = true;
}

function whiteHeat(S) {
  const extra = S.p.dice.filter(usable).sort((a, b) => (a.face === 'S' ? -1 : 1) - (b.face === 'S' ? -1 : 1))[0];
  if (!extra) { dealToEnemy(S, 4, true); return; }
  const bonus = extra.face === 'S' ? 6 : 4;
  spendDie(S, extra);
  dealToEnemy(S, bonus, true);
}

function advanceChain(S, color, wildcard) {
  const p = S.p;
  if (p.links === 0 || wildcard || color === CYCLE[p.chainPos]) {
    p.chainPos = wildcard ? (p.chainPos ? CYCLE[p.chainPos] : 'P') : color || (p.chainPos ? CYCLE[p.chainPos] : 'P');
    p.links++;
    checkBurst(S);
  } else if (!p.chainShield) {
    p.links = 0; p.chainPos = null;
  }
}

function checkBurst(S) {
  if (S.p.links < 3) return;
  S.p.links = 0; S.p.chainPos = null;
  S.stats.bursts++;
  S.p.dice.push({ color: 'G', face: rollFace('G', S.rnd), temp: true });
  const waves = S.p.ench.filter(e => e === 'wave').length;
  if (waves) dealToEnemy(S, 3 * waves, true);
  if (S.p.rite && S.p.rite.trigger === 'burst') riteCharge(S);
  if (S.p.rite && S.p.rite.trigger === 'burst') {
    // Maelstrom static: bursts deal damage equal to its charges (before this one's sac check ran)
    dealToEnemy(S, S.p.rite.charges, true);
  }
}

function riteCharge(S, ctxBrain) {
  const r = S.p.rite;
  if (!r) return;
  r.charges++;
  if (r.charges >= r.threshold) {
    S.p.rite = null; // clear BEFORE payoff: Chorus of One's payoff fires sigs, which must not re-trigger it
    const E = makeVerbs(S);
    r.payoff(E, r.charges, { brain: ctxBrain || 'greedy' });
  }
}

function spendDie(S, die) {
  if (die.face === 'S') { S.p.conv += 2; S.stats.convEarned += 2; }
  S.p.dice.splice(S.p.dice.indexOf(die), 1);
}

function dealToEnemy(S, n, direct) {
  if (n <= 0) return;
  const absorbed = Math.min(S.e.guard, n);
  S.e.guard -= absorbed; n -= absorbed;
  if (n > 0) S.e.hp -= n;
  if (direct && S.e.thorns > 0) hurtPlayer(S, S.e.thorns, false);
  if (S.e.hp <= 0) S.over = 'win';
}

function hurtPlayer(S, n, isHit) {
  let fully = true;
  let left = n;
  const a1 = Math.min(S.p.pguard, left); S.p.pguard -= a1; left -= a1;
  const a2 = Math.min(S.p.guard, left); S.p.guard -= a2; left -= a2;
  if (left > 0) { S.p.hp -= left; fully = false; }
  if (isHit && S.p.thorns > 0) dealToEnemy(S, S.p.thorns, false);
  if (isHit && fully && n > 0 && S.p.rite && S.p.rite.trigger === 'fullAbsorb') riteCharge(S);
  if (S.p.hp <= 0 && !S.over) S.over = 'loss';
}

function effPower(S) {
  const t = S.e.telegraph;
  if (!t) return 0;
  return Math.max(0, ENEMY_CARDS[t].base - S.e.staggers);
}

function revealTelegraph(S) {
  S.e.telegraph = null; S.e.staggers = 0;
  while (S.e.deck.length || S.e.discard.length) {
    if (!S.e.deck.length) { // Last Stand
      S.e.deck = S.e.discard.slice(); S.e.discard = []; S.e.enraged = true;
    }
    const top = S.e.deck.shift();
    if (S.e.known > 0) S.e.known--;
    if (typeof top === 'object' && top.curse !== undefined) { // player curse fires
      S._curseFire(top.curse);
      S.stats.hexFired++;
      if (S.over) return;
      continue;
    }
    if (S.e.doubt > 0) { S.e.doubt--; S.e.discard.push(top); continue; } // Whispered Doubt eats it
    S.e.telegraph = top;
    return;
  }
}

function enemyTurn(S) {
  for (let i = S.p.ench.filter(e => e === 'blight1').length; i > 0; i--) S.e.blight = Math.min(6, S.e.blight + 1); // Lingering Cough
  if (S.e.skip) { S.e.skip = false; endEnemyTurn(S); return; }
  const t = S.e.telegraph;
  if (t) {
    const card = ENEMY_CARDS[t];
    const power = effPower(S);
    if (power <= 0) {
      S.e.discard.push(t); // fizzle
    } else {
      const bonus = S.e.enraged && card.kind === 'attack' ? 1 : 0;
      if (card.kind === 'attack') { for (let h = 0; h < card.hits; h++) { hurtPlayer(S, power + bonus, true); if (S.over) return; } }
      else if (card.kind === 'guard') S.e.guard += power;
      else if (card.kind === 'thorns') S.e.thorns = Math.min(3, S.e.thorns + power);
      else if (card.kind === 'molt') { S.e.blight = Math.max(0, S.e.blight - 2); S.e.hp = Math.min(ENEMIES[S.enemyName].hp, S.e.hp + power); }
      S.e.discard.push(t);
    }
  }
  revealTelegraph(S);
  endEnemyTurn(S);
}

function endEnemyTurn(S) {
  if (S.e.blight > 0) {
    dealToEnemy(S, S.e.blight, false);
    S.e.blight--;
    if (S.p.rite && S.p.rite.trigger === 'blightTick') riteCharge(S);
  }
}

// ---- playing cards
function playFree(S, handIx, brain) {
  const ix = S.p.hand[handIx];
  const c = cardOf(S, ix);
  S.p.hand.splice(handIx, 1);
  S.stats.freePlays++;
  S._curseIx = ix;
  const armed = S.p.surge > 0; // a SURGE charge arms the NEXT free play, not the one granting it
  const E = makeVerbs(S);
  c.free(E, { brain });
  if (c.t !== 'CURSE') S.p.discard.push(ix); // curses live in the enemy deck
  if (armed) { S.p.surge--; advanceChain(S, null, true); }
}

function playPaid(S, handIx, die, brain) {
  const ix = S.p.hand[handIx];
  const c = cardOf(S, ix);
  S.p.hand.splice(handIx, 1);
  S.stats.paidPlays++;
  S._curseIx = ix;
  const echoTwice = die.echoed;
  spendDie(S, die);
  // chain: R/B/P advance-or-break; G/E neutral (ASSUMPTION)
  if (c.col === 'R' || c.col === 'B' || c.col === 'P') advanceChain(S, c.col, false);
  const E = makeVerbs(S);
  const ctx = { brain };
  if (c.t === 'ENCH') {
    if (S.p.ench.length < 3) { S.p.ench.push(c.ench); S._enchIx = S._enchIx || []; S._enchIx.push(ix); }
    else S.p.discard.push(ix);
    return;
  }
  if (c.t === 'RITE') {
    if (!S.p.rite) S.p.rite = { trigger: c.rite.trigger, threshold: c.rite.threshold, payoff: c.rite.payoff, charges: 0 };
    else S.p.discard.push(ix);
    return;
  }
  c.paid(E, ctx);
  if (echoTwice) c.paid(E, ctx);
  if (c.t !== 'CURSE') S.p.discard.push(ix);
}

function fireSig(S, name, brain, free) {
  const sig = SIGS[name];
  const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
  const cost = free ? 0 : Math.max(0, sig.cost - disc);
  if (!free) {
    if (S.p.conv < cost) return false;
    S.p.conv -= cost; S.stats.convSpent += cost;
    S.p.attune = 0;
  }
  S.stats.sigFires++;
  S.p.sigUsedTurn = true;
  const E = makeVerbs(S);
  sig.fx(E);
  if (S.p.echoSig) { S.p.echoSig = false; sig.fx(E); }
  if (S.p.rite && S.p.rite.trigger === 'sigUse') riteCharge(S, brain);
  return true;
}

function bestSig(S, brain) {
  // prefer the expensive one (bigger effect) that is situationally useful
  const order = S.p.sigs.slice().sort((a, b) => SIGS[b].cost - SIGS[a].cost);
  for (const s of order) {
    if (s === 'The Reckoning' && S.e.blight < 2) continue;
    if (s === 'Recant' && S.e.fired.length === 0) continue;
    if (s === 'Kindled Fury' && !S.p.dice.some(d => d.face === 'X')) continue;
    return s;
  }
  return order[0];
}

// ------------------------------------------------------------------- brains
// A brain returns one action per call from the legal list, engine loops.
// action: {k:'free'|'paid'|'sig'|'press'|'discard'|'end', ...}

function legalActions(S) {
  const acts = [{ k: 'end' }];
  S.p.hand.forEach((ix, h) => {
    const c = cardOf(S, ix);
    acts.push({ k: 'free', h });
    for (const d of S.p.dice) {
      if (!usable(d)) continue;
      const ok = c.col === 'G' ? d.color === 'G' : (d.color === c.col || d.color === 'G');
      if (ok) { acts.push({ k: 'paid', h, die: d }); break; } // one representative die; refined at exec
    }
    acts.push({ k: 'discard', h });
  });
  for (const s of S.p.sigs) {
    const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
    if (S.p.conv >= Math.max(0, SIGS[s].cost - disc)) acts.push({ k: 'sig', s });
  }
  if (!S.p.pressed && S.p.conv >= 1 && S.p.dice.some(d => d.face === 'X')) acts.push({ k: 'press' });
  return acts;
}

function chooseDie(S, c, prefer) {
  // pick the die to pay card c: exact color first (save gold), mana before special
  // (specials are worth +2conv either way, so spend mana first to keep options? No:
  // spending the SPECIAL yields conv NOW. brains: greedy spends special first, smart
  // spends exact-color mana first and hoards gold unless needed.)
  const cands = S.p.dice.filter(d => usable(d) && (c.col === 'G' ? d.color === 'G' : (d.color === c.col || d.color === 'G')));
  if (!cands.length) return null;
  if (prefer === 'goldLast') {
    cands.sort((a, b) => (a.color === 'G' ? 1 : 0) - (b.color === 'G' ? 1 : 0) || (a.face === 'S' ? 0 : 1) - (b.face === 'S' ? 0 : 1));
  } else {
    cands.sort((a, b) => (a.face === 'S' ? 0 : 1) - (b.face === 'S' ? 0 : 1));
  }
  return cands[0];
}

const BRAINS = {
  // --- pure chaos: uniform random legal action, ends turn 15% of picks
  random(S) {
    const acts = legalActions(S);
    if (S.rnd() < 0.15) return { k: 'end' };
    return pick(acts, S.rnd);
  },

  // --- "played once, skimmed the rules": free-plays everything, pays when it can,
  // never protects the chain, presses fate eagerly, sigs the moment affordable.
  greedy(S) {
    for (const s of S.p.sigs) {
      const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
      if (S.p.conv >= Math.max(0, SIGS[s].cost - disc)) return { k: 'sig', s };
    }
    if (!S.p.pressed && S.p.conv >= 1 && S.p.dice.filter(d => d.face === 'X').length >= 2) return { k: 'press' };
    // pay best-value payable card
    let best = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      const die = chooseDie(S, c, 'anyFirst');
      if (die && (!best || c.v > best.v)) best = { k: 'paid', h, die, v: c.v };
    });
    if (best) return best;
    if (S.p.hand.length) return { k: 'free', h: 0 };
    return { k: 'end' };
  },

  // --- the pilot who read the doc: chain order, guard math vs the visible telegraph,
  // combo timing, gold discipline, discards for ◆ when a sig is one turn away.
  smart(S) {
    const preset = S.presetName;
    const incoming = (() => {
      const t = S.e.telegraph; if (!t) return 0;
      const c = ENEMY_CARDS[t]; if (c.kind !== 'attack') return 0;
      return (effPower(S) + (S.e.enraged ? 1 : 0)) * (c.hits || 1);
    })();

    // 1. lethal check: can a sig finish it?
    for (const s of S.p.sigs) {
      const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
      const afford = S.p.conv >= Math.max(0, SIGS[s].cost - disc);
      if (!afford) continue;
      if (s === 'Cataract' && S.e.hp + S.e.guard <= 5) return { k: 'sig', s };
      if (s === 'The Reckoning' && 2 * S.e.blight >= S.e.hp + S.e.guard) return { k: 'sig', s };
    }
    // 1b. surplus ◆: damage sigs are a repeatable kill path — spend, don't hoard
    for (const s of S.p.sigs) {
      const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
      const cost = Math.max(0, SIGS[s].cost - disc);
      if (S.p.conv < cost + 2) continue; // keep 2◆ working capital for Press Fate
      if (s === 'Cataract') return { k: 'sig', s };
      if (s === 'The Reckoning' && S.e.blight >= 3) return { k: 'sig', s };
    }
    // 2. survival: Final Word / Ironclad vs big incoming
    for (const s of S.p.sigs) {
      const disc = S.p.attune + S.p.ench.filter(e => e === 'sigDiscount').length;
      const afford = S.p.conv >= Math.max(0, SIGS[s].cost - disc);
      if (!afford) continue;
      if (s === 'The Final Word' && incoming >= 5) return { k: 'sig', s };
      if (s === 'Ironclad Oath' && incoming >= 6 && S.p.guard + S.p.pguard < incoming) return { k: 'sig', s };
    }
    // 3. press fate when 2+ misses and conviction to spare
    const misses = S.p.dice.filter(d => d.face === 'X').length;
    if (!S.p.pressed && misses >= 2 && S.p.conv >= 2) return { k: 'press' };

    // 4. enchants/rites first (they only enter via paid)
    let bestEnch = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      if (c.t !== 'ENCH' && c.t !== 'RITE') return;
      if (c.t === 'RITE' && S.p.rite) return;
      if (c.t === 'ENCH' && S.p.ench.length >= 3) return;
      const die = chooseDie(S, c, 'goldLast');
      if (die && (!bestEnch || c.v > bestEnch.v)) bestEnch = { k: 'paid', h, die, v: c.v };
    });
    if (bestEnch) return bestEnch;

    // 5. chain-aware paid play: prefer the color the chain needs
    const need = S.p.links === 0 ? null : CYCLE[S.p.chainPos];
    let bestPaid = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      if (c.t === 'ENCH' || c.t === 'RITE') return;
      const die = chooseDie(S, c, 'goldLast');
      if (!die) return;
      let score = c.v;
      if (c.col === 'R' || c.col === 'B' || c.col === 'P') {
        if (need === null) score += 1;                    // starts a chain
        else if (c.col === need) score += 3;              // advances it
        else if (!S.p.chainShield) score -= (preset === 'TORRENT' ? 4 : 1.5); // breaks it
      }
      // combo sense
      if (c.nm === 'Fever Logic' && S.e.blight < 2) score -= 3;
      if (c.nm === 'Rupture' && S.e.blight < 4) score -= 3;
      if (c.nm === 'The Long Con' && S.e.fired.length < 2) score -= 3;
      if (c.nm === 'Turnabout' && S.e.staggers < 2) score -= 3;
      if (c.nm === 'The Anvil Speaks' && S.p.thorns < 2) score -= 2;
      if (c.nm === 'White Heat' && S.p.dice.filter(usable).length < 2) score -= 5;
      if ((c.nm === 'Raised Shield' || c.nm === 'Hold That Thought' || c.nm === 'Breakwater' || c.nm === 'Measured Answer') && incoming === 0) score -= 1.5;
      if (bestPaid === null || score > bestPaid.score) bestPaid = { k: 'paid', h, die, score };
    });
    if (bestPaid && bestPaid.score > 0.5) return bestPaid;

    // 6. free plays: everything with a point to it
    let bestFree = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      let score = 1;
      if (c.t === 'ENCH' || c.t === 'RITE') score -= 0.5; // free ench/rite = one-shot glyph, mild waste
      if (c.free.toString().includes('scry') && S.e.known > 1) score -= 1;
      if (bestFree === null || score > bestFree.score) bestFree = { k: 'free', h, score };
    });
    if (bestFree && bestFree.score > 0) return bestFree;

    // 7. discard a spare unpayable card for ◆ if a sig is within reach
    const cheapest = Math.min(...S.p.sigs.map(s => Math.max(0, SIGS[s].cost - S.p.attune)));
    if (S.p.hand.length > 2 && S.p.conv < cheapest && cheapest - S.p.conv <= 2) return { k: 'discard', h: 0 };

    return { k: 'end' };
  },
};

// -------------------------------------------------------------- player turn
function playerTurn(S, brainName) {
  S.round++;
  const p = S.p;
  p.sigUsedTurn = false; p.pressed = false; p.chainShield = false;
  while (p.hand.length < 5) { const before = p.hand.length; drawCard(S); if (p.hand.length === before) break; }
  // roll dice (Forge Eternal may have kept one)
  const kept = p.persistDie ? [p.persistDie] : [];
  p.persistDie = null;
  const golds = p.dice.filter(d => d.temp); // burst dice persist until spent
  p.dice = [...kept, ...golds];
  p.kindled = false;
  for (const col of ['R', 'B', 'P', 'G']) p.dice.push({ color: col, face: rollFace(col, S.rnd) });
  // Annealing: turn start, one MISS -> MANA
  for (let i = p.ench.filter(e => e === 'anneal').length; i > 0; i--) {
    const m = p.dice.find(d => d.face === 'X'); if (m) m.face = 'M';
  }
  // enchant turn-start triggers
  for (const e of p.ench) {
    if (e === 'scry1') S.e.known = Math.max(S.e.known, 1);
  }
  if (p.rite && p.rite.trigger === 'turnStart') riteCharge(S);

  const brain = BRAINS[brainName];
  let guardBudget = 200; // hard loop cap
  while (!S.over && guardBudget-- > 0) {
    const act = brain(S);
    if (!act || act.k === 'end') break;
    if (act.k === 'free' && S.p.hand[act.h] !== undefined) playFree(S, act.h, brainName);
    else if (act.k === 'paid' && S.p.hand[act.h] !== undefined && S.p.dice.includes(act.die) && usable(act.die)) playPaid(S, act.h, act.die, brainName);
    else if (act.k === 'sig') { if (!fireSig(S, act.s, brainName, false)) break; }
    else if (act.k === 'press') {
      if (!S.p.pressed && S.p.conv >= 1) {
        S.p.conv--; S.stats.convSpent++; S.p.pressed = true; S.stats.pressFates++;
        for (const d of S.p.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd);
      }
    } else if (act.k === 'discard' && S.p.hand[act.h] !== undefined) {
      S.p.discard.push(S.p.hand[act.h]); S.p.hand.splice(act.h, 1);
      S.p.conv++; S.stats.convEarned++; S.stats.discardsForConv++;
    } else break; // illegal/stale action = brain is done
  }

  // Forge Eternal: keep one unspent die (best face)
  if (p.ench.includes('forge')) {
    const keep = p.dice.filter(d => !d.temp && !d.kindled).sort((a, b) => 'SMX'.indexOf(a.face) - 'SMX'.indexOf(b.face))[0];
    if (keep) p.persistDie = keep;
  }
  // kindled dice vanish at end of turn; temp burst dice persist
  p.dice = p.dice.filter(d => d.temp);
  // end of player turn: guard fade happens after enemy turn per the reference
  // ("End: telegraph resolves ... your Guard fades") — so fade is applied post-enemy.
}

function gameLoop(presetName, enemyName, recipe, brainName, seed) {
  const S = newGame(presetName, enemyName, recipe, seed);
  // curse firing needs card identity
  S._curseFire = ix => {
    const c = cardOf(S, ix);
    S._curseIx = ix;
    const E = makeVerbs(S);
    if (c.curse) c.curse(E);
    S.e.fired.push(ix);
    // The Ledger: when one of your curses fires, DRAW 1 + advance chain 1
    for (const e of S.p.ench) if (e === 'ledger') { drawCard(S); advanceChain(S, null, true); }
  };
  while (!S.over && S.round < 40) {
    playerTurn(S, brainName);
    if (S.over) break;
    enemyTurn(S);
    if (S.over) break;
    // guard fades at round end unless persistent
    S.p.guard = 0;
  }
  if (!S.over) S.over = 'stall';
  return S;
}

// ============================================================================
// PvP EXPERIMENT (--pvp) — preset vs preset, EXPLORATORY. Solo remains the goal.
// Owner's sketch (2026-07-22): still draw-5-play-cards; SHARED pool of 4 dice;
// each player may spend at most ONE shared die per round; dice reroll after
// both players have gone once.
// ============================================================================
const PVP_NOTES = [
  'DEAD in PvP as written: STAGGER, Turnabout, Dead Air, Motion to Suppress riders, The Final Word (no telegraph to sit on). Standstill fights with half a deck.',
  'NEARLY DEAD: White Heat (needs a 2nd die; only a personal burst/kindle die qualifies under the 1-shared-die law). The Forge Eternal (shared dice reroll every round) = no-op.',
  'SHARED-POOL spillover: TEMPER, Annealing, Kindled Fury and Press Fate improve/reroll the SHARED pool — the opponent can inherit your upgraded dice. Genuine semi-co-op texture, genuine feel-bad risk.',
  'Personal dice exist: Surge-Burst gold dice and KINDLE dice belong to their owner and are spendable beyond the 1-shared-die law (kindled dice still expire at end of turn).',
  'HEX works beautifully symmetric: curses slide into the OPPONENT\'s draw deck and fire when drawn. Whispered Doubt eats the drawer\'s next card; Sealed Fate skips the turn it is drawn into.',
  'Blight ticks at the end of the afflicted player\'s turn; Guard persists through the opponent\'s turn and fades at your next turn start; thorns retaliate on direct hits.',
  'Both players use the same brain tier and the same fixed SIG_PICKS. P1 = row preset, acts first every round: the diagonal measures pure first-mover advantage.',
];

// PvP loadouts: every preset gets a LIVE damage sig (Foresight/Final Word are
// telegraph-bound and dead in PvP); Cataract listed first so surplus-◆ logic sees it.
const PVP_SIG_PICKS = {
  STANDSTILL: ['Cataract', 'Ironclad Oath'],
  CONTAGION: ['The Reckoning', 'Cataract'],
  BASTION: ['Ironclad Oath', 'Cataract'],
  FOUNDRY: ['Cataract', 'Kindled Fury'],
  TORRENT: ['Cataract', 'Kindled Fury'],
  INVOCATION: ['Cataract', 'Ironclad Oath'],
  MALISON: ['Recant', 'Cataract'],
};
let PVP_HP = 30;

function mkFighter(presetName, hp = PVP_HP, sigs = null) {
  const preset = PRESETS[presetName];
  const deck = [];
  preset.cards.forEach((c, ix) => { for (let i = 0; i < c.n; i++) deck.push(ix); });
  return {
    presetName, hp, maxhp: hp, deck, hand: [], discard: [], fired: [],
    guard: 0, pguard: 0, thorns: 0, blight: 0, conv: 0,
    chainPos: null, links: 0, surge: 0, attune: 0, chainShield: false, echoSig: false,
    ench: [], rite: null, temps: [], doubt: 0, skip: false, skipNow: false,
    pressed: false, sigUsedTurn: false, sharedUsed: false, sigs: (sigs || PVP_SIG_PICKS[presetName]).slice(),
    sigFires: 0, paidDone: false,
  };
}

function pvpDraw(S, meIx) {
  const me = S.ps[meIx];
  if (!me.deck.length) {
    me.deck = shuffled(me.discard, S.rnd); me.discard = [];
    if (!me.deck.length) return;
  }
  const top = me.deck.pop();
  if (typeof top === 'object' && top.curse !== undefined) {
    const byIx = top.by;
    const c = PRESETS[S.ps[byIx].presetName].cards[top.curse];
    const E = pvpVerbs(S, byIx); // curse text is written from the caster's seat
    if (c.curse) c.curse(E);
    S.ps[byIx].fired.push(top.curse);
    for (const e of S.ps[byIx].ench) if (e === 'ledger') { pvpDraw(S, byIx); pvpChain(S, byIx, null, true); }
    if (!S.over) pvpDraw(S, meIx); // keep drawing past the curse
    return;
  }
  if (me.doubt > 0) { me.doubt--; me.discard.push(top); pvpDraw(S, meIx); return; }
  me.hand.push(top);
}

function pvpHurt(S, victimIx, n, isHit, attackerIx) {
  const v = S.ps[victimIx];
  let left = n, fully = true;
  const a1 = Math.min(v.pguard, left); v.pguard -= a1; left -= a1;
  const a2 = Math.min(v.guard, left); v.guard -= a2; left -= a2;
  if (left > 0) { v.hp -= left; fully = false; }
  if (isHit && v.thorns > 0 && attackerIx !== undefined) pvpHurt(S, attackerIx, v.thorns, false);
  if (isHit && fully && n > 0 && v.rite && v.rite.trigger === 'fullAbsorb') pvpRiteCharge(S, victimIx);
  if (v.hp <= 0 && !S.over) S.over = victimIx === 0 ? 'p2' : 'p1';
}

function pvpChain(S, meIx, color, wildcard) {
  const me = S.ps[meIx];
  if (me.links === 0 || wildcard || color === CYCLE[me.chainPos]) {
    me.chainPos = wildcard ? (me.chainPos ? CYCLE[me.chainPos] : 'P') : color || (me.chainPos ? CYCLE[me.chainPos] : 'P');
    me.links++;
    if (me.links >= 3) {
      me.links = 0; me.chainPos = null;
      me.temps.push({ color: 'G', face: rollFace('G', S.rnd), temp: true });
      const waves = me.ench.filter(e => e === 'wave').length;
      if (waves) pvpHurt(S, 1 - meIx, 3 * waves, false);
      if (me.rite && me.rite.trigger === 'burst') {
        pvpRiteCharge(S, meIx);
        if (me.rite) pvpHurt(S, 1 - meIx, me.rite.charges, false);
      }
    }
  } else if (!me.chainShield) { me.links = 0; me.chainPos = null; }
}

function pvpRiteCharge(S, meIx) {
  const me = S.ps[meIx];
  const r = me.rite;
  if (!r) return;
  r.charges++;
  if (r.charges >= r.threshold) {
    me.rite = null;
    r.payoff(pvpVerbs(S, meIx), r.charges, { brain: 'smart' });
  }
}

function pvpSig(S, meIx, name, free) {
  const me = S.ps[meIx];
  const sig = SIGS[name];
  const disc = me.attune + me.ench.filter(e => e === 'sigDiscount').length;
  const cost = free ? 0 : Math.max(0, sig.cost - disc);
  if (!free) {
    if (me.conv < cost) return false;
    me.conv -= cost; me.attune = 0;
  }
  me.sigFires++; me.sigUsedTurn = true;
  const E = pvpVerbs(S, meIx);
  sig.fx(E);
  if (me.echoSig) { me.echoSig = false; sig.fx(E); }
  if (me.rite && me.rite.trigger === 'sigUse') pvpRiteCharge(S, meIx);
  return true;
}

function pvpVerbs(S, meIx) {
  const me = S.ps[meIx], foeIx = 1 - meIx, foe = S.ps[foeIx];
  const E = {
    draw: n => { for (let i = 0; i < n; i++) pvpDraw(S, meIx); },
    guard: (n, persist) => { if (persist || me.ench.includes('guardPersists')) me.pguard += n; else me.guard += n; },
    thorns: n => { me.thorns = Math.min(3, me.thorns + n); },
    blight: n => { foe.blight = Math.min(6, foe.blight + n); },
    heal: n => { me.hp = Math.min(me.maxhp, me.hp + n); },
    dmg: n => pvpHurt(S, foeIx, n, true, meIx),
    scry: () => {}, stagger: () => {}, telegraphFizzled: () => false,
    fizzleTelegraph: () => {}, turnabout: () => {},
    doubleBlight: () => { foe.blight = Math.min(6, foe.blight * 2); },
    rupture: () => { const b = foe.blight; foe.blight = 0; pvpHurt(S, foeIx, 2 * b, true, meIx); },
    ruptureAll: () => { const b = foe.blight; foe.blight = 0; pvpHurt(S, foeIx, 2 * b, true, meIx); },
    anvil: () => { const d = 2 * me.thorns; pvpHurt(S, foeIx, d, true, meIx); if (me.thorns >= 3) pvpHurt(S, foeIx, d, true, meIx); },
    temper: n => { let steps = n; while (steps-- > 0) { const m = S.dice.find(d => d.face === 'X'); if (m) { m.face = 'M'; continue; } const ma = S.dice.find(d => d.face === 'M'); if (ma) ma.face = 'S'; else break; } },
    rerollMisses: () => { for (const d of S.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd); },
    kindle: () => { if (!me.temps.some(t => t.kindled)) me.temps.push({ color: 'G', face: rollFace('G', S.rnd), kindled: true }); },
    halfStepPush: () => { const sp = [...me.temps, ...S.dice].find(d => d.face === 'S' && !d.echoed); if (sp) { const f = rollFace(sp.color, S.rnd); if (f === 'X') sp.face = 'X'; else sp.echoed = true; } },
    whiteHeat: () => { const extra = me.temps.filter(usable)[0]; if (!extra) return; const bonus = extra.face === 'S' ? 6 : 4; if (extra.face === 'S') me.conv += 2; me.temps.splice(me.temps.indexOf(extra), 1); pvpHurt(S, foeIx, bonus, true, meIx); },
    surgeCharge: () => { me.surge++; },
    advanceChain: () => pvpChain(S, meIx, null, true),
    chainShield: () => { me.chainShield = true; },
    links: () => me.links,
    burstNow: () => { me.links = 2; pvpChain(S, meIx, null, true); },
    attune: n => { me.attune += n; },
    conviction: n => { me.conv += n; },
    sigUsedThisTurn: () => me.sigUsedTurn,
    echoNextSig: () => { me.echoSig = true; },
    freeSig: () => { const s = me.sigs.slice().sort((a, b) => SIGS[b].cost - SIGS[a].cost)[0]; if (s) pvpSig(S, meIx, s, true); },
    bothSigsFree: () => { for (const s of me.sigs) pvpSig(S, meIx, s, true); },
    hex: depth => { const at = Math.max(0, foe.deck.length - depth); foe.deck.splice(at, 0, { curse: S._curseIx, by: meIx }); },
    doubt: () => { foe.doubt++; },
    firedCount: () => me.fired.length,
    reclaim: n => { while (n-- > 0 && me.fired.length) me.hand.push(me.fired.pop()); },
    skipEnemyTurn: () => { foe.skipNow = true; foe.skip = true; },
    allMissesToMana: () => { for (const d of S.dice) if (d.face === 'X') d.face = 'M'; },
  };
  return E;
}

function pvpChooseDie(S, me, c) {
  const pool = [...me.temps.filter(usable), ...(me.sharedUsed ? [] : S.dice.filter(usable))];
  const cands = pool.filter(d => c.col === 'G' ? d.color === 'G' : (d.color === c.col || d.color === 'G'));
  // personal temps first (free real estate), then exact color, gold last
  cands.sort((a, b) => (a.temp || a.kindled ? 0 : 1) - (b.temp || b.kindled ? 0 : 1) || (a.color === 'G' ? 1 : 0) - (b.color === 'G' ? 1 : 0));
  return cands[0] || null;
}

function pvpSpend(S, me, die) {
  if (die.face === 'S') me.conv += 2;
  const ti = me.temps.indexOf(die);
  if (ti >= 0) me.temps.splice(ti, 1);
  else { S.dice.splice(S.dice.indexOf(die), 1); me.sharedUsed = true; }
}

function pvpPlayFree(S, meIx, h) {
  const me = S.ps[meIx];
  const ix = me.hand[h];
  const c = PRESETS[me.presetName].cards[ix];
  me.hand.splice(h, 1);
  S._curseIx = ix;
  const armed = me.surge > 0;
  c.free(pvpVerbs(S, meIx), {});
  if (c.t !== 'CURSE') me.discard.push(ix);
  if (armed) { me.surge--; pvpChain(S, meIx, null, true); }
}

function pvpPlayPaid(S, meIx, h, die) {
  const me = S.ps[meIx];
  const ix = me.hand[h];
  const c = PRESETS[me.presetName].cards[ix];
  me.hand.splice(h, 1);
  S._curseIx = ix;
  const echoTwice = die.echoed;
  pvpSpend(S, me, die);
  if (c.col === 'R' || c.col === 'B' || c.col === 'P') pvpChain(S, meIx, c.col, false);
  if (c.t === 'ENCH') { if (me.ench.length < 3) me.ench.push(c.ench); else me.discard.push(ix); return; }
  if (c.t === 'RITE') { if (!me.rite) me.rite = { trigger: c.rite.trigger, threshold: c.rite.threshold, payoff: c.rite.payoff, charges: 0 }; else me.discard.push(ix); return; }
  const E = pvpVerbs(S, meIx);
  c.paid(E, {});
  if (echoTwice) c.paid(E, {});
  if (c.t !== 'CURSE') me.discard.push(ix);
}

const PVP_BRAINS = {
  random(S, meIx) {
    const me = S.ps[meIx];
    if (S.rnd() < 0.2) return { k: 'end' };
    const acts = [{ k: 'end' }];
    me.hand.forEach((ix, h) => {
      acts.push({ k: 'free', h }, { k: 'discard', h });
      const die = pvpChooseDie(S, me, PRESETS[me.presetName].cards[ix]);
      if (die) acts.push({ k: 'paid', h, die });
    });
    for (const s of me.sigs) { const disc = me.attune + me.ench.filter(e => e === 'sigDiscount').length; if (me.conv >= Math.max(0, SIGS[s].cost - disc)) acts.push({ k: 'sig', s }); }
    if (!me.pressed && me.conv >= 1 && S.dice.some(d => d.face === 'X')) acts.push({ k: 'press' });
    return pick(acts, S.rnd);
  },
  greedy(S, meIx) {
    const me = S.ps[meIx];
    for (const s of me.sigs) { const disc = me.attune + me.ench.filter(e => e === 'sigDiscount').length; if (me.conv >= Math.max(0, SIGS[s].cost - disc)) return { k: 'sig', s }; }
    let best = null;
    me.hand.forEach((ix, h) => {
      const c = PRESETS[me.presetName].cards[ix];
      const die = pvpChooseDie(S, me, c);
      if (die && (!best || c.v > best.v)) best = { k: 'paid', h, die, v: c.v };
    });
    if (best) return best;
    if (me.hand.length) return { k: 'free', h: 0 };
    return { k: 'end' };
  },
  smart(S, meIx) {
    const me = S.ps[meIx], foe = S.ps[1 - meIx];
    // lethal / surplus sig spend
    for (const s of me.sigs) {
      const disc = me.attune + me.ench.filter(e => e === 'sigDiscount').length;
      const cost = Math.max(0, SIGS[s].cost - disc);
      if (me.conv < cost) continue;
      if (s === 'Cataract' && (foe.hp + foe.guard + foe.pguard <= 5 || me.conv >= cost + 2)) return { k: 'sig', s };
      if (s === 'The Reckoning' && (2 * foe.blight >= foe.hp || (foe.blight >= 3 && me.conv >= cost + 2))) return { k: 'sig', s };
      if (s === 'Ironclad Oath' && me.hp <= 12 && me.guard + me.pguard <= 2 && me.conv >= cost) return { k: 'sig', s };
      if (s === 'Recant' && me.fired.length >= 3) return { k: 'sig', s };
      if (s === 'Kindled Fury' && S.dice.filter(d => d.face === 'X').length >= 3 && !me.sharedUsed) return { k: 'sig', s };
    }
    // press fate before choosing the one shared die
    if (!me.pressed && !me.sharedUsed && me.conv >= 2 && S.dice.filter(d => d.face === 'X').length >= 3) return { k: 'press' };
    // paid: enchants/rites first, then chain color
    const need = me.links === 0 ? null : CYCLE[me.chainPos];
    let bestPaid = null;
    me.hand.forEach((ix, h) => {
      const c = PRESETS[me.presetName].cards[ix];
      if (c.t === 'RITE' && me.rite) return;
      if (c.t === 'ENCH' && me.ench.length >= 3) return;
      const die = pvpChooseDie(S, me, c);
      if (!die) return;
      let score = c.v + (c.t === 'ENCH' || c.t === 'RITE' ? 2 : 0);
      if (c.col === 'R' || c.col === 'B' || c.col === 'P') {
        if (need === null) score += 1; else if (c.col === need) score += 3;
        else if (!me.chainShield) score -= (me.presetName === 'TORRENT' ? 4 : 1.5);
      }
      if (c.nm === 'Fever Logic' && foe.blight < 2) score -= 3;
      if (c.nm === 'Rupture' && foe.blight < 4) score -= 3;
      if (c.nm === 'The Long Con' && me.fired.length < 2) score -= 3;
      if (c.nm === 'The Anvil Speaks' && me.thorns < 2) score -= 2;
      if (c.nm === 'White Heat' && !me.temps.some(usable)) score -= 6;
      if (bestPaid === null || score > bestPaid.score) bestPaid = { k: 'paid', h, die, score };
    });
    if (bestPaid && bestPaid.score > 0.5) return bestPaid;
    // frees
    if (me.hand.length) {
      let bestFree = null;
      me.hand.forEach((ix, h) => {
        const c = PRESETS[me.presetName].cards[ix];
        let score = 1;
        if (c.t === 'ENCH' || c.t === 'RITE') score -= 0.6;
        if (bestFree === null || score > bestFree.score) bestFree = { k: 'free', h, score };
      });
      if (bestFree && bestFree.score > 0) return bestFree;
    }
    // discard toward a sig
    const cheapest = Math.min(...me.sigs.map(s => Math.max(0, SIGS[s].cost - me.attune)));
    if (me.hand.length > 2 && me.conv < cheapest && cheapest - me.conv <= 2) return { k: 'discard', h: 0 };
    return { k: 'end' };
  },
};

function pvpTurn(S, meIx, brainName) {
  const me = S.ps[meIx];
  if (me.skip) { me.skip = false; me.skipNow = false; return; }
  me.sigUsedTurn = false; me.pressed = false; me.chainShield = false; me.sharedUsed = false;
  me.guard = 0; // faded guard fades at YOUR turn start (it protected you through their turn)
  while (me.hand.length < 5) { const b = me.hand.length; pvpDraw(S, meIx); if (me.hand.length === b) break; }
  if (me.skipNow) { me.skipNow = false; me.skip = false; return; } // Sealed Fate fired into this turn
  for (let i = me.ench.filter(e => e === 'anneal').length; i > 0; i--) { const m = S.dice.find(d => d.face === 'X'); if (m) m.face = 'M'; }
  // Lingering Cough: at the start of the ENEMY turn — my cough blights the foe on THEIR turn start; handled here for foe's coughs targeting me:
  const foe = S.ps[1 - meIx];
  for (const e of foe.ench) if (e === 'blight1') me.blight = Math.min(6, me.blight + 1);
  const brain = PVP_BRAINS[brainName];
  let cap = 100;
  while (!S.over && cap-- > 0) {
    const act = brain(S, meIx);
    if (!act || act.k === 'end') break;
    if (act.k === 'free' && me.hand[act.h] !== undefined) pvpPlayFree(S, meIx, act.h);
    else if (act.k === 'paid' && me.hand[act.h] !== undefined) {
      const die = pvpChooseDie(S, me, PRESETS[me.presetName].cards[me.hand[act.h]]);
      if (!die) break;
      pvpPlayPaid(S, meIx, act.h, die);
    } else if (act.k === 'sig') { if (!pvpSig(S, meIx, act.s, false)) break; }
    else if (act.k === 'press') {
      if (me.pressed || me.conv < 1) break;
      me.conv--; me.pressed = true;
      for (const d of S.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd);
    } else if (act.k === 'discard' && me.hand[act.h] !== undefined) {
      me.discard.push(me.hand[act.h]); me.hand.splice(act.h, 1); me.conv++;
    } else break;
  }
  me.temps = me.temps.filter(t => !t.kindled);
  // my blight ticks at the end of my turn
  if (me.blight > 0) {
    pvpHurt(S, meIx, me.blight, false);
    me.blight--;
    for (const p of S.ps) if (p.rite && p.rite.trigger === 'blightTick') pvpRiteCharge(S, S.ps.indexOf(p));
  }
}

function pvpGame(presetA, presetB, brainName, seed) {
  const rnd = mulberry32(seed);
  const S = { rnd, dice: [], ps: [mkFighter(presetA), mkFighter(presetB)], over: null, round: 0 };
  S.ps[0].deck = shuffled(S.ps[0].deck, rnd);
  S.ps[1].deck = shuffled(S.ps[1].deck, rnd);
  while (!S.over && S.round < 60) {
    S.round++;
    S.dice = ['R', 'B', 'P', 'G'].map(c => ({ color: c, face: rollFace(c, rnd) }));
    pvpTurn(S, 0, brainName);
    if (S.over) break;
    pvpTurn(S, 1, brainName);
  }
  if (!S.over) S.over = 'draw';
  return S;
}

// ============================================================================
// CO-OP EXPERIMENT (--coop) — party vs one enemy. EXPLORATORY, solo stays the goal.
// Owner's sketch (2026-07-22): players alternate 1-card turns (free OR paid);
// the round runs until EVERY player has made their one paid play; when the last
// holdout pays, the enemy acts at the end of that turn, then the shared 4 dice
// reroll. Knobs: enemy actions per turn (T), party size, boss HP multiplier.
// ============================================================================
const COOP_NOTES = [
  'Shared pool is 4 dice regardless of party size — at 3-4 players most rounds someone\'s color simply isn\'t there. Dice starvation is the defining constraint of big parties.',
  'One paid play per player per round (the round-end trigger). A player with no usable die and no wish to wait may FORFEIT their paid play so the round can end.',
  'Free plays are a timing resource: the round does not end until the last paid play, so stalling your pay lets the party squeeze in extra free turns. The smart brain exploits this mildly.',
  'Enemy plays T cards per turn: resolve telegraph, reveal, repeat T times. Only the first resolution of each turn was telegraphed a full round ahead — the rest resolve on reveal. T is the pressure knob.',
  'Enemy attacks target on rotation, assigned at REVEAL time (the party can see who the telegraph is aimed at and guard accordingly).',
  'ANY player at 0 Vitae = party loss. Enemy blight/stagger/HEX all work exactly as solo. Fired-curse pile is communal (Weight of Guilt counts all of it).',
  'White Heat\'s second die must be a personal (burst/kindle) die — the 1-paid-die law forbids a second shared spend.',
  'Sigs are the SOLO picks (telegraph sigs live again). Party members share nothing else: hands, ◆, chains, and enchants are personal.',
];

// Co-op dials (2026-07-22 second experiment): ally targeting + token caps
let COOP_ALLY = false;   // beneficial effects (GUARD/THORNS/HEAL) may target other players
let BLIGHT_MAX = 6;      // co-op only; solo/PvP keep the printed caps
let THORNS_MAX = 3;
let COOP_FULLTEL = false; // third experiment: ALL T enemy cards face-up before the player round

const effQ = q => Math.max(0, ENEMY_CARDS[q.nm].base - q.st);
function biggestAttack(S) {
  let best = null, bestVal = -1;
  for (const q of S.e.queue) {
    const c = ENEMY_CARDS[q.nm];
    if (c.kind !== 'attack') continue;
    const val = effQ(q) * (c.hits || 1);
    if (val > bestVal) { best = q; bestVal = val; }
  }
  return best || S.e.queue[0] || null;
}
function incomingFor(S, i) {
  let sum = 0;
  for (const q of S.e.queue) {
    const c = ENEMY_CARDS[q.nm];
    if (c.kind !== 'attack' || q.target !== i) continue;
    sum += (effQ(q) + (S.e.enraged ? 1 : 0)) * (c.hits || 1);
  }
  return sum;
}

// Who should receive a defensive/heal effect? The player the telegraph is aimed at,
// or the lowest-health member for heals. Falls back to the caster.
function allyFor(S, i, kind) {
  if (!COOP_ALLY) return i;
  if (kind === 'heal') {
    let best = i;
    for (let j = 0; j < S.party.length; j++) if (S.party[j].hp < S.party[best].hp) best = j;
    return best;
  }
  // guard/thorns: the member facing the most face-up incoming damage
  let best = i, bestIn = incomingFor(S, i);
  for (let j = 0; j < S.party.length; j++) { const inc = incomingFor(S, j); if (inc > bestIn) { best = j; bestIn = inc; } }
  return bestIn > 0 ? best : i;
}

// Refill the face-up telegraph queue to qsize (1 = classic, T = full telegraphing).
function coopRefill(S) {
  while (S.e.queue.length < S.e.qsize && !S.over) {
    if (!S.e.deck.length && !S.e.discard.length) return;
    if (!S.e.deck.length) { S.e.deck = S.e.discard.slice(); S.e.discard = []; S.e.enraged = true; }
    const top = S.e.deck.shift();
    if (typeof top === 'object' && top.curse !== undefined) {
      const by = top.by;
      const c = PRESETS[S.party[by].presetName].cards[top.curse];
      if (c.curse) c.curse(coopVerbs(S, by));
      S.e.fired.push(top.curse);
      for (const e of S.party[by].ench) if (e === 'ledger') { coopDraw(S, by); coopChain(S, by, null, true); }
      if (S.over) return;
      continue;
    }
    if (S.e.doubt > 0) { S.e.doubt--; S.e.discard.push(top); continue; }
    S.e.queue.push({ nm: top, st: 0, target: S.e.nextTarget % S.party.length });
    S.e.nextTarget = (S.e.nextTarget + 1) % S.party.length;
  }
}

function coopDraw(S, i) {
  const m = S.party[i];
  if (!m.deck.length) { m.deck = shuffled(m.discard, S.rnd); m.discard = []; }
  if (m.deck.length) m.hand.push(m.deck.pop());
}

function coopHurtEnemy(S, n, direct, byIx) {
  if (n <= 0) return;
  const a = Math.min(S.e.guard, n); S.e.guard -= a; n -= a;
  if (n > 0) S.e.hp -= n;
  if (direct && S.e.thorns > 0 && byIx !== undefined) coopHurtMember(S, byIx, S.e.thorns, false);
  if (S.e.hp <= 0 && !S.over) S.over = 'win';
}

function coopHurtMember(S, i, n, isHit) {
  const m = S.party[i];
  let left = n, fully = true;
  const a1 = Math.min(m.pguard, left); m.pguard -= a1; left -= a1;
  const a2 = Math.min(m.guard, left); m.guard -= a2; left -= a2;
  if (left > 0) { m.hp -= left; fully = false; }
  if (isHit && m.thorns > 0) coopHurtEnemy(S, m.thorns, false);
  if (isHit && fully && n > 0 && m.rite && m.rite.trigger === 'fullAbsorb') coopRite(S, i);
  if (m.hp <= 0 && !S.over) S.over = 'loss';
}

function coopChain(S, i, color, wildcard) {
  const m = S.party[i];
  if (m.links === 0 || wildcard || color === CYCLE[m.chainPos]) {
    m.chainPos = wildcard ? (m.chainPos ? CYCLE[m.chainPos] : 'P') : color || (m.chainPos ? CYCLE[m.chainPos] : 'P');
    m.links++;
    if (m.links >= 3) {
      m.links = 0; m.chainPos = null;
      m.temps.push({ color: 'G', face: rollFace('G', S.rnd), temp: true });
      const waves = m.ench.filter(e => e === 'wave').length;
      if (waves) coopHurtEnemy(S, 3 * waves, false);
      if (m.rite && m.rite.trigger === 'burst') { coopRite(S, i); if (m.rite) coopHurtEnemy(S, m.rite.charges, false); }
    }
  } else if (!m.chainShield) { m.links = 0; m.chainPos = null; }
}

function coopRite(S, i) {
  const m = S.party[i];
  const r = m.rite;
  if (!r) return;
  r.charges++;
  if (r.charges >= r.threshold) { m.rite = null; r.payoff(coopVerbs(S, i), r.charges, { brain: 'smart' }); }
}

function coopSig(S, i, name, free) {
  const m = S.party[i];
  const sig = SIGS[name];
  const disc = m.attune + m.ench.filter(e => e === 'sigDiscount').length;
  const cost = free ? 0 : Math.max(0, sig.cost - disc);
  if (!free) { if (m.conv < cost) return false; m.conv -= cost; m.attune = 0; }
  m.sigFires++; m.sigUsedTurn = true;
  const E = coopVerbs(S, i);
  sig.fx(E);
  if (m.echoSig) { m.echoSig = false; sig.fx(E); }
  if (m.rite && m.rite.trigger === 'sigUse') coopRite(S, i);
  return true;
}

function coopVerbs(S, i) {
  const m = S.party[i];
  const E = {
    draw: n => { for (let k = 0; k < n; k++) coopDraw(S, i); },
    guard: (n, persist) => { const tgt = S.party[allyFor(S, i, 'guard')]; if (persist || tgt.ench.includes('guardPersists')) tgt.pguard += n; else tgt.guard += n; },
    thorns: n => { const tgt = S.party[allyFor(S, i, 'guard')]; tgt.thorns = Math.min(THORNS_MAX, tgt.thorns + n); },
    blight: n => { S.e.blight = Math.min(BLIGHT_MAX, S.e.blight + n); },
    heal: n => { const tgt = S.party[allyFor(S, i, 'heal')]; tgt.hp = Math.min(tgt.maxhp, tgt.hp + n); },
    dmg: n => coopHurtEnemy(S, n, true, i),
    scry: n => { S.e.known = Math.max(S.e.known, Math.min(n, S.e.deck.length)); },
    stagger: n => { const q = biggestAttack(S); if (q) { q.st += n; S.e.lastStag = q; } },
    telegraphFizzled: () => { const q = S.e.lastStag || S.e.queue[0]; return !q || effQ(q) <= 0; },
    fizzleTelegraph: () => { const q = biggestAttack(S); if (q) q.st = 99; },
    turnabout: () => { let q = null; for (const e2 of S.e.queue) if (!q || e2.st > q.st) q = e2; if (q) { coopHurtEnemy(S, 2 * q.st, true, i); q.st = 0; } },
    doubleBlight: () => { S.e.blight = Math.min(BLIGHT_MAX, S.e.blight * 2); },
    rupture: () => { const b = S.e.blight; S.e.blight = 0; coopHurtEnemy(S, 2 * b, true, i); },
    ruptureAll: () => { const b = S.e.blight; S.e.blight = 0; coopHurtEnemy(S, 2 * b, true, i); },
    anvil: () => { const d = 2 * m.thorns; coopHurtEnemy(S, d, true, i); if (m.thorns >= 3) coopHurtEnemy(S, d, true, i); },
    temper: n => { let s = n; while (s-- > 0) { const x = S.dice.find(d => d.face === 'X'); if (x) { x.face = 'M'; continue; } const ma = S.dice.find(d => d.face === 'M'); if (ma) ma.face = 'S'; else break; } },
    rerollMisses: () => { for (const d of S.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd); },
    kindle: () => { if (!m.temps.some(t => t.kindled)) m.temps.push({ color: 'G', face: rollFace('G', S.rnd), kindled: true }); },
    halfStepPush: () => { const sp = [...m.temps, ...S.dice].find(d => d.face === 'S' && !d.echoed); if (sp) { const f = rollFace(sp.color, S.rnd); if (f === 'X') sp.face = 'X'; else sp.echoed = true; } },
    whiteHeat: () => { const extra = m.temps.filter(usable)[0]; if (!extra) return; const bonus = extra.face === 'S' ? 6 : 4; if (extra.face === 'S') m.conv += 2; m.temps.splice(m.temps.indexOf(extra), 1); coopHurtEnemy(S, bonus, true, i); },
    surgeCharge: () => { m.surge++; },
    advanceChain: () => coopChain(S, i, null, true),
    chainShield: () => { m.chainShield = true; },
    links: () => m.links,
    burstNow: () => { m.links = 2; coopChain(S, i, null, true); },
    attune: n => { m.attune += n; },
    conviction: n => { m.conv += n; },
    sigUsedThisTurn: () => m.sigUsedTurn,
    echoNextSig: () => { m.echoSig = true; },
    freeSig: () => { const s = m.sigs.slice().sort((a, b) => SIGS[b].cost - SIGS[a].cost)[0]; if (s) coopSig(S, i, s, true); },
    bothSigsFree: () => { for (const s of m.sigs) coopSig(S, i, s, true); },
    hex: depth => { const at = Math.min(depth, S.e.deck.length); S.e.deck.splice(at, 0, { curse: S._curseIx, by: i }); },
    doubt: () => { S.e.doubt++; },
    firedCount: () => S.e.fired.length,
    reclaim: n => { const mine = []; for (let k = S.e.fired.length - 1; k >= 0 && mine.length < n; k--) mine.push(k); for (const k of mine) m.hand.push(S.e.fired.splice(k, 1)[0]); },
    skipEnemyTurn: () => { S.e.skip = true; },
    allMissesToMana: () => { for (const d of S.dice) if (d.face === 'X') d.face = 'M'; },
  };
  return E;
}

function coopChooseDie(S, m, c) {
  const pool = [...m.temps.filter(usable), ...(m.paidDone ? [] : S.dice.filter(usable))];
  const cands = pool.filter(d => c.col === 'G' ? d.color === 'G' : (d.color === c.col || d.color === 'G'));
  cands.sort((a, b) => (a.temp || a.kindled ? 0 : 1) - (b.temp || b.kindled ? 0 : 1) || (a.color === 'G' ? 1 : 0) - (b.color === 'G' ? 1 : 0));
  return cands[0] || null;
}

// One member turn = optional quick actions (sig / press / discard) + ONE card play.
// Returns true if the member made their PAID play this turn.
function coopMemberTurn(S, i, brainName) {
  const m = S.party[i];
  const incoming = incomingFor(S, i);

  // quick actions (not the card): sigs and press fate
  for (const s of m.sigs) {
    const disc = m.attune + m.ench.filter(e => e === 'sigDiscount').length;
    const cost = Math.max(0, SIGS[s].cost - disc);
    if (m.conv < cost) continue;
    if (s === 'Cataract' && (S.e.hp + S.e.guard <= 5 || m.conv >= cost + 2)) { coopSig(S, i, s, false); break; }
    if (s === 'The Reckoning' && (2 * S.e.blight >= S.e.hp + S.e.guard || (S.e.blight >= 4 && m.conv >= cost + 2))) { coopSig(S, i, s, false); break; }
    if (s === 'The Final Word' && incoming >= 5) { coopSig(S, i, s, false); break; }
    if (s === 'Ironclad Oath' && incoming >= 6 && m.guard + m.pguard < incoming) { coopSig(S, i, s, false); break; }
    if (s === 'Kindled Fury' && brainName !== 'smart' && S.dice.filter(d => d.face === 'X').length >= 3) { coopSig(S, i, s, false); break; }
  }
  if (!m.pressed && !m.paidDone && m.conv >= 2 && S.dice.filter(d => d.face === 'X').length >= 3) {
    m.conv--; m.pressed = true;
    for (const d of S.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd);
  }

  if (brainName === 'random') {
    const opts = [];
    m.hand.forEach((ix, h) => {
      opts.push({ k: 'free', h });
      if (coopChooseDie(S, m, PRESETS[m.presetName].cards[ix])) opts.push({ k: 'paid', h });
    });
    if (!opts.length) { m.paidDone = true; return true; }
    const a = pick(opts, S.rnd);
    return coopExec(S, i, a);
  }

  // greedy & smart: score one card action
  const need = m.links === 0 ? null : CYCLE[m.chainPos];
  const unpaidOthers = S.party.filter((x, j) => j !== i && !x.paidDone).length;
  let best = null;
  m.hand.forEach((ix, h) => {
    const c = PRESETS[m.presetName].cards[ix];
    const die = coopChooseDie(S, m, c);
    // paid option
    if (die && !(c.t === 'RITE' && m.rite) && !(c.t === 'ENCH' && m.ench.length >= 3)) {
      let score = c.v + (c.t === 'ENCH' || c.t === 'RITE' ? 2 : 0) + 1;
      if (brainName === 'smart') {
        if (c.col === 'R' || c.col === 'B' || c.col === 'P') {
          if (need === null) score += 1; else if (c.col === need) score += 3;
          else if (!m.chainShield) score -= (m.presetName === 'TORRENT' ? 4 : 1.5);
        }
        if (c.nm === 'Fever Logic' && S.e.blight < 2) score -= 3;
        if (c.nm === 'Rupture' && S.e.blight < 4) score -= 3;
        if (c.nm === 'Turnabout' && Math.max(0, ...S.e.queue.map(q => q.st)) < 2) score -= 3;
        if (c.nm === 'The Long Con' && S.e.fired.length < 2) score -= 3;
        if (c.nm === 'The Anvil Speaks' && m.thorns < 2) score -= 2;
        if (c.nm === 'White Heat' && !m.temps.some(usable)) score -= 6;
        // stall the pay if others still owe theirs and hand is rich in frees
        if (!m.paidDone && unpaidOthers > 0 && m.hand.length > 3) score -= 0.8;
      }
      if (!best || score > best.score) best = { k: 'paid', h, score };
    }
    // free option
    let fscore = 1.2;
    if (c.t === 'ENCH' || c.t === 'RITE') fscore -= 0.6;
    const partyThreat = COOP_ALLY && S.e.queue.some(q => ENEMY_CARDS[q.nm].kind === 'attack');
    if (brainName === 'smart' && (incoming > 0 || partyThreat) && (c.free + '').includes('guard')) fscore += 1;
    if (!best || fscore > best.score) best = { k: 'free', h, score: fscore };
  });
  if (!best) { m.paidDone = true; return true; } // nothing playable: forfeit the pay
  return coopExec(S, i, best);
}

function coopExec(S, i, a) {
  const m = S.party[i];
  const ix = m.hand[a.h];
  const c = PRESETS[m.presetName].cards[ix];
  if (a.k === 'free') {
    m.hand.splice(a.h, 1);
    S._curseIx = ix;
    const armed = m.surge > 0;
    c.free(coopVerbs(S, i), {});
    if (c.t !== 'CURSE') m.discard.push(ix);
    if (armed) { m.surge--; coopChain(S, i, null, true); }
    return false;
  }
  const die = coopChooseDie(S, m, c);
  if (!die) return false;
  m.hand.splice(a.h, 1);
  S._curseIx = ix;
  const echoTwice = die.echoed;
  const personal = m.temps.includes(die);
  if (die.face === 'S') m.conv += 2;
  if (personal) m.temps.splice(m.temps.indexOf(die), 1);
  else { S.dice.splice(S.dice.indexOf(die), 1); m.paidDone = true; }
  if (c.col === 'R' || c.col === 'B' || c.col === 'P') coopChain(S, i, c.col, false);
  if (c.t === 'ENCH') { if (m.ench.length < 3) m.ench.push(c.ench); else m.discard.push(ix); return !personal; }
  if (c.t === 'RITE') { if (!m.rite) m.rite = { trigger: c.rite.trigger, threshold: c.rite.threshold, payoff: c.rite.payoff, charges: 0 }; else m.discard.push(ix); return !personal; }
  const E = coopVerbs(S, i);
  c.paid(E, {});
  if (echoTwice) c.paid(E, {});
  if (c.t !== 'CURSE') m.discard.push(ix);
  return !personal;
}

function coopEnemyTurn(S, T) {
  for (const m of S.party) for (let k = m.ench.filter(e => e === 'blight1').length; k > 0; k--) S.e.blight = Math.min(BLIGHT_MAX, S.e.blight + 1); // Lingering Cough
  for (let t = 0; t < T && !S.over; t++) {
    if (S.e.skip) { S.e.skip = false; coopRefill(S); continue; }
    const q = S.e.queue.shift();
    if (q) {
      const card = ENEMY_CARDS[q.nm];
      const power = effQ(q);
      if (power <= 0) S.e.discard.push(q.nm);
      else {
        const bonus = S.e.enraged && card.kind === 'attack' ? 1 : 0;
        if (card.kind === 'attack') { for (let h = 0; h < card.hits; h++) { coopHurtMember(S, q.target, power + bonus, true); if (S.over) return; } }
        else if (card.kind === 'guard') S.e.guard += power;
        else if (card.kind === 'thorns') S.e.thorns = Math.min(3, S.e.thorns + power);
        else if (card.kind === 'molt') { S.e.blight = Math.max(0, S.e.blight - 2); S.e.hp = Math.min(S.e.maxhp, S.e.hp + power); }
        S.e.discard.push(q.nm);
      }
    }
    if (S.e.lastStag === q) S.e.lastStag = null;
    coopRefill(S);
  }
  // blight ticks once per enemy TURN, not per action
  if (S.e.blight > 0) {
    coopHurtEnemy(S, S.e.blight, false);
    S.e.blight--;
    for (let i = 0; i < S.party.length; i++) if (S.party[i].rite && S.party[i].rite.trigger === 'blightTick') coopRite(S, i);
  }
}

function coopGame(partyPresets, enemyName, recipe, T, hpMult, brainName, seed) {
  const rnd = mulberry32(seed);
  const spec = ENEMIES[enemyName];
  const tiers = JSON.parse(JSON.stringify(spec.tiers));
  if (recipe === 'easy') spec.easy(tiers);
  if (recipe === 'hard') spec.hard(tiers);
  const edeck = [];
  for (const key of ['A', 'P', 'F']) {
    const tier = [];
    for (const [nm, n] of tiers[key]) for (let i = 0; i < n; i++) tier.push(nm);
    edeck.push(...shuffled(tier, rnd));
  }
  const S = {
    rnd, round: 0, over: null, dice: [],
    party: partyPresets.map(p => mkFighter(p, 30, SIG_PICKS[p])),
    e: {
      hp: Math.round(spec.hp * hpMult), maxhp: Math.round(spec.hp * hpMult),
      deck: edeck, discard: [], fired: [], queue: [], qsize: COOP_FULLTEL ? T : 1,
      lastStag: null, guard: 0, thorns: 0, blight: 0, enraged: false, skip: false,
      doubt: 0, known: 0, nextTarget: 0,
    },
  };
  for (const m of S.party) m.deck = shuffled(m.deck, rnd);
  coopRefill(S);
  while (!S.over && S.round < 40) {
    S.round++;
    for (const m of S.party) {
      m.paidDone = false; m.pressed = false; m.sigUsedTurn = false; m.chainShield = false;
      while (m.hand.length < 5) { const b = m.hand.length; coopDraw(S, S.party.indexOf(m)); if (m.hand.length === b) break; }
    }
    S.dice = ['R', 'B', 'P', 'G'].map(c => ({ color: c, face: rollFace(c, rnd) }));
    for (const m of S.party) for (let k = m.ench.filter(e => e === 'anneal').length; k > 0; k--) { const x = S.dice.find(d => d.face === 'X'); if (x) x.face = 'M'; }
    let turn = 0, guardCap = 80;
    while (!S.over && guardCap-- > 0) {
      const i = turn % S.party.length;
      coopMemberTurn(S, i, brainName);
      turn++;
      if (S.party.every(m => m.paidDone)) break;
      if (S.party.every(m => m.hand.length === 0)) { S.party.forEach(m => { m.paidDone = true; }); break; }
    }
    if (S.over) break;
    coopEnemyTurn(S, T);
    if (S.over) break;
    for (const m of S.party) { m.guard = 0; m.temps = m.temps.filter(t => !t.kindled); }
  }
  if (!S.over) S.over = 'stall';
  return S;
}

// ------------------------------------------------------------------ runner
const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const has = name => args.includes('--' + name);

if (has('assumptions')) {
  console.log('RULES CALLS THE SIM HAD TO MAKE (each one is a rulebook gap):\n');
  ASSUMPTIONS.forEach((a, i) => console.log(`${String(i + 1).padStart(2)}. ${a}`));
  process.exit(0);
}

const GAMES = parseInt(flag('games') || '300', 10);
const SEED0 = parseInt(flag('seed') || '20260722', 10);
const onlyPreset = flag('preset');
const onlyEnemy = flag('enemy');
const onlyBrain = flag('brain');
const onlyRecipe = flag('recipe');

const presets = onlyPreset ? [onlyPreset.toUpperCase()] : Object.keys(PRESETS);
const enemies = onlyEnemy ? [onlyEnemy.toUpperCase()] : Object.keys(ENEMIES);
const brains = onlyBrain ? [onlyBrain.toLowerCase()] : ['random', 'greedy', 'smart'];
const recipes = onlyRecipe ? [onlyRecipe.toLowerCase()] : ['easy', 'std', 'hard'];

// --------------------------------------------------------------- Co-op runner
if (has('coop')) {
  const brain = (onlyBrain || 'smart').toLowerCase();
  const t0c = Date.now();
  const allPresets = Object.keys(PRESETS);
  const enemyList = Object.keys(ENEMIES);
  const sampleParty = (n, rnd) => shuffled(allPresets, rnd).slice(0, n);

  const pinP = flag('players'), pinT = flag('actions'), pinH = flag('hpmult');
  const playerCounts = pinP ? [parseInt(pinP, 10)] : [2, 3, 4];

  // --dials: pin the calibration point (T = P−1, HP ×P) and sweep the two rescue
  // dials — ally targeting and token caps — hunting the 75–100% win band.
  if (has('dials')) {
    const TOFF = has('tp') ? 0 : 1; // default T = P−1; --tp pins T = P
    COOP_FULLTEL = has('fulltel');  // reveal ALL T enemy cards before the player round
    const CONFIGS = [
      { label: 'A base (no dials, caps 6/3)', ally: false, bl: 6, th: 3 },
      { label: 'B ally targeting, caps 6/3', ally: true, bl: 6, th: 3 },
      { label: 'C ally + caps 8/4', ally: true, bl: 8, th: 4 },
      { label: 'D ally + caps 10/5', ally: true, bl: 10, th: 5 },
      { label: 'E ally + caps uncapped', ally: true, bl: 99, th: 99 },
      { label: 'F caps 10/5 only (no ally)', ally: false, bl: 10, th: 5 },
    ];
    console.log(`\nCO-OP DIAL EXPERIMENT — pinned at T = P${TOFF ? '−1' : ''}, HP = solo × P · telegraphs: ${COOP_FULLTEL ? 'ALL T face-up' : 'first only'} · brain: ${brain} · ${GAMES} games/cell · unique decks`);
    console.log('Dial 1: cards may target other players (GUARD/THORNS to whoever the telegraph aims at, HEAL to lowest).');
    console.log('Dial 2: token caps (BLIGHT/THORNS max).\n');
    console.log(['CONFIG'.padEnd(32), ...playerCounts.map(P => `${P}P (T=${Math.max(1, P - TOFF)},×${P})`.padStart(15))].join(''));
    for (const cfg of CONFIGS) {
      const row = [cfg.label.padEnd(32)];
      for (const P of playerCounts) {
        COOP_ALLY = cfg.ally; BLIGHT_MAX = cfg.bl; THORNS_MAX = cfg.th;
        let wins = 0, rounds = 0;
        for (let g = 0; g < GAMES; g++) {
          const rnd = mulberry32(SEED0 + g * 104729 + P * 31);
          const party = sampleParty(P, rnd);
          const enemy = enemyList[Math.floor(rnd() * enemyList.length)];
          const S = coopGame(party, enemy, 'std', Math.max(1, P - TOFF), P, brain, SEED0 + g * 7919);
          if (S.over === 'win') wins++;
          rounds += S.round;
        }
        row.push(`${(100 * wins / GAMES).toFixed(0)}%·${(rounds / GAMES).toFixed(0)}r`.padStart(15));
      }
      console.log(row.join(''));
    }
    COOP_ALLY = false; BLIGHT_MAX = 6; THORNS_MAX = 3;
    console.log('\nReading: A is the undialed baseline. B−A = ally-targeting lift. F−A = caps-only lift. C/D/E = combined.');
    console.log(`${((Date.now() - t0c) / 1000).toFixed(1)}s`);
    process.exit(0);
  }

  console.log(`\nCO-OP EXPERIMENT — shared 4-die pool, 1 paid play each per round · brain: ${brain} · ${GAMES} games/cell`);
  console.log('Cell = party win% · avg rounds. Party & enemy randomized per game (std recipe).');
  console.log('Hypothesis under test: enemy actions = player count, HP = solo × player count.\n');

  for (const P of playerCounts) {
    const hpMults = pinH ? [parseFloat(pinH)] : (P === 2 ? [1, 1.5, 2, 3] : P === 3 ? [1, 2, 3, 4] : [1, 2, 4, 6]);
    const actionList = pinT ? [parseInt(pinT, 10)] : [...Array(Math.min(P + 1, 5)).keys()].slice(1);
    console.log(`---------- ${P} PLAYERS ----------`);
    console.log(['HP mult \\ T'.padEnd(12), ...actionList.map(a => `T=${a}`.padStart(11))].join(''));
    for (const hm of hpMults) {
      const row = [`×${hm}`.padEnd(12)];
      for (const T of actionList) {
        let wins = 0, rounds = 0, stalls = 0;
        for (let g = 0; g < GAMES; g++) {
          const rnd = mulberry32(SEED0 + g * 104729 + P * 31 + T * 7 + Math.round(hm * 13));
          const party = sampleParty(P, rnd);
          const enemy = enemyList[Math.floor(rnd() * enemyList.length)];
          const S = coopGame(party, enemy, 'std', T, hm, brain, SEED0 + g * 7919);
          if (S.over === 'win') wins++; else if (S.over === 'stall') stalls++;
          rounds += S.round;
        }
        row.push(`${(100 * wins / GAMES).toFixed(0)}%·${(rounds / GAMES).toFixed(0)}r`.padStart(11));
      }
      console.log(row.join(''));
    }
    console.log('');
  }
  console.log('COOP NOTES:');
  COOP_NOTES.forEach((n, i) => console.log(`${i + 1}. ${n}`));
  console.log(`\n${((Date.now() - t0c) / 1000).toFixed(1)}s`);
  process.exit(0);
}

// ---------------------------------------------------------------- PvP runner
if (has('pvp')) {
  const brain = (onlyBrain || 'smart').toLowerCase();
  const t0p = Date.now();

  // HP calibration: sweep until mean game length lands in the 15-20 round window
  // (or use --hp N to pin it and skip the sweep).
  const pinned = flag('hp');
  if (pinned) PVP_HP = parseInt(pinned, 10);
  else {
    console.log('\nHP SWEEP — mean rounds across all 49 pairings (60 games/pair), draw% at the 60-round cap:');
    const candidates = [30, 45, 60, 80, 100, 120, 150];
    let best = null;
    for (const hp of candidates) {
      PVP_HP = hp;
      let rounds = 0, draws = 0, n = 0;
      for (const A of presets) for (const B of presets) for (let g = 0; g < 60; g++) {
        const S = pvpGame(A, B, brain, SEED0 + g * 7919);
        rounds += S.round; if (S.over === 'draw') draws++; n++;
      }
      const mean = rounds / n;
      console.log(`  HP ${String(hp).padStart(3)}: mean ${mean.toFixed(1)} rounds · draws ${(100 * draws / n).toFixed(0)}%`);
      const dist = Math.abs(mean - 17.5);
      if (!best || dist < best.dist) best = { hp, mean, dist };
    }
    PVP_HP = best.hp;
    console.log(`  → calibrated: HP ${best.hp} (mean ${best.mean.toFixed(1)} rounds). Full matrix below runs at this HP.\n`);
  }

  const M = {};
  for (const A of presets) for (const B of presets) {
    let w1 = 0, w2 = 0, dr = 0, rounds = 0;
    for (let g = 0; g < GAMES; g++) {
      const S = pvpGame(A, B, brain, SEED0 + g * 7919);
      if (S.over === 'p1') w1++; else if (S.over === 'p2') w2++; else dr++;
      rounds += S.round;
    }
    M[[A, B]] = { w1: w1 / GAMES, w2: w2 / GAMES, dr: dr / GAMES, rounds: rounds / GAMES };
  }
  const pcp = x => (100 * x).toFixed(0).padStart(4);
  console.log(`\nPVP EXPERIMENT — shared 4-die pool, 1 shared die each, HP ${PVP_HP}, PvP sig loadouts · brain: ${brain} · ${GAMES} games/pair · ${((Date.now() - t0p) / 1000).toFixed(1)}s`);
  console.log('Cell = row preset (P1, acts first) win% vs column preset. Diagonal >50% = first-mover advantage.\n');
  console.log(['P1 \\ P2'.padEnd(11), ...presets.map(p => p.slice(0, 6).padStart(7))].join(''));
  for (const A of presets)
    console.log([A.padEnd(11), ...presets.map(B => pcp(M[[A, B]].w1).padStart(7))].join(''));
  console.log('\nDraw% (30-round cap) and avg rounds:');
  console.log(['P1 \\ P2'.padEnd(11), ...presets.map(p => p.slice(0, 6).padStart(9))].join(''));
  for (const A of presets)
    console.log([A.padEnd(11), ...presets.map(B => `${pcp(M[[A, B]].dr)}·${M[[A, B]].rounds.toFixed(0).padStart(2)}`.padStart(9))].join(''));
  // aggregate strength: avg win% as P1 and as P2
  console.log('\nOverall strength (avg win% across all opponents, as P1 / as P2 / first-mover edge in the mirror):');
  for (const A of presets) {
    const asP1 = presets.reduce((s, B) => s + M[[A, B]].w1, 0) / presets.length;
    const asP2 = presets.reduce((s, B) => s + M[[B, A]].w2, 0) / presets.length;
    console.log(`${A.padEnd(11)} P1 ${pcp(asP1)}%   P2 ${pcp(asP2)}%   mirror P1-edge ${pcp(M[[A, A]].w1)}% vs ${pcp(M[[A, A]].w2)}%`);
  }
  console.log('\nPVP NOTES (what this mode does to the mechanics):');
  PVP_NOTES.forEach((n, i) => console.log(`${i + 1}. ${n}`));
  process.exit(0);
}

const t0 = Date.now();
const results = {};
for (const brain of brains) for (const preset of presets) for (const enemy of enemies) for (const recipe of recipes) {
  let wins = 0, losses = 0, stalls = 0, rounds = 0, vitae = 0, bursts = 0, sigs = 0, conv = 0, press = 0, hex = 0, freeP = 0, paidP = 0, disc = 0;
  for (let g = 0; g < GAMES; g++) {
    const S = gameLoop(preset, enemy, recipe, brain, SEED0 + g * 7919);
    if (S.over === 'win') { wins++; vitae += S.p.hp; }
    else if (S.over === 'loss') losses++;
    else stalls++;
    rounds += S.round; bursts += S.stats.bursts; sigs += S.stats.sigFires;
    conv += S.stats.convEarned; press += S.stats.pressFates; hex += S.stats.hexFired;
    freeP += S.stats.freePlays; paidP += S.stats.paidPlays; disc += S.stats.discardsForConv;
  }
  results[[brain, preset, enemy, recipe]] = {
    win: wins / GAMES, stall: stalls / GAMES, rounds: rounds / GAMES,
    vitae: wins ? vitae / wins : 0, bursts: bursts / GAMES, sigs: sigs / GAMES,
    conv: conv / GAMES, press: press / GAMES, hex: hex / GAMES,
    freeP: freeP / GAMES, paidP: paidP / GAMES, disc: disc / GAMES,
  };
}

// ------------------------------------------------------------------ report
const pc = x => (100 * x).toFixed(0).padStart(3) + '%';
const f1 = x => x.toFixed(1);

console.log(`\nAXIOMANCER TABLE EDITION — batch sim · ${GAMES} games/cell · seed ${SEED0} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`presets: ${presets.join(', ')} · enemies: ${enemies.join(', ')} · brains: ${brains.join(', ')}\n`);

for (const brain of brains) {
  console.log(`==================== BRAIN: ${brain.toUpperCase()} ====================`);
  const header = ['PRESET'.padEnd(11)];
  for (const e of enemies) for (const r of recipes) header.push(`${e.slice(0, 5)}·${r.slice(0, 1).toUpperCase()}`.padStart(8));
  console.log(header.join(''));
  for (const p of presets) {
    const row = [p.padEnd(11)];
    for (const e of enemies) for (const r of recipes) row.push(pc(results[[brain, p, e, r]].win).padStart(8));
    console.log(row.join(''));
  }
  console.log('');
}

if (recipes.includes('std')) {
  console.log('==================== STANDARD-RECIPE DETAIL (smartest brain available) ====================');
  const brain = brains.includes('smart') ? 'smart' : brains[brains.length - 1];
  console.log(`brain: ${brain}`);
  console.log(['PRESET'.padEnd(11), 'ENEMY'.padEnd(10), 'WIN'.padStart(5), 'STALL'.padStart(6), 'ROUNDS'.padStart(7), 'VITAE'.padStart(6), 'BURSTS'.padStart(7), 'SIGS'.padStart(5), '◆EARN'.padStart(6), 'PRESS'.padStart(6), 'HEX'.padStart(4), 'FREE'.padStart(5), 'PAID'.padStart(5)].join(' '));
  for (const p of presets) for (const e of enemies) {
    const s = results[[brain, p, e, 'std']];
    console.log([p.padEnd(11), e.padEnd(10), pc(s.win).padStart(5), pc(s.stall).padStart(6), f1(s.rounds).padStart(7), f1(s.vitae).padStart(6), f1(s.bursts).padStart(7), f1(s.sigs).padStart(5), f1(s.conv).padStart(6), f1(s.press).padStart(6), f1(s.hex).padStart(4), f1(s.freeP).padStart(5), f1(s.paidP).padStart(5)].join(' '));
  }
  console.log('');
}

if (brains.length > 1 && recipes.includes('std')) {
  console.log('==================== SKILL GRADIENT (win% std recipe: random → smart) ====================');
  console.log('How much the pilot matters = how intense the rulebook/teach needs to be.\n');
  for (const p of presets) {
    const cells = enemies.map(e => {
      const r0 = results[[brains[0], p, e, 'std']].win;
      const r2 = results[[brains[brains.length - 1], p, e, 'std']].win;
      return `${e.slice(0, 5)}: ${pc(r0)}→${pc(r2)}`;
    });
    console.log(`${p.padEnd(11)} ${cells.join('   ')}`);
  }
  console.log('');
}

if (recipes.length === 3) {
  console.log('==================== RECIPE SPREAD (best brain, win% easy/std/hard) — §6\'s primary hypothesis ====================');
  const brain = brains.includes('smart') ? 'smart' : brains[brains.length - 1];
  for (const p of presets) {
    const cells = enemies.map(e =>
      `${e.slice(0, 5)}: ${['easy', 'std', 'hard'].map(r => pc(results[[brain, p, e, r]].win)).join('/')}`);
    console.log(`${p.padEnd(11)} ${cells.join('   ')}`);
  }
  console.log('');
}

console.log('Run with --assumptions to see the rules calls the sim had to make (rulebook gaps).');
console.log('Numbers are lower bounds on deck strength: the "smart" brain is a heuristic, not an oracle.');
