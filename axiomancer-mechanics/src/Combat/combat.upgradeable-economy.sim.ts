/**
 * Spec 33 — Upgradeable Dice: the D3 economy witness.
 *
 * Runs flag-ON encounters through the real engine + policy driver
 * (`policyPlayPhase`'s spec-33 branch) across the starter presets × stage
 * profiles × seeds, then reads the recorded transcript to measure spec 33 §7's
 * **D3 gate table**: E[usable dice/round], whiff rate, per-color access, dead
 * rounds, realized ◆ income (specials-on-use + yield + overflow), surge
 * frequency, momentum-break rate, and the STAKE-retirement gap (vs a flag-off
 * baseline run of the same cells).
 *
 * Every number is READ FROM THE ENGINE'S OWN EVENT STREAM — the roll gates from
 * the `turn-dice-rolled` events (the fresh four-die roll, not a post-spend
 * snapshot), realized income from `special-fired` / `stance-check-resolved` /
 * `die-overflowed`, surges from `momentum-surged`. Nothing is recomputed by a
 * parallel model, so the witness cannot drift from the engine it measures.
 *
 * The flag is toggled around each batch and restored in a `finally`, so a
 * measurement run never leaks spec-33 state into the flag-off suite.
 */

import { setSeed } from '../Utils/rng';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
    selectMercyChoice, selectCapitulationChoice, getSignatureSkill,
} from './combat.engine';
import { runOneEncounter, playSimPhase } from './combat.encounter.sim';
import {
    setUpgradeableDice, isUpgradeableDiceEnabled, SPECIAL_CONVICTION_DEFAULT, OVERHEAT_CRACK_CHANCE,
    rollUpgradeableDice,
} from './combat.upgradeable-dice';
import {
    COMBAT_STAGE_PROFILES, COMBAT_STAGE_ORDER, buildStagePlayer, type CombatStageId,
} from './combat.stage-profiles';
import { buildPresetDeck, COMBAT_DECK_PRESET_ORDER } from './combat.starter-deck-presets';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';
import { COMBAT_SIM_POLICIES, type CombatSimPolicyId } from './combat.sim-policies';
import type {
    CombatEncounterState, CombatManaDie, CombatOutcome,
} from './combat.encounter.types';

const FIXED_DIE_ID = /-u-(body|mind|heart|wild)$/;
const CHAIN_COLORS = ['body', 'mind', 'heart'] as const;
type ChainColor = (typeof CHAIN_COLORS)[number];

/** The stock four-die roll from a `turn-dice-rolled` event (drops surge floats
 *  and the gold+lead pair — the gates are for stock gear). */
function stockFixedDice(dice: readonly CombatManaDie[]): CombatManaDie[] {
    return dice.filter(d => !d.floating && FIXED_DIE_ID.test(d.id));
}

/** The authoritative dice-math witness: a single long stream of stock four-die
 *  rolls, decoupled from any encounter. This measures the FACE TABLES (spec 33
 *  §1) — usable, whiff, per-color access, gross special ◆ — the way the spec's
 *  own baseline arithmetic does. It is the canonical D3 roll-gate reading; the
 *  in-play realized figures (below) are the SAME dice seen through the engine's
 *  interleaved RNG stream and diverge from these by the RNG-lattice skew the
 *  report flags. */
export interface DiceMathWitness {
    rolls: number;
    usablePerRound: number;
    whiffRate: number;
    perColorAccess: Record<ChainColor, number>;
    grossSpecialIncomePerRound: number;
    specialsPerRound: number;
}

