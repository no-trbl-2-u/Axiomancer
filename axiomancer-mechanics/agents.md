# agents.md

> Entry point for any AI agent (Claude Code, Cursor, Aider) landing
> in this repo. Read this top to bottom before touching any file.
> Standing rules are non-negotiable. Skill files elaborate; this
> is the canonical source.
>
> **Need a player / contributor tour instead?** See
> [`docs/quickstart.md`](./docs/quickstart.md) — single-page overview
> of what's shipped, how to drive the CLI through every major
> surface, the walkthrough catalog, and pointers to deeper docs.
> Use this file (`agents.md`) for autonomous-loop wiring; use
> `quickstart.md` for the human-readable map of the engine.

## Standing rules

### 1. Commit and push. Always. As a single atomic act.

Committed but unpushed work is invisible to the next loop tick.
Every shipping skill ends with `git commit` **immediately followed
by** `git push origin main`. No dirty working trees between ticks.

### 2. No `Co-Authored-By:` trailers. No emojis.

Plain commit message bodies. Never add `Co-Authored-By:`,
"🤖 Generated with…" footers, or any emoji — in commits, code,
content, or docs.

### 3. The verify gate is non-negotiable.

`npm run verify` runs **before** every commit:

```
npm run type-check        # tsc --noEmit (production sources)
npm run type-check:tests  # tsc -p tsconfig.tests.json (test files too)
npm run lint              # eslint "**/*.ts" (warnings advisory; errors fail)
npm test                  # vitest run (includes hermetic e2e)
npm run build             # tsc && tsc-alias → dist/
```

All five are hard gates. Lint was repaired in Phase 13 (commit
`4f58f66`) and is back in the gate; warnings are advisory but
errors fail. The tests type-check was added 2026-06-12 after 263
silent type drifts accumulated in test files (test sources are
excluded from the build tsconfig, so they were never checked).
Fix the root cause; never `--no-verify`.

### 4. The deploy gate runs **after** every push.

`npm run deploy:check` checks the package is publishable:

```
npm pack --dry-run
```

Exit 0 = green; exit 1 = blocked. Every shipping skill calls it
after push. A red deploy gate is treated identically to a red
verify: read output, patch, push. Up to 3 iterations; then stop.

### 5. No `--no-verify`. No force-push. No destructive resets.

If a hook fails, fix the underlying issue. If `git pull` diverges,
stop and report. Tests alongside code, never "add tests later".

### 6. Hermetic e2e tests are required on every implementation.

Every new module or feature lands with at least one hermetic e2e
test at `src/<Module>/e2e/<feature>.engine.test.ts`. **Hermetic**
= self-contained (no disk/network/TTY) + deterministic (RNG
stubbed via `src/test-utils/rng.ts`) + isolated (`vi.restoreAllMocks`
in `afterEach`). See `docs/testing.md` for the canonical standard.

### 7. Commit style: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
Example: `feat(game): add gameReducer dispatch`.
Reference the spec number when relevant. Never squash or amend
after pushing.

### 8. CLI files contain UI only.

`src/CLI/` files are excluded from the build. All logic goes in
resolver/reducer modules (`<feature>.resolver.ts`,
`<feature>.reducer.ts`) that are independently testable. CLIs call
those modules.

### 9. `src/index.ts` contract is locked.

No removals or renames of existing exports without a semver major
phase. Adding new exports is always fine.

**`@deprecated` does not override this rule.** A deprecation tag (even
one with a passed removal deadline) never authorises removing an
export in a minor/patch — `axiomancer-mobile` consumes this package
and builds against the barrel. Before ANY export removal:

1. `grep` the export name across `../axiomancer-mobile` (the repos are
   siblings on the loop machine). A hit = a live consumer; removal is
   blocked until a mobile migration ships FIRST.
2. Even with zero hits, removal still waits for a semver major phase.

Precedent: the loop removed the deprecated preset exports in a minor
(`d17f2db`), 0.17.0 shipped the break, and mobile's build went red —
reverted in 0.17.1. Do not repeat this.

### 10. The status-effect doctrine governs balance work.

**Status effects are the MAIN fun and the most engaging aspect of combat encounters**
(set 2026-06; canonical in `VISION.md` → Combat vision, echoed in
`plan/bearings.md`). Any balance, tuning, content, or skill/effect work
optimises first for status-effect-centric play. If a change makes basic-attack
trading more attractive than applying/exploiting status effects, it works
against the vision. Treat low status-effect engagement as a balance failure
even when win/loss rates look healthy.

