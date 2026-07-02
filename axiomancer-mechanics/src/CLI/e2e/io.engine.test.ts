/**
 * Hermetic e2e — CLI I/O abstraction (`src/CLI/io.ts`).
 *
 * Tests cover:
 *   - argv parsing (every flag, missing arg, unknown flag).
 *   - script-mode `prompt` round-trip (shift-from-array, throw on
 *     exhaust).
 *   - json-mode `emit` writes one JSON-stringified line per call.
 *   - human-mode `emit` writes the human bullet.
 *   - json-mode `log` routes to stderr (keeps stdout machine-clean).
 *   - state-log writer round-trips records to disk (Phase 26 unit 4).
 *
 * No TTY interaction; `inquirer` is never invoked.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import {
    parseArgv, setIoMode, setOutputMode,
    prompt, emit, log,
    setStateLogPath, logState, getStateLogPath,
    type CliFlags,
} from '../io';

const tmpFiles: string[] = [];
function tmpPath(): string {
    const p = path.join(os.tmpdir(), `axiomancer-statelog-${randomUUID()}.jsonl`);
    tmpFiles.push(p);
    return p;
}

afterEach(() => {
    vi.restoreAllMocks();
    setIoMode({ kind: 'tty' });
    setOutputMode('human');
    setStateLogPath(null);
    while (tmpFiles.length > 0) {
        const p = tmpFiles.pop()!;
        try { fs.unlinkSync(p); } catch { /* ignore */ }
    }
});

describe('parseArgv', () => {
    it('returns sensible defaults for an empty arg list', () => {
        const flags: CliFlags = parseArgv([]);
        expect(flags).toEqual({ stdin: false, jsonEvents: false, autoCombat: false });
    });

    it('parses --stdin and --json-events independently', () => {
        expect(parseArgv(['--stdin'])).toEqual({ stdin: true, jsonEvents: false, autoCombat: false });
        expect(parseArgv(['--json-events'])).toEqual({ stdin: false, jsonEvents: true, autoCombat: false });
    });

    it('parses --script with separate value and = form', () => {
        expect(parseArgv(['--script', 'plan.json'])).toEqual({
            stdin: false, jsonEvents: false, autoCombat: false, scriptPath: 'plan.json',
        });
        expect(parseArgv(['--script=plan.json'])).toEqual({
            stdin: false, jsonEvents: false, autoCombat: false, scriptPath: 'plan.json',
        });
    });

    it('parses all flags combined in any order', () => {
        expect(parseArgv(['--json-events', '--stdin', '--script=replay.json'])).toEqual({
            stdin: true, jsonEvents: true, autoCombat: false, scriptPath: 'replay.json',
        });
    });

    it('throws when --script has no value', () => {
        expect(() => parseArgv(['--script'])).toThrow(/requires a file path/);
        expect(() => parseArgv(['--script', '--stdin'])).toThrow(/requires a file path/);
    });

    it('throws on unknown flags', () => {
        expect(() => parseArgv(['--foo'])).toThrow(/Unknown CLI flag/);
    });

    it('parses --save-file with separate value and = form', () => {
        expect(parseArgv(['--save-file', 'save.json'])).toEqual({
            stdin: false, jsonEvents: false, autoCombat: false, saveFile: 'save.json',
        });
        expect(parseArgv(['--save-file=save.json'])).toEqual({
            stdin: false, jsonEvents: false, autoCombat: false, saveFile: 'save.json',
        });
    });

    it('throws when --save-file has no value', () => {
        expect(() => parseArgv(['--save-file'])).toThrow(/requires a file path/);
        expect(() => parseArgv(['--save-file', '--stdin'])).toThrow(/requires a file path/);
    });
});

