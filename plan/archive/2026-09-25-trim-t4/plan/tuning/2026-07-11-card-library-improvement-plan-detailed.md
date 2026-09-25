# Card-library improvement plan — detailed decomposition

> Executes `2026-07-11-card-library-improvement-plan.md` (the parent
> plan, this PR). Every workstream is decomposed to the exact edits,
> file/line anchors, commands, and pass criteria an implementing
> session would follow — "exactly what you would do," not "what should
> happen." Grounded 2026-07-11 by four working-tree passes (combat
> engine, cards layer, effects layer, playtest harness); every anchor
> below was read from branch HEAD, not quoted from memory. Line
> numbers drift — treat them as starting points and re-grep before
> editing.
>
> Read order: parent plan for the why, this doc for the how. Where
> the two disagree, §0 wins (it corrects the parent against the
> working tree and the ratified build plan). Tiers and kill
> conditions are inherited from the parent unless restated.

## 0. Corrections and reconciliations — read before executing

### 0.1 Working-tree corrections to the parent plan

Facts the parent plan states loosely or wrongly, checked against the
tree. None invalidates a workstream; several change its first step.

| # | Parent claim | Working-tree fact | Consequence |
|---|---|---|---|
| C-1 | "sweep the ~20 DoT-payload debuffs" (WS3 step 3) | `debuffs.library.json` has **41** debuffs, of which **14** carry a `damageOverTime` payload (+2 negative-regen drains: `debuff_disease`, `debuff_hp_decay`) | WS3.3's sweep table below enumerates all 14 by id; the sweep is smaller than budgeted |
| C-2 | "the 6 unregistered DoT clones get registered … or retired" (WS3/WS10) | The six ids (`debuff_argument_wound`, `debuff_echo_sting`, `debuff_kindling_ember`, `debuff_nettle_sting`, `debuff_foretold_wound`, `debuff_backfire_acute`) **are registered effects** — every reference resolves. "Unregistered" means **no keyword maps to them** (they are keyword-less DoT species beside POISON/BLEED). Enumeration: `plan/tuning/2026-07-10-audit-evidence/cross-keywords.md` §3 | The remediation verb is **fold-or-retire**, not "register": each either folds into POISON/BLEED/MARK payloads or is deleted from the JSON with its card references re-pointed. This is Phase 29 KW-1 work (see §0.2) |
| C-3 | "spec 26b §4.8" (verification table) | No spec-26b file exists. The RPS die-cost text is **spec 25 §4.8** ("RPS Advantage — Survival", `specs/25-hazard-pattern-combat.md:294-306`) | WS0.3's doc-comment fixes cite spec 25 §4.8 |
| C-4 | "`sig-conviction-strike` + `STRIKE_DAMAGE_MULT` … strike class" (WS0) | `sig-conviction-strike` is kind **`dot`** (poison applier, `combat.signature.ts:50`). No signature in `SIGNATURE_SKILLS` carries kind `strike`. `STRIKE_DAMAGE_MULT = 3` (`:93`) and the `strike` branch of `applySignatureSkill` (`:189-197`) are **reachable only by the kind union, not by any shipped signature** | WS0.2's cheapest ratification: delete the dead `strike` arm + constant instead of renaming it. Verify nothing else constructs a `strike`-kind signature (tests, mobile) before cutting the union member |
| C-5 | "atlas row count still exactly 30" (WS10 gate) | Atlas has exactly 30 rows today INCLUDING `TICK` — but TICK was **owner-ratified killed 2026-07-10** (spec 32 amendment item #2, lines 12-16; build-plan Phase 29 KW-4, riding Phase 30). FESTER/TRANSMUTE are card-face vocabulary under the 2026-07-10 card-keyword doctrine, not atlas rows | WS10's gate restated: "registry matches the ratified doctrine — no unregistered repeated mechanics; row count changes only via ratified add/retire." After TICK dies the count is 29 unless the owner ratifies a replacement |
| C-6 | WS3 clock table: "POISON = ramp (`growth: per-turn`), BLEED = `decay: per-trigger`, MARK = battle-long" | The 2026-07-10 amendment (spec 32 lines 17-19) **already ratifies a different, more specific assignment**: "POISON / BLEED / MARK get distinct firing conditions (**per-card-played / per-damage-instance / on-payoff class**), specced in EA-7" — i.e. the trigger axis is decided; the parent's table re-derives a weaker version | WS3's [owner-call] shrinks: the clock ASSIGNMENT is ratified; what still needs the owner is the schema shape, calendar-expiry removal, and the Doom species (WS3.0) |
| C-7 | "mercy-exploit … `combat.engine.ts:2948`" | `selectMercyChoice` at 2937, the strike at **2949**: `max(10, round(maxHealth × 0.5))` | anchor only |
| C-8 | "~30 bespoke zoneHas hooks … 31 occurrences" | **30 call sites**, `zoneHas` defined at `combat.engine.ts:732`; 22 distinct enchantment ids | anchor only |
| C-9 | WS5: "verify state availability … RECOIL-paid-this-turn, prior card's stance" | `spellsPlayedThisTurn` EXISTS (`combat.encounter.types.ts:557`). Prior card's stance is derivable without new state (`lastSpellCardId` at `:559` → `getCardById(id).stance`). **RECOIL-paid-this-turn and damage-taken-this-turn do NOT exist** (locals inside `playBottomAction` / `resolveThreatPhase` only) | WS5.1's [owner-call] is scoped to exactly two new state fields; two of the four conditions are buildable today |
| C-10 | WS6: "draft-simulation evidence: each bridge picked by ≥2 preset origins" | **No reward-screen draft simulator exists.** `combat.deck-draft.ts` drafts whole decks at encounter start; the reward path (`combat.rewards.ts` → `rollCombatCardRewards`) is not wired to any sim | WS6 gains a step 0: build the reward-draft harness (WS6.1 below) before any bridge can be judged |
| C-11 | WS2: Thoughtform definitions "wherever conjured cards live" | A conjured card is a **normal card id** resolved through `getCardById` (`conjure_card` at `combat.engine.ts:1695` just pushes `{uid, cardId}` into hand and `conjuredUids`); "Thoughtform" is display copy only (`combat.cards.ts:229`) | Adding Thoughtforms to `cards.library.ts` would break the pinned 70-card law (effectiveness lint pins 70 at `card-effectiveness.engine.test.ts:563`; pricing lint pins 50 spells at `pricing.engine.test.ts:49`). WS2.1 therefore adds a **separate Thoughtform registry** (see below) instead of touching the 70 |

### 0.2 Reconciliation with build-plan Phases 26–33 (EA-1..EA-8)

The parent plan was written against `2026-07-08-win-path-scaling.md`
but the build plan ALREADY carries the owner-ratified 2026-07-10
engagement-overhaul phases (`plan/steps/01_build_plan.md`, Phases
26-33; promotion record in `plan/PHASE_CANDIDATES.md` "EA-1..EA-8").
Several workstreams overlap a ratified phase. Per the source-of-truth
hierarchy (bearings: T's explicit decision > build plan > this doc),
the phase's ratified shape wins wherever they collide:

| WS | Overlapping phase | Resolution |
|---|---|---|
| WS1 telemetry | **Phase 26 (Turn Law)** — "blocks every numeric tuning decision repo-wide"; **Phase 27 (Re-baseline)** — "every pre-2026-07-10 plan/tuning number gets an asterisk" | Build WS1's counters any time (mechanism, not numbers), but the OFFICIAL offender list is cut only from a post-Phase-26/27 matrix. If Phase 26 hasn't landed when WS1 runs, publish the list marked PROVISIONAL and re-cut after |
| WS2 FREE-line conversions | **Phase 30 (FREE Lines, 70-card content pass)** — shape ratified 2026-07-10: Option A (constrain the fork) + weak-deposit `DRAW 1` kicker; TICK dies in the same pass | WS2.2 does NOT invent its own conversion shape. It implements Phase 30's ratified law on its first 2-3-cards-per-theme slices — WS2.2 is a down-payment on Phase 30, executed through `/deck-tuning`, and its conversions must satisfy the Phase 30 FREE-currency lint when that lands |
| WS3 DoT clocks | **Phase 32 (Theme Deep Work)** — "DoT-clock direction ratified 2026-07-10 (distinct triggers)"; EA-7 is where exact triggers are specced (`2026-07-10-theme-identity.md` §1) | WS3 IS the EA-7 spec-and-implement work. Its owner-call shrinks to schema + calendar-removal + Doom species (C-6). Its data sweep folds the keyword-less clones WITH Phase 29 KW-1, not separately |
| WS4 harvest/bulwark roles | **Phase 32** ratifies: harvest = "REAP attacks max HP + **travelling Souls**", bulwark = "RIPOSTE reflects the prevented blow", akrasia = DEBT ledger | Two parent-plan calls are overridden: (a) the parent PARKED the cross-combat Souls bank, but Phase 32's ratified harvest rework includes travelling Souls — the park is void; WS4-harvest builds toward it. (b) The parent's Reaping-shaped max-HP vector (comparison C6) is not deferred — it is Phase 32's ratified harvest shape. WS4's bulwark sketches (Rampart Reckoning consume-all-defense) must be reconciled with the ratified RIPOSTE-reflects-prevented-blow in the owner batch — they may be the same card |
| WS9 threat branches | **Phase 33 (Enemy Answers)** — one reactive verb engine-wide, variable-rung telegraphs, CAUTERIZE/Premise-shed/SWAY-cleanse enemies | WS9 ships as a Phase 33 slice (the branch-node prototype is the thin wedge of that phase), not as an independent engine change. Same sequencing rule (after WS3/WS7 math is honest) |
| WS10 registry hygiene | **Phase 29 (The Language)** — KW-1 folds the 6 unmapped debuff ids (ungated), KW-2 merge/retire, KW-4 TICK killed (rides Phase 30), KW-5/KW-7 lints + glossary | WS10 is executed AS Phase 29 slices. The BARRIER/GUARD merge question joins KW-2's merge/retire list |

### 0.3 Sequencing consequence

The parent's dependency graph stands, with one addition at the front:
**Phase 26 (Turn Law) + Phase 27 (Re-baseline) precede every numeric
gate in this plan.** A workstream may land its MECHANISM (tests,
counters, schema, sandbox sets) before Phase 26, but no card is
promoted and no kill condition is judged on pre-Turn-Law numbers.

```
Phase 26 turn law → Phase 27 re-baseline ─┐  (gates all numbers)
WS0 doctrine hygiene ──┐                  │
WS1 telemetry ─────────┼──────────────────┴→ WS2 (rides Phase 30 shape) → WS4 per theme
                       ├─→ WS3 = EA-7/Phase 32 slice ──┘        ↘
                       │        ↓                                WS6 bridges
                       │   WS7 caps + chooseX ─→ WS4(forge)     ↗
                       ├─→ WS5 microset (sandbox-only, independent)
                       ├─→ WS8 control surfaces (independent)
                       └─(after WS3+WS7)→ WS9 = Phase 33 slice
WS10 rides Phase 29 (KW-1 with WS3's sweep).
```

---

## Standing execution mechanics (referenced by every workstream)

**Where things are.** All engine paths below are under
`axiomancer-mechanics/`. The matrix engine is
`src/Combat/combat.playtest.ts` (`runPlaytestMatrix`); CLI
`src/CLI/combat-playtest.cli.ts`; contract test
`src/Combat/e2e/combat-playtest.balance-bands.sim.test.ts`; sandbox
sets `src/Cards/cards.sandbox-sets.ts` (merged into matrix pools
automatically — `combat.playtest.ts:30/278`).

**Baseline command** (run from `axiomancer-mechanics/`):

```bash
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=1 --cards
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=2 --cards   # confirm
npm run combat-playtest -- --stage=all --policy=all --runs=60 --seed=3 --cards   # confirm
```

A/B = the identical command with `--sandbox=<setId>`. Diff against
`docs/reports/baselines/deck-matrix-baseline.json` before forming
hypotheses; regenerate it in any PR that changes matrix output.

**Per-preset spread** (floors/ceiling/curve): run
`npx vitest run combat-playtest.balance-bands` and read the
`[preset-spread]` / `[curve]` console.info lines. Live calibration
(`// PLAYTEST-CALIBRATION`, test lines 102-110): floors early 0.2 /
mid 0 (ratchet targets 0.40 / 0.25), ceiling 1.0 (target 0.98), late
= telemetry only, `KNOWN_CURVE_VIOLATORS = ['grace','refrain','standstill']`.
Ratified curve: early ~80 / mid ~50 / late 25-35 / impossible 0.

**Verify gates.** Any diff under `src/Combat/**`, `src/Cards/**`,
`src/Effects/**`, or `src/index.ts` runs the trio:

```bash
npm run verify -w axiomancer-mechanics
npm run verify -w axiomancer-mobile
npm run type-check -w axiomancer-card-editor
```

Card-editor is not optional even for "additive" type changes — the
`grant_permanent_wild_die` witness (edba726) broke its
`SpecialMechanicKind` union with mechanics + mobile green.

**Wiring checklist** (from `.claude/agents/card-expert.md:151-166`,
restated so this doc is self-contained): (1) status piece →
`src/Effects/{buffs,debuffs}.library.json` + `EffectPayload` field if
new + handling in `src/Combat/effects.ts`; (2) verb piece → new
`CardSpecialMechanic` member or `CardRider` field in
`src/Cards/types.ts`; (3) runtime → `case` in the `combat.engine.ts`
mech switch; (4) display → `case` in `combat.cards.ts` + `PAYOFF_KINDS`
if affliction payoff; (5) pricing → verb cost in `cards.pricing.ts`;
(6) card literals in `cards.library.ts` with `// pts:` comments;
(7) hermetic e2e at `src/<Module>/e2e/`; (8) exports from
`src/Cards/index.ts` if new types ship.

**Card-count pins.** The library is pinned at 70 cards / 50 spells
(`card-effectiveness.engine.test.ts:563`, `pricing.engine.test.ts:49`)
plus structural pins in `curated-library.engine.test.ts`. Any step
that adds a LIBRARY card must bump those pins deliberately in the
same commit, with the bump called out in the PR body. Sandbox cards
don't touch the pins — which is why every prototype below lives in a
sandbox set until its gate passes.

---

## WS0 — Doctrine hygiene: name the sacraments, cut the strike vocabulary

**Tier** free (WS0.1, WS0.4) + [owner-call] (WS0.2, WS0.3). **Size**
S-M. **Deps** none — do first.

### Current state (grounded)

`applyDamage` lives in `src/Combat/health.ts:12` (pure,
zero-clamped). The engine has **24 call sites**, `combat.signature.ts`
two more (`:158` conclude, `:190-191` strike/mercy). The full
classified inventory — WS0.1's deliverable — is already done:

| Class | Sites (enemy-directed) |
|---|---|
| (a) status-gated payoff — doctrinally legal | `:643` fate-tap DoT tick · `:920`/`:928` rider ticks · `:941` mark-conclusion RUPTURE (capped) · `:1523` RUPTURE (capped) · `:1539` WINNOWING consume · `:1584` REAP-ALL (capped) · `:1899`/`:1912`/`:1923` fired-rider ticks · `:2306` BACKFIRE per-rung · `:2378` RIPOSTE · `:2387` THORNS · `:2546` suppurating-curse DoT amp · `:2560` VULNERABLE surcharge |
| (b) enchant-gated drips — sanctioned by spec 32 §12 A5 | `:754`/`:1415` bone-orchard per-Soul · `:1431` stuck-in-their-head echo drip · `:2438` crumbling-resolve wall upkeep |
| (c) alternate-outcome consequence | `:2949` mercy-exploit `max(10, 0.5 × maxHP)` |
| (d) signature | `combat.signature.ts:158` Conclusion per-stack (`CONCLUDE_DMG_PER_STACK = 2`, `:96`) · `:190-191` the strike/mercy HP branch |
| (e) legacy contradiction | engine header line 7 + comment block ~75; the `strike` kind arm (`:189-197`) + `STRIKE_DAMAGE_MULT = 3` (`:93`) — **no shipped signature has kind `strike`** (C-4) |
| player-directed (not doctrine-relevant) | `:1313` fate recoil · `:1447` RECOIL · `:2341` enemy attack |

### Steps

**WS0.1 — freeze the inventory (free, done above).** Transcribe the
table into the spec 32 §12 amendment draft (WS0.2) and into the test
fixture (WS0.4). No code change.

**WS0.2 — [owner-call] ratify the named exceptions.** One owner
session item. Proposed text for spec 32 §12 (new decision block):

> Direct-HP paths, ratified 2026-07-XX. Classes (a) status-gated
> payoffs, (b) A5 enchant-gated drips, and reflect (THORNS/RIPOSTE)
> are legal BECAUSE their prerequisite is printed (stacks present,
> enchant in zone, enemy attacked). Class (c) mercy-exploit is the
> alternate-outcome consequence (Phase 108) — legal only from the
> mercy screen. Signatures: Conclusion fires only per status stack
> (kind `conclude`); Disarming Plea's flat-magnitude chip (kind
> `mercy`) is ratified as a signature-only exception / or re-payload
> to status-only (owner picks). The `strike` signature kind and
> `STRIKE_DAMAGE_MULT` are dead vocabulary — deleted.

Implementation after ratification (one commit): delete the `strike`
arm at `combat.signature.ts:189-197` and `STRIKE_DAMAGE_MULT` (`:93`);
remove `'strike'` from `SignatureSkillKind`
(`combat.encounter.types.ts:175`) — union member removal, so run the
full verify trio and grep mobile for `'strike'` first; rewrite engine
header line 7 and the line-75 block to describe status-first combat
and point at spec 32 §12.

**WS0.3 — [owner-call] reconcile the two die-cost laws.** Facts: the
COLOR LAW (`combat.engine.ts:1139`) makes off-color plays fizzle; the
RPS read now only feeds `READ_DAMAGE_MULT` (`:1160`).
`resolveCardDieCost` (`:236`) survives as the legacy 0/1/2 classifier,
called by `cardDieCostPreview` (`:3014`), exported through
`src/Combat/index.ts:152` and the locked barrel `src/index.ts:101`.
Decision for the owner, with recommendation:

- (i) **Recommended:** deprecate-in-place. Doc-comment both functions
  (each names the other and the surface it owns: Color Law = play
  legality, `resolveCardDieCost` = advantage-read preview), add
  `@deprecated — superseded by the Color Law for die COST; retained
  as the read classifier` on the barrel export, file the mobile
  migration as a follow-up. No removal (locked-barrel rule: removal
  is a semver-major phase).
- (ii) If the owner instead ratifies it as the live read layer:
  rename nothing, re-document both, and add a spec 25 §4.8 note that
  cost semantics moved to the Color Law.

Either way: grep `axiomancer-mobile/` for `resolveCardDieCost` /
`cardDieCostPreview` before writing the doc comments, so the claim
about who consumes it is true; run the verify trio.

**WS0.4 — the doctrine witness test (free).** New
`src/Cards/e2e/doctrine-strike-dead.engine.test.ts`:

1. Fixture: a **clean** variant of the effectiveness lint's
   `buildFixtureState` (`card-effectiveness.engine.test.ts:120-191`)
   — same level-20 player and die tray, but the enemy carries NO
   pre-applied effects, no marks, guard/barrier 0, full HP. Extract
   the builder into `src/test-utils/` (or a shared local helper) with
   a `{ clean?: boolean }` flag rather than duplicating 70 lines.
2. For each of the 70 library cards: play the PAID line
   (`playCombatCard`), then assert
   `after.enemy.health === before.enemy.health` — a clean enemy has
   no stacks, so every legal payoff (RUPTURE fuel 0, REAP 0 souls,
   TICK nothing) must chip nothing. Allowed deltas: DoT/status
   APPLICATION (effects array grows), reflect setup, alt-win progress
   (premises/sway/rungs), draws, guard.
3. Exceptions are a literal `NAMED_EXCEPTIONS: Record<cardId, reason>`
   map in the test, REQUIRED to mirror spec 32 §12's ratified list —
   assert the map's keys are a subset of a hardcoded copy of the §12
   list so an unratified exception fails loudly. Expected content
   today: empty (no library card should need one; the drips are
   enchant-zone-gated and a clean state has no zones populated).
4. Signature extension: for each entry in `SIGNATURE_SKILLS`, apply
   via `applySignatureSkill` with prerequisites synthesized (stacks
   for Conclusion) and assert only ratified kinds (`conclude`,
   `mercy` if kept) change enemy HP.
5. Vocabulary sweep, mechanized: the gate's "grep for strike" becomes
   a test step reading `combat.engine.ts` + `combat.signature.ts`
   sources (via `fs.readFileSync` from the test, same pattern as any
   source lint) asserting `/\bstrike\b/i` appears only in
   ratified-exception comments enumerated in the test. If reading
   source in a vitest feels heavy, downgrade to a gate-procedure grep
   (manual), but prefer the test — WS0's whole point is checkable.

**Gate procedure.**

```bash
cd axiomancer-mechanics
npx vitest run doctrine-strike-dead
npm run verify -w axiomancer-mechanics && npm run verify -w axiomancer-mobile && npm run type-check -w axiomancer-card-editor
```

Pass: witness green with an EMPTY exception map (or only §12-listed
entries); `strike` vocabulary sweep green. **Kill condition** as
parent. **Deliverable:** one PR — test + comment fixes free; the
§12 amendment + deletions land after the owner batch.

---

## WS1 — FREE/PAID line telemetry + dominance lint

**Tier** free. **Size** M. **Deps** none (mechanism); Phase 26/27 for
the official numbers (§0.2).

### Current state (grounded)

`CombatCardUsage` (`combat.encounter.sim.ts:109`) already tracks
`plays, bottomPlays, topPlays, statusLands, discards` — so FREE-use
rate (`topPlays/plays`) and PAID-use rate (`bottomPlays/plays`) are
**derivable today**; what's missing is fizzle rate, per-line HP
contribution, and an unplayed-at-phase-end denominator. Per-card
attribution exists only as the aggregate `dominantCardShare`
(`combat.encounter.sim.ts:456`; report column `dom`, flagged >0.70 by
deck-tuning §4 — a doctrine target, not an assertion). Attribution
math: `combat.attribution.ts` (`buildCombatSummary`,
`recordAttribution`).

### Steps

**WS1.1 — extend the counters** (`combat.encounter.sim.ts` +
`combat.playtest.ts` aggregation):

- `fizzles: number` — count `effect-fizzled` events attributed to the
  card's play (the event already exists; the Color Law and empty
  payoffs emit it).
