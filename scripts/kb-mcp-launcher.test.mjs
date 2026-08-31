// scripts/kb-mcp-launcher.test.mjs — hermetic tests for the kb-query
// launcher (local server vs live bridge vs recovery). Zero dependencies.
//
//   node --test scripts/kb-mcp-launcher.test.mjs
//
// Bridge mode is driven end-to-end: the launcher is spawned as a real
// stdio child against a loopback HTTP stand-in for kb-live, so the full
// JSON-RPC forward path (headers, timeouts, error recovery) is witnessed
// without touching the network or a synced kb/.

import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { pickMode, readEnvFile, DEFAULT_LIVE_URL } from './kb-mcp-launcher.mjs'

const LAUNCHER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'kb-mcp-launcher.mjs')

// --- mode selection -------------------------------------------------------

function tmpRoot(withKb) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-launcher-'))
  if (withKb) {
    fs.mkdirSync(path.join(root, 'kb', 'scripts'), { recursive: true })
    fs.mkdirSync(path.join(root, 'kb', 'KnowledgeBase'), { recursive: true })
    fs.writeFileSync(path.join(root, 'kb', 'scripts', 'kb-mcp-server.mjs'), '// stub')
  }
  return root
}

test('pickMode prefers the synced local server', () => {
  const root = tmpRoot(true)
  const picked = pickMode({ root, env: {} })
  assert.equal(picked.mode, 'local')
  assert.match(picked.server, /kb-mcp-server\.mjs$/)
})

test('pickMode bridges to kb-live when kb/ is unsynced, reading GH_TOKEN from .env', () => {
  const root = tmpRoot(false)
  fs.writeFileSync(path.join(root, '.env'), 'GH_TOKEN="from-dotenv"\n')
  const picked = pickMode({ root, env: {} })
  assert.equal(picked.mode, 'bridge')
  assert.equal(picked.url, DEFAULT_LIVE_URL)
  assert.equal(picked.token, 'from-dotenv')
})

test('pickMode honors KB_MCP_MODE=live and KB_LIVE_URL overrides', () => {
  const root = tmpRoot(true)
  const picked = pickMode({ root, env: { KB_MCP_MODE: 'live', KB_LIVE_URL: 'http://x/', GH_TOKEN: 'env-token' } })
  assert.equal(picked.mode, 'bridge')
  assert.equal(picked.url, 'http://x/')
  assert.equal(picked.token, 'env-token')
})

test('readEnvFile tolerates a missing .env', () => {
  assert.deepEqual(readEnvFile(tmpRoot(false)), {})
})

// --- bridge E2E over loopback --------------------------------------------

function fakeKbLive(onRequest) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = ''
      req.on('data', (c) => { raw += c })
      req.on('end', () => {
        const reply = onRequest(JSON.parse(raw), req.headers)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(reply))
      })
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function driveBridge(url, requests) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [LAUNCHER], {
      env: { ...process.env, KB_MCP_MODE: 'live', KB_LIVE_URL: url, GH_TOKEN: 'bridge-token' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const byId = new Map()
    const rl = createInterface({ input: proc.stdout })
    rl.on('line', (line) => {
      if (!line.trim()) return
      const msg = JSON.parse(line)
      if (msg.id !== undefined) byId.set(msg.id, msg)
    })
    proc.on('error', reject)
    proc.on('close', () => resolve(byId))
    for (const r of requests) proc.stdin.write(JSON.stringify(r) + '\n')
    // Give the async forwards time to complete before closing stdin.
    setTimeout(() => proc.stdin.end(), 1500)
  })
}

test('bridge answers initialize locally and forwards tools/* with the token header', async () => {
  const seen = []
  const server = await fakeKbLive((body, headers) => {
    seen.push({ method: body.method, token: headers['x-github-token'] })
    if (body.method === 'tools/list') return { jsonrpc: '2.0', id: body.id, result: { tools: [{ name: 'kb_overview' }] } }
    return { jsonrpc: '2.0', id: body.id, result: { content: [{ type: 'text', text: 'forwarded-answer' }] } }
  })
  const url = `http://127.0.0.1:${server.address().port}/api/mcp`
  const replies = await driveBridge(url, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } },
  ])
  server.close()
  assert.equal(replies.get(1).result.serverInfo.name, 'kb-query')
  assert.deepEqual(replies.get(2).result.tools, [{ name: 'kb_overview' }])
  assert.equal(replies.get(3).result.content[0].text, 'forwarded-answer')
  assert.ok(seen.every((s) => s.token === 'bridge-token'), 'every forward carries x-github-token')
  assert.ok(!seen.some((s) => s.method === 'initialize'), 'initialize is answered locally')
})

test('bridge degrades to an isError recovery answer when kb-live is unreachable', async () => {
  const replies = await driveBridge('http://127.0.0.1:9/api/mcp', [
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } },
  ])
  assert.equal(replies.get(1).result.isError, true)
  assert.match(replies.get(1).result.content[0].text, /kb-sync/)
})
