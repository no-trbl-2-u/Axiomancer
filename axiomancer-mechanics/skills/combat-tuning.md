# Skill: combat-tuning

> **Tunes the Hazard-Pattern Combat (the card-and-dice driver,
> `resolveThreatPhase` / `playCombatCard`). The enemy's SOLE bar is HP —
> dropping it to 0 is the only win condition — and status effects are the
> EFFICIENT way to get there.** This is the primary combat system going
> forward. The legacy turn-based combat (`resolveCombatRound`, attack/defend,
> the playstyle matrix) has its own tuner, **`/legacy-combat-tuning`**, and
> remains until live encounters migrate off it.

> **High autonomy within hard guardrails.** Analyse the HP economy — enemy
> threat damage per tier, the stance-die bag, the Conviction → Signature economy,
> the variety/anti-spam reward, RPS read advantage, GUARD/defense soak, and the
> Befriend mercy gate — against design targets using the Monte-Carlo sim as the
> witness. Deliver findings and any numeric changes on ONE new branch + PR.
> Nothing auto-lands on `main`.

## Disambiguation — Hazard-Pattern Combat vs. Hazard Minigame

There are two separate "hazard" systems in this codebase. **This skill only covers
the fight system.**

| | Hazard-Pattern Combat | Hazard Minigame |
|---|---|---|
| What it is | Fights against enemies (HP, Conviction, status, GUARD) | Traversal / crossing events (force/escape, rounds, deck) |
| Skill | `/combat-tuning` ← **this file** | `/hazard-tuning` (`skills/hazard-tuning.md`) |
| Source root | `src/Combat/` | `src/World/Hazard/` |
| Sim witness | `simulateHazardPatternCombat` | `simulateHazard` |
| Card pool | `src/Combat/combat.cards.ts` (Body/Mind/Heart/GUARD cards) | `src/World/Hazard/hazard.content.ts` (force/escape/purge/foretell cards) |
| Dice | `COMBAT_DIE_FACES` in `combat.dice.ts` | `hazardDicePool()` in `hazard.engine.ts` |

Both systems use the same color scheme (red/blue/purple/gold) but are entirely
independent implementations — die-frequency changes in one do NOT affect the other.

Do not cross-contaminate: hazard minigame card mechanics (JEOPARDY, MIRACLE,
BUYBACK, DELVE, FORETELL, ECHO, SCOUR) are not present in combat cards and are
never a tuning lever here. They ARE valid design inspiration for future combat
card types — see the propose-only note in §4.

> **Win-model note (read first).** The original Spec 25 narrative describes a
> two-Pressure-Track win model (DoT Erosion + Control Saturation as the only win
> conditions). **That model was REMOVED on 2026-06-22.** The live model is
> HP-only (Spec 26 / 26b; canonical in `VISION.md` → Combat vision and
> `docs/combat.md`). There are no pressure tracks, no clear thresholds, no
> `effectPressure` / `MOMENTUM_CAP`. If you still see those terms anywhere in
> tooling, they are stale.

## North star — status is the EFFICIENT path to the only win condition

Per `VISION.md` / `CLAUDE.md`, **status effects are the MAIN fun of combat.**
The enemy has ONE bar: HP. Dropping it to 0 (`isDefeated(enemy)`) is the only
win condition. Status is what makes that *efficient*:

- **DoT erodes HP far faster than the deliberately weak basic strike.** Direct
  damage is scaled DOWN (`DIRECT_DAMAGE_WEIGHT`) so a pure-strike line is the
  slow, weak baseline — it must NOT keep pace with a status line, and on a boss
  it should be unable to close inside the authored window.
- **Control genuinely hinders the enemy.** A stun/skip/confusion robs the enemy
  of its telegraphed threat turn (`canAct`), instead of filling a separate
  meter. It buys tempo, not a second win bar.
- **Befriend at low HP opens the spare/exploit mercy choice** — a distinct,
  non-HP-kill resolution, gated on the enemy's HP fraction.

So the tuning questions are:

1. **Does status beat basic attacks?** A DoT loadout must out-perform a
   pure-strike loadout — decisively on a boss where strikes alone cannot close.
   A pure-strike line that wins as fast as a status line is a balance failure
   (the doctrine inversion the worker law forbids).
