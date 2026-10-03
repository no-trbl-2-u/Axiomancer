/**
 * S4-world-C07 — the chart is bigger than the window, and has to say so.
 *
 * The exploration map spreads its nodes across a 936x1040 canvas behind a
 * phone-sized viewport that pans and pinches. A player reads "25 nodes" in
 * the legend and counts about eight on screen, so the chart has to name the
 * gesture. The always-on gesture line is pinned in
 * `components/exploration/__tests__/MapOverlays.test.tsx`; this file pins
 * the premise that makes it necessary.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppStore } from '@/state/store';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';

function vm() {
    return selectExplorationViewModel(
        createAppStore({ adapter: createMemoryAdapter() }).getState(),
    );
}

describe('S4-world-C07: the map must name the pan gesture', () => {
    it('draws far more nodes than a phone viewport can show, which is why it must', () => {
        // The premise of the finding, pinned so a future layout that genuinely
        // fits on screen retires the gesture line rather than leaving it lying.
        expect(vm().nodes.length).toBeGreaterThan(12);
    });
});
