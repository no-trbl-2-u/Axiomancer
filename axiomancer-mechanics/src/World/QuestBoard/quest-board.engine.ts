/**
 * Quest Board minigame — pure engine transitions.
 *
 * Every transition is `(session, …) → session` and threads explicit
 * RNG state; a session is fully reproducible from its seed. Invalid
 * calls (wrong phase, unknown ids, disabled options) return the input
 * session unchanged — the host never needs try/catch around play.
 *
 * State machine:
 *
 *   intro ──beginQuestBoard──▶ idle ──rollQuestBone──▶ space
 *     ▲                          │  ▲                    │
 *     │                          │  └─continueQuestSpace─┤ (stretches left)
 *   create                       │ ◀──acknowledgeQuestDusk    │
 *                                │        ▲                   │
 *                                │       dusk ◀───────────────┤ (day spent / collapse)
 *                                │                            │
 *                                └──▶ outcome ◀───────────────┘ (boat complete)
 *                                        │
 *                              claimQuestBoardCompletion
 *                                        ▼
 *                                      done
 *
 * The boat completes when every required part has been FITTED, and
 * fitting happens only when the piece lands on or passes the slipway
 * (space 0) moving forward — the plan always routes back through the
 * place boats are born.
 */

import {
    getQuestBoardDef,
    getQuestCharmDef,
    QUEST_BOARD_CHARMS,
    QUEST_BOARD_VOWS,
    getQuestVowDef,
} from './quest-board.content';
import { QUEST_BOARD_TUNING } from './quest-board.tuning';
import {
    rollDie, seedRng, shuffle, nextFloat,
    type QuestBoardRngState,
} from './quest-board.rng';
import type { SeedInput } from '../seed';
import {
    EMPTY_PART_TALLY,
    QUEST_PART_KINDS,
    type QuestBoardDef,
    type QuestBoardMetrics,
    type QuestBoardOutcome,
    type QuestBoardSession,
    type QuestCharmId,
    type QuestCharmState,
    type QuestMarketOffer,
    type QuestOutcomeTier,
    type QuestParleyOption,
    type QuestPartTally,
    type QuestPendingSpace,
    type QuestSpaceDef,
    type QuestSpaceOption,
    type QuestSpaceResult,
    type QuestVowResult,
    type QuestVowStatus,
} from './quest-board.types';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const T = QUEST_BOARD_TUNING;

function emptyResult(): QuestSpaceResult {
    return {
        title: '',
        body: '',
        rolls: [],
        fishDelta: 0,
        vigorDelta: 0,
        partsDelta: {},
        windDelta: 0,
        slippedBack: 0,
    };
}

function addParts(tally: QuestPartTally, delta: Partial<QuestPartTally>): QuestPartTally {
    const next = { ...tally };
    for (const kind of QUEST_PART_KINDS) {
        next[kind] += delta[kind] ?? 0;
    }
    return next;
}

/** Applies a result's deltas to the session's resources (not position). */
function applyResultDeltas(s: QuestBoardSession, r: QuestSpaceResult): QuestBoardSession {
    const def = getQuestBoardDef(s.boardId);
    const fish = Math.max(0, s.fish + r.fishDelta);
    const vigor = Math.min(def.maxVigor, s.vigor + r.vigorDelta);
    const metrics: QuestBoardMetrics = {
        ...s.metrics,
        fishSpent: s.metrics.fishSpent + Math.max(0, -r.fishDelta),
        lowestVigor: Math.min(s.metrics.lowestVigor, vigor),
    };
    return {
        ...s,
        fish,
        vigor,
        parts: addParts(s.parts, r.partsDelta),
        wind: s.wind + r.windDelta,
        metrics,
    };
}

function consumeCharm(charms: QuestCharmState[], id: QuestCharmId): QuestCharmState[] {
    return charms.map(c => (c.id === id ? { ...c, primed: false, used: true } : c));
}

function isPrimed(s: QuestBoardSession, id: QuestCharmId): boolean {
    return s.charms.some(c => c.id === id && c.primed);
}

function spaceAt(def: QuestBoardDef, pos: number): QuestSpaceDef {
    return def.spaces[pos];
}

// ---------------------------------------------------------------------------
// Selectors / previews
// ---------------------------------------------------------------------------

/** The board definition behind a session. */
export function questBoardDefOf(s: QuestBoardSession): QuestBoardDef {
    return getQuestBoardDef(s.boardId);
}

/** Parts still missing from the hull (required − fitted). */
export function questPartsMissing(s: QuestBoardSession): QuestPartTally {
    const def = getQuestBoardDef(s.boardId);
    const out = { ...EMPTY_PART_TALLY };
    for (const kind of QUEST_PART_KINDS) {
        out[kind] = Math.max(0, def.partsRequired[kind] - s.fitted[kind]);
    }
    return out;
}

