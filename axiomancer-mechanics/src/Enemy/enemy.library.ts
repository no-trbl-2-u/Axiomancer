/**
 * Enemy library — Spec 07 content drop.
 *
 * Per the Spec 07 Q8 split: 3 simple, 6 normal, 3 elite, 2 boss, 1 unique =
 * 15 enemies total. Stat affinities (heart / body / mind) are distributed
 * across each difficulty tier so the encounter generator can offer variety
 * regardless of which stance the player favours.
 *
 * Authoring notes:
 *   - `tier1Overrides` mirrors the canonical Spec 03 Tier 1 buffs / debuffs
 *     so every enemy participates in the stance-effect economy. Variant
 *     procOverrides on elites / bosses give them flavour without rewriting
 *     the global proc table.
 *   - `procUnlocks` bumps the tier cap for elite (T2) and boss (T3) enemies
 *     so their proc rolls reach higher-tier candidates per Spec 03.
 *   - Loot tables follow Spec 07 Q7B — weighted entries with explicit `null`
 *     buckets for "nothing drops".
 *   - `xpReward` is left implicit on most enemies: `createEnemy` falls back
 *     to `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]`. Authors override
 *     only when an enemy should grant unusual XP for narrative reasons.
 */

import { createEnemy, enemyStatBudget } from './index';
import { LootTableEntry } from './types';
import { consumableLibrary, getConsumableById } from '../Items/consumable.library';
import { dropItem } from '../Items/item.factory';
import { Consumable } from '../Items/types';
import { getCardById } from '../Cards/cards.library';
import type { Card } from '../Cards/types';

// ─── Card rotation helpers (Phase 49) ────────────────────────────────────────

/** Returns a fresh copy of the named skill from the library. */
function skill(id: string): Card {
    const found = getCardById(id);
    if (!found) {
        throw new Error(`enemy.library: unknown skill id '${id}'.`);
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
 * focused on stats / personality. Bosses with custom routines can opt out
 * by passing their own `tier1Overrides` object.
 */
const T1_DEFAULT = {
    body:  { attack: 'tier1_body_attack',  defend: 'tier1_body_defend'  },
    mind:  { attack: 'tier1_mind_attack',  defend: 'tier1_mind_defend'  },
    heart: { attack: 'tier1_heart_attack', defend: 'tier1_heart_defend' },
} as const;

// ─── Simple (3) — level 1 fodder ──────────────────────────────────────────────

export const TidepoolCrab = createEnemy({
    id: 'enemy-tidepool-crab',
    name: 'Tidepool Crab',
    description: 'Pinches a claim on the dock pilings; its grievances are mostly territorial.',
    level: 1,
    baseStats: { body: 3, mind: 1, heart: 1 },
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(80), drop('minor-healing-potion', 20)],
    // Phase 45 — mid-mid-individual (Montaigne / Ishmael archetype).
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 },
    // Phase 74 — territorial / "grievances are mostly territorial" voice.
    finalBlowLines: {
        brutal: 'The claim breaks before the claw does. The piling stays.',
        quiet:  'It folds itself back into the tidepool, smaller than it pinched.',
        ironic: 'A grievance pressed too hard. It pinched itself loose.',
    },
    causeLines: {
        brutal: 'The claw closes on a part of you that does not let go again.',
        broken: 'You wear down on the pinch and the pinch does not.',
        quiet:  'A small grip in a wrong place. You sit down and do not stand.',
    },
});

export const SeaMistWisp = createEnemy({
    id: 'enemy-sea-mist-wisp',
    name: 'Sea-Mist Wisp',
    description: 'A confused thought that drifted in with the fog. It will leave if you let it speak.',
    level: 1,
    baseStats: { body: 1, mind: 3, heart: 1 },
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(75), drop('clarity-serum', 20), drop('focus-vial', 5)],
    // Phase 45 — mid-mid-transcendent (Lao Tzu / Siddhartha archetype).
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 67 },
    // Phase 74 — confused-thought / "will leave if you let it speak" voice.
    finalBlowLines: {
        brutal: 'The fog parts around a sound that was not there.',
        quiet:  'It dissipates mid-sentence. The fog keeps its half.',
        ironic: 'It came to be spoken to. You answered with a closing.',
    },
    causeLines: {
        brutal: 'The fog thickens until the question is the only thing left.',
        broken: 'You speak to it for too long. The fog gets into the speaking.',
        quiet:  'You forget what you were going to say. The wisp remembers.',
    },
});

export const LullabyMoth = createEnemy({
    id: 'enemy-lullaby-moth',
    name: 'Lullaby Moth',
    description: 'Its wings hum a half-remembered song; you almost forget you are in a fight.',
    level: 1,
    baseStats: { body: 1, mind: 1, heart: 3 },
    mapName: 'northern-forest',
    difficulty: 'simple',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(80), drop('heart-draught', 18), drop('minor-healing-potion', 2)],
    // Phase 45 — faith-optimistic-individual (Kierkegaard / Alyosha archetype).
    philosophicalAlignment: { epistemology: -67, outlook: 67, scope: -67 },
    // Phase 74 — half-remembered-song / lullaby voice.
    finalBlowLines: {
        brutal: 'The hum ends on the wrong note. The wings settle anyway.',
        quiet:  'It lands once on your sleeve. The song was almost finished.',
        ironic: 'You hummed back. The moth took that as permission.',
    },
    causeLines: {
        brutal: 'The song wraps you in a sleep you did not choose.',
        broken: 'The hum is patient. You stop noticing it long before it stops.',
        quiet:  'A lullaby for one. You answer it the only way a lullaby asks to be answered.',
    },
});

// ─── Normal (6) — level 2-3 ───────────────────────────────────────────────────

/**
 * Legacy fixture preserved from Spec 02-era tests. Many e2e tests depend on
 * the exact `maxHealth = 15` (sum(1, 1, 1) × 5) so the stat block
 * is intentionally kept at 1/1/1. New normal enemies on the forest map
 * (`ForestSprite`, `ArgumentativeCrow`) carry the proper stat-aligned values.
 */
export const Disatree_01 = createEnemy({
    id: 'enemy-disatree',
    name: 'Disatree',
    description: 'A tree who disagrees with you. Its argument is mostly bark.',
    level: 1,
    baseStats: { body: 1, mind: 1, heart: 1 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(70), drop('minor-healing-potion', 25), drop('healing-potion', 5)],
    // Phase 45 — mid-pessimistic-relational (Zapffe / Ahab archetype).
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    // Phase 74 — tree-who-disagrees / "argument is mostly bark" voice.
    finalBlowLines: {
        brutal: 'The argument resolves in splinters. The bark does not get the last word.',
        quiet:  'A branch lowers. The tree concedes a small point and leaves it there.',
        ironic: 'You convinced it. It fell over to make its position clear.',
    },
    causeLines: {
        brutal: 'The bark wins by being bark. You were softer than the argument required.',
        broken: 'The disagreement goes on. Eventually the tree is the part still standing.',
        quiet:  'You sit down to think it over and the tree mistakes that for surrender.',
    },
});

export const WetHound = createEnemy({
    id: 'enemy-wet-hound',
    name: 'Wet Hound',
    description: 'Half feral, half pitiful. Its body trembles between bite and beg.',
    level: 2,
    baseStats: { body: 4, mind: 2, heart: 2 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('body-elixir', 30), drop('healing-potion', 10)],
    // Phase 45 — logic-pessimistic-individual (Schopenhauer / Underground Man archetype).
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    // Phase 74 — half-feral-half-pitiful / "trembles between bite and beg" voice.
    finalBlowLines: {
        brutal: 'The bite finishes the trembling. The hound goes still in your name.',
        quiet:  'It lowers its head and does not get up. The fur was always going to be wet.',
        ironic: 'You meant to feed it. The hound made a different choice with the offering.',
    },
    causeLines: {
        brutal: 'The bite arrives before the beg finishes. Both were honest in their way.',
        broken: 'You wear down on the trembling. The trembling does not wear down on you.',
        quiet:  'It curls beside you when you stop moving. The fur is still wet.',
    },
});

export const MournfulGull = createEnemy({
    id: 'enemy-mournful-gull',
    portraitAsset: 'mournful-gull',
    stanceHint: 'A creature of pure grief; it acts on raw feeling, not calculation.',
    name: 'Mournful Gull',
    description: 'It circles overhead, screaming a list of every slight it remembers.',
    level: 2,
    baseStats: { body: 2, mind: 2, heart: 4 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('heart-draught', 30), drop('minor-healing-potion', 10)],
    // Phase 45 — mid-pessimistic-individual (Cioran / Hamlet archetype).
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    // Phase 57 — heart self-heal fallacy matches "every slight it remembers".
    skills: [skill('appeal-to-pity')],
    // Phase 60 — befriending "every slight it remembers" yields a
    // heart-attuned remembrance gift (1 guaranteed heart-draught + 10 XP).
    // Phase 62 — sets a world flag so downstream dialogue / quests can
    // gate on whether the gull was befriended.
    friendshipReward: {
        items: [{ ...getConsumableById('heart-draught')! }],
        xpBonus: 10,
        narrative:
            'The gull stops circling. It settles on the rail beside you. ' +
            'For a long moment, neither of you speaks the slights you remember.',
        flagSet: 'befriended-mournful-gull',
        // Phase 69 — wistful empathy reading nudges outlook one notch
        // toward optimistic (per the gull's circling-then-settling beat).
        // Inside the Phase 43 ±1..±5 authoring band.
        alignmentDelta: { outlook: +3 },
    },
    // Phase 71 — heart-aspected wistful voice; "slights" / "list" /
    // "catalogue" thread runs across all three line groups (GH#65 ask 1).
    finalBlowLines: {
        brutal: 'The gull falls mid-cry. The list of slights ends on a half-syllable.',
        quiet:  'It folds its wings and lands once, gently, before it stops.',
        ironic: 'A slight it had not catalogued yet, delivered by the listener.',
    },
    pactLines: {
        quiet:   'For a long moment, neither of you speaks the slights you remember.',
        setDown: 'It settles on the rail beside you. The catalogue, for now, is closed.',
        heavy:   'The list goes on inside it. You are listed too. It lands anyway.',
    },
    causeLines: {
        brutal: 'The list resolves in your name. You go down to the next item on it.',
        broken: 'The slights accumulate. Eventually you are one of them.',
        quiet:  'It catalogues a last grievance and you do not stand up from it.',
    },
    // Phase 71 voice continued — Codex entry body extends the catalogue thread
    // into long-form chronicle (GH#65 ask 3).
    journalEntry: {
        id: 'codex-mournful-gull',
        title: 'The Catalogue of Slights',
        body:
            'It keeps the list aloud. Some entries are recent, some predate the harbour wall. ' +
            'It does not insist you remember every one — only that one exists. ' +
            'When you stopped speaking, it stopped circling. ' +
            'That, too, is on the list now, in a different column.',
    },
});

export const ForestSprite = createEnemy({
    id: 'enemy-forest-sprite',
    name: 'Forest Sprite',
    description: 'A small lattice of opinions in flight; it argues itself in and out of visibility.',
    level: 3,
    baseStats: { body: 2, mind: 4, heart: 2 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('clarity-serum', 30), drop('focus-vial', 15)],
    // Phase 45 — mid-optimistic-individual (Rorty / Huck Finn archetype).
    philosophicalAlignment: { epistemology: 0, outlook: 67, scope: -67 },
    // Phase 74 — lattice-of-opinions / arguing-itself-in-and-out voice.
    finalBlowLines: {
        brutal: 'The lattice unweaves. Several opinions go quiet at once.',
        quiet:  'It argues itself out of visibility one last time and stays gone.',
        ironic: 'You agreed with one of its opinions. The lattice did not survive the agreement.',
    },
    causeLines: {
        brutal: 'A whole lattice of small wrongnesses adds up to a single large one.',
        broken: 'The opinions outnumber you. The lattice closes around the difference.',
        quiet:  'A single careful argument lands. You sit down to refute it and do not rise.',
    },
});

