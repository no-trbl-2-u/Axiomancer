# Skill: ship-a-phase

> **Full autonomy.** Ship one phase of the build plan end-to-end:
> code + tests + verify gate + commit + push + deploy check.
> The user reads the diff after — not before.
>
> **The bar for asking is high.** Decide and document in the commit
> body. Stop only on §10.

## 1. Purpose

Ship one self-contained slice of the build plan: one feature, one module
family, one spec. Every phase ends with a green verify gate, a clean commit,
a push, and a deploy gate confirmation.

## 2. Invocation

```
/ship-a-phase                   # next [ ] phase
/ship-a-phase phase 9           # specific phase by number
/ship-a-phase phase 9 dry-run   # plan + emit brief, no commit
/loop 30m /ship-a-phase         # autonomous, every 30 min
/march                          # outer dispatcher (preferred)
```

## 3. Autonomy contract

- **Ambiguity → decide.** Pick the choice most consistent with the spec +
  `plan/bearings.md`. Document under "Decisions" in the commit body.
- **Missing brief → generate one** per `skills/plan-a-phase.md` §5. Commit
  separately, then proceed.
- **Verify failure → read the log + patch.** Up to 3 times same root cause.
- **Missing primitive → build it** inside the appropriate module with
  colocated tests. Note in commit body.
- **External research needed → spawn `scout`.** Don't pollute main context.

Stop only on §10.

## 4. Delegation

- **`scout`** — external research (game mechanics references, TTRPG specs).
- **`mechanics-expert`** — spec alignment review, balance check.
- Spawn sub-agents aggressively. They protect main-agent context.

## 5. Module / feature shape

Every feature phase ships all of these:

```
src/<Module>/
├── <feature>.types.ts           # types and interfaces
├── <feature>.resolver.ts        # composite orchestrator returning { state, events? }
├── <feature>.reducer.ts         # single state-shape edits
└── e2e/
    └── <feature>.engine.test.ts # hermetic e2e test

src/index.ts                     # update barrel with new exports
docs/<module>.md                 # update or create doc
specs/<NN>-<topic>.md            # tick the acceptance checklist
```

After phases 01–08, these exist and are reused:
- `src/test-utils/rng.ts` — `mockFixedRng`, `mockAlternatingRng`, `mockSequentialRng`
- `src/Utils/` — math, dice, stat derivation, type guards
- `src/Character/`, `src/Combat/`, `src/Effects/`, `src/Items/`,
  `src/Game/`, `src/World/` — all stable, all exported

## 6. The procedure

### Step 0 — Re-sync

```bash
git pull --ff-only
```

If divergence, stop per §10.

### Step 1 — Pick the phase

Read `plan/steps/01_build_plan.md` Status block. The next phase is the
**first `[ ]` row**. Skip `[skipped]` rows. If the user passed `phase N`,
ship that one.

### Step 2 — Read the brief

`plan/phases/phase_<N>_<topic>.md`. If missing, generate per
`skills/plan-a-phase.md` §5 (commit separately, then proceed).

Also read the corresponding spec: `specs/<NN>-<topic>.md`.

### Step 2.5 — Mirror the phase to GitHub (best-effort)

```bash
cat > /tmp/phase-issue-body.md <<EOF
**Goal:** <one-line outcome from brief>

<2–4 line summary>

**Brief:** \`plan/phases/phase_<N>_<topic>.md\`
EOF

node scripts/loop-issue.mjs phase-open \
    --phase "<N>" \
    --title "Phase <N> — <topic>" \
    --body-file /tmp/phase-issue-body.md 2>/dev/null || true
```

On failure: log stderr, continue. Phase mirror is best-effort, not gating.

### Step 3 — Read the canonical sibling

The canonical sibling for a library phase is the most-recently shipped
module of a similar kind. For Spec 09 (game loop): read `src/Game/store.ts`,
`src/Combat/combat.resolver.ts`, `src/World/world.reducer.ts` for conventions.

### Step 4 — Build

Implement the feature following the brief's commit units. Work one unit at
a time; only commit when `npm run type-check` and `npm test` are green for
that unit.

Key patterns:
- Logic in `*.resolver.ts` or `*.reducer.ts`, not in CLI files.
- Exports go through `src/index.ts`.
- RNG: always use stubs from `src/test-utils/rng.ts`.
- No hardcoded magic numbers — constants in a `constants.ts` per module.

