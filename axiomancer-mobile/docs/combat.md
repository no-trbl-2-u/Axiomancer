# Combat screen

> Implementation pinned by [Spec 04](../specs/04-combat-screen-wiring.md).
> The engine — [`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
> — owns combat rules. This doc describes only what the **screen**
> renders for each phase and how data flows.

The combat screen lives at [`app/(tabs)/combat.tsx`](../app/(tabs)/combat.tsx)
as a thin UI shell. All math, RNG, and state shaping happens in the
presenter at [`state/presenters/combat.engine.ts`](../state/presenters/combat.engine.ts).
The screen reads one frozen view-model and dispatches engine actions
through [`state/actions.ts`](../state/actions.ts).

## Data flow

```text
engine GameStore  ──►  selectCombatViewModel(state, localUi)  ──►  CombatViewModel
                                                                       │
                                                                       ▼
                                                                CombatScreen JSX
                                                                       │
                                                       TouchableOpacity onPress
                                                                       │
                                                                       ▼
                                                            useGameActions().*
                                                                       │
                                                                       ▼
                                                              engine reducers
```

- `useCombatViewModel({ selectedStance })` ([combat.engine.ts](../state/presenters/combat.engine.ts))
  is a thin React hook around `selectCombatViewModel` that subscribes
  only to the engine's `combat` + `player` slices and memoises the VM.
  Subscribing the screen to the full selector return value directly
  would loop forever — `useSyncExternalStore` needs a stable snapshot
  per state, but a freshly-frozen VM object is fresh on every call.
- `localUi` carries the player's *previewed* stance (`selectedStance`)
  while the player is composing a turn. The engine never sees a stance
  until the player commits — taps a stance card, which dispatches
  `setPlayerStance` and advances the phase to `choosing_action`
  ([Spec 04 Q2](../specs/04-combat-screen-wiring.md): default A).

## Phases

The engine's `combat.phase` field drives the four-phase loop
([Spec 04 Q1](../specs/04-combat-screen-wiring.md): A). The screen never
owns phase — it reads `vm.phase` and dispatches `setCombatPhase` /
`resolveRound` / `nextRound` to advance.

Per [Q5](../specs/04-combat-screen-wiring.md), the three choosing-phase
pickers (stance / action / skill) sit in a horizontal pager so the
player can swipe back to reselect a stance or swipe forward to skills.
The pager's page index stays in sync with `vm.phase`; resolving the
round swaps the pager out for the resolve panel.

| Phase | What renders | What the user can do | VM slice |
|---|---|---|---|
| `choosing_stance` | Three stance cards (Heart / Body / Mind) with derived stats and ADV / DIS badges relative to the enemy's last stance. | Tap a stance to commit. | `vm.stancePicker` |
| `choosing_action` | Attack / Defend / Skill / Item action grid + flee link. | Tap Attack to dispatch a basic attack and resolve. Tap Skill to slide forward to the skill picker. Item surfaces a `'Hands are empty.'` toast; Flee surfaces `vm.actionPicker.fleeMessage` (currently `'No fleeing yet.'`) — both are no-ops pending follow-up phases ([Q6](../specs/04-combat-screen-wiring.md) = C). | `vm.actionPicker` |
| `choosing_skill` | Horizontal scroll of skill cards filtered by current stance; greys out skills with `wrong-stance` or `insufficient-mana`. Skills come from a fixture ([Q3](../specs/04-combat-screen-wiring.md) = A); the swap site lives in [`state/mocks/combat.skills.fixture.ts`](../state/mocks/combat.skills.fixture.ts). Phase 16 (`[skipped]`) drains this when the engine ships the top-level `skillLibrary` / `getSkillById` re-export — see `plan/AUDIT.md` `[needs-engine-release]`. | Tap a skill to open the **confirm overlay** (Phase 127): a detail card of the deterministic result (damage / effects / cost) with explicit COMMIT / CANCEL controls. COMMIT spends mana and resolves; CANCEL returns to the picker with no side effects. | `vm.skillPicker` |
| `resolving` | VS layout with player + enemy stance glyphs, advantage label, roll totals, and a damage / friendship banner. **Skill rounds (Phase 127) suppress the attack-roll tracker** — `vm.resolve.playerActionWasSkill` is `true`, so the panel renders a deterministic doctrine banner (no dice imagery) instead of the contested roll bars. | Tap "Next Round" to clear `playerChoice` and return to `choosing_stance`. When the engine signals `endReason !== 'ongoing'` the button changes to "Depart". | `vm.resolve` |

## Always-visible panels

| Panel | VM source |
|---|---|
| Enemy panel — name, tier, HP bar, friendship meter, mind marks, effect chips, "last stance" badge, flavour line. | `vm.enemy`, `vm.friendshipCounter`, `vm.friendshipCounterMax` |
| Battle log — full scroll with severity-coloured lines ([Q4](../specs/04-combat-screen-wiring.md) = C-with-colour). | `vm.log` |
| Player HUD — HP bar, MP bar, effect chips. | `vm.player` |
| Phase header — index pill, header label, pip row. | `vm.phaseHeader`, `vm.phaseIndex`, `vm.phaseOrder` |

## Severity colours (battle log)

```text
info       → AXM.parchment    (cream)
damage     → AXM.blood        (red)
crit       → AXM.sulfur       (yellow)
heal       → #5a8a3a          (moss)
effect     → AXM.rust         (rust)
friendship → AXM.rust         (rust)
system     → AXM.bone         (bone)
```

Adding a new severity means: extend `LogSeverity` in
[`combat.engine.ts`](../state/presenters/combat.engine.ts), map a
colour token in `LOG_SEVERITY_COLOR` ([combat.tsx](../app/(tabs)/combat.tsx)),
and emit the severity from the action layer's `summarizeRoundEvents`.

## Action layer hooks

| Action | What it does |
|---|---|
| `startCombat(enemy)` | Engine `startCombat` + stamps a placeholder `mana` / `maxMana` on the combat-player snapshot. |
| `endCombat()` | Engine `endCombat`. |
| `setCombatPhase(phase)` | Engine `setPhase` no-op when no combat is active. |
| `setPlayerStance(stance)` | Engine `setPlayerStance`. |
| `setPlayerAction(action, skillId?)` | Engine `setPlayerAction`; stashes `skillId` on `playerChoice` when present. |
| `resolveRound()` | Calls `resolveCombatRound` with `(playerCombatAction, enemyAction)`; walks the resolver's events into severity-tagged log entries; stashes a `lastResolution` summary on the combat slice for the resolve panel; transitions phase to `resolving`. |
| `nextRound()` | Clears `playerChoice` and sets phase back to `choosing_stance`. |

## Placeholder mana

The engine does not yet ship a player mana system. The action layer
seeds `combat.player.mana = 9` and `maxMana = 14` on `startCombat`
([state/actions.ts](../state/actions.ts) → `ensureManaOnCombatPlayer`).
Skills decrement the in-combat snapshot's mana. The whole accounting
goes away once engine Spec 04 lands.

## What's still placeholder

- **Skills** — see [Spec 04 Q3](../specs/04-combat-screen-wiring.md);
  fixture at [`state/mocks/combat.skills.fixture.ts`](../state/mocks/combat.skills.fixture.ts).
- **Mana** — see "Placeholder mana" above.
- **Flee** — surfaces `vm.actionPicker.fleeMessage` (currently `'No fleeing yet.'`); presenter-sourced post-Phase-29 critique drain ([Q6](../specs/04-combat-screen-wiring.md)).
- **Item** action — disabled until Spec 06 wires the inventory's
  consumable picker into combat.
- **Stance-derived stats** — the numbers shown on each stance card
  read from `player.derivedStats` via `deriveStancePerformance` in
  `state/presenters/combat.engine.ts` (Phase 26, commit `d8d2e33`).
  The presenter maps the engine's three stat dimensions —
  `emotional*` (Heart), `physical*` (Body), `mental*` (Mind) — onto
  the `{attack, skill, defense}` triple per stance, rounded at the
  mapper boundary because engine stats are real-valued.

## Phase 127 — deterministic skills & the enemy-answer blocker

Player skills are deterministic doctrine: they always hit and carry
static, mechanics-owned damage (the engine's `executeSkill` /
`calculateSkillDamage` path — no contested attack roll). Phase 127
makes the UI honest about that:

- **Confirm overlay** ([`components/combat/SkillConfirmOverlay.tsx`](../components/combat/SkillConfirmOverlay.tsx))
  — tapping a skill stages it (local `pendingSkill` state in
  `app/(tabs)/combat.tsx`) and opens a detail card before the round
  commits. COMMIT routes through the existing
  `setPlayerAction('skill', id)` + `resolveRound()` path; CANCEL clears
  the staged skill with no side effects.
- **No skill dice tracker** — the action layer stamps `wasSkill` onto
  the round-resolve summary (`state/actions.ts`), the presenter lifts it
  to `vm.resolve.playerActionWasSkill`, and `ResolvePanel` swaps the
  contested roll bars for a deterministic banner on skill rounds. Roll
  UI is preserved for genuine attack / defend rounds.

**Blocked — enemy skill-answer display.** The brief's stretch goal is to
show how the enemy *responds* to a player skill (Phase 150 of
`axiomancer-mechanics`). The pinned engine (`axiomancer-mechanics`
**0.21.0**) does not publish an enemy skill-answer event: `SkillPhaseEvent`
(`dist/Combat/combat.resolver.d.ts`) carries only player-cast outcomes
(`damage`, `heal`, `effect-applied`, `buff-stripped`, `synergy-fired`,
…) and `determineEnemyAction` selects a stance/action, never a
counter-skill keyed to the player's technique. Until the engine ships a
typed enemy-response event (mechanics Phase 150), mobile cannot surface
it without inventing combat logic — which the thin-client law forbids.
This is the exact contract gap to drain when the engine bump lands.

## Tests

| What | Where |
|---|---|
| Hermetic e2e — presenter + action layer + four-phase loop + every terminal | [`state/e2e/combat.engine.test.ts`](../state/e2e/combat.engine.test.ts) |
| Hermetic e2e — HUD slice composition | [`state/e2e/combat-hud.engine.test.ts`](../state/e2e/combat-hud.engine.test.ts) |
| Component render — every phase renders without throwing | [`state/e2e/combat.screen.test.tsx`](../state/e2e/combat.screen.test.tsx) |

`npm test` must pass twice in a row and `npx tsc --noEmit` must be
clean before declaring a combat change done. See
[`docs/testing.md`](./testing.md).