export function measureDiceMath(rolls = 200000, seed = 4242): DiceMathWitness {
    const wasOn = isUpgradeableDiceEnabled();
    setUpgradeableDice(true);
    setSeed(seed);
    let usable = 0, whiff = 0, specials = 0;
    const colorHits: Record<ChainColor, number> = { body: 0, mind: 0, heart: 0 };
    try {
        for (let i = 0; i < rolls; i++) {
            const dice = rollUpgradeableDice(1, {}, new Set());
            const u = dice.filter(d => d.face === 'special' || d.face === 'mana');
            usable += u.length;
            specials += dice.filter(d => d.face === 'special').length;
            if (u.length === 0) whiff++;
            for (const c of CHAIN_COLORS) {
                if (dice.some(d => (d.color === c || d.color === 'wild') && (d.face === 'special' || d.face === 'mana'))) colorHits[c]++;
            }
        }
    } finally {
        setUpgradeableDice(wasOn);
    }
    return {
        rolls,
        usablePerRound: usable / rolls,
        whiffRate: whiff / rolls,
        perColorAccess: { body: colorHits.body / rolls, mind: colorHits.mind / rolls, heart: colorHits.heart / rolls },
        specialsPerRound: specials / rolls,
        grossSpecialIncomePerRound: (specials / rolls) * SPECIAL_CONVICTION_DEFAULT,
    };
}

export interface UpgradeableEconomyStats {
    encounters: number;
    /** Rounds that actually rolled the tray (one `turn-dice-rolled` each). */
    rounds: number;
    // ── Roll gates (stock fixed dice) ────────────────────────────────────────
    usablePerRound: number;
    whiffRate: number;
    perColorAccess: Record<ChainColor, number>;
    /** Whiffed rounds entered with 0◆ (Press Fate impossible) — the FREE-only
     *  dead round the brief asks to measure (no band yet). */
    deadRoundRate: number;
    // ── Realized ◆ economy ───────────────────────────────────────────────────
    /** Gross special income if EVERY rolled special fired (specials × payload). */
    grossSpecialIncomePerRound: number;
    /** Realized special income (SPECIAL_FIRES_ON_USE: only spent specials pay). */
    specialIncomePerRound: number;
    /** Fraction of rolled special ◆ actually realized (spent-on-use). */
    specialSpendRate: number;
    yieldIncomePerRound: number;
    overflowIncomePerRound: number;
    totalIncomePerRound: number;
    // ── Momentum / surge ─────────────────────────────────────────────────────
    surgePerRound: number;
    momentumBreakPerRound: number;
    pressFatePerRound: number;
    // ── Outcome context (NOT a D7 win-curve read) ────────────────────────────
    winRate: number;
    avgRounds: number;
}

export interface UpgradeableEconomyCell {
    preset: string;
    stage: CombatStageId;
    stats: UpgradeableEconomyStats;
}

export interface UpgradeableEconomyOptions {
    presets?: readonly string[];
    stages?: readonly CombatStageId[];
    seeds?: readonly number[];
    policy?: CombatSimPolicyId;
}

interface EconomyAccumulator {
    encounters: number;
    rounds: number;
    usable: number;
    whiff: number;
    deadRounds: number;
    colorHits: Record<ChainColor, number>;
    grossSpecials: number;
    specialIncome: number;
    yieldIncome: number;
    overflowIncome: number;
    surges: number;
    breaks: number;
    pressFates: number;
    wins: number;
    totalRounds: number;
}

function emptyAcc(): EconomyAccumulator {
    return {
        encounters: 0, rounds: 0, usable: 0, whiff: 0, deadRounds: 0,
        colorHits: { body: 0, mind: 0, heart: 0 },
        grossSpecials: 0, specialIncome: 0, yieldIncome: 0, overflowIncome: 0,
        surges: 0, breaks: 0, pressFates: 0, wins: 0, totalRounds: 0,
    };
}

function isWin(outcome: CombatOutcome | null): boolean {
    return outcome === 'victory' || outcome === 'mercy' || outcome === 'capitulate' || outcome === 'concede';
}

/** Folds a slice of transcript events into `acc`. The `turn-dice-rolled` in the
 *  slice (if any) is the fresh roll for one phase; `convBefore` is the player's
 *  Conviction entering that phase (a whiffed round with 0◆ can't Press Fate — a
 *  dead round). Income/surge/break events are folded regardless. */
