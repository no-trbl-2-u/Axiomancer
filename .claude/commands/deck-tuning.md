---
description: Card Forge balance loop for Hazard-Pattern Combat — sandbox-first card and deck tuning; A/B experimental cards/overrides through the playtest matrix, tune presets/draft weights, promote proven cards into the library, deliver report + changes via PR. Engine constants are tuned manually, not here.
---

> **⚙️ Runs against the `axiomancer-mechanics` package.** Repo-relative paths below
> (`src/…`, `automation/…`, `scripts/…`) are relative to that package — run from it (`cd axiomancer-mechanics`) or via
> `npm run <script> -w axiomancer-mechanics`.

> **Working agent:** delegate the design + implementation work of this
> skill to the `card-expert` subagent (`.claude/agents/card-expert.md`).
> It carries the spec 32 doctrine, the Dawncaster KB lookup discipline
> (`kb:dawncaster` receipts), the keyword wiring checklist, and this
> skill's autonomy tiers. The caller keeps orchestration: scoping the
> `--focus`, reviewing the evidence tables, and delivering the branch + PR.
>
> **Fact ownership:** doctrine facts (keyword budget, file map, wiring
> checklist, pricing table) are owned by the agent file and the specs it
> cites; this skill owns PROCEDURE, TARGETS, and DELIVERY. When a fact
> here disagrees with the agent/spec, the agent/spec wins — fix the drift
> here in the same PR.

# Skill: deck-tuning

> **The Card Forge — tunes the combat CARD POOL and DECK economy for the
> Hazard-Pattern Combat.** Deck presets, draft weights, sandbox card
> experiments, and (with A/B evidence) library card numerics. The enemy's
> SOLE bar is HP and status effects are the EFFICIENT way to drop it — every
> card change is judged by whether it makes status play more central and more
> satisfying. Engine constants (threat/Conviction economy) are tuned
> manually — the combat-tuning loop was trimmed at the monorepo merge; this
> skill owns the cards themselves.

> **High autonomy within hard guardrails, sandbox-first.** New card ideas and
> numeric nudges to existing cards are prototyped as SANDBOX cards/overrides
> (`src/Cards/cards.sandbox-sets.ts`), A/B-tested through the playtest matrix
> (`npm run combat-playtest -- --sandbox=<set>`), and only promoted into the
> library with the evidence table attached. Deliver findings and changes on
> ONE new branch + PR. Nothing auto-lands on `main`.

## Disambiguation — three combat loops, one doctrine

| | `/deck-tuning` ← **this file** | engine-constant tuning (manual) | `/combat-playtest` |
|---|---|---|---|
| Surface | Card pool + deck economy: presets, draft weights, sandbox cards, library card numerics | Engine constants: threat damage, dice bag, Conviction/Signature economy (hand-tuned; the combat-tuning loop was trimmed at the monorepo merge) | None — evidence + report only |
| Files it edits | `src/Cards/cards.sandbox-sets.ts` (free), `src/Combat/combat.deck-presets.ts`, `src/Combat/combat.deck-draft.ts`, `src/Cards/cards.library.ts` (guarded) | `src/Combat/combat.{threat,threat-sequences,engine,cards,dice,signature,deck}.ts` constants | `docs/reports/playtest-<ts>.md` only |
| Witness | `npm run combat-playtest` matrix + per-card usage (`--cards`) | `simulateHazardPatternCombat` / `npm run combat-sim` | matrix + `playtester` agents |

Do not cross-contaminate: if the fix for an off-band cell is a threat
multiplier or a Conviction constant, flag it as a manual engine-constant
follow-up — do not
compensate by inflating a card. If the finding is qualitative ("this stage
feels flat"), it likely came FROM `/combat-playtest`; answer it here with
cards, not prose.

## North star — the pool exists to make status play the efficient path

Per `VISION.md` / `CLAUDE.md`, **status effects are the MAIN fun of combat.**
HP is the only win condition (`isDefeated(enemy)`); the card pool is what makes
status the efficient route there. So the forge's questions are:

1. **Does the pool keep status central at every stage?** The tier gates
   (`maxCardTier` per stage profile) mean the early pool is thin — it must
   still contain a live DoT line and a live control line, or the early game
   degenerates into basic-attack trading.
2. **Is every card exercisable and none dominant?** The card-coverage e2e
   proves every library card can be played; the anti-spam target says no
   single card carries >70% of a win's impact (`buildCombatSummary`
   attribution). Dead cards and dominant cards are both forge failures.
