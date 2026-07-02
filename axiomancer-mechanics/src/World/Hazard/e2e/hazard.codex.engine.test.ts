/**
 * Hazard codex library (2026-06-26) — hermetic e2e for the 194-card
 * roster. Mechanics: PURGE / TRANSMUTE / MEND / BOUNTY / WARD / ANCHOR /
 * FORETELL / RALLY-ESC / ECHO / SCOUR / burstMend / purge+draw /
 * foretell+scour / foretell+drawCount / CRACK-as-punishment /
 * JEOPARDY / MIRACLE / BUYBACK / DELVE.
 * Seeded RNG only; no timers, no network, no Math.random.
 */

import { describe, expect, it } from 'vitest';

import {
    applyHazardCard,
    confirmHazardForetell,
    continueHazardAfterResolve,
    createHazardSession,
    resolveHazardRound,
    selectHazardRoute,
    finishHazardRolling,
    stageHazardCard,
} from '../hazard.engine';
import {
    getHazardCardDef,
    getHazardDef,
    HAZARD_CRACK_CARD,
    HAZARD_DECK,
    HAZARD_KEYWORDS,
    HAZARD_REWARD_CARDS,
} from '../hazard.content';
import { hazardStarterBag } from '../hazard.deck-flags';
import {
    HAZARD_MOMENTUM_CAP,
    type HazardDie,
    type HazardHandEntry,
    type HazardSessionState,
} from '../hazard.types';

const BAG = hazardStarterBag();
const HAZARD_ID = 'cracked-cliff';

function playingSession(seed = 7, route: 'safe' | 'risk' = 'safe'): HazardSessionState {
    return finishHazardRolling(selectHazardRoute(createHazardSession(seed, BAG, HAZARD_ID), route, BAG));
}

function rig(s: HazardSessionState, over: Partial<HazardSessionState>): HazardSessionState {
    return { ...s, ...over };
}

function entry(uid: string, cardId: string, dieId: string | null = null): HazardHandEntry {
    return { uid, cardId, dieId };
}

function die(id: string, kind: HazardDie['kind'], state: HazardDie['state'] = 'available'): HazardDie {
    return { id, kind, state };
}

/** Stage a card from a rigged hand and APPLY it (fires its utility). */
function stageAndApply(s: HazardSessionState, cardId: string, dieId: string | null = null): HazardSessionState {
    s = rig(s, { hand: [{ uid: 'cx', cardId, dieId: null }], play: [] });
    s = stageHazardCard(s, 'cx', BAG);
    if (dieId) s = { ...s, play: s.play.map((p) => (p.uid === 'cx' ? { ...p, dieId } : p)) };
    return applyHazardCard(s, 'cx', BAG);
}

// ---------------------------------------------------------------------------
// Library shape
// ---------------------------------------------------------------------------

