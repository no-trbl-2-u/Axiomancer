# Revamp — tooling

> Part plan of [THE REVAMP](README.md). Phase **R1** (loop). Decisions D56,
> D57. Status: PROPOSED.

## R1 — Tooling reset (loop)

1. **Delete the card editor** (`axiomancer-card-editor/`, ~4.3k LOC). It
   routes by theme into library files that no longer exist
   (`src/server/cardEditorPlugin.ts:60-69`) and offers all 49 mechanic
   kinds. Remove: the workspace entry in root `package.json`,
   `.github/workflows/verify-card-editor.yml`, the root `verify` step, its
   `.claude/launch.json` config, the `@mechanics` alias consumer notes, and
   every "three-package monorepo" line (AGENTS.md, bearings, READMEs,
   `plan/README.md`). B5 designs its successor ([cards.md](cards.md)).
2. **Retire the deck-matrix baseline** until R9/B2 need numbers (D57):
   - SessionStart freshness print and the baseline write-block in
     `.claude/hooks/guard.mjs:212-222`;
   - root `CLAUDE.md` "balance/measurement" paragraph, AGENTS.md → Truth
     sources, `docs/truth-sources.md` → "Measured truth";
   - `npm run baseline:check` / `baseline:regen`, the CI warning on
     mechanics pushes, `scripts/regen-deck-matrix-baseline.mjs`,
     `scripts/check-baseline-freshness.mjs`, the digest's nightly re-measure
     (`skills/digest.md`);
   - archive `axiomancer-mechanics/docs/reports/baselines/deck-matrix-baseline.json`
     (538 KB; 144 cells, 8 distinct decks, all grey; still emits
     `presetSummaries`, CQI, `statusEngagement`).
3. **DevLog** — unpublish and archive `devlog/tuning-lab/tuning-lab-{1,2,3}.html`
   ("Deck Preset Playtest Ledger", "Card-Expert Tuning Lab";
   `scripts/build-devlog-public.mjs:59, 744-762`, `build-devlog.mjs:170, 194`).
   The catalog (`scripts/build-catalog.mjs`,
   `axiomancer-mechanics/scripts/export-catalog.ts`,
   `devlog-catalog-shots.mjs`, `devlog-card-plate.mjs`) renders **live
   content only**, so it tracks the reset automatically. DevLog entries stay
   as history.
4. **Orphan scripts** — delete `axiomancer-mechanics/scripts/dump-paid-context.ts`,
   `scripts/apply-retheme-map.mjs` + `docs/retheme-map.json` (Phase 44a
   renames of purged keywords; check the lexicon tooling's reads first),
   and the naming-law check (`scripts/check-naming-law.mjs`, `lint:names`,
   settings allowances) repealed by THE BIG NUMBERS REWRITE. Wire or drop
   the unreferenced npm scripts `combat-dice-economy`, `agent-e2e`, and give
   `scripts/check-devlog-public-live.mjs` an npm script.
5. **Stale docs** — `docs/logging.md:120-123` (`--deck=preset:all`,
   `statusEngagement`), `spec.md:21-24` ("faction reputation"), the root
   `npm test` failure in `scripts/build-devlog-public.test.mjs:117` filed by
   #409 (fix or re-pin).
6. `.env.example`: add `KB_MCP_TOKEN` (the kb-query MCP returns a silent 401
   without it).

Requires R0 (the loop docs that name these tools are fixed first). The
`.claude/**` edits above (`guard.mjs`, `launch.json`) ship in **R0**, not
here: `.claude/**` is classifier-blocked for unattended runs (Phase G1).