---

## Project

**axiomancer-mechanics** — TypeScript turn-based RPG engine with philosophical
themes, consumed as an npm library by a React Native app. No database, no
server, no web UI.

The product spec is `spec.md` at the repo root. Read it once.

## Repo shape

```
src/                   Public engine modules (Character, Combat, Effects, …)
src/index.ts           Public barrel — the API contract
src/CLI/               Interactive CLIs (not in build)
src/test-utils/        RNG stubs and mock helpers
specs/                 Conversation-loop spec files for each implementation phase
docs/                  Per-system reference docs
braindump/             Unorganised idea backlog
plan/                  Build plan, phase briefs, audit findings
skills/                Nexus skill files invoked by slash commands
.claude/commands/      Terse slash-command pointers
.claude/agents/        Sub-agent definitions
.claude/skills/        Project-specific skills (brainstorm-mechanics, story-spec)
scripts/               deploy-check.mjs, loop-issue.mjs
```

## How work happens

This project is driven by a set of skills. Invoke a skill that does the
right thing end-to-end — don't manually edit files unless you're answering
an open question in a spec.

### Skills (the verbs)

| Skill | Source | What it does |
|---|---|---|
| `ship-a-phase` | `skills/ship-a-phase.md` | Ship one phase from the build plan. |
| `plan-a-phase` | `skills/plan-a-phase.md` | Refine the next phase brief, no code. |
| `iterate` | `skills/iterate.md` | Audit + ship one code-quality improvement. |
| `critique` | `skills/critique.md` | Code-quality/architecture pass; writes to `CRITIQUE.md`. |
| `triage` | `skills/triage.md` | GitHub issue review and routing. |
| `expand` | `skills/expand.md` | Plan-expansion pass; proposes new phase candidates. |
| `march` | `skills/march.md` | Outer dispatcher: triage → critique → phase → expand → iterate. |
| `oversight` | `skills/oversight.md` | **User-in-the-loop.** The only skill that asks anything. |
| `jot` | `skills/jot.md` | Drop a quick observation into CRITIQUE.md. |
| `combat-tuning` | `skills/combat-tuning.md` | **Hazard-Pattern Combat** balance loop — drive the Monte-Carlo sim (`simulateHazardPatternCombat`, greedy + blind) for the card-and-dice driver where the enemy's sole bar is HP and status effects are the efficient win path; numeric changes to the HP/threat/Conviction economy + report via PR. |
| `deck-tuning` | `skills/deck-tuning.md` | **Card Forge** balance loop for the Hazard-Pattern Combat card pool — sandbox-first: A/B experimental cards/overrides (`cards.sandbox-sets.ts`) through the playtest matrix, tune presets/draft weights, promote proven cards into the library; changes + report via PR. Engine constants stay with `combat-tuning`. |
| `combat-playtest` | `skills/combat-playtest.md` | Supercharged Hazard-Pattern Combat playtest — the stage-profile x policy matrix (`npm run combat-playtest`) plus `playtester` sub-agents playing real seeded encounters; synthesizes a doctrine verdict (is status play the fun path at every stage?) into a report PR. **Report only** — numeric follow-ups hand off to `combat-tuning` / `deck-tuning`. |
| `legacy-combat-tuning` | `skills/legacy-combat-tuning.md` | **Legacy** turn-based combat (`resolveCombatRound`) balance loop — run the playstyle matrix, A/B-test numeric changes; data report → `main`, suggestions + winners → PR. Remains until live encounters migrate off the legacy engine. |
| `hazard-tuning` | `skills/hazard-tuning.md` | Hazard minigame balance loop — use hazard CLI evidence to analyse card ratios, thresholds, mana economy against CDR-0006 targets; numeric changes + report via PR. |
| `gathering-tuning` | `skills/gathering-tuning.md` | Gathering minigame (The Gleaning) balance loop — policy-sim + CLI evidence against the greed<restraint<skill doctrine; numeric changes + report via PR. |
| `quest-board-tuning` | `skills/quest-board-tuning.md` | Quest Board (The Boy's Almanac) balance loop — seeded policy probes against the naive-finishes / deliberate-finishes-well doctrine; numeric changes + report via PR. |
| `rest-tuning` | `skills/rest-tuning.md` | Rest (The Night Watch) balance loop — posture × policy probes against the meagre-but-never-lethal doctrine; numeric changes + report via PR. |
| `loot-cache-tuning` | `skills/loot-cache-tuning.md` | Loot-cache (The Reliquary) balance loop — policy-EV probes against the informed > blind > coward doctrine; numeric changes + report via PR. |

Also available (project-specific):

| Skill | Source | What it does |
|---|---|---|
| `brainstorm-mechanics` | `.claude/skills/brainstorm-mechanics` | Socratic brainstorming for TTRPG mechanic design. |
| `character-spec` | `.claude/skills/character-spec` | Character spec creation for named NPCs / antagonists / player presets (files to `specs/characters/`). |
| `story-spec` | `.claude/skills/story-spec` | Story spec creation for NPCs and narrative beats (files to `specs/story/`). |
| `world-spec` | `.claude/skills/world-spec` | World spec creation for locations, regions, environmental beats (files to `specs/world/`). |

### Invocation

```
/ship-a-phase           # ship next pending phase
/plan-a-phase           # refine next phase brief
/iterate                # audit + ship one improvement
/critique               # code-quality pass
/triage                 # review unlabeled GitHub issues
/expand                 # propose new phase candidates
/march                  # do the right thing
/oversight              # course-correct
/loop 30m /march        # autonomous loop
/jot <observation>      # quick CRITIQUE.md note
/deck-tuning [--focus="..."]   # card forge: sandbox-first card/deck balance PR
/combat-playtest [--focus="..."] # stage matrix + playtester agents; report-only PR
/hazard-tuning [--focus="..."] # hazard minigame tuning evidence + guarded balance PR
/gathering-tuning [--focus="..."] # gleaning tuning evidence + guarded balance PR
/quest-board-tuning [--focus="..."] # quest board tuning evidence + guarded balance PR
/rest-tuning [--focus="..."]   # night-watch tuning evidence + guarded balance PR
/loot-cache-tuning [--focus="..."] # reliquary tuning evidence + guarded balance PR
```

### Sub-agents

| Agent | Use for |
|---|---|
| `scout` | Open-web research: TTRPG specs, game design patterns, references |
| `mechanics-expert` | Game mechanic review, balance analysis, spec alignment checks |
| `balance-analyst` | Reads tuning-run logs/reports; returns balance recommendations (registry auto-apply candidates + propose-only ideas). |
| `playtester` | Plays seeded Hazard-Pattern Combat encounters via the CLI as a real player, chooses its own deck, and returns a structured quant + fun/status-engagement report. Spawned in parallel batches by `combat-playtest`. |

The main agent handles code, wiring, decisions. Spawn sub-agents for research
and domain analysis.

---

## Operational secrets

Both live in `.env` (gitignored). Configure once per machine.

### `GH_TOKEN` — issue triage

Used by `/triage` to label open GitHub issues. The `gh` CLI reads it.

```
GH_TOKEN=github_pat_...
GH_REPO=no-trbl-2-u/axiomancer-mechanics
```

Get one: https://github.com/settings/tokens (repo + issues scope).

If missing, `/triage` logs a warning and falls through in `/march`; other
skills are unaffected.

### No deploy token needed

`npm pack --dry-run` (deploy gate) requires no auth. No hosting provider
tokens.

---

## Where to look

| If you need… | Read |
|---|---|
| What axiomancer-mechanics is | `spec.md` |
| Stack, conventions, defaults | `plan/bearings.md` |
| What ships next | `plan/steps/01_build_plan.md` |
| How a phase is built | `plan/phases/phase_<N>_<topic>.md` |
| The implementation spec | `specs/<NN>-<topic>.md` |
| How a skill works | `skills/<skill>.md` |
| Sub-agent definitions | `.claude/agents/<name>.md` |
| Open audit findings | `plan/AUDIT.md` |
| Critique queue | `plan/CRITIQUE.md` |
| Testing standard | `docs/testing.md` |
| Existing module docs | `docs/<module>.md` |
| Run-loop semantics + Codex slice (Phase 72/73) | `docs/gameloop.md` § "Run-loop reset (Phase 72)" + `docs/api.md` § "Codex slice (Phase 73)" |
| Per-foe aftermath narrative + codex entries (Phase 71/73) | `docs/enemy.md` § "Aftermath narrative (Phase 71)" + § "Codex entries (Phase 73)" |
| One-page tour of what's shipped | `docs/quickstart.md` |
| Caveats (ESLint, CLIs) | `AGENTS.md` (Cursor rule book — also applies here) |