function foldEvents(acc: EconomyAccumulator, events: readonly CombatEncounterState['log'][number][], convBefore: number): void {
    const roll = events.find(e => e.kind === 'turn-dice-rolled');
    if (roll && roll.kind === 'turn-dice-rolled') {
        const fixed = stockFixedDice(roll.dice);
        const usable = fixed.filter(d => d.face === 'special' || d.face === 'mana');
        acc.rounds++;
        acc.usable += usable.length;
        acc.grossSpecials += fixed.filter(d => d.face === 'special').length;
        if (usable.length === 0) {
            acc.whiff++;
            if (convBefore < 1) acc.deadRounds++;
        }
        for (const c of CHAIN_COLORS) {
            if (fixed.some(d => (d.color === c || d.color === 'wild') && (d.face === 'special' || d.face === 'mana'))) acc.colorHits[c]++;
        }
    }
    for (const ev of events) {
        if (ev.kind === 'special-fired') acc.specialIncome += ev.conviction;
        else if (ev.kind === 'momentum-surged') acc.surges++;
        else if (ev.kind === 'momentum-broken') acc.breaks++;
        else if (ev.kind === 'die-overflowed') acc.overflowIncome += 1;
        else if (ev.kind === 'stance-check-resolved' && ev.outcome === 'yielded') acc.yieldIncome += 1;
        else if (ev.kind === 'signature-cast' && getSignatureSkill(ev.signatureId)?.kind === 'reroll') acc.pressFates++;
    }
}

/** Runs one flag-ON encounter, folding its transcript into `acc`. Assumes the
 *  caller has already set the flag on. A single log cursor advances through the
 *  whole transcript so the round-1 roll (emitted by `rollEncounterDice`, before
 *  the loop) is counted exactly once — the fix for the >100% special spend-rate
 *  a per-phase `logStart` produced by dropping round 1's roll. */
function accumulateEncounter(
    acc: EconomyAccumulator,
    presetId: string,
    stageId: CombatStageId,
    seed: number,
    policyId: CombatSimPolicyId,
): void {
    const stage = COMBAT_STAGE_PROFILES[stageId];
    const enemy = ENEMY_REGISTRY[stage.enemySlugs[0] as keyof typeof ENEMY_REGISTRY];
    const deck = buildPresetDeck(presetId);
    const player = buildStagePlayer(stage);
    player.knownCards = deck.slice();
    const policy = COMBAT_SIM_POLICIES[policyId];

    setSeed(seed);
    const init = initializeCombatEncounter(player, enemy, deck, seed);
    const convAtInit = init.conviction;
    let state: CombatEncounterState = rollEncounterDice(init).state;
    // greedy/blind never consume policy rng (their ranking is deterministic); a
    // stub keeps the seeded engine stream untouched, matching runOneEncounter.
    const rng = (): number => 0;

    acc.encounters++;
    // Round 1's roll fired inside rollEncounterDice, before the loop — fold it
    // with the pre-roll Conviction (the just-initialized state).
    let cursor = 0;
    foldEvents(acc, state.log.slice(cursor), convAtInit);
    cursor = state.log.length;

    let loopGuard = 0;
    while (state.phase !== 'complete' && !state.finalOutcome && loopGuard < 200) {
        loopGuard++;
        if (state.capitulationChoiceActive) { state = selectCapitulationChoice(state, 'accept').state; break; }
        if (state.mercyChoiceActive) {
            state = selectMercyChoice(state, policy.mercyChoice).state;
            if (state.phase === 'complete' || state.finalOutcome) break;
            continue;
        }
        if (state.phase !== 'phase-play') break;

        const convBefore = state.conviction;
        state = playSimPhase(state, policyId, rng).state;
        foldEvents(acc, state.log.slice(cursor), convBefore);
        cursor = state.log.length;

        if (state.finalOutcome) break;
        if (state.capitulationChoiceActive) { state = selectCapitulationChoice(state, 'accept').state; break; }
        if (state.mercyChoiceActive) {
            state = selectMercyChoice(state, policy.mercyChoice).state;
            if (state.phase === 'complete' || state.finalOutcome) break;
            continue;
        }
        if (state.phase === 'phase-play') {
            state = resolveThreatPhase(state).state;
            // The resolve slice has no roll — pass convBefore through unused.
            foldEvents(acc, state.log.slice(cursor), convBefore);
            cursor = state.log.length;
        }
    }
    acc.totalRounds += state.round;
    if (isWin(state.finalOutcome ?? null)) acc.wins++;
}