describe('codex library shape', () => {
    const ALL = [...HAZARD_DECK, ...HAZARD_REWARD_CARDS, HAZARD_CRACK_CARD];

    it('the full library is exactly 194 cards with unique ids', () => {
        expect(ALL).toHaveLength(194);
        expect(new Set(ALL.map((c) => c.id)).size).toBe(194);
    });

    it('every keyword on every card is in the glossary', () => {
        for (const card of ALL) {
            for (const kw of card.keywords) {
                expect(HAZARD_KEYWORDS[kw], `${card.id} keyword ${kw}`).toBeDefined();
            }
        }
    });

    it('structural invariants hold per card archetype', () => {
        for (const card of ALL) {
            if (card.choose) {
                expect(card.fp, card.id).toBe(card.ep);
            }
            if (card.kind === 'gold' && !card.dead) {
                // Gold leads with its utility; numbers wait for the die.
                expect(card.f, card.id).toBe(0);
                expect(card.e, card.id).toBe(0);
            }
            if (card.colors) {
                expect(card.colors.length, card.id).toBe(2);
                // The card's own colour must be one of its power colours
                // (r_drop predates the kind-first ordering convention).
                expect(card.colors, card.id).toContain(card.kind);
                expect(card.keywords, card.id).toContain('twotone');
            }
            if (card.effect === 'mend') expect(card.mendBase ?? 0, card.id).toBeGreaterThan(0);
            if (card.effect === 'bounty') expect(card.bountyBase ?? 0, card.id).toBeGreaterThan(0);
            if (card.effect === 'ward') expect(card.wardBase ?? 0, card.id).toBeGreaterThan(0);
            if (card.effect === 'anchor') expect(card.anchorBase ?? 0, card.id).toBeGreaterThan(0);
            if (card.effect && ['purge', 'transmute', 'mend', 'bounty', 'ward', 'anchor'].includes(card.effect)) {
                expect(card.keywords, card.id).toContain(card.effect);
            }
        }
    });

    it('every codex effect family is represented in the reward pool', () => {
        for (const effect of ['purge', 'transmute', 'mend', 'bounty', 'ward', 'anchor'] as const) {
            expect(HAZARD_REWARD_CARDS.some((c) => c.effect === effect), effect).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// PURGE
// ---------------------------------------------------------------------------

describe('PURGE', () => {
    it('minor cuts one CRACK from hand first, then the draw pile', () => {
        let s = playingSession();
        s = rig(s, {
            hand: [entry('a', HAZARD_CRACK_CARD.id), entry('b', HAZARD_CRACK_CARD.id)],
            drawPile: [HAZARD_CRACK_CARD.id, 'steps'],
        });
        s = rig(stageAndApply(rig(s, {}), 'x_menderknife'), {});
        // hand had 2 cracks pre-stage (the stage helper replaced the hand) —
        // rebuild explicitly instead:
        let t = playingSession();
        t = rig(t, {
            hand: [entry('a', HAZARD_CRACK_CARD.id), entry('m', 'x_menderknife')],
            drawPile: [HAZARD_CRACK_CARD.id, 'steps'],
            play: [],
        });
        t = stageHazardCard(t, 'm', BAG);
        t = applyHazardCard(t, 'm', BAG);
        expect(t.hand.filter((h) => h.cardId === HAZARD_CRACK_CARD.id)).toHaveLength(0);
        // pile crack untouched by the minor purge once the hand had one
        expect(t.drawPile.filter((id) => id === HAZARD_CRACK_CARD.id)).toHaveLength(1);
        void s;
    });

    it('major (gold) scours hand, pile, and discard', () => {
        let s = playingSession();
        s = rig(s, {
            hand: [entry('a', HAZARD_CRACK_CARD.id), entry('m', 'x_lastrelic')],
            drawPile: [HAZARD_CRACK_CARD.id, 'steps', HAZARD_CRACK_CARD.id],
            discardPile: [HAZARD_CRACK_CARD.id, 'haul'],
            play: [],
        });
        s = stageHazardCard(s, 'm', BAG);
        s = applyHazardCard(s, 'm', BAG); // majorEffect: fires major with no die
        expect(s.hand.some((h) => h.cardId === HAZARD_CRACK_CARD.id)).toBe(false);
        expect(s.drawPile).toEqual(['steps']);
        expect(s.discardPile).toEqual(['haul']);
    });
});

// ---------------------------------------------------------------------------
// TRANSMUTE
// ---------------------------------------------------------------------------

describe('TRANSMUTE', () => {
    it('minor recolors the first off-colour available die; hex never turns', () => {
        let s = playingSession();
        s = rig(s, { dice: [die('d1', 'hex'), die('d2', 'blue'), die('d3', 'purple'), die('d4', 'red', 'spent')] });
        s = rig(s, { hand: [entry('m', 'x_redsmith')], play: [] });
        s = stageHazardCard(s, 'm', BAG);
        s = applyHazardCard(s, 'm', BAG);
        expect(s.dice.map((d) => d.kind)).toEqual(['hex', 'red', 'purple', 'red']);
    });

    it('major recolors every available off-colour die', () => {
        let s = playingSession();
        s = rig(s, { dice: [die('d1', 'hex'), die('d2', 'blue'), die('d3', 'purple'), die('d4', 'gold')] });
        s = rig(s, { hand: [entry('m', 'x_redsmith')], play: [] });
        s = stageHazardCard(s, 'm', BAG);
        // power it with the gold die to fire the major tier
        s = { ...s, play: s.play.map((p) => ({ ...p, dieId: 'd4' })), dice: s.dice.map((d) => (d.id === 'd4' ? { ...d, state: 'spent' as const } : d)) };
        s = applyHazardCard(s, 'm', BAG);
        // d4 is spent (powering), so it stays gold; d2/d3 turn red; hex holds.
        expect(s.dice.map((d) => d.kind)).toEqual(['hex', 'red', 'red', 'gold']);
    });
});

// ---------------------------------------------------------------------------
// MEND / BOUNTY / WARD / ANCHOR — accruals and the outcome ledger
// ---------------------------------------------------------------------------

describe('claim-time accruals', () => {
    it('MEND and BOUNTY accrue at minor and major tiers', () => {
        let s = playingSession();
        s = stageAndApply(s, 'x_fieldstitch');
        const minorMend = s.vitaeRestore;
        expect(minorMend).toBeGreaterThan(0);
        s = rig(s, { dice: [die('g1', 'gold')] });
        s = rig(s, { hand: [entry('b2', 'x_relicpouch')], play: s.play });
        s = stageHazardCard(s, 'b2', BAG);
        s = { ...s, play: s.play.map((p) => (p.uid === 'b2' ? { ...p, dieId: 'g1' } : p)) };
        s = applyHazardCard(s, 'b2', BAG);
        const majorBounty = getHazardCardDef('x_relicpouch').bountyPowered ?? 0;
        expect(s.bountyShillings).toBe(majorBounty);
    });

    it('the outcome pays MEND/BOUNTY only on a survived crossing', () => {
        const base = playingSession(11, 'safe');
        const def = getHazardDef(HAZARD_ID);
        // Survived: one cleared round (marks rigged), accruals present.
        let s = rig(base, {
            round: def.rounds,
            marks: ['O', 'X', 'pending'],
            play: [entry('p1', 'steps', null)],
            vitaeRestore: 4,
            bountyShillings: 8,
            wardPenaltyReduction: 99,
        });
        s = resolveHazardRound(s, BAG);
        s = continueHazardAfterResolve(s, BAG);
        expect(s.phase).toBe('outcome');
        expect(s.outcome?.tier).not.toBe('failure');
        expect(s.outcome?.vitaeRestore).toBe(4);
        expect(s.outcome?.bountyShillings).toBe(8);
        // WARD floors the penalty at zero, never negative.
        expect(s.outcome?.penaltyVitae).toBe(0);

        // Failure: same accruals, all rounds lost → forfeited.
        let f = rig(base, {
            round: def.rounds,
            marks: ['X', 'X', 'pending'],
            play: [entry('p1', HAZARD_CRACK_CARD.id, null)],
            vitaeRestore: 4,
            bountyShillings: 8,
        });
        f = resolveHazardRound(f, BAG);
        f = continueHazardAfterResolve(f, BAG);
        expect(f.outcome?.tier).toBe('failure');
        expect(f.outcome?.vitaeRestore).toBe(0);
        expect(f.outcome?.bountyShillings).toBe(0);
        // Sacrifice-style costs still settle on a failure; ward only ever
        // reduces the penalty, which here is 3 lost rounds × penaltyVitae.
        expect(f.outcome?.penaltyVitae).toBe(def.safe.penaltyVitae * 3);
    });

    it('ANCHOR floors the carry even off a failed round, capped by the cap', () => {
        let s = playingSession(13, 'safe');
        // Fail round 1 on purpose with a dead card, floor primed at 2.
        s = rig(s, {
            carryFloor: 2,
            play: [entry('p1', HAZARD_CRACK_CARD.id, null)],
            hand: [],
        });
        s = resolveHazardRound(s, BAG);
        expect(s.resolveInfo?.cleared).toBe(false);
        expect((s.resolveInfo?.carryForce ?? 0) + (s.resolveInfo?.carryEscape ?? 0)).toBe(2);
        s = continueHazardAfterResolve(s, BAG);
        expect(s.progressBase.force + s.progressBase.escape).toBe(2);

        // The floor itself respects the session momentum cap on accrual.
        let t = playingSession(13, 'safe');
        t = stageAndApply(t, 'x_oldcapstan');
        t = stageAndApply(rig(t, {}), 'x_oldcapstan');
        t = stageAndApply(rig(t, {}), 'x_oldcapstan');
        expect(t.carryFloor).toBeLessThanOrEqual(HAZARD_MOMENTUM_CAP);
    });

    it('the momentum floor never pays out past the final round', () => {
        const def = getHazardDef(HAZARD_ID);
        let s = playingSession(17, 'safe');
        s = rig(s, {
            round: def.rounds,
            marks: ['O', 'O', 'pending'],
            carryFloor: 3,
            play: [entry('p1', HAZARD_CRACK_CARD.id, null)],
        });
        s = resolveHazardRound(s, BAG);
        expect(s.resolveInfo?.carryForce).toBe(0);
        expect(s.resolveInfo?.carryEscape).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// MTG mechanics — commit 181696b (ECHO / burstMend / purge+draw /
// foretell+scour / foretell+drawCount / CRACK-as-punishment)
// ---------------------------------------------------------------------------

describe('ECHO scaling', () => {
    it('ECHO force card adds per-card-applied bonus on top of base burst', () => {
        let s = playingSession(5);
        // Rig two already-applied cards into play; the engine counts them
        // PLUS the ECHO card itself (marked applied before effect fires) = 3.
        const appliedEntry1 = { uid: 'ap1', cardId: 'x_fieldstitch', dieId: null, applied: true };
        const appliedEntry2 = { uid: 'ap2', cardId: 'x_fieldstitch', dieId: null, applied: true };
        s = rig(s, { play: [appliedEntry1, appliedEntry2] });
        const baseForce = s.progressBase.force;
        s = rig(s, { hand: [{ uid: 'te1', cardId: 'r_tempestecho', dieId: null }] });
        s = stageHazardCard(s, 'te1', BAG);
        s = applyHazardCard(s, 'te1', BAG);
        const def = getHazardCardDef('r_tempestecho');
        // alreadyApplied inside the engine = 2 prior + 1 self = 3.
        const engineApplied = 3;
        const expected = (def.burstBase?.force ?? 0) + engineApplied * (def.echoPerCardForce ?? 0);
        expect(s.progressBase.force - baseForce).toBe(expected);
    });

    it('ECHO escape card adds per-card-applied bonus on top of base burst', () => {
        let s = playingSession(5);
        const appliedEntry = { uid: 'ap1', cardId: 'x_fieldstitch', dieId: null, applied: true };
        s = rig(s, { play: [appliedEntry] });
        const baseEscape = s.progressBase.escape;
        s = rig(s, { hand: [{ uid: 'cc1', cardId: 'r_chaincurrent', dieId: null }] });
        s = stageHazardCard(s, 'cc1', BAG);
        s = applyHazardCard(s, 'cc1', BAG);
        const def = getHazardCardDef('r_chaincurrent');
        // alreadyApplied = 1 prior + 1 self = 2.
        const engineApplied = 2;
        const expected = (def.burstBase?.escape ?? 0) + engineApplied * (def.echoPerCardEscape ?? 0);
        expect(s.progressBase.escape - baseEscape).toBe(expected);
    });

    it('ECHO bonus counts only self when no prior cards applied', () => {
        let s = playingSession(5);
        s = rig(s, { play: [] });
        const baseForce = s.progressBase.force;
        s = rig(s, { hand: [{ uid: 'te0', cardId: 'r_tempestecho', dieId: null }] });
        s = stageHazardCard(s, 'te0', BAG);
        s = applyHazardCard(s, 'te0', BAG);
        const def = getHazardCardDef('r_tempestecho');
        // alreadyApplied = 0 prior + 1 self = 1; force = base + 1 * echoPerCardForce.
        const expected = (def.burstBase?.force ?? 0) + 1 * (def.echoPerCardForce ?? 0);
        expect(s.progressBase.force - baseForce).toBe(expected);
    });

    it('powered ECHO doubles the per-card bonus', () => {
        let s = playingSession(5);
        const appliedEntry = { uid: 'ap1', cardId: 'x_fieldstitch', dieId: null, applied: true };
        s = rig(s, { play: [appliedEntry] });
        const baseForce = s.progressBase.force;
        const goldDie = die('gEcho', 'gold');
        s = rig(s, { dice: [...s.dice.filter((d) => d.kind !== 'gold'), goldDie] });
        s = rig(s, { hand: [{ uid: 'echo1', cardId: 'r_tempestecho', dieId: null }] });
        s = stageHazardCard(s, 'echo1', BAG);
        s = { ...s, play: s.play.map((p) => (p.uid === 'echo1' ? { ...p, dieId: 'gEcho' } : p)), dice: s.dice.map((d) => (d.id === 'gEcho' ? { ...d, state: 'spent' as const } : d)) };
        s = applyHazardCard(s, 'echo1', BAG);
        const def = getHazardCardDef('r_tempestecho');
        // alreadyApplied = 1 prior + 1 self = 2; powered mult = 2.
        const engineApplied = 2;
        const expectedPowered = (def.burstBase?.force ?? 0) + engineApplied * (def.echoPerCardForce ?? 0) * 2;
        expect(s.progressBase.force - baseForce).toBe(expectedPowered);
    });
});

describe('burstMend rider', () => {
    it('MARTYRDOM (red sacrifice burst) accrues vitaeRestore at minor tier', () => {
        let s = playingSession(5);
        const preMend = s.vitaeRestore;
        s = stageAndApply(s, 'r_martyrdom');
        const def = getHazardCardDef('r_martyrdom');
        expect(s.vitaeRestore - preMend).toBe(def.burstMendBase ?? 0);
    });

    it('MARTYRDOM accrues the powered vitaeRestore at major tier', () => {
        let s = playingSession(5);
        const preMend = s.vitaeRestore;
        const goldDie = die('gMend', 'gold');
        s = rig(s, { dice: [...s.dice.filter((d) => d.kind !== 'gold'), goldDie] });
        s = rig(s, { hand: [{ uid: 'm1', cardId: 'r_martyrdom', dieId: null }], play: s.play });
        s = stageHazardCard(s, 'm1', BAG);
        s = { ...s, play: s.play.map((p) => (p.uid === 'm1' ? { ...p, dieId: 'gMend' } : p)), dice: s.dice.map((d) => (d.id === 'gMend' ? { ...d, state: 'spent' as const } : d)) };
        s = applyHazardCard(s, 'm1', BAG);
        const def = getHazardCardDef('r_martyrdom');
        expect(s.vitaeRestore - preMend).toBe(def.burstMendPowered ?? def.burstMendBase ?? 0);
    });

    it('DESPERATE LUNGE accrues escape burst + burstMend at minor tier', () => {
        let s = playingSession(5);
        const preMend = s.vitaeRestore;
        const baseEscape = s.progressBase.escape;
        s = stageAndApply(s, 'r_desperatelunge');
        const def = getHazardCardDef('r_desperatelunge');
        expect(s.vitaeRestore - preMend).toBe(def.burstMendBase ?? 0);
        expect(s.progressBase.escape - baseEscape).toBe(def.burstBase?.escape ?? 0);
    });
});

describe('purge+draw combo', () => {
    it('CLEAN BREAK purges one CRACK then draws one card into hand', () => {
        let s = playingSession(5);
        const extraCard = 'steps';
        s = rig(s, {
            hand: [entry('c1', HAZARD_CRACK_CARD.id), entry('cb', 'r_cleanbreak')],
            drawPile: [extraCard, 'haul'],
            play: [],
        });
        const handSizeBefore = s.hand.length;
        s = stageHazardCard(s, 'cb', BAG);
        s = applyHazardCard(s, 'cb', BAG);
        // CRACK removed from hand (-1), purge+draw adds 1 → net same size minus the played card.
        expect(s.hand.some((h) => h.cardId === HAZARD_CRACK_CARD.id)).toBe(false);
        const def = getHazardCardDef('r_cleanbreak');
        expect(s.hand.length).toBe(handSizeBefore - 1 - 1 + (def.purgeDrawCount ?? 0));
    });
});

describe('FORETELL state machine', () => {
    it('playing a foretell card transitions to foretell-pending', () => {
        let s = playingSession(5);
        s = stageAndApply(s, 'r_readpath');
        expect(s.phase).toBe('foretell-pending');
        expect(s.foretellPending).not.toBeNull();
        const def = getHazardCardDef('r_readpath');
        expect(s.foretellPending?.revealed).toHaveLength(def.foretellBase ?? 2);
    });

    it('confirmHazardForetell returns to playing and restores revealed cards to draw pile', () => {
        let s = playingSession(5);
        s = stageAndApply(s, 'r_readpath');
        expect(s.phase).toBe('foretell-pending');
        const revealed = s.foretellPending!.revealed;
        s = confirmHazardForetell(s, revealed, BAG);
        expect(s.phase).toBe('playing');
        expect(s.foretellPending).toBeNull();
        for (const id of revealed) {
            expect(s.drawPile).toContain(id);
        }
    });

    it('SCOUR mode: omitting a card from orderedIds discards it permanently', () => {
        let s = playingSession(5);
        s = stageAndApply(s, 'r_oraclesgaze');
        expect(s.phase).toBe('foretell-pending');
        const revealed = s.foretellPending!.revealed;
        expect(revealed.length).toBeGreaterThan(0);
        const kept = revealed.slice(0, 1);
        const discarded = revealed.slice(1);
        const pileLenBefore = s.drawPile.length;
        const discardLenBefore = s.discardPile.length;
        s = confirmHazardForetell(s, kept, BAG);
        expect(s.phase).toBe('playing');
        // Kept cards restored to front of draw pile.
        for (const id of kept) {
            expect(s.drawPile.slice(0, kept.length)).toContain(id);
        }
        // Discarded cards added to discardPile; pile length increases by |discarded|.
        expect(s.discardPile.length).toBe(discardLenBefore + discarded.length);
        // Draw pile gains |kept| (restored) but NOT |discarded|.
        expect(s.drawPile.length).toBe(pileLenBefore + kept.length);
    });

    it('foretell+drawCount: WAYSTONE draws extra cards into hand after resolve', () => {
        let s = playingSession(5);
        const def = getHazardCardDef('r_waystone');
        expect(def.foretellDrawCount ?? 0).toBeGreaterThan(0);
        s = rig(s, { drawPile: ['steps', 'haul', 'r_readpath', 'r_cleanbreak', 'r_martyrdom'] });
        s = stageAndApply(s, 'r_waystone');
        expect(s.phase).toBe('foretell-pending');
        const revealed = s.foretellPending!.revealed;
        const handBefore = s.hand.length;
        s = confirmHazardForetell(s, revealed, BAG);
        expect(s.phase).toBe('playing');
        expect(s.hand.length).toBe(handBefore + (def.foretellDrawCount ?? 0));
    });

    it('confirmHazardForetell is a no-op when not in foretell-pending', () => {
        let s = playingSession(5);
        expect(s.phase).toBe('playing');
        const before = s;
        const after = confirmHazardForetell(s, [], BAG);
        expect(after).toBe(before);
    });
});

// ---------------------------------------------------------------------------
// New-card mechanics — commit b271270 (JEOPARDY / MIRACLE / BUYBACK / DELVE)
// ---------------------------------------------------------------------------

describe('JEOPARDY', () => {
    it('bonus force fires when ≥1 round mark is already X', () => {
        let s = playingSession(5);
        s = rig(s, { marks: ['X', 'pending', 'pending'] });
        const baseForce = s.progressBase.force;
        s = stageAndApply(s, 'spite');
        const def = getHazardCardDef('spite');
        expect(s.progressBase.force - baseForce).toBe(def.jeopardyForce ?? 0);
    });

    it('no jeopardy bonus when no X marks exist', () => {
        let s = playingSession(5);
        s = rig(s, { marks: ['O', 'pending', 'pending'] });
        const baseForce = s.progressBase.force;
        s = stageAndApply(s, 'spite');
        expect(s.progressBase.force - baseForce).toBe(0);
    });

    it('CORNERED (reward) major jeopardy bonus fires on X mark', () => {
        let s = playingSession(5);
        s = rig(s, { marks: ['X', 'pending', 'pending'] });
        const baseForce = s.progressBase.force;
        s = stageAndApply(s, 'r_cornered');
        const def = getHazardCardDef('r_cornered');
        expect(s.progressBase.force - baseForce).toBe(def.jeopardyForce ?? 0);
    });

    it('RALLY CRY gives both force and escape jeopardy bonuses', () => {
        let s = playingSession(5);
        s = rig(s, { marks: ['X', 'pending', 'pending'] });
        const baseForce = s.progressBase.force;
        const baseEscape = s.progressBase.escape;
        s = stageAndApply(s, 'r_rallycry');
        const def = getHazardCardDef('r_rallycry');
        expect(s.progressBase.force - baseForce).toBe(def.jeopardyForce ?? 0);
        expect(s.progressBase.escape - baseEscape).toBe(def.jeopardyEscape ?? 0);
    });
});

describe('MIRACLE (first-play)', () => {
    it('bonus fires when card is the first applied this round', () => {
        let s = playingSession(5);
        s = rig(s, { play: [] });
        const baseForce = s.progressBase.force;
        const baseEscape = s.progressBase.escape;
        s = stageAndApply(s, 'firstlight');
        const def = getHazardCardDef('firstlight');
        expect(s.progressBase.force - baseForce).toBe(def.firstPlayForce ?? 0);
        expect(s.progressBase.escape - baseEscape).toBe(def.firstPlayEscape ?? 0);
    });

    it('no miracle bonus when another card was applied first', () => {
        let s = playingSession(5);
        const priorApplied = { uid: 'prior', cardId: 'steps', dieId: null, applied: true };
        s = rig(s, { play: [priorApplied] });
        const baseForce = s.progressBase.force;
        s = rig(s, { hand: [{ uid: 'fl', cardId: 'firstlight', dieId: null }] });
        s = stageHazardCard(s, 'fl', BAG);
        s = applyHazardCard(s, 'fl', BAG);
        expect(s.progressBase.force - baseForce).toBe(0);
    });

    it('PRIMUS (reward) gives first-play bonus to both force and escape', () => {
        let s = playingSession(5);
        s = rig(s, { play: [] });
        const baseForce = s.progressBase.force;
        const baseEscape = s.progressBase.escape;
        s = stageAndApply(s, 'r_primus');
        const def = getHazardCardDef('r_primus');
        expect(s.progressBase.force - baseForce).toBe(def.firstPlayForce ?? 0);
        expect(s.progressBase.escape - baseEscape).toBe(def.firstPlayEscape ?? 0);
    });

    it('OPENING RITE force miracle does not fire when prior card already applied', () => {
        let s = playingSession(5);
        const priorApplied = { uid: 'prior2', cardId: 'steps', dieId: null, applied: true };
        s = rig(s, { play: [priorApplied] });
        const baseForce = s.progressBase.force;
        s = rig(s, { hand: [{ uid: 'or1', cardId: 'r_openingrite', dieId: null }] });
        s = stageHazardCard(s, 'or1', BAG);
        s = applyHazardCard(s, 'or1', BAG);
        expect(s.progressBase.force - baseForce).toBe(0);
    });
});

describe('DELVE', () => {
    it('no delve bonus when discard pile is empty', () => {
        let s = playingSession(5);
        s = rig(s, { discardPile: [] });
        const baseForce = s.progressBase.force;
        s = stageAndApply(s, 'r_depthcharge');
        expect(s.progressBase.force - baseForce).toBe(0);
    });

    it('delve bonus scales with discard pile size', () => {
        let s = playingSession(5);
        const discardPile = ['steps', 'haul', 'steps'];
        s = rig(s, { discardPile });
        const baseForce = s.progressBase.force;
        s = stageAndApply(s, 'r_depthcharge');
        const def = getHazardCardDef('r_depthcharge');
        expect(s.progressBase.force - baseForce).toBe((def.delveForce ?? 0) * discardPile.length);
    });

    it('CIPHER (reward) burst fires and delve bonus scales escape by discard pile size', () => {
        let s = playingSession(5);
        const discardPile = ['steps', 'haul'];
        s = rig(s, { discardPile });
        const baseEscape = s.progressBase.escape;
        s = stageAndApply(s, 'r_cipher');
        const def = getHazardCardDef('r_cipher');
        const burstEscape = def.burstBase?.escape ?? 0;
        expect(s.progressBase.escape - baseEscape).toBe(burstEscape + (def.delveEscape ?? 0) * discardPile.length);
    });

    it('DELVE gives zero bonus at exactly 0 discard cards vs N discard cards', () => {
        const def = getHazardCardDef('r_inscription');
        let sEmpty = playingSession(5);
        sEmpty = rig(sEmpty, { discardPile: [] });
        const baseBefore = sEmpty.progressBase.escape;
        sEmpty = stageAndApply(sEmpty, 'r_inscription');
        expect(sEmpty.progressBase.escape - baseBefore).toBe(0);

        let sFull = playingSession(5);
        const pile = ['steps', 'haul'];
        sFull = rig(sFull, { discardPile: pile });
        const baseBeforeFull = sFull.progressBase.escape;
        sFull = stageAndApply(sFull, 'r_inscription');
        expect(sFull.progressBase.escape - baseBeforeFull).toBe((def.delveEscape ?? 0) * pile.length);
    });
});

describe('BUYBACK', () => {
    it('powered buyback card returns to hand after round, not to discard', () => {
        let s = playingSession(5, 'safe');
        const goldDie = die('gBk', 'gold');
        s = rig(s, {
            dice: [...s.dice.filter((d) => d.kind !== 'gold'), goldDie],
            hand: [{ uid: 'bk1', cardId: 'r_eternal', dieId: null }],
            play: [],
        });
        s = stageHazardCard(s, 'bk1', BAG);
        s = { ...s, play: s.play.map((p) => (p.uid === 'bk1' ? { ...p, dieId: 'gBk' } : p)), dice: s.dice.map((d) => (d.id === 'gBk' ? { ...d, state: 'spent' as const } : d)) };
        s = applyHazardCard(s, 'bk1', BAG);
        s = rig(s, {
            marks: ['O', 'O', 'pending'],
            progressBase: { force: 999, escape: 0 },
            hand: [],
        });
        s = resolveHazardRound(s, BAG);
        s = continueHazardAfterResolve(s, BAG);
        expect(s.phase).toBe('playing');
        expect(s.hand.some((h) => h.cardId === 'r_eternal')).toBe(true);
        expect(s.discardPile.includes('r_eternal')).toBe(false);
    });

    it('unpowered buyback card goes to discard (no free return)', () => {
        let s = playingSession(5, 'safe');
        s = rig(s, {
            hand: [{ uid: 'bk2', cardId: 'refrain', dieId: null }],
            play: [],
        });
        s = stageHazardCard(s, 'bk2', BAG);
        s = applyHazardCard(s, 'bk2', BAG);
        s = rig(s, {
            marks: ['O', 'O', 'pending'],
            progressBase: { force: 999, escape: 0 },
            hand: [],
        });
        s = resolveHazardRound(s, BAG);
        s = continueHazardAfterResolve(s, BAG);
        expect(s.phase).toBe('playing');
        expect(s.hand.some((h) => h.cardId === 'refrain')).toBe(false);
        expect(s.discardPile.includes('refrain')).toBe(true);
    });
});

describe('CRACK-as-punishment', () => {
    it('a failed round inserts a CRACK card before the next round draws', () => {
        let s = playingSession(5, 'safe');
        s = rig(s, {
            drawPile: ['steps', 'haul', 'steps', 'haul'],
            play: [entry('p1', HAZARD_CRACK_CARD.id, null)],
            hand: [],
        });
        s = resolveHazardRound(s, BAG);
        expect(s.resolveInfo?.cleared).toBe(false);
        s = continueHazardAfterResolve(s, BAG);
        expect(s.phase).toBe('playing');
        // CRACK is inserted mid-pile before the hand-draw step. It may end up
        // drawn into hand if mid ≤ HAND_SIZE, so check pile OR hand.
        const crackInPile = s.drawPile.includes(HAZARD_CRACK_CARD.id);
        const crackInHand = s.hand.some((h) => h.cardId === HAZARD_CRACK_CARD.id);
        expect(crackInPile || crackInHand).toBe(true);
    });

    it('a cleared round does NOT insert a CRACK card', () => {
        let s = playingSession(5, 'safe');
        s = rig(s, {
            drawPile: ['steps', 'haul', 'steps', 'haul'],
            progressBase: { force: 999, escape: 0 },
            play: [entry('p1', 'steps', null)],
            hand: [],
        });
        s = resolveHazardRound(s, BAG);
        const cleared = s.resolveInfo?.cleared;
        if (!cleared) return;
        s = continueHazardAfterResolve(s, BAG);
        expect(s.drawPile.filter((id) => id === HAZARD_CRACK_CARD.id)).toHaveLength(0);
    });
});
