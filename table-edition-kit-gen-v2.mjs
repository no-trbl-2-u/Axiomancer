// Axiomancer: Table Edition — print-and-play kit generator (P1, v3 face design)
// Face = the catalog's #5 SIDE RAIL design (devlog/catalog.html), adapted light for print:
// stance rail w/ vertical STANCE·TYPE, giant FREE glyph top-left w/ value inside, rarity
// top-right, central unique icon as art, NAME at bottom, Paid row w/ die cube + bold keywords.
// Icons: "Potential Assets" (game-icons.net, CC BY 3.0). Every card: FREE glyph+number AND Paid.
import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Primary: the full game-icons pack. Fallback: the flat stash of used icons
// (Downloads/axiomancer-kit-icons), so "Potential Assets" can be deleted safely.
const ASSETS = 'C:/Users/notrb/Workspace/Axiomancer/Potential Assets/icons-BBR/ffffff/000000/1x1';
const STASH = 'C:/Users/notrb/Downloads/axiomancer-kit-icons';

const iconIndex = new Map();
if (existsSync(ASSETS)) {
  for (const author of readdirSync(ASSETS)) {
    const dir = join(ASSETS, author);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir))
      if (f.endsWith('.svg') && !iconIndex.has(f.slice(0, -4)))
        iconIndex.set(f.slice(0, -4), join(dir, f));
  }
} else if (existsSync(STASH)) {
  for (const f of readdirSync(STASH))
    if (f.endsWith('.svg')) iconIndex.set(f.slice(0, -4), join(STASH, f));
} else {
  throw new Error('No icon source found: neither Potential Assets nor the stash exists.');
}

const missing = new Set();
const svgCache = new Map();
function icon(name, cls) {
  let inner = svgCache.get(name);
  if (inner === undefined) {
    const p = iconIndex.get(name);
    if (!p) { missing.add(name); return `<span class="icx ${cls}">?</span>`; }
    const raw = readFileSync(p, 'utf8');
    inner = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1]
      .replace('<path d="M0 0h512v512H0z"/>', '')
      .replace(/fill="#fff(?:fff)?"/g, '');
    svgCache.set(name, inner);
  }
  return `<svg class="ic ${cls}" viewBox="0 0 512 512"><g fill="currentColor">${inner}</g></svg>`;
}

const CUBE = `<svg class="ccube" viewBox="0 0 24 24"><path d="M12 3 L21 8 L12 13 L3 8Z" fill="var(--c)"/><path d="M3 8 L12 13 L12 21 L3 16Z" fill="var(--c)" opacity=".62"/><path d="M21 8 L12 13 L12 21 L21 16Z" fill="var(--c)" opacity=".38"/></svg>`;

const GLYPH = {
  DRAW: 'card-draw', GUARD: 'checked-shield', BLIGHT: 'poison', HEAL: 'health-increase',
  CLEANSE: 'broom', SCRY: 'crystal-ball', ECHO: 'echo-ripples', RECALL: 'return-arrow',
  STAGGER: 'cancel', RUPTURE: 'burst-blob', THORNS: 'spikes', TEMPER: 'anvil',
  KINDLE: 'fire', SURGE: 'power-lightning', CONVICTION: 'cut-diamond', ATTUNE: 'meditation',
  HEX: 'death-skull', ATTACK: 'crossed-swords',
};
const GLYPH_GLOSS = {
  DRAW: 'draw N cards', GUARD: 'block next N damage (fades at round end unless "persists")',
  BLIGHT: 'N Blight tokens (max 6); DoT — see rules card', HEAL: 'restore N Vitae',
  CLEANSE: 'remove N tokens from yourself', SCRY: 'look at top N of either deck, any order',
  ECHO: 'the line fires twice', RECALL: 'return N cards from discard to hand',
  STAGGER: 'N tokens on the telegraph; −1 power each; 0 = fizzle',
  RUPTURE: 'remove enemy Blight; 2 damage each', THORNS: 'attacker takes N when it hits you (max 3)',
  TEMPER: 'upgrade a die N steps: MISS→MANA→SPECIAL', KINDLE: 'bonus gold die this turn (max 1)',
  SURGE: 'gain a charge: your next FREE card play advances your chain 1 (any color)',
  CONVICTION: 'gain N Conviction (◆)', ATTUNE: 'your next Signature Skill costs N less ◆',
  HEX: 'this Curse slides into the enemy deck — free: 2 cards deep; paid: on top',
  ATTACK: 'enemy hits for N',
};
const KW_RE = new RegExp(`\\b(${Object.keys(GLYPH).join('|')}|RITE|ENCHANT|SPECIAL|MANA|MISS)\\b`, 'g');

const S = { mind: '#2b4fae', body: '#a03c2e', heart: '#6d3f8c', grey: '#5f6368', gold: '#a67c00', foe: '#3a3a3a' };
const COLOR = { mind: 'BLUE', body: 'RED', heart: 'PURPLE', grey: 'GREY' };

