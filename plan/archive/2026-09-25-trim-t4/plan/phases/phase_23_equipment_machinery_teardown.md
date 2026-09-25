# Phase 23 — Teardown of dead equipment machinery

> Agent-facing brief. Ship without asking; document judgment calls in
> the commit body. Depends on phases 18-21. This is the final, largest
> *deletion* pass — nothing new ships, everything orphaned goes.

## Outcome / Why

User-intent phase 4 ("delete effects connected to equipment; remove all
code around equipment modifiers — prefixes and suffixes") plus the full
teardown agreed in planning. After phases 20-21, the following are dead
(nothing reads them):

- **Modifier catalogue** — `src/Items/modifier.catalogue.ts` (2026 lines;
  slot pools merged to 3 by phase 18 + unique pool),
  `src/Items/modifier.types.ts`, and the barrel symbols
  (`weaponModPool`…`armorModPool`, the merged accessory pool,
  `uniqueModPool`, `MOD_POOLS`, `getModifierById`, `pickValueTier`,
  `allModifiers`).
- **Affix (prefix/suffix) library** — `src/Items/affix.library.ts`
  (1603 lines; 66 prefixes + 66 suffixes), `composeItemName`,
  `affixesForSlot`, `AFFIX_RARITY_WEIGHTS`, `isOffensiveStatusAffix`,
  `Affix`/`AffixRole` types, `prefixId/suffixId/prefixName/suffixName`
  fields on `Equipment`. **This is the explicit "prefixes and suffixes"
  removal.**
- **Item sets** — `src/Items/set.library.ts`, `src/Items/set.engine.ts`
  (`getActiveSetBonuses`, `aggregateSetStartTokens`,
  `applySetGenerationBonus`, `getActiveSetPassiveEffectIds`,
  `getEquippedItemSets`, `itemSetLibrary`, `getItemSetById`), `SetBonus`/
  `ItemSet` types, `setId`/`setMembership` fields.
- **Rarity model** — `ItemRarity`, `rarityWeightTable`,
  `RolledModifier`/`rolledMods`, `requiredLevel` (relics don't need it),
  `AFFIXES_PER_RARITY`/`countNamedAffixes`/`hasBakedAffix`.
- **The dead effect-channel types from phase 20** — `ResourceInteraction`,
  `ResourceGenerationBonus`, `EquipmentProcTrigger`, and the
  `passiveEffects`/`onHitEffects`/`onDefendEffects`/`resourceInteraction`/
  `critStyle` fields on `Equipment`.
- **Equip-delta rarity/affix/effect/resource branches** —
  `src/Character/equip-delta.ts` shrinks to a stat/maxHp/signature diff;
  the `ModifierDeltaEntry`/`EffectDeltaEntry`/`ResourceDeltaEntry`/
  `KeywordDeltaEntry` types go if unused.
- **Archetype signature vestiges** — `SIGNATURE_KITS`,
  `signaturesForArchetype`, and (if now unused) the
  `CombatEncounterState.archetype` field, left behind by phase 19.
- **Slot-model vestiges from phase 18** — the deprecated
  `firstEquippedPerSlot` wrapper (call sites moved to `wornPerSlot` in
  phase 18; delete the wrapper + `isEquippedFirstOfSlot`/
  `findEquippedInSlot` if their capacity-aware replacements made them
  redundant). **`LEGACY_SLOT_MAP` stays** — it lives in the migration
  module and old-save upgrades still need it.
- **Equipment-only effect definitions** — the ~14 buff effects planning
  identified as referenced *only* by the (now-deleted) modifier catalogue
  (`buff_life_steal`, `buff_brazen_thorns`, `buff_promethean_ember`,
  `buff_oracle_foresight`, `buff_stoic_bulwark`, `buff_advantage_mind`,
  `buff_minor_fortitude`, `buff_counter`, `buff_taunt`, `buff_barrier`,
  `buff_defend_up`, `buff_stealth`, `buff_reflect`, `buff_max_hp_up`).
  **Re-verify equipment-only-ness at deletion time** (a card/consumable/
  set/enemy added since planning could now reference one) — delete only
  those with zero remaining production references.

**Success state:** `grep` for the removed symbols across the repo returns
nothing (or only git history). `Equipment` is a lean shape
(`id/name/description/category/slot/accessoryKind?/statModifiers?/grantsSignature?`).
The `@mechanics` barrel exports only the surviving equipment surface
(relic library + `getSignaturesForLoadout` + `EquipmentLoadout`/
`SLOT_CAPACITY`/`wornPerSlot` + equip reducers +
`Equipment`/`EquipmentSlot`/`AccessoryKind`/`StatModifier`). Specs 05/05b/05c/05d/05e
carry a "superseded by phases 18-21 + 23" banner. All three gates green.

## Scope order (safe deletion sequence)

1. Remove barrel exports first (`src/index.ts`, `src/Items/index.ts`) for
   every dead symbol; fix the immediate type-check breaks in mobile /
   card-editor (should be none if 20-21 were clean).
2. Delete the modifier catalogue + affix library + set modules + their
   types.
3. Slim `Equipment` + `equip-delta.ts` to the surviving fields
   (stat/maxHp/signature diff).
4. Remove archetype signature vestiges (`SIGNATURE_KITS` etc.) and the
   phase-18 deprecated worn-convention wrappers.
5. Delete the confirmed equipment-only effect definitions from
   `buffs.library.json` and any effect-mechanic test that only existed to
   cover them (per planning, `buff_defend_up`/`buff_advantage_mind` appear
   in effect-mechanic tests — delete or re-point those tests).
6. Reconcile docs: `docs/equipment.md` rewritten to the 5-slot signet
   model (slot table, the 8 relics, signature gating); specs 05-05e
   banner-marked superseded (don't delete the spec history — annotate
   it, per bearings' source-of-truth hierarchy).

## Reality-check before shipping

For **each** effect id in the equipment-only list, re-run a repo-wide
grep at deletion time and confirm zero references outside
`buffs.library.json` + deleted equipment code + its own tests. Planning's
list is a snapshot; the epic itself (and any parallel work) may have
shifted it. Keep any that gained a live non-equipment consumer.

Run all three gates — this phase touches the widest public surface of the
epic (the barrel prune couples mobile + card-editor hardest here).

## Decisions made upfront — DO NOT ASK

- **Delete, don't deprecate.** These symbols have no live consumers after
  phases 18-21; keeping dead shims protects nothing (bearings'
  backwards-compat guidance is for *live* consumers).
- **Annotate specs, don't delete them.** 05-05e are design history; add a
  superseded banner pointing at phases 18-21 + 23. Deleting design records
  loses provenance.
- **Effect-definition deletions are gated on a fresh equipment-only
  re-check** — never delete an effect that grew a non-equipment consumer.
- **`playerArchetype` stays** (portrait). Only the archetype→signature
  map goes.
- **Keep `StatModifier` and the `'maxHp'` target** — still used by relics.
- **Keep `LEGACY_SLOT_MAP` + all migrations** — old saves must still
  upgrade v11→current after the teardown.

## Pages × tests matrix

| Surface | Tests |
|---|---|
| barrel | removed symbols absent; mechanics + mobile + card-editor type-check green |
| `Equipment` shape | lean shape compiles; relics still valid instances |
| `equip-delta` | slimmed diff (stat/maxHp/signature) correct |
| effect library | deleted effects gone; remaining effects + their tests green; no dangling effect-id reference anywhere |
| combat init | no `SIGNATURE_KITS` reference; signatures still worn-loadout-derived (regression from 19) |
| migrations | full chain v11→current still loads a pre-epic save (slots consolidated, relics seeded, procedural gear purged) |
| docs/specs | `docs/equipment.md` matches the 5-slot signet model; 05-05e banners present |

Net test delta is **negative** (suites for deleted machinery are
removed). The verify gate's job here is proving zero dangling references,
not new behavior.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
# sanity: no orphaned references
git grep -nE "modifier\.catalogue|affix\.library|composeItemName|SIGNATURE_KITS|resourceInteraction|prefixId|itemSetLibrary|firstEquippedPerSlot" -- ':!plan/' ':!*/specs/*'
```

## Commit body template

```
refactor(mechanics): teardown dead equipment machinery — phase 23

- Delete modifier.catalogue.ts, affix.library.ts (prefixes/suffixes),
  set.library/set.engine, the rarity model (ItemRarity/rolledMods/
  requiredLevel/rarityWeightTable), and the dead effect-channel types
  (ResourceInteraction/EquipmentProcTrigger/critStyle + the passive/proc
  fields). Equipment is now id/name/description/category/slot/
  accessoryKind/statModifiers/grantsSignature only.
- Remove archetype signature vestiges (SIGNATURE_KITS,
  signaturesForArchetype, unused CombatEncounterState.archetype) and the
  phase-18 deprecated worn-convention wrappers.
- Delete the <N> confirmed equipment-only buff effects (re-verified
  zero non-equipment references at deletion time).
- Prune the @mechanics barrel; slim equip-delta; rewrite docs/equipment.md
  to the 5-slot signet model; banner specs 05-05e as superseded by
  phases 18-21 + 23.

Decisions:
- Delete over deprecate (no live consumers); annotate specs rather than
  delete them (design provenance).
- Effect deletions gated on a fresh equipment-only re-check; kept any that
  gained a non-equipment consumer: <list or "none">.
- LEGACY_SLOT_MAP + migration chain kept (old saves must still upgrade).

Closes #<phase-issue-number>
```

## DoD

Flip Phase 23 `[ ]` → `[x]`, append hash, Phase log. Mark the epic
complete in the build-plan group note. `deploy:check` green.

## Follow-ups

- Relic acquisition/progression content (world drops, shop relics) — the
  deferred "make relics findable" thread from phase 19.
- Rich loadout UX (phase 19 follow-up).
- Any `loot-cache-tuning` / enemy-drop retune flagged in phase 21.
- Default-loadout / relic stat-spread tuning once playtests exist
  (phase 19 flagged the +4 mind default skew).
