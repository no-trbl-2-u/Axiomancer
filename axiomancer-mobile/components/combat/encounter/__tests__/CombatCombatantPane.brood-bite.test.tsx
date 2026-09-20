/**
 * Phase 102 (SUMMON) — a brood bite must READ as a hit (burn-day audit 3.3).
 *
 * The engine resolves the brood's bite OUTSIDE the `!hindered` gate: a phase
 * the player's control denied still costs VITAE while the foe's own telegraph
 * never fires. The board's fx reducers only ever counted `damage-dealt` with
 * `target === 'self'`, so that phase played a gold DENIED flourish over the
 * foe and nothing at all over the pilgrim — the two loudest surfaces in the
 * fight both saying "nothing landed" while the health bar dropped.
 *
 * These are BUG DETECTORS, not balance laws (THE BIG NUMBERS REWRITE). Every
 * number asserted below is read back off the `add-bit` event the engine just
 * emitted — retune `ADD_BITE_PER_LEVEL`, the wave size or the telegraph and
 * every assertion still holds. What is pinned is the RELATION: while a bite
 * landed, no surface may say the phase was denied outright, and the pilgrim
 * must show the hit.
 *
 * The stream is the REAL one — `initializeCombatEncounter` →
 * `rollEncounterDice` → `resolveThreatPhase` on a live brood — because the
 * defect was precisely that a hand-written fixture of the events we THOUGHT
 * the engine emits does not contain `add-bit` at all.
 *
 * Both routes into the bad branch are covered:
 *   1. HINDERED — `phase-resolved: clear`, no `threat-fired`.
 *   2. FULLY SOAKED — `threat-fired` with the telegraph eaten by GUARD, so
 *      `damage-dealt self` is never emitted either.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';

import * as Juice from '@/lib/juice';

import {
    applyEffect, effectsLibrary, initializeCombatEncounter, lookupEffect,
    resolveThreatPhase, rollEncounterDice,
} from '@mechanics';
import type {
    ActiveEffect, CombatEncounterState, CombatEvent, Effect, Enemy,
} from '@mechanics';
import { CombatCombatantPane, PlayerMedallion } from '@/components/combat/encounter/CombatCombatantPane';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

// Wrap (not replace) the real primitives — the same witness shape
// `CombatCombatantPane.juice.test.tsx` uses. Behaviour is unchanged; what this
// buys is a readable answer to "did the board-level reaction actually fire?".
jest.mock('@/lib/juice', () => {
    const actual = jest.requireActual('@/lib/juice') as typeof Juice;
    return { ...actual, useJuiceShake: jest.fn(actual.useJuiceShake) };
});

const CARDS = ['shallow-grave', 'spoiled-poultice'];
const SEED = 7;
const TELEGRAPH_DAMAGE = 30;
const rng = (): number => 0.5;

/** The skipTurn control fixture — the only way to drive the engine's
 *  `hindered` branch since the spec 32 v3 keyword reset deleted Sleep.
 *  Mirrors `summon.engine.test.ts`; never touches JSON. */
const SKIP_FIXTURE: Effect = {
    id: 'qa_row33_skip', name: 'qa sleep', description: 'skipTurn control fixture',
    type: 'debuff', category: 'control', duration: 3, stacking: 'none', tier: 2,
    payload: { actionRestriction: { skipTurn: true } },
} as unknown as Effect;

beforeAll(() => { effectsLibrary.registry.set(SKIP_FIXTURE.id, SKIP_FIXTURE); });
afterAll(() => { effectsLibrary.registry.delete(SKIP_FIXTURE.id); });

function buildPlayer(store: ReturnType<typeof withAllProviders>['store']) {
    const base = store.getState().player;
    return {
        ...base, knownCards: CARDS,
        baseStats: { heart: 8, body: 8, mind: 8 },
        health: 400, maxHealth: 400, effects: [],
    };
}

/** A summoner, stripped of the mock foe's HIDE/RAVENOUS so only SUMMON is
 *  in play. `stages` cleared: a stage crossing is a different story. */
function summoner(): Enemy {
    const foe = createMockEncounterEnemy();
    return {
        ...foe, keywords: [{ kind: 'summon', n: 2, addName: 'QA Shoot' }],
        stages: undefined, health: 1000, maxHealth: 1000, effects: [],
    } as unknown as Enemy;
}

/** Rewrites the CURRENT phase's telegraph, leaving the authored sequence's
 *  shape (length, rungs, stances, stake flags) exactly as generated. */
function withTelegraph(s: CombatEncounterState): CombatEncounterState {
    const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
    return {
        ...s,
        threatPhases: s.threatPhases.map((p, i) => (
            i === idx ? { ...p, threatAction: { ...p.threatAction, effects: [{ damage: TELEGRAPH_DAMAGE }] } } : p
        )),
    };
}

