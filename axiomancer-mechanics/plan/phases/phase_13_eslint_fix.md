# Phase 13 — ESLint fix

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`npm run lint` exits 0 against the current source tree, with the
`@typescript-eslint` plugin correctly registered and a sensible default
rule set. `lint` is reinstated as part of `npm run verify` (after
type-check, before tests). `plan/bearings.md` is updated to remove the
"lint currently broken" caveats and bring the verify gate description in
line with reality.

## Source spec

No dedicated `specs/13-*.md` file — this is a tooling-debt phase tracked
since project start (see `plan/AUDIT.md` MED-3.5 finding "ESLint config
broken" and `plan/bearings.md` Hard Rule 6).

Resolved questions:

1. **Plugin registration shape**: register `@typescript-eslint` as a flat-
   config plugin object — `plugins: { '@typescript-eslint': tseslint.plugin }`
   — rather than extending `tseslint.configs.recommended`. Keeps the existing
   rule selection intact (just `no-explicit-any: warn` +
   `explicit-function-return-type: off`); avoids importing a bag of
   recommended rules that would generate hundreds of new findings on a
   ~6 kLOC codebase and turn this phase into a multi-day cleanup.
2. **Rule severity**: keep `no-explicit-any` at `warn`, not `error`. We
   already have isolated `any` casts that are intentional (e.g.
   `events.utils.ts` redundant casts flagged by critique-2). They'll be
   addressed under that critique finding, not gated by this phase.
3. **Warnings vs errors policy for verify**: `npm run lint` exits 0 on
   warnings. Bearings will document that warnings are advisory; only errors
   fail verify. No `--max-warnings 0` flag for now.
4. **Where lint sits in verify**: `verify = type-check && lint && test && build`.
   Lint is cheap and catches things type-check doesn't; run it before tests
   so we fail fast on style issues.
5. **Scope of fixes from new findings**: if registering the plugin surfaces
   real `no-explicit-any` warnings in `src/`, leave them as warnings. Do not
   auto-fix them as part of this phase. Filing a follow-up finding is fine.
   Hard error-level findings (e.g. unused variables) **do** get fixed in
   this phase if they block exit 0.

## Implementation units (commit per unit)

### Unit 1 — Register the `@typescript-eslint` plugin in flat config

File: `eslint.config.mts`

Diff (conceptual):

```ts
// Before
{
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: { project: "./tsconfig.json", ... }
    },
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",        // ← plugin not registered
        "@typescript-eslint/explicit-function-return-type": "off",
    }
},
// After
{
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    plugins: {
        "@typescript-eslint": tseslint.plugin,                // ← registered here
    },
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: { project: "./tsconfig.json", ... }
    },
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
    }
},
```

Commit: `fix(eslint): register @typescript-eslint plugin in flat config`

### Unit 2 — Patch any blocking errors surfaced by the now-active plugin

Run `npm run lint`. Triage output:

- **Errors**: must fix in this phase. Likely candidates: parser-driven
  rules complaining about syntax in edge files, or `no-unused-expressions`
  from js/recommended hitting unusual patterns. Fix narrowly; do not
  broaden scope.
- **Warnings**: leave alone. Document any meaningful clusters under
  Follow-ups.

Commit (if any code touched): `fix(<scope>): silence ESLint errors after plugin registration`

### Unit 3 — Reinstate lint in the verify gate

File: `package.json`

```diff
- "verify": "npm run type-check && npm test && npm run build",
+ "verify": "npm run type-check && npm run lint && npm test && npm run build",
```

Note: `check` already chains `lint && type-check` — leave it as-is.

Commit: `chore(scripts): add lint to verify gate now that ESLint is green`

### Unit 4 — Refresh bearings to reflect the fixed state

File: `plan/bearings.md`

Edits:
- Row in the verify-gate table: change "ESLint (currently broken — see
  Hard Rules)" to "ESLint flat config + `@typescript-eslint` plugin".
- "ESLint state:" callout: rewrite to reflect green state; preserve
  history note ("was broken until Phase 13 — see commit <sha>").
- Hard Rule 6: drop the "until that fix ships, the gate is type-check +
  test + build" caveat, since lint is now in the gate.

Commit: `docs(bearings): mark ESLint as fixed; lint is back in verify gate`

## Decisions made upfront — DO NOT ASK

- Do **not** adopt `tseslint.configs.recommended`. Reason in §Source spec Q1.
- Do **not** flip `no-explicit-any` to error. Reason in §Source spec Q2.
- Do **not** add `--max-warnings 0`. Reason in §Source spec Q3.
- Do **not** auto-fix warnings surfaced by the newly-active plugin in this
  phase. File follow-ups instead.
- Use the `tseslint.plugin` import path off the `typescript-eslint` package
  (already in devDependencies, v8.x). Do not add a separate
  `@typescript-eslint/eslint-plugin` import — the `typescript-eslint`
  meta-package re-exports it.

## Verify gate

```bash
npm run lint            # must exit 0 (warnings OK)
npm run verify          # type-check + lint + test + build all green
```

## Commit body template (summary commit if units coalesce)

```
fix(eslint): phase 13 — repair flat config + reinstate lint gate

- Register @typescript-eslint plugin so existing rules resolve
- Reinstate `npm run lint` inside `npm run verify`
- Refresh bearings to drop the broken-ESLint caveats

Decisions:
- Keep narrow rule set (no `recommended` extend) to avoid a multi-day
  cleanup against ~6 kLOC of existing code. Warnings stay advisory.

Closes #<phase-issue if captured>
```

## Definition of Done

- [ ] `eslint.config.mts` registers `@typescript-eslint` plugin via `plugins`
- [ ] `npm run lint` exits 0 (warnings allowed; no errors)
- [ ] `npm run verify` includes lint and exits 0 end-to-end
- [ ] `plan/bearings.md` no longer claims ESLint is broken
- [ ] `plan/steps/01_build_plan.md` Phase 13 row flipped to `[x]` with hash
- [ ] `npm run deploy:check` exits 0

## Follow-ups (out of scope)

- Any `no-explicit-any` warnings surfaced after the plugin registers —
  file in `plan/AUDIT.md` as a single Z-LOW finding with an inventory of
  call sites. Do not fix in this phase.
- Adopting `tseslint.configs.recommended` is a strictly larger project
  (likely Phase 21+) — leave for `/expand` to propose when the surface
  is calmer.