function finalize(acc: EconomyAccumulator): UpgradeableEconomyStats {
    const r = Math.max(1, acc.rounds);
    const grossSpecialIncome = (acc.grossSpecials * SPECIAL_CONVICTION_DEFAULT) / r;
    const specialIncome = acc.specialIncome / r;
    return {
        encounters: acc.encounters,
        rounds: acc.rounds,
        usablePerRound: acc.usable / r,
        whiffRate: acc.whiff / r,
        perColorAccess: {
            body: acc.colorHits.body / r,
            mind: acc.colorHits.mind / r,
            heart: acc.colorHits.heart / r,
        },
        deadRoundRate: acc.deadRounds / r,
        grossSpecialIncomePerRound: grossSpecialIncome,
        specialIncomePerRound: specialIncome,
        specialSpendRate: grossSpecialIncome > 0 ? specialIncome / grossSpecialIncome : 0,
        yieldIncomePerRound: acc.yieldIncome / r,
        overflowIncomePerRound: acc.overflowIncome / r,
        totalIncomePerRound: (acc.specialIncome + acc.yieldIncome + acc.overflowIncome) / r,
        surgePerRound: acc.surges / r,
        momentumBreakPerRound: acc.breaks / r,
        pressFatePerRound: acc.pressFates / r,
        winRate: acc.encounters > 0 ? acc.wins / acc.encounters : 0,
        avgRounds: acc.encounters > 0 ? acc.totalRounds / acc.encounters : 0,
    };
}

/**
 * The D3 economy witness: flag-ON encounters across presets × stages × seeds,
 * measured from the transcript. Returns the pooled stats plus per-cell rows and
 * the STAKE-retirement gap (flag-off baseline escalation pressure the retired
 * wager used to add). The flag is set on for the batch and restored after.
 */
export function simulateUpgradeableEconomy(options: UpgradeableEconomyOptions = {}): {
    diceMath: DiceMathWitness;
    pooled: UpgradeableEconomyStats;
    cells: UpgradeableEconomyCell[];
    stakeGap: StakeRetirementGap;
    config: { presets: readonly string[]; stages: readonly CombatStageId[]; seeds: readonly number[]; policy: CombatSimPolicyId };
} {
    const presets = options.presets ?? COMBAT_DECK_PRESET_ORDER;
    const stages = options.stages ?? COMBAT_STAGE_ORDER.filter(s => s !== 'impossible');
    const seeds = options.seeds ?? [1, 2, 3, 4, 5];
    const policy = options.policy ?? 'greedy';

    const diceMath = measureDiceMath();

    const wasOn = isUpgradeableDiceEnabled();
    setUpgradeableDice(true);
    try {
        const pooledAcc = emptyAcc();
        const cells: UpgradeableEconomyCell[] = [];
        for (const preset of presets) {
            for (const stage of stages) {
                const cellAcc = emptyAcc();
                for (const seed of seeds) {
                    accumulateEncounter(pooledAcc, preset, stage, seed, policy);
                    accumulateEncounter(cellAcc, preset, stage, seed, policy);
                }
                cells.push({ preset, stage, stats: finalize(cellAcc) });
            }
        }
        const pooled = finalize(pooledAcc);
        const stakeGap = measureStakeGap(presets, stages, seeds, policy);
        return { diceMath, pooled, cells, stakeGap, config: { presets, stages, seeds, policy } };
    } finally {
        setUpgradeableDice(wasOn);
    }
}

