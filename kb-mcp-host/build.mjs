#!/usr/bin/env node
// kb-mcp-host/build.mjs — snapshot the KB corpus into corpus/ for bundling.
//
// Source, in priority order:
//   1. KB_LOCAL_SRC   — path containing KnowledgeBase/ (offline / test builds)
//   2. ../kb          — Axiomancer's synced clone, when present
//   3. shallow clone of KB_REPO (default no-trbl-2-u/game-knowledge-base) —
//      the repo is PRIVATE, so on Vercel this needs a GH_TOKEN (or
//      KB_GH_TOKEN) project env var with read access to it.
//
// Only text files ship (.md/.json/.csv — ~14MB): the tools never serve
// images, and the smaller bundle keeps the function under Vercel's limits.
// The snapshot's commit + build time land in corpus/.build-meta.json, which
// kb_overview reports so answers can name their corpus freshness.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'corpus')
const KB_REPO = process.env.KB_REPO ?? 'no-trbl-2-u/game-knowledge-base'
const TEXT_EXT = new Set(['.md', '.json', '.csv'])

function gitHead(dir) {
  try { return execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' }).trim() }
  catch { return null }
}

function resolveSource() {
  const local = process.env.KB_LOCAL_SRC
  if (local) {
    if (!fs.existsSync(path.join(local, 'KnowledgeBase'))) {
      throw new Error(`KB_LOCAL_SRC=${local} has no KnowledgeBase/`)
    }
    return { dir: local, label: `KB_LOCAL_SRC ${local}` }
  }
  const sibling = path.resolve(HERE, '..', 'kb')
  if (fs.existsSync(path.join(sibling, 'KnowledgeBase'))) {
    return { dir: sibling, label: 'synced ../kb' }
  }
  const token = process.env.GH_TOKEN ?? process.env.KB_GH_TOKEN ?? ''
  const tmp = fs.mkdtempSync(path.join(HERE, '.kb-src-'))
  const authFlags = token
    ? ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`]
    : []
  try {
    execFileSync('git', [...authFlags, 'clone', '--depth', '1', `https://github.com/${KB_REPO}`, tmp],
      { stdio: ['ignore', 'inherit', 'inherit'] })
  }
  catch (err) {
    fs.rmSync(tmp, { recursive: true, force: true })
    throw new Error(
      `clone of ${KB_REPO} failed${token ? '' : ' (no GH_TOKEN/KB_GH_TOKEN set — the repo is private)'}: ${err.message}`,
    )
  }
  return { dir: tmp, label: `clone of ${KB_REPO}`, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) }
}

function copyText(srcDir, outDir) {
  let files = 0
  let bytes = 0
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(srcDir, rel), { withFileTypes: true })) {
      const relPath = path.join(rel, entry.name)
      if (entry.isDirectory()) walk(relPath)
      else if (TEXT_EXT.has(path.extname(entry.name))) {
        const dest = path.join(outDir, relPath)
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(path.join(srcDir, relPath), dest)
        files += 1
        bytes += fs.statSync(dest).size
      }
    }
  }
  walk('KnowledgeBase')
  return { files, bytes }
}

const source = resolveSource()
try {
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })
  const { files, bytes } = copyText(source.dir, OUT)
  if (!files) throw new Error(`no corpus text files found under ${source.dir}/KnowledgeBase`)
  const meta = {
    head: gitHead(source.dir),
    builtAt: new Date().toISOString(),
    source: source.label,
    files,
  }
  fs.writeFileSync(path.join(OUT, '.build-meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`kb-mcp-host build: ${files} file(s), ${(bytes / 1024 / 1024).toFixed(1)}MB from ${source.label} (head ${meta.head ?? '?'})`)
}
finally {
  source.cleanup?.()
}
