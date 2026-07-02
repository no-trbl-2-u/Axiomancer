/**
 * Quest Board minigame ("The Boy's Almanac") — store action glue.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/QuestBoard);
 * these wrappers thread the session through the mobile `quest` slice.
 * The board is FULLY SANDBOXED by design (decided 2026-06-12): it
 * reads nothing from `GameState`, and at claim time only the
 * completion record (board id + outcome tier) lands in flags. No
 * vitae, items, or currency cross the table in either direction.
 */

import type { GameState } from 'axiomancer-mechanics';

import {
    beginQuestBoard as engineBegin,
    acknowledgeQuestDusk as engineAcknowledgeDusk,
    chooseQuestSpaceOption as engineChooseOption,
    claimQuestBoardCompletion as engineClaim,
    continueQuestSpace as engineContinue,
    createQuestBoardSession,
    QUEST_BOARDS,
    rollQuestBone as engineRoll,
    useQuestCharm as engineUseCharm,
} from 'axiomancer-mechanics';
import type { QuestBoardSession, QuestCharmId, QuestOutcomeTier } from 'axiomancer-mechanics';
import { resolveMinigameSeed, resolveMinigameString } from '../minigame-seeds';
import { EMPTY_QUEST_SLICE, type AppStore } from '../store';

/** Flag prefix recording a finished board: `quest-board-done:<id>:<tier>`. */
export const QUEST_BOARD_DONE_FLAG_PREFIX = 'quest-board-done:';

/** Returns the recorded tier for a board, or null if never finished. */
export function questBoardDoneTier(flags: readonly string[] | undefined, boardId: string): QuestOutcomeTier | null {
    for (const flag of flags ?? []) {
        if (!flag.startsWith(`${QUEST_BOARD_DONE_FLAG_PREFIX}${boardId}:`)) continue;
        return flag.split(':')[2] as QuestOutcomeTier;
    }
    return null;
}

/**
 * Dev/test seed override. Playwright / dev tooling sets
 * `globalThis.__AXM_QUEST_SEED__` / `globalThis.__AXM_QUEST_BOARD__`
 * before triggering a quest to get a reproducible session.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_QUEST_SEED__: number | undefined;
    // eslint-disable-next-line no-var
    var __AXM_QUEST_BOARD__: string | undefined;
}

function setSession(store: AppStore, session: QuestBoardSession | null): void {
    store.setState({ quest: { session } });
}

export interface BeginQuestBoardOptions {
    boardId?: string;
    seed?: number;
}

export function beginQuestBoardAction(store: AppStore, options: BeginQuestBoardOptions = {}): boolean {
    const state = store.getState();
    if (state.quest?.session) return false; // one board on the table at a time
    const seed = resolveMinigameSeed('quest', options.seed, globalThis.__AXM_QUEST_SEED__);
    const boardId = resolveMinigameString(
        'quest',
        ['boardId', 'board'],
        options.boardId,
        globalThis.__AXM_QUEST_BOARD__,
        QUEST_BOARDS[0].id,
    )!;
    setSession(store, createQuestBoardSession(seed, boardId));
    return true;
}

/** Board-reveal overlay acknowledged: intro → idle. */
export function startQuestBoardPlayAction(store: AppStore): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineBegin(s));
}

export function rollQuestBoneAction(store: AppStore): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineRoll(s));
}

export function useQuestCharmAction(store: AppStore, charmId: QuestCharmId): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineUseCharm(s, charmId));
}

export function chooseQuestSpaceOptionAction(store: AppStore, optionId: string): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineChooseOption(s, optionId));
}

export function continueQuestSpaceAction(store: AppStore): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineContinue(s));
}

export function acknowledgeQuestDuskAction(store: AppStore): void {
    const s = store.getState().quest?.session;
    if (!s) return;
    setSession(store, engineAcknowledgeDusk(s));
}

export interface ClaimQuestBoardResult {
    applied: boolean;
    boardId: string | null;
    tier: QuestOutcomeTier | null;
    daysTaken: number;
    vowsKept: number;
}

const NOOP_CLAIM: ClaimQuestBoardResult = Object.freeze({
    applied: false,
    boardId: null,
    tier: null,
    daysTaken: 0,
    vowsKept: 0,
});

/**
 * Confirms the outcome ledger and records the completion — the ONLY
 * thing that leaves the table. The flag is cosmetic story state for
 * now (decided 2026-06-12); story gating reads it later. Re-finishing
 * a board updates the recorded tier rather than stacking flags.
 */
export function claimQuestBoardCompletionAction(store: AppStore): ClaimQuestBoardResult {
    const s = store.getState().quest?.session;
    if (!s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    const flags = (state.flags ?? []).filter(
        f => !f.startsWith(`${QUEST_BOARD_DONE_FLAG_PREFIX}${s.boardId}:`),
    );
    flags.push(`${QUEST_BOARD_DONE_FLAG_PREFIX}${s.boardId}:${outcome.tier}`);

    store.setState({ flags, quest: EMPTY_QUEST_SLICE } as never);

    // Persist — a finished story beat is exactly what explicit saves
    // exist for.
    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return {
        applied: true,
        boardId: s.boardId,
        tier: outcome.tier,
        daysTaken: outcome.daysTaken,
        vowsKept: outcome.vowsKept,
    };
}

/** Clears the session without a record (dev / navigation escape). */
export function abandonQuestBoardAction(store: AppStore): void {
    setSession(store, null);
}
