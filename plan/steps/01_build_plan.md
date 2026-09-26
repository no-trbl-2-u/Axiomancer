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
Tick in this file in the same commit that ships the phase. Shipped rows
are one line (title + commit hash); the full text of every row collapsed
in TRIM THE FAT T4 (2026-09-25) lives verbatim in
`plan/archive/BUILD_PLAN_2026.md`.

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
- [x] Phase 0 — nexus methodology adoption (`chore: adopt nexus methodology`)

**Next up (autonomous loop's queue):**

- [x] Phase 79 — Doctrine lexicon (eb779017)
- [x] Phase 80 — Naming pass: one concept, one word across player-facing surfaces (69c68db6)
- [x] Phase 81 — Late-campaign difficulty cliff (ff9d405e)
- [x] Phase 82 — Glossary reachability: mount tooltip targets on the hazard deck's 14 keyword chips (ee8bf2e5)
- [x] Phase 83 — Combat arena backdrop (cb3b1c97)
- [x] Phase 84 — The Capital: attended `/world-spec` session (5fad261e)
- [x] Phase 85 — Equipment progression (9f313d0c)
- [x] Phase 86 — Engine hook sweep: delete the 19 orphaned `zoneHas` sites in `combat.engine.ts` (7cd4119c)
- [x] Phase 87 — Early-game encounter smoothing (2227fe9c)
- [x] Phase 88 — W5 art adoption (ebb457f4)

- [x] Phase 89 — Art-direction coherence (6137ca5b)
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
- [x] Phase 91 — Amber-CI tick recovery (3f50d663)
- [x] Phase 92 — `march` workflow job ceiling (d7cc91d7)
- [x] Phase 93 — Card-base reconciliation (e0107985)
- [x] Phase 94 — `critique:drive` artifact scope (a438d344)
- [x] Phase 95 — UI fresh-eyes six: ship the six product decisions accepted via `/oversight` 2026-09-15 (2aa77567)
- [x] Phase 96 — Consumable desperation band (417b931)
- [x] Phase 97 — Hand-fan name legibility: the mobile combat hand covered its own card names (cecae8f)
- [x] Phase 98 — Worklet guard in CI (51fede4)
- [x] Phase 99 — A returning player can actually return (fd83aa0)
- [x] Phase 100 — The map tells the truth (42d2ba2)
- [x] Phase 101 — Region arena plates (e4e2704)
- [x] Phase 102 — SUMMON, the add-spawning enemy archetype (e333fbb)
- [x] Phase 103 — The last two arenas: the acquisition pipeline learns to crop a plate off a scanned page (e333fbb)
- [x] Phase 104 — The grey office and the keyword pull (510953cf)

**THE MAP REVAMP — the rest of Act 1's maps** (T, 2026-09-26). Brief for
every row: `plan/2026-09-25-map-revamp-m3.prompt.md` (§1 rulings, §2 phase table, §3a the M3a
pattern to copy). Generate `plan/phases/phase_<id>_<topic>.md` from its §2
row. D26's name picks are already made (brief §1), so no row below needs T.
**Order is strict:** each row requires the one above it ticked `[x]` on
`main`. If it isn't, skip the row this tick (they touch the same registry,
event-pool and layout files).
- [x] Phase M3b — The Charcoal Wood (#389)
- [ ] Phase M3c — The Beacon Crags: Act 1 map 3 on the mountain plate, under `northern-continent` (the first cross-continent step in Act 1). Requires M3b `[x]`. The Charcoal Wood's door (`cw-20`, the stair cave) leads here; this map's door leads to fishing-village. Copy M3b's pattern (brief §3b).
- [ ] Phase M3d — The Lantern Deep: Act 1 map 4 on the underworld plate, under `northern-continent`. Requires M3c `[x]`. The Beacon Crags' door leads here; this map's door leads to fishing-village. Halo the node marks (densest, darkest plate) and check with `verify:visual`.
- [ ] Phase M4 — The Labyrinth door (D24): the Lantern Deep's `vault-door` node enters the Aporia through `enterLabyrinthAction`'s snapshot and return path, with a hermetic enter/return/resume test. Requires M3d `[x]`.
- [ ] Phase M5 — Map docs: rewrite `docs/world.md`'s stale sections and `skills/forge.md`'s column-layering line for D16's shape and `MapSheet`. Requires M3d `[x]`; may ride with M4.

**Field evidence blockers (direct T promotion):**
- [x] Phase 14 — First-map route audit and survivorship semantics (9180fa5d)

**Calibration (small, low-risk — prove the loop works in this repo):**
- [x] Phase 1 — Combat test-coverage backfill (0af106ff)

**Engine depth (status-effect doctrine):**
- [x] Phase 2 — Projected-lethality readout API (128659e0)
- [x] Phase 3 — Enemy combat-phase progression / "rage mode" (e87559d0)
- [x] Phase 4 — Balance-sim population witnesses for the HP kill-paths still lacking pop-level coverage (d9763659)

**Mobile surfaces (presenter-only, low engine risk):**
- [x] Phase 5 — Village SELL tab: surface the engine's `sellItem` / `defaultSellPrice` (98e7b2bc)
- [x] Phase 6 — Memoir run-history surface: read-back of deaths (48d2c802)
- [x] Phase 7 — `combatMana` -> engine `combatResources` migration (bdca1068)

**Content pipeline:**
- [x] Phase 8 — Northern Forest region content extension (3bb6eeaa)
- [x] Phase 9 — Author the first real character/story/world specs (7ea06a6e / 6fa7f090)

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

- [x] Phase 18 — 5-slot equipment model (5e4ca6e0)
- [x] Phase 19 — Equipment-granted signatures + the 8 signet relics (fbf3d52c)
- [x] Phase 20 — Decouple equipment from effects (8907c08f)
- [x] Phase 21 — Retire the procedural equipment library (51c2cb51)
- [x] Phase 23 — Teardown of dead equipment machinery (e4d02d21)

**Cross-cutting / debt:**
- [x] Phase 10 — Multi-screen integration test harness (7692758e)
- [x] Phase 11 — Tutorial / onboarding flow (1fb1d7f8)
- [x] Phase 12 — Doc-sync pass: reconcile `spec.md` / `docs/combat.md` with the shipped engine surface (cb5c6467)
- [x] Phase 13 — Hazard v2 engine port (9d279c13)
- [x] Phase 15 — Hazard first-crossing tutorial (0e03ee02)
- [x] Phase 16 — Loot-Cache ("The Reliquary") first-delve tutorial (95f67302)
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

- [x] Phase 22 — Mechanics CLI verify-gate coverage (01a3d2ed)

**Docs/harness integrity (T-directed 2026-07-10):**

- [x] Phase 24 — axio-query: MCP surface over the live engine data (7a33efbc)
- [x] Phase 25 — /consolidate memory curator + 2026-07-09 harness re-apply (f7868e2a)

**Engagement-overhaul roadmap (promoted via `/oversight` 2026-07-10 —
owner-ratified 2026-07-10, all four decision gates cleared; ship in
order, intra-batch gates noted per phase):**

- [x] Phase 26 — The Turn Law (f849c5a2 / 6ea123fc)
- [x] Phase 27 — Re-baseline (30e43eb2)
- [x] Phase 28 — Show the Engine (60af3044)
- [x] Phase 29 — The Language (cc39fb5f)
- [x] Phase 30 — FREE Lines (5e723df3)
- [x] Phase 31 — The Roll and the Read (380e3849 / 48c89f34 / 040202fd)
- [x] Phase 32 — Theme Deep Work (10 part commits, 7392573c … 801e2d26)
Phase 33 — Enemy Answers (specs 29/30 slice + enemy counterplay).
SPLIT into shippable slices via oversight 2026-07-16 — the single
mega-brief bundled ~6 verbs and carried the Phase 32 stall risk on
oversized ticks. Each slice below must finish and commit on its own
tick. Shared sources: `plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-turn-texture.md` §3 +
`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-theme-identity.md` §1 +
`plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-10-out-of-flow-mechanics.md` §2. All gated on
Phase 26 (numbers) but design-independent of the owner session
(mechanics).

- [x] Phase 33a — Reactive-verb core (69b2ccf1)
- [x] Phase 33b — Enemy archetypes + variable-rung telegraphs (8ceb86e5)
> **Owner priority 2026-07-18:** all remaining D-sequence phases ship
> before 33c/33d. Their pending rows are ordered after D7 below so `/march`
> cannot dispatch them early.

**Critique infra (promoted via `/oversight` 2026-07-10):**

- [x] Phase 34 — Non-MCP transport for unattended `/critique` (eab8429a)

**Loop infra (promoted via issue-triage 2026-07-14):**

- [x] Phase 35 — Reliable phase-issue auto-close (59cf9e6e)

**Pricing model (promoted via chat session 2026-07-17, T direct):**

- [x] Phase 36a — Alt-win-aware card pricing (7d26bebd)
- [x] Phase 36b — Tempo-aware card pricing (1927b15e)

**Combat rework (promoted via chat session 2026-07-17, T direct — spec 33
`33-upgradeable-dice.md`):** the four-die Upgradeable-Dice rework. Promote as
a SEQUENCE with per-phase gates. D1 is a thinking/review gate (no code, safe
to run live); **D2+ touch the engine — pause the `/march` + night crons
before starting them** (collision discipline). D1 also owns reconciling the
supersession collisions before any engine work.

- [x] Phase D1 — Upgradeable-Dice spec review-and-land (4adf7266)
- [x] Phase D2 — Engine core, flagged (18cf5e3b)
- [x] Phase D3 — Sim harness + economy derivation (61bbc8ca)
- [x] Phase D4 — Pricing re-derivation + card re-authoring (0e3bd2bb)
- [x] Phase D5 — Die gear + blacksmith (a25373be)
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
> the flag is bundle-time only). Parent brief `plan/archive/2026-09-25-trim-t4/plan/phases/phase_D6_mobile_ui.md`
> stays the north star; each sub-phase renders spec-33 rules AS-IS by EXTENDING
> the existing `STANCE_COLORS`/glyph/#5-SIDE-RAIL conventions (never forking),
> flag-gated so flag-off stays byte-identical.
>
> **D6e added via /oversight 2026-07-18** — a fifth D6-band row that is
> NOT mobile: enemy stanceCheck content (yield-lever), draining D3-F2.
> Parallel-safe with D6a–d, hard dep of D7. Listed after D6d below.

