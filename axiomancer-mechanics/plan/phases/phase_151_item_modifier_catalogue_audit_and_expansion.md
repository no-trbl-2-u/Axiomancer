# Phase 151 — Item modifier catalogue audit and expansion

## Source

T requested a mechanics phase to audit item modifiers — prefixes and suffixes — and then add **20 prefixes** and **20 suffixes**.

The intent is content/system depth, not a full equipment rewrite.

## Goal

Strengthen the item modifier catalogue so generated equipment has more expressive, level-appropriate identity and build hooks.

## Scope

1. Audit the current modifier system.
   - Inspect current prefix/suffix types, application rules, rarity/level gating, stat/effect hooks, test coverage, docs, and any dead or duplicated modifiers.
   - Confirm whether prefixes/suffixes are mechanically distinct, presentation-only, or mixed.
   - Record findings in a short repo-local note if the phase changes non-obvious doctrine.

2. Add exactly 20 new prefixes.
   - Prefixes should be mechanically meaningful where the current system allows it.
   - Cover multiple playstyles: defensive, aggressive, status-effect, skill/resource, mobility/initiative, friendship/mercy, and hazard/world-facing hooks if supported.
   - Respect existing level/rarity gating.
   - Avoid duplicate names/effects with existing prefixes.

3. Add exactly 20 new suffixes.
   - Suffixes should complement prefixes without becoming interchangeable clones.
   - Cover multiple item slots and progression bands.
   - Include enough non-damage utility to support Axiomancer's status/skill doctrine.
   - Avoid power spikes that invalidate current rarity/equipment tuning.

4. Test modifier generation and application.
   - Add hermetic tests proving new modifiers are registered, selectable by generation, and apply their effects/stat modifiers correctly.
   - Pin at least one generated item path that can produce a new prefix and one that can produce a new suffix.

5. Update docs/public surface if needed.
   - Update item/equipment docs and exports only where existing conventions require it.
   - Preserve package API stability unless the audit proves a safe nonbreaking export is missing.

## Decisions made upfront — DO NOT ASK

- Add **20 prefixes** and **20 suffixes** in this phase; do not defer half the content.
- Prefer varied mechanical identity over pure stat padding.
- Keep changes data/content-level unless an existing bug blocks modifier application.
- Do not rebalance the whole drop system; only adjust gates if necessary for the new modifiers to be reachable.

## Non-goals

- Do not redesign rarity, set items, equipment templates, or loot-cache rewards.
- Do not overhaul item generation architecture unless the audit finds a blocking bug.
- Do not make mobile UI changes here.

## Acceptance criteria

- [x] Current prefix/suffix system is audited and any relevant findings are recorded (audit recorded in the build-plan row; two-layer catalogue + affix naming model, no blocking bug).
- [x] Exactly 20 new prefixes are added (`addedIn: '2026-06-16'` in `affix.library.ts`).
- [x] Exactly 20 new suffixes are added (`addedIn: '2026-06-16'` in `affix.library.ts`).
- [x] New modifiers are level/rarity/slot appropriate under the existing item-generation model (per-affix `minLevel` + hiddenRarity; backing mods carry level tiers and valid slots).
- [x] New modifiers include status/skill/resource-supporting effects where current mechanics allow it (poison/frost/shock/daze/blind/silence procs, status-chance amp, resistances, token generation, initiative tokens).
- [x] Hermetic tests prove registration, generation reachability, and effect/stat application for representative new prefixes and suffixes (`affixes.engine.test.ts`).
- [x] Existing item/equipment tests remain green (`npm run verify`: 1810 pass / 1 skip).
- [x] Docs or public exports are updated if current conventions require it (no new public exports — extended existing arrays; illustrative docs tables left as-is per prior convention).

## Verification

Run:

- targeted item/modifier tests
- `npm run type-check`
- `npm test -- --run src/Items`
- `npm run verify`
- `npm run deploy:check`

## Definition of Done

The mechanics repo has 20 additional prefixes and 20 additional suffixes, backed by an audit and hermetic tests, with no broad equipment-system rewrite.

## Commit body template

```text
Phase 151 — Item modifier catalogue audit and expansion

- audited current prefix/suffix modifier catalogue and generation rules
- added 20 prefixes and 20 suffixes
- covered registration/generation/application with hermetic tests
- updated item docs as needed

Verification:
- <commands/results>
```

## Follow-ups out of scope

- Mobile item/modifier display polish.
- Loot-cache reward table changes.
- Rarity/drop-rate rebalance beyond minimal reachability fixes.
