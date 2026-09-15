# Phase 83 — Combat arena backdrop: region-keyed, starting with the coastal village

> Woodcut Codex, V-series follow-up. Depends on V4 (background acquisition
> pipeline) and V5 (`ScreenBg` art slot). Promoted via `/oversight`
> 2026-09-15 from `PHASE_CANDIDATES.md` [score 6.0], absorbing the
> [score 4.5] capital cross-reference row. Brief generated 2026-09-15 by
> `/ship-a-phase` §9.

## Outcome

The live hazard-combat arena backdrop — the full-bleed scene behind the foe
in `CombatCombatantPane` — becomes region-keyed instead of one static plate.
The coastal village (the Drowned Parish, the game's opening region) gets its
own arena: a new public-domain Doré dock plate, acquired through the V4
pipeline with its licence read from the source. Every other region keeps the
existing ruined-city plate as the honest fallback — V5 explicitly deferred
"arena plates beyond the one that exists" to a per-plate curation follow-up,
and this phase is that follow-up's first plate, not a rewrite of the slot.

## What exists, measured

- `CombatCombatantPane.tsx:50` hardcodes `ARENA_BG =
  require('@/assets/images/combat/arena-ruined-city.jpg')` — one arena, every
  region, no resolver. This is the backdrop players actually see: the live
  in-map encounter (`EncounterModalOverlay`'s `mode === 'combat'` branch)
  mounts `CombatEncounterPanel` -> `CombatBoard` -> `CombatCombatantPane`
  directly over the dimmed exploration map, with no `ScreenBg` wrapper at
  all. `ScreenBg`'s `art="combat"` key (wired in V5) only ever paints behind
  the **dev-only** `/combat-encounter` sandbox route, where `CombatBoard`'s
  own opaque content immediately covers it — that key is not the live
  arena and this phase leaves it alone.
- No `region` (or equivalent) prop exists on `CombatEncounterPanelProps`,
  `CombatBoardProps`, or `CombatCombatantPane`'s props. The exploration
  screen already resolves `vm.region` for the map backdrop
  (`mapBackdropFor(vm.region)` at `app/(tabs)/exploration/index.tsx:275`)
  but nothing carries that same string into combat.
- **Adjacent bug, found while measuring, fixed in the same phase**:
  `assets/images/maps/index.ts`'s `REGION_BACKDROPS` matches
  `/village|town|hamlet|harbou?r/i` against the region display string, but
  phase 44f (2026-08-12 naming pass) renamed the fishing-village map's
  region from `'Fishing Village'` to `'the Drowned Parish'`
  (`state/exploration-maps/fishing-village.layout.ts:6`) — a name with none
  of those words in it. V4 shipped `wentworth-street` with the explicit
  intent "town-across-river / fishing-village" (`art-sources.json`), but the
  regex has silently never matched the coastal village since V4 landed: the
  map backdrop for the game's own opening region falls through to
  `FOREST_DARK`. Same class of miss the brief called out by name
  ("starting with the coastal village"), one-line fix, in scope here rather
  than filed for a separate phase.

## Decisions made upfront — DO NOT ASK

- **New plate, not a reuse.** `wentworth-street` is already claimed by the
  map/village screens; reusing it for combat too would read as the same
  place lit two different ways rather than a fight backdrop. Acquired
  fresh via `scripts/acquire-art.mjs` (V4 pipeline, licence read from
  Commons at acquisition, non-zero exit if unprovable): **"Off Billingsgate"**
  (Gustave Doré, *London: A Pilgrimage*, 1872; `File:Bpt6k10470488
  f369.jpg`) — fishermen on a moored boat's rigging, masts forested against
  a backlit sky. Public domain (Commons `LicenseShortName: Public domain`).
  Same series/artist as the shipped map plates, so the house tone holds;
  the vertical mast silhouettes and lit sky band give a composited foe the
  same kind of dramatic ground the ruined-city skyline does. Written to
  `assets/images/combat/coastal-village.webp` via the recorded Doré recipe
  (grayscale, brightness 0.62/contrast 1.08, longest edge 1120px, WebP q44
  — matching the map plates' `maxEdge`, not the tighter 640px default,
  since this is also a full-bleed scene backdrop). Provenance recorded at
  `assets/images/combat/provenance.json`.
- **The resolver lives beside the art**, `assets/images/combat/index.ts`,
  mirroring `assets/images/maps/index.ts`'s `mapBackdropFor` shape exactly:
  an ordered `(RegExp, plate)` list, first match wins, unmatched falls back
  to the existing plate. `arena-ruined-city.jpg` is the fallback, not a
  competing rule — every non-coastal region keeps today's behaviour
  byte-for-byte.
- **Region match pattern is `/drowned parish/i`**, not a generalized
  `village|town` reuse of the maps regex. The maps regex's generality is
  exactly what let it silently stop matching after the 44f rename; keying
  the new arena rule directly to the region's actual current display string
  avoids repeating that failure mode, and a second coastal-flavoured region
  can add its own rule later without contorting this one.
- **`region` threads as a plain optional prop**, not through the engine
  view-model. Art resolution is presentation-only (this package is a thin
  layer over `axiomancer-mechanics` per `CLAUDE.md`; the engine has no
  concept of backdrop art). Chain: `app/(tabs)/exploration/index.tsx`
  already holds `vm.region` -> `<EncounterModalOverlay region={vm.region}>`
  -> `<CombatEncounterPanel region>` (mode === 'combat' branch only; the
  aftermath/prelude branches don't render the pane) -> `<CombatBoard
  region>` -> `<CombatCombatantPane region>`, which resolves
  `arenaBackdropFor(region)` in place of the module-level `ARENA_BG`
  constant. Optional everywhere: the dev-only `/combat-encounter` route
  passes no region and gets the fallback plate, same as today.
- **The accessibility label becomes region-aware too.** A screen-reader
  user hearing "a storm-lit ruined city skyline" over a dockside plate
  would be told something false. `assets/images/combat/index.ts` exports an
  `arenaAltTextFor(region)` alongside the plate resolver, and
  `CombatCombatantPane` reads both off the same region.
- **The maps regex fix is additive, not a rewrite.** Add `|drowned parish`
  as an alternate in the existing `/village|town|hamlet|harbou?r/i` rule
  (now `/village|town|hamlet|harbou?r|drowned parish/i`) rather than a new
  ordered entry — same target plate (`WENTWORTH_STREET`), same rule,
  restoring the intent already on record in `art-sources.json`.

## Surface

| File | Change |
|---|---|
| `scripts/art-sources.json` | new `coastal-village` acquisition entry (category `combat`) |
| `assets/images/combat/coastal-village.webp` | new — acquired via `acquire-art.mjs` |
| `assets/images/combat/provenance.json` | new — merged-array provenance for the category |
| `assets/images/combat/index.ts` | new — `arenaBackdropFor` / `arenaAltTextFor` resolvers |
| `assets/images/combat/__tests__/index.test.ts` | new — resolver + fallback coverage |
| `assets/images/maps/index.ts` | `REGION_BACKDROPS` village rule gains `\|drowned parish` |
| `assets/images/maps/__tests__/index.test.ts` | new — pins the Drowned Parish -> Wentworth Street fix |
| `components/combat/encounter/CombatCombatantPane.tsx` | `region?: string` prop; `ARENA_BG` constant replaced by resolver calls |
| `components/combat/encounter/CombatBoard.tsx` | `region?: string` on `CombatBoardProps`, passed through to the pane |
| `components/combat/encounter/CombatEncounterPanel.tsx` | `region?: string` on `CombatEncounterPanelProps`, passed to `CombatBoard` |
| `components/event/EncounterModalOverlay.tsx` | `region?: string` prop, passed to the live-combat `CombatEncounterPanel` |
| `app/(tabs)/exploration/index.tsx` | passes `region={vm.region}` into `EncounterModalOverlay` |
| `scripts/asset-provenance.test.mjs` | drop `'combat'` from `REGISTRY_LESS` (it has an `index.ts` now) |
| `components/combat/encounter/__tests__/CombatCombatantPane*.test.ts(x)` | extend for the new prop where an existing suite already mounts the pane |

## Tests

| Case | Assert |
|---|---|
| `arenaBackdropFor('the Drowned Parish')` | resolves to the coastal-village plate |
| `arenaBackdropFor` unknown / undefined region | falls back to `arena-ruined-city.jpg`'s asset |
| `arenaAltTextFor('the Drowned Parish')` | mentions the dock/boat scene, not the ruined city |
| `mapBackdropFor('the Drowned Parish')` | resolves to `wentworth-street.webp` (regression pin for the 44f drift) |
| `mapBackdropFor` unmatched region | still falls back to `forest-dark.webp` (existing behaviour unchanged) |
| `CombatCombatantPane` with `region="the Drowned Parish"` | mounts the coastal-village source |
| `CombatCombatantPane` with no `region` | mounts the ruined-city source (byte-identical to pre-phase behaviour) |
| `assets:check` (`asset-provenance.test.mjs`) | `combat` category passes provenance-completeness + registry-reachability now that it has an `index.ts`; `REGISTRY_LESS` self-check stays green |

## Verify gate

`npm run verify` (lint, typecheck, test, `assets:check`, `art:test`, build,
e2e) scoped to `axiomancer-mobile`.

## DoD

- [ ] Coastal-village arena plate acquired, graded, provenance recorded.
- [ ] `arenaBackdropFor` / `arenaAltTextFor` resolvers, tested, fallback
      intact.
- [ ] `region` threaded end-to-end from the exploration screen to the pane;
      the dev sandbox route unaffected (no region -> fallback plate).
- [ ] Drowned Parish map-backdrop regression fixed and pinned by a test.
- [ ] `assets:check` green with `combat` off `REGISTRY_LESS`.

## Follow-ups (out of scope)

- Arena plates for the remaining regions (caverns, connecting-river,
  northern-city, the-capital, northern-forest) — each its own curation
  decision, same pipeline, one phase or tick per plate (or a batched pass).
- `ScreenBg`'s dev-route-only `art="combat"` key stays a static single
  plate; it is not the live arena and re-keying it would be cosmetic dead
  code (nothing ever sees it change).
- Phase 84's Capital advisor-selection design may eventually want its own
  arena; left for that phase or a later content-lifecycle pass, not
  pre-empted here.
