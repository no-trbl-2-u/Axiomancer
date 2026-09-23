/**
 * Upgradeable-Dice D3 economy CLI — measures spec 33 §7's D3 gate table from
 * flag-ON encounters across the starter presets × stage profiles × seeds and
 * prints the aligned witness report.
 *
 * Usage:
 *   npm run combat-dice-economy                       # greedy, seeds 1-5, early/mid/late
 *   npm run combat-dice-economy -- --policy=blind
 *   npm run combat-dice-economy -- --seeds=1,2,3,4,5,6,7,8
 *   npm run combat-dice-economy -- --preset=threadbare --stage=mid
 *
 * The report is measurement-only (no code change). The D3 tuning doc quotes it;
 * D7 ratifies the derived constants and flips the bands to hard assertions.
 */

import { simulateUpgradeableEconomy, formatUpgradeableEconomyReport } from '../Combat/combat.upgradeable-economy.sim';
import { COMBAT_DECK_PRESET_ORDER } from '../Combat/combat.starter-deck-presets';
import { COMBAT_STAGE_ORDER, type CombatStageId } from '../Combat/combat.stage-profiles';
import type { CombatSimPolicyId } from '../Combat/combat.sim-policies';

if (require.main === module) {
    const flag = (k: string): string | undefined => {
        const a = process.argv.find(x => x.startsWith(`--${k}=`));
        return a ? a.slice(k.length + 3) : undefined;
    };

    const policy = (flag('policy') ?? 'greedy') as CombatSimPolicyId;
    const seeds = (flag('seeds') ?? '1,2,3,4,5').split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
    const presetArg = flag('preset');
    const stageArg = flag('stage');
    const presets = presetArg ? presetArg.split(',').map(s => s.trim()) : COMBAT_DECK_PRESET_ORDER;
    const stages = (stageArg
        ? stageArg.split(',').map(s => s.trim())
        : COMBAT_STAGE_ORDER.filter(s => s !== 'impossible')) as CombatStageId[];

    process.stdout.write('\n');
    const result = simulateUpgradeableEconomy({ presets, stages, seeds, policy });
    process.stdout.write(formatUpgradeableEconomyReport(result));
    process.stdout.write('\n\n');
}
