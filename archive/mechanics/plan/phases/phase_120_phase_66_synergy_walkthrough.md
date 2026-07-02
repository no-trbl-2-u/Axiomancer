# Phase 120 — Phase 66 synergy walkthrough (requires preset extension)

> Close the deferred Phase 81 Unit 2 coverage: make selected Phase 66 synergy skills reachable from a preset and prove them through a walkthrough.

## Outcome

The Phase 66 synergy skill library gains player-experience-tier coverage. A Wanderer-like preset can access selected synergy skills, and an agent-graded walkthrough demonstrates a synergy fire event through the CLI/scripted walkthrough path.

## Source

Promoted from `plan/PHASE_CANDIDATES.md` on 2026-06-05 by T's direct oversight order: "Promote 5, 4, and 1."

Candidate signal: Phase 81 intended a Phase 66 synergy walkthrough but pivoted because the five synergy skills were not present in any preset's `knownSkills` / `equippedSkills`.

## Scope

### Unit 1 — Preset extension

**Files:**
- `src/Character/presets.ts`
- focused preset/skill availability tests if present

Extend Tier 2 preset access so a level-appropriate Wanderer-style preset knows the Phase 66 synergy skills. Minimum viable shape:
- known skills include the five Phase 66 synergy IDs: `resonance-bleed`, `intensity-feedback`, `bat-swarm-thoughtform`, `resonance-burst`, `resonance-detonation`
- equipped skills include 1-2 synergy skills useful for a walkthrough, preferably `resonance-bleed` and/or `resonance-burst`

Preserve the current doctrine: skills are learned/unlocked via `knownSkills`; combat surfaces show currently affordable unlocked skills. Do not regress toward legacy equip-only assumptions.

### Unit 2 — Synergy walkthrough

**Files:**
- `automation/scripts/walkthroughs/synergy-skills-chain.json`
- `automation/scripts/walkthroughs/synergy-skills-chain.goal.md`
- `automation/scripts/walkthroughs/README.md`
- `docs/testing.md`
- `CHANGELOG.md` `[unreleased]`

Author the deferred walkthrough pattern:
1. Start a level-appropriate Wanderer/Sage-like preset with synergy access.
2. Debug-spawn an enemy.
3. Establish the predicate state required for a synergy skill, or use the least brittle synergy path if predicate setup through public commands is too fragile.
4. Cast the synergy skill.
5. Assert a `synergy-fired` `SkillEvent` appears in the event/state log.

## Decisions made upfront — DO NOT ASK

- **D1 — Use minimum reliable preset extension.** If equipping all five creates UI noise or resource contention, know all five but equip only the walkthrough pair.
- **D2 — Prefer reliable evidence over ornate setup.** The walkthrough's job is to prove the synergy event path, not to stage a theatrical perfect combat.
- **D3 — No synergy mechanics changes.** If a synergy itself is broken, file critique and stop; do not silently redesign Phase 66.
- **D4 — No public-surface fixture refresh unless exports change.** Preset data/docs/walkthrough edits should not change exported names.

## Verify gate

- Focused walkthrough command for `synergy-skills-chain`
- `npm run type-check`
- `npm test`
- `npm run build`
- `npm run deploy:check`

## Acceptance

- Preset access makes selected Phase 66 synergy skills reachable.
- Walkthrough pair exists and is listed in the walkthrough README.
- A run can observe `synergy-fired` in the logged event stream.
- No synergy mechanics are altered.
