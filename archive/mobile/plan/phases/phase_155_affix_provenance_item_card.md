# Phase 155 — Affix-provenance labels on the inventory ItemCard (Phase 154 follow-up)

## Outcome

Make an affixed drop's provenance readable at a glance on the always-visible
item card. A player browsing the satchel (or seeing a reward in
`CombatVictoryPanel`, which reuses `ItemCard`) currently sees the Phase 135
rarity shine — "this is special" — but cannot read *which* prefix or suffix
the item carries without triggering an equip comparison. Surface the
engine-owned affix labels directly beneath the item name.

## Source / decision

Promoted via `/oversight` 2026-06-20 from expand pass 80 candidate [5.5],
placed at the top of the build-plan queue ahead of the Memoir phases per T's
direction to **refill with Phase-154 follow-ups first**.

This is a direct consequence of **Phase 154** (PR #476): mobile became
presentation-only for equipment, the dependency moved to
`axiomancer-mechanics@^0.24.0`, and `state/presenters/equipDelta.ts` — the
*only* surface where affix labels were read — was deleted. The base item card
never surfaced them. So today there is no place a player can read an affix
label at all.

## Current state to start from

- `state/presenters/inventory.engine.ts` — `selectInventoryViewModel`; the
  item view-model does not carry standalone affix-label fields.
- `components/inventory/ItemCard.tsx` — renders `item.name` + the Phase 135
  rarity shine; no affix-label row.
- `components/inventory/__tests__/ItemCard.test.tsx` — colocated coverage to
  extend.
- Engine truth: read affix provenance off the `Equipment` instance under
  `axiomancer-mechanics@^0.24.0`. **Confirm the exact field names against the
  published 0.24.0 surface at ship time** — the 0.22.0 names were
  `prefixName` / `suffixName` / `prefixId` / `suffixId`; verify they survive
  into 0.24.0 (or find the equivalents) before wiring.

## Decisions made upfront — DO NOT ASK

- **Never parse `item.name`.** Affix labels come only from the structured
  engine fields. (Bearings + upgrade-doc rule: "never parse affix truth from
  item names.")
- **No engine changes, no affix simulation.** Pure read-through of fields the
  engine already populates.
- **Omit gracefully.** Common / unique / legacy saves with no affix fields
  render no affix row (no empty placeholder).
- **Compose with Phase 135 shine** — shine = how rare, affix label = which
  affixes. Do not change the shine treatment.
- Presenter-pure: the affix labels live on the view-model, not computed in the
  component.

## Verification

- New/extended hermetic tests:
  - inventory presenter: affix-label fields populated from a structured
    `Equipment`, omitted when absent.
  - `ItemCard`: renders the affix-label row from the structured fields,
    renders nothing for an unaffixed item, never derives a label from
    `item.name`.
- `npm run typecheck` + `npm run verify` green.

## Out of scope

- The equip-comparison delta surface (that is the engine-owned
  `computeEquipDelta` / `EquipDeltaPanel`, repointed by Phase 154).
- Any name-based affix inference or local affix rolling.
