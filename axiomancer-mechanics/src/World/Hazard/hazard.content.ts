/**
 * Hazard Minigame v2 — authored content.
 *
 * Card and reward data is a faithful port of the design-handoff
 * prototype (`hazard-proto-engine.jsx`). Route thresholds are RETUNED
 * for the no-re-cast dice doctrine (the prototype assumed a fresh cast
 * every round; this build rolls 4 dice once per hazard) — tuning
 * evidence lives in `src/World/Hazard/e2e/hazard.balance.sim.test.ts` and
 * the rationale in `docs/hazard-balance-recommendations.md`.
 */

import { HAZARD_TUNING } from './hazard.tuning';
import type {
    HazardCardDef,
    HazardConsequenceId,
    HazardDef,
    HazardKeywordId,
    HazardProgressKey,
    HazardRewardId,
    HazardSubquestDef,
} from './hazard.types';

/** Card stat bands — the magnitudes the library draws from (see tuning). */
const C = HAZARD_TUNING.cards;
const U = C.utility;
/** Reward-pool expansion magnitudes (2026-06-11 roster). */
const X = C.expansion;
/** Codex-library magnitudes (2026-06-13 — the 150-card roster). */
const CX = C.codex;
/** Sub-quest tuning (reward magnitudes + thresholds). */
const Q = HAZARD_TUNING.subquests;

// ---------------------------------------------------------------------------
// Keyword glossary (tap-to-read detail)
// ---------------------------------------------------------------------------

export const HAZARD_KEYWORDS: Record<HazardKeywordId, { name: string; desc: string }> = {
    surge: { name: 'SURGE', desc: 'Drop a matching-colour die on this card for its stronger, lower effect.' },
    force: { name: 'FORCE', desc: 'Brawn against the rock — fills the FORCE meter.' },
    escape: { name: 'ESCAPE', desc: 'Speed across the gap — fills the ESCAPE meter.' },
    convert: { name: 'CONVERT', desc: 'Turn hostile ✕-dice into wild GOLD dice. Minor turns one; major turns them all.' },
    draw: { name: 'DRAW', desc: 'Pull more cards into your hand — more ways to cross.' },
    recast: { name: 'RE-CAST', desc: 'Re-roll all your unspent dice into fresh faces.' },
    gilded: { name: 'GILDED', desc: 'Yellow cards are rare. They give a major effect for free; apply a yellow die to add their numbers.' },
    salvage: { name: 'SALVAGE', desc: 'Drag this card to the bin to scrap it for a lesser benefit instead of playing it.' },
    crack: { name: 'CRACK', desc: 'Dead weight. This card does nothing and cannot be powered. It only clogs your hand.' },
    twotone: { name: 'TWO-TONE', desc: 'Either of two colours of die can power this card.' },
    enchant: { name: 'ENCHANT', desc: 'A lasting boon — it adds to every matching card you play for the rest of the hazard.' },
    burst: { name: 'BURST', desc: 'A one-round shove — its progress counts THIS round only, then is spent.' },
    rally: { name: 'RALLY', desc: 'Each unspent mana die you still hold adds progress this round.' },
    sacrifice: { name: 'SACRIFICE', desc: 'Pay VITAE now for a surge of progress this round.' },
    vow: { name: 'VOW', desc: 'Primes a one-time boon onto the next wild GOLD die you spend.' },
    choose: { name: 'CHOOSE', desc: 'You pick which meter its powered value feeds when you apply it.' },
    purge: { name: 'PURGE', desc: 'Cuts CRACK dead weight out of your deck for the rest of this crossing. Minor cuts one; major scours hand, pile, and discard.' },
    transmute: { name: 'TRANSMUTE', desc: "Recolors your unspent dice to this card's colour. Minor turns one; major turns them all. Hostile ✕ stays hostile." },
    mend: { name: 'MEND', desc: 'Restores VITAE when you claim a survived crossing. A failure forfeits the cure.' },
    bounty: { name: 'BOUNTY', desc: 'Banks shillings paid out when you claim a survived crossing. A failure forfeits the purse.' },
    ward: { name: 'WARD', desc: "Blunts the route's VITAE penalty for lost rounds, down to nothing." },
    anchor: { name: 'ANCHOR', desc: 'Sets a momentum FLOOR — you carry at least this much into the next round, even off a failed round.' },
    foretell: { name: 'FORETELL', desc: 'Look at the top cards of your deck and put them back in any order. Powered: also discard one of them.' },
    echo: { name: 'ECHO', desc: 'Adds bonus progress for each card you already played this round. The later you play it, the bigger the payoff.' },
    scour: { name: 'SCOUR', desc: 'Look at the top cards and permanently discard any number of them — they leave your deck for good. Thinning.' },
    jeopardy: { name: 'JEOPARDY', desc: 'Grants bonus progress when you have already lost a round this crossing. Worst situations bring out the best.' },
    miracle: { name: 'MIRACLE', desc: 'Grants a bonus when played first in a round — before any other card is applied. Lead with it.' },
    buyback: { name: 'BUYBACK', desc: 'When powered by a die, this card returns to your hand after the round instead of going to the discard pile.' },
    delve: { name: 'DELVE', desc: 'Grants bonus progress for each card already in your discard pile. The more you have spent, the harder it hits.' },
};

// ---------------------------------------------------------------------------
// The draw deck. kind = colour. f/e = FREE values; fp/ep = SURGE values.
// weight = relative frequency in the starter draw bag.
// ---------------------------------------------------------------------------

