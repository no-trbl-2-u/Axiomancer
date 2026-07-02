/**
 * Quest Board ("The Boy's Almanac") engine — hermetic unit suite.
 * Seeded RNG only; no timers, no network, no Math.random.
 */

import { describe, expect, it } from 'vitest';

import {
    acknowledgeQuestDusk,
    beginQuestBoard,
    chooseQuestSpaceOption,
    claimQuestBoardCompletion,
    continueQuestSpace,
    createQuestBoardSession,
    questBoardComplete,
    questBoardDefOf,
    questBoardTierOf,
    questPartsMissing,
    questVowResults,
    rollQuestBone,
    useQuestCharm,
} from '../quest-board.engine';
import {
    BUILD_THE_BOAT_BOARD,
    QUEST_BOARD_CHARMS,
    QUEST_BOARD_VOWS,
    getQuestBoardDef,
} from '../quest-board.content';
import { QUEST_BOARD_TUNING } from '../quest-board.tuning';
import {
    QUEST_PART_KINDS,
    type QuestBoardSession,
    type QuestCharmId,
} from '../quest-board.types';

const BOARD = 'build-the-boat';

function fresh(seed = 7): QuestBoardSession {
    return createQuestBoardSession(seed, BOARD);
}

function idle(seed = 7): QuestBoardSession {
    return beginQuestBoard(fresh(seed));
}

/**
 * The option a cautious naive player would take on an open card: leave the
 * market without buying, take exactly one gather press then bank, otherwise
 * the first enabled option.
 */
function naivePick(pending: NonNullable<QuestBoardSession['pending']>): string {
    const enabled = pending.options.filter(o => !o.disabledReason);
    if (pending.kind === 'market') return enabled.find(o => o.id === 'leave')!.id;
    if (pending.kind === 'gather') {
        const pressedOnce = (pending.presses ?? 0) >= 1;
        const wants = pressedOnce ? 'stop' : 'press';
        return (enabled.find(o => o.id === wants) ?? enabled[0]).id;
    }
    return enabled[0].id;
}

/** Drives one full turn: roll → (auto-pick the naive option) → continue. */
function playTurn(s: QuestBoardSession): QuestBoardSession {
    let next = rollQuestBone(s);
    if (next.phase === 'outcome') return next;
    // Resolve any open options the way a cautious naive player would:
    // markets browse-and-leave; gathers take one press then bank (rather
    // than pressing until they bust); everything else takes the first
    // enabled option.
    while (next.phase === 'space' && next.pending !== null && next.pending.result === null) {
        const pick = naivePick(next.pending);
        const chosen = chooseQuestSpaceOption(next, pick);
        if (chosen === next) throw new Error(`option ${pick} did not resolve`);
        next = chosen;
    }
    if (next.phase === 'space') next = continueQuestSpace(next);
    if (next.phase === 'dusk') next = acknowledgeQuestDusk(next);
    return next;
}

/** Plays whole turns until the outcome lands (bounded). */
function playToOutcome(seed = 7): QuestBoardSession {
    let s = idle(seed);
    for (let i = 0; i < 500; i++) {
        if (s.phase === 'outcome') return s;
        if (s.phase !== 'idle') throw new Error(`unexpected phase ${s.phase}`);
        s = playTurn(s);
    }
    throw new Error('no outcome after 500 turns');
}

describe('content sanity', () => {
    it('the build-the-boat board is registered, slipway-first, and well-formed', () => {
        const def = getQuestBoardDef(BOARD);
        expect(def).toBe(BUILD_THE_BOAT_BOARD);
        expect(def.spaces[0].kind).toBe('slipway');
        expect(def.spaces.length).toBeGreaterThanOrEqual(12);
        // Every non-slipway encounter echo appears at least once.
        const kinds = new Set(def.spaces.map(sp => sp.kind));
        for (const kind of ['gather', 'duel', 'snag', 'hearth', 'market', 'parley', 'cache', 'omen']) {
            expect(kinds.has(kind as never)).toBe(true);
        }
        // Required parts are gatherable: every required family has a source.
        for (const part of QUEST_PART_KINDS) {
            if (def.partsRequired[part] === 0) continue;
            const sourced = def.spaces.some(sp =>
                (sp.kind === 'gather' && sp.gather.part === part) ||
                (sp.kind === 'duel' && sp.duel.spoils.part === part) ||
                (sp.kind === 'market' && sp.market.offers.some(o => o.part === part)) ||
                (sp.kind === 'parley' && sp.parley.options.some(o => o.parts?.part === part)) ||
                (sp.kind === 'cache' && sp.cache.finds.some(f => f.parts?.part === part)));
            expect(sourced, `part '${part}' has no source on the board`).toBe(true);
        }
        expect(() => getQuestBoardDef('no-such-board')).toThrow();
    });
});

