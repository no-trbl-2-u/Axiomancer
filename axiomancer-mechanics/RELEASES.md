# Releases

Short-form per-version summaries. For per-phase detail see
[`CHANGELOG.md`](./CHANGELOG.md); for the release-cut ceremony see
[`RELEASING.md`](./RELEASING.md).

## 0.22.0 — 2026-06-17

- Phase 152 affix wiring ships: `Equipment` now exposes structured `prefixId`, `suffixId`, `prefixName`, and `suffixName` for mobile and other consumers.
- `dropItem` now applies rarity-based affix defaults: uncommon = one prefix or suffix, rare = prefix + suffix, unique = fixed/non-procedural.
- `dropItemWithAffixes` shares the same construction path and preserves affix provenance while folding modifier payload into resolved stats/passives/procs/resources.
- Equipment templates are trimmed to three base entries per slot/family plus five curated affixed variants per slot/family.
- Public surface snapshot refreshed for the affix factory exports and expanded Equipment shape.
- Mobile needs: bump to `axiomancer-mechanics@0.22.0`, use structured affix fields, and do not parse prefix/suffix truth from `item.name`.

## 0.21.0 — 2026-06-14

- Quest Board encounter ("The Boy's Almanac") ships as the story-quest board game: sandboxed board session, `quest` MapEvent kind, board id handoff, and completion outcome tier.
- Quest Board micro-games replace repeated binary gates with distinct quick verbs: press-your-luck GATHER, grit DUEL, braced SNAG, escalating MARKET, gated PARLEY, and light HEARTH/CACHE/OMEN pacing.
- Rest encounter ("The Night Watch") and Loot-cache encounter ("The Reliquary") graduate from passive grants into engine-owned minigames/procedures.
- `ResolvedEvent` rest payload carries `healFraction` with `healed`; literal rest fixtures must include the new field.
- Mobile needs: bump to `axiomancer-mechanics@0.21.0`, present engine-owned encounter state, and avoid local simulation of board/rest/loot-cache rules.

## 0.18.0 — 2026-06-13

- Hazard codex library: 150 cards total (108 new, all reward-pool; starter
  bands hold) with six new mechanics — PURGE, TRANSMUTE, MEND, BOUNTY, WARD,
  ANCHOR.
- Gathering CLI (`npm run gathering`): seeded manual/auto play with JSON
  events and JSONL state logs, mirrored on the hazard driver.
- gathering-tuning skill: the gleaning balance loop guarded by the
  greed < restraint < skill sim bands.

## 0.17.1 — 2026-06-12

- Restored the deprecated character-preset exports dropped in 0.17.0
  (standing rule 9; live mobile consumer).

## 0.17.0 — 2026-06-12

- Hazard v2 rules ported byte-faithfully from mobile; the package is now the
  source of truth for the minigame (mobile keeps UI only).
- New Gathering minigame, "The Gleaning": GLEAN/STRIP stances, WRATH meter
  with reprisals and eruption, offerings/grace, tools, boons, family sets,
  plus a policy sim guarding greed < restraint < skill.
- Tuning pipeline: matrix builder honours the Phase 136 contract (seeded
  enemy picks, multiplicative focus weights, per-cell bands); resource
  economy analysis; friendship-route tuning.
- Test gates: test files now type-checked (fifth verify gate) after 263
  silent drifts were repaired; hermeticity guard suite enforces the testing
  standard mechanically.
- Removed dead export isValidCombatAction.

## 0.16.0 — 2026-06-10

Hazard minigame mobile-consumer release: publishes the Hazard doctrine/API docs with the npm package and documents the top-level Hazard public surface for downstream clients.

- **Hazard docs:** adds `docs/hazard-minigame-api.md` with import examples, legal state-machine order, route/card/dice contracts, scoring, presenter guidance, and v0 caveats.
- **Package contents:** includes Hazard docs plus release docs in the published npm tarball so consumers can read integration guidance from the package.
- **README:** updates install guidance for the published npm package and calls out Hazard exports.
- **Mobile needs:** bump to `axiomancer-mechanics@0.16.0`; use top-level imports only; preserve engine-owned Hazard state, dice, route thresholds, card effects, and scoring; run typecheck, verify, focused presenter tests, and visual smoke around the Hazard screen.

## 0.15.1 — 2026-06-08

Balance/resolution hardening release for the manual mobile-build line: Phase 122–126 enemy balance, gear-tier counterweight, stronger status effects/skills, status-effect-driven victory/friendship resolution, public effect-resolution helpers, and the recent skills/equipment content expansion.

