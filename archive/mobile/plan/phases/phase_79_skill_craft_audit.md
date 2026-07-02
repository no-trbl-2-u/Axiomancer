# Phase 79 — Skill / craft functionality audit

> Promoted via /oversight 2026-05-23 (36th call) from user
> observation: "Skills in the UI don't appear to have any
> effect? Audit the skill's (or 'craft's') functionality."
> Investigation phase.

## 1. Findings

Traced skill selection from picker → engine `executeSkill`
end-to-end. Three independent root causes contribute to the
"skills don't appear to have any effect" symptom:

### Finding A — Engine silently blocks most picks

The engine's combat resolver
(`node_modules/axiomancer-mechanics/dist/Combat/phases/
scenario.js:25-45`) checks three preconditions before
running a skill, and emits a `phase: 'skill', kind:
'blocked', reason: <…>` event if any fails:

1. `reason: 'unknown-skill'` — the id isn't in the engine
   skill library.
2. `reason: 'not-equipped'` — the id isn't in
   `player.equippedSkills`.
3. `reason: 'insufficient-resources'` — the skill's
   `resourceCost` (per-resource: `body / mind / heart /
   fallacy / paradox`) exceeds the current
   `combatResources` pool.

The mobile skill picker offers **all 21 entries** of the
engine `skillLibrary` (via `COMBAT_SKILLS`,
`state/selectors/combat-skills.ts:61`); it does NOT filter
by `player.equippedSkills`. Default fresh characters have
no equipped skills → every pick lands in branch (2) and
the engine quietly emits `not-equipped`.

### Finding B — Mobile resource model is a flat sum; engine model is per-type

The picker enables a row when `s.manaCost ≤ vm.player.mana`
(`buildSkillPicker` in
`state/presenters/combat.engine.ts:1136`). `manaCost` is
`totalResourceCost = body + mind + heart + fallacy +
paradox` (`combat-skills.ts:44`). But the engine's
`canUseSkill` (used in branch (3) above) checks
**per-resource** availability against
`combat.combatResources`. Even when a skill is "enabled"
in the picker, the engine can still block it on
`insufficient-resources` because the player has 14 generic
mana but zero body-typed resource.

### Finding C — `summarizeRoundEvents` drops every skill event except `kind: 'damage'`

`state/actions.ts:381-484` only handles `phase: 'skill',
kind: 'damage'` from the engine's `SkillPhaseEvent` union.
The other 10 skill-event kinds (`heal`, `effect-applied`,
`effect-resisted`, `effect-rebounded`, `buff-stripped`,
`buff-converted`, `resources-spent`, `philosophical-
generated`, `synergy-fired`, `blocked`) are **silently
dropped** — they never reach the combat log, never reach
the resolve VM. The user sees "nothing happened" even
when the engine emitted a meaningful event.

This third finding is the silent-failure amplifier: it's
why the user can't tell finding A or B from a real
non-event. **Fixing C makes A and B observable**, which
makes them fixable instead of mysterious.

## 2. Confirmation traces

- `combat.tsx:269` — `actions.setPlayerAction('skill',
  skill.id)` dispatches with the correct shape.
- `actions.ts:542-562` — `setPlayerAction` writes the
  skillId onto `combat.playerChoice.skillId`. No drift.
- `actions.ts:614` — `resolveCombatRound` is called with
  `playerCombatAction: { stance, action: 'skill',
  skillId }`. No drift.
- `combat.resolver.js` → `phases/scenario.js:25-45` —
  engine gates on equip + resources, emits `blocked` event
  on failure.
- `actions.ts:381-484` — `summarizeRoundEvents` does NOT
  handle `kind: 'blocked'` (or any other non-damage skill
  event). Confirmed by `grep "blocked" state/actions.ts` →
  no matches.

The combat-modal rewrite (`02b75db`) is NOT a contributor
— the dispatch shape survived the refactor cleanly.

The `state/mocks/combat.skills.fixture.ts` AUDIT row
(`[2.0]`) is **stale** — the file was deleted in Phase 16
when the engine `skillLibrary` adapter shipped (per
`state/selectors/combat-skills.ts:9`). Mark the audit row
resolved alongside this phase.

## 3. Scope (single tick — fix Finding C; file A + B as sub-ticks)

Per the ship-a-phase autonomy contract, the investigation
ships with **the smallest fix that exposes the bigger
problems**. Findings A + B are independent product
changes (filter picker vs. real engine state, switch
mobile resource model to per-type) that warrant their own
phases.

### A. Surface every skill-phase event kind in the combat log

`state/actions.ts::summarizeRoundEvents`:

- Add log entries for `phase: 'skill'` events:
  - `kind: 'damage'` (existing, no change).
  - `kind: 'heal'` → "Skill mends — <target> recovers
    <n>."
  - `kind: 'effect-applied'` → "Skill binds — <effect
    name> on <target>."
  - `kind: 'effect-resisted'` → "Skill falters — <target>
    resists <effect name>."
  - `kind: 'effect-rebounded'` → "Skill rebounds — <effect
    name> falls back on you."
  - `kind: 'buff-stripped'` → "Skill scours — <target>
    loses <effect name | a buff>."
  - `kind: 'buff-converted'` → "<message>" (engine
    supplies the message).
  - `kind: 'resources-spent'` → no log entry; UI shows the
    cost on the picker row.
  - `kind: 'philosophical-generated'` → no log entry; this
    is a meta-resource ledger event.
  - `kind: 'synergy-fired'` → "Skill resonates — +<n>
    damage from synergy."
  - **`kind: 'blocked'`** → critical: "Skill fails —
    <reason-as-prose>." Severity `system`. This is the
    one the user is feeling silently today.

