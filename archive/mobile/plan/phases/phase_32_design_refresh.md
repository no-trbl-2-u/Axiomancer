# Phase 32 — UI refresh from Claude Design handoff (rolling port)

> **Status: [ ] — rolling phase, no fixed tick count.** Filed
> via `/plan-a-phase` 2026-05-16 with topic "Update the UI with
> the new designs from Claude design." Mirrors the
> Phase 17 → Phase 28 pattern that shipped Token Crucible from
> this same design source.
>
> **Refreshed via `/oversight` 2026-05-18.** Ticks A–D have
> shipped (see Sub-tick log below). Loop has been idle ~25h
> after tick D's `[MED EMPTY_MESSAGE sack→satchel]` catch-up
> cleared the post-rename narrative debt. No new port commit
> has landed since `7dab20c` (encounter modal seam port,
> 2026-05-17), so `/march`'s detect-and-defer is firing
> correctly. **Resume condition:** user pushes the next
> `feat: <surface> — port from design handoff` commit; the
> following `/march` tick picks up tick E.

## Outcome

The user ports new visual designs from the upstream Claude
Design board into the mobile app. The autonomous loop wraps
each port with the project's hermetic-test contracts so the
new UI surfaces are reachable from the existing presenter /
view-model / smoke-render harness machinery.

**Design source:** Claude Design at
<https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>
(authenticated; the loop cannot fetch the contents directly —
the user is the source of truth for what each port contains).

This is a **rolling phase**: each ported surface is its own
sub-tick (`Phase 32 Tick A`, `Phase 32 Tick B`, …). The phase
stays `[ ]` until the user has finished porting and every
sub-tick has its hermetic-test follow-up. No upper bound on
sub-ticks; the phase closes when the user signals "done with
the design pass" via `/oversight` and the build plan flips it
to `[x]`.

## Dispatch rule (for `/march`)

**Set via `/oversight` 2026-05-16: detect-and-defer.**

`/march` is the autonomous outer dispatcher (`skills/march.md`).
On a Phase 32 row that's still `[ ]`, the standard dispatch
would hand off to `/ship-a-phase`. Phase 32 overrides that
default with a detection step the loop runs first:

1. Read the last `Phase 32 Tick <X>` sub-tick commit (search
   `git log --grep='spec32 tick'`). If none exists, the
   relevant "last point" is the Phase 32 brief commit itself.
