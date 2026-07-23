---
description: Card Forge balance loop for Hazard-Pattern Combat — sandbox-first card and deck tuning; A/B experimental cards/overrides and measurement-seat swap sweeps through the playtest matrix, tune presets/draft weights, promote proven cards into the library, deliver report + changes via PR. Engine constants are tuned manually, not here.
---

> **⚙️ Runs against the `axiomancer-mechanics` package.** Repo-relative paths below
> (`src/…`, `docs/…`) are relative to that package — run from it (`cd axiomancer-mechanics`) or via
> `npm run <script> -w axiomancer-mechanics`. Exception: `npm run baseline:check`
> / `npm run baseline:regen` are ROOT scripts.

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

> **The Card Forge — tunes the combat CARD POOL and DECK economy for
> Hazard-Pattern Combat.** Deck presets, draft weights, sandbox card
> experiments, measurement-seat swap sweeps, and (with A/B evidence) library
> card numerics. The enemy's SOLE bar is HP and status effects are the
> EFFICIENT way to drop it — every card change is judged by whether it makes
> status play more central and more satisfying. Engine constants
> (threat/Conviction economy) are tuned manually — the combat-tuning loop was
> trimmed at the monorepo merge; this skill owns the cards themselves.

> **High autonomy within hard guardrails, sandbox-first.** New card ideas and
> numeric nudges to existing cards are prototyped as SANDBOX cards/overrides
> (`src/Cards/cards.sandbox-sets.ts`), A/B-tested through the playtest matrix
> (`npm run combat-playtest -- --sandbox=<set>`), and only promoted into the
> library with the evidence table attached. Deliver findings and changes on
> ONE new branch + PR. Nothing auto-lands on `main`.

## Disambiguation — three combat loops, one doctrine

| | `/deck-tuning` ← **this file** | engine-constant tuning (manual) | `/combat-playtest` |
|---|---|---|---|
| Surface | Card pool + deck economy: presets, draft weights, sandbox cards, swap sweeps, library card numerics | Engine constants: threat damage, dice bag, Conviction/Signature economy (hand-tuned; the combat-tuning loop was trimmed at the monorepo merge) | None — evidence + report only |
| Files it edits | `src/Cards/cards.sandbox-sets.ts` + `src/Cards/swap-pool/` (free), `src/Combat/combat.starter-deck-presets.ts`, `src/Combat/combat.deck-draft.ts`, `src/Cards/cards.library.ts` (guarded) | `src/Combat/combat.{threat,threat-sequences,engine,cards,dice,signature,deck}.ts` constants | `docs/reports/playtest-<ts>.md` only |
| Witness | `npm run combat-playtest` matrix + per-card usage (`--cards`) + per-preset rollups (`--deck=preset:all`) | `simulateHazardPatternCombat` / `npm run combat-sim` | matrix + `playtester` agents |

Do not cross-contaminate: if the fix for an off-band cell is a threat
multiplier or a Conviction constant, flag it as a manual engine-constant
follow-up — do not compensate by inflating a card. If the finding is
qualitative ("this stage feels flat"), it likely came FROM
`/combat-playtest`; answer it here with cards, not prose.

## North star — the pool exists to make status play the efficient path

Per `VISION.md` / `CLAUDE.md`, **status effects are the MAIN fun of combat.**
HP is the only win condition (`isDefeated(enemy)`); the card pool is what makes
status the efficient route there. So the forge's questions are:

1. **Does the pool keep status central at every stage?** The tier gates
   (`maxCardTier` per stage profile) mean the early pool is thin — it must
   still contain a live DoT line and a live control line, or the early game
   degenerates into basic-attack trading.
2. **Is every card exercisable and none dominant?** `deadCardRate` and the
   card-coverage e2e prove every card can be played; `dom`
   (`dominantCardShare`) and `H` (`usageEntropy`) prove no single card
   carries the deck. Dead cards and dominant cards are both forge failures.
3. **Do the presets and draft weights produce honest archetypes?** Each of
   the 10 theme presets must win through its own hallmark keywords (spec 32
   §8-9) — and through the intended RESOLUTION PATH (the win-path mix
   exposes a deck winning by concede/capitulate when its fantasy is DoT, or
   vice versa). A `dot`-focus draft must out-DoT a `balanced` draft, and the
   `aggro-brute` sim policy must remain the weak baseline (its
   underperformance IS the design — status play must beat basic-attack
   trading everywhere it matters).
