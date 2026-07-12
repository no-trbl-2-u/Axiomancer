/**
 * Tabulates reward-draft-raw.json: baseline pick-rate spread (floor
 * calibration), per-bridge x origin pick rates (WS6.3), microset x origin
 * pick rates (WS5.4). Prints markdown-ish tables to stdout.
 */
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'reward-draft-raw.json'), 'utf8'));
const { screens, seeds, data } = raw;
const ORIGINS = Object.keys(data.baseline);

const BRIDGES = {
    'barbed-compliment': ['erosion', 'grace'],
    'the-poured-rampart': ['foundry', 'bastion'],
    'interest-on-the-flesh': ['penitent', 'tithe'],
    'entered-into-evidence': ['augury', 'oratory'],
    'stolen-cadence': ['standstill', 'refrain'],
    'unbroken-countenance': ['bastion', 'grace'],
};
const MICROSET = [
    'captatio-benevolentiae', 'in-medias-res', 'coda',
    'dying-echo', 'wages-of-weakness', 'answered-in-kind',
];

function meanRate(setKey, origin, cardId, field) {
    let total = 0;
    for (const s of seeds) total += (data[setKey][origin][s][field][cardId] ?? 0);
    return total / seeds.length / screens;
}
function perSeedRates(setKey, origin, cardId, field) {
    return seeds.map(s => (data[setKey][origin][s][field][cardId] ?? 0) / screens);
}
const pct = x => (100 * x).toFixed(1) + '%';

// ── Baseline calibration ─────────────────────────────────────────────────────
console.log('== BASELINE (no injection): per-origin library pick-rate spread ==');
console.log('origin | archetype | focus | cards picked >0 | max | p90 | median(>0) | #cards >=5% | #cards >=2.5%');
for (const o of ORIGINS) {
    const ids = new Set();
    for (const s of seeds) for (const id of Object.keys(data.baseline[o][s].picks)) ids.add(id);
    const rates = [...ids].map(id => meanRate('baseline', o, id, 'picks')).sort((a, b) => b - a);
    const p90 = rates[Math.floor(rates.length * 0.1)];
    const med = rates[Math.floor(rates.length / 2)];
    const ge5 = rates.filter(r => r >= 0.05).length;
    const ge25 = rates.filter(r => r >= 0.025).length;
    const d = data.baseline[o][seeds[0]];
    console.log(`${o} | ${d.archetype} | ${d.focus} | ${rates.length} | ${pct(rates[0])} | ${pct(p90)} | ${pct(med)} | ${ge5} | ${ge25}`);
}

// ── Bridge table ─────────────────────────────────────────────────────────────
console.log('\n== BRIDGE-REWARDS: pick rate (mean of seeds 1-3) per origin ==');
console.log('rows: bridge card; cols: origins; * = parent origin');
console.log('card | ' + ORIGINS.join(' | '));
for (const [card, parents] of Object.entries(BRIDGES)) {
    const cells = ORIGINS.map(o => {
        const r = meanRate('bridge-rewards', o, card, 'picks');
        const mark = parents.includes(o) ? '*' : '';
        return pct(r) + mark;
    });
    console.log(`${card} | ${cells.join(' | ')}`);
}
console.log('\n-- bridge OFFER rates (mean) --');
console.log('card | ' + ORIGINS.join(' | '));
for (const card of Object.keys(BRIDGES)) {
    console.log(`${card} | ${ORIGINS.map(o => pct(meanRate('bridge-rewards', o, card, 'offers'))).join(' | ')}`);
}
console.log('\n-- bridge per-seed pick rates (stability check) --');
for (const [card, parents] of Object.entries(BRIDGES)) {
    for (const o of ORIGINS) {
        const rs = perSeedRates('bridge-rewards', o, card, 'picks');
        if (rs.some(r => r > 0)) {
            console.log(`${card} @ ${o}${parents.includes(o) ? ' (parent)' : ''}: ${rs.map(pct).join(', ')}`);
        }
    }
}

// ── Microset table ───────────────────────────────────────────────────────────
console.log('\n== SEQUENCING-MICROSET: pick rate (mean of seeds 1-3) per origin ==');
console.log('card | ' + ORIGINS.join(' | '));
for (const card of MICROSET) {
    console.log(`${card} | ${ORIGINS.map(o => pct(meanRate('sequencing-microset', o, card, 'picks'))).join(' | ')}`);
}
console.log('\n-- microset OFFER rates (mean) --');
console.log('card | ' + ORIGINS.join(' | '));
for (const card of MICROSET) {
    console.log(`${card} | ${ORIGINS.map(o => pct(meanRate('sequencing-microset', o, card, 'offers'))).join(' | ')}`);
}
console.log('\n-- microset per-seed pick rates (stability check) --');
for (const card of MICROSET) {
    for (const o of ORIGINS) {
        const rs = perSeedRates('sequencing-microset', o, card, 'picks');
        if (rs.some(r => r > 0)) console.log(`${card} @ ${o}: ${rs.map(pct).join(', ')}`);
    }
}
