// Diff baseline-seedN.json vs ab-bridge-rewards-seedN.json for the WS6.3
// matrix-half gate. Node script, no deps. Run from rebaseline-scratch/.
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const BRIDGE = [
    'barbed-compliment', 'the-poured-rampart', 'interest-on-the-flesh',
    'entered-into-evidence', 'stolen-cadence', 'unbroken-countenance',
];

const load = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const pct = x => `${(x * 100).toFixed(1)}%`;
const d = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + 'pp';

for (const seed of [1, 2]) {
    const base = load(`baseline-seed${seed}.json`);
    const ab = load(`ab-bridge-rewards-seed${seed}.json`);

    console.log(`\n===== SEED ${seed} =====`);

    // ---- stage win-rate + resolution deltas -------------------------------
    console.log('\n-- stage summaries (baseline -> AB, delta) --');
    for (const bs of base.stageSummaries) {
        const as = ab.stageSummaries.find(s => s.stage === bs.stage);
        const bw = bs.winPathCounts, aw = as.winPathCounts;
        console.log(
            `${bs.stage.padEnd(10)} win ${pct(bs.winRate)} -> ${pct(as.winRate)} (${d(as.winRate - bs.winRate)})`
            + `  statusEng ${pct(bs.statusEngagement)} -> ${pct(as.statusEngagement)}`
            + `  V/M/C/D ${bw.victory}/${bw.mercy}/${bw.capitulate}/${bw.defeat}`
            + ` -> ${aw.victory}/${aw.mercy}/${aw.capitulate}/${aw.defeat}`,
        );
    }

    // ---- per-cell win-rate deltas (flag |delta| >= 10pp) ------------------
    const key = c => `${c.spec.stage}|${c.spec.enemySlug}|${c.spec.policyId}`;
    const abByKey = new Map(ab.cells.map(c => [key(c), c]));
    console.log('\n-- per-cell win-rate movers (|delta| >= 10pp) --');
    let movers = 0;
    for (const bc of base.cells) {
        const ac = abByKey.get(key(bc));
        if (!ac) { console.log(`MISSING AB CELL ${key(bc)}`); continue; }
        const delta = ac.stats.winRate - bc.stats.winRate;
        if (Math.abs(delta) >= 0.10) {
            movers++;
            const bw = bc.stats.winPathCounts, aw = ac.stats.winPathCounts;
            console.log(
                `${key(bc).padEnd(45)} ${pct(bc.stats.winRate)} -> ${pct(ac.stats.winRate)} (${d(delta)})`
                + `  V/M/C/D ${bw.victory}/${bw.mercy}/${bw.capitulate}/${bw.defeat}`
                + ` -> ${aw.victory}/${aw.mercy}/${aw.capitulate}/${aw.defeat}`,
            );
        }
    }
    if (!movers) console.log('(none)');

    // ---- resolution-mix shift per stage: victory vs capitulate ------------
    console.log('\n-- win-path mix per stage (share of WINS that are capitulate) --');
    for (const bs of base.stageSummaries) {
        const as = ab.stageSummaries.find(s => s.stage === bs.stage);
        const capShare = w => {
            const wins = w.victory + w.mercy + w.capitulate + w.concede;
            return wins === 0 ? 0 : w.capitulate / wins;
        };
        console.log(
            `${bs.stage.padEnd(10)} capShare ${pct(capShare(bs.winPathCounts))} -> ${pct(capShare(as.winPathCounts))}`,
        );
    }

    // ---- bridge-card telemetry -------------------------------------------
    console.log('\n-- bridge-card telemetry (AB run) --');
    const agg = {};
    for (const id of BRIDGE) {
        agg[id] = {
            decks: 0, cellsPlayed: 0, plays: 0, free: 0, paid: 0,
            fizzles: 0, statusLands: 0, dominantCells: 0, maxDomShare: 0,
            byStage: {},
        };
    }
    let totalCells = 0;
    for (const c of ab.cells) {
        totalCells++;
        for (const id of BRIDGE) {
            const a = agg[id];
            if (c.deckCardIds.includes(id)) {
                a.decks++;
                a.byStage[c.spec.stage] = (a.byStage[c.spec.stage] || 0) + 1;
            }
            const u = c.cardUsage && c.cardUsage[id];
            if (u) {
                if (u.plays > 0) a.cellsPlayed++;
                a.plays += u.plays;
                a.free += u.lineContribution ? u.lineContribution.free : 0;
                a.paid += u.lineContribution ? u.lineContribution.paid : 0;
                a.fizzles += u.fizzles;
                a.statusLands += u.statusLands;
            }
            if (c.stats.dominantCardId === id) {
                a.dominantCells++;
                a.maxDomShare = Math.max(a.maxDomShare, c.stats.dominantCardShare);
            }
        }
    }
    for (const id of BRIDGE) {
        const a = agg[id];
        const stages = Object.entries(a.byStage).map(([s, n]) => `${s}:${n}`).join(' ') || '-';
        console.log(
            `${id.padEnd(24)} decks ${String(a.decks).padStart(3)}/${totalCells}`
            + `  plays ${String(a.plays).padStart(5)}  free/paid ${a.free}/${a.paid}`
            + `  fizzles ${a.fizzles}  statusLands ${a.statusLands}`
            + `  dominantIn ${a.dominantCells} cells (max ${pct(a.maxDomShare)})  [${stages}]`,
        );
    }

    // ---- who got displaced: deck composition diff -------------------------
    console.log('\n-- deck composition churn (cards whose deck-inclusion count changed most) --');
    const count = cells => {
        const m = new Map();
        for (const c of cells) for (const id of c.deckCardIds) m.set(id, (m.get(id) || 0) + 1);
        return m;
    };
    const bCount = count(base.cells), aCount = count(ab.cells);
    const ids = new Set([...bCount.keys(), ...aCount.keys()]);
    const churn = [...ids]
        .map(id => ({ id, b: bCount.get(id) || 0, a: aCount.get(id) || 0 }))
        .map(x => ({ ...x, delta: x.a - x.b }))
        .filter(x => x.delta !== 0)
        .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
        .slice(0, 15);
    for (const x of churn) console.log(`${x.id.padEnd(24)} ${x.b} -> ${x.a} (${x.delta >= 0 ? '+' : ''}${x.delta})`);
}
