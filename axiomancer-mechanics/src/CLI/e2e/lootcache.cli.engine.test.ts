/**
 * Hermetic e2e — Loot-cache mini-game CLI (`src/CLI/lootcache.cli.ts`),
 * "The Reliquary".
 *
 * The driver is plain async functions over the deterministic, self-seeded
 * loot-cache engine, so we can drive it in-process:
 *   - flag parsing is pure;
 *   - `--auto --seed` produces a reproducible cache (asserted via the
 *     `--state-log` JSONL trace);
 *   - `--script` manual play exercises the no-op illegal-action path, which must
 *     log an `illegalLootCacheAction` record with a state snapshot.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { parseLootCacheArgv, runLootCacheCli } from '../lootcache.cli';

const tmpFiles: string[] = [];
function tmpPath(suffix: string, ext = 'jsonl'): string {
    const p = path.join(os.tmpdir(), `axiomancer-${suffix}-${randomUUID()}.${ext}`);
    tmpFiles.push(p);
    return p;
}

function readLog(p: string): Array<Record<string, any>> {
    return fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

afterEach(() => {
    tmpFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    tmpFiles.length = 0;
});

describe('LootCache CLI — flag parsing', () => {
    it('parses cache-specific and shared io flags', () => {
        const flags = parseLootCacheArgv([
            '--policy', 'greedy', '--auto', '--currency', '20',
            '--seed', '99', '--runs', '4',
            '--json-events', '--state-log', 'log.jsonl',
        ]);
        expect(flags).toMatchObject({
            policy: 'greedy', auto: true, currency: 20,
            seed: '99', runs: 4, jsonEvents: true, stateLogPath: 'log.jsonl',
        });
    });

    it('supports --flag=value form and sensible defaults', () => {
        const flags = parseLootCacheArgv(['--policy=prudent']);
        expect(flags.policy).toBe('prudent');
        expect(flags.runs).toBe(5);          // default
        expect(flags.auto).toBe(false);      // default
        expect(flags.currency).toBe(10);     // default
    });

    it('rejects a bad --policy value', () => {
        expect(() => parseLootCacheArgv(['--policy', 'reckless'])).toThrow(/--policy/);
    });

    it('rejects a negative --currency value', () => {
        expect(() => parseLootCacheArgv(['--currency', '-5'])).toThrow(/--currency/);
    });

    it('rejects a non-positive --runs value', () => {
        expect(() => parseLootCacheArgv(['--runs', '0'])).toThrow(/--runs/);
    });

    it('rejects unknown flags', () => {
        expect(() => parseLootCacheArgv(['--nope'])).toThrow(/Unknown loot-cache CLI flag/);
    });
});

describe('LootCache CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runLootCacheCli([
                '--auto', '--policy', 'prober', '--seed', '42', '--runs', '1',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const claim = logs.find(r => r.action === 'claimLootCacheOutcome');
            expect(claim).toBeDefined();
            const delves = logs.filter(r => r.action === 'delveLootCache').length;
            return { delves, tier: claim!.event.tier as string, currency: claim!.event.currencyKept as number };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A real cache was opened to a claimed outcome (the always-safe lid).
        expect(a.delves).toBeGreaterThan(0);
        expect(['emptied', 'prudent', 'stung']).toContain(a.tier);
    });

    it('the prudent policy takes only the safe lid and never gets bitten', async () => {
        const logPath = tmpPath('prudent');
        await runLootCacheCli([
            '--auto', '--policy', 'prudent', '--seed', '11', '--runs', '5',
            '--json-events', '--state-log', logPath,
        ]);
        const claims = readLog(logPath).filter(r => r.action === 'claimLootCacheOutcome');
        expect(claims).toHaveLength(5);
        // The lid is always safe: prudent never carries a bite.
        for (const c of claims) {
            expect(['prudent', 'emptied']).toContain(c.event.tier);
        }
    });

    it('plays --runs N caches back-to-back', async () => {
        const logPath = tmpPath('runs');
        await runLootCacheCli([
            '--auto', '--policy', 'greedy', '--seed', '5', '--runs', '3',
            '--json-events', '--state-log', logPath,
        ]);
        const sessions = readLog(logPath).filter(r => r.action === 'createLootCacheSession');
        expect(sessions).toHaveLength(3);
    });
});

describe('LootCache CLI — illegal action handling', () => {
    it('warns, skips, and logs a no-op probe-after-spent attempt with a state snapshot', async () => {
        // Manual script: delve the lid, then probe layer 1, then try to probe
        // AGAIN — the second probe is a deterministic no-op (probe already
        // spent), regardless of the seed.
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'delve' },  // open the always-safe lid
            { pick: 'probe' },  // spend the one probe on layer 1
            { pick: 'probe' },  // illegal — probe already spent
            { pick: 'seal' },   // walk away cleanly
        ]));

        const logPath = tmpPath('illegal');
        await runLootCacheCli([
            '--seed', '1', '--runs', '1',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalLootCacheAction');
        expect(illegal.length).toBeGreaterThanOrEqual(1);
        const record = illegal[0]!;
        // The attempted action is captured for tuning…
        expect(record.event.attempted.action).toBe('probeLootCache');
        // …along with a full loot-cache-state snapshot.
        expect(typeof record.event.lootCacheState.phase).toBe('string');
        expect(Array.isArray(record.event.lootCacheState.layers)).toBe(true);
    });
});