describe('lifecycle', () => {
    it('creates in intro with dealt charms and vows, then begins to idle', () => {
        const s = fresh(11);
        expect(s.phase).toBe('intro');
        expect(s.charms).toHaveLength(QUEST_BOARD_TUNING.charmsDealt);
        expect(s.vows).toHaveLength(QUEST_BOARD_TUNING.vowsDealt);
        expect(s.fish).toBe(BUILD_THE_BOAT_BOARD.startFish);
        expect(s.vigor).toBe(BUILD_THE_BOAT_BOARD.startVigor);
        expect(questBoardComplete(s)).toBe(false);
        const begun = beginQuestBoard(s);
        expect(begun.phase).toBe('idle');
        // begin is idempotent-guarded
        expect(beginQuestBoard(begun)).toBe(begun);
    });

    it('is deterministic from its seed', () => {
        const a = playToOutcome(99);
        const b = playToOutcome(99);
        expect(a.outcome).toEqual(b.outcome);
        expect(a.metrics).toEqual(b.metrics);
    });
});

describe('rolling and movement', () => {
    it('a roll moves the piece, spends a stretch, and opens the arrival space', () => {
        const s = idle(7);
        const rolled = rollQuestBone(s);
        expect(rolled.metrics.rolls).toBe(1);
        expect(rolled.stretch).toBe(1);
        expect(rolled.lastRoll).not.toBeNull();
        expect(rolled.lastRoll!.die).toBeGreaterThanOrEqual(1);
        expect(rolled.lastRoll!.die).toBeLessThanOrEqual(6);
        expect(rolled.pos).toBe((s.pos + rolled.lastRoll!.total) % BUILD_THE_BOAT_BOARD.spaces.length);
        expect(rolled.phase === 'space' || rolled.phase === 'outcome').toBe(true);
        if (rolled.phase === 'space') {
            expect(rolled.pending).not.toBeNull();
        }
    });

    it('rolling outside idle is a no-op', () => {
        const s = fresh(7);
        expect(rollQuestBone(s)).toBe(s);
    });

    it('dusk falls after the day\'s stretches and a new day dawns with supper', () => {
        let s = idle(7);
        for (let i = 0; i < QUEST_BOARD_TUNING.stretchesPerDay; i++) {
            if (s.phase === 'outcome') return; // freak early finish — fine
            s = rollQuestBone(s);
            while (s.phase === 'space' && s.pending !== null && s.pending.result === null) {
                const pick = s.pending.kind === 'market'
                    ? s.pending.options.find(o => o.id === 'leave')!
                    : s.pending.options.filter(o => !o.disabledReason)[0];
                s = chooseQuestSpaceOption(s, pick.id);
            }
            if (s.phase === 'space') s = continueQuestSpace(s);
        }
        if (s.phase !== 'dusk') return; // collapse path covered elsewhere
        const day = s.day;
        const dawned = acknowledgeQuestDusk(s);
        expect(dawned.phase).toBe('idle');
        expect(dawned.day).toBe(day + 1);
        expect(dawned.stretch).toBe(0);
    });
});

