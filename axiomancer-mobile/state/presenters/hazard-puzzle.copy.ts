/**
 * Hazard puzzle demo board copy (dev menu only). Neutral register: this is a
 * dev surface for timing the demo puzzles, not story text. Titles and route
 * names come from the live hazard each demo reuses.
 */

import type { HazardDieKind, HazardPuzzleBand, HazardPuzzleStat } from '@mechanics';

/** Die names as the live hazard board prints them (gold reads YELLOW). */
export const HAZARD_PUZZLE_DIE_WORD: Record<HazardDieKind, string> = Object.freeze({
    red: 'RED',
    blue: 'BLUE',
    purple: 'PURPLE',
    gold: 'YELLOW',
    hex: 'BLANK',
});

export const HAZARD_PUZZLE_LIST_TITLE = 'HAZARD PUZZLES';
export const HAZARD_PUZZLE_LIST_INTRO = 'Fixed one-round demos. Pick a puzzle, then a route; the clock starts on the route.';
export const HAZARD_PUZZLE_BACK_LABEL = 'BACK';
export const HAZARD_PUZZLE_DISABLED = 'Dev tools are off in this build.';

export const HAZARD_PUZZLE_BAND_LABEL: Record<HazardPuzzleBand, string> = Object.freeze({
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
});

export const HAZARD_PUZZLE_STAT_LABEL: Record<HazardPuzzleStat, string> = Object.freeze({
    heart: 'HEART',
    body: 'BODY',
    mind: 'MIND',
});

export const HAZARD_PUZZLE_PICK_ROUTE = 'PICK A ROUTE. THE CLOCK STARTS WHEN YOU DO.';
export const HAZARD_PUZZLE_HAND_LABEL = 'HAND';
export const HAZARD_PUZZLE_STAGED_LABEL = 'IN PLAY';
export const HAZARD_PUZZLE_DICE_LABEL = 'DICE';
export const HAZARD_PUZZLE_STAGE_LABEL = 'PLAY';
export const HAZARD_PUZZLE_BIN_LABEL = 'BIN';
export const HAZARD_PUZZLE_RETURN_LABEL = 'RETURN';
export const HAZARD_PUZZLE_APPLY_LABEL = 'APPLY';
export const HAZARD_PUZZLE_CONFIRM_LABEL = 'CONFIRM';
export const HAZARD_PUZZLE_CLAIM_LABEL = 'CLAIM AND LEAVE';
export const HAZARD_PUZZLE_NO_UNLOCKS = 'Your stats unlock nothing here.';

export function hazardPuzzleBandChip(band: HazardPuzzleBand): string {
    return `${HAZARD_PUZZLE_BAND_LABEL[band]} ON THE RISK ROUTE`;
}

export function hazardPuzzleSafeGoal(goal: number): string {
    return `REACH ${goal} FORCE + ESCAPE`;
}

export function hazardPuzzleRiskGoal(force: number, escape: number): string {
    return `REACH ${force} FORCE AND ${escape} ESCAPE`;
}

export function hazardPuzzleProgress(force: number, escape: number): string {
    return `FORCE ${force} · ESCAPE ${escape}`;
}

export function hazardPuzzleReserve(count: number): string {
    return count === 1 ? '1 CARD IN RESERVE' : `${count} CARDS IN RESERVE`;
}

export function hazardPuzzleClockSeconds(seconds: number): string {
    return `${seconds} S ON THE CLOCK`;
}

export function hazardPuzzlePowerLabel(dieWord: string): string {
    return `POWER: ${dieWord}`;
}

export function hazardPuzzleUnlockLine(parts: readonly string[]): string {
    return parts.length === 0 ? HAZARD_PUZZLE_NO_UNLOCKS : `Your stats unlock: ${parts.join('; ')}.`;
}

export function hazardPuzzleUnlockDie(stat: HazardPuzzleStat, min: number, dieWord: string): string {
    return `+1 ${dieWord} die (${HAZARD_PUZZLE_STAT_LABEL[stat]} ${min})`;
}

export function hazardPuzzleUnlockCard(stat: HazardPuzzleStat, min: number, cardName: string): string {
    return `${cardName} joins the hand (${HAZARD_PUZZLE_STAT_LABEL[stat]} ${min})`;
}

export function hazardPuzzleUnlockBlank(stat: HazardPuzzleStat, min: number, dieWord: string): string {
    return `blank dice turn ${dieWord} (${HAZARD_PUZZLE_STAT_LABEL[stat]} ${min})`;
}

export const HAZARD_PUZZLE_CLEARED = 'CLEARED';
export const HAZARD_PUZZLE_SHORT = 'FELL SHORT';
export const HAZARD_PUZZLE_TIME_UP = 'TIME RAN OUT';

export function hazardPuzzleReached(percent: number): string {
    return `${percent}% OF THE GOAL`;
}

export function hazardPuzzleXpChip(xp: number): string {
    return `+${xp} XP`;
}

export function hazardPuzzleItemChip(name: string): string {
    return `+ ${name.toUpperCase()}`;
}

export function hazardPuzzleShillingsChip(shillings: number): string {
    return `+${shillings} SHILLINGS`;
}

export function hazardPuzzleVitaeChip(vitae: number): string {
    return `-${vitae} VITAE`;
}

export function hazardPuzzleScarChip(scar: number): string {
    return `SCARRED: -${scar} MAX VITAE UNTIL YOU REST`;
}

export const HAZARD_PUZZLE_REWARDS_LABEL = 'GAINED';
export const HAZARD_PUZZLE_PENALTY_LABEL = 'LOST';
export const HAZARD_PUZZLE_NO_PENALTY = 'Nothing lost.';