const PRESETS = [
  { name: 'STANDSTILL', badge: 'pause-button', stance: 'mind', glyphs: ['DRAW','SCRY','GUARD','STAGGER','ECHO'], cards: [
    { nm: 'Point of Order', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'gavel', free: ['DRAW',1], paid: 'STAGGER 1, DRAW 1.' },
    { nm: 'Cold Reading', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'third-eye', free: ['SCRY',2], paid: 'SCRY 3 (either deck), DRAW 1.' },
    { nm: 'Hold That Thought', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'hand', free: ['GUARD',2], paid: 'GUARD 2, STAGGER 1.' },
    { nm: 'Motion to Suppress', r: 'U', n: 3, hue: 'mind', t: 'SPELL', art: 'padlock', free: ['STAGGER',1], paid: 'STAGGER 2. If the telegraph fizzles, DRAW 2.' },
    { nm: 'The Deep File', r: 'U', n: 3, hue: 'heart', t: 'ENCH', art: 'archive-research', free: ['SCRY',1], paid: 'ENCHANT — at the start of the round, SCRY 1. Whenever you SCRY, bottom one card you saw: deal 1 damage.' },
    { nm: 'Dead Air', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'hourglass', free: ['STAGGER',1], paid: 'STAGGER 3. If the telegraph is at 0, deal 3 damage.' },
    { nm: 'Turnabout', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'clockwise-rotation', free: ['DRAW',1], paid: 'Deal 2 damage per Stagger token on the telegraph, then remove them.' },
  ]},
  { name: 'CONTAGION', badge: 'biohazard', stance: 'body', glyphs: ['BLIGHT','RUPTURE','DRAW'], cards: [
    { nm: 'First Symptom', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'vial', free: ['BLIGHT',1], paid: 'BLIGHT 2.' },
    { nm: 'Poisoned Well', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'well', free: ['BLIGHT',1], paid: 'BLIGHT 3.' },
    { nm: 'Bad Air', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'poison-cloud', free: ['BLIGHT',1], paid: 'BLIGHT 2, DRAW 1.' },
    { nm: 'Fever Logic', r: 'U', n: 3, hue: 'mind', t: 'SPELL', art: 'brain', free: ['BLIGHT',1], paid: "Double the enemy's BLIGHT (max 6)." },
    { nm: 'Lingering Cough', r: 'U', n: 3, hue: 'body', t: 'ENCH', art: 'gas-mask', free: ['BLIGHT',1], paid: 'ENCHANT — at the start of the enemy turn, BLIGHT 1.' },
    { nm: 'Rupture', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'burst-blob', free: ['BLIGHT',2], paid: 'RUPTURE — remove any number of enemy Blight: deal 2 damage each.' },
    { nm: 'Terminal Diagnosis', r: 'R', n: 1, gold: 1, t:'RITE', art: 'tombstone', free: ['BLIGHT',1], paid: 'RITE — +1 Charge whenever Blight ticks. Sacrifice at 4: deal 3 damage per Charge.' },
  ]},
  { name: 'BASTION', badge: 'defensive-wall', stance: 'body', glyphs: ['GUARD','THORNS','BLIGHT','DRAW','ECHO'], cards: [
    { nm: 'Raised Shield', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'shield', free: ['GUARD',2], paid: 'GUARD 4.' },
    { nm: 'Nettle Cloak', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'cape', free: ['THORNS',1], paid: 'THORNS 1, GUARD 2.' },
    { nm: 'Measured Answer', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'scales', free: ['DRAW',1], paid: 'GUARD 3, DRAW 1.' },
    { nm: 'The Adamant Wall', r: 'U', n: 3, hue: 'body', t: 'ENCH', art: 'brick-wall', free: ['GUARD',2], paid: 'ENCHANT — your GUARD persists (no round-end fade).' },
    { nm: 'Pebble in the Boot', r: 'U', n: 3, hue: 'heart', t: 'SPELL', art: 'leather-boot', free: ['BLIGHT',1], paid: 'THORNS 1, BLIGHT 1.' },
    { nm: 'The Anvil Speaks', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'anvil-impact', free: ['THORNS',1], paid: 'Deal 2 damage per Thorns you have. ECHO this if you have 3 Thorns.' },
    { nm: 'Unbroken', r: 'R', n: 1, gold: 1, t:'RITE', art: 'stone-tower', free: ['GUARD',2], paid: 'RITE — +1 Charge when Guard fully absorbs a hit. Sacrifice at 3: GUARD 6 (persists), THORNS 2.' },
  ]},
  { name: 'FOUNDRY', badge: 'gear-hammer', stance: 'body', glyphs: ['TEMPER','KINDLE'], cards: [
    { nm: 'Tempered Edge', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'blacksmith', free: ['TEMPER',1], paid: 'TEMPER 2.' },
    { nm: 'Stoke', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'campfire', free: ['TEMPER',1], paid: 'Reroll any of your unspent dice.' },
    { nm: 'Sparks', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'fireflake', free: ['KINDLE',1], paid: 'KINDLE 1, then TEMPER 1.' },
    { nm: 'Half-Step', r: 'U', n: 3, hue: 'heart', t: 'SPELL', art: 'rolling-dices', free: ['TEMPER',1], paid: 'TEMPER 2. You may push a SPECIAL: roll it — MANA/SPECIAL: its play fires twice; MISS: it busts to MISS.' },
    { nm: 'Annealing', r: 'U', n: 3, hue: 'body', t: 'ENCH', art: 'heat-haze', free: ['TEMPER',1], paid: 'ENCHANT — at your turn start, upgrade one MISS to MANA.' },
    { nm: 'The Forge Eternal', r: 'R', n: 1, gold: 1, t:'ENCH', art: 'anvil', free: ['TEMPER',1], paid: 'ENCHANT — keep one unspent die between turns (as rolled).' },
    { nm: 'White Heat', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'lava', free: ['TEMPER',1], paid: 'Deal 4 damage — 6 if the die you paid with shows SPECIAL.' },
  ]},
  { name: 'TORRENT', badge: 'wave-crest', stance: 'heart', glyphs: ['SURGE','DRAW','GUARD'], cards: [
    { nm: 'Rising Tide', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'big-wave', free: ['SURGE',1], paid: 'DRAW 1 and advance your chain 1 (any color).' },
    { nm: 'Undertow', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'whirlwind', free: ['DRAW',1], paid: 'DRAW 1. Your chain cannot break this turn.' },
    { nm: 'Breakwater', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'dam', free: ['GUARD',2], paid: 'GUARD 2, +1 per link in your chain.' },
    { nm: 'Confluence', r: 'U', n: 3, hue: 'heart', t: 'SPELL', art: 'splash', free: ['SURGE',1], paid: 'Advance your chain 1 (any color); if that completes it, DRAW 2.' },
    { nm: 'Standing Wave', r: 'U', n: 3, hue: 'mind', t: 'ENCH', art: 'water-drop', free: ['SURGE',1], paid: 'ENCHANT — your Surge Bursts deal 3 damage.' },
    { nm: 'Riptide', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'lightning-storm', free: ['SURGE',1], paid: 'Surge Burst now — complete your chain and collect the gold die.' },
    { nm: 'Maelstrom', r: 'R', n: 1, gold: 1, t:'RITE', art: 'vortex', free: ['SURGE',1], paid: 'RITE — +1 Charge each Surge Burst; your Surge Bursts deal damage equal to its Charges. Sacrifice at 4: deal 3 per Charge.' },
  ]},
  { name: 'INVOCATION', badge: 'ringing-bell', stance: 'heart', glyphs: ['ATTUNE','CONVICTION','DRAW','ECHO'], cards: [
    { nm: 'Rehearsal', r: 'C', n: 4, hue: 'mind', t: 'SPELL', art: 'conversation', free: ['ATTUNE',1], paid: 'ATTUNE 2.' },
    { nm: 'Call the Name', r: 'C', n: 4, hue: 'heart', t: 'SPELL', art: 'megaphone', free: ['CONVICTION',1], paid: 'CONVICTION +1. If you used a Signature Skill this turn, DRAW 2.' },
    { nm: 'Litany', r: 'C', n: 4, hue: 'body', t: 'SPELL', art: 'quill-ink', free: ['ATTUNE',1], paid: 'CONVICTION +2 (◆).' },
    { nm: 'Second Voice', r: 'U', n: 3, hue: 'heart', t: 'SPELL', art: 'duality', free: ['ATTUNE',1], paid: 'ECHO the next Signature Skill you use this turn.' },
    { nm: 'Standing Invocation', r: 'U', n: 3, hue: 'mind', t: 'ENCH', art: 'candle-flame', free: ['ATTUNE',1], paid: 'ENCHANT — your Signature Skills cost 1 less ◆.' },
    { nm: 'The Word Made Act', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'book-cover', free: ['CONVICTION',1], paid: 'Use a Signature Skill without paying its ◆ cost.' },
    { nm: 'Chorus of One', r: 'R', n: 1, gold: 1, t:'RITE', art: 'lyre', free: ['ATTUNE',1], paid: 'RITE — +1 Charge each time you use a Signature Skill. Sacrifice at 3: use both your Signature Skills for free.' },
  ]},
  { name: 'MALISON', badge: 'evil-moon', stance: 'mind', glyphs: ['HEX','SCRY','DRAW','BLIGHT','SURGE'], cards: [
    { nm: 'Whispered Doubt', r: 'C', n: 4, hue: 'mind', t: 'CURSE', art: 'shadow-follower', free: ['HEX'], paid: 'HEX on top of the enemy deck instead.', pay: "When drawn: the enemy's reveal is discarded — it loses that action." },
    { nm: 'Hidden Barb', r: 'C', n: 4, hue: 'body', t: 'CURSE', art: 'fishing-hook', free: ['HEX'], paid: 'HEX on top of the enemy deck instead.', pay: 'When drawn: BLIGHT 2 the enemy.' },
    { nm: 'Weight of Guilt', r: 'C', n: 4, hue: 'heart', t: 'CURSE', art: 'weight', free: ['HEX'], paid: 'HEX on top of the enemy deck instead.', pay: 'When drawn: the enemy takes 1 damage per card in the fired-Curse pile.' },
    { nm: 'Contract of Ruin', r: 'U', n: 3, hue: 'mind', t: 'SPELL', art: 'scroll-unfurled', free: ['SCRY',2], paid: 'SCRY 2 the enemy deck. Return up to 2 fired Curses to your hand.' },
    { nm: 'The Ledger', r: 'U', n: 3, hue: 'body', t: 'ENCH', art: 'notebook', free: ['DRAW',1], paid: 'ENCHANT — when one of your Curses fires, DRAW 1 and advance your chain 1 (any color).' },
    { nm: 'The Long Con', r: 'R', n: 1, gold: 1, t:'SPELL', art: 'domino-mask', free: ['DRAW',1], paid: 'Deal 3 damage per card in the fired-Curse pile.' },
    { nm: 'Sealed Fate', r: 'R', n: 1, gold: 1, t:'CURSE', art: 'sands-of-time', free: ['HEX'], paid: 'HEX on top of the enemy deck instead.', pay: 'When drawn: the enemy skips this turn entirely and takes 3 damage.' },
  ]},
];

