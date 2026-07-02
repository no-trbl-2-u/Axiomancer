# Phase 140 — Hazard Minigame vs Divergence Documentation Audit

## Outcome

Read-only verification that the current hazard implementation (post-Phase-134 mobile v2 alignment + Phase-135 persistence) fully satisfies every item in `docs/hazard-v2-vs-mechanics-divergence.md` with gap identification and parity testing.

## Source spec

Filed via oversight 2026-06-11 (T write-in: "double check the current hazard minigame against the deviations documentation"). This is a verification-only audit phase to ensure the current hazard implementation matches documented mobile behavior before further development.

## Implementation units

### Unit 1: Divergence checklist verification
- File: `src/World/Hazard/audit/divergence.verification.ts` 
- Types: `DivergenceVerification`, `ImplementationGap`, `VerificationResult` interfaces
- Logic: Systematic walk-through of each item in `docs/hazard-v2-vs-mechanics-divergence.md` checking implementation status
- Pattern: Read-only analysis module with structured verification results

### Unit 2: Parity test coverage audit
- File: `src/World/Hazard/audit/e2e/parity.audit.test.ts`
- Types: Test scenarios covering mobile behavior requirements from divergence doc 
- Logic: Hermetic e2e tests verifying mechanics implementation matches documented mobile rules
- Pattern: Follow existing e2e test structure with explicit parity assertions

### Unit 3: Gap identification and reporting
- File: `src/World/Hazard/audit/gap.report.ts`
- Types: `ImplementationGap` categorization and reporting structure
- Logic: Identify any partial implementations or missing functionality versus mobile spec
- Pattern: Analysis-only reporting module (no code changes unless gaps confirmed)

## Decisions made upfront — DO NOT ASK

1. **Scope**: Read-only audit with no code changes unless a confirmed gap is discovered.
2. **Verification method**: Compare current mechanics implementation against every divergence item listed in the documentation.
3. **Gap handling**: Surface any gaps to T before implementing fixes - this is verification first, patches second.
4. **Test approach**: Focus on parity e2e tests that verify mobile-equivalent behavior.
5. **Documentation**: Results documented in verification module, not separate files.
6. **Coverage requirement**: Every divergence item must have explicit verification status.

## Verify gate

- `npm run verify` (type-check + tests + build)
- Divergence verification shows complete implementation status for all documented items
- Parity tests cover mobile behavior requirements
- Any identified gaps are clearly documented with T escalation path

## Commit body template

```
audit(Hazard): phase 140 — hazard minigame divergence documentation verification

- Verify current hazard implementation against divergence documentation
- Add parity test coverage for mobile behavior requirements
- Identify any implementation gaps versus documented mobile rules
- Read-only audit with gap reporting before patches

Decisions:
- Verification-first approach with T escalation for any confirmed gaps
- Focus on documented divergence items as verification checklist
- Parity e2e tests validate mobile-equivalent behavior patterns
```

## Definition of Done

- [ ] Every divergence item in `docs/hazard-v2-vs-mechanics-divergence.md` has explicit verification status
- [ ] Parity e2e tests cover mobile behavior requirements from divergence documentation  
- [ ] Any implementation gaps are identified and documented with T escalation path
- [ ] Current hazard implementation status is fully verified against mobile specification
- [ ] No code changes made unless gaps confirmed (read-only audit priority)
- [ ] `npm run verify` passes with new verification infrastructure
- [ ] Verification results show complete implementation parity or document specific gaps

## Follow-ups (out of scope)

- Implementation of any identified gaps (separate phase after T review)
- Mobile-mechanics integration testing beyond current parity verification
- Full mobile hazard engine replacement (depends on gap analysis results)
- Documentation updates based on verification findings