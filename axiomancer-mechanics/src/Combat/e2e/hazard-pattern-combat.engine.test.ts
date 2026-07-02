/**
 * Hermetic E2E — Hazard-Pattern Combat (Spec 25 + Spec 26b stance-draft redesign).
 *
 * Covers the new turn model end to end with seeded / stubbed RNG:
 *   - per-turn 2-die draft; the unpicked die → +1 Conviction
 *   - the hidden-stance read (advantage / disadvantage) scales pressure and a
 *     read-win grants bonus Conviction; first draft reveals the phase stance
 *   - cards keep colors → a color-match bonus on an offensive land
 *   - direct-damage cards still contribute 0 pressure
 *   - the status-combo loop refreshes the drafted die for a chain
 *   - between-phases fires DoT ticks + ticks durations + draws a fresh hand
 *   - Signature Skills spend Conviction (scout / DoT / pressure) regardless of hand
 *   - victory by HP depletion via status play (skill-sourced cards only); post-combat attribution
 *   - the Monte-Carlo sim reports per-phase Clear rates
 *
 * The effects + skill engines are unchanged, so their suites (run separately)
 * are the witness that this driver did not perturb them.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    resolveCardDieCost, resolveRead, getCard, buildCombatSummary,
    draftStanceDie, getDraftedDie, isPhaseStanceRevealed,
    playSignatureSkill, discardCombatCard, projectCardImpact, startTurn, endTurn,
} from '../combat.engine';
import { SIGNATURE_KITS, playerArchetype, CONCLUDE_DMG_PER_STACK } from '../combat.signature';
import { rollCombatCardRewards, addRewardCard, unlockSkillViaDilemma, COMBAT_REWARD_POOL } from '../combat.rewards';
import { buildCombatDeck, COMBAT_HAND_SIZE } from '../combat.deck';
import { getCardById } from '../../Cards/cards.library';
import { simulateHazardPatternCombat } from '../combat.encounter.sim';
import { getThreatSequence, deriveIntentType } from '../combat.threat';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';
import type { ActiveEffect } from '../../Effects/types';
import { lookupEffect, applyEffect } from '../../Effects';

afterEach(() => {
    vi.restoreAllMocks();
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DOT_BODY = 'slippery-slope';       // body, tier 2, applies debuff_bleed (DoT)
const CONTROL_HEART = 'eternal-regress'; // heart, tier 2, confusion + slow (control)
const DAMAGE_BODY = 'achilles-gambit';   // body, tier 1, basePower 12, no status effect
const BEFRIEND = 'befriend';             // heart, tier 1

function makePlayer(skills: string[]): Character {
    const p = deepClone(Player);
    p.knownSkills = skills.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'heart'): Enemy {
    const e = deepClone(TidepoolCrab);
    e.id = 'enemy-test-dummy';
    e.health = hp;
    e.maxHealth = hp;
    e.effects = [];
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
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

/** Drafts dice index 0 and plays `skillId`'s bottom action. */
function draftAndPlay(state: CombatEncounterState, skillId: string, dieIndex = 0) {
    let s = draftStanceDie(state, state.dice[dieIndex].id).state;
    const entry = s.hand.find(h => h.cardId === skillId);
    if (!entry) return { state: s, played: false } as const;
    const res = playCombatCard(s, { uid: entry.uid }, true);
    return { state: res.state, events: res.events, played: res.state !== s } as const;
}

// ── RPS read (§1) — pure, no RNG ─────────────────────────────────────────────

