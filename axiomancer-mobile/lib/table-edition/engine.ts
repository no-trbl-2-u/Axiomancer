// ============================================================================
// Axiomancer: TABLE EDITION — solo engine (VOID / branch-only MVP)
// ----------------------------------------------------------------------------
// Direct TypeScript port of table-edition-sim.mjs (repo root, v3.1 library,
// 2026-07-22) restructured for interactive play. The batch entry points
// (runGame / BRAINS) keep the sim's exact RNG call order so the parity test
// can hold this port to the simulator's measured numbers.
//
// v3.1 content: COVENANT (the ally deck, starts with 2 befriended allies),
// THE BROODMOTHER (minion enemy — brood are deck cards), minions for the
// classic three (optional), allies + RALLY, Common Ground (PROGRESS → Accord).
// Owner rulings: NO cap on minions or allies; phase = the telegraph's printed
// tier (Last Stand locks FURY); minion reveal IS the enemy's whole action;
// minions take direct damage only; forced discards give no ◆; an ally absorbs
// one ENTIRE strike then is exiled.
//
// This is the PHYSICAL game's ruleset — deliberately NOT the @mechanics
// engine. It lives here, self-contained, so deleting lib/table-edition/ and
// app/table-edition/ removes the whole experiment.
// ============================================================================

// ---------------------------------------------------------------------- RNG
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffled = <T,>(arr: T[], rnd: () => number): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pickOne = <T,>(arr: T[], rnd: () => number): T => arr[Math.floor(rnd() * arr.length)];

// --------------------------------------------------------------------- dice
export type Color = 'R' | 'B' | 'P' | 'G';
export type Face = 'S' | 'M' | 'X';
export interface Die {
  color: Color;
  face: Face;
  temp?: boolean; // Surge Burst gold die — persists until spent
  kindled?: boolean; // KINDLE die — expires at end of turn
  echoed?: boolean; // Half-Step push succeeded — paid play fires twice
}
const rollFace = (color: Color, rnd: () => number): Face => {
  const r = Math.floor(rnd() * 6) + 1;
  return color === 'G' ? (r === 1 ? 'S' : r === 2 ? 'M' : 'X') : r === 1 ? 'S' : r <= 3 ? 'M' : 'X';
};
export const dieUsable = (d: Die): boolean => d.face === 'S' || d.face === 'M';

// --------------------------------------------------------------- card data
export const CYCLE: Record<string, Color> = { P: 'R', R: 'B', B: 'P' }; // HEART -> BODY -> MIND -> HEART

export type CardType = 'SPELL' | 'ENCH' | 'RITE' | 'CURSE' | 'ALLY';
export type CardColor = Color | 'A'; // 'A' = ally, payable by ANY die
export type EnchKind =
  | 'archive'
  | 'blight1'
  | 'guardPersists'
  | 'anneal'
  | 'forge'
  | 'wave'
  | 'sigDiscount'
  | 'ledger'
  | 'hostBanner'
  | 'longTable';
export type RiteTrigger = 'blightTick' | 'fullAbsorb' | 'burst' | 'sigUse' | 'turnStart';

export interface EffectCtx {
  brain?: BrainName;
  dieFace?: Face;
}
export interface CardDef {
  nm: string;
  n: number;
  col: CardColor;
  t: CardType;
  v: number;
  free: (E: Verbs, ctx?: EffectCtx) => void;
  paid?: (E: Verbs, ctx?: EffectCtx) => void;
  ench?: EnchKind;
  rite?: { trigger: RiteTrigger; threshold: number; payoff: (E: Verbs, charges: number, ctx?: EffectCtx) => void };
  curse?: (E: Verbs) => void;
  // Printed text (from the v2 print kit) for the mobile card face.
  freeText: string;
  paidText: string;
  payload?: string; // curse when-drawn text
}

export type PresetName =
  | 'STANDSTILL'
  | 'CONTAGION'
  | 'BASTION'
  | 'FOUNDRY'
  | 'TORRENT'
  | 'INVOCATION'
  | 'MALISON'
  | 'COVENANT';

