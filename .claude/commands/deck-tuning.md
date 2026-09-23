---
description: Card Forge balance loop for Hazard-Pattern Combat — full card authority (no sandbox-first quarantine) with sandbox/A-B tooling still available as recommended practice; measurement-seat swap sweeps through the playtest matrix, tune presets/draft weights, promote proven cards into the library, deliver report + changes via PR. Engine constants are open to tuning loops too (THE OPEN GATE ¶4) — see `/combat-playtest` for that lane. Content-growth follow-ups (new cards/keywords as first-class content) route to `/forge`.
---

<!-- lexicon-ok: sway -->


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
> experiments, measurement-seat swap sweeps, and library card changes.
> The enemy's SOLE bar is HP; status play, direct damage, and the
> alt-wins all compete on CQI merit (spec 35). Engine constants
> (threat/Conviction economy) are open to tuning loops too (THE OPEN
> GATE ¶4, 2026-08-28) — this skill owns the cards themselves; see
> `/combat-playtest` for the engine-constant lane.

> **Full card authority (THE UNSHACKLING, T direct 2026-08-08 — Phase 41):
> no sandbox-first quarantine, no byte-identity law, no
> recolor-not-repartition rule, no per-change owner ballot.** New card
> ideas and numeric nudges may land directly in `cards.library.ts`;
> prototyping them first as SANDBOX cards/overrides
> (`src/Cards/cards.sandbox-sets.ts`) and A/B-testing through the playtest
> matrix (`npm run combat-playtest -- --sandbox=<set>`) is still the
> recommended way to build confidence, not a precondition. Deliver
> findings and changes on ONE new branch + PR. Nothing auto-lands on
> `main`.
>
> **The transitional-library hold is LIFTED (THE PIPELINE LIBERATION,
> T direct 2026-08-22 — see `plan/bearings.md`).** The 2026-08-08 "do
> not tune, a redesign is coming" ruling named the retired 86-card
> library; the 57-card Profane Canon (`docs/profane-canon.md`) IS the
> library, CQI (spec 35) is its objective function, and this skill is
> live against it. New keywords and new `specialMechanics` kinds are
> also buildable now — through card-expert's FULL wiring checklist
> with cross-package verifies, never half-wired.

## Disambiguation — three combat loops, one doctrine

| | `/deck-tuning` ← **this file** | engine-constant tuning | `/combat-playtest` |
|---|---|---|---|
| Surface | Card pool + deck economy: presets, draft weights, sandbox cards, swap sweeps, library card numerics | Engine constants: threat damage, dice bag, Conviction/Signature economy — open to any tuning/playtest loop with measured evidence (THE OPEN GATE ¶4) | None — evidence + report only |
| Files it edits | `src/Cards/cards.sandbox-sets.ts` (free), `src/Combat/combat.starter-deck-presets.ts`, `src/Combat/combat.deck-draft.ts`, `src/Cards/cards.library.ts` (direct), plus keyword wiring surfaces via the full checklist | `src/Combat/combat.{threat,threat-sequences,engine,cards,dice,signature,deck}.ts` constants | `docs/reports/playtest-<ts>.md` only |
| Witness | `npm run combat-playtest` matrix + per-card usage (`--cards`) + per-preset rollups (`--deck=preset:all`) | `simulateHazardPatternCombat` / `npm run combat-sim` | matrix + `playtester` agents |

Do not cross-contaminate: if the fix for an off-band cell is a threat
multiplier or a Conviction constant, flag it as an engine-constant
follow-up (apply directly with matrix evidence, or route to
`/combat-playtest`) — do not compensate by inflating a card. If the finding is
qualitative ("this stage feels flat"), it likely came FROM
`/combat-playtest`; answer it here with cards, not prose.

## North star — CQI (spec 35), not the retired status-dominance law

**The objective function is the Combat Quality Index**
(`specs/35-objective-function-v2.md`, Phase 43). THE UNSHACKLING voided
status-dominance for combat: direct damage is legal, and status play,
damage, and the alt-wins compete on CQI merit. HP is the only win
condition (`isDefeated(enemy)`). The forge's questions:

1. **Does every stage's pool offer real decisions?** The tier gates
   (`maxCardTier` per stage profile) mean the early pool is thin — it
   must still contain more than one live line to victory, or the early
   game degenerates into one-note play.
2. **Is every card exercisable and none dominant?** `deadCardRate` and the
   card-coverage e2e prove every card can be played; `dom`
   (`dominantCardShare`) and `H` (`usageEntropy`) prove no single card
   carries the deck. Dead cards and dominant cards are both forge failures.
