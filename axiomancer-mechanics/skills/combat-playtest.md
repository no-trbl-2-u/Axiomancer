# Skill: combat-playtest

> **The supercharged playtest loop for the Hazard-Pattern Combat.** Two
> layers of evidence: (1) the QUANTITATIVE stage matrix — `npm run
> combat-playtest` sweeps stage profiles x sim policies x drafted decks and
> reports win rates, status engagement, and per-card usage; (2) the
> QUALITATIVE layer — `playtester` sub-agents play REAL seeded encounters
> through the combat CLI, choose their own decks, and report what was fun,
> what was frustrating, and whether status play carried the fight.

> **Report only — this skill ships NO balance changes.** It synthesizes quant
> + qual into `plan/playtest-<ts>.md` with a doctrine verdict (is status play
> the fun path at every stage?) and hands every numeric follow-up to
> `/combat-tuning` (engine constants) or `/deck-tuning` (cards/decks).
> Deliver the report on ONE new branch + PR. Nothing auto-lands on `main`.

## Disambiguation — playtest vs the tuning loops

| | `/combat-playtest` ← **this file** | `/combat-tuning` | `/deck-tuning` |
|---|---|---|---|
| Ships changes? | NO — report + verdict only | Numeric engine constants | Cards, presets, draft weights, sandbox promotions |
| Evidence | stage matrix + qualitative agent play | `simulateHazardPatternCombat` / `npm run combat-sim` | matrix A/Bs with `--sandbox` |
| Question it answers | "Is status play the FUN path at every stage — and where does it break down?" | "Are the HP/threat/Conviction numbers in band?" | "Is the card pool healthy — no dead cards, no spam, honest archetypes?" |

The legacy turn-based combat has its own loop (`/legacy-combat-tuning`) and
its own legacy playtest framework (`docs/playtest-legacy.md`) — neither is
this skill's surface.

## North star — feel is a balance axis

Per `VISION.md` / `CLAUDE.md`, **status effects are the MAIN fun of combat.**
HP is the only win condition; status is the efficient path. The tuning loops
prove the NUMBERS obey the doctrine; this skill proves the EXPERIENCE does:

1. **At every stage, is applying and exploiting status effects what a player
   actually spends the fight doing** — and does it feel like the smart move,
   not homework?
2. **Does the matrix agree with the hands?** A stage can pass its win-rate
   band while a playtester reports "I just spammed one card" — that
   disagreement is the finding.
3. **Where is the friction?** Dead cards in hand, illegible telegraphs,
   Conviction that never gets spent, drafts that betray their focus.
4. **Is the impossible stage impossible for the right reasons?** Losing to
   The Incompleteness should read as a ceiling, not as noise.

Low status-effect engagement — quantitative OR felt — is a balance failure
even when win rates look healthy.

## 1. Purpose

`/combat-playtest` is the evidence loop that watches the whole combat
experience across the campaign's stage profiles (`early` The Shallows, `mid`
The Long Road, `late` The Deep Wood, `impossible` The Unprovable). It runs
the deterministic playtest matrix, spawns playtester agents to actually play
seeded encounters, synthesizes both into a doctrine verdict, and routes
findings. It is the eyes of the combat loops, never the hands.

## 2. Invocation

```
/combat-playtest
/combat-playtest --focus="early"
/combat-playtest --focus="impossible"
/combat-playtest --focus="does control feel worth the tempo cost"
/combat-playtest --focus="sandbox set forge-example"
/loop 12h /combat-playtest         # periodic autonomous playtesting
```

`--focus` accepts a stage id (`early|mid|late|impossible`) to concentrate
both layers on that stage, or free text naming a feel/engagement concern.
Without `--focus`, sweep all four stages.

## 3. Autonomy contract

- **Report only.** This skill never edits engine code, card data, presets,
  draft weights, or test thresholds. Its sole write surface is the report
  file (`plan/playtest-<ts>.md`) and, when warranted, `plan/CRITIQUE.md`
  jottings. Numeric follow-ups are HANDED OFF: name the target skill
  (`/combat-tuning` or `/deck-tuning`), the axis, and the evidence in the
  report's "Handoffs" section.
- **Quant before qual.** Run the matrix first; brief the playtester agents
  with the cells that look suspicious so their hands land where the numbers
  are ambiguous.
