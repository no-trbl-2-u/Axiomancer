# Mechanics divergences

Generated: 2026-06-23
Commit: f6b5bb3

## Summary
- Total divergences: 6
- High: 2
- Medium: 3
- Low: 1

---

## Divergences

### DIV-MECH-001 — Game CLI combat tab drives legacy `resolveCombatRound`, not Hazard-Pattern Combat
- Severity: High
- Owner: mechanics
- Status: **resolved** — Phase 165 shipped `src/CLI/combat.cli.ts` (`feat(cli): Phase 165 — agentic Hazard-style combat CLI`, commit `3ed4755`, 2026-06-23). The new CLI drives `initializeCombatEncounter` / `playCombatCard` / `resolveCombatPhase` / `processBetweenPhases` from the Hazard-Pattern Combat engine; reachable via `npm run combat` (also `npm run game -- combat`). The legacy Combat tab in `game.cli.ts` remains as a dev-only option. Confirmed: `src/CLI/combat.cli.ts` exists; `npm run combat` alias in `package.json`.
- Evidence:
  - `src/CLI/game.cli.ts:7-15` (header comment): "Combat — drives `resolveCombatRound` against the active encounter."
  - `src/CLI/game.cli.ts` (import line ~52): `import { isCombatOngoing, determineEnemyAction, resolveCombatRound, ... } from '../Combat';`
  - `src/CLI/game.cli.ts` (usage): `resolveCombatRound(...)` is the only combat resolver called from the Combat tab.
  - No call to `initializeCombatEncounter`, `playCombatCard`, `resolveCombatPhase`, or any Hazard-Pattern Combat API in `game.cli.ts`.
  - `CLAUDE.md` line 27: "the legacy turn-based `resolveCombatRound` now backs only the dev-only legacy combat tab".
  - 12 test files still cover `resolveCombatRound` (legacy resolver), vs 4 test files covering Hazard-Pattern Combat.
- Why it matters:
  The game CLI is the primary developer witness for "can the game be played." If it only surfaces legacy combat, no one can interactively drive Hazard-Pattern Combat (the player-facing system per doctrine). The `/combat-tuning` tuner uses `simulateHazardPatternCombat` as its witness, but there is no interactive CLI path to verify the card-and-dice experience end to end by hand. CLAUDE.md explicitly marks `resolveCombatRound` as "dev-only legacy combat tab" — but no CLI surface drives the new system.
- Proposed next action:
  Add a Hazard-Pattern Combat tab (or a sub-mode on the existing Combat tab) to `game.cli.ts` that calls `initializeCombatEncounter` / `playCombatCard` / `resolveCombatPhase`. The legacy tab may remain as a dev convenience.
- Follow-up phase/issue candidate:
  File a phase: "Phase 165 — Hazard-Pattern Combat interactive CLI harness." High priority.

---

