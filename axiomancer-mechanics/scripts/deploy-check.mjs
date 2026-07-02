#!/usr/bin/env node
/**
 * deploy-check.mjs — deploy gate for axiomancer-mechanics (npm library).
 *
 * "Deploy" for a library = the package is correctly packable (publishable
 * without errors). Runs `npm pack --dry-run`. Requires dist/ to exist
 * (run `npm run build` first via the verify gate).
 *
 * Exit codes:
 *   0 — package is publishable (green)
 *   1 — package is NOT publishable (red — check output)
 *   3 — config error (e.g. package.json malformed)
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { snapshotPublicSurface } from './snapshot-public-surface.mjs'

const DIST = 'dist'
const SRC = 'src'
const CHANGELOG = 'CHANGELOG.md'
const SURFACE_FIXTURE = 'scripts/public-surface.expected.json'

if (!existsSync(DIST)) {
  console.error('[deploy:check] dist/ not found. Run `npm run build` first.')
  console.error('[deploy:check] The verify gate (npm run verify) creates dist/.')
  process.exit(1)
}

// Phase 50 guard — every src/<Module>/types.ts must emit a matching
// dist/<Module>/types.d.ts. Catches the regression that filed GH#64
// (mobile handoff Issue 2) cheaply, without enumerating every public name.
function countModuleTypesFiles(root, declarationOnly, filterSet) {
  let count = 0
  const moduleDirs = readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
  for (const mod of moduleDirs) {
    if (filterSet && !filterSet.has(mod)) continue
    const file = declarationOnly
      ? join(root, mod, 'types.d.ts')
      : join(root, mod, 'types.ts')
    if (existsSync(file) && statSync(file).isFile()) {
      count += 1
    }
  }
  return count
}

const distModuleDirs = new Set(
  readdirSync(DIST, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
)
const srcTypesCount = countModuleTypesFiles(SRC, false, distModuleDirs)
const distTypesCount = countModuleTypesFiles(DIST, true)

if (distTypesCount < srcTypesCount) {
  console.error(
    `[deploy:check] dist/<Module>/types.d.ts emission shortfall: ` +
    `expected ${srcTypesCount} (one per barrel-reachable src/<Module>/types.ts), got ${distTypesCount}.`
  )
  console.error(
    '[deploy:check] A module-level types.ts was likely re-introduced as types.d.ts ' +
    '(tsc does not emit pre-existing .d.ts files). See plan/phases/phase_50_engine_handoff.md.'
  )
  process.exit(1)
}

// Phase 52 guard — the latest git tag must match the top tagged-version
// heading in CHANGELOG.md. `(unreleased)` headings are allowed and treated
// as "the next bump in flight" — they are skipped when scanning for the
// canonical version match. Catches the case where a tag is cut without a
// CHANGELOG bump (or vice versa).
function readLatestGitTag() {
  try {
    return execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function readTopChangelogVersion() {
  if (!existsSync(CHANGELOG)) return { version: '', headingRaw: '' }
  const text = readFileSync(CHANGELOG, 'utf8')
  for (const line of text.split('\n')) {
    const match = line.match(/^##\s+\[([^\]]+)\]\s+—\s+(.+)$/)
    if (!match) continue
    const [, version, suffix] = match
    if (/unreleased/i.test(suffix)) continue
    return { version: version.trim(), headingRaw: line.trim() }
  }
  return { version: '', headingRaw: '' }
}

const latestTag = readLatestGitTag()
const { version: topChangelogVersion, headingRaw: topChangelogHeading } = readTopChangelogVersion()

// Phase 52 guard runs on direct pushes to main and local invocations.
// PRs are pre-release — no tag has been cut yet for the in-flight work,
// and the nearest reachable ancestor tag may legitimately lag the CHANGELOG
// heading. Skipping avoids false failures when a remote tag points to a
// rebased-away commit.
const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request'

if (!isPullRequest && latestTag && topChangelogVersion) {
  // Normalise the tag — `v0.10.0` → `0.10.0`.
  const normalisedTag = latestTag.replace(/^v/, '')
  if (normalisedTag !== topChangelogVersion) {
    console.error(
      `[deploy:check] git tag / CHANGELOG.md disagreement: ` +
      `latest tag is "${latestTag}" (normalised "${normalisedTag}"), ` +
      `but the top tagged CHANGELOG heading is "${topChangelogHeading}".`
    )
    console.error(
      '[deploy:check] Either bump the CHANGELOG (flip the `(unreleased)` heading to the tag\'s ISO date) ' +
      'or cut a new tag matching the CHANGELOG. See RELEASING.md.'
    )
    process.exit(1)
  }
}

// Phase 53 guard — the public-surface snapshot of dist/index.d.ts must
// match the committed fixture at scripts/public-surface.expected.json.
// Catches add / remove / rename drift on the top-level barrel before
// `npm pack`. To accept an intentional change, run
// `node scripts/snapshot-public-surface.mjs --write` to refresh the
// fixture as part of the PR.
function diffNameLists(actual, expected) {
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)
  return {
    added: actual.filter(n => !expectedSet.has(n)),
    removed: expected.filter(n => !actualSet.has(n)),
  }
}

if (existsSync(SURFACE_FIXTURE)) {
  try {
    const expected = JSON.parse(readFileSync(SURFACE_FIXTURE, 'utf8'))
    const actual = snapshotPublicSurface()
    const valueDiff = diffNameLists(actual.values, expected.values ?? [])
    const typeDiff = diffNameLists(actual.types, expected.types ?? [])

    if (valueDiff.added.length || valueDiff.removed.length || typeDiff.added.length || typeDiff.removed.length) {
      console.error('[deploy:check] public-surface drift detected:')
      if (valueDiff.added.length) {
        console.error(`  values added (${valueDiff.added.length}):`)
        for (const n of valueDiff.added) console.error(`    + ${n}`)
      }
      if (valueDiff.removed.length) {
        console.error(`  values removed (${valueDiff.removed.length}):`)
        for (const n of valueDiff.removed) console.error(`    - ${n}`)
      }
      if (typeDiff.added.length) {
        console.error(`  types added (${typeDiff.added.length}):`)
        for (const n of typeDiff.added) console.error(`    + ${n}`)
      }
      if (typeDiff.removed.length) {
        console.error(`  types removed (${typeDiff.removed.length}):`)
        for (const n of typeDiff.removed) console.error(`    - ${n}`)
      }
      console.error(
        '[deploy:check] If this is intentional, run ' +
        '`node scripts/snapshot-public-surface.mjs --write` to refresh ' +
        'the fixture and commit it alongside your PR.'
      )
      process.exit(1)
    }
  } catch (err) {
    if (err.message?.includes('not found')) {
      // dist/index.d.ts missing — caught by the dist guard above; skip silently.
    } else {
      console.error('[deploy:check] public-surface snapshot failed:', err.message)
      process.exit(1)
    }
  }
}

try {
  const out = execSync('npm pack --dry-run 2>&1', { encoding: 'utf8' })

  if (out.toLowerCase().includes('npm error') || out.toLowerCase().includes('npm warn pack')) {
    // npm warn pack is usually benign — only fail on actual errors
    const lines = out.split('\n')
    const errors = lines.filter(l => l.toLowerCase().includes('npm error'))
    if (errors.length > 0) {
      console.error('[deploy:check] npm pack --dry-run reported errors:')
      errors.forEach(e => console.error(' ', e))
      process.exit(1)
    }
  }

  // Show the packed file list (the useful part of dry-run output)
  const packedLines = out.split('\n').filter(l => l.trim().startsWith('-') || l.includes('npm notice'))
  if (packedLines.length > 0) {
    console.log('[deploy:check] Package contents (dry run):')
    packedLines.slice(0, 20).forEach(l => console.log(' ', l))
  }

  console.log('[deploy:check] Package is publishable — dry-run passed.')
  process.exit(0)
} catch (err) {
  console.error('[deploy:check] npm pack --dry-run failed:')
  console.error(err.stdout || err.message)
  process.exit(1)
}