describe('Spec 26b §1 — the hidden-stance read', () => {
    it('a die whose stance beats the enemy stance is an advantage read', () => {
        expect(resolveRead('heart', 'body')).toBe('advantage');
        expect(resolveRead('body', 'mind')).toBe('advantage');
        expect(resolveRead('mind', 'heart')).toBe('advantage');
    });
    it('a die whose stance loses to the enemy stance is a disadvantage read', () => {
        expect(resolveRead('body', 'heart')).toBe('disadvantage');
        expect(resolveRead('mind', 'body')).toBe('disadvantage');
        expect(resolveRead('heart', 'mind')).toBe('disadvantage');
    });
    it('a same-stance die is neutral; a wild/x die has no contest', () => {
        expect(resolveRead('heart', 'heart')).toBe('neutral');
        expect(resolveRead('wild', 'mind')).toBe('none');
        expect(resolveRead('x', 'mind')).toBe('none');
    });
    it('legacy resolveCardDieCost still classifies advantage/neutral/disadvantage', () => {
        expect(resolveCardDieCost('heart', 'body').advantage).toBe('advantage');
        expect(resolveCardDieCost('body', 'heart').advantage).toBe('disadvantage');
        expect(resolveCardDieCost('heart', 'heart').advantage).toBe('neutral');
    });
});

// ── Intent derivation (Spec 26 §2) ───────────────────────────────────────────

describe('Spec 26 §2 — intent derivation', () => {
    it('classifies damage / debuff / buff / combo / pass', () => {
        expect(deriveIntentType([{ damage: 5 }])).toBe('damage');
        expect(deriveIntentType([{ effectId: 'debuff_fear' }])).toBe('debuff');
        expect(deriveIntentType([{ enemyHeal: 6 }])).toBe('buff');
        expect(deriveIntentType([{ damage: 5, effectId: 'debuff_fear' }])).toBe('combo');
        expect(deriveIntentType([{}])).toBe('pass');
    });
    it('stamps an intentType on every resolved threat phase', () => {
        const seq = getThreatSequence(makeEnemy(60));
        for (const p of seq) expect(p.intentType).toBeDefined();
    });
    it('authored phases carry a thematic stance tell', () => {
        const tyrant = deepClone(TidepoolCrab); tyrant.id = 'enemy-coastal-tyrant';
        const seq = getThreatSequence(tyrant);
        expect(seq[0].stanceHint && seq[0].stanceHint.length).toBeGreaterThan(0);
    });
});

// ── Card classification (§6) — pure ──────────────────────────────────────────

describe('Spec 25 §6 — card classification', () => {
    it('a DoT skill is a direct-dot card on the dot track', () => {
        const card = getCard(DOT_BODY)!;
        expect(card.verbClass).toBe('direct-dot');
        expect(card.effectKind).toBe('dot');
        expect(card.stance).toBe('body');
        expect(card.bottomDamagePreview).toBeGreaterThan(0);
    });
    it('a control skill is a direct-control card on the control track', () => {
        const card = getCard(CONTROL_HEART)!;
        expect(card.effectKind).toBe('control');
        expect(['direct-control', 'stat-debuff']).toContain(card.verbClass);
    });
    it('a pure-damage skill is direct-damage with 0 pressure preview', () => {
        const card = getCard(DAMAGE_BODY)!;
        expect(card.verbClass).toBe('direct-damage');
        expect(card.effectKind).toBe('none');
        expect(card.bottomDamagePreview).toBe(0);
    });
});

// ── Initialization + the 2-die draft (§1) ────────────────────────────────────

