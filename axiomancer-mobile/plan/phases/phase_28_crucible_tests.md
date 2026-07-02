# Phase 28 — Token Crucible retroactive brief + hermetic test coverage

> **Status: [ ] — sized 1-2 ticks.** Promoted via `/oversight`
> 2026-05-15 (score 6.5). Candidate filed in expand pass 6.

## Outcome

Three deliverables, in order:

1. **Phase 17 retroactive brief.** Author
   `plan/phases/phase_17_token_crucible.md` from commit
   `261a238` + the Claude Design URL. Brief documents what
   Token Crucible is, what it ships, and what the design source
   constrains. Future critique / iterate passes have an anchor.
2. **`selectTokenCrucibleViewModel` presenter.** Move the
   in-component derivations (per-stance skill filtering,
   castable-now calculation, accrual rules table, legend key)
   out of `components/TokenCrucible.tsx` into
   `state/presenters/token-crucible.engine.ts`.
3. **Hermetic e2e.** New `state/e2e/token-crucible.engine.test.ts`
   covering VM shape contract, the 12-skill library shape,
   `canAfford` matrix (each token-pool input × each skill),
   deep-freeze invariant.

## Routes / API endpoints / CLI surface — locked

None. Internal refactor + brief authoring.

## Content / data reads — engine surface

Mobile-side only. Token data lives in
`state/mocks/tokens.fixture.ts` (still — Phase 16
`[skipped]` tracks the engine drain). The presenter consumes
the fixture directly until the engine release lands.

| Helper | From | Use |
|---|---|---|
| `TOKEN` / `TOKEN_KEYS` / `TOKEN_SKILLS` / `TOKEN_RULES` | `state/mocks/tokens.fixture.ts` | Source data the VM composes |
| `canAfford(skill.cost, pool)` | `state/mocks/tokens.fixture.ts` | Pure predicate |
| `freezeViewModel` | `state/presenters/freeze.ts` | Standard deep-freeze on the VM |

## Components / handlers — modified

**New file:**

- `state/presenters/token-crucible.engine.ts`
  - `TokenCrucibleViewModel` type — exposes:
    - `pool: TokenCounts` (the player's current token counts)
    - `tokenMeta: Record<TokenKey, TokenMeta>` (display palette)
    - `tokenKeys: readonly TokenKey[]`
    - `skillsByStance: Record<StanceKey, readonly SkillRow[]>` — each row carries `{ id, name, tier, costEntries, castableNow }`
    - `rules: readonly TokenRule[]` (accrual rules table from fixture)
    - `legend: LegendEntry[]` (one-line keys per token kind)
  - `selectTokenCrucibleViewModel(pool: TokenCounts): TokenCrucibleViewModel`
  - Pure data — no `useGameState` inside the presenter; the screen calls it with whatever pool it has.

**Modified file:**

- `components/TokenCrucible.tsx`
  - Drop the inline `skillsByStance` filter + the inline
    castable-now check; replace with a single
    `selectTokenCrucibleViewModel(tokens)` call.
  - Render directly from the VM.

**New test file:**

- `state/e2e/token-crucible.engine.test.ts`
  - VM shape contract: every field present + typed correctly on a default pool.
  - `skillsByStance` partition: 12 skills total, partitioned across heart/body/mind, no duplicates.
  - `canAfford` matrix: for each skill, assert castable-now flag against multiple synthetic pools (full pool, empty pool, exact-cost pool).
  - Deep-freeze invariant: `Object.isFrozen(vm)` and `Object.isFrozen(vm.skillsByStance)`.

## Phase 17 retroactive brief — content sketch

The new `plan/phases/phase_17_token_crucible.md` should mirror
the format of other shipped phase briefs (e.g.
`plan/phases/phase_5_character_screen_wiring.md`):

- Status header: `[x] — shipped retroactively 2026-05-15 in commit 261a238; brief filed 2026-05-16 via Phase 28`.
- Scope: port the five-resource token pool UI from the Claude
  Design handoff. Files shipped: `app/crucible.tsx`,
  `components/TokenCrucible.tsx`, `components/tokens.tsx`,
  `state/mocks/tokens.fixture.ts`. Modal-style route accessed
  from the character tab.
- Design source: Claude Design URL (per
  `plan/bearings.md` External services row 04).
- What this brief does NOT cover: engine skill-library wiring
  (Phase 16 `[skipped]`); hermetic test coverage (Phase 28,
  this commit).
- Cross-links: bearings hard rule on tests-alongside-code; the
  `[design-source]` AUDIT row that resolved 2026-05-15.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline (361/361 after Phase 27).
- `components/TokenCrucible.tsx` and `state/mocks/tokens.fixture.ts` unchanged since `261a238`.

**Out (ships in this phase):**

- `plan/phases/phase_17_token_crucible.md` — NEW.
- `state/presenters/token-crucible.engine.ts` — NEW.
- `components/TokenCrucible.tsx` — refactor to consume VM.
- `state/e2e/token-crucible.engine.test.ts` — NEW.
- `plan/steps/01_build_plan.md` — Phase 17 row's
  `(to be drafted)` parenthetical updated to name the brief
  path; Phase 28 row flipped `[ ]` → `[x]`.

**Retro-fit (out of scope, follow-up):**

- Phase 16: engine skill library drain (waits on engine release).
- Live `pool` integration: the Crucible currently renders against
  a default pool prop; wiring it to actual engine player resources
  is a follow-up iterate row when `axiomancer-mechanics` exposes
  the resource pool surface.

## Decisions made upfront — DO NOT ASK

1. **Presenter pattern matches existing screens.** The VM shape
   mirrors `selectCombatViewModel` / `selectCharacterViewModel`
   — flat data fields, no event handlers, no colour tokens
   (the screen still resolves accent from `tokenMeta`).

2. **`pool` is the presenter's input, not state.** The
   Crucible's pool comes from a prop today (default
   `DEFAULT_POOL`). The presenter takes `pool` as an argument,
   not a `state` argument like other presenters — until the
   engine ships a player-resource surface, there's nothing to
   read from the store. Future migration will swap the prop
   for a `useGameState` selector.

