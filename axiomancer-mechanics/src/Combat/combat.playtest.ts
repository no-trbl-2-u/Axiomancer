/**
 * Playtest harness — the stage × policy × deck matrix for Hazard-Pattern
 * Combat.
 *
 * A playtest CELL freezes one measurement: a campaign stage (player power +
 * enemy roster from `combat.stage-profiles.ts`), one enemy, one scripted
 * policy (`combat.sim-policies.ts`), one deck selection
 * (`combat.deck-draft.ts`), a run count, and a seed. The MATRIX sweeps cells
 * across stages/policies/decks and aggregates stage summaries plus card
 * coverage, so the balance loops can see the whole campaign at once.
 *
 * Doctrine (CLAUDE.md): status effects are the MAIN fun — HP is the sole win
 * condition and status is the EFFICIENT way to drop it. The matrix exists to
 * witness that at EVERY stage: `statusEngagement` and `dotHpFraction` sit next
 * to `winRate` in every summary, and the deliberately weak `aggro-brute`
 * baseline is expected to underperform the status policies.
 *
 * Sandbox cards: any content registered via `src/Cards/cards.sandbox` is live
 * here automatically — `listSandboxCards()` is merged into stage pools, deck
 * drafts, and the coverage universe, so `/deck-tuning` A/B runs need no extra
 * plumbing.
 *
 * Determinism: identical specs produce identical results. Per-run engine
 * seeds are `spec.seed + runIndex` (via the sim); deck resolution draws from a
 * LOCAL Park-Miller LCG derived from `spec.seed` — it never touches the global
 * RNG singleton and never calls `Math.random`, so drafting a deck can never
 * perturb the seeded encounter stream (or another cell).
 */

import { listSandboxCards } from '../Cards/cards.sandbox';
import type { Character } from '../Character/types';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';
import type { Enemy } from '../Enemy/types';
import { deepClone } from '../Utils';
import {
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES, buildStagePlayer, stageEligibleCardIds,
    type CombatStageId, type CombatStageProfile,
} from './combat.stage-profiles';
import {
    draftCombatDeck, resolveDeckSelection, type CombatDeckSelection,
} from './combat.deck-draft';
import {
    COMBAT_DECK_PRESET_ORDER, getDeckPreset, type CombatDeckFocus,
} from './combat.starter-deck-presets';
import { COMBAT_SIM_POLICIES, type CombatSimPolicy, type CombatSimPolicyId } from './combat.sim-policies';
import {
    simulateHazardPatternCombatDetailed,
    type CombatCardUsage, type CombatSimStats, type WinPathCounts,
} from './combat.encounter.sim';

/** One frozen measurement: stage × enemy × policy × deck × runs × seed. */
export interface PlaytestCellSpec {
    stage: CombatStageId;
    /** Key of `ENEMY_REGISTRY`. */
    enemySlug: string;
    policyId: CombatSimPolicyId;
    /** 'policy-pick' is resolved HERE: a draft with the policy's
     *  `preferredFocus`, seeded from `seed`. */
    deck: CombatDeckSelection;
    runs: number;
    seed: number;
}

/** A cell's outcome: the resolved deck, aggregate stats, per-card telemetry. */
export interface PlaytestCellResult {
    spec: PlaytestCellSpec;
    /** The deck actually used (resolved from `spec.deck`). */
    deckCardIds: string[];
    stats: CombatSimStats;
    cardUsage: Record<string, CombatCardUsage>;
}

export interface PlaytestMatrixOptions {
    /** Default: all four stages in `COMBAT_STAGE_ORDER`. */
    stages?: readonly CombatStageId[];
    /** Default: the two tuned balance witnesses `['greedy', 'blind']`. */
    policies?: readonly CombatSimPolicyId[];
    /** Default: `[{ kind: 'policy-pick' }]`. */
    decks?: readonly CombatDeckSelection[];
    /** Cap the enemy roster per stage; default: the whole roster. */
    enemiesPerStage?: number;
    /** Restrict every stage's roster to these slugs (the CLI's `--enemy`);
     *  applied BEFORE `enemiesPerStage`. Stages left with an empty roster
     *  simply contribute no cells. Default: no restriction. */
    enemySlugs?: readonly string[];
    /** Default 60. */
    runsPerCell?: number;
    /** Default 1. Every cell gets the same base seed (cells stay independent —
     *  each derives its own deck rng and per-run engine seeds from it). */
    seed?: number;
}

