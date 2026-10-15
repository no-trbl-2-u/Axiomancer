/**
 * Rest shelter classification.
 *
 * `RestPayload.shelter` is an authored marker saying whether a rest is an
 * inn or a camp; this module is the single place the default and the inn
 * test live.
 *
 * The shelter changes only how the rest screen words the night; every
 * rest, inn or camp, mends hazard-scarred max-VITAE (Act 1's only inns
 * are in the Breakwater, so an inn-only mend left later scars permanent).
 */

import type { RestPayload, RestShelter } from './types';

/** A rest node that does not declare a shelter is wilderness. */
export const DEFAULT_REST_SHELTER: RestShelter = 'camp';

/**
 * The engine's passive `resolveRest` heal: a full heal — do not tune here.
 *
 * The player-facing rest is `World/RestChoice`, whose `rest` offer heals a
 * flat fraction of max VITAE (`RESTCHOICE_TUNING.restHealFraction`, no
 * shelter distinction). Any
 * tuning belongs there.
 */
export const REST_PASSIVE_HEAL_FRACTION = 1.0;

/** The authored shelter class of a rest payload, defaulting to `'camp'`. */
export function restShelterOf(payload: RestPayload): RestShelter {
    return payload.shelter ?? DEFAULT_REST_SHELTER;
}

/** True for a paid, tended shelter. */
export function isInnShelter(shelter: RestShelter): boolean {
    return shelter === 'inn';
}
