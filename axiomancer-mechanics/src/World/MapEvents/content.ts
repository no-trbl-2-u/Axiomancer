/**
 * MapEvent pool content for fishing-village + northern-forest (Spec 24)
 * and, since 2026-08-28 (inter-map travel), the northern continent's maps
 * (caverns, northern-city, connecting-river, town-across-river, the-capital).
 *
 * Each authored node (fv-N / nf-N / nc-N / ncy-N / cr-N / tar-N / cap-N) gets a single-entry pool override
 * so the dispatcher reproduces (and extends) the authored events
 * `processNode` used to fire. Every `MapEventKind` value is covered
 * at least once across the shipped maps.
 *
 * This file side-effects on import: `src/World/index.ts` imports it
 * for that side effect, so consumers of the package get the pools
 * registered automatically when they touch the world barrel.
 */

import {
    registerMapEventPool,
    setNodeEventPoolOverride,
} from './resolve-map-event';
import type { MapEventPool } from './types';
import type { EnemySlug } from '../../Enemy/enemy.library';
import { BLACKSMITH_WITNESS_VARIANTS } from '../Blacksmith/blacksmith.content';

// ─── northern-forest pools ────────────────────────────────────────────────────

const nfCutscene: MapEventPool = {
    id: 'nf-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The forest opens before you in green hush.',
                'Distant birds; closer, the creak of unseen branches.',
            ],
            description: 'You step into the northern forest.',
        },
    }],
};

const nfWoodGather: MapEventPool = {
    id: 'nf-2.gathering',
    entries: [{
        kind: 'gathering', weight: 1,
        payload: {
            kind: 'gathering',
            items: [{
                id: 'oak-branch', name: 'Oak Branch',
                description: 'Sturdy, fresh-fallen.',
                category: 'material', quantity: 1,
            }],
            description: 'A windfall of oak branches.',
        },
    }],
};

const _nfThorns: MapEventPool = {
    id: 'nf-3.hazard',
    entries: [{
        kind: 'hazard', weight: 1,
        payload: {
            kind: 'hazard',
            effectIds: ['debuff_bleed'],
            damage: 1,
            description: 'A wall of thorn-brush. You bleed easing through.',
        },
    }],
};

const nfSpring: MapEventPool = {
    id: 'nf-4.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: {
            kind: 'rest',
            // Phase 52b — a cold spring in the woods is a CAMP. It was
            // authored at healFraction 1.0, which the retired heuristic read
            // as inn-grade; it mended hazard scars for free. It no longer does.
            shelter: 'camp',
            description: 'A clearing with a cold spring. You catch your breath.',
        },
        // Phase 43 — the spring's hush invites the larger picture:
        // transcendent scope, mild faith-leaning epistemology.
        alignmentDelta: { epistemology: -1, scope: 2 },
    }],
};

const _nfBuriedCache: MapEventPool = {
    id: 'nf-5.loot-cache',
    entries: [{
        kind: 'loot-cache', weight: 1,
        payload: {
            kind: 'loot-cache',
            currency: 15,
            description: 'A waxed pouch under a flat stone.',
        },
    }],
};

const nfSprite: MapEventPool = {
    id: 'nf-6.encounter',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'wichtlein',
            isBoss: false,
            description: 'A small red-hooded figure knocks three times on the roots.',
        },
    }],
};

const nfHermit: MapEventPool = {
    id: 'nf-7.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            // Phase 53a — was 'Forest Hermit', which names nobody on the
            // northern-forest roster (`hermitSage`'s NPC name is 'Hermit
            // Sage'). The hut and the sage were written by different hands;
            // same character, one node.
            npcName: 'Hermit Sage',
            description: 'A reed hut hides among the pines.',
        },
    }],
};

const nfForestMarket: MapEventPool = {
    id: 'nf-8.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'Glen Market',
            merchants: [{ name: 'Glen Marketeer', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 12 },
                    { itemId: 'clarity-serum',        price: 28 },
                    // Signet relics (owner call 2026-09-23 — a fresh run seeds
                    // no relics; the markets sell them). The first market on
                    // the road stocks the Phase-19 starter kit's weapon, armor
                    // and charm, so the intended opening loadout is buyable
                    // before the forest deepens. Ids resolve via `getRelicById`.
                    { itemId: 'relic-overwhelming',   price: 45 },
                    { itemId: 'relic-read',           price: 45 },
                    { itemId: 'relic-press-the-point', price: 35 },
                ],
            },
            description: 'A small forest market keeps trade alive on the path.',
        },
    }],
};

// 2026-08-28 — inter-map travel: the cave mouth IS the door. Formerly a
// cutscene describing a cave nobody could enter; the `get-to-cave` quest
// still completes on arrival (reach objectives tick before the pool roll),
// and resolving the node now walks the player onto the northern continent.
// The old cutscene's cold-air line survives as the door's prose.
const nfCaveMouth: MapEventPool = {
    id: 'nf-10.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'northern-continent',
            destinationMap: 'caverns',
            description: 'A cave mouth yawns in the cliff face. Cold air spills out. Something deeper is breathing. You go in anyway.',
        },
        // Phase 43 — cosmic dread at the dark gate: Lovecraft / Cioran
        // territory (Agnostic-Pessimistic-Transcendent). Carried over from
        // the cutscene this door replaced.
        alignmentDelta: { outlook: -2, scope: 3 },
    }],
};

// ─── Phase 115 — Story Content NPCs interaction pools ────────────────────────

const nfShrineKeeper: MapEventPool = {
    id: 'nf-3.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Shrine Keeper',
            description: 'The Shrine Keeper tends ancient carved stones among the forest growth.',
        },
        alignmentDelta: { epistemology: 1, scope: 1 },
    }],
};

const nfChronicler: MapEventPool = {
    id: 'nf-5.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Chronicler',
            description: 'The Chronicler sits surrounded by leather-bound tomes and parchments.',
        },
        alignmentDelta: { epistemology: 1 },
    }],
};

const nfWanderingPhilosopher: MapEventPool = {
    id: 'nf-9.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Wandering Philosopher',
            description: 'A contemplative figure in simple robes sits among the trees.',
        },
        alignmentDelta: { epistemology: 1, scope: 1 },
    }],
};

// ─── Phase 117 northern-forest expansion pools ────────────────────────────────
const nfMossyClearing: MapEventPool = {
    id: 'nf-11.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: {
            kind: 'rest',
            shelter: 'camp',
            description: 'A mossy clearing with a fallen log that serves as a natural bench.',
        },
        alignmentDelta: { scope: 1 },
    }],
};

// Phase 53d (S-01) — "The Crowning Witnessed", the third of S-01's four
// dilemmas. Displaces the `jeweled-tree` encounter that formerly held this
// node (dropped outright — no flag or pricing dependency, same call as
// fv-16/fv-4 in `content.ts`'s fishing-village block). Northern-forest is
// unreachable until inter-map travel exists, so this dilemma has no reader
// yet; it ships anyway per S-01's answered ruling — splitting the spec
// across two phases to chase reachability would leave it half-shipped
// indefinitely, and the four dilemmas are one authored set with one voice.
// Branch 3 carries the spec's one permitted `alignmentDelta`: "note the
// spot, mean to tell someone" names a worldview (`scope`), not a virtue —
// the same distinction fv-14's joke-deflection branch draws.
const nfCrowningWitnessedDialogue: MapEventPool = {
    id: 'nf-12.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'Through the trees, deeper in, a hushed ceremony is underway.',
            dialogue: {
                id: 'nf-crowning-witnessed',
                rootId: 'glimpse',
                nodes: {
                    glimpse: {
                        id: 'glimpse',
                        text: 'Robed figures kneel around a boy your own age. Something catches the light like a crown. You are not meant to see this.',
                        choices: [
                            {
                                text: 'Creep closer. Look.',
                                nextNodeId: 'witnessed',
                                effect: { setFlag: 'boy-witnessed-the-crowning' },
                            },
                            {
                                text: 'Look away. Keep resting. It is none of your business.',
                                nextNodeId: 'ignored',
                                effect: { setFlag: 'boy-ignored-the-crowning' },
                            },
                            {
                                text: 'Mark the spot. Leave. Mean to tell someone in the city.',
                                nextNodeId: 'marked',
                                effect: { setFlag: 'boy-marked-the-crowning', alignmentDelta: { scope: 1 } },
                            },
                        ],
                    },
                    witnessed: {
                        id: 'witnessed',
                        text: 'You see enough to know it was real. You see too little to know what it means. A twig snaps. You run before anyone turns.',
                    },
                    ignored: {
                        id: 'ignored',
                        text: 'The murmur of it fades behind you. You feel, oddly, like the correct kind of coward.',
                    },
                    marked: {
                        id: 'marked',
                        text: 'You fix the bend in the path in memory, already rehearsing how you will describe it.',
                    },
                },
            },
        },
    }],
};

const nfBerryBushes: MapEventPool = {
    id: 'nf-13.gathering',
    entries: [{
        kind: 'gathering', weight: 1,
        payload: {
            kind: 'gathering',
            items: [{
                id: 'dark-berries', name: 'Dark Berries',
                description: 'Plump and sweet, with a hint of bitterness.',
                category: 'material', quantity: 2,
            }],
            description: 'Berry bushes heavy with dark fruit. You gather what you can.',
        },
    }],
};

// adjust-npcs pass 1 (2026-09-05) — was `cutscene` scenery (Phase 53a
// re-authored it off an 'Ancient Stone Marker' naming nobody). The Lost
// Trader carried a full dialogue tree since Phase 117 and sat in
// `unstagedNpcs` with no node ever assigned. Staged here: the same trail
// marker, now the site of the ambush.
const nfStoneMarker: MapEventPool = {
    id: 'nf-14.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Lost Trader',
            description: "An old marker stone leans at the trail's edge. Runes worn shallow by rain. Beside it a cart lies overturned. Wheels up, goods scattered across the path. A trader picks through what the bandits left him.",
        },
    }],
};

const nfBrambleTrap: MapEventPool = {
    id: 'nf-15.hazard',
    entries: [{
        kind: 'hazard', weight: 1,
        payload: {
            kind: 'hazard',
            damage: 1,
            description: 'Hidden brambles catch at your feet and tear at exposed skin.',
        },
        alignmentDelta: { outlook: -1 },
    }],
};

const nfHuntersCache: MapEventPool = {
    id: 'nf-16.loot-cache',
    entries: [{
        kind: 'loot-cache', weight: 1,
        payload: {
            kind: 'loot-cache',
            currency: 10,
            description: 'An old hunter\'s cache buried beneath gnarled roots.',
        },
    }],
};

const nfBoneCircle: MapEventPool = {
    id: 'nf-17.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'Ancient bones are scattered in a perfect circle beneath the canopy.',
                'Time has bleached them white, but their arrangement speaks of purpose.',
                'Something old and final happened here.'
            ],
            description: 'A circle of ancient bones in the hollow.',
        },
        alignmentDelta: { epistemology: -2, scope: -1 },
    }],
};

const nfHerbTrader: MapEventPool = {
    id: 'nf-18.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'Hidden Camp',
            merchants: [{ name: 'Herb Trader', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 10 },
                    { itemId: 'antidote',             price: 15 },
                    { itemId: 'clarity-serum',        price: 25 },
                    // Signet relics — the two benched Phase-19 pieces.
                    { itemId: 'relic-conclusion',     price: 40 },
                    { itemId: 'relic-second-wind',    price: 40 },
                ],
            },
            description: 'A herb trader\'s carefully hidden camp among the mist-shrouded trees.',
        },
    }],
};

