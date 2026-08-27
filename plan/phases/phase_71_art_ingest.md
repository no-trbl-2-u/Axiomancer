# Phase 71 — Art acquisition pipeline (V4 accelerant, no generation)

> Queued 2026-08-22 per THE PIPELINE LIBERATION. Brief generated
> 2026-08-27 by `/ship-a-phase` §9.

## Outcome

The one-off Doré acquisition becomes a loop-runnable path: `sharp` as a
dev-only dependency, an ingest script encoding the recorded recipe, and
a provenance-completeness + registry-vs-directory drift test that fails
on the gaps rather than leaving them tacit.

## What the survey found (the row's premise is stale)

The build-plan row says "ingest of the two `tmp-images/` stragglers".
Reality, measured 2026-08-27:

- `tmp-images/` holds **36** PNGs (17 doors, 19 walls), not two.
- **35 of them are already in `assets/images/labyrinth/`** and shipping.
  The walls arrived as WebP (processed); the **doors are still PNG at
  their original ~100KB** — copied in, never run through the recipe.
- `assets/images/labyrinth/` has **no `provenance.json` at all**: 35
  shipped assets against a convention that says "No provenance entry,
  no asset."
- `assets/images/combat/` has a per-file provenance but **no
  `index.ts`** registry.
- The recorded Doré recipe was executed with **Pillow**, not sharp, and
  neither Pillow nor sharp was installed in this repo.

So the acquisition leg is mostly done and undocumented, not undone. The
real work is the machinery plus the debt the machinery exposes.

## Surface

| File | Change |
|---|---|
| `axiomancer-mobile/package.json` | `sharp` devDependency (dev-only; not bundled) |
| `axiomancer-mobile/scripts/ingest-art.mjs` | new — the recipe as a runnable script |
| `axiomancer-mobile/scripts/__tests__/asset-provenance.test.mjs` | new — completeness + drift |
| `assets/images/labyrinth/provenance.json` | new — the 35 shipped assets, truthfully |
| `assets/images/labyrinth/doors/*.webp` | the 17 doors, through the recipe |
| `assets/images/labyrinth/index.ts` | door `require()` paths follow |
| `axiomancer-mobile/docs/asset-conventions.md` | the "Known gaps" list loses what this closes |

## Decisions made upfront — DO NOT ASK

- **`sharp`, dev-only, in the mobile workspace.** The case: the recipe
  needs a real image encoder; Pillow would add a Python toolchain to an
  npm monorepo whose CI is Node-only; sharp ships prebuilt linux-x64
  binaries, is the standard Node choice, and — as a devDependency —
  never enters the app bundle. Verified working here (libvips 8.18.6).
- **The doors get converted; the walls do not.** The walls are already
  WebP at recipe size. Converting the 17 PNGs is the measurable win the
  script exists to deliver, and it doubles as the script's own proof.
- **Provenance for the stragglers is written truthfully, which means
  writing that we do not know.** They were committed by the owner on
  2026-07-07 ("Add doors and maze walls") with no source or license
  recorded. The conventions doc's own rule for unrecorded art is: do
  not wire it in until the license can be written truthfully. These are
  ALREADY wired in and shipping, so the honest act is to record what is
  known — owner-supplied, date, no source on record — and mark the
  license `UNRESOLVED`, not to invent one.
- **`UNRESOLVED` is a reported state, not a passing one.** The test
  fails hard on a MISSING provenance record and reports every
  `UNRESOLVED` license as a counted, named finding on each run. A
  missing record is a process failure the loop can fix; an unresolved
  license is a question only the owner can answer, so it stays visible
  instead of either blocking every future asset or disappearing.
- **`combat/`'s missing `index.ts` is noted, not built.** One arena
  consumed directly is a coverage problem, not a convention breach, and
  inventing a registry for a single file is speculative. The drift test
  records the directory as registry-less so adding a second arena has
  to confront it.
- **Generation stays out.** Option A is Phase 73; this phase is the
  acquisition and post-process legs it will reuse.

## Tests

| Case | Assert |
|---|---|
| every asset directory | has a provenance record covering its files |
| every provenance record | carries date, tool, license (or `UNRESOLVED`), and covers |
| registry vs directory | every `require()` resolves to a file that exists |
| directory vs registry | every image file is reachable from a registry |
| unresolved licenses | reported and counted, never silently passed |
| the sweep itself | fails if it finds no directories to check |

## Verify gate

`npm run verify`, plus the new asset test and `npm run lint:content`.

## DoD

- [ ] `sharp` added with its case recorded.
- [ ] Ingest script runs the recipe end to end.
- [ ] 17 door PNGs converted; registry follows; app still builds.
- [ ] Provenance completeness + drift test green, unresolved reported.
- [ ] `asset-conventions.md` "Known gaps" updated.

## Follow-ups (out of scope)

- The owner's answer on the doors/walls licensing, and on
  `Potential Assets/MCP-Axiomancer/images/` — both blocked on the same
  question.
- A bundle-size budget (spec 11 Q5, still blank).
- Deleting `tmp-images/` once its contents are confirmed redundant.
