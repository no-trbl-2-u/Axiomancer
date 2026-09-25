/**
 * Hermetic E2E — Phase 33d (plan/archive/2026-09-25-trim-t4/plan/phases/phase_33d_glyphs_pilot.md): GLYPHS,
 * the Option-B grammar pilot (charging seals, player-cracked).
 *
 * `state.glyphs` is a new persistent battlefield zone: a card's PAID line can
 * inscribe a `GlyphInstance` (0 charges, an authored cap); it charges +1
 * every `processBetweenPhases` round (silently, capped) or via a FREE-line
 * `CardRider.glyphCharge`; the player cracks it with the new dieless
 * `crackGlyph` action for a payload scaled by the accumulated charges. An
 * enemy counterplay hook (`CombatThreatEffect.glyphShatter`) destroys the
 * player's lowest-charge glyph, mirroring Phase 33a's `swayCleanse`/
 * `premiseShed` shape exactly.
 *
 * Fixture/RNG conventions follow `reactive-counterplay-hooks.engine.test.ts`'s
 * direct-engine-call harness (hand-built state, no bestiary dependency) for
 * the pure engine cases (tick / crack / shatter); the PAID-inscribe and
 * FREE-charge cases need an actual playable card, so — like
 * `momentum-wheel.engine.test.ts` — a handful of QA fixture cards are
 * registered into the sandbox at module scope.
 *
 * PROFANE CANON (2026-08-08): the `glyphs-33d` sandbox SET (the 4 pilot
 * cards) was cleared with the library rework's sandbox reset — glyphs stay a
 * sandbox-only mechanic with no curated carrier. The old pilot-card smoke
 * block is replaced by a registry-resolution smoke over the QA fixtures
 * (same seam: sandbox-registered glyph cards resolve via `getCardById` and
 * project via `getCard`/`toCombatCard`).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { getCardById } from '../../Cards/cards.library';
import * as EffectsLib from '../../Effects/effects.library';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    processBetweenPhases, resolveThreatPhase, crackGlyph, getCard,
} from '../combat.engine';
import { THREAT_RUNGS } from '../effects';
import type { CombatEncounterState, CombatEvent, CombatThreatPhase, GlyphInstance } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

// ── QA fixture cards (module-scoped, mirrors momentum-wheel.engine.test.ts) ──

registerSandboxCards([
    {
        id: 'qa-glyph-inscriber-poison',
        name: 'QA Glyph Inscriber (Poison)',
        philosophicalAspect: 'mind',
        description: 'glyph-test poison inscriber fixture',
        tier: 1, rank: 1, cardType: 'spell', targetType: 'enemy',
        free: {
            glyphCharge: 1,
            glyphChargeFallback: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
        },
        combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 1 }],
        glyph: { payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, cap: 3 },
    },
    {
        id: 'qa-glyph-inscriber-barrier',
        name: 'QA Glyph Inscriber (Barrier)',
        philosophicalAspect: 'mind',
        description: 'glyph-test barrier inscriber fixture',
        tier: 1, rank: 1, cardType: 'spell', targetType: 'self',
        free: { glyphCharge: 1, glyphChargeFallback: { barrier: 1 } },
        specialMechanics: [{ kind: 'guard', amount: 2 }],
        glyph: { payload: { kind: 'barrier', baseAmount: 2 }, cap: 3 },
    },
    {
        id: 'qa-glyph-pump',
        name: 'QA Glyph Pump',
        philosophicalAspect: 'mind',
        description: 'glyph-test pump fixture (no glyph of its own — charges ANY)',
        tier: 1, rank: 1, cardType: 'spell', targetType: 'enemy',
        free: {
            glyphCharge: 1,
            glyphChargeFallback: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
        },
        combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 1 }],
    },
]);

const rng = (): number => 0.5;

function makePlayer(knownCards: string[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = knownCards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 300; p.maxHealth = 300;
    p.effects = [];
    p.floatingDice = [];
    return p;
}

function makeEnemy(hp = 400): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-glyph-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: 2, body: 2, mind: 6 };
    return e;
}

/** A hand-built state ready for `playCombatCard`: one card in hand, dice
 *  rolled. Mirrors momentum-wheel's `open()`. */
