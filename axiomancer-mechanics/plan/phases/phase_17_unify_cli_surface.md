# Phase 17 — Unify CLI surface

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

The package's CLI surface collapses to a single entry point: `npm run game`,
which drives `src/CLI/game.cli.ts` — the full game-loop tab UI that
already exists. The redundant CLIs (`src/CLI/combat.cli.ts`,
`src/CLI/character.cli.ts`) and the Python automation (`automation/combat-test.py`,
`automation/README.md`) are deleted. Docs and source comments that
reference them are cleaned up. `npm run verify` and `npm run deploy:check`
remain green.

## Source spec

No dedicated `specs/17-*.md` file — this is a developer-ergonomics
cleanup tracked in `plan/steps/01_build_plan.md`:

> Phase 17 — Unify CLI surface (drop `combat` + `character` + `auto:combat` scripts; single `npm run game` entry)

Resolved questions:

1. **Why drop the python harness?**
   `automation/combat-test.py` exists solely to automate `npm run combat`;
   when `combat` goes, the harness has nothing to drive. Hermetic e2e
   coverage (`src/**/*.engine.test.ts`) is the durable answer. Dropping
   it removes a Python dependency the library doesn't otherwise need.
2. **What about `automation/spec05_smoke.ts`?**
   Untouched. It's an independent walkthrough script, not coupled to
   `combat.cli.ts`. A future phase can decide whether to keep it; out
   of scope here.
3. **What about `automation/scripts/*.json` replay fixtures?**
   Untouched. They're consumed by `dumpEffectState` debug output
   (`COMBAT_DEBUG=1`), not by the dropped CLI.
4. **What about the inquirer / ts-node devDeps?**
   Keep both. `src/CLI/game.cli.ts` is the surviving CLI and still uses
   `inquirer` + `ts-node`. Drop `commander` and `@types/commander` only
   if no surviving file imports them (verify by grep).
5. **README and docs updates?**
   Yes — drop the `npm run combat` / `npm run character` /
   `npm run combat:auto` rows from the README scripts tables and add a
   `npm run game` row. Walk through `docs/` and update every
   `combat.cli.ts` / `character.cli.ts` / `npm run combat` reference to
   point at `game.cli.ts` / `npm run game` instead, OR to the
   appropriate engine module (e.g. `src/Combat/effect-modifiers.ts`)
   when the doc was using the CLI path as a "where in the code" hint
   that the engine module covers better.
6. **What about the `npm run dev` and `npm run start` stub scripts?**
   Leave them. They're harmless echo stubs that point users at the
   README — not in this phase's scope.
7. **Source-comment references to the dropped CLIs?**
   Fix them. `src/Enemy/enemy.library.ts` and
   `src/Combat/e2e/combat.resolver.test.ts` mention `combat.cli.ts` /
   `auto:combat` in docstrings; rewrite to reference `game.cli.ts`.

## Implementation units (commit per unit)

### Unit 1 — Add `game` script; drop dropped scripts; trim devDeps

File: `package.json`

```diff
   "scripts": {
     "build": "tsc && tsc-alias",
-    "character": "ts-node src/CLI/character.cli.ts",
     "check": "npm run lint && npm run type-check",
     "clean": "rm -rf dist",
-    "auto:combat": "python3 automation/combat-test.py",
-    "combat": "ts-node src/CLI/combat.cli.ts",
+    "game": "ts-node src/CLI/game.cli.ts",
     "dev": "echo Please use check 'package.json' or README.md for available commands...\n ",
```

Verify by grep that `commander` / `@types/commander` have no surviving
consumers in `src/`; if zero, drop them from `devDependencies`. Run
`npm install` to refresh the lockfile if anything changes.

Commit: `chore(scripts): unify CLI to npm run game; drop combat/character/auto:combat`

### Unit 2 — Delete the dropped CLI files

```bash
git rm src/CLI/combat.cli.ts src/CLI/character.cli.ts
```

If `combat.cli.ts` is imported anywhere outside `src/CLI/` (it isn't —
grep already confirmed it), reroute. Otherwise the delete is clean.

Run `npm run type-check && npm test` — both must stay green. The
hermetic e2e suite exercises the resolver directly; nothing depends on
the dropped CLI files.

Commit: `chore(cli): drop combat.cli.ts and character.cli.ts (covered by game.cli.ts)`

### Unit 3 — Delete the Python automation

```bash
git rm automation/combat-test.py automation/README.md
```

Leave `automation/spec05_smoke.ts` and `automation/scripts/` /
`automation/testing-logs/` in place. The directory survives with the
unrelated walkthrough script + replay fixtures.

Commit: `chore(automation): drop combat-test.py (driven by removed npm run combat)`

### Unit 4 — Update README scripts table

File: `README.md`

Find the scripts table (lines ~80–129 referenced in the audit). Replace
the three rows for `npm run combat`, `npm run character`,
`npm run combat:auto` with a single row:

```
| `npm run game`     | Interactive demo CLI — tabbed map / combat / journal / skills / inventory loop. |
```

