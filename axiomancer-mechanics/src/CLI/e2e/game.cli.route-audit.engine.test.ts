import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { runGameCli } from '../game.cli';
import { setStateLogPath, setOutputMode } from '../io';

const tmpFiles: string[] = [];
function tmpPath(suffix: string): string {
    const p = path.join(os.tmpdir(), `axiomancer-game-cli-route-audit-${suffix}-${randomUUID()}.jsonl`);
    tmpFiles.push(p);
    return p;
}

function readLog(p: string): Array<Record<string, unknown>> {
    return fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

function routeEnd(logPath: string): Record<string, unknown> {
    const logs = readLog(logPath);
    const end = logs.find(r => r.action === 'route:end');
    expect(end, 'expected a route:end summary record').toBeDefined();
    return end!.event as Record<string, unknown>;
}

afterEach(() => {
    tmpFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    tmpFiles.length = 0;
    setStateLogPath(null);
    setOutputMode('human');
});

describe('Phase 14 — route survivorship vs coverage-audit classification', () => {
    it('--route-audit reports all 25 Fishing Village nodes without mutating a single life', async () => {
        const logPath = tmpPath('coverage');

        await runGameCli(['--route-audit', 'fishing-village', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(25);
        expect((summary.resolvedNodeIds as string[]).length).toBe(25);
        expect(summary.combatOutcomes).toEqual({});

        // fv-6 is the authored boss node; fv-1 is a real encounter (Grave
        // Larva) — the audit inspects wiring, it never fights anyone.
        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['fv-1']).toBe('encounter');
        expect(eventKinds['fv-6']).toBe('encounter');

        const actions = readLog(logPath).map(r => r.action);
        expect(actions).not.toContain('hazardCombat:start');
    });

    it('a scripted route stops at a combat defeat and downgrades to "blocked" — never reports post-defeat traversal as survivorship', async () => {
        const logPath = tmpPath('defeat-stop');

        // Seed 32 + naive policy reliably loses the fv-6 boss fight
        // (re-measured 2026-07-08 against the retreat-removal + threat-escalation
        // engine change — the prior pinned seed 7 no longer loses this fight
        // once the escalation clock and Retreat-free deck draw order shifted
        // combat outcomes). fv-7 is listed as a route target but must never be
        // reached once fv-6 ends in defeat.
        await runGameCli([
            '--route', 'fv-2,fv-3,fv-4,fv-5,fv-6,fv-7',
            '--auto-combat',
            '--combat-policy', 'naive',
            '--combat-seed', '32',
            '--combat-max-turns', '30',
            '--state-log', logPath,
        ]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('blocked');
        expect(summary.survived).toBe(false);
        expect(summary.blockedAtNodeId).toBe('fv-6');
        expect(summary.blockerReason).toBe('combat defeat');
        expect((summary.combatOutcomes as Record<string, string>)['fv-6']).toBe('defeat');
        expect(summary.visitedNodeIds).not.toContain('fv-7');
        expect(summary.unvisitedNodeIds).toContain('fv-7');
    });

    it('--resolve-start resolves fv-1\'s own encounter before walking the route; without it, the start node is explicitly unresolved', async () => {
        const withFlag = tmpPath('resolve-start-on');
        await runGameCli([
            '--route', 'fv-2',
            '--resolve-start',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '1',
            '--combat-max-turns', '12',
            '--state-log', withFlag,
        ]);
        const onSummary = routeEnd(withFlag);
        expect(onSummary.startNode).toMatchObject({ nodeId: 'fv-1', resolved: true });
        expect(onSummary.resolvedNodeIds).toContain('fv-1');
        expect((onSummary.combatOutcomes as Record<string, string>)['fv-1']).toBeDefined();

        const onLogs = readLog(withFlag);
        const fv1Encounter = onLogs
            .filter(r => r.action === 'resolveMapEvent')
            .map(r => r.event as { kind?: string; encounter?: { enemies?: Array<{ name?: string }> } })
            .find(e => e.kind === 'encounter');
        expect(fv1Encounter?.encounter?.enemies?.[0]?.name).toBe('Grave Larva');

        const withoutFlag = tmpPath('resolve-start-off');
        await runGameCli([
            '--route', 'fv-2',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '1',
            '--combat-max-turns', '12',
            '--state-log', withoutFlag,
        ]);
        const offSummary = routeEnd(withoutFlag);
        expect(offSummary.startNode).toMatchObject({ nodeId: 'fv-1', resolved: false });
        expect(offSummary.resolvedNodeIds).not.toContain('fv-1');
    });

    it('reports the exact unvisited nodes for a partial legal route', async () => {
        const logPath = tmpPath('partial');

        await runGameCli([
            '--route', 'fv-2,fv-12',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '42',
            '--combat-max-turns', '12',
            '--state-log', logPath,
        ]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('survivorship');
        expect(summary.survived).toBe(true);
        expect(summary.visitedNodeIds).toEqual(['fv-1', 'fv-2', 'fv-12']);
        const unvisited = summary.unvisitedNodeIds as string[];
        expect(unvisited).toContain('fv-25');
        expect(unvisited.length).toBe(22);
    });
});
