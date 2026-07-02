# Skill: bump-engine

> **Semi-autonomous.** Bump `axiomancer-mechanics`, install, read the
> matching `docs/engine-upgrade-*` guide, and make every change the
> guide demands — then prove it with the verification block. The
> standing invariant: **encounters are engine-owned; mobile only
> presents.** Never let a bump push rules into the app.

## 1. Purpose

The engine (`axiomancer-mechanics`) ships releases on its own cadence.
Each release lands with a mobile-facing upgrade guide at
`docs/engine-upgrade-<from>-to-<to>.md` (the engine team authors it;
it is the contract for what mobile must change). This skill is the
mobile catch-up: take the bump from "published on npm" to "consumed,
adapted, verified, and shipped" in one pass.

It is the operational form of one hard rule: **mechanics owns the
rules, mobile owns the UI.** Every release that adds or changes an
encounter procedure (combat, hazard, gathering, rest, loot-cache,
quest board, …) is consumed by *presenting new engine state and
routing player choices to engine functions* — never by re-simulating
the rules locally.

## 2. Invocation

```
/bump-engine                 # bump to the latest published version
/bump-engine 0.22.0          # bump to an explicit version
/bump-engine 0.22.0 dry-run  # plan only: report the guide's deltas, touch no code
```

Argument handling:
- **No argument** → resolve the latest published version
  (`npm view axiomancer-mechanics version`) and target it.
- **`<version>`** → target that exact version.
- **`<version> dry-run`** → read the guide, enumerate the required
  changes and their current state in the repo, write the plan to the
  run log, and stop before editing.

## 3. Autonomy contract

- **Decide and ship.** Drain type drift, wire new event kinds, add
  presenter/test coverage, delete superseded local rule files — all
  without asking. Document each call in the commit body.
- **Ask only on a genuine fork** (`AskUserQuestion`): a change that
  alters game balance, a guide instruction that conflicts with the
  no-local-rules invariant, or a "Mobile action" that the engine does
  not actually expose an API for. Include enough context to answer
  without scrolling.
- **Never invent rules.** If the guide says present an engine outcome
  and you cannot find the engine field, that is a blocker to surface —
  not a cue to compute it locally.

## 4. The no-local-rules invariant (the audit that runs every bump)

This is the load-bearing rule. Before declaring the bump done, the
repo must still satisfy it:

1. **All encounter adjudication comes from `axiomancer-mechanics`.**
   Damage, dice, rewards, outcome tiers, loot, healing, trap fates,
   board-space verbs, rest watches — the engine decides; mobile reads
   the result.
2. **Mobile's only encounter responsibilities are host glue:**
   threading engine sessions through the store slice, supplying
   entropy for a seed (`Date.now() ^ Math.random()` → 32-bit seed is
   fine — that is *providing* RNG, not *simulating* rules), applying
   engine-provided outcome fields to `GameState`, affordability/legal
   display mirrored from engine state, item-ref ↔ real-item mapping at
   claim, and presentation.
3. **No local rule data.** No card libraries, tuning tables, loot
   tables, or balance constants defined in mobile — import them from
   the package root. (Deep imports are unsupported; only `.` and
   `./node` are.)
4. **When a release moves a procedure into the engine, delete the
   superseded local files.** Precedent: the 0.17.x hazard cutover
   deleted `state/hazard/{engine,types,content,tuning,rng,sim,deck-flags}.ts`,
   leaving only `store-actions.ts` host glue. Apply the same cut for
   any procedure a new release claims.

Audit sweep (run it; it is fast):

```bash
# Leftover local rule engines (should match nothing but presenters/host glue):
find state -name 'engine.ts' -o -name 'sim.ts' -o -name 'rng.ts' \
  -o -name 'tuning.ts' -o -name 'content.ts' | grep -vE 'presenters|exploration-maps'

# Local rule DATA defined in mobile (should be empty):
grep -rnE '^(export )?const [A-Z_]+ ?(:|=).*(TUNING|_DECK|_LIBRARY|LOOT_TABLE|_TABLE)' \
  --include=*.ts state/ components/ | grep -v __tests__

# Math.random outside seed-entropy / dev tools / shuffles — inspect each hit
# to confirm it is presentation, not outcome simulation:
grep -rnE 'Math\.random' --include=*.ts --include=*.tsx app state components hooks lib \
  | grep -v __tests__
```