If a "Python harness" section follows, drop it.

Commit: `docs(readme): unify CLI documentation around npm run game`

### Unit 5 — Walk through `docs/` and update references

Files (from the audit grep):

- `docs/enemy.md` — three `npm run combat` lines. Replace each with the
  closest `npm run game` equivalent: `npm run game` (with a note in
  prose that the player can pick an enemy via the Combat tab), or
  delete the lines if they were demo-only and `game.cli.ts` already
  covers them.
- `docs/effects.md` — four `combat.cli.ts` references. Rewrite each to
  point at the actual engine module the doc is describing
  (`src/Combat/stats.ts` for `getEffectiveStats`, `src/Combat/dice.ts`
  for roll modifiers, `src/Combat/health.ts` for damage application —
  use grep to confirm the right module per reference).
- `docs/testing.md` — drop the bullet about `combat.cli.ts /
  character.cli.ts` and the `pexpect`-based harness; reword to say the
  one surviving CLI (`game.cli.ts`) is exercised end-to-end through
  hermetic e2e.
- `docs/skills.md` — two references; update the first
  (`COMBAT_ENEMY=sandbag npm run combat`) to point at the engine-test
  alternative (`npm test src/Skills/e2e/skill-resource-system.engine.test.ts`)
  and drop the second (auto-tester invocation).
- `docs/effects/buffs/*.md` — three buff docs each mention
  `combat.cli.ts` in a "where this is invoked" line. Replace with the
  matching engine-module path (likely
  `src/Combat/combat.resolver.ts`'s scenario phase or
  `src/Combat/effect-modifiers.ts`).
- `docs/effects/buffs/tier1_body_attack.md:142` — has `Run: npm run
  combat`. Replace with `npm run game`.

Commit: `docs: scrub combat.cli.ts / npm run combat references after Phase 17`

### Unit 6 — Update source-comment references

- `src/Enemy/enemy.library.ts:319, 371, 372` — three comments mention
  `auto:combat` / `combat.cli.ts`. Rewrite to reference `game.cli.ts`.
- `src/Combat/e2e/combat.resolver.test.ts:23` — comment mentions
  `combat.cli.ts / character.cli.ts`; rewrite to `game.cli.ts`.

Run `npm run type-check && npm test` (comments don't affect type-check
but keep the discipline).

Commit: `docs(comments): scrub references to removed CLI files in source`

### Unit 7 — Verify gate + DoD

```bash
npm run verify        # type-check + lint + test + build
npm run deploy:check  # npm pack --dry-run
```

Tick Phase 17 in `plan/steps/01_build_plan.md` with the final commit hash.

Commit: `plan: phase 17 shipped — CLI surface unified to npm run game`

## Decisions made upfront — DO NOT ASK

- **Single CLI: `npm run game`.** No separate `combat` / `character`
  entry points survive.
- **Python harness goes.** Hermetic e2e is the durable test path.
- **`automation/spec05_smoke.ts` stays.** Independent script, out of
  scope.
- **devDeps:** drop `commander` + `@types/commander` only if no
  surviving consumer; keep `inquirer` + `ts-node` (game.cli.ts uses
  them).
- **No new tests in this phase.** Engine coverage is unaffected.
- **`README.md` Tools/Scripts tables are the user-facing source of
  truth.** Update them in Unit 4; don't introduce a separate CLI
  reference doc.

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Commit body template (summary if units coalesce)

```
chore(cli): phase 17 — unify CLI surface around npm run game

- Drop npm run combat / character / auto:combat scripts
- Delete src/CLI/combat.cli.ts and src/CLI/character.cli.ts
- Delete automation/combat-test.py + automation/README.md
- Scrub README / docs / source comments for stale CLI references
- Single CLI: npm run game → src/CLI/game.cli.ts

Decisions:
- Hermetic e2e (src/**/*.engine.test.ts) replaces the role the Python
  pexpect harness used to play.

Closes #<phase-issue if captured>
```

## Definition of Done

- [ ] `package.json` has `npm run game`; `combat` / `character` / `auto:combat` are gone
- [ ] `src/CLI/combat.cli.ts` and `src/CLI/character.cli.ts` are deleted
- [ ] `automation/combat-test.py` and `automation/README.md` are deleted
- [ ] `commander` + `@types/commander` are dropped from devDeps if unused
- [ ] No `grep -r "npm run combat\|npm run character\|npm run auto:combat"` hits in `README.md`, `docs/`, or `src/`
- [ ] No `grep -r "combat\.cli\|character\.cli\|combat-test\.py"` hits in `README.md`, `docs/`, or `src/`
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] `plan/steps/01_build_plan.md` Phase 17 row flipped to `[x]` with hash

## Follow-ups (out of scope)

- `automation/spec05_smoke.ts` cleanup or absorption into a hermetic
  test — track as a Z-LOW candidate.
- README rewrite to surface `npm run game` as the primary user
  on-ramp — leave as-is once tables are updated; bigger doc pass.
