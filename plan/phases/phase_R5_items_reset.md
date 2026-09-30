# Phase R5 — Items reset

## Sources

- Part plan: [`plan/revamp/items.md`](../revamp/items.md) § R5 (items 1–7).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D49** (items: healing potions only), **D45** (carrier rule),
  **D50** (git history is the source archive), **D53** (Act 1 is the world;
  the northern maps are parked), **D58** (nothing is authored), **D37** (the
  card hold).
- T, 2026-09-28 (quoted in the part plan): "healing potions only".
- Siblings: phase R3b (`25a6c5e7`) for a purge plus save migration; phase R4
  (`9110c7be`) for a carrier sweep across the atlas and the mobile tables.

## Outcome

The consumable library holds three healing potions: minor, normal and
greater. The other nineteen consumables are gone, a save that carried one
loads without it, and nothing in the game hands one out. The effects that
existed only for those items are deleted, item copy says VITAE, and CLEANSE
leaves the atlas and the glossary.

## Scope

### Mechanics (`axiomancer-mechanics/`)

1. **`Items/consumable.library.ts`** keeps `minor-healing-potion`,
   `healing-potion` and `greater-healing-potion`, each with its Phase 96
   desperation band. The nineteen others are deleted, and so are
   `UNOBTAINABLE_CONSUMABLE_IDS` and `obtainableConsumables`: every
   consumable left can be handed out. The header is rewritten to match.
   A new `RETIRED_CONSUMABLE_IDS` set lives in the migration, not in the
   library, because only the migration needs it.
2. **Save migration v29 → v30** (`Game/game.migrate.ts`,
   `GAME_STATE_VERSION` 30): drop every inventory stack whose id is one of
   the nineteen, and drop every active effect on the player whose
   `effectId` is one of the deleted effects (item 4). No refund. Idempotent,
   pure over a raw payload.
3. **Re-point every grant surface.**
   - `Items/cache-reward.ts` draws from `consumableLibrary` (all three
     potions). Its header's "relics are … never loot" line is fixed to say
     what the tree does: the cache pays consumables and currency, and relics
     come from the starting kit, shops and friendship rewards.
   - The Doorwarden's loot table (`Enemy/enemy.library.ts`): the
     `iron-skin-draught` bucket (25) becomes `greater-healing-potion`, the
     `clarity-serum` bucket (20) becomes `minor-healing-potion`. Weights stay.
   - The parked maps' shops (`World/MapEvents/content.ts`: nf-8, nf-18,
     nc ledger camp, ncy iron market and chandlery, cr landing, cap market)
     lose their rows for retired items. Nothing is added in their place.
   - Debug presets (`Character/presets.ts`): rows for retired items are
     removed; the L50 ladder's supreme potions become greater potions.
   - The mobile debug encounter (`components/DebugTriggerEncounter.tsx`)
     sells `minor-healing-potion` instead of `antidote`.
4. **Delete the effects that existed only for the retired items**
   (`Effects/buffs.library.json`, `Effects/debuffs.library.json`): the
   advantage and roll-modifier buffs (`buff_accuracy_up`,
   `buff_critical_rate_up`, `buff_critical_damage_up`, `buff_haste`,
   `buff_haste_surge`, `buff_status_chance_up`, `buff_liars_gambit`,
   `buff_abyssal_presence`, `buff_all_stats_up`), the defence and sustain
   buffs (`buff_regeneration`, `buff_damage_reduction`, `buff_invincibility`,
   `buff_phoenix_vigor`, `buff_stoic_resolve`), the two cleanses
   (`buff_cleanse`, `buff_cleanse_minor`) and `debuff_curse` (zero appliers).
   `buff_absolved` stays (the region-consequence status in
   `Game/game.reducer.ts`). The unread advantage collection in
   `Combat/effect-modifiers.ts` (`advantageGrants` / `advantageDenies`) goes.
5. **Copy**: "Restores … HP" becomes VITAE in the three potions'
   descriptions.