const NEUTRAL = { name: 'NEUTRAL', badge: 'plain-circle', stance: 'grey', glyphs: ['DRAW','HEAL','SCRY','CLEANSE','CONVICTION','KINDLE','RECALL','ECHO','SURGE'], cards: [
  { nm: 'Steady Breath', r: 'C', n: 1, t: 'SPELL', art: 'lungs', free: ['DRAW',1], paid: 'DRAW 2.' },
  { nm: 'Salve', r: 'C', n: 1, t: 'SPELL', art: 'health-potion', free: ['HEAL',1], paid: 'HEAL 3.' },
  { nm: 'Sift', r: 'C', n: 1, t: 'SPELL', art: 'magnifying-glass', free: ['SCRY',2], paid: 'SCRY 2 (either deck), DRAW 1.' },
  { nm: 'Purge', r: 'C', n: 1, t: 'SPELL', art: 'soap', free: ['CLEANSE',1], paid: 'CLEANSE 2.' },
  { nm: 'Spark of Conviction', r: 'C', n: 1, t: 'SPELL', art: 'gem-pendant', free: ['CONVICTION',1], paid: 'CONVICTION +2 (◆).' },
  { nm: 'Loose Die', r: 'C', n: 1, t: 'SPELL', art: 'dice-six-faces-five', free: ['KINDLE',1], paid: 'KINDLE 1 and DRAW 1.' },
  { nm: 'Remembrance', r: 'C', n: 1, t: 'SPELL', art: 'candle-skull', free: ['RECALL',1], paid: 'RECALL 1, DRAW 1.' },
  { nm: 'Echo Chamber', r: 'U', n: 1, t: 'SPELL', art: 'sound-waves', free: ['DRAW',1], paid: 'ECHO the next Spell you play this turn.' },
  { nm: 'Iron Rations', r: 'U', n: 1, t: 'ENCH', art: 'meat', free: ['HEAL',1], paid: 'ENCHANT — at your turn start, HEAL 1.' },
  { nm: 'Keepsake', r: 'R', n: 1, t: 'RITE', art: 'locked-chest', free: ['DRAW',1], paid: 'RITE — +1 Charge at your turn start. Sacrifice at 3: DRAW 3, HEAL 3, CONVICTION +3.' },
]};