### Step 5 — Update exports

Add new exports to `src/index.ts`. Check for naming conflicts.

### Step 6 — (N/A for library — no SEO/routing step)

Skip. This step is for web projects.

### Step 7 — Tests

- **Unit tests:** colocated `__tests__/` or next to the source file.
- **Hermetic e2e:** `src/<Module>/e2e/<feature>.engine.test.ts` — required.
  Drive the feature through its highest-level public entry point. Stub RNG.
  Test the golden path + at least one error case.

### Step 8 — Update docs and spec

- Update `docs/<module>.md` if it exists; create it if a significant new
  module lands.
- Tick the acceptance checklist in `specs/<NN>-<topic>.md`.

### Step 9 — Verify gate

```bash
npm run verify     # npm run type-check && npm test && npm run build
```

If red: read the error, patch root cause, re-run. Up to 3 same-root-cause
iterations; otherwise stop per §10.

### Step 10 — Commit + push (atomic)

Stage explicitly. One commit per implementation unit (see brief); or one
summary commit if the brief doesn't specify units.

```bash
git add <explicit files>
git commit -m "$(cat <<'EOF'
feat(<scope>): <phase N> — <one-line summary>

- <bullet 1>
- <bullet 2>

Decisions:
- <design call — picked X over Y because reason>

Closes #<phase-issue-number if captured>
EOF
)"
git push origin main
```

No `Co-Authored-By:`. No emojis.

### Step 11 — Tick the DoD

Flip the shipped `[ ]` to `[x]` in `plan/steps/01_build_plan.md`, add
commit hash:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase <N> shipped — <one-line>"
git push origin main
```

### Step 12 — Deploy gate

```bash
npm run deploy:check    # npm pack --dry-run
```

- **Exit 0** — package is publishable. Continue.
- **Exit 1** — package not publishable. Read output; likely a `dist/` or
  `package.json` issue. Patch and re-push. Up to 3 iterations.

### Step 12.5 — Phase mirror close-comment (best-effort)

```bash
node scripts/loop-issue.mjs phase-close \
  --phase "<N>" \
  --commit "$(git rev-parse HEAD)" 2>/dev/null || true
```

### Step 13 — Done

Return cleanly. 2-3 line summary of what shipped and what's next.

## 7. Hard rules

1. **No `Co-Authored-By:` in commits.** Plain bodies.
2. **No emojis** in code, docs, or commit messages.
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **Stage explicitly.** Never `git add -A` or `git add .`.
5. **Tests alongside code.** `*.engine.test.ts` required for every new module.
6. **CLI files (`src/CLI/`) contain UI only.** Logic in resolver/reducer.
7. **RNG stubs only from `src/test-utils/rng.ts`.** No custom vi.spyOn.
8. **Phase mirror is best-effort.** `loop-issue.mjs` failure does not block.
9. **`src/index.ts` contract is locked** — no removals or renames.

## 8. Brief generation (when missing)

Follow `skills/plan-a-phase.md` §5. The brief for a library phase should
include: a spec reference, commit units, decisions made upfront, verify gate,
DoD checklist. Commit separately (`phases: brief for phase <N>`).

## 9. Cross-module retrofit

When shipping a new module, check if existing modules should export something
new or update cross-references. Keep retrofits scoped — one commit per
retrofit.

## 10. Failure modes — when to actually stop

1. **`npm run verify` fails ≥3 times on the same root cause.**
2. **`npm run deploy:check` fails ≥3 times on the same root cause.**
3. **A required dependency needs a paid service or API key.**
4. **`git pull` produces divergence.**
5. **Phase scope is genuinely ambiguous after reading spec + brief + bearings.**
   Generate a more decisive brief and proceed; stop only if that also fails.
6. **A type error cascades into >5 unrelated modules** — scope has expanded;
   stop and report.

For everything else: **decide, ship, document.**

## 11. Quick reference

```bash
# Where you read
plan/steps/01_build_plan.md            # status + scope
plan/phases/phase_<N>_<topic>.md       # brief
plan/bearings.md                       # stack + conventions
spec.md                                # product spec
specs/<NN>-<topic>.md                  # implementation spec
src/<canonical-module>/                # sibling for conventions

# Verify + commit + push + deploy
npm run verify
git add <files>
git commit -m "<subject>"
git push origin main
npm run deploy:check
```
