#!/usr/bin/env node
// scripts/eval/seeded-replay.mjs
//
// Planted defects (phase EV1c, brief A6). Each real bug of 2026-10-14 is
// planted again by reverting its fix's source in a detached worktree that
// is never pushed, and each mechanical gate meets it: the CI path filters,
// the related tests as they stood at the fix's parent, and the related
// tests at the fix with its source reverted. A file failing in either leg
// reruns at the unplanted fix; one that fails there too is noise. Writes
// `docs/reports/eval/seeded.json` and the seeded section of
// `docs/reports/eval/latest.md`. The pure parts live in `seeded-lib.mjs`.
//
//   node scripts/eval/seeded-replay.mjs [--dry-run]

import { spawnSync, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { classifyPaths, parseWorkflowFilter } from './ledger-lib.mjs'
import { spliceMarked } from './mutation-lib.mjs'
import { parseJsonReport, parseTap, runnerFor } from './parent-replay-lib.mjs'
import { SECTION_END, SECTION_START, SEEDS, ciVerdict, plantedPaths, relatedTests, renderSeededSection, testVerdict } from './seeded-lib.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT_DIR = join(ROOT, 'docs/reports/eval')
const RUN_TIMEOUT_MS = 10 * 60 * 1000
const NODE_MODULES = ['node_modules', 'axiomancer-mechanics/node_modules', 'axiomancer-mobile/node_modules']

const git = (args, cwd = ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()

function verifyWorkflows() {
  const dir = join(ROOT, '.github/workflows')
  return readdirSync(dir)
    .filter((f) => /^verify-.*\.ya?ml$/.test(f))
    .sort()
    .map((file) => ({ file, ...parseWorkflowFilter(readFileSync(join(dir, file), 'utf8')) }))
    .filter((wf) => wf.paths !== null)
}

function linkModules(dir) {
  for (const rel of NODE_MODULES) {
    const target = join(ROOT, rel)
    const link = join(dir, rel)
    if (existsSync(target) && existsSync(dirname(link)) && !existsSync(link)) symlinkSync(target, link, 'junction')
  }
}

function checkout(dir, sha) {
  git(['checkout', '--force', '--detach', '--quiet', sha], dir)
  git(['clean', '-fdq', '-e', 'node_modules'], dir)
  linkModules(dir)
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: RUN_TIMEOUT_MS, maxBuffer: 256 * 1024 * 1024, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } })
  return { code: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '', timedOut: r.error?.code === 'ETIMEDOUT' }
}

/** Runs test files in `dir`, one call per runner; results keyed by path. */
function runTests(dir, paths) {
  const results = {}
  const groups = {}
  for (const p of paths) {
    const r = runnerFor(p)
    if (r) (groups[r.runner] ??= { cwd: r.cwd, files: [] }).files.push(p)
  }
  for (const [runner, { cwd, files }] of Object.entries(groups)) {
    if (runner === 'node') {
      for (const f of files) {
        const r = run(process.execPath, ['--test', '--test-reporter=tap', f], dir)
        const { ok, message } = parseTap(r.stdout, r.timedOut ? 1 : r.code)
        results[f] = { ok, message }
      }
      continue
    }
    const outFile = join(dir, `.eval-${runner}.json`)
    rmSync(outFile, { force: true })
    const rel = files.map((f) => f.slice(cwd.length + 1))
    const args = runner === 'jest'
      ? ['--no-install', 'jest', '--ci', '--json', `--outputFile=${outFile}`, '--runTestsByPath', ...rel]
      : ['--no-install', 'vitest', 'run', '--reporter=json', `--outputFile=${outFile}`, ...rel]
    const r = run('npx', args, join(dir, cwd))
    const parsed = parseJsonReport(existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : null, dir)
    for (const f of files) {
      const p = parsed[f]
      results[f] = p ? { ok: p.ok, message: p.message } : { ok: false, message: r.timedOut ? 'timed out' : `no result (exit ${r.code})` }
    }
    rmSync(outFile, { force: true })
  }
  return results
}

function replaySeed(dir, seed, workflows) {
  const fix = git(['rev-parse', `${seed.fix}^{commit}`])
  const parent = git(['rev-parse', `${fix}^`])
  const changed = git(['diff', '--name-only', parent, fix]).split('\n').filter(Boolean)
  const planted = plantedPaths(changed)
  const fixTests = changed.filter((f) => runnerFor(f))
  const { triggered } = classifyPaths(planted, workflows)

  checkout(dir, parent)
  const beforeTests = relatedTests(planted, git(['ls-files'], dir).split('\n'), fixTests)
  const beforeRuns = runTests(dir, beforeTests)

  checkout(dir, fix)
  git(['checkout', parent, '--', ...planted], dir)
  const afterTests = relatedTests(planted, git(['ls-files'], dir).split('\n'), fixTests)
  const afterRuns = runTests(dir, afterTests)

  // The control: every file that failed in either leg runs at the fix itself.
  checkout(dir, fix)
  const suspects = [...new Set([...beforeTests, ...afterTests].filter((f) => (beforeRuns[f] && !beforeRuns[f].ok) || (afterRuns[f] && !afterRuns[f].ok)))]
  const control = suspects.length ? runTests(dir, suspects) : {}
  const noisy = suspects.filter((f) => control[f] && !control[f].ok)

  const before = { tests: beforeTests, ...testVerdict(beforeRuns, noisy) }
  const after = { tests: afterTests, ...testVerdict(afterRuns, noisy) }
  return { ...seed, fix: fix.slice(0, 8), planted, triggered, gates: { ci: ciVerdict(triggered, before), before, after } }
}

function main() {
  const head = git(['rev-parse', 'HEAD'])
  const stamp = { commit: head.slice(0, 8), date: git(['show', '-s', '--format=%cI', head]) }
  const workflows = verifyWorkflows()
  const dir = mkdtempSync(join(tmpdir(), 'eval-seeded-'))
  rmSync(dir, { recursive: true, force: true })
  git(['worktree', 'add', '--detach', '--quiet', dir, 'HEAD'])
  const seeds = []
  try {
    for (const seed of SEEDS) {
      const t0 = Date.now()
      const s = replaySeed(dir, seed, workflows)
      seeds.push(s)
      console.log(`${s.id} #${s.pr}: ci ${s.gates.ci.verdict}, before ${s.gates.before.verdict}, after ${s.gates.after.verdict} (${Math.round((Date.now() - t0) / 1000)}s)`)
    }
  } finally {
    git(['worktree', 'remove', '--force', dir])
  }
  const replay = { stamp, seeds }
  const section = renderSeededSection(replay)
  if (process.argv.includes('--dry-run')) {
    process.stdout.write(`${section}\n`)
    return
  }
  writeFileSync(join(OUT_DIR, 'seeded.json'), `${JSON.stringify(replay, null, 2)}\n`)
  const latest = join(OUT_DIR, 'latest.md')
  writeFileSync(latest, spliceMarked(readFileSync(latest, 'utf8'), section, SECTION_START, SECTION_END))
  console.log('seeded replay -> docs/reports/eval/latest.md')
}

main()
