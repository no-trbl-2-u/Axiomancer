# Prompt: TRIM THE FAT — T5 and the leftover Tier 2 docs rows

> **Status:** EXECUTED 2026-09-25 (attended). §1.1 GLYPHS #376 · §1.2
> commands #378 + `/jot` `1fc33003` · §1.3 docs #377 · §1.4 icons #379 ·
> §1.5 ballot answered as D18 (Codex cut, #380), D19 (Debug\* kept), D20
> (die growth kept). Do not re-run. Next steps: §3.

> Written 2026-09-25 at T's direction, after T1–T4 merged (#369–#375).
> Read first, in order: `plan/2026-09-25-refactor-strategy.decisions.md`
> (D1–D17), `plan/2026-09-25-trim-the-fat.spec.md` (§ Tier 2, Tier 3, §6
> Guards, §7), `plan/2026-09-25-trim-the-fat.prompt.md` (standing frame
> ¶1–¶9 still binds), then this file. Nothing here overrides those.
> The previous hand-off (`plan/2026-09-25-trim-t2a-handoff.prompt.md`) is
> fully executed; do not re-run it.

## 0. State at hand-off

Main is green: mechanics 222 files / 3,539 tests, mobile 3,050 tests,
card-editor type-check clean, root `npm test` 218/218, `baseline:check`
FRESH (re-stamped after T3; every number identical to the pre-trim
stamp). What merged:

| Step | PR | What |
|---|---|---|
| T1 | #369 | binaries, raw output, dead docs |
| T2a | #370, `e073bb6e`, #371, #372 | legacy d20 pipeline, derived stats, Faction, test-only modules, Tier 0 items 1–5; baselines; residue |
| T2b | #373 | Upgradeable-Dice flag collapsed (D7): the OFF path is gone from engine, mobile, tests, CI |
| T3 | #374 | mobile orphans, Tier 0 items 6–8 (item 6 per D17), engine barrel 952 → 384 exports |
| T4 | #375 | `plan/` compaction, ~15,000 lines out of the always-read files, 191 files archived |

## 1. Your mandate, in order

One PR per block; each PR runs the package gates it touches (spec §4)
and re-stamps the baseline if mechanics source changed.

1. **GLYPHS cut (D8).** ~250 engine LOC + 4 mobile files, zero library
   cards; `cards.sandbox-sets.ts` holds the only glyph cards. Grep
   `glyph` across both packages, the card editor, and `docs/`.
   `card-upgrades.ts` **stays** (D8: deferred to the card rework).
   `glyphs.engine.test.ts` goes with it. Seeded matrix before/after must
   be identical (no library card uses GLYPHS).
2. **Retire the eight commands (D10).** deck-tuning, hazard-tuning,
   world-tuning, combat-ux-tuning, critic-loop, deep-playtest,
   hermes-playtest, dep-upgrades: delete `.claude/commands/<name>.md` and
   any matching skill docs; keep the playtest matrix npm scripts; repoint
   anything that names them (AGENTS.md, CLAUDE.md, skills/, bearings,
   workflows). Then **`/jot`** a note: rebuild these once the mechanics
   settle (after the D4 stat hooks and the card rework).
   ⚠ `.claude/**` edits are classifier-blocked for autonomous runs. Do
   this block in an attended session where T approves the edits, or ask T
   to delete the eight files by hand and then do the repointing.
   `deck-tuning.md` also still names `plan/tuning/` (moved to
   `plan/archive/2026-09-25-trim-t4/plan/tuning/` in T4) — moot once it
   is deleted.
3. **Tier 2 docs rows not yet done** (spec § Tier 2, last two rows):
   archive with a `**Status:** HISTORICAL` banner — `CHANGELOG.md`
   (frozen 07-05), specs 01/06/08-12/14/23/25/28/31/32/35, `effects.md`,
   `enemy.md`, `combat-audit-2026-07-05.md`, `profane-canon.md`, the July
   tuning reports, `new-north-star.prompt.md`, mobile `specs/`,
   `design/handoff-*`, UI_FRESH_EYES candidates/ledger. Re-check each
   against the tree first: T2a/T2b/T3 rewrote some of these docs in place.
   Merge the cross-package duplicates (source-of-truth hierarchy ×5,
   hazard docs ×3). Spec §7 "load-bearing but stale" rows are fixed in
   place, never cut. Mind the §6 guards (tooling-read docs, devlog inputs).
4. **Unused platform icon exports** (`assets/images/ios`, `web`,
   `android/play_store_512`, legacy `ic_launcher`): delete only after
   confirming the store-submission checklist / tests need none (§6 guard
   lists the tests that name store assets).
5. **Still owner decisions — ask T, don't decide** (use AskUserQuestion,
   per `docs/asking-well.md`): the "Codex" aesthetic (cut or finish), the
   14 manual-only Debug* tools (keep, or cut all but the 9 CI-driven
   ones), `bankedSouls` / `bonusTurnDice` / `dieUpgradeLevel` (wire or
   cut). Already decided, out of T5's scope: stat model (D4, designed with
   the damage-scaling hook), Labyrinth (D5, wired with the D2 map work),
   card upgrades (D8, card rework), Mork Borg transcription and maze
   images (already deleted).

