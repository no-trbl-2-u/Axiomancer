---
description: Hazard minigame balance loop — use hazard CLI evidence to analyse card ratios, thresholds, mana economy against CDR-0006 targets; numeric changes + report via PR.
---

> **⚙️ Runs against the `axiomancer-mechanics` package.** Repo-relative paths below
> (`src/…`, `automation/…`, `scripts/…`) are relative to that package — run from it (`cd axiomancer-mechanics`) or via
> `npm run <script> -w axiomancer-mechanics`.

# Skill: hazard-tuning

> **High autonomy within hard guardrails.** Analyse the hazard minigame's
> mana economy, card ratios, threshold ladder, and scoring bands against
> published design targets. Deliver findings and any numeric changes on ONE
> new branch + PR. Nothing auto-lands on `main`.

## North star — playable crises, not passive damage popups

Per `docs/hazard-minigame.md` (CDR-0006), the hazard minigame must feel like
a **Mage Knight-style tactical puzzle**, not a stat check. The player should
assemble a solution under pressure — not just sum numbers until they exceed a
threshold. The witness for this path is a round where the player uses
**enchantments, X-interaction cards, mana conversion, or combo effects** to
solve a crisis they could not have cleared on direct progress alone.

A change that makes flat rounds (play numbers, check threshold) the dominant
pattern works against this vision. Treat high flat-round rate as a balance
failure even when clear rates look healthy. The design targets
from the PRD are the objective function.

## 1. Purpose

`/hazard-tuning` is the hazard balance loop. It reads the shipped content
libraries, exercises the hazard CLI flow (`npm run hazard -- ...`) and the
hermetic e2e suite, interprets results against CDR-0006 design targets, and
delivers a report — with any applied numeric changes and any applied
structural fixes — together on one branch and PR (THE OPEN GATE ¶5,
2026-08-28: architecturally significant findings may ship too, not just get
proposed). When the task asks for
player-feel, mobile UX, or Kid-style playtesting, the skill must also use the
mobile dev menu path in `axiomancer-mobile` as a live witness; CLI evidence alone
does not answer phone-interaction questions.

**Known documentation drift to check first:** Hazard implementation has moved
from split library files to `hazard.content.ts` + `hazard.tuning.ts` +
engagement/deck-flag modules. Treat old doc references to
`hazard.cards.library.ts`, `hazard.hazards.library.ts`, H01/H02 IDs, or
top/bottom route labels as historical shorthand. Before editing, verify
current exports and CLI flags from `src/World/Hazard/index.ts`,
`src/World/Hazard/hazard.content.ts`, and `src/CLI/hazard.cli.ts`.

**There is now a hazard testing CLI flow.** Use `npm run hazard -- [flags]`
(a `game.cli.ts hazard` alias) as the empirical witness before applying
tuning changes. The hazard CLI provides deterministic seeded
runs, route/hazard selection, greedy auto play, JSON events, and JSONL state logs:

```bash
npm run hazard -- --auto --seed 42 --runs 1 --hazard H01 --route top --json-events --state-log /tmp/hazard-H01-top-42.jsonl
npm run hazard -- --auto --seed 5 --runs 3 --hazard H02 --route bottom --json-events --state-log /tmp/hazard-H02-bottom-5.jsonl
```

Use those logs to measure actual `computeFinalScore` and `hazard:summary`
outcomes. If the CLI still cannot measure a specific axis directly, say exactly
which axis is blocked and why; do not invent a fake harness measurement.

## Mobile live-playtest witness — Kid path

Use this whenever the final report must judge touch complexity, learnability,
deck feel, reward choice feel, or whether the minigame behaves correctly on a
phone-sized surface.

Package: `axiomancer-mobile` (run the commands below from that package).

1. Export/serve a dev-enabled web build so the dev menu exists:

   ```bash
   BUILD_PROFILE=preview npx expo export --platform web --output-dir .audit-dist
   node scripts/audit-serve.mjs
   ```

2. Open `http://127.0.0.1:4173` at the mobile audit viewport when using the
   browser/Playwright path. The dev menu lives under SELF.

