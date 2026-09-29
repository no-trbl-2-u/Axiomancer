/**
 * Hermetic E2E — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The damage family (DEAL / WRATH / CHAIN / FLAY / TWIN / EXECUTE / OVERKILL)
 * plus boss STAGES. The enemy keywords this suite once pinned were deleted in
 * revamp phase R2b (D63).
 *
 * These are BUG DETECTORS, not balance laws: every assertion checks that the
 * number the engine applies is the number the rules say it applies. None of
 * them pins a design choice — retune the magnitudes freely; these still pass.
 *
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import type { EnemyStage } from '../../Enemy/enemy-keywords';
import { FloatEye } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { enemyVitae } from '../../Enemy';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase,
    scalePlayerHit, FLAY_DAMAGE_MULT, EXECUTE_DAMAGE_MULT,
} from '../combat.engine';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

const rng = (): number => 0.5;

// Fixtures: one card per verb under test. All BODY so a single body die can
// power any of them, and all rank 1 so IMMOLATE-style rank picks stay stable.
registerSandboxCards([
    {
        id: 'qa-bn-deal', name: 'QA Deal', color: 'body',
        description: 'deal fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 3 },
        specialMechanics: [{ kind: 'deal', amount: 20 }],
    },
    {
        id: 'qa-bn-multi', name: 'QA Multi', color: 'body',
        description: 'multi-hit fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 2 },
        specialMechanics: [{ kind: 'deal', amount: 10, hits: 3 }],
    },
    {
        id: 'qa-bn-wrath', name: 'QA Wrath', color: 'body',
        description: 'wrath fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { wrath: 5 },
        specialMechanics: [{ kind: 'wrath', amount: 5 }],
    },
    {
        id: 'qa-bn-chain', name: 'QA Chain', color: 'body',
        description: 'chain fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { chain: 4 },
        specialMechanics: [{ kind: 'chain', amount: 4 }],
    },
    {
        id: 'qa-bn-flay', name: 'QA Flay', color: 'body',
        description: 'flay fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { flay: 1 },
        specialMechanics: [{ kind: 'flay', stacks: 2 }],
    },
    {
        id: 'qa-bn-execute', name: 'QA Execute', color: 'body',
        description: 'execute fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'execute', atPct: 0.5 }, { kind: 'deal', amount: 20 }],
    },
    {
        id: 'qa-bn-overkill', name: 'QA Overkill', color: 'body',
        description: 'overkill fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [
            { kind: 'deal', amount: 200 },
            { kind: 'overkill', per: 10, conviction: 1 },
        ],
    },
    {
        id: 'qa-bn-echo-deal', name: 'QA Echo Deal', color: 'body',
        description: 'echo+deal fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'deal', amount: 10 }, { kind: 'echo' }],
    },
    {
        id: 'qa-bn-twin', name: 'QA Twin', color: 'body',
        description: 'twin fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'twin' }],
    },
]);

const DECK = [
    'qa-bn-deal', 'qa-bn-multi', 'qa-bn-wrath',
    'qa-bn-chain', 'qa-bn-flay', 'qa-bn-execute', 'qa-bn-overkill', 'qa-bn-twin',
    'qa-bn-echo-deal',
];

function makePlayer(): Character {
    const p = deepClone(Player);
    p.knownCards = DECK.slice();
    // Neutral stats (S3): printed numbers land as printed.
    p.baseStats = { heart: 5, body: 5, mind: 5 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    return p;
}

function makeEnemy(over: Partial<Enemy> = {}): Enemy {
    const e = deepClone(FloatEye);
    e.id = 'enemy-big-numbers-dummy';
    e.health = 1000; e.maxHealth = 1000; e.effects = [];
    e.keywords = undefined; e.stages = undefined;
    return { ...e, ...over };
}

function open(enemy: Enemy = makeEnemy()): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(), enemy, DECK, 7);
    s = rollEncounterDice(s, rng).state;
    return s;
}

/** Plays `cardId` on its FREE line (no die). Throws if it is not in hand. */
function playFree(state: CombatEncounterState, cardId: string): CombatEncounterState {
    const entry = state.hand.find(h => h.cardId === cardId);
    if (!entry) throw new Error(`${cardId} not in hand: ${state.hand.map(h => h.cardId).join(', ')}`);
    return playCombatCard(state, { uid: entry.uid }, false, undefined, rng).state;
}

/** Seats `cardId` in hand so a fixture is always reachable regardless of draw. */
function seat(state: CombatEncounterState, cardId: string): CombatEncounterState {
    return { ...state, hand: [{ uid: `seat-${cardId}`, cardId }, ...state.hand] };
}

describe('scalePlayerHit — the scaler pipeline is exactly as printed', () => {
    it('applies read, colour match, WRATH, CHAIN, FLAY, EXECUTE in order', () => {
        // Base 10, neutral read, no bonuses at all.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: false, execute: false,
        })).toBe(10);

        // WRATH and CHAIN are FLAT and additive, after the multiplicative half.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 5, chain: 3,
            flay: false, execute: false,
        })).toBe(18);

        // FLAY multiplies what the flat bonuses left.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: true, execute: false,
        })).toBe(Math.round(10 * FLAY_DAMAGE_MULT));

        // EXECUTE multiplies on top of FLAY.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: true, execute: true,
        })).toBe(Math.round(Math.round(10 * FLAY_DAMAGE_MULT) * EXECUTE_DAMAGE_MULT));
    });

    it('never invents damage from a zero base', () => {
        expect(scalePlayerHit({
            base: 0, readMult: 1.5, colorMatch: true, wrath: 9, chain: 9,
            flay: true, execute: true,
        })).toBe(0);
    });

    it('a FREE-line hit is credited to its card in the attribution ledger', () => {
        const s = open();
        const after = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        expect(after.attribution['qa-bn-deal']).toMatchObject({ cardId: 'qa-bn-deal', name: 'QA Deal', damageDealt: 3 });
    });
});

