// WS7.1 RUPTURE cap-fraction sweep analyzer.
// Parses sweep-F<value>.txt (full matrix, policy-pick) + sweep-F<value>-preset-{foundry,tithe}.txt
// and prints: per-stage mean win rates, Foundry/Tithe per-stage win rates,
// and max per-cell dominant-card share in the policy-pick matrix.
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const FS = ['0.25', '0.35', '0.45', '0.60'];

function parseMatrixRows(text) {
    // rows look like:
    //   early      grave-larva   greedy   policy-pick   100%  57/3/0/0  2.0  35%  54%  46%  100% 1.00  35%
    const rows = [];
    for (const line of text.split('\n')) {
        const m = line.match(
            /^\s{2}(early|mid|late|impossible)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%\s+(\d+)\/(\d+)\/(\d+)\/(\d+)\s+([\d.]+)\s+(\d+)%\s+(\d+)%\s+(\d+)%\s+(\d+)%\s+([\d.]+)\s+(\d+)%\s*$/,
        );
        if (m) {
            rows.push({
                stage: m[1], enemy: m[2], policy: m[3], deck: m[4],
                win: Number(m[5]), rounds: Number(m[10]),
                statusEng: Number(m[11]), dom: Number(m[16]),
            });
        }
    }
    return rows;
}

function stageAgg(rows) {
    const stages = ['early', 'mid', 'late', 'impossible'];
    const out = {};
    for (const s of stages) {
        const rs = rows.filter(r => r.stage === s);
        if (!rs.length) continue;
        out[s] = {
            cells: rs.length,
            win: rs.reduce((a, r) => a + r.win, 0) / rs.length,
            maxDom: Math.max(...rs.map(r => r.dom)),
        };
    }
    return out;
}

function fmtStage(agg) {
    return ['early', 'mid', 'late', 'impossible']
        .map(s => agg[s] ? `${s}=${agg[s].win.toFixed(1)}%` : `${s}=n/a`)
        .join(' ');
}

for (const F of FS) {
    const matrix = fs.readFileSync(path.join(DIR, `sweep-F${F}.txt`), 'utf8');
    const rows = parseMatrixRows(matrix).filter(r => r.deck === 'policy-pick');
    const agg = stageAgg(rows);
    const overDom = rows.filter(r => r.dom > 70);
    console.log(`\n=== F=${F} ===`);
    console.log(`matrix (policy-pick, ${rows.length} cells): ${fmtStage(agg)}`);
    console.log(`  max per-cell dom: ${Math.max(...rows.map(r => r.dom))}%  cells>70%: ${overDom.length}` +
        (overDom.length ? `  [${overDom.map(r => `${r.stage}/${r.enemy}/${r.policy}=${r.dom}%`).join(', ')}]` : ''));
    for (const preset of ['foundry', 'tithe']) {
        const p = fs.readFileSync(path.join(DIR, `sweep-F${F}-preset-${preset}.txt`), 'utf8');
        const prow = parseMatrixRows(p);
        const pagg = stageAgg(prow);
        const pOver = prow.filter(r => r.dom > 70);
        console.log(`${preset.padEnd(8)}(greedy): ${fmtStage(pagg)}  maxDom=${Math.max(...prow.map(r => r.dom))}% cells>70%: ${pOver.length}`);
    }
}