export const PRESETS: Record<PresetName, { stance: Color; cards: CardDef[] }> = {
  STANDSTILL: {
    stance: 'B',
    cards: [
      { nm: 'Point of Order', n: 4, col: 'B', t: 'SPELL', v: 2, free: (E) => E.draw(1), paid: (E) => { E.stagger(1); E.draw(1); }, freeText: 'DRAW 1', paidText: 'STAGGER 1, DRAW 1.' },
      { nm: 'Cold Reading', n: 4, col: 'P', t: 'SPELL', v: 1, free: (E) => E.scry(2), paid: (E) => { E.scry(3); E.draw(1); }, freeText: 'SCRY 2', paidText: 'SCRY 3, DRAW 1.' },
      { nm: 'Hold That Thought', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.guard(2), paid: (E) => { E.guard(2); E.stagger(1); }, freeText: 'GUARD 2', paidText: 'GUARD 2, STAGGER 1.' },
      { nm: 'Motion to Suppress', n: 3, col: 'B', t: 'SPELL', v: 3, free: (E) => E.stagger(1), paid: (E) => { E.stagger(2); if (E.telegraphFizzled()) E.draw(2); }, freeText: 'STAGGER 1', paidText: 'STAGGER 2. If the telegraph fizzles, DRAW 2.' },
      { nm: 'The Deep File', n: 3, col: 'P', t: 'ENCH', v: 3, ench: 'archive', free: (E) => E.scry(1), freeText: 'SCRY 1', paidText: 'ENCHANT — at the start of the round, SCRY 1. Whenever you SCRY, bottom one card you saw: deal 1 damage.' },
      { nm: 'Dead Air', n: 1, col: 'G', t: 'SPELL', v: 4, free: (E) => E.stagger(1), paid: (E) => { E.stagger(3); if (E.telegraphFizzled()) E.dmg(3); }, freeText: 'STAGGER 1', paidText: 'STAGGER 3. If the telegraph is at 0, deal 3 damage.' },
      { nm: 'Turnabout', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.draw(1), paid: (E) => E.turnabout(), freeText: 'DRAW 1', paidText: 'Deal 2 damage per Stagger token on the telegraph, then remove them.' },
    ],
  },
  CONTAGION: {
    stance: 'R',
    cards: [
      { nm: 'First Symptom', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.blight(1), paid: (E) => E.blight(2), freeText: 'BLIGHT 1', paidText: 'BLIGHT 2.' },
      { nm: 'Poisoned Well', n: 4, col: 'B', t: 'SPELL', v: 3, free: (E) => E.blight(1), paid: (E) => E.blight(3), freeText: 'BLIGHT 1', paidText: 'BLIGHT 3.' },
      { nm: 'Bad Air', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.blight(1), paid: (E) => { E.blight(2); E.draw(1); }, freeText: 'BLIGHT 1', paidText: 'BLIGHT 2, DRAW 1.' },
      { nm: 'Fever Logic', n: 3, col: 'B', t: 'SPELL', v: 4, free: (E) => E.blight(1), paid: (E) => E.doubleBlight(), freeText: 'BLIGHT 1', paidText: "Double the enemy's BLIGHT (max 6)." },
      { nm: 'Lingering Cough', n: 3, col: 'R', t: 'ENCH', v: 2, ench: 'blight1', free: (E) => E.blight(1), freeText: 'BLIGHT 1', paidText: 'ENCHANT — at the start of the enemy turn, BLIGHT 1.' },
      { nm: 'Rupture', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.blight(2), paid: (E) => E.rupture(), freeText: 'BLIGHT 2', paidText: 'RUPTURE — remove all enemy Blight: deal 2 damage each.' },
      { nm: 'Terminal Diagnosis', n: 1, col: 'G', t: 'RITE', v: 4, rite: { trigger: 'blightTick', threshold: 4, payoff: (E, ch) => E.dmg(3 * ch) }, free: (E) => E.blight(1), freeText: 'BLIGHT 1', paidText: 'RITE — +1 Charge whenever Blight ticks. Sacrifice at 4: deal 3 damage per Charge.' },
    ],
  },
  BASTION: {
    stance: 'R',
    cards: [
      { nm: 'Raised Shield', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.guard(2), paid: (E) => E.guard(4), freeText: 'GUARD 2', paidText: 'GUARD 4.' },
      { nm: 'Nettle Cloak', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.thorns(1), paid: (E) => { E.thorns(1); E.guard(2); }, freeText: 'THORNS 1', paidText: 'THORNS 1, GUARD 2.' },
      { nm: 'Measured Answer', n: 4, col: 'B', t: 'SPELL', v: 2, free: (E) => E.draw(1), paid: (E) => { E.guard(3); E.draw(1); }, freeText: 'DRAW 1', paidText: 'GUARD 3, DRAW 1.' },
      { nm: 'The Adamant Wall', n: 3, col: 'R', t: 'ENCH', v: 3, ench: 'guardPersists', free: (E) => E.guard(2), freeText: 'GUARD 2', paidText: 'ENCHANT — your GUARD persists (no round-end fade).' },
      { nm: 'Pebble in the Boot', n: 3, col: 'P', t: 'SPELL', v: 2, free: (E) => E.blight(1), paid: (E) => { E.thorns(1); E.blight(1); }, freeText: 'BLIGHT 1', paidText: 'THORNS 1, BLIGHT 1.' },
      { nm: 'The Anvil Speaks', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.thorns(1), paid: (E) => E.anvil(), freeText: 'THORNS 1', paidText: 'Deal 2 damage per Thorns you have. ECHO this if you have 3 Thorns.' },
      { nm: 'Unbroken', n: 1, col: 'G', t: 'RITE', v: 3, rite: { trigger: 'fullAbsorb', threshold: 3, payoff: (E) => { E.guard(6, true); E.thorns(2); } }, free: (E) => E.guard(2), freeText: 'GUARD 2', paidText: 'RITE — +1 Charge when Guard fully absorbs a hit. Sacrifice at 3: GUARD 6 (persists), THORNS 2.' },
    ],
  },
  FOUNDRY: {
    stance: 'R',
    cards: [
      { nm: 'Tempered Edge', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.temper(1), paid: (E) => E.temper(2), freeText: 'TEMPER 1', paidText: 'TEMPER 2.' },
      { nm: 'Stoke', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.temper(1), paid: (E) => E.rerollMisses(), freeText: 'TEMPER 1', paidText: 'Reroll any of your unspent MISS dice.' },
      { nm: 'Sparks', n: 4, col: 'B', t: 'SPELL', v: 2, free: (E) => E.kindle(), paid: (E) => { E.kindle(); E.temper(1); }, freeText: 'KINDLE 1', paidText: 'KINDLE 1, then TEMPER 1.' },
      { nm: 'Half-Step', n: 3, col: 'P', t: 'SPELL', v: 3, free: (E) => E.temper(1), paid: (E) => { E.temper(2); E.halfStepPush(); }, freeText: 'TEMPER 1', paidText: 'TEMPER 2. Push a SPECIAL: reroll it — survive and its play fires twice; MISS busts it.' },
      { nm: 'Annealing', n: 3, col: 'R', t: 'ENCH', v: 2, ench: 'anneal', free: (E) => E.temper(1), freeText: 'TEMPER 1', paidText: 'ENCHANT — at your turn start, upgrade one MISS to MANA.' },
      { nm: 'The Forge Eternal', n: 1, col: 'G', t: 'ENCH', v: 3, ench: 'forge', free: (E) => E.temper(1), freeText: 'TEMPER 1', paidText: 'ENCHANT — keep one unspent die between turns (as rolled).' },
      { nm: 'White Heat', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.temper(1), paid: (E, ctx) => E.dmg(ctx && ctx.dieFace === 'S' ? 6 : 4), freeText: 'TEMPER 1', paidText: 'Deal 4 damage — 6 if the die you paid with shows SPECIAL.' },
    ],
  },
  TORRENT: {
    stance: 'P',
    cards: [
      { nm: 'Rising Tide', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.surgeCharge(), paid: (E) => { E.draw(1); E.advanceChain(); }, freeText: 'SURGE 1', paidText: 'DRAW 1 and advance your chain 1 (any color).' },
      { nm: 'Undertow', n: 4, col: 'B', t: 'SPELL', v: 2, free: (E) => E.draw(1), paid: (E) => { E.draw(1); E.chainShield(); }, freeText: 'DRAW 1', paidText: 'DRAW 1. Your chain cannot break this turn.' },
      { nm: 'Breakwater', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.guard(2), paid: (E) => E.guard(2 + E.links()), freeText: 'GUARD 2', paidText: 'GUARD 2, +1 per link in your chain.' },
      { nm: 'Confluence', n: 3, col: 'P', t: 'SPELL', v: 3, free: (E) => E.surgeCharge(), paid: (E) => { const was = E.links(); E.advanceChain(); if (was === 2) E.draw(2); }, freeText: 'SURGE 1', paidText: 'Advance your chain 1 (any color); if that completes it, DRAW 2.' },
      { nm: 'Standing Wave', n: 3, col: 'B', t: 'ENCH', v: 3, ench: 'wave', free: (E) => E.surgeCharge(), freeText: 'SURGE 1', paidText: 'ENCHANT — your Surge Bursts deal 3 damage.' },
      { nm: 'Riptide', n: 1, col: 'G', t: 'SPELL', v: 4, free: (E) => E.surgeCharge(), paid: (E) => E.burstNow(), freeText: 'SURGE 1', paidText: 'Surge Burst now — complete your chain and collect the gold die.' },
      { nm: 'Maelstrom', n: 1, col: 'G', t: 'RITE', v: 4, rite: { trigger: 'burst', threshold: 4, payoff: (E, ch) => E.dmg(3 * ch) }, free: (E) => E.surgeCharge(), freeText: 'SURGE 1', paidText: 'RITE — +1 Charge each Surge Burst; Bursts deal damage equal to its Charges. Sacrifice at 4: deal 3 per Charge.' },
    ],
  },
  INVOCATION: {
    stance: 'P',
    cards: [
      { nm: 'Rehearsal', n: 4, col: 'B', t: 'SPELL', v: 1, free: (E) => E.attune(1), paid: (E) => E.attune(2), freeText: 'ATTUNE 1', paidText: 'ATTUNE 2.' },
      { nm: 'Call the Name', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.conviction(1), paid: (E) => { E.conviction(1); if (E.sigUsedThisTurn()) E.draw(2); }, freeText: '◆ +1', paidText: '◆ +1. If you used a Signature Skill this turn, DRAW 2.' },
      { nm: 'Litany', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.attune(1), paid: (E) => E.conviction(2), freeText: 'ATTUNE 1', paidText: '◆ +2.' },
      { nm: 'Second Voice', n: 3, col: 'P', t: 'SPELL', v: 3, free: (E) => E.attune(1), paid: (E) => E.echoNextSig(), freeText: 'ATTUNE 1', paidText: 'ECHO the next Signature Skill you use this turn.' },
      { nm: 'Standing Invocation', n: 3, col: 'B', t: 'ENCH', v: 3, ench: 'sigDiscount', free: (E) => E.attune(1), freeText: 'ATTUNE 1', paidText: 'ENCHANT — your Signature Skills cost 1 less ◆.' },
      { nm: 'The Word Made Act', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.conviction(1), paid: (E, ctx) => E.freeSig(ctx ?? {}), freeText: '◆ +1', paidText: 'Use a Signature Skill without paying its ◆ cost.' },
      { nm: 'Chorus of One', n: 1, col: 'G', t: 'RITE', v: 4, rite: { trigger: 'sigUse', threshold: 3, payoff: (E, _ch, ctx) => E.bothSigsFree(ctx ?? {}) }, free: (E) => E.attune(1), freeText: 'ATTUNE 1', paidText: 'RITE — +1 Charge each time you use a Signature Skill. Sacrifice at 3: use both your Signature Skills for free.' },
    ],
  },
  MALISON: {
    stance: 'B',
    cards: [
      { nm: 'Whispered Doubt', n: 4, col: 'B', t: 'CURSE', v: 2, curse: (E) => E.doubt(), free: (E) => E.hex(2), paid: (E) => E.hex(0), freeText: 'HEX 2 deep', paidText: 'HEX on top of the enemy deck instead.', payload: "When drawn: the enemy's reveal is discarded — it loses that action." },
      { nm: 'Hidden Barb', n: 4, col: 'R', t: 'CURSE', v: 2, curse: (E) => E.blight(2), free: (E) => E.hex(2), paid: (E) => E.hex(0), freeText: 'HEX 2 deep', paidText: 'HEX on top of the enemy deck instead.', payload: 'When drawn: BLIGHT 2 the enemy.' },
      { nm: 'Weight of Guilt', n: 4, col: 'P', t: 'CURSE', v: 2, curse: (E) => E.dmg(E.firedCount()), free: (E) => E.hex(2), paid: (E) => E.hex(0), freeText: 'HEX 2 deep', paidText: 'HEX on top of the enemy deck instead.', payload: 'When drawn: the enemy takes 1 damage per card in the fired-Curse pile.' },
      { nm: 'Contract of Ruin', n: 3, col: 'B', t: 'SPELL', v: 3, free: (E) => E.scry(2), paid: (E) => { E.scry(2); E.reclaim(2); }, freeText: 'SCRY 2', paidText: 'SCRY 2 the enemy deck. Return up to 2 fired Curses to your hand.' },
      { nm: 'The Ledger', n: 3, col: 'R', t: 'ENCH', v: 3, ench: 'ledger', free: (E) => E.draw(1), freeText: 'DRAW 1', paidText: 'ENCHANT — when one of your Curses fires, DRAW 1 and advance your chain 1 (any color).' },
      { nm: 'The Long Con', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.draw(1), paid: (E) => E.dmg(3 * E.firedCount()), freeText: 'DRAW 1', paidText: 'Deal 3 damage per card in the fired-Curse pile.' },
      { nm: 'Sealed Fate', n: 1, col: 'G', t: 'CURSE', v: 4, curse: (E) => { E.skipEnemyTurn(); E.dmg(3); }, free: (E) => E.hex(2), paid: (E) => E.hex(0), freeText: 'HEX 2 deep', paidText: 'HEX on top of the enemy deck instead.', payload: 'When drawn: the enemy skips this turn entirely and takes 3 damage.' },
    ],
  },
  COVENANT: {
    stance: 'P',
    cards: [
      { nm: 'Warm Welcome', n: 4, col: 'P', t: 'SPELL', v: 2, free: (E) => E.conviction(1), paid: (E) => { E.conviction(1); E.draw(1); }, freeText: '◆ +1', paidText: '◆ +1, DRAW 1.' },
      { nm: 'Letters of Passage', n: 4, col: 'B', t: 'SPELL', v: 2, free: (E) => E.draw(1), paid: (E) => { E.draw(2); if (E.hasAlly()) E.conviction(1); }, freeText: 'DRAW 1', paidText: 'DRAW 2. If you have an ally in play, ◆ +1.' },
      { nm: 'Shield of Guests', n: 4, col: 'R', t: 'SPELL', v: 2, free: (E) => E.guard(2), paid: (E) => { E.guard(3); E.rallyOne(); }, freeText: 'GUARD 2', paidText: 'GUARD 3. RALLY one ally.' },
      { nm: 'Banner of the Host', n: 3, col: 'B', t: 'ENCH', v: 3, ench: 'hostBanner', free: (E) => E.conviction(1), freeText: '◆ +1', paidText: 'ENCHANT — whenever an ally exhausts, ◆ +1.' },
      { nm: 'Muster', n: 3, col: 'P', t: 'SPELL', v: 3, free: (E) => E.attune(1), paid: (E) => { E.rallyAll(); E.draw(1); }, freeText: 'ATTUNE 1', paidText: 'RALLY all your allies. DRAW 1.' },
      { nm: 'The Open Door', n: 1, col: 'G', t: 'SPELL', v: 5, free: (E) => E.draw(1), paid: (E) => E.unexile(), freeText: 'DRAW 1', paidText: 'Return one exiled ally to play, refreshed.' },
      { nm: 'The Long Table', n: 1, col: 'G', t: 'ENCH', v: 4, ench: 'longTable', free: (E) => E.conviction(1), freeText: '◆ +1', paidText: 'ENCHANT — each round, one ally may EXHAUST twice.' },
    ],
  },
};

