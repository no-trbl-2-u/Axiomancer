// A/B analysis: free-line-conversions sandbox vs Turn-Law baseline (HEAD e203fed9)
// Usage: node analyze-ab-free-line-conversions.js   (from this directory)
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const CONVERTED = [
    'slippery-slope', 'sketch-of-a-thought', 'half-step', 'glimpse',
    'cassandras-burden', 'refrain', 'disarming-smile', 'common-ground',
];

const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

// ── per-card table parser (txt tail) ────────────────────────────────────────
function parseCards(txtFile) {
    const lines = fs.readFileSync(path.join(dir, txtFile), 'utf8').split(/\r?\n/);
    const start = lines.findIndex((l) => l.trim().startsWith('card ') && l.includes('plays'));
    const out = {};
    for (let i = start + 1; i < lines.length; i++) {
        const m = lines[i].match(
            /^\s{2}(\S[\S ]*?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)%\s+(\d+)%\s+(\d+)%\s+(-?\d+)\s+(-?\d+)\s*$/);
        if (!m) continue;
        out[m[1].trim()] = {
            plays: +m[2], bottom: +m[3], top: +m[4], statusLands: +m[5],
            free: +m[7], paid: +m[8], fizz: +m[9], unpl: +m[10],
            hpF: +m[11], hpP: +m[12],
        };
    }
    return out;
}

// ── aggregates ───────────────────────────────────────────────────────────────
function stageTable(base, ab, label) {
    console.log(`\n== Stage win rates & resolutions (${label}) ==`);
    console.log('stage      | base win | A/B win | delta || base V/C/D | A/B V/C/D | statusEng b→a | dom b→a');
    for (const bs of base.stageSummaries) {
        const as = ab.stageSummaries.find((s) => s.stage === bs.stage);
        const f = (s) => `${s.winPathCounts.victory}/${s.winPathCounts.capitulate}/${s.winPathCounts.defeat}`;
        console.log(
            `${bs.stage.padEnd(10)} | ${(bs.winRate * 100).toFixed(1).padStart(7)}% | ${(as.winRate * 100).toFixed(1).padStart(6)}% | ${((as.winRate - bs.winRate) * 100).toFixed(1).padStart(5)}pp || ` +
            `${f(bs).padEnd(11)} | ${f(as).padEnd(10)} | ${(bs.statusEngagement * 100).toFixed(1)}%→${(as.statusEngagement * 100).toFixed(1)}% | ` +
            `${(bs.dominantCardShare * 100).toFixed(0)}%(${bs.dominantCardId})→${(as.dominantCardShare * 100).toFixed(0)}%(${as.dominantCardId})`);
    }
}

function policyTable(base, ab, label) {
    console.log(`\n== Per-policy win rate by stage (${label}) — base→A/B ==`);
    const agg = (j) => {
        const m = {};
        for (const c of j.cells) {
            const k = `${c.spec.stage}|${c.spec.policyId}`;
            m[k] = m[k] || { runs: 0, wins: 0 };
            m[k].runs += c.stats.runs;
            m[k].wins += c.stats.victories + c.stats.mercies;
        }
        return m;
    };
    const b = agg(base); const a = agg(ab);
    const stages = [...new Set(base.cells.map((c) => c.spec.stage))];
    const pols = [...new Set(base.cells.map((c) => c.spec.policyId))];
    console.log('policy      | ' + stages.map((s) => s.padEnd(13)).join(' | '));
    for (const p of pols) {
        const row = stages.map((s) => {
            const kb = b[`${s}|${p}`]; const ka = a[`${s}|${p}`];
            if (!kb) return '-'.padEnd(13);
            const wb = kb.wins / kb.runs; const wa = ka.wins / ka.runs;
            return `${(wb * 100).toFixed(0).padStart(3)}→${(wa * 100).toFixed(0).padStart(3)} (${((wa - wb) * 100).toFixed(0).padStart(3)})`;
        });
        console.log(p.padEnd(11) + ' | ' + row.join(' | '));
    }
}

