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

import {
    AXM_LOG_LEVELS, AxmLogLevel, configureLogging, getLogger, isLoggingEnabled,
} from '../Log';

// ─── Flag parsing ─────────────────────────────────────────────────────────────

export interface CliFlags {
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    /** Path to a `.jsonl` file where per-decision state records are appended. */
    stateLogPath?: string;
    /**
     * Path to a save file (JSON). When set, the Save / Load tabs use a
     * `createNodeAdapter` snapshot slot backed by this path (the store
     * itself keeps the null adapter) — making Save / Load durable across
     * sessions.
     */
    saveFile?: string;
    /**
     * State fixture to BOOT from (2026-09-07): a registry id or a path to a
     * JSON fixture document (see `src/Game/fixtures`). `list` prints the
     * registry and exits. Replaces the blank L1 5/5/5 boot character.
     */
    fixture?: string;
    /** Comma-separated explicit node ids to walk without prompts. */
    route?: string[];
    /**
     * Phase 14 — resolve the current (start) node's own event before
     * walking `route`. Without this, the start node is visited but its
     * event never resolves (see `game.cli.ts`'s `route:end` summary).
     */
    resolveStart: boolean;
    /**
     * Phase 14 — non-mutating full-map coverage witness. Names a
     * registered map (e.g. `fishing-village`); reports every authored
     * node's primary event kind via read-only introspection instead of
     * walking a single legal route. Mutually exclusive in practice with
     * `route` (route wins if both are somehow passed).
     */
    routeAudit?: string;
    /** Auto-run Hazard-Pattern combat when a route encounter fires. */
    autoCombat: boolean;
    combatPolicy?: string;
    combatMaxTurns?: number;
    combatSeed?: number;
    /** Test/debug: force a specific `ENEMY_REGISTRY` slug at the node named by
     *  `combatEnemyNode`, overriding that node's authored encounter enemy. Used
     *  by the route-audit e2e to guarantee a deterministic combat DEFEAT (the
     *  impossible-tier enemy) independent of card balance. */
    combatEnemy?: string;
    combatEnemyNode?: string;
    /** AXM Log: enables the structured logger at this minimum level. */
    logLevel?: string;
    /** AXM Log: appends every accepted entry as JSONL to this path
     *  (implies the logger is enabled; level defaults to `info`). */
    logFile?: string;
}

export function parseArgv(args: string[]): CliFlags {
    const flags: CliFlags = { stdin: false, jsonEvents: false, autoCombat: false, resolveStart: false };
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
        } else if (arg.startsWith('--fixture=')) {
            flags.fixture = arg.slice('--fixture='.length);
            i++;
        } else if (arg === '--fixture') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--fixture requires a fixture id, a .json path, or `list`.');
            }
            flags.fixture = next;
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
        } else if (arg.startsWith('--route-audit=')) {
            flags.routeAudit = arg.slice('--route-audit='.length).trim();
            i++;
        } else if (arg === '--route-audit') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) {
                throw new Error('--route-audit requires a registered map name.');
            }
            flags.routeAudit = next.trim();
            i += 2;
        } else if (arg === '--resolve-start') {
            flags.resolveStart = true;
            i++;
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
        } else if (arg.startsWith('--combat-enemy=')) {
            flags.combatEnemy = arg.slice('--combat-enemy='.length);
            i++;
        } else if (arg === '--combat-enemy') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--combat-enemy requires an enemy slug.');
            flags.combatEnemy = next;
            i += 2;
        } else if (arg.startsWith('--log-level=')) {
            flags.logLevel = arg.slice('--log-level='.length);
            i++;
        } else if (arg === '--log-level') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--log-level requires a level (trace|debug|info|warn|error).');
            flags.logLevel = next;
            i += 2;
        } else if (arg.startsWith('--log-file=')) {
            flags.logFile = arg.slice('--log-file='.length);
            i++;
        } else if (arg === '--log-file') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--log-file requires a file path argument.');
            flags.logFile = next;
            i += 2;
        } else if (arg.startsWith('--combat-enemy-node=')) {
            flags.combatEnemyNode = arg.slice('--combat-enemy-node='.length);
            i++;
        } else if (arg === '--combat-enemy-node') {
            const next = args[i + 1];
            if (!next || next.startsWith('--')) throw new Error('--combat-enemy-node requires a node id.');
            flags.combatEnemyNode = next;
            i += 2;
        } else {
            throw new Error(
                `Unknown CLI flag: '${arg}'.\n` +
                `Usage: npm run game -- [--script <path>] [--stdin] [--json-events] [--state-log <path>] [--save-file <path>] [--fixture <id|path.json|list>] [--route <nodes>] [--resolve-start] [--route-audit <mapName>] [--auto-combat] [--combat-policy <policy>] [--combat-max-turns <n>] [--combat-seed <n>] [--combat-enemy <slug> --combat-enemy-node <id>] [--log-level <trace|debug|info|warn|error>] [--log-file <path>]`,
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
    // AXM Log tap: mirror the envelope stream into the structured logger
    // (off by default; enabled by --log-level/--log-file via attachCliLogSinks).
    if (isLoggingEnabled()) getLogger().debug('cli', event.type, event.payload);
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

// ─── AXM Log sinks (docs/logging.md) ─────────────────────────────────────────

/**
 * Wire the structured logger from CLI flags. No flags → no-op (the logger
 * stays disabled, so engine taps cost one boolean read — the sim default).
 *
 * `--log-file <path>`  — truncate-create `path` and append every accepted
 *                        entry as one JSON line (same idiom as --state-log).
 * `--log-level <lvl>`  — minimum captured level. Without --log-file the
 *                        entries also pretty-print to STDERR: stdout must
 *                        stay machine-clean for `--json-events` consumers.
 */
export function attachCliLogSinks(flags: Pick<CliFlags, 'logLevel' | 'logFile'>): void {
    if (flags.logLevel === undefined && flags.logFile === undefined) return;
    const level = (flags.logLevel ?? 'info') as AxmLogLevel;
    if (!AXM_LOG_LEVELS.includes(level)) {
        throw new Error(`--log-level must be one of ${AXM_LOG_LEVELS.join('|')}, got '${flags.logLevel}'.`);
    }
    configureLogging({ enabled: true, level });
    if (flags.logFile !== undefined) {
        const path = flags.logFile;
        fs.writeFileSync(path, '', 'utf-8');
        getLogger().addSink(entry => {
            try {
                fs.appendFileSync(path, JSON.stringify(entry) + '\n', 'utf-8');
            } catch { /* a sink failure must never break the run */ }
        });
    } else {
        getLogger().addSink(entry => {
            try {
                const data = entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : '';
                process.stderr.write(`[axm] ${entry.level} ${entry.domain}/${entry.kind}${data}\n`);
            } catch { /* never break the run */ }
        });
    }
}