export interface SigDef {
  cost: number;
  fx: (E: Verbs) => void;
  text: string;
}
export const SIGS: Record<string, SigDef> = {
  Foresight: { cost: 3, fx: (E) => { E.scry(4); E.draw(1); }, text: 'SCRY 4, DRAW 1.' },
  'The Final Word': { cost: 6, fx: (E) => { E.fizzleTelegraph(); E.draw(2); }, text: 'STAGGER the telegraph to 0 — it fizzles. DRAW 2.' },
  'Ironclad Oath': { cost: 4, fx: (E) => E.guard(5, true), text: 'GUARD 5 (persists).' },
  'The Reckoning': { cost: 6, fx: (E) => E.ruptureAll(), text: 'RUPTURE all enemy Blight: deal 2 damage each.' },
  'Kindled Fury': { cost: 4, fx: (E) => { E.allMissesToMana(); E.kindle(); }, text: 'Upgrade all your MISSES to MANA, then KINDLE 1.' },
  Cataract: { cost: 5, fx: (E) => E.dmg(5), text: 'Deal 5 damage.' },
  Recant: { cost: 5, fx: (E) => E.reclaim(99), text: 'Return ALL fired Curses to your hand.' },
  'Common Ground': { cost: 5, fx: (E) => E.progressToken(), text: 'Place 1 PROGRESS. Enemy ends its turn with 3+: Accord — the fight ties; it may join you.' },
};
export const SIG_PICKS: Record<PresetName, string[]> = {
  STANDSTILL: ['Cataract', 'The Final Word'],
  CONTAGION: ['The Reckoning', 'Cataract'],
  BASTION: ['Ironclad Oath', 'Cataract'],
  FOUNDRY: ['Kindled Fury', 'Cataract'],
  TORRENT: ['Cataract', 'Kindled Fury'],
  INVOCATION: ['Cataract', 'Foresight'],
  MALISON: ['Recant', 'Cataract'],
  COVENANT: ['Cataract', 'Ironclad Oath'],
};

// -------------------------------------------------------------- enemy data
export type EnemyCardKind = 'attack' | 'guard' | 'thorns' | 'molt' | 'rest' | 'swarm' | 'goad';
export interface EnemyCardDef {
  kind: EnemyCardKind;
  base: number;
  hits?: number;
  text: string;
}
export const ENEMY_CARDS: Record<string, EnemyCardDef> = {
  Scratch: { kind: 'attack', base: 1, hits: 1, text: 'Attack 1.' },
  Flurry: { kind: 'attack', base: 1, hits: 3, text: 'Attack 1, three times.' },
  Vanish: { kind: 'guard', base: 3, text: 'GUARD 3 (persists).' },
  Frenzy: { kind: 'attack', base: 2, hits: 3, text: 'Attack 2, three times.' },
  Hunker: { kind: 'guard', base: 4, text: 'GUARD 4 (persists).' },
  Bristle: { kind: 'thorns', base: 1, text: 'It gains THORNS 1.' },
  Snap: { kind: 'attack', base: 3, hits: 1, text: 'Attack 3.' },
  Molt: { kind: 'molt', base: 3, text: 'It removes 2 of its Blight and HEALS 3.' },
  Crush: { kind: 'attack', base: 6, hits: 1, text: 'Attack 6.' },
  'Catch Breath': { kind: 'rest', base: 0, text: 'Nothing happens. It breathes.' },
  Sweep: { kind: 'attack', base: 2, hits: 2, text: 'Attack 2, twice.' },
  Heave: { kind: 'attack', base: 6, hits: 1, text: 'Attack 6.' },
  Rampage: { kind: 'attack', base: 4, hits: 2, text: 'Attack 4, twice.' },
  Sting: { kind: 'attack', base: 2, hits: 1, text: 'Attack 2.' },
  'Wax Ward': { kind: 'guard', base: 3, text: 'GUARD 3 (persists).' },
  Swarm: { kind: 'swarm', base: 2, text: 'Attack 2, once per minion she has in play. No minions: it fizzles.' },
  'Brood-Hymn': { kind: 'goad', base: 1, text: 'Every minion triggers its phase line again, right now.' },
};

export type EnemyName = 'SKULK' | 'SHELLBACK' | 'BRUTE' | 'BROODMOTHER';
export type Recipe = 'easy' | 'std' | 'hard';
type TierMap = Record<'A' | 'P' | 'F', [string, number][]>;
interface EnemySpec {
  hp: number;
  title: string;
  tiers: TierMap;
  easy: (t: TierMap) => void;
  hard: (t: TierMap) => void;
}
export const ENEMIES: Record<EnemyName, EnemySpec> = {
  SKULK: {
    hp: 22,
    title: 'THE SKULK',
    tiers: { A: [['Scratch', 5], ['Vanish', 2]], P: [['Flurry', 4], ['Scratch', 2], ['Vanish', 1]], F: [['Flurry', 3], ['Frenzy', 3]] },
    easy: (t) => { swap(t, 'Flurry', 'Scratch', 2); removeCard(t, 'Frenzy', 1); },
    hard: (t) => { swap(t, 'Scratch', 'Flurry', 2); swap(t, 'Vanish', 'Frenzy', 1); },
  },
  SHELLBACK: {
    hp: 28,
    title: 'THE SHELLBACK',
    tiers: { A: [['Hunker', 3], ['Bristle', 2], ['Snap', 2]], P: [['Snap', 3], ['Hunker', 2], ['Molt', 2]], F: [['Crush', 4], ['Snap', 2]] },
    easy: (t) => { swap(t, 'Crush', 'Snap', 2); removeCard(t, 'Molt', 1); },
    hard: (t) => { swap(t, 'Snap', 'Crush', 2); addCard(t, 'P', 'Molt', 1); },
  },
  BRUTE: {
    hp: 35,
    title: 'THE BRUTE',
    tiers: { A: [['Catch Breath', 4], ['Sweep', 3]], P: [['Heave', 4], ['Sweep', 2], ['Catch Breath', 1]], F: [['Rampage', 3], ['Heave', 3]] },
    easy: (t) => { swap(t, 'Heave', 'Catch Breath', 2); removeCard(t, 'Rampage', 1); },
    hard: (t) => { swap(t, 'Catch Breath', 'Sweep', 2); swap(t, 'Heave', 'Rampage', 1); },
  },
  // '@X' tier entries are her brood (MINIONS.BROODMOTHER[X]) — core to the deck.
  BROODMOTHER: {
    hp: 30,
    title: 'THE BROODMOTHER',
    tiers: {
      A: [['Sting', 3], ['Wax Ward', 2], ['@A', 2]],
      P: [['Swarm', 3], ['Sting', 2], ['@P', 2]],
      F: [['Brood-Hymn', 3], ['Swarm', 2], ['@F', 2]],
    },
    easy: (t) => { swap(t, 'Brood-Hymn', 'Sting', 1); removeCard(t, '@F', 1); },
    hard: (t) => { swap(t, 'Sting', 'Swarm', 2); addCard(t, 'A', '@A', 1); },
  },
};

// ------------------------------------------------------------- v3: minions
export interface MinionSpec {
  nm: string;
  hp: number;
  retaliateA?: boolean; // Shard of Shell: its attackers take 1 in APPROACH
  etb: (S: GameState) => void;
  fx: Record<'A' | 'P' | 'F', (S: GameState) => void>;
  etbText: string;
  lines: Record<'A' | 'P' | 'F', string>;
}
export interface MinionInstance {
  spec: MinionSpec;
  nm: string;
  hp: number;
  entry: EnemyDeckEntry;
  silenced?: boolean;
}
function mAtk(S: GameState, n: number, hits: number) {
  for (let h = 0; h < hits && !S.over; h++) hurtPlayer(S, n, true);
}
function forceDiscard(S: GameState) {
  if (S.p.hand.length) S.p.discard.push(S.p.hand.shift() as number); // no ◆
}
function healEnemy(S: GameState, n: number) {
  S.e.hp = Math.min(ENEMIES[S.enemyName].hp, S.e.hp + n);
}
export const MINIONS: Record<EnemyName, Record<'A' | 'P' | 'F', MinionSpec>> = {
  SKULK: {
    A: { nm: 'Skulk Whelp', hp: 2, etb: (S) => mAtk(S, 1, 1), fx: { A: (S) => mAtk(S, 1, 1), P: (S) => mAtk(S, 1, 2), F: (S) => mAtk(S, 2, 2) },
      etbText: 'Attack 1.', lines: { A: 'Attack 1.', P: 'Attack 1, twice.', F: 'Attack 2, twice.' } },
    P: { nm: 'Filch-Shade', hp: 3, etb: (S) => { S.p.conv = Math.max(0, S.p.conv - 1); }, fx: {
        A: (S) => { S.e.guard += 1; },
        P: (S) => { const d = S.p.dice.find(dieUsable); if (d) d.face = 'X'; },
        F: (S) => mAtk(S, 3, 1) },
      etbText: 'You lose 1◆.', lines: { A: 'The Skulk gains GUARD 1.', P: 'One of your unspent dice becomes a MISS.', F: 'Attack 3.' } },
    F: { nm: 'Night Chorus', hp: 2, etb: (S) => mAtk(S, 2, 1), fx: {
        A: (S) => { S.e.guard += 2; }, P: (S) => mAtk(S, 2, 1), F: (S) => { S.e.chorus = true; } },
      etbText: 'Attack 2.', lines: { A: 'The Skulk gains GUARD 2.', P: 'Attack 2.', F: "The Skulk's attacks get +1." } },
  },
  SHELLBACK: {
    A: { nm: 'Barnacle Cluster', hp: 4, etb: (S) => { S.e.guard += 2; }, fx: {
        A: (S) => { S.e.guard += 1; }, P: (S) => { S.e.guard += 2; }, F: (S) => { S.e.thorns = Math.min(3, S.e.thorns + 1); } },
      etbText: 'The Shellback gains GUARD 2.', lines: { A: 'It gains GUARD 1.', P: 'It gains GUARD 2.', F: 'It gains THORNS 1.' } },
    P: { nm: 'Molt-Tender', hp: 3, etb: (S) => { S.e.blight = Math.max(0, S.e.blight - 1); }, fx: {
        A: (S) => { S.e.blight = Math.max(0, S.e.blight - 1); },
        P: (S) => { S.e.blight = Math.max(0, S.e.blight - 1); healEnemy(S, 1); },
        F: (S) => healEnemy(S, 3) },
      etbText: 'Remove 1 of its Blight.', lines: { A: 'Remove 1 Blight.', P: 'Remove 1 Blight; it HEALS 1.', F: 'It HEALS 3.' } },
    F: { nm: 'Shard of Shell', hp: 5, retaliateA: true, etb: () => {}, fx: {
        A: () => {}, P: (S) => mAtk(S, 2, 1), F: (S) => mAtk(S, 4, 1) },
      etbText: 'Nothing. It stands.', lines: { A: 'Its attackers take 1.', P: 'Attack 2.', F: 'Attack 4.' } },
  },
  BRUTE: {
    A: { nm: 'Scavenger Rat', hp: 2, etb: (S) => mAtk(S, 1, 1), fx: {
        A: (S) => healEnemy(S, 1), P: (S) => mAtk(S, 1, 2), F: (S) => mAtk(S, 2, 2) },
      etbText: 'Attack 1.', lines: { A: 'The Brute HEALS 1.', P: 'Attack 1, twice.', F: 'Attack 2, twice.' } },
    P: { nm: 'Drumbeater', hp: 3, etb: (S) => { S.e.pbonus += 1; }, fx: {
        A: (S) => { S.e.pbonus += 1; }, P: (S) => { S.e.pbonus += 1; }, F: (S) => { S.e.pbonus += 2; } },
      etbText: 'The telegraph gets +1 power.', lines: { A: "The Brute's next attack gets +1.", P: 'The telegraph gets +1 power.', F: 'The telegraph gets +2 power.' } },
    F: { nm: 'Tremorling', hp: 4, etb: (S) => forceDiscard(S), fx: {
        A: (S) => forceDiscard(S), P: (S) => mAtk(S, 2, 1), F: (S) => { mAtk(S, 3, 1); if (!S.over) forceDiscard(S); } },
      etbText: 'You discard 1 card (no ◆).', lines: { A: 'You discard 1 (no ◆).', P: 'Attack 2.', F: 'Attack 3; you discard 1 (no ◆).' } },
  },
  BROODMOTHER: {
    A: { nm: 'Broodling', hp: 2, etb: (S) => mAtk(S, 1, 1), fx: { A: (S) => mAtk(S, 1, 1), P: (S) => mAtk(S, 1, 2), F: (S) => mAtk(S, 2, 2) },
      etbText: 'Attack 1.', lines: { A: 'Attack 1.', P: 'Attack 1, twice.', F: 'Attack 2, twice.' } },
    P: { nm: 'Wax-Sister', hp: 3, etb: (S) => { for (const m of S.e.minions) m.hp += 1; }, fx: {
        A: (S) => { S.e.guard += 1; },
        P: (S) => { for (const m of S.e.minions) m.hp += 1; },
        F: (S) => { for (const m of S.e.minions) m.hp += 1; healEnemy(S, 2); } },
      etbText: 'Every minion gains +1 HP.', lines: { A: 'She gains GUARD 1.', P: 'Every minion gains +1 HP.', F: 'Every minion +1 HP; she HEALS 2.' } },
    F: { nm: 'Choir-Larva', hp: 4, etb: (S) => { S.e.pbonus += 1; }, fx: {
        A: (S) => { S.e.guard += 2; }, P: (S) => mAtk(S, 2, 1), F: (S) => { S.e.pbonus += 2; } },
      etbText: 'The telegraph gets +1 power.', lines: { A: 'She gains GUARD 2.', P: 'Attack 2.', F: 'The telegraph gets +2 power.' } },
  },
};

