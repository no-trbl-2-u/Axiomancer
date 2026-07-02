# Phase 143 — Dependency modernization (major bumps)

> **Goal:** Drain three live AUDIT major-version findings in one deliberate phase.
>
> **Scope:** TypeScript 5→6, inquirer 9→12, globals 16→17. Tooling/deps only — no product behavior change.

## Implementation Plan

### Commit Units

1. **Bump TypeScript 5→6** — update package.json, resolve any strictness/lib breaking changes
2. **Bump inquirer 9→12** — update package.json, resolve any prompt-API changes  
3. **Bump globals 16→17** — update package.json, resolve any key renames
4. **Fix any cross-dependency conflicts** — resolve interactions between bumped packages

### Pre-decisions

- **Policy:** Per iterate policy, major bumps require deliberate phases rather than automated updates
- **Scope constraint:** Tooling/dependencies only — no product behavior change
- **Breaking change strategy:** Resolve each package's breaking changes individually before moving to next

### AUDIT Context

Source: AUDIT.md Pending (pass 52 — Category G):
- TypeScript 5→6 (score 3.6: impact 4, ease 9)
- inquirer 9→12 (score 2.8: impact 4, ease 7)  
- globals 16→17 (score 2.7: impact 3, ease 9)

All represent non-blocking improvements to dev experience.

## Definition of Done

- [ ] TypeScript bumped to latest 6.x with all breaking changes resolved
- [ ] inquirer bumped to latest 12.x with all API changes resolved
- [ ] globals bumped to latest 17.x with all key renames resolved
- [ ] `npm run type-check` passes (zero warnings)
- [ ] `npm test` passes (all tests green)
- [ ] `npm run lint` passes (zero warnings) 
- [ ] `npm run verify` passes
- [ ] `npm run deploy:check` passes

## Verification

Standard gate: `npm run type-check` + `npm test` + `npm run lint` (zero warnings) + `npm run verify` + `npm run deploy:check`.