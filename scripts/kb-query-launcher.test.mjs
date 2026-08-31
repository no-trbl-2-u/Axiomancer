// scripts/kb-query-launcher.test.mjs — the kb-query entrypoint, driven as a
// real process over stdio the way an MCP host drives it.
//   node --test scripts/kb-query-launcher.test.mjs
//
// What these hold down: the launcher ALWAYS starts and never puts a malformed
// message on the wire. The hosted server is fail-closed, so a wrong or absent
// token is the likeliest failure in practice — it must surface as a readable
// tool error naming the fix, not as a relayed HTTP error body.

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const LAUNCHER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'kb-query-launcher.mjs')
const TOOL_NAMES = ['kb_overview', 'kb_find_games', 'kb_search', 'kb_read_doc', 'kb_cards', 'kb_keyword']

/** Send `messages`, resolve the parsed JSON lines the launcher wrote back. */
function drive(messages, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [LAUNCHER], {
      // KB_MCP_TOKEN/KB_MCP_URL are passed explicitly by each case; an empty
      // string means "no token" and must beat any value in a local .env.
      env: { ...process.env, KB_MCP_TOKEN: '', KB_MCP_URL: '', ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { err += d })
    child.on('error', reject)
    child.on('close', () => {
      try {
        resolve(out.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)))
      }
      catch (e) { reject(new Error(`${e.message}\nstdout: ${out}\nstderr: ${err}`)) }
    })
    for (const m of messages) child.stdin.write(JSON.stringify(m) + '\n')
    child.stdin.end()
    setTimeout(() => child.kill(), 10_000).unref()
  })
}

/** A stub of the hosted Worker. `handler(req, res, body)` writes the answer. */
async function stubServer(handler) {
  const seen = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (d) => { body += d })
    req.on('end', () => {
      seen.push({ headers: req.headers, body })
      handler(req, res, body)
    })
  })
  await new Promise((r) => server.listen(0, r))
  return { url: `http://localhost:${server.address().port}/mcp`, seen, close: () => server.close() }
}

const okJson = (res, payload) => {
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify(payload))
}

test('hosted: round-trips a tool call and sends the auth + accept headers', async () => {
  const stub = await stubServer((req, res, body) =>
    okJson(res, { jsonrpc: '2.0', id: JSON.parse(body).id, result: { content: [{ type: 'text', text: '43 game(s)' }] } }))

  const out = await drive(
    [{ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } }],
    { KB_MCP_TOKEN: 'sekrit', KB_MCP_URL: stub.url },
  )
  stub.close()

  assert.equal(out.length, 1)
  assert.match(out[0].result.content[0].text, /43 game\(s\)/)
  assert.equal(stub.seen[0].headers.authorization, 'Bearer sekrit')
  // Both media types, per the streamable-HTTP transport spec.
  assert.match(stub.seen[0].headers.accept, /application\/json/)
  assert.match(stub.seen[0].headers.accept, /text\/event-stream/)
})

test('hosted: a 401 becomes a readable tool error, not a relayed error body', async () => {
  const stub = await stubServer((req, res) => {
    res.writeHead(401, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' })) // not a JSON-RPC shape
  })

  const out = await drive(
    [{ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'kb_cards', arguments: { query: 'poison' } } }],
    { KB_MCP_TOKEN: 'wrong', KB_MCP_URL: stub.url },
  )
  stub.close()

  assert.equal(out[0].id, 7)
  assert.equal(out[0].result.isError, true)
  const text = out[0].result.content[0].text
  assert.match(text, /KB_MCP_TOKEN is missing or wrong/)
  assert.match(text, /kb-sync\.mjs/) // names the fallback too
  assert.equal(out[0].error, undefined) // a tool error, not a protocol error
})

test('hosted: a 503 says the server is unconfigured', async () => {
  const stub = await stubServer((req, res) => { res.writeHead(503); res.end('{"error":"Server unconfigured"}') })
  const out = await drive(
    [{ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } }],
    { KB_MCP_TOKEN: 'any', KB_MCP_URL: stub.url },
  )
  stub.close()
  assert.match(out[0].result.content[0].text, /unconfigured/)
})

test('hosted: an unreachable endpoint fails with both recovery routes', async () => {
  const out = await drive(
    [{ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } }],
    { KB_MCP_TOKEN: 'any', KB_MCP_URL: 'http://127.0.0.1:9/mcp' },
  )
  assert.equal(out[0].result.isError, true)
  assert.match(out[0].result.content[0].text, /unreachable/)
})

test('hosted: an SSE-framed answer is unwrapped to one JSON line', async () => {
  const stub = await stubServer((req, res, body) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: JSON.parse(body).id, result: { ok: true } })}\n\n`)
  })
  const out = await drive([{ jsonrpc: '2.0', id: 4, method: 'ping' }], { KB_MCP_TOKEN: 't', KB_MCP_URL: stub.url })
  stub.close()
  assert.deepEqual(out, [{ jsonrpc: '2.0', id: 4, result: { ok: true } }])
})

test('hosted: a notification is forwarded and owes no answer', async () => {
  const stub = await stubServer((req, res) => { res.writeHead(202); res.end() })
  const out = await drive([{ jsonrpc: '2.0', method: 'notifications/initialized' }], { KB_MCP_TOKEN: 't', KB_MCP_URL: stub.url })
  stub.close()
  assert.deepEqual(out, [])
  assert.equal(stub.seen.length, 1) // forwarded, not swallowed
})

test('unconfigured: still starts, lists the granted tools, and answers with the way out', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-absent-'))
  const out = await drive([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } },
  ], { KB_DIR: empty })

  assert.equal(out[0].result.serverInfo.name, 'kb-query')
  // The names CI and settings.json grant — a stub that renamed them would
  // leave those grants pointing at nothing.
  assert.deepEqual(out[1].result.tools.map((t) => t.name), TOOL_NAMES)
  assert.equal(out[2].result.isError, true)
  assert.match(out[2].result.content[0].text, /KB_MCP_TOKEN/)
  assert.match(out[2].result.content[0].text, /kb-sync\.mjs/)
})

test('local: with no token it execs the synced corpus server', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-synced-'))
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true })
  // Stand-in for kb/scripts/kb-mcp-server.mjs: proves the exec happened and
  // that --root arrived, without depending on a real corpus being synced.
  fs.writeFileSync(path.join(dir, 'scripts', 'kb-mcp-server.mjs'), `
    const root = process.argv[process.argv.indexOf('--root') + 1]
    process.stdin.on('data', () => {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { execd: true, root } }) + '\\n')
      process.exit(0)
    })
  `)

  const out = await drive([{ jsonrpc: '2.0', id: 1, method: 'ping' }], { KB_DIR: dir })
  assert.equal(out[0].result.execd, true)
  assert.equal(out[0].result.root, dir)
})