describe('Spec 26b §1 — initialization + draft', () => {
    it('opens in reveal, draws 5, then rolls a 2-die turn pool', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY, CONTROL_HEART, DAMAGE_BODY]), makeEnemy(30), undefined, 42);
        expect(state.phase).toBe('reveal');
        expect(state.hand.length).toBe(COMBAT_HAND_SIZE);
        state = rollEncounterDice(state).state;
        expect(state.phase).toBe('phase-play');
        expect(state.dice.length).toBe(2);
        expect(state.draftedDieId).toBeNull();
    });

    it('drafting consumes the unpicked die for +1 Conviction and reveals the stance', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(40, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']); // body beats mind → advantage read
        expect(isPhaseStanceRevealed(state, 0)).toBe(false);
        const before = state.conviction;
        state = draftStanceDie(state, state.dice[0].id).state;
        expect(getDraftedDie(state)?.color).toBe('body');
        // +1 from the unpicked die, +1 read-win bonus (advantage) = +2.
        expect(state.conviction).toBe(before + 2);
        expect(state.lastRead).toBe('advantage');
        expect(isPhaseStanceRevealed(state, 0)).toBe(true);
    });

    it('a neutral/disadvantage draft grants only the unpicked-die Conviction', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(40, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['heart', 'wild']); // heart loses to mind → disadvantage
        const before = state.conviction;
        state = draftStanceDie(state, state.dice[0].id).state;
        expect(state.conviction).toBe(before + 1);
        expect(state.lastRead).toBe('disadvantage');
    });

    it('getThreatSequence gives every enemy a telegraphed attack each phase (HP model)', () => {
        const enemy = makeEnemy(50);
        const seq = getThreatSequence(enemy);
        expect(seq.length).toBeGreaterThan(0);
        for (const p of seq) {
            // Each phase is a real enemy turn: a threat action with effects.
            expect(p.threatAction.effects.length).toBeGreaterThan(0);
            expect(p.threatAction.effects.some(e => (e.damage ?? 0) > 0)).toBe(true);
        }
    });
});

// ── Direct damage is the weak baseline (HP model) ────────────────────────────

describe('HP model — a direct-damage card chips HP and spends the die', () => {
    it('a pure-damage bottom damages enemy HP (no status) and spends the die (no chain)', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DAMAGE_BODY]), makeEnemy(80, 'mind'), [DAMAGE_BODY], 7);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        const hpBefore = state.enemy.health;
        const r = draftAndPlay(state, DAMAGE_BODY);
        expect(r.played).toBe(true);
        expect(r.state.enemy.health).toBeLessThan(hpBefore);
        expect(r.state.directDamageDealt).toBeGreaterThan(0);
        // No status landed → the drafted die is spent (no chain).
        expect(getDraftedDie(r.state)?.state).toBe('spent');
    });
});

// ── Status combo loop (§1) ───────────────────────────────────────────────────

describe('Spec 26b §1 — status-combo loop', () => {
    it('a landed DoT lands on the enemy and refreshes the drafted die for a chain', () => {
        mockSequentialRng(0.05); // low rolls → enemy fails to resist → effect lands
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 3);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']); // body vs mind → advantage
        const r = draftAndPlay(state, DOT_BODY);
        expect(r.played).toBe(true);
        // The DoT effect landed on the enemy (it will tick HP each phase).
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
        const landed = r.events!.some(e => e.kind === 'effect-landed' && e.target === 'enemy');
        expect(landed).toBe(true);
        // The drafted die refreshed (still available) so the player can chain.
        const refreshed = r.events!.some(e => e.kind === 'die-refreshed');
        expect(refreshed).toBe(true);
        expect(getDraftedDie(r.state)?.state).toBe('available');
    });

    it('a color-matched advantaged strike deals more HP damage than a disadvantaged off-color one', () => {
        mockSequentialRng(0.05);
        const base = () => {
            const s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(120, 'mind'), [DOT_BODY], 21);
            return rollEncounterDice(s).state;
        };
        const adv = draftAndPlay(setDice(base(), ['body', 'heart']), DOT_BODY); // match + advantage
        const dis = draftAndPlay(setDice(base(), ['mind', 'wild']), DOT_BODY); // off-color + disadvantage
        // The read + color-match scale the immediate STRIKE damage.
        expect(adv.state.directDamageDealt).toBeGreaterThan(dis.state.directDamageDealt);
    });
});

// ── Between-phases: DoT ticks + duration tick + fresh hand (§4.5) ─────────────