/** Puts the skipTurn fixture on the foe, so its telegraph is denied. */
function hinder(s: CombatEncounterState): CombatEncounterState {
    const def = lookupEffect(SKIP_FIXTURE.id)!;
    const applied = applyEffect(s.enemy.effects as ActiveEffect[], def, s.round);
    return { ...s, enemy: { ...s.enemy, effects: applied.activeEffects } };
}

interface Bite {
    before: CombatEncounterState;
    after: CombatEncounterState;
    events: CombatEvent[];
    /** What the brood actually took off the pilgrim, read off the event. */
    dealt: number;
}

/**
 * Drives one real threat phase with a live brood on the board.
 * `route: 'hindered'` denies the foe's own blow; `route: 'soaked'` lets it
 * fire into a GUARD that eats all of it.
 */
function broodBite(route: 'hindered' | 'soaked'): Bite {
    const { store } = withAllProviders(<></>);
    let s = initializeCombatEncounter(buildPlayer(store), summoner(), CARDS, SEED);
    s = rollEncounterDice(s, rng).state;
    s = withTelegraph(s);
    // A brood seeded by hand — the spawn boundary is the engine's business
    // (pinned in `summon.engine.test.ts`); this suite is about the surface.
    s = {
        ...s, conviction: 12,
        adds: [0, 1].map((i) => ({ id: `qa-add-${i}`, name: 'QA Shoot', vitae: 1, maxVitae: 1, bite: 4 })),
    } as CombatEncounterState;
    if (route === 'hindered') s = hinder(s);
    else s = { ...s, guard: TELEGRAPH_DAMAGE } as CombatEncounterState;

    const before = s;
    const t = resolveThreatPhase(s, rng);
    const events = [...t.events];
    const bit = events.find((e): e is Extract<CombatEvent, { kind: 'add-bit' }> => e.kind === 'add-bit');

    // Preconditions — assert the stream really is the case under test, so the
    // guard can never pass silently on a stream that stopped being it.
    expect(bit).toBeDefined();
    expect(bit!.dealt).toBeGreaterThan(0);
    expect(t.state.player.health).toBeLessThan(before.player.health);
    expect(events.some((e) => e.kind === 'damage-dealt' && e.target === 'self')).toBe(false);
    if (route === 'hindered') {
        expect(events.some((e) => e.kind === 'threat-fired')).toBe(false);
        expect(events.some((e) => e.kind === 'phase-resolved' && e.mark === 'clear')).toBe(true);
    } else {
        expect(events.some((e) => e.kind === 'threat-fired')).toBe(true);
    }

    return { before, after: t.state, events, dealt: bit!.dealt };
}

/** Every `DENIED` on screen EXCEPT the intent telegraph's wall-math readout,
 *  which is a projection of the NEXT phase and is honest already (it prints
 *  `DENIED →N` while adds live — audit §5). Scoping by testID keeps this
 *  guard from being reddened by a surface it does not own. */
function deniedFloatCount(): number {
    return screen.queryAllByText('DENIED').filter((n) => n.props.testID !== 'combat-intent-wallmath').length;
}

describe.each(['hindered', 'soaked'] as const)('a brood bite on a %s phase', (route) => {
    it('never floats a bare DENIED over the foe while the brood landed a bite', () => {
        const { after, events, dealt } = broodBite(route);
        const vm = buildCombatViewModel(after);

        const { tree } = withAllProviders(
            <CombatCombatantPane enemy={vm.enemy} player={vm.player} fx={{ seq: 1, events }} />,
        );
        render(tree);

        expect(deniedFloatCount()).toBe(0);
        // …and the flourish that replaces it names the brood's share, read
        // back off the event rather than pinned to a magnitude.
        const brood = screen.queryAllByText(/BROOD/).map((n) => String(n.props.children));
        expect(brood.some((t) => t.includes(String(dealt)))).toBe(true);
    });

    it('shakes the board for the bite (the damage tick fires on a bite-only phase)', () => {
        (Juice.useJuiceShake as jest.Mock).mockClear();
        const { after, events } = broodBite(route);
        const vm = buildCombatViewModel(after);

        const { tree } = withAllProviders(
            <CombatCombatantPane enemy={vm.enemy} player={vm.player} fx={{ seq: 1, events }} />,
        );
        render(tree);

        // The board shake + red vignette both ride `damageTick.key`, which the
        // pane only raises when it believes the player was hit. A baseline
        // render calls the hook with key 0; a RISEN key is the proof.
        const calls = (Juice.useJuiceShake as jest.Mock).mock.calls as [number, string, number][];
        expect(calls.some(([key]) => key > 0)).toBe(true);
    });

    it('plays a hit reaction on the pilgrim — the float carries what the bite took', () => {
        const { after, events, dealt } = broodBite(route);
        const vm = buildCombatViewModel(after);

        const { tree } = withAllProviders(
            <PlayerMedallion player={vm.player} enemyIntentDamage={0} fx={{ seq: 1, events }} />,
        );
        render(tree);

        expect(screen.queryByText(`-${dealt}`)).not.toBeNull();
    });
});
