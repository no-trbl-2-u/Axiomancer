# TRIM THE FAT — audit findings and cut plan

> Step 1 of THE REFACTOR STRATEGY
> (`plan/2026-09-25-refactor-strategy.decisions.md`, D1/D3). Attended
> session 2026-09-25. Four read-only audits ran in parallel over the
> engine, the mobile app, the docs, and `plan/` memory. This file is the
> keep/cut list they produced, ranked into tiers, plus the sequencing to
> ship it. Nothing here has been deleted yet. Owner decisions are listed
> in §5 and must be answered before Tier 3 starts.

## 0. Headline

**The stat system is decorative.** The combat engine reads no character
stat. Card damage is the printed number scaled by the read, colour
match, WRATH, CHAIN, FLAY, EXECUTE and enemy HIDE
(`src/Combat/combat.engine.ts:1428`). GUARD is the printed number plus
pips. The card engine's `calculateCardDamage` returns 0 unconditionally.
The only stat effect in play is the *sum* of body + heart + mind, which
sets max VITAE at 50 + sum × 8; `calculateMaxHealth` voids `level`. Which
stat the player raises makes no difference. Meanwhile player level
*does* raise enemy VITAE, threat damage and HIDE cap, so levelling buys
+24 VITAE against enemies that scale harder.

This is the finding that decides item 3 of the strategy (damage scaling
by level/stats): there is nothing to "scale". The hook has to be built,
and the six derived attack/defence stats, luck, and the six non-combat
stats shown in the character screen are display-only numbers that lie
to the player.

## 1. Scope and method

| Area | Method | Evidence file (session scratchpad) |
|---|---|---|
| Engine (`axiomancer-mechanics/src`) | consumer counts per export, reachability from the game loop, mobile grep by exported name | audit-engine.md |
| Mobile (`axiomancer-mobile`) | import graph over 748 files from `index.ts`; second pass stopping at dev nodes | audit-mobile.md |
| Docs (everything but `plan/`) | refs by basename/path, status banners, dead-identifier check against `src` | audit-docs.md |
| `plan/` | size by type, phase status vs build plan, Pending-row age, bearings line classification | audit-plan.md |

Caveat: the clone is shallow (history from 2026-09-21), so "last commit"
dates were unusable; dates inside the files were used instead.

## 2. Totals

| Class | Amount | Risk |
|---|---|---|
| Unreferenced binaries in git | ~95 MB | none (delete) |
| Engine dead code (test-only or zero callers) | ~3,600 LOC + their tests | none |
| Mobile orphans + dead dev paths | ~1,600 LOC + ~1,700 test LOC | none |
| Superseded docs / specs / reports | ~90 files | none (archive or delete) |
| `plan/` lines read every tick that record finished work | ~16,800 lines | none (compact) |
| Owner-decision blocks (Labyrinth, card upgrades, GLYPHS, dice flag, stats) | ~4,500 LOC + 884 K art | design |

## 3. Tiers

### Tier 0 — fix, do not trim (bugs the audit surfaced)

These are not fat. They are wrong and cheap to fix, and two of them
change what the player is told.

1. **Character screen shows dead stats.** physical/mental/emotional
   attack and defence, luck, and the six non-combat stats are rendered
   (`state/presenters/character.engine.ts:279,290,455`,
   `levelup.engine.ts:60`, `CombatEncounterPanel.tsx:1382`) but nothing
   reads them. Remove the rows with the engine cut in Tier 1.
2. **Eleven consumables are no-ops.** Player `rollModifier` is never
   read; `advantageGrants` is read only under the dice flag OFF, and
   mobile forces it ON. focus-vial, hunters-elixir, heart-draught,
   berserker-brew, quicksilver-vial, war-horn-draught, philosopher-tea,
   void-essence, whetstone-oil, resonance-crystal, greater-resonance-
   crystal. Cut or rewire; do not leave them in shops.
3. **Threat-clock EMPOWER / CURSE enchants do nothing** but emit a
   visible event (`combat.engine.ts:4893-4918`).
4. **Relic max-HP bonus is lost on stat allocation and level-up**
   (`Character/index.ts:146`, `Game/game.reducer.ts:211` rebuild from
   `calculateMaxHealth` alone; only the save migration re-adds it).
