# Phase 20 — Retire the procedural equipment library

> Agent-facing brief. Ship without asking; document judgment calls in
> the commit body. Depends on phases 18 (relics are the replacement) +
> 19 (equipment already effect-free).

## Outcome / Why

User-intent phase 3 (remainder): with the 8 relics now the intended
equipment content, delete the **procedural library** and its factory.
Removed:

- `src/Items/equipment.templates.ts` — 56 templates (7 slots × 8).
- `src/Items/unique.templates.ts` — 7 uniques.
- `src/Items/item.factory.ts` — `dropItem`, `dropItemWithAffixes`,
  `dropItemAtRarity`, `rollModifiers`, `resolveModifiers`,
  `previewTemplateAtRarity` / `…AtAllRarities`, `equipmentFromTemplate`,
  `rollCacheLoot`/`CACHE_LOOT_TUNING`/`generateRarityDrop` (the cache-loot
  *equipment* generation path).

The 8 relics (`relic.library.ts`, phase 18) become the whole equipment
content. The modifier catalogue / affix library / item sets / rarity
model are torn down in **phase 21** (this phase removes the *content +
factory* that references them; phase 21 removes the machinery itself).

**Loot surfaces → non-equipment rewards** (planning decision): The
Reliquary (loot-cache), enemy drops, and shops currently mint procedural
equipment via `dropItem`. With the factory gone they yield
**consumables / materials / currency** instead. Relics are a fixed
starting kit, not random loot.

**Success state:** No code path constructs equipment from a template or
rolls rarity/mods. The loot-cache encounter, enemy loot, and shop stock
resolve to consumables/materials/currency and still run green. Mobile
inventory renders relics + consumables; no rarity/affix chrome remains
on a live path. Gates green across mechanics + mobile + card-editor.

## Scope

**Delete (mechanics):** the three files above; their barrel exports from
`src/Items/index.ts` and `src/index.ts` (the factory/template/cache-loot
symbol list — see the phase-map inventory). 

**Rewire loot surfaces:**
- Loot-cache encounter (`World/…` Reliquary) — replace equipment drops
  with a consumable/material/currency reward table. Coordinate with the
  `loot-cache-tuning` doctrine (informed > blind > coward) — the reward
  *kind* changes, the encounter's risk structure should not silently
  regress. If retuning is non-trivial, ship a minimal correct table here
  and flag a `loot-cache-tuning` follow-up.
- Enemy drops (Spec 07 surface) — drop tables that referenced
  `dropItem`/templates now reference consumable/material ids.
- Shops (if any live shop stocks equipment via templates) — stock
  consumables/materials; if a shop truly needs equipment, it sells relics
  by fixed id (no rarity roll).

**Mobile:** `state/actions.ts` equip paths keep working for relics
(phase 18); remove any inventory presenter code that reads
rarity/affix/mod fields for display of *dropped* equipment (there is no
more dropped equipment). `computeEquipDelta` rarity/affix branches can be
simplified now or deferred to 21 — prefer deferring pure type-driven
simplification to 21 to keep this phase's diff about content+loot.

## Reality-check before shipping

Enumerate every live caller of `dropItem` and the cache-loot generators
(grep the repo, incl. `World/`, `Enemy/`, shop code, CLIs, and mobile).
Each caller must be rewired or deleted — a dangling `dropItem` call is a
compile break. The barrel removal couples mobile + card-editor: run both
gates. Card-editor reads `cards.library.ts` (not equipment), but it
imports the `@mechanics` barrel — a removed export it happens to import
would break its type-check.

## Decisions made upfront — DO NOT ASK

- **Relics are not lootable this phase.** Fixed starting kit only;
  world-acquisition of relics is a deferred follow-up (see phase 18).
- **Loot surfaces yield consumables/materials/currency**, per planning.
  Don't leave a surface dropping nothing — give it a minimal correct
  reward table and flag tuning follow-ups.
- **Delete, don't archive-in-place.** The old specs (05b/05c) already
  contemplated archiving the JSON library; we are past that — remove the
  TS modules outright. Git history is the archive (bearings rule: don't
  resurrect retired patterns).
- **Modifier catalogue / affixes / sets / rarity type stay until phase
  21** — this phase only removes the content + factory that *use* them.
  (If a file becomes trivially orphaned and deleting it here is cleaner
  than leaving a dangling import, delete it and note the pull-forward.)

## Pages × tests matrix

| Surface | Tests |
|---|---|
| loot-cache encounter | resolves to consumable/material/currency rewards; seeded determinism holds; no `dropItem` reference |
| enemy drops | drop tables yield non-equipment ids; no template lookups |
| shops | stock resolves; no rarity roll |
| barrel | removed symbols gone; nothing imports them (mechanics + mobile + card-editor type-check) |
| relics | still equippable + stat/HP correct (regression) |

Delete the factory/template/cache-loot equipment test suites
(`item.factory` tests, `equipment-resource.engine.test.ts` remnants,
cache-loot equipment-drop tests). Keep/adjust loot-cache tests to the new
reward kinds.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

## Commit body template

```
refactor(mechanics): retire procedural equipment library — phase 20

- Delete equipment.templates.ts (56), unique.templates.ts (7), and
  item.factory.ts (dropItem/roll/resolve/affix-draw/cache-loot equipment
  generation). The 8 signet relics (phase 18) are now the whole
  equipment library.
- Loot surfaces (The Reliquary, enemy drops, shops) yield
  consumables/materials/currency instead of procedural equipment.
- Prune the factory/template/cache-loot symbols from the @mechanics barrel;
  mobile + card-editor gates green.

Decisions:
- Relics remain a fixed starting kit (not lootable this phase).
- Modifier catalogue / affixes / sets / rarity type deleted in phase 21;
  this phase removes only the content + factory that consumed them.
- <loot-cache/enemy-drop tuning follow-ups flagged, if any>

Closes #<phase-issue-number>
```

## DoD

Flip Phase 20 `[ ]` → `[x]`, append hash, Phase log. `deploy:check`
green.

## Follow-ups

- `loot-cache-tuning` / enemy-drop retune if the minimal reward tables
  need balancing against their doctrines.
- Phase 21: delete modifier catalogue, affix library, item sets, rarity
  model, equipment-only effect definitions; final barrel prune + spec
  reconciliation.