// Phase 53d (S-01) — "The Frightened Friend", the second of S-01's four
// dilemmas. Displaces the `hasshaku-sama` encounter that formerly held this
// node (dropped outright — `befriended-hasshaku-sama` and the enemy's other
// tests instantiate it directly, with no dependency on map placement). Same
// unreachable-until-inter-map-travel status as nf-12 above; ships now per
// S-01's ruling rather than half-shipping the set.
const nfFrightenedFriendDialogue: MapEventPool = {
    id: 'nf-19.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'A whimper carries from behind a fallen trunk, deeper in the forest.',
            dialogue: {
                id: 'nf-frightened-friend',
                rootId: 'find',
                nodes: {
                    find: {
                        id: 'find',
                        text: 'A boy your own age is wedged behind a deadfall, scared, not hurt. He chased a runaway goat too far off the path and lost his nerve to climb back down alone.',
                        choices: [
                            {
                                text: 'Climb up. Pull him down. Ask nothing.',
                                nextNodeId: 'helped',
                                effect: { setFlag: 'boy-helped-pell' },
                            },
                            {
                                text: 'Call down directions. Let him find his own way.',
                                nextNodeId: 'coached',
                                effect: { setFlag: 'boy-coached-pell' },
                            },
                            {
                                text: 'He is not your trouble. Keep walking.',
                                nextNodeId: 'left',
                                effect: { setFlag: 'boy-left-pell' },
                            },
                        ],
                    },
                    helped: {
                        id: 'helped',
                        text: 'He scrambles free, red-faced, and mutters a name — Pell — before running for his own village.',
                    },
                    coached: {
                        id: 'coached',
                        text: 'It takes longer, and colder, but Pell manages it alone in the end. He looks more relieved than resentful.',
                    },
                    left: {
                        id: 'left',
                        text: 'The whimper fades behind you. You tell yourself the goat finds its own way home. You mostly believe it.',
                    },
                },
            },
        },
    }],
};

const nfAxeHead: MapEventPool = {
    id: 'nf-20.loot-cache',
    entries: [{
        kind: 'loot-cache', weight: 1,
        payload: {
            kind: 'loot-cache',
            currency: 8,
            description: 'A woodcutter\'s forgotten axe head, still sharp beneath the rust.',
        },
    }],
};

// adjust-npcs pass 1 (2026-09-05) — was `cutscene` scenery (a cairn for an
// unnamed ranger). The Forest Ranger carried a full dialogue tree since
// Phase 117 — including the ONLY path to `startQuest('get-to-cave')`
// (Phase 8) — and sat in `unstagedNpcs` with no node ever assigned, which
// meant `get-to-cave` could never be started in live play. Staged here: the
// cairn becomes his, not a stranger's.
const nfRangerCairn: MapEventPool = {
    id: 'nf-21.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Forest Ranger',
            description: "A cairn of fitted stones marks the trail's edge. The Forest Ranger kneels beside it. One hand rests flat on the topmost stone. A colleague, lost to the same logging line he still watches.",
        },
        alignmentDelta: { outlook: -1, epistemology: 1 },
    }],
};

const nfMoonbellFlowers: MapEventPool = {
    id: 'nf-22.gathering',
    entries: [{
        kind: 'gathering', weight: 1,
        payload: {
            kind: 'gathering',
            items: [{
                id: 'moonbell-petals', name: 'Moonbell Petals',
                description: 'Silvery petals that glow with their own light.',
                category: 'material', quantity: 1,
            }],
            description: 'Rare moonbell flowers bloom in silver clusters, their petals glowing faintly.',
        },
    }],
};

// Phase 53a — was authored `interaction`, naming an 'Echo Stone' that no
// roster will ever carry: it's scenery, not a person. Re-authored as
// `cutscene`; the original description survives as the first line.
const nfEchoStone: MapEventPool = {
    id: 'nf-23.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'A smooth stone formation that echoes back whispered words with perfect clarity.',
            ],
            description: 'A stone formation that answers in your own voice.',
        },
        alignmentDelta: { epistemology: 1 },
    }],
};

const nfHiddenGrove: MapEventPool = {
    id: 'nf-24.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: {
            kind: 'rest',
            // Phase 52b — a natural spring is a CAMP, not a paid bed. Same
            // 1.0-authoring bug as `nf-4`.
            shelter: 'camp',
            description: 'A hidden grove surrounds a natural spring. The water runs clear and cold.',
        },
        alignmentDelta: { scope: 2 },
    }],
};

const nfMistPools: MapEventPool = {
    id: 'nf-25.hazard',
    entries: [{
        kind: 'hazard', weight: 1,
        payload: {
            kind: 'hazard',
            damage: 2,
            description: 'Thick pools of mist swirl and eddy, confusing your sense of direction.',
        },
        alignmentDelta: { epistemology: -1 },
    }],
};

// ─── register everything on module load ───────────────────────────────────────
//
// Phase 161 — fishing-village content has ONE source of truth: the new-player
// override block below. The legacy fishing-village pools (Phase 23/24/65/115
// era) were registered here first and then silently clobbered by that block
// (overrides are last-write-wins), so they could never fire even via the CLI.
// They were removed; the new-player block is the authored fishing-village map.
// northern-forest is unshadowed and remains the live source for its nodes — and
// carries the only `village` kind (fishing-village authors the other kinds,
// including `narration` and, since Phase 60, `blacksmith`). Together the two
// maps cover every MapEventKind, preserving the all-kinds invariant.

const NORTHERN_FOREST_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    // Existing pools (preserved)
    { nodeId: 'nf-1',  pool: nfCutscene     },
    { nodeId: 'nf-2',  pool: nfWoodGather   },
    { nodeId: 'nf-3',  pool: nfShrineKeeper },
    { nodeId: 'nf-4',  pool: nfSpring       },
    { nodeId: 'nf-5',  pool: nfChronicler   },
    { nodeId: 'nf-6',  pool: nfSprite       },
    { nodeId: 'nf-7',  pool: nfHermit       },
    { nodeId: 'nf-8',  pool: nfForestMarket },
    { nodeId: 'nf-9',  pool: nfWanderingPhilosopher },
    { nodeId: 'nf-10', pool: nfCaveMouth    },
    // Phase 117 expansion pools
    { nodeId: 'nf-11', pool: nfMossyClearing    },
    { nodeId: 'nf-12', pool: nfCrowningWitnessedDialogue },
    { nodeId: 'nf-13', pool: nfBerryBushes      },
    { nodeId: 'nf-14', pool: nfStoneMarker      },
    { nodeId: 'nf-15', pool: nfBrambleTrap      },
    { nodeId: 'nf-16', pool: nfHuntersCache     },
    { nodeId: 'nf-17', pool: nfBoneCircle       },
    { nodeId: 'nf-18', pool: nfHerbTrader       },
    { nodeId: 'nf-19', pool: nfFrightenedFriendDialogue },
    { nodeId: 'nf-20', pool: nfAxeHead          },
    { nodeId: 'nf-21', pool: nfRangerCairn      },
    { nodeId: 'nf-22', pool: nfMoonbellFlowers  },
    { nodeId: 'nf-23', pool: nfEchoStone        },
    { nodeId: 'nf-24', pool: nfHiddenGrove      },
    { nodeId: 'nf-25', pool: nfMistPools        },
];

// ─── New-player fishing-village override (2026-06, rebalanced for variety) ────
//
// The first continent's STARTING map is combat-FOCUSED but no longer "all
// battle" — a flat wall of identical encounters with no recovery was both
// monotonous and unwinnable in playtests. The map now spreads 28 nodes across
// a real mix:
//   - 7 ENCOUNTER nodes  (3 regular + the fv-6 boss + THE THREE GATES
//                         fv-26/27/28, 2026-09-21 — every route fights
//                         three times before the breakwater; fv-15
//                         rejoined this count in Phase 61, see below),
//   - 4 REST nodes       (recover HP — the rest-choice node), one on the
//                         spine just before the boss,
//   - 2 GATHERING nodes  (low-risk materials — "The Gleaning"; was 3 until
//                         adjust-npcs pass 12 staged the Village Healer
//                         onto fv-22, see below),
//   - 1 HAZARD node      (light risk — the hazard minigame; was 2 until
//                         2026-08-28 turned fv-10, the terminal barnacle
//                         hazard, into the coast-road DOOR — see TRAVEL),
//   - 3 LOOT-CACHE nodes (a few coins the tide left behind),
//   - 3 NARRATION nodes  (Phase 53d/S-01 — fv-14 "What Do I Tell Father?",
//                         fv-16 "The Borrowed Hook", fv-4 "The Stranger's
//                         Net"; each a dialogue-backed branching dilemma),
//   - 5 INTERACTION nodes (Phase 53c — Old Marrow at fv-2, the Coastal
//                         Beggar at fv-7, Captain Blackwater at fv-18, the
//                         Fisherman's Daughter at fv-19; adjust-npcs pass 12
//                         — the Village Healer at fv-22),
//   - 1 CUTSCENE node    (fv-1, the arrival — see `fvArrival` below),
//   - 1 BLACKSMITH node  (fv-21, Phase 60 — the re-homed anvil, post-boss
//                         and past every loot-cache reward so the visit is
//                         actually funded),
//   - 1 TRAVEL node      (fv-10, the coast-road door north, 2026-08-28), and
//   - 1 BOSS node        (fv-6, the region climax — an encounter w/ isBoss).
// Phase 61 retired the Quest Board minigame ("The Boy's Almanac") and with
// it fv-15's `quest` kind — no map carries that kind any more. fv-15
// rejoins the encounter roster instead (see `FV_ENCOUNTER_FOES`'s fv-15
// entry): the cleanest reversal of the very displacement Phase 53c/60
// documented (an authored non-encounter kind always came FROM an encounter
// slot; this is the first one going back). Interaction is now the map's
// single largest kind at 5, rest and encounter tied behind it at 4 — Phase
// 53d (S-01) spent two of the map's encounter surplus on dilemmas, Phase 60
// spent a third (fv-21) on the anvil, and adjust-npcs pass 12 spent a
// gathering slot (fv-22) on the Village Healer (see the spec's answered
// Open Question 1: displacing an `encounter` node is the only reassignment
// that doesn't grow the grid or merge two payloads onto one node — pass 12
// displaced a `gathering` node instead, for the same reason: no roster foe
// or flag/pricing dependency to orphan). This block supersedes the legacy
// authored pools above (kept in source for reference). Foes stay
// on the gentlest L1–L2 roster; the boss is pinned to a low absolute level
// so a fresh player can actually win the climax (the shared coastal-tyrant
// is endgame-tier elsewhere, so we override the level here).