3. **Do the presets and draft weights produce honest archetypes?** Each
   of the 10 theme presets must win through its own hallmark keywords
   (spec 32 §8-9), a `dot`-focus draft must actually out-DoT a `balanced`
   draft, and the `aggro-brute` sim policy must remain the weak baseline
   (its underperformance IS the design — status play must beat
   basic-attack trading everywhere it matters).
4. **Do experiments earn their place?** A sandbox card is promoted only after
   it proves out across at least 2 stages and 2 policies without breaking the
   balance-band e2e.

A card change that makes a pure-strike deck keep pace with a status deck,
collapses `statusEngagement`, or mints a new single-card spam line is a
balance failure even when win rates look healthy.

## 1. Purpose

`/deck-tuning` is the balance loop for the combat card pool. It reads the
deck surface (presets, draft weights, library card literals, sandbox sets),
exercises the **playtest matrix** (`npm run combat-playtest`) across stage
profiles and sim policies, interprets per-card usage and stage summaries
against the design targets below, and delivers a report — with any applied
card changes and any propose-only structural findings — together on one
branch and PR.

It does NOT reimplement the draft, the projection (`toCombatCard`), or the
sim — those are the machinery. The skill is the forge + the delivery layer.

## 2. Invocation

```
/deck-tuning
/deck-tuning --focus="early"
/deck-tuning --focus="mid"
/deck-tuning --focus="late"
/deck-tuning --focus="impossible"
/deck-tuning --focus="dead cards in the tier-1 pool"
/deck-tuning --focus="preset archetype honesty"
/loop 6h /deck-tuning              # periodic autonomous forging
```

`--focus` accepts a stage id (`early|mid|late|impossible`) to scope the run to
that stage's eligible pool, or free text naming a card/preset/archetype
concern. Without `--focus`, run a full sweep across all stages.

## 3. Autonomy contract

The tunable surface is TIERED. Work from the freest tier inward:

- **Free — sandbox sets.** `src/Cards/cards.sandbox-sets.ts` is the
  experimentation surface: create/edit named sets of NEW cards
  (`registerSandboxCards`) and numeric OVERRIDES of library cards
  (`registerSandboxOverride`). Sandbox content never ships to players; it
  exists to generate A/B evidence. `forge-example` shows the shape.
- **Free — deck composition.** Preset card lists in
  `src/Combat/combat.deck-presets.ts` and the draft weights/defaults in
  `src/Combat/combat.deck-draft.ts` (focus weight 4x, size 10, max copies 2)
  are directly editable with before/after matrix evidence.
- **Guarded — library card numerics.** `combatEffects` intensity/duration,
  `specialMechanics` amounts, and rider numerics in
  `src/Cards/cards.library.ts` may be changed ONLY after a sandbox-override
  A/B of the exact same patch shows the intended effect (same seeds, with vs
  without `--sandbox=<set>`). No cold edits to library literals. Every
  numeric change updates the card's `// pts:` arithmetic comment — the
  pricing lint (`src/Cards/e2e/pricing.engine.test.ts`) checks the sum
  against the printed rank's band. (`basePower`/`scalingMultiplier` were
  deleted with spec 32 v3 — raw damage fields no longer exist.)
  <!-- lexicon-ok: base-power -->

- **Propose-only — structure.** New `specialMechanics` kinds, new verb
  classes, changes to `toCombatCard` classification, `effectImpact`, or any
  engine path are propose-only. You MAY prototype a structural idea as a
  sandbox card, but only by composing EXISTING mechanics kinds and effect
  ids — a card that needs a new engine capability is a written proposal, not
  a prototype.
- **Sim evidence before edits.** Before any change, run the playtest matrix
  over the relevant stages under at least two policies and record the
  before-state (win rate, V/M/D/R, `statusEngagement`, `dotHpFraction`,
  per-card usage). Re-run the SAME matrix (same seeds, same flags) after.
  Cite exact invocations.
