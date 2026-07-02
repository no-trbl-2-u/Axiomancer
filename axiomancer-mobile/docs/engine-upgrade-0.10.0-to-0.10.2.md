# axiomancer-mechanics: 0.10.0 → 0.10.2 upgrade guide for mobile

> Authored retrospectively. The mobile-side surface migrations
> for this bump shipped across Phases 60a–60e *before* the
> lockfile pin moved. Phase 60f is the lockfile bump itself
> plus this doc; it's mostly a "what was already done"
> reference rather than a fresh migration plan.

---

## TL;DR

| Item | Action | Severity | Shipped via |
|---|---|---|---|
| Bump `package.json` pin from `0.10.0` → `0.10.2` | required | trivial | Phase 60f |
| `getCoastalMap` removed → use `getMapDefinition` + `createMapState` | breaking | medium | **Phase 60a** (`baf66fa`) |
| `Encounter.enemy` removed → use `enemies[0]` | breaking | small | **Phase 60b** (`0ee7f63`) |
| `DialogueChoice.id` / `.label` removed; `DialogueNode.speaker` removed | breaking | small | **Phase 60c** (`7e29be5`) |
| `Character.mana` / `.maxMana` removed | breaking | medium | **Phase 60d** (`579a6a7`) — mobile-side `combatMana` slice |
| `ActiveEffect` shape change (no `id` / `name`; reads `effectId`) | breaking | small + latent bug | **Phase 60e** (`8596409`) |
| `GameStore` vs `AppStoreState` shape divergence under strict 0.10.2 types | breaking (tests) | medium | **Phase 60e** (`8596409`) + Phase 60f follow-on test fixtures |
| `GameState` lost its string index signature | breaking (tests) | small | **Phase 60e** (`8596409`) |
| `EffectStatTarget` tightened to a literal union | breaking (tests) | small | Phase 60f fixture cast |
| `MobileNotificationsSlice` requires `toast` field at fixture creation | breaking (tests) | small | Phase 60f fixture sweep |

**Net effect:** by the time Phase 60f lands the lockfile pin, all
nine surface drifts are reconciled. The bump itself is one
`package.json` line + a regenerated `package-lock.json`.

---

## 1. `getCoastalMap` → `getMapDefinition` + `createMapState` (Phase 60a)

**Why:** 0.10.2's barrel no longer re-exports `getCoastalMap`. The
canonical engine entry point for building a map-state is the
two-step `createMapState(getMapDefinition(name))`.

**Where mobile changed:** `state/actions.ts` (2 sites), and
`state/e2e/exploration.engine.test.ts` + `state/e2e/event-pools.engine.test.ts`
(2 sites). See commit `baf66fa`.

## 2. `Encounter.enemy` → `enemies[0]` (Phase 60b)

**Why:** Engine canonicalized `Encounter` to carry `{ enemies, origin }`
rather than a single `enemy`. Mobile only ever reads index 0 — the
existing presenter contract for combat preludes assumes a single
enemy per encounter.

**Where mobile changed:** 5 fixtures + 2 consumers across
`state/presenters/event.engine.ts` + e2e test fixtures. See commit
`0ee7f63`.

## 3. `DialogueChoice` / `DialogueNode` flattening (Phase 60c)

**Why:** Engine dropped `DialogueChoice.id`, `DialogueChoice.label`,
and `DialogueNode.speaker`. Choices now carry `text` directly; choice
identity in mobile is derived from the index into the visible-choices
array.

**Where mobile changed:** `state/presenters/event.engine.ts`
(dialogue rendering), `state/actions.ts` (pickEventChoice routing).
See commit `7e29be5`.

## 4. `Character.mana` / `.maxMana` removed (Phase 60d)

**Why:** Engine removed mana from the public `Character` type.
Mobile's combat HUD still needs a mana bar, so the field was lifted
to a mobile-only `combatMana: CombatManaState | null` slice on
`AppStoreState`. `null` outside combat; seeded on `startCombat`;
cleared on `endCombat`.

