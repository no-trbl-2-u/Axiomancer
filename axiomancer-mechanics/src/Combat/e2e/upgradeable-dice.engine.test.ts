/**
 * Hermetic E2E — Spec 33 Upgradeable Dice (Phase D2; the only dice model
 * since the D7 flag collapse, 2026-09-25).
 *
 * Pins the model to exact engine behavior:
 *   §1 ROLL LAW — 4 fixed-color dice every round, faces from the gear tables;
 *      the color law gates powering (gold = wild); no draft, no single-die law
 *   §1 BOON — fires its gear payload (+2◆) only when the die is USED
 *      (the owner-ratified use-triggered rule), including from the Reserve
 *   §1 CEILING — 7 die objects; overflow converts to +1◆, never silently drops
 *   §2 STANCE — stance = last PAID card's stance; FREE lines never shift it;
 *      open stance checks resolve at phase end (punishes x1.5 / yields x0.5+1◆);
 *      stance-less players fire nothing
 *   §3 MOMENTUM — start/advance; breaks (wrong OR same color) reset to NULL
 *      (owner-locked D1); persists across rounds; surge grants an until-spent
 *      gold die and resets to null
 *   §4 PRESS FATE — 1◆ rerolls ALL miss faces, once per round, HONESTLY (no
 *      stance/mana guarantee — an all-miss reroll result stands)
 *   §6 OVERHEAT — a spent die powers a second card; a crack forces all-miss
 *      next round and excludes the die from that round's Press Fate
 *
 * All rolls are pinned via explicit sequential rng closures (no singleton
 * dependence).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
    endTurn, playSignatureSkill, overheatSpentDie, startTurn,
    READ_DAMAGE_MULT, CONVICTION_CAP,
} from '../combat.engine';
import {
    UPGRADEABLE_DIE_COLORS, UPGRADEABLE_TABLE_CEILING,
    PRESS_FATE_COST, SPECIAL_CONVICTION_DEFAULT, SURGE_DIE_PREFIX,
} from '../combat.upgradeable-dice';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => {
    vi.restoreAllMocks();
});

// ── Fixtures ────────────────────────────────────────────────────────────────

registerSandboxCards([
    {
        id: 'ud-body-dot', name: 'UD Body DoT',
        philosophicalAspect: 'body', description: 'body fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'ud-mind-dot', name: 'UD Mind DoT',
        philosophicalAspect: 'mind', description: 'mind fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_curse', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
    {
        id: 'ud-heart-dot', name: 'UD Heart DoT',
        philosophicalAspect: 'heart', description: 'heart fixture', tier: 1,
        targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    },
]);

const DECK = ['ud-body-dot', 'ud-mind-dot', 'ud-heart-dot', 'ud-body-dot', 'ud-mind-dot', 'ud-heart-dot'];

/** Sequential rng: yields the given values in order, then repeats the last. */
function seqRng(...vals: number[]): () => number {
    let i = 0;
    return () => vals[Math.min(i++, vals.length - 1)];
}

// Face windows for the colored gear (1 special / 2 mana / 3 miss):
// floor(v*6): 0 → special, 1-2 → mana, 3-5 → miss.
const BOON = 0.05;   // idx 0
const MANA = 0.25;      // idx 1
const MISS = 0.95;      // idx 5
// Gold gear (1 special / 1 mana / 4 miss): idx 0 special, idx 1 mana, 2-5 miss.

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 400; p.maxHealth = 400;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind'): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-ud-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Opens an encounter and rolls the first turn with the given face sequence
 *  (roll order: body, mind, heart, wild — `UPGRADEABLE_DIE_COLORS`). */
function open(faces: number[] = [MANA, MANA, MANA, MANA]): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(DECK), makeEnemy(500, 'body'), DECK, 7);
    s = rollEncounterDice(s, seqRng(...faces)).state;
    return s;
}

/** The tray die of `color` (never floating). */
function trayDie(s: CombatEncounterState, color: string) {
    const d = s.dice.find(x => x.color === color && !x.floating);
    if (!d) throw new Error(`no tray die of color ${color}`);
    return d;
}

/** Plays a paid card from hand powered by `dieId`; throws if not in hand. */
function paid(s: CombatEncounterState, cardId: string, dieId: string, rng = seqRng(0.5)) {
    const entry = s.hand.find(h => h.cardId === cardId);
    if (!entry) throw new Error(`${cardId} not in hand: ${s.hand.map(h => h.cardId).join(',')}`);
    return playCombatCard(s, { uid: entry.uid }, true, dieId, rng);
}

