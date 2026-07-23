// Table Edition (VOID / branch-only) — parity harness.
//
// Holds the mobile engine port to the batch simulator's measured numbers
// (table-edition-sim.mjs, v3.1 library — now lives in the board-brainstorm
// repo). Reference cells regenerated 2026-07-22 with:
//   node table-edition-sim.mjs --games 200 --brain smart
// (seed 20260722, seed formula SEED0 + g*7919 — reproduced exactly here;
// no --concede/--minions, matching this test's default GameOptions).
// The port keeps the sim's RNG call order, so avg rounds should land within
// a tight band of the reference; drift beyond it means a rules divergence.

import {
  runGame,
  PRESET_NAMES,
  ENEMY_NAMES,
  type PresetName,
  type EnemyName,
} from '@/lib/table-edition/engine';

const SEED0 = 20260722;
const GAMES = 200;

// smart brain · std recipe · 200 games/cell (win%, avg rounds)
const REFERENCE: Record<string, { win: number; rounds: number }> = {
  'STANDSTILL/SKULK': { win: 1.0, rounds: 5.1 },
  'STANDSTILL/SHELLBACK': { win: 1.0, rounds: 5.7 },
  'STANDSTILL/BRUTE': { win: 1.0, rounds: 5.8 },
  'STANDSTILL/BROODMOTHER': { win: 1.0, rounds: 5.6 },
  'CONTAGION/SKULK': { win: 1.0, rounds: 4.0 },
  'CONTAGION/SHELLBACK': { win: 1.0, rounds: 5.2 },
  'CONTAGION/BRUTE': { win: 1.0, rounds: 5.0 },
  'CONTAGION/BROODMOTHER': { win: 1.0, rounds: 4.9 },
  'BASTION/SKULK': { win: 1.0, rounds: 6.0 },
  'BASTION/SHELLBACK': { win: 1.0, rounds: 9.3 },
  'BASTION/BRUTE': { win: 1.0, rounds: 6.6 },
  'BASTION/BROODMOTHER': { win: 1.0, rounds: 5.4 },
  'FOUNDRY/SKULK': { win: 1.0, rounds: 6.6 },
  'FOUNDRY/SHELLBACK': { win: 1.0, rounds: 8.8 },
  'FOUNDRY/BRUTE': { win: 1.0, rounds: 7.9 },
  'FOUNDRY/BROODMOTHER': { win: 0.96, rounds: 8.9 },
  'TORRENT/SKULK': { win: 1.0, rounds: 3.5 },
  'TORRENT/SHELLBACK': { win: 1.0, rounds: 3.9 },
  'TORRENT/BRUTE': { win: 1.0, rounds: 4.0 },
  'TORRENT/BROODMOTHER': { win: 1.0, rounds: 3.9 },
  'INVOCATION/SKULK': { win: 1.0, rounds: 3.0 },
  'INVOCATION/SHELLBACK': { win: 1.0, rounds: 3.7 },
  'INVOCATION/BRUTE': { win: 1.0, rounds: 3.7 },
  'INVOCATION/BROODMOTHER': { win: 1.0, rounds: 3.6 },
  'MALISON/SKULK': { win: 1.0, rounds: 3.5 },
  'MALISON/SHELLBACK': { win: 1.0, rounds: 4.0 },
  'MALISON/BRUTE': { win: 1.0, rounds: 4.0 },
  'MALISON/BROODMOTHER': { win: 1.0, rounds: 4.0 },
  'COVENANT/SKULK': { win: 1.0, rounds: 4.2 },
  'COVENANT/SHELLBACK': { win: 1.0, rounds: 4.9 },
  'COVENANT/BRUTE': { win: 1.0, rounds: 4.8 },
  'COVENANT/BROODMOTHER': { win: 1.0, rounds: 4.7 },
};

function cell(preset: PresetName, enemy: EnemyName, brain: 'random' | 'greedy' | 'smart') {
  let wins = 0;
  let rounds = 0;
  for (let g = 0; g < GAMES; g++) {
    const S = runGame(preset, enemy, 'std', brain, SEED0 + g * 7919);
    if (S.over === 'win') wins++;
    rounds += S.round;
  }
  return { win: wins / GAMES, rounds: rounds / GAMES };
}

describe('table edition engine parity with the batch simulator', () => {
  test.each(
    PRESET_NAMES.flatMap((p) => ENEMY_NAMES.map((e) => [p, e] as const)),
  )('%s vs %s (smart, std) matches the sim reference', (preset, enemy) => {
    const got = cell(preset, enemy, 'smart');
    const ref = REFERENCE[`${preset}/${enemy}`];
    expect(got.win).toBeGreaterThanOrEqual(ref.win - 0.03);
    expect(Math.abs(got.rounds - ref.rounds)).toBeLessThanOrEqual(0.6);
  });

  test('skill gradient survives the port: random never beats smart', () => {
    for (const preset of PRESET_NAMES) {
      const rand = cell(preset, 'SHELLBACK', 'random');
      const smart = REFERENCE[`${preset}/SHELLBACK`];
      expect(rand.win).toBeLessThanOrEqual(smart.win + 0.001);
    }
  });

  test('deterministic: same seed, same outcome', () => {
    const a = runGame('TORRENT', 'BRUTE', 'std', 'smart', 12345);
    const b = runGame('TORRENT', 'BRUTE', 'std', 'smart', 12345);
    expect(a.over).toBe(b.over);
    expect(a.round).toBe(b.round);
    expect(a.p.hp).toBe(b.p.hp);
    expect(a.stats).toEqual(b.stats);
  });
});