4. **Do experiments earn their place?** A sandbox card is promoted only after
   it proves out across at least 2 stages and 2 policies without breaking the
   balance-band e2e; a candidate takes a preset SEAT only by beating the
   incumbent in swap-variant A/Bs (§3).

A card change that makes a pure-strike deck keep pace with a status deck,
collapses `statusEngagement`, or mints a new single-card spam line is a
balance failure even when win rates look healthy.

## 1. Purpose

`/deck-tuning` is the balance loop for the combat card pool. It reads the
deck surface (presets, draft weights, library card literals, sandbox sets,
swap pools), exercises the **playtest matrix** (`npm run combat-playtest`)
across stage profiles and sim policies, interprets the full metric slate
(§4a) against the design targets below, and delivers a report — with any
applied card changes and any propose-only structural findings — together on
one branch and PR.

It does NOT reimplement the draft, the projection (`toCombatCard`), or the
sim — those are the machinery. The skill is the forge + the delivery layer.

## 2. Invocation

```
/deck-tuning
/deck-tuning --focus="early"                          # one stage id: early|mid|late|impossible
/deck-tuning --focus="dead cards in the tier-1 pool"  # free text: card/preset/archetype concern
/deck-tuning --focus="preset archetype honesty"
/deck-tuning --focus="swap-measure the reward-pool cards"
/deck-tuning --focus="swap-sweep the erosion seats"
/deck-tuning --preset=erosion                         # scope to ONE preset (the GitHub Action's dropdown)
/deck-tuning --preset=all --runs=60                   # explicit full sweep (the Action's defaults)
/deck-tuning --cross-theme-swaps=true                 # owner-authorized out-of-theme measurement arms
/loop 6h /deck-tuning              # periodic autonomous forging
```

- `--focus` accepts a stage id (scopes the run to that stage's eligible
  pool) or free text naming a card/preset/theme concern.
- `--preset=<id|all>` scopes the run to one preset: baseline that preset
  across all stages (`--deck=preset:<id>`), work its seats/theme swap pool,
  and report its rollup — plus the shared `--deck=preset:all` control when
  swap arms need it. `all` (or absent) = the full ten-preset sweep. The
  GitHub Action (`.github/workflows/deck-tuning.yml`) surfaces this as a
  dropdown.
- `--runs=<n>` sets runs-per-cell for every matrix invocation this run
  makes (default 60). The stamped baseline is measured at 60 runs/seed 1 —
  when `--runs` ≠ 60 the drift diff is not flag-matched, so treat results
  as DIRECTIONAL: fine for exploratory arms, not for applying changes or
  re-stamping the baseline (re-measure the deciding A/B at 60 first).
- `--cross-theme-swaps=<true|false>` (default false) lifts the in-theme
  swap law (§3) for THIS run's measurement arms. Because dispatching with
  the flag is the owner flipping a switch, it carries the owner's per-run
  authorization to MEASURE out-of-theme swap-ins — it does NOT ratify
  shipping one (see the §3 swap law for exactly what it unlocks). The
  GitHub Action surfaces this as a checkbox, default off; scheduled runs
  are always in-theme-only.

Without any flag, run a full sweep across all stages and presets,
in-theme swaps only.

## 3. Autonomy contract

The tunable surface is TIERED. Work from the freest tier inward:

- **Free — sandbox sets.** `src/Cards/cards.sandbox-sets.ts` is the
  experimentation surface: create/edit named sets of NEW cards
  (`registerSandboxCards`) and numeric OVERRIDES of library cards
  (`registerSandboxOverride`). Sandbox content never ships to players; it
  exists to generate A/B evidence. `forge-example` shows the shape.

- **Free — deck composition.** Preset card lists in
  `src/Combat/combat.starter-deck-presets.ts` and the draft weights/defaults
  in `src/Combat/combat.deck-draft.ts` (focus weight 4x, size 10, max copies
  2) are directly editable with before/after matrix evidence. A shipping
  recipe change still needs the color-law arithmetic (spec 32 §12), and a
  recolor stays a standing owner call.

