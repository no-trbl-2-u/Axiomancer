// scripts/kb-live-server.test.mjs — hermetic tests for the hosted kb-live
// MCP endpoint (services/kb-live/). Zero dependencies (node:test).
//
//   node --test scripts/kb-live-server.test.mjs
//
// Builds a synthetic KB tarball in memory and stubs global fetch, so the
// full path — GitHub sha resolve -> tarball download -> tar/pax parse ->
// corpus model -> JSON-RPC handler — runs without network, credentials, or
// a synced kb/ clone. The live-network leg is witnessed separately by
// scripts/kb-live-probe.mjs (workflow kb-live-probe.yml).

import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import { extractKnowledgeBase, buildModel, resetCache } from '../services/kb-live/lib/corpus.mjs'
import { runTool, toolList } from '../services/kb-live/lib/tools.mjs'
import handler from '../services/kb-live/api/mcp.mjs'

// --- tiny ustar writer ----------------------------------------------------

function tarEntry(name, content, typeflag = '0') {
  // Long paths ride a pax extended header, as GitHub's tarballs do.
  if (name.length > 100 && typeflag === '0') {
    return Buffer.concat([
      tarEntry('pax-header', `${`00 path=${name}\n`.length} path=${name}\n`, 'x'),
      tarEntry(name.slice(-100), content),
    ])
  }
  const body = Buffer.from(content, 'utf-8')
  const header = Buffer.alloc(512, 0)
  header.write(name, 0, 100, 'utf-8')
  header.write('0000644\0', 100) // mode
  header.write('0000000\0', 108) // uid
  header.write('0000000\0', 116) // gid
  header.write(body.length.toString(8).padStart(11, '0') + '\0', 124)
  header.write('00000000000\0', 136) // mtime
  header.write('        ', 148) // checksum placeholder (spaces while summing)
  header.write(typeflag, 156)
  header.write('ustar', 257)
  header.write('00', 263)
  let sum = 0
  for (const b of header) sum += b
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148)
  const padded = Buffer.alloc(Math.ceil(body.length / 512) * 512)
  body.copy(padded)
  return Buffer.concat([header, padded])
}

const TOP = 'no-trbl-2-u-game-knowledge-base-abc123'
const GAME_INDEX = `---
title: "Root"
year: 2018
weight: 3.8
status: published
mechanics: [asymmetric-powers, area-control]
---
Root is a game of woodland might and right.
`
const BETTER_IF = `---
better_if_labels:
  - "runaway-leader"
  - "downtime"
---
- claim: Players punish runaway leaders. (src-042, high)
`
const CARDS_JSON = JSON.stringify({
  card_count: 2,
  cards: [
    { name: 'Ember Lance', rarity: 'rare', type: 'attack', cost: { mana: 2 }, rules_text: 'Deal 6. Apply Burn 2.', observed_terms: ['burn'], okf_path: 'cards/ember-lance.okf.md' },
    { name: 'Ward of Ash', rarity: 'common', type: 'skill', cost: {}, rules_text: 'Gain 5 block.', observed_terms: ['block'], okf_path: 'cards/ward-of-ash.okf.md' },
  ],
})
const KEYWORDS_JSON = JSON.stringify({
  keyword_count: 1,
  keywords: [{ keyword: 'Burn', slug: 'burn', type: 'status', description: 'Take N damage at turn end, then halve.' }],
})

function syntheticTarGz() {
  const longPath = `${TOP}/KnowledgeBase/BoardGames/games/root/rules/a-deliberately-long-pax-extended-header-file-name-that-overflows-the-classic-ustar-hundred-byte-field.okf.md`
  return gzipSync(Buffer.concat([
    tarEntry(`${TOP}/README.md`, 'not part of the corpus'),
    tarEntry(`${TOP}/KnowledgeBase/BoardGames/games/root/index.okf.md`, GAME_INDEX),
    tarEntry(`${TOP}/KnowledgeBase/BoardGames/games/root/reception/better-if.okf.md`, BETTER_IF),
    tarEntry(`${TOP}/KnowledgeBase/BoardGames/patterns/runaway-leader.okf.md`, '# pattern doc'),
    tarEntry(`${TOP}/KnowledgeBase/DigitalCardGames/dawncaster/cards.json`, CARDS_JSON),
    tarEntry(`${TOP}/KnowledgeBase/DigitalCardGames/dawncaster/keywords.json`, KEYWORDS_JSON),
    tarEntry(longPath, '- claim: pax entry survived. (src-777, high)'),
    Buffer.alloc(1024),
  ]))
}

function modelFromSynthetic() {
  const files = extractKnowledgeBase(syntheticTarGz())
  return buildModel(files, 'abc123def456')
}

// --- corpus ---------------------------------------------------------------

