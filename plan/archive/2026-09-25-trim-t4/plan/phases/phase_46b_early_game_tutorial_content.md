# Phase 46b — Early-game: canned preset-deck tutorial content

> Build-plan row: `Phase 46b — Early-game: canned preset-deck tutorial
> content. Implements 46a's ruling. (mechanics content + mobile) Deps: 46a.`

> Implements `plan/phases/phase_46a_early_game_rethink.md` D4 + D5. That
> brief resolved every design question; this one is the small implementation
> pass. No new design decisions are open here — where 46a left an
> implementation-shape choice (D4's picker-UI fork), this brief locks it.

## 1. Outcome

A brand-new player (no `BUNDLE_CHOSEN_FLAG`, no seeded cards) can no longer
land on the 45-card, late-campaign Apostate's Canon as their first-ever
deck. They are seeded straight into the neutral Threadbare Office and sent
to the map — no picker with a single real option standing between them and
their first fight. Returning players and saves that already carry a
`bundle:pilgrim` / `bundle:apostate` flag are untouched.

## 2. Locked decisions (from 46a, restated for the shipping agent)

- **D4 UI-shape fork resolved: option (b).** `BundleSelectScreen` is no
  longer rendered on the new-player path. `app/index.tsx` auto-seeds
  `threadbare` the moment `needsBundleSelection` would have fired, then
  redirects — no extra tap. Rationale already locked in 46a: "a picker with
  exactly one option is friction with no payoff." `pilgrim` / `apostate`
  stay live as internal balance/lineage data
  (`STARTER_BUNDLES`/`PRESET_LINEAGE`) — nothing in the engine or
  `store-actions.ts`'s existing exports changes shape.
- `BundleSelectScreen.tsx` itself is left in place (not deleted) — it's a
  small, self-contained, correctly-behaved component that may be reused by
  a future flow (e.g. a dev-menu deck switcher); only its wiring into the
  new-player path in `app/index.tsx` is removed. Its existing jest mock in
  `app-routes.engine.test.tsx` is removed since nothing exercises it there
  anymore.
- No `GAME_STATE_VERSION` bump (confirmed in 46a D4 — this changes which
  choice is *offered*, not the save shape).
- D5: audit of `CombatTutorialPrimer` / `CombatTutorialCoach` /
  `combat-tutorial-steps.ts` against the current Threadbare Office card set
  — **holds up, no rewrite needed.** All three are pure mechanic-level copy
  (VITAE, POISON/STAGGER, dice-draft-then-power, "Signature Skills," the
  mercy/befriend line) with zero references to specific card names or the
  pre-Profane-Canon preset roster. The `mercy`/befriend mechanic they
  reference is still live (`combat.reducer.ts`, `combat.engine.ts` et al.).
  This phase's job here is the regression test locking that in (§5), not a
  content rewrite.

## 3. Implementation

- `axiomancer-mobile/state/combat/store-actions.ts` — export
  `NEW_PLAYER_STARTER_BUNDLE_ID = 'threadbare'` next to `STARTER_BUNDLES`,
  with a short comment pointing at this phase's ruling (D4), so the
  new-player default has one named source of truth instead of a bare string
  literal at the call site.
- `axiomancer-mobile/app/index.tsx` — replace the `needsBundleSelection`
  branch that rendered `<BundleSelectScreen>` with a `useEffect` that calls
  `seedStarterBundleAction(store, NEW_PLAYER_STARTER_BUNDLE_ID)` once
  `needsBundleSelection` is true, and renders `null` for that one frame
  (the effect flips `bundleChosen` via the store, which re-renders straight
  to the existing `<Redirect>`). Drop the now-unused `BundleSelectScreen`
  import and the `bundlePicked` local state (no longer needed — the store
  flag alone now drives the branch).

## 4. Cross-links

- **In:** none — this is the entry route, already the first thing every
  new player hits.
- **Out:** none new — `BundleSelectScreen` stops being reachable from the
  new-player path; no other surface links to it directly (confirmed: only
  `app/index.tsx` and its own test import it).
- **Retro-fit:** none needed.

## 5. Pages × tests matrix

- `axiomancer-mobile/state/e2e/app-routes.engine.test.tsx` — replace the
  two picker-specific tests (`'offers a starter bundle after a new player
  dismisses the title'`, `'proceeds to the map once a starter bundle is
  chosen'`) with one that pins the new behavior: dismissing the title as a
  brand-new player auto-seeds `threadbare` (assert
  `chosenStarterBundle(store)?.id === 'threadbare'` and
  `store.getState().player.knownCards.length > 0`) and redirects straight
  to `/exploration` — no `bundle-select` test id ever renders. Remove the
  `jest.mock('@/components/BundleSelectScreen', ...)` block since nothing
  in this file exercises it anymore.
- `axiomancer-mobile/state/combat/__tests__/starter-bundles.test.ts` — add
  one small test: `NEW_PLAYER_STARTER_BUNDLE_ID` resolves to a real bundle
  via `starterBundleById` (`'threadbare'`, `archetype: null`, matching the
  existing "unmapped-archetype bundle" coverage shape already in this
  file).
- No new component/unit test files — the surface touched is a route + one
  exported constant, both covered by the two edits above.

## 6. Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

Mobile-only diff (`app/index.tsx`, `state/combat/store-actions.ts`, two
test files). No mechanics package changes — no need to also run the
mechanics/card-editor legs (bearings.md's "public surface" trigger for that
is engine changes; `STARTER_BUNDLES` itself, the mechanics-facing surface,
is untouched).

## 7. Commit body template

```
feat(mobile): collapse new-player starter picker to Threadbare — phase 46b

- app/index.tsx: brand-new players auto-seed the Threadbare Office and
  skip straight to the map instead of choosing from all three campaign
  snapshots (Threadbare/Pilgrim/Apostate).
- store-actions.ts: export NEW_PLAYER_STARTER_BUNDLE_ID as the named
  source of truth for the new-player default.
- BundleSelectScreen no longer wired into the new-player path (component
  kept, unused wiring removed); pilgrim/apostate remain live as internal
  balance/lineage data, unreachable through the new-player flow only.
- Regression coverage: app-routes e2e pins auto-seed + direct redirect;
  starter-bundles test pins the new constant resolving to a real bundle.

Decisions:
- Implements 46a's D4/D5 ruling verbatim; D4's UI-shape fork resolved to
  option (b) (auto-seed, no ceremony) per 46a's own stated preference.
- D5 audit of the primer/coach tutorial script found no drift against the
  current Threadbare card set — ships as a pinning regression test, not a
  rewrite.

Closes #<phase-issue-number>
```

## 8. DoD

- [ ] `NEW_PLAYER_STARTER_BUNDLE_ID` exported from `store-actions.ts`.
- [ ] `app/index.tsx` auto-seeds it for brand-new players; no picker on
      that path.
- [ ] `BundleSelectScreen`'s new-player wiring removed; component file
      untouched otherwise.
- [ ] `app-routes.engine.test.tsx` updated to pin the new flow.
- [ ] `starter-bundles.test.ts` extended per §5.
- [ ] `npm run verify --workspace axiomancer-mobile` green.
- [ ] Committed + pushed; `01_build_plan.md`'s Phase 46b row ticked `[x]`
      with the commit hash in a separate commit, per `ship-a-phase.md`
      Step 11.

## 9. Follow-ups (out of scope)

- Phase 46c (Quest Board tutorial re-derivation, redirected per 46a D6) —
  separate row, separate phase.
- Any future dev-menu "switch starter bundle" tool that might re-use
  `BundleSelectScreen` — not scoped here, noted only so the component isn't
  mistaken for dead code in a later pass.
