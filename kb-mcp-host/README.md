# kb-mcp-host — the hosted kb-query MCP server

Streamable-HTTP MCP server over the SomberSoft game-knowledge-base corpus,
deployable to Vercel. This is what makes `kb-query` a **live** server: local
sessions, remote sessions, and CI loop ticks all reach the same URL instead of
each needing a synced `kb/` clone before their MCP host starts.

Zero runtime dependencies, stateless (plain JSON responses, no sessions, no
SSE), same six tools and answer shapes as the canonical stdio server in the
game-knowledge-base repo (`scripts/kb-mcp-server.mjs`) — `lib/kb-tools.mjs` is
an adaptation of it and must be kept in lockstep if the upstream tool surface
changes.

## Layout

| File | Role |
|---|---|
| `build.mjs` | Snapshots corpus text (~8MB of `.md/.json/.csv`) into `corpus/` from `KB_LOCAL_SRC`, `../kb`, or a fresh shallow clone; stamps `.build-meta.json` |
| `lib/kb-tools.mjs` | The six `kb_*` tools over a corpus root |
| `lib/mcp-http.mjs` | Stateless JSON-RPC / streamable-HTTP core + Node adapter |
| `api/mcp.mjs` | Vercel function entrypoint (`/mcp` rewrites here) |
| `serve.mjs` | Local run: `node kb-mcp-host/serve.mjs [--root ../kb] [--port 8787]` |
| `server.test.mjs` | `node --test` coverage (tool parity, RPC semantics, auth, traversal) |

## Deploy (Vercel)

Project: git-linked to this repo, **root directory `kb-mcp-host`**. The
game-knowledge-base repo is **private**, so the build clone needs a project
env var:

- `GH_TOKEN` (or `KB_GH_TOKEN`) — token with read access to
  `no-trbl-2-u/game-knowledge-base`. Required for every deploy.
- `KB_MCP_TOKEN` — optional but recommended: when set, the endpoint requires
  `Authorization: Bearer <token>`. Without it the corpus snapshot is readable
  by anyone who finds the URL, which defeats the KB repo being private.

Corpus freshness: the bundle is a build-time snapshot (`kb_overview` names its
commit + build time). `.github/workflows/kb-host-redeploy.yml` re-triggers a
deploy nightly via a Vercel deploy hook when the `KB_HOST_DEPLOY_HOOK_URL`
secret is set; pushes to `kb-mcp-host/` redeploy automatically.

## Consumers

`.mcp.json` points the `kb-query` server at the hosted URL, so the tool names
(`mcp__kb-query__*`) are unchanged everywhere — agents, skills, CI grants.
Fallback path when the host is down (external-architecture failure law):
`node scripts/kb-sync.mjs` then grep/read `kb/` directly, exactly as before.

Write paths stay in git: the wishlist (`node scripts/kb-sync.mjs wish "…"`)
and corpus fixes go through the game-knowledge-base repo, never this server.

## Future

The natural home for this directory is the game-knowledge-base repo itself
(re-point the Vercel project there): every corpus push would then redeploy the
host with no cron hook. It lives here first so the change ships reviewably
with the loop wiring that consumes it.