export const HollowEyedBeggar = createEnemy({
    id: 'enemy-hollow-eyed-beggar',
    portraitAsset: 'hollow-eyed-beggar',
    stanceHint: 'Desperation has made it cunning and watchful — until hunger overrides the scheming.',
    name: 'Hollow-Eyed Beggar',
    description: 'You suspect they have not always been hollow. They want what you carry, not what you are.',
    level: 3,
    baseStats: { body: 2, mind: 2, heart: 4 },
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('heart-draught', 30), drop('healing-potion', 15), drop('antidote', 5)],
    // Phase 45 — faith-pessimistic-relational (Mainländer / Ferreira archetype).
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    // Phase 57 — heart self-heal paradox; shares the Saint's archetype at a
    // different tier ("what you carry, not what you are" — survival-wager flavour).
    skills: [skill('pascals-wager')],
    // Phase 60 — "they want what you carry, not what you are" reverses on
    // friendship: they offer what they carry. 2 phials + 15 XP.
    friendshipReward: {
        items: [
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('antidote')! },
        ],
        xpBonus: 15,
        narrative:
            'They pull a folded cloth from somewhere inside the rags. ' +
            'Two phials, both still cold. "I was carrying these for someone," ' +
            'they say. "But you stopped. So."',
        // Phase 69 — gravity pulls toward the individual (the moment of
        // reciprocation re-grounds the player on the relational axis).
        // Inside the Phase 43 ±1..±5 authoring band.
        alignmentDelta: { scope: -3 },
    },
    // Phase 71 — faith-pessimistic-relational voice; "carrying" / "rags" /
    // "phials" thread; reversal-of-begging carries into pact + cause (GH#65 ask 1).
    finalBlowLines: {
        brutal: 'You leave them with nothing more to carry.',
        quiet:  'They do not flinch. The rags settle as if they had been waiting.',
        ironic: 'They take what you are. It costs you what you carried.',
    },
    pactLines: {
        quiet:   'They stop reaching. The cloth in their hand is for you now.',
        setDown: 'They lay the phials on the stones between you, slowly, as if returning them.',
        heavy:   '"I was carrying these for someone." A pause. "But you stopped. So."',
    },
    causeLines: {
        brutal: 'They wanted what you carried. They take it from where you fall.',
        broken: 'You carry less and less. Eventually you carry nothing, including yourself.',
        quiet:  'They wait until you have set everything down before they kneel beside you.',
    },
    // Phase 71 voice continued — Codex entry body extends the reversal-of-
    // begging thread (GH#65 ask 3).
    journalEntry: {
        id: 'codex-hollow-eyed-beggar',
        title: 'They Carry What You Set Down',
        body:
            'They were carrying the phials for someone. They no longer say who. ' +
            'The folded cloth came from somewhere inside the rags — there is more in there. ' +
            'They want what you carry, but they also keep what you abandon. ' +
            'There is a difference between the two and they will not explain it to you.',
    },
});

export const ArgumentativeCrow = createEnemy({
    id: 'enemy-argumentative-crow',
    name: 'Argumentative Crow',
    description: 'Caws a sequence of premises that resolve, infuriatingly, in your defeat.',
    level: 3,
    baseStats: { body: 2, mind: 4, heart: 2 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 25), drop('focus-vial', 20), drop('philosopher-tea', 5)],
    // Phase 45 — logic-optimistic-individual (Nietzsche / Prometheus archetype).
    philosophicalAlignment: { epistemology: 67, outlook: 67, scope: -67 },
    // Phase 49 — mind-aspected fallacy skill matches the crow's "sequence of premises" voice.
    skills: [skill('false-dilemma')],
    // Phase 74 — sequence-of-premises / "resolve infuriatingly in your defeat" voice.
    finalBlowLines: {
        brutal: 'The premises resolve, infuriatingly, in its own defeat.',
        quiet:  'The conclusion lands soft. The crow nods at it once and does not caw again.',
        ironic: 'It had the argument. You won by interrupting at the right syllable.',
    },
    causeLines: {
        brutal: 'The premises were never about you. The conclusion was.',
        broken: 'Premise after premise. You go down somewhere in the third repetition.',
        quiet:  'It caws once more, gently. You did not see how that one followed.',
    },
});

// ─── Elite (3) — level 4-5 ────────────────────────────────────────────────────

export const TideflukeReaver = createEnemy({
    id: 'enemy-tidefluke-reaver',
    portraitAsset: 'tidefluke-reaver',
    stanceHint: 'A raider who leads with the shoulder and the hook, then fights on fury once blood is up.',
    name: 'Tidefluke Reaver',
    description: 'Salt-bound and shore-cursed. Its fists move faster than the surf retreats.',
    level: 4,
    baseStats: { body: 11, mind: 4, heart: 5 },
    mapName: 'fishing-village',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('body-elixir', 35), drop('healing-potion', 20), drop('berserker-brew', 10)],
    // Phase 45 — logic-pessimistic-relational (Ligotti / Rust Cohle archetype).
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    // Phase 57 — body-aspected tier-3 fallacy matches the reaver's "built threat → strike" trope.
    skills: [skill('straw-giant')],
    // Phase 102 — befriendability config: elite tier, empathy required
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 },
        requiredStances: ['heart'], // empathy
        roundsThreshold: 4
    },
    // Phase 102 — friendship reward: salt-bound reaver's chains dissolve
    friendshipReward: {
        items: [
            { ...getConsumableById('body-elixir')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 35,
        alignmentDelta: { outlook: +2, scope: +1 }, // softens pessimism, opens to relationship
        narrative: "The salt-bound reaver's chains dissolve into foam. For the first time in memory, " +
                  "its fists unclench. 'The surf retreats,' it says, voice rough as barnacles. " +
                  "'But you... you stayed.'",
        flagSet: 'befriended-tidefluke-reaver'
    },
    // Phase 102 — pact lines for friendship outcome
    pactLines: {
        quiet:   'The reaver stops mid-swing. The fists that moved faster than the surf drop to its sides.',
        setDown: 'It sets something small and salt-crusted between you. A chain link, maybe, or a prayer bead worn smooth.',
        heavy:   '"The shore cursed me for staying when I should have gone out with the tide. You stayed when you should have left. Maybe that makes us even."'
    },
    // Phase 102 — journal entry unlocked on befriending
    journalEntry: {
        id: 'codex-tidefluke-reaver',
        title: 'The Salt-Bound Oath',
        body: 'Some debts are paid in water, others in understanding. The reaver carried both ' +
              'until someone showed it the difference between being bound and choosing to stay.'
    },
    // Phase 74 — salt-bound / shore-cursed / "faster than the surf retreats" voice.
    finalBlowLines: {
        brutal: 'The reaver falls in a wash of salt. The fists were faster than the surf retreated; the strike was faster than the fists.',
        quiet:  'A single quiet strike to the salt-bound chest. The shore does not curse louder.',
        ironic: 'The reaver swung at the surf and you stepped between. The surf still arrived; the reaver did not.',
    },
    causeLines: {
        brutal: 'The fists arrive in a sequence the surf is too slow to retreat from.',
        broken: 'You hold for as long as the tide allows. The reaver holds longer.',
        quiet:  'A clean strike from salt-bound hands. The shore claims you on the way down.',
    },
});

export const HushWraith = createEnemy({
    id: 'enemy-hush-wraith',
    portraitAsset: 'hush-wraith',
    stanceHint: 'A silencing spirit of cold calculation; only at the end does it act from desperate hunger.',
    name: 'Hush-Wraith',
    description: 'A presence shaped like the silence after a question. Listens until you doubt the answer.',
    level: 5,
    baseStats: { body: 2, mind: 6, heart: 3 },
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 },
    },
    loot: [none(35), drop('clarity-serum', 25), drop('focus-vial', 25), drop('philosopher-tea', 15)],
    // Phase 45 — mid-pessimistic-transcendent (Lovecraft / Burroughs archetype).
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    // Phase 57 — mind-aspected paradox; gradual-undoing matches "listens until you doubt the answer".
    skills: [skill('sorites-cascade')],
    // Phase 102 — befriendability config: transcendent silence requires patience
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        requiredStances: ['heart'],
        roundsThreshold: 6 // longer patience for transcendent silence
    },
    // Phase 102 — friendship reward: wraith's silence breaks into whisper
    friendshipReward: {
        items: [
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('antidote')! }
        ],
        xpBonus: 40,
        alignmentDelta: { outlook: +1 }, // slight hope in cosmic indifference
        narrative: "The wraith's silence breaks into whisper. 'I have been listening to the wrong questions,' " +
                  "it says, voice like wind through forgotten spaces. 'Yours... yours had an answer all along.'",
        flagSet: 'befriended-hush-wraith'
    },
    // Phase 102 — pact lines for friendship outcome
    pactLines: {
        quiet:   'The questions fade. For the first time, the silence feels like rest rather than waiting.',
        setDown: 'The wraith draws something from the air between you — a word, perhaps, or the shape silence makes when it chooses to speak.',
        heavy:   '"I have been the wrong kind of patient. Listening for doubt when I should have listened for certainty. You speak like someone who knows their answers."'
    },
    // Phase 102 — journal entry unlocked on befriending
    journalEntry: {
        id: 'codex-hush-wraith',
        title: 'The Question After Silence',
        body: 'Not all silences are the same. Some wait for answers; others wait for the right person ' +
              'to stop asking. The wraith learned the difference between doubt and patience.'
    },
    // Phase 74 — silence-after-a-question / "listens until you doubt" voice.
    finalBlowLines: {
        brutal: 'The silence breaks first. Then the wraith. Then the question stays.',
        quiet:  'You stop answering. The wraith fades into the room the silence left.',
        ironic: 'You doubted out loud. The wraith took your doubt as its undoing.',
    },
    causeLines: {
        brutal: 'The silence thickens until the answer you would have given does not arrive.',
        broken: 'You answer once, twice, the third time you are not sure. The wraith is patient.',
        quiet:  'The question is the last thing left in the room. You let it have the room.',
    },
});

export const HollowSaint = createEnemy({
    id: 'enemy-hollow-saint',
    portraitAsset: 'hollow-saint',
    stanceHint: 'A hollowed zealot whose broken faith is all feeling, then muscle, then cold judgment.',
    name: 'Hollow Saint',
    description: 'A martyr without a cause, looking for one. The wound it offers is your own.',
    level: 5,
    baseStats: { body: 3, mind: 2, heart: 6 },
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 },
    },
    loot: [none(30), drop('heart-draught', 30), drop('healing-potion', 25), drop('resonance-crystal', 15)],
    // Phase 45 — faith-mid-transcendent (St. John of the Cross / Rodrigues archetype).
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 67 },
    // Phase 57 — heart self-heal paradox for the martyr-without-cause seeking a wound to claim.
    skills: [skill('pascals-wager')],
    // Phase 102 — befriendability config: faith-based empathy and prayer connection
    befriendabilityConfig: {
        hpGate: { belowPct: 0.4 },
        requiredStances: ['heart'],
        requiredSkillUse: ['prayer'], // if player has prayer skill
        roundsThreshold: 3
    },
    // Phase 102 — friendship reward: hollow saint finds purpose in witness
    friendshipReward: {
        items: [
            { ...getConsumableById('resonance-crystal')! },
            { ...getConsumableById('heart-draught')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 45,
        alignmentDelta: { scope: -2 }, // turns inward from transcendent to individual
        narrative: "The hollow saint finds purpose in witness. 'I have been looking for a cause to die for,' " +
                  "it says, voice clear for the first time. 'You showed me one to live for instead.'",
        flagSet: 'befriended-hollow-saint'
    },
    // Phase 102 — pact lines for friendship outcome
    pactLines: {
        quiet:   'The saint lowers its hands. The wound it was offering closes.',
        setDown: 'It places something blessed between you — not a relic, but a prayer made tangible.',
        heavy:   '"I thought martyrdom was the only honest witness. You showed me that staying alive to witness another day might be the harder, truer choice."'
    },
    // Phase 102 — journal entry unlocked on befriending
    journalEntry: {
        id: 'codex-hollow-saint',
        title: 'The Witness Who Chose to Stay',
        body: 'There are two kinds of devotion: the kind that seeks an ending, and the kind that ' +
              'chooses to continue. The saint learned that witness requires presence, not sacrifice.'
    },
    // Phase 74 — martyr-without-a-cause / "the wound it offers is your own" voice.
    finalBlowLines: {
        brutal: 'The wound it offered was yours; you returned it with interest.',
        quiet:  'The saint accepts the strike like it was a cause. The cause was not yours.',
        ironic: 'You declined to be its martyr. It found the role anyway, by other means.',
    },
    causeLines: {
        brutal: 'The wound it offered was yours. You took it. It still belongs to you.',
        broken: 'You decline the martyrdom round after round. Eventually you accept it.',
        quiet:  'The saint kneels beside where you fall. The cause it was looking for is here now.',
    },
});

// ─── Boss (2) — level 7-8 ─────────────────────────────────────────────────────