// -------------------------------------------------------------- v3: allies
export interface AllyDef {
  nm: string;
  timing?: 'end'; // The Quiet Skulk exhausts after your plays, before the telegraph
  fx: Record<'A' | 'P' | 'F', (E: Verbs, S: GameState) => void>;
  lines: Record<'A' | 'P' | 'F', string>;
}
export const ALLY_CARDS: AllyDef[] = [
  { nm: 'The Penitent Skulk', fx: { A: (E) => E.scry(2), P: (_E, S) => { S.p.hexTop = true; }, F: (E, S) => E.dmg(S.e.fired.length) },
    lines: { A: 'SCRY 2 the enemy deck.', P: 'Your HEXES go on top this turn.', F: 'Deal 1 damage per fired Curse.' } },
  { nm: 'Skulk of the Shallows', fx: { A: (E) => E.advanceChain(), P: (E) => E.chainShield(), F: (_E, S) => { S.p.burstBonus = 3; } },
    lines: { A: 'Advance your chain 1 (any color).', P: 'Your chain cannot break this turn.', F: 'Your next Surge Burst this turn deals 3.' } },
  { nm: 'The Quiet Skulk', timing: 'end', fx: { A: (E) => E.stagger(1), P: (E) => E.stagger(2), F: (E, S) => { if (effPower(S) <= 0 && S.e.telegraph) E.dmg(2); } },
    lines: { A: 'STAGGER 1.', P: 'STAGGER 2.', F: 'Deal 2 damage if the telegraph is at 0.' } },
  { nm: 'The Doorwright', fx: { A: (E) => E.guard(2), P: (E) => E.guard(2, true), F: (E) => E.thorns(1) },
    lines: { A: 'GUARD 2.', P: 'GUARD 2 (persists).', F: 'THORNS 1.' } },
  { nm: 'Blightshell', fx: { A: (E) => E.blight(1), P: (E) => E.blight(2), F: (_E, S) => { S.e.blightNoDecay = true; } },
    lines: { A: 'BLIGHT 1.', P: 'BLIGHT 2.', F: "This round's Blight tick doesn't reduce Blight." } },
  { nm: 'The Kiln-Back', fx: { A: (E) => E.temper(1), P: (E) => E.temper(2), F: (E) => E.kindle() },
    lines: { A: 'TEMPER 1.', P: 'TEMPER 2.', F: 'KINDLE 1.' } },
  { nm: 'The Gospel Brute', fx: { A: (E) => E.conviction(1), P: (E) => E.attune(2), F: (E) => E.conviction(2) },
    lines: { A: '◆ +1.', P: 'ATTUNE 2.', F: '◆ +2.' } },
  { nm: 'The Load-Bearer', fx: { A: (E) => E.guard(3), P: (E) => E.thorns(1), F: (E) => E.guard(4) },
    lines: { A: 'GUARD 3.', P: 'THORNS 1.', F: 'GUARD 4.' } },
  { nm: 'The Sledge', fx: { A: (E) => E.temper(1), P: (E) => E.dmg(2), F: (E) => E.dmg(4) },
    lines: { A: 'TEMPER 1.', P: 'Deal 2 damage.', F: 'Deal 4 damage.' } },
];
export const ALLY_BASE_IX = 100;
function swap(tiers: TierMap, from: string, to: string, count: number) {
  for (const tier of Object.values(tiers))
    for (const e of tier) {
      while (count > 0 && e[0] === from && e[1] > 0) {
        e[1]--;
        count--;
        addCard(tiers, tierOf(tiers, e), to, 1);
      }
    }
}
function tierOf(tiers: TierMap, entry: [string, number]): 'A' | 'P' | 'F' {
  for (const [k, list] of Object.entries(tiers)) if (list.includes(entry)) return k as 'A' | 'P' | 'F';
  return 'A';
}
function addCard(tiers: TierMap, tierKey: 'A' | 'P' | 'F', name: string, n: number) {
  const list = tiers[tierKey];
  const hit = list.find((e) => e[0] === name);
  if (hit) hit[1] += n;
  else list.push([name, n]);
}
function removeCard(tiers: TierMap, name: string, count: number) {
  for (const tier of Object.values(tiers))
    for (const e of tier) while (count > 0 && e[0] === name && e[1] > 0) { e[1]--; count--; }
}

// ------------------------------------------------------------------- state
export type CurseRef = { curse: number };
export type MinionRef = { minion: 'A' | 'P' | 'F' };
export type EnemyDeckEntry = string | CurseRef | MinionRef;
export interface RiteState {
  trigger: RiteTrigger;
  threshold: number;
  payoff: (E: Verbs, charges: number, ctx?: EffectCtx) => void;
  charges: number;
  name: string;
}
export interface GameState {
  rnd: () => number;
  presetName: PresetName;
  enemyName: EnemyName;
  recipe: Recipe;
  round: number;
  over: 'win' | 'loss' | 'stall' | 'accord' | null;
  concede: boolean; // Common Ground available + Accord win condition live
  log: string[];
  p: {
    hp: number;
    deck: number[];
    hand: number[];
    discard: number[];
    guard: number;
    pguard: number;
    thorns: number;
    conv: number;
    chainPos: Color | null;
    links: number;
    surge: number;
    attune: number;
    chainShield: boolean;
    echoSig: boolean;
    ench: EnchKind[];
    rite: RiteState | null;
    dice: Die[];
    persistDie: Die | null;
    kindled: boolean;
    pressed: boolean;
    sigUsedTurn: boolean;
    sigs: string[];
    allies: { aix: number; exhausted: boolean }[];
    exiled: number[];
    hexTop: boolean;
    burstBonus: number;
  };
  e: {
    hp: number;
    maxhp: number;
    deck: EnemyDeckEntry[];
    discard: EnemyDeckEntry[];
    fired: number[];
    telegraph: string | null;
    guard: number;
    thorns: number;
    blight: number;
    enraged: boolean;
    skip: boolean;
    doubt: number;
    known: number;
    staggers: number;
    tierSizes: { A: number; P: number; F: number };
    drawn: number;
    phase: 'A' | 'P' | 'F';
    minions: MinionInstance[];
    pbonus: number;
    progress: number;
    chorus: boolean;
    blightNoDecay: boolean;
  };
  stats: {
    convEarned: number;
    convSpent: number;
    bursts: number;
    sigFires: number;
    pressFates: number;
    hexFired: number;
    freePlays: number;
    paidPlays: number;
    discardsForConv: number;
  };
  _curseIx: number;
}

export const PLAYER_MAX_HP = 30;

export interface GameOptions {
  minions?: boolean; // shuffle 1 minion into each tier of the classic three
  concede?: boolean; // Common Ground + Accord live (the universal sig)
}

