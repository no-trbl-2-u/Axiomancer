/**
 * Game reducer — pure top-level dispatch (Spec 09).
 *
 * `gameReducer(state, action)` is the single dispatch spine. Every store
 * action goes through here; the store layer wraps it with side effects
 * (autosave, event emission). The reducer itself is pure — it returns a
 * fresh `GameState` and never touches disk or any module-level mutable.
 *
 * Save / load are intentionally NO-OPS at the reducer level: persistence is a
 * side effect owned by `createGameStore`. The reducer only describes what the
 * state would become; the store decides what to do with it.
 */

import { GameState } from './types';
import { GameAction } from './actions.types';
import { Character } from '../Character/types';
import { Encounter, QuestLog } from '../World/types';
import { Enemy } from '../Enemy/types';
import {
    useConsumable as useConsumableItem,
} from '../Items/item.reducer';
import { useConsumableEffect } from '../Items/equipment.engine';
import { isConsumable } from '../Items/types';
import { lookupEffect } from '../Effects/effects.library';
import {
    equipItem as equipItemReducer,
    unequipItem as unequipItemReducer,
    wornMaxHpBonus,
} from '../Character/equipment.reducer';
import { createCharacter, allocateStatPoint } from '../Character';
import {
    grantFirstNodeRelic, isFirstNodeRelicPending,
} from '../Character/first-node-grant';
import { learnCard } from '../Cards';
import { createStartingWorld, emptyQuestLog } from '../World';
import { moveToNode as moveWorld } from '../World/world.reducer';
import { resolveMapEvent } from '../World';
import { applyDialogueChoice as applyDialogueRuntime } from '../World/dialogue.runtime';
import { killObjectives, progressQuest, findQuest } from '../World/quest.engine';
import { calculateMaxHealth } from '../Utils';
import { EXPERIENCE_PER_LEVEL, STAT_POINTS_PER_LEVEL } from './game-mechanics.constants';
import { addItemStacking, rollEncounterLoot, totalEncounterXp } from './combat-grants';
import { getRng } from '../Utils/rng';
import { applyAlignmentDelta, defaultAlignment } from '../Ledger';
import { generateRunId } from './run-loop';

