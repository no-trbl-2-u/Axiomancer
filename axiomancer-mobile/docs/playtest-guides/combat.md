# Combat — `MapEventKind: encounter` (incl. boss)

## 1. What this screen is for

An encounter node resolves to a `combat-prelude` event that renders **in place over the map**, not as a route: `<EncounterModalOverlay>` (`components/event/EncounterModalOverlay.tsx`) auto-engages the prelude, then mounts `<CombatEncounterPanel>` (`components/combat/encounter/CombatEncounterPanel.tsx`) running the hazard-pattern combat (Spec 26b: stage a card, power it with a colour-matched die, APPLY, END PHASE). Aftermath panels (`components/event/aftermath/*`) close the seal. Rules live in `@mechanics`; the panel keeps engine state in local React state, so `state.combat` stays `null` for the whole fight (`app/(tabs)/exploration/index.tsx` Phase 200 comments).

## 2. Enter it directly

- Fixture: `/exploration?fixture=sage-fv-boss-gate` — Sage L15 on fv-9, boss node **fv-24** one step away (tutorial flags set). No `arrive`, so you land on the map; tap `node-fv-24` → `node-confirm-go`. `fresh-start` gives the untutored first fight (tap the first glowing node).
- `/dev` → `debug-trigger-encounter-encounter` (gentlest foe) or `debug-trigger-encounter-boss`; `debug-enemy-map-<map>` then `debug-enemy-<enemyId>` for a specific foe. Both push `/(tabs)/exploration` and fire the prelude.
- Sandbox: `/combat-encounter?seed=N&tutorial=1` (mock foe, nothing persists; `debug-combat-encounter-button` / `debug-combat-tutorial-button`). Renders `combat-encounter-empty` if the sandbox cannot build.
- Aftermath panels alone: `/devaftermath?panel=defeat|parley` (`devaftermath-panel`).
- Globals: `__AXM_COMBAT_SEED__` (sandbox seed, `readSeed`), `__AXM_COMBAT_DECK__` (sandbox deck override), `__AXM_DICE_INSTANT_SETTLE__` and `__AXM_JUICE_INSTANT__` (skip roll/juice animations).

## 3. Test IDs

| testID | what it is |
|---|---|
| `encounter-modal-overlay` | The seal over the map for the whole prelude → combat → aftermath session |
| `combat-reveal` | Pre-fight reveal (foe, phases, your vitae) |
| `combat-reveal-phase-<i>` | One phase card on the reveal |
| `combat-enter` | ENTER — starts the fight and rolls the first tray |
| `combat-withdraw` | WITHDRAW on the reveal — flee, grace −2 |
| `combat-tutorial-primer` | First-fight primer panels (shown when `combat-tutorial-done` is unset or `?tutorial=1`) |
| `combat-primer-next` / `combat-primer-begin` | Advance / finish the primer |
| `combat-primer-skip` | Skip the primer |
| `combat-tutorial` | Turn-one coach card (stateless; step derives from board state) |
| `combat-tutorial-skip` | Dismiss the coach and set the flag |
| `combat-board` | The board |
| `combat-hud` | Enemy HUD block (vitae, intent) |
| `combat-intent` | Enemy intent icon |
| `combat-enemy-action-card` | The enemy's played action card |
| `combat-dice-tray` | Your rolled dice |
| `combat-die-<id>` | One die (`components/combat/encounter/CombatDie.tsx`); tap gesture is `combat-die-tap-<id>` |
| `combat-dice-skip` | Skip the roll ritual |
| `combat-hand` | Hand strip |
| `combat-hand-<uid>` | One card in hand; tap to stage |
| `combat-play-area` | Stage area |
| `combat-staged-<uid>` | The staged card |
| `combat-staged-die` | The die socket on the staged card |
| `combat-choose-x-<uid>` / `combat-choose-x-plus-<uid>` / `combat-choose-x-minus-<uid>` | X-value picker on X cards |
| `combat-apply-<uid>` | APPLY the powered card |
| `combat-trash` | Discard target |
| `combat-drop-reject` | Flash when a die is dropped on a wrong-colour card |
| `combat-signature-<id>` | Signature buttons |
| `combat-end-phase` | END PHASE — closes your turn, enemy acts, tray re-rolls |
| `combat-end-consequence` | Consequence line shown at end phase |
| `combat-log-toggle` / `combat-log` / `combat-log-close` | Ledger overlay |
| `combat-card-detail` / `combat-card-detail-close` | Card detail modal (deliberate; has a dismiss) |
| `combat-add-confirm` / `combat-add-strike` / `combat-add-wait` | Confirm sheet when adding a strike |
| `combat-reprisal-picker` / `combat-reprisal-option-<i>-<id>` / `combat-reprisal-skip` | Reprisal choice |
| `combat-mercy` / `combat-mercy-spare` / `combat-mercy-exploit` | Mercy choice when the foe breaks |
| `combat-capitulation` / `combat-capitulation-accept` / `combat-capitulation-continue` | Foe offers to yield |
| `combat-rewards` / `combat-reward-<cardId>` / `combat-reward-preview` / `combat-reward-preview-select` / `combat-reward-preview-close` / `combat-reward-confirm` / `combat-reward-skip` | SPOILS card pick |
| `combat-summary` / `combat-summary-close` | Post-fight summary; Continue closes the encounter |
| `combat-victory-panel` / `combat-victory-panel-carry-on` | Victory seal → CARRY ON returns to the map |
| `combat-friendship-panel` / `combat-friendship-panel-part-as-friends` | Parley seal |
| `combat-defeat-panel` / `combat-defeat-panel-begin-again` | Defeat seal |
| `combat-encounter-empty` | Sandbox could not build an encounter |

