# Phase 56 — CI verify-on-PR / verify-on-push (GitHub Actions)

> Promoted via `/oversight` 2026-05-20 (fifth oversight of the session,
> commit `0b8dc81`) from expand-pass-13 candidate `b011acb`. Brief
> authored 2026-05-20 at commit `577e4c7`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 56 — CI verify-on-PR / verify-on-push".
- Existing `.github/workflows/march.yml` (manual-dispatch autonomous-loop runner) — the model for Node + cache + auth conventions.

## Goal — one-line outcome

Add a GitHub Actions workflow that runs `npm run verify` + `npm run deploy:check` on every `pull_request` against `main` and on every `push` to `main`, so PRs / branches without the local autonomous loop still get a remote red-CI signal before merge.

## Decisions (made upfront)

### D1 — `.github/workflows/verify.yml` as a sibling of `march.yml`

Don't fold the verify-on-PR step into `march.yml` — that workflow is manual-dispatch and runs the autonomous loop, which already commits + pushes. `verify.yml` is a passive gate that should run on every push / PR without dispatching any other skill. Separate concerns, separate files.

### D2 — Node 20 + `npm ci` + `actions/setup-node` cache

Match `march.yml`'s setup (Node 20, `cache: 'npm'`). The cache keys off `package-lock.json` automatically. `npm ci` (clean install) over `npm install` for reproducibility — exactly what the deploy gate would do at publish time.

### D3 — Run both `verify` and `deploy:check` in the same job

Sequencing matters: `npm run verify` runs `type-check + tests + build` (creates `dist/`), and `npm run deploy:check` then runs the four structural assertions against `dist/` + the surface fixture. Skipping `deploy:check` would leave the public-surface drift detector (Phase 53) + tag/CHANGELOG agreement (Phase 52) inactive on PR.

### D4 — Two triggers: `pull_request` against main + `push` to main

`pull_request` catches the work before merge. `push` to main catches direct commits (the autonomous loop's normal flow) — those should also pass the gate, and the workflow gives a public green/red status visible on the commit list. Together they cover both human-PR and bot-push paths.

### D5 — No automated `npm publish` step

Per RELEASING.md's manual+attended publish flow. The Phase 56 workflow is for verification, not release. A separate `release.yml` could be added later (Unit 2 of the candidate, optional) but isn't part of this phase.

## Commit units

### Unit 1 — `.github/workflows/verify.yml`

File:
- `.github/workflows/verify.yml` — Triggers on `pull_request` against main + `push` to main. Steps: checkout (full depth for deploy-check's `git describe --tags`), Node 20 setup with npm cache, `npm ci`, `npm run verify`, `npm run deploy:check`. Concurrency group cancels in-progress runs on the same ref so a force-push doesn't pile up runs.

Verify: cannot smoke-test the workflow locally without GitHub Actions. The workflow file must pass YAML syntax (would fail-fast on push if not) and reproduce the local `npm run verify` + `npm run deploy:check` exit codes. The first run will trigger on the push that lands this commit.

Commit: `ci(verify): Phase 56 unit 1 — verify-on-PR / verify-on-push workflow`.

### Unit 2 — README CI badge + docs cross-link (optional)

If the workflow's first run lands green, optionally:
- `README.md` — add a GitHub Actions badge for the verify workflow at the top of the file.
- `docs/testing.md` "Deploy gate" subsection — cross-link to the workflow.

Skipping Unit 2 in this brief is fine — the workflow's existence is the substantive ship; the badge is post-merge polish. Pure-docs follow-up can land as a small iterate tick later.

Commit (if shipped): `docs(readme): Phase 56 unit 2 — CI badge`.

## Verify gate

`npm run verify` + `npm run deploy:check` — both green locally. The workflow's first remote run is the real gate; it triggers on the push that lands this commit.

## DoD

- Phase 56 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]`.
- `.github/workflows/verify.yml` exists.
- First push of this commit triggers the workflow and shows green in the Actions tab.

## Out of scope

- A release workflow on tag push (was the candidate's optional Unit 2) — defer until after the next bump if a CI-driven publish gesture is genuinely wanted (per D5).
- Cross-platform matrix (macos / windows) — Node 20 on ubuntu-latest covers the existing `march.yml` baseline; matrix expansion is a future polish.
- Auto-merging dependabot PRs or other GitHub-side automation — not part of this phase's scope.