- **Free — measurement-seat swap sweeps (owner-ratified 2026-07-18).** The
  lever for measuring a card the shipped recipes cannot reach. Run the
  preset with one seat substituted for the treatment arm of an A/B:
  `--deck=preset:<id>+swap:<out>/<in>,...` (every copy of `out` replaced by
  `in`; control = the same invocation without the swap, identical seeds).

  **The swap law: swap-ins come from OUTSIDE the shipped recipe but INSIDE
  the preset's theme.** Two legal sources —

  | Swap-in source | `--sandbox` needed? | Typical question |
  |---|---|---|
  | The theme's library cards not seated in the recipe — incl. the 10 reward-pool-only cards post-5/5/5 | no | "does this unseated/reward card earn a seat?" |
  | The theme's swap-pool candidate set `swap-<theme>` (`src/Cards/swap-pool/<theme>.swap-pool.ts` — 30 spells each, 10/12/8 common/uncommon/rare; contract pinned by `src/Cards/e2e/swap-pool.engine.test.ts`) | yes — `--sandbox=swap-<theme>` | "does this candidate beat the incumbent seat?" |

  A cross-theme swap-in is a RECOLOR, not a measurement — standing owner
  call, never done silently. **Per-run exception:** a run dispatched with
  `--cross-theme-swaps=true` (§2) carries the owner's authorization to RUN
  out-of-theme measurement arms. Under the flag: any theme's swap-pool
  candidates or unseated library cards are legal swap-ins for any preset
  (apply the donor theme's set via `--sandbox=swap-<theme>`; comma-separate
  sets when mixing); tag every such arm `[cross-theme]` in the report and
  state which theme donated the card. The flag authorizes EVIDENCE only —
  applying an out-of-theme card to a shipped recipe is still a recolor:
  color-law arithmetic plus its own explicit owner call, never implied by
  the flag. Flag off (the default, and always on scheduled runs), the
  in-theme law above is absolute. In both modes prefer rarity-legal seats
  (swap like rarity for like); when a candidate has no rarity-legal seat
  in its target preset, record that as a seat-grid finding rather than
  forcing an off-rarity arm.
  Swap variants are EVIDENCE devices: they may break the color law and
  never ship as-is. Before designing arms, read the per-card design
  estimates ledger (`docs/reports/swap-pool-estimates-2026-07-18.json`) and
  report estimate-vs-measured deltas — that calibrates the next authoring
  pass. Standing ruling, same date: TRIMS of never-played cards are PAUSED —
  swap telemetry replaces the trim conversation until those cards have real
  numbers (never-played in a preset-only sweep is a reachability fact, not
  a quality verdict — `plan/tuning/2026-07-18-card-library-fanout-synthesis.md`).

