/**
 * Hermetic e2e — Rest mini-game CLI (`src/CLI/rest.cli.ts`), "The Night Watch".
 *
 * The rest driver is plain async functions over the deterministic, self-seeded
 * rest engine, so we can drive it in-process:
 *   - flag parsing is pure;
 *   - `--auto --seed` produces a reproducible night (asserted via the
 *     `--state-log` JSONL trace);
 *   - `--script` manual play exercises the no-op illegal-action path, which must
 *     log an `illegalRestAction` record with a state snapshot.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { parseRestArgv, runRestCli } from '../rest.cli';

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

describe('Rest CLI — flag parsing', () => {
    it('parses rest-specific and shared io flags', () => {
        const flags = parseRestArgv([
            '--posture', 'deep', '--auto', '--base-heal', '0.8',
            '--seed', '99', '--runs', '4',
            '--json-events', '--state-log', 'log.jsonl',
        ]);
        expect(flags).toMatchObject({
            posture: 'deep', auto: true, baseHeal: 0.8,
            seed: '99', runs: 4, jsonEvents: true, stateLogPath: 'log.jsonl',
        });
    });

    it('supports --flag=value form and sensible defaults', () => {
        const flags = parseRestArgv(['--posture=watch']);
        expect(flags.posture).toBe('watch');
        expect(flags.runs).toBe(5);          // default
        expect(flags.auto).toBe(false);      // default
        expect(flags.baseHeal).toBe(1.0);    // default
    });

    it('rejects a bad --posture value', () => {
        expect(() => parseRestArgv(['--posture', 'snooze'])).toThrow(/--posture/);
    });

    it('rejects a negative --base-heal value', () => {
        expect(() => parseRestArgv(['--base-heal', '-1'])).toThrow(/--base-heal/);
    });

    it('rejects a non-positive --runs value', () => {
        expect(() => parseRestArgv(['--runs', '0'])).toThrow(/--runs/);
    });

    it('rejects unknown flags', () => {
        expect(() => parseRestArgv(['--nope'])).toThrow(/Unknown rest CLI flag/);
    });
});

describe('Rest CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runRestCli([
                '--auto', '--seed', '42', '--runs', '1',
                '--posture', 'doze',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const claim = logs.find(r => r.action === 'claimRestOutcome');
            expect(claim).toBeDefined();
            const watches = logs.filter(r => r.action === 'continueRestWatch').length;
            return { watches, tier: claim!.event.tier as string, heal: claim!.event.healFraction as number };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A full night (3 watches) was played to a claimed dawn.
        expect(a.watches).toBe(3);
        expect(['restored', 'rested', 'meagre']).toContain(a.tier);
        // The Night Watch is never lethal: heal fraction is always >= 0.
        expect(a.heal).toBeGreaterThanOrEqual(0);
    });

    it('plays --runs N nights back-to-back', async () => {
        const logPath = tmpPath('runs');
        await runRestCli([
            '--auto', '--seed', '5', '--runs', '3',
            '--posture', 'deep',
            '--json-events', '--state-log', logPath,
        ]);
        const sessions = readLog(logPath).filter(r => r.action === 'createRestSession');
        expect(sessions).toHaveLength(3);
    });
});

describe('Rest CLI — illegal action handling', () => {
    it('warns, skips, and logs a no-op option attempt with a state snapshot', async () => {
        // Choosing an option id that the open watch card does not offer is a
        // deterministic no-op: the engine finds nothing and returns the same
        // reference. `--seed 1 --runs 1` drives engine seed minigameRunSeed(1,1)
        // = 2, whose watch plan is [embers, stir, embers]; the first (embers)
        // card takes the bogus pick, rejects it, and stays open for a valid
        // 'spare'. Watch 2 (stir) is passive → ack; watch 3 (embers) → spare.
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'option:not-an-option' }, // illegal — not on the embers card
            { pick: 'option:spare' },         // valid — watch 1 embers → continue
            { ack: 'continue' },              // watch 2 stir is passive
            { pick: 'option:spare' },         // valid — watch 3 embers → continue
        ]));

        const logPath = tmpPath('illegal');
        await runRestCli([
            '--seed', '1', '--runs', '1',
            '--posture', 'doze',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalRestAction');
        expect(illegal.length).toBeGreaterThanOrEqual(1);
        const record = illegal[0]!;
        // The attempted action is captured for tuning…
        expect(record.event.attempted).toMatchObject({ action: 'chooseRestOption', optionId: 'not-an-option' });
        // …along with a full rest-state snapshot.
        expect(record.event.restState.phase).toBe('watch');
        expect(Array.isArray(record.event.restState.watchPlan)).toBe(true);
    });
});
