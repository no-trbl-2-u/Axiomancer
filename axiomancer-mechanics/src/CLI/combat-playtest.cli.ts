#!/usr/bin/env node

/**
 * Hazard-Pattern Combat playtest CLI — the stage x policy x deck matrix.
 *
 * Sweeps `runPlaytestMatrix` (campaign stages x sim policies x deck
 * selections) and prints the aligned report — win rates NEXT TO the doctrine
 * witnesses (statusEngagement, dotHpFraction), because status effects are the
 * MAIN fun: HP is the sole win condition and status is the EFFICIENT way to
 * drop it. Low status engagement is a balance failure even when win rates
 * look healthy.
 *
 * Usage:
 *   npm run combat-playtest                                        # all stages, greedy witness, policy-pick decks
 *   npm run combat-playtest -- --stage=early --policy=all
 *   npm run combat-playtest -- --policy=dot-weaver --deck=draft:dot
 *   npm run combat-playtest -- --deck=preset:dot-erosion --runs=100 --seed=7
 *   npm run combat-playtest -- --enemy=coastal-tyrant --cards
 *   npm run combat-playtest -- --sandbox=forge-example --json
 *
 * Flags (house style: `--k=v` for values, bare `--k` for switches):
 *   --stage=early|mid|late|impossible|all   stages to sweep (default all)
 *   --policy=<id|all>                       sim policy roster (default greedy)
 *   --deck=preset:<id>|draft:<focus>|cards:a,b,c|policy-pick
 *                                           deck selection (default policy-pick)
 *   --enemy=<slug>                          restrict rosters to one enemy
 *   --runs=N                                runs per cell (default 60)
 *   --seed=N                                base seed (default 1)
 *   --sandbox=<setId>                       apply a sandbox card set before running
 *   --cards                                 append the per-card usage table
 *   --json                                  print the PlaytestReport as JSON — and
 *                                           NOTHING else (agent consumption)
 *
 * UI only: parse flags → runPlaytestMatrix → print. All logic lives in
 * `src/Combat/combat.playtest.ts`.
 */

import { applySandboxSet, listSandboxSets } from '../Cards/cards.sandbox-sets';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';
import {
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES, isCombatStageId,
    type CombatStageId,
} from '../Combat/combat.stage-profiles';
import {
    COMBAT_SIM_POLICY_ORDER, getSimPolicy,
    type CombatSimPolicyId,
} from '../Combat/combat.sim-policies';
import type { CombatDeckSelection } from '../Combat/combat.deck-draft';
import {
    formatPlaytestReport, parseDeckSelectionArg, runPlaytestMatrix,
} from '../Combat/combat.playtest';

const flag = (k: string): string | undefined => {
    const a = process.argv.find(x => x.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : undefined;
};
const has = (k: string): boolean => process.argv.includes(`--${k}`);

function fail(message: string): never {
    process.stderr.write(`${message}\n`);
    process.exit(1);
}

function parseStages(raw: string): CombatStageId[] {
    if (raw === 'all') return [...COMBAT_STAGE_ORDER];
    if (isCombatStageId(raw)) return [raw];
    return fail(`Unknown --stage '${raw}'. Valid: ${[...COMBAT_STAGE_ORDER, 'all'].join('|')}`);
}

function parsePolicies(raw: string): CombatSimPolicyId[] {
    if (raw === 'all') return [...COMBAT_SIM_POLICY_ORDER];
    const policy = getSimPolicy(raw);
    if (!policy) return fail(`Unknown --policy '${raw}'. Valid: ${[...COMBAT_SIM_POLICY_ORDER, 'all'].join('|')}`);
    return [policy.id];
}

function parseDeck(raw: string): CombatDeckSelection {
    try {
        return parseDeckSelectionArg(raw);
    } catch (err) {
        return fail(err instanceof Error ? err.message : String(err));
    }
}

function main(): void {
    const json = has('json');
    const perCard = has('cards');

    let stages = parseStages(flag('stage') ?? 'all');
    const policies = parsePolicies(flag('policy') ?? 'greedy');
    const deckArg = flag('deck') ?? 'policy-pick';
    const deck = parseDeck(deckArg);

    const runs = Number(flag('runs') ?? '60');
    if (!Number.isInteger(runs) || runs < 1) fail('--runs must be a positive integer.');
    const seed = Number(flag('seed') ?? '1');
    if (!Number.isFinite(seed)) fail('--seed must be a number.');

    const enemySlug = flag('enemy');
    if (enemySlug !== undefined) {
        if (!(enemySlug in ENEMY_REGISTRY)) {
            fail(`Unknown --enemy '${enemySlug}'. Valid: ${Object.keys(ENEMY_REGISTRY).join(', ')}`);
        }
        stages = stages.filter(id => COMBAT_STAGE_PROFILES[id].enemySlugs.includes(enemySlug));
        if (stages.length === 0) {
            fail(`Enemy '${enemySlug}' is not in any selected stage roster. Pick a stage that fields it (--stage=all to search every roster).`);
        }
    }

    const sandboxId = flag('sandbox');
    let sandboxNote = '';
    if (sandboxId !== undefined) {
        const set = applySandboxSet(sandboxId);
        if (!set) {
            fail(`Unknown sandbox set '${sandboxId}'. Known sets: ${listSandboxSets().map(s => s.id).join(', ')}`);
        }
        sandboxNote = `Sandbox set applied: ${set.id} (${set.cards.length} cards, ${set.overrides?.length ?? 0} overrides)\n`;
    }

    const report = runPlaytestMatrix({
        stages,
        policies,
        decks: [deck],
        runsPerCell: runs,
        seed,
        enemySlugs: enemySlug !== undefined ? [enemySlug] : undefined,
    });

    if (json) {
        // --json purity: the report object and nothing else on stdout.
        process.stdout.write(`${JSON.stringify(report)}\n`);
        return;
    }

    process.stdout.write(
        `\nHazard combat playtest — stages=[${stages.join(', ')}] policies=[${policies.join(', ')}]`
        + ` deck=${deckArg}${enemySlug !== undefined ? ` enemy=${enemySlug}` : ''} runs=${runs} seed=${seed}\n`,
    );
    if (sandboxNote) process.stdout.write(sandboxNote);
    process.stdout.write('\n');
    process.stdout.write(formatPlaytestReport(report, { perCard }));
}

main();
