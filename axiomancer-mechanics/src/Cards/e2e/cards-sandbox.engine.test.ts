/**
 * Hermetic E2E — Sandbox card registry (the deck-forge experimentation surface).
 *
 * Covers:
 *   - register / lookup / clear lifecycle, `hasSandboxContent`
 *   - collision safety (library ids and duplicate sandbox ids throw; atomic)
 *   - library-card overrides: shallow merge visible through `getCardById`
 *   - the shipped `forge-example` set applies, resolves real Effects-library
 *     effect ids, and projects through `toCombatCard` with sensible verb classes
 *   - a registered sandbox card is PLAYABLE end-to-end through the combat
 *     engine: it is drawn into the opening hand, its top action resolves, and
 *     its powered bottom action lands its status effect (status play is the
 *     efficient path — a sandbox card must be able to join that loop).
 *
 * Seed-driven where the engine is involved (no RNG mocks); the sandbox is
 * wiped after every test so no experimental card leaks into other suites.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { lookupEffect } from '../../Effects';
import type { Card } from '../types';
import { getCardById } from '../cards.library';
import {
    registerSandboxCards, registerSandboxOverride, clearSandboxCards,
    getSandboxCard, listSandboxCards, hasSandboxContent,
} from '../cards.sandbox';
import { SANDBOX_CARD_SETS, listSandboxSets, applySandboxSet } from '../cards.sandbox-sets';
import { toCombatCard } from '../../Combat/combat.cards';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
} from '../../Combat/combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../../Combat/combat.encounter.types';

afterEach(() => {
    clearSandboxCards();
    vi.restoreAllMocks();
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const EMBER = 'sandbox-ember-syllogism';   // forge-example: direct-dot (debuff_burn)
const DOUBT = 'sandbox-tempered-doubt';    // forge-example: defend/guard hybrid

/** Minimal well-formed experimental DoT card (real effect id: debuff_bleed). */
function testDotCard(id = 'sandbox-test-rot'): Card {
    return {
        id,
        name: 'Test Rot',
        category: 'fallacy',
        philosophicalAspect: 'body',
        description: 'A test argument that decays on contact.',
        tier: 1,
        targetType: 'enemy',
        basePower: 6,
        scalingStat: 'body',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    };
}

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeWeakEnemy(): Enemy {
    const e = deepClone(TidepoolCrab);
    e.health = 60;
    e.maxHealth = 60;
    e.effects = [];
    return e;
}

