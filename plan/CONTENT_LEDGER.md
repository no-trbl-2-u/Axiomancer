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
| equipment | `skills/adjust-equipment.md` | never | - | 0 |
| enemies | `skills/adjust-enemies.md` | never | - | 0 |
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