export interface StakeRetirementGap {
    /** Flag-on escalation clock (avg rounds to the escalation tier under §3). */
    flagOnAvgRounds: number;
    /** Flag-off baseline avg rounds (STAKE + read economy present). */
    flagOffAvgRounds: number;
    /** The retired ◆ sink: STAKE's 2/4/6◆ wager tiers no longer draw down ◆. */
    retiredSinkTiersConviction: readonly number[];
    /** Prose note on the escalation-pressure delta (§5). */
    note: string;
}

/** The STAKE-retirement gap (§5): what the retired wager used to add. Compares
 *  flag-on vs flag-off average encounter length on the same cells (the STAKE
 *  loss-tick was an escalation-clock pressure source; its removal lengthens
 *  fights unless repriced elsewhere). Runs the flag-off arm via the shared
 *  `runOneEncounter`. */
function measureStakeGap(
    presets: readonly string[],
    stages: readonly CombatStageId[],
    seeds: readonly number[],
    policy: CombatSimPolicyId,
): StakeRetirementGap {
    // flag-on arm — reuse a compact accumulator for encounter length only.
    let onRounds = 0, onN = 0;
    for (const preset of presets) {
        for (const stage of stages) {
            for (const seed of seeds) {
                const acc = emptyAcc();
                accumulateEncounter(acc, preset, stage, seed, policy);
                onRounds += acc.totalRounds; onN += acc.encounters;
            }
        }
    }
    // flag-off arm — same cells through the legacy driver.
    const wasOn = isUpgradeableDiceEnabled();
    setUpgradeableDice(false);
    let offRounds = 0, offN = 0;
    try {
        for (const preset of presets) {
            for (const stage of stages) {
                const profile = COMBAT_STAGE_PROFILES[stage];
                const enemy = ENEMY_REGISTRY[profile.enemySlugs[0] as keyof typeof ENEMY_REGISTRY];
                const deck = buildPresetDeck(preset);
                const player = buildStagePlayer(profile);
                player.knownCards = deck.slice();
                for (const seed of seeds) {
                    setSeed(seed);
                    const res = runOneEncounter(player, enemy, seed, policy, { deck });
                    offRounds += res.rounds; offN++;
                }
            }
        }
    } finally {
        setUpgradeableDice(wasOn);
    }
    return {
        flagOnAvgRounds: onN > 0 ? onRounds / onN : 0,
        flagOffAvgRounds: offN > 0 ? offRounds / offN : 0,
        retiredSinkTiersConviction: [2, 4, 6],
        note: 'STAKE retired entirely (spec 33 §5, D1 owner-lock): its 2/4/6◆ wager '
            + 'tiers and its escalation-tick-on-loss are removed, not rewired. The ◆ '
            + 'sink delta is the wager spend that no longer occurs; the escalation-clock '
            + 'delta is the loss-tick that no longer pressures long fights. Press Fate '
            + '(1◆/round) is the intended replacement sink.',
    };
}

/** Aligned text report of the pooled gates + per-cell rows + derived-constant
 *  proposals, for the D3 tuning doc and the CLI. */
