# Engine team handoff — `axiomancer-mechanics` 0.7.x → 0.8

> Authored 2026-05-16 by the `axiomancer-mobile` autonomous loop
> via `/oversight`, for handoff to the `axiomancer-mechanics`
> engine team. Three concrete asks; one real build bug found
> while preparing the document.

## tl;dr

Three distinct issues in `axiomancer-mechanics@0.7.0`, currently
blocking four mobile phases. Two are quick fixes; one is a
silent type-emission build bug worth fixing for any TypeScript
consumer of the engine. Verification recipe and mobile-side
unblock plan at the bottom.

## Mobile context (non-blocking)

- Mobile is pinned to `axiomancer-mechanics@0.7.0` exact after
  the `processNode` / `ResolvedEvent` API surface change in
  0.7.0 broke verify across the mobile project. The fix was a
  four-tick mobile migration (see mobile commits `f7d4212`,
  `3eb49c2`, …). Pinning exact prevents auto-bump surprises.
- Mobile uses an autonomous loop (`/march`) that ships fixes
  end-to-end; the loop respects `[needs-engine-release]` rows
  in `plan/AUDIT.md` and stops on engine-gated work rather than
  papering over it. The candidates blocked here are filed at
  `plan/PHASE_CANDIDATES.md` (Phase 20, 21, 22, 24).

## Issue 1 — Top-level re-export missing for `skillLibrary` / `getSkillById`

**Impact: blocks mobile Phase 16 + Phase 21 (skills wiring).**

`dist/Skills/index.d.ts` correctly exports the two symbols:

```ts
// dist/Skills/index.d.ts (current — 0.7.0)
export { skillLibrary, getSkillById } from './skill.library';
```

But the top-level `dist/index.d.ts` does not re-export them, so
`import { skillLibrary } from 'axiomancer-mechanics'` returns
`undefined`. Mobile would need to use the subpath import
(`from 'axiomancer-mechanics/Skills'`), which conflicts with
the pattern every other engine symbol follows (top-level
flat barrel).

### Fix

Add to `axiomancer-mechanics/src/index.ts`:

```ts
export { skillLibrary, getSkillById } from './Skills';
```

### Sanity check

```bash
node -e "const m = require('axiomancer-mechanics'); console.log(typeof m.skillLibrary, typeof m.getSkillById)"
# Expected: "object function" (or similar non-"undefined" pair)
```

## Issue 2 — Missing `types.d.ts` files in 8 of 9 sub-paths (build bug)

**Impact: silent at runtime; breaks any TypeScript consumer
that follows `import type { … } from 'axiomancer-mechanics/<Subpath>'`.
Latent risk for the entire ecosystem, not just mobile.**

Each `<Subpath>/index.d.ts` in the published dist contains a
re-export line like:

```ts
// dist/Skills/index.d.ts
export type { Skill, SkillCategory, … } from './types';
```

…but `dist/<Subpath>/types.d.ts` **is not emitted** for 8 of
the 9 sub-paths. Items is the only one that ships correctly:

```
=== Combat ===     MISSING types.d.ts
=== Game ===       MISSING types.d.ts
=== Enemy ===      MISSING types.d.ts
=== Effects ===    MISSING types.d.ts
=== Character ===  MISSING types.d.ts
=== NPCs ===       MISSING types.d.ts
=== World ===      MISSING types.d.ts
=== Items ===      OK   (reference for what the others should look like)
=== Skills ===     MISSING types.d.ts
```

(Reproducer: `find node_modules/axiomancer-mechanics/dist -name "types.d.ts"`.)

Mobile sidesteps this by pulling everything through the
top-level barrel, where the `.d.ts` re-exports resolve to
deeper source files that DO exist. But sub-path consumers
(libraries, design-system shells, anything doing `import type
{ Skill } from 'axiomancer-mechanics/Skills'`) fail with
"Cannot find module" at compile time.

The `.js` side works at runtime because the JS index re-exports
land at real files; only the `.d.ts` declarations are missing.

### Likely cause

A `tsconfig.json` or build-script that excludes `types.ts` from
the declarations emission, or splits sub-path tsconfigs with
mismatched `include` arrays. Items works, the rest don't — diff
the Items tsconfig against any other sub-path's tsconfig to
locate the fix.

### Sanity check

