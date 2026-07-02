/**
 * CLI I/O abstraction.
 *
 * Three input modes (TTY / scripted answers / line-buffered stdin) and
 * two output modes (human-readable / JSON-per-line) so the same demo
 * loop can be driven by an external agent, a replay file, or a person
 * at the keyboard.
 *
 * Switch modes once at startup via `setIoMode(...)` / `setOutputMode(...)`
 * and then call `prompt`, `emit`, and `log` from anywhere in the CLI —
 * the abstraction routes everything to the current mode.
 */

import inquirer from 'inquirer';
import readline from 'readline';
import fs from 'fs';

// ─── Flag parsing ─────────────────────────────────────────────────────────────

export interface CliFlags {
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    /** Path to a `.jsonl` file where per-decision state records are appended. */
    stateLogPath?: string;
    /**
     * Path to a save file (JSON). When set, the CLI uses `createNodeAdapter`
     * backed by this path instead of the null adapter — making Save / Load
     * tabs durable across sessions.
     */
    saveFile?: string;
    /** Comma-separated explicit node ids to walk without prompts. */
    route?: string[];
    /** Auto-run Hazard-Pattern combat when a route encounter fires. */
    autoCombat: boolean;
    combatPolicy?: string;
    combatMaxTurns?: number;
    combatSeed?: number;
}

export function parseArgv(args: string[]): CliFlags {
    const flags: CliFlags = { stdin: false, jsonEvents: false, autoCombat: false };
    let i = 0;
    while (i < args.length) {
        const arg = args[i]!;
        if (arg === '--stdin') {
            flags.stdin = true;
            i++;
        } else if (arg === '--json-events') {
            flags.jsonEvents = true;
            i++;
        } else if (arg.startsWith('--script=')) {
            flags.scriptPath = arg.slice('--script='.length);
            i++;
        } else if (arg === '--script') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--script requires a file path argument.');
            }
            flags.scriptPath = next;
            i += 2;
        } else if (arg.startsWith('--state-log=')) {
            flags.stateLogPath = arg.slice('--state-log='.length);
            i++;
        } else if (arg === '--state-log') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--state-log requires a file path argument.');
            }
            flags.stateLogPath = next;
            i += 2;
        } else if (arg.startsWith('--save-file=')) {
            flags.saveFile = arg.slice('--save-file='.length);
            i++;
        } else if (arg === '--save-file') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--save-file requires a file path argument.');
            }
            flags.saveFile = next;
            i += 2;
        } else if (arg.startsWith('--route=')) {
            flags.route = arg.slice('--route='.length).split(',').map(s => s.trim()).filter(Boolean);
            i++;
        } else if (arg === '--route') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--route requires a comma-separated node list.');
            }
            flags.route = next.split(',').map(s => s.trim()).filter(Boolean);
            i += 2;
        } else if (arg === '--auto-combat') {
            flags.autoCombat = true;
            i++;
        } else if (arg.startsWith('--combat-policy=')) {
            flags.combatPolicy = arg.slice('--combat-policy='.length);
            i++;
        } else if (arg === '--combat-policy') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--combat-policy requires a value.');
            flags.combatPolicy = next;
            i += 2;
        } else if (arg.startsWith('--combat-max-turns=')) {
            flags.combatMaxTurns = Number(arg.slice('--combat-max-turns='.length));
            i++;
        } else if (arg === '--combat-max-turns') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--combat-max-turns requires a number.');
            flags.combatMaxTurns = Number(next);
            i += 2;
        } else if (arg.startsWith('--combat-seed=')) {
            flags.combatSeed = Number(arg.slice('--combat-seed='.length));
            i++;
        } else if (arg === '--combat-seed') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--combat-seed requires a number.');
            flags.combatSeed = Number(next);
            i += 2;
        } else {
            throw new Error(
                `Unknown CLI flag: '${arg}'.\n` +
                `Usage: npm run game -- [--script <path>] [--stdin] [--json-events] [--state-log <path>] [--save-file <path>] [--route <nodes>] [--auto-combat] [--combat-policy <policy>] [--combat-max-turns <n>] [--combat-seed <n>]`,
            );
        }
    }
    return flags;
}