- **Seeded and reproducible.** Every matrix run and every agent encounter
  records its exact invocation (stage, enemy, policy, deck selection, seed,
  runs). Identical inputs are deterministic — cite them so anyone can replay.
- **Agents choose their decks.** Each playtester is assigned a stage and
  seeds, but CHOOSES its own deck selection (a preset or a draft focus) and
  must justify the choice — deck agency is part of what is being tested.
- **Honest synthesis.** Where quant and qual disagree, say so; do not average
  the disagreement away. Losses, boring wins, and "I never touched status"
  confessions are first-class evidence.
- **One PR carries the report.** The report rides a single new branch + PR,
  ready for review, never draft, never auto-merged. No no-op PRs repeating
  the previous tick's verdict.
- **Standing law.** Unknown is an acceptable terminal state; false certainty
  is not. Never fabricate a matrix cell, an agent transcript, or a verdict.
- **Ambiguity → document and proceed.** Unclear focus: make the most
  reasonable assumption, note it under `## Open questions`, and continue.

## 4. Design targets (what to measure)

**Layer 1 — the matrix (quantitative).** `npm run combat-playtest` drives
`runPlaytestMatrix` (`src/Combat/combat.playtest.ts`): stage profiles x sim
policies x deck selections, `runs` seeded encounters per cell. Default
sweep: all stages, all policies, `policy-pick` decks (each policy drafts
from its preferred focus). Record per cell: win rate, V/M/D/R split,
`statusEngagement`, `dotHpFraction`, avg rounds; add `--cards` for the
per-card usage table (plays, top/bottom split, status lands, discards). The
policy roster spans the doctrine's archetypes — `greedy`/`blind` (the
canonical ceiling/player-feel pair), `dot-weaver`, `control-lock`,
`aggro-brute` (the deliberately weak baseline), `turtle`, `chaos`,
`mercy-seeker` — see `docs/playtest.md` for the roster table.

**Layer 2 — the hands (qualitative).** 2-4 `playtester` sub-agents
(`.claude/agents/playtester.md`) spawned IN PARALLEL, each assigned one stage
+ seeds (+ optionally a sandbox set or a suspicious cell from Layer 1). Each
agent plays real encounters through the combat CLI and returns the
structured report its agent file mandates: setup, runs table, what was fun,
status-effect engagement, friction and dead cards, verdict + confidence.

Doctrine checkpoints both layers must answer, per stage: status engagement
high and felt; DoT/control visibly out-pacing basic strikes; mercy path
reachable where designed; no single-card spam; impossible stage losing for
legible reasons.

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- Cold-run the playtest suites:
  `npx vitest run src/Combat/e2e/combat-playtest.matrix.sim.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`.
- If anything fails before you start, stop and report the pre-existing
  failure.