- **Phase 122** — Level-1 enemy outliers retuned into the 65–75% resolution-success target band.
- **Phase 123** — `enemyStatBudget(level, difficulty)` export plus `ENEMY_GEAR_TIER_*` gear-tier counterweights for late-game balance.
- **Phase 124** — Core status effects and skills strengthened through per-effect intensity/duration levers.
- **Phase 125** — `getEffectsResolutionOutcome(combatState)` export; saturation-yield resolves as `'friendship'`, DoT erosion resolves as `'victory'`.
- **Phase 126** — Follow-up status-effect threshold and potency tuning after T's override: DoT threshold 5→3, debuff intensity threshold 8→6.
- **Content expansion** — ~20 new skills and a larger equipment/item template library are present for downstream presentation and tuning.
- **BREAKING/cleanup:** `clearTier1EffectsForType` removed from the public barrel; use `clearTier1EffectsForStance`.
- **Mobile needs:** bump package to `axiomancer-mechanics@0.15.1`; make active effects prominent; preserve engine-owned Stance, Vitae, affordability, action resolution, and status-resolution truth; use `getEffectsResolutionOutcome` rather than local threshold math; run typecheck, focused combat/effects/items tests, verify, visual smoke, and manual playthrough evidence.

## 0.15.0 — 2026-06-06

Balance/content release for the mobile catch-up line: Stance and Vitae authority
hardening, reproducible Stance/Vitae and mid-game playtest evidence, northern-forest expansion, story
NPC dialogue, Tier 3 description polish, synergy walkthrough coverage, and the
three-anchor Sage balance scaffold.

- **Phase 112** — Mechanics owns Stance state, Vitae/resource generation and spending, action affordability, and report output; consumers must not simulate the flow locally.
- **Phase 113** — Stance/Vitae playtest evidence plus STRATEGIST witness for resource-and-stance routing and patience controls.
- **Phase 114** — Second northern-forest enemy class family with new roster/content patterns.
- **Phase 115** — Story NPC dialogue expansion with alignment-facing branches.
- **Phase 116** — Difficulty-curve doctrine spec for target bands and evidence rules.
- **Phase 117** — Northern-forest map grows to 25 nodes with new event pools, branches, dead-ends, and loop structure.
- **Phase 118** — Tier 3 fallacy skill descriptions enriched; mechanics unchanged.
- **Phase 119** — Mid-game reference playtest probe and `wanderer-level-6` preset support.
- **Phase 120** — Synergy-skills walkthrough coverage for player-experience-tier validation.
- **Phase 121** — Three-anchor Sage balance scaffold/tuning with per-policy 25-run evidence.
- **Mobile needs:** bump package to `axiomancer-mechanics@0.15.0`; preserve engine-owned Stance and Vitae truth; refresh northern-forest/story/enemy presentation fallbacks; run typecheck, focused Jest, verify, visual smoke, and playtest evidence.

## 0.14.0 — 2026-06-03

Mobile catch-up release: combat contract repairs, unlocked-skill access,
reference playtest fixtures, v0.13.0 deprecation removals, Befriend-as-Heart-skill
mercy choice, region consequences, and boss-Befriend faction reputation shifts.

- **Phase 96** — BattleLogEntry contract validation for complete player/enemy action fields.
- **Phase 97** — `previewStatAllocation` public API for level-up/stat-preview UI.
- **Phase 99** — Unlocked-skill access: `knownSkills` + affordability replace `equippedSkills` gating.
- **Phase 101 / 107** — Coastal Tyrant mercy-route tuning + 65–75% per-playstyle resolution-success doctrine.
- **Phase 102** — Befriendable-enemy Tier-2 expansion (7 total befriendable enemies).
- **Phase 103** — Combat re-trigger lock clears after victory/friendship/defeat.
- **Phase 104** — Reference playtest fixtures for early-game and endgame balance checks.
- **Phase 108** — Befriend is a Heart skill with a 5-heart-token attempt cost and mercy/exploit choice.
- **Phase 109** — Region consequence state for elite/miniboss Befriend outcomes.
- **Phase 110** — Faction reputation system and boss-Befriend reputation deltas.
- **BREAKING:** `getResistStat` and legacy `endCombat*` aliases removed after v0.13.0 deprecation.
- **Mobile needs:** bump package to `axiomancer-mechanics@0.14.0`; render `regionConsequences` and `factionReputationShift`; replace `equippedSkills` gates; wire Befriend as a choice-bearing Heart skill.

## 0.12.0 — 2026-05-26

Skills always-land mechanic shift + event system cleanup.

- **Phase 80** — Skills always-land effects (direction (a) pure split): Tier 2 debuffs + Tier 3 effects always land, target-resist rolls removed
- **Phase 84** — Skill "fizzle" event + UX scrub: `SkillEvent` cleanup with `effect-resisted` → `buff-fumbled` rename
- **Phase 88** — Effect coverage audit sweep + library consolidation
- **Phase 89** — Front-door docs fold-in for mobile consumer guidance
- **BREAKING:** `EffectApplicationResult.rebounded` field removed, `SkillEvent` variant renames
- Public-surface: 233 fixtures (+8 from v0.11.0), 158 types (stable)
- 615/615 tests passing, verify + deploy gates clean

## 0.11.0 — 2026-05-23

Friendship-mechanic expansion + GH#65 mobile aftermath trio.

- **Phase 68** — Per-enemy `BefriendabilityConfig` predicate
  (override of the Phase 36 friendship-eligibility check); first
  boss-tier authored config on `CoastalTyrant`.
- **Phase 69** — `FriendshipReward.alignmentDelta` extension; closes
  Spec 14 Q4 (friendship-victory ↔ alignment-cube intersection).
