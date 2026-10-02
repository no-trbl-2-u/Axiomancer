/**
 * Rest shelter classification.
 *
 * `RestPayload.shelter` is an authored marker saying whether a rest is an
 * inn or a camp; this module is the single place the default and the inn
 * test live.
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
 * The engine's passive `resolveRest` heal: a full heal — do not tune here.
 *
 * The player-facing rest is `World/RestChoice`, whose `rest` offer heals a
 * flat fraction of max VITAE (`RESTCHOICE_TUNING.restHealFraction`, no
 * shelter distinction); the inn scar mend still hangs off `shelter`. Any
 * tuning belongs there.
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
