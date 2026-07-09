/**
 * Process-level smoke — real `ts-node` command startup for the two
 * player-facing entrypoints (`npm run combat`, `npm run game -- --route`).
 *
 * Phase 22: the hermetic e2e suites (`combat.cli.engine.test.ts`,
 * `game.cli.route-hazard.engine.test.ts`) call `runCombatCli` /
 * `runGameCli` in-process, which proves the store/event wiring but never
 * exercises the actual `require.main === module` bootstrap, npm's argv
 * forwarding, or `ts-node`'s own module resolution. This suite spawns the
 * real commands as child processes so a broken script, a `ts-node`
 * transpile failure, or an argv-forwarding regression fails here instead
 * of at runtime after merge.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const PACKAGE_ROOT = path.resolve(__dirname, '../../..');

const tmpFiles: string[] = [];
function tmpPath(suffix: string): string {
    const p = path.join(os.tmpdir(), `axiomancer-cli-smoke-${suffix}-${randomUUID()}.jsonl`);
    tmpFiles.push(p);
    return p;
}

function readLog(p: string): Array<Record<string, unknown>> {
    return fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

afterEach(() => {
    tmpFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    tmpFiles.length = 0;
});

describe('CLI process-level smoke (real ts-node startup)', () => {
    it('runs the standalone combat CLI as a real process', () => {
        const logPath = tmpPath('combat');

        execFileSync(
            'npx',
            [
                'ts-node', 'src/CLI/game.cli.ts', 'combat',
                '--auto', '--policy', 'status', '--enemy', 'little-belle',
                '--seed', '42', '--max-turns', '12',
                '--json-events', '--state-log', logPath,
            ],
            { cwd: PACKAGE_ROOT, stdio: 'pipe', timeout: 60_000 },
        );

        const actions = readLog(logPath).map(r => r.action);
        expect(actions).toContain('hazardCombat:start');
        expect(actions).toContain('hazardCombat:autoPhase');
        expect(actions).toContain('hazardCombat:end');
    }, 60_000);

    it('runs the route-to-Hazard game CLI as a real process', () => {
        const logPath = tmpPath('route');

        execFileSync(
            'npx',
            [
                'ts-node', 'src/CLI/game.cli.ts',
                '--route', 'fv-2,fv-12', '--auto-combat',
                '--combat-policy', 'status', '--combat-seed', '42',
                '--combat-max-turns', '12',
                '--json-events', '--state-log', logPath,
            ],
            { cwd: PACKAGE_ROOT, stdio: 'pipe', timeout: 60_000 },
        );

        const actions = readLog(logPath).map(r => r.action);
        expect(actions).toContain('moveToNode');
        expect(actions).toContain('resolveMapEvent');
        expect(actions).toContain('hazardCombat:start');
        expect(actions).toContain('hazardCombat:autoPhase');
        expect(actions).toContain('hazardCombat:end');
    }, 60_000);
});
