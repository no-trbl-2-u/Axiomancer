# Phase R1 — Tooling reset

## Sources

- Part plan: [`plan/revamp/tooling.md`](../revamp/tooling.md) § R1 (items 1–6).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D56** (the card editor is deleted; B5 designs its successor),
  **D57** (the deck-matrix baseline is retired until R9/B2 need numbers),
  **D50** (git history is the source archive; markdown moves to
  `plan/archive/`), **D58** (revamp mode: nothing is authored).
- Build-plan row: `.claude/**` items are attended residue; R1 leaves them.

## Outcome

The monorepo is two packages (mechanics + mobile). No card editor, no
deck-matrix baseline or its tooling, no Tuning Lab pages, no orphan
scripts, and the root `npm test` is green.

## Scope

1. **Card editor (D56).** Delete `axiomancer-card-editor/`. Drop its
   workspace entry, the `editor` npm script and its `verify` leg from root
   `package.json`; refresh `package-lock.json`. Delete
   `.github/workflows/verify-card-editor.yml`; drop it from
   `ci-autofix.yml`, `deploy-comment.yml`, `verify-drift.yml` path filters,
   the `verify-mechanics.yml` card-editor type-check step,
   `scripts/deploy-check.mjs` defaults, `scripts/devlog-catalog-shots.mjs`
   `WORKSPACES`, `.env.example`, `.easignore`, the PR template, and
   `.github/workflows/README.md`. The drift gate loses its two editor
   extractors (`scripts/content-drift.mjs`) and their three tests.
   "Three-package" prose becomes two in AGENTS.md, README.md,
   `plan/bearings.md`, mechanics README / `src/index.ts` / `docs/api.md`,
   and `skills/ship-a-phase.md`.
2. **Baseline (D57).** Delete `scripts/check-baseline-freshness.mjs`,
   `scripts/regen-deck-matrix-baseline.mjs` and their tests; drop
   `baseline:check` / `baseline:regen` and the two tests from root
   `test`; drop the CI freshness step, the test step and the path filters
   in `verify-mechanics.yml`. Move
   `axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`
   to `plan/archive/baselines/` (D50: an archived artifact, not source).
   Rewrite the root `CLAUDE.md` "balance/measurement" paragraph,
   AGENTS.md → Truth sources, `docs/truth-sources.md` → "Measured truth",
   and the digest's nightly re-measure in `skills/digest.md`.
3. **DevLog.** Move `devlog/tuning-lab/tuning-lab-{1,2,3}.html` to
   `plan/archive/tuning-lab/`; remove the Tuning Lab page from
   `build-devlog-public.mjs`, `build-devlog.mjs`, the public nav in
   `devlog-public-shell.mjs`, `check-devlog-not-served.mjs`, `.gitignore`,
   `devlog/README.md`, and their tests. Entries stay as history. The
   catalog already reads live engine content; no change.
4. **Orphan scripts.** Delete `axiomancer-mechanics/scripts/dump-paid-context.ts`,
   `scripts/apply-retheme-map.mjs` + `docs/retheme-map.json` (no lexicon
   tool reads it: `git grep retheme-map scripts/` hits only the codemod),
   and the naming-law check (`scripts/check-naming-law.mjs` + test,
   `lint:names`, its `.githooks/pre-commit` and `verify-prose.yml` legs;
   `lint:content` becomes `lint:prose` alone). Drop the
   `combat-dice-economy` npm script and its CLI. Give
   `scripts/check-devlog-public-live.mjs` the npm script
   `devlog:check-live`.
5. **Stale docs.** `docs/logging.md` (`--deck=preset:all`,
   `statusEngagement`), `spec.md` ("faction reputation"), and the red root
   test at `scripts/build-devlog-public.test.mjs:117` (re-pinned: it now
   picks a *post* with a pair; the front page features a pair but carries
   no marginalia).
6. `.env.example`: add `KB_MCP_TOKEN`.

## Consumers to update

Root scripts and CI listed above; `skills/` verbs that name the editor or
the baseline; the PR template. No engine export changes; mobile is not
touched.

## Save / schema contracts

None. No save field changes.

## Carrier sweep

Tooling-only phase: the only "carriers" removed are the editor's display
vocabulary and glyph switch, whose drift tests go with them. No glossary,
atlas or glyph row depended on the editor.

## Decisions made upfront — DO NOT ASK

- **`.claude/**` is untouched** (build-plan row): `guard.mjs`'s
  SessionStart freshness print is best-effort and prints nothing once its
  script is gone; its baseline write-block and self-test path stay;
  `launch.json`'s card-editor entry and the settings allowances stay. All
  named in the commit as attended residue.
- **Baseline JSON is archived, not deleted** (part plan: "archive").
- **`agent-e2e` stays**: README, automation README, quickstart and
  testing docs document `npm run agent-e2e`; it is wired.
- **`combat-dice-economy` is dropped**: it measures preset spreads and dice
  economy, the measurement class D57 retires; no doc or CI step names it.
- **Historical docs are not rewritten** (reports, specs, dated plans,
  `plan/AUDIT.md`, `devlog/entries`): they describe their own day.
- **Keyword atlas "until R1" notes** become past tense; no row changes.

## Tests matrix

- Deleted with their subjects: `check-baseline-freshness.test.mjs`,
  `regen-deck-matrix-baseline.test.mjs`, `check-naming-law.test.mjs`, the
  three editor drift tests in `content-drift.test.mjs`.
- Rewritten: `build-devlog-public.test.mjs` (no Tuning Lab page; the
  marginalia case picks a post), `check-devlog-not-served.test.mjs`
  (tuning-lab paths).

## Verify gate

`npm run verify --workspace axiomancer-mechanics`,
`npm run verify --workspace axiomancer-mobile`, root `npm test`,
`npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Commit body template

```
chore: tooling reset, the card editor and the baseline go — phase R1

- <what went, per scope item>

Decisions:
- <the calls above>

Attended residue (.claude/**, left for a session with T):
- guard.mjs baseline block and SessionStart print; launch.json card-editor
  entry; settings.json naming-law / baseline allowances.

Closes #<mirror>
```

## DoD

- `axiomancer-card-editor/` gone; root `verify` runs two packages.
- No `baseline:*` script; the baseline JSON sits in `plan/archive/`.
- No Tuning Lab page in either DevLog build.
- Root `npm test` green; all gates above green.

## Follow-ups (out of scope)

- The `.claude/**` residue above (attended).
- B5 designs the card-creator successor.
