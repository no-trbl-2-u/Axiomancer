/**
 * Hermetic E2E — phase 28 (Show the Engine legibility sweep). Covers the
 * mechanics-side additions: per-card rupture projection, the Overtake 2-pip
 * gate, the shared rung-denial fix (getDisruptMeter.willDeny), the REPRISE
 * songbook player choice, the wall-math projection, and the tu-quoque
 * color-match data fix. Seeded RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    projectRupture, projectRuptureBurst, projectIncomingThreat, getDisruptMeter,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';
import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';

afterEach(() => { vi.restoreAllMocks(); clearSandboxCards(); });

/**
 * RUPTURE variant fixtures. The Profane Canon prints exactly one detonation
 * (Communion of the Worm — plain RUPTURE, no amplifier), so the `bonusPct`
 * and `fuelPerPip` branches of `projectRuptureBurst` and the Overtake 2-pip
 * gate lost their library carriers. The ENGINE branches are still live and
 * still under test; only the printed card moved into the fixture.
 * Provenance: resonance-detonation / the-overtake @ a69eab56.
 */
const FIXTURE_BONUS_RUPTURE: Card = {
    id: 'fx-resonance-detonation',
    theme: 'rot',
    name: 'Resonance Detonation (fixture)',
    philosophicalAspect: 'mind',
    description: 'Test carrier for RUPTURE with a bonusPct amplifier.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE for 150% of the pending total.',
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'rupture', bonusPct: 0.5 }],
    addedIn: '2026-08-08',
    tags: ['rot', 'payoff'],
};

const FIXTURE_PIP_RUPTURE: Card = {
    id: 'fx-the-overtake',
    theme: 'grave',
    name: 'The Overtake (fixture)',
    philosophicalAspect: 'body',
    description: 'Test carrier for the pip-fed RUPTURE and its 2-pip gate.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Spend every banked PIP, then RUPTURE at 3.5 fuel per pip.',
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'spend_all_pips', guardPerPip: 1 },
        { kind: 'rupture', fuelPerPip: 3.5, bonusPct: 0.5 },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-08-08',
    tags: ['grave', 'payoff'],
};

const ae = (effectId: string, intensity = 1, remainingDuration = 4): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** The powering die's id — spec 33 PAID plays must name their die. */
const DIE = 'pw-die';

/** Opens phase-play and forces the tray to ONE mana-face die of color `die`
 *  (spec 33: no draft; the PAID play names `DIE` explicitly). */
function openWithDie(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    return { ...state, dice: [{ id: DIE, color: die, state: 'available', temporary: false, face: 'mana' }] };
}

describe('projectRuptureBurst — per-card-accurate rupture preview (phase 28)', () => {
    const PLAIN = 'communion-of-the-worm';   // no bonusPct/fuelPerPip (canon)
    const BONUS = FIXTURE_BONUS_RUPTURE.id;  // bonusPct 0.5, no fuelPerPip
    const PIP_FED = FIXTURE_PIP_RUPTURE.id;  // fuelPerPip 3.5, bonusPct 0.5
    beforeEach(() => { registerSandboxCards([FIXTURE_BONUS_RUPTURE, FIXTURE_PIP_RUPTURE]); });

    it('matches projectRupture for a card with no card-specific rupture mechanic', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openWithDie(makePlayer([PLAIN]), makeEnemy(300, 'heart', enemyEffects), [PLAIN], 'heart');
        const card = state.hand.find(h => h.cardId === PLAIN)!;
        expect(projectRuptureBurst(state, { uid: card.uid, id: PLAIN } as never)).toBe(projectRupture(state));
    });

    it('adds bonusPct for the amplified detonation (undershoots without it)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openWithDie(makePlayer([BONUS]), makeEnemy(900, 'mind', enemyEffects), [BONUS], 'mind');
        const card = state.hand.find(h => h.cardId === BONUS)!;
        const flat = projectRupture(state);
        const perCard = projectRuptureBurst(state, { uid: card.uid, id: BONUS } as never);
        expect(perCard).toBeGreaterThan(flat);
        expect(perCard).toBe(Math.round(flat * 1.5));
    });

    it('incorporates fuelPerPip × banked reserve/floating pips for the pip-fed rupture', () => {
        mockSequentialRng(0.05);
        let state = openWithDie(makePlayer([PIP_FED]), makeEnemy(900, 'mind', []), [PIP_FED], 'mind');
        const card = state.hand.find(h => h.cardId === PIP_FED)!;
        const noPips = projectRuptureBurst(state, { uid: card.uid, id: PIP_FED } as never);
        state = { ...state, reserve: [{ id: 'r0', color: 'mind', state: 'available', temporary: false, pips: 4 }] };
        const withPips = projectRuptureBurst(state, { uid: card.uid, id: PIP_FED } as never);
        expect(withPips).toBeGreaterThan(noPips);
    });
});