/**
 * Increment when GameState's shape changes. Save loaders branch on this so
 * old saves can be migrated rather than corrupted.
 *
 * Phase 72 — bumped 5 → 6 to add the required `runId: string` field.
 * Phase 73 — bumped 6 → 7 to add the required `codex: CodexState` slice.
 * `migrateV6toV7` defaults the slice to `{ unlockedEntries: [] }` for
 * legacy v6 saves.
 * Phase 109 — bumped 8 → 9 to add the required `regionConsequences: RegionConsequences` slice.
 * Phase 110 — bumped 9 → 10 to add the required `factionReputations: FactionReputations` slice.
 * knownSkills→knownCards rename — bumped 10 → 11 to rename the persisted `player.knownSkills` field to `knownCards`.
 * Phase 18 — bumped 11 → 12: `player.equipment` moves from the 7-slot record to
 *   the 5-slot `EquipmentLoadout`; worn gear re-slots deterministically and
 *   accessory/body overflow returns to inventory (see `game.migrate.ts`).
 * Phase 19 — bumped 12 → 13: seed the 8 signet relics onto the player (default 5
 *   worn, displaced gear + other 3 relics to inventory) so loaded saves derive a
 *   full signature kit from the worn loadout instead of the retired archetype
 *   kit; recompute maxHealth (see `game.migrate.ts`).
 * Phase 21 — bumped 13 → 14: the procedural equipment library is retired, so
 *   purge every non-relic `Equipment` from the loadout + inventory (relics are
 *   the only equipment that survives); backfill any stripped loadout slot with
 *   the default relic (see `game.migrate.ts`).
 * Phase D5 (spec 33 §6) — bumped 14 → 15: backfill the DIE-GEAR RAIL
 *   (`player.dieGear`) with the concrete default 4-color loadout so upgrades
 *   write to a real per-save object and never mutate the frozen
 *   `DEFAULT_DIE_GEAR` (see `game.migrate.ts`).
 * Phase 52a — bumped 15 → 16: the deck-removal primitive adds the per-run
 *   counter `player.cardRemovals` (the escalating removal price reads it).
 *   The migration materialises it to 0 on older saves (see `game.migrate.ts`);
 *   the field stays sparse-optional on fresh characters, and `cardRemovalsOf`
 *   is the seam that reads both shapes as 0.
 * Phase 52e — bumped 16 → 17: retired the rest minigame ("The Night
 *   Watch"). Drops the dead `night-watch-tutorial-done` flag and clears
 *   any live rest-minigame session riding along in `flags` / the raw
 *   payload's `rest` key (a mobile-only slice, not a `GameState` field —
 *   the old `RestSession` shape is gone, so a stale one must not survive
 *   into the rest-choice screen's presenter). `night-keepsake:*` flags
 *   are untouched — `/memoir`'s REMAINS section still reads them back
 *   (see `game.migrate.ts`).
 * Phase 61 — bumped 17 → 18: retired the Quest Board minigame ("The
 *   Boy's Almanac"). Clears any live quest-board session riding along
 *   in the raw payload's `quest` key (a mobile-only slice, not a
 *   `GameState` field — the old `QuestBoardSession` shape is gone, so a
 *   stale one must not survive; see `game.migrate.ts`).
 * Phase 76 — bumped 18 → 19: retired the Gathering minigame ("The
 *   Gleaning"). Clears a stale mobile-only gathering session (see
 *   `game.migrate.ts`).
 * Phase 63 — bumped 19 → 20: retired the loot-cache Pick Pool minigame
 *   ("The Reliquary"), replaced by `World/LootCacheChoice`'s three-offer
 *   choice. Clears any live cache session riding along in the raw
 *   payload's `cache` key and adds the required `mapGoodwill: Record<string,
 *   number>` slice, defaulted to `{}` for legacy saves (see `game.migrate.ts`).
 * 2026-08-28 — bumped 20 → 21: inter-map travel. `createStartingWorld` now
 *   populates the `world` continent catalogue (coastal + northern) instead
 *   of `[]`, and `WorldState` gains the optional `mapStates` record of
 *   departed maps. The migration seeds the catalogue onto old saves,
 *   preserving `currentContinent` / `currentMap` and any completed /
 *   available state they carried (see `game.migrate.ts`).
 * 2026-09-15 — bumped 21 → 22 (Phase 85): 3 new signet relics fill the
 *   `head`/`hands`/`feet` accessory kinds that shipped empty in Phase 19.
 *   The migration appends the 3 new relics (benched) to any save's
 *   inventory that doesn't already carry them; the worn loadout and every
 *   other field pass through untouched (see `game.migrate.ts`).
 * 2026-09-20 — bumped 22 → 23: retired the STARTING-LOADOUT SEED. Every
 *   fresh save used to carry a Phase-169 `combat-loadout-card:` flag per
 *   `STARTING_CARD_IDS` (4 cards). Nothing in the shipped product ever
 *   edits that loadout, but `buildCombatDeck` deals it INSTEAD of
 *   `knownCards` whenever it exists — so the starter bundle the player
 *   chose (18+ cards, written to `knownCards`) was never the deck that was
 *   dealt. Two live symptoms: (a) a 4-card base + a few rewards sits at
 *   `MIN_COMBAT_DECK_SIZE` and every rest-node CUT is refused
 *   `deck-at-floor` with shillings in hand; (b) a bundle that does not
 *   contain a seeded starter (e.g. `thin-hymn`) still deals it, and
 *   `executeCard`'s ownership guard (which reads `knownCards`, never the
 *   loadout) throws `Card 'thin-hymn' is not known.` mid-combat. The
 *   migration strips every `combat-loadout-card:` flag; `knownCards` +
 *   `combatRewardCards` is the deck again (see `game.migrate.ts`). The
 *   loadout codec itself stays (dev/e2e harnesses still pin decks through
 *   it) — it is simply no longer seeded.
 * 2026-09-21 — bumped 23 → 24: the SUPPLIANT'S RING moved out of the silent
 *   seed and into the run's first node. A fresh v24 save carries 10 relics,
 *   not 11, with the Venom Sigil holding the ring's accessory seat and no
 *   `first-node-relic-granted` flag; the first node hands the ring over,
 *   swaps it into that seat, and benches the Sigil — landing on the exact
 *   loadout v23 seeded silently at t=0. The finding this answers was "new
 *   players start with no items": the ring was never missing (measured — a
 *   v23 fresh state carries it worn, and the SATCHEL renders it), it was
 *   handed over inside `createCharacter` before any screen existed to say
 *   so. The migration stamps `first-node-relic-granted` on every existing
 *   save, which already owns the ring, so no save is ever offered it twice
 *   (see `game.migrate.ts`).
 * 2026-09-23 — NO version bump: THE VERY START. A fresh save now seeds NO
 *   relics at all (empty inventory, empty loadout, zero coin, zero XP). The
 *   save SHAPE is unchanged, so existing saves need no migration — they keep
 *   whatever kit they already carry. The ring still arrives at the first
 *   node; the other ten relics are village-market wares (owner call).
 * 2026-09-25 — bumped 24 → 25: TRIM THE FAT T2a (D14). Derived stats, luck,
 *   the non-combat saves/tests, every non-maxHp stat line on equipment and
 *   the write-only `factionReputations` slice are retired; the hop strips
 *   them from loaded saves (see
 *   `game.migrate.ts`).
 */
