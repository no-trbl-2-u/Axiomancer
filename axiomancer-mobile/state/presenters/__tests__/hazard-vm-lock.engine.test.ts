/**
 * Hazard UI/UX LOCK-IN (user ask, 2026-06-11).
 *
 * The hazard view-model is the entire contract the screen renders. This
 * suite freezes its STRUCTURE (every field + nested element shape) across
 * the route-select and round-play phases, plus the copy of the newer
 * surfaces (enchantments / vow / choose). Any change to the hazard UI/UX
 * contract — a renamed field, a dropped surface, a new view affordance —
 * trips these snapshots so it is surfaced and consciously re-blessed
 * (`jest -u`) with a note in `docs/hazard-card-expansion-2026-06-11-spec.md`,
 * never slipped in silently.
 *
 * It locks the SHAPE, not the numbers, so deliberate balance tweaks do not
 * trip it — only contract drift does.
 */

import {
    finishHazardRolling,
    selectHazardRoute,
    createHazardSession,
} from 'axiomancer-mechanics';
import { hazardStarterBag } from 'axiomancer-mechanics';
import type { HazardSessionState } from 'axiomancer-mechanics';
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
    return selectHazardViewModel({ hazard: { session } });
}

describe('hazard view-model lock-in', () => {
    it('route-select VM contract is frozen', () => {
        const s = createHazardSession(7, BAG, 'cracked-cliff');
        expect(shapeOf(vmOf(s))).toMatchSnapshot('route-select-shape');
    });

    it('round-play VM contract is frozen (with every new surface populated)', () => {
        const base = finishHazardRolling(selectHazardRoute(createHazardSession(7, BAG, 'cracked-cliff'), 'risk', BAG));
        // Hand-rig a session that exercises ALL of the expansion surfaces so
        // their element shapes are part of the locked contract: active
        // enchantments, a primed gold vow, and a staged CHOOSE card carrying
        // a vow bonus.
        const rich: HazardSessionState = {
            ...base,
            modifiers: { auraForce: 2, auraEscape: 1, surgeForce: 2, surgeEscape: 0 },
            goldVow: { force: 7, escape: 7 },
            dice: [
                { id: 'dg', kind: 'gold', state: 'spent' },
                { id: 'dx', kind: 'hex', state: 'available' },
            ],
            play: [
                { uid: 'p1', cardId: 'r_twin', dieId: 'dg', applied: false, chosenKey: 'force', vowBonus: { force: 7, escape: 7 } },
            ],
        };
        expect(shapeOf(vmOf(rich))).toMatchSnapshot('round-play-shape');
    });

    it('new surface copy is frozen (enchantments / vow / choose)', () => {
        const base = finishHazardRolling(selectHazardRoute(createHazardSession(7, BAG, 'cracked-cliff'), 'risk', BAG));
        const rich: HazardSessionState = {
            ...base,
            modifiers: { auraForce: 2, auraEscape: 1, surgeForce: 2, surgeEscape: 0 },
            goldVow: { force: 7, escape: 7 },
            play: [
                { uid: 'p1', cardId: 'r_twin', dieId: 'dg', applied: false, chosenKey: 'escape', vowBonus: { force: 7, escape: 7 } },
            ],
            dice: [{ id: 'dg', kind: 'gold', state: 'spent' }],
        };
        const vm = vmOf(rich);
        expect({
            enchantments: vm.enchantments,
            goldVowNote: vm.goldVowNote,
            choose: { choose: vm.play[0].choose, chosenKey: vm.play[0].chosenKey, vowBonus: vm.play[0].vowBonus, powered: vm.play[0].powered },
        }).toMatchSnapshot('expansion-copy');
    });
});