- **Free — swap-pool candidate authoring (owner-approved 2026-07-18).**
  Authoring candidate cards per theme is approved, with two hard
  constraints: candidates compose the EXISTING registry keywords only
  (carrier-density doctrine — reinforce hallmarks toward ≥8 home carriers,
  don't mint vocabulary), and they live in sandbox swap-pool sets as seat
  candidates for preset refinement. They are NOT a player-facing
  mid-library: Act 1 is the player cycling through the 10 presets to learn
  the mechanics, Act 2 is picking one deck (where reward cards unlock) — so
  the presets themselves are the product this pool serves. A candidate
  enters `cards.library.ts` only via the normal promotion path, and enters
  a RECIPE only by beating the incumbent seat in swap-variant A/Bs across
  ≥ 2 stages and ≥ 2 policies (promotion of pool cards to player-facing is
  itself gated on a standing `[needs-user-call]` — see the owner-call queue
  in `plan/tuning/2026-07-19-swap-pool-measurement-residue.md`).

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
  a prototype. (Precedent: enchant/disenchant passives are per-card engine
  hooks, so those seats have no swappable candidates.)

- **Sim evidence before edits.** Before any change, run the relevant matrix
  under at least two policies and record the before-state across the §4a
  metric slate — not just win rate. Re-run the SAME matrix (same seeds, same
  flags) after. Cite exact invocations.

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
at late/impossible is a dominance finding, not a success. The curve is
machine-readable as `PRESET_DOCTRINE_WIN_BANDS` (`combat.playtest.ts`):
early 75–85%, mid 45–55%, late 25–35%, impossible 0–2% — the per-preset
rollup's `dev` / `curve-dev` numbers measure distance from exactly these
bands. Correction history: `plan/tuning/2026-07-08-win-path-scaling.md`.

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

### 4a. The metric slate (metrics slate 2026-07-18 — read ALL of it, not just win rate)

Every number the harness prints is a witness for something. A run that
reports only win rate and statusEngagement is under-reading its own
evidence. Where each metric lives: **cell/stage tables** (every run),
**preset rollups** (`--deck=preset:all` runs), **per-card table**
(`--cards` runs).

| Metric (printed as) | Witness for | Read it as |
|---|---|---|
| `winRate` (win), V/M/D/R | the doctrine curve | judge against `PRESET_DOCTRINE_WIN_BANDS`, never in isolation |
| win-path mix (`vic/mer/cap/con/def`) | HOW the deck wins — V/M/D/R folds mercy+capitulate+concede; this un-folds it | a curve repair that shifts wins onto an unintended resolution path (e.g. concede carrying 71% of late wins) is a finding win rate alone hides. **Include the decomposition in every swap sweep.** |
| `statusEngagement` | status play centrality | share of plays landing a status; > 0.2 non-impossible. BLIND SPOT: guard/rapport/SWAY/buff cards land no "status on enemy" — judge defensive/mercy seats by win delta + win-path shift, NOT by engagement or damage share |
| `dotHpFraction` (dotFrac) | DoT as the primary damage path | > 0.25 under greedy |
| `strikeFraction` (strike) | THE STRIKE IS DEAD (spec 32 v3) | expected ~0; a materially nonzero value means raw HP damage leaked in — an investigation trigger, not a tuning knob |
| `dominantCardShare/Id` (dom) | single-card spam | flag any card > 0.70 of attributed enemy-HP damage |
| `deckUtilization` (util) | deck bloat | distinct-played / distinct-deck; low util on a big deck = seats that never matter |
| `usageEntropy` (H) | decision spread | 0 = one-note spam, 1 = plays spread evenly; pairs with dom |
| `avgRounds` ± `roundsStdDev` | clock consistency | high σ = the deck's clock depends on drawing the right cards (the duplicate-more signal) |
| `deadCardRate` + never-played list | reachability | first-class dead-card number; remember: never-played in a preset-only sweep is reachability, not quality (§3) |
| `dev` / `curve-dev` (preset rollup) | doctrine-band fit | signed gap to the band edge per stage / mean absolute gap — the one-number "how far off the curve is this deck?" |
| `skill-gap` (best minus worst policy) | dynamic complexity | near-zero = the deck plays itself; large = play quality matters. Pair with `cx` to spot complicated-but-shallow decks |
| `cx` / kw / orph (preset rollup) | static complexity | vocabulary load, distinct keywords, orphan (single-card) keywords, heaviest card |
| per-card `free%`/`paid%` | line balance | see the 85/15 bands below |
| per-card `fizz%` | precondition width | high fizz = the card's condition rarely holds at its legal seats — a redesign signal (precedent: the four dead-as-seated pool cards of 2026-07-18) |
| per-card `unpl%` | dead-in-hand | hand entries discarded un-played at phase end |
| per-card `hpF`/`hpP` | per-line HP contribution | which printed line actually does the work |
| per-card `draws`, `opp%` | opportunity play rate | `opp% = plays/draws`; low = the policy sees it and declines — a cut signal that pure play counts miss |
| per-card `dWR` | "does drawing this card help?" | win rate in runs where drawn minus not-drawn (same decks); positive = the card pulls its weight; "—" = no contrast available |

Card-level targets on top of the bands:

| Axis | Target |
|---|---|
| Single-card spam | no card > 70% of attributed enemy-HP damage (`dom` in the tables; `buildCombatSummary` is the attribution machinery) |
| Dead cards | every library card shows plays in the card-coverage e2e and non-trivial usage somewhere in the full `--cards` matrix — for cards the preset matrix cannot reach, the witness is a SWAP-VARIANT sweep (§3), not the preset sweep |
| FREE/PAID line balance | for every common/uncommon in its home preset, NEITHER printed line takes >85% or <15% of the card's plays — both tails mean one line is dead weight. Soft bands: the lint (`src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts`, thresholds `// PLAYTEST-CALIBRATION`) flags via `console.info`, never fails; cards tagged `intentionallyAsymmetric` (`Card`, `src/Cards/types.ts`) are exempt by design declaration |
| Pool ratios (v3 — re-derive from the live library before relying on them) | direct damage = 0 by LAW (spec 32: THE STRIKE IS DEAD — a card printing raw HP damage is a spec violation, not a tuning finding); DoT >= 25%; control >= 15%; GUARD >= 1 per theme; Befriend >= 1; state-interactive >= 2 |
| Per-stage pool health | each stage's eligible pool (`stageEligibleCardIds`) contains at least one live DoT, control, and defend line |
| Archetype honesty | each of the 10 theme presets wins through its own HALLMARK keywords (spec 32 §8-9) AND its intended win path (win-path mix); `dot`-focus drafts land more DoT than `balanced` drafts; the `aggro-brute` POLICY stays the weak baseline (a sim policy — the v2 `aggro-strike` preset is retired) |
| Per-deck floors & ceiling (balance the VARIANCE, not the mean) | FLOORS are graded on the starter deck's design window only — every theme preset >= 40% early, >= 25% mid (target ratchets). **Late is informational telemetry, NOT a graded floor** (deck-progression model, owner-confirmed 2026-07-08: an un-matured starter losing late is correct, not a dead-on-arrival bug). The DOMINANCE ceiling applies on EVERY stage incl. late: NO preset > 98% anywhere — a 100% cell is a dominance finding regardless of stage. Impossible targets a hard 0% ceiling for starter presets. Live enforcement values are the `PRESET_FLOORS` (early+mid) / `PRESET_CEILING` (all stages) constants in the balance-band e2e (`// PLAYTEST-CALIBRATION`, pinned loose today) — ratchet floors toward these targets as forge items land; stage averages that hit band while presets sit at 0% on a graded stage or 100% anywhere are a FAIL |

Every run's report includes the per-preset spread table (min/median/max
win rate per stage, one row per preset) — stage averages alone are not
evidence; the round-2 battle lab showed a 53.7% mid average hiding four
presets near 100% and four near 0%.

