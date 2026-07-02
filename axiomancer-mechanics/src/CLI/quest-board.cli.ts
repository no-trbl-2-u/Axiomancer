#!/usr/bin/env node

/**
 * Quest Board Minigame CLI ("The Boy's Almanac") — standalone driver.
 *
 * Reachable as a SUBCOMMAND of the game CLI:
 *
 *   npm run game -- quest-board [flags]
 *   npm run quest-board -- [flags]      (convenience alias)
 *
 * It reuses the shared `io.ts` layer (tty inquirer / `--script` JSON /
 * `--stdin`, plus `--json-events` and `--state-log`) so a person, a replay
 * file, or an agent can all drive it through the same surface as game.cli.ts.
 *
 *   • `--policy safe|gambler|economist`  the bot for `--auto` (default
 *                            economist), reusing the `quest-board.sim.ts`
 *                            option shapes.
 *   • `--auto`               the policy plays the whole board to a claimed
 *                            outcome.
 *   • `--board <id>`         the board to play (default `build-the-boat`).
 *   • `--seed <n|str>`       seeds the engine's embedded RNG so a run is fully
 *                            reproducible.
 *   • `--runs <n>`           play N boards back-to-back (default 3).
 *
 * The engine is a pure, self-seeded state machine: every transition takes a
 * session and returns a NEW session, returning the SAME reference when the
 * action is illegal. The CLI exploits that — a no-op return is logged as an
 * `illegalQuestBoardAction` with a full state snapshot. Logic stays in the
 * engine; this file only parses flags, prompts, dispatches engine verbs, and
 * formats.
 */

import {
    prompt, emit, log, logState,
    setIoMode, setOutputMode, setStateLogPath,
} from './io';
import {
    createQuestBoardSession,
    beginQuestBoard,
    rollQuestBone,
    useQuestCharm,
    chooseQuestSpaceOption,
    continueQuestSpace,
    acknowledgeQuestDusk,
    claimQuestBoardCompletion,
    getQuestBoardDef,
    QUEST_BOARDS,
} from '../World/QuestBoard';
import type {
    QuestBoardPolicyId,
    QuestBoardSession,
} from '../World/QuestBoard';
import { minigameRunSeed } from '../World/seed';

// ─── Flags ──────────────────────────────────────────────────────────────────

export interface QuestBoardCliFlags {
    policy: QuestBoardPolicyId;
    auto: boolean;
    boardId: string;
    seed?: string;
    runs: number;
    // Shared io flags (parity with game.cli.ts / rest.cli.ts).
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    stateLogPath?: string;
}

const POLICIES: readonly QuestBoardPolicyId[] = ['safe', 'gambler', 'economist'];

const USAGE =
    'Usage: npm run game -- quest-board ' +
    '[--policy safe|gambler|economist] [--auto] [--board <id>] [--seed <n>] [--runs <n>] ' +
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

export function parseQuestBoardArgv(args: string[]): QuestBoardCliFlags {
    const flags: QuestBoardCliFlags = {
        policy: 'economist', auto: false, boardId: 'build-the-boat',
        runs: 3, stdin: false, jsonEvents: false,
    };
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
            case '--board':        [flags.boardId, i] = takeValue(args, i, '--board'); break;
            case '--policy': {
                let value: string;
                [value, i] = takeValue(args, i, '--policy');
                if (!POLICIES.includes(value as QuestBoardPolicyId)) {
                    throw new Error(`--policy must be one of ${POLICIES.join('|')}, got '${value}'.\n${USAGE}`);
                }
                flags.policy = value as QuestBoardPolicyId;
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
                throw new Error(`Unknown quest-board CLI flag: '${arg}'.\n${USAGE}`);
        }
    }
    return flags;
}

/** Derive a stable uint32 engine seed from the `--seed` flag (numeric or string). */
function seedToNumber(seed: string | undefined, runIndex: number): number {
    const seedInput = seed !== undefined && seed.trim() !== '' && Number.isFinite(Number(seed))
        ? Number(seed)
        : (seed ?? 0x426f7921);
    return minigameRunSeed(seedInput, runIndex);
}

// ─── Auto policy (mirrors quest-board.sim.ts option shapes) ──────────────────

/**
 * Picks the option id for the open space card, matching the
 * `quest-board.sim.ts` policy for the chosen bot:
 *  - safe: efficient-but-cautious (nail deals at market, press gather twice);
 *  - gambler: aggressive (keep pressing gather, buy hard, risky defaults);
 *  - economist: value-led (nail deals, press 2-3 by fish reserve).
 * Returns null when there is no pickable option (passive/result card).
 */