3. Trigger Hazard through the dev menu:
   - preferred direct path: `SELF → DEV MENU → DEBUG · HAZARD → BRAVE IT`
     (`data-testid="debug-hazard-button"`);
   - encounter path: `SELF → DEV MENU → DEBUG · TRIGGER ENCOUNTER → HAZARD`
     (`data-testid="debug-trigger-encounter-hazard"`).

4. If accessibility-level clicks fail to visibly route, use the DOM/test-ID
   activation as automation fallback and record that as UX evidence, not balance
   evidence. Prior Kid evidence showed this exact failure mode.

5. For reproducible sessions, set `globalThis.__AXM_HAZARD_SEED__` and
   `globalThis.__AXM_HAZARD_ID__` before triggering the hazard. Mobile honors
   those overrides in `state/hazard/store-actions.ts`.

6. To test non-starter deck feel, use the dev menu control
   `DEBUG · RANDOMIZE HAZARD DECK → SHUFFLE FATE`
   (`data-testid="debug-hazard-deck-randomize"`). It replaces acquired hazard
   cards with ten random grants from the starter + reward pool while leaving the
   implicit starter bag intact. Use this for variety passes, but note that it is
   random deck variety, not curated archetype testing.

7. A Kid final report for Hazard must answer, at minimum:
   - Does the phone interaction stack feel overloaded: card staging, die drag,
     salvage, detail overlays, and Play commitment?
   - Are card keywords and archetype readable from tap overlays?
   - Are projected results clear before Apply/Play?
   - Does reward choice read as: in-focus obvious benefit, stronger off-focus
     temptation, or remove-card option?
   - Is deck growth/scarring legible enough to justify a dedicated hazard deck
     screen?

## 2. Invocation

```
/hazard-tuning
/hazard-tuning --focus="top-route clear rate"
/hazard-tuning --focus="X-die economy"
/hazard-tuning --focus="final-round pressure"
/hazard-tuning --focus="deck ratios"
/hazard-tuning --focus="bottom-route reward delta"
/hazard-tuning --focus="mana exhaustion cliff"
```

`--focus` narrows which tuning axis the skill prioritises in its analysis
and its change set. Without `--focus`, the skill runs a full sweep of all
axes in the quick-reference table below.

## 3. Autonomy contract

- **Numeric and content-level, plus evidenced structural fixes.** The skill
  may change card top/bottom effect values, bottom mana costs, hazard card
  round thresholds, round counts, and reward/penalty magnitudes in the
  library files. **NEW CONTENT ITEMS are in scope** (THE PIPELINE
  LIBERATION, T direct 2026-08-22 — `plan/bearings.md`): new hazard cards
  composed of existing verb classes, new hazards, and new subquests, shipped
  with tests and CLI evidence. Structural RULES changes (new progress types,
  new die states, new card verb classes, state-machine/engine edits) may
  also ship — evidenced, and through the normal verify + deploy gates like
  any other change (THE OPEN GATE ¶5, 2026-08-28 lifted the propose-only
  wall on architecturally significant findings). Write the rationale and
  evidence into the report either way.
- **Baseline before delta.** Every proposed change is compared against the
  current shipped values. The report records `old → new` with a one-line
  rationale for each change. No change is applied without a documented reason
  grounded in the design targets below.
- **CLI evidence before edits.** Before applying any numeric tuning change, run
  the hazard CLI against the relevant hazard/route/seed matrix and save the
  JSONL state logs outside the repo or under an ignored artifact path. The report
  cites the exact command(s), seed(s), route(s), pass count, mark strings, and
  total score evidence that motivated the change.
- **The verify gate is non-negotiable.** After any change, `npm run verify`
  must pass before the change is staged. If a change breaks any test, revert
  it and record it under "Considered but not applied".
- **Known engine gaps are not tuning levers.** Several engine behaviours differ
  from CDR-0006 doctrine or carry explicit TODO markers (see §6). Do not tune
  numbers to compensate for unimplemented engine behaviour. Flag the gap in the
  report instead.
