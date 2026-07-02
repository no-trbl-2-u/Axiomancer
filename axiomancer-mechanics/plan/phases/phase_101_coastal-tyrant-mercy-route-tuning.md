# Phase 101 — Coastal Tyrant mercy-route tuning + playtest policy/report depth

## Outcome

Fix Coastal Tyrant boss friendship route balance (currently 80% timeout / 4% friendship per user evidence) by implementing a "mercy" policy that damages to HP gate then switches to friendship, and extend playtest reporting with HP-gate traces.

## Why

Playtest evidence shows Coastal Tyrant friendship route is mechanically legible but not reliably reachable. User decision on 2026-06-01: 80% timeout / 4% friendship is a balance failure, not intentional long-boss texture. Current pure `friendship` policy never crosses HP gate (avg final HP 455) despite 36 attempts.

## Source spec

Spec 07 (Enemy Content & AI) — befriendable boss mechanics. No open questions; boss friendship routes established in prior phases.

## Implementation units

### Unit 1 — Evidence refresh: mercy policy

**File:** `src/Playtest/policies.ts`

Add new `mercy` policy that:
- Damages Coastal Tyrant to authored HP gate (below 200 HP per current befriendability config)  
- Then shifts to heart/defend actions (tests "wound then spare" path)
- Keep existing pure `friendship` as nonviolent-patience control

**File:** `src/Playtest/report.ts`

Extend report with HP-gate traces:
- Track enemy HP per round for mercy policy runs
- Report HP crossing timing vs befriendability threshold
- Add mercy-specific outcome classification

### Unit 2 — Tuning doctrine: fix decisiveness

**File:** `src/Enemy/enemy-library.ts` (Coastal Tyrant entry)

Update Coastal Tyrant befriendabilityConfig if evidence proves current HP gate unreachable:
- Reduce timeout/stall mechanics (target: timeout under 25%)
- Ensure wound-then-spare mercy resolves below HP gate
- Add alternate surrender predicate only if evidence proves pure patience should be viable

**File:** `src/Playtest/types.ts`

Add mercy outcome tracking to `PlaytestOutcome` union type.

### Unit 3 — Documentation and guards

**File:** `automation/playtest/NEXT_STEPS.md`

Document new mercy policy as third canonical probe (alongside early-game/endgame).

**File:** `docs/combat.md` 

Update friendship-path prose if doctrine changes affect general befriend mechanics.

**File:** `src/Playtest/e2e/reference-fixtures.engine.test.ts`

Add hermetic test for mercy policy execution and new report fields.

## Decisions made upfront — DO NOT ASK

- **Mercy policy approach:** Damage to HP gate then switch to heart/defend. This tests both damage dealing and friendship mechanics in sequence.
- **HP gate threshold:** Use existing befriendabilityConfig.hpThreshold (200 for Coastal Tyrant) as switching point.
- **Report depth:** HP traces only for mercy policy runs to avoid overwhelming existing reports.
- **Timeout target:** Under 25% based on user feedback that current 80% rate is unacceptable.
- **Tuning scope:** Limited to Coastal Tyrant only; other boss balance out of scope.

## Verify gate

- `npm run verify` (type-check + tests + build)
- All existing playtest tests pass
- New mercy policy test passes
- No regression in existing friendship mechanics

## Commit body template

```
feat(playtest): phase 101 — coastal tyrant mercy-route tuning

- Add mercy policy that damages to HP gate then switches to friendship
- Extend playtest reporting with HP-gate traces for mercy runs  
- Update Coastal Tyrant befriendabilityConfig for better decisiveness
- Document mercy policy as third reference probe

Decisions:
- Mercy switches at existing hpThreshold (200 HP) to reuse config
- HP traces only for mercy runs to avoid report bloat
- Target timeout under 25% per user balance feedback

Closes #<phase-issue-number>
```

## Definition of Done

- [ ] New `mercy` policy implemented in `src/Playtest/policies.ts`
- [ ] Report extended with HP-gate traces in `src/Playtest/report.ts`
- [ ] Coastal Tyrant befriendabilityConfig tuned for better decisiveness  
- [ ] New mercy outcome tracking added to playtest types
- [ ] Documentation updated for mercy policy workflow
- [ ] `docs/combat.md` friendship-path prose updated if needed
- [ ] Hermetic test for mercy policy and new report fields
- [ ] Timeout rate under 25% in mercy policy runs
- [ ] At least one explicit wound-then-spare friendship path viable
- [ ] No dominant defensive-only win pattern in new balance

## Follow-ups (out of scope)

- Applying mercy/wound-then-spare pattern to other boss enemies (Phase 102 candidate)
- General befriendability tuning for non-boss enemies
- UI/UX improvements for friendship route feedback