- [x] Phase D6a — Flag-on combat render core (311e2c3c)
- [x] Phase D6b — Momentum/stance chips + stance-check telegraph + gear rail (4cf7b752)
- [x] Phase D6c — Blacksmith screen (7c315d5f)
- [x] Phase D6d — Flag-on combat e2e (7af8dbc8)
- [x] Phase D6e — Enemy stanceCheck telegraphs (0b29ff42)
- [x] Phase D6f — The Roll Ritual (10ffe174)
- [x] Phase D7 — Tuning, ratification + honest re-baseline (701762bd)

- [x] Phase D-FLIP — Upgradeable Dice is the default player and balance-witness model (app-layer flip ae51ab3d; resolved by T 2026-07-23)
- [x] Phase D8 — One dice valve in every starter preset (10ec4fe8)
- [x] Phase D9 — Authored stance-check variety (2848fb6a)

**Post-D sequence (owner-deferred until every D phase ships, 2026-07-18):**

- [x] Phase 33c — THE COVETED DIE (fc7fddbf)
> **March order (set via /oversight 2026-07-20):** of the three unchecked
> phases, ship **Phase 37** (retire fallacy/paradox — independent, low-risk
> teardown) NEXT. Then Phase 38 (juice layer, owner-selected — now also
> carries the used-dice grey-out jot, see its brief). Phase 33d (GLYPHS
> pilot) last of the three.