function autoOption(s: QuestBoardSession, policy: QuestBoardPolicyId): string | null {
    if (s.pending === null || s.pending.result !== null) return null;
    const enabled = s.pending.options.filter(o => !o.disabledReason);
    if (enabled.length === 0) return null;
    const kind = s.pending.kind;

    if (kind === 'market') {
        const nail = enabled.find(o => o.label.includes('IRON NAILS'));
        const buys = enabled.filter(o => o.id.startsWith('offer-'));
        const leave = enabled.find(o => o.id === 'leave');
        if (policy === 'gambler') {
            if (buys.length > 0 && s.fish >= 2) return buys[0].id;
            return (leave ?? enabled[0]).id;
        }
        // safe + economist favour the nail deal, then leave.
        if (nail && s.fish >= 2) return nail.id;
        if (policy === 'economist' && buys.length > 0 && s.fish >= 3) return buys[0].id;
        return (leave ?? enabled[0]).id;
    }

    if (kind === 'gather') {
        const presses = s.pending.presses ?? 0;
        const press = enabled.find(o => o.id === 'press');
        const stop = enabled.find(o => o.id === 'stop');
        if (policy === 'gambler') return (press ?? stop ?? enabled[0]).id;
        const def = getQuestBoardDef(s.boardId);
        const fishRatio = s.fish / Math.max(1, def.startFish);
        const maxPress = policy === 'economist' && fishRatio > 0.6 ? 3 : 2;
        const want = presses >= maxPress ? stop : press;
        return (want ?? stop ?? enabled[0]).id;
    }

    // duel / snag / hearth / parley / slipway: first enabled option.
    return enabled[0].id;
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

/** Applies a transition, logging an `illegalQuestBoardAction` when it no-ops. */
function step(
    action: string,
    state: QuestBoardSession,
    next: QuestBoardSession,
    meta: Record<string, unknown>,
): QuestBoardSession {
    if (next === state) {
        log(`  ⚠ illegal action skipped: ${action} — ${JSON.stringify(meta)}`);
        logState('illegalQuestBoardAction', state, state, { attempted: { action, ...meta }, questBoardState: state });
        return state;
    }
    logState(action, state, next, meta);
    return next;
}

// ─── Manual driver (script / stdin / tty) ─────────────────────────────────────

async function manualTurn(state: QuestBoardSession): Promise<QuestBoardSession> {
    if (state.phase === 'dusk') {
        log(`\n  Dusk — day ${state.day}${state.collapsedToday ? ' (home early — vigor spent)' : ''}.`);
        const { ack } = await prompt<{ ack: string }>([{
            type: 'rawlist', name: 'ack', message: 'A new day?',
            choices: [{ name: 'wake and carry on', value: 'wake' }],
        }]);
        void ack;
        return step('acknowledgeQuestDusk', state, acknowledgeQuestDusk(state), {});
    }

    if (state.phase === 'idle') {
        log(
            `\n  Day ${state.day} · stretch ${state.stretch} — fish ${state.fish} · vigor ${state.vigor}` +
            (state.wind ? ` · wind ${state.wind}` : ''),
        );
        const primed = state.charms.filter(c => !c.used && !c.primed);
        const choices: Array<{ name: string; value: string }> = [
            { name: 'CAST THE BONE — roll and move', value: 'roll' },
        ];
        for (const c of primed) {
            choices.push({ name: `PRIME CHARM — ${c.id}`, value: `charm:${c.id}` });
        }
        const { pick } = await prompt<{ pick: string }>([{
            type: 'rawlist', name: 'pick', message: 'Action?', choices,
        }]);
        if (pick.startsWith('charm:')) {
            const charmId = pick.slice('charm:'.length);
            return step('useQuestCharm', state, useQuestCharm(state, charmId as never), { charmId });
        }
        return step('rollQuestBone', state, rollQuestBone(state), {});
    }

    // phase === 'space'
    const pending = state.pending!;
    log(`\n  ${pending.title}`);
    if (pending.body) log(`  ${pending.body.replace(/\n/g, '\n  ')}`);

    const open = pending.result === null && pending.options.length > 0;
    if (!open) {
        if (pending.result) log(`  → ${pending.result.title}`);
        const { ack } = await prompt<{ ack: string }>([{
            type: 'rawlist', name: 'ack', message: 'Continue?',
            choices: [{ name: 'continue along the board', value: 'continue' }],
        }]);
        void ack;
        return step('continueQuestSpace', state, continueQuestSpace(state), {});
    }

    const choices = pending.options
        .filter(o => !o.disabledReason)
        .map(o => ({ name: `${o.label} — ${o.desc}`, value: `option:${o.id}` }));
    const { pick } = await prompt<{ pick: string }>([{
        type: 'rawlist', name: 'pick', message: 'Action?', choices,
    }]);
    const [, optionId] = pick.split(':');
    return step('chooseQuestSpaceOption', state, chooseQuestSpaceOption(state, optionId!), { optionId });
}

// ─── A single board ───────────────────────────────────────────────────────────

interface BoardResult {
    boardId: string;
    policy: QuestBoardPolicyId;
    tier: string;
    daysTaken: number;
    fishLeft: number;
    vigorLeft: number;
    vowsKept: number;
}

async function playBoard(flags: QuestBoardCliFlags, runIndex: number): Promise<BoardResult> {
    const def = getQuestBoardDef(flags.boardId);
    const seed = seedToNumber(flags.seed, runIndex);

    log(`\n═══ Board ${runIndex} — ${def.title} (${def.id}) ═══`);
    log(`  ${def.boardHeadline}`);

    let state = createQuestBoardSession(seed, def.id);
    logState('createQuestBoardSession', null, state, { seed, boardId: def.id, runIndex });

    state = step('beginQuestBoard', state, beginQuestBoard(state), {});

    let guard = 0;
    while (state.phase !== 'done' && state.phase !== 'outcome' && guard++ < 5000) {
        if (flags.auto) {
            if (state.phase === 'dusk') {
                state = step('acknowledgeQuestDusk', state, acknowledgeQuestDusk(state), {});
            } else if (state.phase === 'idle') {
                state = step('rollQuestBone', state, rollQuestBone(state), {});
            } else if (state.phase === 'space') {
                const optionId = autoOption(state, flags.policy);
                if (optionId !== null) {
                    state = step('chooseQuestSpaceOption', state, chooseQuestSpaceOption(state, optionId), { optionId });
                } else if (state.pending && state.pending.result !== null) {
                    state = step('continueQuestSpace', state, continueQuestSpace(state), {});
                } else {
                    // No pickable option and no result — force-continue to avoid a stall.
                    state = step('continueQuestSpace', state, continueQuestSpace(state), {});
                }
            }
        } else {
            state = await manualTurn(state);
        }
    }

    let result: BoardResult = {
        boardId: def.id, policy: flags.policy, tier: 'incomplete',
        daysTaken: state.day, fishLeft: state.fish, vigorLeft: state.vigor, vowsKept: 0,
    };
    if (state.phase === 'outcome' && state.outcome) {
        const o = state.outcome;
        result = {
            boardId: def.id, policy: flags.policy, tier: o.tier,
            daysTaken: o.daysTaken, fishLeft: o.fishLeft, vigorLeft: o.vigorLeft, vowsKept: o.vowsKept,
        };
        log(
            `  Launched: ${o.tier.toUpperCase()} — ${o.daysTaken} day(s), ` +
            `${o.vowsKept}/${o.vows.length} vows kept, fish ${o.fishLeft}, vigor ${o.vigorLeft}`,
        );
        state = step('claimQuestBoardCompletion', state, claimQuestBoardCompletion(state), { tier: o.tier });
    }

    emit({ type: 'quest-board:complete', payload: result });
    return result;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function runQuestBoardCli(argv: string[]): Promise<void> {
    const flags = parseQuestBoardArgv(argv);

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

    // Validate the board id up front (clear error before any play).
    if (!QUEST_BOARDS.some(b => b.id === flags.boardId)) {
        const ids = QUEST_BOARDS.map(b => b.id).join(', ');
        throw new Error(`Unknown board '${flags.boardId}'. Known boards: ${ids}.`);
    }

    log("Axiomancer — quest-board mini-game (The Boy's Almanac).");
    log(`Mode: ${flags.auto ? `auto (${flags.policy})` : 'manual'}  ·  runs: ${flags.runs}` +
        (flags.seed !== undefined ? `  ·  seed: ${flags.seed}` : ''));

    const results: BoardResult[] = [];
    for (let run = 1; run <= flags.runs; run++) {
        results.push(await playBoard(flags, run));
    }

    const masterwork = results.filter(r => r.tier === 'masterwork').length;
    const seaworthy = results.filter(r => r.tier === 'seaworthy').length;
    const avgDays = results.reduce((sum, r) => sum + r.daysTaken, 0) / results.length;
    const avgVows = results.reduce((sum, r) => sum + r.vowsKept, 0) / results.length;
    log('\n═══ Summary ═══');
    for (const r of results) {
        log(`  ${r.tier} — ${r.daysTaken} day(s), ${r.vowsKept} vows, fish ${r.fishLeft}, vigor ${r.vigorLeft}`);
    }
    log(`  ${masterwork}/${results.length} masterwork · ${seaworthy} seaworthy · avg ${avgDays.toFixed(1)} days · avg ${avgVows.toFixed(1)} vows`);
    emit({ type: 'quest-board:summary', payload: { results, masterwork, seaworthy, avgDays, avgVows } });
}

// Allow direct execution: `ts-node src/CLI/quest-board.cli.ts [flags]`.
if (require.main === module) {
    runQuestBoardCli(process.argv.slice(2)).catch((err) => {
        emit({ type: 'cli:exit', payload: { reason: 'error', message: String(err) } });
        process.exitCode = 1;
        log(String(err));
    });
}
