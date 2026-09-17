# Content lifecycle ledger

> Tracks the last `/adjust-*` pass per per-item content category.
> Populated by the five `adjust-*` skills; read by `/march` §3b (the
> content-lifecycle gate) to pick the stalest qualifying category.
> Not a queue — nothing drains it; each pass just updates its own row
> and appends a log entry below. See `skills/march.md` and the
> `skills/adjust-*.md` family for the contract.

## Categories

| category | skill | last pass | commit | pass count |
|---|---|---|---|---|
| cards | `skills/adjust-cards.md` | 2026-09-15 | b26bca91 | 11 |
| equipment | `skills/adjust-equipment.md` | 2026-09-15 | 6043c01d | 11 |
| enemies | `skills/adjust-enemies.md` | 2026-09-16 | b718b421 | 11 |
| keywords | `skills/adjust-keywords.md` | 2026-09-16 | 37c67a13 | 11 |
| npcs | `skills/adjust-npcs.md` | 2026-09-16 | 858607d5 | 11 |

## Log

Newest first. One entry per `/adjust-*` tick:

```
> **[adjust-cards pass 12, 2026-09-17, commit <PENDING>]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`cards` was the stalest qualifying category this
> tick: 51 commits and ~41h since pass 11's commit `b26bca91`,
> 2026-09-15T08:56:09Z, past the 15-commit/36h threshold; `equipment`
> `6043c01d`, 2026-09-15T09:26:40Z, 49 commits/41h also qualified but was
> the less-stale of the two by last-pass timestamp; `enemies` `b718b421`
> 8 commits/17h, `keywords` `37c67a13` 3 commits/11h, and `npcs` `858607d5`
> 1 commit/4h all sat under their own threshold). `git log
> b26bca91..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns 3 commits of the 51
> intervening — NOT empty, unlike pass 11's own zero-diff window: (1)
> `37c67a13` (`/adjust-keywords` pass 11 — created EVENTIDE, the
> Chaos/Balance-family parity drill). Read its full diff directly: it is a
> genuine CREATE on this steward's own surface even though a sibling skill
> shipped it — two new Splinter/rank-3 cards, **The Even Bell** (`vigil`,
> mind, GUARD 18 + EVENTIDE[THORNS 6 for 3] + FREE THORNS 3 for 2) and **An
> Even Reckoning** (`debt`, mind, Deal 16 + EVENTIDE[deal 14 more, +1 Soul]
> + FREE deal 6), plus a stale aggregator-count comment fix in
> `debt.cards.ts` (16→17). Both cards carry `addedIn`/`// pts:` correctly
> and are already covered by that pass's own hermetic e2e
> (`sequencing-grammar.engine.test.ts`) — nothing left for this pass to
> wire. (2) `7cd4119c` (Phase 86, engine hook sweep — direct
> mechanics-expert work, not a steward tick): deletes the 19 orphaned
> `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts` and wires
> `the-sextons-count`'s missing TWIN trigger — the exact two standing
> `plan/AUDIT.md` `[loop-call]` rows this skill's own pass 1 (2026-09-04)
> filed and every pass since re-cited without touching. Read the 13-line
> `grave.cards.ts` hunk directly: it only restores `the-sextons-count`'s
> printed "RECALL, REPLAY, or TWIN" persistent-effect text and updates its
> `// pts:` comment to name the phase/guard (`sextonsTolled`) — re-read
> both fresh and confirmed neither is stale or dishonest against the wired
> engine hook. Re-read `plan/AUDIT.md`'s two rows (dead-hook sweep,
> TWIN-wire) at their current text: both now read "Row closed" under a
> **DECIDED via /oversight 2026-09-15** note citing Phase 86 — correctly
> resolved, no longer open backlog for this steward to carry. (3)
> `9f313d0c` (Phase 85, equipment progression — 3 new signature skills):
> confirmed out of scope by direct diff read (`Items/relic.library.ts`,
> `Combat/combat.signature.ts`, `Game/game.migrate.ts` — no
> `Cards/**`/`Effects/**` touch). The other 48 intervening commits were the
> sibling equipment/enemies/keywords/npcs pass-11 ticks and their ledger
> bumps, Phase 87 (early-game encounter smoothing, `World`/`MapEvents`
> only), Phase 88 (W5 art adoption, enemy portraits only), and the
> `74613182` `/oversight` session (which authorized both Phase 85/86 and
> the keyword Chaos/Upgrade proposal, and is where this skill's own Step 1b
> was added — this is the first `/adjust-cards` pass to run under it, since
> pass 11 predates the addition). Re-derived every Step-1 signal fresh
> against the live tree rather than trusting the diff summary alone: (1)
> **card-surface test suite** — `npx vitest run src/Cards` 18 files / 742
> tests green (up from pass 11's implicit 18/base count via the 2 new
> EVENTIDE cards' own e2e additions in `sequencing-grammar.engine.test.ts`).
> (2) **reachability + pricing sanity + honesty + FREE-line + aspect-thirds**
> — ran `combat-playtest.card-coverage.sim.test.ts`, `deck-presets.engine.
> test.ts`, `pricing.engine.test.ts`, `curated-library.engine.test.ts`,
> `preview-truth.engine.test.ts`, `paid-summary-honesty.engine.test.ts`
> directly: 5 files / 407 tests green, all pass whether the EVENTIDE cards
> are counted or not — no unreachable card, no honesty violation, the 5/5/5
> preset law still holds. (3) **near-duplicates** — wrote a fresh
> same-(rank, `philosophicalAspect`, kind-set≥2) collision scan via a
> throwaway `vitest` script against the live 130-card `cardLibrary` export
> (not from memory): exactly 2 collision buckets, and both are the exact
> pairs documented every pass since pass 4 — `thin-hymn`/`alms-of-breath`
> (`rider,sway` — the Threadbare-starter-vs.-choir's-own-Ash-card echo) and
> `the-last-assize`/`the-vein-called-in` (`deal,overkill,recoil,wrath` —
> debt's rank-6 capstone vs. its apocrypha escalation) — no new collision
> despite the 2 new EVENTIDE cards and the `grave.cards.ts` edit landing in
> this window. (4) **registry parity** — `axio_overview` reconfirms the
> drift is exactly the EVENTIDE pass's own: 130 cards (128→130), debt 20
> (19→20), vigil 21 (20→21), 69 keyword rows (68→69) — nothing this steward
> needs to true up. (5) **TWIN carrier re-check post-Phase-86** — a fresh
> `kind: 'twin'` grep across all `library/*.cards.ts` modules still returns
> exactly 3 literal carriers (`apocrypha.cards.ts` ×1, `grave.cards.ts` ×2)
> — Phase 86 wired `the-sextons-count`'s *persistent-effect trigger*
> (RECALL/REPLAY/TWIN as conditions that toll its own payoff), it did not
> add a new `kind: 'twin'` grant anywhere, so the carrier count for the
> TWIN keyword itself is correctly unchanged. (6) **aspect-thirds per theme
> module** — re-counted fresh: rot 6/5/5, debt 5/6/6 (was 5/6/5 pre-
> EVENTIDE), grave 6/5/5, vigil 5/6/6 (was 5/6/5 pre-EVENTIDE), trial
> 7/6/7, choir 5/5/6 — module-level counts have never been the pinned
> thirds (only the PRESET deck is, and `deck-presets.engine.test.ts`'s 9/9
> reconfirms that directly), so the EVENTIDE cards nudging debt/vigil's
> mind column by 1 each is not a violation, matching the reading every pass
> since pass 4 has given this same signal. (7) **`plan/AUDIT.md`/
> `PHASE_CANDIDATES.md`/`CRITIQUE.md` sweep** — `git log b26bca91..HEAD --
> plan/AUDIT.md plan/PHASE_CANDIDATES.md plan/CRITIQUE.md` returns exactly
> the 2 commits already read above (`37c67a13`'s keyword-scoped loop-call
> closure, and sibling `b718b421`'s enemy-archetype `[score 4.5]` filing,
> engine-structural and enemy-scoped, not cards') plus the `74613182`
> oversight session (already reviewed) — no new card-scoped residue.
>
> **Step 1b widened audit (this is the first `/adjust-cards` run under it —
> added via `/oversight` 2026-09-15, after pass 11's own commit landed):**
> the library's one visibly thin bucket relative to the six 16-21-card
> theme decks is the 5-card enemy-injected curse family
> (`CURSE_CARDS`/`starters.cards.ts`). Queried `kb_cards` (game
> `slay-the-spire`) for its own dedicated curse-card family as the nearest
> comparable-genre reference: the corpus's own curse cards (`Curse of the
> Bell`, `Necronomicurse`, and the rest of that special/unplayable class)
> are themselves a small fraction of its ~360-card pool, proportionally in
> the same range as our 5-of-130 — read as genre-accurate proportion (a
> curse family is *meant* to stay small and enemy-injected, not
> player-drafted, in both games), not a genuine thinness gap, so nothing
> filed. Also re-read `/adjust-keywords` pass 11's own Chaos/Upgrade
> finding (the widened check's own precedent this window) to confirm it
> left no card-content residue behind for this steward to duplicate:
> EVENTIDE shipped with 2 carriers already authored by that pass, and the
> sibling "generic Upgrade" family was correctly deferred as a
> payload-shape/engine task, not a card-authoring one — nothing actionable
> in that vein either. No genuine finding this pass — every Step-1 signal
> re-tested clean against a real (not empty) 3-commit intervening window,
> and the widened check's one candidate thin spot reads as accurate genre
> proportion once checked against comparable prior art, not an
> under-examined gap. KB research (skill §3 Step 2): the Step 1b widened
> check above IS this pass's KB research run — no CREATE/UPDATE shipped
> this pass, so the REMOVE/no-op carve-out applies. Verify: ran all three
> gates in full (not skipped, despite the net-zero card-authoring diff) —
> `npm run verify --workspace axiomancer-mechanics` (214/214 files, 3464
> tests + build green, byte-identical to pass 11's own citation), `npm run
> verify --workspace axiomancer-mobile` (exit 0; 302/302 suites, 2869
> tests, 3/3 snapshots; lint/typecheck/jest/assets:check/art:test all
> green), `npm run type-check --workspace axiomancer-card-editor` (clean,
> exit 0). `npm run deploy:check` confirmed green pre-tick (HEAD
> `d2337225`, docs/plan-only tip commit, no gated workflow triggered) and
> will be re-confirmed after this ledger commit lands. No
> `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed this pass
> — nothing actionable surfaced beyond the two standing findings already
> closed by Phase 86 this same window (re-confirmed closed, not re-filed).
```

```
> **[adjust-npcs pass 11, 2026-09-16, commit 858607d5]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate. Three categories qualified this tick (all past
> their own 15-commit/36h threshold): cards (`b26bca91`,
> 2026-09-15T08:56:09Z, 49 commits since), equipment (`6043c01d`,
> 2026-09-15T09:26:40Z, 47 commits since), npcs (`e6709572`,
> 2026-09-15T01:22:03Z, 52 commits since) — enemies (`b718b421`,
> 2026-09-16T08:55:02Z, 6 commits) and keywords (`37c67a13`,
> 2026-09-16T14:56:08Z, 1 commit) sat under their own threshold. `npcs` was
> the stalest of the three qualifying categories by last-pass timestamp, so
> the gate picked it. `git log e6709572..HEAD -- axiomancer-mechanics/src/NPCs
> axiomancer-mechanics/src/World axiomancer-mechanics/specs/story
> axiomancer-mechanics/specs/characters` returns exactly one commit of the 52
> intervening: `2227fe9c` (Phase 87, early-game encounter smoothing) — read
> its full diff directly: it adds regression-guard tests to
> `World/MapEvents/e2e/content.engine.test.ts` and
> `World/e2e/map-traversal.engine.test.ts` plus a doctrine-text correction in
> `world-tuning.md`, all encounter/traversal surface, zero NPC/dialogue
> content touched. The other 51 intervening commits were the sibling
> cards/equipment/enemies/keywords pass-11 ticks and their ledger bumps,
> phases 79-88 and their briefs/plan-updates, an `/oversight` session
> (`74613182`, which is where this skill's own Step 1b was added), a
> critique pass (38, no findings), and telemetry-hook fixes — none touched
> the NPC/dialogue/story-spec surface. Re-derived every Step-1 signal fresh
> against the live tree rather than trusting the near-empty path-scoped log
> alone: (1) **NPC census** — 21 authored `NPC` consts across the 4 files
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7), unchanged
> from pass 10. (2) **reachability** — ran all four suites directly:
> `World/narrative-reachability.test.ts` 5/5,
> `World/e2e/narrative-reachability.engine.test.ts` 26/26 (all 10 registered
> maps, including the three empty-by-design Aporia labyrinth maps),
> `NPCs/e2e/dialogue.engine.test.ts` 18/18, `NPCs/e2e/story-npcs.engine.test.ts`
> 36/36 — 85/85 total, byte-identical to pass 10's count; zero
> `unresolvedInteractions`/`unreachableNpcs`/`sceneryAsPeople` on any map. (3)
> **unstaged-NPC backlog re-verification** — the standing 4-NPC
> `unstagedNpcs` list on `Coastal-Village/maps.ts` (Tide-Shopkeeper, Village
> Healer, Dockworker's Union Leader, Merchant's Widow) re-read at its current
> text: identical reasons, unchanged since pass 8. (4) **map NPC-floor
> re-check** — fresh per-map counts against `MAP_REGISTRY` reproduce pass
> 9/10's numbers exactly: fishing-village 8 rostered (4 reachable + 4
> declared-unstaged), northern-forest 6, caverns 1, northern-city 2,
> connecting-river 1, town-across-river 1, the-capital 2, the three Aporia
> labyrinth maps 0 (by design — the Sophist's accordion narration, C-01,
> confirmed still implemented). The standing `plan/AUDIT.md`
> `[needs-user-call]` row ("Three of four Northern-Continent maps carry only
> 1 staged NPC", filed 2026-09-05) re-cited, not re-filed — still open, still
> correctly un-actioned (character-spec/story-spec territory). (5) **legacy
> `DialogueMap` sweep** — zero live `dialogue:` (flat-map) field usage on any
> authored NPC entry; every rostered NPC across all 10 maps carries a
> `dialogueTree`. (6) **dead-end node sweep** — a fresh structural scan of
> all 154 dialogue-tree nodes (106 leaves) for a leaf whose text reads as
> mid-conversation (ends `?` or `...`) rather than an intentional
> terminator: zero hits. (7) **teachCard / quest-reference sweep** —
> `teachCard` still has zero call sites on any NPC dialogue effect; a fresh
> `startQuest`/`progressQuest`/`completeQuest` extraction gives the same 9
> distinct quest ids as pass 10 (matches pass 10's 11 raw refs against fewer
> distinct ids once de-duplicated), all 9 resolve against the live
> `QuestName` union (`World/quest.library.ts`) via direct read. (8)
> **spec-to-NPC gap** — `git log e6709572..HEAD -- specs/` (repo root) is
> empty; `specs/story/` (S-01, S-02) and `specs/characters/` (C-01)
> unchanged since pass 8's from-scratch reading.
>
> **Step 1b widened audit (added via `/oversight` 2026-09-15, this is its
> second run for `npcs` after pass 10 predated it):** queried `kb-query` MCP
> for NPC/dialogue staging prior art — `kb_search` across
> `dialogue|NPC|quest.?gat|dead.?end|branching conversation` and
> `flavor text|characterization|voice|companion character|story beat`
> (scope=all and boardgames), plus `kb_find_games` for a `narrative`
> better-if label (no match — not a live tag). `kb_overview` confirms the
> corpus's 46 board games carry zero `narrative`/`dialogue`-shaped
> mechanics or better-if tags; every search hit was an incidental "choice"
> mention in an unrelated mechanic (Arydia's NPC-pointer interaction rule,
> Forgotten Waters' app-governed voiceover pacing) — none touching
> dialogue-tree design, NPC voice differentiation, or player reception of
> flavor-vs-reactive NPC text. This is a **confirmed genuine miss**, but not
> a new one: `/adjust-npcs` passes 5 and 8 already filed this exact gap to
> the `game-knowledge-base` repo as wishlist issues `#79` ("flavor vs.
> reactive minor NPCs in market/town settings") and `#80` ("NPC dialogue
> voice-distinctiveness prior art"), both closed 2026-09-16T05:35Z (the
> `74613182` oversight session). Filing a third near-identical wishlist
> would be pure duplication, so this pass cites the two standing issues
> rather than re-filing. No genuine structural finding this pass — every
> Step-1 signal re-tested clean, and the widened check reconfirms a known,
> already-escalated corpus gap rather than surfacing a new one. KB research
> (skill §3 Step 2): the Step 1b widened check above IS this pass's KB
> research run — no CREATE/UPDATE shipped, so the REMOVE/no-op carve-out
> applies. Verify: `npm run verify --workspace axiomancer-mechanics`
> (214/214 files, 3464 tests + build green) and `npm run verify --workspace
> axiomancer-mobile` (302/302 suites, 2869 tests, 24/24 art:test,
> lint 0 errors/15 pre-existing warnings, typecheck clean) both ran in full
> despite the NPC-surface source being unchanged this pass. `npm run
> deploy:check` confirmed green pre-tick (HEAD `ec9d6eee`, no gated workflow
> triggered for the docs/plan-only tip commit) and will be re-confirmed
> after this ledger commit lands. No `plan/PHASE_CANDIDATES.md` or new
> `plan/AUDIT.md` residue filed this pass — nothing actionable surfaced
> outside the standing, already-filed backlogs re-cited above (S-02's 4-NPC
> unstaged list; the Northern-Continent single-NPC-maps `[needs-user-call]`
> row; wishlist issues #79/#80).
```

```
> **[adjust-keywords pass 11, 2026-09-16, commit 37c67a13]** One CREATE
> (EVENTIDE) — the first `/adjust-keywords` CREATE ever landed (passes 1-10
> were zero-diff re-audits, one retirement, and small print/gloss fixes).
> Dispatched autonomously by `/march`'s content-lifecycle gate (`keywords`
> was the stalest qualifying category: last pass 2026-09-14T22:50Z/commit
> `9d357e2b`, 52 commits and ~40h stale, the oldest of the five by
> last-pass timestamp). `git log 9d357e2b..HEAD -- axiomancer-mechanics/
> src/Cards axiomancer-mechanics/src/Effects axiomancer-mechanics/
> src/Combat axiomancer-mechanics/docs/keyword-atlas.md
> docs/retheme-map.json axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returned 3 commits: `5885f024`
> (adjust-equipment pass 11, an item-only `buff_cleanse_minor` split — not a
> card keyword) and `9f313d0c` + `7cd4119c` (phase 85/86 engine work; the
> latter's `the-sextons-count` fix restored a THIRD printed TWIN trigger the
> engine had silently dropped since 2026-09-04 — already fixed by a direct
> engine phase, not this steward, and reconfirmed clean via a fresh
> `CardSpecialMechanic`/`SynergyStatePredicate` kind-count sweep: 50+7=57,
> display-switch parity 50/50 and 7/7, carrier histogram (10 at exactly 1,
> 13 at exactly 2, 9 at 0) all byte-identical to pass 10's own numbers).
> Step 1 alone read zero-diff a THIRD consecutive time (after passes 9/10),
> so per Step 1b (added via `/oversight` 2026-09-15 after that exact
> plateau) ran the widened KB cross-reference check anyway: it resurfaced
> the standing `[loop-call]` (`plan/AUDIT.md`, filed pass 9, **DECIDED for
> a concrete proposal via `/oversight` 2026-09-15**) — Dawncaster's "Chaos"
> functions-column family (Balance/Order: a parity gate on the player's own
> deck/hand) and "generic Upgrade" (Mergecraft/Infusion: permanent
> per-card-object growth) both have no registry analogue. KB research
> (gate for this CREATE, per skill §3 Step 2): `kb_read_doc` on
> `keywords/balance.okf.md`, `keywords/mergecraft.okf.md`,
> `keywords/infusion.okf.md`, `keywords/dominated.okf.md` (all
> `kb:dawncaster`, community-sourced, confidence medium, `status: draft`).
> Picked Chaos over generic Upgrade: Balance/Order's parity read drops into
> the EXISTING turn-shape `SynergyStatePredicate` slot (same surface as
> AMBUSH/FLOW/FINALE/REQUIEM — no new payload shape needed), where generic
> Upgrade would need net-new persistent per-card-object state the engine
> does not carry today (a real payload-shape design task, correctly
> deferred rather than rushed). Drilled to ONE keyword, not Dawncaster's
> Balance/Order pair: `EVENTIDE` (`{ kind: 'eventide' }`) fires free while
> the player's draw pile holds an EVEN number of cards — vacuously true off
> a bare ledger view, same convention as `opening`/`finale`. Full wiring: a
> new `drawPile` field on `synergy-predicates.ts`'s `SynergyLedgerView` +
> its `checkStatePredicate` case, `combat.cards.ts`'s `statePredicateText`
> case, `paid-summary-honesty.engine.test.ts`'s `KNOWN_UPPER`, mobile
> `KEYWORD_GLOSS` (no glyph needed — same family as AMBUSH/FLOW/FINALE/
> REQUIEM, none of which carry one), the atlas's new "Added" section (with
> its KB receipts), and `AUDIT.md`'s loop-call marked `[x]` RESOLVED. No
> card-editor change needed: `CardSynergy`/`SynergyStatePredicate` are
> imported types in `axiomancer-card-editor/src/types.ts`, and
> `cardCodegen.ts`'s `synergyLines` emits `statePredicate` generically (no
> per-kind allowlist) — confirmed by reading both files directly, same
> zero-touch precedent AMBUSH/FLOW/FINALE/REQUIEM already set. Two carriers
> ship with the row (both Splinter/rank 3, within the §5.2 14-20 single-hit
> / 16-22 GUARD band): **The Even Bell** (`the-even-bell`, vigil, mind) —
> GUARD 18 + EVENTIDE[THORNS 6 for 3 turns], FREE THORNS 3 for 2 turns; and
> **An Even Reckoning** (`an-even-reckoning`, debt, mind) — Deal 16 +
> EVENTIDE[deal 14 more, +1 Soul], FREE deal 6. `debt.cards.ts`'s stale
> aggregator count comment fixed in the same edit (16 → 17 cards). Hermetic
> e2e in `sequencing-grammar.engine.test.ts`: unit `checkStatePredicate`
> cases (even/odd/absent) + a `statePredicateText` pin + a live-library-card
> fire/silent integration test playing `the-even-bell` end to end through
> `playCombatCard` with a controlled even- vs odd-length `drawPile` (asserts
> the EVENTIDE event fires/is absent, THORNS lands/does not land, and GUARD
> lands identically either way). Verify: green (mechanics 214/214 files ·
> 3464 tests + build; mobile lint + typecheck + jest 302/302 suites +
> assets:check + art:test, including `keywords.test.ts` and
> `glyphShapes.test.ts`; card-editor type-check; root `npm test` 134/134
> incl. content-drift's atlas↔registry bidirectional checks).
```

```
> **[adjust-enemies pass 11, 2026-09-16, commit b718b421]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass on the enemy library itself — dispatched
> autonomously by `/march`'s content-lifecycle gate (`enemies` was the
> stalest qualifying category this tick: last pass 2026-09-14T16:47Z/commit
> `55eec31d`, oldest of the five by last-pass timestamp — cards `b26bca91`
> 2026-09-15T08:56Z, equipment `6043c01d` 2026-09-15T09:26Z, keywords
> `9d357e2b` 2026-09-14T22:50Z, npcs `e6709572` 2026-09-15T01:22Z — and all
> five sat past their own 15-commit threshold, 40-51 commits deep, so the
> gate's tie-break (stalest `last pass`) decided it). `git log
> 55eec31d..HEAD -- axiomancer-mechanics/src/Enemy
> axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World`
> was NOT empty this pass (unlike passes 9/10): Phase 88 (2026-09-16,
> `ebb457f4`, direct `/oversight` instruction, not this steward) shipped
> the W5 art adoption — the 9 northern-continent enemies that were carrying
> licensed silhouette placeholders now render their `/oversight`-picked art
> (8 of 9 the literal top research candidate, wharf-shrike the second-listed
> after the top pick was verified mismatched). That drains this steward's
> own standing signal table item ("a placeholder with a licensed/generated
> replacement now available → UPDATE") before this pass even started — a
> fresh sweep of all 77 live `portraitAsset` values confirms 0 duplicates
> and 0 remaining placeholder-named assets. Re-derived the rest of Step 1
> fresh: (1) orphan sweep — same 2 exclusions as pass 10 (`sandbag` test
> fixture, `the-incompleteness` impossible-ceiling boss, both carry an
> explicit `DESIGN REQUIREMENT` barring `EnemiesByMap` entry). (2)
> roster-size/overlap — all 10 pools unchanged from pass 10 (fishing-village
> 13, northern-forest 39, caverns 17, northern-city 8, connecting-river 5,
> town-across-river 4, the-capital 8, aporia-colonnade/archive 8 each,
> aporia-proof 11); the only >70%-of-smaller-pool hits remain the 4
> standing Aporia-vs-forest/caverns pairs (87.5%/87.5%/90.9%/75.0%),
> re-confirmed as the documented deliberate shared-roster design (the
> labyrinth built from the world the player has already walked), not
> re-litigated. town-across-river stays the thinnest pool (3 non-boss); its
> own history (pass 2's backfill, then repeated stable re-reads since) reads
> as an accepted coda-map shape, not an open finding. (3) deck/loot/VITAE-
> band/aftermath-voice sweeps — all clean, matching pass 10's readings
> (source files for these untouched since before pass 10). Standing
> 32-enemy `finalBlowLines` backlog re-cited, not re-filed
> (content-curator territory, `plan/AUDIT.md` `[content]`).
>
> **Step 1b widened audit (new this pass, added via `/oversight`
> 2026-09-15 after passes 9-10's back-to-back zero-diff plateau):** ran a
> `kb-query` MCP cross-reference (corpus: `slay-the-spire-the-board-game`,
> `gloomhaven`, `aeons-end`) for enemy-archetype prior art well-represented
> in comparable games but thin/absent here. Findings checked against the
> live roster before filing anything: **elite-tier monster AI** and
> **curse/deck-junking enemies** are both already well covered here
> (`difficulty: 'elite'` on 20+ foes with its own stat/deck weight;
> `curseCardId` — "THE archetype's single curse-injector" — on most
> Northern Forest/Capital elites and several bosses), so those two are
> struck. **Summoner/add-spawning enemies** and **a multi-hit attack that
> punishes one stacked GUARD/BARRIER instead of chip damage** are
> genuinely absent and genuinely engine-structural, not content-only:
> combat is hard-coded 1-enemy (`World/encounter.ts`'s `enemies: [scaled]`,
> `combat.engine.ts` reads a singular `state.enemy` throughout — a real
> summoner needs multi-enemy combat state, not a keyword), and
> `resolveThreatPhase` resolves exactly one telegraphed hit against
> GUARD/BARRIER/RIPOSTE per phase with no repeat/hit-count field on
> `EnemyCard` to drive a multi-hit loop. Per skill §5 failure mode 2 ("a
> finding needs an engine constant change — file it, don't fake it" — this
> needs more than a constant), filed rather than shipped:
> `plan/PHASE_CANDIDATES.md` `[score 4.5]` "No summoner/add-spawning or
> multi-hit-vs-stacked-wall enemy archetype", full KB citations + the
> against-roster check inline. KB research (skill §3 Step 2): the Step 1b
> widened check above IS this pass's KB research run — no CREATE/UPDATE
> shipped, so the gate's REMOVE/no-op carve-out also applies to the
> zero-diff Step 1 portion. Verify: `npm run verify --workspace
> axiomancer-mechanics` (214/214 files, 3451 tests + build green) and `npm
> run verify --workspace axiomancer-mobile` (green, 24/24 art:test +
> lint/typecheck/jest, exit 0) both ran in full despite the enemy-library
> source being unchanged this pass (only Phase 88's art landed, verified
> already-green on its own merge). `npm run deploy:check` confirmed green
> pre-tick (HEAD `7c218bb1`, docs/plan-only tip commit, no gated workflow
> triggered) and will be re-confirmed after this ledger commit lands.

> **[adjust-equipment pass 11, 2026-09-15, commit 6043c01d]** Zero-CREATE,
> zero-REMOVE pass — dispatched autonomously by `/march`'s content-lifecycle
> gate (`equipment` was the only qualifying category this tick: 17 commits
> since pass 10's commit `36ee098c`, past the 15-commit threshold; cards
> `b26bca91` 2 commits, enemies `55eec31d` 11, keywords `9d357e2b` 7, npcs
> `e6709572` 5, all sat under their own 15-commit/36h thresholds). Re-derived
> all 5 Step-1 signals fresh: (1) dominated relics — none, all 8 same-slot
> ties differ by distinct `grantsSignature`. (2) shop/reward coverage — 12 of
> 22 consumables shop-stocked across the 7 `World/MapEvents/content.ts` ware
> blocks, the other 10 reachable via `rollCacheReward`'s uniform draw, no
> orphan. (3) `grantsSignature` drift — all 8 relic values still resolve in
> the live 8-member `SignatureSkillId` union. (4) dead consumable
> `effectId`s — all 12 non-heal-only ids resolve in `buffs.library.json`,
> none on the card-vocabulary ban list (which governs cards, not items).
> (5) `AccessoryKind` gap — head/hands/feet still at zero live relics, same
> standing `[loop-call]` (`plan/AUDIT.md`, 2026-09-04), not re-litigated.
> Beyond the five listed signals, found and fixed a real UPDATE: `antidote`
> and `clarity-serum` both applied `buff_cleanse` (tier 2) and are co-listed
> in three live shops (Herb Trader, Camp Ledgerman, Iron Factor) at
> different prices (15/25, 16/30, 14/26) — the identical
> byte-identical-effect-line-at-different-prices bug class issue #307 fixed
> for philosopher-tea/void-essence on 2026-09-14. KB research (`kb-query`
> gate, skill §3 Step 2): `kb_cards` on Dawncaster's cleanse-family cards
> shows the prior-art pattern of "cleanse AN Affliction" (singular, partial)
> as mechanically distinct from "cleanse all" cards — grounded `clarity-serum`
> staying a cleanse-family item but at reduced scope, rather than inventing
> an unrelated buff. Split `clarity-serum` onto a new `buff_cleanse_minor`
> (tier 1, "Occam's Razor" — `buffs.library.json`): reuses the existing
> tier-scoped `removeEffectsByType` routing in `useConsumableEffect`
> (`equipment.engine.ts`) with zero engine changes, so a tier-1 cleanse now
> strips only tier-1 debuffs (3 live: mark/kindling_ember/nettle_sting)
> versus antidote's full tier 1+2 purge — the flavor's "a single hindrance"
> now maps to a real, narrower payload. Updated the doc comments in
> `Effects/types.ts` and `equipment.engine.ts` that named both items against
> the one shared buff. Extended `consumable-cleanse.engine.test.ts` (new
> tier-1-vs-tier-2 case), `dead-consumable-payload.engine.test.ts` (new
> antidote/clarity-serum describe block, mirroring the philosopher-tea/
> void-essence one), and `stat-band-effects.engine.test.ts` (added
> `buff_cleanse_minor` to the no-stat-change sweep). Verify: green
> (mechanics 213/213 files · 3440 tests; mobile 299/299 suites · 2854
> tests, 3 snapshots).

> **[adjust-cards pass 11, 2026-09-15, commit b26bca91]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`cards` was the stalest/due category this tick: 15
> commits since pass 10's commit `1242bd60`, at the 15-commit threshold
> exactly; equipment `36ee098c` sat under its own threshold at the time of
> dispatch, as did enemies `55eec31d`, keywords `9d357e2b`, and npcs
> `e6709572`). `git log 1242bd60..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly one commit of
> the 15 intervening: `f19afd0d` (the #307 shop-effect-duplication fix —
> splits `buff_critical_damage_up` into `buff_liars_gambit`/
> `buff_abyssal_presence` for Philosopher's Tea/Void Essence). Read its full
> diff directly (`git show f19afd0d --stat`): it touches
> `src/Effects/buffs.library.json` (two new buff entries),
> `src/Items/consumable.library.ts`, a new
> `dead-consumable-payload.engine.test.ts`, and
> `axiomancer-mobile/state/combat/keywords.ts`'s `SUPPORT_KEYWORD` map — a
> shop-consumable/item fix, not `cards.library.ts` or any card-authoring
> surface (the same commit was already independently confirmed out-of-scope
> by this tick's sibling `adjust-keywords` pass-10 log, for the identical
> reason). The other 14 intervening commits were the sibling
> equipment/enemies/keywords/npcs pass-10 ticks and their ledger-bump
> commits, two `/expand` passes (no candidates filed), a `critique` pass, and
> an `audit`-fix pair (finding [5.6], stale hazard/route ids in `cli.md`/the
> fishing-village walkthrough, and finding [4.0], the same `f19afd0d`
> shop-effect-dup above) — none touched the card-authoring surface.
> Confirmed every card-surface source file is byte-identical to pass 10's
> tree via direct per-file `git log -1`, not just the path-scoped range
> query: `src/Cards/cards.library.ts` last-touched `df4036fc` (pass 3),
> `src/Cards/cards.pricing.ts` `7b84c8bb` (2026-09-02), `cards.sandbox-sets.ts`
> `a0e377d8` (2026-08-23), `combat.starter-deck-presets.ts` `f29cea5c`
> (pass 1), `combat.deck-draft.ts` `fbace426` (2026-08-02), `src/Cards/types.ts`
> `515ac4d9` (THE PATH), `combat.cards.ts` `37dacef1` (keywords pass 8),
> `src/Effects/e2e/deprecated-effects.engine.test.ts` `e9201415`
> (2026-09-02), `docs/keyword-atlas.md` `9016a99f` (keywords pass 2), and all
> nine `src/Cards/library/*.cards.ts` theme modules (`ed6b1be3`/`515ac4d9`/
> `bf6223f1`/`f29cea5c`/`df4036fc`/`ff8d5fdf`, the newest of which is pass 3's
> `df4036fc`) — all predate pass 10's `1242bd60`. Re-derived every Step-1
> signal fresh anyway rather than trusting the empty diff alone: (1)
> **reachability** — `combat-playtest.card-coverage.sim.test.ts` 123/123,
> matching pass 10 exactly. (2) **pricing sanity + honesty + FREE-line +
> aspect-thirds** — `pricing.engine.test.ts` (251), `curated-library.engine.
> test.ts` (14), `preview-truth.engine.test.ts` (10),
> `paid-summary-honesty.engine.test.ts` (4), `deck-presets.engine.test.ts`
> (9) all green, byte-identical counts to pass 10. (3) **registry parity** —
> `axio_overview` reconfirms 128 cards, 68 keyword rows, and the identical
> per-theme totals (debt 19, trial 24, rot 19, choir 21, vigil 20, curse 5,
> grave 20), unchanged from pass 10. Standing `plan/AUDIT.md` `[loop-call]`s
> re-checked against current source, not re-litigated: the 19 orphaned
> `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts` (filed pass 1;
> the file itself last-touched `636f3040`, 2026-09-04, well before this
> window) and `the-sextons-count`'s missing TWIN trigger (filed pass 1;
> `grave.cards.ts` untouched since `df4036fc`, pass 3) — both re-confirmed
> still open, still mechanics-expert/engine-constant territory, not this
> skill's to solo. Also swept `plan/AUDIT.md`/`plan/PHASE_CANDIDATES.md`/
> `plan/CRITIQUE.md` for any new card-scoped item via `git log
> 1242bd60..HEAD -- plan/AUDIT.md plan/PHASE_CANDIDATES.md
> plan/CRITIQUE.md`: the 5 commits in that range are `critique` pass 38 (no
> findings), the [5.6] docs fix (stale hazard/route ids, unrelated to cards),
> two `/expand` passes (no candidates filed), and the [4.0] shop-effect-dup
> fix above (already read in full, confirmed item/consumable-scoped) — no
> new card-scoped residue. KB research (skill §3 Step 2): not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per the REMOVE/no-op carve-out the sibling
> categories' own zero-diff passes have used identically. Verify: ran all
> three gates in full this pass (not skipped, despite zero source diff) —
> `npm run verify --workspace axiomancer-mechanics` (213/213 files, 3435
> tests + build green, byte-identical to this tick's sibling keywords/npcs
> pass-10 count), `npm run verify --workspace axiomancer-mobile` (exit 0;
> 299/299 suites, 2854 tests, 3/3 snapshots; lint/typecheck/jest/
> assets:check/art:test all green, art:test's own 24/24 confirmed directly
> in the tail), `npm run type-check --workspace axiomancer-card-editor`
> (clean, exit 0). `npm run deploy:check` confirmed green pre-tick (HEAD
> `f96f9902`, docs/plan-only tip commit, no gated workflow triggered) and
> will be re-confirmed after this ledger commit lands. No
> `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed this pass
> — nothing actionable surfaced outside the two standing, already-filed
> backlog items re-cited above (the 19-hook `zoneHas` cleanup; the-sextons-
> count's TWIN trigger).
```

```
> **[adjust-npcs pass 10, 2026-09-15, commit e6709572]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched by `/march`'s content-lifecycle
> gate with `npcs` pre-flagged as the stalest/due category (pass 9's commit
> `24cebc11`, 2026-09-14: 15 commits since, at the 15-commit/36h threshold;
> cards `1242bd60` 12 commits, equipment `36ee098c` 11, enemies `55eec31d` 5,
> keywords `9d357e2b` 1, all under their own threshold). `git log
> 24cebc11..HEAD -- axiomancer-mechanics/src/NPCs axiomancer-mechanics/
> src/World axiomancer-mechanics/specs/story axiomancer-mechanics/
> specs/characters` returns zero commits, matching the exact 15-commit count
> the dispatch measured; the 15 intervening commits were the sibling
> cards/equipment/enemies/keywords pass-10 ticks and their ledger bumps, two
> `/expand` passes (no candidates filed), a critique pass, and an
> `audit`/`docs` fix pair (finding [4.0] shop-effect-dup, finding [5.6] stale
> hazard/route ids in `cli.md`/the fishing-village walkthrough) — none
> touched the NPC/dialogue/story-spec surface. Confirmed every NPC-surface
> source file is byte-identical to pass 9's tree via direct per-file `git
> log -1`, not just the path-scoped range query: `src/NPCs/types.ts` and
> `src/NPCs/dialogue.ts` both last-touched `abee6e92` (2026-08-12),
> `Coastal-Village/npcs.ts` and `Coastal-Village/maps.ts` both `df6e98ff`
> (2026-09-12), `Northern-Forest/npcs.ts` `abb3da01` (pass 8, 2026-09-13),
> `Northern-Continent/maps.ts` `df6e98ff` — all predate `24cebc11`.
> `specs/story/` and `specs/characters/` both show zero commits in the same
> range. Re-derived every Step-1 signal fresh against the live tree anyway,
> not trusting the empty diff alone: (1) **NPC census** — a fresh `: NPC = {`
> grep across the 4 authoring files reproduces pass 9's exact 21-NPC split
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7). (2)
> **reachability** — ran all four suites directly rather than trusting the
> unchanged-file inference: `src/World/narrative-reachability.test.ts` 5/5,
> `src/World/e2e/narrative-reachability.engine.test.ts` 26/26,
> `src/NPCs/e2e/dialogue.engine.test.ts` 18/18,
> `src/NPCs/e2e/story-npcs.engine.test.ts` 36/36 — 85/85 total, byte-identical
> to pass 9's count; no `unresolvedInteractions`/`unreachableNpcs` on any map.
> (3) **unstaged-NPC backlog re-verification** — the standing 4-NPC
> `unstagedNpcs` list on `Coastal-Village/maps.ts` (Tide-Shopkeeper, Village
> Healer, Dockworker's Union Leader, Merchant's Widow) re-read directly at its
> current text: identical reasons, unchanged. Re-tested S-02's own
> preconditions fresh rather than re-citing them: a fresh
> `grep -rn isShopkeeper axiomancer-mobile --include='*.ts' --include='*.tsx'`
> still returns nothing (the shop UI mobile actually renders is the unrelated
> `MapEvent.merchants` path), the Tide-Shopkeeper's own `browse` node still
> reads "The shopkeeper gestures at three crates. (Shop implementation lands
> in a later spec.)" verbatim, and a fresh dev-placeholder sweep
> (`TODO|FIXME|lands in a later spec|not yet implemented|placeholder|coming
> soon`) across every NPC/map content file surfaces only that one already-known
> line — no new leak. `RestChoice/` still carries zero `NPC` references
> (Village Healer's precondition unmet). (4) **legacy `DialogueMap` sweep** —
> zero live `dialogue:` (flat-map) field usage on any authored NPC entry;
> `DialogueMap` appears only in `types.ts`'s declaration and the barrel
> re-exports (`src/index.ts`, `src/NPCs/index.ts`) — unchanged. (5)
> **teachCard / quest-reference sweep** — `teachCard` still has zero call
> sites on any NPC dialogue effect (only the type field and
> `dialogue.runtime.ts`'s plumbing reference it); a fresh
> `startQuest: '...'`/`progressQuest: '...'`/`completeQuest: '...'`
> extraction across both continents' map/npc files gives the same 11 raw refs
> / 10 distinct quest ids as pass 9 (`starting-quest` ×2, `get-to-forest`,
> `get-to-connecting-river`, `find-islanders`, `get-to-town-across-river`,
> `get-to-the-capital`, `get-to-northern-city`, `gather-iron`, `get-to-cave`,
> `gather-wood`), all 10 re-confirmed present in the live `QuestName` union
> (`src/World/quest.library.ts`) via direct read, not typecheck inference
> alone. (6) **spec-to-NPC gap** — `git log 24cebc11..HEAD -- specs/` (repo
> root, not just the path-scoped mechanics query) is empty; both `specs/
> story/` entries (S-01, S-02) and the one `specs/characters/` entry (C-01
> the Sophist) remain implemented per pass 8's from-scratch reading,
> unchanged since. (7) **map NPC-floor re-check** — the standing
> `plan/AUDIT.md` `[needs-user-call]` row ("Three of four Northern-Continent
> maps carry only 1 staged NPC", filed 2026-09-05) re-read at its current
> text: still open, still correctly un-actioned (filling it means designing
> 1-3 new named characters' personhood, `character-spec`/`story-spec`
> territory, not this skill's to solo) — re-cited, not re-filed. No genuine
> finding this pass — every signal re-tested clean against a provably
> unchanged source graph (zero commits touching the surface across the full
> 15-commit window), not assumed stale-clean from an empty log alone. KB
> research (skill §3 Step 2): not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per the
> REMOVE/no-op carve-out the sibling categories' own zero-diff passes have
> used identically. Verify: ran both gates in full this pass (not skipped,
> despite zero source diff) — `npm run verify --workspace
> axiomancer-mechanics` (213/213 files, 3435 tests + build green,
> byte-identical to this tick's sibling keywords-pass-10 count) and `npm run
> verify --workspace axiomancer-mobile` (299/299 suites, 2854 tests, 3/3
> snapshots, lint/typecheck/jest/assets:check/art:test all green — art:test's
> own 24/24 confirmed directly in the tail). `npm run deploy:check` confirmed
> green pre-tick (HEAD `6d1be84c`, docs/plan-only tip commit, no gated
> workflow triggered) and will be re-confirmed after this ledger commit
> lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed
> this pass — nothing actionable surfaced outside the two standing,
> already-filed backlogs re-cited above (S-02's 4-NPC unstaged list; the
> Northern-Continent single-NPC-maps `[needs-user-call]` row).
```

```
> **[adjust-keywords pass 10, 2026-09-14, commit 9d357e2b]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched by this tick's `/march` loop
> call as the `keywords` category (pass 9's commit `0afbfe89`, 2026-09-13,
> was the stalest: 15 commits since, past the 15-commit/36h threshold and
> the oldest of the five categories' own last-pass timestamps — cards
> `1242bd60` 10 commits since, equipment `36ee098c` 9, npcs `24cebc11` 13,
> enemies `55eec31d` 3, all sat under their own threshold). `git log
> 0afbfe89..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly one commit
> of the 15 intervening: `f19afd0d` (the #307 shop-effect-duplication fix —
> splits `buff_critical_damage_up` into `buff_liars_gambit`/
> `buff_abyssal_presence` for Philosopher's Tea/Void Essence so Glen Market
> stops printing an identical line for two differently-priced items). Read
> its full diff directly: it touches `src/Effects/buffs.library.json` (two
> new buff entries), `src/Items/consumable.library.ts`, a new
> `dead-consumable-payload.engine.test.ts`, and
> `axiomancer-mobile/state/combat/keywords.ts`'s `SUPPORT_KEYWORD` map —
> NOT `MECHANIC_KEYWORD`/`KEYWORD_GLOSS`. Confirmed via that map's own
> header comment it is explicitly "NOT card keywords and NOT in the
> 30-keyword glossary", mapped only so the combat log never prints a raw
> effect id; both new ids reuse the existing 'Mark' closest-analogue
> mapping (same pattern as the pre-existing `buff_critical_rate_up`/
> `buff_critical_damage_up`/`buff_status_chance_up` rows) — no new keyword
> badge, no atlas row implicated, correctly out of this skill's scope. The
> other 14 intervening commits were the sibling cards/equipment/enemies
> pass-10 and npcs-adjacent ticks and their ledger-bump commits, two
> `/expand` passes with no candidates filed, a `critique` pass, and an
> `/audit`-fix pair (finding [4.0], the same `f19afd0d` shop-effect-dup
> above, and finding [5.6], stale hazard/route ids in
> `axiomancer-mechanics/docs/cli.md` and the fishing-village walkthrough
> only) — none touched the keyword-registry surface. Confirmed every
> keyword-surface source file is byte-identical to pass 9's tree via direct
> per-file `git log -1`, not just the path-scoped range query:
> `src/Cards/types.ts` last-touched `515ac4d9` (2026-09-02, THE PATH),
> `src/Combat/combat.cards.ts` `37dacef1` (pass 8),
> `axiomancer-card-editor/src/data/mechanics.ts` `ed6b1be3` (2026-09-02),
> `src/Effects/e2e/deprecated-effects.engine.test.ts` `e9201415`
> (2026-09-02), `docs/keyword-atlas.md` `9016a99f` (pass 2),
> `docs/retheme-map.json` `d83978cb` (2026-08-15) — all predate pass 9.
> Re-derived every Step-1 signal fresh anyway via new throwaway extraction
> scripts against the live tree, per this skill's own discipline (never
> trust an empty diff alone): (1) **`CardSpecialMechanic`/
> `SynergyStatePredicate` kind count** — a fresh `kind: '...'` parse of
> `types.ts`'s two unions gives exactly 50 + 7 = 57, byte-identical file so
> this reproduces pass 9's count directly, not assumed from it. (2)
> **display-switch parity** — counted `case` arms directly in both
> `combat.cards.ts` generator functions: `mechanicText` 50/50,
> `statePredicateText` 7/7 (`enemy-dealt-no-damage-last-round`, `opening`,
> `finale`, `recoil-paid-this-turn`, `enemy-drew-blood`, `requiem`, `flow`
> — every arm prints a real face word, no bare `default:` fallthrough on
> either switch). (3) **card-library carrier-count sweep** — a fresh
> `kind: '...'` grep across all 9 `src/Cards/library/*.cards.ts` modules
> reproduces pass 9's exact histogram: the 13 kinds at exactly 2 carriers
> (`chain`, `echo`, `execute`, `extend_dots`, `finale`, `lock_stance`,
> `omen`, `opening`, `peroration`, `reap_all`, `replay_last`, `rupture`,
> `turnabout`), the 10 one-carrier kinds (`bank_spent_die`, `conjure_card`,
> `consume_affliction`, `convert_dots`, `grant_pip`, `purge_self`, `reap`,
> `recoil_x`, `reroll_spent`, `spend_premises`), and the 9 zero-carrier
> die-gear/card-local kinds (`strip_random_buff`, `befriend_attempt`,
> `refresh_die`, `convert_die_color`, `overheat`, `forge_floating_die`,
> `float_x_die`, `spend_all_pips`, `echo_next_spell`) are unchanged. Cross-
> checked the zero-carrier 9 directly against mobile's
> `KINDS_WITHOUT_MECHANIC_KEYWORD` exemption list (read fresh, 23 entries:
> the die-gear cluster, card-local one-offs, and `deal`/`rider`) plus the
> live `MECHANIC_KEYWORD` map (27 entries) — 23 + 27 = 50, exhaustive
> against `CardSpecialMechanic`, no new REMOVE candidate; every 2-carrier
> kind still clears the atlas's own "≥2 cards or ≥2 enemies" floor. (4)
> **enemy-keyword carrier sweep** — a fresh comment-stripped `kind: '...'`
> extraction across `enemy.library.ts`'s keyword arrays gives brutal 21,
> elusive 3, hide 21, ravenous 3, regrow 5, swift 19, unshaken 12, venom 9,
> wounding 13 — byte-identical to pass 9 (file unchanged since `e57f9f63`,
> pass 6), all 9 atlas-listed enemy keywords still carry ≥2. (5) **registry
> parity** — `axio_overview`/`axio_keywords` reconfirm 68 keyword rows (59
> player/enemy bold rows + 9 system-terms rows), 128 cards, 78 enemies,
> unchanged from pass 9. (6) **overlapping-semantics sweep** — read the
> full atlas table fresh across all 8 player families plus enemy and
> system-terms: no pair's semantics collide closely enough to warrant a
> drill-or-retire call (THORNS/BACKFIRE/RIPOSTE/QUARTER each sit on a
> distinct axis — per-attack reprisal, rung-denial reprisal, one-phase
> counter, incoming-damage reduction, respectively; FESTER/PROLONG split
> cleanly along intensity vs. duration) — same reading as every prior
> pass, no new collision found. (7) **`kb:` receipt sweep** — re-read the
> atlas's own header: the prior-art-receipt requirement was explicitly
> repealed 2026-09-02 ("A `kb:` receipt is welcome in the notes; it is not
> required") — this signal is structurally satisfied by design, not a live
> gap, consistent with every pass since the rewrite. (8) **Chaos/generic-
> Upgrade design-gap re-check** (per the dispatch note) — re-read the
> standing `[loop-call]` in `plan/AUDIT.md` (filed pass 9, 2026-09-13): no
> card idea, theme attachment, or rank slot has been proposed for either
> family in the 15 intervening commits (none of which touched card
> authoring at all, per the diff above), so neither clears the skill's own
> CREATE bar ("a real design gap exists," not "a mechanic Dawncaster has
> that we lack") — still correctly left for owner ratification; re-cited,
> not re-filed, not force-built into a CREATE this pass. (9) **mobile KW
> jest suite** — ran `state/combat/__tests__/keywords.test.ts` directly:
> 13/13 green (KW-1 unmapped-effect-id, KW-3 dead-reference ×4, terse-gloss
> ×2, card-text-grammar ×3, KW-6 family parity, KW-5 persistent-card
> reach), matching pass 9 exactly. No genuine finding this pass — every
> signal re-tested clean against a provably near-unchanged source graph
> (one commit touching the surface, and it resolved to an explicitly
> out-of-scope support-effect mapping), not assumed stale-clean from an
> empty log alone. KB research (skill §3 Step 2): not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per the REMOVE/no-op carve-out the sibling
> categories' own zero-diff passes have used identically; the one
> KB-adjacent item (the Chaos/Upgrade re-check, item 8 above) was a re-read
> of a receipt already gathered pass 9, not a fresh KB run. Verify: ran all
> four gates in full this pass (not skipped, despite the near-empty source
> diff) — `npm run verify --workspace axiomancer-mechanics` (213/213
> files, 3435 tests + build green, up from pass 9's 3428 via the #307
> fix's own new test file plus unrelated growth in sibling categories' own
> passes, not a keyword-surface signal), `npm run verify --workspace
> axiomancer-mobile` (full chained lint/typecheck/jest/assets:check/art:test
> script exit 0, art:test's own 24/24 confirmed directly in the tail),
> `npm run type-check --workspace axiomancer-card-editor` (clean, exit 0),
> root `npm test` 123/123 incl. `content-drift.test.mjs` 11/11 (registry/
> atlas/mobile-gloss parity, exemption-list accounting, and the "parsers
> found real tables" self-check all green). `npm run deploy:check`
> confirmed green pre-tick (HEAD `593650a1`, docs/plan-only tip commit, no
> gated workflow triggered) and will be re-confirmed after this ledger
> commit lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md`
> residue filed this pass — nothing actionable surfaced outside the
> standing, already-filed Chaos/generic-Upgrade `[loop-call]` re-cited
> above.
```

```
> **[adjust-enemies pass 10, 2026-09-14, commit 55eec31d]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`enemies` was the only qualifying category this
> tick: 15 commits since pass 9's commit `304608c1`, meeting the 15-commit
> threshold exactly; cards `1242bd60` 6 commits, equipment `36ee098c` 5,
> keywords `0afbfe89` 11, npcs `24cebc11` 9 all sat under their own
> 15-commit/36h thresholds — current time 2026-09-14T16:34Z, so none of the
> five categories' last-pass timestamps clear 36h either). `git log
> 304608c1..HEAD -- axiomancer-mechanics/src/Enemy
> axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World`
> and the matching `git diff --stat` over the same path set are both
> empty — none of the 15 intervening commits (the sibling
> cards/equipment/keywords/npcs pass-9/10 ticks and their ledger bumps, a
> critique pass, a CI dice-tray/signature-column stacking-context fix, and
> an equipment shop-effect-duplication follow-up) touched the roster
> surface. Confirmed every enemy-surface source file is byte-identical to
> pass 9's tree via direct per-file `git log -1`, not just the path-scoped
> range query: `enemy.library.ts`/`combat.enemy-decks.ts` last-touched
> `e57f9f63` (pass 6), `loot.ts` `42f91acd`, `enemy-keywords.ts`
> `7b84c8bb`, `combat.enemy-cards.ts` `9caaa431`,
> `axiomancer-mobile/assets/images/enemies/index.ts` `e57f9f63` — all
> predate `304608c1`. Re-derived every Step-1 signal fresh anyway via new
> throwaway `tsx` scripts run directly against the live tree rather than
> trusting the empty diff alone: (1) **enemy test suite** — `npx vitest
> run src/Enemy` 6 files / 63 tests green. (2) **orphan sweep** — 79
> `createEnemy` consts, all 79 resolve into `ENEMY_REGISTRY`; a
> fresh object-identity sweep (first attempt naively compared registry
> string keys against pool object references and false-flagged 77 objects
> as "orphans" — a script bug, corrected to compare by object identity
> before concluding) confirms exactly 2 genuine exclusions, matching pass
> 9: `sandbag` (test fixture) and `the-incompleteness` (impossible-ceiling
> boss, both carry an explicit `DESIGN REQUIREMENT` comment barring
> `EnemiesByMap` entry). (3) **roster-size / overlap** — all 10 pools
> recomputed fresh: fishing-village 13, northern-forest 39, caverns 16,
> northern-city 8, connecting-river 5, town-across-river 4, the-capital 8,
> aporia-colonnade 8, aporia-archive 8, aporia-proof 11 — identical to
> pass 9 (source files unchanged, so the pass-9 pairwise-overlap
> re-derivation stands unmodified). (4) **deck sweep** — 92 raw
> `ENEMY_DECKS` key declarations, byte-identical count to pass 9 (file
> unchanged since `e57f9f63`, pre-dating pass 6). (5) **portrait sweep** —
> 77 `portraitAsset` values via `ENEMY_REGISTRY`, 0 duplicates. (6)
> **VITAE-band sweep** — 21 explicit `vitae:` overrides, matching pass 9;
> both `enemy.library.ts` and the VITAE-formula constants
> (`src/Enemy/index.ts`) unchanged since before pass 9, so the standing
> worst-deviation figure (ElderFireGiant +25.7%, inside tolerance) stands.
> (7) **aftermath-prose/voice sweep** — a naive `thee|thou|thy|thine|ye`
> grep against `enemy.library.ts` returned 18 hits; read each in context
> and confirmed every one is a substring false-positive (`without`
> contains `thou`, `toothy` contains `thy`) — 0 genuine archaic-voice
> violations, matching pass 9's own "0 matches" reading exactly once
> false positives are excluded. 47/79 enemies carry `finalBlowLines`,
> unchanged — the standing 32-enemy backlog (filed pass 1, `plan/AUDIT.md`
> `[content]`, explicitly scoped to `content-curator`, not this skill,
> "too large to fold into a routine pass") re-read at its current text,
> still open, still accurate, re-cited not re-filed. (8) **loot-table
> sweep** — corrected an initial extraction-regex miss (the first
> `drop('...'` grep pattern returned zero matches due to a shell-quoting
> escape bug, not an actual empty table) and re-ran with a fixed pattern:
> 22 distinct `drop()` ids, all 22 resolve 1:1 against
> `Items/consumable.library.ts`'s 22 ids, matching pass 9. Also swept
> `plan/AUDIT.md`/`plan/PHASE_CANDIDATES.md`/`plan/CRITIQUE.md` fresh for
> any new enemy-scoped item: the only hits are standing, already-filed
> rows — the finalBlowLines backlog above, the Capital enemy-pool-reuse
> row (already `[x]` RESOLVED via pass 6), and the late-campaign
> difficulty-cliff candidate (score 6.5, explicitly a card-scaling/
> engine-constant design decision per the overhaul doc, not a roster
> finding, `/expand`'s to own) — no new roster-scoped candidate. KB
> research (skill §3 Step 2): not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per the
> REMOVE/no-op carve-out the sibling categories' own zero-diff passes have
> used identically. Verify: ran both gates in full this pass (not skipped,
> despite zero source diff) — `npm run verify --workspace
> axiomancer-mechanics` (213/213 files, 3432 tests + build green) and `npm
> run verify --workspace axiomancer-mobile` (299/299 suites, 2854 tests,
> lint/typecheck/jest/assets:check/art:test 24/24 all green). `npm run
> deploy:check` confirmed green pre-tick (HEAD `e3f65406`, docs/plan-only
> tip commit, no gated workflow triggered) and will be re-confirmed after
> this ledger commit lands. No `plan/PHASE_CANDIDATES.md` or new
> `plan/AUDIT.md` residue filed this pass — nothing actionable surfaced
> outside the standing, already-filed 32-enemy `finalBlowLines` backlog
> re-cited above.
```

```
> **[adjust-equipment pass 10, 2026-09-14, commit 36ee098c]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`equipment` was the only qualifying category this
> tick: 16 commits since pass 9's commit `22ce276c`, past the 15-commit
> threshold; cards `1242bd60` 1 commit, enemies `304608c1` 10, keywords
> `0afbfe89` 6, npcs `24cebc11` 4, all sat under their own 15-commit/36h
> thresholds). `git log 22ce276c..HEAD -- axiomancer-mechanics/src/Items
> axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` and the matching `git diff --stat` are
> both empty — none of the 16 intervening commits touched the item/shop/
> signature surface (they were the sibling categories' own pass-9/10 ticks
> plus assorted plan-doc/ledger bumps and a critique pass). Re-derived every
> Step-1 signal fresh anyway, same discipline as pass 9's own zero-diff
> re-audit: (1) **dominated relics** — re-read all 8 `relic.library.ts`
> entries (byte-identical since pass 9): the two weapon relics tie at
> body+2, the two armor relics tie at maxHp+5, and the two mind/two heart
> accessories each tie within their pair — every same-slot tie differs only
> by `grantsSignature` (re-confirmed non-`undefined` and distinct on all 8),
> no strictly-dominated pair. (2) **shop/reward-pool coverage** — a fresh
> `itemId: '...'` extraction across all 7 `shop.wares` blocks in
> `World/MapEvents/content.ts` reconfirms the same 12 distinct shop-stocked
> consumable ids, unchanged; the other 10 of the 22-entry `consumableLibrary`
> remain reachable via `rollCacheReward`'s uniform draw over the full
> unfiltered library (`cache-reward.ts` byte-identical since pass 1) — no
> orphaned item. (3) **`grantsSignature` drift** — all 8 relic values
> re-checked against the live 8-member `SignatureSkillId` union in
> `combat.encounter.types.ts`: identical, no rename/removal. (4) **dead
> consumable `effectId`s** — re-extracted the 11 non-heal-only ids from
> `consumable.library.ts` (unchanged, still 22 entries) and confirmed each
> resolves by id against `buffs.library.json`/`debuffs.library.json` via a
> fresh grep, all 11 found, 0 dead references. (5) **`AccessoryKind` gap** —
> head/hands/feet remain at zero live relics, same standing `[loop-call]`
> (`plan/AUDIT.md`, 2026-09-04, answers the open `[HIGH]` in
> `plan/CRITIQUE.md`) re-read at its current text: still open, still
> accurate, no new evidence this pass to decide it solo between (a)
> designing a 9th+ signature skill first or (b) breaking the relic's 1:1
> identity rule for stat-only accessories — left filed, not re-litigated
> (already promoted to `plan/PHASE_CANDIDATES.md` "[score 5.5] Fill the 3
> empty accessory kinds" pending `/oversight`, re-cited not re-filed). KB
> research (kb-query gate, skill §3 Step 2): not run — every consideration
> this pass was audit-confirmed-clean (no CREATE/UPDATE), exempt from the
> gate per skill §3 Step 2 (REMOVE/no-op carve-out). Verify: ran both gates
> in full this pass (not skipped, despite zero source diff) — `npm run
> verify --workspace axiomancer-mechanics` (213/213 files, 3428 tests +
> build) and `npm run verify --workspace axiomancer-mobile` (299/299
> suites, 2854 tests, 3/3 snapshots, lint/typecheck/jest/assets:check/
> art:test all green). `npm run deploy:check` confirmed green pre-tick and
> will be re-confirmed after this commit lands. No `plan/PHASE_CANDIDATES.md`
> or new `plan/AUDIT.md` residue filed this pass — nothing actionable
> surfaced outside the standing, already-filed backlog items re-cited above.

> **[adjust-cards pass 10, 2026-09-14, commit 1242bd60]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`cards` was the only qualifying category this
> tick: 16 commits since pass 9's commit `4b1b6a64`, past the 15-commit
> threshold; equipment `22ce276c` 14 commits, enemies `304608c1` 8,
> keywords `0afbfe89` 4, npcs `24cebc11` 2 all sat under their own
> 15-commit/36h thresholds). `git log 4b1b6a64..HEAD -- axiomancer-mechanics/
> src/Cards axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` is empty; the matching
> `git diff --stat` over the same path set is also empty. Read the 16
> intervening commits directly: all were the sibling equipment/enemies/
> keywords/npcs pass-9 ticks (each already independently confirmed clean of
> the card-authoring surface by their own logs above) plus their ledger-bump
> commits, a CI dice-tray/rune-column stacking-context fix
> (`dd1c1c32`/`c15f4119`, `CombatBoard.tsx` hit-testing only), a UI PR
> bundling intro fade/equipment-detail-modal/threat-accordion/card-border-
> shadow (`267234fe`/`31cc5cd5`/`d4468c21`, read all three diffs in full —
> none touches `cards.library.ts`, `cards.pricing.ts`, `combat.cards.ts`'s
> generators, or any preset/draft pool), and a critique pass — none of the
> 16 touched the card/effect/combat-authoring surface. Confirmed
> `src/Cards/cards.library.ts`, every `src/Cards/library/*.cards.ts` module,
> `cards.pricing.ts`, `cards.sandbox-sets.ts`, `combat.starter-deck-presets.ts`,
> and `combat.deck-draft.ts` are all byte-identical to pass 9's tree (the
> matching `git log 4b1b6a64..HEAD -- <those paths>` is empty). Re-ran every
> Step-1 guard directly rather than trusting the empty diff alone: (1)
> **reachability** — `combat-playtest.card-coverage.sim.test.ts` 123/123,
> matching pass 9 exactly. (2) **pricing sanity + honesty + FREE-line +
> aspect-thirds** — `pricing.engine.test.ts` (251), `curated-library.engine.
> test.ts` (14), `preview-truth.engine.test.ts` (10),
> `paid-summary-honesty.engine.test.ts` (4), `deck-presets.engine.test.ts`
> (9) all green, byte-identical counts to pass 9. (3) **registry parity** —
> `axio_overview` reconfirms 128 cards, 68 keyword rows, and the identical
> per-theme totals (debt 19, trial 24, rot 19, choir 21, vigil 20, curse 5,
> grave 20), unchanged from pass 9. Standing `plan/AUDIT.md` `[loop-call]`s
> re-checked against current source, not re-litigated: the 19 orphaned
> `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts` (filed pass 1;
> file itself untouched since pass 9, confirmed via the same empty
> path-scoped log) and `the-sextons-count`'s missing TWIN trigger (filed
> pass 1; `grave.cards.ts` likewise untouched) — both re-confirmed still
> open, still mechanics-expert/engine-constant territory, not this skill's
> to solo. KB research (skill §3 Step 2): not run — every consideration this
> pass was audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate
> per the REMOVE/no-op carve-out the sibling categories' own zero-diff
> passes have used identically. Verify: ran all three gates in full (not
> skipped, despite zero source diff) — `npm run verify --workspace
> axiomancer-mechanics` (213/213 files, 3428 tests + build, byte-identical
> to pass 9's count), `npm run verify --workspace axiomancer-mobile` (full
> chained lint/typecheck/jest/assets:check/art:test script exit 0, art:test's
> own 24/24 confirmed directly in the tail), `npm run type-check --workspace
> axiomancer-card-editor` (clean, exit 0). `npm run deploy:check` confirmed
> green pre-tick (HEAD `54550f57`, docs-only critique-pass tip commit, no
> gated workflow triggered) and will be re-confirmed after this ledger
> commit lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue
> filed this pass — nothing actionable surfaced outside the two standing,
> already-filed backlog items re-cited above.
```

```
> **[adjust-npcs pass 9, 2026-09-14, commit 24cebc11]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`npcs`' pass-8 commit `abb3da01` was the stalest
> qualifying category this tick: 23 commits since, past the 15-commit/36h
> threshold; cards `4b1b6a64` 13 commits, equipment `22ce276c` 11, enemies
> `304608c1` 5, keywords `0afbfe89` 1 all sat under their own threshold and
> under 36h old). `git log abb3da01..HEAD -- axiomancer-mechanics/src/NPCs
> axiomancer-mechanics/src/World axiomancer-mechanics/specs/story
> axiomancer-mechanics/specs/characters` returns exactly two commits of the
> 23 intervening: `a74d946f` (the 2026-09-12 work-audit fix — rest heal
> copy, Android paced-event back lock, arrears threshold — touches
> `World/RestChoice` and mobile character/status-card surfaces, not
> `src/NPCs` or any continent's `npcs.ts`/`maps.ts`) and `c6ca37d7` (a merge
> of a parallel work-audit branch into main; its diffstat touches
> `Northern-Forest/npcs.ts` and two engine test files, but read against the
> live tree this is the same pass-8 Northern-Forest retheme arriving via a
> second path, not new content — the working tree already reflects it, no
> double-count). The other 21 intervening commits were the sibling
> cards/equipment/enemies pass-9 ticks and their ledger bumps, unrelated to
> the NPC/dialogue surface. Re-derived every Step-1 signal fresh against the
> live tree rather than trusting the near-empty path-scoped log alone: (1)
> **NPC census** — 21 authored `NPC` consts across the 4 files
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7), unchanged
> from pass 8. (2) **reachability** — ran `narrative-reachability.test.ts`
> (5/5), `World/e2e/narrative-reachability.engine.test.ts` (26/26 across
> every registered map), `NPCs/e2e/dialogue.engine.test.ts` (18/18), and
> `NPCs/e2e/story-npcs.engine.test.ts` (36/36) directly — `unresolvedInteractions`
> and `unreachableNpcs` both empty on every map, no orphaned tree, no
> scenery-as-people. (3) **unstaged-NPC backlog re-verification** — the
> standing 4-NPC `unstagedNpcs` list (`Coastal-Village/maps.ts`:
> Tide-Shopkeeper, Village Healer, Dockworker's Union Leader, Merchant's
> Widow) re-checked against current source, each precondition re-tested not
> just re-cited: `isShopkeeper` still has zero mobile consumers (a fresh
> `grep -rn isShopkeeper axiomancer-mobile --include='*.ts' --include='*.tsx'`
> returns nothing; the working shop mechanism mobile actually renders is the
> unrelated `MapEvent.merchants` path, 7 `isShopkeeper: true` interaction
> merchants already using it) — and read the Tide-Shopkeeper's own
> `tideshopkeeperTree` `browse` node text directly for the first time this
> pass rather than trusting the precondition secondhand: it literally reads
> "The shopkeeper gestures at three crates. (Shop implementation lands in a
> later spec.)" — a dev placeholder baked into the authored copy, confirming
> S-02's stated reason isn't stale caution, staging today would ship that
> exact line to a player. `RestChoice/` still carries zero `NPC` references
> (Village Healer's precondition unmet); `/village`'s existence (phase 5)
> re-confirmed irrelevant to the Union Leader/Merchant's Widow precondition,
> which is about their own map lacking a settlement screen, not settlement
> screens generally — unchanged reading. (4) **map NPC-floor sweep** — wrote
> a fresh throwaway script against `MAP_REGISTRY` computing actual
> node-reachable (not roster) NPC counts per map, independent of pass 7/8's
> own tooling: fishing-village 4 reachable (+4 declared-unstaged),
> northern-forest 6, caverns 1, northern-city 2, connecting-river 1,
> town-across-river 1, the-capital 2, the three aporia labyrinth maps 0
> (by design — the Sophist's accordion narration carries that continent's
> voice, confirmed still fully implemented per pass 8's reading, not an NPC
> gap). The <2 sub-floor (caverns/connecting-river/town-across-river) is the
> exact standing `plan/AUDIT.md` `[needs-user-call]` row ("Three of four
> Northern-Continent maps carry only 1 staged NPC", filed 2026-09-05) —
> re-read at its current text, still open, still correctly un-actioned
> (inventing 1-3 named characters is character-spec/story-spec territory,
> not this skill's to solo). (5) **legacy `DialogueMap` sweep** — zero live
> `dialogue:` (flat-map) usage anywhere outside the type declaration,
> unchanged. (6) **teachCard / quest-reference sweep** — `teachCard` still
> has zero call sites; every live `startQuest`/`progressQuest`/
> `completeQuest` target (11 distinct refs across both continents) resolves
> against the current `QuestName` union — also typecheck-guaranteed, but
> re-extracted and cross-checked directly rather than assumed. (7)
> **spec-to-NPC gap** — `git log abb3da01..HEAD -- axiomancer-mechanics/specs/`
> is empty; both `specs/story/` entries (S-01, S-02) and the one
> `specs/characters/` entry (C-01 the Sophist) re-confirmed implemented per
> pass 8's own from-scratch reading, unchanged since. (8) **dev-placeholder
> sweep** — a fresh `TODO|FIXME|lands in a later spec|not yet implemented|
> placeholder|coming soon` grep across every NPC/map content file surfaces
> only the already-known, already-unstaged Tide-Shopkeeper line from (3) —
> no new leak. KB research (skill §3 Step 2): not run — every consideration
> this pass was audit-confirmed-clean (no CREATE/UPDATE), exempt from the
> gate per the REMOVE/no-op carve-out the sibling categories' own zero-diff
> passes have used identically. Verify: ran both gates in full (not skipped,
> despite zero source diff) — `npm run verify --workspace
> axiomancer-mechanics` (213/213 files, 3428 tests + build, byte-identical
> to cards/equipment/enemies/keywords pass-9's own count) and `npm run
> verify --workspace axiomancer-mobile` (299/299 suites, 2854 tests, 3/3
> snapshots, lint 0 errors/15 pre-existing warnings, typecheck clean,
> assets:check clean, art:test 24/24 — matching pass 8's counts exactly,
> confirming a genuine zero-diff pass, not an unmeasured one). `npm run
> deploy:check` confirmed green pre-tick (HEAD `9eb1407d`, no gated workflow
> triggered for the docs/plan-only tip commit) and will be re-confirmed
> after this ledger commit lands. No `plan/PHASE_CANDIDATES.md` or new
> `plan/AUDIT.md` residue filed this pass — nothing actionable surfaced
> outside the two standing, already-filed backlogs re-cited above (S-02's
> 4-NPC unstaged list; the Northern-Continent single-NPC-maps
> `[needs-user-call]` row).
```

```
> **[adjust-keywords pass 9, 2026-09-13, commit 0afbfe89]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`keywords` was the stalest qualifying category this
> tick: 23 commits since pass 8's commit `37dacef1`, past the 15-commit/36h
> threshold and the oldest of the five categories' own last-pass timestamps —
> npcs `abb3da01` sat under its own threshold, cards `4b1b6a64`/equipment
> `22ce276c`/enemies `304608c1` all landed later the same day). `git log
> 37dacef1..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` is empty, matching the exact
> 23-commit count `/march` measured; the matching `git diff --stat` over the
> same path set is also empty. Read the 23 intervening commits directly rather
> than trusting the empty path-scoped log alone: 21 of them were the sibling
> cards/equipment/enemies pass-9 ticks (each already zero-diff and
> independently confirmed clean of the keyword surface by their own logs
> above) plus their ledger-bump commits; the remaining 2 were
> `dd1c1c32`/`c15f4119` (a die-vs-signature-column z-index stacking-context
> fix, `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` only —
> hit-testing/layout, not the glyph/gloss/keyword-registry surface) and
> `d4468c21` (a UI PR bundling intro fade, an equipment detail modal, and a
> threat-reveal accordion — `app/(tabs)/inventory`, `app/cutscene`,
> `CombatBoard.tsx`, `CombatEncounterPanel.tsx`, a new
> `EquipmentDetailModal.tsx`/`equipment-detail.engine.ts` presenter — read all
> three diffs in full; none touches `statusGlyphs.ts`, `glyphShapes.ts`,
> `KEYWORD_GLOSS`, `mechanicHeadline`/`MECH_HEADLINE_PRIORITY`, or
> `SPECIAL_MECHANIC_KINDS`/`wx.ts`). Re-derived every Step-1 signal fresh
> anyway rather than trusting the empty diff, same discipline as every prior
> pass: (1) **`CardSpecialMechanic`/`CardRider`/`SynergyStatePredicate` kind
> count** — a fresh `kind: '...'` extraction from `src/Cards/types.ts` gives
> 50 `CardSpecialMechanic` + 7 `SynergyStatePredicate` = 57, byte-identical to
> pass 8 (the file itself shows zero commits since `37dacef1`). (2)
> **display-switch parity** — counted `case '...'` arms inside
> `combat.cards.ts`'s two generator functions directly rather than trusting
> the file's unchanged status alone: `mechanicText` carries exactly 50 cases,
> `statePredicateText` exactly 7 — 57/57 resolve, matching pass 8's own
> post-fix state (56 pre-fix + the `conjure_card` fix it shipped = 57); no new
> silent `default:` gap. (3) **card-library carrier-count sweep** — a fresh
> `kind: '...'` grep across all 9 `src/Cards/library/*.cards.ts` modules
> (unchanged file set, confirmed via the same empty path-scoped log)
> reproduces pass 8's exact histogram: the ten kinds at exactly 2 carriers
> (`chain`, `echo`, `execute`, `extend_dots`, `finale`, `lock_stance`, `omen`,
> `opening`, `peroration`, `reap_all`, `replay_last`, `rupture`, `turnabout` —
> 13 total, matching pass 8's expanded list including the three it named
> individually) sit unchanged at the atlas's own "≥2 cards or ≥2 enemies"
> floor; the ten one-carrier kinds (`bank_spent_die`, `conjure_card`,
> `consume_affliction`, `convert_dots`, `grant_pip`, `purge_self`, `reap`,
> `recoil_x`, `reroll_spent`, `spend_premises`) and the zero-carrier die-gear/
> card-local kinds (`strip_random_buff`, `befriend_attempt`, `refresh_die`,
> `convert_die_color`, `overheat`, `forge_floating_die`, `float_x_die`,
> `spend_all_pips`, `echo_next_spell`) are unchanged from pass 8's own
> cross-check against mobile's `KINDS_WITHOUT_MECHANIC_KEYWORD` exemption
> list — no new REMOVE candidate (mobile file itself shows zero commits since
> `37dacef1`, so the exemption mapping cannot have drifted). (4) **enemy-
> keyword carrier sweep** — a fresh comment-stripped `{ kind: '...' }`
> extraction across `enemy.library.ts`'s `keywords:`/`gain:` arrays gives
> brutal 21, elusive 3, hide 21, ravenous 3, regrow 5, swift 19, unshaken 12,
> venom 9, wounding 13 — byte-identical to pass 8 (file shows zero commits
> since `e57f9f63`, pass 6, well before this window), all 9 atlas-listed
> enemy keywords still carry ≥2. (5) **registry parity** — `axio_overview`
> reconfirms 68 keyword rows, 128 cards, 78 enemies, unchanged from pass 8.
> (6) **Known-drift section accuracy** — re-read `debuffs.library.json` and
> `src/Combat/effects.ts` directly: POISON/BLEED/DOOM `damagePerRound` still
> 2/3/1 and `CAPITULATE_MIN`/`CAPITULATE_RESOLVE_FRACTION` still 10/0.35
> (`RUPTURE_CAP_FRACTION` still `Number.POSITIVE_INFINITY`) — the atlas's
> "Known drift" note stays accurate, re-cited not re-filed. (7) **functions-
> column design-gap sweep** (kb-query gate territory, run to satisfy Step 1's
> own audit-signal table even though no CREATE resulted) — read the full
> 141-row `DigitalCardGames/dawncaster/keywords.csv` fresh via `kb_read_doc`
> and checked its `functions` column against our eight-family registry
> (damage, afflictions/payoffs, walls/reprisal, tempo/control, turn shape,
> deck-as-resource, resolve/harvest/mercy, dice): the genre families we do NOT
> carry an analogue for — Dawncaster's "Chaos" (Balance/Order/Delirious/
> Dominated/Pinned: hand-shuffling and parity-gated constraints) and generic
> per-card "Upgrade" (Mergecraft/Infuse/permanent damage-per-upgrade) — are
> the same two gaps every reading of this csv would surface, not a new
> finding; neither clears the skill's own bar ("a real design gap exists," not
> "a mechanic Dawncaster has that we don't") without a concrete card idea and
> owner ratification of a NEW verb class, so filed as a `[loop-call]` residue
> below rather than force-built into a CREATE this pass — consistent with
> "don't force a finding that isn't real." (8) **mobile KW-1/KW-3 jest suite**
> — ran `state/combat/__tests__/keywords.test.ts` directly (13/13 green,
> matching pass 8, since no mobile keyword file moved). No genuine finding
> this pass — every signal re-tested clean against a provably unchanged
> source graph, not assumed stale-clean from an empty log alone. KB research
> (skill §3 Step 2): the functions-column read above was exploratory (Step 1
> audit signal, not a CREATE/UPDATE gate) and surfaced no ratified design gap,
> so no CREATE/UPDATE shipped and the KB gate does not apply; REMOVE also
> didn't apply (no candidate cleared the ≥2-carrier retirement bar either).
> Verify: ran all four gates in full (not skipped, despite zero source diff)
> — `npm run verify --workspace axiomancer-mechanics` (213/213 files, 3428
> tests + build, matching pass 8/cards-pass-9/equipment-pass-9's count
> exactly), `npm run verify --workspace axiomancer-mobile` (lint 0 errors/15
> pre-existing warnings, typecheck clean, jest 299/299 suites, 2854 tests, 3/3
> snapshots — matching pass 8 exactly, assets:check clean, art:test 24/24),
> `npm run type-check --workspace axiomancer-card-editor` (clean, exit 0),
> root `npm test` 123/123 (incl. `content-drift.test.mjs`, unaffected — no
> atlas/mobile-gloss/card-editor table touched). `npm run deploy:check`
> confirmed green pre-tick (HEAD `c15f4119`, verify-mobile workflow success)
> and will be re-confirmed after this ledger commit lands. Residue: filed the
> Chaos-family/generic-Upgrade design-gap reading from (7) to `plan/AUDIT.md`
> as a `[loop-call]` — a genre-toolbox observation, not a ratified gap, left
> for an owner to decide whether either is worth a new verb class; no
> `plan/PHASE_CANDIDATES.md` entry, since neither has a concrete card idea
> attached yet.
```

```
> **[adjust-enemies pass 9, 2026-09-13, commit 304608c1]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`enemies` was the stalest qualifying category this
> tick: 18 commits since pass 8's commit `832e3e5e`, past the 15-commit/36h
> threshold and the oldest of the five categories' own last-pass timestamps —
> keywords `37dacef1` 15 commits sat right at its own threshold, npcs
> `abb3da01` 13, cards `4b1b6a64` 3, equipment `22ce276c` 1, all under their
> own thresholds or more recently audited). `git log 832e3e5e..HEAD -- axiomancer-
> mechanics/src/Enemy axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts axiomancer-mobile/
> assets/images/enemies axiomancer-mechanics/src/World` returns exactly two
> commits of the 18 intervening: `abb3da01` (`/adjust-npcs` pass 8's own
> Northern-Forest dialogue retheme — touches `World/Continents/Northern-
> Forest/npcs.ts` prose and its engine test, not enemy data) and `a74d946f`
> (the 2026-09-12 work-audit fix — rest heal copy, Android paced-event back
> lock, arrears threshold — touches `World/RestChoice` and mobile character/
> status-card surfaces, not `src/Enemy` or the roster). Read both diffs in
> full directly to confirm neither touches `enemy.library.ts`, `EnemiesByMap`,
> `ENEMY_REGISTRY`, `loot.ts`, `enemy-keywords.ts`, `combat.enemy-decks.ts`,
> or `combat.enemy-cards.ts` — confirmed clean. The other 16 intervening
> commits were the cards/equipment pass-9 ticks (each with its own ledger
> bump) and their content-only diffs, unrelated to the roster surface.
> Re-derived every Step-1 signal fresh anyway with new throwaway extraction
> scripts (independent of pass 8's own tooling) run directly against the live
> tree, not copied from pass 8's numbers: (1) **orphan sweep** — 79
> `createEnemy` consts, all 79 resolve into `ENEMY_REGISTRY` (0 missing), 77
> resolve into some `EnemiesByMap` pool, same 2 deliberate exclusions as every
> prior pass (`Sandbag_01` test fixture, `TheIncompleteness` the impossible-
> ceiling boss) — no new orphan. (2) **roster-size floor / sibling-overlap
> sweep** — all 10 pools recomputed fresh: fishing-village 13, northern-forest
> 39, caverns 16, northern-city 8, connecting-river 5, town-across-river 4,
> the-capital 8, aporia-colonnade 8, aporia-archive 8, aporia-proof 11 —
> identical to pass 8. Full pairwise overlap re-run (all 45 pairs): the same 4
> pairs exceed 70% of the smaller pool — northern-forest/aporia-colonnade
> (87.5%), northern-forest/aporia-archive (87.5%), northern-forest/aporia-proof
> (90.9%), caverns/aporia-archive (75.0%) — all the documented labyrinth
> deliberate-reuse design (wandering foes scaling to the player via the
> adaptive level bands), unchanged since pass 1. (3) **deck sweep** — 92 raw
> `ENEMY_DECKS` key declarations, 78 unique after dedup, all 78 resolve
> against the 79 `ENEMY_REGISTRY` slugs via the `enemy-<slug>` convention; 157
> distinct card-id tokens referenced across every deck array resolve 1:1
> against `ENEMY_CARD_LIBRARY`'s 157 keys — 0 unresolved, 0 unused (full
> bijection, unchanged from pass 8). (4) **portrait sweep** — 77
> `portraitAsset` values, 0 duplicates, all 77 resolve 1:1 into
> `axiomancer-mobile/assets/images/enemies/index.ts`'s registry. (5)
> **VITAE-band sweep** — 21 explicit `vitae:` overrides, same count as pass 8;
> `enemy.library.ts` last-touched `e57f9f63` (pass 6, 2026-09-11) and the
> VITAE-formula constants (`src/Enemy/index.ts`) last-touched `e9201415`
> (2026-09-02) — neither has moved since pass 8 re-confirmed the standing
> worst-deviation figure (ElderFireGiant +25.7%, inside the ~±26% tolerance
> band), so that reading stands unchallenged. (6) **aftermath-prose/voice
> sweep** — 0 `thee`/`thou`/`thy`/`thine`/`ye` matches in `enemy.library.ts`;
> 47/79 enemies carry `finalBlowLines`, same as pass 8 — the standing 32-enemy
> backlog (filed pass 1, `plan/AUDIT.md` `[content]`, scoped to
> `content-curator` not this skill) re-read at its current text: still open,
> still accurate, unworsened, re-cited not re-filed. (7) **loot-table sweep**
> — 22 distinct `drop()` ids, all 22 resolve 1:1 against
> `Items/consumable.library.ts`'s 22 ids. Also confirmed every dependency
> surface a deck/loot/portrait sweep would need is unchanged since pass 8:
> `combat.enemy-cards.ts` and `enemy-keywords.ts`/`types.ts` last-touched
> 2026-09-02 (pre-dates pass 5), `consumable.library.ts` 2026-09-04,
> `buffs.library.json`/`debuffs.library.json`/`effects.ts`
> (`CAPITULATE_RESOLVE_FRACTION`/`CAPITULATE_MIN`) last-touched `636f3040`
> 2026-09-04 — every cross-reference above is provably re-testing the same
> graph pass 8 tested, not assumed stale-clean. KB research (kb-query gate,
> skill §3 Step 2): not run — zero CREATE/UPDATE this pass, exempt under the
> REMOVE/no-op carve-out the sibling categories' own zero-diff passes have
> used identically. Verify: ran both gates in full (not skipped, despite zero
> source diff) — `npm run verify --workspace axiomancer-mechanics` (213/213
> files, 3428 tests, build green — matching pass 9's card/equipment-audit
> count exactly), `npm run verify --workspace axiomancer-mobile` (full chained
> lint/typecheck/jest/assets:check/art:test script exit 0; art:test's own
> 24/24 confirmed directly in the tail). `npm run deploy:check` confirmed
> green pre-tick (HEAD `12f12efb`, docs/plan-only tip commit, no gated
> workflow triggered) and will be re-confirmed after this ledger commit
> lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed
> this pass — nothing actionable surfaced outside the standing, already-filed
> 32-enemy `finalBlowLines` backlog re-cited above.
```

```
> **[adjust-equipment pass 9, 2026-09-13, commit 22ce276c]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`equipment` was the stalest qualifying category this
> tick: 51 commits since pass 8's commit `030e26ae`, well past the
> 15-commit/36h threshold and the oldest of the five categories' own
> last-pass timestamps — enemies `832e3e5e` 16 commits, keywords `37dacef1`
> 13, npcs `abb3da01` 11, cards `4b1b6a64` 1, all under their own thresholds).
> `git log 030e26ae..HEAD -- axiomancer-mechanics/src/Items
> axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` and the matching `git diff --stat` are
> both empty — none of the 51 intervening commits touched the item/shop/
> signature surface (they were the sibling categories' own pass-8/9 ticks,
> a large ui-fresh-eyes swarm, a critique pass, and assorted plan-doc/ledger
> bumps). Re-derived every Step-1 signal fresh anyway rather than trusting
> the empty path-scoped log alone, same discipline as the sibling
> categories' own zero-diff re-audits: (1) **dominated relics** — re-read
> all 8 `relic.library.ts` entries (byte-identical since pass 8): the two
> weapon relics tie at body+2, the two armor relics tie at maxHp+5, and the
> two mind/two heart accessories each tie within their pair — every same-slot
> tie differs only by `grantsSignature` (re-confirmed non-`undefined` and
> distinct on all 8), no strictly-dominated pair. (2) **shop/reward-pool
> coverage** — a fresh `itemId: '...'` extraction across all 7 `shop.wares`
> blocks in `World/MapEvents/content.ts` reconfirms the same 12 distinct
> shop-stocked consumable ids, unchanged; the other 10 of the 22-entry
> `consumableLibrary` remain reachable via `rollCacheReward`'s uniform draw
> over the full unfiltered library (`cache-reward.ts` byte-identical since
> pass 1) — no orphaned item. (3) **`grantsSignature` drift** — all 8 relic
> values re-checked against the live 8-member `SignatureSkillId` union in
> `combat.encounter.types.ts`: identical, no rename/removal. (4) **dead
> consumable `effectId`s** — re-extracted the 11 non-heal-only ids from
> `consumable.library.ts` (unchanged, still 22 entries) and confirmed each
> resolves by id against `buffs.library.json`/`debuffs.library.json` via a
> fresh grep, all 11 found, 0 dead references. (5) **`AccessoryKind` gap** —
> head/hands/feet remain at zero live relics, same standing `[loop-call]`
> (`plan/AUDIT.md`, 2026-09-04, answers the open `[HIGH]` in
> `plan/CRITIQUE.md`) re-read at its current text: still open, still
> accurate, no new evidence this pass to decide it solo between (a)
> designing a 9th+ signature skill first or (b) breaking the relic's 1:1
> identity rule for stat-only accessories — left filed, not re-litigated
> (already promoted to `plan/PHASE_CANDIDATES.md` "[score 5.5] Fill the 3
> empty accessory kinds" pending `/oversight`, re-cited not re-filed). KB
> research (kb-query gate, skill §3 Step 2): not run — every consideration
> this pass was audit-confirmed-clean (no CREATE/UPDATE), exempt from the
> gate per skill §3 Step 2 (REMOVE/no-op carve-out). Verify: ran both gates
> in full this pass (not skipped, despite zero source diff) — `npm run
> verify --workspace axiomancer-mechanics` (213/213 files, 3428 tests +
> build, matching pass 9's card-audit count exactly) and `npm run verify
> --workspace axiomancer-mobile` (299/299 suites, 2854 tests, 3/3 snapshots,
> lint/typecheck/jest/assets:check/art:test all green). `npm run
> deploy:check` confirmed green pre-tick (HEAD `4e806143`, docs/plan-only
> tip commit, no gated workflow triggered) and will be re-confirmed after
> this commit lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md`
> residue filed this pass — nothing actionable surfaced outside the
> standing, already-filed backlog items re-cited above.
```

```
> **[adjust-cards pass 9, 2026-09-13, commit 4b1b6a64]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`cards` was the stalest qualifying category this
> tick: 86 commits since pass 8's commit `be34ca43`, well past the
> 15-commit/36h threshold; equipment `030e26ae`/enemies `832e3e5e`/keywords
> `37dacef1`/npcs `abb3da01` all sat under their own thresholds). Deploy was
> confirmed green pre-tick on HEAD `52690af1` (verify-mechanics and
> verify-mobile both success) per the dispatch note, so no pre-tick
> `deploy:check` re-run was needed. `git log be34ca43..HEAD --
> axiomancer-mechanics/src/Cards axiomancer-mechanics/src/Effects
> axiomancer-mechanics/src/Combat axiomancer-mechanics/docs/keyword-atlas.md
> docs/retheme-map.json axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly 2 commits of
> the 86 intervening: `5282cc0a` (a `ui-fresh-eyes` shard renaming the
> threat-preview's PLEA-shed clause from "steadies N resolve" to "shakes off
> N PLEA" in `combat.threat.ts` — a display-string fix, not a card/keyword
> change) and `37dacef1` (`/adjust-keywords` pass 8's own already-landed
> `conjure_card` display-case fix in `combat.cards.ts` plus its new
> `mechanic-text-coverage.engine.test.ts` guard). `git diff be34ca43..HEAD
> --stat` over the same path set confirms only those 3 files moved (84
> insertions/2 deletions total) and, critically, `src/Cards/cards.library.ts`
> and every `src/Cards/library/*.cards.ts` module are BYTE-IDENTICAL to pass
> 8's tree (`git log be34ca43..HEAD -- axiomancer-mechanics/src/Cards/library
> axiomancer-mechanics/src/Cards/cards.library.ts` is empty) — the 86
> intervening commits were entirely the npcs/keywords/enemies pass-8 ticks
> (each with its own ledger-bump), a UI-fresh-eyes sweep (FE-001 through
> FE-028 plus 8 tie-break/verified-finding shards), a content-pitch-session
> plan doc, a CI flake hardening fix, an `/audit`-fix tick, and two digests —
> nothing touched the card/effect/combat-authoring surface. Re-derived every
> Step-1 signal fresh anyway rather than trusting the near-empty path-scoped
> log alone: (1) **reachability** — ran
> `combat-playtest.card-coverage.sim.test.ts` directly: 123/123 playable
> cards (the full library minus the enemy-injected `curse` theme) still fire
> under a fallback seed, matching pass 8 exactly — no REMOVE candidate. Also
> confirmed the structural reason a "some card is in no preset/draft pool"
> REMOVE signal essentially cannot fire under the live architecture:
> `combat.deck-draft.ts`'s default (stage-unrestricted) pool is the FULL
> `cardLibrary`, so every card ships in *some* pool by construction; the
> coverage sim is the sharper, already-green dead-card detector. (2)
> **near-duplicates** — wrote a fresh same-`(theme,rank,philosophicalAspect)`
> collision scan restricted to kind-sets of size ≥2 (pass 6-8's own refined
> methodology) against the live `cardLibrary` via a throwaway `tsx` script:
> reproduces exactly the same 2 documented hits pass 4-8 have all found —
> `thin-hymn`/`alms-of-breath` (`rider,sway`) and `the-last-assize`/
> `the-vein-called-in` (`deal,overkill,recoil,wrath`) — no new collision. (3)
> **pricing sanity + honesty + FREE-line + aspect-thirds** —
> `pricing.engine.test.ts` (251), `curated-library.engine.test.ts` (14, the
> FREE-line law), `preview-truth.engine.test.ts` (10),
> `paid-summary-honesty.engine.test.ts` (4), and `deck-presets.engine.test.ts`
> (9, the pinned 5/5/5 preset-aspect-thirds law) all re-run directly and
> green, matching pass 8's counts exactly. (4) **scale-ladder drift** — wrote
> two fresh throwaway scans against the live `cardLibrary` rather than
> spot-checking by hand: a DEAL-only scan (pure single-mechanic cards,
> multi-hit totals compared against the CLAUDE.md §5.2 per-rank bands)
> and a GUARD/BARRIER-only scan (same methodology) — both report zero cards
> below 60% of their rank's floor; the one apparent hit the DEAL scan's
> naive first pass flagged (`the-blister-rosary`, rot rank 2, a bare `amount:
> 3`) resolved on inspection to a `hits: 4` multi-hit card (3×4=12, exactly
> the rank-2 multi-hit band total) once the script accounted for the `hits`
> field — a script bug, not a pricing bug, traced and corrected before
> concluding. (5) **aspect thirds** — `axio_overview`'s per-theme totals
> (debt 19, trial 24, rot 19, choir 21, vigil 20, curse 5, grave 20) match
> pass 8 exactly (byte-identical source); a fresh per-theme
> body/mind/heart breakdown (rot 8/5/6, vigil 7/7/6, grave 7/8/5, trial
> 8/8/8, choir 5/6/10, debt 6/5/8, curse 3/1/1 body/mind/heart) shows no
> aspect starving badly enough to threaten the governing 5/5/5 law, which
> stays green per (3) — no starvation case. (6) **FREE-line coverage** —
> `curated-library.engine.test.ts`'s 14/14 green re-confirms every theme
> still has a FREE-line-viable card. (7) **stale `// pts:` comment sweep** —
> a fresh per-file `id:`-literal vs `// pts:`-comment count (all 9
> `library/*.cards.ts` modules) shows small file-level discrepancies (choir
> 16 ids/17 pts, trial 20/21, starters 8/10) traced to header/factory-level
> documentation comments (the curse() factory's own shared `// pts:
> deliberately worthless` note covering all 5 curses, which pass as
> id-less positional-arg calls, not `id: '...'` literals) rather than any
> card missing or lying about its comment — the arithmetic reconciles
> exactly to 128 total cards, no gap. Standing `plan/AUDIT.md` `[loop-call]`s
> re-checked against current source, not re-litigated: the 19 orphaned
> `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts` (filed pass 1) —
> confirmed `combat.engine.ts` is untouched since pass 8
> (`git log be34ca43..HEAD -- axiomancer-mechanics/src/Combat/combat.engine.ts`
> is empty) and a fresh `zoneHas(state, '` count (46 total sites, matching
> the file's unchanged state) reconfirms the finding stands unmodified,
> still open, still mechanics-expert cleanup territory; and
> `the-sextons-count`'s missing TWIN trigger (same filing) — re-read the
> card's current `grave.cards.ts` entry and its two live
> `zoneHas(state, 'the-sextons-count')` sites (RECALL/REPLAY, both still
> correctly wired per the filed note) — TWIN itself still unwired for the
> same stated variable-scope reason, still open, still
> engine-constant/mechanics-expert territory. KB research (kb-query gate,
> skill §3 Step 2): not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per skill
> §3 Step 2 (REMOVE/no-op carve-out). Verify: ran all three gates in full
> this pass (not skipped, despite the near-empty source diff) — `npm run
> verify --workspace axiomancer-mechanics` (213/213 files, 3428 tests +
> build, up from pass 8's 3422 via the keywords pass-8 tick's own 3 new
> `mechanic-text-coverage` guard tests plus unrelated growth, not a card
> signal), `npm run verify --workspace axiomancer-mobile` (lint 0 errors,
> typecheck clean, jest green, `assets:check` clean, `art:test` 24/24 — the
> full chained script ran to its final leg clean), `npm run type-check
> --workspace axiomancer-card-editor` (clean, exit 0). `npm run deploy:check`
> will be re-confirmed after this ledger commit lands. No
> `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed this pass —
> nothing actionable surfaced outside the standing, already-filed backlog
> items re-cited above.
```

```
> **[adjust-npcs pass 8, 2026-09-13, commit abb3da01]** One UPDATE (shipped a
> standing `plan/PHASE_CANDIDATES.md` retheme candidate that seven prior
> passes had correctly re-cited but never actioned), zero-CREATE,
> zero-REMOVE pass — dispatched autonomously by `/march`'s content-lifecycle
> gate (`npcs`' pass-7 commit `99cac84e` was the stalest qualifying category
> this tick: 81 commits since, past the 15-commit/36h threshold, and the
> oldest of the four qualifying categories' own last-pass timestamps —
> cards `be34ca43`/equipment `030e26ae` both landed 2026-09-12 later in the
> day than npcs' own pass 7, enemies `832e3e5e` and keywords `37dacef1` both
> landed earlier today but under their own 15-commit/36h threshold). Ran
> this tick as `content-curator` directly (the skill's own Step 2 routing —
> "narrative authoring is content-curator's job" — needs no further
> sub-agent spawn when the dispatched agent already is one). `git log
> 99cac84e..HEAD -- axiomancer-mechanics/src/NPCs axiomancer-mechanics/src/World
> axiomancer-mechanics/specs/story axiomancer-mechanics/specs/characters`
> returns exactly one commit, `df6e98ff` (the FE-006 speech-mark fix — ASCII
> `"` to typographic curly quotes across four World/NPC content files,
> text-only, no rule/id/effect touched — read its full diff directly to
> confirm). Re-derived every Step-1 signal fresh anyway: (1) **unstaged NPC
> sweep** — 21 authored `NPC` consts across the 4 files
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7), unchanged
> from pass 7. The standing 4-NPC `unstagedNpcs` backlog
> (`Coastal-Village/maps.ts`: Tide-Shopkeeper, Village Healer, Dockworker's
> Union Leader, Merchant's Widow) re-verified with each precondition
> re-checked against current source, not just re-cited: `NPC.isShopkeeper`
> still has zero mobile consumers (`grep -rn isShopkeeper
> axiomancer-mobile` returns nothing — the flag exists only in mechanics
> types/content and a `spec08.engine.test.ts` assertion; the shop UI the
> Tide-Shopkeeper needs genuinely still doesn't exist, distinct from the
> unrelated MapEvent-merchant shop path that seven `isShopkeeper: true`
> interaction merchants already use across `MapEvents/content.ts`); the
> rest rebuild (phases 52c/52d/59) has had no NPC-hosting capability added
> since — `git log 99cac84e..HEAD -- axiomancer-mechanics/src/World/RestChoice`
> returns two commits (`856ffaa7` FE-024, `1b23d5df` FE-026), both read in
> full: pure copy/warning-order fixes to the existing rest screen, no NPC
> field added — so Village Healer's stated precondition stays unmet; the
> Union Leader/Merchant's Widow "real settlement screen" precondition was
> re-examined against `/village`'s actual history (phase 5, well before
> this backlog was filed) and confirmed the reason is about THEIR OWN map
> context, not the screen's existence — unchanged. (2) **<2-staged-NPC
> sweep** — all 7 maps' `npcs:` array lengths recomputed fresh: fishing-village
> 8, northern-forest 6, caverns 1, northern-city 2, connecting-river 1,
> town-across-river 1, the-capital 2 — identical to pass 7; the standing
> `plan/AUDIT.md` `[needs-user-call]` row (caverns/connecting-river/
> town-across-river) re-read at current text, still correctly un-actioned
> per hard rule 3 (filling it means inventing 1-3 named characters'
> personhood, `character-spec`/`story-spec` territory). (3) **dead-end/
> stale-reference sweep** — ran the full live audit suite directly:
> `narrative-reachability.test.ts` (5/5), `World/e2e/
> narrative-reachability.engine.test.ts` (26/26), `MapEvents/e2e/
> nf-21-nf-14-npc-staging.engine.test.ts` (4/4), `NPCs/e2e/
> dialogue.engine.test.ts` (18/18), `NPCs/e2e/story-npcs.engine.test.ts`
> (36/36 after this pass's edits), and `World/Continents/e2e/
> continents.engine.test.ts` (28/28 after this pass's edits) — no orphaned
> tree, unresolved interaction ref, or scenery-as-people. `teachCard` still
> has zero live call sites (`NPCs/types.ts` field declaration only); all 10
> distinct `startQuest` targets (unchanged from pass 7) resolve type-check
> clean against `QuestName`. (4) **legacy flat `DialogueMap` sweep** — zero
> live usage outside the type declaration and its re-exports, unchanged.
> (5) **spec-to-NPC gap** — `git log 99cac84e..HEAD -- axiomancer-mechanics/
> specs/` is empty; re-checked the one existing character spec
> (`specs/characters/C-01-the-sophist.md`) against implementation from
> scratch rather than assuming pass 7's silence meant "checked and clean" —
> confirmed FULLY implemented across `src/World/Labyrinth/` (his voice is
> every room's `scene`/`narration`/gate `refusalLines` in `act1-3.content.ts`,
> his true name and the naming rite live in `labyrinth.engine.ts`
> (`isSophistTrueName`, `TRUE_NAME = 'PROTAS'`), his finale enemy
> `enemy-the-sophist` is registered and wired as act3's `bossSlug`) — not a
> spec-without-implementation gap; he isn't a `src/NPCs/**` `NPC` entity
> because his role (accordion narration + hint economy across an entire
> continent) doesn't fit that shape, which is the correct call, not a
> staging miss. **One UPDATE shipped** — the standing `plan/
> PHASE_CANDIDATES.md` "[score 5.0] Retheme the six Northern-Forest
> dialogue trees to the ratified register" candidate (filed pass 1,
> 2026-09-05; re-cited-not-actioned by passes 2-7 as "sized like Phase 44g,
> not this skill's job to rush") was actually shipped this pass rather than
> re-cited an eighth time: rewrote all six trees (Shrine Keeper, the
> Chronicler, the Wandering Philosopher, Forest Ranger, Hermit Sage, Lost
> Trader) in `Northern-Forest/npcs.ts` into the house register per
> `docs/narrative/STYLE_CONSTITUTION.md`/`VOICE_REGISTERS.md`/`LEXICON.md` —
> same node ids, same `choices`/`requires`/`effect` objects byte-for-byte
> (zero mechanical/schema change, confirmed by re-running the full dialogue
> test suite unmodified in behavior), only `text`/`description` strings
> rewritten: short clauses (no sentence over 20 words, `check-prose.mjs`'s
> MB-1 ceiling), a concrete object and a distinct voice card per speaker
> (Shrine Keeper/exacting stone-tender, Chronicler/accumulating
> record-keeper, Wandering Philosopher/corrective-Socratic traveler, Forest
> Ranger/clipped-practical patroller, Hermit Sage/spare recluse, Lost
> Trader/transactional survivor) so each reads apart with names removed
> (`EVALUATION.md`'s voice-blind gate), and cut the cited "wordier
> interiority" filler verbatim (Hermit Sage's "touches my heart deeply",
> the Shrine Keeper's "otherworldly perception", generic "ancient/
> transcendent" adjectives throughout). KB research gate (skill §3 Step 2)
> run before writing: `kb_search` for "dialogue voice distinct NPC",
> "flavor text restraint concrete object", "narrative dialogue character
> voice", and an NPC/character-writing reception regex, scopes
> boardgames/all — zero matches (the corpus's 46 board games + 2 card
> corpora are mechanics-centric; none of the campaign-narrative titles
> present carry dialogue-craft or NPC-voice-reception docs). Filed
> `no-trbl-2-u/game-knowledge-base#80` and proceeded UNGROUNDED per the
> skill's own anticipated-miss clause. Updated the two engine tests that
> asserted the OLD prose verbatim — `World/Continents/e2e/
> continents.engine.test.ts` (2 assertions: the Shrine Keeper greet's
> 'patterns speak'/'veil grows thin' pair, replaced with 'keeps its own
> count'; the Chronicler's lowercase 'pre-coastal civilizations' capitalized
> to match the new sentence-initial phrasing; retitled the now-inaccurate
> "transcendent wisdom themes with mystical elements" `it()` title) and
> `NPCs/e2e/story-npcs.engine.test.ts` (4 assertions in the Shrine Keeper
> block, same pattern, plus the describe-block title) — every OTHER
> test-anchored substring across both files (`'logging operation'`,
> `'heartwood of the eldest trees'`, `'sustainable forest trades'`, `'wisdom
> earned in isolation'`, `'enlightenment selfish'`, `'share your wisdom
> while preserving'`, `'Bandits took everything'`, `'should I trust you'`,
> `'desperate man'`, `'Providence'`, `'honest action'`, `'Fate guides us'`,
> the three verbatim `seeking_place` choice labels, `'*Talk'`, and every
> `setFlag`/`nextNodeId`/`requires` structural check) was deliberately
> preserved character-for-character in the new prose so no further test
> edit was forced — a deliberate low-risk-first drafting choice, not an
> oversight. `node scripts/check-prose.mjs` and `check-lexicon.mjs` clean
> both before and after (the file was already lint-clean; this pass fixes
> register/craft, which the mechanical lint cannot check — that gap is
> exactly why this was a `content-curator` judgment call, not a lint-driven
> one). Verify: `npm run verify --workspace axiomancer-mechanics` (213/213
> files, 3425 tests + build, matching pass 7's count exactly — zero new
> tests, only existing assertions edited), `npm run verify --workspace
> axiomancer-mobile` (297/297 suites, 2844 tests, lint 0 errors/15
> pre-existing warnings, typecheck clean, assets:check clean, art:test
> 24/24 — required because this diff touches `src/World/**`/`src/NPCs/**`
> per the AGENTS.md cross-package checklist). `npm run deploy:check`
> confirmed green pre-tick (HEAD `39193fce`, docs/plan-only tip commit, no
> gated workflow triggered) and will be re-confirmed after this commit
> lands. Residue: `plan/PHASE_CANDIDATES.md`'s retheme candidate struck as
> SHIPPED (full closing note there); the two standing `plan/AUDIT.md`
> `[needs-user-call]` rows (Northern-Continent single-NPC maps;
> `unstagedNpcs` backlog is tracked in-file, not AUDIT.md) re-confirmed
> open and correctly un-actioned, not re-filed.
```

```
> **[adjust-keywords pass 8, 2026-09-13, commit 37dacef1]** One UPDATE (a
> wiring-honesty bug fix), zero-CREATE, zero-REMOVE pass — dispatched
> autonomously by `/march`'s content-lifecycle gate (`keywords` was the
> stalest qualifying category this tick: 81 commits since pass 7's commit
> `3c39acb9`, past the 15-commit/36-hour threshold and the oldest of the
> five categories' own last-pass timestamps — enemies `832e3e5e` landed
> earlier today, cards `be34ca43`/equipment `030e26ae`/npcs `99cac84e` all
> more recently audited). `git log 3c39acb9..HEAD -- axiomancer-mechanics/
> src/Cards axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly one commit,
> `5282cc0a` (a `ui-fresh-eyes` shard renaming the threat-preview's PLEA-shed
> clause from "steadies N resolve" to "shakes off N PLEA" in
> `combat.threat.ts` — a display-string consistency fix to an ALREADY-correct
> atlas row (PLEA's own reminder text never said "resolve"), not a
> keyword-registry change; read its full diff directly, confirmed no atlas /
> mobile-gloss / card-editor surface touched). Re-derived every Step-1 signal
> fresh anyway rather than trusting the near-empty path-scoped log alone: (1)
> **carrier-count sweep** — a fresh `kind: '...'` grep across all 9
> `src/Cards/library/*.cards.ts` modules (128 cards, unchanged from pass 7)
> reproduces pass 7's own floor-count reading and extends it: CHAIN, ECHO,
> EXECUTE, OMEN, opening (AMBUSH), FINALE, RUPTURE, TURNABOUT, extend_dots,
> lock_stance — pass 7's own named list — plus `peroration` (SENTENCE),
> `reap_all`, and `replay_last`, which were also already sitting at exactly
> 2 carriers but weren't individually cited — all still at the atlas's own
> "≥2 cards or ≥2 enemies" floor, no regression, no REMOVE candidate. The
> zero- and single-carrier die-gear/card-local kinds (`strip_random_buff`,
> `befriend_attempt`, `refresh_die`, `convert_die_color`, `overheat`,
> `forge_floating_die`, `float_x_die`, `spend_all_pips`, `echo_next_spell` at
> zero; `bank_spent_die`, `conjure_card`, `consume_affliction`,
> `convert_dots`, `grant_pip`, `purge_self`, `reap`, `recoil_x`,
> `reroll_spent`, `spend_premises` at one) all cross-checked directly against
> mobile's own `KINDS_WITHOUT_MECHANIC_KEYWORD` exemption list and
> `MECHANIC_KEYWORD` badge-reuse map (`state/combat/keywords.ts`) — every one
> is either explicitly exempted (card-local one-off, or a die-gear verb whose
> face prints FORGE/KINDLE/PIP directly, e.g. `forge_floating_die`/
> `float_x_die` are FORGE's own carrier and are correctly carried by die gear
> per the atlas's own "carried by: die gear (spec 33 §6)" note, not a card
> literal) or already reuses an existing badge (`consume_affliction`→Rupture,
> `purge_self`→Purge, `spend_premises`→Charge, `recoil_x`→Recoil), matching
> pass 7's own reading exactly — no REMOVE candidate. (2) **enemy-keyword
> carrier sweep** — a fresh `enemy.library.ts` `{ kind: '...' }` extraction
> (scoped to both the base `keywords:` array and boss `gain:` stage arrays,
> after stripping `//` comments) gives hide 21, wounding 13, venom 9, regrow
> 5, swift 19, brutal 21, unshaken 12, elusive 3, ravenous 3 — byte-identical
> to pass 7, all 9 atlas-listed enemy keywords carry ≥2. (3)
> **`CardSpecialMechanic`/`CardRider` kind ↔ atlas/display-generator parity**
> — cross-checked all 57 `kind: '...'` members declared in `src/Cards/
> types.ts` (50 `CardSpecialMechanic` + 7 `SynergyStatePredicate`) against
> `combat.cards.ts`'s two display switches (`mechanicText`/
> `statePredicateText`): 56 of 57 resolve to a live `case`; one genuine gap,
> fixed (below). (4) **registry parity** — `axio_overview` reconfirms 68
> keyword rows and 128 cards, unchanged from pass 7. (5) **Known-drift
> section accuracy** — re-read `debuffs.library.json` and `src/Combat/
> effects.ts` directly: POISON/BLEED/DOOM `damagePerRound` still 2/3/1 and
> `CAPITULATE_MIN`/`CAPITULATE_RESOLVE_FRACTION` still 10/0.35 (both files
> last touched `636f3040`, 2026-09-04, well before pass 7) — the atlas's
> "Known drift" note stays accurate, re-cited not re-filed. (6) **mobile
> KW-1/KW-3 jest suite** — ran `state/combat/__tests__/keywords.test.ts`
> directly (13/13 green, both before and after the fix below, since CONJURE
> was never mapped to a badge and the fix touches no mobile file). **One
> genuine finding, fixed** — `mechanicText`'s `switch (m.kind)`
> (`combat.cards.ts`) carried NO case at all for `conjure_card` (the kind
> grave-goods uses to hand a one-use Cinder haunt into hand): it fell to the
> generic `default: return null`, so the clause silently disappears from any
> auto-generated PAID line. grave-goods itself is unaffected on the live
> card face — it carries an authored `paidSummary` that overrides the
> generator entirely (`combat.cards.ts`, `const paid = authored ??
> paidText(...)`) — but two other surfaces were NOT masked: (a) any future
> `conjure_card` carrier authored without its own `paidSummary` would
> silently print a PAID line missing the conjure clause, and (b)
> `scripts/export-catalog.ts`'s `specialMechanicLabel` (no `paidSummary`
> fallback there; feeds `npm run catalog`, the atlas's own cited source for
> its carrier column) was ALREADY leaking the raw internal id `conjure_card`
> into the built catalog, confirmed by reading its fallback chain
> (`mechanicText(sm) ?? (amt != null ? ... : String(sm.kind))`) directly.
> This is exactly the "silent `default:` arm" class of bug this skill's §1
> calls out to ship regardless of priority — not a new keyword (CONJURE
> stays retired/un-badged, per mobile's own `KINDS_WITHOUT_MECHANIC_KEYWORD`
> entry; this only completes the generator's plain-text coverage the same
> way `replay_last`/`convert_dots`/`befriend_attempt` already have it), so no
> KB research gate applies (skill §3 Step 2 gates CREATE/UPDATE to keyword
> SEMANTICS; this is a wiring-completeness fix to an already-shipped,
> already-retired-as-a-badge mechanic — the same exemption pass 7 applied to
> its own stale-test-title fix). Fixed: `axiomancer-mechanics/src/Combat/
> combat.cards.ts` — added `case 'conjure_card': return \`conjure
> ${getCardById(m.cardId)?.name ?? 'a card'} into your hand\`;` (reuses the
> file's own already-imported `getCardById`, which explicitly resolves
> Haunt-registry ids per its own doc comment — "CONJURE targets — real
> cards, deliberately outside the pinned library"). Added a new hermetic
> guard, `axiomancer-mechanics/src/Combat/e2e/
> mechanic-text-coverage.engine.test.ts` (3 tests): every `specialMechanics`
> entry any live card carries renders non-null `mechanicText` (the general
> regression guard — catches the NEXT kind that skips its display case), the
> guard has teeth (the roster carries ≥1 entry), and `conjure_card`
> specifically now renders the conjured card's real name ("Cinder"), not its
> raw kind string. KB research (skill §3 Step 2): not run — bug-fix
> exemption per above, same class as pass 7's own stale-test-title fix.
> Verify: ran all four gates in full — `npm run verify --workspace
> axiomancer-mechanics` (213/213 files, 3425 tests — pass 7's 3422 + the 3
> new guard tests — plus build, all green), `npm run verify --workspace
> axiomancer-mobile` (297/297 suites, 2844 tests, lint 0 errors/15
> pre-existing warnings, typecheck clean, assets:check 7/7, art:test 24/24 —
> unchanged from the standing count, confirming the fix touched no mobile
> surface), `npm run type-check --workspace axiomancer-card-editor` (clean,
> exit 0), root `npm test` 123/123 (incl. `content-drift.test.mjs`,
> unaffected — the atlas / mobile-gloss / card-editor tables that guard
> compares were not touched, only the mechanics-internal display generator).
> `npm run deploy:check` confirmed green pre-tick (HEAD `27f969e0`, both
> verify-mobile and verify-mechanics workflows success, per the dispatch
> note) and will be re-confirmed after the ledger commit lands. No
> `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed this pass —
> the fix above is the full extent of this tick's finding.
```

```
> **[adjust-enemies pass 8, 2026-09-13, commit 832e3e5e]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`enemies` was the stalest qualifying category
> this tick: 83 commits since pass 7's commit `0a95396b`, the oldest of
> the five categories' own last-pass timestamps — equipment `030e26ae` 34
> commits, cards `be34ca43` 71, npcs `99cac84e` 76, keywords `3c39acb9` 78,
> all more recently audited). `git log 0a95396b..HEAD -- axiomancer-
> mechanics/src/Enemy axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts axiomancer-mobile/
> assets/images/enemies axiomancer-mechanics/src/World` returns exactly one
> commit (`df6e98ff`, the FE-006 speech-mark fix — ASCII `"` to typographic
> curly quotes across four World/NPC dialogue files, text-only, no rule or
> id touched) — none of the 83 intervening commits touched the roster
> surface. Re-derived every Step-1 signal fresh anyway with new throwaway
> extraction scripts (independent of pass 7's own tooling, CRLF-normalizing
> `enemy.library.ts` before parsing — it is still CRLF-terminated and a
> naive regex still silently drops the unquoted `sandbag:` key and
> comment-embedded commas, the same trap pass 7 flagged; stripping `//...`
> line comments before any comma-split fixed both) run directly against
> the live tree, not copied from pass 7's numbers: (1) **orphan sweep** —
> 79 `createEnemy` consts, all 79 resolve into `ENEMY_REGISTRY` (0
> missing), 77/79 resolve into some `EnemiesByMap` pool, same 2 deliberate
> exclusions as every prior pass (`Sandbag_01` test fixture, `TheIncompleteness`
> the impossible-ceiling boss) — no new orphan. (2) **roster-size floor /
> sibling-overlap sweep** — all 10 pools recomputed fresh: fishing-village
> 13, northern-forest 39, caverns 16, northern-city 8, connecting-river 5,
> town-across-river 4, the-capital 8, aporia-colonnade 8, aporia-archive 8,
> aporia-proof 11 — identical to pass 7. Full pairwise overlap re-run (all
> 45 pairs): the same 4 pairs exceed 70% of the smaller pool —
> northern-forest/aporia-colonnade (87.5%), northern-forest/aporia-archive
> (87.5%), northern-forest/aporia-proof (90.9%), caverns/aporia-archive
> (75.0%) — all the documented labyrinth deliberate-reuse design (wandering
> foes scaling to the player via the adaptive level bands), unchanged since
> pass 1. connecting-river (5) and town-across-river (4) remain the
> smallest raw pools but no `World`/map-content file changed since pass 6
> to disturb pass 3's density-normalized reading. (3) **deck sweep** — 92
> raw `ENEMY_DECKS` key declarations, 78 unique after dedup, all 78 resolve
> against the 79 `ENEMY_REGISTRY` slugs via the `enemy-<slug>` convention;
> 157 distinct card-id tokens referenced across every `tier1`/`tier2`/
> `tier3` array resolve 1:1 against `ENEMY_CARD_LIBRARY`'s 157 keys — 0
> unresolved, 0 unused (full bijection, unchanged from pass 7). (4)
> **portrait sweep** — 77 `portraitAsset` values, 0 duplicates, all 77
> resolve 1:1 into `axiomancer-mobile/assets/images/enemies/index.ts`'s
> registry. (5) **VITAE-band sweep** — 21 explicit `vitae:` overrides,
> same count as pass 7; `enemy.library.ts` last-touched `e57f9f63`
> (pass 6, 2026-09-11) and the VITAE-formula constants (`src/Enemy/index.ts`)
> last-touched `e9201415` (2026-09-02) — neither has moved since pass 7
> re-confirmed the standing worst-deviation figure (ElderFireGiant +25.7%,
> inside the ~±26% tolerance band), so that reading stands unchallenged.
> (6) **aftermath-prose/voice sweep** — 0 `thee`/`thou`/`thy`/`thine`/`ye`
> matches in `enemy.library.ts`; 47/79 enemies carry `finalBlowLines`,
> same as pass 7 — the standing 32-enemy backlog (filed pass 1,
> `plan/AUDIT.md` `[content]`, scoped to `content-curator` not this skill)
> is unworsened, re-cited not re-filed. (7) **loot-table sweep** — 22
> distinct `drop()` ids, all 22 resolve 1:1 against
> `Items/consumable.library.ts`'s 22 ids. Also confirmed every dependency
> surface a deck/loot/portrait sweep would need is unchanged since pass 7:
> `combat.enemy-cards.ts` and `enemy-keywords.ts`/`types.ts` last-touched
> 2026-09-02 (pre-dates pass 5), `consumable.library.ts` 2026-09-04,
> `cards.library.ts` 2026-09-08, `buffs.library.json`/`debuffs.library.json`
> 2026-08-09 — every cross-reference above is provably re-testing the same
> graph pass 7 tested, not assumed stale-clean. KB research (kb-query gate,
> skill §3 Step 2): not run — zero CREATE/UPDATE this pass, exempt under
> the REMOVE/no-op carve-out the sibling categories' own zero-diff passes
> have used identically. Verify: ran both gates in full (not skipped,
> despite zero source diff) — `npm run verify --workspace
> axiomancer-mechanics` (212/212 files, 3422 tests, build green — matching
> pass 7's count exactly), `npm run verify --workspace axiomancer-mobile`
> (297/297 suites, 2844 tests — grown from pass 7's 261/2657 via the 83
> intervening commits' unrelated mobile work, not a roster signal — lint 0
> errors/15 pre-existing warnings, typecheck clean, assets:check clean,
> art:test clean). No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md`
> residue filed this pass — nothing actionable surfaced outside the
> standing, already-filed 32-enemy `finalBlowLines` backlog re-cited above.
```

```
> **[adjust-equipment pass 8, 2026-09-12, commit 030e26ae]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`equipment` was the stalest qualifying category
> this tick: 50 commits since pass 7's commit `faba6c82`, the oldest of the
> five categories' own last-pass timestamps — cards `be34ca43` 36 commits,
> npcs `99cac84e` 41, keywords `3c39acb9` 43, enemies `0a95396b` 48, all
> more recently audited). `git log faba6c82..HEAD -- axiomancer-mechanics/
> src/Items axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` is empty — the 50 intervening commits
> were the sibling categories' own pass-7/8 ticks, a ui-fresh-eyes sweep
> (FE-001 through FE-028), a critique pass (36, no findings), and assorted
> plan-doc/ledger bumps — nothing touched the item/shop/signature surface.
> Re-derived every Step-1 signal fresh anyway rather than trusting the empty
> path-scoped log alone, same discipline as the sibling categories' own
> zero-diff re-audits: (1) **dominated relics** — re-read all 8 off
> `relic.library.ts` (byte-identical since pass 7): 2 weapons tie at
> body+2, 2 armor tie at maxHp+5, 4 accessories split
> mind+2/mind+2/heart+2/heart+2 — every same-slot pair still differs only
> by `grantsSignature` (re-confirmed non-`undefined` and distinct on all
> 8), no strictly-dominated pair. (2) **shop/reward-pool coverage** — a
> fresh grep of all 7 `shop.wares` blocks in `World/MapEvents/content.ts`
> reconfirms the same 12 distinct shop-stocked consumable ids (unchanged,
> no 8th village), and the other 10 remain reachable via `rollCacheReward`'s
> uniform draw over the full unfiltered 22-entry `consumableLibrary`
> (`cache-reward.ts` byte-identical since pass 1) — no orphaned item. (3)
> **`grantsSignature` drift** — all 8 relic values re-checked against the
> live 8-member `SignatureSkillId` union in `combat.encounter.types.ts`:
> identical (`sig-overwhelming-argument`, `sig-rallying-blow`,
> `sig-read-opponent`, `sig-second-wind`, `sig-conviction-strike`,
> `sig-clever-gambit`, `sig-disarming-plea`, `sig-press-the-point`), no
> rename/removal. (4) **dead consumable `effectId`s** — re-extracted the 11
> non-heal-only ids from `consumable.library.ts` (unchanged, still 22
> entries) and confirmed each resolves by id against
> `buffs.library.json`/`debuffs.library.json` via a fresh grep, all 11
> found, 0 dead references. (5) **`AccessoryKind` gap** — head/hands/feet
> remain at zero live relics, same standing `[loop-call]`
> (`plan/AUDIT.md`, 2026-09-04, answers the open `[HIGH]` in
> `plan/CRITIQUE.md`) re-read at its current text: still open, still
> accurate, no new evidence this pass to decide it solo between (a)
> designing a 9th+ signature skill first or (b) breaking the relic's 1:1
> identity rule for stat-only accessories — left filed, not re-litigated.
> KB research (kb-query gate, skill §3 Step 2): not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per skill §3 Step 2 (REMOVE/no-op carve-out).
> Verify: ran both gates in full this pass (not skipped, despite zero
> source diff) — `npm run verify --workspace axiomancer-mechanics`
> (212/212 files, 3422 tests + build) and `npm run verify --workspace
> axiomancer-mobile` (mobile jest/lint/typecheck/assets:check/art:test all
> green, art:test 24/24). `npm run deploy:check` confirmed green pre-tick
> (HEAD `3e248698`, both verify workflows success) and will be
> re-confirmed after the ledger commit lands. No `plan/PHASE_CANDIDATES.md`
> or new `plan/AUDIT.md` residue filed this pass — nothing actionable
> surfaced outside the standing, already-filed AccessoryKind loop-call
> re-cited above.
```

```
> **[adjust-cards pass 8, 2026-09-12, commit be34ca43]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (`cards` was the only stale-qualifying category
> this tick: 15 commits since pass 7's commit `e2b08057`, at the 15-commit
> threshold; equipment/enemies/keywords/npcs all sat under their own
> thresholds) — a genuine fresh re-audit against current source, not a
> rubber stamp of pass 7's "nothing found." `git log e2b08057..HEAD --
> axiomancer-mechanics/src/Cards axiomancer-mechanics/src/Effects
> axiomancer-mechanics/src/Combat` is empty, and a full `git diff
> e2b08057..HEAD --stat` over those same three directories (not just the
> path-scoped log) confirms byte-identical (0 lines changed) — the 15
> intervening commits were entirely the npcs/keywords/enemies/equipment
> pass-7 ticks (each with its own ledger-bump commit), a `critique` pass
> (36, no findings), an `/audit`-fix (`894cad12`, finding [2.0]), a mobile
> refactor (`2dc459b4`, removes an `as any` cast in `migrateV1ToV2` state
> bridge — `axiomancer-mobile/state` only, not `src/Cards`), an `/iterate`
> audit no-op, and a plan-doc addition — nothing touched the card/effect/
> combat surface. Also confirmed the cross-referenced surfaces a card audit
> depends on are equally unchanged since pass 7: `axiomancer-mechanics/src/
> Enemy`, `docs/keyword-atlas.md`, `docs/retheme-map.json`,
> `axiomancer-mobile/state/combat/keywords.ts`,
> `axiomancer-card-editor/src/data/mechanics.ts`,
> `combat.starter-deck-presets.ts`, and `combat.deck-draft.ts` all show an
> empty path-scoped `git log e2b08057..HEAD`. Re-derived every Step-1
> signal fresh anyway rather than trusting the empty diff alone, same
> discipline as every prior pass's own re-audit: (1) **reachability** — ran
> `combat-playtest.card-coverage.sim.test.ts` directly: 123/123 playable
> cards still fire in at least one fallback seed, matching pass 7 exactly.
> (2) **near-duplicates** — wrote a fresh same-`(theme,rank,
> philosophicalAspect)` collision scan restricted to kind-sets of size ≥2
> (pass 6/7's own refined methodology, excluding single-verb noise) against
> the live `cardLibrary` via a throwaway `tsx` script: reproduces exactly
> pass 4-7's two documented hits, `thin-hymn`/`alms-of-breath`
> (`rider,sway`) and `the-last-assize`/`the-vein-called-in`
> (`deal,overkill,recoil,wrath`), no new collision. A first pass of the
> script (before restricting to kind-sets ≥2) surfaced a third apparent hit
> — `mouthful-of-brine`/`gnaw-marks`/`the-wound` (all `curse`, rank 1, body
> aspect, `purge_self`) — traced this to the shared `curse()` factory in
> `starters.cards.ts` (all 5 curses carry exactly one mechanic kind,
> `purge_self`, by design: the module's own header comment describes a
> curse as "a tax on your draws," and each curse's differentiation lives entirely
> in its FREE-line cost, not its mechanic kind) — the same single-verb-noise
> false-positive class pass 6's methodology already exists to exclude, not
> a new duplication finding; confirmed the restricted scan correctly drops
> it. (3) **pricing sanity + honesty** — `pricing.engine.test.ts` (251),
> `curated-library.engine.test.ts` (14, the FREE-line law),
> `preview-truth.engine.test.ts` (10), `paid-summary-honesty.engine.test.ts`
> (4), and `deck-presets.engine.test.ts` (9, the pinned 5/5/5
> preset-aspect-thirds law) all re-run directly and green, matching pass
> 7's counts exactly. (4) **scale-ladder drift** — a fresh `axio_cards`
> spot-check at Saint rank against the CLAUDE.md §5 ladder (single-hit
> 45-70/multi 12×6) reproduces pass 7's own reading: `All Objections
> Sustained` (Deal 45, in-band), `Every Coin in the Poorbox` (REAP-per-Soul
> payoff, uncapped, not base-Deal-governed), `Every Ladder Broken` (Deal
> 8×5=40, a stance-switch combo/RIPOSTE-70 payoff card where Deal is a
> rider, not its axis) — same "competing verbs, no governing shape" reading
> pass 4-7 applied to combo/payoff cards, not a quietly-small bug; no new
> drift surfaced since the underlying data is unchanged. (5) **aspect
> thirds** — `axio_overview`'s programmatic per-theme totals (debt 19,
> trial 24, rot 19, choir 21, vigil 20, curse 5, grave 20) match pass 7's
> own corrected methodology exactly (byte-identical source); the governing
> `deck-presets.engine.test.ts` 5/5/5 law is green (see (3)), no starvation
> case. (6) **FREE-line coverage** — `curated-library.engine.test.ts`'s
> 14/14 green re-confirms every theme still has a FREE-line-viable card, no
> gap. Standing `plan/AUDIT.md` `[loop-call]`s re-checked against current
> source, not re-litigated: the 19 orphaned `zoneHas(state,
> '<card-id>')` hooks in `combat.engine.ts` (filed pass 1, 2026-09-04) —
> re-verified fresh that all 19 named ids (`forge-masters-stamp` through
> `resonant-chamber`) still resolve nowhere in `cardLibrary`/Haunts/Allies
> via a direct per-id grep, still orphaned, still mechanics-expert cleanup
> territory, not a card-content fix; and `the-sextons-count`'s missing TWIN
> trigger (same filing) — re-read the card's current `grave.cards.ts`
> entry and the two live `zoneHas(state, 'the-sextons-count')` sites in
> `combat.engine.ts` (RECALL/REPLAY, already wired per the filed note),
> TWIN itself still unwired for the stated variable-scope reason, still
> open, still engine-constant/mechanics-expert territory. KB research
> (kb-query gate, skill §3 Step 2): not run — every consideration this pass
> was audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per
> skill §3 Step 2 (REMOVE/no-op carve-out). Verify: ran all three gates in
> full this pass (not skipped, despite zero source diff) — `npm run verify
> --workspace axiomancer-mechanics` (212/212 files, 3422 tests + build,
> matching pass 7's count exactly), `npm run verify --workspace
> axiomancer-mobile` (261/261 suites, 2657 tests, lint 0 errors/15
> pre-existing warnings, typecheck clean, assets:check 7/7, art:test
> 24/24 — all matching pass 7 exactly), `npm run type-check --workspace
> axiomancer-card-editor` (clean, exit 0). `npm run deploy:check` confirmed
> green pre-tick (HEAD `588d0807`, no gated workflow triggered for the
> docs/plan-only tip commit) and will be re-confirmed after the ledger
> commit lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md`
> residue filed this pass — nothing actionable surfaced outside the
> standing, already-filed backlog items re-cited above.
```

```
> **[adjust-npcs pass 7, 2026-09-12, commit 99cac84e]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (npcs' pass-6 commit `c4f97f69` was the only
> stale-qualifying category at dispatch time, 16 commits since, past the
> 15-commit threshold; cards/equipment/enemies/keywords all passed within
> the last day). `git log c4f97f69..HEAD -- axiomancer-mechanics/src/NPCs
> axiomancer-mechanics/src/World axiomancer-mechanics/specs/story
> axiomancer-mechanics/specs/characters` is empty — the 16 intervening
> commits were the cards/equipment/enemies pass-7 ticks, the keywords
> pass-7 tick, a digest, two `/audit`-fix ticks (mobile a11y + village-stall
> pricing), and an `/expand` no-op — nothing touched the NPC/dialogue
> surface. Re-derived every Step-1 signal fresh anyway rather than trusting
> the empty path-scoped log alone, same discipline as the sibling
> categories' own pass-7 re-audits: (1) **orphaned/unstaged NPC sweep** — a
> fresh extraction of all `NPC` consts across the 4 authoring files
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7 — unchanged
> from pass 6, 21 total) reconfirms all 21 resolve into some map's `npcs:`
> roster by direct cross-check, no new orphan. The standing `unstagedNpcs`
> backlog (`Coastal-Village/maps.ts`) is still exactly the same 4
> (Tide-Shopkeeper, Village Healer, Dockworker's Union Leader, Merchant's
> Widow) with the same per-NPC reasons, byte-identical block since pass 3;
> confirmed fresh (not assumed) that none of the four has a
> `MapEvents/content.ts` interaction payload naming them (a direct grep for
> all four display-name strings against that module returns zero hits) and
> that Village Healer's stated precondition ("place her once the rest
> rebuild has fully settled") is re-confirmed still unmet — `git log
> c4f97f69..HEAD -- axiomancer-mechanics/src/World/RestChoice
> axiomancer-mobile/app/rest axiomancer-mobile/state/presenters/rest.copy.ts`
> is empty, no commit since pass 6 touched any of those paths. (2) **map
> with <2 staged NPCs signal** — recomputed all 7 maps' `npcs:` array
> lengths fresh (fishing-village 8, northern-forest 6, caverns 1,
> northern-city 2, connecting-river 1, town-across-river 1, the-capital 2 —
> unchanged from pass 6, no new map landed since); the standing
> `plan/AUDIT.md` `[needs-user-call]` row (filed pass 1, 2026-09-05) on
> caverns/connecting-river/town-across-river's single-NPC maps re-read
> directly at its current text: still un-`[x]`-marked, still describes each
> singleton as the deliberate "guaranteed quest-giver" pattern, not
> re-litigated. (3) **dead-end / stale-reference sweep** — ran the live
> audits directly rather than eyeballing the union walk by hand:
> `narrative-reachability.test.ts` (5/5), `World/e2e/
> narrative-reachability.engine.test.ts` (26/26), `MapEvents/e2e/
> nf-21-nf-14-npc-staging.engine.test.ts` (4/4), `NPCs/e2e/
> dialogue.engine.test.ts` (18/18), and `NPCs/e2e/story-npcs.engine.test.ts`
> (36/36) — all green, no orphaned tree, unresolved interaction ref, or
> scenery-as-people flagged. A fresh grep confirms `teachCard` has zero live
> call sites (only the `NPCs/types.ts` field declaration) and all 10
> distinct `startQuest` targets (unchanged from pass 6, including
> `get-to-the-capital`) still resolve type-check-clean against the live
> `QuestName` union. (4) **legacy flat `DialogueMap` sweep** — zero live
> usage confirmed again (`grep -rln DialogueMap src/` outside `e2e/` returns
> only the type declaration in `NPCs/types.ts` and its re-exports in
> `NPCs/index.ts`/`src/index.ts`). (5) **spec-to-NPC gap** — `git log
> c4f97f69..HEAD -- axiomancer-mechanics/specs/` is empty, no
> `specs/characters/` or `specs/story/` file changed since pass 6; no new
> spec-implies-NPC gap. Also re-checked `plan/PHASE_CANDIDATES.md`'s
> standing "retheme the six Northern-Forest dialogue trees" candidate
> (filed pass 1, score 5.0) — still open, still correctly sized as its own
> phase rather than a routine structural finding, not actioned this pass.
> KB research (kb-query): not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per skill
> §3 Step 2 (REMOVE/no-op carve-out). Verify: ran both gates in full this
> pass (not skipped, despite zero source diff) — `npm run verify
> --workspace axiomancer-mechanics` (212/212 files, 3422 tests + build,
> matching pass 6 exactly) and `npm run verify --workspace
> axiomancer-mobile` (261/261 suites, 2657 tests, lint 0 errors/15
> pre-existing warnings, typecheck clean, assets:check 7/7, art:test
> 24/24 — all matching pass 6 exactly). `npm run deploy:check` confirmed
> green pre-tick (HEAD `a9320ef0`, `verify-mobile` success) and will be
> re-confirmed after the ledger commit lands. No `plan/PHASE_CANDIDATES.md`
> or new `plan/AUDIT.md` residue filed this pass.
```

```
> **[adjust-keywords pass 7, 2026-09-12, commit 3c39acb9]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (keywords' pass-6 commit `ef883fc9` was the only
> stale-qualifying category at dispatch time, 16 commits since, past the
> 15-commit threshold; cards/equipment/enemies all passed within the last
> day, npcs sat at 14 commits, under its own threshold). `git log
> ef883fc9..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` is empty — the 16
> intervening commits were entirely the cards/equipment/enemies pass-7
> ticks, the npcs pass-6 tick, a digest, two `/audit`-fix ticks (mobile
> a11y + village-stall pricing), and an `/expand` no-op — nothing touched
> the keyword surface. Re-derived every Step-1 signal fresh anyway rather
> than trusting the empty path-scoped log alone: (1) **carrier-count
> sweep** — a fresh `kind: '...'` grep across all 9
> `src/Cards/library/*.cards.ts` modules reconfirms CHAIN/ECHO/EXECUTE/
> OMEN/opening(AMBUSH)/FINALE/RUPTURE/TURNABOUT/extend_dots/lock_stance all
> still sit at exactly 2 carriers apiece, no regression below the atlas's
> own "≥2 cards or ≥2 enemies" floor; the 9 zero-carrier die-gear/card-local
> kinds (`strip_random_buff`, `befriend_attempt`, `refresh_die`,
> `convert_die_color`, `overheat`, `forge_floating_die`, `float_x_die`,
> `spend_all_pips`, `echo_next_spell`) remain zero and
> `KINDS_WITHOUT_MECHANIC_KEYWORD`-exempt, confirmed via `src/Cards/
> types.ts`'s `CardSpecialMechanic`/`CardRider` union byte-identical since
> `515ac4d9` (2026-09-02, long before pass 6). (2) **enemy-keyword carrier
> sweep** (not explicitly re-run by pass 6's own log) — a fresh
> `enemy.library.ts` `keywords:` array extraction gives hide 21, wounding
> 13, venom 9, regrow 5, swift 19, brutal 21, unshaken 12, elusive 3,
> ravenous 3 — all 9 atlas-listed enemy keywords carry ≥2, no REMOVE
> candidate. (3) **CHARGE/SENTENCE internal-id spot-check** — confirmed
> `combat.cards.ts`'s `mechanicText` switch prints `kind: 'premise'` as
> "Charge" and `kind: 'peroration'` as "SENTENCE at N — ...", matching the
> retheme map's own documented convention (R-1/R-2 rename the *display*
> word; the internal id is stable, same pattern as R-14/R-15's explicit
> "engine field key does NOT rename" notes) — not a drift, a correctly
> understood id/display split. (4) **registry parity** — `axio_overview`
> reconfirms 68 keyword rows and 128 cards, unchanged from pass 6. (5)
> **Known drift section accuracy** — re-read `debuffs.library.json`
> directly: `damagePerRound` 2/3/1 for poison/bleed/doom, unchanged; and
> `src/Combat/effects.ts`'s `CAPITULATE_MIN` still 10, `
> CAPITULATE_RESOLVE_FRACTION` still 0.35 — the atlas's "Known drift" note
> stays accurate, still out of this skill's card-shaped scope, re-cited not
> re-filed. (6) **mobile KW-1/KW-3 jest suite** — ran
> `state/combat/__tests__/keywords.test.ts` directly (13/13 green) rather
> than eyeballing the union walk by hand. **One genuine finding, fixed**:
> the suite's own retirement test (`it('retired keywords (BARRIER,
> CONJURE, SENTENCE, TRANSMUTE, REPRISE) are gone', ...)`) has carried a
> stale title since the phase-29/44b SENTENCE rename landed — a `git log
> --follow -p` on the test file shows the title was mechanically
> find-replaced `PERORATION` -> `SENTENCE` at that rename, but the
> assertion array underneath (which correctly checks the OLD pre-rename
> name `'Peroration'` is gone, not the new live system term `SENTENCE`)
> was never updated to match, so the title has claimed a live, undead
> system term was "retired" for roughly five weeks. Not a functional bug —
> the assertion itself was and remains correct — but a title/assertion
> mismatch is exactly the wiring-honesty class of bug this skill's audit
> exists to catch, so fixed it in place (title now reads `PERORATION`,
> matching the array): `axiomancer-mobile/state/combat/__tests__/
> keywords.test.ts` line 104. Re-ran the suite after the fix: still 13/13
> green. KB research (kb-query gate, §3 Step 2): not run — this is a test
> description correction, not a keyword CREATE/UPDATE, and every other
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per skill §3 Step 2 (REMOVE/no-op carve-out). No
> `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed this
> pass. Verify: ran all gates in full — `npm run verify --workspace
> axiomancer-mechanics` (212/212 files, 3422 tests + build, matching pass 6
> exactly), `npm run verify --workspace axiomancer-mobile` (lint 0
> errors/15 pre-existing warnings, typecheck clean, jest 261/261 suites/
> 2657 tests — unchanged count, a title string isn't a new test —
> assets:check 7/7, art:test 24/24), `npm run type-check --workspace
> axiomancer-card-editor` (clean, exit 0), root `npm test` 123/123 (incl.
> `content-drift.test.mjs`). `npm run deploy:check` confirmed green
> pre-tick (HEAD `27987751`, no gated workflow triggered for the tip
> commit) and will be re-confirmed after the ledger commit lands.
```

```
> **[adjust-enemies pass 7, 2026-09-12, commit 0a95396b]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (16 commits since pass 6's `e57f9f63`, past the
> 15-commit threshold, and this tick's only stale-qualifying category —
> cards (`e2b08057`) and equipment (`faba6c82`) both passed within the last
> day, keywords (`ef883fc9`) and npcs (`c4f97f69`) haven't crossed their own
> threshold) — a genuine fresh re-audit against current source, not a
> rubber stamp of pass 6's findings. `git log e57f9f63..HEAD --
> axiomancer-mechanics/src/Enemy axiomancer-mechanics/src/Combat/
> combat.enemy-decks.ts axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World` is
> empty — the 16 intervening commits were the cards/equipment pass-7 ticks,
> the npcs/keywords pass-6 ticks, a digest, two `/audit`-fix ticks (dialogue
> reply-card echo, tray-die a11y), and an `/expand` no-op — nothing touched
> the roster surface. Also confirmed the dependency surfaces a deck/loot/
> portrait sweep would need are unchanged too: `cards.library.ts`
> (`df4036fc`, 2026-09-08), `consumable.library.ts` (`a22673e3`, 2026-09-04),
> `buffs.library.json`/`debuffs.library.json` (`04c75d22`, 2026-08-09), and
> `axiomancer-mobile/assets/images/enemies/index.ts` (`e57f9f63`, pass 6's
> own commit) all last-touched before or at pass 6 — so every cross-
> reference below is provably re-testing the same graph pass 6 tested, not
> assumed stale-clean. Re-derived every Step-1 signal fresh anyway with a
> throwaway extraction script (CRLF-aware — `enemy.library.ts` is CRLF-
> terminated and a naive `$`-anchored regex silently no-ops on comment
> lines, a parsing trap worth flagging for the next pass's own script) run
> directly against the live tree: (1) **orphan sweep** — 79 `createEnemy`
> consts extracted programmatically, 79 resolve 1:1 into `ENEMY_REGISTRY`
> (0 missing), 77/79 resolve into some `EnemiesByMap` pool, the same 2
> deliberate exclusions every prior pass has found (`Sandbag_01` — the
> Spec-04b test fixture; `TheIncompleteness` — the impossible-ceiling
> ceiling boss, intentionally unreachable via normal map pools) — no new
> orphan. (2) **roster-size floor / sibling-overlap sweep** — recomputed
> all 10 pool sizes fresh: fishing-village 13, northern-forest 39, caverns
> 16, northern-city 8, connecting-river 5, town-across-river 4, the-capital
> 8, aporia-colonnade 8, aporia-archive 8, aporia-proof 11 — identical to
> pass 6's post-fix numbers. Full pairwise overlap re-run (all 45 pairs):
> the only >70%-of-smaller-pool hits are northern-forest/aporia-colonnade
> (87.5%), northern-forest/aporia-archive (87.5%), northern-forest/aporia-
> proof (90.9%), and caverns/aporia-archive (75.0%) — the same 4 pairs
> every pass since pass 1 has re-confirmed as the labyrinth's own
> documented deliberate-reuse design (wandering foes scaling to the player
> via the adaptive level bands), not drift. northern-forest/caverns sits at
> 62.5% and northern-city/the-capital at 62.5% (pass 6's own capital
> backfill), both still under the ceiling. connecting-river (5) and town-
> across-river (4) remain the roster's two smallest raw pools, but no
> `World`/map-content file changed since pass 6 to disturb pass 3's
> density-normalized reading (connecting-river 5/14 nodes = 0.36/node,
> town-across-river 4/7 = 0.57/node, both mid-pack against northern-city's
> own 8/27 = 0.30/node) — that reading, and `plan/phases/
> phase_W4_connecting_river.md`'s decision #2/#6 authored-pacing rationale
> behind it, stand unrevisited and unchallenged by any new evidence this
> pass. (3) **deck sweep** — a fresh raw grep for `^\s*'enemy-[\w-]+':` across
> `combat.enemy-decks.ts` finds 92 source-literal key declarations, 78
> unique after JS object-literal dedup (14 duplicate-key overrides, e.g.
> `enemy-tri-eyes`, `enemy-the-butcher`, `enemy-death` — pre-existing,
> unchanged from pass 6's own count); all 78 unique keys resolve against
> the 79 `ENEMY_REGISTRY` slugs via the `enemy-<slug>` convention, 0
> unmatched. All 157 distinct card-id-shaped tokens referenced inside
> `ENEMY_DECKS` (unchanged from pass 6 — no new deck, no new card) resolve
> 1:1 against `ENEMY_CARD_LIBRARY`'s 157 keys, 0 missing. (4) **portrait
> sweep** — 77 `portraitAsset` values re-extracted, 0 duplicates, all 77
> resolve 1:1 into `axiomancer-mobile/assets/images/enemies/index.ts`'s
> 77-key registry, and a fresh `require()`-path resolution check confirms
> all 77 backing files exist on disk — clean. (5) **VITAE-band sweep** — 21
> explicit `vitae:` overrides, exact same count as pass 6; `enemy.library.ts`
> is byte-identical to pass 6's own commit `e57f9f63` and the VITAE-formula
> constants (`src/Enemy/index.ts`) haven't changed since `e9201415`
> (2026-09-02, pre-dates pass 5), so the standing worst-deviation figure
> (ElderFireGiant +25.7%, inside the ~±26% tolerance band established pass
> 1) stands unchanged — not a violation, no CREATE/UPDATE triggered. (6)
> **aftermath-prose/voice sweep** — zero `\b(thee|thou|thy|thine|ye)\b`
> matches (case-insensitive) anywhere in `enemy.library.ts`; 47/79 enemies
> carry `finalBlowLines`, so the standing 32-enemy backlog (filed pass 1,
> `plan/AUDIT.md` `[content]`, scoped to `content-curator` not this skill)
> is unworsened — re-cited, not re-filed. (7) **loot-table sweep** — 22
> distinct `drop()` ids re-extracted from `enemy.library.ts`, all 22
> resolve 1:1 against `Items/consumable.library.ts`'s 22 ids; `loot.ts`
> itself carries no hardcoded item ids (pure weighted-roll logic) — clean.
> KB research (kb-query gate, skill §3 Step 2): not run — zero CREATE/UPDATE
> this pass, exempt under the REMOVE/no-op carve-out the sibling categories'
> own zero-diff passes have used identically. Verify: ran both gates in
> full (not skipped, despite zero source diff) — `npm run verify
> --workspace axiomancer-mechanics` (212/212 files, 3422 tests + build,
> matching pass 6's count exactly), `npm run verify --workspace
> axiomancer-mobile` (261/261 suites, 2657 tests, lint 0 errors/15
> pre-existing warnings, typecheck clean, assets:check 7/7, art:test 24/24
> — all matching pass 6 exactly). `npm run deploy:check` confirmed green
> pre-tick (HEAD `72881ac9`, no gated workflow triggered for the docs/
> plan-only tip commit) and will be re-confirmed after the ledger commit
> lands. No `plan/PHASE_CANDIDATES.md` or new `plan/AUDIT.md` residue filed
> this pass — nothing actionable surfaced outside the standing, already-
> filed backlog items re-cited above.
```

```
> **[adjust-equipment pass 7, 2026-09-12, commit faba6c82]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (16 commits since pass 6's `da51e629`, past the
> 15-commit threshold, and this tick's only stale-qualifying category —
> cards/enemies/keywords/npcs all passed more recently or haven't crossed
> their own threshold yet) — a genuine fresh re-audit against current
> source, not a rubber stamp of pass 6's findings. `git log
> da51e629..HEAD -- axiomancer-mechanics/src/Items
> axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` is empty (the 16 intervening commits were
> the enemies/keywords/npcs pass-6 ticks, a digest, two `/audit`-fix ticks
> against mobile dialogue/reply-card rendering and the village-stall pricing
> dim treatment, an `/expand` no-op, and the cards pass-7 zero-diff re-audit
> — nothing touched the item/shop/signature surface), so every Step-1 signal
> was re-derived directly against the current tree rather than assumed
> stale-clean, same discipline as the sibling categories' own re-audits: (1)
> **dominated relics** — re-read all 8 off `relic.library.ts`
> (byte-identical since pass 6): 2 weapons tie at body+2, 2 armor tie at
> maxHp+5, 4 accessories split mind+2/mind+2/heart+2/heart+2 — every
> same-slot pair still differs only by `grantsSignature` (re-confirmed
> non-`undefined` and distinct on all 8), no strictly-dominated pair; (2)
> **shop/reward-pool coverage** — re-enumerated all 7 `shop.wares` blocks in
> `World/MapEvents/content.ts` by fresh grep (unchanged from pass 6, no 8th
> village landed since): 12 distinct consumables shop-stocked
> (minor/greater/supreme-healing-potion, healing-potion, antidote,
> clarity-serum, philosopher-tea, void-essence, body-elixir, focus-vial,
> resonance-crystal, phoenix-tear), the other 10 confirmed still reachable
> (not acquirable-nowhere) via `rollCacheReward`'s uniform draw over the
> full, unfiltered 22-entry `consumableLibrary` (re-read `cache-reward.ts`,
> byte-identical since pass 1) — no orphaned item; (3) **`grantsSignature`
> drift** — all 8 relic values re-checked against the live 8-member
> `SignatureSkillId` union in `combat.encounter.types.ts`: identical, no
> rename/removal; (4) **dead consumable `effectId`s** — re-extracted all 11
> non-heal-only ids from `consumable.library.ts` (unchanged, still 22
> entries) and confirmed each resolves by id against
> `buffs.library.json`/`debuffs.library.json` via a fresh grep, all 11
> found, 0 dead references; (5) **`AccessoryKind` gap** — head/hands/feet
> remain at zero live relics, same standing `[loop-call]`
> (`plan/AUDIT.md`, 2026-09-04, answers the open `[HIGH]` in
> `plan/CRITIQUE.md`) re-read at its current text: still open, still
> accurate, no new evidence this pass to decide it solo between (a)
> designing a 9th+ signature skill first or (b) breaking the relic's 1:1
> identity rule for stat-only accessories — left filed, not re-litigated.
> Also spot-checked the one item-adjacent commit in range,
> `2836d821` ("village stall rows dim only price when unaffordable") — a
> pure `axiomancer-mobile/app/village/index.tsx` styling fix (CRITIQUE [LOW]
> closure) with no `wares`/pricing/data change, confirmed by reading its
> full diff, not an equipment-content finding. KB research: not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per skill §3 Step 2 (REMOVE/no-op carve-out). Verify:
> ran both gates in full this pass (not skipped, despite zero source diff)
> — `npm run verify --workspace axiomancer-mechanics` (212/212 files, 3422
> tests + build, matching pass 6's count exactly), `npm run verify
> --workspace axiomancer-mobile` (261/261 suites, 2657 tests, lint 0 errors/
> 15 pre-existing warnings, typecheck clean, assets:check 7/7, art:test
> 24/24); `npm run deploy:check` confirmed green pre-tick (HEAD `ed87c83c`,
> no gated workflow triggered for the docs/plan-only tip commit) and will be
> re-confirmed after the ledger commit lands.
```

```
> **[adjust-cards pass 7, 2026-09-11, commit e2b08057]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (16 commits since pass 6's `01629acf`, past the
> 15-commit threshold, and this tick's only stale-qualifying category —
> equipment/enemies/keywords/npcs all passed more recently today) — a
> genuine fresh re-audit against current source, not a rubber stamp of pass
> 6's "nothing found." `git log 01629acf..HEAD -- axiomancer-mechanics/
> src/Cards axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat`
> returns exactly one commit, `e57f9f63` (`/adjust-enemies` pass 6); read its
> full diff directly rather than trusting its own summary — it only added 5
> lines to `combat.enemy-decks.ts` wiring two new capital-native enemies'
> decks entirely from pre-existing `debt-office` card ids (no new
> `CardSpecialMechanic` kind, effect id, or card literal), and a full
> `git diff 01629acf..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects` confirms byte-identical (0 lines) — the
> live card/effect data pass 6 audited is unchanged. Re-derived every Step-1
> signal fresh anyway rather than assuming stale-clean: (1) **reachability**
> — ran `combat-playtest.card-coverage.sim.test.ts` directly: 123/123
> playable cards (128 minus the 5 enemy-injected curses) still fire in at
> least one fallback seed, matching pass 6 exactly. (2) **near-duplicates**
> — wrote a fresh same-(theme,rank,`philosophicalAspect`) collision scan
> restricted to kind-sets of size ≥2 (pass 6's own refined methodology, to
> exclude single-verb DEAL noise — DEAL alone is carried by roughly 40% of
> the library per `/adjust-keywords` pass 5's count): reproduces exactly
> pass 4-6's two documented hits, `thin-hymn`/`alms-of-breath`
> (`rider,sway`) and `the-last-assize`/`the-vein-called-in`
> (`deal,overkill,recoil,wrath`), no new collision. (3) **pricing sanity +
> honesty** — `pricing.engine.test.ts` (251), `curated-library.engine.
> test.ts` (14, the FREE-line law), `src/Combat/e2e/preview-truth.engine.
> test.ts` (10), `src/Combat/e2e/paid-summary-honesty.engine.test.ts` (4),
> and `src/Combat/e2e/deck-presets.engine.test.ts` (9, the pinned 5/5/5
> preset-aspect-thirds law) all green, matching pass 6's counts exactly
> (the deck-presets suite wasn't individually cited in pass 6's own prose
> but is part of the same full-verify green run both passes cite). (4)
> **scale-ladder drift** — fresh `axio_cards` sweep at Rib and Saint rank
> against the CLAUDE.md §5 ladder (Rib single-hit 20-30/multi 7×4; Saint
> single-hit 45-70/multi 12×6): all samples land in-band or above except a
> small set of combo/payoff-secondary cards examined by hand — `Dirge for
> the Disinterred` (Rib, Deal 11) carries ECHO, which fires its PAID line
> twice per the keyword glossary ("the card's PAID line fires twice"),
> giving an effective 22, back in-band; `The Second Burial` (Rib, Deal 18)
> and `The Bench Does Not Retire` (Saint, Deal 40) both sit a little under
> their band but are combo-enabler/payoff cards (TWIN-granting and
> SENTENCE-at-10/CONDEMN respectively) whose primary value is the
> uncapped payoff, not the base Deal line; `The Feast of All Corruption`
> (Saint, Deal 20) is a DoT/RUPTURE-ALL/SIPHON payoff card where Deal is a
> rider, not its axis — same "competing verbs, no governing shape" reading
> pass 4-6 applied to rot's fed-payoff cards, not a quietly-small bug.
> (5) **aspect-thirds — a genuine correction to pass 6's own citation, not
> a new drift**: pass 6's log entry cited raw per-theme aspect counts as
> "rot 6/5/5, debt 5/6/5, grave 6/5/5, vigil 5/6/5, trial 7/7/6, choir
> 5/6/5" (body/heart/mind) via "fresh grep... per theme module" — re-running
> that grep restricted to each theme's eponymous file only (`rot.cards.ts`
> for rot, etc.) reproduces those exact pass-6 numbers, but a programmatic
> count over the live `cardLibrary` objects' actual `theme` field (not
> filename) gives materially higher totals — rot 8/6/5=19, debt 6/8/5=19,
> grave 7/5/8=20, vigil 7/6/7=20, trial 8/8/8=24, choir 5/10/6=21, curse
> 3/1/1=5 — because `apocrypha.cards.ts` (2 cards per theme, all 6 themes),
> `starters.cards.ts` (1-2 per theme plus all 5 curses, authored through a
> shared `curse()` factory that a per-file literal grep undercounts 5→1),
> and `relics.cards.ts` (1 each for choir/grave/trial) all carry `theme:`
> values for OTHER themes than their filename. Cross-validated against
> `axio_overview`'s independent per-theme totals (`debt(19), trial(24),
> rot(19), choir(21), vigil(20), curse(5), grave(20)`) — exact match on
> every theme, confirming the programmatic count, not the grep, is
> accurate. This is a re-audit methodology fix for the next pass to inherit
> (grep the FIELD across all library files, not the file matching the
> theme's name), not a live content problem: the actual governing
> constraint is preset-deck aspect thirds, not raw per-theme totals, and
> `deck-presets.engine.test.ts`'s pinned 5/5/5 law is green (9/9, see (3));
> every theme's worst-off aspect is still 21-31% of that theme's own total
> (choir-body 5/21, rot-mind 5/19, grave-heart 5/20, debt-mind 5/19), not a
> starvation case this signal's own "needs raw material" bar would call a
> CREATE on — noted for the record, not shipped as a fix. Standing
> loop-calls re-checked against current source, not re-litigated: the 19
> orphaned `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts`
> (`plan/AUDIT.md`, filed pass 1, 2026-09-04) and `the-sextons-count`'s
> missing TWIN trigger (same file) — both still open, both confirmed
> byte-identical to their filed description (the 0-line `src/Cards`/
> `src/Effects`/`src/Combat` diff since pass 6 covers these files too),
> still correctly mechanics-expert/engine-constant territory, not a card
> data fix. KB research: not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per skill
> §3 Step 2 (REMOVE/no-op carve-out). Verify: ran all three gates in full
> this pass (not skipped, despite zero source diff) — `npm run verify
> --workspace axiomancer-mechanics` (212/212 files, 3422 tests + build,
> matching pass 6's count exactly), `npm run verify --workspace
> axiomancer-mobile` (261/261 suites, 2657 tests, lint/typecheck clean,
> assets:check 7/7, art:test 24/24), `npm run type-check --workspace
> axiomancer-card-editor` (clean, exit 0); `npm run deploy:check` confirmed
> green pre-tick (HEAD `aa55a78d`) and will be re-confirmed after the
> ledger commit lands.
```

```
> **[adjust-npcs pass 6, 2026-09-11, commit c4f97f69]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (npcs' pass-5 commit 47bcda82 was the stalest
> qualifying category, 16 commits since, past the 15-commit threshold) —
> full re-audit, not a rubber stamp of pass 5's findings. `git log
> 47bcda82..HEAD -- axiomancer-mechanics/src/NPCs axiomancer-mechanics/
> src/World axiomancer-mechanics/specs/story axiomancer-mechanics/
> specs/characters` is empty (the 16 commits since pass 5 were entirely the
> cards/equipment/enemies/keywords pass-6 ticks, a digest, and two
> `/audit`-fix ticks against mobile's dialogue/event reply-card rendering —
> `393354c6`/`b1624da0` touch `axiomancer-mobile/app/dialogue/index.tsx` and
> `axiomancer-mobile/app/event/index.tsx`, the presenter layer, not
> `src/NPCs`/`src/World` engine content, confirmed by reading both commits'
> diffs directly rather than trusting the empty path-scoped log alone), so
> every Step-1 signal was re-derived directly against the current tree
> rather than assumed stale-clean, same discipline as the sibling
> categories' own pass-6 re-audits: (1) **orphaned/unstaged NPC sweep** —
> a fresh script extracted all 21 `NPC` consts across the 4 authoring files
> (`Coastal-Village/npcs.ts` 5, `Coastal-Village/maps.ts` 3,
> `Northern-Forest/npcs.ts` 6, `Northern-Continent/maps.ts` 7 — unchanged
> from pass 5's 20 + the 1 it created that pass, `theRibbonPicker`); all
> 21/21 resolve into some map's `npcs:` array by direct regex cross-check,
> no new orphan. The standing `unstagedNpcs` backlog
> (`Coastal-Village/maps.ts`) is still exactly the same 4 (Tide-Shopkeeper,
> Village Healer, Dockworker's Union Leader, Merchant's Widow) with the same
> per-NPC reasons, byte-identical block since pass 3; confirmed fresh (not
> assumed) that none of the four has a `MapEvents/content.ts` interaction
> payload naming them (a direct grep for all four display-name strings
> against that module returns zero hits) and that `isShopkeeper` still has
> zero mobile consumers (fresh grep of `axiomancer-mobile/`); Village
> Healer's stated precondition ("place her once the rest rebuild has fully
> settled") is re-confirmed still unmet — `git log 47bcda82..HEAD --
> axiomancer-mobile/app/rest axiomancer-mobile/state/presenters/rest.copy.ts`
> is empty, no commit since pass 5 touched either path. (2) **map with <2
> staged NPCs signal** — recomputed all 7 maps' `npcs:` array lengths fresh
> (fishing-village 8, northern-forest 6, caverns 1, northern-city 2,
> connecting-river 1, town-across-river 1, the-capital 2 — unchanged from
> pass 5, no new map landed since); the standing `plan/AUDIT.md`
> `[needs-user-call]` row (filed pass 1, 2026-09-05) on caverns/
> connecting-river/town-across-river's single-NPC maps re-read directly at
> its current text: still un-`[x]`-marked, still describes each singleton as
> the deliberate "guaranteed quest-giver" pattern per the maps' own header
> comments, not re-litigated. (3) **dead-end / stale-reference sweep** — a
> fresh script across all 4 authoring files found 134 `nextNodeId`
> references, ZERO resolving to a missing node id (cross-checked against
> every `id:` field inside the files' `DialogueTree`/`DialogueNode`
> literals); zero `teachCard` call sites (only the type declaration, same
> as every prior pass); 10 distinct `startQuest` targets (unchanged from
> pass 5's set, including `get-to-the-capital`), all type-check clean
> against the live `QuestName` union (`FishingVillageQuests` through
> `TownAcrossRiverQuests`, re-read directly in `quest.library.ts`). Also ran
> the live audits rather than trusting the sweep script alone:
> `narrative-reachability.test.ts` (5/5), `World/e2e/
> narrative-reachability.engine.test.ts` (26/26, the audit run against real
> `MapDefinition`/`NPC` data), and `MapEvents/e2e/
> nf-21-nf-14-npc-staging.engine.test.ts` (4/4) — all green, no orphaned
> tree, unresolved interaction ref, or scenery-as-people flagged. (4)
> **legacy flat `DialogueMap` sweep** — zero live usage confirmed again
> (`grep -rn DialogueMap src/` outside `e2e/` returns only the type
> declaration in `NPCs/types.ts` and its two re-exports in `NPCs/index.ts`/
> `src/index.ts`). (5) **spec-to-NPC gap** — `git log 47bcda82..HEAD --
> axiomancer-mechanics/specs/` is empty, no `specs/characters/` or
> `specs/story/` file changed since pass 5; `C-01-the-sophist.md` (Protas)
> remains correctly an enemy/Labyrinth entity (confirmed still present only
> in `enemy.library.ts` and `Labyrinth/content/act3.content.ts`, not
> `src/NPCs/**`), not a gap this skill owns. **Incidental, out-of-scope
> observation (not actioned, not filed as residue)**: `quest.library.ts`'s
> own JSDoc still describes "main-STORY beats... play as authored Quest
> Board minigames (`World/QuestBoard`...)" — that module was retired
> (Phase 61, confirmed: no `World/QuestBoard` directory exists, and
> `quest-board-retirement-migration.engine.test.ts` is the only other live
> reference to the retired mechanic). The comment predates pass 5 (last
> touched by `f56fa198`, the same W5 commit pass 5 already reviewed), is
> cosmetic doc drift on a `World/quest.library.ts` comment rather than an
> NPC/dialogue authoring surface, and doesn't affect the `QuestName` union
> or any live `startQuest`/`progressQuest` reference (all 10 `startQuest`
> targets resolve cleanly, per (3) above) — noted for whichever future pass
> owns `quest.library.ts`'s doc hygiene, not this skill's remit. Also
> re-checked `plan/PHASE_CANDIDATES.md`'s standing "retheme the six
> Northern-Forest dialogue trees" candidate (filed pass 1, score 5.0) — still
> open, still correctly sized as its own phase rather than a routine
> structural finding, not actioned this pass. KB research (kb-query): not
> run — every consideration this pass was audit-confirmed-clean (no
> CREATE/UPDATE), exempt from the gate per skill §3 Step 2 (REMOVE/no-op
> carve-out). Verify: ran both gates in full this pass (not skipped, despite
> zero source diff) — `npm run verify --workspace axiomancer-mechanics`
> (212/212 files, 3422 tests + build, matching pass 5's count exactly) and
> `npm run verify --workspace axiomancer-mobile` (lint/typecheck/jest all
> green, exit 0); `npm run deploy:check` confirmed green pre-tick (HEAD
> `cd69b252`, no gated workflow triggered for the docs/plan-only tip commit)
> and will be re-confirmed after the ledger commit lands.
```

```
> **[adjust-keywords pass 6, 2026-09-11, commit ef883fc9]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (keywords' pass-5 commit 17b38058 was the stalest
> qualifying category, 16 commits since, past the 15-commit threshold) —
> full re-audit, not a rubber stamp of pass 5's findings. `git log
> 17b38058..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly one commit
> (`e57f9f63`, `/adjust-enemies` pass 6) out of the 16 landed since pass 5;
> read its full diff directly rather than trusting its own commit-message
> summary — it only added 5 lines to `combat.enemy-decks.ts` wiring two new
> capital-native enemies' decks entirely from the pre-existing `debt-office`
> card canon (`first-notice`/`collection-rounds`/`do-the-second-notice`,
> `condolences-itemized`/`compound-interest`/`do-the-garnishment` — all six
> already-shipped card ids, confirmed by the commit's own "no new cards
> needed" note), so no new `CardSpecialMechanic` kind, effect id, or card
> literal entered the keyword surface. Every Step-1 signal was re-derived by
> direct enumeration/script against the current tree rather than assumed
> stale-clean, same discipline as the sibling categories' own pass-6
> re-audits: (1) registry row-count parity — `axio_keywords` and
> `axio_overview` both still return exactly 68 rows (unchanged from pass 5,
> confirmed via fresh calls, not a cached number), alongside the same
> 128-card/78-enemy/24-effect counts the sibling passes counted today
> (78 enemies is pass 6 enemies' own +2, correctly outside this skill's
> remit); (2) full carrier-count sweep — a fresh `grep -oE "kind:
> '[a-zA-Z_]+'"` across all 9 `src/Cards/library/*.cards.ts` modules
> reconfirms CHAIN/ECHO/EXECUTE/OMEN/opening(AMBUSH)/FINALE/RUPTURE/
> TURNABOUT all still sit at exactly 2 carriers apiece, no regression below
> the atlas's own "≥2 cards or ≥2 enemies" floor; a fresh extraction of all
> 54 literal `kind:` members off `src/Cards/types.ts`
> (`CardSpecialMechanic`/`CardRider` union) against the same grep confirms
> the same 9 zero-carrier die-gear/card-local kinds
> (`strip_random_buff`, `befriend_attempt`, `refresh_die`,
> `convert_die_color`, `overheat`, `forge_floating_die`, `float_x_die`,
> `spend_all_pips`, `echo_next_spell`) remain at zero and stay
> `KINDS_WITHOUT_MECHANIC_KEYWORD`-exempt; ran the mobile KW-1/KW-3 jest
> suite directly (`state/combat/__tests__/keywords.test.ts`, 13/13 green)
> rather than eyeballing the union walk by hand — it mechanically re-proves
> "every mechanic kind either maps to a glossed keyword or is classified"
> and "no mapping points at a kind the engine does not have", so a silent
> `default:`-arm regression (the skill's own "ship regardless of priority"
> bug signal) would have failed this run; none did. (3) atlas "Known drift"
> section re-checked against current source, not assumed accurate:
> `debuffs.library.json`'s `debuff_poison`/`debuff_bleed`/
> `debuff_creeping_doom` (DOOM) `damagePerRound` values are still 2/3/1
> exactly as the atlas's own note states (the overhaul's §5.2 ×3-4 rescale
> has not landed; Mark itself carries no `damagePerRound` field — it's a
> per-tick multiplier on other DoTs, not a direct-damage entry) and
> `src/Combat/effects.ts`'s
> `CAPITULATE_RESOLVE_FRACTION`/`CAPITULATE_MIN` still floor RELENT at 10,
> not the overhaul's §5.4 "min 20" — both re-confirmed still accurate via a
> direct grep of the live values (not carried over from pass 5's prose) and
> still engine-constant/effects-data rescales out of this skill's
> card-shaped scope, left untouched matching every prior pass's own
> boundary call, not re-filed. (4) idea-mining sweep (Step-1's
> functions-column CREATE-candidate signal) — read the full 141-row
> `DigitalCardGames/dawncaster/keywords.csv` via `kb_read_doc` (not a
> `kb_cards` sample) and swept its `functions` column against our own
> keyword families: the one plausible gap is Dawncaster's "Immunity"
> function (Evasion/Impervious/Insight/Ward — prevent-the-next-hit-entirely
> effects), which our registry has no direct analogue for (GUARD/THORNS/
> RIPOSTE/QUARTER are all damage-*reduction*, not damage-*prevention*) —
> judged NOT a "real design gap" this signal's own bar requires — no
> current card or theme package is starved for it, and every prior
> `/adjust-keywords` pass's own CREATE bar has been a concrete carrier-count
> or sibling-overlap problem, not a genre-parity wishlist item; noting it
> here rather than minting a keyword with no driving card need, consistent
> with hard rule 3 (drill before minting) read in its more conservative
> direction (don't mint speculatively either). No `plan/AUDIT.md` residue
> row filed for it — this is a documented non-finding, not an open call
> only an owner can make. KB research (kb-query): run for the idea-mining
> sweep above (the CREATE-candidate signal specifically); not otherwise run
> for the rest of this pass — every other consideration was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per skill
> §3 Step 2 (REMOVE/no-op carve-out). Verify: not re-run in full — no
> `axiomancer-mechanics`/`axiomancer-mobile`/`axiomancer-card-editor` source
> file changed (`git status` clean on all three before this tick); ran the
> direct confirmation set instead — root `npm test` 123/123 (incl.
> `content-drift.test.mjs`), `axiomancer-mobile` jest
> `state/combat/__tests__/keywords.test.ts` 13/13,
> `axiomancer-mechanics` vitest `src/Effects/e2e/deprecated-effects.engine.
> test.ts` (6) + `src/Cards/e2e/pricing.engine.test.ts` (251) — 257/257, all
> matching pass 5's counts exactly — and confirmed HEAD's existing CI green
> via `npm run deploy:check` (`4ef8f727`, `verify-mobile` + `verify-mechanics`
> both `success`) immediately before this tick began.
```

```
> **[adjust-enemies pass 6, 2026-09-11, commit e57f9f63]** CREATE 2
> (the-capital thinness/overlap backfill) — dispatched autonomously by
> `/march`'s content-lifecycle gate (enemies' pass-5 commit ce6e6a60 was the
> stalest of the two qualifying categories at dispatch time, 19 commits
> since). Full fresh Step-1 re-audit, not a rubber stamp of pass 5's
> findings: `git log ce6e6a60..HEAD -- axiomancer-mechanics/src/Enemy
> axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World` is
> NOT empty this pass (unlike enemies' own recent zero-diff re-audits):
> `f56fa198` ("ship The Capital, map 5 of the northern continent — Phase
> W5/W6") added a 9th `EnemiesByMap` pool key pass 5 never saw, and its own
> commit body plus a `plan/AUDIT.md` residue row it filed
> ("The Capital's enemy pool reuses existing roster entries...a legitimate
> future `/adjust-enemies` backfill") flagged it for this exact pass. (1)
> **roster-size floor / sibling-overlap sweep** — recomputed all 10 pool
> sizes and every pairwise overlap fresh (fishing-village 13,
> northern-forest 39, caverns 16, northern-city 8, connecting-river 5,
> town-across-river 4, the-capital 6 pre-fix, aporia-colonnade/archive 8
> each, aporia-proof 11): the-capital's pre-fix 6-member pool had 5 members
> (every one but CursedPaladin) also in northern-city's own 8-member pool —
> 83.3%, over the skill §1 >70% sibling-overlap ceiling, confirming the
> filed residue's reading exactly. The 4 pre-existing >70% Aporia-vs-forest/
> caverns pairs re-confirmed as the labyrinth's own documented
> deliberate-reuse design, unchanged, not re-litigated. CREATE: The Stamper
> (`enemy-the-stamper`, level 18, normal) and The Underclerk
> (`enemy-the-underclerk`, level 19, normal), both capital-native,
> `debt-office` archetype (the capital being that archetype's own home
> city per its existing flavor canon — The Factor's "his office was always
> going to end up" there). Drops the reading to 5/8 = 62.5%, freshly
> re-verified post-fix (also 25.0% against northern-forest and caverns,
> both already well under ceiling). (2) **orphan sweep** — re-extracted all
> 79 `enemy.library.ts` consts programmatically (77 prior + 2 new): 79/79
> resolve into `ENEMY_REGISTRY`, 77/79 into some `EnemiesByMap` pool, same 2
> deliberate exclusions (`Sandbag_01`, `TheIncompleteness`) as every prior
> pass — no new orphan. (3) **deck sweep** — a fresh script cross-checked
> every `ENEMY_DECKS` entry (92 source-literal declarations, 78 unique keys
> after JS object-literal dedup — the 14 duplicate-key overrides are
> pre-existing, unchanged by this pass) against the 79 `ENEMY_REGISTRY`
> slugs: 0 unmatched. All 157 distinct card-id references (unchanged from
> pass 5 — both new decks reuse existing `debt-office` cards, no new cards
> authored) resolve against `ENEMY_CARD_LIBRARY`, 0 missing. (4) **portrait
> sweep** — 77 `portraitAsset` values re-extracted (75 prior + 2 new), zero
> duplicates, all 77 resolve 1:1 into
> `axiomancer-mobile/assets/images/enemies/index.ts`'s registry, every
> required `.webp` present on disk including the two new ones
> (`the-stamper.webp`, `the-underclerk.webp`, 512×512 WebP, alpha,
> Delapouite/Lorc CC BY 3.0 via the licensed game-icons.net trove,
> provenance recorded). (5) **VITAE-band sweep** — 21 explicit `vitae:`
> overrides, unchanged from pass 5 (neither new enemy sets one, both use
> the derived band for their level); `enemy.library.ts`'s pre-existing
> content is otherwise byte-identical to pass 5 except the additive capital
> backfill, so the worst-deviation figure (ElderFireGiant +25.7%) stands.
> (6) **aftermath-prose/voice sweep** — zero `\b(thee|thou|thy|thine|ye)\b`
> matches (case-insensitive) anywhere in `enemy.library.ts`; 47
> `finalBlowLines` carriers of 79 (up from 45/77 — both new enemies ship
> full aftermath prose, so the standing backlog stays at exactly 32,
> unworsened; filed pass 1, `plan/AUDIT.md` `[content]`, re-cited not
> re-filed). (7) **loot-table sweep** — both new enemies' `drop()` ids
> (`body-elixir`, `healing-potion`, `clarity-serum`, `focus-vial`) are
> already-verified members of the standing 22-id set against
> `Items/consumable.library.ts` — no new id introduced, diff stays empty.
> KB research (kb-query gate, §3 Step 2): `kb_search` across
> `court|bureaucra|clerk|noble|steward|petition` (scope `all`) returned no
> on-point numeric doctrine for a sibling-pool-overlap ceiling — the same
> miss passes 1 and 2 hit on this identical signal shape — so the grounding
> is this repo's own established precedent (the caverns/connecting-river/
> town-across-river backfills, all the same fix) plus Mage Knight's
> per-site monster-deck model (`kb:mage-knight` — a site earns its own
> bestiary rather than reusing a neighbour's wholesale), the same citation
> passes 1/2 used for this exact finding shape. Full wiring: `createEnemy`
> + `EnemyLibrary` + `EnemiesByMap['the-capital']` + `ENEMY_REGISTRY` in
> `enemy.library.ts`; a 3-card deck each in `combat.enemy-decks.ts`
> (`first-notice`→`collection-rounds`→`do-the-second-notice`, 0.85→0.95→
> 1.15; `condolences-itemized`→`compound-interest`→`do-the-garnishment`,
> 0.9→1.15→1.25); aftermath prose (finalBlowLines + causeLines); licensed
> portraits + `provenance.json`; a new hermetic e2e block in
> `new-enemies.engine.test.ts` (4 cases, including a pinned
> overlap-under-ceiling assertion) plus the `ROSTER_ADDED_STAMPS` bump.
> `plan/AUDIT.md`'s residue row marked `[x]` RESOLVED. Verify: green
> (mechanics 212/212 files, 3422 tests + build; mobile lint/typecheck/jest +
> assets:check 7/7 + art:test 24/24).
```

```
> **[adjust-equipment pass 6, 2026-09-11, commit da51e629]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (19 commits since pass 5, past the 15-commit
> threshold, and the stalest of the two qualifying categories — equipment's
> pass-5 commit predates enemies' by ~4 hours) — full re-audit, not a
> rubber stamp of pass 5's findings. `git log 2b02ff60..HEAD --
> axiomancer-mechanics/src/Items axiomancer-mechanics/src/World/MapEvents/
> content.ts axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` is NOT empty this pass (unlike the
> sibling categories' recent zero-diff re-audits): `f56fa198` ("ship The
> Capital, map 5 of the northern continent — Phase W5") added a 7th
> `shop.wares` block — genuine new equipment-adjacent territory pass 5
> never saw. Re-derived every Step-1 signal directly against the current
> tree: (1) dominated relics — re-read all 8 off `relic.library.ts`
> (byte-identical since pass 5): 2 weapons tie at body+2, 2 armor tie at
> maxHp+5, 4 accessories split mind+2/mind+2/heart+2/heart+2, every
> same-slot pair differs only by `grantsSignature`, no strictly-dominated
> pair; (2) `grantsSignature` drift — all 8 relic values still 1:1 against
> the live 8-member `SignatureSkillId` union in `combat.encounter.types.ts`,
> no rename/removal; (3) dead consumable `effectId`s — re-extracted all 11
> non-heal-only ids from `consumable.library.ts` (unchanged, still 22
> entries) and checked each against `buffs.library.json`/
> `debuffs.library.json` by id, all 11 resolve; (4) shop-pool / reward-table
> coverage — **the genuine new finding**: re-enumerated `shop.wares` blocks
> across `World/MapEvents/content.ts` by fresh grep and found 7, not pass
> 5's 6 — `capMarket` (The Capital, `cap-6.village`, "The Petitioners' Row")
> stocks `greater-healing-potion`/`supreme-healing-potion`/
> `resonance-crystal`/`phoenix-tear`, four late-game consumables previously
> reachable only via `rollCacheReward`'s uniform draw. Distinct shop-stocked
> consumables rise from pass 5's 8/22 to 12/22; the other 10 (incl.
> `revive-crystal`, `berserker-brew`, `regeneration-tonic`) remain
> cache-only, confirmed still reachable (not acquirable-nowhere) since
> `rollCacheReward` still draws uniformly over the full, unfiltered
> `consumableLibrary` (re-read `cache-reward.ts`, byte-identical since pass
> 1). No dead itemId: all 4 of `capMarket`'s wares resolve in
> `consumableLibrary` by a fresh cross-check. Not a CREATE/UPDATE trigger —
> new shop placement is a `/forge`/W5 map-content concern, already shipped;
> this pass's job was confirming it didn't orphan or duplicate anything,
> which it didn't. (5) `AccessoryKind` gap — head/hands/feet remain at zero
> live relics, same standing `[loop-call]` (`plan/AUDIT.md`, 2026-09-04,
> answers the open `[HIGH]` in `plan/CRITIQUE.md`) re-read and reconfirmed
> still accurate: still needs an owner/mechanics-expert call between (a)
> designing a 9th+ signature skill first or (b) breaking the relic's own
> stated 1:1 identity rule for stat-only accessories — no new evidence this
> pass to decide it solo, left filed, not re-litigated. KB research: not
> run — every consideration this pass was audit-confirmed-clean (no
> CREATE/UPDATE), exempt from the gate per skill §3 Step 2 (REMOVE/no-op
> carve-out). Verify: not re-run in full — no `axiomancer-mechanics`/
> `axiomancer-mobile` source file changed (`git status` clean on both), and
> `npm run deploy:check` confirmed green immediately before this tick began
> (HEAD `f898deaf`, no gated workflow triggered for the docs/plan-only tip
> commit) — the direct signal checks above (grep/read-based, not
> test-suite-based) are what's new this pass.
```

```
> **[adjust-cards pass 6, 2026-09-11, commit 01629acf]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (19 commits since pass 5, past the 15-commit
> threshold) — full re-audit, not a rubber stamp of pass 5's findings.
> `git log 35c4c56c..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat` is
> empty (all 19 intervening commits were the equipment/enemies/keywords/npcs
> pass-5 ticks, The Capital's Phase W5 ship, two `/audit`-fix ticks, a
> combat-round-e2e test extension, and an `/expand` no-op — nothing touched
> the card/effect/combat surface), so every Step-1 signal was re-derived
> directly against the current tree rather than assumed stale-clean, same
> discipline as pass 4/5's own re-audits: (1) reachability — ran
> `combat-playtest.card-coverage.sim.test.ts` directly: 123/123 playable
> cards (the 128-card `cardLibrary` minus the 5 enemy-injected curses) still
> fire in at least one fallback seed, no dead-card candidate; (2)
> near-duplicates — wrote a fresh same-(theme,rank,`philosophicalAspect`)
> collision scan over the live `cardLibrary` export, and refined the
> methodology this pass: a raw kind-set match over-fires on any two
> same-(theme,rank,aspect) cards that both carry only `deal` (DEAL alone is
> 50/128 cards per `/adjust-keywords` pass 5's own carrier count, so a
> single-verb match is noise, not a duplicate) — found exactly one such
> false positive (`spoiled-poultice` vs `unction-of-boils`, both rank-1 body
> rot cards) and confirmed by reading both in full that they differ in every
> number that matters (7 dmg/POISON 4 for 3/FREE POISON 3 for 2 vs 6
> dmg/POISON 3 for 4/FREE MARK 2 for 2) — not a duplicate, a coincidence of
> both using the theme's single most common verb. Restricting the collision
> signal to kind sets of size ≥2 (the discriminating case) reproduces
> exactly pass 4/5's own two hits and no others: `thin-hymn`/`alms-of-breath`
> (`rider,sway`) and `the-last-assize`/`the-vein-called-in`
> (`deal,overkill,recoil,wrath`) — both still the documented starter-echo/
> apocrypha-escalation design, re-confirmed not re-litigated; (3) pricing
> sanity + honesty — `pricing.engine.test.ts` (251), `curated-library.
> engine.test.ts` (14, the FREE-line law), `src/Combat/e2e/preview-truth.
> engine.test.ts` (10), `src/Combat/e2e/paid-summary-honesty.engine.test.ts`
> (4) all green, matching pass 5's counts exactly — noting for the record
> that the latter two live under `src/Combat/e2e/`, not `src/Cards/e2e/` (a
> path detail pass 4/5's prose didn't spell out; no drift, just a precise
> re-location for the next pass); (4) scale-ladder drift — spot-checked
> `axio_cards` samples at Rib and Saint rank against the CLAUDE.md §5 ladder
> (Rib single-hit 20-30/multi 7×4, Saint single-hit 45-70/multi 12×6): every
> sample landed in-band or above (`A Pound of Flesh` 30, `Pressed for a
> Plea` 7×4=28, `Every Wound Accounted` 12×6=72) except one deliberate case
> examined by hand — `Nothing to Report` (vigil, Saint) prints Deal 24
> alongside GUARD 40 (persists); its primary axis is GUARD, which sits
> correctly in Saint's 40-60 GUARD band, and Deal is a secondary rider on a
> card whose own theme module states its identity as "GUARD/BARRIER walls...
> payoffs for bloodless nights" — judged thematically honest, not a quietly-
> small bug, same "no governing objective function, competing verbs" reading
> pass 4/5 applied to rot's fed-payoff cards; (5) aspect-thirds — re-counted
> `philosophicalAspect` per theme module directly via fresh grep (rot 6/5/5,
> debt 5/6/5, grave 6/5/5, vigil 5/6/5, trial 7/7/6, choir 5/6/5
> body/heart/mind), byte-identical to pass 5's count — `deck-presets.
> engine.test.ts`'s pinned 5/5/5 preset law stays green, no theme starved of
> raw material. `axio_overview` reconfirmed the same 128-card/76-enemy/
> 24-effect/68-keyword-row counts pass 5 cited. Standing loop-calls
> re-checked against current source, not re-litigated: the 19 orphaned
> `zoneHas(state, '<card-id>')` hooks in `combat.engine.ts`
> (`plan/AUDIT.md`, filed pass 1, 2026-09-04) — re-verified all 19 named ids
> individually, each still hooked in the engine and still absent from
> `cardLibrary`/Haunts/Allies (fresh per-id grep, not a cached count); and
> `the-sextons-count`'s missing TWIN trigger (`plan/AUDIT.md`, filed pass 1,
> 2026-09-04) — `grave.cards.ts`'s `persistentEffect` text is byte-identical
> to the filed description, still correctly scoped as an engine-side
> variable-scope fix (`combat.engine.ts`'s twin/echo resolution) belonging
> to mechanics-expert, not card data. KB research: not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE),
> exempt from the gate per skill §3 Step 2 (REMOVE/no-op carve-out). Verify:
> ran all three gates in full this pass (not skipped, despite zero source
> diff) — `npm run verify --workspace axiomancer-mechanics` (212/212 files,
> 3418 tests + build, matching pass 5's count exactly), `npm run verify
> --workspace axiomancer-mobile` (lint/typecheck/jest all green, exit 0),
> `npm run type-check --workspace axiomancer-card-editor` (clean, exit 0);
> `npm run deploy:check` confirmed green pre-tick (HEAD `34e1d8d8`, no gated
> workflow triggered for the docs/plan-only tip commit) and will be
> re-confirmed after the ledger commit lands.
```

```
> **[adjust-npcs pass 5, 2026-09-10, commit 47bcda82]** One CREATE (The
> Ribbon-Picker, staged on The Capital), zero-UPDATE, zero-REMOVE. Unlike
> the sibling categories' zero-action pass-5 re-audits, this was NOT a
> stale-clean surface: `git log 6b365d01..HEAD --
> axiomancer-mechanics/src/NPCs axiomancer-mechanics/src/World/Continents`
> returns exactly one commit, `f56fa198` ("ship The Capital, map 5 of the
> northern continent — Phase W5") — real new territory, not the
> cards/equipment/enemies/keywords pass-5 ticks/audit-fixes/`/expand` pass
> that filled the other 14 of the 15 intervening commits. Re-audited every
> Step-1 signal directly against current source before deciding what was
> new vs. standing: (1) **the live finding** — The Capital
> (`Northern-Continent/maps.ts`'s `theCapital`) staged only `theHerald`
> despite being a 9-node, 6-column map (arrival / Herald singleton / a
> 3-lane hazard-rest-gathering column / a 2-lane market-loot-cache column /
> court-convenes singleton / The Factor climax singleton) — the Step-1
> "map with fewer than 2 staged NPCs → CREATE" signal, confirmed by direct
> read of the `npcs: [theHerald]` array, not inferred from the phase
> brief. Confirmed "The Factor" at `cap-9` is `capTheFactorBoss`, an
> `encounter`-kind enemy pool reusing `northern-city`'s boss (per the
> map's own header comment and a direct grep of `MapEvents/content.ts`),
> not a dialogue NPC — correctly out of this signal's scope. (2) standing
> `unstagedNpcs` backlog (`Coastal-Village/maps.ts`) — re-verified, not
> assumed: still exactly the same 4 (Tide-Shopkeeper, Village Healer,
> Dockworker's Union Leader, Merchant's Widow); confirmed each is present
> in the map's `npcs:` array (so `resolveInteraction` could find them by
> name) but that NONE of the four has a `MapEvents/content.ts` `interaction`
> payload naming them anywhere (fresh grep across the module) — the
> `unstagedNpcs` list exists precisely to suppress
> `auditNarrativeReachability`'s false-positive on that gap, and the gap
> itself is unchanged from pass 3/4's finding. `isShopkeeper` still has
> zero mobile consumers (fresh grep of `axiomancer-mobile/`), and while
> `axiomancer-mobile/app/rest/` and `state/presenters/rest.copy.ts` now
> exist (phases 47a/52d/52e/59/UI-cleanup landed since pass 1), a fresh
> `git log 6b365d01..HEAD` scoped to those exact rest paths is empty — no
> commit since pass 4 touched them, so the Village Healer's stated
> precondition ("place her once the rest rebuild has fully settled") is
> unchanged and re-confirmed, not stale-cited. (3) the standing
> `plan/AUDIT.md` `[needs-user-call]` row (filed pass 1, 2026-09-05) on
> `caverns`/`connecting-river`/`town-across-river`'s single-NPC maps —
> re-read directly: still open, still accurate (each singleton reads as
> the deliberate "guaranteed quest-giver" pattern per the maps' own header
> comments, no spec asks for a second voice), not re-litigated — this
> pass's CREATE went to The Capital's genuinely-new gap instead, which
> needed no personhood-design call (a minor reactive NPC, the Herald/
> Sweetheart precedent, not a new named protagonist). (4) dead-end
> dialogue / stale reference sweep — fresh script (not cached counts)
> across all 4 NPC-authoring files: 289 total `id:` node ids (up from
> pass 4's count, since The Capital's Herald tree + this pass's new
> Ribbon-Picker tree both landed since), 131 `nextNodeId` references, ZERO
> broken links; 10 distinct `startQuest` targets (9 pass-4 targets plus
> `get-to-the-capital`, added by the W5 commit, not this pass) all
> type-check clean against the live `QuestName` union; zero `teachCard`
> call sites (only the type declaration). (5) legacy flat `DialogueMap` —
> zero live usage confirmed again (only the type re-exports). (6) orphaned
> NPC sweep — 20 NPC consts now (19 at pass 4 + `theHerald`, shipped by
> W5, not orphaned — staged into `theCapital.npcs` from day one); every
> one resolves into exactly one map's `npcs`/`unstagedNpcs` array,
> confirmed by a fresh occurrence-count script, not carried over. (7)
> spec-to-NPC gap — no `specs/characters/` or `specs/story/` file changed
> since pass 4 (same empty git log range); `C-01-the-sophist.md` (Protas)
> remains correctly an enemy/Labyrinth entity, not an `NPCs`-module gap.
> **CREATE, shipped**: The Ribbon-Picker, a minor reactive NPC (not a
> named protagonist — within this skill's own Herald/Sweetheart
> precedent, no `character-spec` session needed) staged on `the-capital`
> at `cap-5` (the gathering node, "Refused petitions pile up against the
> wall, ribbons still tied to the corners") — she is the underside of The
> Herald's gatekeeper function: where the Herald checks a ribbon IN, she
> is what happens to one after the gate has already spent it, avoiding a
> duplicate-function NPC. Wired as a SECOND weighted `MapEventPoolEntry`
> on `cap-5`'s existing `capRibbonScraps` pool (gathering weight 3,
> interaction weight 1) rather than a new node or column — she is an
> occasional voice, not a second guaranteed singleton, and the gathering
> payload keeps its weight-3 majority so `getNodePrimaryEventKind`/the
> node's icon is unchanged. Her 4-node `DialogueTree`
> (`the-ribbon-picker`) carries a reactive branch gated on
> `sweetheart-was-nominated` (set at `tar-4` in town-across-river, strictly
> earlier in the campaign's own map order — the same flag `capCourtConvenes`
> already reads at `cap-8`), so she independently echoes the map's
> selection/ribbons theme from a different functional angle rather than
> repeating the Herald's own read of it. No new persisted flag, no
> `GAME_STATE_VERSION` migration — the flag she reads already exists. KB
> research (kb-query, the CREATE gate): run, missed. Searched
> `kb_search`/`kb_overview` across the full corpus (scope `all` and
> `boardgames`) for NPC/dialogue prior art — flavor vs. reactive minor-NPC
> design, market-town color, tribute/selection-ritual thematic treatment —
> with three query passes ("market|shop|vendor|flavor NPC",
> "NPC|non-player character|flavor text|narrative color",
> "bureaucra|clerk|tribute|selection ritual|lottery"); every hit was rules/
> mechanics (Arydia's NPC-interaction combat rule, Dominion/Ark Nova's card-
> market mechanic), nothing on dialogue-authoring craft or player reception
> of minor/reactive NPCs. A genuine miss, not skipped: filed
> https://github.com/no-trbl-2-u/game-knowledge-base/issues/79 (wishlist,
> requesting reception-corpus coverage of narrative-heavy digital RPGs —
> Disco Elysium/Pathologic 2/Hades/Undertale, the precedents this repo's
> own `content-curator.md` already names). Naming: `theRibbonPicker`/
> `ribbonPickerTree`/"The Ribbon-Picker" checked for collision (zero hits
> in a repo-wide grep) before writing; `node scripts/check-naming-law.mjs
> --sweep` stayed clean (204 shipped ids) both before and after — the
> `--kind=` flag form this skill's own doc describes was repealed
> 2026-09-02 (display names are no longer linted, per the script's own
> header), so the sweep form is what actually runs today. `npm run
> lint:prose` (14 content surfaces) and `npm run lint:names` (204 ids)
> both clean on the new tree. Test: added a hermetic e2e
> (`MapEvents/e2e/content.engine.test.ts`, 4 new cases inside a scoped
> "the capital — cap-5, The Ribbon-Picker" describe block; extended that
> file's `AuthoredMap`/`CONTINENT_OF` to include `the-capital`, previously
> absent from that suite's coverage entirely — a pre-existing W5 gap, left
> otherwise unbackfilled as out of this pass's scope) asserting: gathering
> keeps its weight-3 primary kind at rng=0.5; a high roll (rng=0.9) draws
> the weight-1 interaction entry and resolves her name + dialogue tree id;
> she's rostered alongside The Herald (clearing the ≥2-staged-NPCs floor);
> and her `sweetheart-was-nominated`-gated choice is present and points at
> `recognized`. Verify: green — `npm run verify --workspace
> axiomancer-mechanics` (212/212 files, 3418 tests + build), `npm run
> verify --workspace axiomancer-mobile` (lint/typecheck/jest all green,
> exit 0). `npm run deploy:check` confirmed green after push.
```

```
> **[adjust-keywords pass 5, 2026-09-10, commit 17b38058]** One UPDATE (a
> real wiring backfill, not a comment fix), zero-CREATE, zero-REMOVE — full
> re-audit, not a rubber stamp of pass 4's findings. `git log
> 9e423a34..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` is empty (the 15 commits
> since pass 4 were entirely the cards/equipment/enemies pass-5 ticks, a
> World ship, two `/audit`-fix ticks, a `combat-round-e2e` test extension,
> and an `/expand` pass — nothing touched the keyword-registry surface),
> so every Step-1 signal was re-derived by direct enumeration/script
> against the current tree rather than assumed stale-clean, same
> discipline as the sibling categories' own pass-5 re-audits: (1) registry
> row-count parity — `axio_keywords` still returns exactly 68 rows
> (unchanged from pass 4, confirmed via a fresh call) and `axio_overview`
> confirms the same 128-card / 76-enemy / 24-effect counts the sibling
> passes counted today; (2) full carrier-count sweep — re-ran a fresh
> `grep -oE "kind: '[a-zA-Z_]+'"` across all 9 `src/Cards/library/
> *.cards.ts` modules for every literal `kind:` occurrence (not trusting
> pass 3/4's cached numbers; the pattern also picks up the turn-shape
> `SynergyStatePredicate` family, which shares the same JSON key — expected,
> not a bug, since `opening`/`finale`/`flow`/`requiem` are their own
> registry keywords carried on a different card field): the same 9
> zero-carrier `CardSpecialMechanic` kinds pass 3/4 found
> (`strip_random_buff`, `befriend_attempt`, `refresh_die`,
> `convert_die_color`, `overheat`, `forge_floating_die`, `float_x_die`,
> `spend_all_pips`, `echo_next_spell`) remain at zero and stay
> `KINDS_WITHOUT_MECHANIC_KEYWORD`-exempt in
> `axiomancer-mobile/state/combat/__tests__/keywords.test.ts`; no new
> carrier-count regression below the atlas's own "≥2 cards or ≥2 enemies"
> floor for any badged keyword (`chain`/`omen`/`opening`/`finale`/
> `rupture`/`turnabout` all still exactly 2); (3) `CardSpecialMechanic`
> kind ↔ card-editor `SPECIAL_MECHANIC_KINDS` parity — wrote a throwaway
> script extracting both 50-member sets programmatically (not eyeballing)
> and diffing sorted arrays: IDENTICAL, no drift since pass 3's manual
> count (which had mis-stated the total as 49; the real, freshly-counted
> figure is 50 on both sides — a counting-note fix, not a registry fix).
> (4) "Known drift" section re-checked against current source: POISON/
> BLEED/DOOM `damagePerRound` in `debuffs.library.json` are still 2/3/1
> (overhaul §5.2's ×3-4 rescale has not landed) and `CAPITULATE_MIN` in
> `src/Combat/effects.ts` still floors RELENT at 10, not overhaul §5.4's
> "min 20" — both re-confirmed still accurate and still an engine-
> constant/effects-data rescale out of this skill's card-shaped scope, left
> untouched matching pass 1-4's own judgment, not re-filed. (5) **a
> genuine new finding, not flagged by any of passes 1-4** — traced the
> keyword-glyph wiring checklist's own claim that "the glyph table is
> hand-synced in THREE places (mobile glyphShapes, editor CardFace.tsx,
> scripts/build-catalog.mjs)" all the way through the card-editor leg,
> which no prior pass had actually exercised (they only checked the
> `SPECIAL_MECHANIC_KINDS` *contract* file, never the editor's own face-
> preview *projection*): `axiomancer-card-editor/src/components/
> CardFace.tsx`'s `primaryKeyword()` switches on
> `card.specialMechanics[0].kind` to pick the glyph + PAID badge, and its
> switch had NO case for `deal`, `recoil`, `recoil_x`, `immolate`, or
> `purge_self` — all four (`damage`/`recoil`/`immolate`/`purge`) already
> have a `KEYWORDS` entry in `axiomancer-card-editor/src/theme/wx.ts`, so
> this was a pure mapping omission, not a missing keyword. Quantified
> real impact with a throwaway ts-node script over the live `cardLibrary`
> (not a guess): `deal` is `specialMechanics[0]` on **50 of 128 cards
> (39% of the whole library)** — every DEAL-led card (the entire "strike
> is alive" damage family, THE BIG NUMBERS REWRITE's headline verb) fell
> through the switch's `default:` arm to the generic CONTROL clock glyph
> with no value shown, in the editor's own CREATE/EDIT authoring preview
> (`CardFace` is mounted live in both `EditTab.tsx` and `CreateTab.tsx`,
> not dead code); `recoil` (8), `immolate` (6), `purge_self` (5), and
> `recoil_x` (1) added another 20 mis-glyphed cards (77/128, 60% of the
> library, mis-glyphed total). Confirmed this was glyph-only, never a
> wrong-NUMBER bug: `paidSentence()` always composes the printed prose
> through the real engine (`toCombatCard`), never through
> `primaryKeyword()`'s heuristic — so `paid-summary-honesty.engine.test.ts`
> (mechanics) had no visibility into this, and no player-facing surface was
> ever affected (mobile's `combat.cards.ts` already has correct `case`
> arms for all five kinds, confirmed by direct grep — this was purely an
> editor-tool preview regression). Checked DEAL specifically against
> mobile's own `KINDS_WITHOUT_MECHANIC_KEYWORD` list before fixing it —
> `deal` IS deliberately exempt there too, by design ("DEAL is the one verb
> that needs no explaining... the face prints the number in its hero slot
> rather than badging the word"), so this is NOT reopening a closed design
> call: mobile's exemption is about not printing the WORD "DEAL" as a
> badge, and the editor's `wx.ts` `damage` entry serves a different job —
> the top-left CATEGORY GLYPH icon (direct/dot/control/defense/recovery/
> special) that classifies the card at a glance while browsing/authoring,
> which every other verb family already gets. SHIPPED as an UPDATE
> (backfill, not a new keyword): added the five missing cases in
> `CardFace.tsx`'s `primaryKeyword()`, each mapping to its EXISTING
> `wx.ts` `KEYWORDS` entry (no new vocabulary row). Left two smaller,
> deliberately-scoped gaps documented in a code comment rather than
> force-fixed this pass: `rider` (5 cards) wraps an arbitrary `CardRider`
> and needs the same field-by-field dispatch `freeKeyword()` already does
> for the FREE line — a real refactor, not a one-line backfill, and
> mobile's own list independently exempts `rider` too ("a carrier, not a
> mechanic"), so leaving it generic in the editor matches the established
> cross-surface stance rather than contradicting it; `reroll_spent` /
> `bank_spent_die` (1 card each) are die-gear/card-local kinds with no
> `KEYWORDS` entry of their own, consistent with the same exemption
> `KINDS_WITHOUT_MECHANIC_KEYWORD` already grants them on the mobile badge
> surface, not a regression. Added a hermetic regression test
> (`axiomancer-card-editor/src/components/__tests__/CardFace.test.ts`, 6
> cases) asserting the five fixed projections AND asserting the `rider`
> residual still falls through to `control` (so a future fix updates the
> test instead of silently drifting). KB research (kb-query): not run —
> this finding is pure internal wiring-parity (an existing atlas keyword's
> editor-side glyph mapping), not a new or reinterpreted keyword semantic,
> so it carries no design content requiring Dawncaster prior art; exempt
> per skill §3 Step 2 in the same spirit as the REMOVE/no-op carve-out
> (no CREATE, no semantic UPDATE to an atlas row — the atlas rows for
> DEAL/RECOIL/IMMOLATE/PURGE are unchanged and accurate already). Atlas:
> no row edit needed (the atlas already correctly lists all four as live
> keywords with accurate reminder text; the bug was purely in a downstream
> consumer, not the registry itself). Verify: green —
> `npm run verify --workspace axiomancer-mechanics` (212/212 files, 3414
> tests + build), `npm run verify --workspace axiomancer-mobile` (260/260
> suites, 2646 tests, lint/typecheck clean), `npm run type-check --workspace
> axiomancer-card-editor` (clean) plus `npx vitest run` in that package
> (18/18, including the new `CardFace.test.ts`), root `npm test` (123/123
> incl. `content-drift.test.mjs`).
```

```
> **[adjust-enemies pass 5, 2026-09-10, commit ce6e6a60]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 4's findings. `git log 84be1db4..HEAD -- axiomancer-mechanics/src/Enemy
> axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World`
> is empty (the 16 commits since pass 4 were entirely the cards/equipment
> pass-5 ticks, the npcs/keywords pass-4 ticks, two audit-fix ticks, an
> `/expand` pass, and a digest — nothing touched the enemy/enemy-deck/
> enemy-art/world surface), so every Step-1 signal was re-derived directly
> against the current tree by fresh script/enumeration rather than assumed
> stale-clean, same discipline as the sibling categories' own pass-5
> re-audits: (1) orphan sweep — re-extracted all 77 `enemy.library.ts`
> consts programmatically: 77/77 resolve into `ENEMY_REGISTRY`, 75/77 into
> some `EnemiesByMap` pool, the same 2 deliberate exclusions
> (`Sandbag_01` test fixture, `TheIncompleteness` playtest ceiling) as
> every prior pass — no new orphan; (2) roster-size floor / sibling-overlap
> sweep — recomputed all 9 pool sizes and every pairwise overlap fresh
> (fishing-village 13, northern-forest 39, caverns 16, northern-city 8,
> connecting-river 5, town-across-river 4, aporia-colonnade/archive 8 each,
> aporia-proof 11): the same four >70% pairs recur, all Aporia-vs-forest
> (87.5%/87.5%/90.9%) or Aporia-vs-caverns (75.0%) — re-confirmed as the
> labyrinth's own documented deliberate-reuse design (`enemy.library.ts`'s
> `EnemiesByMap` comment block), not new drift; connecting-river/
> town-across-river remain the two smallest raw pools but no `World` file
> changed since pass 3 (empty git log, re-confirmed), so the W4 phase
> brief's density-normalized pacing-choice conclusion (pass 3) stands
> unchallenged, not re-litigated without new evidence; (3) deck sweep — a
> fresh script cross-checked all 90 `ENEMY_DECKS` keys (both flat and
> `TieredEnemyDeck` shapes) against the 77 `ENEMY_REGISTRY` slugs (0 keys
> unmatched) and all 157 distinct card-id references against
> `ENEMY_CARD_LIBRARY`'s 157 ids (0 missing); the 4 distinct `effectId`s
> (`debuff_mark`, `debuff_bleed`, `debuff_poison`, `debuff_creeping_doom`)
> and 4 distinct `curseCardId`s (`overheard-name`, `arrears`,
> `mouthful-of-brine`, `gnaw-marks`) all re-verified present in
> `debuffs.library.json` / `starters.cards.ts`'s curse set — same 4/4 and
> 4/4 as pass 4, no dead reference; (4) portrait sweep — 75 `portraitAsset`
> values re-extracted, zero duplicates, all 75 resolve 1:1 into
> `axiomancer-mobile/assets/images/enemies/index.ts`'s registry, and every
> required `.webp` file confirmed present on disk — clean; (5) VITAE-band
> sweep — 21 explicit `vitae:` overrides, same count as pass 4, and
> `enemy.library.ts` is byte-identical since `84be1db4` so the
> worst-deviation figure (ElderFireGiant +25.7%, inside the ~±26%
> tolerance band) stands unchanged; (6) aftermath-prose/voice sweep — zero
> `\b(thee|thou|thy|thine|ye)\b` matches (case-insensitive) anywhere in
> `enemy.library.ts`, 45 `finalBlowLines` carriers, matching pass 4 exactly
> (32 enemies still lack one — the known backlog filed pass 1,
> `plan/AUDIT.md` `[content]`, out of this skill's scope, re-cited not
> re-filed); (7) loot-table sweep — re-extracted all 22 distinct `drop()`
> ids from `enemy.library.ts` and diffed against all 22 ids in
> `Items/consumable.library.ts` — empty diff, exact 1:1 resolve;
> `loot.ts` itself still carries no hardcoded item ids (pure weighted-roll
> logic). No keyword was retired by `/adjust-keywords` pass 4 (its only
> change was a stale-comment fix, confirmed by reading its own ledger
> entry), so no enemy deck references a dead keyword either. KB research:
> not run — every consideration this pass was audit-confirmed-clean (no
> CREATE/UPDATE), exempt from the gate per §3 Step 2 (REMOVE/no-op
> carve-out). Verify: not re-run — no source file changed
> (`git status` clean on `axiomancer-mechanics/src`,
> `axiomancer-mobile/`); the last mechanics-source-path commit
> (`2028bb64`) shows `verify-mechanics` green and `verify-mobile` green
> via `gh run list`, and no mechanics/mobile source commit has landed
> since — confirmed current via `npm run deploy:check` immediately before
> this tick began.
```

```
> **[adjust-equipment pass 5, 2026-09-10, commit 2b02ff60]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 4's findings. `git log 9a2bc248..HEAD -- axiomancer-mechanics/src/Items
> axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` is empty (the 16 commits since pass 4
> were entirely the cards-pass-5 tick and unrelated merges — nothing
> touched the equipment/consumable/shop/signature surface), so every
> Step-1 signal was re-derived directly against the current tree: (1)
> dominated relics — re-read all 8 off `relic.library.ts`: 2 weapons tie at
> body+2, 2 armor tie at maxHp+5, 4 accessories split mind+2/mind+2/
> heart+2/heart+2, every same-slot pair differs only by `grantsSignature`,
> no strictly-dominated pair; (2) `grantsSignature` drift — all 8 relic
> values diffed against the live `SignatureSkillId` union in
> `combat.encounter.types.ts` (still 8 members, 1:1 match, no
> rename/removal); (3) dead consumable `effectId`s — re-extracted all 11
> non-heal-only ids from `consumable.library.ts` and checked each against
> `buffs.library.json`/`debuffs.library.json` by id, all 11 resolve; (4)
> shop-pool / reward-table coverage — re-enumerated all 6 `shop.wares`
> blocks in `World/MapEvents/content.ts` (unchanged count) and confirmed
> `rollCacheReward` still draws uniformly from the full 22-entry
> `consumableLibrary` with no allow-list, so no consumable is
> acquirable-nowhere; (5) `AccessoryKind` gap — head/hands/feet remain at
> zero live relics, same standing `[loop-call]` (`plan/AUDIT.md`,
> 2026-09-04) re-read and reconfirmed still accurate and still an
> owner/mechanics-expert call, no new development against it this pass. KB
> research: not run — every consideration this pass was audit-confirmed-
> clean (no CREATE/UPDATE), exempt from the gate per §3 Step 2 (REMOVE/
> no-op carve-out). Verify: not re-run — no source file changed; HEAD's
> existing green (mechanics + mobile) stands, confirmed by `npm run
> deploy:check` moments before this tick began.

> **[adjust-cards pass 5, 2026-09-10, commit 35c4c56c]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit via `card-expert` (consult+
> implement mode), not a rubber stamp of pass 4's findings. `git log
> 3b092183..HEAD -- axiomancer-mechanics/src/Cards axiomancer-mechanics/
> src/Effects axiomancer-mechanics/src/Combat` is empty (the 19 commits
> since pass 4 were entirely the equipment/enemies/keywords/npcs pass-4
> ticks, a fixture-gallery feature, and unrelated merges — nothing touched
> the card/effect/combat surface), so every Step-1 signal was re-derived
> against the current tree: (1) reachability —
> `combat-playtest.card-coverage.sim.test.ts` run directly: 123/123
> playable cards (the 128-card `cardLibrary` minus 5 enemy-injected curses)
> still fire in at least one fallback seed, no dead-card candidate; (2)
> near-duplicates — full same-(theme,rank,`philosophicalAspect`) collision
> scan over the live `cardLibrary` export: the two identical-kind-set
> collisions already documented by pass 4 (`thin-hymn`/`alms-of-breath` —
> the starters-as-authoring-template echo; `the-last-assize`/
> `the-vein-called-in` — debt capstone vs. its apocrypha escalation) still
> stand as deliberate design, no new accidental duplicate found; (3)
> pricing sanity + face-honesty — `pricing.engine.test.ts` (251),
> `paid-summary-honesty.engine.test.ts` (4), `preview-truth.engine.test.ts`
> (10), `curated-library.engine.test.ts` (14, the FREE-line law) all green,
> plus a fresh one-off script cross-checking every card's `deal` amount sum
> against its `paidSummary` prose across all 9 `library/*.cards.ts` files —
> zero real mismatches (a few regex false-positives from phrasing
> variance, same number either way); (4) scale-ladder drift — manual read
> of `rot.cards.ts`, `relics.cards.ts`, `apocrypha.cards.ts`,
> `starters.cards.ts` in full plus every debt/grave/vigil/trial/choir card
> via `axio_cards`: numbers sit inside the CLAUDE.md §5 ladder for their
> apparent rank, no card quietly small; (5) aspect-thirds — re-counted
> `philosophicalAspect` per theme module directly (rot 6/5/5, debt 5/6/5,
> grave 6/5/5, vigil 5/6/5, trial 7/7/6, choir 5/6/5, apocrypha 4/4/4,
> starters 2/3/3 body/heart/mind) — no theme starved of raw material
> relative to its other two, the pinned preset 5/5/5 thirds draw cleanly.
> Standing loop-calls re-checked, not re-litigated: the AMBUSH/FINALE and
> CHAIN/OMEN routing rows stay `[x]`-resolved (passes 2-3); the one
> still-open card-adjacent row (`the-sextons-count` missing its TWIN
> trigger, `plan/AUDIT.md`, filed 2026-09-04) is explicitly mechanics-expert
> territory (an engine-side variable-scope fix inside
> `combat.engine.ts`'s twin/echo resolution, not card data) — left
> untouched and re-flagged, not actioned, matching prior passes' own
> boundary call. KB research: not run — every consideration this pass was
> audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per §3
> Step 2 (REMOVE/no-op carve-out). Verify: not re-run in full — no source
> file changed (`git status` clean on `axiomancer-mechanics/src`); ran the
> direct confirmation set instead (the four suites above, all green) and
> confirmed HEAD's existing CI green via `npm run deploy:check`
> (`715351d4`'s tick had no gated workflow triggered — a docs/plan-only
> commit — so the prior verify-mechanics/verify-mobile runs on the last
> source-touching commit stand as the live green).
```

```
> **[adjust-npcs pass 4, 2026-09-09, commit 6b365d01]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 3's findings. `git log ba524879..HEAD -- axiomancer-mechanics/src/NPCs
> axiomancer-mechanics/src/World/Continents` is empty (the 17 commits since
> pass 3 were entirely the cards/equipment/enemies/keywords pass-4 ticks, a
> critique pass, two audit-fix ticks, an `/expand` pass, and a digest —
> nothing touched the NPC/dialogue surface), so every Step-1 signal was
> re-derived by direct enumeration against the current tree rather than
> assumed stale-clean, same discipline as the sibling categories' own
> pass-4 re-audits: (1) unstaged-NPC backlog — re-read `Coastal-Village/
> maps.ts`'s `unstagedNpcs` block directly: still exactly the same 4
> (Tide-Shopkeeper, Village Healer, Dockworker's Union Leader, Merchant's
> Widow); re-verified each reason against current source rather than
> trusting the prior pass's note — `isShopkeeper` still has zero mobile
> consumers (fresh grep of `axiomancer-mobile/`, zero hits), no commit
> since pass 3 touched `axiomancer-mobile/app/rest/`, `state/rest/`, or
> `state/presenters/rest.engine.ts` (empty git log), and no
> settlement-screen surface exists anywhere in `axiomancer-mobile` — all
> four reasons still hold verbatim. (2) map-with-<2-staged-NPCs signal —
> direct enumeration of `Northern-Continent/maps.ts`'s four `npcs:` arrays
> reconfirms `caverns` (theDelver only), `connecting-river` (theBoatwoman
> only), and `town-across-river` (theSweetheart only) each still carry
> exactly 1 rostered NPC (northern-city carries 2: theGateClerk +
> theShipwright, clearing the bar); the standing `plan/AUDIT.md`
> `[needs-user-call]` row (filed pass 1, 2026-09-05) is unchanged and left
> open as filed — no new evidence to re-litigate a personhood-design call
> this autonomous tick can't make (hard rule 3). (3) dead-end dialogue
> nodes / stale `effect` references — no source file changed since pass 3,
> so pass 3's cross-check still holds verbatim; re-ran a fresh throwaway
> script cross-referencing every `id:` node and `nextNodeId:` reference
> across `Coastal-Village/npcs.ts`, `Northern-Forest/npcs.ts`, and
> `Northern-Continent/maps.ts` (224 ids, 111 `nextNodeId` refs) — zero
> broken links; all 9 distinct `startQuest` targets still type-check clean
> against the live `QuestName` union (a stale target fails compilation, not
> a silent no-op); zero `teachCard` call sites anywhere in the authored
> NPC/map tree (only the type declaration itself). (4) legacy flat
> `DialogueMap` — zero live usage confirmed again (`DialogueMap` only
> appears in `src/index.ts`/`src/NPCs/index.ts`'s type re-exports, not on
> any authored NPC). (5) spec-to-NPC gap — `specs/characters/C-01-the-
> sophist.md` (Protas) remains correctly implemented as the Aporia's
> act-boss enemy + Labyrinth narration, not an `NPCs`-module dialogue
> entity — still out of this skill's scope by design; no spec file under
> `specs/story/` or `specs/characters/` changed since pass 3 (confirmed via
> the same empty git log range). (6) orphaned NPC — zero; re-verified all
> 19 authored NPC consts (5 in `Northern-Continent/maps.ts`, 6 in
> `Northern-Forest/npcs.ts`, 3 flavor NPCs in `Coastal-Village/maps.ts`, 5
> in `Coastal-Village/npcs.ts` including the 4 unstaged ones) each still
> resolve into exactly one map's `npcs`/`unstagedNpcs` array. KB
> (kb-query): not run — every consideration this pass was either
> audit-confirmed-clean (no CREATE/UPDATE) or a re-check of a standing
> filed row, exempt from the gate per the skill's own rule (§3 Step 2 /
> hard rule 7, REMOVE-adjacent no-op carve-out). Verify: not re-run in
> full — no source file changed (`git status` clean on
> `axiomancer-mechanics/src`, `axiomancer-mobile/`); ran the direct
> confirmation set instead (`vitest run` on
> `src/NPCs/e2e/story-npcs.engine.test.ts` 36/36,
> `src/NPCs/e2e/dialogue.engine.test.ts` 18/18,
> `src/World/Continents/e2e/continents.engine.test.ts` 28/28,
> `src/World/e2e/narrative-reachability.engine.test.ts` 24/24,
> `src/World/narrative-reachability.test.ts` 5/5,
> `src/World/MapEvents/e2e/nf-21-nf-14-npc-staging.engine.test.ts` 4/4 —
> 115/115 green) and confirmed HEAD's existing CI is green via
> `npm run deploy:check`.
```

```
> **[adjust-keywords pass 4, 2026-09-09, commit 9e423a34]** Updated 1
> (stale comment), zero-CREATE, zero-REMOVE pass — full re-audit, not a
> rubber stamp of pass 3's findings. `git log fe49681e..HEAD --
> axiomancer-mechanics/src/Cards axiomancer-mechanics/src/Effects
> axiomancer-mechanics/src/Combat axiomancer-mechanics/docs/keyword-atlas.md
> docs/retheme-map.json axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` is empty (the 17 commits
> since pass 3 were entirely the cards/equipment/enemies pass-4 ticks, the
> npcs pass-3 ledger tick, two unrelated `/critique`+`/audit` fixes, and an
> `/expand` digest — nothing touched the keyword-registry surface), so every
> Step-1 signal was re-derived by direct enumeration against the current
> tree rather than assumed stale-clean, same discipline as the sibling
> categories' own pass-4 re-audits: (1) row-count parity — `axio_keywords`
> still returns exactly 68 rows (unchanged from pass 3, confirmed via a
> fresh call, not a cached number) and `axio_overview` confirms the same
> 128-card library pass-4 `/adjust-cards` counted; (2) carrier-count sweep —
> re-ran a fresh `grep -o "kind: '[a-z_]*'"` across all 9
> `src/Cards/library/*.cards.ts` modules for every live `kind:` literal (not
> trusting pass 3's cached counts): CHAIN/OMEN/opening(AMBUSH)/finale
> (FINALE)/rupture/turnabout all still sit at exactly 2 carriers each, no
> regression below the atlas's own "≥2 cards or ≥2 enemies" floor; `reap`,
> `bank_spent_die`, `grant_pip`, `reroll_spent`, `consume_affliction`,
> `convert_dots`, `spend_premises` each still sit at 1 (all already
> classified in `KINDS_WITHOUT_MECHANIC_KEYWORD` as sharing a healthy
> umbrella keyword or exempt card-local one-offs — no new drift); the 9
> die-gear/card-local zero-count kinds from pass 3 remain zero-count and
> exempt. (3) loop-call closure re-check — `plan/AUDIT.md`'s AMBUSH/FINALE
> row is `[x]`-RESOLVED via `/adjust-cards` pass 3 (`df4036fc`) and stays
> resolved (2 carriers each, confirmed under signal 2 above); no other open
> `[loop-call]`/`[needs-user-call]` row is filed against this category. (4)
> "Known drift" section re-checked against current source, not assumed
> accurate: POISON/BLEED/DOOM `damagePerRound` in `debuffs.library.json`
> are still 2/3/1 (the overhaul's §5.2 x3-4 rescale has not landed) and
> RELENT's resolve threshold (`CAPITULATE_RESOLVE_FRACTION = 0.35`,
> `CAPITULATE_MIN = 10` in `src/Combat/effects.ts`) still floors at 10, not
> the overhaul's §5.4 "min 20" — both re-confirmed still accurate and still
> engine-constant/effects-data rescales out of this skill's card-shaped
> scope (per its own handoff boundary), left untouched matching pass 1-3's
> judgment, not re-filed. (5) a genuine new finding, NOT flagged by any
> prior pass — a stale keyword-mapping comment: `axiomancer-mobile/
> state/combat/keywords.ts`'s `MECHANIC_KEYWORD` module doc (written
> 2026-07-11, phase 29) claimed `conjure_card` was "DELETED (CONJURE
> retired — zero library cards)". That was true when written, but THE BIG
> NUMBERS REWRITE (2026-09-02, commit `ed6b1be3`) authored Grave Goods
> (`grave.cards.ts`) carrying `{ kind: 'conjure_card', cardId: 'ht-cinder' }`
> — a real, live, shipped library card — without the comment ever being
> updated, and three prior `/adjust-keywords` passes (1, 2, 3) missed it.
> Verified this is NOT a player-facing bug: `combat.cards.ts`'s
> `mechanicText` has no `case 'conjure_card':` (falls to `default: return
> null`), but the card's authored `paidSummary` already describes the
> effect in plain prose ("Conjure a Cinder into your hand.", no ALL-CAPS
> word), so nothing prints an undefined badge and
> `paid-summary-honesty.engine.test.ts` stays green (no generated numbers
> to reconcile). `conjure_card` is also already correctly listed in
> `axiomancer-mobile/state/combat/__tests__/keywords.test.ts`'s
> `KINDS_WITHOUT_MECHANIC_KEYWORD` under the accurate "atlas's own ≥2-cards
> discipline" reasoning (that file was never wrong) — only the JSDoc prose
> in `keywords.ts` itself carried the stale "zero library cards" claim.
> Fixed the comment to state the current, accurate carrier count (1) and
> the current, accurate reason it stays unbadged (below the ≥2 floor, not
> "zero cards"), dated and attributed to this pass. No semantics, no test,
> no atlas-row change — CONJURE was never a registered keyword before or
> after this fix (phase 29 retired it as a badge before the atlas's current
> structure existed, so there is no atlas "Retired" entry to add). Exempt
> from the KB research gate as a pure comment-accuracy fix, no semantics
> changed — same carve-out pass 2 used for the RUPTURE gloss fix. KB
> research (kb-query): not otherwise run this pass — every other
> consideration was audit-confirmed-clean (no CREATE/UPDATE beyond the
> exempt comment fix), exempt per skill §3 Step 2 (REMOVE/no-op carve-out).
> Verify: green — `npm run verify --workspace axiomancer-mechanics`
> (212/212 files, 3400 tests + build), `npm run verify --workspace
> axiomancer-mobile` (lint/typecheck/jest all green), `npm run type-check
> --workspace axiomancer-card-editor` (clean), root `npm test` 123/123 incl.
> `content-drift.test.mjs`.
```

```
> **[adjust-enemies pass 4, 2026-09-09, commit 84be1db4]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 3's findings. `git log 5693d6db..HEAD -- axiomancer-mechanics/src/Enemy
> axiomancer-mechanics/src/Combat/combat.enemy-decks.ts
> axiomancer-mechanics/src/Combat/combat.enemy-cards.ts
> axiomancer-mobile/assets/images/enemies axiomancer-mechanics/src/World`
> is empty (the 19 commits since pass 3 were entirely the cards/equipment/
> keywords/npcs pass-3-and-4 ticks, a fixture-gallery feature, and
> unrelated merges — nothing touched the enemy/enemy-deck/enemy-art/world
> surface), so every Step-1 signal was re-derived against the current tree
> rather than assumed stale-clean, same discipline as the sibling
> categories' own pass-4 re-audits: (1) orphan sweep — all 77
> `ENEMY_REGISTRY` slugs re-enumerated directly off `enemy.library.ts`,
> same 2 deliberate fixture/ceiling exclusions (`sandbag`,
> `the-incompleteness`), all 9 `EnemiesByMap` pools re-read in full — no
> new orphan; (2) deck sweep — re-extracted the 4 distinct enemy-card
> `effectId`s (`debuff_bleed`, `debuff_creeping_doom`, `debuff_mark`,
> `debuff_poison`, all present in `debuffs.library.json`) and the 4
> distinct `curseCardId`s (`arrears`, `overheard-name`,
> `mouthful-of-brine`, `gnaw-marks`, all present in
> `Cards/library/starters.cards.ts`'s curse set) from
> `combat.enemy-cards.ts`/`combat.enemy-decks.ts` — same 4/4 as pass 3, no
> dead reference; (3) portrait sweep — 75 `portraitAsset` values
> re-extracted, zero duplicates (`sort | uniq -d` empty), matching pass
> 3's 75/77 count exactly; (4) VITAE-band sweep — 21 explicit `vitae:`
> overrides, same count as pass 3, and the source file is byte-identical
> since 5693d6db so the worst-deviation figure (ElderFireGiant +25.7%,
> inside tolerance) stands unchanged; (5) aftermath-prose/voice sweep —
> zero `\b(thee|thou|thy|thine|ye)\b` matches (case-insensitive) anywhere
> in `enemy.library.ts`, 45 `finalBlowLines` carriers, matching pass 3
> exactly; (6) loot-table sweep — re-extracted all 22 distinct `drop()`
> ids from `enemy.library.ts` and diffed against all 22 ids in
> `Items/consumable.library.ts` — empty diff, exact 1:1 resolve; `loot.ts`
> itself still carries no hardcoded item ids (pure weighted-roll logic).
> Signal 1 (roster-size floor / >70% sibling overlap): no `World`/map file
> changed since pass 3 (confirmed via the same empty `git log` range
> above), so pass 3's density-normalized conclusion (connecting-river 5/14
> and town-across-river 4/7 read as authored pacing choices per
> `plan/phases/phase_W4_connecting_river.md`, not thinness; the four
> Aporia/northern-forest >70% pairs are the labyrinth's deliberate shared-
> roster design per `enemy.library.ts`'s own comment block) stands
> unchanged — re-cited, not re-litigated, since nothing that conclusion
> depended on moved. KB research: not run — every consideration this pass
> was audit-confirmed-clean (no CREATE/UPDATE), exempt from the gate per
> §3 Step 2 (REMOVE/no-op carve-out). Verify: not re-run — no source file
> changed; HEAD's existing green (mechanics + mobile) stands, confirmed by
> `npm run deploy:check` moments before this tick began.

> **[adjust-equipment pass 4, 2026-09-09, commit 9a2bc248]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 3's findings. `git log a3681576..HEAD -- axiomancer-mechanics/src/Items
> axiomancer-mechanics/src/World/MapEvents/content.ts
> axiomancer-mechanics/src/Combat/combat.encounter.types.ts
> axiomancer-mechanics/src/Effects` is empty (the 19 commits since pass 3
> were entirely the cards/enemies/keywords/npcs pass-3 ticks, a
> fixture-gallery feature, and unrelated merges — nothing touched the
> equipment/consumable/shop/signature surface), so every Step-1 signal was
> re-derived against the current tree rather than assumed stale-clean, same
> discipline as the sibling categories' own re-audits: (1) dominated relics
> — all 8 re-checked directly off `relic.library.ts` (2 weapons/body+2, 2
> armor/maxHp+5, 4 accessories split mind+2/heart+2), same-slot pairs share
> identical stat magnitude and differ only by `grantsSignature`, no
> strictly-dominated pair; (2) `grantsSignature` drift — all 8 relic values
> diffed against the live `SignatureSkillId` union in
> `combat.encounter.types.ts` (8 members, 1:1 match, no rename/removal);
> (3) dead consumable `effectId`s — re-extracted all 11 non-heal-only ids
> from `consumable.library.ts` and checked each against
> `buffs.library.json`/`debuffs.library.json` by id, all 11 resolve; (4)
> shop-pool / reward-table coverage — re-enumerated all 6 `shop.wares`
> blocks in `World/MapEvents/content.ts`: still exactly 8/22 consumables
> shop-stocked (`minor-healing-potion`, `healing-potion`, `antidote`,
> `clarity-serum`, `philosopher-tea`, `void-essence`, `body-elixir`,
> `focus-vial`), the other 14 still reachable via `rollCacheReward`'s
> uniform draw over the full `consumableLibrary` (confirmed the roller
> still imports the whole library, no allow-list), so none is
> acquirable-nowhere; (5) `AccessoryKind` gap — head/hands/feet remain at
> zero live relics, same standing `[loop-call]` filed 2026-09-04
> (`plan/AUDIT.md`) — still an owner/mechanics-expert call (a 9th
> signature skill needs designing first, and the lean relic shape's own
> identity rule — `grantsSignature !== undefined` — rules out a stat-only
> accessory as a workaround), no new development against it this pass. KB
> research: not run — every consideration this pass was audit-confirmed-
> clean (no CREATE/UPDATE), exempt from the gate per §3 Step 2 (REMOVE/
> no-op carve-out). Verify: not re-run — no source file changed; HEAD's
> existing green (mechanics + mobile) stands.

> **[adjust-cards pass 4, 2026-09-09, commit 3b092183]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 3's findings. `git log df4036fc..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat` is empty
> (19 commits since pass 3 were entirely the equipment/enemies/keywords/npcs
> pass-3 ticks, a fixture-gallery feature, and unrelated merges — nothing
> touched the card/effect/combat surface), so every Step-1 signal was
> re-derived against the current tree rather than assumed stale-clean, same
> discipline as the sibling categories' pass-3 re-audits: (1) reachability —
> ran `combat-playtest.card-coverage.sim.test.ts` directly: 123/123 playable
> cards (the 128-card `cardLibrary` minus the 5 enemy-injected curses) still
> fire in at least one of the three fallback seeds, so no dead-card candidate;
> (2) near-duplicates — wrote a fresh same-(theme,rank,philosophicalAspect)
> collision scan over the whole live library via `getCardById`'s own
> `cardLibrary` export (not just the 4 modules pass 3 hand-checked), grouping
> every non-starter/relic/curse card and diffing `specialMechanics` kind sets
> per group: ~30 same-key groups found, all but two differed in kind
> composition (deliberate verb-family reuse, same shape pass 3 already
> judged non-actionable); the two identical-kind-set collisions both resolve
> to DOCUMENTED design, not accidental duplication — `thin-hymn` (Threadbare
> Office starter, `starters.cards.ts`) vs `alms-of-breath` (choir's live
> Ash-rank card) share `sway`+`rider` because `starters.cards.ts`'s own
> header names itself "the AUTHORING TEMPLATE for the six theme modules" that
> deliberately echoes each theme's rank-1 verb at whisper volume; and
> `the-last-assize` (debt's rank-6 capstone) vs `the-vein-called-in` (debt's
> apocrypha entry) share `recoil`+`deal`+`wrath`+`overkill` because
> `apocrypha.cards.ts`'s header states its twelve cards are explicitly "not
> the theme capstones... each one takes its theme's axis one turn past the
> point where the axis was still safe to carry" (20/70/5/per-5 vs
> 30/90/8/per-3+healPct — the escalation is the point); (3) pricing sanity +
> paid-summary/preview-truth honesty — `pricing.engine.test.ts` (251),
> `paid-summary-honesty.engine.test.ts` (4), `preview-truth.engine.test.ts`
> (10), `curated-library.engine.test.ts` (14, the FREE-line law) all green,
> no drift; (4) scale-ladder drift — summed every card's `deal` amount×hits
> per rank and spot-checked every below-band outlier by hand: all resolve to
> the documented "uncapped payoff prints its floor only" pattern already
> called out in `rot.cards.ts`'s and `apocrypha.cards.ts`'s own headers
> (`communion-of-the-worm`'s printed 30 is a RUPTURE ALL/SIPHON detonator
> documented at 150-250 fed; `the-feast-of-all-corruption`'s printed 20 is a
> self-fed POISON/FESTER/PROLONG/RUPTURE ALL chain documented at 200-400
> fed) — no card is quietly small, every low print is a fed payoff by
> design; (5) aspect-thirds — re-counted `philosophicalAspect` per theme
> module directly (rot 6/5/5, debt 5/6/5, grave 6/5/5, vigil 5/6/5, trial
> 7/7/6, choir 5/6/5 body/heart/mind) — all within 1 card of exact thirds,
> `deck-presets.engine.test.ts`'s pinned 5/5/5 preset law still green, no
> theme starved of raw material. Standing loop-calls re-checked, not
> re-litigated: AMBUSH/FINALE now both show 2 card carriers
> (`the-door-comes-down-first`, `nothing-further-your-honour` from pass 3
> confirmed still present) — the routing row stays `[x]`-resolved; the
> 19-orphaned-`zoneHas`-hooks and `the-sextons-count` TWIN loop-calls
> (`plan/AUDIT.md`, filed pass 1, 2026-09-04) remain open and
> mechanics-expert-owned — no new development against either this pass. KB
> research: not run — every consideration this pass was audit-confirmed-clean
> (no CREATE/UPDATE), exempt from the gate per §3 Step 2 (REMOVE/no-op
> carve-out). Verify: green (mechanics 212/212 files · 3400 tests + build;
> mobile lint/typecheck/jest all green including the new fixture-gallery
> suites; card-editor type-check clean); `npm run deploy:check` confirms
> HEAD's CI green after the ledger commit lands.
```

```
> **[adjust-npcs pass 3, 2026-09-08, commit ba524879]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 2's findings. `git log 570cc566..HEAD -- axiomancer-mechanics/src/NPCs
> axiomancer-mechanics/src/World/Continents` is empty (25 commits since pass
> 2 were entirely the cards/equipment/enemies/keywords pass-3 ticks plus
> unrelated work; nothing touched the NPC/dialogue surface), so every
> Step-1 signal was re-derived by direct enumeration against the current
> tree rather than assumed stale-clean, same discipline as the
> cards/equipment/enemies/keywords pass-3 re-audits: (1) unstaged-NPC
> backlog — re-read `Coastal-Village/maps.ts`'s `unstagedNpcs` block
> directly: still exactly the same 4 (Tide-Shopkeeper, Village Healer,
> Dockworker's Union Leader, Merchant's Widow); re-verified each reason
> against current source rather than trusting the prior pass's note —
> `isShopkeeper` still has zero mobile consumers (fresh grep of
> `axiomancer-mobile/`, zero hits) and no commit since pass 2 touched
> `axiomancer-mobile/app/rest/`, `state/rest/`, or
> `state/presenters/rest.engine.ts` (empty git log), so the rest-rebuild
> precondition for homing the Village Healer still hasn't landed — all
> four reasons still hold verbatim. (2) map-with-<2-staged-NPCs signal —
> direct enumeration of `Northern-Continent/maps.ts`'s four `npcs:` arrays
> reconfirms `caverns` (theDelver only), `connecting-river` (theBoatwoman
> only), and `town-across-river` (theSweetheart only) each still carry
> exactly 1 rostered NPC (northern-city carries 2: theGateClerk +
> theShipwright, clearing the bar); the standing `plan/AUDIT.md`
> `[needs-user-call]` row (filed pass 1, 2026-09-05) is unchanged and left
> open as filed — no new evidence to re-litigate a personhood-design call
> this autonomous tick can't make (hard rule 3). (3) dead-end dialogue
> nodes / stale `effect` references — no source file changed since pass 2,
> so pass 2's cross-check (zero orphan nodes, zero broken `nextNodeId`
> links across all 19 authored NPCs) still holds verbatim; re-ran the
> direct confirmation instead of the full throwaway script: all 9 distinct
> `startQuest` targets across `Coastal-Village/maps.ts`,
> `Northern-Forest/npcs.ts`, and `Northern-Continent/maps.ts`
> (`starting-quest`, `get-to-forest`, `get-to-cave`, `gather-wood`,
> `get-to-northern-city`, `gather-iron`, `get-to-connecting-river`,
> `find-islanders`, `get-to-town-across-river`) type-check clean against
> the live `QuestName` union (a stale target fails compilation, not a
> silent no-op) and mechanics `tsc`/vitest are green; zero `teachCard`
> references anywhere in the authored NPC/map tree (only the runtime
> handler and the type declaration itself). (4) legacy flat `DialogueMap`
> — zero live usage confirmed again (`DialogueMap` only appears in
> `src/index.ts`/`src/NPCs/index.ts`'s type re-exports, not on any
> authored NPC). (5) spec-to-NPC gap — `specs/characters/C-01-the-
> sophist.md` (Protas) remains correctly implemented as the Aporia's
> act-boss enemy + Labyrinth narration, not an `NPCs`-module dialogue
> entity — still out of this skill's scope by design, not a gap. (6)
> orphaned NPC — zero; every one of the 19 authored NPC consts still
> resolves into exactly one map's `npcs`/`unstagedNpcs` array. KB
> (kb-query): not run — every consideration this pass was either
> audit-confirmed-clean (no CREATE/UPDATE) or a re-check of a standing
> filed row, exempt from the gate per the skill's own rule (§3 Step 2 /
> hard rule 7, REMOVE-adjacent no-op carve-out). Verify: not re-run in
> full — no source file changed (`git status` clean on
> `axiomancer-mechanics/src`, `axiomancer-mobile/`); ran the direct
> confirmation set instead (`vitest run` on
> `src/NPCs/e2e/story-npcs.engine.test.ts` 36/36,
> `src/NPCs/e2e/dialogue.engine.test.ts` 18/18,
> `src/World/Continents/e2e/continents.engine.test.ts` 28/28,
> `src/World/e2e/narrative-reachability.engine.test.ts` 24/24,
> `src/World/narrative-reachability.test.ts` 5/5,
> `src/World/MapEvents/e2e/nf-21-nf-14-npc-staging.engine.test.ts` 4/4 —
> 115/115 green) and confirmed HEAD's existing CI is green via
> `npm run deploy:check` (no gated workflow triggered for this docs/plan-
> only tick's paths as of this writing).
```

```
> **[adjust-keywords pass 3, 2026-09-08, commit fe49681e]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber stamp of pass
> 2's findings. `git log 9016a99f..HEAD -- axiomancer-mechanics/src/Cards
> axiomancer-mechanics/src/Effects axiomancer-mechanics/src/Combat
> axiomancer-mechanics/docs/keyword-atlas.md docs/retheme-map.json
> axiomancer-mobile/state/combat/keywords.ts
> axiomancer-card-editor/src/data/mechanics.ts` returns exactly one commit
> (`df4036fc`, `/adjust-cards` pass 3) out of the 25 landed since pass 2, so
> every Step-1 signal was re-derived by direct enumeration against the
> current tree rather than assumed stale-clean, same discipline as the
> cards/equipment/enemies pass-3 re-audits: (1) standing loop-call closure —
> confirmed, not assumed, that `/adjust-cards` pass 3 (`df4036fc`) actually
> closed the AMBUSH/FINALE `[loop-call]` pass 2 filed: direct grep of
> `src/Cards/library/trial.cards.ts` shows `kind: 'opening'` at lines 247 and
> 556 (2 carriers) and `kind: 'finale'` at lines 410 and 586 (2 carriers) —
> both now meet the atlas's "≥2 cards" bar; marked `[x]` in `plan/AUDIT.md`
> already reads RESOLVED, left as-is (no further action needed). (2) full
> carrier-count sweep — wrote a throwaway script counting every top-level
> `kind: '<x>'` literal across all 9 `src/Cards/library/*.cards.ts` modules
> for all 49 `CardSpecialMechanic` kinds in `types.ts`: the only zero-count
> kinds (`strip_random_buff`, `befriend_attempt`, `refresh_die`,
> `convert_die_color`, `overheat`, `forge_floating_die`, `float_x_die`,
> `spend_all_pips`, `echo_next_spell`) are exactly the 9 die-gear/card-local
> kinds `KINDS_WITHOUT_MECHANIC_KEYWORD`
> (`axiomancer-mobile/state/combat/__tests__/keywords.test.ts`) already
> classifies as badge-exempt by design (confirmed pass 2's finding still
> holds, not re-litigated from a stale cache); every other kind clears 1+
> carriers, and the two previously-thinnest (`rupture`=2, `chain`=2 via
> Hue and Cry + The Village Comes Over the Hill, `omen`=2 via The Summing Up
> + The Ducking Stool) still sit exactly at the ≥2 floor with no new drift
> below it. (3) `SynergyStatePredicate`/`Card.fallen` family — re-verified
> `checkStatePredicate`'s switch (`src/Cards/synergy-predicates.ts`) is
> exhaustive over its 7 live kinds with no `default:` fallthrough (a new
> predicate kind fails compilation, not silent no-op); FALLEN is a distinct
> first-class `Card.fallen?: { rider: CardRider }` field (not a
> `SynergyStatePredicate` member — confirmed this is by design, not a gap:
> the atlas groups it with the "turn shape" family by fantasy, not by
> implementation type) with 4 live carriers in `debt.cards.ts` alone. (4)
> mobile wiring honesty for the turn-shape family — traced how AMBUSH/FLOW/
> FINALE/REQUIEM actually reach a player-visible popup despite
> `combat-encounter.engine.ts` carrying zero `mechanicHeadline`/
> `MECH_HEADLINE_PRIORITY` cases for `opening`/`finale`/`flow`/`requiem`:
> confirmed this is NOT a gap — those four are a `card.synergy.statePredicate`
> field, a different shape from the `CardSpecialMechanic[]` array
> `mechanicHeadline` walks, and the actual popup path is the generic
> `keywordsInPersistentText()` sweep (`axiomancer-mobile/state/combat/
> keywords.ts`) over the card's rendered face text (`topActionText` /
> `bottomActionText` / `dieLines` / free-line text), which regex-matches any
> `[A-Z]{2,}` run against `KEYWORD_GLOSS` — so pass 2's fix to
> `combat.cards.ts`'s `statePredicateText` (making it print the literal words
> "AMBUSH"/"FINALE" instead of the stale "OPENING"/plain prose) is what
> actually wires the popup, not a per-kind headline case; verified
> `Ambush`/`Flow`/`Finale`/`Requiem` are all present as `KEYWORD_GLOSS` keys
> (lines 260-304) so the sweep resolves cleanly. Also checked whether the
> turn-shape family needs a glyph in the three hand-synced glyph tables
> (`statusGlyphs.ts`, `glyphShapes.ts`, editor `CardFace.tsx`) — confirmed NO:
> those tables glyph `ActiveEffect`-backed statuses shown on a combatant's
> portrait (Poison, Bleed, Mark…), and non-effect-backed play-time gating
> conditions (Stagger, Charge, Omen — checked as the existing precedent) also
> carry no glyph, so Ambush/Flow/Finale/Requiem/Fallen correctly having none
> is consistent with the established pattern, not an omission. (5) near-
> synonym / duplicate sweep — zero new keyword rows since pass 2 (68 rows,
> confirmed via `axio_keywords`), so no new duplication surface exists;
> pass 1/2's exhaustive pairwise pass still holds verbatim. (6) "Known drift"
> section re-checked against current source, not assumed accurate: POISON/
> BLEED/DOOM `damagePerRound` in `debuffs.library.json` are still 2/3/1 (the
> overhaul's §5.2 ×3-4 rescale has not landed) and RELENT's resolve threshold
> (`CAPITULATE_RESOLVE_FRACTION = 0.35`, `CAPITULATE_MIN = 10` in
> `src/Combat/effects.ts`) still floors at 10, not the `min 20` the overhaul's
> §5.4 explicitly asks for ("RELENT threshold = 35% of VITAE (min 20)") — both
> notes are STILL accurate (not stale), and both are engine-constant/effects-
> data rescales, not keyword-registry structural work (per this skill's own
> handoff boundary — "engine constants... are hand-tuned, not card-shaped");
> left untouched, matching pass 1/2's own judgment on the same two bullets,
> and NOT re-filed as a fresh `[loop-call]` since the atlas's own "Known
> drift" section already serves as the standing record and nothing new was
> learned about it this pass. (7) atlas-row / `CardSpecialMechanic`-kind
> parity — re-ran `content-drift.test.mjs`'s own check (11/11 green) that
> every registry keyword has a gloss and no `KEYWORD_GLOSS` row is orphaned;
> zero new mechanic kinds exist in `types.ts` since pass 2 (git log confirms
> no commit touched the file). KB research (kb-query): not run — every
> consideration this pass was audit-confirmed-clean (no CREATE/UPDATE) or a
> re-verification of a structural/wiring fact already KB-grounded by pass 1/2
> (AMBUSH/FINALE's Dawncaster prior art, CHAIN's Dawncaster prior art, OMEN's
> stated no-analogue miss) — exempt from the gate per skill §3 Step 2 (REMOVE/
> no-op carve-out); no new CREATE/UPDATE means no new receipt was needed.
> Verify: not re-run in full — no source file changed (`git status` clean on
> `axiomancer-mechanics/src`, `axiomancer-mobile/`, `axiomancer-card-editor/`,
> `docs/`); ran the direct confirmation set instead
> (`npm test` 123/123 incl. `content-drift.test.mjs`;
> `axiomancer-mobile` jest `keywords.test.ts` + `card-face-honesty.guard.test.ts`
> 22/22; `axiomancer-mechanics` vitest `deprecated-effects.engine.test.ts` +
> `paid-summary-honesty.engine.test.ts` + `pricing.engine.test.ts` +
> `sequencing-grammar.engine.test.ts` 285/285) and confirmed HEAD's existing
> CI is green via `npm run deploy:check` (`verify-mechanics` and
> `verify-mobile` both `success` for `72f5c34`).
```

```
> **[adjust-enemies pass 3, 2026-09-08, commit 5693d6db]**
> Zero-CREATE, zero-UPDATE, zero-REMOVE pass — full re-audit, not a rubber
> stamp of pass 2's findings. `git log 76d44ef2..HEAD -- src/Enemy
> axiomancer-mobile/assets/images/enemies` is empty (the 16 commits since
> pass 2 were the cards/equipment pass-3 ticks and the state-fixtures
> feature; nothing touched the enemy surface), so every Step-1 signal was
> re-derived from the current tree by direct enumeration/script rather than
> assumed stale-clean, same discipline as `/adjust-equipment` pass 3:
> (1) orphan sweep — all 77 exported `enemy.library.ts` consts resolve into
> `ENEMY_REGISTRY` (77/77) and all but 2 resolve into an `EnemiesByMap` pool;
> the 2 (`Sandbag_01`, `TheIncompleteness`) are the same deliberate
> test-fixture/impossible-ceiling exclusions pass 1/2 already found — no
> drift; (2) deck sweep — wrote a throwaway script cross-checking every
> `ENEMY_DECKS` entry (90 keys covering all 77 registry slugs, both flat and
> tiered `EnemyDeckSpec` shapes) against `ENEMY_CARD_LIBRARY`'s 157 ids (all
> resolve), the 4 distinct `effectId`s used (`debuff_mark`, `debuff_bleed`,
> `debuff_poison`, `debuff_creeping_doom`, all present in
> `debuffs.library.json`), and the 4 distinct `curseCardId`s (`arrears`,
> `overheard-name`, `mouthful-of-brine`, `gnaw-marks`, all present in
> `Cards/library/starters.cards.ts`'s curse set) — zero dead references;
> (3) portrait sweep — 75/77 enemies carry a `portraitAsset` (same 2
> fixtures excluded), zero collisions among the 75 values, all 75 resolve
> 1:1 into `axiomancer-mobile/assets/images/enemies/index.ts`'s registry,
> and all 75 required `.webp` files exist on disk — clean; (4) VITAE-band
> sweep — recomputed the live formula (`ENEMY_VITAE_BASE=30`,
> `ENEMY_VITAE_PER_LEVEL=8`, `ENEMY_VITAE_MULT` per difficulty) against all
> 21 enemies that author an explicit `vitae` override: worst deviation is
> ElderFireGiant at +25.7% (boss, L46), inside pass 1's already-established
> ~±26% tolerance band — no new outlier; (5) aftermath-prose/voice sweep —
> zero `thee|thou|thy|thine|ye` matches anywhere in `enemy.library.ts`
> (case-insensitive); 45/77 enemies carry `finalBlowLines`, 32 do not — the
> known backlog (filed pass 1, `plan/AUDIT.md` `[content]`, out of this
> skill's scope) rather than a new instance, and the 4 enemies pass 1/2
> created (NinthRungSpider, SporeWarden, DriftAnchor, TheAdjuster) all still
> carry their authored prose, confirmed individually; (6) loot-table
> sweep — all 22 distinct `drop()` ids in `enemy.library.ts` resolve in
> `Items/consumable.library.ts`; `loot.ts` itself carries no hardcoded item
> ids (pure weighted-roll logic) — clean.
> Signal 1 (roster-size floor / >70% sibling overlap) is the one signal
> that needed real re-litigation rather than a clean/dirty check, and it
> resolved differently than a naive re-run of pass 2's own framing would
> have: (a) **connecting-river (5) / town-across-river (4) are still the
> two smallest raw pools**, but `plan/phases/phase_W4_connecting_river.md`
> (the phase brief that shipped both maps) documents this as an *authored*
> decision, not drift — decision #2: "Both maps ship smaller than the
> W1-W3 precedent... Town Across the River is explicitly a coda location
> (`map.library.ts`: 'Home of sweetheart'), so its smaller footprint also
> reads as an intentional pacing choice, not a truncation"; decision #6:
> "Enemy count: 7 new (4 connecting-river, 3 town-across-river)...
> proportional to the smaller map footprint." Normalizing pool size against
> each map's own node count (a check neither pass 1 nor pass 2 ran)
> confirms the proportionality holds even after both backfills: connecting-
> river is 5 enemies / 14 nodes (0.36 enemies/node), town-across-river is
> 4/7 (0.57), fishing-village is 13/26 (0.50), caverns is 16/27 (0.59), and
> northern-city — never flagged as thin by any prior pass — is actually the
> *lowest*-density pool in the roster at 8/27 (0.30). Raw pool count without
> a node-count denominator was the wrong comparison basis (it read cr/tar's
> small NUMERATOR as thinness without checking whether the DENOMINATOR
> shrank to match); by the density metric that actually predicts fight
> repetition, cr/tar are mid-pack, not outliers. Judged: no CREATE this
> pass — pass 1/2's two backfills already did the real work of giving both
> maps native blood instead of pure forest re-treads (cr was 0 natives pre-
> pass-2, now 1 of 5; tar was 0, now 1 of 4), and the remaining size gap is
> the phase brief's own documented pacing choice. This closes the
> standing-open item from pass 2's log ("further growth... remains open...
> the next pass's own audit will re-find it if warranted") with a reasoned
> NO rather than silence. (b) **A signal pass 1/2 never checked: full
> pairwise sibling overlap across all 9 pools**, not just the two pairs
> those passes happened to compare. It turned up four >70% pairs, all
> involving the Aporia's three act-pools: aporia-colonnade vs
> northern-forest 7/8 (87.5%), aporia-archive vs northern-forest 7/8
> (87.5%), aporia-proof vs northern-forest 10/11 (90.9%), aporia-archive vs
> caverns 6/8 (75.0%). Judged: not a CREATE-worthy finding — `enemy.
> library.ts`'s own `EnemiesByMap` comment block states the reuse is
> deliberate design, not an unaudited gap: "The Aporia (W-01) — three acts
> of rising difficulty. Pools reuse the shared roster (wandering foes scale
> to the player via the adaptive level bands); each act adds its authored
> boss." The Aporia is a labyrinth built from the world the player has
> already walked (Aporia = a philosophical impasse/maze of doubt, per its
> own naming), not a new region competing for distinct native fauna the way
> caverns/northern-city/connecting-river/town-across-river do — recycling
> the roster at harder scaling, with one authored boss anchoring each act,
> reads as the intended shape of a "the same halls, made worse" dungeon
> rather than the "same three fights" staleness the signal exists to catch.
> This has been true and stable since the Aporia shipped (W-01, predates
> all three `/adjust-enemies` passes) without being flagged before; noting
> and closing it here rather than leaving it undiscovered residue.
> KB research (kb-query): not run — every consideration this pass was
> either audit-confirmed-clean (no CREATE/UPDATE/REMOVE) or a re-litigation
> of a structural signal resolved by in-repo documentary evidence (the W4
> phase brief, the Aporia's own code comment) rather than new design
> content needing genre grounding; exempt from the gate per §3 Step 2 /
> hard rule 7 (REMOVE/no-op carve-out — no new or changed content shipped).
> Verify: not re-run — no source file changed (`git status` clean on
> `src/`, `axiomancer-mobile/`); HEAD's existing CI (verify-mechanics,
> verify-mobile) is already green per the most recent runs on `main`
> (verify-mechanics green at `df4036fc`, verify-mobile green at the last
> commit that touched mobile source, `4cdfa6e7`) and confirmed again via
> `npm run deploy:check` after this ledger commit lands.
```

```
> **[adjust-equipment pass 3, 2026-09-08, commit a3681576]**
> Zero-CREATE, zero-UPDATE, zero-REMOVE pass — full re-audit reconfirms pass
> 2's clean state. `git log 721adac9..HEAD -- src/Items src/World/MapEvents/
> content.ts src/Combat/combat.encounter.types.ts` is empty: nothing in the
> equipment/consumable/shop/signature surface moved in the 17 commits since
> pass 2, so every Step-1 signal was re-verified against the current tree
> rather than assumed stale-clean: (1) dominated relics — all 8 re-checked
> (2 weapons/body+2, 2 armor/maxHp+5, 4 accessories split mind+2/heart+2),
> same-slot pairs share identical stat magnitude and differ only by
> `grantsSignature`, no strictly-dominated pair; (2) `grantsSignature` drift
> — all 8 relic values (`sig-overwhelming-argument`, `sig-rallying-blow`,
> `sig-read-opponent`, `sig-second-wind`, `sig-conviction-strike`,
> `sig-clever-gambit`, `sig-disarming-plea`, `sig-press-the-point`) still
> resolve 1:1 against the live `SignatureSkillId` union in
> `combat.encounter.types.ts`; (3) dead consumable `effectId`s — all 11
> non-heal-only ids re-checked against `buffs.library.json`/
> `debuffs.library.json`, all resolve; (4) shop-pool / reward-table coverage
> — re-enumerated all 6 `shop.wares` blocks in `World/MapEvents/content.ts`:
> still exactly 8/22 consumables shop-stocked (`minor-healing-potion`,
> `healing-potion`, `antidote`, `clarity-serum`, `philosopher-tea`,
> `void-essence`, `body-elixir`, `focus-vial`), the other 14 still reachable
> via `rollCacheReward`'s uniform draw over the full `consumableLibrary`, so
> none is acquirable-nowhere; (5) `AccessoryKind` gap — head/hands/feet
> remain at zero live relics, same standing `[loop-call]` filed 2026-09-04
> (`plan/AUDIT.md`) — still an owner/mechanics-expert call (a 9th signature
> skill needs designing first, and the lean relic shape's own identity rule
> — `grantsSignature !== undefined` — rules out a stat-only accessory as a
> workaround), no new development against it this pass. KB research: not
> run — every consideration this pass was audit-confirmed-clean (no
> CREATE/UPDATE), exempt from the gate per §3 Step 2 (REMOVE/no-op
> carve-out). Verify: not re-run — no source file changed; HEAD's existing
> CI (verify-mechanics) is already green per `npm run deploy:check`.
```

```
> **[adjust-cards pass 3, 2026-09-08, commit df4036fc]** Created 2 (trial
> theme), zero-UPDATE, zero-REMOVE pass. Audit: since pass 2 (8c346ac7),
> re-swept all six theme modules for the Step-1 signals — reachability (the
> 121-card `combat-playtest.card-coverage.sim.test.ts` dead-card detector,
> now 123/123 with the two new cards folded in), near-duplicates (extracted
> every card's id/rank/aspect across debt/grave/vigil/choir and cross-
> checked every same-rank-same-aspect pair's `specialMechanics` shape by
> hand — three same-(rank,aspect) collisions found (debt: distraint/
> a-pound-of-flesh at rank4/body; debt: blank-indenture/confession-of-
> judgment at rank5/heart; choir: miserere/te-deum-for-a-dying-thing at
> rank6/heart) but all three read as deliberate verb-family reuse across
> different mechanics (immolate+guard vs recoil+wrath+synergy; recoil_x vs
> immolate+fallen; reap_all+siphon vs sway+quarter+grace-momentum), not
> accidental duplication — none actioned), pricing sanity + paid-summary
> honesty (green, no drift), aspect thirds (green, unaffected — presets
> don't draw from trial's new cards). Only real finding was the standing
> `[loop-call]` (`plan/AUDIT.md`, filed by `/adjust-keywords` pass 2 after
> fixing AMBUSH/FINALE's print-text bug): both keywords still had exactly 1
> card carrier each, below the atlas's "≥2 cards" discipline, same shape as
> pass 2's CHAIN/OMEN finding. Judged CREATE for both, mirroring pass 2's
> resolution: **The Door Comes Down First** (id `the-door-comes-down-first`,
> rank 5/Skull, mind aspect) — deal 34 + AMBUSH (as your turn's first spell:
> STAGGER 2, +8 CHARGES), one rank above Struck from the Record's Splinter
> carrier; and **Nothing Further, Your Honour** (id
> `nothing-further-your-honour`, rank 4/Rib, heart aspect) — deal 24 +
> BACKFIRE 6 for 3 turns + FINALE 1 (deal 16 more, STAGGER 2), one rank
> below Judgment Entered Against Them's Skull carrier. Both mechanics
> (`opening`/`finale` `SynergyStatePredicate` kinds) are already fully
> generic in the engine — the fix that made them print correctly landed in
> `/adjust-keywords` pass 2 — so this was a pure card-authoring add, no
> engine/pricing-table/display/atlas changes needed (the atlas's carrier
> column already reads "(see the catalog)" for every keyword, same as the
> CHAIN/OMEN precedent). Also placed AUDIT.md's routing row `[x]`-resolved
> with the file list, per the CHAIN/OMEN row's own precedent. KB (kb-query):
> `kb_keyword` confirmed both definitions verbatim ("Ambush... triggers if
> this card is the first card played of the round"; "Finale... triggers
> when played with 2 or fewer cards remaining in hand") and `kb_cards`
> turned up 8+ Dawncaster carriers for each (Ambush: Advance, Aimed Shot,
> Boarding Party, Clever Maneuver, Come get me!, Crossbow, Cutlass, Daggers,
> Dash; Finale: Adrenaline Rush, Cranium Blow, Crossbow, Daring Dash,
> Flourishing Bow, Last Laugh, Scattershot, Trickshot) — the genre spreads
> both keywords across many cards, the opposite shape from CURDLE's
> single-card-only miss, directly grounding "author a second carrier" over
> "retire." Both new cards were priced by hand against `VERB_POINTS` in
> their `// pts:` comments (~22.1 and ~31.8 respectively — no rank-band lint
> to satisfy) and pass the pricing sanity guard, the card-coverage dead-card
> detector, and the paid-summary-honesty guard (every number `paidText()`
> generates from `specialMechanics`/`combatEffects` appears verbatim in the
> authored `paidSummary`; the synergy rider's numbers — not checked by that
> guard, since it only validates the base PAID line — were included in the
> prose anyway for player clarity, matching house style on
> Struck from the Record / Judgment Entered Against Them). Also corrected
> `cards.library.ts`'s aggregator header comment, stale since before pass 1
> ("112 cards... six theme modules of 16" — the live count is 128 across
> six 16-20-card theme modules plus the 12-card apocrypha pool it didn't
> mention at all). Verify: green (mechanics 212/212 files · 3392 tests +
> build; mobile lint 0 errors/15 pre-existing warnings + typecheck + jest
> 260/260 suites · 2630/2630 tests + assets:check 7/7 + art:test 24/24;
> card-editor type-check).
```

```
> **[adjust-npcs pass 2, 2026-09-07, commit 570cc566]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — full re-audit reconfirms pass 1's clean
> state, no new actionable structural findings. Every Step-1 signal
> re-swept against the current tree (15 commits / ~53h since pass 1's
> f0a2891f, all outside `src/NPCs/**`/`src/World/Continents/**` except
> `/adjust-enemies` pass 2's two new roster CREATEs on connecting-river and
> town-across-river, which added enemies, not NPCs): (1) unstaged-NPC
> backlog — northern-forest's pass-1 fix holds (6/6 rostered NPCs
> reachable; the dedicated `nf-21-nf-14-npc-staging.engine.test.ts` plus
> `narrative-reachability.engine.test.ts`, `dialogue.engine.test.ts`, and
> `story-npcs.engine.test.ts` all still green, 82/82 tests); fishing-
> village's 4 declared-`unstagedNpcs` (Tide-Shopkeeper, Village Healer,
> Dockworker's Union Leader, Merchant's Widow) re-checked against S-02's
> stated reasons — all four still hold: `isShopkeeper` still has zero
> mobile consumers (re-grepped `axiomancer-mobile/`), no commit touched
> `RestChoice`/`rest-shelter.ts` or any settlement-screen surface since
> pass 1. (2) map-with-<2-staged-NPCs signal — direct enumeration of
> `Northern-Continent/maps.ts` reconfirms `caverns` (theDelver only),
> `connecting-river` (theBoatwoman only), and `town-across-river`
> (theSweetheart only) each still carry exactly 1 rostered NPC; the
> standing `plan/AUDIT.md` `[needs-user-call]` row (filed pass 1,
> 2026-09-05) is unchanged and left open as filed — no new evidence to
> re-litigate a personhood-design call this autonomous tick can't make
> (hard rule 3). (3) dead-end dialogue nodes — wrote a throwaway script
> cross-checking every `DialogueTree` in `Coastal-Village/npcs.ts`,
> `Northern-Forest/npcs.ts`, and `Northern-Continent/maps.ts` (19 authored
> NPCs total) against its own `rootId` + every `nextNodeId` reference in
> both directions: zero unreachable (orphan) nodes, zero broken links (a
> `nextNodeId` pointing at a nonexistent node id). Every leaf node (no
> `choices`) read manually is an intentional flavor-terminator in house
> voice (a merchant's parting line, a sage's blessing), not a bug-shaped
> dead end. (4) stale `effect` references — zero `teachCard` references
> anywhere in the NPC-authoring tree (matches pass 1's finding, still
> true); all 9 `startQuest` call sites' quest names resolve against the
> live `QuestName` union (`quest.library.ts`). (5) legacy flat
> `DialogueMap` — zero live usage; all 19 authored NPCs already use
> `dialogueTree`. (6) orphaned NPC — zero; every one of the 19 NPC consts
> is imported into exactly one map's `npcs` or `unstagedNpcs` array (no
> dead exports). (7) spec-to-NPC gap — `specs/characters/C-01-the-
> sophist.md` (Protas, the Aporia's speaking cast) is fully implemented,
> but as the Aporia's act-boss enemy + Labyrinth room narration
> (`Enemy/enemy.library.ts`, `World/Labyrinth/**`), not an `NPCs`-module
> dialogue entity — correctly out of this skill's scope, not a gap. KB
> (kb-query): not run — every consideration this pass was either
> audit-confirmed-clean (no CREATE/UPDATE) or a re-check of a standing
> filed row, exempt from the gate per the skill's own rule (§3 Step 2 /
> hard rule 7, REMOVE-adjacent no-op carve-out). Verify: not re-run — no
> source file changed; ran the 4 existing NPC/reachability suites directly
> as a confirmation (82/82 green: `narrative-reachability.engine.test.ts`,
> `dialogue.engine.test.ts`, `story-npcs.engine.test.ts`,
> `nf-21-nf-14-npc-staging.engine.test.ts`); HEAD's existing CI
> (verify-mobile, verify-mechanics) is already green per
> `npm run deploy:check`.
```

```
> **[adjust-keywords pass 2, 2026-09-07, commit 9016a99f]** Zero-CREATE,
> zero-REMOVE pass — updated 2 (RUPTURE's stale cap gloss; AMBUSH/FINALE's
> unwired face-print). Full audit per skill §3 Step 1, no bias: Step 0 doctrine
> re-read (`CLAUDE.md`, `keyword-atlas.md`, `retheme-map.json`); `axio_keywords`
> confirms 68 live rows (unchanged — pass 1's CURDLE retirement + parser fix
> already landed); a rider-and-statePredicate-inclusive carrier grep across
> every `CardSpecialMechanic`/`SynergyStatePredicate` kind in `src/Cards/
> library/*.cards.ts` re-ran pass 1's sweep and additionally covered the
> `SynergyStatePredicate` union pass 1 didn't touch (opening/finale/flow/
> requiem — the "turn shape" family). Findings, in signal order:
> (1) [signal: CHAIN/OMEN loop-call follow-up] confirmed CLOSED — both now
> show 2 live carriers (Hue and Cry + The Village Comes Over the Hill; The
> Summing Up + The Ducking Stool, per `/adjust-cards` pass 2, 2026-09-06); no
> further action, the standing `[x]`-marked `plan/AUDIT.md` row already
> records the resolution.
> (2) [signal: keyword face word prints but pops nothing / a printed number
> that isn't the applied number — "ship regardless of priority"] RUPTURE:
> `docs/keyword-atlas.md`'s own "Known drift" section (written 2026-09-02)
> claimed `RUPTURE_CAP_FRACTION = 0.60` was "still live in
> `src/Combat/effects.ts`" — false as of this pass's re-check: the constant is
> already `Number.POSITIVE_INFINITY` (the cap function returns `Infinity`
> unconditionally), and the mobile PRESENTER (`combat-encounter.engine.ts`'s
> `case 'rupture':`) already branches on `Number.isFinite(...)` and renders
> "uncapped" honestly. Only the STATIC first-sight popup
> (`axiomancer-mobile/state/combat/keywords.ts` `KEYWORD_GLOSS.Rupture`) still
> hardcoded "up to 60% of its max VITAE" — a printed number that was no longer
> the applied number, on a genre-load-bearing keyword. Fixed the gloss to
> match the atlas row above it (no cap claim); corrected the matching stale
> claims in `docs/combat.md` (two call sites); removed the now-resolved bullet
> from the atlas's "Known drift" section with a dated correction note. Exempt
> from the KB gate as a pure doc/gloss-accuracy fix (no semantics changed),
> per the skill's REMOVE-adjacent carve-out pass 1 already used for a stale
> doc note.
> (3) [signal: `CardSpecialMechanic`/`SynergyStatePredicate` kind with no
> honest face print + carrier-count sub-finding] AMBUSH and FINALE: the
> "turn shape" family (AMBUSH, FLOW, FINALE, REQUIEM, FALLEN) was written
> whole into the atlas during THE BIG NUMBERS REWRITE (2026-09-02), and
> `paid-summary-honesty.engine.test.ts`'s own KNOWN_UPPER comment already
> grouped AMBUSH with "the turn-shape conditions promoted to face terms" —
> but the promotion was left half-wired. `combat.cards.ts`'s
> `statePredicateText` still printed the WS5.2-era (2026-07-11) "OPENING"
> face term — a deliberately card-local, unregistered word by a doc comment
> predating the rewrite by two months — instead of "AMBUSH", so the keyword
> never actually appeared on its one live carrier (Struck from the Record,
> trial). `finale`'s case printed a plain lowercase gloss with no keyword
> word at all, so FINALE never printed anywhere either (its one carrier,
> Judgment Entered Against Them, trial, described the effect in plain
> English). Fixed both cases to print their registry name, matching how
> FLOW/REQUIEM already do (`FLOW N (...)`, `REQUIEM N (...)`); updated the
> two carrying cards' authored `paidSummary` text to match ("OPENING —" →
> "AMBUSH —"; inserted "FINALE 1 —" ahead of the existing clause); updated
> the historical WS5.2 sequencing-grammar fixture test's pinned literals
> (`sequencing-grammar.engine.test.ts` — 4 `conditionEvent` prefixes, 3
> `statePredicateText` assertions, plus its own doc comments, which
> documented the now-superseded "registered nowhere" design as historical
> rather than deleting the record); added `FINALE` to
> `paid-summary-honesty.engine.test.ts`'s `KNOWN_UPPER` allowlist (AMBUSH was
> already present). KB (kb-query): `kb_keyword` returned exact, strong
> Dawncaster prior art for BOTH — "Ambush [Effect] — Triggers if this card is
> the first card played of the round" and "Finale [Effect] — Triggers when
> played with 2 or fewer cards remaining in hand" (`kb:dawncaster/
> keywords.csv`), corroborated by live carriers in the corpus
> (`kb:dawncaster/cards/0021-advance-932954.okf.md`,
> `kb:dawncaster/cards/0020-adrenaline-rush-256754.okf.md`) — this is near-
> identical semantics to our own AMBUSH/FINALE, confirming the Sept-2 atlas's
> naming choice was genre-aligned and that finishing the wire (not reverting
> to "OPENING" or retiring the badges) was the right direction. Residue, NOT
> actioned: both keywords are STILL exactly 1 live carrier each even after
> the print-text fix — below the atlas's own "≥2 cards or ≥2 enemies"
> discipline, the same shape pass 1 found for CHAIN/OMEN. Per this skill's
> REMOVE-routing rule, authoring a second carrier (or retiring to plain rules
> text) is a card-authoring/owner call, not a keyword-registry one — filed to
> `plan/AUDIT.md` as `[loop-call]` for `/adjust-cards`, same shape as pass 1's
> CHAIN/OMEN filing (which `/adjust-cards` pass 2 has since resolved by
> authoring a second carrier for each).
> Other Step-1 signals swept clean: every atlas row still carries a `kb:`
> receipt or is exempt per the atlas's own doctrine; every live
> `CardSpecialMechanic` kind either maps to a glossed keyword or is on the
> `KINDS_WITHOUT_MECHANIC_KEYWORD` exemption list (9 zero-carrier die-gear/
> card-local kinds — `befriend_attempt`, `convert_die_color`,
> `echo_next_spell`, `float_x_die`, `forge_floating_die`, `overheat`,
> `refresh_die`, `spend_all_pips`, `strip_random_buff` — checked and
> confirmed already exempt-by-design, not a registry gap: none of them ever
> carried a keyword badge, so a card never authoring one is not drift; a
> `/adjust-cards`-scoped question, not raised further here). Verify: green
> (mechanics 210/210 files · 3356 tests + build; mobile lint + typecheck +
> jest + assets:check 7/7 + art:test 24/24; card-editor type-check; root
> `npm test` 123/123 incl. `content-drift.test.mjs`).
```

```
> **[adjust-<category> pass N, <ISO-date>, commit <sha>]** <one-line:
> what shipped — e.g. "created 2 cards (Grave theme), retired 1
> (never drafted, superseded by <card>), updated 1 (pricing drift
> after VERB_POINTS change)".>
```

> **[adjust-enemies pass 2, 2026-09-07, commit 76d44ef2]** Created 2,
> zero-UPDATE, zero-REMOVE pass. Audit (Step 1, all seven EnemiesByMap
> pools re-enumerated against the current tree, no source change since
> pass 1's 04d2bf0d): orphan sweep clean (all 73 production slugs resolve
> into a pool; `sandbag`/`the-incompleteness` remain the deliberate
> fixtures); VITAE-band sweep clean (every authored boss/unique still
> within the live `ENEMY_VITAE_BASE`/`PER_LEVEL`/`MULT` band); voice sweep
> clean (no thee/thou/thy/thine/ye); loot-table sweep clean (every
> `loot.ts` drop id resolves in the current item/consumable libraries);
> deck sweep clean (every `ENEMY_DECKS` card id resolves in
> `ENEMY_CARD_LIBRARY`, no retired-keyword references). The one live
> finding was pool thinness: `connecting-river` (4 entries: 3 non-boss +
> the pinned Waterreeve, which the uniform draw in `generateEncounter`
> can still return) and `town-across-river` (3 entries: 2 non-boss + the
> pinned Portreeve) are the roster's two thinnest pools by a wide margin
> against every sibling (8-39 elsewhere) — both are brand-new (Phase W4,
> 2026-08-31), so the thinness is real, not a stale artifact. CREATE one
> river-native and one town-native enemy per skill §1's roster-size-floor
> signal: **The Drift-Anchor** (connecting-river, normal, a drowned
> mooring-stone the current keeps for ballast) and **The Adjuster**
> (town-across-river, normal, the town's claims-settler). Both wired
> full-depth: `enemy.library.ts` (`createEnemy` + `EnemyLibrary` +
> `EnemiesByMap` + `ENEMY_REGISTRY`), a 3-card deck each in
> `combat.enemy-decks.ts` composed from the shared drowned-parish
> (Drift-Anchor) and debt-office (Adjuster) canon — no new cards needed,
> matching the map's existing decks — aftermath prose (finalBlowLines +
> causeLines), and a licensed game-icons.net portrait each (Lorc,
> `anchor.svg` / `wax-seal.svg`, CC BY 3.0, rasterized 512px WebP per the
> W3/W4/pass-1 recipe; provenance recorded). This is a partial fix, same
> shape as pass 1's caverns backfill (71%→62.5%, not to parity) — the
> pools go from 4→5 and 3→4, still the roster's thinnest two, and further
> growth on these newest maps remains open (not filed as new residue;
> the existing thinness signal is self-evidently still live and the next
> pass's own audit will re-find it if warranted). KB research (kb-query):
> `kb_overview`/`kb_find_games`/`kb_search` returned no on-point doctrine
> for a numeric roster-thinness floor (same miss pass 1 hit for the
> sibling-overlap ceiling) — grounded the CREATE in the repo's own
> established precedent (the W3/W4 backfills, and pass 1's caverns fix)
> plus Mage Knight's per-site monster-deck model (`kb:mage-knight`,
> reception/better-if.okf.md's site/enemy variety framing — the same
> citation pass 1 used), consistent with `/adjust-enemies` §3's own
> citation for enemy design. Also reviewed but not actioned: the standing
> `plan/AUDIT.md` `[content]` row (30/73 enemies missing aftermath prose,
> filed 2026-09-05) is unchanged and still correctly scoped to
> `content-curator`, not this skill; the `[loop-call]` Phase 78 W5
> art-pass-candidates row (9 W3/W5 enemies with sourced replacement-art
> candidates awaiting a pick) is a `/forge`-shaped art-wiring job, not a
> roster-health structural finding, so left un-actioned this pass rather
> than force-fit. Verify: green (mechanics 210/210 files · 3356 tests +
> build; mobile lint 0 errors/15 pre-existing warnings + typecheck + 259
> suites/2620 jest tests + assets:check 7/7 + art:test 24/24).

> **[adjust-equipment pass 2, 2026-09-06, commit 721adac9]**
> Zero-CREATE, zero-UPDATE, zero-REMOVE pass — full re-audit reconfirms
> pass 1's clean state. Nothing in `src/Items/**`, the 6 live village
> `shop.wares` blocks in `src/World/MapEvents/content.ts`, `src/Effects/
> *.library.json`, or `SignatureSkillId` (`combat.encounter.types.ts`)
> changed in the commits since pass 1, so each Step-1 signal was
> re-verified against the current tree rather than assumed: (1) dominated
> relics — all 8 re-checked, same-slot pairs share identical stat
> magnitude and differ only by `grantsSignature`, no strictly-dominated
> pair; (2) `grantsSignature` drift — all 8 relic values still resolve
> 1:1 against the live `SignatureSkillId` union, no rename/removal;
> (3) dead consumable `effectId`s — all 11 non-heal-only ids (incl. the
> 5 pass 1 fixed) resolve in `buffs.library.json`, correctly tagged
> `support`/`non-card`, so `/adjust-keywords`'s card-vocabulary ban list
> (which forbids CARD references to retired ids) doesn't touch them —
> consumables are the exempt non-card channel by design; (4) shop-pool /
> reward-table coverage — enumerated all 6 shops (Glen Market, Hidden
> Camp, The Ledger Camp, The Iron Market, The Chandlery, The Landing):
> 8/22 consumables are shop-stocked, but the other 14 are still reachable
> via `rollCacheReward`'s uniform draw over the full `consumableLibrary`
> (The Reliquary and sibling cache surfaces), so none is acquirable-
> nowhere and none trips the REMOVE signal; (5) `AccessoryKind` gap —
> head/hands/feet remain at zero live relics, same standing `[loop-call]`
> filed 2026-09-04 (`plan/AUDIT.md`) — still an owner/mechanics-expert
> call (a 9th signature skill would need designing first), not actioned
> here, no new development against it. Ledger hygiene: corrected this
> row's tracked commit — it cited `934160bb`, the merge sha of an
> unrelated PR (#285, kb-sync retirement) that isn't even an ancestor of
> the real pass-1 commit, rather than the actual `/adjust-equipment`
> pass 1 shipping commit `a22673e3` (same class of mistake the cards
> ledger corrected 2026-09-06). Recomputed staleness off the right
> parent: 19 commits / ~45.5h since `a22673e3`, not the ~20/~48h `/march`
> estimated off the wrong sha — still comfortably past both rate-limit
> thresholds, so this doesn't change today's dispatch, only future
> measurement accuracy. KB research: not run — every consideration this
> pass was either audit-confirmed-clean (no CREATE/UPDATE) or the
> standing loop-call (already KB-grounded in pass 1's filing); REMOVE/
> no-op is exempt from the gate per §3 Step 2. Verify: not re-run — no
> source file changed; HEAD's existing CI (verify-mobile, verify-
> mechanics) is already green per `npm run deploy:check`.

> **[adjust-cards pass 2, 2026-09-06, commit 8c346ac7]** Created 2
> (trial theme), zero-UPDATE, zero-REMOVE pass. Audit: since pass 1
> (f29cea5c — the ledger's prior row cited its parent commit 24978555 by
> mistake; noted here so the next pass measures staleness off the right
> sha), the only Cards-adjacent change on `main` was `3fb4963b` (starter-deck
> tri-colour + de-dup fix) — no card content moved, so pass 1's clean
> reachability/duplicate/aspect-thirds/FREE-line sweeps still hold verbatim
> and were not re-derived from scratch. The one open finding this pass
> answers is a standing `[loop-call]` (`plan/AUDIT.md`, filed by
> `/adjust-keywords` pass 1's rider-inclusive carrier audit, 2026-09-05):
> CHAIN and OMEN each had exactly ONE card carrier (Hue and Cry;
> The Summing Up, both `trial`), below the keyword atlas's own "≥2 cards"
> discipline, but both anchor a load-bearing atlas family (the damage octet;
> tempo-and-control) rather than reading as accidental cruft — the prior
> pass explicitly deferred the create-vs-retire call to `/adjust-cards`.
> Judged CREATE for both: "The Village Comes Over the Hill" (id
> `the-village-comes-over-the-hill`, rank 4/Rib, heart aspect) — deal 20 +
> CHAIN 8, with a FLOW-gated rider adding CHAIN 6 more — a direct narrative
> escalation of Hue and Cry's own flavor text ("the village comes over the
> hill..."); and "The Ducking Stool" (id `the-ducking-stool`, rank 3/Splinter,
> body aspect) — deal 14 + a second OMEN at the SAME window/ante parameters
> (maxWindow 2, anteConviction 2) as The Summing Up's proven carrier, staking
> a claim on the foe's stance via the ducking-test ordeal. Both mechanics
> (`chain`/`omen` `CardSpecialMechanic` kinds) are already fully generic in
> the engine — any card carrying them works with zero new wiring — so this
> was a pure card-authoring add: no engine, pricing-table, display, or atlas
> changes needed (the atlas's carrier column already reads "(see the
> catalog)" for every keyword, not a hardcoded id list). KB (kb-query): CHAIN
> has strong Dawncaster prior art (`kb:dawncaster/keywords/chain.okf.md` —
> "Increase the damage of the next action by 1 per stack... plays a key role
> in raising the Tide," and a `kb_search` sweep turned up 5+ Dawncaster cards
> carrying it) — the genre's own convention is to spread a Chain-family
> keyword across many cards, which directly grounds "author a second
> carrier" over "retire." OMEN has NO on-point Dawncaster analogue — the
> closest, Foretell (`kb:dawncaster/keywords/foretell.okf.md`, "look at the
> top X cards... put 1 on top"), is a deck-peek/reorder verb, a different job
> from a Conviction-anted stance wager — that miss is stated plainly rather
> than papered over; the second OMEN carrier is grounded instead in the
> repo's own already-proven shape (copying The Summing Up's exact
> window/ante numbers rather than inventing new ones). Both new cards were
> priced by hand against `VERB_POINTS` in their `// pts:` comments (~13.4 and
> ~11.3 respectively — no rank-band lint to satisfy, sized by eye against
> their rank peers: contemptOfCourt/pressedForAPlea/theSummingUp at rank 4,
> thePrickingNeedle/struckFromTheRecord/thePerjurersTongue at rank 3) and
> pass the card-effectiveness lint (`chain-gained`/`pendingOmens`-growth
> assertions fire because both mechanics mirror already-exercised shapes)
> and the paid-summary-honesty guard (every number `paidText()` generates
> from `specialMechanics` appears verbatim in the authored `paidSummary`;
> the FLOW synergy's own numbers print via the card's auto-generated die
> line regardless, so they were not required in the prose but were included
> anyway for readability, matching house style on this card's siblings).
> Verify: green (mechanics 210/210 files · 3353 tests + build; mobile lint +
> typecheck + jest 259/259 suites · 2620/2620 tests + assets:check +
> art:test; card-editor type-check).

> **[adjust-npcs pass 1, 2026-09-05, commit f0a2891f]** Zero-CREATE,
> zero-REMOVE pass — updated 2 (staged the Forest Ranger and the Lost
> Trader). Both were authored in full (Phase 117 — complete `DialogueTree`s,
> alignment-gated branches, moral/currency effects) but sat in northern-
> forest's `unstagedNpcs` with a "content follow-up" reason (S-02, dated
> 2026-08-28) that was never picked up — Signal 1's highest-priority finding
> ("authored-but-invisible content is worse than absent"). Worse than a
> generic staging gap: the Forest Ranger's tree carries the ONLY authored
> path to `startQuest('get-to-cave')` (Phase 8) — with him unstaged,
> `get-to-cave` (an authored `Quest` object with a real reward, declared in
> `northernForest.quests`) had a 0% chance of ever starting in live play.
> `auditNarrativeReachability` only checks that an unstaged NPC is
> *declared*, not that the declaration is still current, so nothing failed.
> Staged both by displacing a `cutscene`-kind scenery pool each (nf-21
> "Ranger Cairn", nf-14 "Ancient Stone Marker" — both already scenery
> conversions from Phase 53a with no flag/quest dependency, confirmed via
> grep before touching them); new interaction descriptions written in the
> ratified register (spec 34 §2), each keeping a concrete thread from the
> original scenery text (the cairn's dead colleague now ties to the
> Ranger's own logging-line conflict; the stone marker's runes now sit
> beside the ambushed cart) rather than discarding it. Existing dialogue-
> tree prose for both NPCs (pre-Phase-44g, wordier than the house register)
> was left untouched — same division of labor S-02 drew for the coastal
> eight: staging is this skill's job, full retheme is a separate content
> pass; filed to `plan/PHASE_CANDIDATES.md`. Audited but NOT actioned: (1)
> three of four Northern-Continent maps (caverns, connecting-river,
> town-across-river) carry exactly 1 staged NPC each, under Signal 2's
> "<2 staged NPCs → CREATE" threshold — but each is already a deliberately
> minimal, freshly-authored singleton (Phase W3/W4's own in-file commentary:
> "the guaranteed quest-giver is on every route," "a homecoming, not a new
> front") with no `specs/characters/` or `specs/story/` spec asking for more
> voices; inventing a new named character's full personhood here is
> explicitly out of scope for this skill (hard rule 3) — filed to
> `plan/AUDIT.md` as `[needs-user-call]`. (2) The four coastal NPCs S-02
> deliberately left unhomed (Tide-Shopkeeper, Village Healer, Union Leader,
> Merchant's Widow) were re-checked against their stated reasons: Tide-
> Shopkeeper's `isShopkeeper: true` flag still has zero mobile consumers
> (confirmed by grep — the live shop UI mobile ships today is the unrelated
> `village`-kind `shop.wares` path, already used at nf-8/nf-18); no rest-node
> rebuild or settlement screen has landed since 52c/52d or S-02 was written.
> All four reasons still hold; no action. `teachCard` and legacy flat
> `DialogueMap` signals came back empty (zero live `teachCard` references
> to audit; no authored NPC uses `DialogueMap`). KB (kb-query): searched
> `boardgames` scope for NPC/dialogue/quest-reachability prior art; no doc
> addresses "unreachable content" by that name, but heroes-of-terrinoth's
> reception doc (src-007) grounds the general principle this pass acts on —
> "the abstraction of quest progress weakens the game's narrative payoff,"
> quest content that doesn't legibly reach the player reads as a real
> defect, not a neutral omission — cited as the closest on-point prior art
> rather than a miss requiring a wishlist filing. Added
> `nf-21-nf-14-npc-staging.engine.test.ts` (4 tests: both nodes resolve as
> `interaction` carrying the right `DialogueTree`; the Ranger's `get-to-cave`
> grant actually starts the quest through the real `applyDialogueChoice`
> orchestrator; the unstaged backlog is empty) and updated the pinned
> `narrative-reachability.engine.test.ts` assertions (was "4 of 6 NPCs
> reached, 2 declared-unstaged," now "6 of 6," plus a dedicated nf-21/nf-14
> reachability check) and one stale `nf-14 resolves as cutscene` assertion
> that this pass's fix falsified. No new persisted state shape — staging
> reuses the existing `interaction`/`DialogueTree` machinery, so no
> `GAME_STATE_VERSION` migration was needed. Verify: green (mechanics
> 210/210 files · 3343 tests + build; mobile lint + typecheck + jest
> 252/252 suites · 2604/2604 tests + assets:check + art:test).

> **[adjust-keywords pass 1, 2026-09-05, commit bf6223f1]** Zero-CREATE pass —
> one retire, one stale-doc correction, one tooling fix. Retired CURDLE
> (`convert_dots`): exactly one live carrier (The Lazar's Kiss, rot rank 4),
> below the atlas's own "≥2 cards or ≥2 enemies" discipline, confirmed via a
> rider-inclusive grep (no `CardRider.chain`-style grant hides a second
> carrier anywhere in `library/*.cards.ts`). The mechanic still functions —
> the card still flips Bleed↔Poison — only the badge/gloss/atlas row died,
> per the atlas's own escape hatch ("a one-card mechanic stays as plain
> rules text"); touched `rot.cards.ts` (paidSummary), `combat.cards.ts`
> (mechanicText case), mobile `keywords.ts` (MECHANIC_KEYWORD +
> KEYWORD_GLOSS), `keywords.test.ts` (KINDS_WITHOUT_MECHANIC_KEYWORD),
> `keyword-atlas.md` (row removed, retirement logged), and
> `scripts/build-catalog.mjs` (dead bold-word cleanup). Corrected a stale
> "Known drift" bullet claiming FINALE has no `KEYWORD_GLOSS` row — it's had
> one since 2026-09-02 (the same day the drift note was written), verified
> via `node --test scripts/content-drift.test.mjs` (11/11 green, confirms no
> orphaned atlas row and no unglossed registry keyword) — exempt from the KB
> gate as a pure doc-accuracy fix, per the skill's REMOVE carve-out. Fixed a
> real parser bug in `scripts/axio-mcp-server.mjs`'s `parseKeywordAtlas`: the
> "System terms" table's 2-column header (`term | what it is`) wasn't
> recognized as a header row (only the label "keyword" was), so `axio_
> overview`/`axio_keywords` counted it as a bogus 70th registry entry — this
> is what caused the "70 rows vs ~45-50 visible rows" reconciliation ask;
> true count after the fix + CURDLE retirement is 68 (confirmed by a direct
> reparse of the file; the live MCP tool session hadn't restarted to pick up
> the script edit as of this writing). Ran the rider-inclusive carrier sweep
> the 2026-09-04 `/adjust-cards` loop-call asked for across all 11 flagged
> kinds: 9 were false alarms (share a well-carried umbrella keyword, e.g.
> recoil_x→Recoil, or are legitimately badge-exempt, e.g. reap/grant_pip/
> bank_spent_die/reroll_spent/conjure_card); CURDLE was genuine and is fixed;
> CHAIN and OMEN are ALSO genuinely single-carrier (Hue and Cry / The
> Summing Up, both trial) but were deliberately left alone — both anchor a
> load-bearing atlas family (the damage octet / tempo-and-control) rather
> than reading as accidental cruft, so retiring them is a card-authoring
> call for `/adjust-cards`, not a keyword-registry call; re-filed narrower
> to `plan/AUDIT.md` as `[loop-call]`. KB (kb-query): not queried — every
> action this pass was REMOVE (exempt from the KB gate) or a doc/tooling
> accuracy fix, per the skill's own gate rule (§3 Step 2). Verify: green
> (mechanics 209/209 files · 3337 tests + build; mobile lint + typecheck +
> jest incl. `keywords.test.ts` 13/13; card-editor type-check; root
> `npm test` 122/122 incl. `content-drift.test.mjs` 11/11 and
> `axio-mcp-server.test.mjs`).

> **[adjust-enemies pass 1, 2026-09-05, commit 04d2bf0d]** Created 2 cavern-
> native enemies (The Ninth-Rung Spider, The Spore-Warden) — the `caverns`
> `EnemiesByMap` pool was 10/14 (71%) direct re-treads from `northern-forest`,
> over the skill's >70% sibling-overlap ceiling; now 10/16 (62.5%). Updated 3
> enemies (TheDoorwarden, TheIndex, TheSophist — the three Aporia act bosses,
> W-01) that shipped with NO `portraitAsset` at all since launch (rendering
> the hash-fallback silhouette, not even a shared painting) — backfilled with
> licensed game-icons.net silhouettes (CC BY 3.0 — Delapouite/Lorc), same
> recipe as the W3/W4 batches, truthful provenance recorded. Zero-REMOVE:
> the orphan sweep found none (all 71 production enemies resolve into a
> pool; `TheIncompleteness`/`Sandbag_01` are deliberately-excluded fixtures).
> VITAE-band sweep came back clean (every boss/unique authored `vitae` is
> within ~±26% of the live `ENEMY_VITAE_BASE`/`PER_LEVEL`/`MULT` formula in
> `game-mechanics.constants.ts` — the formula was already rebaselined
> 2026-09-02 past the original overhaul prompt's §5.1 table, so a naive
> comparison against that table would have false-alarmed). Aftermath-prose
> and voice sweeps came back clean/mixed: no thee/thou/thy/thine/ye
> anywhere, but 30/73 roster enemies (41%, mostly the original 2026-07-06
> painting batch) carry no `finalBlowLines`/`causeLines` — real, sized past
> this pass's scope (a `content-curator` job), filed to `plan/AUDIT.md` as
> `[content]` rather than actioned partially. KB research (kb-query):
> `kb_find_games`/`kb_search`/`kb_overview` returned no on-point doctrine for
> a numeric sibling-pool overlap ceiling specifically (not a gap in this
> tick's search — the corpus genuinely has no roster-shape doc that granular);
> grounded the caverns CREATE in the repo's own established precedent for
> this exact fix (the W3/W4 backfills) plus Mage Knight's per-site-type
> monster-deck model (KB: `mage-knight`, already `/adjust-enemies` §3's own
> citation for enemy design) — a site earns its own bestiary rather than
> reusing a neighbour's wholesale. Verify: green (mechanics 209/209 files ·
> 3337 tests + build; mobile lint + typecheck + jest + assets:check +
> art:test).

> **[adjust-equipment pass 1, 2026-09-04, commit 934160bb]** Zero-CREATE,
> zero-REMOVE pass — updated 5 consumables (`focus-vial`, `heart-draught`,
> `body-elixir`, `resonance-crystal`, `greater-resonance-crystal`) that
> shipped with none of `healAmount`/`effectId`/`inlineEffect` set, so
> `useConsumableEffect` silently applied nothing on use (23% of the
> 22-consumable library was flavor text with no mechanical payload). Wired
> each to the closest existing library effect (`buff_accuracy_up`,
> `buff_status_chance_up`, `buff_damage_reduction`, `buff_all_stats_up` ×2,
> the "greater" one at `intensityOverride: 2` so it's a felt difference per
> THE BIG NUMBERS REWRITE). KB search (`kb-query`) returned no on-point
> prior art — this is an implementation-completeness bug, not a design
> question — so the grounding is the repo's own established
> closest-analogue precedent (`revive-crystal`/`phoenix-tear`, already in
> this file) plus `component-clarity.okf.md` (an item's promised effect
> must be legible/real). Added `dead-consumable-payload.engine.test.ts`
> (50 tests) — a library-wide guard against future dead consumables, not
> just the 5 fixed instances. The 8 signet relics audited clean (no
> dominated pairs; `grantsSignature` differentiates every same-slot pair).
> Real structural finding, NOT actioned: 3 `AccessoryKind`s (head/hands/
> feet) have zero live relics, but the 8 relics are 1:1-locked to the 8
> existing signature skills (load-bearing per `relic.library.ts`), so
> filling that gap means designing new signature-skill combat behavior
> first — a mechanics decision, not a content edit. Filed as `[loop-call]`
> to `plan/AUDIT.md`; this is also the structural diagnosis of the pending
> `[HIGH]` mid/late-equipment row in `plan/CRITIQUE.md` (cross-referenced
> there, left open). Verify: green (mechanics 209/209 files · 3321 tests,
> mobile 24/24).

> **[adjust-cards pass 1, 2026-09-04, commit 24978555]** Zero-CREATE,
> zero-REMOVE pass — full-library reachability, duplicate, aspect-thirds,
> and FREE-line sweeps all came back clean (124/124 cards reachable, no
> true duplicates, thirds and FREE-line laws already satisfied). The real
> finding was systemic card-face dishonesty: 11 oath/hex cards' hand-wired
> `persistentEffect` engine hooks (`zoneHas` sites in `combat.engine.ts`)
> were left on pre-THE-BIG-NUMBERS-REWRITE numbers (or, in three cases, a
> stale/unrelated effect, or a missing hook entirely) after their printed
> text was rewritten 2026-09-02 — `paid-summary-honesty.engine.test.ts`
> only covers spell PAID lines, not oath/hex `persistentEffect` prose, so
> the drift was invisible to CI. Fixed all 11 (the-untended-garden,
> the-red-ledger, joint-and-several, the-sextons-count,
> the-congregation-below, every-stone-an-oath, caltrops-under-the-snow,
> the-assize-bell, writ-of-attainder, choirbone-reliquary, the-long-amen)
> so the engine now applies what the card face prints; trimmed
> the-sextons-count's unfired TWIN clause rather than rush a wire (see
> AUDIT.md loop-call). Added 6 new hermetic e2e cases for previously
> untested hooks and rewrote 4 that were pinning the old wrong numbers.
> Also cleaned `combat.starter-deck-presets.ts`'s header/comment, which
> still described the repealed 18/30/45 size pins and ≤4-copies rule as
> live law. Filed 3 loop-calls (dead-hook cleanup, TWIN re-wire, keyword
> carrier audit) to `plan/AUDIT.md` rather than scope-creep this pass.
> Verify: green (mechanics 208/208 files · 3271 tests, mobile, card-editor
> type-check).