describe('Spec 25 §4.5 — between-phases processing', () => {
    it('fires enemy DoT ticks (erodes HP), ticks effect durations, draws a fresh hand', () => {
        mockSequentialRng(0.05);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80, 'mind'), [DOT_BODY], 5);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        state = draftAndPlay(state, DOT_BODY).state;
        const dotBefore = state.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        expect(dotBefore).toBeDefined();
        const hpBefore = state.enemy.health;
        const durBefore = dotBefore!.remainingDuration;

        const bp = processBetweenPhases(state);
        const after = bp.state;
        expect(after.enemy.health).toBeLessThan(hpBefore);
        expect(bp.events.some(e => e.kind === 'dot-tick' && e.target === 'enemy')).toBe(true);
        const dotAfter = after.enemy.effects.find(e => e.effectId === 'debuff_bleed');
        if (dotAfter) expect(dotAfter.remainingDuration).toBeLessThan(durBefore);
        expect(after.hand.length).toBe(COMBAT_HAND_SIZE);
        // A new phase resets the draft so the next turn rolls fresh.
        expect(after.draftedDieId).toBeNull();
        expect(after.dice.length).toBe(0);
    });
});

// ── Signature Skills (§4) ────────────────────────────────────────────────────

describe('Spec 26b §4 — Signature Skills (Conviction-funded)', () => {
    it('Read the Opponent reveals the current + next phase stance', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 5 };
        const r = playSignatureSkill(state, 'sig-read-opponent');
        expect(r.state.conviction).toBe(4); // cost 1
        expect(isPhaseStanceRevealed(r.state, 0)).toBe(true);
        if (r.state.threatPhases.length > 1) expect(isPhaseStanceRevealed(r.state, 1)).toBe(true);
        expect(r.events.some(e => e.kind === 'signature-cast')).toBe(true);
    });

    it('Conviction Strike applies a guaranteed DoT to the enemy', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'mind'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 9 };
        const r = playSignatureSkill(state, 'sig-conviction-strike');
        expect(r.state.conviction).toBe(2); // cost 7
        // The poison DoT lands on the enemy (it will tick HP each phase).
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });

    it('scrapping a hand card grants +1 Conviction and discards it', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY, CONTROL_HEART]), makeEnemy(60), [DOT_BODY, CONTROL_HEART], 6);
        state = rollEncounterDice(state).state;
        const uid = state.hand[0].uid;
        const before = state.conviction;
        const r = discardCombatCard(state, uid);
        expect(r.state.conviction).toBe(before + 1);
        expect(r.state.hand.find(h => h.uid === uid)).toBeUndefined();
    });

    it('Overwhelming Argument (heart capstone) applies Petrify to the enemy', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(90, 'heart'), [DOT_BODY], 4);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 10 };
        const r = playSignatureSkill(state, 'sig-overwhelming-argument');
        expect(r.state.conviction).toBe(2); // cost 8
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_petrify')).toBe(true);
        expect(r.events.some(e => e.kind === 'signature-cast')).toBe(true);
    });

    it('a signature skill fizzles (no-op) when underfunded', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60), [DOT_BODY], 8);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 1 };
        const r = playSignatureSkill(state, 'sig-overwhelming-argument'); // cost 8
        expect(r.state.conviction).toBe(1);
        expect(r.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
    });

    it('Press Fate re-rolls ONLY spent dice and keeps a still-usable die', () => {
        mockSequentialRng(0.5); // re-rolled face → floor(0.5*6)=3 → wild
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        // A usable heart die (KEEP) + a spent body die (RE-ROLL).
        state = { ...state, conviction: 6, dice: [
            { id: 't1-d0', color: 'heart', state: 'available', temporary: false },
            { id: 't1-d1', color: 'body', state: 'spent', temporary: false },
        ] };
        const r = playSignatureSkill(state, 'sig-press-the-point'); // cost 4
        expect(r.state.conviction).toBe(2); // ◆ spent — work happened
        // The usable die is untouched (same color + still available).
        expect(r.state.dice.find(d => d.id === 't1-d0')).toEqual(
            { id: 't1-d0', color: 'heart', state: 'available', temporary: false });
        // The spent die was re-rolled back into play (no longer spent).
        const rerolled = r.state.dice.find(d => d.id === 't1-d1')!;
        expect(rerolled.state).not.toBe('spent');
    });

    it('Press Fate re-rolls a dead X die', () => {
        mockSequentialRng(0.1); // re-rolled face → floor(0.1*6)=0 → heart
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 6, dice: [
            { id: 't1-d0', color: 'heart', state: 'available', temporary: false },
            { id: 't1-d1', color: 'x', state: 'locked', temporary: false },
        ] };
        const r = playSignatureSkill(state, 'sig-press-the-point');
        const x = r.state.dice.find(d => d.id === 't1-d1')!;
        expect(x.color).not.toBe('x');     // the blocked face is gone
        expect(x.state).toBe('available'); // and it's now usable
    });

    it('Press Fate is a no-op (keeps ◆) when every die is still usable', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 2);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 6, dice: [
            { id: 't1-d0', color: 'heart', state: 'available', temporary: false },
            { id: 't1-d1', color: 'body', state: 'available', temporary: false },
        ] };
        const r = playSignatureSkill(state, 'sig-press-the-point');
        expect(r.state.conviction).toBe(6); // nothing to re-roll → ◆ not burned
        expect(r.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        expect(r.state.dice).toEqual(state.dice); // pool unchanged
    });
});