/** True when every required part has been fitted. */
export function questBoardComplete(s: QuestBoardSession): boolean {
    const missing = questPartsMissing(s);
    return QUEST_PART_KINDS.every(kind => missing[kind] === 0);
}

/**
 * Judges the session's dealt vows against current play.
 *
 * Mid-play, a vow reads 'kept' while it currently holds, 'broken' once
 * it can never hold again (the day passed, the floor was breached),
 * and 'active' while it could still go either way. After the finish
 * line every vow is judged kept/broken for the ledger.
 */
export function questVowResults(s: QuestBoardSession): QuestVowResult[] {
    const finished = s.outcome !== null || questBoardComplete(s);
    return s.vows.map(id => {
        const def = getQuestVowDef(id);
        const holds = vowHolds(id, s);
        let status: QuestVowStatus;
        if (finished) {
            status = holds ? 'kept' : 'broken';
        } else if (vowIrrecoverable(id, s)) {
            status = 'broken';
        } else {
            status = holds ? 'kept' : 'active';
        }
        return { id, name: def.name, desc: def.desc, status };
    });
}

/** A vow that can no longer be kept reads 'broken' even mid-play. */
function vowIrrecoverable(id: QuestVowResult['id'], s: QuestBoardSession): boolean {
    switch (id) {
        case 'swift-keel': return s.day > T.swiftKeelDay;
        case 'unbitten':   return s.metrics.lowestVigor < T.unbittenFloor;
        // fish / duels / tales can always still rise.
        default: return false;
    }
}

