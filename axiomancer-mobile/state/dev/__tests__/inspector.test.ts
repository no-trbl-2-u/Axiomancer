/**
 * Hermetic tests — `selectInspectorSections` (dev STATE inspector).
 *
 * Pins:
 *   - Every section is present with string-only rows (the component
 *     never formats).
 *   - Values track the store: level / shillings / map / flags / labyrinth.
 *   - A labyrinth-less save reads "never entered"; an open minigame
 *     session is reported under RUN → open session.
 */

import { createAppStore } from '@/state/store';
import { selectInspectorSections } from '@/state/dev/inspector';

const sectionRows = (title: string) => {
    const store = createAppStore();
    return { store, rows: () => Object.fromEntries((selectInspectorSections(store.getState()).find((s) => s.title === title)?.rows ?? []).map((r) => [r.k, r.v])) };
};

describe('selectInspectorSections', () => {
    it('returns every section with string rows', () => {
        const store = createAppStore();
        const sections = selectInspectorSections(store.getState());
        expect(sections.map((s) => s.title)).toEqual(['RUN', 'PLAYER', 'DECK & GEAR', 'WORLD', 'STORY', 'THE APORIA']);
        for (const s of sections) {
            expect(s.rows.length).toBeGreaterThan(0);
            for (const r of s.rows) expect(typeof r.v).toBe('string');
        }
    });

    it('PLAYER tracks level and shillings', () => {
        const { store, rows } = sectionRows('PLAYER');
        const player = store.getState().player;
        store.setState({ player: { ...player, level: 7, currency: 123 } });
        expect(rows().level.startsWith('7 ·')).toBe(true);
        expect(rows().shillings).toBe('123');
    });

    it('WORLD reports the current map and node', () => {
        const { store, rows } = sectionRows('WORLD');
        const map = store.getState().world.currentMap;
        expect(rows().map).toBe(map.name);
        expect(rows().node).toBe(map.currentNode);
    });

    it('STORY lists flags with a count prefix', () => {
        const { store, rows } = sectionRows('STORY');
        store.setState({ flags: ['combat-tutorial-done', 'hazard-hexed'] } as never);
        expect(rows().flags).toBe('2 · combat-tutorial-done, hazard-hexed');
    });

    it('THE APORIA reads "never entered" without labyrinth progress', () => {
        const { rows } = sectionRows('THE APORIA');
        expect(rows().progress).toBe('never entered');
    });

    it('RUN → open session names an open rest session', () => {
        const { store, rows } = sectionRows('RUN');
        expect(rows()['open session']).toBe('none');
        store.setState({ rest: { session: {} as never } } as never);
        expect(rows()['open session']).toBe('rest');
    });
});