- [x] Phase 33d — GLYPHS pilot (ac1853b2)

**Legacy-combat cleanup (owner-directed 2026-07-18, chat — ships on its own
branch, parallel to the D-sequence; does NOT preempt the D-sequence march
order):**

- [x] Phase 37 — Retire the fallacy/paradox card category + the dead `combatResources` token pool (5137511c)

**Mobile feel layer (promoted via chat session 2026-07-20, T direct —
missing-layers survey):**

- [x] Phase 38 — Central juice/animation layer (6f291ece)

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

- [x] Phase 41 — Constraint demolition (1bd9bd2b)
- [x] Phase 42 — The Dark Fantasy campaign bible (46b5a5df)
- [x] Phase 43 — Objective function v2 (21a68f2, squash-merged as 46b5a5df)

**Retheme execution (44a-44i) — decomposed 2026-08-08 at T's request.
Whole-product scope. Each sub-phase is independently shippable and
verifiable; run them IN ORDER — the map and the guard come first so every
later phase has a safety net, and the product shell comes last because it
describes what the others changed. All depend on Phase 42 being ratified;
none may start early (bearings forbids opportunistic renaming).**

- [x] Phase 44a — Rename infrastructure (c5e0f13b)
- [x] Phase 44b — Keyword registry + glossary retheme (04c75d22)
- [x] Phase 44c — Card library retheme (d64bcadc)
- [x] Phase 44d — Themes + presets retheme (c73173a5, verification-only)
- [x] Phase 44e — Enemies + threat sequences retheme (865eb90a)
- [x] Phase 44f — World, maps and minigame naming (4b9083c1)
- [x] Phase 44g — Characters, story, dialogue and quests (74f66110)
- [x] Phase 44h — Morality + alignment retheme (abee6e92)
- [x] Phase 44i — Product shell + docs (9a1dabde)

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

