/**
 * S4-world-C07 — the chart is bigger than the window, and has to say so.
 *
 * The exploration map spreads its nodes across a 936x1040 canvas behind a
 * phone-sized viewport that pans and pinches. A first-time player read
 * "25 nodes" in the legend, counted about eight on screen, saw them cut off
 * on every side, and had nothing anywhere telling them the sheet moved — the
 * only copy over the chart said "tap a glowing node".
 *
 * The nudge now names the gesture as well as the tap. (Its always-on twin,
 * the compass line, is pinned in
 * `components/exploration/__tests__/MapOverlays.test.tsx` — the hint chip
 * fades after five seconds and must not be the only place it is told.)
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

describe('S4-world-C07: the map hint names the pan gesture', () => {
    it('tells the player the chart can be dragged or pinched', () => {
        const hint = vm().drawerCopy.mapHint;
        expect(hint).toMatch(/drag/i);
        expect(hint).toMatch(/pinch/i);
    });

    it('still tells the player what a tap does', () => {
        expect(vm().drawerCopy.mapHint).toMatch(/tap/i);
    });

    it('draws far more nodes than a phone viewport can show, which is why it must', () => {
        // The premise of the finding, pinned so a future layout that genuinely
        // fits on screen retires this copy rather than leaving it lying.
        expect(vm().nodes.length).toBeGreaterThan(12);
    });
});
