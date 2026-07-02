# Phase 17 — Token Crucible (five-resource pool UI)

> **Status: [x] — shipped retroactively 2026-05-15 in commit
> `261a238`. Retroactive brief filed 2026-05-16 via Phase 28.**
>
> The Crucible feature shipped directly from the user (not via
> the autonomous loop) as a port of the Claude Design handoff.
> This brief exists for traceability: future `/critique` and
> `/iterate` passes have an anchor for what Crucible is and what
> it deliberately does NOT do.

## Outcome

The Token Crucible is a standalone full-screen modal accessible
from the character tab. It explains the five-resource token
system (Body / Mind / Heart / Fallacy / Paradox) and surfaces:

- The player's current token pool.
- How each token accrues during combat (10 rules).
- The full 12-skill library, partitioned by stance (heart /
  body / mind), with a per-skill cost breakdown and a
  castable-now highlight.
- A short legend (`OWNED` / `OWED` / `CASTABLE NOW`).

The screen is **pure explainer / dashboard** — no engine state
mutation. It renders against a `tokens` prop (default
`DEFAULT_POOL`) until the engine ships a player-resource
surface.

## Design source

**Claude Design — <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>**
(per `plan/bearings.md` External services row 04). Ported from
`axiomancer/project/screens/tokens.jsx` in that handoff.

## Files shipped (in commit `261a238`)

- `app/crucible.tsx` (30 LOC) — route entry; full-screen modal
  Stack.Screen registration in `app/_layout.tsx`.
- `components/TokenCrucible.tsx` (378 LOC) — the screen body
  (header / current pool / accrual rules / 12-skill grid /
  legend). Phase 28 (`<phase-28-commit>`) refactored this to
  consume `selectTokenCrucibleViewModel`.
- `components/tokens.tsx` (252 LOC) — `TokenIcon` SVG glyphs +
  `TokenCost` chip component.
- `state/mocks/tokens.fixture.ts` (99 LOC) — `TOKEN` palette,
  `TOKEN_KEYS`, 12-skill `TOKEN_SKILLS` library, `TOKEN_RULES`
  accrual rules, `canAfford(cost, pool)` predicate.

Files touched to wire into the existing app:
- `app/(tabs)/character/index.tsx` — added a Pressable that
  pushes `/crucible`.
- `app/_layout.tsx` — registered the Crucible Stack.Screen as
  `fullScreenModal` (same pattern as `app/event/index.tsx`).
- `state/e2e/route-tree.engine.test.ts` — added
  `./crucible.tsx` to the pinned route list.

## Decisions made upfront (locked at design-handoff time)

1. **Five-token resource model.** Replaces a single MP number.
   Each skill demands a unique combination of tokens; the
   "earning your tokens" round-flow is part of the strategy.

2. **Three stance × four-skill grid (12 skills total).** Each
   stance has 4 skills, partitioned across tiers 1–3. Each
   skill is either `'fallacy'` or `'paradox'` category.

3. **Mobile-local fixture is canonical.** The engine surface
   ships the same `Skill.resourceCost` shape in
   `axiomancer-mechanics@0.6+`, but the top-level `skillLibrary`
   re-export is missing (per `plan/AUDIT.md`
   `[needs-engine-release]`). Until that lands, mobile owns the
   skill data via `state/mocks/tokens.fixture.ts`. Phase 16
   `[skipped]` tracks the drain.

4. **No live state integration.** The Crucible takes a
   `tokens` prop with `DEFAULT_POOL` as the fallback. Wiring to
   real engine player resources waits for the engine to ship
   such a surface — tracked as a Phase 28 follow-up.

5. **Modal pattern matches `app/event/index.tsx`.** Same
   Stack.Screen `presentation: 'fullScreenModal'` registration;
   same close affordance pattern.

## What this brief does NOT cover

- **Engine skill-library wiring.** Phase 16 `[skipped]` —
  engine release gated.
- **Hermetic test coverage.** Phase 28 (`<phase-28-commit>`)
  delivered:
  - `state/presenters/token-crucible.engine.ts` (presenter
    extracted from in-component logic)
  - `state/e2e/token-crucible.engine.test.ts` (VM shape,
    skill partition, canAfford matrix, deep-freeze invariant)
- **Live pool integration.** Iterate row when the engine ships
  a player-resource surface.

## Cross-links

- `plan/bearings.md` "External services" row 04 — Claude
  Design URL.
- `plan/AUDIT.md` Done — `[design-source]` row (resolved
  2026-05-15) that confirmed the design source.
- `plan/AUDIT.md` Pending — `[needs-engine-release]` row
  tracking the engine work needed for Phase 16.
- `plan/phases/phase_28_crucible_tests.md` — the phase that
  filed THIS brief alongside the presenter + tests.
- Bearings hard rule: tests-alongside-code. Phase 17 violated
  this; Phase 28 closed the gap.

## Definition of Done (retroactive)

All deliverables already shipped:

1. ✅ Crucible route + screen + components + fixture (commit
   `261a238`).
2. ✅ Character tab entry-point (commit `261a238`, modified
   `app/(tabs)/character/index.tsx`).
3. ✅ Route-tree e2e updated (commit `261a238`).
4. ✅ Phase 17 row in `plan/steps/01_build_plan.md` flipped
   `[x]` retroactively via `/oversight` 2026-05-15
   (commit `4a1a2b0`).

What Phase 28 added that Phase 17 should have included:
5. Presenter extraction + hermetic test coverage (this is
   Phase 28's deliverable).

## Follow-ups (out of scope for this brief)

- **Live `pool` integration** — replace `DEFAULT_POOL` prop
  with engine-read state once the engine exposes a
  player-resource surface. Iterate row.
- **Real asset for the Crucible** — currently uses procedural
  SVG via `TokenIcon`. Real artwork ships via the asset-swap
  workflow when ready.
- **In-combat token tooltip** — the Crucible is a standalone
  screen; the same rules will eventually surface as a tooltip
  during combat once engine wires up. Future phase, not Phase 28.