/** Outcome tier the current play would earn if the boat finished now. */
export function questBoardTierOf(s: QuestBoardSession): QuestOutcomeTier {
    if (s.outcome !== null) return s.outcome.tier;
    const vowsKept = questVowResults(s).filter(v => v.status !== 'broken').length;
    if (s.day <= T.masterworkMaxDays && vowsKept >= T.masterworkMinVows) return 'masterwork';
    if (s.day <= T.seaworthyMaxDays && vowsKept >= T.seaworthyMinVows) return 'seaworthy';
    return 'driftwood';
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function createQuestBoardSession(seed: SeedInput, boardId: string): QuestBoardSession {
    const def = getQuestBoardDef(boardId); // throws on unknown board
    let rng: QuestBoardRngState = seedRng(seed);

    const charmsDraw = shuffle(rng, QUEST_BOARD_CHARMS.map(c => c.id));
    rng = charmsDraw.state;
    const charms: QuestCharmState[] = charmsDraw.value
        .slice(0, T.charmsDealt)
        .map(id => ({ id, used: false, primed: false }));

    const vowsDraw = shuffle(rng, QUEST_BOARD_VOWS.map(v => v.id));
    rng = vowsDraw.state;
    const vows = vowsDraw.value.slice(0, T.vowsDealt);

    return {
        boardId: def.id,
        phase: 'intro',
        pos: 0,
        day: 1,
        stretch: 0,
        fish: def.startFish,
        vigor: def.startVigor,
        parts: { ...EMPTY_PART_TALLY },
        fitted: { ...EMPTY_PART_TALLY },
        lastRoll: null,
        pending: null,
        charms,
        vows,
        wind: 0,
        collapsedToday: false,
        metrics: {
            rolls: 0,
            duelsWon: 0,
            duelsLost: 0,
            snagsSuffered: 0,
            fishSpent: 0,
            talesHeard: 0,
            collapses: 0,
            lowestVigor: def.startVigor,
        },
        outcome: null,
        seed,
        rng,
    };
}

/** intro → idle. */
export function beginQuestBoard(s: QuestBoardSession): QuestBoardSession {
    if (s.phase !== 'intro') return s;
    return { ...s, phase: 'idle' };
}

// ---------------------------------------------------------------------------
// Charms
// ---------------------------------------------------------------------------

/**
 * Primes a one-use charm. Only in 'idle' (between rolls); the effect
 * stays primed until its trigger consumes it (a roll, a duel, a snag,
 * a gather).
 */
export function useQuestCharm(s: QuestBoardSession, id: QuestCharmId): QuestBoardSession {
    if (s.phase !== 'idle') return s;
    const charm = s.charms.find(c => c.id === id);
    if (!charm || charm.used || charm.primed) return s;
    getQuestCharmDef(id); // throws on unknown id
    return {
        ...s,
        charms: s.charms.map(c => (c.id === id ? { ...c, primed: true } : c)),
    };
}

// ---------------------------------------------------------------------------
// The roll (movement + slipway fitting + space arrival)
// ---------------------------------------------------------------------------

/**
 * idle → space | outcome. Casts the bone die, applies wind and primed
 * roll-charms, advances the piece, fits carried parts when the move
 * lands on or crosses the slipway, and opens the arrival space.
 */
export function rollQuestBone(s: QuestBoardSession): QuestBoardSession {
    if (s.phase !== 'idle' || s.outcome !== null) return s;
    const def = getQuestBoardDef(s.boardId);
    let rng = s.rng;
    let charms = s.charms;

    // Die — GULL FEATHER rolls twice, keeps the higher.
    let die: number;
    {
        const first = rollDie(rng);
        rng = first.state;
        die = first.value;
        if (isPrimed(s, 'gull-feather')) {
            const second = rollDie(rng);
            rng = second.state;
            die = Math.max(die, second.value);
            charms = consumeCharm(charms, 'gull-feather');
        }
    }

    // Bonus — banked wind plus THE FRIEND'S WHISTLE.
    let bonus = s.wind;
    if (charms.some(c => c.id === 'friends-whistle' && c.primed)) {
        bonus += 2;
        charms = consumeCharm(charms, 'friends-whistle');
    }
    const total = die + bonus;

    // Movement. Crossing or landing on space 0 (the slipway) fits
    // carried parts onto the hull.
    const len = def.spaces.length;
    const rawTarget = s.pos + total;
    const crossedSlipway = rawTarget >= len;
    const pos = rawTarget % len;

    let fitted = s.fitted;
    let parts = s.parts;
    if (crossedSlipway || pos === 0) {
        const next = fitCarriedParts(def, parts, fitted);
        fitted = next.fitted;
        parts = next.parts;
    }

    const moved: QuestBoardSession = {
        ...s,
        rng,
        charms,
        pos,
        parts,
        fitted,
        wind: 0,
        stretch: s.stretch + 1,
        lastRoll: { die, bonus, total },
        metrics: { ...s.metrics, rolls: s.metrics.rolls + 1 },
    };

    // The boat may now be complete — outcome pre-empts the arrival space.
    if (questBoardComplete(moved)) {
        return finishQuestBoard({ ...moved, pos: 0 });
    }

    return arriveAtSpace(moved);
}

function fitCarriedParts(
    def: QuestBoardDef,
    parts: QuestPartTally,
    fitted: QuestPartTally,
): { parts: QuestPartTally; fitted: QuestPartTally } {
    const nextParts = { ...parts };
    const nextFitted = { ...fitted };
    for (const kind of QUEST_PART_KINDS) {
        const need = Math.max(0, def.partsRequired[kind] - nextFitted[kind]);
        const fit = Math.min(need, nextParts[kind]);
        nextFitted[kind] += fit;
        nextParts[kind] -= fit;
    }
    return { parts: nextParts, fitted: nextFitted };
}

// ---------------------------------------------------------------------------
// Space arrival (build the pending interaction)
// ---------------------------------------------------------------------------

function arriveAtSpace(s: QuestBoardSession): QuestBoardSession {
    const def = getQuestBoardDef(s.boardId);
    const space = spaceAt(def, s.pos);

    switch (space.kind) {
        case 'slipway': {
            // Landing exactly: parts already fitted by the move. The card
            // just reports the state of the hull.
            const missing = questPartsMissing(s);
            const missingLines = QUEST_PART_KINDS
                .filter(k => missing[k] > 0)
                .map(k => `${missing[k]} × ${def.partNames[k]}`);
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: 'THE KEEL TAKES SHAPE',
                body: missingLines.length > 0
                    ? `Everything carried is fitted and pegged. Still wanting: ${missingLines.join(', ')}.`
                    : 'Nothing left to fit. She only wants water now.',
            };
            return openSpace(s, space, [], result);
        }

        case 'gather': {
            // Press-your-luck: wade deeper for more, or bank the wet haul.
            return openSpace(s, space, gatherOptions(def, space, 0, 0), null, {
                haul: 0,
                presses: 0,
            });
        }

        case 'duel': {
            // Best-of-1, but you allocate GRIT (vigor) before the single
            // cast — each grit buys +1 on your die. The only space that
            // asks you to price a roll before you make it.
            const d = space.duel;
            const locketBonus = isPrimed(s, 'mothers-locket') ? 2 : 0;
            const spoils = `+${d.spoils.count} ${def.partNames[d.spoils.part]}`;
            const options: QuestSpaceOption[] = [];
            for (let grit = 0; grit <= T.duelMaxGrit; grit++) {
                const vigCost = grit * T.duelGritVigor;
                const bonus = grit * T.duelGritBonus + locketBonus;
                options.push({
                    id: `fight-${grit}`,
                    label: grit === 0 ? 'STAND AND FIGHT' : `DIG IN (+${grit} GRIT)`,
                    desc: `Your bone +${bonus} vs its tusk (+${d.foeBonus}).`
                        + (vigCost > 0 ? ` Spend ${vigCost} vigor.` : '')
                        + ` Win: ${spoils}. Lose: −${d.bite} vigor.`,
                    ...(s.vigor <= vigCost ? { disabledReason: 'Not enough vigor to dig in.' } : {}),
                });
            }
            if (d.bribeFish > 0) {
                options.push({
                    id: 'bribe',
                    label: 'TOSS IT A FISH',
                    desc: `−${d.bribeFish} fish to pass unbothered.`,
                    ...(s.fish < d.bribeFish
                        ? { disabledReason: 'Not enough fish.' }
                        : {}),
                });
            }
            return openSpace(s, space, options, null);
        }

        case 'snag': {
            const n = space.snag;
            // TAR-SOAKED TWINE crosses clean without a roll.
            if (isPrimed(s, 'tar-twine')) {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'THE TWINE HOLDS',
                    body: 'Lashed, tied, and trusted — the bad ground passes underfoot like a rumor about somebody else.',
                };
                return openSpace(
                    { ...s, charms: consumeCharm(s.charms, 'tar-twine') },
                    space, [], result,
                );
            }
            // Insurance ladder: cross bare (free, risky), BRACE (cheap,
            // safer — spends a hoarded resource), or detour (dear, certain).
            const braced = Math.max(1, n.threshold - T.snagBraceDrop);
            const options: QuestSpaceOption[] = [
                {
                    id: 'risk',
                    label: 'CHANCE IT',
                    desc: `Roll ${n.threshold}+ to cross clean. Fail: −${n.bite} vigor, slip back ${n.slipBack}.`,
                },
            ];
            if (s.wind >= T.snagBraceWind) {
                options.push({
                    id: 'brace-wind',
                    label: 'BRACE ON THE WIND',
                    desc: `Spend ${T.snagBraceWind} wind: cross on ${braced}+ instead.`,
                });
            }
            if (s.fish >= T.snagBraceFish) {
                options.push({
                    id: 'brace-fish',
                    label: 'BRACE WITH A ROPE',
                    desc: `−${T.snagBraceFish} fish: cross on ${braced}+ instead.`,
                });
            }
            if (n.detourFish > 0) {
                options.push({
                    id: 'detour',
                    label: 'THE LONG WAY ROUND',
                    desc: `−${n.detourFish} fish for the ferryman's path.`,
                    ...(s.fish < n.detourFish
                        ? { disabledReason: 'Not enough fish.' }
                        : {}),
                });
            }
            return openSpace(s, space, options, null);
        }

        case 'hearth': {
            // Light by design: REST is a one-tap heal; LINGER only appears
            // when it would actually help and you can pay for the meal.
            const rest = Math.min(space.hearth.vigor, def.maxVigor - s.vigor);
            const linger = Math.min(space.hearth.vigor + T.hearthLingerVigor, def.maxVigor - s.vigor);
            const options: QuestSpaceOption[] = [
                {
                    id: 'rest',
                    label: 'STEW AND SILENCE',
                    desc: rest > 0 ? `+${rest} vigor by the fire.` : 'Nothing aches yet — sit a while anyway.',
                },
            ];
            if (s.fish >= T.hearthLingerFish && linger > rest) {
                options.push({
                    id: 'linger',
                    label: 'LINGER FOR A HOT MEAL',
                    desc: `−${T.hearthLingerFish} fish, +${linger} vigor.`,
                });
            }
            return openSpace(s, space, options, null);
        }

        case 'market': {
            const purchases = space.market.offers.map(() => 0);
            return openSpace(s, space, marketOptions(s, space, purchases), null, {
                ledger: [],
                purchases,
            });
        }

        case 'parley': {
            const p = space.parley;
            const options: QuestSpaceOption[] = p.options.map(o => ({
                id: o.id,
                label: o.label,
                desc: o.desc,
                ...(s.fish < parleyFishNeeded(o)
                    ? { disabledReason: 'Not enough fish.' }
                    : {}),
            }));
            return openSpace(s, space, options, null);
        }

        case 'cache': {
            let rng = s.rng;
            const draw = nextFloat(rng);
            rng = draw.state;
            const finds = space.cache.finds;
            const totalWeight = finds.reduce((sum, f) => sum + f.weight, 0);
            let mark = draw.value * totalWeight;
            let find = finds[finds.length - 1];
            for (const f of finds) {
                mark -= f.weight;
                if (mark <= 0) { find = f; break; }
            }
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: 'SOMETHING UNDER THE BOARDS',
                body: find.label,
                fishDelta: find.fish ?? 0,
                vigorDelta: find.vigor ?? 0,
                partsDelta: find.parts ? { [find.parts.part]: find.parts.count } : {},
            };
            return openSpace({ ...s, rng }, space, [], result);
        }

        case 'omen': {
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: space.name,
                body: space.omen.lines.join('\n'),
                windDelta: space.omen.wind,
            };
            const tallied: QuestBoardSession = {
                ...s,
                metrics: { ...s.metrics, talesHeard: s.metrics.talesHeard + 1 },
            };
            return openSpace(tallied, space, [], result);
        }
    }
}

