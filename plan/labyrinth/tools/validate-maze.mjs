#!/usr/bin/env node
// Validates the labyrinth act graphs against their authored
// invariants (roadmap step 8; run early after each act lands).
// Parses the "Room roster" table in acts/act<N>.md directly so the
// markdown stays the single source of truth.
//
// Usage: node plan/labyrinth/tools/validate-maze.mjs [act1 act2 act3]

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const actsDir = join(here, '..', 'acts');

// Per-act invariants. Displays are strings (display numbers are
// player-facing labels, engine ids stay in the tables).
const ACTS = {
  act1: {
    start: '1',
    boss: '31',
    expectedShortestMoves: 7,
    expectedUniqueShortest: true,
    // every edge here must be a mandatory cut start->boss
    secretEdges: [['13', '17']],
    // gate edges are blocked until the act answer; open for
    // path checks, but boss must be unreachable with them closed
    gateEdges: [['19', '29']],
    realms: { Path: 9, Loop: 4, Trap: 2 },
    honestFragments: 4,
    counterfeits: 4,
  },
  act2: null, // filled in when acts/act2.md lands
  act3: null, // filled in when acts/act3.md lands
};

function parseRoster(md, file) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith('| Engine id |'));
  if (start === -1) throw new Error(`${file}: no roster table found`);
  const rooms = [];
  for (let i = start + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) break;
    const cells = line.split('|').map((c) => c.trim()).slice(1, -1);
    if (cells.length < 7) throw new Error(`${file}: bad roster row: ${line}`);
    const [engineId, display, name, realm, doorsRaw, fragment, override] = cells;
    const doors = [];
    // split on commas that are not inside parentheses
    const tokens = doorsRaw.match(/(?:[^,(]|\([^)]*\))+/g) ?? [];
    for (const tok of tokens.map((t) => t.trim())) {
      if (!tok || tok === '—') continue;
      const m = tok.match(/^(\d+|descent)\s*(<->|->)?\s*(?:\((.*)\))?$/);
      if (!m) throw new Error(`${file}: unparsable door token "${tok}" in room ${display}`);
      const [, dest, arrow = '<->', note = ''] = m;
      if (dest === 'descent') continue; // act-exit marker, not a graph edge
      doors.push({
        dest,
        twoWay: arrow === '<->',
        secret: /secret/i.test(note),
        gate: /gate/i.test(note),
        note,
      });
    }
    rooms.push({ engineId, display, name, realm: realm.replace(/\s*\(.*\)/, ''), doors, fragment, override });
  }
  return rooms;
}

// Build directed adjacency. Two-way listings contribute their own
// direction only; symmetry is checked separately so an authoring
// slip (A <-> B but B missing A) is caught, not silently repaired.
function buildEdges(rooms, { openGates } = { openGates: true }) {
  const adj = new Map(rooms.map((r) => [r.display, new Set()]));
  for (const r of rooms) {
    for (const d of r.doors) {
      if (d.gate && !openGates) continue;
      adj.get(r.display).add(d.dest);
    }
  }
  return adj;
}

function bfs(adj, from) {
  const dist = new Map([[from, 0]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const nxt of adj.get(cur) ?? []) {
      if (!dist.has(nxt)) {
        dist.set(nxt, dist.get(cur) + 1);
        q.push(nxt);
      }
    }
  }
  return dist;
}

function countShortestPaths(adj, from, to) {
  const dist = bfs(adj, from);
  if (!dist.has(to)) return 0;
  const order = [...dist.entries()].sort((a, b) => a[1] - b[1]).map(([n]) => n);
  const ways = new Map([[from, 1]]);
  for (const node of order) {
    for (const nxt of adj.get(node) ?? []) {
      if (dist.get(nxt) === dist.get(node) + 1) {
        ways.set(nxt, (ways.get(nxt) ?? 0) + (ways.get(node) ?? 0));
      }
    }
  }
  return ways.get(to) ?? 0;
}

