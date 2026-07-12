/** Scratch helper — Phase 27 §3 re-derivations from the three seed matrices. */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'card-meta.json'), 'utf8'));
const rarityOf = new Map(meta.map(m => [m.id, m.rarity]));
const asymOf = new Map(meta.map(m => [m.id, m.asym]));
const LIB_IDS = meta.map(m => m.id);
const STAGES = ['early', 'mid', 'late', 'impossible'];

const seeds = [1, 2, 3].map(s => ({
    seed: s,
    report: JSON.parse(fs.readFileSync(path.join(DIR, `baseline-seed${s}.json`), 'utf8')),
}));

function wMean(cells, pick) {
    let num = 0, den = 0;
    for (const c of cells) { num += pick(c) * c.stats.runs; den += c.stats.runs; }
    return den > 0 ? num / den : NaN;
}

function aggUsage(cells) {
    const totals = new Map();
    for (const cell of cells) {
        for (const u of Object.values(cell.cardUsage)) {
            const a = totals.get(u.cardId) ?? { plays: 0, top: 0, bottom: 0, hpF: 0, hpP: 0 };
            a.plays += u.plays; a.top += u.topPlays; a.bottom += u.bottomPlays;
            a.hpF += u.lineContribution?.free ?? 0; a.hpP += u.lineContribution?.paid ?? 0;
            totals.set(u.cardId, a);
        }
    }
    return totals;
}

const out = { perSeed: {}, offenders: {}, dominantViolations: {} };

for (const { seed, report } of seeds) {
    const cells = report.cells;
    const byStage = {};
    for (const st of STAGES) {
        const sc = cells.filter(c => c.spec.stage === st);
        const blind = sc.filter(c => c.spec.policyId === 'blind');
        const greedy = sc.filter(c => c.spec.policyId === 'greedy');
        byStage[st] = {
            cells: sc.length,
            winRate_all: +wMean(sc, c => c.stats.winRate).toFixed(4),
            winRate_blind: +wMean(blind, c => c.stats.winRate).toFixed(4),
            winRate_greedy: +wMean(greedy, c => c.stats.winRate).toFixed(4),
            statusEngagement_all: +wMean(sc, c => c.stats.statusEngagement).toFixed(4),
            statusEngagement_blind: +wMean(blind, c => c.stats.statusEngagement).toFixed(4),
            statusEngagement_greedy: +wMean(greedy, c => c.stats.statusEngagement).toFixed(4),
            dotHpFraction: +wMean(sc, c => c.stats.dotHpFraction).toFixed(4),
            strikeFraction_sigProxy: +wMean(sc, c => c.stats.strikeFraction).toFixed(4),
            mechanicBurstFraction: +wMean(sc, c => c.stats.mechanicBurstFraction).toFixed(4),
            avgRounds: +wMean(sc, c => c.stats.avgRounds).toFixed(2),
        };
    }

    // Dead-card rate — all-8-policies (cardCoverage) and blind+greedy cut.
    const bgCells = cells.filter(c => ['blind', 'greedy'].includes(c.spec.policyId));
    const bgUsage = aggUsage(bgCells);
    const bgNever = LIB_IDS.filter(id => (bgUsage.get(id)?.plays ?? 0) === 0);
    const allUsage = aggUsage(cells);
    const allNever = LIB_IDS.filter(id => (allUsage.get(id)?.plays ?? 0) === 0);

    // Win paths totals
    const wp = { victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0 };
    for (const c of cells) for (const k of Object.keys(wp)) wp[k] += c.stats.winPathCounts[k] ?? 0;

    out.perSeed[seed] = {
        stages: byStage,
        winPathTotals: wp,
        deadCardRate_allPolicies: +(allNever.length / LIB_IDS.length).toFixed(4),
        deadCards_allPolicies: allNever,
        deadCardRate_blindGreedy: +(bgNever.length / LIB_IDS.length).toFixed(4),
        deadCards_blindGreedy_count: bgNever.length,
        deadCards_blindGreedy: bgNever,
        cardCoverage_reported: report.cardCoverage
            ? { deadCardRate: report.cardCoverage.deadCardRate, neverPlayed: report.cardCoverage.neverPlayed }
            : null,
    };

    // Line telemetry per seed over the WHOLE matrix (library cut).
    const lines = {};
    for (const id of LIB_IDS) {
        if (rarityOf.get(id) === 'rare' || asymOf.get(id)) continue;
        const u = allUsage.get(id);
        const plays = u?.plays ?? 0;
        lines[id] = {
            plays,
            freeShare: plays > 0 ? +(u.top / plays).toFixed(4) : null,
            hpF: u ? Math.round(u.hpF) : 0,
            hpP: u ? Math.round(u.hpP) : 0,
        };
    }
    out.perSeed[seed].lineTelemetry = lines;

    // Dominant-card violations > 0.70 per cell.
    out.dominantViolations[seed] = cells
        .filter(c => c.stats.dominantCardShare > 0.70)
        .map(c => ({
            stage: c.spec.stage, enemy: c.spec.enemySlug, policy: c.spec.policyId,
            card: c.stats.dominantCardId, share: +c.stats.dominantCardShare.toFixed(3),
            winRate: c.stats.winRate,
        }));
}

// Consistent offenders: common/uncommon, >=20 plays EVERY seed, flagged same tail every seed.
const offenders = [];
for (const id of LIB_IDS) {
    if (rarityOf.get(id) === 'rare' || asymOf.get(id)) continue;
    const rows = [1, 2, 3].map(s => out.perSeed[s].lineTelemetry[id]);
    if (rows.some(r => !r || r.plays < 20)) continue;
    const flags = rows.map(r => r.freeShare > 0.85 ? 'PAID-starved' : r.freeShare < 0.15 ? 'FREE-starved' : 'ok');
    if (flags.every(f => f === flags[0]) && flags[0] !== 'ok') {
        offenders.push({
            id, rarity: rarityOf.get(id), verdict: flags[0],
            freeShareBySeed: rows.map(r => r.freeShare),
            playsBySeed: rows.map(r => r.plays),
        });
    }
}
out.offenders = offenders;

fs.writeFileSync(path.join(DIR, 'rederivation-analysis.json'), JSON.stringify(out, null, 1));

// Console digest
for (const s of [1, 2, 3]) {
    const p = out.perSeed[s];
    console.log(`\n== seed ${s} ==`);
    for (const st of STAGES) {
        const r = p.stages[st];
        console.log(`${st.padEnd(10)} win(all/blind/greedy)=${r.winRate_all}/${r.winRate_blind}/${r.winRate_greedy}` +
            ` SE(all/blind)=${r.statusEngagement_all}/${r.statusEngagement_blind}` +
            ` dot=${r.dotHpFraction} sig=${r.strikeFraction_sigProxy} burst=${r.mechanicBurstFraction} rounds=${r.avgRounds}`);
    }
    console.log(`winPaths: ${JSON.stringify(p.winPathTotals)}`);
    console.log(`dead(all8)=${p.deadCardRate_allPolicies} (${p.deadCards_allPolicies.length}) dead(blind+greedy)=${p.deadCardRate_blindGreedy} (${p.deadCards_blindGreedy_count})`);
    console.log(`dominant>0.70 cells: ${out.dominantViolations[s].length}`);
}
console.log('\n== consistent line offenders (3 seeds, >=20 plays each) ==');
for (const o of offenders) console.log(`${o.id} [${o.rarity}] ${o.verdict} freeShare=${o.freeShareBySeed.join('/')} plays=${o.playsBySeed.join('/')}`);
console.log(`total: ${offenders.length}`);
