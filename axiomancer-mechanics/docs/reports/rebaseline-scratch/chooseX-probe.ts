/**
 * Scratch probe — WS7.2 chosen-X distribution evidence (chooseX-vein A/B,
 * Phase 27 re-baseline at HEAD e203fed9).
 *
 * Samples the ACTUAL policy chooseX pick + the ENGINE's own clamp
 * (`recoilXRange`) over real encounter states: every stage profile, every
 * stage enemy, seeds 1..20, at three fight-attrition HP depths (100%, 60%,
 * 30% of stage max HP — the range the matrix visits between the opening turn
 * and a near-loss). The recorded value is the post-clamp X, i.e. exactly what
 * `playCombatCard` would pay (the engine re-clamps to the same range).
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

import { applySandboxSet } from '../../../src/Cards/cards.sandbox-sets';
import { COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES, buildStagePlayer } from '../../../src/Combat/combat.stage-profiles';
import { ENEMY_REGISTRY } from '../../../src/Enemy/enemy.library';
import { initializeCombatEncounter, rollEncounterDice, recoilXRange } from '../../../src/Combat/combat.engine';
import { COMBAT_SIM_POLICY_ORDER, COMBAT_SIM_POLICIES } from '../../../src/Combat/combat.sim-policies';
import type { CombatEncounterState } from '../../../src/Combat/combat.encounter.types';
import { deepClone } from '../../../src/Utils';

applySandboxSet('chooseX-vein');
const VEIN = 'the-open-vein';

/** Deterministic per-sample LCG (chaos consumes it; others ignore it). */
function lcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const DEPTHS = [1.0, 0.6, 0.3];
const SEEDS = 20;

type Hist = Map<number, number>;
const byPolicy: Record<string, Hist> = {};
const byPolicyStage: Record<string, Record<string, Hist>> = {};
const bump = (h: Hist, x: number): void => { h.set(x, (h.get(x) ?? 0) + 1); };

for (const stageId of COMBAT_STAGE_ORDER) {
    const stage = COMBAT_STAGE_PROFILES[stageId];
    for (const slug of stage.enemySlugs) {
        const enemy = (ENEMY_REGISTRY as Record<string, typeof ENEMY_REGISTRY[keyof typeof ENEMY_REGISTRY]>)[slug];
        if (!enemy) continue;
        for (let seed = 1; seed <= SEEDS; seed++) {
            const player = buildStagePlayer(stage);
            if (!player.knownCards.includes(VEIN)) player.knownCards.push(VEIN);
            let state: CombatEncounterState = initializeCombatEncounter(
                player, deepClone(enemy), [VEIN, VEIN, VEIN, VEIN, VEIN], seed);
            state = rollEncounterDice(state).state;
            const entry = state.hand.find(h => h.cardId === VEIN);
            if (!entry) continue;
            for (const depth of DEPTHS) {
                const hp = Math.max(2, Math.round(stage.playerMaxHealth * depth));
                const probeState = { ...state, player: { ...state.player, health: hp } };
                const range = recoilXRange(probeState, { id: VEIN });
                if (!range) continue;
                for (const pid of COMBAT_SIM_POLICY_ORDER) {
                    const policy = COMBAT_SIM_POLICIES[pid];
                    const rng = lcg(seed * 7919 + depth * 1000 + pid.length);
                    const cardLike = { id: VEIN } as never;
                    const raw = policy.chooseX
                        ? policy.chooseX(probeState, cardLike, range, rng)
                        : range.min;
                    const paid = Math.max(range.min, Math.min(range.max, Math.floor(raw)));
                    bump(byPolicy[pid] ?? (byPolicy[pid] = new Map()), paid);
                    const stageMap = byPolicyStage[pid] ?? (byPolicyStage[pid] = {});
                    bump(stageMap[stageId] ?? (stageMap[stageId] = new Map()), paid);
                }
            }
        }
    }
}

function summarize(h: Hist): { n: number; modal: number; mean: number; min: number; max: number; distinct: number } {
    let n = 0, sum = 0, modal = 0, modalN = -1, min = Infinity, max = -Infinity;
    for (const [x, c] of h) {
        n += c; sum += x * c;
        if (c > modalN) { modalN = c; modal = x; }
        if (x < min) min = x;
        if (x > max) max = x;
    }
    return { n, modal, mean: +(sum / n).toFixed(2), min, max, distinct: h.size };
}

const out: Record<string, unknown> = {};
const lines: string[] = [];
lines.push('WS7.2 chosen-X probe — post-clamp X per policy (all stages x enemies x seeds 1..20 x HP depths 100/60/30%)');
for (const pid of Object.keys(byPolicy)) {
    const s = summarize(byPolicy[pid]);
    out[pid] = {
        overall: s,
        histogram: Object.fromEntries([...byPolicy[pid].entries()].sort((a, b) => a[0] - b[0])),
        perStage: Object.fromEntries(Object.entries(byPolicyStage[pid]).map(([st, h]) => [st, summarize(h)])),
    };
    lines.push(`  ${pid.padEnd(13)} n=${s.n} modal=${s.modal} mean=${s.mean} range=[${s.min},${s.max}] distinctX=${s.distinct}`);
}
writeFileSync(join(__dirname, 'ab-chooseX-vein-xdist.json'), JSON.stringify(out, null, 1));
writeFileSync(join(__dirname, 'ab-chooseX-vein-xdist.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
