/**
 * Hermetic e2e — Gathering mini-game CLI (`src/CLI/gathering.cli.ts`).
 *
 * The gleaning driver is plain async functions over the deterministic,
 * self-seeded gathering engine, so we can drive it in-process:
 *   - flag parsing is pure;
 *   - `--auto --seed` produces a reproducible playthrough (asserted via the
 *     `--state-log` JSONL trace);
 *   - `--script` manual play exercises the no-op illegal-action path, which
 *     must log an `illegalGatheringAction` record with a state snapshot.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { parseGatheringArgv, runGatheringCli } from '../gathering.cli';

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

describe('Gathering CLI — flag parsing', () => {
    it('parses gathering-specific and shared io flags', () => {
        const flags = parseGatheringArgv([
            '--site', 'bone-orchard', '--approach', 'strip', '--auto',
            '--seed', '99', '--runs', '4',
            '--json-events', '--state-log', 'log.jsonl',
        ]);
        expect(flags).toMatchObject({
            siteId: 'bone-orchard', approach: 'strip', auto: true,
            seed: '99', runs: 4, jsonEvents: true, stateLogPath: 'log.jsonl',
        });
    });

    it('supports --flag=value form and sensible defaults', () => {
        const flags = parseGatheringArgv(['--site=mire-mint']);
        expect(flags.siteId).toBe('mire-mint');
        expect(flags.runs).toBe(5);             // default
        expect(flags.auto).toBe(false);         // default
        expect(flags.approach).toBeUndefined(); // prompts when omitted
    });

    it('rejects a bad --approach value', () => {
        expect(() => parseGatheringArgv(['--approach', 'maul'])).toThrow(/--approach/);
    });

    it('rejects a non-positive --runs value', () => {
        expect(() => parseGatheringArgv(['--runs', '0'])).toThrow(/--runs/);
    });

    it('rejects unknown flags', () => {
        expect(() => parseGatheringArgv(['--nope'])).toThrow(/Unknown gathering CLI flag/);
    });
});

describe('Gathering CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runGatheringCli([
                '--auto', '--seed', '42', '--runs', '1',
                '--site', 'mire-mint', '--approach', 'glean',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const claim = logs.find(r => r.action === 'claimGatheringSpoils');
            expect(claim).toBeDefined();
            const harvests = logs.filter(r => r.action === 'harvestGatheringPlot').length;
            return { harvests, tier: claim!.event.tier as string, kept: claim!.event.keptPieces as number };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A real gleaning was played to a claimed outcome.
        expect(a.harvests).toBeGreaterThan(0);
        expect(['communion', 'laden', 'despoiled', 'routed']).toContain(a.tier);
    });

    it('plays --runs N sites back-to-back', async () => {
        const logPath = tmpPath('runs');
        await runGatheringCli([
            '--auto', '--seed', '5', '--runs', '3',
            '--site', 'drowned-garden', '--approach', 'strip',
            '--json-events', '--state-log', logPath,
        ]);
        const sessions = readLog(logPath).filter(r => r.action === 'createGatheringSession');
        expect(sessions).toHaveLength(3);
    });
});

describe('Gathering CLI — illegal action handling', () => {
    it('warns, skips, and logs a no-op harvest attempt with a state snapshot', async () => {
        // Harvesting a uid that is not in the spread is a deterministic no-op
        // regardless of the seed: the engine finds nothing and returns the
        // same state reference.
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'harvest:not-a-plot' }, // illegal — uid not in the spread
            { pick: 'withdraw' },           // end the gleaning cleanly
        ]));

        const logPath = tmpPath('illegal');
        await runGatheringCli([
            '--seed', '1', '--runs', '1',
            '--site', 'mire-mint', '--approach', 'glean',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalGatheringAction');
        expect(illegal).toHaveLength(1);
        const record = illegal[0]!;
        // The attempted action is captured for tuning…
        expect(record.event.attempted).toMatchObject({ action: 'harvestGatheringPlot', uid: 'not-a-plot' });
        // …along with a full gathering-state snapshot.
        expect(record.event.gatheringState.phase).toBe('foraging');
        expect(Array.isArray(record.event.gatheringState.spread)).toBe(true);
    });
});
