---
description: Combat playtest for the revamp's S3 questions — does player stat growth track the stage curve, and are the three surviving foes (Float-Eye, Brine Hag, the Doorwarden) winnable while still putting the player at real risk? Runs the seeded stage matrix (npm run combat-playtest) and playtester sub-agents, files findings to plan/AUDIT.md, and delivers the report on one PR. Report-only.
---

> **Runs against the `axiomancer-mechanics` package.** Paths below
> (`src/…`, `docs/…`) are relative to that package. Run from it
> (`cd axiomancer-mechanics`) or via `npm run <script> -w axiomancer-mechanics`.

# Skill: combat-playtest

> **The evidence loop for combat during the revamp.** Two layers:
> (1) the QUANTITATIVE layer, a seeded matrix (`npm run combat-playtest`)
> plus a seeded auto-play sweep of each survivor through the combat CLI;
> (2) the QUALITATIVE layer, `playtester` sub-agents who fight the
> survivors in the local expo-web build and report whether each fight was
> winnable and whether it ever felt dangerous. Findings land in
> `plan/AUDIT.md`; the full report rides one PR.

> **REVAMP MODE (D58, since 2026-09-28).** The loop ships only phases of the
> ratified revamp build plan (`plan/steps/01_build_plan.md`; part plans in
> `plan/revamp/`), plus `/fix-ci` and `/critique`. It creates no content of
> any kind: cards, keywords, enemies, relics, maps, NPCs, events or art. THE
> CARD HOLD (D37) stands: no card or keyword is made outside a guided session
> with T. The content stewards, `/forge` and the `card-expert`,
> `content-curator`, `mechanics-expert` and `reader` agents were archived in
> R0; never route work to them.

## The questions

Since S3 (D40–D41), stats are the player's main growth: body, mind and heart
scale every keyword family by `base × stat ÷ 5`, and VITAE is derived from
level and stats (`calculateMaxHealth`). The player's kit is the grey office:
A Plain Blow (DEAL), A Plain Ward (GUARD), A Plain Word (VULNERABLE). The
enemy roster after R2 is three foes with no keywords and no afflictions
(`plan/revamp/enemies.md`):

| Foe | Slug | Level | Where it fights |
|---|---|---|---|
| Float-Eye | `float-eye` | 1 | normal fights |
| Brine Hag | `brine-hag` | 7 | the rarer mid-region fight |
| The Doorwarden | `the-doorwarden` | 8 | every region's door fight |

This skill answers two questions, and only these two:

1. **Does player stat growth track the stage curve?** At each stage's
   level, does the stat block a real player can reach (starting stats plus
   `STAT_POINTS_PER_LEVEL` per level, `src/Game/game-mechanics.constants.ts`)
   match the block the stage profile assumes
   (`src/Combat/combat.stage-profiles.ts`)? At that body, how many Blows
   does each survivor take to fall, and how many threat phases does the
   player survive?
2. **Are the three survivors winnable, and do they put the player at real
   risk?** Each survivor should be beatable by the grey deck at the level
   the player meets it, and none should be free: a fight the player cannot
   lose is a finding, as is one the player cannot win. The Doorwarden should
   be winnable but not free (`plan/revamp/progression.md`).

Evidence here feeds R9 (the XP/level retune) and B2 (the enemy revamp). This
skill changes nothing itself.

## 1. Purpose

`/combat-playtest` measures the combat curve against the revamp's survivors
and reports it. It runs the seeded quantitative layer, spawns playtester
agents for the qualitative layer, writes a report, and files each finding as
a `plan/AUDIT.md` row naming the revamp phase that owns it.

## 2. Invocation

```
/combat-playtest
/combat-playtest --focus="early"
/combat-playtest --focus="the-doorwarden"
/combat-playtest --focus="does the Brine Hag ever threaten a level-7 player"
```

`--focus` accepts a stage id (`early|mid|late|impossible`), a survivor slug
(`float-eye|brine-hag|the-doorwarden`), or free text naming a concern.
Without `--focus`, cover all three survivors and every stage profile.