const SIGS = [
  { nm: 'Foresight', stance: 'mind', cost: 3, art: 'semi-closed-eye', text: 'SCRY 4 (either deck), DRAW 1.' },
  { nm: 'The Final Word', stance: 'mind', cost: 6, art: 'silenced', text: 'STAGGER the telegraph to 0 — it fizzles. DRAW 2.' },
  { nm: 'Ironclad Oath', stance: 'body', cost: 4, art: 'templar-shield', text: 'GUARD 5 (persists).' },
  { nm: 'The Reckoning', stance: 'body', cost: 6, art: 'reaper-scythe', text: 'RUPTURE all enemy Blight: deal 2 damage each.' },
  { nm: 'Kindled Fury', stance: 'heart', cost: 4, art: 'flame-spin', text: 'Upgrade all your MISSES to MANA, then KINDLE 1.' },
  { nm: 'Cataract', stance: 'heart', cost: 5, art: 'waterfall', text: 'Deal 5 damage.' },
  { nm: 'Recant', stance: 'mind', cost: 5, art: 'card-exchange', text: 'Return ALL fired Curses to your hand.' },
];

const ENEMIES = [
  { name: 'THE SKULK', hp: 22, cards: {
      'Scratch': { fx: 'Attack 1.', art: 'claw' }, 'Flurry': { fx: 'Attack 1, three times.', art: 'claw-slashes' },
      'Vanish': { fx: 'GUARD 3 (persists).', art: 'fog' }, 'Frenzy': { fx: 'Attack 2, three times.', art: 'pounce' } },
    tiers: { APPROACH: [['Scratch',5],['Vanish',2]], PRESS: [['Flurry',4],['Scratch',2],['Vanish',1]], FURY: [['Flurry',3],['Frenzy',3]] },
    easy: 'Easy: swap 2 Flurry → Scratch; remove 1 Frenzy.', hard: 'Hard: swap 2 Scratch → Flurry; swap 1 Vanish → Frenzy.' },
  { name: 'THE SHELLBACK', hp: 28, cards: {
      'Hunker': { fx: 'GUARD 4 (persists).', art: 'turtle' }, 'Bristle': { fx: 'It gains THORNS 1.', art: 'spiked-shell' },
      'Snap': { fx: 'Attack 3.', art: 'mantrap' }, 'Molt': { fx: 'It removes 2 of its Blight and HEALS 3.', art: 'regeneration' },
      'Crush': { fx: 'Attack 6.', art: 'crush' } },
    tiers: { APPROACH: [['Hunker',3],['Bristle',2],['Snap',2]], PRESS: [['Snap',3],['Hunker',2],['Molt',2]], FURY: [['Crush',4],['Snap',2]] },
    easy: 'Easy: swap 2 Crush → Snap; remove 1 Molt.', hard: 'Hard: swap 2 Snap → Crush; add 1 Molt to PRESS.' },
  { name: 'THE BRUTE', hp: 35, cards: {
      'Catch Breath': { fx: 'Nothing happens. It breathes.', art: 'night-sleep' }, 'Sweep': { fx: 'Attack 2, twice.', art: 'hammer-drop' },
      'Heave': { fx: 'Attack 6.', art: 'fist' }, 'Rampage': { fx: 'Attack 4, twice.', art: 'trample' } },
    tiers: { APPROACH: [['Catch Breath',4],['Sweep',3]], PRESS: [['Heave',4],['Sweep',2],['Catch Breath',1]], FURY: [['Rampage',3],['Heave',3]] },
    easy: 'Easy: swap 2 Heave → Catch Breath; remove 1 Rampage.', hard: 'Hard: swap 2 Catch Breath → Sweep; swap 1 Heave → Rampage.' },
];

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const boldKw = s => esc(s).replace(KW_RE, '<b>$1</b>');
const cells = [];

