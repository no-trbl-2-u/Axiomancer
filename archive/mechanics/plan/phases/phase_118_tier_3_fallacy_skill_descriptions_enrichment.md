# Phase 118 — Tier 3 fallacy skill descriptions enrichment

> Pure content polish for philosophical capstone skills. No mechanics change.

## Outcome

The seven Tier 3 fallacy skills carry richer `description` prose matching the vocabulary depth of the Tier 1/2 skill library and the recent enemy/story content. The CLI skill browser should make these capstones feel like philosophical weapons rather than placeholder rows.

## Source

Promoted from `plan/PHASE_CANDIDATES.md` on 2026-06-05 by T's direct oversight order: "Promote 5, 4, and 1."

Candidate signal: Phases 114-117 content authoring highlighted sparse Tier 3 descriptions.

## Scope

### Unit 1 — Enrich Tier 3 skill descriptions

**Files:**
- `src/Skills/library/tier3.ts`

Update the `description` fields for exactly these seven skills:
- `poisoning-the-well`
- `slippery-slope`
- `straw-man`
- `ad-hominem`
- `false-dichotomy`
- `appeal-to-authority`
- `bandwagon-effect`

Each description should be 2-3 sentences, concrete, and thematically tied to the fallacy. Preserve IDs, costs, target types, damage, effects, learning requirements, synergies, and all combat behavior.

### Unit 2 — Docs fold-in

**Files:**
- `docs/skills.md`
- `CHANGELOG.md` `[unreleased]` if the repo's current changelog convention expects docs/content polish entries

Update the Tier 3 skill table/section so docs and live library descriptions agree.

## Decisions made upfront — DO NOT ASK

- **D1 — No mechanical edits.** This phase changes prose only.
- **D2 — No new skills.** Enrich the existing seven fallacy skills; do not expand the library.
- **D3 — No public-surface fixture refresh.** No exports change.
- **D4 — Keep descriptions usable in CLI.** Rich does not mean long; avoid paragraph bloat in terminal renderers.

## Verify gate

- `npm run type-check`
- `npm test`
- `npm run build`
- `npm run deploy:check`

## Acceptance

- All seven listed Tier 3 skill descriptions are enriched.
- `docs/skills.md` reflects the same authored intent.
- No cost/effect/resource/combat behavior changes appear in diff.
