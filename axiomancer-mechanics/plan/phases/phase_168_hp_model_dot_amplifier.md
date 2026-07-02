# Phase 168 — HP-model DoT amplifier ("build-then-detonate")

> **Status:** pending  
> **Filed:** oversight 2026-06-29 (T: promote HP-model successors)  
> **Doctrine:** DOCTRINE-CENTRAL — amplify rewards building a DoT board,
> then cashing in without losing the ongoing tick.

---

## Outcome

Ship the `amplify` verb class: a card mechanic that reads the enemy's current
pending DoT total (via `getPendingDotTotal`) and fires it × `multiplier` as a
one-time HP-damage burst — WITHOUT consuming the DoT effects (they keep
ticking). Author 2 Amplifier cards. Emit `amplify-detonated` to the event log;
credit in `buildCombatSummary` (mechanicBurstFraction); register
`combat.amplifyMultiplier` + `combat.amplifyBurstCap` as `/combat-tuning`
tunables. Add new spec `specs/26b-hp-model-amplifier.md`.

---

## Source spec

No prior spec file exists for this mechanic. The build-plan row IS the spec
source. All open questions resolved below under "Decisions made upfront."

---

## Implementation units

### Unit 1 — Type: `amplify` CardSpecialMechanic

**File:** `src/Cards/types.ts`

Add to the `CardSpecialMechanic` union:

```ts
/** AMPLIFY — read the foe's pending DoT total (getPendingDotTotal) × multiplier
 *  and fire as a one-time HP burst. DoT effects are NOT consumed — they keep
 *  ticking. Capped at AMPLIFY_BURST_CAP. Combat-engine owned; skill engine no-ops it. */
| { kind: 'amplify'; multiplier: number }
```

Commit: `feat(cards): amplify CardSpecialMechanic type`

---

### Unit 2 — Constants + engine dispatch

**File:** `src/Combat/effects.ts`

Add two exported constants alongside `RUPTURE_BURST_CAP`:

```ts
/** Default multiplier applied to the pending DoT total for an AMPLIFY burst. */
export const AMPLIFY_DEFAULT_MULTIPLIER = 1.5;
/** Hard cap on a single AMPLIFY detonation. */
export const AMPLIFY_BURST_CAP = 60;
```

**File:** `src/Combat/combat.engine.ts`

In `playBottomAction`, after the RUPTURE block and before the COMPOUND block,
add the AMPLIFY mechanic handler:

```ts
const amplifyMech = mechs.find(m => m.kind === 'amplify') as
    { kind: 'amplify'; multiplier: number } | undefined;
if (amplifyMech) {
    const pending = getPendingDotTotal(state.enemy).total;
    const burst = Math.min(
        AMPLIFY_BURST_CAP,
        Math.round(pending * amplifyMech.multiplier * mult * vulnMult),
    );
    if (burst > 0) {
        enemy = applyDamage(enemy, burst);
        mechanicDamage += burst;
        directDamage += burst;
        attribution = recordAttribution(attribution, card.id, card.name, null, burst);
    }
    events.push({ kind: 'amplify-detonated', amount: burst, pendingDot: pending });
}
```

Key differences from RUPTURE:
- Does NOT call `consumeDotEffects` — DoT keeps ticking
- Uses `amplifyMech.multiplier` (not 1 + bonusPct)
- Capped at `AMPLIFY_BURST_CAP` (separate constant)

**Import:** Add `AMPLIFY_BURST_CAP` to the import from `./effects`.

Commit: `feat(combat): amplify engine dispatch + AMPLIFY constants`

---

### Unit 3 — CombatEvent type: `amplify-detonated`

**File:** `src/Combat/combat.encounter.types.ts` (or wherever `CombatEvent` is defined)

Add to the `CombatEvent` union:

```ts
| { kind: 'amplify-detonated'; amount: number; pendingDot: number }
```

This is needed before Unit 2 (engine uses it) so author in the same commit as
Unit 2 or ahead of it.

---

### Unit 4 — Sim credit: `amplify-detonated` in `runOneEncounter`

**File:** `src/Combat/combat.encounter.sim.ts`

In `runOneEncounter`, the existing mechanic-burst attribution loop:

