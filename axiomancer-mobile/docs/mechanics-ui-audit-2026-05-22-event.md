# Mechanics ↔ UI audit — event surface (2026-05-22)

> **HISTORICAL — partially superseded by Phase 137 (2026-06-12).**
> This audit predates the dedicated encounter screens. Since then:
> rest / gathering / loot-cache / hazard / quest events are
> intercepted and launch minigames (they never reach the event modal),
> `EVENT_ART_SLUGS` shrank to the five modal-reachable slugs
> (encounter / boss / interaction-generic / village / cutscene), and
> EventGate routes paced kinds to `/dialogue`, `/village`,
> `/cutscene`. Read row-level claims against today's code.

> Filed by `/iterate` ([4.0] AUDIT row, oversight 27th).
> Sibling of `mechanics-ui-audit-2026-05-21-combat.md` —
> same template, applied to the event/dialogue/encounter
> shell. Scope: `state/presenters/event.engine.ts`,
> `state/presenters/event-assets.ts`,
> `components/EventGate.tsx`,
> `components/event/EncounterModalOverlay.tsx`,
> `app/event/index.tsx`, `state/actions.ts` event-action
> code (`pickEventChoiceAction`,
> `resolveCurrentMapEventAction`, `dismissEventAction`).

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | `selectHasActiveEvent` mid-combat gate | MOBILE-ONLY (Spec 08 Q4) |
| 2 | `selectHasActivePacedEvent` vs `selectHasActiveCombatPrelude` split | MOBILE-ONLY (Phase 40 architecture) |
| 3 | `EventGate` `useEffect → router.push('/event')` | MOBILE-ONLY (Expo Router policy) |
| 4 | `composeCombatPrelude` reads `(encounter as any).enemies[0]` | **DRIFT** — typing hygiene (`as any` cast over engine shape) |
| 5 | `composeNpcDialogue` indexes choices via `visibleChoices` order | ALIGNED |
| 6 | `composeCombatPrelude` boss FLEE disabled (`enabled: !isBoss`) | ALIGNED (engine flee semantics deferred; mobile-only policy backstops) |
| 7 | `selectEventArtSlug` slug map | MOBILE-ONLY (Spec 08 Q3=B) |
| 8 | `defaultBodyForEvent` fallback copy | MOBILE-ONLY (chrome) |
| 9 | `EncounterModalOverlay` mount predicate (`mode !== 'combat' && !preludeRenderable`) | ALIGNED (Phase 63c fix) |
| 10 | FLEE `-ii morale` subtitle vs engine moral surface | **DRIFT** — UI shows a delta the engine never applies |
| 11 | `extractDialogueConsequences` mapping | ALIGNED |
| 12 | Boss subtitle `BOSS_OMEN_BY_LEVEL` fallback | MOBILE-ONLY (chrome) |

---

## 1. `selectHasActiveEvent` mid-combat gate — MOBILE-ONLY (Spec 08 Q4)

**UI:** `state/presenters/event.engine.ts:203-210`. Returns
`false` whenever `state.combat !== null`, even if a pending
event exists.

**Engine:** has no opinion on whether events can fire during
combat — `resolveMapEvent(state)` runs unconditionally on the
caller's request.

**Verdict:** MOBILE-ONLY (per Spec 08 Q4 = "Future spec"). Mid-
combat events are deferred until a future spec. The mobile-side
gate is the only thing keeping the modal from double-stacking
over the combat surface today.

---

## 2. `selectHasActivePacedEvent` vs `selectHasActiveCombatPrelude` split — MOBILE-ONLY (Phase 40 architecture)

**UI:** `state/presenters/event.engine.ts:228-248`. Two
selectors that partition active events into "paced" (full-
screen `/event` route) and "combat-prelude" (in-place
`EncounterModalOverlay` on the exploration map).

**Engine:** no notion of "paced" vs "combat-adjacent"; only
ResolvedEvent kinds.

**Verdict:** MOBILE-ONLY by design. Phase 40 (2026-05-19)
filed this split after discovering the previous
`selectHasActiveEvent`-only gate caused `EventGate` to push
`/event` even on combat-prelude events, double-mounting the
modal AND the route. The split is correct and documented at
the call sites.

---

## 3. `EventGate` `useEffect → router.push('/event')` — MOBILE-ONLY (Expo Router policy)

