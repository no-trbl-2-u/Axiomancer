# Phase 72 — Harness grants for content work

> Queued 2026-08-22 from the content-pipelines audit §6.3-6.4. Brief
> generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

The permission allowlist matches what the skills actually run, the
`reader` agent's tool roster names tools that exist, and the CI skill
workflow's MCP grant question is answered with a reason.

## Why

The audit found the allowlist lagging the skills by a wide margin —
including `npm run baseline:check`, which is **the guard's own
prescribed escape hatch for its baseline write-block**. This bites
attended/local ticks only (CI runs with permissions skipped), which is
exactly why it went unnoticed by the loop and hits the user instead.
The remote session that shipped THE PIPELINE LIBERATION was itself
permission-blocked from editing `.claude/settings.json`, so the fix has
to land from a local session.

## Surface

| File | Change |
|---|---|
| `.claude/settings.json` | the audit's allowlist additions |
| `.claude/agents/reader.md` | chrome tools → Playwright + WebFetch |
| `.github/workflows/_claude-skill.yml` | `axio-query` granted; `kb-query` explicitly not, with the reason |
| `scripts/check-harness-grants.mjs` | new — the consistency check |

## Decisions made upfront — DO NOT ASK

- **`axio-query` is granted to CI runs; `kb-query` is not.**
  `axio-query` runs `scripts/axio-mcp-server.mjs`, which is in the
  repo, so it starts anywhere the checkout does. `kb-query` runs
  `kb/scripts/kb-mcp-server.mjs`, and **`kb/` is gitignored** — the
  corpus is synced, not committed, so in a CI checkout that server file
  does not exist. Granting it would advertise a tool that cannot start.
  The condition that changes the answer is a kb-sync step in the
  workflow, which is a separate cost decision (corpus download per
  run); it is recorded in the workflow comment, not silently skipped.
- **The `reader` agent swaps to Playwright.** Its
  `mcp__claude-in-chrome__*` roster is granted nowhere — not in
  `settings.json`, not in the CI workflow, and those servers are not in
  `.mcp.json` at all. Playwright is granted in both places and does the
  same job. Keeping a roster of tools that exist nowhere is worse than
  having no roster: an agent spawned with it fails at its first tool
  call rather than at definition time.
- **Allowlist entries stay narrow.** `npm run <script>:*` per script
  rather than a blanket `npm run:*`, and the specific `git`/`gh` verbs
  the tuning skills end with. The allowlist is a statement about what
  the loop is expected to do; widening it to "anything" discards that.
- **The branch-and-PR verbs are granted; history-rewriting ones are
  not.** The existing deny rules are untouched. This phase adds only
  what a skill needs to open a PR.
- **`curl`/`wget` are NOT added** despite the art phase's acquisition
  path. Network fetches that write into the repo deserve their own
  decision, and Phase 71 shipped its ingest without them.

## Tests

Config, not code. Verification is by inspection plus a mechanical
check, because the roster rot is precisely the failure that went
unnoticed:

| Case | Assert |
|---|---|
| `settings.json` | parses; no duplicate allow entries |
| `_claude-skill.yml` | parses as YAML |
| every agent's `mcp__*` tools | granted in `settings.json` or the CI workflow |
| every `.mcp.json` server | its command target exists in the repo, or is documented as external |

## Verify gate

`npm run verify`, `node scripts/check-harness-grants.mjs`, root
`npm test`.

## DoD

- [ ] Allowlist covers the audit's list.
- [ ] `reader` names only grantable tools.
- [ ] MCP-in-CI decision recorded in the workflow.
- [ ] Grant-consistency check wired into `npm test`.

## Follow-ups (out of scope)

- The audit's `guard.mjs` edge cases: an emoji in quoted card text
  misdiagnosed as a trailer violation, and `backgroundedGate` catching
  any command containing the word "test". **A third instance hit while
  writing this brief** — the guard rejected a `git commit` whose
  heredoc merely *quoted* a forbidden push flag inside prose. All three
  are the same shape: the guard greps the whole command string without
  distinguishing a command from text inside it.
- Whether CI should sync `kb/` so `kb-query` can be granted.