### DIV-MECH-002 — Hazard minigame (World/Hazard) is incompatible with mobile v2 rule surface
- Severity: High
- Owner: both
- Status: open
- Evidence:
  - `docs/hazard-v2-vs-mechanics-divergence.md` (2026-06-11, authoritative): catalogues 10+ rule incompatibilities between `src/World/Hazard/` (mechanics) and `../axiomancer-mobile/state/hazard/` (mobile's living engine).
  - Key gaps: mechanics phase order is `reveal→hand→route-select→cast→play→...`; mobile is `route-select→rolling→playing→...` (opening hand visible before route, dice cast at route selection).
  - Card/dice identity mismatch: mechanics uses `A01–A14`, `R01–R06`; mobile uses named ids (`steps`, `footing`, `r_crown`, etc.).
  - Dice colour mismatch: mechanics `red/blue/purple/gold/x/x`; mobile `red/blue/purple/gold/gold/hex` (gold is wild in mobile; not in mechanics).
  - Mobile card staging, explicit apply/lock, salvage, per-round momentum carry are absent in mechanics.
  - `docs/hazard-v2-vs-mechanics-divergence.md:211`: "Mobile still carries the living Hazard v2 rules locally ... cannot yet replace the mobile engine."
  - `src/World/Hazard/e2e/hazard.engine.test.ts` exists but tests against mechanics' own (incompatible) model.
- Why it matters:
  Mobile is currently running a duplicate engine that the mechanics package should eventually own. Until mechanics ports the mobile v2 rule surface, mobile cannot consume the package for the Hazard minigame. Any mechanics Hazard work that diverges further from mobile's authoring/balancing widens the gap and delays consolidation.
- Proposed next action:
  The upstreaming checklist in `docs/hazard-v2-vs-mechanics-divergence.md:213-223` is the authoritative task list. A dedicated "Hazard v2 port" phase is needed. Decision: T must confirm whether mechanics should own the v2 surface before mobile can delete its local engine.
- Follow-up phase/issue candidate:
  Promote `docs/hazard-v2-vs-mechanics-divergence.md` upstreaming requirements as a dedicated phase or set of phases. Requires T decision on sequencing.

---

### DIV-MECH-003 — `docs/combat.md` frames Hazard-Pattern Combat as additive/secondary, not primary
- Severity: Medium
- Owner: mechanics
- Status: **resolved** — fixed in iterate (`c3f24cc`; docs/combat.md Overview rewrite, 2026-06-23)
- Evidence:
  - `docs/combat.md:482`: "A second, additive combat driver that ships **alongside** `resolveCombatRound`".
  - `docs/combat.md:9`: The Overview section leads with `resolveCombatRound` and the legacy resolver pipeline — no mention that Hazard-Pattern Combat is the primary system.
  - `CLAUDE.md` lines 14-28 and `plan/bearings.md` both state Hazard-Pattern Combat is the primary player-facing system; `resolveCombatRound` backs the "dev-only legacy combat tab" only.
  - The framing mismatch means the first thing a mobile or external developer reads in `docs/combat.md` teaches the wrong mental model.
- Why it matters:
  Mobile workers reading `docs/combat.md` as the API reference will prioritise the legacy resolver over the live system. The doc is the wrong source of truth for mobile integration.
- Proposed next action:
  Rewrite the `docs/combat.md` Overview section to lead with Hazard-Pattern Combat as the primary system. Demote `resolveCombatRound` to a "Legacy / dev-only" subsection early in the doc. Small, high-value doc-only change.
- Follow-up phase/issue candidate:
  Suitable for a single iterate commit. No new phase needed.

---

### DIV-MECH-004 — `dotFactor` / `controlFactor` vestigial fields remain in ~60 authored threat-phase literals
- Severity: Medium
- Owner: mechanics
- Status: **resolved** — removed in iterate (critique-84 LOW-2 drain)
- Resolution: Removed `dotFactor?` / `controlFactor?` from `AuthoredThreatPhase` interface (`src/Combat/combat.threat.ts`) and all 213 occurrences from `combat.threat-sequences.ts`. Updated `skills/combat-tuning.md` and comment blocks. TypeScript confirms clean compilation.

---

### DIV-MECH-005 — First-level CLI walkthrough uses legacy `resolveCombatRound` for encounter combat
- Severity: Medium
- Owner: mechanics
- Status: open — **DIV-MECH-001 block lifted** (Phase 165 shipped 2026-06-23; see above). The fishing-village walkthrough can now be updated to enter Hazard-Pattern Combat. No dedicated phase filed yet; candidate for next `/oversight` or `/expand` pass.
- Evidence:
  - `automation/scripts/walkthroughs/fishing-village-exploration.json` and `.goal.md`: walkthrough drives the Map tab to fv-15, triggers an encounter (MournfulGull), then issues 2-3 `defend` round actions via the legacy Combat tab.
  - `automation/scripts/walkthroughs/fishing-village-exploration.goal.md:16-18`: "The combat that fires at fv-15 is **not** graded on outcome — the script issues 2-3 defend rounds then quits."
  - The walkthrough proves the map route and encounter trigger (MapEventKind `encounter`, enemySlug `mournful-gull`) but drops into legacy combat, not Hazard-Pattern Combat.
  - `src/Game/e2e/spec08.engine.test.ts` (all 14 tests green): confirms the fishing-village map traversal, encounter triggers, quest completion, and hazard tick — but uses `resolveCombatRound` for round resolution.
  - No walkthrough or e2e test drives the Hazard-Pattern Combat path from a live map encounter.
- Why it matters:
  "Can The Kid walk the first level and enter Hazard-style combat?" is explicitly named in the phase brief as requiring explicit classification. The answer is: the map traversal and encounter trigger work; the combat surface that fires is legacy, not Hazard-Pattern Combat. The Hazard-Pattern Combat engine is tested in isolation (4 e2e test files) but never driven from a map encounter trigger in any e2e or walkthrough.
- Proposed next action:
  Once DIV-MECH-001 (CLI Hazard harness) ships, update the fishing-village walkthrough to enter the Hazard-Pattern Combat surface. The encounter trigger already fires correctly.
- Follow-up phase/issue candidate:
  Phase 165 shipped (DIV-MECH-001 resolved). File a dedicated phase or iterate-tier task to update the fishing-village walkthrough to use `combat.cli.ts` for Hazard-Pattern Combat.

---

### DIV-MECH-006 — Spec 25 spec file still describes the removed two-pressure-track model
- Severity: Low
- Owner: mechanics
- Status: **resolved** — fixed in iterate (`f35ee34`; SUPERSEDED caveat added to `specs/25-hazard-pattern-combat.md`, 2026-06-23)
- Evidence:
  - `docs/combat.md:491-492`: "note: that spec's two-pressure-track narrative is superseded by the HP-only model shipped 2026-06-22 — `VISION.md` → Combat vision is canonical."
  - The `specs/25-hazard-pattern-combat.md` spec file itself has not been updated to reflect the HP-only model (the doc reference is the evidence; the spec file carries the old two-pressure-track win-condition narrative).
  - `skills/combat-tuning.md:18-26` re-documents the HP-only model accurately.
  - `src/Combat/e2e/hazard-pattern-combat.engine.test.ts:13` still uses "victory via DoT Erosion" as a test suite name — a holdover from the old terminology (though the test itself is correct: it verifies HP drops to 0 via status, which is the live mechanic).
- Why it matters:
  A new worker reading `specs/25-hazard-pattern-combat.md` sees the old model and may re-introduce pressure tracks or mis-implement a win condition. Low risk because `VISION.md` and `CLAUDE.md` are canonical and workers are instructed to read them first, but the spec file is actively misleading.
- Proposed next action:
  Add a prominent caveat header to `specs/25-hazard-pattern-combat.md` marking the two-pressure-track model as superseded and pointing at `VISION.md` → Combat vision and `docs/combat.md` as authoritative. Optionally rename the test suite from "victory via DoT Erosion" to "victory by HP depletion via status play" for doctrinal clarity.
- Follow-up phase/issue candidate:
  Suitable for a single iterate commit. No new phase needed.

---

## CLI first-level capability classification

**Verdict: partial.**

- Map traversal (fv-1 → fv-11 → fv-14 → fv-15) works correctly via the game CLI Map tab and is proven by `spec08.engine.test.ts` and the fishing-village walkthrough.
- Encounter triggers fire at fv-15 (MournfulGull, MapEventKind `encounter`) — confirmed by test coverage.
- The combat surface that fires from the encounter is the **legacy** `resolveCombatRound` resolver (attack/defend stance actions), not Hazard-Pattern Combat.
- No CLI path exists to exercise Hazard-Pattern Combat (card-and-dice, `initializeCombatEncounter`, Conviction, Signature Skills) interactively from a map encounter.
- Hazard-Pattern Combat is tested in isolation (31 engine tests + balance sim pass, all green) but never from the live game-store / map-encounter entry point.

**Gap:** A Hazard-Pattern Combat CLI harness is missing (DIV-MECH-001 / Phase 165 candidate).

---

## Non-divergences checked

- **HP-only win condition** — confirmed implemented and live. `CombatPressureTracks` removed from source. `isDefeated(enemy)` is the sole resolution path in Hazard-Pattern Combat. `docs/combat.md` Hazard section correctly states this.
- **`dotFactor`/`controlFactor` are not consumed by the engine** — `combat.engine.ts` does not read them. Vestigial only (see DIV-MECH-004 for cleanup recommendation).
- **fishing-village map nodes and encounter pool** — `src/World/Continents/Coastal-Village/maps.ts` and `src/World/MapEvents/content.ts` are consistent. The 25-node grid is authored; encounter pools are registered; the spec08 e2e test drives the whole traversal and passes.
- **Hazard-Pattern Combat engine tests all green** — `hazard-pattern-combat.engine.test.ts` (31 cases), `hazard-pattern-combat.balance.sim.test.ts` (4 cases including DoT-beats-basic-attack doctrine test) pass.
- **Public barrel exports Hazard-Pattern Combat** — `src/index.ts` exports `initializeCombatEncounter`, `playCombatCard`, `simulateHazardPatternCombat`, `CombatEncounterState`, and related types. Package is ready for mobile consumption of the Hazard-Pattern Combat engine.
- **`narration` MapEventKind** — registered and covered in `src/World/MapEvents/content.ts` (fv-14 narration node). CHANGELOG 0.32.0 confirms it shipped.
- **Starting-map balance** — CHANGELOG 0.32.0 confirms the fishing-village rebalance (8 encounter / 4 rest / 4 gather / 3 hazard / 3 loot-cache / 1 narration / 1 interaction / 1 quest + 1 boss) shipped.
- **AUDIT.md pending findings** — zero pending findings. All rows are `[x]` resolved.
- **CLI e2e test** — `src/CLI/e2e/game.cli.engine.test.ts` (11 cases, all green). Tests cover bootstrap, dev-tools, I/O mode — not combat round resolution (consistent with "logic in reducers, not CLI" doctrine).
- **Pressure terminology purged** — CHANGELOG 0.32.0 confirms the rename: `effectPressure`→`effectImpact`, `projectCardPressure`→`projectCardImpact`, `CombatCard.track`→`.effectKind`, dead events removed.

---

## Commands run

- `git diff --check` — pass (no whitespace errors)
- `npx vitest run src/CLI/e2e/game.cli.engine.test.ts src/Game/e2e/spec08.engine.test.ts` — **pass** (14/14)
- `npx vitest run src/Combat/e2e/hazard-pattern-combat.engine.test.ts src/Combat/e2e/hazard-pattern-combat.balance.sim.test.ts` — **pass** (41/41)
- `git rev-parse HEAD` → `f6b5bb3`
- Source grep: `resolveCombatRound` in `*.test.ts` → 12 files (legacy coverage); `simulateHazardPatternCombat|initializeCombatEncounter|playCombatCard` in `*.test.ts` → 4 files (Hazard coverage)
- Source grep: `CombatPressureTracks|pressureTrack|DoT Erosion|Control Saturation` in `src/**/*.ts` → 4 files (all in engine type comments / test suite names, not active logic)
- Source grep: `dotFactor|controlFactor` in `src/**/*.ts` → `combat.threat-sequences.ts` (213 hits, authored data) + `combat.threat.ts` (type definition marked vestigial); `combat.engine.ts` → 0 hits (not consumed)
