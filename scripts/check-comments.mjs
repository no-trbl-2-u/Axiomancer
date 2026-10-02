#!/usr/bin/env node
// scripts/check-comments.mjs — code comments describe the code, not its history.
//
//   node scripts/check-comments.mjs            # scan the guarded packages
//   node scripts/check-comments.mjs <files...> # scan just those .ts/.tsx files
//
// Reads every comment in the guarded .ts/.tsx trees (the TypeScript parser
// finds them, so a `//` inside a string or template is not a comment) and
// fails on two kinds of line:
//
//   history  — phase, spec and decision numbers and the old overhaul names.
//              Git blame is the history; a comment states what the code does.
//   retired  — any identifier row of axiomancer-mechanics/docs/lexicon.json,
//              the same registry check-lexicon applies to the docs.
//
// A comment line that must name a deleted thing to explain the code around it
// (a save migration dropping a removed keyword, a test pinning that it stays
// gone) carries `lexicon-ok` on that line, with the reason.
//
// Exit codes: 0 clean; 1 findings (file:line: id -> text).

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { loadRegistry } from './check-lexicon.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(ROOT, 'axiomancer-mechanics', 'package.json'))
const ts = require('typescript')

// The trees whose comments are guarded. Mobile joins when its comments are
// clean.
export const GUARDED_DIRS = ['axiomancer-mechanics/src', 'axiomancer-mechanics/scripts']

export const HISTORY_ROWS = [
  { id: 'phase-number', re: /\b[Pp]hases? (?:R?\d|[A-Z]\d)/ },
  { id: 'spec-number', re: /\b[Ss]pecs? #?\d|\bspecs\/\d/ },
  { id: 'decision-number', re: /\bD\d{2,3}\b/ },
  { id: 'big-numbers', re: /\bBIG NUMBERS\b|\b[Bb]ig-numbers\b/ },
  { id: 'dice-law', re: /\b[Dd]ice-law\b/ },
]

/** Every comment in `text`, as `{ text, line }` (1-based start line). */
export function commentsIn(text, fileName = 'file.ts') {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false, kind)
  const seen = new Set()
  const out = []
  const collect = (ranges) => {
    for (const r of ranges ?? []) {
      if (seen.has(r.pos)) continue
      seen.add(r.pos)
      out.push({ text: text.slice(r.pos, r.end), line: sf.getLineAndCharacterOfPosition(r.pos).line + 1 })
    }
  }
  const visit = (node) => {
    collect(ts.getLeadingCommentRanges(text, node.pos))
    collect(ts.getTrailingCommentRanges(text, node.end))
    if (node.kind === ts.SyntaxKind.JsxText) return
    for (const child of node.getChildren(sf)) visit(child)
  }
  visit(sf)
  return out.sort((a, b) => a.line - b.line)
}

/** Findings for one file's text, as `{ id, line, text }`. */
export function scanComments(text, rows, fileName) {
  const findings = []
  for (const c of commentsIn(text, fileName)) {
    c.text.split(/\r?\n/).forEach((line, i) => {
      if (line.includes('lexicon-ok')) return
      for (const row of rows) {
        row.re.lastIndex = 0
        if (row.re.test(line)) findings.push({ id: row.id, line: c.line + i, text: line.trim() })
      }
    })
  }
  return findings
}

export function guardRows() {
  const retired = loadRegistry()
    .filter((r) => r.type === 'identifier')
    .map((r) => ({ id: r.id, re: new RegExp(r.pattern) }))
  return [...HISTORY_ROWS, ...retired]
}

function* tsFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* tsFiles(p)
    else if (/\.tsx?$/.test(entry.name)) yield p
  }
}

function main() {
  const rows = guardRows()
  const fileArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const targets = fileArgs.length
    ? fileArgs.map((a) => path.resolve(ROOT, a)).filter((p) => /\.tsx?$/.test(p) && fs.existsSync(p))
    : GUARDED_DIRS.flatMap((d) => [...tsFiles(path.join(ROOT, d))])

  const findings = []
  for (const abs of targets) {
    const rel = path.relative(ROOT, abs).replaceAll('\\', '/')
    for (const f of scanComments(fs.readFileSync(abs, 'utf-8'), rows, abs)) {
      findings.push(`${rel}:${f.line}: ${f.id} -> ${f.text}`)
    }
  }

  if (findings.length) {
    console.error(`check-comments: ${findings.length} comment line(s) narrate history or name a retired term:`)
    findings.forEach((f) => console.error(`  ${f}`))
    console.error(`\nState what the code does and drop the story (git blame keeps it). A line`)
    console.error(`that must name a deleted thing carries 'lexicon-ok' with the reason.`)
    process.exit(1)
  }
  console.log(`check-comments: ${targets.length} file(s) clean`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
