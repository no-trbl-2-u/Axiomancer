/**
 * Hermetic e2e — Loot-cache mini-game CLI (`src/CLI/lootcache.cli.ts`),
 * "The Reliquary". Now drives the live Pick Pool: delve → picking
 * (push/retreat/insight) → card → delving/outcome.
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
                '--auto', '--policy', 'informed', '--seed', '42', '--runs', '1',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const claim = logs.find(r => r.action === 'claimLootCacheOutcome');
            expect(claim).toBeDefined();
            const pushes = logs.filter(r => r.action === 'pushLootCachePick').length;
            return { pushes, tier: claim!.event.tier as string, currency: claim!.event.currencyKept as number };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A real cache was picked at least once en route to a claimed outcome.
        expect(a.pushes).toBeGreaterThan(0);
        expect(['emptied', 'prudent', 'stung']).toContain(a.tier);
    });

    it('the prudent policy retreats early and rarely reaches every layer', async () => {
        const logPath = tmpPath('prudent');
        await runLootCacheCli([
            '--auto', '--policy', 'prudent', '--seed', '11', '--runs', '5',
            '--json-events', '--state-log', logPath,
        ]);
        const claims = readLog(logPath).filter(r => r.action === 'claimLootCacheOutcome');
        expect(claims).toHaveLength(5);
        for (const c of claims) {
            expect(['prudent', 'emptied', 'stung']).toContain(c.event.tier);
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
    it('drives a manual delve → push → retreat → seal script to a claimed outcome', async () => {
        // Manual script: delve the lid, push once, retreat from that layer
        // attempt, then walk away with whatever was already cracked (nothing).
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'delve' },     // open a pick attempt on the lid
            { pick: 'push' },      // roll the pick pool on the lid
            { pick: 'retreat' },   // walk away from the lid mid-attempt (if still picking)
            { pick: 'seal' },      // walk away cleanly
        ]));

        const logPath = tmpPath('manual-flow');
        await runLootCacheCli([
            '--seed', '1', '--runs', '1',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const claim = readLog(logPath).find(r => r.action === 'claimLootCacheOutcome');
        expect(claim).toBeDefined();
    });

    it('warns, skips, and logs a no-op second insight attempt with a state snapshot', async () => {
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'delve' },     // open a pick attempt on the lid
            { pick: 'insight' },   // channel insight before the lid's first roll
            { pick: 'insight' },   // illegal — insight already spent
            { pick: 'push' },      // roll the (bonus-die) pool
            { pick: 'retreat' },   // if still picking after the push
            { pick: 'seal' },      // walk away with whatever's left to do
        ]));

        const logPath = tmpPath('illegal-insight');
        await runLootCacheCli([
            '--seed', '1', '--runs', '1',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalLootCacheAction');
        expect(illegal.length).toBeGreaterThanOrEqual(1);
        const record = illegal[0]!;
        expect(record.event.attempted.action).toBe('channelLootCacheInsight');
        expect(typeof record.event.lootCacheState.phase).toBe('string');
        expect(Array.isArray(record.event.lootCacheState.layers)).toBe(true);
    });
});
