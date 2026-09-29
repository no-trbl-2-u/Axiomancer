/**
 * Hermetic E2E — themed-deck mechanics that survive the card purge, LIVE
 * through the engine.
 *
 * Card purge (P1, 2026-09-27): the library is the grey office, so the
 * describes whose subject was a purged card or a card-only verb no surviving
 * card prints — FORGE, PREMISES/SENTENCE/CONDEMN, the STAGGER card play,
 * OMEN, SOULS/REAP, PLEA/RELENT, ECHO, REPRISE/RECALL, the-sextons-count,
 * ENCHANT/DISENCHANT, the purged cards' persistent hooks and
 * the-congregation-below — were deleted (git history keeps them). What stays:
 *   GHOST DICE (the save-file floating pool → tray, spent forever),
 *   STAGGER rungs weakening the telegraph + BACKFIRE drip, the enemy-borne
 *   debuff never reflecting, BLEED per-tick decay, MARK tick amplification,
 *   and a grey-preset ignition smoke.
 *
 * Seeded / stubbed RNG only (src/test-utils/rng.ts); no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
} from '../combat.engine';
import { runHazardCombatAutoEncounter } from '../../test-utils/combat-autoplay';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from '../combat.starter-deck-presets';
import type {
    CombatDieColor, CombatEncounterState, CombatEvent, CombatManaDie, CombatThreatPhase,
} from '../combat.encounter.types';
import { registerFixtureEffects } from '../../test-utils/fixture-effects';

// The keyword audit (2026-09-27) deleted buff_thorns / debuff_backfire /
// the round-clock DoT species from the library; their engine channels are
// exercised through the `fixture_*` effects instead.
registerFixtureEffects();

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 3, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    // Neutral stats (S3): printed numbers land as printed.
    p.baseStats = { heart: 5, body: 5, mind: 5 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-themed-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** The forced tray die's id — spec 33 PAID plays must name their die. */
const DIE = 'pw-die';

/** Forces this turn's tray to ONE mana-face die of color `color` (spec 33:
 *  no draft). Floating dice already in the tray survive the forced tray. */
function setDie(state: CombatEncounterState, color: CombatDieColor): CombatEncounterState {
    const floating = state.dice.filter(d => d.floating);
    const die: CombatManaDie = { id: DIE, color, state: 'available', temporary: false, face: 'mana' };
    return { ...state, dice: [die, ...floating] };
}

/** Plays `cardId` from hand; a PAID play is powered by the forced tray die
 *  unless another `dieId` (Reserve / floating) is named. */
function playFromHand(state: CombatEncounterState, cardId: string, useBottom = true, dieId?: string) {
    const entry = state.hand.find(h => h.cardId === cardId);
    expect(entry, `${cardId} should be in hand`).toBeDefined();
    return playCombatCard(state, { uid: entry!.uid }, useBottom, useBottom ? (dieId ?? DIE) : undefined);
}

/** One-shot custom threat phases (controlled stances/damage). */
function customPhases(stances: ('heart' | 'body' | 'mind')[], damage = 6): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'themed probe', effects: [{ damage }] },
    }));
}

// ── GHOST DICE — the live tray (spec 32 v3 §5) ────────────────────────────

describe('GHOST DICE — the save-file floating pool, spent forever', () => {
    it('spending a floating die removes it FOREVER (refresh effects cannot save it)', () => {
        // Re-fixtured after the card purge (P1, 2026-09-27): FORGE lost its
        // carrier, so the floating die comes from the character save-file
        // pool, and A Plain Word (lands VULNERABLE, a NEW status) spends it.
        mockSequentialRng(0.05);
        const WORD = 'grey-word';
        const player = makePlayer([WORD]);
        (player as Character & { floatingDice?: string[] }).floatingDice = ['wild'];
        let state = initializeCombatEncounter(player, makeEnemy(300, 'mind'), [WORD, WORD, WORD], 7);
        state = setDie(rollEncounterDice(state).state, 'mind');
        const floatId = state.dice.find(d => d.floating)!.id;
        // Power the status play with the floating die THIS turn.
        const res = playFromHand(state, WORD, true, floatId);
        expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
        // The status landed (a NEW status would refresh a normal die) — but
        // the floating die is GONE FOREVER anyway.
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_vulnerable')).toBe(true);
        expect(res.state.floatingDice).toEqual([]);
        expect(res.state.dice.some(d => d.id === floatId)).toBe(false);
    });

    it('the opening tray materializes the character save-file pool', () => {
        mockSequentialRng(0.05);
        const player = makePlayer(['grey-strike']);
        (player as Character & { floatingDice?: string[] }).floatingDice = ['wild', 'heart'];
        let state = initializeCombatEncounter(player, makeEnemy(100, 'mind'), ['grey-strike'], 7);
        expect(state.floatingDice?.map(d => d.color)).toEqual(['wild', 'heart']);
        state = rollEncounterDice(state).state;
        // The floating pool is merged into the first turn's tray.
        expect(state.dice.filter(d => d.floating).length).toBe(2);
    });
});

