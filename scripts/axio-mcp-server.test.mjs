// scripts/axio-mcp-server.test.mjs — hermetic stdio smoke test for the
// axio-query MCP server. Zero dependencies (node:test + node:assert).
//
//   node --test scripts/axio-mcp-server.test.mjs
//
// Drives the real server as a child process over the real JSON-RPC stdio
// transport — initialize -> tools/list -> one tools/call per tool — the
// same shape as the KB server's spawn-per-session contract. Not part of
// `npm run verify` (the server lives outside every workspace); see the
// axio_query phase brief's "Verify gate" section for when to run it.

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'axio-mcp-server.mjs')

/** Spawn the server, send `requests` in order, resolve with their replies (matched by id). */
function drive(requests) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] })
    const byId = new Map()
    const rl = createInterface({ input: proc.stdout })
    let stderr = ''
    rl.on('line', (line) => {
      if (!line.trim()) return
      const msg = JSON.parse(line)
      if (msg.id !== undefined) byId.set(msg.id, msg)
    })
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0 && stderr) return reject(new Error(`axio-mcp-server exited ${code}: ${stderr}`))
      resolve(byId)
    })
    for (const r of requests) proc.stdin.write(JSON.stringify(r) + '\n')
    proc.stdin.end()
  })
}

test('initialize replies with server info', async () => {
  const replies = await drive([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }])
  const result = replies.get(1)?.result
  assert.equal(result?.serverInfo?.name, 'axio-query')
  assert.ok(result?.capabilities?.tools)
})

test('tools/list exposes all four axio_* tools', async () => {
  const replies = await drive([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }])
  const names = (replies.get(1)?.result?.tools ?? []).map((t) => t.name).sort()
  assert.deepEqual(names, ['axio_cards', 'axio_effects', 'axio_keywords', 'axio_overview'])
})

test('axio_overview returns non-empty counts', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_overview', arguments: {} } },
  ])
  const text = replies.get(1)?.result?.content?.[0]?.text ?? ''
  assert.match(text, /# Library — \d+ cards, \d+ enemies, \d+ effects/)
  // Phase 68: the denominator is gone — the registry is growable (THE PIPELINE
  // LIBERATION), so a hardcoded "/30" published a cap the project retired and
  // made a new keyword read as an overflow instead of a row.
  assert.match(text, /# Keyword registry — \d+ rows/)
  assert.doesNotMatch(text, /\/30 rows/)
})

test('axio_overview publishes live doctrine, not the retired STRIKE IS DEAD ban', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_overview', arguments: {} } },
  ])
  const text = replies.get(1)?.result?.content?.[0]?.text ?? ''
  assert.doesNotMatch(text, /STRIKE IS DEAD/)
  assert.match(text, /# Doctrine — Direct damage is legal/)
})

test('axio_cards finds a known card by keyword substring', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_cards', arguments: { theme: 'rot', limit: 3 } } },
  ])
  const text = replies.get(1)?.result?.content?.[0]?.text ?? ''
  assert.ok(text.length > 0)
  assert.doesNotMatch(text, /^No cards match/)
})

test('axio_effects finds bleed by name', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_effects', arguments: { query: 'bleed' } } },
  ])
  const text = replies.get(1)?.result?.content?.[0]?.text ?? ''
  assert.match(text, /Bleed \[debuff/)
})

test('axio_keywords returns the full registry when term is omitted', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_keywords', arguments: {} } },
  ])
  const text = replies.get(1)?.result?.content?.[0]?.text ?? ''
  // The registry is growable (THE PIPELINE LIBERATION, 2026-08-22) — assert
  // a healthy roster, not a pinned count.
  assert.ok(text.split('\n').filter(Boolean).length >= 20)
})

test('unknown tool name errors', async () => {
  const replies = await drive([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'axio_nonexistent', arguments: {} } },
  ])
  assert.equal(replies.get(1)?.error?.code, -32602)
})
