# Mechanics ↔ UI audit — combat surface (2026-05-21)

> Filed by `/iterate` ([3.7] AUDIT row, user-direct via
> oversight 26th). Scope: combat surface only (combat.tsx +
> combat.engine.ts + combat-hud.engine.ts + actions.resolveRound +
> actions.nextRound). Other surfaces (event, exploration,
> inventory) get their own audit doc in future iterate ticks.
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
| 1 | `vm.phase` derivation from `combat.phase` | ALIGNED |
| 2 | `onContinueRound` exit branches vs `determineCombatEnd` | ALIGNED (with a missing `state.active` check, see row) |
| 3 | Stance triangle (`BEATS`) vs engine `determineAdvantage` | ALIGNED |
| 4 | Stance advantage display vs `resolveEffectiveAdvantage` | **DRIFT** — UI ignores effect-driven advantage grants/denies |
| 5 | `vm.friendshipCounterMax` vs `FRIENDSHIP_COUNTER_MAX` | ALIGNED |
| 6 | Skill picker `wrongStance` / `tooExpensive` gating | ALIGNED |
| 7 | `combatMana` slice (mobile-only) vs engine mana semantics | MOBILE-ONLY by design (Phase 60d) |
| 8 | Enemy last-stance derivation | ALIGNED |
| 9 | `combat.lastResolution` (action layer side channel) | MOBILE-ONLY |
| 10 | `(playerChoice as any).skillId` typing | **DRIFT** — `any` cast over a mobile-extended field |
| 11 | HUD HP fallback to `state.player` | **DRIFT (minor)** — stale-snapshot risk on combat-clear |

---

## 1. `vm.phase` derivation from `combat.phase` — ALIGNED

**UI:** `state/presenters/combat.engine.ts:990-998` — narrows
`String(c.phase ?? 'choosing_stance')` against a 5-literal union
and falls back to `'choosing_stance'` on unknown values.

**Engine:** `CombatState.phase` is typed
`'choosing_stance' | 'choosing_action' | 'choosing_skill' | 'resolving' | 'ended'`
(engine `Combat/types.d.ts`).

**Verdict:** ALIGNED. The UI's union check enumerates exactly
the engine's five phases. The `'choosing_stance'` fallback on
unknowns is a defensive widening over an untyped passthrough
that could only be triggered by a malformed payload.

**Verified live:** Phase 65 Tick A's regression check at
`state/e2e/combat-vm-hook.engine.test.tsx` drives the engine
through the full lifecycle (`startCombat` → `setPlayerStance`
→ `setPlayerAction` → `resolveRound` → `nextRound`) and asserts
the vm tracks every transition (4 hermetic cases pass).

---

## 2. `onContinueRound` exit branches vs `determineCombatEnd` — ALIGNED (with a missing `state.active` check)

**UI:** `app/(tabs)/combat.tsx:221-280` — three exit branches:

1. `vm.friendshipCounter >= vm.friendshipCounterMax` → parley
2. `vm.enemy.hp <= 0` → victory
3. `vm.player.hp <= 0` → defeat

Otherwise → `actions.nextRound()`.

**Engine:** `Combat/index.js:determineCombatEnd`:
```js
function determineCombatEnd(state) {
    if (state.enemy.health <= 0)        return 'player';
    if (state.player.health <= 0)        return 'ko';
    if (state.friendshipCounter >= FRIENDSHIP_COUNTER_MAX)
        return 'friendship';
    return 'ongoing';
}
```

**Verdict:** ALIGNED. The three exit conditions match
one-for-one (with the friendship check ordered first in the UI
to honor the engine's parley-supremacy convention — see
combat.tsx:222-224 inline comment).

**Sub-row [3.0] — `isCombatOngoing` adds a `state.active`
check the UI does not.** Engine's sibling
`isCombatOngoing(state)` ANDs all three live-ness checks with
`state.active`. The UI never inspects `state.active`. If the
engine ever sets `state.active = false` mid-combat without
also zeroing health or maxing friendship, the UI's
`onContinueRound` will call `nextRound()` on a combat the
engine considers ended. Today no code path hits this — both
`endCombat` actions set `combat: null` rather than flipping
`active: false`. Filing as MOBILE-AHEAD-OF-ENGINE; revisit if
engine semantics change. **Fix proposal:** add a fourth
defensive branch `if (!combat.active) ...` mirroring the
above three; behavior identical today, future-proof.

---

## 3. Stance triangle (`BEATS`) vs engine `determineAdvantage` — ALIGNED

**UI:** `state/presenters/combat.engine.ts:475-479`:
```ts
const BEATS: Record<StanceKey, StanceKey> = {
    heart: 'body',
    body: 'mind',
    mind: 'heart',
};
```

