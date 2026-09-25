# Phase 54 — Route live combat through `endCombat`

> Ruled via `/oversight` 2026-08-10 (`plan/AUDIT.md`, the resolved "[mobile]
> live combat exit path bypasses endCombat" row, first-map audit 2026-08-08
> finding F3): "route live combat through `endCombat` — the correctness risk
> of an unenumerated silent no-op outweighs the refactor cost of reunifying
> with the panel's local React state." This brief is deliberately condensed
> like phase 55's — no routes, no components, no cross-links; this is an
> engine-wiring correctness phase, not a page-family phase. Sections that
> don't apply are marked N/A.

## Reality-check first (done during this brief's authoring)

Two research passes against the live tree (not the audit's 2026-08-08
snapshot) turned up a fact that changes the shape of the fix: **the bridge
this phase needs already exists and was built for exactly this case.**

- `axiomancer-mechanics/src/Game/store.ts:158` `startCombat(target: Enemy |
  Encounter)` docstring (lines 152-157): *"Stages an encounter for combat...
  The fight itself is driven by the Hazard-Pattern engine outside the store;
  call `endCombat` with the reported outcome to grant rewards."*
  `endCombat(outcome, finalPlayer?)` docstring (lines 159-168): *"Resolves the
  staged encounter. The Hazard-Pattern combat driver reports the `outcome`
  and (optionally) the post-fight `finalPlayer` snapshot."* Both methods were
  already written to bridge exactly hazard-pattern combat into the reducer.
  `axiomancer-mobile/state/actions.ts:940-951` even has a store-level mobile
  bridge, `actions.endCombat(outcome)`, dormant since 2026-07-01 — nothing
  calls it.
- The reason it's unused: `beginHazardEncounter`
  (`axiomancer-mobile/state/actions.ts:921-939`) has an explicit comment,
  "Crucially we do NOT call the legacy `startCombat` — the new engine state
  is owned by the panel's local React state, so `state.combat` stays null,"
  and pulls the bare `Enemy` out of the pending map event's `Encounter`
  wrapper, discarding the wrapper, rather than calling `startCombat(enemy)`.
  Without a staged `state.currentEncounter`, `endCombat`'s own guard
  (`game.reducer.ts:244-245`, `if (!encounter) return state;`) makes any call
  to it a silent no-op — so simply adding an `endCombat` call at the exit
  point without also fixing the missing staging would just move the same
  failure mode one layer deeper. Both halves — stage via `startCombat`,
  resolve via `endCombat` — ship together in this phase.
- `Enemy` is **one interface** (`axiomancer-mechanics/src/Enemy/types.ts:222`),
  imported identically by the legacy `Encounter.enemies` path and by hazard
  combat's `CombatEncounterPanel`. Both are sourced from the same
  `ENEMY_REGISTRY`/`EnemiesByMap` library. There is no type gap: hazard
  `Enemy` records already carry `friendshipReward` (`Enemy/types.ts:260-274`
  — `narrative?`, `xpBonus?`, `flagSet?`, `alignmentDelta?`, `factionDeltas?`,
  `items?`) and `journalEntry`, authored but never read live because nothing
  ever dispatches a `'friendship'`-outcome `endCombat`.
- `game.reducer.ts`'s `START_COMBAT` case (lines 192-241) is pure — it reads
  `state.moralMeter` / `state.regionConsequences.sparedRegions` to compute a
  *staged copy's* `baseStats`/`effects`, and writes only `currentEncounter`.
  It does not mutate anything the live hazard fight reads (the fight already
  received its own `Enemy` object — pre-`startCombat` — as a prop; the staged
  copy inside `currentEncounter` is consulted by `endCombat` only for reward
  metadata: `loot`, `xpReward`, `friendshipReward`, `journalEntry`, `name` —
  none of which `START_COMBAT` touches). Calling it to stage is inert with
  respect to the fight already in progress.
