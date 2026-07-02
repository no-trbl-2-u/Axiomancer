/**
 * Hermetic E2E Tests — Exploration codex presenter (Phase 50 tick D).
 *
 * Pins `selectExplorationCodexHeader` against the
 * `ExplorationViewModel` shape. Pure helper — no engine touch in
 * this file; tests construct minimal synthetic VMs.
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { describe, expect, it } from '@jest/globals';

import { selectExplorationCodexHeader } from '@/state/presenters/exploration.codex.engine';
import type { ExplorationViewModel } from '@/state/presenters/exploration.engine';

function makeVm(overrides: Partial<ExplorationViewModel>): ExplorationViewModel {
    return {
        continent: 'Coastal',
        region: 'Northern Forest',
        regionProgress: 'Map ii of vii',
        mapId: 'northern-forest',
        currentNodeId: 'nf-1',
        nodes: [],
        edges: [],
        actions: [],
        options: [],
        drawerCopy: { emptyMessage: '', title: '', leaguesLabel: '' },
        eventCallout: null,
        legend: { leftLabel: '', rightLabel: '' } as unknown as ExplorationViewModel['legend'],
        ...overrides,
    } as ExplorationViewModel;
}

describe('selectExplorationCodexHeader', () => {
    it('renders REGION/<region> · NODE/<currentNodeId> with the codex slug rules', () => {
        const vm = makeVm({ region: 'Northern Forest', currentNodeId: 'nf-1' });
        expect(selectExplorationCodexHeader(vm)).toEqual({
            left: 'REGION/NORTHERN.FOREST',
            right: 'NODE/NF.1',
        });
    });

    it('uppercases + normalizes hyphens, underscores, whitespace to single dots', () => {
        const vm = makeVm({
            region: 'the_ash--marches',
            currentNodeId: 'ash march 12',
        });
        expect(selectExplorationCodexHeader(vm)).toEqual({
            left: 'REGION/THE.ASH.MARCHES',
            right: 'NODE/ASH.MARCH.12',
        });
    });

    it('strips characters outside [A-Z0-9.]', () => {
        const vm = makeVm({ region: "the Verge's Wood!", currentNodeId: 'vw#3' });
        expect(selectExplorationCodexHeader(vm)).toEqual({
            left: 'REGION/THE.VERGES.WOOD',
            right: 'NODE/VW3',
        });
    });

    it('falls back to UNKNOWN region + NONE node when the inputs have no slug-able characters', () => {
        const vm = makeVm({ region: '!!!', currentNodeId: '' });
        expect(selectExplorationCodexHeader(vm)).toEqual({
            left: 'REGION/UNKNOWN',
            right: 'NODE/NONE',
        });
    });

    it('produces stable tokens — calling twice on the same VM gives identical output', () => {
        const vm = makeVm({ region: 'Coastal Cliffs', currentNodeId: 'cc-9' });
        const first = selectExplorationCodexHeader(vm);
        const second = selectExplorationCodexHeader(vm);
        expect(first).toEqual(second);
    });
});
