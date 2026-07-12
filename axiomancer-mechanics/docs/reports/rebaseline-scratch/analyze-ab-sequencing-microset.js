/** Scratch helper — A/B diff for sandbox set `sequencing-microset` vs the
 *  HEAD (e203fed9) baseline, seeds 1 & 2. WS5 gate evidence. */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const MICRO = [
    'captatio-benevolentiae', 'in-medias-res', // OPENING (early)
    'coda', 'dying-echo',                      // finale (late)
    'wages-of-weakness', 'answered-in-kind',   // after-cost
];
const FAMILY = {
    'captatio-benevolentiae': 'opening', 'in-medias-res': 'opening',
    'coda': 'finale', 'dying-echo': 'finale',
    'wages-of-weakness': 'after-cost', 'answered-in-kind': 'after-cost',
};
const STAGES = ['early', 'mid', 'late', 'impossible'];
const POLICIES = ['greedy', 'blind', 'dot-weaver', 'control-lock', 'aggro-brute', 'turtle', 'chaos', 'mercy-seeker'];

function load(f) { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); }
function wMean(cells, pick) {
    let n = 0, d = 0;
    for (const c of cells) { n += pick(c) * c.stats.runs; d += c.stats.runs; }
    return d > 0 ? n / d : NaN;
}
const pct = x => (100 * x).toFixed(1) + '%';
const dpct = x => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + 'pp';