### Step 1 — Run the quantitative matrix
```
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards
npm run combat-playtest -- --stage=<focus> --policy=blind --runs=120 --seed=1 --cards   # focused deep-dive
```
For agent consumption add `--json` (prints the raw `PlaytestReport`, nothing
else). Flag: cells off their band (the thresholds in
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` are the contract),
stages with weak `statusEngagement` or `dotHpFraction`, cards with zero or
dominant usage, and any greedy-vs-blind gap worth a human hand.

### Step 2 — Spawn playtester agents (parallel)
Spawn 2-4 `playtester` sub-agents in one batch, each with:
- a stage id (cover the focus stage plus at least one neighbor; always
  include `impossible` on a full sweep),
- 3-5 seeds to play,
- the suspicious cells from Step 1 relevant to its stage,
- optionally `--sandbox=<setId>` when the focus names a sandbox set,
- the instruction to CHOOSE its deck (preset or draft focus, the grammar in
  its agent file) and justify the choice.

The agents drive `npm run combat -- --enemy <slug> --stage <stage> --deck
<selection> --seed <n> ...` — hand-played via `--stdin --json-events` or
`--script`, and fast-swept via `--auto --policy status`. The JSONL answer
protocol lives in `src/CLI/io.ts` (script/stdin modes); the agent file
documents the exact commands.

### Step 3 — Synthesize
Write `plan/playtest-<ts>.md`:
- the matrix tables (key cells, per-stage summaries, card coverage),
- each agent's report verbatim (or tightly excerpted with runs tables
  intact),
- a per-stage doctrine scorecard: quant says / hands say / agree?,
- **the doctrine verdict:** is status play the fun path at EVERY stage —
  yes / no / degraded-at-<stage>, with the two or three load-bearing pieces
  of evidence,
- `## Handoffs`: each numeric follow-up as one line — target skill, axis,
  evidence pointer,
- `## Open questions`.

### Step 4 — Deliver on ONE PR
- Branch off base: `git checkout -b playtest/combat-<ts>`.
- Stage the report (and any `plan/CRITIQUE.md` jottings).
- Commit: `docs(playtest): combat playtest <ts> report`.
- Push and open a PR (ready for review): title
  `playtest(combat): <ts> — <one-line verdict>`; body carries the doctrine
  verdict, the scorecard, and the handoff list. Never draft, never
  auto-merge, never push `main`.

### Step 5 — Report back
One concise message: the PR URL, the doctrine verdict, and the handoffs (if
any) with their target skills.

## 6. Hard rules

- **Ship no balance changes.** No edits to engine constants, card data,
  presets, draft weights, sandbox sets, or test thresholds — not even
  "obvious" ones. Handoffs only.
- **Never push to `main` automatically. Never auto-merge.**
- **Seeded runs only** — every cited encounter carries its seed and full
  invocation; unreproducible anecdotes are not evidence.
- **Agent reports are quoted honestly** — including losses, boredom, and
  verdicts that contradict the matrix.
- **Never let a healthy win rate excuse weak status engagement** — that is
  the doctrine's core failure mode.
- **Preserve canonical terms** (VITAE/HP, STANCE, Conviction, GUARD, Befriend
  mercy, stage ids, policy ids).
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **A suite fails before any run.** Stop; report the pre-existing failure.
2. **A playtester agent returns malformed or empty output.** Re-spawn once
   with a tightened brief; if it fails again, proceed with the remaining
   agents and record the gap under `## Open questions`.
3. **Quant and qual flatly disagree.** That IS the finding — lead the report
   with it; recommend a focused follow-up rather than picking a side.
4. **The matrix is too slow for a full sweep.** Reduce `--runs` per cell
   before reducing coverage; record the reduced counts.
5. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**Layer 1 CLI:** `npm run combat-playtest` (`src/CLI/combat-playtest.cli.ts`)
— flags `--stage=early|mid|late|impossible|all` (default all),
`--policy=<id|all>` (default greedy), `--deck=preset:<id>|draft:<focus>|cards:a,b,c|policy-pick`
(default policy-pick), `--enemy=<slug>`, `--runs=N` (default 60), `--seed=N`
(default 1), `--sandbox=<setId>`, `--cards`, `--json`.

**Layer 2 CLI (what the agents drive):** `npm run combat` — additive flags
`--stage <id>` (stage-profile player), `--deck <selection>` (same grammar),
`--sandbox <setId>`, plus the existing `--enemy <slug>`, `--seed <n>`,
`--auto`, `--policy naive|safe|aggressive|status`, `--max-turns <n>`,
`--script <path>`, `--stdin`, `--json-events`, `--state-log <path>`. Answer
protocol: `src/CLI/io.ts` (script/stdin modes).

**Machinery:** `runPlaytestMatrix` / `formatPlaytestReport`
(`src/Combat/combat.playtest.ts`) · stage profiles
(`src/Combat/combat.stage-profiles.ts`) · policies
(`src/Combat/combat.sim-policies.ts`) · deck selections
(`src/Combat/combat.deck-draft.ts`) · sandbox sets
(`src/Cards/cards.sandbox-sets.ts`).

**Contract tests:** bands
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` · matrix
determinism `src/Combat/e2e/combat-playtest.matrix.sim.test.ts` · card
coverage `src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.

**One-page reference:** `docs/playtest.md` (stage table, policy roster, deck
grammar, sandbox workflow, CLI cookbook).

**Sub-agent:** `.claude/agents/playtester.md`.

**Doctrine:** `VISION.md` → Combat vision · `CLAUDE.md` (load-bearing
doctrine).

**Handoff targets:** engine constants → `/combat-tuning` · cards/decks →
`/deck-tuning`.