// ── Tuning pass 2: anti-spam, control, read-loop (Spec 26b §2/§3) ────────────

describe('Spec 26b tuning — variety-gated combo + projection + carry', () => {
    it('the combo loop refreshes the die for a NEW status but spends it on a repeat (variety-gated)', () => {
        mockSequentialRng(0.05); // low rolls → effects land
        // Repetition: two copies of one DoT. First land refreshes the die; the
        // second (same effect, already in this chain) SPENDS it — spam can't chain.
        let spam = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(160, 'mind'), [DOT_BODY, DOT_BODY], 7);
        spam = rollEncounterDice(spam).state;
        spam = setDice(spam, ['body', 'heart']);
        const first = draftAndPlay(spam, DOT_BODY);
        expect(first.events!.some(e => e.kind === 'die-refreshed')).toBe(true);
        const repeatEntry = first.state.hand.find(h => h.cardId === DOT_BODY)!;
        const repeat = playCombatCard(first.state, { uid: repeatEntry.uid }, true);
        expect(repeat.events.some(e => e.kind === 'die-spent')).toBe(true);
        expect(repeat.events.some(e => e.kind === 'die-refreshed')).toBe(false);

        // Variety: a DoT then a DISTINCT control status — the new status refreshes
        // the die for a genuine combo chain (the Mage-Knight "big turn").
        let varied = initializeCombatEncounter(makePlayer([DOT_BODY, CONTROL_HEART]), makeEnemy(160, 'mind'), [DOT_BODY, CONTROL_HEART], 7);
        varied = rollEncounterDice(varied).state;
        varied = setDice(varied, ['body', 'heart']);
        const dot = draftAndPlay(varied, DOT_BODY);
        expect(dot.events!.some(e => e.kind === 'die-refreshed')).toBe(true);
        const ctrlEntry = dot.state.hand.find(h => h.cardId === CONTROL_HEART)!;
        const ctrl = playCombatCard(dot.state, { uid: ctrlEntry.uid }, true);
        expect(ctrl.events.some(e => e.kind === 'die-refreshed')).toBe(true);
    });

    it('projectCardImpact previews the strike HP damage (scaled by the read)', () => {
        mockSequentialRng(0.5);
        const card = getCard(DOT_BODY)!;
        // Advantage draft (body vs mind) previews more strike damage than a
        // disadvantage draft (mind vs body) — the read scales the strike.
        const adv = (() => {
            let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(120, 'mind'), [DOT_BODY], 1);
            s = rollEncounterDice(s).state; s = setDice(s, ['body', 'heart']);
            return projectCardImpact(draftStanceDie(s, s.dice[0].id).state, card);
        })();
        const dis = (() => {
            let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(120, 'body'), [DOT_BODY], 1);
            s = rollEncounterDice(s).state; s = setDice(s, ['mind', 'wild']);
            return projectCardImpact(draftStanceDie(s, s.dice[0].id).state, card);
        })();
        expect(adv.track).toBe('dot');
        expect(adv.amount).toBeGreaterThan(0);
        expect(adv.amount).toBeGreaterThan(dis.amount);
    });

    it('an unspent drafted die carries into the next turn', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['heart', 'body']);
        state = draftStanceDie(state, state.dice[0].id).state; // draft heart, don't spend
        expect(getDraftedDie(state)?.color).toBe('heart');
        state = endTurn(state).state;
        expect(state.carriedDie).toBe('heart');
        state = startTurn(state).state;
        // The carried heart die is present in the fresh pool.
        expect(state.dice.some(d => d.color === 'heart')).toBe(true);
        expect(state.carriedDie).toBeNull();
    });

    it('every turn roll offers at least one stance-bearing die', () => {
        for (let seed = 1; seed <= 30; seed++) {
            let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60), [DOT_BODY], seed);
            s = rollEncounterDice(s).state;
            expect(s.dice.some(d => d.color === 'heart' || d.color === 'body' || d.color === 'mind')).toBe(true);
        }
    });
});