// Foes, assigned per node and ordered ALONG THE MAP rather than by node id.
//
// Pre-2026-08-08 this was a bare list consumed by a `foeIdx++` fall-through in
// node-id order, so which foe a player met where was an accident of numbering:
// the gentlest enemy sat on the start node nobody could reach, and the ramp
// through the village ran backwards in places. The first-map audit made the
// assignment explicit and monotonic — column 1 is the softest thing in the
// village, column 9 the hardest thing short of the breakwater itself.
const FV_ENCOUNTER_FOES: Record<string, { slug: EnemySlug; description: string }> = {
    // THE THREE GATES (2026-09-21, the grey office rebalance) — one choke
    // before each open column, so every route to the breakwater fights
    // three times and carries three rewards into the King. Levels ramp
    // 1 / 1 / 2 through the pinned-slug path (`max(source.level, player)`).
    'fv-26': { slug: 'grave-larva',      description: 'Something pale turns over in the wet sand where the drowned are buried, and keeps turning.' },
    'fv-27': { slug: 'float-eye',        description: 'A lidless thing drifts over the salt flats at head height, and it has already seen you.' },
    'fv-28': { slug: 'chattering-skull', description: 'On the breakwater steps a skull talks to itself about the tide. It stops when you come near.' },
    // c3 — Phase 53c: little-belle moves off fv-7 (now Coastal Beggar's
    // node) onto fv-13, one of column 1's two displaced nodes. Must stay
    // ahead of the Beggar's column so `befriended-little-belle` can be set
    // before her flag-gated branch reads it (the forward-only gauntlet
    // law — see S-02 "the law a gauntlet imposes"). fv-12, its sibling,
    // takes fv-2's displaced loot-cache instead (see `FV_LOOT_NODES`) so
    // the map's guaranteed shilling income is unchanged — grave-larva,
    // fv-12's prior foe, is dropped (no flag or pricing dependency).
    'fv-13': { slug: 'little-belle',     description: 'A small orange vesper rings a bell for a service no one held.' },
    // c4 — Phase 61: fv-15 (formerly the quest-board node, retired) takes
    // foot-stealer back from fv-21 — its Phase 60 displacement left the
    // slug orphaned with no flag or pricing dependency, and level 3 (same
    // tier as fv-24's water-holger and the boss's own FV_BOSS_LEVEL) is
    // exactly the pre-boss weight this lane wants, one column ahead of the
    // breakwater.
    'fv-15': { slug: 'foot-stealer',     description: 'It collects footing. Yours is next on the list; balance, it maintains, is a possession like any other.' },
    // c9 — the last thing between the player and the coast road.
    'fv-24': { slug: 'water-holger',     description: 'A drowned deckhand wades up the strand, still standing his watch.' },
    // Phase 53d (S-01) — fv-16 (c2, float-eye) and fv-4 (c3,
    // chattering-skull) are dropped from this table: both displaced by
    // "The Borrowed Hook" and "The Stranger's Net" (see the fv-16/fv-4
    // narration pools above). Neither foe carries a flag or pricing
    // dependency, so nothing else needs to know they left.
};

// Phase 60 — the re-homed anvil (see `BlacksmithPayload`'s doc comment in
// `types.ts`). fv-21 sits post-boss (column 7 of 9, per `maps.ts`'s graph)
// with real content still ahead of it (fv-24's encounter, two more columns
// of texture) so an upgraded die gets used, and after every loot-cache /
// quest-reward node on the map so the "roughly a full act's income" anvil
// purchase (Phase 52f shilling calibration) is actually affordable by the
// time the player reaches it. A single fixed placement, not a cadence —
// mirrors the D6c precedent and the owner ruling recorded in `types.ts`.
const FV_BLACKSMITH_NODES: Record<string, string> = {
    'fv-21': 'A lean-to forge, coals still breathing. The smith looks up from the anvil and nods at your dice.',
};

function fvEncounterPool(nodeId: string, foe: { slug: EnemySlug; description: string }): MapEventPool {
    return {
        id: `${nodeId}.encounter`,
        entries: [{
            kind: 'encounter', weight: 1,
            payload: { kind: 'encounter', enemySlug: foe.slug, isBoss: false, description: foe.description },
        }],
    };
}

/**
 * Fishing-village rest nodes are the game's INNS (Phase 52b): tended,
 * paid shelter inside a settlement, and the only rests that mend
 * hazard-scarred max-VITAE.
 */
function fvRestPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.rest`,
        entries: [{ kind: 'rest', weight: 1, payload: { kind: 'rest', shelter: 'inn', description } }],
    };
}

const FV_GATHER_MATERIALS: ReadonlyArray<{ id: string; name: string; description: string }> = [
    { id: 'driftwood',  name: 'Driftwood',       description: 'Salt-bleached and brittle, but burns clean.' },
    { id: 'tide-shell', name: 'Tide Shell',      description: 'Spiral and chalk-pale; the inside still smells of salt.' },
    { id: 'salt-fish',  name: 'Salt-Fish Strip', description: 'Cured hard; chewy, salty, will keep for the road.' },
    { id: 'kelp-frond', name: 'Kelp Frond',      description: 'Rubbery and green-black; useful steeped or dried.' },
];
function fvGatheringPool(nodeId: string, mat: { id: string; name: string; description: string }, description: string): MapEventPool {
    return {
        id: `${nodeId}.gathering`,
        entries: [{
            kind: 'gathering', weight: 1,
            payload: {
                kind: 'gathering',
                items: [{ id: mat.id, name: mat.name, description: mat.description, category: 'material', quantity: 1 }],
                description,
            },
        }],
    };
}

function fvHazardPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.hazard`,
        entries: [{ kind: 'hazard', weight: 1, payload: { kind: 'hazard', damage: 2, description } }],
    };
}

// Low-risk coastal scavenging — a few coins the tide or a dead sailor left.
const FV_LOOT_CACHES: ReadonlyArray<{ currency: number; description: string }> = [
    { currency: 8,  description: 'A coin-purse snagged in the netting, its owner long gone.' },
    { currency: 12, description: 'A waterlogged strongbox wedged under the pilings.' },
    { currency: 6,  description: 'Loose coppers spill from a cracked jar in the rocks.' },
];
function fvLootCachePool(nodeId: string, cache: { currency: number; description: string }): MapEventPool {
    return {
        id: `${nodeId}.loot-cache`,
        entries: [{ kind: 'loot-cache', weight: 1, payload: { kind: 'loot-cache', currency: cache.currency, description: cache.description } }],
    };
}

// Phase 60 — the re-homed anvil. A single fixed placement (owner-ruled, not a
// cadence — mirrors the D6c precedent). Budget is a placeholder; the mobile
// interceptor re-derives the real spend cap from the player's wallet
// (`state/blacksmith/store-actions.ts`) the moment this event fires.
function fvBlacksmithPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.blacksmith`,
        entries: [{
            kind: 'blacksmith', weight: 1,
            payload: { kind: 'blacksmith', budget: 12, variants: BLACKSMITH_WITNESS_VARIANTS, description },
        }],
    };
}

function fvInteractionPool(nodeId: string, npcName: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.interaction`,
        entries: [{ kind: 'interaction', weight: 1, payload: { kind: 'interaction', npcName, description } }],
    };
}

// A narration node (the dialogue-backed shell kind). "What Do I Tell Father?"
// — the boy overhears Father counting coin for the boat, then faces a small
// but real dilemma at dinner: tell the truth about the cost, spare him the
// worry, or deflect with a joke. No choice is flagged "correct" by the
// engine; each sets a flag a future Northern Forest node can react to.
const fvFatherWorryDialogue: MapEventPool = {
    id: 'fv-14.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'Through the cottage wall, you hear Father counting coin under his breath.',
            dialogue: {
                id: 'fv-father-worry',
                rootId: 'overhear',
                nodes: {
                    overhear: {
                        id: 'overhear',
                        text: '"Pitch, cloth, nails, a plank—sound enough to trust the lake..." Father\'s voice trails off through the wall. He is tired in a way you do not like. At dinner he asks, too lightly, "So. This boat of yours. What will it take, exactly?"',
                        choices: [
                            {
                                text: 'Tell him everything — the whole plan, cost and all.',
                                nextNodeId: 'told-truth',
                                effect: { setFlag: 'boy-told-father-truth' },
                            },
                            {
                                text: '"Oh, not much. I\'ll manage most of it myself."',
                                nextNodeId: 'spared-worry',
                                effect: { setFlag: 'boy-spared-father-worry' },
                            },
                            {
                                text: '"A boat fit for a king, obviously." (grin)',
                                nextNodeId: 'deflected',
                                effect: { setFlag: 'boy-deflected-father', alignmentDelta: { outlook: 1 } },
                            },
                        ],
                    },
                    'told-truth': {
                        id: 'told-truth',
                        text: 'Father listens all the way through, jaw tight, then nods slowly. "Then we\'ll find it. All of it." He doesn\'t smile, but he doesn\'t look away either.',
                    },
                    'spared-worry': {
                        id: 'spared-worry',
                        text: 'His shoulders ease, just slightly — the lie has done its work. "Good lad," he says, and you hate a little how relieved he sounds.',
                    },
                    deflected: {
                        id: 'deflected',
                        text: 'He barks a laugh despite himself, shakes his head, and lets the question go. Whatever he was carrying, he carries it alone a while longer.',
                    },
                },
            },
        },
    }],
};

// ─── Phase 53d (S-01) — "The Borrowed Hook" and "The Stranger's Net" ─────────
//
// The other two of S-01's four dilemmas, authored to the same standard as
// fv-14 above and shipped in spec 34 §2's ratified register from the first
// draft (terse, present tense, one clause per line, no exclamation marks, no
// explanatory parentheticals, no thee/thou). Both displace a plain
// `encounter` node — the only kind either map carries a surplus of, per the
// spec's answered Open Question 1 — and both sit strictly ahead of the
// post-boss column (fv-18/fv-7/fv-19, column 6) that will read their flags
// once Phase 53e lands the read-back web. Flags only; no `moralDelta` on
// either — the meter stays concentrated in Old Marrow and the Coastal
// Beggar, where a legible verdict belongs (S-01's answered Open Question 2).
const fvBorrowedHookDialogue: MapEventPool = {
    id: 'fv-16.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'A brass hook glints half-buried in the tideline sand.',
            dialogue: {
                id: 'fv-borrowed-hook',
                rootId: 'find',
                nodes: {
                    find: {
                        id: 'find',
                        text: 'A brass hook lies half-buried in the sand. No footprint near it but your own. It is worth more than anything in your house.',
                        choices: [
                            {
                                text: 'Pocket it. No one will know.',
                                nextNodeId: 'kept',
                                effect: { setFlag: 'boy-kept-the-hook' },
                            },
                            {
                                text: 'Leave it exactly where it lies.',
                                nextNodeId: 'left',
                                effect: { setFlag: 'boy-left-the-hook' },
                            },
                            {
                                text: 'Carry it to Old Marrow. He will know whose it is.',
                                nextNodeId: 'reported',
                                effect: { setFlag: 'boy-reported-the-hook' },
                            },
                        ],
                    },
                    kept: {
                        id: 'kept',
                        text: 'The hook rides warm in your pocket the whole walk home. Every time you use it after, you check over your shoulder first.',
                    },
                    left: {
                        id: 'left',
                        text: 'You walk on. The sand closes over it behind you. Something in your chest sits a little straighter for the rest of the day.',
                    },
                    reported: {
                        id: 'reported',
                        text: 'Marrow turns the hook over in his hands, then nods once. He will ask along the docks. You leave with empty palms and a straighter back.',
                    },
                },
            },
        },
    }],
};

