# Phase 25 — /consolidate memory curator + harness re-apply

> Agent-facing brief. Ship without asking; document judgment calls in
> the commit body. **Prerequisite context:** a 2026-07-09 harness
> upgrade was built and verified locally but LOST to a working-tree
> reset before it was committed (only the kb-query MCP wiring, the
> always-on `.claude/settings.json`, and the agent/skill KB docs were
> re-applied and committed). This phase re-applies the rest and then
> gives the new `/consolidate` verb its janitor mandate.

## Part A — re-apply the lost 2026-07-09 harness work

Each item was previously implemented and verified; re-derive from
these specs (they are complete):

1. **`/consolidate` verb** — `skills/consolidate.md` (monthly memory
   curator: archive CRITIQUE `## Done` rows >60d to
   `plan/archive/CRITIQUE_<year>.md`; collapse recurring findings to
   one row + history line; compact `plan/bearings.md` prose via
   merge/prune/tighten with locked sections and standing decisions
   immutable in meaning; lessons/reflexes two-tier hygiene with
   promotions filed as PHASE_CANDIDATES, drains logged; append one
   line per pass to `plan/archive/CONSOLIDATE_LOG.md`; hard rules:
   curation-never-authorship, archive-don't-delete, pending rows
   untouchable, when-in-doubt-leave-it). Plus doorway
   `.claude/commands/consolidate.md` and workflow
   `.github/workflows/consolidate.yml` (cron `23 7 2 * *`,
   `nexus-loop` concurrency group, via `_claude-skill.yml`,
   timeout 60). Register the verb in `AGENTS.md` skills list and the
   workflows README table.
2. **Model tiering in the runner** — `_claude-skill.yml` gains
   `model` (default `claude-sonnet-5`) and `effort` (default empty)
   inputs; `claude_args` uses `--model ${{ inputs.model }}` and
   conditionally `--effort`. `iterate.yml` passes
   `model: claude-opus-4-8`, `effort: medium` (standalone dispatch
   only — march-dispatched iterate stays Sonnet; iterate is march's
   fallback branch and would burn Opus every 6h tick otherwise).
3. **Cross-package CI job** — `verify-mechanics.yml` gains a
   `cross-package` job: full-history checkout; diff the push/PR range
   against the AGENTS.md impact paths (NOTE: `src/Skills/**` was
   removed from that list 2026-07-10 — use the current list); when
   mobile paths hit run `npm run verify -w axiomancer-mobile`, when
   editor paths (`src/Cards|src/Effects|src/Combat|src/index.ts`) hit
   run `npm run type-check -w axiomancer-card-editor`. Note the
   mechanization under the AGENTS.md checklist.
4. **Deploy gate fail-closed** — in `scripts/deploy-check.mjs`
   github-actions branch, the zero-runs-after-grace path must
   `git diff --name-only HEAD~1..HEAD` against gated paths
   (`axiomancer-mechanics/`, `axiomancer-mobile/`,
   `axiomancer-card-editor/`, `package-lock.json`, overridable via
   `DEPLOY_GATED_PATHS`); code-touching tick with zero verify runs =
   exit 1 naming the GH_PAT cause + pat-probe.yml (docs-only tick
   still exits 0). Update the GH_PAT wording in the workflows README
   and `_claude-skill.yml` header from "silently weakens" to "fails
   closed".
5. **Card-editor guards** — `eslint.config.js` (flat config mirroring
   mechanics', `no-undef` off for TS, hoisted deps only);
   `src/data/mechanics.contract.ts` (type-level assertions that the
   editor's `SPECIAL_MECHANIC_KINDS` list bidirectionally equals
   mechanics' `CardSpecialMechanic['kind']`); package.json `lint` +
   `verify` (= type-check && lint && build) scripts; a package
   `AGENTS.md` (data-adapter rule: all mechanics imports through
   `src/data/mechanics.ts`, never the `@mechanics/index` barrel);
   `verify-card-editor.yml` runs `verify` instead of bare type-check
   (timeout 12); root package.json `verify` uses the editor's
   `verify`. Fix any unused-var lint hits at current HEAD
   (underscore-prefix, don't delete).
6. **Small fixes** — `axiomancer-mobile/CLAUDE.md`: auto-merge via
   `mcp__github__enable_pr_auto_merge` is CI-only, local fallback
   `gh pr merge <n> --auto`. Node engines `>=22` in root + mobile
   package.json; `dev-server-container.sh` image `node:22-alpine`
   (watch the BOM if editing on Windows); `_engineNotes` updated.
   `plan/bearings.md` repo-tree line: settings.json is committed and
   always-on (not "opt-in example").

## Part B — the janitor mandate (new work)

Extend `skills/consolidate.md` §3 with a **terminology sweep** step:

- Run `node scripts/check-lexicon.mjs` (should be green — CI enforces
  it); the pass's real job is the unknown-unknowns: skim the live doc
  surfaces changed since the last consolidate for claims contradicting
  current specs/engine (spec 32 v3, phase 18-23 equipment epic, ...).
- A newly-dead concept found → add a `lexicon.json` row (+ LEXICON.md
  table if load-bearing) and fix/banner/pragma the flags in the same
  pass — the registry grows via the curator, not via 3-day cleanups.
- Dated docs discovered posing as current law → `**Status:**
  HISTORICAL` banner (existing convention, see
  `docs/hazard-pattern-combat-reconciliation-gaps.md`).
- Suspected-dead agent-facing files get flagged as findings, not
  deleted (first candidates, spotted 2026-07-10:
  `axiomancer-mechanics/automation/scripts/walkthroughs/
  {skill-learning,tier2-skill-chain}.goal.md` — both reference the
  removed `src/Skills` engine).

## Verify gate

`node scripts/check-lexicon.mjs` + `.claude/hooks/guard.mjs self-test`
+ `npm run verify` scoped to any package whose files changed (Part A
item 5 touches card-editor; item 4 is script-only — `node --check`).
YAML-parse every workflow touched. All green before commit.

## DoD

Flip Phase 25's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
the commit hash, add to the Phase log. `npm run deploy:check` after
push.

## Follow-ups (out of scope)

- Adding `check-lexicon` to `DEPLOY_WORKFLOWS` in deploy-check (make
  the deploy gate watch it too).
- CI kb-sync step so cloud ticks get the kb-query MCP tools.
