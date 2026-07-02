# 01 — Build plan

> Style guardrails for every phase below. Always ship hermetic
> Jest tests alongside code — never "add tests later". Break
> work into small, focused components in folders. Pure helpers
> (presenters, store adapters) go in their own modules with
> their own tests. Prefer 5 small files with clear names over 1
> dense file. Engine logic stays in `axiomancer-mechanics`.

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Format: `[ ]` pending → `[x]`
shipped (with commit hash). Tick in this file in the same
commit that ships the phase.

**Already shipped (pre-loop, prior history):**

- [x] Spec 01 — Test harness setup (`jest-expo` +
      `@testing-library/react-native`, hermetic-test standard
      in `docs/testing.md`). See `specs/01-test-harness-setup.md`
      `[DONE on 2026-05-11]`.
- [x] Spec 02 — Engine store integration (Zustand store wrapping
      `createGameStore`; `<GameStoreProvider>`, `useGameState`,
      `useGameActions`, typed action wrappers). See
      `specs/02-engine-store-integration.md` `[DONE on
      2026-05-11 — see commit efef5f5]`.
- [x] Spec 03 — Presenter layer contract
      (`select<Screen>ViewModel(state, localUi?) → ViewModel`,
      `docs/presenters.md`, 5 `*.engine.ts` stubs + e2e shape
      tests, route-tree guard, deep-freeze invariant). See
      `specs/03-presenter-layer.md` `[DONE on 2026-05-12 — see
      commit e378f99]`.
- [x] Spec 04 — Combat screen wiring (canonical sibling for
      every later screen-wiring phase). See
      `specs/04-combat-screen-wiring.md` `[DONE on 2026-05-12]`.
- [x] Spec 05 — Character screen wiring
      (`selectCharacterViewModel`, `app/(tabs)/character/`
      route folder, read-only stat surface). See
      `specs/05-character-screen-wiring.md` `[DONE on
      2026-05-13 — see commit 4afb4ed]`.
- [x] Spec 06 — Inventory screen wiring. See
      `specs/06-inventory-screen-wiring.md` `[DONE on 2026-05-13]`.