```ts
if (ev.kind === 'rupture-detonated') mechanicBurstDamage += ev.amount;
if (ev.kind === 'execute-fired') mechanicBurstDamage += ev.amount;
if (ev.kind === 'compound-hit') mechanicBurstDamage += ev.amount;
if (ev.kind === 'conclude-hit') mechanicBurstDamage += ev.amount;
```

Add:

```ts
if (ev.kind === 'amplify-detonated') mechanicBurstDamage += ev.amount;
```

This automatically flows into `mechanicBurstFraction` in `CombatSimStats`.
The sim policy `bestCard` may also want a heuristic for the amplify card
(play when `pendingDot >= 8`), similar to the rupture threshold of 12.

Commit bundled with Unit 2/3 or as a follow-on in the same PR.

---

### Unit 5 — Tunable registry entries

**File:** `src/Tuning/tunable.registry.ts`

Add two entries after the `combat.ruptureBurstCap` entry:

```ts
{
    id: 'combat.amplifyMultiplier',
    kind: 'multiplier',
    category: 'effect',
    file: COMBAT_EFFECTS_FILE,
    locator: { exportName: 'AMPLIFY_DEFAULT_MULTIPLIER' },
    min: 0.5, max: 3, step: 0.25,
    magnitudeCapPct: 0.5,
    tags: ['effect', 'damage', 'status-effect', 'amplify', 'dot', 'engagement'],
    rationale: 'Multiplier applied to the pending DoT total for an AMPLIFY burst. Higher = bigger payoff for a built-up board.',
    effect: { difficulty: 'lowers', engagement: 'raises' },
},
{
    id: 'combat.amplifyBurstCap',
    kind: 'constant',
    category: 'effect',
    file: COMBAT_EFFECTS_FILE,
    locator: { exportName: 'AMPLIFY_BURST_CAP' },
    min: 20, max: 150, step: 5,
    magnitudeCapPct: 0.5,
    tags: ['effect', 'damage', 'status-effect', 'amplify', 'dot', 'engagement'],
    rationale: 'Hard cap on a single AMPLIFY detonation — keeps the burst meaningful without one-shotting bosses.',
    effect: { difficulty: 'lowers', engagement: 'raises' },
},
```

Note: the tunable registry references the constant name (`AMPLIFY_DEFAULT_MULTIPLIER`)
but the card authoring uses `amplifyMech.multiplier` from the card definition — the
per-card `multiplier` field can override the default; the tunable tunes the constant
that authors use as the default. This mirrors how RUPTURE's `bonusPct` works.

Commit: `feat(tuning): amplify multiplier + burst-cap tunables`

---

### Unit 6 — Amplifier cards (1–2)

**File:** `src/Cards/cards.library.ts`

Author 2 Amplifier cards, modelled on `resonanceRupture` and
`mountingContradictions`:

**Card 1 — "Crescendo of Suffering" (Heart, Tier 2)**

```ts
const crescendoOfSuffering: Card = {
    id: 'crescendo-of-suffering',
    name: 'Crescendo of Suffering',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You do not interrupt the accumulation — you let it reach its peak, ' +
        'then conduct it. Every wound keeps bleeding, every poison keeps ' +
        'spreading. You simply turned the volume up.',
    tier: 2,
    resourceCost: { heart: 2 },
    targetType: 'enemy',
    basePower: 3,
    scalingStat: 'heart',
    specialMechanics: [{ kind: 'amplify', multiplier: 1.5 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-06-29',
    tags: ['status-effect', 'amplify', 'dot', 'mid-game'],
};
```

**Card 2 — "The Inevitable" (Mind, Tier 2)**

```ts
const theInevitable: Card = {
    id: 'the-inevitable',
    name: 'The Inevitable',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Conclusion is not inflicted — it is observed. You have read every ' +
        'effect to its endpoint, added them together, and delivered the sum ' +
        'as a single moment of clarity.',
    tier: 2,
    resourceCost: { mind: 2, body: 1 },
    targetType: 'enemy',
    basePower: 2,
    scalingStat: 'mind',
    specialMechanics: [{ kind: 'amplify', multiplier: 2.0 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-06-29',
    tags: ['status-effect', 'amplify', 'dot', 'mid-game'],
};
```

