# Phase 112 — Mechanics 0.15.0 mobile catch-up

## Outcome

Mobile consumes `axiomancer-mechanics@0.15.0` from npm and proves the new engine contract does not break the player-facing combat, exploration, and story surfaces.

## Source / user decision

T ordered the mechanics version bump, release publication, tag update, and a promoted mobile phase to pick it up. `axiomancer-mechanics@0.15.0` is published and tagged as the post-0.14 balance/content release.

## Upstream release

- Package: `axiomancer-mechanics@0.15.0`
- Prior mobile pin: `0.14.0`
- Mechanics release: `v0.15.0`
- Mobile upgrade doc: `docs/engine-upgrade-0.14.0-to-0.15.0.md`

## Implementation units

1. **Package bump**
   - Update `package.json` dependency `axiomancer-mechanics` from `0.14.0` to `0.15.0`.
   - Regenerate `package-lock.json` with `npm install` or `npm install axiomancer-mechanics@0.15.0`.
   - Do not use git/tag tarballs; use npm registry truth.

2. **Type/import drift drain**
   - Run `npm run typecheck` immediately after the bump.
   - Fix any compile/import drift against the published package.
   - Pay attention to new/changed northern-forest, enemy, NPC/story, playtest, and Stance/Vitae surfaces.

3. **Stance and Vitae contract verification**
   - Confirm mobile still treats Stance and Vitae as engine-owned.
   - Do not restore local stance/resource math, affordability, action-resolution, or report simulation.
   - Preserve the engine-truth posture: mobile presents mechanics state; it does not adjudicate rules.

4. **Exploration/story presentation pass**
   - Confirm expanded `northern-forest` map/content does not break exploration presenters, route assumptions, node labels, encounter preludes, or story/memoir copy fallbacks.
   - Add or adjust focused hermetic tests where the new package exposes compile or presenter drift.

5. **Evidence refresh**
   - Run focused Jest around changed presenters/actions.
   - Run `npm run verify`.
   - Run `npm run verify:visual`, or record the exact blocker if the visual-smoke gate is blocked by known baseline debt rather than runtime failure.

## Decisions made upfront — DO NOT ASK

- This is a registry package catch-up, not a redesign.
- Engine truth wins over mobile scaffolding.
- If 0.15.0 exposes richer content than mobile currently displays, keep the first pass minimal: preserve safe fallbacks and file follow-up critique rows for polish.
- Do not implement the pending combat UX overhaul or aftermath-modal design specs inside this phase.
- Do not touch unrelated `PHASE_CANDIDATES.md` Pending candidates except to record this promoted release-catchup row.

## Verify gate

Minimum:

```bash
npm run typecheck
npm test -- --runInBand
npm run verify
npm run verify:visual
```

If `verify:visual` exits because screenshots/baselines are missing but the export and console are clean, report baseline debt precisely and do not mislabel it as a product failure.

## Commit body template

```text
phase 112: mechanics 0.15.0 mobile catch-up

- bump axiomancer-mechanics to 0.15.0
- drain type/import drift from the published package
- verify Stance and Vitae remain engine-owned
- refresh exploration/story presentation evidence for expanded northern-forest/content
- update upgrade notes and phase status

Verification:
- npm run typecheck
- npm test -- --runInBand
- npm run verify
- npm run verify:visual
```

## Definition of Done

- `package.json` and `package-lock.json` pin `axiomancer-mechanics@0.15.0`.
- Typecheck is green against the published package.
- Focused tests cover any code drift found during the bump.
- `npm run verify` is green.
- Visual smoke/playtest evidence is refreshed or blocked with exact, honest cause.
- `docs/engine-upgrade-0.14.0-to-0.15.0.md` is updated if implementation discovers additional migration details.
- Build-plan row is ticked in the same commit that ships the phase.

## Follow-ups out of scope

- Combat UX overhaul design implementation.
- Aftermath modals design implementation.
- Broad production component test expansion.
- New engine mechanics beyond the published package contract.