- [x] Phase 52a — Deck-removal engine primitive + the escalating price (dd5c46a, squash-merged as 46b5a5df)
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
- [x] Phase 52c — The rest-choice engine (e1ae8318)
- [x] Phase 52d — The rest-choice screen, and the anvil finally reaches players (3dda879a)
- [x] Phase 52e — Retire the Night Watch (d83978cb)
- [x] Phase 52f — Calibrate the shilling economy (97560058)

**Narrative encounters (53a-53e) — added 2026-08-09 at T's request
("add phases in order to make sure narrative encounters work"). Evidence:
`axiomancer-mechanics/docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md`; design:
`specs/story/S-02-fishing-village-voices.md`. Ship IN ORDER — the sequence
is machinery → placement → content → reactivity, because authoring against
a broken gate ships more dead content, which is how this state arose.
Orthogonal to 44g: that phase rewrites what existing lines SAY, this batch
changes which lines a player can REACH. Either order works; 53a first grows
44g's surface from 3 reachable trees to 7.**

- [x] Phase 53a — Narrative reachability: the guard, then the mismatches (fafc7b4e)
- [x] Phase 53b — The dialogue gate context, completed in the live path (75fb5205)
- [x] Phase 53c — Placement: the quest-giver on the spine, and a coverage floor (44fab3ae)
- [x] Phase 53d — Author S-01's four dilemmas (7d14acd6)
- [x] Phase 53e — The read-back web: consequences that come back (ccb8654c)

- [x] Phase 46a — Early-game rethink: design session (8decc1c9)
- [x] Phase 46b — Early-game: canned preset-deck tutorial content (a5996b62)
- [x] Phase 46c — Early-game: Quest Board tutorial re-derivation (3a1b7291)

**Expo decouple (47a-47e) — decomposed 2026-08-08 at T's request. T's
"not now" from 2026-07-18 is lifted by the unshackling. Do NOT run this
batch concurrently with 44* — both churn the whole mobile surface.**

- [x] Phase 47a — Decouple inventory + shim layer (3473520f)
- [x] Phase 47b — Navigation: `expo-router` → a bare-RN router (49b6f55a)
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

- [x] Phase 48 — Root-cause the `Closes #N` auto-close, for real (0aac2d3, squash-merged as 46b5a5df)
- [x] Phase 49 — GLYPHS follow-up 1: completeness-critic touch-UX pass (f1171746)
- [x] Phase 50 — GLYPHS follow-up 2: mobile UI (7e62a007)
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

- [x] Phase 51 — GLYPHS follow-up 3: sim `crackAt` policy heuristic + the A/B promotion court (a0e377d8)

**Balance doctrine repair (promoted via /oversight 2026-08-08, T direct —
the queue had fully drained and the red curve had no phase assigned;
RESEQUENCED the same day behind the unshackling — see above):**

- [x] Phase 39 — Post-D8 flag-on curve repair + library theme-symmetry restoration (8d50591e)

- [x] Phase 40 — Card-text grammar + full copy pass (0048e3ea)

- [x] Phase 54 — Route live combat through `endCombat` (556ec152)

- [x] Phase 55 — Retire the dead "THE STRIKE IS DEAD" doctrine string from the engine-truth MCP (20b5a1be)

**Promoted via `/oversight` 2026-08-15 (T direct, attended web session):**

- [x] Phase 56 — The dice valves under-sink: add the starter Press Fate grant alongside them (962dc05a)

- [x] Phase 57 — Stop publishing the private DevLog: the in-repo half of the Pages scope-down (cb788468)

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

- [x] Phase 58 — Carry authored narration to the player (426912a9)

- [x] Phase 59 — Rest is two offers: heal 25%, or cut a card (94b85569)

- [x] Phase 60 — Re-home the Anvil to its own map node (68977b93)

- [x] Phase 61 — Retire the Quest Board minigame (f674c147)

- [x] Phase 76 — Retire the Gathering minigame (f18e6643)

- [x] Phase 62 — Ally cards (0b78483c)

- [x] Phase 63 — The loot cache becomes a three-way choice (a7032809)

- [x] Phase 64 — The journal reads the goodwill back (405bbab0)

- [x] Phase 65 — Village goodwill rewards (045e5241)
- [x] Phase 66 — Lexicon lint: catch retired-doctrine prose, not just retired identifiers (d3b46d59)
- [x] Phase 67 — Title migration: "Axiomancer" → "Miserere Mei, Deus" (fad33688)