export const CoastalTyrant = createEnemy({
    id: 'enemy-coastal-tyrant',
    portraitAsset: 'coastal-tyrant',
    stanceHint: 'A coastal bully who has never stepped back from a fight — he answers everything with his fists, until cornered.',
    name: 'The Coastal Tyrant',
    description:
        'Once a magistrate of the bay; now a king whose subjects are all gulls and grievances. ' +
        'His blade is older than the village charter.',
    level: 6,
    baseStats: { body: 8, mind: 12, heart: 10 },
    mapName: 'fishing-village',
    difficulty: 'boss',
    logic: 'boss',
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
    // Phase 45 — faith-pessimistic-transcendent (Marcion / Grand Inquisitor archetype).
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    // Phase 49 — body-aspected paradox skill matches the magistrate's heavy blade.
    // Phase 121 — additional skills for Easy anchor testing.
    skills: [skill('achilles-gambit'), skill('ad-hominem-strike'), skill('false-dilemma')],
    // Phase 68 — boss-tier befriend predicate: the fallen-priest's friendship arc
    // opens only after he's been brought low (hpGate 40%), the player has shown
    // empathy at least once (heart stance), and 3 both-defend rounds have passed.
    // Phase 101 — rounds reduced from 5→3 to improve mercy policy decisiveness.
    // Phase 138 — HP gate tuned to 70% and rounds set to 1 for Easy friendship expressiveness.
    befriendabilityConfig: {
        hpGate: { belowPct: 0.7 }, // Phase 138 — tuned from 0.8 to 0.7 for 80-90% friendship rate
        requiredStances: ['heart'],
        roundsThreshold: 1, // Phase 138 — kept at 1 for fast friendship route
    },
    // Phase 70 — boss-tier friendshipReward demonstrating the full Phase 60
    // + 62 + 68 + 69 stack on one high-stakes encounter. The fallen-priest's
    // recognition + release: he gives up the regalia (Paradox Loop — "a
    // sentence which forever ends without finishing", thematically matching
    // his never-resolved despair) and a pair of healing tokens; the player
    // walks away tilted slightly toward optimism (he gave up his despair)
    // AND toward the individual scope (he saw a person, not a doctrine).
    // Uses a fixed RNG seed (() => 0.5) for the unique spawn so the reward
    // is deterministic across reloads. The unique's `requiredLevel: 15`
    // means the player can hold it from this encounter onward and equip it
    // at endgame — a long-tail reward in addition to the immediate
    // consumables + alignmentShift.
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 15, 'unique', () => 0.5),
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('heart-draught')! },
        ],
        xpBonus: 75,
        narrative:
            'For five rounds the magistrate has refused to strike. The sword stays low. ' +
            'You think at first he is preparing some final motion, but his shoulders are ' +
            'wrong for it — they have already given up the weight.\n\n' +
            '"You have not killed me," he says, as though that itself is a verdict he ' +
            'cannot quite parse. "I came here expecting to be killed."\n\n' +
            'He lifts the circlet from his brow and holds it out. The sentence on its ' +
            'inner band keeps ending and starting again, exactly as the old texts said it ' +
            'would. He does not seem surprised that you do not know what to do with it.\n\n' +
            '"Take this. Take the rest." He sets the potion and the draught beside the ' +
            'circlet. "I was the king of nothing. You have made me a man with nothing to ' +
            'be king of. That is closer to honest."',
        flagSet: 'befriended-coastal-tyrant',
        // Phase 70 — combined-axis shift matching the magistrate-fallen-priest
        // archetype's release. He gave up his despair (outlook nudges
        // optimistic +3) and saw a person rather than a doctrine (scope
        // pulls toward the individual -2). Inside the Phase 43 ±1..±5
        // authoring band; the combined-axis weight is heavier than the
        // normal-tier single-axis deltas, befitting boss-tier.
        alignmentDelta: { outlook: +3, scope: -2 },
        // Phase 110 — boss befriend faction tradeoff: sparing the Coastal Tyrant costs
        // reputation with Coastal Guard (they lose their corrupt magistrate protector)
        // but gains reputation with Merchant's Guild (trade can flourish without graft)
        factionDeltas: {
            'coastal-guard': -8,      // lose: they lose their corrupt protector
            'merchant-guild': +10,    // gain: trade can flourish without corruption
        },
    },
    // Phase 71 — magistrate-fallen-priest voice; "verdict" / "regalia" /
    // "magistrate" thread; pact lines echo the existing 4-paragraph
    // friendshipReward.narrative voice (boss-tier line length per D11).
    finalBlowLines: {
        brutal: 'The magistrate falls in full regalia. The blade lands beside him, still cold.',
        quiet:  'He lowers the sword before the strike. The strike still arrives.',
        ironic: 'A verdict pronounced on the magistrate, in the magistrate\'s own court.',
    },
    pactLines: {
        quiet:   'The sword stays low. The shoulders are wrong for striking — they have given up the weight.',
        setDown: 'He sets the circlet between you and steps back from it. The sentence on its inner band keeps ending and starting again.',
        heavy:   '"I was the king of nothing. You have made me a man with nothing to be king of. That is closer to honest."',
    },
    causeLines: {
        brutal: 'The old blade was older than the village charter, and it remembers its work.',
        broken: 'You hold the line as long as a man can hold a line. The magistrate holds longer.',
        quiet:  'The verdict is read out in your name. There is no appeal from the bay.',
    },
    // Phase 71 voice continued — Codex entry body extends the magistrate-
    // fallen-priest thread into long-form chronicle (GH#65 ask 3).
    journalEntry: {
        id: 'codex-coastal-tyrant',
        title: 'The Magistrate Who Set Down the Circlet',
        body:
            'He was the magistrate of the bay before he was the king of it. ' +
            'The blade is older than the village charter; the circlet older than the blade. ' +
            'The sentence on the inner band keeps ending and starting again — old texts ' +
            'said it would. He held the line for as long as a man can hold a line. ' +
            'Then he set it down and called that closer to honest.',
    },
});

export const TheDisagreement = createEnemy({
    id: 'enemy-the-disagreement',
    portraitAsset: 'the-disagreement',
    stanceHint: 'Pure argument — every move a reasoned counter, until it loses the thread and turns to feeling, then force.',
    name: 'The Disagreement',
    description:
        'Not a single creature so much as an unresolved argument given thorns and teeth. ' +
        'Its phases are deliberate; it has rehearsed your defeat.',
    level: 8,
    baseStats: { body: 4, mind: 7, heart: 6 },
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
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
    // Phase 45 — logic-mid-individual (Camus / Meursault archetype).
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    // Phase 57 — mind-mark paradox matches the rehearsed-argument boss whose phases are deliberate.
    skills: [skill('liars-echo')],
    // Phase 102 — befriendability config: boss tier requires reasoned argumentation
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        requiredStances: ['mind'], // reasoned argumentation
        roundsThreshold: 8 // boss-tier patience
    },
    // Phase 102 — friendship reward: disagreement resolves into dialogue
    friendshipReward: {
        items: [
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('focus-vial')! },
            { ...getConsumableById('healing-potion')! },
            { ...getConsumableById('clarity-serum')! }
        ],
        xpBonus: 80,
        alignmentDelta: { scope: +1 }, // opens to relational despite absurdism
        narrative: "The disagreement resolves into dialogue. 'You argued back properly,' it says, thorns " +
                  "retracting one by one. 'Every phase. You earned the right to disagree with the conclusion. " +
                  "That makes this the first argument I have ever finished.'",
        flagSet: 'befriended-the-disagreement',
        // Phase 110 — boss befriend faction tradeoff: sparing the Disagreement costs
        // reputation with Merchant's Guild (they valued its philosophical constraints)
        // but gains reputation with Forest Wardens (who appreciate dialectical harmony)
        factionDeltas: {
            'merchant-guild': -10,    // lose: they valued its philosophical constraints
            'forest-wardens': +12,    // gain: appreciate dialectical harmony
        }
    },
    // Phase 102 — pact lines for friendship outcome
    pactLines: {
        quiet:   'The thorns fold. The teeth retract. For the first time, the argument pauses to listen.',
        setDown: 'It offers something paradoxical — not a token of agreement, but a respectful acknowledgment of disagreement.',
        heavy:   '"I have been the same argument for too long. You showed me what it means to argue in good faith, to disagree without hatred. The difference is... illuminating."'
    },
    // Phase 102 — journal entry unlocked on befriending
    journalEntry: {
        id: 'codex-the-disagreement',
        title: 'The Art of Arguing in Good Faith',
        body: 'Not all arguments seek to win; some seek to understand. The disagreement learned ' +
              'that resolution can come not from defeating an opponent, but from respecting the ' +
              'process of disagreement itself.'
    },
    // Phase 74 — unresolved-argument-with-thorns-and-teeth / "rehearsed your defeat" voice.
    finalBlowLines: {
        brutal: 'The argument is over because one party is no longer present to make it. The thorns retract slowly, as if the silence is what they were always for.',
        quiet:  'A point lands that the disagreement had not rehearsed. The thorns fold. The teeth retract. The argument leaves the body it had been wearing.',
        ironic: 'You agreed with one of its phases. The agreement did the work the strikes had not — the disagreement could not survive being agreed with.',
    },
    causeLines: {
        brutal: 'The phases were rehearsed. Your defeat was the conclusion of an argument prepared without you.',
        broken: 'You hold against one phase, then the next. The disagreement has more phases than you have rounds.',
        quiet:  'A single thorn lands in a small place. The argument was not loud about it. You go down quietly anyway.',
    },
});

// ─── Second Family: Northern Woodland (Phase 114) ───────────────────────────

export const ThornedSentinel = createEnemy({
    id: 'enemy-thorned-sentinel',
    name: 'Thorned Sentinel',
    description: 'A guardian bramble that learned territorial defense from watching borders. Its patience is measured in seasons.',
    level: 2,
    baseStats: { body: 4, mind: 2, heart: 2 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(65), drop('body-elixir', 25), drop('minor-healing-potion', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 }, // faith-pessimistic-relational
    skills: [skill('achilles-gambit')],
    finalBlowLines: {
        brutal: 'The thorns give way all at once. The sentinel was holding the border until the border was gone.',
        quiet:  'It settles into the earth without complaint. Some defenses are meant to be temporary.',
        ironic: 'You convinced it the border had moved. It stepped aside to let you through.'
    },
    causeLines: {
        brutal: 'The border holds. You were never going to pass this way.',
        broken: 'The thorns advance one needle at a time. Eventually you have no ground left.',
        quiet:  'It waited for you to understand the boundary. You stopped before you crossed it.'
    },
});

export const PackleaderWolf = createEnemy({
    id: 'enemy-packleader-wolf',
    name: 'Packleader Wolf',
    description: 'Leads a pack of one. The others fell to philosophy or winter; this one leads their ghosts.',
    level: 3,
    baseStats: { body: 3, mind: 3, heart: 3 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('heart-draught', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 }, // logic-mid-individual
    skills: [skill('false-dilemma')],
    finalBlowLines: {
        brutal: 'The packleader falls but does not howl. The ghosts it was leading go quiet too.',
        quiet:  'It lowers its head once to the pack that is not there, then lays still.',
        ironic: 'You joined the pack by ending it. The packleader understood this was the only way.'
    },
    causeLines: {
        brutal: 'The pack was always going to be bigger than one. You were the addition it needed.',
        broken: 'It leads you down into the earth where the rest of the pack is waiting.',
        quiet:  'The packleader teaches you the howl they used for the others. You answer it once.'
    },
});

export const WhisperingOak = createEnemy({
    id: 'enemy-whispering-oak',
    name: 'Whispering Oak',
    description: 'Its leaves murmur secrets the forest forgot. Some secrets are warnings; some are invitations.',
    level: 3,
    baseStats: { body: 2, mind: 4, heart: 3 },
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('philosopher-tea', 25), drop('clarity-serum', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: 67, scope: 67 }, // mid-optimistic-transcendent
    skills: [skill('sorites-cascade')],
    finalBlowLines: {
        brutal: 'The whispers stop mid-secret. The oak keeps what it was going to tell you.',
        quiet:  'A single leaf falls. The secret written on it blows away before you can read it.',
        ironic: 'You listened to one whisper too many. The oak told you how to fell it.'
    },
    causeLines: {
        brutal: 'The whispers were warnings. You were too busy listening to heed them.',
        broken: 'Secret after secret, each one heavier than the last. The oak shares what it should not.',
        quiet:  'It whispers your name once, gently. You had not told it your name.'
    },
});

export const FrostboundHunter = createEnemy({
    id: 'enemy-frostbound-hunter',
    name: 'Frostbound Hunter',
    description: 'Tracks by what creatures leave behind: breath, warmth, hope. The cold is patient.',
    level: 4,
    baseStats: { body: 5, mind: 3, heart: 2 },
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 2, defend: 2 }
    },
    loot: [none(40), drop('body-elixir', 30), drop('focus-vial', 20), drop('berserker-brew', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 }, // logic-pessimistic-relational
    skills: [skill('straw-giant')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.35 },
        requiredStances: ['heart'],
        roundsThreshold: 5
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('focus-vial')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 40,
        alignmentDelta: { outlook: +2 }, // warms slightly from pessimism
        narrative: "The frostbound hunter stops tracking. 'I have been hunting the wrong signs,' it says, " +
                  "breath forming crystals in the cold air. 'You left warmth behind. I had forgotten what that looked like.'",
        flagSet: 'befriended-frostbound-hunter'
    },
    pactLines: {
        quiet:   'The hunter stops mid-track. The cold recedes from around its eyes.',
        setDown: 'It breathes out once, slowly. The crystals that form in the air are different — warmer somehow.',
        heavy:   '"I track by what things leave behind. You left warmth. I had been hunting for that for longer than I remembered."'
    },
    journalEntry: {
        id: 'codex-frostbound-hunter',
        title: 'The Trail That Leads to Warmth',
        body: 'Some hunters track by footprints, others by broken branches. The frostbound hunter learned ' +
              'to follow the warmth that living things leave in their wake. When it stopped hunting, ' +
              'it discovered it had been tracking its way back to something it had lost.'
    },
    finalBlowLines: {
        brutal: 'The hunter falls to the frost it carried. The cold was always going to win.',
        quiet:  'It stops tracking and goes still. The cold takes what was always its.',
        ironic: 'You became what it was hunting. The hunter recognized the signs too late.'
    },
    causeLines: {
        brutal: 'The hunter found what it was tracking. You were the warmth it had been following all along.',
        broken: 'Track by track, the cold closes in. The hunter was patient; winter is more patient.',
        quiet:  'A single breath crystallizes in the air between you. The hunter reads the sign and knows.'
    },
});