## 4. A correct play, step by step

1. Wait for `encounter-modal-overlay` then `combat-reveal`; press `combat-enter`.
2. If `combat-tutorial-primer` shows: `combat-primer-skip` (or walk `combat-primer-next` → `combat-primer-begin`). If `combat-tutorial` shows, either follow its "find:" line or `combat-tutorial-skip`.
3. Tap a `combat-hand-<uid>` → it becomes `combat-staged-<uid>`.
4. Drag a `combat-die-<id>` whose colour matches the card onto `combat-staged-die` (or tap-select the die then the socket). A wrong colour flashes `combat-drop-reject`.
5. Press `combat-apply-<uid>`. Repeat 3–5 while dice remain, or discard via `combat-trash`.
6. Press `combat-end-phase`; the enemy acts (`combat-enemy-action-card`), the tray re-rolls.
7. Repeat until the foe breaks. Answer `combat-mercy-spare`/`-exploit` or `combat-capitulation-*` if asked.
8. Pick a reward (`combat-reward-<cardId>` → `combat-reward-confirm`) or `combat-reward-skip`; close `combat-summary-close`; press `combat-victory-panel-carry-on` (or the friendship/defeat exit). You are back on the map.

## 5. Looks stuck but isn't

- Dead foe (0 vitae) with the board still up: SPOILS (`combat-rewards`) then `combat-summary` render over it; Continue closes it (PLAYTEST_BUGS_2026-09-18 "ruled out").
- `combat-card-detail` / `combat-reward-preview` covering the board are deliberate modals — use their `-close` (or `-select`).
- Dice do nothing right after ENTER / END PHASE: the roll ritual is animating (`state/combat/dice-roll-ritual.ts`); wait, or set `__AXM_DICE_INSTANT_SETTLE__` before boot. `combat-dice-skip` also ends it.
- Impact/shake/number-pop pauses (`lib/juice`): set `__AXM_JUICE_INSTANT__` or wait ~1 s.
- `combat-tutorial` sitting over the board: it is a gate only in the sense that it waits for the action it names; `combat-tutorial-skip` clears it and sets `combat-tutorial-done` (`state/tutorials.ts`).
- A die that will not drop on a card: colour mismatch (`combat-drop-reject`) — try another die or card, not the same one again.
- `setPointerCapture` console errors: artefacts of synthetic pointer events, not a bug.
- The header VITAE bar under the seal is hidden on purpose during combat.
- Reloading mid-fight restarts the same foe from the top (owner call 2026-09-25, `selectResumableFight`); not a loss of state.

## 6. Actually stuck

- `combat-reveal` never appears after tapping a boss/encounter node and the map is idle: no prelude fired — check `action/resolveCurrentMapEvent` and `game/world:moved` in the log.
- Board with no `combat-hand-*`, no dice, no `combat-end-phase`, and no overlay for > 5 s (with instant globals set).
- `combat-summary-close` / `combat-victory-panel-carry-on` pressed and the overlay stays.
- `combat-encounter-empty` outside the sandbox, or `error-boundary-screen`.
Record: fixture/trigger used, foe name (`combat-victory-panel-enemy-name` / HUD), turn count, the last 30 `combat` + `action` log lines, a screenshot. If you must move on, call `globalThis.__AXM_SKIP_EVENT__()` (dev-only) and file that as a finding in its own right.

## 7. Read the log

`__AXM_LOG__.tail(50, { domains: ['combat', 'game', 'action'] })`:
- `combat/encounter-mounted`, `combat/encounter-exited` — the panel's lifetime.
- `combat/end-phase:begin`, `combat/end-phase:threat-resolved`, `combat/end-phase:tray-rolled`, `combat/end-phase:turn-closed` — one END PHASE.
- `game/combat:started`, `game/combat:ended`, `game/character:levelup`.
- `action/beginHazardEncounter`, `action/fleeEncounter`, `action/resolveCurrentMapEvent` (debug level).
- `error/react-boundary` means the panel crashed.