- **Promotion path.** A sandbox card that proves out across >= 2 stages and
  >= 2 policies without breaking the balance-band e2e is promoted: move the
  literal into `cards.library.ts` in the SAME PR, with the evidence table in
  the report. Update the card-count pin if the library grows.
- **The verify gate is non-negotiable.** `npm run verify` after any change —
  including the card-coverage e2e (a promoted card must be playable) and the
  balance-band witness. A change that breaks a test is reverted and recorded
  under "Considered but not applied".
- **One PR carries everything.** Report + sandbox sets + applied changes +
  promotions ride a single new branch + PR, ready for review, never draft,
  never auto-merged.
- **Standing law.** Unknown is an acceptable terminal state; false certainty
  is not. Never fabricate a matrix measurement, PR state, or test output.
- **Ambiguity → document and proceed.** Unclear focus: make the most
  reasonable assumption, note it under `## Open questions` in the report, and
  continue.

## 4. Design targets (the objective function)

**Doctrine (load-bearing, set 2026-07-08 — see `VISION.md` → Combat vision):
starter preset decks must adhere to this win-rate curve**, blind
policy-pick: early ~80%, mid ~50%, late ~25-35%, impossible 0%. Starter
presets are early/mid-game decks by design — the player trades into a new
mid-game deck after the labyrinth — so a preset overperforming this curve
at late/impossible is a dominance finding, not a success. Correction
history: `plan/tuning/2026-07-08-win-path-scaling.md`.

The **contract** is the balance-band e2e:
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`. Its thresholds
(marked `// PLAYTEST-CALIBRATION`) are the live bands — read them at run time
rather than trusting this table to stay current. **The bands below predate
the 2026-07-08 curve correction and need re-tuning toward it** (in
particular the late/impossible ceilings, which were set for a "starter
decks stay competitive forever" assumption this doctrine retires):

| Axis | Band |
|---|---|
| Win rate — early (blind, policy-pick) | 0.55–1.0 (target ~0.80) |
| Win rate — mid (blind) | 0.35–1.0 (target ~0.50) |
| Win rate — late (blind) | informational telemetry — NO floor (a raw starter preset is graded on early+mid only; by late the player has matured or replaced the deck). Dominance ceiling still applies: target <= 0.98 |
| Impossible stage (greedy) | winRate <= 0.15 and defeats > 0 — losing is the design (target: winRate == 0 for starter presets) |
| Status engagement | > 0.2 on every non-impossible stage |
| Doctrine assertion | `dot-weaver` beats `aggro-brute` win rate on the late stage |
| DoT HP share | `dotHpFraction` > 0.25 on greedy stage summaries |

Card-level targets on top of the bands:

| Axis | Target |
|---|---|
| Single-card spam | no card id accounts for >70% of a typical win's impact (`buildCombatSummary`) |
| Dead cards | every library card shows plays in the card-coverage e2e and non-trivial usage somewhere in the full `--cards` matrix |
| FREE/PAID line balance | for every common/uncommon in its home preset, NEITHER printed line takes >85% or <15% of the card's plays (`free%`/`paid%` in the `--cards` table) — both tails mean one line is dead weight. Soft bands: the lint (`src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts`, thresholds `// PLAYTEST-CALIBRATION`) flags via `console.info`, never fails; cards tagged `intentionallyAsymmetric` (`Card`, `src/Cards/types.ts`) are exempt by design declaration |
| Pool ratios (v3 — re-derive from the live library before relying on them) | direct damage = 0 by LAW (spec 32: THE STRIKE IS DEAD — a card printing raw HP damage is a spec violation, not a tuning finding); DoT >= 25%; control >= 15%; GUARD/BARRIER >= 1 per theme; Befriend >= 1; state-interactive >= 2 |
| Per-stage pool health | each stage's eligible pool (`stageEligibleCardIds`) contains at least one live DoT, control, and defend line |
| Archetype honesty | each of the 10 theme presets (`erosion` … `refrain`) wins through its own HALLMARK keywords, not just the shared utility 10 (spec 32 §8-9); `dot`-focus drafts land more DoT than `balanced` drafts; the `aggro-brute` POLICY stays the weak baseline (a sim policy — the v2 `aggro-strike` preset is retired) |
| Per-deck floors & ceiling (balance the VARIANCE, not the mean) | FLOORS are graded on the starter deck's design window only — every theme preset >= 40% early, >= 25% mid (target ratchets). **Late is informational telemetry, NOT a graded floor** (deck-progression model, owner-confirmed 2026-07-08: starter presets are early-game decks; the player matures the deck by drafting through the labyrinth and by late has kept a built-up deck or swapped to a not-yet-built late-game preset — so an un-matured starter losing late is correct, not a dead-on-arrival bug). The DOMINANCE ceiling still applies on EVERY stage incl. late: NO preset at >98% on any stage — a 100% cell is a dominance finding regardless of stage (Oratory/Standstill). Impossible should target a hard 0% ceiling for starter presets. Live enforcement values are the `PRESET_FLOORS` (early+mid) / `PRESET_CEILING` (all stages) constants in the balance-band e2e (`// PLAYTEST-CALIBRATION`, pinned loose today) — ratchet floors toward these targets as forge items land; stage averages that hit band while presets sit at 0% on a graded stage or 100% anywhere are a FAIL |

Every run's report includes the per-preset spread table (min/median/max
win rate per stage, one row per preset) — stage averages alone are not
evidence; the round-2 battle lab showed a 53.7% mid average hiding four
presets near 100% and four near 0%.

