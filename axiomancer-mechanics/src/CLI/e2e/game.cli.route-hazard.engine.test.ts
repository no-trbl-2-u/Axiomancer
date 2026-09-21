import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { runGameCli } from '../game.cli';
import { setStateLogPath, setOutputMode } from '../io';

const tmpFiles: string[] = [];
function tmpPath(suffix: string): string {
    const p = path.join(os.tmpdir(), `axiomancer-game-cli-route-${suffix}-${randomUUID()}.jsonl`);
    tmpFiles.push(p);
    return p;
}

function readLog(p: string): Array<Record<string, unknown>> {
    return fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

afterEach(() => {
    tmpFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    tmpFiles.length = 0;
    setStateLogPath(null);
    setOutputMode('human');
});

describe('Game CLI route walkthrough → Hazard-Pattern combat', () => {
    it('walks Fishing Village to the Market encounter and runs Hazard combat', async () => {
        const logPath = tmpPath('fv-market');

        // fv-16 converted from an `encounter` to a Phase 53d/S-01 narration
        // dilemma ("The Borrowed Hook"); fv-11 -> fv-13 (little-belle) is
        // now the nearest surviving column-3 encounter from fv-2.
        await runGameCli([
            '--route', 'fv-2,fv-26,fv-11,fv-27,fv-13',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '42',
            '--combat-max-turns', '12',
            '--state-log', logPath,
        ]);

        const logs = readLog(logPath);
        const actions = logs.map(r => r.action);
        expect(actions).toContain('moveToNode');
        expect(actions).toContain('resolveMapEvent');
        expect(actions).toContain('hazardCombat:start');
        expect(actions).toContain('hazardCombat:autoPhase');
        expect(actions).toContain('hazardCombat:end');

        const encounterEvent = logs
            .filter(r => r.action === 'resolveMapEvent')
            .map(r => r.event as { kind?: string; encounter?: { enemies?: Array<{ name?: string }> } })
            .find(event => event.kind === 'encounter');
        // THE THREE GATES (2026-09-21): the first encounter on any route is
        // now the first gate, fv-26 (Grave Larva); Little Belle waits at fv-13.
        expect(encounterEvent?.encounter?.enemies?.[0]?.name).toBe('Grave Larva');

        const end = logs.find(r => r.action === 'hazardCombat:end');
        expect((end?.event as { outcome?: string })?.outcome).toMatch(/victory|defeat|mercy|capitulate|concede|retreat/);
    });
});
