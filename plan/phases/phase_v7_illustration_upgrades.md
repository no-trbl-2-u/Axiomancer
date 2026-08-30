# Phase V7 — Illustration upgrades

> Woodcut Codex, V-series. Depends on Phase V4's acquisition pipeline
> (shipped 2026-08-28). Brief generated 2026-08-30 by `/ship-a-phase` §9.

## Outcome

`<Splatter>` — the one procedural illustration SVG named in
`SVG_ASSET_SPEC.md` §5–8 with a genuinely live, high-frequency production
surface — now renders a real acquired ink plate instead of 29 random
circles. Everything else the master plan's V7 line named (event/boss
illustrations, body diagram) turned out to be dead or near-dead code on
inspection; that finding, not a swap, is this phase's other deliverable.

## What's actually live — the survey the brief needed before touching art

The masterplan brief says "replace the remaining procedural illustration
SVGs … (event/boss illustrations, splatter PNG variants, room-scene
backdrops)". Before acquiring anything, each target was traced from its
component to its real call sites:

| Target (§) | Component | Reachable in production? |
|---|---|---|
| §5 Ink splatter | `Splatter.tsx` | **Yes** — `CombatVictoryPanel` (every combat win), `LevelReadyStrip` / `AscendStrip` (every level-up), `MapCanvas` (the exploration map, always mounted) |
| §6 Enemy illustration ("Carrion Hierophant") | predates `EnemyIllustration`/`figures/` | Superseded — live combat renders acquired portraits (`assets/images/enemies/`, `assets/images/portraits/`), not this SVG family |
| §7 Event/boss illustration | `EncounterIllustration.tsx`, `BossIllustration.tsx`, `PlaceholderIllustration.tsx`, `EnemyIllustration.tsx` | **No** — all four render only through `EventArt`, which only `app/event/index.tsx` imports. That file's own header (Phase 137 cleanup) says it plainly: *"In production NOTHING routes here anymore — the screen survives only as the `selectPacedEventRoute` fallback."* The other consumer is `app/devart/index.tsx`, a dev-only gallery. |
| §8 Character body diagram | `BodyDiagram.tsx` | **No** — zero call sites anywhere in the tree (`grep -rn BodyDiagram` finds only its own file). Already flagged as an orphan in the V1 brief's ground-truth survey (2026-08-08); still true. |
| Room-scene backdrops (47 rooms) | `RoomScene.tsx` | **Yes** — `app/labyrinth/index.tsx` is the live Aporia-acts screen. But 47 distinct curated plates is a phase-sized acquisition effort on its own, not absorbable into this one. |

## Decisions made — DO NOT RE-LITIGATE WITHOUT NEW EVIDENCE

- **Splatter gets real art now.** It is the one target that is both named
  in §5–8 and actually seen by every player, every combat, every level-up.
  Acquiring bespoke art for code nobody's build ever renders would be
  wasted effort; acquiring it for this component is not.
- **Event/boss illustrations and the body diagram are DEFERRED, not
  shipped.** Swapping art into unreachable/orphaned components ahead of a
  real keep-or-delete call would be exactly the kind of investment V8
  (Closure — "teardown of superseded placeholder code") exists to weigh in.
  This phase's job was to notice the dead code, not silently paper over it
  with new art it's a coin flip whether V8 later deletes.
- **Room-scene backdrops (47 rooms) are OUT OF SCOPE, not orphaned.** This
  is live art the labyrinth needs; it just doesn't fit inside one phase
  tick. Left as a named follow-up rather than folded in partially (the V6
  precedent for splitting an oversized ask cleanly rather than guessing at
  a partial cut).
- **The acquisition source is Rorschach test plates** (Hermann Rorschach,
  died 1922 — public domain), sourced from Wikimedia Commons. They are
  literally real ink on paper, which is a better match for "ink splatter"
  than a drawn approximation would be, and the licence reads clean through
  the existing `verifyLicence` gate (`LicenseShortName: "Public domain"`).