- `state.currentEncounter` is read live-app-wide in exactly one place outside
  the reducer/tests: `selectIsInCombat` (`store.ts:577`) feeds
  `selectActiveTab`'s **cold-start-only** routing
  (`axiomancer-mobile/state/presenters/navigation.engine.ts:50-61`). No
  warm-app UI (tab bar, navigation guards) gates on it. Staging it for a
  hazard fight's duration is safe and is a incidental correctness improvement
  for the cold-start case (an app kill mid-fight now has a chance to resume
  into the combat-encounter screen instead of silently dropping into
  exploration with an orphaned enemy) — not something this phase needs to
  build or test deliberately, just a fact that removes a "is this safe"
  worry.
- **Net scope: zero changes to `axiomancer-mechanics`.** This is entirely a
  mobile-side wiring fix — call the two store methods that already exist,
  trim the mobile-only reward stub down to only what has no engine
  equivalent, and add the outcome mapping the two systems' vocabularies need.

## Content / data reads — N/A

No content loader touched. No `Card`/`Item` library edits. `Enemy` records
already carry every field this phase reads (`friendshipReward`,
`journalEntry`, `loot`, `xpReward`) — no library authoring needed for the
fix to function; it just starts reading data that already exists.

## Components / handlers

- `axiomancer-mobile/state/actions.ts` — `beginHazardEncounter` (lines
  921-939): after computing the HP-scaled enemy (`withScaledEnemyHp(enemy,
  ENCOUNTER_ENEMY_HP_MULTIPLIER)`), call `store.getState().startCombat(
  scaledEnemy)` before returning it, so `state.currentEncounter` is staged
  with the same enemy object the fight itself uses. Update the stale comment
  ("Crucially we do NOT call the legacy `startCombat`...") to state the new
  behavior and why (it's no longer legacy-only; it's the reward-staging half
  of the `endCombat` bridge).
- `axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx`:
  - Add `mapHazardOutcomeToEndCombat(outcome: CombatOutcome): 'victory' |
    'defeat' | 'friendship' | 'flee'` next to `isMercifulWin` (lines
    115-120): `'victory' → 'victory'`; `'mercy' | 'capitulate' | 'concede' →
    'friendship'`; `'defeat' → 'defeat'`; `'retreat' → 'flee'` (dead branch —
    `combat.encounter.types.ts:451` documents no in-combat retreat exists;
    kept only so the mapping is total, not partial).
  - Trim `applyHazardOutcome` (lines 141-196) to keep only what has **no**
    reducer equivalent: the `store.setState` block's `floatingDice` write-back
    and `bankedSouls` accumulation (Spec 32 v3 / Phase 32 part 1b, hazard-only
    concepts), and the HP write-back on non-`defeat` (needed because the new
    `store.getState().endCombat(mapped)` call is made with no `finalPlayer`
    arg — see next bullet — so `state.player` must already carry the
    post-fight HP by the time it dispatches). **Remove** the inline XP grant,
    loot roll, and `advanceKillObjectives` call — `endCombat` now owns all
    three (and additionally grants quest-completion currency/XP rewards,
    which the old inline stub never did at all — see Decisions #2).
  - Immediately after that trimmed `store.setState` call, call
    `store.getState().endCombat(mapHazardOutcomeToEndCombat(outcome))` — no
    `finalPlayer` argument; `state.player` already has the correct
    post-fight HP/floatingDice/bankedSouls from the write-back that just ran,
    so the reducer's `nextPlayer = finalPlayer ? ... : state.player` (line
    261) falls through correctly to the already-updated root player.
  - Move the level-up cascade (the `while` loop, lines 183-195) to run
    **after** the `endCombat` call, gated the same way
    (`outcome === 'victory' || isMercifulWin(outcome)` — `endCombat`'s
    reducer doesn't call `applyLevelUps` itself, confirmed via
    `game.reducer.ts:133-149`/`413-414`: only the `LEVEL_UP` action case
    does, so the mobile-side cascade stays load-bearing, just re-sequenced to
    run after XP actually lands via `endCombat` rather than the old inline
    grant).
  - Update the file-header doc comment (lines 6-21) and the function's own
    doc comment (lines 122-139) — both currently describe `applyHazardOutcome`
    as the standalone bridge the engine omits; reword to describe it as the
    hazard-only remainder now that `endCombat` owns quest/flag/codex/
    faction/alignment/morale/autosave/event-emission.
