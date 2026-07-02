# Hazard Encounter — Mobile UX Source of Truth

> Derived from `app/hazard/`, `state/presenters/hazard.engine.ts`,
> `components/hazard/`, and `state/hazard/store-actions.ts` as of 2026-06-15.
>
> Mechanics rules (engine, card library, thresholds) live in the mechanics repo:
> - `docs/encounters/hazard.md` — rules source of truth
> - `docs/encounters/hazard-card-library.md` — full card catalogue
>
> Design history:
> - `design/hazard-minigame-mobile.md` — original UX brief (still canonical for layout intent)
> - `design/handoff-2026-05-16/` — Figma prototype and chat logs

---

## Screen entry

**Route:** `app/hazard/index.tsx`
**Gate:** `HazardGate` in the root layout watches `vm.active`. Navigation fires only
when the session is ready; the screen auto-exits when the session clears (rewards
claimed or abandoned).

No swipe-back gesture (`gestureEnabled: false`).

---

## Session phases and layer map

The presenter (`selectHazardViewModel`) maps engine phase to a screen layer.

| Engine phase | Screen state | Primary overlay |
|---|---|---|
| `route-select` | HazardBoard (board) + RouteSelect overlay | RouteSelect |
| `rolling` | HazardBoard | *(auto-advances, no user action)* |
| `playing` | HazardBoard + card hand | *(main play surface)* |
| `resolve-flash` | HazardBoard | ResolveFlashOverlay |
| `outcome` | HazardBoard | OutcomeOverlay |
| `rewards` | — | RewardsOverlay |
| `done` | *(auto-exit)* | — |

---

## Hazard intro overlay

Shown **once per seed** before route selection. Contains:
- Hazard title and scenario copy
- Intro art (placeholder where art not yet delivered)
- Dismiss → proceeds to `route-select`

Component: `HazardIntroOverlay.tsx`

---

## Route select

Player **sees their 5-card opening hand** before choosing a route. They do **not**
see the dice before the choice.

RouteSelect displays:
- **Safe** and **Risk** cards stacked full-width (one above the other).
- Each card shows: progress type(s), per-round threshold ladder, reward label,
  failure penalty label, `dual` flag (for Risk).
- CTA: select one route → engine `selectHazardRoute`.

VM type: `HazardRouteChoiceVM` (see presenter).

---

## Dice roll overlay

Fires after route selection. `DiceRollOverlay` presents the dice animation;
auto-advances to `playing` via `finishHazardRolling`.

---

## Main play surface (HazardBoard)

Three layers on the board:

1. **Scene strip** — hazard `boardHeadline` and route notes.
2. **Mana board** — 4 dice rendered as `HazardDie` components. State:
   `available` (bright) / `spent` (dimmed) / hex face (hostile indicator).
   Dice are draggable to staged cards to power them.
3. **Progress meters** — `HazardMeterVM[]`. Force and Escape (or combined for Safe
   route). Shows: current accumulated value, projected value (with staged cards),
   need threshold. Meters update live as cards are staged.
4. **Play area (staging zone)** — staged cards shrink into this zone. Tapping a
   staged card returns it to hand.
5. **Hand tray** — 5-card fan at the bottom. Compact card stock; slight overlap
   permitted. Each card draggable into the play area. Tapping opens CardDetailOverlay.
6. **Commit bar** — Play button fires `resolveHazardRound`. Disabled until at least
   one card is staged. Cards and die assignments are **reversible until Play is pressed**.

Drag system: screen-level drag controller manages card and die ghost layers,
rendered above all other content.

---

## Card rendering (HazardCard)

Two modes: **hand** (compact, fan-tray) and **play** (staged, shrunk).

Fields from `HazardCardVM`:
- `name`, `kind` (colour), `rarity`
- `free` and `powered` stats (shown as top/bottom rows)
- `effects` — keyword pills
- `keywords` — tap-to-read glossary
- `dieAvailable` — highlight when a matching die can be dropped
- `poweredByDieId` — which die is attached (shown as die icon on card)
- `applied` — locks the card once applied (no further interaction)
- `salvageLabel` — shown in discard zone
- `choose`, `chosenKey` — CHOOSE cards show a meter picker on apply
- `vowBonus` — GILDED VOW bonus display when a gold die is attached

---

## Card detail overlay

`CardDetailOverlay` opens on hand-tap. Shows:
- Full card name, flavour text
- Top (free) action text
- Bottom (surge) action text
- Keyword glossary entries for all card keywords

---

## Salvage (trash bin)