Wire both into the export array at the bottom of `cards.library.ts` and into
`cardLibrary` (the exported array).

Commit: `feat(cards): author crescendo-of-suffering + the-inevitable amplifier cards`

---

### Unit 7 — Barrel exports

**File:** `src/Combat/index.ts`

Add `AMPLIFY_DEFAULT_MULTIPLIER`, `AMPLIFY_BURST_CAP` to the exports from
`./effects`.

**File:** `src/index.ts`

Add `AMPLIFY_DEFAULT_MULTIPLIER`, `AMPLIFY_BURST_CAP` to the root barrel
alongside `RUPTURE_BURST_CAP`, `COMPOUND_COUNT_CAP`.

**File:** `scripts/public-surface.expected.json`

Run `node scripts/snapshot-public-surface.mjs` after build to refresh the
fixture (2 new entries expected).

Commit: `feat(barrel): export AMPLIFY_DEFAULT_MULTIPLIER + AMPLIFY_BURST_CAP`

---

### Unit 8 — Hermetic e2e tests

**File:** `src/Combat/e2e/amplifier.engine.test.ts`

Minimum 4 hermetic cases (no `Math.random`, seeded or deterministic setup):

1. **amplify-zero**: enemy has no DoT effects → `amplify-detonated` fires with
   `amount: 0`, no HP lost.
2. **amplify-burst**: enemy has 2 DoT effects with known ticks → pending total
   computed → burst = floor(total × multiplier), capped. Assert enemy HP
   dropped by burst amount. Assert DoT effects remain on enemy (NOT consumed).
3. **amplify-cap**: pending total × multiplier > `AMPLIFY_BURST_CAP` → burst
   clamped to cap.
4. **amplify-sim-credit**: `runOneEncounter` with an amplifier-carrying loadout
   credits `mechanicBurstDamage` from `amplify-detonated` events.

Commit bundled with engine unit or as a follow-on.

---

### Unit 9 — Spec file

**File:** `specs/26b-hp-model-amplifier.md`

Minimal spec (one page), covering:
- Mechanic description (read-not-consume pending DoT × multiplier → HP burst)
- Acceptance checklist (mirroring the DoD below)
- Authored card table

Commit: `specs: 26b-hp-model-amplifier — DoT amplifier spec`

---

### Unit 10 — Docs update

**File:** `docs/combat.md`

Add a row to the Spec 25 / 26b API table for `AMPLIFY_DEFAULT_MULTIPLIER` and
`AMPLIFY_BURST_CAP`. Add a brief paragraph under the "build-around mechanics"
section (near RUPTURE) explaining AMPLIFY vs RUPTURE:

> **AMPLIFY** — reads the foe's pending DoT total and fires a burst × multiplier,
> WITHOUT consuming the effects. Use when the strategy is "keep DoT ticking
> while cashing in on the stack size."

---

## Decisions made upfront — DO NOT ASK

1. **AMPLIFY does NOT consume DoT** — key design distinction from RUPTURE. The
   "build-then-detonate" fantasy requires DoT to keep ticking after the burst.

2. **Use `getPendingDotTotal(state.enemy).total`** — same as RUPTURE; this is
   the correct Hazard-engine primitive. The build-plan mentions `analyzeDotErosion`
   but that is the legacy combat function; `getPendingDotTotal` is the HP-model
   equivalent already used by the engine.

3. **`AMPLIFY_DEFAULT_MULTIPLIER = 1.5`, `AMPLIFY_BURST_CAP = 60`** — weaker
   than RUPTURE (cap 80) by default because AMPLIFY doesn't forfeit the ongoing
   DoT tick; the burst is a bonus, not a swap. The tunable lets `/combat-tuning`
   adjust.

4. **Two cards, not one** — the build plan says "1–2 Amplifier cards." Two is
   richer for deck variety. Card 1 (Heart, Tier 2, cost 2H, mult 1.5, level 6)
   is the entry-level version; Card 2 (Mind, Tier 2, cost 2M+1B, mult 2.0,
   level 10) is the payoff version.

