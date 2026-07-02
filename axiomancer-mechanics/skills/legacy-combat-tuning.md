# Skill: legacy-combat-tuning

> **LEGACY — tunes the turn-based combat (`resolveCombatRound`), NOT the new
> Hazard-Pattern Combat.** Spec 25 (2026-06-21) replaced the attack/defend
> round loop with a card-and-dice driver (`resolveCombatPhase`) where status
> effects are the only win condition; that system has its own tuner,
> **`/combat-tuning`** (`skills/combat-tuning.md`). This skill remains because
> the legacy `resolveCombatRound` engine still backs live exploration
> encounters until that wiring migrates — keep tuning it until then. Everything
> below concerns the **legacy turn-based combat** (stance attack/defend, the
> STRATEGIST × AGGRESSIVE playstyle matrix, `npm run tune`, `src/Tuning/`).

> **High autonomy within hard guardrails.** Run the character × playstyle ×
> enemy balance matrix, A/B-test numeric changes, and deliver everything —
> the data report, the suggestions (with inline game-state evidence), and any
> auto-applied winners — together on ONE new branch + PR. Nothing auto-lands
> on `main`.

## North star — status effects are the main engagement

Per `VISION.md` / `CLAUDE.md`, **status effects are the primary fun of combat encounters.**
This is no longer just prose the optimiser ignores: status-effect engagement is
now a **term in the health objective** (`health.metrics.ts`), and the metric
measures **leverage, not activity** (`engagement.metrics.ts`). Status that
*converts* a fight to a resolution earns full credit; status sprayed into a
fight that times out is heavily discounted — so the loop is pushed to make
effects DECISIVE, not merely present. A change that holds win rates but collapses
combat into basic-attack trades scores WORSE, and the A/B comparison rejects any
change that materially drops leverage (`engagementRegression`) OR lets
basic-attack play (AGGRESSIVE) out-resolve status play (STRATEGIST) — the
**witness** guard (`witnessRegression`, `health.metrics.ts`). The STRATEGIST
playstyle is the witness for this path and learns to win by applying/exploiting
effects, not by raw damage.

## 1. Purpose

`/legacy-combat-tuning` is the self-improving balance loop for the legacy
turn-based combat. It drives `npm run tune`
(the `src/Tuning/` engine), reads the generated logs, optionally consults the
`balance-analyst` subagent for richer recommendations, and ships the outcome.
It exists so balance work is evidence-driven and reproducible instead of
hand-waved.

It does NOT reimplement combat or invent metrics — the engine and the existing
playtest harness do that. The skill is the orchestrator + the delivery layer.

## 2. Invocation

```
/legacy-combat-tuning
/legacy-combat-tuning --focus="new status effects since April"
/legacy-combat-tuning --focus="early-game enemy balance" --runs=50
/loop 6h /legacy-combat-tuning      # periodic autonomous legacy tuning
```

Arguments are forwarded to `npm run tune` (`--focus`, `--runs`, `--levels`,
`--playstyles`, `--difficulties`, `--max-iterations`). The CI workflow runs
offline-first (no programmatic API key — auth mirrors `/march` via
`CLAUDE_CODE_OAUTH_TOKEN`); the `balance-analyst` subagent provides the richer
analysis in-session.

## 3. Autonomy contract

- **Numeric-only, capped, reviewed.** The engine can only change values in the
  tunable registry (`src/Tuning/tunable.registry.ts`), each ±25%/run, and only
  keeps a change that **significantly** improves matrix health (a paired-cell
  test, not a magic epsilon — the kept change carries a `confidence`), is not a
  defeat-rate OR engagement regression, and passes `npm run verify`.
  Structural/schema/logic ideas are propose-only.
- **The objective has two terms.** Per-cell deviation from a *difficulty-specific*
  success band (easy/normal/hard target different rates) PLUS shortfall below the
  status-effect engagement floor. Both are weighted into one score; lower is
  healthier.
- **The ruler is frozen per tick.** The baseline and every A/B variant are
  measured under the same strategist snapshot, so keep/reject decisions are made
  against the same policy. Cross-tick learning is folded separately afterward.
- **The loop remembers.** Every A/B outcome is recorded in
  `automation/playtest/tuning-ledger.json`; a `(param, direction)` rejected in
  the last couple of ticks is on cooldown and not re-proposed without new
  evidence.
- **One PR carries everything.** The data report, the suggestions writeup (with
  inline player/enemy/combat snapshots), and any auto-applied winners all ride a
  single new branch + PR. Nothing is pushed to `main` automatically.
- **Ambiguity → document and proceed.** If a focus is unclear or a propose-only
  idea looks architecturally significant, make the most reasonable assumption,
  document the assumption and the open question under an `## Open questions`
  section appended to the suggestions file, and continue — never pause for
  input. In a GH Action container there is no user to answer.

## 4. The procedure

### Step 0 — Sync & sanity
- Ensure a clean working tree. Note the base branch (usually `main`).
- `npm ci` if `node_modules` is absent.

### Step 1 — Run the matrix + A/B
- Run: `npm run tune -- --focus="<focus>" <other flags>`
  (omit `--dry-run`; we want winners applied to the working tree).
- The CLI prints a final `[tune] RESULT { ... }` JSON line. Capture from it:
  `dataReport`, `dataReportJson`, `suggestions` (paths) and `keptChanges`.