### 4b. The keyword proving gate (the exit criteria for the 30-cap)

Spec 32 §3 caps the registry at exactly 30 keywords as a PROVING GATE:
the owner intends to grow past 30 once the current 30 are proven
correct. "Proven correct" is measurable — every run of this skill
updates the scoreboard in
`axiomancer-mechanics/docs/keyword-atlas.md` (owned by `card-expert`)
against these criteria, per keyword:

| Criterion | Evidence |
|---|---|
| Exercised | the keyword's cards show non-trivial plays in the full `--cards` matrix (not just the coverage e2e minimum) |
| Not dominant | no keyword's cards jointly account for >70% of a typical win's impact on any stage (`buildCombatSummary` attribution) |
| Priced honestly | every card carrying it passes the pricing lint, and its A/B history shows no standing "known-cheap/known-dear" note |
| Theme-honest (hallmarks only) | the keyword's home preset wins through it (§4 archetype honesty), not around it |

A keyword failing a criterion is a forge target, not a retirement
candidate by default — fix the cards first, the keyword second. When
ALL 30 rows are green across a full sweep, report "proving gate:
satisfied" prominently — that is the owner's signal to consider
opening the registry (`[needs-user-call]`; spec 32 §3 change).

Attribution today is per-CARD (`buildCombatSummary`); per-KEYWORD
engagement is derived by summing a keyword's cards. If that proxy
proves too coarse, propose a per-keyword attribution extension as an
engine follow-up (propose-only — do not build it inside this loop).

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- Run the deck suites cold:
  `npx vitest run src/Combat/e2e/combat-deck-draft.engine.test.ts src/Cards/e2e/cards-sandbox.engine.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.
- If anything fails before you touch a file, stop and report.

### Step 1 — Read the forge surface
- `src/Combat/combat.deck-presets.ts` — the ten theme presets
  (`erosion`, `oratory`, `foundry`, `penitent`, `standstill`, `augury`,
  `tithe`, `grace`, `bastion`, `refrain` — 1:1 with the spec 32 themes)
  and their card lists.
- `src/Combat/combat.deck-draft.ts` — focus weights, size/copy defaults,
  guarantees (>= 1 defend, >= 1 status card).
- `src/Combat/combat.stage-profiles.ts` — tier/level gates that shape each
  stage's eligible pool.
- `src/Cards/cards.sandbox-sets.ts` — existing experimental sets.
- `src/Cards/cards.library.ts` — the literals you may eventually promote into
  or (guardedly) nudge.
- Tally pool ratios per stage against the §4 targets (count each card class
  in the stage's eligible pool and compute its share; the §4 targets came
  from the retired combat-tuning skill — re-derive from the current card
  library before relying on them).

### Step 2 — Baseline matrix
```
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards
npm run combat-playtest -- --stage=early --policy=blind --deck=preset:erosion --seed=1
npm run combat-playtest -- --stage=late --policy=dot-weaver --deck=policy-pick --seed=1 --cards
```
Record per stage/policy: win rate, V/M/D/R, `statusEngagement`,
`dotHpFraction`, and the per-card usage table (plays, status lands,
discards). Flag dead cards (zero or near-zero plays where eligible) and
dominant cards.

**Diff against the checked-in baseline.** If
`docs/reports/baselines/deck-matrix-baseline.json` exists (the `--json`
output of the first command above, seed-pinned, stamped with the commit
it was generated at), diff the fresh run against it BEFORE forming
hypotheses — drift with no forge change in between means some other
merge moved the balance, and that finding leads the report. If the
baseline is missing or its seeds/flags no longer match, regenerate it
from the fresh run and note that this run has no drift signal.

### Step 3 — Forge and A/B in the sandbox
For each hypothesis, write or edit a set in `cards.sandbox-sets.ts` (new
cards and/or overrides), then A/B with identical seeds:
```
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1          # control
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1 --sandbox=<setId>   # treatment
```
Repeat across >= 2 stages and >= 2 policies before drawing a conclusion. One
change per axis at a time; measure each before the next.

### Step 4 — Apply, promote, verify
- Preset/draft changes: apply directly with the before/after evidence.
- Library numerics: apply only the patch the sandbox override proved out.
- Promotions: move the proven sandbox card literal into `cards.library.ts`
  (same PR, evidence table attached); leave the sandbox set in place as the
  provenance record or prune it — your call, say which.
- `npm run verify` after each applied change. Broken test → revert, record
  under "Considered but not applied".
- Any applied change (promotion, preset/draft edit, library nudge)
  regenerates `docs/reports/baselines/deck-matrix-baseline.json` from the
  post-change full matrix (same seeds/flags as Step 2) and ships it in the
  same PR — the next run diffs against the world this one leaves behind.
- Update the affected rows of `docs/keyword-atlas.md` (proving-gate
  scoreboard, §4b) in the same PR.

### Step 5 — Deliver on ONE PR
- **Cross-package verify** — before opening the PR, run
  `git diff --name-only` against the changed paths; if any match the
  cross-package impact checklist in `AGENTS.md`, run
  `npm run verify -w axiomancer-mobile` and block the PR on failure.
- Branch off base: `git checkout -b balance/deck-<ts>`.
- Write `docs/reports/deck-tuning-<ts>.md` (create `docs/reports/` if it
  doesn't exist yet): pool audit, baseline matrix, every A/B
  with `old → new` + rationale + evidence, promotions, propose-only findings,
  open questions, and the **per-deck line-telemetry appendix** — one table
  per preset touched by the run (all ten on a full sweep): each card's
  `free%` / `paid%` / `fizz%` / `unpl%` and per-line HP contribution
  (`hpF`/`hpP`) from the `--cards` matrix, with offenders against the §4
  85/15 line-balance bands flagged (mirror of the
  `combat-playtest.line-telemetry` lint's `[line-telemetry]` output).
- Commit: `balance(deck): <ts> report + forge changes (<n> applied)`.
- Push and open a PR (ready for review, never draft, never auto-merged):
  title `balance(deck): card forge <ts> (<n> applied)`; body carries the
  headline finding, the A/B tables, and the promotion evidence.
- No applied changes but a new finding → PR with the report only. Do not open
  a no-op PR repeating the previous tick.

### Step 6 — Report back
One concise message: the PR URL, cards forged/promoted/nudged, and the
headline status-engagement / band delta.

## 6. Hard rules

- **Never push to `main` automatically. Never auto-merge.**
- **Never bypass `npm run verify`,** including the balance-band and
  card-coverage witnesses and the sim oracle
  (`src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`).
- **Never edit engine logic** — `combat.engine.ts`, `toCombatCard`
  classification / `effectImpact` in `combat.cards.ts`, the sandbox registry
  mechanics in `cards.sandbox.ts`, or the effects engine. The forge surface
  is card DATA: sandbox sets, presets, draft weights, and (guarded) library
  literals.
- **Never edit library card literals without a sandbox A/B first.**
- **Never invent new `specialMechanics` kinds, verb classes, or effect ids**
  — sandbox prototypes compose existing kinds only; new kinds are
  propose-only.
- **Never ship a sandbox set as player-facing content** — promotion into
  `cards.library.ts` is the only shipping path.
- **Preserve canonical terms** (VITAE/HP, STANCE, Conviction, GUARD, Befriend
  mercy, the policy ids, the stage ids).
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **A suite fails before any change.** Stop; report the pre-existing
   failure.
2. **A change breaks a test (incl. the balance-band or card-coverage
   witness).** Revert; record under "Considered but not applied".
3. **A sandbox card cannot be exercised** (never drawn/played in the
   harness). Treat as a design failure of the card, not a harness gap —
   redesign or drop it; flag if you suspect the harness.
4. **The fix is an engine constant, not a card.** Flag it as a manual
   engine-constant follow-up (the combat-tuning loop was trimmed at the
   monorepo merge); note the handoff in the report.
5. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**Tunable surface (tiered):**

| Tier | File | What |
|---|---|---|
| Free (sandbox) | `src/Cards/cards.sandbox-sets.ts` | named sets: new `Card` literals + `{ cardId, patch }` overrides; example set `forge-example` |
| Free (composition) | `src/Combat/combat.deck-presets.ts` | the 10 theme preset card lists (`erosion`, `oratory`, `foundry`, `penitent`, `standstill`, `augury`, `tithe`, `grace`, `bastion`, `refrain`) |
| Free (composition) | `src/Combat/combat.deck-draft.ts` | focus weights (4x), draft size (10), max copies (2), guarantees |
| Guarded (A/B first) | `src/Cards/cards.library.ts` | effect intensity/duration, mechanic amounts, rider numerics + the `// pts:` comment (no damage fields exist — spec 32) |
| Propose-only | — | new mechanics kinds, verb classes, `toCombatCard` / `effectImpact`, engine paths |

