# Prompt: TRIM THE FAT — pick up the refactor-strategy session

> Written 2026-09-25 at T's direction. This file is a **handoff prompt**:
> point a fresh Claude Code session at it to continue the work that
> session `claude/axiomancer-refactor-strategy-4t1s7q` (PR #368) started.
> Its sibling, `plan/2026-09-25-trim-the-fat.spec.md`, is the keep/cut
> list this prompt executes. **Read the spec first**, then
> `plan/2026-09-25-refactor-strategy.decisions.md` (D1-D7), then this
> file. Nothing in this prompt overrides either of those; it only says
> where to start and how to keep going.
>
> This is an execution prompt. It deletes, archives, compacts, and fixes.
> It designs nothing new; the stat hooks and map re-authoring are later
> steps of the strategy and are out of scope here.

## 0. Where the last session stopped

Done and merged-or-pending on PR #368:

- `plan/2026-09-25-refactor-strategy.decisions.md` — D1 no restart /
  no purge / sequenced rework; D2 hand-authored wide map graphs; D3 audit
  scope; D4 real per-stat combat hooks; D5 wire a Labyrinth entry; D6
  deletion allowed for binaries, raw output, vendored scans, e2e output;
  D7 collapse the Upgradeable-Dice flag.
- `plan/2026-09-25-trim-the-fat.spec.md` — four audits (engine, mobile,
  docs, `plan/`) ranked into Tier 0 (bugs), Tier 1 (delete, zero
  gameplay risk), Tier 2 (archive/compact `plan/`), Tier 3 (owner
  decisions), with sequencing T1-T5 (§4) and guards (§6).
- A standing bullet in `plan/bearings.md` pointing at the strategy record.

Not done: **no file has been deleted, moved, or fixed yet.** T1 is the
next action.

Still open from spec §5 (do not decide these yourself; work around them):

- §5.3 card upgrades and GLYPHS: wire or cut.
- §5.6 resolved rows under `## Pending` in AUDIT / CRITIQUE /
  PHASE_CANDIDATES: the spec proposes moving them; no ruling yet.
- §5.7 the eight zero-invocation tuning/playtest commands: keep with
  doctrine fixes, or collapse the five overlapping playtest loops.

If T is present, put those three through `AskUserQuestion` at the start
of the session, one batch, recommended option first (spec §5 carries the
recommendations). If T is absent, skip the items they gate and say so in
the PR body.

## 1. Your mandate

Execute the spec's sequencing, one PR per step, in this order:

| Step | Scope (spec §) | Branch |
|---|---|---|
| T1 | Binaries + dead docs: Tier 1 "Binaries and data", Tier 1 "Docs that describe removed or never-built code", Tier 2 image rows | `trim/t1-binaries-docs` |
| T2 | Engine dead code (Tier 1 engine table) + Tier 0 items 1-5 + D7 flag collapse | `trim/t2-engine` |
| T3 | Mobile orphans (Tier 1 mobile table) + Tier 0 items 6-8 | `trim/t3-mobile` |
| T4 | `plan/` compaction (Tier 2 markdown rows) | `trim/t4-plan-memory` |
| T5 | Tier 3 blocks, one PR each, only those §5 has answered | `trim/t5-<block>` |

T1 and T4 do not depend on anything. T2 precedes T3 (mobile display rows
for dead stats go when the engine keys go). Do not merge T2 and T3 into
one PR; the cross-package checklist is easier to reason about per
package.

Each PR: verify gate for the touched package(s) green locally before
push, the AGENTS.md cross-package checklist run (`verify -w
axiomancer-mobile` and `type-check -w axiomancer-card-editor` on any
`src/Combat|Cards|Effects|Enemy|NPCs|World|index.ts` change),
`npm run baseline:check` re-stamped when mechanics source changes, the
PR template filled from the diff, and the telemetry shard committed with
the tick.

## 2. Standing frame

1. **The spec is the list.** Cut what it says to cut. If a file it names
   turns out to have a consumer the audit missed, keep the file, note it
   in the PR body under Callouts, and add a row to `plan/AUDIT.md` so the
   spec gets corrected. Never widen a cut because something nearby looks
   dead; file it instead.
2. **Guards (spec §6) are absolute.** Test-pinned docs, build inputs for
   `site:public`, tooling inputs, and anything a skill greps by path.
   Grep before every delete: `grep -rn "<basename>" --include=*.{ts,tsx,mjs,js,md,yml,json} .`
   excluding `node_modules`. Zero hits outside `plan/`, `devlog/`,
   `telemetry/` and the file itself is the bar.
3. **Archive is `plan/archive/`, delete is delete.** D6 draws the line:
   images, raw sim output, vendored third-party scans and committed e2e
   output are deleted; markdown moves to `plan/archive/` with a
   HISTORICAL banner and its inbound pointers repointed in the same
   commit. Never rewrite git history.
4. **Comment pointers count.** `src/` provenance comments that name a
   moved or deleted doc are updated in the same commit; lint will not
   catch them.
5. **Labyrinth is excluded from every count** (D5). Do not delete
   `plan/labyrinth/acts`, `plan/labyrinth/DESIGN.md`,
   `RESEARCH-maze-book.md`, `tools/`, `src/World/Labyrinth`,
   `CLI/labyrinth.cli.ts`, `app/labyrinth`, or `assets/images/labyrinth`.
   `plan/labyrinth/reference/maze-images/` and `maze-book/` are still
   deleted (Tier 2, licensing); `ROADMAP.md` and `CLAUDE-DESIGN-PROMPT.md`
   are archived.
6. **Tier 0 items are fixes, not cuts.** Each gets a hermetic test that
   fails before and passes after, per the mechanics `AGENTS.md` test
   rules. The consumable and enchant items (Tier 0 items 2 and 3) are
   "remove from shops and enemy kits" until the stat hooks exist; do not
   invent a new effect to make them work.
7. **Never skip, disable or quarantine a test to get green.** A deleted
   module's tests go with it; a surviving module's failing test is a
   real finding.
8. **Hard rules stay hard.** Root `AGENTS.md` hard rules and `plan/
   bearings.md` locked sections; the lexicon guard (`check-lexicon`)
   runs pre-commit and will reject retired terms in live files.
9. **Attribution.** Commit bodies are plain (AGENTS.md standing rule 2):
   no trailers, no emojis. The guard hook enforces it.

## 3. Verification recipe per step

```bash
# root
npm run verify
npm run baseline:check                      # cite the stamp in the PR body
# mechanics (T2, and any src/ touch)
npm run verify -w axiomancer-mechanics
npm run verify -w axiomancer-mobile         # cross-package checklist
npm run type-check -w axiomancer-card-editor
# mobile (T3)
npm run verify -w axiomancer-mobile
npm run verify:visual -w axiomancer-mobile  # any screen change
# public site still builds (T1, T4 — devlog/ and docs/ moves)
npm run site:public
```

## 4. Definition of done for this prompt

- T1 through T4 merged, each with a green verify gate and the PR template
  filled from the diff.
- The strategy decisions file's "Open follow-ups" updated: audit step
  marked executed, remaining §5 items either answered (with a D-number)
  or still listed as open.
- `plan/2026-09-25-trim-the-fat.spec.md` §2 totals corrected to what was
  actually removed, and any audit misses filed to `plan/AUDIT.md`.
- `plan/bearings.md` repo-shape section refreshed to the post-trim tree
  (Tier 2 row for bearings).
- A one-paragraph `plan/CONTENT_LEDGER.md` pass-log entry is NOT
  written; the ledger is being compacted by T4 and this work is not
  content.

## 5. What this prompt does not do

- No map re-authoring (strategy step 2, D2). No stat hooks or damage
  scaling (strategy step 3, D4). No card content, enemy themes or
  narration (strategy step 4).
- No new skills, agents, or commands. §5.7 decides the command set;
  until then the eight commands stay.
- No `/consolidate` invocation; T4 is the ruling `/consolidate` deferred
  to `/oversight`, executed by hand, and the next scheduled consolidate
  pass (~2026-10-02) will find less to do.