- `lineContribution: { free: number; paid: number }` — HP-swing share
  per line. Implement by tagging `recordAttribution` calls in
  `combat.attribution.ts` with which line sourced them (the engine
  knows: top-action vs bottom-action paths are separate functions).
  This is the biggest sub-task; if the tag can't be threaded cleanly,
  ship the rest and log the contribution split as a follow-up rather
  than blocking.
- `unplayedAtPhaseEnd: number` — increment per hand entry discarded
  un-played at phase end (draw-fresh discard site in the engine).

**WS1.2 — surface in the report.** `formatPlaytestReport`
(`combat.playtest.ts`): extend the `--cards` per-card table with
`free%`, `paid%`, `fizzle%`, `unplayed%`, and per-line contribution.
Keep the existing column set stable (baseline JSON diffs).

**WS1.3 — the soft dominance lint.** New
`src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts` (NOT
inside balance-bands — different calibration cadence): for every
common/uncommon in its home preset, across the threat-diverse suite
(all stages × greedy + blind, 30 runs, seed 1), `console.info`-flag
any card whose FREE or PAID line takes >85% or <15% of its plays.
Soft = telemetry lines + a single assertion that the REPORT generated
(so CI exercises the path), thresholds behind `// PLAYTEST-CALIBRATION`.
Add `intentionallyAsymmetric?: boolean` to `Card`
(`src/Cards/types.ts` — additive; still run the editor type-check)
and exempt tagged cards.

