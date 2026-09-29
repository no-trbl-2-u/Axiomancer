import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { runGameCli } from '../game.cli';
import { setStateLogPath, setOutputMode } from '../io';
import { ENEMY_REGISTRY, TheDoorwarden } from '../../Enemy/enemy.library';
import { scaleEnemyToLevel } from '../../World/encounter';

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
    it('--route-audit reports all 18 Breakwater nodes without mutating a single life', async () => {
        const logPath = tmpPath('coverage');

        await runGameCli(['--route-audit', 'breakwater', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(18);
        expect((summary.resolvedNodeIds as string[]).length).toBe(18);
        expect(summary.combatOutcomes).toEqual({});

        // bw-17 is the Doorwarden's door fight; bw-1 is the arrival cutscene
        // — the audit inspects wiring, it never fights anyone. bw-18 is the
        // door to charcoal-wood — the read-only audit sees its kind without
        // walking through it. bw-16 is the region's Anvil.
        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['bw-1']).toBe('cutscene');
        expect(eventKinds['bw-17']).toBe('encounter');
        expect(eventKinds['bw-18']).toBe('travel');
        expect(eventKinds['bw-16']).toBe('blacksmith');

        const actions = readLog(logPath).map(r => r.action);
        expect(actions).not.toContain('hazardCombat:start');
    });

    it('--route-audit reports all 26 caverns nodes (2026-08-28 — the northern continent)', async () => {
        const logPath = tmpPath('caverns-coverage');

        await runGameCli(['--route-audit', 'caverns', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        // 25 + nc-26, the Phase W3 door column past the Under-Gate.
        expect((summary.visitedNodeIds as string[]).length).toBe(26);
        expect((summary.resolvedNodeIds as string[]).length).toBe(26);

        // nc-1 is the arrival; nc-2 the Delver (the quest-giver singleton);
        // nc-25 the Under-Gate boss; nf-10's door lands on this map, and
        // nc-26 — the gate standing open — is the door to northern-city
        // (the read-only audit sees its kind without walking through it).
        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['nc-1']).toBe('cutscene');
        expect(eventKinds['nc-2']).toBe('interaction');
        expect(eventKinds['nc-25']).toBe('encounter');
        expect(eventKinds['nc-26']).toBe('travel');
    });

    it('--route-audit reports all 26 northern-city nodes (Phase W4 — the water-gate door)', async () => {
        const logPath = tmpPath('northern-city-coverage');

        await runGameCli(['--route-audit', 'northern-city', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        // 25 + ncy-26, the Phase W4 door column past the Harbormaster.
        expect((summary.visitedNodeIds as string[]).length).toBe(26);
        expect((summary.resolvedNodeIds as string[]).length).toBe(26);

        // ncy-1 is the arrival; ncy-2 the Gate-Clerk (the city's first
        // face); ncy-25 the Harbormaster; ncy-23 the sealed river-gate
        // (still scenery); ncy-26 the real door to connecting-river.
        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['ncy-1']).toBe('cutscene');
        expect(eventKinds['ncy-2']).toBe('interaction');
        expect(eventKinds['ncy-25']).toBe('encounter');
        expect(eventKinds['ncy-23']).toBe('cutscene');
        expect(eventKinds['ncy-26']).toBe('travel');
    });

    it('--route-audit reports all 13 connecting-river nodes (Phase W4)', async () => {
        const logPath = tmpPath('connecting-river-coverage');

        await runGameCli(['--route-audit', 'connecting-river', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(13);
        expect((summary.resolvedNodeIds as string[]).length).toBe(13);

        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['cr-1']).toBe('cutscene');
        expect(eventKinds['cr-2']).toBe('interaction');
        expect(eventKinds['cr-12']).toBe('encounter');
        expect(eventKinds['cr-13']).toBe('travel');
    });

    it('--route-audit reports all 7 town-across-river nodes (Phase W5)', async () => {
        const logPath = tmpPath('town-across-river-coverage');

        await runGameCli(['--route-audit', 'town-across-river', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(7);
        expect((summary.resolvedNodeIds as string[]).length).toBe(7);

        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['tar-1']).toBe('cutscene');
        expect(eventKinds['tar-2']).toBe('interaction');
        expect(eventKinds['tar-6']).toBe('encounter');
        expect(eventKinds['tar-7']).toBe('travel');
    });

    it('--route-audit reports all 9 the-capital nodes (Phase W5)', async () => {
        const logPath = tmpPath('the-capital-coverage');

        await runGameCli(['--route-audit', 'the-capital', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(9);
        expect((summary.resolvedNodeIds as string[]).length).toBe(9);

        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['cap-1']).toBe('cutscene');
        expect(eventKinds['cap-2']).toBe('interaction');
        expect(eventKinds['cap-8']).toBe('narration');
        expect(eventKinds['cap-9']).toBe('encounter');
    });

    it('a scripted route stops at a combat defeat and downgrades to "blocked" — never reports post-defeat traversal as survivorship', async () => {
        const logPath = tmpPath('defeat-stop');

        // The bw-8 combat (the Brine Hag's elite node) is forced against a
        // ceiling enemy — a test-only registry entry: the Doorwarden scaled
        // to L110 — so it is a DETERMINISTIC defeat regardless of card
        // balance. The impossible enemy decouples this classifier test from
        // balance for good.
        //
        // The intermediate encounter is decoupled from balance too:
        // `--combat-max-turns 2` is chosen so the bw-2 fodder fight
        // (Float-Eye) hits the turn cap UNRESOLVED (outcome null — not a
        // defeat, so the route continues), while the L110 ceiling at bw-8
        // still kills within the cap. Only a real `defeat` blocks the route;
        // a capped, undecided combat must not. bw-12 is a route target but
        // must never be reached once bw-8 ends in defeat.
        const registry = ENEMY_REGISTRY as Record<string, unknown>;
        registry['test-ceiling'] = scaleEnemyToLevel(TheDoorwarden, 110);
        try {
            await runGameCli([
                '--start-map', 'breakwater', '--route', 'bw-2,bw-8,bw-12',
                '--auto-combat',
                '--combat-policy', 'naive',
                '--combat-seed', '1',
                '--combat-max-turns', '2',
                '--combat-enemy', 'test-ceiling',
                '--combat-enemy-node', 'bw-8',
                '--state-log', logPath,
            ]);
        } finally {
            delete registry['test-ceiling'];
        }

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('blocked');
        expect(summary.survived).toBe(false);
        expect(summary.blockedAtNodeId).toBe('bw-8');
        expect(summary.blockerReason).toBe('combat defeat');
        expect((summary.combatOutcomes as Record<string, string>)['bw-8']).toBe('defeat');
        // The capped bw-2 combat resolved to no outcome — it must be
        // recorded as neither a defeat nor a phantom victory.
        expect(summary.combatOutcomes as Record<string, string>).not.toHaveProperty('bw-2');
        expect(summary.visitedNodeIds).not.toContain('bw-12');
        expect(summary.unvisitedNodeIds).toContain('bw-12');
    });

    it('--resolve-start resolves bw-1\'s own arrival cutscene before walking the route; without it, the start node is explicitly unresolved', async () => {
        const withFlag = tmpPath('resolve-start-on');
        await runGameCli([
            '--start-map', 'breakwater', '--route', 'bw-2',
            '--resolve-start',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '1',
            '--combat-max-turns', '12',
            '--state-log', withFlag,
        ]);
        const onSummary = routeEnd(withFlag);
        expect(onSummary.startNode).toMatchObject({ nodeId: 'bw-1', resolved: true });
        expect(onSummary.resolvedNodeIds).toContain('bw-1');

        // bw-1 is the Breakwater's arrival cutscene — the start node holds a
        // kind that is safe to fire the moment the map opens (events fire on
        // ARRIVAL, and the map places the player ON bw-1).
        const onLogs = readLog(withFlag);
        const bw1Event = onLogs
            .filter(r => r.action === 'resolveMapEvent')
            .map(r => r.event as { kind?: string; lines?: readonly string[] })
            .find(e => e.kind === 'cutscene');
        expect(bw1Event).toBeDefined();
        expect(bw1Event?.lines?.length ?? 0).toBeGreaterThan(0);

        const withoutFlag = tmpPath('resolve-start-off');
        await runGameCli([
            '--start-map', 'breakwater', '--route', 'bw-2',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '1',
            '--combat-max-turns', '12',
            '--state-log', withoutFlag,
        ]);
        const offSummary = routeEnd(withoutFlag);
        expect(offSummary.startNode).toMatchObject({ nodeId: 'bw-1', resolved: false });
        expect(offSummary.resolvedNodeIds).not.toContain('bw-1');
    });

    it('reports the exact unvisited nodes for a partial legal route', async () => {
        const logPath = tmpPath('partial');

        // PROFANE CANON (2026-08-08): `--combat-max-turns 4` keeps the fodder
        // encounter balance-independent — the fight hits the turn cap
        // unresolved (not a defeat), so the walk stays survivorship no matter
        // how the untuned decks trade. This test proves the visited/unvisited
        // ACCOUNTING, not combat strength.
        await runGameCli([
            '--start-map', 'breakwater', '--route', 'bw-4,bw-10',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '42',
            '--combat-max-turns', '4',
            '--state-log', logPath,
        ]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('survivorship');
        expect(summary.survived).toBe(true);
        expect(summary.visitedNodeIds).toEqual(['bw-1', 'bw-4', 'bw-10']);
        const unvisited = summary.unvisitedNodeIds as string[];
        expect(unvisited).toContain('bw-18');
        expect(unvisited.length).toBe(15); // 18 nodes − the 3 visited
    });
});