- **One PR carries everything.** The findings report, the suggestions (with
  library snapshots), and any applied numeric changes all ride a single new
  branch + PR. The PR is ready for review, never draft, never auto-merged.
- **Standing law.** Unknown is an acceptable terminal state; false certainty is
  not. If evidence remains insufficient after the hazard CLI matrix, tests, and
  repo inspection, report the knowns, unknowns, blocker, changed state, and next
  evidence-bearing step instead of pretending certainty.
- **Fail together.** Verified failure beats unverified success. Do not fabricate
  measurements, PR state, test output, file contents, or completion. Preserve the
  partial state, name the failed gate, and keep the report useful to the next
  worker.
- **Ambiguity → document and proceed.** If a focus target is unclear, or a
  structural idea is architecturally significant but the evidence to ship it
  isn't there yet, make the most reasonable assumption, document it under
  `## Open questions` in the suggestions file,
  and continue.

## 4. Design targets (the objective function)

These are the shipped design targets from CDR-0006 and the PRD. The skill
measures reported evidence against them; deviations are candidates for tuning.

| Axis | Target |
|---|---|
| Safe route (top) clear rate (sessions 1–2) | 70–80% |
| Risk route (bottom) clear rate (sessions 1–2) | 40–60% |
| Final round mana crisis rate | >50% of runs enter the final round with ≤1 available die |
| Flat round rate | <2 per session |
| X-interaction card appearance rate against 2+ X dice | >40% (note: expected X dice per roll is now ~1.3 with 2 X faces) |
| Safe-route final round completable without mana | Always (top-action progress floor ≥ threshold) |

Threshold calibration baseline (from CDR-0006 §Balance Notes):

- **Top actions only, no mana:** reliable floor ~5–7 progress per round.
- **1 mana-enabled bottom action:** ~10–12 per round.
- **2 bottom actions:** ~14–16 per round.

This means safe-route thresholds of 5–7 clear without mana (correct), and
risk-route thresholds of 8–11 per meter require at least one available die (correct).
Final-round +2–+3 uplift requires at least one die entering the final round
(the intended cliff).

Die X frequency is now 2/6 per die (expected ~1.3 X per opening roll). Factor this into
mana availability estimates. Safe route final-round completability without mana is more
critical than before, since available dice are scarcer at baseline.

## 5. The procedure

### Step 0 — Sync & sanity

- Ensure a clean working tree. Note the base branch (usually `main`).
- `npm ci` if `node_modules` is absent.
- Run the hazard CLI e2e smoke cold:
  `npx vitest run src/CLI/e2e/hazard.cli.engine.test.ts`.
- Run `npm test` cold. If any test fails before you touch anything, stop
  and report the pre-existing failure — do not proceed.

### Step 1 — Read the libraries

Read these files in full before forming any hypothesis:

- `src/World/Hazard/hazard.content.ts` — the authored content: action-card
  deck (`HAZARD_DECK`), reward cards (`HAZARD_REWARD_CARDS`), the hazard
  library (`HAZARD_LIBRARY`) with route thresholds and reward/consequence
  tables, keywords, and sub-quests.
- `src/World/Hazard/hazard.tuning.ts` — the numeric tuning registry
  (`HAZARD_TUNING`): card stat bands, round/dice/hand constants, die face
  distribution (`HAZARD_DIE_FACES`), and reward magnitudes.
- `src/World/Hazard/hazard.engagement.ts` — deck focus/scars, reward offers,
  sub-quest drafting (read for context; engagement logic is structural).
- `src/World/Hazard/hazard.deck-flags.ts` — starter bag and acquired-card
  deck encoding (read for context).

Identify the current values for every axis in the design targets table.

### Step 2 — Run the hazard CLI evidence matrix

Use the CLI before changing values. Minimum sweep for a full run:

- top route and bottom route for every relevant hazard in scope;
- at least 5 fixed seeds per route for broad sweeps (`1 2 3 4 5` is acceptable
  for a first pass; use more if the result is noisy);
