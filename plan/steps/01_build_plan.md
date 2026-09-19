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

> **AUDIT-DRAIN MODE LIFTED (via /oversight 2026-08-15 — T called it
> off).** The banner set 2026-08-12 paused `ship-a-phase` dispatch
> queue-wide so `/march` would fall through to `/iterate` and drain
> `plan/AUDIT.md`'s Pending queue. It is no longer in force: `/march`
> Step 3a dispatches normally again, and every `[ ]` row below is
> pickable on its ordinary turn.
>
> **Why it was lifted, recorded honestly.** It did not hold. Phases 52c
> and 52d shipped 2026-08-13 and 52e on 2026-08-15, none of them the
> banner's single named exception (Phase 55), while the drain the hold
> was meant to force closed exactly one AUDIT row in three days
> (`c297d92`). T's ruling on being shown that: lift it — a hold nothing
> obeys is worse than no hold, and the queue was already voting with its
> feet. AUDIT rows keep draining through `/iterate` on its normal turns
> in the `/march` rotation, which is where that work belonged all along.
> No category bias was set; `/iterate` works top-down by score.
> (Historical note kept from the original banner: Phase 44i shipped in
> the same window the banner was being written, before it landed on
> `main`, and was left as-is rather than reverted.)

**Already shipped (pre-loop):**
- [x] Phase 0 — nexus methodology adoption (unified loop harness,
      gates, plan/, this build plan) — `chore: adopt nexus methodology`

**Next up (autonomous loop's queue):**

- [x] Phase 79 — Doctrine lexicon: register the 2026-09-02 status-primacy
      retirement in `lexicon.json`'s doctrine mechanism; fix the two live
      un-exempted hits (`statusGlyphs.ts`, `tuning.md`) (promoted via
      `/oversight` 2026-09-15 from `PHASE_CANDIDATES.md` [score 8.0])
      — `feat(tooling): register the status-primacy doctrine retirement — phase 79` (eb779017)
- [x] Phase 80 — Naming pass: one concept, one word across player-facing
      surfaces (money/journal/SEALED/SURGE/"the deck" clusters), against a
      written lexicon (promoted via `/oversight` 2026-09-15 from
      `PHASE_CANDIDATES.md` [score 6.5])
      — `feat: naming pass — one concept, one word — phase 80` (69c68db6)
- [x] Phase 81 — Late-campaign difficulty cliff: verify against current
      baseline whether THE PATH already closed the 4%/0%-cells gap; if
      still open, pick among the three named design options (card
      level-scaling term / flatten enemy VITAE growth / vigil `reprisal`
      wall answer) — may need a follow-up `/oversight` touch (promoted via
      `/oversight` 2026-09-15 from `PHASE_CANDIDATES.md` [score 6.5]) —
      gap was already closed by THE PATH; no lever needed
      — `docs: close the late-stage global collapse HIGH — phase 81` (ff9d405e)
- [x] Phase 82 — Glossary reachability: mount tooltip targets on the
      hazard deck's 14 keyword chips (promoted via `/oversight` 2026-09-15
      from `PHASE_CANDIDATES.md` [score 6.0])
      — `feat(mobile): glossary reachability — hazard-deck keyword chips — phase 82` (ee8bf2e5)
- [x] Phase 83 — Combat arena backdrop: region-keyed backdrop set via the
      Phase 73/78 art pipeline, starting with the coastal village
      (promoted via `/oversight` 2026-09-15 from `PHASE_CANDIDATES.md`
      [score 6.0], absorbing the [score 4.5] capital cross-reference row)
      — `feat(mobile): combat arena backdrop — region-keyed, coastal village — phase 83` (cb3b1c97)
- [blocked: requires attended `/world-spec` or `/story-spec` session with
  T present — do not guess 2026-09-15] Phase 84 — The Capital: attended
      `/world-spec` or `/story-spec` session deciding what the
      advisor-selection payoff sets up for the player character before
      more northern-continent geography ships (promoted via `/oversight`
      2026-09-15 from `PHASE_CANDIDATES.md` [score 5.5])
- [x] Phase 85 — Equipment progression: mechanics-expert design session
      for 1-3 new signature skills sized for head/hands/feet accessories,
      then author + wire the relics carrying them, preserving
      `relic.library.ts`'s 1:1 relic-identity rule (promoted via
      `/oversight` 2026-09-15 from `PHASE_CANDIDATES.md` [score 5.5];
      closes `AUDIT.md`'s equipment-progression loop-call)
      — `feat(mechanics): equipment progression — 3 new signature skills for head/hands/feet — phase 85` (9f313d0c)
- [x] Phase 86 — Engine hook sweep: delete the 19 orphaned `zoneHas` sites
      in `combat.engine.ts` (rewriting `oracle-omen-v2`'s telegraph
      harness off `fated-course` first), wire the-sextons-count's TWIN
      clause correctly scoped (promoted via `/oversight` 2026-09-15 from
      `PHASE_CANDIDATES.md` [score 4.5]; closes `AUDIT.md`'s two matching
      loop-calls)
      — `feat(mechanics): engine hook sweep — delete 19 dead zoneHas sites, wire TWIN — phase 86` (7cd4119c)
- [x] Phase 87 — Early-game encounter smoothing: gate the fresh-save first
      encounter to a one-phase zero-keyword foe; open an ordinary
      encounter/rest node before or beside the Ash Mire boss edge
      (promoted via `/oversight` 2026-09-15 from `PHASE_CANDIDATES.md`
      [score 4.0]). Audit found both premises already fixed by the Phase
      53c/60/61 gauntlet rebuild (independently RESOLVED-STALE 2026-09-10
      in CRITIQUE/AUDIT); shipped as regression-guard tests + one doc-drift
      fix instead of a redesign.
      — `test(mechanics): early-game encounter smoothing — audit + regression guards — phase 87` (2227fe9c)
