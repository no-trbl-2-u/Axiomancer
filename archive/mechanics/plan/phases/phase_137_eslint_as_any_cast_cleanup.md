# Phase 137 — ESLint as-any cast cleanup

## Outcome

Remove 5 `as any` casts from `src/Combat/e2e/combat-phases.engine.test.ts` and replace with proper TypeScript typing (`RoundEvent[]` for events arrays), ensuring zero ESLint warnings remain.

## Source spec

No direct spec — this is code quality maintenance. Based on build plan description: "Remove 6 `as any` casts from `hazard.persistence.engine.test.ts` and `hazard.engine.ts`; add proper TypeScript typing throughout." However, actual analysis shows 5 casts in `src/Combat/e2e/combat-phases.engine.test.ts` (lines 46, 80, 116, 148, 182).

## Implementation units

**Unit 1:** Replace `events: any[]` with proper typing
- File: `src/Combat/e2e/combat-phases.engine.test.ts`
- Change lines 46, 80, 116, 148, 182: `const events: any[] = [];` → `const events: RoundEvent[] = [];`
- Add import: `import type { RoundEvent } from '../combat.resolver';`

## Decisions made upfront — DO NOT ASK

- **Events array type:** Use `RoundEvent[]` based on function signatures in `action-restriction.ts` and `advantage.ts`
- **Import location:** Import `RoundEvent` from `../combat.resolver` as that's where the type is defined
- **No functional changes:** Only type annotations change, no runtime behavior modification

## Verify gate

- `npm run lint` — zero warnings
- `npm run type-check` — zero errors  
- `npm test` — all tests pass
- `npm run verify` — full verification passes

## Commit body template

```
fix(Combat): replace as any casts with proper RoundEvent[] typing

- Replace 5 `events: any[]` declarations with `events: RoundEvent[]`
- Add RoundEvent import from combat.resolver
- Zero ESLint warnings remaining

Decisions:
- Used RoundEvent[] type based on function signatures requiring this type
```

## Definition of Done

- [ ] All 5 `as any` casts in combat-phases.engine.test.ts replaced
- [ ] `RoundEvent` type imported from correct module
- [ ] `npm run lint` produces zero warnings
- [ ] `npm run verify` passes completely
- [ ] Commit follows clean format without Co-Authored-By

## Follow-ups (out of scope)

None — this is a isolated code quality fix.