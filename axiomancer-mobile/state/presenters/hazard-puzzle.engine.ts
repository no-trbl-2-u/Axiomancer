/**
 * Hazard puzzle demo board presenter (dev menu only). Maps a puzzle layout,
 * its session and its outcome onto render-ready view models. Pure: no store
 * writes, no rolls, no rule decisions; legality comes from the engine's own
 * die rules, and the clock arithmetic lives here so a test can drive it.
 */

import {
    dieCanPowerCard,
    getHazardCardDef,
    getHazardDef,
    HAZARD_PUZZLE_CLOCK_SECONDS,
    HAZARD_PUZZLE_LIBRARY,
    HAZARD_PUZZLE_UNLOCK_DIE,
    hazardProjectedProgress,
    type HazardPuzzleLayout,
    type HazardPuzzleOutcome,
    type HazardPuzzleResult,
    type HazardPuzzleSession,
    type HazardPuzzleUnlock,
    type HazardRouteKey,
} from '@mechanics';
import {
    HAZARD_PUZZLE_CLEARED,
    HAZARD_PUZZLE_DIE_WORD,
    HAZARD_PUZZLE_NO_PENALTY,
    HAZARD_PUZZLE_SHORT,
    HAZARD_PUZZLE_TIME_UP,
    hazardPuzzleBandChip,
    hazardPuzzleClockSeconds,
    hazardPuzzleItemChip,
    hazardPuzzlePowerLabel,
    hazardPuzzleProgress,
    hazardPuzzleReached,
    hazardPuzzleReserve,
    hazardPuzzleRiskGoal,
    hazardPuzzleSafeGoal,
    hazardPuzzleScarChip,
    hazardPuzzleShillingsChip,
    hazardPuzzleUnlockBlank,
    hazardPuzzleUnlockCard,
    hazardPuzzleUnlockDie,
    hazardPuzzleUnlockLine,
    hazardPuzzleVitaeChip,
    hazardPuzzleXpChip,
    HAZARD_PUZZLE_BAND_LABEL,
} from './hazard-puzzle.copy';
import { hazardDieVM, hazardEntryCardVM, type HazardCardVM, type HazardDieVM } from './hazard.engine';

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------

export interface HazardPuzzleListItemVM {
    id: string;
    title: string;
    bandChip: string;
    testID: string;
}

export function selectHazardPuzzleListVM(
    library: readonly HazardPuzzleLayout[] = HAZARD_PUZZLE_LIBRARY,
): HazardPuzzleListItemVM[] {
    return library.map((l) => ({
        id: l.id,
        title: l.title,
        bandChip: hazardPuzzleBandChip(l.bands.risk),
        testID: `hazard-puzzle-pick-${l.id}`,
    }));
}

// ---------------------------------------------------------------------------
// Routes and the clock
// ---------------------------------------------------------------------------

export interface HazardPuzzleRouteVM {
    key: HazardRouteKey;
    name: string;
    goalLabel: string;
    bandLabel: string;
    clockLabel: string;
    testID: string;
}

/** Seconds on the clock for a route: the band constant of that route. */
export function hazardPuzzleClockFor(layout: HazardPuzzleLayout, route: HazardRouteKey): number {
    return HAZARD_PUZZLE_CLOCK_SECONDS[layout.bands[route]];
}

/** One second off the clock, never below zero. */
export function tickHazardPuzzleClock(remaining: number): number {
    return Math.max(0, remaining - 1);
}

/** True once the clock has run out: the board confirms as it stands. */
export function hazardPuzzleClockExpired(remaining: number): boolean {
    return remaining <= 0;
}

