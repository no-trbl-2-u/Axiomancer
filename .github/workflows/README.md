# GitHub Actions — CI + the Claude automation layer

Two layers live here:

1. **CI and deterministic builds:** `verify-mechanics`, `verify-mobile`,
   `verify-card-editor`, `verify-drift`, `verify-prose`, `preview-build`,
   `build-devlog`, `check-lexicon`, `check-devlog-served`. Each package has one
   owning verify workflow: mechanics owns root dependency changes and runs
   affected mobile/editor consumer gates; mobile and editor run only for their
   own paths. Mobile verification installs once, exports once, and reuses that
   inspected export for the affected Hazard / Encounter / Combat
   journeys. Shared or unknown runtime changes fail closed to all journeys;
   Sunday/manual mobile runs are the unconditional full-suite backstop.
   `npm run deploy:check` polls the verify workflows.
2. **Claude automation:** every zero-input skill/command in the repo,
   runnable from the Actions tab and (where it makes sense) on a schedule.
   All of them funnel through the reusable runner
   [`_claude-skill.yml`](./_claude-skill.yml), which owns checkout, `npm
   ci`, `.env` materialization, the nexus enforcement layer (guard hooks +
   deny walls), and the `anthropics/claude-code-action` invocation. Every
   Claude workflow is pinned to **Sonnet 5** (`--model claude-sonnet-5`);
   change it in one place there (plus `claude.yml`, which doesn't use the
   runner).

## Secrets

| Secret | Status | Purpose |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | **required** (configured) | Auth for every Claude workflow. |
| `GH_PAT` | **recommended** | A PAT (classic: `repo` + `workflow` scopes; or fine-grained: contents/issues/PRs read-write + actions read). Without it workflows fall back to the default `GITHUB_TOKEN`, and **pushes/PRs made by the skills will not trigger the `verify-*` workflows** — the deploy gate then **fails closed** (`deploy-check.mjs` exits 1 when a code tick has zero verify runs), tuning PRs get no CI, and `ci-autofix` never fires for loop pushes. Diagnose with `pat-probe.yml`. |
| `NOTIFY_NTFY_TOPIC` / `NOTIFY_WEBHOOK_URL` | optional | Pager channels for `scripts/notify.mjs` (failure-mode stops, `[needs-user-call]`s). |

## The workflows