/** Current fish price of a market offer given how often it's been bought. */
function marketPrice(offer: QuestMarketOffer, bought: number): number {
    return offer.fishCost + bought * T.marketRamp;
}

/**
 * Fish a parley option needs in hand: the larger of what it spends and any
 * `requires.fish` gate (a full purse the NPC respects without taking it).
 */
function parleyFishNeeded(o: QuestParleyOption): number {
    const spent = (o.fish ?? 0) < 0 ? -(o.fish ?? 0) : 0;
    return Math.max(spent, o.requires?.fish ?? 0);
}

function marketOptions(
    s: QuestBoardSession,
    space: Extract<QuestSpaceDef, { kind: 'market' }>,
    purchases: readonly number[],
): QuestSpaceOption[] {
    const def = getQuestBoardDef(s.boardId);
    const options: QuestSpaceOption[] = space.market.offers.map((o, i) => {
        const bought = purchases[i] ?? 0;
        const price = marketPrice(o, bought);
        return {
            id: `offer-${i}`,
            label: `${o.count} × ${def.partNames[o.part]}`,
            desc: bought > 0 ? `−${price} fish (the stall has marked it up).` : `−${price} fish.`,
            ...(s.fish < price ? { disabledReason: 'Not enough fish.' } : {}),
        };
    });
    options.push({ id: 'leave', label: 'LEAVE THE ROW', desc: 'Pocket what remains and move on.' });
    return options;
}