function events(res: { events: CombatEvent[] }, kind: CombatEvent['kind']): CombatEvent[] {
    return res.events.filter(e => e.kind === kind);
}

// ── §1 — the roll law ───────────────────────────────────────────────────────

describe('spec 33 §1 — the four-die roll law', () => {
    it('rolls exactly one die per fixed color with faces from the gear tables', () => {
        const s = open([BOON, MANA, MISS, MISS]);
        const tray = s.dice.filter(d => !d.floating);
        expect(tray.map(d => d.color)).toEqual([...UPGRADEABLE_DIE_COLORS]);
        expect(trayDie(s, 'body').face).toBe('special');
        expect(trayDie(s, 'mind').face).toBe('mana');
        expect(trayDie(s, 'heart').face).toBe('miss');
        expect(trayDie(s, 'heart').state).toBe('locked');
        expect(trayDie(s, 'wild').face).toBe('miss'); // gold: idx 5 ≥ 2 → miss
    });

    it('THE COLOR LAW — an off-color mana die fizzles; gold powers any color', () => {
        const s = open([MANA, MANA, MANA, MANA]);
        const offColor = paid(s, 'ud-mind-dot', trayDie(s, 'body').id);
        expect(events(offColor, 'card-played')).toHaveLength(0);
        expect(events(offColor, 'effect-fizzled')).toHaveLength(1);

        const viaGold = paid(s, 'ud-mind-dot', trayDie(s, 'wild').id);
        expect(events(viaGold, 'card-played')).toHaveLength(1);
    });

    it('no single-die law — two paid plays in one round off two different dice', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        const first = paid(s, 'ud-body-dot', trayDie(s, 'body').id);
        expect(events(first, 'card-played')).toHaveLength(1);
        s = first.state;
        const second = paid(s, 'ud-mind-dot', trayDie(s, 'mind').id);
        expect(events(second, 'card-played')).toHaveLength(1);
    });

    it('a miss face is dead — powering with it fizzles with the miss message', () => {
        const s = open([MISS, MANA, MANA, MANA]);
        const res = paid(s, 'ud-body-dot', trayDie(s, 'body').id);
        expect(events(res, 'card-played')).toHaveLength(0);
        const fizzle = events(res, 'effect-fizzled')[0];
        expect(fizzle.kind === 'effect-fizzled' && fizzle.message).toContain('miss face is dead');
    });

    it('the read is retired — every play lands printed (neutral)', () => {
        const s = open([MANA, MANA, MANA, MANA]);
        const res = paid(s, 'ud-body-dot', trayDie(s, 'body').id);
        const played = events(res, 'card-played')[0];
        expect(played.kind === 'card-played' && played.advantage).toBe('neutral');
    });
});

// ── §1 — BOON fires on use ───────────────────────────────────────────────

describe('spec 33 §1/§6 — the BOON payload (ratified use-triggered rule)', () => {
    it('a special die USED to power a card fires +2◆', () => {
        const s = open([BOON, MANA, MANA, MANA]);
        const before = s.conviction;
        const res = paid(s, 'ud-body-dot', trayDie(s, 'body').id);
        expect(events(res, 'special-fired')).toHaveLength(1);
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, before + SPECIAL_CONVICTION_DEFAULT));
    });

    it('an UNSPENT special grants nothing at end of round (use-triggered, not roll-triggered)', () => {
        const s = open([BOON, MANA, MANA, MANA]);
        const before = s.conviction;
        const ended = endTurn(s);
        expect(ended.state.conviction).toBe(before);
        expect(events(ended, 'special-fired')).toHaveLength(0);
    });

    it('a banked special still fires its payload when spent from the Reserve', () => {
        let s = open([BOON, MANA, MANA, MANA]);
        // End of round banks the best die — the special.
        const ended = endTurn(s);
        const banked = events(ended, 'die-banked')[0];
        expect(banked.kind === 'die-banked' && banked.color).toBe('body');
        s = ended.state;
        expect(s.reserve?.[0]?.face).toBe('special');
        // Next round: power a body card from the Reserve.
        s = { ...s, turnTakenThisPhase: false };
        s = startTurn(s, seqRng(MISS, MISS, MISS, MISS)).state;
        const before = s.conviction;
        const res = paid(s, 'ud-body-dot', s.reserve![0].id);
        expect(events(res, 'card-played')).toHaveLength(1);
        expect(events(res, 'special-fired')).toHaveLength(1);
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, before + SPECIAL_CONVICTION_DEFAULT));
    });
});

