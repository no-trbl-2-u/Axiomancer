#!/usr/bin/env node
// kb-mcp-host/serve.mjs — run the hosted kb-query server locally.
//
//   node kb-mcp-host/serve.mjs [--root <corpus-parent>] [--port 8787]
//
// --root points at any directory containing KnowledgeBase/: the built
// corpus/ snapshot (default when present), Axiomancer's synced kb/, or a
// game-knowledge-base checkout. Auth mirrors production: set KB_MCP_TOKEN
// to require a bearer token.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKbTools } from './lib/kb-tools.mjs'
import { serveHttp } from './lib/mcp-http.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = argv.indexOf(name)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt
}

const defaultRoot = [path.join(HERE, 'corpus'), path.resolve(HERE, '..', 'kb')]
  .find((p) => fs.existsSync(path.join(p, 'KnowledgeBase')))
const ROOT = path.resolve(flag('--root', defaultRoot ?? path.join(HERE, 'corpus')))
const PORT = Number(flag('--port', '8787'))

const kb = createKbTools(ROOT)
const meta = kb.buildMeta()
const serverInfo = {
  name: 'kb-query',
  version: '1.0.0',
  ...(meta?.head ? { corpus: `${meta.head} (built ${meta.builtAt})` } : {}),
}
const token = process.env.KB_MCP_TOKEN || undefined

http.createServer((req, res) => {
  serveHttp(req, res, { kb, serverInfo, token }).catch((err) => {
    res.statusCode = 500
    res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } }))
  })
}).listen(PORT, () => {
  console.log(`kb-query http server on http://localhost:${PORT} (corpus root: ${ROOT}${kb.corpusMissing() ? ' — MISSING' : ''}${token ? ', auth: bearer' : ', auth: none'})`)
})
