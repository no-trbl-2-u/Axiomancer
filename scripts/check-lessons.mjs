#!/usr/bin/env node
// scripts/check-lessons.mjs — lint for the counted lessons ladder (Phase R11).
// Zero dependencies.
//
//   node scripts/check-lessons.mjs                 # lint plan/lessons.md + plan/reflexes.md
//   node scripts/check-lessons.mjs <lessons> [<reflexes>]   # lint other paths (tests, hooks)
//
// The rules (the format lives in the plan/lessons.md header):
//   - every lesson bullet under a `<!-- @domain:x -->` anchor matches
//       - **<slug>** · <trap> → <rule> · seen <N>× · last <YYYY-MM-DD> · open
//     or ends `· guarded by <what>` in place of `open`;
//   - slugs are lowercase-kebab and unique across the file;
//   - each bullet is at most 500 bytes;
//   - at most 40 lessons are `open` (the budget forces graduation);
//   - plan/reflexes.md is at most 50 lines.
// Run by the root `npm test` (scripts/check-lessons.test.mjs) and by
// .claude/hooks/guard.mjs post-write whenever either file is written.
//
// Exit codes: 0 clean; 1 findings (one per line on stderr).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const MAX_BYTES = 500
export const MAX_OPEN = 40
export const MAX_REFLEX_LINES = 50

const LESSON = /^- \*\*([a-z0-9]+(?:-[a-z0-9]+)*)\*\* · (.+) → (.+) · seen (\d+)× · last (\d{4}-\d{2}-\d{2}) · (open|guarded by .+)$/

/**
 * Lint the text of a lessons file. Pure.
 * @param {string} text
 * @returns {{ findings: string[], open: number, lessons: number }}
 */
export function lintLessons(text) {
  const findings = []
  const slugs = new Map()
  let inDomain = false
  let open = 0
  let lessons = 0
  text.split('\n').forEach((line, i) => {
    const n = i + 1
    if (/^<!-- @domain:[a-z0-9-]+ -->$/.test(line)) {
      inDomain = true
      return
    }
    if (/^## Adding a domain/.test(line)) inDomain = false
    if (!inDomain || !line.startsWith('- ')) {
      if (inDomain && /^\d+\. /.test(line)) {
        findings.push(`line ${n}: numbered entry — lessons are '- **slug** · …' bullets`)
      }
      return
    }
    lessons += 1
    const bytes = Buffer.byteLength(line, 'utf8')
    if (bytes > MAX_BYTES) findings.push(`line ${n}: ${bytes} bytes (max ${MAX_BYTES})`)
    const m = LESSON.exec(line)
    if (!m) {
      findings.push(`line ${n}: does not match '- **slug** · trap → rule · seen N× · last YYYY-MM-DD · open|guarded by …'`)
      return
    }
    const [, slug, , , seen] = m
    if (Number(seen) < 1) findings.push(`line ${n}: seen must be at least 1×`)
    if (slugs.has(slug)) findings.push(`line ${n}: duplicate slug '${slug}' (first on line ${slugs.get(slug)})`)
    else slugs.set(slug, n)
    if (m[6] === 'open') open += 1
  })
  if (open > MAX_OPEN) findings.push(`${open} open lessons (max ${MAX_OPEN}): guard or merge one before adding another`)
  return { findings, open, lessons }
}

/**
 * Lint the reflexes file's size. Pure.
 * @param {string} text
 * @returns {string[]}
 */
export function lintReflexes(text) {
  const lines = text.replace(/\n$/, '').split('\n').length
  return lines > MAX_REFLEX_LINES ? [`reflexes.md: ${lines} lines (max ${MAX_REFLEX_LINES})`] : []
}

function main() {
  const [lessonsArg, reflexesArg] = process.argv.slice(2)
  const lessonsPath = path.resolve(lessonsArg || path.join(ROOT, 'plan', 'lessons.md'))
  const reflexesPath = path.resolve(reflexesArg || path.join(ROOT, 'plan', 'reflexes.md'))
  const out = []
  const { findings, open, lessons } = lintLessons(fs.readFileSync(lessonsPath, 'utf8'))
  out.push(...findings.map((f) => `${path.relative(ROOT, lessonsPath)}: ${f}`))
  if (fs.existsSync(reflexesPath)) out.push(...lintReflexes(fs.readFileSync(reflexesPath, 'utf8')))
  if (out.length) {
    process.stderr.write(`${out.join('\n')}\n`)
    process.exit(1)
  }
  process.stdout.write(`check-lessons: ${lessons} lesson(s), ${open} open, format clean\n`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main()
