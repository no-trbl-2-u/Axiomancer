/**
 * Hermetic E2E Tests — Event codex presenter (Phase 50 tick C).
 *
 * Pins `selectEventCodexHeader` against the `EventViewModel` shape.
 * Pure helper — no engine touch in this file; tests construct
 * minimal synthetic VMs.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { describe, expect, it } from '@jest/globals';

import { selectEventCodexHeader } from '@/state/presenters/event.codex.engine';
import type { EventViewModel } from '@/state/presenters/event.engine';

function makeVm(overrides: Partial<EventViewModel>): EventViewModel {
    return {
        kind: 'combat-prelude',
        variant: 'encounter',
        artSlug: 'encounter',
        badge: '',
        badgeAccentKey: 'parchment',
        title: '',
        subtitle: '',
        body: '',
        choices: [],
        lore: null,
        canSkip: false,
        preludeChrome: null,
        chrome: {} as unknown as EventViewModel['chrome'],
        ...overrides,
    } as EventViewModel;
}

describe('selectEventCodexHeader', () => {
    it('renders EVENT/<variant> · KIND/<kind> uppercased', () => {
        const vm = makeVm({ kind: 'combat-prelude', variant: 'encounter' });
        expect(selectEventCodexHeader(vm)).toEqual({
            left: 'EVENT/ENCOUNTER',
            right: 'KIND/COMBAT.PRELUDE',
        });
    });

    it('normalizes hyphens in kind to dots (codex mono register)', () => {
        const vm = makeVm({ kind: 'narrative-choice' });
        expect(selectEventCodexHeader(vm).right).toBe('KIND/NARRATIVE.CHOICE');
    });

    it('threads every variant through the left token', () => {
        const variants: EventViewModel['variant'][] = [
            'encounter',
            'boss',
            'quest',
            'npc',
        ];
        for (const variant of variants) {
            const vm = makeVm({ variant });
            expect(selectEventCodexHeader(vm).left).toBe(
                `EVENT/${variant.toUpperCase()}`,
            );
        }
    });

    it('threads narrative-choice + boss as a coherent pair (no cross-contamination)', () => {
        const vm = makeVm({ kind: 'narrative-choice', variant: 'boss' });
        expect(selectEventCodexHeader(vm)).toEqual({
            left: 'EVENT/BOSS',
            right: 'KIND/NARRATIVE.CHOICE',
        });
    });

    it('produces stable tokens — calling twice on the same VM gives identical output', () => {
        const vm = makeVm({ kind: 'combat-prelude', variant: 'npc' });
        const first = selectEventCodexHeader(vm);
        const second = selectEventCodexHeader(vm);
        expect(first).toEqual(second);
    });
});