- **Phase 70** — Boss-tier `friendshipReward` content authoring on
  `CoastalTyrant` (`paradox-loop` unique + xpBonus 75 + multi-
  paragraph narrative + combined-axis `alignmentDelta` + `flagSet`).
- **Phase 71** — Per-foe aftermath narrative prose
  (`finalBlowLines` / `pactLines` / `causeLines` on `Enemy`).
  Closes GH#65 ask 1.
- **Phase 72** — Run-loop semantics: `store.resetRun({ keepCharacter })`
  + required `GameState.runId` + `generateRunId` helper +
  `STARTING_REGION` constant. `GAME_STATE_VERSION` bumped 5 → 6
  with `migrateV5toV6`. Closes GH#65 ask 2.
- **Phase 73** — Codex / journal-entry surface: required
  `GameState.codex` slice + per-foe `Enemy.journalEntry?` +
  `store.unlockCodexEntry` + auto-firing wire on friendship
  outcomes. `GAME_STATE_VERSION` bumped 6 → 7 with `migrateV6toV7`.
  Closes GH#65 ask 3.

Public surface delta: **+5 type exports** (`FinalBlowLines`,
`PactLines`, `CauseLines`, `CodexEntry`, `CodexState`) +
**+2 runtime exports** (`generateRunId`, `STARTING_REGION`).
Fixture 233+161 → **235+167**. Tests 670 → **697**.

## 0.10.3 — 2026-05-20

Befriendable-enemy content + Tier 2 synergy skills + quest-branch
wiring.

- **Phase 60** — `Enemy.friendshipReward?: FriendshipReward`
  (`items` / `xpBonus` / `narrative` per-enemy reward content).
  Two authored normal-tier befriendable enemies (`MournfulGull` +
  `HollowEyedBeggar`).
- **Phase 62** — `FriendshipReward.flagSet?: string` quest-branch
  wiring through existing `DialogueChoice.requires.flag` machinery.
- **Phase 66** — Tier 2 synergy skills (5 patterns + `SkillSynergy`
  + `SynergyPredicate` clause).

Public surface delta: 158 → 161 type exports.

## 0.10.2 — 2026-05-20

`PersistenceAdapter` ergonomics + CI verify-on-PR + enemy rotation
content sweep.

- **Phase 55** — `PersistenceAdapter` ergonomics (closes mobile
  GH#64 Issue 3).
- **Phase 56** — CI verify-on-PR workflow (GitHub Actions).
- **Phase 57** — Enemy skill rotation content sweep (7 of 16
  registry enemies now carry authored skills).

## 0.10.1 — 2026-05-20

Release-process artifacts + public-surface snapshot machinery.

- **Phase 52** — Release process artifacts (`RELEASING.md` +
  `scripts/deploy-check.mjs`).
- **Phase 53** — Public-surface snapshot
  (`scripts/snapshot-public-surface.mjs` +
  `scripts/diff-public-surface.mjs` + the
  `scripts/public-surface.expected.json` fixture deploy-gate
  contract).
- **Phase 54** — Spec 05e set items implementation.

## 0.10.0 — 2026-05-19

First release under the autonomous-loop era. Engine handoff for
mobile consumption (closes GH#64 Issues 1 + 2).

- **Phase 50** — Engine handoff: `skillLibrary` top-level
  re-export + `getSkillById` + hermetic public-barrel test;
  rename `types.d.ts` → `types.ts` × 10 files; deploy-check count
  guard.
- **Phase 51** — Autosave throttling: `DURABLE_ACTIONS` gate
  ensures only durable mutations fire `adapter.save()`
  (`COMBAT_ROUND` / `LEVEL_UP` / `END_COMBAT` / `MOVE_TO_NODE` /
  `APPLY_DIALOGUE` / `SAVE_GAME`).

Removed: `getCoastalMap` (replacement: `getMapDefinition(...)` +
`createMapState`). Migration notes in CHANGELOG `[0.10.0]`
`### Removed` block.

## 0.9.0 — 2026-05-16

Phase 39 + 40 agent-vitest reporter (`automation/agent-vitest-reporter.mjs`)
+ `failures[]` extension + slowest-failure callout.

## 0.8.0 — 2026-05-16

Phase 37 (shop economy) + Phase 38 (named-NPC dialogue authoring).

## 0.7.0 — 2026-05-15

Phase 36 (friendship-victory mechanics — `outcome: 'friendship'` on
`combat:ended`, half-XP grant, full loot, +1 moralMeter).

## 0.6.0 — 2026-05-15

Phase 34 (docs sweep) + Phase 35 (`Character.id` auto-generation via
`getRng()` — RN-safe, no `crypto` dependency).

## 0.5.0 — 2026-05-13

First post-loop content release: Phase 23 (MapEvents engine + node
discovery) + Phase 24 (MapEvents content) + Phase 25 (legacy
MapEvent surface removal).

## 0.2.0 — 2026-05-08

First published npm release (pre-loop). Specs 01 through 12
shipped + Phases 09 through 22.