/** Runs-weighted aggregate of every cell in one stage. */
export interface PlaytestStageSummary {
    stage: CombatStageId;
    cells: number;
    winRate: number;
    statusEngagement: number;
    dotHpFraction: number;
    avgRounds: number;
    /** Summed win-path counts across the stage's cells (un-collapsed). */
    winPathCounts: WinPathCounts;
    /** Runs-weighted deck utilization (distinct-played / distinct-deck). */
    deckUtilization: number;
    /** Runs-weighted normalized play entropy (decision spread). */
    usageEntropy: number;
    /** The single card with the largest attributed enemy-HP share across the
     *  stage's cells, and that share (the dominant-card witness). '' when none. */
    dominantCardId: string;
    dominantCardShare: number;
}

export interface PlaytestReport {
    cells: PlaytestCellResult[];
    /** Aggregated over cells, weighted by runs. */
    stageSummaries: PlaytestStageSummary[];
    /** Coverage vs the union of eligible pools (library + sandbox) of the
     *  stages run: which cards were ever played vs never touched. `deadCardRate`
     *  is `neverPlayed / (exercised + neverPlayed)` — the dead-card witness as a
     *  first-class number (0 = every eligible card saw a play). */
    cardCoverage: { exercised: string[]; neverPlayed: string[]; deadCardRate: number };
}

/**
 * A tiny local Park-Miller LCG (same constants as `src/Utils/rng.ts`), used
 * ONLY for deck resolution. Local by design: drafting must not consume or
 * reseed the global RNG singleton, so a cell's deck is a pure function of its
 * seed and the engine's per-run streams stay untouched. Never `Math.random`.
 */
function makeDeckRng(seed: number): () => number {
    let state = Math.abs(Math.floor(seed)) % 2147483647 || 1;
    return () => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
}

/** Resolves a cell's deck selection, merging registered sandbox cards into
 *  draft pools ('policy-pick' + 'draft'). Preset/cards selections see sandbox
 *  content through `getCardById` (the sandbox hook) without extra plumbing. */
function resolveCellDeck(
    selection: CombatDeckSelection,
    stage: CombatStageProfile,
    policy: CombatSimPolicy,
    rng: () => number,
): string[] {
    const extraCards = listSandboxCards();
    if (selection.kind === 'policy-pick') {
        return draftCombatDeck({ focus: policy.preferredFocus, stage, rng, extraCards });
    }
    if (selection.kind === 'draft') {
        return draftCombatDeck({ focus: selection.focus, size: selection.size, stage, rng, extraCards });
    }
    return resolveDeckSelection(selection, stage, rng);
}

/**
 * Grants every non-synthetic card in `deckCardIds` to the player's
 * `knownCards` (in place, duplicates removed). The engine's `executeCard`
 * refuses to fire a card the player does not know, and an explicit deck
 * selection (preset / draft / sandbox cards) may reach beyond what the player
 * has learned — the maturity gate belongs to deck SELECTION, not the engine
 * check, so every deck consumer (harness cells, the combat CLI's `--deck`)
 * grants the deck before the encounter.
 */
export function grantDeckKnowledge(player: Character, deckCardIds: readonly string[]): void {
    player.knownCards = [...new Set([
        ...player.knownCards,
        ...deckCardIds,
    ])];
}

