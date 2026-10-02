# Phase R10c3 — Comments and docs truth pass (3/3: mobile)

## Sources

- Part plan: [`plan/revamp/doctrine.md`](../revamp/doctrine.md) § R10c, all
  four items, for `axiomancer-mobile`.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D67** (the doctrine phases), **D66** (git is the archive),
  **D58** (nothing is authored).
- Canonical siblings: Phase R10c (`6f9a74aa`), which rewrote or deleted the
  bannered mechanics docs; Phase R10c2 (`22f4e41f`), which stripped history
  from mechanics comments and added `scripts/check-comments.mjs`.

## Reality check (2026-10-02, `main` at `a54b6f6e`)

`scripts/check-comments.mjs` run over every `.ts`/`.tsx` file in
`axiomancer-mobile` (592 files, `node_modules` excluded) flags 960 comment
lines across 277 files: 690 phase numbers, 142 spec numbers, 89 decision
numbers, 39 retired lexicon terms, 11 overhaul names. `state/presenters`
carries 255, `state/e2e` 129, `components/combat` 101, `state/actions.ts` 66,
`components/event` 59. About 167 more comment lines say "retired" or "legacy".

Two mobile docs carry a Superseded banner or an R10c pragma:
`docs/engine-integration-architecture.md` (code on `state.combat`,
`selectStance`, `resolveCombatRound`, none of which exist) and
`docs/early-combat-ux.md` (the stance triangle, deleted). `docs/combat.md`
opens with a paragraph of history and does not link `docs/game-model.md`.

## Outcome

A mobile code comment says what the code does, and the mobile docs describe
the app as it stands. The comment guard covers both packages, so the root
`npm test` fails if history comes back anywhere.

## Scope

1. **Bannered docs.** Delete `docs/engine-integration-architecture.md` and
   `docs/early-combat-ux.md`; fix inbound links (`docs/README.md`).
2. **Strip history from mobile comments** (all `.ts`/`.tsx`, tests included),
   the R10c2 rules: a comment that only records history is deleted; one that
   states a rule keeps the rule and loses the story; "retired"/"legacy"
   narration goes too, except where code really handles an old save shape.
3. **Rules live in a live doc.** Mobile states no rule of play of its own.
   `docs/combat.md` loses its history lede and links `docs/game-model.md`
   for the rules and `axiomancer-mechanics/docs/combat.md` for the engine.
4. **Guard:** `GUARDED_DIRS` gains `axiomancer-mobile`; the walker also skips
   the gitignored build outputs (`.expo`, `dist`, `web-build`). The live-scan
   test then covers both packages.

## Not in scope

- Strings, test titles, identifiers, file names: only comments.
- Dated records: ADRs, `docs/reports/**`, `playtest-report-*.md`,
  `design/**`. They are records, like the mechanics devlog.
- No code, rule, card, keyword or number changes.

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing in the app is removed.

## Decisions made upfront — DO NOT ASK

- **Delete both bannered docs, rewrite neither.** `docs/presenters.md` and
  ADR-0001 already state the presenter boundary; `docs/combat.md` states the
  screen's data flow. The stance UX doc describes a deleted system.
- **Guard the whole package** rather than a list of folders, so a new folder
  is covered without editing the guard.
- **Fan the sweep out by directory** to parallel agents; each edits only
  comments and runs the guard on its files.
- **Prove code is unchanged** the R10c2 way: every touched file prints the
  same with comments removed (TypeScript printer), at HEAD and after.

## Verify

`npm run verify --workspace axiomancer-mobile`, root `npm test`,
`npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Follow-ups

- RC (attended) is next: every Requires is then ticked.
