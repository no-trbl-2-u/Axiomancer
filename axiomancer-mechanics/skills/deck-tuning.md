# Skill: deck-tuning

> **The Card Forge — tunes the combat CARD POOL and DECK economy for the
> Hazard-Pattern Combat.** Deck presets, draft weights, sandbox card
> experiments, and (with A/B evidence) library card numerics. The enemy's
> SOLE bar is HP and status effects are the EFFICIENT way to drop it — every
> card change is judged by whether it makes status play more central and more
> satisfying. Engine constants (threat/Conviction economy) belong to
> **`/combat-tuning`**; this skill owns the cards themselves.

> **High autonomy within hard guardrails, sandbox-first.** New card ideas and
> numeric nudges to existing cards are prototyped as SANDBOX cards/overrides
> (`src/Cards/cards.sandbox-sets.ts`), A/B-tested through the playtest matrix
> (`npm run combat-playtest -- --sandbox=<set>`), and only promoted into the
> library with the evidence table attached. Deliver findings and changes on
> ONE new branch + PR. Nothing auto-lands on `main`.

## Disambiguation — three combat loops, one doctrine

| | `/deck-tuning` ← **this file** | `/combat-tuning` | `/combat-playtest` |
|---|---|---|---|
| Surface | Card pool + deck economy: presets, draft weights, sandbox cards, library card numerics | Engine constants: threat damage, dice bag, Conviction/Signature economy | None — evidence + report only |
| Files it edits | `src/Cards/cards.sandbox-sets.ts` (free), `src/Combat/combat.deck-presets.ts`, `src/Combat/combat.deck-draft.ts`, `src/Cards/cards.library.ts` (guarded) | `src/Combat/combat.{threat,threat-sequences,engine,cards,dice,signature,deck}.ts` constants | `plan/playtest-<ts>.md` only |
| Witness | `npm run combat-playtest` matrix + per-card usage (`--cards`) | `simulateHazardPatternCombat` / `npm run combat-sim` | matrix + `playtester` agents |

Do not cross-contaminate: if the fix for an off-band cell is a threat
multiplier or a Conviction constant, hand it to `/combat-tuning` — do not
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
3. **Do the presets and draft weights produce honest archetypes?** A
   `dot`-focus draft must actually out-DoT a `damage`-focus draft; the
   `aggro-strike` preset must remain the weak baseline (its underperformance
   IS the design), and `dot-erosion`/`control-lock` must beat it where it
   counts.
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
- **Guarded — library card numerics.** `basePower`, `scalingMultiplier`,
  `combatEffects` intensity/duration, and `specialMechanics` amounts in
  `src/Cards/cards.library.ts` may be changed ONLY after a sandbox-override
  A/B of the exact same patch shows the intended effect (same seeds, with vs
  without `--sandbox=<set>`). No cold edits to library literals.
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

The **contract** is the balance-band e2e:
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`. Its thresholds
(marked `// PLAYTEST-CALIBRATION`) are the live bands — read them at run time
rather than trusting this table to stay current. Current placeholders:

| Axis | Band |
|---|---|
| Win rate — early (blind, policy-pick) | 0.55–1.0 |
| Win rate — mid (blind) | 0.35–1.0 |
| Win rate — late (blind) | 0.15–1.0 |
| Impossible stage (greedy) | winRate <= 0.15 and defeats > 0 — losing is the design |
| Status engagement | > 0.2 on every non-impossible stage |
| Doctrine assertion | `dot-weaver` beats `aggro-brute` win rate on the late stage |
| DoT HP share | `dotHpFraction` > 0.25 on greedy stage summaries |

Card-level targets on top of the bands:

