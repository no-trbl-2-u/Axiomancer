// kb-mcp-host/api/mcp.mjs — Vercel serverless entrypoint for the hosted
// kb-query MCP server. Wraps lib/ over the corpus snapshot that build.mjs
// wrote into corpus/ (bundled via vercel.json includeFiles).

import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createKbTools } from '../lib/kb-tools.mjs'
import { serveHttp } from '../lib/mcp-http.mjs'

// The bundle preserves project-relative layout, but resolve defensively:
// next to this file's parent (local runs) and under cwd (Vercel /var/task).
const HERE = path.dirname(fileURLToPath(import.meta.url))
const CANDIDATES = [
  path.resolve(HERE, '..', 'corpus'),
  path.resolve(process.cwd(), 'corpus'),
  path.resolve(process.cwd(), 'kb-mcp-host', 'corpus'),
]
const ROOT = CANDIDATES.find((p) => fs.existsSync(p)) ?? CANDIDATES[0]

const kb = createKbTools(ROOT)
const meta = kb.buildMeta()
const serverInfo = {
  name: 'kb-query',
  version: '1.0.0',
  ...(meta?.head ? { corpus: `${meta.head} (built ${meta.builtAt})` } : {}),
}

export default async function handler(req, res) {
  return serveHttp(req, res, { kb, serverInfo, token: process.env.KB_MCP_TOKEN || undefined })
}
