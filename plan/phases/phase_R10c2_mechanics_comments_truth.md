# Phase R10c2 — Comments and docs truth pass (2/3: mechanics comments)

## Sources

- Part plan: [`plan/revamp/doctrine.md`](../revamp/doctrine.md) § R10c, items 2
  and 4, for `axiomancer-mechanics`.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D67** (the doctrine phases), **D66** (git is the archive),
  **D58** (nothing is authored).
- Canonical sibling: Phase R10c (`6f9a74aa`), which rewrote the mechanics
  docs; Phase R10b2 (`29f3b174`), which extended `check-lexicon`.

## Reality check (2026-10-02, `main` at `f2c92ad8`)

Measured by the guard this phase adds, over every comment the TypeScript
parser finds in `axiomancer-mechanics/src` and `axiomancer-mechanics/scripts`:
1,170 lines across 260 files. 496 cite a phase, 332 a spec, 253 a decision
number, 54 the old overhaul names ("THE BIG NUMBERS", "dice-law"), and 36
name a retired term from `docs/lexicon.json`. The e2e suites carry about
half (`Combat/e2e` 117, `World/MapEvents` 94, `Game/e2e` 54). About 200 more
comment lines narrate "retired" or "legacy" without a number.

## Outcome

A mechanics code comment says what the code does. No comment cites a phase,
spec or decision number, and none names a retired term except to explain code
that handles the deleted thing. A guard in the root `npm test` keeps it so.

## Scope

1. **Strip history from mechanics comments** (`src/**`, `scripts/**`, tests
   included). A comment that only records history is deleted. A comment that
   states a rule keeps the rule and loses the story: "Spec 33 — each paid
   play takes the best-ranked card" becomes "Each paid play takes the
   best-ranked card". "retired" and "legacy" narration goes the same way,
   except where the code really does handle an old save shape (a migration
   names what it migrates).
2. **Guard:** `scripts/check-comments.mjs` reads every comment in the guarded
   trees with the TypeScript parser and fails on phase, spec and decision
   numbers, the overhaul names, and every identifier row of
   `docs/lexicon.json`. A line that must name a deleted thing (a migration
   dropping a removed keyword, a test pinning that it stays gone) carries
   `lexicon-ok` with the reason. `scripts/check-comments.test.mjs` pins it;
   both run in the root `npm test`, and the live scan is one of the tests.

## Not in scope

- Mobile comments and docs (R10c3, which adds `axiomancer-mobile` to
  `GUARDED_DIRS`).
- Strings, test names and identifiers: only comments. A `describe('Phase 12
  …')` title is test output, not doctrine.
- No code, rule, card, keyword or number changes.

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing in the engine is removed.

## Decisions made upfront — DO NOT ASK

- **The guard covers history numbers, not the words "retired" and "legacy".**
  Those words are legitimate in migration code and too common to lint; the
  sweep removes their narration by hand.
- **The TypeScript parser finds comments**, not a regex: a `//` in a URL
  string or template is not a comment, and a hand state machine misreads
  regex literals. `typescript` is already installed for both packages.
- **One guard script, separate from `check-lexicon`.** The lexicon guard
  scans markdown with zones and banners; comments have neither. The new
  guard reuses the lexicon registry so the retired-term list has one home.
- **Fan the sweep out by directory** to parallel agents; each edits only
  comments in its files and runs the guard on them.

## Verify

`npm run verify --workspace axiomancer-mechanics` (a comment edit must not
change code), root `npm test` (the guard), `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## Follow-ups

- R10c3: mobile docs and comments; the guard extends to mobile.
