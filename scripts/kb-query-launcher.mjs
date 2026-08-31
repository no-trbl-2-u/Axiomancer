#!/usr/bin/env node
// scripts/kb-query-launcher.mjs — the committed entrypoint for the kb-query
// MCP server. `.mcp.json` points here instead of at `kb/scripts/…` because
// `kb/` is a gitignored sync: on a fresh checkout (CI, remote sessions) that
// path does not exist and the MCP host fails the server at launch, which is
// how kb-query spent phase-72 deliberately ungranted in CI.
//
// This launcher ALWAYS starts, then picks the best available backend:
//
//   1. KB_MCP_URL set (env or .env)      → stdio↔HTTP bridge to the hosted
//      kb-query server (kb-mcp-host/, deployed on Vercel). KB_MCP_TOKEN is
//      sent as a bearer token when set.
//   2. kb/scripts/kb-mcp-server.mjs      → exec the canonical stdio server
//      from the synced corpus (unchanged local behavior).
//   3. kb/KnowledgeBase without script   → serve the vendored tools
//      (kb-mcp-host/lib) over kb/ directly.
//   4. nothing                           → still serve the tool surface; every
//      call answers with recovery guidance (sync kb/ or set KB_MCP_URL), so
//      grants never advertise a tool that cannot start.

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createKbTools } from '../kb-mcp-host/lib/kb-tools.mjs'
import { handleMcp } from '../kb-mcp-host/lib/mcp-http.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KB_DIR = path.join(ROOT, 'kb')

// --- load .env if present (matches kb-sync.mjs loader) ---
const envFile = path.join(ROOT, '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.KB_MCP_URL?.trim()
const token = process.env.KB_MCP_TOKEN?.trim()

// --- mode 2: canonical stdio server from the synced corpus ----------------
if (!url && fs.existsSync(path.join(KB_DIR, 'scripts', 'kb-mcp-server.mjs'))) {
  const child = spawn(process.execPath, [path.join(KB_DIR, 'scripts', 'kb-mcp-server.mjs'), '--root', KB_DIR],
    { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
}
// --- mode 1: bridge stdio to the hosted server ----------------------------
else if (url) {
  const pending = new Set()
  const rl = readline.createInterface({ input: process.stdin, terminal: false })
  rl.on('line', (line) => {
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) }
    catch { return }
    const job = forward(line, msg)
    pending.add(job)
    job.finally(() => pending.delete(job))
  })
  rl.on('close', () => Promise.allSettled([...pending]).then(() => process.exit(0)))

  async function forward(line, msg) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: line,
        signal: AbortSignal.timeout(25_000),
      })
      if (res.status === 202) return // notification — nothing to relay
      const body = await res.text()
      if (body.trim()) process.stdout.write(body.trim() + '\n')
    }
    catch (err) {
      if (msg.id === undefined) return
      const text =
        `Hosted kb-query unreachable at ${url} (${err.message}). Fallbacks: ` +
        `unset KB_MCP_URL and run node scripts/kb-sync.mjs for the local ` +
        `server, or grep the synced kb/ files directly.`
      const result = msg.method === 'tools/call'
        ? { content: [{ type: 'text', text }], isError: true }
        : undefined
      process.stdout.write(JSON.stringify(result
        ? { jsonrpc: '2.0', id: msg.id, result }
        : { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: text } }) + '\n')
    }
  }
}
// --- modes 3 + 4: vendored tools over kb/ (corpus present or missing) -----
else {
  const kb = createKbTools(KB_DIR)
  const serverInfo = { name: 'kb-query', version: '1.0.0' }
  const missingMessage =
    `Corpus not synced (${KB_DIR} has no KnowledgeBase/) and no KB_MCP_URL ` +
    `configured. Run: node scripts/kb-sync.mjs — or set KB_MCP_URL to the ` +
    `hosted kb-query endpoint (see kb-mcp-host/README.md). Grep-first ` +
    `fallback: the kb-query skill works directly on kb/ files.`
  const ctx = { ...kb, missingMessage, serverInfo }
  const rl = readline.createInterface({ input: process.stdin, terminal: false })
  rl.on('line', (line) => {
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) }
    catch { return }
    const { body } = handleMcp(msg, ctx)
    if (body !== undefined) process.stdout.write(JSON.stringify(body) + '\n')
  })
  rl.on('close', () => process.exit(0))
}