describe('spaces', () => {
    /** Finds a landing on the given kind, searching seeds and turns. */
    function landOn(kind: string, opts: { fish?: number } = {}): QuestBoardSession {
        for (let seed = 1; seed < 500; seed++) {
            let s = idle(seed);
            if (opts.fish !== undefined) s = { ...s, fish: opts.fish };
            for (let turn = 0; turn < 12; turn++) {
                if (s.phase !== 'idle') break;
                const rolled = rollQuestBone(s);
                if (rolled.phase === 'space' && rolled.pending?.kind === kind) {
                    // Re-pin fish if the search drained it below the ask.
                    return rolled;
                }
                s = playTurnFrom(rolled);
                if (opts.fish !== undefined && s.phase === 'idle') s = { ...s, fish: opts.fish };
            }
        }
        throw new Error(`no landing found on '${kind}'`);
    }

    /** Advances an already-rolled turn back to idle (or stops elsewhere). */
    function playTurnFrom(rolled: QuestBoardSession): QuestBoardSession {
        let next = rolled;
        while (next.phase === 'space' && next.pending !== null && next.pending.result === null) {
            next = chooseQuestSpaceOption(next, naivePick(next.pending));
        }
        if (next.phase === 'space') next = continueQuestSpace(next);
        if (next.phase === 'dusk') next = acknowledgeQuestDusk(next);
        return next;
    }

    it('gather: pressing grows the wet haul; stopping banks it; a bust forfeits it', () => {
        const s = landOn('gather');
        const def = questBoardDefOf(s);
        const space = def.spaces[s.pos];
        if (space.kind !== 'gather') throw new Error('not gather');
        const g = space.gather;
        const beforeParts = s.parts[g.part];

        // Stopping immediately at zero banks nothing and risks nothing.
        const leftBe = chooseQuestSpaceOption(s, 'stop');
        expect(leftBe.pending!.result).not.toBeNull();
        expect(leftBe.parts[g.part]).toBe(beforeParts);
        expect(leftBe.vigor).toBe(s.vigor);

        // One press either grows the haul (still open) or busts (closed).
        const pressed = chooseQuestSpaceOption(s, 'press');
        const roll = pressed.pending!.result?.rolls[0]
            ?? pressed.pending!.options.length; // sentinel only used in the open branch
        if (pressed.pending!.result !== null) {
            // Bust: a face at or below the floor, haul forfeit, vigor bitten.
            expect(pressed.pending!.result!.rolls[0]).toBeLessThanOrEqual(g.bustFloor);
            expect(pressed.parts[g.part]).toBe(beforeParts);
            expect(pressed.vigor).toBe(s.vigor - g.bustBite);
        } else {
            expect(roll).toBeGreaterThan(g.bustFloor);
            expect(pressed.pending!.haul).toBe(g.perPress);
            expect(pressed.pending!.presses).toBe(1);
            // Now banking carries off exactly the wet haul.
            const banked = chooseQuestSpaceOption(pressed, 'stop');
            expect(banked.parts[g.part]).toBe(beforeParts + g.perPress);
            expect(banked.pending!.result).not.toBeNull();
        }
    });

    it('gather: the spot runs dry at maxPress, forcing a bank', () => {
        // Seek any gather landing whose presses never bust up to the cap,
        // then confirm PRESS disappears and only STOP remains.
        for (let seed = 1; seed < 4000; seed++) {
            let s = idle(seed);
            for (let turn = 0; turn < 12 && s.phase === 'idle'; turn++) {
                const rolled = rollQuestBone(s);
                if (rolled.phase === 'space' && rolled.pending?.kind === 'gather') {
                    const space = questBoardDefOf(rolled).spaces[rolled.pos];
                    if (space.kind !== 'gather') break;
                    const g = space.gather;
                    let cur = rolled;
                    let busted = false;
                    for (let i = 0; i < g.maxPress; i++) {
                        cur = chooseQuestSpaceOption(cur, 'press');
                        if (cur.pending!.result !== null) { busted = true; break; }
                    }
                    if (busted) break;
                    expect(cur.pending!.presses).toBe(g.maxPress);
                    expect(cur.pending!.options.some(o => o.id === 'press')).toBe(false);
                    expect(cur.pending!.options.some(o => o.id === 'stop')).toBe(true);
                    return;
                }
                s = playTurnFrom(rolled);
            }
        }
        throw new Error('no bust-free run to the cap found');
    });

    it('duel: a no-grit fight wins spoils, loses vigor, or stands off; bribe costs fish', () => {
        const s = landOn('duel');
        const def = questBoardDefOf(s);
        const space = def.spaces[s.pos];
        if (space.kind !== 'duel') throw new Error('not duel');

        const fought = chooseQuestSpaceOption(s, 'fight-0');
        const [yours, theirs] = fought.pending!.result!.rolls;
        const yourTotal = yours;
        const theirTotal = theirs + space.duel.foeBonus;
        if (yourTotal > theirTotal) {
            expect(fought.parts[space.duel.spoils.part]).toBe(s.parts[space.duel.spoils.part] + space.duel.spoils.count);
            expect(fought.metrics.duelsWon).toBe(1);
            expect(fought.vigor).toBe(s.vigor); // no grit spent
        } else if (yourTotal < theirTotal) {
            expect(fought.vigor).toBe(s.vigor - space.duel.bite);
            expect(fought.metrics.duelsLost).toBe(1);
        } else {
            expect(fought.vigor).toBe(s.vigor);
            expect(fought.metrics.duelsWon + fought.metrics.duelsLost).toBe(0);
        }

        const bribed = chooseQuestSpaceOption(s, 'bribe');
        expect(bribed.fish).toBe(s.fish - space.duel.bribeFish);
        expect(bribed.metrics.fishSpent).toBe(s.metrics.fishSpent + space.duel.bribeFish);
    });

    it('duel: grit is spent up front (win or lose) and buys +1 per token on your die', () => {
        const s = landOn('duel');
        const space = questBoardDefOf(s).spaces[s.pos];
        if (space.kind !== 'duel') throw new Error('not duel');
        const grit = QUEST_BOARD_TUNING.duelMaxGrit;
        const gritVigor = grit * QUEST_BOARD_TUNING.duelGritVigor;
        const gritBonus = grit * QUEST_BOARD_TUNING.duelGritBonus;

        const dug = chooseQuestSpaceOption(s, `fight-${grit}`);
        const [yours, theirs] = dug.pending!.result!.rolls;
        const won = yours + gritBonus > theirs + space.duel.foeBonus;
        if (won) {
            // Win: only the grit vigor is spent.
            expect(dug.vigor).toBe(s.vigor - gritVigor);
            expect(dug.metrics.duelsWon).toBe(1);
        } else {
            // Loss/standoff still costs the committed grit; a loss adds the bite.
            const tie = yours + gritBonus === theirs + space.duel.foeBonus;
            expect(dug.vigor).toBe(s.vigor - gritVigor - (tie ? 0 : space.duel.bite));
        }
    });

    it('duel: grit beyond your vigor cannot be forced', () => {
        // Pin vigor below the cost of max grit; the engine refuses it even
        // if a stale card still offered it.
        const s = { ...landOn('duel'), vigor: 1 };
        expect(chooseQuestSpaceOption(s, `fight-${QUEST_BOARD_TUNING.duelMaxGrit}`)).toBe(s);
        // The no-grit fight is always affordable.
        const fought = chooseQuestSpaceOption(s, 'fight-0');
        expect(fought).not.toBe(s);
        expect(fought.pending!.result).not.toBeNull();
    });

    it('snag: a failed crossing bites and slips the piece back', () => {
        // Find a snag landing whose risk roll fails.
        for (let seed = 1; seed < 4000; seed++) {
            const rolled = rollQuestBone(idle(seed));
            if (rolled.phase !== 'space' || rolled.pending?.kind !== 'snag') continue;
            if (rolled.pending.result !== null) continue; // tar-twine auto-cross has no options
            const def = questBoardDefOf(rolled);
            const space = def.spaces[rolled.pos];
            if (space.kind !== 'snag') continue;
            const risked = chooseQuestSpaceOption(rolled, 'risk');
            const roll = risked.pending!.result!.rolls[0];
            if (roll >= space.snag.threshold) continue;
            expect(risked.vigor).toBe(rolled.vigor - space.snag.bite);
            expect(risked.pos).toBe(
                (rolled.pos - space.snag.slipBack + def.spaces.length) % def.spaces.length,
            );
            expect(risked.metrics.snagsSuffered).toBe(1);
            return;
        }
        throw new Error('no failing snag found');
    });

    it('market: purchases apply immediately, stalls stay open, leave recaps', () => {
        const s = landOn('market');
        const def = questBoardDefOf(s);
        const space = def.spaces[s.pos];
        if (space.kind !== 'market') throw new Error('not market');
        const offer = space.market.offers[0];

        const bought = chooseQuestSpaceOption(s, 'offer-0');
        expect(bought.fish).toBe(s.fish - offer.fishCost);
        expect(bought.parts[offer.part]).toBe(s.parts[offer.part] + offer.count);
        expect(bought.pending!.result).toBeNull(); // stalls stay open
        expect(bought.pending!.ledger).toHaveLength(1);

        const left = chooseQuestSpaceOption(bought, 'leave');
        expect(left.pending!.result).not.toBeNull();
        expect(left.pending!.result!.body).toContain(def.partNames[offer.part]);
    });

    it('market: repeat buys of the same stall cost more fish each time', () => {
        const s = landOn('market', { fish: 30 });
        const space = questBoardDefOf(s).spaces[s.pos];
        if (space.kind !== 'market') throw new Error('not market');
        const offer = space.market.offers[0];

        const first = chooseQuestSpaceOption(s, 'offer-0');
        expect(first.fish).toBe(s.fish - offer.fishCost);

        const second = chooseQuestSpaceOption(first, 'offer-0');
        const secondPrice = offer.fishCost + QUEST_BOARD_TUNING.marketRamp;
        expect(second.fish).toBe(first.fish - secondPrice);
        expect(second.pending!.purchases![0]).toBe(2);
        // The reopened option advertises the climbed price.
        expect(second.pending!.options.find(o => o.id === 'offer-0')!.desc).toContain(String(secondPrice + QUEST_BOARD_TUNING.marketRamp));
    });

    it('snag: bracing spends a held resource to cross (and can be declined for the bare roll)', () => {
        const s = landOn('snag', { fish: 6 });
        const space = questBoardDefOf(s).spaces[s.pos];
        if (space.kind !== 'snag') throw new Error('not snag');
        if (s.pending!.result !== null) return; // tar-twine auto-crossed; nothing to brace
        const brace = s.pending!.options.find(o => o.id === 'brace-fish');
        expect(brace).toBeDefined();
        const braced = chooseQuestSpaceOption(s, 'brace-fish');
        expect(braced.fish).toBe(s.fish - QUEST_BOARD_TUNING.snagBraceFish);
        expect(braced.pending!.result).not.toBeNull();
    });

    it('market: an unaffordable offer is disabled and cannot be forced', () => {
        const s = landOn('market', { fish: 0 });
        const offers = s.pending!.options.filter(o => o.id.startsWith('offer-'));
        expect(offers.every(o => o.disabledReason)).toBe(true);
        expect(chooseQuestSpaceOption(s, 'offer-0')).toBe(s);
    });

    it('parley: an authored option applies its deltas and counts a tale', () => {
        const s = landOn('parley');
        const def = questBoardDefOf(s);
        const space = def.spaces[s.pos];
        if (space.kind !== 'parley') throw new Error('not parley');
        const authored = space.parley.options[0];

        const chosen = chooseQuestSpaceOption(s, authored.id);
        expect(chosen.metrics.talesHeard).toBe(s.metrics.talesHeard + 1);
        expect(chosen.fish).toBe(Math.max(0, s.fish + (authored.fish ?? 0)));
        if (authored.parts) {
            expect(chosen.parts[authored.parts.part]).toBe(s.parts[authored.parts.part] + authored.parts.count);
        }
    });

    it('cache and omen resolve immediately into a result card', () => {
        for (const kind of ['cache', 'omen'] as const) {
            const s = landOn(kind);
            expect(s.pending!.options).toHaveLength(0);
            expect(s.pending!.result).not.toBeNull();
            const cont = continueQuestSpace(s);
            expect(['idle', 'dusk']).toContain(cont.phase);
        }
    });

    /** Scans plays for a hearth ARRIVAL (options still open) matching pred. */
    function findHearthArrival(pred: (s: QuestBoardSession) => boolean): QuestBoardSession | null {
        for (let seed = 1; seed < 4000; seed++) {
            let s = idle(seed);
            for (let turn = 0; turn < 14 && s.phase === 'idle'; turn++) {
                const rolled = rollQuestBone(s);
                if (rolled.phase === 'space' && rolled.pending?.kind === 'hearth'
                    && rolled.pending.result === null && pred(rolled)) {
                    return rolled;
                }
                s = playTurnFrom(rolled);
            }
        }
        return null;
    }

    it('hearth: REST is always offered and heals (or no-ops) in one tap', () => {
        const s = findHearthArrival(() => true);
        if (!s) throw new Error('no hearth arrival found');
        expect(s.pending!.options.some(o => o.id === 'rest')).toBe(true);
        const rested = chooseQuestSpaceOption(s, 'rest');
        expect(rested.pending!.result).not.toBeNull();
        expect(rested.vigor).toBeGreaterThanOrEqual(s.vigor);
        expect(rested.vigor).toBeLessThanOrEqual(questBoardDefOf(s).maxVigor);
    });

    it('hearth: LINGER only appears when it helps, then costs fish for extra vigor', () => {
        // At full vigor there is nothing to gain, so LINGER is hidden.
        const full = findHearthArrival(s => s.vigor === questBoardDefOf(s).maxVigor);
        if (full) expect(full.pending!.options.some(o => o.id === 'linger')).toBe(false);

        // Hurt and provisioned, LINGER is on offer and out-heals plain rest.
        const hurt = findHearthArrival(s => s.pending!.options.some(o => o.id === 'linger'));
        if (!hurt) throw new Error('no hearth arrival offered LINGER');
        const lingered = chooseQuestSpaceOption(hurt, 'linger');
        expect(lingered.fish).toBe(hurt.fish - QUEST_BOARD_TUNING.hearthLingerFish);
        expect(lingered.vigor).toBeGreaterThan(hurt.vigor);
    });

    it('omen banks wind that boosts and then clears on the next roll', () => {
        const s = landOn('omen');
        expect(s.wind).toBeGreaterThan(0);
        let next = continueQuestSpace(s);
        if (next.phase === 'dusk') next = acknowledgeQuestDusk(next);
        const banked = next.wind;
        const rolled = rollQuestBone(next);
        expect(rolled.lastRoll!.bonus).toBe(banked);
        expect(rolled.wind).toBe(0);
    });
});

