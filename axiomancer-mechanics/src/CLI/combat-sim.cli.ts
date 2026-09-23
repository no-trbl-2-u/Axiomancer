/**
 * Hazard-Pattern Combat sim CLI — quick win-rate playthroughs for balance work.
 *
 * Runs `simulateHazardPatternCombat` (the scripted witness bot) against a curated
 * set of enemies across the difficulty tiers and prints win / outcome / round /
 * status-engagement stats.
 *
 * Usage:
 *   npm run combat-sim                              # omniscient ('greedy') witness
 *   npm run combat-sim -- --blind                  # realistic-player witness (no hidden-stance peek)
 *   npm run combat-sim -- --enemy=KingOfRevenge    # one enemy only
 *   npm run combat-sim -- --loadout=slippery-slope,festering-argument,soft-word
 *   npm run combat-sim -- --runs=300 --seed=1 --blind
 *
 * `--blind`: the bot drafts using ONLY information a real player can currently see
 * — the enemy's stance is unknown until it's revealed (by the read, or a Scout
 * signature), so the bot can't pre-seek advantage on turn one. Use it to gauge the
 * difficulty a real player feels (the omniscient bot over-performs). `--greedy`
 * (default) keeps the hidden-stance peek for the sharpest balance ceiling.
 */

import { Player } from '../Character/characters.mock';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { LittleBelle, TheFerryman, KingOfRevenge, FateSpinner } from '../Enemy/enemy.library';
import { deepClone } from '../Utils';
import { simulateHazardPatternCombat, type CombatSimPolicyId } from '../Combat/combat.encounter.sim';
// Combat Quality Index — printed as a diagnostic beside the legacy
// `statusEngagement` warning light; no governing objective function remains
// (THE BIG NUMBERS REWRITE, 2026-09-02).
import { formatCombatQuality } from '../Combat/combat.objective';

export const ENEMIES: Record<string, Enemy> = { LittleBelle, TheFerryman, KingOfRevenge, FateSpinner };

if (require.main === module) {
    const flag = (k: string): string | undefined => {
        const a = process.argv.find(x => x.startsWith(`--${k}=`));
        return a ? a.slice(k.length + 3) : undefined;
    };
    const has = (k: string): boolean => process.argv.includes(`--${k}`);

    const policy: CombatSimPolicyId = has('blind') ? 'blind' : 'greedy';
    const runs = Number(flag('runs') ?? '200');
    const seed = Number(flag('seed') ?? '1');
    // Default loadout: the spec 32 v3 starting deck (slippery-slope teaches DoT,
    // brace-for-impact teaches GUARD).
    const loadout = (flag('loadout') ?? 'slippery-slope,brace-for-impact').split(',').map(s => s.trim()).filter(Boolean);
    const only = flag('enemy');

    const player = (cards: string[]): Character => {
        const p = deepClone(Player);
        p.knownCards = cards.slice();
        p.baseStats = { heart: 10, body: 10, mind: 10 };
        p.health = 150;
        p.maxHealth = 150;
        return p;
    };

    const names = only ? [only] : Object.keys(ENEMIES);
    process.stdout.write(
        `\nHazard combat sim — policy=${policy} runs=${runs} seed=${seed} loadout=[${loadout.join(', ')}]\n`
        + `(win = enemy HP→0 or a merciful resolution (befriend/capitulate/concede); `
        + `V/M/D/R = victory/merciful/defeat/retreat)\n`
        + '(cqi = OBJECTIVE FUNCTION v2, Combat/combat.objective.ts: spine = the LOCKED systems\n'
        + '  con/sur/dic = Conviction / Surge meter / Dice; arc = per-turn shape; wid = decision\n'
        + '  width; idn = deck identity. statusEng is the legacy doctrine warning light.)\n\n',
    );
    for (const name of names) {
        const enemy = ENEMIES[name];
        if (!enemy) {
            process.stdout.write(`  unknown enemy "${name}" — known: ${Object.keys(ENEMIES).join(', ')}\n`);
            continue;
        }
        const s = simulateHazardPatternCombat(player(loadout), enemy, runs, seed, policy);
        process.stdout.write(
            `  ${name.padEnd(16)} win=${(s.winRate * 100).toFixed(0).padStart(3)}%`
            + `  V/M/D/R=${s.victories}/${s.mercies}/${s.defeats}/${s.retreats}`
            + `  rounds=${s.avgRounds.toFixed(1).padStart(4)}`
            + `  statusEng=${(s.statusEngagement * 100).toFixed(0).padStart(3)}%`
            // Phase 43 — the objective function, beside the legacy warning light.
            + `  ${formatCombatQuality(s.combatQuality)}`
            + `  conviction=${s.avgConvictionSpent.toFixed(1).padStart(4)}`
            + `  dotFrac=${(s.dotHpFraction * 100).toFixed(0).padStart(3)}%`
            + `  strikeFrac=${(s.strikeFraction * 100).toFixed(0).padStart(3)}%`
            + `  burstFrac=${(s.mechanicBurstFraction * 100).toFixed(0).padStart(3)}%`
            + `  guard=${(s.guardMitigatedFraction * 100).toFixed(0).padStart(3)}%`
            + `  effects=${s.avgActiveEffectsPerPhase.toFixed(1).padStart(4)}\n`,
        );
    }
    process.stdout.write('\n');
}