2. **Is status the central, *engaged* path?** `statusEngagement` (share of plays
   that landed a status on the enemy) must stay high for a status loadout; a
   pure-strike loadout lands zero. Low engagement = a balance failure even when
   win rates look healthy.
3. **Is the fight an assembled solution, not a one-card spam?** The Slay-the-
   Spire failure mode is "one-card-combo sameness" — one DoT card spammed every
   turn. Spec 26b §3 rewards status VARIETY and curbs single-card spam; the
   witness for a healthy fight is varied card play that reads the enemy stance
   (RPS), rides the combo die-refresh, and banks/spends Conviction on
   Signatures — not a single dominant line.
4. **Is the Befriend mercy path live?** A control+befriend loadout should reach
   the spare (`mercy`) outcome on a low-HP foe, distinct from a DoT kill
   (`victory`).
5. **What does a REAL player feel?** Tune player-facing difficulty against the
   **`blind`** policy (drafts off only visible info — stance hidden until
   revealed), and ceilings against **`greedy`** (omniscient).

A change that lets a pure-strike line keep pace, collapses status engagement,
makes a single card the dominant line, or closes the mercy path is a balance
failure even when win rates look healthy.

## 1. Purpose

`/combat-tuning` is the balance loop for the Hazard-Pattern Combat. It reads
the shipped engine constants + authored threat sequences, exercises the
**Monte-Carlo sim** (`simulateHazardPatternCombat`) under both the `greedy` and
`blind` policies, interprets results against the design targets below, and
delivers a report — with any auto-applied numeric changes and any propose-only
structural findings — together on one branch and PR.

It does NOT reimplement combat or invent metrics — the engine and the sim do
that. The skill is the orchestrator + the delivery layer.

**Player-feel / mobile witness.** When the task asks about phone-interaction,
card readability, HP/Conviction legibility, or playtest feel, also drive the
mobile combat board as a live witness — the dev tools route (`SELF → DEV MENU →
DEBUG · HAZARD COMBAT → ASSEMBLE`, `data-testid="debug-combat-encounter-button"`,
or navigate straight to `/combat-encounter`). Seed it with
`globalThis.__AXM_COMBAT_SEED__` for reproducible sessions. CLI/sim evidence
alone does not answer phone-interaction questions.

## 2. Invocation

```
/combat-tuning
/combat-tuning --focus="boss threat damage"
/combat-tuning --focus="status-beats-basic margin"
/combat-tuning --focus="conviction / signature economy"
/combat-tuning --focus="blind-vs-greedy gap"
/combat-tuning --focus="befriend mercy viability"
/combat-tuning --focus="single-card-spam"
/combat-tuning --focus="card-pool-variety"
/loop 6h /combat-tuning            # periodic autonomous tuning
```

`--focus` narrows which axis the skill prioritises. Without `--focus`, it runs
a full sweep of the axes in the quick-reference table below.

## 3. Autonomy contract

- **Numeric and content-level only.** The skill may change the tunable
  constants and authored threat-sequence factors listed in §8. **Structural
  rules changes** — new die states, new verb/signature classes, the impact
  formula (`effectImpact` in `combat.cards.ts`), the combo die-refresh rule, the
  RPS read ladder, the GUARD soak logic, the Befriend HP gate, the Conviction
  accounting, the state machine, or any engine function — are **propose-only**:
  written to the suggestions section, never applied without T approval.
- **Sim evidence before edits.** Before applying any numeric change, run the
  Monte-Carlo sim across the relevant enemy × seed matrix **under both policies**
  and record the before-state (win rate, V/M/D/R split, `avgRounds`,
  `statusEngagement`, `avgConvictionSpent`). After the change, re-run the SAME
  matrix (same seeds, same policies) and record the delta. Cite exact
  invocations and counts.
- **Baseline before delta.** Every change records `old → new` with a one-line
  rationale grounded in a design target. One change per axis at a time; measure
  each before the next.
