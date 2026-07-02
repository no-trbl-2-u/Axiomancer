/**
 * Game Store
 *
 * A framework-agnostic Zustand vanilla store. Works in Node.js today and
 * in React Native via the `useStore` hook.
 *
 * ── Architectural rule ───────────────────────────────────────────────────────
 * Per Spec 09, every state mutation flows through `gameReducer`. The store is
 * a thin Zustand wrapper that:
 *   1. Calls `gameReducer(get(), action)` to compute the next state.
 *   2. `set(...)` to publish it.
 *   3. Emits the corresponding `GameEvent` to any subscribed consumer.
 *   4. Autosaves through the provided `PersistenceAdapter`.
 *
 * Legacy method-style actions (`startCombat`, `endCombat`, ...) are retained
 * so callers don't have to rewrite imports; each is now sugar over `dispatch`.
 *
 * ── Usage (Node.js) ──────────────────────────────────────────────────────────
 *   import { createGameStore, createEventEmitter } from 'axiomancer-mechanics';
 *   import { createNodeAdapter } from 'axiomancer-mechanics/node';
 *
 *   const events = createEventEmitter();
 *   const store  = createGameStore(createNodeAdapter(), undefined, events);
 *   events.on('combat:started', e => console.log(e));
 *   store.getState().dispatch({ type: 'START_COMBAT', payload: { target: someEnemy } });
 *
 * ── Usage (React Native) ─────────────────────────────────────────────────────
 *   import { createGameStore } from 'axiomancer-mechanics';
 *   import { useStore } from 'zustand';
 *
 *   const store = createGameStore(asyncStorageAdapter);
 *   const player = useStore(store, s => s.player);
 */

import { createStore, StoreApi } from 'zustand/vanilla';
import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';
import { Encounter } from '../World/types';
import {
    Item, Equipment, EquipmentSlot,
} from '../Items/types';
import { DialogueTree, DialogueChoice } from '../NPCs/types';
import { PhilosophicalAlignment } from '../Philosophy/types';
import { applyAlignmentDelta } from '../Philosophy/alignment.engine';
import { applyFactionReputationDeltas } from '../Faction/faction.engine';
import { GameState } from './types';
import { GameAction } from './actions.types';
import { gameReducer, createNewGameState } from './game.reducer';
import { GameEventEmitter, GameEvent, GameEventType } from './events';
import { PersistenceAdapter } from './persistence/types';
import { rollEncounterLoot, totalEncounterXp } from './combat-grants';
import { getRng } from '../Utils/rng';
import { getAvailableSkills } from '../Cards';
import {
    addItem as addItemReducer,
    removeItem as removeItemReducer,
    stackItem as stackItemReducer,
} from '../Items/item.reducer';

/**
 * Curated set of action types that trigger an autosave through the
 * provided `PersistenceAdapter` (Phase 51, Spec 09 Q4 path B).
 *
 * UI-tier actions (`USE_ITEM`, `EQUIP_ITEM`, `ALLOCATE_STAT_POINT`,
 * `LEARN_SKILL`, `SHIFT_MORAL_METER`, `SHIFT_PHILOSOPHICAL_ALIGNMENT`,
 * `START_COMBAT`, `PROCESS_NODE`, `LOAD_GAME`) are intentionally excluded —
 * they will save on the next durable transition or via an explicit
 * `SAVE_GAME` / `save()` call.
 */
const DURABLE_ACTIONS: ReadonlySet<GameAction['type']> = new Set<GameAction['type']>([
    'LEVEL_UP',
    'END_COMBAT',
    'MOVE_TO_NODE',
    'APPLY_DIALOGUE',
    'SAVE_GAME',
    'RESET_RUN', // Phase 72 — persist new runId + reset world immediately.
    'UNLOCK_CODEX_ENTRY', // Phase 73 — persist codex unlock immediately.
]);

/**
 * Summary of what an `endCombat` call granted to the player (Spec 07).
 *
 * Returned from `endCombat()` so the CLI / UI can render an after-action
 * report.
 *
 * - `outcome` — `'victory'` when the player killed the enemy, `'defeat'`
 *   when the player went down first, `'friendship'` when the
 *   friendship-counter capped (Phase 36 — half XP and a moral-meter shift),
 *   `'flee'` when combat ended without any of the above (manual escape).
 * - `xpGained` — flat XP added to `player.experience` this turn (enemy XP
 *   only; quest reward XP is folded directly into `player.experience`).
 *   Half-XP on `'friendship'`; full XP on `'victory'`; zero on `'defeat'` /
 *   `'flee'`.
 * - `loot` — items added to `player.inventory` (pre stack-merge). Granted
 *   on victory and friendship; empty on defeat / flee.
 */
