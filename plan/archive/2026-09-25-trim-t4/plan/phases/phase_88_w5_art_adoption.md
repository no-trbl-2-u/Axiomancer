# Phase 88 — W5 art adoption: wire the picked candidate per enemy

## Outcome

The 9 W3/W5 northern-continent enemies (Seam Tick, Prop-Wight, Unpaid
Delver, Sump Maren, Toll-Sergeant, Guild Knife, The Factor, Wharf
Shrike, The Harbormaster) render the `/oversight`-picked art candidate
from Phase 78's research instead of the interim ad hoc silhouette
placeholders. `plan/AUDIT.md`'s W5 art-pass loop-call closes.

## Why (context)

Phase 78 (2026-09-03) researched >=2 licensed candidates per enemy and
filed them as an `[loop-call]` AUDIT row (no art wired that phase —
research-and-present only). `/oversight` on 2026-09-15 decided: *"adopt
the first-listed (top) licensed candidate for each of the 9 enemies,
replacing the game-icons.net silhouette placeholders."* This phase
wires that pick.

## Decisions made upfront — DO NOT ASK

1. **8 of 9: adopt the top-listed candidate as instructed**, all
   already-licensed game-icons.net SVGs sitting in the repo's own
   licensed trove (`Potential Assets/icons-TBR/ffffff/transparent/1x1/`
   — pre-rendered white-fill-on-transparent, 512x512 viewBox, the exact
   convention every prior W3/W4/backfill batch used):
   - `enemy-seam-tick` -> `lorc/tick.svg`
   - `enemy-prop-wight` -> `lorc/ghost.svg`
   - `enemy-unpaid-delver` -> `lorc/mining.svg`
   - `enemy-sump-maren` -> `delapouite/mermaid.svg`
   - `enemy-toll-sergeant` -> `delapouite/sergeant.svg`
   - `enemy-guild-knife` -> `delapouite/dagger-rose.svg`
   - `enemy-the-factor` -> `lorc/scales.svg`
   - `enemy-the-harbormaster` -> `delapouite/kraken-tentacle.svg`
   Recipe unchanged from every prior batch: `sharp`, rasterize the
   512x512 SVG (already white-glyph-on-transparent in this trove
   subfolder) straight to WebP q90. No resize needed — native raster
   size already matches the 512px target exactly.
2. **1 of 9 — `enemy-wharf-shrike` — does NOT adopt the top-listed
   candidate.** Phase 78's scout research listed "Raven 16x18 sprite —
   Redshrike — CC0 — pixel corvid" from
   `opengameart.org/content/raven-16x18`. Downloading and inspecting it
   this phase (before wiring, not after) shows the research was wrong:
   the asset is a 144x72 multi-layer JRPG *humanoid character* sprite
   sheet named "Raven" (hair/suit/details/full-body layers) — a name
   collision with the bird, not a corvid asset at all. Wiring it would
   put a human sprite on a "mutated harbor bird" enemy. Falling back to
   the AUDIT row's **second-listed candidate** instead: the openclipart
   "Shrike" line-art
   (`openclipart.org/download/123931/Shrike-.svg`), Public Domain,
   confirmed this phase by downloading the SVG and rendering it — a
   correctly-posed shrike, ink-on-transparent. Recolored ink black ->
   white to match the sibling glyphs' white-on-transparent convention
   (the source ink is black-on-transparent, not pre-converted like the
   game-icons.net trove) via a raw-buffer alpha-preserving recolor,
   then WebP q90. This is the doing-the-right-thing call `/ship-a-phase`
   §3/§10 calls for on a phase-shaped surprise — not asking, verifying
   before wiring and picking the next-best AUDIT-listed option when the
   literal top pick is factually wrong.
3. **Style note, not a blocker**: the Shrike replacement is fine
   cross-hatched line art, a different rendering register than the
   other 8 flat vector silhouettes. This is the same "art registers
   incoherent" tension already open as a MED critique row (arena
   backdrop vs. dice vs. portraits) — not new, not worsened materially
   (all 9 are still white-on-transparent glyphs at the same size), and
   out of this phase's scope to unify. Left for a future art-coherence
   pass.
4. **File identity unchanged.** Every one of the 9 already has a
   `portraitAsset` registry entry (`assets/images/enemies/index.ts`)
   and filename (`<key>.webp`) from the W3 batch — this phase
   overwrites those 9 files in place; no registry/index.ts key changes,
   no `enemy.library.ts` changes.
5. **Provenance**: append one entry per source-batch to
   `provenance.json` (game-icons.net batch + the openclipart Shrike
   entry), following the existing per-batch entry shape, `covers`
   listing the 9 files touched.

## Output shape

- 9 `.webp` files overwritten in `axiomancer-mobile/assets/images/enemies/`.
- `provenance.json` gets 2 new entries (8-file game-icons.net batch +
  1-file openclipart batch).
- `index.ts` header comment note updated for this batch's line in the
  `ENEMY_ART_BY_KEY` map (existing lines already point at the right
  keys/files — comment-only touch to record the Phase 88 re-source).
- `plan/AUDIT.md`'s Phase 78 row closes (already carries the
  `/oversight` DECIDED note; this phase's commit is the actual close).

## Verify gate

Standard mobile verify (`npm run verify` scoped to
`axiomancer-mobile`): typecheck, tests, data:validate, build. No new
test surface needed — `hasEnemyArt`/`getEncounterEnemyArt` are already
covered by existing tests keyed on the *keys*, not file bytes; a
`.webp` content swap doesn't change any assertion. Confirm visually via
a quick composited render (done ad hoc this phase, not shipped as a
script) rather than a pixel-diff test — no existing convention treats
enemy-art pixel content as spec'd/testable in this codebase (only key
presence is).

## DoD

- [ ] 9 `.webp` files overwritten with the picked/verified art.
- [ ] `provenance.json` updated (2 new entries).
- [ ] `index.ts` header comment updated for the Phase 88 re-source.
- [ ] `plan/AUDIT.md` Phase 78 row marked closed/superseded by Phase 88.
- [ ] Build-plan Phase 88 row ticked `[x]` with commit hash.
- [ ] Phase mirror issue opened + closed.

## Follow-ups (out of scope)

- Art-register coherence pass (silhouette vs. line-art vs. painted vs.
  arena backdrop) — already an open MED critique row, not created by
  this phase.
- Phase 73's in-house generation pipeline eventually supersedes this
  whole licensed-silhouette source, per Phase 78's own framing.