const fvStrangersNetDialogue: MapEventPool = {
    id: 'fv-4.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'A net has snagged on the rocks below the quay, someone else\'s catch still tangled in it.',
            dialogue: {
                id: 'fv-strangers-net',
                rootId: 'find',
                nodes: {
                    find: {
                        id: 'find',
                        text: 'A net has drifted loose and caught on the rocks. Fish still tangle in the mesh, silver and real. The owner is nowhere in sight.',
                        choices: [
                            {
                                text: 'Free the net. Carry it to whoever is missing it.',
                                nextNodeId: 'returned',
                                effect: { setFlag: 'boy-returned-the-net' },
                            },
                            {
                                text: 'Take a few fish. Leave the rest. Say nothing.',
                                nextNodeId: 'skimmed',
                                effect: { setFlag: 'boy-skimmed-the-net' },
                            },
                            {
                                text: 'Take the whole catch. Finders keepers.',
                                nextNodeId: 'took',
                                effect: { setFlag: 'boy-took-the-net' },
                            },
                        ],
                    },
                    returned: {
                        id: 'returned',
                        text: 'You ask along the quay until a hollow-cheeked woman from upriver claims it. She presses one fish back into your hands before you can refuse it.',
                    },
                    skimmed: {
                        id: 'skimmed',
                        text: 'Dinner is a little better that night. No one asks where it came from. You do not offer to say.',
                    },
                    took: {
                        id: 'took',
                        text: 'You eat well and nothing comes of it. Somewhere upriver a stranger returns to an empty net, and you do not think about that part for long.',
                    },
                },
            },
        },
    }],
};

// The map's opening beat, on the node the player starts standing on.
//
// Pre-2026-08-08 the start node fell through to a regular ENCOUNTER pool that
// no player ever saw: `createMapState` puts the player ON fv-1, and events
// only resolve on ARRIVAL at a node, so fv-1's authored content was dead. The
// first-map audit reclaimed the slot as the arrival cutscene — a kind that is
// safe to fire the moment the map opens, unlike a fight the player has had no
// chance to prepare for. Mobile resolves it on first mount of the exploration
// screen; the CLI's `--resolve-start` flag has always done the same.
const fvArrival: MapEventPool = {
    id: 'fv-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'Salt in the boards, salt in the bread, salt working its slow way into everything that stays.',
                'The village lies along the water the way a rope lies where it was dropped. Nobody here has hauled a full net since the breakwater went quiet.',
                // Phase 53c — the former closing line ("Three ways out of
                // the yard…") moved into Old Marrow's greeting at fv-2; a
                // man pointing at roads beats a narrator listing them.
                'Whichever way you go, the breakwater is at the end of it.',
            ],
            description: 'You step out of the hovel into the grey of it.',
        },
    }],
};

// The region boss — king-of-revenge, but pinned to a low absolute level so a
// fresh player can win the climax (the shared enemy is mid-tier elsewhere).
const FV_BOSS_LEVEL = 3;
const fvGauntletBoss: MapEventPool = {
    id: 'fv-6.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'king-of-revenge',
            isBoss: true,
            level: FV_BOSS_LEVEL,
            description: 'The King of Revenge rises from the breakwater.',
        },
    }],
};

// Per-node kind assignment. Rest sits at fv-3 (spine, before the fv-6 boss) so
// the player can heal before the climax; the rest of the kinds salt the map for
// variety. Every node fv-1..fv-25 is assigned exactly once; anything not named
// in these maps (and not the boss/quest/narration/interaction/arrival nodes)
// must carry an explicit entry in `FV_ENCOUNTER_FOES` above — an unassigned
// node now throws on import rather than silently drawing a rotation foe.
const FV_REST_NODES: Record<string, string> = {
    'fv-3':  'A fisher’s lean-to, the embers still warm. You stop to bind your wounds.',
    'fv-9':  'A roofless cottage out of the wind. Enough shelter to catch your breath.',
    'fv-20': 'A dry hollow under an upturned hull. You rest a while.',
    'fv-25': 'A tide-pool grotto, still and warm. You let the quiet mend you.',
};
// adjust-npcs pass 12 (2026-09-18) — fv-22 (kelp-frond, idx 3) is dropped
// from this table; see `fvVillageHealerInteraction` below.
const FV_GATHER_NODES: Record<string, number> = { 'fv-5': 0, 'fv-8': 1 };
// 2026-08-28 — fv-10, the spine's terminal "coast road out", was a hazard
// (jagged barnacles); it is now the map's DOOR. fv-23 keeps the map's one
// remaining hazard node.
const FV_HAZARD_NODES: Record<string, string> = {
    'fv-23': 'A gull-slick ledge crumbles underfoot above the rocks.',
};

// 2026-08-28 — inter-map travel. The door sits in the terminal column
// (column 9), four columns past the fv-6 breakwater boss, so it opens only
// after the King of Revenge is dealt with — the same beat where Old Marrow
// grants `get-to-forest`. Resolving it walks the player onto
// northern-forest, whose start node nf-1 completes the quest's reach
// objective on its own resolution.
const fvCoastRoadNorth: MapEventPool = {
    id: 'fv-10.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'coastal-continent',
            destinationMap: 'northern-forest',
            description: 'The coast road runs out of village to run out of. North, past the last shacks, the pines take it. You follow.',
        },
    }],
};
// Phase 53c — fv-2's loot cache (idx 0) moves to fv-12, one of the two
// nodes column 1 displaces, so the map's guaranteed shilling income
// (`card.removal.pricing.ts`'s calibration anchor) is unchanged.
const FV_LOOT_NODES: Record<string, number> = { 'fv-12': 0, 'fv-11': 1, 'fv-17': 2 };

// ─── Phase 53c (S-02) — the four homed coastal NPCs ───────────────────────────
//
// fv-2 (Old Marrow), fv-7 (Coastal Beggar), and fv-18 (Captain Blackwater)
// each displace a prior encounter/hazard node; fv-19 (Fisherman's Daughter)
// reclaims the one node that already carried an `interaction` payload — the
// 'Weathered Fisher' who named nobody in `fishingVillage.npcs` (Phase 53a's
// one accepted exception, now resolved).
const fvOldMarrowInteraction = fvInteractionPool(
    'fv-2',
    'Old Marrow',
    'A weather-worn dockmaster mends a net at the plank crossing.',
);
const fvCoastalBeggarInteraction = fvInteractionPool(
    'fv-7',
    'Coastal Beggar',
    'A haggard figure sits against the weathered wall, an empty bowl at their feet.',
);
const fvCaptainBlackwaterInteraction = fvInteractionPool(
    'fv-18',
    'Captain Blackwater',
    'A weathered captain checks a ledger against crates stacked on the wharf.',
);
const fvFishermansDaughterInteraction = fvInteractionPool(
    'fv-19',
    "Fisherman's Daughter",
    'A young woman mends nets on the quay, watching the water more than her hands.',
);

// adjust-npcs pass 12 (2026-09-18) — the Village Healer carried a full
// dialogue tree since Phase 128 and sat in `unstagedNpcs` waiting on the
// rest rebuild (phases 52c/52d, since shipped). Staged here rather than
// re-filed: fv-22 (a `gathering` node, kelp-frond) shares column 8 with
// fv-9, one of the map's four rest nodes ("A roofless cottage out of the
// wind") — the same waypoint cluster, without touching any rest node
// (pacing) or pinned-encounter node (would orphan an enemy — every regular
// `encounter` slot on this map carries a roster foe with no other reachable
// home; see `FV_ENCOUNTER_FOES`). No flag or pricing dependency reads
// fv-22's prior gathering payload.
const fvVillageHealerInteraction = fvInteractionPool(
    'fv-22',
    'Village Healer',
    'A canvas lean-to strung between two posts, herbs drying along the ridge line — the closest thing to a clinic this stretch of coast has.',
);

const FISHING_VILLAGE_NEW_PLAYER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> =
    (() => {
        const out: Array<{ nodeId: string; pool: MapEventPool }> = [];
        for (let i = 1; i <= 28; i++) {
            const nodeId = `fv-${i}`;
            if (nodeId === 'fv-1') {
                out.push({ nodeId, pool: fvArrival });
            } else if (nodeId === 'fv-2') {
                out.push({ nodeId, pool: fvOldMarrowInteraction });
            } else if (nodeId === 'fv-6') {
                out.push({ nodeId, pool: fvGauntletBoss });
            } else if (nodeId === 'fv-7') {
                out.push({ nodeId, pool: fvCoastalBeggarInteraction });
            } else if (nodeId === 'fv-14') {
                out.push({ nodeId, pool: fvFatherWorryDialogue });
            } else if (nodeId === 'fv-16') {
                out.push({ nodeId, pool: fvBorrowedHookDialogue });
            } else if (nodeId === 'fv-4') {
                out.push({ nodeId, pool: fvStrangersNetDialogue });
            } else if (nodeId === 'fv-18') {
                out.push({ nodeId, pool: fvCaptainBlackwaterInteraction });
            } else if (nodeId === 'fv-19') {
                out.push({ nodeId, pool: fvFishermansDaughterInteraction });
            } else if (nodeId === 'fv-22') {
                out.push({ nodeId, pool: fvVillageHealerInteraction });
            } else if (nodeId === 'fv-10') {
                out.push({ nodeId, pool: fvCoastRoadNorth });
            } else if (FV_REST_NODES[nodeId]) {
                out.push({ nodeId, pool: fvRestPool(nodeId, FV_REST_NODES[nodeId]!) });
            } else if (nodeId in FV_GATHER_NODES) {
                out.push({ nodeId, pool: fvGatheringPool(nodeId, FV_GATHER_MATERIALS[FV_GATHER_NODES[nodeId]!]!, 'You crouch to gather what the tide left behind.') });
            } else if (FV_HAZARD_NODES[nodeId]) {
                out.push({ nodeId, pool: fvHazardPool(nodeId, FV_HAZARD_NODES[nodeId]!) });
            } else if (nodeId in FV_LOOT_NODES) {
                out.push({ nodeId, pool: fvLootCachePool(nodeId, FV_LOOT_CACHES[FV_LOOT_NODES[nodeId]!]!) });
            } else if (FV_BLACKSMITH_NODES[nodeId]) {
                out.push({ nodeId, pool: fvBlacksmithPool(nodeId, FV_BLACKSMITH_NODES[nodeId]!) });
            } else {
                const foe = FV_ENCOUNTER_FOES[nodeId];
                if (!foe) throw new Error(`fishing-village: ${nodeId} has no authored event kind or foe.`);
                out.push({ nodeId, pool: fvEncounterPool(nodeId, foe) });
            }
        }
        return out;
    })();

// ─── The Breakwater (Act 1, map 1 — map revamp M3a) ──────────────────────────
//
// D29: Act 1 borrows the nearest shipped pools. The Breakwater is built from
// fishing-village's builders and roster above (its foes, inn rests,
// materials, hazard and loot caches); nothing here is a new enemy, NPC or
// event kind. Only the one-line descriptions are new, placed on the plate's
// landmarks (see `Continents/Coastal-Village/breakwater.ts` for the node map).
//
// Kind spread over 18 nodes: 6 encounter, 3 rest, 3 loot-cache,
// 3 gathering, 2 hazard, 1 travel. No boss: the watchtower (bw-17) is the
// last fight, fishing-village's water-holger, before the door. The foes ramp
// ring by ring in fishing-village's own order.

/** The windmill is where a new game starts (D27): placed, never arrived at. A CAMP, not an inn. */
const bwWindmillRest: MapEventPool = {
    id: 'bw-1.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: {
            kind: 'rest',
            shelter: 'camp',
            description: 'A windmill with its sails lashed down. The loft is dry. Nobody asks rent.',
        },
    }],
};