/** Runs one playtest cell. Deterministic: identical spec → identical result. */
export function runPlaytestCell(spec: PlaytestCellSpec): PlaytestCellResult {
    const stage = COMBAT_STAGE_PROFILES[spec.stage];
    if (!stage) throw new Error(`Unknown combat stage '${String(spec.stage)}'`);
    const policy = COMBAT_SIM_POLICIES[spec.policyId];
    if (!policy) throw new Error(`Unknown combat sim policy '${String(spec.policyId)}'`);
    const enemyBase = (ENEMY_REGISTRY as Record<string, Enemy>)[spec.enemySlug];
    if (!enemyBase) throw new Error(`Unknown enemy slug '${spec.enemySlug}' (not in ENEMY_REGISTRY)`);

    const deckCardIds = resolveCellDeck(spec.deck, stage, policy, makeDeckRng(spec.seed));
    const player = buildStagePlayer(stage);
    // The player must KNOW every card in the resolved deck or the engine
    // refuses to play it: explicit selections (preset/cards) may reach above
    // the stage's learned pool, and drafted sandbox cards are never in it.
    // The stage maturity gate lives in DRAFTING (the pool), not in the
    // engine's knownCards check — so grant the deck's non-synthetic cards.
    grantDeckKnowledge(player, deckCardIds);
    const enemy = deepClone(enemyBase);
    const { stats, cardUsage } = simulateHazardPatternCombatDetailed({
        player, enemy,
        runs: spec.runs,
        startSeed: spec.seed,
        policy: spec.policyId,
        deck: deckCardIds,
    });
    return { spec, deckCardIds, stats, cardUsage };
}

function summarizeStage(stage: CombatStageId, cells: readonly PlaytestCellResult[]): PlaytestStageSummary {
    const mine = cells.filter(c => c.spec.stage === stage);
    let runs = 0, win = 0, engagement = 0, dot = 0, rounds = 0, util = 0, entropy = 0;
    const winPathCounts: WinPathCounts = {
        victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0,
    };
    // Dominant card at the stage level: the biggest per-card share seen in any
    // of the stage's cells (the worst-case single-card concentration).
    let dominantCardId = '';
    let dominantCardShare = 0;
    for (const cell of mine) {
        const weight = cell.stats.runs;
        runs += weight;
        win += cell.stats.winRate * weight;
        engagement += cell.stats.statusEngagement * weight;
        dot += cell.stats.dotHpFraction * weight;
        rounds += cell.stats.avgRounds * weight;
        util += cell.stats.deckUtilization * weight;
        entropy += cell.stats.usageEntropy * weight;
        for (const key of Object.keys(winPathCounts) as (keyof WinPathCounts)[]) {
            winPathCounts[key] += cell.stats.winPathCounts[key];
        }
        if (cell.stats.dominantCardShare > dominantCardShare) {
            dominantCardShare = cell.stats.dominantCardShare;
            dominantCardId = cell.stats.dominantCardId;
        }
    }
    const denom = Math.max(1, runs);
    return {
        stage,
        cells: mine.length,
        winRate: win / denom,
        statusEngagement: engagement / denom,
        dotHpFraction: dot / denom,
        avgRounds: rounds / denom,
        winPathCounts,
        deckUtilization: util / denom,
        usageEntropy: entropy / denom,
        dominantCardId,
        dominantCardShare,
    };
}

/**
 * Sweeps the stage × enemy × policy × deck matrix and aggregates stage
 * summaries + card coverage. Deterministic for identical options.
 */
export function runPlaytestMatrix(options: PlaytestMatrixOptions = {}): PlaytestReport {
    const stages = options.stages ?? COMBAT_STAGE_ORDER;
    const policies: readonly CombatSimPolicyId[] = options.policies ?? ['greedy', 'blind'];
    const decks: readonly CombatDeckSelection[] = options.decks ?? [{ kind: 'policy-pick' }];
    const runsPerCell = options.runsPerCell ?? 60;
    const seed = options.seed ?? 1;

    const cells: PlaytestCellResult[] = [];
    for (const stageId of stages) {
        const profile = COMBAT_STAGE_PROFILES[stageId];
        if (!profile) throw new Error(`Unknown combat stage '${String(stageId)}'`);
        const restricted = options.enemySlugs !== undefined
            ? profile.enemySlugs.filter(slug => options.enemySlugs!.includes(slug))
            : profile.enemySlugs;
        const roster = options.enemiesPerStage !== undefined
            ? restricted.slice(0, Math.max(0, options.enemiesPerStage))
            : restricted;
        for (const enemySlug of roster) {
            for (const policyId of policies) {
                for (const deck of decks) {
                    cells.push(runPlaytestCell({ stage: stageId, enemySlug, policyId, deck, runs: runsPerCell, seed }));
                }
            }
        }
    }

    const stageSummaries = stages.map(stageId => summarizeStage(stageId, cells));

    // Coverage universe: union of the eligible pools (library + registered
    // sandbox cards) of the stages that actually ran.
    const extraCards = listSandboxCards();
    const pool = new Set<string>();
    for (const stageId of stages) {
        for (const id of stageEligibleCardIds(COMBAT_STAGE_PROFILES[stageId], extraCards)) pool.add(id);
    }
    const played = new Set<string>();
    for (const cell of cells) {
        for (const usage of Object.values(cell.cardUsage)) {
            if (usage.plays > 0) played.add(usage.cardId);
        }
    }
    const exercised = [...pool].filter(id => played.has(id)).sort();
    const neverPlayed = [...pool].filter(id => !played.has(id)).sort();
    const poolSize = exercised.length + neverPlayed.length;
    const deadCardRate = poolSize > 0 ? neverPlayed.length / poolSize : 0;

    return { cells, stageSummaries, cardCoverage: { exercised, neverPlayed, deadCardRate } };
}

