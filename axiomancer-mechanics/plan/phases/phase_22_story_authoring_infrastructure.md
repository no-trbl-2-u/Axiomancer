# Phase 22 — Story content authoring infrastructure

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

Two new authoring skills land next to the existing `story-spec` skill,
covering the same Socratic-conversation → committed-spec workflow for
the other two authoring axes:

- `world-spec` — locations / maps / region beats. Spec output lives at
  `specs/world/W-NN-<slug>.md`.
- `character-spec` — character bios (player presets, named-NPC
  histories that aren't tied to a single dialogue tree). Spec output
  lives at `specs/characters/C-NN-<slug>.md`.

`content/` gains README placeholders so the existing-but-empty
`content/characters/`, `content/locations/fishing-village/`,
`content/locations/northern-forest/` directories have a clear authoring
contract. The existing `content/story/story-overview.md` stays.

## Source spec

No dedicated `specs/22-*.md` file — feature row in
`plan/steps/01_build_plan.md`:

> Phase 22 — Story content authoring infrastructure (story-spec / world-spec / character-spec skills + content/ templates) [low priority]

Resolved questions:

1. **`story-spec` is already shipped — what's the gap?**
   `world-spec` and `character-spec` are missing. The story-spec skill
   ships as `.claude/skills/story-spec/SKILL.md` + a sibling
   `story-references.md`; mirror that exact shape.
2. **Spec filename conventions?**
   - World: `specs/world/W-NN-<slug>.md`. NN zero-padded, sequential
     starting from 01. A `00-world-spec-template.md` template lands
     alongside.
   - Characters: `specs/characters/C-NN-<slug>.md`. Same numbering
     rule. A `00-character-spec-template.md` template lands alongside.
3. **Content directory templates?**
   Two readmes:
   - `content/characters/README.md` — one paragraph explaining what
     goes in this directory (per-character markdown bios, asset
     references, recorded VO if any).
   - `content/locations/README.md` — one paragraph explaining
     location-specific notes; the per-location subdirectories already
     exist.
4. **Skill prior art / references?**
   - `world-spec`: Disco Elysium, Pathologic 2, Outer Wilds, Hollow
     Knight, Dark Souls, Mörk Borg, Sunless Sea. The "world-as-puzzle"
     and "place-as-character" traditions.
   - `character-spec`: Disco Elysium Skills as voices, Pathologic 2's
     archetypes, Planescape: Torment companion construction, Hades's
     iterated-revelations through god-dialogue, Mass Effect's
     codex-vs-spoken-dialogue split.
5. **Skill scope — overlap with `story-spec`?**
   Story-spec is the entry point for **dialogue trees + beats**.
   World-spec is for **places / atmosphere / mechanical hazards /
   region-level state**. Character-spec is for **a named entity's
   personhood** (history, motivation, posture, look) that may then be
   wired into one or more dialogue trees.
   The three rendezvous in `specs/story/` only when a beat couples two
   axes (e.g. "the Fisherman quest" depends on the Fisherman's
   character spec and the Fishing Village's world spec).
6. **Where to register new top-level spec directories?**
   `specs/world/` and `specs/characters/` are new. They sit alongside
   `specs/story/` and the numeric mechanic specs. Each gets a
   `00-<axis>-spec-template.md` file documenting the format.
7. **CLAUDE.md update?**
   Yes — a single-line nod in CLAUDE.md (the project doc) that points
   future authors at the three skills + three spec directories.
   Detection: grep for "story-spec" in CLAUDE.md; add the two new
   skills next to it.
8. **Tests?**
   No code change, no tests. The skill files are markdown and skill
   registration; the verify gate runs as a sanity check only.

## Implementation units (commit per unit)

### Unit 1 — Add `world-spec` skill

Files:
- `.claude/skills/world-spec/SKILL.md` (new). Mirror the structure of
  `.claude/skills/story-spec/SKILL.md` (Phase 1 Mirror → Phase 5 Create
  spec). Replace "NPC / beat" with "location / region" throughout.
  Replace the dialogue-triggers template section with a
  **Atmosphere / mechanics / state** template:
  - Atmosphere block (sensory language for the location).
  - Mechanical hazards (effects active in this region).
  - Region state (unlock keys, completion flags, fog-of-war notes).
  - Cross-references.
  Prior-art block: cite Disco Elysium, Pathologic 2, Outer Wilds,
  Hollow Knight, Dark Souls, Sunless Sea.
- `.claude/skills/world-spec/world-references.md` (new). One-page
  reference doc listing the 6 prior-art games with 2–3 sentences each
  on what about their location authoring is worth borrowing.
- `specs/world/00-world-spec-template.md` (new). The bare template
  the skill produces — usable by hand if someone skips the skill.

Commit: `feat(skills): add world-spec authoring skill + template`

### Unit 2 — Add `character-spec` skill

Files:
- `.claude/skills/character-spec/SKILL.md` (new). Same shape as
  story-spec; sections focus on:
  - **Voice** (how this character talks; 2–3 line samples).
  - **History** (what shaped them).
  - **Motivations + secret**.
  - **Posture / appearance**.
  - **Dialogue-tree references** (which `specs/story/` files use this
    character).
  Prior-art block: Disco Elysium, Pathologic 2, Planescape: Torment,
  Hades, Mass Effect.
- `.claude/skills/character-spec/character-references.md` (new).
  Same one-page prior-art doc shape.
- `specs/characters/00-character-spec-template.md` (new).

Commit: `feat(skills): add character-spec authoring skill + template`

### Unit 3 — Add `content/` directory READMEs

Files:
- `content/characters/README.md` (new). One paragraph: per-character
  markdown bios, asset references (`bio.md`, `visuals.md`,
  `vo-script.md` if any), one subdirectory per character.
- `content/locations/README.md` (new). One paragraph: per-location
  notes; existing `fishing-village/` and `northern-forest/`
  subdirectories sit under it. Authors should drop per-location
  `atmosphere.md`, `mechanics.md`, `lore.md` files as the world-spec
  matures.

Commit: `docs(content): scaffold READMEs for characters/ and locations/`

### Unit 4 — Update CLAUDE.md cross-reference + DoD

File: `CLAUDE.md`:
- Find the section that points at `story-spec` (if any). Add the two
  new skills + new spec directories.
- If no such section exists, add a "Story authoring" subsection that
  enumerates the three skills + three spec directories + content
  layout.

Flip Phase 22 in `plan/steps/01_build_plan.md` to `[x]` with hash.

Commit: `plan: phase 22 shipped — story authoring infrastructure`

## Decisions made upfront — DO NOT ASK

- Skill files live at `.claude/skills/<name>/SKILL.md`; sibling
  reference files are optional.
- Spec directories: `specs/world/`, `specs/characters/`. Numbering
  starts at 01 with a `00-*-spec-template.md` template.
- Content README scaffolds only — no actual character / location
  content authored here.
- No verify-gate concerns; this is markdown-only.

## Verify gate

```bash
npm run verify          # sanity — no code change but keep the discipline
npm run deploy:check
```

## Definition of Done

- [ ] `.claude/skills/world-spec/SKILL.md` exists with all 5 phases
- [ ] `.claude/skills/world-spec/world-references.md` exists with 6 prior-art entries
- [ ] `specs/world/00-world-spec-template.md` exists
- [ ] `.claude/skills/character-spec/SKILL.md` exists with all 5 phases
- [ ] `.claude/skills/character-spec/character-references.md` exists
- [ ] `specs/characters/00-character-spec-template.md` exists
- [ ] `content/characters/README.md` exists
- [ ] `content/locations/README.md` exists
- [ ] `CLAUDE.md` cross-references all three authoring skills + their spec dirs
- [ ] `npm run verify` and `npm run deploy:check` exit 0
- [ ] Phase 22 row in `plan/steps/01_build_plan.md` is `[x]` with hash

## Follow-ups (out of scope)

- Author the first `W-01` or `C-01` spec — that's the next /march tick.
- Wire skill discovery / surface in `/help` — out of scope.