// ── STAGGER + BACKFIRE (T5) ──────────────────────────────────────────────────

describe('STAGGER rungs — partial removal weakens the telegraph; BACKFIRE drips per rung', () => {
    it('partial rung loss WEAKENS the hit proportionally and still drips', () => {
        mockSequentialRng(0.05);
        const phases = customPhases(['mind'], 10);
        const base = () => {
            const s = initializeCombatEncounter(
                makePlayer([]), makeEnemy(300, 'mind', [ae('fixture_backfire', 1, 3)]), undefined, 7);
            const opened = rollEncounterDice(s).state;
            return { ...opened, threatPhases: phases, threatMarks: ['pending' as const], currentPhaseIndex: 0 };
        };
        const clean = resolveThreatPhase(base());
        const cleanLoss = 200 - clean.state.player.health;
        const partial = resolveThreatPhase({ ...base(), staggerRungs: 1 });
        const partialLoss = 200 - partial.state.player.health;
        expect(cleanLoss).toBeGreaterThan(0);
        expect(partialLoss).toBeGreaterThan(0);              // 1 of 2 rungs → weakened, not denied
        expect(partialLoss).toBeLessThan(cleanLoss);
        const drip = partial.events.find(e => e.kind === 'backfired') as { amount: number; rungs: number } | undefined;
        expect(drip).toBeDefined();
        expect(drip!.rungs).toBe(1);
        expect(drip!.amount).toBe(1);
        // Rungs are consumed by the phase they bent.
        expect(partial.state.staggerRungs ?? 0).toBe(0);
    });
});

// ── Enemy-borne debuffs stay on YOU ──────────────────────────────────────────

describe('enemy-inflicted debuffs never reflect', () => {
    // (An enemy-inflicted debuff must never reflect back onto the enemy —
    // owner ruling 2026-07-12, Bucket B #16: "every self-debuff YOUR OWN
    // cards land" is the contract, so a hex the enemy inflicts on you is not
    // eligible. The hook this guarded against — a since-deleted dead-card
    // mirror keyed to `mirror-of-guilt`, retired phase 86 (2026-09-16) — is
    // gone from `combat.engine.ts` entirely now; this test keeps using the
    // same attachment id as an arbitrary probe value, since the invariant
    // it's pinning is `resolveThreatPhase` never reflecting ANY enemy-borne
    // debuff, regardless of what's attached.)
    it('an ENEMY-inflicted debuff does NOT reflect onto the enemy (owner ruling 2026-07-12, Bucket B #16)', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        state = rollEncounterDice(state).state;
        state = {
            ...state,
            enemyAttachments: ['mirror-of-guilt'],
            threatPhases: [{
                index: 1, enemyStance: 'mind' as const, isFinalPhase: true,
                threatAction: { description: 'hex probe', effects: [{ effectId: 'debuff_poison', intensity: 1, duration: 2 }] },
            }],
        };
        const res = resolveThreatPhase(state);
        expect(res.state.player.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);  // the hex landed on YOU
        expect(res.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(false);  // and did NOT reflect
    });
});

// ── BLEED decay + MARK amplification (T1 / A3) ───────────────────────────────