// ── Tuning pass 3: archetype signatures, deckbuilder, unlock hook, floors ────

describe('Spec 26b §B/§C/§D — archetype kit, rewards, unlock, difficulty floor', () => {
    it('the signature kit is the player archetype kit (dominant base stat)', () => {
        expect(playerArchetype({ baseStats: { heart: 2, body: 9, mind: 2 } })).toBe('body');
        const bodyPlayer = makePlayer([DOT_BODY]); bodyPlayer.baseStats = { heart: 2, body: 9, mind: 2 };
        const s = initializeCombatEncounter(bodyPlayer, makeEnemy(60), [DOT_BODY], 1);
        expect(s.archetype).toBe('body');
        expect(s.signatures).toEqual(SIGNATURE_KITS.body);
        expect(s.signatures).toContain('sig-rallying-blow'); // body exclusive
    });

    it('Conclusion (body finisher) deals per-stack damage and refreshes the drafted die', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = setDice(state, ['body', 'heart']);
        state = draftStanceDie(state, state.dice[0].id).state;
        // Seed the enemy with two effects: 3 stacks of bleed + 5 stacks of poison = 8 total stacks.
        const bleedDef = lookupEffect('debuff_bleed')!;
        const poisonDef = lookupEffect('debuff_poison')!;
        const { activeEffects: withBleed } = applyEffect([], bleedDef, 1, { intensityDelta: 3, sourceId: 'test' });
        const { activeEffects: withBoth } = applyEffect(withBleed, poisonDef, 1, { intensityDelta: 5, sourceId: 'test' });
        state = { ...state, conviction: 8, enemy: { ...state.enemy, effects: withBoth },
            dice: state.dice.map(d => d.id === state.draftedDieId ? { ...d, state: 'spent' as const } : d) };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-rallying-blow');
        // 8 total stacks × CONCLUDE_DMG_PER_STACK(2) = 16 damage
        expect(hpBefore - r.state.enemy.health).toBe(8 * CONCLUDE_DMG_PER_STACK);
        expect(getDraftedDie(r.state)?.state).toBe('available'); // drafted die refreshed
        expect(r.events.some(e => e.kind === 'conclude-hit')).toBe(true);
    });

    it('Conclusion deals 1 damage (floor) when enemy has no active effects', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(80, 'mind'), [DOT_BODY], 1);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 8, enemy: { ...state.enemy, effects: [] } };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-rallying-blow');
        expect(hpBefore - r.state.enemy.health).toBe(1); // floor(max(1, 0 stacks))
    });

    it('Disarming Plea (heart mercy) charms the enemy and strikes its HP', () => {
        mockSequentialRng(0.5);
        let state = initializeCombatEncounter(makePlayer([CONTROL_HEART]), makeEnemy(120, 'body'), [CONTROL_HEART], 1);
        state = rollEncounterDice(state).state;
        state = { ...state, conviction: 8 };
        const hpBefore = state.enemy.health;
        const r = playSignatureSkill(state, 'sig-disarming-plea');
        // Charm (control) lands on the enemy and it takes HP damage.
        expect(r.state.enemy.effects.some(e => e.effectId === 'debuff_charm')).toBe(true);
        expect(r.state.enemy.health).toBeLessThan(hpBefore);
    });

    it('rollCombatCardRewards offers valid distinct skill-sourced cards, biased to archetype', () => {
        const player = makePlayer([DOT_BODY]); player.baseStats = { heart: 2, body: 9, mind: 2 };
        let i = 0; const rng = () => [0.1, 0.5, 0.9, 0.3, 0.7][i++ % 5];
        const offers = rollCombatCardRewards(player, rng, 3);
        expect(offers.length).toBe(3);
        expect(new Set(offers).size).toBe(3); // distinct
        for (const id of offers) { expect(getCardById(id)).toBeTruthy(); expect(COMBAT_REWARD_POOL).toContain(id); }
    });

    it('a reward card stacks onto the deck as an extra copy', () => {
        const player = makePlayer([DOT_BODY]);
        const before = buildCombatDeck(player).filter(id => id === DOT_BODY).length;
        const rewarded = addRewardCard(player, DOT_BODY);
        const after = buildCombatDeck(rewarded).filter(id => id === DOT_BODY).length;
        expect(after).toBe(before + 1);
    });

    it('unlockSkillViaDilemma adds a new skill, bypassing gates; no-op if known', () => {
        const player = makePlayer([DOT_BODY]);
        const newId = COMBAT_REWARD_POOL.find(id => id !== DOT_BODY && getCardById(id))!;
        const unlocked = unlockSkillViaDilemma(player, newId);
        expect(unlocked.knownSkills).toContain(newId);
        expect(unlockSkillViaDilemma(unlocked, newId)).toBe(unlocked); // already known → same ref
    });

    it('even a tiny enemy gets a real threat sequence (its attack has bite)', () => {
        const seq = getThreatSequence(makeEnemy(20)); // very low HP
        expect(seq.length).toBeGreaterThan(0);
        for (const p of seq) {
            // The enemy's threat action deals a meaningful chunk of damage.
            expect(p.threatAction.effects.some(e => (e.damage ?? 0) >= 3)).toBe(true);
        }
    });
});

