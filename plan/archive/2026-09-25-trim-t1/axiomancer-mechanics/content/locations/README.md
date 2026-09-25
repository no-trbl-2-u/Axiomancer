> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/content/locations/README.md`. Describes removed or never-built code; not a source of rules.

# content/locations/

Per-location authored content. One subdirectory per location slug.

## Layout

```
content/locations/
├── README.md                 (this file)
├── fishing-village/
│   ├── atmosphere.md         — sensory prose, mood, time-of-day notes
│   ├── mechanics.md          — hazards / region-state notes, free-form
│   └── lore.md               — backstory, in-world references
└── northern-forest/
    └── …
```

## Authoring workflow

1. Create the spec via `/world-spec` → lands in
   `specs/world/W-NN-<slug>.md`.
2. Drop `atmosphere.md`, `mechanics.md`, `lore.md` into
   `content/locations/<slug>/` as the world-spec matures. The spec is
   the compressed contract; these files are the prose draft pad.

## Conventions

- The subdirectory slug matches the world-spec's slug exactly.
- Authored content here is NOT loaded by the engine. Engine-side map
  registration lives in `src/World/Continents/<continent>/maps.ts`
  and references this content by hand-coding `description`, hazard
  IDs, etc.
- Treat this directory as the author's notebook; tests don't read it.
