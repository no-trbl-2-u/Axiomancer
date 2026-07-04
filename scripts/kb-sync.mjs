#!/usr/bin/env node
// scripts/kb-sync.mjs — sync the SomberSoft game knowledge base into ./kb
// (gitignored), and append design-session requests to its WISHLIST.md.
//
//   node scripts/kb-sync.mjs                 # clone (shallow) or ff-pull kb/
//   node scripts/kb-sync.mjs wish "<entry>"  # sync, append to WISHLIST.md,
//                                            # commit + push (best-effort)
//
// The KB is the OKF corpus at github.com/no-trbl-2-u/game-knowledge-base
// (override with KB_REPO). Consumers: the brainstorm-mechanics skill and
// the mechanics-expert agent grep kb/ for prior art and cite doc paths +
// source IDs instead of citing from model memory.
//
// Auth: uses ambient git credentials when available (local dev). If
// GH_TOKEN is set (env or .env) it is passed per-command via an HTTP
// extraheader — never written into kb/.git/config — so CI runs work with
// the same GH_PAT the workflows already use.
//
// Exit codes: 0 ok; 2 sync failed; 0 on wish-push failure (wishlist is
// best-effort by design — a failed append must never sink a design
// session; the failure is printed so the session can note it).

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// --- load .env if present (matches deploy-check.mjs loader) ---
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const KB_REPO = process.env.KB_REPO ?? 'no-trbl-2-u/game-knowledge-base'
const KB_DIR = process.env.KB_DIR ?? 'kb'
const KB_URL = `https://github.com/${KB_REPO}`

const token = process.env.GH_TOKEN ?? ''
const authFlags = token
  ? ['-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`]
  : []

function git(args, opts = {}) {
  return execSync(['git', ...authFlags, ...args].map(a => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' '), {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  })
}

function sync() {
  if (fs.existsSync(path.join(KB_DIR, '.git'))) {
    git(['-C', KB_DIR, 'fetch', '--depth', '1', 'origin', 'main'])
    git(['-C', KB_DIR, 'reset', '--hard', 'origin/main'])
    console.log(`kb-sync: ${KB_DIR}/ updated to origin/main`)
  } else {
    git(['clone', '--depth', '1', KB_URL, KB_DIR])
    console.log(`kb-sync: cloned ${KB_REPO} into ${KB_DIR}/`)
  }
  const head = git(['-C', KB_DIR, 'rev-parse', '--short', 'HEAD']).trim()
  console.log(`kb-sync: at ${head}`)
}

function wish(entry) {
  const file = path.join(KB_DIR, 'WISHLIST.md')
  const date = git(['-C', KB_DIR, 'log', '-1', '--format=%cs']).trim() // repo-side date; avoids clock deps
  const line = `- [ ] ${entry}`
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : ''
  if (existing.includes(entry)) {
    console.log('kb-sync: wishlist already contains this entry; nothing to do')
    return
  }
  const header = existing.trim().length
    ? existing.replace(/\s*$/, '\n')
    : '# Wishlist — requested coverage\n\nAppended by design sessions (Axiomancer skills/agents). The daily scout\nconsumes top-down: check off with the run that covers it.\n\n'
  fs.writeFileSync(file, `${header}${line}\n`)
  try {
    git(['-C', KB_DIR, 'add', 'WISHLIST.md'])
    git(['-C', KB_DIR, '-c', 'user.name=axiomancer-kb-sync', '-c', 'user.email=kb-sync@axiomancer.invalid',
      'commit', '-m', `wishlist: ${entry.slice(0, 60)}`])
    git(['-C', KB_DIR, 'push', 'origin', 'HEAD:main'])
    console.log(`kb-sync: wishlist entry pushed (as of ${date}): ${entry}`)
  } catch (err) {
    console.error(`kb-sync: wishlist push failed (best-effort, continuing): ${err.message}`)
    console.error('kb-sync: entry is staged locally in kb/WISHLIST.md; it will conflict-resolve on next sync')
  }
}

const [cmd, ...rest] = process.argv.slice(2)
try {
  sync()
} catch (err) {
  console.error(`kb-sync: sync failed: ${err.message}`)
  process.exit(2)
}
if (cmd === 'wish') {
  const entry = rest.join(' ').trim()
  if (!entry) {
    console.error('kb-sync: usage: node scripts/kb-sync.mjs wish "<what coverage you wanted>"')
    process.exit(2)
  }
  wish(entry)
}
