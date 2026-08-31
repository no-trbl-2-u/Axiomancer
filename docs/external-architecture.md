# External architecture

Axiomancer's game runtime and source live in this monorepo. The systems below sit outside it and support governance, research, automation, distribution, or evidence storage. None may silently become game-rules authority.

```mermaid
flowchart LR
  A[Axiomancer monorepo]
  KB[game-knowledge-base repo]
  KBL[kb/ shallow materialization]
  MCP[kb-query MCP]
  AX[axio-query MCP]
  SS[SomberSoft-Memory doctrine]
  GH[GitHub + Actions]
  CL[Claude Code action]
  PW[Playwright tooling]
  EAS[Expo EAS]
  R2[Private Cloudflare R2 vault]

  KBLIVE[kb-live hosted MCP - Vercel]

  KB -->|kb-sync| KBL
  KBL -->|grep/read or stdio| MCP
  KB -->|tarball at HEAD, caller GH token| KBLIVE
  KBLIVE -->|stdio-HTTP bridge when kb/ absent| MCP
  MCP -->|cited prior art| A
  A -->|live generated catalog| AX
  SS -->|company law and CDRs| A
  A <--> GH
  GH --> CL
  GH --> PW
  GH --> EAS
  A -->|verified artifacts only| R2
```

## Integration register

### Game knowledge base

- **Owner / location:** `no-trbl-2-u/game-knowledge-base`; canonical local sibling checkout: `/root/Workspace/SomberSoft/game-knowledge-base`.
- **Purpose:** source-backed board-game rules, reception research, reusable patterns, and the Dawncaster card/keyword corpus. It supplies external prior art; it does not own Axiomancer rules.
- **Materialization:** `node scripts/kb-sync.mjs` shallow-clones or hard-refreshes `origin/main` into this repo's gitignored `kb/` directory. `KB_REPO` and `KB_DIR` may override the defaults.
- **Direct data flow:** agents grep generated indexes/frontmatter first, read only selected documents, and preserve `kb:<game>/<document> (src-NNN)` evidence receipts.
- **MCP data flow:** `.mcp.json` launches `node kb/scripts/kb-mcp-server.mjs --root kb` as the `kb-query` stdio server. It exposes overview, search, document, game, card, and keyword lookups over the materialized corpus.
- **Availability:** development/research integration and optional accelerator. It is **not** a product-runtime dependency. If MCP is unavailable, use direct grep/read. If `kb/` is absent or stale, run `node scripts/kb-sync.mjs`.
- **Write path:** `node scripts/kb-sync.mjs wish "<coverage request>"` appends and best-effort pushes the KB wishlist. This requires write-capable ambient Git credentials or `GH_TOKEN`; a push failure must be reported but does not sink the design session.
- **Secrets:** `GH_TOKEN` may be loaded from the environment or an ignored `.env`. The sync script passes it as a per-command HTTP header and does not persist it in `kb/.git/config`.

### kb-live hosted MCP endpoint