- [x] Spec 07 — Exploration screen wiring. Implementation
      landed in commit `06fc907` ("Exploration spec
      implementation"); spec doc flipped to `[DONE on 2026-05-13]`
      in commit `527f021` as part of phase 2's audit close-out.
- [x] Spec 09 — AsyncStorage persistence adapter
      (`createAsyncStorageAdapter`, `schemaVersion` migration
      runner, debounced writes, preload-before-mount in
      `app/_layout.tsx`, 15 hermetic e2e). See
      `specs/09-asyncstorage-persistence.md` `[DONE on
      2026-05-13]` and `plan/phases/phase_7_asyncstorage_persistence.md`.

**Next up (autonomous loop's queue):**

- [ ] Phase 161 — Combat card overhaul: finish UI polish to all-critics-shippable. Filed by T direct steering 2026-06-28 from the combat-overhaul critic loop (rounds 1-3 shipped on main `d019b0a..ffc8c8f`; stopped at 1 minor-polish / 4 needs-work). Close the residual UI nits the critics flagged: END-PHASE/SCRAP occlusion at the fan edges, card-art proportions + any mid-card band residue, a dice drag-hover highlight before release, and per-channel animation polish (hitstop, sequenced cause->effect, status-keyword floats). Iterate (a critic round or hand-polish) until the critics have ~no negatives. Brief: `plan/phases/phase_161_combat_card_polish_to_shippable.md`. Verification: CombatBoard / CombatEncounterPanel / CombatCombatantPane tests + `npm run typecheck` + `npm test`; `npm run verify:visual` + a fresh `scripts/combat-shots.mjs` capture (visual phase). Source: T Telegram steering 2026-06-28.

- [ ] Phase 162 — Surface the 0.34.0 build-around cards in play. Filed by T direct steering 2026-06-28. mechanics 0.34.0 ships 7 new build-around cards (Breach/VULNERABLE, Resonance Rupture, Mounting Contradictions/COMPOUND, Brazen Rebuttal/THORNS, Gabriel's Bulwark/BARRIER, Briar Riposte, Leeching Syllogism/SIPHON) + Pyrrhic Victory/EXECUTE, and mobile lights them up honestly (commit `ffc8c8f`), but they live only in the reward pool — a player rarely encounters them. Make them reachable (starter-bundle inclusion or per-archetype reward weighting) and add a playtest/visual witness that a player can draft + play Breach/Rupture and see VULNERABLE/RUPTURE light up. Brief: `plan/phases/phase_162_surface_034_buildaround_cards.md`. Verification: `state/combat/store-actions.ts` + reward-presenter tests + a hermetic e2e that the new cards are reachable + `npm run typecheck` + `npm test`. Source: T Telegram steering 2026-06-28.

- [ ] Phase 160 — Skills ≠ Cards mobile copy boundary. Filed by T direct steering 2026-06-27 to remove legacy-combat vocabulary from the mobile combat/deck/dev surfaces: skills are always-available token-used effects, while cards are Hazard-style deck/hand/reward objects. Audit player copy, accessibility labels, presenters, dev menu deck preset wording, tests, and docs so cards are not called skills and skill unlock/resource surfaces still use skill correctly. Brief: `plan/phases/phase_160_skills_cards_mobile_copy_boundary.md`. Verification: copy/presenter tests + `git diff --check` + `npm run typecheck` + `npm test -- --runInBand`; `npm run verify:visual` if visible combat/dev surfaces materially change. Source: T Telegram steering 2026-06-27.

- [ ] Phase 157 — Mobile divergence self-audit. Filed by T direct steering 2026-06-23. Produce repo-root `divergences.md` as an evidence ledger for where mobile is out of line with current mechanics truth, Hazard-style combat direction, first-level `fishing-village` route behavior, encounter trigger → in-place Hazard-style combat, and playtest/visual witnesses. Classify every row by severity and owner (`mobile`/`mechanics`/`both`/`T decision`), cite concrete files/tests/screens/logs, and explicitly decide whether current playtest doctrine proves the new first-level Hazard-style combat route or only legacy fallback. Brief: `plan/phases/phase_157_divergence_self_audit.md`. Verification: repo-root `divergences.md`, `git diff --check`, targeted map/encounter/EncounterModalOverlay tests; `npm run verify:visual` if visible surfaces are inspected or changed. Source: T Telegram steering 2026-06-23.

- [ ] Phase 156 — Combat resources mobile migration. Filed by T direct steering 2026-06-20 from `NEEDS_ATTENTION.md` §1. Delete the deprecated mobile-only `combatMana` slice as load-bearing state and repoint combat HUD, skill-affordability/display paths, dev resource controls, `DebugHudOverrides`, `DebugPlaythroughPresets`, and tests to engine-owned `CombatState.combatResources`. Do not simulate combat resources locally; mobile is presentation/control glue over mechanics truth. Brief: `plan/phases/phase_156_combat_resources_mobile_migration.md`. Verification: migrated presenter/dev-control tests + at least one hermetic e2e proving HUD/skill-affordability reads engine resources after dev adjustment + `npm run typecheck` + `npm test -- --runInBand` + `npm run verify`; run `npm run verify:visual` if visible resource rendering changes. Source: T Telegram steering 2026-06-20; `NEEDS_ATTENTION.md` §1.

- [ ] Phase 158 — Combat card compact glyphs + keyword chips. Filed by T direct steering 2026-06-24 after reviewing the new Hazard-style combat card surface. Add a structured combat-card keyword/glyph presenter layer and render clearer compact hand/staged/reward cards: direct-damage-only cards should use a sword/direct-damage affordance, status/DoT and control cards should use explicit keyword chips, and accessibility labels should speak the player-facing keywords rather than raw `effectKind`. Brief: `plan/phases/phase_158_combat_card_compact_glyph_keywords.md`. Verification: CombatBoard/reward-card tests covering damage, DoT/status, and control cards + `npm run typecheck`; run `npm run verify:visual` if layout shifts materially. Source: T Telegram steering 2026-06-24.

- [ ] Phase 159 — Combat card detail keyword glossary. Filed by T direct steering 2026-06-24 as the selected-card companion to Phase 158. Upgrade the selected combat-card detail modal to show Free and Powered action sections, visible keyword chips, and one-to-two sentence explanations for every displayed keyword; teach HP-only Hazard combat doctrine and status-effect value without resurrecting pressure-track language. Brief: `plan/phases/phase_159_combat_card_detail_keyword_glossary.md`. Verification: extracted detail-modal/component tests covering DAMAGE, DOT/status, and CONTROL explanations + `npm run typecheck`; run `npm run verify:visual` if layout shifts materially. Source: T Telegram steering 2026-06-24.

- [ ] Phase 155 — Affix-provenance labels on the inventory ItemCard (Phase 154 follow-up). Promoted via `/oversight` 2026-06-20 from expand pass 80 candidate [5.5], placed ahead of the Memoir queue per T's direction to refill with Phase-154 follow-ups first. Phase 154 moved all equipment logic to `axiomancer-mechanics@^0.24.0` (mobile is presentation-only) and deleted `state/presenters/equipDelta.ts` — so the only surface where a player could read an affix label is now gone. Surface engine-owned affix provenance directly on the always-visible item card: extend the inventory item view-model in `state/presenters/inventory.engine.ts` with structured affix-label fields read off the engine `Equipment` instance (`prefixName`/`suffixName`/`prefixId`/`suffixId` or their published 0.24.0 equivalents — confirm the exact field names against the 0.24.0 surface at ship time), omitted gracefully on common/unique/legacy saves; render an affix-label row on `ItemCard.tsx` beneath the item name keyed off the structured fields, never by parsing `item.name`. Composes with the Phase 135 rarity shine (shine = how rare, label = which affixes) and benefits `CombatVictoryPanel` for free (it reuses `ItemCard`). No engine changes; no affix simulation; no name parsing. Brief: `plan/phases/phase_155_affix_provenance_item_card.md`. Verification: inventory presenter + `ItemCard` hermetic tests + `npm run typecheck` + `npm run verify`. Source: expand pass 80 candidate [5.5], promoted via /oversight 2026-06-20.

- [ ] Phase 138 — Memoir inner tabs: Quests. Filed by T direct steering 2026-06-19 as the first of four Memoir inner-tab phases. Install the Quests / Alliances / Philosophy / Effects inner-tab scaffold, make Quests the default read-only tab, and move existing quest groups under it. Brief: `plan/phases/phase_138_memoir_inner_tabs_quests.md`. Verification: Memoir presenter/screen tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-19.

- [ ] Phase 139 — Memoir inner tab: Alliances. Filed by T direct steering 2026-06-19. Add a read-only Alliances tab for durable relationship/bond/alliance truth, using existing friendship/codex/faction state where available and honest empty states where not. Brief: `plan/phases/phase_139_memoir_inner_tab_alliances.md`. Verification: Memoir presenter/screen tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-19.

- [ ] Phase 140 — Memoir inner tab: Philosophy. Filed by T direct steering 2026-06-19. Move the existing moral/philosophical Measure surface into a clear read-only Philosophy tab, reading richer alignment truth if available and labeling provisional derivation honestly otherwise. Brief: `plan/phases/phase_140_memoir_inner_tab_philosophy.md`. Verification: Memoir/alignment tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-19.

- [ ] Phase 141 — Memoir inner tab: Effects. Filed by T direct steering 2026-06-19. Add a read-only Effects tab with collapsible Known/Unknown sections and accordion rows: collapsed rows show icon + name (or `???`), expanded known rows show what the effect does and what causes it, and unknown rows do not leak mechanics. Known effects are limited to what the player can currently cause or has encountered. Brief: `plan/phases/phase_141_memoir_inner_tab_effects.md`. Verification: Memoir/effect presenter + accordion tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-19.

- [x] Phase 154 — Mobile is presentation-only (equipment logic moved to engine). Shipped out-of-band via T's PR #476 (merged 2026-06-20, head `phase154-mobile-presentation-only`); recorded retroactively via `/oversight` 2026-06-20. Hands all equipment logic back to `axiomancer-mechanics`: DELETED the mobile logic modules now living in the engine (+ their tests) — `state/loot/affix-roll`, `state/cache/loot-table` (Phase 129's mobile loot table), `state/selectors/equipment`, and `state/presenters/equipDelta` (Phase 133's mobile equip-delta surface); REWROTE `state/dev/loot-rarity.ts` as a thin store-dispatch wrapper over the engine's `generateRarityDrop`; REPOINTED consumers to the engine (`equipmentFromTemplate` aliased `templateToEquipment`, worn-state, `computeEquipDelta` / `EquipDelta`); and bumped the dependency to `axiomancer-mechanics@^0.24.0` (0.23.0 was never published). Net −1677 / +83 across 22 files. Verification (per PR): `npx tsc --noEmit` clean; 46 Jest passed / 5 suites against published 0.24.0. Note: this widens the engine-version doc drift tracked by PHASE_CANDIDATES [4.5] (README/docs still cite 0.21.0/0.22.0 while package.json is now ^0.24.0). `[DONE on 2026-06-20 — see commit d652daf / PR #476]`. Source: T direct (out-of-loop PR).

- [x] Phase 136 — Dev loot rarity controls (commit 32e0e4b). Filed by T direct steering 2026-06-17 and promoted top of queue. Clarify POPULATE so it truthfully provides common/base registry gear + unique registry gear + consumables, because uncommon and rare are generated at drop time; add two dev menu buttons, `LOOT UNCOMMON` and `LOOT RARE`, that generate real uncommon/rare equipment drops and report item name, rarity, and affix count. Brief: `plan/phases/phase_136_dev_loot_rarity_controls.md`. Verification: populate + loot button tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-17.

- [x] Phase 137 — Full character update deltas for equip changes (commit 119c061). Filed by T direct steering 2026-06-17 as the next phase after dev loot rarity controls. Update the "updated stats" equip/swap/unequip section into a complete changed-only character-update preview: render every changed character-facing value caused by equip, unequip, or swap; green text for increases/new item values, red text for decreases/old item values; passive effects use red for old/removed item effects and green for new/gained item effects. Brief: `plan/phases/phase_137_full_character_update_deltas.md`. Verification: equipDelta presenter + EquipDeltaPanel + inventory e2e tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-17.

- [x] Phase 135 — Item rarity shine affordances (commit 6551482). Filed by T direct steering 2026-06-17 and promoted top of queue. Make loot rarity legible at a glance across inventory/reward item surfaces: uncommon items get a green shine for 1 affix, rare items get a blue shine for 2 affixes, and unique items get a red outline for 3 set-in-stone modifiers. Drive the treatment from `item.rarity`, not by parsing names or counting affix fields at render time; common stays plain; unique red outline must compose with WORN/equipped styling. Brief: `plan/phases/phase_135_item_rarity_shine_affordances.md`. Verification: `ItemCard` + aftermath reward tests + `npm run typecheck` + `npm run verify`. Source: T Telegram steering 2026-06-17.

- [x] Phase 134 — Mechanics 0.22.0 mobile catch-up. Shipped e6d9610. Bumped `axiomancer-mechanics` to `^0.22.0` and drained the affix-release fallout: the Phase 133 equip-delta surface (`state/presenters/equipDelta.ts`) now reads structured `prefixName`/`suffixName`/`prefixId`/`suffixId` off the `Equipment` instance (lights up on affixed drops, omits gracefully on common/unique/legacy saves, never parses names); Gathering/Hazard `sessionSeed` view-model fields + the screens' `introAckSeed` state widen from `number` to the engine's `SeedInput` (`string | number`); seed-coupled loot-table fixtures refreshed to 0.22.0 truth (rare drops arrive affix-backed — assert structured fields, not composed names; unique-roll seed re-pinned for the trimmed-library RNG stream); the L50 dev player-tier preset remapped off the removed dragon-tier template ids onto the surviving top-tier curated affixed L20 variants. Upgrade doc `docs/engine-upgrade-0.21.0-to-0.22.0.md` added. Do not simulate affixes locally and do not parse affix truth from item names. Brief: `plan/phases/phase_134_mechanics_0_22_mobile_catchup.md`. Verification: `npm run verify` green (lint 0 errors + typecheck + 2492 tests). Source: T Telegram steering 2026-06-17. `[DONE on 2026-06-17 — see commit e6d9610]`.

- [x] Phase 133 — Inventory equip-change delta surface. Shipped 8a46160 (mechanics 0.21.0). Pure `computeEquipDelta` helper (`state/presenters/equipDelta.ts`) compares a candidate against the worn sibling and emits gained/lost-only deltas across stats, rolled modifiers, passive effects, on-hit/on-defend proc hooks, resource interactions, and keyword/affix labels; the presenter fills `equipDelta` on every equipment row (equip→gained-only, unequip→lost-only, swap→gained+lost) and `EquipDeltaPanel` renders it in the expanded ItemCard with sulfur/blood treatments, hiding unchanged values and empty sections. Affix labels read structured `prefixName`/`suffixName`/`keywords` off the item instance and omit gracefully (mechanics v0.21.0 ships no affix provenance at the package root — Mechanics Phase 152); effect IDs resolve via `lookupEffect`. Hermetic coverage in `state/presenters/__tests__/equipDelta.engine.test.ts`, `state/e2e/inventory.engine.test.ts`, and `components/inventory/__tests__/ItemCard.test.tsx`. Brief: `plan/phases/phase_133_inventory_equip_change_delta_surface.md`. Source: T Telegram steering 2026-06-17. **Superseded by Phase 154 (2026-06-20):** the mobile `state/presenters/equipDelta.ts` module was deleted and `computeEquipDelta` / `EquipDelta` now resolve from `axiomancer-mechanics@^0.24.0`; the `EquipDeltaPanel` presentation layer remains, repointed at the engine.

> **Queue-drained steering (set via oversight 2026-06-13; updated via T steering 2026-06-15;
> post-126 directive added via oversight 2026-06-15; post-127 promotions via oversight 2026-06-16).**
> Phases 125–127 all shipped 2026-06-16, closing the accepted Hazard/combat UX runway. Expand
> pass 78 fired per post-126 directive; T promoted three mobile-actionable candidates at the
> next `/oversight` (2026-06-16): Phase 128 (hazard scar recovery), Phase 129 (loot-cache
> reward depth), Phase 130 (out-of-combat death stakes). Do not promote sub-4.0 cleanup
> candidates ahead of these accepted gameplay phases unless a blocking regression appears.

- [x] Phase 125 — Hazard reward choice confirmation overlay. Filed by T direct steering 2026-06-15. Reward-card choice needs a confirm button: tapping a reward card opens an overlay showing only the card, keywords, archetype, and current deck count where available; do **not** expose hidden fix/payoff/risk labels. Confirm commits the pick; cancel returns to the 3-card offer. Do not duplicate existing projection/apply behavior and do not add route-choice opening-hand hints. Brief: `plan/phases/phase_125_hazard_reward_choice_confirm_overlay.md`. Verification: focused reward overlay Jest + `npm run typecheck` + `npm run verify` + visual-smoke evidence or exact blocker. `[DONE on 2026-06-15 — see commit 8086b11]`.

- [x] Phase 126 — Hazard deck screen and remove-card grid. Filed by T direct steering 2026-06-15. Shipped a persistent inspect-only Hazard deck/library screen (`app/hazard-deck/index.tsx`, reachable from the SELF tab) + a tap-to-select remove-card grid overlay (`components/hazard/HazardRemoveGrid.tsx`). New presenter `state/presenters/hazard-deck.engine.ts` maps the durable deck (immutable starter bag + acquired reward/CRACK flags, all mechanics truth) into counts, colour/type/keyword distributions, and the acquired-only removable set. Per §3, deck mutation is NOT done locally: `axiomancer-mechanics` exposes no remove-card action, so the grid confirm surfaces a graceful blocked banner and leaves the save untouched (documented blocked integration point in `docs/hazard-v2-vs-mechanics-divergence.md`). Tests: `state/presenters/__tests__/hazard-deck.engine.test.ts` + `state/e2e/hazard-deck.screen.test.tsx`. `[DONE on 2026-06-16]`. Verification: `npm run verify` green (lint + typecheck + 2240 tests).

- [x] Phase 127 — Combat skill confirmation overlay and deterministic skill result UI. Filed by T direct steering 2026-06-15. Shipped a `SkillConfirmOverlay` (`components/combat/SkillConfirmOverlay.tsx`): tapping a skill stages it (local `pendingSkill` in `app/(tabs)/combat.tsx`) and opens a detail card — name, stance, cost, affordability, deterministic damage/effects/statuses (engine-owned `effectText`), and prose — with explicit COMMIT / CANCEL controls. COMMIT routes through the existing `setPlayerAction('skill', id)` + `resolveRound()` path; CANCEL clears with no side effects. The dice-roll tracker is removed from skill use: the action layer stamps `wasSkill` onto the resolve summary (`state/actions.ts`), the presenter lifts it to `vm.resolve.playerActionWasSkill` (`combat.engine.ts`), and `ResolvePanel` renders a deterministic doctrine banner (no dice imagery) on skill rounds while preserving roll UI for attack/defend. Enemy skill-answer display is **blocked**: mechanics 0.21.0 publishes no enemy-response event (`SkillPhaseEvent` carries player-cast outcomes only); documented in `docs/combat.md` pending mechanics Phase 150. Tests: `components/combat/__tests__/SkillConfirmOverlay.test.tsx`, presenter `playerActionWasSkill` cases + screen-flow open/cancel/confirm in `state/e2e/`. `[DONE on 2026-06-16]`. Verification: `npm run verify` green (lint 0 errors + typecheck + 2251 tests).

- [x] Phase 128 — Hazard scar recovery at inn rest (max-VITAE healing path). Promoted via
      `/oversight` 2026-06-16 from expand pass 78 [score 6.5]. `state/hazard/store-actions.ts`
      permanently applies `maxVitaeDelta -= HAZARD_MAXHP_SCAR` with no recovery path; the Rest
      encounter restores VITAE but never scarred max-VITAE. Shipped as a documented mobile adapter
      (the engine `RestOutcome` owns no max-VITAE field): the `maxhp` consequence now also records
      the actually-applied scar as a durable `hazard-scar:<n>` flag, and `claimRestOutcomeAction`
      mends those flags back into `maxHealth` and clears them when the night is inn-grade
      (`RestSession.baseHealFraction >= 1.0`); field-camp watches (`healFraction: 0.5`) restore
      current VITAE only and leave the scar intact. Recovered max never exceeds baseline. Inn-vs-camp
      rides on the existing `baseHealFraction` rather than a new event kind (documented design call).
      Brief: `plan/phases/phase_128_hazard_scar_recovery_inn_rest.md`. Tests:
      `state/e2e/hazard-scar-rest-recovery.engine.test.ts`. Divergence doc updated. Verification:
      `npm run verify` green (lint 0 errors + typecheck + 2353 tests). `[DONE on 2026-06-16 — see commit 676376f]`.

- [x] Phase 129 — Loot-cache reward depth — real loot/relic table over placeholder shillings.
      Promoted via `/oversight` 2026-06-16 from expand pass 78 [score 5.5]. `app/cache/index.tsx`
      ("The Reliquary") delve/probe/seal flow was built but rewards resolved to a static base-rarity
      roster (`templateToEquipment`, always `rarity: 'common'`, no rolled mods) plus flat shillings.
      Shipped `rollCacheLoot` (`state/cache/loot-table.ts`): a seeded, level-gated loot/relic table
      that consumes engine truth (`dropItem` rolling real rarity via `RARITY_WEIGHTS` + modifiers,
      drawn from `equipmentTemplates`/`uniqueTemplates`). NOT engine-gated — `dropItem` is root-exported
      (`dropItemWithAffixes` is absent at the package root in 0.21.0, documented in the module). A new
      `beginLootCache({ lootTable: { tier } })` option rolls the set when no explicit `items` are passed
      (authored items still win); the treasure-node branch in `state/actions.ts` opts in per locale
      (northern-forest = `rich` w/ 12% unique chance, fishing-village = `modest`). Empty eligible pool
      (level gate) → currency-only, never throws. Tests: `state/cache/__tests__/loot-table.test.ts` +
      `state/e2e/cache.loot-table.engine.test.ts`. Brief:
      `plan/phases/phase_129_lootcache_reward_depth.md`. Verification: `npm run verify` green
      (lint 0 errors + typecheck + 2384 tests). `[DONE on 2026-06-16 — see commit bbcd120]`.
      **Superseded by Phase 154 (2026-06-20):** the mobile `state/cache/loot-table.ts` module
      was deleted; loot-cache rolls now resolve through `axiomancer-mechanics@^0.24.0` (mobile
      is presentation-only for equipment/loot logic).

- [x] Phase 130 — Out-of-combat death + scar/curse consequence weight. Promoted via `/oversight`
      2026-06-16 from expand pass 78 [score 4.5]. Hazard `minhp` damage currently floors VITAE at 1
      with no true downside; risk/reward loop has no teeth. Define and wire the out-of-combat death
      (or severe-consequence) path for lethal hazard outcomes, consistent with the combat death/aftermath
      flow; respect engine-truth for the death model. A `/oversight` design call on lethality model
      may be needed before or during shipping. Brief: `plan/phases/phase_130_out_of_combat_death.md`.
      Verification: hermetic test confirms lethal hazard damage triggers the defined consequence path;
      `npm run verify` green. Shipped: a crossing whose net VITAE swing crosses the engine `isDefeated`
      threshold (`health <= 0`) routes through `resetRun({keepCharacter:true})` (combat-death parity),
      stamps a `hazard-death:` tombstone, and forfeits spoils; `died` surfaces on the claim result.
      `[DONE on 2026-06-17 — see commit 6f798ff]`.

- [x] Phase 131 — Dev menu Kid evidence presets (`cf55e66`). Filed by T direct steering 2026-06-16 after the Kid playthrough matrix discussion. Upgrade the dev menu into an evidence setup range for the Kid: player presets exactly `L1`, `L15`, `L30`, and `L50`, each with level-relevant skills and equipment; dev-only `add item by id` inventory injection; deterministic Hazard deck presets (starter baseline/control, early/late straightforward, early/late enchantment, early/late utility); and supported Hazard/Gathering/Combat seed/scenario controls. Keep `SHUFFLE FATE` as random variety, not evidence-grade. Brief: `plan/phases/phase_131_dev_menu_kid_evidence_presets.md`. Verification: focused dev preset/item/Hazard deck tests + `npm run typecheck` + `npm run verify` + visual evidence or exact blocker.

- [x] Phase 132 — Dev menu tab extraction. Filed by T direct steering 2026-06-16 after approving more dev controls. Move the noisy SELF dropdown dev menu into a dedicated dev-only tab/screen/route, preserve all existing buttons for T's later visual audit, group controls by purpose, and update Kid/dev harness docs from `SELF → DEV MENU` to the new route. Do not prune buttons in this phase. Brief: `plan/phases/phase_132_dev_menu_tab_extraction.md`. Verification: focused dev-route/navigation tests + existing dev control tests + `npm run typecheck` + `npm run verify` + visual evidence or exact blocker. Shipped: the SELF tab now carries a single dev-only `DEV TOOLS` link (`DevToolsLink`, gated by `isDevToolsEnabled()`); tapping it opens the new `/dev` route (`app/dev/index.tsx`), which renders every existing Debug* control grouped into audit-friendly sections (`DevToolsSections` — presets / encounter triggers / Hazard / Gathering / Combat / inventory & item / world & story / misc & system). No buttons pruned. Retired the now-unused `DevMenu` + `DebugComponentsLazy` wrappers. Docs updated (`docs/engine-upgrade-0.20.0-to-0.21.0.md`). Mirror: #436. `npm run typecheck` + `npm run verify` green (229 suites / 2389 tests); `verify:visual` blocked pre-existing on Metro/Node `configs.toReversed` config-load error (unrelated to this change).

- [x] Phase 104 — Mercy modal consumes engine truth only. Promoted above all else by Glanton cleanup 2026-06-04 after doctrine-alignment audit. Replace local friendship-threshold/modal/spare/exploit simulation with mechanics-emitted mercy state/actions/report truth; remove hard-coded exploit damage; preserve modal UX and accessibility. Brief: `plan/phases/phase_104_mercy_modal_engine_truth.md`. Verification: focused Jest + `npm run verify`. Shipped in commit ce59115.

- [x] Phase 105 — Engine-owned stat preview + combat resources. Promoted above normal queue by Glanton cleanup 2026-06-04. Replace local stat-preview math with mechanics `deriveStats` truth, remove/quarantine `lib/previewAllocation.ts`, and ensure combat resources/skill affordability read engine `CombatState.combatResources` rather than `combatMana` or local scaffolding. Brief: `plan/phases/phase_105_engine_stat_preview_and_resources.md`. Verification: focused level-up/combat presenter tests + `npm run verify`. Shipped in commit 9ec768a.

- [x] Phase 106 — Mechanics 0.14.0 mobile catch-up. `axiomancer-mechanics@0.14.0` is published to npm; mobile still pins `0.13.0`. Bump the package, drain compile/import drift, verify Phase 104/105 against the published package, wire consequence surfaces as needed, and refresh hermetic/visual evidence before the scheduled playtest. Brief: `plan/phases/phase_106_mechanics_0_14_mobile_catchup.md`. Verification: `npm run typecheck`, focused Jest, `npm run verify`, and `npm run verify:visual` or exact visual-smoke blocker. Shipped in commit 0257b19.

- [x] Phase 107 — Map node label display optimization. Promoted via oversight 2026-06-05 from phase candidates. Show exploration node labels only for unvisited nodes that are currently available choices; preserve accessibility and verify with focused exploration tests. Brief: `plan/phases/phase_107_map_node_label_display_optimization.md`. Shipped in commit 2085246.
- [x] Phase 108 — Combat engine TODO drain. Promoted via oversight 2026-06-05 from phase candidates. Resolve or formalize the three combat/mercy engine-integration TODOs in actions and presenters without reintroducing local mechanics simulation. Brief: `plan/phases/phase_108_combat_engine_todo_drain.md`. Shipped in commit 13ba71d.
- [x] Phase 109 — Stance card layout shrink-to-fit. Promoted via oversight 2026-06-05 from phase candidates. Fix combat modal stance-card clipping/truncation found by deep playtest F07 while preserving readability and touch targets. Brief: `plan/phases/phase_109_stance_card_layout_shrink_to_fit.md`. Shipped in commit 5728502.
- [x] Phase 110 — Stale paused phases resolution. Promoted via oversight 2026-06-05 from phase candidates. Clean up stale references to paused phases in build-plan documentation since phases 62d/62e were formally resolved via oversight 2026-06-04. Brief: `plan/phases/phase_110_stale_paused_phases_resolution.md`. Shipped in commit 34f2b53.
- [x] Phase 111 — EncounterModalOverlay component extraction. Promoted via oversight 2026-06-05 from phase candidates. Extract subcomponents/helpers from the large overlay component while preserving current behavior, accessibility, and modal tests. Brief: `plan/phases/phase_111_encounter_modal_overlay_extraction.md`. Shipped in commit ed1c5b1.

- [x] Phase 112 — Mechanics 0.15.0 mobile catch-up. `axiomancer-mechanics@0.15.0` is published to npm, tagged `v0.15.0`, and released at https://github.com/no-trbl-2-u/axiomancer-mechanics/releases/tag/v0.15.0. Bump mobile to the registry package, drain type/import drift, preserve engine-owned Stance and Vitae truth, verify northern-forest/story content presentation, and capture focused/visual evidence. Brief: `plan/phases/phase_112_mechanics_0_15_mobile_catchup.md`. Upgrade guide: `docs/engine-upgrade-0.14.0-to-0.15.0.md`. Verification: `npm run typecheck`, focused combat/exploration/story presenter Jest, `npm run verify`, and `npm run verify:visual` or exact visual-smoke blocker. Shipped in commit 892766d.

- [x] Phase 113 — Combat UX overhaul (design implementation). Promoted via oversight 2026-06-06 from phase candidate [4.2]. Implement the combat UX direction in `design/combat-ux-overhaul-prompt.md` (+ `design/combat-ux-overhaul.md`, landed 2026-06-04) to make numbers/icons legible and the choice→outcome flow decodable for first-time players, while preserving the existing aesthetic language and engine-owned mechanical depth. No local mechanics simulation. Brief: `plan/phases/phase_113_combat_ux_overhaul.md`. Verification: focused combat presenter/HUD Jest + `npm run verify`; visual evidence per `npm run verify:visual` or exact visual-smoke blocker. Shipped in commit 3e24267.

- [x] Phase 114 — Aftermath modals (design implementation). Promoted via oversight 2026-06-06 from phase candidate [3.5]. Implement the four post-combat outcome modal/screen artboards per `design/aftermath-modals-prompt.txt` (landed 2026-06-04), reusing established token mapping and matching the 2026-05-16 handoff look. Brief: draft via `/plan-a-phase phase 114`. Verification: focused aftermath/modal presenter Jest + `npm run verify`; visual evidence per `npm run verify:visual` or exact visual-smoke blocker. Shipped in commit b0d1463.

- [x] Phase 115 — Production component test coverage expansion. Promoted via oversight 2026-06-06 from phase candidate [3.0]. Add hermetic tests for highest-priority untested production components (StatBar, StanceGlyph, ToastHost, CombatEnemyPanel and peers in the 55-uncovered set) following existing test patterns, honoring the hermetic-test standard in `docs/testing.md`. Brief: draft via `/plan-a-phase phase 115`. Verification: new Jest suites pass + `npm run verify`. Shipped in commit 5f6c7b0.

- [x] Phase 116 — Token resource accumulation fix (issue #227, HIGH gameplay bug). Promoted via `/oversight` 2026-06-07 from phase candidate [4.5]. The token resource system never accumulates, so combat skills can never be cast — a core-mechanic blocker, user-spotted in `/critique` pass 18 and open since 2026-06-01. Suspected engine-vs-mobile boundary: verify the engine's per-round `combatResources` accrual is read and propagated through `state/presenters/combat.engine.ts` (and the combat-mana / token surfaces) rather than rendered as a static pool. Trace from `resolveRound` in `state/actions.ts` through the presenter to the CrucibleStrip / Token Crucible display; confirm whether the gap is a missing engine read, a stale mobile-side default pool (see Phase 49's `DEFAULT_POOL` stop-gap), or an engine release gap — if engine-gated, stop with an exact version/export blocker rather than simulating accrual locally. Brief: draft via `/plan-a-phase phase 116` (or flesh inline at ship time). Verification: focused combat presenter/resource Jest pinning round-over-round token accrual + skill affordability, then `npm run verify`. Single commit closes issue #227 (`Closes #227`). Shipped in commit aa320df.

- [x] Phase 117 — Large-component extraction refactor. Promoted via
      `/oversight` 2026-06-08 from phase candidate [3.5] (expand pass
      59). Three core files exceed 2× the folder median: `PhaseBottom.tsx`
      (~722 lines), `app/(tabs)/exploration/index.tsx` (~718 lines),
      `app/(tabs)/inventory/index.tsx` (~709 lines). Extract focused
      subcomponents/helpers into their own files (per the build-plan
      style guardrail — prefer 5 small named files over 1 dense one)
      while preserving current behavior, accessibility, and existing
      test coverage. No engine-boundary or mechanics changes; pure
      structural refactor. Pick the highest-yield file first; the
      others can follow as sub-ticks or sibling phases. Brief: draft
      via `/plan-a-phase phase 117` (or flesh inline at ship time).
      Verification: existing suites stay green + `npm run verify`
      (no behavior change expected); add render/coverage tests for
      any newly-extracted component lacking one. Shipped in commit 1e44988.

- [x] Phase 118 — Combat encounter re-trigger fix (issue #191, HIGH gameplay bug) `[027c657]`.
      Promoted via `/oversight` 2026-06-11 from phase candidate [9.0] (expand
      pass 68). Subsequent combat encounters fail to trigger after the first
      encounter is resolved — a core gameplay blocker spotted during actual
      play on 2026-05-25. Investigate encounter state persistence/reset logic:
      trace how `inEncounterModal`, `combat-mode`, and the event-pool/node
      consumed-state interact after combat resolution; identify whether the
      node is being permanently marked consumed, the encounter-modal session
      flag is not clearing, or event-pool selection is silently skipping
      already-seen nodes. Fix the root cause without re-introducing local
      mechanics simulation. Brief: `plan/phases/phase_118_combat_encounter_retrigger.md`.
      Verification: hermetic encounter-lifecycle Jest (encounter fires once →
      resolves → second encounter node fires) + `npm run verify`.
      Single commit closes issue #191 (`Closes #191`).

- [x] Phase 119 — Large-component extraction continuation (exploration + inventory) `[67943ab]`.
      Promoted via `/oversight` 2026-06-11 from phase candidate [6.0] (expand
      pass 64). Following Phase 117's successful PhaseBottom extraction,
      two remaining screens still exceed the guardrail: `app/(tabs)/exploration/index.tsx`
      (~717 lines) and `app/(tabs)/inventory/index.tsx` (~709 lines). Extract
      focused subcomponents/helpers into their own files per the Phase 117
      pattern while preserving current behavior, accessibility, and existing
      test coverage. No engine-boundary or mechanics changes; pure structural
      refactor. Brief: draft via `/plan-a-phase phase 119` (or flesh inline
      at ship time). Verification: existing suites stay green + `npm run verify`.

- [x] Phase 120 — Starting-map enemy composition tuning (difficulty entry fix). Promoted via
      `/oversight` 2026-06-11. User identified that the opening experience is too punishing
      because fishing-village enemies rubber-band to the player level — a level-1 player
      faces enemies that feel immediately overwhelming. The engine controls global level
      derivation, but mobile controls the *which* enemies appear via the event-pool
      registration in `state/exploration-maps/event-pools.ts`. Fix: weight the
      fishing-village encounter pool toward explicitly weak/introductory enemy slugs
      (e.g. `tidepool-crab` more heavily, reduce `coastal-tyrant` weight or restrict
      it to later nodes). Optionally per-node enemy overrides for the opening 2-3
      encounter nodes so the first fight is always a starter. Northern-forest can
      stay as-is or get a similar gentler pass. Brief: draft via `/plan-a-phase phase 120`
      (or flesh inline at ship time). Verification: hermetic test pins that the
      first fishing-village encounter node resolves a starter-tier enemy across 20
      seeded RNG samples; manual confirm that level-1 play feels survivable.
      Pairs with CRITIQUE [MED] difficulty row. Shipped in commit c7a7d3d.

- [x] Phase 121 — Mobile playthrough integration harness. Promoted via `/oversight` 2026-06-11.
      User observed that mechanical unit tests (Jest presenter/action suites) report
      everything green but manual play reveals integration gaps — the test harness
      doesn't catch wiring problems between engine state, presenter output, and UI
      rendering. Goal: scripted integration scenarios that exercise the *full player
      journey* end-to-end, from title screen detection through map movement,
      encounter trigger, combat action selection, round resolution, and aftermath,
      asserting observable state at each step rather than just presenter shape.
      Scope (one phase, multi-tick if needed):
      - Tick A: "new player journey" script — title screen shows for fresh state;
        first move on map fires an event; encounter trigger arms the modal.
      - Tick B: "combat lifecycle" script — prelude → FIGHT → round resolution
        (action + stance committed) → round advances → victory/defeat aftermath
        → modal closes → exploration resumes. Assert engine state *and*
        presenter output at each step.
      - Tick C: "re-trigger" script — second encounter node fires after first
        resolves; combat modal re-arms cleanly. (Regression guard for Phase 118.)
      Build on the `withAllProviders` harness from Phase 64; add a `simulatePlayerAction`
      helper that fires store actions and flushes React updates. Brief: draft via
      `/plan-a-phase phase 121` (or flesh inline at ship time).
      Verification: all scripted scenarios green + `npm run verify`. Shipped in commit 7b04698.

- [x] Phase 122 — Playtest-driven gameplay-gap discovery. Promoted via
      `/oversight` 2026-06-13 as the queue-drained direction (see steering
      note above). The build plan is fully shipped and remaining candidates
      are all sub-4.0 cleanup; this phase refills the queue with *substance*
      rather than polish. Run the `deep-playtest` agent (and/or `/critique`)
      to play the actual game as a first-time player end-to-end — title →
      map movement → encounter → combat lifecycle → aftermath → resume —
      documenting player-facing friction, flow gaps, and content thinness to
      `plan/PLAYTEST_REPORT.md`. Then file the surfaced gameplay gaps as
      `/expand` gameplay/content candidates in `plan/PHASE_CANDIDATES.md`
      (scored, with signals) so the next promotions are player-facing work,
      not cleanup. Deliverable is the report + at least the highest-signal
      gameplay candidates filed — NOT a code change. Brief: draft via
      `/plan-a-phase phase 122` (or run the playtester inline at ship time).
      Verification: `plan/PLAYTEST_REPORT.md` updated with this pass +
      new scored gameplay candidates present in `plan/PHASE_CANDIDATES.md`. Shipped in commit cb26742.

- [skipped] Phase 123 — ITEM-action disabled-state feedback (player-facing
      gap). Promoted via `/oversight` 2026-06-13 from open AUDIT finding [4.2],
      but ALREADY ADDRESSED on main by the `/iterate` loop in commit `529d4e5`
      (issue #384) before this phase could ship — a tooltip on the disabled
      ITEM action now explains item usage will be available in a future update.
      AUDIT finding [4.2] is closed. Skipped to avoid duplicate work (skipped
      via oversight 2026-06-13 — superseded by 529d4e5 during the same pass).

- [x] Phase 124 — Mechanics 0.21.0 mobile catch-up. `axiomancer-mechanics@0.21.0` `[ff48fcd]`
      is published to npm and tagged `v0.21.0`; mobile still depends on
      `^0.20.0`, which will not float to `0.21.0` under pre-1.0 semver. Bump the
      package, drain type/import drift from the new `quest` MapEvent kind and
      rest `healFraction` payload, and account for the engine-owned encounter
      procedures: Quest Board micro-game verbs, Rest / Night Watch, and
      Loot-cache / Reliquary. Mobile presents mechanics state and legal choices;
      it must not simulate board, rest, cache, reward, or outcome rules locally.
      Brief: `plan/phases/phase_124_mechanics_0_21_mobile_catchup.md`. Upgrade
      guide: `docs/engine-upgrade-0.20.0-to-0.21.0.md`. Verification:
      `npm run typecheck`, focused encounter Jest, `npm run verify`,
      `npm run verify:visual` or exact visual-smoke evidence, plus SELF/dev-menu
      trigger notes for Quest Board, Rest, and Loot-cache.

- [x] Phase 1 — Adopt nexus methodology. Shipped in commit
      `a703908` ("chore: adopt nexus methodology"); closed out
      in this commit.
- [x] Phase 2 — Fix engine API drift (verify-gate unblocker).
      Shipped in commit `527f021` ("Fix audit issues"); see
      `plan/phases/phase_2_engine_drift.md` for the retroactive
      brief. Verify gate is GREEN (185 / 185).
- [x] Phase 3 — Spec 02: Engine store integration. Shipped in
      commit `efef5f5` ("Engine store integration") on
      2026-05-11; see `plan/phases/phase_3_engine_store_integration.md`
      for the retroactive brief.
- [x] Phase 4 — Spec 03: Presenter layer. Shipped across
      commits `e56184e` (scaffolds + e2e stubs) and `e378f99`
      (contract doc + spec status) on 2026-05-12; see
      `plan/phases/phase_4_presenter_layer.md` for the
      retroactive brief.
- [x] Phase 5 — Spec 05: Character screen wiring. Shipped in
      commit `4afb4ed` ("feat(spec05): wire character screen to
      engine via selectCharacterViewModel") on 2026-05-13; see
      `plan/phases/phase_5_character_screen_wiring.md` for the
      retroactive brief.
- [x] Phase 6 — Spec 08: Event screen wiring. Shipped across
      four sub-ticks on 2026-05-15: Tick A presenter + store
      slice (`2c4d2b0`), Tick B action layer (`31e42f0`),
      Tick C screen refactor (`beba7d4`), Tick D close-out
      (this commit). Brief at
      `plan/phases/phase_6_event_screen_wiring.md`. All five
      Spec 08 product questions resolved
      (A / C / B / Future spec / Yes); two VM kinds
      (`combat-prelude`, `narrative-choice`); illustrations
      under `components/event/` (out of router tree);
      `eventActions.pickEventChoice` dispatches `applyDialogue`
      or `startCombat` per VM kind; `selectHasActiveEvent`
      reads engine truth; consequence chips + skip button
      shipped. Phase 19 closes as drained by Tick A (one-line
      `selectHasActiveEvent` flip). Verify green at 321 / 321.
- [x] Phase 7 — Spec 09: `AsyncStorage` persistence adapter.
      Shipped on main across commits `aa187cd` (e2e), `09bc44e`
      (specs / adapter / migrations) and `2f8ecea` (layout
      wiring), with this commit closing out the spec Q-answers,
      DoD ticks, and Phase log. See
      `plan/phases/phase_7_asyncstorage_persistence.md`.
- [x] Phase 8 — Spec 10: Navigation + app-shell polish (deep
      links, back behaviour, tab badges, splash → first screen
      handoff). See commit `6fc00dd`.
- [x] Phase 9 — Spec 11: Asset pipeline. Drain the SVG
      placeholder backlog via the existing
      `.cursor/skills/swap-asset-placeholder/SKILL.md` flow.
      One real asset per tick. `78006f1`
- [x] Phase 10 — Spec 12: Accessibility + theming polish
      (a11y labels, reduce-motion, font-scaling, large-text,
      dark-only confirmation). See commit `d5d5e5e`.
- [x] Phase 11 — EAS Build deploy-gate wiring. Replace the
      stub in `scripts/deploy-check.mjs` with a real EAS Build
      API poll (`https://api.expo.dev/v2/projects/<id>/builds`)
      keyed to HEAD's commit SHA. Document `EXPO_TOKEN` setup
      in `setup/02_eas.md` (new file). See commit `0f703d2`.
- [x] Phase 12 — App icon + splash screen polish (final assets,
      adaptive icons, splash background = `AXM.bg`). See commit `4e0fde5`.
- [x] Phase 13 — TestFlight + Play Internal Track first cut.
      Production EAS builds, store listings drafted, internal
      testers invited. See commit `e49f8db`.
- [x] Phase 14 — UI fixes: Character crash + Event tab → modal.
      Promoted via `/oversight` on 2026-05-14 (score 9.0).
      Implementation landed in commit `5dd597b` ("Bug issues");
      verified end-to-end against the brief's acceptance criteria
      by `/march` on 2026-05-14 and closed formally in this
      commit. Event screen lives outside `(tabs)/`, served by a
      `fullScreenModal` Stack.Screen with `EventGate` as the
      driver; `selectCharacterViewModel` null-guards on missing
      `derivedStats` / `nonCombatStats` with `?? {}` / `?? 0`.
      Verify gate green at 249 / 249. See
      `plan/phases/phase_14_ui_fixes.md`.
- [x] Phase 15 — Persistence migration: backfill missing engine
      state fields on save load. Promoted from
      `plan/PHASE_CANDIDATES.md` via `/oversight` on 2026-05-14
      (score 6.0). Add a `schemaVersion N → N+1` step that
      populates `derivedStats` / `nonCombatStats` from
      `attributes` / `archetype` (engine helpers if available,
      zero-fills otherwise). Drop the `(player as any)` casts
      and `?? 0` fallbacks introduced in Phase 14. See commit
      `c8e29a8`.
- [x] Phase 16 — Drain `combat.skills.fixture.ts` mock: wire
      engine skill selectors into the combat presenter. Shipped
      `eb95806` — `feat(spec16): wire engine skill selectors —
      drain combat.skills.fixture.ts mock`. New
      `state/selectors/combat-skills.ts` adapter exports
      `COMBAT_SKILLS` (engine library projected to mobile shape)
      + `getCombatSkillById`. Consumers (`combat.engine.ts`,
      `actions.ts`, two e2e fixtures, debug-seed test) all
      swapped imports. `state/mocks/combat.skills.fixture.ts`
      deleted. +10 hermetic tests; 875/875 green (was 865).
      Brief at `plan/phases/phase_16_engine_skills.md`.
- [x] Phase 21 — Engine-driven `executeSkill` wiring. Shipped
      `7a69658` — `feat(spec21): engine-driven executeSkill
      wiring`. Two changes in `state/actions.ts:resolveRound`:
      `skillLookup` swapped from `() => null` stub to the engine's
      `getSkillById`; `playerCombatAction` now passes
      `{ action: 'skill', skillId }` (was downgraded to
      `'attack'`). +2 hermetic cases pin the contract (mana
      drains by manaCost via the engine library; unknown skillIds
      tolerated). 877/877 green (was 875). Engine per-resource
      pools deferred (Tick C in the original brief; mobile single-
      mana model still satisfies the picker's insufficient-mana
      gating).
- [x] Phase 17 — Token Crucible: five-resource pool UI (port
      from design handoff). Shipped in commit `261a238`
      ("feat: Token Crucible — port five-resource pool UI from
      design handoff") on 2026-05-15. Added `app/crucible.tsx`,
      `components/TokenCrucible.tsx`, `components/tokens.tsx`,
      `state/mocks/tokens.fixture.ts`; touched
      `app/(tabs)/character/index.tsx`, `app/_layout.tsx`,
      `state/e2e/route-tree.engine.test.ts`. **Backfilled
      retroactively** via `/oversight` 2026-05-15 — the row
      exists for traceability; the feature shipped directly
      by the user from a design handoff outside the autonomous
      loop. Retroactive brief at
      `plan/phases/phase_17_token_crucible.md` — drafted via
      Phase 28 (commit `ab3912a`).
- [x] Phase 19 — `selectHasActiveEvent` real wiring. **Drained
      by Phase 6 Tick A** (`2c4d2b0`) — the rewrite of
      `state/presenters/event.engine.ts` flipped
      `selectHasActiveEvent` from `false` to a read against
      `state.event.pending` (plus a combat short-circuit per
      Spec 08 Q4). No standalone commit needed; the brief
      called this absorption out upfront.
- [x] Phase 23 — Migrate event subsystem from `processNode` /
      `ProcessNodeResult` to `resolveMapEvent` / `ResolvedEvent`.
      Shipped across four sub-ticks on 2026-05-15: Tick A type
      migration + fixtures (`f7d4212`), Tick B action layer
      rename `processCurrentNode` → `resolveCurrentMapEvent`
      (`3eb49c2`), Tick C screen render coverage for the five
      new kinds (`ec7b52c`), Tick D close-out (this commit).
      Restored verify from RED → 337 / 337. Brief at
      `plan/phases/phase_23_mapevents_migration.md`. Spec 08
      product answers (A / C / B / Future spec / Yes) carried
      through unchanged; VM shape stable; screen layer
      untouched. 8 engine kinds composed (encounter,
      interaction, gathering, rest, village, cutscene, hazard,
      loot-cache); new procedural illustrations for village /
      cutscene / hazard.
- [x] Phase 26 — Drain stale presenter stubs (audit gaps B, L,
      partially M). Shipped 2026-05-15 in this commit. Three
      drains in one tick: (1) `navigation.engine.ts` —
      `selectTabBadges` reads `selectHasActiveEvent` for the
      event badge and `player.experience` vs
      `experienceToNextLevel` for the level-up badge; both
      park on the character tab; `EMPTY_BADGES` reference
      stability preserved on the steady-state path; (2)
      `combat.engine.ts` — `STANCE_DERIVED` constant deleted;
      `buildStanceOptions` now reads `player.derivedStats`
      via the engine's three stat triples
      (`emotional*` / `physical*` / `mental*`), rounded at
      the mapper boundary; (3) `state/actions.ts` — file
      header rewritten (drops `0.3.0` reference and
      "engine Spec ~04" hedge); `skillLookup` comment names
      Phase 16 explicitly. +5 hermetic tests. Brief at
      `plan/phases/phase_26_drain_presenter_stubs.md`.
- [x] Phase 25 — Typed event surface consumer (engine 12 / 21
      catch-up). Shipped across two sub-ticks on 2026-05-15:
      Tick A emitter wiring + ring-buffer presenter
      (`3d2f497`), Tick B `useGameEvents` hook + close-out
      (this commit). Brief at
      `plan/phases/phase_25_typed_events.md`. Engine
      `createEventEmitter()` now flows through the mobile
      store; 10 typed events land in a mobile-private
      `_recentEvents` tail (capacity 20, newest-first).
      Consumers narrow via the engine's `is*Event` guards.
      The brief's original "drop bespoke severity inference"
      goal was revised at plan time — engine `combat:round`
      payload is `{state}` only, no per-event detail — so
      `summarizeRoundEvents` stays. Phase 25 wires the
      channel; specific consumers (level-up badge auto-clear,
      inventory feedback, dialogue cursor confirmation) ship
      as iterate rows.
- [x] Phase 27 — Exploration `moveToAction` migration to engine
      `revealAdjacent` / `markNodeConsumed`. Shipped 2026-05-16
      in this commit. Additive migration per the brief:
      `moveToAction` adds `revealAdjacent` after the legacy
      `worldUnlockNode` chain, populating the engine's parallel
      `discoveredNodes` field; `resolveCurrentMapEvent` adds
      `markNodeConsumed` after a non-`none` event resolves.
      `state/exploration-maps/types.ts` JSDoc names the new
      boundary ("visual-layout-only post-Phase-27"). +4
      hermetic e2e cases pin the new behaviour and no-regression
      on legacy fields. Screen + presenter migration deferred
      to a future Phase 30 TBD. Brief at
      `plan/phases/phase_27_exploration_migration.md`.
- [x] Phase 28 — Token Crucible retroactive brief + hermetic
      test coverage. Shipped 2026-05-16 in this commit. Three
      deliverables landed: (1) `plan/phases/phase_17_token_crucible.md`
      retroactive brief authored from commit `261a238` + the
      Claude Design URL; (2) `state/presenters/token-crucible.engine.ts`
      extracted with `selectTokenCrucibleViewModel`;
      `components/TokenCrucible.tsx` refactored to consume the
      VM; (3) `state/e2e/token-crucible.engine.test.ts` adds
      10 hermetic cases (VM shape, skill partition,
      `canAfford` matrix, deep-freeze invariant). Closes the
      bearings hard-rule violation that Phase 17 backfilled
      without tests-alongside-code. Brief at
      `plan/phases/phase_28_crucible_tests.md`.
- [x] Phase 29 — Typed-event consumers (level-up badge
      auto-clear, inventory feedback, dialogue confirmation).
      Promoted via `/oversight` 2026-05-15 (score 6.5). Shipped
      across 3 sub-ticks: Tick A `52a1803` (levelUp acknowledge
      flag + selectTabBadges predicate); Tick B `2845d34`
      (inventory action toast via `<ToastHost>` + pure mapper);
      Tick C `861ff7f` (event-modal ✓ flash on `dialogue:applied`).
      `useGameEvents` (Phase 25) carried the load — no new
      infrastructure. Verify: 371 → 382 tests across the phase.
      Brief at `plan/phases/phase_29_typed_event_consumers.md`.
- [x] Phase 30 — Hermetic render coverage + production bug fix
      pass. Promoted via `/oversight` 2026-05-16 in response to
      three user-observed runtime bugs the VM-shape suite did
      not catch. Shipped across 3 sub-ticks: Tick A (`5e24706`)
      shipped `state/e2e/smoke-render.engine.test.tsx` (15
      cases: no-throw / no-template-leak / non-empty body across
      five surfaces) and fixed the **character-tab crash** —
      `useGameState(selectCharacterViewModel)` was churning
      `useSyncExternalStore` because the presenter returned a
      frozen-new object every call (same pattern previously
      fixed in event screen); refactored to slim-slice + memo'd
      VM. Tick B (`ab9f646`) extracted `TAB_TITLES` to
      `state/presenters/tabs.engine.ts` and wired both `title:`
      and the defensive `tabBarLabel:` escape hatch on each
      `<Tabs.Screen>`. Tick C (`fb53af0`) added
      `vm.loadingMessage = 'the field stirs.'` and replaced the
      empty-View placeholder with visible copy. Absorbs and
      supersedes the original Phase 31 candidate (presenter-copy
      invariant guard) — the render harness catches that class
      as a strict superset. Verify: 391 → 410 across the phase.
      Brief at `plan/phases/phase_30_hermetic_render_coverage.md`.
- [x] Phase 31 — Tabs design pass (all-places register).
      Promoted via `/oversight` 2026-05-16 with explicit register
      pick from the user. Shipped in commit `542f7c9` — one-line
      presenter edit of `TAB_TITLES` thanks to Phase 30 Tick B's
      extraction. Strings flipped:
      `MAP · COMBAT · SHEET · SACK` →
      `WILDS · STRIFE · SELF · SACK`. Icons stay as-is (the new
      noun-icon pairing is coherent). Drains the long-deferred
      `[needs-user-call]` critique row from pass 2 (commit
      `d967f27`). Verify: 410/410 unchanged. Brief at
      `plan/phases/phase_31_tabs_design_pass.md`.
- [x] Phase 32 — UI refresh from Claude Design handoff (rolling
      port). Filed via `/plan-a-phase` 2026-05-16. Eight sub-ticks
      shipped A–H covering the highest-density slice of the
      design bundle (vendored at `design/handoff-2026-05-16/`):
      A `08bcf5e` event combat-prelude chrome, B `8c5f985`
      exploration step-cards, C `843f304` combat phase-stack,
      D `bf13539` encounter modal seam, E `2a23047` inventory
      Equipment Dock, F `cc38107` inventory slot filter, G
      `05127df` per-slot ItemGlyphs, H `d7489a2` exploration
      node toast. Closed via `/oversight` 2026-05-19 — further
      design-bundle work has been factored into discrete phases
      34–43 (one per remaining `design-spec.md` row) so /march
      can dispatch /ship-a-phase against each one without
      waiting for user port commits. Brief at
      `plan/phases/phase_32_design_refresh.md`.
- [x] Phase 33 — MEMOIR tab (journal: story / quests / alignment
      / philosopher-quote slot). Filed via `/plan-a-phase`
      2026-05-16. Adds a new fifth route at
      `app/(tabs)/memoir/index.tsx` — a journal surface
      summarizing story progress (recent typed-event chronicle),
      active + completed quests (`state.quests` QuestLog),
      moral + provisional philosophical alignment readouts
      (`state.moralMeter` + a placeholder mapping derived from
      highest base stat), and a slot for philosopher quotes
      (rendered null until exact alignments are defined). 4
      sub-ticks: route + tab registration + empty state (A);
      quests section (B); alignment readouts (C); story
      chronicle from `_recentEvents` (D). The philosopher-quote
      lookup is a follow-up phase, gated on the user defining
      alignments. **This is the deliberate navigation-phase
      commit** that adds a new route per bearings line 97-101
      ("route names do not [change] without a deliberate
      navigation-phase commit"). The bottom tab bar grows from 4
      visible tabs to 5 (WILDS/STRIFE pair + SELF + MEMOIR +
      SATCHEL; WILDS and STRIFE remain mutually exclusive). Brief
      at `plan/phases/phase_33_memoir_tab.md`. Shipped across
      four sub-ticks: A `6515cb5` (route + skeleton VM), B
      `2f70eac` (quests section), C `6105b90` (moral band +
      provisional philosophical alignment), D `9ccdee2`
      (chronicle from `_recentEvents`). Paused between B and C
      via `/oversight` 2026-05-16; resumed via `/oversight`
      after the event-surface critique cluster's HIGH row
      cleared (`994fb02`). Verify green at 459/459. The
      philosopher-quote slot stays `null` until exact alignments
      + a quote inventory are defined (follow-up phase).

**Design-spec drain queue (filed via `/oversight` 2026-05-19).**
Phases 34–43 are the ten un-ported surfaces enumerated in
`design-spec.md`, factored out of Phase 32's rolling-port
contract so `/march` can dispatch `/ship-a-phase` against each
one autonomously (no user-port-commit gate). Each phase brief
lives inline below; detailed scope + design-source pointers
remain in `design-spec.md`. Phase 44 is the loop-caught
regression check for the routing/gesture bug surfaced
2026-05-19 (commit `3a14f5f`).

- [x] Phase 34 — Routing + gesture regression check. Shipped via
      `state/e2e/route-registration.engine.test.ts` (new file, +5
      hermetic cases). Source-grep approach rather than
      router-mount: reads `app/_layout.tsx` + `app/(tabs)/_layout.tsx`
      as text, asserts (a) `GestureHandlerRootView` is imported
      from `react-native-gesture-handler` AND used as the
      outermost JSX wrapper in the returned tree; (b) every
      `<Tabs.Screen name="X">` value matches a real expo-router
      route ID computed from the actual file shape (`foo.tsx`
      → `foo`; `foo/index.tsx` → `foo/index`); (c) no
      `<Tabs.Screen name="X">` uses the short form when a
      folder route at `X/index.tsx` exists. Catches both
      classes that bit on 2026-05-19 (`3a14f5f`). Verify
      502/502 (was 497; +5).
- [x] Phase 35 — Inventory equip-preview stat deltas. Shipped:
      added `ReplacePreview` interface + `replacePreview: ReplacePreview
      | null` on `InventoryItemRow`. Presenter `buildRows` now
      runs a second pass that computes signed net deltas from
      `Equipment.statModifiers` (skips multipliers for v1) when
      a non-equipped equipment item has an equipped sibling in
      the same slot. Screen renders a blood-rail replace block
      on expanded ItemCards: REPLACES eyebrow, strike-through
      old name → arrow → new name, NET row of stat-delta chips
      (sulfur positive / blood negative). +6 hermetic cases
      pinning the contract (null on non-equipment / self-row /
      empty-slot; signed deltas; zero-drop; multiplier-skip).
      Verify 508/508 (was 502; +6).
- [x] Phase 36 — Inventory equip-replace label. Shipped: extended
      `ItemModalViewModel` with `replacingName: string | null`
      (structured data so the screen doesn't parse the label).
      New `findEquippedInSlot` helper returns the equipped
      sibling. `buildEquipmentModal` now ships
      `confirmLabel = 'EQUIP · REPLACE <NAME>'` when replacing,
      `'EQUIP'` when bare-slot, `'WORN'` when target is itself
      worn. Existing test reshaped to assert the new label;
      +1 new test for the bare-slot+WORN path. Verify 509/509.
- [x] Phase 37 — Inventory item slot tag. Shipped: small mono
      eyebrow `SLOT · <NAME>` on every collapsed equipment
      ItemCard (uses the existing `row.sub` field uppercased).
      Hidden when expanded (the expanded "WOULD EQUIP TO" /
      "EQUIPPED IN" block covers the same affordance more
      visibly) and on non-equipment rows. Ports `design/
      handoff-2026-05-16/project/screens/inventory.jsx:382-388`.
      Verify 509/509 unchanged (presenter contract untouched —
      slot tag reads existing `vm.row.sub`).
- [x] Phase 38 — Combat phase-stack collapse. Largely shipped
      via Phase 32 tick C — the `PhaseStackEntry.state`
      (`'past' | 'current' | 'future'`) + `summary: string`
      contract already drove the design's vertical-collapse
      behavior; the screen (`app/(tabs)/combat.tsx`) branches
      on `entry.state === 'current'` to render the body and
      keeps past rows as one-line header + summary. Discovery
      while closing this phase: the JSDoc claim that "action
      and skill are not buffered across phase changes" was
      stale — the engine preserves `playerChoice.action`
      across phase changes too, so past-action rows DO surface
      their committed value when the screen passes through
      `choosing_skill` / `resolving`. Close-out: +2 hermetic
      cases pinning past-action summary + future-row empty
      summary; JSDoc refreshed to match reality. Verify
      511/511 (was 509; +2). The skill-row summary still
      stays empty pending a library-label helper (follow-up
      to Phase 21 when engine skills land properly).
- [x] Phase 39 — Diegetic-stack backdrop opacity. Shipped: tuned
      `EncounterModalOverlay`'s backdrop fill from
      `rgba(10,10,10,0.85)` to `rgba(10,10,10,0.65)` so the
      exploration map shows through at ~35% visibility per
      chat 2 §IV ("map persists at 35% opacity behind every
      modal"). Mirrors the design's prototype.jsx:454 combat
      shell backdrop (0.6); ours is marginally darker so the
      panel border reads sharp on lighter map regions.
      Inline JSDoc cites the design source. Paced events
      were considered but currently render full-screen
      (`presentation: 'fullScreenModal'`); the diegetic-stack
      rework for paced is bigger and lives with Phase 40
      (event-shell audit). Verify 511/511 unchanged.
- [x] Phase 40 — Event-shell distinction audit. Audited not
      0-LOC after all: found a real shell-double-mount
      regression. `EventGate.tsx` was routing `router.push('/event')`
      on every active event regardless of kind, while the
      exploration screen separately mounted
      `<EncounterModalOverlay>` for `combat-prelude` events.
      The two shells would mount simultaneously when a
      combat-prelude fired. Fix: new presenter selector
      `selectHasActivePacedEvent` (false for combat-prelude;
      true only for narrative-choice). EventGate now reads
      the paced-only selector, leaving combat-prelude events
      entirely in the diegetic-stack path. +3 hermetic
      tests pinning the new selector contract. Verify
      514/514 (was 511; +3).
- [x] Phase 41 — Combat aftermath banner. Shipped: new
      `components/AftermathBanner.tsx` (parchment-on-panelBg
      panel, sulfur 1px border, 2500ms auto-dismiss timer
      matching the design's prototype). One-shot
      `lastOutcome` signal added to `state/combat-mode.tsx`
      (`'victory' | 'defeat' | 'flee' | 'parley'`) with
      `exitCombatWith(outcome)` + `clearLastOutcome()`
      API. Combat screen's `onContinueRound` branches on
      enemy.hp / player.hp / friendshipCounter to signal the
      correct outcome on the way out; early DEPART path
      stays silent (uses plain `exitCombat`). Exploration
      screen mounts the banner only for `'victory'` and
      `'parley'` outcomes (the IT IS DONE eyebrow fits
      both — copy varies: "The foe fell." vs "The foe
      yielded."). +6 hermetic combat-mode tests pinning the
      signal + auto-clear semantics. Verify 520/520 (was 514;
      +6).
- [x] Phase 42 — Combat-tab mutex extension. Shipped: new
      `selectHasActiveCombatPrelude` selector (true when
      there's a pending event AND vm.kind === 'combat-prelude').
      `(tabs)/_layout.tsx` now reads `inCombat ||
      hasCombatPrelude` and passes the OR'd value to
      `isTabHidden`, so the WILDS slot flips to STRIFE as
      soon as the encounter modal mounts — before the player
      commits FIGHT. Mirrors prototype.jsx:42
      `combatTabShown = route === 'strife' || modal?.kind
      === 'event-combat'`. +4 hermetic cases (paced/prelude
      mutual exclusion, mid-combat short-circuit). Verify
      524/524 (was 520; +4).
- [x] Phase 43 — Encounter modal boss kneel/strike variant.
      Shipped: `composeCombatPrelude` now relabels the two
      choice buttons when `isBoss` is true — FIGHT → STRIKE,
      FLEE → KNEEL. Choice IDs stay `'fight'` / `'flee'` so
      the screen's onFight/onFlee handlers still dispatch
      correctly. KNEEL stays engine-disabled (matches the
      current boss-blocks-flee semantics; no "submit to
      boss" mechanic exists yet). +2 hermetic cases pinning
      the label swap on boss vs the FIGHT/FLEE retention on
      non-boss. Verify 526/526 (was 524; +2). No engine
      surface gate needed — `isBoss` was already on
      `ResolveMapEventResult`.

**Second design-spec drain queue (filed via `/oversight`
2026-05-19, 5th call).** Three prototype micro-interactions
(`design-spec.md` items 11-13) plus three spot-check audit
phases for subtle deviations surfaced when the user asked
"any deviations from the claude design prototype?". The audit
phases ship 0-LOC fix-or-confirm reports unless something is
actually wrong, then a single follow-up port to the same
phase row.

- [x] Phase 44 — Modal enter animations. Shipped: rise (280ms
      ease-out, translateY 20→0 + opacity 0→1) on
      `EncounterModalOverlay` (separate animation on
      backdrop opacity vs panel transform) and
      `AftermathBanner`; fade (200ms ease-out, opacity 0→1)
      on the exploration `<NodeToast>` (extracted into its
      own component for clean mount-time animation). All
      three use `react-native-reanimated` `withTiming` +
      `useSharedValue` + `useAnimatedStyle`. Mirrors
      `prototype.jsx:632-638` keyframes. Verify 530/530
      unchanged.
- [x] Phase 45 — Event-modal action-button subtitles. Shipped:
      new `subtitle: string | null` field on `EventChoice`
      (distinct from existing `description` / `consequences`
      — pure chrome). Combat-prelude composer populates it:
      FIGHT = `'<roman level> · <roman hp> vitae · adv.
      unknown'` (lowercase-roman cost), FLEE = `'forfeit
      the path · -ii morale'` (non-boss) /
      `'sealed · no retreat'` (boss). All other VM kinds ship
      `subtitle: null`. Local `toRomanLowerEvent` helper
      (duplicates combat.engine.ts's private helper to avoid
      cross-presenter dependency). EncounterModalOverlay
      renders the subtitle under each label when non-null;
      existing fleeDisabledHint render guarded with
      `&& fleeSubtitle === null` so disabled-FLEE boss path
      doesn't double up. +3 hermetic cases (non-boss subtitle
      shape, boss flee subtitle, non-combat-prelude null
      check). Verify 533/533 (was 530; +3).
- [x] Phase 46 — Paced-event kind-meta variants. Shipped:
      refreshed eyebrow + title copy on all 5 paced-event
      composers to match the design's `kindToMeta` table
      (prototype.jsx:497-503). Specifically:
      `composeRest` 'A QUIET PLACE'/'THE FIRE LOWERS' →
      'A FIRE LOWERS'/'THE STONE HEARTH'.
      `composeItemBag(gathering)` 'A GATHERING'/'THE BRUSH
      YIELDS' → 'A SMALL HARVEST'/'A STAND OF MIRE-MINT'.
      `composeItemBag(loot-cache)` 'A FIND'/'THE CACHE OPENS'
      → 'A FOUND THING'/'A BURIED CHEST'.
      `composeInteraction` 'A VOICE' → 'INTERACTION' (title
      stays the engine NPC name).
      `composeVillage` 'A VILLAGE' → 'A SETTLEMENT'.
      Engine kind vocabulary checked — `gathering`,
      `loot-cache`, `interaction`, `village`, `rest` all
      present; no [needs-engine-release] gate. +1 hermetic
      case pinning the rest variant's new eyebrow + title.
      Verify 534/534 (was 533; +1).
- [x] Phase 47 — Stance-picker gloss copy audit. Audited not
      0-LOC: gloss copy wasn't present at all (StanceOption
      had no `gloss` field). Shipped: added `gloss: string`
      to `StanceOption`; new `STANCE_GLOSS` map
      (heart='parley, mercy', body='iron, force',
      mind='cipher, ruse'); `buildStanceOptions` populates
      it. Screen renders an italic-serif bone-color gloss
      line between the stance label and the BEATS/WEAK row.
      +1 hermetic case pinning the exact phrases. Verify
      535/535 (was 534; +1).
- [x] Phase 48 — EncounterModalOverlay panel position audit.
      Audit found a 4px drift: current panel was `top: 56,
      bottom: 80`; design ships `top: 56, bottom: 84`.
      Tightened `bottom` to 84 so the tab-bar inset reads
      identically to the design specimen. Inline JSDoc cites
      `prototype.jsx:456` and the chat-2 §IV diegetic-stack
      decision. Verify 535/535 unchanged.
- [x] Phase 49 — Token Crucible inline strip placement audit.
      Audit found the strip wasn't placed in combat at all
      (Phase 17 shipped the full `<TokenCrucible>` at the
      `/crucible` route + as a character-sheet integration,
      but the design's compact "above-the-action-picker
      strip with OPEN ▸ button" was missing). Shipped the
      port: new `<CrucibleStrip>` component in
      `app/(tabs)/combat.tsx` rendered at the top of
      `ActionPhase`. Compact horizontal row: CRUCIBLE
      eyebrow + 5 token chips (glyph + count, dim when zero)
      + OPEN ▸ button routing to `/crucible`. Token pool
      mirrors `TokenCrucible.tsx` DEFAULT_POOL until the
      engine exposes real `player.tokens` (gated alongside
      Phase 20/21 engine-release work). Verify 535/535
      unchanged.
- [x] Phase 50 — Cold-codex aesthetic toggle (filed via
      `/oversight` 2026-05-19, 7th call). Promotes the
      design-spec.md item 4 candidate that was reserved for
      `Phase 25` originally (Phase 25 already taken by typed-
      event consumer; renumbered to 50). Adds a togglable
      aesthetic mode `'canonical' | 'codex'` covering combat /
      event / exploration per chat 2 §"Open caveats" — the
      stripped-back monochrome variant for high-stakes
      surfaces. Rolling phase, multi-tick:

      - Tick A: aesthetic context (`useAesthetic()`) +
        `__DEV__` toggle in bearings or a hidden setting +
        AppStorage persistence; default 'canonical'.
      - Tick B: combat codex variant — bone-and-ash chrome,
        heavier hairlines, drops sulfur saturation on the
        action / stance pickers.
      - Tick C: event codex variant — same treatment on the
        EncounterModalOverlay + paced event shell.
      - Tick D: exploration codex variant — map nodes + step-
        cards desaturated.
      - Tick E (follow-up): extend to SELF + SATCHEL surfaces
        if user commits to the direction (chat 2 explicitly
        notes this as a follow-up not part of the initial
        port).

      Design source: `screens-canonical.jsx` variant branches
      keyed on `variant === 'codex'` (every screen function
      takes `{ variant = 'canonical' }`). Each subtick lands
      its own `feat(spec50 tick X): <surface> codex variant`
      commit; phase closes when the user signals
      "codex toggle complete" via `/oversight`.

      **Closed 2026-05-19 via `/oversight` (9th call)** after
      ticks A (`93841f1`) / B (`3d9a553`) / C (`f1c6c08`) /
      D (`3ed9bc8`) shipped. Tick E (SELF + SATCHEL codex
      extension) **deferred indefinitely** per the original
      brief's "follow-up if user commits to the direction"
      clause — the engine-side alignment surface (Phase 52,
      now promoted) supersedes for the SELF tab; SATCHEL
      extension can be re-filed as a candidate later if the
      direction firms up.
- [x] Phase 51 — `axiomancer-mechanics` bump 0.7.0 → 0.10.0
      (filed via `/oversight` 2026-05-19, 8th call). The cron
      generated `docs/engine-upgrade-0.7.0-to-0.10.0.md` at
      commit `30c03ca` covering the surface diff; this row is
      the shipping unit. Two required pieces:

      - **Schema migration v2 → v3** in
        `state/persistence/migrations.ts` for the new
        top-level `state.alignment: PhilosophicalAlignment`
        field added in engine Phase 42. Default to
        `{ epistemic: 0, ethical: 0, metaphysical: 0 }` per the
        engine's `defaultAlignment()`. Add a hermetic case to
        `state/persistence/e2e/asyncStorageAdapter.engine.test.ts`
        that loads a `schemaVersion: 2` envelope and asserts
        `alignment` equals the default.
      - **Pin bump** in `package.json` from `"0.7.0"` →
        `"0.10.0"` (still exact). `WorldMap` → `MapState`
        rename already pre-applied in commit `7a8c8e5`, so the
        bump itself is a one-line edit + `pnpm install`.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Sanity-check
      handoff items per the upgrade-guide §5: `skillLibrary` /
      `getSkillById` still expected undefined at top-level
      (engine Phase 50 not yet shipped); 8 of 9
      `dist/<sub>/types.d.ts` still expected missing. Keep
      local stop-gaps in `state/mocks/combat.skills.fixture.ts`
      and the local `PersistenceAdapter` shim until engine
      0.10.1 lands those fixes.

      **Ordering note (historic):** ships AFTER Phase 50 per
      `/oversight` 2026-05-19. Phase 50 (cold-codex) is purely UI and
      doesn't touch the engine boundary, so no conflict.
      Single commit, no rolling sub-ticks. Commit message:
      `feat(spec51): bump axiomancer-mechanics 0.7.0 → 0.10.0
      + v2→v3 alignment migration`.
- [x] Phase 52 — Surface engine `PhilosophicalAlignment` on
      SELF tab (promoted via `/oversight` 2026-05-19, 9th call;
      filed by `/expand` pass 29 in `a2ee151` at [score 7.2]).
      Engine 0.10.0 (shipped via Phase 51) introduces the
      three-axis alignment cube and updates `state.alignment`
      as the player plays via dialogue / map-event
      `alignmentDelta` payloads. Mobile carries the value
      through the v2→v3 migration but renders nothing yet.
      Light-touch adoption to make the upgrade observable.

      Scope (single phase):

      - Read `state.alignment` in
        `state/presenters/character.engine.ts`; expose
        `{ cellName, axisBuckets }` on the
        `CharacterViewModel`.
      - Resolve the active `PhilosophicalAlignmentCell` via
        engine's `getAlignmentCell(alignment)`. The cell
        object carries name, description, fallacies, virtues
        — for tick A render only `cellName` + the three axis
        buckets; richer surfaces (fallacy chips, virtue
        callouts) are follow-ups.
      - Render a small alignment row on the SELF tab beneath
        the existing stats/saves block. Cell name in
        `FONTS.gothic`; three-axis bucket chips
        (`epistemology=mid · outlook=mid · scope=mid`) in
        `FONTS.mono`. Matches the chrome register of the
        existing rows.
      - Hermetic test: VM exposes a totally-shaped alignment
        slice for a fresh game (defaults to mid/mid/mid via
        `defaultAlignment()`); the cell name resolves; bucket
        chips render for each axis value.
      - Verify gate: `pnpm exec tsc --noEmit`, full
        `pnpm test`. Commit:
        `feat(spec52): alignment cell on SELF tab — port engine 0.10.0 Philosophy module`.
- [x] Phase 53 — Save-corrupted UX modal (Spec 09 Q7=A
      follow-up). Promoted via `/oversight` 2026-05-19 (10th
      call) — last non-engine-gated candidate in the queue.
      Phase 51's migration-default fix
      (`state/persistence/asyncStorageAdapter.ts` defaulting
      `migrations = DEFAULT_MIGRATIONS` instead of `{}`) made the
      persistence layer actually run migrations in production,
      raising the surface area of corrupt-save failures from
      "never fires" to "real possibility on schema bumps". The
      current `preload()` failure path is a `console.warn` that
      silently boots a fresh game — Spec 09 Q7=A calls for a
      user-facing prompt.

      Scope (single phase):

      - Lift the `preload()` failure into provider state.
        `GameStoreProvider` gains a `corruptSave: boolean`
        signal (true when `persistenceAdapter.preload()`
        rejects); the layout passes it through.
      - New `<CorruptSaveModal>` component prompts "Save
        corrupted — start a new game?" with two actions:
        `Confirm` (calls `adapter.clear()` + boots fresh) and
        `Cancel` (keeps the app at the splash so the user can
        troubleshoot / reach support).
      - Wire into `app/_layout.tsx`: when `corruptSave === true`
        and `loaded && preloaded`, render the modal instead of
        the splash; the existing `console.warn` stays as a dev
        breadcrumb.
      - Hermetic test:
        - Poisoned envelope (`JSON.parse` throws inside
          `preload`) flips `corruptSave` true; modal mounts.
        - `Confirm` clears the slot + flips `corruptSave` false;
          provider boots a fresh `createNewGameState`.
        - `Cancel` leaves `corruptSave` true; modal stays
          mounted; no clear.
      - Voice register check: modal copy uses lowercase ritual
        (per Phase 33's voice register), no second-person
        archaic pronouns. Body suggestion:
        `"the page was torn. begin anew?"` — adjust on review.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec53): save-corrupted UX modal — Spec 09 Q7=A
      follow-up`.
- [x] Phase 54 — Debug seed button (manual-testing affordance).
      Promoted via `/oversight` 2026-05-19 (11th call) — user
      free-form request: "Could I add a 'debug' button that makes
      my character have a few items from each category and a few
      skills that also resets the current map? I want to make
      sure I'm able to test items and combat." Highest-trust
      signal class per /iterate §4. Dev-only affordance; no score
      gate.

      Scope (single phase):

      - New `<DebugSeedButton>` component at
        `components/DebugSeedButton.tsx`. Mirrors the
        `AestheticDevToggle` pattern: `__DEV__`-guarded
        (production renders null), dashed border + sulfur accent,
        mounted at the bottom of the SELF tab beside the existing
        aesthetic toggle.
      - On press, dispatch a single composite action through
        `useGameActions()` that:
        1. Adds 2-3 representative items per engine category via
           `consumableLibrary` + `equipmentTemplates` (Items
           category: one Consumable, three Equipment covering
           head/body/weapon, one Material if a Material library
           exists; QuestItem if exposed). Use the existing
           `addItem` reducer.
        2. Teaches 2-3 skills via `learnSkill` covering both
           `paradox` and `fallacy` categories. Source from the
           local `state/mocks/combat.skills.fixture.ts` stop-gap
           until engine `skillLibrary` re-export lands.
        3. Resets the current map by calling
           `getCoastalMap(currentMap.name)` and threading
           through the engine's `changeMap` reducer. Re-seeds
           nodes; clears `discoveredNodes` / `consumedNodes`.
      - Toast or accessibility-announce on success ("debug seed
        applied · N items · M skills · map reset") so the
        developer knows the action fired.
      - Hermetic test at `state/e2e/debug-seed.engine.test.tsx`:
        - Initial state has empty inventory / no learned skills.
        - After firing the seed action: inventory has at least
          one entry per represented category; knownSkills has
          ≥2 entries covering both categories; world.currentMap
          is back at startingNode.
        - Component-level test: `__DEV__=false` renders null.
        - Component-level test: tapping the button calls the
          seed action exactly once.

      Voice register: dev-only affordance, mono register on
      labels matches `AestheticDevToggle`. Toast can be
      lowercase ritual.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec54): debug seed button — items + skills + map reset
      (dev-only)`.
- [x] Phase 58 — Debug map-reset + chaos-pool toggle
      (manual-testing affordance). Promoted via `/oversight`
      2026-05-20 (13th call) — user free-form addendum:
      "Make sure to add a 'debug' button to reset the current
      map and that the 'encounters' (combat, hazard,
      gathering, etc) are randomized for now so I can continue
      testing manually." Ordered FIRST in dispatch despite
      higher number; user-direct testing unblock outranks the
      pass-30 candidates.

      Scope (single phase):

      - New `<DebugMapResetButton>` mounted beside the
        existing dev affordances on the SELF tab. On press:
        `actions.changeMap(currentMapName)` re-seeds the
        current map via the engine's `getCoastalMap` —
        fresh `currentNode`, cleared `discoveredNodes` /
        `consumedNodes` / `completedNodes`. Map-only escape
        hatch (vs. `DebugSeedButton`'s composite seed which
        also touches inventory + skills).
      - New `chaos-pool` registered in `event-pools.ts` with
        weighted entries spanning multiple event kinds —
        encounter, hazard, gathering, loot-cache, rest.
      - New `<DebugChaosToggle>` (DEV-only) that flips between
        canonical pools and the chaos pool. When ON, calls
        `setNodeEventPoolOverride(continent, mapId, nodeId,
        'chaos-pool')` for every node in both layouts. When
        OFF (default), re-calls `registerExplorationEventPools()`
        to restore the per-type overrides.
      - Hermetic tests:
        - map-reset button mutates the map to startingNode +
          cleared sets.
        - chaos-pool toggle ON: across 20 seeded-RNG resolves,
          at least 3 distinct event kinds surface.
        - chaos-pool toggle OFF: walking onto fv-3 (encounter
          node) returns to firing an encounter, not chaos.

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Single commit:
      `feat(spec58): debug map-reset + chaos-pool toggle (dev-only)`.
- [x] Phase 55 — Multi-entry encounter pools per map.
      Promoted via `/oversight` 2026-05-20 (13th call) from
      `/expand` pass 30 ([3.5]).

      Scope (single phase):

      - Expand `encounter-fishing-village` pool to entries
        for tidepool-crab / sea-mist-wisp / wet-hound /
        mournful-gull, weighted so simple foes appear more
        often than the wet-hound (normal difficulty).
      - Expand `encounter-northern-forest` similarly with
        lullaby-moth / disatree / forest-sprite /
        argumentative-crow, same weighting principle.
      - Hermetic test: across 20 seeded-RNG resolves on
        an encounter node, the resolved enemy ids include
        at least 2 distinct slugs (proves the pool samples).

      Commit: `feat(spec55): multi-entry encounter pools per map`.
- [x] Phase 56 — Per-quest-node NPC wiring. Promoted via
      `/oversight` 2026-05-20 (13th call) from `/expand`
      pass 30 ([3.0]).

      Scope (single phase):

      - Replace `questCommon` with per-map quest pools that
        thread different `npcName` values per quest node
        (fv-6 Ash Mire → 'boy-priest' per the layout's
        description; nf-6 Pilgrim's Cairn → 'pilgrim-ghost'
        or similar; pick locale-thematic names).
      - Verify against the engine's NPC + dialogue registry
        in 0.10.0 — if the engine's `getDialogueNode` can't
        resolve mobile-side npcNames, stub a minimal mobile-
        side mapping so the interaction event still
        surfaces meaningfully on the screen.
      - Hermetic test: resolveMapEvent on each quest node
        returns an interaction event with the expected
        npcName.

      Commit: `feat(spec56): per-quest-node NPC wiring`.
- [x] Phase 57 — Treasure + gathering payload contents.
      Promoted via `/oversight` 2026-05-20 (13th call) from
      `/expand` pass 30 ([3.0]).

      Scope (single phase):

      - Per-map treasure pools that drop 1-3 items
        appropriate to the locale. fishing-village →
        consumables + low-tier coastal equipment; northern-
        forest → consumables + low-tier wilderness gear.
        Source items from `consumableLibrary` /
        `equipmentTemplates` (use `templateToEquipment`
        helper from `state/actions.ts` for the conversion).
      - Per-map gathering pools that drop 1-2 materials.
        If the engine ships a `Material` library accessible
        via 0.10.0 surface, use that; otherwise synthesize
        minimal Material-shaped objects.
      - Hermetic test: walking onto fv-4 (Iron Spring,
        treasure) fires a loot-cache event with non-empty
        items. Inventory grows after
        `resolveCurrentMapEvent`.

      Commit: `feat(spec57): treasure + gathering payload contents`.
- [x] Phase 59 — Character presets adoption (engine 18
      consumer; from PHASE_CANDIDATES pass 5 [score 4.5]).
      Promoted via `/oversight` 2026-05-20 (14th call). Shipped
      `6028859` — `feat(spec59): character preset picker —
      dev affordance for archetype swap`. Adds
      `actions.applyCharacterPreset(presetId)` +
      `<DebugPresetPicker>` (DEV-only); covers apprentice /
      wanderer / sage from the engine's `characterPresets`
      array. Closes mirror issue #94.
- [x] Phase 60 — Engine bump axiomancer-mechanics 0.10.0
      → 0.10.2. Queued via `/triage` 2026-05-20 from user-filed
      issue #93. **Re-shaped via `/oversight` 2026-05-20 (16th
      call) into a multi-phase sequence (60a/60d/60b promoted;
      60c/60e/60f below threshold in PHASE_CANDIDATES).** This
      parent row tracks the bump as a whole; the sub-phases are
      the actual `[ ]` work units. The lockfile bump itself ships
      as the last sub-phase (60f) once the surface drift is
      drained across 60a–60e.

      **Surface drift discovered 2026-05-20 by `/ship-a-phase`
      attempt** — issue #93's brief said the bump was
      surface-additive ("no breaking changes"), but
      `npm install axiomancer-mechanics@0.10.2 && npm run verify`
      surfaced **58 typecheck errors across 5+ files** beyond
      the documented additions. The bump was reverted in the
      same tick to keep the loop green.

      **Actual drift surface (0.10.0 → 0.10.2):**

      - `getCoastalMap` **removed** — replaced by
        `getMapDefinition` (different signature). Consumers:
        `state/actions.ts`, `state/e2e/exploration.engine.test.ts`,
        `state/e2e/event-pools.engine.test.ts`.
      - `Encounter.enemy` **removed** from the public type —
        likely now `enemyId` or fetched via a resolver. Consumers:
        `state/e2e/event.engine.test.ts`,
        `state/e2e/event.screen.test.tsx`,
        `state/e2e/event-assets.test.ts`,
        `state/presenters/event.engine.ts`.
      - `DialogueChoice.id` / `.label` **removed** —
        flattened or restructured. Consumers:
        `state/presenters/event.engine.ts`, `state/actions.ts`.
      - `DialogueNode.speaker` **removed**.
      - `Character.mana` / `.maxMana` **removed** from the public
        `Character` type — `combat-hud.engine.test.ts` writes these
        as a presentation stop-gap; presenter layer needs to lift
        them onto a mobile-side type.
      - `ActiveEffect` shape changed — no `id` / `name`.
      - `EffectStatTarget` tightened to a literal union.
      - `GameStore` vs `AppStoreState` drift — mobile's slice
        composition (event / notifications / `_recentEvents`)
        no longer aligns with the engine's `GameStore` shape;
        type narrowings in test files break.
      - `GameState` lost its index signature.

      **Brief is now ambiguous (skill §10.8).** Phase 60 needs
      user re-scoping before the loop should attempt it again.
      Two viable shapes:

      1. **Single bigger phase** — accept the breadth, fix all
         consumers in one commit. Estimate: 1–2h of focused work.
      2. **Multi-phase compatibility sequence** —
         - 60a: rename `getCoastalMap` → `getMapDefinition` and
           reconcile the map-events module wiring.
         - 60b: `Encounter.enemy` → new shape; presenter +
           tests + actions.
         - 60c: `DialogueChoice` / `DialogueNode` flattening;
           presenter + actions.
         - 60d: `Character.mana` lift to mobile type; remove from
           engine-shape writes.
         - 60e: `ActiveEffect` shape; `GameStore` slice
           reconciliation; misc.
         - 60f: lockfile bump + upgrade doc.

      Either way, the issue-93 brief should be amended on the
      engine repo so future bumps surface breaking changes
      transparently in the CHANGELOG.

      **Status (post-oversight 16th call, 2026-05-20):** user
      selected the **multi-phase shape**. 60a/60d/60b promoted
      as the work rows below; 60c/60e/60f remain in
      `plan/PHASE_CANDIDATES.md` under `## Considered (below
      threshold)` for follow-up promotion once the trio ships
      clean. The lockfile bump (60f) is gated on 60a–60e
      landing.
- [x] Phase 60a — `getCoastalMap` → `getMapDefinition` rename.
      Promoted via `/oversight` 2026-05-20 (16th call). Shipped
      `baf66fa` — `feat(spec60a): migrate getCoastalMap →
      createMapState(getMapDefinition)`. Migrated 4 call sites
      (2 in `state/actions.ts`, 2 in e2e tests) directly to the
      two-step pattern; both surfaces exist on 0.10.0 so no shim
      was needed. 760/760 tests green. Closes mirror issue #95.
- [x] Phase 60d — Lift `Character.mana`/`maxMana` to a
      mobile-side `combatMana` slice. Promoted via `/oversight`
      2026-05-20 (16th call). Shipped `579a6a7` —
      `feat(spec60d): lift Character.mana to mobile combatMana
      slice`. New `CombatManaState` interface on AppStoreState;
      `ensureManaOnCombatPlayer` deleted; both presenters
      (combat-hud + combat) widened to AppStoreState and read
      from `state.combatMana`. 760/760 tests green. Closes
      mirror issue #96.
- [x] Phase 60b — `Encounter.enemy` → `enemies[0]` migration.
      Promoted via `/oversight` 2026-05-20 (16th call). Shipped
      `0ee7f63` — `feat(spec60b): migrate Encounter.enemy →
      enemies[0]`. Investigation revealed the engine's canonical
      shape (`{enemies, origin}`) already shipped on 0.10.0; the
      migration is to that shape (not `enemyId` as the candidate
      brief had hypothesized). 5 fixtures + 2 consumers migrated;
      760/760 tests green. Closes mirror issue #97.
- [x] Phase 60c — `DialogueChoice` / `DialogueNode` flattening.
      Promoted via `/oversight` 2026-05-20 (17th call). Shipped
      `7e29be5` — `feat(spec60c): migrate dialogue rendering to
      flattened DialogueChoice/Node`. Engine source confirmed
      the new shape (`choice.text`, no `choice.id`/`label`; no
      `node.speaker`). 2 consumers migrated; VM choice id now
      derived from `visibleChoices` index. 760/760 tests green.
      Closes mirror issue #98.
- [x] Phase 60e — `ActiveEffect` + `GameStore` slice
      reconciliation. Promoted via `/oversight` 2026-05-20
      (18th call). Shipped `8596409` — `feat(spec60e):
      reconcile ActiveEffect + AppStoreState/GameStore
      alignment`. Investigation confirmed `ActiveEffect`
      carries `effectId` (not `id`/`name`); fixed a real
      latent bug in `composeHazard` where every hazard
      consequence rendered the literal `'effect'`. Also
      pre-emptively migrated 18 test fixture sites
      (navigation × 4, exploration × 13, migrations × 3 casts)
      to honor the strict AppStoreState shape under 0.10.2.
      760/760 tests green. Closes mirror issue #99.
- [x] Phase 60f — Lockfile bump `axiomancer-mechanics`
      0.10.0 → 0.10.2 + upgrade doc. Promoted via `/oversight`
      2026-05-20 (19th call) after 60a–60e all shipped clean.
      Shipped `a6cd028` — `feat(spec60f): bump axiomancer-mechanics
      0.10.0 → 0.10.2 + upgrade doc`. The bump surfaced 56 residual
      typecheck errors (test-fixture sites 60a–60e missed) — all
      same root cause as 60e (strict 0.10.2 types catching
      implicit GameStore → AppStoreState coercions). Folded the
      fixture sweep into this same commit rather than spawning a
      Phase 60g. 760/760 tests green at the bumped pin. Closes
      the Phase 60 parent + drains the engine-bump AUDIT row.
      Closes mirror issue #93.

      Scope (single phase, single commit):

      - One-line edit in `package.json`: `"axiomancer-mechanics":
        "0.10.0"` → `"0.10.2"` (still exact pin).
      - `pnpm install` to refresh `pnpm-lock.yaml`.
      - Author `docs/engine-upgrade-0.10.0-to-0.10.2.md`
        mirroring the `0.7.0-to-0.10.0` template — enumerate the
        9 surface drifts already drained by 60a–60e (so the doc
        is a "what was already done" reference, not a fresh
        migration plan), name the latent `composeHazard` bug
        60e caught, point at the mirror issues #95/96/97/98/99
        for traceability.
      - Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
        `pnpm exec eslint . --max-warnings=0`. Expectation:
        already green at 760/760 against 0.10.0 surface; the
        bump should not regress because the surface is already
        migrated.
      - Close Phase 60 parent row (flip `[parent]` → `[x]`
        with this commit's hash).
      - Drain the AUDIT.md `[in-progress via Phase 60a…]` row
        to Done.

      Commit: `feat(spec60f): bump axiomancer-mechanics 0.10.0
      → 0.10.2 + upgrade doc`. Closes mirror issue #93.

**DEV-mode coverage expansion (Phase 61 parent + sub-phases,
filed via `/oversight` 2026-05-20, 19th call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 6.0] after user-jot `7821f13`
("Let's figure out a way to expand the frontend with a 'dev'
mode where I can test the implementation of every mechanic
we've ported so far.") and the matching iterate row at
`dcda455`. User selected the **parent-with-sub-ticks shape**
(Phase 60 mold) over per-mechanic small phases — easier to
track scope creep on the meta-feature. Sub-phases ship in
listed order; each one is a `/ship-a-phase` dispatch.

- [x] Phase 61 — DEV-mode coverage expansion. All six
      sub-phases shipped: 61a `e846942` (menu structure), 61b
      `5fef0fd` (XP + level-up), 61c `01cd261` (mana
      drain/restore), 61d `bd24fc4` (alignment shift), 61e
      `1ce56b1` (effect apply), 61f `01932f7` (event-kind
      trigger override). SELF-tab DevMenu now exposes 11
      collapsible debug affordances spanning every ported
      mechanic class (existing 6 + new 5). 800/800 green at
      Phase 61 close (was 766 at Phase 61a's land).
- [x] Phase 61a — DEV menu structure refresh. Shipped
      `e846942` — `feat(spec61a): dev-menu structure refresh —
      collapsible group on SELF tab`. New `<DevMenu>` wrapper
      around the six existing Debug* affordances; dashed-border
      panel matching the AestheticDevToggle chrome register;
      `__DEV__`-gated; default state collapsed. +6 hermetic
      DevMenu tests (DEV gate true/false, collapsed default,
      expand on press, toggle round-trip, initiallyExpanded
      shortcut). 766/766 green (was 760).
- [x] Phase 61b — XP + level-up affordance. Shipped
      `5fef0fd` — `feat(spec61b): dev-menu XP + level-up grant`.
      New `<DebugXpGrant>` row with two buttons (+100 XP /
      LEVELUP). LEVELUP seeds experience to threshold then
      dispatches engine `levelUp()`; the engine reducer loops
      through stacked level-ups and emits `character:levelup`,
      which flips `notifications.levelUpAcknowledged` false and
      re-arms the character-tab badge. +7 hermetic tests. 773/773
      green (was 766).
- [x] Phase 61c — Mana drain/restore. Shipped `01cd261` —
      `feat(spec61c): dev-menu mana drain/restore`. New
      `<DebugManaControl>` row with two buttons (DRAIN / FULL)
      mutating the mobile `combatMana` slice. Seeds from null
      when no combat is active; preserves `.max` when slice
      exists. +7 hermetic tests. 780/780 green (was 773).
- [x] Phase 61d — Philosophical alignment shift. Shipped
      `bd24fc4` — `feat(spec61d): dev-menu alignment shift`.
      Three-axis panel (epistemology / outlook / scope per the
      engine's `PhilosophicalAlignment` shape — brief used the
      aspirational names epistemic/ethical/metaphysical;
      engine names won as the canonical surface) with ±10
      buttons routing through `shiftPhilosophicalAlignment`.
      +7 hermetic tests. 787/787 green (was 780).
- [x] Phase 61e — Active effect apply (player + enemy). Shipped
      `1ce56b1` — `feat(spec61e): dev-menu effect apply`.
      Two static effect targets (BUFF · ME →
      `buff_body_defense_up` / BLEED · FOE → `debuff_bleed`)
      routed through the engine's `applyEffect` helper. Enemy
      branch no-ops + warns when no combat is active (CombatState
      carries singular `enemy` per engine 0.10.2). Picker UI
      deferred — two static ids are enough for manual-test
      observability. +6 hermetic tests. 793/793 green (was 787).
- [x] Phase 61f — Event-kind trigger override. Shipped
      `01932f7` — `feat(spec61f): dev-menu event-kind trigger
      override`. Five-button panel (REST / GATHER / TREASURE /
      QUEST / FIGHT) routed through new
      `forceEventKindOnNode(mapId, nodeId, kind)` helper in
      `event-pools.ts`. Reuses existing `poolIdForNode` mapping
      so per-map pool variations propagate automatically. +7
      hermetic tests. 800/800 green (was 793).

      **Follow-ups out of scope for Phase 61** (re-file as
      candidates if the user wants them): dialogue-tree jump,
      quest state mutation, friendship counter, currency
      grant, combat-HUD spot overrides. The candidate body in
      `plan/PHASE_CANDIDATES.md` enumerates them.

**DEV-mode follow-up affordances (Phase 62 parent + sub-phases,
filed via `/oversight` 2026-05-21, 21st call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 5.5] — the deferred items from
user-jot `7821f13` that Phase 61 explicitly named as out of
scope. User selected the parent-with-sub-ticks shape (Phase 61
mold). Each sub-phase adds one Debug* row inside the existing
DevMenu (Phase 61a wrapper); none change production surfaces.

- [x] Phase 62 — DEV-mode follow-up affordances. Closed via
      `/oversight` 2026-05-25 (41st call). Sub-phases 62a–62c
      shipped; 62d–62e resolved via oversight 2026-06-04 as skipped
      (functionality delivered by Phase 87). Parent closes.
- [x] Phase 62a — Dialogue tree jump. Shipped `b5f681e` —
      `feat(spec62a): dev-menu dialogue tree jump`. New
      `<DebugDialogueJump>` row with two static trees (OMEN /
      FRIEND) that seed `state.event.pending` with a synthetic
      interaction event + dialogueCursor at the tree root.
      `selectHasActiveEvent` flips true on tap → `EventGate`
      routes to /event. No engine registry exists for picker
      driven mode; synthetic trees stay inline. +6 hermetic
      tests; 881/881 green (was 875).
- [x] Phase 62b — Quest state mutation. Shipped `ef8475e` —
      `feat(spec62b): dev-menu quest state mutation`. New
      `<DebugQuestState>` with three actions per quest (START
      / ADV / DONE) across two synthetic Quests (starting-quest
      + gather-wood). Each button routes through engine
      `startQuest` / `progressQuest` / `completeQuest`. Memoir
      tab reflects the state changes. +7 hermetic tests; 888/888
      green (was 881).
- [x] Phase 62c — Friendship counter override. Shipped `2f058d8`
      — `feat(spec62c): dev-menu friendship counter override`.
      New `<DebugFriendship>` with +1 / RESET buttons mutating
      `state.combat.friendshipCounter`. Combat-only; warns +
      no-ops outside combat. +8 hermetic tests; 896/896 green
      (was 888).
> **Resolution note (oversight 2026-06-04):** Phases 62d and 62e
> were formally skipped as their functionality was delivered by
> Phase 87's debug control implementations. The [9.8] modal-contained-encounter
> refactor (Phase 63) proceeded as prioritized.

- [skipped via oversight 2026-06-04 — drained by Phase 87] Phase 62d — Currency
      grant. Phase 87 (`cffbc9b`) shipped `<DebugCurrencyControl>` (50/500S grants
      + BROKE reset), covering the same scope this row described.
- [skipped via oversight 2026-06-04 — drained by Phase 87] Phase 62e — Combat-HUD
      spot overrides. Phase 87 (`cffbc9b`) shipped `<DebugHudOverrides>` (mana /
      effects / stance visibility toggles), covering the HUD-override scope this
      row described.

      **Out-of-scope for Phase 62** (re-file if needed):
      enemy effect-apply (covered by Phase 61e's BLEED · FOE
      button); event-kind trigger (covered by Phase 61f); RNG
      seed control could be a future phase if signals warrant.

**Modal-contained encounter refactor (Phase 63 parent +
sub-phases, filed via `/oversight` 2026-05-21, 23rd call).**
Promoted from `plan/AUDIT.md` [9.8] row after user signaled
top priority: "KEEP the full encounter inside the modal, the
user cannot exit the modal until the encounter is resolved.
Keep it all living inside the same modal opened during the
encounter trigger." Current flow routes FIGHT to a separate
`/combat` tab via `router.replace('/combat')`; user wants
the encounter to live entirely inside `EncounterModalOverlay`
until resolution + aftermath.

This may resolve the [9.8] "Base combat mechanics not wired
into UI" bug as a side effect (the router transition may be
part of why selections don't visibly drive combat). If not,
that row gets revisited via `/iterate` once Phase 63 lands.

- [x] Phase 63 — Modal-contained encounter. All four
      sub-phases shipped: 63a `4c4993c` (extract CombatPanel),
      63b `8deeb27` (mount CombatPanel inside modal),
      63c `a18ee12` + `ce90615` (session lifecycle + tab-bar
      regression fix), 63d `d6d23c1` (retire STRIFE tab).
      Combat now lives entirely inside the
      EncounterModalOverlay; bottom tab bar shows 4 tabs
      (WILDS / SELF / MEMOIR / SATCHEL). Encounter session
      tracked via `combat-mode.inEncounterModal`. The
      combat-mechanics bug investigation ([9.8] AUDIT row)
      stays open pending user retest on the next preview
      build.
- [x] Phase 63a — Extract combat UI from `(tabs)/combat.tsx`.
      Shipped `4c4993c` — `feat(spec63a): extract CombatPanel
      from combat tab`. Split `CombatScreen` into a thin shell
      (default export, wraps `<ScreenBg>`) + a `CombatPanel`
      named export with the actual content (no ScreenBg).
      Canonical import path at
      `components/combat/CombatPanel.tsx` re-exports for
      callers outside the (tabs) folder. +2 hermetic surface
      tests. 898/898 green (was 896).
- [x] Phase 63b — Mount `<CombatPanel>` inside
      `EncounterModalOverlay`. Shipped `8deeb27` —
      `feat(spec63b): combat lives inside EncounterModalOverlay`.
      Internal `useState<'prelude' | 'combat' | 'aftermath'>`
      on the overlay; FIGHT advances prelude → combat and
      swaps content to a ScrollView-wrapped `<CombatPanel>`.
      `router.replace('/combat')` removed from exploration's
      `onEncounterFight`; useRouter import dropped. +3 hermetic
      cases pin the prelude→combat transition. 901/901 green
      (was 898).
- [x] Phase 63c — Modal-contained encounter session: fix the
      mid-encounter unmount bug + lock the tab bar during the
      modal. Shipped `a18ee12` —
      `feat(spec63c): modal-contained encounter session`. User
      retest of 63b surfaced that the modal disappeared on
      FIGHT (selectHasActiveEvent short-circuits when combat
      starts) and that the tab bar stayed navigable
      mid-encounter. 63c lifts encounter-session state to
      combat-mode (`inEncounterModal` flag + open/close API),
      mounts the modal whenever the flag is true OR a prelude
      is ready (so it spans the full combat lifecycle), hides
      the tab bar via `tabBarStyle: { display: 'none' }`
      while the modal is open, and swaps CombatPanel's
      `router.replace('/exploration')` calls for a
      `finalizeCombatExit` helper that closes the modal
      in-place when inside it (preserves the legacy tab path).
      +4 hermetic combat-mode cases pin the session lifecycle.
      905/905 green (was 901). Aftermath-inside-modal is a
      follow-on; the existing AftermathBanner on exploration
      surfaces post-victory per the Phase 41 flow.
- [x] Phase 63d — Retire STRIFE tab from the bottom bar.
      Shipped `d6d23c1` —
      `feat(spec63d): retire STRIFE tab from bottom bar; combat
      is modal-only`. STRIFE tab `href: null` unconditionally
      (route file stays for DebugCombatButton dev path + deep
      links; just not surfaced in the user-facing bar).
      WILDS↔STRIFE mutex retired entirely from the layout;
      exploration is the leftmost positional tab. Stale
      imports / combatContext plumbing dropped. 905/905 green.

      **Out-of-scope for Phase 63** (re-file if needed):
      combat-mechanics bug investigation (AUDIT [9.8] row stays
      open; revisit via `/iterate` once user confirms 63 works
      end-to-end on a fresh preview). The legacy `selectVisibleTabs` /
      `isTabHidden` functions stay in `tabs.engine.ts` with
      their existing tests — dead code now; a future iterate
      can prune.

**Multi-screen integration test harness (Phase 64, filed via
`/oversight` 2026-05-21, 24th call).** Promoted from
`plan/PHASE_CANDIDATES.md` [score 7.5]. Closes the testing gap
documented in `plan/NEEDS_HUMAN_ATTENTION.md` — every Phase
62/63 regression this session was an integration bug invisible
to single-component tests. The three corrective commits on
Phase 63 (`ce90615`, `d460b64`, plus this oversight) all
addressed regressions that would have surfaced earlier with
multi-screen integration coverage.

- [x] Phase 64 — Multi-screen integration test harness. Shipped
      `a4c0c4b` — `feat(spec64): multi-screen integration test
      harness — provider helper + encounter-flow suite`. Ticks
      A-C shipped together: `test-utils/withAllProviders.tsx`
      bundles the four contexts; `encounter-flow.engine.test.tsx`
      adds 5 hermetic cases (3 overlay-lifecycle + 2 combat-
      action engine mutation). The combat-action cases PASSED,
      confirming engine + action layer mutate state correctly
      end-to-end — narrowing the [9.8] combat-mechanics row's
      candidate roots from A/B/C/D to A or C (layout-or-memo,
      not engine). 911/911 green (was 906).

**Combat regression cluster diagnostic (Phase 65, filed via
`/oversight` 2026-05-21, 25th call).** Promoted in response
to user-pasted diagnostic console output that narrowed the
`[9.8]` AUDIT row from "candidate roots A/C" to a confirmed
sub-hypothesis 2: `selectCombatViewModel` in
`state/presenters/combat.engine.ts` returns
`vm.phase=choosing_action` even when fed a fresh
`combat.phase=resolving` (engine mutates, `useMemo`
recomputes, but the selector's phase mapping is wrong). One
phase bundles all five `[9.x]` combat regressions because the
root cause is shared (or believed shared) and the chrome
cleanup is trivial in the same surface.

- [x] Phase 65 — Combat regression cluster diagnostic. Three
      named ticks all shipped:
      - Tick A `8f7265c` — `useCombatViewModel` React Compiler
        opt-out + synthetic-state refactor; closes `[9.8]`
        vm.phase staleness (user confirmed combat actions now
        visibly mutate engine state).
      - Tick B `33f8fdc` — drop default `'heart'` stance; closes
        `[9.5]` Heart pre-selected.
      - Tick C-partial `19f6264` — rename remaining `MP` literal
        to lowercase `mana`; modal-mount audit confirmed already
        correct via `d460b64` (combat-mode gate keeps overlay
        mounted across event-slice clear); closes `[9.5]` MP
        label leak.
      - Plus follow-on `b76303e` — added `onContinueRound`
        branch diagnostics to narrow the new `[9.5]` "Next
        Round exits combat" row that surfaced mid-Phase-65.

      **Deferred housekeeping** (filed as an iterate row in
      `plan/AUDIT.md` for follow-on once `[9.5]` Next Round
      closes): strip the diagnostic console.log streams in
      `combat.tsx` + `actions.ts` + the `onContinueRound` adds;
      delete `plan/COMBAT_DEBUG_PICKUP.md`. Keeping the streams
      live while `[9.5]` Next Round is open avoids re-instrumenting
      mid-investigation. The phase parent closes here because
      Phase 65's substantive scope shipped; the housekeeping
      is mechanical and benefits from the wait. Closes #100.

      - **Tick A — `[9.8]` root-cause fix.** Open
        `state/presenters/combat.engine.ts:selectCombatViewModel`.
        Trace how `vm.phase` is derived from the incoming
        `state.combat.phase`. Inspect for: (a) a `localUi` or
        closure capture that pins phase at hook init time;
        (b) a switch/map that doesn't enumerate `'resolving'`
        and defaults to `'choosing_action'`; (c) any branch
        that reads `playerChoice.action` and overrides phase
        downstream. Land the fix. Add ≥2 hermetic cases to
        `state/e2e/combat.engine.test.ts` (or a new
        `state/e2e/combat-vm.engine.test.ts`) that:
        - call `selectCombatViewModel({...state,
          combat: {...combat, phase: 'resolving'}})` directly
          and assert `vm.phase === 'resolving'`;
        - drive the engine via the integration harness from
          Phase 64 — `setPlayerStance` → `setPlayerAction` →
          `resolveRound` → assert next render's `vm.phase` is
          NOT `'choosing_action'`.
        Closes `[9.8]` + `[9.5] Action selection has no
        effect` (duplicate).
      - **Tick B — Heart pre-selected default fix.** Find
        where the stance picker's initial selected-state
        renders Heart pre-highlighted on a fresh combat with
        no committed stance. Required state: no stance card
        carries the selected visual until the player taps
        one. Likely a `selectedStance ?? 'heart'` fallback in
        `combat.engine.ts` or the `<StanceOption>`
        component. Drop the fallback; pass `null`/`undefined`
        through. +1 hermetic case asserting no stance has
        `selected: true` on `vm.phase === 'choosing_stance'`
        when `playerChoice.stance == null`. Closes `[9.5]
        Heart pre-selected`.
      - **Tick C — Chrome cleanup + diagnostic strip.**
        - Replace `label="MP"` in `components/StatusCard.tsx`
          + `app/(tabs)/combat.tsx` with the chosen semantic
          (drop on character screen since combatMana is
          combat-only post-Phase-60d; rename to lowercase
          `'mana'` in-combat). Closes `[9.5] MP label leak`.
        - Audit `EncounterModalOverlay`'s
          `vm.preludeChrome === null` guard against the
          updated Phase 60b enemy shape; tighten the modal
          mount predicate so the modal stays mounted across
          the combat-prelude → combat transition without
          racing the event-slice clear. Closes `[9.5]
          Encounter modal closes before resolution` (if not
          already absorbed by Tick A's vm fix).
        - Strip the diagnostic stream listed in
          `plan/COMBAT_DEBUG_PICKUP.md` §"Diagnostic streams
          currently live in code": eight log families across
          `combat.tsx`, `actions.ts`, `combat.engine.ts`,
          plus the diagnostic toast.
        - Delete `plan/COMBAT_DEBUG_PICKUP.md` (its premise
          closes when [9.8] does).

      Verify gate: `pnpm exec tsc --noEmit`, full `pnpm test`,
      `pnpm exec eslint . --max-warnings=0`. Tick A and B
      can ship as separate commits; Tick C is one cleanup
      commit at the end. Commit prefixes:
      `feat(spec65a): selectCombatViewModel phase passthrough
      — fix [9.8]`, `feat(spec65b): no default stance — fix
      [9.5] heart pre-selected`, `feat(spec65c): combat
      chrome cleanup + diagnostic strip`.

      Phase 66 (modal aftermath, formerly candidate Phase 65)
      becomes the natural next-up once 65 lands clean and
      user retests playable combat.

**Promoted via `/oversight` 2026-05-22 (28th call):** Phase 67
(playtest cadence) + Phase 68 (Character + Memoir audits) — both
filed by `/expand` pass 34 (`2a76cf8`) and promoted together
during the same oversight call that ran the live-drive playtest
on the dev server. The playtest validated Phase 65 / 5.0 / 3.5
/ 4.5 end-to-end and filed a new `[5.5]` HP-scaling AUDIT row;
Phase 67's deliverable codifies that pattern so future drift
gets caught on a cadence, not by ad-hoc oversight playtests.

- [x] Phase 67 — Recurring playtest cadence (Playwright-driven
      regression sentinel). Closed 2026-05-22 after Tick A
      shipped (`966a990`); Tick B (cron wire-up) **deferred
      indefinitely** per the original brief's "opt-in by
      design — runs only when the user adds it to a cron
      explicitly" clause. Re-open the row + plan Tick B if
      the user wants the cadence on by default.
      - Tick A ✅ — `/playtest` skill at `skills/playtest.md`
        landed in this commit's tick. Codifies the canonical
        walk: load page → exploration → encounter modal →
        stance → action → resolve → continue. Files
        observations to `plan/AUDIT.md` via the §5 template;
        hard rule: never starts the dev server.
        Hermetic structural test at
        `scripts/__tests__/playtest-skill.test.ts` pins the
        skill file's required sections + AUDIT-row template +
        canonical walk beats. 14 cases. 1042/1042 green.
        Reference walk in §10 documents the 28th oversight
        call's live drive — exactly the procedure now codified.
      - Tick B (optional, gated on user opt-in): wire
        `/playtest` into `/march`'s repertoire as a periodic
        dispatcher entry. Default off — runs only when the
        user adds it to a cron explicitly (the playtest skill
        itself is opt-in by design; chicken-and-egg with
        Claude bash sessions starting the dev server).
      - Commit: `feat(spec67a): /playtest skill — Playwright
        regression sentinel`.

- [x] Phase 70 — Aftermath modals (Victory · Friendship · Defeat
      · Error). All four ticks shipped 2026-05-22. Ports the four non-dismissible outcome panels from
      `design/handoff-2026-05-22/project/screens/aftermath-modal.jsx`
      into mobile, mounted **inside** the encounter seal so the
      encounter never leaves the modal until the final dismiss
      button fires. Replaces today's `<AftermathBanner>` toast +
      the `ErrorBoundary` fallback. 4 ticks (one per modal):
      A = Victory + presenter scaffold + in-modal mount,
      B = Friendship + pixel emblem (the only pixel art in the
      app), C = Defeat + run summary, D = ErrorScreen in-world
      replacement for the ErrorBoundary fallback. Promoted to
      **top of the build plan** per user instruction
      ("Top priority is getting all these new designs in place").
      Brief at `plan/phases/phase_70_aftermath_modals.md`.
      - **[x] Tick A** — shipped `05d85e7`
        (`feat(spec70a): CombatVictoryPanel + in-encounter
        aftermath mount`). New
        `selectAftermathViewModel` presenter + `CombatVictoryPanel`
        + snapshot-based combat-mode extension (`aftermathData`,
        `dismissAftermath`). Mode `combat` → `aftermath` swap in
        `<EncounterModalOverlay>` driven by `lastOutcome ===
        'victory'`. Exploration-screen `<AftermathBanner>` gated
        on `lastOutcome !== 'victory'`; banner still mounts for
        parley until Tick B retires it. 38 new hermetic tests;
        1098/1098 verify green.
      - **[x] Tick B** — shipped `8baf37a`
        (`feat(spec70b): CombatFriendshipPanel + PixelEmblem +
        AftermathBanner retirement`). Parley branch of the
        presenter + `<CombatFriendshipPanel>` + new `<PixelEmblem>`
        (the app's lone pixel-art carve-out, with an invariant
        test fence). `<AftermathBanner>` + `selectAftermathCopy`
        deleted — both victory and parley display paths now run
        through the in-encounter-modal panels. Journal-entry field
        exposed in the VM type but null in current snapshots
        (engine doesn't surface per-foe codex entries yet — engine
        integration is a follow-up). 36 new tests across 3 suites;
        4 retired with the banner. 1112/1112 verify green.
      - **[x] Tick C** — shipped `a6b1665`
        (`feat(spec70c): CombatDefeatPanel + run-stats counter +
        BEGIN AGAIN`). Defeat branch closes the previously-silent
        defeat path (no aftermath chrome before this tick). New
        `<CombatDefeatPanel>` (spent-wick, gothic character name,
        italic fell-to line, mono damage ledger, chronicle
        paragraph, run-summary ledger, blood seep). New mobile-side
        `encountersFaced` / `deepestNodeId` counters on combat-mode
        + `recordDeepestNode` hook in the exploration screen.
        `BEGIN AGAIN` full-heals + resets run-stats + dismisses;
        `let the page close` dismisses only (abandon-run path).
        28 new tests across 3 suites; 1140/1140 verify green.
        Engine-side respawn-with-fresh-seed deferred (engine has
        no run-loop semantics yet).
      - **[x] Tick D** — shipped `bd37594`
        (`feat(spec70d): in-world ErrorBoundary refresh — THE
        BINDING TORE`). `<ErrorBoundary>` fallback rewritten into
        the gothic-chronicle register: heavy hatched background,
        gothic title with blood drop-shadow, in-world error code
        (`deriveErrorCode` maps Error.name + message onto 4 codes
        — `E_PAGE_TORN` / `E_SIGIL_BROKE` / `E_THE_LINE_WENT_QUIET`
        / `E_BOUND_LOOSE`), torn-edge inset panel, UI-only `✎ COPY`
        pressed-state toggle (no native clipboard dep), italic
        scribe-note hint, `✠ TRY AGAIN` + `return to the hearth`
        ghost, consolation line. Diagnostics (STATE SNAPSHOT,
        BUILD CONTEXT) preserved below. 9 new tests on the boundary
        suite (4 → 13); 1147/1147 verify green. Independent of the
        encounter modal — closes the phase 70 series.

- [x] Phase 72 — Combat modal polish (port from 2026-05-22 design).
      Shipped 2026-05-23 in commit `4b394a1`. User-reported five
      divergences closed: resolve button label (`✠ NEXT ROUND` →
      `LET IT FALL ━━━━━ ▸` mid-fight + `LET IT FALL · IT IS DONE ▸`
      terminal), enemy panel restructured to design's three-column
      pattern (60×72 framed portrait left / info middle / STANDS
      column right — was off-bleed right-aligned SVG overlay), modal
      panel border bumped 1px → 2px, body horizontal padding added,
      shadow radius tightened. MANA bar omission preserved (design
      shows it but mobile shouldn't, per Phase 62). 1165/1165 verify
      green; 3 pin refreshes on `nextActionLabel` test suite. Plus
      a precursor hotfix `043d607` for a user-reported crash on the
      defeat path (boss-skill killing blow → undefined `enemyAction`).
      Playwright walkthrough scheduled for the user-driven /verify
      tick. Brief at `plan/phases/phase_72_combat_modal_polish.md`.

- [x] Phase 73 — Level-Up modal + SELF-tab ASCEND strip (port
      from 2026-05-23 design). Shipped 2026-05-23 in commit
      `030e2a1` as a single tick (Tick A + Tick B combined per
      the brief's single-tick alternative — both surfaces are
      tightly coupled). Closes the long-standing critique row
      "[MED] /self — Level Up button + stat-allocation modal"
      (filed via /jot 2026-05-22). New `<AscendStrip>` (inline,
      sulfur-banded, only mounts when `vm.pendingPoints > 0`) +
      `<LevelUpModal>` (full-screen ledger-opens with ± controls,
      points-remaining strip, COMMIT ghost↔live transition,
      discard-confirm inset on cancel-with-spent). `vm.pendingPoints`
      threads from engine `Character.availableStatPoints`; commit
      dispatches `actions.allocateStatPoint(stance)` N times via
      the engine's existing action. 29 new tests across 3 suites;
      1193/1193 verify green. Engine derived-stats preview ribbon
      deferred (no engine `previewAllocation` helper yet); LockSeal
      pulse animation static for now (real reanimated loop
      tighten later, gated on reduce-motion).

- [x] Phase 74 — Tap-tooltip primitive + per-surface wiring.
      Tick A shipped 2026-05-23 in commit `77bb85c` (TapTooltip
      primitive + TooltipProvider + selectTooltipContentFor
      presenter with stat content for HEART/BODY/MIND + root
      provider mount + withAllProviders extension). 1224/1224
      verify green (+28 from 1196). Brief at
      `plan/phases/phase_74_tap_tooltip_primitive.md`. Ticks
      B–E promoted as separate phases via /oversight 2026-05-23
      (36th call); Tick B → Phase 75 below.

- [x] Phase 75 — Combat HUD tap-tooltips (Phase 74 Tick B).
      Shipped 2026-05-24 in commit `de3bb7b`. `<TapTooltip>` now
      wires three combat HUD surfaces: buff/debuff effect chips
      (enemy + player HUDs), stance ADV/DIS badges, and skill
      picker rows (long-press). `selectTooltipContentFor` fills
      the `kind: 'effect'` / `'stance-chip'` / `'skill'`
      branches Tick A left null — effects + skills read engine
      static data via `lookupEffect` / `getCombatSkillById`;
      stance chips use locked static content. `CombatEffectDisplay`
      gains `effectId` so chips can pass the engine id through.
      No combat-modal layout changes (additive tap targets only;
      honours the 36th /oversight call's combat-modal-audit
      bias). 1234/1234 verify green (+10 from 1224). Brief at
      `plan/phases/phase_75_combat_hud_tap_tooltips.md`.

- [x] Phase 76 — Engine narrative prose consumer (aftermath
      panels). Shipped 2026-05-24 in commit `a393ece`. Aftermath
      presenter (`state/presenters/aftermath.engine.ts`) now
      reads per-foe `finalBlowLines` / `pactLines` / `causeLines`
      from `combat.enemy` via the `AftermathData` snapshot (which
      gained those optional fields). Engine lines win when
      present; presenter falls back to the existing per-tier
      generic phrase when absent (~13/16 enemies lack lines
      today). Closes the 3 Phase-70-follow-up rows. 1244/1244
      verify green (+10 from 1234). Brief at
      `plan/phases/phase_76_engine_narrative_prose.md`.

- [x] Phase 77 — BEGIN AGAIN run-loop consumer. Shipped
      2026-05-24 in commit `7ce2e44`. `EncounterModalOverlay
      .handleBeginAgain` now dispatches `actions.resetRun({
      keepCharacter: true })` (new wrapper in `state/actions.ts`
      forwarding to engine GameStore `resetRun` primitive,
      Phase 72 [ENGINE LANDED]). Atomic engine reset: new
      `runId`, full-heal, clears effects, regenerates world/
      quests/flags. Drops the Phase 70 Tick C raw
      `store.setState({ player: { health: maxHealth }})`
      band-aid. Mobile-only `resetRunStats()` stays alongside —
      `encountersFaced` / `deepestNodeId` live on combat-mode
      provider (engine doesn't track yet). New hermetic pin
      asserts runId rotates + health refills + effects clear.
      1245/1245 verify green (+1). Brief at
      `plan/phases/phase_77_begin_again_run_loop.md`.

- [x] Phase 78 — Codex / journal-entry consumer (friendship
      panel). Shipped 2026-05-24 in commit `2cd8d53`.
      `actions.endCombat` widens to return the engine
      `CombatEndReport` (was void). Parley snapshot in
      `app/(tabs)/combat.tsx` reads
      `report.friendshipReward.codexEntryUnlocked` + the live
      `combat.enemy.journalEntry.body` to populate the
      `AftermathData.journalEntry` field; `<CombatFriendshipPanel>`'s
      long-dormant "A NEW ENTRY" card renders unchanged when
      populated. Engine's `state.codex.unlockedEntries`
      dedupe is the only gate — repeat friendships with the
      same foe collapse the section silently. New
      `derivePreview` helper truncates engine body to
      first-sentence ≤120-char fragment. Optional Tick B
      (MEMOIR tab list of unlocked entries) deferred per brief
      §6 Follow-ups. 1255/1255 verify green (+10 from 1245).
      Brief at `plan/phases/phase_78_codex_unlock_consumer.md`.

- [x] Phase 79 — Skill / craft functionality audit. Shipped
      2026-05-24 in commit `1053ef8`. Three findings: (A) engine
      silently blocks every pick on `not-equipped` (player has
      no equipped skills); (B) mobile flat-sum `manaCost`
      diverges from engine per-resource `canUseSkill` check;
      (C) `summarizeRoundEvents` dropped 9 of 10
      `phase: 'skill'` event kinds — A and B invisible because
      of it. Combat-modal rewrite (`02b75db`) was NOT a
      contributor (dispatch shape survived cleanly). AUDIT
      `[2.0]` combat.skills.fixture row was stale (file deleted
      in Phase 16) — marked resolved. Shipped fix for (C):
      `summarizeRoundEvents` now logs all 10 kinds, including
      the critical `blocked` reason in chronicle voice. (A) +
      (B) filed as Phase 79a (equippedSkills filter, score 7.5)
      + Phase 79b (per-resource enablement, score 6.5) in
      `PHASE_CANDIDATES.md`. 14 new pins, 1269/1269 verify
      green (+14 from 1255). Brief at
      `plan/phases/phase_79_skill_craft_audit.md`.

- [x] Phase 80 — Tooltip cluster (modal portal + consolidation
      + SELF derived table). Closed via `/oversight` 2026-05-25
      (41st call). All three sub-phases shipped: 80a (tooltip
      portal), 80b (TooltipTarget consolidation), 80c (SELF
      derived tooltips).
- [x] Phase 80a — Tooltip overlay portal (mount tooltips inside
      RN `<Modal>` surfaces). Shipped this commit. Scope landed
      smaller than the brief anticipated: only the inventory item
      modal uses RN `<Modal>` (CorruptSaveModal too, but no tooltip
      consumers); LevelUpModal + EncounterModalOverlay are inline
      overlays already covered by the root `<TooltipProvider>`.
      Fix: wrap the inventory `<Modal>` contents with a sibling
      `<TooltipProvider>` (Option A from the brief — isolated
      provider per modal so the overlay paints inside the modal's
      view tree). Added `id?: string` to `StatDelta` carrying the
      engine stat key (`physicalAttack`, `physicalDefense`,
      `mentalAttack`, `emotionalDefense`); inventory modal wraps
      each stat row with `<TooltipTarget kind="item-stat" id={d.id}>`
      reusing the Inventory Tick 2 synthesizer. +2 tests pin the
      shape + view wiring (engine-key contract + 4 testIDs).
      1342/1342 verify green (+2 from 1340).
- [x] Phase 80b — TooltipTarget consolidation — drop the inline
      duplicate in `app/(tabs)/combat.tsx`. Shipped in commit
      `0889a9e`. Pure refactor: removed ~40-line local
      TooltipTarget interface + function, replaced with import
      from `@/components/tooltip/TooltipTarget`; cleaned up unused
      Pressable import. 1342/1342 verify green; no behavioural
      change.
- [x] Phase 80c — SELF derived ATK/SKL/DEF table tooltips.
      Shipped in commit `34dfc49`. Added attackId/skillId/defenseId
      to DerivedStatRow; wrapped all 9 derived cells with
      `<TooltipTarget kind="item-stat">` reusing the Inventory
      Tick 2 synthesizer. +1 test pinning the 9 engine stat ids.
      1343/1343 verify green (+1 from 1342).

- [x] Phase 81 — Engine reconciliation + cleanup cluster.
      Closed via `/oversight` 2026-05-25 (41st call). All three
      sub-phases shipped: 81a (MapDefinition reconciliation,
      Tick B engine-blocked), 81b (hex-literal drain), 81c
      (combat.tsx extraction).
- [x] Phase 81a — Engine MapDefinition reconciliation (resolves
      AUDIT `[4.0]` + `[3.0]` `[needs-engine-release]` rows).
      Engine source has 25-node branching graph; published 0.11.0
      still has 10-node linear. Tick A reconciliation doc shipped
      (`040a7f2`). **Direction: Option A** (set via /oversight
      39th call, 2026-05-24): align mobile spine to engine source
      + add 15 new nodes (fv-11..fv-25). Mobile loses cross-spine
      shortcuts but gains 3 districts (harbor, inland, cliff).
      Scope:
      - Tick A — DONE (`040a7f2`). Reconciliation doc at
        `docs/engine-map-reconciliation-2026-05-24.md`.
      - Tick B — **blocked on engine publish** (0.12.0). Once the
        25-node graph lands in the published dist: (1) replace
        mobile fixture's cross-spine edges with engine's linear
        spine edges; (2) add 15 new NodeLayout entries with
        authored positions/labels/types/descriptions; (3) ship
        OPEN-set migration (`availableNodes` → `discoveredNodes`).
      Acceptance: AUDIT `[4.0]` + `[3.0]` rows flip to ✅; engine
      is documented source of truth; exploration suite green.
      `[DONE - mobile side complete in commit f764a46]`.
- [x] Phase 81b — Hex-literal `'#0a0a0a'` + `'#06050a'` cluster
      drain to AXM tokens. Shipped in commit `c0bbb33`. Swept
      17 style-property `'#0a0a0a'` → `AXM.bg` + 6 `'#06050a'`
      → `AXM.deepBg` + 2 SVG attributes in tokens.tsx across
      8 production files. Tokens already existed in `theme/axm.ts`
      (no new token additions needed). SVG glyph fills in
      illustration components left as double-quote string
      attributes (follow-up concern). 1343/1343 verify green.
- [x] Phase 81c — `app/(tabs)/combat.tsx` sub-component
      extraction. Shipped in commit `7ae9ee9`. Extracted 8
      components + 6 style sheets to
      `components/combat/PhaseBottom.tsx`. combat.tsx dropped from
      1476 to 786 lines (47% reduction, well under the ~1000-line
      target). Combined all three ticks into one since the
      components form a cohesive tree. 1343/1343 verify green.

- [x] Phase 82 — Phase 79 audit follow-ups (skill picker +
      per-resource enablement). Closed via `/oversight` 2026-05-25
      (41st call). Both sub-phases shipped: 82a (equippedSkills
      filter), 82b (per-resource enablement).
- [x] Phase 82a — Skill picker filters by `player.equippedSkills`.
      Shipped in commit `2aeda82`. buildSkillPicker now accepts
      optional equippedSkills filter; reads from state.player
      (global character), falls back to combat entity, then no
      filter. +1 test pinning the contract. 1344/1344 verify green
      (+1 from 1343).
- [x] Phase 82b — Mobile skill enablement reads engine
      `combatResources` per-type. Shipped in commit `6a4c5ab`.
      Skill picker now checks each resource type independently
      via `canAffordSkill(cost, pool)` against
      `combat.combatResources`; added `resourceCost` to
      `CombatSkill` adapter; renamed disabledReason to
      `'insufficient-resources'`; removed `mana`/`manaMax` from
      `SkillPickerSlice`. 1344/1344 verify green.

- [x] Phase 83 — Hex-literal `'#0a0807'` drain to
      `AXM.silhouette`. Shipped in commit `a08a10f`. Replaced
      10 occurrences across 6 files (LevelUpModal, aftermath
      panels, PixelEmblem, EncounterModalOverlay). ErrorBoundary
      skipped. 1345/1345 verify green.
- [x] Phase 85 — Mechanics-vs-UI audit on the combat-modal
      rewrite (2026-05-23). Promoted via `/oversight` 2026-05-24
      (40th call). Audit the combat surface inside
      `EncounterModalOverlay` against the engine's combat reducer.
      See PHASE_CANDIDATES.md `[score 6.5]` row. See commit `408600f`.
- [x] Phase 86 — Aftermath rendering inside the encounter modal.
      Promoted via `/oversight` 2026-05-24 (40th call). Wire
      aftermath panels (victory, defeat, friendship) to render
      inside the encounter modal overlay instead of requiring a
      route transition. See PHASE_CANDIDATES.md `[score 6.0]`
      row (originally Phase 66 candidate). **Already implemented
      in Phase 70** — aftermath panels are rendering inside
      EncounterModalOverlay when `mode === 'aftermath'`. Tests
      confirm victory/parley/defeat panels swap correctly. See
      `05d85e7`, `8baf37a`, `a6b1665`.
- [x] Phase 87 — DEV-mode coverage expansion. Promoted via
      `/oversight` 2026-05-24 (40th call). One debug affordance
      per ported mechanic (XP, mana, alignment, effects, event
      triggers, dialogue, quest state, friendship, currency, HUD
      overrides). See PHASE_CANDIDATES.md `[score 6.0]` row.
      Shipped `cffbc9b` — DebugCurrencyControl (50/500S grants + 
      BROKE reset) + DebugHudOverrides (mana/effects/stance
      visibility toggles) + devOverrides.hud slice + combat HUD
      presenter integration. 38 new tests. DevMenu coverage
      complete.
- [x] Phase 88 — LevelUpModal derived-preview ribbon. Promoted
      via `/oversight` 2026-05-24 (40th call). Shipped in commit
      `d2355a8` — DerivedPreviewRibbon component + local
      previewAllocation helper. ATK/SKL/DEF grid with real-time
      preview.
      `[score 4.0]` row.
- [x] Phase 89 — Combat log-entry shape audit + regression pin
      for boss-skill killing-blow crash. Promoted via `/oversight`
      2026-05-24 (40th call). Shipped in commit `51ec064` —
      aftermath-snapshot regression test + engine type contract
      divergence documentation. Confirms defensive optional chaining
      patterns from hotfix 043d607.
      `[score 3.5]` row.
- [x] Phase 84 — Inventory screen sub-component extraction.
      Shipped in commit `41f8368`. Extracted ItemCard, ItemGlyph,
      groupByCategory, CATEGORY_ORDER + 19 styles to
      `components/inventory/ItemCard.tsx`. inventory/index.tsx
      dropped from 1099 to 703 lines (36% reduction).
      1345/1345 verify green.

- [x] Phase 90 — Nested button accessibility fix in stance
      picker. Promoted via `/oversight` 2026-05-25 (41st call)
      from PHASE_CANDIDATES `[score 3.0]` / AUDIT `[8.0]`.
      Refactor ADV/DIS badge from `Pressable` to `View` +
      accessibility props to eliminate the nested `<button>`
      DOM violation. Console errors on web; breaks hydration
      semantics; screen readers double-announce. Single tick.
      Commit: `fix(spec90): nested button a11y fix in stance
      picker` `[fead194]`.

- [x] Phase 91 — Battle log two-line format. Promoted via
      `/oversight` 2026-05-26 from PHASE_CANDIDATES `[score 5.5]`
      after the build-plan queue emptied. Scope: connect player
      input to combat output by rendering two-line log entries,
      e.g. `You chose ATTACK (Heart stance)` then
      `Applied: Fleeting Kindness.` Presenter-first change;
      preserve existing combat resolution semantics. Acceptance:
      battle log shows both choice and applied effect for stance +
      action outcomes, regression coverage pins F04, verify gate
      `[DONE — see commit 9a88819]`.
      green. See `plan/phases/phase_91_battle_log_two_line_format.md`.
- [x] Phase 92 — Flee narrative feedback + morale surface.
      Promoted via `/oversight` 2026-05-27 (42nd call) from
      PHASE_CANDIDATES `[score 5.0]`. Scope: add narrative beat
      after fleeing (prose style matching death/victory text) +
      expose morale value on exploration card or SELF tab. Morale
      bar visual design deferred to combat UX design handoff.
      Playtest source: F03.
- [x] Phase 93 — Death screen presenter fixes. Promoted via
      `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES
      `[score 4.5]`. Scope: fix encounter-survived counter (dying
      = 0 survived, not 1) + resolve deepest node ID to human-
      readable name via map layout lookup. Both presenter changes.
      Playtest source: F09, F10. Shipped `ccd2438`.
- [x] Phase 94 — Sealed node tap feedback. Promoted via
      `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES
      `[score 4.0]`. Scope: tapping a sealed map node shows a
      brief toast ("This path is sealed."). Playtest source: F11.
      Shipped `ece582f`.
- [x] Phase 95 — Disabled ITEM button tooltip in combat. Promoted
      via `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES
      `[score 4.0]`. Scope: tapping the disabled ITEM action button
      shows a tooltip explaining unavailability. Non-visual combat
      fix (allowed under combat-surface design gate). Playtest
      source: F12.
      Shipped `d198039`.

- [x] Phase 96 — Combat UX legibility overhaul (design-first) `939efd2`.
      Promoted via `/oversight` 2026-05-30 (43rd call) from
      PHASE_CANDIDATES `[score 3.5]` (the highest-impact open
      audit lever: [4.5] Combat UX unintuitive, impact 9 /
      ease 3). Lifts the combat-surface design gate for this
      track. Tick A is a DESIGN pass — no shipped-code edits:
      produce a combat-UX design brief clarifying iconography,
      terminology, and information hierarchy for the unclear
      numbers / icons players flagged. Source findings: AUDIT
      [4.5] + playtests [F02] encounter jargon, [F04] battle-log
      ability names, [F05] LET phase numbers, [F06] CRUCIBLE
      symbols. Estimated 3 sub-phases (96a design → 96b/96c
      implementation); split 96b/96c out once the design brief
      lands. Code work is gated on the design brief — do not
      ship combat-surface UI changes ahead of it.

- [x] Phase 97 — Combat correctness (token accrual + re-trigger +
      skill-equip). Promoted via `/oversight` 2026-06-01 (51st call)
      from PHASE_CANDIDATES `[score 7.5]` "Combat token accumulation
      fix", bundling two sibling HIGH user-bugs from the same
      playtest (#226/#227) per the oversight scope decision. Three
      user-spotted blocking bugs, all on the engine↔presenter
      boundary, ship as one phase:
      (a) Token resource system never accumulates — tokens are
      displayed as a static value instead of reading the engine's
      per-round `combatResources` accrual; without them no skill can
      be cast (AUDIT [user-issue #227], CRITIQUE [HIGH], issue #227).
      (b) Combat cannot be re-triggered after a victory (only after a
      loss) — CRITIQUE [HIGH].
      (c) Learned skills blocked as "not equipped"; combat should
      surface only currently-usable skills — CRITIQUE [HIGH].
      Verify each fix reads engine state rather than a local
      placeholder; engine logic stays in `axiomancer-mechanics`.
      Reference #226/#227 in the commit body. Non-visual combat
      logic fixes (allowed under the combat-surface design gate).

- [x] Phase 98 — Combat terminology implementation (Phase 96
      follow-up). Shipped in commit `b6593df` (`feat: combat
      terminology clarity — phase 98`) after brief commit `8bd99e7`.
      Implements the iconography / terminology / information-hierarchy
      changes from the Phase 96 design-first brief, closing AUDIT [4.5]
      and playtests [F02]/[F04]/[F05]/[F06].

- [x] Phase 99 — Glanton Nexus state reconciliation guardrail per T
      approval 2026-06-01 `[DONE — see commit 798f289]`. **Runs before new UI polish phases.** The
      autonomous workspace is colliding with Hermes/T decisions: memory,
      central ledger, `/march`, `/oversight`, build plans, critique/audit
      logs, and phase candidates drift out of sync. Unit 1 — state audit:
      compare central `~/Workspace/SOMBERSOFT_COMMAND_LEDGER.md`, mobile
      build plan/candidates/critique/audit, repo-local Nexus skills
      (`march`, `oversight`, `iterate`, `expand`, `jot`, `ship-a-phase`),
      and latest settled T decisions. Unit 2 — source-of-truth law:
      document hierarchy (T latest explicit decision → CDRs/ADRs →
      central ledger → active build plan → phase candidates → critique/audit → historical
      reports) in repo-local Nexus docs/skills. Unit 3 — guardrails: add
      `/oversight` decision-sync checklist and `/march` state-sanity
      preflight so stale Pending rows, deferred candidates, and
      shipped-but-undrained critique findings are surfaced before workers
      act. Unit 4 — evidence: record a reconciliation report and patch any
      obvious stale rows found during the phase. Brief:
      `plan/phases/phase_99_glanton_nexus_state_reconciliation_guardrail.md`.
      Score 8 × 7 / 10 = 5.6.

**Queued via `/oversight` 2026-06-02 (52nd call) — build-plan queue
was drained after Phase 99; these three refill it. The first two
combat user-bugs and the combat-UX finding were already shipped by
Phases 97/98 — their CRITIQUE/AUDIT rows are now drained, not new
work. The engine-side "difficulty too hard / no progression curve"
finding stays OPEN and `[needs-engine-release]` (mobile cannot fix
engine balance); Phase 100 gives it a testable harness.**

- [x] Phase 100 — Dev-Menu seeded test playthroughs. Promoted via
      `/oversight` 2026-06-02 from CRITIQUE [MED] /dev (user-jot,
      commit `ff2b8ae`). Add two Dev-Menu seed presets that
      initialize engine state to reproducible fixtures: (a) a fresh
      level-1 run against easy enemies (start-of-game testing) and
      (b) a max-level / all-items / all-skills endgame run (endgame
      testing). Today everything starts at level 1 / 5-each with
      enemies that rubber-band to the player, so neither extreme is
      exercisable. Scope is the MOBILE Dev-Menu affordance + state
      seeding only — engine-side balance / progression-curve work
      (CRITIQUE [MED] difficulty, `[needs-engine-release]`) is out of
      scope and stays open for an engine decision. Pin hermetic tests
      that each preset produces the expected seeded state. Score 4.0.
      Shipped in commit 90a2abb.

- [x] Phase 101 — App-folder hermetic test coverage. Promoted via
      `/oversight` 2026-06-02 from PHASE_CANDIDATES `[score 4.5]`.
      `app/` has 9 source files with 0 test files while `components/`
      holds ~50% ratio. Add hermetic e2e tests for the app/ routes
      following the `docs/testing.md` standard (tests live under
      `state/e2e/` per the doc's mandate, NOT under `app/`). Pure
      mobile, no engine dependency. Score 4.5.
      Shipped in commit 9201f4f.

- [x] Phase 102 — `combat.tsx` decomposition. Shipped 
      2026-06-02 in commit `8d99560`. Extracted three focused 
      components: CombatEnemyPanel (213 lines), CombatLogDisplay 
      (87 lines), CombatPlayerHud (76 lines). Main combat.tsx 
      reduced from 814 → 477 lines. Presenter contract preserved, 
      verify gate green. Unit tests for all extracted components.

- [x] Phase 103 — Befriend mercy-choice modal. Present the engine-emitted post-Befriend choice as a mobile modal: spare/befriend/preserve or exploit the opening for a free guaranteed critical attack. Mobile must not decide eligibility locally. Brief: `plan/phases/phase_103_befriend_mercy_choice_modal.md`. Shipped in commit 8afb091.

- [x] Phase 71 — Encounter-seal chrome refresh. Shipped
      2026-05-22 in commit (`5568b1f`). Sibling to Phase 70 —
      phase-aware top + bottom `SEALED` chain bars (`SEALED · AT
      ARMS` → `SEALED · ROUND i/ii/iii` → `IT IS DONE` / `CARRY
      ON`) plus panel border + outer glow flip from blood (intro
      / combat) → sulfur (aftermath). New `selectEncounterSealChrome
      (mode, round?)` presenter helper. Single-tick phase; the
      chain bars now wrap every mode (pre-71 they only mounted
      in prelude). 12 new tests across 2 suites; 1159/1159
      verify green.

- [x] Phase 69 — `store.setState` typed-wrapper sweep.
      Shipped 2026-05-22 in commit `c669ed8` as a single tick
      (Tick A + Tick B combined). Root-cause investigation
      revealed the wrapper at `state/store.ts:152`
      (`engineStore as unknown as AppStore`) already widens
      the engine `StoreApi<GameStore>` to
      `StoreApi<AppStoreState>` — `setState` accepts
      `Partial<AppStoreState>` including mobile-private
      slices. Every call-site `as any` cast was redundant
      historical accumulation. Dropped 10 casts (1 in
      `state/store.ts`, 9 in `state/actions.ts`); 1060/1060
      tests unchanged. Engine-shape extension casts
      (`lastResolution`, `playerChoice: {}`,
      `enemyAction.action`, `combatAppendLog`) left in place
      per brief §6 — different problem, not setState. See
      `plan/phases/phase_69_store_setstate_typed_wrapper.md`.

- [x] Phase 68 — Character + Memoir mechanics-vs-UI audits.
      Both ticks shipped 2026-05-22; closes the 6-surface
      audit series (combat ✅, event ✅, exploration ✅,
      inventory ✅, character ✅, memoir ✅).
      - Tick A ✅ `2f3f4bb` — character/SELF surface audit
        (`docs/mechanics-ui-audit-2026-05-22-character.md`).
        12 decisions; 5 ALIGNED, 3 MOBILE-ONLY, 4 DRIFT
        rows filed.
      - Tick B ✅ (this commit) — memoir surface audit
        (`docs/mechanics-ui-audit-2026-05-22-memoir.md`).
        12 decisions; 1 ALIGNED, 7 MOBILE-ONLY (highest
        ratio of any audited surface — journal is by
        nature presentational), 4 DRIFT (all typing).
      - 6-surface audit-series combined totals: 73
        decisions, 19 DRIFT rows filed, 25 ALIGNED, 27
        MOBILE-ONLY by design. No further mechanics-vs-UI
        audit phases expected until a new tab/surface ships.

> **`design-spec.md` cold-codex item (4)** is **not** in
> phases 34–43. Per its own brief body it needs a fresh
> `Phase 25 — Aesthetic toggle` candidate filed via
> `/oversight`, since it's three screens + a togglable
> aesthetic mode (much larger surface). Stays in
> `PHASE_CANDIDATES.md` rather than the build plan.

> bug findings, presenter refactors, asset backlog, ongoing
> audits. `/march` makes that transition automatic. (Block II
> phases 20/21 and Block III phase 24 in
> `plan/PHASE_CANDIDATES.md` are gated on engine releases or
> stay below promotion threshold; `/expand` re-evaluates.
> Block III phase 22 promoted to Phase 59 via `/oversight`
> 2026-05-20.)

> **Note on the deploy gate before phase 11 ships:** auto-deploy
> is **not** a thing for this project. `npm run deploy:check` is
> a stub that exits 0 with a notice. The shipping skills still
> call it as Step 12 so the contract stays uniform.

---

## Per-phase scope

Each row above corresponds to one phase. The detailed brief
lives at `plan/phases/phase_<N>_<topic>.md`. If a brief is
missing when the loop reaches its phase, the loop generates one
from the scope below + the matching `specs/NN-*.md` document.

### Phase 1 — Adopt nexus methodology

Land the nexus overlay (`agents.md`, `plan/`, `skills/`,
`.claude/`, `scripts/deploy-check.mjs`, `.env.example`) without
touching `app/`, `components/`, `state/`, or any other product
code. Detailed brief: `plan/phases/phase_1_bootstrap.md`.

### Phase 2 — Fix engine API drift (verify-gate unblocker)

Inserted at adoption time because `npm run verify` is RED on
the current `main`. The most recent commit (`845a4a7`,
"Install latest mechanics package") bumped
`axiomancer-mechanics` past a breaking API change without
migrating callers:

- `Consumable.effect` → `Consumable.effectId`
- `Equipment` now requires `rarity` and `requiredLevel`

Files to migrate:

- `state/actions.ts:550` — rename `.effect` to `.effectId`
  (or the equivalent lookup, depending on how the consumable
  resolves).
- `state/e2e/inventory.engine.test.ts` — fixtures at lines 42,
  48, 58: rename + add the two missing required fields.
- `state/e2e/inventory.modal.engine.test.ts` — fixtures at
  lines 42, 46, 84.
- `state/e2e/inventory.screen.test.tsx` — fixtures at lines 66,
  70.

For `rarity` / `requiredLevel` defaults, check the engine's
`Equipment` type definition in
`node_modules/axiomancer-mechanics` for the enum / numeric
range; pick conservative defaults (`rarity: "common"`,
`requiredLevel: 1`) and note the call in the commit body.

`pnpm test` should be green twice + `npx tsc --noEmit` clean
before flipping the row. Move the `[HIGH]` AUDIT entry to
"Done".

### Phase 3 — Spec 02: Engine store integration

Pull `createGameStore` from `axiomancer-mechanics`. Wrap it in
a `zustand` store at `state/store.ts`. Provide a
`GameStoreProvider` and per-screen selectors. Migrate one
screen as a proof (combat already works against the new
contract — use it as the sibling). Detailed brief generated by
`/plan-a-phase` from `specs/02-engine-store-integration.md`.

### Phase 4 — Spec 03: Presenter layer

Lock the `select<Screen>ViewModel(state, t) → ViewModel`
contract. Document in `docs/presenters.md`. Land hermetic e2e
infra under `state/e2e/`. Detailed brief generated from
`specs/03-presenter-layer.md`.

### Phase 5 — Spec 05: Character screen wiring

Apply the canonical-sibling pattern from Spec 04:
`character.engine.ts` (pure), `character.tsx` (view shell),
hermetic e2e at `state/e2e/character.engine.test.ts`,
`character.copy.ts` for strings. Brief from
`specs/05-character-screen-wiring.md`.

### Phase 6 — Spec 08: Event screen wiring

Same shape. **Engine dependency satisfied as of
`axiomancer-mechanics@0.6.0`** — `createGameStore` exposes
`moveToNode` / `processNode` / `applyDialogue` on
`GameActions`, and `ProcessNodeResult` / `ProcessedEvent` /
`DialogueTree` / `MapEvent` types are public. The remaining
blocker is the **five open product questions in
`specs/08-event-screen-wiring.md`** (VM kind split,
machine-readable vs descriptive consequences, slug→asset map
location, mid-combat events, skip-button behaviour). While those
remain unanswered the `[skipped]` row stays; the
`[needs-user-call]` AUDIT entry tracks resolution. Brief from
`specs/08-event-screen-wiring.md`.

### Phase 7 — Spec 09: AsyncStorage persistence

Add an `AsyncStorage` adapter that satisfies the engine's
storage interface. Wire `GameStoreProvider` to rehydrate on
mount + persist on every transition. Hermetic e2e against a
memory adapter; integration against a stub `AsyncStorage`.
Brief from `specs/09-asyncstorage-persistence.md`.

### Phase 8 — Spec 10: Navigation + app shell polish

Deep links (Expo Router config), back-behaviour audit, tab
badges (e.g., new event indicator), splash → first screen
handoff sans flicker. Brief from
`specs/10-navigation-and-app-shell.md`.

### Phase 9 — Spec 11: Asset pipeline

Drain the SVG placeholder backlog one asset at a time per
`.cursor/skills/swap-asset-placeholder/SKILL.md`. Each tick
ships one real asset + its size variants + its swap commit.
This is the natural transition point to `/iterate` once the
other screen phases are done. Brief from
`specs/11-asset-pipeline.md`.

### Phase 10 — Spec 12: Accessibility + theming polish

`accessibilityLabel` audits, `accessibilityRole`, reduce-motion
respect, font-scaling sanity, large-text support, dark-only
confirmation. Brief from
`specs/12-accessibility-and-theming.md`.

### Phase 11 — EAS Build deploy gate wiring

Replace the `scripts/deploy-check.mjs` stub with a real EAS
Build API poll. Add a `setup/02_eas.md` runbook covering the
EXPO_TOKEN scopes, the `EAS_PROJECT_ID` lookup, the polling
budget, and the failure-mode contract. Verify with one
deliberately broken deploy + one good deploy.

### Phase 12 — App icon + splash screen polish

Final adaptive icons (foreground / background per Android
spec), iOS app icon, splash background = `AXM.bg`, splash
logotype in Pirata One. Asset swap follows the standard
contract.

### Phase 13 — TestFlight + Play Internal Track first cut

Production EAS builds, store listing drafts, screenshots from
the simulators, internal testers invited. The end of the
substrate; `/iterate` takes over after.

### Phase 14 — UI fixes: Character crash + Event tab → modal

Two-issue cleanup that landed informally in commit `5dd597b`
("Bug issues") before being promoted. (1) Move the Event screen
out of the `(tabs)/` group and present it as a full-screen modal
gated by `selectHasActiveEvent` — the EVENT tab no longer
belongs alongside MAP/COMBAT/SHEET/SACK. (2) Add null-safe
fallbacks in `selectCharacterViewModel`'s `buildDerived` /
`buildSaves` helpers so a save without `derivedStats` /
`nonCombatStats` renders zeros instead of throwing. Brief at
`plan/phases/phase_14_ui_fixes.md`; row stays open for the next
`/march` tick to validate the listed acceptance criteria.

### Phase 15 — Persistence migration: backfill engine state fields

Replace the Phase 14 null-guard with a durable fix: extend the
existing `schemaVersion` migration runner (shipped in Phase 7)
with a step that populates `derivedStats` and `nonCombatStats`
on load. Prefer engine helpers if exposed; zero-fill otherwise.
Drop the `(player as any)` casts + `?? 0` fallbacks once the
migration is guaranteed to run. Brief to be drafted by
`/plan-a-phase` from `specs/09-asyncstorage-persistence.md` (no
dedicated spec — this is an additive migration on the existing
adapter).

---

## Carry-overs / known gaps (update as phases ship)

- **Combat-overhaul campaign SHIPPED 2026-06-28.** mechanics `0.34.0` published (status-depth: 10 live keywords + 7 build-around cards; main `7ecd4e2`, tag `v0.34.0`); mobile consumed it (app `1.5.0`, dep `^0.34.0`, main `ffc8c8f`) and lit the new keywords up; the card face/detail/layout/dice/fx overhaul shipped (`d019b0a..ffc8c8f`); EAS preview build `f3d7f1e0`. Follow-up mobile work = **Phase 161** (polish) + **Phase 162** (surface new cards). NOTE: this overhaul substantially overlaps the still-`[ ]` **Phases 158/159** (combat card compact glyphs/keyword chips + detail keyword glossary) — reconcile/close them against the shipped work. Roadmap: `findings/combat-overhaul-roadmap.md`.
- **[Phase 163] [HIGH] Combat win-rate saturation — mechanics-owned, cross-repo.** 0.34.0 sim = 100% win across policies; PRE-EXISTING (pure-strike also 100%; witness grinds via shared signatures), not from the status-depth epic. Needs a `/combat-tuning` pass in `axiomancer-mechanics` for real failure pressure. Mobile is presentation-only; NOT mobile-loop-actionable. Brief: `plan/phases/phase_163_combat_winrate_tuning.md`.
- **[Phase 164] [content] Engine-gated combat content backlog.** INVERT / VOLATILE / Oracle's Read / Overcharge / dice-shaping (TEMPER/BANK/SPLIT) / ESCALATE / DOOM / Conviction-sink — each needs new engine behavior first (mechanics), then mobile honesty surfacing. Brief: `plan/phases/phase_164_engine_gated_combat_content.md`.
- **Rotate the npm publish token** (pasted in-session 2026-06-28; stored in `~/.npmrc`).

### [user-issue #333] [MED] Gate Hazard Minigame on mechanics package engine
- category: external-issue  
- impact: 6
- ease: 7
- next: /iterate will pick up; reference #333 in commit body.

- **No `setup/` runbooks yet.** Phase 10 (EAS) and a
  follow-up GitHub runbook are queued; until then,
  `agents.md` "Operational secrets" is the canonical config
  doc.

## Phase log (commit hashes)

- phase 1 — a703908 — adopt nexus methodology overlay (substrate;
  no product code changes)
- phase 2 — 527f021 — engine API drift fix (effect → effectId on
  Consumable; rarity + requiredLevel on Equipment fixtures;
  verify gate green at 185 / 185)
- phase 3 — efef5f5 — engine store integration (Spec 02;
  GameStoreProvider, useGameState, useGameActions, typed action
  wrappers, hermetic e2e harness)
- phase 4 — e378f99 — presenter layer contract (Spec 03;
  docs/presenters.md, 5 *.engine.ts stubs, route-tree guard,
  freeze.ts helper, deep-freeze invariant; preceded by scaffolds
  in e56184e)
- phase 5 — 4afb4ed — character screen wiring (Spec 05;
  selectCharacterViewModel, character/ route folder, hermetic
  e2e, read-only stat surface)
- phase 6 — 2c4d2b0 / 31e42f0 / beba7d4 / <this commit> —
  event screen wiring (Spec 08; four sub-ticks: presenter +
  store slice, action layer, screen refactor, close-out);
  selectEventViewModel composes from ProcessNodeResult +
  DialogueTree cursor; two VM kinds (combat-prelude,
  narrative-choice); eventActions {processCurrentNode,
  pickEventChoice, dismissEvent}; illustrations under
  components/event/ (out of router tree); +20 hermetic tests
  verify green at 321/321. Phase 19 closed as drained by
  Phase 6 Tick A — selectHasActiveEvent reads engine truth.
- phase 7 — aa187cd / 09bc44e / 2f8ecea — AsyncStorage
  persistence adapter (Spec 09; createAsyncStorageAdapter,
  migrations runner, preload-before-mount, 15 hermetic e2e,
  +200/200 verify green; first phase the loop built from
  scratch)
- phase 8 — 6fc00dd — navigation + app shell polish (Spec 10;
  smart cold-start routing, deep links for character/events,
  tab badges, hardware back disabled during combat, hermetic
  navigation presenter tests; +209/209 verify green)
- phase 14 — 5dd597b — UI fixes: Character crash + Event tab →
  modal (event screen moved out of (tabs)/ behind a
  fullScreenModal Stack.Screen + new `EventGate` driver;
  `selectCharacterViewModel` null-guards `derivedStats` /
  `nonCombatStats` with `?? {}` / `?? 0`; brief verified by
  /march on 2026-05-14; verify green at 249/249)
- phase 15 — c8e29a8 — persistence migration v1→v2 backfill
  engine state fields (schema version bumped to 2 with migration
  step that populates missing derivedStats/nonCombatStats using
  engine helpers; character presenter null-guards removed;
  verify green at 260/260)
- phase 23 — f7d4212 / 3eb49c2 / ec7b52c / 93f4091 —
  event subsystem migration to engine 0.7.0 (ResolveMapEventResult
  / ResolvedEvent / 8 typed MapEvent kinds; engine 0.6 →
  0.7 drift recovery; four sub-ticks: type migration +
  fixtures, action rename processCurrentNode →
  resolveCurrentMapEvent, screen render coverage for new
  kinds, close-out; +new procedural illustrations for
  village / cutscene / hazard; restored verify from RED →
  337/337; engine pin tightened to exact 0.7.0 in the
  preceding oversight commit c698073 to stop further
  auto-bump drift)
- phase 26 — d8d2e33 — drain stale presenter stubs
  (one tick: navigation.engine selectTabBadges reads
  selectHasActiveEvent + player.experience vs
  experienceToNextLevel; combat.engine STANCE_DERIVED
  deleted and stance picker reads player.derivedStats via
  the engine's emotional/physical/mental stat triples;
  state/actions.ts file-header + line-420 skillLookup
  comment swept to current 0.7.0 surface and Phase 16
  reference; +5 hermetic tests; 342/342)
- phase 25 — 3d2f497 / 8baf594 — typed event surface
  consumer (two ticks: A wires GameEventEmitter through
  createAppStore + new mobile-private _recentEvents ring
  buffer + selectRecentEngineEvents presenter; B adds
  useGameEvents React hook + close-out). Engine 10 typed
  events now flow to mobile; consumers narrow via is*Event
  guards from axiomancer-mechanics. +15 hermetic tests
  (11 emitter contract + 4 hook subscription); 357/357.
  Bespoke severity inference in summarizeRoundEvents
  remained intact — engine combat:round payload is
  {state} only; the brief revised the original "drop
  inference" goal at plan time.
- phase 27 — 25ed90c — exploration moveToAction
  migration (engine revealAdjacent / markNodeConsumed,
  additive). moveToAction now populates the engine's parallel
  discoveredNodes field after a successful move via
  revealAdjacent (engine derives neighbours from
  getMapDefinition). resolveCurrentMapEvent populates the
  consumedNodes field after a non-'none' event resolves.
  Legacy availableNodes / completedNodes writes stay for the
  screen — screen + presenter migration to the new fields
  deferred to a future Phase 30 TBD.
  state/exploration-maps/types.ts JSDoc names the new
  boundary explicitly (visual-layout-only post-Phase-27).
  +4 hermetic e2e cases; 361/361.
- phase 28 — <this commit> — Token Crucible retroactive brief
  + hermetic test coverage. Three deliverables in one tick:
  (1) plan/phases/phase_17_token_crucible.md authored from
  commit 261a238 + the Claude Design URL; (2)
  state/presenters/token-crucible.engine.ts extracted with
  selectTokenCrucibleViewModel; components/TokenCrucible.tsx
  refactored to consume the VM; (3)
  state/e2e/token-crucible.engine.test.ts adds 10 hermetic
  cases (VM shape, skill partition, canAfford matrix,
  deep-freeze invariant). Closes the bearings hard-rule
  violation that Phase 17 backfilled without tests-alongside-
  code. +10 tests; 371/371.
