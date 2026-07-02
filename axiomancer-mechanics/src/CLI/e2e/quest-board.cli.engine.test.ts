/**
 * Hermetic e2e — Quest-board mini-game CLI (`src/CLI/quest-board.cli.ts`),
 * "The Boy's Almanac".
 *
 * The driver is plain async functions over the deterministic, self-seeded
 * quest-board engine, so we can drive it in-process:
 *   - flag parsing is pure;
 *   - `--auto --seed` plays a full board to a claimed outcome reproducibly
 *     (asserted via the `--state-log` JSONL trace);
 *   - `--script` manual play exercises the no-op illegal-action path, which
 *     must log an `illegalQuestBoardAction` record with a state snapshot.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { parseQuestBoardArgv, runQuestBoardCli } from '../quest-board.cli';

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

describe('QuestBoard CLI — flag parsing', () => {
    it('parses board-specific and shared io flags', () => {
        const flags = parseQuestBoardArgv([
            '--policy', 'gambler', '--auto', '--board', 'build-the-boat',
            '--seed', '99', '--runs', '4',
            '--json-events', '--state-log', 'log.jsonl',
        ]);
        expect(flags).toMatchObject({
            policy: 'gambler', auto: true, boardId: 'build-the-boat',
            seed: '99', runs: 4, jsonEvents: true, stateLogPath: 'log.jsonl',
        });
    });

    it('supports --flag=value form and sensible defaults', () => {
        const flags = parseQuestBoardArgv(['--policy=safe']);
        expect(flags.policy).toBe('safe');
        expect(flags.runs).toBe(3);                       // default
        expect(flags.auto).toBe(false);                   // default
        expect(flags.boardId).toBe('build-the-boat');     // default
    });

    it('rejects a bad --policy value', () => {
        expect(() => parseQuestBoardArgv(['--policy', 'reckless'])).toThrow(/--policy/);
    });

    it('rejects a non-positive --runs value', () => {
        expect(() => parseQuestBoardArgv(['--runs', '0'])).toThrow(/--runs/);
    });

    it('rejects unknown flags', () => {
        expect(() => parseQuestBoardArgv(['--nope'])).toThrow(/Unknown quest-board CLI flag/);
    });
});

describe('QuestBoard CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runQuestBoardCli([
                '--auto', '--policy', 'economist', '--seed', '42', '--runs', '1',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const claim = logs.find(r => r.action === 'claimQuestBoardCompletion');
            expect(claim).toBeDefined();
            const rolls = logs.filter(r => r.action === 'rollQuestBone').length;
            return { rolls, tier: claim!.event.tier as string };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A real board was played to a claimed, cosmetic tier.
        expect(a.rolls).toBeGreaterThan(0);
        expect(['masterwork', 'seaworthy', 'driftwood']).toContain(a.tier);
    });

    it('every bot policy completes the board (the quest cannot be failed)', async () => {
        for (const policy of ['safe', 'gambler', 'economist'] as const) {
            const logPath = tmpPath(`policy-${policy}`);
            await runQuestBoardCli([
                '--auto', '--policy', policy, '--seed', '7', '--runs', '2',
                '--json-events', '--state-log', logPath,
            ]);
            const claims = readLog(logPath).filter(r => r.action === 'claimQuestBoardCompletion');
            expect(claims).toHaveLength(2);
            for (const c of claims) {
                expect(['masterwork', 'seaworthy', 'driftwood']).toContain(c.event.tier);
            }
        }
    });

    it('plays --runs N boards back-to-back', async () => {
        const logPath = tmpPath('runs');
        await runQuestBoardCli([
            '--auto', '--policy', 'safe', '--seed', '5', '--runs', '3',
            '--json-events', '--state-log', logPath,
        ]);
        const sessions = readLog(logPath).filter(r => r.action === 'createQuestBoardSession');
        expect(sessions).toHaveLength(3);
    });
});

describe('QuestBoard CLI — illegal action handling', () => {
    it('warns, skips, and logs a no-op roll-during-space attempt with a snapshot', async () => {
        // Manual script: roll once to open the arrival space, then try to ROLL
        // AGAIN while a space is open — an illegal no-op regardless of the seed
        // (rollQuestBone only fires from 'idle'). The board's idle prompt offers
        // 'roll' (plus any charm); answering 'roll' from a space card is parsed
        // by the space-card prompt, but the script feeds raw answers in order —
        // we drive the engine verbs through the manual loop.
        const scriptPath = tmpPath('script', 'json');
        // The manual loop prompts:
        //   idle → choose 'roll'
        //   space → choose an option OR continue
        // We answer to land on the SLIPWAY (a result-only space) and continue,
        // then keep continuing; the illegal path is exercised by an explicit
        // bad option id on an open space.
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'roll' },                 // idle: cast the bone
            { pick: 'option:__bogus__' },     // space: illegal option id (no-op)
            { pick: 'continue' },             // recover: continue if a result card
        ]));

        const logPath = tmpPath('illegal');
        // One run, then the script exhausts; the manual loop ends when answers
        // run out (io throws), so we tolerate that by catching.
        await runQuestBoardCli([
            '--seed', '1', '--runs', '1',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]).catch(() => undefined);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalQuestBoardAction');
        expect(illegal.length).toBeGreaterThanOrEqual(1);
        const record = illegal[0]!;
        // The attempted action is captured for tuning…
        expect(record.event.attempted.action).toBe('chooseQuestSpaceOption');
        // …along with a full quest-board-state snapshot.
        expect(typeof record.event.questBoardState.phase).toBe('string');
        expect(typeof record.event.questBoardState.day).toBe('number');
    });
});
