/**
 * Dice-mode declaration guard (spec 33 — THE FLIP alignment).
 *
 * The shipped app boots the Upgradeable-Dice model ON (mobile
 * `state/combat/flags.ts`), so the balance witnesses must (a) DEFAULT to that
 * model and (b) DECLARE which model produced every result — otherwise the
 * numbers silently describe a combat players never see. Two layers:
 *
 *  1. Report/format layer (fast, in-process): `runPlaytestMatrix` stamps
 *     `report.diceModel` from the live flag, and `formatPlaytestReport`
 *     prints a `Dice model:` header — proving the mode rides in BOTH the JSON
 *     metadata and the human text.
 *  2. CLI process layer: `npm run combat-playtest` defaults to Upgradeable
 *     Dice ON, `--legacy-dice` forces the pre-spec-33 model, and passing both
 *     switches is rejected.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { formatPlaytestReport, runPlaytestMatrix } from '../combat.playtest';
import { isUpgradeableDiceEnabled, setUpgradeableDice } from '../combat.upgradeable-dice';

// A trivially small matrix — one early enemy, one policy, one run. The dice
// model stamped on the report is independent of matrix size, so keep it cheap.
const TINY = {
    stages: ['early'] as const,
    policies: ['greedy'] as const,
    decks: [{ kind: 'preset', presetId: 'threadbare' } as const],
    enemySlugs: ['grave-larva'],
    runsPerCell: 1,
    seed: 1,
};

describe('playtest report declares its dice model', () => {
    afterEach(() => setUpgradeableDice(false));

    it('stamps legacy in JSON metadata and text when the flag is off', () => {
        setUpgradeableDice(false);
        const report = runPlaytestMatrix({ ...TINY });
        expect(report.diceModel).toBe('legacy');
        expect(formatPlaytestReport(report)).toContain('Dice model: LEGACY');
    });

    it('stamps upgradeable in JSON metadata and text when the flag is on', () => {
        setUpgradeableDice(true);
        const report = runPlaytestMatrix({ ...TINY });
        expect(report.diceModel).toBe('upgradeable');
        expect(formatPlaytestReport(report)).toContain('Dice model: UPGRADEABLE');
    });

    it('never leaks the flag past a matrix run (caller state is the source of truth)', () => {
        setUpgradeableDice(false);
        runPlaytestMatrix({ ...TINY });
        expect(isUpgradeableDiceEnabled()).toBe(false);
    });
});

// ── CLI process contract ────────────────────────────────────────────────────
// Spawns the real CLI to pin the user-facing switch behaviour end to end.

const PKG_ROOT = resolve(__dirname, '..', '..', '..');
const CLI = resolve(PKG_ROOT, 'src', 'CLI', 'combat-playtest.cli.ts');
const BASE_ARGS = ['--stage=early', '--policy=greedy', '--enemy=grave-larva', '--deck=preset:threadbare', '--runs=1', '--json'];

// Spawn ts-node through NODE, not through `npx`: on Windows `npx` is a .cmd
// shim that execFileSync cannot exec without a shell, so the child dies on a
// signal (status null) and every CLI assertion reads as a failure regardless
// of what the CLI actually did. Resolving the bin keeps the harness portable.
const TS_NODE_BIN = require.resolve('ts-node/dist/bin.js');

function runCli(args: readonly string[]): { stdout: string; status: number; stderr: string } {
    try {
        const stdout = execFileSync(
            process.execPath,
            [TS_NODE_BIN, CLI, ...args],
            { cwd: PKG_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
        );
        return { stdout, status: 0, stderr: '' };
    } catch (err) {
        const e = err as { status?: number; stdout?: string; stderr?: string };
        return { stdout: e.stdout ?? '', status: e.status ?? 1, stderr: e.stderr ?? '' };
    }
}

function parseReport(stdout: string): { diceModel: string } {
    return JSON.parse(stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1));
}

describe('combat-playtest CLI dice-model switches', () => {
    it('defaults to the Upgradeable-Dice model with no switch', () => {
        const { stdout, status } = runCli(BASE_ARGS);
        expect(status).toBe(0);
        expect(parseReport(stdout).diceModel).toBe('upgradeable');
    }, 120_000);

    it('--legacy-dice forces the pre-spec-33 model', () => {
        const { stdout, status } = runCli(['--legacy-dice', ...BASE_ARGS]);
        expect(status).toBe(0);
        expect(parseReport(stdout).diceModel).toBe('legacy');
    }, 120_000);

    it('rejects --legacy-dice and --upgradeable-dice together', () => {
        const { status, stderr } = runCli(['--legacy-dice', '--upgradeable-dice', ...BASE_ARGS]);
        expect(status).not.toBe(0);
        expect(stderr).toContain('mutually exclusive');
    }, 120_000);
});
