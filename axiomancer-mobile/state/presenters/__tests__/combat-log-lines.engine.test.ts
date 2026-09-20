/**
 * Hermetic presenter tests — `selectCombatLogLines` (playtest fix 2026-09-04).
 *
 * The playthrough found three engine ledgers the log never narrated: a foe's
 * bar climbing (RAVENOUS / REGROW / STAGE / THREAT heal) with no line saying
 * why, and the PLEA tally falling twice a round (a THREAT cleanse, then the
 * turn-boundary decay) in silence. This pins that every one of them now has a
 * sentence, that the sentence carries the engine's number, and that the
 * decay line quotes the engine's own constant rather than a copied literal.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';
import { STRIKE_ADD_COST, SWAY_DECAY_PER_TURN, type CombatEvent } from '@mechanics';

import { selectCombatLogLines } from '@/state/presenters/combat-encounter.engine';

describe('selectCombatLogLines — enemy healing is narrated with its source', () => {
    type HealSource = Extract<CombatEvent, { kind: 'enemy-healed' }>['source'];
    const cases: [HealSource, string][] = [
        ['RAVENOUS', 'RAVENOUS'],
        ['REGROW', 'REGROW'],
        ['STAGE', 'STAGE'],
        ['THREAT', 'threat'],
    ];
    it.each(cases)('%s heal names its cause and the amount', (source, word) => {
        const events: CombatEvent[] = [{ kind: 'enemy-healed', enemyId: 'e', source, amount: 13 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('enemy-healed');
        expect(line.side).toBe('enemy');
        expect(line.text).toContain(word);
        expect(line.text).toContain('VITAE +13');
        expect(line.float).toBe('+13');
    });
});

describe('selectCombatLogLines — PLEA losses are narrated', () => {
    it('a THREAT cleanse prints the amount shed and floats it over the foe', () => {
        const events: CombatEvent[] = [{ kind: 'threat-sway-cleansed', phaseIndex: 2, amount: 3 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('threat-sway-cleansed');
        expect(line.text).toContain('PLEA −3');
        expect(line.float).toBe('PLEA −3');
    });

    it('the turn-boundary decay is log-only and quotes the engine constant + the remainder', () => {
        const events: CombatEvent[] = [{ kind: 'sway-decayed', total: 6 }];
        const [line] = selectCombatLogLines(events);
        expect(line.kind).toBe('sway-decayed');
        expect(line.text).toContain(`PLEA −${SWAY_DECAY_PER_TURN}`);
        expect(line.text).toContain('6 holds');
        expect(line.float).toBeNull();
    });
});

describe('selectCombatLogLines — HIDE now reaches the log through the keyword receipt', () => {
    it('a HIDE receipt reads as the keyword answering for the soaked amount', () => {
        const events: CombatEvent[] = [{ kind: 'enemy-keyword-fired', enemyId: 'e', keyword: 'HIDE', amount: 4 }];
        const [line] = selectCombatLogLines(events);
        expect(line.text).toMatch(/^HIDE answers for 4\./);
        expect(line.float).toBe('HIDE for 4');
    });
});

/**
 * Phase 102 (SUMMON) / burn-day audit 3.4 — the brood is narrated, not swallowed.
 *
 * The engine emitted `add-spawned` / `add-bit` / `add-struck` and the strike's
 * `effect-fizzled` into `state.log`, and this switch had no arm for any of
 * them, so all four fell to `default:` and vanished. Because
 * `selectCombatLogHistory`'s `default:` delegates here, the log AND the
 * history went silent together: a player could eat a brood bite, watch VITAE
 * fall, and find nothing anywhere saying what took it.
 *
 * BUG DETECTORS, not balance laws (THE BIG NUMBERS REWRITE). Every magnitude
 * below is an input this test supplies, and the strike's price is imported
 * from the engine — retune the bite, the wave size or the price and these
 * stay green. What is pinned is the RELATION: the brood's numbers reach the
 * sentence, and the refusal reaches it in the engine's own words.
 */
