# Phase 21 — Retire the procedural equipment library

> Agent-facing brief. Ship without asking; document judgment calls in
> the commit body. Depends on phases 18 (slot model) + 19 (relics are
> the replacement) + 20 (equipment already effect-free).

## Outcome / Why

User-intent phase 3 (remainder): with the 8 relics now the intended
equipment content, delete the **procedural library** and its factory.
Removed:

- `src/Items/equipment.templates.ts` — 56 templates (post-phase-18
  slotting: 8 weapon, 16 armor, 32 accessory).
- `src/Items/unique.templates.ts` — 7 uniques.
- `src/Items/item.factory.ts` — `dropItem`, `dropItemWithAffixes`,
  `dropItemAtRarity`, `rollModifiers`, `resolveModifiers`,
  `previewTemplateAtRarity` / `…AtAllRarities`, `equipmentFromTemplate`,
  `rollCacheLoot`/`CACHE_LOOT_TUNING`/`generateRarityDrop` (the cache-loot
  *equipment* generation path).

The 8 relics (`relic.library.ts`, phase 19) become the whole equipment
content. The modifier catalogue / affix library / item sets / rarity
model are torn down in **phase 23** (this phase removes the *content +
factory* that references them; phase 23 removes the machinery itself).

**Loot surfaces → non-equipment rewards** (planning decision): The
Reliquary (loot-cache), enemy drops, and shops currently mint procedural
equipment via `dropItem`. With the factory gone they yield
**consumables / materials / currency** instead. Relics are a fixed
starting kit, not random loot.

**Old saves are purged of procedural equipment** (added 2026-07-09):
the phase-19 migration parked previously-worn procedural gear in
`inventory`, and pre-epic saves may hold dropped gear too. Once the
factory and templates are gone those items are unresolvable dead data —
bump `GAME_STATE_VERSION` (13 → 14) with a migration that strips every
non-relic `Equipment` from `inventory` and from the loadout (the
default relic loadout is already worn from phase 19; if a save somehow
wears procedural gear, replace with the default-worn relic for that
slot). Log nothing, refund nothing — the design accepts the wipe.

**Success state:** No code path constructs equipment from a template or
rolls rarity/mods. The loot-cache encounter, enemy loot, and shop stock
resolve to consumables/materials/currency and still run green. Old
saves load with relics as their only equipment. Mobile inventory
renders relics + consumables; no rarity/affix chrome remains on a live
path. Gates green across mechanics + mobile + card-editor.

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

**Save purge:** the v14 migration above.

**Mobile:** `state/actions.ts` equip paths keep working for relics
(phases 18-19); remove any inventory presenter code that reads
rarity/affix/mod fields for display of *dropped* equipment (there is no
more dropped equipment). `computeEquipDelta` rarity/affix branches can be
simplified now or deferred to 22 — prefer deferring pure type-driven
simplification to 22 to keep this phase's diff about content+loot.

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
  world-acquisition of relics is a deferred follow-up (see phase 19).
- **Loot surfaces yield consumables/materials/currency**, per planning.
  Don't leave a surface dropping nothing — give it a minimal correct
  reward table and flag tuning follow-ups.
- **Delete, don't archive-in-place.** The old specs (05b/05c) already
  contemplated archiving the JSON library; we are past that — remove the
  TS modules outright. Git history is the archive (bearings rule: don't
  resurrect retired patterns).
- **Procedural gear is wiped from saves, not compensated.** No currency
  refund, no replacement drops — the relic kit is the loadout now.
- **Modifier catalogue / affixes / sets / rarity type stay until phase
  22** — this phase only removes the content + factory that *use* them.
  (If a file becomes trivially orphaned and deleting it here is cleaner
  than leaving a dangling import, delete it and note the pull-forward.)

## Pages × tests matrix

| Surface | Tests |
|---|---|
| loot-cache encounter | resolves to consumable/material/currency rewards; seeded determinism holds; no `dropItem` reference |
| enemy drops | drop tables yield non-equipment ids; no template lookups |
| shops | stock resolves; no rarity roll |
| migration v14 | save holding procedural gear (worn + inventory) → only relics + non-equipment items survive; loadout legal; enters combat with worn signatures |
| barrel | removed symbols gone; nothing imports them (mechanics + mobile + card-editor type-check) |
| relics | still equippable + stat/HP/signature correct (regression) |

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
refactor(mechanics): retire procedural equipment library — phase 21

- Delete equipment.templates.ts (56), unique.templates.ts (7), and
  item.factory.ts (dropItem/roll/resolve/affix-draw/cache-loot equipment
  generation). The 8 signet relics (phase 19) are now the whole
  equipment library.
- Loot surfaces (The Reliquary, enemy drops, shops) yield
  consumables/materials/currency instead of procedural equipment.
- GAME_STATE_VERSION 13→14: purge non-relic equipment from old saves
  (worn + inventory); relics are the only equipment that survives.
- Prune the factory/template/cache-loot symbols from the @mechanics barrel;
  mobile + card-editor gates green.

Decisions:
- Relics remain a fixed starting kit (not lootable this phase).
- Procedural gear wiped from saves without compensation.
- Modifier catalogue / affixes / sets / rarity type deleted in phase 23;
  this phase removes only the content + factory that consumed them.
- <loot-cache/enemy-drop tuning follow-ups flagged, if any>

Closes #<phase-issue-number>
```

## DoD

Flip Phase 21 `[ ]` → `[x]`, append hash, Phase log. `deploy:check`
green.

## Follow-ups

- `loot-cache-tuning` / enemy-drop retune if the minimal reward tables
  need balancing against their doctrines.
- Phase 23: delete modifier catalogue, affix library, item sets, rarity
  model, equipment-only effect definitions; final barrel prune + spec
  reconciliation.