- `axiomancer-mobile/components/event/EncounterModalOverlay.tsx` —
  `handleHazardExit` (lines 154-161): no change. `endCombat`'s defeat-branch
  work (restore-inventory, clear `currentEncounter`) already runs inside
  `applyHazardOutcome`'s effect before `onExit` fires; `resetRun({
  keepCharacter: true })` on defeat still runs after, on the now-correctly-
  reconciled root state, and stays as-is (orthogonal run-reset concern, not
  `endCombat`'s domain).

## Output schema / contracts

No new types. `CombatEndReport` (already exported, `store.ts:82-...`) is now
actually populated by live play (`friendshipReward.codexEntryUnlocked`,
`.narrative`, etc.) but this phase does not surface it in any UI — see
Follow-ups. `state` gains, for the live hazard path for the first time: real
`flags`, `philosophicalAlignment`, `factionReputations`, `codex.
unlockedEntries`, `moralMeter` deltas on merciful wins; a quest-completion
`currency`/`experience` grant on any outcome that completes a kill-quest; and
an autosave (`END_COMBAT` is in `store.ts:73`'s `DURABLE_ACTIONS`) plus a
`combat:ended` `GameEvent` emission (`store.ts:257`) on every hazard combat
end.

## Cross-links — N/A

No routes, no new screens. The only "surface" is engine state now being
populated correctly after a live fight; nothing new to link to.

## Empty / loading / error states — N/A

`endCombat`'s guard (`if (!encounter) return state`) already degrades to a
no-op if `currentEncounter` somehow isn't staged (e.g. a future call site
that doesn't go through `beginHazardEncounter`) — unchanged, still the
correct defensive behavior.

## Decisions made upfront — DO NOT ASK

1. **Stage via `startCombat`, don't hand-roll a `currentEncounter` write.**
   `startCombat` already exists, is pure, and is documented for exactly this
   purpose (see Reality-check). Bypassing it to avoid its moral-meter/region-
   mercy scaling would be inventing a second staging path for no reason —
   that scaling only touches the *staged copy's* `baseStats`/`effects`,
   fields `endCombat` never reads for rewards, so it's inert either way.
2. **Outcome mapping: `mercy`/`capitulate`/`concede` → `'friendship'`, not a
   new reducer outcome.** This is the one real behavior change live players
   will see: today these three "won without killing" outcomes grant full
   `enemy.xpReward`, zero loot, and no flags/codex/faction/alignment/morale
   effects (`isMercifulWin` branch, old `applyHazardOutcome`). Routed through
   `endCombat`'s `'friendship'` branch, they'll grant **half** `totalEncounterXp`
   plus any authored `friendshipReward.xpBonus`, a **full** loot roll (loot
   was previously skipped entirely on merciful wins — a strict improvement),
   plus whatever `flagSet`/`alignmentDelta`/`factionDeltas`/`journalEntry`
   codex unlock the enemy record authors. Judged a correctness fix, not a
   balance nerf: `friendshipReward` fields are already authored on enemy
   records and were shipped to be read by exactly this reducer branch; they
   have simply never fired live. `'victory'` maps to `'victory'`, `'defeat'`
   to `'defeat'`, `'retreat'` (dead — no in-combat retreat exists,
   `combat.encounter.types.ts:451`) to `'flee'` defensively for switch
   totality.
3. **`applyHazardOutcome` keeps only floatingDice/bankedSouls/HP write-back.**
   Everything else it used to hand-roll (XP, loot, kill-objective
   advancement) is now `endCombat`'s job, called immediately after in the
   same effect. This also fixes an unenumerated gap the 2026-08-08 symptom
   fix didn't cover: quest-completion `currency`/`experience` rewards
   (`game.reducer.ts:289-299`) were never granted by `advanceKillObjectives`
   alone (it only advances/completes the quest log) — live players who
   completed a kill-quest got the log update but not the payout. `endCombat`
   grants both in one pass.
4. **No `finalPlayer` argument passed to `endCombat`.** The write-back
   `store.setState` call runs first and lands HP/floatingDice/bankedSouls on
   the root `state.player`; `endCombat` called with outcome only reads
   `state.player` as its base (reducer line 261: falls through to
   `state.player` when `finalPlayer` is omitted) and layers reward grants on
   top. Passing `finalState.player` as `finalPlayer` too would be redundant
   (same HP value, already applied) and would additionally overwrite
   `inventory`/other fields the write-back's `store.setState` spread already
   preserved correctly — simpler and equally correct to omit it.
5. **`handleHazardExit`'s defeat-triggered `resetRun` is untouched and stays
   ordered after `endCombat`.** `endCombat`'s defeat-branch effects
   (inventory-restore no-op for hazard since hazard never mutates root
   inventory on defeat; `currentEncounter` clear) are subsumed a moment later
   by `resetRun({ keepCharacter: true })`'s own run regeneration — no
   conflict, no reordering needed.
6. **No engine (`axiomancer-mechanics`) changes.** `startCombat`/`endCombat`
   and their reducer cases already do everything this phase needs; this is a
   pure mobile call-site fix.

## Mobile reflow — N/A

No UI change; no new copy.

## Pages × tests matrix

| Surface | Test |
|---|---|
| `beginHazardEncounter` stages `currentEncounter` | New/updated test in `axiomancer-mobile/state/e2e/` (or wherever `beginHazardEncounter` is currently covered): after calling it, `store.getState().currentEncounter?.enemies[0]` is defined and matches the returned enemy's `id`. |
| Victory routes rewards through `endCombat` | New test (extend `CombatEncounterPanel.souls-bank.test.ts` or a sibling file): stage via `startCombat`, call the trimmed `applyHazardOutcome` with `outcome: 'victory'`, assert `store.getState().currentEncounter` is now `undefined`, `player.experience`/`inventory` reflect `endCombat`'s grant (not a duplicate/double grant), and any active `kill` quest objective for the enemy's name advances. |
| Mercy-family routes to `'friendship'` and activates authored rewards | New test: use (or extend) a fixture enemy carrying `friendshipReward: { flagSet, alignmentDelta, factionDeltas, xpBonus, items }` and a `journalEntry`; call the trimmed `applyHazardOutcome` with `outcome: 'mercy'` (and separately `'capitulate'`, `'concede'`); assert `state.flags` includes the flag, `philosophicalAlignment`/`factionReputations` shifted, `codex.unlockedEntries` includes the journal entry id, `moralMeter` shifted +1, and XP equals half `xpReward` plus `xpBonus` (not the old full-`xpReward` figure). |
| Quest-completion reward grant (previously silently skipped) | New test: a quest whose only objective is `kill <enemy name>` and whose `reward` is `{ kind: 'currency', amount }` (or `experience`); after a `'victory'`-mapped `applyHazardOutcome` call, `player.currency` (or `.experience`) increased by that amount. |
| Defeat still resets correctly | Existing `EncounterModalOverlay.test.tsx` defeat-aftermath coverage stays green with no assertion changes — confirms `endCombat`'s defeat branch doesn't disturb the existing `resetRun` flow. |
| Souls-bank / floatingDice write-back unchanged | Existing `CombatEncounterPanel.souls-bank.test.ts` (all 4 cases) stays green unmodified — these call `applyHazardOutcome` against a fresh store with no staged `currentEncounter`, so the new `endCombat` call inside it no-ops harmlessly (guard at `game.reducer.ts:244-245`) and the assertions (which only check `bankedSouls`) are unaffected. |
| Autosave / event emission fire on live combat end | New assertion (can ride along with the victory test above): the memory adapter's `save` was invoked (or an equivalent `DURABLE_ACTIONS` proof) after a staged-and-resolved hazard combat — confirms the audit's "run counters... silently absent" line item is closed for the pieces that do exist (autosave), even though "run counters" itself doesn't correspond to any real reducer field (see Reality-check). |

## Verify gate

- `npm run verify --workspace axiomancer-mobile` (only workspace touched —
  no `axiomancer-mechanics` changes per Decision #6).

## Commit body template

```
fix(mobile): route live hazard combat through the engine's endCombat reducer — phase 54

