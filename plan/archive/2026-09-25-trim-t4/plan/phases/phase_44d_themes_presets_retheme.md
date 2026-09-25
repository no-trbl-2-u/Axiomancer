# Phase 44d — Themes + presets retheme

> Agent-facing brief. **The row's remaining scope is already fully shipped.**
> Spec 34 §5.1.5 already corrected the row's premise ("10 theme names") to "6
> archetypes + curse, not 10 themes." This brief goes one step further: every
> one of the four things the (corrected) row still names — theme display
> names, preset deck names, `card-themes.ts` `THEME_KEYWORDS`, and the shape
> pins in `curated-library.engine.test.ts` — was already landed as a side
> effect of prior work. There is no code left to write. This phase ships as a
> **verification pass**: prove the DoD, tick the row.

## Inputs (read in this order)

1. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` §5.1.5 (archetype
   + preset names RATIFIED as shipped, `THEME_KEYWORDS` is 44d's only real
   work), §5.1.6 (preset names ratified), §5.2 / §5.2.1 (R-1/R-4/R-6 — the
   renames `THEME_KEYWORDS` needed).
2. `plan/phases/phase_44b_keyword_registry_retheme.md` — shipped commit
   `04c75d22` already renamed `THEME_KEYWORDS`'s `PREMISE`/`SWAY`/`RAPPORT`
   entries to `CHARGE`/`PLEA`/`QUARTER` (`git log -- axiomancer-mechanics/src/Cards/card-themes.ts`
   shows `04c75d22` touching exactly this file, 10 lines).
3. `plan/phases/phase_44c_card_library_retheme.md` — shipped the rank ladder,
   card types (`oath`/`hex`), and HAUNT class that
   `curated-library.engine.test.ts`'s shape pins already assert against.
4. `axiomancer-mechanics/src/Cards/card-themes.ts` — current state: `CardTheme`
   is the six archetypes + `curse`; `THEME_KEYWORDS` reads `CHARGE` (trial),
   `PLEA`/`QUARTER` (choir) — the target state, not the stale one.
5. `axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts` — preset
   names are already `"The Threadbare Office"` / `"The Pilgrim's Burden"` /
   `"The Apostate's Canon"` (§5.1.6 ratified-as-shipped list, verbatim).
6. `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts` — the
   shape-contract suite already asserts the six-archetype, 57-card, oath/hex
   shape (`ARCHETYPES = ['rot', 'debt', 'grave', 'vigil', 'trial', 'choir']`,
   no old theme names, no old rank words). 20/20 green.

## What was checked and found already-shipped

- **Theme display names** — `rot` the Blight, `debt` the Reckoning, `grave`
  the Exhumation, `vigil` the Cold Watch, `trial` the Indictment, `choir` the
  Pale Choir, plus `curse`. Matches §5.1.5 verbatim. Shipped by the Profane
  Canon rewrite (`84ef85bd`, 2026-08-08).
- **Preset deck names** — Threadbare / Pilgrim / Apostate, matches §5.1.6
  verbatim. Same commit.
- **`card-themes.ts` `THEME_KEYWORDS`** — `git grep -n "'PREMISE'\|'SWAY'\|'RAPPORT'"`
  across `axiomancer-mechanics/src` and `axiomancer-mobile` returns zero hits.
  `trial` reads `['CHARGE', 'STAGGER', 'BACKFIRE', 'MARK', 'DOOM']`; `choir`
  reads `['PLEA', 'QUARTER', 'SOUL', 'REAP', 'DOOM', 'HEAL', 'CLEANSE', 'KINDLE']`.
  Landed in `04c75d22` (phase 44b), which also fixed the mirror table
  `axiomancer-mobile/state/combat/keywords.ts`'s `ARCHETYPE_KEYWORDS` (the
  hidden reward-skew table shares the same three renames; verified clean).
- **Shape pins in `curated-library.engine.test.ts`** — already asserts the
  six-archetype / 57-card / oath+hex shape; zero references to the old
  ten-theme names or old rank words. 20/20 tests green
  (`npx vitest run src/Cards/e2e/curated-library.engine.test.ts`).
- **`docs/lexicon.json` / `scripts/check-lexicon.mjs`** — already green
  (236 live files clean against 22 retired terms) — the R-1/R-4/R-6 rows
  landed with 44b.

## Decisions made upfront — DO NOT ASK

- **No code changes ship in this phase.** Every item the (spec-corrected)
  row names was already delivered by `84ef85bd` (Profane Canon rewrite) and
  `04c75d22` (phase 44b). Re-doing that work would be pure churn (charter
  §0.3) and risks fighting already-green tests. This mirrors 44c's own
  finding pattern (§5.9.1: "much smaller than its row believes") taken to
  its logical end — zero remaining surface, not a smaller surface.
- **`ARCHETYPE_KEYWORDS`'s stale doc comment** (`axiomancer-mobile/state/combat/keywords.ts:260`,
  "Re-cut over the 10 v3 themes") is a comment-only nit, not a rename the row
  or spec §5.2.1 requires — the *values* are already correct, only the
  comment's theme-count callout is stale. Out of scope: 44i ("product shell +
  docs — documents what 44a-44h did") is the phase that sweeps prose/comment
  currency, not this one. Noted under Follow-ups instead of hand-editing here
  to keep this phase's diff at zero, matching its actual (zero) scope.
- **This phase still gets its own commit and row tick**, not a silent merge
  into 44b/44c's history, because: (a) the build plan and the phase-mirror
  GitHub issue both expect a discrete Phase 44d artifact on the timeline: b)
  a future auditor re-reading `01_build_plan.md` needs the row's `[x]` to
  carry a citation to *why* there's no diff, not just a bare checkmark that
  looks like the work was silently skipped.

## Prove (DoD)

```bash
# Theme keyword renames — zero old-word hits
git grep -n "'PREMISE'\|'SWAY'\|'RAPPORT'" -- axiomancer-mechanics/src axiomancer-mobile
# → no output (exit 1, grep convention for "no matches")

# Shape-contract suite green
cd axiomancer-mechanics && npx vitest run src/Cards/e2e/curated-library.engine.test.ts
# → 20/20 passed

# Lexicon guard green
node scripts/check-lexicon.mjs
# → clean

# Preset + theme display names match spec verbatim
git grep -n "The Threadbare Office\|The Pilgrim's Burden\|The Apostate's Canon" -- axiomancer-mechanics/src/Combat/combat.starter-deck-presets.ts
```

- Flip Phase 44d's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append the
  commit hash, and note inline that the phase shipped as a verification pass
  with no code diff (citing this brief).

## Follow-ups (out of scope this phase)

- `axiomancer-mobile/state/combat/keywords.ts:260`'s stale "10 v3 themes"
  doc comment — cosmetic, roll into 44i's docs sweep.
- Phase 44e — enemy retheme (The Incompleteness → The Unfinished; §5.7).
- Phase 44f — world/map/minigame naming (§5.8).
- Phase 44g — characters/story/quests (hand-authored prose).
- Phase 44h — MORALE → GRACE, alignment cube → THE OATHS (§6).
- Phase 44i — product shell + docs (last; also where the stale
  `ARCHETYPE_KEYWORDS` comment and `CLAUDE.md`'s "10 theme presets" doctrine
  line should get swept, since both are prose currency, not renames).
