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
| cards | `skills/adjust-cards.md` | never | - | 0 |
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

(No entries yet.)