**WS1.4 — report template.** Add the per-deck line-telemetry appendix
to `.claude/commands/deck-tuning.md` §5 step-5 report structure (the
mandated report file list), and the 85/15 band to §4's card-level
targets table.

**WS1.5 — baseline + offender list.** Run the standing baseline
(seeds 1, 2, 3). File the offender list (card id, line, use %, stage
spread) to this doc's Status section AND the parent's. If Phase 26
has not landed: mark every number PROVISIONAL (§0.3) and re-cut after
Phase 27.

**Gate procedure.** Telemetry lands with a green
`npm run verify -w axiomancer-mechanics` and an unchanged
balance-bands run; offender list filed. No kill condition
(measurement). **Deliverable:** one PR: counters + report + soft lint
+ template + (provisional) offender list.

### WS1.5 provisional offender list (pre-Phase-26)

> **PROVISIONAL (§0.2/§0.3).** Cut 2026-07-11 at commit `f196d219`
> from the standing baseline (`--stage=all --policy=all --runs=60
> --cards`, seeds 1/2/3). Phase 26 (Turn Law) has NOT landed — every
> number below carries the pre-Turn-Law asterisk and the list is
> re-cut after Phase 27 re-baselines. Use it to AIM WS2/WS4 work, not
> to judge gates.

Band: FREE or PAID line >85% or <15% of plays, consistent across all
three seeds, ≥20 plays per seed. Eight offenders; **all eight are the
same failure mode — the FREE line is dead (<15%), i.e. the PAID line
takes >85%**. No card trips the opposite band (FREE >85%). The
`free%` columns are FREE-line share of plays (`topPlays/plays`);
stage spread is seed-1 FREE share with per-stage play counts (`-` =
card not in any deck at that stage).

| card id | line band | free% s1/s2/s3 | plays s1/s2/s3 | stage spread (seed 1) |
|---|---|---|---|---|
| `cassandras-burden` | FREE <15% (PAID >85%) | 5.3 / 6.9 / 4.0 | 7149 / 4767 / 3664 | mid 5.4% (n=5398) · late 5.3% (n=1402) · imp 4.3% (n=349) |
| `common-ground` | FREE <15% (PAID >85%) | 3.6 / 10.5 / 13.1 | 6118 / 4330 / 3186 | mid 3.9% (n=4007) · late 2.8% (n=1491) · imp 3.2% (n=620) |
| `disarming-smile` | FREE <15% (PAID >85%) | 8.0 / 9.0 / 13.6 | 4957 / 2567 / 7490 | early 8.2% (n=3972) · mid 7.2% (n=985) |
| `glimpse` | FREE <15% (PAID >85%) | 11.3 / 13.5 / 7.5 | 5326 / 9188 / 3505 | early 19.7% (n=1378) · mid 8.4% (n=3948) |
| `half-step` | FREE <15% (PAID >85%) | 13.7 / 11.9 / 10.9 | 25958 / 22062 / 14183 | early 14.1% (n=5381) · mid 14.4% (n=9802) · late 12.9% (n=8330) · imp 13.3% (n=2445) |
| `refrain` | FREE <15% (PAID >85%) | 8.5 / 9.3 / 12.3 | 3189 / 6545 / 8352 | early 8.5% (n=3189) |
| `sketch-of-a-thought` | FREE <15% (PAID >85%) | 7.4 / 7.4 / 3.6 | 2554 / 13859 / 4659 | early 7.4% (n=2554) |
| `slippery-slope` | FREE <15% (PAID >85%) | 9.1 / 10.9 / 10.5 | 18207 / 18067 / 15569 | mid 10.7% (n=8308) · late 7.5% (n=7567) · imp 8.3% (n=2332) |

Adjacent findings from the same runs:

- **Near-band, seed-inconsistent** (in the <15%/>85% band on some
  seeds but not all three — watch list, not offenders):
  `ad-nauseam`, `against-my-judgment`, `brace-for-impact`,
  `brief-candle`, `captive-audience`, `exordium`, `fallen-grace`,
  `opening-statement`, `practiced-cadence`, `signs-and-portents`,
  `straw-mans-jab`, `sweet-poison`, `the-olive-branch`, `tu-quoque`,
  `zenos-half-step`. All lean the same direction (weak FREE line).
- **Never-played cards are excluded** — line telemetry needs plays.
  Seed-1 dead-card rate 24.3% (17/70 never played); that is the
  standing dead-card finding, not a WS1 band violation.
- **No exemptions applied**: no library card carries
  `intentionallyAsymmetric` yet.