- **The verify gate is non-negotiable.** After any change, `npm run verify`
  (type-check + tests-type-check + lint + test + build) must pass before
  staging. A change that breaks a test — including the balance-sim witness
  (`src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`) — is reverted and
  recorded under "Considered but not applied".
- **Never tune around an engine gap.** If an axis can't be measured (the
  scripted bot doesn't exercise it — e.g. the exploit/crit mercy branch, GUARD
  stacking, or specific Signature lines the policy never reaches), flag it — do
  not move numbers to compensate for behaviour the bot never triggers.
- **One PR carries everything.** Findings report + suggestions (with sim
  evidence) + any applied numeric changes ride a single new branch + PR, ready
  for review, never draft, never auto-merged.
- **Standing law.** Unknown is an acceptable terminal state; false certainty is
  not. **Fail together** — verified failure beats unverified success; never
  fabricate a sim measurement, PR state, or test output.
- **Ambiguity → document and proceed.** Unclear focus or an architecturally
  significant propose-only idea: make the most reasonable assumption, document
  it under `## Open questions` in the suggestions file, and continue. In a CI
  container there is no user to answer.

## 4. Design targets (the objective function)

Measured by the sim (`simulateHazardPatternCombat(player, enemy, runs, seed,
policy)`), which reports `{ runs, victories, mercies, defeats, retreats,
winRate, avgRounds, statusEngagement, avgConvictionSpent }`. Run with a
**competent strategist loadout** (skills spanning DoT, control, direct-damage,
and befriend across stances) at a level appropriate to the enemy, under BOTH
the `greedy` (ceiling) and `blind` (player-feel) policies.

| Axis | Target |
|---|---|
| Win rate — simple/normal (blind) | 80–95% |
| Win rate — elite (blind) | 50–70% |
| Win rate — boss (blind; fixed-level starting bosses excepted) | 30–55% |
| Greedy ≥ blind | the omniscient ceiling should meet or exceed the blind rate; a large gap means the read matters a lot (intended) |
| **Status beats basic** | a DoT loadout out-performs a pure-strike loadout; on a boss the strike line cannot close in-window, and DoT's `avgRounds` ≤ the strike line's |
| **Status engagement** | a status loadout keeps `statusEngagement` well above 0 (boss ≥ ~0.3); a pure-strike loadout lands `statusEngagement === 0` |
| Befriend mercy path | a control+befriend loadout reaches `mercies > 0` and `mercies ≥ victories` on a low-difficulty foe; a DoT loadout's `victories` exceed its `mercies` |
| Avg rounds to resolve | 3–8 (boss up to ~10); not a drag, not a one-shot |
| Single-card-spam check (propose-only metric) | no single skill id should account for >70% of a typical win's damage/impact — read `buildCombatSummary` attribution |
| **Combat card pool variety** | direct-damage/basic-strike cards ≤ 20% of the pool; the remaining pool must contain status (DoT + control), GUARD/defense, Befriend, and state-interactive cards — analogous to the hazard minigame's <15% pure-stat rule |
| **State-interactive card coverage** | at least one card per color pairing (Body/Mind/Heart) that reads game state (enemy stance, prior play, Conviction level) to scale its effect — pure-stat cards with no conditional are the baseline, not the norm |

**Propose-only design signal — hazard minigame mechanic equivalents:** The v0.32.2
hazard minigame introduced four engagement mechanics (JEOPARDY = bonus when losing,
MIRACLE = bonus on first play of a round, BUYBACK = card returns to hand when powered,
DELVE = scales with discard pile depth). None of these have combat card equivalents.
If a tuning run finds combat engagement flat or single-card-spam dominant, these
mechanics offer strong combat card archetypes:
- JEOPARDY → "low-HP bonus" or "last-stand" combat card
- MIRACLE → "opening gambit" card (bonus if first card played in a threat phase)
- BUYBACK → card returns to deck top when played with a WILD die
- DELVE → card scales with cards already played this encounter

These are structural additions — never apply in a tuning run, only note them under
"Propose-only findings" in the PR.

