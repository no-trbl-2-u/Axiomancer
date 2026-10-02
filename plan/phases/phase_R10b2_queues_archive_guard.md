# Phase R10b2 — Doctrine rewrite (2/2: queues, archive and guard)

## Sources

- Part plan: [`plan/revamp/doctrine.md`](../revamp/doctrine.md) § R10b, items 5-7.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D66** (the archive leaves the tree, tagged
  `archive-pre-revamp`), **D67** (the doctrine phases; the lexicon guard),
  **D58** (nothing is authored), **D65** (the Color Law and colour match
  stay; stances go).
- Canonical sibling: Phase R10b (`2a79e596`), which rewrote the doctrine
  files this phase's guard now protects.

## Reality check (2026-10-02, `main` at `f3b5ff8a`)

- `plan/archive/` is 9.8 MB, 553 files. No `archive-pre-revamp` tag exists.
- About 90 live files name a path under `plan/archive/`: doctrine (AGENTS.md,
  CLAUDE.md, `docs/truth-sources.md`, bearings, `plan/README.md`, the specs
  README), loop verbs (`skills/consolidate.md` rotates CRITIQUE and its own
  log *into* `plan/archive/`; `digest.md`, `oversight.md`, `ship-a-phase.md`
  §8), the revamp plans, scripts and workflow headers, and some 40 code
  comments in both packages.
- `.claude/hooks/telemetry.mjs` and its test name `plan/archive/` as a path
  the hook classifies. `.claude/**` is attended (R0); the test is a pure path
  fixture and needs no directory on disk.
- Plan queues: about 25 Pending rows across `PHASE_CANDIDATES.md`,
  `CRITIQUE.md` and `AUDIT.md` mention presets, stances, pricing, themes or
  other deleted subjects. Some are moot, some only mention the word.
- `scripts/check-lexicon.mjs` already enforces
  `axiomancer-mechanics/docs/lexicon.json` over live `*.md` (plan/ is zoned
  except bearings, so the decisions log is already outside it). The registry
  has 21 rows; twelve of them point at replacements (CHARGE, CONDEMN, PLEA,
  RELENT, OATH, HEX, …) the revamp itself deleted.

## Outcome

No live file points into `plan/archive/`, and the directory is gone from
`main`; its contents are one `git show archive-pre-revamp:plan/archive/...`
away. The live queues carry no row about a deleted subject. The lexicon lint
fails a live doc that names a retired concept as current.

## Scope

1. **Plan queues.** Walk the Pending sections of `PHASE_CANDIDATES.md`
   (Pending, Parked until RC, Considered), `CRITIQUE.md` and `AUDIT.md`. A
   row whose subject the revamp deleted moves to the file's Done/Rejected
   section with a one-line "moot (R10b2): <reason>". A row that only
   mentions a retired word in passing stays; its wording is left alone.
2. **The archive (D66).** Tag the current commit `archive-pre-revamp`
   (annotated), push the tag, `git rm -r plan/archive/`. Fix every live
   pointer:
   - Doctrine and verbs are rewritten: AGENTS.md states the rule (history is
     read through the tag, only when T asks); CLAUDE.md's baseline note,
     truth-sources, bearings, `plan/README.md`, the specs README,
     `skills/consolidate.md` (rotation becomes deletion; git is the record),
     `digest.md`, `oversight.md`, `ship-a-phase.md` §8 and
     `plan/revamp/README.md` §5 rule 1 (markdown is deleted too).
   - Every other path reference (code comments, script and workflow headers,
     dated plan files, catalog JSON) is rewritten mechanically to
     `archive-pre-revamp:plan/archive/...`, which is exactly the `git show`
     argument.
3. **Lexicon guard (D67).** New `lexicon.json` rows for the retired
   subjects: preset decks, the stance check / punish-yield / RPS, card
   pricing and power budget, deck and card themes, the swap pool, the
   primary-colour-plus-borrows deck, and the deleted keyword and alt-win
   names. The twelve stale replacement strings are corrected to "deleted in
   the revamp". Files that name a retired thing to say it is gone carry a
   justified pragma. Superseded-bannered docs that R10c rewrites carry a
   pragma naming R10c, so R10c deletes it with the rewrite. Tests for the
   new rows in `check-lexicon.test.mjs`.

## Not in scope

- `.claude/**` (attended, R0): the telemetry hook's `plan/archive/`
  classification and its test fixture stay; noted in the commit body.
- Rewriting the Superseded-bannered docs and code comments (R10c).
- Bare "stance" or "preset" as words: too broad for the guard while R10c's
  docs are unrewritten; the rows target the retired concepts' phrasings.
- No rule, card, keyword or number changes.

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing in the engine is removed.

## Decisions made upfront — DO NOT ASK

- **Pointer rewrite form.** Non-doctrine references become
  `archive-pre-revamp:plan/archive/<path>`, the literal `git show` operand,
  rather than being deleted: several comments cite a design source the code
  still mirrors, and R10c strips history narration from comments anyway.
- **Consolidate stops rotating into a directory.** D66 removes
  `plan/archive/`; a verb that writes into it would recreate it. Rotated
  rows are deleted and the consolidation commit is the record.
- **The tag is the current `main` commit**, the last one with
  `plan/archive/` in the tree.
- **Guard rows are phrase-shaped, not word-shaped.** "stance" and "preset"
  appear in narrative craft docs and live dev tooling (fixture presets);
  the rows match the retired concepts.

## Verify

Root `npm test` (includes `check-lexicon.test.mjs`, `check-prose.test.mjs`),
`npm run lint:content`, `node scripts/check-lexicon.mjs`,
`npm run verify` (both packages: comments change in each).

## Follow-ups

- R10c: the bannered docs and comments; remove the R10c pragmas as each doc
  is rewritten.