**Deck-selection grammar (shared by `npm run combat-playtest` and
`npm run combat`):** `preset:<id>` | `draft:<focus>`
(`dot|control|utility|damage|rush-execute|balanced` — the
`CombatDeckFocus` union in `combat.deck-presets.ts` is authoritative)
| `cards:a,b,c` | `policy-pick` (drafts from the policy's preferred focus).

**Evidence CLI:** `npm run combat-playtest` — flags `--stage=`, `--policy=`,
`--deck=`, `--enemy=`, `--runs=`, `--seed=`, `--sandbox=<setId>`, `--cards`
(per-card usage table), `--json`. Full cookbook: `docs/playtest.md`.

**Machinery (read, don't edit):** `stageEligibleCardIds` / `buildStagePlayer`
(`combat.stage-profiles.ts`), `draftCombatDeck` / `resolveDeckSelection`
(`combat.deck-draft.ts`), sandbox registry (`src/Cards/cards.sandbox.ts`),
`runPlaytestMatrix` (`combat.playtest.ts`), policies
(`combat.sim-policies.ts`), attribution (`buildCombatSummary`).

**Tests (witnesses):**
- Balance bands (THE contract): `src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`
- Card coverage (no dead cards): `src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`
- Draft mechanics: `src/Combat/e2e/combat-deck-draft.engine.test.ts`
- Sandbox registry: `src/Cards/e2e/cards-sandbox.engine.test.ts`
- Sim oracle (must never move): `src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`

**Doctrine:** `VISION.md` → Combat vision · `CLAUDE.md` (load-bearing
doctrine, incl. the 2026-07-08 starter-preset win-rate curve) · pool-ratio
targets in §4 above (from the retired combat-tuning skill; re-derive from
the current card library before relying on them).

**Related loops:** engine constants → manual tuning (the combat-tuning loop
was trimmed at the monorepo merge) · qualitative evidence →
`/combat-playtest`.