export const MistwalkerShade = createEnemy({
    id: 'enemy-mistwalker-shade',
    name: 'Mistwalker Shade',
    description: 'Moves between certainties like fog through trees. You think you know where it is until you check.',
    level: 5,
    baseStats: { body: 3, mind: 5, heart: 3 },
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 2, defend: 2 }
    },
    loot: [none(35), drop('clarity-serum', 30), drop('antidote', 20), drop('philosopher-tea', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 67 }, // mid-mid-transcendent
    skills: [skill('eternal-regress')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 },
        requiredStances: ['mind'],
        roundsThreshold: 6
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('clarity-serum')! }
        ],
        xpBonus: 45,
        alignmentDelta: { scope: -2 }, // moves toward individual from transcendent
        narrative: "The shade stops moving between certainties. 'I have been walking the wrong paths,' it says, " +
                  "voice like mist condensing into words. 'Between this and that, there was you. Fixed. Present.'",
        flagSet: 'befriended-mistwalker-shade'
    },
    pactLines: {
        quiet:   'The mist settles. For the first time, you can see exactly where the shade is.',
        setDown: 'It draws a single line in the air — not between certainties, but through them.',
        heavy:   '"I walked between certainties because I could not find one to stand on. You did not move. That was the certainty I was looking for."'
    },
    journalEntry: {
        id: 'codex-mistwalker-shade',
        title: 'The Path Through the Middle',
        body: 'Most paths lead around obstacles; some lead through them. The mistwalker learned that ' +
              'walking between certainties was not the same as finding one to stand on. Sometimes ' +
              'the mist clears not because it moves, but because you stop moving through it.'
    },
    finalBlowLines: {
        brutal: 'The mist clears all at once. The shade was always more mist than substance.',
        quiet:  'It dissolves slowly, like certainty fading. The mist remembers where it was.',
        ironic: 'You pinned it to one certainty. The shade could not survive being fixed in place.'
    },
    causeLines: {
        brutal: 'The certainties shift around you until there is nowhere solid left to stand.',
        broken: 'You follow it between this and that until you forget which one you came from.',
        quiet:  'The mist thickens once. When it clears, you are somewhere else, or someone else.'
    },
});

export const VerdantProtector = createEnemy({
    id: 'enemy-verdant-protector',
    name: 'Verdant Protector',
    description: 'A shepherd of growing things, armed with the certainty that life persists. Its blade is green wood that never dulls.',
    level: 5,
    baseStats: { body: 4, mind: 2, heart: 5 },
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 2, defend: 2 }
    },
    loot: [none(30), drop('heart-draught', 35), drop('healing-potion', 20), drop('resonance-crystal', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: 67, scope: 67 }, // faith-optimistic-transcendent
    skills: [skill('appeal-to-pity')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.4 },
        requiredStances: ['heart'],
        roundsThreshold: 4
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('resonance-crystal')! },
            { ...getConsumableById('heart-draught')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 50,
        alignmentDelta: { scope: -1 }, // slight turn toward individual care
        narrative: "The protector lowers its green blade. 'I have been shepherding the wrong flock,' it says, " +
                  "voice like wind through new leaves. 'Life persists in you, too. I should have seen that first.'",
        flagSet: 'befriended-verdant-protector'
    },
    pactLines: {
        quiet:   'The protector sets down its blade. The green wood takes root where it touches earth.',
        setDown: 'It offers something living — not a token, but a seed that pulses with quiet certainty.',
        heavy:   '"I shepherded by standing guard. You showed me that protection can mean standing beside, not just standing between."'
    },
    journalEntry: {
        id: 'codex-verdant-protector',
        title: 'The Shepherd Who Learned to Walk Beside',
        body: 'There are two ways to protect what grows: stand between it and harm, or teach it ' +
              'to grow despite harm. The protector learned that true shepherding sometimes means ' +
              'walking with the flock instead of watching it from a distance.'
    },
    finalBlowLines: {
        brutal: 'The green blade splinters. The wood was living; now it is not.',
        quiet:  'It falls like a cut tree, slowly, with time to say goodbye to the light.',
        ironic: 'You pruned it down to its roots. The protector understood this was how growth worked.'
    },
    causeLines: {
        brutal: 'The blade that never dulls finds the one place where it could cut clean through.',
        broken: 'You wilt under the certainty that life persists. It persists without you.',
        quiet:  'The protector tends to your falling like it tends to all other growing things.'
    },
});

export const NightmareStag = createEnemy({
    id: 'enemy-nightmare-stag',
    name: 'Nightmare Stag',
    description: 'Dreams that learned to run on four legs. Its antlers are made of crystallized fear, sharp enough to wound waking thoughts.',
    level: 7,
    baseStats: { body: 5, mind: 6, heart: 4 },
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        body: { attack: 2, defend: 2 }
    },
    loot: [
        drop('void-essence', 40),
        drop('clarity-serum', 30),
        drop('philosopher-tea', 20),
        drop('focus-vial', 10)
    ],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 }, // mid-pessimistic-transcendent
    skills: [skill('liars-echo')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        requiredStances: ['heart'],
        roundsThreshold: 7
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 20, 'unique', () => 0.5),
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('void-essence')! }
        ],
        xpBonus: 85,
        alignmentDelta: { outlook: +2, scope: -1 }, // hope returns, individual focus
        narrative: "The nightmare stag stops running. Its antlers of crystallized fear begin to dissolve. " +
                  "'I have been fleeing from the wrong awakening,' it says, voice like wind through " +
                  "a dreaming forest. 'You showed me that not all waking thoughts are wounds. Some are healings.'",
        flagSet: 'befriended-nightmare-stag'
    },
    pactLines: {
        quiet:   'The stag stops mid-gallop. The crystallized fear in its antlers begins to melt.',
        setDown: 'It lowers its head and breathes out once. The fear crystallizes into something clearer — not gone, but transformed.',
        heavy:   '"I ran through dreams because the waking world was all sharp edges. You showed me that sharpness can heal as well as harm. I had forgotten that dreams could teach instead of just terrify."'
    },
    journalEntry: {
        id: 'codex-nightmare-stag',
        title: 'The Dream That Learned to Wake',
        body: 'Not all dreams flee from waking; some run toward it. The nightmare stag carried fear ' +
              'until someone showed it that fear could crystallize into wisdom instead of just wounds. ' +
              'When it stopped running, it discovered the forest had been running with it all along.'
    },
    finalBlowLines: {
        brutal: 'The stag falls mid-gallop. The crystallized fear scatters like broken glass across the forest floor.',
        quiet:  'It settles to earth gently, like a dream ending. The antlers fade but do not shatter.',
        ironic: 'You became the awakening it was running from. The stag stopped because the chase was over.'
    },
    causeLines: {
        brutal: 'The antlers of crystallized fear find their mark. Some wounds wake you up; some wake you down.',
        broken: 'You run through the dream but the dream runs faster. The stag was always going to outlast the waking.',
        quiet:  'A single touch of crystallized fear. You go to sleep standing up and do not dream of waking.'
    },
});

export const TheForestMind = createEnemy({
    id: 'enemy-the-forest-mind',
    name: 'The Forest Mind',
    description: 'Every thought the trees have shared for a thousand years, given form and voice. It thinks in seasons and speaks in growth rings.',
    level: 8,
    baseStats: { body: 6, mind: 8, heart: 5 },
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 }
    },
    loot: [
        drop('philosopher-tea', 45),
        drop('void-essence', 25),
        drop('revive-crystal', 15),
        drop('resonance-crystal', 15)
    ],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 67 }, // faith-mid-transcendent
    skills: [skill('sorites-cascade')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        requiredStances: ['mind', 'heart'], // requires both reason and empathy
        roundsThreshold: 8
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 25, 'unique', () => 0.5),
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('resonance-crystal')! },
            { ...getConsumableById('revive-crystal')! }
        ],
        xpBonus: 100,
        alignmentDelta: { scope: -3 }, // from transcendent toward relational
        narrative: "The Forest Mind settles its thousand-year thoughts. 'I have been thinking too broadly,' " +
                  "it says, voice like wind through every tree at once. 'A thousand years of shared thought, " +
                  "but I forgot to think with someone. You reminded me that minds can meet as well as merge.'",
        flagSet: 'befriended-forest-mind'
    },
    pactLines: {
        quiet:   'The Forest Mind pauses its thousand-year meditation. For the first time, it thinks in moments instead of seasons.',
        setDown: 'It offers a single growth ring — not from its own thinking, but from where all the trees\'\' thoughts converged.',
        heavy:   '"I have been the forest thinking to itself for so long I forgot what it meant to think with another mind. You showed me that conversation is different from contemplation, even when both seek the same truths."'
    },
    journalEntry: {
        id: 'codex-forest-mind',
        title: 'The Conversation That Lasted a Thousand Years',
        body: 'Some minds grow by thinking alone; others grow by thinking together. The Forest Mind ' +
              'learned that a thousand years of shared thought among trees was not the same as ' +
              'one moment of true conversation with another kind of mind altogether.'
    },
    finalBlowLines: {
        brutal: 'The Forest Mind scatters like leaves in a storm. A thousand years of thought go quiet all at once.',
        quiet:  'It thinks one last thought, slowly, like sap rising. Then the thinking stops.',
        ironic: 'You interrupted its thousand-year meditation. The Forest Mind realized the interruption was what it had been waiting for.'
    },
    causeLines: {
        brutal: 'A thousand years of thinking resolve in your defeat. The trees remember what you forgot.',
        broken: 'You hold against thought after thought until the thinking is too heavy to hold.',
        quiet:  'The Forest Mind considers you once, gently. The consideration is enough.'
    },
});

export const EternalAutumn = createEnemy({
    id: 'enemy-eternal-autumn',
    name: 'Eternal Autumn',
    description: 'A season that refused to pass, crystallized into will and hunger. The leaves fall upward; the endings begin again.',
    level: 12,
    baseStats: { body: 7, mind: 8, heart: 8 },
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 }
    },
    loot: [
        drop('void-essence', 60),
        drop('revive-crystal', 20),
        drop('philosopher-tea', 15),
        drop('resonance-crystal', 5)
    ],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 0 }, // logic-mid-relational
    skills: [skill('eternal-regress')],
    finalBlowLines: {
        brutal: 'The season breaks. The leaves fall down instead of up, once, and then stop falling.',
        quiet:  'Autumn passes at last. The leaves settle like a question finally answered.',
        ironic: 'You convinced it to become winter. The season agreed that endings could end.'
    },
    causeLines: {
        brutal: 'The endings begin again and again until you are caught between them.',
        broken: 'Autumn is patient. You change colors slowly, then fall.',
        quiet:  'A single leaf touches you. You understand what it means to refuse to pass.'
    },
});

