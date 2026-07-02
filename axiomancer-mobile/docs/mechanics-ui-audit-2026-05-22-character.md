# Mechanics ↔ UI audit — character (SELF tab) surface (2026-05-22)

> Filed by `/iterate` (Phase 68 Tick A, oversight 28th).
> Fifth audit in the series (combat ✅, event ✅, exploration
> ✅, inventory ✅, character today, memoir next). Scope:
> `state/presenters/character.engine.ts`,
> `app/(tabs)/character/index.tsx`, alignment helpers,
> equipment dock integration.

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | `buildBase` reads `player.baseStats.{heart,body,mind}` | ALIGNED |
| 2 | `buildDerived` reads `player.derivedStats.*` | ALIGNED |
| 3 | `buildSaves` reads `player.nonCombatStats.*` | ALIGNED |
| 4 | `buildEffects` reads `(player as any).effects` | **DRIFT (typing)** |
| 5 | `buildEquipment` uses `firstEquippedPerSlot` (shared helper) | ALIGNED (Phase 67 `[3.5]` refactor) |
| 6 | `buildAlignmentSlice` reads `(state as any).philosophicalAlignment` | **DRIFT (typing — with intentional fallback)** |
| 7 | `luck` reads `player.derivedStats.luck` directly | ALIGNED |
| 8 | `skills: []` (always empty) | MOBILE-ONLY (gated on engine Spec 04 surface) |
| 9 | Slot display order + chrome (`'Accessory'` not `'TRINKET'`) | **DRIFT (chrome inconsistency)** — Inventory uses `'TRINKET'` for the same slot |
| 10 | `buildEffects(player)` called 3x in same return object | **DRIFT (perf / brittleness)** |
| 11 | `subtitle: 'PILGRIM'` hardcoded chrome | MOBILE-ONLY |
| 12 | `emptyEffectsMessage` chrome | MOBILE-ONLY |

---

## 1. `buildBase` reads `player.baseStats.{heart,body,mind}` — ALIGNED

**UI:** `state/presenters/character.engine.ts:166-173`. Destructures
`player.baseStats` and rebuilds as three rows with stable
stance keys.

**Engine:** `Character.baseStats: BaseStats` carries
`{heart, body, mind}`.

**Verdict:** ALIGNED. Direct read.

---

## 2. `buildDerived` reads `player.derivedStats.*` — ALIGNED

**UI:** `state/presenters/character.engine.ts:175-183`. Maps
the engine's nine derived-stat fields to three two-axis rows.

**Engine:** `Character.derivedStats: DerivedStats` with
`{physical,mental,emotional}{Attack,Skill,Defense}` + extras.

**Verdict:** ALIGNED. The comment "guaranteed present after
v1→v2 persistence migration" cites Phase 15.

---

## 3. `buildSaves` reads `player.nonCombatStats.*` — ALIGNED

**UI:** `state/presenters/character.engine.ts:185-197`. Reads
six save/test fields from `player.nonCombatStats`.

**Engine:** `Character.nonCombatStats: NonCombatStats`.

**Verdict:** ALIGNED (post-Phase-15 migration).

---

## 4. `buildEffects` reads `(player as any).effects` — **DRIFT (typing)**

**UI:** `state/presenters/character.engine.ts:200-201`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const effects: ActiveEffect[] = (player as any).effects ?? [];
```

**Engine:** `Character.effects: ActiveEffect[]` is typed
directly on the Character interface (per
`axiomancer-mechanics/dist/Character/types.d.ts`).

**Verdict:** **DRIFT (typing).** The `as any` cast bypasses
the engine's typed `effects` field. Likely a holdover from
when the field was added late. Mirror of the casts already
dropped in `state/actions.ts` and the event presenter.

**Fix proposal:** drop the cast; read `player.effects ?? []`
directly. Score `[2.5]` — typing hygiene, no behavior change.

---

## 5. `buildEquipment` uses `firstEquippedPerSlot` — ALIGNED (Phase 67 `[3.5]` refactor)

**UI:** `state/presenters/character.engine.ts:217-225`. Reads
from the shared `firstEquippedPerSlot` helper at
`state/selectors/equipment.ts`.

**Verdict:** ALIGNED. The earlier inline scan was refactored
during the `[3.5]` first-equipped-per-slot fix; this
consumer now routes through the single source of truth for
the worn-state convention.

---

## 6. `buildAlignmentSlice` reads `(state as any).philosophicalAlignment` — **DRIFT (typing — with intentional fallback)**

**UI:** `state/presenters/character.engine.ts:244-247`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (state as any).philosophicalAlignment;
const alignment = (raw && typeof raw === 'object') ? raw : defaultAlignment();
```

**Engine:** `GameState.philosophicalAlignment: PhilosophicalAlignment`
(engine 0.10.0+, Phase 51 migration v2→v3 backfills the field on
old saves).

**Verdict:** **DRIFT (typing).** The cast is intentional —
the comment explains the fallback covers sparse test
fixtures that inject `{player} as never` without
`philosophicalAlignment`. But the comment's premise is wrong:
post-Phase-51, every persisted save HAS the field, and
hermetic test fixtures should declare it. The defensive
fallback is dead code.

