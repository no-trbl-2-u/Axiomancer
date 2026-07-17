/**
 * TEMPORARY EXPERIMENT HARNESS — "Does increasing card pricing increase win-rate?"
 *
 * Not part of the shipped engine. Lives under scratch/ so it is never wired
 * into verify. Run from the axiomancer-mechanics/ package dir:
 *
 *   npx ts-node --transpile-only scratch/price-experiment/price-winrate.harness.ts --mode=presets --out=scratch/price-experiment/out/presets.json
 *   npx ts-node --transpile-only scratch/price-experiment/price-winrate.harness.ts --mode=ladder  --out=scratch/price-experiment/out/ladder.json
 *
 * It measures, per deck (preset OR a sandbox price-tier of a base preset) and
 * per campaign stage, over runs x seeds:
 *   - winRate (victory + merciful)          - lossRate
 *   - avgRoundsToVictory  (VICTORY-only)     - avgRoundsAll (every outcome)
 *   - win-path split (victory/mercy/capit/concede/defeat)
 *   - statusEngagement, dotHpFraction        - avgPlays, fizzleRate proxy
 *   - deckPrice metrics (scoreCard-based)    - dominant win path
 *
 * "Card pricing" = the design-time power budget (scoreCard, cards.pricing.ts).
 * The die cost is a fixed 1 die per PAID line, so "increasing pricing" means
 * packing more scoreCard points (more/longer status, bigger bursts) per die.
 */

import {
    runOneEncounter,
    buildPresetDeck,
    COMBAT_DECK_PRESET_ORDER,
    getDeckPreset,
    COMBAT_STAGE_PROFILES,
    COMBAT_STAGE_ORDER,
    buildStagePlayer,
    getCardById,
    registerSandboxOverride,
    clearSandboxCards,
    ENEMY_REGISTRY,
    deepClone,
} from '../../src/index';
import type { CombatStageId } from '../../src/index';
import { scoreCard } from '../../src/Cards/cards.pricing';
import { grantDeckKnowledge } from '../../src/Combat/combat.playtest';
import * as fs from 'fs';
import * as path from 'path';