Runs from `.github/workflows/combat-playtest.yml` (manual dispatch) or by
hand.

## 3. Autonomy contract

- **Report-only.** No edits to engine constants, XP, stats, enemy data, card
  data or test thresholds. Those belong to R9 (XP, level scaling of the
  survivors) and B2 (enemies). The write surface is the report file
  (`docs/reports/playtest-<ts>.md`) and new rows in `plan/AUDIT.md`.
- **Quant before qual.** Run the numbers first; brief the playtesters with
  the fights the numbers call suspicious.
- **Seeded and reproducible.** Every quantitative result records its exact
  invocation (stage, enemy, policy, deck, runs, seed). Every qualitative
  fight records how it was entered (fixture id or `/dev` trigger), the
  player's level and stats, and the foe.
- **Honest synthesis.** Where the numbers and the hands disagree, say so and
  lead with it. Never fabricate a cell, a transcript or a finding. "Unknown"
  is an acceptable result; false certainty is not.
- **One PR.** The report and the AUDIT rows ride one new branch and PR,
  ready for review, never draft, never auto-merged. No PR that repeats the
  previous run's findings unchanged.
- **Ambiguity:** make the most reasonable assumption, record it under
  `## Open questions`, and continue.

## 4. What to measure

**Layer 1 — the numbers.**

- *The stat curve (read from source, no simulation).* For each stage
  profile: its `playerLevel` and `playerBaseStats`; the stat total a real
  player reaches at that level (the fresh-start character's stats plus
  `STAT_POINTS_PER_LEVEL` × levels gained); the player's VITAE at that
  block (`buildStagePlayer` derives it); a Blow's damage (`5 × body ÷ 5`);
  and each survivor's VITAE and per-phase damage from its block in
  `src/Enemy/enemy.library.ts`. From these: Blows to kill each survivor,
  threat phases to kill the player. Note that the stage profiles are
  calibration anchors from the old campaign (levels 3, 20, 45, 50) while
  Act 1 is sized for about 3–4 level-ups (`plan/revamp/progression.md`); a
  mismatch between the two is itself a finding for R9.
- *The matrix.* `runPlaytestMatrix` (`src/Combat/combat.playtest.ts`) over
  stage profiles × sim policies × the grey deck, `--runs` seeded
  encounters per cell. Read per cell: win rate, the
  victories/mercies/defeats/retreats split, average rounds and its spread.
  `--cards` adds per-card usage for the three grey cards.
- *The survivors.* The matrix only fields enemies on a stage's roster.
  Until R2 re-points the rosters in `src/Combat/combat.stage-profiles.ts`,
  `--enemy=float-eye` (or either other survivor) fails with "not in any
  selected stage roster". In that case sweep each survivor through the
  combat CLI's auto-play instead, which accepts an explicit enemy with any
  stage player: one run per seed, 20 seeds per survivor per stage, and
  tally wins, losses and rounds yourself.
- *Risk.* The matrix does not report the player's lowest VITAE. Read risk
  from defeats and rounds here, and from the playtesters' lowest-VITAE
  notes in Layer 2. If that proves too thin to answer question 2, file the
  missing metric as a `plan/AUDIT.md` row; do not build it in this skill.

**Layer 2 — the hands.** 2–3 `playtester` sub-agents
(`.claude/agents/playtester.md`), spawned in parallel. The agent plays the
local expo-web build through Playwright; it has no shell and does not drive
the CLI. Each is assigned one or two survivors and a player level, and
returns the structured report its agent file mandates. Ask each, per fight:
won or lost, the lowest VITAE reached, how many phases it took, and whether
the fight ever felt dangerous or was ever hopeless.

## 5. The procedure

### Step 0 — Sync and sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- Cold-run the playtest suites:
  `npx vitest run src/Combat/e2e/combat-playtest.matrix.sim.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`.
- If anything fails before you start, stop and report the pre-existing
  failure.
- Read `src/Combat/combat.stage-profiles.ts` and note whether its rosters
  already field the survivors (after R2) or still list pre-reset foes.

