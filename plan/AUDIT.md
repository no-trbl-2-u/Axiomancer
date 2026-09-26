# Audit

> Findings queue for `/iterate`. Each row is scored
> `impact x ease / 10` (see `skills/iterate.md` §4). The Pending
> section is the loop's drain target; `/iterate` picks the
> highest score, ships one fix, moves the row to Done. Categories:
> see `plan/bearings.md` § "AUDIT category taxonomy".
>
> Seeded 2026-07-03 from the retired per-package harness
> (`/archive`) during nexus re-onboarding — stale/pre-monorepo
> findings were dropped; these were re-validated as still
> plausibly live. Verify each against current code before
> shipping; re-file or drain as reality dictates.

> **Bias: backlog drain (set via /oversight 2026-09-17).** `/iterate`
> weights rows in this file 1.5x against the steward rotation until the
> next oversight lifts it. Reason: four consecutive content-steward
> passes shipped zero diffs (`/adjust-cards` 12, `/adjust-equipment` 12,
> `/adjust-enemies` 12, `/adjust-npcs` 11 — all zero-CREATE,
> zero-UPDATE, zero-REMOVE) while 131 rows here, 51 in
> `plan/CRITIQUE.md` and 37 in `plan/PHASE_CANDIDATES.md` stayed open.
> `/march` should prefer drain over the content-lifecycle rotation while
> this banner stands; a real content gap waits at most one extra
> rotation. T answered the `AskUserQuestion` ballot "Four consecutive
> content-steward passes shipped zero diffs" with "Throttle stewards,
> bias iterate to backlog".
>
> **Correction, same day.** The note first written here named four
> legacy `[needs-user-call]` rows (filed 2026-08-22) as prime targets
> for this bias. Two of them were then read directly and are STALE, not
> open: the transitional-library / card-authority row is superseded by
> `plan/bearings.md:363` (the hold is LIFTED) and by `skills/digest.md`,
> which already carries THE PIPELINE LIBERATION; the LONGER LEASH row is
> superseded by `plan/bearings.md:471`, which is the bearings entry the
> row says does not exist. Both are closed below. The remaining two
> (art pipeline, growth doctrine for pinned content counts) were NOT
> re-verified and may be stale the same way — read the current tree
> before spending a tick on either. All of them are loop-drainable under
> THE OPEN GATE ¶1; the tag is not a block.

> Pass narrative through the eleventh pass (2026-09-24) and resolved rows
> moved verbatim to `plan/archive/AUDIT_2026.md` (TRIM THE FAT T4, 2026-09-25).

# Site audit — 2026-09-11

## Top 5 findings (scored)

### [5.9] combat — user crash on ACCEPTING post-combat card reward (unreproduced, issue #216)
- category: external-critique
- impact: 9
- ease: 6
- next: body says "LIKELY THE SAME BUG — RESOLVED 2026-09-04 (verify
  before closing)" (the rune-column/worklet fix may already cover it) —
  get the owner's device log (SELF -> dev tools -> DIAGNOSTICS -> PREV
  SESSION, domain ERROR) to confirm before closing; can't be shipped
  blind on web alone.


## Pending

