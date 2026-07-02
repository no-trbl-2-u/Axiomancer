# Phase 85 — Mechanics-vs-UI audit on the combat-modal

> **Phase family**: 85 (standalone)
> **Resolves**: PHASE_CANDIDATES.md `[score 6.5]` row  
> **Direction**: Audit rewrite from 2026-05-23 commit `02b75db`

## Outcome

Audits combat surface inside `EncounterModalOverlay` against the engine's combat reducer following the proven template from 6 prior surface audits, producing a decision table with ALIGNED/DRIFT/MOBILE-ONLY verdicts and fix proposals for any drift rows.

## Context

**Problem**: Major combat modal rewrite on 2026-05-23 (252-line EncounterModalOverlay + 391-line combat tab rewrite) requires mechanics-vs-UI audit to catch drift patterns before they accumulate.

**Historical precedent**: Prior 6 surface audits found 19 DRIFT rows across 73 decisions (26% drift detection rate). Combat modal historically had 1.5× audit weighting until 2026-05-24 due to complexity.

**Audit scope**: Combat surface spanning three files:
- `components/event/EncounterModalOverlay.tsx` (modal container)
- `app/(tabs)/combat.tsx` (main combat panel)  
- `state/presenters/combat.engine.ts` (engine bindings)

## Routes / API endpoints / CLI surface

**Files audited**:
- `components/event/EncounterModalOverlay.tsx` — modal combat surface
- `app/(tabs)/combat.tsx` — main combat implementation 
- `state/presenters/combat.engine.ts` — engine presenter bindings

**Documentation created**:
- `docs/mechanics-ui-audit-2026-05-25-combat-modal.md` — decision table

## Content / data reads

**Engine contracts audited**:
- `Combat` / `CombatState` interface alignment
- `executeSkill` / `applyDamage` binding accuracy
- Skill cost reads and effect processing
- HP fallback behavior and advantage modifiers

**Helper**: Use existing audit template from `docs/mechanics-ui-audit-*` pattern.

## Components / handlers

**Audited components**:
- `EncounterModalOverlay` — prelude/combat/aftermath modes
- `CombatPanel` — extracted combat surface
- `PhaseBottom` — combat sub-panel (~200 lines)
- `ChainBarFixed` + `Rivet` — new chrome elements

**Engine bindings**:
- `useCombatViewModel` state management
- Combat reducer integration points

## Cross-links

**In (verify)**: Audit methodology follows proven template from prior 6 audits  
**Out (ship)**: Decision table documents all mechanics-vs-UI alignment checks  
**Retro-fit**: None required — documentation audit only

## SEO / metadata / output schema

**N/A**: Internal audit documentation, no user-facing metadata impact.

## Hero / body / sub-section composition

**Audit document structure**:
- Engine contract summary
- Decision table (ALIGNED/DRIFT/MOBILE-ONLY columns)
- Fix proposals for drift rows
- Summary statistics

## Empty / loading / error states

**Audit coverage**: Includes error state mechanics alignment (HP fallbacks, invalid skill handling).

## Decisions made upfront — DO NOT ASK

1. **Audit template**: Use proven methodology from prior surface audits (26% drift detection rate)
2. **File scope**: Three core files - EncounterModalOverlay, combat tab, combat presenter
3. **Engine contracts**: Focus on Combat/CombatState, executeSkill, applyDamage patterns
4. **Known drift patterns**: Stale props, type cast leakage, missing skill-cost reads
5. **Output format**: Decision table in `docs/mechanics-ui-audit-2026-05-25-combat-modal.md`
6. **Expected yield**: 4-6 drift rows based on rewrite scope and historical patterns
7. **Fix scope**: Document drift only - fixes ship via separate phases

## Mobile reflow / responsive / paginate / output limits

**Documentation only**: Audit produces markdown decision table, no UI changes in this phase.

## Pages × tests matrix

| Test | Scope |
|------|-------|
| N/A (audit phase) | Decision table validation only |

## Verify gate

1. **Documentation**: Audit document follows proven template structure
2. **Coverage**: All three core combat files included in audit scope
3. **Format**: Decision table with ALIGNED/DRIFT/MOBILE-ONLY columns
4. **Build**: No code changes, documentation only

## Commit body template

```
docs: mechanics-vs-UI audit on combat modal — phase 85

- Audit EncounterModalOverlay + combat tab against engine reducer
- Decision table covers Combat/CombatState interface alignment
- Document drift patterns from 2026-05-23 rewrite
- Follow proven template from 6 prior surface audits

Decisions:
- Audit scope: three core files (modal, tab, presenter)
- Engine focus: Combat reducer, executeSkill, applyDamage contracts
- Output: decision table with ALIGNED/DRIFT/MOBILE-ONLY verdicts

Expected yield: 4-6 drift rows based on historical 26% detection rate.

Closes #<issue-number>
```

## DoD

- [ ] `docs/mechanics-ui-audit-2026-05-25-combat-modal.md` created
- [ ] Decision table covers all three core combat files
- [ ] Engine contract alignment documented (Combat/CombatState)
- [ ] Drift patterns identified with fix proposals
- [ ] Summary statistics match historical audit format
- [ ] All known drift patterns checked (props, type casts, skill costs)

## Follow-ups (out of scope)

- **Future phases**: Implementation of any identified drift fixes
- **Engine updates**: Combat reducer evolution tracking
- **Performance**: Combat modal rendering optimization if needed