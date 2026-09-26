# Critique log

> Last pass: 2026-09-26 at commit 5d6eca56
> Pass count: 54

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

> **[critique pass 51, 2026-09-25, commit e073bb6e] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set (title, onboarding, combat preview,
> live combat-board, exploration hub, dialogue, village, cutscene,
> rest, hazard, late-game hub) — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot directly across both
> viewports. This pass lands right after the T2a trim merge
> (`cb178978`/`e073bb6e` — legacy d20 pipeline + derived-stats cut) and
> its CI-repair follow-up; confirmed no visible regression from that
> work on any of the 11 screens. Previously-filed candidates
> reconfirmed unchanged and not re-filed: the village "Void
> Essence"/"Heart Draught" wearer wording (pass 41, still Pending), the
> dialogue reply-card label echo ("WHAT NEEDS DOING?"/"LEAVE HIM BE.",
> still Pending), the mobile and desktop combat-board's DoT paid-value
> chip mid-token wrap (`SPOILED POULTICE` → "8/p"/"ay", pass 49, still
> Pending; desktop `THE LONG LENT` "Deal 14" chip also still wraps at
> the same card width), the late-game hub's faint unlabeled desktop
> oval (declined per pass 34/39/40, still ambiguous). The relics'
> description-repeats-signature-name pattern (e.g. Gorgon Brand: "A
> blade that turns the argument to stone. Grants The Stilling.") was
> checked against `relic.library.ts` and confirmed to be the
> deliberate house format across all 11 relics, not a copy bug — not
> filed. Zero fresh findings this pass.

> **[critique pass 52, 2026-09-25, commit 2a484f98] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5,
> `CRITIQUE_VIEWPORT=both`), mobile (375×812) and desktop (1280×800),
> against the full 11-screen set — 22 captures, 0 nav trouble, 0
> console/page errors. Read every screenshot directly across both
> viewports. This pass lands 40 commits after pass 51 (e073bb6e), which
> is entirely the T2a-tail through T5 trim/archive cycle (dead-code and
> stale-doc removal, the Upgradeable-Dice flag collapse, a combat dice
> off-color CI fix, GLYPHS-pilot and Codex-aesthetic cuts) — no surface
> under critique's screen set was touched by any of it, and none shows
> a regression. Previously-filed candidates reconfirmed unchanged and
> not re-filed: the village "Void Essence"/"Heart Draught" wearer
> wording (pass 41, still Pending), the dialogue reply-card label echo
> (still Pending), the mobile/desktop combat-board DoT paid-value chip
> mid-token wrap (pass 49, still Pending), the late-game hub's faint
> unlabeled desktop oval (declined per pass 34/39/40, still ambiguous),
> and the relics' description-repeats-signature-name pattern (confirmed
> deliberate house format, not a bug — pass 51). Zero fresh findings
> this pass.

> **[critique pass 54, 2026-09-26, commit 5d6eca56] Unattended `/march`
> tick.** `critique:drive` (`CRITIQUE_VIEWPORT=both`), full 11-screen
> set: 22 captures, 0 nav trouble, 0 console/page errors. First pass
> since map revamp M3a moved the new-game start to the Breakwater. The
> title screen copy was never updated for that move (filed MED). Also
> filed LOW: the combat preview prints the opening tell twice.
> Reconfirmed and not re-filed: the DoT chip mid-token wrap (pass 49,
> Pending), the late-game hub's faint desktop oval (declined), and the
> painted "AxiomanceR" wordmark (waits on new art, per bearings).

> Earlier pass banners (passes 13-50) and two 2026-07-18 residue notes are archived verbatim in `plan/archive/CRITIQUE_2026.md`.

## Pending

### [MED] title — the title screen still promises the fishing village, but a new game now opens on the Breakwater
- pass: 54 (commit 5d6eca56)
- viewport: both (375×812 and 1280×800)
- category: comprehension
- observation: the first screen a player sees ends with the line "Your
  path begins in the fishing village, where travelers gather before
  venturing into the realms beyond." Since map revamp M3a (`dd204684`,
  D27) a new game starts on the Breakwater, "a walled harbour on a storm
  coast" whose start node is a windmill. The fishing village is now only
  reachable later, across the river bridge. So the title makes a promise
  the next screen breaks, at the moment a first-time player is building
  their picture of the game. The line is also hardcoded in the component,
  which breaks the package rule that player-facing copy must not be
  hardcoded in components.
- evidence: `axiomancer-mobile/components/TitleScreen.tsx:104-105`
  (literal JSX string); `.critique-artifacts/{mobile,desktop}/01-title.png`
  and `01-title.txt`; `axiomancer-mechanics/src/World/Continents/Coastal-Village/breakwater.ts`
  (header: "A new game starts here (D27)").
- suggested fix: derive the line from the engine's `STARTING_MAP`
  definition (its name/description), or at minimum reword it to the
  Breakwater and move it out of JSX into the copy module the rest of the
  title uses, so the next start-map change cannot make it stale again.
- source: critique-drive (unattended, §3.5)