export function newGame(
  presetName: PresetName,
  enemyName: EnemyName,
  recipe: Recipe,
  seed: number,
  opts: GameOptions = {},
): GameState {
  const rnd = mulberry32(seed);
  const preset = PRESETS[presetName];
  const deck: number[] = [];
  preset.cards.forEach((c, ix) => {
    for (let i = 0; i < c.n; i++) deck.push(ix);
  });
  if (presetName === 'COVENANT') deck.push(ALLY_BASE_IX + 3, ALLY_BASE_IX + 8); // starting allies: Doorwright + Sledge

  const spec = ENEMIES[enemyName];
  const tiers: TierMap = JSON.parse(JSON.stringify(spec.tiers));
  if (recipe === 'easy') spec.easy(tiers);
  if (recipe === 'hard') spec.hard(tiers);
  const edeck: EnemyDeckEntry[] = [];
  const tierSizes = { A: 0, P: 0, F: 0 };
  for (const key of ['A', 'P', 'F'] as const) {
    const tier: EnemyDeckEntry[] = [];
    for (const [nm, n] of tiers[key])
      for (let i = 0; i < n; i++)
        tier.push(nm.startsWith('@') ? { minion: nm.slice(1) as 'A' | 'P' | 'F' } : nm);
    if (opts.minions && !tier.some((e) => typeof e === 'object')) tier.push({ minion: key });
    tierSizes[key] = tier.length;
    edeck.push(...shuffled(tier, rnd));
  }

  const S: GameState = {
    rnd,
    presetName,
    enemyName,
    recipe,
    round: 0,
    over: null,
    concede: !!opts.concede,
    log: [],
    p: {
      hp: PLAYER_MAX_HP,
      deck: shuffled(deck, rnd),
      hand: [],
      discard: [],
      guard: 0,
      pguard: 0,
      thorns: 0,
      conv: 0,
      chainPos: null,
      links: 0,
      surge: 0,
      attune: 0,
      chainShield: false,
      echoSig: false,
      ench: [],
      rite: null,
      dice: [],
      persistDie: null,
      kindled: false,
      pressed: false,
      sigUsedTurn: false,
      sigs: SIG_PICKS[presetName].slice(),
      allies: [],
      exiled: [],
      hexTop: false,
      burstBonus: 0,
    },
    e: {
      hp: spec.hp,
      maxhp: spec.hp,
      deck: edeck,
      discard: [],
      fired: [],
      telegraph: null,
      guard: 0,
      thorns: 0,
      blight: 0,
      enraged: false,
      skip: false,
      doubt: 0,
      known: 0,
      staggers: 0,
      tierSizes,
      drawn: 0,
      phase: 'A',
      minions: [],
      pbonus: 0,
      progress: 0,
      chorus: false,
      blightNoDecay: false,
    },
    stats: {
      convEarned: 0,
      convSpent: 0,
      bursts: 0,
      sigFires: 0,
      pressFates: 0,
      hexFired: 0,
      freePlays: 0,
      paidPlays: 0,
      discardsForConv: 0,
    },
    _curseIx: -1,
  };
  if (S.concede) S.p.sigs.push('Common Ground');
  revealTelegraph(S);
  return S;
}

const ALLY_FACE_CACHE = new Map<number, CardDef>();
export const cardOf = (S: GameState, ix: number): CardDef => {
  if (ix >= ALLY_BASE_IX) {
    let c = ALLY_FACE_CACHE.get(ix);
    if (!c) {
      const a = ALLY_CARDS[ix - ALLY_BASE_IX];
      c = {
        nm: a.nm, n: 1, col: 'A', t: 'ALLY', v: 6,
        free: () => {}, paid: () => {},
        freeText: 'ALLY',
        paidText: `A · ${a.lines.A}  P · ${a.lines.P}  F · ${a.lines.F}`,
        payload: 'Pay ANY die to put into play. Exhausts each round for the current phase line; can absorb one entire strike (exiled).',
      };
      ALLY_FACE_CACHE.set(ix, c);
    }
    return c;
  }
  return PRESETS[S.presetName].cards[ix];
};

function say(S: GameState, msg: string) {
  S.log.push(msg);
  if (S.log.length > 200) S.log.splice(0, S.log.length - 200);
}

// ------------------------------------------------------------------- verbs
export interface Verbs {
  draw: (n: number) => void;
  guard: (n: number, persist?: boolean) => void;
  thorns: (n: number) => void;
  blight: (n: number) => void;
  heal: (n: number) => void;
  dmg: (n: number) => void;
  scry: (n: number) => void;
  stagger: (n: number) => void;
  telegraphFizzled: () => boolean;
  fizzleTelegraph: () => void;
  turnabout: () => void;
  doubleBlight: () => void;
  rupture: () => void;
  ruptureAll: () => void;
  anvil: () => void;
  temper: (n: number) => void;
  rerollMisses: () => void;
  kindle: () => void;
  halfStepPush: () => void;
  surgeCharge: () => void;
  advanceChain: () => void;
  chainShield: () => void;
  links: () => number;
  burstNow: () => void;
  attune: (n: number) => void;
  conviction: (n: number) => void;
  sigUsedThisTurn: () => boolean;
  echoNextSig: () => void;
  freeSig: (ctx: EffectCtx) => void;
  bothSigsFree: (ctx: EffectCtx) => void;
  hex: (depth: number) => void;
  doubt: () => void;
  firedCount: () => number;
  reclaim: (n: number) => void;
  skipEnemyTurn: () => void;
  allMissesToMana: () => void;
  progressToken: () => void;
  hasAlly: () => boolean;
  rallyOne: () => void;
  rallyAll: () => void;
  unexile: () => void;
}

export function makeVerbs(S: GameState): Verbs {
  const E: Verbs = {
    draw: (n) => { for (let i = 0; i < n; i++) drawCard(S); },
    guard: (n, persist) => {
      if (persist || S.p.ench.some((e) => e === 'guardPersists')) S.p.pguard += n;
      else S.p.guard += n;
    },
    thorns: (n) => { S.p.thorns = Math.min(3, S.p.thorns + n); },
    blight: (n) => { S.e.blight = Math.min(6, S.e.blight + n); },
    heal: (n) => { S.p.hp = Math.min(PLAYER_MAX_HP, S.p.hp + n); },
    dmg: (n) => dealPlayerDamage(S, n),
    progressToken: () => { S.e.progress++; say(S, `PROGRESS ${S.e.progress}/3 — the argument is landing.`); },
    hasAlly: () => S.p.allies.length > 0,
    rallyOne: () => { const a = S.p.allies.find((x) => x.exhausted); if (a) { a.exhausted = false; exhaustAlly(S, a); } },
    rallyAll: () => { for (const a of S.p.allies.filter((x) => x.exhausted)) { a.exhausted = false; exhaustAlly(S, a); } },
    unexile: () => {
      if (S.p.exiled.length) {
        const aix = S.p.exiled.pop() as number;
        S.p.allies.push({ aix, exhausted: false });
        say(S, `${ALLY_CARDS[aix].nm} returns through The Open Door.`);
      }
    },
    scry: (n) => {
      S.e.known = Math.max(S.e.known, Math.min(n, S.e.deck.length));
      const arch = S.p.ench.filter((e) => e === 'archive').length; // The Deep File: bottom a card, ping 1 per copy
      if (arch) { dealToEnemy(S, arch, true); say(S, `The Deep File bottoms a card — ${arch} damage.`); }
    },
    stagger: (n) => { S.e.staggers += n; },
    telegraphFizzled: () => effPower(S) <= 0,
    fizzleTelegraph: () => { S.e.staggers = 99; say(S, 'The telegraph is staggered to nothing.'); },
    turnabout: () => {
      const d = 2 * Math.min(S.e.staggers, 99);
      say(S, `Turnabout — ${d} damage from ${S.e.staggers} Stagger.`);
      dealToEnemy(S, d, true);
      S.e.staggers = 0;
    },
    doubleBlight: () => { S.e.blight = Math.min(6, S.e.blight * 2); },
    rupture: () => { const b = S.e.blight; S.e.blight = 0; say(S, `Rupture — ${2 * b} damage.`); dealToEnemy(S, 2 * b, true); },
    ruptureAll: () => { const b = S.e.blight; S.e.blight = 0; say(S, `The Reckoning — ${2 * b} damage.`); dealToEnemy(S, 2 * b, true); },
    anvil: () => {
      const d = 2 * S.p.thorns;
      dealToEnemy(S, d, true);
      if (S.p.thorns >= 3) dealToEnemy(S, d, true);
    },
    temper: (n) => temperBest(S, n),
    rerollMisses: () => { for (const d of S.p.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd); },
    kindle: () => {
      if (!S.p.kindled) {
        S.p.kindled = true;
        S.p.dice.push({ color: 'G', face: rollFace('G', S.rnd), kindled: true });
      }
    },
    halfStepPush: () => halfStepPush(S),
    surgeCharge: () => { S.p.surge++; },
    advanceChain: () => advanceChain(S, null, true),
    chainShield: () => { S.p.chainShield = true; },
    links: () => S.p.links,
    burstNow: () => { S.p.links = 3; checkBurst(S); },
    attune: (n) => { S.p.attune += n; },
    conviction: (n) => { S.p.conv += n; S.stats.convEarned += n; },
    sigUsedThisTurn: () => S.p.sigUsedTurn,
    echoNextSig: () => { S.p.echoSig = true; },
    freeSig: (ctx) => { const s = bestSig(S, ctx.brain ?? 'greedy'); if (s) fireSig(S, s, ctx.brain ?? 'greedy', true); },
    bothSigsFree: (ctx) => { for (const s of S.p.sigs) fireSig(S, s, ctx.brain ?? 'greedy', true); },
    hex: (depth) => {
      if (S.p.hexTop) { depth = 0; S.p.hexTop = false; } // The Penitent Skulk (PRESS)
      const at = Math.min(depth, S.e.deck.length);
      S.e.deck.splice(at, 0, { curse: S._curseIx });
    },
    doubt: () => { S.e.doubt++; },
    firedCount: () => S.e.fired.length,
    reclaim: (n) => { while (n-- > 0 && S.e.fired.length) S.p.hand.push(S.e.fired.pop() as number); },
    skipEnemyTurn: () => { S.e.skip = true; },
    allMissesToMana: () => { for (const d of S.p.dice) if (d.face === 'X') d.face = 'M'; },
  };
  return E;
}

function drawCard(S: GameState) {
  if (!S.p.deck.length) { S.p.deck = shuffled(S.p.discard, S.rnd); S.p.discard = []; }
  if (S.p.deck.length) S.p.hand.push(S.p.deck.pop() as number);
}

function temperBest(S: GameState, steps: number) {
  while (steps-- > 0) {
    const miss = S.p.dice.find((d) => d.face === 'X');
    if (miss) { miss.face = 'M'; continue; }
    const mana = S.p.dice.find((d) => d.face === 'M');
    if (mana) mana.face = 'S';
    else break;
  }
}