- `--auto`, `--json-events`, and `--state-log` on every run;
- logs written to `/tmp` or another ignored artifact location unless the task
  explicitly asks for committed evidence artifacts.

Example one-off command:

```bash
npm run hazard -- --auto --seed 42 --runs 1 --hazard H01 --route top --json-events --state-log /tmp/hazard-H01-top-42.jsonl
```

Example shell loop for a focused hazard:

```bash
for route in top bottom; do
  for seed in 1 2 3 4 5; do
    npm run hazard -- --auto --seed "$seed" --runs 1 --hazard H01 --route "$route" \
      --json-events --state-log "/tmp/hazard-H01-${route}-${seed}.jsonl"
  done
done
```

Parse each JSONL log for:

- `computeFinalScore.event.finalScore`
- `computeFinalScore.event.marks`
- `computeFinalScore.event.route`
- `computeFinalScore.event.ledger`
- `illegalHazardAction` records, if present
- the final `hazard:summary` event when using multi-run commands

Report actual clear rate as `finalScore > 0`. Track mark strings (`OOX`, `OXX`,
etc.), total score, threatened-X, and any illegal-action skips. Treat repeated
illegal-action records as driver/policy evidence, not as player balance truth,
unless the same illegal action is player-facing and reproducible manually.

### Step 3 — Map evidence against targets

For each design target:

1. **Measure actual CLI rates first.** Use `finalScore > 0` from the hazard CLI
   logs for clear/pass rate. Compare top and bottom route rates against the
   targets. Keep the seed list fixed between baseline and after-change runs.

2. **Compute expected rates from the current numbers.** Apply the threshold
   calibration baseline. For each hazard card on each route, determine whether
   the round-by-round thresholds are clearable at the top-action floor, at
   one-bottom-action level, and at two-bottom-action level. Flag any round that
   falls outside its intended range.

3. **Compute X-interaction draw probability.** Given the current count of
   X-interaction cards in the 30-card pool, calculate the probability of
   drawing at least one in a 5-card hand. Compare against the 40% target.
   The current pool has 3 X-interaction cards; expected draw probability ≈ 43%
   against a 5-card draw from 30. Flag if a changed ratio drops below 40%.

4. **Map deck ratios.** Tally cards by class (direct-progress, focus,
   mana-conversion, mana-creation, card-draw, risk-sacrifice,
   failure-mitigation, synergy-combo, x-die-interaction, persistent-enchantment).
   Flag if direct-progress cards exceed 50% of the pool (flat-round risk per
   CDR-0006 §Design Tensions).

5. **Identify mana-cliff hazards.** For hazards with ≥3 rounds and no
   automatic refresh: after 2 dice spent per round, entering round 3 with zero
   available mana is the intended cliff. Identify any hazard where the final
   round threshold is clearable only with mana, on the top route — this is a
   balance failure per CDR-0006.

### Step 4 — Propose and apply numeric changes

For each axis that deviates from its target:

1. **Draft a change:** specify the file, the card or hazard ID, the old value,
   the new value, and a one-line rationale referencing the target.

2. **Apply the change** to the library file.

3. **Re-run the same CLI matrix with the same seeds.** Record before/after
   clear rate, mark distribution, and score deltas.

4. **Re-run `npm test`.** If any test fails: revert the change, record it
   under "Considered but not applied" with the failure mode.

5. **Re-evaluate the target** with the new numbers. Record the updated
   expected rate.

Do not apply more than one change per axis at a time. Measure each change
before the next.

### Step 5 — Record known engine gaps

Before closing the report, cross-check the following known gaps between CDR-0006
doctrine and the shipped engine. Do not tune numbers around them — flag them.

> **Superseded (2026-09-23):** the table below predates the current `hazard.engine.ts` (its cited identifiers — `penaltiesApplied`, `advanceToNextRound`, `processBetweenRounds`, `resolveRound`, the `hazard.engine.ts:221` TODO — no longer exist in the engine; the round resolver is `resolveHazardRound` / `continueHazardAfterResolve`) and must be re-derived against it — live truth: `axiomancer-mechanics/src/World/Hazard/hazard.engine.ts`. Body kept as a historical record pending rewrite (plan/AUDIT.md).

