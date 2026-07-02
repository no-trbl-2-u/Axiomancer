# Mechanics ↔ UI audit — combat modal surface (2026-05-25)

> Filed by `/ship-a-phase` (Phase 85, PHASE_CANDIDATES [6.5] row). Scope:
> combat modal surface post-rewrite (EncounterModalOverlay + CombatPanel +
> combat.engine.ts). Covers the 2026-05-23 rewrite (commit `02b75db`)
> following the proven template from 6 prior surface audits.
>
> **Reading guide.** Each row pins a single UI decision, cites
> the engine source-of-truth, and renders a verdict:
> **ALIGNED**, **DRIFT**, or **MOBILE-ONLY** (no engine
> counterpart by design). DRIFT rows include a one-line fix
> proposal — they should each be filed as their own iterate row
> if the user wants the fix.

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | Modal mode state machine vs engine combat lifecycle | **DRIFT** — modal mode doesn't track `combat.active` |
| 2 | Combat outcome detection vs `determineCombatEnd` | ALIGNED |
| 3 | Aftermath data snapshot vs engine combat state | MOBILE-ONLY by design |
| 4 | Combat phase tracking vs `CombatState.phase` | ALIGNED |
| 5 | Combat round display vs `CombatState.round` | ALIGNED |
| 6 | Seal chrome accent color vs combat state | MOBILE-ONLY by design |
| 7 | Auto-scroll on phase change integration | MOBILE-ONLY by design |
| 8 | Combat panel extraction (`mode === 'combat'`) | MOBILE-ONLY by design |
| 9 | Encounter prelude VM validation | ALIGNED |
| 10 | Boss flee-disabled gating logic | ALIGNED |
| 11 | Begin Again flow vs engine `resetRun` | ALIGNED |

---

## 1. Modal mode state machine vs engine combat lifecycle — **DRIFT**

**UI:** `EncounterModalOverlay.tsx:71-92` — internal `EncounterModalMode`
state tracks `'prelude' | 'combat' | 'aftermath'` lifecycle. Transitions:
- `'prelude'` → `'combat'` on user FIGHT action
- `'combat'` → `'aftermath'` when `lastOutcome` signals victory/parley/defeat

**Engine:** `CombatState.active` boolean indicates whether combat is live.
Engine `endCombat` actions can set `active: false` without clearing the
combat slice entirely. `isCombatOngoing(state)` ANDs health/friendship
checks with `state.active`.

**Verdict:** **DRIFT.** Modal mode never inspects `combat.active`. If the
engine sets `active: false` mid-combat without zeroing health or maxing
friendship, the modal stays in `'combat'` mode when engine considers combat
ended. The combat panel would continue accepting actions on a dead session.

**Fix proposal:** Add `combat.active` guard to the `'combat'` → `'aftermath'`
transition check. If `!combat.active`, immediately flip to `'aftermath'`
regardless of outcome signal. Score `[3.5]` — defensive future-proofing.

**Today's impact:** None. Current engine paths always clear `combat: null`
on end rather than flipping `active: false`, so the drift is hypothetical.
But the modal rewrite removed the router-based exit, making this guard
more important than in the prior tab-only flow.

---

## 2. Combat outcome detection vs `determineCombatEnd` — ALIGNED

**UI:** `app/(tabs)/combat.tsx:465-479` — three exit branches in
`onContinueRound`:
1. `combatVm.friendshipCounter >= combatVm.friendshipCounterMax` → parley
2. `combatVm.enemy.hp <= 0` → victory  
3. `combatVm.player.hp <= 0` → defeat

**Engine:** `Combat/index.js:determineCombatEnd` returns `'friendship'` /
`'player'` / `'ko'` / `'ongoing'` using identical thresholds:
- `state.friendshipCounter >= FRIENDSHIP_COUNTER_MAX`
- `state.enemy.health <= 0`  
- `state.player.health <= 0`

**Verdict:** ALIGNED. The UI's outcome logic mirrors engine `determineCombatEnd`
exactly. Order matches engine precedence (friendship trumps HP outcomes).

---

## 3. Aftermath data snapshot vs engine combat state — MOBILE-ONLY by design

**UI:** `app/(tabs)/combat.tsx:425-456` — captures aftermath snapshot
with `enemyName`, `playerXp`, `rewards`, `playerHp` when combat ends.
Stored in `combat-mode` provider for modal persistence.

**Engine:** No aftermath snapshot on `CombatState`. Engine expects
callers to extract victory rewards / XP at the moment of combat end.

**Verdict:** MOBILE-ONLY by design. The modal-based combat flow requires
persistent aftermath data after `endCombat` clears the engine slice.
The snapshot pattern lets the modal show victory panels without keeping
combat state live.

---

## 4. Combat phase tracking vs `CombatState.phase` — ALIGNED

**UI:** `EncounterModalOverlay.tsx:147` — reads
`useGameState((s) => s.combat?.phase ?? null)` for auto-scroll trigger.

**Engine:** `CombatState.phase` is typed
`'choosing_stance' | 'choosing_action' | 'choosing_skill' | 'resolving' | 'ended'`
per engine Combat module.

