# Skill: gathering-tuning

> **High autonomy within hard guardrails.** Analyse the gathering minigame's
> ("The Gleaning") wrath economy, plot yields, offering/tool/boon magnitudes,
> and outcome-tier rates against the shipped incentive doctrine. Deliver
> findings and any numeric changes on ONE new branch + PR. Nothing auto-lands
> on `main`.

## North star — extraction vs restraint, never a vending machine

The Gleaning implements the Forage archetype: *how much do you take from a
place that may not forgive taking?* The whole design hangs on one incentive
gradient, guarded by `src/World/Gathering/e2e/gathering.balance.sim.test.ts`:

> **blind greed < timid restraint < skilled push-your-luck**

The greedy bot must always wake the site and net the LEAST; the timid bot
must be safe and modest; the balanced bot (reads the wrath prices, leaves
below the despoilment line) must net the MOST. A change that lets greed
out-earn restraint, or makes restraint out-earn skill, works against the
vision even if every individual number looks reasonable. The witness for
healthy play is a run where the player tends a BREATH plot or pays an
offering to buy room for one more taking — restraint as a tactical verb,
not a scold.

## 1. Purpose

`/gathering-tuning` is the gleaning balance loop. It reads the shipped
content (`gathering.content.ts`) and knobs (`gathering.tuning.ts`),
exercises the gathering CLI (`npm run gathering -- ...`) and the policy
sim, interprets results against the targets below, and delivers a report —
with any auto-applied numeric changes and any propose-only structural
findings — together on one branch and PR.

The empirical witnesses, in order of preference:

1. **The policy sim** — `runGatheringSim` (`src/World/Gathering/gathering.sim.ts`)
   drives full sessions with three bots (timid / balanced / greedy); the
   balance bands in `gathering.balance.sim.test.ts` are the codified targets.
2. **The gathering CLI** — deterministic seeded runs with JSON events and
   JSONL state logs:

```bash
npm run gathering -- --auto --seed 42 --runs 5 --site mire-mint --approach glean \
  --json-events --state-log /tmp/gather-mire-glean-42.jsonl
npm run gathering -- --auto --seed 7 --runs 5 --site bone-orchard --approach strip \
  --json-events --state-log /tmp/gather-bone-strip-7.jsonl
```

Parse the logs for `claimGatheringSpoils` records (tier, keptPieces,
keptRichness), `illegalGatheringAction` records, and the final
`gathering:summary` event. If neither the sim nor the CLI can measure an
axis, say exactly which axis is blocked and why; do not invent a fake
harness measurement.

## 2. Invocation

```
/gathering-tuning
/gathering-tuning --focus="eruption rate"
/gathering-tuning --focus="communion gating"
/gathering-tuning --focus="strip plunder economy"
/gathering-tuning --focus="offering costs"
/gathering-tuning --focus="set thresholds"
/gathering-tuning --focus="dusk pressure"
```

`--focus` narrows which tuning axis the skill prioritises in its analysis
and its change set. Without `--focus`, the skill runs a full sweep of all
axes in the quick-reference table below.

## 3. Autonomy contract

- **Numeric and content-level only.** The skill may change values in
  `gathering.tuning.ts` (wrath max/thresholds, dusk turn, approach knobs,
  offering/tool/reprisal/eruption/set/outcome/boon magnitudes) and authored
  numbers in `gathering.content.ts` (plot richness/wrath, site rosters and
  weights). Structural rules changes (new phases, new traits, new reprisal
  kinds, new tool verbs, engine/state-machine edits) are **propose-only**.
- **Baseline before delta.** Every proposed change records `old → new` with
  a one-line rationale grounded in the targets below.
- **Evidence before edits.** Run the sim bands and/or the CLI matrix BEFORE
  applying a change, and re-run the SAME seeds after. Logs go to `/tmp` or
  another ignored artifact path.
- **The verify gate is non-negotiable.** After any change, `npm run verify`
  must pass before the change is staged — this includes the balance bands.
  If a change moves a band deliberately, update the band in the SAME commit
  with a documented rationale; if the move is accidental, revert.
- **One PR carries everything.** Findings, suggestions, and applied changes
  ride a single new branch + PR, ready for review, never draft, never
  auto-merged.
- **Standing law.** Unknown is an acceptable terminal state; false certainty
  is not. Report knowns, unknowns, blocker, changed state, and the next
  evidence-bearing step instead of pretending certainty.