- **The alpha-matte ("silhouette") recipe is new, `acquire-art.mjs`
  extended, not replaced.** The existing dim-plate recipe (grayscale +
  brightness/contrast toward the void) is for backdrop plates meant to sit
  UNDER a chart layer at low opacity; a splatter needs to be a fully
  recolorable cutout so `tintColor` can pick blood vs. sulfur at render
  time, the same contract the procedural `color` prop had. `entry.recipe:
  "silhouette"` in `art-sources.json` selects it; the dim-plate recipe
  stays the default so every existing manifest entry is unaffected.

## Surface

| File | Role |
|---|---|
| `axiomancer-mobile/scripts/acquire-art.mjs` | `buildSilhouette` — the new alpha-matte recipe (grayscale, trim to content, alpha = inverted luminance, WebP w/ alpha) |
| `axiomancer-mobile/scripts/art-sources.json` | four new manifest entries, `recipe: "silhouette"` |
| `axiomancer-mobile/assets/images/splatter/*.webp` | the four acquired plates |
| `axiomancer-mobile/assets/images/splatter/index.ts` | `splatterFor(seed)` — deterministic pick |
| `axiomancer-mobile/assets/images/splatter/provenance.json` | source, artist, licence, recipe |
| `axiomancer-mobile/components/Splatter.tsx` | now an `<Image tintColor>`, same public API (`color`/`size`/`seed`/`style`) |
| `axiomancer-mobile/scripts/art.test.mjs` | `buildSilhouette` unit test |
| `axiomancer-mobile/components/__tests__/Splatter.test.tsx` | acquired-art contract (seed determinism, size, tintColor) |
| `axiomancer-mobile/SVG_ASSET_SPEC.md` | checklist reconciled: splatter resolved, event/boss/body-diagram/room-scenes annotated with this phase's findings |

## Tests

| Case | Assert |
|---|---|
| `buildSilhouette` on a synthetic radial-gradient source | output carries an alpha channel; centre near-opaque, field near-transparent |
| every existing `acquire-art.mjs` / `art-sources.json` test | still green — the dim-plate recipe path is untouched |
| `Splatter` seed determinism | same seed -> same plate; different seeds can differ |
| `Splatter` prop passthrough | `size` -> style; `color` -> `tintColor` (via `processColor`, since expo-image normalizes strings to native colour ints) |
| `assets:check` (asset-provenance.test.mjs) | `splatter/` has a complete provenance record, registry, no orphans |
| existing `Splatter` call-site suites (MapCanvas, CombatVictoryPanel, LevelReadyStrip, AscendStrip) | still green — public API unchanged |

## Verify gate

`npm run verify` (typecheck, test:run, assets:check, art:test, build, e2e).

## DoD

- [x] Ink splatter is real acquired art, license-verified at acquisition,
      wired through the existing public component API.
- [x] Event/boss illustration and body-diagram orphan status investigated
      and recorded (in this brief and `SVG_ASSET_SPEC.md`) rather than
      guessed at with unnecessary art spend.
- [x] Room-scene backdrops explicitly named as a deferred follow-up, not
      silently dropped.

## Follow-ups (out of scope)

- **V8** — decide keep-or-delete for `EncounterIllustration` /
  `BossIllustration` / `PlaceholderIllustration` / `EnemyIllustration`'s
  archetype figures / `BodyDiagram`. If `/event`'s fallback role is worth
  keeping, these need real art too, sized as their own slice; if not,
  deleting dead code is itself the V8-shaped move.
- **Labyrinth room-scene backdrops** — a 47-plate curated acquisition
  manifest, its own phase.
- `PixelEmblem` stays exactly as it is — the design carve-out
  (`components/event/aftermath/PixelEmblem.tsx`'s own header) is explicit
  that it must not be normalized into the acquired-art system.
