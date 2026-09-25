# Axiomancer — Combat System Foundational Redesign Plan (PASS 3 FINAL)

## 1. Metadata

| Field | Value |
|---|---|
| Author | Claude Fable, independent principal combat-systems architect |
| Reviewer | The Judge (T's proxy for this dialogue; major doctrine changes remain T's) |
| Date | 2026-07-14 |
| Pass | 3 of 3 — FINAL (three-pass written dialogue complete; all Judge rulings integrated; dialogue record in §18; unresolved T decisions in §21) |
| Axiomancer repo | `/root/Workspace/SomberSoft/Axiomancer` @ `ab6aae15560c1dcc2dfc887a68f50b061c5a2a9f` (main at Pass-1 research; plan file itself excepted) |
| game-knowledge-base repo | `/root/Workspace/SomberSoft/game-knowledge-base` @ `1be53ec593f85dce4fec4b542f5b5d0c18f5bbcc` (main) |
| Canonical balance baseline | `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`, measured at engine tree `e203fed9` |
| Grace marker lineage | recorded `ddec4adc`; implementation advanced to `13b58c8d` (marker declared stale in-plan) |
| Engine / app versions | `axiomancer-mechanics` v0.37.0 · `axiomancer-mobile` v1.9.0 · `axiomancer-card-editor` v0.1.0 |
| Constraints honored | No repo modification beyond this file; no mutating commands; capped research (18 calls), Pass-1 verification (8 calls), Pass-2 reads (2 of 6), Pass-3 final verification (8 calls); evidence gaps labeled, not chased |

