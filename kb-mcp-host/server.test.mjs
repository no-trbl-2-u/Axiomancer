// kb-mcp-host/server.test.mjs — node:test coverage for the hosted kb-query
// server: tool surface parity, JSON-RPC semantics, auth, and path safety.
//   node --test kb-mcp-host/server.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { createKbTools } from './lib/kb-tools.mjs'
import { handleMcp, serveHttp } from './lib/mcp-http.mjs'

// The tool names the rest of the repo grants (settings.json, _claude-skill.yml,
// agent rosters). A rename here silently breaks every consumer — pin them.
const EXPECTED_TOOLS = ['kb_overview', 'kb_find_games', 'kb_search', 'kb_read_doc', 'kb_cards', 'kb_keyword']

function fixtureCorpus() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-fixture-'))
  const game = path.join(root, 'KnowledgeBase', 'BoardGames', 'games', 'root')
  fs.mkdirSync(path.join(game, 'reception'), { recursive: true })
  fs.writeFileSync(path.join(game, 'index.okf.md'),
    '---\ntitle: "Root"\nyear: 2018\nweight: 3.9\nstatus: complete\nmechanics: [asymmetric-powers, area-control]\n---\nbody\n')
  fs.writeFileSync(path.join(game, 'reception', 'better-if.okf.md'),
    '---\nbetter_if_labels: [runaway-leader]\n---\nRunaway leader complaint (src-001).\n')
  const dc = path.join(root, 'KnowledgeBase', 'DigitalCardGames', 'dawncaster')
  fs.mkdirSync(dc, { recursive: true })
  fs.writeFileSync(path.join(dc, 'cards.json'), JSON.stringify({
    card_count: 1,
    cards: [{ name: 'Ember', rarity: 'common', type: 'attack', cost: { mana: 1 }, rules_text: 'Deal 6.', okf_path: 'cards/ember.okf.md', observed_terms: ['burn'] }],
  }))
  fs.writeFileSync(path.join(dc, 'keywords.json'), JSON.stringify({
    keyword_count: 1,
    keywords: [{ keyword: 'Burn', slug: 'burn', type: 'status', description: 'Damage over time.' }],
  }))
  fs.writeFileSync(path.join(root, '.build-meta.json'), JSON.stringify({ head: 'abc1234', builtAt: '2026-08-31T00:00:00Z' }))
  return root
}

const ROOT = fixtureCorpus()
const kb = createKbTools(ROOT)
const serverInfo = { name: 'kb-query', version: 'test' }
const ctx = { ...kb, serverInfo }
const rpc = (method, params, id = 1) => handleMcp({ jsonrpc: '2.0', id, method, params }, ctx)

test('tool surface matches the granted names', () => {
  assert.deepEqual(kb.tools.map((t) => t.name), EXPECTED_TOOLS)
})

test('initialize / ping / tools list', () => {
  const init = rpc('initialize', { protocolVersion: '2025-03-26' })
  assert.equal(init.status, 200)
  assert.equal(init.body.result.serverInfo.name, 'kb-query')
  assert.equal(rpc('ping').body.result && true, true)
  const list = rpc('tools/list')
  assert.deepEqual(list.body.result.tools.map((t) => t.name), EXPECTED_TOOLS)
})

test('notifications get 202 and no body', () => {
  const out = handleMcp({ jsonrpc: '2.0', method: 'notifications/initialized' }, ctx)
  assert.equal(out.status, 202)
  assert.equal(out.body, undefined)
})

test('unknown method and unknown tool error like the stdio server', () => {
  assert.equal(rpc('resources/list').body.error.code, -32601)
  assert.equal(rpc('tools/call', { name: 'kb_nope' }).body.error.code, -32602)
})

test('kb_overview reports games, dawncaster stats, and the snapshot stamp', () => {
  const text = rpc('tools/call', { name: 'kb_overview', arguments: {} }).body.result.content[0].text
  assert.match(text, /1 game\(s\)/)
  assert.match(text, /root — "Root"/)
  assert.match(text, /1 card records, 1 keywords/)
  assert.match(text, /Snapshot — corpus at abc1234/)
})

test('kb_find_games filters by mechanic and better-if label', () => {
  const hit = rpc('tools/call', { name: 'kb_find_games', arguments: { mechanic: 'area-control', better_if_label: 'runaway-leader' } })
  assert.match(hit.body.result.content[0].text, /^root — "Root"/)
  const miss = rpc('tools/call', { name: 'kb_find_games', arguments: { mechanic: 'trick-taking' } })
  assert.match(miss.body.result.content[0].text, /No games match/)
})

test('kb_search finds claims with file:line receipts', () => {
  const text = rpc('tools/call', { name: 'kb_search', arguments: { query: 'runaway leader' } }).body.result.content[0].text
  assert.match(text, /better-if\.okf\.md:\d+:.*src-001/)
})

test('kb_read_doc reads corpus docs and refuses traversal', () => {
  const ok = rpc('tools/call', { name: 'kb_read_doc', arguments: { path: 'KnowledgeBase/BoardGames/games/root/reception/better-if.okf.md' } })
  assert.match(ok.body.result.content[0].text, /src-001/)
  const traversal = rpc('tools/call', { name: 'kb_read_doc', arguments: { path: 'KnowledgeBase/../.build-meta.json' } })
  assert.match(traversal.body.result.content[0].text, /^Refused/)
})

test('kb_cards and kb_keyword hit the sidecars', () => {
  assert.match(rpc('tools/call', { name: 'kb_cards', arguments: { query: 'burn' } }).body.result.content[0].text, /Ember \[common\/attack\] \(mana:1\)/)
  assert.match(rpc('tools/call', { name: 'kb_keyword', arguments: { term: 'burn' } }).body.result.content[0].text, /Burn \[status\]/)
})

test('missing corpus answers with recovery guidance, not a crash', () => {
  const empty = createKbTools(path.join(ROOT, 'nope'))
  const out = handleMcp({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } }, { ...empty, serverInfo })
  assert.equal(out.body.result.isError, true)
  assert.match(out.body.result.content[0].text, /Corpus not found/)
})

test('http adapter: bearer auth and GET guidance', async () => {
  const server = http.createServer((req, res) => serveHttp(req, res, { kb, serverInfo, token: 'sekrit' }))
  await new Promise((resolve) => server.listen(0, resolve))
  const base = `http://localhost:${server.address().port}`
  const post = (headers = {}, body = { jsonrpc: '2.0', id: 1, method: 'ping' }) =>
    fetch(base, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

  assert.equal((await post()).status, 401)
  const ok = await post({ authorization: 'Bearer sekrit' })
  assert.equal(ok.status, 200)
  assert.deepEqual((await ok.json()).result, {})
  assert.equal((await fetch(base)).status, 405)
  server.close()
})