export interface CombatEndReport {
    outcome: 'victory' | 'defeat' | 'friendship' | 'flee';
    xpGained: number;
    loot: Item[];
    /**
     * Phase 60 — per-enemy friendship-reward content. Only present on
     * `outcome === 'friendship'` when the befriended enemy carries a
     * `friendshipReward`. The engine has already applied the reward's
     * `items` to `loot` and `xpBonus` to `xpGained` by the time this
     * surfaces; `narrative` is here for the CLI / UI to render.
     * Phase 69 — `alignmentShift` carries the post-clamp
     * `PhilosophicalAlignment` for the consumer to render (the
     * END_COMBAT reducer has already written the new cell to
     * `state.philosophicalAlignment` by the time this surfaces).
     * Mirrors the way `applyDialogueChoice` returns
     * `effects.philosophicalShift`.
     */
    friendshipReward?: {
        narrative?: string;
        alignmentShift?: PhilosophicalAlignment;
        /**
         * Phase 73 — when the befriended enemy carries a `journalEntry`
         * and the entry wasn't already unlocked, the engine appends its
         * id to `state.codex.unlockedEntries` and surfaces
         * `{ id, title }` here for the consumer's after-action UI
         * (mobile `<CombatFriendshipPanel>` NEW ENTRY card). Body is
         * recovered via lookup against the source `Enemy` (or a future
         * `CodexLibrary` registry). Closes GH#65 ask 3.
         */
        codexEntryUnlocked?: { id: string; title: string };
        /**
         * Phase 110 — when the befriended enemy carries `factionDeltas`
         * and the deltas are non-empty, surfaces the post-clamp
         * `FactionReputations` for the consumer to render (the
         * END_COMBAT reducer has already written the new values to
         * `state.factionReputations` by the time this surfaces).
         * Mirrors the way `alignmentShift` surfaces alignment changes.
         */
        factionReputationShift?: { [factionId: string]: number };
    };
}

/**
 * Every operation that mutates the root GameState. Grouped by domain.
 *
 * The canonical entry point is `dispatch(action)`; the named methods below
 * are sugar that builds the action for you. New consumers should prefer
 * `dispatch` for forward compatibility.
 */
export interface GameActions {
    /** Generic dispatch — applies the action via `gameReducer`. */
    dispatch: (action: GameAction) => void;

    // ── Combat ───────────────────────────────────────────────────────────────
    /**
     * Stages an encounter for combat. Applies moral-meter / region-mercy
     * scaling to the lead enemy and writes the result to `currentEncounter`.
     * The fight itself is driven by the Hazard-Pattern engine outside the
     * store; call `endCombat` with the reported outcome to grant rewards.
     */
    startCombat: (target: Enemy | Encounter) => void;
    /**
     * Resolves the staged encounter. The Hazard-Pattern combat driver reports
     * the `outcome` and (optionally) the post-fight `finalPlayer` snapshot.
     * Grants loot / XP / quest progress / friendship rewards accordingly and
     * returns the after-action `CombatEndReport`.
     */
    endCombat: (
        outcome: CombatEndReport['outcome'],
        finalPlayer?: Character,
    ) => CombatEndReport;

    // ── World / dialogue ─────────────────────────────────────────────────────
    moveToNode: (nodeId: string) => void;
    processNode: () => void;
    applyDialogue: (tree: DialogueTree, choice: DialogueChoice) => void;

    // ── Inventory ────────────────────────────────────────────────────────────
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    useConsumable: (itemId: string) => void;
    stackItem: (itemId: string, amount: number) => void;

    // ── Equipment ────────────────────────────────────────────────────────────
    equipItem: (item: Equipment) => void;
    unequipItem: (slot: EquipmentSlot) => void;

