/**
 * Rest ("The Night Watch") engine — hermetic unit suite. Seeded RNG
 * only; no timers, no network, no Math.random.
 */

import { describe, expect, it } from 'vitest';

import {
    chooseRestOption,
    chooseRestPosture,
    claimRestOutcome,
    continueRestWatch,
    createRestSession,
} from '../rest.engine';
import { REST_DREAMS, REST_POSTURES, REST_TUNING } from '../rest.content';
import type { RestPosture, RestSession } from '../rest.types';

function fresh(seed = 7, baseHeal = 1.0): RestSession {
    return createRestSession(seed, baseHeal);
}

/** Resolves the open watch by picking the first enabled option. */
function resolveWatch(s: RestSession, pick?: string): RestSession {
    let next = s;
    if (next.pending !== null && next.pending.result === null) {
        const enabled = next.pending.options.filter(o => !o.disabledReason);
        const id = pick && enabled.some(o => o.id === pick) ? pick : enabled[0].id;
        next = chooseRestOption(next, id);
    }
    return continueRestWatch(next);
}

/** Plays the whole night with a fixed posture and option policy. */
function playNight(seed: number, posture: RestPosture, pick?: string): RestSession {
    let s = chooseRestPosture(fresh(seed), posture);
    for (let i = 0; i < 10 && s.phase === 'watch'; i++) {
        s = resolveWatch(s, pick);
    }
    expect(s.phase).toBe('outcome');
    return s;
}

describe('lifecycle', () => {
    it('deals a night of watches and starts at posture', () => {
        const s = fresh(11);
        expect(s.phase).toBe('posture');
        expect(s.watchPlan).toHaveLength(REST_TUNING.watchesPerNight);
        expect(s.warmth).toBe(REST_TUNING.warmthStart);
        expect(s.wood).toBe(REST_TUNING.woodStart);
        expect(s.dreamQueue).toHaveLength(REST_DREAMS.length);
    });

    it('choosing a posture opens watch 1; wrong-phase calls are no-ops', () => {
        const s = fresh(7);
        expect(chooseRestOption(s, 'feed')).toBe(s);
        expect(continueRestWatch(s)).toBe(s);
        const lying = chooseRestPosture(s, 'doze');
        expect(lying.phase).toBe('watch');
        expect(lying.watch).toBe(1);
        expect(lying.pending).not.toBeNull();
        expect(chooseRestPosture(lying, 'deep')).toBe(lying);
    });

    it('is deterministic from its seed', () => {
        const a = playNight(99, 'doze');
        const b = playNight(99, 'doze');
        expect(a.outcome).toEqual(b.outcome);
    });
});

