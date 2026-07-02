# Phase 4 — Spec 03: Presenter layer

> Retroactive brief. Phase 4 was discharged across commits
> `e56184e` ("Spec 03: presenter scaffolds and hermetic e2e
> stubs") and `e378f99` ("Spec 03: presenter contract doc + spec
> status update") on 2026-05-12 — before the loop was adopted.
> This file exists so future ticks can see the contract that was
> shipped. No code work remains; this is bookkeeping substrate.

## Scope

Lock the `select<Screen>ViewModel(state, localUi?) → ViewModel`
contract that Spec 04 (Combat) already exemplifies, and extend
the convention to every screen with empty engine-typed stubs
plus hermetic e2e shape tests. Subsequent screen-wiring specs
(04, 05, 06, 07, 08) replace each stub with a real
implementation.

See `specs/03-presenter-layer.md` for the locked contract;
that spec is the source of truth. `docs/presenters.md` is the
plain-prose codification of the same contract.

## Files shipped (as of `e378f99`)

```
docs/presenters.md                       # 135-line contract doc — "locked by Spec 03"
state/presenters/freeze.ts               # recursive Object.freeze helper (dev-only)
state/presenters/combat.engine.ts        # was an early prototype; promoted here
state/presenters/combat-hud.engine.ts    # already shipped under Spec 01
state/presenters/character.engine.ts     # stub returning a constant fixture
state/presenters/inventory.engine.ts     # stub
state/presenters/exploration.engine.ts   # stub
state/presenters/event.engine.ts         # stub
state/presenters/tabs.engine.ts          # stub
state/e2e/character.engine.test.ts       # VM shape + deep-freeze invariant + adapter.save lifecycle
state/e2e/inventory.engine.test.ts       # ditto
state/e2e/exploration.engine.test.ts     # ditto
state/e2e/event.engine.test.ts           # ditto
state/e2e/tabs.engine.test.ts            # ditto
state/e2e/route-tree.engine.test.ts      # guards "no .engine.ts in app/" convention
docs/testing.md                          # updated to name *.engine.test.ts as canonical e2e
```

Existing `app/(tabs)/combat.tsx` dropped its direct
`axiomancer-mechanics` import and routes `FRIENDSHIP_COUNTER_MAX`
through the combat VM.

## Verify gate

```bash
npm run verify        # lint + tsc --noEmit + jest
```

Confirmed green at the branch's HEAD: 185 / 185 hermetic e2e
tests pass. Spec 03's own acceptance bar ("88 tests, green
twice in a row") cleared at ship time; the suite has since
grown to 185.

## Deploy gate

```bash
npm run deploy:check
```

Stub (exit 0) until phase 11. Unchanged by phase 4.

## Tests

The phase shipped one `*.engine.test.ts` per screen. Each pins:

- VM shape contract — every field present, correct primitive
  types.
- Deep-freeze invariant — `Object.isFrozen(vm)` (and nested
  arrays) holds in dev; the dev-only freeze comes from
  `state/presenters/freeze.ts`.
- Store-lifecycle: calling the selector does **not** trigger
  `adapter.save`. Pure read.

Subsequent specs (04, 06, 07) layered real engine reads on top
of these scaffolds; the shape contracts in the e2e files
survived unchanged.

## Decisions made upfront — DO NOT ASK

Mirrored from `specs/03-presenter-layer.md`'s "Open questions"
block. All answers shipped as the literal pattern:

1. **Naming:** A — `select<Screen>ViewModel` (e.g.
   `selectCombatViewModel`). Redux-flavoured but the right
   semantics.
2. **Argument shape:** A — `(state, localUi?)`. The screen
   passes its `useState` slice as the second arg for
   purely-ephemeral UI state the engine doesn't track.
3. **Immutability:** A — deep `Object.freeze` in dev (no-op
   in prod) via the shared `freeze.ts` helper.
4. **Memoisation:** A — Zustand selector + shallow-equal
   subscription; the presenter itself is pure-uncached.
5. **VM contents:** B (override of the default A) — VM is
   **just data**. Icons / palette / handlers stay on the
   component. The override was chosen so that screen-side
   theming stays decoupled from engine reshuffles.
6. **Localisation:** A — later. VM owns raw English strings
   for now.

Convention quietly added during Spec 03 implementation,
locked by `state/e2e/route-tree.engine.test.ts`: presenters
live under `state/presenters/<screen>.engine.ts`, **not**
inside `app/`. Expo Router's `require.context` walks `app/`,
so non-route files would crash the route tree. The route-tree
guard pins this — never move presenters into `app/`.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

None opened by this phase.

## Mobile reflow / responsive considerations

N/A — presenter layer, no UI surface. The presenters return
viewport-agnostic data; the screens (`app/(tabs)/*`) handle
reflow.

## Git

Two atomic commits: `e56184e` (scaffolds + e2e stubs) followed
by `e378f99` (contract doc + spec status to READY FOR REVIEW).
Phase 4's row flip + Phase log entry land in a follow-up
`plan: phase 4 shipped — presenter layer` commit.

## DoD

After commit + push of the implementation (already done at
`e378f99`):

1. Flip Spec 03 status header from `[READY FOR REVIEW —
   2026-05-12]` to `[DONE on 2026-05-12 — see commit e378f99]`.
2. Move Spec 03 from "Next up" to "Already shipped" in
   `plan/steps/01_build_plan.md`.
3. Flip Phase 4's `[ ]` → `[x]`, append commit hash.
4. Remove the stale "`docs/presenters.md` pre-dates the
   presenter contract lock — phase 3 rewrites it" carry-over;
   the doc was authored *by* Spec 03 and is the contract
   itself.
5. Add Phase log entry: `phase 4 — e378f99 — presenter layer
   contract (Spec 03; docs/presenters.md, 5 *.engine.ts stubs,
   route-tree guard, freeze.ts helper, deep-freeze invariant)`.

## Confirm deploy

```bash
npm run deploy:check
```

Exit 0 (stub).

## Follow-ups (out of scope this phase)

- **Spec 05 (Phase 5) — Character screen wiring.** First
  consumer of the locked contract for the character tab.
- **Spec 08 (Phase 6) — Event screen wiring.**
- The combat / inventory / exploration screens already wire
  their presenters (shipped in 04 / 06 / 07).