for (const seed of [1, 2]) {
    const base = load(`baseline-seed${seed}.json`);
    const ab = load(`ab-sequencing-microset-seed${seed}.json`);
    console.log(`\n===== seed ${seed} =====`);

    // 1) stage win-rate + witness deltas
    console.log('-- stage deltas (A/B minus baseline, run-weighted) --');
    for (const st of STAGES) {
        const bc = base.cells.filter(c => c.spec.stage === st);
        const ac = ab.cells.filter(c => c.spec.stage === st);
        const bw = wMean(bc, c => c.stats.winRate), aw = wMean(ac, c => c.stats.winRate);
        const bbl = wMean(bc.filter(c => c.spec.policyId === 'blind'), c => c.stats.winRate);
        const abl = wMean(ac.filter(c => c.spec.policyId === 'blind'), c => c.stats.winRate);
        const bse = wMean(bc, c => c.stats.statusEngagement), ase = wMean(ac, c => c.stats.statusEngagement);
        const br = wMean(bc, c => c.stats.avgRounds), ar = wMean(ac, c => c.stats.avgRounds);
        console.log(
            `${st.padEnd(10)} win ${pct(bw)}→${pct(aw)} (${dpct(aw - bw)})` +
            `  blind ${pct(bbl)}→${pct(abl)} (${dpct(abl - bbl)})` +
            `  SE ${pct(bse)}→${pct(ase)} (${dpct(ase - bse)})` +
            `  rounds ${br.toFixed(2)}→${ar.toFixed(2)}`);
    }

    // 2) per-policy (preset proxy under policy-pick) resolution deltas
    console.log('-- per-policy resolution deltas (V/M/C/D totals across matrix) --');
    for (const pol of POLICIES) {
        const bc = base.cells.filter(c => c.spec.policyId === pol);
        const ac = ab.cells.filter(c => c.spec.policyId === pol);
        const sum = (cells) => {
            const t = { victory: 0, capitulate: 0, mercy: 0, concede: 0, defeat: 0, retreat: 0, runs: 0 };
            for (const c of cells) {
                t.runs += c.stats.runs;
                for (const k of Object.keys(c.stats.winPathCounts)) t[k] += c.stats.winPathCounts[k] ?? 0;
            }
            return t;
        };
        const b = sum(bc), a = sum(ac);
        const bwr = (b.victory + b.capitulate + b.mercy + b.concede) / b.runs;
        const awr = (a.victory + a.capitulate + a.mercy + a.concede) / a.runs;
        console.log(
            `${pol.padEnd(13)} win ${pct(bwr)}→${pct(awr)} (${dpct(awr - bwr)})` +
            `  V ${b.victory}→${a.victory}  C ${b.capitulate}→${a.capitulate}` +
            `  M ${b.mercy}→${a.mercy}  D ${b.defeat}→${a.defeat}`);
    }

    // 3) microset card telemetry (A/B run only — cards absent from baseline)
    console.log('-- microset card telemetry (aggregate over 144 cells) --');
    const agg = new Map();
    let cellsPresent = new Map(); let domCells = new Map(); let dom70 = new Map();
    let totalHpAll = 0; const hpByCard = new Map();
    for (const cell of ab.cells) {
        for (const u of Object.values(cell.cardUsage)) {
            const hp = (u.lineContribution?.free ?? 0) + (u.lineContribution?.paid ?? 0);
            totalHpAll += hp;
            hpByCard.set(u.cardId, (hpByCard.get(u.cardId) ?? 0) + hp);
        }
        for (const id of MICRO) {
            if (cell.deckCardIds.includes(id)) cellsPresent.set(id, (cellsPresent.get(id) ?? 0) + 1);
            const u = cell.cardUsage[id];
            if (!u) continue;
            const a = agg.get(id) ?? { plays: 0, top: 0, bottom: 0, lands: 0, fizzles: 0, discards: 0, hpF: 0, hpP: 0, unplayed: 0 };
            a.plays += u.plays; a.top += u.topPlays; a.bottom += u.bottomPlays;
            a.lands += u.statusLands; a.fizzles += u.fizzles; a.discards += u.discards;
            a.hpF += u.lineContribution?.free ?? 0; a.hpP += u.lineContribution?.paid ?? 0;
            a.unplayed += u.unplayedAtPhaseEnd ?? 0;
            agg.set(id, a);
            if (cell.stats.dominantCardId === id) {
                domCells.set(id, (domCells.get(id) ?? 0) + 1);
                if (cell.stats.dominantCardShare > 0.70) dom70.set(id, (dom70.get(id) ?? 0) + 1);
            }
        }
    }
    const famPlays = { opening: 0, finale: 0, 'after-cost': 0 };
    for (const id of MICRO) {
        const a = agg.get(id) ?? { plays: 0, top: 0, bottom: 0, lands: 0, fizzles: 0, hpF: 0, hpP: 0, unplayed: 0 };
        famPlays[FAMILY[id]] += a.plays;
        const present = cellsPresent.get(id) ?? 0;
        console.log(
            `${id.padEnd(24)} present ${present}/144  plays ${String(a.plays).padStart(5)}` +
            `  free-line ${a.plays ? pct(a.top / a.plays) : '—'}` +
            `  lands ${a.plays ? pct(a.lands / a.plays) : '—'}` +
            `  fizzles ${a.fizzles} (${a.plays ? pct(a.fizzles / a.plays) : '—'})` +
            `  hp F/P ${Math.round(a.hpF)}/${Math.round(a.hpP)}` +
            `  hpShare ${pct((hpByCard.get(id) ?? 0) / totalHpAll)}` +
            `  domCells ${domCells.get(id) ?? 0} (>70%: ${dom70.get(id) ?? 0})`);
    }
    const famTotal = famPlays.opening + famPlays.finale + famPlays['after-cost'];
    console.log(`family play split — opening ${pct(famPlays.opening / famTotal)} | finale ${pct(famPlays.finale / famTotal)} | after-cost ${pct(famPlays['after-cost'] / famTotal)}  (total ${famTotal})`);

    // matrix-wide dominance / entropy shifts
    const bDom = wMean(base.cells, c => c.stats.dominantCardShare);
    const aDom = wMean(ab.cells, c => c.stats.dominantCardShare);
    const bH = wMean(base.cells, c => c.stats.usageEntropy);
    const aH = wMean(ab.cells, c => c.stats.usageEntropy);
    const bU = wMean(base.cells, c => c.stats.deckUtilization);
    const aU = wMean(ab.cells, c => c.stats.deckUtilization);
    const bViol = base.cells.filter(c => c.stats.dominantCardShare > 0.70).length;
    const aViol = ab.cells.filter(c => c.stats.dominantCardShare > 0.70).length;
    console.log(`matrix: domShare ${pct(bDom)}→${pct(aDom)}  entropy ${bH.toFixed(3)}→${aH.toFixed(3)}  util ${pct(bU)}→${pct(aU)}  dom>70% cells ${bViol}→${aViol}`);
    const aViolMicro = ab.cells.filter(c => c.stats.dominantCardShare > 0.70 && MICRO.includes(c.stats.dominantCardId)).length;
    console.log(`dom>70% cells where dominant card IS a microset card: ${aViolMicro}`);

    // stage×policy cells with |win delta| >= 15pp (largest movers)
    console.log('-- largest stage x policy win movers (|delta| >= 15pp) --');
    const movers = [];
    for (const ac of ab.cells) {
        const bc = base.cells.find(c => c.spec.stage === ac.spec.stage && c.spec.enemySlug === ac.spec.enemySlug && c.spec.policyId === ac.spec.policyId);
        if (!bc) continue;
        const d = ac.stats.winRate - bc.stats.winRate;
        if (Math.abs(d) >= 0.15) movers.push({ st: ac.spec.stage, en: ac.spec.enemySlug, pol: ac.spec.policyId, b: bc.stats.winRate, a: ac.stats.winRate, d });
    }
    movers.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
    for (const m of movers.slice(0, 12)) console.log(`  ${m.st}/${m.en}/${m.pol}: ${pct(m.b)}→${pct(m.a)} (${dpct(m.d)})`);
    if (!movers.length) console.log('  none');
}
