#!/usr/bin/env node

/**
 * Loot-Cache Minigame CLI ("The Reliquary") — standalone driver.
 *
 * Reachable as a SUBCOMMAND of the game CLI:
 *
 *   npm run game -- loot-cache [flags]
 *   npm run loot-cache -- [flags]        (convenience alias)
 *
 * It reuses the shared `io.ts` layer (tty inquirer / `--script` JSON /
 * `--stdin`, plus `--json-events` and `--state-log`) so a person, a replay
 * file, or an agent can all drive it through the same surface as game.cli.ts.
 *
 *   • `--policy greedy|prudent|informed`  the `--auto` policy (default informed,
 *                            the informed/balanced read; ignored when manual).
 *   • `--auto`               the balance-sim policy delves/pushes/retreats;
 *                            otherwise the player drives by hand.
 *   • `--currency <n>`       the authored lid purse (default 10); deeper
 *                            layers scale off it.
 *   • `--seed <n|str>`       seeds the engine's embedded RNG so a run is fully
 *                            reproducible (dice rolls flow from it).
 *   • `--runs <n>`           open N caches back-to-back (default 5).
 *
 * The engine is a pure, self-seeded state machine: every transition takes a
 * session and returns a NEW session, returning the SAME reference when the
 * action is illegal. The CLI exploits that — a no-op return is logged as an
 * `illegalLootCacheAction` with a full state snapshot. Logic stays in the
 * engine; this file only parses flags, prompts, dispatches verbs, and formats.
 */

import {
    prompt, emit, log, logState,
    setIoMode, setOutputMode, setStateLogPath,
} from './io';
import {
    createLootCacheSession,
    beginLootCache,
    delveLootCache,
    pushLootCachePick,
    channelLootCacheInsight,
    retreatLootCachePick,
    sealLootCache,
    continueLootCacheCard,
    claimLootCacheOutcome,
    DEFAULT_CACHE_ITEMS,
    DEFAULT_CACHE_CURRENCY,
} from '../World/LootCache';
import type {
    LootCachePolicyId,
    LootCacheSession,
} from '../World/LootCache';
import { minigameRunSeed } from '../World/seed';

// ─── Flags ──────────────────────────────────────────────────────────────────

export interface LootCacheCliFlags {
    policy: LootCachePolicyId;
    auto: boolean;
    currency: number;
    seed?: string;
    runs: number;
    // Shared io flags (parity with game.cli.ts / hazard.cli.ts).
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    stateLogPath?: string;
}

const USAGE =
    'Usage: npm run game -- loot-cache ' +
    '[--policy greedy|prudent|informed] [--auto] [--currency <n>] [--seed <n>] [--runs <n>] ' +
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

export function parseLootCacheArgv(args: string[]): LootCacheCliFlags {
    const flags: LootCacheCliFlags = {
        policy: 'informed', auto: false, currency: DEFAULT_CACHE_CURRENCY,
        runs: 5, stdin: false, jsonEvents: false,
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
            case '--policy': {
                let value: string;
                [value, i] = takeValue(args, i, '--policy');
                if (value !== 'greedy' && value !== 'prudent' && value !== 'informed') {
                    throw new Error(`--policy must be 'greedy', 'prudent', or 'informed', got '${value}'.\n${USAGE}`);
                }
                flags.policy = value;
                break;
            }
            case '--currency': {
                let value: string;
                [value, i] = takeValue(args, i, '--currency');
                const n = Number(value);
                if (!Number.isInteger(n) || n < 0) {
                    throw new Error(`--currency must be a non-negative integer, got '${value}'.\n${USAGE}`);
                }
                flags.currency = n;
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
                throw new Error(`Unknown loot-cache CLI flag: '${arg}'.\n${USAGE}`);
        }
    }
    return flags;
}

/** Derive a stable uint32 engine seed from the `--seed` flag (numeric or string). */
function seedToNumber(seed: string | undefined, runIndex: number): number {
    const seedInput = seed !== undefined && seed.trim() !== '' && Number.isFinite(Number(seed))
        ? Number(seed)
        : (seed ?? 0x52656c69);
    return minigameRunSeed(seedInput, runIndex);
}

// ─── Auto policy (mirrors lootcache.sim.ts decide*()) ─────────────────────────

type AutoVerb = 'delve' | 'seal' | 'push' | 'retreat' | 'insight';