**Stance-die calibration baseline (Spec 25 §4.2, current bag):**
`COMBAT_DIE_FACES` = Heart/Body/Mind/Wild at 1/6 each + X at 2/6. Opening roll is
`COMBAT_DICE_COUNT` (4) dice; each turn rolls `TURN_DICE_COUNT` (2). Expected
~1.3 X and ~0.67 Wild per opening 4-dice roll. The combo loop refreshes a
matching die when a NEW status lands, so an effective, *varied* status line is
largely die-sustaining; a single-card or pure-strike line is not. RPS read:
advantage waives/ improves the action, neutral is baseline, disadvantage is
penalised — so phase-stance reading is the primary die-economy lever, and a GOLD
card with a WILD die always reads advantage.

**Conviction economy (Spec 26b §4):** Conviction (◆) accrues per turn from the
unpicked die (`CONVICTION_PER_UNPICKED_DIE`) and from winning the hidden-stance
read (`CONVICTION_READ_WIN_BONUS`), capped at `CONVICTION_CAP`. It funds the
always-available **Signature** kit (`combat.signature.ts`) — Read the Opponent
(scout), Press Fate (reroll), Second Wind (sustain), and damaging/control
Signatures — the agency lever the shuffled deck can't guarantee. A starved or
flooded Conviction economy is a tuning signal (`avgConvictionSpent`).

**Threat-damage derivation (HP model):** per-phase threat damage =
`threatDamageBudget(level, difficultyMult, phaseIndex, damageWeight)` =
`(THREAT_BASE + THREAT_PER_LEVEL × level) × DIFFICULTY_MULT[tier] × (1 + 0.2 ×
phaseIndex) × damageWeight`, with `THREAT_DAMAGE_SCALE` applied at resolution.
`DIFFICULTY_MULT` is the primary win-rate-band lever now (there are no clear
thresholds). GUARD from defense cards soaks a phase's hit before HP.

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree. Note the base branch (usually `main`).
- `npm ci` if `node_modules` is absent.
- Run the new-combat suites cold:
  `npx vitest run src/Combat/e2e/hazard-pattern-combat.engine.test.ts src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts src/Combat/e2e/defense-guard.engine.test.ts src/Combat/e2e/befriend-authority-hp-gate.engine.test.ts`.
- `npm test` cold. If anything fails before you touch a file, stop and report.

### Step 1 — Read the tuning surface
Read in full before forming a hypothesis:
- `src/Combat/combat.threat.ts` — `DIFFICULTY_MULT`, `THREAT_BASE`,
  `THREAT_PER_LEVEL`, the budget math, and how authored phases feed `damageWeight`
  / `threatEffectId` / `enemyHeal`.
- `src/Combat/combat.threat-sequences.ts` — `AUTHORED_THREAT_SEQUENCES`: per-phase
  `damageWeight`, threat effects, enemy heals, stance + stanceHint.
- `src/Combat/combat.engine.ts` — `TOP_ACTION_CHIP`, `CONVICTION_PER_UNPICKED_DIE`,
  `CONVICTION_READ_WIN_BONUS`, `COLOR_MATCH_DAMAGE_BONUS`, `THREAT_DAMAGE_SCALE`,
  `CONVICTION_CAP`, `DIRECT_DAMAGE_WEIGHT`,
  `THREAT_WEAKEN_PER_ROLL` (default 0.06 — hit fraction lost per roll-penalty point),
  `THREAT_DENY_AT` (default 8 — cumulative roll penalty that fully denies the turn),
  `THREAT_WEAKEN_FLOOR` (default 0.4 — min damage mult when weakened but not denied)
  (+ the RPS read / GUARD soak / mercy gate logic, which is **propose-only**).
- `src/Combat/combat.cards.ts` — `CONTROL_HARD_MULT`, `CONTROL_SOFT_MULT`,
  `DOT_PERROUND_WEIGHT`, `IMPACT_INTENSITY_CAP`, `GOLD_CARD_IDS` (the
  `effectImpact` formula itself is **propose-only**).
- `src/Combat/combat.dice.ts` — `COMBAT_DIE_FACES` (X/Wild frequency),
  `COMBAT_DICE_COUNT`, `TURN_DICE_COUNT`.