describe('watches', () => {
    function nightWith(kind: string, posture: RestPosture = 'doze'): RestSession {
        for (let seed = 1; seed < 500; seed++) {
            let s = chooseRestPosture(fresh(seed), posture);
            for (let w = 0; w < REST_TUNING.watchesPerNight && s.phase === 'watch'; w++) {
                if (s.pending?.kind === kind) return s;
                s = resolveWatch(s);
            }
        }
        throw new Error(`no '${kind}' watch found`);
    }

    it('embers: feeding spends wood for warmth; sparing chills', () => {
        const s = nightWith('embers');
        const fed = chooseRestOption(s, 'feed');
        expect(fed.wood).toBe(s.wood - 1);
        expect(fed.warmth).toBe(Math.min(REST_TUNING.warmthMax, s.warmth + 1));

        const spared = chooseRestOption(s, 'spare');
        expect(spared.wood).toBe(s.wood);
        expect(spared.warmth).toBe(Math.max(0, s.warmth - 1));
    });

    it('embers: with no wood the feed option is disabled and cannot be forced', () => {
        for (let seed = 1; seed < 500; seed++) {
            const broke = { ...fresh(seed), wood: 0 };
            const lying = chooseRestPosture(broke, 'doze');
            if (lying.pending?.kind !== 'embers') continue;
            const feed = lying.pending.options.find(o => o.id === 'feed')!;
            expect(feed.disabledReason).toBeTruthy();
            expect(chooseRestOption(lying, 'feed')).toBe(lying);
            return;
        }
        throw new Error('no first-watch embers found');
    });

    it('dream: holding mints the keepsake; fading takes comfort', () => {
        const s = nightWith('dream');
        const dream = REST_DREAMS.find(d => d.id === s.pending!.dreamId)!;

        const held = chooseRestOption(s, 'hold');
        expect(held.keepsakes).toContain(dream.keepsake);
        expect(held.comfort).toBe(s.comfort);

        const faded = chooseRestOption(s, 'fade');
        expect(faded.keepsakes).toEqual(s.keepsakes);
        expect(faded.comfort).toBe(s.comfort + 1);
    });

    it('stir: the watcher is never touched and finds a keepsake', () => {
        const s = nightWith('stir', 'watch');
        expect(s.pending!.result).not.toBeNull();
        expect(s.pending!.options).toHaveLength(0);
        expect(s.keepsakes.length).toBeGreaterThan(0);
        expect(s.comfort).toBeGreaterThanOrEqual(1);
    });

    it('stir: the deep sleeper pays warmth and comfort', () => {
        const s = nightWith('stir', 'deep');
        expect(s.pending!.result).not.toBeNull();
        expect(s.pending!.result!.warmthDelta).toBe(-1);
        expect(s.pending!.result!.comfortDelta).toBe(-1);
    });

    it('stir: the dozer rolls for it', () => {
        const s = nightWith('stir', 'doze');
        expect(s.pending!.result!.rolls).toHaveLength(1);
        const roll = s.pending!.result!.rolls[0];
        if (roll >= 4) expect(s.pending!.result!.comfortDelta).toBe(0);
        else expect(s.pending!.result!.comfortDelta).toBe(-1);
    });
});

describe('dawn', () => {
    it('the night always heals ≥ 0 and ≤ baseline, and richer postures heal more', () => {
        for (const seed of [1, 7, 42, 99]) {
            const heals = REST_POSTURES.map(p => playNight(seed, p.key).outcome!.healFraction);
            for (const h of heals) {
                expect(h).toBeGreaterThanOrEqual(0);
                expect(h).toBeLessThanOrEqual(1);
            }
        }
        // Same seed, same choices: deep ≥ doze ≥ watch on the posture base.
        const [deep, doze, watch] = (['deep', 'doze', 'watch'] as const)
            .map(p => playNight(7, p, 'fade').outcome!.healFraction);
        expect(deep).toBeGreaterThanOrEqual(doze);
        expect(doze).toBeGreaterThanOrEqual(watch);
    });

    it('baseHealFraction scales the whole night', () => {
        const full = playNight(7, 'doze').outcome!.healFraction;
        let s = chooseRestPosture(createRestSession(7, 0.5), 'doze');
        for (let i = 0; i < 10 && s.phase === 'watch'; i++) s = resolveWatch(s);
        expect(s.outcome!.healFraction).toBeCloseTo(full * 0.5, 10);
    });

    it('a warm fire cleanses; tiers follow the heal', () => {
        for (const seed of [1, 7, 13, 42, 99]) {
            const done = playNight(seed, 'deep', 'feed');
            const o = done.outcome!;
            expect(o.cleansed).toBe(o.warmth >= REST_TUNING.cleanseWarmth);
            if (o.healFraction >= REST_TUNING.restoredAt) expect(o.tier).toBe('restored');
            else if (o.healFraction >= REST_TUNING.restedAt) expect(o.tier).toBe('rested');
            else expect(o.tier).toBe('meagre');
        }
    });

    it('claim seals the night', () => {
        const done = playNight(7, 'doze');
        const claimed = claimRestOutcome(done);
        expect(claimed.phase).toBe('done');
        expect(claimRestOutcome(claimed)).toBe(claimed);
    });
});