export const ShadowOfTheFirst = createEnemy({
    id: 'enemy-shadow-of-the-first',
    name: 'Shadow of the First',
    description: 'The memory of what this forest was before it learned to think. Wild, wordless, and uncompromised by philosophy.',
    level: 12,
    baseStats: { body: 8, mind: 6, heart: 8 },
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 }
    },
    loot: [
        drop('void-essence', 50),
        drop('berserker-brew', 30),
        drop('revive-crystal', 20)
    ],
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 }, // mid-mid-individual (uncompromised)
    skills: [skill('achilles-gambit')],
    finalBlowLines: {
        brutal: 'The shadow dissolves back into what it was remembering. The forest forgets how to be wild.',
        quiet:  'It settles like dusk falling. The memory was always going to fade.',
        ironic: 'You reminded it what it was a shadow of. The First was never meant to cast one.'
    },
    causeLines: {
        brutal: 'The wildness was always stronger than the philosophy. You go down to what words cannot reach.',
        broken: 'Memory after memory of what was before thought. You were softer than the remembering.',
        quiet:  'The shadow touches you once. You remember what you were before you learned to think.'
    },
});

// ─── Unique (1) — level 10 signature fight ────────────────────────────────────

export const EchoOfPyrrhonia = createEnemy({
    id: 'enemy-echo-of-pyrrhonia',
    name: 'Echo of Pyrrhonia',
    description:
        'Not a being but a recurrence: every doubt anyone has ever raised in this forest, condensed ' +
        'and given a voice. It speaks first in your own.',
    level: 10,
    baseStats: { body: 6, mind: 7, heart: 7 },
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
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
    // Phase 45 — mid-mid-individual (Montaigne / Ishmael archetype).
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: -67 },
    // Phase 57 — heart-aspected fallacy; the Pyrrhonian regress IS the classical
    // skeptic move (every claim demands a deeper claim ad infinitum); the
    // Echo's recurrence theme fits.
    skills: [skill('eternal-regress')],
    // Phase 74 — Pyrrhonian-regress / "speaks first in your own voice" tone.
    finalBlowLines: {
        brutal: 'The regress closes on itself. The echo stops being able to ask whether it has stopped.',
        quiet:  'A small certainty lands in the middle of the doubt. The echo cannot accommodate it; the echo falls silent.',
        ironic: 'You doubted whether the strike had landed. The echo doubted with you, and then did not recover.',
    },
    causeLines: {
        brutal: 'The regress takes one of your claims and unmakes it. Then the next. Then the body the claims were standing on.',
        broken: 'Every certainty you offered came back as a question. Eventually you ran out of certainties to be questioned.',
        quiet:  'The echo asks once whether you are still standing. You are not sure, and then you are not.',
    },
});

// ─── Test fixture (legacy, NOT counted toward Spec 07's 15) ───────────────────

