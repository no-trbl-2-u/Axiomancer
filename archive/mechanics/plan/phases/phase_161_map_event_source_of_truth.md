# Phase 161 — Map-event content source-of-truth reconciliation

**Goal:** End the silent divergence between the two map-event content
registries that describe the same maps. Pick a single engine-side source of
truth, delete the now-dead shadowed pools, and add a parity guard so the
divergence cannot silently re-form. Closes the engine half of
NEEDS_ATTENTION §5.

**Source:** Oversight 2026-06-20 (Q1 pick); NEEDS_ATTENTION.md §5; build-plan
row Phase 161. Cross-filed in mobile's NEEDS_ATTENTION §3.

## The divergence (verified)

`src/World/MapEvents/content.ts` registers per-node `MapEventPool` overrides as
a module-load side-effect. Overrides live in a JS `Map` keyed by
`continent:map:node`, so registration is **last-write-wins**.

The file holds TWO blocks for `fishing-village`:

1. **Legacy block** (`FISHING_VILLAGE_POOLS`, ~25 rich pools incl.
   `village`/`cutscene`/`interaction` events — shops, shrines, the ferry slip)
   registered first.
2. **New-player block** (`FISHING_VILLAGE_NEW_PLAYER_POOLS`) registered LAST,
   re-setting the override for EVERY `fv-1..fv-25` node to
   encounter/rest/gathering/hazard/quest/boss. Its own comment says it
   "supersedes the legacy authored pools above (kept in source for reference)."

Net effect: every legacy fishing-village pool is **dead even in the engine/CLI
host** — registered, then clobbered at module load. The intra-file divergence
mirrors the cross-repo one (mobile registers its own overrides for every node).

The `northern-forest` map has NO shadow block; its pools are all live, and they
already carry `village` (nf-8), `cutscene` (nf-1/nf-10),
`interaction` (nf-3/5/7/9), and `loot-cache` coverage.

An existing e2e (`content.engine.test.ts`) already canonicalises the new-player
layout ("combat gauntlet with no village/shop node — the surviving authored
shop lives on northern-forest nf-8").

## Decision (source of truth — engine side)

The **engine is the authored source of truth for CLI/demo play.** The
new-player fishing-village layout is canonical fishing-village content. The
mobile host authoring its own overrides is the out-of-this-repo half (mobile
NEEDS_ATTENTION §3) and is explicitly out of scope here.

Concretely:

1. **Delete** the dead legacy fishing-village pool definitions and the
   `FISHING_VILLAGE_POOLS` registration loop. They are pure dead code shadowed
   within the same file. (Northern-forest is untouched — it remains live and
   carries the village/cutscene/interaction/loot-cache coverage.)
2. **Add a no-shadow parity guard.** Instrument the registry so
   `setNodeEventPoolOverride` is observable, and a hermetic e2e asserts no
   `continent:map:node` override is registered more than once on module load
   (i.e. authored-then-clobbered). This turns "two registries silently
   diverging" into a test failure going forward.
3. **Preserve invariants.** All eight `MapEventKind` values still fire across
   the two maps (northern-forest carries the kinds fishing-village dropped);
   the new-player fishing-village layout counts are unchanged.

## Commit units

1. `feat(world): phase 161 — collapse map-event content to one source of truth`
   - Remove the dead `FISHING_VILLAGE_POOLS` legacy block + loop from
     `content.ts`.
   - Add a registry-introspection hook (e.g. `getRegisteredNodeOverrideKeys`
     or an override-count read) in `resolve-map-event.ts` to enable the guard.
   - Add `src/World/MapEvents/e2e/content-parity.engine.test.ts`: asserts no
     node override is double-registered (no-shadow) and the new-player
     fishing-village layout is the live one.
   - Keep `content.engine.test.ts` green; keep the all-8-kinds invariant green.
   - Update `docs/world.md` MapEvents §: document the single-source-of-truth
     decision; close NEEDS_ATTENTION §5 engine half (note the mobile half is
     cross-repo, out of scope here).

## Decisions made upfront

- **Delete vs. keep-for-reference.** Delete. "Kept in source for reference" is
  exactly how the silent divergence formed; git history is the reference. The
  pools are unreachable, so removal is behaviour-preserving.
- **Guard shape.** A no-double-registration / no-shadow assertion on the live
  override map is the tightest engine-side parity invariant; it catches any
  future authored-then-clobbered node regardless of which block wins.
- **northern-forest untouched.** It is live, non-divergent, and carries the
  kinds fishing-village dropped — removing it would break the all-8 invariant.

## Verify gate / DoD

- [ ] `FISHING_VILLAGE_POOLS` legacy block removed; `content.ts` no longer
      registers shadowed fishing-village overrides.
- [ ] No-shadow parity guard e2e added and green.
- [ ] `content.engine.test.ts` + all-8-kinds invariant still green.
- [ ] `docs/world.md` documents the source-of-truth decision.
- [ ] NEEDS_ATTENTION §5 engine half closed (mobile half noted out-of-scope).
- [ ] `npm run verify` green; `npm run deploy:check` publishable.
