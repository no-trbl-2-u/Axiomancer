/**
 * UI-only flag tracking whether the player is currently in combat.
 *
 * This is a temporary shim: once Spec 02 wires the engine store into the
 * app, callers should swap to `useGameStore(s => s.combat !== null)` and
 * this module can be deleted.
 *
 * Also carries a one-shot "last outcome" signal (Phase 41 port) the
 * exploration screen reads to render the post-victory aftermath
 * banner. When combat exits via `exitCombatWith(outcome)`, the
 * outcome stays on the context until the next consumer calls
 * `clearLastOutcome()` (typically the banner's auto-dismiss timer).
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Item } from 'axiomancer-mechanics';

export type CombatOutcome = 'victory' | 'defeat' | 'flee' | 'parley';

/**
 * Phase 70 Tick A — snapshot captured at the moment combat exits
 * with `victory` (or, in later ticks, `parley` / `defeat`). The
 * combat slice is cleared as part of `actions.endCombat()`, so the
 * aftermath panel can't read live state — the calling site snapshots
 * the fields the panel needs and stashes them here for the modal
 * mode swap to consume.
 *
 * Victory carries the engine `CombatEndReport` spoils (`xpGained`
 * + rolled `loot`); the presenter maps the loot into the panel's
 * spoils list and collapses the (now item-based) currency cell.
 *
 * Discriminated union so later ticks can extend without churn — the
 * `variant` field keys off the outcome class. Tick A ships
 * `'victory'` only.
 */
export type AftermathData =
    | {
          variant: 'victory';
          enemy: {
              name: string;
              description: string;
              level: number;
              /**
               * Phase 76 — per-foe chronicle lines from the engine
               * (`axiomancer-mechanics` 0.11.0). All optional; the
               * aftermath presenter falls back to the generic
               * per-tier phrase when the field is absent.
               */
              finalBlowLines?: { brutal: string; quiet: string; ironic: string };
              pactLines?: { quiet: string; setDown: string; heavy: string };
              causeLines?: { brutal: string; broken: string; quiet: string };
          };
          finalBlow: { skillName: string | null; damage: number; descriptor: string | null } | null;
          /** Engine-granted XP (`CombatEndReport.xpGained`). */
          xpReward: number | null;
          /**
           * Engine-granted loot from the combat-end report
           * (`CombatEndReport.loot`) — rolled and already applied to
           * the player's inventory by mechanics' END_COMBAT reducer.
           * The aftermath presenter maps these into the spoils list.
           * Optional so older snapshots stay valid; absent reads as
           * an empty drop.
           */
          loot?: Item[];
      }
    | {
          variant: 'parley';
          enemy: {
              name: string;
              description: string;
              level: number;
              /**
               * Phase 76 — per-foe chronicle lines from the engine
               * (`axiomancer-mechanics` 0.11.0). All optional; the
               * aftermath presenter falls back to the generic
               * per-tier phrase when the field is absent.
               */
              finalBlowLines?: { brutal: string; quiet: string; ironic: string };
              pactLines?: { quiet: string; setDown: string; heavy: string };
              causeLines?: { brutal: string; broken: string; quiet: string };
          };
          xpReward: number | null;
          /**
           * Optional journal entry unlocked by the pact. Engine doesn't
           * yet expose this — the snapshot stays null and the panel
           * collapses the "A NEW ENTRY" section. Promote to engine
           * integration as a Phase 70 follow-up when the writers
           * surface per-foe codex entries.
           */
          journalEntry: { bookName: string; entryTitle: string; preview: string } | null;
      }
    | {
          variant: 'defeat';
          /** The killer — the foe that delivered the final blow. */
          enemy: {
              name: string;
              description: string;
              level: number;
              /**
               * Phase 76 — per-foe chronicle lines from the engine
               * (`axiomancer-mechanics` 0.11.0). All optional; the
               * aftermath presenter falls back to the generic
               * per-tier phrase when the field is absent.
               */
              finalBlowLines?: { brutal: string; quiet: string; ironic: string };
              pactLines?: { quiet: string; setDown: string; heavy: string };
              causeLines?: { brutal: string; broken: string; quiet: string };
          };
          /** Character name snapshot (the fallen pilgrim). Uppercased
           *  by the presenter; raw form here. */
          characterName: string;
          /**
           * Final-blow data captured before `actions.endCombat()`
           * cleared the slice (mirror of the victory branch's
           * field). The damage figure here is the damage taken by
           * the player on the killing round, not damage dealt.
           */
          finalBlow: { skillName: string | null; damage: number; descriptor: string | null } | null;
          /**
           * Run summary snapshot — `roundsEndured` comes from the
           * combat slice; `encountersFaced` + `deepestNodeId` come
           * from the mobile-side run-stats counter (engine doesn't
           * yet expose run-level progression).
           */
          runSummary: {
              roundsEndured: number;
              encountersFaced: number;
              deepestNodeId: string | null;
              currentMapId: string | null;
          };
      };