    // ── Progression / persistence ────────────────────────────────────────────
    levelUp: () => void;
    allocateStatPoint: (stat: 'heart' | 'body' | 'mind') => void;
    learnSkill: (skillId: string) => void;
    save: () => void;
    // ── Morality ─────────────────────────────────────────────────────────────
    shiftMoralMeter: (delta: number, gating?: { min?: number; max?: number }) => void;
    // ── Philosophical alignment ──────────────────────────────────────────────
    shiftPhilosophicalAlignment: (delta: Partial<PhilosophicalAlignment>) => void;
    // ── Run loop (Phase 72) ──────────────────────────────────────────────────
    /**
     * Phase 72 — resets the playthrough back to the starting hearth (closes
     * GH#65 ask 2). `keepCharacter: true` preserves the character ledger
     * (player + philosophicalAlignment + moralMeter + rngState + codex) and
     * refills HP; world / combat / quests / flags / observer cache reset.
     * `keepCharacter: false` performs a full new-game reset. Every call
     * assigns a fresh `runId`. Dispatches `RESET_RUN`; persists via the
     * standard DURABLE_ACTIONS pipeline. Returns the post-reset GameState.
     */
    resetRun: (opts: { keepCharacter: boolean }) => GameState;
    // ── Codex (Phase 73) ─────────────────────────────────────────────────────
    /**
     * Phase 73 — append a codex entry id to `state.codex.unlockedEntries`
     * (de-duped). Closes GH#65 ask 3. Friendship outcomes auto-fire the
     * unlock when the befriended enemy carries a `journalEntry`; this
     * method exists so future dialogue / map-event content can grant
     * codex entries directly. Dispatches `UNLOCK_CODEX_ENTRY` through the
     * standard DURABLE_ACTIONS pipeline.
     */
    unlockCodexEntry: (entryId: string) => void;
}

/** Full store type — state + actions. */
export type GameStore = GameState & GameActions;

/**
 * Map a `GameAction` to the corresponding `GameEvent` (or null if the action
 * shouldn't broadcast). The reducer is pure, so the store is the right place
 * for these side-effecting notifications.
 */
/**
 * Compute the extra envelope fields that depend on the prev→next diff.
 * Today this is only the Phase 30 `unlockedSkills` bag for level-ups —
 * the list of skill ids that became eligible because the promotion
 * crossed a learning-requirement threshold.
 */
function enrichExtra(
    action: GameAction,
    prev: GameState,
    next: GameState,
    extra?: { report?: CombatEndReport },
): { report?: CombatEndReport; unlockedSkills?: string[] } | undefined {
    if (action.type !== 'LEVEL_UP') return extra;
    if (next.player.level === prev.player.level) return extra; // No promotion → no diff.
    // Phase 46 — thread the alignment so the unlockedSkills diff reflects
    // alignment-gated skill availability changes (e.g. a SHIFT_PHILOSOPHICAL_ALIGNMENT
    // that crosses a gate threshold should surface the newly-eligible skills).
    const before = new Set(getAvailableSkills(prev.player, prev.philosophicalAlignment).map(s => s.id));
    const after = getAvailableSkills(next.player, next.philosophicalAlignment).map(s => s.id);
    const unlockedSkills = after.filter(id => !before.has(id));
    return { ...(extra ?? {}), unlockedSkills };
}

function eventForAction(
    action: GameAction,
    nextState: GameState,
    extra?: { report?: CombatEndReport; unlockedSkills?: string[] },
): GameEvent | null {
    const map: Partial<Record<GameAction['type'], GameEventType>> = {
        START_COMBAT:   'combat:started',
        END_COMBAT:     'combat:ended',
        MOVE_TO_NODE:   'world:moved',
        PROCESS_NODE:   'world:processed',
        APPLY_DIALOGUE: 'dialogue:applied',
        LEVEL_UP:       'character:levelup',
        USE_ITEM:       'inventory:changed',
        EQUIP_ITEM:     'inventory:changed',
        UNEQUIP_ITEM:   'inventory:changed',
        SAVE_GAME:      'game:saved',
        LOAD_GAME:      'game:loaded',
    };
    const type = map[action.type];
    if (!type) return null;
    return { type, payload: { action, state: nextState, ...(extra ?? {}) } };
}

/**
 * Constructs a Zustand vanilla store backed by `adapter`.
 *
 * @param adapter   - Persistence backend (Node fs, AsyncStorage, null for tests).
 * @param overrides - Optional partial state to merge over the loaded/default state.
 * @param emitter   - Optional event emitter; consumers subscribe to it to
 *                    learn about combat / world / progression transitions.
 *                    Kept outside `GameState` so handlers don't serialise.
 */
