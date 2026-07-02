# agents.md

> The entry point for any AI agent landing in this repo cold
> (Claude Code, Cursor, Aider, anything else). Read this top to
> bottom; it's short, and the rules at the top are non-negotiable.
>
> This file is the **nexus methodology rule book**. For project
> orientation (architecture, screen→presenter contract, hermetic
> e2e standard, asset swap rules), also read
> [`AGENTS.md`](./AGENTS.md) — kept for continuity with the
> pre-nexus workflow.

## Standing rules

These apply to every command, every skill, every session. They
are not optional. The skill files repeat them; this is the
canonical source.

### 1. Commit and push. Always. As a single atomic act.

Shipped work that isn't committed is rolled-back work waiting to
happen. Shipped work that's committed but not pushed is invisible
to the deploy pipeline and to future loop ticks. The autonomous
loop assumes `origin/main` is the source of truth.

Every shipping skill ends with `git commit` **immediately followed
by** `git push origin main`. Don't leave commits unpushed between
ticks. Don't leave the working tree dirty.

### 2. No `Co-Authored-By:` trailers. No emojis.

Plain commit message bodies. **Never** add a `Co-Authored-By:`
line, a "Generated with…" footer, or any emoji — in commits, in
code, in content, in design notes.

### 3. The verify gate is non-negotiable.

`npm run verify` runs **before** every commit:

```
lint → typecheck → test
```

Every check is a hard gate. **Hermetic Jest tests are part of
the gate** (presenter / engine e2e against `axiomancer-mechanics`
state — see [`docs/testing.md`](./docs/testing.md)). A red test
is a blocked push. Never `--no-verify`. Fix the root cause.

### 4. The deploy gate runs **after** every push.

`npm run deploy:check` polls EAS Build for the build matching the
just-pushed commit. Prints state transitions. Exits non-zero on
`errored` / timeout.

For now the deploy gate is a **stub** (exits `0` with a notice).
Wire-up to the EAS API is queued as a build-plan phase — until
then, push-to-deploy is not yet a thing for this project (Metro
dev server / EAS preview builds run on demand). The shipping
skills still call it as Step 12 so the contract stays uniform
when wiring lands.

### 5. No `--no-verify`. No force-push. No destructive resets.

If a hook fails, fix the underlying issue. If `git pull`
diverges, stop and report. Tests alongside code, never "add tests
later".

### 6. Hermetic E2E is the load-bearing test.

Every implementation must land with at least one **hermetic e2e
test** that drives the change through the highest-level public
entry point of its module (presenter `select<Screen>ViewModel`
or store lifecycle). **Hermetic** = self-contained (no network,
no real `AsyncStorage`, no real fonts, no real timers) +
deterministic (`Math.random` stubbed) + isolated
(`afterEach(() => jest.restoreAllMocks())`).

Canonical reference + standard: [`docs/testing.md`](./docs/testing.md).

### 7. Engine code lives in `axiomancer-mechanics` — never reimplemented here.

`app/` and `components/` are a **presentation layer** on top of
the `axiomancer-mechanics` npm engine. Rules, state shape, RNG,
reducers live there. The contract:

```
UI (app/(tabs)/*.tsx) → presenter (app/<screen>/*.engine.ts)
  → engine store (state/store.ts) → axiomancer-mechanics
```

Read upward, mutate downward. **Never duplicate engine logic in
the mobile repo.** If a rule is missing in the engine, file an
issue against `axiomancer-mechanics` rather than reimplement.

### 8. SVGs are placeholders until proven otherwise.

Every SVG in this codebase is a coded placeholder. The swap
contract is documented in [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md);
the end-to-end workflow lives in
[`.cursor/skills/swap-asset-placeholder/SKILL.md`](./.cursor/skills/swap-asset-placeholder/SKILL.md).
Read both before generating, wiring, or committing any new asset.

---

## Project

**Axiomancer Mobile** — Expo / React Native client for the
Axiomancer TTRPG. Thin presentation layer on top of the
`axiomancer-mechanics` engine. Distributed via EAS Build to
TestFlight (iOS) and Play Internal Track (Android).

The product is captured across:

- [`README.md`](./README.md) — architecture + quick start.
- [`AGENTS.md`](./AGENTS.md) — pre-nexus orientation (screen
  contract, testing, asset placeholders, caveats).
- [`specs/README.md`](./specs/README.md) — the 12 specs that
  define v1 (test harness, engine store, presenter layer,
  per-screen wiring, persistence, navigation, assets, a11y).
  This is the de-facto product spec; the build plan in
  `plan/steps/01_build_plan.md` reflects which specs are
  shipped vs. pending.

## Repo shape