function openWithHand(cardIds: string[]): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(cardIds), makeEnemy(), cardIds, 7);
    s = rollEncounterDice(s, rng).state;
    return { ...s, hand: cardIds.map((cardId, i) => ({ uid: `g${i}`, cardId })) };
}

/** Pins a fresh mind MANA die into the tray (every fixture card above is
 *  mind-aligned) and plays `cardId`'s PAID (bottom) line powered by it —
 *  the rolled faces are left out of it so no play depends on a miss roll. */
function playPaidMind(s: CombatEncounterState, cardId: string): { state: CombatEncounterState; events: CombatEvent[] } {
    const dieId = `glyph-mind-${s.dice.length}`;
    const powered: CombatEncounterState = {
        ...s,
        dice: [...s.dice, { id: dieId, color: 'mind', face: 'mana', state: 'available', temporary: false }],
    };
    const entry = powered.hand.find(h => h.cardId === cardId);
    expect(entry).toBeDefined();
    const res = playCombatCard(powered, { uid: entry!.uid }, true, dieId, rng);
    expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
    return { state: res.state, events: res.events };
}

function playFreeTop(s: CombatEncounterState, cardId: string): { state: CombatEncounterState; events: CombatEvent[] } {
    const entry = s.hand.find(h => h.cardId === cardId);
    expect(entry).toBeDefined();
    const res = playCombatCard(s, { uid: entry!.uid }, false, undefined, rng);
    return { state: res.state, events: res.events };
}

// ── A hand-built minimal state for the pure engine cases (crack / tick /
//    shatter) — no card play involved, following reactive-counterplay-hooks'
//    `phaseState` convention. ─────────────────────────────────────────────

function customPhase(effects: CombatThreatPhase['threatAction']['effects']): CombatThreatPhase[] {
    return [{
        index: 1, enemyStance: 'mind', isFinalPhase: true,
        threatAction: { description: 'glyph counterplay probe', effects },
    }];
}

function baseState(overrides: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = initializeCombatEncounter(makePlayer(), makeEnemy(), undefined, 7);
    const opened = rollEncounterDice(s).state;
    return { ...opened, phase: 'phase-play', ...overrides };
}

const poisonGlyph = (charges: number, id = 'g-poison', cap = 3): GlyphInstance => ({
    id, cardId: 'qa-glyph-inscriber-poison',
    payload: { kind: 'poison', baseIntensity: 1, duration: 2 },
    charges, cap,
});
const barrierGlyph = (charges: number, id = 'g-barrier', cap = 3): GlyphInstance => ({
    id, cardId: 'qa-glyph-inscriber-barrier',
    payload: { kind: 'barrier', baseAmount: 2 },
    charges, cap,
});

// ── Inscribe (PAID line) ──────────────────────────────────────────────────