/** Extra per-space interaction state carried on the pending card. */
interface OpenExtra {
    ledger?: readonly string[];
    purchases?: readonly number[];
    haul?: number;
    presses?: number;
}

/**
 * Opens the pending interaction. Result-only spaces apply their deltas
 * immediately (the card is acknowledgement, not a decision).
 */
function openSpace(
    s: QuestBoardSession,
    space: QuestSpaceDef,
    options: QuestSpaceOption[],
    result: QuestSpaceResult | null,
    extra?: OpenExtra,
): QuestBoardSession {
    const applied = result ? applyResultDeltas(s, result) : s;
    const pending: QuestPendingSpace = {
        spaceId: space.id,
        kind: space.kind,
        title: space.name,
        body: space.kind === 'parley' ? space.parley.prompt : space.flavor,
        options: result ? [] : options,
        result,
        ...extra,
    };
    return { ...applied, phase: 'space', pending };
}

/**
 * GATHER's press/stop menu, rebuilt after every press so the labels track
 * the growing wet haul and the spot running dry.
 */
function gatherOptions(
    def: QuestBoardDef,
    space: Extract<QuestSpaceDef, { kind: 'gather' }>,
    haul: number,
    presses: number,
): QuestSpaceOption[] {
    const g = space.gather;
    const part = def.partNames[g.part];
    const bust = g.bustFloor === 1 ? 'a 1' : `1–${g.bustFloor}`;
    const options: QuestSpaceOption[] = [];
    if (presses < g.maxPress) {
        options.push({
            id: 'press',
            label: presses === 0 ? 'WADE IN' : 'PRESS DEEPER',
            desc: `Cast the bone: ${g.bustFloor + 1}+ adds +${g.perPress} ${part} to the haul. ${bust} is the rogue wave — lose the ${haul} held, −${g.bustBite} vigor.`,
        });
    }
    options.push({
        id: 'stop',
        label: haul > 0 ? `BANK THE HAUL (${haul})` : 'LEAVE IT BE',
        desc: haul > 0
            ? `Carry off +${haul} ${part}, dry and certain.`
            : 'Wade back out empty-handed. Nothing risked.',
    });
    return options;
}

// ---------------------------------------------------------------------------
// Choosing on an open space
// ---------------------------------------------------------------------------

/**
 * space → space. Resolves the picked option into a result card (or,
 * for the market, applies the purchase and keeps the stalls open).
 */