6. Every comment that names a deleted item or effect as a live thing is
   fixed or removed (`Effects/types.ts`, `Items/equipment.engine.ts`,
   `Combat/combat.engine.ts`'s armor-soak note).

### Mobile (`axiomancer-mobile/`)

7. `state/combat/keywords.ts`: the support-effect rows for deleted effects
   go; `buff_absolved` loses its borrowed "Cleanse" label and falls back to
   its own name, like `buff_accuracy_up` did. `components/combat/statusGlyphs.ts`
   loses its rows for deleted ids.
8. "Heal N HP" copy in `state/presenters/inventory.modal.engine.ts` and
   `equipment-detail.engine.ts` says VITAE.

## Consumers to update

`src/index.ts` and `Items/index.ts` exports (the two removed exports);
`CLI/dev-tools.ts` and `CLI/game.cli.ts` read the library and follow
unchanged; the catalog exporter reads the library live.

## Save / schema contracts

`GAME_STATE_VERSION` 29 → 30 with the hop in item 2 and a test.

## Carrier sweep (D45)

After R5 no item carries **CLEANSE**: its row leaves
`axiomancer-mechanics/docs/keyword-atlas.md`, the mobile gloss table and
`components/combat/glyphShapes.ts`. **HEAL** stays (all three potions heal).
**DRAW** and **MARK** are checked: each keeps its gloss only if something
live still prints it (a card, a hazard, the dice system); otherwise it goes
too. The engine code behind CLEANSE (card `cleanse` riders, `applyCleanse`,
the consumable cleanse routing), the `defenseModifier` armor soak and the
`advantageModifier` payload type are R7a's carrier-less purge, not R5's.

## Decisions made upfront — DO NOT ASK

- **Supreme is retired.** Act 1's foes run L1–L8; greater (50, 75 below
  half) already tops that ladder, and supreme's only grant sites were the
  parked Capital's market and the L50 debug preset.
- **Parked shops lose the retired rows rather than being left alone.** The
  part plan allows leaving them, but a shop row naming an id the library no
  longer has is a dangling reference the content lint and shop tests read;
  deleting a row authors nothing.
- **Doorwarden buckets re-point to potions at the same weights**, so the
  boss's drop rate is unchanged and only what drops changes.
- **No refund** for stripped stacks (part plan item 2).
- **Tests pinned to a deleted effect are deleted or rewritten to a
  survivor** (`debuff_bleed`, `debuff_vulnerable`, `debuff_mark`,
  `buff_absolved`); a case that only exists to pin a deleted effect goes
  with it.

## Tests matrix

- `Game/e2e/items-reset-migration.engine.test.ts` (new): a v29 save holding
  retired stacks and a retired active effect loads at v30 without them,
  keeps its potions, and re-migrating is a no-op.
- `Items/`: the library holds exactly the three potions; the cache roller
  only yields them; no grant surface (shops, loot tables, friendship
  rewards, presets) names an id the library lacks.
- The e2e suites that pinned retired items (`dead-consumable-payload`,
  `consumable-cleanse`, `noop-consumables-unobtainable`, the desperation
  band's list) are deleted or cut to the survivors.
- Effect-pipeline suites that used a deleted buff as a fixture are rewritten
  to a surviving effect.
- Mobile keyword and glyph suites lose the swept rows.

## Verify gate

`npm run verify` (both workspaces: mechanics' public surface changed), root
`npm test`, `npm run lint:content`, `node scripts/check-lexicon.mjs`.

## Commit body template

```
chore: items reset, healing potions only — phase R5

- <library>
- <migration>
- <grant surfaces>
- <effects deleted>
- <carrier sweep>

Decisions:
- <from the list above>

Closes #<mirror>
```

## DoD

The R5 row is `[x]` with its hash; the gates above are green; no retired
consumable id or deleted effect id is referenced outside the migration's
retired-id list, its test and git history.

## Follow-ups (out of scope)

- R7a: the engine code behind CLEANSE, the armor soak, regeneration ticks,
  `advantageModifier` and the other payload fields no effect carries now.
- B2: if afflictions return, their answer (a cleanse card or an in-combat
  item surface) returns with them (part plan § Later).