**Engine:** `Combat/advantage.js:determineAdvantage`:
```js
if (attacker === 'heart' && defender === 'body')   return 'advantage';
if (attacker === 'body' && defender === 'mind')    return 'advantage';
if (attacker === 'mind' && defender === 'heart')   return 'advantage';
```

**Verdict:** ALIGNED. Same triangle. The UI even runs a
dev-only `_devAssertTriangleMatchesEngine()` at file load
(combat.engine.ts:880-897) that cross-checks the local `BEATS`
against the engine `determineAdvantage` for all 9 stance
pairs.

---

## 4. Stance advantage display vs `resolveEffectiveAdvantage` — **DRIFT**

**UI:** `state/presenters/combat.engine.ts:700-708` —
`stanceAdvantage(playerStance, enemyStance)` returns
`'adv' | 'dis' | 'neutral'` using ONLY the raw triangle
(`BEATS[playerStance] === enemyStance` → adv;
`BEATS[enemyStance] === playerStance` → dis).

**Engine:** `Combat/advantage.js:resolveEffectiveAdvantage`
takes `(matchup, attackerEffects, attackerStance)` and FLIPS
the matchup if the attacker has any effect in
`advantageGrants`/`advantageDenies` for that stance. So an
"Inspired" effect on a heart-stance attacker grants advantage
even against body (which already wins on the raw triangle) or
against mind (which raw-wise wins against heart).

**Verdict:** **DRIFT.** The picker's ADV / DIS chip on a
stance card reflects only the raw triangle. The actual roll
inside `resolveCombatRound` uses
`resolveEffectiveAdvantage`, which may invert what the player
saw. Pre-resolution chip can be wrong when the player has any
advantage-affecting effect active.

**Fix proposal:** thread `player.effects` into
`buildStanceOptions` and call the engine's
`resolveEffectiveAdvantage(raw, effects, stanceKey)` per
option before exposing the result. Re-export the engine
helper if not already public (it is — `Combat/index.js`
re-exports `resolveEffectiveAdvantage`).

**Severity:** MED. Only visible to players who have active
effects with advantage modifiers (currently zero in shipped
encounters, but inevitable as the encounter pool grows). File
as `[5.0]` iterate row when the user wants the fix.

---

## 5. `vm.friendshipCounterMax` vs `FRIENDSHIP_COUNTER_MAX` — ALIGNED

**UI:** `state/presenters/combat.engine.ts:962, 1077`:
`friendshipCounterMax: FRIENDSHIP_COUNTER_MAX` (read from
engine import on line 26).

**Engine:** `Game/game-mechanics.constants.d.ts`:
`export declare const FRIENDSHIP_COUNTER_MAX = 3`.

**Verdict:** ALIGNED. Single import; no re-declaration.

---

## 6. Skill picker `wrongStance` / `tooExpensive` gating — ALIGNED

**UI:** `state/presenters/combat.engine.ts:744-774` —
`buildSkillPicker` flags a skill as disabled when
`s.stance !== currentStance` OR `s.manaCost > mana`.

**Engine:** skill is selectable iff the player has the matching
stance and enough mana (see Phase 16 / 21 — engine `executeSkill`
through `state/actions.ts:resolveRound:498-514` routes
`{action:'skill', skillId}` to `resolveCombatRound` with
`skillLookup = getSkillById`).

**Verdict:** ALIGNED. The UI's gating mirrors the engine's
selection criteria 1:1. Note: the mana value driving this is
the mobile `combatMana` slice (Phase 60d) not an engine field;
see row 7.

---

## 7. `combatMana` slice (mobile-only) vs engine mana semantics — MOBILE-ONLY by design (Phase 60d)

**UI:** `state/store.ts:65-` defines
`AppStoreState = GameStore & {…, combatMana: CombatManaState | null}`.
`state/actions.ts` calls `seedCombatMana` on combat entry and
`burnCombatMana(cost)` after a skill resolves.

**Engine:** `Character.mana`/`maxMana` were removed from the
engine type in 0.10.2 (per Phase 60d). The engine's
`resolveCombatRound` does NOT consume mana — it expects the
caller to gate skill availability.

**Verdict:** MOBILE-ONLY by design. Phase 60d explicitly lifted
mana into a mobile slice because the engine moved to per-resource
pools (Token Crucible). The current single-mana model is a
mobile presentation choice that will get replaced when the
engine exposes the real per-resource tokens (`Skill.resourceCost`
shape, already shipping on `axiomancer-mechanics@0.6.x`).

**Risk:** if the engine ever re-adds mana semantics directly,
the mobile slice will silently double-bookkeep. Today: clean
separation. Tracking row: PHASE_CANDIDATES has a token-pool
adoption candidate.

---

## 8. Enemy last-stance derivation — ALIGNED

**UI:** `state/presenters/combat.engine.ts:1005`:
`const enemyLastStance = toStanceKey(c.enemyChoice?.stance ?? null);`.

