# Phase 79 — Doctrine lexicon: register the 2026-09-02 status-primacy retirement

> Promoted 2026-09-15 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 8.0). Brief generated 2026-09-15 by `/ship-a-phase` §9 (tooling
> phase — the page-family brief sections don't apply; adapted per
> Phase 66's precedent, the same lexicon-doctrine shape one generation
> earlier).

## Outcome

`axiomancer-mechanics/docs/lexicon.json` gains two `type: "doctrine"`
rows registering the 2026-09-02 THE BIG NUMBERS REWRITE's repeal of the
status-primacy design law ("status effects are the main fun", "low
status-effect engagement is a balance failure" / the engagement-floor
enforcement claim). The two live surfaces the new rows flag —
`axiomancer-mechanics/docs/tuning.md` and
`axiomancer-mobile/components/combat/statusGlyphs.ts` — are reconciled
in the same commit, so `node scripts/check-lexicon.mjs` is clean with
the new rows armed.

## Why

Phase 66 (2026-08-27) built the doctrine-row mechanism and shipped
three rows, including `status-primacy-doctrine` and
`win-rate-objective-doctrine`. Six days later, commit `82ac7bb4` (THE
BIG NUMBERS REWRITE, 2026-09-02) repealed the design law those rows
guarded *and deleted the rows themselves* along with it — the doctrine
mechanism went back to zero `type: "doctrine"` rows the same commit
that gave it a second retirement to track. Two live, non-HISTORICAL,
non-zoned surfaces were left asserting the retired law as current:
`statusGlyphs.ts`'s header comment ("the doctrine: status effects are
the main fun") and `tuning.md`'s "Status-First Doctrine" section
(itself already carrying an informal `> **HISTORICAL:**` banner that
doesn't match `check-lexicon.mjs`'s exact `**Status:** HISTORICAL`
string, so it wasn't actually exempt). `/iterate` independently found
and fixed a third sibling instance (combat coach copy) the same week —
the identical "find it by hand" tax the mechanism exists to eliminate.

## Surface (no routes — this is a lint registry + doc/comment fix)

| File | Change |
|---|---|
| `axiomancer-mechanics/docs/lexicon.json` | 2 new `type: "doctrine"` rows: `status-primacy-doctrine`, `status-engagement-floor-doctrine` |
| `axiomancer-mechanics/docs/tuning.md` | banner corrected to the exact `**Status:** HISTORICAL` string the lint recognizes, so the whole file (an AS-BUILT record of an already-deleted module) is properly exempt |
| `axiomancer-mobile/components/combat/statusGlyphs.ts` | header comment rewritten off the retired doctrine claim (manual fix — `.ts` files are outside `check-lexicon.mjs`'s scan scope per Phase 66's own follow-up note; Phase 70's prose lint, not this one, would cover `.ts` copy) |

## Decisions made upfront — DO NOT ASK

- **Reuse the `status-primacy-doctrine` id.** The old row (same id) was
  deleted outright by `82ac7bb4`; nothing references it as a dangling
  pointer, so re-registering under the same id is clearer than minting
  a `-v2` suffix. Its pattern and replacement are updated for the fact
  that CQI is no longer the named successor (repealed in the same
  2026-09-02 commit) — the replacement now points at `CLAUDE.md`'s
  "Load-bearing doctrine" section and "no governing objective function
  any more" instead.
- **Two rows, not one.** `status-primacy-doctrine` catches the "status
  effects are the main fun/engagement mechanism" claim;
  `status-engagement-floor-doctrine` catches the separate "engagement
  floor is enforced" / "(enforces doctrine)" claim. Mirrors Phase 66's
  choice to split status-primacy from win-rate-objective — related but
  separable assertions.
- **`tuning.md` gets a banner fix, not a rewrite.** The candidate row
  offered two options (correct banner, or excise the dead section).
  The banner fix is smaller, preserves the document's genuine
  historical value (an accurate AS-BUILT description of a real, now-
  deleted module), and is the same fix Phase 66 already established
  for this exact "informally historical but wrong banner string"
  failure mode.
- **`statusGlyphs.ts` is a manual fix with no lint backstop.**
  `check-lexicon.mjs`'s `mdFiles()` walk only yields `.md` files; a
  doctrine row cannot make it re-scan `.ts` sources. This is a known,
  already-documented boundary (Phase 66 follow-ups), not new scope to
  close here.
- **Swept for further live hits; none found.** Checked `spec.md` (both
  copies), `VISION.md`, `AGENTS.md` (both copies), `docs/combat.md`,
  `CLAUDE.md` (mechanics), `plan/bearings.md` for `"main fun"` /
  `"engagement mechanism"` / `"engagement floor"` / `"(enforces
  doctrine)"` / `"balance failure"` framing asserted as current. The
  two `CLAUDE.md`/`VISION.md` mentions of "no status-engagement floor"
  are retirement-describing (word order doesn't match the assertion
  pattern) and correctly read as clean.

## Verify gate

`node scripts/check-lexicon.mjs` (clean against the live tree) and
`node --test scripts/check-lexicon.test.mjs` (existing 11-case suite,
unchanged pass), plus `npm run verify` at the repo root.

## DoD

- [ ] Two `type: "doctrine"` rows land in `lexicon.json`.
- [ ] `tuning.md`'s banner matches `**Status:** HISTORICAL` exactly.
- [ ] `statusGlyphs.ts`'s header comment no longer asserts the retired
      doctrine.
- [ ] `node scripts/check-lexicon.mjs` exits 0.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- Extending doctrine-row coverage to `.ts` surfaces remains Phase 70's
  prose-lint territory, not this phase's.
- No further live doctrine-assertion surfaces were found in this
  sweep; if a future retirement repeats this pattern, register it the
  same tick the design law changes, not a generation later.