// ── Full victory by HP depletion via status play (skill-sourced cards only) (§11) ─────

describe('Spec 25 §11 — victory by HP depletion via status play, skill-sourced cards only', () => {
    it('a small enemy is destroyed by stacked DoT pressure with no attack/defend', () => {
        mockSequentialRng(0.05);
        const player = makePlayer([DOT_BODY]);
        const enemy = makeEnemy(24, 'mind');
        let state = initializeCombatEncounter(player, enemy, [DOT_BODY, DOT_BODY, DOT_BODY], 9);

        let guard = 0;
        while (state.phase !== 'complete' && state.phase !== 'mercy-choice' && guard < 40) {
            guard++;
            // Batch entry auto-manages the per-turn draft for each play.
            const res = resolveCombatPhase(state, [
                { cardId: DOT_BODY, useBottom: true },
                { cardId: DOT_BODY, useBottom: true },
            ]);
            state = res.state;
            if (state.finalOutcome) break;
        }
        expect(state.finalOutcome).toBe('victory');

        const summary = buildCombatSummary(state);
        expect(summary.outcome).toBe('victory');
        expect(summary.headline).toMatch(/Victory/);
        expect(summary.rows.length).toBeGreaterThan(0);
        expect(summary.bestCard.length).toBeGreaterThan(0);
        expect(summary.totalDotDamage).toBeGreaterThan(0);
    });
});

