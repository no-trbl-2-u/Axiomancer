/**
 * Hermetic presenter pin — encounter-seal chrome helper.
 *
 * `selectEncounterSealChrome` is a pure function of (mode, round);
 * the test file mirrors that shape — no provider scaffolding, just
 * direct calls.
 */

import { describe, expect, it } from '@jest/globals';

import { AXM } from '@/theme/axm';
import { selectEncounterSealChrome } from '@/state/presenters/encounter-seal.engine';

describe('selectEncounterSealChrome', () => {
    it('returns the prelude chrome (blood) for prelude mode', () => {
        const chrome = selectEncounterSealChrome('prelude');
        expect(chrome.topLabel).toBe('SEALED · AT ARMS');
        expect(chrome.bottomLabel).toBe('NO RETREAT');
        expect(chrome.accentColor).toBe(AXM.blood);
    });

    it('returns the round-i label for combat round 1', () => {
        const chrome = selectEncounterSealChrome('combat', 1);
        expect(chrome.topLabel).toBe('SEALED · ROUND i');
        expect(chrome.bottomLabel).toBe('NO RETREAT');
        expect(chrome.accentColor).toBe(AXM.blood);
    });

    it('returns the round-iii label for combat round 3 (lowercase roman)', () => {
        const chrome = selectEncounterSealChrome('combat', 3);
        expect(chrome.topLabel).toBe('SEALED · ROUND iii');
    });

    it('defaults the combat round to 1 when omitted', () => {
        const chrome = selectEncounterSealChrome('combat');
        expect(chrome.topLabel).toBe('SEALED · ROUND i');
    });

    it('returns the aftermath chrome (sulfur) for aftermath mode', () => {
        const chrome = selectEncounterSealChrome('aftermath');
        expect(chrome.topLabel).toBe('IT IS DONE');
        expect(chrome.bottomLabel).toBe('CARRY ON');
        expect(chrome.accentColor).toBe(AXM.sulfur);
    });

    it('uses distinct glow colors for blood vs sulfur states', () => {
        const prelude = selectEncounterSealChrome('prelude');
        const aftermath = selectEncounterSealChrome('aftermath');
        expect(prelude.glowColor).not.toBe(aftermath.glowColor);
    });

    it('the round number doesnt affect non-combat modes (prelude / aftermath are round-independent)', () => {
        const a = selectEncounterSealChrome('prelude', 5);
        const b = selectEncounterSealChrome('prelude', 1);
        expect(a).toEqual(b);
        const c = selectEncounterSealChrome('aftermath', 5);
        const d = selectEncounterSealChrome('aftermath', 1);
        expect(c).toEqual(d);
    });

    it('round labels render in lowercase roman across the typical 1-3 range', () => {
        expect(selectEncounterSealChrome('combat', 1).topLabel).toContain('i');
        expect(selectEncounterSealChrome('combat', 2).topLabel).toContain('ii');
        expect(selectEncounterSealChrome('combat', 3).topLabel).toContain('iii');
    });

    it('renders a · sentinel for round 0 (defensive — engine never sends this in combat mode)', () => {
        const chrome = selectEncounterSealChrome('combat', 0);
        expect(chrome.topLabel).toBe('SEALED · ROUND ·');
    });
});