| Axis | Target |
|---|---|
| Single-card spam | no card id accounts for >70% of a typical win's impact (`buildCombatSummary`) |
| Dead cards | every library card shows plays in the card-coverage e2e and non-trivial usage somewhere in the full `--cards` matrix |
| Pool ratios (per `skills/combat-tuning.md` §4) | direct-damage <= 20% of pool; DoT >= 25%; control >= 15%; GUARD >= 1 per color; Befriend >= 1; state-interactive >= 2 |
| Per-stage pool health | each stage's eligible pool (`stageEligibleCardIds`) contains at least one live DoT, control, and defend line |
| Archetype honesty | `dot`-focus drafts land more DoT than `damage`-focus drafts; `aggro-strike` preset stays the weak baseline |

## 5. The procedure

### Step 0 — Sync & sanity
- Clean working tree; note the base branch (usually `main`). `npm ci` if
  `node_modules` is absent.
- Run the deck suites cold:
  `npx vitest run src/Combat/e2e/combat-deck-draft.engine.test.ts src/Cards/e2e/cards-sandbox.engine.test.ts src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts src/Combat/e2e/combat-playtest.card-coverage.sim.test.ts`.
- If anything fails before you touch a file, stop and report.

### Step 1 — Read the forge surface
- `src/Combat/combat.deck-presets.ts` — the five presets and their card lists.
- `src/Combat/combat.deck-draft.ts` — focus weights, size/copy defaults,
  guarantees (>= 1 defend, >= 1 status card).
- `src/Combat/combat.stage-profiles.ts` — tier/level gates that shape each
  stage's eligible pool.
- `src/Cards/cards.sandbox-sets.ts` — existing experimental sets.
- `src/Cards/cards.library.ts` — the literals you may eventually promote into
  or (guardedly) nudge.
- Tally pool ratios per stage against the §4 targets (the combat-tuning §5
  Step 1b table is the method).

### Step 2 — Baseline matrix
```
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards
npm run combat-playtest -- --stage=early --policy=blind --deck=preset:dot-erosion --seed=1
npm run combat-playtest -- --stage=late --policy=dot-weaver --deck=policy-pick --seed=1 --cards
```
Record per stage/policy: win rate, V/M/D/R, `statusEngagement`,
`dotHpFraction`, and the per-card usage table (plays, status lands,
discards). Flag dead cards (zero or near-zero plays where eligible) and
dominant cards.

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

### Step 5 — Deliver on ONE PR
- Branch off base: `git checkout -b balance/deck-<ts>`.
- Write `plan/deck-tuning-<ts>.md`: pool audit, baseline matrix, every A/B
  with `old → new` + rationale + evidence, promotions, propose-only findings,
  open questions.
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
4. **The fix is an engine constant, not a card.** Hand it to
   `/combat-tuning`; note the handoff in the report.
5. **Focus matches nothing.** Run the full sweep; note the empty focus.

## 8. Quick reference

**Tunable surface (tiered):**

| Tier | File | What |
|---|---|---|
| Free (sandbox) | `src/Cards/cards.sandbox-sets.ts` | named sets: new `Card` literals + `{ cardId, patch }` overrides; example set `forge-example` |
| Free (composition) | `src/Combat/combat.deck-presets.ts` | preset card lists (`dot-erosion`, `control-lock`, `utility-bulwark`, `aggro-strike`, `balanced`) |
| Free (composition) | `src/Combat/combat.deck-draft.ts` | focus weights (4x), draft size (10), max copies (2), guarantees |
| Guarded (A/B first) | `src/Cards/cards.library.ts` | `basePower`, `scalingMultiplier`, effect intensity/duration, mechanic amounts |
| Propose-only | — | new mechanics kinds, verb classes, `toCombatCard` / `effectImpact`, engine paths |

**Deck-selection grammar (shared by `npm run combat-playtest` and
`npm run combat`):** `preset:<id>` | `draft:<focus>` (`dot|control|utility|damage|balanced`)
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
doctrine) · pool ratio targets in `skills/combat-tuning.md` §4.

**Related loops:** engine constants → `/combat-tuning`
(`skills/combat-tuning.md`) · qualitative evidence → `/combat-playtest`
(`skills/combat-playtest.md`).