- Context (pre-Turn-Law, PROVISIONAL): stage win rates seed 1
  early 99.7 / mid 63.0 / late 5.7 / imp 11.0; seed 2
  99.5 / 44.0 / 3.0 / 10.8; seed 3 97.7 / 37.4 / 0.2 / 0.2 — mid/late
  seed variance is itself a re-baseline argument.
- `docs/reports/baselines/deck-matrix-baseline.json`
  (axiomancer-mechanics) did not exist; generated per the deck-tuning
  §5 procedure (seed-1 `--json` output, commit-stamped, marked
  provisional). This run therefore has no drift signal.

---

## WS2 — Exercise CONJURE + FREE-lines-as-setup

**Tier** /deck-tuning. **Size** M. **Deps** WS1 list; Phase 30 shape
for WS2.2 (§0.2).

### Current state (grounded)

`conjure_card` plumbing is live: `combat.engine.ts:1695` pushes
`{uid, cardId}` to hand and `conjuredUids`
(`combat.encounter.types.ts:560`); played conjured cards are one-use
(engine `:2129-2135`). `VERB_POINTS.conjure = 2`. CONJURE atlas row:
`????`, zero cards. A conjured id resolves through `getCardById`
(`cards.library.ts:1530-1532`, sandbox-first) — see C-11 for why
Thoughtforms must NOT be ordinary library entries.

### Steps

**WS2.1 — the Thoughtform registry + two CONJURE cards (sandbox
set `conjure-exercise`).**

1. New `src/Cards/cards.thoughtforms.ts`: `thoughtformLibrary: Card[]`
   (entries tagged `['thoughtform']`, any rank, NOT counted by the
   70/50 pins), export `getThoughtformById`. Wire the lookup chain in
   `cards.library.ts:1530`: `getSandboxCard(id) ?? getThoughtformById(id) ?? registry.get(id)`.
   Export from `src/Cards/index.ts` (additive barrel change → verify
   trio). Thoughtforms are automatically excluded from the reward
   pool (`COMBAT_REWARD_POOL = cardLibrary.map(...)`,
   `combat.rewards.ts:29`) and stage pools (`stageEligibleCardIds`
   reads the library) — assert both exclusions in a new
   `src/Cards/e2e/thoughtforms.engine.test.ts`, plus: a conjured
   Thoughtform is playable, is one-use, and its effectiveness is
   asserted with the same kind-aware helpers as the main lint.
2. Thoughtform: **Cinder** (`tf-cinder`, forge) — one-use spell,
   cheap KINDLE-flavored payload (e.g. apply `debuff_kindling_ember`
   or grant 1 pip; final payload chosen in-session against the forge
   telemetry). **Minor Premise** (`tf-minor-premise`, peroration) —
   one-use, `specialMechanics: [{ kind: 'premise', count: 1 }]`.
3. Sandbox cards (in `cards.sandbox-sets.ts`, set id
   `conjure-exercise`):
   - **Foundry Sprite** — forge Thesis (rank 3, uncommon band
     4.5-13). FREE: `{ pips: 1 }`. PAID:
     `specialMechanics: [{ kind: 'conjure_card', cardId: 'tf-cinder' }, { kind: 'grant_pip', ... }]`
     as priced. `// pts:` sketch: pip 1.5 + conjure 2 + Cinder EV
     ~3-4 ≈ 7-8 → Thesis. Final arithmetic against `scoreMechanic`
     at implementation; the pricing lint is the court.
   - **Corollary** — peroration Lemma (rank 2, common band 1.5-7.5).
     FREE: `{ premises: 1 }`. PAID: premise 1 + conjure Minor
     Premise. `// pts:` sketch: premise 0.8 + conjure 2 + tf EV ~0.8
     ≈ 4-5 → Lemma-high. Watch the common ceiling (7.5).
4. A/B: baseline vs `--sandbox=conjure-exercise`, ≥2 stages
   (early+mid for Corollary, mid+late for Sprite) × ≥2 policies
   (greedy, blind), seeds 1-3.

**WS2.2 — FREE-line conversions (Phase 30 down-payment).** From
WS1.5's offender list, pick ≤10 dominated FREE lines, 2-3 per theme
per pass. Conversion shape is Phase 30's ratified law: Option A
(constrain the fork — FREE lays the theme's named state the PAID line
or theme payoff reads) + the weak-deposit `DRAW 1` kicker amendment.
Mechanically each conversion is a `registerSandboxOverride({ cardId,
patch: { free: {...} } })` — sandbox overrides shallow-merge, so
patch the whole `free` object. A/B each pass; promote by editing the
library literal + its `// pts:` (FREE ≈ 25-35% of total points per
the budget law, `types.ts:419-422`).

**WS2.3 — promotion + wiring.** Full wiring checklist per promoted
card; atlas CONJURE row gains its first `+` (e.g. `+???`) with the
run receipt in the notes cell; preset recipes untouched (Sprite and
Corollary are reward-pool cards — they enter it automatically on
promotion into the library, which bumps the 70/50 pins: call the bump
out in the PR body).

**Gate procedure.** As parent: CONJURE `+`; converted cards inside
85/15; preset floors hold (balance-bands green); kill per parent
(<15% converted-line use or >70% win-impact). **Deliverable:** one
`/deck-tuning` PR per pass, branch `balance/deck-<ts>`, report in
`docs/reports/deck-tuning-<ts>.md`.

---

## WS3 — Trigger-clock DoT substrate (= EA-7 / Phase 32 slice; absorbs win-path #3)

**Tier** [owner-call] (narrowed — C-6) then card-expert. **Size**
M-L. **Deps** WS0 witness, WS1 telemetry, Phase 26/27 numbers.

### Current state (grounded)

Duration is a calendar countdown: `tickAllEffects`
(`src/Combat/effects.ts:505-522`) decrements once per round at round
end (`processRoundEndEffects` `:646`); `-1` = permanent. Tick
orchestration: `processBetweenPhases` (`combat.engine.ts:2495`).
Decay/ramp shapes live in `dotModifiers`
(`src/Effects/types.ts:142-155`): POISON = `escalatesPerTurn` +
`rampFactor 0.5` (ramp math `effect-modifiers.ts:52-61`); BLEED =
`decaysPerTick` (`effects.ts:594-611`); MARK = `tickAmplifyFlat: 1`
(not a DoT). Fuel math reads remaining duration:
`getPendingDotTotal` (`effects.ts:285-316`), `computeRoundsToKill`
(`:327`). Pricing reads lifetime: `dotLifetimeHp`
(`pricing.engine.test.ts:149-164`, pinned anchor
`dotLifetimeHp('debuff_poison',1,4) === 10`).

**Ratified already** (spec 32 amendment #3): POISON fires
per-card-played, BLEED per-damage-instance, MARK on-payoff-class.

### Steps

**WS3.0 — [owner-call], one session item (narrowed).** Ratify only:
(a) the schema below; (b) calendar-expiry removal for clocked
effects (where a payoff needs a bounded window, bound the PAYOFF);
(c) the Doom-shaped species (grows when the enemy acts) as a
card-local effect, explicitly NOT keyword #31; (d) exact trigger
definitions ("per-card-played" = per PLAYER card? both sides? —
recommend player-side only, matching Dawncaster Poison's
victim-tempo asymmetry inverted for our 1v1). Log in spec 32 §12.

**WS3.1 — schema** (`src/Effects/types.ts`): extend `DamageOverTime`
with `trigger?: 'round-start' | 'round-end' | 'card-played' |
'damage-instance' | 'payoff'` (absent = legacy `tickPhase` behavior;
keep `tickPhase` as the alias for the two round clocks) and extend
`dotModifiers` with `calendarExpiry?: false` (explicit opt-out of
duration countdown) and `growth?: 'per-enemy-action'`. Additive
fields → still run the editor contract check.

**WS3.2 — engine** (`src/Combat/effects.ts` +
`combat.engine.ts`):

1. New `fireDotTrigger(target, trigger, round)` in `effects.ts` —
   ticks exactly the effects whose `trigger` matches, reusing
   `processDamageOverTime`'s per-tick body (ramp, decay,
   `decaysPerTick`, MARK amplification).
2. Call sites: `'card-played'` → end of `playBottomAction` after mech
   resolution (near the `landedOffensiveIds` block ~`:1803`);
   `'damage-instance'` → in the shared enemy-damage path (wrap
   `applyDamage`-to-enemy in a helper, or hook the few
   payoff-class-external sites — the WS0 inventory is the checklist);
   `'payoff'` → inside the `rupture` / `reap_all` /
   `consume_affliction` cases; `'per-enemy-action'` growth → in
   `resolveThreatPhase` after the enemy acts (`~:2265-2341`).
3. `tickAllEffects`: skip the duration decrement for effects with
   `calendarExpiry === false` (they expire only via their own decay,
   e.g. BLEED intensity washout, or combat end). Keep Soul-on-expiry
   (`engine :2532-2535`) firing on decay-consumed instances too —
   Harvest's economy must not starve when calendars disappear.
4. Fuel math: `getPendingDotTotal` / `computeRoundsToKill` /
   projected-lethality (`:3117`, `:3171`) switch from
   `max(1, remainingDuration)` to expected-trigger counts per clock
   (per-card-played ≈ player plays/round from the sim's own average;
   use a fixed conservative constant, e.g. 2, behind
   `// PLAYTEST-CALIBRATION`).

**WS3.3 — data sweep** (all 14 DoT payloads + the 6 clones, WITH
Phase 29 KW-1). Assignment table to ratify and apply in
`debuffs.library.json`:

