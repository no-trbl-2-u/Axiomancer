# Phase 124 — Mechanics 0.21.0 mobile catch-up

## Outcome

Mobile consumes `axiomancer-mechanics@0.21.0` from npm and accounts for the new engine-owned encounter procedures: Quest Board micro-games, Rest / Night Watch, Loot-cache / Reliquary, and the new `quest` MapEvent contract.

## Source / user decision

T ordered the latest mechanics package published, then asked to create a Mobile phase to bump the version and account for the mechanics changes. `axiomancer-mechanics@0.21.0` is published and tagged as the encounter-procedure release.

## Upstream release

- Package: `axiomancer-mechanics@0.21.0`
- Prior mobile dependency: `^0.20.0`
- Mechanics release tag: `v0.21.0`
- Mechanics release commit: `c3ff3b2`
- Mobile upgrade doc: `docs/engine-upgrade-0.20.0-to-0.21.0.md`

## Implementation units

1. **Package bump**
   - Update `package.json` dependency `axiomancer-mechanics` from `^0.20.0` to `^0.21.0` or exact `0.21.0` if this phase chooses tighter pre-1.0 discipline.
   - Regenerate `package-lock.json` with `npm install axiomancer-mechanics@0.21.0`.
   - Use npm registry truth only. Do not use git or tarball installs.

2. **Type/import drift drain**
   - Run `npm run typecheck` immediately after the bump.
   - Fix compile drift caused by the new `quest` MapEvent kind and `ResolvedEvent` rest payload shape.
   - Update mocks/fixtures that used literal rest payloads so `healFraction` is present.
   - Ensure any exhaustive event-kind switch handles `kind: 'quest'` deliberately.

3. **Quest Board host and presenter catch-up**
   - Treat `World/QuestBoard` as engine-owned. Mobile launches, presents, and routes choices; mechanics decides movement, legal actions, rewards, and completion tier.
   - Support the new micro-game verbs as distinct UI/presenter states: GATHER, DUEL, SNAG, MARKET, PARLEY, HEARTH, CACHE, OMEN.
   - Show enough local UI state for player decisions — haul/bank/bust, grit, brace resources, market price, parley gates, and hearth linger — without calculating outcomes locally.
   - Add/update focused tests around quest launch, Quest Board flow, legal/disabled actions, and completion handoff.

4. **Rest / Night Watch catch-up**
   - Replace passive-rest assumptions with an encounter presentation path where the engine emits Rest state.
   - Present watch/posture, fire warmth / wood pressure, dream choices, stirs, still hours, and dawn outcome from mechanics state.
   - Display `healFraction`, `cleansed`, and keepsake consequences as engine-provided facts; do not compute rest recovery locally.

5. **Loot-cache / Reliquary catch-up**
   - Present the lid / false-bottom / keeper's-tithe layer loop and probe/claim choices from engine state.
   - Preserve sealed trap fate doctrine: reveal only what the engine says is known.
   - Keep loot item refs as refs until the host maps them at claim time.
   - Update cache flow tests if current code assumes passive cache grant behavior.

6. **SELF/dev-menu smoke evidence**
   - Open the app, go to `SELF`, open the dev menu, trigger Quest Board, Rest, and Loot-cache encounters if available.
   - Capture pass/fail notes and exact console/runtime failures.
   - If a dev-menu trigger is missing, file the absence as a follow-up or implement it if trivial and within the phase scope.

## Decisions made upfront — DO NOT ASK

- This is a registry package catch-up, not a redesign.
- Engine truth wins. Mobile must not simulate Quest Board, Rest, or Loot-cache rules.
- If 0.21.0 exposes richer encounter state than current UI can beautifully display, make the first pass truthful and usable; file polish rows after the bump is green.
- Do not approve visual baselines merely to hide diffs. Clean export + zero console errors + screenshot diffs is screenshot-judgment evidence for T, not automatic product failure.
- Do not drag unrelated cleanup candidates into this phase.

## Verify gate

Minimum:

```bash
npm install axiomancer-mechanics@0.21.0
npm run typecheck
npm test -- --runInBand state/e2e/quest.flow.engine.test.ts state/e2e/quest.screen.test.tsx state/e2e/rest.flow.engine.test.ts state/e2e/cache.flow.engine.test.ts state/e2e/encounter-flow.engine.test.tsx
npm run verify
npm run verify:visual
```

If `verify:visual` exits because screenshots/baselines differ but the export and console are clean, report the exact screenshot diff/baseline state and do not call it a runtime failure.

## Commit body template

```text
phase 124: mechanics 0.21.0 mobile catch-up

- bump axiomancer-mechanics to 0.21.0
- handle quest MapEvent and rest healFraction payload drift
- present engine-owned Quest Board micro-game verbs
- present Rest / Night Watch and Loot-cache / Reliquary encounter procedures
- refresh focused encounter tests, visual smoke, and dev-menu playthrough evidence

Verification:
- npm run typecheck
- focused encounter Jest
- npm run verify
- npm run verify:visual
- SELF/dev-menu encounter smoke notes
```

## Definition of Done

- `package.json` and `package-lock.json` consume `axiomancer-mechanics@0.21.0`.
- Typecheck is green against the published package.
- Mobile handles `kind: 'quest'` and `healFraction` without exhaustive-switch or fixture failures.
- Quest Board, Rest, and Loot-cache presenters/actions are truthful to engine state and do not simulate rules locally.
- Focused encounter tests cover the code drift found during the bump.
- `npm run verify` is green.
- `npm run verify:visual` is green or blocked/reported with exact visual-smoke evidence.
- SELF/dev-menu trigger smoke notes exist for Quest Board, Rest, and Loot-cache or exact missing-trigger follow-ups are filed.
- Build-plan row is ticked in the same commit that ships the implementation phase.

## Follow-ups out of scope

- Art pass / custom illustrations for the new encounters.
- Balance changes to Quest Board, Rest, or Loot-cache.
- New encounter types beyond the 0.21.0 engine contract.
- Broad component cleanup unrelated to this package catch-up.
