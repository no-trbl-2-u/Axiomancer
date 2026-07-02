/**
 * Hermetic e2e — Hazard mini-game CLI (`src/CLI/hazard.cli.ts`), v2 engine.
 *
 * The hazard driver is plain async functions over the deterministic,
 * self-seeded v2 hazard engine, so we can drive it in-process:
 *   - flag parsing is pure;
 *   - `--auto --seed` produces a reproducible playthrough (asserted via the
 *     `--state-log` JSONL trace);
 *   - `--script` manual play exercises the no-op illegal-action path, which
 *     must log an `illegalHazardAction` record with a state snapshot.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { parseHazardArgv, runHazardCli, composeHazardBag } from '../hazard.cli';
import { hazardStarterBag, getHazardCardDef } from '../../World/Hazard';

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

describe('Hazard CLI — flag parsing', () => {
    it('parses hazard-specific and shared io flags', () => {
        const flags = parseHazardArgv([
            '--hazard', 'ashfall-crossing', '--route', 'bottom', '--auto',
            '--seed', '99', '--runs', '4',
            '--json-events', '--state-log', 'log.jsonl',
        ]);
        expect(flags).toMatchObject({
            hazardId: 'ashfall-crossing', route: 'bottom', auto: true,
            seed: '99', runs: 4, jsonEvents: true, stateLogPath: 'log.jsonl',
        });
    });

    it('supports --flag=value form and sensible defaults', () => {
        const flags = parseHazardArgv(['--hazard=cracked-cliff']);
        expect(flags.hazardId).toBe('cracked-cliff');
        expect(flags.runs).toBe(5);          // default
        expect(flags.auto).toBe(false);      // default
        expect(flags.route).toBeUndefined(); // prompts when omitted
    });

    it('rejects a bad --route value', () => {
        expect(() => parseHazardArgv(['--route', 'sideways'])).toThrow(/--route/);
    });

    it('rejects a non-positive --runs value', () => {
        expect(() => parseHazardArgv(['--runs', '0'])).toThrow(/--runs/);
    });

    it('rejects unknown flags', () => {
        expect(() => parseHazardArgv(['--nope'])).toThrow(/Unknown hazard CLI flag/);
    });

    it('parses --deck into a validated id list', () => {
        const flags = parseHazardArgv(['--deck', 'footing,windread']);
        expect(flags.deck).toEqual(['footing', 'windread']);
    });

    it('rejects an unknown --deck card id', () => {
        expect(() => parseHazardArgv(['--deck', 'footing,not-a-card'])).toThrow(/Unknown hazard card id 'not-a-card'/);
    });

    it('rejects an empty --deck', () => {
        expect(() => parseHazardArgv(['--deck', ' , '])).toThrow(/--deck needs at least one card id/);
    });

    it('parses --bag-file as a path', () => {
        expect(parseHazardArgv(['--bag-file', 'bag.json']).bagFile).toBe('bag.json');
    });
});

describe('Hazard CLI — deck injection (composeHazardBag)', () => {
    it('--deck appends acquired ids to the starter bag', () => {
        const starter = hazardStarterBag();
        const bag = composeHazardBag(['footing', 'windread']);
        expect(bag).toEqual([...starter, 'footing', 'windread']);
    });

    it('--bag-file ids REPLACE the whole bag', () => {
        const bag = composeHazardBag(['footing'], ['windread', 'windread', 'pole']);
        // bagFile wins; the starter + deck are dropped entirely.
        expect(bag).toEqual(['windread', 'windread', 'pole']);
    });

    it('no flags → exactly the starter bag', () => {
        expect(composeHazardBag()).toEqual(hazardStarterBag());
    });
});

describe('Hazard CLI — deterministic auto playthrough', () => {
    it('produces a reproducible outcome for a fixed seed', async () => {
        const runOnce = async () => {
            const logPath = tmpPath('auto');
            await runHazardCli([
                '--auto', '--seed', '42', '--runs', '1',
                '--hazard', 'cracked-cliff', '--route', 'top',
                '--json-events', '--state-log', logPath,
            ]);
            const logs = readLog(logPath);
            const marks = logs
                .filter(r => r.action === 'resolveHazardRound')
                .map(r => (r.event.cleared ? 'O' : 'X'))
                .join('');
            const claim = logs.find(r => r.action === 'claimHazardRewards');
            expect(claim).toBeDefined();
            return { marks, tier: claim!.event.tier as string };
        };

        const a = await runOnce();
        const b = await runOnce();

        // Same seed → identical outcome.
        expect(a).toEqual(b);
        // A full 3-round hazard was played to an outcome.
        expect(a.marks).toHaveLength(3);
        expect(['perfect', 'complete', 'failure']).toContain(a.tier);
    });

    it('plays --runs N encounters back-to-back', async () => {
        const logPath = tmpPath('runs');
        await runHazardCli([
            '--auto', '--seed', '5', '--runs', '3',
            '--hazard', 'flooded-undercroft', '--route', 'bottom',
            '--json-events', '--state-log', logPath,
        ]);
        const sessions = readLog(logPath).filter(r => r.action === 'createHazardSession');
        expect(sessions).toHaveLength(3);
    });
});

describe('Hazard CLI — utility-aware bot exploits an injected deck', () => {
    it('stages a draw/convert utility from an all-utility --bag-file', async () => {
        // A pinned bag of pure utility cards: the opening hand is all draw /
        // convert effects, so the auto bot — which fires utilities first —
        // MUST stage at least one of them.
        const bagPath = tmpPath('bag', 'json');
        fs.writeFileSync(bagPath, JSON.stringify([
            'footing', 'windread', 'pole', 'oath', 'footing', 'windread', 'pole', 'blessing',
        ]));

        const logPath = tmpPath('util');
        await runHazardCli([
            '--auto', '--seed', '7', '--runs', '1',
            '--hazard', 'cracked-cliff', '--route', 'top',
            '--bag-file', bagPath,
            '--json-events', '--state-log', logPath,
        ]);

        const logs = readLog(logPath);
        // The whole bag is the pinned utility set: the opening hand is utility.
        const created = logs.find(r => r.action === 'createHazardSession');
        expect(created).toBeDefined();
        const openingHand: Array<{ uid: string; cardId: string }> = created!.after.hand;
        expect(openingHand.length).toBeGreaterThan(0);
        for (const h of openingHand) {
            expect(['draw', 'convert', 'recast']).toContain(getHazardCardDef(h.cardId).effect);
        }

        // The utility-aware bot fires draw/convert/recast utilities first, so
        // the staged play carried into resolution must include at least one
        // utility card — proof the injected deck was exploited (not just drawn).
        // `resolveHazardRound`'s `after` snapshot holds the resolved play area.
        const resolves = logs.filter(r => r.action === 'resolveHazardRound');
        expect(resolves.length).toBeGreaterThan(0);
        const playedUtility = resolves.some(r =>
            (r.after.play as Array<{ cardId: string }>)
                .some(e => getHazardCardDef(e.cardId).effect !== undefined),
        );
        expect(playedUtility).toBe(true);
    });
});

describe('Hazard CLI — illegal action handling', () => {
    it('warns, skips, and logs a no-op power attempt with a state snapshot', async () => {
        // Powering a card that is still in HAND (not staged) is a deterministic
        // no-op regardless of the seed: the engine looks for the uid in `play`,
        // finds nothing, and returns the same state reference.
        const scriptPath = tmpPath('script', 'json');
        fs.writeFileSync(scriptPath, JSON.stringify([
            { pick: 'power:c1:d6' }, // illegal — c1 is in hand, not staged
            { pick: 'resolve' },     // stop round 1 (empty play ends the run)
        ]));

        const logPath = tmpPath('illegal');
        await runHazardCli([
            '--seed', '1', '--runs', '1',
            '--hazard', 'cracked-cliff', '--route', 'top',
            '--script', scriptPath, '--json-events', '--state-log', logPath,
        ]);

        const illegal = readLog(logPath).filter(r => r.action === 'illegalHazardAction');
        expect(illegal).toHaveLength(1);
        const record = illegal[0]!;
        // The attempted action is captured for tuning…
        expect(record.event.attempted).toMatchObject({ action: 'powerHazardCard', uid: 'c1', dieId: 'd6' });
        // …along with a full hazard-state snapshot.
        expect(record.event.hazardState.phase).toBe('playing');
        expect(Array.isArray(record.event.hazardState.dice)).toBe(true);
    });
});