- `src/Combat/combat.signature.ts` — `SIGNATURE_SKILLS` costs/magnitudes,
  `SIGNATURE_KITS`, `SECOND_WIND_HEAL_FRAC`, `STRIKE_DAMAGE_MULT` (the kit
  STRUCTURE / kinds are propose-only; per-skill cost/magnitude are tunable).
- `src/Combat/combat.deck.ts` — `COMBAT_HAND_SIZE`.

**Step 1b — Card pool ratio audit.** After reading the above, tally combat cards
by class. Flag if the pool is outside the §4 targets:

| Class | What to count | Flag if |
|---|---|---|
| Direct-damage / basic-strike | Cards whose effect is a flat damage value with no conditions | > 20% of pool |
| Status (DoT) | Cards that apply a damage-over-time effect | < 25% of pool |
| Control (hard/soft) | Cards that apply stun, skip, confusion, or similar hindering effects | < 15% of pool |
| GUARD / defense | Cards that apply GUARD soak before HP | Exists (at least 1 per color family) |
| Befriend | Cards that enable the mercy path | At least 1 |
| State-interactive | Cards with a conditional bonus tied to game state (low HP, prior play count, stance match, Conviction threshold) | < 2 in pool |

If direct-damage cards exceed 20% or state-interactive cards are fewer than 2,
file under "Propose-only findings" (adding or removing card types is structural —
never applied autonomously).

### Step 2 — Run the sim evidence matrix
The sim is the witness. Drive it via the CLI for a quick read, and via a
throwaway vitest in `src/Combat/e2e/` (so path aliases resolve) or a node script
for bespoke loadouts — never commit the throwaway. Sweep:
- a curated tier spread (`MournfulGull`/`HushWraith` simple-normal,
  `CoastalTyrant` boss, `TheDisagreement`) plus the authored enemies in scope
  (`AUTHORED_THREAT_ENEMY_IDS`) + a default-sequence enemy for the generator path;
- a fixed strategist loadout (DoT + control + damage + befriend, level-matched);
- BOTH policies: `greedy` and `blind`;
- `simulateHazardPatternCombat(player, enemy, 300, startSeed, policy)` — 300
  seeded runs is the default; raise for noisy cells.

```
npm run combat-sim                                   # greedy, default loadout, all curated enemies
npm run combat-sim -- --blind                        # player-feel witness
npm run combat-sim -- --enemy=CoastalTyrant --runs=300 --seed=1 --blind
npm run combat-sim -- --loadout=slippery-slope,eternal-regress,befriend
```

Record per enemy/policy: `winRate`, the V/M/D/R split, `avgRounds`,
`statusEngagement`, `avgConvictionSpent`. For the status-beats-basic check, run a
DoT loadout vs a pure-strike (`DAMAGE_ONLY`) loadout on the same boss. For the
mercy check, run a control+befriend loadout vs a DoT loadout on a low-difficulty
foe and confirm the V/M split flips.

### Step 3 — Map evidence against targets
For each target: measure the sim rate under both policies, compute the expected
threat damage from the constants (use the §4 derivation), and flag any cell
outside its band. Pay special attention to the **status-beats-basic** invariant
(a pure-strike loadout must underperform and land zero status), the
**status-engagement** floor, and the **single-card-spam** check (read the
post-combat attribution via `buildCombatSummary` in `combat.attribution.ts`).

### Step 4 — Propose and apply numeric changes
For each off-band axis: draft the change (file, constant/sequence, old → new,
one-line rationale referencing the target); apply ONE; re-run the SAME sim
matrix with the SAME seeds and BOTH policies; record before/after;
`npm run verify`. If verify (or the balance-sim witness) fails, revert and
record under "Considered but not applied". Re-evaluate the target with the new
numbers.

### Step 5 — Deliver on ONE PR
- Branch off base: `git checkout -b balance/combat-<ts>`.
- Stage the findings report, the suggestions writeup, and any changed engine
  constant files.
- Commit: `balance(combat): <ts> report + suggestions (<n> applied)`.
- Push and open a PR (ready for review):
  - Title: `balance(combat): tuning <ts> (<n> applied)`
  - Body: headline deviation from targets; the sim matrix (enemies, seeds, run
    counts, both policies); before/after win/round/engagement/conviction deltas;
    each applied change with `old → new` + rationale; the propose-only section
    for structural findings.