// Catalog #5 side-rail shell: rail = vertical STANCE·TYPE; name lives at the BOTTOM.
function face(col, railLabel, { rarity, freeIcon, freeVal, art, name, paidHtml, payload, foot, badge, cls = '' }) {
  return `<div class="card ${cls}" style="--c:${col}">
    <div class="rail"><span class="rvert">${esc(railLabel)}</span></div>
    <div class="bd">
      <div class="top">
        ${freeIcon ? `<div class="cfree">${freeIcon}${freeVal ? `<span class="cfreeval">${freeVal}</span>` : ''}</div>` : '<div></div>'}
        ${rarity ? `<div class="crarity">${rarity}</div>` : ''}
      </div>
      <div class="cart">${art}</div>
      <div class="cbtm">
        <div class="cname">${esc(name)}</div>
        <div class="crule"></div>
        ${paidHtml}
        ${payload ? `<div class="payload"><i>${esc(payload)}</i></div>` : ''}
      </div>
      <div class="foot">${foot}</div>
      ${badge ? `<div class="pbadge">${icon(badge, 'pb-ic')}</div>` : ''}
    </div>
  </div>`;
}

function playerCell(p, c, copyIx) {
  const rar = c.r === 'C' ? 'COMMON' : c.r === 'U' ? 'UNCOMMON' : 'RARE';
  const col = c.gold ? S.gold : S[c.hue || p.stance];
  const colorName = c.gold ? 'GOLD' : COLOR[c.hue || p.stance];
  return face(col, `${colorName} · ${c.t}`, {
    rarity: rar + (c.n > 1 ? ` ${copyIx}/${c.n}` : ''),
    freeIcon: icon(GLYPH[c.free[0]], 'glbig'), freeVal: c.free[1] >= 2 ? c.free[1] : '',
    art: icon(c.art, 'art-ic'),
    name: c.nm,
    paidHtml: `<div class="cpaid">${CUBE}<span>${boldKw(c.paid)}</span></div>`,
    payload: c.pay, foot: p.name, badge: p.badge,
  });
}

function refGlyphCell(p) {
  const rows = p.glyphs.map(g =>
    `<div class="gr">${icon(GLYPH[g], 'gl-s')}<b>${g}</b><span>${GLYPH_GLOSS[g]}</span></div>`).join('');
  return face(S[p.stance], `${p.name} · REFERENCE`, {
    rarity: 'KEEP HANDY', freeIcon: null, freeVal: '',
    art: `<div class="grs">${rows}</div>`, name: 'Glyphs',
    paidHtml: '', payload: null, foot: p.name, badge: p.badge,
  });
}

function refRulesCell(p) {
  return face(S[p.stance], `${p.name} · REFERENCE`, {
    rarity: 'KEEP HANDY', freeIcon: null, freeVal: '',
    art: `<div class="refwrap"><ol class="mini">
      <li>Draw to 5 · roll your 4 dice.</li>
      <li>FREE glyph: play the card, <b>no die needed</b>.</li>
      <li><b>Paid</b>: spend a usable die (mana/special) of <b>the card's rail color</b>. GREY cards: any color. GOLD cards: gold die ONLY. The gold die is wild. MISSES are dead dice.</li>
      <li><b>Momentum</b>: Paid plays chain HEART→BODY→MIND (any entry; any other color — even your own — breaks it). 3 links = <b>SURGE BURST</b>: take a gold die (yours until spent). FREE plays never chain unless SURGE-charged.</li>
      <li>SPECIAL spent: +2◆. Discard a card: +1◆. Press Fate: 1◆ — reroll ALL your MISSES, once per round. Sig Skills: pay ◆, any time.</li>
      <li>Enchant &amp; Rite only enter play via Paid. End: telegraph fires (−1/Stagger), next revealed, Guard fades.</li>
    </ol><div class="mini2">Blight: end of afflicted side's turn — 1 dmg per token, remove 1.</div></div>`,
    name: 'Combat in Brief', paidHtml: '', payload: null, foot: p.name, badge: p.badge,
  });
}

for (const p of [...PRESETS, NEUTRAL]) {
  for (const c of p.cards)
    for (let i = 1; i <= c.n; i++) cells.push(playerCell(p, c, i));
  cells.push(refGlyphCell(p), refRulesCell(p));
}

for (const g of SIGS)
  cells.push(face(S[g.stance], `${COLOR[g.stance]} · SIGNATURE`, {
    rarity: `COST ${g.cost}`, freeIcon: `<span class="bigcost">${g.cost}◆</span>`, freeVal: '',
    art: icon(g.art, 'art-ic'), name: g.nm,
    paidHtml: `<div class="cpaid">${CUBE}<span>${boldKw(g.text)}</span></div>`,
    payload: null, foot: 'SIGNATURE SKILL', cls: 'sig',
  }));

for (const e of ENEMIES) {
  for (const [tier, list] of Object.entries(e.tiers))
    for (const [nm, n] of list)
      for (let i = 1; i <= n; i++)
        cells.push(face(S.foe, `${e.name} · ${tier}`, {
          rarity: n > 1 ? `${i}/${n}` : '', freeIcon: null, freeVal: '',
          art: icon(e.cards[nm].art, 'art-ic'), name: nm,
          paidHtml: `<div class="cpaid">${boldKw(e.cards[nm].fx)}</div>`,
          payload: null, foot: `stack ${tier === 'APPROACH' ? 'TOP' : tier === 'PRESS' ? 'MIDDLE' : 'BOTTOM'}`, cls: 'foe',
        }));
  cells.push(face(S.foe, `${e.name} · LAST STAND`, {
    rarity: 'SET ASIDE', freeIcon: null, freeVal: '',
    art: icon('enrage', 'art-ic'), name: 'Enrage',
    paidHtml: `<div class="cpaid">When the deck empties: flip the discard face-down unshuffled (same order = new deck), leave this face-up. All its Attacks are +1 from now on.</div>`,
    payload: null, foot: e.name, cls: 'foe',
  }));
}