3. **Do the presets and draft weights produce honest archetypes?** Each
   preset on the stage ladder (§8) must win through its own theme
   packages — and through the intended RESOLUTION PATH (the win-path mix
   exposes a deck winning by concede/capitulate when its fantasy is DoT,
   or vice versa).
4. **Do experiments earn their place?** Sandbox A/Bs across >= 2 stages
   and >= 2 policies remain the recommended confidence bar for a
   promotion; obviously-right changes may ship on design judgment
   (THE UNSHACKLING), with the matrix run after as the witness.

A card change that collapses CQI, mints a single-card spam line, or
routes every win onto one resolution path is a balance failure even
when win rates look healthy.

## 1. Purpose

`/deck-tuning` is the balance loop for the combat card pool. It reads the
deck surface (presets, draft weights, library card literals, sandbox sets,
swap pools), exercises the **playtest matrix** (`npm run combat-playtest`)
across stage profiles and sim policies, interprets the full metric slate
(§4a) against the design targets below, and delivers a report — with any
applied card changes and any structural findings that fall outside this
loop's card-data surface (§6) — together on one branch and PR.

It does NOT reimplement the draft, the projection (`toCombatCard`), or the
sim — those are the machinery. The skill is the forge + the delivery layer.

## 2. Invocation

```
/deck-tuning
/deck-tuning --focus="early"                          # one stage id: early|mid|late|impossible
/deck-tuning --focus="dead cards in the tier-1 pool"  # free text: card/preset/archetype concern
/deck-tuning --focus="preset archetype honesty"
/deck-tuning --focus="swap-measure the reward-pool cards"
/deck-tuning --focus="swap-sweep the pilgrim seats"
/deck-tuning --preset=pilgrim                         # scope to ONE preset (the GitHub Action's dropdown)
/deck-tuning --preset=all --runs=60                   # explicit full sweep (the Action's defaults)
/deck-tuning --cross-theme-swaps=true                 # owner-authorized out-of-theme measurement arms
/loop 6h /deck-tuning              # periodic autonomous forging
```

- `--focus` accepts a stage id (scopes the run to that stage's eligible
  pool) or free text naming a card/preset/theme concern.
- `--preset=<id|all>` scopes the run to one preset: baseline that preset
  across all stages (`--deck=preset:<id>`), work its seats/theme swap pool,
  and report its rollup — plus the shared `--deck=preset:all` control when
  swap arms need it. `all` (or absent) = the full preset-ladder sweep. The
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
  recipe change still needs the color-law arithmetic (spec 32 §12); a
  recolor is no longer a standing owner call (THE UNSHACKLING — Phase 41).

- **Free — measurement-seat swap sweeps (owner-ratified 2026-07-18).** The
  lever for measuring a card the shipped recipes cannot reach. Run the
  preset with one seat substituted for the treatment arm of an A/B:
  `--deck=preset:<id>+swap:<out>/<in>,...` (every copy of `out` replaced by
  `in`; control = the same invocation without the swap, identical seeds).

  **The swap law: swap-ins come from OUTSIDE the shipped recipe.** Two
  legal sources —

  | Swap-in source | `--sandbox` needed? | Typical question |
  |---|---|---|
  | Library cards not seated in the recipe (incl. reward-only cards) | no | "does this unseated/reward card earn a seat?" |
  | A candidate set you author in `src/Cards/cards.sandbox-sets.ts` (the registry ships EMPTY — the pre-canon `src/Cards/swap-pool/` directory and its ten `swap-<theme>` sets were DELETED at the 2026-08-08 canon reset; author fresh sets against the Profane Canon as needed) | yes — `--sandbox=<setId>` | "does this candidate beat the incumbent seat?" |

  **The recolor-not-repartition rule is VOID (THE UNSHACKLING, T direct
  2026-08-08 — Phase 41).** A cross-theme swap-in is no longer a standing
  owner call; any theme's swap-pool candidates or unseated library cards
  are legal swap-ins for any preset directly (apply the donor theme's set
  via `--sandbox=swap-<theme>`; comma-separate sets when mixing) and MAY
  ship as a shipped recipe change like any other card change — no separate
  ballot. Still tag a cross-theme arm `[cross-theme]` in the report and
  state which theme donated the card, for traceability. The
  `--cross-theme-swaps=true` flag (§2) remains available to force
  out-of-theme measurement arms on scheduled/default runs, but is no
  longer required to ship a cross-theme result. Prefer rarity-legal seats
  (swap like rarity for like) as a default, not a gate; when a candidate
  has no rarity-legal seat in its target preset, record that as a
  seat-grid finding rather than forcing an off-rarity arm. The raw
  `--sandbox=swap-<theme>` CLI arm is still a measurement device only (it
  may substitute a seat without regard to the 5/5/5 color law); a winning
  candidate ships by actually moving it into the recipe with real
  color-law bookkeeping in the same PR, not by leaving the swap flag on.
  Before designing arms, read the per-card design
  estimates ledger (`docs/reports/swap-pool-estimates-2026-07-18.json`) and
  report estimate-vs-measured deltas — that calibrates the next authoring
  pass. Standing ruling, same date: TRIMS of never-played cards are PAUSED —
  swap telemetry replaces the trim conversation until those cards have real
  numbers (never-played in a preset-only sweep is a reachability fact, not
  a quality verdict — `plan/tuning/2026-07-18-card-library-fanout-synthesis.md`).