export function formatUpgradeableEconomyReport(result: ReturnType<typeof simulateUpgradeableEconomy>): string {
    const { diceMath, pooled, cells, stakeGap, config } = result;
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    const num = (x: number) => x.toFixed(3);
    const band = (v: number, lo: number, hi: number) => (v >= lo && v <= hi ? 'PASS' : 'MISS');
    const geq = (v: number, lo: number) => (v >= lo ? 'PASS' : 'MISS');
    const lines: string[] = [];
    lines.push(`Upgradeable-Dice D3 economy witness — policy=${config.policy} seeds=[${config.seeds.join(',')}]`);
    lines.push(`presets=${config.presets.length} stages=[${config.stages.join(',')}] rounds=${pooled.rounds} encounters=${pooled.encounters}`);
    lines.push('');
    lines.push('D3 ROLL GATES — DICE-MATH WITNESS (direct roll stream, N=' + diceMath.rolls + ', stock gear)');
    lines.push('  This is the authoritative reading: it measures the face tables (§1), decoupled from encounter RNG.');
    lines.push(`  E[usable dice/round] = ${num(diceMath.usablePerRound)}   band 1.83 ± 0.05   [${band(diceMath.usablePerRound, 1.78, 1.88)}]`);
    lines.push(`  whiff rate           = ${pct(diceMath.whiffRate)}   band 8.3% ± 1%   [${band(diceMath.whiffRate, 0.073, 0.093)}]`);
    lines.push(`  per-color body       = ${pct(diceMath.perColorAccess.body)}   band >= 65%   [${geq(diceMath.perColorAccess.body, 0.65)}]`);
    lines.push(`  per-color mind       = ${pct(diceMath.perColorAccess.mind)}   band >= 65%   [${geq(diceMath.perColorAccess.mind, 0.65)}]`);
    lines.push(`  per-color heart      = ${pct(diceMath.perColorAccess.heart)}   band >= 65%   [${geq(diceMath.perColorAccess.heart, 0.65)}]`);
    lines.push(`  gross special income = ${num(diceMath.grossSpecialIncomePerRound)}◆/round   (E[specials]=${num(diceMath.specialsPerRound)} × ${SPECIAL_CONVICTION_DEFAULT}◆)`);
    lines.push('');
    lines.push('REALIZED PLAY — IN-ENCOUNTER WITNESS (flag-on matrix, same face tables through the engine RNG)');
    lines.push(`  E[usable dice/round] = ${num(pooled.usablePerRound)}   (dice-math ${num(diceMath.usablePerRound)}; delta = RNG-lattice skew, see report)`);
    lines.push(`  whiff rate           = ${pct(pooled.whiffRate)}   (dice-math ${pct(diceMath.whiffRate)})`);
    lines.push(`  per-color body/mind/heart = ${pct(pooled.perColorAccess.body)} / ${pct(pooled.perColorAccess.mind)} / ${pct(pooled.perColorAccess.heart)}`);
    lines.push(`  ◆ income/round       = ${num(pooled.totalIncomePerRound)}   band 1.2-1.6   [${band(pooled.totalIncomePerRound, 1.2, 1.6)}]`);
    lines.push(`      special (realized) = ${num(pooled.specialIncomePerRound)}   gross(in-play) = ${num(pooled.grossSpecialIncomePerRound)}   spend-rate = ${pct(pooled.specialSpendRate)}`);
    lines.push(`      yield              = ${num(pooled.yieldIncomePerRound)}   overflow = ${num(pooled.overflowIncomePerRound)}`);
    lines.push(`  surge frequency      = ${num(pooled.surgePerRound)}/round   (momentum breaks ${num(pooled.momentumBreakPerRound)}/round)`);
    lines.push(`  dead rounds (0◆ FREE-only) = ${pct(pooled.deadRoundRate)}   (no band — measured only)`);
    lines.push(`  Press Fate casts     = ${num(pooled.pressFatePerRound)}/round`);
    lines.push('');
    lines.push('STAKE-retirement gap (§5)');
    lines.push(`  flag-on avg rounds  = ${num(stakeGap.flagOnAvgRounds)}   flag-off avg rounds = ${num(stakeGap.flagOffAvgRounds)}`);
    lines.push(`  retired ◆ sink tiers = ${stakeGap.retiredSinkTiersConviction.join('/')}◆`);
    lines.push('');
    lines.push('OVERHEAT (constant, not policy-exercised): crack chance = ' + `${(OVERHEAT_CRACK_CHANCE * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('PER-CELL (preset × stage): usable / whiff / income◆ / surge / winRate / rounds');
    for (const c of cells) {
        lines.push(
            `  ${c.preset.padEnd(11)} ${c.stage.padEnd(6)} `
            + `u=${num(c.stats.usablePerRound)} w=${pct(c.stats.whiffRate).padStart(6)} `
            + `inc=${num(c.stats.totalIncomePerRound)} surge=${num(c.stats.surgePerRound)} `
            + `win=${pct(c.stats.winRate).padStart(6)} rounds=${c.stats.avgRounds.toFixed(1)}`,
        );
    }
    return lines.join('\n');
}
