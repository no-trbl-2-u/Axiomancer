# content/characters/

Per-character authored content. One subdirectory per named character.

## Layout

```
content/characters/
├── README.md             (this file)
└── <character-slug>/
    ├── bio.md            — prose biography; the "novel" version of the spec
    ├── visuals.md        — appearance notes, reference images, color palette
    └── vo-script.md      — voice-over lines (if any), per dialogue trigger
```

## Authoring workflow

1. Create the spec via `/character-spec` → lands in
   `specs/characters/C-NN-<slug>.md`.
2. Create `content/characters/<slug>/bio.md` once the spec is signed
   off. The bio is the long-form prose the spec compresses; written
   for humans, not for code.
3. `visuals.md` and `vo-script.md` are optional and added as the
   character matures.

## Conventions

- The slug matches the character spec's slug exactly.
- Authored content here is NOT loaded by the engine. Engine-side
  character wiring (NPC libraries, dialogue trees, presets) lives in
  `src/` and references this content by hand-coding the relevant fields.
- Treat this directory as the author's notebook; tests don't read it.