- **Free — swap-pool candidate authoring.** Authoring candidate cards per
  theme composes the EXISTING registry keywords by default (carrier-density
  doctrine — reinforce hallmarks toward ≥8 home carriers is still good
  practice, not a hard constraint post-unshackling), and they live in
  sandbox swap-pool sets as seat candidates for preset refinement, or are
  authored straight into `cards.library.ts` if the change is obviously
  good — either path is legal. **The standing `[needs-user-call]` gate on
  promoting a pool card to player-facing is VOID** (THE UNSHACKLING —
  Phase 41): a candidate enters `cards.library.ts` and a recipe directly,
  no owner-call queue, no required A/B win-streak. Measurement evidence
  (below) is still the recommended way to build confidence in a change,
  just no longer a precondition for shipping it.

- **Library card numerics — direct edits allowed.** `combatEffects`
  intensity/duration, `specialMechanics` amounts, and rider numerics in
  `src/Cards/cards.library.ts` may be changed directly; a sandbox-override
  A/B first (same seeds, with vs without `--sandbox=<set>`) is still the
  recommended way to know a patch does what you think, not a prerequisite
  gate (THE UNSHACKLING — Phase 41 voided "no cold edits to library
  literals"). Every numeric change still updates the card's `// pts:`
  arithmetic comment — the pricing lint (`src/Cards/e2e/pricing.engine.test.ts`)
  checks the sum against the printed rank's band; that lint is unrelated to
  the three retired doctrines and stays in force. (`basePower`/
  `scalingMultiplier` were deleted with spec 32 v3; if a card needs to deal
  raw HP damage, author the field/verb it needs — Phase 41 removed the
  prohibition, it did not restore the old fields.)
  <!-- lexicon-ok: base-power -->

- **Buildable — structure, through the full checklist (THE PIPELINE
  LIBERATION, T direct 2026-08-22 — supersedes the old propose-only
  wall).** New `specialMechanics` kinds, verb classes, and effect ids
  may be BUILT in this loop, but only end-to-end: card-expert's full
  wiring checklist (engine + display + pricing + mobile
  registry/gloss + editor union + atlas row + retheme-map entry), a
  hermetic e2e, a library carrier, and the cross-package verifies —
  all in the same PR. A half-wired kind is silently inert (the engine
  switches carry `default:` arms), so no carrier-less or
  display-less kinds, ever. What remains outside this loop's surface:
  changes to `toCombatCard` classification / `effectImpact` semantics and
  engine resolution control flow — those are architecture, not card
  content. Engine constants are no longer in that list (THE OPEN GATE ¶4,
  2026-08-28) — see the disambiguation table above.

- **Sim evidence before edits.** Before any change, run the relevant matrix
  under at least two policies and record the before-state across the §4a
  metric slate — not just win rate. Re-run the SAME matrix (same seeds, same
  flags) after. Cite exact invocations.

- **Promotion path.** Move the literal into `cards.library.ts` in the SAME
  PR, with whatever evidence table the report has for it. Proving out
  across >= 2 stages and >= 2 policies is best practice, not a
  precondition (THE UNSHACKLING voided the per-change owner ballot —
  Phase 41); a card may promote on design judgment alone when the change
  is obviously good.

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

> **Superseded (2026-09-23):** §4/§4a below describe the balance-band contract (per-stage win-rate floors/ceiling, the `// PLAYTEST-CALIBRATION` thresholds and the card-count pins), which was repealed 2026-09-02 by the big-numbers overhaul; the balance-band e2e is now a crash-free smoke test with no graded bands and there is no governing objective function — live truth: `axiomancer-mechanics/src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts` (header), `plan/bearings.md` (THE BIG NUMBERS REWRITE). Body kept as a historical record pending rewrite (plan/AUDIT.md).

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
| `strikeFraction` (strike) | direct-damage share (legal since THE UNSHACKLING) | informational: how much enemy HP falls to direct damage vs DoT/payoffs — judge the MIX against CQI, not against the retired zero-law |
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
| FREE/PAID line balance | for every common/uncommon in its home preset, NEITHER printed line takes >85% or <15% of the card's plays — both tails mean one line is dead weight. Soft bands: the lint (`src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts`) flags via `console.info`, never fails; cards tagged `intentionallyAsymmetric` (`Card`, `src/Cards/types.ts`) are exempt by design declaration |
| Pool ratios (historical v3 targets — re-derive from the live Profane Canon before relying on them; the direct-damage-zero law is RETIRED) | DoT >= 25%; control >= 15%; GUARD >= 1 per theme; Befriend >= 1; state-interactive >= 2 — treat as heuristics pending a CQI-derived re-derivation |
| Per-stage pool health | each stage's eligible pool (`stageEligibleCardIds`) contains at least one live DoT, control, and defend line |
| Archetype honesty | each stage-ladder preset (§8) wins through its own theme packages AND its intended win path (win-path mix); `dot`-focus drafts land more DoT than `balanced` drafts; the `aggro-brute` POLICY stays the weak baseline (a sim policy — the v2 `aggro-strike` preset is retired) |
| Per-deck floors & ceiling (balance the VARIANCE, not the mean) | FLOORS are graded on the starter deck's design window only — every theme preset >= 40% early, >= 25% mid (target ratchets). **Late is informational telemetry, NOT a graded floor** (deck-progression model, owner-confirmed 2026-07-08: an un-matured starter losing late is correct, not a dead-on-arrival bug). The DOMINANCE ceiling applies on EVERY stage incl. late: NO preset > 98% anywhere — a 100% cell is a dominance finding regardless of stage. Impossible targets a hard 0% ceiling for starter presets. The balance-band e2e no longer enforces these floors and ceiling (repealed 2026-09-02, see the §4 banner) — grade them by hand from the matrix; stage averages that hit band while presets sit at 0% on a graded stage or 100% anywhere are a FAIL |

Every run's report includes the per-preset spread table (min/median/max
win rate per stage, one row per preset) — stage averages alone are not
evidence; the round-2 battle lab showed a 53.7% mid average hiding four
presets near 100% and four near 0%.