function halfStepPush(S: GameState) {
  const sp = S.p.dice.find((d) => d.face === 'S' && !d.echoed);
  if (!sp) return;
  const f = rollFace(sp.color, S.rnd);
  if (f === 'X') { sp.face = 'X'; say(S, 'Half-Step push busts — the SPECIAL is a MISS.'); }
  else { sp.echoed = true; say(S, 'Half-Step push holds — that die now ECHOES its play.'); }
}

function advanceChain(S: GameState, color: Color | null, wildcard: boolean) {
  const p = S.p;
  if (p.links === 0 || wildcard || color === CYCLE[p.chainPos as string]) {
    p.chainPos = wildcard ? (p.chainPos ? CYCLE[p.chainPos] : 'P') : color || (p.chainPos ? CYCLE[p.chainPos] : 'P');
    p.links++;
    checkBurst(S);
  } else if (!p.chainShield) {
    p.links = 0;
    p.chainPos = null;
    say(S, 'Chain broken.');
  }
}

function checkBurst(S: GameState) {
  if (S.p.links < 3) return;
  S.p.links = 0;
  S.p.chainPos = null;
  S.stats.bursts++;
  S.p.dice.push({ color: 'G', face: rollFace('G', S.rnd), temp: true });
  say(S, 'SURGE BURST — a temporary gold die joins your pool.');
  const waves = S.p.ench.filter((e) => e === 'wave').length;
  if (waves) dealToEnemy(S, 3 * waves, true);
  if (S.p.burstBonus) { dealToEnemy(S, S.p.burstBonus, true); S.p.burstBonus = 0; } // Skulk of the Shallows (FURY)
  if (S.p.rite && S.p.rite.trigger === 'burst') riteCharge(S);
  if (S.p.rite && S.p.rite.trigger === 'burst') {
    dealToEnemy(S, S.p.rite.charges, true);
  }
}

function riteCharge(S: GameState, ctxBrain?: BrainName) {
  const r = S.p.rite;
  if (!r) return;
  r.charges++;
  if (r.charges >= r.threshold) {
    S.p.rite = null; // clear BEFORE payoff: Chorus of One fires sigs, which must not re-trigger it
    say(S, `${r.name} is sacrificed at ${r.charges} Charges!`);
    const E = makeVerbs(S);
    r.payoff(E, r.charges, { brain: ctxBrain || 'greedy' });
  }
}

function spendDie(S: GameState, die: Die) {
  if (die.face === 'S') { S.p.conv += 2; S.stats.convEarned += 2; }
  S.p.dice.splice(S.p.dice.indexOf(die), 1);
}

// v3: player-sourced damage is assignable — focus a minion when the hit
// wouldn't be badly wasted (physical rule: you choose the target).
function dealPlayerDamage(S: GameState, n: number) {
  const m = S.e.minions.filter((x) => x.hp > 0 && n <= x.hp + 2).sort((a, b) => a.hp - b.hp)[0];
  if (m) { dealToMinion(S, m, n); return; }
  dealToEnemy(S, n, true);
}
function dealToMinion(S: GameState, m: MinionInstance, n: number) {
  if (!m || n <= 0) return;
  m.hp -= n;
  if (m.spec.retaliateA && S.e.phase === 'A') hurtPlayer(S, 1, false); // Shard of Shell
  if (m.hp <= 0) {
    S.e.discard.push(m.entry); // the card returns for Last Stand
    S.e.minions.splice(S.e.minions.indexOf(m), 1);
    say(S, `${m.nm} is destroyed.`);
  }
}
// v3: ally exhaust — Banner of the Host pays ◆ per exhaust
function exhaustAlly(S: GameState, a: { aix: number; exhausted: boolean }) {
  if (a.exhausted) return;
  a.exhausted = true;
  const def = ALLY_CARDS[a.aix];
  say(S, `${def.nm} acts — ${def.lines[S.e.phase]}`);
  def.fx[S.e.phase](makeVerbs(S), S);
  for (let i = S.p.ench.filter((e) => e === 'hostBanner').length; i > 0; i--) {
    S.p.conv++;
    S.stats.convEarned++;
  }
}

function dealToEnemy(S: GameState, n: number, direct: boolean) {
  if (n <= 0) return;
  const absorbed = Math.min(S.e.guard, n);
  S.e.guard -= absorbed;
  n -= absorbed;
  if (n > 0) S.e.hp -= n;
  if (direct && S.e.thorns > 0) hurtPlayer(S, S.e.thorns, false);
  if (S.e.hp <= 0) S.over = 'win';
}

function hurtPlayer(S: GameState, n: number, isHit: boolean) {
  let fully = true;
  let left = n;
  const a1 = Math.min(S.p.pguard, left);
  S.p.pguard -= a1;
  left -= a1;
  const a2 = Math.min(S.p.guard, left);
  S.p.guard -= a2;
  left -= a2;
  if (left > 0) { S.p.hp -= left; fully = false; }
  if (isHit && S.p.thorns > 0) dealToEnemy(S, S.p.thorns, false);
  if (isHit && fully && n > 0 && S.p.rite && S.p.rite.trigger === 'fullAbsorb') riteCharge(S);
  if (S.p.hp <= 0 && !S.over) S.over = 'loss';
}

export function effPower(S: GameState): number {
  const t = S.e.telegraph;
  if (!t) return 0;
  return Math.max(0, ENEMY_CARDS[t].base + S.e.pbonus - S.e.staggers); // pbonus: Drumbeater / Choir-Larva
}

function fireCurse(S: GameState, ix: number) {
  const c = cardOf(S, ix);
  S._curseIx = ix;
  say(S, `Your Curse fires — ${c.nm}!`);
  const E = makeVerbs(S);
  if (c.curse) c.curse(E);
  S.e.fired.push(ix);
  // The Ledger: when one of your curses fires, DRAW 1 + advance chain 1
  for (const e of S.p.ench) if (e === 'ledger') { drawCard(S); advanceChain(S, null, true); }
}

function revealTelegraph(S: GameState) {
  S.e.telegraph = null;
  S.e.staggers = 0;
  S.e.pbonus = 0;
  while (S.e.deck.length || S.e.discard.length) {
    if (!S.e.deck.length) {
      // Last Stand
      S.e.deck = S.e.discard.slice();
      S.e.discard = [];
      S.e.enraged = true;
      say(S, 'LAST STAND — the enemy flips its discard and ENRAGES (+1 to attacks).');
    }
    const top = S.e.deck.shift() as EnemyDeckEntry;
    if (S.e.known > 0) S.e.known--;
    if (typeof top !== 'string' && 'curse' in top) {
      fireCurse(S, top.curse);
      S.stats.hexFired++;
      if (S.over) return;
      continue;
    }
    // real deck entry: advance the phase clock (Last Stand locks FURY)
    S.e.drawn++;
    if (S.e.enraged) S.e.phase = 'F';
    else S.e.phase = S.e.drawn <= S.e.tierSizes.A ? 'A' : S.e.drawn <= S.e.tierSizes.A + S.e.tierSizes.P ? 'P' : 'F';
    if (S.e.doubt > 0) {
      S.e.doubt--;
      S.e.discard.push(top);
      say(S, `Whispered Doubt eats the reveal — ${typeof top === 'string' ? top : 'a minion'} is discarded.`);
      continue;
    }
    if (typeof top !== 'string') { // v3 minion reveal (no cap)
      const spec = MINIONS[S.enemyName][top.minion];
      S.e.minions.push({ spec, hp: spec.hp, nm: spec.nm, entry: top });
      say(S, `${spec.nm} enters play — ${spec.etbText}`);
      spec.etb(S);
      return; // the reveal IS the enemy's whole action: no telegraph this cycle
    }
    S.e.telegraph = top;
    return;
  }
}

export function enemyTurn(S: GameState) {
  for (let i = S.p.ench.filter((e) => e === 'blight1').length; i > 0; i--)
    S.e.blight = Math.min(6, S.e.blight + 1); // Lingering Cough
  if (S.e.skip) {
    S.e.skip = false;
    say(S, 'Sealed Fate — the enemy turn is skipped.');
    endEnemyTurn(S);
    return;
  }
  // v3: every minion triggers its current-phase line at the start of the enemy turn
  for (const m of S.e.minions.slice()) {
    if (m.silenced) { m.silenced = false; say(S, `${m.nm} is SILENCED — it skips its line.`); continue; }
    say(S, `${m.nm} — ${m.spec.lines[S.e.phase]}`);
    m.spec.fx[S.e.phase](S);
    if (S.over) return;
  }
  const t = S.e.telegraph;
  if (t) {
    const card = ENEMY_CARDS[t];
    const power = effPower(S);
    if (power <= 0) {
      S.e.discard.push(t);
      say(S, `${t} FIZZLES.`);
    } else {
      const bonus = (S.e.enraged ? 1 : 0) + (S.e.chorus ? 1 : 0);
      if (card.kind === 'attack' || card.kind === 'swarm') {
        const hits = card.kind === 'swarm' ? S.e.minions.length : card.hits || 1;
        if (hits <= 0) {
          S.e.discard.push(t);
          say(S, `${t} FIZZLES — no brood to swarm with.`);
          S.e.chorus = false;
          revealTelegraph(S);
          endEnemyTurn(S);
          return;
        }
        const incoming = (power + bonus) * hits;
        if (S.p.allies.length && (incoming >= 5 || incoming >= S.p.hp)) {
          const a = S.p.allies.pop() as { aix: number; exhausted: boolean };
          S.p.exiled.push(a.aix);
          S.e.discard.push(t);
          say(S, `${ALLY_CARDS[a.aix].nm} takes the ENTIRE ${t} (${incoming}) and is exiled.`);
        } else {
          say(S, `${t} hits for ${power + bonus}${hits > 1 ? ` × ${hits}` : ''}.`);
          for (let h = 0; h < hits; h++) {
            hurtPlayer(S, power + bonus, true);
            if (S.over) return;
          }
          S.e.discard.push(t);
        }
        S.e.chorus = false;
        revealTelegraph(S);
        endEnemyTurn(S);
        return;
      }
      if (card.kind === 'goad') {
        say(S, `${t} — the brood sings; every minion acts again.`);
        for (const m of S.e.minions.slice()) {
          m.spec.fx[S.e.phase](S);
          if (S.over) return;
        }
      } else if (card.kind === 'guard') { S.e.guard += power; say(S, `${t} — the enemy gains GUARD ${power}.`); }
      else if (card.kind === 'thorns') { S.e.thorns = Math.min(3, S.e.thorns + power); say(S, `${t} — the enemy gains THORNS ${power}.`); }
      else if (card.kind === 'molt') {
        S.e.blight = Math.max(0, S.e.blight - 2);
        S.e.hp = Math.min(ENEMIES[S.enemyName].hp, S.e.hp + power);
        say(S, `${t} — the enemy sheds Blight and heals ${power}.`);
      } else say(S, `${t} — the enemy does nothing.`);
      S.e.discard.push(t);
    }
  }
  revealTelegraph(S);
  endEnemyTurn(S);
}