**UI:** `components/EventGate.tsx:21-23`. Side-effect-only
component pushes the user into the full-screen `/event` route
when `selectHasActivePacedEvent` becomes true.

**Engine:** no routing.

**Verdict:** MOBILE-ONLY. The push uses `router.push` (not
`replace`) — leaves a back-stack entry to exploration. Today
no test pins this; if a future iterate switches to `replace`
without thought, the user's "go back" behavior after dismissing
an event silently changes.

---

## 4. `composeCombatPrelude` reads `(encounter as any).enemies[0]` — **DRIFT (typing hygiene)**

**UI:** `state/presenters/event.engine.ts:353-358`:
```ts
function composeCombatPrelude(encounter: Encounter, isBoss: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enemy = (encounter as any).enemies[0];
```

**Engine:** `Encounter.enemies: Enemy[]` (engine canonical shape
post-Phase-60b). The cast is defensive against a stale-import
path but the engine type already exposes `.enemies` directly.

**Verdict:** **DRIFT (typing hygiene).** The `as any` cast +
inline disable comment shouldn't be needed — `Encounter` from
`axiomancer-mechanics` typing already carries `.enemies`. Probably
a hold-over from the Phase 60b migration when the field was
new. Behavioral impact: zero today.

**Fix proposal:** drop the cast; let TypeScript narrow
`encounter.enemies[0]` directly. Score `[2.5]`.

---

## 5. `composeNpcDialogue` indexes choices via `visibleChoices` order — ALIGNED

**UI:** `state/presenters/event.engine.ts:442-459`. Calls engine
`visibleChoices(node, ctx)` to get the dialogue choices that
pass quest/flag gating, then assigns `vm.choices[i].id =
String(i)`. The action layer (`state/actions.ts:1037+`) reads
that index back as the lookup key.

**Engine:** Phase 60c flattened `DialogueChoice` — removed
`.id` and `.label`. The canonical user-facing field is
`.text`. There IS no `.id` to use as a stable lookup.

**Verdict:** ALIGNED. The index-as-id pattern is the
canonical post-Phase-60c mobile shim; the engine itself
distinguishes choices by their order in the visible array.
Inline JSDoc cites Phase 60c.

---

## 6. `composeCombatPrelude` boss FLEE disabled (`enabled: !isBoss`) — ALIGNED

**UI:** `state/presenters/event.engine.ts:399`:
`enabled: !isBoss` on the flee choice. Boss encounters get the
KNEEL label (Phase 43 port) with the flee path disabled.

**Engine:** no formal "flee" or "kneel-to-boss" action — the
engine surface is `startCombat(enemy)` only; whether the mobile
caller exposes a flee affordance is a policy decision.