// ─── Input mode ───────────────────────────────────────────────────────────────

export type IoMode =
    | { kind: 'tty' }
    | { kind: 'script'; answers: object[] }
    | { kind: 'stdin' };

let ioMode: IoMode = { kind: 'tty' };
let stdinIter: AsyncIterableIterator<string> | null = null;

export function setIoMode(mode: IoMode): void {
    ioMode = mode;
    if (mode.kind === 'stdin') {
        const rl = readline.createInterface({ input: process.stdin });
        stdinIter = rl[Symbol.asyncIterator]() as AsyncIterableIterator<string>;
    } else {
        stdinIter = null;
    }
}

export function getIoMode(): IoMode {
    return ioMode;
}

// ─── Output mode ──────────────────────────────────────────────────────────────

export type OutputMode = 'human' | 'json';

let outputMode: OutputMode = 'human';

export function setOutputMode(mode: OutputMode): void {
    outputMode = mode;
}

export function getOutputMode(): OutputMode {
    return outputMode;
}

// ─── prompt / emit / log ──────────────────────────────────────────────────────

/**
 * Drop-in replacement for `inquirer.prompt`. Routes to the configured
 * input mode. In script and stdin modes, the next answer object is
 * returned without rendering any UI.
 */
export async function prompt<T extends object>(
    questions: Parameters<typeof inquirer.prompt>[0],
): Promise<T> {
    if (ioMode.kind === 'tty') {
        return inquirer.prompt(questions) as Promise<T>;
    }
    if (ioMode.kind === 'script') {
        const next = ioMode.answers.shift();
        if (next === undefined) {
            throw new Error(
                'CLI script exhausted; pass more answers in the --script JSON.',
            );
        }
        return next as T;
    }
    // stdin
    if (!stdinIter) {
        throw new Error('IO mode is stdin but no stdin iterator is initialised.');
    }
    const { value, done } = await stdinIter.next();
    if (done || value === undefined) {
        throw new Error('CLI stdin closed before all prompts were answered.');
    }
    return JSON.parse(value) as T;
}

/**
 * Emit a GameEvent (or any `{ type, payload? }` envelope) to the
 * configured output channel. Human mode prints a one-line summary;
 * JSON mode prints `JSON.stringify(event)`.
 */
export function emit(event: { type: string; payload?: unknown }): void {
    if (outputMode === 'json') {
        process.stdout.write(JSON.stringify(event) + '\n');
    } else {
        // eslint-disable-next-line no-console
        console.log(`  [event] ${event.type}`);
    }
}

/**
 * Human-prose channel. In JSON mode the output is routed to stderr so
 * stdout stays machine-clean for event consumers.
 */
export function log(...args: unknown[]): void {
    if (outputMode === 'json') {
        const text = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
        process.stderr.write(text + '\n');
    } else {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
}

// ─── State log (Phase 26) ─────────────────────────────────────────────────────

let stateLogPath: string | null = null;
let stateLogTick = 0;

/**
 * Open a JSON-lines state log at `path`. Truncates the file if it exists.
 * Pass `null` to disable logging (the default).
 */
export function setStateLogPath(path: string | null): void {
    stateLogPath = path;
    stateLogTick = 0;
    if (path !== null) {
        // Truncate / create so each session starts fresh.
        fs.writeFileSync(path, '', 'utf-8');
    }
}

/**
 * Append one JSON-line record describing a state mutation. No-op when
 * the path is null. `before` / `after` should be plain JSON-serialisable
 * snapshots (typically `GameState` or a relevant slice). `event` is
 * optional metadata.
 */
export function logState(
    action: string,
    before: unknown,
    after: unknown,
    event?: unknown,
): void {
    if (stateLogPath === null) return;
    const record = {
        tick: ++stateLogTick,
        action,
        before,
        after,
        ...(event !== undefined ? { event } : {}),
    };
    fs.appendFileSync(stateLogPath, JSON.stringify(record) + '\n', 'utf-8');
}

export function getStateLogPath(): string | null {
    return stateLogPath;
}