5. **Tier-2 buffs carry a hidden d20**: 5 % fizzle, 5 % double
   (`Cards/resist.ts:59-88` via `executeCard`). Either surface it or
   remove it.
6. **Cold-start Continue with a live encounter routes to the dev
   sandbox** (`/combat-encounter`, mock foe, `persistOutcome=false`) via
   `selectActiveTab` (`app/index.tsx:42,52`, `app/saves/index.tsx:62`).
7. **Dead route mapping** `quest` in `lib/platform/router.ts:61,101`.
8. **Stale headers** in `app/event/index.tsx` ("fallback shell nothing
   routes to" — gathering routes here) and the STRIFE comment in
   `app/(tabs)/_layout.tsx`.

### Tier 1 — delete, zero gameplay risk

Ship as one phase per package. Each PR runs the package verify gate and
the cross-package checklist (AGENTS.md); the deleted modules' tests go
with them.

**Engine (~3,600 LOC)**

| Block | LOC | Why it is dead |
|---|---|---|
| Legacy d20 pipeline: `combat-effects.ts` (+json), `damage.ts`, `damage-resist.ts`, `advantage.ts`, `dice.ts`, `stats.ts`, `difficulty.ts`, `getEffectiveStats`, `calculateCardDamage` | ~780 | only the barrel and tests import them; the round driver that called them was removed 2026-06 |
| `procUnlocks` / `procOverrides` data (Character + ~51 enemy blocks), `tier1Overrides` (80 entries) + `applyTier1CombatEffect` / `clearTier1EffectsForStance` | ~300 | the proc roller and the stance-effect system have no caller |
| Derived stats (6 attack/defence keys), `luck`, `nonCombatStats`, `STAT_/DEFENSE_/PASSIVE_DEFENSE_MULTIPLIERS`, relic stat lines, effect `statModifiers`, `recomputeDerivedStats` path in the equipment reducer | ~250 | display-only; see §0. Swap the `isCharacter` discriminator off `nonCombatStats` first |
| Test-only modules: `Hazard/audit` (648), `minigame-harness` (200), `map.dispatcher` (161), `combat.autoplay` (157), `combat.curve-shape` (152), `Effects/world-tick` (122), Phase-135 route helpers in `world.reducer` (~80), 5 unused interaction helpers (~60) | ~1,580 | zero non-test importers; comments say "no engine caller today" |
| Dead synergy code: extended predicate family (~250), Phase-66 branch in `executeCard` (~75) | ~325 | all 29 library synergies carry `statePredicate`, so the branch never runs |
| Faction (`src/Faction`, store wiring, enemy `factionDeltas`) | ~230 | write-only; `getFactionReputation` has zero consumers outside the dev inspector |
| Moral-meter enemy scaling (`difficulty.ts` + reducer hook) | ~90 | uniform scaling never changes the argmax stance; provably a no-op |
| `resist.ts` → keep a ~15-line version | ~100 | heart/equipment params unused |
| `@deprecated` `resolveCardDieCost`, `cardDieCostPreview`; ~198 barrel exports with no consumer anywhere | — | already marked for removal |

**Mobile (~1,600 LOC + ~1,700 test LOC)**

| Block | LOC | Why |
|---|---|---|
| 11 orphan components: `exploration/OptionsList`, `exploration/OptionRow`, `art/TitleEmblem`, `event/enemy-art/EnemyPortrait`, `TornPanel`, `art/PlayerPortrait`, `event/EventCodexHeader`, `FriendshipMeter`, `CodexStatusStrip`, `DifficultyBadge`, `MindMark` | 1,042 | zero non-test importers |
| 5 orphan presenters: `combat-hud.engine`, `presenters/constants`, `onboarding.engine`, `engine-events.engine`, `event.codex.engine` | ~230 | zero screen or component importers |
| `devOverrides` store slice + `DebugHudOverrides` (no-op) + `DebugCombatDeck` (superseded by the Deck tab) | ~210 | dead path |
| `lib/quarantine/*.bak`, `lib/juice/transitions.ts`, `scripts/playtest-serve.mjs`, `reference-images/` | ~100 + 100 K | zero refs |
| Historical screenshots: `combat-polish-2026-07`, `playthrough-2026-09-13`, `playthrough-0.32`, `52d-*.png` | 5.5 MB | zero refs |
| Committed e2e output: `screenshots/upgradeable-dice-e2e`, `screenshots/combat-redesign` → remove from git, gitignore like `hazard-e2e/` | 1.9 MB | build output |

**Binaries and data outside `plan/` (~40 MB)**

| Item | Size | Why |
|---|---|---|
| `Potential Assets/icons-BBR/` | 18 MB | 4,181 files, zero refs; `icons-TBR` is the real source |
| `axiomancer-mechanics/docs/reports/rebaseline-scratch/` | 13 MB | 155 raw sim dumps from 2026-07-11 |
| `tmp-images/walls/` | 7.1 MB | PNG originals; the WebPs shipped without them (licence caveat: confirm no obligation to keep originals) |
| `axiomancer-mechanics/docs/reports/preset-metrics/`, `swap-pool-estimates-2026-07-18.json` | 1.1 MB | pre-BIG-NUMBERS sweep data |
| `axiomancer-mechanics/scratch/price-experiment/` | 248 K | not in tsconfig or vitest |
| `Potential Assets/xml-example.xml` | 4 K | unrelated printing-order file |

**Docs that describe removed or never-built code (delete)**

- Specs: 02 combat-round-resolver, 03 effect procs, 05/05b/05c/05d/05e
  equipment, 07 enemy AI, 15 difficulty curve, 26 catalyst, 27 salvage,
  29, 30.
- Mechanics docs: `effects/` (41 files), `items.md`, `quickstart-items.md`,
  `quickstart-world.md`, `tuning.md`,
  `hazard-pattern-combat-reconciliation-gaps.md`,
  `hazard-v2-vs-mechanics-divergence.md` (both packages),
  `mtg-mechanics-reference.md`, `encounters/{rest,quest-board,gathering}.md`
  (both packages), `references/{all-fallacies,all-paradoxes,pantheon,
  code-references/inquierer}`, `prompts/onboarding-interview` (one copy),
  `RELEASES.md`, `axiomancer-mechanics/spec.md` (pointer, zero readers).
- Mobile: `design-spec.md`, `docs/mechanics-ui-audit-2026-05-22-*` (5),
  `docs/claude-design-prompt-2026-05-16.md`,
  `docs/engine-map-reconciliation-2026-05-24.md`, mobile copies of the
  three hazard docs, `docs/reports/CARD_WORDING_AUDIT.md`,
  `design/{combat-ux-overhaul,combat-ux-overhaul-prompt,aftermath-modals-prompt.txt,levelup-modal-prompt.txt,2026-07-02-ideas.html}`.
- Braindumps for systems built then retired (rarity/sets, quest-board,
  lockpicking); `content/characters/README.md`,
  `content/locations/README.md` (scaffolding for folders never created).
- `.claude/agents/mechanics-expert.md` (teaches the retired philosophy
  theme and stance procs; one spawn ever). Rewrite or delete.

### Tier 2 — archive or compact (`plan/` and dated docs)

`plan/` is 54 MB; 91 % is images. The markdown that the loop reads every
tick carries ~16,800 lines of finished work.

| Item | Action | Size |
|---|---|---|
| `plan/labyrinth/reference/maze-images/` | **delete** (owner decision §5.5: licensing; unreferenced; `prologue.png` duplicates `prologue.jpg`) | 45 MB |
| `plan/ideas/COMBAT_SYSTEM_FOUNDATIONAL_REDESIGN_VISUAL.png` | delete (render of the .html beside it) | 3.1 MB |
| `plan/CONTENT_LEDGER.md` | compact: keep the 5-row table (lines 10-18); rotate the 94 pass logs to `plan/archive/`; add a rotation rule to the adjust-* skills | 7,150 lines |
| `plan/AUDIT.md` | move 74 resolved rows out of Pending; drop the 417-line pass narrative; triage ~22 open rows naming retired systems | ~2,940 lines |
| `plan/PHASE_CANDIDATES.md` | drop 532-line banner header; move 32 struck rows and Promoted/Considered to archive; reject ~20 candidates naming retired systems | ~2,370 lines |
| `plan/steps/01_build_plan.md` | shipped rows to one line + commit hash | ~2,500 lines |
| `plan/CRITIQUE.md` | move 36 `[x]` rows out of Pending; collapse 33 pass banners | ~1,900 lines |
| `plan/bearings.md` | remove ~200 lines of history inside "Decisions standing"; fix three contradictions (CQI at ~714, count pins at ~403, Expo "scheduled" at 81-104); refresh repo-shape | ~240 lines |
| `plan/phases/` | archive 131 shipped briefs except the last 3; keep 7 partial + template + V masterplan | 1.7 MB |
| `plan/tuning/`, `plan/cleanup/`, `plan/ideas/` (combat-redesign set) | archive (update `skills/oversight.md:63` grep path and `deck-tuning.md` refs) | 0.9 MB |
| 11 executed one-off prompts at `plan/` root (big-numbers survey, card-authoring brief, content-pitches, roadmap brainstorm, ui-fresh-eyes ×2, work-audit, story-outline, burn-day audit, devlog-site-design, HANDOFF dice-law, naming-session) | archive; repoint `bearings:29,37,658,671` | ~700 K |
| `plan/CURRENT-STATE.md` | archive (2026-07-03 snapshot posing as current) | — |
| Docs: `CHANGELOG.md` (frozen 07-05), specs 01/06/08-12/14/23/25/28/31/32/35, `effects.md`, `enemy.md`, `combat-audit-2026-07-05.md`, `profane-canon.md`, July tuning reports, `new-north-star.prompt.md`, mobile `specs/`, `design/handoff-*` (2.4 MB), UI_FRESH_EYES candidates/ledger | archive with HISTORICAL banner | ~4 MB |
| Cross-package duplicates: source-of-truth hierarchy ×5, hazard docs ×3, `hermes-playtest` vs `deep-playtest` | merge to one copy | — |

Compaction of Pending sections is explicitly outside `/consolidate`'s
mandate (its 2026-09-02 log passed the question to `/oversight`). This
spec is that ruling once §5.6 is answered.

### Tier 3 — owner decisions (wire it or cut it; never trim quietly)

| Block | Size | State | Options |
|---|---|---|---|
| Stat model (body/mind/heart, allocation) | small LOC, large design | three stats with one identical effect | (a) merge into one VITAE point, (b) give each a real combat hook that item 3 (damage scaling) plugs into |
| Labyrinth / Aporia | 2,358 engine + 554 CLI + 2,454 mobile + 884 K art | reachable only from a dev button and the CLI; no map event enters it; acts docs are normative | park (keep, unreachable), wire an entry, or cut |
| Card upgrades (`card-upgrades.ts`) | 540 | owner-ruled axis 2026-09-02; nothing grants a `+` card except the stage-profile sim | wire a grant path or cut |
| GLYPHS pilot | ~250 engine + 4 mobile files | zero library cards carry glyphs; sandbox set only | promote or cut |
| Upgradeable-Dice flag | ~450 engine LOC legacy path + sim branches + mobile legacy UI | mobile forces ON; engine default OFF so tests/sims exercise the retired model | collapse the flag (recommended); many tests pin OFF |
| "Codex" aesthetic (aesthetic-mode, AestheticDevToggle, ExplorationCodexHeader, exploration.codex.engine) | ~350 | dev-toggle only; changes one header | cut or finish |
| 14 manual-only Debug* tools | ~870 | no CI testID use | keep, or cut all but the 9 CI-driven ones |
| 8 tuning/playtest commands with 0 invocations in 6 weeks (deck-tuning, hazard-tuning, world-tuning, combat-ux-tuning, critic-loop, deep-playtest, hermes-playtest, dep-upgrades) | ~2,700 lines | wired to manual workflows; deck-tuning still teaches CQI | keep + fix doctrine, or retire the overlapping five playtest loops to one |
| `docs/references/Mork-Borg.md` (2,154-line rulebook transcription, 0 refs) and `plan/labyrinth/reference/maze-*` | 68 K / 45.6 MB | copyright exposure | delete |
| Unused platform icon exports (`assets/images/ios` 772 K, `web` 304 K, `android/play_store_512`, legacy `ic_launcher`) | 1.3 MB | no native ios/ dir; Expo generates icons | delete after confirming store submission needs none |
| `bankedSouls`, `bonusTurnDice` / `dieUpgradeLevel` | tiny | display-only / sim-only | wire or cut |

## 4. Sequencing

Order chosen so every step leaves CI green and each PR is reviewable.

| Step | Phase | Gate |
|---|---|---|
| T1 | Binaries + dead docs (Tier 1 rows 3-4, Tier 2 image rows) | `npm run verify` root; `check-lexicon`; `site:public` still builds |
| T2 | Engine dead code (Tier 1 engine table) + Tier 0 items 1, 2, 3, 4, 5 — split per D13 into T2a (this row) and T2b (D7 flag collapse) | `verify -w axiomancer-mechanics`, `verify -w axiomancer-mobile`, `type-check -w axiomancer-card-editor`; `baseline:check` re-stamped |
| T3 | Mobile orphans + Tier 0 items 6, 7, 8 | `verify -w axiomancer-mobile`, `verify:visual` |
| T4 | `plan/` compaction (Tier 2 markdown rows) | `check-lexicon`; every skill that greps a moved path updated in the same commit |
| T5 | Tier 3, one block per PR, after §5 is answered | per block |

T1 and T4 are independent of the story work and of each other. T2 is
the prerequisite for the damage-scaling hook (strategy item 3): the hook
should be built on a stat model that exists, not beside the dead one.

## 5. Owner decisions needed before T5

Answered 2026-09-25 (recorded as D4-D7 in the strategy decisions
file): 1 → real hooks per stat; 2 → wire an entry (Labyrinth leaves
every trim count); 4 → collapse the flag; 5 → deletion allowed for
binaries, raw output, vendored scans, e2e output. 3 → cut GLYPHS,
defer card upgrades (D8); 6 → move resolved rows in T4 (D9); 7 → retire
all eight commands (D10). Nothing open. The Tier 3 blocks outside §5 were
balloted in T5: Codex cut (D18), Debug\* tools kept (D19), die growth and
`bankedSouls` kept (D20). T1–T5 all merged 2026-09-25 (#369–#380).

1. **Stat model direction** (Tier 3 row 1). Recommendation: (b), real
   hooks, because item 3 of the strategy needs them anyway.
2. **Labyrinth**: park, wire, or cut. Recommendation: park, keep the
   acts docs, gate the dev button; revisit in the story-dependent revamp.
3. **Card upgrades and GLYPHS**: wire or cut. Recommendation: cut GLYPHS;
   decide card upgrades with the card rework (strategy item 3).
4. **Dice flag collapse**. Recommendation: collapse; the OFF model is
   retired in shipped play.
5. **Deletion policy for binaries and raw output.** Hard rule 4
   ("archive, don't delete, into plan/archive/") keeps bytes. Recommend
   an explicit exception for images, raw sim output, and vendored
   third-party scans; note a delete does not shrink git history.
6. **Resolved rows under Pending.** Rule that resolved rows move to
   Done/archive in T4 (this spec as the `/oversight` ruling).
7. **Tuning/playtest command set.** Keep all eight with doctrine fixes,
   or collapse the five overlapping playtest loops.

## 6. Guards

- `Potential Assets/icons-TBR` is the icon source pool (D11). It has no
  inbound references by design; never delete it as unreferenced.

- Never delete a file that `__tests__/store-submission.test.js`,
  `check-devlog-not-served.test`, `asset-provenance.test`, or
  `verify-mobile.yml` names (testing-guide, store-submission-checklist,
  art-catalog.json, devlog/README, store-assets).
- `devlog/` is a build input for the public site. Only `devlog/design/`
  is unused.
- `keyword-atlas.md`, `lexicon.json`, `retheme-map.json`,
  `reports/baselines/deck-matrix-baseline.json` are read by tooling.
- Moving anything under `plan/` that a skill greps (`oversight.md:63`,
  `deck-tuning.md`) updates the skill in the same commit.
- Provenance comments in `src/` that point at moved docs get repointed;
  they are comments, not imports, so lint will not catch them.

## 7. Load-bearing but stale (fix in place, never cut)

`specs/README.md` index (stops at 30; row 25 wrong), mechanics
`README.md` API table (42 dead identifiers, pitches the retired theme),
root `spec.md` scope lines (equipment rarity/affixes/sets, "specs 26-30
draft", ADR-0005 non-goal), `.claude/commands/deck-tuning.md` and
`combat-playtest.md` (CQI doctrine repealed 2026-09-02),
`docs/combat.md` early sections (legacy round model).
