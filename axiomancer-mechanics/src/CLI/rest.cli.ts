#!/usr/bin/env node

/**
 * Rest Minigame CLI ("The Night Watch") — standalone driver.
 *
 * Reachable as a SUBCOMMAND of the game CLI:
 *
 *   npm run game -- rest [flags]
 *   npm run rest -- [flags]              (convenience alias)
 *
 * It reuses the shared `io.ts` layer (tty inquirer / `--script` JSON /
 * `--stdin`, plus `--json-events` and `--state-log`) so a person, a replay
 * file, or an agent can all drive it through the same surface as game.cli.ts.
 *
 *   • `--posture deep|doze|watch`  the night's posture (prompted when omitted).
 *   • `--auto`               the balance sim's policy plays the night (the
 *                            posture decides which: deep -> deep-sleeper,
 *                            watch -> watcher, doze -> fire-tender).
 *   • `--base-heal <f>`      the authored map-event baseline heal fraction
 *                            (default 1.0) scaling the whole night.
 *   • `--seed <n|str>`       seeds the engine's embedded RNG so a run is fully
 *                            reproducible.
 *   • `--runs <n>`           play N nights back-to-back (default 5).
 *
 * The engine is a pure, self-seeded state machine: every transition takes a
 * session and returns a NEW session, returning the SAME reference when the
 * action is illegal. The CLI exploits that — a no-op return is logged as an
 * `illegalRestAction` with a full state snapshot. Logic stays in the engine;
 * this file only parses flags, prompts, dispatches engine verbs, and formats.
 */

import {
    prompt, emit, log, logState,
    setIoMode, setOutputMode, setStateLogPath,
} from './io';
import {
    createRestSession,
    chooseRestPosture,
    chooseRestOption,
    continueRestWatch,
    claimRestOutcome,
    getRestPostureDef,
    REST_POSTURES,
} from '../World/Rest';
import type {
    RestPosture,
    RestSession,
} from '../World/Rest';
import { minigameRunSeed } from '../World/seed';

// ─── Flags ──────────────────────────────────────────────────────────────────

export interface RestCliFlags {
    posture?: RestPosture;
    auto: boolean;
    baseHeal: number;
    seed?: string;
    runs: number;
    // Shared io flags (parity with game.cli.ts / hazard.cli.ts).
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    stateLogPath?: string;
}

const USAGE =
    'Usage: npm run game -- rest ' +
    '[--posture deep|doze|watch] [--auto] [--base-heal <f>] [--seed <n>] [--runs <n>] ' +
    '[--script <path>] [--stdin] [--json-events] [--state-log <path>]';

/** Pull `--flag value` or `--flag=value`; returns [value, nextIndex]. */
function takeValue(args: string[], i: number, flag: string): [string, number] {
    const arg = args[i]!;
    const eq = `${flag}=`;
    if (arg.startsWith(eq)) return [arg.slice(eq.length), i + 1];
    const next = args[i + 1];
    if (next === undefined || next.startsWith('--')) {
        throw new Error(`${flag} requires a value argument.\n${USAGE}`);
    }
    return [next, i + 2];
}

export function parseRestArgv(args: string[]): RestCliFlags {
    const flags: RestCliFlags = { auto: false, baseHeal: 1.0, runs: 5, stdin: false, jsonEvents: false };
    let i = 0;
    while (i < args.length) {
        const arg = args[i]!;
        const base = arg.split('=', 1)[0]!;
        switch (base) {
            case '--auto':         flags.auto = true; i++; break;
            case '--stdin':        flags.stdin = true; i++; break;
            case '--json-events':  flags.jsonEvents = true; i++; break;
            case '--seed':         [flags.seed, i] = takeValue(args, i, '--seed'); break;
            case '--script':       [flags.scriptPath, i] = takeValue(args, i, '--script'); break;
            case '--state-log':    [flags.stateLogPath, i] = takeValue(args, i, '--state-log'); break;
            case '--posture': {
                let value: string;
                [value, i] = takeValue(args, i, '--posture');
                if (value !== 'deep' && value !== 'doze' && value !== 'watch') {
                    throw new Error(`--posture must be 'deep', 'doze', or 'watch', got '${value}'.\n${USAGE}`);
                }
                flags.posture = value;
                break;
            }
            case '--base-heal': {
                let value: string;
                [value, i] = takeValue(args, i, '--base-heal');
                const f = Number(value);
                if (!Number.isFinite(f) || f < 0) {
                    throw new Error(`--base-heal must be a non-negative number, got '${value}'.\n${USAGE}`);
                }
                flags.baseHeal = f;
                break;
            }
            case '--runs': {
                let value: string;
                [value, i] = takeValue(args, i, '--runs');
                const n = Number(value);
                if (!Number.isInteger(n) || n < 1) {
                    throw new Error(`--runs must be a positive integer, got '${value}'.\n${USAGE}`);
                }
                flags.runs = n;
                break;
            }
            default:
                throw new Error(`Unknown rest CLI flag: '${arg}'.\n${USAGE}`);
        }
    }
    return flags;
}