- beginHazardEncounter now stages state.currentEncounter via the existing
  (dormant) startCombat(enemy) bridge instead of discarding the Encounter
  wrapper.
- CombatEncounterPanel's applyHazardOutcome trimmed to only the write-backs
  with no engine equivalent (floatingDice, bankedSouls, HP); XP, loot, quest
  kill-objective advancement, and quest-completion currency/XP rewards now
  flow through a real store.getState().endCombat(...) call.
- New mapHazardOutcomeToEndCombat: mercy/capitulate/concede -> 'friendship',
  activating authored friendshipReward payloads (flags, codex unlocks,
  alignment shifts, faction deltas, moral-meter +1) in live play for the
  first time.
- Live hazard combat end now also autosaves and emits combat:ended, both
  previously silently absent.

Decisions:
- mercy/capitulate/concede -> 'friendship' changes non-lethal-win rewards
  from (full XP, zero loot) to (half XP + authored bonus, full loot, +
  authored friendship extras) — judged a correctness fix activating shipped
  content, not a balance nerf (see brief).
- No axiomancer-mechanics changes — startCombat/endCombat already existed
  for this exact bridge; this is a mobile call-site fix only.

Closes #<phase-issue-number>
```

## DoD

- [ ] `beginHazardEncounter` calls `startCombat`; stale "we do NOT call
      startCombat" comment updated.
- [ ] `applyHazardOutcome` trimmed to floatingDice/bankedSouls/HP only, then
      calls `store.getState().endCombat(mapHazardOutcomeToEndCombat(outcome))`.
- [ ] `mapHazardOutcomeToEndCombat` added and total (all 5 `CombatOutcome`
      literals handled).
- [ ] Level-up cascade re-sequenced to run after the `endCombat` call.
- [ ] New tests per the matrix above all green; existing
      `CombatEncounterPanel.souls-bank.test.ts` and `EncounterModalOverlay`
      defeat-aftermath tests stay green unmodified.
- [ ] `npm run verify --workspace axiomancer-mobile` green.
- [ ] `plan/AUDIT.md`'s endCombat row already reads `[x]` / RESOLVED — no
      edit needed there (confirmed already correct at authoring time).

## Follow-ups (out of scope)

1. Surface `CombatEndReport.friendshipReward` (codex-unlock toast, narrative
   line, alignment/faction shift indicator) in the combat summary UI —
   engine now returns this data live; no UI currently reads it. New phase.
2. `startCombat`'s moral-meter scaling now technically runs against every
   hazard `Enemy` on staging (inert for rewards, per Reality-check) — nobody
   has evaluated whether hazard-pattern combat's own balance model *should*
   incorporate moral-meter stat scaling the way legacy encounters did.
   Separate design question; not this phase's job to resolve or apply live
   (the staged copy's scaled stats are never fed back into the actual fight).
3. AUDIT's original finding named "run counters" as a possibly-silent
   `endCombat` side effect; confirmed during this brief's research that no
   such field exists in `game.reducer.ts` — mobile's `encountersFaced`/
   `deepestNodeId` (`combat-mode.tsx`) are a separate, engine-unaware
   counter pair, unaffected by this phase. No action needed; noting so a
   future audit doesn't re-open a non-issue.