function deckLabel(selection: CombatDeckSelection): string {
    switch (selection.kind) {
        case 'preset': return `preset:${selection.presetId}`;
        case 'draft': return `draft:${selection.focus}`;
        case 'cards': return `cards(${selection.cardIds.length})`;
        case 'policy-pick': return 'policy-pick';
    }
}

const pct = (n: number): string => `${(n * 100).toFixed(0).padStart(3)}%`;

/**
 * Renders the report as aligned text tables in the combat-sim CLI's visual
 * style. `opts.perCard` appends the per-card usage table (aggregated over all
 * cells) — the dead-card detector for `/deck-tuning`.
 */
export function formatPlaytestReport(report: PlaytestReport, opts?: { perCard?: boolean }): string {
    const lines: string[] = [];
    lines.push('Hazard combat playtest matrix');
    lines.push('(win = enemy HP→0 or befriend-spare; V/M/D/R = victory/mercy/defeat/retreat;');
    lines.push(' statusEng + dotFrac are the doctrine witnesses: status play is the efficient path;');
    lines.push(' util=deck utilization, H=play entropy, dom=dominant-card HP share (>70% = spam))');
    lines.push('');

    const header = `  ${'stage'.padEnd(11)}${'enemy'.padEnd(26)}${'policy'.padEnd(13)}${'deck'.padEnd(22)}`
        + `${'win'.padStart(5)}  ${'V/M/D/R'.padEnd(12)}${'rounds'.padStart(6)}`
        + `${'statusEng'.padStart(10)}${'dotFrac'.padStart(8)}${'strike'.padStart(7)}`
        + `${'util'.padStart(6)}${'H'.padStart(5)}${'dom'.padStart(6)}`;
    lines.push(header);
    for (const cell of report.cells) {
        const s = cell.stats;
        lines.push(
            `  ${cell.spec.stage.padEnd(11)}${cell.spec.enemySlug.padEnd(26)}${cell.spec.policyId.padEnd(13)}`
            + `${deckLabel(cell.spec.deck).padEnd(22)}`
            + `${pct(s.winRate)}  ${`${s.victories}/${s.mercies}/${s.defeats}/${s.retreats}`.padEnd(12)}`
            + `${s.avgRounds.toFixed(1).padStart(6)}`
            + `${pct(s.statusEngagement).padStart(10)}${pct(s.dotHpFraction).padStart(8)}${pct(s.strikeFraction).padStart(7)}`
            + `${pct(s.deckUtilization).padStart(6)}${s.usageEntropy.toFixed(2).padStart(5)}${pct(s.dominantCardShare).padStart(6)}`,
        );
    }

    // Un-collapsed win-path mix per cell (V/M/D/R folds the three merciful
    // resolutions — this exposes the theme's OWN win path: capitulate / concede).
    lines.push('');
    lines.push('Win-path mix (per cell — victory/mercy/capitulate/concede/defeat):');
    for (const cell of report.cells) {
        const w = cell.stats.winPathCounts;
        lines.push(
            `  ${cell.spec.stage.padEnd(11)}${cell.spec.enemySlug.padEnd(26)}${cell.spec.policyId.padEnd(13)}`
            + `${deckLabel(cell.spec.deck).padEnd(22)}`
            + `vic=${String(w.victory).padStart(3)} mer=${String(w.mercy).padStart(3)} `
            + `cap=${String(w.capitulate).padStart(3)} con=${String(w.concede).padStart(3)} `
            + `def=${String(w.defeat).padStart(3)}`,
        );
    }

    lines.push('');
    lines.push('Stage summaries (runs-weighted):');
    for (const summary of report.stageSummaries) {
        const w = summary.winPathCounts;
        lines.push(
            `  ${summary.stage.padEnd(11)}cells=${String(summary.cells).padEnd(4)}`
            + `win=${pct(summary.winRate)}  statusEng=${pct(summary.statusEngagement)}`
            + `  dotFrac=${pct(summary.dotHpFraction)}  rounds=${summary.avgRounds.toFixed(1)}`
            + `  util=${pct(summary.deckUtilization)}  H=${summary.usageEntropy.toFixed(2)}`
            + `  dom=${pct(summary.dominantCardShare)}${summary.dominantCardId ? `(${summary.dominantCardId})` : ''}`,
        );
        lines.push(
            `             win-path: vic=${w.victory} mer=${w.mercy} cap=${w.capitulate}`
            + ` con=${w.concede} def=${w.defeat}`,
        );
    }

    const totalPool = report.cardCoverage.exercised.length + report.cardCoverage.neverPlayed.length;
    lines.push('');
    lines.push(
        `Card coverage: ${report.cardCoverage.exercised.length}/${totalPool} eligible cards exercised`
        + ` (dead-card rate ${pct(report.cardCoverage.deadCardRate)})`,
    );
    if (report.cardCoverage.neverPlayed.length > 0) {
        lines.push(`  never played: ${report.cardCoverage.neverPlayed.join(', ')}`);
    }

    if (opts?.perCard) {
        const totals = new Map<string, CombatCardUsage>();
        for (const cell of report.cells) {
            for (const usage of Object.values(cell.cardUsage)) {
                const agg = totals.get(usage.cardId) ?? {
                    cardId: usage.cardId, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
                    fizzles: 0, lineContribution: { free: 0, paid: 0 }, unplayedAtPhaseEnd: 0,
                };
                agg.plays += usage.plays;
                agg.bottomPlays += usage.bottomPlays;
                agg.topPlays += usage.topPlays;
                agg.statusLands += usage.statusLands;
                agg.discards += usage.discards;
                // WS1.1 line telemetry — optional on the row type, always
                // present on these aggregates (?? 0 tolerates older shapes).
                agg.fizzles = (agg.fizzles ?? 0) + (usage.fizzles ?? 0);
                agg.unplayedAtPhaseEnd = (agg.unplayedAtPhaseEnd ?? 0) + (usage.unplayedAtPhaseEnd ?? 0);
                agg.lineContribution!.free += usage.lineContribution?.free ?? 0;
                agg.lineContribution!.paid += usage.lineContribution?.paid ?? 0;
                totals.set(usage.cardId, agg);
            }
        }
        const rows = [...totals.values()].sort((a, b) => b.plays - a.plays || a.cardId.localeCompare(b.cardId));
        lines.push('');
        lines.push('Per-card usage (all cells):');
        lines.push('(free%/paid% = share of plays per line; fizz% = fizzled attempts / (plays+fizzles);');
        lines.push(' unpl% = hand entries discarded un-played at phase end / (plays+unplayed);');
        lines.push(' hpF/hpP = HP swing (immediate + projected DoT) attributed to the FREE/PAID line)');
        lines.push(
            `  ${'card'.padEnd(28)}${'plays'.padStart(6)}${'bottom'.padStart(7)}${'top'.padStart(6)}${'statusLands'.padStart(12)}${'discards'.padStart(9)}`
            + `${'free%'.padStart(7)}${'paid%'.padStart(7)}${'fizz%'.padStart(7)}${'unpl%'.padStart(7)}${'hpF'.padStart(8)}${'hpP'.padStart(8)}`,
        );
        for (const row of rows) {
            const fizzles = row.fizzles ?? 0;
            const unplayed = row.unplayedAtPhaseEnd ?? 0;
            const freePct = row.plays > 0 ? row.topPlays / row.plays : 0;
            const paidPct = row.plays > 0 ? row.bottomPlays / row.plays : 0;
            const fizzPct = row.plays + fizzles > 0 ? fizzles / (row.plays + fizzles) : 0;
            const unplPct = row.plays + unplayed > 0 ? unplayed / (row.plays + unplayed) : 0;
            lines.push(
                `  ${row.cardId.padEnd(28)}${String(row.plays).padStart(6)}${String(row.bottomPlays).padStart(7)}`
                + `${String(row.topPlays).padStart(6)}${String(row.statusLands).padStart(12)}${String(row.discards).padStart(9)}`
                + `${pct(freePct).padStart(7)}${pct(paidPct).padStart(7)}${pct(fizzPct).padStart(7)}${pct(unplPct).padStart(7)}`
                + `${String(Math.round(row.lineContribution?.free ?? 0)).padStart(8)}`
                + `${String(Math.round(row.lineContribution?.paid ?? 0)).padStart(8)}`,
            );
        }
    }

    lines.push('');
    return lines.join('\n');
}

