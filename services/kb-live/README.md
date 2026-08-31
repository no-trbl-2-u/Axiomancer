# kb-live — hosted kb-query MCP endpoint

Stateless MCP (streamable HTTP) server over the SomberSoft
game-knowledge-base corpus, deployed on Vercel so the six `kb_*` tools
work in sessions with no synced `kb/` clone: CI loop ticks, fresh
checkouts, remote sessions.

- **Endpoint:** `https://axiomancer-kb-live.vercel.app/api/mcp` (POST
  JSON-RPC; GET is 405 by design).
- **Auth + data:** the server holds **no secrets and no data**. Each
  `tools/call` carries the caller's own GitHub token in an
  `x-github-token` header; the server uses it once to fetch the private
  KB repo's tarball at HEAD (cached in instance memory by commit sha,
  re-checked after ~5 min) and answers from memory. The fetch target is
  pinned to the KB repo — this is not a general GitHub proxy.
- **Callers:** `scripts/kb-mcp-launcher.mjs` (the repo's `kb-query`
  `.mcp.json` entry) bridges stdio↔HTTP here when `kb/` is absent,
  reading `GH_TOKEN` from the environment or `.env`.
- **Parity:** tool names/behavior mirror the stdio server in the KB repo
  (`kb/scripts/kb-mcp-server.mjs`). If that server grows a tool, port it
  here (`lib/tools.mjs`).
- **Tests:** hermetic — `node --test scripts/kb-live-server.test.mjs`
  (synthetic tarball, stubbed fetch). Live witness —
  `node scripts/kb-live-probe.mjs` or dispatch `kb-live-probe.yml`.
- **Deploy:** the Vercel project is git-linked to this repo with root
  directory `services/kb-live`; pushes to `main` touching this directory
  redeploy (the `ignoreCommand` in `vercel.json` skips all other
  pushes). Free tier only — see `docs/external-architecture.md`.
