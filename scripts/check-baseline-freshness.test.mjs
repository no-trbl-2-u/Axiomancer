// scripts/check-baseline-freshness.test.mjs — witness for the AUDIT.md
// loop-call "the deck-matrix baseline reads STALE because of a speech-mark
// edit" (2026-09-12, decided via /oversight 2026-09-15): a commit that only
// touches World/Continents content or test files must not trip the
// deck-matrix freshness alarm, because neither feeds
// scripts/regen-deck-matrix-baseline.mjs's combat-playtest sweep.
//
//   node --test scripts/check-baseline-freshness.test.mjs

import assert from 'node:assert/strict'
import test from 'node:test'

import { isFreshnessRelevantPath, WATCH_ROOT } from './check-baseline-freshness.mjs'

test('engine source under Combat/Cards/Enemy/Character is relevant', () => {
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Combat/combat.engine.ts`), true)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Cards/cards.library.ts`), true)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Enemy/enemy.library.ts`), true)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Character/index.ts`), true)
})

test('World/Continents content is not relevant — disjoint from combat-playtest inputs', () => {
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/Continents/Coastal-Village/maps.ts`), false)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/Continents/Coastal-Village/npcs.ts`), false)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/Continents/Northern-Forest/npcs.ts`), false)
})

test('other World surfaces (Hazard, MapEvents, ...) stay watched', () => {
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/Hazard/hazards.ts`), true)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/MapEvents/content.ts`), true)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/World/map.library.ts`), true)
})

test('test files and any e2e directory are not relevant, in or out of Continents', () => {
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Combat/e2e/themed-decks.engine.test.ts`), false)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Cards/synergy-predicates.test.ts`), false)
  assert.equal(isFreshnessRelevantPath(`${WATCH_ROOT}/Game/e2e/old-marrow-observer.engine.test.ts`), false)
})

test('paths outside WATCH_ROOT are never relevant', () => {
  assert.equal(isFreshnessRelevantPath('axiomancer-mobile/components/combat/CombatBoard.tsx'), false)
  assert.equal(isFreshnessRelevantPath('scripts/check-baseline-freshness.mjs'), false)
})

test('the motivating case: FE-006 (speech-mark content edit + a matching test-string update) is fully excluded', () => {
  const changedFiles = [
    `${WATCH_ROOT}/Game/e2e/old-marrow-observer.engine.test.ts`,
    `${WATCH_ROOT}/World/Continents/Coastal-Village/maps.ts`,
    `${WATCH_ROOT}/World/Continents/Coastal-Village/npcs.ts`,
    `${WATCH_ROOT}/World/Continents/Northern-Continent/maps.ts`,
    `${WATCH_ROOT}/World/Continents/Northern-Forest/npcs.ts`,
  ]
  assert.equal(changedFiles.some(isFreshnessRelevantPath), false)
})