**Engine:** `CombatState.enemyChoice.stance` is the engine's
canonical "what the enemy committed to last round" field
(populated by `resolveCombatRound` per Phase 25-era flow).

**Verdict:** ALIGNED. The UI reads exactly the engine's
documented field with a defensive `toStanceKey` narrowing.

---

## 9. `combat.lastResolution` (action layer side channel) — MOBILE-ONLY

**UI:** `state/presenters/combat.engine.ts:835` —
`resolveSliceFromState` reads `combat?.lastResolution` to
populate the ResolvePanel's roll values, outcome bucket,
primary text, and message.

**Engine:** no `lastResolution` field on `CombatState`. The
action layer (`state/actions.ts:569`) stashes a `ResolutionSummary`
onto the combat slice via `setLastResolution` after each
`resolveCombatRound`.

**Verdict:** MOBILE-ONLY by design. The engine's combat events
emit per-round detail but its CombatState carries no aggregated
"last round result" snapshot. Mobile adds the side-channel so
the UI doesn't have to subscribe to events for the panel.

**Risk:** if the engine ever surfaces a structured
`lastResolution`/`lastRoundResult` on its own state, the
mobile-side stash should be retired to avoid drift. Track via
roadmap.

---

## 10. `(playerChoice as any).skillId` typing — **DRIFT**

**UI:** `state/actions.ts:451-461, 492` — `setPlayerAction`
stashes `skillId` onto `playerChoice` via an `as any` cast.
`resolveRound` reads it back with another `as any`.

**Engine:** `CombatState.playerChoice` is typed
`{stance?, action?}` (no `skillId` field on the engine type as
of 0.10.2).

**Verdict:** **DRIFT (typing only).** Behaviorally correct —
the engine's resolver receives the skillId via the
`playerCombatAction` parameter, not via the playerChoice field
— but the mobile-side state carries an unverified extra field.

**Fix proposal:** declare a mobile-extended
`MobileCombatState = CombatState & {playerChoice: {stance?, action?, skillId?}}`
and cast at the AppStoreState boundary; drop the `as any`
casts in `setPlayerAction` / `resolveRound`. Score `[2.5]` —
typing hygiene, no behavior change.

---

## 11. HUD HP fallback to `state.player` — **DRIFT (minor)**

**UI:** `state/presenters/combat-hud.engine.ts:39`:
```ts
const player = state.combat?.player ?? state.player;
```

**Engine:** during active combat, `state.combat.player` is the
authoritative in-combat snapshot (mutated by `resolveCombatRound`).
`state.player` is the out-of-combat character.

**Verdict:** **DRIFT (minor) — stale-snapshot risk on
combat-clear.** When `endCombat` zeros `state.combat`, the
hook still reads `state.player`. If `state.player.health` was
not synced back from `state.combat.player` on
`combat:player_health_changed` events (currently it isn't —
exploration/character surfaces ignore combat HP transitions),
the SELF tab can show pre-combat HP momentarily.

**Today's impact:** small. The `endCombat` flow always exits
to exploration, which doesn't show HP. The character tab does
show HP but is hidden during combat. The AFTERMATH banner
window is the only place the HUD fallback fires — and the
fallback returns the OUT-of-combat HP, which the user
probably interprets as their "real" HP rather than the
post-combat HP. So today the drift is invisible.

**Fix proposal:** when `endCombat` runs, copy
`state.combat.player.health` back to `state.player.health`
before clearing the combat slice. One-line action-layer
change. Score `[3.0]`.

---

## Closing notes

- **Total decisions audited:** 11.
- **DRIFT:** 3 (rows 4, 10, 11). Row 4 is MED, rows 10–11 are
  LOW.
- **MOBILE-ONLY by design:** 2 (rows 7, 9).
- **ALIGNED:** 6 (rows 1, 2, 3, 5, 6, 8).

**Next iterate ticks** (if the user wants the fixes filed):

- `[5.0]` Thread player effects into stance advantage chips
  (row 4).
- `[3.0]` Mirror engine `state.active` on `endCombat`; restore
  HUD HP after combat (row 11).
- `[2.5]` Type the mobile-extended `playerChoice.skillId` and
  drop `as any` casts (row 10).

**Out of scope for this audit** (queued for future ticks):
- Event-screen surface (presenter + EncounterModalOverlay +
  EventArt dispatch).
- Exploration surface (move-to logic, event triggers, node
  state mapping).
- Inventory surface (equip preview, slot constraints).

**Verification approach:** code-read only this tick (combat
behavior was just verified live during the `[5.9]` playtest
runbook tick — `setup/04_claude_playtest.md` describes the
flow). Live-driving each row would have inflated this tick
beyond a single iterate budget; the runbook is now in place
for future drift sub-rows that warrant playtest verification.
