/**
 * MapEvent pool content for fishing-village + northern-forest (Spec 24).
 *
 * Each existing fv-N / nf-N node gets a single-entry pool override so
 * the new dispatcher reproduces (and extends) the authored events
 * `processNode` used to fire. Every `MapEventKind` value is covered
 * at least once across the two maps.
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
                    { itemId: 'philosopher-tea',      price: 35 },
                    { itemId: 'void-essence',         price: 40 },
                    { itemId: 'clarity-serum',        price: 28 },
                ],
            },
            description: 'A small forest market keeps trade alive on the path.',
        },
    }],
};

const nfCaveMouth: MapEventPool = {
    id: 'nf-10.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'A cave mouth yawns in the cliff face.',
                'Cold air spills out; something deeper is breathing.',
            ],
            description: 'The cave at the forest\'s edge.',
        },
        // Phase 43 — cosmic dread at the dark gate: Lovecraft / Cioran
        // territory (Agnostic-Pessimistic-Transcendent).
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

// Phase 53a — was authored `interaction`, naming an 'Ancient Stone Marker'
// that no roster will ever carry: it's scenery, not a person. Re-authored
// as `cutscene`; the original description survives as the first line.
const nfStoneMarker: MapEventPool = {
    id: 'nf-14.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'An old stone marker left by previous travelers. Carved runes mark the way forward.',
            ],
            description: 'An ancient stone marker beside the trail.',
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

const nfRangerCairn: MapEventPool = {
    id: 'nf-21.cutscene',
    entries: [{
        kind: 'cutscene', weight: 1,
        payload: {
            kind: 'cutscene',
            lines: [
                'A careful stack of stones marks this quiet spot.',
                'Someone is buried here — a ranger who never came home.'
            ],
            description: 'A memorial cairn for a lost ranger.',
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
// carries the only `village` and `cutscene` kinds (fishing-village authors the
// other kinds, including the new `narration` shell). Together the two maps cover
// every MapEventKind, preserving the all-kinds invariant.

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
// monotonous and unwinnable in playtests. The map now spreads 25 nodes across
// a real mix:
//   - 4 ENCOUNTER nodes  (3 regular + the fv-6 boss — the spine),
//   - 4 REST nodes       (recover HP — the rest-choice node), one on the
//                         spine just before the boss,
//   - 3 GATHERING nodes  (low-risk materials — "The Gleaning"),
//   - 2 HAZARD nodes     (light risk — the hazard minigame),
//   - 3 LOOT-CACHE nodes (a few coins the tide left behind),
//   - 3 NARRATION nodes  (Phase 53d/S-01 — fv-14 "What Do I Tell Father?",
//                         fv-16 "The Borrowed Hook", fv-4 "The Stranger's
//                         Net"; each a dialogue-backed branching dilemma),
//   - 4 INTERACTION nodes (Phase 53c — Old Marrow at fv-2, the Coastal
//                         Beggar at fv-7, Captain Blackwater at fv-18, the
//                         Fisherman's Daughter at fv-19),
//   - 1 QUEST node       (fv-15, the story hook),
//   - 1 CUTSCENE node    (fv-1, the arrival — see `fvArrival` below), and
//   - 1 BOSS node        (fv-6, the region climax — an encounter w/ isBoss).
// Encounter, interaction and rest now tie for the largest kind at 4 apiece —
// Phase 53d (S-01) spent two of the map's encounter surplus on dilemmas,
// which is what that surplus was for (see the spec's answered Open Question
// 1: displacing an `encounter` node is the only reassignment that doesn't
// grow the grid or merge two payloads onto one node). This block supersedes
// the legacy authored pools above (kept in source for reference). Foes stay
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
    // c3 — Phase 53c: little-belle moves off fv-7 (now Coastal Beggar's
    // node) onto fv-13, one of column 1's two displaced nodes. Must stay
    // ahead of the Beggar's column so `befriended-little-belle` can be set
    // before her flag-gated branch reads it (the forward-only gauntlet
    // law — see S-02 "the law a gauntlet imposes"). fv-12, its sibling,
    // takes fv-2's displaced loot-cache instead (see `FV_LOOT_NODES`) so
    // the map's guaranteed shilling income is unchanged — grave-larva,
    // fv-12's prior foe, is dropped (no flag or pricing dependency).
    'fv-13': { slug: 'little-belle',     description: 'A small orange vesper rings a bell for a service no one held.' },
    // c7 — the far side of the breakwater.
    'fv-21': { slug: 'foot-stealer',     description: 'A foot-stealer scuttles between the shacks, low and grasping.' },
    // c9 — the last thing between the player and the coast road.
    'fv-24': { slug: 'water-holger',     description: 'A drowned deckhand wades up the strand, still standing his watch.' },
    // Phase 53d (S-01) — fv-16 (c2, float-eye) and fv-4 (c3,
    // chattering-skull) are dropped from this table: both displaced by
    // "The Borrowed Hook" and "The Stranger's Net" (see the fv-16/fv-4
    // narration pools above). Neither foe carries a flag or pricing
    // dependency, so nothing else needs to know they left.
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
                        text: '"Pitch, cloth, nails, a plank—sound enough to trust the lake..." Father\'s voice trails off through the wall, tired in a way you don\'t like. At dinner he asks, too lightly, "So. This boat of yours. What will it take, exactly?"',
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

const fvBuildTheBoatQuest: MapEventPool = {
    id: 'fv-15.quest',
    entries: [{
        kind: 'quest', weight: 1,
        payload: {
            kind: 'quest',
            boardId: 'build-the-boat',
            description: 'The half-built hull waits on the strand; the village is counting on it.',
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
const FV_GATHER_NODES: Record<string, number> = { 'fv-5': 0, 'fv-8': 1, 'fv-22': 3 };
const FV_HAZARD_NODES: Record<string, string> = {
    'fv-10': 'You stumble through a thicket of jagged barnacles.',
    'fv-23': 'A gull-slick ledge crumbles underfoot above the rocks.',
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

const FISHING_VILLAGE_NEW_PLAYER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> =
    (() => {
        const out: Array<{ nodeId: string; pool: MapEventPool }> = [];
        for (let i = 1; i <= 25; i++) {
            const nodeId = `fv-${i}`;
            if (nodeId === 'fv-1') {
                out.push({ nodeId, pool: fvArrival });
            } else if (nodeId === 'fv-2') {
                out.push({ nodeId, pool: fvOldMarrowInteraction });
            } else if (nodeId === 'fv-6') {
                out.push({ nodeId, pool: fvGauntletBoss });
            } else if (nodeId === 'fv-7') {
                out.push({ nodeId, pool: fvCoastalBeggarInteraction });
            } else if (nodeId === 'fv-15') {
                out.push({ nodeId, pool: fvBuildTheBoatQuest });
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
            } else if (FV_REST_NODES[nodeId]) {
                out.push({ nodeId, pool: fvRestPool(nodeId, FV_REST_NODES[nodeId]!) });
            } else if (nodeId in FV_GATHER_NODES) {
                out.push({ nodeId, pool: fvGatheringPool(nodeId, FV_GATHER_MATERIALS[FV_GATHER_NODES[nodeId]!]!, 'You crouch to gather what the tide left behind.') });
            } else if (FV_HAZARD_NODES[nodeId]) {
                out.push({ nodeId, pool: fvHazardPool(nodeId, FV_HAZARD_NODES[nodeId]!) });
            } else if (nodeId in FV_LOOT_NODES) {
                out.push({ nodeId, pool: fvLootCachePool(nodeId, FV_LOOT_CACHES[FV_LOOT_NODES[nodeId]!]!) });
            } else {
                const foe = FV_ENCOUNTER_FOES[nodeId];
                if (!foe) throw new Error(`fishing-village: ${nodeId} has no authored event kind or foe.`);
                out.push({ nodeId, pool: fvEncounterPool(nodeId, foe) });
            }
        }
        return out;
    })();

// ─── single registration entry point ─────────────────────────────────────────
//
// Phase 161 — both maps register through one idempotent function so the
// content-parity guard (`getShadowedNodeOverrideKeys`) can replay registration
// against a freshly-cleared registry deterministically. fishing-village has
// exactly ONE block (the new-player override above); northern-forest is
// unshadowed. No node is authored twice.

/**
 * Registers every authored map-event pool + node override for the coastal
 * continent. Self-invoked on import for the package's side-effect contract;
 * also exported so hermetic tests can replay it after
 * `_clearMapEventPoolRegistry()`.
 */
export function registerMapEventContent(): void {
    for (const { nodeId, pool } of NORTHERN_FOREST_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'northern-forest', nodeId, pool.id);
    }
    for (const { nodeId, pool } of FISHING_VILLAGE_NEW_PLAYER_POOLS) {
        registerMapEventPool(pool);
        setNodeEventPoolOverride('coastal-continent', 'fishing-village', nodeId, pool.id);
    }
}

registerMapEventContent();