- [x] Phase 68 — Keyword-drift hardening (25e3e3cb)
- [x] Phase 69 — Card-editor round-trip fidelity (3317e337)
- [x] Phase 70 — Prose lint for shipped `.ts` content + naming law in CI (b06a4449)
- [x] Phase 71 — Art acquisition pipeline (3ae179b9)
- [x] Phase 72 — Harness grants for content work (0a3f73f5)

- [x] Phase 73 — Art generation pipeline (b31c94a0)
- [x] Phase 74 — N-1: fold the ratified North Star into spec 34 (385f6ba5)
- [x] Phase 75 — N-3: the re-voice pass (33df8c91)

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

- [x] Phase V1 — Iconography canon: one data-driven icon registry (a69eab56, PR #179)
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
- [x] Phase V4 — Background acquisition pipeline (4e93450d)
- [x] Phase V5 — Backgrounds wired: `ScreenBg` keyed art slot with dim/vignette (15ef285f)
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
- [x] Phase V8 — Closure (04fe2f46 / b70303bb)
- [x] Phase W1 — The Door (62008ebf)
- [x] Phase W2 — The Caverns (62008ebf)
- [x] Phase W3 — Northern City: map 2 of the northern continent per the `map.library.ts` narrative seam (3b16305a / 0f04f49f)
- [x] Phase W4 — The Connecting River + Town Across the River: maps 3–4 of the northern continent (b8546a59 / 41272f9f)
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
- [x] Phase G1 — `.claude/**` OPEN GATE doc sync (61376b82)
- [x] Phase 77 — In-house crash capture (6249b19b)
- [x] Phase 78 — Art-pass: open-source art sourcing research for W5 portraits (67be65e0)
- [x] Phase W6 — The Capital: map 5 of the northern continent, the ribbon-roads' destination (f56fa198)

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

- **2026-09-23** — actor: **T via `/oversight`** (attended session, branch
  `claude/oversight-7vknwr`). Action: **re-scoped Phase 84** (material
  scope change, not add/remove). The phase's original brief — an attended
  `/world-spec`/`/story-spec` session deciding what the-capital's
  advisor-selection payoff sets up for the player character — was found
  stale on read: THE BLANK PAGE (2026-09-18) retired that narrative as
  non-canon three days after Phase 84 was promoted, and
  `content/story/story-overview.md`'s own pivot question 3 (where the
  seven shipped maps sit relative to the new road) is still undecided.
  Flagged to T before proceeding rather than run the session on a stale
  premise. Confirmed T's request: yes — T answered the `AskUserQuestion`
  ballot "Phase 84's premise is legacy narrative THE BLANK PAGE already
  ruled non-canon... how should I proceed?" with "Re-scope Phase 84
  narrowly: treat the-capital as purely legacy/mechanical (its map
  structure, node layout) and design a NEW, small world beat for it that
  doesn't depend on the old advisor-selection canon at all." T's stated
  reason: not stated beyond the ballot option as written. Resulting
  artifact: `specs/world/W-02-the-capital-door-onward.md` (a door-onward
  beat past the Factor fight, `cap-9`, authored with zero story-canon
  content); phase marked `[x]` shipped in this same commit.

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
  encounters; mechanics unchanged) — see `plan/archive/2026-09-25-trim-t5/new-north-star.prompt.md`. T's
  stated reason: "Miserere Mei, Deus" sounds good, chosen directly rather
  than from either naming-session pass; T explicitly scoped this
  `/oversight` tick to the name only, deferring the wider pivot to a
  future brainstorm session. Resulting commit: this one, plus
  `plan/AUDIT.md`'s product-name row (`[x]` resolved),
  `plan/archive/2026-09-25-trim-t4/plan/naming-session-2026-08-12.md` §6 (closed), `plan/bearings.md`'s
  name line, and `plan/archive/2026-09-25-trim-t5/new-north-star.prompt.md`; brief for 67 still to
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

- **2026-09-26** — actor: **T, attended session** (branch
  `claude/map-revamp-queue`). Action: **added Phases M3b, M3c, M3d, M4
  and M5** (the map revamp's remaining phases, brief
  `plan/2026-09-25-map-revamp-m3.prompt.md`). M3b is blocked while this
  session builds it; M3c is blocked until M3b merges; M3d, M4 and M5 are
  pickable in order. Confirmed T's request: yes. T, near-verbatim: *"make
  sure what's left of this revamp has been distributed to the build plan
  so the nexus loop can tackle some of the work while I'm sleeping"*.
  The same session T picked the three remaining D26 names (The Charcoal
  Wood, The Beacon Crags, The Lantern Deep), so no row waits on T. T's
  stated reason: let the loop work overnight. Resulting commit: this one.

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