// ─── CLI-facing helpers (UI-free logic the CLIs delegate to) ─────────────────

/** The deck-selection flag grammar shared by `npm run combat-playtest` and
 *  `npm run combat -- --deck`. */
export const DECK_SELECTION_GRAMMAR =
    'preset:<id> | draft:<focus> | cards:<id,id,...> | policy-pick';

/** Every draftable focus (the `CombatDeckFocus` union, as data for parsing). */
const DECK_DRAFT_FOCUSES: readonly CombatDeckFocus[] = Object.freeze([
    'dot', 'control', 'utility', 'damage', 'balanced',
]);

/**
 * Parses the CLI deck-selection grammar into a `CombatDeckSelection`.
 * Throws an `Error` with a corrective message (grammar + known values) on any
 * invalid input — preset ids and draft focuses are validated eagerly so a typo
 * fails loudly instead of silently falling back to `buildCombatDeck`.
 */
export function parseDeckSelectionArg(raw: string): CombatDeckSelection {
    const value = raw.trim();
    if (value === 'policy-pick') return { kind: 'policy-pick' };
    if (value.startsWith('preset:')) {
        const presetId = value.slice('preset:'.length).trim();
        if (!getDeckPreset(presetId)) {
            throw new Error(
                `Unknown deck preset '${presetId}'. Known presets: ${COMBAT_DECK_PRESET_ORDER.join(', ')}`,
            );
        }
        return { kind: 'preset', presetId };
    }
    if (value.startsWith('draft:')) {
        const focus = value.slice('draft:'.length).trim();
        if (!(DECK_DRAFT_FOCUSES as readonly string[]).includes(focus)) {
            throw new Error(
                `Unknown draft focus '${focus}'. Known focuses: ${DECK_DRAFT_FOCUSES.join(', ')}`,
            );
        }
        return { kind: 'draft', focus: focus as CombatDeckFocus };
    }
    if (value.startsWith('cards:')) {
        const cardIds = value.slice('cards:'.length).split(',').map(s => s.trim()).filter(Boolean);
        if (cardIds.length === 0) {
            throw new Error(`'cards:' needs at least one card id. Grammar: ${DECK_SELECTION_GRAMMAR}`);
        }
        return { kind: 'cards', cardIds };
    }
    throw new Error(`Unknown deck selection '${raw}'. Grammar: ${DECK_SELECTION_GRAMMAR}`);
}

/**
 * A seeded rng for deck resolution OUTSIDE the matrix (the interactive combat
 * CLI's `--deck` + `--seed`): the same local Park-Miller stream the playtest
 * cells use, so a CLI-drafted deck is a pure function of the seed and never
 * touches (or reseeds) the global RNG singleton the encounter itself draws on.
 */
export function createDeckSelectionRng(seed: number): () => number {
    return makeDeckRng(seed);
}