```
app/                   expo-router routes (screens, tabs, layout)
components/            reusable presentational components (SVGs, chips, bars)
state/                 engine store wrapper + presenters + e2e tests
theme/                 palette + font tokens (theme/axm.ts)
assets/                fonts + images
test-utils/            hermetic-test helpers
docs/                  testing standard + design notes
specs/                 spec-driven planning docs (v1 surfaces)
plan/                  nexus build plan, phase briefs, audit, critique queues
skills/                source-of-truth skill files invoked by slash commands
.claude/               Claude Code config — commands + sub-agents
scripts/               deploy-check.mjs + any future helpers
SVG_ASSET_SPEC.md      contract for replacing every placeholder SVG
```

## How work happens

This project is **driven autonomously** by a small set of skills.
You don't normally write code by manually editing files; you
invoke a skill that does the right thing end-to-end.

### Skills (the verbs)

| Skill | Source of truth | What it does |
|---|---|---|
| `ship-a-phase` | `skills/ship-a-phase.md` | Ship one phase from the build plan. |
| `plan-a-phase` | `skills/plan-a-phase.md` | Refine the next phase brief, no code. |
| `iterate` | `skills/iterate.md` | Audit + ship one improvement. |
| `critique` | `skills/critique.md` | External-observer pass; writes to `CRITIQUE.md`. |
| `triage` | `skills/triage.md` | Issue review; routes to backlogs. |
| `expand` | `skills/expand.md` | Plan-expansion pass; proposes phase candidates. |
| `march` | `skills/march.md` | Outer dispatcher. |
| `oversight` | `skills/oversight.md` | **User-in-the-loop.** The only skill that asks anything. |
| `jot` | `skills/jot.md` | Quickfire — append a free-text note to `plan/CRITIQUE.md`. |

`/ship-data` and `/ship-asset` are **not adopted**:

- No structured data layer (game state is in-memory + planned
  `AsyncStorage`; not a record-keyed corpus). Skip `/ship-data`.
- No web surface for `/critique` to walk. Surface = `service`
  (mobile binary); the asset capability is disabled. Skip
  `/ship-asset` — placeholder-SVG swaps are handled by the
  pre-existing `.cursor/skills/swap-asset-placeholder/SKILL.md`
  flow.

### Invocation

```
/ship-a-phase                # ship next pending phase
/plan-a-phase                # refine next phase brief
/iterate                     # audit + ship one improvement
/critique                    # external-observer pass (limited until a runnable surface exists)
/triage                      # review unlabeled issues
/expand                      # propose new phase candidates
/march                       # do the right thing
/oversight                   # course-correct
/jot "<note>"                # append a CRITIQUE.md observation
/loop 30m /march             # autonomous loop
```

### Sub-agents

| Agent | Use for |
|---|---|
| `scout` | Open-web research with citations. |
| `reader` | Fresh-eyes site/app observer (limited — see Critique note in bearings). |
| `generic-specialist` | Domain template; clone per specialist need. |

The main agent writes wiring, code, decisions. Spawn sub-agents
aggressively for everything else.

---

## Operational secrets

The autonomous loop is hermetic for shipping; the awareness layer
needs tokens. Both live in `.env` (gitignored). Configure once
per machine.

### `EXPO_TOKEN` — deploy gate (when wired)

Used by `npm run deploy:check` once it polls the EAS Build API.
Currently a stub.

```
EXPO_TOKEN=...                # https://expo.dev/settings/access-tokens
EAS_PROJECT_ID=...            # from app.json / eas.json
```

If missing, `npm run deploy:check` will exit 3 with a clear
error once the stub is replaced.

### `GH_TOKEN` — issue triage

Used by `/triage` to review and label open GitHub issues. The
`gh` CLI auto-reads `GH_TOKEN`.

```
GH_TOKEN=github_pat_...
GH_REPO=no-trbl-2-u/axiomancer-mobile
```

Get one: https://github.com/settings/tokens

### No other secrets

If a feature ever requires more, the relevant skill stops at its
failure-mode condition rather than inventing a placeholder.

---

## Where to look

| If you need… | Read |
|---|---|
| What Axiomancer Mobile is | [`README.md`](./README.md), [`specs/README.md`](./specs/README.md) |
| Stack, conventions, defaults | [`plan/bearings.md`](./plan/bearings.md) |
| What ships next | [`plan/steps/01_build_plan.md`](./plan/steps/01_build_plan.md) |
| How a phase is built | `plan/phases/phase_<N>_<topic>.md` |
| How a skill works | `skills/<skill>.md` |
| What a sub-agent does | `.claude/agents/<name>.md` |
| Latest weaknesses | [`plan/AUDIT.md`](./plan/AUDIT.md) |
| Critique queue | [`plan/CRITIQUE.md`](./plan/CRITIQUE.md) |
| Phase candidates from `/expand` | [`plan/PHASE_CANDIDATES.md`](./plan/PHASE_CANDIDATES.md) |
| Hermetic e2e standard | [`docs/testing.md`](./docs/testing.md) |
| SVG asset swap contract | [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md) |