describe('Phase 33d — inscribe (PAID line)', () => {
    it('creates a GlyphInstance at 0 charges, cap as authored, and emits glyph-inscribed', () => {
        const s = openWithHand(['qa-glyph-inscriber-poison']);
        const { state: after, events } = playPaidMind(s, 'qa-glyph-inscriber-poison');
        expect(after.glyphs).toHaveLength(1);
        expect(after.glyphs![0]).toMatchObject({
            cardId: 'qa-glyph-inscriber-poison',
            payload: { kind: 'poison', baseIntensity: 1, duration: 2 },
            charges: 0, cap: 3,
        });
        const fired = findEvents(events, 'glyph-inscribed');
        expect(fired).toHaveLength(1);
        expect(fired[0]).toMatchObject({ glyphId: after.glyphs![0].id, cardId: 'qa-glyph-inscriber-poison' });
    });

    it('a second inscription from the same card id gets a distinct id (index-suffixed)', () => {
        let s = openWithHand(['qa-glyph-inscriber-poison', 'qa-glyph-inscriber-poison']);
        const first = playPaidMind(s, 'qa-glyph-inscriber-poison');
        s = first.state;
        const second = playPaidMind(s, 'qa-glyph-inscriber-poison');
        expect(second.state.glyphs).toHaveLength(2);
        expect(second.state.glyphs![0].id).not.toBe(second.state.glyphs![1].id);
    });

    it('the barrier payload inscribes identically (payload kind honored)', () => {
        const s = openWithHand(['qa-glyph-inscriber-barrier']);
        const { state: after } = playPaidMind(s, 'qa-glyph-inscriber-barrier');
        expect(after.glyphs).toHaveLength(1);
        expect(after.glyphs![0].payload).toEqual({ kind: 'barrier', baseAmount: 2 });
    });
});

// ── processBetweenPhases — the silent +1/round charge tick ────────────────

describe('Phase 33d — the between-phases charge tick', () => {
    it('every glyph gains +1 charge, capped; an already-capped glyph is untouched (no event either way)', () => {
        const s = baseState({ glyphs: [poisonGlyph(0), barrierGlyph(3)] });
        const res = processBetweenPhases(s);
        const ticked = res.state.glyphs!;
        expect(ticked.find(g => g.id === 'g-poison')!.charges).toBe(1);
        expect(ticked.find(g => g.id === 'g-barrier')!.charges).toBe(3); // already at cap — no-op, not an error
        expect(findEvents(res.events, 'glyph-charged')).toHaveLength(0); // ticks are silent
    });

    it('an absent glyphs zone (undefined) ticks to an empty array, no crash', () => {
        const s = baseState({ glyphs: undefined });
        const res = processBetweenPhases(s);
        expect(res.state.glyphs).toEqual([]);
    });
});

// ── crackGlyph — the dieless player action ────────────────────────────────

describe('Phase 33d — crackGlyph', () => {
    it.each([0, 1, 3])('poison at %i charges lands intensity 1+charges, duration 2, removes the glyph, emits glyph-cracked', (charges) => {
        const s = baseState({ glyphs: [poisonGlyph(charges)] });
        const res = crackGlyph(s, 'g-poison');
        const landed = res.state.enemy.effects.find(ae => ae.effectId === 'debuff_poison');
        expect(landed).toBeDefined();
        expect(landed!.intensity).toBe(1 + charges);
        expect(res.state.glyphs).toEqual([]);
        const fired = findEvents(res.events, 'glyph-cracked');
        expect(fired).toHaveLength(1);
        expect(fired[0]).toMatchObject({ glyphId: 'g-poison', cardId: 'qa-glyph-inscriber-poison', charges });
    });

    it.each([0, 1, 3])('barrier at %i charges adds baseAmount(2)+charges to state.barrier and removes the glyph', (charges) => {
        const s = baseState({ glyphs: [barrierGlyph(charges)], barrier: 5 });
        const res = crackGlyph(s, 'g-barrier');
        expect(res.state.barrier).toBe(5 + 2 + charges);
        expect(res.state.glyphs).toEqual([]);
        const fired = findEvents(res.events, 'glyph-cracked');
        expect(fired[0]).toMatchObject({ glyphId: 'g-barrier', cardId: 'qa-glyph-inscriber-barrier', charges });
    });

    it('cracking one glyph leaves an untouched sibling glyph in place', () => {
        const s = baseState({ glyphs: [poisonGlyph(1, 'g1'), barrierGlyph(2, 'g2')] });
        const res = crackGlyph(s, 'g1');
        expect(res.state.glyphs).toHaveLength(1);
        expect(res.state.glyphs![0].id).toBe('g2');
    });

    it('a nonexistent glyphId is a no-op (mirrors playSignatureSkill\'s guard pattern — no events, untouched state)', () => {
        const s = baseState({ glyphs: [poisonGlyph(1)] });
        const res = crackGlyph(s, 'no-such-glyph');
        expect(res.state).toBe(s);
        expect(res.events).toEqual([]);
    });

    it('outside phase-play is a no-op', () => {
        const s = baseState({ glyphs: [poisonGlyph(1)], phase: 'phase-resolve' });
        const res = crackGlyph(s, 'g-poison');
        expect(res.state).toBe(s);
        expect(res.events).toEqual([]);
        expect(res.state.glyphs).toHaveLength(1); // untouched
    });
});