### 4b. The keyword proving gate (the exit criteria for the registry cap)

Spec 32 §3 caps the registry as a PROVING GATE: the owner intends to grow
past the cap once the current keywords are proven correct. "Proven
correct" is measurable — every run of this skill updates the scoreboard in
`docs/keyword-atlas.md` (owned by `card-expert`; its row roster is the
authoritative keyword count) against these criteria, per keyword:

| Criterion | Evidence |
|---|---|
| Exercised | the keyword's cards show non-trivial plays in the full `--cards` matrix (not just the coverage e2e minimum) |
| Not dominant | no keyword's cards jointly account for >70% of attributed enemy-HP damage on any stage |
| Priced honestly | every card carrying it passes the pricing lint, and its A/B history shows no standing "known-cheap/known-dear" note |
| Theme-honest (hallmarks only) | the keyword's home preset wins through it (§4 archetype honesty), not around it |

A keyword failing a criterion is a forge target, not a retirement
candidate by default — fix the cards first, the keyword second. When
EVERY atlas row is green across a full sweep, report "proving gate:
satisfied" prominently — that is the owner's signal to consider
opening the registry (`[needs-user-call]`; spec 32 §3 change).

Attribution today is per-CARD; per-KEYWORD engagement is derived by
summing a keyword's cards. If that proxy proves too coarse, propose a
per-keyword attribution extension as an engine follow-up (propose-only —
do not build it inside this loop).

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- `npm run baseline:check` (ROOT) — the SessionStart hook prints this too;
  note the baseline's stamp and confidence, and cite it in the report.