Cards can be dragged to the bin area on the board. Fires `discardHazardCard` (not
`applyHazardCard`). Salvage benefit (progress bump or temp mana) is shown as
`salvageLabel` on the card.

---

## Resolve flash overlay

Brief narrative card shown after `resolveHazardRound`. Shows the round result
(O / X), current mark ledger, carry momentum, and any sub-quest progress change.
Dismiss advances to the next round or to outcome.

---

## Outcome overlay

Shows the final result (Perfect / Complete / Failure):
- `OutcomeVM.tier` / `.word` / `.sub` — tier label, headline, sub-copy
- Mark ledger (O X O style)
- CTA → advances to rewards phase

---

## Rewards overlay

Current `RewardsOverlay` presents:
- Tier label
- Rewards list (icon + name + description per reward)
- Consequences list (icon + name + description per consequence)
- Card offer (3 cards)
- Skip button (Perfect tier only) → `claimHazardRewards(null)`

Accepted next UX doctrine (Phases 125–126):
- Tapping a reward card opens a confirmation overlay; it must not immediately claim.
- Overlay shows only: the card, keyword glossary, archetype, and current deck count where available.
- Overlay must **not** show hidden labels such as fix/payoff/risk, in-focus, or off-focus.
- Confirm button commits `claimHazardRewards(pickedCardId)`; cancel returns to the offer.
- When mechanics offers card removal, mobile opens a grid overlay of all current deck cards so the player chooses which one to remove.

---

## Sub-quest display

Sub-quests are surfaced in the play surface HUD as a compact list. Each shows:
- Name and objective text
- Status chip: active / done / failed

Completed sub-quests are highlighted in the Resolve Flash and Rewards overlays.

Accepted next mechanics doctrine adds sub-quest drafting: mobile must present 2–3 candidate objectives and let the player confirm one when mechanics exposes the draft state/action.

---

## Persistent Hazard deck screen

Accepted next UX doctrine (Phase 126): add a Hazard deck/library screen outside the active encounter.

The screen should show:
- all current Hazard deck cards in a phone-readable grid/list,
- starter cards vs gained reward cards vs CRACK/scar cards,
- color distribution,
- keyword distribution,
- deck identity summary when mechanics exposes it.

The same card grid is reused when mechanics offers the remove-card reward option. Removal must require player confirmation and must call mechanics-owned state/action; mobile must not mutate deck rules locally.

---

## Presenter — HazardScreenViewModel

Entry: `selectHazardViewModel({ hazard })` in `state/presenters/hazard.engine.ts`.

Key VM sub-shapes:

```typescript
HazardCardVM {
  uid, cardId, name
  kind           // card colour
  powerColors    // colours that can power it (two-tone support)
  rarity, dead, utility
  free, powered  // { force, escape } stat objects
  effects        // keyword display
  keywords       // glossary entries
  dieAvailable   // whether a matching die can power it
  poweredByDieId // attached die id
  applied
  salvageLabel
  choose, chosenKey   // CHOOSE mechanic
  vowBonus            // GILDED VOW
}

HazardDieVM {
  id, kind       // colour or 'hex'
  state          // 'available' | 'spent'
  isHex
  usable
  temporary
  accessibilityLabel
}

HazardMeterVM {
  key            // 'force' | 'escape' | 'passage'
  label
  value          // current accumulated
  need           // round threshold
  met            // boolean
}

HazardRouteChoiceVM {
  key, name, badge, badgeTone
  description
  ladder         // per-round thresholds display string
  rewardLabel, penaltyLabel, ctaLabel
  dual           // true for Risk route
}

HazardRewardsVM {
  tier
  rewards[]      // { id, name, icon, desc }
  consequences[] // { id, name, icon, desc }
  offerCards[]   // HazardCardVM[]
  canSkip
}
```

---

## Store actions

`state/hazard/store-actions.ts`:

```
stageHazardCard(uid)
unstageHazardCard(uid)
powerHazardCard(uid, dieId)
applyHazardCard(uid)
discardHazardCard(uid)         ← salvage to bin
chooseHazardCardKey(uid, key)  ← CHOOSE mechanic
selectHazardRoute(route)
finishHazardRolling()
resolveHazardRound()
continueHazardAfterResolve()
acknowledgeHazardOutcome()
claimHazardRewards(cardId)     ← null = skip
```

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules.
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.

---

## Card library

See `design/encounters/hazard-card-library.md` for the full card catalogue
(IDs, names, colors, free/surge actions, mechanics, roles, balancing notes).
