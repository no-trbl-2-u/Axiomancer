# Phase 87 — DEV-mode coverage expansion

> Complete debug affordance coverage for all ported mechanics. Two
> missing components: currency manipulation (shilling grant/drain)
> and HUD override controls (combat HUD visibility toggles for
> dev testing empty-state branches).

**Source:** `/oversight` 2026-05-24 (40th call) promotion from
PHASE_CANDIDATES.md `[score 6.0]` row. Gaps identified via
cross-reference of existing `Debug*` components vs. mechanics audit.

## 1. Why

The DevMenu currently covers 8 of 10 ported mechanics with debug
affordances. Missing:

- **Currency** — `state.player.currency` (shilling) has no debug
  control. Inventory screen shows current shilling but dev can't
  easily test purchase flows, poverty states, or reward grants
  without manually triggering combat victories.
- **HUD overrides** — Combat HUD presenter has complex visibility
  logic (mana bar, effect count, stance indicator) but no dev way
  to force empty states. Testing `{ effects: [], mana: null, stance:
  'none' }` branches requires specific game state.

This phase closes the coverage gap per the autonomous expansion
directive ("one debug affordance per ported mechanic").

## 2. Scope

Two new `Debug*` components following the established pattern:

### `DebugCurrencyControl.tsx`
- **+50 / +500 SHILLING** buttons (increment by amounts useful for
  item testing — smallest purchasable is ~25, expensive gear ~400).
- **BROKE** button (set to 0, test poverty branches).
- Three-button row in DevMenu, similar to `DebugManaControl`.
- Direct `store.setState({ player: { ...state.player, currency: N
  } })` manipulation.

### `DebugHudOverrides.tsx`
- **Combat HUD visibility toggles** for dev testing empty states:
  - **HIDE MANA** — force `combatMana: null` regardless of combat state
  - **HIDE EFFECTS** — force `effects: []` on HUD read
  - **HIDE STANCE** — force `stance: 'none'` on HUD read
- **RESET OVERRIDES** button to clear all forced states.
- Toggles stored in `state.devOverrides.hud` (new slice).
- Combat HUD presenter (`combat-hud.engine.ts`) reads overrides
  and applies them over normal state.

## 3. Routes / API endpoints / CLI surface

No new routes. Components render inside existing DevMenu on the
SELF tab (`app/(tabs)/character/index.tsx`).

## 4. Content / data reads

Currency reads from `state.player.currency` (existing field).
HUD reads from `state.combat*` + new `state.devOverrides.hud`.

| Helper | Call | Use |
|--------|------|-----|
| `useGameStore()` | Direct setState | Currency manipulation |
| `selectCombatHudViewModel` | Read + override | HUD override logic |

## 5. Components / handlers

**New primitives:**
- `DebugCurrencyControl` — three-button currency manipulation row
- `DebugHudOverrides` — combat HUD visibility toggle grid

**Reused:**
- `DevMenu` wrapper (existing)
- Button styling from `DebugManaControl` pattern
- `isDevToolsEnabled()` gate pattern

## 6. Cross-links

**In (verify):**
- DevMenu mounts both components in character tab
- Currency control affects inventory screen display
- HUD overrides affect combat screen HUD visibility

**Out (ship):**
- Components appear in DevMenu when expanded
- Currency buttons immediately update inventory shilling display
- HUD toggles immediately affect combat HUD visibility

**Retro-fit:**
- Add both components to `app/(tabs)/character/index.tsx` DevMenu
  children list (after existing debug components)

## 7. SEO / metadata / output schema

N/A (dev-only components)

## 8. Hero / body / sub-section composition

`DebugCurrencyControl`:
- One row: `[+50 SHILLING] [+500 SHILLING] [BROKE]`
- Label row above: "CURRENCY"

`DebugHudOverrides`:
- Header: "HUD OVERRIDES"  
- Toggle grid (2x2): `[HIDE MANA] [HIDE EFFECTS]`
                     `[HIDE STANCE] [RESET ALL]`
- Pressed state visual feedback (sulfur tint on active overrides)

## 9. Empty / loading / error states

- `DebugCurrencyControl`: No empty states (buttons always functional)
- `DebugHudOverrides`: Toggle pressed state shows active overrides

## 10. Decisions made upfront — DO NOT ASK

- **Currency amounts**: +50 / +500 based on inventory price ranges
  (small items ~25s, gear ~400s). Covers testing spectrum.
- **HUD override storage**: New `state.devOverrides.hud` slice
  rather than existing fields to avoid polluting game state.
- **Override scope**: Combat HUD only (not other HUD surfaces like
  tabs or status bars).
- **Reset mechanism**: Single RESET ALL button rather than per-
  toggle reset for simplicity.
- **Presenter integration**: `selectCombatHudViewModel` applies
  overrides, not component-level forcing.

## 11. Mobile reflow / responsive / paginate / output limits

Standard DevMenu responsive behavior. Components stack vertically
in narrow viewports.

## 12. Pages × tests matrix

| Component | Render | Interaction | Presenter |
|-----------|--------|-------------|-----------|
| `DebugCurrencyControl` | ✓ | +50/+500/BROKE handlers | N/A |
| `DebugHudOverrides` | ✓ | Toggle states + reset | Override logic |

## 13. Verify gate

Standard hermetic test pattern:
- Component render + button press handlers
- Dev-only gate (`returns null in production`)
- Store integration (currency updates state, overrides affect presenter)
- Cross-integration (DevMenu mount, HUD presenter override application)

## 14. Commit body template

```
feat: debug affordances for currency and HUD overrides — phase 87

- DebugCurrencyControl: +50/+500 shilling grant + BROKE reset
- DebugHudOverrides: combat HUD visibility toggles (mana/effects/stance)
- New devOverrides.hud slice for HUD state forcing
- Combat HUD presenter applies overrides over normal state  
- DevMenu integration on SELF tab

Decisions:
- Currency amounts (+50/+500) based on inventory price spectrum
- HUD overrides stored in dedicated devOverrides slice
- Single RESET ALL button for override clearing
```

## 15. DoD

- [x] `DebugCurrencyControl` component shipped with tests
- [x] `DebugHudOverrides` component shipped with tests
- [x] `devOverrides.hud` slice added to store
- [x] Combat HUD presenter applies dev overrides
- [x] Both components integrated into DevMenu
- [x] Verify gate passes
- [x] Inventory display updates on currency changes
- [x] Combat HUD visibility responds to override toggles

## 16. Follow-ups (out of scope)

- Additional HUD surfaces (tabs, status bars) — combat HUD only for now
- Persistent override storage — current implementation resets on app restart
- Granular currency presets (specific amounts for specific items)
- Override indicators in combat UI (subtle dev-mode hints)