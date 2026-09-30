/**
 * Hazard UI/UX LOCK-IN (user ask, 2026-06-11).
 *
 * The hazard view-model is the entire contract the screen renders. This
 * suite freezes its STRUCTURE (every field + nested element shape) across
 * the route-select and round-play phases. Any change to the hazard UI/UX
 * contract — a renamed field, a dropped surface, a new view affordance —
 * trips these snapshots so it is surfaced and consciously re-blessed
 * (`jest -u`) with a note in the commit body, never slipped in silently.
 *
 * It locks the SHAPE, not the numbers, so deliberate balance tweaks do not
 * trip it — only contract drift does.
 */

import {
    finishHazardRolling,
    selectHazardRoute,
    createHazardSession,
} from '@mechanics';
import { hazardStarterBag } from '@mechanics';
import type { HazardSessionState } from '@mechanics';
import { selectHazardViewModel } from '@/state/presenters/hazard.engine';

const BAG = hazardStarterBag();

/** Maps a value to a stable type-shape: object keys (sorted) → child shapes,
 *  arrays → a single element shape, primitives → their typeof. */
function shapeOf(v: unknown): unknown {
    if (Array.isArray(v)) return v.length ? [shapeOf(v[0])] : [];
    if (v && typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(v as object).sort()) {
            out[k] = shapeOf((v as Record<string, unknown>)[k]);
        }
        return out;
    }
    return v === null ? 'null' : typeof v;
}

function vmOf(session: HazardSessionState) {
    return selectHazardViewModel({ hazard: { session, tutorial: false } });
}

describe('hazard view-model lock-in', () => {
    it('route-select VM contract is frozen', () => {
        const s = createHazardSession(7, BAG, 'cracked-cliff');
        expect(shapeOf(vmOf(s))).toMatchSnapshot('route-select-shape');
    });

    it('round-play VM contract is frozen (a staged, powered card on the board)', () => {
        const base = finishHazardRolling(selectHazardRoute(createHazardSession(7, BAG, 'cracked-cliff'), 'risk', BAG));
        const rich: HazardSessionState = {
            ...base,
            dice: [
                { id: 'dg', kind: 'gold', state: 'spent' },
                { id: 'dx', kind: 'hex', state: 'available' },
            ],
            play: [{ uid: 'p1', cardId: 'oath', dieId: 'dg', applied: false }],
        };
        expect(shapeOf(vmOf(rich))).toMatchSnapshot('round-play-shape');
    });
});