| Gap | Shipped state | CDR-0006 doctrine |
|---|---|---|
| Per-round failure penalties | Not yet applied (`penaltiesApplied: []` TODO in `hazard.engine.ts:221`) | Applied per round on X resolution |
| Dice refresh between rounds (spent) | `refreshDiceBetweenRounds` resets all spent dice to available | Spent dice do not auto-refresh; only enchantments can refresh spent dice |
| Exhausted dice reset | Not verified | Exhausted dice reset to available between rounds automatically (not spent dice) |
| Dual-type round resolution | Not verified against full dual-type check | Risk route: both types must be met to score O (BOTH REQUIRED); safe route: single threshold |
| Persistent map benefits | Types defined but not wired to world state | H08, H12, H15 emit map events |
| Die color set | Engine may reference green/yellow | Accepted die colors: red, blue, purple, gold, x (×2). No green or yellow. |

If a gap materially affects a tuning axis (e.g., the penalty gap means VITAE
drain cannot be fully measured), record it in the report with the blocking axis
noted. If no existing CLI or test surface can expose the axis, extend the CLI
or harness directly to expose it when that is the fastest path to real
evidence (THE OPEN GATE ¶5) — otherwise record a narrowly scoped harness-gap
entry in the report's findings section. Prefer the existing hazard CLI
evidence flow over new harness requests when it already covers the axis.

### Step 6 — Deliver on ONE PR

- **Cross-package verify** — before opening the PR, run
  `git diff --name-only` against the changed paths; if any match the
  cross-package impact checklist in `AGENTS.md`, run
  `npm run verify -w axiomancer-mobile` and block the PR on failure.
- Create a branch off base: `git checkout -b balance/hazard-<ts>`.
- Write the findings report + suggestions to
  `docs/reports/hazard-tuning-<ts>.md` (create `docs/reports/` if it doesn't
  exist yet); stage it along with any changed content/tuning files.
- Commit: `balance(hazard): <ts> report + suggestions (<n> changes applied)`.
- Push and open a PR (ready for review):
  - Title: `balance(hazard): tuning <ts> (<n> applied)`
  - Body: headline deviation from targets; exact hazard CLI command matrix;
    seed list; before/after clear rates and mark distributions; each applied
    change (numeric or structural) with `old → new` and one-line rationale;
    any unshipped structural findings; the engine-gap table for known
    blockers.
- If no numeric or structural changes are applied but there are new findings or
  newly-flagged engine gaps, open the PR carrying the report only. Do not open
  a no-op PR if nothing has changed from the previous tick's findings.

### Step 7 — Harness gap filing

The hazard CLI now covers deterministic seeded playthrough evidence. Only file a
harness-gap entry when the CLI cannot expose the needed metric even through
`--auto`, fixed seeds, `--runs`, `--json-events`, and `--state-log`. Follow the
existing candidate format:

```markdown
### Hazard simulation harness
**Why:** The existing `npm run hazard -- --auto --seed ... --json-events --state-log ...`
flow cannot expose [axis] because [specific blocker].
**Scope:** Extend `src/CLI/hazard.cli.ts` or add a thin parser/report helper that
keeps the existing CLI contract and emits [missing metric].
**Unlocks:** Empirical evidence for [axis] without manual log reconstruction.
```

Do not invent a fake invocation. Do not claim a measurement was taken that was
not present in CLI output, JSON events, state logs, or committed tests.

## 6. Hard rules

- **Never push to `main` automatically.** Report, suggestions, and any applied
  changes all ride the PR branch. A human merges.
- **Never auto-merge the PR.** T approves.
- **Never bypass `npm run verify`.** A change that does not survive the verify
  gate is not applied.
- **`hazard.engine.ts` and `hazard.types.ts` are not a numeric-tuning
  workaround.** Do not edit engine logic or type contracts to compensate for
  a numeric miss — the tuning surface for that is the content/tuning files:
  `hazard.content.ts`, `hazard.tuning.ts`. A genuinely structural fix (new
  progress type, die state, card verb class, state-machine/engine edit) may
  ship directly, evidenced and through the verify + deploy gates like any
  other change (THE OPEN GATE ¶5, 2026-08-28 lifted the propose-only wall
  on architecturally significant findings) — no owner sign-off required.