### Step 1 — The stat curve
Work question 1 from source (§4 Layer 1, first bullet). Write it as one
table per stage: level, assumed stats, reachable stats, VITAE, Blow damage,
Blows to kill each survivor, phases to kill the player.

### Step 2 — The matrix and the survivor sweep
```
npm run combat-playtest -w axiomancer-mechanics -- --stage=all --policy=greedy --deck=preset:grey --runs=60 --seed=1 --cards
npm run combat-playtest -w axiomancer-mechanics -- --stage=all --policy=blind --deck=preset:grey --runs=60 --seed=1
```
`greedy` is the ceiling witness and `blind` the player-feel witness
(`docs/playtest.md`). Add `--json` for the raw `PlaytestReport`.

Per survivor, once the rosters field it:
```
npm run combat-playtest -w axiomancer-mechanics -- --stage=all --enemy=the-doorwarden --policy=blind --deck=preset:grey --runs=60 --seed=1
```

Until then, per survivor, stage and seed:
```
npm run combat -w axiomancer-mechanics -- --enemy the-doorwarden --stage early --deck preset:grey --auto --policy status --seed 1 --max-turns 40 --json-events
```
Raise `--max-turns` (default 8) until every run resolves; a run that hits
the cap is recorded as unresolved, not as a loss.

Flag: any survivor the grey deck cannot beat at the level the player meets
it; any survivor that never defeats the player at any level; any stage
whose assumed stats a real player cannot reach (or overshoots).

### Step 3 — Spawn playtester agents (parallel)
Start the local expo-web build (`npm run web -w axiomancer-mobile`, serving
`http://localhost:8081`) if it is not running. Then spawn 2–3 `playtester`
sub-agents in one batch, each with:
- the base URL and one or two survivors to fight,
- how to reach them: read `axiomancer-mobile/docs/playtest-guides/combat.md`
  first; enter at a state fixture
  (`http://localhost:8081/exploration?fixture=<id>`, ids in
  `src/Game/fixtures/state-fixture.registry.ts`) whose level matches where
  the player meets that foe, then fire the foe from `/dev`
  (`debug-enemy-map-<map>` then `debug-enemy-<enemyId>`),
- the suspicious fights from Steps 1–2,
- the per-fight questions from §4 Layer 2.

### Step 4 — Synthesize and file
Write `docs/reports/playtest-<ts>.md`:
- the stat-curve tables (Step 1),
- the matrix and sweep tables with their invocations (Step 2),
- each agent's report, verbatim or tightly excerpted with its fights table
  intact,
- a per-survivor scorecard: numbers say / hands say / agree?,
- **the answers**: question 1 (tracks / drifts at `<stage>` / unknown) and
  question 2 per survivor (winnable yes/no, at risk yes/no), each with its
  two or three load-bearing pieces of evidence,
- `## Open questions`.

Then file each finding as a Pending row in `plan/AUDIT.md`:

```markdown
### [<category>] <one-line finding> (<YYYY-MM-DD>)
- category: <divergence | gap | tests | ...> (`plan/bearings.md` → AUDIT category taxonomy)
- impact: <0-10>
- ease: <0-10>
- evidence: docs/reports/playtest-<ts>.md; <the seeded invocation or fight>
- owner: <R9 retune | B2 enemy revamp | an /iterate-sized fix>
```

Check `plan/AUDIT.md` first and update an existing row rather than filing a
duplicate.

### Step 5 — Deliver on ONE PR
- **Cross-package verify:** before opening the PR, run
  `git diff --name-only`; if any changed path matches the cross-package
  impact checklist in `AGENTS.md`, run the consumer gates it names and block
  the PR on failure. (A report-only PR normally matches none; check anyway.)
- Branch off base: `git checkout -b playtest/combat-<ts>`.
- Stage the report and `plan/AUDIT.md`.
- Commit: `docs(playtest): combat playtest <ts> report`.
- Push and open a PR (ready for review): title
  `playtest(combat): <ts> — <one-line answer>`; the body carries the two
  answers, the scorecard and the AUDIT rows filed. Never draft, never
  auto-merge, never push `main`.