let failures = 0;
const fail = (msg) => { failures++; console.error(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

const requested = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ACTS);

for (const act of requested) {
  const cfg = ACTS[act];
  const file = join(actsDir, `${act}.md`);
  console.log(`\n== ${act} ==`);
  if (!cfg) { console.log('  (no invariants registered yet — skipped)'); continue; }
  if (!existsSync(file)) { fail(`${act}.md missing`); continue; }
  const rooms = parseRoster(readFileSync(file, 'utf8'), `${act}.md`);
  const byDisplay = new Map(rooms.map((r) => [r.display, r]));

  // -- structural checks ------------------------------------------
  if (new Set(rooms.map((r) => r.display)).size !== rooms.length) {
    fail('duplicate display numbers');
  } else pass(`${rooms.length} rooms, display numbers unique`);

  for (const r of rooms) {
    for (const d of r.doors) {
      if (!byDisplay.has(d.dest)) fail(`room ${r.display} has door to unknown room ${d.dest}`);
      else if (d.twoWay && !d.gate) {
        const back = byDisplay.get(d.dest).doors.find((b) => b.dest === r.display);
        if (!back) fail(`asymmetric <->: ${r.display} lists ${d.dest} but not vice versa`);
      } else if (!d.twoWay) {
        const back = byDisplay.get(d.dest).doors.find((b) => b.dest === r.display && b.twoWay);
        if (back) fail(`one-way ${r.display}->${d.dest} but ${d.dest} lists a two-way back-edge`);
      }
    }
  }
  pass('edge symmetry / one-way consistency checked');

  const realmCounts = {};
  for (const r of rooms) realmCounts[r.realm] = (realmCounts[r.realm] ?? 0) + 1;
  for (const [realm, want] of Object.entries(cfg.realms)) {
    if ((realmCounts[realm] ?? 0) !== want) fail(`realm ${realm}: ${realmCounts[realm] ?? 0} rooms, expected ${want}`);
  }
  pass(`realm split ${Object.entries(realmCounts).map(([k, v]) => `${k}:${v}`).join(' ')}`);

  const honest = rooms.filter((r) => /carved/.test(r.fragment)).length;
  const forged = rooms.filter((r) => /painted/.test(r.fragment)).length;
  if (honest !== cfg.honestFragments) fail(`honest fragments: ${honest}, expected ${cfg.honestFragments}`);
  if (forged !== cfg.counterfeits) fail(`counterfeits: ${forged}, expected ${cfg.counterfeits}`);
  pass(`fragments: ${honest} carved / ${forged} painted`);

  // -- path checks ------------------------------------------------
  const open = buildEdges(rooms, { openGates: true });
  const dist = bfs(open, cfg.start);
  if (!dist.has(cfg.boss)) { fail(`boss ${cfg.boss} unreachable from start`); continue; }
  const moves = dist.get(cfg.boss);
  if (moves !== cfg.expectedShortestMoves) fail(`shortest path = ${moves} moves, expected ${cfg.expectedShortestMoves}`);
  else pass(`shortest path start->boss = ${moves} moves`);

  const nPaths = countShortestPaths(open, cfg.start, cfg.boss);
  if (cfg.expectedUniqueShortest && nPaths !== 1) fail(`shortest path not unique (${nPaths} found)`);
  else pass(`shortest path unique (${nPaths})`);

  // gates closed -> boss must be unreachable (gates actually gate)
  const gated = buildEdges(rooms, { openGates: false });
  if (bfs(gated, cfg.start).has(cfg.boss)) fail('boss reachable with gates closed');
  else pass('gate actually gates (boss unreachable while closed)');

  // secret edges are mandatory cuts
  for (const [a, b] of cfg.secretEdges) {
    const cut = buildEdges(rooms, { openGates: true });
    cut.get(a)?.delete(b);
    cut.get(b)?.delete(a);
    if (bfs(cut, cfg.start).has(cfg.boss)) fail(`secret edge ${a}<->${b} is not a mandatory cut`);
    else pass(`secret edge ${a}<->${b} is a mandatory cut`);
  }

  // no absorbing dead ends: every room reaches the boss (traps are
  // escapable per T's Q6 answer — Act III checkpoints handled at
  // implementation, but graph-level escapability holds everywhere)
  const stuck = rooms.filter((r) => r.display !== cfg.boss && !bfs(open, r.display).has(cfg.boss));
  if (stuck.length) fail(`rooms cannot reach boss: ${stuck.map((r) => r.display).join(', ')}`);
  else pass('every room can reach the boss (traps escapable)');

  // every honest fragment lies on or beside the true path component
  // (reachable without using a one-way drop into the Loop): checked
  // as reachable from start without leaving Path-realm rooms.
  const pathRooms = new Set(rooms.filter((r) => r.realm === 'Path').map((r) => r.display));
  const pathOnly = new Map([...open].map(([k, v]) => [k, new Set([...v].filter((d) => pathRooms.has(d)))]));
  const pathDist = bfs(pathOnly, cfg.start);
  const missing = rooms.filter((r) => /carved/.test(r.fragment) && !pathDist.has(r.display));
  if (missing.length) fail(`honest fragments off the Path realm walk: ${missing.map((r) => r.display).join(', ')}`);
  else pass('all honest fragments reachable via Path realm alone');
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks green');
process.exit(failures ? 1 : 0);
