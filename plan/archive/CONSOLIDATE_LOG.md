# Consolidate pass log

> Append-only. One line per `/consolidate` pass:
> `bearings <N>→<M> lines, CRITIQUE <N>→<M>, lessons <N>→<M>;
> <K> rows archived, <J> merged; terminology sweep <result>.`

- 2026-08-02: bearings 356→356 lines, CRITIQUE 976→976, lessons
  48→48; 0 rows archived, 0 merged; terminology sweep clean (0
  lexicon rows added, 0 files banked/flagged). First pass — the
  project onboarded 2026-07-03, so nothing in CRITIQUE `## Done`
  is yet older than the 60-day archive threshold, and no
  ≥3-pass recurring duplicate was found. Drained reflexes.md #1
  ("verify gate foreground, never `--no-verify`") to the Drain
  log — now hard-blocked by `.claude/hooks/guard.mjs`'s
  `no-verify`/`force-push`/`backgroundedGate` checks, not just a
  reminder (reflexes.md 30→34 lines). Left reflex #2 (atomic
  commit+push) in place — its Stop-hook enforcement only warns
  post-hoc, so the proactive reminder still pulls weight.
- 2026-09-02: bearings 752→752 lines, CRITIQUE 1801→1796, lessons
  64→64; 0 rows archived, 1 merged; terminology sweep clean (0
  lexicon rows added, 0 files banked/flagged). Collapsed the two
  `## Done` "Playwright MCP tools unavailable to sub-agents" rows
  (pass 1-4 and pass 5-11, 11 passes total on the same defect)
  into one row with a `- history:` line, per the skill's own
  worked example. Still nothing in `## Done` past the 60-day
  archive threshold — oldest RESOLVED date is 2026-07-10 (54
  days). Left `## Pending`'s many inline `[x] ... RESOLVED`
  rows untouched per hard rule 3 (Pending is untouchable) even
  though `skills/critique.md`/`iterate.md` document a Pending→Done
  move on fix — that reorganization is a documentation-vs-practice
  question for `/oversight`, not a consolidate-pass call. bearings.md
  read in full: no safe merge/prune/tighten found this pass — the
  file's growth (356→752 lines since the last pass) is almost
  entirely new dated entries under "Decisions standing for the
  autonomous loop" (THE LONGER LEASH, THE OPEN GATE, etc.), which is
  locked/immutable-in-meaning content, not compactable prose.
  reflexes.md/lessons.md unchanged — both under cap, no dupes, no
  weekly-cadence promotion candidates observed. Terminology sweep:
  `check-lexicon.mjs` clean; skimmed the ~120 `.md` files touched
  since the last pass for "ten-preset campaign" / anti-modern-word
  claims posing as current law — all live hits are already-dated
  devlog entries or specs already carrying a SUPERSEDED/HISTORICAL
  banner; the one doc that did pose as current law
  (`axiomancer-mechanics/docs/playtest.md`) was already fixed this
  week (commit dfa03ebb, tracked in `plan/AUDIT.md`).
- 2026-09-23: bearings 880→880 lines, CRITIQUE 3002→2908, lessons
  64→64 (reflexes 34→34); 4 rows archived (Done rows resolved
  2026-07-10..07-17 → `plan/archive/CRITIQUE_2026.md`, new file), 0
  merged; terminology sweep clean (check-lexicon 244 files / 21
  terms). No lesson duplicates; no reflex drained — reflex 1's stop
  check in `.claude/hooks/guard.mjs` is warning-only unless
  `NEXUS_STRICT_STOP=1`, so it is not a hard enforcement. Stale facts
  found in bearings' locked `URL / API / CLI contract` and repo-shape
  blocks (route list, CLI subcommands, agent roster) were left for a
  separate docs-consistency commit rather than edited under curation.
