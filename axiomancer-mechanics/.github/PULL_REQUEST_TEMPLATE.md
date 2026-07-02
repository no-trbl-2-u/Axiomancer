# Pull Request

## Summary
<!-- State the verdict first. What changed, and why does it matter? -->
- 
- 
- 

## Repository Role
Axiomancer Mechanics is the TypeScript game engine and CLI. This repo owns rules, state transitions, deterministic RNG, content libraries, balance/tuning, public package exports, and hermetic engine tests. Mobile and other clients consume this repo; they must not reinvent these rules.

## Change Type
<!-- Check all that apply. -->
- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Documentation / design
- [ ] Test / verification
- [ ] Balance / tuning
- [ ] Build / CI / tooling
- [ ] Package export / release surface
- [ ] Sensitive or sign-off required

## Context / Source Material
<!-- Link issues, specs, plans, docs, prior PRs, CLI logs, or user direction. -->
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
// Hermetic engine test shape — deterministic, no TTY/network/disk.
it('resolves the feature through the public resolver', () => {
  const rng = mockSequentialRng([0.1, 0.9]);
  const result = resolveFeatureTurn(initialState, { kind: 'commit' }, rng);

  expect(result.events).toContainEqual(
    expect.objectContaining({ type: 'feature:resolved' })
  );
});
```

## Verification
<!-- Paste real command output summaries. Do not invent green gates. -->
Required / recommended for this repo:
- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify`
- [ ] `npm run deploy:check` when public exports or package contents change

Completed in this PR:
- [ ] Not run — reason: 
- [ ] Local verification commands:
  ```bash
  # command(s)
  ```
- [ ] CLI / tuning / manual evidence:

## Hermetic Test Coverage
Every implementation should drive the highest-level public entry point via hermetic e2e tests in `src/<Module>/e2e/*.engine.test.ts`. Hermetic means no disk/network/TTY, deterministic injected RNG, and isolated mocks.

- [ ] Added or updated hermetic e2e tests
- [ ] Existing hermetic tests cover this path
- [ ] Test debt accepted — explain why:

## Balance / Tuning Evidence
<!-- Required for tuning/content changes. -->
- Baseline command(s):
  ```bash
  # command(s)
  ```
- After-change command(s):
  ```bash
  # command(s)
  ```
- Observed deltas:

## Risk / Rollback
<!-- Name what could break and how to retreat. -->
- Risk level: Low / Medium / High
- Main risk:
- Rollback plan:

## Callouts for Reviewer
<!-- Put sharp edges here. The reviewer should not discover them by accident. -->
- All randomness must use injected RNG helpers, not `Math.random()`.
- Status-effect-centric combat doctrine is load-bearing; do not optimize it away.
- Do not tune numbers to mask known engine gaps; call out the gap.
- Public export/package changes require `npm run build` and `npm run deploy:check` evidence.

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