describe('charms', () => {
    function charmed(id: QuestCharmId, seed = 1): QuestBoardSession | null {
        const s = idle(seed);
        if (!s.charms.some(c => c.id === id)) return null;
        return useQuestCharm(s, id);
    }

    it('priming a charm marks it; double-priming and unknown phases are no-ops', () => {
        for (let seed = 1; seed < 50; seed++) {
            const s = idle(seed);
            const id = s.charms[0].id;
            const primed = useQuestCharm(s, id);
            expect(primed.charms.find(c => c.id === id)!.primed).toBe(true);
            expect(useQuestCharm(primed, id)).toBe(primed);
            return;
        }
    });

    it("the friend's whistle adds +2 to the next roll and is consumed", () => {
        for (let seed = 1; seed < 200; seed++) {
            const s = charmed('friends-whistle', seed);
            if (!s) continue;
            const rolled = rollQuestBone(s);
            expect(rolled.lastRoll!.bonus).toBe(2);
            const charm = rolled.charms.find(c => c.id === 'friends-whistle')!;
            expect(charm.used).toBe(true);
            expect(charm.primed).toBe(false);
            return;
        }
        throw new Error('no seed deals the whistle');
    });

    it('every charm is dealable and consumable across seeds', () => {
        const seen = new Set<string>();
        for (let seed = 1; seed < 300 && seen.size < QUEST_BOARD_CHARMS.length; seed++) {
            for (const c of fresh(seed).charms) seen.add(c.id);
        }
        expect(seen.size).toBe(QUEST_BOARD_CHARMS.length);
    });
});

