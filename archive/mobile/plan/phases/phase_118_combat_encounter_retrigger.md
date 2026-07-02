# Phase 118 — Combat encounter re-trigger fix (issue #191)

> Promoted via /oversight 2026-06-11. HIGH severity gameplay blocker:
> subsequent combat encounters fail to trigger after the first encounter
> resolves. Core combat mechanic blocker, user-spotted 2026-05-25.

## Problem statement

After a player completes one combat encounter and returns to the exploration
map, walking onto a second encounter node does not trigger the encounter
modal. The first encounter works; all subsequent ones are silent.

## Investigation surface

Three candidate roots to verify in order:

**A — Node permanently marked consumed.**
`state/actions.ts: resolveCurrentMapEvent` calls `markNodeConsumed` (Phase 27).
Check whether this also permanently sets `availableNodes` to exclude the
node, or whether the exploration-screen's "available choices" filter
excludes consumed nodes. If encounter nodes are consumed-after-resolve,
no future visit can fire.

**B — `inEncounterModal` flag not clearing.**
`state/combat-mode.tsx` tracks `inEncounterModal`. If the flag stays `true`
after the encounter resolves (e.g. `finalizeCombatExit` not called, or
the aftermath path skips it), `EventGate` / the overlay mount condition
may silently suppress the next encounter.

**C — Event-pool `resolveMapEvent` skipping already-seen nodes.**
The event-pool registration (Phase 55/58) may carry state that marks a
pool entry as "used" without resetting between encounters. If the pool
exhausts or deduplicates, it returns `kind: 'none'` silently.

## Scope

- Trace the post-resolution path: `finalizeCombatExit` → `exitCombatWith`
  → `combat-mode` flag state; confirm flag clears to `false`.
- Trace `resolveCurrentMapEvent` for a second encounter node: confirm
  `eventPools.resolveMapEvent` returns an encounter (not `'none'`).
- Trace the exploration screen's `moveToAction` → available-node filter:
  confirm the second encounter node is still selectable after the first
  resolves (not filtered by consumed/visited status).
- Fix whichever root causes the regression. One focused commit.
- No local mechanics simulation; no behavior changes beyond the fix.

## Hermetic tests

Add to `state/e2e/encounter-flow.engine.test.tsx` (or a new sibling):

1. **Encounter fires on first visit** — precondition already covered by
   Phase 64's suite; verify still green.
2. **Encounter fires on second visit to a different encounter node** —
   navigate to node A (encounter → resolve → exit) then to node B
   (encounter node); assert the overlay mounts and `vm.kind === 'encounter'`.
3. **`inEncounterModal` is false after `finalizeCombatExit`** — unit test
   on the combat-mode slice.

## Verify gate

```bash
npm run typecheck    # pnpm exec tsc --noEmit
npm test             # full Jest suite
npm run verify       # existing verify gate
```

## Commit

```
fix: combat encounter re-trigger after first encounter — issue #191

Closes #191
```

## DoD

- [ ] Second encounter node triggers the modal after first combat resolves
- [ ] `inEncounterModal` clears correctly on all exit paths
- [ ] Hermetic lifecycle tests pin the fix
- [ ] Verify gate green