### [gap] The Breakwater (Act 1 coast, M3a #385) — five agent calls to confirm [needs-user-call]
- category: gap
- impact: 5
- ease: 9
- detail: filed 2026-09-26 (M3a residue). M3a shipped the Breakwater with four
  calls the agent made alone, each a one-line change if T overrules:
  (1) **No boss.** The last fight is water-holger at the watchtower (bw-17),
  because fishing-village's King of Revenge is still ahead in the chain.
  (2) **The windmill start is a rest (camp).** A new game opens on the rest
  screen, then the first-node relic.
  (3) **No combat plate.** The Breakwater is in `AWAITING_PLATE` and uses the
  fallback arena.
  (4) **Name overlap.** Fishing-village's own text also has "the breakwater"
  (its King of Revenge "rises from the breakwater").
  (5) **No NPCs, and the first one is now a map away** (added by
  `/adjust-npcs` pass 19, 2026-09-26). The Breakwater stages `npcs: []`,
  which trips the steward's "map with fewer than 2 staged NPCs → CREATE"
  signal. It isn't shipped here because D29 says no new NPCs in the map PRs
  and the story overview lists "What happens here" for the Breakwater as
  open. Hard rule 3 applies too: no inventing a named character alone.
  The cost is real, though. Since D27 a new game meets its first NPC and
  its first quest (Old Marrow's starting quest, Phase 53c) only after
  crossing the whole Breakwater and its bridge into fishing-village.
  `quest-giver-reachable.engine.test.ts` now pins
  `startMap: 'fishing-village'`, so nothing checks the default start.
  KB: guided first play reads as "essential, not optional" (Spirit
  Island, Aeon's End, Arkham Horror LCG onboarding rows). Options for T:
  (a) accept it until the story-dependent revamp (D1 step 4);
  (b) stage 1–2 existing fishing-village NPCs on the Breakwater instead
  (Old Marrow is the obvious one, and it is a staging-only move);
  (c) have a `story-spec`/`character-spec` session author the Breakwater's
  own people.
  Details: `plan/2026-09-25-map-revamp-m3.prompt.md` §3a.
- next: `/oversight` or the M3b session (it opens with T anyway for the
  forest's name, D26). Record any change as a D-number.

### [debt] Source comments still name the retired `/deck-tuning` loop (2026-09-25)
- category: debt
- impact: 2
- ease: 8
- detail: D10 retired `/deck-tuning` in T5 (#378). The instruction surfaces
  were repointed to `/adjust-cards`, but about 30 provenance comments in
  `axiomancer-mechanics/src/` still name it as the tuning loop. They were
  left alone deliberately to keep the T5 PRs collision-free. Examples:
  `combat.engine.ts:147-215`, `combat.playtest.ts`, `cards.pricing.ts`,
  `cards.sandbox.ts`, `combat.objective.ts`, and the e2e headers.
- next: `/iterate`, bundled with the next mechanics-source PR that
  re-stamps the baseline anyway. Reword to `/adjust-cards`, or to "the
  tuning loop (rebuild pending, jot `1fc33003`)" where the old loop's
  A/B surface is meant.

### [debt] T5 Tier 2 docs — named for archive but still have consumers (2026-09-25; archive part resolved, effects/enemy rewrite open)

- **Context:** trim T5 archived the Tier 2 docs rows
  (`plan/archive/2026-09-25-trim-t5/`). Six files the spec named have inbound
  pointers the trim could not repoint, because the pointers live under
  `.claude/` (classifier-blocked for autonomous runs; see the T5 hand-off
  item 2). Kept in place per the trim standing frame ¶1; the spec's Tier 2
  row over-counted them.
- `axiomancer-mechanics/docs/effects.md`, `docs/enemy.md` — cited by
  `.claude/skills/brainstorm-mechanics/SKILL.md:40,42` and
  `.claude/skills/world-spec/SKILL.md:44`, plus live docs (`quickstart.md`,
  `api.md`, `combat.md`, `world.md`, `morality.md`, mobile
  `asset-conventions.md`) and a `public-barrel.engine.test.ts` comment. These
  are reference docs kept current in place (effects.md's API table was edited
  in T3); their stale bodies are already filed in the "stale docs" row
  below. Rewrite in place, do not archive.
- **Resolved 2026-09-25 (attended, post-T5):** `profane-canon.md`, spec 10
  and spec 35 archived to `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/`.
  The `.claude/` citations were repointed: `card-expert.md` and
  `combat-playtest.md` now cite the archive paths, and the three design
  skills cite the live `docs/morality.md` in place of spec 10. So were
  `skills/adjust-cards.md`, `skills/forge.md`, spec 34, the big-numbers
  prompt, bearings and the `combat.objective.ts` comment. The
  `swap-pool-fanout` ledger went in the T5 residue. Only the
  `effects.md` / `enemy.md` rewrite-in-place item above stays open.
- **Hazard duplicates (spec row "hazard docs ×3"):** only one was a true
  copy — the mobile mirror `design/encounters/hazard-card-library.md`,
  archived in T5 (the mechanics file is the one copy). The mobile
  `design/encounters/hazard.md` and `design/hazard-minigame-mobile.md` are
  distinct mobile-UX docs that already point at the mechanics rules docs;
  kept.

### [debt] T2b dice-flag collapse — live content the OFF path was carrying (2026-09-25)

- **Context:** D7 deleted the Upgradeable-Dice OFF path (stance draft, hidden read, STAKE, v1 wheel, fate-X powering). The shipped model already ignored all of these; the items below were already inert in players' builds and are now visibly so.
- **Fate cards — RESOLVED (adjust-cards pass 20, 2026-09-26):** `the-note-falls-due`, `miserere`, `dead-pledge` folded `fate` -> off-colour `dieBonus` (recoil moved into the rider). Still open: the `fate` field has zero carriers but remains in `types.ts`, `cards.pricing.ts`, `combat.cards.ts`, `card-upgrades.ts`, `combat.card-complexity.ts`, `card-keywords.ts` and the tests. Deleting it is a small cross-surface cleanup. Also `it-gets-up-again` (`float_x_die`) is priced at 4.5 but almost always pays only its +1 Conviction fallback; that is an owner call alongside the `reroll_spent` item below.
- **Advantage buffs:** `buff_haste`, `buff_accuracy_up`, `buff_critical_damage_up` and kin grant advantage through the deleted read, so they do nothing in combat. Retire or re-hook (`/adjust-keywords`).
- **`reroll_spent` relic mechanic** still rerolls from the legacy face bag (`rerollSpentDice`/`COMBAT_DIE_FACES`), so it can mint X or faceless dice. `float_x_die` always pays +1◆ now.
- **Sim:** the `blind` policy now plays identically to `greedy` (kept so the matrix keeps its column); retire or redefine it at the next `/combat-playtest`.
- **Stale copy — RESOLVED (adjust-cards pass 20):** "drafted die" in `the-unpaid-sexton`'s face now reads "rolled dice". *(The FORGE, GHOST and WILD/X atlas rows were synced to `KEYWORD_GLOSS` by adjust-keywords pass 19, 2026-09-26.)*
- **Vestigial params:** `card-played.advantage` is always `'neutral'`; `scalePlayerHit`'s `readMult` is always 1.
- **Card faces print a dead read:** status card faces still show ▲/▼ read numbers, but every play lands at read `'none'`. Mobile froze `READ_ADVANTAGE_INTENSITY_BONUS` / `READ_DISADVANTAGE_DURATION_PENALTY` (both 1) as local constants atop `combat-encounter.engine.ts` so it compiles; delete them with a card-face pass.
- **CLARITY is inert:** its `forceWildOnNextDie` flag was only read on the deleted OFF path.
- **Wrong copy (predates T2b):** the dead-tray END line says unusable dice "are discarded" (`endTurn` banks one unspent die when the Reserve has room); the CONVICTION ◆ glossary says it is banked "from unspent dice" (unspent dice earn nothing); the momentum info popup still describes the v1 wheel ("light all three").
- **Coverage gap:** `upgradeable-dice-e2e.mjs` was the only browser run walking Press Fate, the momentum chip and blacksmith HONE; it was deleted with the flag. The other e2e scripts boot the model but do not walk those steps.
- **`MAX_PERMANENT_WILD_DICE`** (`Combat/combat.dice.ts`) is documented as the cap on `permanentWildDice` but nothing enforces it — missing clamp or dead constant (T3 barrel pass kept it).
- **adjust-keywords pass 19 (2026-09-26) — more trim fallout, filed not shipped:**
  - *Fate re-hook option:* Dawncaster's Blood ("sacrifice your own blood instead of Energy", `kb:dawncaster/keywords/blood.okf.md`) is the design `fate` was reaching for: a dead X die plus `recoilHp` as a substitute payment. It only works if X dice exist in ordinary play, and the Spec 33 tray never rolls one (only `reroll_spent` can mint one). So the card fold (`fate` -> `dieBonus`, `/adjust-cards`) is still the honest small fix.
  - *Nine inert support buffs:* besides the three named above, `buff_critical_rate_up`, `buff_liars_gambit` and `buff_abyssal_presence` (advantage-only, fed to `advantageGrants`, which nothing reads), plus `buff_haste`, `buff_haste_surge`, `buff_all_stats_up` and `buff_status_chance_up` (a positive roll modifier, which is only ever read as a penalty on the enemy). They are unobtainable and pinned for old saves. Stale copy reachable from a legacy save: `tooltip.engine.ts:349-358` and `village.engine.ts:175-176`, and `SUPPORT_KEYWORD` maps them to unrelated glosses.
  - *`debuff_curse` has no live applier* (its only source, the threat-clock enchant, was trimmed). It was also the only negative roll modifier, so the enemy roll-penalty deny path (`combat.engine.ts` ~3415/4913/5057), `isStatDebuff` and mobile's 'weaken' class never see any input. Retire it (about six test fixtures to repoint), or give the path a new feeder. `debuff_nettle_sting` has also been orphaned since `84ef85bd`.
  - *`resistedBy` / `resistDR` are dead data.* They are copied at `card.engine.ts:330`, `Effects/index.ts:81` and `game.reducer.ts:329`, and nothing reads them. Removing them touches exported types and saved state. (The `docs/effects.md` resist-roll prose was fixed in pass 19.)
  - *Tier-1 leftovers:* `MIND_MARK_ID = 'tier1_mind_mark'` / `getStudyMarkIntensity` (`Combat/effects.ts:21-27`, barrel-exported) point at an id in neither library. There is also a matching glyph at `statusGlyphs.ts:117`.
  - *Seven player mechanic kinds have zero carriers:* `strip_random_buff`, `befriend_attempt`, `refresh_die`, `convert_die_color`, `overheat`, `spend_all_pips`, `echo_next_spell`. These are wired but unused, so they are remove candidates. Retiring one touches the union, pricing, engine, mobile, editor and tests, so each is large. `befriend_attempt` sits on the befriend path and needs an owner call.
  - *OMEN's `omenClaim` is never sent by mobile,* so OMEN always falls back to a die-derived stance with a 1-phase window.

### [debt] TRIM THE FAT T2a merged unverified — finish list (2026-09-25)

- **Context:** owner call 2026-09-25 — T2a merged mid-work without re-running the gates. Full hand-off: `plan/2026-09-25-trim-t2a-handoff.prompt.md`.
- **Still open:** write-never `MapState.hazardOutcomes` / `HazardNodeOutcome` — left in place (a v26 hop to strip a harmless field is churn; strip it the next time a save hop lands for another reason). `buff_all_stats_up` / `debuff_curse` carry only an inert `rollModifier` and nothing applies them — `/adjust-keywords` call (deprecated-effects list).
- **Deviation from the spec, kept deliberately:** `combat.autoplay` moved to `src/test-utils/` (three surviving tests use it); `isRouteBlocked` kept (live movement check); `validateInteractions` kept (guards the live interaction registry).

### [docs] Trim-the-fat spec names `.claude/agents/mechanics-expert.md` as a delete candidate, but four live skills spawn it (2026-09-25)

- **Found by:** T1 of `plan/2026-09-25-trim-the-fat.spec.md` (Tier 1 "Docs" list, last bullet: "Rewrite or delete").
- **Consumer the audit missed:** `skills/ship-a-phase.md:68,536`, `skills/iterate.md:245,399`, `skills/adjust-cards.md:216`, `skills/adjust-keywords.md:192` all name `mechanics-expert` as the design-second-opinion subagent. Deleting the agent file breaks those spawns.
- **Action taken:** kept (standing frame ¶1). Spec row stands corrected: this is a *rewrite* (its philosophy-theme / stance-proc doctrine is retired), not a delete. Rewrite is design work, out of T1 scope.

### [content] The shipped Drowned Parish opening contradicts the ruled story — attended session needed (2026-09-24)
- category: content
- impact: 8
- ease: 3
- detail: `story-overview.md` rulings 7 and 10–12: play begins as X, a grown
  man, flees the Drowned Parish with The Covenant tracking him. The player
  knows nothing else at the start; the prologue arrives later as memories.
  The shipped map (`axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts`,
  `src/World/MapEvents/content.ts` `FISHING_VILLAGE_NEW_PLAYER_POOLS`)
  instead opens at the docks (`fv-1` `fvArrival`). Old Marrow hires a local
  boy to kill the King of Revenge (`fv-2`, `starting-quest`; boss `fv-6`),
  and three dinner-table dilemmas give him a father (`fv-4`
  stranger's net, `fv-14` what do I tell father, `fv-16` borrowed hook).
  The other 18 nodes (rest, hazard, loot, gathering, monster encounters) do
  not depend on the story and can stay.
- next: an attended `/story-spec` session on the Drowned Parish opening. One
  was started 2026-09-24 and paused by T before any answer. It had put four
  questions to T: who pressures X on the map (Covenant guards, the village,
  or both), what happens to Old Marrow, what the three dilemma nodes become,
  and what `fv-1` shows. Not loop-drainable: THE STORY IS THE ROAD forbids
  inventing canon the overview does not carry.

### [content] Legacy story threads that likely contradict the new rulings: `boy-*` flags and the ribbon/advisor-selection rite (2026-09-24)
- category: content
- impact: 5
- ease: 3
- detail: two shipped threads assume the discarded story.
  (1) The `boy-*` flags (25 references in `src/World/MapEvents/content.ts`,
  6 in `Coastal-Village/maps.ts`) assume a child; X is now a grown man who
  served The Covenant. Renaming is engine work (THE BLANK PAGE ¶2).
  (2) The ribbon/advisor-selection rite: the river court at `cr-9`, the
  village-green rite at `tar-4` (sets `sweetheart-was-nominated`,
  `content.ts` ~2000/2015), and the capital's Herald and Ribbon-Picker
  (`Northern-Continent/maps.ts` ~838/906, gated on that flag). It gives
  people a different reason to go to the capital than ruling 11 (the last
  refuge from The Covenant). Confidence 70 that it conflicts; T has not ruled.
- next: T call on the ribbon thread (keep, rewrite, or cut) in an attended
  session. The flag rename follows whatever the Drowned Parish rewrite
  decides.

### [content] Story systems the new rulings require that the game does not have (2026-09-24)
- category: content
- impact: 7
- ease: 3
- detail: `story-overview.md` rulings name five things with no representation
  in the build:
  - the opening world-framing (ruling 11: The Covenant occupies nearly the
    whole world; the capital is the last bastion of hope);
  - a **memories** section in the Memoir tab, organized chronologically
    (ruling 12; `axiomancer-mobile/app/(tabs)/memoir/` lists quests only),
    through which the prologue reaches the player;
  - The Covenant itself (rulings 13–14) — no faction, guard enemies or
    Covenant roster exists (`src/Enemy/enemy.library.ts`);
  - X's inherited money debt (ruling 8);
  - the pursuing guards (ruling 7).
- next: the memories section and the opening framing are systems work that
  can be designed now (what triggers a memory, the chronological scheme).
  What each memory *says* waits on the prologue's delivery plan. Route to
  `/expand` as phase candidates. The Covenant roster waits on the Drowned
  Parish session deciding who pressures X.

### [docs] Live docs whose bodies describe retired systems — banner-only pass, rewrites owed (2026-09-23)
- category: docs
- impact: 5
- ease: 4
- detail: the 2026-09-23 comments/docs accuracy audit (PR from branch
  `claude/comments-docs-audit-95f2sz`) fixed every single-fact error it could
  prove, but these files describe whole retired subsystems and were only given
  a dated `> **Superseded (2026-09-23)**` banner naming the live truth. Each
  line: file — what the body still describes — live source of truth.
  - `axiomancer-mechanics/docs/effects.md` — 88-effect catalogue, tier tables,
    `src/Combat/phases/scenario.ts` call sites — `src/Effects/buffs.library.json`
    (19), `src/Effects/debuffs.library.json` (10), `src/Combat/effects.ts`.
  - `axiomancer-mechanics/docs/effects/README.md` + per-effect files under
    `docs/effects/{buffs,debuffs}/` — ids that no longer exist, scenario.ts
    pointers — same sources.
  - `axiomancer-mechanics/docs/enemy.md` — 15/30-enemy library,
    `enemy.logic.ts`, six AI strategies, `decideEnemyAction` — the 79-entry
    `src/Enemy/enemy.library.ts`, `src/Enemy/types.ts`, `src/Combat/combat.engine.ts`.
  - `axiomancer-mechanics/docs/combat.md` — six legacy sections (Tier 1
    auto-effects, Spec 03 proc matrix, Damage Resistance sample using
    `calculateSkillDamage`, Phase 60 friendship table naming enemies that no
    longer exist, Combat Mechanics API `rollSkillCheck`/`getSkillDamageType`,
    Card terminology `SKILLS_LIBRARY`) — `src/Combat/combat.engine.ts`
    (`deal`), `src/Combat/index.ts`, `src/Enemy/enemy.library.ts`
    (11 `friendshipReward` entries).
  - `axiomancer-mechanics/docs/api.md` — Cards section (`canUseSkill`,
    `SkillTier`, "21-card library") and the Phase 46 alignment-gate paragraph
    — `src/Cards/library/*.cards.ts`, `src/Cards/card.engine.ts`, `src/index.ts`.
  - `axiomancer-mechanics/README.md` — module-table rows for Enemy / Items /
    Skills and the "Hazard public API" paragraph name exports that do not exist
    — `src/index.ts` barrel.
  - `axiomancer-mechanics/docs/quickstart-world.md` — sample calls
    `resolveMapEvent(state, 'fv-2')` and kinds discovery/dialogue/trade/puzzle
    — `src/World/MapEvents/resolve-map-event.ts` (`(state, rng?)`),
    `src/World/MapEvents/types.ts` (eleven kinds).
  - `axiomancer-mechanics/docs/oaths.md` "Authoring gates" card-gate bullet —
    `SkillLearningRequirement.requiresAlignment`, `learnSkill`, `LEARN_SKILL`
    — `src/Cards/card.engine.ts` (gate removed 2026-07-08).
  - `axiomancer-mobile/docs/engine-integration-architecture.md` — code
    examples on `state.combat` / `selectStance` / `resolveCombatRound` /
    `choosing_stance` — `docs/combat.md`,
    `state/presenters/combat-encounter.engine.ts`.
  - ~~`axiomancer-mobile/specs/10-navigation-and-app-shell.md`,
    `11-asset-pipeline.md`, `12-accessibility-and-theming.md`~~ — archived
    2026-09-25 (trim T5) with the whole mobile `specs/` folder to
    `plan/archive/2026-09-25-trim-t5/axiomancer-mobile/specs/`; no rewrite
    needed.
  - `.claude/agents/playtester.md` Path A steps 3-5 and Path B — prelude modal
    / FIGHT-FLEE / stance / STAND-DO-CLASH-LET round loop —
    `axiomancer-mobile/docs/combat.md`,
    `components/combat/encounter/CombatEncounterPanel.tsx`.
- next: one `/iterate` tick per file (or per section for combat.md): rewrite
  the body from the named live source, drop the banner. Also dated-record
  drift the audit saw but did not touch, for the same pass if cheap:
  (the mobile `specs/README.md` DONE-date drift is moot: archived 2026-09-25,
  trim T5); `axiomancer-mobile/docs/E2E_INVENTORY.md` is stamped against commit
  12a485d; `axiomancer-mechanics/docs/world.md:306,393,414` still says
  "all 8 MapEventKind" (union is eleven); `docs/hazard-minigame-api.md`
  names a `HazardCardEffect` type that does not exist.

### [debt] Five code-side defects surfaced by the 2026-09-23 comments audit (2026-09-23)
- category: debt
- impact: 4
- ease: 6
- detail: comment-vs-code mismatches where the CODE is the stale side. Each
  was left untouched by the docs PR (the two one-liners it did fix:
  `verify-drift.yml` now triggers on `enemy-keywords.ts`;
  `check-naming-law.mjs` now sweeps `apocrypha.cards.ts`).
  1. `axiomancer-mechanics/scripts/export-catalog.ts:106-113` —
     `parsePricingComments` reads `src/Cards/cards.library.ts`, which is the
     aggregator since THE BIG NUMBERS REWRITE; the `// pts:` blocks live in
     `src/Cards/library/*.cards.ts`, so catalog pricing is always empty.
     Confidence 60.
  2. `axiomancer-mechanics/src/CLI/combat-sim.cli.ts:11-13,43-45` — usage
     text and default loadout name `slippery-slope`, `brace-for-impact`,
     `festering-argument`, `soft-word`; none exist in the card library.
     Confidence 50 that the default path is broken (may fall through).
  3. `axiomancer-mechanics/src/Effects/world-tick.ts` —
     `processWorldEffectTick` has no caller outside tests in mechanics or
     mobile; `World/world.reducer.ts:206` used to point at a
     `Game/world.orchestrator.ts` that does not exist. Either wire it into
     `moveToNode` or delete it. Confidence 60.
  4. `axiomancer-mechanics/src/Effects/index.ts:167-190` —
     `TIER1_EFFECT_MAP` maps to `tier1_*` ids absent from both effect
     libraries (the deprecated-effects test bans them), so
     `applyTier1CombatEffect` always returns `noChange`; likewise
     `Enemy/enemy.library.ts:89-92` `T1_DEFAULT`. Delete or re-point.
     Confidence 80.
  5. `scripts/axio-mcp-server.mjs:39-62` — `ensureFresh` stats only
     `Cards/cards.library.ts` and `Effects/effects.library.ts`; an edit to
     `Cards/library/*.cards.ts` does not bump the mtime, so the "mid-session
     edit is caught" claim in its header is false for card edits.
     Confidence 50.
  Also observed: `scripts/check-baseline-freshness.mjs:33-41` says
  `World/Continents/**` is import-disjoint from Combat/Cards/Enemy/Character,
  but `Enemy/index.ts` and `Enemy/types.ts` type-import `MapName` from
  `../World/map.library` (runtime-erased, so the sweep numbers are unaffected).
- next: `/iterate` — verify each with a failing test first (1, 4 and 5 are
  cheap to witness), then fix or delete; 3 is a design call (wire or remove)
  and needs a `[loop-call]` note in the commit body.
- note 2026-09-25 (T4 compaction): items 3 (`Effects/world-tick.ts`) and 4
  (`TIER1_EFFECT_MAP`, `T1_DEFAULT`) no longer exist — deleted in T2a. Items 1, 2
  and 5 re-read live at `d615a35d`.


### [x] [loop-call] `plan/bearings.md` still says there is no hosted web surface, and a second Pages project is about to exist (2026-09-20) — RATIFIED via /oversight 2026-09-23
- category: divergence
- impact: 5
- ease: 9
- detail: bearings L35-37 states "**No hosted web surface.**" as a standing
  decision. It was already in tension with the game's Cloudflare project (the
  open divergence row above); T's 2026-09-20 reversal makes a SECOND project
  deliberate policy. The sentence was not edited in this branch because the
  project does not exist yet and editing a record ahead of the tree is the
  precise fault the burn-day audit was called to clean up.
- next: when the Pages project is created (`docs/devlog-public-deploy.md` step
  8), correct bearings' sentence and the § Surface paragraph in the same commit
  that records the URL. Not before.
- **RATIFIED via /oversight 2026-09-23:** correctly deferred as filed. No
  action until the triggering event (Pages project creation).

### [x] [loop-call] The local verify gate and CI disagree about what green means: the Playwright journeys run only in CI (2026-09-20) — DECIDED via /oversight 2026-09-23
- category: process
- impact: 7
- ease: 6
- detail: filed by the burn-day audit 2026-09-19, found by the audit running
  against itself. `npm run verify --workspace axiomancer-mobile` does not run
  the Playwright journeys; `e2e:fixture`, `e2e:combat`, `e2e:encounters`,
  `e2e:exploration-roundtrip` and the rest are separate scripts that only the
  `verify + affected Playwright journeys` and `mechanics + affected consumers`
  workflows invoke. Row 3.1 shipped behind a green foreground mobile gate
  (308 suites / 2950 tests) and turned CI red on `e2e:fixture` case A: the
  generalised arrival derivation treated a fixture placement as an unanswered
  arrival, so `node-fv-9` never rendered. Five consecutive fix agents each ran
  the full package gate before committing and none could have caught it. The
  fix (`9f2bf6c`) is unrelated to this row; the gap is that a contributor's
  definition of "gate green" excludes a suite that can reject their push.
  This is the mirror of the existing observation that five root `npm test`
  files run in no workflow (burn-day audit section 4, B-7): there, guards that
  CI never runs; here, guards that only CI runs. Phase 57's own guard had the
  same shape until row 3.6 wired `check-baseline-freshness` and
  `regen-deck-matrix-baseline` into `verify-mechanics.yml` (`d8428d5`).
- options: (a) add an opt-in `verify:journeys` script and name it in AGENTS.md
  alongside the standing gate, so the reachable local command exists even if it
  is not run every time; (b) fold the journeys into `npm run verify` and accept
  the added minutes plus the browser dependency on every contributor run;
  (c) leave the split and document it loudly in AGENTS.md so nobody again reads
  a green package gate as a green tree. The audit did not choose — the cost of
  (b) is a real change to every contributor's inner loop and is the loop's call
  to weigh, not this session's to impose while shipping fourteen other rows.
- source: burn-day audit 2026-09-19, section 9 residue
- **DECIDED via /oversight 2026-09-23:** option (a) — add an opt-in
  `verify:journeys` script, named in AGENTS.md alongside the standing gate,
  so the reachable local command exists without adding minutes/a browser
  dependency to every contributor's default `npm run verify`. Ready to ship;
  routing to the next `/iterate` pass, tag dropped.

### [x] [loop-call] Two layers own save policy: the engine's DURABLE_ACTIONS allowlist and mobile's hand-placed checkpoints behind a deflecting adapter (2026-09-20) — DECIDED via /oversight 2026-09-23
- category: contract
- impact: 6
- ease: 5
- detail: filed by the burn-day audit 2026-09-19, row 3.7. The engine gates
  autosave to a curated `DURABLE_ACTIONS` set (`axiomancer-mechanics/src/
  Game/store.ts`, Phase 51 `4972f9a`). Mobile then makes that gate
  unreachable: `wrapDeflectingAdapter` (`axiomancer-mobile/state/store.ts`)
  swallows every engine autosave — durable actions included — unless it is
  inside the passthrough that the explicit `store.save()` verb opens. So no
  durable action has ever written on mobile, and persistence there is
  carried entirely by hand-placed checkpoints: 15 `getState().save()` call
  sites outside tests — `components/SaveOnExit.tsx`, `state/actions.ts`
  (the exposed verb, the move checkpoint, the map crossing),
  `state/combat/store-actions.ts` ×3, `state/hazard/store-actions.ts` ×3,
  `state/blacksmith/store-actions.ts` ×2, `state/cache/store-actions.ts`,
  `state/labyrinth/store-actions.ts`, `state/rest/store-actions.ts`. That
  is 13 checkpoints plus the verb plus the exit flush. Neither layer knows
  about the other, and nothing written down says which wins or where a new
  checkpoint belongs — which is how Phase 99 came to justify a correct fix
  with a rationale that named the wrong owner (PLAYTEST_BUGS_2026-09-18
  BUG-03). The call: pick one owner (add the mobile verbs to the engine
  allowlist and drop the wrapper, or keep the wrapper and say so in the
  engine docs), or keep both and write the rule. Whichever way it goes, the
  ownership as it stands today is now guarded — `axiomancer-mobile/state/
  e2e/exploration.engine.test.ts`, "mobile owns save timing" — so the
  decision has to be taken deliberately rather than drifted into.
- next: /oversight
- **DECIDED via /oversight 2026-09-23:** keep `wrapDeflectingAdapter`; mobile
  stays the sole owner of save timing via its hand-placed checkpoints — least
  churn, matches the already-shipped guard test
  (`axiomancer-mobile/state/e2e/exploration.engine.test.ts`, "mobile owns
  save timing"). Write this down explicitly as the ratified rule in the
  engine's own docs (where `DURABLE_ACTIONS` is defined) so the next reader
  doesn't mistake the allowlist for live behavior on mobile. Ready to ship
  as a docs-only fix; routing to the next `/iterate` pass, tag dropped. The
  companion mid-encounter persistence fix (`plan/PHASE_CANDIDATES.md`'s
  "No single owner for save/persistence policy" row, second phase) stays
  open — this decision unblocks it but does not implement it.

### [content][gap] Three of four Northern-Continent maps carry only 1 staged NPC — DECIDED, needs an attended character-spec/story-spec session (2026-09-05)
- category: content (found during `/adjust-npcs` pass 1's structural audit —
  Step 1's "map with fewer than 2 staged NPCs → CREATE" signal)
- detail: `caverns` (`theDelver` only), `connecting-river` (`theBoatwoman`
  only), and `town-across-river` (`theSweetheart` only) each carry exactly
  one rostered NPC; only `northern-city` (`theGateClerk`, `theShipwright`)
  clears the skill's own ≥2 threshold. Read against the maps' own in-file
  design commentary (Phase W3/W4, `Northern-Continent/maps.ts`'s header
  block), this reads as deliberate rather than an oversight: each singleton
  is explicitly the "guaranteed quest-giver on every route" pattern
  (the fv-2/Old Marrow precedent, scaled to a sparser map), and
  town-across-river is named in-file as "a homecoming, not a new front" —
  deliberately small. No `specs/characters/` or `specs/story/` document
  asks for additional voices on any of the three maps. Per this skill's
  hard rule 3 ("don't invent a named character's personhood autonomously")
  and Step 2's carve-out, filling this gap — even partially — means
  designing 1-3 new named characters' full personhood (voice, motive,
  history, at minimum a dialogue tree), which is `character-spec`/
  `story-spec`'s interactive job, not something this autonomous tick can
  responsibly improvise. Filed rather than actioned or silently dropped:
  a future `/adjust-npcs` pass re-reads this row before treating the
  signal as "already handled."
- score: n/a — routing item, not a scored fix. Needs a user call on
  whether Northern-Continent's minimalism is intentional (in which case
  this row should be closed as "by design" and the skill's threshold
  signal caveated) or whether one or more of the three maps should get a
  `character-spec`/`story-spec` session for a second voice.

**DECIDED via /oversight 2026-09-15:** not by design — needs more voices.
Authorize `character-spec`/`story-spec` sessions to design 1-3 new named
NPCs for `caverns`, `connecting-river`, and/or `town-across-river`. This is
an attended-session task, not autonomously shippable (hard rule 3): tag
changed from `[needs-user-call]` to `[gap]`, ready for `/march` to dispatch
to an interactive `character-spec`/`story-spec` session next time T is
present. Row stays open until that session runs.

### [content] 30 of 73 roster enemies (41%) carry no aftermath prose (`finalBlowLines`/`causeLines`) (2026-09-05)
- category: content (found during `/adjust-enemies` pass 1's structural
  audit — Step 1's "aftermath prose missing" signal)
- detail: Phase 71 (GH#65 ask 1) added `finalBlowLines`/`causeLines`/
  `pactLines` to the `Enemy` schema and authored them for most of the
  roster, but 30 of the original 2026-07-06 52-painting batch never got a
  pass (GraveLarva, ChatteringSkull, FootStealer, CursedHead, Ghast,
  DoomEgg, TheButcher, Wichtlein, BullBegger, WeepingHead, GoblinShaman,
  Sugata, PaleBrood, Mabadi, FrayedOne, BoneTotem, BoneWizard, CursedPaladin,
  VampireThrall, JeweledTree, OgreNaga, Sidelle, AshenBoneDrake, Zoma,
  MabadiUndrowned, TriEyesHollowed, BlackDeath, TheUnnameable, FireGiant,
  GreaterDevil — grep `finalBlowLines:`/`causeLines:` absence in
  `enemy.library.ts` to reproduce). Not a crash or a broken invariant —
  `types.ts` documents the field as optional with a consumer-side fallback
  (mobile presenter's `derive*Phrase` helpers render a generic line) — so
  verify stays green and nothing is silently wrong in play. It is a real
  flavor-completeness gap spanning nearly half the roster, including
  several elites/mid-roster names (Sugata, CursedPaladin, VampireThrall,
  FireGiant, GreaterDevil) that deserve a unique kill/death line as much as
  their siblings that already have one. Sized at ~30 enemies x 6 lines
  (brutal/quiet/ironic x2) in house voice (spec 34 §2.5) — a `content-curator`
  job, not a routine single-enemy edit, and too large to fold into this
  pass alongside its other two findings (the caverns CREATE and the Aporia
  portrait backfill) without diluting quality. No owner decision needed —
  purely executional — so filed here as `[content]`, not `[loop-call]`.
- score: impact 4 x ease 5 / 10 = 2.0

### [gap] Art pipeline: two queued owner calls block everything [needs-user-call]
- category: gap
- impact: 8
- ease: 9
- detail: filed 2026-08-22 by the content-pipelines audit. (1)
  `plan/ideas/AI_ART_PIPELINE_OPTIONS.md` §9 "Decision needed"
  (A gpt-image / B ComfyUI+FLUX / C hosted / Hold) has been unanswered
  since 2026-07-19 — one line unblocks art-1. (2)
  `Potential Assets/MCP-Axiomancer/images/` holds 116 painted card-art
  PNGs keyed by live card names ("V7 fuel" per the masterplan) with no
  license/provenance line — unusable until origin is stated. Also
  loop-doable regardless of the calls: write the asset naming/ingest
  convention doc, add a provenance-completeness + registry-drift test,
  commit the alpha-matte/WebP post-process recipe (currently tacit
  knowledge recorded only in provenance.json prose) behind a phase case.
- next: /oversight
- **PARTIAL 2026-08-22:** the loop-doable half shipped — conventions
  doc at `axiomancer-mobile/docs/asset-conventions.md` (recipe written
  down), acquisition pipeline queued as build-plan Phase 71.
- **RESOLVED 2026-08-22 (walkthrough), both owner calls answered:**
  (1) §9 route — T picked **Option 1, A-then-B** (hosted gpt-image-2
  behind a swappable adapter, local LoRA later if style drift binds);
  filed in `plan/bearings.md` § "ART PIPELINE ROUTE", the options doc
  §9, and queued as **Phase 73**. Needs an OpenAI key in `.env` before
  the generate leg runs. (2) The 116 paintings — T: **"Online as open
  source art."** That rules out an unlicensed-scrape risk but does NOT
  by itself license them: the per-image license and source are still
  unrecorded, so no truthful `provenance.json` entry can be written
  yet. NARROWED follow-up (not blocking any phase): recover the source
  site / asset-pack name — the loop may trace them itself and wire any
  image whose license it can evidence. See the bearings row.

### [contract] Cross-package impact checklist misses the world/enemy surfaces mobile consumes
- category: contract
- impact: 8
- ease: 7
- detail: filed 2026-08-22 by the content-pipelines audit. AGENTS.md's
  impact checklist + `scripts/ci-e2e-scope.mjs` omit `src/Enemy/**`,
  `src/World/MapEvents/**`, `src/World/Continents/**`,
  `src/World/map.registry.ts` / `map.library.ts`, `src/NPCs/**`,
  `src/World/Labyrinth/**`, `src/World/Blacksmith/**` — all consumed by
  mobile (e.g. an engine map-node change breaks mobile's
  `layout-engine-parity.test.ts` and CI never runs it; `portraitAsset`
  renders via two presenters). The checklist's `src/World/Rest/**` entry
  points at a directory that no longer exists (`RestChoice/` is the live
  successor, unguarded). Extend checklist + classifier, delete the dead
  entry.
- next: /iterate
- **RESOLVED 2026-08-22 (same PR):** AGENTS.md checklist extended
  (Enemy, NPCs, all of World/**) with the dead Rest entry replaced;
  `scripts/ci-e2e-scope.mjs` classifier updated (Enemy → combat +
  encounters; NPCs + all remaining World/** → encounters) with new
  test cases in `ci-e2e-scope.test.mjs`, runnable via the new root
  `npm test`.

### [content] Engine-generated "the enemy" strings survived the phase-40 card-text grammar pass
- category: content
- impact: 3
- ease: 5
- detail: filed 2026-08-23 by phase 40 (card-text grammar + full copy
  pass). That phase fixed the FIXED VOCABULARY rule ("the foe", not "the
  enemy") across every AUTHORED string: `cards.library.ts`
  `paidSummary`/`persistentEffect` (31 cards) and mobile
  `state/combat/keywords.ts` `KEYWORD_GLOSS`/`SYSTEM_GLOSSARY` (17
  entries), each now lint-enforced. Two adjacent surfaces still say "the
  enemy" and were deliberately left out of that pass (bounded scope, not
  an oversight): the ENGINE's own generated strings in
  `axiomancer-mechanics/src/Combat/combat.cards.ts`
  (`statePredicateText`'s `UNMOVED`/`enemy-drew-blood` clauses, the hex
  `Attaches to the enemy.` suffix, the `lock_stance` and
  `boost_all_dots` mechanic-text lines — 7 total sites) and the mobile
  presenter's per-mechanic `verbLine` prose in
  `axiomancer-mobile/state/presenters/combat-encounter.engine.ts`
  (`mechanicHeadline`, ~30 entries, several also carrying stray em
  dashes/semicolons the phase-40 lint never reached). Neither surface has
  a lint today. A future pass: rename the 7 mechanics sites (cheap,
  bounded — plus its `choir-card-wording.engine.test.ts` assertions that
  pin `UNMOVED (the enemy dealt you no damage last round)` / `the enemy
  drew blood since your last turn` / `Attaches to the enemy.` literally),
  then decide whether `mechanicHeadline`'s much larger prose set is worth
  a dedicated sweep or a standing lint of its own.
- next: /iterate

### [contract] New-keyword wiring drifts silently across seven surfaces
- category: contract
- impact: 6
- ease: 6
- detail: filed 2026-08-22 by the content-pipelines audit. The two
  switches that matter (`combat.engine.ts` mech switch,
  `combat.cards.ts` mechanicText) carry explicit defaults so a new kind
  type-checks clean while inert; no assertNever exists in mechanics.
  Untested sync surfaces: glyph tables triplicated across mobile
  `glyphShapes.ts` / editor `CardFace.tsx` / `scripts/build-catalog.mjs`;
  the editor's independent `wx.ts` KEYWORDS vocabulary (still lists dead
  spec-32-v2 words); `axio_keywords` hand-parses `docs/keyword-atlas.md`
  and hardcodes "/30" (unlike axio_cards/axio_effects which auto-regen);
  mobile KW-2 iterates a hardcoded 17-kind array, not the union.
  card-expert's keyword checklist stops at mechanics (omits mobile
  gloss, CARD_EFFECT_SET, atlas, retheme-map.json, editor surfaces).
  Derive the lists, add drift tests, extend the checklist.
- next: /iterate
- **PARTIAL 2026-08-22 (same PR):** card-expert's wiring checklist
  extended to 12 steps covering every listed surface (with the
  silent-`default:` warning); the drift TESTS are queued as build-plan
  Phase 68.

### [contract] Allowlist omits the commands the skills instruct — attended ticks prompt-wall
- category: contract
- impact: 6
- ease: 8
- detail: filed 2026-08-22 by the content-pipelines audit. CI is masked
  by skip-permissions, but local/attended ticks stall on:
  `npm run baseline:check` / `baseline:regen` (the latter being
  guard.mjs's own prescribed escape hatch for its baseline write-block),
  the minigame CLIs (`npm run hazard` / `gathering` / loot-cache /
  quest-board), `critique:drive`, `devlog:build` / `catalog*`,
  `npx expo|playwright|tsx|vitest`, `check-lexicon.mjs` invocations, and
  every tuning skill's PR-delivery verbs (`git checkout -b`,
  `git push -u origin <branch>`, `gh pr create` — only
  `git push origin main` is allowlisted). Also: the `reader` agent
  declares `mcp__claude-in-chrome__*` tools granted nowhere (dead in
  CI), and CI grants no kb-query/axio-query MCP tools. Extend
  `.claude/settings.json` + `_claude-skill.yml` grants.
- next: /iterate
- **BLOCKED-THEN-QUEUED 2026-08-22:** the remote liberation session
  was permission-blocked from editing `.claude/settings.json` itself
  (the harness protects self-expanding allowlists — reasonable).
  Queued as build-plan Phase 72 with the exact grant list, to land
  from an attended/local session. The root `npm test` script (part of
  the gap) DID ship.

### [tests] No growth doctrine for pinned content counts [needs-user-call]
- category: tests
- impact: 6
- ease: 8
- detail: filed 2026-08-22 by the content-pipelines audit. Five
  hardcoded 57-card pins, `new-enemies.engine.test.ts`'s exactly-52
  roster, glossary pinned at 42, and `curated-library.engine.test.ts`
  pinning `addedIn === '2026-08-08'` for every card (a card added today
  fails the suite). Deliberateness gates are good, but nothing documents
  that bumping them is the expected part of a content add vs. forbidden
  tampering — the loop must edit the test that guards growth with no
  doctrine for when that is legitimate. Needs a one-line ruling (e.g. "a
  content add updates its pins in the same commit, citing this ruling"),
  then bake it into the add-a-card / add-an-enemy checklists.
- next: /oversight
- **RESOLVED 2026-08-22 (same PR):** THE PIPELINE LIBERATION ¶4 rules
  it exactly so — pins are growth ledgers, updated in the same commit
  citing the ruling; editing a pin with no content change stays
  forbidden. The `addedIn === '2026-08-08'` pin relaxed to
  ISO-date >= 2026-08-08 in `curated-library.engine.test.ts`; the
  doctrine is baked into card-expert's file map note.

### [gap] `npx playwright install chromium --with-deps` hung on an unreachable apt mirror, killing a full `march` tick
- category: gap
- impact: 5
- ease: 5
- detail: filed 2026-08-19 (digest pulse). Run `32226765299` (the
  2026-08-19 07:12 scheduled `march` tick) hung inside the shared
  `_claude-skill.yml` setup step (`npx playwright install chromium
  --with-deps`, used by both `march` and `night`) — its underlying
  `apt-get update` retried `azure.archive.ubuntu.com` for over an hour
  (07:13:53 -> 08:27:49, zero progress the entire window, log lines
  `Ign:2..23` repeating) before the job's `timeout_minutes: 75` ceiling
  force-cancelled it. No commit resulted; the tick is a total loss, not
  a partial one — distinct from the already-filed "march ticks are
  creeping toward the job timeout" row above (that one is real work
  outgrowing the ceiling; this one is an idle apt-mirror hang eating
  the whole budget while nothing runs). `verify-mechanics.yml` and
  `verify-mobile.yml` carry their own copy of the same install command,
  so the exposure isn't march-specific, just unluckiest there because
  that job runs unattended on the longest cadence.
- next: /iterate. `--with-deps` re-runs `apt-get update && apt-get
  install` on every invocation with no cache and no timeout around the
  network call; caching the installed apt packages (or the Playwright
  browser + its system deps together, keyed on the pinned Playwright
  version) removes the network dependency from the common path
  entirely. A cheaper interim fix: wrap the install step in a short
  step-level `timeout-minutes` so a mirror hang fails fast and loud
  instead of silently eating the whole job ceiling.
- recurrence (2026-08-21 digest pulse): run `32290461478` (the
  2026-08-19 18:59 scheduled `march` tick) hit the identical signature —
  `apt-get update` stuck retrying `azure.archive.ubuntu.com` from
  18:59:49 with zero progress until the ceiling force-cancelled it at
  20:14:33, another total loss. Second confirmed occurrence in 12 hours;
  still unfixed, still `/iterate`-shaped, not re-scored.

### [divergence] Bearings says there is no hosted web surface; Cloudflare Pages has been publishing one — RULED via /oversight 2026-08-10: incidental, scope it down — CONFIRMED LIVE EXPOSURE via /oversight 2026-08-12, impact raised
- category: divergence
- impact: 8
- ease: 6
- detail: filed 2026-08-09 (first-map audit follow-up, offered to T at the
  close of PR #186 and accepted). `plan/bearings.md` L35-37 states, as a
  standing decision, "**No hosted web surface.** The product ships as a
  mobile app via manual EAS builds; `main` does not auto-deploy," and
  § Surface reinforces it: "This is not a website... an expo-web build used
  only for dev/e2e/playtesting." Observed during PR #186: Cloudflare Pages
  publishes a preview per branch. The repo already knows this in one
  place — `.github/workflows/build-devlog.yml` L6 commits generated DevLog
  HTML to `main` explicitly "so the existing Cloudflare Pages integration
  can serve them" — so the integration is not a surprise to the tooling,
  only to the doctrine file every skill reads first.
- **confirmed first-party while this row was being filed.** PR #190 reports
  two check runs, and one of them is named **`Cloudflare Pages`** —
  `conclusion: success`, `details_url` pointing at
  `dash.cloudflare.com/.../pages/view/axiomancer/<deployment>`. Pages is not
  merely integrated; it builds and publishes on pull requests, and reports
  back as a required-looking status check on the same PR list a reviewer
  reads. Whatever the doctrine says, the repository has a deploy surface
  with a per-PR URL.
- **the URL shape, observed rather than inferred.** The Pages bot comments
  on the PR with both addresses and edits the comment in place as the build
  finishes:
  - per-deployment: `https://<deploy-hash>.axiomancer.pages.dev`
  - **per-branch: `https://<branch-slug>.axiomancer.pages.dev`** — for this
    row's own branch, `https://claude-first-map-audit-minig.axiomancer.pages.dev`.
    The slug is the branch name truncated, so the address is guessable from
    a branch name alone.
  That answers the "name the URL shape" half of this row for free. Still
  open, still needing a ruling: whether these are intended and what is safe
  to publish there. **Knowing the address is not deciding the door should be
  open** — do not read this bullet as draining the question above it.
- one thing deliberately NOT done while filing: the row asks whether
  anything unintended is reachable without auth, the private DevLog being
  the obvious candidate since `build-devlog.yml` commits its generated HTML
  to `main` specifically for Pages to serve. Probing a live host for
  unauthenticated private content is a deliberate act, not a side effect of
  filing a row. Whoever drains this should do it knowingly.
- why this matters beyond bookkeeping: the "no hosted surface" premise is
  load-bearing in at least two places. `/critique` and the `reader`
  subagent are built to visit a live site as a stranger; a doctrine that
  says no such site exists tells them there is nothing to visit. And the
  `[needs-user-call]` product-name row above weighs "Axiomancer" under a
  whole-product pivot — a decision that reads differently if branch
  previews are already public URLs versus if nothing is published at all.
- `[needs-user-call]` on which way to reconcile: whether the previews are
  intended (bearings should describe them, name the URL shape, and say
  what is safe to publish there) or incidental (the Pages integration
  should be scoped or turned off). Do not "fix" this by editing bearings
  to match observed reality — the sentence is a standing decision, and
  only T can restate it. What /iterate CAN do without a ruling is confirm
  the current publish scope: which branches build, what the URLs are, and
  whether anything unintended (the private DevLog among them) is reachable
  without auth.
- **RULING (T via /oversight 2026-08-10):** incidental — not an intended
  public surface. Scope it down (restrict Cloudflare Pages to
  internal/preview-only use, or turn it off) rather than rewrite
  bearings to describe a public site. Bearings' "no hosted web surface"
  sentence stands as the target state; this row stays open until the
  Pages integration actually matches it.
- next: /iterate or a small phase — confirm current publish scope first
  (which branches build, whether the private DevLog is reachable
  without auth per the bullet above), then restrict/disable the
  Cloudflare Pages integration (`.github/workflows/build-devlog.yml`'s
  Pages-serving comment, and/or the Cloudflare project's build settings,
  which live outside this repo). This is an infra/config change, not a
  plan edit — `/oversight` does not make it directly.
- **CONFIRMED via /oversight 2026-08-12** (the "next" scoping step
  above, done knowingly per this row's own instruction). The ruling's
  scope-down action has NOT happened yet — no Cloudflare config exists
  in-repo, `.github/workflows/build-devlog.yml` is unchanged since
  2026-08-08 and still commits DevLog HTML to `main` for Pages to
  serve. Live check: `https://axiomancer.pages.dev` (production domain)
  returns the live site with no auth wall, and the DevLog it serves at
  `/devlog/log.html` — generated HTML whose own header literally reads
  "A private index of the game's content and the nightly development
  log" — is reachable at that URL **right now, unauthenticated**.
  Content labeled private is live on the public production domain.
  Impact raised 6→8 on the strength of this confirmation; the fix
  itself (restrict/disable Pages) is unchanged from the "next" note
  above and still needs an infra/config actor, not `/oversight`.
- **QUEUED via /oversight 2026-08-15 — build-plan Phase 57.** Shown that
  the 2026-08-10 ruling had produced no change in five days precisely
  because this row routed its whole fix to an actor outside the repo, T
  ruled: queue the in-repo half now. Phase 57 stops
  `.github/workflows/build-devlog.yml` committing DevLog HTML to `main`
  for Pages to serve, and adds a check that fails if it reappears in the
  served tree — which takes the private content out of what Pages
  publishes without needing dashboard access. **This row stays open
  after Phase 57 ships.** The Cloudflare project itself (production
  domain, and the guessable per-branch
  `https://<branch-slug>.axiomancer.pages.dev` previews) still needs a
  human at the dashboard to restrict or disable; that is the remaining
  half and the reason the row does not close on the phase alone.
- **Phase 57 SHIPPED.** The in-repo half is drained: generated DevLog
  HTML/data/catalog-art are untracked and gitignored,
  `build-devlog.yml`'s commit-to-main step is deleted, `/digest` no
  longer commits generated output, and `scripts/check-devlog-not-served.mjs`
  guards against regression (pre-commit hook + weekly
  `check-devlog-served.yml`). Post-deploy, the previously-live DevLog
  URLs should 404. **Row stays open** — the Cloudflare project itself
  (production domain, guessable per-branch previews) still needs a
  human at the dashboard, per the text above.
- **CONTENT POLICY REVERSED by T, 2026-09-20 — the row's shape changes.**
  The DevLog, its evidence and the full catalog are now deliberately public
  (`plan/archive/2026-09-25-trim-t4/plan/2026-09-20-devlog-public-publish.prompt.md`), so "content labeled
  private is live on a public domain" is no longer the finding. What remains
  of this row is unchanged and still open: bearings' "no hosted web surface"
  sentence versus a Cloudflare project nobody in-repo controls, and the
  guessable per-branch previews. Both still need a human at the dashboard.
  The reversal did NOT loosen phase 57's mechanism: generated output stays
  untracked, the guard stays wired, and publication happens at deploy time
  from `dist/devlog-public/` (`npm run site:public`), a directory the guard
  now also covers. Bearings' sentence is the one record that must change
  when the second Pages project exists — filed below as a loop-call rather
  than edited blind, because the project does not exist yet.

### [docs] `skills/digest.md` §3b still reads baseline health against the win-rate doctrine curve Phase 43 retired
- category: docs
- impact: 5
- ease: 8
- detail: filed 2026-08-09 (digest). §3b instructs: "READ the new numbers
  against the locked doctrine curve (early ~80 / mid ~50 / late 25-35 /
  impossible 0, blind policy-pick): each band that moved gets a line in
  the Tuning proposals panel, and a doctrine violation ... gets a
  `plan/AUDIT.md` row." `46b5a5df` (phase 43, "objective function v2 — the
  Combat Quality Index", 2026-08-08) retired win rate as a grading term
  outright — "Win rate is not a term at all: the doctrine curve grades
  WHETHER a deck should win, CQI grades HOW the fight played, and a 0%-win
  cell scoring well is pinned as correct" — and the already-filed
  `plan/AUDIT.md` row "`/deck-tuning` and `/combat-playtest` still name
  `statusEngagement` as the objective function" flags the identical drift
  in those two skills. `skills/digest.md` was outside phase 43's file
  ownership (same as those two) and has the same problem: followed
  literally tonight, §3b would have filed a doctrine-violation row against
  early 54.5% / mid 8.3% / late 0% / impossible 0% — a live reading of a
  retired law. This digest read `combatQuality.index` instead (see the
  now-resolved CQI-baseline row above) and skipped the win-rate violation
  filing on that basis, but the skill text itself still says otherwise for
  next time.
- next: repoint §3b at `combatQuality.index` (spine/arc/width/identity
  weights, 0.40/0.25/0.20/0.15) once spec 35 or Phase 43's follow-up
  defines what "moved" or "violates" means for CQI — there is no CQI band
  yet to grade against, only the first stamped reading, so this may need a
  design ruling (what CQI range is "good") before the skill text can be
  rewritten, not just a search-and-replace of the metric name.

### [docs] Phase 44a deferred its `lexicon.json` registrations to the phases that actually rename each concept
- category: docs
- impact: 4
- ease: 8
- detail: filed 2026-08-09 by Phase 44a. The build-plan row and spec 34 §5.9
  item 2 both ask 44a to register the fifteen §5.2 renames, the six rank
  names, and the V-1 word list in `axiomancer-mechanics/docs/lexicon.json`
  right now, even though 44a ships ZERO renames. `scripts/check-lexicon.mjs`
  scans every live `.md` file outside `plan/` (except `bearings.md`) — about
  240 files — and every one of those existing rows was added at the commit
  that actually retired the concept from code, never earlier (see the four
  shipped rows' `since` dates). Registering now, while ~40 live docs
  (`axiomancer-mechanics/docs/philosophy.md`, `morality.md`,
  `keyword-atlas.md`, `card-frame-legend.md`, `combat.md`, `api.md`,
  `effects.md`, `gameloop.md`, `npcs.md`, `quickstart.md`, `testing.md`,
  `hazard-minigame.md`, `references/*`, `axiomancer-mechanics/CLAUDE.md`,
  `axiomancer-mechanics/README.md`, plus mobile docs and `.claude/`
  agent/skill prompts) still correctly describe the pre-retheme system,
  would force premature rewrites of accurate docs or blanket
  pragma-tagging dozens of files for a guard that protects nothing yet.
  **Fix:** each of 44b (the §5.2 keyword/system-term renames), 44c (the rank
  ladder), and 44g/44h (the broader V-1 prose vocabulary) adds its own
  `lexicon.json` rows in the same commit that performs its rename, and
  triages whatever `check-lexicon.mjs` then flags the normal way (fix
  wording / HISTORICAL banner / `<!-- lexicon-ok -->` pragma). See
  `plan/archive/2026-09-25-trim-t4/plan/phases/phase_44a_rename_infrastructure.md` "Decisions made upfront"
  for the full reasoning.
- update (verified via /oversight 2026-08-12): 44b and 44c followed the
  fix exactly — `lexicon.json` carries dated rows for all of R-1–R-14.
  44g explicitly documented a reasoned skip (no renames in scope, same
  reasoning as 44f). **44h shipped real renames (spec 10→GRACE, spec
  14→THE OATHS, the three alignment axes→CREED/AUGURY/TROTH,
  `src/Philosophy/`→`src/Ledger/`) and registered zero `lexicon.json`
  rows, with no documented rationale like 44f/44g gave.**
  `check-lexicon.mjs` still passes clean today only because no row
  exists to check the renamed terms against, and no live doc currently
  misuses the old names — so there's no active prose leak yet — but
  44h broke the registration discipline this row asked every renaming
  phase to follow, silently. Worth a follow-up /iterate pick: register
  44h's renames retroactively (or document why not, matching 44f/44g's
  pattern) before the next rename phase treats the gap as precedent.

### The loop's own docs still call the `Closes #N` trailer the closing mechanism
- category: docs
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 48. `skills/ship-a-phase.md:325`,
  `skills/iterate.md:315` and `scripts/loop-issue.mjs:10` describe the
  trailer as a "belt-and-suspenders backup", and `skills/iterate.md:193`'s
  issue-body template promises "this issue auto-closes when the commit
  pushes to main". Phase 48 proved the trailer is inert here and has never
  closed anything. Those sentences are now TRUE for the first time — but
  because `close-trailers.yml` runs the sweep, not because GitHub parses the
  trailer. Reword them to name the sweep, or the next reader re-derives the
  same wrong mental model this row's parent already cost five days to.

### Three mobile source comments still name cards the Profane Canon deleted
- category: docs
- impact: 3
- ease: 9
- detail: filed 2026-08-08 by Phase 42's survey, scope-checked. Comments in
  `state/combat/store-actions.ts:69`, `state/actions.ts:775` and
  `state/selectors/combat-cards.ts:13` explain the starter path in terms of
  `slippery-slope` and `brace-for-impact`, neither of which exists in the
  library since `84ef85b`. **Live code is unaffected — these are comments
  only** (checked; no runtime reference survives). Same root as the
  `combat-sim` default-loadout row above, which IS a live defect.

### `dominantCardShare` is broken post-strike-death
- category: debt
- impact: 7
- ease: 5
- detail: filed 2026-08-08 by Phase 43. The raw attribution ledger's
  `dotDamage` is filled at SUMMARY time, so the ledger itself carries direct
  damage only and collapses onto whichever signature burst last — it reads
  ~100% on nearly every matrix cell. CQI's identity term routes around it
  (cards from the sim's per-line HP swing), so the new metric is unaffected,
  but the standalone stat is wrong wherever else it is read. Left untouched
  because other suites consume it; repair is separate work.

### `npm run combat-sim`'s default loadout no longer exists
- category: debt
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 43. The default is
  `slippery-slope,brace-for-impact` — both cards deleted by the Profane Canon
  (`84ef85b`). Every default-invocation run therefore reports 0% win, 0%
  statusEngagement, cqi ~29%. Pre-existing rot, not caused by Phase 43, and
  outside its "surface the new metric additively" scope. Anyone reading a
  bare `combat-sim` run right now is reading noise.

### The Surge meter is the least-used locked system, and most rolled dice never power a line
- category: divergence
- impact: 5
- ease: 3
- detail: filed 2026-08-08 by Phase 43's first CQI reading. Chain completion
  is 35% matrix-wide (the chain breaks ~2x for every surge), the lowest
  locked sub-score everywhere; `dice-spent` is 29% against a 0.5 reference.
  **Information, not work** — bearings' "the current card library is
  transitional" rule forbids tuning against it. Re-read after the redesign.

### `/combat-playtest` still names `statusEngagement` as the objective function — HALF-RESOLVED via Phase 66 (2026-08-27)
- category: docs
- impact: 6
- ease: 9
- detail: filed 2026-08-08 by Phase 43. The skill files in `skills/` and
  `.claude/commands/` were outside that phase's ownership. They should be
  repointed at `cqi` / spec 35, or the next tuning pass will optimise the
  dead law the phase exists to retire.
- update 2026-08-27 (Phase 66): `.claude/commands/deck-tuning.md` was
  already reconciled (its §North star reads "CQI (spec 35), not the
  retired status-dominance law"). `.claude/commands/combat-playtest.md`
  was not, and Phase 66's `status-primacy-doctrine` row flagged it: its
  north-star section is now repointed at CQI and its "low status-effect
  engagement is a balance failure" closing line replaced. What remains
  open is the §Purpose comparison table's question cell ("Is status play
  the FUN path at every stage?") and the skill's own one-line description
  in the harness registry — same claim, but a rewrite there changes what
  the skill IS FOR, which wants a design call rather than a lint fix.

### The Phase-169 loadout path is dead in the shipped runtime
- category: debt
- impact: 5
- ease: 5
- detail: filed 2026-08-08 by Phase 52a. `createNewGameState` seeds only the
  2 `STARTING_CARD_IDS` loadout flags and mobile never writes loadout flags
  afterward, while `initializeCombatEncounter` calls `buildCombatDeck(player)`
  with no flags at all. 52a's loadout reconciliation is correct and tested,
  but nothing exercises it end to end. Pairs with the row above.

### `specs/README.md` has no row for spec 34
- category: docs
- impact: 3
- ease: 10
- detail: filed 2026-08-08 by Phase 42; the authoring agent's file ownership
  forbade editing the index. One-line add.

### Dead id-keyed engine hooks survive the retired spec-32 library
- category: debt
- impact: 5
- ease: 6
- detail: filed 2026-08-08 by Phase 42. Engine hooks still keyed to
  `achilles-and-the-tortoise`, `the-closing-word`, `circular-reasoning` —
  cards the Profane Canon (`84ef85b`) deleted. Dead, and now actively
  misleading: Phase 44c's build-plan row cites those same ids as its scope.
  Related stale registry rows: `SYSTEM_TERM_COVERED_BY` names a nonexistent
  `CLARITY` keyword, and mobile fixtures still deck `slippery-slope` /
  `straw-mans-jab`.

### Fixture player rebuild seeds the relic kit a real new game no longer has
- category: divergence
- impact: 3
- ease: 7
- detail: filed 2026-09-23 (docs-consistency pass after PR #360). Since
  PR #360 `createNewGameState()` seeds NO relics (the very start).
  `applyPlayer` in
  `axiomancer-mechanics/src/Game/fixtures/state-fixture.builder.ts`
  still rebuilds any fixture that overrides `level` or `baseStats` with
  `createCharacter({ ..., inventory: current.inventory,
  seedStartingRelics: true })`. So a preset-less fixture such as
  "fresh game at level 3" boots wearing the full Phase-19 kit, a state
  no real player can reach. When a preset is applied first, its
  inventory already holds relics and the rebuild prepends a second
  kit; that duplicate is unverified here. `docs/state-fixtures.md`
  describes the code accurately; the code and the new-game contract
  disagree.
- next: decide whether a fixture rebuild should mirror the real start
  (no kit unless the preset supplied one) and add a builder test
  pinning the choice. Not fixed in the docs pass (code, out of scope).

### 2026-07-20 missing-layers survey — unpromoted findings (audio, settings, a11y, perf, flags, save export)
- category: gap
- impact: 5
- ease: 3
- detail: filed 2026-07-20 (owner missing-layers survey session; "file
  the residue"). The session surveyed all cross-cutting infrastructure
  layers; the owner promoted TWO (in-house crash capture → candidate;
  central juice layer → Phase 38) and deliberately did NOT promote the
  rest. Recording those findings here as signal, NOT as candidates —
  the owner saw this list and chose; do not self-promote, let `/expand`
  re-propose when context changes. The unpromoted findings:
  (1) **Audio — fully absent.** No expo-av/expo-audio, no SFX/music/
  volume anywhere; haptics (~20 call sites) are the entire sensory
  layer. The biggest player-facing absence for a mobile game.
  (2) **Settings screen — absent.** No settings route; theme switching
  lives in the SELF tab (`components/ThemeSwitcher.tsx`); nowhere to
  put audio volume, a11y toggles, or data management. Partially blocks
  (1) and (3).
  (3) **A11y depth.** Reduced-motion + a11y labels exist; font scaling
  (`allowFontScaling` largely unused), color contrast, and screen-
  reader flow validation do not (`specs/12-accessibility-and-theming.md`
  is the spec surface).
  (4) **Feature-flag registry.** Flags are scattered per-feature
  env + `__AXM_*` global reads (`state/combat/flags.ts` the pattern);
  fine at ~3 flags, painful at 10; no central registry.
  (5) **Perf instrumentation.** One perf regression test + font-bundle
  splitting exist; no frame-budget hooks, no bundle-size CI gate.
  (6) **Save export/backup.** Single-slot save is mature (migrations,
  corruption modal) but there is no manual export/backup/restore.
  Deliberate non-goals confirmed same session (do not re-file): product
  analytics, i18n (copy doctrine cuts against it), backend/auth/cloud
  saves (offline by design, `plan/bearings.md` § Auth).
- next: /expand — re-propose individual items as candidates when their
  blockers move (a settings screen unlocks audio + a11y toggles; the
  flag registry becomes worth it at the next 2-3 flags).
- update 2026-09-23 (PR #360): (2) **settings screen now exists**
  (`/settings`; the theme picker moved there from the SELF tab) and (3)
  gained a **text-size** step plus a reduced-motion override. (1) audio
  is still absent — music/SFX volumes are persisted but nothing plays.
  (6) saves are now **three slots** (`@axiomancer/save:v2:slot-*`);
  export/backup is still absent. (4) and (5) unchanged. Row stays open
  for (1), (4), (5), (6).

### hazard/gathering "paradox-token" reward vocabulary outlives the card category — OWNER CALL MADE 2026-08-08: rename to QUANDARY
- category: divergence
- impact: 2
- ease: 4
- **decision (owner, /oversight 2026-08-08 — this row is no longer a
  `[needs-user-call]`, it is a ready-to-ship /iterate row):** RENAME, do
  not remove and do not leave. The reward economy stays exactly as it is;
  only the vocabulary changes. **"paradox token" → "QUANDARY".** Removal
  was explicitly declined — the token is a live reward tail in two
  minigames, so deleting it is an economy change needing its own phase,
  not an /iterate row. Leaving it was declined too: the word points at
  nothing in the game after phase 37.
- rename target vetting (done at the call): `quandary`, `conundrum` and
  `sophism` are all zero-hit across `axiomancer-mechanics/src`,
  `axiomancer-mobile/state` and `axiomancer-mobile/components`, so none
  collides. `aporia` was ruled OUT — it is already W-01's continent
  (`specs/world/W-01-aporia-labyrinth-continent.md`) and also appears in
  C-01 and spec 32. QUANDARY chosen: same cold/archaic register, no
  collision, and it means what the paradox token meant without pointing
  at a retired card category.
- scope when /iterate takes it (5 sites, all mobile, no engine change):
  `HAZARD_TOKEN_FLAG_PREFIX` + its doc comment
  (`state/hazard/store-actions.ts` ~L76/L484), the gathering flag prefix
  + doc comment (`state/gathering/store-actions.ts` ~L64/L269), the two
  reward blurbs `+${r.amount} paradox token(s)`
  (`state/presenters/hazard.engine.ts` ~L369,
  `state/presenters/gathering.engine.ts` ~L241), and the
  `case 'paradox'` glyph (`components/hazard/glyphs.tsx`). Persisted
  flag prefixes are save-visible — check whether the change needs a
  `GAME_STATE_VERSION` migration before renaming the prefix strings, or
  keep the prefix and rename only player-facing copy. Re-grep first;
  distinguish from the `arrow-paradox` card id and `Item.category`
  (both unrelated, both stay).
- detail: filed 2026-07-18 (phase 37 planning residue). Phase 37 retires
  the `fallacy`/`paradox` card **category** + the dead `combatResources`
  token pool, but deliberately leaves the separate hazard/gathering
  **reward** system that still speaks "paradox": `HAZARD_TOKEN_FLAG_PREFIX`
  = `'hazard-token-banked:'` + the `token` reward doc'd as banking a
  "paradox-token flag" (`axiomancer-mobile/state/hazard/store-actions.ts`
  ~L76-77/L484, `state/gathering/store-actions.ts` ~L64/L269), and the
  reward-blurb strings "+N paradox token(s)"
  (`state/presenters/hazard.engine.ts` ~L369, `gathering.engine.ts` ~L241,
  `components/hazard/glyphs.tsx` case `'paradox'`). These are a live reward
  token, NOT the removed card category — but once phase 37 lands, "paradox"
  survives ONLY as this reward vocabulary, which will read as an orphaned
  reference to a concept the game no longer has. needs-user-call: rename the
  reward token (to what?) vs. remove it vs. leave it. Do NOT bundle into
  phase 37 (owner scoped it out). Re-grep before acting; distinguish from the
  `arrow-paradox` card id (unrelated) and `Item.category` (unrelated).
- next: /iterate — the owner call is made (rename → QUANDARY); execute it.

### `deploy:check` is unusable from remote web sessions — 401 "Token rejected"
- category: debt
- impact: 4
- ease: 5
- detail: filed 2026-07-18 (oversight session residue). Running
  `npm run deploy:check` from a Claude Code web session fails with
  `GitHub Actions API error: 401 Unauthorized / Token rejected` — the
  script needs the repo-scoped `GH_TOKEN` from `.env`, which is
  gitignored and absent in remote containers. The session fell back to
  the GitHub MCP Actions API (which authenticates fine) to confirm
  CI-green, but nothing records that fallback, so every skill step that
  says "run `npm run deploy:check`" (oversight §7, ship-a-phase §10,
  bearings' deploy gate) silently dead-ends in web sessions. Fix
  options: teach `scripts/deploy-check.mjs` to fall back to a
  `GITHUB_TOKEN`-style env var when `GH_TOKEN` is absent, and/or state
  the MCP fallback in bearings' deploy-gate section so remote sessions
  know the sanctioned path.
- next: /iterate (deploy-check.mjs env fallback + a bearings note)

### Worktree sessions resolve the wrong TypeScript — mechanics verify gate fails with TS5095
- category: debt
- impact: 4
- ease: 7
- detail: surfaced 2026-07-17 during the starter-deck-presets rename.
  `npm run verify` in `axiomancer-mechanics` fails from any
  `.claude/worktrees/*` checkout with `TS5095: Option 'bundler' can
  only be used when 'module' is set to 'preserve' or es2015+`. Root
  cause: the mechanics tsconfig (module `commonjs` +
  moduleResolution `bundler`) is accepted by TypeScript 6.0.3
  (installed at `axiomancer-mechanics/node_modules`) but rejected by
  5.9.3 (repo-root `node_modules`); worktrees have no local install,
  so Node walks up past the worktree into the root and picks 5.9.3.
  Every worktree session must hand-invoke the 6.0.3 `tsc.js` to run
  the gate. Fix options: align the root TypeScript devDependency to
  6.x, make the tsconfig valid under both (e.g. module `preserve` or
  moduleResolution `node`), or install per-worktree. A task chip was
  also filed from the session.

### Playtest harness has no victory-only rounds-to-victory metric
- category: gap
- impact: 4
- ease: 7
- detail: surfaced 2026-07-17 by the ultracode price-vs-win-rate
  playtest. `CombatSimStats.avgRounds`
  (src/Combat/combat.encounter.sim.ts) averages `state.round` over ALL
  outcomes (defeats + retreats included), so there is no way to answer
  "how many rounds to WIN" — the owner asked exactly that and it forced
  a bespoke harness
  (axiomancer-mechanics/scratch/price-experiment/price-winrate.harness.ts)
  that re-derives it from per-run `runOneEncounter` returns. The raw
  `rounds`+`outcome` already exist per run; they are just discarded at
  aggregation. Add `avgRoundsToVictory` (victory-only, null when ~0
  victories) to `CombatSimStats` + the stage summary so kill-speed is a
  first-class witness for /deck-tuning. Related: the "Doctrine-curve
  check in the nightly baseline" candidate (PHASE_CANDIDATES.md) would
  absorb this harness's per-stage cells — this is the engine-side metric
  that check depends on. (The other residue of this session — the
  mid-collapse quartet foundry/standstill/grace/augury ≈0% mid, and the
  tempo/alt-win pricing conclusions — is already tracked there and in
  Phases 36a/36b, so it is not re-filed here.)
- next: /iterate (retain victory-only rounds in
  simulateHazardPatternCombatDetailed; surface in PlaytestStageSummary +
  the report formatter)

### Telemetry attribution is best-effort; CI logging path unverified
- category: debt
- impact: 3
- ease: 4
- detail: TELEMETRY.md (shipped 2026-07-17, commit 03969cea) scrapes
  model and main-vs-subagent from the transcript tail because hooks
  don't expose either directly — expect `unknown` cells and possible
  misattribution near sidechain boundaries; a call racing a sidechain
  boundary can be attributed to the wrong side. Also unverified: in
  cloud ticks, skills arrive as '/command' prompts and should land as
  slash-prompt rows via UserPromptSubmit — confirm rows appear (and
  ride the tick's commit) after the first few cloud runs. If the
  harness later exposes agent id / model in hook input, replace the
  transcript-tail scrape in .claude/hooks/telemetry.mjs.
- next: /iterate (verify after next cloud tick; upgrade when harness
  allows)

### kb-query MCP could surface kb/ sync age
- category: gap
- impact: 2
- ease: 8
- detail: kb-sync.mjs now stamps kb/.sync-meta.json (2026-07-17) and
  the session-start hook reports age, but design sessions that go
  straight to the kb-query MCP server / skill never see it. Adding the
  stamp's age to kb_overview output (and a staleness warning >14d)
  would put corpus freshness in front of the consumer that actually
  cites it.
- next: /iterate

### [1.2] Skipped enemy stat-budget test (content decision — RESOLVED via oversight 2026-07-08)
- category: content
- impact: 4
- ease: 3
- detail: `src/Enemy/e2e/new-enemies.engine.test.ts` skips its
  `enemyStatBudget` assertion — the 30 authored enemies match the
  budget at levels 1-4 but drift up to 2x at level 50 (authored
  under old constants with gear-tier scaling baked into raw
  stats). Decision (via `/oversight` 2026-07-08): the budget curve
  is canon; the 30 authored enemies need re-authoring to comply
  (reconstruct per-enemy gear-tier inputs so raw stats match the
  budget formula through level 50), then unskip the assertion.
  Promoted to `plan/PHASE_CANDIDATES.md` as a real content phase —
  see "Enemy stat rewrite to budget-curve compliance".
- next: /oversight (promote candidate to a build-plan phase when
  queue has room)

### [2.0] Mobile `as any` clusters at the state boundary
- category: debt
- impact: 4
- ease: 5
- detail: cast clusters at state/test boundaries, esp. the
  `state/actions.ts` engine-store bridge. Recurring drain target,
  not a single fix.
- update (verified via /oversight 2026-08-12): the originally-cited
  `state/actions.ts` bridge is now clean of live `as any` casts (only a
  resolution comment remains, citing the [2.5] event-audit fix);
  `event.engine.ts` and `exploration.engine.ts` show the same pattern.
  Remaining `as any` in `axiomancer-mobile/state/` is almost entirely
  test-file mock casts plus one production line
  (`state/persistence/migrations.ts:50`). Staying open as the
  recurring-drain bucket it was always framed as, not because the
  cited example is still broken.
- next: /iterate

### [1.6] Mobile accessibility gaps
- category: a11y
- impact: 4
- ease: 4
- detail: focus management + a11y labels surfaced repeatedly in
  prior critique. Ongoing drain.
- next: /iterate

### [1.5] Unbounded keepsake/death flag growth on long saves
- category: debt
- impact: 3
- ease: 5
- detail: `night-keepsake:`, `hazard-scar:`, `hazard-death:`,
  `gleaning-token-banked:` accumulate with no consumer/cap. A
  long-save soak test could trip on this.
- next: /iterate

### [1.5] `HazardBoard.tsx` file-length outlier (~815 lines)
- category: debt
- impact: 3
- ease: 5
- detail: extraction candidate; several other mobile files are
  length outliers. Extract sub-components with their own tests.
- next: /iterate

### [2.1] Two agent-e2e walkthroughs describe a deleted engine surface
- category: gap
- impact: 3
- ease: 7
- detail: spotted 2026-07-10 during the `/consolidate` terminology
  sweep design (phase 25). `axiomancer-mechanics/automation/scripts/
  walkthroughs/skill-learning.goal.md` names
  `learnSkill(character, skillId)` from `src/Skills/skill.engine.ts`;
  `tier2-skill-chain.goal.md` narrates `executeSkill`/`basePower` in
  the same retired vocabulary (`base-power` and `src-skills-path` are
  both live `lexicon.json` rows for exactly this concept). Neither
  `src/Skills/` nor `learnSkill` exist in `axiomancer-mechanics/src`
  today. Both files sit in `automation/`, a lexicon-exempt
  dated-record zone, so `check-lexicon` never sees them, and their
  paired `.json` scripts may already be dead too (`node
  automation/agent-e2e.mjs skill-learning` / `tier2-skill-chain`
  would confirm). Left un-deleted per the janitor mandate's
  suspected-dead-file rule — the automation/README.md inventory
  table and the harness owner should confirm dead-vs-superseded
  before removal.
- next: /iterate
- update (`/iterate` investigation, 2026-09-11, no code shipped — this
  tick's one fix went to the [1.8] tray-die a11y row instead): confirmed
  dead, not superseded — `axiomancer-mechanics/docs/lexicon.json`'s own
  `retired` registry (`src-skills-path`, since "2026-07 (PR #48 deleted
  the dead src/Skills/ ability system; see CHANGELOG 'De-conflation')")
  already rules this: the whole `src/Skills/` tier-ability system
  (`learnSkill`, `executeSkill`, `SkillLookup`, `skillLibrary`) is gone
  from `src/`, replaced by the SignatureSkill family (a separate living
  concept). Both goal.md/json walkthrough pairs are safe to delete next
  pick, per the row's own scoped ask. **Wider scope found while
  checking:** `learnSkill`/`executeSkill` are NOT confined to these two
  automation files — `README.md`'s Skills feature-table row,
  `docs/testing.md`, `docs/oaths.md`, and specs 06/14/25/31 all still
  describe the retired system in detail, several citing Phase
  30-66-numbered work as if current. That is a much larger, higher-risk
  doc-rewrite than this row's "two automation files" framing (touches
  the canonical feature-table, not a lexicon-exempt dated-record zone)
  — filed here rather than attempted blind; a future pick should treat
  the automation-file deletion and the README/specs rewrite as two
  separate scoped fixes, not one.

### [content] The title screen still shows the painted "AxiomanceR" wordmark after the Phase 67 rename
- category: content
- impact: 6
- ease: 2
- detail: filed 2026-08-27 by Phase 67. The rename to "Miserere Mei, Deus"
  shipped everywhere it could reach as a string — store/web metadata, CLI
  banners, published site chrome, the doc set. The one surface it cannot
  reach is the one a player actually sees first: the title screen's wordmark
  is painted into `axiomancer-mobile/assets/images/title-embark.jpg`
  (1024x1024 key art, wordmark near the top edge), and
  `components/TitleScreen.tsx` renders that image with `contentFit="contain"`
  specifically so the painted "A" and "R" are not cropped. There is no text
  node to rename. Net effect today: the browser tab and store listing say
  "Miserere Mei, Deus" while the first screen says "AxiomanceR".
- next: new key art carrying the new wordmark, through the art pipeline
  (build-plan Phases 71 / 73). A text-overlay stopgap is NOT the fix — it
  would double the wordmark against the painted one. Until then this is a
  known, deliberate inconsistency, not drift.

### [tooling] The card editor's restored fields have no form controls
- category: tooling
- impact: 3
- ease: 5
- detail: filed 2026-08-27 by Phase 69. That phase made `theme`,
  `persistentEffect`, `paidSummary`, `intentionallyAsymmetric` and `glyph`
  survive an editor save, and the round-trip test holds them there. What it did
  NOT do is give them editing UI — they round-trip verbatim from the source
  literal. So a card's theme or paid line can only be changed by editing
  `cards.library.ts` by hand, which is a strange seam in a tool whose whole
  purpose is to avoid that.
- next: form controls for the four with obvious shapes (`theme` a select over
  `CARD_THEMES`, `paidSummary` and `persistentEffect` text areas,
  `intentionallyAsymmetric` a checkbox). `glyph` needs a design call first —
  it is a discriminated payload union with a cap, and no live card uses it.

### [content] "Blank Indenture" violates NL-8 and is grandfathered, not renamed
- category: content
- impact: 2
- ease: 7
- detail: filed 2026-08-27 by Phase 70. The naming-law sweep that phase wired
  into CI found exactly one violation across 114 shipped card and enemy names:
  the card "Blank Indenture" begins with BLANK, a locked die-face word, which
  NL-8 forbids ("a name may not be or begin with a locked/registry word"). The
  card shipped before the naming law existed. Phase 70 put it on
  `GRANDFATHERED_NAMES` in `scripts/check-naming-law.mjs` with its reason, so
  the gate protects every new name while this one stays visible — the sweep
  prints the exemption on every run rather than hiding it.
- next: rule on the rename. It is a small, player-visible content change (the
  card name plus one reference in `recoil-x.engine.test.ts`), and the name
  carries real meaning — a blank contract — so a replacement should keep that
  ("Unwritten Indenture", "Unsigned Indenture") rather than reach for a new
  image. Removing the entry from GRANDFATHERED_NAMES is what closes this row.

### [tooling] `guard.mjs` greps the whole command string, so quoted text trips its rules
- category: tooling
- impact: 4
- ease: 5
- detail: three confirmed instances of one shape. The 2026-08-22 content-pipelines
  audit found two: an emoji inside quoted CARD TEXT read as a commit-trailer
  violation, and `backgroundedGate`'s regex catching any command containing the
  word "test". A third hit 2026-08-27 during Phase 72: a `git commit` was
  rejected for a forbidden push flag that appeared only as QUOTED PROSE inside
  the heredoc message — the brief was documenting which verbs stay denied. The
  guard cannot tell a command from text inside a command.
- why it matters: each instance costs a retry and teaches the loop to avoid
  writing about the rules it enforces, which is the opposite of what the plan
  files are for. The failure is silent-ish (a blocked tool call, not a wrong
  result), so it accumulates rather than being fixed.
- next: parse before matching. The push-flag and trailer rules should apply to
  the command's own argv, not to heredoc bodies or `-m` message contents; the
  `-m` body already has its own dedicated lint pass, so the general grep can
  exclude it. `backgroundedGate` should match a test COMMAND, not the substring.

### [tooling] Concurrent `/march` ticks race for the same build-plan phase
- category: tooling
- impact: 5
- ease: 6
- detail: observed 2026-08-27. A local `/loop /march` and the scheduled CI
  `/march` both picked Phase 74 within ~30 seconds of each other. Both wrote a
  brief (`phase_74_north_star_ratification.md` and
  `phase_74_north_star_into_spec.md`); the CI tick also opened mirror #252. The
  local tick noticed on its push rejection, yielded, and deleted its duplicate
  brief — but only because the push happened to race. Had both pushed cleanly,
  two agents would have edited spec 34 §2 concurrently.
- root cause: `ship-a-phase` picks "the first `[ ]` row" with no notion of a
  claim. The mirror issue is a perfect claim token — it is opened at start and
  closed at ship — but it was only ever consulted as find-or-create, never as
  "is someone else already here?".
- MITIGATED 2026-08-27: `skills/ship-a-phase.md` gains Step 2.4, a claim check
  that reads the open mirror before building and dispatches past a phase
  another tick started in the last ~2 hours. An older open mirror is adopted
  rather than skipped, so a crashed tick still gets finished.
- residual: the check is advisory (a skill instruction, not a lock) and has a
  ~30-second race window of its own — two ticks that check simultaneously both
  see no mirror. Closing that properly needs an atomic claim, e.g. the mirror
  opened BEFORE the brief is written and treated as a lock. Left open: the
  cheap fix covers the observed failure, and a real lock is a bigger change to
  a flow that is otherwise working.

## Done

### [x] Map revamp owner ballot — four calls before M1 — RESOLVED 2026-09-25
- filed 2026-09-25 (T5 residue). Answered by T in the kickoff session as
  D21–D24 (four new Act 1 maps; plain 2× resize; coast → forest → mountains
  → underworld; the underworld's vault door, open on arrival), plus D25 (a
  node on every landmark). Moved here per D9.

### [x] `RELEASES.md` and `CHANGELOG.md` describe the retired `healFraction` as current — RESOLVED by archiving
- filed 2026-08-08 by Phase 52b (docs, impact 2, ease 9). Both logs are now
  archived with a HISTORICAL banner: `RELEASES.md` in trim T1,
  `CHANGELOG.md` in trim T5 (2026-09-25,
  `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/CHANGELOG.md`). No
  live file describes `healFraction` as current.

### [x] [3.2] `CardSpecialMechanic` deprecated-name not exported — stale/resolved
- drained 2026-07-14 via scheduled oversight: current `main` exports
  `CardSpecialMechanic` from both `axiomancer-mechanics/src/Cards/index.ts`
  and the package barrel `axiomancer-mechanics/src/index.ts`. The root
  three-workspace `npm run verify` gate passed at `96421aa8`, confirming
  the preferred import is live for package consumers.

### [x] [world] Map-event content has no coverage guard against unreachable authoring — RESOLVED via Phase 53a
- source: first-map audit 2026-08-08 (finding F5). `fv-1` carried a fully
  authored encounter pool that no player could ever see, because map events
  fire on ARRIVAL and `createMapState` places the player ON the start node.
  It sat there undetected across at least two content passes, and the
  all-25-nodes pool test passed the whole time — it drives `resolveMapEvent`
  at each node id directly, which proves the pool is REGISTERED, not that a
  player can reach it.
- the general defect: nothing asserts that authored content is reachable by
  legal play. `auditMapTraversal` (shipped in the same pass) now walks every
  legal route and could answer this — a test that intersects "nodes any route
  can visit" with "nodes carrying a pool" would have caught fv-1 immediately,
  and would catch the next one.
- scored low-ease/high-impact: the walker exists, so this is one test file.
  Left unfiled as a fix only because the audit pass had already closed the
  live instance and adding a second invariant belonged in its own tick.
- resolved 2026-08-16 via Phase 53a: the same defect, widened from node
  topology to NPC dialogue. `auditNarrativeReachability` (`src/World/
  narrative-reachability.ts`) cross-checks every `interaction` node's
  `npcName` against its map's roster and flags rostered NPCs no node routes
  to; a registry-wide hermetic test
  (`src/World/e2e/narrative-reachability.engine.test.ts`) asserts the
  invariant holds across `MAP_REGISTRY`. The narrative-encounter audit
  (2026-08-09) found this had already claimed eleven of fourteen authored
  dialogue trees on the coastal maps — `nf-7` named a nonexistent 'Forest
  Hermit' instead of the rostered 'Hermit Sage', and `nf-14`/`nf-23` named
  scenery ('Ancient Stone Marker', 'Echo Stone') as if they were people.
  All three are fixed; `fv-19` stays a declared exception until Phase 53c
  reclaims it. `MapDefinition.unstagedNpcs` lets a map declare an NPC as
  deliberately not-yet-placed (with a reason) so the guard can tell that
  apart from a lost NPC.

### [x] fishing-village CLI + spec08 e2e drive legacy combat — RESOLVED (mislabeled header fixed via /oversight 2026-08-12)
- drained 2026-07-03 (monorepo cleanup): stale — the legacy
  `resolveCombatRound` no longer exists anywhere in
  `axiomancer-mechanics/src`; no fv-15/spec08 script remains in
  package.json. The finding predated the resolver removal.

### [x] Hazard v2 engine ownership (DIV-MECH-002) — RESOLVED (mislabeled header fixed via /oversight 2026-08-12)
- resolved via `/oversight` 2026-07-03: mechanics absorbs
  mobile's duplicate `state/hazard/` engine. Promoted to
  `plan/PHASE_CANDIDATES.md` -> build plan Phase 13, shipped
  (re-verified live via /oversight 2026-08-12: `01_build_plan.md`
  Phase 13 is `[x]`, mobile's local hazard engine is gone).

### [x] [2.0] `combatMana` slice deprecated but still load-bearing — RESOLVED (mislabeled header fixed via /oversight 2026-08-12)
- drained 2026-07-08 (build-plan Phase 7): stale — the slice was
  actually retired by mobile commit `6ef5f989` (2026-06-20,
  "remove the vestigial client mana model") and its container
  (`state.combat`) fully removed by `160ae907`/mechanics `4cb504a5`
  (2026-06-30/07-01). "Phase 156" was never the migration (that
  number is the unrelated status-effect interaction engine); the
  audit row was carried into the monorepo re-onboard without being
  re-validated against code that had already changed nine days
  earlier. No live `combatMana` reference remained; Phase 7 deleted
  the one dead type (`CombatManaState`) and fixed four stale
  comments still narrating the retired slice.