// ── resolveCombatPhase batch (§9) ────────────────────────────────────────────

describe('Spec 25 §9 — resolveCombatPhase batch entry point', () => {
    it('applies a batch of plays (auto-drafting) then resolves the phase', () => {
        mockSequentialRng(0.05);
        const state = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(60, 'mind'), [DOT_BODY, DOT_BODY], 13);
        const res = resolveCombatPhase(state, [{ cardId: DOT_BODY, useBottom: true }]);
        expect(res.state.phaseResults.length + (res.state.finalOutcome ? 1 : 0)).toBeGreaterThan(0);
    });
});

// ── Soft-control de-inert (0.33.0) ───────────────────────────────────────────
// The HP engine now READS the enemy's aggregated roll penalty (it always
// computed it; the engine just never consulted it). Soft control weakens the
// telegraphed hit, and a committed VARIETY denies it — making ~24 previously
// inert debuffs actually do something.
describe('0.33.0 — soft control weakens & denies the enemy threat', () => {
    const ae = (effectId: string): ActiveEffect => ({
        effectId, remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1,
    });
    // A state parked at phase-play with a known 10-damage threat on the current
    // phase and the given effects on the enemy; resolveThreatPhase then fires.
    function threatState(enemyEffects: ActiveEffect[]): CombatEncounterState {
        let s = initializeCombatEncounter(makePlayer([DOT_BODY]), makeEnemy(200, 'heart'), [DOT_BODY], 7);
        s = rollEncounterDice(s).state;
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        const threatPhases = s.threatPhases.map((p, i) =>
            i === idx ? { ...p, threatAction: { ...p.threatAction, effects: [{ damage: 10 }] } } : p);
        return { ...s, phase: 'phase-play', guard: 0, threatPhases, enemy: { ...s.enemy, effects: enemyEffects } };
    }
    const hpLoss = (effects: ActiveEffect[]): number => {
        const s = threatState(effects);
        return s.player.health - resolveThreatPhase(s).state.player.health;
    };

    it('a clean enemy lands its full telegraphed hit', () => {
        expect(hpLoss([])).toBeGreaterThan(0);
    });

    it('one soft-control (Confusion, roll -5) WEAKENS the hit but does not deny it', () => {
        const clean = hpLoss([]);
        const weakened = hpLoss([ae('debuff_confusion')]);
        expect(weakened).toBeGreaterThan(0);   // a single soft-control only reduces
        expect(weakened).toBeLessThan(clean);  // ~30% weaker telegraphed hit
    });

    it('a VARIETY of soft-controls (Confusion -5 + Fear -4 = 9 ≥ deny) denies the turn', () => {
        expect(hpLoss([ae('debuff_confusion'), ae('debuff_fear')])).toBe(0);
    });
});

// ── Monte-Carlo sim (§11 acceptance) ─────────────────────────────────────────

describe('Hazard combat — Monte-Carlo sim', () => {
    it('runs 300 seeded combats and reports a coherent outcome distribution', () => {
        const player = makePlayer([DOT_BODY, CONTROL_HEART, DAMAGE_BODY, BEFRIEND]);
        const enemy = makeEnemy(40);
        const stats = simulateHazardPatternCombat(player, enemy, 300, 1);
        expect(stats.runs).toBe(300);
        expect(stats.victories + stats.mercies + stats.defeats + stats.retreats).toBe(300);
        expect(stats.winRate).toBeGreaterThan(0);
        expect(stats.winRate).toBeLessThanOrEqual(1);
        expect(stats.statusEngagement).toBeGreaterThan(0);
    });
});
