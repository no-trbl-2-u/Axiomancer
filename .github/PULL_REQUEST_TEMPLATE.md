# Pull Request

## Summary
<!-- State the verdict first. What changed, and why does it matter? -->
-
-

## Affected package(s)
<!-- Check all that apply. Drives which verify gate + callouts are relevant. -->
- [ ] `axiomancer-mechanics` — the TypeScript game engine + CLI (rules, state transitions, deterministic RNG, content libraries, balance/tuning, hermetic engine tests)
- [ ] `axiomancer-mobile` — the React Native / Expo app (screens, navigation, theming, presenters, visual verification). Consumes mechanics as local source via `@mechanics`.
- [ ] `axiomancer-card-editor` — local dev tool that reads/writes mechanics' `src/Cards/cards.library.ts`
- [ ] Root / tooling / CI

## Change Type
- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Documentation / design
- [ ] Test / verification
- [ ] Balance / tuning (mechanics)
- [ ] Build / CI / tooling
- [ ] Release / deploy (mobile) or package surface (mechanics)
- [ ] Sensitive or sign-off required

## Context / Source Material
- Related issue(s):
- Source doc(s):
- Prior art / references:

## What Changed
<!-- Be concrete. Name the important files and behavior. -->
-
-

## Verification
<!-- Paste real command output summaries. Do not invent green gates. -->
- [ ] `npm run verify --workspace axiomancer-mechanics` (type-check + tests + build)
- [ ] `npm run verify --workspace axiomancer-mobile` (lint + typecheck + jest)
- [ ] `npm run verify:visual --workspace axiomancer-mobile` when UI changes
- [ ] `npm run type-check --workspace axiomancer-card-editor` when the editor / its mechanics coupling changes

Completed in this PR:
```bash
# command(s) + summarized output
```

## Test Coverage
<!-- mechanics: hermetic e2e in src/<Module>/e2e/*.engine.test.ts (deterministic, injected RNG, no disk/network/TTY).
     mobile: hermetic tests under state/e2e/ or components/**/__tests__/. -->
- [ ] Added / updated tests
- [ ] Existing tests cover this path
- [ ] Test debt accepted — explain why:

## UI / Balance Evidence
<!-- mobile UI changes: before/after screenshots or verify:visual output.
     mechanics tuning/content: baseline vs after-change command output + observed deltas. -->
-

## Callouts for Reviewer
<!-- Put sharp edges here. -->
- **mechanics:** all randomness must use injected RNG helpers, not `Math.random()`; status-effect combat doctrine is load-bearing; don't tune numbers to mask engine gaps.
- **mobile:** don't duplicate mechanics rules in presenters; preserve canonical player terms (e.g. `VITAE`, `STANCE`); if a mechanics export is missing/stale, call it out rather than reimplementing.
- **cross-package:** mobile & card-editor consume mechanics via the `@mechanics` alias — a mechanics rename/removal can break them; verify the dependent package.

Additional callouts:
-

## Risk / Rollback
- Risk level: Low / Medium / High
- Main risk:
- Rollback plan:

## Secrets / Safety Check
- [ ] No secrets, credentials, private keys, tokens, or connection strings added
- [ ] No destructive migration or irreversible production action
- [ ] Sensitive/sign-off work is clearly marked above
