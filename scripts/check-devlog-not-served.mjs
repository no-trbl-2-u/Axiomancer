#!/usr/bin/env node
// scripts/check-devlog-not-served.mjs — guards against the DevLog's generated
// HTML/data/art re-entering `git ls-files`, which is what Cloudflare Pages
// serves from `main`'s tree. Phase 57 (plan/phases/phase_57_devlog_pages_scopedown.md)
// untracked these paths because the built site's own header reads "A private
// index of the game's content and the nightly development log" — the source
// inputs (entries/*.md, dated screenshots, hand-authored tuning-lab reports)
// stay tracked; only the regenerable output is gitignored.
//
//   node scripts/check-devlog-not-served.mjs             # scan the real tree
//   node scripts/check-devlog-not-served.mjs <paths...>   # scan an explicit list
//
// Exit codes: 0 clean; 1 findings (path: reason).

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** True if `rel` (repo-relative, forward-slash) is a generated DevLog output —
 *  derived from other tracked sources and rebuilt on demand by
 *  `npm run site:build`, never a member that should be committed. */
export function isGeneratedDevlogPath(rel) {
  if (rel === 'devlog/index.html' || rel === 'devlog/log.html' || rel === 'devlog/catalog.html') return true
  if (rel === 'devlog/tuning-lab/index.html') return true
  if (/^devlog\/entries\/.*\.html$/.test(rel)) return true
  if (rel.startsWith('devlog/data/')) return true
  if (rel.startsWith('devlog/assets/catalog/')) return true
  return false
}

/** Filter a list of repo-relative paths down to the generated-and-tracked ones. */
export function findServedGeneratedFiles(paths) {
  return paths.filter(isGeneratedDevlogPath)
}

// ── CLI ──
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const paths = args.length
    ? args
    : execFileSync('git', ['ls-files', 'devlog/'], { cwd: ROOT, encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean)

  const offenders = findServedGeneratedFiles(paths)
  if (offenders.length) {
    console.error(`check-devlog-not-served: ${offenders.length} generated DevLog path(s) are tracked (Pages would serve them):`)
    offenders.forEach((p) => console.error(`  ${p}: generated output — untrack it (see .gitignore, phase 57 brief)`))
    console.error('\nRun `npm run site:build` locally to regenerate; do not commit the output.')
    process.exit(1)
  }
  console.log(`check-devlog-not-served: ${paths.length} tracked devlog/ path(s) clean.`)
}