const pages = [];
for (let i = 0; i < cells.length; i += 9)
  pages.push(`<div class="page"><div class="grid">${cells.slice(i, i + 9).join('')}</div></div>`);

// v2 PATCH PAGE (last page): only the five changed cards — print this page alone
// to upgrade a sleeved v1 kit (swap: Circular Argument ×3 → The Deep File ×3,
// Dead Air ×1, White Heat ×1).
{
  const st = PRESETS[0], fo = PRESETS[3];
  const patchCells = [];
  const deep = st.cards.find(c => c.nm === 'The Deep File');
  for (let i = 1; i <= deep.n; i++) patchCells.push(playerCell(st, deep, i));
  patchCells.push(playerCell(st, st.cards.find(c => c.nm === 'Dead Air'), 1));
  patchCells.push(playerCell(fo, fo.cards.find(c => c.nm === 'White Heat'), 1));
  pages.push(`<div class="page"><div class="grid">${patchCells.join('')}</div></div>`);
}

const enemySheets = ENEMIES.map(e => `
  <div class="sheet">
    <h3>${e.name} <span class="hp">HP ${e.hp}</span></h3>
    <table>${Object.entries(e.tiers).map(([t, list]) =>
      `<tr><th>${t}</th><td>${list.map(([nm, n]) => `${nm} ×${n}`).join(' · ')}</td></tr>`).join('')}
    </table>
    <p>${e.easy}<br>${e.hard}</p>
  </div>`).join('');

const masterGlyphs = Object.keys(GLYPH).map(g =>
  `<div class="gr">${icon(GLYPH[g], 'gl-s')}<b>${g}</b><span>${GLYPH_GLOSS[g]}</span></div>`).join('');