describe('prompt in script mode', () => {
    it('returns the next answer from the script array', async () => {
        setIoMode({ kind: 'script', answers: [{ a: 1 }, { b: 2 }] });
        const r1 = await prompt<{ a: number }>([]);
        const r2 = await prompt<{ b: number }>([]);
        expect(r1).toEqual({ a: 1 });
        expect(r2).toEqual({ b: 2 });
    });

    it('throws when the script runs out of answers', async () => {
        setIoMode({ kind: 'script', answers: [{ once: true }] });
        await prompt<{ once: boolean }>([]);
        await expect(prompt<{ never: true }>([])).rejects.toThrow(/script exhausted/);
    });
});

describe('emit', () => {
    it('writes one JSON line per event in json mode', () => {
        setOutputMode('json');
        const writes: string[] = [];
        const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
            return true;
        });

        emit({ type: 'combat:started', payload: { enemy: 'disatree' } });
        emit({ type: 'world:moved' });

        expect(spy).toHaveBeenCalledTimes(2);
        expect(writes[0]).toBe('{"type":"combat:started","payload":{"enemy":"disatree"}}\n');
        expect(writes[1]).toBe('{"type":"world:moved"}\n');
    });

    it('writes a human one-liner in human mode', () => {
        setOutputMode('human');
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        emit({ type: 'combat:started' });
        expect(consoleSpy).toHaveBeenCalledWith('  [event] combat:started');
    });
});

describe('log', () => {
    it('routes to stderr in json mode so stdout stays machine-clean', () => {
        setOutputMode('json');
        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        log('hello', 'world');
        expect(stderrSpy).toHaveBeenCalledWith('hello world\n');
    });

    it('uses console.log in human mode', () => {
        setOutputMode('human');
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        log('hello', 42);
        expect(consoleSpy).toHaveBeenCalledWith('hello', 42);
    });
});

describe('state log (Phase 26)', () => {
    it('is disabled by default — logState is a no-op', () => {
        expect(getStateLogPath()).toBeNull();
        // Calling logState without a path set should not throw and
        // should not create any file.
        logState('noop', null, null);
        // Nothing to assert beyond no-throw — path stays null.
        expect(getStateLogPath()).toBeNull();
    });

    it('setStateLogPath truncates the file fresh on each session', () => {
        const p = tmpPath();
        fs.writeFileSync(p, 'existing junk content\n', 'utf-8');
        setStateLogPath(p);
        expect(fs.readFileSync(p, 'utf-8')).toBe('');
        expect(getStateLogPath()).toBe(p);
    });

    it('logState appends one JSONL record per call with monotonic tick', () => {
        const p = tmpPath();
        setStateLogPath(p);

        logState('bootstrap', { hp: 10 }, { hp: 12 });
        logState('combatRound', { hp: 12 }, { hp: 8 }, { kind: 'damage' });

        const lines = fs.readFileSync(p, 'utf-8').trim().split('\n');
        expect(lines).toHaveLength(2);

        const r1 = JSON.parse(lines[0]!);
        expect(r1.tick).toBe(1);
        expect(r1.action).toBe('bootstrap');
        expect(r1.before).toEqual({ hp: 10 });
        expect(r1.after).toEqual({ hp: 12 });
        expect(r1.event).toBeUndefined();

        const r2 = JSON.parse(lines[1]!);
        expect(r2.tick).toBe(2);
        expect(r2.action).toBe('combatRound');
        expect(r2.before).toEqual({ hp: 12 });
        expect(r2.after).toEqual({ hp: 8 });
        expect(r2.event).toEqual({ kind: 'damage' });
    });

    it('setStateLogPath resets the tick counter', () => {
        const p1 = tmpPath();
        setStateLogPath(p1);
        logState('first', null, null);
        logState('second', null, null);

        const p2 = tmpPath();
        setStateLogPath(p2);
        logState('after-reset', null, null);

        const lines = fs.readFileSync(p2, 'utf-8').trim().split('\n');
        expect(lines).toHaveLength(1);
        const rec = JSON.parse(lines[0]!);
        expect(rec.tick).toBe(1);
        expect(rec.action).toBe('after-reset');
    });
});