- No applied changes but a new propose-only finding → PR with the report only.
  Do **not** open a no-op PR that repeats the previous tick's findings.

### Step 6 — Report back
One concise message: the PR URL and the headline win-rate / status-engagement /
status-beats-basic delta.

## 6. Hard rules

- **Never push to `main` automatically.** Report + suggestions + changes ride
  the PR branch. A human merges. **Never auto-merge.**
- **Never bypass `npm run verify`,** including the balance-sim witness.
- **Never edit the engine logic for tuning** — `combat.engine.ts` (RPS read,
  GUARD soak, mercy gate, Conviction accounting, `executeSkill`), `combat.cards.ts`
  (`effectImpact`), `combat.signature.ts` (kit structure / kinds),
  `combat.dice.ts` rules, or any state-machine / `applyEffect` path. The tuning
  surface is the constants + authored threat-sequence factors in §8 only. Logic
  changes are propose-only.
- **Never add new die states, verb/signature classes, or bring back the pressure
  tracks.** HP is the sole win condition; that is structural, not negotiable.
- **The effects engine is untouchable.** All shared effects + `applyEffect` +
  the resolution system are shared with the legacy combat and the rest of the
  game — never tune them here.
- **Preserve canonical terms** (VITAE/HP, STANCE, Conviction ◆, GUARD, Befriend
  mercy, the `greedy`/`blind` policy names).
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **A suite fails before any change.** Stop; report the pre-existing failure.
2. **A change breaks a test (incl. the balance-sim witness).** Revert; record
   under "Considered but not applied" with the test + failure.
3. **The sim can't exercise an axis** (the exploit/crit mercy branch, GUARD
   stacking, specific Signature lines the scripted bot never reaches). Flag it;
   propose a smarter sim policy; do not tune around it.
4. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**Tunable surface (numeric — editable):**

| Axis | File | Constant / target |
|---|---|---|
| Per-tier threat-damage multiplier (primary win-rate lever) | `src/Combat/combat.threat.ts` | `DIFFICULTY_MULT` (simple 0.7 / normal 0.92 / elite 1.08 / boss 1.5 / unique 1.45) |
| Threat-damage budget curve | `src/Combat/combat.threat.ts` | `THREAT_BASE` (4), `THREAT_PER_LEVEL` (0.95) |
| Authored threat sequences | `src/Combat/combat.threat-sequences.ts` | per-phase `damageWeight`, `threatEffectId`/`threatIntensity`, `enemyHeal` |
| Resolution threat scale | `src/Combat/combat.engine.ts` | `THREAT_DAMAGE_SCALE` (1.6) |
| Soft-control / stat-debuff threshold | `src/Combat/combat.engine.ts` | `THREAT_WEAKEN_PER_ROLL` (0.06), `THREAT_DENY_AT` (8), `THREAT_WEAKEN_FLOOR` (0.4) |
| Basic-strike weakness | `src/Combat/combat.engine.ts` | `DIRECT_DAMAGE_WEIGHT` (0.25) — keep status > strikes |
| Free top-action chip | `src/Combat/combat.engine.ts` | `TOP_ACTION_CHIP` (2) |
| Read color-match bonus | `src/Combat/combat.engine.ts` | `COLOR_MATCH_DAMAGE_BONUS` (3) |
| Conviction economy | `src/Combat/combat.engine.ts` | `CONVICTION_PER_UNPICKED_DIE` (1), `CONVICTION_READ_WIN_BONUS` (1), `CONVICTION_CAP` (12) |
| Status impact weights | `src/Combat/combat.cards.ts` | `CONTROL_HARD_MULT` (6), `CONTROL_SOFT_MULT` (4), `DOT_PERROUND_WEIGHT` (1), `IMPACT_INTENSITY_CAP` (3) |
| Stance-die bag | `src/Combat/combat.dice.ts` | `COMBAT_DIE_FACES` (X 2/6, Wild 1/6), `COMBAT_DICE_COUNT` (4), `TURN_DICE_COUNT` (2) |
| Signature costs/magnitudes | `src/Combat/combat.signature.ts` | per-skill `cost`/`magnitude`, `SECOND_WIND_HEAL_FRAC` (0.12), `STRIKE_DAMAGE_MULT` (3) |
| Hand size | `src/Combat/combat.deck.ts` | `COMBAT_HAND_SIZE` (6) |

