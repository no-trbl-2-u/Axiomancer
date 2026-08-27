# Phase 66 — Lexicon lint: catch retired-doctrine prose, not just retired identifiers

> Promoted 2026-08-20 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 7.5). Brief generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

`scripts/check-lexicon.mjs` gains a second row shape — `type:
"doctrine"` — that matches retired *design-law sentences* across line
breaks, not just retired identifiers on a single line. Three doctrine
rows ship with it (the STRIKE-IS-DEAD ban, the status-primacy claim,
the win-rate/`statusEngagement`-as-objective claim), and every live
surface they flag is reconciled or pragma-exempted in the same commit,
so `npm run verify` is green with the new rows armed.

## Why

Three independent incidents in one week (MCP server 2026-08-08/12, the
dedicated reconciliation pass `9caf2a26` 2026-08-13, Phase 55 itself
2026-08-14) all had the same shape: a law voided in the engine, prose
left asserting it as current, no mechanism to catch the mismatch. The
repo already owns the mechanism for retired *identifiers*; it has zero
rows for doctrine phrases, because a multi-clause claim wrapped across
two markdown lines cannot match a line-by-line identifier regex.

## Surface (no routes — this is tooling + docs)

| File | Change |
|---|---|
| `axiomancer-mechanics/docs/lexicon.json` | `type` field (`identifier` default, `doctrine` new); 3 doctrine rows; `__comment` documents both shapes |
| `scripts/check-lexicon.mjs` | doctrine rows match whitespace-normalized whole-file text with an offset→line map; findings keep `file:line:` format |
| `scripts/__tests__/check-lexicon.test.*` or inline self-check | regression: a doctrine phrase split across a line break is caught; an identifier row still matches line-wise; pragma still exempts |
| Reconciled prose | `axiomancer-mechanics/CLAUDE.md`, `axiomancer-mechanics/docs/combat.md`, `.claude/commands/combat-playtest.md`, root `spec.md` |
| Pragma-exempted | `axiomancer-mechanics/docs/LEXICON.md`, `axiomancer-mechanics/spec.md` (both describe the retirement; that is the pragma's designed use) |

## The three doctrine rows

1. **`strike-ban-doctrine`** — "THE STRIKE IS/stays DEAD", "no card
   deals raw/direct damage", "status effects are the only path".
   Replacement: `VISION.md` §Combat vision — direct damage is LEGAL
   (THE UNSHACKLING, 2026-08-08); HP stays the sole win condition;
   `basePower`/`chipHp` stay deleted at the schema level.
2. **`status-primacy-doctrine`** — "status effects are the MAIN fun",
   "treat low status-effect engagement as a balance failure".
   Replacement: `VISION.md` §Combat vision — status remains a major
   authored tool; no one path is doctrine-mandated as dominant.
3. **`win-rate-objective-doctrine`** — "`statusEngagement` is the
   objective function", "read the numbers against the locked doctrine
   curve". Replacement: spec 35 / Phase 43's CQI framing — `cqi` is
   the objective function; win rate is deliberately not a term.

## Decisions made upfront — DO NOT ASK

- **Doctrine rows are assertion-scoped, not mention-scoped.** A file
  that names the retired law in order to call it retired must NOT be a
  finding — otherwise every reconciliation the lint asks for creates a
  new finding. Patterns therefore match the claim form only, and
  legitimate removal-mentions keep using the existing
  `<!-- lexicon-ok: <id> -->` pragma.
- **Matching strategy: whitespace-normalized whole-file scan** for
  doctrine rows (runs of whitespace collapse to one space; an index map
  recovers the original line). Chosen over auto-relaxing spaces inside
  the authored regex source, which breaks on character classes and
  quantifiers. Identifier rows keep the existing line-by-line path
  unchanged — no behaviour change for the 22 shipped rows.
- **`skills/digest.md` §3b is left alone, and is not flagged.** The
  build-plan row asks for exactly this. Verified 2026-08-27: §3b was
  already reconciled by the `9caf2a26` pass and now names the ten-preset
  curve only to call it "historical after the Profane Canon" — an
  assertion-scoped row correctly reads that as clean. No deferral
  mechanism is built; there is nothing to defer. The `against the
  locked doctrine curve` alternative stays in row 3 so a reversion to
  the old sentence is caught.
- **`axiomancer-mechanics/docs/profane-canon.md` needs no edit.** The
  AUDIT row that named it is stale: §1 already reads "Direct damage is
  LEGAL (THE UNSHACKLING...)". Drain the row rather than re-fix the
  file.
- **Scope creep is accepted where the lint forces it.** The new rows
  flag four live surfaces beyond the two the build-plan row names
  (`docs/combat.md` x2, `.claude/commands/combat-playtest.md`, root
  `spec.md`). Fixing what your own new registry rows catch is the
  standing contract for every rename phase since 44a; these are fixed
  here, scoped to the asserting sentences.
- **No `severity`/`warn` field.** Every row is hard. A row that cannot
  be hard yet does not belong in the registry yet.

## Empty / error states

- `--list` prints the row `type` alongside the pattern.
- A doctrine row whose pattern is invalid fails the lint loudly at
  registry-parse time (existing `new RegExp` behaviour, unchanged).

## Tests

| Case | Assert |
|---|---|
| doctrine phrase on one line | flagged with correct `file:line` |
| doctrine phrase split across a line break | flagged (the case a line-wise regex misses) |
| doctrine phrase in a `**Status:** HISTORICAL` file | clean |
| doctrine phrase with `<!-- lexicon-ok: <id> -->` | clean |
| identifier row behaviour | unchanged from before |
| the live tree | `node scripts/check-lexicon.mjs` exits 0 |

## Verify gate

`npm run verify` at the repo root (typecheck → test → data:validate →
build → e2e), plus `node scripts/check-lexicon.mjs` directly.

## DoD

- [ ] `type: "doctrine"` shape lands in `lexicon.json` with 3 rows.
- [ ] `check-lexicon.mjs` matches doctrine rows across line breaks.
- [ ] Regression test covers the cross-line case.
- [ ] Every newly flagged live surface reconciled or pragma-exempted.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- Drain the two `plan/AUDIT.md` rows this phase closes (`CLAUDE.md`
  status-primacy; `profane-canon.md` stale) and the
  `/combat-playtest`-names-`statusEngagement` row.
- Extending the doctrine rows to non-`.md` surfaces (`.ts` copy) is
  Phase 70's prose lint, not this one.