### Step 6 — Report back
One concise message: the PR URL, the two answers, and the AUDIT rows filed.

## 6. Hard rules

- **Report-only.** No edits to engine constants, XP, stats, enemy data, card
  data, sandbox sets or test thresholds. Findings are AUDIT rows for the
  phase that owns them.
- **No content.** Never propose a new card, keyword, enemy, relic or item
  as a fix (D37, D58). "The grey deck cannot beat X at level N" is the
  finding; the answer belongs to R9 or B2.
- **Never push to `main` automatically. Never auto-merge.**
- **Seeded runs only** for quantitative evidence; every cited result
  carries its full invocation.
- **Agent reports are quoted honestly**, including losses, boredom and
  verdicts that contradict the numbers.
- **Preserve canonical terms** (VITAE, Conviction, GUARD, stage ids, policy
  ids, survivor slugs).
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **A suite fails before any run.** Stop; report the pre-existing failure.
2. **`--enemy=<survivor>` rejected by the matrix.** Expected before R2; use
   the auto-play sweep (Step 2) and say so in the report.
3. **A playtester agent returns malformed or empty output.** Re-spawn once
   with a tightened brief; if it fails again, proceed with the others and
   record the gap under `## Open questions`.
4. **The expo-web build will not start.** Deliver the quantitative layer
   alone and record the missing qualitative layer as an open question.
5. **Numbers and hands flatly disagree.** That is the finding; lead with it
   and recommend a focused follow-up rather than picking a side.
6. **The sweep is too slow.** Reduce `--runs` (or seeds) before reducing
   coverage; record the reduced counts.

## 8. Quick reference

**Matrix CLI:** `npm run combat-playtest -w axiomancer-mechanics`
(`src/CLI/combat-playtest.cli.ts`). Flags: `--stage=early|mid|late|impossible|all`
(default all), `--policy=<id|all>` (default greedy), `--deck=<selection>`
(default policy-pick; the grey deck is `preset:grey`), `--enemy=<slug>`
(must be on a selected stage's roster), `--runs=N` (default 60), `--seed=N`
(default 1), `--sandbox=<setId>`, `--cards`, `--json`, `--log-level=<level>`,
`--log-file=<path>`. `--upgradeable-dice` is an accepted no-op;
`--legacy-dice` fails loudly.

**Combat CLI (auto-play sweep):** `npm run combat -w axiomancer-mechanics --`
with `--enemy <slug>`, `--stage <id>`, `--deck <selection>`, `--preset <id>`
(character preset; a `--stage` player is built when absent), `--seed <n>`,
`--auto`, `--policy naive|safe|aggressive|status`, `--max-turns <n>`,
`--json-events`, `--script <path>`, `--stdin`, `--state-log <path>`,
`--sandbox <setId>`, `--log-level <level>`, `--log-file <path>`.

**Machinery:** `runPlaytestMatrix` / `formatPlaytestReport`
(`src/Combat/combat.playtest.ts`) · stage profiles and `buildStagePlayer`
(`src/Combat/combat.stage-profiles.ts`) · policies
(`src/Combat/combat.sim-policies.ts`) · deck selections
(`src/Combat/combat.deck-draft.ts`) · survivors
(`src/Enemy/enemy.library.ts`) · stat points and XP
(`src/Game/game-mechanics.constants.ts`).

**Contract tests:** matrix determinism
`src/Combat/e2e/combat-playtest.matrix.sim.test.ts` · smoke
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` · card coverage
`src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.

**One-page reference:** `docs/playtest.md` (stage table, policy roster, deck
grammar, commands). Where it still teaches the old status doctrine or the
preset win-rate curve, it is stale; the questions above govern this skill.

**Sub-agent:** `.claude/agents/playtester.md`.

**Plans:** `plan/revamp/enemies.md` (the survivors) ·
`plan/revamp/progression.md` (R9, the curve target) · `plan/AUDIT.md`
(where findings land).
