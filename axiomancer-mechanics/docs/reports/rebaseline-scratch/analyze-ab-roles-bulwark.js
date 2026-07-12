/** Scratch helper — A/B diff for sandbox set 'roles-bulwark' vs the honest baseline (seeds 1-2). */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SEEDS = [1, 2];
const NEW_CARDS = ['grit-between-stones', 'the-unmoved-mover'];
const STAGES = ['early', 'mid', 'late', 'impossible'];

function load(name) {
    const raw = fs.readFileSync(path.join(DIR, name), 'utf8');
    const start = raw.indexOf('{');
    return JSON.parse(raw.slice(start));
}

function wins(c) { return c.stats.victories + c.stats.mercies; }

function stageAgg(cells) {
    const out = {};
    for (const st of STAGES) {
        const sc = cells.filter(c => c.spec.stage === st);
        const runs = sc.reduce((n, c) => n + c.stats.runs, 0);
        const w = sc.reduce((n, c) => n + wins(c), 0);
        const wp = { victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0 };
        for (const c of sc) for (const k of Object.keys(wp)) wp[k] += c.stats.winPathCounts[k] ?? 0;
        out[st] = { cells: sc.length, runs, wins: w, winRate: +(w / runs).toFixed(4), winPath: wp };
    }
    return out;
}

function policyStageWins(cells) {
    const m = {};
    for (const c of cells) {
        const k = `${c.spec.stage}/${c.spec.policyId}`;
        m[k] = (m[k] ?? 0) + wins(c);
    }
    return m;
}

function domCells(cells) {
    return cells.filter(c => c.stats.dominantCardShare > 0.70)
        .map(c => `${c.spec.stage}/${c.spec.enemySlug}/${c.spec.policyId}:${c.stats.dominantCardId}@${c.stats.dominantCardShare.toFixed(2)}`);
}

function cardReport(cells, id) {
    let plays = 0, fizzles = 0, statusLands = 0, free = 0, paid = 0, unplayed = 0, discards = 0;
    let cellsDrafted = 0, cellsPlayed = 0, winsWithDraft = 0, winsWithPlay = 0, domCellCount = 0, maxDom = 0;
    const totalWins = cells.reduce((n, c) => n + wins(c), 0);
    for (const c of cells) {
        const drafted = c.deckCardIds.includes(id);
        const u = c.cardUsage[id];
        if (drafted) { cellsDrafted++; winsWithDraft += wins(c); }
        if (u && u.plays > 0) {
            cellsPlayed++;
            winsWithPlay += wins(c);
            plays += u.plays; fizzles += u.fizzles; statusLands += u.statusLands;
            free += u.lineContribution?.free ?? 0; paid += u.lineContribution?.paid ?? 0;
            unplayed += u.unplayedAtPhaseEnd ?? 0; discards += u.discards ?? 0;
        }
        if (c.stats.dominantCardId === id) {
            maxDom = Math.max(maxDom, c.stats.dominantCardShare);
            if (c.stats.dominantCardShare > 0.70) domCellCount++;
        }
    }
    return {
        plays, fizzles,
        fizzRate: plays + fizzles > 0 ? +(fizzles / (plays + fizzles)).toFixed(4) : 0,
        statusLands, hpFree: free, hpPaid: paid, unplayed, discards,
        cellsDrafted, cellsPlayed,
        winsWithDraft, winsWithPlay, totalWins,
        winShareDrafted: totalWins > 0 ? +(winsWithDraft / totalWins).toFixed(4) : null,
        winSharePlayed: totalWins > 0 ? +(winsWithPlay / totalWins).toFixed(4) : null,
        domCellsOver70: domCellCount, maxDomShare: +maxDom.toFixed(4),
    };
}

const out = {};
for (const seed of SEEDS) {
    const base = load(`baseline-seed${seed}.json`).cells;
    const ab = load(`ab-roles-bulwark-seed${seed}.json`).cells;

    const bs = stageAgg(base), as = stageAgg(ab);
    const stageDelta = {};
    for (const st of STAGES) {
        stageDelta[st] = {
            baselineWinRate: bs[st].winRate, abWinRate: as[st].winRate,
            delta: +(as[st].winRate - bs[st].winRate).toFixed(4),
            baselineWinPath: bs[st].winPath, abWinPath: as[st].winPath,
        };
    }

    // per stage/policy wins delta (only rows that moved)
    const bp = policyStageWins(base), ap = policyStageWins(ab);
    const moved = {};
    for (const k of new Set([...Object.keys(bp), ...Object.keys(ap)])) {
        const d = (ap[k] ?? 0) - (bp[k] ?? 0);
        if (d !== 0) moved[k] = { baseline: bp[k] ?? 0, ab: ap[k] ?? 0, delta: d };
    }

    // dominance bounds
    const bd = domCells(base), ad = domCells(ab);

    out[`seed${seed}`] = {
        stageDelta,
        stagePolicyWinDeltas: moved,
        domCellsOver70: { baseline: bd.length, ab: ad.length },
        domCellsOver70_ab_newCardsOnly: ad.filter(s => NEW_CARDS.some(id => s.includes(`:${id}@`))),
        newCards: Object.fromEntries(NEW_CARDS.map(id => [id, cardReport(ab, id)])),
    };
}

fs.writeFileSync(path.join(DIR, 'ab-roles-bulwark-analysis.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