- Run the deck suites cold:
  `npx vitest run src/Combat/e2e/combat-deck-draft.engine.test.ts src/Cards/e2e/cards-sandbox.engine.test.ts src/Cards/e2e/swap-pool.engine.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.
- If anything fails before you touch a file, stop and report.

### Step 1 — Read the forge surface
- `src/Combat/combat.starter-deck-presets.ts` — the ten theme presets and
  their card lists (preset id ↔ theme mapping in §8).
- `src/Combat/combat.deck-draft.ts` — focus weights, size/copy defaults,
  guarantees (>= 1 defend, >= 1 status card).
- `src/Combat/combat.stage-profiles.ts` — tier/level gates that shape each
  stage's eligible pool.
- `src/Cards/cards.sandbox-sets.ts` + `src/Cards/swap-pool/` — existing
  experimental sets and the ten swap-pool candidate sets.
- `src/Cards/cards.library.ts` — the literals you may eventually promote into
  or (guardedly) nudge.
- For swap work: the estimates ledger
  (`docs/reports/swap-pool-estimates-2026-07-18.json`) and the standing
  verdicts/owner-call queue in the latest measurement residue
  (`plan/tuning/2026-07-19-swap-pool-measurement-residue.md`) — don't
  re-measure a settled arm or re-open a filed owner call.
- Tally pool ratios per stage against the §4 targets (count each card class
  in the stage's eligible pool and compute its share).

### Step 2 — Baseline matrix
```
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards          # the baseline's own flags
npm run combat-playtest -- --stage=all --policy=all --deck=preset:all --runs=60 --seed=1 --cards   # per-preset × stage rollups
```
Record per stage/policy and per preset: the full §4a slate — win rate,
win-path mix, `statusEngagement`, `dotHpFraction`, `strike`, `util`, `H`,
`dom`, rounds ± σ, `dev`/`curve-dev`, `skill-gap`, `cx`/orphans,
`deadCardRate`, and the per-card table (plays, statusLands, lines, fizz,
opp%, dWR). Flag dead cards, dominant cards, low-opp% cut signals, and any
preset whose win-path mix contradicts its fantasy.

**Diff against the checked-in baseline.** The stamped baseline
(`docs/reports/baselines/deck-matrix-baseline.json`, written by ROOT
`npm run baseline:regen` with the first command's flags) is the drift
alarm: diff the fresh run against it BEFORE forming hypotheses. Drift with
no forge change in between means some other merge moved the balance — that
finding LEADS the report, and stale premises built on the old numbers must
be re-derived (precedent: PR #125 inverted a preset's problem from
dominance to under-performance and silently re-based every open
hypothesis). If the baseline is missing or its seeds/flags no longer
match, regenerate it and note that this run has no drift signal.

### Step 3 — Forge and A/B in the sandbox
For each hypothesis, write or edit a set in `cards.sandbox-sets.ts` (new
cards and/or overrides), then A/B with identical seeds:
```
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1                     # control
npm run combat-playtest -- --stage=mid --policy=dot-weaver --runs=60 --seed=1 --sandbox=<setId>   # treatment
```
For SEAT questions, use the swap-sweep pattern (method precedent,
2026-07-18 — cheap and clean at 60 runs/cell):
```
npm run combat-playtest -- --stage=all --policy=all --deck=preset:all --runs=60 --seed=1 --cards                # one shared control
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards \
    --sandbox=swap-<theme> "--deck=preset:<id>+swap:<out>/<in>"                                                # one arm per candidate seat
