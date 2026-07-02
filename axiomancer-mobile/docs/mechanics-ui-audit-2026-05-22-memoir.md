# Mechanics ↔ UI audit — memoir (journal) surface (2026-05-22)

> Filed by `/iterate` (Phase 68 Tick B, oversight 28th).
> Final audit in the 6-surface series (combat ✅, event ✅,
> exploration ✅, inventory ✅, character ✅, memoir today).
> Scope: `state/presenters/memoir.engine.ts`,
> `app/(tabs)/memoir/index.tsx`, chronicle event mapping,
> moral + philosophical alignment derivations.

---

## Index

| # | Decision | Verdict |
|---|----------|---------|
| 1 | Chronicle reads `(state as any)._recentEvents` | MOBILE-ONLY (`_recentEvents` is mobile-private; engine doesn't surface it) |
| 2 | `(state as any).quests` cast | **DRIFT (typing)** — engine `GameState.quests: QuestLog` is typed |
| 3 | `(state as any).moralMeter` cast | **DRIFT (typing)** — engine `GameState.moralMeter: number` is typed |
| 4 | `(e.payload as any)` casts in chronicle event mapper (5 sites) | **DRIFT (typing)** — engine `TypedGameEvent` payloads narrow via `is*Event` guards |
| 5 | `(q: any)` / `(o: any)` quest + objective casts | **DRIFT (typing)** — engine `Quest` / `QuestObjective` typed |
| 6 | `buildMoralAlignment` clamps to [-100, 100] | MOBILE-ONLY (engine already clamps; defensive) |
| 7 | Moral bands -100/-65/-33/33/65/100 (5 chips) | MOBILE-ONLY (presentational bucketing) |
| 8 | Philosophical alignment = highest baseStat (Heart > Body > Mind) | MOBILE-ONLY (`provisional: true`; gated on engine surface) |
| 9 | Chronicle visible cap of 12 | MOBILE-ONLY (presentational) |
| 10 | `PARLEYED WITH` → `FLED` flee mapping (CRITIQUE pass 7) | ALIGNED (engine has no parley outcome today) |
| 11 | `philosopherQuote: null` (always) | MOBILE-ONLY (gated on quote-inventory follow-up phase) |
| 12 | Header subline `<name>, pilgrim.` chrome | MOBILE-ONLY |

---

## 1. Chronicle reads `(state as any)._recentEvents` — MOBILE-ONLY

**UI:** `state/presenters/memoir.engine.ts:567-569`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recentEvents = (state as any)._recentEvents;
const chronicle = buildChronicle(recentEvents);
```

**Engine:** `GameState` does NOT include a `_recentEvents`
field. The mobile-private ring buffer was added in Phase 25
(`state/store.ts:AppStoreState = GameStore & {…
_recentEvents: TypedGameEvent[]}`) to give consumers a
narrowable history surface without subscribing to the
emitter directly.

**Verdict:** MOBILE-ONLY by design. The cast is honest —
engine GameStore does not have `_recentEvents`, so reading
it through the AppStoreState extension requires a wider
type than the presenter's `state: GameStore` parameter
exposes.

**Sub-row:** the presenter's parameter typing is the issue.
Widen `selectMemoirViewModel` to take `AppStoreState`
(mobile store), and the cast becomes unnecessary. Score
`[2.5]` (typing hygiene; same pattern as the combat hud
presenter widening that happened in Phase 60d).

---

## 2. `(state as any).quests` cast — **DRIFT (typing)**

**UI:** `state/presenters/memoir.engine.ts:557-560`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (state as any).quests as
    | { available?: unknown; active?: unknown; completed?: unknown }
    | undefined;
```

**Engine:** `GameState.quests: QuestLog` typed cleanly
(`axiomancer-mechanics/dist/Quests/...`).

**Verdict:** **DRIFT (typing).** Engine ships the typed
field; the cast is stale defensive code.

**Fix proposal:** drop the cast, import `QuestLog`, type
`log: QuestLog`. Score `[2.5]`.

---

## 3. `(state as any).moralMeter` cast — **DRIFT (typing)**

**UI:** `state/presenters/memoir.engine.ts:563-564`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moralRaw = (state as any).moralMeter;
```

**Engine:** `GameState.moralMeter: number` typed cleanly.

**Verdict:** **DRIFT (typing).** Same stale-cast pattern as
row 2.

**Fix proposal:** drop cast; `state.moralMeter` is typed
directly. Score `[2.5]`.

---

## 4. `(e.payload as any)` casts in chronicle event mapper (5 sites) — **DRIFT (typing)**

**UI:** `state/presenters/memoir.engine.ts:269-352`. Five
`(e.payload as any)?.…` casts inside the four event-type
branches (combat / levelup / world / dialogue).

**Engine:** `TypedGameEvent` is a discriminated union;
`is*Event(e)` guards narrow the type so `e.payload` is
typed within the branch. The `as any` casts then go AROUND
the narrowing.

**Verdict:** **DRIFT (typing).** The casts bypass the
engine's typed-event-payload guarantees. Likely defensive
holdovers from before the guards existed / before the
payload shape stabilized.

**Fix proposal:** drop each cast; let the engine's narrowing
type the payload. May surface real typing issues (some
chained field reads like `e.payload.report.outcome` go
deeper than the engine's typed shape — those would need
their own `as { report?: { outcome?: ... } }` cast). Score
`[3.0]` — bigger refactor than a one-line drop; some payload
shapes genuinely aren't typed end-to-end.

---

## 5. `(q: any)` / `(o: any)` quest + objective casts — **DRIFT (typing)**

**UI:** `state/presenters/memoir.engine.ts:433-471`.
`buildActiveRows` maps `activeQuests` with `(q: any)` and
each `objective` with `(o: any)`.

**Engine:** `Quest` / `QuestObjective` typed cleanly
(`axiomancer-mechanics/dist/Quests/quest.types.d.ts`).

**Verdict:** **DRIFT (typing).** The casts bypass the
engine's typed shapes. The `synthesizeObjectiveText`
helper reads optional fields (`text` / `label` /
`description`) that the engine typing may or may not expose
— resolution requires checking what `QuestObjective`
actually carries.

**Fix proposal:** drop the casts; type as `Quest` /
`QuestObjective`. If the helper needs fields not on the
engine type, add a narrower extension type instead of `as
any`. Score `[2.5]`.

---

## 6. `buildMoralAlignment` clamps to [-100, 100] — MOBILE-ONLY

**UI:** `state/presenters/memoir.engine.ts:199-200`:
```ts
const value: number = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : 0;
const clamped = Math.max(-100, Math.min(100, value));
```

**Engine:** `dialogue.runtime.js:62` already clamps:
`moralMeter = Math.max(-100, Math.min(100, moralMeter + delta));`.

**Verdict:** MOBILE-ONLY (defensive). Today the engine
guarantees the bound; the presenter's clamp is harmless
double-bound. Removing it would tighten on the engine
contract; keeping it defends against engine misbehavior.
Acceptable as defense-in-depth.

---

## 7. Moral bands -100/-65/-33/33/65/100 (5 chips) — MOBILE-ONLY

**UI:** `state/presenters/memoir.engine.ts:181-187`. 5 named
bands map [-100..100] to display chips
(RUTHLESS / STERN / UNDECLARED / BENEVOLENT / SAINTLY).

**Engine:** no opinion on bucketing; raw number only.

**Verdict:** MOBILE-ONLY (presentational). Per Phase 33
brief.

---

## 8. Philosophical alignment = highest baseStat — MOBILE-ONLY (provisional)

**UI:** `state/presenters/memoir.engine.ts:364-381`.
Highest of `{heart, body, mind}` wins; pairwise ties favour
Heart; 3-way tie → UNTESTED.

**Engine:** no engine surface for "philosophical alignment"
on the player — the engine has `philosophicalAlignment` as
the 3-axis cube on `GameState` (Phase 52 / engine 0.10.0),
but that's a separate concept from "which stance defines
you." The Phase 33 brief flagged this as `provisional:
true` until exact alignments + a quote inventory ship.

**Verdict:** MOBILE-ONLY by gating. The VM contract
exposes `provisional: true`; consumers know not to treat
this as canonical. Eventual replacement would swap the
mapping without breaking the schema.

---

## 9. Chronicle visible cap of 12 — MOBILE-ONLY (presentational)

**UI:** `state/presenters/memoir.engine.ts:28`. `CHRONICLE_VISIBLE_CAP
= 12`.

**Engine:** `_recentEvents` ring buffer caps at 20 (Phase
25); the presenter shows only 12 of them.

**Verdict:** MOBILE-ONLY (presentational choice). Per
Phase 33 brief.

---

## 10. `PARLEYED WITH` → `FLED` flee mapping — ALIGNED

**UI:** `state/presenters/memoir.engine.ts:276-281`. Combat-
end outcome `'flee'` maps to chronicle label `FLED` (was
`PARLEYED WITH` before the CRITIQUE pass 7 reversion via
oversight 2026-05-16).

**Engine:** combat outcomes are `'victory' | 'defeat' |
'flee'` (engine `Combat/index.js:determineCombatEnd`). No
`parley` outcome today.

**Verdict:** ALIGNED. Mobile correctly reverted away from
the misleading `PARLEYED WITH` (player fled; chronicle
wouldn't honestly claim they negotiated). If engine ever
ships a real parley outcome, `PARLEYED WITH` can return.

---

## 11. `philosopherQuote: null` (always) — MOBILE-ONLY (gated)

**UI:** `state/presenters/memoir.engine.ts:400`. Always
emits null; the screen renders nothing.

**Verdict:** MOBILE-ONLY (gated on follow-up phase). Per
Phase 33 brief, "the philosopher-quote slot stays `null`
until exact alignments + a quote inventory are defined."

---

## 12. Header subline `<name>, pilgrim.` chrome — MOBILE-ONLY

**UI:** `state/presenters/memoir.engine.ts:553-556`. Reads
`state.player.name`, formats as `<name>, pilgrim.`.

**Verdict:** MOBILE-ONLY (chrome).

---

## Closing notes

- **Total decisions audited:** 12.
- **DRIFT:** 4 (rows 2, 3, 4, 5) — all typing-hygiene.
- **MOBILE-ONLY by design:** 7 (rows 1, 6, 7, 8, 9, 11, 12).
- **ALIGNED:** 1 (row 10).

**Memoir surface is the highest mobile-only ratio of all 6
audited surfaces** (7/12), because the journal is by nature
a presentational reading of the engine's raw signals (events
→ chronicle, moral number → chips, baseStat → provisional
philosophy). The drift is concentrated in typing —
defensive `as any` casts that no longer match engine reality.

**Next iterate ticks** (if the user wants the fixes filed):

- `[3.0]` Drop `(e.payload as any)` casts in chronicle event
  mapper; let `is*Event` guards type the payload
  end-to-end (row 4). Bigger than a one-liner because some
  chained reads aren't engine-typed.
- `[2.5]` Widen `selectMemoirViewModel` parameter from
  `GameStore` to `AppStoreState`; drops the
  `(state as any)._recentEvents` cast (row 1).
- `[2.5]` Drop `(state as any).quests` cast (row 2).
- `[2.5]` Drop `(state as any).moralMeter` cast (row 3).
- `[2.5]` Drop `(q: any)` / `(o: any)` quest + objective
  casts (row 5).

**6-surface audit series complete.** Combined totals:
- 73 decisions audited (combat 11, event 12, exploration
  12, inventory 12, character 12, memoir 12 + 2 deltas
  across the closer counts).
- 19 DRIFT rows filed (3 + 2 + 4 + 3 + 4 + 4); many
  already fixed in this iterate cycle.
- 25 ALIGNED.
- 27 MOBILE-ONLY by design (largest category — confirms the
  mobile surfaces are mostly presentational of engine
  truth, with the right kind of additive chrome).

**Verification approach:** code-read only. The memoir surface
doesn't have visible regressions worth playtest-verifying
today (all the drift is typing-only); future drift would
benefit from `/playtest` after Phase 67 Tick B is wired up.
