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
| cards | `skills/adjust-cards.md` | 2026-09-04 | 24978555 | 1 |
| equipment | `skills/adjust-equipment.md` | 2026-09-04 | 934160bb | 1 |
| enemies | `skills/adjust-enemies.md` | 2026-09-05 | 04d2bf0d | 1 |
| keywords | `skills/adjust-keywords.md` | 2026-09-05 | bf6223f1 | 1 |
| npcs | `skills/adjust-npcs.md` | 2026-09-05 | f0a2891f | 1 |

## Log

Newest first. One entry per `/adjust-*` tick:

```
> **[adjust-<category> pass N, <ISO-date>, commit <sha>]** <one-line:
> what shipped — e.g. "created 2 cards (Grave theme), retired 1
> (never drafted, superseded by <card>), updated 1 (pricing drift
> after VERB_POINTS change)".>
```

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