```
Reading discipline for every arm: win delta AND win-path decomposition
(what path did the wins move onto?), statusEngagement delta (except
defensive/mercy seats — §4a blind spot), fizz%/opp% of the swap-in at that
seat, and the spam watch (`dom` + the candidate's own share). Compare
against the card's ledger estimate and record the delta. Repeat across
>= 2 stages and >= 2 policies before drawing a conclusion. One change per
axis at a time; measure each before the next.

### Step 4 — Apply, promote, verify
- Preset/draft changes: apply directly with the before/after evidence.
- Library numerics: apply only the patch the sandbox override proved out.
- Promotions: move the proven sandbox card literal into `cards.library.ts`
  (same PR, evidence table attached); leave the sandbox set in place as the
  provenance record or prune it — your call, say which. Swap-pool
  candidates additionally need the standing promotion-gate owner call (§3).
- `npm run verify` after each applied change. Broken test → revert, record
  under "Considered but not applied".
- Any applied change (promotion, preset/draft edit, library nudge) re-stamps
  the baseline: ROOT `npm run baseline:regen`, shipped in the same PR — the
  next run diffs against the world this one leaves behind.
- Update the affected rows of `docs/keyword-atlas.md` (proving-gate
  scoreboard, §4b) in the same PR.

### Step 5 — Deliver on ONE PR
- **Cross-package verify** — before opening the PR, run
  `git diff --name-only` against the changed paths; if any match the
  cross-package impact checklist in `AGENTS.md`, run
  `npm run verify -w axiomancer-mobile` and block the PR on failure.
- Branch off base: `git checkout -b balance/deck-<ts>`.
- Write `docs/reports/deck-tuning-<ts>.md`: pool audit, baseline + drift
  finding, per-preset spread table (§4) and doctrine rollup (`curve-dev`,
  `skill-gap`, `cx` per preset), every A/B with `old → new` + rationale +
  evidence (win delta, win-path shift, engagement, spam watch,
  estimate-vs-measured for swap arms), promotions, propose-only findings,
  open questions, and the **per-deck line-telemetry appendix** — one table
  per preset touched by the run (all ten on a full sweep): each card's
  `free%` / `paid%` / `fizz%` / `unpl%` / `opp%` / `dWR` and per-line HP
  contribution (`hpF`/`hpP`) from the `--cards` matrix, with offenders
  against the §4a 85/15 line-balance bands flagged (mirror of the
  `combat-playtest.line-telemetry` lint's `[line-telemetry]` output).
- Commit: `balance(deck): <ts> report + forge changes (<n> applied)`.
- Push and open a PR (ready for review, never draft, never auto-merged):
  title `balance(deck): card forge <ts> (<n> applied)`; body carries the
  headline finding, the A/B tables, and the promotion evidence.
- No applied changes but a new finding → PR with the report only. Do not open
  a no-op PR repeating the previous tick.

### Step 6 — Report back
One concise message: the PR URL, cards forged/promoted/nudged/swap-measured,
and the headline status-engagement / band delta.

## 6. Hard rules

- **Never push to `main` automatically. Never auto-merge.**
- **Never bypass `npm run verify`,** including the balance-band and
  card-coverage witnesses and the sim oracle
  (`src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`).
- **Never edit engine logic** — `combat.engine.ts`, `toCombatCard`
  classification / `effectImpact` in `combat.cards.ts`, the sandbox registry
  mechanics in `cards.sandbox.ts`, or the effects engine. The forge surface
  is card DATA: sandbox sets, swap pools, presets, draft weights, and
  (guarded) library literals.
- **Never edit library card literals without a sandbox A/B first.**
- **Never swap in a card from another theme without the flag** — a
  cross-theme swap-in is a recolor, a standing owner call (§3). Swap-ins
  come from the preset's own theme: its unseated library cards or its
  `swap-<theme>` candidates. The ONLY exception is a run dispatched with
  `--cross-theme-swaps=true`, which authorizes cross-theme MEASUREMENT
  arms (tagged `[cross-theme]` in the report) — never a shipped recolor.
- **Never invent new `specialMechanics` kinds, verb classes, or effect ids**
  — sandbox prototypes compose existing kinds only; new kinds are
  propose-only.
- **Never ship a sandbox set or swap variant as player-facing content** —
  promotion into `cards.library.ts` is the only shipping path, and a recipe
  seat change additionally needs the color-law arithmetic.
- **Preserve canonical terms** (VITAE/HP, STANCE, Conviction, GUARD, Befriend
  mercy, the policy ids, the stage ids).
- **No emojis. No `Co-Authored-By:` trailers.** Commit style:
  `<type>(<scope>): <description>`.

## 7. Failure modes

1. **A suite fails before any change.** Stop; report the pre-existing
   failure.
2. **The baseline has drifted with no forge change in between.** The drift
   finding leads the report; re-derive any hypothesis premised on the old
   numbers before acting (§5 Step 2 precedent).
3. **A change breaks a test (incl. the balance-band or card-coverage
   witness).** Revert; record under "Considered but not applied".
4. **A sandbox card cannot be exercised** (never drawn/played in the
   harness). Treat as a design failure of the card, not a harness gap —
   redesign or drop it; flag if you suspect the harness. High `fizz%` at
   every legal seat is the same failure in softer form: precondition width,
   not pricing.
5. **The fix is an engine constant, not a card.** Flag it as a manual
   engine-constant follow-up (the combat-tuning loop was trimmed at the
   monorepo merge); note the handoff in the report.
6. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**Preset ↔ theme ↔ swap set (ids do NOT match — this mapping is load-bearing
for swap sweeps):**

| Preset id | Theme | Swap-pool set |
|---|---|---|
| `erosion` | affliction | `swap-affliction` |
| `oratory` | peroration | `swap-peroration` |
| `foundry` | forge | `swap-forge` |
| `penitent` | akrasia | `swap-akrasia` |
| `standstill` | control | `swap-control` |
| `augury` | oracle | `swap-oracle` |
| `tithe` | harvest | `swap-harvest` |
| `grace` | charm | `swap-charm` |
| `bastion` | bulwark | `swap-bulwark` |
| `refrain` | echo | `swap-echo` |

**Tunable surface (tiered):**

| Tier | File | What |
|---|---|---|
| Free (sandbox) | `src/Cards/cards.sandbox-sets.ts` | named sets: new `Card` literals + `{ cardId, patch }` overrides; example set `forge-example` |
| Free (sandbox) | `src/Cards/swap-pool/<theme>.swap-pool.ts` | the ten swap-pool candidate sets (30 spells each) — seat candidates, never player-facing |
| Free (composition) | `src/Combat/combat.starter-deck-presets.ts` | the 10 theme preset card lists (color-law arithmetic applies to shipping changes) |
| Free (composition) | `src/Combat/combat.deck-draft.ts` | focus weights (4x), draft size (10), max copies (2), guarantees |
| Free (measurement) | `+swap:` variants of preset recipes | temporary in-theme seat swaps (treatment arm only) — evidence device, never ships as-is; cross-theme arms only under `--cross-theme-swaps=true` (§3) |
| Guarded (A/B first) | `src/Cards/cards.library.ts` | effect intensity/duration, mechanic amounts, rider numerics + the `// pts:` comment (no damage fields exist — spec 32) |
| Propose-only | — | new mechanics kinds, verb classes, `toCombatCard` / `effectImpact`, engine paths, enchant/disenchant seat growth |