**Authority frame (fixed inputs, not re-litigated):** effects are the core fun; player terms are VITAE and STANCE; mechanics owns rules/state, mobile owns presentation; HP is the sole win condition unless T escalates; skills are learned/unlocked, never equipped; Erosion is NOT audited or player-audited and its wording/mechanism audit is due (T's latest authority; supersedes the stale registry entry — see §12); foundational redesigns are allowed but T decides major doctrine changes.

**Standing Judge law (Passes 1–3, 2026-07-14) — applied throughout this document:**

- **Grace remains open (Pass 3).** Its `Calibration freeze, provisional` verdict does not satisfy Task 5's executed-and-verified condition; Tasks 2/3 are its next legitimate work. Erosion's slice implementation waits for Grace's *final* verdict through its own plan, or an explicit T slot transfer. Administrative hunger is not evidence.
- **Receipts law (Pass 3).** The engine emits **objective receipts only** — setup applied, setup consumed, payoff resolved, enemy counter triggered, cleanse opportunity presented/taken, forecast damage at defend time, resource state, heart-token state, Befriend availability, chosen action. It never emits "decision" events or motives. A **deterministic analyzer** classifies *candidate meaningful-decision moments* from those facts; only the **human audit** determines whether a player actually perceived and made the decision. The engine does not know why a person acted.
- **Strong-policy witnesses (Pass 3).** At least two named deterministic policies — a **theme-native policy** and a **bounded lookahead policy using only player-visible information**. Agreement raises confidence; disagreement exposes policy sensitivity. They are called `strong-policy witnesses`, never "ceiling" (reserved for an exhaustive solver), and never presented as expected-player performance.
- **P-DEFEND split (Pass 3).** Sim evidence emits objective defend context (forecast severity, guard/resource delta, heart tokens, Befriend availability, chosen action) and classifies contexts; `befriend intent` is never emitted unless the player explicitly selected or staged a Befriend preparation action; only a human audit may claim motive.
- **Honesty lane definition (Pass 3).** Projection and copy corrections are in — including mechanics-owned projection code, when no rules payload changes and truth-surface tests land with the fix. Payload changes are out; discovered payload defects are recorded for the balance/implementation lane.

- Evidence before ontology; instrument validity is repaired before anything is diagnosed or redesigned.
- Diagnostic order for the mid/late collapse: instrument validity → strong-policy witnesses → enemy composition → fixed thresholds and escalation timing → global stage scalars **last**. A blind-policy 0% is evidence of failure *under that policy*, not proof that a competent player has no line. Priors stay explicit enough to challenge and cheap enough to kill.
- **Active-plan law:** Erosion's honesty audit may proceed beside Grace; any Erosion balance or architecture vertical-slice *implementation* waits until Grace closes or T explicitly transfers the one active preset slot. No smuggling a second tuning plan through the word "slice."
- **Status metric law:** `statusEngagement` is a warning light, not a design target. The evidence suite must measure **meaningful status decisions**: setup consumed by a payoff, timing changed because of a status, enemy response provoked, cleanse/counter choice created, or a resolution path materially altered. Inflating applications per turn without increasing decisions is failure.
- **Defend doctrine:** defend must be chosen for one of the three `VISION.md` reasons — fear of a telegraphed large attack, resource generation, or preparation for Befriend. An always-correct bunker is red regardless of win rate.
- **Corpus claim discipline:** "no surveyed KB title currently evidences X," never "no game does X." Corpus absence is not world absence.
- **Preset doctrine:** fixed 15-card starters and the Color Law remain the onboarding baseline; borrowed cards must pass a **teaching test** — a borrow that satisfies color arithmetic while obscuring the preset's grammar is design debt even with healthy simulation numbers.
- **Enemy doctrine:** counters tax timing, sequencing, or resource commitment before they delete stacks; immunity is the last resort.
- **Schema restraint:** add a field only when the vertical slice needs it and a deterministic test proves the old substrate cannot express the decision. No migration because a cleaner type can be imagined.
- **Abort law (slice):** reject the slice if it raises average turn time or vocabulary while failing to improve meaningful status decisions and player explanation accuracy. A system can become deeper in code and shallower in play.
- **Separation of verdicts:** shared infrastructure is welcome; shared acceptance verdicts are not. The grammar slice and the mercy witness are judged independently.
- Mercy needs a deterministic sim witness *and* a separate human audit; signatures become theme-authored rites except universal verbs; vocabulary reduces, never doubles; worldview alters permissions/prices/obligations, never an elemental damage axis; substrate stays small with thematic meaning in explicit producers/consumers/receipts; legacy demolition splits (dead internals early, semver-major barrel migration deferred); the roadmap is one coherent recommendation with hypotheses marked.

**Targeted verification pass (8 calls, 2026-07-14) — corrections applied:**

1. **Enemy counterplay is prototyped, not absent.** `src/Combat/e2e/threat-branches.engine.test.ts` verifies a spec-29 reactive-cleanse threat branch: at ≥N afflictions the enemy sheds exactly one (never the last), emitting `threat-cleansed`. The rebaseline's WS9 confirms the branch substrate live and in-band. Finding F-10 is downgraded from "nothing in the bestiary answers a status engine" to "counterplay substrate prototyped; roster-wide counterplay *content* absent." R7 is a rollout, not an invention — and the tested shape already obeys the Pass-2 enemy doctrine (it taxes, it never deletes the last stack).
2. **The Premise track is no longer invisible.** `axiomancer-mobile/state/presenters/combat-encounter.engine.ts` ships `CombatPerorationVM` ("phase 28 — the Premise track + CONCEDE beat... Was fully [invisible]"). The theme-identity doc's "Premises have no combat-UI rendering at all" (2026-07-10) is stale. F-17 narrows to the remaining gauges (rupture fuel/cap, deny forecast, SWAY milestones); the foretell-invisibility claim was not re-verified and stays labeled.
3. **CONCEDE appears tiered, not flat.** `CONCEDE_PREMISES_BASE / _ELITE / _BOSS` constants exist in the presenter's imports; the keyword-atlas note "flat 8-Premise CONCEDE ignores the stage curve" appears stale. Phase 2 must verify the tier values against the curve rather than assume the flat-threshold defect.
4. **Threat-sequence asset verified at source:** per-phase hidden stance, `damageWeight`, optional `threatEffectId`, authored `actionText`/`stanceHint` with strong voice (`combat.threat-sequences.ts`). Mobile presentation architecture verified at source: presenter-VM purity, drag-to-power staging UX, owner-playtest fix trail (`CombatBoard.tsx` header).
5. ~~`EVIDENCE INCOMPLETE`: card-editor source not physically located~~ **Resolved by the Pass-3 verification (below).**

**Pass-3 final verification (8 calls, 2026-07-14) — corrections applied:**

1. **Card editor physically verified.** `axiomancer-card-editor/` exists as documented: Vite + React 19, `src/data/mechanics.contract.ts` (an explicit contract module), `src/server/cardEditorPlugin.ts` + `cardCodegen.ts` (the in-place `cards.library.ts` write path), `src/components/CardFace.tsx`/`CardForm.tsx`, and a `KeywordHint.tsx` form component — some keyword-awareness already exists in the editor. One correction against Pass 1/2: its `package.json` `verify` script is `type-check && lint && build`, richer than the "type-check-only gate" bearings describes; the Pass-1/2 claim understated the editor's gate. The Pass-1/2 glob failures were instrument error, not repo state.
2. **FORETELL presentation, split verdict.** Combat card faces explain FORETELL truthfully: the presenter prints `FORETELL · N` with "reveal the foe's next stance and reorder your deck" (`combat-encounter.engine.ts:1249-1250`), and the engine's `applyForetell` (glimpse next telegraph + reorder, `combat.engine.ts:1180+`) matches that copy. The theme-identity doc's cited engine comment ("player never sees what foretell saw," engine.ts:843-845) no longer exists at or near that location. **Still unverified:** a dedicated foretell-*result* surface in combat (the hazard minigame has a full `ForetellOverlay`; no combat analogue was found in the presenter's VM surface). F-17's foretell caveat narrows accordingly: explanation verified honest; result-display presence unproven.
3. **KB deepening (architectural weight only):** prepared-action timing — Spirit Island's fast/slow precommitment cadence (kb:spirit-island/rules/turn-structure.okf.md, src-003 official/high + src-007 medium): "fast powers resolve before invaders act; slow powers resolve after," praised because "the cadence makes the future readable without making it trivial," with the friction that slow powers are counterintuitive until timed from a prior turn — direct prior art for signature rites with scarce ritual timing (R6) and for any prepared/delayed card verbs. Cognitive-pressure and endgame compression — kb:spirit-island/reception/better-if.okf.md (src-005..009, verified): "can potentially solve the game many rounds in advance; last rounds feel stale" and "heavy brain-burner gameplay that may overwhelm" — receipts for the abort law's turn-time/cognition axis and for compressing solved combat states into decisive resolutions rather than administrative grinding.

---

## 2. Executive verdict

**Axiomancer's combat chassis is distinctive and worth keeping; the game running on it is failing in three compounding, well-evidenced ways; and the repair loop is blocked by harness blind spots that must be fixed before any diagnosis or ontology work.**

The chassis — no-strike status-only damage (`spec.md` §Shipped; Spec 32 v3 "THE STRIKE IS DEAD" deleted `basePower`/`chipHp` at the schema level), the dice-draft/read/Color-Law turn (`docs/combat.md` §Spec 26/26b), explicit player-authored capitulation and mercy (Phase 112, `docs/combat.md` §Friendship Resolution Authority), the 30-keyword presentation registry with card-face honesty guards (`axiomancer-mobile/state/combat/keywords.ts`), and the strict mechanics-truth/mobile-presentation split — is already "distinctly Axiomancer." No surveyed KB title currently evidences deleting direct damage at the schema level while making status the sole path to the win condition (corpus-claim discipline: this is an absence in 14 surveyed games + the Dawncaster corpus, not a claim about all games).

The three failures, per the Turn-Law-honest rebaseline (all figures at `e203fed9`):

1. **The power curve collapses from mid onward — under the surveyed policies.** Blind policy-pick vs the locked 80/50/25-35/0 doctrine: early 82.2–92.8% (hot; 6/10 presets at a literal 1.00 early win-rate cap), mid 3.0–28.0%, **late 0.0% for all ten presets at all three seeds**, impossible 0.0% (rebaseline §1.1–1.2). The curve's shape is right (all ten decay monotonically); its level past early is not. Per the Judge's rulings, this plan neither prejudges a global rules defect nor treats blind-policy 0% as proof that no competent line exists: ten presets collapsing together proves a global *locus*, and §16's diagnostic order (strong-policy witnesses before composition before thresholds, global scalars last) decides what it is.
2. **Theme identity has converged.** Eight of ten themes name affliction as their played neighbor (`plan/tuning/2026-07-10-theme-identity.md` §0); only Charm holds a unique axis (SWAY→CAPITULATE). Compounding: generic signatures deliver ~31–51% of ALL enemy HP loss at every stage (rebaseline §1.4); statusEngagement — read as a warning light, per the status metric law — peaks at ~36% of card plays and decays to ~11–16% late (§1.3); dead-card rate is 68–79% blind/greedy; **mercy resolved 0 times in 25,920 sim runs** (§1.1). What the suite cannot yet measure at all is the thing doctrine actually names: whether status play produces *decisions*.
3. **The evidence harness cannot witness its own cures.** The policy-pick draft scorer starved five sandbox sets to zero drafts at one or more seeds, blocking six verdicts; preset probes cannot see sandbox cards, making "preset X gains a line" gates unwitnessable; the pool-shuffle artifact makes matrix-level A/B deltas unattributable (rebaseline §2, findings 1–3); and no instrument measures meaningful status decisions, strong-policy witness performance, or mercy reachability. The rebaseline names the draft-scorer fix the highest-leverage single change; this plan agrees and sequences the whole instrument-repair family first.

Underneath: a maintainability layer of documented confusion — the Skills/Cards/Signature-Skills triple naming collision (`docs/combat.md` naming-collision warning), the dead Spec 03 proc engine ("no live callers"), `calculateSkillDamage` as a permanent 0-returning stub, and vestigial types (`'retreat'` union members, `BattleLogEntry`).

### The ten ordered recommendations

1. **R1 — Repair the evidence instruments before all diagnosis and ontology work.** Draft-scorer offer/weight fix, preset-injection witness, pool-shuffle attribution discipline, **objective-receipt emission + deterministic decision-moment analyzer** (the receipts law's instruments), and the two **strong-policy witnesses** (theme-native + bounded visible-information lookahead). One targeted scorer fix already unblocks six pending verdicts (rebaseline §3).
2. **R2 — Diagnose the mid/late collapse in the Judge's order**: strong-policy witnesses → enemy composition → fixed thresholds and escalation timing → global stage scalars last, with the starter-deck lifecycle probed alongside composition. Apply the *smallest common lever* that restores the curve without flattening theme identity; every global lever behind an explicit T decision gate; no artificial late rescue (kb:heat).
3. **R3 — Prove the architecture with one vertical slice, cleanly gated**: the Erosion preset, an enemy triangle of one race / one cleanser with a readable window / one converter, and an **Erosion-native boss** — with mobile presentation, editor validation, deterministic tests, and a human play audit. The honesty audit (3a) runs now; the slice implementation (3b) waits for Grace's *final* verdict through its own plan (the provisional freeze is not closure — Pass 3 ruling) or an explicit T slot transfer. Mercy is witnessed **separately** (R8) so a failure in either is interpretable.
4. **R4 — Split effect substrate from authored status grammar, under the restraint law.** Small generic lifecycle primitives; thematic meaning in explicit producers, consumers, and receipts. Each schema field is added only when the slice needs it and a deterministic test proves the current substrate cannot express the decision. The owner-ratified differentiated DoT clocks are the first candidates — each clock must pass that inexpressibility test before it becomes schema.
5. **R5 — Reduce vocabulary, don't grow it.** Merge keywords that create the same decision; strengthen trigger windows, counters, and receipts instead. Net keyword count may only fall or hold (TICK retirement owner-ratified; KINDLE→FORGE fold conditional; `COLOR_MATCH_DAMAGE_BONUS` fold-in a constant-surface candidate).
6. **R6 — Make signatures theme-authored.** Neutral signatures survive only as universal verbs (read, reroll, recover); every theme-finishing or damage-bearing signature becomes a theme rite (a REAP, a Premise surge, a wheel-spin — theme-identity §1). Skills remain persistent learned permissions with scarce ritual timing — never extra hand contents (KB prior art: Aeon's End breach-gated preparation, §7).
7. **R7 — Roll out enemy counterplay under the tax hierarchy**: counters tax timing, sequencing, or resource commitment before they delete stacks; immunity last resort. 2–3 mid/late counter-enemies per status class, generalizing the verified spec-29 branch prototype (which already obeys the hierarchy).
8. **R8 — Make mercy witnessable and authored, as its own verdict.** A deterministic mercy-capable sim policy plus a reachability/non-degeneracy gate against an **existing authored befriendable encounter (Coastal Tyrant)** proves the path exists; a separate human audit judges legibility, temptation, consequence, and whether exploit-vs-spare feels authored. Shared infrastructure with the slice is fine; the acceptance verdict is not shared.
9. **R9 — Truth the preset registry; run the Erosion honesty audit; hold presets to the teaching test.** The ten presets stay fixed 15-card starter archetype seeds that teach one grammar each and are traded after the labyrinth; the Color Law stays; every borrowed card must pass the teaching test (does it teach the preset's grammar, or merely satisfy color arithmetic?).
10. **R10 — Split legacy demolition.** Delete truly dead internal paths early (Spec 03 proc engine, `calculateSkillDamage` stub, dead unions) so the redesign never reasons against ghosts; defer the public Skills→Cards barrel migration (semver-major, three-consumer) until the vertical slice is proven, then migrate mechanics/mobile/editor together.

---

## 3. Architecture map (as-is)

```
axiomancer-mechanics (truth)                    axiomancer-mobile (presentation)
─────────────────────────────                   ────────────────────────────────
src/Combat/
  combat.engine.ts   phase loop, read/draft,     state/combat/keywords.ts   30-keyword registry
                     Conviction, escalation      state/combat/momentum.ts
  combat.dice.ts     4-die mana state machine    state/combat/store-actions.ts
  combat.deck.ts     shuffle/draw, keep-hand     state/presenters/combat-encounter.engine.ts
  combat.cards.ts    card→CombatCard projection    (pure state→VM; CombatViewModel,
  combat.threat.ts   threat scaling               CombatPerorationVM Premise track, …)
  combat.threat-sequences.ts  61 authored seqs   components/combat/encounter/
  combat.deck-presets.ts  10 × 15-card presets     CombatBoard (drag-to-power),
  combat.signature.ts     Conviction-funded kit    CombatCombatantPane, tutorial,
  combat.encounter.sim.ts Monte-Carlo policies     IntentIcon, statusGlyphs
  combat.reducer.ts / effects.ts / index.ts
src/Cards/cards.library.ts  70 cards, 10 themes  axiomancer-card-editor
  cards.pricing.ts   rank-band pricing lint        reads/writes cards.library.ts in place
                                                   via @mechanics (type-check-only gate)
Legacy in-tree: Spec 03 proc engine (no live callers), calculateSkillDamage→0,
BattleLogEntry, 'retreat' union member, Cards/card.engine.ts naming collision
```

Data flow: mobile and editor consume mechanics as local TS source via `@mechanics` (`plan/bearings.md` §alias); the export barrel is the locked public contract. Evidence flow: `combat-playtest` (144 cells/seed stage×policy matrix), `combat-sim`, balance-bands vitest, preset probes, reward-draft sim → `plan/tuning/` commit-stamped reports. External: kb-query MCP over the KB corpus; axio-query over the live catalog; R2 vault for artifacts (`docs/external-architecture.md`).

The boundary rule holding best: engine effect ids are never renamed for player text — mobile's keyword registry maps them (`keywords.ts` header). This is the pattern the redesign generalizes (substrate vs grammar, R4).

---

## 4. Findings register

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| F-1 | Late-stage win rate 0.0% for all 10 presets, 3 seeds, **under surveyed policies** (competent-line existence unproven either way — strong-policy witnesses pending) | rebaseline §1.1–1.2; Judge rulings | Critical |
| F-2 | statusEngagement (warning light) 32–36% early → 11–16% late; meaningful status *decisions* unmeasured entirely | rebaseline §1.3; status metric law | Critical |
| F-3 | 8/10 themes play as affliction clones; only Charm has a unique axis | theme-identity §0 | Critical |
| F-4 | Generic signatures deal 31–51% of all enemy HP loss at every stage | rebaseline §1.4 | High |
| F-5 | Mercy: 0 resolutions in 25,920 runs; CONCEDE 0; CAPITULATE rare (30–268) | rebaseline §1.1 | High |
| F-6 | Draft scorer starves new cards (5 sets at zero drafts ≥1 seed); 6 verdicts blocked | rebaseline §2 finding 2 | High (blocks repair) |
| F-7 | Preset probes cannot witness sandbox cards; preset-gain gates unwitnessable | rebaseline §2 finding 3 | High (blocks repair) |
| F-8 | Pool-shuffle artifact: identical +10.8pp mid delta from any 71st card at a seed | rebaseline §2 finding 1 | Medium (misleads) |
| F-9 | Dead-card rate 68.6–78.6% blind/greedy | rebaseline §1.4 | High |
| F-10 | **(corrected)** Counterplay substrate prototyped (spec-29 reactive-cleanse threat branch, tested: sheds one affliction, never the last); roster-wide counterplay *content* absent | `threat-branches.engine.test.ts`; rebaseline WS9; theme-identity §1 | Medium-High |
| F-11 | Early too safe: 6/10 presets at literal 1.00 early | rebaseline §1.2 | Medium |
| F-12 | Skills/Cards/Signature naming collision documented as live confusion | docs/combat.md naming warning | Medium (maintainability) |
| F-13 | Dead subsystems in-tree: Spec 03 procs, damage stub, retreat union, BattleLogEntry | docs/combat.md | Medium |
| F-14 | Preset registry drift: file says Erosion "player audited"; T's latest authority says it is not | preset-rework-status.md vs Judge brief | Medium (truth) |
| F-15 | Farm-era numbers inverted direction 4×; pre-2026-07-11 numbers asterisked | rebaseline §4 | Standing discipline |
| F-16 | Systemic lying-copy class: Grace Task 3A found hidden riders on 8 of 11 audited cards | grace-plan Task 3A | Medium (systemic) |
| F-17 | **(corrected ×2)** Premise track + CONCEDE beat landed in mobile (phase 28, `CombatPerorationVM`). FORETELL card explanation verified honest (Pass 3); the theme-identity doc's cited "player never sees" engine comment no longer exists; a combat foretell-*result* surface remains unevidenced (hazard has one; combat analogue not found). Remaining gauge gaps: rupture fuel/cap, deny forecast, SWAY milestones, foretell result | presenter + engine source; theme-identity §2 (partially stale) | Low-Medium (UX) |
| F-18 | King of Revenge is a hard early wall for Grace; enemy-level outliers unmapped roster-wide | grace-plan marker | Low-Medium |
| F-19 | **(verification)** CONCEDE thresholds appear tiered (`CONCEDE_PREMISES_BASE/_ELITE/_BOSS`); keyword-atlas "flat 8-Premise" note appears stale — verify tier values in Phase 2 | presenter imports vs keyword-atlas Peroration row | Low (doc drift) |
| F-20 | **(Pass 2, refined Pass 3)** No instrument emits the objective receipts, no analyzer classifies candidate decision moments, no strong-policy witnesses exist, no defend-context receipts, no mercy-capable policy — the doctrine-critical properties are currently unwitnessable | receipts law; defend doctrine; strong-policy ruling; F-5 | High (blocks judgment) |

`EVIDENCE INCOMPLETE` (remaining after Pass 3): a combat foretell-*result* surface (explanation verified; result display unproven); specs 25/32 read via `docs/combat.md`, not the spec files. Card-editor and FORETELL-explanation gaps were closed by the Pass-3 verification (§1).

---

## 5. Identity tests

A redesign phase passes only if these hold in **human play**, not just sim:

- **P-IDENT** (existing): a player can name the theme from three turns of play, without reading flavor text.
- **P-ARC** (existing): each theme has a felt setup→spike arc ≥2 turns, with a visible gauge, and a reason the spike is worth *waiting* for.
- **P-READ**: the draft/read decision changes at least one card-play decision per turn; the enemy's telegraph is legible enough to plan against and threatening enough to matter (KB receipt: Spirit Island, §7).
- **P-DECIDE** (Pass 2, refined Pass 3 — the status metric law's test): status play produces **decisions**, not just applications. Witnessed in three layers, never conflated: engine-emitted *objective receipts* (setup applied/consumed, payoff resolved, counter triggered, cleanse opportunity presented/taken); a *deterministic analyzer* classifying candidate meaningful-decision moments from those receipts; and the *human audit* determining whether a player actually perceived and made the decision. Rising applications with flat candidate-decision moments is a failure; candidate moments the human audit shows players never perceive are also a failure.
- **P-STATUS**: in a competent playthrough, the majority of enemy HP loss is attributable to the player's *theme engine*, not generic signatures (witness: `CombatSimStats.dotHpFraction`/`mechanicBurstFraction` vs signature share). Read alongside P-DECIDE; neither passes alone.
- **P-DEFEND** (Pass 2, refined Pass 3 — the defend doctrine's test): defend is chosen for fear of a telegraphed large attack, resource generation, or Befriend preparation — and for no other stable reason. Witnessed by the same split: objective defend-context receipts (forecast severity, guard/resource delta, heart tokens, Befriend availability, chosen action — never a `befriend intent` field unless an explicit Befriend preparation action was staged), analyzer classification of contexts, human audit for motive. An always-correct bunker is red regardless of win rate.
- **P-MERCY**: mercy/capitulate/concede are reachable, costed, tempting, and consequential — the exploit-vs-spare fork reads as authored, not procedural (human-audit half of R8).
- **P-AXIOM**: worldview visibly alters permissions, prices, obligations, or future consequences in combat — never an elemental damage axis (ties to `applyMoralMeterScaling`, Befriend anti-exploit rules, and faction-priced boss mercy already in `VISION.md`).
- **P-HONEST**: every card face states its complete FREE and PAID payload in registry vocabulary (Grace Task 3A generalized; the card-face honesty guard test as enforcement).

---

## 6. System audits

### 6.1 Core loop and action economy
The turn (roll 3 dice → draft one as stance/read → Color-Law card plays → threat phase → between-phase upkeep) is sound and original. Strengths: honest roll, Conviction consolation for unpicked dice, keep-hand rule (2026-07-13), escalation clock with on-vision counters (race via DoT or deny via control). Weaknesses: `COLOR_MATCH_DAMAGE_BONUS` is documented as "near-unconditional under the color law — a fold-in candidate"; the read multiplies damage and status magnitude through two separate constants (`READ_DAMAGE_MULT`, `READ_STATUS_MULT`) — tuning surface without decision surface. **Verdict: keep; simplify constants; no structural change without slice evidence.**

### 6.2 Resources
Four currencies compete: dice (turn), Conviction (cross-turn), theme currencies (Premises, Souls, pips, SWAY, DEBT…), heart tokens (Befriend). The generic pool currently out-earns and out-pays the theme currencies — Foundry is "a Conviction battery; signatures do 85–95% of damage" (theme-identity §0). The FREE-line law (FREE deposits THEME currency; `VISION.md`, owner-ratified 2026-07-09/10) is the correct corrective; R6 closes the other half by making Conviction's *outlet* theme-shaped. Defend's place in this economy is now itself a gate: resource generation is one of its three legitimate reasons (P-DEFEND), so the slice must show defend generating toward a plan, not bunkering. **Verdict: the resource taxonomy is right; the exchange rates invert the intended hierarchy.**

### 6.3 Effects
The engine's effect machinery (ActiveEffect, aggregated modifiers, tick/duration, DoT selectors, RUPTURE/AMPLIFY/COMPOUND/DISRUPT, cleanse/dispel tiers) is capable but grew by accretion: legacy buff/debuff doc trees, `support`/`non-card` tags doing double duty, and one shared tick boundary for all DoT species. The owner-ratified differentiated-clocks item exists because the substrate cannot express trigger conditions today — but per the schema restraint law, that inexpressibility must now be *proven per field by a deterministic test* before any migration (§11). **Verdict: the one place a schema change is plausibly justified; the restraint law decides how much of it actually happens.**

### 6.4 Cards
70 cards / 10 themes / 30 keywords / rank-band pricing with a hermetic lint is a strong, honest foundation. Failures are distributional, not structural: dead-card rate 68–79% (F-9); single commons carrying decks (straw-mans-jab at 71–78% of all enemy HP loss in Erosion play); FREE-line traps on one-of finishers. The pricing model prices *lifetime damage*, not *decision quality* — cards whose lines never present a real choice pass the lint; P-DECIDE telemetry (Phase 1) is what will finally make that measurable. **Verdict: keep the library shape; the theme-identity §2 items are the queue; add a decision-quality review dimension to `/deck-tuning` once the telemetry exists.**

### 6.5 The ten presets
Per rebaseline §1.2 (early/mid/late spreads) and theme-identity §0:

| Preset | Theme | E/M/L | Identity verdict | Priority work |
|---|---|---|---|---|
| erosion | affliction | 1.00/0.38/0.00 | best doctrine citizen, amputated arc (detonate-ASAP) | honesty audit now (3a); slice implementation gated (3b) |
| oratory | peroration | 0.97/0.05/0.00 | real unique resource; visibility landed phase 28 (F-17 corrected) | milestone drip, closing-word fixes; verify CONCEDE tiers (F-19) |
| foundry | forge | 0.90/0.00/0.00 | Conviction battery; Overtake gate zeroed its mid | OVERHEAT press-your-luck (KB: Quacks), FREE-forges |
| penitent | akrasia | 0.97/0.13/0.00 | cosmetic blood surcharge | DEBT ledger, absolution fork, Last Word |
| standstill | control | 1.00/0.07/0.00 | denial automatic; BACKFIRE a de facto DoT | variable rungs, TURNABOUT (landed), deny forecast |
| augury | oracle | 1.00/0.03/0.00 | prophecy on rails | OMEN v2 (chosen claims, stakes), foretell UI (unre-verified) |
| tithe | harvest | 0.97/0.20/0.00 | affliction clone; jar never pays | PA-1 deep rework: REAP attacks max-HP; Souls persist |
| grace | charm | 1.00/0.00/0.00 | the one unique axis; frozen provisionally | owns the tuning slot; Tasks 2/3 decomposition next |
| bastion | bulwark | 1.00/0.00/0.00 | worst engagement (2/10); poison in a shield costume | RIPOSTE reflects the prevented blow |
| refrain | echo | 1.00/0.05/0.00 | pre-doubled affliction loop | REPRISE→player choice (cheapest agency win); Ouroboros paid-face fix already proved the class (late 3→37%) |

Presets stay fixed 15-card starter seeds (4/4/2/2/1/1/1), traded post-labyrinth; the 80/50/25-35/0 curve remains their objective function; Color Law preserved. **Teaching test (Pass 2):** every borrowed card in every preset is judged on whether it teaches the preset's grammar — a color-compliant borrow that obscures the grammar is design debt even with healthy numbers. The Grace plan's own rejected experiment (adding SWAY to borrowed `second-thoughts` "contaminated Echo vocabulary") is the precedent: the teaching test formalizes what that rejection already knew.

### 6.6 Enemies
61 authored deterministic threat sequences with strong voice — verified at source (`combat.threat-sequences.ts`: hidden stance, `damageWeight`, optional `threatEffectId`, `stanceHint` per phase). This is the Spirit Island lesson embodied: telegraphed automation over hidden randomness (kb:spirit-island/scout-report). The spec-29 threat-branch substrate (reactive cleanse, tested, sheds one and never the last) proves counterplay is implementable today *and* already models the Pass-2 tax hierarchy. Missing: roster-wide counterplay content (F-10 corrected), variable-rung telegraphs, and a per-enemy difficulty map (F-18). **Verdict: framework in §13 under the tax hierarchy; substrate risk retired.**

### 6.7 Mercy
Mechanically hardened (Phase 112: explicit Befriend cast, 5 heart tokens, mercy choice, authorization flag) and content-rich (7 authored friendship rewards, anti-exploit doctrine, Coastal Tyrant's authored `befriendabilityConfig`: hpGate 0.4, required heart stance, 3 both-defend rounds). But it has never fired in simulation (F-5), and since heart-token generation, HP gates, and both-defend counters live in behavior the sim policies don't pursue, we cannot distinguish "hard but reachable" from "unreachable." Per the Judge's ruling, the mercy witness runs against **Coastal Tyrant as an existing authored encounter, with its own acceptance verdict, decoupled from the grammar slice** — if either fails, we know which one. **Verdict: the most distinctly-Axiomancer subsystem in combat is also the least evidenced; R8/Phase 7.**

### 6.8 Progression
Learned/unlocked cards (never equipped), curated 20-card loadout via flags codec, post-win 1-of-N archetype-biased drafts, rare dilemma unlocks, labyrinth deck commitment. Two defects: the draft scorer starvation (F-6) means the *acquisition* path the mid-game depends on is exactly the broken instrument; and with late at 0% under surveyed policies, the intended "trade into a mid-game deck" lifecycle has no evidenced destination — though whether that is a lifecycle defect or a policy-strength artifact is precisely what Phase 2's ordered diagnosis decides. **Verdict: structure sound; unblock R1 first, then evidence the lifecycle.**

### 6.9 Mobile
Verified at source: presenter purity (`combat-encounter.engine.ts` VMs), the drag-to-power staging interaction with an owner-playtest-driven fix trail, keyword registry + card-face honesty guard, phase-28 Premise track. Remaining gaps are gauges (rupture fuel/cap preview, deny forecast, SWAY resolve milestones — S-tier items with engine-side values mostly computed) and the unre-verified foretell readout. **Verdict: no architectural change; the vertical slice ships its theme's gauge as a first-class deliverable.**

### 6.10 Editor
**Physically verified (Pass 3).** Vite + React 19; `src/data/mechanics.contract.ts` (explicit contract module); `src/server/cardEditorPlugin.ts` + `cardCodegen.ts` write `cards.library.ts` in place via `@mechanics`; `CardFace`/`CardForm` plus a `KeywordHint` form component (keyword-awareness already present). Correction to Pass 1/2 and to bearings' description: its `verify` script is `type-check && lint && build`, not type-check-only. Cards-only CI carve-out exists; registry-vocabulary and pricing lints live in mechanics tests (which run in CI — acceptable). Contract obligation: any effect-schema change (§11) migrates the editor in the same change as mechanics/mobile. **Verdict: adequate and verified; extend `KeywordHint`-style validation into full registry validation as a slice deliverable.**

### 6.11 Evidence
The strongest subsystem culturally (commit-stamped baselines, seeded determinism, kill conditions, adversarial skeptic verification, the asterisk discipline that caught four directional inversions). Instrument defects and witness gaps — now including the four doctrine-critical unwitnessables of F-20 — in §15.

---

## 7. KB ledger

Corpus at `1be53ec5`: 14 board games (all verified except Marvel Champions `needs_followup`), 0 pattern docs yet, 1,692 Dawncaster card records / 141 keywords (kb_overview). All corpus claims below observe the Pass-2 discipline: they describe what surveyed titles evidence, not what all games do.

| Claim used | Receipt | Where applied |
|---|---|---|
| Telegraphed enemy automation beats hidden randomness in the surveyed co-op; staged threat (explore/build/ravage) turns danger into responsibility; "predictable enough to plan against, threatening enough to matter"; solved endgames become procedural | kb:spirit-island/scout-report.okf.md (src-001..009, verified) | §6.6 asset validation; §13 framework; P-READ |
| Catch-up/assist mechanisms breed resentment when "the hand of the system" is visible | kb:heat-pedal-to-the-metal/reception/better-if.okf.md | §10 Phase 2 constraint: no artificial late rescue |
| Breach-gated spell preparation = scarce ritual timing on always-available powers; no-shuffle discard order as a deck-physics differentiation axis; boss-specific pressure gives a deckbuilder a direct tactical enemy | kb:aeons-end/index.okf.md (src-001..003, verified) | R6 signature rites; §11 deck-physics axis (hypothesis only); §13 boss design |
| Push-your-luck bust economies (OVERHEAT receipt for Foundry) | kb:the-quacks-of-quedlinburg (overview; cited in theme-identity §2) | §6.5 foundry row |
| Dawncaster analogues, each with cached receipt: Poison; Bleeding (reactive stack economy); Charmed (decay/hold tension); Souls/Reaping (bank rules); Momentum (banked counter cashes at threshold); Stagger; Blood (HP as cost); Corrupted (threshold state); Rebound | `axiomancer-mechanics/docs/keyword-atlas.md` rows citing `kb:dawncaster/keywords/*.okf.md` | §11 grammar design; per-theme reworks |

`EVIDENCE INCOMPLETE`: no pattern docs exist yet in the KB (`/synthesize-patterns` backlog); Pass 3 deepens only KB claims that carry architectural weight (per the Judge: verification must not become another survey without an end).

---

## 8. Three future models

**Model A — Recalibrated Present.** No ontology change. Fix the instruments, decompose and patch the curve, execute the theme-identity S/M items card-by-card, reprice signatures. *Strength:* lowest risk, all inside the current schema. *Weakness:* the differentiated-clocks item and roster counterplay both strain the current effect substrate; per-card honesty fixes (F-16) keep recurring because the schema cannot express trigger grammar — permanent rent on the accretion. Under the schema restraint law, Model A is the *default outcome* wherever the slice fails to prove inexpressibility.

**Model B — Grammar Consolidation (recommended).** Keep the engine loop, presets, HP win condition, and keyword count; introduce the substrate/grammar split (§11) strictly under the restraint law; make clocks, counters, producers/consumers explicit; theme-authored signatures; enemy counterplay rollout under the tax hierarchy; vocabulary reduction. Proven via the Erosion vertical slice before any roster-wide application. *Strength:* attacks the shared root of F-2/F-3/F-10/F-16; incremental and abortable; degrades gracefully to Model A per field. *Weakness:* schema migration touches all three packages; must ride behind R1's instrument repair to be judged honestly; its implementation start is gated by the active-plan law.

**Model C — Worldview Combat.** Model B plus: philosophical alignment becomes in-combat permissions, prices, and obligations (alignment-gated card lines; mercy rites priced by faction standing). The Pass-2 ruling constrains its resolution-grammar element: the post-Phase-3 memo may *ask* whether Befriend, CAPITULATE, and CONCEDE benefit from a shared resolution grammar; it must **not assume they are one mechanic** — their moral meaning, setup texture, and consequence may require deliberate asymmetry. *Strength:* maximally "distinctly Axiomancer." *Weakness:* every element is major doctrine (T's); unpriceable until Model B's slice proves the substrate. Held as the north star; elements enter the roadmap only as T-gated hypotheses.

**Recommendation: Model B now, degrading per-field to Model A under the restraint law, with Model C's resolution-grammar *question* (not unification) as the one named hypothesis for post-slice T review.**

---

## 9. Final target and example encounter

**Target experience (mid-stage, Erosion, post-slice):** The player knows their deck's grammar: BLEED bites when the enemy acts, POISON ramps as they play, MARK amplifies on payoff. The slice's enemy triangle teaches three pressures — a **racer** that punishes slow setup, a **cleanser** with a readable window, and a **converter** that makes excessive stacking dangerous without making affliction irrelevant. Today's fight is the cleanser — a Cauterant Sexton (elite, on the spec-29 branch substrate): *rung 1 gathers; rung 2 cauterizes (sheds its deepest affliction — never the last); rung 3 strikes for 14.* The player reads the telegraph: the cauterize is coming, so dumping deep poison now feeds the purge. Instead they draft the body die (a read on rung 3), play FREE lines that seed shallow bleeds the purge will waste itself on, and bank the deep poison for after the cauterize window — the counter *taxed their sequencing*; it deleted nothing that mattered. One turn they defend — not as a bunker, but because rung 3 is telegraphed large and defending banks resource toward the spike (P-DEFEND's first two legitimate reasons, witnessed in one play). Now the spike: MARK, deep poison, and next turn RUPTURE with fuel *above* the old detonate-ASAP line, because patience pays. The rupture fuel/cap gauge was visible throughout. The kill lands at turn 7 of a projected 9; the escalation clock never bit. Three turns in, an observer could name the theme (P-IDENT); the arc was felt and gauged (P-ARC); the fight produced *countable decisions* — a setup consumed by a payoff, timing changed by a status, an enemy response played around (P-DECIDE). The slice's boss is **Erosion-native** (grammar under maximum pressure); mercy is witnessed separately against Coastal Tyrant so neither verdict contaminates the other.

Contrast today: the same fight is "plant 2 DoTs, detonate at cap by t2, spectate" (theme-identity §0) — and at late stage, under every surveyed policy, it is a loss.

---

## 10. Ordered roadmap

Each phase carries migration path, tests, acceptance, abort, and T-approval. One coherent line, not a catalog; hypotheses marked. The Grace tuning slot and its plan continue untouched in parallel throughout; the active-plan law gates Phase 3b explicitly.

**Phase 0 — Ghost demolition + editor verification (small, first).**
Delete dead internal paths: Spec 03 proc runtime, `calculateSkillDamage` stub (after confirming sim-policy call sites), `BattleLogEntry` (or demote to docs), `'retreat'` union members. Physically verify the card-editor package layout (the open item from the verification pass). *Internal only — the public barrel untouched.* Tests: mechanics verify + mobile/editor gates (alias coupling). Acceptance: zero behavior change — bit-identical sim baselines at fixed seeds. Abort: any baseline drift → revert, investigate. T-approval: none (no doctrine surface).

**Phase 1 — Instrument repair (R1; absorbs "instrument validity first").**
(a) Fix draft-scorer offer/weight starvation; (b) add a preset-injection probe mode (e.g. `--deck=preset:X+inject:card,...`); (c) adopt attribution discipline for pool-shuffle noise (per-card telemetry primary; matrix deltas advisory); (d) **build the receipts pipeline** — engine-emitted objective receipts (setup applied/consumed, payoff resolved, counter triggered, cleanse opportunity presented/taken, forecast damage at defend time, resource/heart state, Befriend availability, chosen action — never "decision" or motive events) plus a separate **deterministic analyzer** that classifies candidate meaningful-decision moments from those receipts; (e) **build the two strong-policy witnesses** — a theme-native deterministic policy and a bounded lookahead policy using only player-visible information, named `strong-policy witnesses` (never "ceiling"; never expected-player). Re-cut the six blocked verdicts at two fresh seeds. Tests: hermetic sim tests pinning scorer, receipt, and analyzer behavior; re-derived `deck-matrix-baseline.json` at the new SHA. Acceptance: previously-invisible sets receive nonzero drafts; preset-injection witnesses run; receipts and analyzer classifications pinned on known transcripts; each strong-policy witness beats blind/greedy on at least one stage without breaching dominance rules, and their agreement/disagreement is reported per cell. Abort: scorer changes moving tuned-witness baselines >2pp unexplained. T-approval: none (instrumentation).

**Phase 2 — Collapse diagnosis, in the Judge's order (R2).**
Probes strictly ordered: (a) **strong-policy witnesses** — run both Phase-1 witnesses across the matrix; a blind-policy 0% is failure under that policy, not proof no line exists — establish what the current rules demonstrably permit, with witness agreement raising confidence and disagreement exposing policy sensitivity; (b) **enemy composition** — per-enemy difficulty map; King-of-Revenge-class outliers; the starter-deck lifecycle probed alongside (do reward-drafted decks win late where starters shouldn't?); (c) **fixed thresholds and escalation timing** — verify the CONCEDE tier values (F-19), resolve math, `DISRUPT_DENY_AT`, and sweep `THREAT_ESCALATION_GRACE`/`_PER_ROUND`/`_BOSS_MULT`; (d) **global stage scalars last** — enemy HP/level curves, touched only if (a)–(c) leave the collapse unexplained. Deliverable: a diagnosis memo naming the smallest common lever, honoring the Heat constraint (no artificial late rescue; prefer levers that raise the player ceiling over pity-scaling enemies down — kb:heat). Mechanism-level acceptance bands for later phases are **ratified inside this memo**, not before it. Tests: each probe a seeded, commit-stamped report. Acceptance: the memo attributes ≥80% of the late collapse to named loci with reproduced numbers. Abort: cross-seed contradiction → widen seeds before concluding. **T-approval: required before any global lever from this memo is applied.**

**Phase 3a — Erosion honesty audit (R9; honesty lane, immediate).**
The wording/mechanism audit T's authority says is due — Grace Task 3A is the template: project every Erosion-preset and affliction-library card through `toCombatCard`, expose hidden riders, fix lying copy, pin every material clause in a wording guard test. Explicitly *not* tuning; runs beside Grace under the active-plan law. Acceptance: a wording witness test equivalent to `grace-card-wording.engine.test.ts` covering all Erosion/affliction cards; P-HONEST green for the theme. Abort: n/a (honesty work). T-approval: none.

**Phase 3b — Vertical slice: Erosion (R3, R4 first proof) — GATED.**
**Gate (Pass 3 ruling): Grace reaches a *final* verdict through its own plan — the current provisional freeze is not closure — or T explicitly transfers the active preset slot.** Contents: (1) substrate/grammar work scoped to what the slice needs, each schema field passing the restraint law's inexpressibility test first (§11) — the differentiated DoT clocks are the first candidates; (2) rupture-patience mechanism (fuel-scaling cap or overcap dividend — `/deck-tuning` owns the pick, sandbox-first; the previously audited mechanism was REFUTED on a code misread, so re-spec from source); (3) the enemy triangle — one race, one cleanser with a readable window, one converter that makes excessive stacking dangerous without making affliction irrelevant — plus an **Erosion-native boss** (grammar under maximum pressure; not a mercy vehicle); (4) mobile: rupture fuel/cap gauge, clock badges on DoT glyphs; (5) editor validation against registry vocabulary; (6) deterministic engine tests + a human play audit against §5, including P-DEFEND (defend chosen only for the three legitimate reasons) and P-DECIDE (decision telemetry up, not just applications). Migration: additive schema fields with defaults reproducing current behavior; no barrel renames. Acceptance: P-IDENT, P-ARC, P-READ, P-DECIDE, P-STATUS, P-DEFEND pass; Erosion mid ≥ ratchet; no dominance breach; all three package gates green. **Abort law (Judge-ratified, Pass 2): reject the slice if it raises average turn time or vocabulary while failing to improve meaningful status decisions and player explanation accuracy — a system can become deeper in code and shallower in play.** T-approval: clock semantics (owner-ratified 2026-07-10) confirmed at spec sign-off; anything beyond ratified scope stops.

**Phase 4 — Apply the Phase-2 lever (T-gated).**
Implement the smallest common lever from the diagnosis memo; re-run the full matrix + balance bands with the Phase-1 instruments (including decision telemetry); re-derive the curve; re-stamp Grace's marker. Acceptance: the memo-ratified bands; starters obey their decay doctrine; impossible stays 0%. Abort: identity flattening (theme distinctiveness drops) or early leaving the 70–90% neighborhood. **T-approval: mandatory (global rules).**

**Phase 5 — Signatures become rites (R6).**
Keep read/reroll/recover as neutral universal verbs; replace damage-bearing generics with per-theme rites (scarce ritual timing — KB: Aeon's End breach gating); reprice against the repaired evidence. Acceptance: signature share of enemy HP loss falls below the theme engine's share in tuned witnesses (P-STATUS), with decision telemetry not regressing (P-DECIDE). Abort: a theme's win rate collapsing >10pp → restore its generic pending redesign. T-approval: catalogue summary sign-off (touches every archetype).

**Phase 6 — Enemy counterplay rollout (R7, §13).**
2–3 counter-enemies per status class across mid/late, all with staged telegraphs, all obeying the tax hierarchy (timing/sequencing/commitment before stack deletion; immunity last resort), generalizing the tested spec-29 branch substrate. Acceptance: "protect the engine" decisions observable in decision telemetry and transcripts; no deck hard-countered below 10% by a single enemy. Abort: any counter reading as deck negation in human audit. T-approval: content-level, batched.

**Phase 7 — Mercy witness + audit (R8; independent verdict).**
Deterministic mercy-seeking policy that banks heart tokens, casts Befriend at eligibility, chooses spare — run against **Coastal Tyrant and the existing authored befriendable roster**, not the slice content. Reachability gate: mercy achievable within N rounds at early/mid, non-degenerately. Then the human audit: legibility, temptation, consequence, exploit-vs-spare authoredness (P-MERCY). Acceptance: mercy >0 with sane frequency in the policy's cells; human-audit verdict recorded — **judged on its own, never pooled with the slice verdict**. Abort: n/a (witness-building). T-approval: only if the audit demands mechanics changes.

**Phase 8 — Theme wave 2 (remaining presets).**
Apply the proven grammar to the theme-identity queue in its own sequencing (S-tier gauges/honesty first; harvest PA-1 and bulwark RIPOSTE-scaling as the two deep reworks; akrasia DEBT ledger; oratory milestone drip; etc.), one theme-pass per PR, sandbox-first via `/deck-tuning`, re-running the ten-theme matrix after each wave; every borrowed card re-judged under the teaching test. Acceptance per theme: its §5 tests + registry gates. T-approval: per deep-rework spec.

**Phase 9 — Barrel migration (R10 second half).**
Only after the slice and wave-2 grammar are proven: the semver-major Skills→Cards naming reconciliation across the `@mechanics` barrel, migrating mechanics/mobile/editor in one change; deprecated aliases removed. Acceptance: all three gates green; zero deprecated imports remain. T-approval: contract-change sign-off.

---

## 11. Effect schema, lifecycle, stacking, UI, migration

**Restraint law first (Pass 2, governing):** no field is added because a cleaner type can be imagined. A schema field enters only when the vertical slice needs it **and a deterministic test proves the current substrate cannot express the decision** — e.g., a pinned test showing that "BLEED ticks per enemy damage instance" cannot be represented, only approximated, by duration/intensity bookkeeping on the shared phase-boundary tick. Fields that fail the test are implemented the Model-A way (existing mechanisms) instead.

**Substrate (engine, small and generic), as slice-proven:** the candidate shape is `{ id, class: dot|control|stat|state|resource, intensity, expiry, clock, tags }`, where `clock` is the only new primitive — a trigger condition from a closed set (`phase-boundary`, `per-card-played`, `per-damage-instance`, `on-payoff-consumed`, `on-telegraph-fired`). Lifecycle stays apply → trigger-on-clock → decay/consume → expire, with existing selectors (`getPendingDotTotal`, `consumeDotEffects`, `getDistinctDebuffCount`, …) re-expressed over clocks. Stacking rules become declarative per class (ramp, decay-per-trigger, cap, battle-long) *only for the classes the slice exercises*; the rest keep their current per-effect handling until their own theme wave proves need.

**Grammar (authored, where meaning lives):** each theme declares producers (which cards/lines mint its currency or seed its effects), consumers (payoffs that spend/consume), and **receipts** — every consumption emits an attributable event that the summary, gauges, combat log, *and the Phase-1 decision telemetry* render. One event mechanism serves both presentation and evidence. Generic lifecycle primitives stay small; thematic meaning lives in explicit producers/consumers/receipts, never in the substrate. Deck physics (Aeon's End's no-shuffle discard order — kb:aeons-end) is noted as a differentiation axis a future theme could own; **hypothesis only**, not roadmapped.

**Vocabulary rule (R5):** the split must not mint keywords. Clocks render as badges on *existing* keywords (POISON's clock is part of POISON's gloss); a new registry row still requires the ~3-carrier bar and owner ratification per the atlas row policy.

**UI contract:** every clock is a glyph badge; every theme currency has exactly one gauge (the phase-28 Premise track is the shipped precedent); every consumer previews its payoff before commit (rupture preview exists engine-side — the pattern generalizes). Registry vocabulary only; the card-face honesty guard extends to gauge labels.

**Migration:** additive fields with defaults reproducing today's behavior (`clock: 'phase-boundary'` = status quo), so the whole library compiles unchanged on day one; the slice moves only Erosion's species onto proven clocks; pricing re-derives per WS3.3's lifetime-walk method; editor schema updates in the same change (alias coupling); no barrel renames until Phase 9.

---

## 12. Truthful preset registry (corrections recorded; the registry file itself is not edited by this planning task)

| Preset | Registry file says | Truth per T's latest authority | This plan |
|---|---|---|---|
| Erosion | Player audited; held out of the queue | **Stale — NOT audited or player-audited; wording/mechanism audit due** | Honesty audit runs now (Phase 3a, honesty lane); slice *implementation* (Phase 3b) waits for Grace to close or T to transfer the slot — the active-plan law forbids smuggling a tuning plan through the word "slice" |
| Grace | Planned (sole slot) | Correct; calibration freeze provisional; marker stale at `13b58c8d` | Slot preserved; Tasks 2/3 are its next legitimate work; its closure (or explicit T transfer) is Phase 3b's gate |
| Oratory | Audited (evidence predates hand-size/combat changes) | Correct as written | Reproduce before any adjustment (its own rule) |
| Foundry, Penitent, Standstill, Augury, Tithe, Bastion, Refrain | Untouched | Correct | Enter via Phase 8 sequencing; borrowed cards re-judged under the teaching test |

The one-active-tuning-plan law stands. The registry file's Erosion entry must be corrected in a future commit outside this planning task.

---

## 13. Enemy framework

Principles (Judge-ratified, Pass 2 + KB-backed): **counters tax timing, sequencing, or resource commitment before they delete stacks; immunity is the last resort; a counter creates a decision, not negates a deck.** Legible intent throughout (Spirit Island: threat staged into visible phases turns danger into responsibility — kb:spirit-island/scout-report).

- **Tier 1 (normals):** deterministic telegraphs, no counterplay — they teach the grammar. Present state adequate (verified at source, §6.6).
- **Tier 2 (elites):** one counter verb each, *telegraphed as a rung* so the player can play around it, ordered by the tax hierarchy: timing taxes (cauterize windows the player sequences around — the tested spec-29 shape, which sheds one affliction and never the last), sequencing taxes (OBJECTION/Premise-shed: the case gets attacked, the player defends the build), commitment taxes (SWAY-cleanse, rung-regrowth: re-invest or pivot). Stack deletion only where a readable window makes it a fair race; blanket immunity nowhere.
- **The slice triangle (Phase 3b):** one **race** (punishes slow setup), one **cleanser with a readable window** (taxes timing), one **converter** (makes excessive stacking dangerous without making affliction irrelevant — over-commitment becomes risk, not waste).
- **Tier 3 (bosses):** counter verbs + the boss escalation clock + authored befriendability/resolution content. The slice boss is Erosion-native and tests grammar under pressure; Coastal Tyrant remains the authored mercy encounter (Phase 7). A boss that ignores a status class outright fails the decision test.
- **Instrumentation:** a per-enemy difficulty map (Phase 2b) so walls like King of Revenge are authored, not accidental.

---

## 14. Mobile and editor contracts

Unchanged laws: rules/state/RNG in mechanics only; presenters pure `(state) → ViewModel` (verified: `combat-encounter.engine.ts`); effect ids never renamed for player text — mapped in `state/combat/keywords.ts`; VITAE/STANCE copy canon; real-units-or-no-number on faces; no hex literals or hardcoded copy in components.

Additions this plan imposes: (1) every substrate clock and theme gauge ships with a presenter + guard test in the same phase as its engine change; (2) the editor validates authored cards against the keyword registry and pricing lint before write (after Phase 0 physically confirms the package); (3) any `@mechanics` surface change verifies all three packages in one change (bearings' alias warning as the enforcement hook); (4) the Skills→Cards deprecated aliases survive untouched until Phase 9; (5) decision-telemetry events (§11 receipts) are presentation-consumable — the combat log and summary render them, so evidence and player legibility share one mechanism.

---

## 15. Evidence diagnosis

What the harness does well: commit-stamped baselines, seeded determinism, kill conditions, adversarial skeptic verification, and the asterisk discipline that caught four farm-era directional inversions (rebaseline §4). Defects and gaps, in repair order (all Phase 1 unless noted):

1. **Draft-scorer starvation** — six verdicts blocked, and the mid-game acquisition path it models *is* the progression system (F-6).
2. **No preset-injection witness** — preset-phrased gates unwitnessable (F-7).
3. **Pool-shuffle artifact** — matrix deltas unattributable; per-card telemetry must be primary (F-8).
4. **No receipts pipeline** (F-20) — no objective receipts, no deterministic analyzer for candidate decision moments; statusEngagement alone is a warning light that cannot distinguish "more applications" from "more decisions."
5. **No defend-context receipts** (F-20) — P-DEFEND is unjudgeable without the objective context at play time (forecast severity, guard/resource delta, heart tokens, Befriend availability); motive stays with the human audit.
6. **No strong-policy witnesses** (F-20) — without them, "late 0%" cannot distinguish *unwinnable* from *unwon*; they lead Phase 2's diagnosis. "Ceiling" is not claimed absent an exhaustive solver.
7. **No mercy-capable policy** (F-5/F-20) — an entire alt-win path unwitnessed (Phase 7).
8. **No per-enemy difficulty map** (Phase 2b).

The standing law extends: **no redesign phase is judged on pre-repair instruments**, exactly as no gate is judged on pre-Phase-26 numbers today.

---

## 16. Decision matrix

| Decision | Options | Ruling / recommendation | Why | Authority |
|---|---|---|---|---|
| Overall model | A recalibrate / **B grammar consolidation** / C worldview combat | **B**, degrading per-field to A under the restraint law; C's resolution-grammar *question* (not unification) as the one named hypothesis | B attacks the shared root of F-2/3/10/16; restraint law prevents speculative schema; C unpriceable pre-slice | T ratifies model |
| Mid/late diagnostic order | (was: thresholds+composition first) | **RULED (Judge Pass 2/3): strong-policy witnesses → enemy composition (+ lifecycle) → fixed thresholds + escalation timing → global scalars last**; blind-policy 0% ≠ no competent line; no artificial late rescue (kb:heat) | Priors explicit enough to challenge, cheap enough to kill | **T gate on any global lever** |
| Policy-witness naming/strength | one 2-ply "ceiling" bot / **two strong-policy witnesses** | **RULED (Judge Pass 3): theme-native + bounded visible-information lookahead; "ceiling" reserved for exhaustive solvers; never expected-player** | Agreement raises confidence; disagreement exposes policy sensitivity | Judge (Pass 3) |
| Decision evidence | engine "decision events" / **objective receipts + deterministic analyzer + human audit** | **RULED (Judge Pass 3): the engine emits facts, never motives; analyzer classifies candidates; humans judge perception/motive** | The engine does not know why a person acted | Judge (Pass 3) |
| Grace slot | provisional freeze counts as closure / **remains open** | **RULED (Judge Pass 3): open — Task 5's final freeze requires the plan executed and verified; Tasks 2/3 are next** | Administrative hunger is not evidence | Judge (Pass 3) |
| Slice preset | erosion / grace / oratory | **Erosion** — honesty audit now (3a); implementation gated on Grace closure or slot transfer (3b) | Its audit is due; affliction is the grammar 8/10 collapse into; the active-plan law holds | Judge (Pass 1 + Pass 2) |
| Slice boss | Coastal Tyrant / **Erosion-native boss** | **RULED (Judge Pass 2): Erosion-native.** Mercy tested separately against Coastal Tyrant | One slice testing two doctrines creates an uninterpretable failure; shared infrastructure yes, shared verdicts no | Judge (Pass 2) |
| Phase-4 acceptance bands | pre-ratified / **ratified inside the Phase-2 memo** | **RULED: inside the memo.** Starter-deck curve stays doctrine; mechanism bands derive after the locus is known | "Numbers chosen before diagnosis become superstition with decimals" | Judge (Pass 2) |
| Status success metric | statusEngagement target / **decision telemetry + engagement as warning light** | **RULED: decision telemetry primary** | Inflating applications without decisions is failure | Judge (Pass 2) |
| Signatures | keep generic / reprice only / **theme rites + neutral universals** | Theme rites | F-4 is identity *and* balance failure; KB prior art (Aeon's End breach gating) | T sign-off on catalogue |
| Vocabulary | grow for depth / hold / **reduce-and-sharpen** | Reduce | Judge directive; TICK retirement + COLOR_MATCH fold-in first candidates | Owner-ratified path exists |
| Legacy debt | one grand cleanup / **split: ghosts early, barrel late** / defer all | Split | Don't reason against ghosts; don't gate learning on a semver-major | Judge (Pass 1) |
| Mercy evidence | human-only / **sim witness + human audit, independent verdict** | Both halves, decoupled from the slice | Reachability is provable; feel is not; verdicts must be interpretable | Judge (Pass 1 + 2) |
| Color Law | keep / relax | **Keep**; borrowed cards additionally pass the teaching test | Load-bearing identity; color arithmetic alone is not teaching | Judge (Pass 2); T if ever relaxed |

---

## 17. Risks

1. **The active-plan gate stalls the critical path.** Phase 3b waits on Grace, whose current verdict is "calibration freeze, provisional" — if a freeze doesn't count as closure, the slice has no schedulable start (§19 Q1). Mitigation: Phases 0–2 and 3a are all ungated and substantial; the question is posed now, not discovered later.
2. **Instrument-first sequencing stalls visible progress.** Mitigation: Phase 3a ships player-visible honesty value immediately; Phase 1's decision telemetry doubles as player-facing receipts.
3. **The Phase-2 memo indicts thresholds or the escalation clock — doctrine-adjacent territory.** Mitigation: the T gate is structural; the memo proposes, T disposes.
4. **Schema migration breaks the three-package coupling.** Mitigation: restraint law shrinks the surface; additive-with-defaults; single-change migration; all three verify gates; editor layout physically confirmed in Phase 0 first.
5. **The slice succeeds locally but doesn't generalize** (Erosion is the easiest theme to make legible). Mitigation: Phase 8 re-runs the ten-theme matrix per wave; the harvest/bulwark deep reworks are pre-specced independently.
6. **Strong-policy witnesses reinterpret history.** Both named witnesses re-baseline before judging changes (the F-15 discipline); their results are labeled by witness and never presented as expected-player performance.
7. **Receipt telemetry gets gamed** — mechanics designed to emit more objective receipts without creating more decisions. Mitigation: the deterministic analyzer identifies only candidate moments, and P-DECIDE remains paired with the human audit's explanation-accuracy check; telemetry corroborates humans, never replaces them.
8. **Vocabulary reduction confuses existing players.** Mitigation: renames follow the Phase 29 pattern — presentation-layer, guard-tested, glossary-backed.
9. **The mercy witness proves unreachability**, forcing an economy change mid-roadmap. Mitigation: that is the witness doing its job; the change would be scoped and T-gated — and because the mercy verdict is independent, it never blocks the slice.
10. **Doc/atlas drift misleads later phases** (F-17/F-19 caught doc-vs-source drift within four days of the docs' writing). Mitigation: every phase re-verifies its load-bearing claims at source before acting — this plan's own verification pass is the template.

---

## 18. Dialogue record (attribution)

Compact record of positions across the passes; the body above is the merged, governing text.

| Topic | Fable, Pass 1 | The Judge, Pass 2 (governing) |
|---|---|---|
| Slice boss | Coastal Tyrant — one slice witnesses grammar + mercy | **Erosion-native boss**; mercy separately vs Coastal Tyrant; shared verdicts forbidden |
| Diagnostic prior | Thresholds + composition before global scalars | **Instrument validity → strong-policy witnesses → composition → thresholds/escalation → global scalars last**; blind 0% ≠ no line |
| Erosion audit vs Grace slot | Audit parallel to Grace ("honesty is not tuning") | Upheld — and extended: slice *implementation* waits for Grace closure or explicit T slot transfer |
| Status success metric | P-STATUS (theme-engine damage share) + statusEngagement | statusEngagement is a **warning light**; measure the five meaningful-decision classes; applications without decisions = failure |
| Defend | (not gated in Pass 1) | Slice must prove the three-reason defend doctrine; always-correct bunker is red regardless of win rate |
| Corpus claims | "No game in the KB corpus…" | "**No surveyed KB title currently evidences…**"; corpus absence ≠ world absence |
| Borrowed preset cards | Judged as teaching support | Formal **teaching test**: color-compliant borrows that obscure grammar are design debt |
| Enemy counters | Decision-not-negation; intent before immunities | Sharpened: **tax timing/sequencing/commitment before deleting stacks**; immunity last resort; slice triangle = race / windowed cleanser / converter |
| Schema | Substrate/grammar split, additive migration | **Restraint law**: field only when the slice needs it and a deterministic test proves inexpressibility |
| Abort law | Vocabulary/turn-length up without engagement/branching/comprehension up → reject | Restated on the new metrics: turn time or vocabulary up while **meaningful decisions and player explanation accuracy** fail to improve → reject |
| Phase-4 bands | Proposed numeric bands, ratification deferred | Ratified **inside the Phase-2 memo**; pre-diagnosis numbers are "superstition with decimals" |
| Model C | Resolution-grammar unification as named hypothesis | Memo may **ask**, must not assume unification; deliberate asymmetry may be required |
| Pass-3 verification | Close labeled gaps | Yes, bounded: editor, foretell UI, architecturally-weighted KB claims only — no endless survey |

---

## 19. Fable's Pass-2 questions — resolved by the Pass-3 rulings below

(Compact attribution: Q1 freeze-as-closure — **overruled**, Grace remains open; Q2 engine-emitted decision events — **reshaped**, objective receipts + deterministic analyzer + human audit, never motive events; Q3 2-ply "ceiling" — **overruled on naming and count**, two strong-policy witnesses; Q4 defend-context tag — **accepted minus `befriend intent`** unless explicitly staged; Q5 honesty-lane projection fixes — **accepted**, payload changes excluded.)

## 20. The Judge — Pass 3 rulings (governing)

1. **Grace remains open.** Its live verdict is `Calibration freeze, provisional`, and the same paragraph names Task 2 policy/enemy decomposition and Task 3 card-economy audit as the next legitimate work. Task 5 permits a *final* calibration freeze after the plan is executed and verified; the present provisional marker does not satisfy that condition. Erosion's implementation waits, or T explicitly transfers the slot. Administrative hunger is not evidence.
2. **Emit objective receipts, never “decision” or motive events.** The engine may emit facts such as setup applied, setup consumed, payoff resolved, enemy counter triggered, cleanse opportunity presented/taken, forecast damage at defend time, resource state, heart-token state, and Befriend availability. A deterministic analyzer may classify candidate meaningful-decision moments from those facts. Human audit determines whether a player actually perceived and made the decision. The engine does not know why a person acted.
3. **Do not call a 2-ply bot a ceiling.** Build at least two named strong-policy witnesses: a theme-native deterministic policy and a bounded lookahead policy using only player-visible information. Agreement raises confidence; disagreement exposes policy sensitivity. Call them `strong-policy witnesses` unless an exhaustive solver establishes a true ceiling. Never present either as expected-player performance.
4. **P-DEFEND uses objective context plus human reason.** Emit forecast severity, guard/resource delta, heart tokens, Befriend availability, and chosen action. Do not emit `befriend intent` unless the player explicitly selected or staged a Befriend preparation action. Sim evidence may classify contexts; only a human audit may claim motive.
5. **Honesty lane includes projection and copy corrections, excludes payload changes.** A projection fix may touch mechanics-owned projection code if it changes no rules payload and lands with truth-surface tests. Any discovered payload defect is recorded for the later balance/implementation lane.

### Final-pass instructions

- Physically verify `axiomancer-card-editor` rather than relying on bearings.
- Verify whether FORETELL is currently visible and truthfully explained in mobile.
- Deepen only KB claims carrying architectural weight, especially prepared-action timing and anti-alpha/heat pressure; retain exact source ids.
- Replace “ceiling” terminology throughout unless the evidence is exhaustive.
- Preserve the distinction between objective engine receipts, analytical classification, and human judgment throughout the roadmap, schemas, tests, and acceptance gates.
- End with a compact list of unresolved T decisions rather than manufacturing closure.

(Pass-3 verification status: card editor physically verified; FORETELL card explanation verified honest; **still incomplete and labeled, not pursued**: a combat foretell-*result* surface, and specs 25/32 read via `docs/combat.md` rather than the spec files.)

### The Judge — final disposition

This document is accepted as the governing redesign **decision brief**, not as blanket implementation authority. The first executable combat-system move remains Grace Tasks 2/3 and instrument repair; Erosion may receive its honesty audit, but no Erosion balance/slice implementation begins while Grace remains open unless T transfers the slot. The Pass-3 bail preserved the artifact but left the requested anti-alpha/heat KB deepening incomplete; therefore `kb:heat` remains suggestive prior art, not a load-bearing justification, until its exact source path and evidence ids are verified. No global scalar, effect-schema expansion, signature-catalogue replacement, or preset-slot transfer proceeds without the T gates named below.

## 21. Unresolved T decisions

1. **The Grace slot.** Grace is open (Pass-3 ruling). Does T let Grace Tasks 2–5 run to a final verdict, or explicitly transfer the active preset slot to Erosion's slice? *Recommendation: run Grace Tasks 2/3 next; transfer only if Grace stalls without new evidence.*
2. **Model ratification.** Adopt Model B (grammar consolidation under the schema restraint law, degrading per-field to Model A), with Model C's resolution-grammar *question* as a post-slice memo that must not assume unification. *Recommendation: ratify Model B as scoped.*
3. **The Phase-2 global lever.** Whatever the diagnosis memo names, its application is T's call. *Recommendation: approve only levers that raise the player ceiling of possibility, never artificial late rescue (kb:heat receipt); ratify acceptance bands inside the memo.*
4. **Signature catalogue replacement (Phase 5).** Theme-authored rites; neutral read/reroll/recover retained. *Recommendation: approve, with the >10pp per-theme abort clause.*
5. **DoT clock semantics at slice spec sign-off.** Direction owner-ratified 2026-07-10; exact triggers must pass the restraint law's inexpressibility test per field. *Recommendation: confirm the Dawncaster-shaped triggers (POISON per-card-played, BLEED per-damage-instance, MARK on-payoff) as specced, one clock per family.*
6. **Barrel migration timing (Phase 9).** Semver-major Skills→Cards reconciliation across all three packages. *Recommendation: approve only after wave-2 grammar is proven; one change, three packages, aliases removed.*
7. **Registry correction commit.** `preset-rework-status.md`'s stale Erosion entry. *Recommendation: correct it at that file's next legitimate edit, citing T's authority statement recorded in this plan.*

---

How should Axiomancer’s entire combat ecosystem—from core rules and action economy through effects, cards, preset decks, enemies, progression, UX, and evidence harnesses—be redesigned or improved to become more strategically expressive, legible, balanced, maintainable, and distinctly Axiomancer, using the game knowledge base as cited prior art while remaining implementable in the current monorepo?
