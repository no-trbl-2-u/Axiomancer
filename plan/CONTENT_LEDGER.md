# Content lifecycle ledger

> Tracks the last `/adjust-*` pass per per-item content category.
> Populated by the five `adjust-*` skills; read by `/march` §3b (the
> content-lifecycle gate) to pick the stalest qualifying category.
> Not a queue — nothing drains it; each pass just updates its own row
> and appends a log entry below. See `skills/march.md` and the
> `skills/adjust-*.md` family for the contract.
>
> The log keeps only recent passes (at most 3 per category; the rule
> lives in each `skills/adjust-*.md` Step 4). Older entries (every pass
> before each category's latest, as of 2026-09-25) are verbatim in
> `plan/archive/CONTENT_LEDGER_<YYYY>.md`.

## Categories

| category | skill | last pass | commit | pass count |
|---|---|---|---|---|
| cards | `skills/adjust-cards.md` | 2026-09-25 | 08cc633d | 19 |
| equipment | `skills/adjust-equipment.md` | 2026-09-25 | 4d21e8ee | 19 |
| enemies | `skills/adjust-enemies.md` | 2026-09-25 | be37a6a3 | 19 |
| keywords | `skills/adjust-keywords.md` | 2026-09-26 | 2b289bb2 | 19 |
| npcs | `skills/adjust-npcs.md` | 2026-09-26 | 27bd4d2d | 19 |

## Log

```
> **[adjust-npcs pass 19, 2026-09-26, commit 27bd4d2d]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE. One new finding, filed rather than shipped.
> `/march` dispatched this through Step 3b. `npcs` (`1d5f4bcc`, 86 commits
> behind HEAD `27bd4d2d`) was the stalest qualifying category. Deploy
> green (verify-mechanics and verify-mobile both passed at `27bd4d2d`).
> There were no `[ ]` phase rows. The growth floor was clear (`dd204684`
> touched `src/World` today). Critique wasn't due: 10 commits, under 24h
> since pass 53.
>
> **Step 1 audit, run fresh.** Six commits since pass 18 touch the NPC
> surface. Four are trim T2a–T5 (barrel/export cleanup; NPC content itself
> is unchanged). The other two are map revamp M3a (`dd204684`, `db6af24b`),
> which added **the Breakwater**, now the new-game start (D27), with
> `npcs: []`. Every other signal matches pass 18: 21 staged NPCs, none
> orphaned, no flat `DialogueMap` NPCs (the three `dialogue: {` hits are
> map-event payloads), no `teachCard` in NPC content. Coastal-Village's
> 3-NPC `unstagedNpcs` backlog is still blocked on `openShop`, and the
> three Northern-Continent 1-NPC maps are still behind the story-overview
> open question (6) `[gap]` row.
>
> **The new finding: the Breakwater has 0 staged NPCs.** It trips "map
> with fewer than 2 staged NPCs → CREATE". It was not built here, because
> T's D29 (`plan/2026-09-25-refactor-strategy.decisions.md`) rules "No
> new enemies, NPCs or events in the map PRs … New content waits for the
> story-dependent revamp". The story overview also marks "What happens
> here" as open, and hard rule 3 applies. D29 sends gaps like this to
> this steward to *file*, so it went into the existing Breakwater
> `[needs-user-call]` row in `plan/AUDIT.md` as call (5). The row also
> notes the knock-on effect: a new game now reaches its first NPC and
> quest (Old Marrow, Phase 53c) only after the whole map, and the
> reachability test pins `startMap: 'fishing-village'`. It offers three
> options, including staging an existing NPC, a staging-only move. The
> M3b session with T is the natural place to decide.
>
> **KB run** (for the filing's receipts; there was no CREATE/UPDATE to
> gate). `kb_search` found no dialogue- or start-town-NPC prior art (an
> expected miss for this corpus; no wishlist filed, since the filing
> stands without it). It did find onboarding rows treating guided first
> play as essential (Spirit Island, Aeon's End, Arkham Horror LCG).
>
> No code changed, so the verify gate wasn't needed; deploy:check runs
> after push.

> **[adjust-keywords pass 19, 2026-09-26, commit 2b289bb2]** Zero-CREATE,
> 4 UPDATE, zero-REMOVE. `/march` dispatched this pass through the
> content-lifecycle gate (Step 3b). All five categories were past the
> 15-commit bar (79-86 commits each); `keywords` (last pass 2026-09-24) was
> the stalest. Deploy was green at `2b289bb2`, no phase was pending, and the
> critique gate was not due (9 commits, under 24h).
>
> **Fresh angle:** this is the first pass since the TRIM THE FAT commits
> touched the keyword surface (T2a `2ef8f790`/`0351300e`/`cb178978`, T2b
> `d565910d`, T3 `8ef3c7da`, T5 `e6c7fb75`). `card-expert` (consult mode)
> audited the trim fallout.
> - Structural wiring is clean: 50 kinds, all with a `mechanicText` case,
>   none falling through to the default arm.
> - GLYPHS, deleted-synergy, luck and stat-band references are gone from the
>   atlas, mobile and the card editor.
> - The ban list is intact. `2ef8f790` dropped only the scan of a deleted
>   field, not a banned id.
>
> **Shipped (UPDATE):**
> 1. Synced the FORGE, GHOST and WILD/X atlas rows to `KEYWORD_GLOSS`. They
>    still described the deleted drafted-die / fate-tap model, and the
>    atlas's rule is that the code wins.
> 2. `docs/effects.md`: the resist-roll table and the
>    `resolveEffectApplication` section now say every effect lands as
>    printed (Phase 80 + D12). The dead `resistedBy`/`resistDR` fields are
>    marked legacy and unread.
> 3. Mobile TRINKET tooltip: dropped "save bonus" (saves were cut in D14).
>    Fixed the stale `SUPPORT_KEYWORD` comment claiming `debuff_curse`
>    still resolves (it has no applier since T2a).
> 4. `skills/adjust-keywords.md` Step 1: the carrier bar is now "fewer than
>    2", matching the atlas's ratified keep rule (overhaul §6.1). The skill
>    said 3 and the doctrine outranks it.
>
> **Carrier counts:** pass 18's IMMOLATE count was wrong (it has 6
> carriers, not 2). Ten keywords sit at exactly 2 carriers (OMEN, ECHO,
> REPLAY, PROLONG, CHAIN, EXECUTE, PIERCE, AMBUSH, FINALE, EVENTIDE). All
> meet the doctrine bar, so none were retired.
>
> **Step 1b KB angle: Blood** (`kb:dawncaster/keywords/blood.okf.md`,
> substitute payment in HP). `fate` was our only blood-as-substitute
> payment and has been inert since T2b. Re-hooking it needs X dice in
> ordinary play, and the Spec 33 tray never rolls any. So the honest small
> fix remains the `/adjust-cards` fold, and this was filed, not minted.
> Reliable (`kb:dawncaster/keywords.csv`) is noted as the growth route for
> the conditional keywords at 2 carriers.
>
> **Residue:** added to `plan/AUDIT.md`'s T2b debt row:
> - nine inert support buffs;
> - `debuff_curse` / `debuff_nettle_sting` have no applier, and the enemy
>   roll-penalty path gets no input;
> - dead `resistedBy`/`resistDR`;
> - Tier-1 `MIND_MARK_ID` leftovers;
> - seven zero-carrier mechanic kinds;
> - mobile never sends `omenClaim`.
>
> The `fate` card faces stay on that row's existing `/adjust-cards` route.
> The skill still treats a missing `kb:` receipt as a finding (Step 1 and
> hard rule 5), but the atlas says receipts are optional. That conflict is
> left for `/oversight`.
>
> Verify: green (mechanics verify, mobile verify, card-editor type-check,
> root `npm test` incl. content-drift 11/11).
```

```
> **[adjust-enemies pass 19, 2026-09-25, commit be37a6a3]**
> Zero-CREATE, zero-UPDATE, zero-REMOVE pass — dispatched autonomously
> by `/march`'s content-lifecycle gate (Step 3b): `enemies` (`6f13b2d0`
> 2026-09-24T10:43:06Z, 28 commits behind HEAD `e67f5e46`) was the sole
> qualifying category this tick past the 15-commit/36h threshold —
> `cards` (`08cc633d`, 1 commit) and `equipment` (`4d21e8ee`, 1 commit)
> had just ticked this same session and did not qualify; `npcs`
> (`1d5f4bcc`, 3 commits) and `keywords` (`13d3f1f4` — the actual
> shipping commit, not the ledger's stale `c57a7e73` self-ref pass 19
> equipment already flagged — ~10h/6 commits) were both under
> threshold either way. Deploy confirmed green (`npm run deploy:check`
> at HEAD `e67f5e46`: docs/plan-only tick, no gated workflow, nothing
> to block on). No phase work pending (`plan/steps/01_build_plan.md`
> has zero `[ ]` rows). Growth floor clear (`src/World` commits within
> 7 days).
>
> **Step 1 audit — fresh, not re-cited:** `git diff 6f13b2d0..HEAD --
> axiomancer-mechanics/src/` returns byte-zero — not one line changed
> anywhere in the mechanics source tree across all 28 intervening
> commits (they were story-overview drafting, a mobile late-game-hub
> canvas-transform fix, and the other four stewards' own zero/near-
> zero-diff passes). Re-derived all seven structural signals from
> scratch against the live tree rather than trusting that emptiness:
> pool floor / sibling overlap unchanged (fishing-village 13,
> northern-forest 39, caverns 16, northern-city 8, connecting-river 5,
> town-across-river 4, the-capital 8, aporia-colonnade/archive 8/8,
> aporia-proof 11; tightest sibling pair northern-city/the-capital
> 5/8 = 62.5%, under the 70% ceiling). Orphans: `TheIncompleteness`
> (explicit never-enters-EnemiesByMap design requirement) and
> `Sandbag_01` (documented test fixture) remain the only two enemies
> outside every pool — both intentional, not REMOVE candidates
> (confirmed via a full `EnemyLibrary`-vs-`EnemiesByMap` diff, not a
> re-cite). Deck law: all 10 distinct `card(...)` ids independently
> cross-referenced against `src/Cards/library/*.cards.ts` (choir,
> grave, relics, rot, starters, trial) — all resolve. Keyword kinds: all
> 11 `kind:` values used in `enemy.library.ts` match
> `ENEMY_KEYWORD_KINDS` (`enemy-keywords.ts:92-103`) exactly, zero
> stray/missing. Portrait collisions: 77 `portraitAsset` values, zero
> duplicates (`sort | uniq -d` empty). VITAE band: 21 explicit `vitae:`
> overrides, byte-identical to pass 16/18's measured set. Aftermath
> prose / voice: zero `\b(thee|thou|thy|thine|ye)\b` hits. Loot table:
> all 22 distinct `drop('...')` ids diffed id-for-id against
> `consumable.library.ts`'s `id:` set — zero missing, zero orphaned.
> All seven signals clean, independently re-derived rather than copied
> forward from pass 18.
>
> **Step 1b widened KB check:** Step 1 returned nothing, so ran the
> floor-raise. Tried a fresh angle not in passes 9-18's search history:
> `kb_find_games(better_if_label: 'combat-resolution')` — surfaces
> `kingdom-death-monster` and `bloodborne-the-card-game`, both
> monster/enemy-centric campaign or hunt games, neither previously
> queried by any `/adjust-enemies` pass. `BoardGames/patterns/
> combat-resolution.okf.md`: the pattern's actual content is about
> hidden-information/dice-randomness communication (Dune Imperium's
> hidden combat power, KDM's unclear point-of-decision randomness
> feedback) — doesn't transfer, our threat telegraphs are already
> fully visible to the player pre-decision, nothing hidden to
> communicate better. KDM's own `better-if.okf.md` (needs_followup,
> low confidence): onboarding/campaign-bookkeeping/randomness-
> communication asks, nothing about monster/AI-deck variety or
> roster shape. Bloodborne's `better-if.okf.md` flags its own thin
> base-game encounter/Final Boss pool as a repeat-play risk — the
> generic "same three fights" thinness shape the skill already
> instructs this steward to watch for — but not a differentiated new
> finding here: Step 1's own pool-floor/sibling-overlap check this
> same pass came back clean (no map under floor, no pair over the 70%
> ceiling), so there is no concrete gap in *our* roster for that
> complaint to land on. No new citable gap surfaced.
>
> A genuine zero-diff pass — the strongest reading yet, since unlike
> prior zero-diff passes (which at least saw comment-only or unrelated
> mechanics commits) this window's 28 commits touched zero bytes of
> `axiomancer-mechanics/src/` at all. Commit is the ledger bump only,
> per skill §5 failure mode 4. Nothing filed to `PHASE_CANDIDATES.md`
> or `AUDIT.md` — no map-scale finding and no owner-flavored call
> surfaced this pass.
>
> Verify: green (mechanics 231 files/3746 tests + build; mobile
> lint/typecheck/jest/asset/critique-drive, exit 0).
```

```
> **[adjust-equipment pass 19, 2026-09-25, commit 4d21e8ee]**
> Zero-CREATE, zero-UPDATE, zero-REMOVE pass — dispatched autonomously
> by `/march`'s content-lifecycle gate (Step 3b): `equipment`
> (`bdcd4c7e` 2026-09-24T10:42:53Z, 27 commits behind HEAD `5a69d6a9`
> 2026-09-25T06:49:04Z, ~20.3h) and `enemies` (`6f13b2d0`
> 2026-09-24T10:43:06Z, 26 commits) both qualified past the
> 15-commit/36h threshold; `equipment` was stalest by last-pass
> timestamp (13s earlier) and also leads the fixed rotation order.
> `cards` (`08cc633d`, 1 commit) and `npcs` (`1d5f4bcc`, 3 commits) had
> just ticked and did not qualify; `keywords`'s ledger-recorded commit
> (`c57a7e73`) does not resolve in this tree (a stale self-ref from
> pass 18 that never got its follow-up correction), so staleness was
> computed against its actual shipping commit `13d3f1f4`
> (2026-09-24T22:42:56Z, 4 commits) — nowhere near the threshold either
> way; flagging the dangling ref for whichever `adjust-keywords` pass
> next touches that row. Deploy confirmed green (`npm run deploy:check`
> at HEAD `5a69d6a9`: no gated workflow yet within the grace window,
> docs/plan-only tick, nothing to check). No phase work pending
> (`plan/steps/01_build_plan.md` has zero `[ ]` rows). Growth floor
> clear (`src/World` commits within 7 days).
>
> **Step 1 audit — fresh, not re-cited:** re-derived every structural
> signal against the current tree. Slot coverage: 2 weapons, 2 armor, 7
> accessories across all 6 live `AccessoryKind`s (amulet ×1, charm ×2,
> ring ×1, head ×1, hands ×1, feet ×1) — no kind empty, each
> capacity-1 slot still offers 2 picks, accessory (capacity 3) offers
> 7. Dominance: no same-slot relic pair is strictly worse on every
> `statModifiers` value with no offsetting `grantsSignature` difference
> (weapon/armor pairs tie in magnitude but differ in signature by
> design). Signature drift: all 11 `grantsSignature` values resolve
> live against `SignatureSkillId` in `combat.encounter.types.ts` (1:1,
> no orphans). Consumable `effectId` resolution: all 15 referencing
> consumables resolve against `buffs.library.json`/`debuffs.library.json`
> (`buff_cleanse`, `buff_cleanse_minor`, `buff_accuracy_up` ×2,
> `buff_status_chance_up`, `buff_stoic_resolve`, `buff_haste` ×2,
> `buff_liars_gambit`, `buff_all_stats_up` ×2, `buff_invincibility`,
> `buff_abyssal_presence`, `buff_regeneration`, `buff_damage_reduction`,
> `buff_critical_rate_up`, `buff_haste_surge`, `buff_phoenix_vigor`).
> Shop/reward reachability re-derived from scratch (not re-cited): all
> 10 sellable relics (the Suppliant's Ring is the deliberate
> first-node grant, never sold) appear in >=1 village-market
> `shop.wares` block in `content.ts`; all 22 consumables appear in
> exactly one `drop(...)` row across `enemy.library.ts`'s loot tables
> (id-for-id diff against `consumableLibrary`, zero missing, zero
> orphaned loot ids) as well as `rollCacheReward`'s uniform draw over
> the full library (The Reliquary). Re-checked the shared-`effectId`
> co-occurrence bug class (pass 11/14/15/17/18): `focus-vial`/
> `hunters-elixir` (`buff_accuracy_up`) and `berserker-brew`/
> `quicksilver-vial` (`buff_haste`) remain the only same-effect pairs,
> and neither co-occurs in a single shop ware block or enemy loot row —
> reconfirmed, not re-opened. A genuine zero-diff pass on the data
> itself, so the Step 1b widened KB check ran.
>
> **Step 1b widened KB check:** queried a fresh angle — Dawncaster's
> own `Equipment` card type (`kb_cards` on "equip": Aegis, Battle
> Station, Blaster, Decommission, Legplates, etc.) rather than the
> `relic`/`itemization` boardgame tags pass 17/18 already exhausted.
> That corpus's Equipment is a durability-tracked, drawn-into-deck card
> type with activate/reactivate/Frenzy triggers — a materially
> different design (procedural, in-deck, consumable-durability) from
> our lean persistent signet-relic shape, and adopting any of it would
> mean resurrecting exactly the retired procedural/effect-channel
> system §4 rule 3 forbids without a deliberate design call. No
> transferable gap surfaced. Also re-ran `kb_find_games` against
> `deck-building`/loot-adjacent titles (Aeon's End, Mage Knight, Slay
> the Spire board game) — no indexed `better-if` complaint maps onto a
> concrete gap in the 11-relic/22-consumable set; Slay the Spire board
> game's better-if doc is entirely onboarding/teardown/pacing, nothing
> itemization-shaped. No new corpus angle surfaced a finding.
>
> Verify: green (mechanics 231 files/3746 tests + build; mobile
> lint/typecheck/jest/asset/critique-drive). Commit only the ledger
> bump — no code diff this pass.
```

```
> **[adjust-cards pass 19, 2026-09-25, commit 08cc633d]** Zero-diff
> pass — audit re-confirmed byte-identical to pass 18, no new CREATE/
> UPDATE/REMOVE, ledger bump only. Dispatched autonomously by `/march`'s
> content-lifecycle gate (Step 3b): `cards` (`f155b027`
> 2026-09-24T08:52:50Z, 27 commits behind HEAD `35133bf8`) was the
> stalest qualifying category this tick — `equipment` (`bdcd4c7e`,
> 25 commits) and `enemies` (`6f13b2d0`, 24 commits) both qualified too
> but were less stale; `keywords` (`13d3f1f4`, same-day) and `npcs`
> (`1d5f4bcc`, same-day) had just ticked and did not qualify. No phase
> work pending, deploy green, growth floor clear (recent `src/World`
> commits exist).
>
> **Step 0:** re-read `axiomancer-mechanics/CLAUDE.md` fresh — THE BIG
> NUMBERS REWRITE still governs (no CQI, no rank-bands, no win-rate
> curve, no status-engagement floor); `axiomancer-mechanics/VISION.md`
> and `plan/bearings.md`'s LOCKED MECHANICS section (Conviction, Surge,
> Dice — never removed/no-op'd) reconfirmed unchanged.
>
> **Step 1 structural audit — fresh, not re-cited:** `git log
> f155b027..HEAD -- axiomancer-mechanics/src/Cards/cards.library.ts
> axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts
> axiomancer-mechanics/src/Cards/cards.sandbox-sets.ts
> axiomancer-mechanics/src/Combat/combat.deck-draft.ts
> axiomancer-mechanics/src/Cards/cards.allies.ts
> axiomancer-mechanics/src/Cards/cards.haunts.ts
> axiomancer-mechanics/src/Cards/library/` returns zero commits across
> all 27 commits since pass 18 (`git diff --stat` over the same paths:
> empty). Re-ran the full card-surface e2e trio fresh:
> `pricing.engine.test.ts` 263/263, `curated-library.engine.test.ts`
> 14/14 (FREE-line + reachability), `deck-presets.engine.test.ts` 9/9
> (aspect-thirds) — all green, byte-identical to pass 18. `axio_overview`
> reconfirms 134 cards / 8 themes / 72 keywords unchanged. Ran two extra
> checks not covered by the standing e2e trio: an orphan scan (every
> card cross-referenced against every preset, `COMBAT_REWARD_POOL`, and
> `STARTING_CARD_IDS`) turns up only the 5 curse cards, which are
> enemy-injected via `enemy.library.ts`/`combat.enemy-cards.ts`/
> `combat.enemy-decks.ts` by design, not orphaned; and a per-theme
> aspect tally, which is uneven by raw count (e.g. choir leans heart
> 10/5/6, curse is deliberately tiny) but that imbalance is legal — the
> surviving 5/5/5 law binds the PRESET decks, which `deck-presets
> .engine.test.ts` already confirms green, not the raw per-theme pool.
> No REMOVE/UPDATE signal from Step 1.
>
> **Step 1b widened audit — fresh angle (four checked, all ruled out or
> covered):** ran a KB cross-reference on mechanic families not yet
> checked by prior passes (pass 18 already ruled out Retain, AOE/
> multi-target, and dodge/evasion — not re-checked here). (1)
> Cost-reduction/discount (Dawncaster Haste/Slow, `kb:dawncaster/
> keywords/haste.okf.md`, `slow.okf.md`) — doesn't transfer: those
> reduce/raise a drawn card's Energy cost, and Axiomancer has no
> per-card Energy cost to modify (cards are powered by dice color, not
> spent Energy); the closest existing analogues (KINDLE/FORGE/pip
> economy) already cover the "make dice go further" fantasy. (2)
> Card-draw-manipulation — already well covered: DRAW, FORETELL, RECALL,
> MILL between them cover Dawncaster's Foretell/Frozen (peek+reorder)
> and Focus/Momentum-style draw triggers (our FALLEN/EVENTIDE/UNMOVED
> threshold-state family already fires free lines off deck/hand state).
> (3) Sacrifice/self-damage-for-value — already fully covered: RECOIL,
> RECOIL_X, and IMMOLATE are Axiomancer's Blood/Darkness analogue, and
> the debt theme is built entirely around this register. (4) Delayed/
> echo effects — already covered: ECHO, REPLAY_LAST, REPRISE, and
> PROLONG (DoT-specific) cover Dawncaster's Echo/Lasting/Rebound
> register. One genuine, KB-grounded gap surfaced along the way and
> logged separately (not from the four assigned angles): no mechanic
> lets a card offer the player a CHOICE among revealed/generated
> options (`kb:dawncaster/keywords/delve.okf.md` src-001, "Select 1 of
> 3 randomly selected cards"; `kb:slay-the-spire/cards/0111-discovery-
> discovery`, "Choose 1 of 3 random cards to add into your hand").
> Confirmed via grep across `CardSpecialMechanic` (50+ kinds, no
> choice-among-options member) and `axio_keywords` (72 rows, all
> single-resolution). Real, but structurally LARGE — needs a new
> `CardSpecialMechanic` kind, a transient combat-state shape, a mobile
> UI modal (none exists today), and the full 12-step keyword wiring
> checklist — past this steward's ship-small ceiling (THE GROWTH FLOOR
> ¶2). Filed as `plan/PHASE_CANDIDATES.md` `[score 3.0]` "No mechanic
> lets a card offer the player a choice among revealed/generated
> options" so a future pass doesn't re-propose it from scratch; pass
> 17's standing `[score 3.0]` in-combat/temporary card-upgrade candidate
> was also reconfirmed still open and correctly sized past this
> steward's ceiling — no code has landed against `card-upgrades.ts` or
> the `CardSpecialMechanic` union in the window.
>
> **Step 2/3:** nothing to ship — zero actionable CREATE/UPDATE/REMOVE
> findings from Step 1 or Step 1b (skill §5 failure mode 4: no
> manufactured change).
>
> Verify: green (mechanics 231 files/3746+ tests + build; mobile
> lint/typecheck/jest/asset/critique-drive; card-editor type-check).
>
> **[adjust-npcs pass 18, 2026-09-25, commit 1d5f4bcc]** Zero-diff pass —
> audit re-confirmed byte-identical to pass 17, no new CREATE/UPDATE/
> REMOVE, ledger bump only. Dispatched autonomously by `/march`'s
> content-lifecycle gate (Step 3b): `npcs` (`f3c09826`
> 2026-09-24T04:44:05Z, 27 commits behind HEAD `13d3f1f4`
> 2026-09-24T22:42:56Z) was the stalest qualifying category this tick —
> `cards` (`f155b027` 2026-09-24T08:52:50Z, 25 commits), `equipment`
> (`bdcd4c7e` 2026-09-24T10:42:53Z, 23 commits) and `enemies` (`6f13b2d0`
> 2026-09-24T10:43:06Z, 22 commits) all qualified too but were less
> stale; `keywords` (real commit `13d3f1f4`, ~4h old — the ledger row's
> recorded hash `c57a7e73` is a stale self-reference from its own
> pending-commit write) had just ticked and did not qualify. Deploy
> confirmed green (`npm run deploy:check` at HEAD `13d3f1f4`: no gated
> workflow yet — docs/plan-only tick, nothing to check). No phase work
> pending (`plan/steps/01_build_plan.md` has zero `[ ]` rows). Growth
> floor clear (`src/World` commits within 7 days, e.g. `bc4ef749`/
> `e8369e19`/`1da16935`), so 3b-pre didn't pre-empt this dispatch. The
> critique gate (`/march` Step 2) did not fire ahead of this tick either
> — only 2 commits and ~8h since pass 49 (`94b6b96f`), under both the
> 12-commit and 24h thresholds.
>
> **Step 0:** re-read `axiomancer-mechanics/CLAUDE.md` fresh — THE STORY
> IS THE OVERVIEW now governs (superseded THE STORY IS THE ROAD that
> pass 17 read; T cleared the road 2026-09-18 and replaced it with an
> over-arching story document in attended sessions 2026-09-23/24). Hard
> rule 3 (don't invent a named character's personhood autonomously)
> stands unchanged and is reinforced by the new doctrine's own "do not
> invent canon beyond the overview" clause. Read the new
> `content/story/story-overview.md` in full: T's prologue, the
> rulings, the per-map place-and-theme table, and the ordered open
> questions.
>
> **Step 1 structural audit — fresh, not re-cited:** `git log
> f3c09826..HEAD -- src/NPCs src/World/Continents src/World/MapEvents
> src/World/types.ts specs/story specs/characters` returns zero
> commits — none of the 27 intervening commits touch the NPC/dialogue
> surface at all (they're story-overview rewrite, a mobile canvas-pivot
> fix, cards/equipment/enemies/keywords steward passes, and an `/expand`
> no-candidates tick). Ran every Step 1 signal fresh anyway:
> - All 21 `const *: NPC` entries unchanged in count and each still
>   referenced from exactly one map's `npcs:` array — no orphan.
> - Zero legacy `dialogue: {` (flat `DialogueMap`) usage; every NPC
>   still on `dialogueTree`.
> - Zero `teachCard` usage in NPC content; `startQuest` names unchanged
>   from pass 17 and type-checked green by the verify gate below.
> - Coastal-Village's 3-NPC `unstagedNpcs` backlog (Tide-Shopkeeper,
>   Dockworker's Union Leader, Merchant's Widow) unchanged — still
>   blocked on the missing `openShop`-shaped effect surface, re-confirmed
>   against the current `DialogueChoice.effect` shape in
>   `src/NPCs/types.ts`.
> - Northern-Continent's three 1-NPC maps (`caverns`/theDelver,
>   `connecting-river`/theBoatwoman, `town-across-river`/theSweetheart)
>   unchanged; cross-referenced against the new story-overview's map
>   table, which lists "what happens on each middle map" as its own
>   **open question (6)** — this reinforces, not changes, `plan/AUDIT.md`'s
>   `[gap]` row (DECIDED via `/oversight` 2026-09-15, still needs an
>   attended `character-spec`/`story-spec` session before this steward
>   can act): the story doctrine now says explicitly, in its own words,
>   that what these maps need is undecided, not this autonomous tick's
>   call to invent.
> - The new doctrine's "Noted" section flags ~186 legacy dialogue nodes
>   and 21 `boy-*` flags as non-canon text kept only so the build works,
>   and explicitly defers renaming/reconciliation as future engine work
>   — not a Step 1 structural signal (nothing is broken, dead-ended, or
>   misreferenced) and not this steward's call to act on unprompted.
>
> **Step 1b widened check:** Step 1 returned nothing actionable, so ran
> the deeper KB cross-reference before accepting zero-diff. `kb_overview`
> confirms the corpus is unchanged (46 board/card games, 2801 okf docs).
> Fresh-angle `kb_search` runs (`retcon|non-canon|placeholder narrative|
> story rewrite`, scope all; `quest.giver|dialogue.branch|npc.voice`,
> scope boardgames) returned zero matches — the corpus is card/board-game
> reception data and doesn't carry narrative-authoring or story-retcon
> prior art, a documented, accepted miss (skill §3 Step 2) rather than a
> tooling failure. No CREATE/UPDATE is gated on this pass, so no wishlist
> issue filed. Zero-diff confirmed on the widened check too.
>
> **Verify:** green — mechanics (231 test files, 3746 tests, build) and
> mobile (`npm run verify --workspace axiomancer-mobile`).
>
> **Ship:** ledger bump only, no code changes on the NPC surface this
> pass.
>
> **Residue:** none new. The two open items both remain exactly where
> pass 17 left them: the Coastal-Village 3-NPC unstaged backlog stays
> blocked on the missing shop-effect surface, and Northern-Continent's
> three 1-NPC maps stay parked on `plan/AUDIT.md`'s `[gap]` row pending
> an attended `character-spec`/`story-spec` session — now additionally
> cross-referenced against the story-overview rewrite's own open
> question 6, same blocked status, no new AUDIT row warranted.

> **[adjust-keywords pass 18, 2026-09-24, commit c57a7e73]** Zero-CREATE,
> zero-UPDATE, zero-REMOVE pass — dispatched autonomously by `/march`'s
> content-lifecycle gate (Step 3b): `keywords` (`71648d3a`
> 2026-09-23T18:47:44Z, 31 commits behind HEAD `ed4af7e2`
> 2026-09-24T18:43:15Z, ~24h) was the stalest qualifying category — `cards`
> (`f155b027`, 24 commits), `equipment` (`bdcd4c7e`, 22 commits), `enemies`
> (`6f13b2d0`, 21 commits) and `npcs` (`f3c09826`, 26 commits) all qualified
> too (past the 15-commit threshold) but were less stale by last-pass
> timestamp. Deploy confirmed green pre-tick (`npm run deploy:check` at HEAD
> `ed4af7e2`: no gated workflow yet for this docs/plan-only tick — grace
> window, nothing to block on). No phase work pending (Step 3a of `/march`
> empty — no `[ ]` row in `plan/steps/01_build_plan.md`).
>
> **Step 0:** re-read `axiomancer-mechanics/CLAUDE.md` (THE BIG NUMBERS
> REWRITE — no CQI/status-engagement-floor grading), the live
> `docs/keyword-atlas.md` (72 rows, discipline unchanged since the
> 2026-09-02 rewrite), and `docs/retheme-map.json` (NL-8 collision law)
> fresh rather than trusting pass 17's reading.
>
> **Step 1 structural audit — fresh, not re-cited:** `git log
> 71648d3a..HEAD` against the full keyword-surface path set
> (`src/Cards/types.ts`, `src/Combat/combat.cards.ts`,
> `src/Combat/combat.engine.ts`, `src/Effects/**`,
> `axiomancer-mobile/state/combat/keywords.ts`, `docs/keyword-atlas.md`,
> `axiomancer-card-editor/src/data/mechanics.ts`,
> `src/Enemy/enemy-keywords.ts`) is EMPTY — none of the 31 intervening
> commits touched any keyword-surface path. Re-ran every Step 1 signal
> anyway: (1) carrier-count/orphan sweep — every `kind:` literal in
> `CardSpecialMechanic`/`CardRider` (`src/Cards/types.ts`, 55 kinds)
> against every `case '...':` in `combat.cards.ts`'s `mechanicText`
> switch (55 cases): byte-identical 55/55 coverage, zero silent
> `default:` arms, matching pass 17's count exactly; (2) `axio_keywords`'s
> live registry (72 rows across player/enemy/system) matches the atlas
> file exactly, unchanged from pass 17; (3) `node --test
> scripts/content-drift.test.mjs`: 11/11 green, matching pass 17
> byte-for-byte; (4) REMOVE-signal spot-check on three lower-population
> keywords via `axio_cards` — OMEN (2 carriers: The Ducking Stool, The
> Summing Up), IMMOLATE (2 carriers: Confession of Judgment, Distraint),
> TICK (3 carriers: Communion of the Worm, The Feast of All Corruption,
> The Sexton's Bell) — all clear the ≥2-carrier bar, no retirement
> candidate.
>
> **Step 1b widened KB cross-reference:** ran it per this tick's dispatch
> instructions despite the zero-diff Step 1 result. Two fresh angles not
> used by passes 9/11/14/15/16/17 (which already covered Chaos/Order/
> Balance, Stunned/Silenced, Weakness, Frozen, Rally, Synergy, Ward):
> **Momentum** (`kb:dawncaster` glossary — "Whenever you have 5 or more
> Momentum, remove all stacks and draw a card") — same running-tally
> -to-threshold-payoff shape our own CHARGE keyword already drills
> ("A running tally. When it reaches the count printed on the card that
> spends it, that payoff fires free and the tally resets."); a
> near-synonym of an existing keyword, not a gap, so not filed. Traced
> our own engine's `buff_grace_momentum` (`Cards/library/choir.cards.ts`,
> `apocrypha.cards.ts`, `Effects/buffs.library.json`) to rule out a
> silent-arm bug on the same name: `card-keywords.ts:23` maps it to
> `PLEA` and `axiomancer-mobile/state/combat/keywords.ts:74` glosses it
> under `Plea` too — it already folds under PLEA's existing face
> presentation by design (KW-1, 2026-09-02), not an orphaned keyword.
> **Exile/Banish** (`kb:dawncaster/cards/0161-banish-85173`,
> `1047-oblivion-408548`) — an instant-loss-condition card family with no
> analogue in our system (no alternate-loss condition exists at all,
> only alternate WINS via CONDEMN/RELENT); a genuinely different design
> axis, but not a keyword-registry gap on its own terms — an alternate
> LOSS condition is a combat-engine design call (mechanics-expert
> territory), not a card-vocabulary drill, so not filed here. Zero-diff
> confirmed on the widened check too.
>
> **Residue:** `plan/PHASE_CANDIDATES.md`'s `[score 3.0]` Ward
> -interception-hook candidate (filed pass 17) re-confirmed still open,
> not re-filed — same finding, no new information since.
>
> **Ship (Step 3):** none on the keyword surface itself — zero CREATE,
> zero UPDATE, zero REMOVE (zero intervening commits touched the
> surface at all). Ledger bump only.
>
> **Gates:** `npm run verify --workspace axiomancer-mechanics` (231
> files, 3746 tests + build green), `npm run verify --workspace
> axiomancer-mobile` (lint/typecheck/jest/asset/critique-drive suites,
> exit 0), `npm run type-check --workspace axiomancer-card-editor`
> (clean), and `npm test` (root, 218 tests incl. `content-drift.test.mjs`
> 11/11) all green.
```