**Deck-selection grammar (shared by `npm run combat-playtest` and
`npm run combat`):**
`preset:<id>[+swap:<out>/<in>,...]` — every copy of `out` becomes `in`,
loud failure on a bad pair; sandbox swap-ins need their set applied via
`--sandbox` · `preset:all` — sweep all ten presets and print the
per-preset × stage rollups · `draft:<focus>` — the CLI accepts
`dot|control|utility|damage|balanced` (`rush-execute` exists in the
`CombatDeckFocus` type for preset metadata but is not CLI-draftable) ·
`cards:a,b,c` · `policy-pick` (drafts from the policy's preferred focus;
the default).

**Evidence CLI:** `npm run combat-playtest` — flags `--stage=<id|all>`,
`--policy=<id|all>`, `--deck=<grammar above>`, `--enemy=<slug>`, `--runs=N`,
`--seed=N`, `--sandbox=<setId[,setId...]>` (comma-separated sets apply in
order), `--legacy-dice` (opt into the pre-spec-33 comparison model — the
sweep DEFAULTS to the spec-33 Upgradeable-Dice model the shipped app boots
ON; `--upgradeable-dice` is the redundant explicit-ON switch), `--cards`
(per-card usage table), `--json` (the `PlaytestReport` — now carrying a
`diceModel` field — and nothing else). Full cookbook: `docs/playtest.md`.

**Baselines (ROOT scripts):** `npm run baseline:check` — freshness alarm
(also printed at session start) · `npm run baseline:regen` — re-measures and
re-stamps `docs/reports/baselines/deck-matrix-baseline.json` (measurement
only; interpretation stays here).

**Machinery (read, don't edit):** `stageEligibleCardIds` / `buildStagePlayer`
(`combat.stage-profiles.ts`), `draftCombatDeck` / `resolveDeckSelection` /
`applyDeckSwaps` (`combat.deck-draft.ts`), sandbox registry
(`src/Cards/cards.sandbox.ts`), `runPlaytestMatrix` / `PRESET_DOCTRINE_WIN_BANDS`
(`combat.playtest.ts`), policies (`combat.sim-policies.ts`), attribution
(`buildCombatSummary`), static complexity (`presetComplexity`,
`combat.card-complexity.ts`).

**Tests (witnesses):**
- Balance bands (THE contract): `src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`
- Card coverage (no dead cards): `src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`
- Swap-pool contract (quotas, pricing, on-theme): `src/Cards/e2e/swap-pool.engine.test.ts`
- Line telemetry (85/15 soft bands): `src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts`
- Draft mechanics: `src/Combat/e2e/combat-deck-draft.engine.test.ts`
- Sandbox registry: `src/Cards/e2e/cards-sandbox.engine.test.ts`
- Sim oracle (must never move): `src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts`

**Doctrine + standing state:** `VISION.md` → Combat vision · `CLAUDE.md`
(load-bearing doctrine, incl. the 2026-07-08 starter-preset win-rate curve) ·
swap program + verdicts: `docs/reports/swap-pool-fanout-2026-07-18.md`,
`plan/tuning/2026-07-19-swap-pool-measurement-residue.md` · estimates
ledger: `docs/reports/swap-pool-estimates-2026-07-18.json` · Swap-Pool
Atlas (owner review page):
`docs/reports/preset-metrics/2026-07-18-swap-pool-atlas.html` · pool-ratio
targets in §4a (from the retired combat-tuning skill; re-derive from the
current card library before relying on them).

**Related loops:** engine constants → manual tuning (the combat-tuning loop
was trimmed at the monorepo merge) · qualitative evidence →
`/combat-playtest`.
