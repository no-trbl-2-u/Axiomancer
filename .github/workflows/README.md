# GitHub Actions — CI + the Claude automation layer

Two layers live here:

1. **CI (the deploy gate):** `verify-mechanics`, `verify-mobile`,
   `verify-card-editor`, `preview-build`. Path-filtered checks on push/PR;
   `npm run deploy:check` polls these.
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
| `GH_PAT` | **recommended** | A PAT (classic: `repo` + `workflow` scopes; or fine-grained: contents/issues/PRs read-write + actions read). Without it workflows fall back to the default `GITHUB_TOKEN`, and **pushes/PRs made by the skills will not trigger the `verify-*` workflows** — the deploy gate then passes vacuously, tuning PRs get no CI, and `ci-autofix` never fires for loop pushes. |
| `NOTIFY_NTFY_TOPIC` / `NOTIFY_WEBHOOK_URL` | optional | Pager channels for `scripts/notify.mjs` (failure-mode stops, `[needs-user-call]`s). |

## The workflows

| Workflow | Skill | Trigger | Notes |
|---|---|---|---|
| `march.yml` | `/march` | hourly cron + manual | The autonomous-beast tick: triage → critique → ship-a-phase → iterate. Pushes to `main`. |
| `night.yml` | `/digest` | daily 08:47 UTC + manual | Morning briefing to `plan/DIGEST.html` (stylized, self-contained page) + nightly breadth checks. |
| `triage.yml` | `/triage` | issue opened/reopened + manual | Immediate triage on arrival; march still sweeps as backstop. |
| `ci-autofix.yml` | `/fix-ci` | `verify-*` failure on `main` + manual | Red-main first responder. Pushes the fix to `main`. |
| `dep-upgrades.yml` | `/dep-upgrades` | Mon 06:13 UTC + manual | Patch/minor bumps, full verify, one PR. Locked stack untouched. |
| `iterate.yml`, `critique.yml`, `expand.yml`, `ship-a-phase.yml`, `plan-a-phase.yml` | same-named | manual only | March dispatches these on its own; direct dispatch = force one tick. |
| `deck-tuning.yml` … `world-tuning.yml` (7) | same-named | weekly, staggered Mon–Sun 03:29 UTC + manual | Mechanics balance loops; each delivers a branch + PR, never `main`. |
| `combat-playtest.yml` | `/combat-playtest` | monthly (1st) + manual | Report-only doctrine verdict, branch + PR. |
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
- **Enforcement:** each run activates the dormant
  `.claude/settings.json.example` (guard hooks, deny walls for
  force-push / `--no-verify` / destructive resets) before Claude starts —
  CI is exactly the unattended, level-3+ case that layer exists for.
