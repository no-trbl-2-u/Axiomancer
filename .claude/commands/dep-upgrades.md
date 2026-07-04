---
description: Weekly dependency hygiene pass — patch/minor bumps only, full root verify, delivered as one PR. Never touches the locked stack (React pin, Expo SDK, node engines).
---

You are invoked under the `dep-upgrades` skill — the weekly dependency
hygiene pass for the monorepo. Deliver on ONE new branch + PR
(`chore/dep-upgrades-<YYYY-MM-DD>`). Nothing auto-lands on `main`.

Hard guardrails (the locked stack in `plan/bearings.md` wins over
freshness):

- **Never** bump React / react-dom / react-test-renderer — pinned at the
  root via `overrides`; changing the pin is a user decision.
- **Never** bump the Expo SDK major (`expo`, `expo-router`,
  `react-native`, or anything whose version is dictated by the SDK).
  For Expo-managed packages prefer `npx expo install --check` /
  `--fix` inside `axiomancer-mobile` over raw npm bumps, and take only
  what it recommends for the current SDK.
- **Patch and minor bumps only.** List available majors in the PR body
  as a table ("held back — needs a decision") — do not apply them.
- npm only, workspace-aware (`npm install` from the root). One
  `package-lock.json` at the root; never introduce another lockfile.

Procedure:

1. `git pull --ff-only`, then branch `chore/dep-upgrades-<date>`.
2. Survey: `npm outdated` from the root (covers all workspaces). Also
   run `npm audit` and note any advisories the bumps resolve.
3. Apply eligible patch/minor bumps workspace-by-workspace. Keep the
   diff to `package.json` files + the root lockfile.
4. **Verify gate, full:** `npm run verify` at the root (mechanics +
   mobile + card-editor). If a bump breaks verify, drop that bump —
   do not patch code to accommodate a routine bump; note it in the PR
   body as held back with the failure one-liner.
5. If nothing is eligible (no outdated deps, or every candidate is
   held back), exit cleanly with no branch and no PR.
6. PR: title `chore(deps): weekly patch/minor bumps <date>`; body lists
   applied bumps (old → new), held-back majors, audit findings, and the
   verify evidence. No Co-Authored-By trailers, no emojis.

Argument: $ARGUMENTS