- **New progress types, die states, or card verb classes are legal
  structural additions when evidenced** (THE OPEN GATE ¶5) — ship them
  through the full checklist (types, engine, tests), not as an unproven
  numeric-tuning shortcut.
- **Preserve canonical terms VITAE and STANCE** in all authored text.
  VITAE is the player's life resource. STANCE is a combat term. Do not rename
  either to HEALTH/GUARD. Do not invent new STANCE semantics beyond what
  shipped hazard content already uses — but hazard content may impose STANCE
  penalties per the shipped docs; that is correct usage, not an error.
- **UI issues are not hazard balance evidence.** Do not treat UI rendering
  issues as balance failures or factor them into tuning quality. `/hazard-tuning`
  never approves, merges, or releases anything — it opens a PR for T review
  only. If known UI blockers exist at the time of the run, note them separately
  in the PR body; they do not invalidate the findings, but T may withhold
  approval until they are resolved.
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **`npm test` fails before any change.** Stop. Report the pre-existing
   failure. Do not proceed with tuning until the test suite is green.

2. **A library file cannot be parsed / IDs are inconsistent.** Read the file
   directly and verify card IDs against the exported constants. Report the
   inconsistency before touching values.

3. **A proposed change breaks a test.** Revert immediately. Record the failed
   change under "Considered but not applied" with the test name and failure
   message. Continue with other axes.

4. **An engine gap blocks measurement of a target axis.** First try the hazard
   CLI evidence flow (`--auto`, fixed seeds, `--json-events`, `--state-log`). If
   the axis still cannot be measured, extend the CLI/harness directly when
   that's the fastest path (THE OPEN GATE ¶5), or record a narrowly-scoped
   harness-gap entry in the report's findings section. Exclude that axis from
   applied changes and report it clearly in the PR body.

5. **No axis deviates from target / no change is warranted.** Open a PR with
   the report only if the analysis surfaces anything new (a freshly-identified
   gap, a changed ratio from a prior change). Skip the PR if nothing differs
   from the previous tick.

6. **Focus matches no hazard or card content.** Run the full sweep. Note that
   the focus filter was empty and the full sweep was used instead.

## 8. Quick reference

**Content + tuning (the tunable surface):**
- Authored content: `src/World/Hazard/hazard.content.ts`
  (`HAZARD_DECK` action cards, `HAZARD_REWARD_CARDS`, `HAZARD_LIBRARY`
  hazards with thresholds and reward/consequence tables, keywords,
  sub-quests)
- Numeric registry: `src/World/Hazard/hazard.tuning.ts`
  (`HAZARD_TUNING` card stat bands, round/dice/hand constants,
  `HAZARD_DIE_FACES`, reward magnitudes)

**Engine (read-only for this skill):**
- Core: `src/World/Hazard/hazard.engine.ts`
- Sim: `src/World/Hazard/hazard.sim.ts`
- RNG: `src/World/Hazard/hazard.rng.ts`
- Engagement (deck focus, scars, reward offers): `src/World/Hazard/hazard.engagement.ts`
- Deck flags (starter bag, acquired cards): `src/World/Hazard/hazard.deck-flags.ts`
- Public barrel: `src/World/Hazard/index.ts`

**Tests and CLI evidence:**
- Hazard CLI: `src/CLI/hazard.cli.ts`
- CLI command: `npm run hazard -- --auto --seed <seed> --runs <n> --hazard H01 --route top --json-events --state-log /tmp/hazard.jsonl`
- CLI e2e: `src/CLI/e2e/hazard.cli.engine.test.ts`
- Engine e2e: `src/World/Hazard/e2e/hazard.engine.test.ts`
- Run targeted CLI test: `npx vitest run src/CLI/e2e/hazard.cli.engine.test.ts`
- Run full suite: `npm test` (vitest run — includes all e2e suites)
- Balance sim evidence: `src/World/Hazard/e2e/hazard.balance.sim.test.ts`