**Propose-only (structural — never auto-apply):** the `effectImpact` formula
(`combat.cards.ts`), the RPS read ladder + combo die-refresh + GUARD soak + the
Befriend HP gate + Conviction accounting (`combat.engine.ts`), the Signature kit
structure / `kind`s (`combat.signature.ts`), die states / verb classes
(`combat.encounter.types.ts`), and richer sim policies (the scripted bot
under-exercises some lines — see §7).

**Engine + sim:**
- Engine: `src/Combat/combat.engine.ts` (driver) + `combat.{dice,deck,cards,signature,threat,threat-sequences,attribution}.ts`
- Sim (the witness): `simulateHazardPatternCombat` + `runOneEncounter` in `src/Combat/combat.encounter.sim.ts` (policies: `greedy` | `blind`)
- CLI: `npm run combat-sim` (`src/CLI/combat-sim.cli.ts`) — flags `--blind`, `--enemy=`, `--loadout=`, `--runs=`, `--seed=`
- Attribution: `buildCombatSummary` in `src/Combat/combat.attribution.ts` (single-card-spam read)
- Types: `src/Combat/combat.encounter.types.ts`
- Public barrel: `src/Combat/index.ts` (re-exported from root `src/index.ts`)

**Tests (witnesses):**
- Engine e2e (acceptance criteria): `src/Combat/e2e/hazard-pattern-combat.engine.test.ts`
- Balance sim guard (HP-model invariants): `src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`
- Defense/GUARD: `src/Combat/e2e/defense-guard.engine.test.ts`
- Befriend HP gate: `src/Combat/e2e/befriend-authority-hp-gate.engine.test.ts`
- Run targeted: `npx vitest run src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`
- Run full: `npm test`

**Doctrine:**
- Spec: `specs/25-hazard-pattern-combat.md` (NOTE: its two-track narrative is
  superseded by the HP-only model — Spec 26 / 26b) · braindump:
  `braindump/2026-06-21-hazard-pattern-combat.md`
- Win model + author fields: `docs/combat.md`, `docs/enemy.md` (Spec 26/26b)
- Vision: `VISION.md` (Combat vision — HP win model, updated 2026-06-22) ·
  `CLAUDE.md` (load-bearing doctrine)

**Mobile witness:** `axiomancer-mobile` — `/combat-encounter` route, dev button
`debug-combat-encounter-button`, seed `globalThis.__AXM_COMBAT_SEED__`,
e2e `npm run e2e:combat`.

**Combat card pool (card-level tunable — numeric values only; new card types are propose-only):**
- All combat cards: `src/Combat/combat.cards.ts` — base effect magnitudes, keyword intensities, GUARD soak values
- Card class composition: tally from `combat.cards.ts` exports against the §4 ratio targets
- GOLD card designations: `GOLD_CARD_IDS` in `combat.cards.ts` (structural, propose-only)
- Hand size: `COMBAT_HAND_SIZE` in `combat.deck.ts`

**Related system — Hazard Minigame (NOT this skill):**
- Tuned by `/hazard-tuning` (`skills/hazard-tuning.md`)
- Source: `src/World/Hazard/hazard.content.ts` (card pool) + `hazard.engine.ts` (mechanics)
- Sim: `simulateHazard` + `hazardStarterBag()`
- Cards added in v0.32.2 with no combat equivalents: JEOPARDY (`jeopardyForce`/`jeopardyEscape`),
  MIRACLE (`firstPlayForce`/`firstPlayEscape`), BUYBACK (`buyback`), DELVE (`delveForce`/`delveEscape`)
- If a combat-tuning run recommends adding a combat card with one of these engagement patterns,
  note it under "Propose-only: new combat card type inspired by hazard mechanic X"

**Legacy:** the turn-based combat is tuned by `/legacy-combat-tuning`
(`skills/legacy-combat-tuning.md`) — do not conflate the two surfaces.