**Where mobile changed:** `state/store.ts` (new `CombatManaState`
interface + `AppStoreState` field), `state/presenters/combat-hud.engine.ts`
+ `state/presenters/combat.engine.ts` (widened to `AppStoreState`,
read from `state.combatMana`). Helper `ensureManaOnCombatPlayer`
deleted. See commit `579a6a7`.

## 5. `ActiveEffect` shape change + latent bug (Phase 60e)

**Why:** Engine `ActiveEffect` carries `effectId`, `remainingDuration`,
`intensity`, `appliedAt`, `tier` — no `id`, no `name`. Mobile's
`composeHazard` was declaring its `effects` parameter as
`{ id?: string; name?: string }` and reading
`effect.name ?? effect.id ?? 'effect'`. Every hazard event was
silently rendering the literal string `'effect'` as its consequence
label. Fixed by re-typing the parameter to `ActiveEffect` and
reading `effect.effectId` directly.

**Where mobile changed:** `state/presenters/event.engine.ts`
(`composeHazard`) + 16 e2e test fixture sites (navigation × 4,
exploration × 13, migrations × 3 casts). See commit `8596409`.

## 6. `AppStoreState` vs `GameStore` test alignment (Phases 60e + 60f)

**Why:** On engine 0.10.0 the missing `dist/<Module>/types.d.ts`
files made `GameStore` permissive enough that test fixtures using
`createGameStore` (engine-level) could be passed to
`AppStoreState`-typed presenters via implicit coercion. Under
0.10.2's strict types this fails.

**Where mobile changed:** five additional e2e test files swept in
Phase 60f to use `createAppStore({ adapter, overrides })` at sites
that feed into `selectCombatViewModel` / `selectCombatHudViewModel`
/ `selectTabBadges` / `createAppActions` — all of which take the
mobile-superset `AppStoreState`. Phase 60e covered the
exploration/navigation/migrations files; Phase 60f swept
combat-hud / combat / debug-seed / inventory / navigation
(remaining sites).

## 7. `EffectStatTarget` tightened to a literal union (Phase 60f)

**Why:** `StatModifier.stat` is now `EffectStatTarget` (a literal
union of `'physicalAttack' | 'mentalDefense' | ...`). Mobile test
fixtures use synthetic stat names (`'attack'`, `'stamina'`,
`'defense'`, `'reach'`) for VM-shape diffing purposes only — the
presenter under test diffs by string name, not by what the engine
recognizes.

**Where mobile changed:** `state/e2e/inventory.engine.test.ts`
`swordWithStats` helper got a `as unknown as
Equipment['statModifiers']` cast at the return site with a
comment naming the intent. The synthetic stat names are
deliberate and stay.

## 8. `MobileNotificationsSlice` requires `toast` at fixture creation (Phase 60f)

**Why:** Same root cause as item 6 — 0.10.2 strict types catch
fixture literals that previously coerced. The
`{ levelUpAcknowledged: false }` literal in navigation tests no
longer satisfies `MobileNotificationsSlice` (which requires
`toast` too).

**Where mobile changed:** `state/e2e/navigation.engine.test.ts`
spreads `DEFAULT_NOTIFICATIONS_SLICE` into the 4 fixture sites
before overriding `levelUpAcknowledged`.

---

## What was *not* in this bump

- `skillLibrary` / `getSkillById` top-level re-export — already
  shipped at engine Phase 50 (`19f2015`) but mobile's Phase 16 row
  remains `[skipped]` pending the new engine release to npm. Stop-gap
  in `state/mocks/combat.skills.fixture.ts` is still load-bearing.
- `PersistenceAdapter` ergonomics — explicitly deferred per engine
  Phase 50 D2. Mobile retains the `wrapDeflectingAdapter` shim in
  `state/store.ts`; no breakage.

## Mirror issues

- `#93` — original Phase 60 parent (this lockfile bump closes it via Phase 60f).
- `#95` — Phase 60a (shipped).
- `#96` — Phase 60d (shipped).
- `#97` — Phase 60b (shipped).
- `#98` — Phase 60c (shipped).
- `#99` — Phase 60e (shipped).