function endEnemyTurn(S: GameState) {
  if (S.e.blight > 0) {
    say(S, `Blight ticks for ${S.e.blight}.`);
    dealToEnemy(S, S.e.blight, false);
    if (S.e.blightNoDecay) S.e.blightNoDecay = false; // Blightshell (FURY)
    else S.e.blight--;
    if (S.p.rite && S.p.rite.trigger === 'blightTick') riteCharge(S);
  }
  // Concede: an enemy ending its turn with 3+ PROGRESS ties into an Accord
  if (!S.over && S.concede && S.e.progress >= 3) {
    S.over = 'accord';
    say(S, 'ACCORD — the fight ends in common ground. It may join you.');
  }
}

// ---- playing cards
export function playFree(S: GameState, handIx: number, brain?: BrainName) {
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

export function playPaid(S: GameState, handIx: number, die: Die, brain?: BrainName) {
  const ix = S.p.hand[handIx];
  const c = cardOf(S, ix);
  S.p.hand.splice(handIx, 1);
  S.stats.paidPlays++;
  S._curseIx = ix;
  const echoTwice = !!die.echoed;
  const dieFace = die.face;
  spendDie(S, die);
  // chain: R/B/P advance-or-break; GOLD neutral (sim assumption #1)
  if (c.col === 'R' || c.col === 'B' || c.col === 'P') advanceChain(S, c.col, false);
  const E = makeVerbs(S);
  const ctx: EffectCtx = { brain, dieFace };
  if (c.t === 'ENCH') {
    if (S.p.ench.length < 3 && c.ench) { S.p.ench.push(c.ench); say(S, `${c.nm} enters play.`); }
    else S.p.discard.push(ix);
    return;
  }
  if (c.t === 'RITE') {
    if (!S.p.rite && c.rite) {
      S.p.rite = { trigger: c.rite.trigger, threshold: c.rite.threshold, payoff: c.rite.payoff, charges: 0, name: c.nm };
      say(S, `${c.nm} enters play as your Rite.`);
    } else S.p.discard.push(ix);
    return;
  }
  if (c.t === 'ALLY') { // v3: befriended ally enters play (no cap)
    S.p.allies.push({ aix: ix - ALLY_BASE_IX, exhausted: false });
    say(S, `${c.nm} joins your side.`);
    return;
  }
  if (c.paid) c.paid(E, ctx);
  if (echoTwice && c.paid) { say(S, `ECHO — ${c.nm} fires again.`); c.paid(E, ctx); }
  if (c.t !== 'CURSE') S.p.discard.push(ix);
}

export function fireSig(S: GameState, name: string, brain?: BrainName, free?: boolean): boolean {
  const sig = SIGS[name];
  const disc = S.p.attune + S.p.ench.filter((e) => e === 'sigDiscount').length;
  const cost = free ? 0 : Math.max(0, sig.cost - disc);
  if (!free) {
    if (S.p.conv < cost) return false;
    S.p.conv -= cost;
    S.stats.convSpent += cost;
    S.p.attune = 0;
  }
  S.stats.sigFires++;
  S.p.sigUsedTurn = true;
  say(S, `Signature Skill — ${name}${free ? ' (free)' : ` (${cost}◆)`}.`);
  const E = makeVerbs(S);
  sig.fx(E);
  if (S.p.echoSig) { S.p.echoSig = false; say(S, `ECHO — ${name} fires again.`); sig.fx(E); }
  if (S.p.rite && S.p.rite.trigger === 'sigUse') riteCharge(S, brain);
  return true;
}

function bestSig(S: GameState, _brain: BrainName): string {
  const order = S.p.sigs.slice().sort((a, b) => SIGS[b].cost - SIGS[a].cost);
  for (const s of order) {
    if (s === 'The Reckoning' && S.e.blight < 2) continue;
    if (s === 'Recant' && S.e.fired.length === 0) continue;
    if (s === 'Kindled Fury' && !S.p.dice.some((d) => d.face === 'X')) continue;
    return s;
  }
  return order[0];
}

// ------------------------------------------------------------------ actions
export type Action =
  | { k: 'end' }
  | { k: 'free'; h: number }
  | { k: 'paid'; h: number; die: Die }
  | { k: 'sig'; s: string }
  | { k: 'press' }
  | { k: 'discard'; h: number };

export function sigDiscount(S: GameState): number {
  return S.p.attune + S.p.ench.filter((e) => e === 'sigDiscount').length;
}

export function payableDice(S: GameState, c: CardDef): Die[] {
  return S.p.dice.filter(
    (d) => dieUsable(d) && (c.col === 'A' ? true : c.col === 'G' ? d.color === 'G' : d.color === c.col || d.color === 'G'),
  );
}

export function legalActions(S: GameState): Action[] {
  const acts: Action[] = [{ k: 'end' }];
  S.p.hand.forEach((ix, h) => {
    const c = cardOf(S, ix);
    acts.push({ k: 'free', h });
    for (const d of S.p.dice) {
      if (!dieUsable(d)) continue;
      const ok = c.col === 'A' ? true : c.col === 'G' ? d.color === 'G' : d.color === c.col || d.color === 'G';
      if (ok) { acts.push({ k: 'paid', h, die: d }); break; }
    }
    acts.push({ k: 'discard', h });
  });
  for (const s of S.p.sigs) {
    if (S.p.conv >= Math.max(0, SIGS[s].cost - sigDiscount(S))) acts.push({ k: 'sig', s });
  }
  if (!S.p.pressed && S.p.conv >= 1 && S.p.dice.some((d) => d.face === 'X')) acts.push({ k: 'press' });
  return acts;
}

function chooseDie(S: GameState, c: CardDef, prefer: 'goldLast' | 'anyFirst'): Die | null {
  const cands = payableDice(S, c);
  if (!cands.length) return null;
  if (prefer === 'goldLast') {
    cands.sort(
      (a, b) =>
        (a.color === 'G' ? 1 : 0) - (b.color === 'G' ? 1 : 0) ||
        (a.face === 'S' ? 0 : 1) - (b.face === 'S' ? 0 : 1),
    );
  } else {
    cands.sort((a, b) => (a.face === 'S' ? 0 : 1) - (b.face === 'S' ? 0 : 1));
  }
  return cands[0];
}

/** Apply one player action interactively. Returns false when the action was illegal/stale. */
export function applyAction(S: GameState, act: Action, brain?: BrainName): boolean {
  if (S.over) return false;
  if (act.k === 'end') return true;
  if (act.k === 'free' && S.p.hand[act.h] !== undefined) { playFree(S, act.h, brain); return true; }
  if (act.k === 'paid' && S.p.hand[act.h] !== undefined && S.p.dice.includes(act.die) && dieUsable(act.die)) {
    playPaid(S, act.h, act.die, brain);
    return true;
  }
  if (act.k === 'sig') return fireSig(S, act.s, brain, false);
  if (act.k === 'press') {
    if (!S.p.pressed && S.p.conv >= 1) {
      S.p.conv--;
      S.stats.convSpent++;
      S.p.pressed = true;
      S.stats.pressFates++;
      for (const d of S.p.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd);
      say(S, 'Press Fate — all MISSES rerolled.');
      return true;
    }
    return false;
  }
  if (act.k === 'discard' && S.p.hand[act.h] !== undefined) {
    S.p.discard.push(S.p.hand[act.h]);
    S.p.hand.splice(act.h, 1);
    S.p.conv++;
    S.stats.convEarned++;
    S.stats.discardsForConv++;
    return true;
  }
  return false;
}

// ------------------------------------------------------------------- brains
export type BrainName = 'random' | 'greedy' | 'smart';

export const BRAINS: Record<BrainName, (S: GameState) => Action> = {
  random(S) {
    const acts = legalActions(S);
    if (S.rnd() < 0.15) return { k: 'end' };
    return pickOne(acts, S.rnd);
  },

  greedy(S) {
    for (const s of S.p.sigs) {
      if (S.p.conv >= Math.max(0, SIGS[s].cost - sigDiscount(S))) return { k: 'sig', s };
    }
    if (!S.p.pressed && S.p.conv >= 1 && S.p.dice.filter((d) => d.face === 'X').length >= 2) return { k: 'press' };
    let best: { k: 'paid'; h: number; die: Die; v: number } | null = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      const die = chooseDie(S, c, 'anyFirst');
      if (die && (!best || c.v > best.v)) best = { k: 'paid', h, die, v: c.v };
    });
    if (best) return best;
    if (S.p.hand.length) return { k: 'free', h: 0 };
    return { k: 'end' };
  },

  smart(S) {
    const preset = S.presetName;
    const incoming = (() => {
      const t = S.e.telegraph;
      if (!t) return 0;
      const c = ENEMY_CARDS[t];
      if (c.kind === 'swarm') return (effPower(S) + (S.e.enraged ? 1 : 0)) * S.e.minions.length;
      if (c.kind !== 'attack') return 0;
      return (effPower(S) + (S.e.enraged ? 1 : 0)) * (c.hits || 1);
    })();

    for (const s of S.p.sigs) {
      const afford = S.p.conv >= Math.max(0, SIGS[s].cost - sigDiscount(S));
      if (!afford) continue;
      if (s === 'Cataract' && S.e.hp + S.e.guard <= 5) return { k: 'sig', s };
      if (s === 'The Reckoning' && 2 * S.e.blight >= S.e.hp + S.e.guard) return { k: 'sig', s };
    }
    for (const s of S.p.sigs) {
      const cost = Math.max(0, SIGS[s].cost - sigDiscount(S));
      if (S.p.conv < cost + 2) continue;
      if (s === 'Cataract') return { k: 'sig', s };
      if (s === 'The Reckoning' && S.e.blight >= 3) return { k: 'sig', s };
    }
    for (const s of S.p.sigs) {
      const afford = S.p.conv >= Math.max(0, SIGS[s].cost - sigDiscount(S));
      if (!afford) continue;
      if (s === 'The Final Word' && incoming >= 5) return { k: 'sig', s };
      if (s === 'Ironclad Oath' && incoming >= 6 && S.p.guard + S.p.pguard < incoming) return { k: 'sig', s };
    }
    const misses = S.p.dice.filter((d) => d.face === 'X').length;
    if (!S.p.pressed && misses >= 2 && S.p.conv >= 2) return { k: 'press' };

    let bestEnch: { k: 'paid'; h: number; die: Die; v: number } | null = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      if (c.t !== 'ENCH' && c.t !== 'RITE') return;
      if (c.t === 'RITE' && S.p.rite) return;
      if (c.t === 'ENCH' && S.p.ench.length >= 3) return;
      const die = chooseDie(S, c, 'goldLast');
      if (die && (!bestEnch || c.v > bestEnch.v)) bestEnch = { k: 'paid', h, die, v: c.v };
    });
    if (bestEnch) return bestEnch;

    const need = S.p.links === 0 ? null : CYCLE[S.p.chainPos as string];
    let bestPaid: { k: 'paid'; h: number; die: Die; score: number } | null = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      if (c.t === 'ENCH' || c.t === 'RITE') return;
      const die = chooseDie(S, c, 'goldLast');
      if (!die) return;
      let score = c.v;
      if (c.col === 'R' || c.col === 'B' || c.col === 'P') {
        if (need === null) score += 1;
        else if (c.col === need) score += 3;
        else if (!S.p.chainShield) score -= preset === 'TORRENT' ? 4 : 1.5;
      }
      if (c.nm === 'Fever Logic' && S.e.blight < 2) score -= 3;
      if (c.nm === 'Rupture' && S.e.blight < 4) score -= 3;
      if (c.nm === 'The Long Con' && S.e.fired.length < 2) score -= 3;
      if (c.nm === 'Turnabout' && S.e.staggers < 2) score -= 3;
      if (c.nm === 'The Anvil Speaks' && S.p.thorns < 2) score -= 2;
      if (
        (c.nm === 'Raised Shield' || c.nm === 'Hold That Thought' || c.nm === 'Breakwater' || c.nm === 'Measured Answer') &&
        incoming === 0
      )
        score -= 1.5;
      if (bestPaid === null || score > bestPaid.score) bestPaid = { k: 'paid', h, die, score };
    });
    if (bestPaid && (bestPaid as { score: number }).score > 0.5) return bestPaid;

    let bestFree: { k: 'free'; h: number; score: number } | null = null;
    S.p.hand.forEach((ix, h) => {
      const c = cardOf(S, ix);
      let score = 1;
      if (c.t === 'ENCH' || c.t === 'RITE') score -= 0.5;
      if (c.free.toString().includes('scry') && S.e.known > 1) score -= 1;
      if (bestFree === null || score > bestFree.score) bestFree = { k: 'free', h, score };
    });
    if (bestFree && (bestFree as { score: number }).score > 0) return bestFree;

    const cheapest = Math.min(...S.p.sigs.map((s) => Math.max(0, SIGS[s].cost - S.p.attune)));
    if (S.p.hand.length > 2 && S.p.conv < cheapest && cheapest - S.p.conv <= 2) return { k: 'discard', h: 0 };

    return { k: 'end' };
  },
};

