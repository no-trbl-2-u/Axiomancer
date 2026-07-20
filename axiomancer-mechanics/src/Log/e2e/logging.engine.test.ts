/**
 * Hermetic E2E — AXM Log (structured logging, docs/logging.md).
 *
 * Covers the logger contract end to end:
 *   - default OFF: engine chokepoints add ZERO entries (the perf guarantee)
 *   - enabling captures the combat event stream through `withLog` via a real
 *     seeded `simulateHazardPatternCombat` run
 *   - the game-store tap logs SANITIZED entries (no GameState in `data`)
 *   - `setSeed` records the replay key in the `rng` domain
 *   - ring rotation with honest `dropped` accounting, monotonic `seq`
 *   - level/domain/kind/sinceSeq filtering, `tail`
 *   - sink fan-out; a throwing sink neither throws nor starves other sinks
 */

import { describe, it, expect, afterEach } from 'vitest';

import { deepClone } from '../../Utils';
import { setSeed } from '../../Utils/rng';
import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { simulateHazardPatternCombat } from '../../Combat/combat.encounter.sim';
import { createGameStore } from '../../Game/store';
import { nullAdapter } from '../../Game/persistence/null.adapter';
import { createEventEmitter } from '../../Game/events';
import {
    createAxmLogger, getLogger, configureLogging, isLoggingEnabled,
    resetLoggingForTests,
} from '../index';
import type { AxmLogEntry } from '../index';

afterEach(() => {
    resetLoggingForTests();
});

function makePlayer(): Character {
    const p = deepClone(Player);
    p.knownCards = ['slippery-slope'];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200;
    p.maxHealth = 200;
    return p;
}

// ── The perf guarantee: disabled logging captures nothing ────────────────────

describe('AXM Log — disabled by default', () => {
    it('is off until configured and engine paths add zero entries', () => {
        expect(isLoggingEnabled()).toBe(false);
        setSeed(7);
        simulateHazardPatternCombat(makePlayer(), deepClone(GraveLarva), 1, 7);
        expect(getLogger().entries()).toHaveLength(0);
        expect(getLogger().stats().total).toBe(0);
    });

    it('disabling again stops capture immediately', () => {
        configureLogging({ enabled: true });
        setSeed(11);
        const captured = getLogger().stats().total;
        expect(captured).toBeGreaterThan(0);
        configureLogging({ enabled: false });
        setSeed(13);
        simulateHazardPatternCombat(makePlayer(), deepClone(GraveLarva), 1, 13);
        expect(getLogger().stats().total).toBe(captured);
    });
});

// ── Combat chokepoint (`withLog`) ────────────────────────────────────────────

describe('AXM Log — combat event stream', () => {
    it('mirrors CombatEvents from a seeded encounter into the combat domain', () => {
        configureLogging({ enabled: true, capacity: 5000 });
        simulateHazardPatternCombat(makePlayer(), deepClone(GraveLarva), 1, 42);
        const combat = getLogger().entries({ domains: ['combat'] });
        expect(combat.length).toBeGreaterThan(0);
        // Every entry mirrors a CombatEvent: kind matches the event's kind.
        for (const e of combat) {
            expect(e.level).toBe('debug');
            expect((e.data as { kind: string }).kind).toBe(e.kind);
        }
        // The stream contains turn structure, not just one event family.
        const kinds = new Set(combat.map(e => e.kind));
        expect(kinds.size).toBeGreaterThan(3);
    });
});

// ── Game-store tap (sanitizer contract) ──────────────────────────────────────

describe('AXM Log — game store events', () => {
    it('logs sanitized game events with no embedded GameState', () => {
        configureLogging({ enabled: true });
        const emitter = createEventEmitter();
        const store = createGameStore(nullAdapter, { player: makePlayer() }, emitter);
        store.getState().startCombat(deepClone(GraveLarva));

        const game = getLogger().entries({ domains: ['game'], minLevel: 'info' });
        const started = game.find(e => e.kind === 'combat:started');
        expect(started).toBeDefined();
        const data = started!.data as Record<string, unknown>;
        expect(data.action).toBe('START_COMBAT');
        // The sanitizer contract: never buffer the GameState.
        expect('state' in data).toBe(false);
        expect('player' in data).toBe(false);
        expect('world' in data).toBe(false);
    });

    it('traces dispatched actions at debug level', () => {
        configureLogging({ enabled: true });
        const store = createGameStore(nullAdapter, { player: makePlayer() });
        store.getState().startCombat(deepClone(GraveLarva));
        const actions = getLogger().entries({ domains: ['game'] })
            .filter(e => e.kind.startsWith('action:'));
        expect(actions.some(e => e.kind === 'action:START_COMBAT')).toBe(true);
    });
});

