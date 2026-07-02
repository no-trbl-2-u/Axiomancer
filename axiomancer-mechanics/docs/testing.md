# Testing Standard — Hermetic E2E by Default

> **Audience:** humans and AI agents writing or modifying code in this repo.
>
> **Rule of thumb:** every implementation lands with at least one hermetic
> end-to-end test that exercises the change through the highest-level public
> entry point that touches it. If you can't write one, you must explain why in
> the PR description (and ideally fix the architecture so you can).

---

## What "hermetic" means here

A test is **hermetic** if and only if all three of these hold:

1. **Self-contained.** No disk I/O (use `nullAdapter`), no network, no TTY,
   no subprocess. The test must run in plain `vitest` with no environment
   setup beyond `npm install`.
2. **Deterministic.** No reliance on wall-clock time, real `Math.random`,
   process IDs, or environment variables. Stub via `mockAlternatingRng` /
   `mockFixedRng` / `mockSequentialRng` from `src/test-utils/rng.ts` — these
   spy on `Math.random` **and** install a `Math.random`-backed `Rng` into the
   `getRng()` singleton (Spec 11), so every production callsite, including
   `randomInt` and the resist pipeline, becomes deterministic.
3. **Isolated.** No shared mutable state across tests. `afterEach` restores
   any `vi.spyOn` mocks. Fixtures are deep-cloned by the code under test,
   not by the test.

If a test reads files, opens sockets, depends on the system clock, or fails
intermittently when run in a different order, it is not hermetic. Fix it.

## What "e2e" means here

A test is **end-to-end** if it drives the change through the highest-level
public entry point of its module — *not* through a private helper. The test
asserts on observable state (`CombatState`, `GameState`, return values), not
on intermediate function calls.

Examples of e2e entry points by module:

| Module           | Hermetic e2e entry point                                                             |
| ---------------- | ------------------------------------------------------------------------------------- |
| `Combat`         | `resolveCombatRound` (in `Combat/combat.resolver.ts`) + the `createGameStore` lifecycle |
| `Effects`        | `applyEffect` / `applyTier1CombatEffect` / `tickAllEffects` driving an effect to expiry; Phase 88 coverage sweep: `stat-band-effects.engine.test.ts`, `advantage-effects.engine.test.ts`, `control-effects.engine.test.ts`, `damage-variants.engine.test.ts` |
| `Enemy`          | `createEnemy` + AI / strategy assertions in `enemy.engine.test.ts`; per-enemy content pins in `alignment.engine.test.ts` (Phase 45), `befriendability-config.engine.test.ts` (Phase 68), `aftermath-lines.engine.test.ts` (Phase 71) |
| `Game`           | `createGameStore(nullAdapter, …)` driven through `startCombat` / `updateCombat` / `endCombat`; run-loop semantics in `run-loop.engine.test.ts` (Phase 72); codex unlocks in `codex.engine.test.ts` (Phase 73) |
| `World`          | World reducer chained through map → node → continent transitions                      |
| `Items`          | Item reducer chained through `addItem` → `useConsumable` → `removeItem`               |
| `Character`      | `createCharacter` → `deriveStats` → `calculateMaxHealth` round-trip                   |
| `Skills`         | `executeSkill` driving a SkillLookup against the live `skillLibrary`; `learnSkill` / `getAvailableSkills` for the Phase 30 runtime path; `fallacy-skills.engine.test.ts` (Phase 88), `phase83-skill-coverage.engine.test.ts` (Phase 83) |
| `NPCs`           | `getDialogueNode` + `visibleChoices` walking a `DialogueTree`; `applyDialogueChoice` through the Game store |
| `CLI`            | `parseArgv`, `logState`, `setStateLogPath`, `prompt` (script mode) in `src/CLI/e2e/io.engine.test.ts` — covers the Phase 20 scripted surface |

Unit tests for individual helpers are still welcome, but they do not satisfy
the hermetic-e2e requirement on their own.

## What CANNOT be tested hermetically (today)

- **The interactive demo CLI in its TTY-driven path** (`src/CLI/game.cli.ts`
  run via `npm run game`). It owns display logic and uses `inquirer`
  prompts; that path is not in the hermetic suite — the engine modules it
  dispatches into are, and that is the durable contract. The Phase 20
  `--script` / `--stdin` flags drive the same code path through the
  scripted CLI primitives in `src/CLI/io.ts`, which **are** covered
  hermetically by `src/CLI/e2e/io.engine.test.ts`.
- Tests that require **real Date / wall-clock time** or **real network /
  filesystem** — they fall outside the hermetic contract by definition.
  Use a `nullAdapter`, fake clock, or extract the dependency.

