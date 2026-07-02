# Phase 50 — Engine handoff for `axiomancer-mobile`

> Promoted via `/oversight` 2026-05-19 (`b0e4546`); ship-as-briefed
> re-confirmed via `/oversight` 2026-05-19 (`8317446`). Brief authored
> 2026-05-19 at commit `e4dbe5c`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 50 — Engine handoff".
- GH#64 (tracking issue from mobile autonomous loop; #61/#62/#63 closed as duplicates).
- `axiomancer-mobile/docs/engine-team-handoff-2026-05-16.md` (full rationale).
- `axiomancer-mobile/docs/engine-upgrade-0.7.0-to-0.10.0.md` (commit `30c03ca` on mobile main — mobile-side adoption notes that depend on this phase).

## Goal — one-line outcome

Top-level `skillLibrary` / `getSkillById` re-export through `src/index.ts`,
plus a fix for the missing `dist/<Module>/types.d.ts` emission across all
module sub-paths. Republish (0.10.1 or 0.11.0) is the user's call,
post-ship.

## Current state (pre-Phase-50)

- `src/Skills/index.ts:32` exports `skillLibrary` + `getSkillById` from
  `./skill.library`, but `src/index.ts` Skills block (lines 117–128)
  does not forward them. `import { skillLibrary } from 'axiomancer-mechanics'`
  is `undefined`.
- Of 11 module-level types files, only `src/Items/types.ts` emits to
  `dist/Items/types.d.ts`. The remaining 10 (`Character`, `Combat`,
  `Effects`, `Enemy`, `Game`, `NPCs`, `Philosophy`, `Skills`, `Utils`,
  `World`) are authored as `types.d.ts` — `tsc --declaration` does not
  process pre-existing `.d.ts` files, so they're silently absent from
  `dist/`.

## Decisions (made upfront)

### D1 — Rename `.d.ts` → `.ts`, do NOT switch to a copy-the-files-in build step

Cleanest fix: rename each `src/<Module>/types.d.ts` to `types.ts`. The
files contain only type declarations (zero runtime exports — confirmed
via grep across all 10), so renaming them to `.ts` lets `tsc` emit
proper `.d.ts` declarations plus near-empty `.js` modules (just the
compiled import statements). The alternative — patching the build to
`cp src/**/types.d.ts dist/**/types.d.ts` — works but couples the build
to a sibling step that lives outside `tsc`, and doesn't compose with
`declarationMap` for source-of-truth navigation. The rename is the
canonical TypeScript pattern.

### D2 — One module-name addition only: `skillLibrary` + `getSkillById`

Brief scope is explicit. Don't fold in `PersistenceAdapter` (the
mobile handoff's Issue 3 was explicitly deferred by oversight — see
the related candidate `plan/PHASE_CANDIDATES.md` "PersistenceAdapter
ergonomics — Phase 50 follow-up").

### D3 — Deploy-check assertion: count, not full surface compare

`scripts/deploy-check.mjs` gains a simple "count `dist/<Module>/types.d.ts`
files; fail if the count is below the source-side count" assertion.
A full per-module surface compare would catch deeper drift but doubles
the script's surface area. The count guard catches the actual
regression in scope (missing emission) cheaply.

### D4 — No version bump in this phase

The brief says "Version bump + npm publish lands as a separate
user-triggered step." This phase only lands the engine fix. The user
will pick `0.10.1` (semver patch since the re-export is additive +
the dist fix is opaque to consumers using the top-level barrel) and
publish.

## Commit units

### Unit 1 — `skillLibrary` / `getSkillById` top-level re-export + hermetic test

Files:
- `src/index.ts` — add `export { skillLibrary, getSkillById } from './Skills';`
  to the Skills block (after `learnSkill,` on line 128).
- `src/test-utils/e2e/public-barrel.engine.test.ts` — new hermetic
  test asserting both names are defined and have the expected runtime
  shape (`skillLibrary` is an object/Record; `getSkillById` is a
  function returning a `Skill | undefined`).

Verify: `npm run verify`.

Commit: `feat(skills): Phase 50 unit 1 — top-level skillLibrary + getSkillById re-export`.

### Unit 2 — `types.d.ts` emission fix + deploy-check count assertion

Files:
- Rename: 10 × `src/<Module>/types.d.ts` → `src/<Module>/types.ts`.
  (`git mv` each so history is preserved.)
- `scripts/deploy-check.mjs` — extend with a count-based assertion
  after the `dist/` exists check; fail if `dist/**/types.d.ts` count
  is below the expected source-side count.

Verify: `npm run verify` (full build emits all 11 `dist/<Module>/types.d.ts`),
then `npm run deploy:check` (the new assertion passes).

Commit: `fix(build): Phase 50 unit 2 — types.d.ts emission across all module sub-paths`.

## Verify gate

`npm run verify` (type-check + tests + build) + `npm run deploy:check` —
all green before pushing.

## DoD

- Phase 50 row in `plan/steps/01_build_plan.md` Status block flips
  `[ ]` → `[x]` with the ship commit hash.
- `dist/<Module>/types.d.ts` exists for all 11 module sub-paths.
- `import { skillLibrary, getSkillById } from 'axiomancer-mechanics'`
  returns non-`undefined` values via dist.
- Mobile-side stop-gaps (`state/mocks/combat.skills.fixture.ts` +
  the comments at `state/actions.ts:13-14`) become deletable on the
  next mobile bump — but the mobile-side delete is **out of scope**
  for this phase.

## Out of scope

- npm publish — user-triggered, post-Phase-50.
- `PersistenceAdapter` ergonomics — see the follow-up candidate.
- Mobile-side stop-gap removals — separate mobile-repo work.
