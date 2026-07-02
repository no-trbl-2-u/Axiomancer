# Mechanics ↔ UI audit — inventory surface (2026-05-22)

> Filed by `/iterate` ([3.8] AUDIT row, oversight 27th). Last
> of the three sibling audits (combat ✅, event ✅, exploration
> ✅, inventory today). Scope:
> `state/presenters/inventory.engine.ts`,
> `state/presenters/inventory.modal.engine.ts`,
> `state/presenters/inventory-feedback.engine.ts`,
> `app/(tabs)/inventory/index.tsx`,
> `state/actions.ts` inventory actions
> (`useItemAction`, `equipItemAction`, `dropItemAction`).

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | First-equipment-per-slot = worn (no engine `equipped` flag) | **DRIFT (latent — convention-only contract)** |
| 2 | `equipItemAction` reorders inventory to set "first" | ALIGNED (matches row 1's convention) |
| 3 | `presentationCategory` via engine `isEquipment` / `isConsumable` / `isQuestItem` | ALIGNED |
| 4 | `quantityFor` reads `'quantity' in item` for non-engine quantity | MOBILE-ONLY (engine has no stack-size on every item) |
| 5 | `computeReplacePreview` skips multiplier statModifiers | MOBILE-ONLY by design (Phase 35 v1; engine still applies multipliers correctly on actual equip) |
| 6 | `BURDEN_MAX = 50` + `computeBurden` row-count | MOBILE-ONLY (engine has no burden surface) |
| 7 | `readShilling` reads `p.shilling ?? p.currency` (engine fork) | **DRIFT (typing)** — currency field name is `as any` |
| 8 | `useItemAction` legacy-string heal parsing (`parseHealAmount`) | ALIGNED (engine handles structured `healAmount`; mobile parses legacy strings) |
| 9 | `dropItemAction` allows any non-quest drop | ALIGNED (`canDiscardFor = !isQuestItem` matches engine semantics) |
| 10 | Equipment Dock `SUB_TO_SLOT` mapping from title-case sub to engine slot | ALIGNED (round-trip from `SLOT_LABELS`) |
| 11 | `BURDEN_MAX` as a hard floor on rows.length aggregation | **DRIFT (subtle)** — burden capped at 50 silently; player carrying 60 items reads "50/50" |
| 12 | `DOCK_SLOT_ORDER` + chrome (TRINKET for accessory) | MOBILE-ONLY (design-handoff order) |

---

## 1. First-equipment-per-slot = worn — **DRIFT (latent — convention-only contract)**

**UI:** `state/presenters/inventory.engine.ts:9-12, 367-376`.
The presenter walks inventory in order; for each equipment
slot, the FIRST item it sees gets `equipped: true`. Later items
in the same slot get `equipped: false`.

**Engine:** `Equipment` carries no `equipped` boolean. The
engine doesn't know which item is worn — it's a mobile
convention.

**Verdict:** **DRIFT (latent — convention-only contract).** No
test pins the "first per slot = worn" convention across all
consumers (presenter, `equipItemAction`'s reorder logic,
`selectCharacterViewModel`'s stat application). If any
consumer ever traverses the inventory in a different order
(e.g. sorted by name), all the "worn" UI flips silently.

**Fix proposal:** either:
- (a) lift the convention to a single helper
  (`firstEquippedPerSlot(inventory) → Map<slot, Equipment>`)
  consumed by every site, OR
- (b) ask the engine for an `equipped` flag and migrate. Today
  Spec 06 documents the convention; promote it to a real type
  invariant.

Score `[3.5]` (impact 5 — silent drift risk; ease 7 — small
helper extraction).

---

## 2. `equipItemAction` reorders inventory to set "first" — ALIGNED

**UI:** `state/actions.ts:699-725`. When the user equips an
item: filter the inventory, partition into slot-peers and
non-slot, then rebuild as `[target, ...slotPeers, ...nonSlot]`.
The target lands first in its slot — exactly what
`buildRows` reads as "equipped".

**Engine:** `state.player.inventory` is a flat `Item[]` array
the action layer can permute freely.

**Verdict:** ALIGNED (against the convention from row 1). Both
sides of the convention are consistent. The risk is in row 1's
verdict — if the convention shifts, both sides drift together
correctly, but the convention itself is undeclared.

---

## 3. `presentationCategory` via engine type guards — ALIGNED

**UI:** `state/presenters/inventory.engine.ts:272-277`. Uses
`isEquipment`, `isConsumable`, `isQuestItem` directly from the
engine to bucket each item into the four mobile categories.

**Engine:** the three guards are public engine exports
(`axiomancer-mechanics`).

**Verdict:** ALIGNED. Engine-authoritative bucketing; mobile
adds a "material" fallback for items that don't match any of
the three.

---

## 4. `quantityFor` reads `'quantity' in item` — MOBILE-ONLY

**UI:** `state/presenters/inventory.engine.ts:284-290`. Reads
the optional `quantity` field via `in` check + `as any` cast.
Defaults to 1.

**Engine:** the engine `Item` type doesn't ship a `quantity`
field on every variant — consumables stack but equipment
typically doesn't.

**Verdict:** MOBILE-ONLY. The defensive `'quantity' in item`
check is correct against the as-shipped types; the cast is
typing-only. No drift, but no test either — if a future engine
adds `quantity` to equipment, this code silently picks it up
(which is probably fine, but worth a unit test pin).

---

## 5. `computeReplacePreview` skips multipliers — MOBILE-ONLY by design (Phase 35)

**UI:** `state/presenters/inventory.engine.ts:307-313`.
`aggregateEquipmentStats` skips `mod.isMultiplier` entries when
summing for the equip-preview.

**Engine:** the actual equip apply DOES handle multipliers
correctly via the combat HUD's `getEffectiveStats`.

**Verdict:** MOBILE-ONLY by design. Phase 35 explicit "v1
preview surfaces additive deltas only; multiplier surfacing
deferred". The preview is intentionally a forecast for
additive changes; multipliers don't appear pre-equip but DO
apply post-equip.

**Risk:** player sees a +3 attack delta on equip, but the
multiplier kicks in and they actually get +6. Today small
because most equipment uses flat stats; rolling refinement
when multiplier-heavy gear ships.

---

## 6. `BURDEN_MAX = 50` + `computeBurden` row-count — MOBILE-ONLY

**UI:** `state/presenters/inventory.engine.ts:226, 450-453`.
`burden = sum of row.quantity` capped at `BURDEN_MAX`.

**Engine:** no `burden` / `encumbrance` surface today.

**Verdict:** MOBILE-ONLY. Pure UI burden display. If the engine
ever exposes a real encumbrance system, this presenter retires
in favor of the engine reads.

---

## 7. `readShilling` reads `p.shilling ?? p.currency` — **DRIFT (typing)**

**UI:** `state/presenters/inventory.engine.ts:443-448`.
Defensively reads either `player.shilling` or `player.currency`
via `as any` cast.

**Engine:** the canonical currency field on `Character` (per
the engine type) is one specific name — the fork-check
suggests historical drift. Both fields hit `as any`; no test
pins which is canonical.

**Verdict:** **DRIFT (typing).** The defensive `??` chain hides
which field is actually live. If the engine ever standardizes
(removing one of the two), the presenter silently picks the
other.

**Fix proposal:** check engine type (`Character.shilling` vs
`.currency`), pick the canonical one, drop the fallback +
cast. Score `[2.5]` (typing hygiene; 1-line presenter edit).

---

## 8. `useItemAction` legacy-string heal parsing — ALIGNED

**UI:** `state/actions.ts:659-697` +
`state/actions.ts:parseHealAmount`. The action runs the engine's
`useConsumable` (which handles structured `healAmount`
internally) AND applies a fallback heal for legacy fixtures
that encode heal as a free-form `effectId` string.

**Engine:** `store.useConsumable(itemId)` applies
`useConsumableEffect` which reads `consumable.healAmount` when
the structured field is present and ignores unknown effect ids.

**Verdict:** ALIGNED. The action layer's `?? 0` gate on
`legacyHeal` correctly avoids double-applying heal on items
with the structured field. The legacy-string parse is a
transition mechanism (AUDIT row `[3.0]` 2026-05-13 already
closed this migration via commit `a5438c5`).

---

## 9. `dropItemAction` allows any non-quest drop — ALIGNED

**UI:** `state/presenters/inventory.engine.ts:canDiscardFor`
returns `!isQuestItem(item)`. `state/actions.ts:dropItemAction`
removes the item from the inventory array.

**Engine:** quest items are flagged via `isQuestItem`; no other
drop restrictions enforced engine-side.

**Verdict:** ALIGNED.

---

## 10. Equipment Dock `SUB_TO_SLOT` mapping — ALIGNED

**UI:** `state/presenters/inventory.engine.ts:462-466`.
Reverses `SLOT_LABELS` to derive an engine slot from a
title-case sub string ("Weapon" → "weapon").

**Engine:** `Equipment['slot']` is the union the mapping is
built from.

**Verdict:** ALIGNED. Round-trip is mechanical; the engine type
union is the source.

---

## 11. `BURDEN_MAX` as a hard floor — **DRIFT (subtle)**

**UI:** `state/presenters/inventory.engine.ts:452`:
```ts
return Math.min(BURDEN_MAX, total);
```

The burden value is capped at 50 silently. A player carrying
60 items still reads "50 / 50" on the burden bar.

**Verdict:** **DRIFT (subtle).** The cap is presentational but
the data lies. The bar appears full when it should overflow
or render differently. Could mask hoarding bugs in DEV mode
(`/debug seed` rapidly piles inventory) or just confuse the
player on real saves with many items.

**Fix proposal:** return `total` uncapped; let the UI render
"60 / 50" with an overflow visual treatment. Score `[3.0]`
(impact 4 — DEV/edge case; ease 7 — small VM shape change
+ one screen branch).

---

## 12. `DOCK_SLOT_ORDER` + chrome (TRINKET for accessory) — MOBILE-ONLY

**UI:** `state/presenters/inventory.engine.ts:236-260`. Defines
the 4-row paper-doll grid order + the chrome label
"TRINKET" for the `accessory` slot.

**Verdict:** MOBILE-ONLY (design-handoff order + chrome label
choice). No engine counterpart.

---

## Closing notes

- **Total decisions audited:** 12.
- **DRIFT:** 3 (rows 1, 7, 11). Row 1 is the most consequential
  (latent contract drift); rows 7 + 11 are LOW.
- **MOBILE-ONLY by design:** 5 (rows 4, 5, 6, 12 + parts of
  row 1).
- **ALIGNED:** 4 (rows 2, 3, 8, 9, 10).

**Next iterate ticks** (if the user wants the fixes filed):

- `[3.5]` Lift "first-equipment-per-slot = worn" convention
  into a single shared helper (row 1).
- `[3.0]` Drop the silent `BURDEN_MAX` cap; surface the
  overflow (row 11).
- `[2.5]` Resolve `shilling` vs `currency` field name; drop
  defensive `??` (row 7).

**Three-audit series complete.** Combat / event / exploration /
inventory all audited. Combined drift count: 11 rows. Combined
ALIGNED count: 19. Combined MOBILE-ONLY: 17.

**Out of scope** (queued):
- Character surface (SELF tab) — not in the original three
  but worth a follow-up audit if drift surfaces.
- Memoir tab.

**Verification approach:** code-read this tick. The "first per
slot = worn" convention (row 1) and the silent burden cap
(row 11) would both be observable via the playtest runbook;
file as iterate-fix ticks if the user wants them.