export const HAZARD_DECK: HazardCardDef[] = [
    // RED — pure FORCE numbers (single meter), considerably higher than purple.
    // STONE STEPS: weight:0 keeps the def for legacy saves; new games use IRON WILL instead.
    { id: 'steps', name: 'STONE STEPS', kind: 'red', rarity: 'common', weight: 0, f: C.redBlue.common.free, e: 0, fp: C.redBlue.common.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Kick footholds into the failing rock.', keywords: ['force', 'surge'] },
    { id: 'haul', name: 'DEAD-MAN HAUL', kind: 'red', rarity: 'common', weight: 1, f: C.redBlue.common.free, e: 0, fp: C.redBlue.common.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'Drag yourself up by rope and will.', keywords: ['force', 'surge'] },
    { id: 'grip', name: 'IRON GRIP', kind: 'red', rarity: 'uncommon', weight: 1, f: C.redBlue.uncommon.free, e: 0, fp: C.redBlue.uncommon.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Hands like a closing vise.', keywords: ['force', 'surge'] },

    // BLUE — pure ESCAPE numbers (single meter).
    { id: 'scram', name: 'SCRAMBLE', kind: 'blue', rarity: 'common', weight: 1, f: 0, e: C.redBlue.common.free, fp: 0, ep: C.redBlue.common.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Half-fall, half-fly across the gap.', keywords: ['escape', 'surge'] },
    { id: 'runner', name: 'CLIFFRUNNER', kind: 'blue', rarity: 'common', weight: 1, f: 0, e: C.redBlue.common.free, fp: 0, ep: C.redBlue.common.powered, salvage: { type: 'mana' }, flavor: 'Momentum is the only thing holding you up.', keywords: ['escape', 'surge'] },
    { id: 'leap', name: 'FAITH LEAP', kind: 'blue', rarity: 'uncommon', weight: 1, f: 0, e: C.redBlue.uncommon.free, fp: 0, ep: C.redBlue.uncommon.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Close your eyes. Trust the far side.', keywords: ['escape', 'surge'] },

    // PURPLE — low DUAL number (both meters) + a MINOR utility that the die
    // upgrades to MAJOR. The die powers the utility, not the number, so the
    // powered numbers match the free ones by design.
    { id: 'footing', name: 'SURE FOOTING', kind: 'purple', rarity: 'common', weight: 3, f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Read the ledge, then send your eyes ahead.', keywords: ['draw', 'surge'] },
    { id: 'windread', name: 'READ THE WIND', kind: 'purple', rarity: 'common', weight: 2, f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'convert', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Let the valley turn the hostile gust to your back.', keywords: ['convert', 'surge'] },
    { id: 'pole', name: 'BALANCE POLE', kind: 'purple', rarity: 'uncommon', weight: 2, f: C.purple.strong, e: C.purple.strong, fp: C.purple.strong, ep: C.purple.strong, effect: 'recast', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Weight in both hands; shake the dice loose and begin again.', keywords: ['recast', 'surge'] },

    // GOLD ("YELLOW") — utility-FIRST: a MAJOR effect for free, and a high
    // DUAL number that only appears once a (wild) gold die is applied. Rare.
    { id: 'oath', name: 'UNBROKEN OATH', kind: 'gold', rarity: 'rare', weight: 1, f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'draw', majorEffect: true, drawBase: U.drawMajor, drawPowered: U.drawMajor, salvage: { type: 'mana' }, flavor: 'You will not fall. You refuse — and the path answers.', keywords: ['gilded', 'draw', 'surge'] },
    { id: 'blessing', name: "PILGRIM'S BLESSING", kind: 'gold', rarity: 'rare', weight: 1, f: C.gold.free, e: C.gold.free, fp: C.gold.strongPowered, ep: C.gold.strongPowered, effect: 'recast', majorEffect: true, salvage: { type: 'mana' }, flavor: 'Something older than the cliff steadies your hand.', keywords: ['gilded', 'recast', 'surge'] },

    // ── KEYWORD EXPANSION (2026-06-25) — 3 starter cards replace 3 STONE STEPS ──

    // STEADIED HAND: teaches ENCHANT. Free dual + aura on surge.
    { id: 'steadied', name: 'STEADIED HAND', kind: 'purple', rarity: 'common', weight: 1, f: 1, e: 1, fp: 1, ep: 1, effect: 'aura', auraBase: { auraForce: 1 }, auraPowered: { auraForce: 1 }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The grip tightens. The ledge does not.', keywords: ['enchant', 'surge'] },

    // FORK IN THE ROAD: teaches CHOOSE. Small free dual + choose-a-meter on surge.
    { id: 'fork', name: 'FORK IN THE ROAD', kind: 'purple', rarity: 'common', weight: 1, f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, choose: true, salvage: { type: 'mana' }, flavor: 'Two paths diverge. You choose which stone holds your weight.', keywords: ['choose', 'surge'] },

    // IRON WILL: teaches ANCHOR. Common-stat force card + momentum floor on surge.
    // Uses common (not uncommon) numbers so the ANCHOR is the value, not raw force.
    { id: 'ironwill', name: 'IRON WILL', kind: 'red', rarity: 'uncommon', weight: 1, f: C.redBlue.common.free, e: 0, fp: C.redBlue.common.powered, ep: 0, effect: 'anchor', anchorBase: CX.anchor.minor, anchorPowered: CX.anchor.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The cliff takes what it wants. The rest is yours.', keywords: ['force', 'anchor', 'surge'] },

    // ── heavy-swap starters (2026-06-26) ────────────────────────────────────
    // SPITE: teaches JEOPARDY. Red — gets stronger after a failed round.
    { id: 'spite', name: 'SPITE', kind: 'red', rarity: 'common', weight: 2, f: C.redBlue.common.free, e: 0, fp: C.redBlue.common.powered, ep: 0, jeopardyForce: CX.jeopardy.minor, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The fall only makes the grip angrier.', keywords: ['force', 'jeopardy', 'surge'] },

    // FIRSTLIGHT: teaches MIRACLE. Purple — big dual bonus if played first.
    { id: 'firstlight', name: 'FIRSTLIGHT', kind: 'purple', rarity: 'common', weight: 2, f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, firstPlayForce: CX.miracle.minor, firstPlayEscape: CX.miracle.minor, salvage: { type: 'mana' }, flavor: 'The first step taken in light — before doubt can follow.', keywords: ['miracle', 'surge'] },

    // REFRAIN: teaches BUYBACK. Purple uncommon — returns to hand when powered.
    { id: 'refrain', name: 'REFRAIN', kind: 'purple', rarity: 'uncommon', weight: 1, f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, buyback: true, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The path repeats. You are more ready for it this time.', keywords: ['buyback', 'surge'] },
];

/**
 * Consequence CRACK card — shuffled into the persistent deck by the
 * `deadcard` consequence. Dead: no values, never powerable.
 */
export const HAZARD_CRACK_CARD: HazardCardDef = {
    id: 'crack', name: 'CRACK', kind: 'purple', rarity: 'common', f: 0, e: 0, fp: 0, ep: 0,
    dead: true, flavor: 'The flaw travels with you now.', keywords: ['crack'],
};

// ---------------------------------------------------------------------------
// Reward-card pool (offered after a clear; picked cards join the deck)
// ---------------------------------------------------------------------------

export const HAZARD_REWARD_CARDS: HazardCardDef[] = [
    // commons / uncommons — clean numbers
    { id: 'r_grip', name: 'GREATGRIP', kind: 'red', rarity: 'common', f: C.redBlue.reward.free, e: 0, fp: C.redBlue.reward.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Hands like vise-iron.', keywords: ['force', 'surge'] },
    { id: 'r_wind', name: 'TAILWIND', kind: 'blue', rarity: 'common', f: 0, e: C.redBlue.reward.free, fp: 0, ep: C.redBlue.reward.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The valley breathes you onward.', keywords: ['escape', 'surge'] },
    { id: 'r_even', name: 'EVENKEEL', kind: 'purple', rarity: 'uncommon', f: C.purple.strong, e: C.purple.strong, fp: C.purple.strong, ep: C.purple.strong, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'mana' }, flavor: 'Neither rushed nor rooted — and one eye further down the path.', keywords: ['draw', 'surge'] },
    { id: 'r_conv', name: 'HEX-BREAKER', kind: 'purple', rarity: 'uncommon', f: C.purple.free, e: C.purple.free, fp: C.purple.free, ep: C.purple.free, effect: 'convert', salvage: { type: 'mana' }, flavor: 'Unmake the hostile die and steady your feet.', keywords: ['convert', 'surge'] },
    // rare red/blue — number cards that ALSO carry a minor utility (the die
    // still upgrades the number; the small utility fires for free).
    { id: 'r_seer', name: 'FAR-SEER', kind: 'red', rarity: 'rare', f: C.redBlue.uncommon.free, e: 0, fp: C.redBlue.uncommon.powered, ep: 0, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorBase, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Strength, and the wit to see where to spend it.', keywords: ['force', 'draw', 'surge'] },
    { id: 'r_gale', name: 'GALE-READER', kind: 'blue', rarity: 'rare', f: 0, e: C.redBlue.uncommon.free, fp: 0, ep: C.redBlue.uncommon.powered, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorBase, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Speed, and the eyes to aim it.', keywords: ['escape', 'draw', 'surge'] },
    // rare gold — utility-first, dual numbers on a wild die
    { id: 'r_oath', name: 'UNBROKEN OATH', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'draw', majorEffect: true, drawBase: U.drawMajor, drawPowered: U.drawMajor, salvage: { type: 'mana' }, flavor: 'You will not fall. You refuse.', keywords: ['gilded', 'draw', 'surge'] },
    { id: 'r_crown', name: 'CROWN RELIC', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.strongPowered, ep: C.gold.strongPowered, effect: 'recast', majorEffect: true, salvage: { type: 'mana' }, flavor: 'A king died wearing this on a worse ledge.', keywords: ['gilded', 'recast', 'surge'] },

    // ====================================================================
    // EXPANSION ROSTER (2026-06-11) — all reward-pool; balance sim untouched.
    // ====================================================================

    // --- Two-tone pivots: free one meter, surge the OTHER (bigger). Either a
    //     red OR a blue die powers them. ---
    { id: 'r_pivot', name: 'STORM PIVOT', kind: 'red', colors: ['red', 'blue'], rarity: 'uncommon', f: X.pivot.uncFree, e: 0, fp: 0, ep: X.pivot.uncPowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Plant your feet, then break and run.', keywords: ['force', 'escape', 'twotone', 'surge'] },
    { id: 'r_drop', name: 'DEADWEIGHT DROP', kind: 'blue', colors: ['red', 'blue'], rarity: 'uncommon', f: 0, e: X.pivot.uncFree, fp: X.pivot.uncPowered, ep: 0, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Stop running. Set your shoulder.', keywords: ['escape', 'force', 'twotone', 'surge'] },
    { id: 'r_last', name: 'LAST RESORT', kind: 'red', colors: ['red', 'blue'], rarity: 'rare', f: X.pivot.rareFree, e: 0, fp: 0, ep: X.pivot.rarePowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'When the rock wins, the gap is the only door.', keywords: ['force', 'escape', 'twotone', 'surge'] },

    // --- Lopsided purple duals (both meters, weighted). ---
    { id: 'r_heave', name: 'HEAVE-TO', kind: 'purple', rarity: 'uncommon', f: X.dual.strong, e: X.dual.weak, fp: X.dual.strongPowered, ep: X.dual.weakPowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Mostly muscle, a little flight.', keywords: ['force', 'escape', 'surge'] },
    { id: 'r_skitter', name: 'SKITTER', kind: 'purple', rarity: 'uncommon', f: X.dual.weak, e: X.dual.strong, fp: X.dual.weakPowered, ep: X.dual.strongPowered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Mostly flight, a little grip.', keywords: ['force', 'escape', 'surge'] },

    // --- Number + utility hybrids. ---
    { id: 'r_path', name: 'PATHFINDER', kind: 'red', rarity: 'rare', f: X.hybrid.flatNumber, e: 0, fp: X.hybrid.flatNumber, ep: 0, effect: 'recast', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Strength, and the sense to re-throw.', keywords: ['force', 'recast', 'surge'] },
    { id: 'r_windcall', name: 'WINDCALLER', kind: 'blue', rarity: 'rare', f: 0, e: X.hybrid.flatNumber, fp: 0, ep: X.hybrid.flatNumber, effect: 'convert', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Run, and bend the curse as you pass.', keywords: ['escape', 'convert', 'surge'] },
    { id: 'r_stone', name: 'STONEREADER', kind: 'red', rarity: 'uncommon', f: X.hybrid.drawFree, e: 0, fp: X.hybrid.drawPowered, ep: 0, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'A foothold and a glance ahead.', keywords: ['force', 'draw', 'surge'] },
    { id: 'r_tide', name: 'TIDEREADER', kind: 'blue', rarity: 'uncommon', f: 0, e: X.hybrid.drawFree, fp: 0, ep: X.hybrid.drawPowered, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'A stride and a glance ahead.', keywords: ['escape', 'draw', 'surge'] },

    // --- Enchantments (auras): persist for the rest of the hazard. ---
    { id: 'r_aggr', name: 'AGGRESSION', kind: 'red', rarity: 'rare', f: X.aura.redBlueFree, e: 0, fp: X.aura.redBluePowered, ep: 0, effect: 'aura', auraBase: { auraForce: X.aura.redBlueAmount }, auraPowered: { auraForce: X.aura.redBlueAmount }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Stop climbing carefully. Climb angry.', keywords: ['force', 'enchant', 'surge'] },
    { id: 'r_swift', name: 'SWIFTNESS', kind: 'blue', rarity: 'rare', f: 0, e: X.aura.redBlueFree, fp: 0, ep: X.aura.redBluePowered, effect: 'aura', auraBase: { auraEscape: X.aura.redBlueAmount }, auraPowered: { auraEscape: X.aura.redBlueAmount }, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Once you start running you do not stop.', keywords: ['escape', 'enchant', 'surge'] },
    { id: 'r_zeal', name: 'ZEAL', kind: 'purple', rarity: 'rare', f: X.aura.purpleNumber, e: X.aura.purpleNumber, fp: X.aura.purpleNumber, ep: X.aura.purpleNumber, effect: 'aura', auraBase: { auraForce: X.aura.purpleMinor, auraEscape: X.aura.purpleMinor }, auraPowered: { auraForce: X.aura.purpleMajor, auraEscape: X.aura.purpleMajor }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Faith carries the whole body forward.', keywords: ['enchant', 'surge'] },
    { id: 'r_martyr', name: "MARTYR'S RESOLVE", kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.aura.goldNumber, ep: X.aura.goldNumber, effect: 'aura', majorEffect: true, auraBase: { auraForce: X.aura.goldAmount, auraEscape: X.aura.goldAmount }, auraPowered: { auraForce: X.aura.goldAmount, auraEscape: X.aura.goldAmount }, salvage: { type: 'mana' }, flavor: 'He decided not to die, and the cliff lost its vote.', keywords: ['gilded', 'enchant', 'surge'] },
    { id: 'r_relic', name: 'RELIC OF FURY', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.aura.goldNumber, ep: X.aura.goldNumber, effect: 'aura', majorEffect: true, auraBase: { surgeForce: X.aura.surgeBoost, surgeEscape: X.aura.surgeBoost }, auraPowered: { surgeForce: X.aura.surgeBoost, surgeEscape: X.aura.surgeBoost }, salvage: { type: 'mana' }, flavor: 'Every spell after this one bites harder.', keywords: ['gilded', 'enchant', 'surge'] },

    // --- Gold vow: one-shot priming on the next gold die used. ---
    { id: 'r_vow', name: 'GILDED VOW', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'goldvow', majorEffect: true, goldVow: { force: X.vow.force, escape: X.vow.escape }, salvage: { type: 'mana' }, flavor: 'Swear it on the gold, and the next throw answers.', keywords: ['gilded', 'vow'] },

    // --- Bursts (this-round-only). ---
    { id: 'r_serk', name: 'BERSERK', kind: 'red', rarity: 'uncommon', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: X.burst.base }, burstPowered: { force: X.burst.powered }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Everything you have, right now.', keywords: ['force', 'burst', 'surge'] },
    { id: 'r_bolt', name: 'BOLT', kind: 'blue', rarity: 'uncommon', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { escape: X.burst.base }, burstPowered: { escape: X.burst.powered }, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'One breath, one sprint.', keywords: ['escape', 'burst', 'surge'] },
    { id: 'r_warcry', name: 'WAR-CRY', kind: 'red', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstPerUnspentDieForce: X.burst.warcryPerDie, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'He counts what is left and throws all of it.', keywords: ['force', 'rally'] },
    { id: 'r_blood', name: 'BLOODPRICE', kind: 'red', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: X.burst.bloodForce }, burstPowered: { force: X.burst.bloodPowered }, vitaeCost: X.burst.bloodVitae, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The cliff takes its toll early, by arrangement.', keywords: ['force', 'sacrifice', 'surge'] },
    { id: 'r_pwrath', name: "PILGRIM'S WRATH", kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.burst.goldNumber, ep: X.burst.goldNumber, effect: 'burst', majorEffect: true, burstBase: { force: X.burst.goldDual, escape: X.burst.goldDual }, burstPowered: { force: X.burst.goldDual, escape: X.burst.goldDual }, salvage: { type: 'mana' }, flavor: 'The meek inherit nothing. He took the path by force.', keywords: ['gilded', 'burst', 'surge'] },

    // --- Choose (TWIN PATHS): powered value feeds one meter you pick. ---
    { id: 'r_twin', name: 'TWIN PATHS', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.choose, ep: X.choose, choose: true, salvage: { type: 'mana' }, flavor: 'Two ways down. Both yours.', keywords: ['gilded', 'choose', 'surge'] },

    // --- Tempo snowball. ---
    { id: 'r_saint', name: "SAINT'S PATIENCE", kind: 'purple', rarity: 'rare', f: X.saint.number, e: X.saint.number, fp: X.saint.number, ep: X.saint.number, effect: 'draw', drawBase: X.saint.draw, drawPowered: X.saint.draw, momentumBonus: X.saint.momentum, salvage: { type: 'mana' }, flavor: 'Bank the lead. Spend it later.', keywords: ['draw', 'surge'] },

    // ====================================================================
    // CODEX EXPANSION (2026-06-13) — the 150-card roster. All reward-pool;
    // the starter bag (and so the balance sim) is untouched. Numbers from
    // HAZARD_TUNING.cards.codex; six new mechanics: PURGE / TRANSMUTE /
    // MEND / BOUNTY / WARD / ANCHOR (engine support in hazard.engine.ts).
    // ====================================================================

    // --- RED — the FORCE ladder (12). -----------------------------------
    { id: 'x_shoulder', name: 'SET THE SHOULDER', kind: 'red', rarity: 'common', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The rock moves or the bone does.', keywords: ['force', 'surge'] },
    { id: 'x_oxback', name: 'OX-BACK CARRY', kind: 'red', rarity: 'common', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'He has carried worse, further, angrier.', keywords: ['force', 'surge'] },
    { id: 'x_splitter', name: 'KNUCKLE SPLITTER', kind: 'red', rarity: 'common', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The wall asked for a name. He gave it four.', keywords: ['force', 'surge'] },
    { id: 'x_haft', name: 'BROKEN HAFT', kind: 'red', rarity: 'common', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'Half a tool is still a lever.', keywords: ['force', 'surge'] },
    { id: 'x_pitonwork', name: 'PITON-WORK', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Iron teeth for a stone that bites.', keywords: ['force', 'surge'] },
    { id: 'x_mulekick', name: 'MULE KICK', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'Applied politely, to the hinge.', keywords: ['force', 'surge'] },
    { id: 'x_quarryman', name: "QUARRYMAN'S OATH", kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Stone owes him three generations of debt.', keywords: ['force', 'surge'] },
    { id: 'x_grindstone', name: 'GRINDSTONE HEART', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'It does not beat. It turns.', keywords: ['force', 'surge'] },
    { id: 'x_gatebreak', name: 'GATEBREAKER', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Doors are a suggestion he has stopped hearing.', keywords: ['force', 'surge'] },
    { id: 'x_titanrib', name: 'TITAN-RIB LEVER', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'Something vast died here. Put it to work.', keywords: ['force', 'surge'] },
    { id: 'x_avalanche', name: 'MEET THE AVALANCHE', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'It came down the mountain. He went up it.', keywords: ['force', 'surge'] },
    { id: 'x_lastnail', name: 'THE LAST NAIL', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, salvage: { type: 'mana' }, flavor: 'Driven by hand, into whatever argued.', keywords: ['force', 'surge'] },

    // --- BLUE — the ESCAPE ladder (12). ----------------------------------
    { id: 'x_eelstep', name: 'EEL-STEP', kind: 'blue', rarity: 'common', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Wet stone teaches fast or not at all.', keywords: ['escape', 'surge'] },
    { id: 'x_gutterrun', name: 'GUTTER RUN', kind: 'blue', rarity: 'common', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, salvage: { type: 'mana' }, flavor: 'The low road is faster. Mind your crown.', keywords: ['escape', 'surge'] },
    { id: 'x_catfall', name: 'CAT-FALL', kind: 'blue', rarity: 'common', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Land soft, owe nothing.', keywords: ['escape', 'surge'] },
    { id: 'x_ratline', name: 'RATLINE', kind: 'blue', rarity: 'common', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, salvage: { type: 'mana' }, flavor: 'Every wall has a seam. Every seam has a tenant.', keywords: ['escape', 'surge'] },
    { id: 'x_mistwalk', name: 'MIST-WALK', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Be where the fog is thickest and the ground is not.', keywords: ['escape', 'surge'] },
    { id: 'x_swiftcurrent', name: 'SWIFT CURRENT', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, salvage: { type: 'mana' }, flavor: 'Stop fighting the river. Become its errand.', keywords: ['escape', 'surge'] },
    { id: 'x_rooftoppath', name: 'ROOFTOP LITURGY', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Pray with your feet. The tiles answer.', keywords: ['escape', 'surge'] },
    { id: 'x_longstride', name: 'SEVEN-LEAGUE HABIT', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, salvage: { type: 'mana' }, flavor: 'Distance is a rumor he refuses to believe.', keywords: ['escape', 'surge'] },
    { id: 'x_ghostgait', name: 'GHOST-GAIT', kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.rare.free, fp: 0, ep: CX.numbers.rare.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'He passed. The dust never voted.', keywords: ['escape', 'surge'] },
    { id: 'x_stormswift', name: 'OUTRUN THE THUNDER', kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.rare.free, fp: 0, ep: CX.numbers.rare.powered, salvage: { type: 'mana' }, flavor: 'The flash is a starting gun.', keywords: ['escape', 'surge'] },
    { id: 'x_falconstoop', name: "FALCON'S STOOP", kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.rare.free, fp: 0, ep: CX.numbers.rare.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Down is just fast with commitment.', keywords: ['escape', 'surge'] },
    { id: 'x_threshold', name: 'OVER THE THRESHOLD', kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.rare.free, fp: 0, ep: CX.numbers.rare.powered, salvage: { type: 'mana' }, flavor: 'No door closes faster than he leaves.', keywords: ['escape', 'surge'] },

    // --- PURPLE — duals (10). ---------------------------------------------
    { id: 'x_evenbreath', name: 'EVEN BREATH', kind: 'purple', rarity: 'common', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'In through the fear, out through the work.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_pilgrimpace', name: "PILGRIM'S PACE", kind: 'purple', rarity: 'common', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Neither hurry nor halt. The road respects routine.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_doublegrip', name: 'DOUBLE GRIP', kind: 'purple', rarity: 'common', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, salvage: { type: 'mana' }, flavor: 'One hand for the rock, one for the leaving.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_walkingmeditation', name: 'WALKING RITE', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The prayer is the stride. The stride is the prayer.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_keelbalance', name: 'KEEL-BALANCE', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Weight where it serves. Nowhere else.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_ironlung', name: 'IRON LUNG', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'mana' }, flavor: 'The climb ran out of air before he did.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_wardenswalk', name: "WARDEN'S WALK", kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'mana' }, flavor: 'Patrol-pace: ready for the wall, ready for the run.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_twinoath', name: 'TWIN OATH', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.powered, ep: CX.dual.rare.powered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Sworn once to stand, once to leave standing.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_compassrose', name: 'COMPASS ROSE', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.powered, ep: CX.dual.rare.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'All directions considered. One survived.', keywords: ['force', 'escape', 'surge'] },
    { id: 'x_centerline', name: 'THE CENTER LINE', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.powered, ep: CX.dual.rare.powered, salvage: { type: 'mana' }, flavor: 'Between panic and paralysis runs a narrow, walkable line.', keywords: ['force', 'escape', 'surge'] },

    // --- GOLD — gilded utility leads (8). ---------------------------------
    { id: 'x_dawnpsalm', name: 'DAWN PSALM', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'draw', majorEffect: true, drawBase: U.drawMajor, drawPowered: U.drawMajor, salvage: { type: 'mana' }, flavor: 'Sing it and the day deals again.', keywords: ['gilded', 'draw', 'surge'] },
    { id: 'x_secondsun', name: 'SECOND SUN', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.strongPowered, ep: C.gold.strongPowered, effect: 'recast', majorEffect: true, salvage: { type: 'mana' }, flavor: 'When the first light fails, he carries a spare.', keywords: ['gilded', 'recast', 'surge'] },
    { id: 'x_alchemistgrace', name: "ALCHEMIST'S GRACE", kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'convert', majorEffect: true, salvage: { type: 'mana' }, flavor: 'Lead curses, gold answers.', keywords: ['gilded', 'convert', 'surge'] },
    { id: 'x_tithefinder', name: 'TITHE-FINDER', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'bounty', majorEffect: true, bountyBase: CX.bounty.rareMajor, bountyPowered: CX.bounty.rareMajor, salvage: { type: 'mana' }, flavor: 'Even the abyss keeps a purse, if you know where it hangs.', keywords: ['gilded', 'bounty', 'surge'] },
    { id: 'x_goldensalve', name: 'GOLDEN SALVE', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'mend', majorEffect: true, mendBase: CX.mend.rareMajor, mendPowered: CX.mend.rareMajor, salvage: { type: 'mana' }, flavor: 'Worth its weight in what it saves.', keywords: ['gilded', 'mend', 'surge'] },
    { id: 'x_aegisleaf', name: 'AEGIS-LEAF', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'ward', majorEffect: true, wardBase: CX.ward.major, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'Thin as scripture. Stops what scripture stops.', keywords: ['gilded', 'ward', 'surge'] },
    { id: 'x_keelstone', name: 'KEELSTONE', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'anchor', majorEffect: true, anchorBase: CX.anchor.major, anchorPowered: CX.anchor.major, salvage: { type: 'mana' }, flavor: 'Whatever the storm decides, the keel has already voted.', keywords: ['gilded', 'anchor', 'surge'] },
    { id: 'x_lastrelic', name: 'THE UNSPENT RELIC', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.strongPowered, ep: C.gold.strongPowered, effect: 'purge', majorEffect: true, salvage: { type: 'mana' }, flavor: 'It forgives the deck its flaws. All of them.', keywords: ['gilded', 'purge', 'surge'] },

    // --- TWO-TONE pivots (10). --------------------------------------------
    { id: 'x_hammerdash', name: 'HAMMER-AND-DASH', kind: 'red', colors: ['red', 'blue'], rarity: 'uncommon', f: CX.pivot.uncommon.free, e: 0, fp: 0, ep: CX.pivot.uncommon.powered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Hit it hard enough to apologise from a distance.', keywords: ['force', 'escape', 'twotone', 'surge'] },
    { id: 'x_slipanchor', name: 'SLIP THE ANCHOR', kind: 'blue', colors: ['red', 'blue'], rarity: 'uncommon', f: 0, e: CX.pivot.uncommon.free, fp: CX.pivot.uncommon.powered, ep: 0, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Run first. Throw the punch the moment they relax.', keywords: ['escape', 'force', 'twotone', 'surge'] },
    { id: 'x_brawlerfeint', name: "BRAWLER'S FEINT", kind: 'red', colors: ['red', 'purple'], rarity: 'uncommon', f: CX.pivot.uncommon.free, e: 0, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'mana' }, flavor: 'The fist is honest. The footwork lies.', keywords: ['force', 'twotone', 'surge'] },
    { id: 'x_mysticheave', name: 'MYSTIC HEAVE', kind: 'purple', colors: ['red', 'purple'], rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.pivot.uncommon.powered, ep: 0, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Lift with the legs. Finish with the will.', keywords: ['force', 'twotone', 'surge'] },
    { id: 'x_veilsprint', name: 'VEIL SPRINT', kind: 'blue', colors: ['blue', 'purple'], rarity: 'uncommon', f: 0, e: CX.pivot.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, salvage: { type: 'mana' }, flavor: 'Fast, and a little bit elsewhere.', keywords: ['escape', 'twotone', 'surge'] },
    { id: 'x_quietstep', name: 'THE QUIET STEP', kind: 'purple', colors: ['blue', 'purple'], rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: 0, ep: CX.pivot.uncommon.powered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Walk like a rumor: everywhere, unprovable.', keywords: ['escape', 'twotone', 'surge'] },
    { id: 'x_stormpivot', name: 'STORM-SPLIT', kind: 'red', colors: ['red', 'blue'], rarity: 'rare', f: CX.pivot.rare.free, e: 0, fp: 0, ep: CX.pivot.rare.powered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Stand in the thunder. Leave with the lightning.', keywords: ['force', 'escape', 'twotone', 'surge'] },
    { id: 'x_tidalturn', name: 'TIDAL TURN', kind: 'blue', colors: ['red', 'blue'], rarity: 'rare', f: 0, e: CX.pivot.rare.free, fp: CX.pivot.rare.powered, ep: 0, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The tide goes out swinging.', keywords: ['escape', 'force', 'twotone', 'surge'] },
    { id: 'x_redmonk', name: 'RED MONK MANTRA', kind: 'red', colors: ['red', 'purple'], rarity: 'rare', f: CX.pivot.rare.free, e: 0, fp: CX.dual.rare.powered, ep: CX.dual.rare.powered, salvage: { type: 'mana' }, flavor: 'Strength chanted until it answers to both names.', keywords: ['force', 'twotone', 'surge'] },
    { id: 'x_bluemonk', name: 'BLUE MONK MANTRA', kind: 'blue', colors: ['blue', 'purple'], rarity: 'rare', f: 0, e: CX.pivot.rare.free, fp: CX.dual.rare.powered, ep: CX.dual.rare.powered, salvage: { type: 'mana' }, flavor: 'Speed chanted until it forgets to leave him behind.', keywords: ['escape', 'twotone', 'surge'] },

    // --- DRAW engines (5). --------------------------------------------------
    { id: 'x_scoutreport', name: "SCOUT'S REPORT", kind: 'red', rarity: 'uncommon', f: X.hybrid.drawFree, e: 0, fp: X.hybrid.drawPowered, ep: 0, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Muscle, briefed.', keywords: ['force', 'draw', 'surge'] },
    { id: 'x_birdseye', name: "BIRD'S-EYE", kind: 'blue', rarity: 'uncommon', f: 0, e: X.hybrid.drawFree, fp: 0, ep: X.hybrid.drawPowered, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The crow owed him one.', keywords: ['escape', 'draw', 'surge'] },
    { id: 'x_mapfragment', name: 'MAP FRAGMENT', kind: 'purple', rarity: 'common', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Half a map beats a whole guess.', keywords: ['draw', 'surge'] },
    { id: 'x_lanternbearer', name: 'LANTERN-BEARER', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'draw', drawBase: U.drawMinorPowered, drawPowered: U.drawMajor, salvage: { type: 'mana' }, flavor: 'Where the light goes, options follow.', keywords: ['draw', 'surge'] },
    { id: 'x_inkfinch', name: 'THE INK FINCH', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'draw', drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, salvage: { type: 'mana' }, flavor: 'It sings in footnotes.', keywords: ['draw', 'surge'] },

    // --- RECAST / CONVERT (5). -----------------------------------------------
    { id: 'x_secondwind', name: 'SECOND WIND', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'recast', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The lungs remember what the legs forgot.', keywords: ['recast', 'surge'] },
    { id: 'x_diceofashes', name: 'DICE OF ASHES', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'recast', salvage: { type: 'mana' }, flavor: 'Burn the throw. Read the smoke. Throw again.', keywords: ['recast', 'surge'] },
    { id: 'x_hexwright', name: 'HEXWRIGHT', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'convert', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Curses are just blessings with bad posture.', keywords: ['convert', 'surge'] },
    { id: 'x_blackmillstone', name: 'BLACK MILLSTONE', kind: 'red', rarity: 'rare', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, effect: 'convert', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Grinds hostility into something spendable.', keywords: ['force', 'convert', 'surge'] },
    { id: 'x_sailmender', name: 'SAIL-MENDER', kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, effect: 'recast', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Torn luck, restitched mid-gale.', keywords: ['escape', 'recast', 'surge'] },

    // --- AURAS (6). -------------------------------------------------------------
    { id: 'x_warpaint', name: 'WAR-PAINT', kind: 'red', rarity: 'rare', f: X.aura.redBlueFree, e: 0, fp: X.aura.redBluePowered, ep: 0, effect: 'aura', auraBase: { auraForce: X.aura.redBlueAmount }, auraPowered: { auraForce: X.aura.redBlueAmount }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The colour of not stopping.', keywords: ['force', 'enchant', 'surge'] },
    { id: 'x_tailfeather', name: 'TAILFEATHER CHARM', kind: 'blue', rarity: 'rare', f: 0, e: X.aura.redBlueFree, fp: 0, ep: X.aura.redBluePowered, effect: 'aura', auraBase: { auraEscape: X.aura.redBlueAmount }, auraPowered: { auraEscape: X.aura.redBlueAmount }, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Borrowed from something that never touched the ground.', keywords: ['escape', 'enchant', 'surge'] },
    { id: 'x_communion', name: 'QUIET COMMUNION', kind: 'purple', rarity: 'rare', f: X.aura.purpleNumber, e: X.aura.purpleNumber, fp: X.aura.purpleNumber, ep: X.aura.purpleNumber, effect: 'aura', auraBase: { auraForce: X.aura.purpleMinor, auraEscape: X.aura.purpleMinor }, auraPowered: { auraForce: X.aura.purpleMajor, auraEscape: X.aura.purpleMajor }, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The path agrees to carry part of it.', keywords: ['enchant', 'surge'] },
    { id: 'x_chorus', name: 'CHORUS OF FOOTSTEPS', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.aura.goldNumber, ep: X.aura.goldNumber, effect: 'aura', majorEffect: true, auraBase: { auraForce: X.aura.goldAmount, auraEscape: X.aura.goldAmount }, auraPowered: { auraForce: X.aura.goldAmount, auraEscape: X.aura.goldAmount }, salvage: { type: 'mana' }, flavor: 'Every pilgrim who made it walks the last mile with you.', keywords: ['gilded', 'enchant', 'surge'] },
    { id: 'x_whetstonechant', name: 'WHETSTONE CHANT', kind: 'red', rarity: 'rare', f: X.aura.redBlueFree, e: 0, fp: X.aura.redBluePowered, ep: 0, effect: 'aura', auraBase: { surgeForce: X.aura.surgeBoost }, auraPowered: { surgeForce: X.aura.surgeBoost }, salvage: { type: 'mana' }, flavor: 'Every powered blow remembers the sharpening.', keywords: ['force', 'enchant', 'surge'] },
    { id: 'x_slipstream', name: 'SLIPSTREAM HYMN', kind: 'blue', rarity: 'rare', f: 0, e: X.aura.redBlueFree, fp: 0, ep: X.aura.redBluePowered, effect: 'aura', auraBase: { surgeEscape: X.aura.surgeBoost }, auraPowered: { surgeEscape: X.aura.surgeBoost }, salvage: { type: 'mana' }, flavor: 'Every powered stride finds the wind already parted.', keywords: ['escape', 'enchant', 'surge'] },

    // --- BURSTS (6). ------------------------------------------------------------
    { id: 'x_furysingle', name: 'ONE GOOD SWING', kind: 'red', rarity: 'uncommon', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: X.burst.base }, burstPowered: { force: X.burst.powered }, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Sometimes the whole sermon is one verse.', keywords: ['force', 'burst', 'surge'] },
    { id: 'x_panicgrace', name: 'PANIC, GRACEFULLY', kind: 'blue', rarity: 'uncommon', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { escape: X.burst.base }, burstPowered: { escape: X.burst.powered }, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Terror, but with footwork.', keywords: ['escape', 'burst', 'surge'] },
    { id: 'x_bothhands', name: 'BOTH HANDS NOW', kind: 'purple', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: X.burst.goldDual, escape: X.burst.goldDual }, burstPowered: { force: X.burst.powered, escape: X.burst.goldDual }, salvage: { type: 'mana' }, flavor: 'Whatever was being saved for later: now.', keywords: ['burst', 'surge'] },
    { id: 'x_warhorn', name: 'CRACKED WAR-HORN', kind: 'red', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstPerUnspentDieForce: X.burst.warcryPerDie, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'It only plays one note. The note works.', keywords: ['force', 'rally'] },
    { id: 'x_veinprice', name: 'THE VEIN-PRICE', kind: 'red', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: X.burst.bloodForce }, burstPowered: { force: X.burst.bloodPowered }, vitaeCost: X.burst.bloodVitae, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Paid at the wrist, delivered at the wall.', keywords: ['force', 'sacrifice', 'surge'] },
    { id: 'x_redledger', name: 'THE RED LEDGER', kind: 'blue', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { escape: X.burst.bloodForce }, burstPowered: { escape: X.burst.bloodPowered }, vitaeCost: X.burst.bloodVitae, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Blood buys distance at a fair, terrible rate.', keywords: ['escape', 'sacrifice', 'surge'] },

    // --- VOW / CHOOSE (4). ---------------------------------------------------------
    { id: 'x_goldoath', name: 'OATH ON GOLD', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'goldvow', majorEffect: true, goldVow: { force: X.vow.force, escape: X.vow.escape }, salvage: { type: 'mana' }, flavor: 'Swear small, pay large.', keywords: ['gilded', 'vow'] },
    { id: 'x_pendulum', name: 'THE PENDULUM', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.choose, ep: X.choose, choose: true, salvage: { type: 'mana' }, flavor: 'It swings where you ask. Once.', keywords: ['gilded', 'choose', 'surge'] },
    { id: 'x_eithergate', name: 'EITHER GATE', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: X.choose, ep: X.choose, choose: true, salvage: { type: 'mana' }, flavor: 'Two keys, one lock, your call.', keywords: ['gilded', 'choose', 'surge'] },
    { id: 'x_brightpromise', name: 'BRIGHT PROMISE', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'goldvow', majorEffect: true, goldVow: { force: X.vow.force + 2, escape: X.vow.escape - 2 }, salvage: { type: 'mana' }, flavor: 'Heavier on the fist than the feet, as promises go.', keywords: ['gilded', 'vow'] },

    // --- PURGE (4) — cutting the dead weight. -----------------------------------------
    { id: 'x_menderknife', name: "MENDER'S KNIFE", kind: 'purple', rarity: 'uncommon', f: CX.purge.number, e: CX.purge.number, fp: CX.purge.number, ep: CX.purge.number, effect: 'purge', salvage: { type: 'mana' }, flavor: 'Cut the rot, keep the plank.', keywords: ['purge', 'surge'] },
    { id: 'x_winnower', name: 'THE WINNOWER', kind: 'red', rarity: 'uncommon', f: CX.purge.number, e: 0, fp: CX.purge.rareNumber, ep: 0, effect: 'purge', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Chaff fears him. Grain applauds.', keywords: ['force', 'purge', 'surge'] },
    { id: 'x_confessor', name: 'THE CONFESSOR', kind: 'purple', rarity: 'rare', f: CX.purge.rareNumber, e: CX.purge.rareNumber, fp: CX.purge.rareNumber, ep: CX.purge.rareNumber, effect: 'purge', salvage: { type: 'mana' }, flavor: 'Name the flaw aloud and it loses its room and board.', keywords: ['purge', 'surge'] },
    { id: 'x_cleanhands', name: 'CLEAN HANDS', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.purge.number, fp: 0, ep: CX.purge.rareNumber, effect: 'purge', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Drop what drags. Run lighter.', keywords: ['escape', 'purge', 'surge'] },

    // --- TRANSMUTE (5) — recoloring the pool. -------------------------------------------
    { id: 'x_redsmith', name: 'THE RED SMITH', kind: 'red', rarity: 'uncommon', f: CX.transmute.number, e: 0, fp: CX.transmute.rareNumber, ep: 0, effect: 'transmute', salvage: { type: 'mana' }, flavor: 'Everything he touches learns to burn.', keywords: ['force', 'transmute', 'surge'] },
    { id: 'x_bluedyer', name: 'THE BLUE DYER', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.transmute.number, fp: 0, ep: CX.transmute.rareNumber, effect: 'transmute', salvage: { type: 'mana' }, flavor: 'Dips the dice. They come up running.', keywords: ['escape', 'transmute', 'surge'] },
    { id: 'x_violetloom', name: 'THE VIOLET LOOM', kind: 'purple', rarity: 'uncommon', f: CX.transmute.number, e: CX.transmute.number, fp: CX.transmute.number, ep: CX.transmute.number, effect: 'transmute', salvage: { type: 'mana' }, flavor: 'Weaves whatever thread the round demands.', keywords: ['transmute', 'surge'] },
    { id: 'x_furnaceheart', name: 'FURNACE-HEART', kind: 'red', rarity: 'rare', f: CX.transmute.rareNumber, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, effect: 'transmute', salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Feed it any colour. It gives back red.', keywords: ['force', 'transmute', 'surge'] },
    { id: 'x_rivermouth', name: 'RIVER-MOUTH', kind: 'blue', rarity: 'rare', f: 0, e: CX.transmute.rareNumber, fp: 0, ep: CX.numbers.uncommon.powered, effect: 'transmute', salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'All waters arrive blue, whatever they left as.', keywords: ['escape', 'transmute', 'surge'] },

    // --- MEND (6) — the cure at the claim. ------------------------------------------------
    { id: 'x_fieldstitch', name: 'FIELD STITCH', kind: 'purple', rarity: 'common', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.free, ep: CX.dual.common.free, effect: 'mend', mendBase: CX.mend.minor, mendPowered: CX.mend.major, salvage: { type: 'mana' }, flavor: 'Sewn at a walk. Healed at the far side.', keywords: ['mend', 'surge'] },
    { id: 'x_bittertea', name: 'BITTER TEA', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'mend', mendBase: CX.mend.minor, mendPowered: CX.mend.major, salvage: { type: 'mana' }, flavor: 'Tastes like punishment. Settles like mercy.', keywords: ['mend', 'surge'] },
    { id: 'x_marrowbroth', name: 'MARROW BROTH', kind: 'red', rarity: 'uncommon', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, effect: 'mend', mendBase: CX.mend.minor, mendPowered: CX.mend.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Strength now, repair later. The pot provides both.', keywords: ['force', 'mend', 'surge'] },
    { id: 'x_coldspring', name: 'COLD SPRING', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, effect: 'mend', mendBase: CX.mend.minor, mendPowered: CX.mend.major, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Drink where the road forgives.', keywords: ['escape', 'mend', 'surge'] },
    { id: 'x_lazaret', name: 'THE WALKING LAZARET', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'mend', mendBase: CX.mend.major, mendPowered: CX.mend.rareMajor, salvage: { type: 'mana' }, flavor: 'A hospital with blisters and opinions.', keywords: ['mend', 'surge'] },
    { id: 'x_saintsthumb', name: "SAINT'S THUMB", kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'mend', mendBase: CX.mend.major, mendPowered: CX.mend.rareMajor, salvage: { type: 'mana' }, flavor: 'Pressed to the wound, it remembers being whole.', keywords: ['mend', 'surge'] },

    // --- BOUNTY (6) — coin on the far side. -------------------------------------------------
    { id: 'x_tollkeeper', name: "TOLL-KEEPER'S CUT", kind: 'red', rarity: 'common', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, effect: 'bounty', bountyBase: CX.bounty.minor, bountyPowered: CX.bounty.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The road charges everyone. Charge it back.', keywords: ['force', 'bounty', 'surge'] },
    { id: 'x_gleambeak', name: 'GLEAM-BEAK', kind: 'blue', rarity: 'common', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, effect: 'bounty', bountyBase: CX.bounty.minor, bountyPowered: CX.bounty.major, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The magpie tithes its patron.', keywords: ['escape', 'bounty', 'surge'] },
    { id: 'x_relicpouch', name: 'RELIC POUCH', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'bounty', bountyBase: CX.bounty.minor, bountyPowered: CX.bounty.major, salvage: { type: 'mana' }, flavor: 'Room for one more miracle, lightly used.', keywords: ['bounty', 'surge'] },
    { id: 'x_salvagewright', name: 'SALVAGE-WRIGHT', kind: 'purple', rarity: 'uncommon', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.free, ep: CX.dual.uncommon.free, effect: 'bounty', bountyBase: CX.bounty.minor, bountyPowered: CX.bounty.major, salvage: { type: 'mana' }, flavor: 'Disaster, by weight, is mostly inventory.', keywords: ['bounty', 'surge'] },
    { id: 'x_dragonsplinter', name: 'DRAGON-SPLINTER', kind: 'red', rarity: 'rare', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, effect: 'bounty', bountyBase: CX.bounty.major, bountyPowered: CX.bounty.rareMajor, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Worth more than the wall it came out of.', keywords: ['force', 'bounty', 'surge'] },
    { id: 'x_smugglersmile', name: "SMUGGLER'S SMILE", kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, effect: 'bounty', bountyBase: CX.bounty.major, bountyPowered: CX.bounty.rareMajor, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Declared: nothing. Carried: plenty.', keywords: ['escape', 'bounty', 'surge'] },

    // --- WARD (5) — blunting the toll. ----------------------------------------------------------
    { id: 'x_oilskin', name: 'OILSKIN BLESSING', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.ward.minor, fp: 0, ep: CX.numbers.common.free, effect: 'ward', wardBase: CX.ward.minor, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'The storm signs a waiver.', keywords: ['escape', 'ward', 'surge'] },
    { id: 'x_bonefence', name: 'BONE FENCE', kind: 'red', rarity: 'uncommon', f: CX.ward.minor, e: 0, fp: CX.numbers.common.free, ep: 0, effect: 'ward', wardBase: CX.ward.minor, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'The dead hold the line for a fee of remembrance.', keywords: ['force', 'ward', 'surge'] },
    { id: 'x_pilgrimshell', name: "PILGRIM'S SHELL", kind: 'purple', rarity: 'uncommon', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, effect: 'ward', wardBase: CX.ward.minor, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'Carry your house lightly and the road breaks on it.', keywords: ['ward', 'surge'] },
    { id: 'x_greywarden', name: 'THE GREY WARDEN', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'ward', wardBase: CX.ward.major, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'Paid in winters to stand between you and the bill.', keywords: ['ward', 'surge'] },
    { id: 'x_thornproof', name: 'THORN-PROOF', kind: 'red', rarity: 'rare', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, effect: 'ward', wardBase: CX.ward.minor, wardPowered: CX.ward.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The briar tried. The briar filed a complaint.', keywords: ['force', 'ward', 'surge'] },

    // --- ANCHOR (4) — the momentum floor. ------------------------------------------------------------
    { id: 'x_ballaststone', name: 'BALLAST STONE', kind: 'purple', rarity: 'uncommon', f: CX.dual.common.free, e: CX.dual.common.free, fp: CX.dual.common.powered, ep: CX.dual.common.powered, effect: 'anchor', anchorBase: CX.anchor.minor, anchorPowered: CX.anchor.major, salvage: { type: 'mana' }, flavor: 'Heavy on purpose. Steady by consequence.', keywords: ['anchor', 'surge'] },
    { id: 'x_mooringline', name: 'MOORING LINE', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.common.free, fp: 0, ep: CX.numbers.common.powered, effect: 'anchor', anchorBase: CX.anchor.minor, anchorPowered: CX.anchor.major, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'However far you swing, you start tomorrow attached.', keywords: ['escape', 'anchor', 'surge'] },
    { id: 'x_rootedstance', name: 'ROOTED STANCE', kind: 'red', rarity: 'uncommon', f: CX.numbers.common.free, e: 0, fp: CX.numbers.common.powered, ep: 0, effect: 'anchor', anchorBase: CX.anchor.minor, anchorPowered: CX.anchor.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Lose the round, keep the ground.', keywords: ['force', 'anchor', 'surge'] },
    { id: 'x_oldcapstan', name: 'THE OLD CAPSTAN', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'anchor', anchorBase: CX.anchor.major, anchorPowered: CX.anchor.major, salvage: { type: 'mana' }, flavor: 'It has hauled worse days than this one ashore.', keywords: ['anchor', 'surge'] },

    // ====================================================================
    // KEYWORD EXPANSION (2026-06-25) — new mechanics: RALLY-ESC / FORETELL.
    // ====================================================================

    // --- RALLY-ESCAPE (1) — mirrors WAR-CRY for escape. -----------------------
    { id: 'r_tideturn', name: 'TIDE TURNS', kind: 'blue', rarity: 'uncommon', f: 0, e: C.redBlue.uncommon.free, fp: 0, ep: C.redBlue.uncommon.powered, effect: 'burst', burstPerUnspentDieEscape: 1, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Read the gap. Time the step.', keywords: ['escape', 'rally', 'surge'] },

    // --- SACRIFICE + dual burst (1). -------------------------------------------
    { id: 'r_bloodprice', name: 'BLOOD PRICE', kind: 'red', rarity: 'uncommon', f: C.redBlue.uncommon.free, e: 0, fp: 0, ep: 0, effect: 'burst', burstPowered: { force: 8, escape: 4 }, vitaeCost: 4, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The mountain takes its toll in blood. Pay it.', keywords: ['force', 'sacrifice', 'surge'] },

    // --- PURGE (1) — early access to crack removal. ----------------------------
    { id: 'r_thepurge', name: 'THE PURGE', kind: 'purple', rarity: 'uncommon', f: CX.purge.number, e: CX.purge.number, fp: CX.purge.number, ep: CX.purge.number, effect: 'purge', salvage: { type: 'mana' }, flavor: 'Dead weight is a choice you keep making.', keywords: ['purge', 'surge'] },

    // --- TRANSMUTE (1) — dice recolour. ----------------------------------------
    { id: 'r_spuncoin', name: 'SPUN COIN', kind: 'purple', rarity: 'uncommon', f: CX.transmute.number, e: CX.transmute.number, fp: CX.transmute.number, ep: CX.transmute.number, effect: 'transmute', salvage: { type: 'mana' }, flavor: 'The right colour, at the right moment — the impossible gap becomes a step.', keywords: ['transmute', 'surge'] },

    // --- WARD (1) — extra penalty blunting. ------------------------------------
    { id: 'r_pilward', name: "PILGRIM'S WARD", kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'ward', wardBase: CX.ward.minor, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'Carry your skin lightly and the road breaks upon it.', keywords: ['ward', 'surge'] },

    // --- FORETELL (2) — scry / deck manipulation. ------------------------------
    { id: 'r_readpath', name: 'READ THE PATH', kind: 'purple', rarity: 'common', f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'foretell', foretellBase: 2, foretellPowered: 2, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Some maps are written in the stones ahead.', keywords: ['foretell', 'surge'] },
    { id: 'r_secondsight', name: 'SECOND SIGHT', kind: 'blue', rarity: 'uncommon', f: 0, e: C.redBlue.uncommon.free, fp: 0, ep: C.redBlue.uncommon.powered, effect: 'foretell', foretellBase: 2, foretellPowered: 3, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The mind that sees three steps ahead never slips.', keywords: ['escape', 'foretell', 'surge'] },

    // ====================================================================
    // MTG EXPANSION (2026-06-25) — ECHO / SCOUR / PURGE+DRAW / SACRIFICE+MEND
    // Inspired by Scryfall research: Storm, Surveil, Flashback patterns.
    // ====================================================================

    // --- ECHO — burst that rewards chain-playing (MTG Storm analogue). --------
    // Free tier: +3 force per card already applied. Powered: +6 per card.
    // Play last in a 3-card chain for a 9 or 18 force gut-punch.
    { id: 'r_tempestecho', name: 'TEMPEST ECHO', kind: 'red', rarity: 'rare', f: 4, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: 4 }, echoPerCardForce: 3, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'Each word earns the next. The last one costs the most.', keywords: ['force', 'burst', 'echo', 'surge'] },
    { id: 'r_chaincurrent', name: 'CHAIN CURRENT', kind: 'blue', rarity: 'rare', f: 0, e: 4, fp: 0, ep: 0, effect: 'burst', burstBase: { escape: 4 }, echoPerCardEscape: 3, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Momentum compounds without asking permission.', keywords: ['escape', 'burst', 'echo', 'surge'] },
    // Dual echo: +2/+2 per card applied. Rewards balanced mixed-color play.
    { id: 'r_risingchorus', name: 'RISING CHORUS', kind: 'purple', rarity: 'rare', f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'burst', echoPerCardForce: 2, echoPerCardEscape: 2, salvage: { type: 'mana' }, flavor: 'The steps keep time. The cliff keeps count.', keywords: ['burst', 'echo', 'surge'] },

    // --- SCOUR — Surveil equivalent: look at top N, permanently discard any. ----
    // Unlike FORETELL (which reorders), SCOUR thins the deck permanently.
    { id: 'r_oraclesgaze', name: "ORACLE'S GAZE", kind: 'purple', rarity: 'rare', f: C.purple.strong, e: C.purple.strong, fp: C.purple.strong, ep: C.purple.strong, effect: 'foretell', foretellBase: 3, foretellPowered: 4, foretellScour: true, salvage: { type: 'mana' }, flavor: 'What she sees, she may also bury.', keywords: ['scour', 'surge'] },
    // High-information card: look at 2, draw 2, but costs 3 vitae (DARK KNOWLEDGE).
    { id: 'r_darkknowledge', name: 'DARK KNOWLEDGE', kind: 'purple', rarity: 'rare', f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'foretell', foretellBase: 2, foretellPowered: 3, foretellScour: true, foretellDrawCount: 2, vitaeCost: 3, salvage: { type: 'mana' }, flavor: 'True sight costs the body something. Pay.', keywords: ['scour', 'sacrifice', 'surge'] },

    // --- PURGE + DRAW combo (MTG cycling / Soul-Guide Lantern pattern). ----------
    // Purge one CRACK and immediately draw a replacement card.
    { id: 'r_cleanbreak', name: 'CLEAN BREAK', kind: 'purple', rarity: 'uncommon', f: CX.purge.number, e: CX.purge.number, fp: CX.purge.number, ep: CX.purge.number, effect: 'purge', purgeDrawCount: 1, salvage: { type: 'mana' }, flavor: 'Cut the rot. The deck breathes. A new card rises.', keywords: ['purge', 'draw', 'surge'] },

    // --- SACRIFICE + MEND rider (MTG Starving Revenant pattern). ----------------
    // Pay vitae for a burst of force, but the mend at claim partially offsets the cost.
    { id: 'r_martyrdom', name: 'MARTYRDOM', kind: 'red', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { force: 14 }, vitaeCost: 6, burstMendBase: 3, burstMendPowered: 5, salvage: { type: 'progress', key: 'force', amount: 2 }, flavor: 'Bleed now. The path pays it back — barely.', keywords: ['force', 'burst', 'sacrifice', 'mend', 'surge'] },
    // Blue version: sacrifice for escape + mend.
    { id: 'r_desperatelunge', name: 'DESPERATE LUNGE', kind: 'blue', rarity: 'rare', f: 0, e: 0, fp: 0, ep: 0, effect: 'burst', burstBase: { escape: 12 }, vitaeCost: 4, burstMendBase: 2, burstMendPowered: 4, salvage: { type: 'progress', key: 'escape', amount: 2 }, flavor: 'The gap was closed by someone who could not afford to miss.', keywords: ['escape', 'burst', 'sacrifice', 'mend', 'surge'] },

    // --- FORETELL + burst combo (FATEFUL STEP: see ahead then strike). -----------
    { id: 'r_fatecard', name: 'FATEFUL STEP', kind: 'purple', rarity: 'rare', f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'foretell', foretellBase: 2, foretellPowered: 2, salvage: { type: 'mana' }, flavor: 'See the next step. Then take it — hard.', keywords: ['foretell', 'burst', 'surge'] },

    // --- SCOUR + FORCE (SEER'S DISCIPLINE): look at 3, discard 2, get force. ---
    { id: 'r_seersdiscipline', name: "SEER'S DISCIPLINE", kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, effect: 'foretell', foretellBase: 3, foretellPowered: 3, foretellScour: true, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The soldier culls the plan until only the move remains.', keywords: ['force', 'scour', 'surge'] },

    // --- ECHO + GOLD (gilded storm): gold card with echo bonus. -----------------
    { id: 'r_gildedsurge', name: 'GILDED SURGE', kind: 'gold', rarity: 'rare', f: C.gold.free, e: C.gold.free, fp: C.gold.powered, ep: C.gold.powered, effect: 'burst', majorEffect: true, burstBase: { force: 4, escape: 4 }, echoPerCardForce: 2, echoPerCardEscape: 2, salvage: { type: 'mana' }, flavor: 'The gold die finds the end of a story already in motion.', keywords: ['gilded', 'burst', 'echo', 'surge'] },

    // --- WARD (big numbers, rare) — high-value penalty blunting. ----------------
    { id: 'r_ironshell', name: 'IRON SHELL', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, effect: 'ward', wardBase: CX.ward.major, wardPowered: CX.ward.major, salvage: { type: 'mana' }, flavor: 'Blunt the toll. Lock the floor. Refuse to slide.', keywords: ['ward', 'anchor', 'surge'] },

    // --- FORETELL + DRAW (WAYSTONE: see 2, then draw 1 — balanced information). --
    { id: 'r_waystone', name: 'WAYSTONE', kind: 'purple', rarity: 'uncommon', f: C.purple.free, e: C.purple.free, fp: C.purple.powered, ep: C.purple.powered, effect: 'foretell', foretellBase: 2, foretellPowered: 2, foretellDrawCount: 1, salvage: { type: 'mana' }, flavor: 'Mark the path, then step it.', keywords: ['foretell', 'draw', 'surge'] },

    // ====================================================================
    // HEAVY-SWAP EXPANSION (2026-06-26) — JEOPARDY / MIRACLE / BUYBACK / DELVE
    // All reward-pool. Numbers from HAZARD_TUNING.cards.codex.
    // ====================================================================

    // --- JEOPARDY (MTG Spectacle) — bonus when ≥1 mark is 'X'. ---------------
    // Minor tier: +2 force when behind. Major: +4 force when behind.
    { id: 'r_cornered', name: 'CORNERED', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, jeopardyForce: CX.jeopardy.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The worst position breeds the sharpest move.', keywords: ['force', 'jeopardy', 'surge'] },
    { id: 'r_rallycry', name: 'RALLY CRY', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, jeopardyForce: CX.jeopardy.major, jeopardyEscape: CX.jeopardy.minor, salvage: { type: 'mana' }, flavor: 'Falling behind only makes the charge louder.', keywords: ['force', 'jeopardy', 'surge'] },
    // Blue jeopardy: escape when behind.
    { id: 'r_laststrike', name: 'LAST STRIDE', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, jeopardyEscape: CX.jeopardy.major, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The route has taken enough. He takes it back.', keywords: ['escape', 'jeopardy', 'surge'] },
    // Purple: dual jeopardy — bonus to BOTH meters when down a round.
    { id: 'r_defiance', name: 'DEFIANCE', kind: 'purple', rarity: 'rare', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, jeopardyForce: CX.jeopardy.minor, jeopardyEscape: CX.jeopardy.minor, salvage: { type: 'mana' }, flavor: 'Both feet, both meters, both fists. Still here.', keywords: ['jeopardy', 'surge'] },

    // --- MIRACLE (MTG Miracle, first-play bonus). ------------------------------
    // Red: big force bonus if played first in the round.
    { id: 'r_openingrite', name: 'OPENING RITE', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, firstPlayForce: CX.miracle.major, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The first stone placed decides the arch.', keywords: ['force', 'miracle', 'surge'] },
    { id: 'r_dawnstrike', name: 'DAWNSTRIKE', kind: 'red', rarity: 'rare', f: CX.numbers.rare.free, e: 0, fp: CX.numbers.rare.powered, ep: 0, firstPlayForce: CX.miracle.major, salvage: { type: 'mana' }, flavor: 'Lead with everything. The round catches up.', keywords: ['force', 'miracle', 'surge'] },
    // Blue miracle: lead with escape.
    { id: 'r_firstword', name: 'FIRST WORD', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, firstPlayEscape: CX.miracle.major, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The path respects the one who moves first.', keywords: ['escape', 'miracle', 'surge'] },
    // Purple dual miracle: bonus to BOTH if played first.
    { id: 'r_primus', name: 'PRIMUS', kind: 'purple', rarity: 'rare', f: CX.dual.rare.free, e: CX.dual.rare.free, fp: CX.dual.rare.free, ep: CX.dual.rare.free, firstPlayForce: CX.miracle.major, firstPlayEscape: CX.miracle.major, salvage: { type: 'mana' }, flavor: 'What comes first comes hardest.', keywords: ['miracle', 'surge'] },

    // --- BUYBACK (MTG Buyback) — powered: return to hand next round. -----------
    // Red buyback: repeatable force. Powered for big number; returns.
    { id: 'r_eternal', name: 'ETERNAL GRIP', kind: 'red', rarity: 'rare', f: CX.numbers.common.free, e: 0, fp: 5, ep: 0, buyback: true, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'He has played this card before. He will play it again.', keywords: ['force', 'buyback', 'surge'] },
    // Blue buyback: repeatable escape.
    { id: 'r_recursive', name: 'RECURSIVE STEP', kind: 'blue', rarity: 'rare', f: 0, e: CX.numbers.common.free, fp: 0, ep: 5, buyback: true, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'Every crossing teaches the one after it.', keywords: ['escape', 'buyback', 'surge'] },
    // Purple buyback: dual-meter, returns when powered — premium econ.
    { id: 'r_mantra', name: 'THE MANTRA', kind: 'purple', rarity: 'rare', f: CX.dual.common.free, e: CX.dual.common.free, fp: 2, ep: 2, buyback: true, salvage: { type: 'mana' }, flavor: 'Say it again. Mean it more.', keywords: ['buyback', 'surge'] },
    // Gold buyback: best-in-slot repeatable; gold die only, major utility.
    { id: 'r_everpilgrim', name: 'EVERPILGRIM', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: C.gold.powered, ep: C.gold.powered, effect: 'draw', majorEffect: true, drawBase: U.drawMinorBase, drawPowered: U.drawMinorPowered, buyback: true, salvage: { type: 'mana' }, flavor: 'The road never ends for those who never stop.', keywords: ['gilded', 'draw', 'buyback', 'surge'] },

    // --- DELVE (MTG Delve) — bonus per card in discard pile. ------------------
    // Red delve: +N force per discard. Scales with how deep you've gone.
    { id: 'r_depthcharge', name: 'DEPTH CHARGE', kind: 'red', rarity: 'uncommon', f: CX.numbers.uncommon.free, e: 0, fp: CX.numbers.uncommon.powered, ep: 0, delveForce: CX.delve.minor, salvage: { type: 'progress', key: 'force', amount: 1 }, flavor: 'The longer the fall, the louder it lands.', keywords: ['force', 'delve', 'surge'] },
    { id: 'r_sunkost', name: 'SUNK COST', kind: 'red', rarity: 'rare', f: 1, e: 0, fp: 3, ep: 0, effect: 'burst', burstBase: { force: 2 }, delveForce: CX.delve.major, salvage: { type: 'progress', key: 'force', amount: 2 }, flavor: 'Count what is already spent. Then spend it again.', keywords: ['force', 'burst', 'delve'] },
    // Blue delve: +N escape per discard.
    { id: 'r_inscription', name: 'INSCRIPTION', kind: 'blue', rarity: 'uncommon', f: 0, e: CX.numbers.uncommon.free, fp: 0, ep: CX.numbers.uncommon.powered, delveEscape: CX.delve.minor, salvage: { type: 'progress', key: 'escape', amount: 1 }, flavor: 'The ones who came before wrote it in the rock.', keywords: ['escape', 'delve', 'surge'] },
    { id: 'r_cipher', name: 'CIPHER', kind: 'blue', rarity: 'rare', f: 0, e: 1, fp: 0, ep: 3, effect: 'burst', burstBase: { escape: 2 }, delveEscape: CX.delve.major, salvage: { type: 'progress', key: 'escape', amount: 2 }, flavor: 'Every card spent is a key. This is the lock.', keywords: ['escape', 'burst', 'delve'] },
    // Purple delve: dual bonus. Rewards rich discard piles.
    { id: 'r_channelrage', name: 'CHANNEL RAGE', kind: 'purple', rarity: 'rare', f: CX.dual.uncommon.free, e: CX.dual.uncommon.free, fp: CX.dual.uncommon.powered, ep: CX.dual.uncommon.powered, delveForce: CX.delve.minor, delveEscape: CX.delve.minor, salvage: { type: 'mana' }, flavor: 'Spent in full and still running.', keywords: ['delve', 'surge'] },
    // Gold delve: massive dual bonus per discard, but requires wild die.
    { id: 'r_throwitall', name: 'THROW IT ALL', kind: 'gold', rarity: 'rare', f: 0, e: 0, fp: C.gold.powered, ep: C.gold.powered, effect: 'burst', majorEffect: true, burstBase: { force: 0, escape: 0 }, delveForce: CX.delve.major, delveEscape: CX.delve.major, salvage: { type: 'mana' }, flavor: 'The whole crossing is the hand. Spend it.', keywords: ['gilded', 'burst', 'delve', 'surge'] },
];

export function getHazardCardDef(cardId: string): HazardCardDef {
    const def =
        HAZARD_DECK.find((c) => c.id === cardId) ??
        HAZARD_REWARD_CARDS.find((c) => c.id === cardId) ??
        (cardId === HAZARD_CRACK_CARD.id ? HAZARD_CRACK_CARD : undefined);
    if (!def) throw new Error(`Unknown hazard card id: ${cardId}`);
    return def;
}

// ---------------------------------------------------------------------------
// Boon / consequence catalogues
// ---------------------------------------------------------------------------

export const HAZARD_REWARDS: Record<HazardRewardId, { name: string; icon: string; desc: string }> = {
    cache: { name: 'Shrine Cache', icon: 'chest', desc: 'A sealed cache of relics and coin from across the split. +12 shillings.' },
    relic: { name: 'Bonus Relic', icon: 'relic', desc: 'A rare relic — risk-route exclusive. +20 shillings.' },
    vitae: { name: 'Restored Vitae', icon: 'heart', desc: 'Recover 6 Vitae as the danger passes.' },
    token: { name: 'Paradox Token', icon: 'paradox', desc: '+1 banked Paradox token for your next combat.' },
};

export const HAZARD_CONSEQUENCES: Record<HazardConsequenceId, { name: string; icon: string; desc: string }> = {
    tokens: { name: 'Sundered', icon: 'tokens', desc: 'Lose all banked Paradox & Fallacy tokens.' },
    deadcard: { name: 'Dead Weight', icon: 'deadcard', desc: 'A useless CRACK card is shuffled into your deck.' },
    maxhp: { name: 'Scarred', icon: 'maxhp', desc: '−5 Maximum Vitae until you next rest at an inn.' },
    minhp: { name: 'Bleeding', icon: 'minhp', desc: 'Lose 8 Vitae immediately.' },
    curse: { name: 'Hexed', icon: 'curse', desc: 'Begin your next combat with a hostile Curse die.' },
};

// ---------------------------------------------------------------------------
// Sub-quest catalogue — optional per-hazard objectives.
//
// Each hazard rolls `HAZARD_TUNING.subquests.pickCount` of these (seeded,
// independent of the card/dice stream). Completing one on a SURVIVED crossing
// pays its bonus on top of the spoils; a failed crossing forfeits them. The
// engine owns each id's pass/fail logic (`hazardSubquestStatus`); this table
// is pure data.
// ---------------------------------------------------------------------------

const SHILLINGS_REWARD = { kind: 'shillings', amount: Q.shillings } as const;
const VITAE_REWARD = { kind: 'vitae', amount: Q.vitae } as const;
const TOKEN_REWARD = { kind: 'token', amount: Q.token } as const;

export const HAZARD_SUBQUESTS: HazardSubquestDef[] = [
    { id: 'travel-light', name: 'TRAVEL LIGHT', desc: `Commit no more than ${Q.travelLightCap} cards all crossing.`, reward: VITAE_REWARD },
    { id: 'dice-reserve', name: 'DICE IN RESERVE', desc: `Hold ${Q.diceReserveCount}+ dice unspent at the final round.`, reward: SHILLINGS_REWARD },
    { id: 'steady-hand', name: 'STEADY HAND', desc: 'Never empty your hand at a round resolve.', reward: SHILLINGS_REWARD },
    { id: 'flawless', name: 'FLAWLESS', desc: 'Clear every round of the crossing.', reward: TOKEN_REWARD },
    { id: 'surge-master', name: 'SURGE MASTER', desc: `Power ${Q.surgeMasterCount}+ cards with dice.`, reward: SHILLINGS_REWARD },
    { id: 'stormcaller', name: 'STORMCALLER', desc: `Fire ${Q.stormcallerCount}+ re-cast or convert effects.`, reward: SHILLINGS_REWARD },
    { id: 'scavenger', name: 'SCAVENGER', desc: `Salvage ${Q.scavengerCount}+ cards to the bin.`, reward: VITAE_REWARD },
    { id: 'momentum', name: 'MOMENTUM', desc: 'Carry surplus momentum into a later round.', reward: SHILLINGS_REWARD },
    { id: 'fast-start', name: 'FAST START', desc: 'Clear the first round.', reward: SHILLINGS_REWARD },
    { id: 'finisher', name: 'FINISHER', desc: 'Clear the final round.', reward: VITAE_REWARD },
];

export function getHazardSubquestDef(id: string): HazardSubquestDef {
    const def = HAZARD_SUBQUESTS.find((q) => q.id === id);
    if (!def) throw new Error(`Unknown hazard sub-quest id: ${id}`);
    return def;
}

/** Vitae restored by the `vitae` reward. */
export const HAZARD_VITAE_REWARD = HAZARD_TUNING.rewards.vitae;
/** Shillings granted by the `cache` reward. */
export const HAZARD_CACHE_SHILLINGS = HAZARD_TUNING.rewards.cacheShillings;
/** Shillings granted by the `relic` reward. */
export const HAZARD_RELIC_SHILLINGS = HAZARD_TUNING.rewards.relicShillings;
/** Vitae lost to the `minhp` consequence. */
export const HAZARD_MINHP_LOSS = HAZARD_TUNING.rewards.minhpLoss;
/** Maximum-vitae reduction from the `maxhp` consequence. */
export const HAZARD_MAXHP_SCAR = HAZARD_TUNING.rewards.maxhpScar;

// ---------------------------------------------------------------------------
// Progress types & die faces
// ---------------------------------------------------------------------------

export const HAZARD_TYPES: Record<HazardProgressKey, { key: HazardProgressKey; label: string }> = {
    force: { key: 'force', label: 'FORCE' },
    escape: { key: 'escape', label: 'ESCAPE' },
};

/** Die faces: the four colours plus hostile ✕. Authored in the tuning
 *  module (gold is the wild face); re-exported here for existing imports. */
export { HAZARD_DIE_FACES } from './hazard.tuning';

// ---------------------------------------------------------------------------
// Authored hazards.
//
// Thresholds tuned for the no-re-cast doctrine via Monte-Carlo
// simulation (balance.sim.test.ts): one cast of 4 dice must last all
// 3 rounds, so totals sit well below the prototype's per-round values
// (Safe 12/13/14, Risk 7/7→9/10) which assumed a fresh cast each round.
//
// DIFFICULTY PASS (2026-06-12): playtest reported the crossings had grown
// too easy, so every threshold was raised a step (safe +1/+2/+2 per round,
// risk +0/+1/+1 per meter). The greedy bot's safe perfect rate fell from
// ~60-70% to ~30-40% and risk perfect from ~20% to ~10%, while safe stayed
// near-always at least a partial clear. Bands re-blessed in balance.sim.test.ts.
// ---------------------------------------------------------------------------

export const HAZARD_LIBRARY: HazardDef[] = [
    {
        id: 'cracked-cliff',
        title: 'CRACKED CLIFF PATH',
        scenario: 'The ledge fails underfoot. A shrine cache glints across the split.',
        intro: 'The ledge sheds itself into the dark a stone at a time. Below, the valley is paved with pilgrims who trusted this path. He will join them — the cliff has already decided. Unless…',
        boardHeadline: 'THE SPLIT WIDENS',
        safeBoardNote: 'reach the passage mark to cross',
        riskBoardNote: 'clear both meters to cross',
        safeRouteName: 'LEDGE CRAWL',
        riskRouteName: 'THE LEAP',
        safeRouteDesc: 'One combined meter — any progress counts. Forgiving, but the prize is plain.',
        riskRouteDesc: 'Two meters, both required each round — split your hand between FORCE and ESCAPE.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [20, 23, 25], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[9, 9], [11, 11], [12, 12]], rewardLabel: 'Shrine cache + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'flooded-undercroft',
        title: 'FLOODED UNDERCROFT',
        scenario: 'Black water climbs the crypt stairs. Something below is still breathing.',
        intro: 'Black water swallows the stairs faster than he can climb them. The cold has his legs; the dark has the rest. No one drowns slowly here — the crypt keeps what it fills. Unless…',
        boardHeadline: 'THE WATER RISES',
        safeBoardNote: 'wade the long gallery before it fills',
        riskBoardNote: 'dive the drowned shortcut — both meters',
        safeRouteName: 'THE LONG GALLERY',
        riskRouteName: 'THE DROWNED DOOR',
        safeRouteDesc: 'One combined meter — slow, cold, survivable. The water takes its toll either way.',
        riskRouteDesc: 'Force the door and out-swim the surge. Both meters, every round.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [19, 23, 26], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[8, 10], [10, 12], [11, 13]], rewardLabel: 'Reliquary haul + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'ashfall-crossing',
        title: 'ASHFALL CROSSING',
        scenario: 'The burning field exhales. Each gust strips the path a little barer.',
        intro: 'The ash falls warm as breath and does not stop. It fills his bootprints behind him, then his lungs. The field has buried armies without slowing. It will not even notice him. Unless…',
        boardHeadline: 'THE ASH FALLS',
        safeBoardNote: 'hold the cinder ridge to the far side',
        riskBoardNote: 'run the ashfall flat — both meters',
        safeRouteName: 'CINDER RIDGE',
        riskRouteName: 'THE ASH RUN',
        safeRouteDesc: 'One combined meter — keep to the high stones and grind it out.',
        riskRouteDesc: 'A dead sprint under falling ash. Both meters, and the last round is the worst.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [22, 23, 25], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[10, 8], [11, 11], [13, 11]], rewardLabel: 'Ember hoard + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'famine-march',
        title: 'THE FAMINE MARCH',
        scenario: 'The road outlasted the rations days ago. The next well is a rumor.',
        intro: 'Three days since the last crust. His body has begun eating itself — politely, quietly, the way starvation always does. The road ahead is long and the road behind is longer. He dies walking. Unless…',
        boardHeadline: 'THE HUNGER DEEPENS',
        safeBoardNote: 'forage the long way and keep moving',
        riskBoardNote: 'force-march the dry flats — both meters',
        safeRouteName: 'THE FORAGE TRAIL',
        riskRouteName: 'THE DRY FLATS',
        safeRouteDesc: 'One combined meter — grub roots, drink dew, keep your feet moving. Slow starvation against slow progress.',
        riskRouteDesc: 'March straight through on an empty belly. Both meters, every round, or the road keeps you.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [20, 23, 25], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[9, 9], [11, 11], [12, 12]], rewardLabel: 'Cached provisions + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'bandit-hunt',
        title: 'HUNTED BY BANDITS',
        scenario: 'Whistles on both ridges. The road behind is already closed.',
        intro: 'They have his scent, his pace, and his road. Bandits do not chase — they herd, and the gully ahead is the pen. Whatever they leave of him will not need burying. Unless…',
        boardHeadline: 'THE NOOSE TIGHTENS',
        safeBoardNote: 'go to ground and slip the cordon',
        riskBoardNote: 'break through the ambush — both meters',
        safeRouteName: 'GO TO GROUND',
        riskRouteName: 'BREAK THE LINE',
        safeRouteDesc: 'One combined meter — ditch, double back, wade the stream. Lose them slowly or not at all.',
        riskRouteDesc: 'Run straight at the thinnest point of the cordon. Both meters, every round — hesitate and they close.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [19, 23, 26], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[8, 10], [10, 12], [11, 13]], rewardLabel: 'Bandit spoils + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'fever-rot',
        title: 'THE CREEPING ROT',
        scenario: 'The marsh air carries the fever. It has already found the cut on his arm.',
        intro: 'The fever came in with the marsh water and is already past his elbow, drawing its black lines toward the heart. Men twice his size have died of half this. He has a day, perhaps less. Unless…',
        boardHeadline: 'THE FEVER CLIMBS',
        safeBoardNote: 'sweat it out at the hermit fires',
        riskBoardNote: 'cut for the dry hills — both meters',
        safeRouteName: 'THE HERMIT FIRES',
        riskRouteName: 'THE DRY HILLS',
        safeRouteDesc: 'One combined meter — boil the wound, burn the chill, endure. The slow cure costs all the same.',
        riskRouteDesc: 'Outrun the rot to clean air and high ground. Both meters, every round, on failing legs.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [22, 23, 25], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[10, 8], [11, 11], [13, 11]], rewardLabel: 'Hermit tinctures + bonus relic', penaltyVitae: 4 },
    },
];

export function getHazardDef(hazardId: string): HazardDef {
    const def = HAZARD_LIBRARY.find((h) => h.id === hazardId);
    if (!def) throw new Error(`Unknown hazard id: ${hazardId}`);
    return def;
}