// ── FREE glyphCharge (CardRider) ───────────────────────────────────────────

describe('Phase 33d — FREE glyphCharge', () => {
    it('an inscriber card charges its OWN matching glyph, capped', () => {
        let s = openWithHand(['qa-glyph-inscriber-poison']);
        s = { ...s, glyphs: [poisonGlyph(1)] };
        const { state: after, events } = playFreeTop(s, 'qa-glyph-inscriber-poison');
        expect(after.glyphs![0].charges).toBe(2);
        const fired = findEvents(events, 'glyph-charged');
        expect(fired).toHaveLength(1);
        expect(fired[0]).toMatchObject({ glyphId: 'g-poison', charges: 2, cap: 3 });
    });

    it('caps at the glyph\'s printed cap (still emits glyph-charged, informationally)', () => {
        let s = openWithHand(['qa-glyph-inscriber-poison']);
        s = { ...s, glyphs: [poisonGlyph(3)] }; // already at cap
        const { state: after, events } = playFreeTop(s, 'qa-glyph-inscriber-poison');
        expect(after.glyphs![0].charges).toBe(3);
        expect(findEvents(events, 'glyph-charged')).toHaveLength(1);
    });

    it('a pump card (no glyph of its own) charges ANY glyph you control, regardless of payload kind', () => {
        let s = openWithHand(['qa-glyph-pump']);
        s = { ...s, glyphs: [barrierGlyph(0)] };
        const { state: after, events } = playFreeTop(s, 'qa-glyph-pump');
        expect(after.glyphs![0].charges).toBe(1);
        expect(findEvents(events, 'glyph-charged')).toHaveLength(1);
    });

    it('no matching glyph -> applies glyphChargeFallback instead (never a silent no-op)', () => {
        let s = openWithHand(['qa-glyph-inscriber-poison']);
        s = { ...s, glyphs: [] };
        const { state: after, events } = playFreeTop(s, 'qa-glyph-inscriber-poison');
        expect(findEvents(events, 'glyph-charged')).toHaveLength(0);
        expect(findEvents(events, 'effect-fizzled')).toHaveLength(0); // the fallback fired, not a fizzle
        const mark = after.enemy.effects.find(ae => ae.effectId === 'debuff_mark');
        expect(mark).toBeDefined();
    });

    it('no glyphs.glyph and a mismatched-kind glyph both fall back for an inscriber card (kind-scoped, not ANY)', () => {
        let s = openWithHand(['qa-glyph-inscriber-poison']);
        s = { ...s, glyphs: [barrierGlyph(0)] }; // wrong kind for this inscriber
        const { state: after, events } = playFreeTop(s, 'qa-glyph-inscriber-poison');
        expect(findEvents(events, 'glyph-charged')).toHaveLength(0);
        expect(after.glyphs![0].charges).toBe(0); // the barrier glyph itself is untouched
        const mark = after.enemy.effects.find(ae => ae.effectId === 'debuff_mark');
        expect(mark).toBeDefined(); // fallback fired instead
    });
});

// ── glyphShatter (enemy counterplay hook) ──────────────────────────────────

function glyphShatterState(
    glyphs: GlyphInstance[],
    opts: { staggerRungs?: number } = {},
): CombatEncounterState {
    const s = baseState();
    return {
        ...s,
        threatPhases: customPhase([{ glyphShatter: true }]),
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        staggerRungs: opts.staggerRungs ?? 0,
        glyphs,
    };
}