describe('selectCombatLogLines — the brood is narrated (phase 102, audit 3.4)', () => {
    it('an add-bit names the printed bite, the wall’s share and what you actually took', () => {
        const events: CombatEvent[] = [{ kind: 'add-bit', addIds: ['a1', 'a2'], raw: 8, dealt: 5 }];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.kind).toBe('add-bit');
        expect(line.side).toBe('player');
        expect(line.text).toContain('8');
        expect(line.text).toContain('5');
        // The soaked remainder is the decision the wall readout is asking the
        // player to make, so the sentence must carry it too.
        expect(line.text).toContain('3');
    });

    it('a fully soaked bite is still written down', () => {
        const events: CombatEvent[] = [{ kind: 'add-bit', addIds: ['a1'], raw: 8, dealt: 0 }];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.text).toContain('8');
        expect(line.float).toBeNull();
    });

    /**
     * The bite's FLOAT is not this switch's to push (burn-day audit 3.3 gave it
     * one, on the player's own medallion, in the brood's colour, plus the
     * pane's `DENIED · BROOD −N` composite). Every non-null `float` here is
     * pushed over the ENEMY pane by `CombatCombatantPane`, so a token here
     * would be a third shout for one bite, on the wrong side. Log-only is the
     * deliberate choice; this pins it so nobody "completes" the case by
     * adding one.
     */
    it('never floats the bite — that surface belongs to the medallion and the pane', () => {
        for (const dealt of [0, 5]) {
            const events: CombatEvent[] = [{ kind: 'add-bit', addIds: ['a1'], raw: 8, dealt }];
            const [line] = selectCombatLogLines(events);
            expect(line.float).toBeNull();
        }
    });

    it('an add-spawned states the body count and that the brood bites through a denial', () => {
        const events: CombatEvent[] = [
            { kind: 'add-spawned', enemyId: 'e', wave: 1, addIds: ['a1', 'a2'], bite: 4 },
        ];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.side).toBe('enemy');
        expect(line.text).toContain('2');
        expect(line.text).toContain('4');
        expect(line.text).toMatch(/denied/i);
        expect(line.float).not.toBeNull();
    });

    /**
     * A STAGE that grants SUMMON emits `enemy-keyword-fired` with the face
     * string `SUMMON 2` on the very boundary the wave spawns on. If this line
     * also led with a bare `SUMMON.` the player would read the same word twice
     * in two sentences — the duplication this switch's docblock forbids.
     */
    it('does not re-announce the keyword the foe’s own receipt already printed', () => {
        const events: CombatEvent[] = [
            { kind: 'enemy-keyword-fired', enemyId: 'e', keyword: 'SUMMON 2' },
            { kind: 'add-spawned', enemyId: 'e', wave: 1, addIds: ['a1', 'a2'], bite: 4 },
        ];
        const lines = selectCombatLogLines(events);
        expect(lines).toHaveLength(2);
        const spawned = lines.find((l) => l.kind === 'add-spawned')!;
        expect(spawned.text).not.toMatch(/SUMMON/);
        expect(spawned.float).not.toMatch(/SUMMON/);
    });

    it('an add-struck names the body and the price it cost, read off the event', () => {
        const events: CombatEvent[] = [
            { kind: 'add-struck', addId: 'a1', name: 'Brier Shoot', cost: STRIKE_ADD_COST },
        ];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.side).toBe('enemy');
        expect(line.text).toContain('Brier Shoot');
        expect(line.text).toContain(String(STRIKE_ADD_COST));
        expect(line.float).not.toBeNull();
    });

    it('a refused action reaches the log in the engine’s own words, and does not shout', () => {
        const message = `need ${STRIKE_ADD_COST} ◆ Conviction (have 0)`;
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: 'a1', effectId: '', message }];
        const [line] = selectCombatLogLines(events);
        expect(line).toBeDefined();
        expect(line.side).toBe('player');
        // VERBATIM on purpose: the presenter must not re-word or re-case the
        // engine's player-facing message, or the two vocabularies drift.
        expect(line.text).toContain(message);
        // `effect-fizzled` fires from two dozen sites (empty discard, no glyph
        // to charge, an unaffordable signature). A float here would carpet the
        // board with toasts on every mis-tap. The log is the ledger; the float
        // is the shout.
        expect(line.float).toBeNull();
    });
});