| Workflow | Skill | Trigger | Notes |
|---|---|---|---|
| `build-devlog.yml` | deterministic `npm run site:build` | manual | Rebuilds the catalog + DevLog, uploads `devlog/` as an artifact, and commits changed generated files to `main`; no Claude invocation. |
| `check-lexicon.yml` | deterministic retired-term lint | weekly + manual | Active package verify jobs run this lint in their existing runner; the tracked pre-commit hook protects docs-only commits, and this workflow is the remote backstop. |
| `close-trailers.yml` | deterministic `loop-issue.mjs close-trailers` | every push to `main` (+ PRs touching the script) | **The auto-close authority** (Phase 48). Sweeps *every* commit in the pushed range, parses the closing keywords out of the commit prose, and closes each referenced issue via the API, idempotently. GitHub's native `Closes #N` parser is inert in this repo, and the agent-driven `close-comment` step is gated behind a green `deploy:check` — so it is skipped whenever a loop turn ends while CI is still amber (this is what leaked #174 for 11 hours). Runs `scripts/loop-issue.test.mjs` as a gating witness first, so a parser regression turns `main` red instead of silently leaking issues. No Claude invocation. |
| `deploy-comment.yml` | deterministic `loop-issue.mjs deploy-comment` | `workflow_run: completed` on `verify-mechanics`/`verify-mobile`/`verify-card-editor` | **The deploy-URL-comment authority** (Phase 91) — the same floor `close-trailers.yml` is for the close, applied to the comment. The agent-driven `close-comment`/`phase-close` step posts the deploy comment only if the SAME tick's own `deploy:check` goes green before the tick's container dies; a tick that ends while CI is still amber skips it forever, with nothing in a later tick to resume it. This workflow instead fires on the gated verify-* workflows' own completion, re-checks green via `scripts/deploy-check.mjs` (checked out at that exact commit, short timeout), and posts the comment only once truly green — idempotent (SHA-scoped marker) and self-healing (a sibling workflow still pending re-fires this on its own completion). Never closes anything; `close-trailers.yml` already owns that. No Claude invocation. |
| `march.yml` | `/march` | 2-hour cron + manual | The autonomous-beast tick: triage → critique → ship-a-phase → adjust-* → forge → expand → iterate. Manual runs accept `focus_phase`; when set, the run dispatches `/ship-a-phase phase <focus_phase>` instead of normal `/march`. Pushes to `main`. |
| `night.yml` | `/digest` | every other day 08:47 UTC + manual | Morning briefing to `devlog/entries/DIGEST_<date>.md` + nightly breadth checks. |
| `consolidate.yml` | `/consolidate` | monthly (2nd, 07:23 UTC) + manual | Memory curator: compacts `plan/` durable memory (bearings, CRITIQUE archive, lessons/reflexes hygiene). Curation only — meaning never changes. Pushes to `main`. |
| `triage.yml` | `/triage` | manual only (per-issue `issues:` trigger removed 2026-08) | Manual pass on a specific issue; march's triage gate is the standing sweep. |
| `ci-autofix.yml` | `/fix-ci` | `verify-*` failure on `main` + manual | Red-main first responder. Pushes the fix to `main`. |
| `dep-upgrades.yml` | `/dep-upgrades` | manual (Mon 06:13 UTC cron disabled 2026-07-08) | Patch/minor bumps, full verify, one PR. Locked stack untouched. |
| `iterate.yml`, `critique.yml`, `expand.yml`, `ship-a-phase.yml`, `plan-a-phase.yml` | same-named | manual only | March dispatches these on its own; direct dispatch = force one tick. `iterate.yml` runs Opus 4.8 (medium effort) — a deliberate quality pass; march-dispatched iterate stays on Sonnet 5. |
| `deck-tuning.yml`, `hazard-tuning.yml`, `world-tuning.yml` | same-named | manual (weekly 03:29 UTC crons disabled 2026-07-08) | Mechanics balance loops; each delivers a branch + PR, never `main`. |
| `combat-playtest.yml` | `/combat-playtest` | manual (monthly cron disabled 2026-07-08) | Report-only doctrine verdict, branch + PR. |
| `critic-loop.yml`, `deep-playtest.yml`, `combat-ux-tuning.yml`, `hermes-playtest.yml` | same-named | manual only | Mobile expo-web loops; install Playwright, long-running. |
| `claude.yml` | — | `@claude` mention in issues/PRs | Interactive responder. |

Skills that need a human in the loop (`/oversight`, `/jot`, the
`.claude/skills/` design partners) deliberately have no workflow.

## Operating notes

- **Concurrency:** everything that can push to `main` shares the
  `nexus-loop` concurrency group, so ticks queue instead of colliding
  (GitHub keeps at most one run pending per group — a queued tick can be
  superseded, which is fine for a loop). Tuning/playtest loops run on
  their own branches and get per-workflow groups.
- **Cadence:** scheduled runs consume Claude subscription usage. To
  throttle, edit or delete the `cron:` block in the relevant workflow —
  everything stays manually dispatchable.
- **Activation:** schedules, `workflow_run`, and the dispatch button only
  work once these files are on the default branch (i.e. after this PR
  merges).
- **Enforcement:** `.claude/settings.json` is committed and always
  active (guard hooks, deny walls for force-push / `--no-verify` /
  destructive resets); each run self-tests the guard before Claude
  starts so a broken guard fails the job rather than running unguarded.
