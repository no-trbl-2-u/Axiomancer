/**
 * Hermetic E2E Tests — Tab visibility presenter
 *
 * Combat is mutually exclusive with exploration. The bottom tab bar
 * shows MAP when out of combat and COMBAT when in combat — never both.
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';

import { isTabHidden, selectVisibleTabs, TAB_TITLES, type TabKey } from '@/state/presenters/tabs.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path — out-of-combat shows MAP, in-combat shows COMBAT
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: happy path', () => {
    it('shows the exploration tab when not in combat', () => {
        const vm = selectVisibleTabs(false);

        expect(vm.visibleTabs).toContain('exploration');
        expect(vm.hiddenTabs).toContain('combat');
    });

    it('shows the combat tab when in combat', () => {
        const vm = selectVisibleTabs(true);

        expect(vm.visibleTabs).toContain('combat');
        expect(vm.hiddenTabs).toContain('exploration');
    });
});

// ---------------------------------------------------------------------------
// Mutual exclusion invariant
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: mutual exclusion', () => {
    it('never shows MAP and COMBAT at the same time, in either mode', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            const exploreVisible = vm.visibleTabs.includes('exploration');
            const combatVisible = vm.visibleTabs.includes('combat');

            expect(exploreVisible && combatVisible).toBe(false);
            expect(exploreVisible || combatVisible).toBe(true);
        }
    });

    it('places exactly one of MAP/COMBAT in hiddenTabs in either mode', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            const hidden = vm.hiddenTabs.filter(
                (t) => t === 'exploration' || t === 'combat',
            );

            expect(hidden).toHaveLength(1);
        }
    });
});

// ---------------------------------------------------------------------------
// Always-visible tabs invariant
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: always-visible tabs', () => {
    it.each([false, true])(
        'always shows SELF, MEMOIR, and SATCHEL (inCombat=%p)',
        (inCombat) => {
            const vm = selectVisibleTabs(inCombat);

            expect(vm.visibleTabs).toEqual(
                expect.arrayContaining(['character', 'memoir', 'inventory']),
            );
            expect(vm.hiddenTabs).not.toEqual(
                expect.arrayContaining(['character', 'memoir', 'inventory']),
            );
        },
    );

    it('returns 4 visible tabs (1 positional + 3 always-visible) post-Phase-33', () => {
        for (const inCombat of [false, true]) {
            const vm = selectVisibleTabs(inCombat);
            expect(vm.visibleTabs).toHaveLength(4);
        }
    });

    it('lists the positional tab first so it remains the leftmost in the bar', () => {
        expect(selectVisibleTabs(false).visibleTabs[0]).toBe('exploration');
        expect(selectVisibleTabs(true).visibleTabs[0]).toBe('combat');
    });
});

// ---------------------------------------------------------------------------
// isTabHidden helper — inverse view of the same selector
// ---------------------------------------------------------------------------

describe('isTabHidden: agreement with selectVisibleTabs', () => {
    const allTabs: TabKey[] = ['exploration', 'combat', 'character', 'memoir', 'inventory'];

    it.each([false, true])(
        'agrees with selectVisibleTabs for every tab when inCombat=%p',
        (inCombat) => {
            const vm = selectVisibleTabs(inCombat);

            for (const tab of allTabs) {
                const hidden = isTabHidden(inCombat, tab);
                expect(hidden).toBe(vm.hiddenTabs.includes(tab));
                expect(hidden).toBe(!vm.visibleTabs.includes(tab));
            }
        },
    );
});

// ---------------------------------------------------------------------------
// Purity / referential transparency
// ---------------------------------------------------------------------------

describe('selectVisibleTabs: purity', () => {
    it('returns deep-equal results for repeated calls with the same input', () => {
        const a = selectVisibleTabs(false);
        const b = selectVisibleTabs(false);

        expect(a).toEqual(b);
    });

    it('returns a fresh array each call so callers cannot mutate shared state', () => {
        const vm = selectVisibleTabs(false);
        vm.visibleTabs.push('combat');

        // A subsequent call still returns the canonical value.
        expect(selectVisibleTabs(false).visibleTabs).not.toContain('combat');
    });
});

// ---------------------------------------------------------------------------
// TAB_TITLES contract — Phase 30 Tick B
// ---------------------------------------------------------------------------

describe('TAB_TITLES: tab-label contract', () => {
    it('exposes a non-empty string title for every TabKey', () => {
        const keys: TabKey[] = ['exploration', 'combat', 'character', 'memoir', 'inventory'];
        for (const key of keys) {
            expect(typeof TAB_TITLES[key]).toBe('string');
            expect(TAB_TITLES[key].length).toBeGreaterThan(0);
        }
    });

    it('contains no `{...}` or `${...}` template-string leaks', () => {
        // Tick B contract: the user-observed runtime regression
        // rendered tab labels as `{ TAB NAME }"--index"` literally.
        // Pin that no title carries an unresolved template-shape.
        const leakRe = /\{[\s\w.-]+\}|\$\{[^}]+\}/;
        for (const [key, title] of Object.entries(TAB_TITLES)) {
            expect({ key, title, leaks: leakRe.test(title) }).toEqual({
                key,
                title,
                leaks: false,
            });
        }
    });

    it('matches the post-handoff-port register (places + MEMOIR + SATCHEL rename)', () => {
        // Phase 31 (2026-05-16) flipped from the mixed-register
        // pre-fix set (MAP · COMBAT · SHEET · SACK) to a coherent
        // all-places register. Phase 33 (2026-05-16) added MEMOIR as
        // a fifth route. Phase 32 (2026-05-16, Claude Design handoff
        // port) renamed SACK → SATCHEL to fit the period serif
        // register (`SACK` was bag-shaped slang flagged by the
        // design canvas decisions doc). The template-leak invariant
        // above stays stable across all three renames.
        expect(TAB_TITLES.exploration).toBe('WILDS');
        expect(TAB_TITLES.combat).toBe('STRIFE');
        expect(TAB_TITLES.character).toBe('SELF');
        expect(TAB_TITLES.memoir).toBe('MEMOIR');
        expect(TAB_TITLES.inventory).toBe('SATCHEL');
    });
});
