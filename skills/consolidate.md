# Skill: consolidate

> **The memory curator.** One tick a month: compact the loop's
> durable memory (`plan/bearings.md`, `plan/CRITIQUE.md`,
> `plan/lessons.md` + `plan/reflexes.md`) so the context tax of
> "read first" files stays flat while the project grows.
> Curation only — meaning is never changed, decisions are never
> re-litigated, and anything ambiguous stays put.

## 1. Purpose

Every skill's Step 0 reads `plan/bearings.md` and
`plan/reflexes.md`; `/iterate` drains `plan/CRITIQUE.md`;
`/expand` mines it. These files only ever grow — resolved
critique rows pile up, bearings prose gets superseded a
paragraph at a time, lessons duplicate each other in different
words. Unbounded growth is a tax on every future tick. This
verb is the garbage collector: it merges, prunes, and archives
**without changing what the memory says**.

## 2. Invocation

```
/consolidate                 # the full monthly pass
```

Runs from `.github/workflows/consolidate.yml` (monthly) or by
hand. Never dispatched by `/march` — like `/digest`, it is its
own loop shape with its own cadence.

## 3. The procedure

1. **Sync:** `git pull --ff-only`. Record the before-sizes:

   ```bash
   wc -l plan/bearings.md plan/CRITIQUE.md plan/lessons.md plan/reflexes.md
   ```

2. **CRITIQUE.md — archive the closed.** Rows in `## Done`
   older than 60 days move verbatim to
   `plan/archive/CRITIQUE_<YYYY>.md` (create on first use; one
   file per year, append-only). The `## Pending` section is
   never archived. Recurring findings (same defect observed
   across ≥3 passes, e.g. a `[needs-user-call]` that re-fires
   every pass) are collapsed to ONE row: keep the latest
   observation and the suggested fix, fold the prior
   occurrences into a single `- history:` line of pass numbers
   and commits. The metadata header (`> Last pass / Pass
   count`) is `/critique`'s — do not touch it.

3. **bearings.md — compact the prose, not the contract.**
   Three legal moves, applied section by section:

   - **Merge** — two passages saying the same thing in
     different words become one (keep the clearer phrasing).
   - **Prune** — passages describing things that no longer
     exist (check against the tree before deleting; a stale
     path reference is prunable, a decision record is not).
   - **Tighten** — narrative that has become common knowledge
     (already restated in `AGENTS.md` or a skill's contract)
     becomes a one-line pointer to the canonical home.

   Sections marked **locked** (`Stack`, `URL / API / CLI
   contract`) and `## Decisions standing for the autonomous
   loop` are load-bearing records: entries there may be
   *reformatted*, never merged away, weakened, or summarized
   into ambiguity. When in doubt, leave the passage alone —
   an over-long bearings file is a tax; a lossy one is a bug.

4. **lessons.md + reflexes.md — run the two-tier hygiene.**

   - Merge duplicate lessons within a domain (same behavioral
     change, different incidents → one entry citing both).
   - Propose promotions: a lesson that changed behavior on
     ~weekly cadence belongs in `reflexes.md` — but promotion
     grows the always-read core, so file it as a
     `plan/PHASE_CANDIDATES.md` candidate instead of applying
     it (same rail as `/digest` tuning proposals).
   - Flag drained reflexes: a reflex that has become an
     enforced rule (guard hook, CI job, deny wall) no longer
     needs to be read every tick — move it to the Drain log
     citing the enforcement point. `reflexes.md` stays ≤50
     lines; if it is over, draining is the pass's priority.

5. **Log the pass.** Append one line to
   `plan/archive/CONSOLIDATE_LOG.md`:

   ```
   - <YYYY-MM-DD>: bearings <N>→<M> lines, CRITIQUE <N>→<M>,
     lessons <N>→<M>; <K> rows archived, <J> merged. <one-line note>
   ```

6. **Gate + commit + push:** `npm run verify` foreground, then
   one commit `consolidate: <YYYY-MM-DD>` and push. Same
   single-invocation warning as `/digest` §3.6: never end the
   turn with the commit pending on a backgrounded command.

## 4. Hard rules

1. **Curation, never authorship.** This verb adds no new
   decisions, rules, findings, or opinions. Its entire output
   is the same memory, smaller.
2. **Locked sections and standing decisions are immutable in
   meaning.** Reformat yes; merge away, weaken, or summarize
   into ambiguity, no.
3. **Pending work is untouchable.** `## Pending` critique
   rows, open AUDIT rows, and `[ ]` build-plan rows are the
   dispatcher's queue, not clutter.
4. **Archive, don't delete.** Anything removed from a live
   file lands verbatim in `plan/archive/` — git history is not
   the only escape hatch.
5. **When in doubt, leave it.** A passage whose staleness you
   cannot verify against the tree stays put.
6. One commit; the standing rules (no `Co-Authored-By`, no
   emojis, foreground verify, atomic commit+push) apply.

## 5. Failure modes

1. **A compaction changes a sentence's meaning and you notice
   mid-pass** — revert that hunk; note it in the pass log.
2. **bearings.md references something you can't verify**
   (external service, user preference) — leave it; flag it as
   a question in the pass-log note for `/oversight`.
3. **Verify gate red on the consolidate commit** — only
   possible if archiving broke a path some check reads; fix
   the reference or revert the move. ≤3 iterations, then stop
   loud.
4. **`git pull` divergence** — stop.

## 6. Quick reference

```bash
plan/bearings.md                      # compact prose, never contracts
plan/CRITIQUE.md                      # archive Done >60d, collapse recurrences
plan/lessons.md · plan/reflexes.md    # merge dupes, propose promotions, drain enforced
plan/archive/                         # CRITIQUE_<year>.md · CONSOLIDATE_LOG.md
npm run verify
git commit -m "consolidate: <YYYY-MM-DD>" && git push origin main
```