- [x] Phase 88 — W5 art adoption: wire the top licensed candidate per
      enemy from Phase 78's research, replacing the silhouette
      placeholders for all 9 W5 enemies (direct `/oversight` instruction,
      2026-09-15; closes `AUDIT.md`'s W5 art-pass loop-call). 8 of 9 used
      the literal top pick; wharf-shrike fell back to the second-listed
      candidate after the top pick was verified mismatched (see brief).
      — `feat(mobile): W5 art adoption — wire the oversight-picked candidates — phase 88` (ebb457f4)

- [x] Phase 89 — Art-direction coherence: restyle the dice faces + HUD
      chrome to the painted portrait register, now that the art-pipeline
      blocker has cleared (promoted via `/oversight` 2026-09-17 from
      `PHASE_CANDIDATES.md` [score 5.0]). Shipped as a woodcut-codex
      ink/hairline-rule restyle (not literal painted bitmaps — see brief);
      CombatDie shell-face cross-hatch + hairline, HUD chrome reserves
      FONTS.mono for bare numeric readouts, everything else to FONTS.sans.
      — `feat(mobile): art-direction coherence — die faces + HUD chrome —
      phase 89` (6137ca5b)
- [-] Phase 90 — Summoner / multi-hit enemy archetype: no roster enemy
      spawns adds or answers a stacked wall with multi-hit; author the
      archetype and stage it (promoted via `/oversight` 2026-09-17 from
      `PHASE_CANDIDATES.md` [score 4.5]; corroborated by `/adjust-enemies`
      pass 11's filed roster gap, commit b718b421). SHIPPED the multi-hit
      half 2026-09-17 (commit `39e2915e`): new `FLURRY N` EnemyKeyword,
      resolved in `resolveThreatPhase` (mirrors SWIFT/BRUTAL), retrofit on
      `enemy-guild-knife`. CARRY-OVER: the summoner/add-spawning half —
      combat is hard-coded to one enemy throughout `resolveThreatPhase`, so
      a literal summoner needs real multi-enemy combat state; verified and
      deferred (see `plan/phases/phase_90_flurry_multi-hit_archetype.md`
      Follow-ups) rather than attempted partially. Re-file as its own
      `PHASE_CANDIDATES.md` row scoped to the engine-architecture question.
- [x] Phase 91 — Amber-CI tick recovery: a loop turn that ends while CI is
      amber skips every `deploy:check`-gated step with no retry. Either
      resume on deploy-gate completion, or make the post-green steps
      unconditional and idempotent so a later tick re-runs them safely
      (promoted via `/oversight` 2026-09-17 from `PHASE_CANDIDATES.md`,
      unscored row filed 2026-08-08 by Phase 48). Audit found the close
      itself already fixed (Phase 48's close-trailers); the remaining gap
      was the deploy-URL comment. Shipped `loop-issue.mjs deploy-comment` +
      `.github/workflows/deploy-comment.yml`, triggered by the gated
      verify-* workflows' own completion rather than any agent tick's
      lifetime — `feat(loop): amber-CI tick recovery — deploy-URL comment
      floor — phase 91` (3f50d663)
- [x] Phase 92 — `march` workflow job ceiling: run 31301228665 hit
      `march.yml`'s `timeout_minutes: 90` exactly and was force-cancelled;
      the prior tick ran 1:26:24. Decide between raising the ceiling and
      splitting multi-phase ticks (promoted via `/oversight` 2026-09-17
      from `PHASE_CANDIDATES.md`, unscored row filed 2026-08-09 by
      `/digest`; pairs with `AUDIT.md`'s matching 90-minute row). Bearings
      already forecloses raising (2026-08-14, PR #205); the gap was that
      "return cleanly" prose alone didn't stop the 44a+44b chain, so
      shipped a new `ship-a-phase.md` §7 Hard Rule 12 (one phase per
      invocation, never chain) instead. Re-measured: last 100 march runs,
      0 cancellations, 53.3 min slowest against the 75-min ceiling — no
      raise needed. `timeout_minutes` unchanged at 75
      — `feat(loop): march job-ceiling decision — one phase per
      invocation, never chain — phase 92` (d7cc91d7)
- [x] Phase 93 — Card-base reconciliation: `buildCombatDeck` de-dupes, so
      the Threadbare recipe's 3x copies collapse (8 cards dealt against a
      machine-checked 18), and `GameState.flags` never reaches
      `initializeCombatEncounter`, leaving the loadout path dead in the
      shipped runtime. One decision, two implementations (promoted via
      `/oversight` 2026-09-17 from `PHASE_CANDIDATES.md`, unscored row
      filed 2026-08-08 by Phase 52a). Audit found the de-dup half already
      fixed 2026-09-05 (`3fb4963b`), predating promotion. Shipped the
      remaining half: `initializeCombatEncounter` gains an optional `flags`
      param forwarded to `buildCombatDeck`, and mobile's
      `CombatEncounterPanel` reads the store's flags into it — closes the
      reachability gap without inventing a loadout-curation UI nothing
      promoted
      — `feat(combat): wire GameState.flags through initializeCombatEncounter
      — phase 93` (e0107985)
- [x] Phase 94 — `critique:drive` artifact scope: `critique-drive.mjs`'s
      `rm(ARTIFACT_ROOT)` clears the whole `.critique-artifacts/` root on
      start. Scope the delete to the driver's own subdirectory. Ruling made
      via `/oversight` 2026-09-15 and routed to `/iterate`; unshipped after
      12 commits, so promoted to a phase row via `/oversight` 2026-09-17.
      Shipped `ownArtifactPaths()` (mobile/, desktop/, manifest.json only),
      guarded `main()`'s auto-invocation for testability, and added
      `critique-drive:test` to the mobile verify gate
      — `fix(critique): scope critique:drive artifact wipe to its own
      subpaths` (a438d344)
- [x] Phase 95 — UI fresh-eyes six: ship the six product decisions accepted
      via `/oversight` 2026-09-15 (fanned-hand ledger, signet-rail naming,
      `/rest` greyed option, hazard-deck pastel tone, `LEAGUES` usage,
      art-plate captions) per
      `axiomancer-mobile/docs/reports/UI_FRESH_EYES_2026-09-12.md` §4.
      Routed to `/iterate` on 2026-09-15 and unshipped, so promoted to a
      phase row via `/oversight` 2026-09-17. Does NOT cover the 309-row
      unverified candidate set, which stays open. Audit found 5 of 6
      already satisfied (4 "leave as-is" acceptances + art captions
      already fixed by `745b56ff`/FE-047); shipped the one real gap —
      the combat primer now teaches the signature rune rail
      — `feat(mobile): teach the signature rune rail in the combat primer — phase 95` (2aa77567)
- [x] Phase 96 — Consumable desperation band: a healing potion pays 1.5x when
      drunk below half VITAE, stated in the shop line and the drink preview
      (promoted from `PHASE_CANDIDATES.md` [score 3.5], filed 2026-09-19 by
      `/adjust-equipment` pass 13; KB-grounded on
      `kb:dawncaster/0796-healing-potion`). The anti-hoarding lever: a flat heal
      is worth the same at full health as at death's door, so the dominant play
      was to hoard the flask forever.
      — `feat(items): consumable desperation band — phase 96` (417b931)
- [x] Phase 97 — Hand-fan name legibility: the mobile combat hand covered its
      own card names ("THIN HYM / CHILBLAI / THE LONG / SPOILED "). From
      `plan/CRITIQUE.md` [MED] pass 37, reconfirmed by passes 38-41. Occlusion,
      not truncation — fixed by sizing the name BOX to the visible sliver, since
      the geometry lever is capped at ~1 extra character at 375px. Issue #343.
      — `fix(mobile): the hand fan stops covering its own card names — phase 97` (cecae8f)
- [x] Phase 98 — Worklet guard in CI: `check-worklets.mjs` is the static guard
      for the Reanimated-worklet crash class behind `plan/CRITIQUE.md`'s [HIGH]
      post-combat-ACCEPT row, and it had NO CI trigger of any kind — the one
      guard between that crash and `main` was local-only. Wire it (and its own
      unit suite) into `verify-mobile.yml`, and re-run on edits to the guard.
      — `ci(mobile): enforce the Reanimated worklet guard — phase 98` (51fede4)
- [x] Phase 99 — A returning player can actually return. From the UNFILED
      `axiomancer-mobile/docs/reports/PLAYTEST_BUGS_2026-09-18.md` (committed
      1d48483, referenced nowhere in `plan/`): BUG-02 (critical) every player
      with a save got a permanently blank screen on launch — `<Redirect>` fired
      before the NavigationContainer attached and `dispatchTo` dropped it
      silently with no retry; BUG-03 (high) node movement was not a save
      checkpoint and there was no save-on-exit anywhere, so a walk and the
      opening quest were lost on reload.
      — `fix(mobile): a returning player can actually return — phase 99` (fd83aa0)
- [x] Phase 100 — The map tells the truth. The other two bugs from the unfiled
      `PLAYTEST_BUGS_2026-09-18.md`: BUG-04 (medium) the exploration camera
      fitted once at mount and never re-framed, so after a move two of three
      onward paths sat off opposite edges (19 of 25 nodes off-screen at 414px);
      BUG-01 (low) the legend counted `lockedNodes` while the pips were drawn
      from `classifyNode`, so "25 nodes · 20 sealed" labelled 21 sealed pips.
      — `fix(mobile): the map tells the truth — phase 100` (42d2ba2)

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

- [x] Phase 18 — 5-slot equipment model (weapon / armor / accessory ×3).
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
      — `refactor(mechanics): 5-slot equipment model — phase 18` (5e4ca6e0)
- [x] Phase 19 — Equipment-granted signatures + the 8 signet relics
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
      — `feat(mechanics): equipment-granted signatures + 8 signet relics — phase 19` (fbf3d52c)
- [x] Phase 20 — Decouple equipment from effects (static stat bumps
      only). Strip `passiveEffects` / `onHitEffects` / `onDefendEffects`
      / `resourceInteraction` / `critStyle` application out of the equip
      pipeline and its combat consumers so ALL equipment contributes
      only `statModifiers` (+ `grantsSignature`). User-intent phase 2
      (mechanics; verify mobile) — brief:
      `plan/phases/phase_20_equipment_effect_decouple.md`
      — `refactor(mechanics): decouple equipment from effects — phase 20` (8907c08f)
- [x] Phase 21 — Retire the procedural equipment library. Delete the 56
      templates + 7 uniques + the `dropItem`/roll/resolve/affix factory;
      the 8 relics become the whole library. Convert loot surfaces (The
      Reliquary, enemy drops, shops) to consumables/materials/currency;
      purge procedural gear from old saves (v13→14). User-intent phase 3
      remainder (both; large) — brief:
      `plan/phases/phase_21_retire_procedural_library.md`
      — `refactor(mechanics): retire procedural equipment library — phase 21` (51c2cb51)
- [x] Phase 23 — Teardown of dead equipment machinery. Delete the
      modifier catalogue, the affix (prefix/suffix) library, item sets,
      the rarity model, the dead effect-channel types, the archetype
      signature vestiges, the phase-18 deprecated worn-convention
      wrappers, and the equipment-only effect definitions; prune the
      `@mechanics` barrel and reconcile docs/specs 05–05e as superseded.
      User-intent phase 4 + full teardown (mechanics; verify mobile +
      card-editor) — brief:
      `plan/phases/phase_23_equipment_machinery_teardown.md`
      — `refactor(mechanics): teardown dead equipment machinery — phase 23` (e4d02d21).
      **Equipment-signature epic (18-21 + 23) COMPLETE.** (Effect-deletion
      dropped from scope: all 14 candidates gained live non-equipment consumers;
      buffs library unchanged.)

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
- [skipped] Phase 17 — Quest Board ("The Boy's Almanac") first-session
      tutorial (GAP-001 follow-up), mirroring the Rest/Gathering/Combat
      tutorials (mobile) (skipped via /oversight 2026-07-10 — already
      shipped-then-reverted once as premature (`375b141f`); a pending
      CRITIQUE.md finding proposes redesigning the entire early game as
      canned per-battle preset-deck tutorials, which would subsume or
      reshape this scope. Drop rather than reship narrow; let the
      early-game rethink go through `/iterate`/a design pass first, and
      re-derive a quest-board tutorial phase from whatever that lands on.)

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

**Docs/harness integrity (T-directed 2026-07-10):**

- [x] Phase 24 — axio-query: MCP surface over the live engine data.
      Server + hermetic smoke test + exporter pricing field + AGENTS.md
      doc shipped and verified —
      `feat: axio-query MCP server over the live engine data — phase 24`
      (7a33efbc). Human-granted wiring applied via /oversight 2026-07-10:
      `.mcp.json` axio-query stdio entry, `.claude/settings.json`
      allowlist rows (`mcp__axio-query__axio_overview/_cards/_effects/
      _keywords`), and the same four tool names appended to card-expert /
      mechanics-expert frontmatter — brief:
      `plan/phases/phase_24_axio_query.md`
- [x] Phase 25 — /consolidate memory curator + 2026-07-09 harness
      re-apply. Part A: re-apply the harness work lost to the local
      working-tree reset (consolidate verb + monthly workflow, runner
      model/effort inputs + Opus-medium iterate, cross-package CI job,
      deploy-check fail-closed, card-editor guards, small fixes).
      Part B: consolidate gains the terminology-sweep janitor mandate
      over `docs/lexicon.json` (harness; multi-file) — brief:
      `plan/phases/phase_25_consolidate_janitor.md`
      — `feat(harness): consolidate janitor mandate + stale impact-path fix — phase 25` (f7868e2a)

**Engagement-overhaul roadmap (promoted via `/oversight` 2026-07-10 —
owner-ratified 2026-07-10, all four decision gates cleared; ship in
order, intra-batch gates noted per phase):**

- [x] Phase 26 — The Turn Law (engine + tooling). One dice-turn per
      threat phase becomes an engine invariant (`startTurn` refuses a
      second tray; `resolveThreatPhase` resets); sim policies + auto
      CLI rewritten to play legally; tooling fixes (auto-mode
      transcripts, overkill-clamped attribution, `--stage` fields the
      stage's enemy roster). Test-pinned; blocks every numeric tuning
      decision repo-wide (mechanics) — `feat(mechanics): enforce the
      one-turn-per-phase law — phase 26` (f849c5a2) — source:
      `plan/tuning/2026-07-10-turn-law-and-honest-baseline.md` §1-2.
      Shipped TWICE independently (cloud f849c5a2 + local 6ea123fc);
      reconciled at the branch merge — the local implementation's
      semantics won (richer event payload, legal-play sim rewrite,
      seed-deterministic --stage roster), cloud-only pins folded in.
      DONE at the reconciled tree e203fed9; the law's honest numbers
      are cut in `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`.
- [x] Phase 27 — Re-baseline (measurement). Full matrix re-run under
      the Turn Law; re-derive curve bands vs. the locked
      80/50/25-35/0 doctrine, KNOWN_CURVE_VIOLATORS, statusEngagement
      by stage, signature damage share, dead-card rate; publish the
      re-triage report. Every pre-2026-07-10 plan/tuning number gets
      an asterisk until this lands. Gated on Phase 26 (mechanics) —
      source: `plan/tuning/2026-07-10-turn-law-and-honest-baseline.md` §3
      — headline: mid/late win rates were almost entirely farm-propped
      (honest mid 3%, late flat 0%); KNOWN_CURVE_VIOLATORS confirmed
      empty; repricing (Phase 31) now unblocked —
      `plan: re-baseline the combat matrix under the Turn Law — phase 27`
      (30e43eb2). Also shipped TWICE (cloud report 30e43eb2 + the local
      session's seeds-1/2/3 cut in
      `axiomancer-mechanics/docs/reports/rebaseline-scratch/`); both kept
      with cross-notes — the local cut stamps the checked-in
      deck-matrix baseline. DONE: re-cut at the reconciled tree
      e203fed9 (seeds 1-3, Overtake gate live) —
      `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` is the
      canonical Phase 27 deliverable and lifts the asterisk rule.
- [x] Phase 28 — Show the Engine (legibility sweep). Premise track +
      CONCEDE beat, rupture fuel/cap preview, BACKFIRE attribution,
      foretell picker, REPRISE songbook choice, wall-math readout,
      Overtake gate/preview, lying-copy fixes, color-match bonus
      fold-ins. Parallel-safe with Phase 26/27 (mobile + mechanics) —
      source: `plan/tuning/2026-07-10-turn-texture.md` §4 +
      `plan/tuning/2026-07-10-theme-identity.md` (per-theme S-tier UX)
      — `feat: show the engine — legibility sweep across 9 surfaces — phase 28` (60af3044)
- [x] Phase 29 — The Language (keyword registry). KW-1/KW-3 (fold 6
      unmapped debuff ids, rename pass) ungated; KW-2/KW-6
      (merge/retire + single-source registry with parity lints) and
      KW-5/KW-7 (persistent-card keyword-reach lint, systems glossary)
      follow; KW-4 (TICK killed entirely — owner-ratified 2026-07-10)
      rides Phase 30 (mechanics + mobile) — source:
      `plan/tuning/2026-07-10-keyword-registry.md` — brief:
      `plan/phases/phase_29_keyword_registry.md`
      — shipped in full: KW-1/KW-3 (cloud `feat: keyword-language
      honesty pass — phase 29` cc39fb5f + the WS10.1/KW-1 debuff fold in
      3cecd275, reconciled at e203fed9); KW-2/KW-5/KW-6/KW-7/KW-8 and the
      spec-32 §3 correction landed in the same reconciled tree (verified
      2026-07-13: `keywords.test.ts`'s 8 KW-1/2/3/5/6 assertions green,
      `keyword-atlas.md` carries the 31-row re-baseline + 9 KW-8 receipts,
      spec 32 §3 already amended) — KW-4 shipped riding Phase 30. Remaining
      un-receipted atlas rows are an explicitly-deferred KB follow-up, not
      phase-29 scope (`keyword-atlas.md` "no receipt, no entry" rule)
- [x] Phase 30 — FREE Lines (70-card content pass). Rewrite every
      FREE line to theme-currency verbs + FREE-currency lint +
      pricing re-arithmetic. Shape ratified 2026-07-10: Option A
      (constrain the fork) + weak-deposit `DRAW 1` kicker amendment;
      TICK dies in the same pass (mechanics; content-sized;
      `/deck-tuning` owns) — source:
      `plan/tuning/2026-07-10-turn-texture.md` §1 — brief:
      `plan/phases/phase_30_free_lines.md`
      — `feat: FREE-currency law — 70-card content pass — phase 30` (5e723df3)
- [x] Phase 31 — The Roll and the Read. Momentum wheel engine-native
      (kills the host-side write; sims learn it), THE STAKE (pre-draft
      Conviction wager on the hidden stance, paid in floats), signature
      economy repriced against Phase 27 income. Momentum scope/naming
      ratified 2026-07-10 (wheel global, keeps the name; hazard carry
      + grace buff rename); repricing gated on Phase 27 (mechanics) —
      source: `plan/tuning/2026-07-10-momentum-scoping.md` +
      `plan/tuning/2026-07-10-out-of-flow-mechanics.md` §1 +
      turn-law doc §4 — brief: `plan/phases/phase_31_the_roll_and_the_read.md`
      — `feat(mechanics,mobile): momentum wheel engine-native — phase 31 part 1` (380e3849),
      `feat(mechanics,mobile): THE STAKE — phase 31 part 2` (48c89f34),
      `feat(mechanics): reprice sig-conviction-strike — phase 31 part 3` (040202fd)
- [x] Phase 32 — Theme Deep Work (sandbox-first, `/deck-tuning` owns).
      One sub-phase per rework: harvest (REAP attacks max HP +
      travelling Souls), bulwark (RIPOSTE reflects the prevented
      blow), akrasia (DEBT ledger), then remaining per-theme M items.
      Register -> A/B -> promote; re-run the ten-theme matrix after.
      DoT-clock direction ratified 2026-07-10 (distinct triggers) and
      shipped through WS3; combat-truth follow-up clamps every receipt and
      summary to actual VITAE loss. SWAY threshold crossing now opens an
      explicit player-authored capitulation choice rather than ending combat;
      partially gated on Phase 30's FREE verbs (mechanics;
      parallelizable per theme). Part 1 (REAP attacks maximum HP) shipped
      `7392573c`; Part 2 (RIPOSTE reflects the prevented blow, floored at
      the printed value) shipped `a6888a84`; Part 3 (akrasia DEBT ledger,
      tiered GUARD payoff while FALLEN) shipped `37fbd895`; Part 4a (control
      TURNABOUT, cashes the rungsDeniedTotal ledger) shipped `ab6aae15`;
      Part 4b (oratory milestone drip, every 3rd Premise pays a STAGGER
      rung) shipped `f4dd16bb`; Part 4c (forge OVERHEAT, half-step's
      grant_pip can push past the cap at a bust risk) shipped `543c090d`;
      Part 4d (oracle OMEN v2, the player stakes a stance/window claim
      instead of a silent die-derived guess) shipped `8a78cb24`; Part 4e
      (charm resolve milestones, Wavering/Faltering SWAY waypoints pay
      RAPPORT/bonus SWAY) shipped `974e15e3`; Part 4f (echo — ouroboros
      now targets the last spell that landed a status, gated on the
      existing `landedOnEnemy` signal instead of unconditionally overwriting
      the replay target) shipped `09d92fe7`; Part 1b (harvest — Souls
      persist across combats via `Character.bankedSouls`, write-back on
      every combat outcome + a Memoir REMAINS read-back; no migration
      needed, mirrors the `floatingDice` precedent) shipped `801e2d26`;
      Part 1c (harvest — milestone epithet layered onto `soulsLine` at
      10/25/50 banked Souls, resolving "what a running Soul total unlocks"
      as a cosmetic/narrative tier rather than a shop good or card-rider
      threshold) shipped (this tick). Every part of this brief has now
      shipped — source: `plan/tuning/2026-07-10-theme-identity.md` §2
Phase 33 — Enemy Answers (specs 29/30 slice + enemy counterplay).
SPLIT into shippable slices via oversight 2026-07-16 — the single
mega-brief bundled ~6 verbs and carried the Phase 32 stall risk on
oversized ticks. Each slice below must finish and commit on its own
tick. Shared sources: `plan/tuning/2026-07-10-turn-texture.md` §3 +
`plan/tuning/2026-07-10-theme-identity.md` §1 +
`plan/tuning/2026-07-10-out-of-flow-mechanics.md` §2. All gated on
Phase 26 (numbers) but design-independent of the owner session
(mechanics).

- [x] Phase 33a — Reactive-verb core (shipped `69b2ccf1`, re-scoped).
      The row's literal deliverables ("one reactive verb engine-wide"
      + "enemy-side lethality readout") were already shipped by WS9
      threat-branch (spec 32 §12 item 7) and Phase 2/28's
      `projectCombatOutcome`/wall-math — confirmed via code read
      (pressureTracks/dotThreshold, specs 29/30's premise, are gone
      from the codebase entirely). Re-scoped to the real gap Phase
      33b needs: `CombatThreatEffect.swayCleanse` /
      `.premiseShed` — enemy counterplay hooks against the
      SWAY→CAPITULATE and Premise→CONCEDE alt-win tracks (CAUTERIZE
      already works via the existing `enemyCleanse`). Hook-only, no
      bestiary authoring. Full re-scope rationale + guardrails:
      `plan/phases/phase_33a_reactive_verb_core.md`.
- [x] Phase 33b — Enemy archetypes + variable-rung telegraphs:
      CAUTERIZE / Premise-shed / SWAY-cleanse enemies with the
      variable-rung telegraph presentation. Deps: 33a.
      (row previously duplicated byte-identical — corrected to one row in
      the same commit) — `feat(mechanics): enemy archetypes +
      variable-rung telegraphs — phase 33b` (8ceb86e5)
> **Owner priority 2026-07-18:** all remaining D-sequence phases ship
> before 33c/33d. Their pending rows are ordered after D7 below so `/march`
> cannot dispatch them early.

**Critique infra (promoted via `/oversight` 2026-07-10):**

- [x] Phase 34 — Non-MCP transport for unattended `/critique` (shipped
      2026-07-16, oversight-directed). RENAMED from "Non-Playwright
      transport": the problem was never Playwright the engine — it was
      the Playwright *MCP* grants failing to propagate into Agent-tool
      sub-agent contexts on unattended runs (8 of 11 passes filed zero
      findings; see `plan/CRITIQUE.md` Done, "Playwright MCP tools
      unavailable to sub-agents"). The fix drops the *MCP + sub-agent*
      hop, not Playwright: `axiomancer-mobile/scripts/critique-drive.mjs`
      is a plain Node subprocess (`npm run critique:drive`) that imports
      the Playwright *library*, exports + serves the web build
      hermetically (same scaffolding as `combat-encounter-e2e.mjs`), and
      DRIVES + CAPTURES the §3 screen set — screenshot + DOM innerText +
      console/page errors per screen → `.critique-artifacts/<viewport>/`
      + `manifest.json`. It does not judge: `/critique`'s main agent
      (has vision, no grant problem) reads the artifacts and files the
      fresh-eyes findings itself. Screen set is restricted to
      COLD-ENTERABLE routes (title/onboarding, combat self-bootstrap,
      exploration hub); state-gated routes pushed by `<EventGate>`
      (`/village`, `/cutscene`, `/dialogue`, `/event`) are excluded —
      direct-nav just captures their `router.back()` bounce, which is a
      transport artifact, not a finding (reaching them faithfully is
      playtester/interactive territory). Verified end-to-end: the
      exploration-hub capture independently re-surfaced the open
      `[HIGH]` "MORALE meter renders literal 'v of x' placeholder"
      finding, confirming the capture is real and useful. Interactive
      `/critique` (playtester + Playwright MCP) is unaffected — this is
      the unattended-loop path only (harness; `skills/critique.md` §3.5
      updated + new script + `critique:drive` npm scripts)

**Loop infra (promoted via issue-triage 2026-07-14):**

- [x] Phase 35 — Reliable phase-issue auto-close. Phase-tracking
      issues rely on a `Closes #N` trailer in the phase commit, but
      those commits are authored on cross-session `claude/*` branches
      that reach `main` via merge reconciliation — GitHub only honors
      commit-message closing keywords for commits pushed *directly* to
      the default branch, so the trailer is inert on this route. Nine
      shipped phases (issues #22/#25/#36/#47/#52/#54/#65/#69/#74)
      leaked open before the 2026-07-14 triage closed them by hand;
      #74's trailer was even on `main`'s first-parent history yet still
      never fired, while #73 from the same merge commit closed via its
      PR path — proof the commit-message route is unreliable here. The
      exact gap: `skills/ship-a-phase.md` Step 12.5 runs
      `scripts/loop-issue.mjs phase-close`, which only posts a deploy
      comment and *assumes* Step 10's `Closes #N` trailer already
      closed the issue on push — true only when the loop pushes straight
      to `main`, not for cross-session branch reconciliations. Fix:
      make `phase-close` idempotently close the issue via the GitHub API
      (state=closed, state_reason=completed) rather than trusting the
      trailer; keep the trailer as a belt-and-suspenders. Harness/skill
      + script only; no engine change — source: issue-triage 2026-07-14
      findings.
      SHIPPED 2026-07-17 — `phase-close` now calls `gh issue close --reason
      completed` (state=closed/state_reason=completed) after the deploy
      comment, idempotent (skips when already CLOSED; swallows the gh
      "already closed" case); trailer kept as backup; ship-a-phase.md §12.5
      doc updated. Verified live on a throwaway issue (closed COMPLETED,
      2nd run exit 0) —
      `fix(loop): phase-close actively closes the mirror via API — phase 35` (59cf9e6e)

**Pricing model (promoted via chat session 2026-07-17, T direct):**

- [x] Phase 36a — Alt-win-aware card pricing (`scoreCard` v2, part 1).
      `scoreCard` (cards.pricing.ts) scores only spell HP/status/burst
      lines: enchant/disenchant cards price to 0 outright, and the
      non-HP win currencies (SWAY→CAPITULATE, Premise→CONCEDE,
      Befriend→mercy) exist only as minor rider points (swayPerStack
      0.8, premise 0.8) rather than win-condition progress — so whole
      win engines are invisible and cross-deck price ranks alt-win
      decks backwards (Grace 5.46 beats Foundry 7.52 early, both
      winning purely by CAPITULATE at statusEngagement 0.00; Oratory,
      the only preset alive late, is carried by unpriced CONCEDE).
      Scope: price enchant/disenchant persistent passives (coordinate
      with the "min-4-triggers" hand-pricing convention in the card
      comments) and weight win-path currencies as win-condition
      progress; re-band the pricing lint once. Structural — does not
      depend on enemy tuning. Evidence:
      `axiomancer-mechanics/scratch/price-experiment/report/FINDINGS.md`.
      Deps: none. **Re-scoped in-flight** (mechanics-expert design pass
      + brief `plan/phases/phase_36a_alt_win_pricing.md`): the mandate
      over-claimed — SWAY is NOT priced at ~0 (it's 0.8;
      `heart-of-the-matter` scores 13.44). Shipped the enemy-INDEPENDENT
      half: `swayPerStack` 0.8→0.9 (CAPITULATE parity 0.95 − decay
      haircut) + a flat +3 CONCEDE capstone on the declaring peroration
      card (was priced 0). Premise currency (build currency, enemy-
      dependent win-value) left at 0.8; enchant/disenchant pricing needs
      a schema change (prose `persistentEffect` field) → deferred to
      **36c** (filed in PHASE_CANDIDATES). No re-band needed — the fix
      was rank-honest within existing bands —
      `feat(mechanics): alt-win-aware card pricing — phase 36a` (7d26bebd)
- [x] Phase 36b — Tempo-aware card pricing (`scoreCard` v2, part 2).
      `scoreCard` prices magnitude-per-die but is blind to WHEN the
      power arrives: a RUPTURE burst and a ~6-round ramping POISON can
      price identically while short lethal fights pay the slow one a
      fraction of its printed value. The erosion price ladder shows
      late win-rate crawling 0.04→0.12 across 4x price because the
      death clock (avgRoundsAll ~4.1, set by enemy output) never
      moves; the sandbox fix-cards that price the tempo axis instead
      (front-load / tick-forcing / survival sliver) converted +12 pts
      mid and >2x late for +0.5 avg-spell. Scope: add a
      time-to-payoff term (credit front-loaded/faster-maturing
      payoff; discount long-ramp DoTs by expected fight length per
      stage). Proof gate: the scratch ladder + preset sweep + fix-test
      re-run ON TOP OF 33b's enemies (the 2026-07-17 data predates
      phase 33b — sibling branches) at seeds ≥ 5, with the ladder's
      down-scaler clamp fixed first (x0.5/x0.75 tiers were near
      no-ops: avgSpell 7.45/8.09 vs 8.09 at x1); then `/deck-tuning`.
      Deps: 36a (shared `scoreCard` surface; land the lint re-band
      once). **Shipped** (brief `plan/phases/phase_36b_tempo_pricing.md`
      + mechanics-expert design pass): `statusPoints` prices DoTs at
      tempo-weighted lifetime — each tick in round r worth
      `DOT_TEMPO_SURVIVAL^(r-1)` (0.75, a GLOBAL ~4-round death-clock
      horizon; "per stage" reinterpreted as one global constant to
      preserve `scoreCard` stage-independence per the 36a discipline).
      `dotLifetimeHp` kept pure (engine-parity mirror); tempo weight in
      `dotTempoWeightedHp`. Down-scaler clamp fixed; proof gate re-run at
      seeds=5 on post-33b main confirms the hypothesis (erosion late 3%
      flat across 5x price; fix-cards convert +11 mid / >2x late) —
      `scratch/price-experiment/report/FINDINGS-36b-seed5.md`. A
      model-FIDELITY change (does not climb the late wall; downstream
      pressure for `/deck-tuning`). No re-band — all 50 spells stayed in
      band —
      `feat(mechanics): tempo-aware card pricing — phase 36b` (1927b15e)

**Combat rework (promoted via chat session 2026-07-17, T direct — spec 33
`33-upgradeable-dice.md`):** the four-die Upgradeable-Dice rework. Promote as
a SEQUENCE with per-phase gates. D1 is a thinking/review gate (no code, safe
to run live); **D2+ touch the engine — pause the `/march` + night crons
before starting them** (collision discipline). D1 also owns reconciling the
supersession collisions before any engine work.

- [x] Phase D1 — Upgradeable-Dice spec review-and-land. Mechanics-expert
      review of `axiomancer-mechanics/specs/33-upgradeable-dice.md` against
      doctrine (status-centrality, the 80/50/25-35/0 win curve,
      dice-honesty) before ANY engine work. Settle spec §9 open items
      (reset-and-restart momentum reading, color↔stance mapping,
      HONE/TEMPER final keyword names, ◆-sink repricing ownership) AND
      decide keep/retire/re-scope for each supersession collision: spec 33
      §1 supersedes the 2026-07-09 dice-law + the shipped Phase 31
      (roll/read/wheel), and overlaps pending Phase 33c (THE COVETED DIE)
      + 33d + the Fate Engine P2/P3 candidates. Thinking phase; NO code.
      Brief: `plan/phases/phase_D1_upgradeable_dice_spec_review.md`.
      Prove: clean mechanics-expert verdict + every §9 item and every
      collision resolved in-brief (owner-call items surfaced, not guessed).
      SHIPPED 2026-07-17 — PASS-WITH-EDITS applied; owner calls: die gear
      (4 dedicated slots + blacksmith), STAKE retired, momentum
      null-reset, surge until-spent —
      `spec 33: land D1 review` (4adf7266)
- [x] Phase D2 — Engine core, flagged. The whole spec-33 model behind a
      flag: 4 fixed dice with a die-gear interface (default gear
      hardcoded), stance-from-cards + open stance checks, momentum with
      **null-reset breaks** (D1 owner call — do NOT port the shipped
      `advanceWheel` restart), surge die until-spent, honest Press Fate
      (the shipped `rerollSpentDice` stance guarantee is a rig — delete),
      ceiling + overflow→+1◆, subsystem ports per spec §6, and **STAKE
      plumbing REMOVED** (owner call). `CombatManaDie` shape change is
      public-barrel-breaking — migrate mobile + card-editor the same
      phase and re-verify `npm run verify -w axiomancer-mobile`.
      Brief: `plan/phases/phase_D2_engine_core_flagged.md`.
      Prove: hermetic vitest (`mockSequentialRng`); flag-off suite
      untouched-green. Deps: D1.
      SHIPPED 2026-07-17 — 24 hermetic e2e tests; mechanics + mobile
      verify green; variety-chain auto-refresh also retired in-flag
      (decision) —
      `feat(mechanics): Upgradeable-Dice engine core behind flag` (18cf5e3b)
- [x] Phase D3 — Sim harness + economy derivation. Autoplay policies
      learn the new action space; Monte-Carlo witness for the spec §7
      **D3 gates** (E[usable]≈1.83, whiff≈8.3%, per-color ≥65%, ◆ income
      1.2–1.6, surge rate, STAKE-retirement gap); DERIVE signature/ante
      constants + `sig-read-opponent` cost for D7 ratification.
      Brief: `plan/phases/phase_D3_sim_harness.md`.
      Prove: measured values in bands, report + pinned sim tests.
      Deps: D2.
      SHIPPED 2026-07-17 — dice-math gates all PASS (face tables correct:
      1.833 / 8.3% / 66.7% / gross 1.336◆); realized income 1.21◆ (PASS).
      Flag-on driver branch + two-witness economy sim + `combat-dice-economy`
      CLI + pinned flag-on test. Surfaced F2 (yield income dark — no enemy
      authors a stanceCheck yet, needs-user-call) + F3 (Press Fate sink not
      equipped) for D4. Derived signature-cost table (2/3/4◆) PROVISIONAL —
      D7 ratifies —
      `feat(mechanics): Upgradeable-Dice D3 sim harness + economy derivation` (61bbc8ca)
- [x] Phase D4 — Pricing re-derivation + card re-authoring. Re-fit
      `cards.pricing.ts` (incl. the card-played-clock DoT constants —
      WS3.3's ~2 plays/round assumption dies); re-author Forge's 7
      die-cards; author FORGE special-amplifier enchants (D1 owner call)
      + ONE dice-interaction card per other theme; register
      SPECIAL/HONE/TEMPER keyword rows.
      Brief: `plan/phases/phase_D4_pricing_rederivation.md`.
      Prove: effectiveness lint + curated-library tests green. Deps: D3.
      SHIPPED 2026-07-17 — card-played DoT clock 2→1.83 (pricing-local;
      engine forecast held at 2 for D7), poison-only blast radius; 3 Forge
      cards re-worded + pact-of-akrasia re-authored; FORGE special-amplifier
      enchant (forge-masters-stamp) wired + e2e; 9 per-theme dice valves
      sandbox-staged (dice-valves-33); SPECIAL/HONE/TEMPER keywords
      registered. mechanics+mobile verify green. Valve PROMOTION deferred to
      D5 (5/5/5 locked); stance-check synergy priced but DARK (D3-F2) —
      `feat(mechanics): Upgradeable-Dice D4 pricing re-derivation + card re-authoring` (0e3bd2bb)
- [x] Phase D5 — Die gear + blacksmith. The D1 owner-call model: dice are
      immutable; ALL progression on four dedicated color-coded gear
      slots (separate rail from the 5-piece wear model; pieces are
      spec-05 equipment ITEMS — the dice are not). Gear defines special
      payload (default +2◆) + face upgrades (HONE/TEMPER, caps at the
      item); NEW blacksmith encounter sells upgrades; reward hooks;
      `GAME_STATE_VERSION` migration (older saves get default gear).
      Brief: `plan/phases/phase_D5_die_gear_blacksmith.md`.
      Prove: migration + cap-enforcement + payload-timing tests.
      Deps: D2.
      SHIPPED 2026-07-17 — dieGear rail on Character + pure dieGear.reducer
      (single-authority cap enforcement: ≥1 miss floor, colored ≤2 / wild ≤1
      special); blacksmith pure engine (copied from The Reliquary) with
      HONE/TEMPER/SWAP + PLACEHOLDER pricing (2/3/4◆, D7 ratifies), registered
      as a 'blacksmith' MapEvent kind; GAME_STATE_VERSION 14→15 migration
      (backfills concrete default rail). Engine+content only — blacksmith
      SCREEN + rail UI are D6 (mobile touched only to stay green). 37 hermetic
      tests; mechanics+mobile verify green. NEEDS-USER-CALL: blacksmith map
      placement/cadence (no node authored yet) —
      `feat(mechanics): Upgradeable-Dice D5 die gear rail + blacksmith encounter` (a25373be)
> **Phase D6 SPLIT into D6a–D6d (2026-07-17, ship-a-phase §10.8 decisive
> re-scope).** A scope scout confirmed the flag-on mobile combat render is
> GREENFIELD — zero mobile code reads any spec-33 state field
> (`momentumV2`/`dieGear`/dice `.face`/the new events); the D2/D5 engine is
> built and waiting. As one phase D6 is unrealistic: a type-level `CombatDieVM`
> rewrite touching the app's most delicate interaction (the Reanimated
> drag-to-power), a whole self-contained blacksmith screen (gate + slice +
> interception + route + forge UI — sibling encounters were each their own
> phase), a momentum-V2 chip reshape, and net-new e2e flag-hook plumbing (there
> is no Playwright in mobile — the browser e2e are bespoke `scripts/*.mjs` and
> the flag is bundle-time only). Parent brief `plan/phases/phase_D6_mobile_ui.md`
> stays the north star; each sub-phase renders spec-33 rules AS-IS by EXTENDING
> the existing `STANCE_COLORS`/glyph/#5-SIDE-RAIL conventions (never forking),
> flag-gated so flag-off stays byte-identical.
>
> **D6e added via /oversight 2026-07-18** — a fifth D6-band row that is
> NOT mobile: enemy stanceCheck content (yield-lever), draining D3-F2.
> Parallel-safe with D6a–d, hard dep of D7. Listed after D6d below.

- [x] Phase D6a — Flag-on combat render core. The runtime flag hook
      (`globalThis.__AXM_UPGRADEABLE_DICE__` test/dev escape hatch honored by
      `applyCombatFlagsFromEnv` — the e2e enabler the bundle-time flag can't
      give) + dice-tray/face rework (`CombatDieVM` gains a special/mana/miss
      face axis; the gem die renders faces + cracked-die state; drag-to-power
      under the color law with off-color drops refused LOUDLY) + Press Fate
      affordance (1◆ once/round, disabled-at-0◆ with reason) + keyword glosses
      (SPECIAL/HONE/TEMPER rendered in the combat inspect modal — data landed
      D4). Brief: `plan/phases/phase_D6a_flag_on_render_core.md`.
      Prove: presenter units for the face/press-fate VMs + mobile verify.
      Deps: D2 + D5.
      SHIPPED 2026-07-18 — runtime flag hook + CombatDieVM face axis
      (special=marked+◆ / mana=powered / miss=DEAD non-draggable / cracked=
      struck-out) extending the gem's color+glyph language; Press Fate control
      (engine reroll-gate mirror, disabled-reason loud); SPECIAL inspect gloss.
      Flag-off byte-identical (key-for-key tray VM test). Mobile verify green
      (2587 tests, +18). Flag-on VISUAL screenshot deferred to D6d (pre-boot
      global harness); combat sandbox boots clean. NEEDS-USER-CALL: small-screen
      Press-Fate-row crowding (settle at D6b/D6d) —
      `feat(mobile): Upgradeable-Dice D6a — flag-on combat render core` (311e2c3c)
- [x] Phase D6b — Momentum/stance chips + stance-check telegraph + gear rail.
      Momentum-V2 chip reshape ({color, length}, breaks LOUD, surge evented) +
      current-stance chip + open stance-check telegraph (`punishes X`/`yields X`
      in the threat readout with ×1.5/×0.5/+1◆ end-of-phase feedback) + the
      4-slot die-gear rail with a payload-only face-inspection panel
      (Dawncaster-terse). Deps: D6a.
      Brief: `plan/phases/phase_D6b_chips_telegraph_rail.md`.
      SHIPPED 2026-07-18 — momentumV2 chip (LOUD "✕ BROKEN" / gold "✦ SURGE",
      transient recovered by bounded log scan) supersedes the wheel flag-on;
      stance chip; stance-check telegraph in IntentIcon (D6e's punishes/yields
      open + live preview + 3-outcome resolution); 4-slot dieGear rail +
      payload-only inspection panel. Flag-off byte-identical (momentum keys stay
      [charged,lit]). Mobile verify green (2604 tests, +17). NEEDS-USER-CALL:
      small-screen crowding now compounds (D6a+D6b rows) — screenshot at D6d —
      `feat(mobile): Upgradeable-Dice D6b — momentum/stance chips + telegraph + gear rail` (4cf7b752)
- [x] Phase D6c — Blacksmith screen. D5's encounter rendered: a
      `<BlacksmithGate>` + `state/blacksmith` slice + `resolveCurrentMapEventAction`
      interception + `app/blacksmith` route + the forge UI (HONE/TEMPER offers
      with prices, cap-refusals grayed + reasoned loudly, gear swap when
      variants exist). A self-contained encounter build (sibling: CacheGate /
      Reliquary). Deps: D5 + D6a.
      **Placement (owner call via /oversight 2026-07-18):** author exactly
      **1 blacksmith MapEvent node on the FIRST map** (D5's `'blacksmith'`
      kind now has a real node) AND wire the encounter into the **Dev menu**
      (a `dev*` route entry, like the other dev encounter shortcuts) so it is
      reachable for testing before its map cadence is settled. STILL OPEN
      (design thread, do NOT guess — filed to `plan/AUDIT.md`): *when* the
      player first meets the blacksmith, and *whether the blacksmith is even
      where dice upgrades happen* vs. some other surface — D6c ships the
      reachable encounter; the cadence/identity call is deferred.
      Brief: `plan/phases/phase_D6c_blacksmith_screen.md`.
      SHIPPED 2026-07-18 — BlacksmithGate + `state/blacksmith` slice +
      resolveCurrentMapEventAction interception + `app/blacksmith` forge UI
      (HONE/TEMPER at placeholder ◆, cap/afford refusals greyed + reasoned from
      the same validateDieGear authority as the engine's refusal card, swap);
      claim writes dieGear + deducts currency (visit budget = real wallet); ONE
      first-map node (fv-16 "The Anvil", pinned) + Dev-menu shortcut; cadence
      left owner-open. mechanics+mobile verify green (+18 tests) —
      `feat: Upgradeable-Dice D6c — blacksmith encounter screen` (7c315d5f)
- [x] Phase D6d — Flag-on combat e2e. Seeded flag-on browser e2e (bespoke
      `scripts/*.mjs` harness + the D6a flag hook): roll → power a card →
      momentum advances → break resets to null loudly → Press Fate reroll →
      stance check resolves with feedback → blacksmith HONE applied → tray
      reflects the new face table; off-color drop refused loudly. Deps: D6a,
      D6b, D6c.
      Brief: `plan/phases/phase_D6d_flag_on_e2e.md`.
      SHIPPED 2026-07-18 — `scripts/upgradeable-dice-e2e.mjs` (mirrors
      combat-encounter-e2e.mjs) boots flag-on, asserts 4-faced-dice roll +
      always-on surfaces + LOUD off-color refusal + stance-check telegraph +
      the blacksmith HONE round-trip into the tray (1·2·3→1·3·2 ♥★); 5
      screenshots @375×812. 3 NOTEd degradations (Press Fate relic-gated in
      sandbox; momentum advance/break unreachable in demo pool). Mobile verify
      green (infra only). SURFACED: [needs-investigation] suspected flag-on
      paid-SWAY commit bug (die spent, SWAY stays 0, card bounces) — under
      investigation; [needs-user-call] crowding confirmed dense @375×812; stale
      STAKE button renders flag-on (D2 retired it) — (both RESOLVED
      2026-07-18: STAKE hidden by 04d38409; crowding actioned by the
      owner's own playtest polish #118 / 486dbded — gear rail out, dice
      row gap 26→14 + wrap for 375pt; confirmed via /oversight) —
      `test(mobile): Upgradeable-Dice D6d — flag-on combat e2e + visual proof` (7af8dbc8)
- [x] Phase D6e — Enemy stanceCheck telegraphs (yield-lever content).
      The MECHANICS/enemy-content member of the D6 band (D6a–d are mobile;
      this is enemy content — author, no engine change). Promoted via
      /oversight 2026-07-18 to drain D3-F2: D2 shipped `resolveStanceCheck`
      and D4 priced the stance-check synergy, but 0 enemies author a
      `stanceCheck` field, so the `yields: X → +1◆` lever is dark (D3-F2:
      realized yield income 0.000 across 900 encounters) and D7's win-curve
      read cannot exercise the steer-into-yields loop the design leans on.
      Author a first batch of open stance-check telegraphs onto threat phases
      (check *density* + *payout* per D3-F2's dial options). Owner call: a
      DEDICATED content phase pre-D7 (not folded into D6b, not deferred past
      flag-flip). Parallel-safe with D6a–d; hard dep of D7. Brief generates
      on pickup (source: `plan/tuning/2026-07-17-d3-dice-economy.md` §F2).
      Prove: enemy-content tests (a threat phase authors a stanceCheck;
      `resolveStanceCheck` fires the outcome) + a sim witness that realized
      yield income leaves 0.000. Deps: D2 + D4.
      SHIPPED 2026-07-18 — `getThreatSequence` backfills `defaultStanceCheck`
      (punishes enemy stance ×1.5 / yields to chain-successor ×0.5 +1◆) on
      every threat phase at the single choke point (covers the witness enemies'
      explicit sequences the generator missed); hand-authored checks preserved;
      inert flag-off. Yield income 0.000→0.329◆ / total ◆ 1.117→1.451 (band
      PASS, mid-upper); F2 canary flipped; 2753 mechanics tests green —
      `feat(mechanics): Upgradeable-Dice D6e — enemy stanceCheck telegraphs` (0b29ff42)
- [x] Phase D6f — The Roll Ritual (dice roll animation). Owner-added
      2026-07-18 (renumbered from D6e at merge — the /oversight session
      minted D6e for stance telegraphs the same day). A 2.5D tumble
      choreographed to land on the engine-rolled faces (engine RNG stays
      the sole outcome authority — dice-honesty law; animation is
      presentation only). Round-start roll + Press Fate re-tumble
      (cracked dice sit out), tap-to-skip, reduced-motion honored,
      instant-settle under the D6a flag hook for e2e. **Zero new
      dependencies** (Reanimated 4 + rn-svg + expo-haptics, all in-tree;
      Skia evaluated 2026-07-18 = the post-Expo-decouple upgrade path,
      not now). Lands before D7 so the qualitative pass judges
      whiff-feel WITH the ritual.
      Brief: `plan/phases/phase_D6f_roll_ritual.md`.
      Prove: roll-state-machine units (settled faces ≡ engine roll,
      asserted); mobile verify green; flag-off byte-identical. Deps: D6a.
      SHIPPED 2026-07-18 — hermetic roll-state machine (idle→tumbling→settled;
      reroll re-tumbles only changed dice; X/cracked sit out) + 2.5D Reanimated
      tumble over the SVG CombatDie; settledFace = die.face verbatim (dice-honesty
      invariant asserted in animate + instant modes); tap-to-skip; reduced-motion;
      `__AXM_DICE_INSTANT_SETTLE__` keeps the D6d e2e deterministic. ZERO new deps
      (package.json unchanged); flag-off byte-identical. Mobile verify green
      (2650 tests, +26); D6d e2e stays green. NEEDS-USER-CALL: ~0.87s ritual
      duration — feel-rank at D7 (knob isolated in dice-roll-ritual.timing.ts)
      (RESOLVED via /oversight 2026-07-18: owner judges in-app — 0.87s
      stands until it bothers them, verdict lands via /jot; the knob
      location is the record) —
      `feat(mobile): Upgradeable-Dice D6f — the roll ritual (dice tumble animation)` (10ffe174)
- [x] Phase D7 — Tuning, ratification + honest re-baseline. Full
      `/combat-playtest` matrix vs 80/50/25-35/0 (the spec §7 D7 gates);
      ratify D3's economy (blacksmith placeholders die here);
      statusEngagement re-baseline with its known blind spots stated;
      playtester agents; PROVISIONAL special-on-use check-in; flag-flip
      recommendation (flip itself = owner call); **dice-valve promotion**
      (assigned 2026-07-18 drift check: the 9 per-theme dice-interaction
      cards D4 sandbox-staged as `dice-valves-33` — spec 33 §4 valve 3 —
      route through `/deck-tuning` sandbox-first promotion into the
      library; deferred at D4 to D5, dropped at D5, owned HERE).
      Brief: `plan/phases/phase_D7_tuning_rebaseline.md`.
      Prove: bands + ratified-constants report + re-baseline stamp.
      Deps: D4, D6a, D6b, D6c, D6d, D6e, D6f.
      SHIPPED 2026-07-18 (report; flag stays OFF) — added `--upgradeable-dice`
      to `/combat-playtest`, ran the first flag-on win-curve matrix. HEADLINE:
      the model is NOT flip-ready — early 61-66 vs ~80 (a −15 regression the
      flag itself causes), statusEngagement −9pts, because the only ◆ sink
      (Press Fate) fires 0×/round (D3-F3: not equipped on starter loadouts).
      RECOMMEND DO NOT FLIP. Ratified: dice-math gates + realized ◆-income
      envelope (→ hard tests + flag-not-ready canaries). Held: signature 2/3/4
      (needs flag-gated cost machinery), blacksmith placeholders. Owner-locked
      numbers untouched/not indicted; PROVISIONAL special-on-use → recommend
      KEEP (97% spend-rate). Dice-valve promotion DEFERRED (gated on F3 + 5/5/5
      owner call). Unblocker filed to PHASE_CANDIDATES. Report:
      `plan/tuning/2026-07-18-d7-ratification.md` —
      `feat(mechanics): Upgradeable-Dice D7 ratification — flag-on matrix + report` (701762bd)
      **BLOCKER RESOLVED (2026-07-18):** the flag-on paid-play UI commit bug
      (die not forwarded → engine fizzle → card bounce) is FIXED — a flag-on
      early return in `resolveApplyRouting` forwards the dropped die as the
      explicit `dieId`; unit + e2e regression guards added; stale flag-on STAKE
      hidden. `fix(mobile): flag-on paid-play UI commit` — D7's flag-flip is no
      longer gated on it.

- [x] Phase D-FLIP — Upgradeable Dice is the default player and balance-witness model; legacy dice remains an explicit comparison mode. OWNER-DIRECTED
      via /oversight 2026-07-18, explicitly overriding D7's DO-NOT-FLIP
      recommendation: the owner accepts the measured regressions (early
      −15, statusEngagement −9, breaks 2:1 over surges) as transitional
      until D8 lands the ◆ sink, and wants flag-on as the live game NOW.
      Ships FIRST, before D8. Scope: flip `isUpgradeableDiceEnabled()`
      (mechanics `combat.upgradeable-dice.ts`) to default ON + the mobile
      D6a flag hook's default; keep the off switch working (flag-off
      tests/e2e must still be able to force OFF). The D7 flag-not-ready
      canaries (`combat-dice-economy.sim.test.ts`) were built to go red
      when the sink state changes — re-scope them to flag-state-aware
      assertions rather than deleting the evidence; same for any
      "flag-off byte-identical" guards, which invert to "flag-on
      byte-identical" as the default path. Full three-workspace verify
      (public-surface coupling). No tuning in this phase — numbers move
      at D8's re-test. Deps: D7.
      **BLOCKED 2026-07-19 (ship-a-phase, /march tick):** a prior session
      (branch `origin/claude/dice-mechanics-flag-removal-cc7a6b`, commits
      `49a3a372`/`bae870b4`/`cb267dc6`, 2026-07-18) already decided the
      owner wants the full flag REMOVED, not just defaulted — new phases
      D10 (mechanics engine collapse) / D11 (mobile) / D12 (barrel +
      flag-module + dead-symbol removal), sequenced after D8, before D9 —
      and filed an audit finding recommending `/oversight` mark D-FLIP
      `[skipped]`. That branch never merged (and has since diverged too
      far from `main` to cherry-pick safely — it predates the swap-pool
      library work). D8 already shipped without D-FLIP preceding it, and
      the app layer already boots flag-on for every real build
      (`axiomancer-mobile/state/combat/flags.ts`, commit `ae51ab3d`,
      2026-07-18) — only the mechanics-package default
      (`isUpgradeableDiceEnabled()`) is still OFF, by deliberate design
      (tests/sims toggle both models per-suite). Only `/oversight` may
      set `[skipped]`; ship-a-phase does not have that authority, so this
      row was `[blocked]` pending a human call. **RESOLVED 2026-07-23 by T:**
      "Fix main" and "allow for upgradeable dice." Mobile remains default-ON;
      `combat-playtest` now also defaults ON so scheduled balance evidence
      measures the player model, declares `diceModel` in JSON/text, and offers
      `--legacy-dice` only as an explicit comparison. The mechanics module
      stays default-OFF for hermetic isolation and suites may still toggle both
      models. The stale D10-D12 teardown direction is rejected; supported
      comparison is intentional. Request provenance: T's 2026-07-23 reply to
      the doctrine sweeper, because silent Mobile-ON / witness-OFF evidence
      produced materially false player-balance claims.
- [x] Phase D8 — One dice valve in every starter preset. (shipped 10ec4fe8,
      2026-07-18 — all ten themed valves passed the court, no fallback needed;
      curve red at mid/late stays the next bounded tuning phase.) Under the
      Upgradeable-Dice flag, replace exactly one same-aspect card instance in
      each of the ten 15-card starter presets with one meaningful dice valve;
      never append, preserve 5/5/5, keep flag-off recipes byte-identical, and
      keep the curated library at 70 through a ten-in/ten-out promotion ledger.
      Prefer D4's staged thematic valves; the owner-locked fallback floor is
      FREE: reroll one chosen eligible die / PAID: reroll all eligible dice,
      including the powering die. Prove each valve is reachable and fires,
      then rerun D7's curve/economy witnesses. No flag flip inside this
      phase (the flip is owned by Phase D-FLIP, which precedes it — owner
      call 2026-07-18; the sink-mechanism call is also resolved: D8's
      valves ARE the F3 sink, no starter Press Fate grant unless the
      re-test shows the valves under-sink). Deps: D-FLIP, D7.
      Brief: `plan/phases/phase_D8_preset_dice_valves.md`.
- [x] Phase D9 — Authored stance-check variety (salvage PR #109).
      Shipped `2848fb6a`.
      Promoted from AUDIT via /oversight 2026-07-18. D6e's uniform
      `defaultStanceCheck` backfill stays; this phase threads
      `stanceCheck?` through the authoring pipeline
      (`AuthoredThreatPhase` + `CombatThreatBranchOutcome` →
      `resolveAuthored` / `resolveBranchOutcome` / `commitThreatBranch`)
      as an ADDITIVE layer — authored check wins, absent → default —
      so the spec 33 §2 "bosses may check two stances / not-X" variety
      becomes reachable. Reference implementation on closed PR #109's
      branch (`origin/claude/march-push-main-tcjk0j`): pipeline threading
      + 22 hand-authored thematic checks across 14 enemies (bosses naming
      two stances) + e2e guard — rework over the backfill, do not revert
      it. Prove: authored-check-wins unit + the D6e yield-band witness
      stays in band. Deps: D6e, D8.

**Post-D sequence (owner-deferred until every D phase ships, 2026-07-18):**

- [x] Phase 33c — THE COVETED DIE. RE-SCOPED at D1 (2026-07-17, spec 33):
      the rationale (lootable enemy telegraphs; deny/block verbs earn a
      payday) survives and strengthens under open stance checks, but its
      read-era details are dead — steal conditions become STAGGER-to-0 /
      full block / answering the phase's stance check; payout becomes a
      temp gold die (spec 33 §1 ceiling applies, overflow → +1◆; the old
      "floating die of that color, cap 3" is retired). Deps: D2 + D7.
      — `feat(mechanics): THE COVETED DIE — phase 33c` (fc7fddbf)
> **March order (set via /oversight 2026-07-20):** of the three unchecked
> phases, ship **Phase 37** (retire fallacy/paradox — independent, low-risk
> teardown) NEXT. Then Phase 38 (juice layer, owner-selected — now also
> carries the used-dice grey-out jot, see its brief). Phase 33d (GLYPHS
> pilot) last of the three.

- [x] Phase 33d — GLYPHS pilot (Option-B grammar experiment). FREE-charge
      is compatible with spec 33 §3 rule 5 (FREE lines never touch momentum).
      Author pilot cards against the ratified four-die model. Deps: 33a +
      D4 + D7. New `state.glyphs` charge-and-crack zone + dieless
      `crackGlyph` action + `glyphShatter` enemy counterplay hook + 4
      sandbox-only pilot cards (erosion/bastion). No library/preset
      promotion, no mobile UI this phase — both explicit follow-ups. Brief:
      `plan/phases/phase_33d_glyphs_pilot.md` —
      `feat(mechanics): GLYPHS pilot — charging seals, player-cracked (phase 33d)`
      (ac1853b2).

**Legacy-combat cleanup (owner-directed 2026-07-18, chat — ships on its own
branch, parallel to the D-sequence; does NOT preempt the D-sequence march
order):**

- [x] Phase 37 — Retire the fallacy/paradox card category + the dead
      `combatResources` token pool — `refactor(mechanics,mobile,card-editor):
      retire the fallacy/paradox card category — phase 37` (5137511c). The
      `Card.category` field
      (`CardCategory = 'fallacy' | 'paradox'`) is a pre-Hazard-Pattern
      vestige: it drives only `generatePhilosophicalResource`, which banks
      `+1 fallacy/paradox` into `combatResources` — a **write-only pool that
      nothing reads or spends** (the live stance economy is `resonance`
      {heart/body/mind}; the sole reader, mobile `combat-hud`, is null-guarded
      dead code; `scoreCard` is category-blind). Owner call (chat 2026-07-18)
      chose the fuller cut: remove `category`/`CardCategory` AND fully tear
      down the orphaned `combatResources` pool + its dead synergy machinery
      (`consumeAllResources`/`resourceTokenDamageMul`/`consumedTokens` — zero
      live card data uses them) + `generateBasicActionResources`/
      `generatePhilosophicalResource`/`philosophicalCategoryFor` + the
      `philosophical-generated` event, the editor CATEGORY picker +
      `CATEGORIES`/`RESOURCE_KEYS` + codegen line, and the two cosmetic mobile
      badges (character screen, LearnCard modal). The real card types
      (**spell / enchantment / disenchant**) live under a DIFFERENT key
      (`Card.cardType`) and are UNTOUCHED. Barrel-breaking (`CardCategory`,
      `CombatResources`, the three generator fns are public exports) → all
      three gates. No save migration (`combatResources` is transient combat
      state, not persisted). Explicitly OUT of scope: the hazard/gathering
      "paradox-token" reward flags (a separate reward system) and the
      `docs/references/all-{paradoxes,fallacies}-reference.md` lore docs.
      Deps: none (independent of the D-sequence). Brief:
      `plan/phases/phase_37_retire_fallacy_paradox_category.md`.

**Mobile feel layer (promoted via chat session 2026-07-20, T direct —
missing-layers survey):**

- [x] Phase 38 — Central juice/animation layer (combat-first). One shared
      feel module (`lib/juice/`-style) owning the recurring primitives —
      screen shake, impact flash, status-proc pulse, number pops, standard
      enter/exit transitions — every primitive reduced-motion gated inside
      the module, haptics co-fired through a single wrapper (the future
      Expo-decouple swap point), timing constants isolated D6f-style, and
      a global instant/disable escape hatch so seeded e2e never wait on
      animation. Combat encounter surfaces adopt in the same phase
      (status application, VITAE ticks, stance-check feedback, card
      play/refusal); the other ~25 Reanimated call sites migrate
      opportunistically later — no big-bang rewrite, D6f's roll ritual
      untouched. Zero new dependencies (bare Reanimated 4 + worklets +
      rn-svg + expo-haptics). (mobile) Deps: none hard. Brief:
      `plan/phases/phase_38_juice_layer.md`.
      — `feat(mobile): central juice/animation layer — phase 38` (6f291ece)

**THE UNSHACKLING (T direct, /oversight 2026-08-08, second batch — a
product-level pivot that VOIDS several previously "locked" doctrines).**

> T's instruction, near-verbatim: *"remove constraints across the entire
> application. Normal damage is allowed, deck tuning is allowed to change
> anything about a card, no more philosophy based theme. I want to give
> you full freedom to take this deckbuilder in any direction."*
>
> This overrides `plan/bearings.md`'s "locked — do not re-litigate"
> entries by the documented source-of-truth hierarchy (*T's latest
> explicit decision > ADRs/CDRs > build plan > candidates > critique/
> audit > historical reports*). Three constraints fall:
>
> 1. **The strike is alive.** Cards may deal raw enemy-HP damage. The
>    no-strike law (spec 32 v3 §1/§12) and the status-effect-dominance
>    balance doctrine are both VOID for combat.
> 2. **`/deck-tuning` has full card authority.** No sandbox-first
>    quarantine, no byte-identity law, no recolor-not-repartition rule,
>    no owner ballot per change, no `[needs-user-call]` on recolors or
>    new cards. It may change anything about any card.
> 3. **Philosophy theming is retired** as the product's organising
>    fiction.
>
> **Sequencing consequence — read before touching Phase 39 or 40.** Both
> were promoted EARLIER THE SAME DAY against the old doctrine and are now
> built on removed premises: Phase 39 tuned toward a status-dominance
> band that no longer exists (and without normal damage, which is now the
> single largest available lever), and Phase 40 would author card text
> for cards about to be renamed. Both are RESEQUENCED behind the
> unshackling phases below — scope preserved, order changed. See the
> Queue change log.

- [x] Phase 41 — Constraint demolition (do this FIRST; everything below
      depends on it). Remove the machinery that enforces the three
      retired constraints, so later phases are not fighting their own
      test suite: (a) `src/Cards/e2e/doctrine-strike-dead.engine.test.ts`
      — all three witnesses (the 70-card clean-board sweep incl. its
      sandbox/Thoughtform extension, the `SIGNATURE_SKILLS` sweep, and
      the source-level "strike" vocabulary ban) retire; (b) spec 32's
      FREE-line law ("every FREE line must deposit theme currency — never
      damage") and its lint; (c) the sandbox-first / byte-identity /
      recolor-not-repartition rules wherever they are encoded as gates
      rather than guidance (`swap-pool.engine.test.ts`,
      `curated-library.engine.test.ts`'s `POST_D8_SHAPE` pin, the
      `/deck-tuning` skill's promotion path). Amend spec 32 in place with
      a dated superseding header rather than deleting it — it is cited by
      dozens of plan docs. **Do NOT add damage to any card in this
      phase**; this phase only removes the walls. Keep every hermeticity
      and determinism gate (injected RNG, no disk/network in engine
      tests) — those are not the constraints being lifted. **LOCKED
      MECHANICS GUARD (T direct 2026-08-08): Conviction, the Surge meter
      and the Dice system are carved out of the unshackling and must
      survive this phase untouched.** This is the phase most likely to
      break that by accident — it deletes doctrine tests, and some of
      those transitively pin dice / Conviction / surge behavior. Delete
      ONLY the assertions enforcing the three retired constraints;
      re-home any assertion that happens to pin one of the locked systems
      into a suite that survives, rather than dropping it with the file.
      See `plan/bearings.md` § "LOCKED MECHANICS". (mechanics)
      Deps: none. Brief: `plan/phases/phase_41_constraint_demolition.md`.
      — `feat(mechanics): constraint demolition — phase 41` (08745441, 1bd9bd2b)
- [x] Phase 42 — The Dark Fantasy campaign bible (design phase; output is
      a spec, not code). **T ratified the direction 2026-08-08: "Dark
      Fantasy deckbuilding RPG campaign", WHOLE PRODUCT** — so this is no
      longer a three-proposal ballot, it is the authoring of
      `specs/34-dark-fantasy-campaign.md`. T's framing: *"It's looser,
      not that different from what we already have, and should be an easy
      pivot while opening up A LOT of doors."* Treat "looser" as the
      design constraint — this is a re-skin plus permission, not a
      ground-up redesign. Must settle, in writing, before any of 44*
      starts: (a) tone + voice register (supersedes the "cold and old"
      entry in bearings — dark fantasy likely keeps it, say so
      explicitly); (b) the **naming law** — how a card, keyword, theme,
      enemy, place and NPC earns its name, so 44* is mechanical rather
      than improvised; (c) the concept-level rename map — note that
      POISON / BLEED / MARK / DOOM / THORNS / GUARD / RIPOSTE already
      read dark-fantasy and should SURVIVE UNCHANGED, while PREMISE /
      CAPITULATE / SWAY / RAPPORT / REARGUE / CONCEDE / PERORATION are
      philosophy-native and need replacements; (d) what happens to the
      morality system (spec 14 philosophical-alignment + spec 10
      moral-difficulty meter) — dark fantasy has a strong morality
      tradition, so the default is re-skin-and-keep, not delete; (e)
      whether VITAE / STANCE / MORALE survive (VITAE already fits); and
      (f) **what "campaign" means** — descriptive, or a mechanical ask
      for run/meta-progression structure? T's "easy pivot" wording argues
      descriptive; "opens a lot of doors" argues they want the option
      open. Recommend one, do not build it here. Also state plainly what
      does NOT change: engine mechanics, keyword *behavior*, the dice
      model, the minigame doctrines. **LOCKED MECHANICS (T direct
      2026-08-08): Conviction, the Surge meter and the Dice system stay
      in the game permanently — the fiction must be authored to HOUSE
      them, not around them.** All three names already read dark fantasy,
      so the default is to keep the names as well as the mechanics; if a
      proposal wants to rename one, say so explicitly and route it
      through 44a with a `GAME_STATE_VERSION` check. A bible that leaves
      Conviction or the surge meter thematically homeless has failed this
      phase. Deps: none (parallel to 41). Brief: to generate.
      — `docs(specs): the Dark Fantasy campaign bible — phase 42` (4580373)
      Ratified as `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md`.
      Codifies the Profane Canon (`84ef85b`) rather than competing with it:
      the naming law is induced from the 57 shipped card names. 15 renames
      over 42 glossary rows + 8 system terms; 35 keywords survive untouched.
      Morality kept and re-skinned (spec 10 → GRACE, spec 14 → THE OATHS)
      with persisted keys frozen. VITAE + STANCE survive; MORALE → GRACE.
      "Campaign" ruled DESCRIPTIVE. All three LOCKED MECHANICS names kept,
      so **no `GAME_STATE_VERSION` migration is owed by the retheme** and
      44b's guard resolves to "do not touch".
- [x] Phase 43 — Objective function v2 (replaces the parked "metric v2"
      design session, `plan/AUDIT.md`). The parked row wanted a
      player-side, arc-aware successor to `statusEngagement`. The
      unshackling makes it urgent AND changes the target:
      `statusEngagement` was the objective function for `/deck-tuning`
      and `/combat-playtest` precisely because status play WAS the
      doctrine — with that doctrine void, the metric is now measuring
      adherence to a rule the game no longer has. Define what "good
      combat" means under the new rules (candidates: per-turn arc shape,
      win-path diversity/attribution, decision width, comeback frequency
      — decide, don't collect all of them), implement it beside the old
      metric, and re-stamp a baseline under it. Until this lands, treat
      ALL existing doctrine-curve readings as measuring a dead law.
      **LOCKED MECHANICS GUARD: the new objective function must treat
      Conviction, the Surge meter and the Dice system as permanent
      first-class systems** — a metric that rewards decks ignoring them,
      or that would let a later balance pass tune them into irrelevance,
      is a failed metric. Measuring how well they are USED is fair game
      and probably desirable. (mechanics — harness) Deps: 41.
      Brief: to generate.
      — `feat(mechanics): objective function v2 — the Combat Quality Index — phase 43` (21a68f2)
      Shipped as `combatQualityIndex` (spec 35), beside `statusEngagement`
      rather than replacing it. `0.40·spine + 0.25·arc + 0.20·width +
      0.15·identity`; spine is the largest weight because the three LOCKED
      systems are the only permanent structure left after the unshackling,
      and each enters as a geometric mean of fed×used so ignoring one scores
      0. `assertLockedMechanicsFirstClass` throws on a dropped, zeroed or
      negative locked term. **Baseline NOT re-stamped** — run
      `npm run baseline:regen` on a clean tree; it was already STALE by 4
      mechanics-source commits before this phase.

**Retheme execution (44a-44i) — decomposed 2026-08-08 at T's request.
Whole-product scope. Each sub-phase is independently shippable and
verifiable; run them IN ORDER — the map and the guard come first so every
later phase has a safety net, and the product shell comes last because it
describes what the others changed. All depend on Phase 42 being ratified;
none may start early (bearings forbids opportunistic renaming).**

- [x] Phase 44a — Rename infrastructure (no user-visible change). Build
      the machine that makes the other eight safe: (a) a
      `docs/retheme-map.json` artifact — old→new for every card id, card
      name, keyword, theme, preset, place, NPC and enemy, derived from
      Phase 42's naming law; (b) a codemod that applies it, so renames
      are reproducible and reviewable rather than 2,000 hand edits; (c)
      register every retired philosophy term in
      `axiomancer-mechanics/docs/lexicon.json`, whose lint
      (`scripts/check-lexicon.mjs`, already wired into CI via
      `check-lexicon.yml`) then fails loudly on any regression — that
      registry is the single best retheme guard this repo already owns,
      and `docs/LEXICON.md` is its human mirror. Ship the map and the
      guard with ZERO renames applied, so 44b-44i are pure execution.
      (tooling) Deps: 42, 41. Brief: `plan/phases/phase_44a_rename_infrastructure.md`.
      — `feat(retheme): rename infrastructure — map, codemod, naming-law lint — phase 44a` (c5e0f13b)
      Item (c) shipped as a NEW naming-law lint (`scripts/check-naming-law.mjs`,
      NL-8/NL-4/NL-5/V-1) for candidate names on new content, sourced live from
      the map — not as `lexicon.json` rows. Registering the retired terms
      there now, against a codebase and ~40 live docs that still (correctly)
      use the pre-retheme vocabulary, was deferred to each rename's own
      landing phase (44b/44c/44g/44h), which adds its own rows at the commit
      that actually retires the term — matching how every existing
      `lexicon.json` row was added. Filed as residue: `plan/AUDIT.md`.
- [x] Phase 44b — Keyword registry + glossary retheme. **CORRECTED by
      spec 34 §5 (Phase 42): the live registry is 42 `KEYWORD_GLOSS` rows
      + 8 system terms, not ~29.** All 50 are ruled there — 15 renames, 35
      survivors. Spec 34 §4.1 also rules all three LOCKED MECHANICS names
      KEPT, so this phase's LOCKED GUARD resolves to "do not touch" and no
      `GAME_STATE_VERSION` migration is owed on their account. The registry
      keywords, mechanics-side effect ids, mobile's
      `state/combat/keywords.ts`, and `SYSTEM_GLOSSARY`. Bearings' rule
      "never rename engine effect ids for player text" yields here — the
      rename is deliberate and whole-product — but engine ids and player
      text must move TOGETHER in this phase, and any persisted id needs a
      `GAME_STATE_VERSION` migration. Keep the survivors (POISON, BLEED,
      MARK, DOOM, THORNS, GUARD, RIPOSTE) untouched; renaming what
      already works is churn. **LOCKED MECHANICS GUARD: Conviction, the
      Surge meter (`MOMENTUM_CHAIN_ORDER` / `MOMENTUM_SURGE_LENGTH` /
      `SURGE_DIE_PREFIX` / `momentum-surged`) and the dice vocabulary are
      not ordinary keywords** — they are locked systems whose ids thread
      through persisted state and the sim harness. Default: do not rename
      them at all. If Phase 42 explicitly ruled a rename, it goes through
      the 44a map with a `GAME_STATE_VERSION` migration, and the mechanic
      is unchanged either way. (mechanics + mobile) Deps: 44a.
      Brief: `plan/phases/phase_44b_keyword_registry_retheme.md` —
      `feat(retheme): keyword registry + glossary retheme — phase 44b`
      (04c75d22)
- [x] Phase 44c — Card library retheme. ~70 library cards plus the
      sandbox sets, Thoughtforms and `SIGNATURE_SKILLS`: ids, display
      names and faces. **CORRECTED by spec 34 (Phase 42): this row is far
      larger than the work. All five cards it names as the marquee renames
      — `achilles-and-the-tortoise`, `circular-reasoning`, `straw-mans-jab`,
      `memento-mori`, `the-closing-word` — were DELETED by the Profane Canon
      (`84ef85b`), which already rethemed the library to 57 dark-fantasy
      cards. Re-scope against the shipped tree before starting; what remains
      is the rank ladder (spec 34 §5.2 R-14) and stragglers, not ~70 cards.**
      Note
      `axiomancer-card-editor` reads/writes `src/Cards/cards.library.ts`
      in place, so its gate runs too. Faces must still satisfy the
      honesty guard. (mechanics + card-editor) Deps: 44b.
      Brief: `plan/phases/phase_44c_card_library_retheme.md` —
      `feat(retheme): card library retheme — phase 44c` (d64bcadc)
      Rank ladder (R-14), card types OATH/HEX (R-9/R-10), HAUNT class +
      tf-/ht- id prefix (R-13), and eight signature-skill display names
      (§5.5). `tf-minor-premise` further renamed to `ht-minor-charge` /
      "Minor Charge" (44c's own call, flagged in the retheme map). No
      `GAME_STATE_VERSION` bump — nothing renamed is persisted.
- [x] Phase 44d — Themes + presets retheme. **CORRECTED by spec 34
      (Phase 42): 6 archetypes + curse, not 10 themes — the Profane Canon
      re-cut them.** The theme names, the
      preset deck names, `card-themes.ts` `THEME_KEYWORDS`, and the
      shape pins in `curated-library.engine.test.ts`. (mechanics)
      Deps: 44c. Shipped `c73173a5` (brief) — verification-only phase, zero
      code diff: every item was already shipped by `84ef85bd` (Profane
      Canon) and `04c75d22` (phase 44b). See
      `plan/phases/phase_44d_themes_presets_retheme.md`.
- [x] Phase 44e — Enemies + threat sequences retheme. **Spec 34 §5.7
      narrowed the row to one rename: The Incompleteness → The Unfinished.**
      Applied via the retheme codemod scoped to the 5 files naming the
      enemy (enemy-library entry, the exclusive telegraph card's
      actionText, the impossible-stage description, two test files).
      Ids, archetypes, and L110 calibration weights untouched. Shipped
      `865eb90a`. See `plan/phases/phase_44e_enemies_threat_sequences_retheme.md`.
- [x] Phase 44f — World, maps and minigame naming. Spec 34 §5.8 resolved
      almost the entire row: node ids frozen (display names only),
      minigame names RATIFIED as shipped (zero action), rest node gated
      on Phase 52e (not shipped this run — retheme nothing about rest,
      per the row's own instruction). What was left per §10 item 7
      ("author the coastal settlements"): renamed the Fishing Village
      map's region display string to "the Drowned Parish" — spec 34's
      own NL-18 worked example, independently grounded in the
      drowned-parish estate's fiction. Northern Forest and the rest node
      are follow-ups. Shipped `4b9083c1` (brief `30dbab98`). See
      `plan/phases/phase_44f_world_maps_minigame_naming.md`.
- [x] Phase 44g — Characters, story, dialogue and quests. `C-01 the
      Sophist`, `S-01` fishing-village dilemmas, dialogue trees, quest
      board content. This is authored prose, not mechanical substitution
      — the 44a codemod gets it wrong by design, so this phase is
      hand-written against Phase 42's voice section. The heaviest
      creative sub-phase; consider the `/story-spec` and
      `/character-spec` design skills. (mechanics content)
      Deps: 42, 44a. Brief: `plan/phases/phase_44g_characters_story_dialogue_quests.md`.
      — `feat(mechanics): dark-fantasy retheme of coastal NPC dialogue —
      phase 44g` (74f66110)
      Scope resolution (per S-02): C-01 gated on unshipped W-01, S-01
      owned by Phase 53d — neither is this phase's content. Rethemed the
      eight coastal-village dialogue trees' prose (Coastal Beggar,
      Captain Blackwater, Fisherman's Daughter, Village Healer,
      Dockworker's Union Leader, Merchant's Widow) against spec 34 §2:
      dropped exclamation marks, `[Moral meter ±N]` brackets, and
      modern/corporate register. Renamed quest-board `storyBeat` to "the
      Drowned Parish" (44f's deferred item). All flags/deltas/node-ids/
      requires gates byte-for-byte unchanged. Updated three test files
      whose assertions keyed on literal old prose substrings.
- [x] Phase 44h — Morality + alignment retheme. Spec 14
      (philosophical-alignment) and spec 10 (moral-difficulty meter),
      plus the surfaces that render them (memoir / REMAINS, the moral
      choice consequences). Per Phase 42's ruling this is expected to be
      re-skin-and-keep — dark fantasy is a natural home for a morality
      meter — but if 42 rules otherwise this is where it lands.
      (mechanics + mobile) Deps: 42, 44b. Brief:
      `plan/phases/phase_44h_morality_alignment_retheme.md`.
      — `feat(mechanics,mobile): morality + alignment retheme — GRACE /
      THE OATHS — phase 44h` (abee6e92)
      Re-skinned per spec 34 §6, confirmed: spec 10 -> GRACE (3 bands,
      ±34 thresholds), spec 14 -> THE OATHS (CREED/AUGURY/TROTH axes).
      `src/Philosophy/` -> `src/Ledger/`; all 27 alignment cells
      re-authored (damned exemplar / cautionary tale / 3 besetting sins
      each) against the Parish setting. Mobile: character screen (GRACE
      pool, THE ACCOUNT ledger), memoir tab bar (THE LEDGER), tooltips.
      No `GAME_STATE_VERSION` bump — every rename display-only or
      internal-module-only.
- [x] Phase 44i — Product shell + docs. `spec.md` itself (including the
      "your worldview is a mechanical input" premise, which is the line
      that made this an RPG rather than a deckbuilder — 42 decides its
      fate), the root README, `docs/`, mobile tab labels and shell copy,
      the copy canon (VITAE / STANCE / MORALE), and `plan/bearings.md`'s
      "What we're building" section. LAST, because it documents what
      44a-44h actually did rather than what they intended. Historical
      records (devlog entries, dated tuning reports, `plan/` history)
      are NOT rewritten — they are dated records and the lexicon lint
      already exempts `**Status:** HISTORICAL` files.
      (docs + mobile) Deps: 44a-44h. Brief:
      `plan/phases/phase_44i_product_shell_docs.md`.
      — `docs(mechanics,mobile): product shell + docs retheme — phase
      44i` (9a1dabde)
      Closes out the 44-series: spec.md's product thesis rewritten to
      spec 34 S6.4's successor premise ("what you owe, and to whom, is
      a mechanical input") + dark fantasy deckbuilding RPG campaign
      framing (S7); root/mobile READMEs, both VISION.md "Game
      identity" lines, and root AGENTS.md's orientation line retheme'd
      to match (opportunistic, per S0.1); bearings' "What we're
      building" TL;DR rewritten (PIVOTING note discharged) and Voice /
      Copy canon bullets ratified per S2.1/S5.6 (stale "pending Phase
      42" parentheticals dropped, Copy canon gains a GRACE row);
      leftover MORALE->GRACE copy leaks (FLEE/WITHDRAW subtitles,
      event consequence label, flee toast, HEART tooltip) that 44h's
      sweep missed are closed out; docs/api.md's stale "Philosophy"
      heading fixed to match 44h's BesettingSin rename.

- [skipped] Phase 45a — Re-home dice upgrades: design session (attended).
      **ANSWERED BY T DIRECT, attended chat 2026-08-08 — no session
      needed.** 45a existed to decide where D5's HONE/TEMPER die-gear
      economy lives, given the blacksmith screen is dev-menu-only and T
      ruled it the wrong surface on 2026-07-18 (candidates named: rest
      site, relic, event). T picked the **rest site**, unprompted, as
      part of the rest-choice ruling: the anvil is one of three doors on
      every rest node, at rest-node cadence — which settles the cadence
      half of 45a in the same stroke. Superseded by **Phases 52a-52f**;
      see the Queue change log.
- [skipped] Phase 45b — Re-home dice upgrades: implementation.
      Superseded by **52c** (the anvil offer, composing the existing D5
      blacksmith engine), **52d** (the screen — which makes the anvil
      player-reachable for the first time and retires the dev-menu-only
      entry as the sole door) and **52f** (de-placeholdering the prices
      against measured shilling income). Nothing in 45b's scope is
      dropped; it is redistributed.

**The rest-choice epic (52a-52f) — T direct, attended chat 2026-08-08.
Removes the Night Watch rest minigame and replaces the rest node with a
ONE-SHOT THREE-WAY CHOICE: heal 20%, upgrade a die at the anvil for a
high price, or cut a card from the deck for a low-but-escalating price.
Once an option is chosen the node is done and locked. Ship IN ORDER —
the replacement must be reachable before the Night Watch comes out, or
`main` ships a map node with no host screen.**

> T verbatim: *"I want you to plan and add phases to remove the Rest
> mini-game and replace it with a choice for the players: 1) Rest (heal
> 20% of the player's health) 2) Use the blacksmith (upgrade a die for a
> high price of whatever currency name we have) 3) Remove a card from the
> player's deck (Low price to start, but every time the player does this
> across the game, it costs a little more). Once the player chooses an
> option, the rest is done/completed/locked."*
>
> The currency is **SHILLINGS** (`Character.currency`). Four follow-up
> rulings in the same session: **full retirement** of the Night Watch
> (over park-behind-a-flag / keep-as-rare-node); **flat 20%, inns
> exempt**; **prices proposed now, calibrated later** in a dedicated
> phase; and **45a/45b collapse into this epic**.
>
> Naming is theme-bearing and Phase 42 has not ratified the bible yet —
> `plan/bearings.md` forbids improvising dark-fantasy flavor in passing.
> Every phase below uses NEUTRAL working names (`RestChoice`, `rest` /
> `anvil` / `cut`) and keeps player copy in the mobile copy layer so
> Phase 44f can rename it properly. Do not name this node poetically.
>
> **Interaction with the V-sequence (noted 2026-08-08 at merge).** The
> Woodcut Codex landed while this epic was being planned; the two queues
> touch in two places. (a) **V5** wires backgrounds into "encounter
> screens" — `/rest` is one, and **52e deletes the Night Watch screen**.
> Whichever runs second wins; running V5 first means styling a screen
> about to be replaced. Prefer 52d/52e first, or have V5 skip `/rest`
> and pick it up after. V6's glyph unification names hazard / gathering
> / cache / combat and NOT rest, so it is unaffected. (b) **V1 already
> restyled `axiomancer-mobile/app/blacksmith/index.tsx`** — 52d's
> "reuse the blacksmith screen, do not rebuild it" still holds and is
> now cheaper, but read the current file, not the pre-Woodcut one.

- [x] Phase 52a — Deck-removal engine primitive + the escalating price.
      The engine has no card removal at all today (`removeCardFromDeck`
      in `World/Hazard/hazard.engagement.ts` is a *hazard-deck* helper —
      not this, do not extend it). Add
      `removeCardFromCombatDeck(player, cardId)`: drains
      `combatRewardCards` before `knownCards`, removes ONE copy of a
      duplicate, **reconciles the loadout flags** (or the removal is
      invisible — `buildCombatDeck` prefers the curated list over
      `knownCards`), refuses loudly below a `MIN_COMBAT_DECK_SIZE` floor.
      Plus persisted `Character.cardRemovals` and
      `cardRemovalPrice(n)` = **15 + 10n** (provisional).
      `GAME_STATE_VERSION` 15 → 16. (mechanics) Deps: none.
      Brief: `plan/phases/phase_52a_deck_removal_primitive.md`.
      — `feat(mechanics): deck-removal primitive and the escalating price — phase 52a` (dd5c46a)
      Floor shipped at **12, not the brief's 10** — 10 was justified as the
      smallest shipped preset shape, and that justification died with the
      Profane Canon. 12 is the LINEAGE LAW's low-water mark (threadbare 18
      − 6 documented removals), keeps aspect-thirds expressible, and clears
      two hands; the derivation is pinned by a test. Price 15+10n shipped
      PROVISIONAL for 52f.
- [-] Phase 52b — Make the inn a first-class thing. T's "inns exempt" is
      unimplementable against current data: `INN_REST_HEAL_FRACTION`
      makes "is this an inn?" mean `healFraction >= 1.0`, and **three
      wilderness nodes are authored at 1.0** (`nf-4` cold spring, `nf-24`
      hidden grove, and every `fvRestPool` node) — so two forest springs
      currently mend hazard-scarred max-VITAE like a paid shelter. That
      is a live bug the flat-20% rule would cement. Add
      `RestPayload.shelter: 'camp' | 'inn'`, re-author all six rest
      pools, re-home the scar mend onto it, retire `healFraction`.
      Changes no heal numbers — 52c does the arithmetic, so a regression
      here stays legible. (mechanics + mobile) Deps: none.
      Brief: `plan/phases/phase_52b_first_class_inn.md`.
      — `feat(mechanics,mobile): make the inn a first-class thing — phase 52b` (8444922)
      **CARRY-OVER:** retiring a per-node knob was not fully number-neutral.
      Four nodes whose sub-1.0 authoring had nowhere to go now heal at the
      carried-forward default 1.0 (`nf-11` 0.75, labyrinth act default 0.2,
      waystones 0.35/0.5). 52c overwrites all four — until it ships, those
      rests are player-favorable. `REST_PASSIVE_HEAL_FRACTION` is marked
      carried-forward-pending-52c; do not tune it elsewhere.
- [x] Phase 52c — The rest-choice engine. A new pure `World/RestChoice/`
      following the established two-way minigame contract (never reads
      `GameState`; `(session, …) → session`; host settles an outcome
      ledger at claim). Three offers with per-offer affordability and
      loud `disabledReason`s: `rest` free (20% of MAX vitae; inn branch
      full-heal + scar mend), `anvil` **50 shillings** for exactly ONE
      HONE-or-TEMPER — composing the **already-built** D5
      `World/Blacksmith` engine, not rebuilding it — and `cut` at
      52a's escalating price. One commit, then locked; the other two
      vanish. `rest` is free, so a broke player is never dead-ended.
      Also **resolves the standing `[needs-user-call]` at
      `World/MapEvents/types.ts:141-146`** (blacksmith placement/cadence)
      with T's ruling. SWAP is not offered — no map authors variant gear.
      (mechanics) Deps: 52a, 52b.
      Brief: `plan/phases/phase_52c_rest_choice_engine.md`.
      — `feat(mechanics): rest-choice engine — heal / anvil / cut — phase 52c` (e1ae8318)
      The engine names the removed card for `cut`; it does not call
      `removeCardFromCombatDeck` itself (needs the full Character to know
      which list owns the copy) — the host performs the real removal at
      claim, mirroring how it writes the anvil outcome's rail back.
- [x] Phase 52d — The rest-choice screen, and the anvil finally reaches
      players. Repurpose the `/rest` route (path unchanged — the route
      contract is locked); three priced cards with the purse shown and
      unaffordable options **visibly disabled with their reason**, per
      the owner-UI doctrine. **No back-out** — `resolveMapEvent` consumes
      the node on ENTRY (step 5), before any choice, so a cancel path
      burns the node for nothing; verify the Android hardware-back case
      explicitly. Anvil hands off to the existing `/blacksmith` screen,
      which stops being dev-menu-only after ~6 weeks unreachable. Removal
      picker lists the real deck (duplicates and all) and **previews the
      next price before the player commits** — the escalation is the
      mechanic. (mobile) Deps: 52c.
      Brief: `plan/phases/phase_52d_rest_choice_mobile.md`.
      — `feat(mobile): rest-choice screen + anvil hand-off — phase 52d` (3dda879a)
- [x] Phase 52e — Retire the Night Watch. Deleted `World/Rest/` entire,
      the `rest` CLI sub-command + npm script, both barrel re-exports
      (all three workspace gates verified clean), `.claude/commands/
      rest-tuning.md`, and `.github/workflows/rest-tuning.yml`; voided
      the `Rest meagre-but-never-lethal (posture gradient)` doctrine row
      in `plan/bearings.md`. KEPT: the `rest` MapEvent kind, `RestGate`,
      the `'rest'` seed key, the scar mend, `night-keepsake:*` flags, and
      `DebugRestButton.tsx` (52d had already rewritten it to drive the
      rest-choice node — not Night-Watch-shaped code). The mobile
      tutorial/coach files the brief named were already gone, removed by
      52d's own rewrite of the same route. `GAME_STATE_VERSION` 16 → 17
      drops the dead tutorial flag and clears a stray `rest` session key
      from the raw save payload; hermetic migration test added. Updated
      Phase 44f's brief to drop the "has not shipped" gate note. (mechanics
      + mobile + harness) Deps: 52d.
      Brief: `plan/phases/phase_52e_night_watch_retirement.md`.
      — `feat: retire the rest minigame — phase 52e` (d83978cb)
- [x] Phase 52f — Calibrate the shilling economy. Measured the ONLY live
      deterministic shilling source on the two authored maps (the flat
      `loot-cache` MapEvent kind — combat grants none, and the deep
      `World/Hazard`/`World/Gathering`/direct-`'blacksmith'`-node economies
      are dormant, unwired to any node): a new hermetic test walks every
      node on both maps and pins fishing-village at 26 guaranteed
      shillings/act, northern-forest at 18 (one authored `nf-5` cache is
      dead/unregistered content, flagged as a follow-up, not fixed here).
      Derived all three price sets against the stated doctrine and
      de-placeholdered them: `RESTCHOICE_TUNING.anvilPrice` 50 → 25;
      `CARD_REMOVAL_PRICING` (renamed from `..._PLACEHOLDER`) base/step
      15/10 → 5/5; `BLACKSMITH_PRICING_PLACEHOLDER` renamed
      `ANVIL_VERB_PRICING`, hone/temper/swap 2/3/4 → 3/5/8. Retired the
      ◆/souls unit language from both engine files' docstrings. **Tuning
      home**: no new skill — `/world-tuning`'s own text (added at 52e)
      already rules this a one-shot phase, not a recurring loop; this
      report is that ownership discharged. (mechanics + mobile cross-
      package rename) Deps: 52e. Brief:
      `plan/phases/phase_52f_shilling_economy_calibration.md`. Report:
      `axiomancer-mechanics/docs/reports/shilling-economy-calibration-2026-08-16.md`.
      — `feat(mechanics): calibrate the shilling economy against measured loot-cache income — phase 52f` (97560058)

**Narrative encounters (53a-53e) — added 2026-08-09 at T's request
("add phases in order to make sure narrative encounters work"). Evidence:
`axiomancer-mechanics/docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md`; design:
`specs/story/S-02-fishing-village-voices.md`. Ship IN ORDER — the sequence
is machinery → placement → content → reactivity, because authoring against
a broken gate ships more dead content, which is how this state arose.
Orthogonal to 44g: that phase rewrites what existing lines SAY, this batch
changes which lines a player can REACH. Either order works; 53a first grows
44g's surface from 3 reachable trees to 7.**

- [x] Phase 53a — Narrative reachability: the guard, then the mismatches.
      11 of 14 authored dialogue trees cannot be reached by legal play,
      because `resolveInteraction` looks an NPC up by name and falls back
      to a mute card when the name is absent — silently, the same failure
      class as the first-map audit's F5. Add the guard first, mirroring
      `FV_ENCOUNTER_FOES`'s throw-on-import: every `interaction` payload's
      `npcName` must resolve in its host map's roster, and every rostered
      NPC carrying a `dialogueTree` must be either homed on a node or
      declared written-not-staged with a reason (so the test can tell a
      deliberate omission from a lost NPC). Then fix what it catches:
      `nf-7` names `Forest Hermit` for the roster's `Hermit Sage`; `nf-14`
      and `nf-23` use the `interaction` kind for a standing stone and an
      echo — scenery, not people, so they become `cutscene`. `fv-19` is
      left to 53c, which reclaims it. **Widens the pending AUDIT row
      "[world] Map-event content has no coverage guard against unreachable
      authoring" — drain that row here.** (mechanics) Deps: none.
      Brief: `plan/phases/phase_53a_narrative_reachability_guard.md`.
      Shipped `fafc7b4e`.
- [x] Phase 53b — The dialogue gate context, completed in the live path.
      44 gated choices are authored across the rosters; 39 of them can
      never render in the app. `composeNpcDialogue` builds its
      `DialogueContext` by hand and supplies three of five fields —
      `alignment` and `lastSeenAlignmentCellId` are absent, and
      `visibleChoices` fails closed by design, so every `requiresAlignment`
      (33) and `playerAlignmentCellChangedSince` (6) gate evaluates false
      for every player forever. The engine is correct and proven at engine
      level by `old-marrow-observer.engine.test.ts`; the break is mobile's.
      `state.philosophicalAlignment` is already on the store; the observer
      half needs more — mobile never writes `lastSeenAlignmentCells` at
      all, so the write-back must be carried through for the gate to have
      anything to compare against. Witness: Captain Blackwater's greeting
      renders five replies in the app, not two. **Must precede 53c-53e** —
      until it lands, authoring a gated branch ships dead content.
      (mobile) Deps: none (independent of 53a; both must precede 53c).
      Brief: `plan/phases/phase_53b_dialogue_gate_context.md`.
      Shipped `75fb5205`.
- [x] Phase 53c — Placement: the quest-giver on the spine, and a coverage
      floor. `starting-quest` is started from exactly two authored sites,
      both inside Old Marrow's unreachable tree, so the first map's premise
      quest is **never active in real play** — the kill-objective repair
      shipped 2026-08-08 advances a quest nobody holds. Narrow column 1 to
      a single node (`fv-1 → fv-2` only; `fv-2` opens onto all three
      column-2 nodes) and put Old Marrow there, restoring the placement
      `docs/story.md` and `maps.ts`'s own header comment both still assert.
      Home the Coastal Beggar, Captain Blackwater, and the Fisherman's
      Daughter post-boss (one per lane, column 6), per the brief's
      "Decisions made upfront" tie-breaker; move the arrival cutscene's
      road-pointing line into Marrow's mouth. Grid stays at 25 — encounter
      nodes change hands, nothing is added. Re-ran `auditMapTraversal` and
      shipped `auditRouteCoverage` beside it plus a coverage-floor test
      (fv-1/fv-2/fv-6 at 100%, quest board's 33.3% measured and justified).
      (mechanics) Deps: 53a, 53b.
      Brief: `plan/phases/phase_53c_narrative_placement.md`.
      Shipped `44fab3ae`.
- [x] Phase 53d — Author S-01's four dilemmas. Designed 2026-07-xx,
      never wired; both of that spec's open questions were answered
      2026-08-09 at planning time (displace encounter nodes, grid stays
      at 25; flags only, no `moralDelta`) and its intended hosts are
      superseded — read the table under S-01's Open Question 1. Each
      dilemma displaces one encounter node and must sit in a strictly
      earlier column than whatever reads its flag, because a gauntlet has
      no back-travel. New prose ships in spec 34 §2's ratified register
      from the first draft, so 44g inherits nothing to redo. Shipped: The
      Borrowed Hook (fv-16) and The Stranger's Net (fv-4) on
      fishing-village, both 33.3% of routes and strictly ahead of the
      post-boss column; The Frightened Friend (nf-19) and The Crowning
      Witnessed (nf-12) on northern-forest. Encounter/interaction/rest
      now tie for fishing-village's largest kind at 4 apiece.
      (mechanics content) Deps: 53c.
      Brief: `plan/phases/phase_53d_s01_dilemmas.md`.
      Shipped `7d14acd6`.
- [x] Phase 53e — The read-back web: consequences that come back. Across
      every authored map there is exactly **one** `requires.flag` gate in
      the whole game. `fv-14`'s three father flags and `marrow_pressed`
      are set correctly and read by nothing but their own tests, so every
      dilemma is currently a fork with one outcome. Gate a branch on each
      in the post-boss NPCs (Beggar, Blackwater, the Daughter), strictly
      forward-only. Branches are **additive** — a player who set no flag
      sees a complete conversation with nothing visibly missing. The
      Daughter's reactive branches set no `moralDelta`: the dilemmas
      refuse to score themselves, and an NPC who scores them retroactively
      overrules that refusal. (mechanics content) Deps: 53d.
      Brief: `plan/phases/phase_53e_read_back_web.md`.
      `requires.flag` count moves 1 -> 11 (Beggar +3, Blackwater +1,
      Daughter +6); Blackwater's read narrows to `marrow_pressed` only
      (documented in the commit — a second `questCompleted`-gated branch
      would overlap it, since pressing implies completion). Also fixed
      pre-existing mobile-verify drift left over from 53d (stale fv-16
      fixtures; encounter/interaction/rest now tie at 4 apiece).
      Shipped `ccb8654c`.

- [x] Phase 46a — Early-game rethink: design session. Decide whether the
      opening is canned preset-deck tutorials with deckbuilding deferred
      to a labyrinth choice, and re-derive the Quest Board tutorial that
      was dropped. Drains the `[MED]` critique row open since 2026-07-08
      and the score-4.0 candidate. Deps: 42 (tutorial copy is
      theme-bearing). Ruling: rejected canned-battle-per-preset-deck and
      labyrinth-gated commitment (both premised on the 10-theme preset
      model the 2026-08-08 Profane Canon rework replaced, and a labyrinth
      surface still dev-menu-only per spec W-01); scoped 46b to fix the
      real gap (new players can pick the late-game Apostate snapshot as
      their starter) and redirected 46c to Phase 61/53c since the Quest
      Board minigame it targeted is being deleted. Brief:
      `plan/phases/phase_46a_early_game_rethink.md`
      — `phases: brief for phase 46a — early-game rethink (design
      session)` (8decc1c9)
- [x] Phase 46b — Early-game: canned preset-deck tutorial content.
      Implements 46a's ruling (D4: new-player picker collapses to
      Threadbare via auto-seed; D5: primer/coach audit held up, no
      rewrite needed). (mechanics content + mobile)
      — `feat(mobile): collapse new-player starter picker to Threadbare — phase 46b` (a5996b62)
- [x] Phase 46c — Early-game: Quest Board tutorial re-derivation —
      REDIRECTED per 46a's ruling (D6, `plan/phases/phase_46a_early_game_
      rethink.md`): Phase 61 retires the Quest Board minigame this row
      originally targeted, so re-deriving a tutorial for it is moot.
      Verified Phase 53c's shipped quest-giver placement solves
      reachability but not noticing: accepting the quest from Old Marrow
      was silent (only a generic ✓ flash) and nothing pointed at the
      Memoir tab where the quest log lives. Shipped two small additive
      mobile fixes: a reply-time consequence preview on `/dialogue`
      (porting `/event`'s orphaned `consequenceLabel`/`ConsequenceChips`
      into a shared `consequence-copy.ts`) so accepting visibly says
      "quest: starting-quest" before the tap, and a first-quest badge on
      the Memoir tab (`notifications.questAcknowledged`, mirroring
      `levelUpAcknowledged`) that clears on Memoir-screen mount. No
      Quest Board content rebuilt, no engine changes, 53c's map
      placement untouched. (mobile) Deps: 46a.
      Brief: `plan/phases/phase_46c_quest_discovery_coach.md`.
      Shipped `3a1b7291`.

**Expo decouple (47a-47e) — decomposed 2026-08-08 at T's request. T's
"not now" from 2026-07-18 is lifted by the unshackling. Do NOT run this
batch concurrently with 44* — both churn the whole mobile surface.**

- [x] Phase 47a — Decouple inventory + shim layer. Freeze an exact
      inventory of every `expo-*` import site, then route each through a
      thin local module (`lib/platform/*`-style) so the app depends on
      OUR interface rather than Expo's directly. Zero behavior change,
      zero dependency change — this is the seam that makes 47b-47e
      mechanical. Bare-RN libraries (Reanimated 4, gesture-handler,
      rn-svg, screens, safe-area-context) are NOT in scope: they carry
      over unchanged. (mobile) Deps: none.
      Brief: `plan/phases/phase_47a_expo_decouple_inventory_shim.md`.
      Shipped `3473520f`.
- [x] Phase 47b — Navigation: `expo-router` → a bare-RN router
      (react-navigation the obvious candidate). The single biggest
      coupling — file-based routes under `app/` become explicit route
      config, and every route in the locked URL/route contract must
      still resolve. Do this alone; it will touch every screen.
      (mobile) Deps: 47a. Brief: `plan/phases/phase_47b_navigation_router.md`.
      Shipped `49b6f55a`.
- [-] Phase 47c — Assets: `expo-image`, `expo-font` +
      `@expo-google-fonts/*` → bare-RN equivalents, preserving the
      existing font-bundle splitting. (mobile) Deps: 47a.
      Brief: `plan/phases/phase_47c_expo_decouple_assets.md`.
      Shipped `5a69cdb5` — `@expo-google-fonts/*` vendored locally
      (dropped as a dependency, same .ttf bytes, zero behavior change).
      `expo-image` swap attempted + reverted: `verify:visual` caught a
      52.8% pixel-diff regression on the title screen from a custom
      `contentPosition` positioning wrapper that `npm run verify` alone
      couldn't see was broken — root cause not fully isolated, reverted
      rather than shipped guessed-at. `expo-font` itself carried over —
      no native project exists yet to statically link fonts into (47e's
      prebuild). See the brief's "Follow-ups" for both residues.
- [-] Phase 47d — Device APIs: `expo-haptics` (→
      react-native-haptic-feedback or similar), `expo-constants`,
      `expo-linking`, `expo-splash-screen`, `expo-status-bar`,
      `expo-navigation-bar`. Note Phase 38's juice layer already
      co-fires haptics through a single wrapper — that wrapper was built
      as the Expo-decouple swap point, so use it. (mobile) Deps: 47a.
      Brief: `plan/phases/phase_47d_expo_decouple_device_apis.md`.
      Shipped `1dd887b5` — `expo-status-bar` → React Native core
      `StatusBar` and `expo-haptics` → `react-native-haptic-feedback`
      swapped clean (web-verified; native path unverified, no native
      project exists yet). `expo-constants`, `expo-linking`,
      `expo-splash-screen`, `expo-navigation-bar` carried over — each
      blocked on 47e's native-project prebuild or `app.config.ts`
      re-platform. See the brief's "Follow-ups" for all four residues.
- [-] Phase 47e — Build + CI re-platform. `jest-expo` → the bare RN
      Jest preset, `expo lint` → direct ESLint, the `expo start` dev/web
      scripts and dev-server container, and the EAS build path
      (`deploy:preview` / `deploy:production`) → whatever replaces it.
      Post-decouple the RN↔native-lib version matrix becomes manually
      managed (Expo SDK 54 curates it today) — document that explicitly
      in bearings as part of this phase. `@shopify/react-native-skia`
      becomes available here as the parked D6f roll-ritual upgrade path
      (adds a native binary + a CanvasKit-WASM web-loading step that
      should be wired ONCE, into the kept pipeline) — evaluate, do not
      auto-adopt. (mobile + CI) Deps: 47b, 47c, 47d.
      Brief: `plan/phases/phase_47e_build_ci_replatform.md`.
      Shipped `2c26f89f` — `expo lint` → `eslint app components` swapped
      clean (verified byte-identical output to `expo lint`'s own default
      scope: 19 problems, 0 errors, 19 warnings, exit 0); RN↔native-lib
      version-matrix note appended to `bearings.md`; `@shopify/react-native-skia`
      re-evaluated against D6f's 2026-07-18 verdict — unchanged, still not
      adopted. `jest-expo` preset, `expo start` dev/web scripts +
      dev-server container, and the EAS build path all carried over —
      each blocked on a native project (`ios`/`android`) that doesn't
      exist yet and can't be created or verified in this execution
      environment (no Xcode/Android SDK). See the brief's "Follow-ups"
      for all three residues.

- [x] Phase 48 — Root-cause the `Closes #N` auto-close, for real. The
      2026-08-03 fix (`0441c554`, issue #166) does not hold: #174 stayed
      open despite `615ff26b` ending `- Closes #174`, while sibling
      `1004894` closed #175 with the byte-identical trailer in the same
      push window — so the bullet prefix is not the cause. Compare the
      two end to end (push event shape, whether `scripts/loop-issue.mjs`
      or GitHub's own parser did the closing, whether one landed inside a
      batched push where only the tip commit's trailers are scanned).
      Ship a witness that FAILS when the mechanism regresses — the 08-03
      "resolved" claim stood for five days on no witness at all.
      (tooling) Deps: none. Small. Brief: to generate.
      — `fix(tooling): root-cause and replace the Closes #N auto-close — phase 48` (0aac2d3)
      All three hypotheses in this row are ELIMINATED. Real cause: the only
      working close path was a prose step gated behind `deploy:check` going
      green, so a turn ending while CI is amber skips it forever (#174's
      march run ended "Waiting on CI"). GitHub's native parser is inert here
      and has never closed anything. `close-trailers` + its workflow are now
      the authority; 36 hermetic tests, mutation-tested against 5 injected
      regressions.
- [x] Phase 49 — GLYPHS follow-up 1: completeness-critic touch-UX pass.
      The source doc's own pre-mobile-UI gate. (design/mechanics)
      Deps: none. Verdict: GO WITH CONSTRAINTS (merge into existing
      statusStrip row, reuse the existing centered-modal confirm
      pattern, rename UI-facing copy to "Seal", enforce >=44pt hitSlop
      target) — see `plan/phases/phase_49_glyphs_touch_ux_gate.md`.
      — `phases: brief for phase 49 — GLYPHS touch-UX gate` (f1171746)
- [x] Phase 50 — GLYPHS follow-up 2: mobile UI (Seal chip row +
      tap-confirm sheet), once 49 clears. (mobile) Deps: 49.
      — `plan/phases/phase_50_seal_chip_mobile_ui.md`
      — `feat(mobile): Seal chip row + tap-confirm sheet — phase 50` (7e62a007)
> ## NEXT UP — the minigame retirements (T direct, 2026-08-22)
>
> T: *"I've been trying to retire the quest, gathering, and rest
> minigames. Rest is retired but the other 2 are not."* Rest went out
> with Phase 52e (`d83978cb`); the other two had stalled — **Phase 61**
> was ruled on 2026-08-15 but sat behind eight rows, and **Gathering had
> never been ruled at all** (deliberately left out of the 58-65 block
> rather than swept in by implication). T ruled it now and directed that
> both jump the queue.
>
> **The loop takes Phase 61 and Phase 76 FIRST**, ahead of every other
> unchecked row including Phase 58. Both are deletions against the proven
> Phase 52e template, so they are low-risk and they stop the project
> paying attention-tax on systems already decided dead. Normal queue
> order resumes after them (58 is next, and remains "ship it first"
> among the rest).

- [x] Phase 51 — GLYPHS follow-up 3: sim `crackAt` policy heuristic + the
      A/B promotion court (shipped `a0e377d8`). Re-authored a lean 2-card
      `GLYPHS_51_PILOT` sandbox set (the 33d-era pilot cards were wiped by
      the Profane Canon reset); `CombatSimPolicy.crackAt?: number` wired
      into `upgradeablePlayPhase` only (`policyPlayPhase` untouched);
      `greedy`/`blind`/`dot-weaver`/`turtle`/`control-lock` crack at
      cap/2 = 2. A/B evidence (early + late stage, 200 runs/cell):
      late-stage `ALL8` statusEngagement +2.8pp (0.185→0.213), short of
      WI-2's illustrative +10pp — the pooled metric mixes payload kinds
      (only the poison Seal's crack lands as an enemy status). Mean rounds
      moved as anticipated at every crackAt policy. Report:
      `docs/reports/glyphs-crackat-promotion-2026-08-23.md`.

**Balance doctrine repair (promoted via /oversight 2026-08-08, T direct —
the queue had fully drained and the red curve had no phase assigned;
RESEQUENCED the same day behind the unshackling — see above):**

- [x] Phase 39 — Post-D8 flag-on curve repair + library theme-symmetry
      restoration (shipped `8d50591e`). Restored 7 of the D8 "dead 10"
      cards verbatim, filling peroration/forge/control/oracle/harvest's
      missing ench/dis seats; `entropy-tax`'s engine hook re-added.
      `POST_D8_SHAPE` re-pinned symmetric, `cardLibrary` 79 → 86. Owner
      ruling applied: `entropy-tax` seated into foundry (replacing the
      mirror-of-longing borrow), `heart-of-the-matter` into grace
      (replacing the ouroboros borrow) — both with the color-law
      compensating shuffle shown in the preset comments. Ouroboros's
      REPLAY_LAST retuned toward its ~25% fizz target (landed 11-17%).
      Duplication/cut levers investigated but NOT force-applied: the
      13-candidate staple list is mostly already-deployed or stale, and
      the already-staple-heavy presets still sit at 0% mid — filed as
      needs-user-call (mid cliff looks engine/enemy-scaling-shaped, not
      card-shaped) rather than churned blind. Foundry's early win rate
      regressed 73%→44% losing its sole SWAY win-path with no
      replacement in the library — flagged as its own needs-user-call
      follow-up, applied anyway per the owner's explicit ruling. Brief:
      `plan/phases/phase_39_curve_repair_and_symmetry.md`.
      **SHIPPED UNDER THE PRE-UNSHACKLING DOCTRINE (reconciled via
      /oversight 2026-08-08).** This phase landed at 08:48Z, hours before
      the unshackling merged, so it executed against rules that are now
      void: it tuned toward the 80/50/25-35/0 status-dominance band,
      normal damage was still illegal and therefore unavailable as a
      lever, `/deck-tuning` was still sandbox-first, and the
      foundry/grace reseat was applied blind per the then-standing owner
      ruling rather than re-derived. **Do not revert or re-run it** — the
      library work (7 cards restored, `POST_D8_SHAPE` symmetric,
      `cardLibrary` 79 → 86) is good regardless of doctrine, and its two
      `needs-user-call` findings are more useful now than when filed.
      Specifically: the foundry regression row says "no card in the
      current 86-card library gives forge a heart-aspect win-path
      alternative" — under the unshackling that is no longer a
      constraint, since a replacement may now be authored freely,
      including with normal damage. Phase 43 decides whether the residual
      mid/late numbers are a defect at all before any follow-up tunes
      toward them.

- [x] Phase 40 — SHIPPED `0048e3ea` (2026-08-23; brief `36cf0698`). Re-scoped
      at ship time against PR #193 (the authored sentence moved off the
      glance FACE onto the inspect overlay; the grammar governs that
      overlay sentence + the mobile glossary, not a bare-keyword face) and
      the completed 44a-44i retheme — both blocking deps below are
      resolved. Full pass: 31 of 57 `cards.library.ts`
      `paidSummary`/`persistentEffect` strings rewritten (em-dash/
      semicolon banned, "the foe" fixed vocabulary, colon as trigger
      label, 130-char `paidSummary` cap) + 17 mobile `KEYWORD_GLOSS`/
      `SYSTEM_GLOSSARY` entries (a superset of the row's 6 named
      examples — the lint has to cover every entry or it isn't a lint).
      Honesty-guard budget tightened 200→130; em-dash/semicolon +
      "the enemy" lints added on both mechanics and mobile. Both named
      sub-calls found ALREADY SATISFIED pre-phase (documented, not
      re-done): PERORATION was already dropped from the face at phase 29
      (the-closing-word/the-black-cap prints `SENTENCE at N`); the-overtake
      (now communion-of-the-worm) carries no `fuelPerPip` post-retheme, so
      no live card ever rendered the 3.5 decimal. The 130c-render-cap
      screenshot witness is N/A under the re-scope (no fixed-width face
      render exists for this text any more; the lint enforces the budget
      instead) — see `plan/phases/phase_40_card_text_grammar.md` and the
      shipping commit body for full decision detail. Follow-up residue
      (engine-generated "the enemy" strings in `combat.cards.ts` +
      mobile's `mechanicHeadline` prose) filed to `plan/AUDIT.md`.
      Verify: mechanics `npm run verify` green (typecheck/lint/2900
      tests/build); mobile `npm run verify` green (lint/typecheck/2826
      tests); card-editor `type-check` green (data/prose-only diff, no
      type-union change).

      (Original row text — the R4 ruling, the pre-ship dependency
      analysis, and the 2026-08-10 #193 re-scope note — preserved verbatim
      in git history: commits prior to `0048e3ea`/`36cf0698`, e.g.
      `git show b647fc65:plan/steps/01_build_plan.md`.)

- [x] Phase 54 — Route live combat through `endCombat` (556ec152). `AUDIT.md`
      "[mobile] The live combat exit path bypasses the engine's
      end-of-combat reducer entirely" (first-map audit 2026-08-08,
      finding F3): hazard combat (Spec 26b) never calls `endCombat`, so
      every side effect that reducer owns — flags, codex unlocks,
      faction deltas, morale, run counters, not just the
      quest-progression break already fixed at the symptom via
      `applyHazardOutcome` calling `advanceKillObjectives` directly — is
      silently absent from live play. Ruled via `/oversight` 2026-08-10:
      route the live path through `endCombat` rather than keep it
      diverged and enumerate deltas by hand (the correctness risk of an
      unenumerated silent no-op outweighs the refactor cost of
      reunifying it with the panel's local React combat state). Read
      `game.reducer.endCombat` line by line first, diff it against
      `applyHazardOutcome` + `handleHazardExit`, and either route calls
      through the reducer or thread each side effect explicitly if a
      clean call site isn't reachable. Resolves the standing
      `[needs-user-call]` at `plan/AUDIT.md`'s endCombat row. Brief: to
      generate.

- [x] Phase 55 — Retire the dead "THE STRIKE IS DEAD" doctrine string
      from the engine-truth MCP (20b5a1be). `AUDIT.md` "axio-query overview still
      publishes the retired 'THE STRIKE IS DEAD' doctrine after Phase 41"
      (filed 2026-08-08 by the scheduled SomberSoft roundtable, score 72 —
      the AUDIT queue's top row, given an explicit divergence bias
      2026-08-10 that two full ticks did not drain). Live `axio_overview`
      still answers "THE STRIKE IS DEAD — no card touches HP..." because
      `scripts/axio-mcp-server.mjs::extractDoctrine()` selects that phrase
      from the stale header of `axiomancer-mechanics/src/Cards/cards.library.ts`.
      T voided that doctrine in the 2026-08-08 unshackling and Phase 41
      removed its hard test, but the engine-truth MCP still presents the
      dead law as current. **Promoted directly via `/oversight` 2026-08-12**
      (T: "focus the march loop on closing the rest out" — this is the
      queue's stuck top row, worth a direct promotion rather than a
      third bias-weighted `/iterate` tick). Update the card-library
      header to state that direct damage is legal while Conviction, Surge
      and Dice remain locked; update the MCP doctrine selector if
      necessary; add a server smoke assertion that the overview cannot
      publish the retired phrase. Verify `axio_overview` against the live
      server plus the nearest MCP smoke test. (mechanics; docs + small
      code fix) Brief: to generate.

**Promoted via `/oversight` 2026-08-15 (T direct, attended web session):**

- [x] Phase 56 — The dice valves under-sink: add the starter Press Fate
      grant alongside them. **This supersedes the 2026-07-18 valves-only
      ruling, on that ruling's own terms.** Phase D8 shipped one dice
      valve into every starter preset and was declared the F3 sink, with
      an explicit revisit condition written into its row: "no starter
      Press Fate grant **unless the re-test shows the valves
      under-sink**." The post-D8 nightlies are that re-test and they read
      under-sink — the first default-Upgradeable-Dice nightly (digest
      2026-07-30) found mid in near-total collapse and late dead flat,
      and the same mid-0.0 / late-0 shape then held for six straight
      reduced-nightly reads through 2026-08-07 (see `plan/AUDIT.md`'s
      Doctrine-curve confirmation rows). The original D7 diagnosis
      (`plan/tuning/2026-07-18-d7-ratification.md` §10) still describes
      the mechanism: `sig-press-the-point` is on no starter loadout
      (verified still true 2026-08-15 — no `sig-press-the-point`
      reference exists in any loadout/preset source), so Press Fate
      fires 0.000×/round and the leaner economy's ◆ specials have
      nowhere to go. **T ruled 2026-08-15, offered the two mechanisms
      and choosing both:** (1) grant `sig-press-the-point` on starter
      loadouts, and (2) promote a dice-valve reroll card into the preset
      recipe — which also drains the deferred `dice-valves-33`
      promotion. Then re-run the D7 curve/economy witnesses. Expect the
      flag-not-ready canaries in `combat-dice-economy.sim.test.ts` to go
      red once the sink is live; that is the phase working, not a
      regression. **Attribution caveat, since both levers land at once:**
      measure them separately before the combined read (grant-only, then
      promote-only, then both) so a curve move can be traced to a lever.
      Note the D7 flag is already flipped on (Phase D-FLIP, 2026-07-18) —
      this phase repairs the shipped default's curve, it does not gate a
      flip. Entangled and still separate: the signature flag-gated cost
      machinery (D3's 2/3/4 table) and the between-combat souls economy
      pass. (mechanics; balance-critical, matrix evidence required)
      — verified both levers already shipped by earlier commits the row's
      own evidence chain predates: the starter Press Fate grant landed via
      Phase 19 + `7f989382` (2026-07-18, Gambler's Knot default-worn — the
      "no starter loadout" read conflated deck cards with worn-equipment
      signatures), and the dice-valve preset promotion landed via the
      Profane Canon rework `84ef85bd` (2026-08-08, `PRESET_DICE_VALVES` +
      the three Reliquary Dice cards). The in-suite D7 re-test the row
      asks for is already pinned green (`combat-dice-economy.sim.test.ts`
      F3 + STAKE-gap canaries). Also noted: Phase 43 (same day as the
      Profane Canon rework) retired the win-rate doctrine the row's alarm
      was read against in favor of CQI, which reads flat/healthy
      (~79-80%) across early/mid/late today. No source changes shipped;
      see `plan/phases/phase_56_dice_valve_undersink_reverify.md` for the
      full evidence trail — `docs: phase 56 verified — dice valve levers
      already shipped — phase 56`

- [x] Phase 57 — Stop publishing the private DevLog: the in-repo half of
      the Pages scope-down. `plan/AUDIT.md`'s divergence row (impact 8)
      confirmed on 2026-08-12 that `https://axiomancer.pages.dev` serves
      `/devlog/log.html` — generated HTML whose own header reads "A
      private index of the game's content and the nightly development
      log" — **live and unauthenticated on the production domain**.
      T ruled "incidental, scope it down" on 2026-08-10; five days on,
      nothing had changed, because the row's own "next" note said the fix
      needs an infra actor outside this repo and so no loop verb picked
      it up. **T ruled 2026-08-15: queue the in-repo half now.** Scope:
      stop `.github/workflows/build-devlog.yml` committing generated
      DevLog HTML to `main` for Pages to serve (artifact-only, or an
      unserved path — pick whichever keeps the DevLog reachable to the
      humans who use it), and add a check that fails if DevLog HTML
      reappears in the served tree. That removes the private content from
      what Pages publishes without needing dashboard access. **Explicitly
      out of scope and still needing a human at the Cloudflare
      dashboard:** restricting or disabling the Pages project itself, and
      the per-branch `https://<branch-slug>.axiomancer.pages.dev` preview
      URLs, which stay guessable-from-a-branch-name after this phase
      ships. Do not close the AUDIT row on this phase alone — it drains
      the half that lives in this repo. (infra/CI; small, no engine risk)
      Shipped `cb788468`.

**The encounter reshape (58-65) — T direct, attended web session
2026-08-15.** T opened the session asking that "every encounter has a
narration with it so the player has some flavor in terms of what's
happening," then defined three of the non-combat events outright. This
block is that definition, queued. It continues the arc 52a-52f started
(the rest minigame retired for a choice screen) and partially executes
the standing candidate T filed 2026-08-10 — *"folding the treasure,
quest, rest, and narration events into a single 'encounter' event,
taking away the minigames... The minigames as they are are just time
consuming and seem to add nothing."* **Deliberately NOT in scope:** the
Gathering minigame ("The Gleaning") and the hazard board both survive
this pass — the candidate names Gathering for retirement but T did not
rule on it here, so it stays open rather than being swept in by
implication. Combat and Hazard-Pattern Combat are untouched.

- [x] Phase 58 — Carry authored narration to the player (426912a9).
      `ResolvedEvent` now threads `description` from every
      `MapEventPayload` kind but `cutscene` (already used `lines`) and
      `none`; every handler passes it through; mobile's
      `bodyFromPayload` prefers it over `DEFAULT_BODY_BY_KIND` for the
      kinds that reach the event modal (interaction, village). Brief:
      `plan/phases/phase_58_map-event-descriptions.md`.

- [x] Phase 59 — Rest is two offers: heal 25%, or cut a card. **T
      direct, 2026-08-15:** *"Rest: Heal 25% health or remove a card.
      One liner narration."* Today `RestChoiceOfferId` is
      `'rest' | 'anvil' | 'cut'` (`World/RestChoice/restchoice.types.ts:21`)
      — the anvil leaves the rest screen under this ruling (its
      replacement door is Phase 60). Scope: drop the `anvil` offer and
      its `anvil-pick` step from the rest-choice engine and screen, pin
      the heal at a flat 25% of max VITAE (today it computes against a
      cap), and give the node its one-line narration. **Assumption
      recorded, not ruled:** `cut` keeps Phase 52a's escalating removal
      price — T said "remove a card", not "remove a card free", and
      making it free would orphan a primitive that shipped 2026-08-06.
      Flip it only on an explicit call. Deps: 60 (land the anvil's new
      door first, or the surface is briefly unreachable).
      (mechanics + mobile) Brief: `plan/phases/phase_59_rest-two-offers.md`.
      — `feat(world): rest is two offers — flat 25% heal or cut a card — phase 59` (94b85569)

- [x] Phase 60 — SHIPPED `68977b93` (2026-08-25; brief `cfc57097`). Re-home the Anvil to its own map node. Phase 59 takes
      the anvil off the rest screen, and rest was its ONLY route: the
      `blacksmith` MapEventKind is built, registered and tested but
      deliberately unplaced in map content (`MapEvents/types.ts:159`
      records T's 2026-08-08 ruling that the anvil is reached *through*
      rest). Without this phase, Phase 59 silently orphans the whole
      Blacksmith surface — Phase D5 plus D6a-D6f, a seven-phase series
      with a screen, tray rework and gear-inspection panel. Scope: place
      `blacksmith` nodes in authored map content at a defensible cadence
      and confirm the existing interceptor path reaches the D6 screen
      unchanged. **Provenance note:** T was asked directly whether the
      anvil should be re-homed or retired with D5/D6a-f, and answered
      "queue all of these up" against a table in which this row was
      listed as the re-home option — so re-home is read from that
      selection, not from silence. It is also the reversible choice:
      nothing is deleted, and retiring the surface later stays available.
      If T meant retire, this row is what gets cut, and 59 absorbs the
      deletion instead. (mechanics + mobile) Brief: to generate.

- [x] Phase 61 — Retire the Quest Board minigame ("The Boy's Almanac").
      **T direct, 2026-08-15:** the quest event is *"a little bit harder
      for now, let's just remove it entirely"* — then, asked which of the
      two systems named "quest" that meant, *"Minigame only and keep
      it."* Deleted `World/QuestBoard/` entire, the `quest` MapEventKind
      and its mobile interceptor, `quest-board.cli.ts` + npm script, the
      `quest-board-tuning` skill/workflow, the `app/quest` route, and
      the harness's questBoard arm — plus a `GAME_STATE_VERSION` 17→18
      hop clearing any live board session from the save payload.
      Scope grew by one honest discovery: the Labyrinth also fired
      `quest` on its three pre-boss "ledger" rooms with boardIds that
      were never registered (a latent crash-on-arrival bug); those rooms
      now narrate instead. fv-15 (fishing-village) rejoins the encounter
      roster as the orphaned `foot-stealer`. **Explicitly UNTOUCHED:**
      `World/quest.engine.ts` and `quest.library.ts` — the QuestLog
      objective tracker holding `starting-quest` — which T ruled stays.
      Phase 53c therefore survives and gets MORE load-bearing, not less:
      with no quest node on any map, its quest-giver is the only way a
      player ever learns a quest exists.
      (mechanics + mobile; deletion) — `feat(world): retire the Quest Board minigame — phase 61` (f674c147)

- [x] Phase 76 — Retire the Gathering minigame ("The Gleaning"), KEEP
      the gathering map node. **T direct, 2026-08-22:** T named Gathering
      among the minigames being retired, then handed the shape of the
      retirement to the loop verbatim — *"This is the type of freedom I'm
      trying to provide the loop. You decide everything."* The call, and
      why it is not a plain deletion:
      **Two different systems share the name "gathering", exactly as two
      shared the name "quest".** (a) `World/Gathering/` is The Gleaning
      minigame — sites, plots, wrath economy, tools, boons, omens, its
      own sim, CLI and tuning skill. (b) `MapEventKind: 'gathering'` is a
      plain map node whose entire payload is
      `{ items: Item[]; description?: string }` — the engine resolver
      already returns the items directly; it is ALREADY the "here are
      your options and their effects" shape T asked for in the
      2026-08-10 candidate. The minigame is a MOBILE-SIDE INTERCEPTION:
      `axiomancer-mobile/state/actions.ts:1693` sees a resolved
      `gathering` event and launches The Gleaning instead of granting
      the items.
      So this phase retires (a) and keeps (b) — the same narrowing T
      himself ruled for quest (*"Minigame only and keep it"*), applied to
      the identically-shaped ambiguity.
      **Scope (delete):** `World/Gathering/` entire; `gathering` CLI
      sub-command + the `gathering` npm script; the `gathering-tuning`
      skill (`.claude/commands/gathering-tuning.md`) and its workflow
      (`.github/workflows/gathering-tuning.yml`); mobile's
      `state/gathering/` slice, `app/gathering/` route, `GatheringGate`,
      `DebugGathering`, and the interception at `actions.ts:1693`; plus a
      `GAME_STATE_VERSION` hop clearing any live Gleaning session from
      the save payload. Phase 52e (`d83978c`) is the template.
      **Scope (KEEP, deliberately):** the `gathering` MapEventKind, its
      `GatheringPayload`, the resolver's `{ kind: 'gathering', items }`
      return, and all **8 authored gathering nodes** in
      `MapEvents/content.ts`. Three reasons: the maps keep their event
      density (deleting the nodes leaves holes); the resolver feeds
      `advanceCollectObjectives` from gathered item ids
      (`resolve-map-event.ts:264`), so removing the node would silently
      break every collect-type quest objective; and once Phase 58 lands,
      the node reads as authored prose + the items it grants — precisely
      the target shape. After this phase the node grants its items
      inline with no screen detour.
      **Also update:** the AGENTS.md tuning-skill roster and the
      `ci-e2e-scope.mjs` gathering suite routing (its mobile journey
      disappears with the route), and close the retirement candidate in
      `plan/PHASE_CANDIDATES.md`.
      (mechanics + mobile; deletion)
      — `feat(world): retire the Gathering minigame — phase 76` (f18e6643)

- [x] Phase 62 — Ally cards. The loot-cache sacrifice chain (Phase 65)
      pays out an "ally card reward", and no ally concept exists anywhere
      in the card schema today. T ruled the full chain in scope
      2026-08-15 ("everything including Ally"), so this is the schema
      question that has to be answered before 65 can pay anything out:
      what an ally card IS mechanically (a card type? a rank? a
      persistent companion?), how it prices under `cards.pricing.ts`,
      and whether it lives in the curated 70-card library or outside it.
      Needs a design pass, not just wiring — take it through
      `/brainstorm-mechanics` or `card-expert` before implementing.
      Blocks 65. (mechanics; design + schema)
      Brief: `plan/phases/phase_62_ally_cards.md`. Decision: an Ally is a
      `cardType: 'oath'` Card (no new CardType/keyword) living in a new
      sibling registry (`cards.allies.ts`, mirroring `cards.haunts.ts`)
      outside the pinned 57-card library (the "70-card" framing above was
      itself stale — the Profane Canon rework already dropped it to 57);
      ships one reference Ally wired through the engine + pricing +
      a 16-case hermetic e2e.
      — `feat(mechanics): ally card schema — phase 62` (0b78483c)

- [x] Phase 63 — The loot cache becomes a three-way choice. **T direct,
      2026-08-15:** *"Card reward, item reward, or sacrifice reward."*
      Scope: replace The Reliquary's dice-pool delving session with a
      plain three-offer choice on the existing resolver (same shape 52c
      gave rest), and add the per-map goodwill counter the sacrifice
      branch writes — T's framing: *"if the player decides to sacrifice
      the reward, it'll be noted on their journal as 'Helped <current
      map> n times'."* The counter is net-new state; nothing like it
      exists (the flag system has exactly one `requires.flag` gate in the
      whole game, per Phase 53e's finding). Design it as a per-map tally
      on `GameState`, not a flag, since it must count rather than latch.
      This also hands Phase 53e's read-back web its first real consumer.
      Retires `loot-cache-tuning` + its CLI/workflow with the minigame.
      (mechanics + mobile) Brief: `plan/phases/phase_63_loot_cache_three_way_choice.md`.
      New `World/LootCacheChoice` pure engine (card/item/sacrifice, no
      sub-picks — candidates are host-rolled at session creation, mirroring
      `RestChoice`'s `deckCardIds` pattern); old `World/LootCache` dice-pool
      engine + CLI + skill deleted. `GameState.mapGoodwill: Record<string,
      number>` ships as a plain slice (no Faction-style module — one writer
      this phase). `GAME_STATE_VERSION` 19→20.
      — `feat(world): loot cache becomes a three-way choice — phase 63` (a7032809)

- [x] Phase 64 — The journal reads the goodwill back. Render Phase 63's
      per-map counter as "Helped <map> N times" on the memoir tab
      (`axiomancer-mobile/app/(tabs)/memoir/index.tsx`), which already
      exists and already reads keepsake flags. Small, but it is the half
      that makes the sacrifice legible — a counter the player cannot see
      is not a choice, it is a silent tax. Deps: 63.
      (mobile) — `feat(mobile): memoir reads the goodwill tally back — phase 64` (405bbab0)

- [x] Phase 65 — Village goodwill rewards. T's framing: *"When they
      visit a village in that map, they'll receive discounts at the shop,
      an ally card reward, and other various rewards."* Three tiers off
      `mapGoodwill`: tally >= 1 a 10% BUY discount, >= 2 grants the-sworn-
      second into knownCards, >= 3 a one-time +25 currency gift (flag-
      tracked). Deps: 62, 63. (mechanics + mobile)
      — `feat(world): village goodwill spends the counter — phase 65` (045e5241)
- [x] Phase 66 — Lexicon lint: catch retired-doctrine prose, not just
      retired identifiers. Add a `type: "doctrine"` (or similar) row
      shape to `axiomancer-mechanics/docs/lexicon.json` for retired
      design-law phrases — starting with the STRIKE-IS-DEAD/status-primacy
      sentence and the statusEngagement/win-rate-is-the-objective
      sentence, both with a known-good replacement already written (
      `VISION.md`'s reconciled §Combat vision language; Phase 43's CQI
      framing) — extend `scripts/check-lexicon.mjs`'s pattern matching for
      multi-clause phrases, and fix the two rows it newly flags
      (`axiomancer-mechanics/CLAUDE.md`, `axiomancer-mechanics/docs/
      profane-canon.md`) in the same commit. Leave `skills/digest.md` §3b
      alone — it's still waiting on the CQI-band design ruling; the lint
      should flag it, not force its rewrite. (docs/tooling; promoted
      2026-08-20 via `/oversight` from `plan/PHASE_CANDIDATES.md` score
      7.5) Brief: `plan/phases/phase_66_lexicon_doctrine_lint.md`.
      SHIPPED 2026-08-27 (`d3b46d59`, issue #243): `type: "doctrine"` row
      shape + whole-file whitespace-normalized matching (catches a claim
      wrapped across line breaks), three doctrine rows, five live surfaces
      reconciled, two pragma-exempted, 11-case regression test wired into
      root `npm test` and the check-lexicon workflow. `skills/digest.md`
      §3b left alone AND unflagged — `9caf2a26` had already reconciled it
      to past tense, so the assertion-scoped row reads it clean.
- [x] Phase 67 — Title migration: "Axiomancer" → "Miserere Mei, Deus".
      Executes the rename ruled `plan/AUDIT.md`'s product-name row
      (`plan/naming-session-2026-08-12.md` §6). Scope: player/doc-facing
      title strings only — `axiomancer-mobile/app.json`'s `name`/`title`/
      `description`/`siteName` fields and `app.config.ts`; the five CLI
      banner `log(...)` lines in `axiomancer-mechanics/src/CLI/*.cli.ts`
      that print "Axiomancer — <mini-game> ..."; doc mentions in
      `plan/bearings.md`, `spec.md`, `AGENTS.md`, and the handful of code
      comments in `axiomancer-mechanics/src` that name the product.
      Explicitly OUT of scope: npm package/workspace names (`axiomancer`,
      `axiomancer-mobile`, `axiomancer-mechanics`), the repo/folder name,
      and any git-level rename — those are internal identifiers, a
      separate and much larger structural call nobody has ruled on.
      Check during shipping: no UI surface places the new title next to
      the already-live "Miserere" in-fiction content in a way that reads
      as a duplicate (flagged in the AUDIT row and naming-session §6).
      (content/docs; queued 2026-08-20 via `/oversight` from the
      product-name naming-session ruling) Brief:
      `plan/phases/phase_67_title_migration.md`. SHIPPED 2026-08-27
      (`fad33688`, issue #244): store/web metadata (rewritten, not
      find-and-replaced — the old description was false about the product
      regardless of its name), both CLI banners (two, not five — the other
      minigame CLIs were retired since the row was written), the published
      DevLog/Catalog/Tuning-Lab chrome (added to scope: the most
      public-facing title surface in the repo), six doc surfaces, four code
      comments, and hard rule 9. Collision check recorded in the commit and
      the brief: no UI surface renders the product title beside the live
      "Miserere" card. NOT shipped — the title-screen wordmark is painted
      into `title-embark.jpg`, so the app screen still reads "AxiomanceR"
      until new art lands; filed as an AUDIT row for the art pipeline.

- [x] Phase 68 — Keyword-drift hardening. Close the silent surfaces the
      2026-08-22 content-pipelines audit found so the now-open keyword
      registry (THE PIPELINE LIBERATION) grows safely: derive mobile
      KW-2's mechanic-kind check from `CardSpecialMechanic['kind']`
      instead of its hardcoded 17-kind array; add drift tests asserting
      the three hand-synced glyph tables agree (mobile
      `glyphShapes.ts`, editor `CardFace.tsx` KwGlyph,
      `scripts/build-catalog.mjs`) and that the editor's `wx.ts`
      KEYWORDS vocabulary contains no retired terms; regenerate
      `axio_keywords` from data instead of hand-parsing
      `docs/keyword-atlas.md` (or add an atlas-vs-registry parity
      check) and drop the server's hardcoded "/30" denominators.
      (tests/contract; queued 2026-08-22 per THE PIPELINE LIBERATION)
      Brief: `plan/phases/phase_68_keyword_drift_hardening.md`. SHIPPED
      2026-08-27 (`25e3e3cb`, issue #245). All four workstreams landed.
      What the work found beyond the row's own description: KW-2 was
      checking 17 kinds while the mapping already held 22; the editor
      carried five dead spec-32-v2 words (COMPOUND / EXECUTE / SLOW /
      CONFUSION / SILENCE) plus unreachable render arms for them; and the
      `axio_keywords` atlas parser was reading only two of the atlas's four
      sections, under-reporting 34 rows as 29. Correction to the row's
      premise: the three glyph tables are not three copies of one table — mobile and
      build-catalog are identical copies (asserted equal now), while the
      editor's `KwGlyph` is an independently-drawn switch, so it is gated on
      "names something the project has" instead of path equality.
- [x] Phase 69 — Card-editor round-trip fidelity. `CardDraft`
      (`axiomancer-card-editor/src/types.ts`) omits `theme`,
      `paidSummary`, `persistentEffect`, `intentionallyAsymmetric`,
      `glyph`, and codegen drops the `// pts:` arithmetic comment — an
      editor upsert of an existing card silently destroys data the
      test suites and pricing doctrine depend on. Carry every Card
      field through draft + codegen (preserving `// pts:`), and add a
      round-trip test (library literal → draft → codegen → equal).
      (contract; queued 2026-08-22 from the content-pipelines audit)
      Brief: `plan/phases/phase_69_editor_round_trip.md`. SHIPPED 2026-08-27
      (`3317e337`, issue #246). All five fields + the `// pts:` comment now
      round-trip, proved over the whole live library. Beyond the row's list,
      writing the test found a SIXTH loss: `synergyLines` was a hand-written
      allowlist of seven keys, so `statePredicate` and `rider` were dropped
      from the five cards carrying them — now emitted generically. Note the
      editor had NO test runner before this phase; vitest is now wired in and
      covered by `verify-card-editor`. Follow-up left open: the restored
      fields still have no form controls (this phase guarantees they SURVIVE
      an edit, not that they can be edited).
- [x] Phase 70 — Prose lint for shipped `.ts` content + naming law in
      CI. `scripts/check-lexicon.mjs` scans `.md` only, so every
      player-facing string (dialogue trees, `MapEvents/content.ts`,
      `act*.content.ts`, `*.copy.ts`) ships un-linted; extend it (or a
      sibling) to the authored `.ts` content surfaces with a
      voice-rule layer (retired terms, thee/thou ban, exclamation
      marks), and wire `scripts/check-naming-law.mjs` into an npm
      script + CI leg. Complements queued Phase 66 (doctrine prose in
      docs). (content/tests; queued 2026-08-22 per THE PIPELINE
      LIBERATION — narrative shipping is authorized, so its guardrail
      should be mechanized) Brief: `plan/phases/phase_70_prose_lint.md`.
      SHIPPED 2026-08-27 (`b06a4449`, issue #247): `check-prose.mjs` over the
      string literals of 14 content surfaces (4 voice rules + the retired-term
      registry), `check-naming-law.mjs --sweep` over 114 shipped names, both
      on npm scripts, a `verify-prose` CI lane, and the pre-commit hook.
      Found and fixed: 12 off-voice exclamation lines in one legacy NPC file;
      1 legitimate retired-term riddle (exempted in place); 1 NL-8 violation
      ("Blank Indenture", grandfathered with an AUDIT row — a rename is an
      authorial call). Also fixed the sweep's own parser, which read only
      single-quoted names and so skipped the 7 card names with apostrophes.
- [x] Phase 71 — Art acquisition pipeline (V4 accelerant, no
      generation). Convert the proven one-off Doré acquisition into a
      loop-runnable path: the phase case for adding `sharp` (dev-only,
      root or mobile scripts), an ingest script encoding the recorded
      recipe (grade → resize <= 640px → WebP + provenance entry, per
      `axiomancer-mobile/docs/asset-conventions.md`), a
      provenance-completeness + registry-vs-directory drift test under
      `assets/`, and ingest of the two `tmp-images/` stragglers.
      Covers acquisition + post-process + ingest for ANY image source;
      generation itself is now ruled (Option A) and lands in Phase 73,
      which reuses these legs. (content/tooling; queued 2026-08-22 per
      THE PIPELINE LIBERATION) Brief:
      `plan/phases/phase_71_art_ingest.md`. SHIPPED 2026-08-27
      (`3ae179b9`, issue #249): `sharp` (dev-only), `ingest-art.mjs`
      encoding the recipe with the provenance write in the same run, and
      `asset-provenance.test.mjs` (completeness + two-way registry drift) in
      the mobile verify gate. The row's premise was stale: 36 stragglers, not
      two, and 35 already shipping from `labyrinth/` with NO provenance —
      the doors as unprocessed PNGs, now 1768K -> 162K WebP with alpha
      intact. BIGGER FINDING, blocked on the owner: no raster directory
      except `maps/` had a license on record — cards, enemies, portraits,
      treasure, combat, doors and walls are all owner-supplied with no
      source captured. Each now records `license: UNRESOLVED` with a note;
      the gate reports the count every run rather than failing.
- [x] Phase 72 — Harness grants for content work. Apply the allowlist
      additions the 2026-08-22 audit specified to
      `.claude/settings.json` (baseline:check/regen, the minigame
      CLIs, critique:drive, catalog/devlog/site builds, npx
      vitest/tsx/playwright/expo, check-lexicon/check-naming-law, the
      root `npm test`, and the PR-delivery verbs `git checkout -b` /
      `git push -u origin` / `gh pr create|view|merge --auto` /
      `gh issue close`) — the remote session that shipped the
      liberation was permission-blocked from editing the settings file
      itself, so this lands from an attended/local session. Also: give
      the `reader` agent tools that exist in CI (its
      `mcp__claude-in-chrome__*` roster is granted nowhere — swap to
      Playwright tools or grant them), and decide whether
      `_claude-skill.yml` should pass the kb-query/axio-query MCP
      servers to CI runs. (contract; queued 2026-08-22 from the
      content-pipelines audit) Brief:
      `plan/phases/phase_72_harness_grants.md`. SHIPPED 2026-08-27
      (`0a3f73f5`, issue #250): allowlist 76 -> 130 entries, the `reader`
      agent moved off its ungranted chrome roster onto Playwright, and
      `check-harness-grants.mjs` wired into `verify-drift` so the rosters
      cannot silently rot again. The MCP question is answered with a reason:
      `axio-query` IS granted to CI (its server is in the repo);
      `kb-query` is NOT (its server lives under the gitignored `kb/` corpus,
      absent from every CI checkout), revisitable only alongside a kb-sync
      step, which is its own cost decision.

- [x] Phase 73 — Art generation pipeline (Option A, adapter-shaped).
      Implements T's 2026-08-22 route ruling
      (`plan/ideas/AI_ART_PIPELINE_OPTIONS.md` §9, Option 1 A-then-B).
      Scope: a `generate(spec) -> image` ADAPTER with the hosted
      gpt-image-2 call as its first implementation (so the future
      ComfyUI/FLUX+LoRA swap touches nothing else); a prompt compiler
      that renders the house style bible + per-subject spec into a
      request; wiring into Phase 71's post-process/ingest legs so a
      generated image lands as graded WebP + registry entry +
      `provenance.json` (generator, model, prompt, date — the Steam
      disclosure record); and a QA pass that reports style drift, the
      measurement that later triggers the B upgrade. Key from `.env`,
      never committed; absent the key the generate leg is inert and
      the rest of the pipeline still runs. Depends on Phase 71.
      (content/tooling; queued 2026-08-22 from T's route ruling)
      Brief: `plan/phases/phase_73_art_generation.md`. SHIPPED 2026-08-27
      (`b31c94a0`, issue #251): versioned style module, deterministic prompt
      compiler, `generate()` adapter with an inert null default, the same
      post-process an acquisition gets, provenance carrying backend/model/
      prompt/style-version/date, and mechanical drift QA (baseline: 127
      assets, 8 categories). 16 tests against an injected fake backend.
      **The hosted call is UNEXERCISED and labelled so in its own header** —
      no key in the checkout, and paid-API spend is not the loop's call. The
      ruling anticipated it: absent the key only the generate leg is inert.
      The banner comes off in the same commit that records a real run.
      Follow-up left open: running it, the vision-assisted pre-screen, and
      `art.manifest.json` / `npm run art:status`.
- [x] Phase 74 — N-1: fold the ratified North Star into spec 34.
      `plan/north-star-mork-borg.md` was ratified as-is by T on
      2026-08-22; its §2 becomes spec 34's §2.5 (the Mörk Borg
      delivery register), and the R-C/R-F reconciliation recorded in
      that file's header (art IS in scope; the Woodcut Codex
      masterplan remains the current art bearings, evolvable by the
      loop) is written into the spec rather than living only in a
      plan/ file. Also update `plan/bearings.md` to cite the ratified
      doctrine. (docs/design; queued 2026-08-22 per the ratification)
      Brief: `plan/phases/phase_74_north_star_ratification.md`.
      SHIPPED 2026-08-27 (`8a073370`, issue #252): spec 34 gains §2.5
      (MB-1..MB-8 verbatim + the R-D pipeline ruling at §2.5.9), Contents/
      §11/§12 updated to match; bearings' Voice entry cites §2.5 and gains a
      THE LONGER LEASH (R-F) entry (quote, surface list, keep-list,
      not-touched list) near PIPELINE LIBERATION/LOCKED MECHANICS;
      story-spec/world-spec/character-spec each gain an unattended-mode
      bullet in "When to break the ritual" — the file is the record, not the
      permission. N-2 (register lint's MB-1 mechanical subset) and N-3
      (Phase 75, the re-voice pass) left as follow-ups, in scope per the row.
      Note: this phase raced with a concurrent local `/loop /march` tick that
      also picked Phase 74; it yielded, deleted its duplicate brief
      (`phase_74_north_star_into_spec.md`), and filed the AUDIT row +
      `ship-a-phase` claim-check fix (`4daf100e`) this tick rebased onto
      cleanly.
- [x] Phase 75 — N-3: the re-voice pass. One phase sweeps all shipped
      player-facing prose into the ratified register (R-E: names stay,
      sentences shorten and harden, one voice). Runs AFTER Phase 67
      (title migration) and after the Phase 70 prose lint exists, so
      the sweep has a machine check behind it and does not re-touch
      strings the title migration is about to change. (content;
      queued 2026-08-22 per the ratification) Brief:
      `plan/phases/phase_75_revoice_pass.md`. SHIPPED 2026-08-27
      (`33df8c91`, issue #253): MB-1's lintable half wired into
      `check-prose.mjs` (20-word ceiling + no semicolons), made FIELD-AWARE so
      it reaches narration and never rules text, and 105 findings swept to
      zero across 9 files (46 long sentences, 59 semicolons). MB-2…MB-7 stay
      judgement rules — applied to the 105 lines this pass rewrote, explicitly
      NOT claimed as swept over prose it did not touch. Follow-up open: a
      judgement pass over the rest.

> **Note (issue-triage 2026-07-19):** issue #132 asked for a
> `devlog-build` GitHub Action; re-triage found it re-classified as
> `enhancement` (was `docs`, stale after the owner corrected the issue
> body same-day) and was about to queue a Phase 38 for it, but
> `.github/workflows/build-devlog.yml` landed on `main` out-of-band in
> the same window (`ci(devlog): add deterministic site build action`,
> `Refs #132`) — `workflow_dispatch`, Node 22 + `npm ci`, `npm run
> site:build`, output validation, artifact upload, guarded commit-back
> to `main`. Matches the issue's acceptance criteria structurally; no
> queued phase needed. Not yet confirmed via a live manual run.

**The Woodcut Codex — full visual redesign (T-directed 2026-08-08, web
session: "keys to the kingdom … full wipe on all the constraints I had
before regarding the direction of the game's design"; master plan:
`plan/phases/phase_V_visual_redesign_masterplan.md` — sub-briefs generate
on pickup):**

- [x] Phase V1 — Iconography canon: one data-driven icon registry
      (`components/icons/` — `<AxmIcon>` + curated game-icons.net
      silhouettes extracted from the owner-provided `Potential Assets/`
      library via `scripts/extract-game-icons.mjs`); `ActionIcon` /
      `EffectGlyph` become thin adapters; kill the verbatim path
      duplicates (tab bar, CombatVictoryPanel, pixel-heart pair); orphan
      components resolved (mobile)
      SHIPPED 2026-08-08 (PR #179): registry (27 marks, per-entry
      attribution), adapters, tab-bar + CombatVictoryPanel dedupe,
      registry test suite. RESIDUE (see Carry-overs): pixel-heart pair
      dedupe and orphan resolution (`BodyDiagram`/`MindMark`/
      `FriendshipMeter`) did NOT ship.
- [-] Phase V2 — The map as an artifact: WILDS map scene redesign —
      parchment-void backdrop (hatch + vignette + torn frame,
      procedural), registry node/kind icons (treasure→chest), compass
      rose, region-accent theming (mobile; after V1)
      PARTIAL via PR #179: chart sheet (hatch + contour hills), compass
      rose, edge vignette, registry node/kind icons (treasure→chest,
      boss→crowned skull; blacksmith + village promoted to first-class
      NodeTypes with anvil/huts marks, tags, colors, tooltips), plus a
      REAL backdrop ahead of schedule — Doré Inferno Plate 1 as
      `assets/images/maps/forest-dark.webp` (provenance-stamped) behind
      a `mapBackdropFor(region)` registry and a `MapCanvas` art slot.
      REMAINING: torn frame, region-accent theming, legend refresh.
- [-] Phase V3 — Menus & chrome: tab bar on the registry with the
      handoff active treatment, ✠-eyebrow header convention audited into
      one shared component, panel-furniture consistency pass across
      SELF/SATCHEL/MEMOIR + modals (mobile; after V1)
      PARTIAL via PR #179: tab bar consumes the registry (5 inline path
      copies deleted) + sulfur active-tick; screen-furniture marks
      landed (anvil/THE ANVIL, huts/SETTLEMENT, tombstone/REMAINS).
      REMAINING: shared ✠-eyebrow header component, panel-furniture
      (TornPanel/rivets/seals) consistency pass.
- [x] Phase V4 — Background acquisition pipeline: scout public-domain
      woodcut/engraving + CC0 texture sources; provenance.json + webp
      budget per the labyrinth/cards convention; deliver per-region map
      backdrops, encounter-screen backgrounds, title candidates (assets)
      HEAD START via PR #179: the acquisition pattern is proven
      end-to-end (Wikimedia Commons → Pillow post-process → webp +
      provenance.json) with one plate delivered (forest-dark).
      SHIPPED 2026-08-28 (`4e93450d`, issue #254): `acquire-art.mjs` reads the
      licence from the Commons API and REFUSES anything not PD/CC0 — the
      operator never asserts terms. Four Doré plates delivered for the regions
      that had none (charon-crossing / the-pit / ludgate-hill /
      wentworth-street), 26MB of source to 524KB, and `maps/` is now the one
      category with no UNRESOLVED licence. Title candidates were NOT delivered:
      the title art is a wordmark problem (the Phase 67 AUDIT row), not a
      backdrop one, and picking a title plate is an owner call.
- [x] Phase V5 — Backgrounds wired: `ScreenBg` keyed art slot with
      dim/vignette; encounter screens + map regions consume V4 art;
      combat arena variety; procedural fallback stays (mobile; after V2+V4)
      HEAD START via PR #179: the WILDS map already consumes its plate
      through `mapBackdropFor` + the `MapCanvas` backdrop prop with the
      dim-never-blur treatment; V5 generalizes this to `ScreenBg`.
      SHIPPED 2026-08-28 (`15ef285f`, issue #255): `assets/images/screens/`
      resolver + an opt-in `art` prop on `ScreenBg`, dim numbers lifted
      verbatim from `MapCanvas` (a test pins opacity <= 0.25 and no blur), a
      vignette as a separate knob, and three screens wired (event, labyrinth,
      combat). Every other screen is byte-identical — screens opt IN. Combat
      arena variety shipped as the SLOT only: there is one arena, and
      acquiring more is V4's pipeline plus a per-plate curation call.
- [-] Phase V6 — Combat & minigame glyph unification: shared subset of
      hazard/gathering/cache/combat glyph kits folds into the registry;
      keyword-mark canon audit (mobile; after V1)
      PARTIAL 2026-08-30: gathering/cache dropped from scope (both retired to
      no glyph kit — see the brief's "What exists, measured"). Hazard/combat's
      one real duplicate (`BoonIcon('chest')`) now renders the registry's
      `action-chest`. The dead V1-era orphan `EffectChip.tsx` (built, tested,
      never wired into the live board) deleted. `glyphShapes.ts` gets its
      first dedicated test plus a keyword-canon audit, which caught and
      removed one stale entry (`BARRIER`, merged into `GUARD` at Phase 29,
      confirmed unreachable). REMAINING: the row's full ask — combat draws
      the same ~7 status concepts three ways (registry SVG / `statusGlyphs.ts`
      emoji / `glyphShapes.ts` card-face SVG) and collapsing them into one
      canonical mark per keyword is a real design call with pinned-test +
      multi-component blast radius, deliberately left to a follow-up brief
      (see `plan/phases/phase_v6_glyph_unification.md` Follow-ups) rather than
      guessed at autonomously.
- [-] Phase V7 — Illustration upgrades: replace remaining procedural
      illustration SVGs with acquired art per `SVG_ASSET_SPEC.md` §5–8;
      PixelEmblem carve-out preserved (assets + mobile; after V4)
      PARTIAL 2026-08-30 (6f731252): surveyed every §5–8 target before
      acquiring anything — `<Splatter>` (§5) is the only one with a live,
      high-frequency production audience (combat victory, level-up, the
      exploration map), so it got real art: four acquired Rorschach-plate
      ink silhouettes (public domain), a new `acquire-art.mjs` "silhouette"
      alpha-matte recipe, rendered via `tintColor`. The event/boss
      illustration family (§6–7) and the body diagram (§8) turned out to be
      dead or near-dead code — reachable only through `app/event/index.tsx`,
      a defensive fallback shell nothing routes to in production, or (body
      diagram) zero call sites at all — so no art was acquired for them;
      REMAINING is V8's keep-or-delete call on that code, plus a 47-plate
      labyrinth room-scene backdrop acquisition, both out of scope for one
      phase tick (see `plan/phases/phase_v7_illustration_upgrades.md`
      Follow-ups).
- [x] Phase V8 — Closure: `/critic-loop` screenshot pass, contrast/a11y
      audit, placeholder teardown, `SVG_ASSET_SPEC.md` reconciled,
      `docs/VISUAL_LANGUAGE.md` (mobile; after V1–V7)
      SHIPPED 2026-08-31 (04fe2f46, b70303bb): deleted the pre-archetype
      placeholder scenes V7 flagged (EncounterIllustration/
      BossIllustration/BodyDiagram — zero live call sites), re-platformed
      `EnemyIllustration` onto the same archetype figure set
      `EnemyPortrait` already used; SVG_ASSET_SPEC.md checklist
      reconciled to ground truth (3 rows closed, 4 stale-unchecked rows
      V1 had already resolved corrected, 2 genuine gaps — GlyphMind,
      NodeMark — documented honestly); one-round `/critic-loop`
      screenshot pass (25 screens) + sub-agent critic review, one
      confirmed contrast fix shipped (cutscene hint text), 5 further
      findings logged to `plan/CRITIQUE.md` Pending; new
      `docs/VISUAL_LANGUAGE.md`. The V-sequence (V1–V8) is complete.
- [x] Phase W1 — The Door (inter-map travel): `travel` MapEventKind +
      handler (unlock + complete + changeContinent + changeMap, old map
      state PRESERVED — the world is a place, not a corridor), a real
      `createStartingWorld()` world catalogue (empty-array no-op
      retired), `GAME_STATE_VERSION` 20→21 + pinned migration, doors
      fishing-village→northern-forest (un-bricks `get-to-forest`) and
      northern-forest→caverns, mobile travel beat + presenter
      (mechanics + mobile; THE OPEN GATE session)
      SHIPPED 2026-08-28 (this session): doors at fv-10 (post-boss
      spine, displacing the barnacle hazard) and nf-10 (the cave
      mouth); departed maps preserved under `WorldState.mapStates`;
      doors repeatable, never consumed (engine dispatcher AND the
      mobile consume mirror both short-circuit); mobile beat is
      detour-less — event slice cleared + arrival toast ("You cross
      into <region>."); brief at
      `plan/phases/phase_travel_inter_map_doors.md`; hermetic e2e both
      sides (travel-kind engine suite, v20→v21 migration suite, mobile
      `travel-door.engine.test.ts`).
- [x] Phase W2 — The Caverns (the northern continent opens): first
      northern map authored end-to-end — ~25 nodes on the column law,
      `nc-` prefix registered, event + enemy pools (existing roster,
      harder mix), mobile layout fixture + parity, backdrop plate
      (mechanics + mobile; after W1)
      SHIPPED 2026-08-28 (this session, with W1): 25 nodes / 10
      columns (SEAM/GALLERY/SUMP lanes), The Delver NPC stages the
      previously-dangling `gather-iron` quest, terminal boss The
      Under-Gate (rawhead-rex @ L6), full per-node event pools incl. a
      village-with-shop, backdrop resolves to the-pit via the existing
      cavern regex; sealed stair toward `northern-city` is scenery
      (nc-16 cutscene) awaiting W3.
- [x] Phase W3 — Northern City: map 2 of the northern continent per the
      `map.library.ts` narrative seam (build a boat, meet the city);
      new enemies with unique portraits via the licensed trove /
      generation pipeline (`/forge`; after W2)
      SHIPPED 2026-08-28 (branch claude/w3-northern-city): the caverns'
      sealed seam became a real door — nc-26 (new column past the
      Under-Gate boss, the fv-10 post-climax pattern) travels to
      THE NORTHERN CITY: 25 nodes / 10 columns (WALL / HIGH STREET /
      HARBOR lanes + the drowned-slip hang-off), urban kind spread
      (3 INN rests, 2 shops — the Iron Market + the Chandlery, 2 staged
      NPCs — the Gate-Clerk + the Shipwright, the advisor-rumor
      narration dilemma = the campaign seam, 2 gatherings = the
      build-boat materials), sealed river-gate scenery at ncy-23
      awaiting W4, boss The Harbormaster pinned L9 (fv-6=3 → nc-25=6 →
      ncy-25=9 ladder). `get-to-northern-city` authored (Delver grant,
      reach ncy-1). NO migration hop needed — v21 saves reach the city
      via unlockMap's registered-destination admit; regression pinned.
      W5 PARTIALLY DRAINED in the same phase: 9 new enemies (seam-tick,
      prop-wight, unpaid-delver, sump-maren / toll-sergeant,
      guild-knife, the-factor, wharf-shrike, the-harbormaster), each
      with deck (shared canon), aftermath prose, and a UNIQUE
      game-icons.net silhouette portrait (CC BY 3.0, truthful
      provenance — lorc + delapouite); roster pins 52→61, threat ids
      56→65, boss/unique stakes 18→19. Mobile: northern-city layout
      fixture + parity, caverns layout re-spaced for the door column,
      backdrop resolves to LUDGATE_HILL via the existing /city/ regex
      (no new mapping line needed). Design residue filed to
      plan/AUDIT.md ([loop-call] Phase W3 row).
- [x] Phase W4 — The Connecting River + Town Across the River: maps
      3–4 of the northern continent; the advisor-selection ritual beat
      (shipped `b8546a59`/`41272f9f`, 2026-08-31). Two new maps on the
      northern continent, SMALLER than the W1–W3 25-node precedent (a
      documented scope-down): connecting-river (7 columns / 13 nodes)
      and town-across-river (4 columns / 6 nodes, the coda location —
      "Home of sweetheart" per map.library.ts). northern-city's
      Harbormaster is no longer terminal: `ncy-26`, one column past
      him, is the real door (the nc-26 pattern); `ncy-23` stays sealed
      scenery. connecting-river's Waterreeve boss gates a second door
      (`cr-13`) onto town-across-river, whose Portreeve boss stays
      terminal (no W5+ map yet). The advisor-selection ritual ships as
      two narration nodes (`cr-9`, `tar-4`) reading back the S-01
      "crowning ceremony" flags (northern-forest) and the `ncy-5`
      "advisor rumor" flags — the payoff those nodes' own comments
      flagged as this phase's job. Two new NPCs (The Boatwoman, The
      Sweetheart); the previously-dangling `ConnectingRiverQuests`
      union authored (find-islanders, join-islanders-for-ritual,
      get-to-town-across-river) plus `get-to-connecting-river` on the
      Gate-Clerk. Seven new enemies, two bosses (the Waterreeve, the
      Portreeve) — see the W5 row below. Mobile: two layout fixtures +
      northern-city's gains the door column; both new region strings
      free-ride existing backdrop plates (no new art needed). Decision
      to ship via `/ship-a-phase` rather than literally dispatching to
      `/forge` despite the row's tag, documented in
      `plan/phases/phase_W4_connecting_river.md`.
- [-] Phase W5 — New blood: per-map enemy roster growth so no two maps
      share >70% of a pool; every new enemy through the ~10-edit
      checklist with unique portrait + provenance (`/forge`; after W2,
      parallel to W3/W4)
      PARTIALLY DRAINED by W3 (2026-08-28): 9 northern enemies shipped
      through the full checklist (see the W3 row). northern-city meets
      the <70% bar (3/8 vs any sibling); caverns∩northern-forest still
      sits at 10/14.
      FURTHER DRAINED by W4 (2026-08-31): 7 more enemies (Reed Ambusher,
      Toll-Skiff, Weir-Widow, the Waterreeve, Dowry Collector, the Kept
      Suitor, the Portreeve) through the full checklist — connecting-river
      and town-across-river are BRAND-NEW pools with zero overlap against
      every sibling map. The remaining drain is coastal/forest pool
      differentiation (caverns∩northern-forest still at 10/14).
- [x] Phase G1 — `.claude/**` OPEN GATE doc sync: lifted the superseded
      wall text in `.claude/commands/{deck-tuning,combat-playtest,
      world-tuning,hazard-tuning}.md`, added the `/forge` doorway
      pointer. The classifier block from the 2026-08-28 AUDIT row did
      not reproduce this tick — `Edit()` on `.claude/commands/*.md`
      succeeded directly — `docs(.claude): lift superseded OPEN GATE wall text from tuning commands — phase G1`
- [x] Phase 77 — In-house crash capture (mobile): global
      `ErrorUtils.setGlobalHandler` (native) / `window.onerror` (web)
      feeding the existing `error` log domain + `flushLogTail()`; an
      unhandled-promise-rejection hook, same sink; a next-launch check
      of the persisted crash tail offering "previous session crashed —
      view/copy report", reusing `ErrorBoundary`'s report rendering
      (not the dev-only diagnostics panel). No third-party SDK. Per the
      2026-07-20 owner ruling, promoted via `/oversight` 2026-09-02 —
      see `plan/PHASE_CANDIDATES.md` § Promoted for full scope/rationale.
      Shipped `6249b19b` — `CrashReportPanel` extracted from
      `ErrorBoundary` so `PrevSessionCrashPrompt` reuses the live-crash
      report chrome; Hermes promise-rejection tracker installs
      production-only (dev keeps RN core's own LogBox tracker).
- [x] Phase 78 — Art-pass: open-source art sourcing research for W5
      portraits. Agent researches the open web for CC/open-source art
      fitting each remaining W5 enemy's theme, gathers >=2 candidates
      from a few different sources with license/provenance recorded per
      candidate, files the findings as a `[loop-call]`-style row in
      `plan/AUDIT.md`. RESEARCH-AND-PRESENT only — no art wired or
      committed as the standing source until T picks one at the next
      `/oversight`; the pick then stands as the art source until Phase
      73's in-house generation pipeline is ready. Direct T instruction
      via `/oversight` 2026-09-02 — see `plan/PHASE_CANDIDATES.md` §
      Promoted for full scope.
      Shipped `67be65e0` — 9 enemies x >=2 candidates each (game-icons.net
      alt icons, Wikimedia Commons public-domain art, OpenGameArt.org,
      OpenClipArt), all URLs WebFetch-verified live, filed in
      `plan/AUDIT.md` awaiting the `/oversight` pick.
- [x] Phase W6 — The Capital: map 5 of the northern continent, the
      ribbon-roads' destination (`/forge`, 2026-09-10; the map-sequence
      continues here rather than at "W5" because that number was
      already claimed by the enemy-roster-growth phase above — see the
      `[loop-call]` row in `plan/AUDIT.md` for the naming note).
      SHIPPED `f56fa198`: town-across-river's own code comment ("no
      door onward yet") was the sharpest thinness signal from the
      Step 1 growth audit across the three `/forge`-owned surfaces
      (maps/events/art) — a boss-terminated map with an explicitly
      flagged missing exit. tar-6 (the Portreeve) is no longer
      terminal: tar-7, one column past the boss (the nc-26/ncy-26/
      cr-13 pattern), opens onto THE CAPITAL — 9 nodes / 6 columns,
      full MapEvent kind coverage (cutscene/interaction/hazard/rest/
      gathering/village/loot-cache/narration/encounter, all kinds
      already shipped elsewhere, none new). Narrative payoff: cap-8's
      court-convenes narration reads back tar-4's
      `sweetheart-was-nominated` flag, the third and final beat of the
      advisor-selection thread planted at ncy-5/cr-9/tar-4 — the
      river-court's own "he goes to the capital in the spring boat"
      line made concrete. No new enemies authored (`/forge`'s map/
      event/art lane, not `adjust-enemies`'s per-item lane): the
      `the-capital` `EnemiesByMap` pool reuses northern-city's roster
      (TollSergeant, GuildKnife, WharfShrike) plus two forest
      re-treads (CursedPaladin, VampireThrall) — the northern-city
      precedent for reuse over invention — and The Factor (already a
      northern-city normal enemy) is reused as the boss at an elevated
      payload level, the RawheadRex-in-caverns precedent. No new
      MapEventKind, no new persisted field — `GAME_STATE_VERSION`
      untouched, no migration needed. Mobile: new
      `the-capital.layout.ts`, `layout-engine-parity` MAPS list
      updated, the other four northern-continent layouts' "Map N of
      iv" ordinals bumped to "of v", a `travel-door.engine.test.ts`
      case pins the tar-7 crossing. Gates green: mechanics (212 test
      files / 3414 tests + build), mobile (260 suites / 2646 tests),
      card-editor type-check (precautionary). KB research: `kb-query`
      queried (kb_overview, kb_search for capital/court/advisor/
      nomination themes) before writing — no matches, the corpus is
      board-game mechanics/reception plus card corpora, not narrative/
      map-design prior art; grounding came from the "read the specs"
      leg instead (the in-repo canon already planted at
      `map.library.ts`'s doc comment and the cr-9/tar-4 flags). No
      further door shipped — the-capital is the new frontier, the same
      shape town-across-river had before this phase; a future
      `/forge` tick continues the chain.

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

(Add `[-]` rows for partial-but-shipped phases with linked notes here.)

- [-] **V1 residue (filed 2026-08-08, post-#179 merge):** the
  pixel-heart emblem pair still coexists
  (`components/aftermath/PixelHeartEmblem.tsx` vs
  `components/event/aftermath/PixelEmblem.tsx` — near-duplicates; keep
  the PixelEmblem carve-out, collapse to one), and the three orphaned
  components (`BodyDiagram`, `MindMark`, `FriendshipMeter` — zero
  non-test importers) are still undecided (delete, or wire via a V3/V6
  surface). Small, bounded; fold into the next V-phase pickup rather
  than a bespoke tick.
- [-] **V2/V3 remainders:** listed inline on their `[-]` rows above —
  torn frame, region-accent theming, legend refresh (V2); shared
  ✠-eyebrow header component, panel-furniture pass (V3).

## Queue change log

> Append-only. Records provenance whenever T, via Hermes,
> directs a mutation of this file's queue (add / remove /
> reorder / reprioritize / split / merge / skip / block / unblock
> / material scope change to a phase row). Filed via `/oversight`
> 2026-07-30 (issue #129) — forward-looking only; existing queue
> history above is NOT reconstructed into this log. The entry
> must land in the SAME commit as the queue mutation it records.
> Format per row: date, actor, action + affected phase ID(s),
> confirmation this was T's request, T's stated reason (or
> "reason not stated" — never invent one), and the resulting
> commit/issue/phase-brief when available.

- **2026-09-17** — actor: **T via `/oversight`** (attended session,
  branch `claude/oversight-kqgvvc`). Action: ADD seven phase rows —
  Phases 89, 90, 91, 92, 93 (promoted from `PHASE_CANDIDATES.md`) and
  Phases 94, 95 (promoted from `plan/AUDIT.md` loop-call rows already
  decided at `/oversight` 2026-09-15 but unshipped). Confirmed T's
  request: yes — T answered the `AskUserQuestion` ballot "The build plan
  has zero pending phases" with "Promote top 5 candidates now", and "Two
  decisions from the 2026-09-15 oversight were routed to /iterate and
  never shipped" with "Promote both to phase rows". T's stated reason:
  reason not stated beyond the ballot options as written — the queue was
  empty so `/march` could never reach `/ship-a-phase`, and `/iterate`'s
  score queue had not reached the 2026-09-15 rulings in 12 commits, so
  the phase lane owns them instead. Resulting commit: this one.

- **2026-08-08** — actor: **T via `/oversight`** (attended web session,
  not Hermes). Action: **added Phase 39** (post-D8 flag-on curve repair +
  library theme-symmetry restoration, merged from three standing
  candidates) and **Phase 40** (card-text grammar + full copy pass,
  ruled 2026-07-18 but never queued), and recorded Phase 40 as dependent
  on Phase 39. Confirmed T's request: yes — both promotions were chosen
  by T from an `/oversight` questionnaire ("Promote curve-repair +
  theme-symmetry together"; "Card-text grammar + full copy pass" among
  the unlocked gated candidates). T's stated reason: the build-plan queue
  had fully drained at Phase 38, leaving `/march` nothing but 2.x-score
  hygiene rows to pick while the flag-on balance curve had read mid 0.0%
  / late 0% for six consecutive nightly baselines with no phase assigned
  to it. Resulting commit: this one; briefs still to generate.
- **2026-08-08** — actor: **T via `/oversight`** (attended web session,
  same session as the row above, second batch). Action: **added Phases
  41-51** (constraint demolition, new organising fiction, objective
  function v2, retheme execution, re-home dice upgrades, early-game
  rethink, Expo decouple, `Closes #N` root-cause, GLYPHS follow-ups
  1-3), and **resequenced Phases 39 and 40** behind them (scope
  preserved; 39 additionally annotated as rescoped because its target
  band and its lever set both changed). Confirmed T's request: yes —
  T gave the instruction directly and then, when asked-adjacent work was
  listed back, replied "make phases for everything you mentioned". T's
  stated reason, near-verbatim: *"remove constraints across the entire
  application. Normal damage is allowed, deck tuning is allowed to change
  anything about a card, no more philosophy based theme. I want to give
  you full freedom to take this deckbuilder in any direction."* Note this
  mutation VOIDS previously-locked doctrine (spec 32 no-strike,
  status-dominance balance, philosophy theming, the Expo "not now") under
  the source-of-truth hierarchy; see `plan/bearings.md` § "THE
  UNSHACKLING". Resulting commit: this one; briefs still to generate.
- **2026-08-08** — actor: **T via `/oversight`** (attended web session,
  third batch). Action: **ratified the replacement fiction** — "Dark
  Fantasy deckbuilding RPG campaign", whole product — which collapsed
  **Phase 42** from a three-proposal ballot into authoring a single
  bible; and **decomposed Phases 44, 45, 46 and 47** into **44a-44i,
  45a-45b, 46a-46c and 47a-47e** (23 rows where there were 4). Confirmed
  T's request: yes — T named the direction and the whole-product scope
  unprompted, then said *"I want you to decompose everything you
  mentioned above into phases if you haven't already."* T's stated
  reason, near-verbatim: *"It's looser, not that different from what we
  already have, and should be an easy pivot while opening up A LOT of
  doors for us."* Resulting commit: this one; briefs still to generate.
- **2026-08-08** — actor: **T via `/oversight`** (attended web session,
  fourth batch). Action: **carved three systems out of the unshackling**
  and wrote the guard into Phases 41, 42, 43, 44b and 39 (no rows added,
  removed or reordered — this narrows the scope of existing rows).
  Confirmed T's request: yes, unprompted and verbatim: *"the Conviction,
  Surge meter, and Dice mechanics system, those are LOCKED into place and
  will need to stay. Cards can effect them, but agents should not remove
  the mechanics."* T's stated reason: not stated beyond "LOCKED into
  place and will need to stay". Effect: the unshackling's "full freedom"
  no longer extends to removing/replacing/no-op'ing Conviction, the Surge
  meter or the Dice system; those decisions are explicitly excluded from
  the standing big-decisions authority and must surface as
  `[needs-user-call]`. See `plan/bearings.md` § "LOCKED MECHANICS".
  Resulting commit: this one.
- **2026-08-08** — actor: **T via attended web session** (Claude Code on
  the web, branch `claude/game-visual-redesign-5v21po`). Action: **added
  the V-sequence** (Phases V1–V8, the Woodcut Codex full visual
  redesign). Confirmed T's request: yes — verbatim: *"I am giving you
  complete freedom to take the game in any visual theme. I am currently
  trying to do a full wipe on all the constraints I had before regarding
  the direction of the game's design"*, with explicit instructions to
  plan the phases into the loop, replace the app's scattered SVGs with
  the provided icon/glyph directory, and add acquired background
  imagery; map first, then menus. T's stated reason: full game visual
  redesign toward a "finished" visual design. Resulting artifacts:
  master plan `plan/phases/phase_V_visual_redesign_masterplan.md`; V1
  (map + menus slice) implemented in the same session/PR that lands this
  row.
- **2026-08-08** — actor: **T direct** (attended chat session, this
  worktree — not `/oversight`, not Hermes). Action: **added Phases
  52a-52f** (the rest-choice epic: deck-removal primitive, first-class
  inn, rest-choice engine, mobile screen, Night Watch retirement,
  shilling-economy calibration); **marked Phases 45a and 45b
  `[skipped]`** as superseded by them; and **amended Phase 44f's row**
  to drop The Night Watch from its four-minigame rename list while
  keeping the surviving rest node in scope for naming. Confirmed T's
  request: yes — T gave the instruction directly and verbatim: *"I want
  you to plan and add phases to remove the Rest mini-game and replace it
  with a choice for the players: 1) Rest (heal 20% of the player's
  health) 2) Use the blacksmith (upgrade a die for a high price of
  whatever currency name we have, I forget) 3) Remove a card from the
  player's deck (Low price to start, but every time the player does this
  across the game, it costs a little more). Once the player chooses an
  option, the rest is done/completed/locked."* T's stated reason: not
  stated beyond the instruction itself. Four follow-up rulings were
  collected in the same session and are recorded in the 52a-52f block:
  full retirement of the Night Watch (chosen over park-behind-a-flag and
  keep-as-a-rare-node), flat 20% heal with inns exempt, prices proposed
  now and calibrated in a dedicated later phase, and the collapse of
  45a/45b into this epic. Note this ruling **answers 45a's open design
  question** (where dice upgrades live — the rest site) and **resolves
  the standing `[needs-user-call]` at
  `axiomancer-mechanics/src/World/MapEvents/types.ts:141-146`**
  (blacksmith map placement and cadence), both open since 2026-07-18.
  Resulting commit: this one; six briefs generated under
  `plan/phases/phase_52*.md`.
- **2026-08-09** — actor: **T direct** (attended web session, not Hermes).
  Action: **added Phases 53a-53e** (narrative encounters — reachability
  guard, dialogue gate context, placement + coverage floor, S-01's four
  dilemmas, the read-back web), inserted as an ordered batch between the
  52* block and 46a. No existing row was reordered, rescoped or
  renumbered. Confirmed T's request: yes — T's instruction, verbatim:
  *"file both audit rows, then add phases in order to make sure
  'narrative' encounters work. Author content using the skills
  available."* T's stated reason: not stated beyond the instruction
  itself; the batch follows a first-map audit T commissioned the day
  before, whose residue this drains. Scope was derived rather than
  dictated — the six findings behind these rows come from a fresh audit
  run in the same session
  (`axiomancer-mechanics/docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md`), and
  the two critical ones are that no NPC conversation in the game is
  reachable by legal play and that the first map's premise quest has no
  giver. Deliberately NOT promoted in the same pass: inter-map travel
  (already a phase candidate from the first-map audit) and any retheme of
  existing dialogue prose (Phase 44g owns it by name). Two content calls
  were made at planning time rather than left blocking, both reversible
  and both recorded in the specs they touch: S-01's node-reslotting and
  `moralDelta` questions. Resulting commit: this one; briefs generated
  under `plan/phases/phase_53*.md`; design record
  `specs/story/S-02-fishing-village-voices.md`.

- **2026-08-10** — actor: **T via `/oversight`** (attended session).
  Action: **added Phase 54** (route live combat through `endCombat`),
  resolving the standing `[needs-user-call]` at `plan/AUDIT.md`'s "live
  combat exit path bypasses the engine's end-of-combat reducer entirely"
  row (first-map audit 2026-08-08, finding F3); and **amended Phase 40's
  row** to flag scope overlap with open PR #193 ("strip the prose off
  the card face"), instructing it be re-scoped against whatever #193
  ships before its brief is generated. Confirmed T's request: yes — T
  selected "Route through endCombat (Recommended)" for the first and
  "Note re-scope-after-#193 in Phase 40's row (Recommended)" for the
  second when asked directly. T's stated reason: not stated beyond the
  selections themselves. Resulting commit: this one.

- **2026-08-15** — actor: **T via `/oversight`** (attended web session,
  not Hermes). Action: **lifted the AUDIT-DRAIN MODE banner** (a
  queue-wide unblock — every `[ ]` row returns to normal
  `ship-a-phase` dispatch), and **added Phase 56** (land the D7 reroll
  sink via both mechanisms, then re-run the flag-on matrix) and **Phase
  57** (stop publishing the private DevLog — the in-repo half of the
  Cloudflare Pages scope-down). Confirmed T's request: yes — all three
  were T's own selections from an `/oversight` questionnaire ("Lift the
  banner"; "Both — grant and promote"; "Queue the in-repo half now").
  T's stated reason: not stated beyond the selections themselves; the
  evidence each selection was made against is recorded in the banner's
  own replacement text and in the two new phase rows (respectively: the
  banner was bypassed by Phases 52c/52d/52e while closing one AUDIT row
  in three days; the post-D8 nightlies show the dice valves under-sink,
  which is the exact revisit condition Phase D8's row wrote for itself;
  and the private DevLog has been live unauthenticated on the production
  domain since at least 2026-08-12 with a 2026-08-10 ruling nobody could
  execute). **Correction recorded against this pass:** the questionnaire
  put the D7 sink to T as an open `[needs-user-call]`, which it was not —
  `plan/PHASE_CANDIDATES.md`'s row had been resolved via `/oversight`
  2026-07-18 (valves-only, no starter grant) and sits in that file's
  `## Promoted` section; the sweep matched residual "needs-user-call"
  wording inside the resolved row's own decision line. T's 2026-08-15
  answer is therefore a **supersede** of the 2026-07-18 call, not the
  draining of an open one, and Phase 56's row states it that way. The
  supersede is well-founded on D8's own revisit clause, so the phase
  stands as queued. Not mutated in the same pass: the product-name
  `[needs-user-call]` (genuinely open), which T left open pending a
  second candidate pass. Resulting commit: this one; briefs for 56 and
  57 still to generate.

- **2026-08-15** — actor: **T via attended web session** (design
  conversation, not Hermes, and not `/oversight` — T asked directly).
  Action: **added Phases 58-65**, the encounter reshape. Confirmed T's
  request: yes — T opened with *"I want to make sure that every encounter
  has a narration with it so the player has some flavor in terms of
  what's happening"*, then defined three events verbatim (**Rest:**
  *"Heal 25% health or remove a card. One liner narration."*; **Loot
  cache:** *"Card reward, item reward, or sacrifice reward... noted on
  their journal as 'Helped <current map> n times'... discounts at the
  shop, an ally card reward, and other various rewards"*; **Quest:**
  *"let's just remove it entirely"*, narrowed on question to *"Minigame
  only and keep it"*), ruled the ally-card chain in scope ("everything
  including Ally"), and closed with *"queue all of these up"* against the
  eight-row table these rows are written from. T's stated reason,
  near-verbatim: the minigames *"are just time consuming and seem to add
  nothing"* (T's 2026-08-10 framing on the standing fold candidate, which
  this batch partially executes). **Two items recorded as inference, not
  instruction, so a later reader can correct them:** (1) Phase 60's
  anvil **re-home** is read from T selecting a table in which it was the
  listed option, after being asked re-home vs. retire — the reversible
  reading, and the row says so; (2) Phase 59 keeps Phase 52a's escalating
  card-removal price, since T said "remove a card" without ruling on
  cost. **Not swept in by implication:** the Gathering minigame, which
  the fold candidate names for retirement but T did not rule on here —
  it stays a live surface and an open candidate. Resulting commit: this
  one; briefs for 58-65 still to generate.

- **2026-08-20** — actor: **T via attended web session** (`/oversight`,
  not Hermes). Action: **added Phase 66** (lexicon lint — catch
  retired-doctrine prose, not just retired identifiers), promoted from
  `plan/PHASE_CANDIDATES.md`'s sole pending candidate (score 7.5,
  proposed 2026-08-15 by expand pass 8, unpromoted since). Confirmed T's
  request: yes — T's answer to this oversight's candidate-promotion
  question was "Promote." T's stated reason: not stated beyond the
  selection; the candidate's own rationale (three independent incidents
  of retired-doctrine prose surviving a rename pass in one week) is the
  evidence it was promoted against. Resulting commit: this one; brief
  for 66 still to generate.

- **2026-08-20** — actor: **T via attended web session** (`/oversight`,
  not Hermes). Action: **added Phase 67** (title migration, "Axiomancer"
  → "Miserere Mei, Deus"). Confirmed T's request: yes — T ruled the
  naming session directly mid-`/oversight` conversation, decided alongside
  setting *Mörk Borg* as the game's new tonal North Star (art/narration/
  encounters; mechanics unchanged) — see `new-north-star.prompt.md`. T's
  stated reason: "Miserere Mei, Deus" sounds good, chosen directly rather
  than from either naming-session pass; T explicitly scoped this
  `/oversight` tick to the name only, deferring the wider pivot to a
  future brainstorm session. Resulting commit: this one, plus
  `plan/AUDIT.md`'s product-name row (`[x]` resolved),
  `plan/naming-session-2026-08-12.md` §6 (closed), `plan/bearings.md`'s
  name line, and `new-north-star.prompt.md`; brief for 67 still to
  generate.

- **2026-08-22** — actor: **T via remote Claude Code session** (the
  content-pipelines-audit session, PR #228 — not Hermes). Action:
  **added Phases 68-72** (keyword-drift hardening; card-editor
  round-trip fidelity; `.ts` prose lint + naming law in CI; art
  acquisition pipeline; harness grants for content work). Confirmed
  T's request: yes — T reviewed the content-pipelines audit and
  directed *"what do you need from me to free up ALL these pipelines?
  Try to do it yourself first, then get back to me"*; the same
  directive is recorded as THE PIPELINE LIBERATION in
  `plan/bearings.md`. T's stated reason: ensure the nexus loop has
  the freedoms and capabilities every content pipeline needs. The
  doc/doctrine unblocks shipped in the same PR; these five phases
  carry the engineering remainder. Resulting commit: this one
  (branch `claude/content-pipelines-audit-43v3d7`, PR #228).

- **2026-08-22** — actor: **T via remote Claude Code session** (the
  content-pipelines walkthrough, PR #228 — not Hermes). Action:
  **added Phases 73-75** (art generation pipeline; N-1 fold the North
  Star into spec 34; N-3 re-voice pass) and **rescoped Phase 71**
  (acquisition legs now feed generation too). Confirmed T's request:
  yes — T answered a four-question `AskUserQuestion` walkthrough,
  picking art route "A-then-B" and "Ratify as-is" for the North Star.
  T's stated reason: not separately stated beyond the option choices;
  the walkthrough was T's response to the audit's open owner calls.
  Resulting commit: this one (branch
  `claude/content-pipelines-audit-43v3d7`, PR #228).

- **2026-08-22** — actor: **T via remote Claude Code session** (the
  minigame-retirement walkthrough — not Hermes). Action: **added Phase
  76** (retire The Gleaning, keep the gathering map node) and
  **reprioritized Phase 61 + Phase 76 to the front of the queue**, ahead
  of Phase 58. Confirmed T's request: yes — T opened with *"I've been
  trying to retire the quest, gathering, and rest minigames. Rest is
  retired but the other 2 are not,"* answered the priority question with
  "retire quest + gathering next", and delegated the retirement's shape
  to the loop (*"You decide everything"*). T's stated reason: the
  minigames "are just time consuming and seem to add nothing"
  (2026-08-10 candidate, restated by this session's framing). Resulting
  commit: this one (branch `claude/content-pipelines-audit-43v3d7`,
  PR #228).

- **2026-08-28** — actor: **T direct** (attended local session — THE
  OPEN GATE, see `plan/bearings.md`). Action: **added Phases W1–W5**
  (inter-map travel; the caverns; northern city; connecting river +
  town across the river; per-map enemy roster growth) **and Phase G1**
  (`.claude/**` doc sync), and **wired the new `/forge` content-foundry
  verb into `/march` step 3b**. Confirmed T's request: yes — verbatim:
  *"setup the pipeline in order to allow for the nexus loop to create
  new enemies, new cards, new everything ... Furthermore, NEW
  CONTINENTS, NEW MAPS!. Why do I still only see the first
  continent?"* T's stated reason: content growth has been requested
  repeatedly and the world still shows one reachable continent.
  Resulting commit: this one (W1+W2 implemented in the same session).

- **2026-09-02** — actor: **T via `/oversight`** (Claude Code on the
  web, branch `claude/oversight-yz12cc`). Action: **added Phase 77**
  (in-house crash capture, promoted from the `[score 8.5]` candidate
  filed by `/expand` pass 10) and **added Phase 78** (art-pass:
  open-source art sourcing research for W5 portraits, a fresh row with
  no prior candidate). Confirmed T's request: yes — Phase 77 via the
  questionnaire's "Promote top candidate" answer; Phase 78 via T's own
  instruction during the W3 loop-call walkthrough, near-verbatim:
  *"create an 'art-pass' phase where an agent researches online for
  some open source art that fits the theme. Gather two candidates from
  a few sources, and then present them during the next oversight. Once
  I decide, that'll be our new art source until we end up generating
  our own."* T's stated reason: Phase 77 closes a six-week-old
  unpromoted owner ruling that two independent [HIGH] user crash
  reports have since made urgent; Phase 78 replaces ad hoc per-enemy
  art sourcing (the W3/W5 silhouette call) with a standing
  research-and-present process. Resulting commit: this one; briefs
  generate on demand per the Status block scope lines.

- **2026-09-15** — actor: **T via `/oversight`** (Claude Code, branch
  `claude/oversight-didrne`). Action: **added Phases 79–88** — 9 promoted
  from `plan/PHASE_CANDIDATES.md`'s 11 scored Pending rows (doctrine
  lexicon 79, naming pass 80, late-campaign difficulty cliff 81, glossary
  reachability 82, combat arena backdrop 83 absorbing its [score 4.5]
  duplicate, The Capital design session 84, equipment progression 85,
  engine hook sweep 86, early-game encounter smoothing 87) plus **Phase
  88** (W5 art adoption, a direct instruction closing `plan/AUDIT.md`'s
  W5 art-pass loop-call, same shape as Phase 77/78). One scored candidate
  ([score 6.5] lexicon preset-ids) was found stale (its evidence was
  fixed today by an unrelated commit) and closed rather than promoted.
  Confirmed T's request: yes — T's stated reason for the batch: the
  build-plan queue had fully drained (0 pending phases) while
  `PHASE_CANDIDATES.md` carried 11 live scored rows sitting unpromoted;
  T asked for "top 30" and, on learning only 11 scored/live rows existed
  (the rest being unscored 2026-07/08-era bookkeeping debt), said
  "promote 9 + also flag the ~49 legacy rows" — the flag is filed at the
  top of `PHASE_CANDIDATES.md`'s Pending section, recommending a
  `/consolidate` cleanup pass. Three embedded sub-choices the source rows
  themselves called out as needing an `/oversight` pick were also ruled
  this session: Phase 81 verifies against current baseline before
  picking a design option (deferred, not guessed); Phase 84 ruled a
  `/world-spec`/`/story-spec` session over a mechanical map-6 bolt-on;
  Phase 85 ruled designing new signature skills over breaking the 1:1
  relic-identity rule. Also this session: ratified `plan/AUDIT.md`'s open
  `[loop-call]`/`[needs-user-call]` rows (UI fresh-eyes 6 decisions
  accepted per the report's own recommendations, `critique:drive`
  wipe-scope fix, keyword Chaos/Upgrade proposal authorized, baseline
  watch-path narrowing, Northern-Continent NPC sparseness routed to an
  attended `character-spec`/`story-spec` session) and widened the 5
  content stewards' audit criteria in `skills/adjust-{cards,enemies,
  equipment,keywords,npcs}.md` per the "zero-diff at pass 9-10" plateau
  flag. Resulting commit: this one; briefs generate on demand per the
  Status block scope lines.

## Phase log (commit hashes)

- phase 0 — (adoption commit) — nexus methodology adopted
- phase 1 — 0af106ff — combat test-coverage backfill (sig-overwhelming-argument funded-path victory witness)
- phase 5 — 98e7b2bc — village SELL tab (sellVillageItem action + presenter sellables/hasShop)
- phase 6 — 48d2c802 — memoir REMAINS section (death tally via hazardDeathCount + merged Rest/LootCache keepsake read-back)
- phase 4 — d9763659 — balance-sim population witnesses (execute finisher + escalation clock; Conclusion/BODY-sig already had coverage)
- phase 9 — 7ea06a6e / 6fa7f090 — character/story/world specs (C-01 the Sophist, W-01 the Aporia, S-01 fishing-village dilemmas; already shipped pre-tracking, recorded this tick)
- phase 13 — (port pre-tracking; mechanics `src/World/Hazard/` + `audit/` parity harness, mobile `state/hazard/store-actions.ts` consumer) — hazard v2 engine port verified already landed, mobile duplicate deleted, content parity confirmed; recorded this tick
- phase 25 — f7868e2a — /consolidate janitor mandate (terminology-sweep step + AUDIT finding) + `verify-mechanics.yml` stale `src/Skills/` impact-path fix; Part A harness re-apply verified already present at HEAD, no re-derivation needed
- phase D1 — 4adf7266 — spec 33 review landed (PASS-WITH-EDITS; die-gear expansion, STAKE retired, momentum null-reset, pool-law binding rule; supersession banners on HANDOFF-2026-07-09 + phase 31; 33c/33d re-scoped; Fate Engine P2 re-scoped, P3 retired)
- phase D2 — 18cf5e3b — Upgradeable-Dice engine core behind flag (four-die roll law + die-gear interface, stance-from-cards + open stance checks, null-reset momentum + until-spent surge, honest 1◆ Press Fate, 7-object ceiling overflow→+1◆, OVERHEAT crack primitive; draft/STAKE/read/variety-refresh retired in-flag; 24 hermetic tests, flag-off byte-identical, mobile re-verified)
