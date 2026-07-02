# Phase 31 — Tabs design pass (all-places register)

> **Status: [ ] — sized 1 tick.** Promoted via `/oversight`
> 2026-05-16 with explicit register pick from the user:
> **all places** — `WILDS · STRIFE · SELF · SACK`.
> Unblocks the deferred `[needs-user-call]` critique row
> (pass 2, commit `d967f27`).
>
> **Subsequent rename (Phase 32 — port from the Claude Design
> handoff, 2026-05-16, commit `ff37b46`):** SACK → SATCHEL.
> The live tab title is `SATCHEL` now; every `SACK` in this
> brief reads as the Phase 31 shipped state, not the current
> string. See `state/presenters/tabs.engine.ts:TAB_TITLES` for
> the live register.

## Outcome

Flip the four bottom-tab titles from the current mixed-register
set (`MAP · COMBAT · SHEET · SACK` — three places + one
event-state) to a coherent all-places register
(`WILDS · STRIFE · SELF · SACK`). Per the critique row, the
register-mix wobbled the navigation's voice; per `/oversight`,
the user chose places over verbs.

Phase 30 already extracted `TAB_TITLES` to
`state/presenters/tabs.engine.ts` and added the explicit
`tabBarLabel:` escape hatch on every `<Tabs.Screen>`. This phase
is therefore a one-line edit of the presenter constant + one
test-assertion update — the design pass itself.

## Decisions made upfront — DO NOT ASK

1. **Register: all places.** User pick via `/oversight` 2026-05-16.
   The verbs alternative (`ROAM · STRIKE · KNOW · BEAR`) was
   considered and not chosen.
2. **Exact strings.**
   - `exploration` → `WILDS`
   - `combat` → `STRIFE`
   - `character` → `SELF`
   - `inventory` → `SACK`
3. **Icons stay as-is.** Phase 12 polished icons (eye / sword /
   crown / bag); the icon-noun pairing under the new register is
   coherent (WILDS↔eye, STRIFE↔sword, SELF↔crown, SACK↔bag) and
   doesn't require icon work this tick.
4. **Update the canonical-register pin test in
   `state/e2e/tabs.engine.test.ts`.** Phase 30 Tick B added a
   `it('matches the canonical pre-Phase-31 register …', …)` case
   that explicitly anticipated this update; re-pin to the new
   strings.
5. **No screen-reader / a11y changes.** `tabBarAccessibilityLabel`
   defaults to `tabBarLabel` in expo-router, and the new strings
   are clear nouns; no override needed.
6. **No badge changes.** The `selectTabBadges` predicate is
   keyed on `TabKey`, not the display string — `levelup` and
   `event` badges continue to work unchanged.

## Pages × tests matrix

| Surface | Test file | Cases (delta) |
|---|---|---|
| `TAB_TITLES` constant | `state/e2e/tabs.engine.test.ts` | update 1 (canonical-register pin) |

No new tests; the contract suite from Phase 30 Tick B already
covers non-empty + no-template-leak invariants and will
continue to pass against the new strings.

## Verify gate

```bash
pnpm verify
```

Baseline 410/410 (post-`fb53af0`). Target green; no test count
change.

## Deploy gate

Stub (manual EAS). Real verification requires a fresh preview
build to confirm the tab bar paints the new strings on device.

## Commit body template

```
feat(spec31): tabs design pass — flip to all-places register

Phase 31 ships the user-picked register from `/oversight`
2026-05-16: `WILDS · STRIFE · SELF · SACK` (was
`MAP · COMBAT · SHEET · SACK`). One-line presenter edit thanks
to Phase 30 Tick B's `TAB_TITLES` extraction.

- state/presenters/tabs.engine.ts: flip the four strings.
- state/e2e/tabs.engine.test.ts: update the canonical-register
  pin to the new strings (the test comment explicitly anticipated
  this update).

Verify: 410/410 (unchanged).

Closes Phase 31 mirror.
```