Any hit that computes an encounter *outcome* (reward amount, rarity,
success/failure, damage) locally is a violation. Fix it by routing to
the engine, or — if the engine exposes no API for it — surface it via
`AskUserQuestion` rather than leaving the local sim in place.

> Reference precedent (combat spoils, closed): combat victory spoils
> used to be computed locally in mobile (`grantVictorySpoilsAction` —
> flat shillings + a rarity-rolled hazard card). They are now
> engine-owned: `endCombat()`'s `CombatEndReport` carries the rolled
> `loot` + granted `xpGained`, which mechanics' END_COMBAT reducer
> applies to the player; mobile only surfaces the report on the
> victory panel. Treat this as the template when a future release
> moves any remaining host-side outcome math into the engine: consume
> the engine's report/outcome, delete the local formula, present.

## 5. Procedure

### Step 0 — Sync & resolve target

```bash
git fetch origin
git pull --ff-only
CUR=$(node -p "require('./package.json').dependencies['axiomancer-mechanics']")
LATEST=$(npm view axiomancer-mechanics version)   # or use the explicit arg
echo "current range: $CUR   target: $LATEST"
```

If the target equals the already-installed version (check
`package-lock.json`), there is nothing to bump — report and stop.

### Step 1 — Locate the upgrade guide

The guide is the contract. Find the one whose `-to-<target>` matches:

```bash
ls docs/engine-upgrade-*-to-*.md | sort
```

- Read `docs/engine-upgrade-<from>-to-<target>.md` **end to end**
  before touching code. Its "Release contents mobile must account
  for" + per-item **Mobile action** bullets are your worklist; its
  "Required verification" block is your gate; its "Out of scope" list
  is your fence.
- **If no guide matches the target:** do not guess from the npm
  changelog. The guide is authored by the engine team and may lag the
  publish. Spawn `scout` to check whether it is published elsewhere,
  and if it genuinely does not exist, surface that with
  `AskUserQuestion` — bumping blind risks a silent contract break.

### Step 2 — Bump & install

```bash
# Match existing pinning discipline (caret range, unless the guide
# asks for an exact pin). Editing package.json then installing keeps
# the lockfile honest.
npm install axiomancer-mechanics@<target>
```

Confirm `package.json` range and `package-lock.json` resolved version
both moved. `npm install` with no further args reconciles the rest of
the tree.

### Step 3 — Work the guide's Mobile-action list

For each release item, do exactly what its **Mobile action** bullets
say, under the §4 invariant:

- **New `MapEventKind` / payload** → extend the discriminated-union
  handling in `state/actions.ts`, `state/presenters/event.engine.ts`,
  `state/presenters/event-assets.ts`, and
  `state/exploration-maps/event-pools.ts`. Fix exhaustive switches by
  **rendering the new kind**, never by falling through to
  generic/unknown.
- **New encounter procedure** → add the store slice + `store-actions.ts`
  host glue (import the `engine*` functions; thread the session; apply
  the outcome payload), a presenter (`state/presenters/<kind>.engine.ts`),
  the screen (`app/<kind>/`), and focused tests. Model it on the
  existing rest/cache/quest glue — those are the reference shape.
- **Changed payload field** (e.g. a new `healFraction`) → drain type
  drift, update fixtures/mocks/presenter expectations, apply the new
  field through the engine payload (never recompute it).
- **New verbs / surfaced state** → give each engine affordance a
  distinct, labelled UI; mirror engine legality (disabled = engine
  says illegal, with clear text — not a local rule check).

Run the §4 audit sweep here and resolve any violation it surfaces.

Delegate freely: `scout` for anything needing the engine source or
external context; domain specialists for prose/asset work. Main
agent's job is the wiring and the decisions.

### Step 4 — Verify (the guide's block is the floor)

Run the guide's "Required verification" verbatim, plus the repo gate:

```bash
npm run typecheck
npm test -- --runInBand <the guide's focused encounter specs>
npm run verify            # lint + typecheck + full jest
npm run verify:visual     # Metro export + screenshot diff
```