### 4b. The keyword quality scoreboard (the cap is retired)

**The registry is open to growth** (THE PIPELINE LIBERATION, T direct
2026-08-22 — supersedes the spec 32 §3 proving-gate cap): a new keyword
ships through card-expert's full wiring checklist with its atlas row in
the same PR, no per-item owner ratification. The gate criteria survive
as the per-keyword QUALITY scoreboard — every run of this skill updates
`docs/keyword-atlas.md` (owned by `card-expert`; its row roster is the
authoritative keyword count) against these criteria, per keyword:

| Criterion | Evidence |
|---|---|
| Exercised | the keyword's cards show non-trivial plays in the full `--cards` matrix (not just the coverage e2e minimum) |
| Not dominant | no keyword's cards jointly account for >70% of attributed enemy-HP damage on any stage |
| Priced honestly | every card carrying it passes the pricing lint, and its A/B history shows no standing "known-cheap/known-dear" note |
| Theme-honest (hallmarks only) | the keyword's home preset wins through it (§4 archetype honesty), not around it |

A keyword failing a criterion is a forge target, not a retirement
candidate by default — fix the cards first, the keyword second. A
keyword that stays red across multiple full sweeps is a retirement
candidate to raise in the report (ids die, never rename).

Attribution today is per-CARD; per-KEYWORD engagement is derived by
summing a keyword's cards. If that proxy proves too coarse, a per-keyword
attribution extension is an engine follow-up outside this loop's card-data
surface (§6, "Never edit engine logic") — flag it in the report; no owner
gate blocks building it elsewhere (THE OPEN GATE ¶5).

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- `npm run baseline:check` (ROOT) — the SessionStart hook prints this too;
  note the baseline's stamp and confidence, and cite it in the report.
