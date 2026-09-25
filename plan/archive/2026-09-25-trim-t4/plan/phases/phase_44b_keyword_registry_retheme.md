# Phase 44b — Keyword registry + glossary retheme

> Agent-facing brief. First consumer of the Phase 44a map + codemod. Renames
> the 12 pairs `docs/retheme-map.json` tags `"applies": "44b"` — display text
> and glossary registries only, across `axiomancer-mechanics`,
> `axiomancer-mobile`, and `axiomancer-card-editor`. No engine behavior
> changes; no persisted-state field renames; no `GAME_STATE_VERSION` bump.

## Inputs (read in this order)

1. `docs/retheme-map.json` — filter to `"applies": "44b"` (10 `displayNames`
   entries + 2 `ids` entries — see Scope below). This is the literal spec for
   this phase; do not re-derive from `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md`
   directly except to resolve ambiguity.
2. `plan/phases/phase_44a_rename_infrastructure.md` — the tooling this phase
   consumes (`scripts/apply-retheme-map.mjs`, `scripts/check-naming-law.mjs`).
3. `axiomancer-mobile/state/combat/keywords.ts` — `KEYWORD_GLOSS` (42 rows),
   `SYSTEM_GLOSSARY` (8 rows), `MECHANIC_KEYWORD`, `EFFECT_KEYWORD`,
   `SUPPORT_KEYWORD`, `ARCHETYPE_KEYWORDS`, `SYSTEM_TERM_MATCH`,
   `SYSTEM_TERM_COVERED_BY` — the mobile presentation layer and the closest
   thing to a single glossary source of truth.
