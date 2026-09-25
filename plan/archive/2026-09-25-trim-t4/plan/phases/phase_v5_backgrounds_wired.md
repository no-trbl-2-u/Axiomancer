# Phase V5 — Backgrounds wired

> Woodcut Codex, V-series. Depends on V4 (shipped 2026-08-28). Brief
> generated 2026-08-28 by `/ship-a-phase` §9.

## Outcome

`ScreenBg` gains a keyed art slot with the dim/vignette treatment the
map already proved, and the screens with a place to put art consume the
V4 plates. The procedural look stays as the fallback, not as a leftover.

## What exists, measured

- `ScreenBg` wraps 10+ screens and paints a flat `AXM.bg` — no art slot
  at all.
- `MapCanvas` already carries the proven treatment: absolute-fill plate,
  `contentFit: cover`, `opacity: 0.2`, **dim, never blur**, panning with
  the chart. That is the pattern to generalize, not to re-derive.
- V4 delivered five map plates plus one combat arena.

## Decisions made upfront — DO NOT ASK

- **The keyed resolver lives beside the art, not in the component.**
  `assets/images/screens/index.ts` maps a screen key to a plate, exactly
  as `maps/index.ts` maps a region. `ScreenBg` takes a key and stays a
  layout component that knows nothing about which engraving is which.
- **The treatment is copied from `MapCanvas`, deliberately.** Same
  opacity, same `cover`, same no-blur. Two screens dimming art two
  different ways is the drift a shared component exists to prevent, and
  the map's numbers are the ones that survived a critique pass.
- **A vignette is added, and it is not the dim.** Dimming keeps text
  legible over the middle; the vignette keeps the plate from ending in a
  hard rectangle against the panel chrome. They are separate knobs
  because they solve separate problems.
- **Screens opt IN.** No screen gets art by default: a backdrop under a
  dense inventory table is noise, and silently changing ten screens at
  once is not a wiring phase, it is a redesign. The keys wired here are
  the ones with a place for art — event, labyrinth, combat.
- **Reused plates are keyed honestly.** The V4 plates were acquired as
  map backdrops. Where one suits a screen it is reused and the
  provenance `used_by` records the second consumer; nothing is
  re-acquired to have a private copy.
- **Combat arena variety ships as the SLOT, not as new art.** There is
  one arena. Acquiring more is V4's pipeline and a curation decision per
  plate; this phase makes arenas selectable and records the gap, rather
  than padding it with whatever engraving is to hand.

## Surface

| File | Change |
|---|---|
| `components/ScreenBg.tsx` | optional `art` key, dim + vignette layers |
| `assets/images/screens/index.ts` | new — the key → plate resolver |
| `components/__tests__/ScreenBg.test.tsx` | slot present/absent, fallback |
| `app/event/`, `app/labyrinth/`, `app/combat-encounter/` | pass their keys |
| `maps/provenance.json` | `used_by` gains the screen consumers |

## Tests

| Case | Assert |
|---|---|
| no `art` prop | no image mounts; existing screens unchanged |
| a known key | the plate mounts, dimmed, behind the children |
| an unknown key | falls back to procedural, does not throw |
| children | still render in both branches, scrollable and not |
| the resolver | every key resolves to a registered asset |

## Verify gate

`npm run verify`, `npm run assets:check`, root `npm test`.

## DoD

- [ ] `ScreenBg` art slot with dim + vignette.
- [ ] Resolver keyed, tested, every key resolving.
- [ ] The three art-bearing screens wired; the rest untouched.
- [ ] Procedural fallback intact.

## Follow-ups (out of scope)

- Arena plates beyond the one that exists (V4 pipeline, per-plate
  curation).
- V6 glyph unification; V7 illustration upgrades.