3. **No new mobile state slice.** The Crucible doesn't need
   one; pool is ephemeral / illustrative until engine wires up.

4. **Retroactive brief filed in same commit as the extraction**
   — both are Phase 28's deliverables. Phase 28's commit
   subject names the brief as a separate bullet.

5. **`canAfford` lives in the fixture** (already there); the
   presenter just calls it. Don't reimplement.

6. **No screen-rendering test.** Reader's existing
   `components/StanceGlyph.test.tsx` precedent: component
   tests are sparse on this project. The VM tests are the
   bulk of the value. A render test could land as an iterate
   row if needed.

## Pages x tests matrix

| Surface | Test file | Cases |
|---|---|---|
| VM shape | `state/e2e/token-crucible.engine.test.ts` | (1) all fields present + typed; (2) `skillsByStance` partition = 12 skills total, per-stance counts add up |
| `canAfford` integration | same | (a) full pool → all castable; (b) empty pool → none castable; (c) exact-cost pool → matched skill is castable, others not |
| Invariants | same | (i) deep-freeze on returned VM, (ii) freeze on `skillsByStance` array |
| Rules / legend | same | accrual rules and legend non-empty arrays surfaced from the VM |

Expected delta: **`+6-8` hermetic tests**.

## Verify gate

```bash
pnpm verify
```

Target: green. Current baseline 361/361. Expected `~367-369` after ship.

## Deploy gate

Stub. No deploy-side change.

## Commit body template

```
feat(spec17): Token Crucible retroactive brief + presenter + tests (Phase 28)

Three deliverables (per the Phase 28 brief):

1. plan/phases/phase_17_token_crucible.md drafted retroactively
   from commit 261a238 + the Claude Design URL.
2. state/presenters/token-crucible.engine.ts extracted from
   components/TokenCrucible.tsx in-component logic. New
   selectTokenCrucibleViewModel(pool) presenter.
3. state/e2e/token-crucible.engine.test.ts: +6-8 hermetic
   tests pinning VM shape, skill-library partition, canAfford
   matrix, deep-freeze invariant.

Decisions per the brief:
- Pool stays a presenter arg (no store slice) until engine
  ships a player-resource surface.
- VM shape mirrors existing presenter patterns.
- canAfford stays in the fixture; presenter calls it.

Closes the bearings hard-rule violation that Phase 17 backfilled
without tests-alongside-code. Phase 16 (engine skill-library
drain) is independent and stays [skipped].

verify: N tests passing.

Closes #48
```

## Definition of Done

1. `plan/phases/phase_17_token_crucible.md` exists with the
   Phase 17 retroactive brief.
2. `state/presenters/token-crucible.engine.ts` exports
   `selectTokenCrucibleViewModel` + `TokenCrucibleViewModel`
   type.
3. `components/TokenCrucible.tsx` consumes the VM (no inline
   skill filter, no inline canAfford loop).
4. `state/e2e/token-crucible.engine.test.ts` exists and passes.
5. Phase 28 row in `plan/steps/01_build_plan.md` flipped
   `[ ]` → `[x]` with commit hash; Phase 17 row's `(to be
   drafted)` parenthetical replaced with a brief-path link.
6. Phase log entry appended.

## Follow-ups (out of scope this phase)

- **Live pool integration.** Replace the `DEFAULT_POOL` prop
  with engine-read state once the engine exposes a resource
  surface. Iterate row.
- **Component render test.** Optional; can land as an iterate
  row.
- **Phase 16: engine skill library drain.** Still
  `[skipped]` — engine release gated.
