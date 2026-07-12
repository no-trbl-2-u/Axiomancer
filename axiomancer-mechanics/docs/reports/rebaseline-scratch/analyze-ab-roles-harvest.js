/** Scratch helper — WS4.1 roles-forge A/B vs the e203fed9 honest baseline. */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const NEW_CARDS = ['the-long-ledger', 'seedcorn-sacrifice'];
const STAGES = ['early', 'mid', 'late', 'impossible'];
const POLICIES = ['greedy', 'blind', 'dot-weaver', 'control-lock', 'aggro-brute', 'turtle', 'chaos', 'mercy-seeker'];
const UTILITY_POLICIES = ['turtle', 'mercy-seeker']; // preferredFocus 'utility' = the forge/foundry draft slice

const load = (f) => {
    const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
    return JSON.parse(raw.slice(raw.indexOf('{'))); // npm banner may precede the JSON
};

function wMean(cells, pick) {
    let n = 0, d = 0;
    for (const c of cells) { n += pick(c) * c.stats.runs; d += c.stats.runs; }
    return d > 0 ? n / d : NaN;
}
const pct = (x) => (100 * x).toFixed(1) + '%';

function stageTable(rep) {
    const out = {};
    for (const st of STAGES) {
        const sc = rep.cells.filter(c => c.spec.stage === st);
        out[st] = {
            win: wMean(sc, c => c.stats.winRate),
            wins: sc.reduce((a, c) => a + c.stats.victories + c.stats.mercies, 0),
            vic: sc.reduce((a, c) => a + (c.stats.winPathCounts.victory ?? 0), 0),
            cap: sc.reduce((a, c) => a + (c.stats.winPathCounts.capitulate ?? 0), 0),
            def: sc.reduce((a, c) => a + (c.stats.winPathCounts.defeat ?? 0), 0),
        };
    }
    return out;
}

function policyStage(rep, st) {
    const out = {};
    for (const p of POLICIES) {
        const sc = rep.cells.filter(c => c.spec.stage === st && c.spec.policyId === p);
        out[p] = wMean(sc, c => c.stats.winRate);
    }
    return out;
}

function cardReport(rep, cardId) {
    let drafted = 0, plays = 0, top = 0, bottom = 0, fizz = 0, unpl = 0, lands = 0, hpF = 0, hpP = 0;
    let draftedCells = 0, draftedCellWins = 0, playedCellWins = 0, playedCells = 0;
    let domCells = [];
    const perStage = {};
    for (const st of STAGES) perStage[st] = { drafted: 0, plays: 0, cellWins: 0 };
    for (const c of rep.cells) {
        const inDeck = c.deckCardIds.includes(cardId);
        const u = c.cardUsage[cardId];
        if (inDeck) {
            drafted++;
            draftedCells++;
            const wins = c.stats.victories + c.stats.mercies;
            draftedCellWins += wins;
            perStage[c.spec.stage].drafted++;
            perStage[c.spec.stage].cellWins += wins;
        }
        if (u) {
            plays += u.plays; top += u.topPlays; bottom += u.bottomPlays;
            fizz += u.fizzles; unpl += u.unplayedAtPhaseEnd; lands += u.statusLands;
            hpF += u.lineContribution?.free ?? 0; hpP += u.lineContribution?.paid ?? 0;
            perStage[c.spec.stage].plays += u.plays;
            if (u.plays > 0) {
                playedCells++;
                playedCellWins += c.stats.victories + c.stats.mercies;
            }
        }
        if (c.stats.dominantCardId === cardId && c.stats.dominantCardShare > 0.70) {
            domCells.push(`${c.spec.stage}/${c.spec.enemySlug}/${c.spec.policyId}=${c.stats.dominantCardShare.toFixed(2)}`);
        }
    }
    return { drafted, draftedCellWins, playedCells, playedCellWins, plays, top, bottom, fizz, unpl, lands, hpF, hpP, domCells, perStage };
}

const pairs = [1, 2, 3].map(seed => ({
    seed,
    base: load(`baseline-seed${seed}.json`),
    ab: load(`ab-roles-harvest-seed${seed}.json`),
}));

for (const { seed, base, ab } of pairs) {
    console.log(`\n=== seed ${seed} ===`);
    const bs = stageTable(base), as = stageTable(ab);
    console.log('stage      base-win   ab-win    delta     base vic/cap/def -> ab vic/cap/def');
    for (const st of STAGES) {
        console.log(
            `${st.padEnd(10)} ${pct(bs[st].win).padStart(7)}  ${pct(as[st].win).padStart(7)}  ` +
            `${((as[st].win - bs[st].win) * 100).toFixed(2).padStart(6)}pp   ` +
            `${bs[st].vic}/${bs[st].cap}/${bs[st].def} -> ${as[st].vic}/${as[st].cap}/${as[st].def}`);
    }
    for (const st of ['early', 'late']) {
        const bp = policyStage(base, st), ap = policyStage(ab, st);
        console.log(`  per-policy ${st}: ` + POLICIES.map(p =>
            `${p}=${pct(bp[p])}>${pct(ap[p])}`).join(' '));
    }
    const bLateU = wMean(base.cells.filter(c => c.spec.stage === 'late' && UTILITY_POLICIES.includes(c.spec.policyId)), c => c.stats.winRate);
    const aLateU = wMean(ab.cells.filter(c => c.spec.stage === 'late' && UTILITY_POLICIES.includes(c.spec.policyId)), c => c.stats.winRate);
    console.log(`  utility-focus (turtle+mercy-seeker) late: base=${pct(bLateU)} ab=${pct(aLateU)}`);
    const bMidU = wMean(base.cells.filter(c => c.spec.stage === 'mid' && UTILITY_POLICIES.includes(c.spec.policyId)), c => c.stats.winRate);
    const aMidU = wMean(ab.cells.filter(c => c.spec.stage === 'mid' && UTILITY_POLICIES.includes(c.spec.policyId)), c => c.stats.winRate);
    console.log(`  utility-focus (turtle+mercy-seeker) mid:  base=${pct(bMidU)} ab=${pct(aMidU)}`);

    for (const id of NEW_CARDS) {
        const r = cardReport(ab, id);
        console.log(`  [${id}] draftedCells=${r.drafted}/144 plays=${r.plays} (top=${r.top} bottom=${r.bottom}) ` +
            `fizz=${r.fizz} unplayed=${r.unpl} statusLands=${r.lands} hpF=${r.hpF} hpP=${r.hpP}`);
        console.log(`      wins in drafted cells=${r.draftedCellWins}, wins in cells where it was PLAYED=${r.playedCellWins} (playedCells=${r.playedCells})`);
        console.log(`      per-stage drafted/plays/cellWins: ` + STAGES.map(st =>
            `${st}=${r.perStage[st].drafted}/${r.perStage[st].plays}/${r.perStage[st].cellWins}`).join(' '));
        console.log(`      dominant>0.70 cells: ${r.domCells.length ? r.domCells.join(', ') : 'none'}`);
    }

    // total wins in AB run, for the >70%-of-wins dominance kill condition
    const totalWinsAb = ab.cells.reduce((a, c) => a + c.stats.victories + c.stats.mercies, 0);
    console.log(`  AB total winning runs: ${totalWinsAb}`);
}