export function createGameStore(
    adapter: PersistenceAdapter,
    overrides?: Partial<GameState>,
    emitter?: GameEventEmitter,
): StoreApi<GameStore> {
    const saved   = adapter.load();
    const base    = saved ?? createNewGameState();
    const initial: GameState = { ...base, ...overrides };

    // Restore RNG state from loaded save
    if (saved?.rngState !== undefined) {
        getRng().setState(saved.rngState);
    }

    return createStore<GameStore>()((set, get) => {
        // Core dispatch: run reducer → set → emit → autosave (gated).
        // Phase 51 (Spec 09 Q4): autosave only fires for the curated
        // DURABLE_ACTIONS set; UI-tier actions never write through. The
        // direct `save()` verb below keeps its own unconditional write.
        function dispatch(action: GameAction, extra?: { report?: CombatEndReport }): GameState {
            const prev = get();
            const next = gameReducer(prev, action);
            set(next);
            const enriched = enrichExtra(action, prev, next, extra);
            const event = eventForAction(action, next, enriched);
            if (event && emitter) emitter.emit(event);
            // Save excludes transient currentEncounter — encounters re-roll on
            // load (Spec 07).
            if (DURABLE_ACTIONS.has(action.type)) {
                const {
                    currentEncounter: _drop, version, runId, player, world, quests, flags,
                    moralMeter, rngState, philosophicalAlignment,
                    lastSeenAlignmentCells, codex, regionConsequences, factionReputations,
                } = next;
                adapter.save({
                    version, runId, player, world, quests, flags,
                    moralMeter, rngState, philosophicalAlignment,
                    lastSeenAlignmentCells, codex, regionConsequences, factionReputations,
                });
            }
            return next;
        }

        return {
            ...initial,

            dispatch(action) { dispatch(action); },

            // ── Combat ───────────────────────────────────────────────────────
            startCombat(target) {
                dispatch({ type: 'START_COMBAT', payload: { target } });
            },

            endCombat(outcome, finalPlayer) {
                const pre = get();
                const encounter = pre.currentEncounter;
                if (!encounter) {
                    return { outcome: 'flee', xpGained: 0, loot: [] };
                }
                const foe = encounter.enemies[0]!;

                let xpGained = 0;
                let loot: Item[] = [];
                if (outcome === 'victory') {
                    xpGained = totalEncounterXp(encounter);
                    loot = rollEncounterLoot(encounter, () => getRng().random());
                } else if (outcome === 'friendship') {
                    // Phase 36 — friendship grants half the kill-win XP and the
                    // full loot table (consistent with the reducer treating
                    // friendship as a peaceful resolution rather than a flee).
                    xpGained = Math.floor(totalEncounterXp(encounter) * 0.5);
                    loot = rollEncounterLoot(encounter, () => getRng().random());
                    // Phase 60 — per-enemy friendshipReward supplement. Items
                    // append to the weighted-loot roll; xpBonus adds on top of
                    // the half-XP base.
                    const fr = foe.friendshipReward;
                    if (fr) {
                        if (fr.items) loot = [...loot, ...fr.items];
                        if (fr.xpBonus) xpGained += fr.xpBonus;
                    }
                }

                const report: CombatEndReport = { outcome, xpGained, loot };
                // Phase 60 — surface the narrative on the report so the CLI /
                // UI can render it. Items + xpBonus already reach the consumer
                // through report.loot / report.xpGained.
                // Phase 69 — surface the post-clamp PhilosophicalAlignment so
                // the CLI / UI can render the shift; the reducer applies the
                // delta to state.philosophicalAlignment under the dispatch
                // below.
                if (outcome === 'friendship') {
                    const fr = foe.friendshipReward;
                    const entry = foe.journalEntry;
                    const codexAlreadyKnown = entry
                        ? pre.codex.unlockedEntries.includes(entry.id)
                        : true;
                    const willUnlockCodex = entry && !codexAlreadyKnown;
                    const hasFactionDeltas = fr?.factionDeltas && Object.keys(fr.factionDeltas).length > 0;
                    if (fr?.narrative || fr?.alignmentDelta || willUnlockCodex || hasFactionDeltas) {
                        const friendshipReport: {
                            narrative?: string;
                            alignmentShift?: PhilosophicalAlignment;
                            codexEntryUnlocked?: { id: string; title: string };
                            factionReputationShift?: { [factionId: string]: number };
                        } = {};
                        if (fr?.narrative) friendshipReport.narrative = fr.narrative;
                        if (fr?.alignmentDelta) {
                            friendshipReport.alignmentShift = applyAlignmentDelta(
                                pre.philosophicalAlignment,
                                fr.alignmentDelta,
                            );
                        }
                        if (hasFactionDeltas && fr.factionDeltas) {
                            // Phase 110 — surface the post-clamp faction reputation
                            // changes for consumer rendering
                            const updatedReputations = applyFactionReputationDeltas(
                                pre.factionReputations,
                                fr.factionDeltas,
                            );
                            // Only include factions that actually changed
                            const changedFactions: { [factionId: string]: number } = {};
                            for (const factionId of Object.keys(fr.factionDeltas)) {
                                changedFactions[factionId] = updatedReputations[factionId];
                            }
                            friendshipReport.factionReputationShift = changedFactions;
                        }
                        if (willUnlockCodex && entry) {
                            // Phase 73 — surface the unlocked entry's id +
                            // title on the report (the END_COMBAT reducer
                            // has appended the id to state.codex.unlockedEntries).
                            friendshipReport.codexEntryUnlocked = {
                                id: entry.id,
                                title: entry.title,
                            };
                        }
                        report.friendshipReward = friendshipReport;
                    }
                }
                dispatch(
                    {
                        type: 'END_COMBAT',
                        payload: { outcome, finalPlayer, grantedLoot: loot, grantedXp: xpGained },
                    },
                    { report },
                );
                return report;
            },

            // ── World / dialogue ─────────────────────────────────────────────
            moveToNode(nodeId) {
                dispatch({ type: 'MOVE_TO_NODE', payload: { nodeId } });
            },

            processNode() {
                dispatch({ type: 'PROCESS_NODE' });
            },

            applyDialogue(tree, choice) {
                dispatch({ type: 'APPLY_DIALOGUE', payload: { tree, choice } });
            },

            // ── Inventory ────────────────────────────────────────────────────
            addItem(item) {
                set(state => ({
                    player: { ...state.player, inventory: addItemReducer(state.player.inventory, item) },
                }));
                if (emitter) emitter.emit({ type: 'inventory:changed', payload: { item, state: get() } });
            },

            removeItem(itemId) {
                set(state => ({
                    player: { ...state.player, inventory: removeItemReducer(state.player.inventory, itemId) },
                }));
                if (emitter) emitter.emit({ type: 'inventory:changed', payload: { state: get() } });
            },

            useConsumable(itemId) {
                dispatch({ type: 'USE_ITEM', payload: { itemId } });
            },

            stackItem(itemId, amount) {
                set(state => ({
                    player: { ...state.player, inventory: stackItemReducer(state.player.inventory, itemId, amount) },
                }));
                if (emitter) emitter.emit({ type: 'inventory:changed', payload: { state: get() } });
            },

            // ── Equipment ────────────────────────────────────────────────────
            equipItem(item) {
                dispatch({ type: 'EQUIP_ITEM', payload: { item } });
            },

            unequipItem(slot) {
                dispatch({ type: 'UNEQUIP_ITEM', payload: { slot } });
            },

            // ── Progression / persistence ────────────────────────────────────
            levelUp() {
                dispatch({ type: 'LEVEL_UP' });
            },

            allocateStatPoint(stat) {
                dispatch({ type: 'ALLOCATE_STAT_POINT', payload: { stat } });
            },

            learnSkill(skillId) {
                dispatch({ type: 'LEARN_SKILL', payload: { skillId } });
            },

            save() {
                const next = get();
                const {
                    currentEncounter: _drop, version, runId, player, world, quests, flags,
                    moralMeter, rngState, philosophicalAlignment,
                    lastSeenAlignmentCells, codex, regionConsequences, factionReputations,
                } = next;
                adapter.save({
                    version, runId, player, world, quests, flags,
                    moralMeter, rngState, philosophicalAlignment,
                    lastSeenAlignmentCells, codex, regionConsequences, factionReputations,
                });
                if (emitter) emitter.emit({ type: 'game:saved', payload: { state: next } });
            },

            // ── Morality ──────────────────────────────────────────────────────
            shiftMoralMeter(delta: number, gating?: { min?: number; max?: number }) {
                dispatch({ type: 'SHIFT_MORAL_METER', payload: { delta, gating } });
            },

            // ── Philosophical alignment ──────────────────────────────────────
            shiftPhilosophicalAlignment(delta: Partial<PhilosophicalAlignment>) {
                dispatch({ type: 'SHIFT_PHILOSOPHICAL_ALIGNMENT', payload: { delta } });
            },

            // ── Run loop (Phase 72) ──────────────────────────────────────────
            resetRun(opts: { keepCharacter: boolean }) {
                return dispatch({ type: 'RESET_RUN', payload: opts });
            },

            // ── Codex (Phase 73) ─────────────────────────────────────────────
            unlockCodexEntry(entryId: string) {
                dispatch({ type: 'UNLOCK_CODEX_ENTRY', payload: { entryId } });
            },
        };
    });
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export type { StoreApi };

export const selectPlayer      = (s: GameStore): Character          => s.player;
/** True while an encounter is staged (combat is driven outside the store). */
export const selectIsInCombat  = (s: GameStore): boolean            => s.currentEncounter != null;
export const selectInventory   = (s: GameStore): Item[]             => s.player.inventory;
export const selectVersion     = (s: GameStore): number             => s.version;
export const selectMoralMeter  = (s: GameStore): number             => s.moralMeter;