// ── RNG replay key ───────────────────────────────────────────────────────────

describe('AXM Log — rng domain', () => {
    it('records seed-set with the replay key', () => {
        configureLogging({ enabled: true });
        setSeed('witness-seed');
        const rng = getLogger().entries({ domains: ['rng'], kind: 'seed-set' });
        expect(rng).toHaveLength(1);
        const data = rng[0].data as { seed: string; numericSeed: number };
        expect(data.seed).toBe('witness-seed');
        expect(typeof data.numericSeed).toBe('number');
    });
});

// ── Ring buffer + filters + sinks (createAxmLogger unit surface) ─────────────

describe('AXM Log — ring buffer and filters', () => {
    it('rotates at capacity with honest dropped accounting and monotonic seq', () => {
        const logger = createAxmLogger({ capacity: 5 });
        for (let i = 0; i < 8; i++) logger.info('ui', `k${i}`);
        const entries = logger.entries();
        expect(entries).toHaveLength(5);
        expect(entries.map(e => e.kind)).toEqual(['k3', 'k4', 'k5', 'k6', 'k7']);
        const seqs = entries.map(e => e.seq);
        expect([...seqs].sort((a, b) => a - b)).toEqual(seqs);
        expect(logger.stats().dropped).toBe(3);
        expect(logger.stats().total).toBe(5);
    });

    it('clear() empties the buffer but seq keeps counting', () => {
        const logger = createAxmLogger();
        logger.info('ui', 'before');
        const seqBefore = logger.entries()[0].seq;
        logger.clear();
        expect(logger.entries()).toHaveLength(0);
        logger.info('ui', 'after');
        expect(logger.entries()[0].seq).toBeGreaterThan(seqBefore);
    });

    it('filters by level, domain, kind, and sinceSeq', () => {
        const logger = createAxmLogger();
        logger.debug('combat', 'noise');
        logger.info('game', 'signal');
        logger.warn('persistence', 'save-failed');
        logger.error('error', 'boundary');

        expect(logger.entries({ minLevel: 'warn' })).toHaveLength(2);
        expect(logger.entries({ domains: ['game', 'error'] })).toHaveLength(2);
        expect(logger.entries({ kind: 'signal' })).toHaveLength(1);

        const mid = logger.entries({ kind: 'signal' })[0].seq;
        const after = logger.entries({ sinceSeq: mid });
        expect(after.every(e => e.seq > mid)).toBe(true);
        expect(after).toHaveLength(2);
    });

    it('tail returns the newest n after filtering', () => {
        const logger = createAxmLogger();
        for (let i = 0; i < 10; i++) logger.info('ui', `k${i}`);
        const t = logger.tail(3);
        expect(t.map(e => e.kind)).toEqual(['k7', 'k8', 'k9']);
    });

    it('respects level threshold and domain allowlist config', () => {
        const logger = createAxmLogger({ level: 'info', domains: ['game'] });
        logger.debug('game', 'below-threshold');
        logger.info('combat', 'wrong-domain');
        logger.info('game', 'accepted');
        expect(logger.entries().map(e => e.kind)).toEqual(['accepted']);
    });

    it('fans out to sinks and survives a throwing sink', () => {
        const logger = createAxmLogger();
        const seen: AxmLogEntry[] = [];
        logger.addSink(() => { throw new Error('broken sink'); });
        const unsubscribe = logger.addSink(e => seen.push(e));
        expect(() => logger.info('ui', 'k1')).not.toThrow();
        expect(seen).toHaveLength(1);
        unsubscribe();
        logger.info('ui', 'k2');
        expect(seen).toHaveLength(1);
        expect(logger.entries()).toHaveLength(2);
    });
});