**Design doctrine:**
- CDR-0006 rules + card set: `docs/hazard-minigame.md`
- PRD + success metrics: `docs/hazard-minigame-prd.md`
- Technical types + state machine: `docs/hazard-minigame-tdd.md`
- BDD scenarios: `docs/hazard-minigame-bdd.md`

**Tunable axes and CDR-0006 targets:**

| Axis | Files | Target |
|---|---|---|
| Hazard card thresholds (per round, top + bottom) | `hazard.content.ts` (`HAZARD_LIBRARY`) + `hazard.tuning.ts` | Top: 5–7/round; bottom: 8–11/round; final +2–+3 |
| Hazard round counts | `hazard.content.ts` (`HAZARD_LIBRARY`) | 3 (default), 4–5 (select hazards) |
| Action card top effect values | `hazard.content.ts` (`HAZARD_DECK`) + `hazard.tuning.ts` card bands | Top-action floor: 5–7 total progress per round |
| Action card bottom effect values | `hazard.content.ts` (`HAZARD_DECK`) + `hazard.tuning.ts` card bands | 1 bottom action: +5–+8 additional progress |
| Action card bottom mana costs | `hazard.content.ts` (`HAZARD_DECK`) | Validate 'any' vs specific color against die face distribution (`HAZARD_DIE_FACES` in `hazard.tuning.ts`) |
| Focus buff values | `hazard.content.ts` + `hazard.tuning.ts` card bands | Clear Mind top +2, bottom +5; adjust if top-route floor is wrong |
| Deck class ratios (direct-progress share) | `hazard.content.ts` (`HAZARD_DECK` + `HAZARD_REWARD_CARDS`) | Direct progress ≤ 50% of pool |
| X-interaction card count | `hazard.content.ts` | ≥3 cards; draw ≥40% against 2+ X dice per 5-card hand |
| Route reward magnitudes (VITAE, supply, items) | `hazard.content.ts` reward tables + `hazard.tuning.ts` reward magnitudes | Bottom reward must be genuinely better than top |
| Per-round failure penalty magnitudes | `hazard.content.ts` consequence tables | **Blocked — engine gap; penalty application not yet wired** |
| Scoring bands / reward tables | `hazard.content.ts` + `hazard.tuning.ts` | 3-round: 3O→strong, 2O→normal, 1O→minor, 0O→penalty |

**Known engine gaps (do not tune around; flag only):**

> **Superseded (2026-09-23):** the table below predates the current `hazard.engine.ts` (its cited identifiers — `penaltiesApplied`, `advanceToNextRound`, `processBetweenRounds`, `resolveRound`, the `hazard.engine.ts:221` TODO — no longer exist in the engine; the round resolver is `resolveHazardRound` / `continueHazardAfterResolve`) and must be re-derived against it — live truth: `axiomancer-mechanics/src/World/Hazard/hazard.engine.ts`. Body kept as a historical record pending rewrite (plan/AUDIT.md).

| Gap | File | Marker |
|---|---|---|
| Per-round failure penalties not applied | `hazard.engine.ts:221` | `TODO: Apply penalties for failed rounds` |
| Dice refresh between rounds (resets all spent) | `hazard.engine.ts` `advanceToNextRound` | Contradicts CDR-0006 §Mana Dice: spent dice should not auto-reset |
| Exhausted dice reset between rounds | `hazard.engine.ts` `processBetweenRounds` | CDR-0006: exhausted dice should reset to available; spent dice should not |
| Dual-type (risk route) round resolution incomplete | `hazard.engine.ts` `resolveRound` | Single-type check only; risk route requires both types to be met |
| Die color set in engine | `hazard.types.ts`, `hazard.tuning.ts` (`HAZARD_DIE_FACES`) | Engine may use old 6-color set; accepted colors are red/blue/purple/gold/x only |
| Persistent map benefits not wired | `hazard.types.ts` | `⚑ future phase` comments |