Reason prose:
- `'unknown-skill'` → "the skill is not in your repertoire."
- `'not-equipped'` → "you have not equipped that skill."
- `'insufficient-resources'` → "you lack the resources to
  cast it."

### B. Tests for the new log lines

`state/e2e/combat.skill-events.engine.test.ts` (new): pin
that `summarizeRoundEvents` produces a log entry for each
event kind above. Hermetic — construct synthetic
`RoundEvent[]` and call the helper directly.

`summarizeRoundEvents` is presenter-internal today.
Export it for the test.

### C. AUDIT / build-plan housekeeping

- Mark the `state/mocks/combat.skills.fixture.ts` AUDIT
  `[2.0]` row resolved with a note: "Closed under Phase 79
  — fixture was deleted in Phase 16; AUDIT row was stale."
- File two follow-up phases via `plan/PHASE_CANDIDATES.md`
  (post-this-tick, via /expand or /oversight):
  - Phase 79a (proposed) — Skill picker filters by
    `player.equippedSkills`.
  - Phase 79b (proposed) — Mobile skill enablement reads
    `combat.combatResources` per-type instead of flat
    `combatMana`.

## 4. Decisions made upfront — DO NOT ASK

1. **Ship Finding C's fix in this tick.** Without it, A
   and B are invisible bugs. With it, the player sees
   "Skill fails — you have not equipped that skill" and
   the bug becomes observable.
2. **Don't fix A + B in this tick.** Each is a real
   product change (filter picker scope, replace mana
   model). They deserve standalone phases.
3. **Reuse existing `LogSeverityKey` values.**
   `'effect'` for applied/resisted/rebounded/stripped/
   converted; `'damage'` for damage; `'heal'` for heal;
   `'crit'` for synergy-fired (it's the same dramatic
   beat); `'system'` for `blocked` (terse, neutral —
   distinguished from in-fiction events).
4. **Export `summarizeRoundEvents`.** The test needs to
   drive it. Existing helpers in this file already
   `export`; promoting is cheap. Add a JSDoc note that
   the export exists for hermetic testing.
5. **No combat-modal layout change.** Honours the 36th
   /oversight call's combat-modal-audit bias.
6. **No engine bump.** The engine already emits all
   skill events the presenter ignores; this is purely a
   mobile-presenter gap.

## 5. Acceptance (DoD)

- `pnpm verify` green.
- `summarizeRoundEvents` produces a log line for every
  `phase: 'skill'` event kind the engine emits.
- New tests pin one log line per kind (10 cases).
- `state/mocks/combat.skills.fixture.ts` AUDIT row
  marked resolved.
- Audit findings (A, B, C) recorded in this brief; A + B
  filed as follow-up phase candidates.

## 6. Commit body template

```
audit: skill / craft functionality + log-blocked-skills — phase 79

Investigation phase per the 36th /oversight call's user
observation ("Skills in the UI don't appear to have any
effect").

Findings:
- A: Engine blocks every pick because the player has no
  equipped skills (engine emits 'not-equipped' silently).
- B: Mobile resource model is a flat sum; engine checks
  per-resource pools (engine emits 'insufficient-resources'
  silently).
- C: summarizeRoundEvents drops every phase:'skill' event
  except kind:'damage' — A and B are invisible because of
  this. *** Fixed in this tick. ***

A + B are independent product changes filed as follow-up
phase candidates (79a, 79b).

Fix shipped:
- summarizeRoundEvents now logs all 10 phase:'skill' event
  kinds (heal, effect-applied, effect-resisted,
  effect-rebounded, buff-stripped, buff-converted,
  synergy-fired, blocked; resources-spent +
  philosophical-generated are intentionally suppressed as
  ledger noise).
- Critical UX line for kind:'blocked' surfaces the engine
  reason ('unknown-skill' / 'not-equipped' /
  'insufficient-resources') in chronicle voice.

Stale AUDIT [2.0] row about combat.skills.fixture.ts
marked resolved — the file was deleted in Phase 16.

Closes #<phase-issue-number>
```

## 7. Follow-ups (out of scope; file as phase candidates)

- **Phase 79a** — Skill picker filters by
  `player.equippedSkills` so the player can only see (and
  thus pick) skills the engine will actually run. Likely
  also: a "skill book" / equip-management surface that
  lets the player move skills from `knownSkills` into
  `equippedSkills`.
- **Phase 79b** — Mobile skill enablement reads
  `combat.combatResources` per-type (`body / mind / heart
  / fallacy / paradox`) instead of the flat mobile
  `combatMana` sum. Picker disables skills whose engine
  cost exceeds the matching per-type pool.
- **Skill-fail toast.** Even with finding C fixed, a
  blocked skill still costs the player their action that
  round. A pre-dispatch validation (read engine
  precondition, refuse the action before resolveRound)
  would be friendlier UX — but it duplicates engine logic
  and risks divergence. Filed under "consider after 79a /
  79b land."
