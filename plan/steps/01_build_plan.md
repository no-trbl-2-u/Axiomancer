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
- [ ] Phase 32 — Theme Deep Work (sandbox-first, `/deck-tuning` owns).
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
      grant_pip can push past the cap at a bust risk) shipped `543c090d`.
      Parts 1b/4d/4e/4f remain — source:
      `plan/tuning/2026-07-10-theme-identity.md` §2
- [ ] Phase 33 — Enemy Answers (specs 29/30 slice + enemy
      counterplay). One reactive verb engine-wide, lethality readout,
      variable-rung telegraphs, CAUTERIZE/Premise-shed/SWAY-cleanse
      enemies, THE COVETED DIE; GLYPHS pilot rides at the end as the
      Option-B grammar experiment. Largest phase; gated on Phase 26
      (numbers) but design-independent of the owner session
      (mechanics) — source: `plan/tuning/2026-07-10-turn-texture.md` §3
      + `plan/tuning/2026-07-10-theme-identity.md` §1 +
      `plan/tuning/2026-07-10-out-of-flow-mechanics.md` §2

**Critique infra (promoted via `/oversight` 2026-07-10):**

- [ ] Phase 34 — Non-Playwright transport for unattended `/critique`.
      8 consecutive `/critique` passes (of 11 total) have returned
      zero product findings because the `playtester` sub-agent's
      Playwright MCP tool grants don't propagate into Agent-tool
      sub-agent contexts in unattended runs (see `plan/CRITIQUE.md`
      Done section, "Playwright MCP tools unavailable to sub-agents").
      Decision via `/oversight` 2026-07-10: stop retrying the grant
      mechanism; give `/critique` a headless transport for unattended
      ticks that doesn't route through the Agent-tool sandbox (e.g. a
      standalone script driving the expo-web build directly with
      Playwright, invoked as a subprocess rather than an MCP-gated
      sub-agent). `playtester`/interactive `/critique` usage is
      unaffected — this only covers the unattended-loop path
      (harness; `skills/critique.md` + a new script under `scripts/`)

**Loop infra (promoted via issue-triage 2026-07-14):**

- [ ] Phase 35 — Reliable phase-issue auto-close. Phase-tracking
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