Visual-smoke notes:
- If Playwright reports a missing browser, install it once:
  `npx playwright install chromium-headless-shell`, then re-run.
- A clean Metro export + **zero console errors** with only pixel
  diffs is an environmental browser-rendering delta, **not** a
  regression. Preserve the diff evidence. **Do not** run
  `baseline:approve` merely to make the gate green — re-baseline only
  for an intended visual change.

When the app can run, also do one dev-menu smoke path (SELF → dev menu
→ trigger the new/changed encounters) and record pass/fail.

### Step 5 — Commit, push, PR

```bash
git add package.json package-lock.json <every touched source/test/doc>
git commit -m "feat: mechanics <target> mobile catch-up"
git push -u origin <current-branch>
```

Commit-body content (this is the durable record):
- the version delta and the guide consulted,
- each Mobile-action item and how it was handled (or why a no-op),
- the §4 audit result (clean / what was fixed),
- the verification outcomes (typecheck, tests, verify, visual — note
  preserved diffs), and any decision taken instead of asking.

Then open a PR **ready for review** and enable auto-merge with the
repo default method (per `CLAUDE.md`):

```
mcp__github__create_pull_request   # ready, not draft
mcp__github__enable_pr_auto_merge  # surface to the user if the repo disallows it
```

### Step 6 — Done

Report: version moved, guide items handled, audit clean, gates green,
PR URL. Return.

## 6. Failure modes

1. **No matching upgrade guide for the target.** `scout` for it; if
   absent, `AskUserQuestion` — do not bump blind.
2. **A "Mobile action" needs an engine API that does not exist.**
   Surface it; do not fill the gap with a local sim.
3. **`npm run verify` fails on the same root cause 3×.** Stop, report
   the failure and the suspected contract mismatch.
4. **Visual smoke diffs with clean export + zero console errors.**
   Not a failure — preserve evidence, do not re-baseline to go green.
5. **A guide instruction conflicts with the §4 invariant.** The
   invariant wins; surface the conflict.
6. **`git pull` divergence.** Resolve before bumping.

## 7. Hard rules

1. **Mechanics owns the rules. Mobile presents.** No bump may push
   encounter adjudication into the app.
2. **The guide is the contract.** Work its list; respect its
   "Out of scope."
3. **Verify gate must pass.** No `--no-verify`.
4. **Never re-baseline visual smoke just to go green.** Re-baseline
   only for an intended visual change.
5. **No emojis. No `Co-Authored-By:`.** Do not put the model
   identifier in any pushed artifact.
6. **Delete superseded local rule files** when a release claims the
   procedure — don't leave dead engines behind.
7. **PR ready for review + auto-merge enabled.**

## 8. Quick reference

```bash
# Resolve + bump
npm view axiomancer-mechanics version
npm install axiomancer-mechanics@<target>

# The contract
docs/engine-upgrade-<from>-to-<target>.md

# Account for the bump — primary wiring points
state/actions.ts                        # event-kind routing, outcome application
state/presenters/event.engine.ts        # event-kind → view model
state/presenters/event-assets.ts        # event-kind → art
state/exploration-maps/event-pools.ts   # node → pool authoring
state/<kind>/store-actions.ts           # per-encounter host glue (engine* imports)
state/presenters/<kind>.engine.ts       # per-encounter presenter
app/<kind>/                             # per-encounter screen

# No-local-rules audit
find state -name 'engine.ts' -o -name 'sim.ts' -o -name 'rng.ts' \
  -o -name 'tuning.ts' -o -name 'content.ts' | grep -vE 'presenters|exploration-maps'
grep -rnE 'const [A-Z_]+ ?(:|=).*(TUNING|_DECK|_LIBRARY|LOOT_TABLE|_TABLE)' \
  --include=*.ts state/ | grep -v __tests__

# Gates
npm run typecheck && npm run verify && npm run verify:visual
npx playwright install chromium-headless-shell   # if visual smoke wants a browser

# Ship
git commit -m "feat: mechanics <target> mobile catch-up"
git push -u origin <branch>
# → create_pull_request (ready) → enable_pr_auto_merge
```