// ── §4 — Press Fate, honest ─────────────────────────────────────────────────

describe('spec 33 §4 — Press Fate (1◆, all misses, once per round, honest)', () => {
    it('costs 1◆ and rerolls ONLY the miss faces', () => {
        let s = open([MANA, MISS, MISS, MISS]);
        s = { ...s, conviction: 3 };
        const res = playSignatureSkill(s, 'sig-press-the-point', seqRng(BOON, MANA, MANA));
        expect(res.state.conviction).toBe(3 - PRESS_FATE_COST);
        const rerolled = events(res, 'press-fate-rerolled')[0];
        expect(rerolled.kind === 'press-fate-rerolled' && rerolled.dieIds).toHaveLength(3);
        // The untouched mana die keeps its face; the three misses re-rolled.
        expect(trayDie(res.state, 'body').face).toBe('mana');
        expect(trayDie(res.state, 'mind').face).toBe('special');
        expect(trayDie(res.state, 'heart').face).toBe('mana');
        expect(res.state.pressFateRound).toBe(res.state.round);
    });

    it('is HONEST — a reroll may come up all-miss again and it stands', () => {
        let s = open([MANA, MISS, MISS, MISS]);
        s = { ...s, conviction: 3 };
        const res = playSignatureSkill(s, 'sig-press-the-point', seqRng(MISS, MISS, MISS));
        expect(trayDie(res.state, 'mind').face).toBe('miss');
        expect(trayDie(res.state, 'heart').face).toBe('miss');
        expect(trayDie(res.state, 'wild').face).toBe('miss');
    });

    it('refuses a second press in the same round', () => {
        let s = open([MISS, MISS, MISS, MISS]);
        s = { ...s, conviction: 6 };
        const first = playSignatureSkill(s, 'sig-press-the-point', seqRng(MISS, MISS, MISS, MISS));
        const second = playSignatureSkill(first.state, 'sig-press-the-point', seqRng(MANA));
        expect(events(second, 'signature-cast')).toHaveLength(0);
        const fizzle = events(second, 'effect-fizzled')[0];
        expect(fizzle.kind === 'effect-fizzled' && fizzle.message).toContain('already pressed');
        expect(second.state.conviction).toBe(first.state.conviction);
    });
});

// ── §2/§3 — stance-from-cards + momentum ────────────────────────────────────