const PRUDENT_MAX_PUSHES = 1;

/** The next verb for a policy at the current state (matches `lootcache.sim.ts`). */
function autoVerb(s: LootCacheSession, policy: LootCachePolicyId): AutoVerb {
    if (s.phase === 'delving') {
        if (s.depth >= s.layers.length) return 'seal';
        if (policy === 'prudent') return s.bittenVitae > 0 ? 'seal' : 'delve';
        return 'delve';
    }

    // phase === 'picking'
    const pick = s.pick;
    if (!pick) return 'retreat';

    if (policy === 'prudent') {
        return pick.pushes < PRUDENT_MAX_PUSHES ? 'push' : 'retreat';
    }
    if (policy === 'informed') {
        const isDeepest = pick.layerIndex === s.layers.length - 1;
        if (isDeepest && !s.insightUsed && pick.pushes === 0) return 'insight';
        return 'push';
    }
    // greedy: always push, never retreats, never channels insight.
    return 'push';
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

/** Applies a transition, logging an `illegalLootCacheAction` when it no-ops. */
function step(
    action: string,
    state: LootCacheSession,
    next: LootCacheSession,
    meta: Record<string, unknown>,
): LootCacheSession {
    if (next === state) {
        log(`  ⚠ illegal action skipped: ${action} — ${JSON.stringify(meta)}`);
        logState('illegalLootCacheAction', state, state, { attempted: { action, ...meta }, lootCacheState: state });
        return state;
    }
    logState(action, state, next, meta);
    return next;
}

function applyVerb(s: LootCacheSession, verb: AutoVerb): LootCacheSession {
    if (verb === 'delve') return step('delveLootCache', s, delveLootCache(s), { depth: s.depth });
    if (verb === 'seal') return step('sealLootCache', s, sealLootCache(s), { depth: s.depth });
    if (verb === 'push') return step('pushLootCachePick', s, pushLootCachePick(s), { depth: s.depth });
    if (verb === 'insight') return step('channelLootCacheInsight', s, channelLootCacheInsight(s), { depth: s.depth });
    return step('retreatLootCachePick', s, retreatLootCachePick(s), { depth: s.depth });
}

// ─── Manual driver (script / stdin / tty) ─────────────────────────────────────

async function manualDelve(state: LootCacheSession): Promise<LootCacheSession> {
    const layer = state.layers[state.depth];
    log(`\n  Depth ${state.depth}/${state.layers.length} — bitten ${state.bittenVitae}` +
        ` · insight ${state.insightUsed ? 'spent' : 'in hand'}`);
    if (layer) {
        log(`  Next: ${layer.name} (difficulty ${layer.difficulty})`);
        log(`  ${layer.flavor}`);
    }

    const choices: Array<{ name: string; value: string }> = [];
    if (state.depth < state.layers.length) {
        choices.push({ name: `delve ${layer?.name ?? 'the next layer'}`, value: 'delve' });
    }
    choices.push({ name: 'seal and walk away with what you have', value: 'seal' });

    const { pick } = await prompt<{ pick: string }>([{
        type: 'rawlist', name: 'pick', message: 'Action?', choices,
    }]);
    return applyVerb(state, pick as AutoVerb);
}

async function manualPicking(state: LootCacheSession): Promise<LootCacheSession> {
    const layer = state.layers[state.depth];
    const p = state.pick;
    log(`\n  Picking ${layer?.name ?? '???'} — progress ${p?.progress ?? 0}/${layer?.difficulty ?? '?'}` +
        ` · push ${p?.pushes ?? 0} · bitten ${state.bittenVitae}`);
    if (p?.lastRoll) {
        log(`  Last roll: [${p.lastRoll.dice.join(', ')}] — ${p.lastRoll.slips} slip(s), +${p.lastRoll.gained}`);
    }

    const choices: Array<{ name: string; value: string }> = [
        { name: 'push (roll the pick pool)', value: 'push' },
        { name: 'retreat (bank nothing, walk away from this layer)', value: 'retreat' },
    ];
    if (!state.insightUsed && p?.pushes === 0) {
        choices.splice(1, 0, { name: 'channel insight (bonus die on this push)', value: 'insight' });
    }

    const { pick } = await prompt<{ pick: string }>([{
        type: 'rawlist', name: 'pick', message: 'Action?', choices,
    }]);
    return applyVerb(state, pick as AutoVerb);
}

// ─── A single cache ───────────────────────────────────────────────────────────

interface CacheResult {
    policy: LootCachePolicyId;
    tier: string;
    itemsKept: number;
    currencyKept: number;
    bittenVitae: number;
    layersOpened: number;
}

async function playCache(flags: LootCacheCliFlags, runIndex: number): Promise<CacheResult> {
    const seed = seedToNumber(flags.seed, runIndex);

    log(`\n═══ Cache ${runIndex} — The Reliquary (purse ${flags.currency}${flags.auto ? `, ${flags.policy}` : ''}) ═══`);

    let state = createLootCacheSession(seed, DEFAULT_CACHE_ITEMS, flags.currency);
    logState('createLootCacheSession', null, state, { seed, currency: flags.currency, runIndex });

    state = step('beginLootCache', state, beginLootCache(state), {});

    let guard = 0;
    while (state.phase !== 'done' && guard++ < 200) {
        if (state.phase === 'card') {
            const card = state.card;
            if (card) {
                log(`  ${card.title}`);
                if (card.body) log(`  ${card.body}`);
            }
            state = step('continueLootCacheCard', state, continueLootCacheCard(state), {});
            continue;
        }
        if (state.phase === 'outcome') break;
        if (flags.auto) {
            state = applyVerb(state, autoVerb(state, flags.policy));
        } else if (state.phase === 'picking') {
            state = await manualPicking(state);
        } else {
            state = await manualDelve(state);
        }
    }

    let result: CacheResult = {
        policy: flags.policy, tier: 'incomplete', itemsKept: 0, currencyKept: 0,
        bittenVitae: state.bittenVitae, layersOpened: state.layers.filter(l => l.opened).length,
    };
    if (state.phase === 'outcome' && state.outcome) {
        const o = state.outcome;
        result = {
            policy: flags.policy,
            tier: o.tier,
            itemsKept: o.itemsKept.length,
            currencyKept: o.currencyKept,
            bittenVitae: o.bittenVitae,
            layersOpened: o.layersOpened,
        };
        log(
            `  Outcome: ${o.tier.toUpperCase()} — kept ${o.itemsKept.length} items / ${o.currencyKept} shillings` +
            (o.keepsakes.length ? `, ${o.keepsakes.length} keepsake(s)` : '') +
            (o.bittenVitae ? `, −${o.bittenVitae} vitae bitten` : '') +
            ` (${o.layersOpened} layers opened)`,
        );
        state = step('claimLootCacheOutcome', state, claimLootCacheOutcome(state), {
            tier: o.tier, currencyKept: o.currencyKept,
        });
    }

    emit({ type: 'loot-cache:complete', payload: result });
    return result;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function runLootCacheCli(argv: string[]): Promise<void> {
    const flags = parseLootCacheArgv(argv);

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

    log('Axiomancer — loot-cache mini-game (The Reliquary).');
    log(`Mode: ${flags.auto ? `auto (${flags.policy})` : 'manual'}  ·  runs: ${flags.runs}` +
        (flags.seed !== undefined ? `  ·  seed: ${flags.seed}` : ''));

    const results: CacheResult[] = [];
    for (let run = 1; run <= flags.runs; run++) {
        results.push(await playCache(flags, run));
    }

    const stung = results.filter(r => r.tier === 'stung').length;
    const totalCurrency = results.reduce((sum, r) => sum + r.currencyKept, 0);
    const totalBitten = results.reduce((sum, r) => sum + r.bittenVitae, 0);
    log('\n═══ Summary ═══');
    for (const r of results) {
        log(`  ${r.tier}: ${r.itemsKept} items / ${r.currencyKept} shillings (bitten ${r.bittenVitae}, ${r.layersOpened} layers)`);
    }
    log(`  ${stung}/${results.length} caches stung · total ${totalCurrency} shillings · ${totalBitten} vitae bitten`);
    emit({ type: 'loot-cache:summary', payload: { results, stung, totalCurrency, totalBitten } });
}

// Allow direct execution: `ts-node src/CLI/lootcache.cli.ts [flags]`.
if (require.main === module) {
    runLootCacheCli(process.argv.slice(2)).catch((err) => {
        emit({ type: 'cli:exit', payload: { reason: 'error', message: String(err) } });
        process.exitCode = 1;
        log(String(err));
    });
}