**Verdict:** ALIGNED. The mobile policy ("boss = no escape, no
luck save") matches the design's chat-1 spec. The engine
deliberately leaves flee semantics out today; mobile owns the
gate. No drift because there's nothing for the gate to drift
from.

---

## 7. `selectEventArtSlug` slug map — MOBILE-ONLY (Spec 08 Q3=B)

**UI:** `state/presenters/event-assets.ts:38-59`. Switch on
engine event.kind → 9 mobile-local art slugs (`encounter`,
`boss`, `rest`, `gathering`, `loot-cache`, `interaction-
generic`, `village`, `cutscene`, `hazard`).

**Engine:** ResolvedEvent has no `art: string` field; the
mapper is the single switch-point for slug derivation. If the
engine ever ships `art: string` directly on ResolvedEvent, the
mapper retires.

**Verdict:** MOBILE-ONLY by Spec 08 Q3=B explicit choice.
Documented in the file header.

---

## 8. `defaultBodyForEvent` fallback copy — MOBILE-ONLY (chrome)

**UI:** `state/presenters/event-assets.ts:66-80`. Kind-keyed
default body strings ("Something stirs.", "A figure waits.",
etc.) used when a `ResolvedEvent` payload's `description` is
absent.

**Engine:** each `MapEventPayload` carries an optional
`description: string` (often empty in the libraries shipping
today).

**Verdict:** MOBILE-ONLY (chrome fallback). Behavior:
`bodyFromPayload` checks `description` and falls through to
this map if missing. The defaults are mobile voice-register
choices (lowercase ritual register).

---

## 9. `EncounterModalOverlay` mount predicate — ALIGNED (Phase 63c fix)

**UI:** `components/event/EncounterModalOverlay.tsx:137`:
`if (mode !== 'combat' && !preludeRenderable) return null;`.
Once mode flips to 'combat' (after the player taps FIGHT), the
overlay stays mounted regardless of vm.kind. Combat-mode
state is tracked in `useCombatMode()`.

**Engine:** no engine state drives mount/unmount — it's pure
UI lifecycle.

**Verdict:** ALIGNED with intent. Phase 63b/c specifically fixed
the regression where event-slice clear (via
`pickEventChoice('fight')`) unmounted the modal mid-combat.
Live-verified during the playtest runbook tick — modal stays
mounted across the prelude→combat transition.

---

## 10. FLEE `-ii morale` subtitle vs engine moral surface — **DRIFT**

**UI:** `state/presenters/event.engine.ts:377-379`:
```ts
const fleeSubtitle = isBoss
    ? 'sealed · no retreat'
    : 'forfeit the path · -ii morale';
```

The non-boss flee shows the player a `-ii morale` cost preview.

**Engine:** `pickEventChoiceAction` (state/actions.ts:1037+)
on a flee choice does NOT decrement `state.moralMeter` (engine
exposes a moral surface, but the mobile flee path only sets
the event slice and routes the user back to exploration —
grep `pickEventChoiceAction` for `moralMeter` and there are
zero hits).

**Verdict:** **DRIFT.** The UI promises a `-ii morale`
penalty the engine never applies. Player taps FLEE, sees the
chrome, fleeing succeeds, morale meter is unchanged. Either:
- (a) wire the morale decrement into the flee action so the
  chrome is honest, or
- (b) drop the `-ii morale` subtitle and replace with a
  honest chrome line (e.g. `'forfeit the path'`).

**Fix proposal (recommended):** option (a). The engine's
moral surface (`state.moralMeter`) exists; mobile already
reads it on the SELF tab via the alignment panel. A 5-line
action-layer change in `pickEventChoiceAction`'s flee branch
gates a moralMeter delta. Score `[4.5]` (impact 6 — player
trust in chrome; ease 7 — small action edit + 1 hermetic
test).

---

## 11. `extractDialogueConsequences` mapping — ALIGNED

**UI:** `state/presenters/event.engine.ts:747+` (function body
not pasted in audit-time read but call site confirmed). Reads
the engine's `DialogueChoice` consequence data and converts to
the mobile `EventConsequence` shape.

**Engine:** `DialogueChoice` carries consequence fields
(currency, items, quest progress, etc.) shipped by the engine
dialogue library.

**Verdict:** ALIGNED on read pattern; the mapping is the canonical
mobile presenter of engine consequences. Not deeply audited
this tick — flagging for a follow-on micro-audit if the
dialogue surface ever shows consequence drift.

---

## 12. Boss subtitle `BOSS_OMEN_BY_LEVEL` fallback — MOBILE-ONLY (chrome)

**UI:** `state/presenters/event.engine.ts:327-333`. Rotating
chrome strings ("first seal · first sigh", etc.) used when the
engine `enemy.description` is empty on a boss prelude.

**Engine:** `Enemy.description` is documented as required but
the library is permissive.

**Verdict:** MOBILE-ONLY (chrome fallback). Defensive against
the documented engine type vs the as-shipped library.

---

## Closing notes

- **Total decisions audited:** 12.
- **DRIFT:** 2 (rows 4, 10). Row 10 is MED (user-trust);
  row 4 is LOW (typing only).
- **MOBILE-ONLY by design:** 6 (rows 1, 2, 3, 7, 8, 12).
- **ALIGNED:** 4 (rows 5, 6, 9, 11).

**Next iterate ticks** (if the user wants the fixes filed):

- `[4.5]` Wire FLEE's `-ii morale` into the engine moralMeter
  on flee dispatch (row 10).
- `[2.5]` Drop the `(encounter as any).enemies[0]` cast (row 4).

**Out of scope for this audit** (queued):
- Exploration surface — separate audit doc.
- Inventory surface — separate audit doc.

**Verification approach:** code-read this tick. Mount/unmount
behavior (row 9) was live-verified during the `[5.9]` playtest
runbook tick (modal stays mounted across the prelude→combat
transition; the play test walked to Crossing and back without
the encounter modal dropping). Future drift sub-rows can be
playtest-verified via the runbook.
