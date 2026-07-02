# Goal — skill-learning walkthrough

**Surface under test:** the Phase 30 unit 3 Character-tab Learn
prompt. After the existing Allocate prompt loop, `characterTab` reads
`getAvailableSkills(player)` and offers each eligible skill via a
`rawlist`, with a "leave them unlearned" exit. Each pick dispatches
`LEARN_SKILL` (the Phase 30 unit 3 action), which routes through
`learnSkill(character, skillId)` from `src/Skills/skill.engine.ts`
(Phase 30 unit 1) — appends to `knownSkills`, no-op on
already-known / unknown / requirement-blocked.

The walkthrough boots the Wanderer preset (level 8, knows the full
T1 + T2 set = 9 of 12 skills). At level 8, Wanderer doesn't meet
the T3 tier-derived level minimum (10), so the 3 T3 skills are
blocked by requirement. The 9 T1 + T2 skills are already known. Net
eligibility: 0. The walkthrough's value is verifying that the
prompt loop is correctly *skipped* when nothing is learnable, the
CLI doesn't error, and Character-tab traversal stays clean.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. Bootstrap records the Wanderer preset (level 8, baseStats
   `5/4/4`, `knownSkills.length === 9`, including all 6 T1 ids and
   3 T2 ids).
2. The state log contains NO `learnSkill` action (no learn fired —
   nothing was eligible).
3. The CLI emitted no `[event]` lines tied to skill-learning (the
   topic doesn't exist per Spec 12 Q6's locked taxonomy, so this
   is automatic — flag the absence as confirmation).
4. The session exits cleanly via `quit` (`cli:exit` reason
   `'quit'`).

**Fail conditions:**

- A `learnSkill` record appears in the state log — would mean
  `getAvailableSkills` over-reported eligibility (e.g. counted
  already-known skills) or the prompt-loop guard
  (`learnable.length > 0`) is broken.
- The CLI exited with `reason: 'error'` — would mean the prompt
  loop threw on an empty choice list, or the Character tab's
  Allocate-then-Learn chaining is malformed.

**Diagnostic notes for the agent:**

- The empty-eligibility branch is the intentional test case for
  this walkthrough. The hermetic suite at
  `src/Game/e2e/learn-skill.engine.test.ts` exercises the
  eligible-learn-appends, already-known-no-op, and
  requirement-blocked-no-op paths directly through the LEARN_SKILL
  action.
- Demonstrating a learn-fires walkthrough would require a custom
  preset with an empty `knownSkills` array (no such preset ships)
  or a debug-only `--strip-skill <id>` CLI flag (a Phase 30
  follow-up, out of scope here). The Phase 30 brief documents
  this trade-off explicitly.
- Wanderer is preferred over Apprentice for the walkthrough
  because Wanderer's level (8) actively demonstrates the
  level-requirement gate on T3 — T3 is blocked because Wanderer
  hasn't reached level 10 yet. Apprentice (level 1) would also
  produce 0 eligible skills, but for the simpler reason that
  Apprentice already knows the only tier they qualify for.
