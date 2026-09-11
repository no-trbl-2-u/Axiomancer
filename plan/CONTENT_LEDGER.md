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
| cards | `skills/adjust-cards.md` | 2026-09-11 | 01629acf | 6 |
| equipment | `skills/adjust-equipment.md` | 2026-09-11 | da51e629 | 6 |
| enemies | `skills/adjust-enemies.md` | 2026-09-11 | e57f9f63 | 6 |
| keywords | `skills/adjust-keywords.md` | 2026-09-11 | ef883fc9 | 6 |
| npcs | `skills/adjust-npcs.md` | 2026-09-10 | 47bcda82 | 5 |

## Log

Newest first. One entry per `/adjust-*` tick:

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