export interface CombatModeApi {
    inCombat: boolean;
    enterCombat: () => void;
    exitCombat: () => void;
    /**
     * One-shot signal of the previous combat's outcome, or `null`
     * when there's nothing fresh to surface. Cleared by
     * `clearLastOutcome()` once the consumer has acted on it.
     */
    lastOutcome: CombatOutcome | null;
    /**
     * Exit combat and stash the outcome for the next consumer to
     * read. Equivalent to `exitCombat()` followed by setting the
     * outcome; combined into one call so the in-combat → outcome
     * transition is atomic for downstream effects.
     */
    exitCombatWith: (outcome: CombatOutcome, data?: AftermathData) => void;
    /** Clear the lastOutcome signal — called after a consumer acts on it. */
    clearLastOutcome: () => void;
    /**
     * Phase 70 Tick A — snapshot stashed alongside `lastOutcome`.
     * The aftermath panel reads this for enemy / final-blow / reward
     * data instead of the (now-null) combat slice. Cleared by
     * `dismissAftermath()` when the panel's CARRY ON button fires.
     */
    aftermathData: AftermathData | null;
    /**
     * Phase 70 Tick A — the encounter-modal aftermath panel's
     * CARRY ON button calls this to atomically clear the outcome
     * signal, drop the snapshot, and close the encounter modal. The
     * combat slice itself is cleared earlier (by `actions.endCombat()`
     * at the moment the exit fired); this is just the modal-side
     * teardown.
     */
    dismissAftermath: () => void;
    /**
     * Phase 63c — true while the encounter modal is mounted (prelude,
     * in-modal combat, or aftermath). Drives two contracts:
     *
     *   1. Exploration keeps `<EncounterModalOverlay>` mounted across
     *      the entire prelude → combat → aftermath lifecycle, even
     *      after `state.combat` goes non-null (which would otherwise
     *      flip `selectHasActiveEvent` to false and unmount the modal
     *      mid-encounter).
     *   2. The tab bar hides while a modal session is active, enforcing
     *      the "hard stop" — user can't switch tabs until the encounter
     *      resolves (chat1: "user cannot exit these modals").
     *
     * Set true via `openEncounterModal()` when the encounter prelude
     * mounts; cleared via `closeEncounterModal()` when the aftermath
     * dismisses (or the player flees / dies).
     */
    inEncounterModal: boolean;
    openEncounterModal: () => void;
    closeEncounterModal: () => void;
    /**
     * Phase 70 Tick C — mobile-side run-summary counters. The
     * engine doesn't currently surface run-level progression
     * (encounters faced, deepest node reached), so the shim
     * tracks them in-session for the defeat panel's run-summary
     * ledger.
     *
     * `encountersFaced` increments on each `enterCombat()` call —
     * any combat you got past (regardless of outcome) counts as
     * "faced." The defeat panel labels the count "encounters
     * survived" to match the design's chronicle voice, but the
     * semantics are "combats begun this run."
     *
     * `deepestNodeId` is updated by callers (typically the
     * exploration screen on `onNodePress`) via `recordDeepestNode`.
     * It carries the latest node the player visited; the panel
     * formats it as the "deepest node" ledger line. No depth
     * comparison is done — the most-recent node wins.
     *
     * Both fields persist for the lifetime of the provider; a
     * future "new game" / "respawn" flow would need to reset them
     * explicitly via `resetRunStats()`.
     */
    encountersFaced: number;
    deepestNodeId: string | null;
    recordDeepestNode: (nodeId: string) => void;
    resetRunStats: () => void;
}

const CombatModeContext = createContext<CombatModeApi | null>(null);

export function CombatModeProvider({ children }: { children: React.ReactNode }) {
    const [inCombat, setInCombat] = useState<boolean>(false);
    const [lastOutcome, setLastOutcome] = useState<CombatOutcome | null>(null);
    const [aftermathData, setAftermathData] = useState<AftermathData | null>(null);
    const [inEncounterModal, setInEncounterModal] = useState<boolean>(false);
    const [encountersFaced, setEncountersFaced] = useState<number>(0);
    const [deepestNodeId, setDeepestNodeId] = useState<string | null>(null);

    const enterCombat = useCallback(() => {
        setInCombat(true);
        setLastOutcome(null);
        setAftermathData(null);
        setEncountersFaced((n) => n + 1);
    }, []);
    const recordDeepestNode = useCallback((nodeId: string) => {
        setDeepestNodeId(nodeId);
    }, []);
    const resetRunStats = useCallback(() => {
        setEncountersFaced(0);
        setDeepestNodeId(null);
    }, []);
    const exitCombat = useCallback(() => setInCombat(false), []);
    const exitCombatWith = useCallback((outcome: CombatOutcome, data?: AftermathData) => {
        setInCombat(false);
        setLastOutcome(outcome);
        setAftermathData(data ?? null);
    }, []);
    const clearLastOutcome = useCallback(() => {
        setLastOutcome(null);
        setAftermathData(null);
    }, []);
    const openEncounterModal = useCallback(() => setInEncounterModal(true), []);
    const closeEncounterModal = useCallback(() => setInEncounterModal(false), []);
    const dismissAftermath = useCallback(() => {
        setLastOutcome(null);
        setAftermathData(null);
        setInEncounterModal(false);
    }, []);

    const value = useMemo<CombatModeApi>(
        () => ({
            inCombat,
            enterCombat,
            exitCombat,
            lastOutcome,
            exitCombatWith,
            clearLastOutcome,
            aftermathData,
            dismissAftermath,
            inEncounterModal,
            openEncounterModal,
            closeEncounterModal,
            encountersFaced,
            deepestNodeId,
            recordDeepestNode,
            resetRunStats,
        }),
        [
            inCombat,
            enterCombat,
            exitCombat,
            lastOutcome,
            exitCombatWith,
            clearLastOutcome,
            aftermathData,
            dismissAftermath,
            inEncounterModal,
            openEncounterModal,
            closeEncounterModal,
            encountersFaced,
            deepestNodeId,
            recordDeepestNode,
            resetRunStats,
        ],
    );

    return <CombatModeContext.Provider value={value}>{children}</CombatModeContext.Provider>;
}

export function useCombatMode(): CombatModeApi {
    const ctx = useContext(CombatModeContext);
    if (ctx === null) {
        throw new Error('useCombatMode must be used inside <CombatModeProvider>');
    }
    return ctx;
}
