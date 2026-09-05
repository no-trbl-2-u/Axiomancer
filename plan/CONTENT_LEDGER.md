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
| keywords | `skills/adjust-keywords.md` | never | - | 0 |
| npcs | `skills/adjust-npcs.md` | never | - | 0 |

## Log

Newest first. One entry per `/adjust-*` tick:

```
> **[adjust-<category> pass N, <ISO-date>, commit <sha>]** <one-line:
> what shipped — e.g. "created 2 cards (Grave theme), retired 1
> (never drafted, superseded by <card>), updated 1 (pricing drift
> after VERB_POINTS change)".>
```

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
