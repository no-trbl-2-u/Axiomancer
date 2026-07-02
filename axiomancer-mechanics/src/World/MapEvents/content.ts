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
            healFraction: 1.0,
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
            enemySlug: 'forest-sprite',
            isBoss: false,
            description: 'A forest sprite flickers between the boughs.',
        },
    }],
};

const nfHermit: MapEventPool = {
    id: 'nf-7.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Forest Hermit',
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

const _nfCrow: MapEventPool = {
    id: 'nf-9.encounter',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'argumentative-crow',
            isBoss: false,
            description: 'An argumentative crow drops from a low branch.',
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
            healFraction: 0.75,
            description: 'A mossy clearing with a fallen log that serves as a natural bench.',
        },
        alignmentDelta: { scope: 1 },
    }],
};

const nfDenseThicket: MapEventPool = {
    id: 'nf-12.encounter',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'thorned-sentinel',
            isBoss: false,
            description: 'Dense thickets block the way; something large and thorned moves within.',
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

const nfStoneMarker: MapEventPool = {
    id: 'nf-14.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Ancient Stone Marker',
            description: 'An old stone marker left by previous travelers. Carved runes mark the way forward.',
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

const nfShadowWolfTerritory: MapEventPool = {
    id: 'nf-19.encounter',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'mistwalker-shade',
            isBoss: false,
            description: 'A shadowy form drifts between the mist-wreathed trees.',
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

const nfEchoStone: MapEventPool = {
    id: 'nf-23.interaction',
    entries: [{
        kind: 'interaction', weight: 1,
        payload: {
            kind: 'interaction',
            npcName: 'Echo Stone',
            description: 'A smooth stone formation that echoes back whispered words with perfect clarity.',
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
            healFraction: 1.0,
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
    { nodeId: 'nf-12', pool: nfDenseThicket     },
    { nodeId: 'nf-13', pool: nfBerryBushes      },
    { nodeId: 'nf-14', pool: nfStoneMarker      },
    { nodeId: 'nf-15', pool: nfBrambleTrap      },
    { nodeId: 'nf-16', pool: nfHuntersCache     },
    { nodeId: 'nf-17', pool: nfBoneCircle       },
    { nodeId: 'nf-18', pool: nfHerbTrader       },
    { nodeId: 'nf-19', pool: nfShadowWolfTerritory },
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
// a real mix, with encounters kept a slight plurality:
//   - 8 ENCOUNTER nodes  (7 regular + the fv-6 boss — the spine),
//   - 4 REST nodes       (recover HP — "The Night Watch"), one on the spine
//                         just before the boss,
//   - 4 GATHERING nodes  (low-risk materials — "The Gleaning"),
//   - 3 HAZARD nodes     (light risk — the hazard minigame),
//   - 3 LOOT-CACHE nodes (a few coins the tide left behind),
//   - 1 NARRATION node   (fv-14, the dialogue-backed monologue shell),
//   - 1 INTERACTION node (fv-19, a coastal NPC),
//   - 1 QUEST node       (fv-15, the story hook), and
//   - 1 BOSS node        (fv-6, the region climax — an encounter w/ isBoss).
// This block supersedes the legacy authored pools above (kept in source for
// reference). Foes stay on the gentlest L1–L2 roster; the boss is pinned to a
// low absolute level so a fresh player can actually win the climax (the shared
// coastal-tyrant is endgame-tier elsewhere, so we override the level here).

const FV_NEW_PLAYER_FOES: ReadonlyArray<{ slug: EnemySlug; description: string }> = [
    { slug: 'tidepool-crab',  description: 'A tidepool crab pincers up from the dock pilings.' },
    { slug: 'sea-mist-wisp',  description: 'A sea-mist wisp coils out of the fog.' },
    { slug: 'salt-gnaw-rat',  description: 'A salt-gnaw rat bares its teeth among the crates.' },
    { slug: 'driftwood-husk', description: 'A driftwood husk shudders upright on the strand.' },
    { slug: 'wet-hound',      description: 'A wet-hound bristles between the shacks.' },
    { slug: 'mournful-gull',  description: 'A mournful gull wheels down, shrieking.' },
];

function fvEncounterPool(nodeId: string, foe: { slug: EnemySlug; description: string }): MapEventPool {
    return {
        id: `${nodeId}.encounter`,
        entries: [{
            kind: 'encounter', weight: 1,
            payload: { kind: 'encounter', enemySlug: foe.slug, isBoss: false, description: foe.description },
        }],
    };
}

function fvRestPool(nodeId: string, description: string): MapEventPool {
    return {
        id: `${nodeId}.rest`,
        entries: [{ kind: 'rest', weight: 1, payload: { kind: 'rest', healFraction: 1.0, description } }],
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

// A narration node (the new dialogue-backed shell kind). Placeholder monologue
// — leaf DialogueNodes with no choices — that the dialogue runtime plays
// through. Content is a stub; this proves the wiring end to end.
const fvNarrationPlaceholder: MapEventPool = {
    id: 'fv-14.narration',
    entries: [{
        kind: 'narration', weight: 1,
        payload: {
            kind: 'narration',
            description: 'The salt-wind carries an old voice across the strand.',
            dialogue: {
                id: 'fv-strand-recollection',
                rootId: 'line-1',
                nodes: {
                    'line-1': {
                        id: 'line-1',
                        text: 'The tide has gone out, and the strand lies bare to the grey morning.',
                    },
                    'line-2': {
                        id: 'line-2',
                        text: 'Somewhere a gull cries, and you remember why you came so far north.',
                    },
                    'line-3': {
                        id: 'line-3',
                        text: 'The sea keeps its own counsel. You walk on.',
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

// The region boss — coastal-tyrant, but pinned to a low absolute level so a
// fresh player can win the climax (the shared enemy is endgame-tier elsewhere).
const FV_BOSS_LEVEL = 3;
const fvGauntletBoss: MapEventPool = {
    id: 'fv-6.encounter-boss',
    entries: [{
        kind: 'encounter', weight: 1,
        payload: {
            kind: 'encounter',
            enemySlug: 'coastal-tyrant',
            isBoss: true,
            level: FV_BOSS_LEVEL,
            description: 'The Coastal Tyrant rises from the breakwater.',
        },
    }],
};

// Per-node kind assignment. Rest sits at fv-3 (spine, before the fv-6 boss) so
// the player can heal before the climax; the rest of the kinds salt the map for
// variety. Every node fv-1..fv-25 is assigned exactly once; anything not named
// in these maps (and not the boss/quest/narration/interaction nodes below)
// falls through to a regular ENCOUNTER, keeping encounters a slight plurality.
const FV_REST_NODES: Record<string, string> = {
    'fv-3':  'A fisher’s lean-to, the embers still warm. You stop to bind your wounds.',
    'fv-9':  'A roofless cottage out of the wind. Enough shelter to catch your breath.',
    'fv-20': 'A dry hollow under an upturned hull. You rest a while.',
    'fv-25': 'A tide-pool grotto, still and warm. You let the quiet mend you.',
};
const FV_GATHER_NODES: Record<string, number> = { 'fv-5': 0, 'fv-8': 1, 'fv-13': 2, 'fv-22': 3 };
const FV_HAZARD_NODES: Record<string, string> = {
    'fv-10': 'You stumble through a thicket of jagged barnacles.',
    'fv-18': 'The boards give way over a reeking bilge; you scramble clear.',
    'fv-23': 'A gull-slick ledge crumbles underfoot above the rocks.',
};
const FV_LOOT_NODES: Record<string, number> = { 'fv-2': 0, 'fv-11': 1, 'fv-17': 2 };
// One coastal NPC for texture (the narration node fv-14 is wired separately).
const fvShoreInteraction = fvInteractionPool(
    'fv-19',
    'Weathered Fisher',
    'A weathered fisher mends a net on the quay and eyes you sidelong.',
);

const FISHING_VILLAGE_NEW_PLAYER_POOLS: ReadonlyArray<{ nodeId: string; pool: MapEventPool }> =
    (() => {
        const out: Array<{ nodeId: string; pool: MapEventPool }> = [];
        let foeIdx = 0;
        for (let i = 1; i <= 25; i++) {
            const nodeId = `fv-${i}`;
            if (nodeId === 'fv-6') {
                out.push({ nodeId, pool: fvGauntletBoss });
            } else if (nodeId === 'fv-15') {
                out.push({ nodeId, pool: fvBuildTheBoatQuest });
            } else if (nodeId === 'fv-14') {
                out.push({ nodeId, pool: fvNarrationPlaceholder });
            } else if (nodeId === 'fv-19') {
                out.push({ nodeId, pool: fvShoreInteraction });
            } else if (FV_REST_NODES[nodeId]) {
                out.push({ nodeId, pool: fvRestPool(nodeId, FV_REST_NODES[nodeId]!) });
            } else if (nodeId in FV_GATHER_NODES) {
                out.push({ nodeId, pool: fvGatheringPool(nodeId, FV_GATHER_MATERIALS[FV_GATHER_NODES[nodeId]!]!, 'You crouch to gather what the tide left behind.') });
            } else if (FV_HAZARD_NODES[nodeId]) {
                out.push({ nodeId, pool: fvHazardPool(nodeId, FV_HAZARD_NODES[nodeId]!) });
            } else if (nodeId in FV_LOOT_NODES) {
                out.push({ nodeId, pool: fvLootCachePool(nodeId, FV_LOOT_CACHES[FV_LOOT_NODES[nodeId]!]!) });
            } else {
                const foe = FV_NEW_PLAYER_FOES[foeIdx % FV_NEW_PLAYER_FOES.length]!;
                foeIdx++;
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
