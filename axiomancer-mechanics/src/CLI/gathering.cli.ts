#!/usr/bin/env node

/**
 * Gathering Minigame CLI ("The Gleaning") — standalone driver.
 *
 * Reachable as a SUBCOMMAND of the game CLI:
 *
 *   npm run game -- gathering [flags]
 *   npm run gathering -- [flags]         (convenience alias)
 *
 * It reuses the shared `io.ts` layer (tty inquirer / `--script` JSON /
 * `--stdin`, plus `--json-events` and `--state-log`) so a person, a replay
 * file, or an agent can all drive it through the same surface as game.cli.ts.
 *
 *   • `--site <id>`          pick a site (`mire-mint`…); prompts from the
 *                            library when omitted.
 *   • `--approach glean|strip`  the binding stance (prompted when omitted).
 *   • `--auto`               a restrained push-your-luck heuristic (the
 *                            balance sim's "balanced" bot) plays the site;
 *                            otherwise the player drives by hand.
 *   • `--seed <n|str>`       seeds the engine's embedded RNG so a run is
 *                            fully reproducible.
 *   • `--runs <n>`           play N sites back-to-back (default 5).
 *
 * The engine is a pure, self-seeded state machine: every transition takes a
 * session and returns a NEW session, returning the SAME reference when the
 * action is illegal. The CLI exploits that — a no-op return is logged as an
 * `illegalGatheringAction` with a full state snapshot. Logic stays in the
 * engine; this file only parses flags, prompts, dispatches, and formats.
 */

import {
    prompt, emit, log, logState,
    setIoMode, setOutputMode, setStateLogPath,
} from './io';
import {
    createGatheringSession,
    selectGatheringApproach,
    harvestGatheringPlot,
    descendGathering,
    payGatheringOffering,
    useGatheringTool,
    continueGatheringAfterReprisal,
    withdrawFromGathering,
    acknowledgeGatheringOutcome,
    claimGatheringSpoils,
    canPayGatheringOffering,
    gatheringHarvestWrath,
    gatheringHarvestYield,
    getGatherPlotDef,
    getGatherOfferingDef,
    getGatherToolDef,
    getGatherSiteDef,
    GATHERING_SITES,
    GATHERING_REPRISALS,
} from '../World/Gathering';
import type {
    GatherApproachKey,
    GatherSiteDef,
    GatherToolId,
    GatheringSessionState,
} from '../World/Gathering';
import { minigameRunSeed } from '../World/seed';

// ─── Flags ──────────────────────────────────────────────────────────────────

export interface GatheringCliFlags {
    siteId?: string;
    approach?: GatherApproachKey;
    auto: boolean;
    seed?: string;
    runs: number;
    // Shared io flags (parity with game.cli.ts / hazard.cli.ts).
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    stateLogPath?: string;
}

const USAGE =
    'Usage: npm run game -- gathering ' +
    '[--site <id>] [--approach glean|strip] [--auto] [--seed <n>] [--runs <n>] ' +
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