**Fix proposal:** read `state.philosophicalAlignment ??
defaultAlignment()` directly (engine type makes it
non-optional, but ?? still acts as a final safety). Drop the
cast. Score `[2.5]` — typing hygiene; one-line presenter
edit.

Sub-row note: if a test fixture surfaces a real failure
mode, the engine type's non-optional contract is what's
wrong — promote that to a sub-row.

---

## 7. `luck` reads `player.derivedStats.luck` directly — ALIGNED

**UI:** `state/presenters/character.engine.ts:263`. Single
property read; no cast.

**Engine:** `DerivedStats.luck: number`.

**Verdict:** ALIGNED.

---

## 8. `skills: []` (always empty) — MOBILE-ONLY (gated on engine surface)

**UI:** `state/presenters/character.engine.ts:280`. Returns
an empty array unconditionally.

**Engine:** there's no public `Character.knownSkills` read
yet (engine Spec 04 work). The presenter VM has a typed
`skills: CharacterSkillRow[]` field but never populates it.

**Verdict:** MOBILE-ONLY by gating. The VM contract is in
place; the engine read is pending. File header doc cites
"Skills deferred to engine Spec 04." Same pattern as the
many `[skipped]` Block II rows in the build plan.

---

## 9. Slot display order + chrome (`'Accessory'` not `'TRINKET'`) — **DRIFT (chrome inconsistency)**

**UI:** `state/presenters/character.engine.ts:153-164`. The
character presenter labels equipment slots Title-case
(`'Head', 'Body', 'Hands', 'Feet', 'Weapon', 'Armor',
'Accessory'`).

**Inventory presenter sibling:** `inventory.engine.ts:252-260`
labels the same accessory slot as `'TRINKET'` (Phase 32 sub-
tick E port; chat 1's "HEAD, WEAPON, HANDS, FEET, BODY,
ARMOR, TRINKET").

**Verdict:** **DRIFT (chrome inconsistency).** Player sees
`Accessory` on the SELF tab Equipment block, then
`TRINKET` on the SATCHEL tab Equipment Dock — for the same
slot. Inconsistent vocabulary across the same player's
interaction with their gear.

**Fix proposal:** align the SELF Equipment block to use
`TRINKET` (matches the design source per the inventory
audit row 12 + chat 1 spec). Single-line presenter edit.
Score `[3.0]` — visible cross-tab inconsistency.

---

## 10. `buildEffects(player)` called 3x in same return object — **DRIFT (perf / brittleness)**

**UI:** `state/presenters/character.engine.ts:277, 290, 291`:
```ts
effects: buildEffects(player),
...
a11y: {
    effects: buildEffects(player).length > 0
        ? `${buildEffects(player).length} active effects`
        : 'No active effects',
}
```

**Verdict:** **DRIFT (perf / brittleness).** Three separate
calls when one would suffice. Each call walks `player.effects`
and runs `lookupEffect(...)` per entry. Today the effects
array is small (≤4 active per Spec 03), so the perf cost is
negligible — but the redundancy is wasteful + brittle. If
`buildEffects` is ever extended (e.g. to read engine library
metadata that's expensive), this surfaces as a real cost.

**Fix proposal:** lift to `const effects = buildEffects(player);`
once, then reference `effects.length` in the a11y branch.
Score `[2.5]` — refactor.

---

## 11. `subtitle: 'PILGRIM'` hardcoded chrome — MOBILE-ONLY

**UI:** `state/presenters/character.engine.ts:269`. Single
literal.

**Engine:** no concept of player "role" or "subtitle".

**Verdict:** MOBILE-ONLY (chrome). Voice register choice.

---

## 12. `emptyEffectsMessage` chrome — MOBILE-ONLY

**UI:** `state/presenters/character.engine.ts:278`. `'none at
hand.'` — lowercase ritual register.

**Verdict:** MOBILE-ONLY (chrome).

---

## Closing notes

- **Total decisions audited:** 12.
- **DRIFT:** 4 (rows 4, 6, 9, 10). Row 9 is the most
  visible (cross-tab vocabulary mismatch); rows 4 / 6 / 10
  are typing / refactor hygiene.
- **MOBILE-ONLY by design:** 3 (rows 8, 11, 12).
- **ALIGNED:** 5 (rows 1, 2, 3, 5, 7).

**Next iterate ticks** (if the user wants the fixes filed):

- `[3.0]` Align character Equipment slot label `'Accessory'`
  → `'Trinket'` to match inventory dock + chat 1 spec
  (row 9).
- `[2.5]` Drop `(player as any).effects` cast (row 4).
- `[2.5]` Drop `(state as any).philosophicalAlignment` cast
  + fallback (row 6).
- `[2.5]` Lift `buildEffects(player)` to a single call (row
  10).

**Out of scope for this audit** (queued for Phase 68 Tick B):
- Memoir surface (journal / chronicle / philosopher-quote
  slot).

**Verification approach:** code-read only. Cross-tab visual
mismatch (row 9) would be easily live-verified via
`/playtest` — file a follow-up if the user wants the
visual confirmation.
