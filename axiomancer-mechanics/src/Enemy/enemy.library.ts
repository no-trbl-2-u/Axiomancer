/**
 * Enemy library — the 2026-07-06 ART-DRIVEN base roster.
 *
 * One enemy per painting in `axiomancer-mobile/assets/images/enemies/` (52
 * paintings → 52 enemies). Every enemy carries a `portraitAsset` whose key the
 * mobile app resolves 1:1 to its painting — no more random art pools.
 *
 * Roster shape:
 *   - EARLY (fishing-village, L1-8): 13 foes — 3 simple, 7 normal, 3 elite,
 *     1 boss (The King of Revenge — the village climax fight).
 *   - EARLY-MID (northern-forest, L9-18): 13 foes incl. the Kudan unique and
 *     the two balance-audit anchors (Tri-Eyes = Normal anchor, Mirac = boss
 *     anchor — both keep the Phase 121/138 calibrated stat blocks).
 *   - MID (northern-forest, L19-31): 13 foes.
 *   - LATE (northern-forest, L34-50): 13 foes incl. the Death and The Abortive
 *     uniques.
 *   - NORTHERN CONTINENT (Phase W3, 2026-08-28): 9 foes — 4 cavern natives,
 *     4 city predators, and the Harbormaster boss. Portraits come from the
 *     licensed game-icons.net trove (CC BY 3.0), not the painting drop; the
 *     1:1 portraitAsset law holds unchanged.
 *
 * Difficulty model (how a fight gets HARD):
 *   1. Tier — `simple → normal → elite → boss → unique` drives the threat-damage
 *      multiplier, proc unlock caps, XP and the encounter generator's adaptive
 *      level band (`DIFFICULTY_LEVEL_BANDS`: wandering foes scale relative to
 *      the PLAYER's level; uniques keep their authored level).
 *   2. Authored level — anchors each foe to an early/mid/late band for stage
 *      profiles, authored map events and uniques.
 *   3. THE CLOCK (Aeon's-End-style pressure) — every enemy's telegraphed hit
 *      escalates each round past `THREAT_ESCALATION_GRACE`
 *      (`THREAT_ESCALATION_PER_ROUND`, bosses ×`THREAT_ESCALATION_BOSS_MULT`),
 *      and every authored threat sequence in `combat.threat-sequences.ts` ramps
 *      its per-phase `damageWeight` + debuff intensity toward a spike final
 *      phase. Solve the fight fast (DoT) or deny turns (control), or it
 *      out-scales you.
 *
 * Authoring notes:
 *   - Most stat blocks come from `enemyStatBudget(level, weights)` so the whole
 *     roster retunes from `ENEMY_STAT_PER_LEVEL`. A handful of enemies keep
 *     HAND-SET blocks that mirror retired calibration fixtures so seeded sims
 *     and balance bands stay stable (noted per-enemy).
 *   - Loot tables follow Spec 07 Q7B — weighted entries with explicit `null`
 *     buckets for "nothing drops".
 *   - `xpReward` is implicit: `createEnemy` falls back to
 *     `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]`.
 */

import { createEnemy, enemyStatBudget } from './index';
import { LootTableEntry } from './types';
import { consumableLibrary, getConsumableById } from '../Items/consumable.library';
import { Consumable } from '../Items/types';
import { getCardById } from '../Cards/cards.library';
import type { Card } from '../Cards/types';

// ─── Card rotation helpers ────────────────────────────────────────────────────

/** Returns a fresh copy of the named card from the library. */
function card(id: string): Card {
    const found = getCardById(id);
    if (!found) {
        throw new Error(`enemy.library: unknown card id '${id}'.`);
    }
    return found;
}

// ─── Loot helpers ─────────────────────────────────────────────────────────────

/** Returns a fresh copy of the named consumable from the library, q=1. */
function consumable(id: string): Consumable {
    const found = getConsumableById(id);
    if (!found) {
        throw new Error(`enemy.library: unknown consumable id '${id}'.`);
    }
    return { ...found, quantity: 1 };
}

/** No-drop bucket helper — readability sugar over `{ item: null, weight }`. */
function none(weight: number): LootTableEntry {
    return { item: null, weight };
}

/** Drop bucket helper — wraps a consumable id with its weight. */
function drop(id: string, weight: number): LootTableEntry {
    return { item: consumable(id), weight };
}

// ─── Canonical Tier 1 stance overrides ────────────────────────────────────────

/**
 * Every authored enemy plugs the same Spec 03 Tier 1 effect IDs into its
 * `tier1Overrides`. Doing it once here keeps the library definitions
 * focused on stats / personality.
 */
const T1_DEFAULT = {
    body:  { attack: 'tier1_body_attack',  defend: 'tier1_body_defend'  },
    mind:  { attack: 'tier1_mind_attack',  defend: 'tier1_mind_defend'  },
    heart: { attack: 'tier1_heart_attack', defend: 'tier1_heart_defend' },
} as const;

const ADDED = '2026-07-06';

// ═══════════════════════════════════════════════════════════════════════════════
// FISHING VILLAGE — early game (L1-8), 13 foes
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Body-fodder aggressor. HAND-SET stats (3/1/1, 25 HP at L1) — mirrors the
 * retired Tidepool Crab fixture so the seeded engine tests that fight a
 * small aggressive dummy stay calibrated.
 */
