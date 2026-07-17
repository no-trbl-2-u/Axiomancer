/**
 * Re-baseline evidence runner (WS5.4 + WS6.3 draft half) — HEAD e203fed9.
 * Runs runRewardDraftSim for every preset origin x {baseline, bridge-rewards,
 * sequencing-microset} x seeds {1,2,3}, N=200 screens, and dumps raw JSON for
 * the synthesis stage. Telemetry only; judgment happens in the report.
 */
import * as fs from 'fs';
import * as path from 'path';
import { runRewardDraftSim } from '../../../src/Combat/combat.reward-draft.sim';
import { COMBAT_DECK_PRESET_ORDER } from '../../../src/Combat/combat.starter-deck-presets';

const SCREENS = 200;
const SEEDS = [1, 2, 3];
const RUNS: (string | undefined)[] = [undefined, 'bridge-rewards', 'sequencing-microset'];

interface RunDump {
    archetype: string;
    focus: string;
    picks: Record<string, number>;
    offers: Record<string, number>;
    extraPoolIds: readonly string[];
}

const out: Record<string, Record<string, Record<number, RunDump>>> = {};
for (const setId of RUNS) {
    const key = setId ?? 'baseline';
    out[key] = {};
    for (const origin of COMBAT_DECK_PRESET_ORDER) {
        out[key][origin] = {};
        for (const seed of SEEDS) {
            const r = runRewardDraftSim(
                origin, seed, SCREENS,
                setId ? { sandboxSetId: setId } : {},
            );
            out[key][origin][seed] = {
                archetype: r.archetype,
                focus: r.focus,
                picks: r.picks,
                offers: r.offers,
                extraPoolIds: r.extraPoolIds,
            };
        }
    }
}

const dest = path.join(__dirname, 'reward-draft-raw.json');
fs.writeFileSync(dest, JSON.stringify({ screens: SCREENS, seeds: SEEDS, data: out }, null, 1));
console.log(`wrote ${dest}`);