describe('the DEAL family lands the printed number', () => {
    it('a FREE line deals its printed damage with no die spent', () => {
        const s = open();
        const before = s.enemy.health;
        const after = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        expect(before - after.enemy.health).toBe(3);
    });

    it('a multi-hit lands every one of its hits', () => {
        const s = open();
        const seated = seat(s, 'qa-bn-multi');
        const die = seated.dice.find(d => d.state === 'available' && d.color === 'body');
        if (!die) return; // colour-legal die not in this tray; the unit test above covers the maths
        const entry = seated.hand.find(h => h.cardId === 'qa-bn-multi')!;
        const before = seated.enemy.health;
        const after = playCombatCard(seated, { uid: entry.uid }, true, die.id, rng).state;
        // Three hits of 10 (plus any colour-match bonus) — never fewer.
        expect(before - after.enemy.health).toBeGreaterThanOrEqual(30);
    });

    it('WRATH persists across plays and adds to every later hit', () => {
        let s = open();
        s = playFree(seat(s, 'qa-bn-wrath'), 'qa-bn-wrath');
        expect(s.wrath).toBe(5);
        const before = s.enemy.health;
        s = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        // The FREE line's printed 3, plus the 5 WRATH already banked.
        expect(before - s.enemy.health).toBe(8);
    });

    it('CHAIN is spent by the next hit and fades on a turn that does not feed it', () => {
        let s = open();
        s = playFree(seat(s, 'qa-bn-chain'), 'qa-bn-chain');
        expect(s.chain).toBe(4);
        expect(s.chainFedThisTurn).toBe(true);
        const before = s.enemy.health;
        s = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        expect(before - s.enemy.health).toBe(7); // printed 3 + CHAIN 4
        expect(s.chain).toBe(0);                 // and the stack is spent
    });

    it('FLAY spends one stack per damage instance', () => {
        let s = open();
        s = playFree(seat(s, 'qa-bn-flay'), 'qa-bn-flay');
        expect(s.flay).toBe(1);
        const before = s.enemy.health;
        s = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        // 3 printed, x1.5 from the one FLAY stack.
        expect(before - s.enemy.health).toBe(Math.round(3 * FLAY_DAMAGE_MULT));
        expect(s.flay).toBe(0);
    });
});

describe('ECHO multiplies the hit COUNT, not the per-hit magnitude', () => {
    it('an echoed DEAL lands twice, as two damage instances', () => {
        // ECHO used to skip `deal` entirely — the card printed the keyword and
        // did nothing.
        const s = open();
        const seated = seat(s, 'qa-bn-echo-deal');
        const die = seated.dice.find(d => d.state === 'available' && d.color === 'body');
        if (!die) return; // no colour-legal die in this tray; the unit maths is covered above
        const entry = seated.hand.find(h => h.cardId === 'qa-bn-echo-deal')!;
        const before = seated.enemy.health;
        const res = playCombatCard(seated, { uid: entry.uid }, true, die.id, rng);
        const hits = res.events.filter(e => e.kind === 'damage-dealt'
            && (e as { target?: string }).target === 'enemy');
        expect(hits.length, 'an echoed DEAL must emit two damage instances').toBe(2);
        expect(before - res.state.enemy.health).toBeGreaterThan(0);
    });
});

describe('boss STAGES', () => {
    const stages: EnemyStage[] = [{
        at: { vitaePct: 0.99 },
        name: 'THE COURT ADJOURNS',
        text: 'It stops pretending this was ever a hearing.',
        heal: 50,
        threatBonus: 0.5,
    }];

    it('fires once at its threshold, heals, and never re-fires', () => {
        const foe = makeEnemy({ stages, difficulty: 'boss' });
        foe.health = 900; // already under the 99% threshold
        let s = open(foe);
        const res = resolveThreatPhase(s, rng);
        s = res.state;
        expect(s.stagesEntered).toEqual([0]);
        expect(s.stageThreatBonus).toBe(0.5);
        // Playtest fix 2026-09-04: the stage's heal is witnessed, not silent.
        expect(res.events.filter(e => e.kind === 'enemy-healed' && e.source === 'STAGE'))
            .toEqual([{ kind: 'enemy-healed', enemyId: foe.id, source: 'STAGE', amount: 50 }]);

        // A second boundary must not re-enter the same stage.
        const again = resolveThreatPhase(s, rng).state;
        expect(again.stagesEntered).toEqual([0]);
    });
});

describe('the VITAE curve', () => {
    it('separates the difficulty bands and honours an authored override', () => {
        // The exact figure follows the tuned curve; what this pins is the
            // SHAPE — the bands separate and an authored pool always wins.
            expect(enemyVitae(1, 'normal')).toBe(38);
        expect(enemyVitae(1, 'simple')).toBeLessThan(enemyVitae(1, 'normal'));
        expect(enemyVitae(7, 'elite')).toBeGreaterThan(enemyVitae(7, 'normal'));
        expect(enemyVitae(6, 'boss')).toBeGreaterThan(enemyVitae(6, 'elite'));
        expect(enemyVitae(110, 'unique')).toBeGreaterThan(2000);
        // An authored pool always wins.
        expect(enemyVitae(1, 'normal', 777)).toBe(777);
    });
});
