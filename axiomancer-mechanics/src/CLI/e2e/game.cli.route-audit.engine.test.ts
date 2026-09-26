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
    it('--route-audit reports all 28 Fishing Village nodes without mutating a single life', async () => {
        const logPath = tmpPath('coverage');

        await runGameCli(['--route-audit', 'fishing-village', '--state-log', logPath]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('coverage-audit');
        expect(summary.survived).toBe(true);
        expect(summary.unvisitedNodeIds).toEqual([]);
        expect((summary.visitedNodeIds as string[]).length).toBe(28);
        expect((summary.resolvedNodeIds as string[]).length).toBe(28);
        expect(summary.combatOutcomes).toEqual({});

        // fv-6 is the authored boss node; fv-1 is the arrival cutscene
        // (2026-08-08 first-map audit) — the audit inspects wiring, it never
        // fights anyone. fv-10, the terminal-column coast road, is the
        // northern-forest DOOR as of 2026-08-28 — the read-only audit sees
        // its kind without walking through it.
        const eventKinds = summary.eventKinds as Record<string, string>;
        expect(eventKinds['fv-1']).toBe('cutscene');
        expect(eventKinds['fv-6']).toBe('encounter');
        expect(eventKinds['fv-10']).toBe('travel');

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

        // The fv-6 combat is forced against the impossible-tier enemy
        // (`the-incompleteness`) so it is a DETERMINISTIC defeat regardless of
        // card balance. A normal fv-6 boss becomes winnable once the preset decks
        // are tuned, which repeatedly broke a seed-pinned fixture (seed 7, then
        // seed 32); the impossible enemy decouples this classifier test from
        // balance for good.
        //
        // PROFANE CANON (2026-08-08): the intermediate encounter is also
        // decoupled from balance now. `--combat-max-turns 4` is chosen so the
        // fodder fight (Little Belle) hits the turn cap UNRESOLVED (outcome
        // null — not a defeat, so the route continues), while the L110 ceiling
        // at fv-6 still kills within the cap. Only a real `defeat` blocks the
        // route; a capped, undecided combat must not. fv-7 is a route target
        // but must never be reached once fv-6 ends in defeat.
        //
        // Playtest fix 2026-09-04: FREE-line plays now advance the card-played
        // DoT clock, so the naive policy closes Little Belle (capitulate) by
        // turn 3 — the cap drops to 2 to keep fv-13 UNRESOLVED. The L110
        // ceiling still kills inside two turns.
        //
        // Phase 53d (S-01) converted fv-4 from an `encounter` into a
        // narration dilemma ("The Stranger's Net"), so the route now runs
        // through fv-11 -> fv-13 (little-belle) instead of fv-3 -> fv-4 to
        // reach the pre-boss fodder fight.
        //
        // D7 flag collapse (2026-09-25): the CLI auto-player finally makes
        // spec-33 PAID plays (it used to wait on a stance draft that never
        // came, so it only ever played FREE lines), which closed Little Belle
        // inside the cap on seed 32. Seed 1 keeps fv-13 UNRESOLVED at the cap.
        await runGameCli([
            '--start-map', 'fishing-village', '--route', 'fv-2,fv-26,fv-11,fv-27,fv-13,fv-28,fv-5,fv-6,fv-7',
            '--auto-combat',
            '--combat-policy', 'naive',
            '--combat-seed', '1',
            '--combat-max-turns', '2',
            '--combat-enemy', 'the-incompleteness',
            '--combat-enemy-node', 'fv-6',
            '--state-log', logPath,
        ]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('blocked');
        expect(summary.survived).toBe(false);
        expect(summary.blockedAtNodeId).toBe('fv-6');
        expect(summary.blockerReason).toBe('combat defeat');
        expect((summary.combatOutcomes as Record<string, string>)['fv-6']).toBe('defeat');
        // The capped fv-13 combat resolved to no outcome — it must be
        // recorded as neither a defeat nor a phantom victory.
        expect(summary.combatOutcomes as Record<string, string>).not.toHaveProperty('fv-13');
        expect(summary.visitedNodeIds).not.toContain('fv-7');
        expect(summary.unvisitedNodeIds).toContain('fv-7');
    });

    it('--resolve-start resolves fv-1\'s own arrival cutscene before walking the route; without it, the start node is explicitly unresolved', async () => {
        const withFlag = tmpPath('resolve-start-on');
        await runGameCli([
            '--start-map', 'fishing-village', '--route', 'fv-2',
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

        // The 2026-08-08 first-map audit re-authored fv-1 from a Grave Larva
        // encounter (which no player could reach — events fire on ARRIVAL, and
        // the map places the player ON fv-1) into the village's arrival
        // cutscene, a kind that is safe to fire the moment the map opens.
        const onLogs = readLog(withFlag);
        const fv1Event = onLogs
            .filter(r => r.action === 'resolveMapEvent')
            .map(r => r.event as { kind?: string; lines?: readonly string[] })
            .find(e => e.kind === 'cutscene');
        expect(fv1Event).toBeDefined();
        expect(fv1Event?.lines?.length ?? 0).toBeGreaterThan(0);

        const withoutFlag = tmpPath('resolve-start-off');
        await runGameCli([
            '--start-map', 'fishing-village', '--route', 'fv-2',
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

        // PROFANE CANON (2026-08-08): `--combat-max-turns 4` keeps the fodder
        // encounter balance-independent — the fight hits the turn cap
        // unresolved (not a defeat), so the walk stays survivorship no matter
        // how the untuned decks trade. This test proves the visited/unvisited
        // ACCOUNTING, not combat strength.
        //
        // Route retargeted fv-12 -> fv-16 by the 2026-08-08 first-map audit,
        // then fv-16 -> fv-11,fv-13 by Phase 53d (S-01): fv-16 converted from
        // an `encounter` into a narration dilemma ("The Borrowed Hook"), and
        // fv-13 (little-belle) is the nearest surviving column-3 encounter
        // reachable from fv-2 via fv-11.
        await runGameCli([
            '--start-map', 'fishing-village', '--route', 'fv-2,fv-26,fv-11,fv-27,fv-13',
            '--auto-combat',
            '--combat-policy', 'status',
            '--combat-seed', '42',
            '--combat-max-turns', '4',
            '--state-log', logPath,
        ]);

        const summary = routeEnd(logPath);
        expect(summary.classification).toBe('survivorship');
        expect(summary.survived).toBe(true);
        expect(summary.visitedNodeIds).toEqual(['fv-1', 'fv-2', 'fv-26', 'fv-11', 'fv-27', 'fv-13']);
        const unvisited = summary.unvisitedNodeIds as string[];
        expect(unvisited).toContain('fv-25');
        expect(unvisited.length).toBe(22); // 28 nodes − the 6 visited
    });
});
