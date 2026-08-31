#!/usr/bin/env node
// scripts/kb-mcp-launcher.mjs — resilient entry point for the kb-query MCP
// server. `.mcp.json` points here so the server CONNECTS in every session,
// not only ones with a synced kb/ clone:
//
//   1. kb/ synced locally      -> exec the KB repo's own stdio server
//                                 (kb/scripts/kb-mcp-server.mjs --root kb)
//   2. kb/ absent              -> stdio<->HTTP bridge to the hosted kb-live
//                                 endpoint, authenticating with the caller's
//                                 GH_TOKEN (env or .env — the same token
//                                 kb-sync and the CI workflows already hold)
//   3. no token / no network   -> the bridge still connects; corpus calls
//                                 answer with the recovery message instead
//                                 of failing the whole MCP server
//
// The three modes expose the same six kb_* tools, so skills and sub-agents
// reference ONE server name (kb-query) everywhere. Accelerator, never a
// dependency: the grep path on a synced kb/ remains the fallback of record.

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCAL_SERVER = path.join(ROOT, 'kb', 'scripts', 'kb-mcp-server.mjs')
const LOCAL_CORPUS = path.join(ROOT, 'kb', 'KnowledgeBase')

export const DEFAULT_LIVE_URL = 'https://axiomancer-kb-live.vercel.app/api/mcp'

// --- mode selection -------------------------------------------------------

export function pickMode({ root = ROOT, env = process.env } = {}) {
  const localServer = path.join(root, 'kb', 'scripts', 'kb-mcp-server.mjs')
  const localCorpus = path.join(root, 'kb', 'KnowledgeBase')
  if (env.KB_MCP_MODE !== 'live' && fs.existsSync(localServer) && fs.existsSync(localCorpus)) {
    return { mode: 'local', server: localServer }
  }
  return {
    mode: 'bridge',
    url: env.KB_LIVE_URL || DEFAULT_LIVE_URL,
    token: env.GH_TOKEN || readEnvFile(root).GH_TOKEN || '',
  }
}

export function readEnvFile(root) {
  const file = path.join(root, '.env')
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

// --- bridge ---------------------------------------------------------------

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

async function forward(url, token, msg, timeoutMs = 75_000) {
  const headers = { 'content-type': 'application/json', accept: 'application/json' }
  if (token) headers['x-github-token'] = token
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(msg),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (res.status === 202) return null
  if (!res.ok) throw new Error(`kb-live answered HTTP ${res.status}`)
  return res.json()
}

function runBridge({ url, token }) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false })
  rl.on('line', async (line) => {
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) }
    catch { return }
    const { id, method, params } = msg
    if (typeof method !== 'string' || method.startsWith('notifications/')) return
    // Answer the handshake locally: instant connect, no cold-start stall.
    if (method === 'initialize') {
      return send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'kb-query', version: '1.0.0-bridge' },
        },
      })
    }
    if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} })
    try {
      const reply = await forward(url, token, msg)
      if (reply) send(reply)
    }
    catch (err) {
      if (id === undefined) return
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text:
              `kb-live unreachable (${err.message}). Recovery: sync the corpus locally with ` +
              `node scripts/kb-sync.mjs and restart the session, or grep kb/ directly per the kb-query skill.`,
          }],
          isError: true,
        },
      })
    }
  })
  rl.on('close', () => process.exit(0))
}

// --- main -----------------------------------------------------------------

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const picked = pickMode()
  if (picked.mode === 'local') {
    const child = spawn(process.execPath, [picked.server, '--root', path.join(ROOT, 'kb')], { stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code ?? 0))
    child.on('error', () => process.exit(1))
  }
  else {
    runBridge(picked)
  }
}

export { LOCAL_SERVER, LOCAL_CORPUS }