- Run the deck suites cold:
  `npx vitest run src/Combat/e2e/combat-deck-draft.engine.test.ts src/Cards/e2e/cards-sandbox.engine.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.
- If anything fails before you touch a file, stop and report.

### Step 1 — Read the forge surface
- `src/Combat/combat.starter-deck-presets.ts` — the stage-ladder presets
  and their card lists (roster in §8).
- `src/Combat/combat.deck-draft.ts` — focus weights, size/copy defaults,
  guarantees (>= 1 defend, >= 1 status card).
- `src/Combat/combat.stage-profiles.ts` — tier/level gates that shape each
  stage's eligible pool.
- `src/Cards/cards.sandbox-sets.ts` — the experiment registry (ships
  empty since the 2026-08-08 canon reset; author sets as needed).
- `src/Cards/cards.library.ts` — the literals you may eventually promote into
  or (guardedly) nudge.
- Historical swap-program artifacts
  (`docs/reports/swap-pool-estimates-2026-07-18.json`,
  `plan/tuning/2026-07-19-swap-pool-measurement-residue.md`) describe
  the RETIRED pre-canon library — read for method precedent only;
  their card verdicts do not transfer to the Profane Canon.
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
- Library numerics: apply directly (evidence recommended, not required).
- Promotions: move the sandbox card literal into `cards.library.ts` (same
  PR, evidence table attached if there is one); leave the sandbox set in
  place as the provenance record or prune it — your call, say which. No
  standing owner-call gate on swap-pool promotions (THE UNSHACKLING —
  Phase 41).
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
  estimate-vs-measured for swap arms), promotions, any structural findings
  outside this loop's surface, open questions, and the **per-deck
  line-telemetry appendix** — one table
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
- **Cross-theme swap-ins are permitted directly** (THE UNSHACKLING voided
  the recolor-not-repartition rule — Phase 41); tag a cross-theme arm
  `[cross-theme]` in the report and note which theme donated the card.
- **Never ship a half-wired `specialMechanics` kind, verb class, or effect
  id** — new kinds are legal (THE PIPELINE LIBERATION) but only through
  the FULL wiring checklist with a library carrier and cross-package
  verifies; sandbox-only prototypes still compose existing kinds.
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
5. **The fix is an engine constant, not a card.** Engine constants are open
   to tuning loops too (THE OPEN GATE ¶4) — apply it directly with matrix
   evidence, or route it to `/combat-playtest`; note which in the report.
6. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**The preset roster is the STAGE LADDER (Profane Canon, 2026-08-08 —
the pre-canon ten per-theme presets and their `swap-<theme>` sets are
retired):**

| Preset id | Name | Stage | Focus |
|---|---|---|---|
| `threadbare` | The Threadbare Office | early | balanced |
| `pilgrim` | The Pilgrim's Burden | mid | dot |
| `apostate` | The Apostate's Canon | late | dot |

Read the live roster from `COMBAT_DECK_PRESETS`
(`src/Combat/combat.starter-deck-presets.ts`) — this table is a cache.

**Tunable surface (tiered):**

| Tier | File | What |
|---|---|---|
| Free (sandbox) | `src/Cards/cards.sandbox-sets.ts` | named sets: new `Card` literals + `{ cardId, patch }` overrides (registry ships empty — author sets as needed) |
| Free (composition) | `src/Combat/combat.starter-deck-presets.ts` | the stage-ladder preset card lists (§8) |
| Free (composition) | `src/Combat/combat.deck-draft.ts` | focus weights (4x), draft size (10), max copies (2), guarantees |
| Free (measurement) | `+swap:` variants of preset recipes | temporary seat swaps (treatment arm only) — evidence device, never ships as-is |
| Direct (evidence recommended) | `src/Cards/cards.library.ts` | card literals: numerics, riders, new cards + the `// pts:` comment |
| Buildable (full wiring checklist) | `src/Cards/types.ts` + engine/display/pricing/mobile/editor surfaces | new keywords, `specialMechanics` kinds, effect ids — via card-expert's 12-step checklist + hermetic e2e + cross-package verifies (THE PIPELINE LIBERATION, 2026-08-22) |
| Open (evidence recommended) | engine constants | threat/Conviction economy — tunable directly with measured evidence (THE OPEN GATE ¶4); `/combat-playtest` is the other lane for this surface |
| Loop-stewarded, high bar | LOCKED MECHANICS | Conviction / Surge / Dice: cards and keywords may read/feed/spend/interact freely; removing, no-op'ing, or routing around any of the three needs overwhelming design evidence, filed as `[loop-call]` (THE OPEN GATE ¶2) |

**Deck-selection grammar (shared by `npm run combat-playtest` and
`npm run combat`):**
`preset:<id>[+swap:<out>/<in>,...]` — every copy of `out` becomes `in`,
loud failure on a bad pair; sandbox swap-ins need their set applied via
`--sandbox` · `preset:all` — sweep every preset and print the
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

**Related loops:** engine constants → tunable here too with measured
evidence, or via `/combat-playtest` (THE OPEN GATE ¶4) · qualitative
evidence → `/combat-playtest`.
