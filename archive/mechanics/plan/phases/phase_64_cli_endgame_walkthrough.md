# Phase 64 — CLI demonstration of endgame equipment × stats × combat interactions

> User write-in at oversight 2026-05-20 seventh-of-session. Pure
> agent-graded walkthrough authoring; NO new engine surface.

## Outcome

A new agent-graded walkthrough at
`automation/scripts/walkthroughs/endgame-loadout.{json,goal.md}`
scripts the Sage preset (level 15, full Tier 1+2+3 skills, mid-tier
equipment) through a Tier 3 skill use against the Coastal Tyrant
(`boss` difficulty, alignment-pinned `faith-pessimistic-transcendent`
per Phase 45). The goal file asserts the agent grader verifies:
Tier 3 skill action fires, skill resource cost is consumed, the
Tyrant's boss-script + alignment outlook bias produces strategic
actions, combat closes through `combat:ended`.

The walkthrough demonstrates the interactions between **Tier 3 skill
content (Phase 33/44)**, **equipped-skill rotation (Phase 18 + 30)**,
**enemy alignment AI bias (Phase 45)**, and **boss-tier combat
resolution (Phase 15 phases under `Combat/phases/`)** — the
"endgame" surface the user write-in named.

## Source

`plan/PHASE_CANDIDATES.md` Promoted Phase 64 row (user write-in).
Build plan row at line 87 names the scope: walkthrough + optional
debug command + docs cross-link. Per scope discipline, this phase
ships ONLY the walkthrough + docs cross-link; the debug command is
deferred to a follow-up if a future walkthrough specifically wants
it.

## Implementation units

### Unit 1 — Walkthrough script + goal file

**Files:**
- `automation/scripts/walkthroughs/endgame-loadout.json` (new).
- `automation/scripts/walkthroughs/endgame-loadout.goal.md` (new).

**Script flow:**
1. Boot `sage` preset.
2. Open the Debug tab; `debugSpawn` Coastal Tyrant.
3. Run Tier 3 skill — `skill` action selecting `bootstrap-paradox`
   (Sage has it equipped; Tier 3 / heart aspect; mind cost).
4. Run a few basic-action rounds (`body` / `attack`) to observe the
   Tyrant's `applyOutlookBias` flipping decisions (pessimistic
   enemies have a 25% chance to flip attack → defend).
5. Quit via `tab: quit`.

**Goal-file pass conditions:**
- Bootstrap captures Sage preset (level 15, Tier 3 skills equipped).
- State log records the `debugSpawn` action with `enemyName ===
  'The Coastal Tyrant'`.
- State log records a `combatRound` with `event.playerAction.action
  === 'skill'` and `event.playerAction.skillId === 'bootstrap-paradox'`.
- State log records the skill's resource cost being consumed (mind
  pool drops).
- At least one round shows enemy decision being either `'defend'`
  or `'skill'` (Coastal Tyrant equipped with `achilles-gambit`;
  the boss-script defaults to a body cycle, but the outlook bias
  can flip / the skill-pick gate can fire).
- Combat closes via `combat:ended` (any outcome) OR script
  exhausts cleanly.

### Unit 2 — README + testing.md cross-link

**Files:**
- `automation/scripts/walkthroughs/README.md` Inventory table gains a row.
- `docs/testing.md` Agent-graded e2e harness subsection gains a cross-link to the new walkthrough as a Phase 64 example.
- `CHANGELOG.md` `[unreleased]` `### Docs` (or `### Added` — see D2) gains a Phase 64 bullet.

## Decisions made upfront — DO NOT ASK

- **D1 — No new preset, no new debug command.** Sage already equips Tier 3 skills + has all skills known + mid-tier equipment. The walkthrough demonstrates endgame interactions with what's already in the library. Adding a "true endgame" preset (Tier 3 + Phase 54 set bonus equipped) is a future content phase if/when authoring demand exists.
- **D2 — Walkthrough authoring is `### Docs` in CHANGELOG, not `### Added`.** No public-API surface change; `automation/` is dev-only (`package.json` `files` covers `dist/` only — `automation/` doesn't ship in the published package).
- **D3 — Script length ≤30 lines.** Tight script; aim for the minimum that exercises the path. Long boss-fight scripts (like `boss-encounter`) are 50+ lines because they brute-force a kill; this walkthrough only needs to PROVE the interaction surfaced, not finish the fight.
- **D4 — `bootstrap-paradox` over the other 3 equipped skills.** Heart-aspect Tier 3; well-documented Phase 44 fallacy; thematically lines up with the Sage's late-game "paradox in reach" preset summary.
- **D5 — Sage's mind resource may not be high enough for `bootstrap-paradox` on first round.** Looking at Sage preset (heart 7, body 6, mind 6) — mind stat is 6, derived mind stat is therefore reasonable. The CLI's combat resource economy starts each combat with per-stance tokens; bootstrap-paradox's cost is `{ mind: X }` — script may need a wait/setup round. If the first skill attempt errors, the walkthrough's value still holds (the agent grader sees the *attempt* in the state log; the failure mode is "blocked — insufficient mind" which is itself a documented combat interaction).
- **D6 — Walkthrough is non-hermetic by design.** It's agent-graded, not vitest-graded. Lives in `automation/`, not `src/`. Follows the existing `boss-encounter` walkthrough pattern.

## Verify gate

- `npm run type-check` — no code change (only `automation/` + docs).
- `npm test` — unchanged (636/636 stays green).
- `npm run build` — unchanged.
- `npm run deploy:check` — unchanged (no public-surface change; the walkthrough lives outside `dist/`).
- **Smoke check (optional):** `node automation/agent-e2e.mjs endgame-loadout` if `GH_TOKEN`/`ANTHROPIC_API_KEY` is set. Per `docs/testing.md` the agent-graded suite is smoke-grade and NOT in the verify gate.

## Definition of Done

- [ ] `automation/scripts/walkthroughs/endgame-loadout.json` exists.
- [ ] `automation/scripts/walkthroughs/endgame-loadout.goal.md` exists.
- [ ] `automation/scripts/walkthroughs/README.md` Inventory table gains a row.
- [ ] `docs/testing.md` Agent-graded e2e harness subsection mentions the new walkthrough.
- [ ] `CHANGELOG.md` `[unreleased]` ### Docs gains a Phase 64 bullet.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 64 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **Endgame preset with Phase 54 set bonuses equipped.** A future content phase can author `endgameMystic` (Scholar's Circle 2-piece) or `endgameVanguard` (Iron Discipline 3-piece) and update this walkthrough to use it.
- **CLI debug commands.** A new debug command to fast-track to endgame state (e.g. `debug:max-level`, `debug:equip-set`). Deferred until a specific authoring flow needs it.

## Canonical sibling

`automation/scripts/walkthroughs/boss-encounter.json` is the closest precedent for a Sage + Coastal Tyrant combat walkthrough. Phase 64's variant differs by using a Tier 3 skill action in combat (vs `boss-encounter`'s all-basic-action body-attack loop).
