/**
 * Rest shelter classification (Phase 52b).
 *
 * "Is this an inn?" used to mean `healFraction >= 1.0`. That heuristic
 * was wrong on the authored content — `nf-4` (cold spring), `nf-24`
 * (hidden grove) and every `fvRestPool` node were all authored at 1.0,
 * so two wilderness springs mended hazard-scarred max-VITAE exactly like
 * a paid shelter. `RestPayload.shelter` replaces the inference with an
 * authored marker; this module is the single place the default and the
 * inn test live.
 *
 * The scar mend is an INN-ONLY privilege. It is the strongest argument
 * for keeping inns distinct at all, so it hangs off `shelter === 'inn'`
 * and nothing else.
 */

import type { RestPayload, RestShelter } from './types';

/**
 * A rest node that does not declare a shelter is wilderness. Silence is
 * never a paid bed — mislabelling hands out free max-VITAE repair.
 */
export const DEFAULT_REST_SHELTER: RestShelter = 'camp';

/**
 * CARRIED FORWARD from the retired `healFraction` knob — do not tune here.
 *
 * The retired `RestPayload.healFraction` defaulted to 1.0
 * (`payload.healFraction ?? 1.0` in `resolveRest`, and
 * `options.healFraction ?? 1.0` in mobile's `beginRestAction`). Phase 52b
 * removed the per-node knob, so the shipped default is carried forward
 * verbatim as this constant for the engine's passive `resolveRest` heal.
 *
 * Phase 52c shipped the player-facing rest as `World/RestChoice`, whose
 * `rest` offer heals a flat fraction of max VITAE
 * (`RESTCHOICE_TUNING.restHealFraction`, no shelter distinction — T direct,
 * 2026-08-15); the inn scar mend still hangs off `shelter`. Any tuning
 * belongs there.
 */
export const REST_PASSIVE_HEAL_FRACTION = 1.0;

/** The authored shelter class of a rest payload, defaulting to `'camp'`. */
export function restShelterOf(payload: RestPayload): RestShelter {
    return payload.shelter ?? DEFAULT_REST_SHELTER;
}

/**
 * True for a paid, tended shelter. The hazard-scar max-VITAE mend is
 * gated on exactly this — never on a heal magnitude.
 */
export function isInnShelter(shelter: RestShelter): boolean {
    return shelter === 'inn';
}
