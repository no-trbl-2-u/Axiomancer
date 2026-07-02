# Rest Encounter ("The Night Watch") — Mobile UX Source of Truth

> Derived from `app/rest/index.tsx`, `state/presenters/rest.engine.ts`,
> and `state/rest/store-actions.ts` as of 2026-06-15.
>
> Mechanics rules (engine, posture dials, watch bag, tuning) live in the mechanics repo:
> - `docs/encounters/rest.md` — rules source of truth

---

## Screen entry

**Route:** `app/rest/index.tsx`
**Gate:** `RestGate` in the root layout watches `vm.active`
(`selectHasActiveRest`). Navigation fires when a Rest session is created;
the screen auto-exits when the session clears.

No swipe-back gesture (`gestureEnabled: false`).

---

## Session phases and layer map

The presenter (`selectRestVM`) maps engine phase to a screen layer.

| Engine phase | Screen state | Primary overlay |
|---|---|---|
| `posture` | Rest screen | PostureSelectOverlay |
| `watch` | Watch screen | WatchCardOverlay |
| `outcome` | — | DawnOverlay |
| `done` | *(auto-exit)* | — |

---

## Posture select overlay

Shown at the `posture` phase. Three options stacked full-width:

| Key | Name | Heal hint |
|---|---|---|
| `deep` | Sleep Deep | ≈ 40% VITAE |
| `doze` | Doze Light | ≈ 30% VITAE |
| `watch` | Keep Watch | ≈ 20% VITAE |

Each `RestPostureVM` shows: name, desc, flavor, healHint. CTA fires
`chooseRestPosture(key)`.

---

## Watch screen

The main night surface, rendered during the `watch` phase. Shows:

1. **Warmth bar** — current `warmth` / `warmthMax` (4). Filled pips.
2. **Firewood count** — `wood` remaining (starts at 2).
3. **Comfort counter** — `comfort` accumulated.
4. **Keepsakes list** — `keepsakes[]` (held dream items).
5. **Watch progress** — `watch` / `watchesPerNight` (3).

---

## Watch card overlay

Fires for each of the three watches. Renders `RestPendingVM`:

- `watch` index and `kind` — the drawn watch slip:
  - `embers` (✶) — fire wants feeding
  - `dream` (☽) — authored dream event
  - `stir` (⚠) — posture-dependent event
  - `still` (◦) — quiet hour
- `title`, `body` — authored copy for the specific event.
- `options: RestOptionVM[]` — choices (Hold/Fade for dream, Feed/Hoard for embers,
  etc.). Each shows label, desc, enabled state, disabled reason if locked.
  CTA fires `chooseRestOption(optionId)`.
- `result: RestResultVM | null` — after an option is chosen:
  - `title`, `body` — result narrative
  - `rolls[]` — die faces if a roll was involved
  - `deltaChips[]` — compact chips: "+1 WARMTH", "−1 FIREWOOD", "+1 COMFORT"
  - `keepsake` — held dream item name (or null)
  - Dismiss → `continueRestWatch()`.

---

## Dawn overlay (DawnOverlay)

Shown at the `outcome` phase. Renders `RestOutcomeVM`:

- Tier label: `RESTORED` / `RESTED` / `MEAGRE`
- `healPercent` — whole-percent heal applied to VITAE
- `cleansed` — flag: lingering effects cleansed (requires dawn warmth ≥ 3)
- `warmth`, `comfort` — dawn totals
- `keepsakes[]` — all held dream items

CTA → `claimRestOutcome()`.

---

## Outcome tiers (as surfaced by mobile presenter)

| Code | Label | Threshold |
|---|---|---|
| `restored` | RESTORED | ≥ 55% max VITAE healed |
| `rested` | RESTED | ≥ 35% |
| `meagre` | MEAGRE | < 35% |

---

## Presenter — RestVM

Entry: `selectRestVM({ rest })` in `state/presenters/rest.engine.ts`.

Key VM sub-shapes:

```typescript
RestPostureVM {
  key                         // 'deep' | 'doze' | 'watch'
  name, desc, flavor
  healHint                    // e.g. "≈ 40% VITAE"
}

RestOptionVM {
  id, label, desc
  enabled
  disabledReason              // null when enabled
}

RestResultVM {
  title, body
  rolls                       // die faces
  deltaChips                  // e.g. ["+1 WARMTH", "−1 FIREWOOD"]
  keepsake                    // string | null
}

RestPendingVM {
  watch                       // 1 | 2 | 3
  kind                        // RestWatchKind: 'embers' | 'dream' | 'stir' | 'still'
  title, body
  options                     // RestOptionVM[]
  result                      // RestResultVM | null
}

RestOutcomeVM {
  tier                        // 'restored' | 'rested' | 'meagre'
  tierLabel
  healPercent                 // whole number
  cleansed
  warmth, comfort
  keepsakes                   // readonly string[]
}
```

Top-level `RestVM`:
```typescript
RestVM {
  active, phase
  posture                     // 'deep' | 'doze' | 'watch' | null
  postures                    // readonly RestPostureVM[] (all 3, always present)
  watch, watchesPerNight      // 3
  warmth, warmthMax           // max = 4
  wood, comfort
  keepsakes                   // readonly string[]
  pending                     // RestPendingVM | null
  outcome                     // RestOutcomeVM | null
}
```

Watch kind glyphs (exported from presenter): `REST_WATCH_GLYPHS`:
- `embers` → `✶`
- `dream` → `☽`
- `stir` → `⚠`
- `still` → `◦`

---

## Store actions

`state/rest/store-actions.ts`:

```
beginRestAction(healFraction?)        ← called by resolveCurrentMapEvent
chooseRestPostureAction(posture)      ← 'deep' | 'doze' | 'watch'
chooseRestOptionAction(optionId)      ← watch choice (hold/fade, feed/hoard, etc.)
continueRestWatchAction()             ← advance past watch result card
claimRestOutcomeAction()              ← apply heal + cleanse + keepsakes, clear session
```

**State restoration:** mobile reverts the engine's passive pre-event heal and lets
only the Rest outcome `healFraction` apply. This prevents double-healing if the
session is abandoned.

Keepsakes held during a dream are banked to persistent `flags` by the claim action.

---

## Tuning reference

All dial values live in `REST_TUNING` (mechanics repo). Current defaults:

| Constant | Value | Effect |
|---|---|---|
| `watchesPerNight` | 3 | Watches per session |
| `warmthStart` | 2 | Initial warmth |
| `warmthMax` | 4 | Warmth ceiling |
| `woodStart` | 2 | Firewood on arrival |
| `healPerWarmth` | 0.04 | Heal fraction per warmth point at dawn |
| `healPerComfort` | 0.05 | Heal fraction per comfort point |
| `cleanseWarmth` | 3 | Warmth required to cleanse lingering effects |
| `restoredAt` | 0.55 | Heal fraction floor for RESTORED tier |
| `restedAt` | 0.35 | Heal fraction floor for RESTED tier |

---

## ADR references

- **ADR-0001** — engine truth boundary: mobile presenter is mapping only; never recomputes rules.
- **ADR-0003** — mobile does not invent mechanics; file issue if the engine is missing something.
