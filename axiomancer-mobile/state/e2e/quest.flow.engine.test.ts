/**
 * Hermetic E2E Tests — Quest Board minigame store flow.
 *
 * Drives full plays of the build-the-boat board through the store
 * action layer: begin → intro → roll/choose/continue/dusk → outcome
 * → claim, and verifies the sandbox doctrine: NOTHING but the
 * completion flag touches live game state. Seeded; no timers, no
 * network.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { GameState, QuestBoardSession } from 'axiomancer-mechanics';
import { BUILD_THE_BOAT_BOARD } from 'axiomancer-mechanics';

import { createAppActions, type AppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { QUEST_BOARD_DONE_FLAG_PREFIX, questBoardDoneTier } from '@/state/quest/store-actions';
import { selectQuestBoardVM } from '@/state/presenters/quest.engine';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { __AXM_QUEST_SEED__?: number }).__AXM_QUEST_SEED__;
    delete (globalThis as { __AXM_QUEST_BOARD__?: string }).__AXM_QUEST_BOARD__;
});

function makeStoreAndActions(): { store: AppStore; actions: AppActions } {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return { store, actions: createAppActions(store) };
}

function session(store: AppStore): QuestBoardSession {
    const s = store.getState().quest.session;
    if (!s) throw new Error('expected an active quest-board session');
    return s;
}

function rigSession(store: AppStore, over: Partial<QuestBoardSession>): void {
    store.setState({ quest: { session: { ...session(store), ...over } } });
}

/** Plays whole turns (first-enabled-option policy) until the outcome. */
function playToOutcome(store: AppStore, actions: AppActions): void {
    for (let i = 0; i < 600; i++) {
        const s = session(store);
        if (s.phase === 'outcome') return;
        if (s.phase === 'idle') {
            actions.rollQuestBone();
            continue;
        }
        if (s.phase === 'space' && s.pending !== null) {
            if (s.pending.result === null) {
                const enabled = s.pending.options.filter(o => !o.disabledReason);
                const pick = s.pending.kind === 'market'
                    ? enabled.find(o => o.id === 'leave')!
                    : enabled[0];
                actions.chooseQuestSpaceOption(pick.id);
            } else {
                actions.continueQuestSpace();
            }
            continue;
        }
        if (s.phase === 'dusk') {
            actions.acknowledgeQuestDusk();
            continue;
        }
        throw new Error(`unexpected phase ${s.phase}`);
    }
    throw new Error('no outcome after 600 steps');
}

describe('quest board store flow', () => {
    it('begin → intro → idle, one board on the table at a time', () => {
        const { store, actions } = makeStoreAndActions();
        expect(actions.beginQuestBoard({ seed: 7, boardId: 'build-the-boat' })).toBe(true);
        expect(actions.beginQuestBoard({ seed: 8 })).toBe(false);
        expect(session(store).phase).toBe('intro');
        actions.startQuestBoardPlay();
        expect(session(store).phase).toBe('idle');

        const vm = selectQuestBoardVM(store.getState());
        expect(vm.active).toBe(true);
        expect(vm.title).toBe(BUILD_THE_BOAT_BOARD.title);
        expect(vm.spaces).toHaveLength(BUILD_THE_BOAT_BOARD.spaces.length);
        expect(vm.spaces[0].isSlipway).toBe(true);
        expect(vm.spaces[0].isPiece).toBe(true);
    });

    it('a full play is fully sandboxed: only the completion flag lands', () => {
        const { store, actions } = makeStoreAndActions();
        const before = store.getState() as unknown as GameState;
        const beforeHealth = before.player.health;
        const beforeCurrency = before.player.currency;
        const beforeInventory = before.player.inventory.length;

        actions.beginQuestBoard({ seed: 42 });
        actions.startQuestBoardPlay();
        playToOutcome(store, actions);

        const outcome = session(store).outcome!;
        const result = actions.claimQuestBoardCompletion();
        expect(result.applied).toBe(true);
        expect(result.boardId).toBe('build-the-boat');
        expect(result.tier).toBe(outcome.tier);

        const after = store.getState() as unknown as GameState;
        // Sandbox: no vitae, coin, or items crossed the table.
        expect(after.player.health).toBe(beforeHealth);
        expect(after.player.currency).toBe(beforeCurrency);
        expect(after.player.inventory.length).toBe(beforeInventory);
        // The one thing that DID land: the completion record.
        expect(after.flags).toContain(
            `${QUEST_BOARD_DONE_FLAG_PREFIX}build-the-boat:${outcome.tier}`,
        );
        expect(questBoardDoneTier(after.flags, 'build-the-boat')).toBe(outcome.tier);
        // Slice cleared.
        expect(store.getState().quest.session).toBeNull();
    });

    it('re-finishing a board updates the recorded tier instead of stacking', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ seed: 42 });
        actions.startQuestBoardPlay();
        playToOutcome(store, actions);
        actions.claimQuestBoardCompletion();

        actions.beginQuestBoard({ seed: 1234 });
        actions.startQuestBoardPlay();
        playToOutcome(store, actions);
        actions.claimQuestBoardCompletion();

        const flags = (store.getState() as unknown as GameState).flags ?? [];
        const records = flags.filter(f => f.startsWith(`${QUEST_BOARD_DONE_FLAG_PREFIX}build-the-boat:`));
        expect(records).toHaveLength(1);
    });

    it('completion pre-empts the arrival space when the slipway fits the last part', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ seed: 7 });
        actions.startQuestBoardPlay();
        // Carry exactly the full requirement, stand one space short.
        rigSession(store, {
            pos: BUILD_THE_BOAT_BOARD.spaces.length - 1,
            parts: { ...BUILD_THE_BOAT_BOARD.partsRequired },
        });
        actions.rollQuestBone();
        const s = session(store);
        expect(s.phase).toBe('outcome');
        expect(s.outcome).not.toBeNull();
        const vm = selectQuestBoardVM(store.getState());
        expect(vm.outcome).not.toBeNull();
        expect(vm.outcome!.tierLabel.length).toBeGreaterThan(0);
        expect(vm.boatProgress).toBe(1);
    });

    it('abandon clears the table without a record', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ seed: 7 });
        actions.abandonQuestBoard();
        expect(store.getState().quest.session).toBeNull();
        const flags = (store.getState() as unknown as GameState).flags ?? [];
        expect(flags.some(f => f.startsWith(QUEST_BOARD_DONE_FLAG_PREFIX))).toBe(false);
    });

    it('claim before the outcome is a guarded no-op', () => {
        const { store, actions } = makeStoreAndActions();
        actions.beginQuestBoard({ seed: 7 });
        actions.startQuestBoardPlay();
        const result = actions.claimQuestBoardCompletion();
        expect(result.applied).toBe(false);
        expect(session(store).phase).toBe('idle');
    });
});
