/**
 * Hermetic E2E — THE PATH (owner ruling 2026-09-02): the progression axes.
 *
 * A player's combat power does NOT grow through card rank alone. It grows
 * along six axes: staged decks, card removal, card upgrades, DIE UPGRADES,
 * ACT-REWARD DICE, and better signature items. Modelling only rank + stats is
 * what made every late-stage cell read unwinnable — the harness was sending an
 * act-one body at act-four content.
 *
 * This suite pins the two DICE axes end to end: the character carries them,
 * the encounter seeds them, and the tray honours them. It is a wiring guard,
 * not a balance band — it says nothing about how much either axis is worth.
 *
 * A NOTE ON WHAT THIS MEASURED (2026-09-02): with the axes wired, raising a
 * late-stage player from 2 bonus dice to 8 moved the playtest matrix by
 * exactly zero. Under the current dice law the player ROLLS N and DRAFTS ONE,
 * so extra dice buy better colour selection and more Conviction — not more
 * PAID plays. Owning more dice is therefore a real but WEAK axis until the
 * draft model lets a player draft more than one. Recorded here because the
 * wiring being correct and the axis being potent are different claims, and
 * only the first one is tested below.
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    dieFacesForUpgrade, MAX_DIE_UPGRADE_LEVEL, rollTurnDice, TURN_DICE_COUNT,
} from '../combat.dice';
import { initializeCombatEncounter, rollEncounterDice } from '../combat.engine';
import { buildStagePlayer, COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES } from '../combat.stage-profiles';

afterEach(() => vi.restoreAllMocks());

const rng = (): number => 0.5;

function playerWith(over: Partial<Character>): Character {
    const p = deepClone(Player);
    p.knownCards = ['spoiled-poultice'];
    return { ...p, ...over };
}

function openWith(over: Partial<Character>): ReturnType<typeof rollEncounterDice>['state'] {
    const s = initializeCombatEncounter(
        playerWith(over), deepClone(GraveLarva), ['spoiled-poultice'], 7,
    );
    return rollEncounterDice(s, rng).state;
}

describe('DIE UPGRADES — more mana faces, fewer dead ones', () => {
    it('each level strictly increases the share of LIVE faces', () => {
        const live = (level: number): number =>
            dieFacesForUpgrade(level).filter(f => f !== 'x').length;
        for (let l = 1; l <= MAX_DIE_UPGRADE_LEVEL; l++) {
            expect(live(l), `level ${l} must beat level ${l - 1}`).toBeGreaterThan(live(l - 1));
        }
        // The fully-honed die never rolls dead — that is what the expense buys.
        expect(live(MAX_DIE_UPGRADE_LEVEL)).toBe(dieFacesForUpgrade(MAX_DIE_UPGRADE_LEVEL).length);
    });

    it('clamps an out-of-range level instead of throwing', () => {
        expect(dieFacesForUpgrade(-5)).toEqual(dieFacesForUpgrade(0));
        expect(dieFacesForUpgrade(99)).toEqual(dieFacesForUpgrade(MAX_DIE_UPGRADE_LEVEL));
    });

    it('a fully-upgraded tray rolls no dead dice', () => {
        // Sweep the whole bag rather than one fixed rng value.
        for (let k = 0; k < 6; k++) {
            const fixed = (): number => k / 6;
            const dice = rollTurnDice(1, 6, fixed, MAX_DIE_UPGRADE_LEVEL);
            expect(dice.every(d => d.color !== 'x'), `face ${k} rolled dead`).toBe(true);
        }
    });

    it('the encounter seeds the level from the character', () => {
        expect(openWith({ dieUpgradeLevel: 2 }).dieUpgradeLevel).toBe(2);
        expect(openWith({}).dieUpgradeLevel).toBe(0);
    });
});

describe('ACT REWARD DICE — the tray grows with the campaign', () => {
    it('adds one die to every turn per banked act reward', () => {
        expect(openWith({}).dice).toHaveLength(TURN_DICE_COUNT);
        expect(openWith({ bonusTurnDice: 1 }).dice).toHaveLength(TURN_DICE_COUNT + 1);
        expect(openWith({ bonusTurnDice: 3 }).dice).toHaveLength(TURN_DICE_COUNT + 3);
    });

    it('never shrinks the tray on a negative or absent value', () => {
        expect(openWith({ bonusTurnDice: -4 }).dice).toHaveLength(TURN_DICE_COUNT);
        expect(openWith({}).bonusTurnDice).toBe(0);
    });
});

describe('the stage profiles carry the campaign, not just the level', () => {
    it('every axis is monotone across early -> mid -> late -> impossible', () => {
        const stages = COMBAT_STAGE_ORDER.map(id => COMBAT_STAGE_PROFILES[id]);
        for (let i = 1; i < stages.length; i++) {
            const prev = stages[i - 1];
            const next = stages[i];
            const where = `${prev.id} -> ${next.id}`;
            expect(next.bonusBaseDice, `bonusBaseDice regressed ${where}`)
                .toBeGreaterThanOrEqual(prev.bonusBaseDice);
            expect(next.dieUpgradeLevel, `dieUpgradeLevel regressed ${where}`)
                .toBeGreaterThanOrEqual(prev.dieUpgradeLevel);
            expect(next.upgradedCardShare, `upgradedCardShare regressed ${where}`)
                .toBeGreaterThanOrEqual(prev.upgradedCardShare);
        }
    });

    it('the early stage is the body the game starts you in', () => {
        const early = COMBAT_STAGE_PROFILES.early;
        expect(early.bonusBaseDice).toBe(0);
        expect(early.dieUpgradeLevel).toBe(0);
        expect(early.upgradedCardShare).toBe(0);
    });

    it('buildStagePlayer hands the dice axes to the encounter', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            const stage = COMBAT_STAGE_PROFILES[id];
            const player = buildStagePlayer(stage);
            expect(player.bonusTurnDice, `${id} bonus dice`).toBe(stage.bonusBaseDice);
            expect(player.dieUpgradeLevel, `${id} die upgrades`).toBe(stage.dieUpgradeLevel);
            const opened = rollEncounterDice(
                initializeCombatEncounter(player, deepClone(GraveLarva), player.knownCards.slice(0, 12), 7),
                rng,
            ).state;
            expect(opened.dice, `${id} tray size`).toHaveLength(TURN_DICE_COUNT + stage.bonusBaseDice);
        }
    });
});