const ref = `
<div class="page ref">
  <h1>Axiomancer: Table Edition — Reference (P1 prototype · kit v2)</h1>
  <p class="small"><b>v2 changes (2026-07-22, sim-tested):</b> Standstill — <b>The Deep File</b> (ENCH ×3)
  replaces Circular Argument; <b>Dead Air</b> now deals 3 when the telegraph is at 0.
  Foundry — <b>White Heat</b> needs only its own die (4 dmg, 6 on SPECIAL). The last page of
  this kit is a patch page holding just these five cards — print it alone to upgrade a v1 kit.</p>
  <div class="cols">
  <section>
  <h2>Setup</h2>
  <p>You: 30 Vitae · shuffle your 20-card deck, draw 5 · Conviction 0, momentum chain empty ·
  choose 2 Signature Skills · take your 4 dice: <b>RED</b> (Body), <b>BLUE</b> (Mind), <b>PURPLE</b>
  (Heart), <b>GOLD</b> (wild). Enemy: build its three tiers per its sheet (shuffle each tier
  separately, stack APPROACH on top, FURY on bottom — <b>never shuffle the deck again</b>),
  set its Enrage card aside, reveal the top card: that is its first telegraph.</p>
  <h2>The dice (spec 33 faces — plain d6s + this legend)</h2>
  <p>RED / BLUE / PURPLE: <b>1 = SPECIAL · 2–3 = MANA · 4–6 = MISS</b>.
  GOLD: <b>1 = SPECIAL · 2 = MANA · 3–6 = MISS</b>.<br>
  MANA and SPECIAL are <em>usable</em> faces. <b>The five card colors (the rail):</b>
  RED / BLUE / PURPLE cards are paid only by their own color's die. <b>GREY</b> cards
  (the Koinē — the common tongue; utilities, never theme-bound) are paid by ANY color.
  <b>GOLD</b> cards (each deck's Axioms — its 1–2 mightiest) are paid ONLY by the gold die.
  The gold die itself is wild: its usable faces pay any card. <b>A MISS is a dead die</b> —
  nothing spends it; it is revived only by Press Fate, TEMPER, or a printed card effect.
  (Playtest variant to try: GREY cards payable by MISSES — giving dead dice a common tongue.)
  A SPECIAL pays <b>+2 CONVICTION (◆)</b> when spent — Conviction is its own economy
  (dial or token pool).
  <b>Press Fate:</b> spend 1◆ to reroll ALL your MISS dice, once per round.
  <b>Discard:</b> discarding a card from your hand gains you 1◆.
  TEMPER turns a die to a better face: MISS → MANA → SPECIAL.
  KINDLE / bonus dice: gold, this turn only, max 1 at a time.</p>
  </section>
  <section>
  <h2>Momentum &amp; Surge Bursts</h2>
  <p>Every <b>Paid</b> play moves your momentum chain: enter or advance the cycle
  <b>HEART → BODY → MIND → HEART</b> (any entry point). A Paid play of any other color —
  <em>including the color you are already on</em> — breaks the chain to empty. The chain
  persists between rounds. Completing the third link is a <b>SURGE BURST</b>: gain a
  temporary <b>gold die</b> (roll it now; it is yours until spent, this combat), then the
  chain resets. FREE plays never touch the chain — unless a <b>SURGE</b> charge arms them
  (the glyph: your next FREE play advances the chain 1, any color). Track the chain with a
  cube on a 3-slot H→B→M strip, or a spare die turned to 1/2/3.</p>
  <h2>Your turn</h2>
  <ol>
    <li>Draw up to a hand of 5. (Your deck reshuffles when empty; the enemy's never does.)</li>
    <li>Roll your 4 dice.</li>
    <li>Play any number of cards. <b>The FREE glyph costs nothing — no die</b> (top-left
    glyph, value inside). To use the <b>Paid</b> line instead, spend one usable die of the
    card's <b>rail color</b> (GREY cards: any color; GOLD cards: gold die only; the gold die
    pays anything). <b>Enchantments and Rites enter play only via their
    Paid line</b> — played free, the glyph is a one-shot and the card is discarded.
    <b>A SPECIAL pays +2 Conviction (◆) when spent.</b>
    You may also discard a card from hand at any time on your turn: +1◆.</li>
    <li>Signature Skills: any time on your turn, pay their ◆ cost.</li>
    <li>End: the telegraph resolves (−1 power per Stagger token; at 0 it fizzles), a new
    telegraph is revealed, your Guard fades (unless "persists").</li>
  </ol>
  <p><b>Timing rule (the only one):</b> everything you play resolves before the telegraph fires.</p>
  <p><b>Blight:</b> at the end of the afflicted side's turn it takes 1 damage per Blight token,
  then removes 1 token. Max 6.</p>
  </section>
  </div>
</div>
<div class="page ref">
  <h1>Legend &amp; appendix</h1>
  <div class="cols">
  <section>
  <h2>Master glyph &amp; keyword legend</h2>
  <div class="grs master">${masterGlyphs}</div>
  </section>
  <section>
  <h2>Card types</h2>
  <p><b>SPELL</b> resolve &amp; discard · <b>ENCH</b> stays in play (max 3) ·
  <b>CURSE</b> lives in the enemy deck · <b>RITE</b> collects Charge, sacrifice at
  threshold — only one Rite in play at a time. Enchant/Rite only via Paid.</p>
  <p><b>Curses (HEX):</b> free = slide it into the enemy deck 2 cards below the top; paid =
  place it on top. When revealed it fires its "when drawn" line, goes to the fired-Curse pile,
  and the enemy keeps revealing until a real card lands.</p>
  <p><b>Win / lose:</b> enemy at 0 HP wins you the fight; you at 0 Vitae lose it.</p>
  <h2>Tokens &amp; currencies (use coins/beads/dials)</h2>
  <p>Tokens: BLIGHT · GUARD · THORNS (max 3) · STAGGER (on the telegraph) · CHARGE (on your
  one Rite). Currencies &amp; trackers: CONVICTION ◆ (dial or pool) · momentum chain
  (cube on an H→B→M strip). Cards are poker-sized (2.5×3.5") — standard sleeves fit.</p>
  <p><b>First fights:</b> 1. Contagion vs Skulk · 2. Foundry vs Brute · 3. Bastion vs
  Shellback · 4. Malison vs anything · then free play. Target fight length: 8–14 enemy
  turns. Log every confusion — each one is a rules bug.</p>
  <p class="credit">Icons: game-icons.net contributors (Lorc, Delapouite, sbed, Skoll &amp;
  others), CC BY 3.0.</p>
  </section>
  </div>
</div>`;

