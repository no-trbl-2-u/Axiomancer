# Phase R10c — Comments and docs truth pass (1/3: mechanics docs)

## Sources

- Part plan: [`plan/revamp/doctrine.md`](../revamp/doctrine.md) § R10c, items 1
  and 3, for `axiomancer-mechanics`.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D67** (the doctrine phases), **D66** (git is the archive for
  markdown too), **D58** (nothing is authored), **D65** (the Color Law and
  colour match stay; stances go).
- Canonical sibling: Phase R10b (`2a79e596`), which wrote
  `docs/game-model.md`, the live statement of every rule of play.

## The split (2026-10-02)

The row says "two ticks (mechanics, then mobile)". Measured on `main` at
`77a78934`, the mechanics half alone is two ticks of work:

- **Docs:** ten stale mechanics docs, about 3,400 lines, carry a Superseded
  banner or R10b2's "R10c rewrites this doc" pragma.
- **Comments:** about 460 comment lines in mechanics `src/` and `scripts/`
  cite a phase, about 330 a spec number, about 250 a decision number, plus
  "retired", "legacy" and "THE BIG NUMBERS" narration.

So R10c becomes three rows, each one tick:

- **R10c** (this brief): mechanics docs, items 1 and 3.
- **R10c2**: mechanics comments and the comment guard, items 2 and 4.
- **R10c3**: mobile docs and comments; the guard extends to mobile.

RC requires all three.

## Reality check (2026-10-02, `main` at `77a78934`)

- `docs/game-model.md` (R10b) already states every rule of play the part
  plan names (the Color Law, colour match, the tray roll, FREE/PAID, S3
  scaling, VITAE, Conviction, befriend) with the constant it reads. Item 3
  is met at the doc level; this phase points the mechanics docs at it
  instead of restating rules.
- Bannered or pragma'd mechanics docs: `README.md`, `docs/api.md`,
  `combat.md`, `enemy.md`, `effects.md`, `quickstart.md`,
  `card-frame-legend.md`, `character.md`, `keyword-atlas.md`, `cli.md`,
  `equipment.md` ("Superseded history"), `docs/adr/ADR-0001` (status
  Superseded). `docs/effects/`, `quickstart-world.md` and `oaths.md` are
  already gone.
- Code reads two of them: `src/CLI/e2e/cli.docs-examples.engine.test.ts`
  parses `docs/cli.md`'s `--enemy` and `--hazard` examples, and
  `scripts/content-drift.mjs` and `scripts/axio-mcp-server.mjs` parse
  `docs/keyword-atlas.md`'s tables (`## group` headings, `| keyword | … |`
  rows). Both docs are rewritten in their parsed shape, not deleted.

## Outcome

No mechanics doc describes a deleted system as current. Each one either
describes the code as it stands, or is gone and its inbound links point at
a live doc. No mechanics doc carries a Superseded banner or an R10c pragma.

## Scope

1. **Rewrite** to the current code, short, pointing at `docs/game-model.md`
   for rules rather than restating them:
   - `README.md`: what the package is, the `src/` layout, the scripts, where
     to read next.
   - `docs/combat.md`: the combat engine as code: the state, the turn loop
     and the functions that drive it, the enemy deck, the ending.
   - `docs/quickstart.md`: run the CLI, run the tests, where things live.
   - `docs/cli.md`: the commands `package.json` exposes and their flags,
     examples that name live enemies and hazards (the docs test pins them).
   - `docs/keyword-atlas.md`: the live keyword and system-term tables in
     the parsed shape; history sections (Added, Retired, Known drift) cut.
   - `docs/equipment.md`: the worn-slot model as the code has it, if the
     code still has it; the history banner cut.
2. **Delete**, fixing every inbound link: `docs/api.md` (`src/index.ts` is
   the API), `docs/enemy.md`, `docs/effects.md`, `docs/character.md` and
   `docs/card-frame-legend.md` (all covered by `docs/game-model.md`), and
   `docs/adr/ADR-0001` (a superseded decision; git keeps it), with the ADR
   index updated.
3. **Pragmas:** the R10c `lexicon-ok` pragma comes off every mechanics doc
   rewritten here. A rewritten doc that still names a deleted thing to say
   it is gone keeps a pragma with that justification.

## Not in scope

- Code comments (R10c2) and the comment guard (R10c2).
- Mobile docs, including `early-combat-ux.md`'s pragma (R10c3).
- Mechanics docs with no banner or pragma (`game.md`, `world.md`,
  `testing.md`, the hazard docs, …). Any that teach a deleted system are
  noted under Follow-ups, not rewritten here.
- Dated plan files and devlog entries that link to a deleted doc: they are
  records, left as they are.
- No rule, card, keyword or number changes.

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing in the engine is removed.

## Decisions made upfront — DO NOT ASK

- **Delete over rewrite** where `docs/game-model.md` already says it:
  the reset rule is delete, don't park, and two docs stating one rule
  drift apart. A doc survives only when code reads it or it covers what
  the game model does not (the engine's code layout, the CLI).
- **`docs/api.md` is deleted, not regenerated.** A hand-kept export list
  rots; `src/index.ts` is the list, and the public-barrel test pins it.
- **Rules are linked, not restated.** Rewritten docs name the function or
  constant and link the game model for what it means.
- **Three rows, not two.** The split follows the measured size; the
  ceiling is a per-tick budget (bearings, Operational notes).

## Verify

`npm run verify --workspace axiomancer-mechanics` (the CLI docs test),
root `npm test` (content-drift, lexicon and prose tests),
`npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Follow-ups

- R10c2: mechanics comments; the comment guard in the root `npm test`.
- R10c3: mobile docs and comments; the guard covers mobile.