const BW_ENCOUNTER_FOES: Record<string, { slug: EnemySlug; description: string }> = {
    // c1 — the crane quay
    'bw-2':  { slug: 'grave-larva',      description: 'Something pale works loose from the mud under the cranes.' },
    // c2 — the sea fort, the north pier, the walled manor
    'bw-6':  { slug: 'float-eye',        description: 'A lidless thing hangs over the fort wall. It has already seen you.' },
    'bw-8':  { slug: 'chattering-skull', description: 'A skull on a mooring post talks about the tide. It stops when you come near.' },
    'bw-10': { slug: 'little-belle',     description: 'A small orange vesper rings a bell in the manor yard.' },
    // c4 — the lighthouse
    'bw-14': { slug: 'foot-stealer',     description: 'Something on the lighthouse stair collects footing. Yours is next.' },
    // c5 — the watchtower: the last fight before the bridge
    'bw-17': { slug: 'water-holger',     description: 'A drowned sentry stands the watchtower. He was never relieved.' },
};

const BW_REST_NODES: Record<string, string> = {
    'bw-9':  'The customs house lets rooms by the night. The clerk takes coin, not names.',
    'bw-13': 'An inn above the harbour. Warm, loud, and paid for in advance.',
};

/** Index into `FV_GATHER_MATERIALS`, and the line said on arrival. */
const BW_GATHER_NODES: Record<string, { mat: number; description: string }> = {
    'bw-4':  { mat: 0, description: 'Storm wrack piles at the foot of the pass. Some of it burns.' },
    'bw-11': { mat: 3, description: 'Kelp has taken the wreck. You cut what you can carry.' },
    'bw-16': { mat: 2, description: 'Split fish dry on the hamlet racks. Nobody is watching them.' },
};

const BW_HAZARD_NODES: Record<string, string> = {
    'bw-3':  'The gallows hill is loose shale. It gives under you.',
    'bw-12': 'The tide comes into the sea cave faster than you leave it.',
};

/** Index into `FV_LOOT_CACHES`. */
const BW_LOOT_NODES: Record<string, number> = { 'bw-5': 1, 'bw-7': 2, 'bw-15': 0 };

/**
 * The river bridge — the Breakwater's door. D27: while the Act 1 forest is
 * unbuilt, the last built Act 1 map's door leads into the shipped chain at
 * fishing-village. When the forest ships (M3b) this door is re-pointed there.
 */
const bwRiverBridge: MapEventPool = {
    id: 'bw-18.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'coastal-continent',
            destinationMap: 'fishing-village',
            description: 'The bridge has a toll-house and no keeper. Across it, the road runs down to a fishing village.',
        },
    }],
};

const BREAKWATER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> =
    (() => {
        const out: Array<{ nodeId: string; pool: MapEventPool }> = [];
        for (let i = 1; i <= 18; i++) {
            const nodeId = `bw-${i}`;
            if (nodeId === 'bw-1') {
                out.push({ nodeId, pool: bwWindmillRest });
            } else if (nodeId === 'bw-18') {
                out.push({ nodeId, pool: bwRiverBridge });
            } else if (BW_REST_NODES[nodeId]) {
                out.push({ nodeId, pool: fvRestPool(nodeId, BW_REST_NODES[nodeId]!) });
            } else if (BW_GATHER_NODES[nodeId]) {
                const g = BW_GATHER_NODES[nodeId]!;
                out.push({ nodeId, pool: fvGatheringPool(nodeId, FV_GATHER_MATERIALS[g.mat]!, g.description) });
            } else if (BW_HAZARD_NODES[nodeId]) {
                out.push({ nodeId, pool: fvHazardPool(nodeId, BW_HAZARD_NODES[nodeId]!) });
            } else if (nodeId in BW_LOOT_NODES) {
                out.push({ nodeId, pool: fvLootCachePool(nodeId, FV_LOOT_CACHES[BW_LOOT_NODES[nodeId]!]!) });
            } else {
                const foe = BW_ENCOUNTER_FOES[nodeId];
                if (!foe) throw new Error(`breakwater: ${nodeId} has no authored event kind or foe.`);
                out.push({ nodeId, pool: fvEncounterPool(nodeId, foe) });
            }
        }
        return out;
    })();

// ─── The caverns (northern continent, 2026-08-28 inter-map travel) ───────────
//
// First map past the nf-10 door. Kind spread, over 26 nodes (25 + the
// Phase W3 door): 8 encounter (7 wandering + the nc-25 Under-Gate boss),
// 3 gathering (the iron the map exists for — `gather-iron` collects it),
// 3 rest (all CAMPS: nothing down here is tended), 3 hazard, 3 loot-cache,
// 3 cutscene (arrival, the old delve, the sealed stair), 1 interaction
// (the Delver, quest-giver), 1 village (the Ledger Camp, the continent's
// first shop), and — Phase W3 — 1 travel (nc-26, the door up to the
// city, one column past the boss). Wandering
// encounters carry no pinned slug — `generateEncounter` draws from
// `EnemiesByMap['caverns']` (the harder forest-tier mix) and scales to the
// player via the adaptive bands; only the boss is pinned, and to a low
// absolute level (the fv-6 precedent) so the climax is winnable at arrival.

const ncArrival: MapEventPool = {
    id: 'nc-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The daylight gives up a few steps in. It does not argue.',
                'Iron in the air, iron in the water. Somewhere ahead, a hammer — or something imitating one.',
            ],
            description: 'The caverns take you in.',
        },
        // The dark under the world: the scope widens, the outlook does not.
        alignmentDelta: { outlook: -1, scope: 2 },
    }],
};

const ncDelver: MapEventPool = {
    id: 'nc-2.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Delver',
            description: 'A lamp on a crooked post. A woman sorts ore from stone beneath it.',
        },
    }],
};

function ncIronVeinPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.gathering`,
        entries: [{
            kind: 'gathering', weight: 1,
            payload: {
                kind: 'gathering',
                items: [{
                    id: 'iron-ore', name: 'Iron Ore',
                    description: 'Heavy, honest, worth carrying.',
                    category: 'material', quantity: 1,
                }],
                description,
            },
        }],
    };
}

function ncCampPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.rest`,
        entries: [{
            // A cavern camp is never an inn — nothing down here mends scars.
            kind: 'rest', weight: 1,
            payload: { kind: 'rest', shelter: 'camp', description },
        }],
    };
}

function ncHazardPool(nodeId: string, damage: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.hazard`,
        entries: [{
            kind: 'hazard', weight: 1,
            payload: { kind: 'hazard', damage, description },
        }],
    };
}

function ncLootPool(nodeId: string, currency: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.loot-cache`,
        entries: [{
            kind: 'loot-cache', weight: 1,
            payload: { kind: 'loot-cache', currency, description },
        }],
    };
}

function ncEncounterPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.encounter`,
        entries: [{
            kind: 'encounter', weight: 1,
            payload: { kind: 'encounter', isBoss: false, description },
        }],
    };
}

const ncLedgerCamp: MapEventPool = {
    id: 'nc-6.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'The Ledger Camp',
            merchants: [{ name: 'Camp Ledgerman', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 14 },
                    { itemId: 'antidote',             price: 16 },
                    { itemId: 'clarity-serum',        price: 30 },
                    // Signet relics — underground prices.
                    { itemId: 'relic-conviction-strike', price: 40 },
                    { itemId: 'relic-mounting-dread', price: 45 },
                    { itemId: 'relic-clever-gambit',  price: 40 },
                ],
            },
            description: 'Delvers trade around a shared lamp. Prices are underground prices.',
        },
    }],
};

const ncOldDelve: MapEventPool = {
    id: 'nc-24.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'An earlier delve ended here. The props gave. The tally-board did not.',
                'Nine names, chalked. Somebody crossed out eight and stopped.',
            ],
            description: 'The bones of an older delve.',
        },
        alignmentDelta: { outlook: -1, epistemology: 1 },
    }],
};

const ncSealedStair: MapEventPool = {
    id: 'nc-16.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            // The stair toward northern-city stays sealed scenery, not a
            // door: the real door is nc-26, one column past the Under-Gate
            // boss (Phase W3).
            lines: [
                'A stair climbs toward the city. Climbs, then stops: rockfall, packed tight, older than the tally-boards.',
                'Whoever opens it will do it from the other side, or through the gate below.',
            ],
            description: 'The sealed stair.',
        },
    }],
};

// The Under-Gate — rawhead-rex, the cellar-thing "up from under the stairs",
// pinned to a low absolute level (the shared enemy is L25 elsewhere) so the
// continent's first climax is winnable on arrival. Every route ends here.
const NC_BOSS_LEVEL = 6;
const ncUnderGateBoss: MapEventPool = {
    id: 'nc-25.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'rawhead-rex',
            isBoss: true,
            level: NC_BOSS_LEVEL,
            description: 'Something has kept this gate longer than the city above remembers. It stands up to keep it now.',
        },
    }],
};

// Phase W3 — the Under-Gate stands open. The DOOR to northern-city, one
// column past the boss (the fv-10 pattern: the exit opens only after the
// climax). The sealed stair at nc-16 stays sealed — its own prose said the
// way through was "the gate below", and this is the gate below.
const ncGateStandsOpen: MapEventPool = {
    id: 'nc-26.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'northern-continent',
            destinationMap: 'northern-city',
            description: 'Past the gate, a stair climbs toward lamplight and the sound of a city. You climb.',
        },
        // Out of the dark, upward: the outlook lifts, the world gets bigger.
        alignmentDelta: { outlook: 1, scope: 1 },
    }],
};

const CAVERNS_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    { nodeId: 'nc-1',  pool: ncArrival },
    { nodeId: 'nc-2',  pool: ncDelver },
    { nodeId: 'nc-3',  pool: ncEncounterPool('nc-3',  'Three knocks from inside the wall. The third is for you.') },
    { nodeId: 'nc-4',  pool: ncCampPool('nc-4',  'A delver\'s firepit, cold but sheltered. You rest where they rested.') },
    { nodeId: 'nc-5',  pool: ncEncounterPool('nc-5',  'The gallery narrows. Something in it has been waiting for the lamp.') },
    { nodeId: 'nc-6',  pool: ncLedgerCamp },
    { nodeId: 'nc-7',  pool: ncEncounterPool('nc-7',  'Bones in the rubble, arranged. The arranger is still here.') },
    { nodeId: 'nc-8',  pool: ncEncounterPool('nc-8',  'The last gallery before the gate. It is defended.') },
    { nodeId: 'nc-9',  pool: ncCampPool('nc-9',  'A hollow behind a fallen slab. The last quiet before the gate.') },
    { nodeId: 'nc-10', pool: ncIronVeinPool('nc-10', 'The seam runs high along the wall, dark and clean. You cut what you can carry.') },
    { nodeId: 'nc-11', pool: ncIronVeinPool('nc-11', 'The seam again, thicker. The pick-marks of earlier hands stop halfway.') },
    { nodeId: 'nc-12', pool: ncLootPool('nc-12', 14, 'A dead delver\'s satchel, wedged under slate. The coin kept better than the delver.') },
    { nodeId: 'nc-13', pool: ncEncounterPool('nc-13', 'The lamp catches eyes at the seam\'s edge. More than two.') },
    { nodeId: 'nc-14', pool: ncLootPool('nc-14', 11, 'A toll-box bolted to the rock, pried open long ago. Not emptied.') },
    { nodeId: 'nc-15', pool: ncEncounterPool('nc-15', 'The seam ends at a face of raw rock. Something is mining it from the other side.') },
    { nodeId: 'nc-16', pool: ncSealedStair },
    { nodeId: 'nc-17', pool: ncHazardPool('nc-17', 2, 'The air goes bad without announcing it. You climb out slower than you went in.') },
    { nodeId: 'nc-18', pool: ncEncounterPool('nc-18', 'The sump water moves against the current.') },
    { nodeId: 'nc-19', pool: ncIronVeinPool('nc-19', 'Ore in the sump wall, half-drowned. Cold work. It pays the same.') },
    { nodeId: 'nc-20', pool: ncHazardPool('nc-20', 3, 'The props above you decide, quietly, that they are done. Not all of the roof misses.') },
    { nodeId: 'nc-21', pool: ncCampPool('nc-21', 'A dry shelf above the waterline. You wring out what you can and breathe.') },
    { nodeId: 'nc-22', pool: ncHazardPool('nc-22', 2, 'The lamp gutters. For eleven steps the dark owns you. It takes its toll on the way through.') },
    { nodeId: 'nc-23', pool: ncLootPool('nc-23', 10, 'Coin scattered where a purse hit rock. Nobody came back down for it.') },
    { nodeId: 'nc-24', pool: ncOldDelve },
    { nodeId: 'nc-25', pool: ncUnderGateBoss },
    { nodeId: 'nc-26', pool: ncGateStandsOpen },
];

// ─── The northern city (Phase W3) ─────────────────────────────────────────────
//
// Map 2 of the northern continent, behind the Under-Gate. Kind spread,
// over 25 nodes — deliberately URBAN against the caverns' wilderness mix:
// 6 encounter (5 wandering city predators + the ncy-25 Harbormaster),
// 2 village (the Iron Market and the Chandlery — a city trades), 3 rest
// (all INNS: tended, paid, the continent's first scar-mending beds),
// 2 interaction (the Gate-Clerk and the Shipwright, both rostered),
// 1 narration (the advisor rumor — the campaign seam, spec 34 §7),
// 4 cutscene (arrival, the assize bell, the sealed river-gate, the
// drowned slip), 2 gathering (ship-timber and pitch — the build-boat
// materials), 2 hazard (a city hurts you with weight and tide, not
// thorns), and 3 loot-cache (city coin runs richer than cavern coin).
// Wandering encounters carry no pinned slug — `generateEncounter` draws
// from `EnemiesByMap['northern-city']` via the ncy- prefix; only the
// Harbormaster is pinned, low (the fv-6 precedent), so the climax is
// winnable on arrival.

const ncyArrival: MapEventPool = {
    id: 'ncy-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The stair ends in lamplight. The city starts before your eyes adjust.',
                'Stone streets, guild marks over every door, iron in every price.',
            ],
            description: 'The northern city takes you in.',
        },
        // Up out of the dark and into a working city: the world widens.
        alignmentDelta: { outlook: 1, scope: 1 },
    }],
};

const ncyGateClerk: MapEventPool = {
    id: 'ncy-2.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Gate-Clerk',
            description: 'A desk at the top of the stair. The pen is already moving.',
        },
    }],
};

const ncyShipwright: MapEventPool = {
    id: 'ncy-21.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Shipwright',
            description: 'Half a hull stands over the yard. A woman works under it, unhurried.',
        },
    }],
};

// The campaign seam (spec 34 §7, map.library.ts's own narrative note):
// the first rumor of the dead advisor and the King's search. Flags only —
// a later map's content reads them back, the S-01 pattern.
const ncyAdvisorRumor: MapEventPool = {
    id: 'ncy-5.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'Talk runs down the high street faster than the carts do.',
            dialogue: {
                id: 'ncy-advisor-rumor',
                rootId: 'overhear',
                nodes: {
                    overhear: {
                        id: 'overhear',
                        text: 'Two carters argue over one piece of news. The King\'s advisor is dead. The King wants another, and the provinces have been told to send their best.',
                        choices: [
                            {
                                text: 'Stop. Ask what a province sends.',
                                nextNodeId: 'asked',
                                effect: { setFlag: 'boy-chased-the-rumor', alignmentDelta: { scope: 1 } },
                            },
                            {
                                text: 'Note it, and keep walking.',
                                nextNodeId: 'noted',
                                effect: { setFlag: 'boy-noted-the-rumor' },
                            },
                            {
                                text: 'Kings bury their own. Not your street.',
                                nextNodeId: 'shrugged',
                                effect: { setFlag: 'boy-shrugged-the-rumor', alignmentDelta: { scope: -1 } },
                            },
                        ],
                    },
                    asked: {
                        id: 'asked',
                        text: '"Children," the older carter says. "Clever ones. They send children, and one comes back an advisor." He spits. "The rest come back."',
                    },
                    noted: {
                        id: 'noted',
                        text: 'You file it where you keep the things too big to use yet. The street moves on around you.',
                    },
                    shrugged: {
                        id: 'shrugged',
                        text: 'The argument fades behind you. It keeps its own pace after that, the way news does. It will find you again.',
                    },
                },
            },
        },
    }],
};

const ncyIronMarket: MapEventPool = {
    id: 'ncy-6.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'The Iron Market',
            merchants: [{ name: 'Iron Factor', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 12 },
                    { itemId: 'healing-potion',       price: 30 },
                    { itemId: 'antidote',             price: 14 },
                    { itemId: 'clarity-serum',        price: 26 },
                    // Signet relics — the iron trade stocks the weapon and armor.
                    { itemId: 'relic-conclusion',     price: 50 },
                    { itemId: 'relic-second-wind',    price: 50 },
                    { itemId: 'relic-endless-labor',  price: 45 },
                ],
            },
            description: 'Every stall weighs true. The scales are checked by men who are not kind about it.',
        },
    }],
};

const ncyChandlery: MapEventPool = {
    id: 'ncy-19.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'The Chandlery',
            merchants: [{ name: 'Harbor Chandler', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 11 },
                    { itemId: 'body-elixir',          price: 22 },
                    // Signet relics — a chandler's odd lots.
                    { itemId: 'relic-unbroken-stride', price: 45 },
                    { itemId: 'relic-overwhelming',   price: 50 },
                    { itemId: 'relic-read',           price: 50 },
                ],
            },
            description: 'Rope, tallow, salt, and remedies. Everything a crew buys the day before it regrets something.',
        },
    }],
};

/** City rests are INNS (Phase 52b): tended, paid, and scar-mending. */
function ncyInnPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.rest`,
        entries: [{
            kind: 'rest', weight: 1,
            payload: { kind: 'rest', shelter: 'inn', description },
        }],
    };
}

function ncyGatherPool(
    nodeId: string,
    item: { id: string; name: string; description: string },
    description: string,
): MapEventPool {
    return {
        id: `${nodeId}.gathering`,
        entries: [{
            kind: 'gathering', weight: 1,
            payload: {
                kind: 'gathering',
                items: [{ ...item, category: 'material', quantity: 1 }],
                description,
            },
        }],
    };
}

function ncyHazardPool(nodeId: string, damage: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.hazard`,
        entries: [{
            kind: 'hazard', weight: 1,
            payload: { kind: 'hazard', damage, description },
        }],
    };
}

function ncyLootPool(nodeId: string, currency: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.loot-cache`,
        entries: [{
            kind: 'loot-cache', weight: 1,
            payload: { kind: 'loot-cache', currency, description },
        }],
    };
}

function ncyEncounterPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.encounter`,
        entries: [{
            kind: 'encounter', weight: 1,
            payload: { kind: 'encounter', isBoss: false, description },
        }],
    };
}

// The assize bell — the city's one public instrument of judgement.
const ncyAssizeBell: MapEventPool = {
    id: 'ncy-15.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'A bell hangs over the assize yard, big as a boat\'s stern.',
                'It rings for verdicts. The rope is frayed from use.',
            ],
            description: 'The assize bell.',
        },
        alignmentDelta: { epistemology: 1, outlook: -1 },
    }],
};

// The sealed river-gate — the seam toward connecting-river (W4's door).
const ncySealedRiverGate: MapEventPool = {
    id: 'ncy-23.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            // The NEXT map, not shipped. Sealed scenery, the nc-16 pattern:
            // the map ends at its boss, not at a stub door.
            lines: [
                'A water-gate closes the river mouth, chained below the waterline.',
                'Boats queue on the far side and do not complain twice.',
            ],
            description: 'The sealed river-gate.',
        },
    }],
};

// The drowned slip — the hang-off vignette (the nc-24 pattern), and the
// build-boat seam made visible: this is where a boat could be built.
const ncyDrownedSlip: MapEventPool = {
    id: 'ncy-24.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'An old slipway runs into black water. The last launch left its rollers to rot.',
                'The angle is still true. It would take a hull tomorrow.',
            ],
            description: 'The drowned slip.',
        },
        alignmentDelta: { scope: 1 },
    }],
};

const NCY_BOSS_LEVEL = 9;
const ncyHarbormasterBoss: MapEventPool = {
    id: 'ncy-25.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'the-harbormaster',
            isBoss: true,
            level: NCY_BOSS_LEVEL,
            description: 'Nothing leaves this city by water unweighed. The one who does the weighing is waiting for you.',
        },
    }],
};

// Phase W4 — the water-gate stands open. The DOOR to connecting-river, one
// column past the boss (the nc-26/fv-10 pattern: the exit opens only after
// the climax). ncy-23 stays sealed — it was always scenery, not the exit.
const ncyWaterGateStandsOpen: MapEventPool = {
    id: 'ncy-26.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'northern-continent',
            destinationMap: 'connecting-river',
            description: 'Past the weighing-house, the harbor opens onto open water. A current takes you before you decide to follow it.',
        },
        // Out past the last wall, onto open water: the world widens again.
        alignmentDelta: { outlook: 1, scope: 1 },
    }],
};

const NORTHERN_CITY_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    { nodeId: 'ncy-1',  pool: ncyArrival },
    { nodeId: 'ncy-2',  pool: ncyGateClerk },
    { nodeId: 'ncy-3',  pool: ncyEncounterPool('ncy-3',  'The high street narrows between guild halls. Someone is collecting a toll nobody posted.') },
    { nodeId: 'ncy-4',  pool: ncyInnPool('ncy-4',  'The Scales, an inn. The beds are honest and so is the bill.') },
    { nodeId: 'ncy-5',  pool: ncyAdvisorRumor },
    { nodeId: 'ncy-6',  pool: ncyIronMarket },
    { nodeId: 'ncy-7',  pool: ncyEncounterPool('ncy-7',  'A doorway watches you pass. Then it stops being a doorway.') },
    { nodeId: 'ncy-8',  pool: ncyEncounterPool('ncy-8',  'The last street before the harbor gate. Somebody is paid to mind it.') },
    { nodeId: 'ncy-9',  pool: ncyInnPool('ncy-9',  'The Ferry Bell, an inn at the harbor gate. Quiet, close, and used to last nights.') },
    { nodeId: 'ncy-10', pool: ncyGatherPool('ncy-10',
        { id: 'ship-timber', name: 'Ship Timber', description: 'Straight-grained and seasoned. A hull is mostly promises like this.' },
        'The timber yard stacks its seconds by the wall. You take what the tally will not miss.') },
    { nodeId: 'ncy-11', pool: ncyHazardPool('ncy-11', 2, 'A crane swings its load short. The wall takes most of it. You take the rest.') },
    { nodeId: 'ncy-12', pool: ncyLootPool('ncy-12', 16, 'A rent-box behind a loose rampart stone. The collector stopped collecting.') },
    { nodeId: 'ncy-13', pool: ncyLootPool('ncy-13', 12, 'A watchman\'s purse, dropped where the wall walk turns. Nobody reported the loss.') },
    { nodeId: 'ncy-14', pool: ncyEncounterPool('ncy-14', 'Wings on the rampart, too heavy for a gull. It has hung its larder on the hooks.') },
    { nodeId: 'ncy-15', pool: ncyAssizeBell },
    { nodeId: 'ncy-16', pool: ncyInnPool('ncy-16', 'The Long Watch, an inn built into the wall itself. The garrison drinks somewhere cheaper.') },
    { nodeId: 'ncy-17', pool: ncyLootPool('ncy-17', 14, 'A skiff swings at its painter, half-swamped. The lockbox under the thwart kept dry.') },
    { nodeId: 'ncy-18', pool: ncyGatherPool('ncy-18',
        { id: 'caulkers-pitch', name: 'Caulker\'s Pitch', description: 'Black, patient, and watertight. Boats are arguments pitch settles.' },
        'The ropewalk boils pitch at its far end. The drippings cool where you can pry them loose.') },
    { nodeId: 'ncy-19', pool: ncyChandlery },
    { nodeId: 'ncy-20', pool: ncyHazardPool('ncy-20', 3, 'The quay stones are green below the tide line. The harbor lets you find that out yourself.') },
    { nodeId: 'ncy-21', pool: ncyShipwright },
    { nodeId: 'ncy-22', pool: ncyEncounterPool('ncy-22', 'Between two warehouses, out of the lamplight, something prices your coat.') },
    { nodeId: 'ncy-23', pool: ncySealedRiverGate },
    { nodeId: 'ncy-24', pool: ncyDrownedSlip },
    { nodeId: 'ncy-25', pool: ncyHarbormasterBoss },
    { nodeId: 'ncy-26', pool: ncyWaterGateStandsOpen },
];

// ─── The connecting river (Phase W4) ──────────────────────────────────────────
//
// Map 3 of the northern continent, behind the water-gate. Wild again after
// the city: 13 nodes — 3 encounter, 1 rest (camp), 1 gathering, 1 hazard,
// 1 loot-cache, 1 interaction (The Boatwoman), 1 village (The Landing), 1
// narration (the river court — the advisor-selection ritual's first half),
// 1 cutscene (arrival), 1 encounter-boss (the Waterreeve), 1 travel (the
// door to town-across-river). Wandering encounters carry no pinned slug —
// `generateEncounter` draws from `EnemiesByMap['connecting-river']` via the
// cr- prefix; only the Waterreeve is pinned, low (the fv-6/ncy-25
// precedent), so the climax is winnable on arrival.

const crArrival: MapEventPool = {
    id: 'cr-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The current takes the boat before the bank lets go of it.',
                'The river has its own idea of a road. It does not ask where you meant to go.',
            ],
            description: 'Downriver.',
        },
        alignmentDelta: { scope: 1 },
    }],
};

const crBoatwoman: MapEventPool = {
    id: 'cr-2.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Boatwoman',
            description: 'A flat-bottomed boat rides low against the bank, tied to a post retied more than replaced.',
        },
    }],
};

function crEncounterPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.encounter`,
        entries: [{
            kind: 'encounter', weight: 1,
            payload: { kind: 'encounter', isBoss: false, description },
        }],
    };
}

function crCampPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.rest`,
        entries: [{
            kind: 'rest', weight: 1,
            payload: { kind: 'rest', shelter: 'camp', description },
        }],
    };
}

function crGatherPool(
    nodeId: string,
    item: { id: string; name: string; description: string },
    description: string,
): MapEventPool {
    return {
        id: `${nodeId}.gathering`,
        entries: [{
            kind: 'gathering', weight: 1,
            payload: {
                kind: 'gathering',
                items: [{ ...item, category: 'material', quantity: 1 }],
                description,
            },
        }],
    };
}

function crHazardPool(nodeId: string, damage: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.hazard`,
        entries: [{
            kind: 'hazard', weight: 1,
            payload: { kind: 'hazard', damage, description },
        }],
    };
}

function crLootPool(nodeId: string, currency: number, description: string): MapEventPool {
    return {
        id: `${nodeId}.loot-cache`,
        entries: [{
            kind: 'loot-cache', weight: 1,
            payload: { kind: 'loot-cache', currency, description },
        }],
    };
}

// The river court — the advisor-selection ritual's first half. Reads back
// the S-01 "crowning ceremony" flags (northern-forest) and the ncy-5
// "advisor rumor" flags (northern-city) for reactive branches — both were
// planted as connective tissue for exactly this payoff (spec 34 §7's S-01
// pattern). Grants `join-islanders-for-ritual` on watching it through.
const crRiverCourt: MapEventPool = {
    id: 'cr-9.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'The reeds open onto a wide, shallow pool ringed with unlit lantern-poles.',
            dialogue: {
                id: 'cr-river-court',
                rootId: 'overhear',
                nodes: {
                    overhear: {
                        id: 'overhear',
                        text: 'Islanders sit in a rough circle around a raised plank stage. A boy about your own age stands on it, alone. An old woman in a fish-bone circlet reads him like a ledger line that won\'t balance.',
                        choices: [
                            {
                                text: 'You\'ve stood where he\'s standing. In the forest, under different trees.',
                                nextNodeId: 'recognized_witnessed',
                                requires: { flag: 'boy-witnessed-the-crowning' },
                            },
                            {
                                text: 'This is what the carters meant. The provinces send children.',
                                nextNodeId: 'recognized_rumor',
                                requires: { flag: 'boy-chased-the-rumor' },
                            },
                            {
                                text: 'Watch.',
                                nextNodeId: 'watched',
                                effect: { startQuest: 'join-islanders-for-ritual', setFlag: 'boy-witnessed-the-river-ritual' },
                            },
                            {
                                text: 'Walk on. This isn\'t yours to watch.',
                                nextNodeId: undefined,
                                effect: { alignmentDelta: { scope: -1 } },
                            },
                        ],
                    },
                    recognized_witnessed: {
                        id: 'recognized_witnessed',
                        text: 'The old woman weighs him. The northern forest weighed the other boy the same way. You saw him, and didn\'t stay.',
                        choices: [{
                            text: 'Watch.',
                            nextNodeId: 'watched',
                            effect: { startQuest: 'join-islanders-for-ritual', setFlag: 'boy-witnessed-the-river-ritual' },
                        }],
                    },
                    recognized_rumor: {
                        id: 'recognized_rumor',
                        text: 'The carters said children, and one comes back an advisor. This is where the sending starts.',
                        choices: [{
                            text: 'Watch.',
                            nextNodeId: 'watched',
                            effect: { startQuest: 'join-islanders-for-ritual', setFlag: 'boy-witnessed-the-river-ritual' },
                        }],
                    },
                    watched: {
                        id: 'watched',
                        text: 'The old woman ties a fish-bone circlet around the boy\'s wrist. "Carried, not chosen," she says, to the crowd, to the river, to no one. "He goes to the capital in the spring boat. If he comes back, he comes back different. If he doesn\'t, the tally still balances — we send another next year."',
                    },
                },
            },
        },
    }],
};

const crTheLanding: MapEventPool = {
    id: 'cr-10.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'The Landing',
            merchants: [{ name: 'Islander Trader', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'minor-healing-potion', price: 11 },
                    { itemId: 'healing-potion',       price: 28 },
                    { itemId: 'antidote',             price: 13 },
                    { itemId: 'body-elixir',          price: 20 },
                    // Signet relics — what the islanders trade off passing crews.
                    { itemId: 'relic-press-the-point', price: 40 },
                    { itemId: 'relic-mounting-dread', price: 45 },
                    { itemId: 'relic-clever-gambit',  price: 40 },
                ],
            },
            description: 'A trading post on stilts, built to outlast the flood line. The islanders sell what the river won\'t take back.',
        },
    }],
};

const CR_BOSS_LEVEL = 10;
const crWaterreeveBoss: MapEventPool = {
    id: 'cr-12.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'the-waterreeve',
            isBoss: true,
            level: CR_BOSS_LEVEL,
            description: 'The crossing has a keeper, and the keeper has a ledger. Nothing crosses unweighed.',
        },
    }],
};

// The water-gate stands open. The DOOR to town-across-river, one column
// past the boss (the nc-26/ncy-26 pattern).
const crWaterGateStandsOpen: MapEventPool = {
    id: 'cr-13.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'northern-continent',
            destinationMap: 'town-across-river',
            description: 'Past the reeve\'s post, the river opens onto the far bank. A town waits where the current slows.',
        },
        alignmentDelta: { outlook: 1, scope: 1 },
    }],
};

const CONNECTING_RIVER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    { nodeId: 'cr-1',  pool: crArrival },
    { nodeId: 'cr-2',  pool: crBoatwoman },
    { nodeId: 'cr-3',  pool: crEncounterPool('cr-3', 'Something surfaces just long enough to count you, then doesn\'t.') },
    { nodeId: 'cr-4',  pool: crCampPool('cr-4', 'A dry spit of gravel above the waterline. Driftwood enough for a fire that won\'t be seen from the water.') },
    { nodeId: 'cr-5',  pool: crGatherPool('cr-5',
        { id: 'river-reed', name: 'River Reed', description: 'Green and springy, cut at the waterline. Weavers pay for the good kind.' },
        'The reeds grow thick where the current slows. You cut what bundles easily.') },
    { nodeId: 'cr-6',  pool: crHazardPool('cr-6', 3, 'The current takes an opinion about your footing. It wins.') },
    { nodeId: 'cr-7',  pool: crLootPool('cr-7', 15, 'A capsized skiff, gear still lashed in. Whoever owned it isn\'t diving for it now.') },
    { nodeId: 'cr-8',  pool: crEncounterPool('cr-8', 'The reeds part wrong, in a shape that isn\'t wind.') },
    { nodeId: 'cr-9',  pool: crRiverCourt },
    { nodeId: 'cr-10', pool: crTheLanding },
    { nodeId: 'cr-11', pool: crEncounterPool('cr-11', 'The bank narrows. Something has been waiting for it to.') },
    { nodeId: 'cr-12', pool: crWaterreeveBoss },
    { nodeId: 'cr-13', pool: crWaterGateStandsOpen },
];

// ─── Town across the river (Phase W4) ─────────────────────────────────────────
//
// Map 4 of the northern continent — the coda (`map.library.ts`: "Home of
// sweetheart"). Deliberately small: 6 nodes — 1 cutscene (arrival), 1
// interaction (The Sweetheart), 1 rest (inn — a proper town, tended beds),
// 1 narration (the village court — the ritual's second half), 1 encounter,
// 1 encounter-boss (the Portreeve). No door onward yet.

const tarArrival: MapEventPool = {
    id: 'tar-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The far bank rises into a town smaller than the city, kinder than the caverns.',
                'Woodsmoke over rooftops. Somewhere in it, a fire that used to be yours.',
            ],
            description: 'The town across the river.',
        },
        alignmentDelta: { outlook: 1 },
    }],
};

const tarSweetheart: MapEventPool = {
    id: 'tar-2.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Sweetheart',
            description: 'She\'s at the well before you\'ve decided how to say her name.',
        },
    }],
};