describe('BLEED — damage-instance clocked (WS3.3), decays 1 intensity per tick', () => {
    it('the round boundary leaves it alone: no tick, no decay, only the calendar counts', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = { ...base, enemy: { ...base.enemy, effects: [ae('debuff_bleed', 2, 3)] } };
        const res = processBetweenPhases(seeded);
        expect(300 - res.state.enemy.health).toBe(0); // event clock — no boundary tick
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(2);             // no tick → no decay
        expect(bleed?.remainingDuration).toBe(2);     // the calendar still counts down
    });

    it('a real damage instance (THORNS reflect) ticks it, then the intensity falls', () => {
        mockSequentialRng(0.5);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const seeded = {
            ...base,
            enemy: { ...base.enemy, effects: [ae('debuff_bleed', 2, 3)] },
            player: { ...base.player, effects: [ae('fixture_thorns', 2, 3)] }, // reflect 1 × 2
        };
        const res = resolveThreatPhase(seeded);
        const tick = res.events.find(e => e.kind === 'dot-tick' && e.effectId === 'debuff_bleed') as { amount: number } | undefined;
        expect(tick?.amount).toBe(6); // floor(3 × 2), the front-loaded tick
        const bleed = res.state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(bleed?.intensity).toBe(1); // decayed 1 per tick
    });
});

describe('MARK — +1 per stack on EVERY DoT tick on the bearer (ratified A3)', () => {
    it('a marked foe bleeds harder from the same round-clocked DoT', () => {
        // WS3.3: poison left the round clocks — kindling ember (round-start,
        // dpr 1) is the boundary witness; MARK amplifies its tick the same.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind'), undefined, 7);
        const plain = processBetweenPhases({ ...base, enemy: { ...base.enemy, effects: [ae('fixture_ember', 1, 4)] } });
        expect(300 - plain.state.enemy.health).toBe(1); // ember i1 → 1

        const marked = processBetweenPhases({
            ...base,
            enemy: { ...base.enemy, effects: [ae('fixture_ember', 1, 4), ae('debuff_mark', 2, 3)] },
        });
        expect(300 - marked.state.enemy.health).toBe(3); // 1 + 2 mark stacks
        const tick = marked.events.find(e => e.kind === 'dot-tick' && e.effectId === 'fixture_ember') as { amount: number };
        expect(tick.amount).toBe(3); // the emitted tick is the real amplified number
    });
});

// ── Per-preset theme-engine ignition smoke (spec §8 gate, loose) ─────────────

describe('preset ignition — every themed deck reaches its engine within a few rounds', () => {
    /** The engine signal each preset must show in its log. Card purge (P1,
     *  2026-09-27): the only preset is the grey office, whose one status
     *  verb is A Plain Word's VULNERABLE on the foe. */
    const SIGNALS: Record<string, (e: CombatEvent) => boolean> = {
        grey: e => e.kind === 'effect-landed' && e.effectId === 'debuff_vulnerable',
    };

    // Gate 0 (2026-07-11 round-turn law) — the old harness fed every hand card
    // to `resolveCombatPhase`, which quietly re-rolled a tray per card (an
    // illegal farm). The smoke now drives the LEGAL auto player (one tray per
    // phase, paid plays + FREE-top drain) over an 8-phase window.
    // pre-Phase-27 interim — re-derived in the honest re-baseline.
    it.each(COMBAT_DECK_PRESET_ORDER.map(id => [id] as const))(
        "preset '%s' ignites its theme engine in a seeded auto-encounter",
        (presetId) => {
            const deck = buildPresetDeck(presetId);
            const player = makePlayer(deck.filter(id => id !== 'card-retreat'));
            const enemy = deepClone(FloatEye);
            // Enough HP that slower engines (Souls-from-expiry) get their runway.
            enemy.health = 150; enemy.maxHealth = 150;
            const r = runHazardCombatAutoEncounter(player, enemy, {
                seed: 21, policy: 'status', maxTurns: 8,
            });

            const signal = SIGNALS[presetId];
            expect(signal, `no signal registered for preset '${presetId}'`).toBeDefined();
            expect(
                r.state.log.some(signal),
                `preset '${presetId}' never ignited its theme engine within ${r.phaseCount} phases`,
            ).toBe(true);
            // And the encounter stayed healthy (no stalemate runaway).
            expect(r.state.round).toBeLessThanOrEqual(10);
        },
        30_000,
    );
});