- **Fail together.** Verified failure beats unverified success. Never
  fabricate measurements, PR state, or test output.
- **Ambiguity → document and proceed** under `## Open questions` in the
  suggestions file.

## 4. Design targets (the objective function)

These are the shipped targets codified in
`src/World/Gathering/e2e/gathering.balance.sim.test.ts` (400 runs/policy,
sites rotated; per-site checks at 120 runs):

| Axis | Target |
|---|---|
| Incentive gradient | greedy avgKeptRichness < timid avgKeptRichness < balanced avgKeptRichness |
| Timid eruption rate | ≤ 1% (despoiled: 0) |
| Timid communion rate | ≥ 35% |
| Timid avg kept richness | 6–10 |
| Balanced eruption rate | ≤ 3%; despoiled ≤ 5% |
| Balanced communion rate | ≥ 12% |
| Balanced avg kept richness | 10.5–15 |
| Greedy eruption rate | ≥ 90% overall; ≥ 80% per site |
| Greedy avg bitten vitae | ≥ 3 |
| Timid per-site eruption | ≤ 2% on every site |

Doctrine constants worth knowing before proposing moves (all in
`gathering.tuning.ts`):

- Wrath 0–12, reprisal thresholds at 4 and 8 (each fires once — the place
  remembers; no re-fires after relief).
- Communion needs grace ≥ 2 AND wrath ≤ 4 and a non-empty satchel;
  despoilment starts at wrath ≥ 8; eruption at 12.
- GLEAN: yields capped at 2, +1 starting grace, eruption loses 1/3.
  STRIP: +1 richness and +1 wrath per taking, eruption loses 1/2,
  plunder pays 1 shilling per kept richness.
- Dusk after 8 takings: +1 wrath per taking.
- Sets refine at family richness ≥ 6.

## 5. The procedure

### Step 0 — Sync & sanity

- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- Cold-run the witnesses:
  `npx vitest run src/World/Gathering src/CLI/e2e/gathering.cli.engine.test.ts`.
- If anything fails before you touch values, stop and report the
  pre-existing failure.

### Step 1 — Read the surfaces

Read in full before forming any hypothesis:

- `src/World/Gathering/gathering.tuning.ts` — every knob, grouped.
- `src/World/Gathering/gathering.content.ts` — plots (richness/wrath/traits),
  sites and per-stratum rosters, offerings, tools, reprisal copy, boons,
  set refinements.