| id | clock | decay | note |
|---|---|---|---|
| `debuff_poison` | card-played | none (keeps ramp) | hallmark |
| `debuff_bleed` | damage-instance | decaysPerTick (keeps) | hallmark; already its shape |
| `debuff_mark` | payoff (amplify unchanged) | none, battle-long (`calendarExpiry: false`) | not a DoT |
| `debuff_strong_poison` | card-played | none | POISON tier-3 |
| `debuff_burn` / `debuff_frostbite` / `debuff_shock` | round-end (legacy) | calendar | non-card support debuffs — untouched this pass |
| `debuff_disease` / `debuff_hp_decay` / `debuff_hex` | round-start (legacy) | calendar | untouched |
| `debuff_argument_wound`, `debuff_echo_sting` | **fold into POISON** (KW-1) | — | cards re-pointed to `debuff_poison` at tuned intensity: `exordium`, `opening-statement`, `mounting-case`, `refrain` |
| `debuff_kindling_ember`, `debuff_nettle_sting` | keep as card-local species, face keyword per the 2026-07-10 card-keyword doctrine, or fold — KW-2's merge/retire call | — | `sketch-of-a-thought`, `nettle-cloak` |
| `debuff_foretold_wound` | replace with POISON + MARK double-apply on `glimpse` / `cassandras-burden` | — | composite clone |
| `debuff_backfire_acute` | fold into BACKFIRE @ i3 (`paralysis-of-analysis`) | — | not a DoT |
| NEW `debuff_creeping_doom` | growth per-enemy-action, no calendar | none | WS3.4 |

**WS3.4 — the Doom species.** New debuff `debuff_creeping_doom`
(`growth: 'per-enemy-action'`, `calendarExpiry: false`, small base
tick) + ONE sandbox card applying it (natural home: affliction or
harvest; pick from WS1 telemetry). Card-local face keyword (e.g.
`DOOM`) under the card-keyword doctrine — no atlas row until it
reaches ~3 cards (WS10 policy).

**WS3.5 — repricing.** Rewrite `dotLifetimeHp`
(`pricing.engine.test.ts:149-164`) to price by clock (expected
triggers × ramp/decay), update the pinned anchors, then re-run the
pricing lint and fix every affliction card's `// pts:` (the erosion
7, penitent's DoT lines, harvest fuel cards, plus the re-pointed
clone users — roughly a third of the 50 spells). Adjust
`VERB_POINTS.dotLifetimeDivisor` only if the sweep shows systematic
band misses.

**WS3.6 — evidence.** Engine semantics aren't sandboxable: full
matrix at seeds 1-3 before/after, plus per-card A/B via sandbox
overrides where a card's intensity retune allows. Balance-bands +
card-coverage + effectiveness + doctrine witness all green.

