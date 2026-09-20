// scripts/regen-deck-matrix-baseline.test.mjs — witness for the burn-day
// audit of 2026-09-19, row 3.6 ("the baseline stamp names a tree without
// SUMMON"). The regen script measures the WORKING TREE but stamps
// `git rev-parse --short HEAD`, so a run on a dirty tree attributes its
// numbers to a commit that does not contain the code that produced them.
// That is not hypothetical: `e333fbb` stamped `5a2158a`, a tree whose
// `combat.engine.ts` contains zero occurrences of SUMMON, onto numbers that
// reproduce exactly on the SUMMON engine.
//
// These tests pin the refusal and, just as importantly, its ORDER: the
// guard must fire before the multi-minute sweep, or nobody will keep it.
// They pin no balance value, no win rate and no threshold — retuning the
// game cannot move them; only a stamp that would be a false provenance
// claim can.
//
//   node --test scripts/regen-deck-matrix-baseline.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { dirtyMeasurementSources, main } from './regen-deck-matrix-baseline.mjs'
import { WATCH_ROOT } from './check-baseline-freshness.mjs'

/** Build the NUL-delimited `git status --porcelain=v1 -z` form from records
 *  already written in their wire shape (`'XY path'`, plus a bare original
 *  path field after a rename/copy). */
const porcelainZ = (...fields) => fields.map((field) => `${field}\0`).join('')

test('a clean mechanics tree reports nothing dirty', () => {
  assert.deepEqual(dirtyMeasurementSources(''), [])
  assert.deepEqual(dirtyMeasurementSources(undefined), [])
})

test('the motivating case: a modified combat engine is a dirty measurement source', () => {
  assert.deepEqual(
    dirtyMeasurementSources(porcelainZ(` M ${WATCH_ROOT}/Combat/combat.engine.ts`)),
    [`${WATCH_ROOT}/Combat/combat.engine.ts`],
  )
})

test('the other carriers of the Phase 102 measurement count too', () => {
  assert.deepEqual(
    dirtyMeasurementSources(porcelainZ(
      ` M ${WATCH_ROOT}/Enemy/enemy.library.ts`,
      `M  ${WATCH_ROOT}/Combat/combat.sim-policies.ts`,
    )),
    [`${WATCH_ROOT}/Combat/combat.sim-policies.ts`, `${WATCH_ROOT}/Enemy/enemy.library.ts`],
  )
})

test('an untracked engine file counts — the sweep reads the tree, not the index', () => {
  assert.deepEqual(
    dirtyMeasurementSources(porcelainZ(`?? ${WATCH_ROOT}/Combat/combat.adds.ts`)),
    [`${WATCH_ROOT}/Combat/combat.adds.ts`],
  )
})

test('a rename yields one path — the trailing original-path field is consumed', () => {
  assert.deepEqual(
    dirtyMeasurementSources(porcelainZ(
      `R  ${WATCH_ROOT}/Combat/combat.new.ts`,
      `${WATCH_ROOT}/Combat/combat.old.ts`,
    )),
    [`${WATCH_ROOT}/Combat/combat.new.ts`],
  )
})

test('the guard shares the alarm\'s definition of relevance: tests, Continents and mobile are not dirty measurement sources', () => {
  assert.deepEqual(
    dirtyMeasurementSources(porcelainZ(
      ` M ${WATCH_ROOT}/Combat/e2e/summon.engine.test.ts`,
      ` M ${WATCH_ROOT}/World/Continents/Northern-Forest/npcs.ts`,
      ` M axiomancer-mobile/state/presenters/combat-encounter.engine.ts`,
    )),
    [],
  )
})

/** Seams for `main`, with spies on the two irreversible acts. */
function harness(status) {
  const calls = { sweep: 0, write: 0, logs: [] }
  const seams = {
    options: {
      runs: 60,
      seed: 1,
      stage: 'all',
      policy: 'all',
      confidence: 'full',
      note: '',
      out: '/dev/null/never-written',
      cliArgs: '--stage=all --policy=all --deck=policy-pick --runs=60 --seed=1 --cards --json',
      command: 'npm run combat-playtest -- --stage=all',
    },
    gitStatus: () => status,
    readCommit: () => 'deadbee',
    runSweep: () => {
      calls.sweep += 1
      return '{"cells":[]}'
    },
    writeOut: (path, payload) => {
      calls.write += 1
      calls.path = path
      calls.payload = payload
    },
    log: (line) => calls.logs.push(line),
  }
  return { calls, seams }
}

test('a dirty engine source refuses BEFORE the sweep, and writes nothing', () => {
  const { calls, seams } = harness(porcelainZ(` M ${WATCH_ROOT}/Combat/combat.engine.ts`))

  assert.throws(() => main(seams), (error) => {
    assert.match(error.message, /REFUSING/)
    assert.match(error.message, /combat\.engine\.ts/)
    return true
  })

  // If the guard is ever moved below the execSync sweep, every other
  // assertion here still passes and only this one goes red.
  assert.equal(calls.sweep, 0, 'the guard must fire before the multi-minute sweep')
  assert.equal(calls.write, 0, 'a refused run must not rewrite the stamped baseline')
})

test('the refusal names every offending path', () => {
  const { seams } = harness(porcelainZ(
    ` M ${WATCH_ROOT}/Combat/combat.engine.ts`,
    `?? ${WATCH_ROOT}/Enemy/enemy.library.ts`,
  ))

  assert.throws(() => main(seams), (error) => {
    assert.match(error.message, /combat\.engine\.ts/)
    assert.match(error.message, /enemy\.library\.ts/)
    return true
  })
})

test('a clean tree measures once and stamps the commit it was handed', () => {
  const { calls, seams } = harness('')

  const baseline = main(seams)

  assert.equal(calls.sweep, 1)
  assert.equal(calls.write, 1)
  assert.equal(calls.payload.meta.commit, 'deadbee')
  assert.equal(baseline.meta.commit, 'deadbee')
  assert.deepEqual(baseline.report, { cells: [] })
})

test('dirt the alarm ignores does not block a regen — the nightly reduced pass still runs', () => {
  const { calls, seams } = harness(porcelainZ(
    ` M ${WATCH_ROOT}/Combat/e2e/summon.engine.test.ts`,
    ` M ${WATCH_ROOT}/World/Continents/Northern-Forest/npcs.ts`,
  ))

  main(seams)

  assert.equal(calls.sweep, 1)
  assert.equal(calls.write, 1)
})
