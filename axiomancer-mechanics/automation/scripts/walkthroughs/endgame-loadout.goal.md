# Goal — endgame-loadout walkthrough

**Surface under test:** the interactions between an endgame-ready
character (Sage preset — level 15, Tier 1+2+3 skills known, mid-tier
equipment) and a boss-tier alignment-pinned enemy (Coastal Tyrant
— `faith-pessimistic-transcendent` per Phase 45) through a Tier 3
skill use in combat. The walkthrough exercises:

- **Tier 3 skill content** (Phase 33 / 44) — Sage equips
  `bootstrap-paradox` (heart-aspect tier-3 paradox skill, mind cost);
  the CLI's `skill` action dispatches it via `executeSkill` per the
  Phase 26 unit 1 wire-up.
- **Equipped-skill rotation** (Phase 18 preset roster + Phase 30
  runtime learning) — the preset surfaces the 4-skill equipped set
  as the in-combat picker pool.
- **Enemy alignment AI bias** (Phase 45) — the Coastal Tyrant's
  pessimistic outlook (`outlook: -67`) triggers `applyOutlookBias` at
  25% per round, sometimes flipping `attack` → `defend` decisions.
- **Boss-tier combat resolution** (Phase 15 split phases under
  `Combat/phases/` + Phase 49 enemy-skill caster path) — the Tyrant
  also carries the `achilles-gambit` body-aspect Tier 3 skill
  (Phase 57); `pickEnemySkill`'s 35% gate may fire it on any round.

The walkthrough is **demonstration-grade**, not a kill-completion
check: the value is exercising the surfaces, not finishing the
fight. Sage's mind-resource pool may not be high enough to cast
`bootstrap-paradox` on round 1 — the CLI surfacing "insufficient
resources" is itself a documented combat-interaction the agent can
note.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. **Bootstrap** records the Sage preset (level 15,
   `baseStats` `{ heart: 7, body: 6, mind: 6 }`, equipped skills
   include `bootstrap-paradox`). The preset's
   `knownSkills.length` is the full T1+T2+T3 union (≥12).

2. **Debug-spawn** records the Coastal Tyrant entry: state log
   shows a `debugSpawn` action with
   `event.slug === 'coastal-tyrant'` and
   `event.enemyName === 'The Coastal Tyrant'`. The enemy's
   `philosophicalAlignment` is present at `{ epistemology: -67,
   outlook: -67, scope: 67 }` (Phase 45 pin) — surfaced either via
   the state log or implied by the `combat:started` event payload.

3. **Tier 3 skill attempt** — state log records a `combatRound`
   (or equivalent) entry with
   `event.playerAction.action === 'skill'` and
   `event.playerAction.skillId === 'bootstrap-paradox'`.

4. **One of two outcomes for the skill cast** (either counts as
   pass):
   - **Success path** — the skill fires; the round's events
     include the skill's effect application (a `skill-phase` event
     stream or equivalent) AND the player's mind-pool resource
     decrements by the cost.
   - **Insufficient-resources path** — the round records the
     attempt + a "skill unavailable" / "insufficient resources"
     beat (the engine declines to fire the skill, the round either
     defaults to the basic action or skips). Either logged outcome
     is acceptable evidence that the surface was exercised.

5. **Enemy alignment AI bias surfaces at least once** — across the
   ~9 rounds the script drives, the Coastal Tyrant should either:
   - emit a round where its action is `'defend'` (the
     `applyOutlookBias` 25%-flip producing a defensive turn
     against the pessimistic-leaning enemy), OR
   - emit a round where its action is `'skill'` with `skillId ===
     'achilles-gambit'` (the Phase 49 enemy-skill caster path
     firing via the 35% gate per round).
   The agent grader notes which interaction surfaced. (Both could
   surface; either is sufficient.)

6. **Combat closure** — combat either ends via a `combat:ended`
   event (any outcome — the script doesn't guarantee a kill), OR
   the script exhausts cleanly with the script-quit `tab: quit`
   action while still in combat (also acceptable; the surface was
   exercised even if the fight continues).

**What this walkthrough does NOT test:**

- Phase 54 set bonuses — Sage doesn't equip any authored set;
  authoring an "endgame set-equipped" preset is a follow-up phase
  per Phase 64 D1 (out of scope here).
- Phase 60 FriendshipReward — friendship-counter capping requires
  both-defend rounds; the script intentionally drives attacks.
  Hermetic coverage at `src/Game/e2e/befriend.engine.test.ts`.
- The Sage's UI tab navigation outside Debug + Combat — that
  surface is covered by `character-sheet` + `boss-encounter`.
