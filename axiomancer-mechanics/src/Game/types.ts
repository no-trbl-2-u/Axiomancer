import { WorldState, QuestLog, Encounter } from '../World/types';
import { Character } from '../Character/types';
import { PhilosophicalAlignment } from '../Philosophy/types';
import { FactionReputations } from '../Faction/types';

/**
 * Top-level game state. The root object that aggregates the player,
 * the world, the staged encounter, the quest log, and world flags.
 *
 * @property version          - Schema version, incremented on breaking changes
 *                              so save files can be migrated.
 * @property currentEncounter - Spec 07 — the full encounter the player is
 *                              fighting. Carries multi-enemy info plus the
 *                              origin tag so `END_COMBAT` can roll loot and
 *                              advance kill objectives. Combat itself is driven
 *                              by the Hazard-Pattern engine outside the store;
 *                              `START_COMBAT` only stages this encounter and
 *                              `END_COMBAT` consumes it to grant rewards.
 *                              Transient: excluded from persisted saves
 *                              (encounters re-roll on load).
 * @property quests           - Player's quest log (Spec 08 Q7B per-objective
 *                              tracking).
 * @property flags            - Generic world flags set by dialogue / events.
 *                              Used by dialogue `requires.flag` gates and by
 *                              quest objectives of type `'flag'`.
 * @property moralMeter       - Moral choice difficulty meter (-100 to +100).
 *                              Tracks player alignment from choices: negative
 *                              values (ruthless), positive values (compassionate).
 *                              Affects available dialogue options and story paths.
 * @property rngState         - Current RNG seed state for deterministic replays.
 *                              Persisted and restored to maintain reproducible
 *                              random sequences across save/load cycles.
 * @property philosophicalAlignment - Three-axis alignment cube (Phase 42):
 *                              epistemology / outlook / scope, each integer
 *                              in [-100, +100], defaults 0/0/0. Buckets to
 *                              one of 27 cells in `philosophicalAlignmentLibrary`.
 *                              Orthogonal to `moralMeter` — see docs/philosophy.md.
 */
/**
 * Phase 73 — per-foe codex / journal entry unlocked when the player
 * befriends an enemy (`outcome === 'friendship'`). The engine
 * auto-appends `journalEntry.id` to `state.codex.unlockedEntries`
 * (de-duped) and surfaces `{ id, title }` on
 * `CombatEndReport.friendshipReward.codexEntryUnlocked`; the consumer
 * (mobile Codex tab, future CLI surface) looks up the entry body via
 * the source `Enemy` (or a future `CodexLibrary` registry). Closes
 * GH#65 ask 3.
 *
 * Semantically a Game-loop type (paired with `CodexState`); the
 * field rides on `Enemy.journalEntry?` which re-exports `CodexEntry`
 * from this module for the per-foe content site (see
 * `src/Enemy/types.ts` for the import + re-export shape).
 */
export interface CodexEntry {
    /** Stable id; consumed by Codex-tab UI as the row key. */
    id: string;
    /** Short label rendered on the unlock toast + Codex row header. */
    title: string;
    /** Long-form chronicle prose for the Codex entry body. */
    body: string;
}

/**
 * Phase 73 — codex slice on `GameState` (closes GH#65 ask 3).
 * Append-only collection of unlocked entry IDs. Each entry id maps
 * back to a `CodexEntry` on the source `Enemy` (or a future
 * dialogue / map-event surface that grants codex entries directly).
 * Consumers (mobile Codex tab, future CLI surface) render entry
 * bodies by looking up the id against the content registry.
 *
 * Wrapper shape (not flat `string[]`) so future per-entry metadata
 * (unlock-timestamp, read-status) can land additive-optionally
 * without breaking the existing surface. Same pattern as `QuestLog`.
 */
export interface CodexState {
    unlockedEntries: string[];
}

/**
 * Phase 109 — region-level consequences for befriend exploit/spare choices
 * against elite/miniboss enemies. Tracks the player's mercy decisions to
 * affect region boss behavior: exploiting blocks friendship counters,
 * sparing grants 'open-minded' status.
 */
export interface RegionConsequences {
    /** 
     * Regions where the player exploited a Befriend opening against an 
     * elite/miniboss. The region boss in these areas cannot gather 
     * friendship counters.
     */
    exploitedRegions: string[];
    
    /** 
     * Regions where the player spared an elite/miniboss through Befriend.
     * The region boss in these areas starts combat with 'open-minded' status.
     */
    sparedRegions: string[];
}

export interface GameState {
    version: number;
    /**
     * Phase 72 — UUID-shaped identifier for this run. Generated by
     * `generateRunId(() => getRng().random())` at `createNewGameState()`
     * time AND bumped on every `resetRun()` call (the consumer-facing
     * surface for "begin again at the hearth" flows). Persists in save
     * data so future runs-history features can key off per-run identity.
     * Closes GH#65 ask 2; legacy v5 saves get a default id via
     * `migrateV5toV6`.
     */
    runId: string;
    player: Character;
    world: WorldState;
    currentEncounter?: Encounter;
    quests: QuestLog;
    flags: string[];
    moralMeter: number;
    rngState: number;
    philosophicalAlignment: PhilosophicalAlignment;
    /**
     * Phase 63 — per-tree alignment-observer cache. Keyed by
     * `DialogueTree.id`; value is the player's alignment cell id at the
     * end of the last `applyDialogueChoice` against that tree.
     * Optional; `undefined` means no observations have been recorded yet
     * (the gate `playerAlignmentCellChangedSince` hides choices in that
     * case). Trees without an `id` are never written to the cache.
     */
    lastSeenAlignmentCells?: Record<string, string>;
    /**
     * Phase 73 — codex slice (closes GH#65 ask 3). Required state
     * slice; defaults to `{ unlockedEntries: [] }` on new games.
     * `migrateV6toV7` defaults the slice for legacy v6 saves.
     */
    codex: CodexState;
    /**
     * Phase 109 — region-level consequences tracking for befriend
     * exploit/spare choices against elite/miniboss enemies. Required
     * state slice; defaults to `{ exploitedRegions: [], sparedRegions: [] }`
     * on new games.
     */
    regionConsequences: RegionConsequences;
    /**
     * Phase 110 — faction reputation standings. Tracks player reputation
     * with various political factions across regions. Boss Befriend outcomes
     * can alter these standings. Required state slice; defaults to `{}`
     * (empty, all factions neutral) on new games.
     */
    factionReputations: FactionReputations;
}