// -------------------------------------------------------------- player turn
/** Round start: refill hand, roll dice, turn-start triggers. */
export function startPlayerTurn(S: GameState) {
  S.round++;
  const p = S.p;
  p.sigUsedTurn = false;
  p.pressed = false;
  p.chainShield = false;
  while (p.hand.length < 5) {
    const before = p.hand.length;
    drawCard(S);
    if (p.hand.length === before) break;
  }
  const kept = p.persistDie ? [p.persistDie] : [];
  p.persistDie = null;
  const golds = p.dice.filter((d) => d.temp);
  p.dice = [...kept, ...golds];
  p.kindled = false;
  for (const col of ['R', 'B', 'P', 'G'] as Color[]) p.dice.push({ color: col, face: rollFace(col, S.rnd) });
  for (let i = p.ench.filter((e) => e === 'anneal').length; i > 0; i--) {
    const m = p.dice.find((d) => d.face === 'X');
    if (m) m.face = 'M';
  }
  for (const e of p.ench) {
    if (e === 'archive') makeVerbs(S).scry(1); // The Deep File: round-start SCRY (which itself pings)
  }
  if (p.rite && p.rite.trigger === 'turnStart') riteCharge(S);
  // v3: allies refresh; start-timed allies auto-exhaust for the current phase's line
  for (const a of p.allies) {
    a.exhausted = false;
    if (ALLY_CARDS[a.aix].timing !== 'end') exhaustAlly(S, a);
  }
  // The Long Table: each round, one ally may EXHAUST twice
  for (let i = p.ench.filter((e) => e === 'longTable').length; i > 0; i--) {
    const a = p.allies.find((x) => x.exhausted);
    if (a) { a.exhausted = false; exhaustAlly(S, a); }
  }
}

/** End of the player's action phase: Forge Eternal keep, kindled dice expire. */
export function endPlayerTurn(S: GameState) {
  const p = S.p;
  // v3: end-timed allies (The Quiet Skulk) exhaust after your plays, before the telegraph
  if (!S.over) for (const a of p.allies) if (!a.exhausted) exhaustAlly(S, a);
  if (p.ench.includes('forge')) {
    const keep = p.dice
      .filter((d) => !d.temp && !d.kindled)
      .sort((a, b) => 'SMX'.indexOf(a.face) - 'SMX'.indexOf(b.face))[0];
    if (keep) p.persistDie = keep;
  }
  p.dice = p.dice.filter((d) => d.temp);
}

/** Full round: enemy resolves + reveals, guard fades. Call after endPlayerTurn. */
export function resolveEnemyAndFade(S: GameState) {
  if (S.over) return;
  enemyTurn(S);
  if (S.over) return;
  S.p.guard = 0;
}

// ---------------------------------------------------------------- batch run
function playerTurnBatch(S: GameState, brainName: BrainName) {
  startPlayerTurn(S);
  const brain = BRAINS[brainName];
  let guardBudget = 200;
  while (!S.over && guardBudget-- > 0) {
    const act = brain(S);
    if (!act || act.k === 'end') break;
    if (act.k === 'free' && S.p.hand[act.h] !== undefined) playFree(S, act.h, brainName);
    else if (act.k === 'paid' && S.p.hand[act.h] !== undefined && S.p.dice.includes(act.die) && dieUsable(act.die))
      playPaid(S, act.h, act.die, brainName);
    else if (act.k === 'sig') { if (!fireSig(S, act.s, brainName, false)) break; }
    else if (act.k === 'press') {
      if (!S.p.pressed && S.p.conv >= 1) {
        S.p.conv--;
        S.stats.convSpent++;
        S.p.pressed = true;
        S.stats.pressFates++;
        for (const d of S.p.dice) if (d.face === 'X') d.face = rollFace(d.color, S.rnd);
      }
    } else if (act.k === 'discard' && S.p.hand[act.h] !== undefined) {
      S.p.discard.push(S.p.hand[act.h]);
      S.p.hand.splice(act.h, 1);
      S.p.conv++;
      S.stats.convEarned++;
      S.stats.discardsForConv++;
    } else break;
  }
  endPlayerTurn(S);
}

export function runGame(
  presetName: PresetName,
  enemyName: EnemyName,
  recipe: Recipe,
  brainName: BrainName,
  seed: number,
  opts: GameOptions = {},
): GameState {
  const S = newGame(presetName, enemyName, recipe, seed, opts);
  while (!S.over && S.round < 40) {
    playerTurnBatch(S, brainName);
    if (S.over) break;
    enemyTurn(S);
    if (S.over) break;
    S.p.guard = 0;
  }
  if (!S.over) S.over = 'stall';
  return S;
}

// ----------------------------------------------------------- display helpers
export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];
export const ENEMY_NAMES = Object.keys(ENEMIES) as EnemyName[];
export const STANCE_LABEL: Record<Color, string> = { R: 'BODY', B: 'MIND', P: 'HEART', G: 'GOLD' };
export const COLOR_LABEL: Record<CardColor, string> = { R: 'RED', B: 'BLUE', P: 'PURPLE', G: 'GOLD', A: 'ANY' };
export const PHASE_LABEL: Record<'A' | 'P' | 'F', string> = { A: 'APPROACH', P: 'PRESS', F: 'FURY' };
export const FACE_LABEL: Record<Face, string> = { S: 'SPECIAL', M: 'MANA', X: 'MISS' };

/** The enemy cards revealed by SCRY (top of deck, `known` deep). */
export function knownEnemyCards(S: GameState): { label: string; isCurse: boolean }[] {
  const out: { label: string; isCurse: boolean }[] = [];
  for (let i = 0; i < S.e.known && i < S.e.deck.length; i++) {
    const entry = S.e.deck[i];
    if (typeof entry === 'string') out.push({ label: entry, isCurse: false });
    else if ('curse' in entry) out.push({ label: cardOf(S, entry.curse).nm, isCurse: true });
    else out.push({ label: MINIONS[S.enemyName][entry.minion].nm, isCurse: false });
  }
  return out;
}

export const PRESET_BLURB: Record<PresetName, string> = {
  STANDSTILL: 'Control. Stagger the telegraph until it fizzles, then cash the stall for damage.',
  CONTAGION: 'Poison. Stack Blight and let it tick — or Rupture it all at once.',
  BASTION: 'Fortress. Guard, Thorns, and an anvil that answers back.',
  FOUNDRY: 'Dice-smithing. Temper misses into mana, kindle bonus dice, go all-in.',
  TORRENT: 'Momentum. Chain HEART→BODY→MIND for Surge Bursts and gold dice.',
  INVOCATION: 'Ritual. Bank Conviction fast and fire Signature Skills every round.',
  MALISON: 'Curses. Slide traps into the enemy deck and profit when they fire.',
  COVENANT: 'The host. Conviction, card flow, and befriended enemies who act every round.',
};

export const ENEMY_BLURB: Record<EnemyName, string> = {
  SKULK: 'Fast chip damage that snowballs into Frenzy.',
  SHELLBACK: 'Armor, thorns, and a shell that heals itself.',
  BRUTE: 'Slow haymakers. Survive the Heave, fear the Rampage.',
  BROODMOTHER: 'Her brood are cards. Swarm hits once per minion; the Hymn wakes them all.',
};