**Gate procedure.** Erosion + Tithe late > 0 (target ≥15%) with early
inside ~80 band on POST-Phase-26 numbers; no card >0.70
`dominantCardShare`. **Kill condition:** early-band violation that
per-card re-pricing can't pull back — revert the clock ASSIGNMENT
(data), keep the substrate (schema/engine). **Deliverable:** two PRs:
(1) schema + engine + tests behind legacy defaults (no data change —
mechanically inert), (2) the data sweep + repricing + Doom card
(A/B'd). Both run the verify trio.

---

## WS4 — Role redundancy + boss-tech rares (absorbs win-path #5)

**Tier** /deck-tuning + [owner-call] for new mechanic kinds. **Size**
L total, S-M per theme. **Deps** WS1; WS3 (harvest); WS7 (forge
finisher); Phase 32 shapes (§0.2).

### Current state (grounded)

Post-item-1/2 spot telemetry (win-path status block): penitent late
0.40, erosion late 0.08, Grace late 0.75; foundry/tithe/augury/
bastion late 0. All numbers get re-based after Phase 26/27 before any
pass starts (§0.3). Preset recipes are 4/4/2/2/1/1/1
(`combat.deck-presets.ts:50-61`); a recipe change is [owner-call].

### Steps — one theme per `/deck-tuning` pass, in this order

Every card below starts life in a named sandbox set
(`roles-<theme>`), goes through the standing A/B, and only then
promotes (bumping the 70/50 pins, one theme-pass per PR). Point
sketches are provisional; `scoreCard` is the court.

**WS4.1 — Forge** (buildable half first):

- **Slag Runoff** — forge Lemma. FREE: 1 pip. PAID: convert unspent
  pip overflow into `debuff_kindling_ember` application (drills
  KINDLE per WS10.3). Buildable today (`grant_pip` + `applyEffect`
  rider).
- **Ingot of Ruin** — forge Axiom (rare band 7-19). PAID:
  `spend_all_pips` → MARK ×1 per 2 pips spent, uncapped, then a TICK-
  class payoff. **Sequencing: behind WS7** (uncapped spender is
  pointless under the flat floors) — and note Phase 30 kills TICK, so
  the payoff rider must be authored in post-TICK vocabulary (direct
  `fireDotTrigger 'payoff'` semantics from WS3).

**WS4.2 — Bulwark:**

- **Grit Between Stones** — bulwark Theorem. PAID: apply
  `debuff_nettle_sting` + payoff-class tick. Buildable today.
- **[owner-call] consume-all-defense** — reconcile FIRST with Phase
  32's ratified "RIPOSTE reflects the prevented blow" (§0.2): if the
  ratified RIPOSTE rework already converts prevented damage to
  output, **Rampart Reckoning** (Axiom — consume ALL Guard/Barrier →
  Nettle Sting per 4 consumed) may be redundant; bring both shapes to
  the owner batch and pick ONE. If Rampart wins: new mechanic kind
  `{ kind: 'consume_defense', perHp: number }` through the full
  wiring checklist (engine case reads `guard + barrier`, zeroes both;
  pricing verb ~`consumeDefensePerHp: 1/4`; editor union update).
- **The Unmoved Mover** — bulwark Thesis, threshold predicate "enemy
  didn't damage you last round". Needs the missing ledger (C-9): new
  state field `enemyDamageLastRound?: number` on
  `CombatEncounterState` (written in `resolveThreatPhase` where the
  enemy attack lands `~:2341`, rolled over in `processBetweenPhases`).
  [owner-call] as new predicate surface. Alternative if consume-all
  is refused: the Deep-Wound-style counting kill (N reflect procs =
  slain) — pick ONE, never both.

**WS4.3 — Charm** (verify need first — Grace late 0.75 may already
be inside band after re-baseline):

- **A Sweeter Poison** — charm Theorem. PAID: SWAY + MARK ×2 +
  RUPTURE-class closer. Buildable today (`sway`, `applyEffect`,
  `rupture`).
- **[owner-call], only if the fresh matrix still shows the late
  hole:** decay-pause (**Steadfast Regard** — one-turn SWAY decay
  stop; SWAY decay is spec 32 A2, so pausing it is a spec touch) and
  **Crescendo of Affection** (SWAY + half-current-SWAY — needs a
  `swayScaling` mechanic field).

**WS4.4 — Harvest** (after WS3; build toward Phase 32's ratified
REAP-attacks-max-HP + travelling Souls — §0.2):

- **The Long Ledger** — harvest Thesis. PAID: two payoff-class DoT
  fires + a short Bleed (post-TICK vocabulary). Compresses the Soul
  cycle.
- **Seedcorn Sacrifice** — harvest Theorem. PAID: REAP 2 →
  affliction application + draw. Closes the flywheel. Both buildable
  today; the max-HP REAP payoff itself is Phase 32's own item — don't
  duplicate it here, land these two as its supporting cast.

**Gate procedure (per theme).** Fresh baseline (seeds 1-3,
post-Phase-27), balance-bands floors green, no 100% cell, no card
>0.70 dominant share, and the WS1 line-telemetry bands for the new
cards. **Kill (per card)** as parent: never-drafted-into-wins (dead)
or >70%-of-wins (dominant) kills the card, not the theme pass.
**Deliverable:** one `/deck-tuning` PR per theme with report +
promotions + atlas row updates (KINDLE/REAP/RIPOSTE gates move off
`!` as they're exercised).

---

## WS5 — Sequencing-grammar microset (prototype)

**Tier** /deck-tuning + [owner-call] only for the two new state
fields. **Size** M. **Deps** WS1; independent of WS3/WS4.

### Current state (grounded)

Per C-9: `spellsPlayedThisTurn` exists (`types:557`); prior-card
stance derivable from `lastSpellCardId` (`:559`); RECOIL-paid and
damage-taken ledgers don't exist. The `threshold` field on `Card` is
a DIE-COLOR gate (`{color, count, rider}`), not a state predicate —
the state conditions need a different carrier. `CardSynergy` /
`SynergyPredicate` (Phase 66, `types.ts:307-366`) is the existing
state-predicate machinery — inspect its predicate vocabulary first
and EXTEND it rather than inventing a parallel gate; price whatever
carries the condition at the `threshold` ×0.5 discount
(`CONDITION_DISCOUNTS`, `cards.pricing.ts:131-137`).

### Steps

**WS5.1 — state check + [owner-call].** Buildable today: "early"
(`spellsPlayedThisTurn === 0|1`), "late" (`hand.length <= 2`),
prior-stance readers. [owner-call] adds exactly two fields:
`recoilPaidThisTurn?: number` (written in the `recoil` case
`~:1447` and the fate-recoil site `:1313`; reset at phase end) and
`enemyDamageThisTurn?: number` (shared with WS4.2's ledger — spec
them together in the owner batch as one "combat ledgers" decision).

**WS5.2 — six sandbox cards** (set `sequencing-microset`, reward-only
by never entering a preset; they stay sandbox for the whole prototype
— no library promotion, no pin bumps, until the WS5.3 test and the
draft evidence both pass). Two "early" (fires as first/second card),
two "late" (≤2 cards remaining — Finale-shaped), two "after-cost"
(RECOIL paid or enemy damage taken this turn — Frenzy-shaped), spread
across 3 themes. At most ONE new shared face term (e.g. `OPENING`),
card-local per the card-keyword doctrine, registered nowhere until it
earns ~3 cards.

**WS5.3 — the falsifiable test.** New
`src/Cards/e2e/sequencing-grammar.engine.test.ts`: fix a 5-card hand
containing 2 microset cards; enumerate legal play orders (bounded by
the 3-die tray — enumerate die-assignment × order tuples, dedupe by
outcome-relevant prefix); resolve each against 3 authored threat
stances (fixture enemies with distinct rider/damage profiles); assert
(a) ≥2 orders produce materially different end states (HP + status
vector + resource deltas), and (b) the argmax order differs across at
least two of the three threats. Deterministic RNG via
`src/test-utils/rng.ts`.

**WS5.4 — draft-appeal evidence.** Rides WS6.1's reward-draft
harness: microset cards offered at reward screens must be picked by
≥2 preset origins in sim.

**Gate/kill.** Test passes + drafted by ≥2 origins. Kill exactly as
parent: one dominant order across all stances kills the microset —
log the "draw-fresh doesn't support sequencing" finding to
`plan/CRITIQUE.md`, revisit hand retention (parent §2 deferred).
**Deliverable:** one PR (state fields, after the owner batch) + one
`/deck-tuning` PR (cards + test).

---

## WS6 — Cross-theme bridge rewards (prototype)

**Tier** /deck-tuning. **Size** M (+S for the harness). **Deps** WS1;
after WS4 per parent; WS6.1 harness has no deps and can land early.

### Current state (grounded)

Per C-10 there is no reward-draft sim. The reward path:
`COMBAT_REWARD_POOL` = all 70 (`combat.rewards.ts:29-31`),
`REWARD_RARITY_WEIGHTS = { common: 1, uncommon: 0.5, rare: 0.2 }`,
`rollCombatCardRewards` offers 3 distinct cards, archetype-aligned
2×.

### Steps

**WS6.1 — build the reward-draft harness (free, test-only).** New
`src/Combat/e2e/reward-draft.sim.test.ts` + a small pure sim in
`src/Combat/combat.reward-draft.sim.ts`: for each preset origin
(theme), simulate N=200 reward screens (`rollCombatCardRewards` with
that origin's archetype, seeded), apply a pick policy (rank offers by
`focusWeight(presetFocus, verbClass)` from `combat.deck-draft.ts:64`,
tie-break by rarity), and emit per-card pick counts per origin.
Export a `runRewardDraftSim(originId, seed, screens)` so `/deck-tuning`
reports can call it. Telemetry-only assertions (sim runs, counts sum)
— the bands live in the WS6.3 gate, not the test.

**WS6.2 — six bridge cards** (sandbox set `bridge-rewards`, one per
pairing, biased to pairings whose shared verb exists):
affliction↔charm (MARK counts as affliction AND feeds SWAY's bar),
forge↔bulwark (pips → GUARD overflow), akrasia↔harvest
(self-affliction expiry → Souls — note WS3.2's Soul-on-decay-consumed
keeps this alive), oracle↔peroration (FORETELL confirm → Premise),
control↔echo (STAGGER'd rung → REPRISE fuel), bulwark↔charm (unbroken
GUARD → SWAY). Utility-10 vocabulary only; no hallmark imports; no
preset edits.

**WS6.3 — evidence.** Per bridge: picked by ≥2 distinct origins at a
non-trivial rate (calibrate the floor from WS6.1's baseline spread —
e.g. ≥5% of screens for both parents), and neither parent origin's
resolution leaves its band in the matrix when the bridge is included
via sandbox.

**Gate/kill (per card)** as parent: single-parent pick = dead
(it's an 8th in-theme card); universal auto-pick = dominant. Killed
bridges are findings, filed. **Deliverable:** WS6.1 as a free PR;
bridges as one `/deck-tuning` PR (promotion bumps pins).

---

## WS7 — Retire flat cap floors + first chosen X-cost

**Tier** [owner-call] + supervised sweep. **Size** S-M (caps) + M
(chooseX). **Deps** WS3 first (parent's sequencing note stands).

### Current state (grounded)

`effects.ts:65-87`: `RUPTURE_BURST_CAP = 80`,
`REAP_ALL_BURST_CAP = 200`, `BURST_CAP_FRACTION = 0.25`;
`ruptureBurstCap()` used at engine `:940`, `:1519`, `:1922`, `:3119`;
`reapAllBurstCap()` at `:1581` (+ readouts `:3117`/`:3171`).
**Removing the floors LOWERS early caps** (0.25 × ~100-HP early
enemies ≈ 25 vs today's 80) — the floor IS current early behavior, so
"delete the flat halves" is not behavior-preserving early; the sweep
must include compensating fractions.

### Steps

**WS7.1 — [owner-call] formula, then the supervised sweep.** Owner
picks the shape; candidates to bring, with the early-nerf fact above:

- (i) pure fraction, swept: `cap = round(F × maxHp)`,
  F ∈ {0.25, 0.35, 0.45, 0.60} — F must rise if the floor falls.
- (ii) **recommended:** uncapped ALL-spenders (REAP-ALL, spend-all-
  pips) — input opportunity cost is the balance lever — while RUPTURE
  keeps a pure-fraction cap (it consumes enemy-side state the player
  seeded cheaply).
- (iii) floor retained but stage-indexed (rejected by the parent's
  thesis; list for completeness).

Sweep protocol (mirrors landed item #2's method): full matrix at each
candidate, seeds 1-3, pick by "Foundry/Tithe late lift with early in
band and no card >0.70 dominant share". Repricing: `reapAll` /
`rupture` verb points and affected `// pts:` re-checked after the
winner is chosen.

**WS7.2 — [owner-call] chosen-X plumbing, ONE card.**

1. Engine: `playCombatCard` (and the encounter-level wrapper) gains
   an optional `{ chosenX?: number }` play param — additive to the
   locked barrel, but it changes a core signature: run the verify
   trio and grep mobile's call sites first.
2. New mechanic kind `{ kind: 'recoil_x', min: number,
   poisonPerX: number }` (bounded to RECOIL as the first chooseX):
   full wiring checklist incl. the editor `SpecialMechanicKind`
   contract and `combat.cards.ts` display ("RECOIL X (min 3): POISON
   ⌈X/3⌉").
3. Sim policies pick X by temperament (`combat.sim-policies.ts`):
   greedy = max affordable-useful, turtle = min, chaos = seeded
   uniform in range — this is what makes the WS7 gate's "does X
   actually vary" measurable.
4. CLI: `--script` grammar gains an X argument for the play step.
5. Mobile: amount picker in the combat presenter (stepper on the card
   sheet), gated behind the card having an X mechanic. Coordinate the
   trio verify; mobile e2e rides CI.
6. The card — **The Open Vein**, akrasia Theorem (sandbox first):
   RECOIL X of your choosing (min 3) → POISON ⌈X/3⌉. `// pts:`
   sketch: expected X ≈ 6 → poison i2 lifetime via `dotLifetimeHp`,
   minus `SELF_COST_CREDIT 0.75` × recoil points; must land in
   uncommon band 4.5-13.

**Gate procedure.** Caps: sweep winner's matrix beats baseline on
late without early-band breach. chooseX: across policies the chosen-X
distribution is non-degenerate (assert in a small sim test: at least
two policies' modal X differ); if every policy maxes X, kill the
picker, keep ALL-spenders. **Deliverable:** caps = one supervised PR
(constants + repricing + baseline regen); chooseX = one PR (engine +
card + mobile picker), after the owner batch.

---

## WS8 — Control statuses edit different threat surfaces

**Tier** /deck-tuning (data) + [owner-call] (meter). **Size** M.
**Deps** WS1; independent otherwise.

### Current state (grounded)

Confirmed Roll-penalty payload carriers (13, not 7): the plan's eight
— `debuff_slow` (Achilles' Burden, −2), `debuff_root` (Braess
Binding, −2), `debuff_blind` (Quantum Erasure, −5),
`debuff_knockdown` (Ross-Littlewood Fall, −3), `debuff_daze`
(Simpson's Confusion, −3), `debuff_curse` (Grelling's Malediction,
−2), `debuff_exhaustion` (Lottery Despair, −2), `debuff_fatigue`
(Preface Exhaustion, −1) — plus `debuff_frostbite` (−2 + DoT),
`debuff_shock` (−1 + DoT), `debuff_fear` (−4), `debuff_confusion`
(−5), `debuff_straw_man_echo` (−1). Variety reads: the DISRUPT meter
counts distinct control ids (`getDistinctControlCount`,
`effects.ts:473`; `DISRUPT_DENY_AT = 3`, `:124`; consumed at engine
`:2227-2228`), and the die-refresh chain counts distinct offensive
ids (`chainEffectIds`, engine `:2017-2023`). Threat surfaces
available to edit: telegraph damage (`damageWeight` →
`threatDamageBudget`), rider (`threatEffectId`/`threatIntensity`),
stance certainty (the reveal system), rung strength
(`staggerRungs`/`BOSS_RUNG_REGROWTH`), escalation
(`THREAT_ESCALATION_PER_ROUND`).

### Steps

**WS8.1 — audit map (free, doc-first).** Table all 13 carriers →
ONE primary surface each; mark true duplicates for KW-2 fold-in
(candidates: `debuff_fatigue` + `debuff_exhaustion`;
`debuff_daze` + `debuff_confusion`). Deliverable: the table below
(shipped 2026-07-11; every payload value re-read from
`src/Effects/debuffs.library.json` at edit time) +
`cross-keywords.md` §10 cross-reference.

#### WS8.1 deliverable — control-surface audit map (2026-07-11)

All 13 ids and roll penalties confirmed against the working tree.
Surfaces are the WS8 list: telegraph damage / rider / stance
certainty / rung strength / escalation / roll. "Primary surface" is
the ONE surface the carrier should own after WS8.2 — carriers marked
*roll (keep)* stay on the Roll surface deliberately; carriers whose
control payload is a secondary rider on a non-control identity are
marked *roll (rider)*.

| Carrier id | Name | Roll (confirmed) | Other payload (confirmed) | Primary surface | Disposition |
|---|---|---|---|---|---|
| `debuff_slow` | Achilles' Burden | −2 | body disadvantage | roll (keep) | Canonical light roll shred; unchanged |
| `debuff_root` | Braess Binding | −2 | defense −2 | stance certainty | WS8.2 LOCK shape — `lockStance` verb already priced (`cards.pricing.ts:90/251`); "paralysis through possibility" = enemy locked into its revealed stance |
| `debuff_blind` | Quantum Erasure | −5 | body+mind disadvantage | rider | WS8.2 `suppressesThreatRiders` candidate — "information erased" = the phase's `threatEffectId` cannot land |
| `debuff_knockdown` | Ross-Littlewood Fall | −3 | defense −4, duration 1 | roll (keep) | 1-round burst spike. Near-overlap with STAGGER flagged, but rung strength is reserved to STAGGER (WS8.2 rule) — no fold |
| `debuff_daze` | Simpson's Confusion | −3 | mind −2, mentalDefense −1 | stance certainty | **DUPLICATE → fold into `debuff_confusion` (KW-2)** |
| `debuff_curse` | Grelling's Malediction | −2 | body −1, mind −1, heart −2 | roll (rider) | Identity is the 3-stat drain (category `stat`); candidate to DROP the roll rider in the WS8.2 session rather than re-payload |
| `debuff_exhaustion` | Lottery Despair | −2 | body/mind/heart −2 | telegraph damage | WS8.2 `outgoingThreatDamageMulPct` candidate ("weakened hits softer"); fold SURVIVOR of the fatigue pair |
| `debuff_fatigue` | Preface Exhaustion | −1 | body −1, mind −1 | telegraph damage | **DUPLICATE → fold into `debuff_exhaustion` (KW-2)** |
| `debuff_frostbite` | Boltzmann's Chill | −2 | DoT 3/round (body) | roll (rider) | DoT is the identity (category `damage`); −2 roll stays as secondary chip |
| `debuff_shock` | Hardy's Discharge | −1 | DoT 3/round (mind) | roll (rider) | Same shape as frostbite; −1 roll stays as secondary chip |
| `debuff_fear` | Grandfather's Terror | −4 | heart −4, emotionalDefense −3 | roll (keep) | Becomes THE heavy roll hammer once blind/confusion move off-surface |
| `debuff_confusion` | Two Envelope Delirium | −5 | body+mind+heart disadvantage | stance certainty | WS8.2 `blursStanceHints` (enemy-side) candidate; absorbs `debuff_daze` |
| `debuff_straw_man_echo` | Straw Man's Echo | −1 | — (tier 1) | roll (keep) | Smallest legit roll carrier (BACKFIRE echo); unchanged |

Surface census after the map: **roll ×7** (of which only slow,
knockdown, fear, straw_man_echo are roll-PRIMARY; curse, frostbite,
shock hold roll as a rider on a stat/DoT identity), **stance
certainty ×2** (root = lock, confusion = blur; daze folded in),
**telegraph damage ×1** (exhaustion; fatigue folded in), **rider ×1**
(blind), **rung strength ×0** (reserved to STAGGER per WS8.2),
**escalation ×0** (deliberately untouched per WS8.2). Post-fold the
DISRUPT meter's id-pool shrinks 13 → 11, which is the correct
direction for WS8.3's surface-count read: three distinct SURFACES
(not three ids of the same grip) trip `DISRUPT_DENY_AT = 3`.

**WS8.2 — re-payload three soft controls** (data +, where a payload
field is missing, one `EffectPayload` addition each through the
wiring checklist):

- telegraph-DAMAGE reducer: new payload
  `outgoingThreatDamageMulPct?: number` on the bearer (enemy), read
  in `resolveThreatPhase` where the budgeted damage lands.
- RIDER suppressor: new payload `suppressesThreatRiders?: boolean` —
  the phase's `threatEffectId` does not apply while active.
- STANCE blur: reuse/invert the reveal economy — payload
  `blursStanceHints?: boolean` is the ENEMY-side shape; for
  player-applied control the useful edit is LOCKING certainty
  (`lockStance` exists as a mechanic) — pick per-card in session.

Leave rung strength to STAGGER and escalation untouched; hard control
(skip/`actionRestriction`) stays the reliable category.

**WS8.3 — [owner-call] meter read.** Change
`getDistinctControlCount` to count distinct SURFACES touched
(classify each active control by payload shape:
actionRestriction / roll / threat-damage / rider-suppress /
stance) — `DISRUPT_DENY_AT = 3` then means "three different kinds of
grip", which is the design intent. One engine function + its tests.

**WS8.4 — the falsifiable test.** New
`src/Combat/e2e/control-surfaces.sim.test.ts`: three authored fixture
threats (damage-heavy, rider-heavy, escalation-heavy); run the
control-lock policy; assert its preferred control card differs by
threat. **Kill:** the biggest Roll penalty is always picked.

**Gate/deliverable.** WS8.1 free tick; WS8.2 + WS8.4 one
`/deck-tuning` PR (atlas BACKFIRE/STAGGER notes updated); WS8.3 after
the owner batch.

---

## WS9 — Legible conditional threat branches (= Phase 33 slice)

**Tier** [owner-call]. **Size** M. **Deps** after WS3 + WS7 land;
coordinates with Phase 33 (§0.2).

### Current state (grounded)

Threat sequences are strictly linear:
`AUTHORED_THREAT_SEQUENCES: Record<string, AuthoredThreatPhase[]>`
(`combat.threat-sequences.ts:23`); step type
`combat.threat.ts:30-43`; resolver `resolveAuthored` (`:170`);
consumed by `currentPhaseIndex`. No branch support; `isFinalPhase` is
the only flag. "Prior threat fully blocked" is computable today only
locally (`damagePrevented` inside `resolveThreatPhase`) — needs
persisting.

### Steps

**WS9.1 — [owner-call] the branch node.** Type: keep
`AuthoredThreatPhase` unchanged and add a parallel step wrapper —
`type AuthoredThreatStep = AuthoredThreatPhase | { branch: {
condition: ThreatBranchCondition; then: AuthoredThreatPhase;
else: AuthoredThreatPhase } }` with
`ThreatBranchCondition = { kind: 'bearer-afflictions-gte'; n: number }
| { kind: 'prior-threat-fully-blocked' }` — closed union, authored
data only, zero RNG. `resolveAuthored` resolves the branch from state
at phase START (so the telegraph can show the taken fork AND the
condition), and the mobile telegraph contract gains "condition + both
outcomes shown before commit". New state:
`lastThreatFullyBlocked?: boolean` written in `resolveThreatPhase`.

**WS9.2 — two prototype enemies.** One normal (mid roster —
"if carrying ≥3 afflictions at phase start, cleanse 1 and swap
stance"; the cleanse uses `applyCleanse` (`effects.ts:668`) with spec
29's fraction guardrail) and one boss (late roster — "if prior threat
fully blocked, next action is rider-heavy instead of damage-heavy").
Pick the concrete enemy ids in-session from the stage rosters
(`combat.stage-profiles.ts:71`) against current playtest familiarity;
author both branches in their sequences.

**WS9.3 — evidence.** (a) determinism test: fixed seed, scripted
player line → identical encounter tree across runs; (b) divergence
test: two scripted lines (affliction-stacking vs full-block) produce
different enemy branches; (c) matrix: resolution stays in band;
(d) legibility: add the playtester-agent question ("why did the enemy
change plan?") to the next `/combat-playtest` brief.

**Gate/kill** as parent (branch never reached / same response under
all presets / playtesters can't say why). **Deliverable:** one PR
(engine type + 2 sequences + mobile telegraph fork + spec 29 partial-
shipment note), after the owner batch, sequenced inside Phase 33.

---

## WS10 — Keyword-economy + effect-registry hygiene (= Phase 29 slices)

**Tier** free/docs + data. **Size** S. **Deps** WS3 (clone sweep);
Phase 29/30 (TICK).

### Steps

**WS10.1 — clone fold-or-retire** — executed as WS3.3's table WITH
Phase 29 KW-1 (same commit set). Gate: zero keyword-less repeated
mechanics in `debuffs.library.json`; every remaining effect id maps
to a face keyword or is single-card card-local by explicit note.

**WS10.2 — atlas policy note** (docs): one-card mechanics stay
card-local face keywords (per the 2026-07-10 card-keyword doctrine:
every mechanic reads KEYWORD·value+gloss on the face; the guard test
blocks ambiguous fallback); a term earns an atlas row at ~3+ cards;
drill target median ~4-6 cards/keyword as the library grows;
BARRIER/GUARD merge → KW-2's owner list.

**WS10.3 — un-orphan or fold.** PERORATION, KINDLE, BARRIER live on
one card each (single-card set per `cross-keywords.md`: FESTER,
TRANSMUTE, PERORATION, KINDLE, CLEANSE, BARRIER). WS4's new cards
deliberately drill them: Slag Runoff → KINDLE, forge↔bulwark bridge →
BARRIER/GUARD, Corollary → PERORATION-adjacent premise velocity.
Whatever still sits at one card after WS4+WS6 goes to KW-2
merge/retire.

**Gate (restated per C-5).** The registry matches the ratified
doctrine: no unregistered repeated mechanics; row count changes only
via ratified add/retire (29 after TICK dies, unless a replacement is
ratified); every gate-mark change carries a run receipt.
**Deliverable:** rides the WS3 data PR + one docs tick.

---

## Owner ratification batch — the single-sitting agenda

One `/oversight` session clears every [owner-call] in this plan. Each
item arrives with a recommendation; decisions logged in spec 32 §12.

1. **WS0.2** — named direct-HP exceptions (table above); delete the
   dead `strike` signature arm + `STRIKE_DAMAGE_MULT`; keep or
   re-payload Disarming Plea's flat chip.
2. **WS0.3** — die-cost laws: recommend deprecate-in-place for
   `resolveCardDieCost` (barrel doc-comment, mobile migrates next
   minor).
3. **WS3.0** — DoT schema + calendar-expiry removal + Doom species +
   exact trigger definitions (assignment itself already ratified
   2026-07-10).
4. **WS4.2/4.3** — bulwark: consume-all-defense vs Phase 32's
   RIPOSTE-reflects-prevented-blow (pick ONE) OR counting-kill;
   the "combat ledgers" decision (`enemyDamageLastRound`,
   `enemyDamageThisTurn`, `recoilPaidThisTurn` — one schema item);
   charm decay-pause + SWAY-on-SWAY (only if post-re-baseline data
   still shows the hole).
5. **WS7.1** — cap formula (recommend: uncapped ALL-spenders, RUPTURE
   pure-fraction) + **WS7.2** chooseX plumbing.
6. **WS8.3** — DISRUPT meter counts surfaces, not ids.
7. **WS9.1** — threat branch nodes + telegraph-fork UI contract.
8. **WS10** — BARRIER/GUARD merge; TICK-replacement row (or accept
   29).

## Session map (who executes what)

| Unit | Vehicle | Contents |
|---|---|---|
| Free ticks (`/iterate`-sized) | direct commits/PRs | WS0.1+WS0.4 · WS1.1-1.5 · WS6.1 harness · WS8.1 audit · WS10.2 note |
| `/deck-tuning` sessions | one PR each, `balance/deck-<ts>`, report in `docs/reports/` | WS2.1 · WS2.2 passes · WS4 per theme (4 sessions) · WS5.2-5.3 · WS6.2-6.3 · WS8.2+8.4 |
| Owner batch | one `/oversight` sitting | agenda above |
| Post-ratification engineering | standard PRs, verify trio | WS0.2/0.3 · WS3 (two PRs) · WS5.1 ledgers · WS7 (two PRs) · WS8.3 · WS9 |
| Build-plan phases | as scheduled | Phase 26/27 precede all numbers; WS2.2⊂Phase 30; WS3⊂Phase 32; WS9⊂Phase 33; WS10⊂Phase 29 |

## Standing measurement discipline (unchanged, plus one rule)

Everything in the parent's §5 holds (fresh seed-1 matrix + two
confirm seeds, ratified curve, per-preset floors, kill-the-card-not-
the-workstream). Added: **no gate is judged on pre-Phase-26 numbers**
(§0.3) — a workstream may ship mechanism early, but promotion and
kill decisions wait for Turn-Law-honest telemetry.

## Status

- [x] WS0.1 + WS0.4 doctrine inventory + witness test (free) —
  shipped 2026-07-11: `doctrine-strike-dead.engine.test.ts` (inventory
  frozen in its header, empty exception map, signature extension,
  mechanized strike sweep) + shared clean fixture builder
  `src/test-utils/card-fixture.ts`
- [x] WS1 telemetry counters + soft lint + (provisional) offender list
  — shipped 2026-07-11: counters/report columns/soft lint in tree;
  PROVISIONAL pre-Phase-26 list cut (8 dead-FREE-line cards; see
  "WS1.5 provisional offender list" under WS1). Re-cut done at
  e203fed9: the honest offender list is **EMPTY** — all 8 dissolved
  (`plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §1.5
  supersedes the provisional list)
- [x] WS6.1 reward-draft harness (free, unblocks WS5/WS6 evidence) —
  shipped 2026-07-11: `combat.reward-draft.sim.ts` (`runRewardDraftSim`)
  + telemetry test. Follow-up noted: sandbox-card injection hook needed
  before WS5.4/WS6.3 can measure sandbox cards
- [x] WS8.1 control-surface audit table (free) — shipped 2026-07-11
  (table under WS8.1 above; cross-referenced from `cross-keywords.md`)
- [x] Owner ratification batch — ratified 2026-07-11 in spec 32 §12
  (44b07c85)
- [x] WS0.2/0.3 post-ratification cuts — shipped 2026-07-11: dead strike
  vocabulary cut + legacy die-cost classifier deprecated (44b07c85)
- [x] WS2.1 CONJURE exercise (Thoughtform registry + 2 cards) — cards +
  registry shipped (3cecd275); Turn-Law-honest A/B **PASS all 3 clauses**
  (`plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §2; token
  conversion 92–100%, no kill, no dominance). Promotion = follow-up
  /deck-tuning PR (Corollary clean; Sprite flagged: 1 win over 2 seeds)
- [x] WS2.2 FREE-line conversion passes (Phase 30 shape) — sandbox
  conversions shipped (3cecd275); A/B **PASS all 3 clauses** with a stale
  premise (the library lines already read mid-band under honest turns —
  evidence report §1.5/§2). **SUPERSEDED 2026-07-12**: Phase 30's full
  70-card FREE-currency pass (5e723df3) rewrote every library FREE line
  under the ratified Option A law — the down-payment's job is done by the
  full pass, and the offender list it targeted was already EMPTY at the
  honest re-baseline (§1.5). The `free-line-conversions` sandbox set and
  its e2e suite were RETIRED in the reconciliation merge (no promotion
  ever happened from it; the library literals came straight from Phase
  30). The three remaining sandbox/thoughtform TICK lines (the-open-vein,
  debt-of-days, tf-cinder) were converted to theme currency in the same
  merge to satisfy the Phase 30 lint.
- [x] WS3 schema/engine PR + data-sweep PR (with WS10.1/Phase 29 KW-1)
  — engine substrate 85acd441, data sweep + Doom card + KW-1 fold
  3cecd275. Gate: erosion/tithe late ≥15% **FAIL** (late 0.00 globally —
  stage-curve failure, not clock failure; kill condition NOT triggered);
  WS3.4 debt-of-days **INCONCLUSIVE** (draft-fragile) — evidence report §2
- [x] WS4 theme passes: forge · bulwark · charm · harvest — cards shipped
  (3cecd275), all four A/B'd at e203fed9 (evidence report §2): slag-runoff
  alive; **ingot-of-ruin killed as written** (0/432 drafts; scorer fix
  before deletion); bulwark gate FAIL (1 win / 2 seeds); charm PASS-leaning
  (seed-fragile); harvest FAIL on presence + the-long-ledger 23–26% fizzle
  finding. Follow-ups queue behind the draft-scorer fix
- [x] WS5 microset + sequencing test (+ ledgers) — ledgers 85acd441,
  microset 3cecd275; WS5.3 test 24/24 PASS; WS5.4 draft appeal **4/6
  PASS** (wages-of-weakness + answered-in-kind fail single-class; floor
  recalibrated 5%→2.5% with justification) — evidence report §2
- [x] WS6 bridges through the harness — cards 3cecd275; WS6.3 verdicts:
  **1 PASS (the-poured-rampart, promotion candidate) / 4 KILLED
  (barbed-compliment, interest-on-the-flesh, entered-into-evidence,
  unbroken-countenance) / 1 marginal (stolen-cadence, one more batch)** —
  evidence report §2
- [x] WS7 cap sweep + The Open Vein/chooseX — engine 85acd441; sweep
  winner **F=0.60** applied to `RUPTURE_CAP_FRACTION` (monotone Foundry
  lift, dominance F-invariant, seed-2 confirmed); chooseX mechanism PASS
  (modal X 30/3/18), the-open-vein presence FAIL (draft appeal) —
  evidence report §2
- [x] WS8.2/8.4 re-payloads + test; WS8.3 meter change — shipped in the
  engine-substrate PR (85acd441: `control-surfaces.sim.test.ts` + payload
  data + meter read); matrix-level effect folded into the honest baseline
  (balance-bands 14/14)
- [x] WS9 branch prototype (Phase 33 slice) — substrate + determinism
  test 85acd441 (`threat-branches.engine.test.ts`); in-band check PASS
  (balance-bands 14/14 over the branch-live tree). Behavioral evidence
  (prototype enemies) rides Phase 33
- [ ] WS10.2/10.3 atlas policy + orphan drilling — WS10.2 policy note
  shipped 2026-07-11 (`docs/keyword-atlas.md`); WS10.3 residue waits on
  WS4/WS6 drilling (KINDLE drilled by slag-runoff only at seed 1;
  promotions pending)
- [ ] Promotions from the evidence report §3 queue (poured-rampart,
  corollary, WS2.2 conversions, 3 microset passers; each a /deck-tuning
  PR) + the draft-scorer starvation fix that unblocks the six pending
  verdicts
- [ ] Deferred conditionals unchanged: Steadfast Regard / Crescendo of
  Affection (charm late hole still real — late 0.00 everywhere), WS4.2
  consume_defense (not built, spec 32 §12 item 4)