// dominant-share violations (>0.70) attributable to converted cards, and
// converted-card dominance in WINNING cells (win-impact proxy).
function domTable(base, ab, label) {
    console.log(`\n== dominantCardShare >70% cells (${label}) ==`);
    const viol = (j) => j.cells.filter((c) => c.stats.dominantCardShare > 0.70)
        .map((c) => `${c.spec.stage}/${c.spec.enemySlug}/${c.spec.policyId}: ${c.stats.dominantCardId} ${(c.stats.dominantCardShare * 100).toFixed(0)}% wr=${(c.stats.winRate * 100).toFixed(0)}%`);
    const vb = viol(base); const va = viol(ab);
    console.log(`base: ${vb.length} cells; A/B: ${va.length} cells`);
    const count = (list) => {
        const m = {};
        for (const v of list) { const id = v.split(': ')[1].split(' ')[0]; m[id] = (m[id] || 0) + 1; }
        return m;
    };
    console.log('base by card:', JSON.stringify(count(vb)));
    console.log('A/B  by card:', JSON.stringify(count(va)));
    const abConv = va.filter((v) => CONVERTED.some((c) => v.includes(`: ${c} `)));
    console.log(`A/B >70% cells naming a CONVERTED card (${abConv.length}):`);
    for (const v of abConv) console.log('  ' + v);
}

// win-impact: among cells with wins, how often is a converted card the dominant
// card, and what fraction of total wins sit in cells dominated (>70%) by it.
function winImpact(ab, label) {
    console.log(`\n== Win-impact of converted cards (${label}) ==`);
    let totalWins = 0; const winsByDom = {}; const winsOver70 = {};
    for (const c of ab.cells) {
        const w = c.stats.victories + c.stats.mercies;
        totalWins += w;
        if (w > 0) {
            winsByDom[c.stats.dominantCardId] = (winsByDom[c.stats.dominantCardId] || 0) + w;
            if (c.stats.dominantCardShare > 0.70) {
                winsOver70[c.stats.dominantCardId] = (winsOver70[c.stats.dominantCardId] || 0) + w;
            }
        }
    }
    console.log(`total wins: ${totalWins}`);
    for (const id of CONVERTED) {
        const d = winsByDom[id] || 0; const o = winsOver70[id] || 0;
        console.log(`  ${id.padEnd(20)} dominant-in-win-cells: ${d} (${(d / totalWins * 100).toFixed(1)}% of wins); dominant>70% cells' wins: ${o} (${(o / totalWins * 100).toFixed(1)}%)`);
    }
}

function cardTable(baseTxt, abTxt, label) {
    const b = parseCards(baseTxt); const a = parseCards(abTxt);
    console.log(`\n== Converted-card line telemetry (${label}) — base→A/B ==`);
    console.log('card                 | plays       | free%    | fizz%  | unpl%  | statusLands | hpF          | hpP');
    for (const id of CONVERTED) {
        const cb = b[id]; const ca = a[id];
        if (!ca) { console.log(`${id.padEnd(20)} | NEVER PLAYED in A/B ${cb ? '(played in base)' : ''}`); continue; }
        const cbs = cb || { plays: 0, free: 0, fizz: 0, unpl: 0, statusLands: 0, hpF: 0, hpP: 0 };
        const band = ca.free >= 15 && ca.free <= 85 ? 'IN ' : 'OUT';
        console.log(
            `${id.padEnd(20)} | ${String(cbs.plays).padStart(5)}→${String(ca.plays).padEnd(5)} | ${String(cbs.free).padStart(2)}→${String(ca.free).padEnd(2)} ${band} | ` +
            `${cbs.fizz}→${ca.fizz}   | ${cbs.unpl}→${ca.unpl}   | ${String(cbs.statusLands).padStart(5)}→${String(ca.statusLands).padEnd(5)} | ` +
            `${String(cbs.hpF).padStart(6)}→${String(ca.hpF).padEnd(6)} | ${cbs.hpP}→${ca.hpP}`);
    }
}

for (const seed of [1, 2]) {
    const base = load(`baseline-seed${seed}.json`);
    const ab = load(`ab-free-line-conversions-seed${seed}.json`);
    console.log(`\n──────────── SEED ${seed} ────────────`);
    stageTable(base, ab, `seed ${seed}`);
    policyTable(base, ab, `seed ${seed}`);
    domTable(base, ab, `seed ${seed}`);
    winImpact(ab, `seed ${seed} A/B`);
    cardTable(`baseline-seed${seed}.txt`, `ab-free-line-conversions-seed${seed}.txt`, `seed ${seed}`);
}