export function parseGatheringArgv(args: string[]): GatheringCliFlags {
    const flags: GatheringCliFlags = { auto: false, runs: 5, stdin: false, jsonEvents: false };
    let i = 0;
    while (i < args.length) {
        const arg = args[i]!;
        const base = arg.split('=', 1)[0]!;
        switch (base) {
            case '--auto':         flags.auto = true; i++; break;
            case '--stdin':        flags.stdin = true; i++; break;
            case '--json-events':  flags.jsonEvents = true; i++; break;
            case '--site':         [flags.siteId, i] = takeValue(args, i, '--site'); break;
            case '--seed':         [flags.seed, i] = takeValue(args, i, '--seed'); break;
            case '--script':       [flags.scriptPath, i] = takeValue(args, i, '--script'); break;
            case '--state-log':    [flags.stateLogPath, i] = takeValue(args, i, '--state-log'); break;
            case '--approach': {
                let value: string;
                [value, i] = takeValue(args, i, '--approach');
                if (value !== 'glean' && value !== 'strip') {
                    throw new Error(`--approach must be 'glean' or 'strip', got '${value}'.\n${USAGE}`);
                }
                flags.approach = value;
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
                throw new Error(`Unknown gathering CLI flag: '${arg}'.\n${USAGE}`);
        }
    }
    return flags;
}

/** Derive a stable uint32 engine seed from the `--seed` flag (numeric or string). */
function seedToNumber(seed: string | undefined, runIndex: number): number {
    const seedInput = seed !== undefined && seed.trim() !== '' && Number.isFinite(Number(seed))
        ? Number(seed)
        : (seed ?? 0x6ee21e15);
    return minigameRunSeed(seedInput, runIndex);
}

// ─── Auto policy (the balance sim's "balanced" bot, replayed verb-by-verb) ────

interface AutoCtx {
    harvestsAtDepth: number;
}

type AutoAction =
    | { type: 'harvest'; uid: string }
    | { type: 'descend' }
    | { type: 'offer'; id: string }
    | { type: 'withdraw' };

function autoAction(s: GatheringSessionState, ctx: AutoCtx): AutoAction {
    if (s.wrath >= 5) {
        const offer = s.offerings.find((o) => !o.paid && canPayGatheringOffering(s, o.id).payable);
        if (offer) return { type: 'offer', id: offer.id };
    }
    if (s.wrath >= 7 || s.turn >= 9) return { type: 'withdraw' };
    if (ctx.harvestsAtDepth >= 3 && s.depth < 2) return { type: 'descend' };
    const plots = s.spread.map((entry) => {
        const def = getGatherPlotDef(entry.plotId);
        return {
            entry,
            yieldR: gatheringHarvestYield(s, def),
            wrath: gatheringHarvestWrath(s, def),
            breath: def.trait === 'breath',
        };
    });
    if (s.wrath >= 3) {
        const soothe = plots.find((p) => p.breath);
        if (soothe) return { type: 'harvest', uid: soothe.entry.uid };
    }
    const best = plots
        .filter((p) => !p.breath && p.yieldR > 0 && s.wrath + p.wrath < 8)
        .sort((a, b) => b.yieldR - a.yieldR - (b.wrath - a.wrath) || a.wrath - b.wrath)[0];
    if (best) return { type: 'harvest', uid: best.entry.uid };
    if (s.depth < 2 && s.wrath < 6) return { type: 'descend' };
    return { type: 'withdraw' };
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

/** Applies a transition, logging an `illegalGatheringAction` when it no-ops. */
function step(
    action: string,
    state: GatheringSessionState,
    next: GatheringSessionState,
    meta: Record<string, unknown>,
): GatheringSessionState {
    if (next === state) {
        log(`  ⚠ illegal action skipped: ${action} — ${JSON.stringify(meta)}`);
        logState('illegalGatheringAction', state, state, { attempted: { action, ...meta }, gatheringState: state });
        return state;
    }
    logState(action, state, next, meta);
    return next;
}

/** Drain pending reprisal flashes, narrating each. */
function drainReprisals(state: GatheringSessionState): GatheringSessionState {
    while (state.phase === 'reprisal') {
        const event = state.pendingReprisals[0]!;
        const copy = GATHERING_REPRISALS[event.kind];
        const detail =
            event.kind === 'thorns' ? ` (−${event.bite} vitae)`
            : event.kind === 'rot' ? (event.jarHeld ? ' (the jar holds)' : ` (${event.rotLost} ${event.rotFamily ?? ''} spoil)`)
            : event.kind === 'eruption' ? ` (${event.eruptionLost} pieces clawed back, −${event.bite} vitae)`
            : '';
        log(`  ⚡ ${copy.name} — ${copy.desc}${detail}`);
        const next = continueGatheringAfterReprisal(state);
        logState('continueGatheringAfterReprisal', state, next, { kind: event.kind });
        state = next;
    }
    return state;
}

// ─── Manual driver (script / stdin / tty) ─────────────────────────────────────

async function manualTurn(state: GatheringSessionState): Promise<{ state: GatheringSessionState; done: boolean }> {
    const site = getGatherSiteDef(state.siteId);
    log(
        `\n  ${site.depthNames[state.depth]} — wrath ${state.wrath}/12 · grace ${state.grace} · ` +
        `satchel ${state.satchel.length} pieces · takings ${state.turn}`,
    );

    const choices: Array<{ name: string; value: string }> = [];
    for (const entry of state.spread) {
        const def = getGatherPlotDef(entry.plotId);
        const wrath = gatheringHarvestWrath(state, def);
        const yieldR = gatheringHarvestYield(state, def);
        const tag = def.trait === 'breath'
            ? `tend ${def.name} [wrath ${wrath}]`
            : `take ${def.name} [+${yieldR} ${def.family}, wrath +${wrath}${def.trait ? `, ${def.trait}` : ''}]`;
        choices.push({ name: tag, value: `harvest:${entry.uid}` });
    }
    for (const o of state.offerings) {
        if (o.paid) continue;
        const def = getGatherOfferingDef(o.id);
        const payable = canPayGatheringOffering(state, o.id).payable;
        const cost = def.demand.kind === 'material' ? `a ${def.demand.family} piece` : `${def.demand.amount} ${def.demand.kind}`;
        choices.push({ name: `offer ${def.name} [${cost}]${payable ? '' : ' (unpayable)'}`, value: `offer:${o.id}` });
    }
    for (const t of state.tools) {
        if (t.used) continue;
        const def = getGatherToolDef(t.id);
        choices.push({ name: `tool ${def.name} — ${def.desc}`, value: `tool:${t.id}` });
    }
    if (state.depth < 2) {
        choices.push({ name: `descend to ${site.depthNames[state.depth + 1]}`, value: 'descend' });
    }
    choices.push({ name: `withdraw with ${state.satchel.length} pieces`, value: 'withdraw' });

    const { pick } = await prompt<{ pick: string }>([{
        type: 'rawlist', name: 'pick', message: 'Action?', choices,
    }]);

    const [verb, a] = pick.split(':');
    if (verb === 'harvest') {
        return { state: step('harvestGatheringPlot', state, harvestGatheringPlot(state, a!), { uid: a }), done: false };
    }
    if (verb === 'offer') {
        return { state: step('payGatheringOffering', state, payGatheringOffering(state, a!), { offeringId: a }), done: false };
    }
    if (verb === 'tool') {
        return { state: step('useGatheringTool', state, useGatheringTool(state, a! as GatherToolId), { toolId: a }), done: false };
    }
    if (verb === 'descend') {
        return { state: step('descendGathering', state, descendGathering(state), {}), done: false };
    }
    return { state: step('withdrawFromGathering', state, withdrawFromGathering(state), {}), done: true };
}

// ─── A single site ────────────────────────────────────────────────────────────

interface SiteResult {
    siteId: string;
    approach: GatherApproachKey;
    tier: string;
    keptPieces: number;
    keptRichness: number;
    wrath: number;
    grace: number;
}

async function pickSite(flags: GatheringCliFlags): Promise<GatherSiteDef> {
    if (flags.siteId) {
        const def = GATHERING_SITES.find((s) => s.id === flags.siteId);
        if (!def) {
            const known = GATHERING_SITES.map((s) => s.id).join(', ');
            throw new Error(`Unknown site id '${flags.siteId}'. Known: ${known}.`);
        }
        return def;
    }
    const { id } = await prompt<{ id: string }>([{
        type: 'rawlist', name: 'id', message: 'Which site?',
        choices: GATHERING_SITES.map((s) => ({ name: `${s.id} — ${s.title}`, value: s.id })),
    }]);
    return getGatherSiteDef(id);
}

async function pickApproach(flags: GatheringCliFlags): Promise<GatherApproachKey> {
    if (flags.approach) return flags.approach;
    const { approach } = await prompt<{ approach: GatherApproachKey }>([{
        type: 'rawlist', name: 'approach', message: 'How much will you take?',
        choices: [
            { name: 'Glean — the tender hand (capped yields, grace, gentler eruption)', value: 'glean' },
            { name: 'Strip — the stripping hand (+1 richness, +1 wrath, plunder coin)', value: 'strip' },
        ],
    }]);
    return approach;
}

async function playSite(flags: GatheringCliFlags, runIndex: number): Promise<SiteResult> {
    const site = await pickSite(flags);
    const approach = await pickApproach(flags);
    const seed = seedToNumber(flags.seed, runIndex);

    log(`\n═══ Run ${runIndex} — ${site.id}: ${site.title} (${approach}) ═══`);
    log(`  ${site.scenario}`);

    let state = createGatheringSession(seed, site.id);
    logState('createGatheringSession', null, state, { siteId: site.id, seed, runIndex });

    state = selectGatheringApproach(state, approach);
    logState('selectGatheringApproach', null, state, { approach });

    const ctx: AutoCtx = { harvestsAtDepth: 0 };
    let guard = 0;
    while (state.phase === 'foraging' && guard++ < 200) {
        if (flags.auto) {
            const action = autoAction(state, ctx);
            if (action.type === 'harvest') {
                const before = state.metrics.harvests;
                state = step('harvestGatheringPlot', state, harvestGatheringPlot(state, action.uid), { uid: action.uid });
                if (state.metrics.harvests > before) ctx.harvestsAtDepth += 1;
            } else if (action.type === 'descend') {
                const next = descendGathering(state);
                if (next === state) {
                    state = step('withdrawFromGathering', state, withdrawFromGathering(state), {});
                } else {
                    state = step('descendGathering', state, next, {});
                    ctx.harvestsAtDepth = 0;
                }
            } else if (action.type === 'offer') {
                const next = payGatheringOffering(state, action.id);
                state = next === state
                    ? step('withdrawFromGathering', state, withdrawFromGathering(state), {})
                    : step('payGatheringOffering', state, next, { offeringId: action.id });
            } else {
                state = step('withdrawFromGathering', state, withdrawFromGathering(state), {});
            }
        } else {
            const turn = await manualTurn(state);
            state = turn.state;
        }
        state = drainReprisals(state);
    }

    let tier = 'incomplete';
    let keptPieces = 0;
    let keptRichness = 0;
    if (state.phase === 'outcome' && state.outcome) {
        const o = state.outcome;
        tier = o.tier;
        keptPieces = o.kept.length;
        keptRichness = o.kept.reduce((sum, p) => sum + p.richness, 0);
        log(
            `  Outcome: ${tier.toUpperCase()} — kept ${keptPieces} pieces (${keptRichness} richness)` +
            (o.lost.length ? `, lost ${o.lost.length} to the site` : '') +
            (o.sets.length ? `, sets: ${o.sets.join('/')}` : '') +
            (o.shillings ? `, +${o.shillings} shillings` : '') +
            (o.bittenVitae ? `, −${o.bittenVitae} vitae bitten` : ''),
        );
        state = acknowledgeGatheringOutcome(state);
        state = claimGatheringSpoils(state);
        logState('claimGatheringSpoils', null, state, { tier, keptPieces, keptRichness });
    }

    const result: SiteResult = {
        siteId: site.id, approach, tier, keptPieces, keptRichness,
        wrath: state.wrath, grace: state.grace,
    };
    emit({ type: 'gathering:complete', payload: result });
    return result;
}

// ─── Entry point ────────────────────────────────────────────────────────────────

export async function runGatheringCli(argv: string[]): Promise<void> {
    const flags = parseGatheringArgv(argv);

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

    log('Axiomancer — gathering mini-game (The Gleaning).');
    log(`Mode: ${flags.auto ? 'auto' : 'manual'}  ·  runs: ${flags.runs}` +
        (flags.seed !== undefined ? `  ·  seed: ${flags.seed}` : ''));

    const results: SiteResult[] = [];
    for (let run = 1; run <= flags.runs; run++) {
        results.push(await playSite(flags, run));
    }

    const totalRichness = results.reduce((sum, r) => sum + r.keptRichness, 0);
    const clean = results.filter((r) => r.tier === 'communion' || r.tier === 'laden').length;
    log('\n═══ Summary ═══');
    for (const r of results) {
        log(`  ${r.siteId} (${r.approach}): ${r.tier} — ${r.keptPieces} pieces / ${r.keptRichness} richness (wrath ${r.wrath}, grace ${r.grace})`);
    }
    log(`  ${clean}/${results.length} sites left clean · total richness ${totalRichness}`);
    emit({ type: 'gathering:summary', payload: { results, totalRichness, clean } });
}

// Allow direct execution: `ts-node src/CLI/gathering.cli.ts [flags]`.
if (require.main === module) {
    runGatheringCli(process.argv.slice(2)).catch((err) => {
        emit({ type: 'cli:exit', payload: { reason: 'error', message: String(err) } });
        process.exitCode = 1;
        log(String(err));
    });
}
