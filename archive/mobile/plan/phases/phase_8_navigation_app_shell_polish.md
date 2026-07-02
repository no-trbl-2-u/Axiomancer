# Phase 8 — Spec 10: Navigation + app-shell polish

> **Tab titles superseded:** Phase 31 (2026-05-16) flipped the
> mixed-register `MAP · COMBAT · SHEET · SACK` set to coherent
> places `WILDS · STRIFE · SELF · SACK`; Phase 32 (2026-05-16,
> port from the Claude Design handoff, commit `ff37b46`) then
> renamed SACK → SATCHEL. The `# SACK tab` comment below in the
> route tree describes the original Phase 8 tab label, not the
> live one. See `state/presenters/tabs.engine.ts:TAB_TITLES`
> for the current register.

## Outcome

Polish Expo Router navigation with deep links, smart cold-start routing, tab badges, back-button behavior, and status bar per-screen adaptation.

The app shell feels finished and production-ready.

## Why this phase

Navigation polish is the final piece for a production-ready app shell. After phases 1–7 shipped all core screens through the presenter contract, the app has working screens but basic navigation. Phase 8 makes it feel like a real shipped mobile game.

## Dependencies satisfied

- Phase 4 shipped presenter contract (`selectXViewModel`)
- Phase 5 shipped character screen wiring
- Phase 6 shipped inventory screen wiring (mentioned in build plan)
- Phase 7 shipped AsyncStorage persistence (game state survives restarts)
- Combat and exploration screens already wired

## Routes / API endpoints / CLI surface

**Locked from bearings contract:**

```
app/(tabs)/exploration/     # MAP tab
app/(tabs)/combat.tsx       # COMBAT tab (hidden when not in combat)
app/(tabs)/character/       # SHEET tab
app/(tabs)/inventory/       # SACK tab
app/(tabs)/event.tsx        # EVENT tab
app/index.tsx              # root redirect
```

**Deep link scheme (new):**

```
axiomancer://character     # character sheet
axiomancer://event/{id}    # specific event (read-only)
```

## Content / data reads

| Helper | Call | Use |
|---|---|---|
| `useGameState(selectActiveTab)` | `(state) => TabRoute` | Cold-start routing |
| `useGameState(selectTabBadges)` | `(state) => BadgeMap` | Event/levelup badges |
| `selectVisibleTabs` | `(inCombat) => TabsViewModel` | Existing tab hiding |

## Components / handlers

**New:**
- `<TabGuard>` — wraps `Tabs.Screen`, handles hide/disable logic
- `app/_layout.tsx` enhanced with deep link handling
- `app/index.tsx` enhanced with smart cold-start routing

**Reused:**
- Existing `TabIcon` components in `app/(tabs)/_layout.tsx`
- Existing `isTabHidden` from `state/presenters/tabs.engine.ts`

## Cross-links

**In (verify):** Links from other tabs work correctly with new routing logic.  
**Out (ship):** Deep links resolve to correct screens.  
**Retro-fit:** None needed — navigation is a foundational layer.

## SEO / metadata / output schema

**Not applicable** — mobile app with no URL surface.

## Hero / body / sub-section composition

**Not applicable** — infrastructure phase, no new UI surfaces.

## Empty / loading / error states

- **Deep link to nonexistent event:** Route to exploration with warning
- **Deep link when app not ready:** Buffer until persistence loads

## Decisions made upfront — DO NOT ASK

1. **Tab availability (Spec 10 Q1):** (A) Hidden when inactive — tab bar adapts. Combat/exploration are mutually exclusive; event tab hidden when no active event.

2. **Cold-start route (Spec 10 Q2):** (A) Route to whatever screen matches engine state. Combat → combat tab, active event → event tab, else exploration.

3. **Tab badges (Spec 10 Q3):** (A) New event → badge on Event tab. Level-up ready → badge on Character tab.

4. **Deep links (Spec 10 Q4):** (A) Yes — read-only deep links for events and character sheet. Useful for QA and bug reports.

5. **Back-button behavior (Spec 10 Q5):** (A) Disabled — combat is modal. Hardware back during combat is a no-op.

6. **Status bar (Spec 10 Q6):** Keep current `<StatusBar style="light" />` global. Per-screen adaptation is a future enhancement (event scenes with translucent status bar over illustrations can wait).

## Mobile reflow / responsive considerations

Tab bar already handles small screens correctly via existing `styles.tabBar` and `FONTS.sans` sizing. No new responsive logic needed.

## Pages × tests matrix

| Test file | Coverage |
|---|---|
| `state/e2e/navigation.engine.test.ts` | `selectActiveTab`, `selectTabBadges`, cold-start routing |
| `state/e2e/tabs.engine.test.ts` | Existing tab visibility (unchanged) |

## Verify gate

```bash
npm run verify   # lint + tsc --noEmit + jest
```

All new presenter functions must be pure and have hermetic e2e tests.

## Commit body template

```
feat: navigation + app shell polish — phase 8

- Smart cold-start routing based on game state
- Deep links for character sheet and events  
- Tab badges for new events and level-ups
- Hardware back disabled during combat
- Tab hiding logic enhanced for event availability

Decisions:
- Cold start routes to active game context (combat/event/exploration)
- Deep links are read-only for QA convenience
- Tab badges highlight actionable state changes
```

## DoD

After commit + push:

1. Flip Phase 8 `[ ]` → `[x]` in `plan/steps/01_build_plan.md`
2. Add Phase log entry with commit hash
3. Mark Spec 10 as `[DONE]` with commit reference
4. Verify `npm run deploy:check` (stub — still exits 0)

## Follow-ups (out of scope)

- **Push notification routing** — future spec when notifications are added
- **Per-screen status bar styles** — event scenes with translucent status bar
- **Modal sheet routing decisions** — per each screen's own spec refinement
- **Navigation accessibility** — covered by Phase 10 (accessibility + theming)