- The CLI leaves: edited tunable file(s) for kept winners (working tree),
  the two report artifacts under `automation/playtest/reports/`, and an updated
  `automation/playtest/strategist-knowledge.json`.

### Step 2 — Close the analyst→actuator loop (the smart path)
The offline heuristic can move numbers but is coarse. For a richer pass, let the
`balance-analyst` subagent actually drive the A/B loop (not just write prose):

1. Run with `--emit-request=<path>` to produce a compact analyst request
   (per-cell band/engagement, legal tunables + direction hints, current
   cooldowns) alongside the data report — no A/B is run.
2. Spawn the `balance-analyst` subagent on the data report JSON + the request.
   It returns BOTH structured candidates (the JSON contract in the request:
   `[{paramId, proposedValue, rationale}]`, registry ids only) AND a
   propose-only section. Write the candidates to a file.
3. Re-run with `--candidates=<that file>` to A/B-test the subagent's candidates
   under the same guardrails (clamp, significance, regression, verify) and apply
   the winners.

Append the subagent's "Propose-only" section to the suggestions file. The
subagent still returns analysis only — the **engine** applies, within its
guardrails. (Skipping Steps 2.1–2.3 and running `npm run tune` directly uses the
generalized offline heuristic, which is a valid lighter pass.)

### Step 3 — Deliver everything on ONE PR
- Create a branch off the base: `git checkout -b balance/tuning-<ts>`.
- Stage ALL of it together — the data report, the suggestions writeup, the
  learning state, and any winner-edited tunable files:
  `git add automation/playtest/reports/tuning-<ts>.md
   automation/playtest/reports/tuning-<ts>.json
   automation/playtest/reports/suggestions-<ts>.md
   automation/playtest/strategist-knowledge.json
   automation/playtest/tuning-ledger.json
   <changed tunable files>`
  (Note: `reports/.gitignore` ignores `*.json`; `git add -f` the data-report
  JSON if you want it on the PR.)
- Commit: `balance(tuning): <ts> report + suggestions (<n> auto-applied)`
- Push and open a PR (ready for review, not draft):
  - Title: `balance: tuning <ts> (<n> auto-applied)`
  - Body: the headline health delta; each kept change (`param: old → new`) with
    a one-line *why*; the suggestions' supporting game-state snapshots for the
    most off-band cells; and the propose-only section for human follow-up.
- If there are **no kept winners**, open a PR **only when the tick has something
  new to say** — a fresh propose-only finding, or off-band cells that differ from
  the previous tick's. **Do not open a no-op PR.** Before pushing, compare this
  tick's suggestions' propose-only section against the most recent prior
  `suggestions-*.md`: if the findings are materially the same (the loop is just
  re-reporting a known structural wall it cannot act on), **skip the PR** and say
  so in the report-back message instead — a duplicate PR every tick is noise that
  causes review fatigue. A 0-winner tick that DOES surface a new finding still
  opens a PR carrying the data report + suggestions + evidence snapshots.

### Step 4 — Report back
- One concise message: the PR URL and the headline health + engagement delta.
  If `/loop`-invoked and a focus rotation is desired, proceed to the next focus;
  otherwise stop.

## 5. Hard rules

- **Never push anything to `main` automatically.** The data report, suggestions,
  learning state, and winners ALL ride the PR branch. A human merges.
- **Never auto-merge the PR.** A human approves it.
- **Never bypass the verify gate.** The engine already gates kept winners on
  `npm run verify`; do not commit a winner that did not pass.
- **Never edit `src/index.ts`, public types, or core formulas.** The applier
  denylist enforces this; don't work around it.
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <one-line>`.

## 6. Failure modes

1. **`npm run tune` fails / no `RESULT` line.** Read stderr; if it's a content
   bug (e.g. a new enemy/skill referencing a missing id), fix the root cause or
   report it — do not ship a partial run.
2. **No candidate improved health.** Normal. Push the data report to `main`;
   open a propose-only PR (or skip per Step 4) and say the matrix is in band.
3. **Verify fails on a winner.** The engine already reverted it; it appears
   under "Considered but not applied". No action needed.
4. **Focus matches nothing.** The matrix still runs at baseline; note that the
   focus filter was empty and suggest a broader focus.

## 7. Quick reference

- Engine: `src/Tuning/` · CLI: `npm run tune` · registry:
  `src/Tuning/tunable.registry.ts`
- Objective: `src/Tuning/health.metrics.ts` (band + engagement) ·
  bands: `difficulty.bands.ts` · engagement: `engagement.metrics.ts`
- Artifacts: `automation/playtest/reports/{tuning,suggestions}-<ts>.*`
- Learning state: `automation/playtest/strategist-knowledge.json`
- Experiment memory: `automation/playtest/tuning-ledger.json`
- Flags: `--emit-request=<p>` / `--candidates=<p>` (analyst→actuator loop),
  `--dry-run`, `--focus`, `--runs`, `--levels`, `--playstyles`,
  `--difficulties`, `--max-iterations`, `--use-api`
- Subagent: `.claude/agents/balance-analyst.md`
- CI: `.github/workflows/mechanics-tuning.yml` (manual `workflow_dispatch`; legacy turn-based combat loop)