2. Look for any commit subject matching either
   `feat: <surface> — port from design handoff` or
   `feat: <surface> — port design spec` that landed **after**
   that last point. (The second phrase was introduced 2026-05-19
   when a fresh design bundle landed; the dispatch rule
   matches either historic phrase so Tick A–F commits keep
   parsing.)
   - **Found** → `/ship-a-phase` proceeds: extract presenter,
     add hermetic tests, integrate with smoke-render harness.
     The sub-tick body follows §"Sub-tick decomposition" item 2
     ("Loop commit") below.
   - **Not found** → `/march` **skips Phase 32** for this tick
     and falls through to its normal cascade (data backlog →
     expand → iterate). It logs `phase 32: no new port commit
     since <last point> — defer.` and does NOT invent a port
     from the design URL (which it can't fetch).

The detect-and-defer rule preserves the rolling-phase contract:
the user is the source of truth for porting; the loop never
gets ahead of an actual port commit. Phase 32 stays `[ ]`
across many `/march` ticks where no port has happened; that's
expected, not stuck.

If the user wants to *pause* Phase 32 entirely (e.g. they're
not porting for the foreseeable future), they flip the row to
`[skipped]` via `/oversight` — that removes Phase 32 from
`/march`'s dispatch path until they flip it back to `[ ]`.

## Sub-tick log

Tracks every shipped Phase 32 sub-tick. Added via `/oversight`
2026-05-18 (the rolling phase had no log section originally;
the build plan's Phase 32 row already pointed here for context,
but the brief itself didn't enumerate ticks). Each entry: user
port commit → loop follow-up commit.

| Tick | User port | Loop follow-up | Surface |
|---|---|---|---|
| A | `ff37b46` — tabs + event combat-prelude | `08bcf5e` — event combat-prelude chrome presenter + hermetic tests | Event combat-prelude chrome (drawer / tabs) |
| B | `70c9f7a` — exploration step-cards + LEAGUES | `8c5f985` — exploration step-cards presenter + hermetic tests | Exploration drawer step-cards |
| C | `9222bf9` — combat phase-stack | `843f304` — combat phase-stack presenter + hermetic tests | Combat phase-stack readout |
| D | `7dab20c` — encounter modal seam | `bf13539` — encounter modal seam presenter + hermetic tests | Encounter modal over map seam |
| E | `02beaeb` — inventory equipment dock + design handoff bundle | `2a23047` — inventory equipment dock presenter + hermetic tests | Inventory Equipment Dock (paper-doll + 7 slots) |
| F | `9c6024d` — inventory slot filter | `cc38107` — inventory slot filter presenter + hermetic tests | Inventory slot filter (tap-to-filter UX + banner chrome) |
| G | `05127df` — inventory item glyphs (port design spec) | _self-contained, no separate follow-up_ | Per-slot ItemGlyph variants (helmet / gauntlet / boot / breastplate / ring) |
| H | `d7489a2` — exploration node toast (port design spec) | _self-contained, no separate follow-up_ | Locked / consumed node feedback toast (`'this way is sealed'` / `'walked already'`) |

**Tick-D catch-ups** (post-tick repairs from `/critique` + audit
passes drained against the new surfaces, not separate ticks):

- `6251e83` — exploration drawer literal lift (`WHITHER
  PILGRIM` + `LEAGUES` onto VM, Hard Rule #8 close-out).
- `234c7a6` — EncounterModalOverlay hermetic component test
  (3 contracts pinned).
- `cfac6f1` — EncounterModalOverlay JSDoc refresh
  (vm.preludeChrome contract).
- `aeec2c3` — memoir alignment chip `'untested.'` split
  (chrome + narrative).
- `2822455` — inventory EMPTY_MESSAGE `'sack'` → `'satchel'`
  (Phase 32 SACK → SATCHEL chrome-sweep narrative catch-up).

Next: tick I (awaiting next user `feat: <surface> — port design spec`
or `port from design handoff` commit per dispatch rule). See
[`/design-spec.md`](../../design-spec.md) at the repo root for the
inventory of un-ported surfaces from the design bundle.

## Sub-tick decomposition

Each sub-tick splits in two commits, mirroring the
Phase 17 / Phase 28 pattern that's already shipped end-to-end:

1. **User commit**: `feat: <surface> — port from design handoff`.
   The user authors the port — new screen, modified existing
   screen, new component, whatever the design specifies.
   Anything goes; the loop reads the diff afterwards.
2. **Loop commit**: `feat(spec32 tick <X>): <surface> presenter
   + hermetic tests`. The next `/march` tick:
   - Reads the user's port diff.
   - Extracts any in-component logic into a colocated
     presenter (`<surface>.engine.ts`) per the locked
     presenter contract.
   - Adds hermetic e2e tests alongside the new code.
   - Ensures the surface appears in
     `state/e2e/smoke-render.engine.test.tsx`'s coverage if
     it's a new top-level screen / modal.
   - Routes any new ritual / accessibility copy through the
     presenter so the view layer carries no inline literals
     (Hard Rule #8).
   - Pins the new theme tokens (if any) in `theme/axm.ts`
     rather than letting hex literals leak into components.

## Routes / API endpoints / CLI surface — locked

No new routes or API contracts unless the design explicitly
adds a screen. New screens follow the existing expo-router
file-based routing convention (`app/<surface>/index.tsx` or
`app/<surface>.tsx`). If the design proposes a route change to
an existing screen, that's a separate explicit decision the
user surfaces via `/oversight`; this phase does not silently
re-route.

## Content / data reads — engine surface

Every read remains through the existing engine surface. The
design refresh is presentation-only: this phase **does not**
add new engine consumers. If a port needs an engine surface
the engine doesn't yet expose, that's a separate phase
(file via `/expand` or `/oversight` and gate Tick X on it).

## Components / handlers — modified per sub-tick

Surfaces commonly touched (non-exhaustive — the design board
is the source of truth):

- `app/(tabs)/exploration/index.tsx`
- `app/(tabs)/combat.tsx`
- `app/(tabs)/character/index.tsx`
- `app/(tabs)/inventory/index.tsx`
- `app/event/index.tsx`
- `app/crucible.tsx`
- `components/<atom>.tsx` for shared visual primitives
- `theme/axm.ts` for new tokens

Each sub-tick names which files it touched in the commit body.

## Cross-links

**In (verify before starting each sub-tick):**

- `pnpm verify` green at baseline (410/410 after Phase 31).
- The user's port commit landed and pushed.
- The smoke-render harness (`state/e2e/smoke-render.engine.test.tsx`,
  Phase 30 Tick A) is the canonical "screen mounts cleanly"
  contract; it surfaces the same identity-churn / blank-render
  / template-leak failure shapes that motivated its creation.

**Out (ships across sub-ticks):**

- `<surface>.engine.ts` — new or extended presenter per port.
- `state/e2e/<surface>.engine.test.ts` — new hermetic tests.
- `state/e2e/smoke-render.engine.test.tsx` — extended cases
  when new screens land.
- `theme/axm.ts` — new tokens when the design uses colors not
  already in `AXM.{bg, parchment, blood, sulfur, rust, bone,
  ash}`.

## Decisions made upfront — DO NOT ASK

1. **The user drives the port; the loop follows.** Claude
   Design is authenticated, so the loop cannot read the design
   contents directly (HTTP 403 from WebFetch). User authors
   each `feat: <surface> — port from design handoff` commit;
   `/march` does the testing + extraction afterwards. This is
   the Phase 17 / Phase 28 precedent applied as a standing
   pattern.
2. **Voice register survives the design refresh.** Even if
   the design shows new copy strings, the bearings voice rule
   stands: terse, archaic, ritual, **no second-person archaic
   pronouns** (thee / thou / thy / thine / ye). If the design
   board uses banned pronouns, the loop swaps them for
   register-equivalent alternatives during the test-and-extract
   tick. Set via `/oversight` 2026-05-15; bearings line 180-184.
3. **Hard Rule #8 (content stays in the proper layer) survives
   the design refresh.** Any visible ritual copy lands in the
   presenter (`vm.<field>`), not as a literal in the screen
   tree. The smoke-render harness's `expectNoTemplateLeaks` +
   `expectNonEmptyBody` contracts catch regressions; the
   per-screen tests pin the specific strings.
4. **Theme tokens win over hex literals.** If the design uses
   a color outside the existing palette, the loop's
   test-and-extract tick adds a token to `theme/axm.ts`
   (e.g. `AXM.<new-token>`) and updates the port to consume
   the token. The user's port commit may temporarily use hex
   literals; the loop normalizes them on the follow-up.
5. **No engine API additions in this phase.** The refresh is
   presentation-only. If a port needs a new engine surface,
   the loop halts the sub-tick and files a candidate via
   `/expand` or surfaces via `/oversight`; it does not
   patch the engine package locally.
6. **No `design/` folder is created speculatively.** Bearings
   line 152-158 notes the project doesn't use a `design/`
   export folder today. If the user wants one (e.g. to drop
   screenshots, decision logs, or exported style guides
   adjacent to the code), that's a separate decision; this
   phase doesn't create it.
7. **Smoke-render coverage is mandatory for any new screen.**
   If a sub-tick adds a new top-level screen / modal, it
   appears in `state/e2e/smoke-render.engine.test.tsx`'s
   `describe('smoke-render: each primary surface')` block
   before the sub-tick can commit. This is the same gate
   Phase 30 Tick A locked in for the existing five surfaces.
8. **One surface per sub-tick.** Each sub-tick covers exactly
   one design surface. Bundling multiple screens into a single
   commit makes the loop's test-and-extract tick harder to
   keep verify-green incrementally.

## Pages × tests matrix

Per sub-tick:

| Surface (per Tick) | Test file | Cases (delta per sub-tick) |
|---|---|---|
| The ported surface | `state/e2e/<surface>.engine.test.ts` (new or extended) | +2-5 per sub-tick: shape contract; behavioural fixture; empty / loading / error state |
| The ported surface (render) | `state/e2e/smoke-render.engine.test.tsx` | +0 if existing screen; +2-3 if new screen (no-throw, no-template-leak, non-empty body) |

Verify target: +2-8 hermetic tests per sub-tick. No upper bound
on phase total; current baseline is 410.

## Verify gate

```bash
pnpm verify
```

Baseline 410/410 (post-`fb53af0`). Each sub-tick lands +verify
delta as documented in its commit body. Phase closes (`[x]`) when
the user signals "done porting" via `/oversight` and the loop
has no outstanding sub-ticks; the final tick may include a
broader audit pass to confirm the smoke-render harness covers
every new surface end-to-end.

## Deploy gate

Stub (manual EAS). Each sub-tick logs the same "no builds found
for commit X" deploy-check output; on-device verification waits
for the next manual `npm run deploy:preview` after a meaningful
batch of sub-ticks lands. The hermetic harness substitutes for
deploy-time verification during the rolling port.

## Commit body templates

**User commit (per port):**

```
feat: <surface> — port from design handoff

Ports the <surface> design from Claude Design at
<https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>.

- <files touched>
- <key visual / behavioural changes>

Phase 32 sub-tick — `/march` will follow up with presenter
extraction + hermetic tests in the next loop tick.
```

**Loop follow-up commit (per sub-tick):**

```
feat(spec32 tick <X>): <surface> presenter + hermetic tests

Phase 32 sub-tick <X> — wraps the user's <surface> port
(commit `<port-sha>`) with the project's test contracts.

- state/presenters/<surface>.engine.ts (extracted / extended):
  <pure mapper changes>.
- state/e2e/<surface>.engine.test.ts (new / extended):
  +<N> hermetic cases pinning <contract>.
- state/e2e/smoke-render.engine.test.tsx: <added a new
  surface block | no-op — screen already covered>.
- <any theme/axm.ts additions for new tokens>

Decisions per the brief:
- <any non-obvious calls the test-and-extract made>.

Verify: <new>/<new> (was <old>; +<delta>).
```

## DoD

Phase 32 closes (`[x]`) when **all** of:

1. The user has signaled "design refresh complete" via
   `/oversight` (no implicit close; the rolling phase needs an
   explicit user end-of-pass).
2. Every user port commit has its paired loop follow-up commit
   (presenter + hermetic tests + smoke-render coverage).
3. `pnpm verify` is green at the closing commit.
4. The smoke-render harness covers every primary surface
   touched by the refresh.

## Follow-ups (out of scope this phase)

- **Asset swap pipeline.** If the design replaces the coded
  SVG placeholders with real artwork, the
  `.cursor/skills/swap-asset-placeholder/SKILL.md` flow handles
  that — separate from this phase.
- **New engine surfaces.** Any port that needs an engine field
  the engine doesn't expose halts that sub-tick and files via
  `/expand`. The engine-team handoff doc
  (`docs/engine-team-handoff-2026-05-16.md`) already lists the
  current engine asks; new ones append there.
- **`design/` folder convention.** Adopting the
  `nexus/customization/visual-system.md` `design/` export
  pattern is a separate decision the user makes when ready;
  not gated on this phase.
