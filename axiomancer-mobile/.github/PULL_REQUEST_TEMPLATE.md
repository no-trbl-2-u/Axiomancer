# Pull Request

## Summary
<!-- State the verdict first. What changed, and why does it matter? -->
- 
- 
- 

## Repository Role
Axiomancer Mobile is the React Native / Expo presentation layer. Rules, state transitions, and randomness belong in `axiomancer-mechanics`; this repo owns screens, navigation, theming, presenters, mobile interaction design, and visual verification.

## Change Type
<!-- Check all that apply. -->
- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Documentation / design
- [ ] Test / verification
- [ ] Build / CI / tooling
- [ ] Release / deploy
- [ ] Sensitive or sign-off required

## Context / Source Material
<!-- Link issues, specs, plans, docs, prior PRs, screenshots, logs, or user direction. -->
- Related issue(s): 
- Source doc(s): 
- Prior art / references: 

## What Changed
<!-- Be concrete. Name the important files and behavior. -->
- 
- 
- 

## Relevant Code / Contract Examples
<!-- Include the important snippets reviewers need without making them hunt. -->

```ts
// Presenter boundary example — translate engine state, never own rules here.
export function selectFeatureViewModel(state: GameState): FeatureViewModel {
  return {
    phaseLabel: displayPhase(state.phase),
    actions: state.availableActions.map(toActionViewModel),
  };
}
```

## Verification
<!-- Paste real command output summaries. Do not invent green gates. -->
Required / recommended for this repo:
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run verify`
- [ ] `npm run verify:visual` when UI changes

Completed in this PR:
- [ ] Not run — reason: 
- [ ] Local verification commands:
  ```bash
  # command(s)
  ```
- [ ] Manual verification / screenshots / logs:

## Hermetic Test Coverage
Presenter/screen changes should include hermetic e2e or component tests under `state/e2e/` or `components/**/__tests__/`. Screens should be tested through presenter outputs or user-visible component behavior, not through live network, real timers, or real randomness.

- [ ] Added or updated hermetic tests
- [ ] Existing hermetic tests cover this path
- [ ] Test debt accepted — explain why:

## UI / Visual Evidence
<!-- Required for meaningful UI changes. -->
- Before screenshot / baseline:
- After screenshot / baseline:
- Visual smoke command/output:

## Risk / Rollback
<!-- Name what could break and how to retreat. -->
- Risk level: Low / Medium / High
- Main risk:
- Rollback plan:

## Callouts for Reviewer
<!-- Put sharp edges here. The reviewer should not discover them by accident. -->
- Do not duplicate mechanics rules in mobile presenters.
- Preserve canonical player terms such as `VITAE` and `STANCE`.
- UI copy should translate engine jargon into player-readable language while preserving canon terms.
- If mechanics package exports are missing or stale, call that out rather than reimplementing engine behavior in mobile.

Additional callouts:
- 

## Blockers
<!-- Anything preventing merge or full validation. -->
- [ ] None
- [ ] Blocked by:

## Open Questions
<!-- Decisions still wanted from T/reviewer. -->
- 

## Future Work
<!-- Deliberately excluded follow-ups. -->
- 

## Secrets / Safety Check
- [ ] No secrets, credentials, private keys, tokens, or connection strings added
- [ ] No destructive migration or irreversible production action
- [ ] Sensitive/sign-off work is clearly marked above