describe('spec 33 §2/§3 — stance-from-cards + the null-reset momentum chain', () => {
    function openAllMana(): CombatEncounterState {
        return open([MANA, MANA, MANA, MANA]);
    }

    it('a PAID play sets stance and starts momentum; a FREE play touches neither', () => {
        const s = openAllMana();
        const free = playCombatCard(s, { uid: s.hand.find(h => h.cardId === 'ud-heart-dot')!.uid }, false, undefined, seqRng(0.5));
        expect(free.state.playerStance ?? null).toBeNull();
        expect(free.state.momentumV2 ?? null).toBeNull();

        const res = paid(s, 'ud-body-dot', trayDie(s, 'body').id);
        expect(res.state.playerStance).toBe('body');
        expect(res.state.momentumV2).toEqual({ color: 'body', length: 1 });
        expect(events(res, 'stance-shifted')).toHaveLength(1);
        expect(events(res, 'momentum-advanced')).toHaveLength(1);
    });

    it('a SAME-color paid play breaks the chain to NULL (strict — owner-locked D1)', () => {
        let s = openAllMana();
        s = paid(s, 'ud-body-dot', trayDie(s, 'body').id).state;
        expect(s.momentumV2).toEqual({ color: 'body', length: 1 });
        // Guarantee a second body card in hand (the shuffle may not have
        // drawn the deck's other copy), then power it with gold.
        s = { ...s, hand: [...s.hand, { uid: 'ud-extra-body', cardId: 'ud-body-dot' }] };
        const res = paid(s, 'ud-body-dot', trayDie(s, 'wild').id);
        expect(events(res, 'momentum-broken')).toHaveLength(1);
        expect(res.state.momentumV2 ?? null).toBeNull();
        expect(res.state.playerStance).toBe('body'); // stance stays — only the chain broke
    });

    it('a WRONG-color paid play (non-successor) also resets to NULL', () => {
        let s = openAllMana();
        s = paid(s, 'ud-heart-dot', trayDie(s, 'heart').id).state; // heart → successor is body
        const res = paid(s, 'ud-mind-dot', trayDie(s, 'mind').id); // mind ≠ body → break
        expect(res.state.momentumV2 ?? null).toBeNull();
    });

    it('heart → body → mind SURGES: an until-spent gold die joins and momentum resets', () => {
        let s = openAllMana();
        s = paid(s, 'ud-heart-dot', trayDie(s, 'heart').id).state;
        s = paid(s, 'ud-body-dot', trayDie(s, 'body').id).state;
        expect(s.momentumV2).toEqual({ color: 'body', length: 2 });
        const res = paid(s, 'ud-mind-dot', trayDie(s, 'mind').id);
        const surge = events(res, 'momentum-surged')[0];
        expect(surge.kind === 'momentum-surged').toBe(true);
        expect(res.state.momentumV2 ?? null).toBeNull();
        const surgeDie = res.state.dice.find(d => d.id.startsWith(SURGE_DIE_PREFIX));
        expect(surgeDie).toBeDefined();
        expect(surgeDie!.color).toBe('wild');
        expect(surgeDie!.floating).toBe(true);
        expect(surgeDie!.temporary).toBe(true); // never saved across combats
    });

    it('momentum PERSISTS across rounds (resolve → next roll keeps the chain)', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        s = paid(s, 'ud-heart-dot', trayDie(s, 'heart').id).state;
        expect(s.momentumV2).toEqual({ color: 'heart', length: 1 });
        s = resolveThreatPhase(s, seqRng(0.5)).state;
        expect(s.momentumV2).toEqual({ color: 'heart', length: 1 });
        expect(s.playerStance).toBe('heart');
    });
});

// ── §2 — open stance checks ─────────────────────────────────────────────────

describe('spec 33 §2 — open stance checks at phase end', () => {
    function withCheck(
        s: CombatEncounterState,
        check: { punishes?: 'heart' | 'body' | 'mind'; yields?: 'heart' | 'body' | 'mind' } | undefined,
        damage = 20,
    ): CombatEncounterState {
        const phase = {
            ...s.threatPhases[0],
            threatAction: { description: 'test swing', effects: [{ damage }] },
            stanceCheck: check,
        };
        return { ...s, threatPhases: [phase, ...s.threatPhases.slice(1)], currentPhaseIndex: 0 };
    }

    function hpLost(s: CombatEncounterState): number {
        const res = resolveThreatPhase(s, seqRng(0.5));
        return s.player.health - res.state.player.health;
    }

    it('ending in the PUNISHED stance lands the hit x1.5', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        s = paid(s, 'ud-heart-dot', trayDie(s, 'heart').id).state;
        const neutral = hpLost(withCheck(s, undefined));
        const punished = hpLost(withCheck(s, { punishes: 'heart' }));
        expect(neutral).toBeGreaterThan(0);
        expect(punished).toBe(Math.round(neutral * READ_DAMAGE_MULT.advantage / 1));
    });

    it('ending in the YIELDED stance blunts to x0.5 and pays +1◆', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        s = paid(s, 'ud-heart-dot', trayDie(s, 'heart').id).state;
        const neutralLoss = hpLost(withCheck(s, undefined));
        const checked = withCheck(s, { yields: 'heart' });
        const res = resolveThreatPhase(checked, seqRng(0.5));
        const yieldLoss = s.player.health - res.state.player.health;
        expect(yieldLoss).toBeLessThan(neutralLoss);
        const resolved = events(res, 'stance-check-resolved')[0];
        expect(resolved.kind === 'stance-check-resolved' && resolved.outcome).toBe('yielded');
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, checked.conviction + 1));
    });

    it('a STANCE-LESS player fires no check — it passes silently', () => {
        const s = open([MANA, MANA, MANA, MANA]); // no card played — stance-less
        const neutral = hpLost(withCheck(s, undefined));
        const withPunish = withCheck(s, { punishes: 'heart' });
        const res = resolveThreatPhase(withPunish, seqRng(0.5));
        expect(s.player.health - res.state.player.health).toBe(neutral);
        const resolved = events(res, 'stance-check-resolved')[0];
        expect(resolved.kind === 'stance-check-resolved' && resolved.outcome).toBe('none');
    });
});

