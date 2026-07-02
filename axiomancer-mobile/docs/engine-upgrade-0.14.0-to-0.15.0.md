# axiomancer-mechanics: 0.14.0 → 0.15.0 upgrade guide for mobile

> Status: **published**. npm registry confirms `axiomancer-mechanics@0.15.0`.
> Phase 112 is the mobile catch-up phase for this release.

---

## TL;DR

- Bump `axiomancer-mechanics` from `0.14.0` to `0.15.0`.
- This is mostly a balance/content/evidence release, not a broad public API break.
- Preserve the corrected doctrine: Stance and Vitae are engine truth. Mobile displays mechanics-emitted stance/resource state, affordability, actions, and reports; mobile does not simulate them.
- Re-check expanded `northern-forest` content, new enemy/NPC/story surfaces, and playtest-facing fixtures against mobile presenters/fallbacks.
- Verification must include typecheck, focused Jest, full verify, and visual smoke/playtest evidence or an exact blocker.

---

## Release contents mobile must account for

## 1. Stance and Vitae authority hardening

**Mechanics change:** Phase 112 hardened the rule that the engine owns Stance and Vitae authority: stance state, Vitae/resource generation and spending, action affordability, and report output.

**Mobile action:**

- Keep stance, Vitae/resource, action-affordability, and report wiring engine-owned.
- Do not restore local stance/resource math, local affordability checks, local action-resolution simulation, or hard-coded consequences.
- If the package exposes richer report fields than current UI shows, render safe existing fallbacks first and file polish rows after the package bump is green.

## 2. Stance/Vitae balance evidence

**Mechanics change:** Phase 113 added stronger Stance/Vitae playtest evidence and a STRATEGIST witness. Phase 121 added a three-anchor Sage balance scaffold and tuning close-out.

**Mobile action:**

- No direct UI rewrite is required solely because of playtest fixtures.
- Ensure combat presenter/action tests still pass with 0.15.0 combat state and enemy tuning.
- If player-facing combat difficulty feels different in visual/playtest evidence, record it as a playtest finding rather than silently compensating in mobile.

## 3. Northern-forest expansion

**Mechanics change:** Phase 117 expands `northern-forest` from 10 to 25 nodes, with three sub-areas, additional MapEventPool coverage, dead-ends, and a small loop.

**Mobile action:**

- Check exploration presenter assumptions about node count, available choices, visited labels, and route/path shape.
- Confirm encounter preludes/event modals tolerate the added northern-forest content without placeholder leaks or missing-copy crashes.
- Visual smoke should catch route-level failures; focused Jest should catch presenter shape drift.

## 4. Enemy family and NPC/story content

**Mechanics change:** Phase 114 adds a second northern-forest enemy family; Phase 115 adds story NPC dialogue content.

**Mobile action:**

- Confirm enemy names, Stance data, Vitae/resource costs, skills, and aftermath/codex/memoir-adjacent copy render through existing presenters.
- Confirm dialogue/event rendering has safe fallbacks for new story nodes and choices.
- Do not invent local story consequences; display engine payloads and file critique rows for absent UI polish.

## 5. Skill description and synergy walkthrough coverage

**Mechanics change:** Phase 118 enriches Tier 3 fallacy skill descriptions. Phase 120 adds synergy-skill walkthrough coverage and preset access for selected synergy skills.

**Mobile action:**

- Confirm combat skill picker/tooltips/text surfaces do not truncate or drop richer descriptions in dangerous ways.
- Confirm any skill-list assumptions still read learned/unlocked + affordable engine truth, not legacy equipped-skill gates.

---

## Required verification for Phase 112

```bash
npm run typecheck
npm test -- --runInBand
npm run verify
npm run verify:visual
```

If visual smoke exits on missing baselines after a clean export/console pass, report baseline debt. If it exits on console/runtime errors, fix those before calling the phase done.

---

## Out of scope

- Implementing the combat UX overhaul design candidate.
- Implementing the aftermath modals design candidate.
- Broad component coverage expansion.
- Mobile-side mechanical compensation for engine balance changes.
