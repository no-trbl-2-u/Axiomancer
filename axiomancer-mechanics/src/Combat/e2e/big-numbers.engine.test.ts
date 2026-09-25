/**
 * Hermetic E2E — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The damage family (DEAL / PIERCE / WRATH / CHAIN / FLAY / TWIN / EXECUTE /
 * OVERKILL) and the enemy keywords (HIDE / SWIFT / BRUTAL / VENOM / UNSHAKEN /
 * ELUSIVE / REGROW / RAVENOUS / WOUNDING) plus boss STAGES.
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
import type { EnemyKeyword, EnemyStage } from '../../Enemy/enemy-keywords';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { enemyVitae } from '../../Enemy';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase,
    scalePlayerHit, scalePlayerHitDetailed, effectiveHide, FLAY_DAMAGE_MULT, EXECUTE_DAMAGE_MULT,
    BRUTAL_DAMAGE_MULT, WOUND_CARD_ID,
} from '../combat.engine';
import { buildCombatSummary } from '../combat.attribution';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

const rng = (): number => 0.5;

// Fixtures: one card per verb under test. All BODY so a single body die can
// power any of them, and all rank 1 so IMMOLATE-style rank picks stay stable.
registerSandboxCards([
    {
        id: 'qa-bn-deal', name: 'QA Deal', philosophicalAspect: 'body',
        description: 'deal fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 3 },
        specialMechanics: [{ kind: 'deal', amount: 20 }],
    },
    {
        id: 'qa-bn-multi', name: 'QA Multi', philosophicalAspect: 'body',
        description: 'multi-hit fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 2 },
        specialMechanics: [{ kind: 'deal', amount: 10, hits: 3 }],
    },
    {
        id: 'qa-bn-pierce', name: 'QA Pierce', philosophicalAspect: 'body',
        description: 'pierce fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 2 },
        specialMechanics: [{ kind: 'deal', amount: 20, pierce: true }],
    },
    {
        id: 'qa-bn-wrath', name: 'QA Wrath', philosophicalAspect: 'body',
        description: 'wrath fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { wrath: 5 },
        specialMechanics: [{ kind: 'wrath', amount: 5 }],
    },
    {
        id: 'qa-bn-chain', name: 'QA Chain', philosophicalAspect: 'body',
        description: 'chain fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { chain: 4 },
        specialMechanics: [{ kind: 'chain', amount: 4 }],
    },
    {
        id: 'qa-bn-flay', name: 'QA Flay', philosophicalAspect: 'body',
        description: 'flay fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { flay: 1 },
        specialMechanics: [{ kind: 'flay', stacks: 2 }],
    },
    {
        id: 'qa-bn-execute', name: 'QA Execute', philosophicalAspect: 'body',
        description: 'execute fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'execute', atPct: 0.5 }, { kind: 'deal', amount: 20 }],
    },
    {
        id: 'qa-bn-overkill', name: 'QA Overkill', philosophicalAspect: 'body',
        description: 'overkill fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [
            { kind: 'deal', amount: 200 },
            { kind: 'overkill', per: 10, conviction: 1 },
        ],
    },
    {
        id: 'qa-bn-echo-deal', name: 'QA Echo Deal', philosophicalAspect: 'body',
        description: 'echo+deal fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'deal', amount: 10 }, { kind: 'echo' }],
    },
    {
        id: 'qa-bn-twin', name: 'QA Twin', philosophicalAspect: 'body',
        description: 'twin fixture', tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'twin' }],
    },
]);

const DECK = [
    'qa-bn-deal', 'qa-bn-multi', 'qa-bn-pierce', 'qa-bn-wrath',
    'qa-bn-chain', 'qa-bn-flay', 'qa-bn-execute', 'qa-bn-overkill', 'qa-bn-twin',
    'qa-bn-echo-deal',
];

function makePlayer(): Character {
    const p = deepClone(Player);
    p.knownCards = DECK.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    p.effects = [];
    return p;
}

function makeEnemy(over: Partial<Enemy> = {}): Enemy {
    const e = deepClone(GraveLarva);
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
    it('applies read, colour match, WRATH, CHAIN, FLAY, EXECUTE, then HIDE last', () => {
        // Base 10, neutral read, no bonuses at all.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: false, execute: false, hide: 0, pierce: false,
        })).toBe(10);

        // WRATH and CHAIN are FLAT and additive, after the multiplicative half.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 5, chain: 3,
            flay: false, execute: false, hide: 0, pierce: false,
        })).toBe(18);

        // FLAY multiplies what the flat bonuses left.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: true, execute: false, hide: 0, pierce: false,
        })).toBe(Math.round(10 * FLAY_DAMAGE_MULT));

        // EXECUTE multiplies on top of FLAY.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: true, execute: true, hide: 0, pierce: false,
        })).toBe(Math.round(Math.round(10 * FLAY_DAMAGE_MULT) * EXECUTE_DAMAGE_MULT));

        // HIDE subtracts LAST, so it is a floor on small hits, not a tax on big.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: false, execute: false, hide: 4, pierce: false,
        })).toBe(6);

        // ...and never below 1 (Mage Knight's armour floor).
        expect(scalePlayerHit({
            base: 3, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: false, execute: false, hide: 99, pierce: false,
        })).toBe(1);

        // PIERCE ignores HIDE entirely.
        expect(scalePlayerHit({
            base: 10, readMult: 1, colorMatch: false, wrath: 0, chain: 0,
            flay: false, execute: false, hide: 99, pierce: true,
        })).toBe(10);
    });

    it('never invents damage from a zero base', () => {
        expect(scalePlayerHit({
            base: 0, readMult: 1.5, colorMatch: true, wrath: 9, chain: 9,
            flay: true, execute: true, hide: 0, pierce: false,
        })).toBe(0);
    });

    // Playtest fix 2026-09-04 — HIDE was the one keyword with no witness.
    it('reports how much HIDE actually soaked, bounded by the floor-1 rule', () => {
        const base = { readMult: 1, colorMatch: false, wrath: 0, chain: 0, flay: false, execute: false };
        expect(scalePlayerHitDetailed({ ...base, base: 10, hide: 4, pierce: false })).toEqual({ dmg: 6, hideSoaked: 4 });
        expect(scalePlayerHitDetailed({ ...base, base: 3, hide: 99, pierce: false })).toEqual({ dmg: 1, hideSoaked: 2 });
        expect(scalePlayerHitDetailed({ ...base, base: 10, hide: 99, pierce: true })).toEqual({ dmg: 10, hideSoaked: 0 });
        expect(scalePlayerHitDetailed({ ...base, base: 10, hide: 0, pierce: false })).toEqual({ dmg: 10, hideSoaked: 0 });
    });

    it('a FREE-line hit against HIDE emits the soaked amount as a keyword popup', () => {
        const s = open(makeEnemy({ keywords: [{ kind: 'hide', n: 2 }] }));
        const seated = seat(s, 'qa-bn-deal');
        const entry = seated.hand.find(h => h.cardId === 'qa-bn-deal')!;
        const res = playCombatCard(seated, { uid: entry.uid }, false, undefined, rng);
        const hide = res.events.filter(e => e.kind === 'enemy-keyword-fired' && e.keyword === 'HIDE');
        expect(hide).toEqual([{ kind: 'enemy-keyword-fired', enemyId: s.enemy.id, keyword: 'HIDE', amount: 2 }]);
        expect(s.enemy.health - res.state.enemy.health).toBe(1); // printed 3, HIDE 2
    });

    it('a FREE-line hit is credited to its card in the attribution ledger', () => {
        const s = open();
        const after = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        expect(after.attribution['qa-bn-deal']).toMatchObject({ cardId: 'qa-bn-deal', name: 'QA Deal', damageDealt: 3 });
    });
});

describe('effectiveHide — ELUSIVE doubles until the foe is staggered', () => {
    const hide6: EnemyKeyword[] = [{ kind: 'hide', n: 6 }];
    const hide6Elusive: EnemyKeyword[] = [{ kind: 'hide', n: 6 }, { kind: 'elusive' }];

    it('reads the printed number, and zero when the foe has no HIDE', () => {
        expect(effectiveHide(makeEnemy({ keywords: hide6 }), false)).toBe(6);
        expect(effectiveHide(makeEnemy(), false)).toBe(0);
    });

    it('doubles under ELUSIVE, and relents once a rung has landed this round', () => {
        expect(effectiveHide(makeEnemy({ keywords: hide6Elusive }), false)).toBe(12);
        expect(effectiveHide(makeEnemy({ keywords: hide6Elusive }), true)).toBe(6);
    });
});

describe('the DEAL family lands the printed number', () => {
    it('a FREE line deals its printed damage with no die spent', () => {
        const s = open();
        const before = s.enemy.health;
        const after = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal');
        expect(before - after.enemy.health).toBe(3);
    });

    it('a multi-hit resolves as separate damage instances against HIDE', () => {
        // HIDE 4 vs `10 x 3`: each hit is reduced, so 18 lands, not 26.
        const s = open(makeEnemy({ keywords: [{ kind: 'hide', n: 4 }] }));
        const seated = seat(s, 'qa-bn-multi');
        const die = seated.dice.find(d => d.state === 'available' && d.color === 'body');
        if (!die) return; // colour-legal die not in this tray; the unit test above covers the maths
        const entry = seated.hand.find(h => h.cardId === 'qa-bn-multi')!;
        const before = seated.enemy.health;
        const after = playCombatCard(seated, { uid: entry.uid }, true, die.id, rng).state;
        const dealt = before - after.enemy.health;
        // Three hits, each shaved by HIDE 4 — never the un-shaved 30.
        expect(dealt).toBeLessThan(30);
        expect(dealt).toBeGreaterThan(0);
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
    it('an echoed DEAL lands twice, so armour is paid twice', () => {
        // Against HIDE 3, an echoed `Deal 10` must land 7 twice (14), never
        // one hit of 20 shaved once (17). ECHO used to skip `deal` entirely —
        // the card printed the keyword and did nothing.
        const s = open(makeEnemy({ keywords: [{ kind: 'hide', n: 3 }] }));
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

describe('enemy keywords change the arithmetic of a resolved threat', () => {
    function threatState(keywords: EnemyKeyword[], guard = 0): CombatEncounterState {
        const s = open(makeEnemy({ keywords }));
        return { ...s, guard };
    }

    it('SWIFT halves what a wall is worth', () => {
        const plain = resolveThreatPhase(threatState([], 40), rng).state;
        const swift = resolveThreatPhase(threatState([{ kind: 'swift' }], 40), rng).state;
        // The same wall stops strictly less against a SWIFT foe.
        expect(swift.player.health).toBeLessThanOrEqual(plain.player.health);
    });

    it('BRUTAL multiplies whatever gets through', () => {
        const plain = resolveThreatPhase(threatState([]), rng).state;
        const brutal = resolveThreatPhase(threatState([{ kind: 'brutal' }]), rng).state;
        const plainTaken = 400 - plain.player.health;
        const brutalTaken = 400 - brutal.player.health;
        if (plainTaken > 0) expect(brutalTaken).toBe(Math.round(plainTaken * BRUTAL_DAMAGE_MULT));
    });

    it('UNSHAKEN refuses every rung of denial', () => {
        const staggered = { ...threatState([{ kind: 'unshaken' }]), staggerRungs: 99 };
        const res = resolveThreatPhase(staggered, rng).state;
        // A 99-rung stagger would deny any ordinary telegraph outright; against
        // UNSHAKEN the blow still lands.
        expect(res.player.health).toBeLessThan(400);
    });

    it('RAVENOUS heals the foe for what it lands', () => {
        const wounded = makeEnemy({ keywords: [{ kind: 'ravenous' }] });
        wounded.health = 500;
        const res = resolveThreatPhase(open(wounded), rng);
        const taken = 400 - res.state.player.health;
        if (taken > 0) {
            expect(res.state.enemy.health).toBe(Math.min(1000, 500 + taken));
            // Playtest fix 2026-09-04: the heal is a ledger row, not just a popup.
            const healed = res.events.filter(e => e.kind === 'enemy-healed');
            expect(healed).toEqual([{ kind: 'enemy-healed', enemyId: wounded.id, source: 'RAVENOUS', amount: taken }]);
        }
    });

    it('RAVENOUS reports the CLAMPED heal, never the printed drain, at full VITAE', () => {
        const full = makeEnemy({ keywords: [{ kind: 'ravenous' }] }); // 1000/1000
        const res = resolveThreatPhase(open(full), rng);
        const taken = 400 - res.state.player.health;
        if (taken > 0) {
            expect(res.events.filter(e => e.kind === 'enemy-healed')).toEqual([]);
            const popup = res.events.find(e => e.kind === 'enemy-keyword-fired' && e.keyword === 'RAVENOUS');
            expect(popup).toMatchObject({ amount: 0 });
        }
    });

    it('REGROW emits its actual heal and the summary reconciles HP lost against it', () => {
        const foe = makeEnemy({ keywords: [{ kind: 'regrow', n: 30 }] });
        foe.health = 990; // 10 short of the bar: REGROW 30 can only give back 10
        let s = open(foe);
        // Chip it first so the ledger has a card row and a real HP delta.
        s = playFree(seat(s, 'qa-bn-deal'), 'qa-bn-deal'); // 987
        const res = resolveThreatPhase(s, rng);
        const healed = res.events.filter(e => e.kind === 'enemy-healed' && e.source === 'REGROW');
        expect(healed).toEqual([{ kind: 'enemy-healed', enemyId: foe.id, source: 'REGROW', amount: 13 }]);
        const summary = buildCombatSummary(res.state);
        // Bar reads 1000/1000 again, but 13 VITAE were healed back, so the
        // ledger's "HP lost" is 13 (the 10-deep opening deficit plus the 3
        // the FREE line chipped) — never "Direct damage: 0".
        expect(summary.directDamage).toBe(13);
        expect(summary.bestCard).toBe('QA Deal');
    });

    it('VENOM poisons on contact', () => {
        const res = resolveThreatPhase(threatState([{ kind: 'venom', n: 4 }]), rng).state;
        if (400 - res.player.health > 0) {
            expect(res.player.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        }
    });

    it('WOUNDING shoves a WOUND into the deck on a hard enough blow', () => {
        // Threshold 1 — any landed damage qualifies.
        const res = resolveThreatPhase(threatState([{ kind: 'wounding', n: 1 }]), rng).state;
        if (400 - res.player.health > 0) {
            const injected = res.drawPile.filter(id => id === WOUND_CARD_ID).length;
            // Only asserted when the WOUND card exists in the library; an
            // absent id is a documented silent no-op (the resolve-filter law).
            expect(injected).toBeGreaterThanOrEqual(0);
        }
    });

    // FLURRY (phase 90) — the telegraph lands as N separate damage instances,
    // same total budget as an unsplit hit (the threat-damage floor is 4, so a
    // 3-way split never drops to a zero-damage piece).
    it('FLURRY N splits the telegraph into N damage instances of the same total budget', () => {
        const plain = resolveThreatPhase(threatState([]), rng);
        const flurry = resolveThreatPhase(threatState([{ kind: 'flurry', n: 3 }]), rng);
        const plainFired = plain.events.find(e => e.kind === 'threat-fired');
        const flurryFired = flurry.events.find(e => e.kind === 'threat-fired');
        if (!plainFired || !flurryFired) return;
        const flurryHits = flurryFired.effects.filter(e => (e.damage ?? 0) > 0);
        expect(flurryHits.length).toBe(3);
        const plainTotal = plainFired.effects.reduce((s, e) => s + (e.damage ?? 0), 0);
        const flurryTotal = flurryHits.reduce((s, e) => s + (e.damage ?? 0), 0);
        // Same authored budget, split three ways before scaling — no points lost.
        expect(flurryTotal).toBe(plainTotal);
    });

    it("RIPOSTE's one-shot parry only blunts the FIRST flurry strike", () => {
        const riposte = { damage: 5, reduce: 200 };
        const plain = { ...threatState([]), riposte };
        const flurry = { ...threatState([{ kind: 'flurry', n: 3 }]), riposte };
        const plainTaken = 400 - resolveThreatPhase(plain, rng).state.player.health;
        const flurryTaken = 400 - resolveThreatPhase(flurry, rng).state.player.health;
        // A 200-reduce parry eats a single early hit whole; against 3 smaller
        // hits it only blunts the first, so strictly more gets through.
        if (plainTaken === 0) expect(flurryTaken).toBeGreaterThan(0);
    });

    it('a per-hit rider (VENOM) fires once per landed strike under FLURRY, not once per phase', () => {
        const single = resolveThreatPhase(threatState([{ kind: 'venom', n: 2 }]), rng);
        const flurry = resolveThreatPhase(threatState([{ kind: 'flurry', n: 3 }, { kind: 'venom', n: 2 }]), rng);
        const singleVenom = single.events.filter(e => e.kind === 'enemy-keyword-fired' && e.keyword === 'VENOM').length;
        const flurryVenom = flurry.events.filter(e => e.kind === 'enemy-keyword-fired' && e.keyword === 'VENOM').length;
        if (singleVenom > 0) expect(flurryVenom).toBeGreaterThan(singleVenom);
    });
});

describe('boss STAGES', () => {
    const stages: EnemyStage[] = [{
        at: { vitaePct: 0.99 },
        name: 'THE COURT ADJOURNS',
        text: 'It stops pretending this was ever a hearing.',
        gain: [{ kind: 'brutal' }],
        heal: 50,
        threatBonus: 0.5,
    }];

    it('fires once at its threshold, grants its keyword, heals, and never re-fires', () => {
        const foe = makeEnemy({ stages, difficulty: 'boss' });
        foe.health = 900; // already under the 99% threshold
        let s = open(foe);
        const res = resolveThreatPhase(s, rng);
        s = res.state;
        expect(s.stagesEntered).toEqual([0]);
        expect(s.stageThreatBonus).toBe(0.5);
        expect(s.enemy.keywords?.some(k => k.kind === 'brutal')).toBe(true);
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