If your change touches the CLI layer, the hermetic e2e test must target the
underlying engine function (e.g. `resolveCombatRound`) and the CLI must
delegate to that function. Inline math in a CLI file is a code-smell that
blocks hermetic testing — extract it.

### Adjacent layer — agent-graded e2e (Phase 26)

The repo also ships an **explicitly non-hermetic** layer for end-to-end
walkthroughs: `automation/agent-e2e.mjs` drives the CLI through a scripted
JSON sequence (`automation/scripts/walkthroughs/<name>.json`) and hands
the resulting state log to an LLM grader against a per-walkthrough
goal file. It calls the Anthropic API; the vitest suite does not. Treat
it as a smoke-grade integration test, not a unit-of-correctness test —
the canonical correctness signal stays in `src/**/e2e/*.engine.test.ts`.
See `automation/scripts/walkthroughs/README.md` for the inventory and
how to add a new walkthrough. The Phase 64 `endgame-loadout`
walkthrough is the canonical example of a *demonstration-grade*
script — it exercises multi-phase interactions (Tier 3 skill content,
equipped-skill rotation, enemy alignment AI bias, enemy-skill caster
path, boss combat resolution) without requiring a kill-completion
outcome.

**Phase 81 catalog expansion (2026-05-24).** Three new walkthroughs
ship for Phase 65 / 80 / 68 coverage: `fishing-village-exploration`
(Apprentice Harbor District traversal → MournfulGull encounter at
fv-15, Phase 60 befriendable placement), `tier2-skill-chain`
(Wanderer casts Tier 2 `eternal-regress` two-effect compound under
the **Phase 80 always-land contract**; closes one of Phase 78's MED
zero-coverage primitives at the player-experience tier), and
`coastal-tyrant-befriend` (Sage attempts the Phase 68
`BefriendabilityConfig` AND-composition; grades on
predicate-attempt visibility per the brief D3). The Phase 66 synergy
walkthrough originally scoped for Phase 81 pivoted per brief D2 (the
5 synergy skills aren't in any preset's `knownSkills`).

**Phase 120 (2026-06-05).** Ships the deferred Phase 66 synergy
walkthrough: `synergy-skills-chain`. Wanderer preset extended to
include all 5 Phase 66 synergy skills; walkthrough exercises
`resonance-burst` synergy firing by first casting `eternal-regress`
(applies `debuff_confusion`) then casting `resonance-burst` (synergizes
with the confusion debuff). Closes the Phase 81 Unit 2 deferred
coverage.

### Deploy gate — `npm run deploy:check`

After `npm run verify` is green, `npm run deploy:check` runs four
structural assertions before `npm pack --dry-run`: `dist/` exists,
`dist/<Module>/types.d.ts` count matches `src/<Module>/types.ts`
count, the latest git tag matches the top tagged CHANGELOG heading,
and the public-surface snapshot matches the committed fixture. See
[`scripts/README.md`](../scripts/README.md) for the full tools table
+ the public-surface contract workflow.

### Continuous integration — `.github/workflows/verify.yml` (Phase 56)

The CI gate at [`.github/workflows/verify.yml`](../.github/workflows/verify.yml)
fires on every `pull_request` against `main` and every `push` to `main`.
Pipeline steps:

1. Checkout with `fetch-depth: 0` (full history; `deploy:check` runs
   `git describe --tags --abbrev=0` for the tag/CHANGELOG assertion).
2. Setup Node 22 + `npm ci` with the setup-node cache.
3. `npm run verify` (`type-check` + tests + `build`).
4. `npm run deploy:check` (the four structural assertions above).

Concurrency group `verify-${{ github.ref }}` with
`cancel-in-progress: true` — force-pushes on the same branch / PR
don't pile up redundant runs.

**No publish step by design.** Per `RELEASING.md`, `npm publish` is
manual + attended (2FA prompt fires during the publish). The CI
workflow validates publishability via `npm pack --dry-run`; the
actual publish is a user-triggered ceremony, not a CI step.

The autonomous-beast loop (`.github/workflows/march.yml`) runs verify
before every commit it makes, so today's CI gate's primary audience is
human-PR / one-off branch contributors who need a remote red/green
signal before merge. Closes the PR-level gap critique-13 /
expand-pass-13 flagged for the published npm package.

### Agent-friendly report — `npm run verify:agent` (Phase 39)