/** `m:ss`, the board's clock face. */
export function formatHazardPuzzleClock(remaining: number): string {
    const s = Math.max(0, Math.floor(remaining));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function goalLabel(layout: HazardPuzzleLayout, route: HazardRouteKey): string {
    if (route === 'risk') return hazardPuzzleRiskGoal(layout.goals.risk[0], layout.goals.risk[1]);
    return hazardPuzzleSafeGoal(layout.goals.safe);
}

export function selectHazardPuzzleRoutes(layout: HazardPuzzleLayout): HazardPuzzleRouteVM[] {
    const def = getHazardDef(layout.hazardId);
    return (['safe', 'risk'] as const).map((key) => ({
        key,
        name: key === 'risk' ? def.riskRouteName : def.safeRouteName,
        goalLabel: goalLabel(layout, key),
        bandLabel: HAZARD_PUZZLE_BAND_LABEL[layout.bands[key]],
        clockLabel: hazardPuzzleClockSeconds(hazardPuzzleClockFor(layout, key)),
        testID: `hazard-puzzle-route-${key}`,
    }));
}

// ---------------------------------------------------------------------------
// The stat-unlock line
// ---------------------------------------------------------------------------

function unlockPart(u: HazardPuzzleUnlock): string {
    if (u.kind === 'extraDie') return hazardPuzzleUnlockDie(u.stat, u.min, HAZARD_PUZZLE_DIE_WORD[HAZARD_PUZZLE_UNLOCK_DIE[u.stat]]);
    if (u.kind === 'extraCard') return hazardPuzzleUnlockCard(u.stat, u.min, getHazardCardDef(u.cardId).name);
    return hazardPuzzleUnlockBlank(u.stat, u.min, HAZARD_PUZZLE_DIE_WORD[u.face]);
}

/** Names what the player's stats unlocked (the unlocks the session was built with). */
export function selectHazardPuzzleUnlockLine(unlocks: readonly HazardPuzzleUnlock[]): string {
    return hazardPuzzleUnlockLine(unlocks.map(unlockPart));
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

export interface HazardPuzzlePowerOptionVM {
    dieId: string;
    label: string;
    testID: string;
}

export interface HazardPuzzleHandCardVM {
    card: HazardCardVM;
    testID: string;
}

export interface HazardPuzzleStagedCardVM {
    card: HazardCardVM;
    /** Dice that may power this card now (one per colour), empty once powered or applied. */
    powerOptions: HazardPuzzlePowerOptionVM[];
    canApply: boolean;
    canReturn: boolean;
    testID: string;
}

export interface HazardPuzzleBoardVM {
    title: string;
    routeName: string;
    goalLabel: string;
    progressLabel: string;
    clockLabel: string;
    clockUrgent: boolean;
    hand: HazardPuzzleHandCardVM[];
    staged: HazardPuzzleStagedCardVM[];
    dice: HazardDieVM[];
    reserveLabel: string;
    canConfirm: boolean;
}

/** Seconds left at which the clock face turns urgent. */
export const HAZARD_PUZZLE_URGENT_SECONDS = 10;

export function selectHazardPuzzleBoardVM(
    layout: HazardPuzzleLayout,
    session: HazardPuzzleSession,
    remaining: number,
): HazardPuzzleBoardVM {
    const board = session.board;
    const def = getHazardDef(layout.hazardId);
    const progress = hazardProjectedProgress(board);
    const playing = session.phase === 'playing';
    const staged = board.play.map((entry) => {
        const cardDef = getHazardCardDef(entry.cardId);
        const seen = new Set<string>();
        const powerOptions: HazardPuzzlePowerOptionVM[] = [];
        if (playing && !entry.applied && entry.dieId === null && !cardDef.dead) {
            for (const d of board.dice) {
                if (d.state !== 'available' || seen.has(d.kind) || !dieCanPowerCard(d.kind, cardDef)) continue;
                seen.add(d.kind);
                powerOptions.push({
                    dieId: d.id,
                    label: hazardPuzzlePowerLabel(HAZARD_PUZZLE_DIE_WORD[d.kind]),
                    testID: `hazard-puzzle-power-${entry.uid}-${d.kind}`,
                });
            }
        }
        return {
            card: hazardEntryCardVM(entry, board),
            powerOptions,
            canApply: playing && !entry.applied && cardDef.effect !== undefined && !cardDef.dead,
            canReturn: playing && !entry.applied,
            testID: `hazard-puzzle-staged-${entry.uid}`,
        };
    });
    return {
        title: layout.title,
        routeName: session.route === 'risk' ? def.riskRouteName : def.safeRouteName,
        goalLabel: goalLabel(layout, session.route),
        progressLabel: hazardPuzzleProgress(progress.force, progress.escape),
        clockLabel: formatHazardPuzzleClock(remaining),
        clockUrgent: remaining <= HAZARD_PUZZLE_URGENT_SECONDS,
        hand: board.hand.map((entry) => ({
            card: hazardEntryCardVM(entry, board),
            testID: `hazard-puzzle-hand-${entry.uid}`,
        })),
        staged,
        dice: board.dice.map(hazardDieVM),
        reserveLabel: hazardPuzzleReserve(board.drawPile.length),
        canConfirm: playing,
    };
}

// ---------------------------------------------------------------------------
// The outcome panel
// ---------------------------------------------------------------------------

export interface HazardPuzzleOutcomeVM {
    headline: string;
    reachedLabel: string;
    rewards: string[];
    penalties: string[];
}

export function selectHazardPuzzleOutcomeVM(
    result: HazardPuzzleResult,
    outcome: HazardPuzzleOutcome,
    timedOut: boolean,
): HazardPuzzleOutcomeVM {
    const headline = result.cleared ? HAZARD_PUZZLE_CLEARED : timedOut ? HAZARD_PUZZLE_TIME_UP : HAZARD_PUZZLE_SHORT;
    const rewards = [hazardPuzzleXpChip(outcome.xp), ...outcome.items.map((i) => hazardPuzzleItemChip(i.name))];
    if (outcome.shillings > 0) rewards.push(hazardPuzzleShillingsChip(outcome.shillings));
    const penalties: string[] = [];
    if (outcome.vitaeLoss > 0) penalties.push(hazardPuzzleVitaeChip(outcome.vitaeLoss));
    if (outcome.scar > 0) penalties.push(hazardPuzzleScarChip(outcome.scar));
    if (penalties.length === 0) penalties.push(HAZARD_PUZZLE_NO_PENALTY);
    return {
        headline,
        reachedLabel: hazardPuzzleReached(Math.round(result.p * 100)),
        rewards,
        penalties,
    };
}
