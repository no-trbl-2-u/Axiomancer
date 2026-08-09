# Lexicon — canonical and retired Axiomancer terminology

<!-- lexicon-ok: src-skills-path, base-power, chip-hp, pressure-tracks, doxa, lemma, thesis, theorem, axiom, enchantment, disenchant, thoughtform -->

> The machine-authoritative retired-terms registry is
> [`lexicon.json`](./lexicon.json) — `node scripts/check-lexicon.mjs`
> (repo root) enforces it in CI against every live prose surface. This
> file is the human guide: what the terms mean, which near-collisions
> are deliberate, and how to retire a concept without a three-day
> cleanup.

## The word "skill" — three senses, only one dead

| Sense | Status | Say instead / notes |
|---|---|---|
| The old player-ability data layer (`src/Skills/`, `Skill*` type family, skill trees, `skill.library.ts`) | **RETIRED** (PR #48; de-conflation rename) | `src/Cards/` and the `Card*` type family — cards are the actions played in combat |
| **Signature skills** (`SignatureSkill` family — token-activated abilities: Second Wind, signatures; the Befriend alt-win path; equipment-granted per the phase 18-23 signet epic) | **CANONICAL** | Keep calling them signature skills / signatures |
| AI-harness skills (`skills/` loop verbs, `.claude/skills/` design skills) | out of scope | Harness vocabulary, not game vocabulary — the registry never flags it |

## Other load-bearing canon (quick disambiguation)

- **Hazard-Pattern Combat** is the ONLY combat engine (witness:
  `simulateHazardPatternCombat`). The legacy turn-based
  `resolveCombatRound` and the Pressure Tracks win model are gone
  (2026-06-22).
- **THE STRIKE IS DEAD** (spec 32 v3, 2026-07-08): no raw HP damage
  exists at the schema level. `basePower` / `chipHp` are retired words
  except when describing their removal.
- **tier vs rank — never conflate:** `tier` (1-3) is the RESIST axis;
  `rank` (1-6: Ash/Tooth/Splinter/Rib/Skull/Saint — spec 34 R-14, was
  Doxa/Lemma/Thesis/Theorem/Axiom/Aporia) is the QUALITY axis; rarity
  derives from rank.
- **Equipment (post-phase-18):** 5 pieces across 3 slot kinds — 1
  weapon, 1 armor, 3 accessories (`AccessoryKind`: head / hands / feet
  / amulet / ring / charm). The 7-slot model and (per the phase 19-23
  epic, as it ships) the procedural modifier/rarity/affix machinery are
  legacy.
- Authority for meaning disputes: `docs/source-of-truth-hierarchy.md`
  (specs and ADRs outrank docs; docs outrank memory).

## How the enforcement works

- `node scripts/check-lexicon.mjs` scans live prose surfaces
  (root + package `AGENTS.md` / `CLAUDE.md` / `VISION.md` / READMEs,
  `docs/`, `plan/bearings.md`, `skills/`, `.claude/` prompts) for every
  `retired[].pattern`.
- **Exempt by zone** (dated records, allowed to speak in period terms):
  `CHANGELOG.md`, `RELEASES.md`, `braindump/`, `devlog/`, `plan/`
  (except `bearings.md`), `docs/reports/`, `docs/adr/`, `automation/`,
  `specs/`, and the synced `kb/`.
- **Exempt by banner:** a file whose head carries
  `**Status:** HISTORICAL` is a point-in-time record — stamp dated
  audits/handoffs with it instead of rewriting them.
- **Exempt by pragma:** a file that must legitimately mention a retired
  term (usually to say it was removed) carries
  `<!-- lexicon-ok: base-power, chip-hp -->` once, using the registry
  `id`s.

## How to retire a concept (the whole procedure)

1. Add a row to `lexicon.json` (`id`, `pattern`, `replacement`,
   `since`). Precision beats breadth — pattern the *retired* phrasing,
   not a common word (see "skill" above for why).
2. Run `node scripts/check-lexicon.mjs`. Every flag is either real rot
   (fix the prose), a dated record (add the HISTORICAL banner), or a
   legitimate removal-mention (add the pragma).
3. Update this file's tables if the term is load-bearing.
4. Commit. CI now guards the term forever — a march tick, a tuning PR,
   or a 2am edit that reintroduces it goes red with the file, line, and
   replacement named.
