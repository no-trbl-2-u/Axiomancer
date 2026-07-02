/**
 * Rest encounter ("The Night Watch") — pure engine transitions.
 *
 * Every transition is `(session, …) → session` with explicit RNG
 * state; invalid calls return the input unchanged. State machine:
 *
 *   posture ──chooseRestPosture──▶ watch ──(chooseRestOption)──▶ watch
 *                                    │  ▲                          │
 *                                    │  └──continueRestWatch───────┤ (watches left)
 *                                    │                             │
 *                                    └────▶ outcome ◀──────────────┘ (dawn)
 *                                              │
 *                                      claimRestOutcome
 *                                              ▼
 *                                            done
 *
 * A night can be MEAGRE but never lethal: every path out of the dark
 * heals ≥ 0. Stirs and cold only thin the morning's measure.
 */

import {
    getRestDreamDef,
    getRestPostureDef,
    REST_DREAMS,
    REST_TUNING,
    REST_WATCH_BAG,
} from './rest.content';
import { rollDie, seedRng, shuffle, type RestRngState } from './rest.rng';
import type { SeedInput } from '../seed';
import type {
    RestOutcome,
    RestOutcomeTier,
    RestPendingWatch,
    RestPosture,
    RestSession,
    RestWatchOption,
    RestWatchResult,
} from './rest.types';

const T = REST_TUNING;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Deals the night: 3 watch slips from the bag, dreams in seeded order.
 * `baseHealFraction` is the authored map-event baseline (default 1.0)
 * and scales the whole night's heal.
 */
export function createRestSession(seed: SeedInput, baseHealFraction = 1.0): RestSession {
    let rng: RestRngState = seedRng(seed);

    const bag = shuffle(rng, REST_WATCH_BAG);
    rng = bag.state;
    const watchPlan = bag.value.slice(0, T.watchesPerNight);

    const dreams = shuffle(rng, REST_DREAMS.map(d => d.id));
    rng = dreams.state;

    return {
        phase: 'posture',
        baseHealFraction,
        posture: null,
        watch: 0,
        watchPlan,
        dreamQueue: dreams.value,
        warmth: T.warmthStart,
        wood: T.woodStart,
        comfort: 0,
        keepsakes: [],
        pending: null,
        outcome: null,
        seed,
        rng,
    };
}

/** posture → watch. Lies down and opens the first watch. */
export function chooseRestPosture(s: RestSession, posture: RestPosture): RestSession {
    if (s.phase !== 'posture') return s;
    getRestPostureDef(posture); // throws on unknown keys
    return openWatch({ ...s, posture, phase: 'watch', watch: 1 });
}

// ---------------------------------------------------------------------------
// Watch cards
// ---------------------------------------------------------------------------

function applyWatchDeltas(s: RestSession, r: RestWatchResult): RestSession {
    return {
        ...s,
        warmth: Math.max(0, Math.min(T.warmthMax, s.warmth + r.warmthDelta)),
        wood: Math.max(0, s.wood + r.woodDelta),
        comfort: Math.max(0, s.comfort + r.comfortDelta),
        keepsakes: r.keepsake ? [...s.keepsakes, r.keepsake] : s.keepsakes,
    };
}

function emptyWatchResult(): RestWatchResult {
    return { title: '', body: '', rolls: [], warmthDelta: 0, woodDelta: 0, comfortDelta: 0, keepsake: '' };
}

/** Opens the current watch's card; passive watches resolve immediately. */
function openWatch(s: RestSession): RestSession {
    const kind = s.watchPlan[s.watch - 1];

    switch (kind) {
        case 'embers': {
            const options: RestWatchOption[] = [
                {
                    id: 'feed',
                    label: 'FEED THE FIRE',
                    desc: '−1 firewood, +1 warmth.',
                    ...(s.wood <= 0 ? { disabledReason: 'No firewood left.' } : {}),
                },
                {
                    id: 'spare',
                    label: 'SPARE THE WOOD',
                    desc: 'Keep the firewood. The circle of light shrinks: −1 warmth.',
                },
            ];
            return setPending(s, {
                watch: s.watch,
                kind,
                title: 'THE FIRE ASKS',
                body: 'The embers settle and dim, and the dark leans in an inch to see if anyone minds.',
                options,
                result: null,
            });
        }

        case 'dream': {
            const dreamId = s.dreamQueue[(s.watch - 1) % s.dreamQueue.length];
            const dream = getRestDreamDef(dreamId);
            const options: RestWatchOption[] = [
                {
                    id: 'hold',
                    label: 'HOLD THE DREAM',
                    desc: 'Carry it into morning as a keepsake.',
                },
                {
                    id: 'fade',
                    label: 'LET IT FADE',
                    desc: 'Take its comfort and let it go: +1 comfort.',
                },
            ];
            return setPending(s, {
                watch: s.watch,
                kind,
                title: dream.title,
                body: dream.lines.join('\n'),
                options,
                result: null,
                dreamId,
            });
        }

        case 'stir': {
            // Posture decides before any choice could: the stir resolves
            // immediately.
            if (s.posture === 'watch') {
                const result: RestWatchResult = {
                    ...emptyWatchResult(),
                    title: 'SEEN OFF',
                    body:
                        'Something circles the light, finds eyes already on it, and thinks better. ' +
                        'Near where it stood: a dropped thing worth keeping. +1 comfort.',
                    comfortDelta: 1,
                    keepsake: 'Something glinting, dropped at the treeline',
                };
                return setPending(applyWatchDeltas(s, result), pendingResult(s, 'stir', result));
            }
            if (s.posture === 'deep') {
                const result: RestWatchResult = {
                    ...emptyWatchResult(),
                    title: 'STARTLED AWAKE',
                    body:
                        'He wakes with a shout half-out of his mouth and the fire scattered. ' +
                        'Whatever it was has already gone. −1 warmth, −1 comfort.',
                    warmthDelta: -1,
                    comfortDelta: -1,
                };
                return setPending(applyWatchDeltas(s, result), pendingResult(s, 'stir', result));
            }
            // doze: a coin toss on the bone die.
            const roll = rollDie(s.rng);
            const next = { ...s, rng: roll.state };
            const result: RestWatchResult = roll.value >= 4
                ? {
                    ...emptyWatchResult(),
                    title: 'HALF-WOKEN, READY',
                    body: 'One ear was enough. A stone, thrown without sitting up, and the dark apologises into silence.',
                    rolls: [roll.value],
                }
                : {
                    ...emptyWatchResult(),
                    title: 'A BAD MINUTE',
                    body: 'Tangled in the blanket, heart going like a drum. Nothing took anything — except the rest of the hour. −1 comfort.',
                    rolls: [roll.value],
                    comfortDelta: -1,
                };
            return setPending(applyWatchDeltas(next, result), pendingResult(next, 'stir', result));
        }

        case 'still': {
            const result: RestWatchResult = {
                ...emptyWatchResult(),
                title: 'A STILL HOUR',
                body: 'No wind, no stirring, the lake flat as a held breath. The night gives one hour back, free. +1 comfort.',
                comfortDelta: 1,
            };
            return setPending(applyWatchDeltas(s, result), pendingResult(s, 'still', result));
        }
    }
}