export const GAME_STATE_VERSION = 25;

/** Builds a brand-new GameState with default player and world. */
export function createNewGameState(): GameState {
    // No curated-loadout seed (v23, 2026-09-20 — see the version log above):
    // the combat deck is `knownCards` + `combatRewardCards`, and the client
    // seeds `knownCards` from the chosen starter bundle (`ensureStarterCards`).
    // A loadout flag here would shadow that bundle for the whole run.
    const flags: string[] = [];
    return {
        version: GAME_STATE_VERSION,
        runId: generateRunId(() => getRng().random()),
        // A fresh player starts at the apprentice baseline ({5,5,5} → 75 HP),
        // not the {1,1,1}/15 HP placeholder — a 15 HP start is one-shot
        // territory for the early encounters. Starter cards are seeded by the
        // client on first combat (`ensureStarterCards`).
        //
        // Owner call 2026-09-23 — THE VERY START: a fresh run seeds NO items,
        // no equipment, no currency and no XP. `seedStartingRelics` is off, so
        // the inventory and the worn loadout are both empty. The one relic
        // the run owes the player, the Suppliant's Ring, is still handed over
        // at the first node (`Character/first-node-grant.ts` — with an empty
        // accessory row it simply fills the first seat, displacing nothing).
        // The other ten signet relics are village-market wares now
        // (`World/MapEvents/content.ts`), bought with coin the run earns.
        //
        // Presets, fixtures, mocks and sims still seed the Phase-19 kit via
        // `buildCharacterFromPreset` / `cloneStartingRelics`, so the measured
        // baselines are untouched by this — only the real-player origination
        // point changed. (The v24 stand-in swap, `withholdFirstNodeRelic`,
        // is kept exported for callers that seed the kit themselves.)
        player: createCharacter({
            name: 'Player',
            level: 1,
            baseStats: { heart: 5, body: 5, mind: 5 },
            seedStartingRelics: false,
        }),
        world: createStartingWorld(),
        quests: emptyQuestLog(),
        flags,
        moralMeter: 0,
        rngState: getRng().getState(),
        philosophicalAlignment: defaultAlignment(),
        codex: { unlockedEntries: [] },
        regionConsequences: { exploitedRegions: [], sparedRegions: [] },
        mapGoodwill: {},
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Type-guard for the `Enemy | Encounter` startCombat overload. */
function isEncounter(target: Enemy | Encounter): target is Encounter {
    return Array.isArray((target as Encounter).enemies);
}

/**
 * Level-up step. While the player has accumulated enough XP for the next
 * level, increment `level`, recompute `maxHealth` (base-stat pool plus the worn
 * armor relics' bonus), raise the threshold, refill
 * HP, and bank Spec 06's stat points (spent later via `ALLOCATE_STAT_POINT`).
 */
function applyLevelUps(player: Character): Character {
    let next = player;
    while (next.experience >= next.experienceToNextLevel) {
        const level = next.level + 1;
        // Tier 0 item 4 (TRIM THE FAT T2a): keep the worn armor relics' bonus.
        const maxHealth = calculateMaxHealth(level, next.baseStats) + wornMaxHpBonus(next.equipment);
        next = {
            ...next,
            level,
            maxHealth,
            health: maxHealth,
            experienceToNextLevel: level * EXPERIENCE_PER_LEVEL,
            // Spec 06 Q3 — grant STAT_POINTS_PER_LEVEL on every promotion.
            // Multi-level cascades (Q9) accumulate without merging.
            availableStatPoints: (next.availableStatPoints ?? 0) + STAT_POINTS_PER_LEVEL,
        };
    }
    return next;
}

/**
 * Shifts the moral meter by the specified delta, clamping to [-100, +100].
 * Optionally gated by min/max requirements — if the current meter doesn't meet
 * the gating criteria, the shift is blocked and state returns unchanged.
 */
function shiftMoralMeter(state: GameState, delta: number, gating?: { min?: number; max?: number }): GameState {
    const current = state.moralMeter;
    
    // Check gating constraints
    if (gating) {
        if (gating.min !== undefined && current < gating.min) {
            return state; // Blocked by minimum requirement
        }
        if (gating.max !== undefined && current > gating.max) {
            return state; // Blocked by maximum requirement
        }
    }
    
    // Apply shift with clamping
    const newMeter = Math.max(-100, Math.min(100, current + delta));
    
    return {
        ...state,
        moralMeter: newMeter,
    };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

/**
 * Settle a still-pending first-node relic grant (the Suppliant's Ring) onto
 * `state`, returning the same reference when there was nothing to settle.
 *
 * This is the reducer's floor, not the ceremony. See
 * `Character/first-node-grant.ts` for why the grant exists and what the
 * client-side hand-over looks like.
 */
function settleFirstNodeRelic(state: GameState): GameState {
    if (!isFirstNodeRelicPending(state.player, state.flags)) return state;
    const result = grantFirstNodeRelic(state.player, state.flags);
    return { ...state, player: result.character, flags: [...result.flags] };
}

/**
 * Pure dispatch spine. Routes every `GameAction` to the corresponding sub-
 * reducer and returns the resulting `GameState`. Never throws on unknown
 * action types — instead returns state unchanged (caller is responsible for
 * type safety).
 *
 * Autosave policy lives in `store.ts` (Phase 51, Spec 09 Q4 path B):
 * only the curated `DURABLE_ACTIONS` set triggers an `adapter.save` call.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'START_COMBAT': {
            // The first-node grant's hard floor: nobody fights without their
            // starting kit. The ceremony belongs to the first node (a client
            // calls `grantFirstNodeRelic` there and shows what arrived), but
            // if a run reaches a fight with the grant still pending, settle
            // it here rather than let the player swing without The Open Hand.
            // Idempotent — a settled grant is a no-op.
            const staged = settleFirstNodeRelic(state);

            const encounter: Encounter = isEncounter(action.payload.target)
                ? action.payload.target
                : { enemies: [action.payload.target] };
            if (encounter.enemies.length === 0) {
                throw new Error('START_COMBAT: encounter has no enemies.');
            }

            // The Phase 92 moral-meter stat scaling that stood here was a
            // provable no-op (uniform scaling never changes the argmax
            // stance, and combat reads no stat) — deleted in TRIM THE FAT T2a.
            const enemy = encounter.enemies[0]!;
            let scaledEnemy = { ...enemy };
            
            // Phase 109 — Apply 'open-minded' status to region bosses when the region was spared
            const isBoss = enemy.difficulty === 'boss';
            const regionSpared = staged.regionConsequences.sparedRegions.includes(enemy.mapName);
            if (isBoss && regionSpared) {
                const openMindedEffect = lookupEffect('buff_absolved');
                if (openMindedEffect) {
                    scaledEnemy = {
                        ...scaledEnemy,
                        effects: [...scaledEnemy.effects, {
                            effectId: openMindedEffect.id,
                            intensity: 1,
                            remainingDuration: -1, // Permanent
                            sourceId: 'region-mercy-consequence',
                            appliedAt: 0,
                            tier: openMindedEffect.tier,
                            resistedBy: openMindedEffect.resistedBy,
                            resistDR: openMindedEffect.resistDR,
                        }],
                    };
                }
            }
            
            // The store no longer drives combat — it only stages the (scaled)
            // encounter. The Hazard-Pattern engine runs the fight outside the
            // store; `END_COMBAT` consumes `currentEncounter` to grant rewards.
            const scaledEncounter: Encounter = {
                ...encounter,
                enemies: [scaledEnemy, ...encounter.enemies.slice(1)],
            };
            return {
                ...staged,
                currentEncounter: scaledEncounter,
            };
        }

        case 'END_COMBAT': {
            const encounter = state.currentEncounter;
            if (!encounter) return state;

            // The Hazard-Pattern combat driver reports the outcome; the store
            // no longer derives it from a legacy combat snapshot. Default to
            // `'flee'` (no grants) when the caller omits it.
            const outcome: 'victory' | 'defeat' | 'flee' | 'friendship' =
                action.payload?.outcome ?? 'flee';

            // The befriended / defeated foe is the encounter's lead enemy.
            const foe: Enemy = encounter.enemies[0]!;

            // Promote the driver's final player snapshot (post-fight HP /
            // effects) when provided; restore the root inventory on defeat /
            // flee so combat-side inventory mutations don't leak. When the
            // caller omits `finalPlayer`, the root player is left untouched.
            const finalPlayer = action.payload?.finalPlayer;
            let nextPlayer: Character = finalPlayer
                ? ((outcome === 'victory' || outcome === 'friendship')
                    ? finalPlayer
                    : { ...finalPlayer, inventory: state.player.inventory })
                : state.player;

            let nextQuests: QuestLog = state.quests;

            if (outcome === 'victory' || outcome === 'friendship') {
                const grantedLoot = action.payload?.grantedLoot
                    ?? rollEncounterLoot(encounter, () => getRng().random());
                const grantedXp = action.payload?.grantedXp
                    ?? totalEncounterXp(encounter);

                let nextInventory = nextPlayer.inventory;
                for (const drop of grantedLoot) {
                    nextInventory = addItemStacking(nextInventory, drop);
                }
                nextPlayer = {
                    ...nextPlayer,
                    experience: nextPlayer.experience + grantedXp,
                    inventory: nextInventory,
                };
                // Advance any active `kill` objectives whose target matches.
                for (const enemy of encounter.enemies) {
                    const kills = killObjectives(nextQuests, enemy.name);
                    for (const k of kills) {
                        const res = progressQuest(nextQuests, k.questName, k.objectiveId, 1);
                        nextQuests = res.log;
                        if (res.completedName) {
                            const q = findQuest(state.quests, res.completedName);
                            if (q && typeof q.reward !== 'string' && q.reward && 'kind' in q.reward) {
                                if (q.reward.kind === 'currency') {
                                    nextPlayer = { ...nextPlayer, currency: nextPlayer.currency + q.reward.amount };
                                } else if (q.reward.kind === 'experience') {
                                    nextPlayer = { ...nextPlayer, experience: nextPlayer.experience + q.reward.amount };
                                }
                            }
                        }
                    }
                }
            }

            // Phase 62 — friendship resolutions append the per-enemy
            // `flagSet` to state.flags (de-duped). Reuses the existing
            // requires.flag machinery so downstream dialogue / quest
            // content can gate on the flag without engine work.
            let nextFlags = state.flags;
            if (outcome === 'friendship') {
                const flag = foe.friendshipReward?.flagSet;
                if (flag && !nextFlags.includes(flag)) {
                    nextFlags = [...nextFlags, flag];
                }
            }

            // Phase 69 — friendship resolutions apply the per-enemy
            // `alignmentDelta` to state.philosophicalAlignment via the
            // Phase 42 `applyAlignmentDelta` clamp helper. Each axis
            // clamps to [-100, +100]; missing axes pass through. Closes
            // Spec 14 Q4. Combined with the Phase 62 flag-set above so the
            // friendship outcome can carry world flags AND alignment
            // shifts independently.
            let nextAlignment = state.philosophicalAlignment;
            if (outcome === 'friendship') {
                const delta = foe.friendshipReward?.alignmentDelta;
                if (delta) {
                    nextAlignment = applyAlignmentDelta(nextAlignment, delta);
                }
            }
            // Phase 73 — friendship resolutions auto-fire the per-enemy
            // codex unlock. The entry's id is appended to
            // state.codex.unlockedEntries (de-duped); the store layer
            // surfaces { id, title } on
            // CombatEndReport.friendshipReward.codexEntryUnlocked. Closes
            // GH#65 ask 3.
            let nextCodex = state.codex;
            if (outcome === 'friendship') {
                const entry = foe.journalEntry;
                if (entry && !nextCodex.unlockedEntries.includes(entry.id)) {
                    nextCodex = {
                        ...nextCodex,
                        unlockedEntries: [...nextCodex.unlockedEntries, entry.id],
                    };
                }
            }

            // Friendship victories grant +1 to moral meter (compassion)
            const baseState = {
                ...state,
                player: nextPlayer,
                quests: nextQuests,
                flags: nextFlags,
                philosophicalAlignment: nextAlignment,
                codex: nextCodex,
                currentEncounter: undefined,
            };

            return outcome === 'friendship'
                ? shiftMoralMeter(baseState, 1)
                : baseState;
        }

        case 'MOVE_TO_NODE': {
            // Deliberately does NOT settle the first-node relic grant. Moving
            // is a world-only transition — `game.loop.engine.test.ts` pins
            // `next.player === state.player` — and handing the player an item
            // for walking would be a side effect nothing asked for. The grant
            // settles where a node is RESOLVED (`PROCESS_NODE`, or a client
            // calling `grantFirstNodeRelic` with a screen to show it), with
            // `START_COMBAT` as the floor.
            return {
                ...state,
                world: moveWorld(state.world, action.payload.nodeId),
            };
        }

        case 'PROCESS_NODE': {
            // Resolving a node IS the first node happening. Clients with a
            // screen to show the hand-over on — mobile — call
            // `grantFirstNodeRelic` themselves and present the result; this
            // settles it for everyone else (the CLI, the engine store).
            return resolveMapEvent(settleFirstNodeRelic(state)).state;
        }

        case 'APPLY_DIALOGUE': {
            return applyDialogueRuntime(state, action.payload.tree, action.payload.choice).gameState;
        }

        case 'USE_ITEM': {
            const { player } = state;
            const item = player.inventory.find(i => i.id === action.payload.itemId);
            if (!item || !isConsumable(item)) return state;
            const { player: healed } = useConsumableEffect(player, item, 0, lookupEffect);
            const nextInventory = useConsumableItem(healed.inventory, action.payload.itemId);
            return { ...state, player: { ...healed, inventory: nextInventory } };
        }

        case 'EQUIP_ITEM': {
            return { ...state, player: equipItemReducer(state.player, action.payload.item, action.payload.opts) };
        }

        case 'UNEQUIP_ITEM': {
            return { ...state, player: unequipItemReducer(state.player, action.payload.slot, action.payload.index) };
        }

        case 'LEVEL_UP': {
            return { ...state, player: applyLevelUps(state.player) };
        }

        case 'ALLOCATE_STAT_POINT': {
            return { ...state, player: allocateStatPoint(state.player, action.payload.stat) };
        }

        case 'LEARN_CARD': {
            return {
                ...state,
                player: learnCard(
                    state.player,
                    action.payload.cardId,
                ),
            };
        }

        case 'SHIFT_MORAL_METER': {
            return shiftMoralMeter(state, action.payload.delta, action.payload.gating);
        }

        case 'SHIFT_PHILOSOPHICAL_ALIGNMENT': {
            return {
                ...state,
                philosophicalAlignment: applyAlignmentDelta(
                    state.philosophicalAlignment,
                    action.payload.delta,
                ),
            };
        }

        case 'SAVE_GAME': {
            return {
                ...state,
                rngState: getRng().getState(),
            };
        }

        case 'LOAD_GAME':
            // Side effects owned by the store layer; reducer is pure.
            return state;

        case 'RESET_RUN': {
            // Phase 72 — closes GH#65 ask 2.
            const { keepCharacter } = action.payload;
            const freshRunId = generateRunId(() => getRng().random());

            if (!keepCharacter) {
                // Full new-game reset; carry rngState forward (D2 — don't
                // reset the seed mid-session, that breaks deterministic
                // replay) and assign a fresh runId.
                const fresh = createNewGameState();
                return { ...fresh, runId: freshRunId, rngState: state.rngState };
            }

            // keepCharacter: true — preserve persistent character ledger
            // (player + philosophicalAlignment + moralMeter + rngState per
            // Phase 72 D1; codex per Phase 73 D12 — codex unlocks are
            // character knowledge, carry across runs); reset run-scoped
            // state. HP refills to maxHealth; effects clears defensively
            // (already empty between combats).
            return {
                version: GAME_STATE_VERSION,
                runId: freshRunId,
                player: {
                    ...state.player,
                    health: state.player.maxHealth,
                    effects: [],
                },
                world: createStartingWorld(),
                quests: emptyQuestLog(),
                flags: [],
                moralMeter: state.moralMeter,
                rngState: state.rngState,
                philosophicalAlignment: state.philosophicalAlignment,
                codex: state.codex,
                regionConsequences: state.regionConsequences,
                // mapGoodwill (Phase 63) carries forward — village goodwill
                // is player-knowledge-shaped, not run-scoped.
                mapGoodwill: state.mapGoodwill,
                // lastSeenAlignmentCells intentionally dropped (Phase 72
                // D12 — observer cache resets; fresh run, fresh
                // observation history).
            };
        }

        case 'UNLOCK_CODEX_ENTRY': {
            // Phase 73 — closes GH#65 ask 3.
            const { entryId } = action.payload;
            if (state.codex.unlockedEntries.includes(entryId)) return state;
            return {
                ...state,
                codex: {
                    ...state.codex,
                    unlockedEntries: [...state.codex.unlockedEntries, entryId],
                },
            };
        }
    }
}
