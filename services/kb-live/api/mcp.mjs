// services/kb-live/api/mcp.mjs — kb-live: the hosted kb-query MCP endpoint.
//
// Stateless MCP "streamable HTTP" server: JSON-RPC over POST, plain JSON
// responses, no sessions, no SSE. initialize / tools/list need no
// credentials; tools/call requires the caller's own GitHub token (header
// `x-github-token`) with read access to the private KB repo — the token is
// used for the corpus fetch only and is never stored or logged.
//
// Callers: scripts/kb-mcp-launcher.mjs bridges Claude Code's stdio kb-query
// server to this endpoint whenever the local kb/ clone is absent (fresh
// checkouts, CI ticks, remote sessions). scripts/kb-live-probe.mjs is the
// end-to-end witness.

import { getModel } from '../lib/corpus.mjs'
import { toolList, runTool } from '../lib/tools.mjs'

const SERVER_INFO = { name: 'kb-live', version: '1.0.0' }

const NO_TOKEN_MSG =
  'kb-live needs a GitHub token with read access to the KB repo: send it as an ' +
  '`x-github-token` header (the bridge reads GH_TOKEN from the environment or .env — ' +
  'the same token scripts/kb-sync.mjs uses). Fallback: sync the corpus locally with ' +
  '`node scripts/kb-sync.mjs` and retry; the grep path on kb/ always works.'

function rpcResult(id, result) { return { jsonrpc: '2.0', id, result } }
function rpcError(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } } }
const textResult = (id, text, isError = false) =>
  rpcResult(id, { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) })

async function handleMessage(msg, token) {
  const { id, method, params } = msg
  if (typeof method !== 'string') return id === undefined ? null : rpcError(id, -32600, 'Invalid request')
  if (method.startsWith('notifications/')) return null
  if (method === 'initialize') {
    return rpcResult(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    })
  }
  if (method === 'ping') return rpcResult(id, {})
  if (method === 'tools/list') return rpcResult(id, { tools: toolList() })
  if (method === 'tools/call') {
    if (!token) return textResult(id, NO_TOKEN_MSG, true)
    let model
    try { model = await getModel(token) }
    catch (err) {
      const hint = err.status === 401 || err.status === 403 || err.status === 404
        ? ' The token was rejected — it needs repo-read access to the KB repo (same scope as kb-sync).'
        : ''
      return textResult(id, `kb-live could not fetch the corpus: ${err.message}.${hint}`, true)
    }
    const { text, error } = runTool(model, params?.name, params?.arguments)
    if (error) return rpcError(id, -32602, error)
    return textResult(id, text)
  }
  return id === undefined ? null : rpcError(id, -32601, `Method not found: ${method}`)
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'kb-live speaks MCP streamable HTTP: POST JSON-RPC to this URL.' })
  }
  let body
  try { body = await readBody(req) }
  catch { return res.status(400).json(rpcError(null, -32700, 'Parse error')) }
  const token = (req.headers['x-github-token'] ?? '').toString().trim() || null

  const messages = Array.isArray(body) ? body : [body]
  const replies = []
  for (const msg of messages) {
    const reply = await handleMessage(msg, token)
    if (reply) replies.push(reply)
  }
  if (!replies.length) return res.status(202).end()
  res.setHeader('Content-Type', 'application/json')
  return res.status(200).json(Array.isArray(body) ? replies : replies[0])
}