export function chooseQuestSpaceOption(s: QuestBoardSession, optionId: string): QuestBoardSession {
    if (s.phase !== 'space' || s.pending === null || s.pending.result !== null) return s;
    const def = getQuestBoardDef(s.boardId);
    const space = def.spaces.find(sp => sp.id === s.pending!.spaceId);
    if (!space) return s;
    const option = s.pending.options.find(o => o.id === optionId);
    if (!option || option.disabledReason) return s;

    switch (space.kind) {
        case 'gather': {
            const g = space.gather;
            const haul = s.pending.haul ?? 0;
            const presses = s.pending.presses ?? 0;

            if (optionId === 'stop') {
                // Bank the wet haul. LUCKY HOOK doubles it on the way out.
                const hooked = isPrimed(s, 'lucky-hook');
                const next = hooked ? { ...s, charms: consumeCharm(s.charms, 'lucky-hook') } : s;
                const banked = haul * (hooked ? 2 : 1);
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: haul > 0 ? 'THE HAUL COMES HOME DRY' : 'NOTHING VENTURED',
                    body: haul > 0
                        ? `${hooked ? 'The lucky hook all but doubles it. ' : ''}+${banked} ${def.partNames[g.part]}, banked before the tide could change its mind.`
                        : 'He weighs the water, thinks better of it, and walks on with dry boots.',
                    partsDelta: banked > 0 ? { [g.part]: banked } : {},
                };
                return settleResult(next, result);
            }
            if (optionId !== 'press' || presses >= g.maxPress) return s;

            const roll = rollDie(s.rng);
            const next: QuestBoardSession = { ...s, rng: roll.state };
            if (roll.value <= g.bustFloor) {
                // The rogue wave — the unbanked haul is forfeit.
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'THE ROGUE WAVE',
                    body: `The sea takes it all back at once — ${haul} ${def.partNames[g.part]} gone in the undertow, −${g.bustBite} vigor with it.`,
                    rolls: [roll.value],
                    vigorDelta: -g.bustBite,
                };
                return settleResult(next, result);
            }
            // A good press — the haul grows; the menu reopens.
            const nextHaul = haul + g.perPress;
            const nextPresses = presses + 1;
            const pending: QuestPendingSpace = {
                ...s.pending,
                options: gatherOptions(def, space, nextHaul, nextPresses),
                haul: nextHaul,
                presses: nextPresses,
            };
            return { ...next, pending };
        }

        case 'duel': {
            const d = space.duel;
            if (optionId === 'bribe') {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'TRIBUTE PAID',
                    body: `${d.foe} accepts the toll with bad grace, which is its only kind. −${d.bribeFish} fish.`,
                    fishDelta: -d.bribeFish,
                };
                return settleResult(s, result);
            }
            // fight-<grit>: the grit is committed (vigor spent) before the
            // single cast, win or lose.
            if (!optionId.startsWith('fight-')) return s;
            const grit = Number(optionId.slice('fight-'.length));
            if (!Number.isInteger(grit) || grit < 0 || grit > T.duelMaxGrit) return s;
            const gritVigor = grit * T.duelGritVigor;
            if (s.vigor <= gritVigor) return s;

            let next = s;
            let yourBonus = grit * T.duelGritBonus;
            if (isPrimed(next, 'mothers-locket')) {
                yourBonus += 2;
                next = { ...next, charms: consumeCharm(next.charms, 'mothers-locket') };
            }
            const yours = rollDie(next.rng);
            const theirs = rollDie(yours.state);
            next = { ...next, rng: theirs.state };
            const yourTotal = yours.value + yourBonus;
            const theirTotal = theirs.value + d.foeBonus;
            const gritNote = gritVigor > 0 ? ` (${gritVigor} vigor spent digging in)` : '';

            if (yourTotal > theirTotal) {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: `${d.foe} IS ROUTED`,
                    body: `It remembers urgent business elsewhere${gritNote}. The hoard is yours: +${d.spoils.count} ${def.partNames[d.spoils.part]}.`,
                    rolls: [yours.value, theirs.value],
                    partsDelta: { [d.spoils.part]: d.spoils.count },
                    vigorDelta: -gritVigor,
                };
                next = { ...next, metrics: { ...next.metrics, duelsWon: next.metrics.duelsWon + 1 } };
                return settleResult(next, result);
            }
            if (yourTotal === theirTotal) {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'A STANDOFF',
                    body: `Neither side blinks, so both pretend the whole thing was about something else${gritNote}. No spoils, no scars.`,
                    rolls: [yours.value, theirs.value],
                    vigorDelta: -gritVigor,
                };
                return settleResult(next, result);
            }
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: 'DRIVEN OFF',
                body: `${d.foe} holds the field and crows about it. −${d.bite + gritVigor} vigor.`,
                rolls: [yours.value, theirs.value],
                vigorDelta: -(d.bite + gritVigor),
            };
            next = { ...next, metrics: { ...next.metrics, duelsLost: next.metrics.duelsLost + 1 } };
            return settleResult(next, result);
        }

        case 'snag': {
            const n = space.snag;
            if (optionId === 'detour') {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'THE LONG WAY ROUND',
                    body: `Slower, dearer, dry. −${n.detourFish} fish.`,
                    fishDelta: -n.detourFish,
                };
                return settleResult(s, result);
            }
            // risk (bare) / brace-wind / brace-fish: pay the brace cost up
            // front, then roll against the (possibly lowered) threshold.
            let threshold = n.threshold;
            let preFish = 0;
            let preWind = 0;
            if (optionId === 'brace-wind') {
                if (s.wind < T.snagBraceWind) return s;
                preWind = T.snagBraceWind;
                threshold = Math.max(1, n.threshold - T.snagBraceDrop);
            } else if (optionId === 'brace-fish') {
                if (s.fish < T.snagBraceFish) return s;
                preFish = T.snagBraceFish;
                threshold = Math.max(1, n.threshold - T.snagBraceDrop);
            } else if (optionId !== 'risk') {
                return s;
            }
            const braced = preFish > 0 || preWind > 0;
            const roll = rollDie(s.rng);
            let next: QuestBoardSession = { ...s, rng: roll.state };
            if (roll.value >= threshold) {
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: 'CLEAN ACROSS',
                    body: braced
                        ? 'Braced and steady, the bad ground passes underfoot like a rumor about somebody else.'
                        : 'Quick feet and no witnesses. The bad ground keeps its tax for the next one through.',
                    rolls: [roll.value],
                    fishDelta: -preFish,
                    windDelta: -preWind,
                };
                return settleResult(next, result);
            }
            const def2 = getQuestBoardDef(next.boardId);
            const slippedPos = (next.pos - n.slipBack + def2.spaces.length) % def2.spaces.length;
            next = {
                ...next,
                pos: slippedPos,
                metrics: { ...next.metrics, snagsSuffered: next.metrics.snagsSuffered + 1 },
            };
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: 'TAKEN BY THE GROUND',
                body: `Skin, pride, and ground all lost at once. −${n.bite} vigor, back ${n.slipBack} spaces.`,
                rolls: [roll.value],
                fishDelta: -preFish,
                vigorDelta: -n.bite,
                windDelta: -preWind,
                slippedBack: n.slipBack,
            };
            return settleResult(next, result);
        }

        case 'market': {
            if (optionId === 'leave') {
                const ledger = s.pending.ledger ?? [];
                const result: QuestSpaceResult = {
                    ...emptyResult(),
                    title: ledger.length > 0 ? 'DEALINGS DONE' : 'JUST LOOKING',
                    body: ledger.length > 0
                        ? `The stalls part with: ${ledger.join('; ')}.`
                        : 'Three stalls watched him weigh his fish and walk on. They have seen worse manners.',
                };
                // Purchases were already applied; the leave card is a recap.
                const pending: QuestPendingSpace = { ...s.pending, options: [], result };
                return { ...s, pending };
            }
            const index = Number(optionId.replace('offer-', ''));
            const offer = space.market.offers[index];
            if (!offer) return s;
            const purchases = s.pending.purchases ?? space.market.offers.map(() => 0);
            const bought = purchases[index] ?? 0;
            const price = marketPrice(offer, bought);
            if (s.fish < price) return s;
            const purchase: QuestSpaceResult = {
                ...emptyResult(),
                title: '',
                body: '',
                fishDelta: -price,
                partsDelta: { [offer.part]: offer.count },
            };
            const paid = applyResultDeltas(s, purchase);
            const nextPurchases = purchases.map((c, i) => (i === index ? c + 1 : c));
            const ledger = [
                ...(s.pending.ledger ?? []),
                `${offer.count} × ${def.partNames[offer.part]} for ${price} fish`,
            ];
            const pending: QuestPendingSpace = {
                ...s.pending,
                options: marketOptions(paid, space, nextPurchases),
                ledger,
                purchases: nextPurchases,
            };
            return { ...paid, pending };
        }

        case 'hearth': {
            const h = space.hearth;
            if (optionId === 'rest') {
                const heal = Math.min(h.vigor, def.maxVigor - s.vigor);
                return settleResult(s, {
                    ...emptyResult(),
                    title: 'STEW AND SILENCE',
                    body: heal > 0
                        ? `The fire does its old work. +${heal} vigor.`
                        : 'Nothing aches yet. The fire keeps its counsel for later.',
                    vigorDelta: heal,
                });
            }
            if (optionId === 'linger') {
                if (s.fish < T.hearthLingerFish) return s;
                const heal = Math.min(h.vigor + T.hearthLingerVigor, def.maxVigor - s.vigor);
                return settleResult(s, {
                    ...emptyResult(),
                    title: 'A HOT MEAL AND A LONG SIT',
                    body: `He stays for seconds, and the fire pays him back. −${T.hearthLingerFish} fish, +${heal} vigor.`,
                    vigorDelta: heal,
                    fishDelta: -T.hearthLingerFish,
                });
            }
            return s;
        }

        case 'parley': {
            const authored = space.parley.options.find(o => o.id === optionId);
            if (!authored || s.fish < parleyFishNeeded(authored)) return s;
            const result: QuestSpaceResult = {
                ...emptyResult(),
                title: space.parley.npc,
                body: authored.outcome,
                fishDelta: authored.fish ?? 0,
                vigorDelta: authored.vigor ?? 0,
                partsDelta: authored.parts ? { [authored.parts.part]: authored.parts.count } : {},
                windDelta: authored.wind ?? 0,
            };
            const next: QuestBoardSession = {
                ...s,
                metrics: { ...s.metrics, talesHeard: s.metrics.talesHeard + 1 },
            };
            return settleResult(next, result);
        }

        // slipway / cache / omen are result-only; no options to choose.
        default:
            return s;
    }
}