const tarMillersRest: MapEventPool = {
    id: 'tar-3.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: { kind: 'rest', shelter: 'inn', description: 'The Miller\'s Rest, a room above the flour store. Paid, and warm.' },
    }],
};

// The village court — the advisor-selection ritual's second half. Reads
// back the flag `cr-9` planted (`boy-witnessed-the-river-ritual`) for a
// continuity callback: the same rite, closer to home.
const tarVillageCourt: MapEventPool = {
    id: 'tar-4.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'The green stands full for once. Her mother has combed her hair flat, formal, wrong on her.',
            dialogue: {
                id: 'tar-village-court',
                rootId: 'gathered',
                nodes: {
                    gathered: {
                        id: 'gathered',
                        text: 'An elder reads a ribbon-color instead of a fish-bone circlet, but the shape is the same rite you watched downriver. She is standing where that boy stood.',
                        choices: [
                            {
                                text: 'You know exactly what this is.',
                                nextNodeId: 'recognized',
                                requires: { flag: 'boy-witnessed-the-river-ritual' },
                            },
                            {
                                text: 'Watch.',
                                nextNodeId: 'watched',
                                effect: { setFlag: 'sweetheart-was-nominated' },
                            },
                            {
                                text: 'Look away.',
                                nextNodeId: undefined,
                                effect: { alignmentDelta: { outlook: -1 } },
                            },
                        ],
                    },
                    recognized: {
                        id: 'recognized',
                        text: 'You know exactly what this is, and exactly how it ends for the one it names.',
                        choices: [{
                            text: 'Watch.',
                            nextNodeId: 'watched',
                            effect: { setFlag: 'sweetheart-was-nominated' },
                        }],
                    },
                    watched: {
                        id: 'watched',
                        text: 'The elder ties the ribbon at her wrist. She finds you in the crowd before she finds her mother. Whatever this costs her, she pays it looking at you.',
                    },
                },
            },
        },
    }],
};

const TAR_BOSS_LEVEL = 12;
const tarPortreeveBoss: MapEventPool = {
    id: 'tar-6.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'the-portreeve',
            isBoss: true,
            level: TAR_BOSS_LEVEL,
            description: 'The town\'s chief officer rules on every dispute it has. Yours is next.',
        },
    }],
};

// The ribbon-road stands open (Phase W5). The DOOR to the-capital, one
// column past the boss (the nc-26/ncy-26/cr-13 pattern).
const tarRibbonRoadOpen: MapEventPool = {
    id: 'tar-7.travel',
    entries: [{
        kind: 'travel', weight: 1,
        payload: {
            kind: 'travel',
            destinationContinent: 'northern-continent',
            destinationMap: 'the-capital',
            description: 'Past the Portreeve\'s desk, the ribbon-road runs straight to the capital. Every nominee walks it eventually.',
        },
        alignmentDelta: { outlook: 1, scope: 1 },
    }],
};

const TOWN_ACROSS_RIVER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    { nodeId: 'tar-1', pool: tarArrival },
    { nodeId: 'tar-2', pool: tarSweetheart },
    { nodeId: 'tar-3', pool: tarMillersRest },
    { nodeId: 'tar-4', pool: tarVillageCourt },
    { nodeId: 'tar-5', pool: crEncounterPool('tar-5', 'A dog that isn\'t anyone\'s barks at you like it remembers a different face.') },
    { nodeId: 'tar-6', pool: tarPortreeveBoss },
    { nodeId: 'tar-7', pool: tarRibbonRoadOpen },
];

// ─── the capital pools (Phase W5) ──────────────────────────────────────────────
//
// Map 5 of the northern continent — where the ribbon-roads converge. See
// `Continents/Northern-Continent/maps.ts` for the map's own header comment
// (the full narrative rationale). Every `MapEventKind` this map uses was
// already shipped elsewhere; no new kind is introduced.

const capArrival: MapEventPool = {
    id: 'cap-1.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'The ribbon-road ends at a wall tall enough to lose the sky behind.',
                'Every gate in the north has a line. This one has the longest.',
            ],
            description: 'The capital.',
        },
        alignmentDelta: { scope: 1 },
    }],
};

const capHerald: MapEventPool = {
    id: 'cap-2.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Herald',
            description: 'She checks ribbons against a ledger before she checks faces at all.',
        },
    }],
};

const capPetitionLine: MapEventPool = {
    id: 'cap-3.hazard',
    entries: [{
        kind: 'hazard', weight: 1,
        payload: {
            kind: 'hazard',
            damage: 4,
            description: 'The petition line does not move and does not forgive being pushed. An elbow finds a rib — not necessarily yours.',
        },
    }],
};

const capWaitingRoom: MapEventPool = {
    id: 'cap-4.rest',
    entries: [{
        kind: 'rest', weight: 1,
        payload: { kind: 'rest', shelter: 'inn', description: 'The Waiting Room, paid by the hour. Petitioners sleep here the way they queue — in shifts.' },
    }],
};

// adjust-npcs pass 5 (2026-09-10) — The Capital staged only one NPC
// (The Herald); cap-5's own gathering flavor ("Refused petitions pile up
// against the wall") is the natural home for The Ribbon-Picker, who sorts
// exactly that pile. A second weighted entry, not a new node: the
// gathering payload keeps its weight-3 majority (still the node's
// `getNodePrimaryEventKind`/icon), her interaction surfaces on the
// remaining weight-1 draw — an occasional voice, not a guaranteed one,
// matching her role as a minor color NPC rather than a second singleton.
const capRibbonScraps: MapEventPool = {
    id: 'cap-5.gathering',
    entries: [{
        kind: 'gathering', weight: 3,
        payload: {
            kind: 'gathering',
            items: [{
                id: 'frayed-ribbon', name: 'Frayed Ribbon', description: 'Cut from a petition the gate refused. The color still means something to somebody.',
                category: 'material', quantity: 1,
            }],
            description: 'Refused petitions pile up against the wall, ribbons still tied to the corners.',
        },
    }, {
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'The Ribbon-Picker',
            description: 'A woman sorts the discarded ribbons from the same pile, unhurried.',
        },
    }],
};

const capMarket: MapEventPool = {
    id: 'cap-6.village',
    entries: [{
        kind: 'village', weight: 1,
        payload: {
            kind: 'village',
            villageName: 'The Petitioners\' Row',
            merchants: [{ name: 'Capital Provisioner', isShopkeeper: true }],
            shop: {
                wares: [
                    { itemId: 'greater-healing-potion', price: 45 },
                    { itemId: 'supreme-healing-potion',  price: 80 },
                    { itemId: 'phoenix-tear',             price: 65 },
                ],
            },
            description: 'Everything the provinces don\'t stock, priced for people with nothing left to lose but coin.',
        },
    }],
};

const capDroppedPurse: MapEventPool = {
    id: 'cap-7.loot-cache',
    entries: [{
        kind: 'loot-cache', weight: 1,
        payload: {
            kind: 'loot-cache',
            currency: 22,
            description: 'A purse, dropped and not missed — or missed and not worth the line to reclaim.',
        },
    }],
};

// The court convenes — the advisor-selection ritual's third and final
// payoff. Reads back tar-4's `sweetheart-was-nominated` flag (the closest,
// most personal callback) for a reactive branch; both threads converge on
// the same dais either way.
const capCourtConvenes: MapEventPool = {
    id: 'cap-8.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'The court hall swallows the line whole. A dais, a bell, and a Factor with a ledger heavier than every ribbon-road that fed it.',
            dialogue: {
                id: 'cap-court-convenes',
                rootId: 'gathered',
                nodes: {
                    gathered: {
                        id: 'gathered',
                        text: 'The bell rings once. The Factor reads ribbons, not faces. The river-court\'s old woman read a boy the same way. A ledger line. It has to balance by the hour\'s end.',
                        choices: [
                            {
                                text: 'Find her in the line.',
                                nextNodeId: 'found_her',
                                requires: { flag: 'sweetheart-was-nominated' },
                                effect: { setFlag: 'capital-selection-witnessed' },
                            },
                            {
                                text: 'Watch the proceedings.',
                                nextNodeId: 'watched_anyway',
                                effect: { setFlag: 'capital-selection-witnessed' },
                            },
                        ],
                    },
                    found_her: {
                        id: 'found_her',
                        text: 'She stands where the boy stood, downriver. Where she stood at her own green, too. The same rite. Worn smoother each time. The Factor doesn\'t call her name. He calls her color, and marks the ledger.',
                    },
                    watched_anyway: {
                        id: 'watched_anyway',
                        text: 'Ribbon by ribbon, the Factor clears the line. Nobody argues with the ledger. Nobody has yet.',
                    },
                },
            },
        },
    }],
};

// The Factor's ledger closes the map. Already met as a northern-city
// debt-broker (`EnemiesByMap['northern-city']`); reused here at an elevated
// level — the capital is where his office was always going to end up.
const CAP_BOSS_LEVEL = 22;
const capTheFactorBoss: MapEventPool = {
    id: 'cap-9.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'the-factor',
            isBoss: true,
            level: CAP_BOSS_LEVEL,
            description: 'He buys positions, not fights. Yours is the last one on today\'s ledger.',
        },
    }],
};

const THE_CAPITAL_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> = [
    { nodeId: 'cap-1', pool: capArrival },
    { nodeId: 'cap-2', pool: capHerald },
    { nodeId: 'cap-3', pool: capPetitionLine },
    { nodeId: 'cap-4', pool: capWaitingRoom },
    { nodeId: 'cap-5', pool: capRibbonScraps },
    { nodeId: 'cap-6', pool: capMarket },
    { nodeId: 'cap-7', pool: capDroppedPurse },
    { nodeId: 'cap-8', pool: capCourtConvenes },
    { nodeId: 'cap-9', pool: capTheFactorBoss },
];

// ─── single registration entry point ─────────────────────────────────────────
//
// Phase 161 — both maps register through one idempotent function so the
// content-parity guard (`getShadowedNodeOverrideKeys`) can replay registration
// against a freshly-cleared registry deterministically. fishing-village has
// exactly ONE block (the new-player override above); northern-forest is
// unshadowed. No node is authored twice.

/**
 * Registers every authored map-event pool + node override for the coastal
 * and northern continents. Self-invoked on import for the package's side-effect contract;
 * also exported so hermetic tests can replay it after
 * `_clearMapEventPoolRegistry()`.
 */
export function registerMapEventContent(): void {
    for (const { nodeId, pool } of NORTHERN_FOREST_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'northern-forest', nodeId, pool.id);
    }
    for (const { nodeId, pool } of BREAKWATER_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'breakwater', nodeId, pool.id);
    }
    for (const { nodeId, pool } of FISHING_VILLAGE_NEW_PLAYER_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'fishing-village', nodeId, pool.id);
    }
    for (const { nodeId, pool } of CAVERNS_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('northern-continent', 'caverns', nodeId, pool.id);
    }
    for (const { nodeId, pool } of NORTHERN_CITY_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('northern-continent', 'northern-city', nodeId, pool.id);
    }
    for (const { nodeId, pool } of CONNECTING_RIVER_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('northern-continent', 'connecting-river', nodeId, pool.id);
    }
    for (const { nodeId, pool } of TOWN_ACROSS_RIVER_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('northern-continent', 'town-across-river', nodeId, pool.id);
    }
    for (const { nodeId, pool } of THE_CAPITAL_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('northern-continent', 'the-capital', nodeId, pool.id);
    }
}

registerMapEventContent();