- **Owner / location:** Vercel project `axiomancer-kb-live` (team `tj-braindump`, hobby/free tier), git-linked to this repo with root directory `services/kb-live/`; source of truth is `services/kb-live/` here. Endpoint: `https://axiomancer-kb-live.vercel.app/api/mcp`. (Until the first deploy lands — see the kb-live row in `plan/AUDIT.md` — the bridge degrades to recovery answers.)
- **Purpose:** the always-on route to the KB corpus for sessions with no synced `kb/` clone — CI loop ticks, fresh checkouts, remote sessions. Same six `kb_*` tools as the stdio server; an accelerator for prior-art retrieval, never a product-runtime dependency and never rules authority.
- **Design:** stateless GitHub-token corpus proxy. It stores **no secrets and no data**: each `tools/call` authenticates with the caller-supplied `x-github-token` header (the caller's own `GH_TOKEN`/`GH_PAT`), fetches the private KB repo's tarball at HEAD (cached in instance memory by sha, ~5-min freshness re-check), and answers from memory. `initialize`/`tools/list` need no token. Tokens are used for the GitHub fetch only — never stored, logged, or proxied elsewhere; the fetch target is pinned to the KB repo.
- **Data flow:** `scripts/kb-mcp-launcher.mjs` (the `.mcp.json` `kb-query` entry) serves a synced `kb/` locally and otherwise bridges stdio↔HTTP to this endpoint. `vercel.json`'s `ignoreCommand` skips builds for pushes that do not touch `services/kb-live/`.
- **Credentials:** none held by the service. Callers supply their own GitHub token; Vercel deployment rides the repo link. Keep the project on the free tier (same usage law as the R2 vault: paid usage needs T's explicit approval).
- **Availability / failure:** optional accelerator. If the endpoint is down or the token is missing/rejected, the tools answer with the kb-sync recovery command; sync-then-grep on `kb/` remains the evidence path of record.
- **Verification / recovery:** `node scripts/kb-live-probe.mjs` (locally with `GH_TOKEN`, or dispatch `kb-live-probe.yml`) witnesses initialize → tools/list → real corpus calls. Hermetic logic tests: `scripts/kb-live-server.test.mjs`. Redeploy = push to `main` touching `services/kb-live/`, or re-import the repo in the Vercel dashboard (root directory `services/kb-live`).

### MCP servers and tool boundaries

- **`kb-query`:** repo-configured stdio adapter over the **external** KB. `.mcp.json` launches `scripts/kb-mcp-launcher.mjs`: a synced `kb/` serves locally; otherwise it bridges to the kb-live endpoint above. Optional accelerator; direct files remain the fallback.
- **`axio-query`:** repo-local stdio server at `scripts/axio-mcp-server.mjs`. It exposes current Axiomancer cards, enemies, effects, and keywords from `devlog/data/` plus `axiomancer-mechanics/docs/keyword-atlas.md`. It regenerates stale catalog data through `npm run catalog:export` when possible. It is not external data and never outranks mechanics source files.
- **`playwright`:** `.mcp.json` invokes `npx -y @playwright/mcp@latest` with isolated headless Chromium. This is development/test tooling, not runtime architecture. Native Playwright scripts remain available when MCP permissions or transport fail.
- **Failure law:** MCP improves retrieval and browser control but may not become the only route to evidence. Every MCP surface must retain a file, script, or CLI fallback.
- **Verification:** run `node scripts/axio-mcp-server.test.mjs` for the repo-local server. For KB recovery, sync first and then invoke the server through the configured MCP client.

### SomberSoft company doctrine and decisions

- **Owner / location:** remote `no-trbl-2-u/SomberSoft-Memory`; canonical local root `/root/Workspace/SomberSoft`.
- **Company law:** `/root/Workspace/SomberSoft/SOMBERSOFT_COMMAND_LEDGER.md`.
- **Company decision records:** `/root/Workspace/SomberSoft/decisions/`.
- **Repository decisions:** Axiomancer ADRs remain inside this monorepo under package or root `docs/adr/` paths.
- **Authority:** T's latest explicit decision wins. Company CDRs and the command ledger govern company-wide policy; repo ADRs govern repository architecture; live repo plans govern execution. External doctrine does not replace mechanics source as executable rules truth.
- **Availability:** required for major company-direction and cross-repository decisions, but not for compiling or running the game. If the sibling checkout is unavailable, stop decisions that depend on it rather than reconstructing doctrine from memory.
- **Secrets:** none belong in doctrine or decision records.

### GitHub and GitHub Actions

- **Owner / location:** `no-trbl-2-u/Axiomancer`; workflows are versioned in `.github/workflows/` and execute on GitHub-hosted runners.
- **Purpose:** repository hosting, issues/PRs, verification, autonomous Nexus commands, tuning/playtest jobs, dependency upkeep, and preview-build orchestration.
- **External actions and runtimes:** workflows use GitHub-maintained actions such as `actions/checkout@v4` and `actions/setup-node@v4`; Claude-powered jobs use `anthropics/claude-code-action@v1`; mobile preview builds invoke Expo's `eas-cli` service.
- **Credentials:** `GITHUB_TOKEN` is supplied by GitHub. `GH_PAT` is used when autonomous pushes must trigger downstream verification. `CLAUDE_CODE_OAUTH_TOKEN` authorizes Claude workflows. `EXPO_TOKEN` authorizes EAS preview builds. Optional notification integrations use `NOTIFY_NTFY_TOPIC` and `NOTIFY_WEBHOOK_URL`.
- **Secret boundary:** values live only in GitHub Actions secrets or ignored local environment files. Documentation and committed workflows name variables but never contain values.
- **Availability:** GitHub is required for hosted collaboration and CI, not for local engine execution. Claude workflows and notifications are automation layers; their failure must not redefine repository truth. EAS is required only for hosted preview builds.
- **Recovery:** run package verification locally (`npm run verify`) when hosted CI is unavailable. Use `gh auth status` and repository workflow logs to diagnose hosted failures; do not treat an absent cloud run as a passing deploy gate.

### Claude and browser automation

- **Claude Code action:** the reusable `.github/workflows/_claude-skill.yml` provisions Node 22, workspace dependencies, optional Playwright Chromium, ignored `.env` GitHub context, and Nexus guard self-tests before invoking Claude. These workers operate on repository state but their self-reports are not proof; commits, CI, tests, and artifacts are proof.
- **Local Judge/Sol work:** direct implementation is permitted. Delegation is optional and should be used only when parallelism or independent review adds value.
- **Playwright:** browser automation may run through MCP or package scripts. It provides visual/runtime evidence, never mechanics authority.

### Expo EAS

- **Owner / location:** Expo-hosted EAS; configuration lives in `axiomancer-mobile/`.
- **Purpose:** hosted Android/iOS preview builds after the mobile verification gate.
- **Data flow:** `.github/workflows/preview-build.yml` verifies mobile, optionally runs visual smoke, then calls `npx eas-cli@latest build` with `EXPO_TOKEN`.
- **Availability:** preview/distribution only; not required for local Expo development or mechanics execution.
- **Failure behavior:** a failed or absent EAS build blocks claiming a hosted preview, but does not erase local verification evidence.

### Private Cloudflare R2 artifact vault

- **Owner / location:** private bucket `sombersoft-artifacts`; client and operating documentation live outside this repo at `/root/Workspace/SomberSoft/artifact-vault/` in SomberSoft-Memory.
- **Purpose:** durable storage for verified playtest evidence, screenshots, reports, and build artifacts. It is not a source-code mirror, database, game runtime dependency, or public CDN.
- **Key contract:** `project/kind/YYYY-MM-DD/run/filename`; uploads include SHA-256 metadata and a manifest sidecar.
- **Data flow:** a local or CI producer invokes the sibling CLI after verification; R2 stores the artifact privately; consumers list, inspect, and download by canonical key. Public bucket access is forbidden.
- **Credentials:** Cloudflare/R2 credentials remain outside this repo, locally in `/root/.config/sombersoft/cloudflare-r2.env` or in appropriately scoped CI secrets. Never copy credential values into Axiomancer files, logs, prompts, manifests, or commits.
- **Usage law:** Cloudflare must remain within the free tier. Any paid usage requires T's explicit approval. Keep Standard storage, monitor monthly storage and operation counts, and do not add automatic bulk uploads or retention expansion without a bounded estimate and guardrail.
- **Availability:** optional artifact storage. An R2 outage blocks archival claims but must not block local development, tests, or access to source-controlled evidence.
- **Recovery / use:** from `/root/Workspace/SomberSoft`, load the protected environment, set `R2_BUCKET=sombersoft-artifacts`, and use `node artifact-vault/bin/artifact-vault.js help`. Do not add a repository-relative dependency on the sibling CLI.

## Architecture rules

1. **No external service owns game rules.** `axiomancer-mechanics` source and tests remain executable authority.
2. **Accelerators require fallbacks.** MCP and hosted agents may accelerate work but cannot become the sole evidence path.
3. **External writes are explicit.** KB wishlist pushes, GitHub mutations, EAS builds, and R2 uploads must identify their destination and verification evidence.
4. **Secrets never cross into Git.** Commit variable names and recovery procedures, never values.
5. **Artifacts are not source truth.** R2 preserves evidence; Git preserves source and durable repository decisions.
6. **Failure is labeled by boundary.** Distinguish local product failure from unavailable KB, MCP, GitHub, Claude, Expo, notification, or R2 infrastructure.
7. **New external architecture updates this document.** Any new hosted service, sibling repository, MCP server, external datastore, or required agent runtime must be added here with owner, authority, credentials, fallback, and recovery procedure.