**Verdict:** ALIGNED. Direct read from engine field with defensive null
fallback. The presenter layer also tracks this field correctly in
`combat.engine.ts:990-998` with proper phase enum validation.

---

## 5. Combat round display vs `CombatState.round` — ALIGNED

**UI:** `EncounterModalOverlay.tsx:151` — reads
`useGameState((s) => s.combat?.round ?? 1)` for seal chrome round token.

**Engine:** `CombatState.round` is incremented by `nextRound` action,
defaults to 1 on combat start.

**Verdict:** ALIGNED. Direct engine field read with correct default fallback.

---

## 6. Seal chrome accent color vs combat state — MOBILE-ONLY by design

**UI:** `EncounterModalOverlay.tsx:152` — calls
`selectEncounterSealChrome(mode, combatRound)` to derive accent colors
(blood/rust in prelude/combat, sulfur in aftermath).

**Engine:** No seal chrome or modal accent colors in engine.

**Verdict:** MOBILE-ONLY by design. The encounter seal visual system is
a mobile presentation layer for modal theming. Engine has no opinion on
accent colors or modal chrome.

---

## 7. Auto-scroll on phase change integration — MOBILE-ONLY by design

**UI:** `EncounterModalOverlay.tsx:146-160` — auto-scrolls combat
ScrollView to bottom when `combat.phase` changes, surfacing new
phase content (action picker → resolving → next round chooser).

**Engine:** Engine phase transitions drive the scroll trigger, but
auto-scrolling is a mobile layout concern.

**Verdict:** MOBILE-ONLY by design. Engine emits phase changes; mobile
decides how to surface them in the bounded modal viewport.

---

## 8. Combat panel extraction (`mode === 'combat'`) — MOBILE-ONLY by design

**UI:** `EncounterModalOverlay.tsx:268-277` — mounts `<CombatPanel>`
inside modal when `mode === 'combat'`, replacing the router-based
`/combat` navigation.

**Engine:** Engine has no opinion on modal vs page-based combat UI.

**Verdict:** MOBILE-ONLY by design. The modal-embedded combat flow is
a mobile UX decision. The same `<CombatPanel>` component works in tab
or modal context.

---

## 9. Encounter prelude VM validation — ALIGNED

**UI:** `EncounterModalOverlay.tsx:193-194` — validates
`vm.kind === 'combat-prelude'` && `vm.preludeChrome !== null` before
rendering prelude content. Returns `null` on validation failure.

**Engine:** Event system provides `combat-prelude` events with prelude
chrome data via presenter layer mapping.

**Verdict:** ALIGNED. The validation guards match the engine event
contract. The presenter guarantees `preludeChrome` population for
`combat-prelude` kind VMs via `withPreludeChrome` helper.

---

## 10. Boss flee-disabled gating logic — ALIGNED

**UI:** `EncounterModalOverlay.tsx:204-207` — disables FLEE button when:
- `vm.variant === 'boss'` (boss encounters)
- OR `fleeChoice?.enabled ?? !isBoss` falls through to false

**Engine:** Boss encounters in engine data have no flee choice or
`enabled: false` flee choice in their event definition.

**Verdict:** ALIGNED. The UI respects both the explicit choice `enabled`
flag from engine data AND the implicit boss-variant rule. Double-gating
provides defense in depth.

---

## 11. Begin Again flow vs engine `resetRun` — ALIGNED

**UI:** `EncounterModalOverlay.tsx:127-131` — on defeat BEGIN AGAIN,
calls `actions.resetRun({ keepCharacter: true })` + mobile
`resetRunStats()` + `dismissAftermath()`.

**Engine:** `resetRun({ keepCharacter: true })` is the engine primitive
for run restart (Phase 72): regenerates `runId`, full-heals player,
clears effects, regenerates world/quests/flags.

**Verdict:** ALIGNED. The UI calls the exact engine primitive with
correct parameters. Mobile-side `resetRunStats()` is supplemental for
mobile-only run counters (`encountersFaced`, `deepestNodeId`).

---

## Closing notes

- **Total decisions audited:** 11.
- **DRIFT:** 1 (row 1). Low severity — hypothetical future-proofing issue.
- **MOBILE-ONLY by design:** 5 (rows 3, 6, 7, 8).
- **ALIGNED:** 5 (rows 2, 4, 5, 9, 10, 11).

**Next iterate tick** (if the user wants the fix filed):

- `[3.5]` Add `combat.active` guard to modal mode transitions (row 1).

**Out of scope for this audit:**
- Combat panel internals (EnemyPanel, BattleLog, PlayerHUD) — covered
  by prior combat surface audit (2026-05-21).
- Aftermath panel implementations (victory/defeat/parley) — Phase 70
  surface, separate audit scope.
- Engine event routing to modal triggers — event surface audit scope.

**Comparison to prior combat audit (2026-05-21):**
- **Drift rate**: 9% (1/11) vs 27% (3/11) in prior audit.
- **Clean integration**: Modal-embedded combat shows better alignment
  than the original tab-only implementation.
- **Modal-specific concerns**: Most decisions (5/11) are mobile-only
  modal presentation choices with no engine equivalent.

**Verification approach:** Code-read audit against engine contracts.
The combat modal was live-verified during Phase 81a playtest; no
additional verification needed for alignment checks.