## 2. Open content calls filed during T2–T4 (not T5's job)

In `plan/AUDIT.md` (T2b row): the fate riders on `the-note-falls-due` /
`miserere` / `dead-pledge` can never fire; the advantage buffs
(`buff_haste` & kin) are inert; `reroll_spent` rolls from the legacy face
bag; card faces print a dead ▲/▼ read; CLARITY is inert; three pieces of
wrong dice copy; the lost `upgradeable-dice-e2e` coverage;
`MAX_PERMANENT_WILD_DICE` unenforced. Route through `/adjust-cards`,
`/adjust-keywords`, `/iterate` — not the trim.

## 3. After T5 — the strategy's next steps (D1)

- **D2 map re-authoring** with D16's parameters (4 regions, ~20 nodes per
  map, spread in every direction) and D15's per-map canvas. T has an
  Act 1 four-quadrant engraving (see the decisions file's follow-ups):
  upscale ≥5000px, crop along the natural seams, place nodes on its
  landmarks. D5's Labyrinth entry lands here.
- **D4 stat hooks + damage-scaling formula** (D1 step 3).
- **Card rework** (D1 step 4), which also decides card upgrades (D8).

## 4. Standing notes (learned the hard way this session)

- Never `sed -i` on this box: Git Bash rewrites CRLF files wholesale. Edit
  via the Edit tool or `open(p, encoding='utf-8', newline='')`; check
  `git diff --stat` for whole-file rewrites.
- `npm run verify:visual` fails at its own `expo export` spawn on Windows.
  Run `npx expo export --platform web --output-dir .smoke-dist` in
  `axiomancer-mobile/`, then `SMOKE_REUSE_EXPORT=1 node
  scripts/smoke-screens.mjs`. Local Windows Chromium differs from the
  container baselines by 1.5–13% on every route; compare against the
  previous local run's percentages, and only promote a baseline you
  changed on purpose (copy that one PNG; `baseline:approve` promotes all).
- `baseline:regen` refuses a dirty tree: commit first, re-stamp, commit
  the JSON.
- The guard hook lints the whole Bash command string: commit messages
  inline with `-m` (no `-F`), no trailers; keep `gh pr create` with its 🤖
  line in a separate command from any `git commit`/`push`, or pass
  `--body-file`.
- A pre-commit hook stages `telemetry/`; with parallel agents in one
  worktree, commit with an explicit pathspec so their staged work does
  not ride along.
- Subagents in one worktree work well when each owns disjoint files and
  reports cross-file fallout instead of editing it.
- Never run the verify gate in the background (guard hook).
