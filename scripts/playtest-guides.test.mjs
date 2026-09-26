// scripts/playtest-guides.test.mjs — guard for axiomancer-mobile/docs/playtest-guides/.
//
// Part of the root `npm test` suite. The field guides tell a playtester agent
// which `testID`s to press and which state fixtures to boot; this test keeps
// them from rotting:
//
//   1. every id in a guide's "Test IDs" table exists as a testID literal
//      somewhere under axiomancer-mobile/app or axiomancer-mobile/components
//      (`testID="x"`, `testID={'x'}`, `testID={`x-${…}`}`, `testID: 'x'`,
//      `.withTestId('x')`). An id with a `<placeholder>` matches a template
//      literal by its static prefix; a fully static id matches either an
//      exact literal or a template whose static prefix it extends.
//   2. every fixture id a guide names (`?fixture=<id>` or a backticked token
//      shaped like a registry id) is in
//      axiomancer-mechanics/src/Game/fixtures/state-fixture.registry.ts.
//   3. every guide has the seven fixed sections in order, and the README
//      links each guide.
//
//   node --test scripts/playtest-guides.test.mjs

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MOBILE = path.join(ROOT, 'axiomancer-mobile')
const GUIDES_DIR = path.join(MOBILE, 'docs', 'playtest-guides')
const REGISTRY = path.join(ROOT, 'axiomancer-mechanics', 'src', 'Game', 'fixtures', 'state-fixture.registry.ts')
const GUIDES = ['combat.md', 'hazard.md', 'minigames.md', 'narrative.md', 'map.md']
const SECTIONS = [
  /What (this screen|these screens) (is|are) for/,
  /Enter it directly/,
  /Test IDs/,
  /A correct play, step by step/,
  /Looks stuck but isn't/,
  /Actually stuck/,
  /Read the log/,
]

/** Recursively list source files under `dir`, skipping tests and node_modules. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue
      walk(full, out)
    } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

/**
 * Collect every testID string the app declares.
 * Returns { exact: Set<string>, prefixes: Set<string> } where `prefixes` are
 * the static heads of template-literal ids (`combat-die-` for
 * `combat-die-${die.id}`).
 */
export function collectDeclaredTestIds(dirs) {
  const exact = new Set()
  const prefixes = new Set()
  const idLine = /testID|withTestId/
  const literal = /(['"])([A-Za-z0-9_.:-]+)\1/g
  const template = /`([A-Za-z0-9_.:-]*)\$\{/g
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const src = fs.readFileSync(file, 'utf8')
      for (const line of src.split('\n')) {
        if (!idLine.test(line)) continue
        for (const m of line.matchAll(literal)) exact.add(m[2])
        for (const m of line.matchAll(template)) if (m[1].length > 0) prefixes.add(m[1])
        // A template with no `${` on the same line as a testID is exact too.
        for (const m of line.matchAll(/`([A-Za-z0-9_.:-]+)`/g)) exact.add(m[1])
      }
    }
  }
  return { exact, prefixes }
}

/** True when `id` from a guide table is backed by a declared testID. */
export function isDeclared(id, declared) {
  const placeholder = id.indexOf('<')
  if (placeholder >= 0) {
    const head = id.slice(0, placeholder)
    if (head.length === 0) return false
    for (const p of declared.prefixes) if (p === head || head.startsWith(p) || p.startsWith(head)) return true
    return false
  }
  if (declared.exact.has(id)) return true
  for (const p of declared.prefixes) if (id.startsWith(p)) return true
  return false
}

/** Parse the first column of the "Test IDs" table into a list of ids. */
export function parseGuideTestIds(markdown) {
  const start = markdown.indexOf('## 3. Test IDs')
  const end = markdown.indexOf('## 4.', start)
  assert.ok(start >= 0 && end > start, 'guide has a "## 3. Test IDs" section followed by "## 4."')
  const ids = []
  for (const line of markdown.slice(start, end).split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').map((c) => c.trim())
    const first = cells[1] ?? ''
    if (first === 'testID' || /^-+$/.test(first)) continue
    for (const m of first.matchAll(/`([^`]+)`/g)) ids.push(m[1])
  }
  return ids
}

/** Fixture ids a guide names: `?fixture=<id>` plus registry-shaped tokens. */
export function parseGuideFixtureIds(markdown) {
  const ids = new Set()
  for (const m of markdown.matchAll(/fixture=([a-z0-9-]+)/g)) ids.add(m[1])
  const shaped = /^(fresh-start|(apprentice|wanderer|sage|kid-l\d+|l\d+|broke-l\d+)-[a-z0-9-]+)$/
  for (const m of markdown.matchAll(/`([a-z0-9-]+)`/g)) if (shaped.test(m[1])) ids.add(m[1])
  return [...ids]
}

/** Registry ids, read straight from the TypeScript source. */
export function readRegistryIds() {
  const src = fs.readFileSync(REGISTRY, 'utf8')
  return new Set([...src.matchAll(/^\s*id:\s*'([a-z0-9-]+)'/gm)].map((m) => m[1]))
}

const declared = collectDeclaredTestIds([path.join(MOBILE, 'app'), path.join(MOBILE, 'components')])
const registry = readRegistryIds()

test('the guide set is complete and the README indexes it', () => {
  const readme = fs.readFileSync(path.join(GUIDES_DIR, 'README.md'), 'utf8')
  for (const g of GUIDES) {
    assert.ok(fs.existsSync(path.join(GUIDES_DIR, g)), `${g} exists`)
    assert.ok(readme.includes(`(./${g})`), `README links ${g}`)
  }
  assert.ok(/read the guide for a screen before acting on it/i.test(readme), 'README states the read-first rule')
})

for (const g of GUIDES) {
  const md = fs.readFileSync(path.join(GUIDES_DIR, g), 'utf8')

  test(`${g}: sections appear in the fixed order`, () => {
    let cursor = 0
    SECTIONS.forEach((title, i) => {
      const heading = new RegExp(`^## ${i + 1}\\. ${title.source}`, 'm')
      const m = heading.exec(md.slice(cursor))
      assert.ok(m, `${g} has section "## ${i + 1}. ${title.source}" after the previous one`)
      cursor += m.index + 1
    })
  })

  test(`${g}: every Test IDs table entry is a real testID`, () => {
    const ids = parseGuideTestIds(md)
    assert.ok(ids.length > 0, `${g} lists at least one testID`)
    const missing = ids.filter((id) => !isDeclared(id, declared))
    assert.deepEqual(missing, [], `${g} names testIDs not found under app/ or components/`)
  })

  test(`${g}: every fixture id is in the registry`, () => {
    const missing = parseGuideFixtureIds(md).filter((id) => !registry.has(id))
    assert.deepEqual(missing, [], `${g} names fixtures missing from state-fixture.registry.ts`)
  })
}

test('the id matcher rejects ids nobody declares', () => {
  const fake = { exact: new Set(['a-b']), prefixes: new Set(['combat-die-']) }
  assert.equal(isDeclared('a-b', fake), true)
  assert.equal(isDeclared('combat-die-<id>', fake), true)
  assert.equal(isDeclared('combat-die-7', fake), true)
  assert.equal(isDeclared('combat-coach-dismiss', fake), false)
  assert.equal(isDeclared('<x>', fake), false)
})