/** Derive a stable uint32 engine seed from the `--seed` flag (numeric or string). */
function seedToNumber(seed: string | undefined, runIndex: number): number {
    const seedInput = seed !== undefined && seed.trim() !== '' && Number.isFinite(Number(seed))
        ? Number(seed)
        : (seed ?? 0x4e696768);
    return minigameRunSeed(seedInput, runIndex);
}

// ─── Auto policy (mirrors rest.sim.ts pickOption, keyed off posture) ──────────

/**
 * Picks the option for the open watch card, matching the `rest.sim.ts`
 * policy for the chosen posture (deep -> deep-sleeper hoards dreams;
 * doze -> fire-tender feeds the fire; watch -> watcher spares + cashes).
 */
function autoOption(s: RestSession, posture: RestPosture): string | null {
    if (s.pending === null || s.pending.result !== null) return null;
    const enabled = s.pending.options.filter(o => !o.disabledReason);
    if (enabled.length === 0) return null;

    if (s.pending.kind === 'embers') {
        if (posture === 'doze') {
            const feed = enabled.find(o => o.id === 'feed');
            if (feed) return feed.id;
        }
        const spare = enabled.find(o => o.id === 'spare');
        return spare ? spare.id : enabled[0].id;
    }

    if (s.pending.kind === 'dream') {
        if (posture === 'deep') {
            const hold = enabled.find(o => o.id === 'hold');
            if (hold) return hold.id;
        }
        const fade = enabled.find(o => o.id === 'fade');
        return fade ? fade.id : enabled[0].id;
    }

    return enabled[0].id;
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

/** Applies a transition, logging an `illegalRestAction` when it no-ops. */
function step(
    action: string,
    state: RestSession,
    next: RestSession,
    meta: Record<string, unknown>,
): RestSession {
    if (next === state) {
        log(`  ⚠ illegal action skipped: ${action} — ${JSON.stringify(meta)}`);
        logState('illegalRestAction', state, state, { attempted: { action, ...meta }, restState: state });
        return state;
    }
    logState(action, state, next, meta);
    return next;
}

// ─── Manual driver (script / stdin / tty) ─────────────────────────────────────

async function manualWatch(state: RestSession): Promise<RestSession> {
    const pending = state.pending!;
    log(
        `\n  Watch ${state.watch}/3 — warmth ${state.warmth} · wood ${state.wood} · comfort ${state.comfort}` +
        ` · keepsakes ${state.keepsakes.length}`,
    );
    log(`  ${pending.title}`);
    if (pending.body) log(`  ${pending.body.replace(/\n/g, '\n  ')}`);

    // Passive cards (stir / still, and resolved choice cards) just need a
    // continue — present that as the only action.
    const open = pending.result === null && pending.options.length > 0;
    if (!open) {
        const { ack } = await prompt<{ ack: string }>([{
            type: 'rawlist', name: 'ack', message: 'Continue?',
            choices: [{ name: 'continue the night', value: 'continue' }],
        }]);
        void ack;
        return step('continueRestWatch', state, continueRestWatch(state), {});
    }

    const choices = pending.options
        .filter(o => !o.disabledReason)
        .map(o => ({ name: `${o.label} — ${o.desc}`, value: `option:${o.id}` }));
    const { pick } = await prompt<{ pick: string }>([{
        type: 'rawlist', name: 'pick', message: 'Action?', choices,
    }]);
    const [, optionId] = pick.split(':');
    return step('chooseRestOption', state, chooseRestOption(state, optionId!), { optionId });
}

// ─── A single night ──────────────────────────────────────────────────────────

interface NightResult {
    posture: RestPosture;
    tier: string;
    healFraction: number;
    cleansed: boolean;
    warmth: number;
    comfort: number;
    keepsakes: number;
}

async function pickPosture(flags: RestCliFlags): Promise<RestPosture> {
    if (flags.posture) return flags.posture;
    const { posture } = await prompt<{ posture: RestPosture }>([{
        type: 'rawlist', name: 'posture', message: 'How will you spend the night?',
        choices: REST_POSTURES.map(p => ({ name: `${p.name} — ${p.desc}`, value: p.key })),
    }]);
    return posture;
}

async function playNight(flags: RestCliFlags, runIndex: number): Promise<NightResult> {
    const posture = await pickPosture(flags);
    const def = getRestPostureDef(posture);
    const seed = seedToNumber(flags.seed, runIndex);

    log(`\n═══ Night ${runIndex} — ${def.name} (base-heal ${flags.baseHeal}) ═══`);
    log(`  ${def.flavor}`);

    let state = createRestSession(seed, flags.baseHeal);
    logState('createRestSession', null, state, { seed, baseHeal: flags.baseHeal, runIndex });

    state = chooseRestPosture(state, posture);
    logState('chooseRestPosture', null, state, { posture });

    let guard = 0;
    while (state.phase === 'watch' && guard++ < 100) {
        if (flags.auto) {
            const optionId = autoOption(state, posture);
            if (optionId !== null) {
                state = step('chooseRestOption', state, chooseRestOption(state, optionId), { optionId });
            }
            state = step('continueRestWatch', state, continueRestWatch(state), {});
        } else {
            const before = state;
            state = await manualWatch(state);
            // After a manual choice, the card is resolved — advance it.
            if (state !== before && state.phase === 'watch' && state.pending?.result !== null) {
                state = step('continueRestWatch', state, continueRestWatch(state), {});
            }
        }
    }

    let result: NightResult = {
        posture, tier: 'incomplete', healFraction: 0, cleansed: false,
        warmth: state.warmth, comfort: state.comfort, keepsakes: state.keepsakes.length,
    };
    if (state.phase === 'outcome' && state.outcome) {
        const o = state.outcome;
        result = {
            posture,
            tier: o.tier,
            healFraction: o.healFraction,
            cleansed: o.cleansed,
            warmth: o.warmth,
            comfort: o.comfort,
            keepsakes: o.keepsakes.length,
        };
        log(
            `  Dawn: ${o.tier.toUpperCase()} — heal ${(o.healFraction * 100).toFixed(0)}%` +
            (o.cleansed ? ', cleansed' : '') +
            `, warmth ${o.warmth}, comfort ${o.comfort}` +
            (o.keepsakes.length ? `, ${o.keepsakes.length} keepsake(s)` : ''),
        );
        state = step('claimRestOutcome', state, claimRestOutcome(state), {
            tier: o.tier, healFraction: o.healFraction,
        });
    }

    emit({ type: 'rest:complete', payload: result });
    return result;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function runRestCli(argv: string[]): Promise<void> {
    const flags = parseRestArgv(argv);

    if (flags.jsonEvents) setOutputMode('json');
    if (flags.scriptPath) {
        const fs = await import('fs');
        const answers = JSON.parse(fs.readFileSync(flags.scriptPath, 'utf-8'));
        if (!Array.isArray(answers)) {
            throw new Error('--script JSON must be a top-level array of answer objects.');
        }
        setIoMode({ kind: 'script', answers });
    } else if (flags.stdin) {
        setIoMode({ kind: 'stdin' });
    }
    if (flags.stateLogPath) setStateLogPath(flags.stateLogPath);

    log('Axiomancer — rest mini-game (The Night Watch).');
    log(`Mode: ${flags.auto ? 'auto' : 'manual'}  ·  runs: ${flags.runs}` +
        (flags.seed !== undefined ? `  ·  seed: ${flags.seed}` : ''));

    const results: NightResult[] = [];
    for (let run = 1; run <= flags.runs; run++) {
        results.push(await playNight(flags, run));
    }

    const restored = results.filter(r => r.tier === 'restored').length;
    const cleansed = results.filter(r => r.cleansed).length;
    const avgHeal = results.reduce((sum, r) => sum + r.healFraction, 0) / results.length;
    log('\n═══ Summary ═══');
    for (const r of results) {
        log(`  ${r.posture}: ${r.tier} — heal ${(r.healFraction * 100).toFixed(0)}% (warmth ${r.warmth}, comfort ${r.comfort}, ${r.keepsakes} keepsakes)`);
    }
    log(`  ${restored}/${results.length} nights restored · ${cleansed} cleansed · avg heal ${(avgHeal * 100).toFixed(0)}%`);
    emit({ type: 'rest:summary', payload: { results, restored, cleansed, avgHeal } });
}

// Allow direct execution: `ts-node src/CLI/rest.cli.ts [flags]`.
if (require.main === module) {
    runRestCli(process.argv.slice(2)).catch((err) => {
        emit({ type: 'cli:exit', payload: { reason: 'error', message: String(err) } });
        process.exitCode = 1;
        log(String(err));
    });
}