const enemyPage = `
<div class="page ref">
  <h1>The Enemy — sheets &amp; how it thinks</h1>
  <h2>The deck IS the AI</h2>
  <p>The enemy has no hand, makes no decisions, and never "chooses" a play. Each enemy turn it
  does exactly two things: <b>(1) resolve its face-up telegraph</b> (minus 1 power per Stagger
  token; at 0 it fizzles to the discard), then <b>(2) reveal the top card of its deck</b> —
  that card is the new telegraph, played openly, one turn early. It draws exactly one card per
  turn and always plays it; the reveal <em>is</em> the draw <em>and</em> the play. You always
  see tomorrow.</p>
  <p>Its personality lives entirely in how its deck was <b>built</b>, not in rules: the three
  stacked tiers (APPROACH on top, then PRESS, FURY at the bottom — shuffled within a tier,
  never shuffled again) are its story arc — it opens cautious and dies furious. The
  duplication counts are its temperament (many weak cards = a chip-damage nuisance; stacked
  haymakers = a slugger). Difficulty never changes the rules — it only re-recipes the tiers.</p>
  <p><b>More than one action:</b> only when a revealed card prints <span class="mono">"Reveal
  the next card too"</span> — then both sit face-up and resolve on its turn, and you saw both
  coming. <b>Outside cards:</b> your Curses are the only intruders in its deck; when one is
  revealed it fires immediately, goes to the fired-Curse pile, and the enemy keeps revealing
  until a real card lands — a Curse costs it tempo, never just health. <b>Deck out = Last
  Stand:</b> flip the discard face-down unshuffled (the same sequence replays), set its Enrage
  card face-up: all its Attacks are +1 from now on. Zero shuffling, ever — the fight stays
  readable to the end, and a rubber band around the deck is a save file.</p>
  <p>Enemy GUARD and THORNS tokens work exactly as yours do.</p>
  <h2>Enemy sheets (Standard tier builds)</h2>
  ${enemySheets}
  <p class="small">Difficulty swaps change tier composition only — this knob is the
  playtest's primary hypothesis; take notes.</p>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Axiomancer Table Edition — Print Kit v2</title>
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: Georgia, serif; color: #1c1c1c; }
  .page { width: 8.5in; height: 11in; padding: 0.25in 0.5in; page-break-after: always; }
  .grid { display: grid; grid-template-columns: repeat(3, 2.5in); grid-auto-rows: 3.5in; }
  .card { border: 1px solid #999; display: flex; overflow: hidden; }
  .rail { width: 0.22in; flex: none; background: linear-gradient(var(--c), color-mix(in srgb, var(--c) 55%, #000));
    display: flex; align-items: center; justify-content: center; }
  .rvert { writing-mode: vertical-rl; transform: rotate(180deg); color: rgba(255,255,255,.92);
    font-family: 'Arial Narrow', Consolas, sans-serif; font-weight: bold; font-size: 7pt;
    letter-spacing: 0.18em; white-space: nowrap; max-height: 3.3in; }
  .bd { flex: 1; display: flex; flex-direction: column; padding: 0.06in 0.09in; min-width: 0; position: relative; }
  .pbadge { position: absolute; right: 0.05in; bottom: 0.04in; }
  .pb-ic { width: 0.19in; height: 0.19in; color: #4a4a4a; opacity: 0.8; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .cfree { position: relative; width: 0.52in; height: 0.52in; }
  .cfree .ic { width: 100%; height: 100%; color: var(--c); }
  .cfreeval { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: Consolas, monospace; font-size: 13pt; font-weight: bold; color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,.9);
    background: radial-gradient(circle, rgba(10,10,16,.62) 0%, rgba(10,10,16,.62) 26%, transparent 33%); }
  .bigcost { font-family: Consolas, monospace; font-size: 17pt; font-weight: bold; color: var(--c); }
  .crarity { font-family: 'Arial Narrow', Consolas, sans-serif; font-size: 6.4pt; font-weight: bold;
    letter-spacing: 0.1em; color: var(--c); border: 1px solid var(--c); padding: 0.5px 4px; }
  .cart { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; padding: 0.02in 0; }
  .art-ic { width: 0.95in; height: 0.95in; color: var(--c); opacity: 0.55; }
  .cbtm { }
  .cname { font-family: 'Palatino Linotype', Palatino, Georgia, serif; font-weight: bold;
    font-size: 12pt; line-height: 1.05; text-wrap: balance; }
  .crule { height: 1px; background: #bbb; margin: 3px 0 4px; }
  .cpaid { display: flex; gap: 5px; align-items: flex-start; font-size: 8.4pt; line-height: 1.28; padding-right: 0.12in; }
  .cpaid b { font-family: 'Arial Narrow', Consolas, sans-serif; font-size: 8pt; letter-spacing: 0.04em;
    color: var(--c); text-transform: uppercase; }
  .ccube { width: 0.14in; height: 0.14in; flex: none; margin-top: 1px; }
  .payload { font-size: 7.8pt; line-height: 1.25; color: #444; padding-top: 3px; }
  .foot { margin-top: auto; font-family: Consolas, monospace; font-size: 6pt;
    letter-spacing: 0.12em; color: #777; text-align: center; padding-top: 2px; }
  .card.foe .bd { background: #f2f2f2; }
  .card.sig .bd { background: #fbf7ea; }
  .grs { display: flex; flex-direction: column; gap: 4px; width: 100%; }
  .gr { display: grid; grid-template-columns: 0.22in auto 1fr; gap: 4px; align-items: start;
    font-size: 6.8pt; line-height: 1.2; }
  .gr b { font-family: Consolas, monospace; font-size: 6.8pt; padding-top: 1px; }
  .gr span { color: #444; }
  .gl-s { width: 0.2in; height: 0.2in; color: var(--c, #1c1c1c); flex: none; }
  .refwrap { display: flex; flex-direction: column; width: 100%; height: 100%; overflow: hidden; }
  .mini { padding-left: 11px; font-size: 6.6pt; line-height: 1.25; width: 100%; }
  .mini li { margin-bottom: 1.5px; }
  .mini2 { font-size: 6.8pt; color: #444; padding-top: 3px; }
  .ref { font-size: 9.5pt; }
  .ref h1 { font-family: 'Palatino Linotype', serif; font-size: 15pt; margin-bottom: 8px; }
  .ref h2 { font-family: 'Palatino Linotype', serif; font-size: 11pt; margin: 10px 0 4px; }
  .ref p, .ref li { line-height: 1.35; margin-bottom: 4px; }
  .ref ol { padding-left: 16px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25in; }
  .grs.master .gr { font-size: 8pt; }
  .grs.master .gl-s { color: #1c1c1c; }
  .credit { font-size: 7.5pt; color: #777; margin-top: 10px; }
  .sheet { border: 1px solid #999; padding: 8px 10px; margin: 8px 0; }
  .sheet h3 { font-family: 'Palatino Linotype', serif; font-size: 12pt; }
  .sheet .hp { float: right; font-family: Consolas, monospace; }
  .sheet table { border-collapse: collapse; margin: 4px 0; }
  .sheet th { font-family: Consolas, monospace; font-size: 7.5pt; text-align: left; padding-right: 8px; }
  .sheet td { font-size: 9pt; }
  .sheet p { font-size: 8.5pt; color: #444; }
</style></head><body>${ref}${pages.join('')}${enemyPage}</body></html>`;

writeFileSync(new URL('./cards-v2.html', import.meta.url), html);
console.log(`cards: ${cells.length} · card pages: ${pages.length} · total pages: ${pages.length + 3}`);
if (missing.size) console.log('MISSING ICONS: ' + [...missing].join(', '));
else console.log('all icons resolved');