// ── §1 — the table ceiling ──────────────────────────────────────────────────

describe('spec 33 §1 — the 7-object table ceiling (overflow → +1◆)', () => {
    it('materialization past the ceiling converts the overflow to +1◆', () => {
        let s = initializeCombatEncounter(makePlayer(DECK), makeEnemy(500, 'body'), DECK, 7);
        // 4 rolled + gold+lead pair (6 tray) + 2 banked = 8 objects → 1 over.
        s = {
            ...s,
            permanentWildDice: 1,
            reserve: [
                { id: 'r-1', color: 'body', face: 'mana', state: 'available', temporary: false, pips: 0 },
                { id: 'r-2', color: 'mind', face: 'mana', state: 'available', temporary: false, pips: 0 },
            ],
        };
        const before = s.conviction;
        const res = rollEncounterDice(s, seqRng(MANA, MANA, MANA, MANA, MANA, MANA));
        expect(events(res, 'die-overflowed')).toHaveLength(1);
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, before + 1));
        expect(res.state.dice.length + (res.state.reserve ?? []).length).toBe(UPGRADEABLE_TABLE_CEILING);
    });
});

// ── §6 — OVERHEAT ───────────────────────────────────────────────────────────

describe('spec 33 §6 — OVERHEAT (second play at 35% crack risk)', () => {
    it('refreshes a spent die for a second play; a crack forces all-miss NEXT round and blocks its Press Fate', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        const bodyDie = trayDie(s, 'body');
        s = paid(s, 'ud-body-dot', bodyDie.id).state;
        expect(s.dice.find(d => d.id === bodyDie.id)?.state).toBe('spent');

        // Push with a cracking roll (< OVERHEAT_CRACK_CHANCE).
        const pushed = overheatSpentDie(s, bodyDie.id, seqRng(0.1));
        expect(events(pushed, 'die-refreshed')).toHaveLength(1);
        expect(events(pushed, 'die-cracked')).toHaveLength(1);
        s = pushed.state;
        expect(s.dice.find(d => d.id === bodyDie.id)?.state).toBe('available');
        // The second play lands off the same die (hand copy guaranteed —
        // the shuffle may not have drawn the deck's other body card).
        s = { ...s, hand: [...s.hand, { uid: 'ud-extra-body-oh', cardId: 'ud-body-dot' }] };
        const second = paid(s, 'ud-body-dot', bodyDie.id);
        expect(events(second, 'card-played')).toHaveLength(1);
        s = second.state;

        // Next round: the body die is ALL-MISS without consuming rng for it —
        // the sequence below feeds mind, heart, wild only (heart rolls miss).
        s = { ...s, turnTakenThisPhase: false };
        s = startTurn(s, seqRng(MANA, MISS, MANA)).state;
        expect(trayDie(s, 'body').face).toBe('miss');
        expect(trayDie(s, 'mind').face).toBe('mana');
        expect(trayDie(s, 'heart').face).toBe('miss');

        // Press Fate rerolls the honest miss (heart) but REFUSES the cracked
        // body die — its miss is a stated consequence, not bad luck.
        s = { ...s, conviction: 3 };
        const pressed = playSignatureSkill(s, 'sig-press-the-point', seqRng(MANA));
        const rerolled = events(pressed, 'press-fate-rerolled')[0];
        expect(rerolled.kind === 'press-fate-rerolled' && rerolled.dieIds).toEqual([trayDie(s, 'heart').id]);
        expect(trayDie(pressed.state, 'heart').face).toBe('mana');
        expect(trayDie(pressed.state, 'body').face).toBe('miss');
    });

    it('a clean push (no crack) leaves the next round un-forced', () => {
        let s = open([MANA, MANA, MANA, MANA]);
        const bodyDie = trayDie(s, 'body');
        s = paid(s, 'ud-body-dot', bodyDie.id).state;
        const pushed = overheatSpentDie(s, bodyDie.id, seqRng(0.9));
        expect(events(pushed, 'die-cracked')).toHaveLength(0);
        expect(pushed.state.crackedDice ?? []).toHaveLength(0);
    });
});
