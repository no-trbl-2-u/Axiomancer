#!/usr/bin/env node
// scripts/kb-live-probe.mjs — end-to-end witness for the hosted kb-live
// MCP endpoint. Drives the real deployment with a real GitHub token:
// initialize -> tools/list -> kb_overview -> kb_search, and asserts each
// answer has the expected shape. Run by .github/workflows/kb-live-probe.yml
// (workflow_dispatch) and available locally:
//
//   GH_TOKEN=... node scripts/kb-live-probe.mjs [--url <endpoint>]
//
// Exit codes: 0 ok; 1 probe assertion failed; 3 no token available.

import fs from 'node:fs'

// .env loader (matches deploy-check.mjs)
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const argv = process.argv.slice(2)
const urlFlag = argv.indexOf('--url')
const URL_ = urlFlag !== -1 ? argv[urlFlag + 1] : (process.env.KB_LIVE_URL || 'https://axiomancer-kb-live.vercel.app/api/mcp')
const TOKEN = process.env.GH_TOKEN

if (!TOKEN) {
  console.error('kb-live-probe: no GH_TOKEN in env or .env — cannot exercise the corpus path.')
  process.exit(3)
}

let failures = 0
function check(label, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — ${detail}`}`)
  if (!ok) failures++
}

async function rpc(method, params, { withToken = true } = {}) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(withToken ? { 'x-github-token': TOKEN } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${method}`)
  return (await res.json()).result
}

const init = await rpc('initialize', { protocolVersion: '2024-11-05' })
check('initialize names the kb-live server', init?.serverInfo?.name === 'kb-live', JSON.stringify(init))

const list = await rpc('tools/list')
const names = (list?.tools ?? []).map((t) => t.name).sort()
check(
  'tools/list exposes the six kb_* tools',
  JSON.stringify(names) === JSON.stringify(['kb_cards', 'kb_find_games', 'kb_keyword', 'kb_overview', 'kb_read_doc', 'kb_search']),
  JSON.stringify(names),
)

const denied = await rpc('tools/call', { name: 'kb_overview', arguments: {} }, { withToken: false })
check('tokenless tools/call answers with recovery guidance', denied?.isError === true, JSON.stringify(denied))

const t0 = Date.now()
const overview = await rpc('tools/call', { name: 'kb_overview', arguments: {} })
const overviewText = overview?.content?.[0]?.text ?? ''
check('kb_overview reads the real corpus (cold start ok)', /BoardGames — \d+ game/.test(overviewText), overviewText.slice(0, 200))
check('kb_overview names its corpus sha', /kb-live @ [0-9a-f]{12}/.test(overviewText), overviewText.slice(-80))
console.log(`     (kb_overview answered in ${Date.now() - t0}ms)`)

const search = await rpc('tools/call', { name: 'kb_search', arguments: { query: 'deck', max_results: 3 } })
check('kb_search returns file:line hits', /KnowledgeBase\/.*:\d+:/.test(search?.content?.[0]?.text ?? ''), JSON.stringify(search).slice(0, 200))

const keyword = await rpc('tools/call', { name: 'kb_keyword', arguments: { term: 'poison' } })
check('kb_keyword reaches the Dawncaster glossary', typeof keyword?.content?.[0]?.text === 'string' && keyword.content[0].text.length > 0, JSON.stringify(keyword).slice(0, 200))

console.log(failures ? `kb-live-probe: ${failures} failure(s)` : 'kb-live-probe: all checks passed')
process.exit(failures ? 1 : 0)