test('extractKnowledgeBase keeps only KnowledgeBase/ files, strips the top dir, honors pax paths', () => {
  const files = extractKnowledgeBase(syntheticTarGz())
  assert.ok(files.has('KnowledgeBase/BoardGames/games/root/index.okf.md'))
  assert.ok(!files.has('README.md'))
  assert.ok(!files.has(`${TOP}/README.md`))
  const paxPath = [...files.keys()].find((p) => p.includes('deliberately-long-pax'))
  assert.ok(paxPath, 'pax-extended long path entry is extracted')
  assert.match(files.get(paxPath), /pax entry survived/)
})

test('buildModel reads game frontmatter, patterns, and dawncaster sidecars', () => {
  const model = modelFromSynthetic()
  assert.equal(model.games.length, 1)
  const root = model.games[0]
  assert.equal(root.title, 'Root')
  assert.deepEqual(root.mechanics, ['asymmetric-powers', 'area-control'])
  assert.deepEqual(root.better_if_labels, ['runaway-leader', 'downtime'])
  assert.deepEqual(model.patterns, ['runaway-leader.okf.md'])
  assert.equal(model.cards.card_count, 2)
  assert.equal(model.keywords.keyword_count, 1)
})

// --- tools ----------------------------------------------------------------

test('toolList exposes the six kb_* tools', () => {
  assert.deepEqual(
    toolList().map((t) => t.name).sort(),
    ['kb_cards', 'kb_find_games', 'kb_keyword', 'kb_overview', 'kb_read_doc', 'kb_search'],
  )
})

test('kb_overview, kb_find_games, kb_search, kb_read_doc, kb_cards, kb_keyword answer from the model', () => {
  const model = modelFromSynthetic()
  assert.match(runTool(model, 'kb_overview', {}).text, /1 game\(s\)[\s\S]*2 card records, 1 keywords/)
  assert.match(runTool(model, 'kb_find_games', { better_if_label: 'runaway-leader' }).text, /^root — "Root"/)
  assert.match(runTool(model, 'kb_find_games', { mechanic: 'deck-building' }).text, /No games match/)
  assert.match(
    runTool(model, 'kb_search', { query: 'runaway leaders' }).text,
    /games\/root\/reception\/better-if\.okf\.md:6/,
  )
  assert.match(
    runTool(model, 'kb_read_doc', { path: 'KnowledgeBase/BoardGames/games/root/index.okf.md' }).text,
    /woodland might/,
  )
  assert.match(runTool(model, 'kb_read_doc', { path: '../secrets' }).text, /Refused/)
  assert.match(runTool(model, 'kb_cards', { query: 'burn' }).text, /Ember Lance \[rare\/attack\] \(mana:2\)/)
  assert.match(runTool(model, 'kb_keyword', { term: 'burn' }).text, /Burn \[status\]/)
  assert.equal(runTool(model, 'nope', {}).error, 'Unknown tool: nope')
})

// --- handler (stubbed network) --------------------------------------------

function mockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k] = v },
    status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; return this },
    end() { return this },
  }
  return res
}

async function post(body, headers = {}) {
  const res = mockRes()
  await handler({ method: 'POST', headers, body }, res)
  return res
}

test('handler serves initialize and tools/list without credentials', async () => {
  const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } })
  assert.equal(init.statusCode, 200)
  assert.equal(init.body.result.serverInfo.name, 'kb-live')
  assert.equal(init.body.result.protocolVersion, '2025-03-26')
  const list = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
  assert.equal(list.body.result.tools.length, 6)
})

test('handler answers tools/call without a token with recovery guidance, not a crash', async () => {
  const res = await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } })
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.result.isError, true)
  assert.match(res.body.result.content[0].text, /x-github-token/)
})

test('handler fetches the corpus with the caller token and caches by sha', async (t) => {
  resetCache()
  let shaCalls = 0
  let tarCalls = 0
  const tarball = syntheticTarGz()
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    assert.equal(opts.headers.authorization, 'Bearer test-token')
    if (String(url).includes('/commits/')) {
      shaCalls++
      return new Response('abc123def456', { status: 200 })
    }
    tarCalls++
    return new Response(tarball, { status: 200 })
  })
  t.after(() => resetCache())

  const call = { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'kb_overview', arguments: {} } }
  const first = await post(call, { 'x-github-token': 'test-token' })
  assert.match(first.body.result.content[0].text, /1 game\(s\)/)
  assert.match(first.body.result.content[0].text, /kb-live @ abc123def456/)
  const second = await post(call, { 'x-github-token': 'test-token' })
  assert.equal(second.body.result.isError, undefined)
  assert.equal(tarCalls, 1, 'warm call reuses the cached corpus')
  assert.equal(shaCalls, 1, 'freshness re-check waits out the sha TTL')
})

test('handler rejects non-POST and unparseable bodies cleanly', async () => {
  const res = mockRes()
  await handler({ method: 'GET', headers: {} }, res)
  assert.equal(res.statusCode, 405)
  const bad = await post('{not json')
  assert.equal(bad.statusCode, 400)
  assert.equal(bad.body.error.code, -32700)
})

test('handler answers notifications with 202 and no body', async () => {
  const res = await post({ jsonrpc: '2.0', method: 'notifications/initialized' })
  assert.equal(res.statusCode, 202)
})
