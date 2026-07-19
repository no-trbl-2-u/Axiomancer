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

- [ ] Phase D-FLIP — Upgradeable-Dice flag ON by default. OWNER-DIRECTED
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
- [ ] Phase D9 — Authored stance-check variety (salvage PR #109).
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

- [ ] Phase 33c — THE COVETED DIE. RE-SCOPED at D1 (2026-07-17, spec 33):
      the rationale (lootable enemy telegraphs; deny/block verbs earn a
      payday) survives and strengthens under open stance checks, but its
      read-era details are dead — steal conditions become STAGGER-to-0 /
      full block / answering the phase's stance check; payout becomes a
      temp gold die (spec 33 §1 ceiling applies, overflow → +1◆; the old
      "floating die of that color, cap 3" is retired). Deps: D2 + D7.
- [ ] Phase 33d — GLYPHS pilot (Option-B grammar experiment). FREE-charge
      is compatible with spec 33 §3 rule 5 (FREE lines never touch momentum).
      Author pilot cards against the ratified four-die model. Deps: 33a +
      D4 + D7.

**Legacy-combat cleanup (owner-directed 2026-07-18, chat — ships on its own
branch, parallel to the D-sequence; does NOT preempt the D-sequence march
order):**

- [ ] Phase 37 — Retire the fallacy/paradox card category + the dead
      `combatResources` token pool. The `Card.category` field
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

**Loop infra (promoted via issue-triage 2026-07-19, T-corrected — issue
#132 originally read as a digest-entry ask; the body was edited same-day
to clarify it's the build Action itself):**

- [ ] Phase 38 — `devlog-build` GitHub Action (manual dispatch, no Claude
      skill involved). New workflow (sibling to `.github/workflows/night.yml`
      but plain `npm`, not `_claude-skill.yml`): `workflow_dispatch` trigger
      only; Node 22 setup + `npm ci`; run `npm run site:build` (chains
      `catalog` + `devlog:build`, confirmed present in root `package.json`);
      validate the generated output exists (non-empty `devlog/` tree, e.g.
      `index.html` present) before proceeding; `actions/upload-artifact` the
      `devlog/` directory; commit + push any changed generated files to
      `main` guarded by a `git status --porcelain` check so an unchanged
      tree produces no commit (no existing scripted precedent for this
      guard in-repo — `skills/digest.md`'s devlog commit is agent-decided,
      not script-gated — so this is new, not a mirror).
      `concurrency: group: nexus-loop` (same group as the rest of the loop)
      so it can't race `night.yml`/`march.yml` pushes to `main`; the commit
      step must NOT re-trigger itself (workflow is `workflow_dispatch`-only,
      no `push:` trigger, so this is structural, not a guard to add).
      Acceptance per issue #132: workflow visible in the Actions tab, a
      manual run greens on `main`, both catalog + DevLog builders execute,
      `devlog/` downloadable as an artifact, generated-file changes commit
      cleanly with no recursive run. Harness-only; no engine/mechanics
      change — source: issue #132 (re-triaged 2026-07-19 after the owner
      corrected the issue body).

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
- phase 25 — f7868e2a — /consolidate janitor mandate (terminology-sweep step + AUDIT finding) + `verify-mechanics.yml` stale `src/Skills/` impact-path fix; Part A harness re-apply verified already present at HEAD, no re-derivation needed
- phase D1 — 4adf7266 — spec 33 review landed (PASS-WITH-EDITS; die-gear expansion, STAKE retired, momentum null-reset, pool-law binding rule; supersession banners on HANDOFF-2026-07-09 + phase 31; 33c/33d re-scoped; Fate Engine P2 re-scoped, P3 retired)
- phase D2 — 18cf5e3b — Upgradeable-Dice engine core behind flag (four-die roll law + die-gear interface, stance-from-cards + open stance checks, null-reset momentum + until-spent surge, honest 1◆ Press Fate, 7-object ceiling overflow→+1◆, OVERHEAT crack primitive; draft/STAKE/read/variety-refresh retired in-flag; 24 hermetic tests, flag-off byte-identical, mobile re-verified)