/** Applies a freshly-resolved result and closes the options. */
function settleResult(s: QuestBoardSession, result: QuestSpaceResult): QuestBoardSession {
    if (s.pending === null) return s;
    const applied = applyResultDeltas(s, result);
    const pending: QuestPendingSpace = { ...s.pending, options: [], result };
    return { ...applied, pending };
}

// ---------------------------------------------------------------------------
// Continuing (space → idle | dusk | outcome)
// ---------------------------------------------------------------------------

/**
 * space → idle | dusk | outcome. Acknowledges the result card; vigor
 * collapse or a spent day brings dusk, otherwise play returns to the
 * bone die.
 */
export function continueQuestSpace(s: QuestBoardSession): QuestBoardSession {
    if (s.phase !== 'space' || s.pending === null || s.pending.result === null) return s;
    const def = getQuestBoardDef(s.boardId);
    const cleared: QuestBoardSession = { ...s, pending: null };

    // Collapse: vigor spent to nothing. The day ends early; the Boy is
    // walked home and fed. Never a fail state — the quest cannot be lost.
    if (cleared.vigor <= 0) {
        const recovered = Math.max(1, Math.floor(def.maxVigor * T.collapseRecoverFraction));
        return {
            ...cleared,
            vigor: recovered,
            collapsedToday: true,
            metrics: { ...cleared.metrics, collapses: cleared.metrics.collapses + 1 },
            phase: 'dusk',
        };
    }

    if (cleared.stretch >= T.stretchesPerDay) {
        return { ...cleared, phase: 'dusk' };
    }

    return { ...cleared, phase: 'idle' };
}

