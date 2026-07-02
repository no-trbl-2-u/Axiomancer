# Phase 129 — Loot-cache reward depth (real loot/relic table)

> Promoted via `/oversight` 2026-06-16 from expand pass 78 [score 5.5].

## Outcome

The Reliquary (`app/cache/index.tsx`) delve/probe/seal flow already
ships, but the rewards it surfaces are placeholder-grade: the
authored treasure pools (`state/exploration-maps/event-pools.ts`)
hand the cache a fixed roster of base-rarity gear built by
`templateToEquipment` (always `rarity: 'common'`, `modifiers: []`)
plus a flat shilling count. Every visit yields the same three items
at the same flat power. This phase surfaces a **real, rolled
loot/relic reward table** at cache begin — consuming the engine's
own item factory (`dropItemWithAffixes`, `equipmentTemplates`,
`uniqueTemplates`) so caches drop level-appropriate equipment with
rolled rarity and affixes, with a chance at a unique relic, instead
of static common gear.

After this phase a player who opens a cache pulls items whose rarity
and affixes vary visit to visit (seeded), scaled to their level, and
occasionally a unique — the push-your-luck depth the encounter was
built for.

## Engine truth consumed (NOT engine-gated)

The expand candidate hedged "if engine-gated, stop with an exact
export blocker." It is **not** gated: `axiomancer-mechanics` 0.21.0
exports a full item factory:

| Export | Use |
| --- | --- |
| `equipmentTemplates` / `getTemplatesBySlot` | the relic table's draw pool |
| `uniqueTemplates` | the rare-relic table |
| `dropItem(templateId, playerLevel, rarity?, rng)` | rolls a real Equipment with engine-rolled rarity + modifiers |
| `EquipmentTemplate.requiredLevel` | level-gate filter (factory throws below it) |

Note: `dropItemWithAffixes` is exported by `Items/index` but is NOT
re-exported at the package root in 0.21.0 (runtime `undefined`), so
the root-available `dropItem` — which still rolls rarity via the
engine's `RARITY_WEIGHTS` table and rolls modifiers — is the deepest
engine-truth roll reachable. Documented in the `loot-table.ts`
module docstring.

The factory throws if `playerLevel < template.requiredLevel`, so the
table filters the draw pool by the player's level before rolling.

## What ships

- **`state/cache/loot-table.ts`** — `rollCacheLoot(opts)`: a pure,
  seeded loot/relic roller. Given player level, a seed, and a tier
  (`modest` | `rich`), it:
  - filters `equipmentTemplates` to those `requiredLevel <= playerLevel`,
  - draws 1–N templates (tier-scaled count),
  - rolls each via `dropItemWithAffixes` (rarity left to the engine's
    weight table, affixes rolled),
  - on a `rich` tier, rolls a unique-relic chance against
    `uniqueTemplates` (level-filtered) and, on a hit, appends a
    `rarity: 'unique'` drop,
  - returns `readonly Item[]` — fully engine-shaped, deep-cloneable
    by the existing cache begin path.
  - Deterministic: same (level, seed, tier) → same items. A
    mulberry32-style PRNG seeded from the cache seed drives every
    draw + the engine rng callback, so tests pin exact drops.
  - Empty-pool safety: if no template clears the level gate (level 0
    edge), returns `[]` and the cache falls back to currency only.

- **`beginLootCacheAction` (`state/cache/store-actions.ts`)** gains a
  `lootTable?: { tier: 'modest' | 'rich' }` option. When present (and
  no explicit `items` override is passed), it reads `player.level`,
  resolves the seed through the existing minigame-seed precedence, and
  rolls `rollCacheLoot` to populate the cache's items. Explicit
  `items` still win (dev paths, authored set pieces).

- **Gameplay wiring (`state/actions.ts`)** — the treasure-node
  loot-cache branch opts into the rolled table: the locale's authored
  roster is replaced by a `rich`/`modest` rolled set keyed on the map
  (northern-forest = `rich`, fishing-village = `modest`). Currency
  from the event payload is preserved.

## Decisions made upfront — DO NOT ASK

- **Roll at begin, not at claim.** The cache engine deals in item
  REFS captured at `createLootCacheSession`; the items must exist
  before the session is built. "At cache claim" in the candidate is
  satisfied: claim is when the rolled items land in the inventory.
  Rolling at begin keeps the per-layer loot summaries truthful.
- **Engine owns rarity.** We pass no forced rarity to
  `dropItemWithAffixes`, letting the engine's `RARITY_WEIGHTS` table
  decide — that IS the loot table the candidate asks for. Tier only
  scales item COUNT and the unique-relic chance.
- **Unique relics gated to `rich` tier** with a 12% per-cache chance,
  drawn from level-eligible `uniqueTemplates`. Keeps uniques special.
- **Deterministic PRNG (mulberry32).** Same seed → same drops, so the
  flow stays hermetic-testable and replay-stable, matching every
  other mobile minigame's seed discipline.
- **Fixed rosters retired from the rolled path** but the static
  `treasurePool(... , items)` signature stays (dev/common pools still
  use it). No engine-shape change.
- **Level-0 / empty-pool → currency-only.** No crash, graceful.

## Pages × tests matrix

| Surface | Test |
| --- | --- |
| `rollCacheLoot` determinism + level gate + tier scaling + unique chance | `state/cache/__tests__/loot-table.test.ts` |
| `beginLootCache({ lootTable })` populates rolled items; explicit `items` still win | `state/e2e/cache.loot-table.engine.test.ts` |
| existing cache flow unaffected | `state/e2e/cache.flow.engine.test.ts` (unchanged, must stay green) |

## Verify gate

`npm run verify` (lint 0 errors + typecheck + full jest). Hermetic
test confirms non-currency, rolled-rarity reward shape on cache
claim.

## Commit body template

```
feat: loot-cache reward depth — phase 129

- rollCacheLoot: seeded engine-truth loot/relic table
- beginLootCache lootTable option rolls level-scaled drops
- treasure nodes drop rolled rarity+affix gear, not static commons

Decisions:
- engine owns rarity (RARITY_WEIGHTS); tier scales count + unique chance
- roll at begin (refs captured pre-session); claim lands them

Closes #<phase-issue>
```

## DoD

`[ ]` → `[x]` on the Phase 129 row in `01_build_plan.md` with the
commit hash, same commit family.

## Follow-ups (out of scope)

- Currency scaling by tier/level (this phase keeps event currency).
- Per-locale relic flavor pools (engine ships one flat template set).
