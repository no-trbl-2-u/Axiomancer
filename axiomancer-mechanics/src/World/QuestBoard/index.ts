/**
 * Quest Board minigame ("The Boy's Almanac") — Public API.
 *
 * The story-quest encounter: each main-story beat from
 * `content/story/story-overview.md` becomes an authored tabletop
 * board played inside the fiction. Fully sandboxed — the session
 * reads nothing from `GameState`; only the completion record (board
 * id + outcome tier) flows back, applied by the host.
 *
 * Note: the seeded-RNG helpers are re-exported under `questBoard*`
 * aliases because the Hazard and Gathering modules already export
 * their own `seedRng` / `nextFloat` / `nextInt` / `shuffle` from the
 * package root, and ambiguous star-exports would silently drop all.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    QuestPartKind,
    QuestPartTally,
    QuestSpaceKind,
    QuestGatherParams,
    QuestDuelParams,
    QuestSnagParams,
    QuestHearthParams,
    QuestMarketOffer,
    QuestMarketParams,
    QuestParleyOption,
    QuestParleyParams,
    QuestCacheFind,
    QuestCacheParams,
    QuestOmenParams,
    QuestSpaceDef,
    QuestCharmId,
    QuestCharmDef,
    QuestCharmState,
    QuestVowId,
    QuestVowDef,
    QuestVowStatus,
    QuestVowResult,
    QuestBoardDef,
    QuestSpaceResult,
    QuestSpaceOption,
    QuestPendingSpace,
    QuestBoardMetrics,
    QuestOutcomeTier,
    QuestBoardOutcome,
    QuestBoardPhase,
    QuestBoardSession,
} from './quest-board.types';

export {
    QUEST_PART_KINDS,
    EMPTY_PART_TALLY as EMPTY_QUEST_PART_TALLY,
} from './quest-board.types';

// ── Seeded RNG (aliased — see module note) ─────────────────────────────────
export type { QuestBoardRngState } from './quest-board.rng';
export {
    seedRng as questBoardSeedRng,
    nextFloat as questBoardNextFloat,
    nextInt as questBoardNextInt,
    rollDie as questBoardRollDie,
    shuffle as questBoardShuffle,
} from './quest-board.rng';

// ── Tuning ─────────────────────────────────────────────────────────────────
export {
    QUEST_BOARD_TUNING,
    QUEST_STRETCHES_PER_DAY,
    QUEST_CHARMS_DEALT,
    QUEST_VOWS_DEALT,
} from './quest-board.tuning';

// ── Authored content (boards, charms, vows) ────────────────────────────────
export {
    QUEST_BOARD_CHARMS,
    getQuestCharmDef,
    QUEST_BOARD_VOWS,
    getQuestVowDef,
    BUILD_THE_BOAT_BOARD,
    QUEST_BOARDS,
    getQuestBoardDef,
} from './quest-board.content';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    // selectors / previews
    questBoardDefOf,
    questPartsMissing,
    questBoardComplete,
    questVowResults,
    questBoardTierOf,
    // lifecycle
    createQuestBoardSession,
    beginQuestBoard,
    // play
    useQuestCharm,
    rollQuestBone,
    chooseQuestSpaceOption,
    continueQuestSpace,
    acknowledgeQuestDusk,
    // outcome
    claimQuestBoardCompletion,
} from './quest-board.engine';

// ── Balance simulator (A/B + e2e + playstyle) ─────────────────────────────
export type {
    QuestBoardPolicyId,
    QuestBoardSimRunResult,
    QuestBoardSimSummary,
    RunQuestBoardSimOptions,
    QuestBoardABResult,
    QuestBoardBalanceBands,
    QuestBoardBalanceReport,
} from './quest-board.sim';
export {
    simulateQuestBoard,
    runQuestBoardSim,
    runQuestBoardAB,
    generateQuestBoardBalanceReport,
} from './quest-board.sim';