4. `axiomancer-mechanics/docs/lexicon.json` + `scripts/check-lexicon.mjs` —
   the retirement-guard this phase adds rows to (44a explicitly deferred this;
   see that brief's "Decisions made upfront").

## Scope — the 12 pairs

Keyword (`KEYWORD_GLOSS` + card-print templates):

- PREMISE → CHARGE (R-1)
- PERORATION → SENTENCE (R-2)
- CONCEDE → CONDEMN (R-3)
- SWAY → PLEA (R-4)
- CAPITULATE → RELENT (R-5)
- RAPPORT → QUARTER (R-6)
- REARGUE → CURDLE (R-7)

Die-face (`SYSTEM_GLOSSARY`):

- SPECIAL → BOON (R-8) — **the die-face payload word only**, scoped to
  die/gear-adjacent files. Not a blind repo sweep of "special."

System-term (`SYSTEM_GLOSSARY`):

- RESONANCE → TOLL (R-11, glyph ⬡)
- FLOATING → GHOST (R-12, glyph ✦)

Effect id (exact identifier rename, safe — session-only state):

- `debuff_rapport` → `debuff_quarter`
- `buff_open_minded` → `buff_absolved`

## Decisions made upfront — DO NOT ASK

- **No persisted field renames.** `Character.floatingDice`,
  `CombatManaDie.floating`, `FLOATING_DICE_CAP`, `materializeFloatingDice`,
  `getFloatingDiceColors`, `Character` die-gear's `specialFaces` /
  `dieSpecialCap`, `CombatEncounterState.sway` / `premises` /
  `premiseMilestoneTotal` / `peroration` / `resonance` /
  `capitulationChoiceActive` / `capitulationDeclined`, the `CombatOutcome`
  union members `'concede'` / `'capitulate'`, `Cards/types.ts`'s lowercase
  `kind` literals (`'premise'`, `'sway'`, `'peroration'`, `'convert_dots'`),
  and the card id `resonance-detonation` are all **internal engine
  identifiers, not display text** — none are renamed. This follows the
  repo's own precedent (R-14: `CardRank` stays numeric, display-only;
  §5.6: `moralMeter` field doesn't rename). Consequence: **no
  `GAME_STATE_VERSION` bump** — combat state is session-only and never
  persisted anyway (confirmed: `CombatEncounterState` is absent from
  `GameState` / `game.migrate.ts` / mobile `state/persistence/`), and the
  one genuinely-persisted field in this pair's blast radius
  (`Character.floatingDice`) is explicitly excluded from the codemod glob.
- **Internal constant/comment identifiers not listed in the map's `ids`
  array stay as-is.** E.g. `CONCEDE_PREMISES_ELITE` / `CONCEDE_PREMISES_BOSS`
  (`Combat/effects.ts`) are pure internal budget constants, never
  player-facing — out of scope. Only the two named effect ids
  (`debuff_rapport`, `buff_open_minded`) get identifier-level renames; the
  map's silence on everything else is deliberate, not an oversight.
- **The codemod's case-sensitive, whole-word regex is the scoping
  mechanism** — every "old" value in the map is the exact uppercase
  registry word, so it naturally skips lowercase field names
  (`floatingDice`, `sway`, `capitulate` union members) and non-boundary
  substrings (`PREMISES` plural does not match `\bPREMISE\b`). Two
  known gaps the codemod cannot close, fixed by hand after running it:
  1. **Plural / inflected forms** in card-print templates and
     `paidSummary` strings (e.g. "spend all PREMISES" in
     `cards.library.ts`) — grep each pair's stem across
     `combat.cards.ts` and `cards.library.ts` after the codemod run and
     fix any surviving inflected form by hand.
  2. **Lowercase mixed-case UI prose** — e.g. `CardForm.tsx`'s hint
     string `"decays 1/turn · ≥ enemy VITAE = capitulate"` — fix by hand.
- **Card-editor and DevLog catalog are in scope.** `axiomancer-card-editor`
  reads/writes `cards.library.ts` in place (its own gate runs), and its
  `wx.ts` glossary + `CardForm.tsx` UI labels duplicate the mobile
  glossary and must move together. `scripts/build-catalog.mjs` carries its
  own duplicate `KEYWORD_WORDS` + `GLYPH_SHAPES` tables (its header comment
  says to keep these in sync with `axiomancer-mobile/components/combat/glyphShapes.ts`)
  — update the source table, then regenerate via `npm run catalog`
  (`devlog/data/*.json`, `devlog/catalog.html` are generated artifacts —
  never hand-edit).
- **`axiomancer-mechanics/docs/keyword-atlas.md`** is a live, unzoned
  reference doc — update its PREMISE/SWAY/RAPPORT/etc. rows in the same
  commit so it doesn't immediately drift from the registry it documents.
- **`lexicon.json` rows added this phase:** the 7 keyword pairs plus
  SPECIAL, RESONANCE, FLOATING (10 total display-word retirements this
  phase actually performs). PERORATION's pattern only needs to guard the
  bare word since it was already demoted out of `KEYWORD_GLOSS` in phase 29.
  ENCHANTMENT/DISENCHANT/THOUGHTFORM/rank-ladder/MORALE (the other 5 of
  spec 34 §5.2's "fifteen") are 44c/44h's own rows, not this phase's — each
  phase registers only the terms it actually retires, per the phase 44a
  precedent (`base-power`, `chip-hp`, `pressure-tracks`, `src-skills-path`
  rows were each added by the commit that did the retiring).
- **RESONANCE/FLOATING/SPECIAL lexicon patterns must be scoped, not bare
  words** — `\bSPECIAL\b` or `\bFLOATING\b` unscoped would false-positive on
  ordinary English prose across `plan/`, `devlog/`, design docs. Use a
  pattern anchored to the glyph or a keyword-adjacent phrase (mirroring
  `SYSTEM_TERM_MATCH`'s own `/\bfloating\b/i` card-text-only usage), e.g.
  `FLOATING\s*✦` / `RESONANCE\s*⬡` / `\bSPECIAL face\b`. Test each pattern
  against `plan/bearings.md` before committing (that file is NOT zoned by
  `check-lexicon.mjs`) to confirm zero false positives there.

## Codemod invocation (Step 4 starting point, not the whole job)

```bash
node scripts/apply-retheme-map.mjs --applies=44b --write \
  axiomancer-mechanics/src/Cards/types.ts \
  axiomancer-mechanics/src/Cards/cards.library.ts \
  axiomancer-mechanics/src/Cards/combat.card-complexity.ts \
  axiomancer-mechanics/src/Combat \
  axiomancer-mechanics/src/Effects \
  axiomancer-mechanics/src/Game \
  axiomancer-mechanics/src/test-utils/retired-verb-cards.ts \
  axiomancer-mobile/state/combat/keywords.ts \
  axiomancer-mobile/state/combat/card-themes.ts \
  axiomancer-mobile/components/combat/glyphShapes.ts \
  axiomancer-mobile/components/combat/statusGlyphs.ts \
  axiomancer-mobile/state/presenters \
  axiomancer-card-editor/src/theme/wx.ts \
  axiomancer-card-editor/src/components/CardForm.tsx \
  scripts/build-catalog.mjs
```

(Explicit files/dirs only — the codemod doesn't do real glob expansion.
Add/remove paths as the actual tree dictates; this list is a starting
point from the research pass, not gospel — verify each path exists first.)
Review the whole diff by hand afterward; this is mechanical, not semantic.

## Prove (DoD)

- `node scripts/apply-retheme-map.mjs --applies=44b --write <scoped paths>`
  run and diff reviewed; plural/mixed-case stragglers fixed by hand per the
  Decisions section.
- `git grep` for each of the 7 old keyword words + SPECIAL + RESONANCE +
  FLOATING (case-sensitive, word-boundary) across `axiomancer-mechanics/src`,
  `axiomancer-mobile`, `axiomancer-card-editor/src` returns zero hits
  outside the explicitly-excluded internal-identifier list above.
- `git grep debuff_rapport buff_open_minded` returns zero hits repo-wide
  (all sites — including `devlog/data/effects.json` via regen, not hand
  edit — moved to the new ids).
- `npm run catalog` regenerates `devlog/data/*.json` + `devlog/catalog.html`
  cleanly after `build-catalog.mjs`'s tables are updated.
- `axiomancer-mechanics/docs/lexicon.json` has the 10 new rows;
  `node scripts/check-lexicon.mjs` is green.
- `npm run verify` green at the root (mechanics + mobile + card-editor).
- `node --test scripts/check-naming-law.test.mjs` still green (unaffected,
  sanity check only).
- No `GAME_STATE_VERSION` bump; no `axiomancer-mechanics/src/Game/game.migrate.ts`
  change.
- Flip Phase 44b's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash.

## Follow-ups (out of scope this phase)

- Phase 44c — card library retheme (OATH/HEX/HAUNT card-types, rank
  ladder, signature-skill display names, `tf-`→`ht-` id prefix).
- Phase 44e — enemy retheme (The Incompleteness → The Unfinished).
- Phase 44f — world/map naming (rest-node offers — gated on 52e).
- Phase 44h — MORALE → GRACE copy canon.