export const GraveLarva = createEnemy({
    id: 'enemy-grave-larva',
    portraitAsset: 'grave-larva',
    name: 'Grave Larva',
    stanceHint: 'It is all appetite and no argument — it simply chews toward you.',
    description: 'It hatched from a burial the ground refused. It is still deciding what to become. The options are narrowing to teeth.',
    level: 1,
    baseStats: { body: 3, mind: 1, heart: 1 },
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(80), drop('minor-healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The options finish narrowing. Teeth was always going to win.',
        quiet:  'It stops deciding. The ground it hatched from reclaims an unfinished thing.',
        ironic: 'It never got to become anything. Now it never will.',
    },
    causeLines: {
        brutal: 'It decides, at last, and the decision has teeth.',
        broken: 'It keeps chewing toward you, patient as dirt, until dirt is what you are.',
        quiet:  'You misjudge something with no argument left in it but appetite.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

/**
 * The library's smallest stat block. HAND-SET 1/1/1 (15 HP at L1) — mirrors
 * the retired Disatree fixture; many hermetic e2e tests depend on the exact
 * `maxHealth = 15`, so keep this block at 1/1/1.
 */
export const FloatEye = createEnemy({
    id: 'enemy-float-eye',
    portraitAsset: 'float-eye',
    name: 'Float-Eye',
    stanceHint: 'It only watches — whatever it does next, it has watched you do first.',
    description: 'An eye that outlived its head. It has watched so long it has developed opinions, and one of them is about you.',
    level: 1,
    baseStats: { body: 1, mind: 1, heart: 1 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(70), drop('minor-healing-potion', 25), drop('healing-potion', 5)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 67 },
    finalBlowLines: {
        brutal: 'The eye closes for the first time in its long career, and does not reopen.',
        quiet:  'It blinks once — a thing it had been saving — and settles into the dark.',
        ironic: 'It watched the blow arrive from very far away, and disagreed with it to the end.',
    },
    causeLines: {
        brutal: 'It saw the opening before you made it. It had seen it for some time.',
        broken: 'You cannot outlast a thing whose whole vocation is waiting.',
        quiet:  'You look at it a moment too long, and it wins the exchange of looking.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const ChatteringSkull = createEnemy({
    id: 'enemy-chattering-skull',
    portraitAsset: 'chattering-skull',
    name: 'Chattering Skull',
    stanceHint: 'It repeats its last argument on a loop — cold, toothy, and rehearsed.',
    description: 'A skull that kept the argument after losing everything that made it. It repeats its last word, endlessly, at you.',
    level: 2,
    baseStats: enemyStatBudget(2, { heart: 1, body: 1, mind: 3 }),
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(75), drop('clarity-serum', 20), drop('focus-vial', 5)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The jaw comes off mid-word. The argument finally has nothing left to repeat it with.',
        quiet:  'It runs out of the word before you run out of patience. A close thing.',
        ironic: 'It lost the argument the day it died. It just kept losing it, on a loop, until you arrived to collect.',
    },
    causeLines: {
        brutal: 'The last word lands, and it turns out to have been an argument for something.',
        broken: 'It repeats itself until repetition becomes a kind of erosion, and you are the shore.',
        quiet:  'You stop listening for one round. The word gets in anyway.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

/**
 * The early befriendable heart fight. HAND-SET stats (2/2/4, gull-shaped) and
 * a gull-shaped friendship stack — mirrors the retired Mournful Gull so the
 * befriend / codex engine tests keep a structurally identical subject.
 */
export const LittleBelle = createEnemy({
    id: 'enemy-little-belle',
    portraitAsset: 'little-belle',
    name: 'Little Belle',
    stanceHint: 'A creature of pure mourning. It acts on feeling, not calculation.',
    description: 'A small vesper in a robe of dawn-orange, ringing a bell for a service no one held. Attendance is mandatory.',
    level: 2,
    baseStats: { body: 2, mind: 2, heart: 4 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('heart-draught', 30), drop('minor-healing-potion', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    cards: [card('thin-hymn')],
    friendshipReward: {
        items: [{ ...getConsumableById('heart-draught')! }],
        xpBonus: 10,
        narrative:
            'The bell stops mid-swing. Little Belle holds it against its chest ' +
            'like a heart it borrowed. For once, the service has a congregation, ' +
            'and it is you, and that turns out to have been the whole liturgy.',
        flagSet: 'befriended-little-belle',
        alignmentDelta: { outlook: +3 },
    },
    finalBlowLines: {
        brutal: 'The bell lands apart from the hand. Neither rings again.',
        quiet:  'It sets the bell down, carefully, the way one sets down a finished grief.',
        ironic: 'You rang first. It had no answer to being summoned.',
    },
    pactLines: {
        quiet:   'The bell hangs silent between you. Some services are held by standing still.',
        setDown: 'It lays the bell on the stones, mouth up, an offering emptied of its toll.',
        heavy:   'The service it was ringing for was its own. You attended. That was all it ever asked.',
    },
    causeLines: {
        brutal: 'The toll lands inside your chest and keeps ringing after the ghost is gone.',
        broken: 'Each peal takes a little more of you to the service. Eventually all of you attends.',
        quiet:  'You stop to listen. The bell was patient. The listening is what it collects.',
    },
    journalEntry: {
        id: 'codex-little-belle',
        title: 'The Service Held By One',
        body:
            'It rings the hours for a chapel that burned before the bell cooled. ' +
            'No one told it the congregation was released. Or someone did, ' +
            'and the ringing is what refusing looks like when you are small ' +
            'and orange and mostly made of duty.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const FootStealer = createEnemy({
    id: 'enemy-foot-stealer',
    portraitAsset: 'foot-stealer',
    name: 'Foot-Stealer',
    stanceHint: 'It goes for your footing first — everything it does is leverage.',
    description: 'It collects footing. Yours is next on the list. Balance, it maintains, is a possession like any other.',
    level: 3,
    baseStats: enemyStatBudget(3, { heart: 1, body: 3, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 25), drop('minor-healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'It loses its footing for the first and only time. The collection closes.',
        quiet:  'It sets your balance back down, unstolen, and lies still.',
        ironic: 'It spent so long taking footing it forgot to keep its own.',
    },
    causeLines: {
        brutal: 'It takes your footing and, with it, everything that was standing on it.',
        broken: 'Inch by inch, your balance joins its collection.',
        quiet:  'You misstep once. It was already holding the difference.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

/**
 * The early befriendable-by-default drowned man. HAND-SET stats (2/2/4) and a
 * beggar-shaped friendship reward — mirrors the retired Hollow-Eyed Beggar
 * so the befriend engine tests keep their reward-shape subject.
 */
export const WaterHolger = createEnemy({
    id: 'enemy-water-holger',
    portraitAsset: 'water-holger',
    name: 'Water-Holger',
    stanceHint: 'Grief moves it more than hunger — the sea returned the feeling parts.',
    description: 'A deckhand the sea gave back, mostly. What the salt kept, it kept for good. What it returned still wants its wages.',
    level: 3,
    baseStats: { body: 2, mind: 2, heart: 4 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('heart-draught', 30), drop('healing-potion', 15), drop('antidote', 5)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('thin-hymn')],
    friendshipReward: {
        items: [
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('antidote')! },
        ],
        xpBonus: 15,
        narrative:
            'It opens a fist no one has managed to open since the wreck. ' +
            'Two phials, still stoppered, still cold from the deep. ' +
            '"Carried these for the crew," it manages. "You stood a watch with me. So."',
        flagSet: 'befriended-water-holger',
        alignmentDelta: { scope: -3 },
    },
    finalBlowLines: {
        brutal: 'The sea takes back its returns policy. Holger goes down a second time, and stays.',
        quiet:  'It stops mid-reach, remembers drowning, and finishes the memory.',
        ironic: 'It survived the sea only to founder on the shore. The wages were never the point.',
    },
    pactLines: {
        quiet:   'It stands its watch beside you awhile. The tide takes the silence between you as payment.',
        setDown: 'It lays the phials on the sand between you, slowly, as if lowering them into a grave done right.',
        heavy:   '"Carried these for the crew." A wave arrives and retreats. "But you stood the watch. So."',
    },
    causeLines: {
        brutal: 'The grip that held a mast through the wreck holds you through yours.',
        broken: 'You keep it at arm\'s length for as long as your arms last.',
        quiet:  'It embraces you like a shipmate. The salt does the rest.',
    },
    journalEntry: {
        id: 'codex-water-holger',
        title: 'The Watch That Never Ended',
        body:
            'The crew list from the wreck was never recovered, so Holger keeps standing ' +
            'watch for all of it. It cannot rest until relieved, and the officer who ' +
            'could relieve it is forty years drowned. It carries phials for shipmates ' +
            'it can no longer name. It keeps them cold. It keeps everything cold.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const CursedHead = createEnemy({
    id: 'enemy-cursed-head',
    portraitAsset: 'cursed-head',
    name: 'Cursed Head',
    stanceHint: 'It leads with feeling — the grudge does the talking.',
    description: 'A severed head still holding its grudge upright. The curse is that it remembers everything except being wrong.',
    level: 4,
    baseStats: enemyStatBudget(4, { heart: 3, body: 1, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('heart-draught', 25), drop('minor-healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The grudge outlives the argument by exactly as long as it takes to lose.',
        quiet:  'It settles, at last, into the one position it never tried: agreement.',
        ironic: 'It remembered everything except this ending. It will not get the chance to revise the record.',
    },
    causeLines: {
        brutal: 'The grudge lands with the weight of every wrong it never once admitted.',
        broken: 'It relitigates the same point, round after round, until you concede by exhaustion.',
        quiet:  'You nod, just once, to end it faster. The curse takes the nod as surrender.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const Ghast = createEnemy({
    id: 'enemy-ghast',
    portraitAsset: 'ghast',
    name: 'Ghast',
    stanceHint: 'It calculates its hunger — every request is a trap already sprung.',
    description: 'Hunger given manners. It asks before it takes. It has never once waited for the answer.',
    level: 5,
    baseStats: enemyStatBudget(5, { heart: 1, body: 1, mind: 3 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('clarity-serum', 25), drop('focus-vial', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    cards: [card('scolds-bridle')],
    finalBlowLines: {
        brutal: 'It asks one last time. The blow answers before the manners can.',
        quiet:  'It withdraws the question, hunger and all, without waiting to hear how it would have ended.',
        ironic: 'For once it waits for an answer. The answer is this.',
    },
    causeLines: {
        brutal: 'It asks, takes, and is already asking again before you finish disagreeing.',
        broken: 'Each polite request costs a little more than the last. You keep answering anyway.',
        quiet:  'You hesitate to be rude. It was never going to wait that long.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const DoomEgg = createEnemy({
    id: 'enemy-doom-egg',
    portraitAsset: 'doom-egg',
    name: 'Doom-Egg',
    stanceHint: 'It does not attack so much as incubate — the danger is the countdown.',
    description: 'A clutch of eyes, counting down. Every round it does not hatch is a kindness it fully intends to bill you for.',
    level: 6,
    baseStats: enemyStatBudget(6, { heart: 2, body: 2, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('antidote', 25), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    finalBlowLines: {
        brutal: 'The countdown ends early. The bill goes unpaid.',
        quiet:  'It stops counting. Whatever was hatching decides against it.',
        ironic: 'It spent its whole clutch threatening to hatch. It never got the chance to bill you for the wait.',
    },
    causeLines: {
        brutal: 'It finally hatches, all at once, directly into you.',
        broken: 'Round by round it counts down, and round by round the interest compounds.',
        quiet:  'You forget it was counting. It never forgets.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const TheButcher = createEnemy({
    id: 'enemy-the-butcher',
    portraitAsset: 'the-butcher',
    name: 'The Butcher',
    stanceHint: 'He answers everything with the cleaver — force is his entire rhetoric.',
    description: 'He dresses every argument the same way: on the block, by the joints. He has never met a question he could not quarter.',
    level: 6,
    baseStats: enemyStatBudget(6, { heart: 1, body: 4, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('body-elixir', 35), drop('healing-potion', 20), drop('berserker-brew', 10)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('unction-of-boils')],
    finalBlowLines: {
        brutal: 'He meets an argument the cleaver cannot dress. It costs him the block.',
        quiet:  'The cleaver goes still on the table, for once, between courses.',
        ironic: 'He quartered every question put to him. This one quartered back.',
    },
    causeLines: {
        brutal: 'He dresses the argument the only way he knows, and you were the argument.',
        broken: 'Joint by joint, he takes the question apart, and you were holding it.',
        quiet:  'You put down your guard for a beat. The cleaver does not share your patience.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'elite', 'enemy'],
});

export const BrineHag = createEnemy({
    id: 'enemy-brine-hag',
    portraitAsset: 'brine-hag',
    name: 'Brine Hag',
    stanceHint: 'She works on the feelings first — the bargain is already half-made in your chest.',
    description: 'She traded her reflection to the tide for the right to keep yours. The exchange rate has only worsened since.',
    level: 7,
    baseStats: enemyStatBudget(7, { heart: 4, body: 1, mind: 2 }),
    mapName: 'fishing-village',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('heart-draught', 30), drop('healing-potion', 20), drop('resonance-crystal', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('thin-hymn')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 },
        roundsThreshold: 4,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('heart-draught')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 35,
        alignmentDelta: { outlook: +2, scope: +1 },
        narrative:
            'The hag lowers her hands and, for the first time in a tide\'s age, looks at ' +
            'nothing at all. "You kept your face," she says. "Even here. Even now. ' +
            'Perhaps the sea will trade mine back for the novelty."',
        flagSet: 'befriended-brine-hag',
    },
    pactLines: {
        quiet:   'She stops reaching for your reflection. The rock pools go still and honest.',
        setDown: 'She sets a small mirror of pooled brine between you. It shows you, unedited. It is a gift.',
        heavy:   '"I sold my face for leverage over the drowning. You are the first to stand in front of me and stay one person."',
    },
    journalEntry: {
        id: 'codex-brine-hag',
        title: 'The Face Broker',
        body:
            'Every bargain she has struck is recorded in a face she keeps and cannot wear. ' +
            'She does not want your death. She wants a reflection that stops flinching. ' +
            'The tide pays its debts in other people\'s features.',
    },
    finalBlowLines: {
        brutal: 'The stolen reflections leave her all at once, a spring tide of other people\'s faces.',
        quiet:  'She wades out past her depth, and for once nothing in the water looks back.',
        ironic: 'She reached for your reflection and found your resolve wearing it.',
    },
    causeLines: {
        brutal: 'She holds up the face you make at the end, and keeps it.',
        broken: 'Bargain by bargain, you trade away the parts of you that were winning.',
        quiet:  'You catch your reflection in her tide pool and it does not follow you home.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'elite', 'enemy'],
});

export const TheFerryman = createEnemy({
    id: 'enemy-the-ferryman',
    portraitAsset: 'the-ferryman',
    name: 'The Ferryman',
    stanceHint: 'A cold calculator of crossings. Only at the end does the pole swing on feeling.',
    description: 'He poles a crossing no river asked for. The toll is whatever you cannot afford to lose, priced accordingly.',
    level: 8,
    baseStats: enemyStatBudget(8, { heart: 1, body: 2, mind: 4 }),
    mapName: 'fishing-village',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('clarity-serum', 25), drop('focus-vial', 25), drop('philosopher-tea', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('the-long-lent')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        roundsThreshold: 6,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('antidote')! },
        ],
        xpBonus: 40,
        alignmentDelta: { outlook: +1 },
        narrative:
            'The pole comes out of the water. "No charge," the Ferryman says, as if trying ' +
            'the words on. "Nobody has ever offered to row." He looks at his own hands. ' +
            '"I had forgotten there was a bank on either side."',
        flagSet: 'befriended-the-ferryman',
    },
    pactLines: {
        quiet:   'The ferry drifts. For the first time, the crossing is nobody\'s business but the river\'s.',
        setDown: 'He lays the pole flat across the gunwales — the ferry equivalent of an open hand.',
        heavy:   '"Everyone pays with what they cannot afford. You offered what you could spare. That is not a toll. That is company."',
    },
    journalEntry: {
        id: 'codex-the-ferryman',
        title: 'The Crossing Nobody Ordered',
        body:
            'There is no river at the dock where he poles. There is the idea of a river, ' +
            'which is worse, because ideas do not have far banks. He ferries anyway. ' +
            'The toll box has never been emptied. It cannot be. It is full of the things ' +
            'people could not afford to lose, and he is saving them, in case anyone returns.',
    },
    finalBlowLines: {
        brutal: 'The pole snaps. The crossing forecloses. The river that never was runs dry.',
        quiet:  'He steps off the ferry onto the near bank, at last, and is done crossing.',
        ironic: 'He priced the toll at what you could not afford to lose. You could afford the fight.',
    },
    causeLines: {
        brutal: 'The pole finds you like a debt finds a debtor.',
        broken: 'Crossing by crossing, he ferries pieces of you somewhere they do not return from.',
        quiet:  'You pay the toll without noticing what it was. The far bank accepts you.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'elite', 'enemy'],
});

/**
 * The fishing-village climax boss. HAND-SET stats (8/12/10), cards, befriend
 * config and reward shape mirror the retired Coastal Tyrant calibration
 * (Phase 121/138 Easy-anchor tuning) so the village boss chain, the mercy
 * policy and the seeded sims keep their measured difficulty.
 */
export const KingOfRevenge = createEnemy({
    id: 'enemy-king-of-revenge',
    portraitAsset: 'king-of-revenge',
    name: 'The King of Revenge',
    stanceHint: 'A grievance with a crown — he answers everything with feeling first, and the feeling is old.',
    description:
        'A crown outlives its head. A grievance outlives its crown. What remains holds court ' +
        'over the breakwater and rules whatever still kneels.',
    level: 6,
    baseStats: { body: 8, mind: 12, heart: 10 },
    mapName: 'fishing-village',
    difficulty: 'boss',
    logic: 'boss',
    // Injury is the most durable architecture — the village climax is a wall,
    // above the L6 boss curve, and it does not learn to flinch until it must.
    vitae: 160,
    keywords: [
        { kind: 'hide', n: 3 },
        { kind: 'wounding', n: 18 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE CHARGES ARE READ',
            text: 'The crown straightens. It begins the list, and every name on the list is yours.',
            gain: [{ kind: 'unshaken' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'SENTENCE WITHOUT TRIAL',
            text: 'He stops arguing the old wrong and starts collecting it.',
            gain: [{ kind: 'brutal' }],
            heal: { pct: 0.1 },
            threatBonus: 0.5,
            curseCardId: 'arrears',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('healing-potion', 50),
        drop('body-elixir', 30),
        drop('heart-draught', 20),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    cards: [card('knucklebone-recant'), card('passing-bell'), card('scolds-bridle')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.7 },
        roundsThreshold: 1,
    },
    friendshipReward: {
        // Phase 21 — procedural equipment retired; friendship rewards are
        // consumables/currency (relics are a fixed starting kit, not loot).
        items: [
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('heart-draught')! },
        ],
        xpBonus: 75,
        narrative:
            'The crown tilts. Beneath it there has been no head for a long time — only ' +
            'the grievance, holding the shape of one.\n\n' +
            '"You have not asked what was done to me," it says. "Everyone bargains. ' +
            'Everyone explains. You only stayed."\n\n' +
            'The crown lifts itself free and settles on the stones between you. The ' +
            'sentence engraved on the inner band keeps ending and starting again, ' +
            'exactly as the old texts said it would.\n\n' +
            '"Take it. A grievance without a crown is only a memory, and a memory can ' +
            'finally be misremembered kindly. That is the closest thing to rest I have ' +
            'been offered in a century."',
        flagSet: 'befriended-king-of-revenge',
        alignmentDelta: { outlook: +3, scope: -2 },
        factionDeltas: {
            'coastal-guard': -8,
            'merchant-guild': +10,
        },
    },
    finalBlowLines: {
        brutal: 'The crown rolls from the breakwater into the surf. Nothing under it argues.',
        quiet:  'The grievance completes. Whatever was owed is, by default, forgiven.',
        ironic: 'Revenge finally got what it wanted: an ending. It simply was not the one it planned.',
    },
    pactLines: {
        quiet:   'The court adjourns. The gulls go back to being gulls, released from testimony.',
        setDown: 'The crown settles on the stones between you. The sentence on the inner band keeps ending and starting again.',
        heavy:   '"A grievance without a crown is only a memory, and a memory can finally be misremembered kindly."',
    },
    causeLines: {
        brutal: 'A century of sentence lands in one verdict. The court finds for the crown.',
        broken: 'You out-argue the grievance round after round, but grievances do not tire.',
        quiet:  'You kneel to catch your breath. The court records it as fealty, and closes.',
    },
    journalEntry: {
        id: 'codex-king-of-revenge',
        title: 'The Crown That Outlived Its Complaint',
        body:
            'No record survives of the original wrong. The kingdom, the culprit, the ' +
            'evidence — all of it eroded before the grievance did. This is the lesson ' +
            'the breakwater teaches: injury is the most durable architecture. He ruled ' +
            'nothing but the feeling, and the feeling never once voted to disband.',
    },
    addedIn: ADDED,
    tags: ['early-game', 'boss', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// NORTHERN FOREST — early-mid (L9-18), 13 foes
// ═══════════════════════════════════════════════════════════════════════════════

export const Wichtlein = createEnemy({
    id: 'enemy-wichtlein',
    portraitAsset: 'wichtlein',
    name: 'Wichtlein',
    stanceHint: 'It measures and portends — every knock is a calculation about your ending.',
    description: 'A small red miner of the world\'s thin places. It knocks three times where the ground is about to fail. The third knock is for you.',
    level: 9,
    baseStats: enemyStatBudget(9, { heart: 1, body: 1, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('focus-vial', 25), drop('clarity-serum', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    cards: [card('scolds-bridle')],
    finalBlowLines: {
        brutal: 'The third knock never lands. The ceiling holds; the miner does not.',
        quiet:  'It sets down its little hammer, having finally measured wrong.',
        ironic: 'It spent its whole life portending endings. It did not see its own coming.',
    },
    causeLines: {
        brutal: 'The third knock arrives on schedule. Schedules, it turns out, are load-bearing.',
        broken: 'Knock by knock, it measures the ground under you until there is none left.',
        quiet:  'You hear two knocks and stop counting. The third one does not ask permission.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * The forest's signature unique fight. HAND-SET stats (6/7/7) mirror the
 * retired Echo of Pyrrhonia so the encounter generator's authored-level
 * unique fixture keeps its calibration.
 */
export const Kudan = createEnemy({
    id: 'enemy-kudan',
    portraitAsset: 'kudan',
    name: 'Kudan',
    stanceHint: 'It grieves what it knows — the prophecy hurts it more than you can.',
    description:
        'A calf with a man\'s face. It is born knowing one true calamity, speaks it, and dies. ' +
        'It has walked out of the trees, and it has chosen you to hear it.',
    level: 10,
    baseStats: { body: 6, mind: 7, heart: 7 },
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
    // On the L10 unique curve exactly: it is not a wall, it is an appointment
    // with a sentence. UNSHAKEN because it already knows how this ends —
    // right up until the moment it is interrupted.
    vitae: 260,
    keywords: [
        { kind: 'hide', n: 4 },
        { kind: 'unshaken' },
        { kind: 'wounding', n: 20 },
    ],
    stages: [
        {
            at: { vitaePct: 0.7 },
            name: 'IT BEGINS TO SPEAK',
            text: 'The man\'s face opens on the calf\'s neck and the first clause of the calamity gets out.',
            gain: [{ kind: 'venom', n: 6 }],
            threatBonus: 0.25,
        },
        {
            at: { vitaePct: 0.4 },
            name: 'IT NAMES THE YEAR',
            text: 'It tells you when. You did not want the when.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.4,
        },
        {
            at: { vitaePct: 0.15 },
            name: 'THE TELLING KILLS IT',
            text: 'It dies of finishing the sentence. It has decided to be finished before you are.',
            gain: [{ kind: 'swift' }],
            cleanse: true,
            threatBonus: 0.6,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [
        drop('void-essence', 60),
        drop('philosopher-tea', 30),
        drop('revive-crystal', 10),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    cards: [card('spoiled-poultice')],
    finalBlowLines: {
        brutal: 'The prophecy dies unspoken. Whatever it knew becomes, mercifully, unknowable.',
        quiet:  'It lies down like cattle before weather. The calamity will have to introduce itself.',
        ironic: 'It foresaw everything except being interrupted.',
    },
    causeLines: {
        brutal: 'It speaks the calamity, and the calamity, flattered, arrives early.',
        broken: 'You fight the prophecy word by word. The sentence finishes anyway.',
        quiet:  'It whispers the true thing. You sit down to consider it and do not stand up.',
    },
    journalEntry: {
        id: 'codex-kudan',
        title: 'The Prophecy That Chose Its Listener',
        body:
            'The kudan is always born knowing exactly one true thing, and it is always ' +
            'a catastrophe, and it always dies of the telling. The cruelty is not the ' +
            'knowledge. The cruelty is the choosing: it must find someone to survive ' +
            'the hearing. It looked at everyone in the forest, and it walked to you.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'unique', 'enemy'],
});

export const BullBegger = createEnemy({
    id: 'enemy-bull-begger',
    portraitAsset: 'bull-begger',
    name: 'Bull-Begger',
    stanceHint: 'It begs with a raised fist — the asking and the taking are one motion.',
    description: 'A bogey of the hollow lanes that begs with a raised fist. Refusal and charity anger it equally. It is the asking it loves.',
    level: 11,
    baseStats: enemyStatBudget(11, { heart: 1, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The raised fist finally lowers. Nobody was going to answer it anyway.',
        quiet:  'It stops asking, for the first time, and the silence is the closest thing to charity it ever received.',
        ironic: 'It begged for everything and kept none of it, including this.',
    },
    causeLines: {
        brutal: 'The asking and the taking arrive together, the way they always do.',
        broken: 'It begs and takes in the same motion, over and over, until there is nothing left to give or steal.',
        quiet:  'You offer something, once, to make it stop. It takes the offering and the rest besides.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const WeepingHead = createEnemy({
    id: 'enemy-weeping-head',
    portraitAsset: 'weeping-head',
    name: 'Weeping Head',
    stanceHint: 'It fights the way it cries: continuously, and at you.',
    description: 'It cries a river downward and calls the drowning grief. Pity it, and the current has your ankles.',
    level: 12,
    baseStats: enemyStatBudget(12, { heart: 3, body: 1, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('heart-draught', 30), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    cards: [card('thin-hymn')],
    finalBlowLines: {
        brutal: 'The river runs dry mid-current. The grief does not get to finish its sentence.',
        quiet:  'It cries one last, quiet time, and the crying is the whole of the ending.',
        ironic: 'It drowned everyone who pitied it. Pity was never on offer here.',
    },
    causeLines: {
        brutal: 'The current you pitied closes over your head without changing its expression.',
        broken: 'You wade in an inch at a time, sure you can stop. The grief has other plans for your ankles.',
        quiet:  'You feel sorry for it, once. The river remembers the exact moment.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const GoblinShaman = createEnemy({
    id: 'enemy-goblin-shaman',
    portraitAsset: 'goblin-shaman',
    name: 'Goblin Shaman',
    stanceHint: 'It consults before it strikes — three small gods, all of them owed.',
    description: 'Its rattle holds three small gods, all borrowed, all overdue. The interest is paid in other people\'s misfortunes.',
    level: 12,
    baseStats: enemyStatBudget(12, { heart: 1, body: 1, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('focus-vial', 15), drop('philosopher-tea', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 0 },
    cards: [card('shallow-grave')],
    finalBlowLines: {
        brutal: 'All three gods call in their debts at once. The shaman cannot cover the interest.',
        quiet:  'The rattle goes still. Three small gods, unpaid, go looking for a new creditor.',
        ironic: 'It spent its life collecting interest on borrowed misfortune. This one, it owed outright.',
    },
    causeLines: {
        brutal: 'The rattle shakes once, and three overdue gods collect on you instead.',
        broken: 'Interest accrues, misfortune by misfortune, until the debt is more than you can carry.',
        quiet:  'You ignore the rattle as noise. The gods inside it were never bluffing.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const Sugata = createEnemy({
    id: 'enemy-sugata',
    portraitAsset: 'sugata',
    name: 'Sugata, the Half-Erased',
    stanceHint: 'It moves on pure feeling — stopping, it fears, would finish the erasing.',
    description: 'A dancer mostly unwritten. It keeps dancing so the rest of it cannot be erased mid-step. Do not make it stop.',
    level: 13,
    baseStats: enemyStatBudget(13, { heart: 3, body: 2, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('heart-draught', 25), drop('quicksilver-vial', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 },
    finalBlowLines: {
        brutal: 'It stops mid-step. The erasing finishes what the dance was holding off.',
        quiet:  'It completes one last figure, and the rest of it goes quietly unwritten.',
        ironic: 'It danced to stay whole. Stopping was never the danger it thought you were.',
    },
    causeLines: {
        brutal: 'It keeps dancing straight through you, because stopping was never an option it kept.',
        broken: 'Step by step, it wears down whatever you brought to the fight, the way erasure wears down a page.',
        quiet:  'You watch it dance a beat too long. It finishes the figure inside your guard.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const PaleBrood = createEnemy({
    id: 'enemy-pale-brood',
    portraitAsset: 'pale-brood',
    name: 'Pale Brood',
    stanceHint: 'It remembers being winged — the fury is all forward.',
    description: 'The grave larva\'s paler kin. It hatched wrong and hungry, and it remembers, dimly, that it was supposed to have wings.',
    level: 14,
    baseStats: enemyStatBudget(14, { heart: 1, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'Whatever it remembered about flying dies with the rest of it, still unremembered.',
        quiet:  'It curls in on itself the way larvae do, and does not open again.',
        ironic: 'It spent its whole short life certain it was owed wings. It was owed nothing.',
    },
    causeLines: {
        brutal: 'It hits you with the fury of something that was promised more than this.',
        broken: 'It comes at you again and again, hungry the way only something unfinished can be.',
        quiet:  'You underestimate a thing still learning what it is. It finishes learning on you.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * Normal balance anchor. HAND-SET stats (5/36/34 = 75 = L15 × 5), cards and
 * the Phase 138 befriend tuning mirror the retired Audit Sentinel anchor so
 * the playtest balance scaffold keeps its Normal calibration point.
 */
export const TriEyes = createEnemy({
    id: 'enemy-tri-eyes',
    portraitAsset: 'tri-eyes',
    name: 'Tri-Eyes',
    stanceHint: 'It counts your errors through whichever eye you fail to watch.',
    description: 'Three sockets, one patient watcher. The third eye does not see more. It sees again, and keeps the tally.',
    level: 15,
    baseStats: { body: 5, mind: 36, heart: 34 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 30), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 0 },
    cards: [card('scolds-bridle'), card('passing-bell')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.7 },
        roundsThreshold: 1,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 50,
        alignmentDelta: { outlook: +2 },
        narrative:
            'All three eyes blink at once — a thing it has apparently been saving. ' +
            '"The tally balances," it says. "There was one error I kept recounting: ' +
            'assuming the count was the point."',
        flagSet: 'befriended-tri-eyes',
    },
    pactLines: {
        quiet:   'The third eye closes, voluntarily, for the length of a held breath. The tally stops needing you in it.',
        setDown: 'It sets the count down between you, mid-sum, and does not pick it back up.',
        heavy:   '"The tally balances." A long blink, all three sockets at once. "There was one error I kept recounting: assuming the count was the point."',
    },
    finalBlowLines: {
        brutal: 'The third eye closes last, still counting.',
        quiet:  'A methodical collapse, each error catalogued to the end.',
        ironic: 'You made it audit itself. The findings were unfavorable.',
    },
    causeLines: {
        brutal: 'The tally finds what it was kept for. The errors were yours.',
        broken: 'Error by error, the count proceeds. You are found wanting.',
        quiet:  'A single miscalculation. The third eye notes it, and closes the ledger.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const Mabadi = createEnemy({
    id: 'enemy-mabadi',
    portraitAsset: 'mabadi',
    name: 'Mabadi',
    stanceHint: 'The cane is a metronome — he strikes on beats you have not learned yet.',
    description: 'A withered duelist gone green with patience. His cane has outlasted better arguments than yours, and knows it.',
    level: 14,
    baseStats: enemyStatBudget(14, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(40), drop('body-elixir', 30), drop('whetstone-oil', 20), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    cards: [card('knucklebone-recant')],
    finalBlowLines: {
        brutal: 'The cane finally meets an argument it cannot outlast.',
        quiet:  'He sets the cane down, upright, the way a duelist concedes a bout he respected.',
        ironic: 'He outlasted every opponent who mattered. He did not outlast you, which is its own small argument.',
    },
    causeLines: {
        brutal: 'The cane finds the beat you had not learned yet, and finds it hard.',
        broken: 'He wears down your guard the way patience wears down everything, one measured strike at a time.',
        quiet:  'You move a half-beat early. He was already there, the way he always is.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const FrayedOne = createEnemy({
    id: 'enemy-frayed-one',
    portraitAsset: 'frayed-one',
    name: 'The Frayed One',
    stanceHint: 'It thinks in loose threads — and every thread it loses, it takes from something else.',
    description: 'A figure unravelling at every hem, and furious about it. Each thread it loses, it replaces with one of yours.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(40), drop('clarity-serum', 25), drop('void-essence', 20), drop('philosopher-tea', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('the-long-lent')],
    finalBlowLines: {
        brutal: 'The last thread goes, and there is nothing left to replace it with.',
        quiet:  'It comes fully undone, at last, into a pile of threads that were always going to be someone else\'s.',
        ironic: 'It spent itself trying not to unravel. Unraveling was the only trick it had left.',
    },
    causeLines: {
        brutal: 'It loses a thread and takes one of yours to cover the loss, mid-swing.',
        broken: 'Thread by thread, it patches itself with pieces it did not earn, and most of them are yours.',
        quiet:  'You stop paying attention to the fraying edges. It was counting on exactly that.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const BoneTotem = createEnemy({
    id: 'enemy-bone-totem',
    portraitAsset: 'bone-totem',
    name: 'Bone Totem',
    stanceHint: 'It stands its ground because it IS its ground — the curse assembles one word per skull.',
    description: 'Skulls stacked into a sentence. Each mouth holds one word of a curse still being assembled. Yours would finish it nicely.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 2, body: 2, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(40), drop('iron-skin-draught', 25), drop('clarity-serum', 20), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    cards: [card('unction-of-boils')],
    finalBlowLines: {
        brutal: 'The stack comes down before the sentence finishes. The curse goes unsaid.',
        quiet:  'The topmost skull settles, its one word spoken at last, to no one in particular.',
        ironic: 'It spent generations assembling a curse one word at a time. You supplied the last word for it, and it was no.',
    },
    causeLines: {
        brutal: 'The sentence finishes. It was never going to be a kind one.',
        broken: 'Word by word, skull by skull, the curse assembles itself around you.',
        quiet:  'You mishear one word as harmless. The sentence was never about being heard correctly.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const BoneWizard = createEnemy({
    id: 'enemy-bone-wizard',
    portraitAsset: 'bone-wizard',
    name: 'Bone Wizard',
    stanceHint: 'Pure study moves it — the flesh was a distraction it graded and discarded.',
    description: 'It studied its way out of flesh and calls the result wisdom. The peer review is ongoing. You are the peer.',
    level: 17,
    baseStats: enemyStatBudget(17, { heart: 1, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('philosopher-tea', 25), drop('clarity-serum', 25), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    cards: [card('spoiled-poultice')],
    finalBlowLines: {
        brutal: 'The peer review concludes, unfavorably, and permanently.',
        quiet:  'It sets down the last of its borrowed authority and returns, finally, to being bone.',
        ironic: 'It graded everything it met and found most of it wanting. This time, the wanting was its own.',
    },
    causeLines: {
        brutal: 'It grades the encounter and marks you down, thoroughly and at length.',
        broken: 'It studies your every opening, footnote by footnote, until there is nothing left ungraded.',
        quiet:  'You make one small error. Its whole education was built to notice exactly that.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

/**
 * Boss balance anchor. HAND-SET stats (5/20/65 = 90 = L18 × 5), boss logic and
 * card kit mirror the retired Balance Judge anchor so the playtest scaffold
 * keeps its difficult-but-doable calibration point.
 */
export const Mirac = createEnemy({
    id: 'enemy-mirac',
    portraitAsset: 'mirac',
    name: 'Mirac',
    stanceHint: 'The verdict is felt before it is reasoned — the red court rules from the chest.',
    description: 'A red verdict beneath a hooded court. It arrives at sentence first and works backward, patiently, to the crime.',
    level: 18,
    baseStats: { body: 5, mind: 20, heart: 65 },
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    vitae: 330,
    keywords: [
        { kind: 'hide', n: 6 },
        { kind: 'unshaken' },
        { kind: 'wounding', n: 30 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE VERDICT IS BACKDATED',
            text: 'It stops working backward toward the crime. The crime will be supplied.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE RED ORB OPENS',
            text: 'Everything it lights has already been found guilty of standing there.',
            gain: [{ kind: 'swift' }],
            heal: { pct: 0.08 },
            threatBonus: 0.55,
            curseCardId: 'overheard-name',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 40),
        drop('void-essence', 30),
        drop('revive-crystal', 20),
        drop('resonance-crystal', 10),
    ],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('the-long-lent'), card('unction-of-boils'), card('ossuary-drawer')],
    finalBlowLines: {
        brutal: 'The court adjourns violently. The verdict, unread, unhappens.',
        quiet:  'The hood bows. The red orb dims to a case dismissed.',
        ironic: 'It worked backward from your sentence and arrived at its own.',
    },
    causeLines: {
        brutal: 'The sentence lands first. The crime is drafted from what remains of you.',
        broken: 'Appeal by appeal, the court outlasts your objections.',
        quiet:  'The gavel falls somewhere soft. You are guilty of exactly what you were.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// NORTHERN FOREST — mid game (L19-31), 13 foes
// ═══════════════════════════════════════════════════════════════════════════════

export const CursedPaladin = createEnemy({
    id: 'enemy-cursed-paladin',
    portraitAsset: 'cursed-paladin',
    name: 'Cursed Paladin',
    stanceHint: 'The armor swings on muscle memory — the oath does the aiming.',
    description: 'The oath survived the faith. It walks the armor around, looking for someone to be right at.',
    level: 19,
    baseStats: enemyStatBudget(19, { heart: 2, body: 4, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('iron-skin-draught', 25), drop('body-elixir', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('knucklebone-recant'), card('thin-hymn')],
    finalBlowLines: {
        brutal: 'The armor stops walking. The oath inside it finally runs out of people to be right at.',
        quiet:  'It kneels, an old posture the armor remembers better than the man ever did.',
        ironic: 'It searched for someone to be right at for longer than it had a faith left to be right about. It found you instead.',
    },
    causeLines: {
        brutal: 'The oath swings through you the way it swings through every argument: certain, and total.',
        broken: 'It keeps being right at you, round after round, long after being right stopped being a virtue.',
        quiet:  'You concede a point, just to end it. The armor takes the concession as an opening.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const VampireThrall = createEnemy({
    id: 'enemy-vampire-thrall',
    portraitAsset: 'vampire-thrall',
    name: 'Vampire Thrall',
    stanceHint: 'It throws itself forward — its will is elsewhere, holding the leash.',
    description: 'It gave its will away in installments and calls the receipts devotion. The final payment is always someone else\'s.',
    level: 20,
    baseStats: enemyStatBudget(20, { heart: 2, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('body-elixir', 25), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('unction-of-boils')],
    finalBlowLines: {
        brutal: 'The final installment comes due, and there is no will left to pay it with.',
        quiet:  'It stops reaching, mid-payment, the debt finally called even.',
        ironic: 'It spent its will down to nothing chasing someone else\'s leash. It dies owing itself the most.',
    },
    causeLines: {
        brutal: 'It throws everything it has left at you, on credit it will never be asked to repay.',
        broken: 'Installment by installment, it wears you down on someone else\'s account.',
        quiet:  'You mistake its devotion for exhaustion. The devotion has more left in it than you do.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const HasshakuSama = createEnemy({
    id: 'enemy-hasshaku-sama',
    portraitAsset: 'hasshaku-sama',
    name: 'Hasshaku-sama',
    stanceHint: 'Everything she does is affection, scaled wrong — the choosing came from the heart.',
    description: 'Eight feet of mother under a white hat. She has chosen you, and her choosing has never once been refused.',
    level: 21,
    baseStats: enemyStatBudget(21, { heart: 4, body: 2, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('heart-draught', 30), drop('healing-potion', 25), drop('resonance-crystal', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: -67 },
    cards: [card('thin-hymn'), card('thin-hymn')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.4 },
        roundsThreshold: 3,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('resonance-crystal')! },
            { ...getConsumableById('heart-draught')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 45,
        alignmentDelta: { scope: -2 },
        narrative:
            'She kneels, which takes a while, from eight feet. For the first time her ' +
            'face arrives at the height faces are supposed to be. "Everyone runs," she ' +
            'says. "The choosing was never a hunt. It was only ever an offer, made too tall."',
        flagSet: 'befriended-hasshaku-sama',
    },
    pactLines: {
        quiet:   'She stops following. Being followed, it turns out, was most of the fear.',
        setDown: 'She sets her white hat down between you. Under it, all along: nothing but the wanting.',
        heavy:   '"I chose you because you looked at me and saw someone choosing. Everyone else saw something happening to them."',
    },
    journalEntry: {
        id: 'codex-hasshaku-sama',
        title: 'The Offer Made Too Tall',
        body:
            'The stories agree she takes the ones she chooses. The stories are told by ' +
            'the ones who ran, which is everyone, which is why the stories agree. ' +
            'Nobody has stayed long enough to learn what the choosing was FOR. ' +
            'The hat, for the record, was always an apology for the height.',
    },
    finalBlowLines: {
        brutal: 'Eight feet of mother comes down like weather.',
        quiet:  'She folds, joint by too-long joint, into something finally small enough to mourn.',
        ironic: 'She chose you. On this one occasion, the choosing was refused.',
    },
    causeLines: {
        brutal: 'The embrace closes. Affection at that scale is indistinguishable from collapse.',
        broken: 'She follows and follows and follows. Everyone tires before she does.',
        quiet:  'You let her choose you. The stories were unclear about what happens next, and now so are you.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const JeweledTree = createEnemy({
    id: 'enemy-jeweled-tree',
    portraitAsset: 'jeweled-tree',
    name: 'The Jeweled Tree',
    stanceHint: 'It feeds on wanting — the whole fight is an appeal to your appetite.',
    description: 'Its trunk is set with gemstone eyes that watch you want them. Wanting is how it feeds. The mouth is for afterward.',
    level: 22,
    baseStats: enemyStatBudget(22, { heart: 4, body: 1, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    // Phase 102 — the gemstone eyes do not stay in the bark. SUMMON 2.
    // `keywords` REPLACES `defaultEnemyKeywords` wholesale (see `Enemy/index.ts`),
    // so HIDE 5 is re-listed by hand to keep the retrofit from being a silent
    // nerf; the auto SWIFT is DELIBERATELY dropped — an elite carries 1-2
    // keywords by budget, and the wall is now this fight's honest second line
    // against the brood rather than something the foe halves.
    keywords: [
        { kind: 'hide', n: 5 },
        { kind: 'summon', n: 2, addName: 'Brier Shoot' },
    ],
    loot: [none(25), drop('resonance-crystal', 30), drop('heart-draught', 25), drop('greater-healing-potion', 20)],
    philosophicalAlignment: { epistemology: -67, outlook: 67, scope: 67 },
    cards: [card('thin-hymn')],
    finalBlowLines: {
        brutal: 'The trunk splits before the mouth gets its turn.',
        quiet:  'The gemstone eyes dim, one by one, the wanting finally unmet.',
        ironic: 'It fed on wanting for a thousand years. You wanted nothing from it, and that, it turns out, starves.',
    },
    causeLines: {
        brutal: 'The mouth gets its turn after all, and the turn is the whole of it.',
        broken: 'It feeds on your wanting a little at a time, and the wanting does not run out before you do.',
        quiet:  'You look too long at the gemstones. The looking was the first bite.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const OgreNaga = createEnemy({
    id: 'enemy-ogre-naga',
    portraitAsset: 'ogre-naga',
    name: 'Ogre Naga',
    stanceHint: 'Coils first, questions never — it swallows counterarguments whole.',
    description: 'Coils of appetite under a crown of teeth. It has never lost a debate it could reach.',
    level: 23,
    baseStats: enemyStatBudget(23, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('body-elixir', 30), drop('hunters-elixir', 20), drop('greater-healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('unction-of-boils')],
    finalBlowLines: {
        brutal: 'The coils go slack. The debate ends the one way it never has: unfinished.',
        quiet:  'It settles into itself, crown and coil both, and does not rise for the next argument.',
        ironic: 'It never lost a debate it could reach. This one, it could not.',
    },
    causeLines: {
        brutal: 'The crown of teeth closes on the argument, and the argument was you.',
        broken: 'Coil by coil, it tightens the terms until there is no room left to disagree.',
        quiet:  'You step within reach for one exchange. Reach was the entire debate.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const Sidelle = createEnemy({
    id: 'enemy-sidelle',
    portraitAsset: 'sidelle',
    name: 'Sidelle',
    stanceHint: 'It could fly and chooses to crawl — everything it does is a pointed refusal.',
    description: 'A winged frame of bone that crawls when it could fly, out of spite. The spite is structural.',
    level: 24,
    baseStats: enemyStatBudget(24, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('whetstone-oil', 25), drop('body-elixir', 25), drop('greater-healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('knucklebone-recant')],
    finalBlowLines: {
        brutal: 'The spite finally runs out of structure to hold it up.',
        quiet:  'It folds its wings for the first time, an old capitulation it never once used.',
        ironic: 'It could have flown the whole time. It chose to crawl, out of spite, all the way to this.',
    },
    causeLines: {
        brutal: 'It crawls through your guard the way it crawls through everything: on principle, and hard.',
        broken: 'It refuses every easier path, and drags you down the hard one alongside it.',
        quiet:  'You expect it to fly. It never does. That expectation costs you the exchange.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const RawheadRex = createEnemy({
    id: 'enemy-rawhead-rex',
    portraitAsset: 'rawhead-rex',
    name: 'Rawhead Rex',
    stanceHint: 'A cellar-thing of pure muscle — the courtesy is over.',
    description: 'Rawhead and bloody-bones, up from under the stairs. The cellar was a courtesy. It is done extending it.',
    level: 25,
    baseStats: enemyStatBudget(25, { heart: 2, body: 4, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // A slab of cellar meat: well above the curve, but low HIDE — nothing about
    // rawhead is armoured. It just does not stop.
    vitae: 500,
    keywords: [
        { kind: 'hide', n: 5 },
        { kind: 'brutal' },
        { kind: 'ravenous' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'UP FROM UNDER THE STAIRS',
            text: 'It stops waiting to be come for.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'BLOODY BONES',
            text: 'It sheds the rawhead. The bones underneath were always the sharp part.',
            gain: [{ kind: 'wounding', n: 40 }],
            heal: 70,
            threatBonus: 0.5,
            curseCardId: 'gnaw-marks',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('greater-healing-potion', 40),
        drop('body-elixir', 25),
        drop('berserker-brew', 20),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('unction-of-boils'), card('knucklebone-recant'), card('passing-bell')],
    finalBlowLines: {
        brutal: 'The bloody bones come apart into their two advertised components.',
        quiet:  'It backs down the cellar stairs one last time, and the dark closes politely behind it.',
        ironic: 'The thing under the stairs met the thing it was warned about as a cub. It was you.',
    },
    causeLines: {
        brutal: 'It takes you the way the stories promised it would, which is suddenly.',
        broken: 'You hold the cellar door round after round. The hinges give before it does.',
        quiet:  'You check under the stairs, the way children are told not to. The stories were load-bearing.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const FateSpinner = createEnemy({
    id: 'enemy-fate-spinner',
    portraitAsset: 'fate-spinner',
    name: 'The Fate-Spinner',
    stanceHint: 'Every move a reasoned counter — the web was drafted before you arrived.',
    description: 'An old man with a spider\'s patience, spinning your next mistake from the thread of your last one. The web is mostly finished.',
    level: 26,
    baseStats: enemyStatBudget(26, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // An old man in a web. Under the curve — the web is the durability, and the
    // web is ELUSIVE until you land a rung on him.
    vitae: 360,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'elusive' },
        { kind: 'venom', n: 6 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE PATTERN CLOSES',
            text: 'He stops spinning your next mistake and spins your last one a second time.',
            gain: [{ kind: 'swift' }],
            cleanse: true,
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE DRAWER OF LOOSE THREAD',
            text: 'He opens the little drawer he has been saving and pulls the one strand he never spun.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.5,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 40),
        drop('clarity-serum', 30),
        drop('focus-vial', 20),
        drop('revive-crystal', 10),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    cards: [card('shallow-grave'), card('scolds-bridle'), card('spoiled-poultice')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        roundsThreshold: 8,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('focus-vial')! },
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('clarity-serum')! },
        ],
        xpBonus: 80,
        alignmentDelta: { scope: +1 },
        narrative:
            'The spinning stops. "I have woven ten thousand endings," he says, folding ' +
            'limbs that were never all arms. "You kept choosing threads I had not spun. ' +
            'Do you know what that makes you? Loose thread. I had forgotten they existed. ' +
            'I find I would rather watch where you unravel to."',
        flagSet: 'befriended-fate-spinner',
        factionDeltas: {
            'merchant-guild': -10,
            'forest-wardens': +12,
        },
    },
    pactLines: {
        quiet:   'The loom stills. For the first time, the next moment is genuinely unwoven.',
        setDown: 'He snips a single thread and offers it: your next mistake, unmade, as a keepsake.',
        heavy:   '"I spun every ending but my own. You have shown me the appeal of not knowing. It is terrible. Keep doing it."',
    },
    journalEntry: {
        id: 'codex-fate-spinner',
        title: 'Loose Thread',
        body:
            'He does not weave what will happen. He weaves what people, left to ' +
            'themselves, would do anyway — which is how he stayed infallible for so ' +
            'long. Free will, he maintains, is just a mistake nobody has spun yet. ' +
            'He keeps one drawer of loose thread. It is nearly empty. It is his favorite.',
    },
    finalBlowLines: {
        brutal: 'The web collapses inward, every prophecy suddenly load-bearing and suddenly wrong.',
        quiet:  'He sets down the spindle and lets the last thread run out on its own.',
        ironic: 'He spun your every mistake. The strike that ended him was not one.',
    },
    causeLines: {
        brutal: 'The thread of your last mistake was already anchored. The web merely tightens.',
        broken: 'Mistake by mistake, the pattern closes. You were the final motif.',
        quiet:  'You pause to admire the weave. That was the mistake it was waiting on.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const AshenBoneDrake = createEnemy({
    id: 'enemy-ashen-bone-drake',
    portraitAsset: 'ashen-bone-drake',
    name: 'Ashen Bone Drake',
    stanceHint: 'What remains of it is the part that says no — force, distilled.',
    description: 'A drake burned down to the argument of itself. What survived the fire is the part that refuses.',
    level: 27,
    baseStats: enemyStatBudget(27, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('iron-skin-draught', 25), drop('greater-healing-potion', 25), drop('war-horn-draught', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    cards: [card('knucklebone-recant'), card('shallow-grave')],
    finalBlowLines: {
        brutal: 'What refused finally has nothing left to refuse with.',
        quiet:  'The ash settles. Even the argument, eventually, runs out of fire to make its point with.',
        ironic: 'It survived the fire that took everything else by refusing to stop. It could not refuse this.',
    },
    causeLines: {
        brutal: 'It answers with the only argument the fire left it: force, entire.',
        broken: 'It refuses, again and again, to be the thing that yields, and neither, eventually, are you.',
        quiet:  'You mistake the ash for spent. What is left underneath was never going to be reasoned with.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const RaAminKa = createEnemy({
    id: 'enemy-ra-amin-ka',
    portraitAsset: 'ra-amin-ka',
    name: 'Ra-Amin-Ka',
    stanceHint: 'Cold administration — every strike is a decree, countersigned.',
    description: 'A king wrapped against time, still issuing decrees. The bandages are signed. The kingdom is presumed loyal.',
    level: 28,
    baseStats: enemyStatBudget(28, { heart: 2, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // Layer on layer of signed linen: high HIDE, and the wrappings re-wrap.
    vitae: 540,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'regrow', n: 5 },
        { kind: 'wounding', n: 45 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE DECREE IS COUNTERSIGNED',
            text: 'A second signature works its way up through the linen. It was always going to.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE KINGDOM IS PRESUMED LOYAL',
            text: 'He calls up an army four thousand years dead. Something in the dust answers roll.',
            gain: [{ kind: 'swift' }],
            heal: { pct: 0.12 },
            threatBonus: 0.5,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        body: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 35),
        drop('void-essence', 30),
        drop('greater-resonance-crystal', 20),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 67 },
    cards: [card('ossuary-drawer'), card('spoiled-poultice'), card('petty-indictment')],
    finalBlowLines: {
        brutal: 'The wrappings unwind all at once. The decree inside was four thousand years of dust.',
        quiet:  'The king lies back down. The administration, at very long last, adjourns.',
        ironic: 'He outlasted his kingdom, his gods, and his language. He did not outlast the appeal process.',
    },
    causeLines: {
        brutal: 'The decree is executed. So, by administrative necessity, are you.',
        broken: 'You contest the paperwork clause by clause. The kingdom of dust has infinite clerks.',
        quiet:  'You bow, briefly, out of habit. The court records it as an oath of service, in perpetuity.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const LadyGabriella = createEnemy({
    id: 'enemy-lady-gabriella',
    portraitAsset: 'lady-gabriella',
    name: 'Lady Gabriella',
    stanceHint: 'Courtesy is the weapon — the feelings are real, which is the trap.',
    description: 'She has outlived every appetite except courtesy. Dinner is served the moment you stop being a guest.',
    level: 29,
    baseStats: enemyStatBudget(29, { heart: 4, body: 2, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('heart-draught', 30), drop('regeneration-tonic', 20), drop('greater-healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('thin-hymn'), card('thin-hymn')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.35 },
        roundsThreshold: 5,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('regeneration-tonic')! },
            { ...getConsumableById('heart-draught')! },
        ],
        xpBonus: 40,
        alignmentDelta: { outlook: +2 },
        narrative:
            '"Four centuries of guests," she says, setting down a glass that was never ' +
            'wine, "and you are the first to notice I keep the chairs at conversation ' +
            'distance." She smiles with the mouth she uses for meaning it. "Stay for ' +
            'nothing, then. It is the rarest thing served in this house."',
        flagSet: 'befriended-lady-gabriella',
    },
    pactLines: {
        quiet:   'The table between you stays a table. Nothing on it is a menu.',
        setDown: 'She sets down the glass, and with it the whole apparatus of the invitation.',
        heavy:   '"Hunger is easy company. It always agrees with you. You disagreed. I had forgotten how filling that is."',
    },
    journalEntry: {
        id: 'codex-lady-gabriella',
        title: 'Conversation Distance',
        body:
            'The house has hosted eleven generations of the finest families, none of ' +
            'whom left. Her courtesy is not camouflage. It is the last human habit, ' +
            'defended at terrible cost. The chairs are placed at conversation distance ' +
            'because the alternative distance is reach.',
    },
    finalBlowLines: {
        brutal: 'Four centuries of appetite settle their account at once.',
        quiet:  'She declines, at last, to rise from the table.',
        ironic: 'She died as she lived: refusing to make a scene.',
    },
    causeLines: {
        brutal: 'The courtesy concludes. What follows it is very old and very quick.',
        broken: 'Course by course, the dinner proceeds. You realize too late which one you are.',
        quiet:  'You stop being a guest for one unguarded moment. House rules apply.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const Zoma = createEnemy({
    id: 'enemy-zoma',
    portraitAsset: 'zoma',
    name: 'Zoma, Twin-Voiced',
    stanceHint: 'Two minds, one patient argument — they disagree only about which of them loves you less.',
    description: 'Two heads sharing one patient argument. They disagree only about which of them loves you less.',
    level: 30,
    baseStats: enemyStatBudget(30, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('philosopher-tea', 30), drop('clarity-serum', 25), drop('greater-resonance-crystal', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 0 },
    cards: [card('scolds-bridle'), card('shallow-grave')],
    finalBlowLines: {
        brutal: 'Both heads go still at once. For once, the argument resolves unanimously.',
        quiet:  'The two voices trail into the same silence, having finally agreed on something.',
        ironic: 'They spent their whole shared life disagreeing about which one loved you less. Neither gets to finish the point.',
    },
    causeLines: {
        brutal: 'Two heads land the same blow from two directions, and the disagreement was never about mercy.',
        broken: 'One head wears you down while the other argues about the pace. Both get their way eventually.',
        quiet:  'You listen to one voice and miss the other. The second one was always the one to watch.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const MabadiUndrowned = createEnemy({
    id: 'enemy-mabadi-undrowned',
    portraitAsset: 'mabadi-undrowned',
    name: 'Mabadi, Undrowned',
    stanceHint: 'The same metronome, colder — the river taught him new beats.',
    description: 'Mabadi again, colder. The river gave him back with interest, and he has come to collect the principal.',
    level: 31,
    baseStats: enemyStatBudget(31, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('body-elixir', 25), drop('whetstone-oil', 25), drop('supreme-healing-potion', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    cards: [card('knucklebone-recant'), card('spoiled-poultice')],
    finalBlowLines: {
        brutal: 'The interest goes uncollected. The principal, this once, keeps its debtor.',
        quiet:  'He sets the cane down in the shallows, the debt closed on terms he did not choose.',
        ironic: 'The river gave him back to collect. It did not warn him what collecting would cost.',
    },
    causeLines: {
        brutal: 'He collects the principal with a coldness the river taught him and you never learned to match.',
        broken: 'He calls the debt in a little at a time, round after round, colder than the man he was.',
        quiet:  'You mistake the calm for the old Mabadi\'s patience. The river replaced patience with arithmetic.',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// NORTHERN FOREST — late game (L34-50), 13 foes
// ═══════════════════════════════════════════════════════════════════════════════

export const TriEyesHollowed = createEnemy({
    id: 'enemy-tri-eyes-hollowed',
    portraitAsset: 'tri-eyes-hollowed',
    name: 'Tri-Eyes, Hollowed',
    stanceHint: 'The tally continues without a reason — cold arithmetic, self-sustaining.',
    description: 'The watcher with nothing left to want. It counts errors now purely for the counting, which makes it faster.',
    level: 34,
    baseStats: enemyStatBudget(34, { heart: 1, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
    },
    loot: [none(30), drop('clarity-serum', 25), drop('philosopher-tea', 25), drop('void-essence', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('passing-bell'), card('the-long-lent')],
    finalBlowLines: {
        brutal: 'The third eye finds an error it cannot finish cataloguing.',
        quiet:  'All three sockets go dark at once, the tally closed with nothing left to want it open.',
        ironic: 'It counted for the counting\'s own sake, long after wanting anything else had left it. The count still ends.',
    },
    causeLines: {
        brutal: 'The tally finds you wanting, and wanting, for this watcher, has only ever meant one thing.',
        broken: 'Error by error, faster now that nothing else moves it, the count wears you down to a number.',
        quiet:  'You make no mistake it can see. It counts the absence of one instead, and that is enough.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'elite', 'enemy'],
});

export const BlackDeath = createEnemy({
    id: 'enemy-black-death',
    portraitAsset: 'black-death',
    name: 'The Black Death',
    stanceHint: 'A plague with posture — it spreads by main force now.',
    description: 'A pestilence that acquired a spine and decided walking beats waiting. It remembers every town by taste.',
    level: 36,
    baseStats: enemyStatBudget(36, { heart: 2, body: 4, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
    },
    loot: [none(25), drop('antidote', 30), drop('supreme-healing-potion', 25), drop('phoenix-tear', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('unction-of-boils'), card('knucklebone-recant')],
    finalBlowLines: {
        brutal: 'The spine finally gives out what the plague never could.',
        quiet:  'It stops walking, at last, and the stillness reads like every town it never got to.',
        ironic: 'It walked because waiting cost it towns. Walking, in the end, cost it more.',
    },
    causeLines: {
        brutal: 'It remembers your town\'s taste and takes a second helping, unasked.',
        broken: 'It spreads through your guard the patient way plague always has, town by town, breath by breath.',
        quiet:  'You hold your ground a moment too long. It was always going to prefer that to a chase.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'elite', 'enemy'],
});

export const TheUnnameable = createEnemy({
    id: 'enemy-the-unnameable',
    portraitAsset: 'the-unnameable',
    name: 'The Unnameable',
    stanceHint: 'It thinks in shapes language was built to avoid.',
    description: 'It is not that it has no name. It is that every name tried so far has been eaten, along with the namer.',
    level: 38,
    baseStats: enemyStatBudget(38, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
    },
    loot: [none(25), drop('void-essence', 35), drop('philosopher-tea', 20), drop('supreme-healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('spoiled-poultice'), card('shallow-grave')],
    finalBlowLines: {
        brutal: 'It goes down still unnamed. No one survives long enough to try again.',
        quiet:  'It folds into the shape language avoided all along, and the avoiding, at last, is complete.',
        ironic: 'It ate every name anyone offered it. It leaves without one, which may have been the point.',
    },
    causeLines: {
        brutal: 'It answers in the shape it thinks in, and the shape was built to avoid surviving it.',
        broken: 'You try to name what is happening to you. The trying, apparently, is the meal.',
        quiet:  'You look at it too directly, once. Looking, it turns out, was the naming it wanted.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'elite', 'enemy'],
});

export const FireGiant = createEnemy({
    id: 'enemy-fire-giant',
    portraitAsset: 'fire-giant',
    name: 'Fire Giant',
    stanceHint: 'A furnace with a genealogy — everything he does is a hammer blow.',
    description: 'A furnace with a genealogy. His sword remembers being a mountain\'s spine, and resents the demotion.',
    level: 40,
    baseStats: enemyStatBudget(40, { heart: 1, body: 4, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
    },
    loot: [none(25), drop('war-horn-draught', 30), drop('supreme-healing-potion', 25), drop('iron-skin-draught', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 },
    cards: [card('unction-of-boils'), card('knucklebone-recant')],
    finalBlowLines: {
        brutal: 'The furnace goes cold in one motion. The genealogy ends here, undocumented.',
        quiet:  'He sets the sword down, and for a moment it is only a mountain\'s spine again, resting.',
        ironic: 'The sword resented being demoted from mountain to blade. It got its wish: it is nothing again.',
    },
    causeLines: {
        brutal: 'The hammer blow lands with the weight of a whole mountain\'s resentment.',
        broken: 'Blow after blow, the furnace does not cool, and neither does what it is doing to you.',
        quiet:  'You block once, correctly. The sword remembers being bedrock. Bedrock does not care about correctly.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'elite', 'enemy'],
});

export const GreaterDevil = createEnemy({
    id: 'enemy-greater-devil',
    portraitAsset: 'greater-devil',
    name: 'Greater Devil',
    stanceHint: 'It administers rather than rages — the contract is the cage.',
    description: 'It holds an office older than the sin it administers. The paperwork is flawless. The flaw is you.',
    level: 42,
    baseStats: enemyStatBudget(42, { heart: 2, body: 3, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(25), drop('void-essence', 30), drop('supreme-healing-potion', 25), drop('greater-resonance-crystal', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    cards: [card('scolds-bridle'), card('ossuary-drawer')],
    finalBlowLines: {
        brutal: 'The paperwork, for once, fails to account for the outcome.',
        quiet:  'It sets down the ledger, the office finally, formally, vacated.',
        ironic: 'It administered a contract with no flaw in it anywhere. The flaw was never in the contract.',
    },
    causeLines: {
        brutal: 'The contract executes itself, flawlessly, exactly as filed, and you are the line item.',
        broken: 'Clause by clause, the paperwork finds every opening you did not know you signed away.',
        quiet:  'You skim the terms instead of reading them. The office was counting on exactly that.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'elite', 'enemy'],
});

export const Rangda = createEnemy({
    id: 'enemy-rangda',
    portraitAsset: 'rangda',
    name: 'Rangda',
    stanceHint: 'Grief that learned sorcery — every curse arrives still weeping.',
    description: 'The widow-queen of the leftmost path. Her grief learned sorcery, and has never once stopped studying.',
    level: 44,
    baseStats: enemyStatBudget(44, { heart: 4, body: 2, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // Under the curve — a widow, not a wall. The pressure is REGROW: grief has
    // been in training longer than your certainty.
    vitae: 670,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'venom', n: 14 },
        { kind: 'regrow', n: 7 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE MASK COMES AWAY',
            text: 'Under the monster there is a widow, mid-sentence, four centuries in. She finishes the sentence.',
            cleanse: true,
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE COURSEWORK CONCLUDES',
            text: 'She sets down four hundred years of study and applies every page of it at once.',
            gain: [{ kind: 'brutal' }],
            heal: { pct: 0.1 },
            threatBonus: 0.55,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 3, defend: 3 },
        mind:  { attack: 2, defend: 2 },
    },
    loot: [
        drop('phoenix-tear', 35),
        drop('supreme-healing-potion', 25),
        drop('void-essence', 25),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    cards: [card('thin-hymn'), card('the-long-lent'), card('shallow-grave')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        roundsThreshold: 8,
    },
    friendshipReward: {
        // Phase 21 — procedural equipment retired (consumables/currency only).
        items: [
            { ...getConsumableById('phoenix-tear')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 175,
        alignmentDelta: { outlook: +3, scope: -2 },
        narrative:
            'The mask comes away. It was a mask. Nobody in living memory had grounds ' +
            'to suspect that.\n\n"They made my mourning a monster because it would not ' +
            'end on schedule," she says. "So I studied. Grief is only love with ' +
            'nowhere to go, and I have four hundred years of coursework."\n\n' +
            'She looks at you the way the recently widowed look at weather. ' +
            '"You stayed past the frightening part. That is the whole of witchcraft, ' +
            'you know. Everyone leaves at the frightening part."',
        flagSet: 'befriended-rangda',
        factionDeltas: {
            'forest-wardens': +10,
            'coastal-guard': -6,
        },
    },
    pactLines: {
        quiet:   'The leftmost path straightens slightly. Grief, witnessed, walks a little truer.',
        setDown: 'She sets the mask face-down between you. Underneath it: a widow, mid-sentence, four centuries in.',
        heavy:   '"Grief is only love with nowhere to go. You stood still long enough to be somewhere. That is more than the gods managed."',
    },
    journalEntry: {
        id: 'codex-rangda',
        title: 'The Coursework of Mourning',
        body:
            'The village drove her out for mourning too long, then blamed the crops on ' +
            'her, then the children, then the weather. Each accusation she studied, ' +
            'and passed. It is the oldest curriculum: make a woman a monster and she ' +
            'will eventually stop wasting the tuition.',
    },
    finalBlowLines: {
        brutal: 'Four hundred years of studied grief disperses in one uncontrolled release.',
        quiet:  'The widow-queen sets down her mourning like a bag carried too far.',
        ironic: 'Her grief finally found somewhere to go.',
    },
    causeLines: {
        brutal: 'The curse arrives still weeping, which does not slow it down.',
        broken: 'Her sorrow has more stamina than your certainty. It has been in training longer.',
        quiet:  'You pity her for one instructional moment. Lesson one: pity is a door.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const ZomaAscendant = createEnemy({
    id: 'enemy-zoma-ascendant',
    portraitAsset: 'zoma-ascendant',
    name: 'Zoma Ascendant',
    stanceHint: 'The two voices agree now — consensus, it turns out, was the threat.',
    description: 'The twin voices in agreement at last. Consensus, it turns out, was the threat the arguing held back.',
    level: 45,
    baseStats: enemyStatBudget(45, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    vitae: 700,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'swift' },
        { kind: 'wounding', n: 60 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE MOTION CARRIES',
            text: 'Both mouths say the same word. The word is your name, and it is not a question.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'UNANIMOUS',
            text: 'Nothing left in it disagrees with anything else in it. The arguing was the leash.',
            gain: [{ kind: 'unshaken' }],
            cleanse: true,
            threatBonus: 0.55,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 35),
        drop('void-essence', 30),
        drop('greater-resonance-crystal', 20),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('shallow-grave'), card('ossuary-drawer'), card('scolds-bridle')],
    finalBlowLines: {
        brutal: 'The two heads disagree one final, fatal time — about which of them was struck.',
        quiet:  'Both voices finish the same sentence and, having nothing left to settle, stop.',
        ironic: 'You gave them something new to argue about. The consensus did not survive it.',
    },
    causeLines: {
        brutal: 'Two verdicts arrive simultaneously and both are correct.',
        broken: 'You cannot out-argue a thing that has already heard both sides of you.',
        quiet:  'The voices agree about you, gently, in unison. Agreement at that register is a sentence.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const ElderFireGiant = createEnemy({
    id: 'enemy-elder-fire-giant',
    portraitAsset: 'elder-fire-giant',
    name: 'Elder Fire Giant',
    stanceHint: 'A fire gone white with age — it burns the way glaciers move: entirely.',
    description: 'A fire so old it has gone white. It burns the way glaciers move: slowly, and entirely.',
    level: 46,
    baseStats: enemyStatBudget(46, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // The roster's wall. Top of the +25% band, the highest HIDE outside the
    // uniques, and nothing you do makes it hurry.
    vitae: 950,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'unshaken' },
        { kind: 'brutal' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE COALS ARE BANKED',
            text: 'It stops burning outward and starts burning down. Everything near it gets older.',
            heal: { pct: 0.12 },
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'WHITE',
            text: 'The colour goes out of the fire. What is left is the part that does not need fuel.',
            gain: [{ kind: 'swift' }],
            cleanse: true,
            threatBonus: 0.6,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 2, defend: 2 },
    },
    loot: [
        drop('supreme-healing-potion', 35),
        drop('war-horn-draught', 25),
        drop('phoenix-tear', 25),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    cards: [card('unction-of-boils'), card('knucklebone-recant'), card('passing-bell')],
    finalBlowLines: {
        brutal: 'The white fire goes out all at once, and the cold that follows has a genealogy too.',
        quiet:  'The elder banks his own coals, unhurried to the end.',
        ironic: 'The oldest fire in the world went out indoors, in company, mid-sentence.',
    },
    causeLines: {
        brutal: 'The blade that was a mountain\'s spine settles the question of yours.',
        broken: 'You cannot outlast a thing that measures patience in eruptions.',
        quiet:  'The warmth reaches you at last. Everything the white fire warms, it keeps.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const Tezcatlipoca = createEnemy({
    id: 'enemy-tezcatlipoca',
    portraitAsset: 'tezcatlipoca',
    name: 'Tezcatlipoca',
    stanceHint: 'The smoking mirror calculates — it shows you the you that already lost.',
    description: 'The smoking mirror. It shows you the version of yourself that already lost, and waits, courteously, for you to agree.',
    level: 47,
    baseStats: enemyStatBudget(47, { heart: 2, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // Smoke, so a small printed HIDE — but ELUSIVE doubles it to 16 until you
    // stagger the mirror. The whole fight is the control check.
    vitae: 630,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'elusive' },
        { kind: 'wounding', n: 65 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE MIRROR TURNS',
            text: 'It stops showing you the one who lost and starts showing the one who is losing.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'IT DECLINES TO REVIEW ITSELF',
            text: 'The god steps out of the reflection and leaves the reflection fighting on without him.',
            gain: [{ kind: 'brutal' }],
            cleanse: true,
            threatBonus: 0.5,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('void-essence', 35),
        drop('philosopher-tea', 25),
        drop('greater-resonance-crystal', 20),
        drop('revive-crystal', 20),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('shallow-grave'), card('ossuary-drawer'), card('the-long-lent')],
    finalBlowLines: {
        brutal: 'The mirror takes one last look at itself. The smoke declines to survive the review.',
        quiet:  'The reflection bows first. The god, being thorough, follows it down.',
        ironic: 'It showed you the version of you that lost. You introduced it to the other one.',
    },
    causeLines: {
        brutal: 'The version of you that already lost reaches out of the smoke and files the paperwork.',
        broken: 'Round by round you argue with your own reflection, and it has seen your rebuttals.',
        quiet:  'You agree with the mirror, only slightly, only once. It is a binding signature.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const ArchDemon = createEnemy({
    id: 'enemy-arch-demon',
    portraitAsset: 'arch-demon',
    name: 'Arch-Demon',
    stanceHint: 'Appetite promoted past restraint — the violence is administrative.',
    description: 'An appetite promoted past all restraint. Somewhere far below, lesser devils file its paperwork and do not ask questions.',
    level: 48,
    baseStats: enemyStatBudget(48, { heart: 1, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    vitae: 860,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'brutal' },
        { kind: 'ravenous' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE PAPERWORK IS APPROVED',
            text: 'Far below, a lesser devil stamps something. Up here the appetite stops being polite.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.4,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'IT EATS THE CLAUSES',
            text: 'It stops administering the hunger and goes back to simply being it.',
            gain: [{ kind: 'wounding', n: 80 }],
            heal: { pct: 0.15 },
            threatBonus: 0.55,
            curseCardId: 'gnaw-marks',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
    },
    loot: [
        drop('void-essence', 35),
        drop('supreme-healing-potion', 25),
        drop('phoenix-tear', 20),
        drop('revive-crystal', 20),
    ],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    cards: [card('unction-of-boils'), card('knucklebone-recant'), card('ossuary-drawer')],
    finalBlowLines: {
        brutal: 'The promotion is rescinded from above, violently, with prejudice.',
        quiet:  'The appetite completes. There was, in the end, exactly one thing it had not eaten.',
        ironic: 'Somewhere below, a lesser devil quietly re-files the org chart.',
    },
    causeLines: {
        brutal: 'The appetite reaches you. The paperwork was already approved.',
        broken: 'You contest the hunger clause by clause. It eats the clauses.',
        quiet:  'You are processed. The stamp is warm. Nothing else about it is.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const Beelzebub = createEnemy({
    id: 'enemy-beelzebub',
    portraitAsset: 'beelzebub',
    name: 'Beelzebub',
    stanceHint: 'Each fly is a small opinion. Together they are policy.',
    description: 'The lord of everything that swarms. Each fly is a small opinion. Together, they are policy.',
    level: 50,
    baseStats: enemyStatBudget(50, { heart: 2, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    // A swarm has no armour worth the name; it has replacements. Low HIDE, the
    // roster's heaviest REGROW — kill it faster than it recruits.
    vitae: 880,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'venom', n: 18 },
        { kind: 'regrow', n: 13 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'QUORUM',
            text: 'Enough of it has died to make the rest a majority. The majority votes.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'POLICY',
            text: 'The swarm stops arguing and becomes one opinion with a mouth.',
            gain: [{ kind: 'brutal' }],
            cleanse: true,
            threatBonus: 0.55,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [
        drop('void-essence', 40),
        drop('revive-crystal', 25),
        drop('phoenix-tear', 20),
        drop('greater-resonance-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    cards: [card('unction-of-boils'), card('shallow-grave'), card('ossuary-drawer')],
    finalBlowLines: {
        brutal: 'The swarm loses quorum. Policy, lacking a body, disbands.',
        quiet:  'One fly leaves, then the rest. Lordship over what swarms was always a tenancy.',
        ironic: 'The vote to retreat carried by a single opinion. It was yours.',
    },
    causeLines: {
        brutal: 'The swarm reaches consensus about you, all at once, from every direction.',
        broken: 'Opinion by opinion, the air fills. Eventually there is no minority left to breathe with.',
        quiet:  'One fly lands and is permitted. Precedent, in that court, is everything.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const Death = createEnemy({
    id: 'enemy-death',
    portraitAsset: 'death',
    name: 'Death',
    stanceHint: 'It is not cruel. It is punctual, and it has already read your schedule.',
    description: 'It is not cruel. It is punctual, and you are, by its ledger, running late.',
    level: 49,
    baseStats: enemyStatBudget(49, { heart: 3, body: 2, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
    // Just under the L49 unique curve, and HIDE below the band: Death is not
    // armoured. It is punctual, and it does not flinch, ever.
    vitae: 1010,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'unshaken' },
        { kind: 'wounding', n: 70 },
    ],
    stages: [
        {
            at: { vitaePct: 0.7 },
            name: 'THE LEDGER OPENS',
            text: 'It finds your line without looking. Part of the entry is already dry.',
            gain: [{ kind: 'venom', n: 20 }],
            threatBonus: 0.25,
        },
        {
            at: { vitaePct: 0.4 },
            name: 'YOU ARE RUNNING LATE',
            text: 'It stops being punctual and starts being early, which it has never been for anyone.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.45,
        },
        {
            at: { vitaePct: 0.15 },
            name: 'THE APPOINTMENT IS KEPT',
            text: 'It closes the book on its own finger and comes to collect the way it does for the difficult ones.',
            gain: [{ kind: 'brutal' }],
            cleanse: true,
            threatBonus: 0.6,
            curseCardId: 'arrears',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [
        drop('void-essence', 45),
        drop('revive-crystal', 30),
        drop('phoenix-tear', 15),
        drop('philosopher-tea', 10),
    ],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 67 },
    cards: [card('spoiled-poultice'), card('the-long-lent'), card('ossuary-drawer')],
    finalBlowLines: {
        brutal: 'The appointment is cancelled with force. The calendar bleeds a little.',
        quiet:  'It checks the ledger, finds an error in your favor, and withdraws without apology.',
        ironic: 'Death arrived punctually. You had rescheduled.',
    },
    causeLines: {
        brutal: 'The appointment is kept. It was always going to be kept.',
        broken: 'You argue for extensions, round after round. The ledger accrues interest.',
        quiet:  'It offers a hand, the way one does to the late. You take it, the way the late do.',
    },
    journalEntry: {
        id: 'codex-death',
        title: 'The Ledger of Appointments',
        body:
            'It keeps no scythe. The scythe is folklore\'s apology for how ordinary the ' +
            'process is. There is a ledger, and a time, and a courtesy so old it reads ' +
            'as coldness. It has never once been early. That is the whole of its mercy, ' +
            'and, it maintains, more than anyone else offers.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'unique', 'enemy'],
});

export const TheAbortive = createEnemy({
    id: 'enemy-the-abortive',
    portraitAsset: 'the-abortive',
    name: 'The Abortive',
    stanceHint: 'It feels everything it never got to be — the grief predates the griever.',
    description:
        'A god that was never allowed to begin, still waiting to be born into a world that ' +
        'moved on. Its patience predates its existence.',
    level: 50,
    baseStats: enemyStatBudget(50, { heart: 4, body: 2, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'boss',
    // Well above the curve: a strength that was never spent on living has all
    // of it left. REGROW because nothing has ever been drawn down.
    vitae: 1200,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'brutal' },
        { kind: 'regrow', n: 15 },
    ],
    stages: [
        {
            at: { vitaePct: 0.7 },
            name: 'IT TRIES TO BEGIN',
            text: 'Something that has never happened starts happening, badly, in the wrong direction.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.4 },
            name: 'THE WORLD IT WAS FOR',
            text: 'For one moment the trees are a different shape and you are a kinder person standing in them. Then it takes that back.',
            gain: [{ kind: 'venom', n: 22 }],
            cleanse: true,
            threatBonus: 0.4,
        },
        {
            at: { vitaePct: 0.15 },
            name: 'ALMOST',
            text: 'It gives up on being born and settles for being ended by someone who showed up.',
            gain: [{ kind: 'unshaken' }],
            heal: { pct: 0.15 },
            threatBonus: 0.6,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body:  { attack: 3, defend: 3 },
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [
        drop('void-essence', 50),
        drop('revive-crystal', 25),
        drop('phoenix-tear', 15),
        drop('greater-resonance-crystal', 10),
    ],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    cards: [card('ossuary-drawer'), card('spoiled-poultice'), card('shallow-grave')],
    finalBlowLines: {
        brutal: 'The unbegun ends. The two states were closer than theology admits.',
        quiet:  'It curls back into the shape of a thing about to start, and rests there.',
        ironic: 'It finally experienced a beginning: yours, of the end of it.',
    },
    causeLines: {
        brutal: 'A strength that was never spent on living spends itself on you.',
        broken: 'It has waited since before waiting existed. Your patience is an infant by comparison.',
        quiet:  'It shows you the world it was meant to begin. You grieve too long inside the showing.',
    },
    journalEntry: {
        id: 'codex-the-abortive',
        title: 'The Unbegun',
        body:
            'The old cosmologies list the gods who died. Only marginalia lists the ones ' +
            'who never got to start — displaced by rounder pantheons, filed under ' +
            'almost. It does not hate the world. It is waiting for the world to be ' +
            'finished, so that something, at last, can begin.',
    },
    addedIn: ADDED,
    tags: ['late-game', 'unique', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// THE NORTHERN CONTINENT — Phase W3 batch (2026-08-28): the continent's own
// blood. Deep-cavern vermin for the caverns pool, iron-trade muscle and city
// predators for the northern-city pool, and the Harbormaster — the city's
// authored boss. Nine enemies, each with a UNIQUE portraitAsset sourced from
// the licensed game-icons.net trove (CC BY 3.0 — see the mobile enemy
// provenance.json), a deck in `combat.enemy-decks.ts`, and aftermath prose.
// Count-pin bumps ride this same commit per THE PIPELINE LIBERATION ¶4.
// ═══════════════════════════════════════════════════════════════════════════════

/** Provenance stamp for the Phase W3 northern-continent batch. */
const W3_ADDED = '2026-08-28';

export const SeamTick = createEnemy({
    id: 'enemy-seam-tick',
    portraitAsset: 'seam-tick',
    name: 'Seam Tick',
    stanceHint: 'It wants a grip, then a vein — deny it the first and it never reaches the second.',
    description: 'A fist-sized tick that drinks iron out of blood. The delvers wear leather at the neck and count each other after every shift.',
    level: 13,
    baseStats: enemyStatBudget(13, { heart: 1, body: 3, mind: 1 }),
    mapName: 'caverns',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 20), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'It bursts like a purse. What it saved was never its own.',
        quiet:  'It lets go at last. The seam keeps the rest of its appetite.',
        ironic: 'It finally struck iron. The iron struck back.',
    },
    causeLines: {
        brutal: 'The grip finds the neck. The vein does the bookkeeping.',
        broken: 'It drinks by inches. You run out before it does.',
        quiet:  'A small weight settles at your collar. Then a smaller pulse.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const PropWight = createEnemy({
    id: 'enemy-prop-wight',
    portraitAsset: 'prop-wight',
    name: 'Prop-Wight',
    stanceHint: 'It holds the roof the way it holds a grudge. Deny it the third line, or the gallery closes.',
    description: 'It lives in the rotten props and keeps the roof up out of spite. Delvers leave it bread. It leaves the crusts in the shape of names.',
    level: 15,
    baseStats: enemyStatBudget(15, { heart: 1, body: 1, mind: 3 }),
    mapName: 'caverns',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('clarity-serum', 25), drop('focus-vial', 20)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    finalBlowLines: {
        brutal: 'The prop splits. Whatever held it together stops holding.',
        quiet:  'It sighs out of the timber. The roof, to its credit, stays.',
        ironic: 'It spent a century holding the roof up. You were the one thing it dropped.',
    },
    causeLines: {
        brutal: 'The roof was a promise it kept for everyone but you.',
        broken: 'Timber by timber, the gallery narrows to a verdict.',
        quiet:  'You hear the third knock from inside the prop. There is no fourth.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const UnpaidDelver = createEnemy({
    id: 'enemy-unpaid-delver',
    portraitAsset: 'unpaid-delver',
    name: 'The Unpaid Delver',
    stanceHint: 'He works to a wage-clock only he can hear — interrupt the shift and the pick answers.',
    description: 'He died owed a season\'s wages and did not stop cutting. The seam he works is not iron any more. He has not noticed, or does not care.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 1, body: 3, mind: 2 }),
    mapName: 'caverns',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(40), drop('whetstone-oil', 25), drop('iron-skin-draught', 20), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The pick falls mid-stroke. The shift ends the only way it could.',
        quiet:  'He sets the pick down, squares it to the wall, and stops.',
        ironic: 'You paid him the one thing the Parish never did: an ending.',
    },
    causeLines: {
        brutal: 'The pick counts you like footage. The seam takes delivery.',
        broken: 'He works you the way he works rock: patiently, and to the floor.',
        quiet:  'Somewhere a tally-board gains a stroke. It is not his.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const SumpMaren = createEnemy({
    id: 'enemy-sump-maren',
    portraitAsset: 'sump-maren',
    name: 'Sump Maren',
    stanceHint: 'She grieves at you until the water agrees — pity is the current she pulls with.',
    description: 'She waits under the sump\'s skin with her hair spread like weed. She asks the drowning to stay. They stay. The asking is the drowning.',
    level: 14,
    baseStats: enemyStatBudget(14, { heart: 3, body: 1, mind: 1 }),
    mapName: 'caverns',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('heart-draught', 30), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The water lets go of her shape. The sump forgets on the spot.',
        quiet:  'She sinks without complaint. The surface settles first.',
        ironic: 'She asked you to stay. You declined on her behalf.',
    },
    causeLines: {
        brutal: 'The water closes like a ledger. Your column was short.',
        broken: 'She grieves you down by inches, and the sump keeps every one.',
        quiet:  'Cold hands, a kind voice, and no particular hurry.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * adjust-enemies pass 1 (2026-09-05) — caverns backfill. The pool was 10 of
 * 14 (71%) direct re-treads from northern-forest, over the >70% sibling-pool
 * overlap ceiling (skill §1). These two are cavern-native, dropping the
 * overlap to 10/16 = 62.5%. KB search (kb-query) returned no on-point prior
 * art for a numeric sibling-overlap ceiling specifically; grounded instead in
 * the repo's own established precedent for this exact fix (the W3/W4
 * batches, which back-filled the caverns/northern-city/river pools the same
 * way) and Mage Knight's per-site-type monster decks (KB: `mage-knight`,
 * §6.4's own model for enemy design) — a site earns its own bestiary rather
 * than reusing a neighbour's wholesale.
 */
const CAVERNS_BACKFILL_ADDED = '2026-09-05';

export const NinthRungSpider = createEnemy({
    id: 'enemy-ninth-rung-spider',
    portraitAsset: 'ninth-rung-spider',
    name: 'The Ninth-Rung Spider',
    stanceHint: 'It counts the rungs before it counts your ribs. The ninth always gives.',
    description: 'It hangs at the ladder\'s ninth rung. It knows the sound of a reach that finds nothing. It does not chase. It waits where you have to pass.',
    level: 15,
    baseStats: enemyStatBudget(15, { heart: 1, body: 2, mind: 2 }),
    mapName: 'caverns',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('focus-vial', 25), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 33, outlook: -67, scope: -33 },
    finalBlowLines: {
        brutal: 'The ninth rung finally gives for both of you at once.',
        quiet:  'It curls off the ladder without a sound, one leg at a time.',
        ironic: 'It counted every rung but the one you skipped.',
    },
    causeLines: {
        brutal: 'You reach for the rung that was never there. It was counting on that.',
        broken: 'It bites, and lets go, and waits for the venom to do the climbing for it.',
        quiet:  'A thread gives. Then your grip does.',
    },
    addedIn: CAVERNS_BACKFILL_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const SporeWarden = createEnemy({
    id: 'enemy-spore-warden',
    portraitAsset: 'spore-warden',
    name: 'The Spore-Warden',
    stanceHint: 'It breathes a warning before it breathes worse. The cloud says stop, then says nothing at all.',
    description: 'A trunk of fused fungus, grown fat on trespassers. It has guarded this spore-bed for a century. Delvers were told once: never touch it. It is patient. Mold always is.',
    level: 17,
    baseStats: enemyStatBudget(17, { heart: 2, body: 2, mind: 1 }),
    mapName: 'caverns',
    difficulty: 'elite',
    logic: 'defensive',
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    tier1Overrides: T1_DEFAULT,
    loot: [none(40), drop('iron-skin-draught', 25), drop('clarity-serum', 20), drop('greater-healing-potion', 15)],
    philosophicalAlignment: { epistemology: -33, outlook: -33, scope: 33 },
    finalBlowLines: {
        brutal: 'It comes apart in one soft collapse, and the spore-bed goes quiet at last.',
        quiet:  'It settles into the floor it was already mostly made of.',
        ironic: 'It spent a century guarding a bed no one else ever wanted.',
    },
    causeLines: {
        brutal: 'The cloud gets into everything the leather doesn\'t cover.',
        broken: 'It does not hurry. Spores never have to.',
        quiet:  'You stop coughing before you notice you have stopped breathing.',
    },
    addedIn: CAVERNS_BACKFILL_ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const TollSergeant = createEnemy({
    id: 'enemy-toll-sergeant',
    portraitAsset: 'toll-sergeant',
    name: 'Toll-Sergeant',
    stanceHint: 'The fee comes first and the fist explains it — pay attention to the hand that is not open.',
    description: 'The gate pays him to stand in it. The toll is posted nowhere and changes by the coat you wear. Refusal is billed in bruises.',
    level: 15,
    baseStats: enemyStatBudget(15, { heart: 1, body: 3, mind: 1 }),
    mapName: 'northern-city',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('body-elixir', 25), drop('healing-potion', 25)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 },
    finalBlowLines: {
        brutal: 'The gate stands unminded. Traffic resumes at the old free price.',
        quiet:  'He sits down in his own gate at last, off duty.',
        ironic: 'He finally met a toll he could not collect.',
    },
    causeLines: {
        brutal: 'The fist explains the fee. You are billed in full.',
        broken: 'Refusal compounds. He collects the arrears by hand.',
        quiet:  'You pay at the gate the way everyone pays, eventually.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const GuildKnife = createEnemy({
    id: 'enemy-guild-knife',
    portraitAsset: 'guild-knife',
    name: 'Guild Knife',
    stanceHint: 'The contract is already signed — the knife is only the delivery, and it is punctual.',
    description: 'The ironmongers\' guild settles some disputes in court. For the rest there is a dues-paying member with clean boots and a short blade.',
    level: 17,
    baseStats: enemyStatBudget(17, { heart: 1, body: 3, mind: 2 }),
    mapName: 'northern-city',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    // Phase 90 — a short blade doesn't deliver its invoice in one stroke:
    // FLURRY 3 (clause by clause, per the cause line already on the books).
    keywords: [{ kind: 'flurry', n: 3 }],
    loot: [none(40), drop('quicksilver-vial', 25), drop('whetstone-oil', 20), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    finalBlowLines: {
        brutal: 'The contract voids in the usual way. The guild will invoice someone.',
        quiet:  'He checks his boots are still clean. They are. He is done anyway.',
        ironic: 'Somewhere a clause names his replacement. He always knew it would.',
    },
    causeLines: {
        brutal: 'Delivery is made per the agreement. You sign in the usual place.',
        broken: 'Clause by clause, the blade finds where you initialed.',
        quiet:  'Clean boots, short blade, no hard feelings on record.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

export const TheFactor = createEnemy({
    id: 'enemy-the-factor',
    portraitAsset: 'the-factor',
    name: 'The Factor',
    stanceHint: 'He buys positions, not fights — every round you spend is a debt he is already reselling.',
    description: 'He buys debts nobody expects to collect and collects them. His office is wherever you are standing when the interest comes due.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 1, body: 1, mind: 4 }),
    mapName: 'northern-city',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('philosopher-tea', 15), drop('focus-vial', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    finalBlowLines: {
        brutal: 'His book opens on the fall. Half the city breathes easier by nightfall.',
        quiet:  'He totals you, finds the column closed, and closes with it.',
        ironic: 'He held your debt to the end. It matured into this.',
    },
    causeLines: {
        brutal: 'The interest comes due all at once, in person.',
        broken: 'He resells your position twice before you notice it is gone.',
        quiet:  'A dry signature somewhere, and your account changes hands.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const WharfShrike = createEnemy({
    id: 'enemy-wharf-shrike',
    portraitAsset: 'wharf-shrike',
    name: 'Wharf Shrike',
    stanceHint: 'It strikes, hangs, and waits — the hooks are its pantry and its patience is stocked.',
    description: 'A harbor bird grown wrong on tithe-scraps. It hangs what it catches on the mooring hooks and comes back when the struggling stops.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 2, body: 3, mind: 1 }),
    mapName: 'northern-city',
    difficulty: 'normal',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('quicksilver-vial', 20), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'It comes off the sky in pieces. The hooks stand empty tonight.',
        quiet:  'It settles on its own hook, folds, and does not start again.',
        ironic: 'Its larder outlived it. The harbor calls that an estate.',
    },
    causeLines: {
        brutal: 'The strike is brief. The hook is not.',
        broken: 'It waits you out the way it waits out everything on the hooks.',
        quiet:  'Wings, then iron, then the patient part.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * The northern city's authored boss — the Harbormaster, pinned per-node in
 * `MapEvents/content.ts` at a winnable level (the fv-6/nc-25 precedent).
 * Nothing leaves the city by water unweighed. W4's river door opens past him.
 */
export const TheHarbormaster = createEnemy({
    id: 'enemy-the-harbormaster',
    portraitAsset: 'the-harbormaster',
    name: 'The Harbormaster',
    stanceHint: 'He weighs before he rules — every stance you take goes on the scale, and the scale is his.',
    description: 'He has kept the water-gate since before the guilds had names. Everything that leaves by water is weighed. Nothing he has weighed has left without paying.',
    level: 18,
    baseStats: enemyStatBudget(18, { heart: 2, body: 1, mind: 3 }),
    mapName: 'northern-city',
    difficulty: 'boss',
    logic: 'boss',
    // Above the L18 boss curve: he is the gate, and gates are the wall part of
    // a wall. UNSHAKEN because a scale does not tremble for anyone's argument.
    vitae: 350,
    keywords: [
        { kind: 'hide', n: 6 },
        { kind: 'unshaken' },
        { kind: 'wounding', n: 32 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE TIDE COMES IN',
            text: 'He stops weighing you himself and lets the water do it. The water has never once been generous.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'NOTHING LEAVES UNWEIGHED',
            text: 'He steps onto his own scale. The gate shuts on the far side of the beam and stays shut.',
            gain: [{ kind: 'brutal' }],
            heal: { pct: 0.1 },
            threatBonus: 0.55,
            curseCardId: 'mouthful-of-brine',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 40),
        drop('void-essence', 30),
        drop('revive-crystal', 20),
        drop('resonance-crystal', 10),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    finalBlowLines: {
        brutal: 'The scale tips past reading and stays there. The river runs unweighed.',
        quiet:  'He notes the final weight, initials it, and lets the office stand vacant.',
        ironic: 'He weighed everything that ever left this city. He never once weighed himself.',
    },
    causeLines: {
        brutal: 'The weighing concludes. The balance is paid out of you.',
        broken: 'Measure by measure, he finds what you are short.',
        quiet:  'The needle settles. The gate does not open for the underweight.',
    },
    addedIn: W3_ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

/**
 * adjust-enemies pass 6 (2026-09-11) — the-capital thinness/overlap fix. The
 * map shipped (Phase W5/W6, commit f56fa198) with an `EnemiesByMap` pool of
 * 6 wholesale re-treads (TollSergeant, GuildKnife, WharfShrike, TheFactor
 * from northern-city; CursedPaladin, VampireThrall from northern-forest) and
 * zero capital-native enemies — flagged as a residue row in `plan/AUDIT.md`
 * ("The Capital's enemy pool reuses existing roster entries...a legitimate
 * future `/adjust-enemies` backfill") at the time it shipped. Sharpest single
 * pairwise reading: 5 of the-capital's 6 members (all but CursedPaladin) also
 * sit in northern-city's own pool — 83.3%, over the skill §1 >70%
 * sibling-overlap ceiling. These two are capital-native, dropping that
 * reading to 5/8 = 62.5% (the same target band the caverns pass-1 backfill
 * landed at for an analogous fix). KB search (kb-query, kb_search across
 * `court|bureaucra|clerk|noble|steward|petition`) returned no on-point
 * numeric doctrine for a sibling-pool-overlap ceiling — the same miss passes
 * 1 and 2 hit on this exact signal — so the grounding is this repo's own
 * established precedent for the fix (the caverns/connecting-river/
 * town-across-river backfills) plus Mage Knight's per-site monster-deck
 * model (kb:mage-knight — a site earns its own bestiary rather than reusing
 * a neighbour's wholesale), the same citation passes 1 and 2 used for the
 * identical finding shape. Decks reuse the existing `debt-office` archetype
 * (`combat.enemy-cards.ts`) wholesale — no new cards needed, matching the
 * pass-2 precedent; the capital IS the debt-office's home city, so the
 * shared archetype is flavor-correct, not corner-cutting.
 */
const W_ADJUST_ENEMIES_P6_ADDED = '2026-09-11';

export const TheStamper = createEnemy({
    id: 'enemy-the-stamper',
    portraitAsset: 'the-stamper',
    name: 'The Stamper',
    stanceHint: 'It closes the case before you finish reading it — object to the stamp, not just the blow.',
    description: 'It has stamped more petitions shut than the capital has floors. DENIED is the only word it has ever needed to know, in every hand it has practiced.',
    level: 18,
    baseStats: enemyStatBudget(18, { heart: 1, body: 3, mind: 2 }),
    mapName: 'the-capital',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('body-elixir', 25), drop('healing-potion', 25)],
    philosophicalAlignment: { epistemology: 33, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The stamp comes down on nothing at all, and the ink dries anyway.',
        quiet:  'It sets the seal aside, unused, and does not reach for it again.',
        ironic: 'It closed every case that ever crossed its desk. Its own stays open.',
    },
    causeLines: {
        brutal: 'The stamp lands, and the matter is DENIED, in full, with feeling.',
        broken: 'Case by case, it finds a reason the appeal cannot proceed.',
        quiet:  'Ink meets paper. The seal is final. It always was.',
    },
    addedIn: W_ADJUST_ENEMIES_P6_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const TheUnderclerk = createEnemy({
    id: 'enemy-the-underclerk',
    portraitAsset: 'the-underclerk',
    name: 'The Underclerk',
    stanceHint: 'It copies your every motion into triplicate before it answers — refuse the form, not just the blow.',
    description: 'It has filed the same complaint under nine names, and none of them are yours. The capital keeps it on because it never once asks for a raise.',
    level: 19,
    baseStats: enemyStatBudget(19, { heart: 2, body: 1, mind: 3 }),
    mapName: 'the-capital',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('focus-vial', 25)],
    philosophicalAlignment: { epistemology: 67, outlook: -33, scope: -67 },
    finalBlowLines: {
        brutal: 'The ninth copy goes unfiled. Nobody upstairs will ever notice.',
        quiet:  'It sets the quill down mid-word and does not pick it back up.',
        ironic: 'It filed every grievance this city ever had. It never once filed its own.',
    },
    causeLines: {
        brutal: 'It copies the wound into triplicate before the wound has finished happening.',
        broken: 'Form by form, it finds a version of you it can process.',
        quiet:  'The quill scratches once, twice, and the file closes on its own.',
    },
    addedIn: W_ADJUST_ENEMIES_P6_ADDED,
    tags: ['mid-game', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase W4 batch (2026-08-31): the river crossing and the town beyond it.
// Seven enemies, two of them bosses, each with a UNIQUE portraitAsset sourced
// from the licensed game-icons.net trove (CC BY 3.0 — see the mobile enemy
// provenance.json), a deck in `combat.enemy-decks.ts`, and aftermath prose.
// Count-pin bumps ride this same commit per THE PIPELINE LIBERATION ¶4.
// ═══════════════════════════════════════════════════════════════════════════════

/** Provenance stamp for the Phase W4 river-crossing batch. */
const W4_ADDED = '2026-08-31';

/**
 * Provenance stamp for adjust-enemies pass 2's connecting-river / town-
 * across-river thinness fix (see the DriftAnchor / TheAdjuster doc comments).
 */
const W_ADJUST_ENEMIES_P2_ADDED = '2026-09-07';

export const ReedAmbusher = createEnemy({
    id: 'enemy-reed-ambusher',
    portraitAsset: 'reed-ambusher',
    name: 'Reed Ambusher',
    stanceHint: 'It strikes once and trusts the current to cover the second — deny the current its cover.',
    description: 'It lies flush with the reed-line until the water forgets it is there. Then it doesn\'t.',
    level: 17,
    baseStats: enemyStatBudget(17, { heart: 1, body: 3, mind: 1 }),
    mapName: 'connecting-river',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('healing-potion', 25), drop('body-elixir', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'It lets go of the reed-line and the current takes what is left.',
        quiet:  'It sinks without a ripple to mark the spot.',
        ironic: 'The water it trusted finally counted against it.',
    },
    causeLines: {
        brutal: 'The reeds don\'t move until they do, and by then it\'s too late.',
        broken: 'It strikes, submerges, resurfaces somewhere you weren\'t watching.',
        quiet:  'A cold hand at the ankle, and the bank gets further away.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const TollSkiff = createEnemy({
    id: 'enemy-toll-skiff',
    portraitAsset: 'toll-skiff',
    name: 'Toll-Skiff',
    stanceHint: 'It reads your stroke before you finish it — change the rhythm or match its price.',
    description: 'A low boat, three rowers, no flag. It doesn\'t ask for the toll. It just doesn\'t let you past until you\'ve paid it.',
    level: 18,
    baseStats: enemyStatBudget(18, { heart: 1, body: 1, mind: 3 }),
    mapName: 'connecting-river',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('quicksilver-vial', 25), drop('clarity-serum', 25)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    finalBlowLines: {
        brutal: 'The boat capsizes. The current collects the fare instead.',
        quiet:  'The rowers ship oars and let the current take the rest of the conversation.',
        ironic: 'They never once said what the toll was. Now they never will.',
    },
    causeLines: {
        brutal: 'Three oars, one rhythm, and no discount for arguing.',
        broken: 'They row you down by inches, patient as a debt.',
        quiet:  'The toll gets collected the way a river collects silt — slowly, without asking.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const WeirWidow = createEnemy({
    id: 'enemy-weir-widow',
    portraitAsset: 'weir-widow',
    name: 'Weir-Widow',
    stanceHint: 'She mourns you before you\'ve earned it — refuse the grief before it becomes a current.',
    description: 'She stands waist-deep at the weir and grieves for whoever crosses next. The grief is not for them. It never was.',
    level: 20,
    baseStats: enemyStatBudget(20, { heart: 3, body: 1, mind: 2 }),
    mapName: 'connecting-river',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(45), drop('heart-draught', 30), drop('healing-potion', 25)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The weir holds. She doesn\'t.',
        quiet:  'She stops grieving. It is the first quiet thing she has done all day.',
        ironic: 'She will grieve you properly now. It is the only honest work left to her.',
    },
    causeLines: {
        brutal: 'Her grief has a current, and the current has you.',
        broken: 'Mourned by inches, until the mourning is the only thing holding you up.',
        quiet:  'Cold water, a kind voice, and a weir that doesn\'t care which.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

/**
 * adjust-enemies pass 2 (2026-09-07) — connecting-river thinness fix. The
 * map's random-encounter pool was 4 entries total (3 non-boss + the pinned
 * boss drawing into the same pool via `EnemiesByMap`), the thinnest pool in
 * the roster by a wide margin against every sibling (8-39 elsewhere). This
 * is a river-native fourth: not another toll-taker like the Skiff or the
 * Waterreeve, but the drowned weight the current keeps for company.
 */
export const DriftAnchor = createEnemy({
    id: 'enemy-drift-anchor',
    portraitAsset: 'drift-anchor',
    name: 'The Drift-Anchor',
    stanceHint: 'It does not chase — it waits at the bottom for the current to bring you to it. Break the pull before it seats.',
    description: 'A mooring-stone gone loose from its dock, with a chain still fastened round something that used to swim. It settles wherever the current tires of carrying it, and waits there, patient as ballast.',
    level: 19,
    baseStats: enemyStatBudget(19, { heart: 1, body: 3, mind: 1 }),
    mapName: 'connecting-river',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('body-elixir', 30), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: -33, outlook: -67, scope: -33 },
    finalBlowLines: {
        brutal: 'The chain finally lets go, and so does everything on the other end of it.',
        quiet:  'It settles back onto the riverbed, one stone among the rest of them now.',
        ironic: 'It waited so long to be someone\'s ballast. You obliged it.',
    },
    causeLines: {
        brutal: 'The chain finds an ankle and the river does the rest of the arithmetic.',
        broken: 'It does not pull hard. It pulls patiently, which is worse.',
        quiet:  'Cold iron, a colder current, and a bottom that keeps what it\'s given.',
    },
    addedIn: W_ADJUST_ENEMIES_P2_ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * Connecting River's authored boss — the Waterreeve, pinned per-node in
 * `MapEvents/content.ts` at a winnable level (the ncy-25/fv-6 precedent).
 * He has kept the crossing since the last reeve stopped keeping anything.
 */
export const TheWaterreeve = createEnemy({
    id: 'enemy-the-waterreeve',
    portraitAsset: 'the-waterreeve',
    name: 'The Waterreeve',
    stanceHint: 'He reads the crossing like a ledger — every stance you take is an entry, and entries get audited.',
    description: 'He has kept the crossing since the last reeve stopped keeping anything. Every boat that passes goes in his book. Every book balances, eventually.',
    level: 22,
    baseStats: enemyStatBudget(22, { heart: 2, body: 2, mind: 3 }),
    mapName: 'connecting-river',
    difficulty: 'boss',
    logic: 'boss',
    // A man with a book, slightly under the curve. SWIFT because he has already
    // audited your guard; VENOM because that is what interest looks like.
    vitae: 350,
    keywords: [
        { kind: 'hide', n: 4 },
        { kind: 'swift' },
        { kind: 'venom', n: 8 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE ACCOUNT IS REOPENED',
            text: 'He turns back to a page you were sure had been closed, and adds to it.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE BOOK BALANCES',
            text: 'He writes what the crossing took and what the river is owed. The two figures are the same figure.',
            gain: [{ kind: 'unshaken' }],
            heal: { pct: 0.1 },
            threatBonus: 0.5,
            curseCardId: 'arrears',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 35),
        drop('void-essence', 25),
        drop('revive-crystal', 25),
        drop('resonance-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    finalBlowLines: {
        brutal: 'The ledger closes on an unfinished line. Nobody finishes it for him.',
        quiet:  'He sets the book down, open, and doesn\'t reach for it again.',
        ironic: 'He audited every crossing on this river. His own account was never his to check.',
    },
    causeLines: {
        brutal: 'The audit concludes. You are found short, in the usual currency.',
        broken: 'Line by line, he finds what the crossing is owed.',
        quiet:  'The ink dries. The account closes. The river keeps the rest.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const DowryCollector = createEnemy({
    id: 'enemy-dowry-collector',
    portraitAsset: 'dowry-collector',
    name: 'Dowry Collector',
    stanceHint: 'He prices the match before you\'ve made it — refuse the appraisal, not just the fee.',
    description: 'He totals what a marriage is worth before the marriage has agreed to happen. Villages pay him to be right about it.',
    level: 19,
    baseStats: enemyStatBudget(19, { heart: 2, body: 1, mind: 3 }),
    mapName: 'town-across-river',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('focus-vial', 25)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    finalBlowLines: {
        brutal: 'The books close on an appraisal nobody asked for.',
        quiet:  'He puts the ledger away for once, and doesn\'t reach for it again.',
        ironic: 'He priced every match in the village. His own math finally came due.',
    },
    causeLines: {
        brutal: 'He totals the difference and collects it in the usual coin.',
        broken: 'Line by line, the appraisal finds what you\'re short.',
        quiet:  'A dry figure, entered neatly, and the account is settled.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'enemy'],
});

export const TheKeptSuitor = createEnemy({
    id: 'enemy-the-kept-suitor',
    portraitAsset: 'the-kept-suitor',
    name: 'The Kept Suitor',
    stanceHint: 'He fights like a promise that\'s owed, not earned — refuse the debt, not just the blow.',
    description: 'Promised to someone who never agreed. He has been waiting so long the waiting became the whole of him.',
    level: 21,
    baseStats: enemyStatBudget(21, { heart: 3, body: 2, mind: 1 }),
    mapName: 'town-across-river',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(40), drop('heart-draught', 30), drop('whetstone-oil', 20), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    finalBlowLines: {
        brutal: 'The promise breaks. Nobody is left to keep it anyway.',
        quiet:  'He stops waiting. It is the only thing he hasn\'t already tried.',
        ironic: 'He waited his whole death for an answer. You gave him one.',
    },
    causeLines: {
        brutal: 'He collects on a promise you never made him.',
        broken: 'He wears you down the way waiting wears down a doorstep.',
        quiet:  'A patient hand, an old grievance, and no interest in explaining either.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'elite', 'enemy'],
});

/**
 * adjust-enemies pass 2 (2026-09-07) — town-across-river thinness fix. The
 * map's random-encounter pool was 3 entries total (2 non-boss + the pinned
 * boss drawing into the same pool), the second-thinnest in the roster after
 * connecting-river. A third non-boss voice: the town's paperwork made flesh,
 * distinct from the Collector's appraisal and the Suitor's grievance.
 */
export const TheAdjuster = createEnemy({
    id: 'enemy-the-adjuster',
    portraitAsset: 'the-adjuster',
    name: 'The Adjuster',
    stanceHint: 'It reads every angle of the claim before it reads you — refuse the file, not just the figure.',
    description: 'It settles claims the town would rather not itemize twice. Every wound gets a value. Every value gets a wax seal. Every seal is final. It has never once been asked to reconsider.',
    level: 20,
    baseStats: enemyStatBudget(20, { heart: 1, body: 1, mind: 3 }),
    mapName: 'town-across-river',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('quicksilver-vial', 25)],
    philosophicalAlignment: { epistemology: 67, outlook: -33, scope: -33 },
    finalBlowLines: {
        brutal: 'The claim closes itself, in the adjuster\'s own hand, on the adjuster\'s own line.',
        quiet:  'It sets the wax down unmelted and doesn\'t reach for it again.',
        ironic: 'It itemized every wound in this town but its own.',
    },
    causeLines: {
        brutal: 'It finds the figure, seals it, and files you under paid in full.',
        broken: 'Claim by claim, it prices what you can still afford to lose.',
        quiet:  'A wax seal presses down, warm and then not, and the matter is settled.',
    },
    addedIn: W_ADJUST_ENEMIES_P2_ADDED,
    tags: ['mid-game', 'enemy'],
});

/**
 * Town Across the River's authored boss — the Portreeve, pinned per-node in
 * `MapEvents/content.ts` at a winnable level. The town's chief officer,
 * self-appointed by outliving every rival claim.
 */
export const ThePortreeve = createEnemy({
    id: 'enemy-the-portreeve',
    portraitAsset: 'the-portreeve',
    name: 'The Portreeve',
    stanceHint: 'He rules before he fights — every stance you take is a motion he has already denied.',
    description: 'The town\'s chief officer, self-appointed by outliving every rival claim. Every ribbon, every ledger, every nomination crosses his desk first.',
    level: 24,
    baseStats: enemyStatBudget(24, { heart: 2, body: 3, mind: 2 }),
    mapName: 'town-across-river',
    difficulty: 'boss',
    logic: 'boss',
    // He outlived every rival claim; the durability is the character. UNSHAKEN
    // is a ruling that will not be overturned by anything you do to him.
    vitae: 490,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'unshaken' },
        { kind: 'brutal' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'THE MOTION IS DENIED',
            text: 'He rules against the way you are standing. You are still standing. The ruling is simply on record now.',
            cleanse: true,
            threatBonus: 0.35,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE GAVEL DOES NOT COME BACK UP',
            text: 'He stops presiding over the fine and starts collecting it himself.',
            gain: [{ kind: 'swift' }],
            heal: { pct: 0.08 },
            threatBonus: 0.55,
            curseCardId: 'arrears',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 2, defend: 2 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [
        drop('quicksilver-vial', 30),
        drop('void-essence', 30),
        drop('revive-crystal', 25),
        drop('resonance-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    finalBlowLines: {
        brutal: 'The gavel falls and stays fallen. Nobody in the room moves to pick it up.',
        quiet:  'He sets the gavel down, unstruck, and lets the town rule itself for once.',
        ironic: 'He ruled on every dispute this town ever had. This one, he lost.',
    },
    causeLines: {
        brutal: 'The ruling is final, and the fine is paid in full, immediately.',
        broken: 'Motion by motion, he finds where your case falls apart.',
        quiet:  'A gavel taps once. The room, and you, go quiet with it.',
    },
    addedIn: W4_ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// THE APORIA — labyrinth continent (W-01), act bosses (L8 / L12 / L16)
// ═══════════════════════════════════════════════════════════════════════════════

/** Provenance stamp for the W-01 labyrinth-boss batch (not the art roster). */
const APORIA_ADDED = '2026-07-07';

/**
 * Act I boss — The Colonnade. Control / stance-denial kit: roots, staggers
 * and silences so the status line is the way through, per doctrine. Level 8
 * pins the act band (see `labyrinth.pools.ts` BOSS_LEVEL).
 */
export const TheDoorwarden = createEnemy({
    id: 'enemy-the-doorwarden',
    portraitAsset: 'the-doorwarden',
    name: 'The Doorwarden',
    stanceHint: 'He answers every motion with a jamb — where you would step, a threshold has already been installed.',
    description:
        'A hinge-priest of jointed bronze, kneeling in a chapel whose walls are doors. ' +
        'Every door that ever shut is remembered in him, and he holds them all shut at once. ' +
        'He does not hate you. He simply does not recognize your right of way.',
    level: 8,
    baseStats: enemyStatBudget(8, { heart: 1, body: 3, mind: 2 }),
    mapName: 'aporia-colonnade',
    difficulty: 'boss',
    logic: 'boss',
    // Act I's lesson is HIDE, so it is printed hard for the level: jointed
    // bronze, and every hit you land is a knock he does not answer.
    vitae: 220,
    keywords: [
        { kind: 'hide', n: 6 },
        { kind: 'unshaken' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'EVERY DOOR HE REMEMBERS',
            text: 'He shuts one more. You did not know it was open until you heard it.',
            gain: [{ kind: 'brutal' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'WHAT SHUTS, STAYS SHUT',
            text: 'He kneels lower. Bronze finds the seam of the room and the room stops having a far side.',
            gain: [{ kind: 'swift' }],
            heal: { pct: 0.15 },
            threatBonus: 0.5,
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 2, defend: 2 },
    },
    loot: [
        drop('healing-potion', 40),
        drop('iron-skin-draught', 25),
        drop('clarity-serum', 20),
        drop('resonance-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    cards: [card('scolds-bridle'), card('petty-indictment'), card('knucklebone-recant')],
    finalBlowLines: {
        brutal: 'The hinge-priest comes apart at every joint at once. Ten thousand doors, unheld, swing open somewhere.',
        quiet:  'He folds shut along his own seams, the way a door closes on an empty room, and stays closed.',
        ironic: 'He remembered every door that ever shut. He had no doctrine for one that simply walked through him.',
    },
    causeLines: {
        brutal: 'The threshold arrives at you, all bronze and precedent, and closes.',
        broken: 'Room by room he narrows the argument until the only door left open is the one behind you.',
        quiet:  'You pause to knock. In his chapel, knocking is consent to the terms of the house.',
    },
    journalEntry: {
        id: 'codex-the-doorwarden',
        title: 'The Hinge-Priest',
        body:
            'The house needed something to believe in its doors, so it built a believer. ' +
            'He was assembled from the hinges of every argument that ever closed — each ' +
            'joint a refusal, oiled and kept. His liturgy is short: what shuts, stays ' +
            'shut. He kneels because a kneeling thing is a door at rest, and he has ' +
            'been at rest, facing the entrance, for a very long time.',
    },
    addedIn: APORIA_ADDED,
    tags: ['mid-game', 'boss', 'enemy', 'labyrinth'],
});

/**
 * Act II boss — The Archive. DoT / misfile kit: bleed and burn stacked deep,
 * so erosion is the efficient line, per doctrine. Level 12 pins the act band.
 */
export const TheIndex = createEnemy({
    id: 'enemy-the-index',
    portraitAsset: 'the-index',
    name: 'The Index',
    stanceHint: 'It files before it strikes — by the time the blow lands, your counter is already catalogued under errata.',
    description:
        'A librarian-golem made of misfiled truths, card drawers for ribs, a spine of ' +
        'retired catalogues. Everything it ever shelved wrongly is still in there, ' +
        'filed under you now. It bleeds ink, and so, presently, will you.',
    level: 12,
    baseStats: enemyStatBudget(12, { heart: 1, body: 2, mind: 4 }),
    mapName: 'aporia-archive',
    difficulty: 'boss',
    logic: 'boss',
    // Under the curve — it is drawers and paper. It bleeds ink (VENOM) and it
    // files you (WOUNDING), which is the act's whole joke.
    vitae: 220,
    keywords: [
        { kind: 'hide', n: 4 },
        { kind: 'venom', n: 7 },
        { kind: 'wounding', n: 22 },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'SEE ALSO',
            text: 'It cross-references you against something that should never have been given a call number.',
            gain: [{ kind: 'swift' }],
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE DRAWERS OPEN IN ORDER',
            text: 'A through the end of knowing. Everything it ever shelved wrongly comes out at once, filed under you.',
            gain: [{ kind: 'brutal' }],
            cleanse: true,
            threatBonus: 0.55,
            curseCardId: 'overheard-name',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        body: { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 35),
        drop('clarity-serum', 25),
        drop('focus-vial', 25),
        drop('revive-crystal', 15),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('the-long-lent'), card('shallow-grave'), card('scolds-bridle')],
    finalBlowLines: {
        brutal: 'The drawers burst in order, A through the end of knowing. The misfiled truths get one moment of daylight each.',
        quiet:  'It shelves itself, finally, in the one place it never checked: under its own name.',
        ironic: 'It catalogued every way you could lose. The winning move was, of course, misfiled.',
    },
    causeLines: {
        brutal: 'A drawer opens at your name. The paper cuts are individually filed, and there are so very many files.',
        broken: 'Errata accumulate faster than you can issue corrections. Eventually you are all margin.',
        quiet:  'You stop to read one card too long. The Archive quietly assigns you a call number.',
    },
    journalEntry: {
        id: 'codex-the-index',
        title: 'The Misfiled',
        body:
            'The Archive keeps everything, which is not the same as keeping it well. ' +
            'Every truth shelved under the wrong heading had to go somewhere, and the ' +
            'somewhere accreted: ribs of card drawers, a heart of cross-references that ' +
            'resolve to nothing. It does not guard the collection. It IS the errata, ' +
            'walking, and it wants the record to show that none of this was its filing.',
    },
    addedIn: APORIA_ADDED,
    tags: ['mid-game', 'boss', 'enemy', 'labyrinth'],
});

/**
 * Act III finale boss — The Proof. The labyrinth's narrator made manifest
 * (C-01). Befriendable: the mercy fork at the Foundation is a named beat in
 * W-01, so the pact path carries the reward. Level 16 pins the act band.
 */
export const TheSophist = createEnemy({
    id: 'enemy-the-sophist',
    portraitAsset: 'the-sophist',
    name: 'The Sophist',
    stanceHint: 'He argues in your grammar — every stance you take, he has already taken it better, and returned it used.',
    description:
        'The labyrinth\'s narrator, stepped down from the margin at last. He fights ' +
        'with borrowed premises — yours, mostly, held at a more flattering angle — ' +
        'and he has been rehearsing this conversation for centuries. The house ' +
        'requires its paperwork. He is the paperwork.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 2, body: 1, mind: 4 }),
    mapName: 'aporia-proof',
    difficulty: 'boss',
    logic: 'boss',
    // Well under the curve: he is not a wall, he is an angle. SWIFT because he
    // is holding your own guard at a more flattering slant, ELUSIVE because he
    // is never standing where the argument is until you stagger him into it.
    vitae: 270,
    keywords: [
        { kind: 'hide', n: 5 },
        { kind: 'swift' },
        { kind: 'elusive' },
    ],
    stages: [
        {
            at: { vitaePct: 0.6 },
            name: 'HE BORROWS YOUR ARGUMENT',
            text: 'He takes the argument out of your mouth, holds it at a kinder angle, and hands it back heavier.',
            gain: [{ kind: 'brutal' }],
            cleanse: true,
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'THE FOURTH LEDGER',
            text: 'He signs a whole name for the first time in centuries. The room stops being a room and becomes a claim about one.',
            gain: [{ kind: 'wounding', n: 35 }],
            heal: { pct: 0.1 },
            threatBonus: 0.55,
            curseCardId: 'overheard-name',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind:  { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
        body:  { attack: 2, defend: 2 },
    },
    loot: [
        drop('philosopher-tea', 35),
        drop('clarity-serum', 25),
        drop('greater-healing-potion', 20),
        drop('revive-crystal', 20),
    ],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    cards: [card('ossuary-drawer'), card('shallow-grave'), card('scolds-bridle')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        roundsThreshold: 6,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 120,
        alignmentDelta: { outlook: +2, scope: +1 },
        narrative:
            'He sets down the argument mid-clause. It was yours anyway.\n\n' +
            '"You noticed," he says. "That I borrow. Everyone notices late or never. ' +
            'The ones who notice late I bury in their own premises. You I cannot, ' +
            'because you kept revising yours while I held them."\n\n' +
            'He signs the air the way he signs the ledgers: a third of a name.\n\n' +
            '"The house wanted a witness. I wanted a better one than me. ' +
            'Go down. Finish the sentence I could not start. I will keep the record."',
        flagSet: 'befriended-the-sophist',
        factionDeltas: {
            'forest-wardens': +8,
        },
    },
    pactLines: {
        quiet:   'The narration stops. For the first time in centuries, the house has no one to explain it.',
        setDown: 'He closes the third ledger and lays the pen across it, nib toward you. The fourth ledger stays blank. That is the concession.',
        heavy:   '"I sold certainty at the door because I could not afford it myself. You walked in without buying. Note it in the record: one walked in without buying."',
    },
    finalBlowLines: {
        brutal: 'The borrowed argument runs out of premises to stand on, and so does he.',
        quiet:  'He sets the ledger down mid-signature, the third of a name left permanently unfinished.',
        ironic: 'He held every argument at a more flattering angle than the one who made it. This one, held straight, was the one he could not survive.',
    },
    causeLines: {
        brutal: 'He hands your own argument back heavier than you gave it, and heavier is the whole of the blow.',
        broken: 'He borrows a little more of your certainty with each exchange, until the case you came in with is entirely his.',
        quiet:  'You concede one small point to move the conversation along. He was already building on it.',
    },
    journalEntry: {
        id: 'codex-the-sophist',
        title: 'The Ledger Signed in Thirds',
        body:
            'He was the first to walk down, and the first the house kept. He carried ' +
            'his premises like furniture and would not set one down, so the maze made ' +
            'him its clerk: warden, footnote, oldest pupil, only failure. He signs the ' +
            'act ledgers in thirds because a whole name would admit a whole man. He is ' +
            'not guarding the center. He is standing where he cannot see it.',
    },
    addedIn: APORIA_ADDED,
    tags: ['mid-game', 'boss', 'enemy', 'labyrinth'],
});

// ─── Test fixture (legacy, NOT part of the art roster) ────────────────────────

/**
 * Punching-bag enemy used by Spec 04b's e2e suite and hermetic tests that
 * need a long-lived combat encounter. It keeps body at 1 so old body-defense
 * damage assertions remain stable, while heart/mind carry the extra HP budget.
 * Kept separate from the roster so the encounter generator never selects it.
 */
export const Sandbag_01 = createEnemy({
    id: 'sandbag-01',
    name: 'Sandbag',
    description:
        'A practice dummy of stitched arguments, hung from a rope. It mumbles, ' +
        'rarely strikes back, and refuses to die quickly.',
    level: 10,
    baseStats: { body: 1, mind: 30, heart: 29 },
    mapName: 'northern-forest',
    difficulty: 'simple',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 0 },
});

// ─── THE UNFINISHED — the impossible playtest ceiling ─────────────────────────

/**
 * The Unfinished — level 110 unique, the deliberately UNWINNABLE ceiling the
 * playtest matrix measures the top of the curve against.
 *
 * DESIGN REQUIREMENT: this enemy must NEVER enter `EnemiesByMap` (the random
 * map-encounter pools). It is reachable only through authored playtest stage
 * profiles (`impossible`), never through wandering. Do not "fix" its absence
 * from the pools below.
 *
 * No befriendabilityConfig: mercy is not an out. Loot is a single no-drop
 * bucket: it drops nothing; the fight is the lesson.
 */
export const TheIncompleteness = createEnemy({
    id: 'enemy-the-incompleteness',
    name: 'The Unfinished',
    stanceHint: 'It cannot be read from inside any system you carry. Every tell is consistent. None is complete.',
    description: 'A proof that cannot be finished, walking. It is true. It cannot be shown. Every axiom sent to contain it becomes the next sentence it is true about.',
    // PLAYTEST-CALIBRATION (P0-truth pass, 2026-07-05): the read rule now lands
    // real +1-intensity statuses and the formerly-inert payload channels bite, so
    // the omniscient greedy witness finished the old L55/1375-HP block 200/200
    // (already power-crept to 0.94 by the 2026-07-03 legacy-card pass). The
    // ceiling is restored the way its theme demands — it cannot be finished.
    level: 110,
    baseStats: { heart: 184, body: 183, mind: 183 }, // 550 = 5 × 110 (stat law)
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'boss',
    // THE BIG NUMBERS REWRITE — the ceiling, on the L110 unique curve to the
    // digit. UNSHAKEN because it was never going to flinch; REGROW because it
    // cannot be finished; four stages because it gets a new premise every time
    // you land a true thing on it. There is no mercy out and there never was.
    vitae: 2210,
    keywords: [
        { kind: 'hide', n: 8 },
        { kind: 'unshaken' },
        { kind: 'regrow', n: 18 },
    ],
    stages: [
        {
            at: { vitaePct: 0.8 },
            name: 'IT ADMITS THE AXIOM',
            text: 'You land something true. It writes the true thing into itself and stands up larger.',
            gain: [{ kind: 'brutal' }],
            heal: { pct: 0.05 },
            threatBonus: 0.3,
        },
        {
            at: { vitaePct: 0.55 },
            name: 'THE PROOF GROWS A NEW LINE',
            text: 'Every argument you have made is now a premise it holds. It thanks you in a grammar you cannot read.',
            gain: [{ kind: 'swift' }],
            cleanse: true,
            threatBonus: 0.4,
        },
        {
            at: { vitaePct: 0.3 },
            name: 'YOU ARE ONE OF ITS EXAMPLES',
            text: 'It stops being about itself. It has been about you for some time. You are the part it uses to show the thing it cannot say.',
            gain: [{ kind: 'venom', n: 60 }, { kind: 'ravenous' }],
            threatBonus: 0.5,
        },
        {
            at: { vitaePct: 0.1 },
            name: 'IT CANNOT BE FINISHED',
            text: 'The wound you opened closes into a sentence. The sentence is true. You cannot show that it is. It gets up.',
            gain: [{ kind: 'wounding', n: 120 }],
            heal: { pct: 0.3 },
            cleanse: true,
            threatBonus: 0.6,
            curseCardId: 'overheard-name',
        },
    ],
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    // It drops nothing; the fight is the lesson.
    loot: [none(100)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    cards: [card('ossuary-drawer'), card('spoiled-poultice'), card('shallow-grave')],
    finalBlowLines: {
        brutal: 'You do not finish the proof. You break the page it was written on, and the page stops holding sentences.',
        quiet: 'It remains true. It simply stops insisting, and the wood is quiet where the argument stood.',
        ironic: 'The unfinishable proof ends on the one thing it could not contain: you, still standing outside it.',
    },
    causeLines: {
        brutal: 'It opens you along the seam every system shares — the place where the proof runs out.',
        broken: 'You understand, at the last, that you were one of its examples all along.',
        quiet: 'You are neither proved nor refuted. You are set outside the argument, and the margin closes over you.',
    },
    journalEntry: {
        id: 'codex-the-incompleteness',
        title: 'The Sentence That Outlived Its System',
        body: 'Marginalia in an unsigned hand: "Every sound house of axioms holds a true thing it cannot prove. We built the house anyway. Something walks the halls now, and it is not wrong." — final page of the Consistency Ledgers, unfinished',
    },
    addedIn: '2026-07-02',
    tags: ['impossible', 'playtest-ceiling', 'late-game'],
});

// ─── Library indices ──────────────────────────────────────────────────────────

/** The 2026-07-06 art-driven roster — all 52 production enemies, band order. */
export const EnemyLibrary = [
    // Fishing village — early (L1-8)
    GraveLarva, FloatEye, ChatteringSkull, LittleBelle, FootStealer, WaterHolger,
    CursedHead, Ghast, DoomEgg, TheButcher, BrineHag, TheFerryman, KingOfRevenge,
    // Northern forest — early-mid (L9-18)
    Wichtlein, Kudan, BullBegger, WeepingHead, GoblinShaman, Sugata, PaleBrood,
    TriEyes, Mabadi, FrayedOne, BoneTotem, BoneWizard, Mirac,
    // Northern forest — mid (L19-31)
    CursedPaladin, VampireThrall, HasshakuSama, JeweledTree, OgreNaga, Sidelle,
    RawheadRex, FateSpinner, AshenBoneDrake, RaAminKa, LadyGabriella, Zoma,
    MabadiUndrowned,
    // Northern forest — late (L34-50)
    TriEyesHollowed, BlackDeath, TheUnnameable, FireGiant, GreaterDevil, Rangda,
    ZomaAscendant, ElderFireGiant, Tezcatlipoca, ArchDemon, Beelzebub, Death,
    TheAbortive,
    // Northern continent — Phase W3 batch (2026-08-28): caverns vermin +
    // northern-city predators + the Harbormaster boss.
    SeamTick, PropWight, UnpaidDelver, SumpMaren,
    NinthRungSpider, SporeWarden,
    TollSergeant, GuildKnife, TheFactor, WharfShrike, TheHarbormaster,
    // Northern continent — Phase W4 batch (2026-08-31): the river crossing
    // and the town beyond it.
    ReedAmbusher, TollSkiff, WeirWidow, TheWaterreeve,
    DowryCollector, TheKeptSuitor, ThePortreeve,
    // adjust-enemies pass 2 (2026-09-07) — connecting-river / town-across-
    // river thinness backfill.
    DriftAnchor, TheAdjuster,
    // adjust-enemies pass 6 (2026-09-11) — the-capital thinness/overlap backfill.
    TheStamper, TheUnderclerk,
    // The Aporia — labyrinth act bosses (W-01; not part of the 52-painting roster).
    TheDoorwarden, TheIndex, TheSophist,
    // Impossible playtest ceiling — deliberately absent from EnemiesByMap.
    TheIncompleteness,
] as const;

/**
 * Per-map enemy pools used by the encounter generator.
 *
 * NOTE: `TheIncompleteness` is intentionally absent from every pool — it must
 * never appear in random map encounters (design requirement; it is reached
 * only through the authored `impossible` playtest stage). `Sandbag_01` is a
 * test fixture and is likewise excluded.
 */
export const EnemiesByMap = {
    'fishing-village': [
        GraveLarva, FloatEye, ChatteringSkull, LittleBelle, FootStealer, WaterHolger,
        CursedHead, Ghast, DoomEgg, TheButcher, BrineHag, TheFerryman, KingOfRevenge,
    ],
    'northern-forest': [
        Wichtlein, Kudan, BullBegger, WeepingHead, GoblinShaman, Sugata, PaleBrood,
        TriEyes, Mabadi, FrayedOne, BoneTotem, BoneWizard, Mirac,
        CursedPaladin, VampireThrall, HasshakuSama, JeweledTree, OgreNaga, Sidelle,
        RawheadRex, FateSpinner, AshenBoneDrake, RaAminKa, LadyGabriella, Zoma,
        MabadiUndrowned,
        TriEyesHollowed, BlackDeath, TheUnnameable, FireGiant, GreaterDevil, Rangda,
        ZomaAscendant, ElderFireGiant, Tezcatlipoca, ArchDemon, Beelzebub, Death,
        TheAbortive,
    ],
    // The caverns (northern continent, 2026-08-28 inter-map travel) — the
    // map after northern-forest. The pool mixes the forest's harder mid
    // tier (wandering foes scale to the player via the adaptive level
    // bands) with the continent's own blood (Phase W3: the four cavern
    // natives). Rawhead Rex — the cellar-thing, up from under the stairs —
    // is the authored Under-Gate boss, pinned per-node in
    // `MapEvents/content.ts`.
    'caverns': [
        Wichtlein, PaleBrood, TriEyes, VampireThrall, Mabadi, FrayedOne,
        BoneTotem, BoneWizard, CursedPaladin, RawheadRex,
        SeamTick, PropWight, UnpaidDelver, SumpMaren,
        // adjust-enemies pass 1 (2026-09-05): two cavern-native additions —
        // the pool was 10/14 (71%) forest re-treads, over the >70% sibling
        // overlap ceiling. Now 10/16 = 62.5%.
        NinthRungSpider, SporeWarden,
    ],
    // The northern city (Phase W3) — mostly the continent's own: the four
    // city predators plus the Harbormaster, with three forest re-treads
    // that read as city creatures (a duelist, an unraveling figure, a
    // servant on an errand). Overlap with any sibling pool stays under the
    // W5 70% ceiling. The Harbormaster is the authored boss, pinned
    // per-node in `MapEvents/content.ts`.
    'northern-city': [
        TollSergeant, GuildKnife, TheFactor, WharfShrike,
        Mabadi, FrayedOne, VampireThrall, TheHarbormaster,
    ],
    // Connecting River (Phase W4) — river vermin plus its own toll-keeper
    // boss. The Waterreeve is the authored boss, pinned per-node in
    // `MapEvents/content.ts`.
    'connecting-river': [
        ReedAmbusher, TollSkiff, WeirWidow, TheWaterreeve,
        // adjust-enemies pass 2 (2026-09-07): the pool was 4 total (3 non-
        // boss), the thinnest in the roster. One river-native addition.
        DriftAnchor,
    ],
    // Town Across the River (Phase W4) — the coda map. The Portreeve is the
    // authored boss, pinned per-node in `MapEvents/content.ts`.
    'town-across-river': [
        DowryCollector, TheKeptSuitor, ThePortreeve,
        // adjust-enemies pass 2 (2026-09-07): the pool was 3 total (2 non-
        // boss), the roster's second-thinnest. One town-native addition.
        TheAdjuster,
    ],
    // The Capital (Phase W5, 2026-09-10) — map 5 of the northern continent,
    // where every ribbon-road ends. Shipped reusing northern-city's own
    // roster (a grander sibling city, same class of enforcer) plus two
    // forest re-treads for variety, the northern-city precedent — but that
    // left the pool at 5/6 (83.3%) overlap with northern-city alone, over
    // the skill §1 sibling-overlap ceiling, per the `plan/AUDIT.md` residue
    // row filed at launch. adjust-enemies pass 6 (2026-09-11) backfilled two
    // capital-native enemies (The Stamper, The Underclerk — both debt-office
    // archetype, the capital being that archetype's own home city), dropping
    // the reading to 5/8 = 62.5%. The Factor is the authored boss (already
    // defined above), pinned per-node in `MapEvents/content.ts`.
    'the-capital': [
        TollSergeant, GuildKnife, WharfShrike, TheFactor,
        CursedPaladin, VampireThrall,
        TheStamper, TheUnderclerk,
    ],
    // The Aporia (W-01) — three acts of rising difficulty. Pools reuse the
    // shared roster (wandering foes scale to the player via the adaptive
    // level bands); each act adds its authored boss.
    'aporia-colonnade': [
        Wichtlein, BullBegger, WeepingHead, GoblinShaman, Sugata, PaleBrood,
        TriEyes, TheDoorwarden,
    ],
    'aporia-archive': [
        Mabadi, FrayedOne, BoneTotem, BoneWizard, CursedPaladin, VampireThrall,
        HasshakuSama, TheIndex,
    ],
    'aporia-proof': [
        TriEyesHollowed, BlackDeath, TheUnnameable, FireGiant, GreaterDevil,
        ZomaAscendant, ElderFireGiant, Tezcatlipoca, ArchDemon, Beelzebub,
        TheSophist,
    ],
} as const;

/**
 * Slug-keyed registry of enemy fixtures. Useful for hermetic tests, map-event
 * payloads and debug entry points that look an enemy up by short name. The
 * `sandbag` alias stays stable for back-compat with Spec 04b-era tests.
 */
export const ENEMY_REGISTRY = {
    // Test fixtures.
    sandbag: Sandbag_01,
    // Fishing village — early.
    'grave-larva':       GraveLarva,
    'float-eye':         FloatEye,
    'chattering-skull':  ChatteringSkull,
    'little-belle':      LittleBelle,
    'foot-stealer':      FootStealer,
    'water-holger':      WaterHolger,
    'cursed-head':       CursedHead,
    'ghast':             Ghast,
    'doom-egg':          DoomEgg,
    'the-butcher':       TheButcher,
    'brine-hag':         BrineHag,
    'the-ferryman':      TheFerryman,
    'king-of-revenge':   KingOfRevenge,
    // Northern forest — early-mid.
    'wichtlein':         Wichtlein,
    'kudan':             Kudan,
    'bull-begger':       BullBegger,
    'weeping-head':      WeepingHead,
    'goblin-shaman':     GoblinShaman,
    'sugata':            Sugata,
    'pale-brood':        PaleBrood,
    'tri-eyes':          TriEyes,
    'mabadi':            Mabadi,
    'frayed-one':        FrayedOne,
    'bone-totem':        BoneTotem,
    'bone-wizard':       BoneWizard,
    'mirac':             Mirac,
    // Northern forest — mid.
    'cursed-paladin':    CursedPaladin,
    'vampire-thrall':    VampireThrall,
    'hasshaku-sama':     HasshakuSama,
    'jeweled-tree':      JeweledTree,
    'ogre-naga':         OgreNaga,
    'sidelle':           Sidelle,
    'rawhead-rex':       RawheadRex,
    'fate-spinner':      FateSpinner,
    'ashen-bone-drake':  AshenBoneDrake,
    'ra-amin-ka':        RaAminKa,
    'lady-gabriella':    LadyGabriella,
    'zoma':              Zoma,
    'mabadi-undrowned':  MabadiUndrowned,
    // Northern forest — late.
    'tri-eyes-hollowed': TriEyesHollowed,
    'black-death':       BlackDeath,
    'the-unnameable':    TheUnnameable,
    'fire-giant':        FireGiant,
    'greater-devil':     GreaterDevil,
    'rangda':            Rangda,
    'zoma-ascendant':    ZomaAscendant,
    'elder-fire-giant':  ElderFireGiant,
    'tezcatlipoca':      Tezcatlipoca,
    'arch-demon':        ArchDemon,
    'beelzebub':         Beelzebub,
    'death':             Death,
    'the-abortive':      TheAbortive,
    // Northern continent — Phase W3 batch (2026-08-28).
    'seam-tick':         SeamTick,
    'prop-wight':        PropWight,
    'unpaid-delver':     UnpaidDelver,
    'sump-maren':        SumpMaren,
    // adjust-enemies pass 1 (2026-09-05) — caverns backfill.
    'ninth-rung-spider': NinthRungSpider,
    'spore-warden':      SporeWarden,
    'toll-sergeant':     TollSergeant,
    'guild-knife':       GuildKnife,
    'the-factor':        TheFactor,
    'wharf-shrike':      WharfShrike,
    'the-harbormaster':  TheHarbormaster,
    // Northern continent — Phase W4 batch (2026-08-31).
    'reed-ambusher':     ReedAmbusher,
    'toll-skiff':        TollSkiff,
    'weir-widow':        WeirWidow,
    'the-waterreeve':    TheWaterreeve,
    'dowry-collector':   DowryCollector,
    'the-kept-suitor':   TheKeptSuitor,
    'the-portreeve':     ThePortreeve,
    // adjust-enemies pass 2 (2026-09-07) — connecting-river / town-across-
    // river thinness backfill.
    'drift-anchor':      DriftAnchor,
    'the-adjuster':      TheAdjuster,
    // adjust-enemies pass 6 (2026-09-11) — the-capital thinness/overlap backfill.
    'the-stamper':       TheStamper,
    'the-underclerk':    TheUnderclerk,
    // The Aporia — labyrinth act bosses (W-01).
    'the-doorwarden':    TheDoorwarden,
    'the-index':         TheIndex,
    'the-sophist':       TheSophist,
    // Impossible playtest ceiling (never in EnemiesByMap pools).
    'the-incompleteness': TheIncompleteness,
} as const;

export type EnemySlug = keyof typeof ENEMY_REGISTRY;

// Re-export the consumable library so test runners that import this file
// don't accidentally tree-shake the dependency.
void consumableLibrary;