/** dusk → idle. A new day: supper restores a little vigor. */
export function acknowledgeQuestDusk(s: QuestBoardSession): QuestBoardSession {
    if (s.phase !== 'dusk') return s;
    const def = getQuestBoardDef(s.boardId);
    return {
        ...s,
        day: s.day + 1,
        stretch: 0,
        vigor: Math.min(def.maxVigor, s.vigor + T.duskVigor),
        collapsedToday: false,
        phase: 'idle',
    };
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

function finishQuestBoard(s: QuestBoardSession): QuestBoardSession {
    // The board is complete here, so questVowResults judges every vow
    // kept/broken — no 'active' survives the finish line.
    const finalVows = questVowResults(s);
    const vowsKept = finalVows.filter(v => v.status === 'kept').length;

    let tier: QuestOutcomeTier;
    if (s.day <= T.masterworkMaxDays && vowsKept >= T.masterworkMinVows) tier = 'masterwork';
    else if (s.day <= T.seaworthyMaxDays && vowsKept >= T.seaworthyMinVows) tier = 'seaworthy';
    else tier = 'driftwood';

    const outcome: QuestBoardOutcome = {
        tier,
        daysTaken: s.day,
        fishLeft: s.fish,
        vigorLeft: s.vigor,
        vows: finalVows,
        vowsKept,
        metrics: s.metrics,
    };
    return { ...s, pending: null, outcome, phase: 'outcome' };
}

function vowHolds(id: QuestVowResult['id'], s: QuestBoardSession): boolean {
    switch (id) {
        case 'swift-keel':     return s.day <= T.swiftKeelDay;
        case 'unbitten':       return s.metrics.lowestVigor >= T.unbittenFloor;
        case 'fed-larder':     return s.fish >= T.fedLarderFish;
        case 'gulls-bane':     return s.metrics.duelsWon >= T.gullsBaneWins;
        case 'tale-collector': return s.metrics.talesHeard >= T.taleCollectorCount;
    }
}

/**
 * outcome → done. The host claims the completion record (board id +
 * tier) and applies its cosmetic story effects (flags); the engine
 * just seals the session.
 */
export function claimQuestBoardCompletion(s: QuestBoardSession): QuestBoardSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