describe('Overtake 2-pip gate (phase 28)', () => {
    // the pip-fed fixture is philosophicalAspect 'body' — powering it requires a body die.
    const OVERTAKE = FIXTURE_PIP_RUPTURE.id;
    beforeEach(() => { registerSandboxCards([FIXTURE_PIP_RUPTURE]); });

    it('fizzles the rupture payoff below 2 spent pips (no HP loss from the mechanic)', () => {
        mockSequentialRng(0.05);
        const state = openWithDie(makePlayer([OVERTAKE]), makeEnemy(900, 'mind', []), [OVERTAKE], 'body');
        const hpBefore = state.enemy.health;
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === OVERTAKE)!.uid }, true, DIE);
        const fizzle = res.events.find(e => e.kind === 'effect-fizzled') as { message: string } | undefined;
        const detonated = res.events.find(e => e.kind === 'rupture-detonated');
        expect(fizzle?.message).toBe('needs 2+ spent pips to detonate');
        expect(detonated).toBeUndefined();
        expect(res.state.enemy.health).toBe(hpBefore);
    });

    it('fires normally at 2+ spent pips', () => {
        mockSequentialRng(0.05);
        let state = openWithDie(makePlayer([OVERTAKE]), makeEnemy(900, 'mind', []), [OVERTAKE], 'body');
        state = { ...state, reserve: [{ id: 'r0', color: 'body', state: 'available', temporary: false, pips: 2 }] };
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === OVERTAKE)!.uid }, true, DIE);
        const detonated = res.events.find(e => e.kind === 'rupture-detonated');
        expect(detonated).toBeDefined();
    });

    it('does not affect a plain rupture card (no fuelPerPip) below 2 pips', () => {
        mockSequentialRng(0.05);
        const RUP = 'communion-of-the-worm';
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openWithDie(makePlayer([RUP]), makeEnemy(300, 'heart', enemyEffects), [RUP], 'heart');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true, DIE);
        expect(res.events.find(e => e.kind === 'rupture-detonated')).toBeDefined();
        expect(res.events.find(e => e.kind === 'effect-fizzled')).toBeUndefined();
    });
});

describe('getDisruptMeter.willDeny — STAGGER-rung denial (phase 28 fix)', () => {
    it('reports willDeny=true when accumulated STAGGER alone denies the turn (previously false)', () => {
        // GraveLarva is 'simple' difficulty -> THREAT_RUNGS (2), no boss growth.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const state = { ...base, staggerRungs: 2 }; // rungsLost (2) >= rungsTotal (2)
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBeLessThan(meter.threshold);   // no distinct-control deny
        expect(meter.rollPenalty).toBe(0);                  // no roll-penalty deny
        expect(meter.willDeny).toBe(true);
    });

    it('reports willDeny=false with no denial path active', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const meter = getDisruptMeter(base);
        expect(meter.willDeny).toBe(false);
    });
});

describe('REPRISE songbook choice (phase 28)', () => {
    const REPRISE_CARD = 'shallow-grave'; // RECALL 1, heart aspect

    it('returns the player-chosen discard card, not the argmax pick', () => {
        mockSequentialRng(0.05);
        let state = openWithDie(makePlayer([REPRISE_CARD]), makeEnemy(300, 'heart', []), [REPRISE_CARD], 'heart');
        // A low-rank and a high-rank card in discard — argmax would pick the high-rank one.
        state = { ...state, discard: ['spoiled-poultice', 'open-every-grave'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true, DIE, undefined, { reprisalCardId: 'spoiled-poultice' });
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['spoiled-poultice']);
    });

    it('falls back to the highest-rank auto-pick when no choice is given', () => {
        mockSequentialRng(0.05);
        let state = openWithDie(makePlayer([REPRISE_CARD]), makeEnemy(300, 'heart', []), [REPRISE_CARD], 'heart');
        state = { ...state, discard: ['spoiled-poultice', 'open-every-grave'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true, DIE);
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['open-every-grave']); // higher rank (5 vs 1)
    });

    it('falls back to auto-pick when the chosen id is not in the discard pile', () => {
        mockSequentialRng(0.05);
        let state = openWithDie(makePlayer([REPRISE_CARD]), makeEnemy(300, 'heart', []), [REPRISE_CARD], 'heart');
        state = { ...state, discard: ['spoiled-poultice', 'open-every-grave'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true, DIE, undefined, { reprisalCardId: 'not-in-discard' });
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised!.returned).toEqual(['open-every-grave']);
    });
});

describe('projectIncomingThreat — wall-math readout (phase 28)', () => {
    it('nets the projected hit against current guard/barrier', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const rawOnly = projectIncomingThreat(base);
        expect(rawOnly.willDeny).toBe(false);
        expect(rawOnly.netDamage).toBeLessThanOrEqual(rawOnly.projectedDamage);

        const guarded = { ...base, guard: 9999 };
        const withGuard = projectIncomingThreat(guarded);
        expect(withGuard.netDamage).toBe(0);
    });

    it('projects 0 net damage when the turn will be denied', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const denied = { ...base, staggerRungs: 2 }; // rung-denied (THREAT_RUNGS = 2)
        const projection = projectIncomingThreat(denied);
        expect(projection.willDeny).toBe(true);
        expect(projection.projectedDamage).toBe(0);
        expect(projection.netDamage).toBe(0);
    });

    it('projected damage drops once a live modifier (partial rung loss) is in play', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const baseline = projectIncomingThreat(base);
        const partiallyStaggered = { ...base, staggerRungs: 1 }; // 1 of 2 rungs lost, not denied
        const projection = projectIncomingThreat(partiallyStaggered);
        expect(projection.willDeny).toBe(false);
        expect(projection.rawDamage).toBe(baseline.rawDamage); // the raw face value is unmodified…
        expect(projection.projectedDamage).toBeLessThan(baseline.projectedDamage); // …but the live projection isn't
    });
});
