# Phase 93 — Death screen presenter fixes

> Promoted via `/oversight` 2026-05-27 (42nd call) from PHASE_CANDIDATES
> `[score 4.5]`. Deep-playtest F09 and F10 showed death screen ledger
> inconsistencies: "encounters survived" shows 1 when player died in
> that encounter (should be 0), and "deepest node" shows internal ID
> like "fv-14" instead of "Tide Pool". Both are presenter-only fixes.

**Source-of-truth lines:**
- `plan/PHASE_CANDIDATES.md` — `[score 4.5] Death screen presenter fixes`
- deep-playtest 2026-05-25 — `[F09]` encounters survived counter wrong on death
- deep-playtest 2026-05-25 — `[F10]` deepest node shows internal ID not name
- `plan/CRITIQUE.md` — MEDIUM priority finding about death screen inconsistencies

---

## Routes / API endpoints / CLI surface

No new routes. Death screen presenter changes only.

## Content / data reads

| Source | Use |
|---|---|
| Engine `runSummary.encountersFaced` | Calculate correct survived count (faced - 1 when died) |
| Engine `runSummary.deepestNodeId` | Node ID to resolve to human-readable name |
| Map layout registry `getMapLayout()` | Lookup node label by ID for display |
| Current map state `currentMap` | Determine which map layout to use for lookup |

## Components / handlers

**Enhanced:**
- `state/presenters/aftermath.engine.ts` — fix encounter counter logic and add node name resolution

**Reused:**
- Existing map layout system (`state/exploration-maps/`)
- Existing `CombatDefeatPanel` component (no UI changes needed)
- Existing `selectAftermathViewModel` presenter structure

**New:**
- Node ID to human-readable name lookup utility function
- Survivor encounter calculation logic (encountersFaced - 1 when died)

## Cross-links

**In (verify):** Existing death screen tests should keep passing with corrected values.

**Out (ship):** No downstream phase required.

**Retro-fit:** None required - this is a data correction fix only.

## SEO / metadata / output schema

N/A. Runtime presenter data fix only.

## Hero / body / sub-section composition

**Current broken state (F09):**
```text
encounters survived    i      # shows 1 when died in first encounter
```

**Fixed state:**
```text
encounters survived    ·      # shows 0 (roman ·) when died in first encounter
```

**Current broken state (F10):**
```text
deepest node          fv-14   # internal engine ID
```

**Fixed state:**
```text
deepest node          Tide Pool   # human-readable label from map layout
```

All other ledger formatting and styling remains unchanged.

## Empty / loading / error states

- **Node ID lookup fails** — fallback to original node ID (no worse than current)
- **Map layout missing** — fallback to node ID display
- **Encounters faced is 0** — show "·" as before (edge case)

## Decisions made upfront — DO NOT ASK

1. **Encounter survived logic: `encountersFaced - 1` when died in combat.** When you die in an encounter, you survived 0 encounters, not 1. Simple arithmetic fix.
2. **Node name lookup via map layout registry.** Use existing `getMapLayout(mapId)` system to resolve node IDs to `.label` strings.
3. **Fallback to node ID on lookup failure.** If map layout or node lookup fails, show the original node ID (no worse than current state).
4. **No UI component changes.** This is a presenter data fix only - `CombatDefeatPanel` displays whatever the presenter provides.
5. **Use current map from game state for layout lookup.** The death screen should resolve deepest node relative to the map the player was exploring when they died.

## Mobile reflow / responsive / paginate / output limits

No UI changes. Presenter data fix only.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---:|---:|
| Encounter survived counter logic | ✓ | — |
| Node ID to name resolution | ✓ | — |
| Death screen ledger display with correct values | ✓ | ✓ |
| F09 regression: correct encounter survived count | ✓ | — |
| F10 regression: human-readable deepest node | ✓ | — |

## Verify gate

```bash
npm run verify    # lint + typecheck + test
```

## Commit body template

```text
feat: death screen presenter fixes — phase 93

- Fix encounter survived counter (dying = 0 survived, not 1)
- Resolve deepest node ID to human-readable name via map layout
- Add regression coverage for deep-playtest F09 + F10
- Preserve existing death screen UI and styling

Decisions:
- Encounter survived = encountersFaced - 1 when died in combat
- Node name lookup via existing map layout registry with fallback
- No UI changes - presenter data fix only
```

## DoD

- [ ] Fix encounter survived counter logic (encountersFaced - 1 when died)
- [ ] Add node ID to human-readable name resolution via map layout lookup
- [ ] Add regression test coverage for F09 encounter counter bug
- [ ] Add regression test coverage for F10 node ID display bug  
- [ ] Preserve existing death screen styling and layout
- [ ] Handle edge cases (missing map layout, node lookup failures)
- [ ] `npm run verify` passes

## Follow-ups (out of scope)

- Full death screen visual refresh (future design phase)
- Sealed node tap feedback (Phase 94)
- Combat ITEM button tooltip (Phase 95)
- Map layout caching optimizations