/** Forces this turn's draft pool to known colors (deterministic reads). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

// ── Registry lifecycle ───────────────────────────────────────────────────────

describe('sandbox registry — register / lookup / clear', () => {
    it('starts empty and stays invisible to getCardById', () => {
        expect(hasSandboxContent()).toBe(false);
        expect(listSandboxCards()).toEqual([]);
        expect(getSandboxCard('slippery-slope')).toBeUndefined();
        // Library lookups are untouched when the sandbox is empty.
        expect(getCardById('slippery-slope')?.name).toBe('Slippery Slope');
        expect(getCardById('no-such-card')).toBeUndefined();
    });

    it('a registered new card resolves via getSandboxCard AND getCardById', () => {
        registerSandboxCards([testDotCard()]);
        expect(hasSandboxContent()).toBe(true);
        expect(getSandboxCard('sandbox-test-rot')?.name).toBe('Test Rot');
        expect(getCardById('sandbox-test-rot')?.basePower).toBe(6);
        expect(listSandboxCards().map(c => c.id)).toEqual(['sandbox-test-rot']);
    });

    it('clearSandboxCards wipes both new cards and overrides', () => {
        registerSandboxCards([testDotCard()]);
        registerSandboxOverride('ad-hominem-strike', { basePower: 11 });
        expect(hasSandboxContent()).toBe(true);
        expect(listSandboxCards()).toHaveLength(2);

        clearSandboxCards();
        expect(hasSandboxContent()).toBe(false);
        expect(getCardById('sandbox-test-rot')).toBeUndefined();
        expect(getCardById('ad-hominem-strike')?.basePower).toBe(8); // library literal
    });
});

// ── Collision safety ─────────────────────────────────────────────────────────

describe('sandbox registry — collisions and validation', () => {
    it('registering an id that exists in the card library throws', () => {
        expect(() => registerSandboxCards([testDotCard('slippery-slope')]))
            .toThrow(/collides with the card library/);
    });

    it('registering the same sandbox id twice throws', () => {
        registerSandboxCards([testDotCard()]);
        expect(() => registerSandboxCards([testDotCard()]))
            .toThrow(/already registered/);
    });

    it('registration is atomic — a colliding batch registers nothing', () => {
        expect(() => registerSandboxCards([testDotCard('sandbox-ok'), testDotCard('befriend')]))
            .toThrow();
        expect(getSandboxCard('sandbox-ok')).toBeUndefined();
        expect(hasSandboxContent()).toBe(false);
    });

    it('overriding a card that is not in the library throws', () => {
        expect(() => registerSandboxOverride('no-such-card', { basePower: 99 }))
            .toThrow(/no such card in the library/);
    });
});

// ── Overrides ────────────────────────────────────────────────────────────────

describe('sandbox registry — library-card overrides', () => {
    it('a shallow patch is merged over the library card and visible via getCardById', () => {
        const base = getCardById('ad-hominem-strike');
        expect(base?.basePower).toBe(8);

        registerSandboxOverride('ad-hominem-strike', { basePower: 12 });
        const merged = getCardById('ad-hominem-strike');
        expect(merged?.basePower).toBe(12);
        // Untouched fields survive the merge; the id is immutable.
        expect(merged?.id).toBe('ad-hominem-strike');
        expect(merged?.name).toBe(base?.name);
        expect(merged?.specialMechanics).toEqual(base?.specialMechanics);
    });

    it('repeated overrides of the same card accumulate (shallow-merge order)', () => {
        registerSandboxOverride('ad-hominem-strike', { basePower: 10 });
        registerSandboxOverride('ad-hominem-strike', { tier: 2 });
        const merged = getCardById('ad-hominem-strike');
        expect(merged?.basePower).toBe(10);
        expect(merged?.tier).toBe(2);
        expect(listSandboxCards().map(c => c.id)).toEqual(['ad-hominem-strike']);
    });
});

// ── forge-example set ────────────────────────────────────────────────────────

describe('sandbox sets — the forge-example set', () => {
    it('lists the shipped sets and returns undefined for an unknown id', () => {
        expect(listSandboxSets().map(s => s.id)).toContain('forge-example');
        expect(applySandboxSet('no-such-set')).toBeUndefined();
        expect(hasSandboxContent()).toBe(false);
    });

    it('applies cards + overrides and every effect id resolves in the Effects library', () => {
        const set = applySandboxSet('forge-example');
        expect(set).toBe(SANDBOX_CARD_SETS['forge-example']);

        expect(getCardById(EMBER)?.name).toBe('Ember Syllogism');
        expect(getCardById(DOUBT)?.name).toBe('Tempered Doubt');
        expect(getCardById('ad-hominem-strike')?.basePower).toBe(9); // library literal is 8

        // Guard against typo'd effect ids — every referenced effect must be real.
        for (const card of set!.cards) {
            for (const ce of card.combatEffects ?? []) {
                expect(lookupEffect(ce.effectId), `${card.id} -> ${ce.effectId}`).toBeDefined();
            }
        }
    });

    it('the set cards project through toCombatCard with the intended verb classes', () => {
        applySandboxSet('forge-example');

        const ember = toCombatCard(EMBER, getCardById, lookupEffect);
        expect(ember).not.toBeNull();
        expect(ember!.verbClass).toBe('direct-dot');       // debuff_burn is a real DoT
        expect(ember!.effectKind).toBe('dot');
        expect(ember!.primaryEffectId).toBe('debuff_burn');
        expect(ember!.bottomDamagePreview).toBeGreaterThan(0);

        const doubt = toCombatCard(DOUBT, getCardById, lookupEffect);
        expect(doubt).not.toBeNull();
        expect(doubt!.verbClass).toBe('defend');           // guard mechanic wins classification
        expect(doubt!.effectKind).toBe('none');
    });
});

// ── Playability through the combat engine ───────────────────────────────────

describe('sandbox cards — playable end-to-end through the combat engine', () => {
    it('a sandbox card is drawn into the opening hand and its top action resolves', () => {
        applySandboxSet('forge-example');
        const player = makePlayer([]);
        const enemy = makeWeakEnemy();

        // 3 sandbox copies + a library defend card: any 6-card hand holds a copy.
        const deck = [EMBER, EMBER, EMBER, 'brace-for-impact'];
        const init = initializeCombatEncounter(player, enemy, deck, 42);
        expect(init.hand.map(h => h.cardId)).toContain(EMBER);

        let state = rollEncounterDice(init).state;
        expect(state.phase).toBe('phase-play');
        expect(state.dice.length).toBeGreaterThan(0);

        state = draftStanceDie(state, state.dice[0].id).state;
        expect(state.draftedDieId).not.toBeNull();

        const res = playCombatCard(state, { cardId: EMBER }, false); // free top action
        expect(res.events.some(e => e.kind === 'card-played' && e.cardId === EMBER)).toBe(true);
        // A direct-dot card's top action chips a sliver of enemy HP.
        expect(res.state.enemy.health).toBeLessThan(state.enemy.health);
        expect(res.state.hand.map(h => h.cardId).filter(id => id === EMBER).length)
            .toBeLessThan(state.hand.map(h => h.cardId).filter(id => id === EMBER).length);
    });

    it('the powered bottom action lands the sandbox card\'s status effect (doctrine path)', () => {
        applySandboxSet('forge-example');
        // The powered play executes through the unchanged skill engine, which
        // requires the card in knownSkills — exactly how the playtest harness
        // grants sandbox cards (stage players learn every eligible card).
        const player = makePlayer([EMBER]);
        const enemy = makeWeakEnemy();

        const deck = [EMBER, EMBER, EMBER, 'brace-for-impact'];
        const init = initializeCombatEncounter(player, enemy, deck, 7);
        let state = rollEncounterDice(init).state;

        // Force a known mind die (the card's own color) for a deterministic
        // powered play, then draft it and spend it on the bottom action.
        state = setDice(state, ['mind', 'body']);
        state = draftStanceDie(state, state.dice[0].id).state;

        const res = playCombatCard(state, { cardId: EMBER }, true);
        expect(res.events.some(e => e.kind === 'card-played' && e.cardId === EMBER)).toBe(true);
        expect(res.events.some(e => e.kind === 'effect-landed' && e.effectId === 'debuff_burn')).toBe(true);
        expect(res.state.enemy.effects.some(ae => ae.effectId === 'debuff_burn')).toBe(true);
    });
});