### [LOW] combat — the pre-fight preview prints the foe's opening tell twice, word for word
- pass: 54 (commit 5d6eca56)
- viewport: both (375×812 and 1280×800)
- category: comprehension
- observation: on the "A FOE BARS THE WAY" preview, the Brine Hag's
  quote under its portrait ("They have heard kinder sermons than yours,
  and drowned anyway.") is repeated verbatim in the expanded PHASE 1 row
  as "🜲 stance hidden — They have heard kinder sermons than yours, and
  drowned anyway." The header quote is the current phase's `stanceHint`,
  and phase 1 is open by default, so every fight's preview repeats
  its opening tell. The second copy reads like a layout bug, and it
  buries the one piece of new information in that row (that the stance
  is hidden).
- evidence: `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:816`
  (header renders `vm.enemy.stanceHint`) and `:861` (phase row renders
  `p.stanceHint`); `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1532`
  (`vm.enemy.stanceHint` = the current phase's hint);
  `.critique-artifacts/mobile/03-combat.{png,txt}`.
- suggested fix: in the phase row, drop the hint when it equals the
  header's (show only "🜲 stance hidden"), or drop the header quote once
  the threat sequence renders the per-phase tells.
- source: critique-drive (unattended, §3.5)

### [LOW] combat — a DoT's paid-value chip word-wraps mid-token on the small hand-card face ("8/play" → "8/p" / "ay")
- pass: 49 (commit 94b6b96f)
- viewport: both (375×812 and 1280×800) — reproduces at both, worse on
  desktop where the card is otherwise unobscured by the fan overlap
- category: visual
- observation: on the small (non-inspect) hand-card face, a card whose
  paid clause is a DoT (e.g. Spoiled Poultice's POISON) renders its
  value chip as `${perTick}${unit}` (e.g. "8/play"). The chip's `Text`
  allows `numberOfLines={2}` at small size, and the container is narrow
  enough that RN's default word-break wraps *inside* the token instead
  of at the "/" — "8/play" breaks to "8/p" on one line and "ay" on the
  next, reading as a rendering glitch rather than the intended "8 per
  play" tick. The keyword line above it clips to "POIS" for the same
  reason. Short values ("+8", "12", "+5") never hit this because they
  fit on one line; only the longer DoT tick strings do.
- evidence: `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:2161-2170`
  — `paidValue` `Text` with `numberOfLines={large ? 1 : 2}`, `styles.paidValue`
  has no `maxWidth`/break-word override (line 2520); `axiomancer-mobile/state/presenters/combat-encounter.engine.ts:2729-2738`
  `clauseValue()` builds the DoT string as `${c.dot.perTick}${unit}${clock}…`
  with `unit` one of `/play | /hit | /payoff | /turn` — no non-breaking
  join between the number and the unit. Reproduced via `critique:drive`
  pass 49, screen `combat-board`, both viewports, card "Spoiled Poultice"
  in a 5-card hand (`.critique-artifacts/{mobile,desktop}/04-combat-board.png`).
- suggested fix: join the number and unit with a non-breaking space (or
  `wordBreak: 'keep-all'`/`hyphenationFrequency: 'none'` at the RN-web
  layer) in `clauseValue()`, or cap the chip at `numberOfLines={1}` with
  `adjustsFontSizeToFit` like the paid-apply line above it (line 676)
  so a too-long value shrinks instead of wrapping.
- source: critique-drive (unattended, §3.5)

### [MED] combat — the only SUMMON carrier cannot reach wave 2, so half the spawn rule is dead on the roster
- pass: burn-day audit 2026-09-19 (row 3.9)
- viewport: n/a — engine reach, not layout
- category: design-reach / coverage
- observation: Phase 102 shipped SUMMON with a two-wave rule: wave 1 at the
  first phase boundary, wave 2 only at a boundary where a STAGE fires. The
  roster's sole carrier is The Jeweled Tree, an elite. Elites get no stages
  — `defaultEnemyStages` hands its two-stage floor to bosses and uniques
  only — and the tree authors none, so it can never enter a stage, so the
  only door to wave 2 never opens. `ADD_WAVE_CAP = 2` is live engine and
  dead roster: a player can meet the brood, but never the second wave. It
  is not an engine bug; the rule is correct and tested. The tests simply
  never asked a shipped enemy.
- evidence: `axiomancer-mechanics/src/Enemy/enemy.library.ts` — `JeweledTree`
  is `difficulty: 'elite'`, `keywords: [hide 5, summon 2]`, no `stages` key;
  `Enemy/index.ts` — `stages: stages ?? defaultEnemyStages(difficulty, …)`,
  which returns `[]` for anything that is not a boss or unique;
  `Combat/combat.engine.ts` — `ADD_WAVE_CAP = 2`, and `processBetweenPhases`
  gates every wave after the first on `stageFiredNow`. Driven against the
  real library enemy over eight phase boundaries, damaged past 50% VITAE and
  undamaged, `addWavesSpawned` tops out at 1. Counterfactual, same harness:
  `RawheadRex` with SUMMON 2 reaches wave 2/2 at its `vitaePct: 0.6` stage.
  `summon` appears in no branch of `defaultEnemyKeywords` and nothing
  outside the library calls `createEnemy` in production, so no other shipped
  foe carries it. Every SUMMON suite builds its own foe:
  `Combat/e2e/summon.engine.test.ts` uses `makeEnemy({ keywords, stages })`;
  `axiomancer-mobile/state/e2e/summon-surface.engine.test.ts` retrofits
  `createMockEncounterEnemy()`.
- suggested fix: a second carrier that has `stages` — the audit's §8 Block 2
  item 2, a one-keyword retrofit on `RawheadRex` or `Mirac`, both already in
  the mid-stage matrix roster beside the tree. `RawheadRex` is the better
  data point: its `UP FROM UNDER THE STAIRS` stage grants SWIFT at the same
  boundary that would fire wave 2, so the SWIFT path row 3.2 fixed gets
  exercised on a real foe. Two gates first — row 3.2 must be in (it is), and
  the deck-matrix baseline must be re-stamped in the same tick naming both
  causes (Phase 102 risk row 8), since the trade moves a rostered mid-profile
  foe. Ship it with a guard that sweeps `EnemyLibrary` for SUMMON carriers,
  opens a real encounter, damages the foe past its stage threshold and
  asserts some carrier reaches `ADD_WAVE_CAP` — reachability only, no
  magnitudes, so retunes leave it alone. Explicitly rejected: authoring
  `stages` onto the elite carrier (it repeals the boss/unique stage floor
  for the whole roster) and loosening `stageFiredNow` to a round or
  emptiness check (the engine comment refuses the emptiness check by name —
  it makes the player's own clear cause the respawn).
- source: burn-day audit 2026-09-19

### [MED] exploration — a reload taken DURING a live encounter still lands past the fight
- pass: burn-day audit 2026-09-19 (row 3.1 fix, residual)
- viewport: both (375×812 and 1280×800) — the loss is in persistence, not
  layout; on web it is one browser reload away
- category: progression / persistence
- observation: row 3.1 closed the reload-during-the-PRELUDE hole — an
  arrival the player never answered is now re-offered on the next mount,
  because the node's absence from `consumedNodes` is the debt and
  `consumedNodes` rides the save. But `consumedNodes` marks "the MapEvent
  resolved", i.e. "the prelude was shown", not "the fight ended". The
  moment the player commits to the fight, `beginHazardEncounter` clears
  the event slice and the hazard-pattern combat runs in the panel's local
  React state, while the node is already consumed. A reload from there
  rebuilds the app standing past the encounter, its onward edges open,
  with no fight pending and nothing owed — the same player-visible loss as
  row 3.1, one step later. It bites hardest on a boss node, where the walk
  back is longest.
- evidence: `axiomancer-mechanics/src/World/MapEvents/resolve-map-event.ts`
  (`markNodeConsumed` runs at resolve time, on every non-travel path);
  `axiomancer-mobile/state/actions.ts` `beginHazardEncounter` (clears the
  event slice, then `startCombat`); `axiomancer-mechanics/src/Game/store.ts`
  — the persisted payload destructures `currentEncounter: _drop` with the
  standing comment "encounters re-roll on load (Spec 07)", so no live fight
  is ever written; the panel's own turn state is not in the store at all.
- suggested fix: two shapes, and the choice is a design call, not a
  mechanical one. (a) Defer `markNodeConsumed` until the encounter settles
  (victory / flee / defeat) so the existing `arrivalPending` re-offer
  covers the fight too — smallest change, but it makes "consumed" mean
  "answered" and every other consumer of that field has to agree. (b)
  Persist enough to rebuild the fight (foe id, the encounter's seed, the
  node) and re-enter the panel on load — truer to the player's experience,
  and it contradicts the Spec 07 "encounters re-roll on load" note, which
  would need reopening first. Do NOT ship (a) and (b) together.
- source: burn-day audit 2026-09-19

### [LOW] village / items — two consumables use "wearer" language for items the player drinks, not wears
- pass: 41 (commit 6a804a02)
- viewport: mobile and desktop (both render the same source text)
- category: comprehension / voice
- observation: `axiomancer-mechanics/src/Items/consumable.library.ts`
  describes two `category: 'consumable'` items as affecting "the
  wearer" even though both are drunk: `void-essence` ("A vial of
  substance that refuses to be observed. Drinking it leaves the
  wearer slightly insistent and intensely present.", line 147-148) and
  `heart-draught` ("A warm draught that quickens the wearer's
  convictions.", line 78). Every other consumable in the file
  describes an effect on the drinker/self, not a "wearer" — this reads
  as flavor text drafted from an equipment-item template and never
  re-worded for a drinkable. Live in the shop: Void Essence is sold at
  Glen Market (`wanderer-nf-village` fixture, confirmed in
  `07-village.png`/`.txt` this pass).
- evidence: `axiomancer-mobile/.critique-artifacts/{mobile,desktop}/07-village.png`;
  `axiomancer-mechanics/src/Items/consumable.library.ts:78,147-148`.
- suggested fix: reword both descriptions to drinker-appropriate
  language, e.g. void-essence → "...leaves the drinker slightly
  insistent and intensely present"; heart-draught → "...quickens the
  drinker's convictions". Data-only text edit, no effect/wiring change.
  Equipment/consumable-lifecycle territory (`/adjust-equipment`).
- source: loop

### [MED] ui-fresh-eyes SWARM 2026-09-12 — the 309-row candidate set is drained
- pass: swarm follow-up to the 2026-09-12 sweep, run from
  `plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes-swarm.prompt.md`
- viewport: 375x812 and 1280x800
- auth_state: fixture-booted, static preview export (no Docker in the container)
- category: meta
- observation: every one of the 309 candidate rows that sweep #301 left
  unverified now carries a disposition. The rows collapsed to 187 semantic
  clusters; 149 reached a three-lens adversarial panel; 30 findings shipped as
  `FE-029`..`FE-058`, one genuine scope wall remains open, and the rest were
  refuted, already fixed by #301, settled by an owner decision, or were capture
  harness artifacts. Two regression readers then found ten regressions the sweep
  had caused itself, and a repair fleet closed all ten. Two harness facts worth
  carrying forward: the capture driver dismisses the combat tutorial coach, so
  no screenshot shows a first-time player's first fight; and every cross-screen
  naming cluster was refuted on the ground that the competing senses never
  co-occur on one screen.
- report: `axiomancer-mobile/docs/reports/UI_FRESH_EYES_SWARM_2026-09-12.md`,
  row-by-row ledger alongside it as `.ledger.md`
- source: ultracode swarm run, 96 agents across five workflows, 0 errors

### [MED] ui-fresh-eyes sweep 2026-09-12 — 21 rows shipped, a large candidate set still open
- pass: dedicated UI fresh-eyes sweep (not a `/critique` pass — no 6-finding cap), plan/archive/2026-09-25-trim-t4/plan/2026-09-12-ui-fresh-eyes.prompt.md adjusted for ultracode
- viewport: 375x812 and 1280x800
- auth_state: fixture-booted, static preview export (no Docker, no dev server in the container)
- category: meta
- observation: a full 27-route x 2-viewport walk plus an eight-lens observation
  fleet. Twenty-one findings were verified individually and fixed in the same
  sitting, each with a guarding test and a re-exported before/after capture —
  among them a raw float in a stat readout, engine slugs printed to the player,
  a character sheet whose grace and alignment were never wired to the state
  they read, a DERIVED table with three headers over two columns, and the six
  console errors the build has carried for several passes. Console is now clean
  at every captured cell. The sweep's own candidate set is much larger than
  what shipped and is NOT verified; the report keeps it separate on purpose.
  Full write-up, gate results, refuted rows and the deferred decisions:
  axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md, with the raw
  candidate table beside it in the same directory.

### [LOW] mobile — combat die/card-face components accrete hex literals against the AXM-token doctrine
- pass: combat declutter residue (PR #135, 2026-07-19)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: the package doctrine says "no hex literals (use AXM tokens)", but CombatDie's cube greys, the card face's scrim/rarity/glyph-pop colors, and HazardDie's palette all carry raw hex — the cube recut + glyph-pop pass (PR #135) extended an already-widespread pattern rather than fixing it.
- evidence: CombatDie.tsx (cube greys, rim colors), CombatBoard.tsx (READ_ACCENT, rarity colors, lighten/darken helpers), components/hazard/palette.ts.
- suggested fix: a token-hygiene pass folds the recurring combat/hazard colors into the AXM runtime palette; new code then has a token to reach for.
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)

### [LOW] mechanics — akrasia swap-pool cleanse-while-Fallen tension knob needs matrix eyes
- pass: swap-pool fan-out residue (PR #130, 2026-07-18)
- viewport: n/a
- auth_state: n/a
- category: content
- observation: `absolution-on-account` and `the-wound-that-teaches` (swap-akrasia) deliberately CLEANSE while Fallen — the state is checked at play time, then walked back. A real tension knob per the designer, but it can read as anti-synergy confusion in play.
- evidence: swap-pool fan-out report §needs-user-call; designer note in the akrasia pool file.
- suggested fix: when the swap-pool measurement pass runs, watch these two cards' usage + FALLEN uptime; if the matrix shows confusion (played then immediately un-Fallen with no payoff), redesign toward pay-then-cash ordering.
- source: /deck-tuning fan-out session

### [LOW] mechanics — fated-course engine hook survives its retired card as a test harness
- pass: D8 ship residue (commit 10ec4fe8)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: `combat.engine.ts` (~lines 4011/4059) still keys the telegraph-forcing hook on `fated-course`, retired from the library in D8's ten-in/ten-out ledger. Unreachable in live play (no preset/reward fields the card), but `oracle-omen-v2.engine.test.ts` depends on it as its deterministic telegraph harness — swapping the id would destroy the guaranteed-hit assertions.
- evidence: fixture-sweep report, 2026-07-18; plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-18-d8-preset-dice-valves.md §Residue
- suggested fix: next oracle pass ports the harness onto a live card or a test-only hook id, then deletes the dead engine branch.
- source: ship-a-phase D8

### [LOW] data — Card Ledger dashboard + preset-metrics exports measure the PRE-D8 decks
- pass: D8 ship residue (commit 10ec4fe8)
- viewport: n/a
- auth_state: n/a
- category: data
- observation: `docs/reports/preset-metrics/2026-07-18-*.json` and the Card Ledger dashboard were measured on the pre-valve flag-on decks (and a 70-card library that no longer exists — the dead ten are retired, ten valves are live). Their triage verdicts remain historically valid but the preset rollups no longer describe the shipped decks.
- evidence: D8 gate rerun already shows different curves (standstill 50→59 blind-early).
- suggested fix: re-run the accumulation (both arms, two seeds) + republish the dashboard after the post-D8 curve-repair phase lands, so the next triage reads the real game.
- source: ship-a-phase D8

### [LOW] general — AccessoryKind union must open when accessory flavors grow
- pass: user-jot (commit 4e045d05)
- viewport: unspecified
- auth_state: anonymous
- category: content
- observation: Equipment model confirmed with owner (2026-07-18): 5 worn slots (1 weapon / 1 armor / 3 accessories), accessories are flavor-free mechanically — but AccessoryKind in axiomancer-mechanics/src/Items/types.ts is a CLOSED union (`head|hands|feet|amulet|ring|charm`) that pure flavor must register in. Owner intent: accessories can be literally anything (a cape, etc.). When new accessory content lands, extending the union is a one-word additive change, no migration, nothing reads the kind. Not blocking anything today.
- evidence: user-spotted at 2026-07-18T19:40:08Z
- suggested fix: [user has not specified — iterate to determine]
- source: user

### [MED] ratified-exception HP arms bypass the damage-instance clock funnel
- pass: review-closeout 2026-07-12 (commit 4680e5e2, branch
  claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: design
- observation: the three spec 32 §12 ratified direct-HP exceptions — the
  `conclude` signature arm (Conclusion, per-stack), the `mercy` signature
  arm (Disarming Plea, flat magnitude; both `combat.signature.ts`, plain
  `applyDamage`), and the mercy-exploit strike
  (`selectEncounterMercyChoice` exploit branch, `combat.engine.ts`) —
  apply damage OUTSIDE the `applyEnemyDamage` funnel. Every status-gated
  payoff burst advances BLEED's WS3.2 damage-instance clock; these three
  hits do not, so a Conclusion cast or a mercy-exploit strike lands on a
  bleeding enemy without the bleed paying out. Ratified exceptions ARE
  allowed to differ from the funnel — whether they SHOULD feed the clock
  is a design call, not a bug fix, hence filed instead of changed.
- evidence: `combat.engine.ts` `applyEnemyDamage` doc comment ("the
  shared enemy-damage funnel"); `combat.signature.ts` conclude/mercy arms
  call `applyDamage` directly; the mercy-exploit branch likewise. The
  doctrine witness (`doctrine-strike-dead.engine.test.ts`) ratifies the
  three arms' RIGHT to chip HP (spec 32 §12) but nothing rules on their
  clock semantics.
- suggested fix: owner call under the spec 32 §12 framing — either (a)
  ratify "exception damage is clock-silent" as spec text (one sentence in
  §12, plus a witness pinning it), or (b) route the three arms through
  `applyEnemyDamage` so BLEED treats every enemy-HP hit uniformly. Do NOT
  change behavior without the ratification; (b) also changes Conclusion's
  effective damage against bleeds and needs a balance glance.
- source: adversarial code review (2026-07-12)

### [MED] WS9 reactive cleanse strips a whole merged instance — tension with the enemy-cleanse mitigation
- pass: review-closeout 2026-07-12 (commit 4680e5e2, branch
  claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: design
- observation: the WS9 reactive cleanse (`enemyCleanse` threat-branch
  payload, `combat.engine.ts`; prototype carrier Tri-Eyes,
  `combat.threat-sequences.ts`) removes one whole merged `ActiveEffect`
  instance in application order. Because same-id afflictions
  intensity-stack into ONE instance, a single cleanse can erase an
  arbitrarily tall stack — e.g. a poison the player spent three cards
  deepening — which sits in tension with the standing "enemy cleanse <
  cheapest DoT output" mitigation (the cleanse should never out-tempo the
  cheapest re-application). The guardrails are real (never the last
  affliction, telegraphed branch, at most once per sequence pass) but
  none of them bound the VALUE removed, only the count.
- evidence: `combat.encounter.types.ts` `enemyCleanse` doc; the
  `applyCleanse`-based shed in `combat.engine.ts` (WS9 reactive cleanse
  block); witness `threat-branches.engine.test.ts` ("cleanses exactly one
  affliction... never the last") asserts instance count, not intensity.
- suggested fix: propose intensity-SHAVING as the follow-up — the cleanse
  removes N intensity from the chosen affliction (washing it out only at
  0) instead of the whole instance, so the shed price stays comparable to
  one cheap DoT application regardless of stack height. Needs a design
  pass on N (flat 1? per-branch payload?) and a re-run of the WS9 branch
  witnesses; until ratified, the current whole-instance shed stands.
- source: adversarial code review (2026-07-12)

### [MED] engine hooks missing for two ratified-adjacent bridge shapes
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: engine-gap
- observation: two ratified-adjacent bridge shapes have no engine hook:
  (1) player-side affliction-expiry → Soul (the Soul economy counts
  ENEMY afflictions only), and (2) a rungs-denied ledger for
  STAGGER → REPRISE causality. Both bridge cards were shipped
  nearest-buildable instead; the killed bridges barbed-compliment and
  interest-on-the-flesh point at the re-homes.
- evidence: session A/B report + card notes in
  `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`.
- suggested fix: add the two hooks as small engine substrate items in
  the next engine phase, then revisit the killed bridge designs.
- source: session closeout

### [MED] UI-communication testing gap — sim evidence is text-blind
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: mobile
- category: process
- observation: the sim/evidence loop cannot see player-facing WORDING.
  The user caught a three-surface contradiction (keyword gloss vs
  detail modal vs card face) that no agent test covered — fixed in
  8c25374e, and this closeout fixed another (stale RUPTURE cap gloss
  in `axiomancer-mobile/state/combat/keywords.ts`), but the class is
  ungated.
- evidence: fix commit 8c25374e; the card-face-honesty guard test
  covers face formatting, not cross-surface numeric consistency.
- suggested fix: run a /deep-playtest pass post-merge focused on
  copy consistency, and add the WS9.3 "why did the enemy change
  plan?" question to the next /combat-playtest brief. Consider a
  guard test that derives every printed cap/constant gloss from the
  engine constants.
- source: user + session closeout

### [LOW] card-editor cannot edit the three new mechanic fields
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: desktop
- category: tooling
- observation: the card-editor UI has no inputs for the three mechanic
  fields added this session: `grant_pip.overflow`,
  `spend_all_pips.markPer`, and `synergy.statePredicate`. Cards using
  them can only be authored by hand-editing JSON/TS.
- evidence: `axiomancer-card-editor` form components lack the fields;
  the mechanics exist in `axiomancer-mechanics/src/Cards/types.ts`.
- suggested fix: add the three fields to the editor's mechanic form
  (enum/number/checkbox as appropriate).
- source: session closeout

### [MED] general — rethink early-game as canned preset-deck tutorial, defer deckbuilding to labyrinth choice
- pass: user-jot (commit 63cfb3ba)
- viewport: unspecified
- auth_state: anonymous
- category: design
- observation: for the early game / "child" levels, potentially remove the deck-building aspect entirely. Instead each battle is a canned tutorial introducing a new preset deck, teaching each mechanic in a controlled vacuum. Pre-maze gameplay is really just the tutorial: "build a boat" -> "sail to friend" -> "go to labyrinth". The labyrinth is when the player commits to which deck they want to start the game with, which dictates their reward offering for the labyrinth. When the player completes the labyrinth and lands in the new city, they gain the ability to switch base decks post-labyrinth and trade their current deck for a new mid-game deck (since during the labyrinth they earn card rewards focused on their current deck's theme).
- evidence: user-spotted at 2026-07-08T18:36:36Z
- suggested fix: [user has not specified — iterate to determine]. Related: build-plan Phase 17 (quest-board tutorial) was dropped via `/oversight` 2026-07-10 because its narrow scope overlaps this rethink — the correct next step is to route this design idea through `/iterate` or a design skill and re-derive any per-minigame tutorial phases from whatever it lands on.
- source: user

### [LOW] `web:container` dev-server script is broken
- pass: 1 (commit 6e23724a)
- viewport: n/a
- category: infra
- observation: `axiomancer-mobile/scripts/dev-server-container.sh`
  (`npm run web:container`) pulls Expo via `npx --yes expo start`
  inside a throwaway `node:20-alpine` container, which resolves a
  different/incompatible Expo CLI version than the repo's pinned
  one and fails immediately with `SyntaxError: Error reading Expo
  config at /app/app.config.ts: Unexpected token '{'`, exiting
  before it ever binds the port (`web:container:wait` then fails
  with "container is not running"). Worked around this pass by
  running `npx expo start --web --port 8081` directly on the host
  from `axiomancer-mobile/`, which uses the repo's already-installed
  Expo 54.0.35 and bundles cleanly.
- evidence: container log —
  `SyntaxError: Error reading Expo config at /app/app.config.ts`.
- suggested fix: pin the container's Expo CLI to the repo's
  installed version (e.g. run `node_modules/.bin/expo` from the
  mounted repo instead of `npx --yes expo`), or drop the container
  path in favor of the host-run command until fixed.
- source: critique pass 1

> Seeded 2026-07-03 from the retired `/archive` critique history —
> only the recurring *patterns* were carried; stale one-off rows
> were dropped. Each maps to category `external-critique`.

### [LOW] small hand-card face clips authored paid text at 3 lines
- pass: session 2026-07-17 (card-text work)
- viewport: mobile hand card (132×194)
- category: ui
- observation: authored paid sentences render up to 5 lines on the
  large/inspect face (`numberOfLines large ? 5 : 3`) but ellipsize at
  3 lines on the small hand card; longer rares (e.g. The Closing
  Word) are unreadable until inspected. May be acceptable (the owner
  doctrine says the overlay is the reading surface) — filed as an
  owner call, not a defect.
- evidence: `CombatBoard.tsx` OutcomeText numberOfLines.
- suggested fix: owner call — bump small-face lines to 4-5 (layout
  risk: name/glyph crowding) or keep 3 and accept the ellipsis.

### [LOW] aftermath — the parley "Heart Opens" reward panel is a pixel-art heart, style outlier
- pass: session-critic 2026-08-31 (Phase V8 closure `/critic-loop`
  screenshot pass, `axiomancer-mobile/screenshots/audit-2026-06/after/27-aftermath-parley.png`)
- viewport: 390x844 (audit-capture rig)
- category: visual / aesthetic cohesion
- observation: the "an accord" heart art is a chunky 16-bit pixel-art
  sprite, sharply out of style against the ink-woodcut/engraving art
  every other screen uses — reads as a placeholder that never got
  swapped when the Woodcut Codex direction landed.
- suggested fix: replace with a woodcut-style bleeding/sacred-heart
  illustration matching the engraving direction (candidate for a
  `/forge` art tick or the V-sequence's PixelEmblem carve-out review —
  confirm whether this is the intentional PixelEmblem exception before
  swapping).
- source: loop

### [MED] general — rebuild the retired tuning/playtest commands later
- pass: user-jot (commit cc26613c)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Rebuild the retired tuning/playtest commands (deck-tuning, hazard-tuning, world-tuning, combat-ux-tuning, critic-loop, deep-playtest, hermes-playtest, dep-upgrades — retired in trim T5, D10) once the mechanics settle: after the D4 stat hooks + damage-scaling formula and the card rework. Recover old doctrine with `git show c7de2d6d:.claude/commands/<name>.md`; rebuild fewer, merged loops, not eight.
- evidence: user-spotted at 2026-09-25T20:06:40Z
- suggested fix: [user has not specified — iterate to determine]
- source: user

### [MED] village / inventory — every signet relic's flavor text restates the auto-generated "grants X" line verbatim
- pass: 53 (commit 82bbf241)
- viewport: both (375×812 and 1280×800) — reproduces identically at both
- category: voice
- observation: a relic's shop/inventory row prints two lines: a mechanical
  subtitle auto-built by joining stat modifiers with `grants
  ${signatureName}`, then the authored `description` flavor text below it.
  All 11 signet relics' authored descriptions end with the exact same
  "Grants <Signature Name>." clause the subtitle already states, so the
  grant is printed twice back to back. In the Glen Market shop alone, 3 of
  the 5 visible stalls show it: Gorgon Brand — "GRANTS THE STILLING" /
  "A blade that turns the argument to stone. Grants The Stilling.";
  Coldglass Aegis — "+5 MAX VITAE · GRANTS READ THE ENTRAILS" / "See the
  blow before it lands. Grants Read the Entrails."; Gambler's Knot —
  "GRANTS PRESS FATE" / "Bend fate on the bad dice. Grants Press Fate."
  Reads as a copy-paste residue rather than authored flavor, unlike the
  non-relic consumables on the same screen (Minor Healing Potion, Clarity
  Serum), whose flavor lines say nothing the mechanical line already said.
- evidence: `axiomancer-mobile/state/presenters/village.engine.ts:222-228`
  builds the subtitle via `parts.push(`grants ${signature}`)`;
  `axiomancer-mechanics/src/Items/relic.library.ts` — all 11 `RelicSpec`
  rows' `description` end with "Grants <Name>." (lines 69, 82, 100, 106,
  114, 123, 130, 137, 143, plus Capstone Maul/Ashen Cuirass). Captured via
  `critique:drive` pass 53, screen `village` (fixture
  `wanderer-nf-village`), both viewports
  (`.critique-artifacts/{mobile,desktop}/07-village.png`).
- suggested fix: drop the trailing "Grants <Name>." clause from each
  `RelicSpec.description` in `relic.library.ts` — the mechanical subtitle
  already carries the grant; the flavor line should read like the
  non-relic items' (world/mood only, no restated mechanics).
- source: critique-drive (unattended, §3.5)

## Done

### [x] [HIGH] exploration — the late-game hub's node-graph map renders completely blank on mobile — RESOLVED 2026-09-24 (commit 2dfcafeb, issue #366)
- pass: 48 (commit 87a8b6fc)
- viewport: mobile (375×812); desktop (1280×800) unaffected
- category: navigation / mobile
- issue: #366
- observation: booted the `sage-fv-boss-gate` fixture ("the Drowned
  Parish", 28 nodes · 20 sealed) at both viewports via
  `critique:drive`. Desktop renders the full hex node graph — nine
  visible nodes, connecting roads, the "NODE GRAPH" compass mark, all
  centered in frame. Mobile shows only the header (VITAE/GRACE bars),
  the "the Drowned Parish" title, the "NODE GRAPH" label, and the
  legend/count text ("28 nodes · 20 sealed") — the entire graph area
  between them is solid black. No nodes, no edges, no backdrop plate
  render. The "Tap a glowing node to travel — drag or pinch the chart"
  hint floats over empty space with nothing to tap.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/11-late-game-hub.png`
  vs `desktop/11-late-game-hub.png` (pass 48); DOM text
  `mobile/11-late-game-hub.txt` confirms the node data loaded ("28
  nodes · 20 sealed") despite nothing rendering — this is a render/
  camera-fit gap, not a data gap.
- **root cause, found 2026-09-24:** not the `MIN_SCALE` floor or the
  first-layout-wins `viewport` capture this row originally suspected —
  both were re-verified live and are correct. The real defect:
  `computeFocusTransform`'s `tx`/`ty` (`MapCanvas.tsx:98-123`) assume the
  canvas `Animated.View`'s scale pivots around its own TOP-LEFT corner.
  React Native's (and CSS's) actual default `transformOrigin` is the
  element's CENTER. Invisible whenever the fitted scale lands at 1
  (desktop always does — `Math.min(1, …)` caps it there), but on this
  fixture's measured 355×474 mobile wrap the fit clamped to `scale: 0.6`,
  and the origin mismatch threw the whole 936×1040 canvas almost entirely
  below the fold. Confirmed by direct DOM inspection of the exported web
  build (`getBoundingClientRect()` + the computed CSS `transform` matrix)
  against a throwaway Playwright probe, not by re-reading the math alone.
- **fix:** `transformOrigin: '0 0'` on the `canvas` style, matching the
  pivot the math already assumes (precedent already in the codebase:
  `CombatCombatantPane.tsx`'s `transformOrigin: 'center bottom'`).
  Regression test pins the style (`MapCanvas.test.tsx`, CRITIQUE pass 48).
  Verified visually via `critique:drive` on both viewports post-fix —
  mobile now shows the full 8-node focus set centered; desktop unchanged.
- source: critique pass 48 (unattended `/march` tick, `critique:drive`
  transport)

### [x] [MED] combat — Phase 97's "tap a card to read it" hint never shows for the truncated hand fan it was built to fix — RESOLVED 2026-09-20 (burn-day audit row 3.13)
- pass: 42 (commit bbd22a94)
- viewport: mobile (375×812) — the hand-fan truncation this hint
  addresses doesn't occur on desktop (1280×800), so the gap is
  practically mobile-only
- category: comprehension / legibility
- observation: Phase 97 (RESOLVED row below, commit cecae8f, issue
  #343) fixed the mobile hand fan's name *occlusion* by capping
  `plateName`'s width to the visible sliver (`namePeek`) so covered
  names wrap/truncate instead of being painted over, and shipped a
  visible line — `{deadTray ? '...' : 'drag a die onto your card ·
  APPLY to commit · tap a card to read it'}` — advertising the
  already-wired tap-to-inspect escape hatch. That line only renders
  inside the `stagedCards.length > 0 && !stagedCards.some(assigned) &&
  ...` branch (`CombatBoard.tsx:1546-1556`) — i.e. only after a card
  has already been dragged up to stage. The hand fan itself
  (`CombatBoard.tsx:1677-1706`, where `HandCard` receives `namePeek`
  and the truncation actually happens) carries the same tap gesture
  and an `accessibilityHint="Drag up to stage, or tap to read"`
  (line 1690), but no on-screen text — a sighted player looking at
  "CHILBLA IN..." / "THE LONG..." / "SPOILED POULT..." in the fan has
  no visible cue that tapping reveals the full name; they have to
  already know, or discover it by accident, before staging the very
  card whose name they couldn't read. This reproduces on a fresh
  `Brine Hag` opening hand with no staged cards yet, i.e. the exact
  moment the hint is needed.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  (hand row: "THIN HYMN", "CHILBLA IN...", "THE LONG...", "SPOILED
  POULT...", "CHILBLAIN WATCH"); `04-combat-board.txt` confirms
  untruncated names ("Chilblain Watch", "The Long Lent", "Spoiled
  Poultice"); `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1546-1556`
  (hint gated on staged cards), `:1677-1706` (hand fan, no visible hint),
  `:1690` (a11y-only hint on hand cards).
- suggested fix: surface the same visible line (or a shorter variant)
  whenever the fan contains a card whose `namePeek` is non-null and no
  card is yet staged — e.g. extend the existing `stageHint` `Text` to
  also render for `fan.some((c, i) => i !== fan.length - 1)` before
  anything is staged, reusing the string that already exists at
  `CombatBoard.tsx:1554`. Component: `CombatBoard.tsx` (`stageHint`,
  hand-fan render block).
- source: loop
- resolution (burn-day audit row 3.13, 2026-09-20): the row reproduced exactly
  as filed, and the audit had found the same thing independently — this row and
  audit row 3.13 are one finding, closed here once. The hatch now renders on the
  fan itself: a `styles.fanHint` line inside the hand dock, gated on
  `fan.length > 1 && !cardDragLive`, which is precisely the condition under
  which `HandCard` receives a non-null `namePeek` — so the sentence is on screen
  exactly while a name is being clipped, and gone once nothing is covered. The
  suggested fix here was to extend the existing `stageHint` and reuse its
  string; the audit split it instead, because the string was also 67 characters
  inside `numberOfLines={1}` at 12pt and RN ellipsizes the TAIL — so `tap a card
  to read it` was the clause being dropped even in the staged branch where it
  did render. The staged line is now `drag a die onto your card · APPLY to
  commit` (43 chars) and the fan line `tap a card to read it` (21), each guarded
  against a 56-character one-line budget. `ellipsizeMode` was deliberately NOT
  added: RN already defaults to `'tail'`, so the ellipsis was never the bug.
  Guards in `CombatBoard.handfan.test.tsx`, all three verified red first: the
  hatch is present with `stagedUids={[]}`, both hint lines fit their line, and
  a tap driven through the gesture's registered test id reaches `onInspect`.

### [x] [HIGH] process — a committed playtest bug report reached `main` filed NOWHERE in `plan/` — RESOLVED 2026-09-19 (phases 99-100)
- pass: burn-day player-visibility sweep 2026-09-19
- viewport: n/a
- category: meta / process
- observation: `axiomancer-mobile/docs/reports/PLAYTEST_BUGS_2026-09-18.md`
  (committed 2026-09-18, `1d48483`) is a hands-on playtest bug hunt carrying
  FOUR root-caused, reproducible bugs — one of them critical (every returning
  player with a save got a permanently blank screen on launch). `grep -rn
  'PLAYTEST_BUGS' plan/ .claude/` returned **zero hits**: no CRITIQUE row, no
  AUDIT row, no `PHASE_CANDIDATES.md` row, no build-plan row. No loop verb
  reads `axiomancer-mobile/docs/reports/`, so nothing in the autonomous loop
  could ever have picked this up. All four bugs were still live at HEAD a day
  later, and would have stayed live indefinitely.
- evidence: the report itself; the zero-hit grep; all four bugs re-verified
  against the tree at `b9acf40` before being fixed.
- resolution: the four bugs shipped as Phase 99 (BUG-02 blank screen, BUG-03
  save-on-exit) and Phase 100 (BUG-04 map camera, BUG-01 legend counter). This
  row exists so the PROCESS gap is visible rather than silently closed along
  with them.
- **`[needs-user-call]` — the process gap itself is NOT fixed.** A
  hand-written report under `<package>/docs/reports/` is invisible to the
  loop by construction. Options for `/oversight`: (a) require every report
  landing there to file a matching `plan/CRITIQUE.md` row in the same commit;
  (b) teach `/iterate` (or `/march`'s triage step) to sweep
  `*/docs/reports/*.md` for unfiled findings; (c) accept that reports are
  human-only artefacts and route them through `/jot`. Until one is chosen,
  the next hand-written report will go the same way.
- source: loop (burn-day sweep)

### [x] [MED] combat — the mobile hand fan overlaps card-name bands, hiding the covered cards' names — RESOLVED 2026-09-19 (Phase 97, commit cecae8f, issue #343)
- pass: 37 (commit 7d470de1)
- issue: #343
- viewport: mobile (375×812) — confirmed absent on desktop (1280×800),
  same encounter/hand
- category: visual / legibility
- observation: `Brine Hag`'s opening hand ("Thin Hymn", "Chilblain
  Watch", "The Long Lent", "Spoiled Poultice", "Chilblain Watch") fans
  five cards left-to-right on mobile with each card's name band
  overlapped by the next card. Only the rightmost (topmost z-order)
  card shows its full name; the other four read "THIN HYM", "CHILBLAI",
  "THE LONG", "SPOILED " — the overlap physically covers the tail of
  the name, not a text-wrap truncation (`CombatBoard.tsx`'s
  `plateName` is `numberOfLines={2}` with an explicit comment that
  long names should wrap rather than truncate to a stub). On desktop
  the same hand renders with enough per-card width that all five names
  are fully legible. This is the same root-cause shape as the
  fanned-hand issue just fixed on the hazard route-choice screen
  (`RouteSelect.tsx`, RESOLVED 2026-09-11, commit 8f3acef7, issue
  #295: fan overlap covering text, not a wrap limit) — that fix did
  not touch this component.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  (crop of the hand row shows "THIN HYM|CHILBLAI|THE LONG|SPOILED |CHILBLAIN WATCH");
  domText `04-combat-board.txt` confirms the untruncated names are
  "Thin Hymn" / "Chilblain Watch" / "The Long Lent" / "Spoiled
  Poultice"; desktop `04-combat-board.png` shows all five full names.
- suggested fix: widen the mobile hand's per-card overlap/spacing (the
  same lever `RouteSelect.tsx` used — `-32` to `-22` overlap) or wire
  the existing `CardDetailOverlay`/inspect tap pattern onto covered
  hand cards so a player can always read a name before playing a die
  into it. Component: `components/combat/encounter/CombatBoard.tsx`
  (`plateBand`/`plateName`, hand-row fan layout).
- source: loop


- resolution (Phase 97, 2026-09-19): the row's own suggested fix — copy the
  RouteSelect `-32` -> `-22` precedent — could not transfer. CombatBoard has no
  flat margin (the overlap is derived by `handFanLayout` since the 2026-09-12
  S1-board-C11 repair), and the geometry lever is exhausted: the fan must satisfy
  `120 + 4*step <= 375`, capping `step` at 63.75 against the shipped 57.75, so
  widening the overlap buys about ONE character before the outermost cards run
  off the phone. Diagnosed instead as OCCLUSION rather than truncation —
  `plateName` is already `numberOfLines={2}` and already wraps, but was laid out
  across the full 95pt column and then painted over by an opaque neighbour
  (`zIndex: i` ascending), leaving 40.25pt visible. Fixed by sizing the name BOX:
  new `NAME_BAND_LEFT_CHROME` (17.5, derived from the four styles it sums) and
  `nameColumnPeek(step)`, threaded to `CombatCardFace` as an optional `namePeek`
  that caps `plateName`'s maxWidth so the name wraps inside the visible sliver.
  `handFanLayout` was left byte-identical, so the C11-R/C11-R2 geometry
  invariants stayed green untouched rather than being re-derived. Also shipped
  the precedent's second half: the board now states "tap a card to read it"
  visibly — the tap path was already wired but lived only in an
  accessibilityHint. New 10-test guard suite
  `CombatBoard.handfan.test.tsx`; combat-encounter 31 suites / 186 tests green.
- residual, and the reason this row STAYS resolved (burn-day audit row 3.13,
  2026-09-20): re-captured at 375x812 on the same Brine Hag opening hand, the
  fan now reads `THIN HYMN / CHILBLA IN ... / THE LONG ... / SPOILED POULTI... /
  CHILBLAIN WATCH`. That is this row's complaint answered — the names are no
  longer PAINTED OVER, which is what "hiding the covered cards' names" meant and
  what the pass-37 through pass-41 captures showed — but it is not "every name
  reads in the fan". The visible sliver is 40.25pt and `plateName` is 13pt/15pt,
  so a covered card affords roughly nine or ten uppercase glyphs across its two
  lines and anything longer ellipsizes: `FROSTBITTEN PALISADE` truncates, it
  does not read. No new Pending row is filed for that, because no lever is left
  that this row could ask for. The geometry is exhausted and pinned
  (`120 + 4*step <= 375` caps `step` at 63.75 against 57.75, and C11-R / C11-R2
  in `CombatBoard.fresh-eyes-repair.test.tsx` hold it there); the name box is
  already sized to exactly the peek; and the way to read a long name in full is
  the tap hatch, which as of this audit is finally ON the fan, in the same frame
  as the truncation — see the row closed above. If the loop ever wants full
  names in the fan itself, that is a different change with a different cost (the
  vertical-stagger lever in Phase 97 decision 8, already filed as a follow-up
  there), not an unfinished piece of this one.

### [x] [MED] combat — the arena's art registers are incoherent (painted foe, flat-vector dice, mono chrome) — RESOLVED 2026-09-19 (Phase 89, commit 6137ca5b; residual is the backdrop row below)
- pass: expo playthrough 2026-09-04 (owner-requested full-combat playtest, web export at 390x844)
- viewport: 390x844
- auth_state: fresh save, first map encounter (Brine Hag)
- category: visual
- observation: three unrelated art vocabularies share one screen — a painterly
  enemy portrait, flat-vector dice with saturated primaries, JetBrains-mono
  HUD chrome, plus a purple ruined-city backdrop behind a coastal foe (the
  pass-23 backdrop row, still open). None is wrong alone; together the board
  reads as a prototype. Not a code fix: it needs an art-direction decision
  (one register, then re-key the dice/HUD to it) before any asset work.
- evidence: `screenshots/playtest/` captures from the 2026-09-04 run
- suggested fix: art-direction pass — pick the painted register (the portraits
  are the most finished asset) and restyle the dice faces + chip chrome
  toward it; fold the pass-23 backdrop row into the same pass.
- source: owner playtest

- resolution (verified 2026-09-19): Phase 89 (`6137ca5b`, 9 files, +76/-35)
  shipped both surfaces this row named as fixable — the CombatDie shell faces
  got a woodcut cross-hatch clipped to their polygons plus an inner hairline
  rule, and `FONTS.mono` is now RESERVED for bare numeric readouts across the
  eight combat-encounter files (19 mono call sites remain against 121
  sans/serif). The board no longer reads as three unrelated vocabularies.
- DIVERGENCE this row's text does not anticipate, recorded honestly: Phase 89
  deliberately chose the **Woodcut Codex ink/hairline** register, NOT the
  "painted register" this row's suggested fix named. Painted enemy-portrait
  bitmaps (Phase 88) are untouched and literal painted-bitmap dice are deferred
  to a V4/V7 asset-acquisition phase. So three vocabularies were reduced to two
  by a shared ink language rather than collapsed to one. That is an owner-level
  art-direction judgement, not a measurement — flag it at the next `/oversight`
  if the painted register was meant literally.
- this row's second instruction — "fold the pass-23 backdrop row into the same
  pass" — was NOT honoured by Phase 89 (its only change to
  `CombatCombatantPane.tsx` is a 2-line font swap). That work is tracked on the
  backdrop row below, which stays open as PARTIAL.

### [x] [HIGH] combat — user crash on ACCEPTING the post-combat card reward (second unreproduced crash report) — RESOLVED 2026-09-19 (verified closed; CI gap closed by Phase 98, `51fede4`)
- **LIKELY THE SAME BUG — RESOLVED 2026-09-04 (verify before closing).** The
  row below was root-caused to a Reanimated worklet calling a plain JS
  function (`EnemyActionCard.tsx`, fixed). Its signature matches this one
  exactly: native-only, unreproducible on web, a hard process close rather
  than an ErrorBoundary. The reward overlay mounts animated views on the
  same post-combat beat. Keep this row open only until the owner plays the
  fixed build through a victory + ACCEPT without a close; Sentry now reports
  it automatically if anything remains.
- pass: user-jot 2026-08-29 (session: card-design check-in)
- viewport: unspecified (user's own device/build — platform not yet known)
- auth_state: real progression save
- category: functional
- observation: the user reports "the game crashes after a successful
  combat and I accept the card reward". A dedicated web-build repro
  session could NOT reproduce it on latest main (0b39b120): the accept
  path (tap offer tile → CHOOSE THIS → TAKE CARD) was driven end-to-end
  in the LIVE encounter flow with the endgame preset (max level), the
  sage preset with a pending level-up (XP granted pre-fight, cascaded
  post-victory), then walked out through the summary — zero pageerrors,
  no error-boundary mount, next combat mounts clean with the accepted
  card in deck. A fresh-save organic run (village → Drowned Shrine →
  Black Cairn → Ash Mire boss) produced only defeats, so the organic
  low-level victory→accept case is still unwitnessed.
- evidence: root-caused a REAL harness hole while hunting: every prior
  `combat-round-e2e.mjs` run silently SKIPPED the reward draft —
  `combat-reward-confirm` is disabled until a tile is picked, and the
  aftermath walk never tapped a tile, so the accept path (the code path
  the user crashes on: `claimCombatRewardAction` mutates the player and
  re-renders the panel) had zero e2e coverage. Fixed this session: the
  walk now taps the first offer tile before the preview-select/confirm
  clicks, so every live victory run drives the ACCEPT path crash-strict.
- suggested fix: get the crash's identity from the user's device — the
  persisted log survives restarts: /dev (SELF → dev tools) → DIAGNOSTICS
  → PREV SESSION with domain ERROR (or PERSISTENCE) shows the last
  session's captured error; also whether it was the ErrorBoundary panel
  (+ its code) or a hard app close, and whether it is the native EAS
  build (react-native-svg / expo-image behave differently there than on
  web — the new PRINTED PLATE face and the reward preview both render
  Svg paths). Pin that case in `combat-round-e2e.mjs` once known.
  Related: the 2026-08-19 row below — same signature (user crash the
  harness cannot see), possibly the same underlying cause.
- source: user

- resolution (2026-09-19, burn-day verification pass): the row's own
  "verify before closing" instruction was carried out against the live tree.
  Four independent confirmations: (1) the Reanimated worklet root-cause fix IS
  present at HEAD — `EnemyActionCard.tsx` reads `shouldInstantSettleJuice()` on
  the JS thread and lets the worklet capture the resulting boolean, with the
  crash mechanism documented inline; (2) a STATIC GUARD for the whole class
  exists and the tree is clean — `npm run lint:worklets` reports "195 file(s)
  clean"; (3) `combat-round-e2e.mjs` now genuinely drives the ACCEPT path (it
  taps the first offer tile before the preview-select/confirm walk), and the
  live-mode variants that reach a victory run in CI; (4) Sentry (Phase 77) is
  wired end-to-end with a baked-in DSN, so a survivor reports itself. The
  sibling Done row records the same bug REPRODUCED and root-caused by Sentry on
  2026-09-04 at `com.swmansion.worklets.AndroidUIScheduler.triggerUI` in
  `EnemyActionCardTsx1`, which confirms this row's "LIKELY THE SAME BUG"
  hypothesis was correct.
- honest caveat on the close: the row's LITERAL close condition — the owner
  playing a fixed NATIVE build through a victory + ACCEPT without a close — has
  no in-repo record and remains UNVERIFIED. This row is closed on the
  fix + guard + coverage + telemetry evidence above, not on that playthrough.
  If the owner still sees a close on a current native build, reopen: Sentry will
  now carry the identity automatically.
- one real gap found while verifying, and fixed: the worklet guard had NO CI
  trigger of any kind — not in the mobile verify gate, not as a workflow step,
  and the root `npm test` that carries its unit suite runs nowhere in CI. The
  single guard standing between this crash class and `main` was local-only.
  Closed as Phase 98 (`verify-mobile.yml` now runs `npm run lint:worklets` and
  the guard's own unit test, and re-runs on any edit to the guard itself).

### [x] [MED] combat — the arena backdrop is region-keyed but only 1 of 7 regions has a plate — RESOLVED 2026-09-19 (phases 101 + 103)
- pass: 23 (commit c063ac48)
- viewport: mobile (375×812)
- category: visual
- observation: the live combat board's full-bleed arena backdrop is a
  single static image used for literally every fight
  (`axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:49`
  — `const ARENA_BG = require('@/assets/images/combat/arena-ruined-city.jpg')`,
  documented in the file's own header comment as "a storm-lit ruined
  city over a cracked stone floor"). The Brine Hag encounter captured
  this pass is entirely nautical/liturgical in its own text — "the
  drowned congregation", "They have heard kinder sermons than yours,
  and drowned anyway", "The sea breaks over the whole argument at
  once" — yet the player fights it in front of a generic cityscape
  with no water, dock, or coastal-village signifier anywhere in frame.
  Phase 44g just rethemed the coastal-village NPC dialogue prose to
  lean harder into this nautical flavor, which widens the gap between
  the (now more vivid) text and the fixed generic art rather than
  narrowing it.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  (arena backdrop behind Brine Hag) + `03-combat.txt` (the encounter's
  own nautical/liturgical threat-sequence copy).
- suggested fix: out of scope for a one-line fix — this is a candidate
  for a dedicated art-asset or backdrop-selection phase (e.g. a small
  set of backdrops keyed to map/region, coastal-village first) rather
  than something `/iterate` should attempt piecemeal. Route via
  `/expand` if picked up.
- source: critique pass 23 (unattended, critique:drive artifacts)

- update (verified 2026-09-19, burn-day verification pass): PARTIAL, not open
  as originally written. The row's literal claim — "a single static image used
  for literally every fight", `const ARENA_BG = require(...)` — is no longer
  true. Phase 83 (`cb3b1c97`) replaced that single `require` with
  `arenaBackdropFor(region)` / `arenaAltTextFor(region)`, rendered under testID
  `combat-arena-backdrop`. The MECHANISM is shipped; the CONTENT is not.
- the measured residual: exactly ONE region rule is keyed (`/drowned parish/i`
  -> `coastal-village.webp`) against SEVEN live mobile regions, so six of seven
  still render the original ruined-city plate. Against the engine's map registry
  the ratio is 1 of 10 maps (three of which are dev-only Aporia labyrinth maps
  with no mobile layout). `assets/images/combat/` holds exactly TWO backdrops:
  `arena-ruined-city.jpg` (owner-supplied, licence UNRESOLVED per the file's own
  header) and `coastal-village.webp` (a V4-pipeline Dore plate).
- so the Brine Hag capture this row was filed on is now CORRECT — the coastal
  village is the one region that has its plate. The gap moved to the other six.
- Phase 83's own brief already names this residual verbatim as out-of-scope
  follow-up: "Arena plates for the remaining regions (caverns,
  connecting-river, northern-city, the-capital, northern-forest) — each its own
  curation decision". Each plate is an art-sourcing call (the Phase 78/88
  pipeline), not an engineering one, which is why this stays filed rather than
  being shipped by a loop tick. Note the outstanding licence question on
  `arena-ruined-city.jpg` should be resolved in the same pass.

- **RESOLVED 2026-09-19, in two phases, and the licence question with it.**
  - Phase 101 keyed The Northern City, The Connecting River and The
    Sweetheart's Village to their own Doré plates from the same edition as the
    coastal arena (1 of 7 → 4 of 7). It could go no further because
    `acquire-art.mjs` had no crop step, and the registers the remaining regions
    want exist only on *scanned pages* — caption bands, cream margins, the
    physical edge of the book. Hand-cropping outside the licence-proving
    pipeline defeats the one thing that pipeline exists to do, so it stopped and
    filed the tooling gap.
  - Phase 103 built that step (`detectPlateBox` / `buildPlatePage`, recipe
    `plate-page`, crop box recorded in provenance) and took The Caverns and The
    Capital. **Bespoke arenas are 6 of 7.** Only The Northern Forest is left,
    and it is no longer blocked on anything but finding the right plate.
  - The licence question is closed the way this row asked. `arena-ruined-city.jpg`
    is RETIRED, not documented: untraceable, licence UNRESOLVED, and on
    inspection saturated pixel art of modern high-rises among nine grayscale
    wood engravings — and, being the fallback, the most-seen arena in the game.
    THE OPEN GATE ¶6 makes that a loop call. Doré's "The New Zealander" (1873)
    replaced it; `assets/images/screens/index.ts` was repointed; the record was
    removed with the file.
  - Two holes in `scripts/asset-provenance.test.mjs` that let the deleted file
    stay referenced are closed (a `../` require was never swept; a `covers`
    entry was never checked against the disk), each proven to fail on the
    condition it claims to catch.
  - witness: `assets/images/combat/__tests__/index.test.ts` now asserts that NO
    live region reaches the fallback — the row's actual claim, rather than one
    example of it.

### [x] [HIGH] general — no mid/late equipment or signature skills exist for THE PATH's sixth axis — RESOLVED 2026-09-15 (Phase 85, commit 9f313d0c)
- pass: user-jot (commit 343d7e98)
- viewport: unspecified
- auth_state: anonymous
- category: content
- observation: we need to create a series of equipment/sig-skills and items for mid game and late game
- evidence: user-spotted at 2026-09-03T11:20:00Z
- suggested fix: [user has not specified — iterate to determine]
- source: user
- update (adjust-equipment pass 1, 2026-09-04): audited — the 8 relics are
  1:1-locked to the 8 existing signature skills, load-bearing per
  `relic.library.ts`'s own header; the 3 empty accessory kinds
  (head/hands/feet) can't be filled without designing new signature skills
  first. Filed as `[loop-call]` in `plan/AUDIT.md` (owner call needed on
  approach) rather than guessed at solo. Still open here.
- update (adjust-equipment pass 12, 2026-09-17): Phase 85 (2026-09-15,
  commit `9f313d0c`) shipped the owner-decided option (a) — 3 new signature
  skills (`sig-mounting-dread`/`sig-endless-labor`/`sig-unbroken-stride`)
  plus their carrying relics for `head`/`hands`/`feet`. `relic.library.ts`
  now ships 11 relics across all 6 `AccessoryKind`s, all `grantsSignature`
  values resolving in the live `SignatureSkillId` union. Closed.

### [x] [HIGH] late-stage global collapse — all 10 presets 0.00 late — RESOLVED 2026-09-15 (Phase 81)
- **RESOLVED (Phase 81, 2026-09-15).** The row's own 2026-08-08 reopen
  conditions — the card redesign landing, and Phase 43 defining a live
  objective function — have both happened. THE BIG NUMBERS REWRITE
  (2026-09-02) is the redesign; Phase 43 shipped, but its "objective
  function v2" is the repeal of having one at all —
  `axiomancer-mechanics/CLAUDE.md` § Load-bearing doctrine, pillar 3:
  *"There is no governing objective function any more: no win-rate
  curve, no CQI, no rank bands, no count pins, no status-engagement
  floor."* The row's 80/50/25-35/0 target band this row measured
  against is dead law. Separately, and mooting the doctrine question
  entirely: the measurement itself is stale. Fresh read of
  `axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`
  (stamp `b123cdba`, measured 2026-09-15, `reduced-nightly` confidence,
  stale by one unrelated equipment-content commit) shows late-band
  aggregate win rate at **82.0%**, **zero of 48 late cells at 0%**
  (worst cell 13.3%, `the-abortive` vs the `turtle` sim policy). "All
  10 presets 0.00 late" has not been true since THE PATH (commit
  `515ac4d9`, 2026-09-02) moved the late band 9% -> 44% via card
  upgrades/deck tiers/CONDEMN rescale — a fourth lever, not any of the
  three this row's PHASE_CANDIDATES successor named and declined to
  pick. Full writeup: `plan/archive/2026-09-25-trim-t4/plan/phases/phase_81_late_campaign_difficulty_cliff.md`.
  Residual: the three weakest late cells (13-23%, all passive-policy
  shaped) are a legitimate small follow-up, not a design-level cliff —
  filed as a Follow-up in the phase brief, not a new HIGH.
- **PARKED behind the card redesign (/oversight 2026-08-08).** T, ruling
  on this row's Phase 39 successors: *"This is fine. We're working on a
  new card redesign anyway."* Do not pick this row, do not promote a
  phase off it, and do not author cards to move its numbers — the
  library it measures is transitional. It re-opens for assessment once
  the redesign lands and Phase 43 defines a live objective function.
- **SUPERSEDED AS A TARGET by the unshackling (/oversight 2026-08-08).**
  "All 10 presets 0.00 late" was a failure *against the status-dominance
  doctrine*, which T voided this day. Whether a 0.00 late win rate is
  still a defect is now an open question that **Phase 43** (objective
  function v2) answers — and normal damage, newly legal, is the most
  obvious lever if it is. Keep this row open as evidence; do not treat
  its 80/50/25-35/0 target band as live. The post-Phase-39 reading below
  is a faithful record of the measurement, but it measures the old law.
- **Phase 39 landed 2026-08-08 (commit `8d50591e`) but did NOT drain
  this row — the matrix is the witness, and it still reads a
  violation.** The digest's first post-Phase-39 baseline (reduced
  nightly, regenerated at `8eb33fb8` — see `plan/AUDIT.md`'s new
  "Doctrine-curve confirmation post-Phase-39" row for full numbers)
  reads blind policy-pick early 61.1% (unchanged) / mid 2.0% (up from
  0.0%, still a
  deep violation against ~50) / late 0.0% (unchanged) / impossible 0%
  (unchanged, correct) against the 80/50/25-35/0 doctrine. This
  corroborates Phase 39's own shipped `needs-user-call`: the mid/late
  cliff reads as engine/enemy-scaling shaped, not card-composition
  shaped (10/13 staple-duplication candidates were already fully
  deployed pre-Phase-39 and those presets still sat at 0% mid). Do NOT
  let `/iterate` pick this row for a partial card-level fix — per the
  original assignment, per Phase 39's own finding, and per this
  project's standing rail that engine constants are tuned manually
  (not via `/deck-tuning`), the next move is an owner-scoped call via
  `/oversight` on whether to open a dedicated mid/late enemy-scaling
  phase.
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: design
- observation: every one of the 10 starter presets reads 0.00 win rate
  at the late stage, and the mid-stage ratchet clears only via erosion.
  The WS3/WS4 late gates FAILED on this global condition, not on their
  own cards — late-stage failure is currently unattributable to any
  individual card or theme.
- evidence: `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`
  (honest re-baseline matrix). Doctrine curve target is late ~25-35%
  for starter presets (`axiomancer-mechanics/CLAUDE.md`).
- suggested fix: a dedicated late-stage tuning phase (global
  condition: enemy HP/threat scaling vs win-path throughput), not
  per-card forging; candidates via /expand.
- source: session closeout (evidence pass, 2026-07-11)

### [x] [MED] village — two shop wares print byte-identical effect lines at different prices — RESOLVED 2026-09-14 (commit f19afd0d, issue #307)
- pass: 37 (commit 7d470de1)
- viewport: mobile and desktop (both show the same text)
- category: comprehension / economy
- issue: #307
- observation: Glen Market's stall lists "Philosopher's Tea" (35s) and
  "Void Essence" (40s) with the exact same mechanical line — "ADVANTAGE
  ON BODY / MIND / HEART, 3 ROUNDS" — differing only in flavor text and
  a 5-shilling price gap. `consumable.library.ts` confirms both items
  share `effectId: 'buff_critical_damage_up'` with no `resourceGrant`
  or other field distinguishing them; the code's own comments say the
  items were intended to diverge (Philosopher's Tea: "sharpens the
  mind"; Void Essence: "Heart aligns with the void-essence flavor") but
  the Spec 05b Q3(B) ruling that dropped philosophical-token grants
  from consumables left both wired to the same generic effect. A
  first-time player facing this stall has no way to tell why Void
  Essence costs more — the shop states nothing it doesn't state for
  the cheaper item.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/07-village.txt`
  (`wanderer-nf-village` fixture); `axiomancer-mechanics/src/Items/consumable.library.ts`
  lines 94-140.
- suggested fix: either differentiate the two effects to match their
  authored flavor split (e.g. one buffs a single stat's advantage
  instead of all three), or collapse the price gap so the stall isn't
  charging more for an identically-worded effect. Equipment-lifecycle
  territory (`/adjust-equipment`).
- source: loop
- resolution: differentiated rather than collapsed the price gap. The
  engine's `advantageModifier.grantAdvantage` payload already supports
  single-stance grants generically, so this was a data-only addition:
  two new buffs in `buffs.library.json` (`buff_liars_gambit`, mind-only,
  for Philosopher's Tea's "sharpens the mind"; `buff_abyssal_presence`,
  heart-only, for Void Essence's "heart aligns with the void-essence
  flavor"), both modeled on the retired pre-v3 `buff_advantage_body`/
  `buff_advantage_heart` pair's numbers (duration 3, stacking none,
  resistDR 13, resist-stance rotated one step from the granted stance).
  `buff_critical_damage_up` (used by neither item after the rewire) is
  untouched. Added mobile keyword gloss entries and a regression test
  (`dead-consumable-payload.engine.test.ts`) pinning the two consumables
  to distinct effect ids and their own single-stance grants. Verify:
  `axiomancer-mechanics` 213/213 files, 3432/3432 tests, build green;
  `axiomancer-mobile` 299/299 suites, 2854/2854 tests, 3/3 snapshots,
  lint/typecheck/assets/art green.

### [x] [LOW] village — dimmed unaffordable stall items dim the item name along with the price — RESOLVED 2026-09-11 (issue #297)
- pass: session-critic 2026-08-31 (Phase V8 closure `/critic-loop`
  screenshot pass, `axiomancer-mobile/screenshots/audit-2026-06/after/28-village.png`)
- viewport: 390x844 (audit-capture rig)
- auth_state: 0 shillings
- category: visual / legibility
- issue: #297
- observation: stall rows for items the player can't afford (Minor
  Healing Potion, Antidote at 0 shillings) dim the item name and
  description text along with the price/CTA, making the description
  borderline hard to read. Combat's disabled-item pattern keeps the
  name bright and dims only the price/CTA.
- suggested fix: align the village stall row's disabled treatment with
  the combat pattern — keep item name bone/parchment-bright, dim only
  price/affordability cue.
- source: loop
- resolution: `app/village/index.tsx`'s `wareRow` no longer applies
  `opacity` across the whole row when unaffordable — a new
  `wareRowUnaffordable` style dims only the border color (`AXM.ash`),
  and a new `wareCtaDimmed` (`opacity: 0.6`) applies only to the price
  and struck-through base-price text. Item name/description stay full
  bone/parchment brightness. `disabled`/`accessibilityState` unchanged.
  Mobile verify green (260/260 suites, 2655/2655 tests, lint 0 errors,
  typecheck clean).

### [x] [LOW] dialogue — reply cards echo their label as an identical sub-line — RESOLVED 2026-09-11 (commit 393354c6, issue #296)
- pass: session-playtest 2026-08-28 (continent playtest, The Delver at
  caverns nc-2)
- viewport: 390x844
- auth_state: anonymous
- category: visual
- observation: each reply card renders its label in display type AND
  the same text again beneath it in caption type ("WHAT DO YOU WANT
  WITH THE IRON?" twice, "WALK ON." twice). Reads as a data echo, not
  a design choice; wastes a line per reply on small screens.
- suggested fix: in the dialogue screen/presenter, render the caption
  sub-line only when it differs from the label (or drop it — the
  authored tree likely supplies no distinct sub-caption and the
  presenter falls back to the label). Check whether every dialogue
  tree shows this or only trees authored without reply descriptions.
- source: loop
- resolution: `composeNpcDialogue` (event.engine.ts) sets narrative-
  choice `label`/`description` to the same source string re-cased, by
  design (combat-prelude choices already differ). Guarded both render
  sites (`app/dialogue/index.tsx`, `app/event/index.tsx`) so the
  sub-line only shows when it differs from the label, rather than
  touching the shared `EventChoice` type. Regression coverage added in
  `event.screen.test.tsx` for both screens. Verify green (mobile
  260/260 suites, 2655 tests).

### [x] [MED] hazard — the fanned route-choice hand truncates card names illegibly — RESOLVED 2026-09-11 (commit 8f3acef7, issue #295)
- pass: session-critic 2026-08-31 (Phase V8 closure `/critic-loop`
  screenshot pass, `axiomancer-mobile/screenshots/audit-2026-06/after/14-hazard-board.png`)
- viewport: 390x844 (audit-capture rig)
- auth_state: dev-seeded hazard node
- category: visual / legibility
- observation: the five route-choice cards fan out so tightly overlapped
  that most names truncate before the player can read the choice
  ("FAITH LE…", "BALANCE P…", "SCRAMB…"), so the hand preview doesn't
  actually let a player scan their options before committing to a route.
- suggested fix: widen card spacing in the fan, or reveal the full name
  on tap/hold before the route is chosen. Component likely under
  `components/hazard/`.
- source: loop
- resolution (2026-09-11, commit 8f3acef7, `/iterate` via `/march`): did
  both named options rather than picking one. `RouteSelect.tsx`'s
  opening-hand fan overlap went from a flat `-32` to `-22` (68px visible
  per card instead of 58, confirmed against the actual card names in
  `hazard.content.ts` — "BALANCE POLE"/"UNBROKEN OATH" etc. wrap fully
  within a card's 2-line name box at full width, so the old truncation
  was the physical overlap covering the text, not a text-wrap limit).
  Also wired the already-existing `CardDetailOverlay`/`onInspect`
  pattern (used by the live in-round hand in `HazardBoard.tsx`) onto the
  preview: each fanned card is now a `Pressable` that opens the same
  full-size detail card on tap, wired through `app/hazard/index.tsx`'s
  existing `detailCard` state — no new component, reused the live-hand's
  own inspect mechanism. Verify: `axiomancer-mobile` full gate
  (lint/typecheck/jest/assets/art) green, including two new
  `RouteSelect.test.tsx` cases pinning the tap → onInspect wiring.

### [x] [MED] exploration — open map nodes just off-screen no-op silently on tap; the map recenters against manual panning — RESOLVED 2026-09-10 (commit 6fe4e47c, issue #294)
- pass: user-session playthrough 2026-08-29 (commit 0b39b120)
- viewport: 420x900 (web export)
- auth_state: fresh save
- category: functional / UX
- observation: open (glowing) nodes that sit outside the viewport
  (e.g. Sea Cave at x=-46 on a 420-wide screen) accept the tap event
  but open no travel sheet — a silent dead tap with no feedback.
  Manually panning the map to bring the node into view fights an
  auto-recenter that pulls the camera back, so reaching an edge node
  takes several attempts. The node legend advertises "tap a glowing
  node to travel", which reads as a lie the first time it happens.
- suggested fix: either auto-pan the camera to a tapped off-screen
  node (then open its sheet), or clamp the initial camera so every
  currently-open node is in view; at minimum give the dead tap
  feedback (toast or camera nudge). Check the recenter behavior in
  the map canvas component for why manual pans are overridden.
- source: user (session playthrough)
- resolution: root cause was `MapCanvas.tsx`'s one-time initial-camera
  effect, unchanged since the finding's own pass date — it centred the
  focus (available + current) nodes' centroid at a fixed 1x scale, so a
  wide branch of simultaneously-open nodes could still leave the
  outermost one off-screen the instant the map opened (no code path in
  `onNodePress` actually drops an 'available' tap — the described "dead
  tap" was this off-screen unreachability, not a handler bug). Took the
  suggested fix's second option: `computeFocusTransform` now fits the
  whole focus bounding box into the viewport, zooming out (never in,
  and never past the pinch gesture's own 0.6 floor) just enough that
  every currently-open node starts on-screen. Auto-pan-on-tap (option
  one) was left undone — the initial-fit gap was the reproducible
  defect; a tap-to-pan affordance is separable follow-up if a future
  pass still finds nodes going out of frame after a move.

### [x] [MED] world — the Ash Mire boss sits three natural steps from a fresh spawn and flattens a level-1 pilgrim — RESOLVED-STALE 2026-09-10 (superseded by redesign, no commit — pre-existing since Phase 53c/65)
- pass: user-session playthrough 2026-08-29 (commit 0b39b120)
- viewport: 420x900 (web export)
- auth_state: fresh save, level 1
- category: functional
- observation: a brand-new run walked its most obvious open path —
  Crossing (quest) → Drowned Shrine (quest) → Black Cairn (gather) —
  and the next open node was Ash Mire, labelled "boss" on the map:
  The King of Revenge, 150 VITAE, 4 phases. It killed the level-1
  pilgrim (80 VITAE, starter deck) in four rounds. The node IS
  signposted as a boss, but it sat on the natural forward path with
  ordinary encounter/rest nodes still sealed around it, so the
  first real fight of the run can be an unwinnable one.
- suggested fix: audit the fishing-village unlock graph so at least
  one ordinary encounter/rest node opens before (or beside) the Ash
  Mire edge, or gate the boss edge behind more trodden nodes. Check
  the per-map doctrine in world-tuning for the intended first-fight
  difficulty curve.
- source: user (session playthrough)
- resolution: re-verified directly against current source (`Coastal-
  Village/maps.ts`, `MapEvents/content.ts`) before picking this row —
  the fishing-village unlock graph this finding describes no longer
  exists. Phase 53c/53d/60/61 rebuilt the map into a column-layered
  gauntlet where every node's kind/foe is now an explicit, pinned
  assignment (an unassigned node throws on import — no random rotation
  survives); the boss (fv-6, still `king-of-revenge`) sits four columns
  past spawn behind two branching columns of ordinary normal-difficulty
  encounters (Little Belle, Foot-Stealer, Water-Holger — none elite)
  and a GUARANTEED pre-boss rest node (fv-20, reachable from every one
  of the branch's five terminal nodes per the map's own routing
  comment) — exactly the suggested fix's "ordinary encounter/rest node
  before the boss edge" condition, already met. The boss is also pinned
  to `FV_BOSS_LEVEL = 3`, a deliberately low absolute level, with the
  map's own comment stating the reason verbatim: "so a fresh player can
  actually win the climax." The specific complaint (an unwinnable
  first-real-fight sprung on a fresh level-1 run) no longer describes
  the current map; not re-filed.

### [x] [MED] combat — the first map fight is an elite-tier foe with a 3-phase threat sequence — RESOLVED-STALE 2026-09-10 (superseded by redesign, no commit — pre-existing since Phase 53c/53d/61)
- pass: expo playthrough 2026-09-04
- viewport: 390x844
- auth_state: fresh save, first map encounter
- category: pacing
- observation: the very first fight (Brine Hag) opened with HIDE + RAVENOUS and
  a three-phase telegraph, before the tutorial had taught staging or the
  stance check. A new player reads two foe keywords, a fork glyph and a
  stance check on their first turn. The fight was won in the playtest, so
  the ask is cognitive, not mechanical.
- evidence: `screenshots/playtest/` 2026-09-04; `combat.mock.ts` deliberately
  mirrors this foe so the UI evidence tests see the same load.
- suggested fix: gate the first encounter of a fresh save to a one-phase,
  zero-keyword foe (or strip keywords from the first roll of the encounter
  table) and let Brine Hag be fight two. Engine-side: encounter table /
  first-encounter policy, not the UI.
- source: owner playtest
- resolution: re-verified directly against current source before picking
  this row (same investigation as the Ash Mire row above, both closed
  together — the fishing-village redesign resolved both at once). Brine
  Hag (still `difficulty: 'elite'`, still a 4-phase enemy deck in
  `combat.enemy-decks.ts`) has NO authored node assignment anywhere on
  the current fishing-village map (`grep` across `World/MapEvents/
  content.ts` for the slug: zero hits) — Phase 53c/53d/61 replaced the
  map's old random-rotation encounter draw with per-node pinned foes,
  and Brine Hag was never one of the ones re-pinned. The actual first
  three combat foes a fresh save meets are Little Belle (`difficulty:
  'normal'`, fv-13), Foot-Stealer (`normal`, fv-15), and Water-Holger
  (`normal`, fv-24) — none elite, none multi-phase-telegraph before the
  first ordinary fight. The specific complaint no longer describes the
  current map; not re-filed. Noted in passing, not chased here (out of
  scope for a pacing row): Brine Hag still sits in `EnemiesByMap
  ['fishing-village']`, but every fishing-village node's event pool now
  carries an explicit pinned `enemySlug`, so `generateEncounter`'s
  random-draw branch (the only path that would ever pick her from that
  array) looks unreachable for this map — a `/adjust-enemies` sweep may
  want to check whether her `mapName` field should move.

### [x] [HIGH] combat — user hit a mid-combat crash that 30 seeded UI runs could not reproduce — COVERAGE-COMPLETE 2026-09-10 (commit c51547ae, issue #277); crash itself still UNREPRODUCED on web
- **RESOLVED 2026-09-04 — REPRODUCED, ROOT-CAUSED, FIXED.** Sentry landed
  the crash within minutes of the first instrumented build:
  `CppException: Object is not a function`, fatal/unhandled, at
  `com.swmansion.worklets.AndroidUIScheduler.triggerUI` — a **Reanimated
  worklet**, in `EnemyActionCardTsx1` inside `useAnimatedStyle`.
  `EnemyActionCard.tsx` called `shouldInstantSettleJuice()` FROM INSIDE the
  worklet. Reanimated serializes a worklet's closure into a separate
  UI-thread runtime, where a plain JS function arrives as an OBJECT, not a
  callable; invoking it threw a C++ exception on the UI thread that no JS
  handler can catch, and Android killed the process. The card mounts on
  every END PHASE, which is why "it minimizes when I end my turn" was
  exactly reproducible for the owner.
- **Why 30+ seeded UI runs never saw it:** react-native-web's Reanimated has
  NO separate UI runtime, so the identical call just works on web. This was
  never a harness gap — it was a platform the harness cannot reach. The
  lesson is filed as a standing one below.
- **Fix:** read the flag on the JS thread and let the worklet capture the
  boolean (`EnemyActionCard.tsx`). Doubly correct — the helper reads a
  JS-thread global the UI runtime does not share.
- **Guard:** `scripts/check-worklets.mjs` + `check-worklets.test.mjs` (in
  root `npm test`) statically reject any plain-JS call inside a worklet
  body across mobile `components/`, `app/`, `lib/`, `hooks/`. Self-tested:
  it catches the original line, passes the fix, and does not fire on the
  comment prose that fooled its first draft.
- **Standing lesson:** a green web e2e is NOT evidence about native. Any
  crash report that the web harness cannot reproduce should go straight to
  device telemetry rather than another seed sweep — three reports and ~30
  runs were spent before Sentry answered it in one build.
- **Platform pinned 2026-09-03 (third report, this time on END TURN).** The
  owner confirmed both unknowns the rows above kept guessing at: it is the
  **EAS preview APK (native)** and the app **closes to the home screen** — a
  process death, not a caught JS throw, so the in-app ErrorBoundary can never
  see it and neither can any web harness. Ruled out on web the same session:
  the live map encounter played to a terminal outcome on 5 seeds, plus a
  pure END-TURN-only sweep (no card played, 5 seeds x up to 20 rounds) —
  zero pageerrors, zero boundary mounts. **Next step is a native stack**:
  `adb logcat -c && adb logcat *:E AndroidRuntime:V libc:V` while
  reproducing on the device. Until that lands, treat `react-native-svg` /
  `expo-image` / Reanimated (all divergent on native) as the suspect set.
  The hunt did surface two real defects on the way, both fixed — see the
  rune-column row.
- **Partial coverage extension shipped 2026-09-03 (commit 6529212a,
  issue #277).** `combat-round-e2e.mjs` gained `ENCOUNTER_KIND=boss` (arms
  the lowest boss foe instead of a standard encounter) and `WITHDRAW=1`
  (takes the reveal screen's retreat instead of entering combat), and CI
  now runs a boss+`PRESET=sage` (non-starter deck) pass plus a withdraw
  pass in both `verify-mechanics.yml` and `verify-mobile.yml`. Verified
  locally clean on seed 16 for both new axes. **Still open:** the
  level-up-out-of-victory path is untested, and the crash itself remains
  UNREPRODUCED — this only closes 3 of the 4 axes the suggested fix named.
  Do not mark this row Done until either the crash reproduces (so it can
  be pinned) or the remaining axis ships too.
- **Last axis shipped 2026-09-10 (commit c51547ae, `/iterate` dispatched by
  `/march`).** `combat-round-e2e.mjs` gained `LEVEL_UP=1`: before the
  encounter triggers, it clicks the real `/dev` XP-grant control 9 times
  (900 XP) so the player sits exactly 100 XP short of the next level —
  `buildCharacterFromPreset` always seeds `experience = (level-1)*1000`
  against `experienceToNextLevel = level*1000`, so that 1000-XP gap is
  preset-independent, not a guess. A won fight's own XP reward then crosses
  the threshold and `applyHazardOutcome`'s level-up cascade
  (`CombatEncounterPanel.tsx`) runs mid-aftermath — the exact "sage preset
  with a pending level-up, XP granted pre-fight, cascaded post-victory"
  shape the sibling ACCEPT-crash row below reports. Wired as
  `e2e:combat-round:levelup` (`MODE=live LEVEL_UP=1 PRESET=sage`), added as
  a fourth CI step beside boss/withdraw in both workflow files. Verified
  locally: seed 16 won cleanly and walked the reward-accept path with no
  crash; seed 8 stalled at the round cap (ran out of playable cards) the
  same way the existing boss axis does on some seeds — a clean PASS under
  the harness's own exit criteria, not a new failure mode. This closes all
  4 axes the original suggested fix named. Marking Done per this row's own
  stated condition ("the remaining axis ships too") — **the crash itself is
  still UNREPRODUCED on web**; only a native device stack trace can pin it,
  per the lesson above. If it resurfaces, re-file fresh rather than
  reopening this one.
- issue: #277
- pass: user-jot (commit 24475f48)
- viewport: unspecified
- auth_state: anonymous
- category: functional
- observation: the user reported the game crashing mid-combat during
  real play. PR #216 built `axiomancer-mobile/scripts/combat-round-e2e.mjs`
  to hunt it — a crash-strict full-round harness that plays real cards
  (stage, power with a die, APPLY, END PHASE) on BOTH the
  `/combat-encounter` dev sandbox and the live map encounter (real deck,
  real enemy, `persistOutcome` write-back + aftermath panels). 30 runs
  across 15 seeds x both modes all reached a terminal outcome clean. The
  crash was NOT reproduced and remains unexplained; this row exists so
  that negative result does not read as "fixed".
- evidence: user-spotted 2026-08-19. Harness merged in PR #216 (main
  c54bcd1). Contributing cause for why it was never caught: every e2e
  attached `page.on('pageerror')` and only `console.error`'d it, so an
  uncaught exception exited 0, and nothing checked `error-boundary-screen`
  — both fixed in #216, so a recurrence now fails CI loudly.
- suggested fix: extend `combat-round-e2e.mjs` along the axes it does not
  yet reach — boss encounters (`debug-trigger-encounter-boss`), the
  mercy/WITHDRAW branches, decks carrying cards/keywords absent from the
  4-card starter, and the level-up path out of victory. Run wider seed
  sweeps (`MODE=both COMBAT_ROUND_E2E_SEEDS=... ROUNDS=20`). If the user
  supplies repro detail (enemy, last action, blank screen vs. the
  ErrorBoundary panel + its error code), pin that case first.
- source: user

### [x] [MED] combat — the LOG toggle button overlaps the new stance-check telegraph text — RESOLVED 2026-09-09 (issue #292)
- pass: critique pass 31, 2026-09-04 (commit 7f6b4312)
- viewport: desktop 1280x800 (reproduces on mobile 375x812 too, tighter)
- auth_state: fresh save, first map encounter (Brine Hag)
- category: visual
- observation: commit 636f3040 (same-day) added the open "Punishes X /
  Yields to Y" stance-check telegraph under the enemy's intent icon, plus
  a persistent-log toggle pinned at a fixed `topInset + COMBAT_HUD_HEIGHT
  + 8` offset (`COMBAT_HUD_HEIGHT = 148`, a constant). Both are
  right-aligned to the same screen edge. `COMBAT_HUD_HEIGHT` was not
  re-measured against the combined height of an active alt-win meter
  (PLEA, visible here) plus a full two-line stance-check telegraph — with
  both present, the HUD's actual right column runs long enough that the
  LOG button's near-opaque pill (`zIndex: 20`, `rgba(10,8,6,0.82)`
  background, `CombatEncounterPanel.tsx` `logToggle` style) paints over
  the tail of the "Yields to BODY ×0.5 +1◆" line. Same bug class as the
  already-fixed "signature rune column sat ON the dice tray" HIGH (pass
  2026-09-03): a fixed-offset sibling anchored off an unmeasured height
  constant, colliding with newly added dynamic content on the same edge.
- evidence: `axiomancer-mobile/.critique-artifacts/desktop/04-combat-board.png`
  (this pass) — the "L0G" pill sits directly over the second telegraph
  line at the Brine Hag encounter; `CombatCombatantPane.tsx` `hud` is
  `position: absolute, top: 0` with no fixed height, `hudRight`
  (`alignItems: 'flex-end'`) now grows by up to 2 extra 10pt lines via
  `IntentIcon`'s `stanceCheck` block; `CombatEncounterPanel.tsx`
  `logToggle` anchors off the `COMBAT_HUD_HEIGHT` constant, not a
  measured HUD height.
- suggested fix: same fix pattern as the dice-tray row — anchor the LOG
  toggle off a measured HUD bottom (e.g. `onLayout` on the `hud` View, as
  the signature-column fix did with `sigTop`) instead of the fixed
  `COMBAT_HUD_HEIGHT` constant, or raise the constant and audit all its
  consumers (`CombatTutorialCoach` shares the same anchor and may have
  the same exposure).
- resolution: `CombatCombatantPane`'s `hud` View now reports its own
  measured height via a new `onHudLayout` callback on every layout pass.
  `CombatBoard` threads it through (using the measurement for its own
  HUD-clearance spacer too) and forwards it up to `CombatEncounterPanel`,
  which now anchors both the LOG toggle and `CombatTutorialCoach` off the
  measured value (`hudBottom ?? topInset + COMBAT_HUD_HEIGHT` fallback
  until the first layout pass lands) instead of the static
  `COMBAT_HUD_HEIGHT` constant — the exact fix pattern the dice-tray row
  set. New regression test in `CombatEncounterPanel.log.test.tsx` fires a
  220pt HUD layout event and asserts the toggle's `top` tracks it exactly
  (not the static estimate). `axiomancer-mobile` `npm run verify` green.
- source: critique (unattended /march tick)

### [x] [HIGH] combat — the signature rune column sat ON the dice tray — RESOLVED 2026-09-03 (commit 1464fae9, issue #293)
- pass: crash hunt 2026-09-03 (live e2e probe, `elementFromPoint`)
- viewport: 390x844
- auth_state: real progression save (endgame + sage presets, boss and standard)
- category: functional
- observation: `sigColumn` is absolutely positioned at `top: '34%'`, `zIndex:
  30`, and grows DOWNWARD with the signature count. With a full loadout it
  reached into the dice row: probing `elementFromPoint` at the leftmost die's
  centre mid-fight returned `combat-signature-sig-press-the-point`, not the
  die. That die could not be dragged at all, and a tap aimed at it CAST a
  signature and spent Conviction. Same class as the 2026-07-18 fix that
  right-aligned the player status strip off this column.
- evidence: the drag failed SILENTLY — `resolveDrop` never ran, so no loud
  rejection fired and nothing reached the log. It also rotted the e2e:
  `combat-round-e2e.mjs` reported PASS while powering a die only in round 1
  and playing FREE every round after (boss+sage: 1 powered in 10 rounds).
  Second, compounding defect: the drag ghost and the staged card's die socket
  both rendered a `CombatDie`, so up to three nodes answered to one
  `combat-die-<id>` — the harness's prefix match picked the parked ghost,
  holding a PREVIOUS turn's die, and dragged from wherever it sat.
- fix: the column now anchors off the MEASURED tray top (`sigTop`), so its
  last rune always clears the tray whatever the loadout grants and however
  many rows the tray wraps to; the ghost and socket dice carry their own
  testIDs. `combat-round-e2e.mjs` gained an occlusion guard that fails the
  run naming the occluder, plus a coverage assertion that fails a run which
  keeps being offered a legal die and never lands one. Self-tested by
  restoring the bug: the guard fired. Powered plays went 1 -> 3-4 per fight
  (boss+sage 1 -> 9).
- source: crash hunt (owner report)
- resolution (2026-09-10, `/iterate`): this row's own `fix:` field already
  described a shipped fix, but it was never moved from Pending to Done.
  Confirmed both artifacts are still live in the tree — `sigTop`
  measurement in `axiomancer-mobile/components/combat/encounter/
  CombatBoard.tsx` and the occlusion guard in
  `axiomancer-mobile/scripts/combat-round-e2e.mjs` — both landed in commit
  `1464fae9` (`fix(combat): the rune column sat on the dice tray — dice
  you could not touch (#280)`). Ledger correction only; no code changed
  this tick.

### [x] [MED] combat — the defeat screen has a large dead black gap mid-page — RESOLVED 2026-09-02 (commit f6e4745e, issue #271)
- pass: session-critic 2026-08-31 (Phase V8 closure `/critic-loop`
  screenshot pass, `axiomancer-mobile/screenshots/audit-2026-06/after/26-aftermath-defeat.png`)
- viewport: 390x844 (audit-capture rig)
- auth_state: dev-seeded defeat aftermath
- category: visual
- observation: roughly the bottom half of the screen between the
  flavor-text epitaph and the Ledger stats block is empty near-black
  space, making the death beat read as unfinished rather than weighty —
  other aftermath screens (parley, victory) fill that space with art or
  content.
- resolution: centered a dim `FiligreeRule` (existing decorative
  divider primitive) inside `ledgerSpacer`, and gave the spacer a
  `minHeight` floor instead of pure empty flex space. No new art
  assets — keeps the panel's own "no splatter, no celebration" doctrine
  for a defeat beat intact. `CombatDefeatPanel.test.tsx` 13/13 green,
  `axiomancer-mobile` `npm run verify` green.
- source: loop

### [x] [MED] combat — first-run coach overlay still preaches the retired status-dominance doctrine — RESOLVED 2026-09-01 (commit 596e0a19, issue #269)
- pass: session-jot 2026-08-28 (THE OPEN GATE session; spotted on the
  refreshed `combat-encounter` smoke baseline)
- viewport: 390x844 (smoke rig)
- auth_state: anonymous
- category: copy
- observation: the "A NEW KIND OF FIGHT / STATUS DOES THE WORK" coach
  card tells the player "basic blows are weak. Status effects do the
  real damage" — the exact balance law THE UNSHACKLING voided
  (2026-08-08) and CQI replaced (spec 35). Direct damage is a
  first-class win path now; the tutorial teaches the dead doctrine as
  gospel to every new player.
- resolution: rewrote both `CombatTutorialPrimer.tsx`'s first two
  panels and `combat-tutorial-steps.ts`'s 'tracks' step off "there is
  no strike — status is the only blade" onto the real doctrine: one
  bar, VITAE; strikes, statuses, Conviction, Surge and dice all
  compete on merit. Mobile `npm run verify` green (0 fail).
- source: loop

### [x] [MED] combat — the momentum chain chip's empty state ("no momentum") has no contrast against the arena floor art — RESOLVED 2026-08-28 (ui-cleanup pass)
- pass: 21 (commit 75ba5a34)
- resolution: `chainEmpty` (CombatBoard.tsx) now gets the same
  contrast-guaranteeing container the filled chain nodes use — dark alpha
  fill (`rgba(0,0,0,0.55)`) + 1pt `AXM.ash` border + radius/padding
  (`overflow: 'hidden'` for the Android radius), matching the guardChip
  treatment. Text color unchanged (`AXM.ash` reads fine on the dark box).
- viewport: mobile (375×812) barely legible; desktop (1280×800) fully invisible — same underlying bug, worse at the wider viewport
- category: visual
- observation: at the start of every fight (T1, no stance played yet
  — the most common opening state a player sees), the momentum chain
  chip renders its empty state as bare `○ no momentum` text directly
  over the busy arena floor artwork, just above the "NO STANCE" chip.
  On mobile it's a faint grey smear, barely readable against the
  floor texture. On desktop, at the same combat state, it does not
  render visibly at all — the text is in the DOM (confirmed via
  `critique-drive`'s extracted innerText) but produces zero visible
  pixels against the lighter floor art there. Every other momentum
  state (charged/surged/broke/chain-in-progress) has a colored
  border + alpha-fill background box behind its text, so only the
  empty state lacks a contrast-guaranteeing container.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  vs `.../desktop/04-combat-board.png` (both T1, no stance played;
  compare the strip directly above "NO STANCE"). DOM text for both
  confirms `○ no momentum` is present in `04-combat-board.txt` for
  both viewports despite the desktop screenshot showing nothing there.
  Root cause: `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:627`
  — `<Text style={[styles.chainEmpty, { color: AXM.ash }]}>○ no momentum</Text>`
  — `chainEmpty` (line 1818) sets only font/size/spacing, no
  background or border, unlike `chainNode` (the filled-link style,
  which sets `backgroundColor` + `borderColor`) and `wheelCharged`/
  `chainBroke` (which set `textShadowColor`).
- suggested fix: give the empty-state text the same kind of
  contrast-guaranteeing container the other momentum states get —
  e.g. wrap it in a `chainNode`-style box (dark alpha background +
  ash border) instead of bare text, or at minimum add a
  `textShadowColor` matching the other chip states.
- source: critique pass 21 (unattended, critique:drive artifacts)

### [x] [MED] exploration hub — node-legend's "N nodes · M sealed" count is clipped to a bare number on the desktop viewport — RESOLVED 2026-08-28 (ui-cleanup pass)
- pass: 20 (commit dc1270ca)
- resolution: `MapCanvas` grew a viewport-fixed `overlays` slot rendered as a
  sibling of the vignette/compass chart furniture (after the
  `GestureDetector`, inside `graphWrap`, wrapped `pointerEvents="none"`), and
  the exploration hub now passes `<MapOverlays legend=... />` through it
  instead of through `children` — so the legend's absolute positions resolve
  against the visible viewport, not the 936×1040 pannable canvas. Mobile
  placement unchanged (same `bottom/left/right` insets, now against the same
  box the vignette uses). Tests added in `MapCanvas.test.tsx`.
- viewport: desktop (1280×800) only — mobile (375×812) unaffected
- category: visual
- observation: on the exploration-hub map, the legend's right-hand
  string reads "25 nodes · 22 sealed" on mobile but renders as a bare
  "25" in the map's bottom-right corner on desktop — "nodes · 22
  sealed" is clipped off. This is the same node-legend the sibling
  Pending row below already flags as disagreeing with the header
  count; on desktop the legend loses its own meaning too, since a
  lone "25" with no unit reads as noise.
- evidence: `axiomancer-mobile/.critique-artifacts/desktop/05-exploration-hub.png`
  (bottom-right of the map box) vs `.../mobile/05-exploration-hub.png`
  (same string renders in full). Root cause traced in
  `axiomancer-mobile/components/exploration/MapCanvas.tsx:218`: `{children}`
  (which includes `<MapOverlays>`, the component that renders the
  legend — `axiomancer-mobile/components/exploration/MapOverlays.tsx:22-25`)
  is rendered *inside* the pannable/zoomable `<Animated.View
  style={[styles.canvas, mapTransform]}>`, so the legend's
  `position: 'absolute', bottom: 8, left: 12, right: 12` resolves
  against the 936×1040 canvas, not the viewport. The genuinely
  viewport-fixed furniture (vignette + compass rose SVGs, explicitly
  commented "Viewport-fixed chart furniture — never pans with the
  map" at line 222) lives *outside* that `Animated.View`, siblings of
  it — `MapOverlays` should live there too. The initial centering
  translate (`MapCanvas.tsx`'s `cx = viewport.w / 2 - ax * SPREAD`)
  depends on viewport width, so the legend's on-screen position shifts
  per viewport; at 1280px wide, `graphWrap`'s `overflow: 'hidden'`
  (line 263) clips most of the right-hand text.
- suggested fix: move `<MapOverlays legend={vm.legend} />` (and the
  compass/node-graph-label text it renders) out of `MapCanvas`'s
  `children` slot and render it as a sibling of the vignette/compass
  SVGs (after the `</GestureDetector>` closing tag, still inside
  `graphWrap`), so it's positioned against the viewport like the rest
  of the "chart furniture" instead of the pannable canvas.
- source: critique pass 20 (unattended, critique:drive artifacts)

### [x] [MED] exploration hub — static `regionProgress` header count doesn't reconcile with the dynamic node-legend on the same screen — RESOLVED 2026-08-28 (ui-cleanup pass)
- pass: 19 (commit 18eb0ddb)
- resolution: dropped the stale static counts from both layouts — the header
  now reads the ordinal only ("Map i of ii" / "Map ii of ii") and the single
  live-computed legend (`${def.nodes.length} nodes · ${locked.length} sealed`)
  is the one count on screen. `MapLayout.regionProgress`'s doc comment now
  forbids counts; pinned test updated + a regression guard added
  (`fishing-village.layout.test.ts`).
- viewport: mobile + desktop (both)
- category: comprehension
- observation: the Fishing Village exploration screen shows "Map i of
  ii · 24 paths open" as a header directly above a node graph whose
  own legend reads "25 nodes · 22 sealed". A first-time player reads
  two node/progress counts on one screen that don't agree (24 vs 25;
  "open" vs only ~3 unsealed by the legend's math) and has no way to
  tell which is current. The header string is authored-static and
  never changes as the player unlocks/seals nodes; the legend is
  computed live from `MapDefinition`.
- evidence: `axiomancer-mobile/state/exploration-maps/fishing-village.layout.ts:7`
  (`regionProgress: 'Map i of ii · 24 paths open'`, hardcoded) vs
  `axiomancer-mobile/state/presenters/exploration.engine.ts:418`
  (`` `${def.nodes.length} nodes · ${locked.length} sealed` ``,
  computed). Same pattern on the second map:
  `northern-forest.layout.ts:7` (`'Map ii of ii · 9 paths remain'`).
- suggested fix: derive the header count from the same live node
  state the legend already reads (or drop the number from
  `regionProgress` and keep just "Map i of ii"), so the two counts on
  screen can't disagree.
- source: critique pass 19 (unattended, critique:drive artifacts)

### [x] [LOW] mobile — combat corner medallions occlude the fan-end hand cards' touch centers — RESOLVED 2026-08-28 (ui-cleanup pass)
- pass: combat declutter residue (PR #135, 2026-07-19)
- resolution: the player medallion's touch box no longer reaches the leftmost
  hand card's bounding-box centre: its dock dropped flush with the rail top
  (`bottom: bottomInset + 26`, was `+34` — touch box tops out at ~118pt vs
  card centres at ~120–126pt across hand sizes) and its `hitSlop` now slops
  only toward the screen corner (`{ left: 6, bottom: 6 }`, was uniform 6 —
  the top/right edges are where the fan runs under it). END medallion checked
  and already clears (top ≈112pt, no hitSlop). Re-run the PR #135
  elementFromPoint probe on the next capture pass to confirm.
- viewport: 375×812
- auth_state: n/a
- category: ux
- observation: the player medallion (bottom-left) and END medallion (bottom-right) deliberately float ABOVE the fan ends (reference chrome) — but the LEFTMOST hand card's bounding-box center sits under the player medallion, so a drag started from its middle hits the medallion, not the card. Found while the upgradeable-dice e2e's SWAY guard failed staging the leftmost Soft Word; the harness now picks the rightmost copy, but a real player dragging the leftmost card from its lower half hits the same occlusion. Playable (the card's upper half drags fine) — just a friction spot on small screens.
- evidence: PR #135 (elementFromPoint probe: combat-hand-c1 center → combat-player-medallion); scripts/upgradeable-dice-e2e.mjs SWAY-guard comment.
- suggested fix: next combat-UX pass, either inset the fan band from the medallions or shrink the medallion hit-slop so the card wins the touch; verify with the same probe.
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)

### [x] [HIGH] title screen — tagline said "modern steel", contradicting the shipped anti-modern-word doctrine — RESOLVED 2026-08-14 (commit 0f408571, issue #204)
- pass: 23 (commit c063ac48)
- viewport: mobile (375×812)
- category: voice
- resolution: swapped "modern steel" for "cold iron" in the title
  screen tagline (`axiomancer-mobile/components/TitleScreen.tsx:57-58`)
  — archaic register, and doubles as folkloric ward-against-curses
  flavor for "the cursed lands await." One-line copy change, no
  code/data plumbing.
- source: critique pass 23 (unattended, critique:drive artifacts)

### [x] [LOW] Combat kill-path legibility — RESOLVED 2026-08-07 (commit 615ff26b, issue #174)
- The status kill-path (DoT / execute) is the intended win path
  but is not obviously legible on the combat board. A
  projected-lethality readout would close the gap (build-plan
  Phase 2).
- issue: #174
- resolution: build-plan Phase 2 had shipped the mechanics selector
  `projectCombatOutcome` (pending DoT / rounds-to-kill /
  lethal-in-flight), but nothing in `axiomancer-mobile` ever consumed
  it — the API existed, the board stayed illegible. Forwarded the
  projection onto `CombatEnemyPaneVM` in the enemy-pane presenter
  (`combat-encounter.engine.ts`) and rendered it on the combat board
  (`CombatCombatantPane.tsx`) as a "DOT PENDING" / "LETHAL IN N"
  readout, reusing the existing `AltWinMeter` component (same HUD slot
  as the SWAY/PREMISE alt-win meters). Added presenter coverage
  (`legibility-sweep.engine.test.ts`) pinning the hidden/pending/lethal
  states against the same fixture as mechanics' own
  `projected-lethality.engine.test.ts` e2e. Mobile lint + typecheck +
  268 files/2719 tests green.

### [x] [MED] general — color-match die riders are a fake condition; remove — RESOLVED 2026-08-07 (commit d793d607, issue #173)
- pass: user-jot (commit 486dbded)
- viewport: unspecified
- auth_state: anonymous
- category: mechanics
- issue: #173
- observation: Owner directive (2026-07-18, combat UI polish session): color-match die riders must go. Under the color law (only same-stance or WILD powers a card), the 7 library cards with an on-color dieBonus (e.g. soft-word "HEART die: SWAY 1") have a fake condition — it fires on every paid play except WILD, and the printed line reads as a replacement not a bonus. Owner: "There should be no color match riders... ignoring gold since that's a big win anyway." Open sub-call: fold the rider into the paid effect (soft-word → SWAY 4; preserves colored-die behavior, tiny WILD buff — recommended) vs drop outright (small nerf). Related residue: the global colorMatch flag (combat.engine.ts:1915) counts WILD as a match so it is ALWAYS true — the +3 Guard/Barrier COLOR_MATCH_DAMAGE_BONUS and the status-duration bonus are flat bonuses wearing conditional copy; bake the constants into base math and delete the misleading "+3 on colour match" wording (zero gameplay change). Affected: 7 cards' dieBonus fields + pricing comments (dieBonus x0.6 weight), combat.engine.ts rider path, mobile presenter colorMatchHint/armedReadValue copy.
- evidence: user-spotted at 2026-07-18T15:17:02Z
- suggested fix: [user has not specified — iterate to determine]
- source: user
- resolution: re-verified the "7 cards" count was stale — Phase 30's
  FREE-lines rewrite had already stripped `dieBonus` from 6 of them;
  only `the-burden-of-repetition` still carried the fake
  `onColor: 'match'` condition. Folded its `conviction: 1` rider
  directly into `specialMechanics` as a plain unconditional rider and
  re-priced it at full weight (was the conditional dieBonus ×0.6
  discount) — 11.40 → 12.60, still inside the printed uncommon band
  4.5-13. Reworded the momentum-wheel tooltip that misattributed the
  color-match bonus to the wild die specifically. Did NOT bake the
  flat `COLOR_MATCH_DAMAGE_BONUS`/duration bonus into unconditional
  math: the FATE Engine's X-die mechanism is a genuine, tested
  exception (`colorMatch` is correctly `false` for an X-die-powered
  play — no live card uses `fate` today, but baking the bonus in would
  silently grant it to any future fate-flagged card). That portion of
  the finding was a false premise, not a bug — closing as
  verified-not-a-bug rather than shipped. `axiomancer-mechanics` 190
  files/4085 tests green; `axiomancer-mobile` 268 files/2716 tests
  green.

### [x] [LOW] catalog keyword bolder still speaks dead vocabulary — RESOLVED 2026-08-06 (commit 489819a6, issue #171)
- pass: session 2026-07-17 (card-text work)
- viewport: devlog/catalog.html
- category: content/copy
- issue: #171
- resolution: pruned `KEYWORD_WORDS` in `scripts/build-catalog.mjs` to drop
  the 12 dead words. Confirmed against the mechanics guard allowlist
  (`paid-summary-honesty.engine.test.ts`) and the live mobile
  `KEYWORD_GLOSS` registry (`axiomancer-mobile/state/combat/keywords.ts`)
  that none of the 12 are real keywords. "damage" was the only one
  actually live in card text (18 bolded occurrences pre-fix, 0 after);
  regenerated `devlog/catalog.html`. Root verify green.
- observation: `scripts/build-catalog.mjs` KEYWORD_WORDS bolds words
  the spec 32 v3 registry retired or never had — DAMAGE, STUN, SLOW,
  BURN, CONFUSION, SILENCE, REGEN, EXECUTE, COMPOUND, VULNERABLE,
  BARRIER, REPRISE — so prose like "3 damage each" renders "damage"
  as a bold keyword-styled token, implying a keyword the overlay
  cannot define. Mobile bolding is honest (chip-driven); only the
  catalog over-bolds.
- evidence: The Closing Word's catalog face renders "3 DAMAGE each"
  bold; the mechanics guard allowlist
  (`paid-summary-honesty.engine.test.ts`) is the current vocabulary.
- suggested fix: prune KEYWORD_WORDS to the guard's registry +
  structural allowlist.

### [x] [MED] combat — authored `paidSummary` card text still prints round-clock "for N turns" for event-triggered poison/bleed, reopening the WI-2 "RESOLVED — stale" closure — RESOLVED 2026-08-05 (commit d320ee12, issue #170)
- pass: 16 (commit 63574686)
- issue: #170
- resolution: reworded all 12 offending authored `paidSummary` strings (the
  sweep found 5 more than this row's cited 7) to name the real trigger while
  keeping the honest duration number; extended the WI-2 guard test to read
  every card's `combatEffects` directly instead of `faceStats`'s
  primary-effect classification, which is what let a multi-effect authored
  card (e.g. this row's own Opening Statement citation) slip through
  undetected. See `plan/AUDIT.md`'s mirrored row for the full account.
- viewport: mobile + desktop (375×812, 1280×800)
- auth_state: anonymous
- category: comprehension
- observation: this pass's cold drive reached the live combat-board
  and captured the "Slippery Slope" hand card printing "Inflict
  POISON 1 for 4 turns." — round-clock duration language — at both
  viewports. `debuff_poison`'s trigger is `"card-played"` (an event,
  not a per-round tick — confirmed in
  `axiomancer-mechanics/src/Effects/debuffs.library.json`), so this is
  exactly the lie the WI-2 fix (issue #168) was supposed to have
  killed. The 2026-08-04 "RESOLVED — stale" closure of the prior DoT
  round-clock row (below, in Done) only verified the auto-generated
  path: `faceStats`'s `dot` case
  (`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1643-1660`)
  and its guard test
  (`card-face-honesty.guard.test.ts:110-153`, "WI-2 — every
  event-triggered DoT face names its trigger"). Neither touches a card
  with an authored `paidSummary` override: `combat.cards.ts:389`
  (`const authored = !persistent ? card.paidSummary : undefined`) and
  `:415` (`dotSuffix = authored ? '' : ...`) show the authored string
  fully replaces the auto-generated event-aware text, and the guard
  test only walks `faceStats`'s classification — never the raw
  `bottomActionText`/`paidSummary` sentence that
  `CombatBoard.tsx`'s `cleanPaidSentence()` (line 1518) actually prints
  on the hand card. The fix landed; it just doesn't cover authored
  cards, and the regression guard can't catch what it never reads.
- evidence: `axiomancer-mobile/.critique-artifacts/{mobile,desktop}/04-combat-board.png`
  + `.txt` (this pass); `axiomancer-mechanics/src/Cards/cards.library.ts`
  — at least 7 cards share the pattern (lines 45, 203, 226, 519, 578,
  830, 1765), e.g. `slippery-slope`: `paidSummary: 'Inflict POISON 1
  for 4 turns.'`.
- suggested fix: either reword the 7 authored `paidSummary` strings to
  event-based phrasing (matching the auto-generated `evt.verb` text,
  e.g. "each card you play" / "each hit taken"), or drop the
  `paidSummary` override for pure-DoT cards so the already-correct
  auto-generated `dotFace`/`dotSuffix` renders instead — then extend
  the WI-2 guard test to sweep `bottomActionText`/`paidSummary`
  strings too, not just `faceStats`'s `dot` classification, so this
  can't regress silently again.
- source: critique (unattended `/march` tick, non-MCP transport)

### [x] [MED] DoT card faces print round-clock math that contradicts their own keyword glosses (RESOLVED — stale, already fixed by WI-2, issue #168)
- RESOLVED 2026-08-04 (verified stale; no new code). The trigger-clock
  source of truth this row's suggested fix asked for already exists:
  `debuffs.library.json`'s `damageOverTime.trigger` field
  (`debuff_poison` tagged `"card-played"`, `debuff_bleed` tagged
  `"damage-instance"`). It is read once in `cardCalc()`
  (`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1187-1188`,
  `out.dotTrigger`) and consumed by both the card-face generator
  (`faceStats`) and the detail-overlay generator (`detailCore`).
  Event-triggered DoT faces now read e.g. "foe loses VITAE each card
  you play" (poison) / "foe loses VITAE each time it is struck"
  (bleed) — round-clock "X over Nt turns" phrasing is emitted ONLY for
  the `dotTrigger === null` branch (genuinely round-clock/legacy
  effects), never for poison or bleed. Fix landed in commit
  `b097efec` ("Fixes from cleanup", WI-2, 2026-07-12 11:45:52) — ten
  minutes BEFORE this CRITIQUE row was even filed (11:55:20 the same
  day), so the finding was already stale at filing time. Regression
  coverage: `axiomancer-mobile/state/presenters/__tests__/card-face-honesty.guard.test.ts`
  sweeps the entire card library asserting no event-triggered DoT face
  prints round-clock phrasing; passes clean on current `main`.
- issue: #168
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: content/copy
- observation: all DoT card faces still print round-clock phrasing
  ("12 over 2t" / "foe loses HP each turn"), but the underlying
  keyword glosses (and the actual trigger, per the finding above) are
  event-triggered — per-card-played for poison, per-damage-instance
  for bleed. The face text describes a mechanic the card doesn't run.
  Same root cause as Phase 29's keyword-honesty doctrine (`plan/steps/
  01_build_plan.md` Phase 29, KW-2/5/6/7 still open) and squarely in
  Phase 32's DoT-clock scope.
- evidence: card-face aria-labels captured during the same Playwright
  session read round-clock phrasing on cards whose keyword definition
  is event-triggered.
- suggested fix: fold into Phase 32's DoT-clock work — regenerate DoT
  card-face text from the same trigger-clock source of truth once it
  exists, rather than patching copy ad hoc.
- source: playtester (owner-directed break-test session)

### [x] [MED] SWAY has no meter anywhere in the combat UI (RESOLVED — stale, already fixed by WI-5, issue #167)
- RESOLVED 2026-08-03 (verified stale; no new code). WI-5 (2026-07-12,
  commit `88406af8`) already shipped an `AltWinMeter` (SWAY →
  CAPITULATE, PREMISE → ORATORY) under the VITAE bar in
  `CombatCombatantPane.tsx` — `testID="combat-sway-meter"`, full
  `accessibilityRole="progressbar"` semantics, gated on
  `enemy.swayVisible` (visible once sway accrues or the preset's deck
  feeds the mechanic). Presenter-level regression coverage already
  exists: `legibility-sweep.engine.test.ts` "surfaces the SWAY meter
  with the engine capitulate target when sway accrues" pins
  `swayVisible`/`sway`/`swayTarget`. The row predates or narrowly
  missed WI-5's same-day landing; the queue was overstating an open
  MED. Corrected.
- issue: #167
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: visual/legibility
- observation: SWAY (decays 1/turn, capitulate at ≥ enemy VITAE — per
  the card-editor's own mechanic hint) has no visible meter anywhere
  in the combat UI, despite `axiomancer-card-editor` already modeling
  it as a real mechanic (see PR #68's `CardForm.tsx` SWAY field). A
  player has no way to see SWAY progress toward capitulation.
  Sequencing risk for Phase 33 (Enemy Answers, SWAY-cleanse enemies,
  `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-theme-identity.md` §1): that phase plans
  enemy counterplay against a mechanic the player currently cannot
  observe.
- evidence: full-screen accessibility snapshot of an in-progress
  combat with an active SWAY effect shows no SWAY meter/readout
  anywhere in the tree.
- suggested fix: land a SWAY meter (mirroring the Premise-track /
  disrupt-meter legibility work from Phase 28) before or alongside
  Phase 33's SWAY-cleanse enemy work.
- source: playtester (owner-directed break-test session)

### [x] [HIGH] tuning harness — policy-pick draft scorer starves new/sandbox cards (RESOLVED 2026-08-02, commit fbace426, issue #163)
- pass: session-closeout 2026-07-12 (commit ffadca96, branch claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: tuning-harness
- issue: #163
- observation: the policy-pick draft scorer never surfaces new or
  sandbox cards — five sets (doom-species, chooseX-vein, roles-charm,
  roles-harvest, roles-forge's ingot) had ZERO drafts at one or more
  seeds, and three independent A/Bs (conjure-exercise, roles-bulwark,
  roles-harvest) show the IDENTICAL +10.8pp seed-2 mid-stage delta —
  a pool-shuffle artifact, not a card signal. Matrix-level stage
  deltas in sandbox A/Bs are not attributable to the cards under test.
- evidence: `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`
  §2 cross-cutting findings 1-2; direct-draft probe
  (`probe-ingot-draftability.ts`) shows ingot-of-ruin IS structurally
  draftable — the scorer and the lottery disagree.
- suggested fix: one scorer fix (draft-weight/offer-rate handling of
  pool newcomers) unblocks SIX pending gate verdicts; do it before the
  next sandbox A/B cycle so evidence stops being lottery-shaped.
- source: session closeout (evidence pass, 2026-07-11)
- resolution: reproduced live on `main` (`694edb59`) before fixing —
  `ingot-of-ruin` 0/24 draws across the 3 canonical late-stage seeds;
  `conjure-exercise`/`roles-bulwark` produced byte-identical decks
  across all 40 mid-stage seed=2 cells. `draftCombatDeck`
  (`combat.deck-draft.ts`) now extends the existing defend/status
  floor pattern with a per-id guarantee: every distinct `extraCards`
  newcomer id is forced into the draft when the stage/tier pool
  allows it (per-id, not per-class, so a set with multiple newcomers
  can't have one hide another). `FOCUS_WEIGHT`/`OFF_FOCUS_WEIGHT` and
  library-card odds untouched; no-ops whenever `extraCards` is empty,
  so real starter presets are unaffected. Regression coverage in
  `combat-deck-draft.engine.test.ts`. Post-fix: `ingot-of-ruin` hits
  48/48 eligible cells; all named sets now surface in 71-100% of
  stage-eligible cells. Mechanics `npm run verify`: 190 files / 4085
  tests green.

### [x] [MED] Engine doc-drift is chronic — RESOLVED 2026-08-02 (commit 6690c5d0, issue #164)
- New engine surfaces (status-depth constants, new spec exports)
  chronically lag `spec.md` / `docs/combat.md`. Keep a doc-sync
  check in the loop rather than trusting the docs. (Build-plan
  Phase 12 addresses the current backlog; this is the recurring
  guard.)
- resolution: this pass's manifestation — `axiomancer-mobile/docs/
  combat.md` still described the fully-retired legacy combat screen
  (deleted `app/(tabs)/combat.tsx`, the removed `resolveCombatRound`
  four-phase loop, a deleted `SkillConfirmOverlay` component, three
  dead e2e test paths) — rewritten to describe the current
  `<CombatEncounterPanel>`/`<CombatBoard>` architecture, every link
  verified to resolve. **Standing guard, not closed for good:** this
  is a recurring pattern seeded from archived critique history: a
  future pass finding NEW doc/engine drift should re-file a fresh row
  rather than treat this resolution as blanket coverage.

### [x] [MED] Wrong-engine mental model in docs — RESOLVED 2026-08-02 (commit 6690c5d0, issue #164)
- Any surviving copy in `docs/combat.md` that frames
  Hazard-Pattern Combat as "additive/secondary" or teaches
  `resolveCombatRound`-first is the wrong mental model for mobile
  integrators. Hazard-Pattern Combat is primary.
- resolution: `axiomancer-mobile/docs/combat.md` opens with an
  explicit "Hazard-Pattern Combat is the ONLY combat engine" doctrine
  banner and no longer references `resolveCombatRound` as current;
  `specs/04-combat-screen-wiring.md` (the doc it was pinned to) is now
  marked superseded. Same standing-guard caveat as the row above —
  re-file fresh if a new instance surfaces.

### [x] [LOW] mechanics — THEME_KEYWORDS.harvest still advertises TICK (owner-ratified dead 2026-07-10) — RESOLVED 2026-08-01 (issue #160)
- pass: swap-pool fan-out residue (PR #130, 2026-07-18)
- viewport: n/a
- auth_state: n/a
- category: content
- issue: #160
- observation: `card-themes.ts` lists TICK in harvest's keyword family, but the atlas records TICK's owner-ratified death and no live card uses it — the catalog's family search advertises an empty set (the exact "family lie" class KW-2/KW-6 fixed in phase 29).
- evidence: harvest swap-pool designer note; docs/keyword-atlas.md TICK row.
- resolution: dropped TICK from `THEME_KEYWORDS.affliction` and `THEME_KEYWORDS.harvest` (both families listed it) in `axiomancer-mechanics/src/Cards/card-themes.ts`. Confirmed no live card uses TICK (`roles-themes.engine.test.ts` "no TICK vocabulary anywhere in the sets" witness) and no test pins family length/contents beyond the KW-6 glossary-resolution check. Mechanics + mobile verify green.
- source: /deck-tuning fan-out session

### [x] [MED] control-lock sim policy is threat-blind — WS8 surface variety unexploited — RESOLVED 2026-08-01 (commit d0d83e06, issue #159)
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: tuning-harness
- issue: #159
- observation: `rankCard` in the sim policies never reads
  `threatPhases`, so no sim policy can exploit WS8's control-surface
  variety (the data exists; no decision layer uses it). Pinned as a
  known gap via `it.fails` in
  `axiomancer-mechanics/src/Combat/e2e/control-surfaces.sim.test.ts`.
- evidence: the `it.fails` pin; WS8 payload data in
  `combat.threat-sequences.ts`.
- suggested fix: teach the control policy to read the CURRENT threat
  phase (rungs, intent type) when ranking STAGGER/BACKFIRE plays; flip
  the `it.fails` pin to a passing assertion in the same change.
- source: session closeout
- resolution: added `controlSurfaceBonus` to the `control-lock` policy's
  `rankCard` (`combat.sim-policies.ts`) — a threat carrying a rider ranks
  BACKFIRE punish highest (no roster candidate erases a rider outright);
  a clean or compounding threat ranks STAGGER rung-denial highest, with
  `lock_stance` as a certainty tiebreak. Flipped the WS8.4 `it.fails` pin
  to a passing `it` per its own documented instructions. Verified: all 4
  fixture threats now produce >1 distinct preferred control card.

### [x] [MED] pre-fight enemy preview disagrees with live combat VITAE — RESOLVED 2026-08-01 (commit 15d45699, issue #162)
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
- issue: #162
- observation: the pre-fight encounter card for "Little Belle"
  previews the enemy as "level 2 · 50 hp.", but immediately on
  entering combat the same enemy's VITAE bar reads 100/100 — double
  the previewed value.
- evidence: encounter card text "level 2 · 50 hp." / "Lv 2 foe · 50 HP
  · advantage not yet scouted"; combat screen progressbar "Enemy VITAE
  100 of 100" for the same enemy in the same encounter.
- suggested fix: source the pre-fight preview and the live combat
  VITAE bar from the same computed enemy stat.
- source: playtester (critique pass 12)
- resolution: root cause was systemic, not Little-Belle-specific —
  `beginHazardEncounter` (`axiomancer-mobile/state/actions.ts`) applies
  the `ENCOUNTER_ENEMY_HP_MULTIPLIER` (2x) testing knob to every live
  foe's HP, but `composeCombatPrelude`'s preview text
  (`axiomancer-mobile/state/presenters/event.engine.ts`) read the
  enemy's unscaled `health`. Preview now derives its displayed health
  from the same `withScaledEnemyHp` helper used at the live chokepoint.
  Also widened `event.engine.test.ts`'s roman-numeral subtitle regex to
  the full lowercase-roman alphabet — the doubled value exposed a
  stale test regex that only ever accepted i/v/x. Full three-workspace
  `npm run verify` green.

### [x] [MED] exploration hub — player subtitle reads "LEVEL · LVL 1 PILGRIM", doubling the level label — RESOLVED 2026-07-31 (commit 16c89f25, issue #157)
- pass: 14 (commit 9a445281)
- viewport: mobile + desktop (375×812, 1280×800)
- auth_state: anonymous
- category: visual
- observation: the exploration-hub `StatusCard` (name + level badge,
  visible any time the player is on the map) renders a subtitle line
  "LEVEL · LVL 1 PILGRIM" — the static section label "LEVEL" and the
  value string's own "LVL {n}" both say the same thing back to back,
  reading as a template/copy-paste leftover rather than intentional
  flavor. Same shape as the earlier header MORALE "v of x" placeholder
  bug (RESOLVED 2026-07-18, different component) — a label colliding
  with its own value.
- evidence: `StatusCard.tsx:61` — `` LEVEL · LVL {level} PILGRIM ``
  inside a `SectionLabel`; confirmed live in the exploration-hub
  cold-drive capture (mobile + desktop): "LEVEL · LVL 1 PILGRIM".
- resolution: dropped the redundant leading "LEVEL · " section label —
  subtitle now reads "LVL {n} · PILGRIM" once. Updated the pinned test
  string in `StatusCard.test.tsx` to match + added a regression guard.

### [x] [LOW] [green-lit 2026-07-18] session doc-residue: three AGENTS/CLAUDE additions approved — RESOLVED 2026-07-30 (commit 7c20b4fd, issue #156)
- pass: session 2026-07-17 (measurement-freshness work)
- category: docs
- resolution: (2), promoting the PR auto-merge convention to root
  AGENTS.md, was already done in an earlier tick (root AGENTS.md
  "Pull requests" section; axiomancer-mobile/CLAUDE.md now points at
  it). This tick landed the two still-missing pieces as one docs
  commit: (1) a worktree-bootstrap note in root AGENTS.md's Verify
  section (fresh `.claude/worktrees/*` checkouts lack per-workspace
  node_modules, so `tsc` can resolve the hoisted root TypeScript and
  fail with e.g. TS5095 — `npm install` at the worktree root first
  avoids the detour) and (3) a wording-pin discipline note in
  axiomancer-mechanics/AGENTS.md's Caveats section (grace-card-wording
  + the paid-summary honesty guard pin authored prose; reword a card
  and its pin in the same commit). Root `npm run verify` green across
  all three workspaces.