// ── CLI args ────────────────────────────────────────────────────────────────
const argOf = (k: string, d?: string): string | undefined => {
    const a = process.argv.find(x => x.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : d;
};
const MODE = argOf('mode', 'presets')!;                 // presets | ladder
const RUNS = parseInt(argOf('runs', '60')!, 10);
const SEEDS = parseInt(argOf('seeds', '3')!, 10);       // seeds 1..SEEDS
const POLICY = argOf('policy', 'blind')!;               // blind = doctrine curve
const STAGES_ARG = argOf('stages', 'all')!;
const BASE_PRESET = argOf('base', 'erosion')!;          // ladder base
const ONLY_PRESET = argOf('preset');                    // presets mode: restrict to one
const OUT = argOf('out', `scratch/price-experiment/out/${MODE}.json`)!;

const STAGES: CombatStageId[] = STAGES_ARG === 'all'
    ? [...COMBAT_STAGE_ORDER]
    : (STAGES_ARG.split(',') as CombatStageId[]);

// ── deck price ──────────────────────────────────────────────────────────────
/** scoreCard over the resolved 15-card list (honours sandbox overrides). */
function deckPrice(cardIds: readonly string[]): {
    total: number; avgCard: number; avgSpell: number; spellCount: number;
} {
    let total = 0;
    let spellTotal = 0;
    let spellCount = 0;
    for (const id of cardIds) {
        const card = getCardById(id);
        if (!card) continue;
        const s = scoreCard(card);         // enchant/disenchant → 0
        total += s;
        if (card.cardType === 'spell') { spellTotal += s; spellCount++; }
    }
    return {
        total: round(total),
        avgCard: round(total / cardIds.length),
        avgSpell: round(spellCount ? spellTotal / spellCount : 0),
        spellCount,
    };
}

const round = (n: number): number => Math.round(n * 100) / 100;

// ── one (deck x stage) measurement ──────────────────────────────────────────
interface Cell {
    stage: CombatStageId;
    enemies: number;
    runs: number;
    winRate: number;
    lossRate: number;
    avgRoundsToVictory: number | null;   // VICTORY-only (the requested metric)
    avgRoundsAll: number;
    winPath: Record<string, number>;
    statusEngagement: number;
    dotHpFraction: number;
    avgPlays: number;
}

function measureDeckStage(deckIds: string[], stageId: CombatStageId): Cell {
    const stage = COMBAT_STAGE_PROFILES[stageId];
    const player = buildStagePlayer(stage);
    grantDeckKnowledge(player, deckIds);

    const winPath: Record<string, number> = {
        victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0,
    };
    let runs = 0, wins = 0, losses = 0;
    let victoryRoundsSum = 0, victoryCount = 0, allRoundsSum = 0;
    let statusPlaysSum = 0, playsSum = 0;
    let dotSum = 0, hpLossSum = 0;

    for (const enemySlug of stage.enemySlugs) {
        const enemyBase = (ENEMY_REGISTRY as Record<string, any>)[enemySlug];
        if (!enemyBase) continue;
        for (let seed = 1; seed <= SEEDS; seed++) {
            for (let i = 0; i < RUNS; i++) {
                const enemy = deepClone(enemyBase);
                const r = runOneEncounter(player, enemy, seed * 100000 + i, POLICY as any, { deck: deckIds });
                runs++;
                winPath[r.outcome] = (winPath[r.outcome] ?? 0) + 1;
                const won = r.outcome === 'victory' || r.outcome === 'mercy'
                    || r.outcome === 'capitulate' || r.outcome === 'concede';
                if (won) wins++;
                if (r.outcome === 'defeat') losses++;
                if (r.outcome === 'victory') { victoryRoundsSum += r.rounds; victoryCount++; }
                allRoundsSum += r.rounds;
                statusPlaysSum += r.statusPlays;
                playsSum += r.plays;
                dotSum += r.dotHpDamage;
                hpLossSum += r.dotHpDamage + r.mechanicBurstDamage + r.directHpDamage;
            }
        }
    }

    return {
        stage: stageId,
        enemies: stage.enemySlugs.length,
        runs,
        winRate: round(wins / runs),
        lossRate: round(losses / runs),
        avgRoundsToVictory: victoryCount ? round(victoryRoundsSum / victoryCount) : null,
        avgRoundsAll: round(allRoundsSum / runs),
        winPath,
        statusEngagement: round(playsSum ? statusPlaysSum / playsSum : 0),
        dotHpFraction: round(hpLossSum ? dotSum / hpLossSum : 0),
        avgPlays: round(playsSum / runs),
    };
}

// ── ladder overrides: scale a preset's spell power to hit price tiers ────────
/** Scale intensities of every combatEffect + free.applyEffect on the deck's
 *  SPELLS by `m` (min 1, rounded). Raises scoreCard → raises deck price, same
 *  cards, same colors, same 1-die cost. */
function applyPriceMultiplier(deckIds: string[], m: number): void {
    clearSandboxCards();
    if (m === 1) return; // baseline: no override
    const scale = (v: number | undefined, dflt: number): number => Math.max(1, Math.round((v ?? dflt) * m));
    const uniqueSpellIds = [...new Set(deckIds)].filter(id => getCardById(id)?.cardType === 'spell');
    for (const id of uniqueSpellIds) {
        const base = getCardById(id)!;
        const patch: any = {};
        if (base.combatEffects) {
            // Scale intensity AND duration so DoT lifetime (and thus scoreCard
            // price) rises smoothly and monotonically across tiers.
            patch.combatEffects = base.combatEffects.map((ce: any) => ({
                ...ce,
                intensity: scale(ce.intensity, 1),
                ...(ce.duration !== undefined ? { duration: scale(ce.duration, 1) } : {}),
            }));
        }
        if (base.free?.applyEffect) {
            patch.free = {
                ...base.free,
                applyEffect: {
                    ...base.free.applyEffect,
                    intensity: scale(base.free.applyEffect.intensity, 1),
                    ...(base.free.applyEffect.duration !== undefined
                        ? { duration: scale(base.free.applyEffect.duration, 1) } : {}),
                },
            };
        }
        if (Object.keys(patch).length) registerSandboxOverride(id, patch);
    }
}

// ── runners ──────────────────────────────────────────────────────────────────
function runPresets(): any {
    const presetIds = ONLY_PRESET ? [ONLY_PRESET] : [...COMBAT_DECK_PRESET_ORDER];
    const decks = presetIds.map(id => {
        clearSandboxCards();
        const deckIds = buildPresetDeck(id);
        const price = deckPrice(deckIds);
        const cells = STAGES.map(s => measureDeckStage(deckIds, s));
        const p = getDeckPreset(id)!;
        return { id, name: p.name, theme: p.theme, focus: p.focus, price, cells };
    });
    return { mode: 'presets', policy: POLICY, runs: RUNS, seeds: SEEDS, stages: STAGES, decks };
}

function runLadder(): any {
    const multipliers = [0.5, 0.75, 1, 1.5, 2, 3, 4];
    const baseDeckIds = (clearSandboxCards(), buildPresetDeck(BASE_PRESET));
    const tiers = multipliers.map(m => {
        applyPriceMultiplier(baseDeckIds, m);
        const price = deckPrice(baseDeckIds);
        const cells = STAGES.map(s => measureDeckStage(baseDeckIds, s));
        clearSandboxCards();
        return { multiplier: m, price, cells };
    });
    return { mode: 'ladder', base: BASE_PRESET, policy: POLICY, runs: RUNS, seeds: SEEDS, stages: STAGES, tiers };
}

/**
 * Measures a custom deck defined by a sandbox module (for testing proposed
 * fix-cards). The module (path via --module=<relpath from package dir>) must
 * export `register(): void` (registers sandbox cards/overrides) and
 * `deck(): string[]` (the 15-card list). Compared against an optional
 * --baseline=preset:<id> deck measured with a clean sandbox.
 */
function runCustomDeck(): any {
    const modPath = path.resolve(argOf('module')!);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(modPath);
    const out: any = { mode: 'customdeck', module: modPath, policy: POLICY, runs: RUNS, seeds: SEEDS, stages: STAGES };

    const baselineArg = argOf('baseline');
    if (baselineArg?.startsWith('preset:')) {
        clearSandboxCards();
        const bId = baselineArg.slice('preset:'.length);
        const bDeck = buildPresetDeck(bId);
        out.baseline = { label: baselineArg, price: deckPrice(bDeck), cells: STAGES.map(s => measureDeckStage(bDeck, s)) };
    }

    clearSandboxCards();
    if (typeof mod.register === 'function') mod.register();
    const deckIds: string[] = mod.deck();
    out.experiment = { label: mod.label ?? path.basename(modPath), price: deckPrice(deckIds), cells: STAGES.map(s => measureDeckStage(deckIds, s)) };
    clearSandboxCards();
    return out;
}

// ── main ─────────────────────────────────────────────────────────────────────
const result = MODE === 'ladder' ? runLadder()
    : MODE === 'customdeck' ? runCustomDeck()
    : runPresets();
const outPath = path.resolve(OUT);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

// compact stdout summary
const line = (s: string): void => process.stdout.write(s + '\n');
line(`\n== ${MODE.toUpperCase()} (policy=${POLICY}, runs=${RUNS}, seeds=1..${SEEDS}) ==`);
if (MODE === 'presets') {
    for (const d of result.decks) {
        line(`\n${d.name} [${d.theme}/${d.focus}]  price avgCard=${d.price.avgCard} avgSpell=${d.price.avgSpell} total=${d.price.total}`);
        for (const c of d.cells) {
            line(`  ${c.stage.padEnd(11)} win=${(c.winRate * 100).toFixed(0).padStart(3)}%  vRounds=${String(c.avgRoundsToVictory ?? '-').padStart(5)}  allRounds=${String(c.avgRoundsAll).padStart(5)}  statusEng=${(c.statusEngagement * 100).toFixed(0)}%  dotFrac=${(c.dotHpFraction * 100).toFixed(0)}%  path[v/m/c/co/d]=${c.winPath.victory}/${c.winPath.mercy}/${c.winPath.capitulate}/${c.winPath.concede}/${c.winPath.defeat}`);
        }
    }
} else if (MODE === 'customdeck') {
    for (const grp of [result.baseline, result.experiment].filter(Boolean)) {
        line(`\n${grp.label}  price avgSpell=${grp.price.avgSpell} total=${grp.price.total}`);
        for (const c of grp.cells) {
            line(`  ${c.stage.padEnd(11)} win=${(c.winRate * 100).toFixed(0).padStart(3)}%  vRounds=${String(c.avgRoundsToVictory ?? '-').padStart(5)}  allRounds=${String(c.avgRoundsAll).padStart(5)}`);
        }
    }
} else {
    for (const t of result.tiers) {
        line(`\nx${t.multiplier}  price avgSpell=${t.price.avgSpell} total=${t.price.total}`);
        for (const c of t.cells) {
            line(`  ${c.stage.padEnd(11)} win=${(c.winRate * 100).toFixed(0).padStart(3)}%  vRounds=${String(c.avgRoundsToVictory ?? '-').padStart(5)}  allRounds=${String(c.avgRoundsAll).padStart(5)}`);
        }
    }
}
line(`\nwrote ${outPath}`);
