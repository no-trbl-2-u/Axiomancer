// kb-mcp-host/lib/mcp-http.mjs — stateless streamable-HTTP MCP core.
//
// One JSON-RPC message (or batch) in, one JSON response out. No sessions, no
// SSE stream: every request is self-contained, so the server scales to zero
// and a lost connection loses nothing. Notifications get 202/no body per the
// streamable-HTTP transport; unknown methods get -32601 like the stdio server.

const PROTOCOL_VERSION = '2025-03-26'

/**
 * Handle one decoded JSON-RPC payload (object or array).
 * @returns {{ status: number, body: object|undefined }}
 */
export function handleMcp(payload, { tools, corpusMissing, missingMessage, serverInfo }) {
  const messages = Array.isArray(payload) ? payload : [payload]
  const responses = []

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
      responses.push({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid Request' } })
      continue
    }
    const { id, method, params } = msg
    if (typeof method === 'string' && method.startsWith('notifications/')) continue

    if (method === 'initialize') {
      responses.push({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo,
        },
      })
    }
    else if (method === 'ping') {
      responses.push({ jsonrpc: '2.0', id, result: {} })
    }
    else if (method === 'tools/list') {
      responses.push({
        jsonrpc: '2.0', id,
        result: { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
      })
    }
    else if (method === 'tools/call') {
      const tool = tools.find((t) => t.name === params?.name)
      if (!tool) {
        responses.push({ jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } })
      }
      else if (corpusMissing()) {
        responses.push({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: missingMessage }], isError: true } })
      }
      else {
        try {
          const text = tool.run(params?.arguments ?? {})
          responses.push({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } })
        }
        catch (err) {
          responses.push({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `kb-query internal error: ${err.message}` }], isError: true } })
        }
      }
    }
    else if (id !== undefined) {
      responses.push({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
    }
  }

  if (!responses.length) return { status: 202, body: undefined } // notifications only
  return { status: 200, body: Array.isArray(payload) ? responses : responses[0] }
}

/**
 * Node req/res adapter shared by the Vercel function and the local server.
 * Auth: when `token` is set, POSTs must carry `Authorization: Bearer <token>`.
 */
export async function serveHttp(req, res, { kb, serverInfo, token }) {
  const sendJson = (status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    // No standalone SSE stream in stateless mode; tell humans what this is.
    return sendJson(405, {
      jsonrpc: '2.0', id: null,
      error: { code: -32000, message: 'kb-query MCP endpoint: POST JSON-RPC here (streamable HTTP, stateless). See kb-mcp-host/README.md in the Axiomancer repo.' },
    })
  }
  if (req.method !== 'POST') return sendJson(405, { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed' } })

  if (token) {
    const auth = req.headers['authorization'] ?? ''
    if (auth !== `Bearer ${token}`) {
      return sendJson(401, { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized: set Authorization: Bearer <KB_MCP_TOKEN>' } })
    }
  }

  let payload = req.body // Vercel pre-parses JSON bodies
  if (payload === undefined) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString('utf-8')
    try { payload = raw ? JSON.parse(raw) : undefined }
    catch { return sendJson(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) }
  }
  else if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) }
    catch { return sendJson(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) }
  }
  if (payload === undefined) return sendJson(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: empty body' } })

  const { status, body } = handleMcp(payload, { ...kb, serverInfo })
  if (body === undefined) { res.statusCode = status; return res.end() }
  return sendJson(status, body)
}