function setPending(s: RestSession, pending: RestPendingWatch): RestSession {
    return { ...s, phase: 'watch', pending };
}

function pendingResult(
    s: RestSession,
    kind: RestPendingWatch['kind'],
    result: RestWatchResult,
): RestPendingWatch {
    return {
        watch: s.watch,
        kind,
        title: result.title,
        body: result.body,
        options: [],
        result,
    };
}

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

/** watch → watch. Resolves the open card's picked option. */
export function chooseRestOption(s: RestSession, optionId: string): RestSession {
    if (s.phase !== 'watch' || s.pending === null || s.pending.result !== null) return s;
    const option = s.pending.options.find(o => o.id === optionId);
    if (!option || option.disabledReason) return s;

    if (s.pending.kind === 'embers') {
        const result: RestWatchResult = optionId === 'feed'
            ? {
                ...emptyWatchResult(),
                title: 'FED AND BRIGHT',
                body: 'The new log catches with a crack like agreement. The circle of light takes its inch back, with interest.',
                woodDelta: -1,
                warmthDelta: 1,
            }
            : {
                ...emptyWatchResult(),
                title: 'THE WOOD IS SPARED',
                body: 'The fire makes do, sulking down to a red eye. Cold pools at the edges of the blanket.',
                warmthDelta: -1,
            };
        return { ...applyWatchDeltas(s, result), pending: { ...s.pending, options: [], result } };
    }

    if (s.pending.kind === 'dream' && s.pending.dreamId) {
        const dream = getRestDreamDef(s.pending.dreamId);
        const result: RestWatchResult = optionId === 'hold'
            ? {
                ...emptyWatchResult(),
                title: 'HELD',
                body: 'He folds the dream small and puts it where the waking world cannot reach. It will keep.',
                keepsake: dream.keepsake,
            }
            : {
                ...emptyWatchResult(),
                title: 'LET GO',
                body: 'He lets it slide away the way dreams want to go, and keeps only the warmth of having had it. +1 comfort.',
                comfortDelta: 1,
            };
        return { ...applyWatchDeltas(s, result), pending: { ...s.pending, options: [], result } };
    }

    return s;
}

// ---------------------------------------------------------------------------
// Continuing & dawn
// ---------------------------------------------------------------------------

/** watch → watch | outcome. Acknowledges the card; dawn after the last. */
export function continueRestWatch(s: RestSession): RestSession {
    if (s.phase !== 'watch' || s.pending === null || s.pending.result === null) return s;
    const cleared = { ...s, pending: null };
    if (cleared.watch < T.watchesPerNight) {
        return openWatch({ ...cleared, watch: cleared.watch + 1 });
    }
    return dawn(cleared);
}

function dawn(s: RestSession): RestSession {
    const posture = getRestPostureDef(s.posture ?? 'doze');
    const raw =
        posture.baseHeal +
        s.warmth * T.healPerWarmth +
        s.comfort * T.healPerComfort;
    const healFraction = Math.max(0, Math.min(1, raw * s.baseHealFraction));

    let tier: RestOutcomeTier;
    if (healFraction >= T.restoredAt) tier = 'restored';
    else if (healFraction >= T.restedAt) tier = 'rested';
    else tier = 'meagre';

    const outcome: RestOutcome = {
        tier,
        healFraction,
        cleansed: s.warmth >= T.cleanseWarmth,
        warmth: s.warmth,
        comfort: s.comfort,
        keepsakes: s.keepsakes,
    };
    return { ...s, outcome, phase: 'outcome' };
}

/** outcome → done. The host applies the outcome and seals the night. */
export function claimRestOutcome(s: RestSession): RestSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
