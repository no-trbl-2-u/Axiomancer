# Goal — coastal-tyrant-befriend walkthrough

**Surface under test:** Phase 68 per-enemy `BefriendabilityConfig`
AND-composition predicate path on the Coastal Tyrant. The walkthrough
boots the Sage preset (level 15, mid-tier endgame kit), debug-spawns
the Coastal Tyrant, and drives **9 consecutive heart-stance defends**
to exercise the predicate-axis matrix:

- `roundsThreshold: 5` — needs at least 5 rounds against the
  predicate before friendship triggers.
- `requiredStances: ['heart']` — the player MUST use heart stance
  on enough rounds for the predicate to satisfy.
- `hpGate: { belowPct: 0.4 }` — the Tyrant's HP must drop below 40%.

Sage defending in heart stance against the Tyrant for 9 rounds
satisfies `requiredStances` + `roundsThreshold` cleanly. The
`hpGate` is **harder** — Sage's heart-stance defend doesn't damage
the Tyrant; the Tyrant's HP only drops if the Tyrant self-damages
(no authored mechanism) or if Sage breaks heart-stance to attack
(which violates `requiredStances`).

Per the Phase 81 brief D3, **the walkthrough grades on
predicate-attempt visibility, not friendship-success**. The agent
grader confirms:
1. Sage spent ≥5 rounds in heart stance + defend action.
2. The BefriendabilityConfig was evaluated by the engine at least
   once per round (`isFriendshipEligible` invoked).
3. Either friendship triggers (rare; hpGate is the gate) OR combat
   continues / script exhausts cleanly.

**Pass conditions (the agent should verify against the state log +
event stream):**

1. **Bootstrap** records the Sage preset (level 15, baseStats
   `{ heart: 7, body: 6, mind: 6 }`, equipment includes `steel-blade`
   + `chain-mail` + `chain-coif`, `knownSkills.length >= 12`).

2. **Debug-spawn** records the Coastal Tyrant entry — state log
   shows `debugSpawn` action with `event.slug === 'coastal-tyrant'`
   and `event.enemyName === 'The Coastal Tyrant'`. The enemy's
   `befriendabilityConfig` is present at `{ hpGate: { belowPct: 0.4 },
   requiredStances: ['heart'], roundsThreshold: 5 }` (per Phase 68
   D3 lock-in; verify against the snapshot payload).

3. **Nine `combatRound` records** with consistent
   `event.playerAction.action === 'defend'` and
   `event.playerAction.stance === 'heart'`. The script issues 9
   such rounds; the agent grader accepts any count ≥ 5 (the
   `roundsThreshold` minimum) since combat may end earlier.

4. **Friendship counter increments** — the state log + event
   stream show the friendship counter rising. Both-defend rounds
   (when the Tyrant also defends) increment the counter per Phase
   36; per Phase 68, the counter cap at 3 (`FRIENDSHIP_COUNTER_MAX`)
   no longer unconditionally triggers friendship — instead, the
   per-enemy `BefriendabilityConfig` predicates must ALL pass.

5. **At least one engine-side BefriendabilityConfig evaluation.**
   The agent grader looks for evidence the engine called
   `isFriendshipEligible` against the per-enemy override — either
   via a debug-log breadcrumb, an event payload field, or the
   absence of a friendship-victory despite the friendship counter
   reaching its old cap. Per Phase 68 D11, `isFriendshipEligible`
   is internal (not on the public barrel), so direct visibility
   may be absent; the agent grades on the **outcome** — friendship
   did NOT fire as soon as the counter hit 3 (which would have been
   pre-Phase-68 behavior).

6. **Combat resolution** — three possible outcomes, all acceptable:
   - **Friendship fires** — `combat:ended` event with
     `outcome === 'friendship'`. Rare for this script because
     `hpGate` is unlikely to satisfy.
   - **Combat continues past 9 rounds** — the script exhausts; the
     trailing `tab: quit` is consumed cleanly.
   - **Combat ends some other way** — e.g. Sage faints from too
     many Tyrant attacks (Tyrant is boss-tier; Sage's chain-mail +
     heart-stance defend reduces but doesn't zero out incoming
     damage). The `combat:ended` outcome would be `'defeat'`.
     Acceptable — the predicate path was exercised regardless.

7. **Session exit** — `cli:exit` reason `'quit'` or
   `'scriptExhausted'`.

**Fail conditions:**

- The friendship outcome fires within 3 rounds — would indicate
  the Phase 68 per-enemy predicate isn't gating the
  friendship-counter cap (the old Phase 36 path would have fired
  friendship at counter === 3).
- No `debugSpawn` record appears — would indicate the debug-tab
  path didn't fire.
- The CLI exited with `reason: 'error'` for any reason other than
  script exhaustion or quit.

**Diagnostic notes for the agent:**

- The Coastal Tyrant's `befriendabilityConfig` is the **first
  authored boss-tier predicate** (per Phase 68 unit 2, commit
  `73105dc`). MournfulGull and HollowEyedBeggar are the normal-tier
  befriendables that ship with the default Phase 36 friendship-counter
  cap (no per-enemy override).
- Per the Phase 81 D3 trade-off: the `hpGate: { belowPct: 0.4 }`
  predicate is the **hardest** of the three to satisfy with a
  heart-defend-only script. The Tyrant doesn't self-damage, and
  Sage defending in heart stance reduces incoming damage rather
  than dealing any. To genuinely satisfy `hpGate`, a player would
  attack the Tyrant down to ≤40% HP via body or mind stances first,
  then switch to heart stance for ≥5 defend rounds. That mixed-stance
  strategy is a follow-up walkthrough — `coastal-tyrant-befriend-mixed`
  could ship in a future iterate tick if the agent-grader run
  demonstrates the predicate path is broken under heart-only.
- The Phase 70 authored `friendshipReward` content (Paradox Loop
  unique + healing-potion + heart-draught + multi-paragraph
  narrative + `alignmentDelta: { outlook: +3, scope: -2 }` +
  `flagSet: 'befriended-coastal-tyrant'`) only surfaces IF the
  friendship outcome fires. Don't grade on its presence.
- Phase 73's `codex-coastal-tyrant` "The Magistrate Who Set Down
  the Circlet" entry would unlock IF friendship fires. Same
  treatment — bonus visibility, not graded.
- The Phase 80 mechanic shift doesn't affect this walkthrough
  directly (no skill casts; only basic-action defends). Phase 80's
  always-land contract on Tier 2 debuffs would matter if the
  Tyrant casts skills with debuff effects via the Phase 49
  enemy-skill caster path (35% chance per round); if observed,
  the agent grader notes which skill fired + which effect landed.
