# 01 — Build plan

> Style guardrails for every phase below. Always ship tests
> alongside code — never "add tests later". Hermetic e2e at the
> highest public entry point. Break work into small, focused
> modules with their own tests. Prefer 5 small files with clear
> names over 1 dense file. Scope the verify gate to the touched
> workspace (see `plan/bearings.md` § Verify gate).

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Status vocabulary: `[ ]` pending
-> `[x]` shipped (with commit hash); `[skipped]` (set only via
`/oversight`); `[blocked: <reason> <date>]` (set by
`ship-a-phase` on a phase-shaped failure — `/march` skips it,
`/oversight` unblocks it); `[-]` partial-with-carry-overs.
Tick in this file in the same commit that ships the phase.

**Already shipped (pre-loop):**
- [x] Phase 0 — nexus methodology adoption (unified loop harness,
      gates, plan/, this build plan) — `chore: adopt nexus methodology`

**Next up (autonomous loop's queue):**

**Field evidence blockers (direct T promotion):**
- [x] Phase 14 — First-map route audit and survivorship semantics:
      fix `game.cli --route` map evidence so Fishing Village coverage
      is honest, full-map coverage is available through an explicit
      audit lane, and post-defeat traversal is not reported as clean
      survivorship (mechanics; promoted 2026-07-04 from Kid report)
      — `feat(cli): classify first-map route coverage and survivorship`

**Calibration (small, low-risk — prove the loop works in this repo):**
- [x] Phase 1 — Combat test-coverage backfill: add the missing
      funded-path (success) e2e coverage for
      `sig-overwhelming-argument` and any HP kill-path with zero
      population-level witness (mechanics; test-only, low risk;
      exercises the mechanics verify gate + CI-green deploy gate)
      — `test(mechanics): backfill funded-path combat kill-path coverage — phase 1` (0af106ff)

**Engine depth (status-effect doctrine):**
- [x] Phase 2 — Projected-lethality readout API
      (`projectCombatOutcome` -> "DoT kills in N phases",
      amplify/execute ready) to make the status kill-path legible
      (mechanics; spec 30 draft)
      — `feat(mechanics): projected-lethality readout API — phase 2` (128659e0)
- [x] Phase 3 — Enemy combat-phase progression / "rage mode"
      (`unlockAfterRound` threat phases) so long fights get
      qualitatively harder and fast status finishes are rewarded
      (mechanics; doctrine-central)
      — `feat(mechanics): enemy rage-mode threat phase — phase 3` (e87559d0)
- [x] Phase 4 — Balance-sim population witnesses for the HP
      kill-paths still lacking pop-level coverage
      (Conclusion/BODY-sig, Execute finish, escalation clock)
      (mechanics; test-only)
      — `test(mechanics): population witnesses for execute + escalation clock — phase 4` (d9763659)

**Mobile surfaces (presenter-only, low engine risk):**
- [x] Phase 5 — Village SELL tab: surface the engine's
      `sellItem` / `defaultSellPrice` (Phase 37) that has no
      mobile consumer (mobile)
      — `feat(mobile): village SELL tab — phase 5` (98e7b2bc)
- [x] Phase 6 — Memoir run-history surface: read-back of deaths
      (`hazardDeathCount` helper, currently unconsumed) +
      keepsakes (mobile; presenter-only)
      — `feat(mobile): memoir REMAINS section — phase 6` (48d2c802)
- [x] Phase 7 — `combatMana` -> engine `combatResources`
      migration: retire the slice deprecated since Phase 105 but
      still load-bearing in StatusCard / HUD / actions (mobile;
      verify Phase 156 didn't already ship it first) — verified the
      migration already shipped (commit 6ef5f989, 2026-06-20);
      shipped the remaining dead-code + doc cleanup —
      `chore(mobile): retire dead combatMana slice + fix stale HUD comments — phase 7` (bdca1068)

**Content pipeline:**
- [x] Phase 8 — Northern Forest region content extension: verified
      the 10->25-node expansion already shipped pre-nexus; rescoped
      to the real gap — authored the three declared-but-unauthored
      quests (`get-to-forest`, `gather-wood`, `get-to-cave`) and
      added the missing `collect`-objective engine wiring —
      `feat(mechanics): author get-to-forest/gather-wood/get-to-cave quests — phase 8` (3bb6eeaa)
- [x] Phase 9 — Author the first real character/story/world specs:
      verified `specs/characters/C-01-the-sophist.md` and
      `specs/world/W-01-aporia-labyrinth-continent.md` (7ea06a6e)
      plus `specs/story/S-01-fishing-village-northern-forest-dilemmas.md`
      (6fa7f090) already satisfy this row; each folder's template
      defines "the first real spec is \*-01-\*.md" and all three
      exist as full records — recorded via
      `plan: phase 9 shipped — character/story/world specs already authored`

**Equipment / signature refactor (T-directed 2026-07-09 — a 5-phase
epic, phases 18-21 + 23 (22 was taken by the shipped CLI guardrail
phase); ship in order, each phase leaves `main` green + playable.
Promoted above phase 17 by T-direction 2026-07-09):**

The end state: a character wears **exactly 5 pieces across 3 slot
kinds — 1 weapon, 1 armor, 3 accessories** (an accessory is one of an
explicit extensible kind list — head, hands, feet, amulet, ring, charm
for now; torso wear is armor, NOT an accessory; the three positions
are interchangeable). Equipment is decoupled from effects and from the
procedural modifier/rarity/affix machinery; the only equipment is a
fixed set of **8 "signet" relic pieces** (2 weapons, 2 armor, 4
accessories), each granting **one** signature skill plus a **static
stat bump**. Signatures are no longer selected by archetype — they come
solely from the worn loadout, so the slot model IS the wear-cap and the
build choice (2 × 2 × C(4,3) = 16 loadouts). Briefs carry the full
decision log (see each phase file).

- [ ] Phase 18 — 5-slot equipment model (weapon / armor / accessory ×3).
      Collapse `EquipmentSlot` 7 → 3; `Character.equipment` becomes an
      `EquipmentLoadout { weapon, armor, accessories[≤3] }` with
      `SLOT_CAPACITY` semantics (fill-first-free, guarded no-op when the
      accessory row is full); `AccessoryKind` taxonomy (head | hands |
      feet | amulet | ring | charm, extensible); legacy head/hands/feet
      fold into accessory kinds and body folds into armor via
      `LEGACY_SLOT_MAP`; legacy templates/mod-pools/affix
      maps re-slot mechanically (dead content walking); capacity-aware
      `wornPerSlot` inventory convention; save migration v11→12; mobile
      character screen renders the 5 rows (both; breaking barrel change —
      all three gates) — brief:
      `plan/phases/phase_18_equipment_slot_consolidation.md`
- [ ] Phase 19 — Equipment-granted signatures + the 8 signet relics
      (retire archetype gating). Add `grantsSignature` to equipment and
      the 8 fixed relics typed into the phase-18 slots (2 weapon / 2
      armor / 4 accessory; one signature + a static stat bump each,
      incl. a new first-class `maxHp` stat modifier on the two armor
      relics), seed all 8 at creation (default 5 worn), and flip
      `initCombatEncounter` to derive `signatures` from the worn loadout
      instead of `SIGNATURE_KITS[archetype]`. Save migration v12→13.
      The gate flip is inseparable from the signature-granting pieces,
      so user-intent phases 1+"the item carrier of 3" ship together here
      (both; mechanics-led) — brief:
      `plan/phases/phase_19_equipment_granted_signatures.md`
- [ ] Phase 20 — Decouple equipment from effects (static stat bumps
      only). Strip `passiveEffects` / `onHitEffects` / `onDefendEffects`
      / `resourceInteraction` / `critStyle` application out of the equip
      pipeline and its combat consumers so ALL equipment contributes
      only `statModifiers` (+ `grantsSignature`). User-intent phase 2
      (mechanics; verify mobile) — brief:
      `plan/phases/phase_20_equipment_effect_decouple.md`
- [ ] Phase 21 — Retire the procedural equipment library. Delete the 56
      templates + 7 uniques + the `dropItem`/roll/resolve/affix factory;
      the 8 relics become the whole library. Convert loot surfaces (The
      Reliquary, enemy drops, shops) to consumables/materials/currency;
      purge procedural gear from old saves (v13→14). User-intent phase 3
      remainder (both; large) — brief:
      `plan/phases/phase_21_retire_procedural_library.md`
- [ ] Phase 23 — Teardown of dead equipment machinery. Delete the
      modifier catalogue, the affix (prefix/suffix) library, item sets,
      the rarity model, the dead effect-channel types, the archetype
      signature vestiges, the phase-18 deprecated worn-convention
      wrappers, and the equipment-only effect definitions; prune the
      `@mechanics` barrel and reconcile docs/specs 05–05e as superseded.
      User-intent phase 4 + full teardown (mechanics; verify mobile +
      card-editor) — brief:
      `plan/phases/phase_23_equipment_machinery_teardown.md`

**Cross-cutting / debt:**
- [x] Phase 10 — Multi-screen integration test harness (Jest
      full-provider mounts + Playwright web flows) to close the
      cross-screen regression blind spot (mobile; see AUDIT
      gotcha) — `test(mobile): cross-screen integration harness — phase 10` (7692758e)
- [x] Phase 11 — Tutorial / onboarding flow (GAMEPLAY_GAPS
      GAP-001: no guided intro) (mobile) — scoped to the Rest
      encounter (the smallest of four ungoached minigames; see
      `plan/phases/phase_11_rest_tutorial.md` § 0 and the Follow-ups
      below) — `feat(mobile): guided first-night rest tutorial — phase 11` (1fb1d7f8)
- [x] Phase 12 — Doc-sync pass: reconcile `spec.md` / `docs/combat.md`
      with the shipped engine surface; frame Hazard-Pattern
      Combat as primary everywhere (mechanics; docs) — collapsed the
      orphaned `axiomancer-mechanics/spec.md` duplicate to a pointer;
      fixed spec-32-v3 dead-API references in `docs/combat.md`
      (basePower/chipHp/DIRECT_DAMAGE_WEIGHT/GOLD_CARD_IDS) —
      `docs(mechanics): reconcile spec.md / docs/combat.md with spec 32 v3 — phase 12` (cb5c6467)
- [x] Phase 13 — Hazard v2 engine port (DIV-MECH-002, promoted via
      `/oversight` 2026-07-03): verified the port already landed —
      mechanics owns the full v2 engine under `src/World/Hazard/`
      (`hazard.engine.ts` `createHazardSession`, gold-wild powering,
      staged card instances + apply/lock, salvage, no-between-round
      recast, momentum carry, Perfect/Complete/Failure) with a
      `audit/` parity harness against the divergence catalogue; mobile
      deleted its local `state/hazard/{engine,types,content,sim}.ts`
      and now consumes `@mechanics` from `store-actions.ts`. Content
      parity confirmed (all 6 named hazards + 11 starter + 8 reward
      cards + crack resolve in mechanics). Recorded this tick —
      `plan: phase 13 shipped — hazard v2 port verified already landed`
- [x] Phase 15 — Hazard first-crossing tutorial (GAP-001 follow-up):
      guided first-run coach for the Hazard minigame, mirroring the
      Rest/Gathering/Combat tutorials. Teaches route/stage/power/apply/
      resolve via a pinned seed (3, cracked-cliff); FORETELL out of
      scope (brief: `plan/phases/phase_15_hazard_tutorial.md`) (mobile)
      — `feat(mobile): guided first-crossing hazard tutorial — phase 15` (0e03ee02)
- [x] Phase 16 — Loot-Cache ("The Reliquary") first-delve tutorial
      (GAP-001 follow-up): guided first-run coach for the Reliquary,
      mirroring the Rest/Gathering/Hazard tutorials. Teaches begin/
      delve/push/card/outcome via a pinned seed (1, modest tier, 4
      currency); Insight (STEADY THE HAND) out of scope (brief:
      `plan/phases/phase_16_reliquary_tutorial.md`) (mobile)
      — `feat(mobile): guided first-delve reliquary tutorial — phase 16` (95f67302)
- [ ] Phase 17 — Quest Board ("The Boy's Almanac") first-session
      tutorial (GAP-001 follow-up), mirroring the Rest/Gathering/Combat
      tutorials (mobile)

**CLI verification guardrail (T-directed 2026-07-09):**

- [x] Phase 22 — Mechanics CLI verify-gate coverage. Added
      `tsconfig.cli.json` + `npm run type-check:cli` (wired into
      `verify`/`verify:agent`); fixed the real stale-call type errors it
      surfaced in the existing CLI e2e tests; added a real-process smoke
      suite (`cli.process-smoke.engine.test.ts`) spawning `npm run
      combat` / `npm run game -- --route` as child processes; added a
      docs/registry parity test (`cli.docs-examples.engine.test.ts`) and
      fixed two stale `docs/cli.md` enemy examples (CoastalTyrant/
      HushWraith, long retired) — brief:
      `plan/phases/phase_22_cli_verify_gate.md`
      — `feat(mechanics): CLI verify-gate coverage — phase 22` (01a3d2ed)

> **After the queue drains:** `/march` transitions to `/iterate`
> — draining `plan/AUDIT.md` + `plan/CRITIQUE.md`, doc-drift,
> `as any` clusters, hex-literal -> AXM migration, a11y, and
> file-length extraction. `/expand` grows the queue from
> accumulated signals.

---

## Per-phase scope

Detailed briefs live at `plan/phases/phase_<N>_<topic>.md`. If a
brief is missing when the loop reaches its phase, it generates one
per `skills/plan-a-phase.md` from the scope line above + the
canonical sibling (a prior shipped phase of the same shape) +
`plan/bearings.md`.

### Phase 1 — Combat test-coverage backfill

Add hermetic e2e coverage at the mechanics public entry point for
`sig-overwhelming-argument`'s funded (success) path and any HP
kill-path lacking a population-level witness. Test-only; no engine
behavior change. Canonical sibling: the existing
`src/Combat/e2e/*.engine.test.ts` suites. Deliberately small — it
is the calibration run that proves the mechanics verify gate + the
CI-green deploy gate work end-to-end before ambition.

### Phases 2–12

See the status rows above; generate briefs on demand.

---

## Carry-overs / known gaps (update as phases ship)

(Empty until phases ship. Add `[-]` rows for partial-but-shipped
phases with linked notes here.)

## Phase log (commit hashes)

- phase 0 — (adoption commit) — nexus methodology adopted
- phase 1 — 0af106ff — combat test-coverage backfill (sig-overwhelming-argument funded-path victory witness)
- phase 5 — 98e7b2bc — village SELL tab (sellVillageItem action + presenter sellables/hasShop)
- phase 6 — 48d2c802 — memoir REMAINS section (death tally via hazardDeathCount + merged Rest/LootCache keepsake read-back)
- phase 4 — d9763659 — balance-sim population witnesses (execute finisher + escalation clock; Conclusion/BODY-sig already had coverage)
- phase 9 — 7ea06a6e / 6fa7f090 — character/story/world specs (C-01 the Sophist, W-01 the Aporia, S-01 fishing-village dilemmas; already shipped pre-tracking, recorded this tick)
- phase 13 — (port pre-tracking; mechanics `src/World/Hazard/` + `audit/` parity harness, mobile `state/hazard/store-actions.ts` consumer) — hazard v2 engine port verified already landed, mobile duplicate deleted, content parity confirmed; recorded this tick
