# Phase 106 — Mechanics 0.14.0 mobile catch-up

> Status: shipped in `0257b19` / closed out in `d6f48a7`. Mobile now pins `axiomancer-mechanics@0.14.0` and has accounted for the release-surface drift in the package bump, compile drain, presenter/action tests, and build-plan closeout.

## Source

At dispatch time, mechanics `axiomancer-mechanics@0.14.0` was published to npm while mobile was still pinned to `0.13.0` in `package.json` / `package-lock.json`, so the app had to consume the release deliberately rather than drift on stale engine contracts.

## Problem

Mobile now has a clean upstream package with engine truth for the doctrine work that was previously gated:

- `previewStatAllocation` / engine-owned derived stat preview truth;
- unlocked skills via `knownSkills` plus resource affordability, not `equippedSkills`;
- Befriend as a Heart skill with five-token cost and mercy/exploit choice state;
- region consequence and faction reputation payloads for aftermath surfaces;
- deterministic fixture/playtest exports for smoke and balance evidence;
- stricter combat log/action contracts.

The package bump is not enough. The mobile client must compile against the new public API, remove any stale imports, and prove the UI reads engine truth all the way through tests and smoke evidence.

## Scope

1. Bump `axiomancer-mechanics` from `0.13.0` to `0.14.0` in `package.json` and `package-lock.json` using the published npm package.
2. Run the compile/test drain immediately after install:
   - `npm run typecheck`
   - focused Jest suites around combat, level-up/stat preview, aftermath, and store actions
3. Fix any removed-symbol or contract drift from mechanics `0.14.0`, especially:
   - `getResistStat` → `getEffectiveStats(combatant).baseStats[stance]`
   - old terminal-combat helpers → current `endCombat()` / outcome flow
   - any `equippedSkills`-based visible-skill gating
4. Verify Phase 104/105 integrations still align with the actual published package, not a local mechanics checkout.
5. Wire or confirm UI handling for new consequence surfaces:
   - `regionConsequences`
   - `factionReputationShift`
   - friendship reward / codex / alignment aftermath fields
6. Refresh seeded evidence:
   - Befriend costs five Heart tokens and opens the mercy/exploit choice when eligible;
   - exploit and spare choices are both represented accurately;
   - a second encounter can begin after victory/defeat/friendship outcome;
   - post-combat aftermath can surface region/faction consequences where engine fixtures make them reachable.
7. Update `docs/mechanics-upgrade-0.14.0.md`, this phase brief, and the build plan with the exact verification commands and results.

## Verification

Minimum local gate before shipping:

- `npm install` or `npm ci` after the package bump, as appropriate for lockfile update
- `npm run typecheck`
- focused Jest suites for changed presenters/actions
- `npm test` twice if runtime behavior changes
- `npm run verify`
- `npm run verify:visual` or documented visual smoke alternative if the package bump affects visible combat/aftermath/level-up states

## Acceptance checklist

- [x] `package.json` and `package-lock.json` pin `axiomancer-mechanics@0.14.0` from npm.
- [x] No mobile code imports removed mechanics symbols.
- [x] Level-up/stat preview reads engine-derived truth.
- [x] Combat skill visibility/affordability reads known skills and engine resources, not stale equipped-skill assumptions.
- [x] Mercy-choice modal and aftermath surfaces compile and render against the published package contract.
- [x] Region/faction consequence payloads are either rendered or explicitly documented as not reachable from current mobile fixtures.
- [x] Hermetic tests cover the changed highest-level presenter/action entry points.
- [x] `npm run verify` passes.
- [x] Visual/smoke evidence is refreshed or a precise blocker is recorded.

## Closeout evidence

- Implementation: `0257b19` (`feat: mechanics 0.14.0 mobile catch-up — phase 106`).
- Plan closeout: `d6f48a7` (`plan: phase 106 shipped — mechanics 0.14.0 mobile catch-up`).
- Package truth: `package.json` dependency is `axiomancer-mechanics@0.14.0`.
- Changed entry points included `state/actions.ts`, combat HUD presenter/action tests, and package lockfiles.

## Out of scope

- New mechanics design beyond the published `0.14.0` contract.
- Art polish or new asset generation.
- Native EAS production build unless T separately orders a ship run.

## Blocker rule

If the published package differs from the expected release surface, stop and record the exact package version, missing export/type, and failing command. Do not patch mobile by copying engine logic locally.