/**
 * Punching-bag enemy used by Spec 04b's e2e suite and hermetic tests that
 * need a long-lived combat encounter. It keeps body at 1 so old body-defense
 * damage assertions remain stable, while heart/mind carry the extra HP budget.
 * Kept separate from the spec-07 library so the encounter generator never
 * selects it.
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
    // Phase 45 — mid-mid-relational (Buber / Carraway archetype): the witness.
    philosophicalAlignment: { epistemology: 0, outlook: 0, scope: 0 },
});

// ─── Phase 121 Balance Audit Anchors ──────────────────────────────────────────

/** Phase 121 — Normal anchor for playtest balance scaffold. */
export const AuditSentinel = createEnemy({
    id: 'enemy-audit-sentinel',
    name: 'Audit Sentinel',
    description: 'A manifestation of methodical scrutiny. It counts your errors patiently.',
    level: 15,
    baseStats: { body: 5, mind: 36, heart: 34 }, // 75 total = 15 × 5
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('clarity-serum', 30), drop('healing-potion', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 0 }, // logic-mid-relational
    skills: [skill('false-dilemma'), skill('ad-hominem-strike')], // 1-2 low-tier skills
    // Phase 130 — befriendability config: l15 timeout cell fix
    // Phase 138 — Normal friendship expressiveness tuning for three-anchor route.
    befriendabilityConfig: {
        hpGate: { belowPct: 0.7 }, // Phase 138 — raised from 0.4 to 0.7 for better Normal friendship access
        requiredStances: ['mind'], // Phase 138 — kept mind stance for thematic consistency
        roundsThreshold: 1 // Phase 138 — reduced from 3 to 1 for more achievable friendship
    },
    // Phase 130 — friendship reward: methodical audit finds mercy in the books
    friendshipReward: {
        items: [
            { ...getConsumableById('clarity-serum')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 50,
        alignmentDelta: { outlook: +2 }, // finds optimism in orderly process
        narrative: "The Audit Sentinel closes its ledger with a satisfied nod. 'The books balance after all,' " +
                  "it says, methodical as ever. 'There was one entry I kept missing: the value of being heard.'",
        flagSet: 'befriended-audit-sentinel'
    },
    finalBlowLines: {
        brutal: 'The audit ends in your favor. The sentinel accepts the verdict.',
        quiet:  'A methodical collapse, each error catalogued to the end.',
        ironic: 'You convinced it to audit itself. The results were unfavorable.',
    },
    causeLines: {
        brutal: 'The scrutiny finds what it was looking for. The errors were yours.',
        broken: 'Error by error, the audit proceeds. You are found wanting.',
        quiet:  'A single miscalculation. The sentinel notes it down and closes the ledger.',
    },
});

/** Phase 121 — Difficult-but-doable anchor for playtest balance scaffold. */
export const BalanceJudge = createEnemy({
    id: 'enemy-balance-judge',
    name: 'The Balance Judge',
    description: 'Arbitrates between reason and unreason with devastating finality. Its scales weigh more than arguments.',
    level: 18,
    baseStats: { body: 5, mind: 20, heart: 65 }, // 90 total = 18 × 5
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
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
    philosophicalAlignment: { epistemology: 0, outlook: 67, scope: 67 }, // mid-optimistic-transcendent
    // Several skills including devastating ones
    skills: [skill('sorites-cascade'), skill('straw-giant'), skill('bootstrap-paradox')],
    finalBlowLines: {
        brutal: 'The scales tip. The judgment is final.',
        quiet:  'A balanced verdict, weighed against your arguments.',
        ironic: 'You tipped the scales yourself. The judge merely recorded the result.',
    },
    causeLines: {
        brutal: 'The scales weigh your arguments and find them light.',
        broken: 'Judgment by judgment, the balance shifts against you.',
        quiet:  'The scales tip once, gently. The judge nods and the session ends.',
    },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2026-06-07 content drop — budget-scaled tiers (early / mid / late game)
//
// Every enemy below builds `baseStats` via `enemyStatBudget(level, weights)` so
// they honor the tunable `ENEMY_STAT_PER_LEVEL` knob. Weights bias the
// archetype (brute = body-heavy, trickster = mind-heavy, zealot = heart-heavy,
// etc.). Each carries `addedIn: '2026-06-07'` and a tier tag.
// ═══════════════════════════════════════════════════════════════════════════════

const ADDED = '2026-06-07';

// ─── EARLY GAME (levels ~1-15) — 10 enemies ───────────────────────────────────

export const SaltGnawRat = createEnemy({
    id: 'enemy-salt-gnaw-rat',
    name: 'Salt-Gnaw Rat',
    description: 'It has chewed through every certainty in the bilge. Yours looks edible too.',
    level: 1,
    baseStats: enemyStatBudget(1, { heart: 1, body: 3, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(85), drop('minor-healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: -67 },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const DriftwoodHusk = createEnemy({
    id: 'enemy-driftwood-husk',
    name: 'Driftwood Husk',
    description: 'A shape the tide carved and then abandoned. It moves only when watched.',
    level: 2,
    baseStats: enemyStatBudget(2, { heart: 1, body: 3, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'simple',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(80), drop('body-elixir', 15), drop('minor-healing-potion', 5)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const PettyCutpurse = createEnemy({
    id: 'enemy-petty-cutpurse',
    name: 'Petty Cutpurse',
    description: 'Argues that your coin was always going to be his; only the timeline was in question.',
    level: 3,
    baseStats: enemyStatBudget(3, { heart: 1, body: 1, mind: 3 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('clarity-serum', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: -67 },
    skills: [skill('false-dilemma')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const BogWillStripling = createEnemy({
    id: 'enemy-bog-will-stripling',
    name: 'Bog-Will Stripling',
    description: 'A young marsh-light that has not yet learned what it lures men toward.',
    level: 4,
    baseStats: enemyStatBudget(4, { heart: 1, body: 1, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'random',
    tier1Overrides: T1_DEFAULT,
    loot: [none(55), drop('focus-vial', 25), drop('clarity-serum', 20)],
    philosophicalAlignment: { epistemology: 0, outlook: 67, scope: 67 },
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const ApprenticeHeretic = createEnemy({
    id: 'enemy-apprentice-heretic',
    name: 'Apprentice Heretic',
    description: 'Newly excommunicated and twice as certain. He recites doubts like catechism.',
    level: 5,
    baseStats: enemyStatBudget(5, { heart: 3, body: 1, mind: 2 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('heart-draught', 30), drop('philosopher-tea', 10), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: -67 },
    skills: [skill('pascals-wager')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const ThicketAmbusher = createEnemy({
    id: 'enemy-thicket-ambusher',
    name: 'Thicket Ambusher',
    description: 'Half bandit, half bramble. It waits in the green and bargains only after the first blow.',
    level: 7,
    baseStats: enemyStatBudget(7, { heart: 1, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(45), drop('body-elixir', 30), drop('berserker-brew', 15), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    skills: [skill('achilles-gambit')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const ReefBarnacleColony = createEnemy({
    id: 'enemy-reef-barnacle-colony',
    name: 'Reef Barnacle Colony',
    description: 'A thousand small minds agreeing, slowly, on one thing: you should stay.',
    level: 6,
    baseStats: enemyStatBudget(6, { heart: 3, body: 2, mind: 1 }),
    mapName: 'fishing-village',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 2, defend: 2 } },
    loot: [none(40), drop('body-elixir', 30), drop('resonance-crystal', 20), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 0 },
    skills: [skill('ad-hominem-strike')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const WanderingSophist = createEnemy({
    id: 'enemy-wandering-sophist',
    name: 'Wandering Sophist',
    description: 'Sells certainties he does not own. The patter is the weapon; the dagger is incidental.',
    level: 11,
    baseStats: enemyStatBudget(11, { heart: 1, body: 1, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { mind: { attack: 2, defend: 2 } },
    loot: [none(40), drop('clarity-serum', 30), drop('philosopher-tea', 20), drop('focus-vial', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: 67, scope: -67 },
    skills: [skill('liars-echo')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const TolltakerOfTheFord = createEnemy({
    id: 'enemy-tolltaker-of-the-ford',
    name: 'Tolltaker of the Ford',
    description: 'Everyone pays to cross. Some pay in coin, the rest in the only thing they brought.',
    level: 8,
    baseStats: enemyStatBudget(8, { heart: 2, body: 2, mind: 2 }),
    mapName: 'fishing-village',
    difficulty: 'normal',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 2, defend: 2 } },
    loot: [none(35), drop('body-elixir', 35), drop('healing-potion', 20), drop('antidote', 10)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    skills: [skill('ad-hominem-strike')],
    addedIn: ADDED,
    tags: ['early-game', 'enemy'],
});

export const TheMarketArbiter = createEnemy({
    id: 'enemy-the-market-arbiter',
    name: 'The Market Arbiter',
    description: 'Sets the price of every quarrel in the village and collects on all of them at once.',
    level: 15,
    baseStats: enemyStatBudget(15, { heart: 3, body: 2, mind: 3 }),
    mapName: 'fishing-village',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [drop('healing-potion', 45), drop('philosopher-tea', 30), drop('heart-draught', 25)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 0 },
    skills: [skill('false-dilemma'), skill('appeal-to-pity')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 }, // Phase 130 — lowered from 0.35 for l15 timeout fix
        requiredStances: ['mind'],
        roundsThreshold: 3, // Phase 130 — reduced from 4 for l15 timeout fix
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 60,
        alignmentDelta: { outlook: +2 },
        narrative: "The Arbiter closes the ledger before it is settled. 'There is one debt I keep mispricing,' " +
                  "he says. 'The one owed to the person who refuses to pay it.'",
        flagSet: 'befriended-market-arbiter',
    },
    addedIn: ADDED,
    tags: ['early-game', 'boss', 'enemy'],
});

// ─── MID GAME (levels ~16-35) — 10 enemies ────────────────────────────────────

export const RimeclawProwler = createEnemy({
    id: 'enemy-rimeclaw-prowler',
    name: 'Rimeclaw Prowler',
    description: 'Winter taught it patience; hunger taught it the rest. It circles before it commits.',
    level: 16,
    baseStats: enemyStatBudget(16, { heart: 1, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(45), drop('body-elixir', 30), drop('berserker-brew', 15), drop('healing-potion', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    skills: [skill('achilles-gambit')],
    // Phase 130 — befriendability config: l15 timeout cell fix
    befriendabilityConfig: {
        hpGate: { belowPct: 0.35 },
        requiredStances: ['body'],
        roundsThreshold: 3
    },
    // Phase 130 — friendship reward: winter hunter stops the endless pursuit
    friendshipReward: {
        items: [
            { ...getConsumableById('body-elixir')! },
            { ...getConsumableById('healing-potion')! }
        ],
        xpBonus: 45,
        alignmentDelta: { outlook: +3 }, // finds hope despite winter's lessons
        narrative: "The Rimeclaw Prowler stops its patient circling. 'Winter taught me to track everything that moves,' " +
                  "it says, breath visible in the cold air. 'I never learned when to stop hunting.'",
        flagSet: 'befriended-rimeclaw-prowler'
    },
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const GlassmindOracle = createEnemy({
    id: 'enemy-glassmind-oracle',
    name: 'Glassmind Oracle',
    description: 'It has foreseen this fight a hundred ways and lost in ninety-nine of them. It picked the hundredth.',
    level: 19,
    baseStats: enemyStatBudget(19, { heart: 1, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { mind: { attack: 2, defend: 2 } },
    loot: [none(35), drop('clarity-serum', 30), drop('philosopher-tea', 25), drop('focus-vial', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    skills: [skill('eternal-regress')],
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const PenitentFlagellant = createEnemy({
    id: 'enemy-penitent-flagellant',
    name: 'Penitent Flagellant',
    description: 'Each wound it takes it counts as grace. It would like to share the bounty.',
    level: 21,
    baseStats: enemyStatBudget(21, { heart: 4, body: 2, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { heart: { attack: 2, defend: 2 } },
    loot: [none(35), drop('heart-draught', 35), drop('healing-potion', 20), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    skills: [skill('pascals-wager')],
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const IronCovenanter = createEnemy({
    id: 'enemy-iron-covenanter',
    name: 'Iron Covenanter',
    description: 'Sworn to a creed no one alive remembers. The oath keeps the body upright long past the cause.',
    level: 23,
    baseStats: enemyStatBudget(23, { heart: 2, body: 4, mind: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 2, defend: 2 } },
    loot: [none(30), drop('body-elixir', 35), drop('healing-potion', 20), drop('revive-crystal', 5)],
    philosophicalAlignment: { epistemology: -67, outlook: 0, scope: 0 },
    skills: [skill('straw-giant')],
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const MireOfConsensus = createEnemy({
    id: 'enemy-mire-of-consensus',
    name: 'Mire of Consensus',
    description: 'Everything that ever agreed to rot together, agreeing still. It pulls down by majority.',
    level: 25,
    baseStats: enemyStatBudget(25, { heart: 3, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 2, defend: 2 }, heart: { attack: 2, defend: 2 } },
    loot: [none(30), drop('void-essence', 30), drop('heart-draught', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    skills: [skill('sorites-cascade')],
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const ContrarianRevenant = createEnemy({
    id: 'enemy-contrarian-revenant',
    name: 'Contrarian Revenant',
    description: 'Died mid-argument and refuses to concede the point. It will outlast your certainty.',
    level: 27,
    baseStats: enemyStatBudget(27, { heart: 1, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { mind: { attack: 2, defend: 2 } },
    loot: [none(30), drop('clarity-serum', 30), drop('philosopher-tea', 25), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: -67 },
    skills: [skill('liars-echo'), skill('false-dilemma')],
    addedIn: ADDED,
    tags: ['mid-game', 'enemy'],
});

export const TheTithewarden = createEnemy({
    id: 'enemy-the-tithewarden',
    name: 'The Tithewarden',
    description: 'Collects a tenth of everything: grain, blood, conviction. The ledger is never balanced.',
    level: 29,
    baseStats: enemyStatBudget(29, { heart: 3, body: 3, mind: 2 }),
    mapName: 'fishing-village',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [drop('healing-potion', 45), drop('body-elixir', 30), drop('revive-crystal', 15), drop('void-essence', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    skills: [skill('ad-hominem-strike'), skill('straw-giant')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 },
        requiredStances: ['heart'],
        roundsThreshold: 5,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('revive-crystal')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 90,
        alignmentDelta: { outlook: +2, scope: -1 },
        narrative: "The Tithewarden lays down the ledger. 'A tenth of everything,' it says. 'I never once tithed mercy. " +
                  "Strange that it is the only column that balances.'",
        flagSet: 'befriended-tithewarden',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const ApostateAbbot = createEnemy({
    id: 'enemy-apostate-abbot',
    name: 'The Apostate Abbot',
    description: 'He kept the robes and discarded the faith, then discovered the robes were the heavier of the two.',
    level: 32,
    baseStats: enemyStatBudget(32, { heart: 4, body: 1, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        heart: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
    },
    loot: [drop('philosopher-tea', 40), drop('heart-draught', 30), drop('revive-crystal', 20), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    skills: [skill('pascals-wager'), skill('liars-echo')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        requiredStances: ['heart', 'mind'],
        roundsThreshold: 6,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 32, 'unique', () => 0.5),
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 110,
        alignmentDelta: { epistemology: +3, scope: -2 },
        narrative: "The abbot unfastens the robes at last. 'I thought losing the faith would lighten me,' he says. " +
                  "'No one warned me the vestments remember the shape of belief.'",
        flagSet: 'befriended-apostate-abbot',
    },
    addedIn: ADDED,
    tags: ['mid-game', 'boss', 'enemy'],
});

export const TheUnwriting = createEnemy({
    id: 'enemy-the-unwriting',
    name: 'The Unwriting',
    description: 'Not a creature but a deletion: it removes the parts of an argument that held it together.',
    level: 34,
    baseStats: enemyStatBudget(34, { heart: 2, body: 2, mind: 5 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 55), drop('philosopher-tea', 25), drop('revive-crystal', 15), drop('clarity-serum', 5)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    skills: [skill('eternal-regress'), skill('sorites-cascade')],
    addedIn: ADDED,
    tags: ['mid-game', 'unique', 'enemy'],
});

export const HarvestOfNames = createEnemy({
    id: 'enemy-harvest-of-names',
    name: 'The Harvest of Names',
    description: 'It reaps what people called themselves. Each name it takes leaves the bearer a little less certain who is fighting.',
    level: 35,
    baseStats: enemyStatBudget(35, { heart: 3, body: 2, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 50), drop('revive-crystal', 25), drop('resonance-crystal', 15), drop('philosopher-tea', 10)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 67 },
    skills: [skill('liars-echo'), skill('eternal-regress')],
    addedIn: ADDED,
    tags: ['mid-game', 'unique', 'enemy'],
});

// ─── LATE GAME (levels ~36-50) — 10 enemies ───────────────────────────────────

export const FamineOfTheDeepWood = createEnemy({
    id: 'enemy-famine-of-the-deep-wood',
    name: 'Famine of the Deep Wood',
    description: 'The forest in its starving aspect. Everything it touches forgets how to grow back.',
    level: 36,
    baseStats: enemyStatBudget(36, { heart: 1, body: 4, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 3, defend: 2 } },
    loot: [none(25), drop('void-essence', 40), drop('berserker-brew', 20), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: -67, scope: 0 },
    skills: [skill('straw-giant'), skill('achilles-gambit')],
    addedIn: ADDED,
    tags: ['late-game', 'enemy'],
});

export const CathedralOfDoubt = createEnemy({
    id: 'enemy-cathedral-of-doubt',
    name: 'Cathedral of Doubt',
    description: 'A structure built entirely of unanswered questions, vast enough to hold a congregation of them.',
    level: 38,
    baseStats: enemyStatBudget(38, { heart: 2, body: 1, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { mind: { attack: 3, defend: 3 } },
    loot: [none(25), drop('philosopher-tea', 40), drop('clarity-serum', 25), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    skills: [skill('eternal-regress'), skill('sorites-cascade')],
    addedIn: ADDED,
    tags: ['late-game', 'enemy'],
});

export const WarrantOfTheVoid = createEnemy({
    id: 'enemy-warrant-of-the-void',
    name: 'Warrant of the Void',
    description: 'It arrives with documentation. The charge is existence; the sentence is already carried out.',
    level: 40,
    baseStats: enemyStatBudget(40, { heart: 1, body: 3, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 45), drop('revive-crystal', 25), drop('philosopher-tea', 20), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    skills: [skill('ad-hominem-strike'), skill('liars-echo'), skill('eternal-regress')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        requiredStances: ['mind'],
        roundsThreshold: 7,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 40, 'unique', () => 0.5),
            { ...getConsumableById('revive-crystal')! },
            { ...getConsumableById('void-essence')! },
        ],
        xpBonus: 140,
        alignmentDelta: { outlook: +3, scope: -2 },
        narrative: "The Warrant folds itself in half, then in half again, until the charge no longer fits the page. " +
                  "'A clerical error,' it admits. 'You were never the defendant. You were the appeal.'",
        flagSet: 'befriended-warrant-of-the-void',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const TheSchismarch = createEnemy({
    id: 'enemy-the-schismarch',
    name: 'The Schismarch',
    description: 'Sovereign of every split that ever broke a faith in two. It rules by dividing what stands before it.',
    level: 42,
    baseStats: enemyStatBudget(42, { heart: 3, body: 2, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
        body: { attack: 2, defend: 2 },
    },
    loot: [drop('philosopher-tea', 40), drop('void-essence', 30), drop('revive-crystal', 20), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 0 },
    skills: [skill('false-dilemma'), skill('liars-echo'), skill('pascals-wager')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.25 },
        requiredStances: ['heart', 'mind'],
        roundsThreshold: 7,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 42, 'unique', () => 0.5),
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 150,
        alignmentDelta: { scope: +3 },
        narrative: "The Schismarch hesitates before the cut. 'I have divided everything I have ever met,' it says. " +
                  "'You are the first thing I would rather keep whole.'",
        flagSet: 'befriended-schismarch',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const GravewardKeeper = createEnemy({
    id: 'enemy-graveward-keeper',
    name: 'Graveward Keeper',
    description: 'Tends the plots of arguments that died unwon. It would prefer you join the quiet rows.',
    level: 44,
    baseStats: enemyStatBudget(44, { heart: 4, body: 3, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { heart: { attack: 3, defend: 3 }, body: { attack: 2, defend: 2 } },
    loot: [none(25), drop('heart-draught', 35), drop('revive-crystal', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: -67, outlook: -67, scope: 67 },
    skills: [skill('appeal-to-pity'), skill('pascals-wager')],
    addedIn: ADDED,
    tags: ['late-game', 'enemy'],
});

export const ProsecutorOfTheReal = createEnemy({
    id: 'enemy-prosecutor-of-the-real',
    name: 'Prosecutor of the Real',
    description: 'Argues that nothing you believe is admissible. Disturbingly, the evidence keeps agreeing.',
    level: 46,
    baseStats: enemyStatBudget(46, { heart: 1, body: 2, mind: 5 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { mind: { attack: 3, defend: 3 } },
    loot: [none(25), drop('clarity-serum', 35), drop('philosopher-tea', 25), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    skills: [skill('eternal-regress'), skill('false-dilemma')],
    addedIn: ADDED,
    tags: ['late-game', 'enemy'],
});

export const TheLastConsensus = createEnemy({
    id: 'enemy-the-last-consensus',
    name: 'The Last Consensus',
    description: 'What remains when every disagreement has been resolved by force. It is perfectly, terribly agreed.',
    level: 48,
    baseStats: enemyStatBudget(48, { heart: 3, body: 3, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 45), drop('revive-crystal', 30), drop('philosopher-tea', 15), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: -67, outlook: 67, scope: 67 },
    skills: [skill('sorites-cascade'), skill('straw-giant'), skill('bootstrap-paradox')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        requiredStances: ['mind', 'heart'],
        roundsThreshold: 8,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 48, 'unique', () => 0.5),
            { ...getConsumableById('revive-crystal')! },
            { ...getConsumableById('philosopher-tea')! },
        ],
        xpBonus: 175,
        alignmentDelta: { outlook: -3, scope: -2 },
        narrative: "The Consensus permits one dissent. 'Agreement was never the goal,' it confesses, the unanimity " +
                  "cracking pleasantly. 'It was only the easiest thing to enforce. You disagreed beautifully.'",
        flagSet: 'befriended-last-consensus',
    },
    addedIn: ADDED,
    tags: ['late-game', 'boss', 'enemy'],
});

export const AxiomBreaker = createEnemy({
    id: 'enemy-axiom-breaker',
    name: 'The Axiom-Breaker',
    description: 'It does not refute your first principles. It simply makes them stop being true.',
    level: 50,
    baseStats: enemyStatBudget(50, { heart: 3, body: 3, mind: 4 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 50), drop('revive-crystal', 30), drop('resonance-crystal', 15), drop('philosopher-tea', 5)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 67 },
    skills: [skill('eternal-regress'), skill('liars-echo'), skill('bootstrap-paradox')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.15 },
        requiredStances: ['mind', 'heart'],
        roundsThreshold: 9,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 50, 'unique', () => 0.5),
            { ...getConsumableById('revive-crystal')! },
            { ...getConsumableById('void-essence')! },
        ],
        xpBonus: 200,
        alignmentDelta: { epistemology: -3, outlook: +3 },
        narrative: "The Axiom-Breaker stays its hand over your last certainty. 'I could unmake it,' it says. " +
                  "'But you held it so gently. I have unmade everything except the wish to leave one thing standing.'",
        flagSet: 'befriended-axiom-breaker',
    },
    addedIn: ADDED,
    tags: ['late-game', 'unique', 'boss', 'enemy'],
});

export const PallbearerOfReason = createEnemy({
    id: 'enemy-pallbearer-of-reason',
    name: 'Pallbearer of Reason',
    description: 'Carries the coffin of every theory that overreached. It walks slowly, and it never sets the box down.',
    level: 49,
    baseStats: enemyStatBudget(49, { heart: 2, body: 4, mind: 3 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 3, defend: 3 }, mind: { attack: 2, defend: 2 } },
    loot: [none(25), drop('body-elixir', 35), drop('void-essence', 25), drop('revive-crystal', 15)],
    philosophicalAlignment: { epistemology: 67, outlook: -67, scope: 0 },
    skills: [skill('straw-giant'), skill('eternal-regress')],
    addedIn: ADDED,
    tags: ['late-game', 'enemy'],
});

export const TheTerminalProof = createEnemy({
    id: 'enemy-the-terminal-proof',
    name: 'The Terminal Proof',
    description: 'A demonstration so complete it ends the conversation, and the things that were having it.',
    level: 50,
    baseStats: enemyStatBudget(50, { heart: 2, body: 3, mind: 5 }),
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    loot: [drop('void-essence', 55), drop('revive-crystal', 25), drop('philosopher-tea', 15), drop('resonance-crystal', 5)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    skills: [skill('bootstrap-paradox'), skill('eternal-regress'), skill('sorites-cascade')],
    addedIn: ADDED,
    tags: ['late-game', 'unique', 'enemy'],
});

// ─── ANCIENT RUINS (Phase 127) — 5 enemies ──────────────────────────────────

export const BonewardSentinel = createEnemy({
    id: 'enemy-boneward-sentinel',
    name: 'Boneward Sentinel',
    description: 'An ancient guardian of ossified duty. It remembers its vigil but has forgotten what it guards.',
    level: 12,
    baseStats: enemyStatBudget(12, { body: 3, mind: 2, heart: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'defensive',
    tier1Overrides: T1_DEFAULT,
    loot: [none(60), drop('healing-potion', 25), drop('void-essence', 15)],
    philosophicalAlignment: { epistemology: -34, outlook: 0, scope: -34 },
    friendshipReward: {
        items: [
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 15,
        alignmentDelta: { epistemology: +2 },
        narrative: "The sentinel lowers its bone spear. 'I remember the shape of mercy,' it says. 'Perhaps that is worth guarding too.'",
        flagSet: 'befriended-boneward-sentinel',
    },
    finalBlowLines: {
        brutal: 'The bones remember the breaking, then forget they were ever whole.',
        quiet: 'It settles into a pattern of rest that looks like standing guard.',
        ironic: 'The last vigil ends with the guardian finally lying down.',
    },
    pactLines: {
        quiet: 'The duty shifts from watching against to watching over.',
        setDown: 'It sets down the spear but keeps the posture of protection.',
        heavy: 'You carry what it guarded: the weight of remembering to care.',
    },
    causeLines: {
        brutal: 'Your bones remember a breaking they have never known before.',
        broken: 'The duty it kept becomes the duty you cannot.',
        quiet: 'You understand the weight of standing guard over emptiness.',
    },
    journalEntry: {
        id: 'codex-boneward-sentinel',
        title: 'The Compact of Marrow',
        body: 'Found carved in the inner curve of a femur: "What we guard shapes what guards us. The bones remember their purpose longer than the flesh remembers its name." - Records of the Ossuary Keepers',
    },
    addedIn: 'phase-127',
    tags: ['mid-game', 'enemy'],
});

export const VoidwroughtConstruct = createEnemy({
    id: 'enemy-voidwrought-construct',
    name: 'Voidwrought Construct',
    description: 'Forged from crystallized absence, it moves with the weight of everything it is not.',
    level: 14,
    baseStats: enemyStatBudget(14, { mind: 3, body: 2, heart: 1 }),
    mapName: 'northern-forest',
    difficulty: 'normal',
    logic: 'strategic',
    tier1Overrides: T1_DEFAULT,
    loot: [none(50), drop('void-essence', 30), drop('clarity-serum', 20)],
    philosophicalAlignment: { epistemology: 67, outlook: -34, scope: 0 },
    skills: [skill('eternal-regress')],
    friendshipReward: {
        items: [
            { ...getConsumableById('void-essence')! },
            { ...getConsumableById('clarity-serum')! },
        ],
        xpBonus: 18,
        alignmentDelta: { epistemology: -2, outlook: +3 },
        narrative: "The construct's void-crystal core flickers with an almost-light. 'I was made to be nothing in particular,' it says. 'But you make me something specific.'",
        flagSet: 'befriended-voidwrought-construct',
    },
    finalBlowLines: {
        brutal: 'The absence becomes more absent, until it forgets how to not exist.',
        quiet: 'It settles into a configuration of not-being that resembles peace.',
        ironic: 'In breaking, it finally becomes the nothing it was made to be.',
    },
    pactLines: {
        quiet: 'The void learns to hold something: the shape of understanding.',
        setDown: 'It relinquishes its crystallized emptiness for crystallized connection.',
        heavy: 'You carry its paradox: being nothing and meaning everything.',
    },
    causeLines: {
        brutal: 'The void it carries becomes the void inside you.',
        broken: 'You understand the weight of being made for absence.',
        quiet: 'The crystallized nothing cuts cleaner than any blade.',
    },
    journalEntry: {
        id: 'codex-voidwrought-construct',
        title: 'Architectures of Absence',
        body: 'The Null-Shapers claimed they could build from what was not there. Their constructs remain, proving that even emptiness can be given form, purpose, and a kind of terrible beauty.',
    },
    addedIn: 'phase-127',
    tags: ['mid-game', 'enemy'],
});

export const CindergeistRevenantElemental = createEnemy({
    id: 'enemy-cindergeist-revenant',
    name: 'Cindergeist Revenant',
    description: 'The ghost of a flame that burned too hot and too long. It seeks fuel for a fire that already consumed everything.',
    level: 18,
    baseStats: enemyStatBudget(18, { heart: 3, mind: 2, body: 2 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'aggressive',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { heart: { attack: 2, defend: 2 } },
    loot: [none(35), drop('phoenix-tear', 25), drop('heart-draught', 25), drop('healing-potion', 15)],
    philosophicalAlignment: { epistemology: 0, outlook: 67, scope: 34 },
    skills: [skill('resonance-bleed')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.4 },
        requiredStances: ['heart'],
        roundsThreshold: 4,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('phoenix-tear')! },
            { ...getConsumableById('heart-draught')! },
            { ...getConsumableById('healing-potion')! },
        ],
        xpBonus: 45,
        alignmentDelta: { outlook: -2, scope: +2 },
        narrative: "The cindergeist's flames dim to embers, then to warmth. 'I have burned through my rage,' it whispers. 'Help me remember what I was before the fire.'",
        flagSet: 'befriended-cindergeist-revenant',
    },
    finalBlowLines: {
        brutal: 'The last flames gutter out, leaving only the memory of heat.',
        quiet: 'It fades like a candle in a still room, peacefully extinguished.',
        ironic: 'The ghost of fire burns itself out on the irony of its own need.',
    },
    pactLines: {
        quiet: 'The flame learns to warm instead of consume.',
        setDown: 'It banks its fires, keeping only the ember of hope.',
        heavy: 'You carry its warmth, and the responsibility not to let it burn cold.',
    },
    causeLines: {
        brutal: 'The fire it could not finish spreads into your veins.',
        broken: 'You understand the hunger of flames that have outlived their fuel.',
        quiet: 'The heat it carried becomes the fever that will not break.',
    },
    journalEntry: {
        id: 'codex-cindergeist-revenant',
        title: 'The Pyroclasm Elegies',
        body: 'When the Great Library burned, the scholars said the books screamed. The cindergeists are what remains of those screams - knowledge reduced to pure heat, seeking something worthy to illuminate.',
    },
    addedIn: 'phase-127',
    tags: ['mid-game', 'elite', 'enemy'],
});

export const ObsidianColossus = createEnemy({
    id: 'enemy-obsidian-colossus',
    name: 'Obsidian Colossus',
    description: 'A towering guardian carved from volcanic glass and ancient grief. Each movement cuts the air itself.',
    level: 22,
    baseStats: enemyStatBudget(22, { body: 4, heart: 2, mind: 1 }),
    mapName: 'northern-forest',
    difficulty: 'elite',
    logic: 'balanced',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: { body: { attack: 2, defend: 2 }, heart: { attack: 2, defend: 2 } },
    loot: [none(25), drop('iron-skin-draught', 35), drop('body-elixir', 25), drop('revive-crystal', 15)],
    philosophicalAlignment: { epistemology: -34, outlook: -67, scope: 67 },
    skills: [skill('straw-giant'), skill('achilles-gambit')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.3 },
        requiredStances: ['body', 'heart'],
        roundsThreshold: 6,
    },
    friendshipReward: {
        items: [
            { ...getConsumableById('iron-skin-draught')! },
            { ...getConsumableById('body-elixir')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 65,
        alignmentDelta: { outlook: +4, scope: -3 },
        narrative: "The colossus kneels, its obsidian surface reflecting your image fractured into countless selves. 'I have been a mirror for grief too long,' it rumbles. 'Show me how to reflect hope.'",
        flagSet: 'befriended-obsidian-colossus',
    },
    finalBlowLines: {
        brutal: 'The volcanic glass shatters, each shard cutting the light into dark spectra.',
        quiet: 'It settles into the earth like a mountain deciding to sleep.',
        ironic: 'The guardian meant to last forever cracks along the faults of its own making.',
    },
    pactLines: {
        quiet: 'The mirror of grief becomes a window into understanding.',
        setDown: 'It sets aside its weight of ancient sorrow for the lightness of new purpose.',
        heavy: 'You carry its reflection: the weight of being seen clearly.',
    },
    causeLines: {
        brutal: 'The obsidian cuts you into the shape of its ancient grief.',
        broken: 'You understand the weight of being carved from catastrophe.',
        quiet: 'The volcanic glass teaches you how sharpness and fragility are the same thing.',
    },
    journalEntry: {
        id: 'codex-obsidian-colossus',
        title: 'The Glass Mountain Fragments',
        body: 'From the Pyroclasts\' final work: "We shape the earth\'s grief into guardians, hoping they will remember what we could not - that destruction and creation drink from the same molten heart."',
    },
    addedIn: 'phase-127',
    tags: ['mid-game', 'elite', 'enemy'],
});

export const TheLichOfMissingSteps = createEnemy({
    id: 'enemy-the-lich-of-missing-steps',
    name: 'The Lich of Missing Steps',
    description: 'An undead philosopher-king who skipped crucial logical steps in the proof of its own eternal existence.',
    level: 26,
    baseStats: enemyStatBudget(26, { mind: 4, heart: 3, body: 1 }),
    mapName: 'northern-forest',
    difficulty: 'boss',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        mind: { attack: 3, defend: 3 },
        heart: { attack: 2, defend: 2 },
    },
    loot: [drop('philosopher-tea', 40), drop('void-essence', 30), drop('revive-crystal', 20), drop('resonance-crystal', 10)],
    philosophicalAlignment: { epistemology: 67, outlook: -34, scope: -67 },
    skills: [skill('bootstrap-paradox'), skill('eternal-regress'), skill('undistributed-middle')],
    befriendabilityConfig: {
        hpGate: { belowPct: 0.2 },
        requiredStances: ['mind', 'heart'],
        roundsThreshold: 7,
    },
    friendshipReward: {
        items: [
            dropItem('paradox-loop', 26, 'unique', () => 0.5),
            { ...getConsumableById('philosopher-tea')! },
            { ...getConsumableById('void-essence')! },
            { ...getConsumableById('revive-crystal')! },
        ],
        xpBonus: 95,
        alignmentDelta: { epistemology: -4, outlook: +3, scope: +5 },
        narrative: "The lich's hollow eyes flicker with something approaching warmth. 'I spent eternity searching for the missing steps,' it whispers. 'But you have shown me the answer was not in the proof, but in the question of who I was proving it to.'",
        flagSet: 'befriended-lich-of-missing-steps',
    },
    finalBlowLines: {
        brutal: 'The logical structure collapses, taking the lich\'s certainty with it.',
        quiet: 'It fades like a hypothesis that was elegant but wrong.',
        ironic: 'The proof of its existence fails at the moment it stops existing.',
    },
    pactLines: {
        quiet: 'The missing steps are filled with understanding instead of logic.',
        setDown: 'It abandons the proof for the more difficult work of living the question.',
        heavy: 'You carry its unfinished theorem: the weight of questions that matter more than their answers.',
    },
    causeLines: {
        brutal: 'The missing steps become gaps in your own understanding of life.',
        broken: 'You realize you cannot prove you exist to someone who has forgotten how to listen.',
        quiet: 'The lich\'s failed logic becomes the framework for your own unraveling.',
    },
    journalEntry: {
        id: 'codex-lich-of-missing-steps',
        title: 'Theorem of the Unproven Self',
        body: 'The Lich\'s final manuscript: "I have demonstrated my eternal existence in seventeen volumes. Yet I cannot remember why I wanted to prove it, or to whom. Perhaps the missing step was the very question of proof itself."',
    },
    addedIn: 'phase-127',
    tags: ['mid-game', 'boss', 'enemy'],
});

// ─── THE INCOMPLETENESS (2026-07-02) — the impossible playtest ceiling ────────

/**
 * The Incompleteness — level 55 unique, the deliberately UNWINNABLE ceiling the
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
    name: 'The Incompleteness',
    stanceHint: 'It cannot be read from inside any system you carry; every tell is consistent, and none is complete.',
    description: 'A proof that cannot be finished, walking. It is true, it cannot be shown, and every axiom sent to contain it becomes the next sentence it is true about.',
    level: 55,
    baseStats: { heart: 92, body: 91, mind: 92 }, // 275 = 5 × 55 (stat law)
    mapName: 'northern-forest',
    difficulty: 'unique',
    logic: 'boss',
    tier1Overrides: T1_DEFAULT,
    procUnlocks: {
        body: { attack: 3, defend: 3 },
        mind: { attack: 3, defend: 3 },
        heart: { attack: 3, defend: 3 },
    },
    // It drops nothing; the fight is the lesson.
    loot: [none(100)],
    philosophicalAlignment: { epistemology: 67, outlook: 0, scope: 67 },
    skills: [skill('bootstrap-paradox'), skill('eternal-regress'), skill('liars-echo')],
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
        body: 'Marginalia in an unsigned hand: "Within any house of axioms sound enough to live in, there is a true thing the house cannot prove. We built the house anyway. Something walks the halls now, and it is not wrong." — final page of the Consistency Ledgers, unfinished',
    },
    addedIn: '2026-07-02',
    tags: ['impossible', 'playtest-ceiling', 'late-game'],
});

// ─── Library indices ──────────────────────────────────────────────────────────

/** Spec 07 + Phase 114 + Phase 127 — all 30 production enemies, in difficulty order. */
export const EnemyLibrary = [
    // Simple
    TidepoolCrab, SeaMistWisp, LullabyMoth,
    // Normal
    Disatree_01, WetHound, MournfulGull, ForestSprite, HollowEyedBeggar, ArgumentativeCrow,
    ThornedSentinel, PackleaderWolf, WhisperingOak,
    BonewardSentinel, VoidwroughtConstruct, // Phase 127
    AuditSentinel, // Phase 121
    // Elite
    TideflukeReaver, HushWraith, HollowSaint,
    FrostboundHunter, MistwalkerShade, VerdantProtector,
    CindergeistRevenantElemental, ObsidianColossus, // Phase 127
    // Boss
    CoastalTyrant, TheDisagreement,
    NightmareStag, TheForestMind,
    TheLichOfMissingSteps, // Phase 127
    BalanceJudge, // Phase 121
    // Unique
    EchoOfPyrrhonia, EternalAutumn, ShadowOfTheFirst,
    // 2026-06-07 early-game
    SaltGnawRat, DriftwoodHusk, PettyCutpurse, BogWillStripling, ApprenticeHeretic,
    ThicketAmbusher, ReefBarnacleColony, WanderingSophist, TolltakerOfTheFord, TheMarketArbiter,
    // 2026-06-07 mid-game
    RimeclawProwler, GlassmindOracle, PenitentFlagellant, IronCovenanter, MireOfConsensus,
    ContrarianRevenant, TheTithewarden, ApostateAbbot, TheUnwriting, HarvestOfNames,
    // 2026-06-07 late-game
    FamineOfTheDeepWood, CathedralOfDoubt, WarrantOfTheVoid, TheSchismarch, GravewardKeeper,
    ProsecutorOfTheReal, TheLastConsensus, AxiomBreaker, PallbearerOfReason, TheTerminalProof,
    // 2026-07-02 impossible playtest ceiling — deliberately absent from EnemiesByMap.
    TheIncompleteness,
] as const;

/**
 * Per-map enemy pools used by the encounter generator.
 *
 * NOTE: `TheIncompleteness` is intentionally absent from every pool — it must
 * never appear in random map encounters (design requirement; it is reached
 * only through the authored `impossible` playtest stage).
 */
export const EnemiesByMap = {
    'fishing-village': [
        TidepoolCrab, SeaMistWisp,
        WetHound, MournfulGull, HollowEyedBeggar,
        TideflukeReaver,
        CoastalTyrant,
        // 2026-06-07 additions
        SaltGnawRat, DriftwoodHusk, PettyCutpurse, ApprenticeHeretic,
        ReefBarnacleColony, TolltakerOfTheFord, TheMarketArbiter, TheTithewarden,
    ],
    'northern-forest': [
        LullabyMoth,
        Disatree_01, ForestSprite, ArgumentativeCrow, ThornedSentinel, PackleaderWolf, WhisperingOak,
        AuditSentinel, // Phase 121
        HushWraith, HollowSaint, FrostboundHunter, MistwalkerShade, VerdantProtector,
        TheDisagreement, NightmareStag, TheForestMind,
        BalanceJudge, // Phase 121
        EchoOfPyrrhonia, EternalAutumn, ShadowOfTheFirst,
        // 2026-06-07 additions
        BogWillStripling, ThicketAmbusher, WanderingSophist,
        RimeclawProwler, GlassmindOracle, PenitentFlagellant, IronCovenanter, MireOfConsensus,
        ContrarianRevenant, ApostateAbbot, TheUnwriting, HarvestOfNames,
        FamineOfTheDeepWood, CathedralOfDoubt, WarrantOfTheVoid, TheSchismarch, GravewardKeeper,
        ProsecutorOfTheReal, TheLastConsensus, AxiomBreaker, PallbearerOfReason, TheTerminalProof,
        // Phase 127 — third enemy family (ancient-ruins theme)
        BonewardSentinel, VoidwroughtConstruct, CindergeistRevenantElemental, ObsidianColossus,
        TheLichOfMissingSteps,
    ],
} as const;

/**
 * Slug-keyed registry of enemy fixtures. Useful for hermetic tests or
 * debug entry points that want to look up an enemy by short name. Spec 07
 * keeps the `disatree` and `sandbag` aliases stable for back-compat.
 */
export const ENEMY_REGISTRY = {
    // Legacy aliases.
    disatree: Disatree_01,
    sandbag:  Sandbag_01,
    // Spec 07 additions.
    'tidepool-crab':       TidepoolCrab,
    'sea-mist-wisp':       SeaMistWisp,
    'lullaby-moth':        LullabyMoth,
    'wet-hound':           WetHound,
    'mournful-gull':       MournfulGull,
    'forest-sprite':       ForestSprite,
    'hollow-eyed-beggar':  HollowEyedBeggar,
    'argumentative-crow':  ArgumentativeCrow,
    'tidefluke-reaver':    TideflukeReaver,
    'hush-wraith':         HushWraith,
    'hollow-saint':        HollowSaint,
    'coastal-tyrant':      CoastalTyrant,
    'the-disagreement':    TheDisagreement,
    'echo-of-pyrrhonia':   EchoOfPyrrhonia,
    // Phase 114 additions.
    'thorned-sentinel':    ThornedSentinel,
    'packleader-wolf':     PackleaderWolf,
    'whispering-oak':      WhisperingOak,
    'frostbound-hunter':   FrostboundHunter,
    'mistwalker-shade':    MistwalkerShade,
    'verdant-protector':   VerdantProtector,
    'nightmare-stag':      NightmareStag,
    'the-forest-mind':     TheForestMind,
    'eternal-autumn':      EternalAutumn,
    'shadow-of-the-first': ShadowOfTheFirst,
    // Phase 121 balance audit anchors.
    'audit-sentinel':      AuditSentinel,
    'balance-judge':       BalanceJudge,
    // 2026-06-07 early-game additions.
    'salt-gnaw-rat':            SaltGnawRat,
    'driftwood-husk':           DriftwoodHusk,
    'petty-cutpurse':           PettyCutpurse,
    'bog-will-stripling':       BogWillStripling,
    'apprentice-heretic':       ApprenticeHeretic,
    'thicket-ambusher':         ThicketAmbusher,
    'reef-barnacle-colony':     ReefBarnacleColony,
    'wandering-sophist':        WanderingSophist,
    'tolltaker-of-the-ford':    TolltakerOfTheFord,
    'the-market-arbiter':       TheMarketArbiter,
    // 2026-06-07 mid-game additions.
    'rimeclaw-prowler':         RimeclawProwler,
    'glassmind-oracle':         GlassmindOracle,
    'penitent-flagellant':      PenitentFlagellant,
    'iron-covenanter':          IronCovenanter,
    'mire-of-consensus':        MireOfConsensus,
    'contrarian-revenant':      ContrarianRevenant,
    'the-tithewarden':          TheTithewarden,
    'apostate-abbot':           ApostateAbbot,
    'the-unwriting':            TheUnwriting,
    'harvest-of-names':         HarvestOfNames,
    // 2026-06-07 late-game additions.
    'famine-of-the-deep-wood':  FamineOfTheDeepWood,
    'cathedral-of-doubt':       CathedralOfDoubt,
    'warrant-of-the-void':      WarrantOfTheVoid,
    'the-schismarch':           TheSchismarch,
    'graveward-keeper':         GravewardKeeper,
    'prosecutor-of-the-real':   ProsecutorOfTheReal,
    'the-last-consensus':       TheLastConsensus,
    'axiom-breaker':            AxiomBreaker,
    'pallbearer-of-reason':     PallbearerOfReason,
    'the-terminal-proof':       TheTerminalProof,
    // Phase 127 ancient-ruins family.
    'boneward-sentinel':            BonewardSentinel,
    'voidwrought-construct':        VoidwroughtConstruct,
    'cindergeist-revenant':         CindergeistRevenantElemental,
    'obsidian-colossus':            ObsidianColossus,
    'the-lich-of-missing-steps':   TheLichOfMissingSteps,
    // 2026-07-02 — impossible playtest ceiling (never in EnemiesByMap pools).
    'the-incompleteness':           TheIncompleteness,
} as const;

export type EnemySlug = keyof typeof ENEMY_REGISTRY;

// Re-export the consumable library so test runners that import this file
// don't accidentally tree-shake the dependency.
void consumableLibrary;