describe('Phase 33d — glyphShatter (enemy counterplay)', () => {
    it('destroys the LOWEST-charge glyph when >= 1 exists', () => {
        const res = resolveThreatPhase(glyphShatterState([poisonGlyph(3, 'high'), barrierGlyph(1, 'low')]));
        expect(res.state.glyphs!.map(g => g.id)).toEqual(['high']);
        const fired = findEvents(res.state.log, 'glyph-shattered');
        expect(fired).toHaveLength(1);
        expect(fired[0].phaseIndex).toBe(1);
    });

    it('tie-break: equal charges -> the FIRST in array order is destroyed (deterministic, no RNG)', () => {
        const res = resolveThreatPhase(glyphShatterState([poisonGlyph(2, 'first'), barrierGlyph(2, 'second')]));
        expect(res.state.glyphs!.map(g => g.id)).toEqual(['second']);
    });

    it('is a no-op with 0 glyphs', () => {
        const res = resolveThreatPhase(glyphShatterState([]));
        expect(res.state.glyphs).toEqual([]);
        expect(findEvents(res.state.log, 'glyph-shattered')).toHaveLength(0);
    });

    it('does not fire when the phase is fully denied (staggered to 0)', () => {
        const res = resolveThreatPhase(glyphShatterState([poisonGlyph(1)], { staggerRungs: THREAT_RUNGS }));
        expect(res.state.glyphs).toHaveLength(1); // untouched
        expect(findEvents(res.state.log, 'glyph-shattered')).toHaveLength(0);
    });

    it('is gated by !doubtId (mirrors 33a\'s swayCleanse/premiseShed DOUBT guard)', () => {
        const real = EffectsLib.lookupEffect;
        vi.spyOn(EffectsLib, 'lookupEffect').mockImplementation((id: string) => {
            if (id === 'debuff_test_doubt') {
                return {
                    id, name: 'Test Doubt', description: '', type: 'debuff', category: 'control',
                    duration: 2, stacking: 'intensity', tier: 1,
                    payload: { restrictsSurgeAccess: true },
                } as ReturnType<typeof real>;
            }
            return real(id);
        });

        const s = glyphShatterState([poisonGlyph(1)]);
        const doubted: CombatEncounterState = {
            ...s,
            enemy: {
                ...s.enemy,
                effects: [{ effectId: 'debuff_test_doubt', intensity: 1, remainingDuration: 2, appliedAt: 1, tier: 1 as const }],
            },
        };
        const res = resolveThreatPhase(doubted);
        expect(res.state.glyphs).toHaveLength(1); // suppressed by DOUBT
        expect(findEvents(res.state.log, 'glyph-shattered')).toHaveLength(0);
    });
});

// ── Sandbox registration smoke ─────────────────────────────────────────────
// PROFANE CANON (2026-08-08): the glyphs-33d pilot SET was cleared with the
// sandbox reset (glyphs remain a sandbox-only mechanic, no curated carrier).
// The registry-resolution seam the old pilot smoke pinned survives on the QA
// fixtures registered above.

describe('Phase 33d — sandbox glyph cards resolve through the registry', () => {
    it.each([
        'qa-glyph-inscriber-poison', 'qa-glyph-inscriber-barrier', 'qa-glyph-pump',
    ])('%s resolves via getCardById and toCombatCard (getCard) with no collisions', (cardId) => {
        expect(getCardById(cardId)).toBeDefined();
        expect(getCard(cardId)).not.toBeNull();
    });

    it('the two inscriber fixtures carry a glyph field; the pump does not', () => {
        expect(getCardById('qa-glyph-inscriber-poison')?.glyph).toBeDefined();
        expect(getCardById('qa-glyph-inscriber-barrier')?.glyph).toBeDefined();
        expect(getCardById('qa-glyph-pump')?.glyph).toBeUndefined();
    });
});
