# Phase 1 — Combat test-coverage backfill (calibration)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.
> This is the **calibration phase** — deliberately small. Its job
> is to prove the loop works in this repo (mechanics verify gate
> + CI-green deploy gate + commit/push cadence) before any
> ambitious phase. Do not expand scope.

## Scope

Add hermetic e2e coverage at the mechanics public entry point for
combat kill-paths that currently have no funded-path (success)
witness — starting with `sig-overwhelming-argument`, plus any HP
kill-path flagged as lacking population-level coverage. **No
engine behavior change**: tests only. If a test surfaces a real
engine bug, file it to `plan/AUDIT.md` and keep this phase
test-only.

## Canonical sibling

The existing combat e2e suites:
`axiomancer-mechanics/src/Combat/e2e/*.engine.test.ts`. Mirror
their structure — highest public entry point
(`simulateHazardPatternCombat` / `initializeCombatEncounter`),
RNG stubbed via `src/test-utils/rng.ts`
(`mockAlternatingRng` / `mockFixedRng` / `mockSequentialRng`),
never `vi.spyOn(Math,'random')`.

## Outputs

```
axiomancer-mechanics/src/Combat/e2e/sig-overwhelming-argument.engine.test.ts   (or extend an existing suite)
# + any additional kill-path witness identified while writing the above
```

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
```

type-check + type-check:tests + lint + vitest + build. Must be
green **twice** (determinism check) before commit. No mobile /
card-editor gate needed — this touches no public export surface.

## Deploy gate

```bash
npm run deploy:check
```

CI-green (GitHub Actions). This push touches `axiomancer-mechanics/**`,
so `verify-mechanics.yml` (and, via path filters, `verify-mobile.yml`
+ `verify-card-editor.yml`) will run. Wait for them to conclude
success. If a workflow fails, read the run log, patch, push again
(<=3 same-root-cause iterations, then stop per `skills/ship-a-phase.md`
failure modes).

## Tests

### E2E
- `sig-overwhelming-argument` funded/success path resolves to the
  expected combat outcome under a fixed seed.
- One additional HP kill-path witness (Conclusion/BODY-sig,
  Execute finish, or the escalation clock) if quick to add;
  otherwise leave the rest to build-plan Phase 4.

### Unit
- Only if a helper is extracted; otherwise none.

## Decisions made upfront — DO NOT ASK

- **Test-only.** No engine, content, or export change this phase.
- **Which combat engine:** Hazard-Pattern Combat (canonical).
  Never `resolveCombatRound`.
- **Seed choice:** reuse the seed convention from the sibling
  suites; pick a fixed seed that exercises the funded path.
- **Scope discipline:** if `sig-overwhelming-argument` already
  has funded coverage, pick the next zero-coverage kill-path and
  note the substitution in the commit body. Do not add more than
  two witnesses this phase.

## Git

```bash
git add axiomancer-mechanics/src/Combat/e2e/<files>
git commit -m "$(cat <<'EOF'
test(mechanics): backfill funded-path combat kill-path coverage — phase 1

- add e2e witness for sig-overwhelming-argument funded/success path
- <second kill-path witness, if added>

Decisions:
- test-only; no engine change
- Hazard-Pattern Combat entry point; fixed-seed RNG stub
EOF
)"
git push origin main
```

## DoD

Flip Phase 1 `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append the commit hash, add a "Phase log" line. Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 1 shipped — combat test-coverage backfill"
git push origin main
```

## Confirm deploy

```bash
npm run deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- The remaining population-level witnesses -> build-plan Phase 4.
- Any engine bug a test surfaces -> `plan/AUDIT.md`.
