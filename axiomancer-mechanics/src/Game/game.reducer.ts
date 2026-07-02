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
import { applyMoralMeterScaling } from '../Combat/difficulty';
import {
    useConsumable as useConsumableItem,
} from '../Items/item.reducer';
import { useConsumableEffect } from '../Items/equipment.engine';
import { isConsumable } from '../Items/types';
import { lookupEffect } from '../Effects/effects.library';
import {
    equipItem as equipItemReducer,
    unequipItem as unequipItemReducer,
} from '../Character/equipment.reducer';
import { createCharacter, allocateStatPoint } from '../Character';
import { learnSkill } from '../Cards';
import { createStartingWorld, emptyQuestLog } from '../World';
import { moveToNode as moveWorld } from '../World/world.reducer';
import { resolveMapEvent } from '../World';
import { applyDialogueChoice as applyDialogueRuntime } from '../World/dialogue.runtime';
import { killObjectives, progressQuest, findQuest } from '../World/quest.engine';
import { calculateMaxHealth } from '../Utils';
import { EXPERIENCE_PER_LEVEL, STAT_POINTS_PER_LEVEL } from './game-mechanics.constants';
import { addItemStacking, rollEncounterLoot, totalEncounterXp } from './combat-grants';
import { getRng } from '../Utils/rng';
import { applyAlignmentDelta, defaultAlignment } from '../Philosophy';
import { applyFactionReputationDeltas, createDefaultFactionReputations } from '../Faction';
import { generateRunId } from './run-loop';
import { addToLoadout } from '../Combat/combat.loadout';
import { STARTING_SKILL_IDS } from '../Combat/combat.rewards';

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
 */
export const GAME_STATE_VERSION = 10;

/** Builds a brand-new GameState with default player and world. */
export function createNewGameState(): GameState {
    let flags: string[] = [];
    for (const id of STARTING_SKILL_IDS) flags = addToLoadout(flags, id);
    return {
        version: GAME_STATE_VERSION,
        runId: generateRunId(() => getRng().random()),
        // A fresh player starts at the apprentice baseline ({5,5,5} → 75 HP),
        // not the {1,1,1}/15 HP placeholder — a 15 HP start is one-shot
        // territory for the early encounters. Starter skills are seeded by the
        // client on first combat (`ensureStarterSkills`).
        player: createCharacter({
            name: 'Player',
            level: 1,
            baseStats: { heart: 5, body: 5, mind: 5 },
        }),
        world: createStartingWorld(),
        quests: emptyQuestLog(),
        flags,
        moralMeter: 0,
        rngState: getRng().getState(),
        philosophicalAlignment: defaultAlignment(),
        codex: { unlockedEntries: [] },
        regionConsequences: { exploitedRegions: [], sparedRegions: [] },
        factionReputations: createDefaultFactionReputations(),
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Type-guard for the `Enemy | Encounter` startCombat overload. */
function isEncounter(target: Enemy | Encounter): target is Encounter {
    return Array.isArray((target as Encounter).enemies);
}

/**
 * Minimal level-up step (placeholder per Phase 09 brief). While the player has
 * accumulated enough XP for the next level, increment `level`, recompute
 * `maxHealth`, raise the threshold, and refill HP. Spec 06's full progression
 * (stat allocation, skill unlocks) flows in later.
 */
function applyLevelUps(player: Character): Character {
    let next = player;
    while (next.experience >= next.experienceToNextLevel) {
        const level = next.level + 1;
        const maxHealth = calculateMaxHealth(level, next.baseStats);
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
            const encounter: Encounter = isEncounter(action.payload.target)
                ? action.payload.target
                : { enemies: [action.payload.target] };
            if (encounter.enemies.length === 0) {
                throw new Error('START_COMBAT: encounter has no enemies.');
            }
            
            // Apply moral meter scaling to enemy stats (Phase 92)
            const enemy = encounter.enemies[0]!;
            const scaledBaseStats = applyMoralMeterScaling(enemy.baseStats, state.moralMeter);
            let scaledEnemy = {
                ...enemy,
                baseStats: scaledBaseStats,
            };
            
            // Phase 109 — Apply 'open-minded' status to region bosses when the region was spared
            const isBoss = enemy.difficulty === 'boss';
            const regionSpared = state.regionConsequences.sparedRegions.includes(enemy.mapName);
            if (isBoss && regionSpared) {
                const openMindedEffect = lookupEffect('buff_open_minded');
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
                ...state,
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
            // Phase 110 — friendship resolutions apply the per-enemy
            // `factionDeltas` to state.factionReputations via the
            // Phase 110 `applyFactionReputationDeltas` clamp helper. Each
            // faction clamps to [-100, +100]; missing factions pass through.
            // Boss befriend outcomes demonstrate lose-with-one / gain-with-another
            // tradeoffs.
            let nextFactionReputations = state.factionReputations;
            if (outcome === 'friendship') {
                const factionDeltas = foe.friendshipReward?.factionDeltas;
                if (factionDeltas) {
                    nextFactionReputations = applyFactionReputationDeltas(
                        nextFactionReputations,
                        factionDeltas,
                    );
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
                factionReputations: nextFactionReputations,
                codex: nextCodex,
                currentEncounter: undefined,
            };

            return outcome === 'friendship'
                ? shiftMoralMeter(baseState, 1)
                : baseState;
        }

        case 'MOVE_TO_NODE': {
            return {
                ...state,
                world: moveWorld(state.world, action.payload.nodeId),
            };
        }

        case 'PROCESS_NODE': {
            return resolveMapEvent(state).state;
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
            return { ...state, player: equipItemReducer(state.player, action.payload.item) };
        }

        case 'UNEQUIP_ITEM': {
            return { ...state, player: unequipItemReducer(state.player, action.payload.slot) };
        }

        case 'LEVEL_UP': {
            return { ...state, player: applyLevelUps(state.player) };
        }

        case 'ALLOCATE_STAT_POINT': {
            return { ...state, player: allocateStatPoint(state.player, action.payload.stat) };
        }

        case 'LEARN_SKILL': {
            return {
                ...state,
                player: learnSkill(
                    state.player,
                    action.payload.skillId,
                    state.philosophicalAlignment,
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
            // Phase 72 — closes GH#65 ask 2. See plan/phases/phase_72_run_loop_semantics.md.
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
                factionReputations: state.factionReputations,
                codex: state.codex,
                regionConsequences: state.regionConsequences,
                // lastSeenAlignmentCells intentionally dropped (Phase 72
                // D12 — observer cache resets; fresh run, fresh
                // observation history).
            };
        }

        case 'UNLOCK_CODEX_ENTRY': {
            // Phase 73 — closes GH#65 ask 3. See plan/phases/phase_73_codex_journal_surface.md.
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
