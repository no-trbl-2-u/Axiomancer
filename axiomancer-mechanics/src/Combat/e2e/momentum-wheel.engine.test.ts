/**
 * Hermetic E2E — combat MOMENTUM, engine-native (Phase 31 EA-6, now the
 * spec 33 null-reset chain `momentumV2`).
 *
 * D7 (the OFF dice path deleted): the v1 momentum WHEEL (`momentumWheel`,
 * advanced by every landed play incl. FREE ones) left with the draft model,
 * and its truth table with it. The chain's own truth table (start / advance /
 * break-to-null / surge) lives in `upgradeable-dice.engine.test.ts`; what
 * stays here are the rules this file ratified that still hold:
 *   - a FIZZLED play does NOT advance momentum;
 *   - a FREE line never touches momentum (spec 33 §3 rule 5);
 *   - the temporary momentum die never survives to the character save.
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, getFloatingDiceColors,
} from '../combat.engine';
import { SURGE_DIE_PREFIX } from '../combat.upgradeable-dice';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// One riderless spell per stance color, so these fixtures isolate the
// momentum reducer from every other play concern.
registerSandboxCards([
    {
        id: 'qa-wheel-heart', name: 'QA Wheel Heart',
        philosophicalAspect: 'heart', description: 'wheel-test heart fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-wheel-body', name: 'QA Wheel Body',
        philosophicalAspect: 'body', description: 'wheel-test body fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'qa-wheel-mind', name: 'QA Wheel Mind',
        philosophicalAspect: 'mind', description: 'wheel-test mind fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
    },
    // Phase 33d (GLYPHS pilot) — a FREE-line glyphCharge fixture for the
    // spec 33 §3 rule 5 regression below ("FREE lines never touch momentum").
    {
        id: 'qa-wheel-glyph-charge', name: 'QA Wheel Glyph Charge',
        philosophicalAspect: 'heart', description: 'wheel-test glyphCharge fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
        free: {
            glyphCharge: 1,
            glyphChargeFallback: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
        },
    },
]);

const rng = (): number => 0.5;

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    p.floatingDice = [];
    return p;
}

function makeEnemy(): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-wheel-dummy';
    e.health = 500; e.maxHealth = 500; e.effects = [];
    return e;
}

const WHEEL_DECK = ['qa-wheel-heart', 'qa-wheel-heart', 'qa-wheel-body', 'qa-wheel-body', 'qa-wheel-mind', 'qa-wheel-mind'];

function open(): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(WHEEL_DECK), makeEnemy(), WHEEL_DECK, 7);
    s = rollEncounterDice(s, rng).state;
    // Keep-hand rule: the opening hand is 5 cards, one short of the 6-card
    // fixture deck — pin the hand so every wheel scenario (two hearts, one of
    // each stance) is present regardless of which card the shuffle leaves out.
    const pinned = ['qa-wheel-heart', 'qa-wheel-heart', 'qa-wheel-body', 'qa-wheel-mind', 'qa-wheel-body'];
    s = {
        ...s,
        hand: pinned.map((cardId, i) => ({ uid: `w${i}`, cardId })),
        drawPile: ['qa-wheel-mind'],
    };
    return s;
}

/** Plays `cardId`'s PAID line powered by a fresh wild MANA die pinned into
 *  the tray (the rolled faces are left out of it), asserting it LANDED. The
 *  previous pinned die (spent) is dropped first so the tray stays under the
 *  7-object table ceiling and a surge die has room to join. */
function playPaid(s: CombatEncounterState, cardId: string): CombatEncounterState {
    const entry = s.hand.find(h => h.cardId === cardId);
    expect(entry).toBeDefined();
    const dieId = `wheel-wild-${s.log.length}`;
    const powered: CombatEncounterState = {
        ...s,
        dice: [
            ...s.dice.filter(d => !d.id.startsWith('wheel-wild-')),
            { id: dieId, color: 'wild', face: 'mana', state: 'available', temporary: false },
        ],
    };
    const res = playCombatCard(powered, { uid: entry!.uid }, true, dieId, rng);
    expect(res.events.some(e => e.kind === 'card-played')).toBe(true);
    return res.state;
}

describe('Phase 31 — momentum (engine-native)', () => {
    it('a fizzled play does not advance momentum (fizzle-gates-advance correction)', () => {
        let s = open();
        const entry = s.hand.find(h => h.cardId === 'qa-wheel-heart')!;
        // No powering die named — a bottom-action attempt fizzles ("choose a
        // die to power this card"), never pushing card-played.
        const res = playCombatCard(s, { uid: entry.uid }, true, undefined, rng);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(res.events.some(e => e.kind === 'card-played')).toBe(false);
        expect(res.state.momentumV2 ?? null).toBeNull();
        expect(res.state.playerStance).toBe(s.playerStance);
    });

    it('spec 33 §3 rule 5 regression (Phase 33d) — a FREE glyphCharge play never mutates momentumV2', () => {
        // `applyStanceAndMomentumV2` (the spec 33 momentum chain) is only
        // invoked on `useBottom` (PAID) plays — a FREE-line `glyphCharge`
        // rider is structurally momentum-safe already; this proves it rather
        // than just asserting it.
        let s = open();
        s = {
            ...s,
            playerStance: 'heart',
            momentumV2: { color: 'heart', length: 2 },
            hand: [...s.hand, { uid: 'glyph-free', cardId: 'qa-wheel-glyph-charge' }],
        };
        const res = playCombatCard(s, { uid: 'glyph-free' }, false, undefined, rng);
        expect(res.events.some(e => e.kind === 'card-played')).toBe(true);
        expect(res.state.momentumV2).toEqual({ color: 'heart', length: 2 });
        expect(res.state.playerStance).toBe('heart');
    });

    it('the momentum die never survives to the character save (getFloatingDiceColors excludes temporary floats)', () => {
        let s = open();
        s = playPaid(s, 'qa-wheel-heart');
        s = playPaid(s, 'qa-wheel-body');
        s = playPaid(s, 'qa-wheel-mind'); // heart → body → mind SURGES
        expect((s.floatingDice ?? []).some(d => d.id.startsWith(SURGE_DIE_PREFIX) && d.temporary)).toBe(true);
        expect(getFloatingDiceColors(s)).toEqual([]);
    });

    it('sim policies never crash on momentum state across every policy and seed', () => {
        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = deepClone(Player);
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy);
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