5. **`buildCombatSummary` credit via `mechanicBurstFraction`** — amplify bursts
   flow into `mechanicBurstDamage` in `runOneEncounter`, which already feeds the
   `mechanicBurstFraction` field. No new field needed.

6. **`CombatEvent` union extended with `amplify-detonated`** — same approach as
   `rupture-detonated`. No CLI or mobile-facing doc change required beyond the
   combat.md API table row; mobile reads the event log for display.

7. **Sim policy heuristic** — the `bestCard` function in `combat.encounter.sim.ts`
   should play an amplify card when `pendingDot >= 8` (lower threshold than
   RUPTURE's 12, since amplify doesn't burn the DoT). This avoids a zero burst
   in empty-board scenarios.

8. **No new `CombatVerbClass`** — amplify is a `direct-damage` verb class on
   the card (the burst is direct damage). The `CardEffectKind` stays `none`
   (or if the card also applies a DoT, `dot`). Both authored cards do NOT apply
   an effect — they're pure amplifier bursts.

9. **Spec file path** — `specs/26b-hp-model-amplifier.md` as specified by the
   build-plan row. "26b" is the in-flight depth-spec namespace.

10. **No bearer of legacy `sig-rallying-blow` id** — that id was renamed in a
    prior phase (Conclusion). No collision.

---

## Verify gate

```bash
npm run verify   # type-check + test + build
npm run deploy:check
```

All new exports must appear in `scripts/public-surface.expected.json` (refresh
with `node scripts/snapshot-public-surface.mjs`).

---

## Commit body template

```
feat(combat): phase 168 — HP-model DoT amplifier ("build-then-detonate")

- Add `amplify` CardSpecialMechanic: reads pending DoT × multiplier, fires
  as HP burst WITHOUT consuming effects (DoT keeps ticking)
- AMPLIFY_DEFAULT_MULTIPLIER=1.5, AMPLIFY_BURST_CAP=60 (weaker than RUPTURE
  by design — burst is a bonus, not a swap)
- Author crescendo-of-suffering (heart, 1.5×) + the-inevitable (mind, 2.0×)
- Emit amplify-detonated event; credit in mechanicBurstFraction sim stat
- Register combat.amplifyMultiplier + combat.amplifyBurstCap as tunables
- Hermetic e2e: 4 cases (zero-dot, burst, cap, sim-credit)
- Spec: specs/26b-hp-model-amplifier.md; docs/combat.md API table updated
```

---

## Definition of Done

- [ ] `CardSpecialMechanic` union includes `{ kind: 'amplify'; multiplier: number }`
- [ ] `AMPLIFY_DEFAULT_MULTIPLIER` + `AMPLIFY_BURST_CAP` exported from `src/Combat/effects.ts`
- [ ] `playBottomAction` handles `amplify`: reads `getPendingDotTotal` × multiplier, does NOT consume DoT, emits `amplify-detonated`
- [ ] `amplify-detonated` added to `CombatEvent` union
- [ ] `runOneEncounter` credits `amplify-detonated` in `mechanicBurstDamage`
- [ ] Sim policy plays amplify when `pendingDot >= 8`
- [ ] 2 amplifier cards authored + wired into `cardLibrary`
- [ ] `combat.amplifyMultiplier` + `combat.amplifyBurstCap` registered in tunable registry
- [ ] Both constants re-exported from `src/Combat/index.ts` + `src/index.ts`
- [ ] `scripts/public-surface.expected.json` refreshed
- [ ] Hermetic e2e: ≥4 cases in `amplifier.engine.test.ts` (zero, burst, cap, sim-credit)
- [ ] `specs/26b-hp-model-amplifier.md` written and accepted
- [ ] `docs/combat.md` API table updated
- [ ] `npm run verify` green
- [ ] `npm run deploy:check` green

---

## Follow-ups (out of scope)

- `/combat-tuning` pass to measure amplify impact on `mechanicBurstFraction`
  and `dotHpFraction` (amplify should shift the split toward mechanic bursts
  without reducing DoT fraction significantly — DoT still ticks)
- Mobile UI: display `amplify-detonated` event with the pendingDot reading
  shown (consumer reads the event log)
- A third amplify card at Tier 3 (philosophical-token gated) once the
  mechanic's feel is confirmed