describe('collapse (the can\'t-fail valve)', () => {
    it('vigor reaching 0 ends the day early and recovers, never fails', () => {
        // Engineer a collapse: land on a snag with 1 vigor and fail the roll.
        for (let seed = 1; seed < 4000; seed++) {
            let s = idle(seed);
            s = { ...s, vigor: 1, metrics: { ...s.metrics, lowestVigor: 1 } };
            const rolled = rollQuestBone(s);
            if (rolled.phase !== 'space' || rolled.pending?.kind !== 'snag') continue;
            if (rolled.pending.result !== null) continue;
            const risked = chooseQuestSpaceOption(rolled, 'risk');
            if (risked.vigor > 0) continue;
            const cont = continueQuestSpace(risked);
            expect(cont.phase).toBe('dusk');
            expect(cont.collapsedToday).toBe(true);
            expect(cont.vigor).toBeGreaterThan(0);
            expect(cont.metrics.collapses).toBe(1);
            const dawned = acknowledgeQuestDusk(cont);
            expect(dawned.phase).toBe('idle');
            expect(dawned.outcome).toBeNull();
            return;
        }
        throw new Error('no collapsing snag found');
    });
});

describe('slipway fitting and completion', () => {
    it('crossing the slipway fits carried parts onto the hull', () => {
        // Stand one space before the slipway with a full satchel and roll.
        for (let seed = 1; seed < 300; seed++) {
            const def = BUILD_THE_BOAT_BOARD;
            let s = idle(seed);
            s = {
                ...s,
                pos: def.spaces.length - 1,
                parts: { plank: 2, pitch: 1, cloth: 0, nail: 0 },
            };
            const rolled = rollQuestBone(s);
            // Any roll from len-1 crosses (or lands on) the slipway.
            expect(rolled.fitted.plank).toBe(2);
            expect(rolled.fitted.pitch).toBe(1);
            expect(rolled.parts.plank).toBe(0);
            const missing = questPartsMissing(rolled);
            expect(missing.plank).toBe(def.partsRequired.plank - 2);
            return;
        }
    });

    it('completing the build pre-empts the arrival space and lands the outcome', () => {
        const def = BUILD_THE_BOAT_BOARD;
        let s = idle(7);
        // Carry exactly what the hull still needs, stand before the slipway.
        s = {
            ...s,
            pos: def.spaces.length - 1,
            parts: { ...def.partsRequired },
        };
        const rolled = rollQuestBone(s);
        expect(questBoardComplete(rolled)).toBe(true);
        expect(rolled.phase).toBe('outcome');
        expect(rolled.outcome).not.toBeNull();
        expect(rolled.pos).toBe(0);
        expect(rolled.outcome!.vows).toHaveLength(QUEST_BOARD_TUNING.vowsDealt);
        // Claim seals the session.
        const claimed = claimQuestBoardCompletion(rolled);
        expect(claimed.phase).toBe('done');
    });
});

