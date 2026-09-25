# Phase 24 — axio-query: MCP surface over the live engine data

> Agent-facing brief. Ship without asking; document judgment calls
> in the commit body. Canonical sibling: the KB's
> `kb/scripts/kb-mcp-server.mjs` (zero-dep stdio MCP server,
> newline-delimited JSON-RPC; spawned per session by the MCP host;
> accelerator-never-dependency posture).

## Why

Card/effect/keyword FACTS must never live in hand-written prose (the
lexicon lint guards terminology, but data goes stale silently). The
engine already exports its truth — `npm run catalog:export` renders
`devlog/` catalog data from the live libraries. This phase makes that
truth queryable by agents and sessions the same way the external KB
corpus is: `axio_*` tools next to the `kb_*` tools, always exactly as
current as the working tree.

## Deliverables

1. `scripts/axio-mcp-server.mjs` — zero-dependency stdio MCP server
   (copy the JSON-RPC scaffolding from `kb/scripts/kb-mcp-server.mjs`;
   it is deliberately reusable). Data source: the `catalog:export`
   JSON output — locate its on-disk artifact (see
   `scripts/build-catalog.mjs` / mechanics `catalog:export` script) and
   regenerate it at server start when missing or older than
   `src/Cards/cards.library.ts` / the effects libraries (spawn
   `npm run catalog:export` synchronously; on failure, serve stale
   with a staleness warning in every response — accelerator posture).
2. Tools (mirror the kb server's shapes):
   - `axio_cards` — search the live card library by name / keyword /
     theme / rank; returns cost + `// pts:` pricing + rules text.
   - `axio_effects` — search the buffs/debuffs libraries.
   - `axio_keywords` — the 30-keyword registry with hallmark/utility
     classification and proving-gate status from
     `docs/keyword-atlas.md` rows when present.
   - `axio_overview` — counts, themes, preset recipe, doctrine
     one-liners (STRIKE IS DEAD, tier-vs-rank) sourced from the data,
     not hand-written.
3. Register in `.mcp.json` (`axio-query`, spawn
   `node scripts/axio-mcp-server.mjs`) and allowlist the four tools in
   `.claude/settings.json`.
4. Point the consumers at it: `card-expert` + `mechanics-expert`
   frontmatter tool grants and a short "axio-query vs kb-query" note
   (ours vs the genre's) in their KB sections; one paragraph in root
   `AGENTS.md` next to the kb-query paragraph.
5. Hermetic test: a node test (or vitest in mechanics `automation/`)
   that drives the server over stdio (initialize → tools/list → one
   call per tool) exactly like the KB server smoke test.

## Decisions made upfront — DO NOT ASK

- Read-only server. No write surface, ever — the card editor and
  `/deck-tuning` own writes.
- Data comes from generated exports, never from parsing prose docs.
- If `catalog:export` output lacks a field the tools need (e.g. effect
  payloads), extend the exporter in mechanics rather than having the
  server import TS source — keep the server dependency-free.
- Naming: `axio_*` tool prefix, `axio-query` server id.

## Verify gate

`npm run verify -w axiomancer-mechanics` if the exporter changed;
otherwise the server smoke test + `node scripts/check-lexicon.mjs`.
All checks green before commit.

## DoD

Flip Phase 24's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash, add to the Phase log. `npm run deploy:check` after
push.

## Follow-ups (out of scope)

- Exposing sim/playtest invocation as MCP tools (stay read-only).
- CI usage of axio-query (sessions-only for now, like kb-query).