```bash
# After fixing:
find node_modules/axiomancer-mechanics/dist -name "types.d.ts" | sort
# Expected: at least Combat, Effects, Skills, Game, Character,
#           Enemy, NPCs, World, Items (9 total)

# Type-only round-trip:
echo "import type { Skill, SkillLookup } from 'axiomancer-mechanics/Skills'; const _: Skill = null as never;" > /tmp/check.ts
npx tsc --noEmit /tmp/check.ts
# Expected: passes; before the fix, fails with "Cannot find module"
```

## Issue 3 — `PersistenceAdapter` ergonomics

**Impact: low; blocks mobile Phase 24 (cleanup-only).**

Mobile locally re-declares the `PersistenceAdapter` interface
in `state/persistence/asyncStorageAdapter.ts` because the
engine's interface either isn't exported at the top level or
its shape has drifted slightly from the version mobile depends
on.

### Ask

Confirm the canonical engine interface and ensure it's
top-level exported:

```ts
// Expected at dist/index.d.ts
export type { PersistenceAdapter } from './Game/persistence';
```

If the shape has drifted (`load()` / `save()` signatures, return
types, async behaviour), document the canonical signature in the
engine's release notes so mobile can delete its local
re-declaration cleanly. Mobile's local interface is at
[`state/persistence/asyncStorageAdapter.ts`](../state/persistence/asyncStorageAdapter.ts)
for diff reference.

## Phase-by-phase impact table

| Mobile phase | Filed at | Blocked on | Will ship once unblocked |
|---|---|---|---|
| Phase 16 ([skipped] in build plan) | `plan/steps/01_build_plan.md` | Issue 1 | Drain `combat.skills.fixture.ts`; mobile reads engine `skillLibrary` directly. |
| Phase 21 (candidate) | `plan/PHASE_CANDIDATES.md` | Issues 1 + (2 for safety) | `executeSkill` wiring in combat resolver. |
| Phase 22 (candidate) | `plan/PHASE_CANDIDATES.md` | None on engine (independent) | Character presets adoption. Mobile could ship this anytime. |
| Phase 24 (candidate) | `plan/PHASE_CANDIDATES.md` | Issue 3 | `PersistenceAdapter` re-grounding (cleanup pass). |

Phase 22 is actually independent — mobile can ship it before
the engine release if the loop reaches it.

## Suggested release shape

A single patch release (`0.7.1` or `0.8.0`, your choice):

- **MUST**: Fix Issue 2 (`types.d.ts` emission). Single build
  config change.
- **MUST**: Fix Issue 1 (top-level re-export of `skillLibrary` /
  `getSkillById`). Two new lines in `src/index.ts`.
- **SHOULD**: Address Issue 3 if scope allows; otherwise note
  the canonical `PersistenceAdapter` shape in the release notes
  so mobile can match it.
- **CONTEXT**: The 0.6→0.7 `processNode` removal was disruptive
  for mobile (verify-red for several days). A small deprecation
  cycle for any future surface removals would help downstream;
  this is feedback, not a release blocker.

## Mobile unblock recipe (after the release)

```bash
# 1. Bump
pnpm install axiomancer-mechanics@latest

# 2. Sanity check Issue 1
node -e "const m = require('axiomancer-mechanics'); console.log(typeof m.skillLibrary, typeof m.getSkillById)"
# Expect: "object function" — both defined.

# 3. Sanity check Issue 2
find node_modules/axiomancer-mechanics/dist -name "types.d.ts" | wc -l
# Expect: 9 (currently: 3).

# 4. Verify mobile is still green at the new version
pnpm verify

# 5. Flip plan/steps/01_build_plan.md Phase 16 from [skipped] → [ ]
#    Promote candidate Phase 21 / 24 from plan/PHASE_CANDIDATES.md
#    /march picks up the work on the next tick.
```

## Contact

- Repo: `github.com/no-trbl-2-u/axiomancer-mobile`
- Mobile-side blocker tracker: `plan/AUDIT.md` row
  `[needs-engine-release] axiomancer-mechanics@0.6.1+ ...`
  (the version pin in that row predates the 0.7.0 bump; the
  asks above are valid against 0.7.0).
- Mobile is on the autonomous-loop methodology; the moment a
  bumped engine version lands and `pnpm install` resolves it,
  the loop's next `/iterate` tick will re-check the surfaces
  named above and start draining the dependent phases.