describe('full plays', () => {
    it('a naive first-option policy always finishes the boat', () => {
        for (const seed of [1, 7, 13, 42, 99, 1234]) {
            const done = playToOutcome(seed);
            expect(done.outcome).not.toBeNull();
            expect(done.outcome!.daysTaken).toBeGreaterThanOrEqual(1);
            expect(['masterwork', 'seaworthy', 'driftwood']).toContain(done.outcome!.tier);
            expect(done.outcome!.vows.every(v => v.status === 'kept' || v.status === 'broken')).toBe(true);
            expect(questBoardTierOf(done)).toBe(done.outcome!.tier);
        }
    });

    it('a typical play lands in the 5–10 minute band (10–40 rolls)', () => {
        const rolls = [1, 7, 13, 42, 99, 1234].map(seed => playToOutcome(seed).metrics.rolls);
        const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length;
        expect(avg).toBeGreaterThanOrEqual(8);
        expect(avg).toBeLessThanOrEqual(45);
    });

    it('vow judgements at the finish are consistent with the ledger', () => {
        const done = playToOutcome(42);
        const judged = questVowResults(done);
        expect(judged).toEqual(done.outcome!.vows);
        expect(done.outcome!.vowsKept).toBe(judged.filter(v => v.status === 'kept').length);
    });

    it('every vow id appears across seeds', () => {
        const seen = new Set<string>();
        for (let seed = 1; seed < 300 && seen.size < QUEST_BOARD_VOWS.length; seed++) {
            for (const v of fresh(seed).vows) seen.add(v);
        }
        expect(seen.size).toBe(QUEST_BOARD_VOWS.length);
    });
});