`npm run verify:agent` runs the same gates as `npm run verify`
(`type-check`, `lint`, the hermetic vitest suite, `build`) but swaps the
default Vitest reporter for `automation/agent-vitest-reporter.mjs`
(see [`automation/README.md`](../automation/README.md) for the
directory's full tools table). Two artefacts land at the end of the
run:

- **`automation/last-verify-report.json`** — structured rollup
  (`{ total, passed, failed, skipped, reason, unhandledErrors,
  slowest5, slowestFailures, diff, callouts }`) plus a top-level
  `failures: [{file, name, message, diff?, actual?, expected?, location}]`
  flat list (Phase 40 + iterate critique-16 schema-symmetry extension),
  per-file entries (`path`, `status`, `durationMs`), and per-test
  entries (`name`, `status`, `durationMs`, optional
  `location: "<file>:<line>:<col>"` for the `it()` block — sourced
  via Vitest's experimental `experimental_getRunnerTask` API; requires
  `includeTaskLocation: true` in `vitest.config.ts`, which is set —
  and optional `failure: { message, diff, actual, expected, location }`
  for the assertion site). The file is gitignored — it's a fresh
  snapshot every run.
- **Delimited markdown block on stdout** — between literal
  `## Verify summary` and `## End summary` lines. Lists totals, failed
  tests as `file:line:col — <name>: <message>`, the slowest five
  passing tests, and (when any are present) a `### Slowest 5
  (failed / skipped)` block so timed-out / hanging tests stay visible.
  Agents can extract reliably with the regex
  `/## Verify summary\n([\s\S]*?)\n## End summary/`.

Use this script when an LLM agent (or a human eyeballing the terminal)
needs to answer "what was tested, how long it took, and what failed"
without scraping Vitest's default reporter. The default
`npm run verify` is unchanged so the deploy gate's expectations stay
stable.

### Run-to-run diff (Phase 40)

`rollup.diff` carries a comparison against the prior
`last-verify-report.json` on disk:

```jsonc
{
  "addedTests":    string[],                       // keys "<file>::<name>" not in prior
  "removedTests":  string[],                       // keys in prior not in current
  "flippedToFail": [{file, name, prevStatus, currStatus}],
  "flippedToPass": [{file, name, prevStatus, currStatus}],
  "durationDeltaSlowest5": [{file, name, prevMs, currMs, deltaMs}]
}
```

`diff` is `null` on a fresh repo (no prior file) or when the prior
file fails schema validation. Shape mismatches emit a one-line
warning to stderr prefixed `[agent-vitest-reporter]` so the
markdown stdout block stays agent-pluckable.

When the diff has content, the markdown block gains a
`### Changes since last run` subsection with five nested `####`
blocks matching the diff arrays (`#### Added tests`,
`#### Removed tests`, `#### Flipped to fail`, `#### Flipped to
pass`, `#### Largest duration deltas`).

### Call-outs (`rollup.callouts: string[]`)

Pre-computed notable patterns from the run so an LLM consumer reading
the JSON doesn't have to derive them from rollup totals and diff
arrays. Each entry is a one-line string. Heuristics that fire:

- `N tests failed (top file: <path>)` — when `rollup.failed > 0`,
  names the file with the most failures.
- `N unhandled errors` — when `rollup.unhandledErrors > 0`.
- `N tests skipped` — when `rollup.skipped > 0`.
- `N tests exceeded 50ms` — count of per-test `durationMs` above the
  threshold.
- Diff-aware (only when `rollup.diff !== null`):
  - `N tests added since last report`.
  - `N tests removed since last report`.
  - `N tests flipped pass → fail`.
  - `N tests flipped fail → pass`.

`callouts` is `[]` when nothing is notable; the markdown block omits
the `### Call-outs` section entirely in that case.

Schema details and design decisions live in
[`plan/phases/phase_39_agent_verify_report.md`](../plan/phases/phase_39_agent_verify_report.md)
and
[`plan/phases/phase_40_prior_run_diff.md`](../plan/phases/phase_40_prior_run_diff.md).

---

## File and naming conventions

- **Location:** `src/<Module>/e2e/<feature>.engine.test.ts` for hermetic
  full-flow tests. The `.engine.test.ts` suffix is a fixed marker meaning
  "hermetic e2e suite" — the SUT is whatever public entry point the test
  drives. The engine code itself lives next to the module as
  `<feature>.resolver.ts` (composite orchestrators returning
  `{ state, events }`) or `<feature>.reducer.ts` (single state-shape edits),
  not under `e2e/`.
- **Pure unit tests** stay alongside the source: `src/<Module>/<file>.test.ts`.
- **Fixtures / mocks** live in `*.mock.ts` files, e.g.
  `src/Character/characters.mock.ts`. They must be plain data — no `Math.random`,
  no environment reads.
- **Test utilities** live in [`src/test-utils/`](../src/test-utils/) and are
  excluded from the published build via `tsconfig.json`.

## Required test categories per implementation

For every non-trivial implementation, the e2e file should cover at minimum:

1. **Happy path** — the typical success scenario, end-to-end.
2. **Boundary / win conditions** — every terminal state the change can reach
   (e.g. `combat.resolver.engine.test.ts` covers all three: `friendship`, `player`, `ko`).
3. **Invariants** — properties that must hold throughout (HP ≥ 0, round
   counter monotonic, fixtures unmutated).
4. **Lifecycle integration** — at least one test that drives the change
   through the `createGameStore` lifecycle with `nullAdapter`, asserting no
   disk access (`vi.spyOn(nullAdapter, 'save')`).

## Canonical example

[`src/Combat/e2e/combat.resolver.engine.test.ts`](../src/Combat/e2e/combat.resolver.engine.test.ts)
is the reference implementation. Read it before writing a new e2e test —
its top-of-file comment, its alternating-RNG helper, its three win-condition
suites, and its store-lifecycle suite together demonstrate every property
above. Copy the structure.

---

## Copy-pasteable scaffold

```ts
/**
 * Hermetic E2E Tests — <Module / Feature>
 *
 * Hermetic = self-contained + deterministic + isolated.
 * See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import { mockAlternatingRng } from '../../test-utils/rng';
import { Player } from '../../Character/characters.mock';
// import the public entry point under test

afterEach(() => {
    vi.restoreAllMocks();
});

describe('<feature>: happy path', () => {
    it('drives the change through the public entry point', () => {
        mockAlternatingRng();
        // ...arrange, act, assert on observable state...
    });
});

describe('<feature>: invariants', () => {
    it('preserves <invariant> across N steps', () => {
        // ...
    });
});
```

## PR self-check

Before opening a PR, confirm:

- [ ] At least one new (or modified) test under `src/<Module>/e2e/` covers
      the change.
- [ ] The new test runs green via `npm test` — no flakes when run twice.
- [ ] Every randomness source is stubbed (`mockAlternatingRng`,
      `mockFixedRng`, etc.) — no raw `Math.random` in the test.
- [ ] No file I/O, network, or subprocess in the test path.
- [ ] `vi.restoreAllMocks()` (or equivalent) runs in `afterEach`.
- [ ] If the change is CLI-only, the underlying engine logic was extracted
      and tested hermetically through its module's `e2e/*.engine.test.ts`.
- [ ] `npm run type-check`, `npm run type-check:tests`, and `npm test` are
      clean. (Test files are excluded from the build tsconfig, so
      `type-check:tests` is the only thing keeping fixtures honest.)

If you cannot satisfy this list, write a one-paragraph "Hermetic-test debt"
note in the PR description explaining why and what would unblock it.

## Minigame Harness — Cross-Minigame Balance Testing (Phase 148)

The **minigame harness** provides unified balance testing across all three
minigames (Hazard, Gathering, Quest Board) in a single invocation. It
orchestrates A/B testing, playstyle divergence measurement, and pass/fail
evaluation for use as a standard verification gate in balance phases.

```ts
import { runMinigameHarness } from 'axiomancer-mechanics';

const report = runMinigameHarness({
  minigames: ['hazard', 'gathering', 'quest-board'],
  runs: 300,
  seed: 'balance-test-seed',
  abTestVariants: {
    gathering: [configA, configB], // Optional A/B testing
  },
});

// Check overall balance health
if (!report.passFail.overall) {
  console.log('Balance issues detected:', report.recommendations);
}
```

**Key features:**
- **Deterministic execution** via seed parameter for reproducible results
- **Individual and unified reporting** with per-minigame pass/fail bands
- **Optional A/B testing** for comparing configuration variants
- **Aggregated recommendations** from all minigame balance analyzers

The harness is tested hermetically at `src/World/e2e/minigame-harness.engine.test.ts`
and designed for integration into automated balance verification workflows.

## The hermeticity guard

`src/test-utils/e2e/hermeticity.audit.test.ts` enforces the contract above
mechanically: every test imports from vitest, no `.only` lands, spies are
restored, engine code never calls `Math.random()` directly, and only an
explicit allowlist of tests may touch disk / network / subprocesses (the
node persistence adapter, the CLI harnesses, the Tuning artifact writers).
The guard itself reads committed repo sources — a sanctioned exception, the
same carve-out the public-surface snapshot uses. If you legitimately need a
new IO-touching test, grow the allowlist in the same commit and say why.
