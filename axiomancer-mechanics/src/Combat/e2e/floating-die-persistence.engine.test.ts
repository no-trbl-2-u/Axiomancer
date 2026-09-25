/**
 * Hermetic E2E — CROSS-COMBAT floating-die persistence (spec 32 v3 §5).
 *
 * The handoff's open checklist item (2026-07-09): the save-back seam was only
 * unit-covered — this pins the WHOLE loop through real encounters:
 *
 *   fight 1: forge a float (a sandbox fixture mirroring the retired
 *   ex-nihilo — see the FORGE registration below) → combat ends →
 *   getFloatingDiceColors → Character.floatingDice (the save-back) →
 *   fight 2: the float materializes in the opening tray → spend it (bypassing
 *   the draft) → gone forever → fight 3 opens with an empty pool.
 *
 * Plus the seam under the real auto-runner (`runHazardCombatAutoEncounter` ×2
 * — the map-run shape): the pool never grows without a forge card in the deck
 * and survives the write-back round-trip between runs.
 *
 * Seeded RNG only; no disk / network / TTY.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, draftStanceDie,
    getFloatingDiceColors,
} from '../combat.engine';
import { FLOATING_DICE_CAP } from '../combat.dice';
import { runHazardCombatAutoEncounter } from '../../test-utils/combat-autoplay';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

// PROFANE CANON (2026-08-08): `forge_floating_die` lost its library carrier
// (ex-nihilo, retired with the forge theme). The verb — and the cross-combat
// persistence seam this file pins — is still engine-live, so a SYNTHETIC
// sandbox fixture mirroring the retired card's exact shape forges the float.
const FORGE = 'qa-ex-nihilo';    // mind spell fixture: FORGE a WILD floating die
const DOT = 'spoiled-poultice';  // body spell (canon starter): Poison — a wild float powers it

registerSandboxCards([
    {
        id: FORGE, name: 'QA Ex Nihilo (forge fixture)',
        philosophicalAspect: 'mind', description: 'forge_floating_die fixture', tier: 2,
        targetType: 'self', rank: 4, cardType: 'spell',
        free: { pips: 1 },
        specialMechanics: [
            { kind: 'forge_floating_die', color: 'wild' },
            { kind: 'bank_spent_die' },
        ],
    },
]);

function makePlayer(cards: string[], floatingDice: ('heart' | 'body' | 'mind' | 'wild')[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    p.floatingDice = floatingDice.slice();
    return p;
}

function makeEnemy(hp: number): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-float-persistence-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    return e;
}

/** Forces this turn's draft pool to known colors (deterministic; keeps floats). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    const floating = state.dice.filter(d => d.floating);
    return { ...state, dice: [...dice, ...floating], draftedDieId: null, turn };
}

function playFromHand(state: CombatEncounterState, cardId: string, useBottom = true, dieId?: string) {
    const entry = state.hand.find(h => h.cardId === cardId);
    expect(entry, `${cardId} should be in hand`).toBeDefined();
    return playCombatCard(state, { uid: entry!.uid }, useBottom, dieId);
}

describe('GHOST DICE — cross-combat persistence (the save-back seam, full loop)', () => {
    it('forge in fight 1 → save-back → fight 2 opening tray → spend → fight 3 empty', () => {
        // ── FIGHT 1: forge the float ────────────────────────────────────────
        const player1 = makePlayer([FORGE, DOT, DOT, DOT, DOT]);
        let s1 = initializeCombatEncounter(player1, makeEnemy(80), [FORGE, DOT, DOT, DOT, DOT], 7);
        s1 = rollEncounterDice(s1).state;
        s1 = setDice(s1, ['mind', 'x']);
        s1 = draftStanceDie(s1, s1.dice[0].id).state;
        const forged = playFromHand(s1, FORGE, true);
        const floated = forged.events.find(e => e.kind === 'die-floated') as { dieId: string; color: string } | undefined;
        expect(floated).toBeDefined();
        expect(floated!.color).toBe('wild');
        s1 = forged.state;

        // The save-back seam — exactly what the panel writes to the character.
        const saved = getFloatingDiceColors(s1);
        expect(saved).toEqual(['wild']);

        // ── FIGHT 2: the float arrives in the OPENING tray ──────────────────
        const player2 = makePlayer([DOT, DOT, DOT, DOT], saved);
        let s2 = initializeCombatEncounter(player2, makeEnemy(80), [DOT, DOT, DOT, DOT], 11);
        s2 = rollEncounterDice(s2).state;
        expect(s2.floatingDice?.map(d => d.color)).toEqual(['wild']);
        const tray = s2.dice.find(d => d.floating);
        expect(tray, 'the persisted float must sit in the opening tray').toBeDefined();
        expect(tray!.state).toBe('available');
        expect(tray!.color).toBe('wild');

        // Spend it WITHOUT drafting (floats bypass the 1-die rule); a wild
        // float is color-legal on the body DoT.
        expect(s2.draftedDieId).toBeNull();
        const spent = playFromHand(s2, DOT, true, tray!.id);
        expect(spent.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(spent.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
        s2 = spent.state;
        expect(s2.floatingDice).toEqual([]);

        // ── FIGHT 3: consumed forever — nothing to materialize ──────────────
        const player3 = makePlayer([DOT, DOT, DOT, DOT], getFloatingDiceColors(s2));
        let s3 = initializeCombatEncounter(player3, makeEnemy(80), [DOT, DOT, DOT, DOT], 13);
        s3 = rollEncounterDice(s3).state;
        expect(s3.floatingDice ?? []).toEqual([]);
        expect(s3.dice.some(d => d.floating)).toBe(false);
    });

    it('a stale over-cap save materializes at most FLOATING_DICE_CAP floats', () => {
        const player = makePlayer([DOT, DOT, DOT, DOT], ['wild', 'heart', 'body', 'mind']);
        let s = initializeCombatEncounter(player, makeEnemy(80), [DOT, DOT, DOT, DOT], 17);
        s = rollEncounterDice(s).state;
        expect(s.floatingDice?.length).toBe(FLOATING_DICE_CAP);
        expect(s.dice.filter(d => d.floating).length).toBe(FLOATING_DICE_CAP);
    });

    it('auto-runner ×2 (the map-run shape): the pool survives the round-trip and never grows without a forge', () => {
        const VALID = new Set(['heart', 'body', 'mind', 'wild']);
        // Run 1 — a forge-free deck carrying one persisted wild float.
        const p1 = makePlayer([DOT, DOT, DOT, DOT, DOT], ['wild']);
        const r1 = runHazardCombatAutoEncounter(p1, makeEnemy(60), { seed: 5, policy: 'status' });
        expect(r1.phaseCount).toBeGreaterThan(0);
        const pool1 = getFloatingDiceColors(r1.state);
        expect(pool1.length).toBeLessThanOrEqual(1);      // spent or kept — never invented
        pool1.forEach(c => expect(VALID.has(c)).toBe(true));

        // The seam between fights: write back, run again on the survivor pool.
        const p2 = makePlayer([DOT, DOT, DOT, DOT, DOT], pool1);
        const r2 = runHazardCombatAutoEncounter(p2, makeEnemy(60), { seed: 9, policy: 'status' });
        expect(r2.phaseCount).toBeGreaterThan(0);
        const pool2 = getFloatingDiceColors(r2.state);
        expect(pool2.length).toBeLessThanOrEqual(pool1.length);
        pool2.forEach(c => expect(VALID.has(c)).toBe(true));
    });
});
