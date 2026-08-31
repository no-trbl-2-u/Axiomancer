#!/usr/bin/env node
// scripts/kb-query-launcher.mjs — the committed entrypoint for the kb-query
// MCP server. `.mcp.json` points here rather than at `kb/scripts/…` because
// `kb/` is a gitignored sync: on a fresh checkout (CI, remote sessions) that
// path does not exist and the MCP host fails the server at launch — which is
// how kb-query spent phase 72 deliberately ungranted in CI.
//
// This launcher ALWAYS starts, then picks a backend:
//
//   1. KB_MCP_TOKEN set  → bridge stdio to the hosted kb-query server (the
//      Cloudflare Worker owned by the game-knowledge-base repo; see that
//      repo's mcp-server/how-to-configure.md). Endpoint defaults to the
//      published one and is overridable with KB_MCP_URL.
//   2. kb/ synced        → exec the canonical stdio server from the corpus
//      clone (unchanged local behavior).
//   3. neither           → still serve the tool surface; every call answers
//      with recovery guidance, so a grant never advertises a dead tool.
//
// Why the TOKEN and not the URL decides: the Worker is fail-closed. Without a
// token every hosted call is a guaranteed 401, so a tokenless session is
// better served by the local corpus. To force the local path with a token in
// your environment, unset KB_MCP_TOKEN for that session.
//
// Routing is decided once, at startup, and never switches mid-session: a
// predictable backend is worth more here than a clever one. When the hosted
// route is chosen but unreachable, calls fail with a message naming both
// fixes rather than silently changing corpus underneath the agent.

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KB_DIR = path.resolve(ROOT, process.env.KB_DIR ?? 'kb')
const DEFAULT_ENDPOINT = 'https://kb-mcp.no-trbl-2-u.workers.dev/mcp'

// --- load .env if present (matches kb-sync.mjs loader) ---
const envFile = path.join(ROOT, '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
    // A real environment variable always wins, including one set empty on
    // purpose — that is how a session opts out of the hosted route.
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !Object.hasOwn(process.env, m[1])) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const token = process.env.KB_MCP_TOKEN?.trim()
const url = (process.env.KB_MCP_URL?.trim() || DEFAULT_ENDPOINT)
const localServer = path.join(KB_DIR, 'scripts', 'kb-mcp-server.mjs')

const emit = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')
const lines = () => readline.createInterface({ input: process.stdin, terminal: false })

// ---------------------------------------------------------------------------
// 1. Hosted — bridge stdio to the Worker.
// ---------------------------------------------------------------------------
if (token) {
  // Serialized: one request in flight at a time. The hosted server is
  // stateless so ordering is not strictly required, but it keeps stdout
  // interleaving deterministic for whatever is reading us.
  let chain = Promise.resolve()
  const rl = lines()
  rl.on('line', (line) => {
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) }
    catch { return }
    chain = chain.then(() => forward(line, msg)).catch(() => {})
  })
  rl.on('close', () => chain.finally(() => process.exit(0)))

  async function forward(line, msg) {
    let res
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Both types per the streamable-HTTP transport spec. This server
          // answers in JSON, but a spec-compliant one may negotiate SSE and
          // reject a request that does not offer it.
          'accept': 'application/json, text/event-stream',
          authorization: `Bearer ${token}`,
        },
        body: line,
        signal: AbortSignal.timeout(25_000),
      })
    }
    catch (err) {
      return fail(msg, `Hosted kb-query unreachable at ${url} (${err.message}).`)
    }

    // A non-2xx body is the transport's error shape, not JSON-RPC — relaying
    // it verbatim would put a malformed message on the wire. Translate.
    if (!res.ok) {
      const hint = res.status === 401
        ? 'KB_MCP_TOKEN is missing or wrong — check it against the Worker\'s MCP_TOKEN secret.'
        : res.status === 503
          ? 'The server is unconfigured (no MCP_TOKEN secret set on the Worker).'
          : `The server answered HTTP ${res.status}.`
      return fail(msg, `Hosted kb-query refused the request. ${hint}`)
    }

    if (res.status === 204 || res.status === 202) return // notification accepted
    const body = (await res.text()).trim()
    if (!body) return

    // Tolerate an SSE-framed answer, in case the endpoint ever negotiates one.
    if ((res.headers.get('content-type') ?? '').includes('text/event-stream')) {
      for (const frame of body.split(/\r?\n\r?\n/)) {
        const data = frame.split(/\r?\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('')
        if (data) process.stdout.write(data + '\n')
      }
      return
    }
    process.stdout.write(body + '\n')
  }

  /** Answer one message with a recovery message the agent can act on. */
  function fail(msg, what) {
    if (msg.id === undefined) return // nothing owed for a notification
    const text = `${what} Fallbacks: unset KB_MCP_TOKEN and run \`node scripts/kb-sync.mjs\` to serve from the local corpus, or grep kb/ directly.`
    emit(msg.method === 'tools/call'
      ? { jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text }], isError: true } }
      : { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: text } })
  }
}

// ---------------------------------------------------------------------------
// 2. Local — exec the canonical stdio server out of the synced corpus.
// ---------------------------------------------------------------------------
else if (fs.existsSync(localServer)) {
  const child = spawn(process.execPath, [localServer, '--root', KB_DIR], { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// 3. Neither — advertise the surface, answer every call with the way out.
// ---------------------------------------------------------------------------
else {
  const RECOVERY =
    `No kb-query backend configured. Either set KB_MCP_TOKEN (the hosted corpus at `
    + `${url}; see the game-knowledge-base repo's mcp-server/how-to-configure.md) or run `
    + `\`node scripts/kb-sync.mjs\` to materialize ${path.relative(ROOT, KB_DIR)}/ and serve it locally. `
    + `Grep-first fallback: the kb-query skill works directly on the synced files.`

  const TOOLS = [
    ['kb_overview', 'Map of the corpus: board games with mechanics and better-if labels, pattern docs, card-corpus stats. Start here.'],
    ['kb_find_games', 'Find board games by mechanics slug and/or better-if label.'],
    ['kb_search', 'Regex search across the corpus; returns file:line matches.'],
    ['kb_read_doc', 'Read one corpus document by repo-relative path.'],
    ['kb_cards', 'Search the card corpora by name/rules-text substring.'],
    ['kb_keyword', 'Look up a keyword/mechanic term in the glossary.'],
  ].map(([name, description]) => ({
    name,
    description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: true },
  }))

  const rl = lines()
  rl.on('line', (line) => {
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) }
    catch { return }
    const { id, method } = msg
    if (id === undefined) return
    if (method === 'initialize') {
      emit({ jsonrpc: '2.0', id, result: {
        protocolVersion: msg.params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'kb-query', version: 'unconfigured' },
      } })
    }
    else if (method === 'ping') emit({ jsonrpc: '2.0', id, result: {} })
    else if (method === 'tools/list') emit({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    else if (method === 'tools/call') {
      emit({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: RECOVERY }], isError: true } })
    }
    else emit({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
  })
  rl.on('close', () => process.exit(0))
}