- `src/World/Gathering/gathering.sim.ts` — what each bot actually does
  (so you don't mistake bot policy for player balance).
- `src/World/Gathering/e2e/gathering.balance.sim.test.ts` — the bands.

### Step 2 — Run the evidence matrix

Minimum sweep for a full run:

- the sim bands (`npx vitest run src/World/Gathering/e2e/gathering.balance.sim.test.ts`)
  plus an ad-hoc probe if you need raw numbers (a scratch vitest file or
  `npx tsx -e` one-liner calling `runGatheringSim`; delete scratch files);
- CLI runs: both approaches × at least 2 sites × 5 seeds, `--auto`,
  `--json-events`, `--state-log` to `/tmp`.

Treat repeated `illegalGatheringAction` records as driver/policy evidence,
not player balance truth.

### Step 3 — Map evidence against targets

For each target: measure the actual rate, compare, and — before proposing a
move — explain the MECHANISM (e.g. "greedy eruption fell to 70% because the
new gift plots let it take 5 wrath-free harvests; the bag weight is the
lever, not the threshold").

Specific cross-checks:

1. **Gradient first.** If the gradient is broken, fix nothing else until
   the mechanism is understood — most other deviations are symptoms.
2. **Trait economy.** GIFT plots must author wrath 0; BREATH plots author
   negative wrath and zero richness (the content-sanity test pins this).
   Watch the gift/breath bag share: too many free takings collapse the
   push-your-luck tension.
3. **Offering math.** Each offering is worth −3 wrath +1 grace. Communion
   needs both offerings paid (grace 2) under the default glean start
   (grace 1 → only 1 more needed). If you move `offerings.grace` or
   `outcome.communionGrace`, re-derive how many offerings a communion
   needs and say so in the report.
4. **Strip plunder.** Strip pays `plunderPerRichness × kept richness`; an
   eruption then claws back half. Check that a routed strip nets visibly
   less coin+richness than a clean glean of the same length.
5. **Dusk pressure.** With spread size 3 and ~30-plot sites, dusk at 8
   takings should bite mid-second-stratum. If sites grow, re-check.

### Step 4 — Propose and apply numeric changes

One change per axis at a time; re-run the same evidence (same seeds)
after each; `npm test` after each. A change that breaks a band without a
deliberate, documented band update is reverted and recorded under
"Considered but not applied".

### Step 5 — Deliver on ONE PR

- Branch: `balance/gathering-<ts>`.
- Commit: `balance(gathering): <ts> report + suggestions (<n> changes applied)`.
- PR (ready for review, never auto-merged): headline deviation; exact sim/CLI
  command matrix + seeds; before/after rates per policy; each applied change
  `old → new` with rationale; propose-only section for structural ideas.
- No-op ticks (nothing deviates, nothing new found) skip the PR.

## 6. Hard rules

- **Never push to `main` automatically. Never auto-merge. T approves.**
- **Never bypass `npm run verify`.**
- **Never edit `gathering.engine.ts`, `gathering.types.ts`, or
  `gathering.rng.ts` for tuning purposes.** The tuning surface is
  `gathering.tuning.ts` + authored numbers in `gathering.content.ts` only.
- **Never add new traits, reprisal kinds, tools, phases, or outcome tiers.**
  Structural — propose-only.
- **Do not tune the bots to pass bands.** `gathering.sim.ts` policies are
  the measurement instrument; changing the instrument to flatter a content
  change is fabrication. A bot change is legitimate only when the bot
  provably diverges from the play pattern it models — document it as such.
- **Mobile parity caveat.** Until the mobile app consumes the package's
  gathering engine, `axiomancer-mobile/state/gathering/` carries a copy of
  these files. Note in the PR body that the same numeric change must be
  mirrored there (or that the migration has landed and no mirror is needed).
- **Preserve canonical terms** VITAE, WRATH, GRACE, BREATH, GIFT, LURE,
  TANGLE in authored text. No emojis. No `Co-Authored-By:` trailers.
  Commit style: `<type>(<scope>): <description>`.

## 7. Failure modes

1. **Pre-existing red tests.** Stop; report; do not tune on a red base.
2. **A change breaks a band accidentally.** Revert, record under
   "Considered but not applied" with the failing band.
3. **An axis cannot be measured.** Prefer extending the CLI evidence flow;
   if genuinely blocked, file a narrowly-scoped harness-gap entry in
   `plan/PHASE_CANDIDATES.md` and exclude the axis from applied changes.
4. **Focus matches nothing.** Run the full sweep and note the empty filter.

## 8. Quick reference

**Tuning surface:**
- Knobs: `src/World/Gathering/gathering.tuning.ts`
- Authored content: `src/World/Gathering/gathering.content.ts`

**Engine (read-only for this skill):**
- `src/World/Gathering/gathering.engine.ts`, `gathering.types.ts`,
  `gathering.rng.ts` · barrel: `src/World/Gathering/index.ts`

**Evidence:**
- Sim: `src/World/Gathering/gathering.sim.ts` (`runGatheringSim`)
- Bands: `src/World/Gathering/e2e/gathering.balance.sim.test.ts`
- Engine e2e: `src/World/Gathering/e2e/gathering.engine.test.ts`
- CLI: `npm run gathering -- --auto --seed <n> --runs <n> --site <id> --approach glean|strip --json-events --state-log /tmp/g.jsonl`
- CLI e2e: `src/CLI/e2e/gathering.cli.engine.test.ts`

**Tunable axes:**

| Axis | Knobs | Guarded by |
|---|---|---|
| Eruption pressure | `wrath.max`, `wrath.thresholds`, plot wrath numbers | greedy ≥ 90% / timid ≤ 1% eruption |
| Take-vs-leave maths | approach knobs (`richnessCap`, `richnessBonus`, `wrathBonus`, `eruptionLoss`, `plunderPerRichness`) | the gradient |
| Communion gating | `outcome.communionGrace/communionWrathMax`, `offerings.*` | timid ≥ 35% / balanced ≥ 12% communion |
| Despoilment line | `outcome.despoilWrathMin` | balanced despoiled ≤ 5% |
| Session length | `dusk.afterTurn`, site roster sizes/weights | avgTurns sanity, dusk bite point |
| Spoils economy | `sets.*`, `boons.*`, `reprisals.*`, `eruption.bite` | greedy bitten ≥ 3; coin sanity in CLI logs |
