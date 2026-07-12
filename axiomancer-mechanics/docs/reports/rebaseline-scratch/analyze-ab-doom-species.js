// A/B analysis: doom-species sandbox vs baseline, seeds 1 & 2 (Turn-Law-honest, HEAD e203fed9)
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const pct = (x) => (100 * x).toFixed(1) + '%';
const d = (a, b) => ((100 * (a - b)) >= 0 ? '+' : '') + (100 * (a - b)).toFixed(1) + 'pp';

for (const seed of [1, 2]) {
  const base = load(`baseline-seed${seed}.json`);
  const ab = load(`ab-doom-species-seed${seed}.json`);
  console.log(`\n===== SEED ${seed} =====`);

  // 1. stage win-rate deltas
  console.log('\n-- Stage win-rate deltas (AB vs baseline) --');
  for (const s of ab.stageSummaries) {
    const b = base.stageSummaries.find((x) => x.stage === s.stage);
    console.log(
      `${s.stage.padEnd(10)} base=${pct(b.winRate)} ab=${pct(s.winRate)} delta=${d(s.winRate, b.winRate)}` +
      `  statusEng ${pct(b.statusEngagement)}->${pct(s.statusEngagement)}  dotFrac ${pct(b.dotHpFraction)}->${pct(s.dotHpFraction)}` +
      `  dom ${b.dominantCardId}@${pct(b.dominantCardShare)} -> ${s.dominantCardId}@${pct(s.dominantCardShare)}`
    );
  }

  // 2. per-policy (preset) resolution deltas, aggregated over all cells
  console.log('\n-- Per-policy resolution deltas (aggregate wins & win-path counts) --');
  const agg = (j) => {
    const m = {};
    for (const c of j.cells) {
      const p = c.spec.policyId;
      m[p] ??= { runs: 0, wins: 0, victory: 0, mercy: 0, capitulate: 0, concede: 0, defeat: 0, retreat: 0 };
      m[p].runs += c.stats.runs;
      m[p].wins += c.stats.victories + c.stats.mercies;
      for (const k of ['victory', 'mercy', 'capitulate', 'concede', 'defeat', 'retreat'])
        m[p][k] += c.stats.winPathCounts[k];
    }
    return m;
  };
  const bA = agg(base), aA = agg(ab);
  for (const p of Object.keys(aA)) {
    const b = bA[p], a = aA[p];
    console.log(
      `${p.padEnd(13)} win ${pct(b.wins / b.runs)}->${pct(a.wins / a.runs)} (${d(a.wins / a.runs, b.wins / b.runs)})` +
      `  V ${b.victory}->${a.victory}  M ${b.mercy}->${a.mercy}  Cap ${b.capitulate}->${a.capitulate}` +
      `  Con ${b.concede}->${a.concede}  D ${b.defeat}->${a.defeat}  R ${b.retreat}->${a.retreat}`
    );
  }

  // 3. debt-of-days telemetry: per-stage plays, plays in winning cells, dominance
  console.log('\n-- debt-of-days telemetry --');
  let tot = { plays: 0, bottom: 0, top: 0, lands: 0, fizzles: 0, unplayed: 0, hpF: 0, hpP: 0 };
  const byStage = {};
  let playsInWinningCells = 0, winningCellsWithCard = 0, cellsWithCard = 0;
  let maxCellShare = 0, maxCellShareSpec = null, domCells = 0;
  for (const c of ab.cells) {
    const u = c.cardUsage['debt-of-days'];
    const st = c.spec.stage;
    byStage[st] ??= { plays: 0, lands: 0, cellsPlayed: 0, winCellsPlayed: 0 };
    if (!u || u.plays === 0) continue;
    cellsWithCard++;
    byStage[st].plays += u.plays; byStage[st].lands += u.statusLands; byStage[st].cellsPlayed++;
    tot.plays += u.plays; tot.bottom += u.bottomPlays; tot.top += u.topPlays;
    tot.lands += u.statusLands; tot.fizzles += u.fizzles; tot.unplayed += u.unplayedAtPhaseEnd;
    tot.hpF += u.lineContribution.free; tot.hpP += u.lineContribution.paid;
    const wins = c.stats.victories + c.stats.mercies;
    if (wins > 0) { playsInWinningCells += u.plays; winningCellsWithCard++; byStage[st].winCellsPlayed++; }
    // dominance: share of cell HP swing attributed to this card
    let cellHp = 0;
    for (const k of Object.keys(c.cardUsage)) {
      const cu = c.cardUsage[k];
      cellHp += cu.lineContribution.free + cu.lineContribution.paid;
    }
    const share = cellHp > 0 ? (u.lineContribution.free + u.lineContribution.paid) / cellHp : 0;
    if (share > maxCellShare) { maxCellShare = share; maxCellShareSpec = c.spec; }
    if (c.stats.dominantCardId === 'debt-of-days') domCells++;
  }
  console.log('totals:', JSON.stringify(tot));
  console.log(`cells played-in: ${cellsWithCard}/144; winning cells played-in: ${winningCellsWithCard}; plays in winning cells: ${playsInWinningCells}`);
  console.log('per-stage:', JSON.stringify(byStage));
  console.log(`dominantCardId==debt-of-days in ${domCells} cells; max per-cell HP share ${pct(maxCellShare)} at ${maxCellShareSpec ? JSON.stringify(maxCellShareSpec) : 'n/a'}`);
  console.log(`never-played list includes debt-of-days? ${ab.cardCoverage.neverPlayed.includes('debt-of-days')}`);
  // fizzle rate
  const fz = tot.fizzles / Math.max(1, tot.plays + tot.fizzles);
  console.log(`fizzle rate: ${pct(fz)}  unplayed rate: ${pct(tot.unplayed / Math.max(1, tot.plays + tot.unplayed))}`);

  // 4. baseline never-played comparison (did the set change dead-card coverage?)
  console.log(`\ndead-card rate: base=${pct(base.cardCoverage.deadCardRate)} ab=${pct(ab.cardCoverage.deadCardRate)}`);
  const bnp = new Set(base.cardCoverage.neverPlayed), anp = new Set(ab.cardCoverage.neverPlayed);
  console.log('newly dead in AB:', [...anp].filter((x) => !bnp.has(x)).join(', ') || '(none)');
  console.log('revived in AB:', [...bnp].filter((x) => !anp.has(x)).join(', ') || '(none)');
}
