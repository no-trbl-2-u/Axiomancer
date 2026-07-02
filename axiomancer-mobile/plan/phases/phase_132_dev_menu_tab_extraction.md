# Phase 132 — Dev menu tab extraction

## Source

T accepted adding more dev-menu controls for Kid evidence, then noted the current dropdown will become too noisy. The dev surface should become a dedicated tab/screen before T performs a visual audit to decide which buttons to remove.

## Goal

Move dev tooling out of the crowded SELF dropdown into a dedicated dev-only tab or route so the expanded evidence controls stay usable without polluting normal character/self presentation.

## Scope

1. Extract the current Dev Menu surface.
   - Move the existing `DEV MENU` dropdown contents into a dedicated dev-only tab/screen/route.
   - Preserve all existing controls during the move; do not prune buttons in this phase.
   - Keep the route hidden or inert outside dev-enabled builds.

2. Add navigation affordance.
   - In dev builds, expose a clear `DEV` tab or equivalent route entry.
   - In production/non-dev builds, do not expose the tab or controls.
   - Preserve the SELF screen as a player-facing character/self surface, not a debug junk drawer.

3. Group controls for visual audit.
   - Organize existing controls into sections such as:
     - playthrough presets
     - encounter triggers
     - Hazard setup
     - Gathering setup
     - Combat setup
     - inventory/item tools
     - misc/system tools
   - The grouping should make T's later visual audit easier: no removals, just order and containment.

4. Preserve test IDs and automation compatibility where practical.
   - Existing critical testIDs such as encounter trigger ids should remain stable or have documented migration shims.
   - Kid/visual harness docs must be updated with the new route.

## Decisions made upfront — DO NOT ASK

- Default approach: a dev-only tab/route is preferable to a collapsible dropdown.
- Do not remove any dev buttons yet; T explicitly wants a visual audit after the new controls exist.
- If Expo Router tab hiding is awkward, use the cleanest dev-only route affordance available and document the tradeoff.

## Non-goals

- Do not implement new dev controls beyond safe route extraction glue.
- Do not prune buttons.
- Do not redesign the full app navigation.
- Do not change production navigation.

## Acceptance criteria

- [ ] Dev controls no longer live primarily as a noisy SELF dropdown.
- [ ] A dedicated dev-only tab/screen/route exposes the existing dev controls.
- [ ] Production/non-dev builds do not expose the dev tab/screen controls.
- [ ] Existing encounter trigger controls still work after the move.
- [ ] Dev controls are grouped into audit-friendly sections.
- [ ] Kid playthrough docs/harness references are updated from `SELF → DEV MENU` to the new dev route while preserving fallback notes for older builds if useful.
- [ ] Focused navigation/component tests cover dev-enabled visibility and production hidden state.

## Verification

Run:

- focused navigation/dev-route tests
- focused existing dev control tests where available
- `npm run typecheck`
- `npm run verify`
- `npm run verify:visual` or exact visual-smoke blocker

## Definition of Done

Dev tooling is a dedicated dev-only surface, not SELF dropdown noise, and all existing controls remain available for T's subsequent visual pruning audit.

## Commit body template

```text
Phase 132 — Dev menu tab extraction

- moved dev controls from SELF dropdown into a dedicated dev-only route/tab
- preserved existing dev controls for later visual audit
- grouped controls by evidence/testing purpose
- updated Kid/dev harness docs for the new route

Verification:
- <commands/results>
```

## Follow-ups out of scope

- Remove/prune dev buttons after T's visual audit.
- Add new evidence presets (Phase 131).
